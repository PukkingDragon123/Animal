# Tokonmon: Environments, Buildings & Arenas (reference study + design direction)

Reference notes for every location in **futuristic Osaka, 2050**, written for environment artists and
map builders. Read `docs/TOKONMON.md` §1 (art direction) and §9 (world) first; this file does not
change anything in the design bible. It only says what the real places look like and how to turn
them into **HD-2D side-scroll "stage sets"**, 3D dioramas with pixel-art textures shown from the
front like a restaurant cutaway.

Every scene has four parts: **(a) References**, **(b) Study notes**, **(c) Design direction**
(layer plan, props, signs, palette, lighting, zoom-in spots) and **(d) Do / Don't**.

---------------------------------------------------------------------------------------------------

## 0. Read me first

### 0.1 Research status and reference tags

- **[S]**: the reference came up in this session's web searches. Only the search-result summaries could
  be read, because page fetching and image downloads are blocked, so treat all visual facts as
  "described", not "seen".
- **[K]**: a well-known canonical reference listed from prior knowledge. Its URL was **not opened
  in this session**. Open it and check before using it as a basis for art.
- **(verify)** marks a fact that was not confirmed by a search in this session.
- **Coverage:** web searches covered **scenes 1–3 and the start of scene 4** (about 25 queries). After that,
  the session's shared web-search budget (200 calls per turn, shared by every agent) was used up.
  Notes for **scenes 4–10** come from established knowledge of the places and works. The owner's
  rule is that real references are studied before anything is made. So, **before final art for
  scenes 4–10 is signed off, run the follow-up search queue in §12** (or open the [K] links)
  and correct anything marked (verify).
- **Hex colours** are art targets built from material descriptions and typical photos. They are not
  sampled from photos. Neon colours reuse the `PROP_PAL` keys in `src/data/designs/props.js` so new
  art matches the existing prop kit (`nc #3ff0ff`, `nm #ff4ac8`, `ny #ffe45c`, `no #ff8a3c`,
  `nv #9d6bff`, `ng #5dff9a`, `nw #eafcff`, `nr #ff3b4f`).

### 0.2 The stage-set grammar (applies to every scene)

The camera looks at each location **from the front**, like a theatre stage or a cross-section
illustration (Japanese *danmenzu*, Stephen Biesty's *Cross-Sections*, Kairosoft's restaurant views).
Build every scene in five depth layers:

| Layer | Depth from camera | Contents | Parallax / treatment |
|---|---|---|---|
| **L0 Sky / backdrop** | infinite | gradient sky, clouds, sun/moon, city glow | ~0.05 parallax; painted, dithered bands |
| **L1 Far background** | 60 m+ | mountain ridges, skyline silhouettes, towers (2–3 planes) | 0.2–0.5 parallax; mix 30–60% toward the sky colour (atmospheric perspective); low detail |
| **L2 Mid background** | 8–25 m | **building facades / back walls**, facing the camera within about 10°; signs live here | full detail; busiest layer |
| **L3 Play strip** | 2–8 m | 3–6 m deep walkable floor (tap-to-walk), NPCs, props with footprints, arenas | sharp focus; readable silhouettes |
| **L4 Foreground** | 0–2 m | occluders: railings, branches, lanterns, counter edges, crowd heads | tilt-shift blur, dark and simple; dither-fade when in front of the player |

**Rules**
1. **A facade must read from the front.**
   - The **ground floor** says what the place is: shopfront, noren, sampuru case, shutter.
   - The **sign band** gives the name.
   - The **upper floors** add texture: windows, AC units, laundry, vertical signs.
   - The **roofline** adds silhouette: water tanks, antennas, billboards, solar panels, drone pads.
2. **Value structure:** L2 is the busy, contrasty layer. L0 and L1 are calm, with low contrast and few
   values. L4 is dark and simple. Characters on L3 must always have the strongest silhouette.
3. **Cut-away interiors.**
   - Remove the front wall and show the cut as a **thick section edge**: wall thickness, floor slab
     and, at ground level, the soil band. This continues the existing diorama-edge look in `MAPS.md`.
   - Angle the side walls 10–20° inward so the room reads like a theatre box set.
   - The back wall is L2. The counter or tables are L3. Ceiling lamps hang into frame.
4. **Doors.** Entering a building fades or dithers its facade out and dollies the camera in. The
   interior must line up with the facade's width.
5. **★ZOOM spots** (the owner's zoom-in scenes) use one of two camera grammars:
   - **Table zoom:** a 30–45° downward view over the table. Food and props fill the lower 2/3 and the
     dining partners sit at the sides.
   - **Counter first-person:** the eye level of a seated customer. The counter top fills the lower third,
     staff stand in the middle third, and the menu board or sampuru sits in the top third.
6. **Pixel consistency.** Use one texel density per scene and never mix resolutions within a layer.
   - No rotated or sub-pixel texture detail.
   - Use 1-px dark outlines on prop silhouettes.
   - Hue-shift shadows toward blue/violet and highlights toward warm yellow (§1 art direction).
7. **Time-of-day presets.** Every outdoor scene has these four keys:

| Preset | Sky top → horizon | Ambient | Key light |
|---|---|---|---|
| Day | `#5fa8ee` → `#cfe8ff` | `#cfe3ff` | sun `#fff4dc`, hard shadows |
| Golden | `#7aa0d8` → `#ffd9a8` | `#ffe2c0` | sun `#ffc27a`, long shadows |
| Dusk (blue hour) | `#3a3f8f` → `#f08a7a` | `#5a5a9a` | sky fill only; practical lights switch on |
| Night | `#0e1030` → `#2b2350` | `#1c2148` | moon `#a8c4ff`; practicals and signs carry the scene |

### 0.3 Osaka 2050 futurism kit (all city scenes)

- **Layering rule (about 70/20/10):**
  - about 70% present-day and **Showa-retro** Osaka (concrete, tiles, wooden shopfronts, hand-painted signs);
  - about 20% **2050 retrofits** bolted onto old buildings;
  - about 10% **hero-future** pieces (League HQ, stadium, maglev).
  - Futurism is **added to** the old city. It doesn't replace it.
- **Kit:**
  - holo-billboards (`holo_billboard`): scanline dither, 2-frame flicker, cyan, magenta and white;
  - e-paper and LED kanban;
  - delivery drones (`drone`) and balcony drone docks;
  - hovercars (`hovercar`) in lanes marked by floating ring lights;
  - maglev or monorail viaducts;
  - PV glass and rooftop solar (`solar_panel`);
  - rooftop and vertical gardens;
  - hydroponic farm windows (grow-light magenta `#c86bff`);
  - robot couriers;
  - smart vending (`vending`) with holographic product spin;
  - air-quality pillars.
- **Osaka anchors that make 2050 believable** (future buildings should feel like their descendants):
  - Expo 2025's timber **Grand Ring**;
  - Umekita's **city-centre park**;
  - **Namba Parks'** terraced garden canyon;
  - the **Gate Tower Building**, with an expressway passing through its middle floors.
  - See §9.

### 0.4 Signage rules

- **Every sign is bilingual:** Japanese, plus English as a **band/song pun**. The Japanese side is either what the shop
  sells (たこ焼き, 串カツ, 銭湯) or the katakana of the pun.
- **Sign shapes to mix in every street:**
  - vertical **blade signs** (*tate-kanban*) on facade corners;
  - horizontal **fascia bands** over the ground floor;
  - rooftop billboards;
  - **3D object signs** (giant food or creatures);
  - *chōchin* paper lanterns;
  - *noren* curtains;
  - A-frame chalkboards;
  - sampuru windows;
  - floor stickers.
- **Transform, never copy, real trademarks.** Keep the *role* (a giant moving crab over a crab
  restaurant) but make an original design. Never use: the Glico running man or its V-pose on a track,
  the Kani Doraku crab, Kuidaore Taro, the Billiken face, the Don Quijote penguin, real brand names
  or band logos.
- **Rename existing in-world signs.** Several still say **ELEMON** (`ELEMON LEAGUE`, `ELEMON GOODS`,
  `ELEMON BANK`, `エレモンリーグ`). Change them to **TOKONMON / トコンモン**.

---------------------------------------------------------------------------------------------------

## 1. Kishiwada farm at dawn (prologue cinematic)

### (a) References
- [S] Osaka tourism, Kishikan Tourist Farm (Kishiwada): https://osaka-info.jp/ar/spot/kishikan-tourist-farm/
- [S] Osaka tourism, Tajiri to Kishiwada model course (crops: rice, onions, mizunasu eggplant, bamboo shoots, mandarins; Senshu is a major vegetable area incl. cabbage): https://osaka-info.jp/en/modelcourse/course-tajiri-to-kishiwada/index.html
- [S] Understanding kominka (farmhouse structure, roofs, earthen entry, sliding screens): https://www.akiyajapan.com/articles/understanding-kominka-when-an-akiya-is-actually-a-cultural-treasure?lang=en
- [S] Namako wall (white plaster grid on dark tiles; western Japan storehouses): https://en.wikipedia.org/wiki/Namako_wall
- [S] Kura storehouse (rural kura store rice; fireproof earthen *dozō*): https://en.wikipedia.org/wiki/Kura_(storehouse)
- [S] MLIT, Rice terraces of Kashihara / satoyama mosaic: https://www.mlit.go.jp/tagengo-db/common/001550492.docx
- [S] Clip Studio, How to draw the sky (sunrise palettes, warm centre): https://tips.clip-studio.com/en-us/articles/3589
- [S] OpenGameArt, banded/dithered gradient sky tutorial: https://opengameart.org/node/20630
- [S] GameDev Academy, pixel-art backgrounds (gradient + mosaic): https://gamedevacademy.org/pixel-art-photoshop-tutorial/
- [S] RetroVII, "Fishing in the early morn" (quiet pixel dawn mood): https://retrovii.itch.io/fishing-in-the-early-morn
- [S] HD-2D (dynamic light + depth of field + tilt-shift = diorama look): https://en.wikipedia.org/wiki/HD-2D
- [S] Unreal Engine interview, Octopath Traveler II HD-2D: https://www.unrealengine.com/en-us/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style
- [S] Nintendo Everything, Octopath devs on visual style (lighting on pixels, point-light shadows): https://nintendoeverything.com/octopath-traveler-devs-on-character-origins-visual-style-initial-hd-rumble-plans-much-more/
- [K] Kishiwada, Osaka (Kumeda-ike pond, Izumi Mountains, Danjiri): https://en.wikipedia.org/wiki/Kishiwada,_Osaka
- [K] Minka (Japanese farmhouses): https://en.wikipedia.org/wiki/Minka
- [K] Satoyama: https://en.wikipedia.org/wiki/Satoyama
- [K] Kei truck (white mini-trucks on every farm): https://en.wikipedia.org/wiki/Kei_truck
- [K] Agrivoltaics ("solar sharing", common in Japan): https://en.wikipedia.org/wiki/Agrivoltaics
- [K] *My Neighbor Totoro* (rice fields, farmhouse, early-morning countryside): https://en.wikipedia.org/wiki/My_Neighbor_Totoro
- [K] *Wolf Children* (old farmhouse, fields, mountain backdrop): https://en.wikipedia.org/wiki/Wolf_Children
- [K] *Kingdom Two Crowns*: side-scrolling pixel art, dawn skies, mirrored water reflections, a feudal-Japan "Shogun" campaign: https://en.wikipedia.org/wiki/Kingdom_Two_Crowns
- [K] *Celeste* (summit dawn gradient in pixel art): https://en.wikipedia.org/wiki/Celeste_(video_game)

### (b) Study notes

**Place**
- Kishiwada is in **Senshu**, southern Osaka. It sits between Osaka Bay (west/north-west) and the
  **Izumi-Katsuragi mountains** (south-east).
- The sun rises **over a mountain ridge**, so the dawn horizon is a jagged silhouette, not flat land.
- The land steps from the coastal plain to foothill terraces to forest.

**Crops** (from [S]):
- rice;
- onions (Senshu is the historic birthplace of Japanese onion farming);
- *mizunasu* water eggplant;
- cabbage;
- bamboo shoots on the hills;
- mandarin orchards on the slopes.

**Region-specific details**
- **Onion-drying huts** (*tamanegi-goya*), open-slatted wooden sheds hung with onions (verify for
  Senshu specifically).
- **Irrigation ponds** (*tame-ike*) all over southern Osaka. Kumeda-ike in Kishiwada is said to be
  the prefecture's largest (verify).

**Paddies**
- Rectangles split by raised earth **levees** (*aze*, 30–50 cm wide, grassy).
- Concrete irrigation channels with small sluice gates.
- Through the seasons:
  - **Flooded in May–June:** a mirror for the sky. Seedlings are thin green dashes in rows.
  - **Green in July–August.**
  - **Gold in September.**
  - **Stubble in October,** with wooden **hazakake** racks hung with rice sheaves.

**Farmstead (from [S] kominka / kura)**
- **Main house:** a heavy timber frame on stones, with an earthen-floor entry (*doma*) and sliding
  screens. The roof is *irimoya* (hip-and-gable) or *yosemune* (hipped). In the Kansai plains it is usually **dark
  kawara tile**, not thatch (verify for Senshu). There's a veranda (*engawa*) with sliding glass and wooden shutters.
- **Kura:** white plaster walls, a heavy tiled roof and small high windows with thick shutters. The base
  has **namako** cladding, dark square tiles with raised white plaster joints in a grid or diamond pattern.
- **Sheds:** corrugated metal (galvanised grey, rust-streaked) with blue tarps, plastic crates
  (yellow/blue harvest "container" crates), coiled hoses and bamboo poles.
- **Vinyl greenhouses:** long arched tunnels with milky, translucent film.

**Rural details that make it unmistakably Japan**
- A white **kei truck**.
- Wooden **utility poles** with transformers and sagging wires across the sky.
- A roadside **vending machine** glowing at dawn.
- An **unmanned vegetable stand** with a coin box.
- A tiny **hokora** roadside shrine with a mini torii.
- A **jizō** statue with a red bib.
- A **persimmon tree** by the house.
- Bird scarers: reflective **CDs on strings** and yellow **"eyeball" balloons**.
  The CDs fit the game's disc motif.

**Animals (bible):** cow, chicken, pig and farm dog. A Japanese Black cow (black) and a shiba-type dog read as local.

**2050 farm**
- **Agrivoltaic panels** on stilts over crops.
- Spray **drones** with a charging pad.
- A compact autonomous tractor.
- A weather mast.
- An EV kei truck.

**Dawn light (pixel sky method from [S])**
- Use a 5–7 step ramp from deep blue at the zenith, through violet and rose, to peach and pale yellow at the
  horizon. Put the **lightest value nearest the sun**.
- Make banded steps with hand-dithered seams; don't use smooth gradients.
- **Ground mist** lies in the paddies.
- Before sunrise everything is cool and low-contrast. At sunrise the sun puts **rim light** on silhouettes,
  and long shadows run toward the camera side.

**HD-2D takeaway ([S])**
- What sells the diorama is dramatic point lights on pixel textures, plus depth-of-field and tilt-shift.
- Bloom on lit windows, light shafts through mist, and a soft focus falloff in L1/L4 are the HD-2D
  signature.

### (c) Design direction

**Composition.**
- A long east–west strip with the camera facing north.
- **The sun rises screen-right** over the ridge, so dawn light rakes from the right.
- The cinematic plays as one slow pan from left to right, following the light.

| Layer | Contents (left → right) |
|---|---|
| L0 | Banded dawn sky (palette below), the morning star (1 white pixel + 4-px glint), thin cloud streaks lit pink from below. Leave a clear band for **Polaris the sky whale** to cross. |
| L1 | Two ridge silhouettes of the Izumi-Katsuragi range with mist between them. At far left, a sliver of Osaka Bay with tiny 2050 offshore wind turbines (slow blades) and a dotted runway-light line. Power pylons march along the foothills. |
| L2 | Terraced mandarin orchard on the slope; the **kura** with namako base; the **main farmhouse** (warm lit windows, steam from the kitchen, persimmon tree); the **barn** (charred-black *yakisugi* boards, rust corrugated roof, open front showing hay and tools); an **onion-drying hut**; **vinyl greenhouse** tunnels; a row of **agrivoltaic panels**; a small **hokora** shrine under a tree. |
| L3 | Packed-earth farm lane with tyre ruts; **cabbage rows** (Cabbunny hides here); a flooded-paddy levee walk; chicken coop; open-front cow shed; pig pen; dog house; hand pump/well; the **honour-system veg stand** at the lane end; the kei truck. Kagarou bursts in from the brush on the right edge. |
| L4 | Susuki and summer grasses, dandelions, the concrete irrigation channel with frogs, farm-fence posts, and a **utility pole** whose wires cross the top of the frame, with crows on them (they scatter when Kagarou arrives). |

**Cinematic beats (light-driven)**
1. **Pre-dawn blue hour.** Low contrast. Only the farmhouse windows and the vending machine glow.
2. **Polaris passes.** A huge silhouette crosses L0/L1. Its **shadow sweeps across the mirrored
   paddies**, and its belly picks up pink light.
3. **Sunrise.** The sun clears the ridge and a gold rim runs along every silhouette. Mist lifts, and
   paddy reflections flip from blue to gold.
4. **Kagarou.** Orange firelight flickers on the barn and the cabbages. Sparks fly, chickens scatter
   and the dog barks.

**Season.** Choose **early summer**: flooded paddies with seedlings are the mirror shot, and spring
cabbage is ready. Alternative: autumn gold with hazakake racks.

**Props**
- **Existing ids:** `barn`, `haystack`, `scarecrow`, `fence_farm`, `trough`, `water_tank`,
  `cabbage_row`, `corn_row`, `crate`, `tractor`, `solar_panel`, `drone`, `bus_stop`, `vending`,
  `signpost`, `lantern_post`, `tallgrass`, `reeds`, `stump`.
- **Use `silo` and `windmill` sparingly or not at all.** Tall silos and Dutch windmills read American or European, not Senshu.
- **New props needed:**
  - kei truck (white, EV variant);
  - kominka farmhouse kit (irimoya roof, engawa, doma door);
  - kura with namako base;
  - onion-drying hut;
  - vinyl greenhouse tunnel;
  - hazakake rice rack;
  - hokora + mini torii;
  - jizō with red bib;
  - wooden utility pole + transformer + wire spans;
  - honour veg stand + coin box;
  - chicken coop;
  - cow shed;
  - pig pen;
  - dog house;
  - hand pump;
  - irrigation channel + sluice gate;
  - persimmon tree;
  - bird-scare CDs and eye balloon;
  - yellow harvest crates;
  - blue tarp pile;
  - agrivoltaic stilt array;
  - drone pad.

**Signs**
- `久保農園 / KUBO FARM` on the gate. Old Man Kubo is the farmer.
- `無人販売 100円 / HARVEST MOON` on the honour stand (Neil Young pun).
- `岸和田市 / KISHIWADA CITY` road sign.
- `トコンモン保護区域 無許可捕獲禁止 / PROTECTED TOKONMON: NO CAPTURE WITHOUT LICENSE`. This is the
  bible's law, shown in-world.
- Optional: `いちご畑 / STRAWBERRY FIELDS` (a Strawbaa nod, only if strawberries are planted).

**Palette**

| Role | Hex |
|---|---|
| Zenith → horizon (dawn) | `#1b2447` `#33386a` `#6a4f8a` `#b8678a` `#ef8f78` `#ffc98f` `#fff0c4` |
| Sun disc / glow | `#fff6d6` / `#ffd98a` |
| Ridge far / near | `#4a4a78` / `#2f3358` |
| Mist | `#c9b8d8` (40–60% alpha) |
| Paddy water (pre-dawn → sunrise) | `#3a4f86` → `#f2b27a` |
| Rice seedlings | `#7fbf4a` `#5a9a38` |
| Cabbage | `#a8d07a` `#d8eeb0` `#6f9a4a` |
| Earth lane / levee | `#8a6a4a` `#a8865e` `#6a4f36` |
| Kawara roof | `#4a4f5a` `#363c49` |
| Plaster / namako tile | `#f1ece0` / `#3a3d44` |
| Yakisugi boards | `#2a2624` `#3d3632` |
| Rust / galvanised | `#8b5a3c` / `#9aa3ab` |
| Lit window | `#ffb35c` |
| Kagarou firelight | `#ff7a2a` `#ffd14a` |

**★ZOOM spots.** The prologue is cinematic, so none are needed. An optional close-up: the farmhouse **engawa**
(Old Man Kubo with tea), seen with the table-zoom grammar.

### (d) Do / Don't
- **Do** make the ridge the horizon. Do keep power lines, kei truck, vending machine and hokora; they say "Japan" instantly.
- **Do** use the flooded paddies as a sky mirror for the Polaris shadow sweep.
- **Do** keep dawn values compressed until the sunrise beat, then let the gold rim light pop.
- **Don't** build an American red barn, a Dutch windmill or prairie silos.
- **Don't** use smooth digital gradients. Use banded and dithered steps.
- **Don't** overdo the 2050 tech. The farm should feel old, with a few clean gadgets.

---------------------------------------------------------------------------------------------------

## 2. Osaka Castle Park (training ground, starters, coach and rival battles)

### (a) References
- [S] MLIT, Osaka Castle Main Tower (white walls, blue-green roofs trimmed with gold): https://www.mlit.go.jp/tagengo-db/en/R1-01758.html
- [S] Lonely Planet, Osaka-jō (1931 concrete reconstruction, refurbished 1997, gold-leaf tigers on the eaves): https://www.lonelyplanet.com/points-of-interest/osaka-jo/423395
- [S] Muza-chan, Osaka Castle gold decorations: https://muza-chan.net/japan/index.php/amp/osaka-castle-gold-decorations-travel-tip
- [S] David Kennard Photography, Tenshukaku and inner moat: https://davidkennardphotography.com/photos/3291-Tenshukaku-Osaka-Castle.xhtml · https://www.davidkennardphotography.com/photos/3293-Osaka-Castle-inner-moat-and-tower.xhtml?size=m
- [S] Octopus Stone, Takoishi (5.5 × 11.7 m face, 108–130 t, at the Sakuramon masugata): https://en.wikipedia.org/wiki/Octopus_stone · https://www.mlit.go.jp/tagengo-db/en/R1-01757.html
- [S] Sakuramon stone wall photo page: https://www.davidkennardphotography.com/photos/3277-Sakuramon-Stone-Wall-Osaka-Castle.xhtml
- [S] Osaka Info, Osaka Castle Park (105.6 ha; museum, Nishinomaru Garden, plum grove, Castle Hall, archery range): https://osaka-info.jp/en/spot/osaka-castle-park/
- [S] Veltra guide, Osaka Castle Park: https://www.veltra.com/en/travelguide/osaka/osaka-castle-park/
- [S] Time Out, night sakura at Nishinomaru Garden: https://www.timeout.com/osaka/things-to-do/nighttime-cherry-blossom-viewing-at-nishinomaru-garden
- [S] Japan Travel, cherry blossoms at Osaka Castle (food vendors, taiko, picnic mats): https://en.jal.japantravel.com/osaka/cherry-blossoms-at-osaka-castle/1209
- [S] Metro Nine, Osaka Castle spring festival night sakura 2026: https://metronine.osaka/en/event/osaka-castle-spring-festival-nighttime-cherry-blossom-viewing-2026/
- [S] Colorculture, *Your Name* cinematography (motivated light, lens flares, leading lines, open sky as negative space): https://colorculture.org/your-name-cinematography-analysis/
- [S] BFI, Shinkai on *Your Name* (magic-hour light, detailed backgrounds vs flat characters): https://www.bfi.org.uk/sight-and-sound/interviews/trading-places-makoto-shinkai-your-name
- [K] Osaka Castle: https://en.wikipedia.org/wiki/Osaka_Castle
- [K] Shachihoko: https://en.wikipedia.org/wiki/Shachihoko
- [K] Japanese castle (ishigaki walls, yagura, masugata gates): https://en.wikipedia.org/wiki/Japanese_castle
- [K] Hanami: https://en.wikipedia.org/wiki/Hanami
- [K] *Kingdom Two Crowns* "Shogun" (side-scroll Japanese castle walls in pixel art): https://en.wikipedia.org/wiki/Kingdom_Two_Crowns

### (b) Study notes

**Main tower (Tenshukaku)**
- A **1931 reinforced-concrete reconstruction**, refurbished in 1997 with fresh plaster and gold leaf ([S]).
- About 55 m tall on its stone base, with 5 outer roof tiers and 8 floors inside (verify).
- **Walls:** **white plaster** on the lower tiers.
- **Roofs:** **green copper**, described as "blue-green trimmed in gold" ([S]).
- **Gold details:**
  - gilded **shachihoko** on the ridge ends (tiger head, carp body, a fire charm);
  - gilded gable ornaments;
  - **gold-leaf tigers (*fusetora*)** on the eaves of the top tier ([S]).
- The **top tier is darker**, with black walls and gold tiger and crane reliefs, in the Toyotomi style (from
  memory, **verify against photos**).
- **Gables:** triangular *chidori-hafu* and curved *kara-hafu* gables, edged in gold.

**Stone walls (ishigaki)**
- Huge granite blocks with a curved "fan" batter that flares out at the foot.
- The **Octopus Stone** is the biggest ([S]): a 5.5 × 11.7 m face, quarried in Bizen and set in 1624. It sits
  at the **Sakuramon** gate's square enclosure (*masugata*), and its octopus-shaped mottle is on
  the lower left.

**Moats**
- An outer moat full of greenish water, and an inner moat that is **dry in parts** (verify which side).
- The bridges are **Gokuraku-bashi** (north) and the Sakuramon approach (south).

**Park**
- 105.6 ha.
- **Nishinomaru Garden**, about 6.5 ha, has around 300 sakura (sources vary: 300/600/3,000 park-wide), lawns, the Senkan
  turret and a storehouse.
- **Plum grove** (east/north-east), about 1,245 trees of about 105 varieties, blooming in February. Its pink and white
  blossom against the stone walls is a signature view.
- Also an archery range, Osaka Castle Hall, wide **sandy-gravel paths**, and the OBP glass towers
  behind the castle to the east.

**Hanami life ([S])**
- Blue picnic tarps, food stalls, taiko drummers.
- Night illumination starts at 18:00 in season.
- The lit castle reflects in the moat.

**Shinkai-style lessons ([S])**
- Painted, detailed backgrounds behind flat characters.
- **Motivated, directional light.**
- Lens flare and light shafts at magic hour.
- Leading lines (paths, moat edges, cables).
- **Open sky as negative space**, with the castle framed by a big sky.

**Key colour facts (study)**

| Element | Hex |
|---|---|
| Castle plaster (lit / shade) | `#f3f1ea` / `#c9cfd6` (hue-shift shade to blue) |
| Copper-green roof (lit / shade / ridge) | `#7fb6a2` / `#3f6e62` / `#5d9584` |
| Gold leaf (base / highlight / shadow) | `#d4a637` / `#ffe28a` / `#9a6f1f` |
| Top-tier black (verify) | `#1f1d22` |
| Granite ishigaki (light / mid / joints) | `#c2b9a8` / `#9b9284` / `#5b544b` |
| Moat water (day / night) | `#4f7f78` / `#16263a` |
| Sakura (petal / shadow / white) | `#ffc6d6` / `#ee8bb0` / `#fff0f5` |
| Sakura bark | `#4a3a33` |
| Gravel path (*masa-do*) | `#d9c8a5` `#bfae8a` |
| Plum blossom | `#f5a0b8` `#ffffff` |

### (c) Design direction

**Composition.** The strip runs along the **outer moat promenade**. The castle sits high in L1/L2,
framed by big sky. Camera faces north, so the castle is slightly right of centre and keeps a clean
silhouette.

| Layer | Contents |
|---|---|
| L0 | Big spring sky, cumulus, sun flare at golden hour. At night, a deep blue sky with a drone light show (2050: Tokonmon shapes made of drones). |
| L1 | **Tenshukaku** on its stone base (hero landmark), the OBP glass towers to its right (with an `OBP 2050` sign), and one white **yagura** turret on the wall corner. |
| L2 | **Ishigaki stone wall** across the frame with the moat at its foot. A **Sakuramon-style gate** opening with a giant feature stone (an original octopus-mottle stone as a hidden-detail Easter egg). A sakura promenade on the far bank. Nishinomaru-style lawns. |
| L3 | Wide **gravel promenade**, then **Coach Gonda's training ground**: a sand-and-grass clearing ringed by sakura, with straw training targets, wooden dummies, a punching bag, sandbag walls and a rack of training gear. Benches, a tea kiosk, a food truck and the starter pedestal table. The battle ring sits on this strip. |
| L4 | Overhanging **sakura branches** across the top of the frame (falling petals), **blue hanami tarps**, bento boxes, bonbori lanterns on poles, and the moat railing. |

**Props**
- **Existing ids:** `osaka_castle`, `castle_wall`, `sakura`, `sakura2`, `sakura3`, `pine`,
  `stone_lantern`, `bench`, `bench_stone`, `lantern_post`, `lantern_string`, `training_dummy`,
  `wooden_dummy`, `punching_bag`, `target_post`, `sandbags`, `taiko`, `fountain`, `flowerbed`,
  `noticeboard`, `trashbins`, `vending`, `drone`, `streetlamp`, `bush`, `rock_*`.
- **New props needed:**
  - **bonbori** pink/white lantern poles strung along the promenade;
  - blue hanami tarp + bento set;
  - yagura turret;
  - masugata gate with feature stone;
  - moat railing;
  - plum tree (pink/white variants);
  - **starter pedestal** (three soul-stone stands);
  - bracelet display case;
  - food truck;
  - matcha/tea kiosk;
  - Japanese black pine with *yukitsuri*-style supports (optional, winter).

**Signs**
- `大阪城公園 / OSAKA CASTLE PARK` on a stone marker.
- `権田トレーニング場 / GONDA TRAINING GROUND` on a wooden board on posts.
- `茶屋 さくら` (an existing tea house).
- Food truck: `チェリーボム クレープ / CHERRY BOMB CRÊPES`.
- Hanami lanterns: real bonbori carry sponsor names in brush script. Use local-shop names such as
  `ヒア・カムズ・ザ・サン茶房 / HERE COMES THE SUN TEA`.

**Lighting**
- **Day:** bright spring with soft blue shade. Petals drift (particles: `sakura`).
- **Golden:** low sun from screen-left. The castle's gold flares (a 2-frame sparkle on the shachihoko) and
  long tree shadows fall across the gravel.
- **Dusk/Night:**
  - The castle is **uplit**: plaster glows `#fffaf0` and the roofs go teal.
  - Sakura are lit from below to `#ffd3e3`.
  - Bonbori glow `#ffe9c4`.
  - The moat doubles the castle in a reflection with ripple dither.

**★ZOOM spots**
1. **Starter table/pedestal:** choosing a starter (table grammar).
2. **Hanami mat** with the gang (table grammar).
3. **Moat bench** (two-shot, side view).

### (d) Do / Don't
- **Do** keep the castle as a calm, iconic silhouette with lots of sky. Do let the gold catch light.
- **Do** show the curved batter of the stone walls. Their scale against tiny people is the wow.
- **Don't** clutter the castle with holograms. The futurism stays at the edges (OBP towers, drones).
- **Don't** make the roofs flat bright green. Copper reads as a muted blue-green with lighter ridge lines.
- **Don't** forget petals underfoot (sakura-petal grass, tile `k`) and on the moat surface.

---------------------------------------------------------------------------------------------------

## 3. Dotonbori street + Ebisu Bridge (Namba)

### (a) References
- [S] Dōtonbori (Wikipedia: signboards, Kani Doraku 6.5 m crab, history): https://en.wikipedia.org/wiki/D%C5%8Dtonbori
- [S] OpenRice, "This is Dotonbori! Top 12 gourmet signboards" (Kinryu dragon, Daruma's glaring chef, Osaka Osho gyoza, Zuboraya fugu): https://jp.openrice.com/en/osaka/article/this-is-dotonbori-top-12-gourmet-signboards-a25
- [S] Muza-chan, Dotonbori 3D billboards: https://muza-chan.net/japan/index.php/blog/dotonbori-3d-billboards
- [S] Japan Today, Glico running man now LED (2014: 140,000 LEDs, ~20 × 10 m): https://japantoday.com/category/national/glicos-running-man-now-lit-up-with-leds
- [S] Muza-chan, The new Glico man / The story of the Glico man sign: https://muza-chan.net/japan/index.php/blog/new-glico-man-dotonbori · https://muza-chan.net/japan/index.php/blog/the-story-of-the-glico-man-sign
- [S] SoraNews24, the 1937 neon nightscape and Glico sign: https://soranews24.com/2014/07/20/travel-back-in-time-to-see-the-neon-nightscape-and-glico-sign-of-1937-osaka/amp/
- [S] Kani Doraku moving crab: https://japan-food.guide/articles/Kani-Doraku-Japans-Iconic-Crab-Restaurant-with-the-Giant-Moving-Sign · https://muza-chan.net/japan/index.php/blog/kani-doraku-crab
- [S] SoraNews24, the crab loses its legs (2020 maintenance): https://soranews24.com/2020/10/21/osaka-icon-loses-legs-restaurant-says-famous-crab-is-exhausted/amp/
- [S] Zuboraya fugu lantern removed (2020; 5 m long, 3 m wide, hung 3.5 m up): https://soranews24.com/2020/09/03/osaka-loses-an-icon-as-giant-pufferfish-disappears-in-the-middle-of-the-night-%e3%80%90video%e3%80%91/amp/ · https://www.timeout.com/tokyo/news/osakas-famous-pufferfish-lanterns-may-disappear-come-september-062920
- [S] Kuidaore Taro (1950 drum-playing mechanical clown; red-white stripes, round glasses): https://metronine.osaka/en/article_tour/kuidaore-taro190121/ · https://osaka-info.jp/en/page/nakaza-kuidaore-eat-till-you-drop-building
- [S] Dotonbori canal & Ebisubashi (26 m span, Daikokubashi–Nippombashi stretch, riverwalk, best 18:00–23:00): https://www.nomadotravel.app/en/attractions/dotonbori-canal
- [S] Night photo, Dotonbori Nov 2016 (Wikimedia): https://wiki.OpenStreetMap.org/wiki/File:Dotonbori,_Osaka,_at_night,_November_2016.jpg
- [S] Fun Japan, where to shoot Dotonbori/Namba: https://www.fun-japan.jp/en/articles/11634
- [S] Takoyaki (Wikipedia) + Tako Hachi (copper plates): https://en.wikipedia.org/wiki/Takoyaki · https://www.gltjp.com/en/directory/item/14564/
- [S] Yatai guide (griddle, short counter, stools, cloth curtain): https://pogogi.com/japanese-street-food-yatai-matsuri-festival-guide
- [S] Kanban, traditional Japanese shop signs (Mingei museum; objects shaped like the goods): https://mingei.org/exhibitions/kanban/ · https://hyperallergic.com/390252/handcrafted-japanese-shop-signs-kanban-mingei-museum
- [S] *VA-11 Hall-A* (cyberpunk bar, dark backgrounds make colour pop): https://en.wikipedia.org/wiki/VA-11_Hall-A
- [S] *The Last Night*, 3D low-poly with pixel textures and a fixed side camera, lit like *Blade Runner 2049*: https://80.lv/articles/the-last-night-pixel-art-cyberpunk-open-world · https://en.wikipedia.org/wiki/The_Last_Night_(video_game)
- [S] *Katana ZERO* review (neon over grime; cyberpunk = blue/purple/pink): https://www.thepixelempire.net/katana-zero-pc-review.html · https://calebstudios.itch.io/neo-samurai-mommy-issues/devlog/324285/the-final-studio-document
- [S] *Blade Runner 2049* VFX: giant Joi hologram billboard, Brutalist city: https://www.awn.com/print/vfxworld/double-negative-delivers-joi-blade-runner-2049 · https://www.artofvfx.com/blade-runner-2049-paul-lambert-vfx-supervisor-double-negative/
- [K] *Yakuza 0*, "Sotenbori": a fictional Dotonbori built as a street-level game set: https://en.wikipedia.org/wiki/Yakuza_0
- [K] *Akira* (1988), Neo-Tokyo signage density: https://en.wikipedia.org/wiki/Akira_(1988_film)
- [K] eBoy "Pixorama" city posters (dense pixel cities): https://en.wikipedia.org/wiki/EBoy
- [K] Pixel artists to study (search by name): **Waneella** (cyberpunk Japan street loops), **1041uuu** (Japanese shopfront and city pixel scenes), **Toyoi Yuuta** (nostalgic Japanese pixel streets), **Kirokaze** (atmospheric pixel cityscapes).

### (b) Study notes

**Layout**
- A canal running **east–west**, lined on both banks by narrow 5–10-storey buildings packed shoulder to shoulder.
- The pedestrian **Dotonbori street** runs one block in on the south bank. Restaurants with giant 3D signs face it.
- The landmark LED boards face **the canal and Ebisubashi**.
- **Ebisubashi** is a 26 m pedestrian span. People crowd its railings to photograph the runner board, and it
  links to the covered Ebisubashi-suji shopping arcade.
- A lower **Tombori Riverwalk** promenade runs at water level, with stairs down from the bridge. Tour boats
  pass along it.
- **Hozenji Yokocho**, a stone-paved alley of lanterns with a moss-covered Fudō statue, is one block south
  and makes a good quiet side-alley.

**Iconic signs and what they do (for transformation)**

| Real sign | What it is visually | Its role |
|---|---|---|
| Glico board | ~20 × 10 m LED wall on the canal corner; a runner in a victory pose; the 2014 version has a moving backdrop (a blue track, a red circle and Osaka landmarks) ([S]). The 1937 neon was red and white. | The photo-op sign. Its reflection streaks the canal. |
| Kani Doraku | ~6.5 m red crab over the entrance; motorised legs, claws and eye stalks | Moving 3D sign. Visible from far down the street. |
| Zuboraya fugu | 5 × 3 m paper-lantern pufferfish hung 3.5 m up (removed 2020) | Soft, glowing lantern creature. |
| Kuidaore Taro | Life-size drumming clown robot, red/white stripes, round glasses, at the Nakaza Kuidaore Building | Street-level mascot and photo spot. |
| Kinryu Ramen | Huge green/gold dragon writhing over an open-air ramen stand (tatami seating) | Rooftop-to-awning creature sign. |
| Kushikatsu Daruma | A glaring, scowling chef holding skewers (said to be the chairman) | Character face sign. |
| Osaka Osho | A giant plate of gyoza with chopsticks | Food-object sign. |

**Other signage**
- **Vertical blade signs** on every corner, 1–1.5 m wide and running 2–4 storeys, with kanji
  in white/yellow/red neon on black or red.
- Fascia bands, backlit menu photo boards and *akachōchin* red lanterns.
- Takoyaki counters open straight onto the street (copper griddles, steam, queues).
- Further features:
  - an oval yellow **Ferris wheel** on a discount-store facade (Don Quijote's "Ebisu Tower");
  - a Western-style arched theatre front (Shochikuza);
  - historically, the street was a theatre district.

**Lighting**
- **Day:** fairly drab. Concrete facades with dark signs, though the LED boards stay bright.
- **Dusk:** the magic hour. The sky is violet-orange and the signs are half on.
- **Night (18:00–23:00) is the money shot:**
  - neon reflects as long vertical streaks in the dark canal;
  - faces are lit coloured from above and the side;
  - the whole scene is a high-saturation, low-ambient mix of cyan, magenta, red and yellow.
- **Cyberpunk pixel lessons ([S]):**
  - a very dark base lets small saturated lights pop (*VA-11 Hall-A*);
  - neon over grime (*Katana ZERO*);
  - the core palette is blue, purple and pink, with warm accents;
  - *The Last Night* shows the exact tech fit: **3D low-poly with pixel textures and a fixed side
    camera**, lit with dynamic neon. That is the template for this scene.

**2050 holograms** (*Blade Runner 2049* [S])
- Giant translucent figures stand among buildings, and their light spills onto surfaces.
- Keep them **sparse and huge**: one or two per screen, not dozens.

### (c) Design direction

**Composition.**
- Camera on the south side looking **north across the canal** at the north-bank facades.
  This is the classic Ebisubashi view, and the existing `dotonbori.js` layout already has it.
- The play strip is the north-bank street plus the boardwalk.
- **Ebisubashi** comes toward the camera as a wide plaza across the canal (L3/L4). It is the **3v3
  arena** (existing `arenas.main`).

| Layer | Contents |
|---|---|
| L0 | Night sky `#120f2a` with an orange city-glow band at the horizon, drone traffic lights blinking, and one **giant hologram** (an idol, Lumi★, sings between two towers). |
| L1 | 2050 towers with LED crowns, the **oval Ferris wheel** (original design, no penguin), a maglev viaduct crossing far right, and hovercar lanes marked by ring lights. |
| L2 | **North-bank facade wall**, 5–8 storeys, each building 6–10 m wide with its **own hero sign** (list below), blade signs on the corners, AC units, fire escapes, and LED boards stacked at the bridge corner with the **runner board** (original design). |
| L3 | Dotonbori street (cobbles `c`, sidewalk `w`, tactile line `t`); **takoyaki stall** counters; vending machines; bicycles; crowd NPCs; the north **riverwalk boardwalk** (`o`) with lantern strings and benches; stairs down from the bridge. |
| L4 | The **canal** (`-`) as a black mirror full of neon reflection streaks, a passing tour boat, the bridge railing, crowd heads with phones up, and lantern strings sagging across the top. |

**Hero signs** (original transformations; several already exist in the map)

| Real role | Tokonmon sign (JP / EN) | Design notes |
|---|---|---|
| Giant moving crab | `かに / RED HOT CHILI CRABBERS` | Chili-red crab with pepper-shaped claws, eyestalks bob, legs cycle on twos (`crab_sign`). |
| Pufferfish lantern | `ふぐ料理 / FUGU FIGHTERS` | Glowing paper fugu, spines as lantern ribs, slow sway (`fugu_lantern`). |
| Dragon over ramen | `ラーメン / RAMONES RAMEN` | Black-and-white punk dragon wearing a leather jacket, gold pearl. |
| Glaring chef | `串カツ / FRIED ZEPPELIN` | A scowling chef holding a skewer like a zeppelin. Also hang a `二度づけ禁止` (no double dipping) sign. |
| Giant food object | `餃子 / WONDERWALL GYOZA` | Plate of gyoza stacked like a brick wall. |
| Drum mascot | `ドラムマシーン太鼓 / DRUM MACHINE` | An **original** tin-toy robot drummer in a marching-band jacket (a Sgt. Pepper nod), not a clown (`drummer_statue`). |
| Runner LED board | `ロングラン / THE LONG RUN` (energy drink) | Original runner with a **different pose** on a city-skyline backdrop (`runner_board`). Never the arms-up V on a track. |
| Takoyaki stall | `たこ焼き / OCTOPUS'S GARDEN` | A giant smiling octopus over a copper-griddle counter (`yatai_takoyaki`). Takoyaki Taisho works here. |
| Ice cream | `アイス / YELLOW SUBMARINE SOFT-SERVE` | A yellow submarine hull sign with a giant soft-serve cone at the door (interior §4.1). |
| Okonomiyaki | `お好み焼き / ABBEY ROAD` | A zebra-crossing fascia band (interior §4.2). |
| Karaoke | `カラオケ / KARAOKE QUEEN` | Crown neon (exists). |
| Udon | `うどん / UDON STOP ME NOW` | (exists in the bank of names) |
| Café | `カフェ / PURPLE RAIN CAFÉ` | Purple neon raindrops. |
| Hotel | `ホテル / HOTEL KANSAI-FORNIA` | Rooftop sign on the tallest building. |

**Props**
- **Existing ids:** `crab_sign`, `fugu_lantern`, `drummer_statue`, `runner_board`, `yatai_takoyaki`,
  `ramen_stall`, `neon_frame`, `holo_billboard`, `lantern_string`, `lantern_post`, `noren`,
  `vending`, `bicycle`, `scooter`, `trashbins`, `ac_unit`, `antenna`, `drone`, `hovercar`,
  `streetlamp`, `barrier`, `crate`, `barrel`.
- **New props needed:**
  - vertical blade sign kit (1×3, 1×5 storeys; JP kanji sets);
  - akachōchin red lantern;
  - backlit menu photo board;
  - tour boat;
  - canal railing;
  - riverwalk bench;
  - oval Ferris wheel (L1);
  - maglev viaduct segment;
  - Hozenji-style moss statue (optional side alley);
  - crowd-silhouette cards for L4;
  - giant octopus sign;
  - dragon sign;
  - gyoza sign.

**Palette (night)**

| Role | Hex |
|---|---|
| Sky / glow band | `#120f2a` `#241a45` / `#ff8a5c` |
| Facade concrete (lit by neon) | `#3a3a46` `#4b4b5a` `#2a2a34` |
| Canal water base / reflection streaks | `#0b1624` / neon keys at 60–80% |
| Neon set | `#3ff0ff` `#ff4ac8` `#ffe45c` `#ff3b4f` `#ff8a3c` `#9d6bff` `#eafcff` |
| Lantern red / paper | `#d93a2b` / `#ffe9c4` |
| Takoyaki stall copper / batter / sauce | `#c46a3a` / `#e8b86a` / `#4a2412` |
| Crowd silhouettes | `#1c1a2a` with cyan/magenta rim |

**Lighting**
- **Night** is the default and best look. Ambient is very low (`#1c2148`). Every sign is a light, coloured
  rim light falls on characters, and the canal mirror runs at 0.7 reflectance with vertical-streak
  dither.
- **Dusk:** a violet sky with some signs still warming up (flicker on).
- **Day:** a grey-blue sky, signs dimmed, takoyaki steam more visible.
- **Rain variant:** wet cobbles reflect neon; puddle reflections on the play strip.

**★ZOOM spots**
1. **Takoyaki counter** (counter first-person: ordering from Takoyaki Taisho; balls turning on the
   copper griddle; steam).
2. **Canal-side bench or railing at night.** McCarapace's evolution needs "deep friendship by the Dotonbori
   canal", so make this the most romantic framing in the game. Use a two-shot from behind, with
   the neon reflections filling the frame.
3. **Tour boat** (a moving two-shot along the canal; optional).

### (d) Do / Don't
- **Do** pack the facades with no gaps, one hero 3D sign per building, plus blade signs on every corner.
- **Do** make the canal reflection a major visual element. It is half the beauty of the real place.
- **Do** keep the base values very dark so the neon reads (the *VA-11 Hall-A* lesson).
- **Don't** copy the Glico runner pose/composition, the Kani Doraku crab, Kuidaore Taro, the Don Quijote
  penguin or any real shop name.
- **Don't** fill the sky with holograms. One or two giant ones are enough; the old signs are the stars.
- **Don't** make every neon the same colour. Alternate warm (red/yellow/orange) with cool (cyan/violet).

---------------------------------------------------------------------------------------------------

## 4. Restaurant interiors (cut-away rooms + zoom-in scenes)

### (a) References
- [S] Heinz Edelmann, art director of *Yellow Submarine* (Art Nouveau + Pop art; "overloading" colour and design): https://www.lambiek.net/artists/e/edelmann_heinz.htm · https://the-paulmccartney-project.com/artist/heinz-edelmann · https://www-4.collection.cooperhewitt.org/objects/18471381
- [S] Yatai and takoyaki stall anatomy (see §3): https://pogogi.com/japanese-street-food-yatai-matsuri-festival-guide
- [K] *Yellow Submarine* (1968 film: Pepperland, Blue Meanies, Sea of Holes): https://en.wikipedia.org/wiki/Yellow_Submarine_(film)
- [K] *Abbey Road* (album cover: four figures crossing a zebra crossing; white VW Beetle parked): https://en.wikipedia.org/wiki/Abbey_Road_(album)
- [K] Okonomiyaki: https://en.wikipedia.org/wiki/Okonomiyaki
- [K] Ramen: https://en.wikipedia.org/wiki/Ramen · Ichiran (individual booth counters): https://en.wikipedia.org/wiki/Ichiran
- [K] Kissaten (Showa coffee parlours: melon cream soda, red velvet seats): https://en.wikipedia.org/wiki/Kissaten
- [K] Noren: https://en.wikipedia.org/wiki/Noren · Chōchin (paper lanterns): https://en.wikipedia.org/wiki/Ch%C5%8Dchin
- [K] Food samples (*shokuhin sampuru*): search "shokuhin sampuru Iwasaki Gujo Hachiman", and "Sennichimae Doguyasuji" (Osaka's kitchenware street next to Namba, which sells sampuru).
- [K] *VA-11 Hall-A* (first-person bar counter framing): https://en.wikipedia.org/wiki/VA-11_Hall-A
- [K] *Coffee Talk* (pixel café counter, rain outside): https://en.wikipedia.org/wiki/Coffee_Talk
- [K] Kairosoft (*Cafeteria Nipponica*: side-cutaway pixel restaurants): https://en.wikipedia.org/wiki/Kairosoft
- [K] Stephen Biesty, *Cross-Sections* (cut-away building illustration): https://en.wikipedia.org/wiki/Stephen_Biesty

### (b) Study notes: what Japanese eateries look like

**Sampuru (plastic food)**
- A glass window case by the door, holding stepped shelves of hyper-real PVC dishes.
- Each dish has a white price card with black name text and red price numbers.
- Old shops' samples are **sun-faded** and a little dusty, a great storytelling detail.
- Signature tricks: a fork lifting floating noodles, a glass "pouring" itself, a soft-serve swirl.

**Menus**
- **Tanzaku:** vertical paper strips with brush-written dish names and red prices, pinned in a row
  along the wall.
- **Wooden plaques** (*fuda*) hung on hooks.
- **Backlit photo boards** above fast-food counters.
- Chalk A-frames out front: 本日のおすすめ (today's special).
- In 2050, add table tablets and holographic menus on the counter, but keep the paper strips. They're the charm.

**Lanterns and entrances**
- *Akachōchin* red paper lanterns mark casual drinking and eating spots.
- White *chōchin* with black kanji.
- *Noren* half-curtains: indigo, white or red, with the shop name. Hung means open.
- Sliding wooden doors with frosted glass.

**Counters**
- Plain wood (hinoki or pine), 45–60 cm deep, with stools.
- Condiments are lined up on the counter.
- There's a cup and water pitcher.
- Bag hooks sit under the counter edge.

**Okonomiyaki shops (Osaka style)**
- Each table has a **built-in teppan griddle** (thick black steel, a raised lip and a wooden table edge).
- **Tools:** small metal spatulas (*kote/hera*), a sauce brush and pot, mayonnaise in a thin-nozzle
  squeeze bottle, aonori and katsuobushi shakers. The **bonito flakes "dance"** on the heat.
- **Interior:** often Showa-era: dark wood, celebrity autograph boards (*shikishi*), vintage beer
  posters, a TV showing baseball, beer crates.

**Ramen counters**
- A **ticket vending machine** at the entrance (buy, then hand over the ticket).
- One straight or L-shaped counter of 8–12 stools.
- An open kitchen behind:
  - steaming stockpots;
  - noodle baskets (*tebo*) dipped in boiling water;
  - a blowtorch for chashu.
- Staff in head towels.
- Condiments on the counter: pickled ginger, garlic, sesame, chili oil.
- **Ichiran-style solo booths:** wooden dividers with a bamboo blind in front.

**Soft-serve and Showa parlours**
- A **giant fibreglass soft-serve cone** stands outside the shop. It's a classic Japanese street sign.
- Chrome twist machines.
- A flavour board: matcha, Hokkaido milk, black sesame, purple sweet potato, yuzu, melon.
- **Kissaten / fruit parlour** look: melon cream soda (vivid green soda + ice-cream scoop + cherry),
  red velvet booths, stained glass, glass sugar pots.
- **American retro diner layer:** black/white checker floor, chrome-edged counter, red vinyl stools,
  a jukebox and a neon clock.

**Yellow Submarine (1968) look** ([S] Edelmann + [K])
- Flat, saturated colour fields.
- Art Nouveau curves.
- Pop-art and op-art patterns (concentric rings, wavy bands).
- Stylised flowers and stars, with black or coloured outlines.
- The deliberate "overload" of colour and pattern is the style.

**Abbey Road motif**
- A **zebra crossing** (white bars on grey asphalt).
- Four figures walking in a line, in silhouette.
- A tree-lined London street.
- A parked white Beetle car.

**Food halls (Umeda)**
- Department-store basements and station-mall "food halls": a ring of 6–10 stalls, each with a backlit sign
  and a sampuru case, around shared seating.
- Pager buzzers and tray-return stations.
- Bright, even lighting.

### (c) Design direction (one sub-section per interior)

> Cut-away rule for all interiors: the front wall is removed, and the section edge is shown as a 0.3 m dark band
> (`#2a2430`) with the floor slab visible. The back wall is L2, counters and tables are L3, and the front
> counter edges, stools and hanging lamps are L4 (blurred). Each interior is 10–16 m wide, so it fits
> one screen at the default zoom and pans slightly.

#### 4.1 Yellow Submarine Soft-Serve (Dotonbori; clerk Yuzu; the gang's ice-cream scene and Team Metallica's challenge)

| Layer | Contents |
|---|---|
| L2 back wall | The **inside of a submarine hull**: a curved riveted ceiling, **three big portholes** that are screens showing a psychedelic undersea (fish, bubbles, op-art waves), brass pipes, a periscope coming down from the ceiling, a pressure-gauge clock. Wall panels painted in flat **wavy Art-Nouveau bands** (yellow, orange, magenta, cyan) with stencilled stars and flowers. |
| L3 | **Counter** on the left with three chrome soft-serve twist machines, a cone dispenser, topping jars and a **sampuru case** of soft-serve and parfaits. **Booth seating** on the right: curved vinyl booths around round tables. A jukebox shaped like a sonar console. Floor: a checkerboard of yellow and black with a concentric op-art rug. |
| L4 | Stool tops, a hanging "SOFT CREAM" neon, a periscope eyepiece. **Outside the glass front:** a giant fibreglass soft-serve cone. |

- **Props (new):**
  - soft-serve machine;
  - sampuru parfait case;
  - booth set;
  - porthole screen;
  - periscope;
  - brass pipes;
  - sonar-jukebox;
  - giant cone sign;
  - waffle-cone stack;
  - topping jars.
- **Existing:** `icecream_stand` (exterior kiosk variant).
- **Signs:**
  - `ソフトクリーム / YELLOW SUBMARINE SOFT-SERVE`;
  - flavour board in English pun + JP:
    - `抹茶 / MATCHA-BOX` (Matchbox, Beatles cover);
    - `ゆず / YUZU NEED IS LOVE`;
    - `紫いも / PURPLE HAZE` (Hendrix);
    - `黒ごま / PAINT IT BLACK SESAME`;
    - `メロン / MELON COLLIE` (Smashing Pumpkins).
- **Palette:** sub yellow `#ffd21f`, hull shadow `#d99a10`, orange `#ff6b2c`, magenta `#e8318a`,
  cyan `#1fb5c8`, purple `#6c3fb5`, lime `#9be13c`, cream `#fff4d6`, outline `#1a1424`, brass
  `#c9a24a`, chrome `#d5dbe1`.
- **Light:** bright, even and candy-coloured, with the porthole screens as cyan light sources. When the punk enters,
  the lights flicker and a red emergency lamp ("dive alarm") spins. That gives a fun dramatic beat.
- **★ZOOM:**
  1. **Counter first-person**: choose a flavour from Yuzu. The machine twists the swirl.
  2. **Booth table**: the gang eats ice cream (table grammar). The door sits screen-right so the punk's entrance is
     framed.

#### 4.2 Abbey Road Okonomiyaki (Dotonbori)

| Layer | Contents |
|---|---|
| L2 back wall | Showa dark-wood walls; a row of **tanzaku menu strips** (dish names = Beatles songs, red prices); autograph *shikishi* boards; a vintage beer poster (no brand); a small TV with a baseball game (tiger-striped team, no logo); a **mural of four walking silhouettes on a zebra crossing** (generic figures, not portraits); sake bottles on a shelf. |
| L3 | A long **chef's teppan counter** at the back with the chef. Three or four **teppan tables** (4 seats each) with a griddle, a sauce pot, spatulas and squeeze bottles. A **zebra-crossing floor runner** from the door to the counter. Beer crates stacked as a side table. |
| L4 | Exhaust hoods with flexible duct pipes hanging over each table, a noren at the side door, an akachōchin glowing at the entrance. |

- **Menu strips:**
  - `カム・トゥゲザー焼き / COME TOGETHER (mix)`;
  - `ヒア・カムズ・ザ・サン / HERE COMES THE SUN (egg on top)`;
  - `タコの庭 / OCTOPUS'S GARDEN (tako)`;
  - `ゲット・バック / GET BACK (pork)`;
  - `サムシング / SOMETHING (chef's special)`.
  - Use titles only, never lyrics.
- **Props (new):**
  - teppan table;
  - chef counter griddle;
  - spatula set;
  - sauce pot;
  - mayo bottle;
  - aonori/katsuobushi shakers;
  - exhaust hood + duct;
  - tanzaku strip set;
  - shikishi boards;
  - wall TV;
  - beer crates;
  - zebra runner;
  - small white beetle-car model on a shelf (a hidden nod).
- **Existing:** `noren`.
- **Palette:** wood `#8a5a3a` `#b98a5e` `#5a3b25`, steel `#2b2b2e` `#4a4a50`, paper `#f4ecd8`,
  red ink `#c8281e`, lantern `#d93a2b`, warm lamp `#ffcf8a`, sauce `#4a2412`, mayo `#fff6d8`,
  aonori `#4e8a3a`, bonito `#d9a46a`, batter `#e8b86a`, zebra `#f2f2ee` on `#4a4d55`.
- **Light:** warm tungsten pendants. **Heat shimmer** over the griddles (2-frame wobble) and a steam puff on each flip.
- **★ZOOM:** **Table zoom** over the griddle. The okonomiyaki sizzles, the bonito flakes dance (2–3 frame
  loop), a mayo zigzag goes on, and friends sit at the sides.

#### 4.3 Ramen counter: `ラーメン / RAMONES RAMEN`

| Layer | Contents |
|---|---|
| L2 | Open kitchen: three steaming stockpots, a noodle-basket boiler, a chashu torch flare, wooden menu plaques, a punk-gig poster wall (black and white), a ventilation hood. |
| L3 | One straight counter of 8 stools; condiments in a caddy; water jug; bag hooks. **Ticket machine** at the door. Optional: two Ichiran-style solo booths with bamboo blinds at the end. |
| L4 | Noren with the shop name over the door, stool tops, steam drifting across the frame. |

- **Palette:** black `#16141c`, white `#f4f2ec`, red lacquer `#c8281e`, broth gold `#e6b34a`, steel `#a9b1bb`, steam `#ffffff` (40%).
- **★ZOOM:** **Counter first-person.** The bowl slides into the lower third and the chef is in the middle. Eating spicy
  food here is where the **Heat Tolerance** passive story can play.

#### 4.4 Umeda Food Hall (`フードホール / UMEDA FOOD HALL`, exists)
- **L2:** a ring of 6–8 stall fronts, each a mini facade with a backlit sign, sampuru case and pun name.
- **L3:** long communal tables, pager buzzers, a tray-return station, a water station.
- **L4:** pendant lamps and plants.
- **Stall puns:**
  - `カレー / CURRY ON MY WAYWARD SON` (the super-spicy curry for the Chilichick passive);
  - `スシ / SUSHI DREAMER`;
  - `天ぷら / TEMPURA TANTRUM`;
  - `クレープ / CRÊPES OF WRATH`;
  - `ソーダ / BOHEMIAN RHAP-SODA` (exists).
- **Palette:** bright and clean: white `#f4f2ec`, warm wood `#c99a68`, accent per stall from the neon set at low glow.
- **★ZOOM:** a table zoom at any communal table, plus counter first-person at the curry stall (the spicy-curry eating example in
  §7 of the bible).

### (d) Do / Don't
- **Do** put a **sampuru window** and a **noren** on every eatery. They are the instant "Japan restaurant" read.
- **Do** animate food: steam, sizzling, dancing bonito, cheese pulls. Zoom-ins live or die on food animation.
- **Do** keep each interior's identity in **one strong motif**: submarine hull, zebra crossing, punk black and white.
- **Don't** reproduce the Beatles' faces, the Abbey Road photo composition or the film's characters (no Blue
  Meanies). Use the visual *style* (flat psychedelic colour, Art Nouveau curves) and generic silhouettes.
- **Don't** light interiors with flat white. Use warm practicals plus one accent colour.
- **Don't** write song lyrics anywhere. Titles as names only (bible §10 originality rule).

---------------------------------------------------------------------------------------------------

## 5. Umeda Sky District + Tokonmon League HQ lobby

### (a) References
- [K] Umeda Sky Building (Hiroshi Hara, 1993; 173 m, 40 floors; twin towers joined at the top by the Floating Garden Observatory; the top was built on the ground and hoisted up; glass escalator tube across the void; *Takimi Koji* retro Showa food alley in the basement): https://en.wikipedia.org/wiki/Umeda_Sky_Building
- [K] Grand Front Osaka (2013 glass towers north of Osaka Station; plaza with water steps): https://en.wikipedia.org/wiki/Grand_Front_Osaka
- [K] HEP Five (red rooftop Ferris wheel, ~75 m diameter, top ~106 m above the street; red whale sculpture in the atrium) (verify): https://en.wikipedia.org/wiki/HEP_Five
- [K] Osaka Station (huge curved glass-and-steel roof over the platforms; clock plazas): https://en.wikipedia.org/wiki/Osaka_Station
- [K] Grand Green Osaka / Umekita Park (2024 park with big lawns and a large canopy roof next to Osaka Station) (verify): search "Grand Green Osaka Umekita Park canopy"
- [K] Expo 2025 (Sou Fujimoto's timber Grand Ring): https://en.wikipedia.org/wiki/Expo_2025
- [K] Tokyo International Forum (ship-hull glass atrium, a model for a vast future lobby): https://en.wikipedia.org/wiki/Tokyo_International_Forum
- [K] Esports / game-company HQ lobbies (search): "Riot Games campus lobby statue", "Blizzard Irvine orc statue entrance", "Pokémon Center Mega Tokyo Mega Charizard statue". These are the "giant mascot statue + trophy wall" lobby language.
- [K] *Pokémon Sword/Shield* Wyndon and Rose Tower, *Pokémon X/Y* Lumiose (game-world league HQs): search the game wikis for screenshots.

### (b) Study notes

**Umeda Sky Building**
- Two slim towers, clad in **reflective glass and aluminium panels**, silver by day and mirroring the sky.
- A **bridge-and-ring structure at the top** joins them.
  - A **circular void** cut through the joining floors makes a giant "window" to the sky.
  - The rooftop is an open-air ring walk (the *Sky Walk*). At night its floor glows with luminous stones.
- **Escalators** cross the open air between the towers inside glass tubes, a striking diagonal line.
- At the base: gardens, and in the basement the **Takimi Koji** alley, a recreated early-Showa street of
  restaurants. It's a perfect reference for retro signage indoors.

**Umeda as a whole**
- Elevated **pedestrian decks** link the stations and malls.
- Giant department stores.
- The **red Ferris wheel** on a fashion mall (HEP Five).
- Osaka Station's vast **curved roof**.
- Glass towers with **stepped plazas and water features** (Grand Front).
- The newest layer is a **big green park** in the middle of the business district (Umekita).

**Futurism precedent**
- Expo 2025's Grand Ring, a huge ring of wooden posts and beams with traditional joinery and a walkable roof
  deck. Osaka's future is **timber + glass + green**, not chrome-only.

**Esports / League HQ**
- Lobbies tell a story with:
  - **giant statues** of mascots or heroes;
  - **trophy walls**;
  - **live LED rankings**;
  - **sweeping staircases** and ceiling-hung banners;
  - a dramatic **reception desk** as a sculptural monolith;
  - **security gates** with glass flaps;
  - a **merch store** corner.
- Pokémon League buildings in the games are symmetrical and ceremonial: a central axis to the
  battle doors.

### (c) Design direction

**Street strip: Umeda Sky District**

| Layer | Contents |
|---|---|
| L0 | Clear blue sky with high cirrus; at night a deep blue with tower aviation lights blinking red. |
| L1 | The **twin "Sky Gate" towers** joined by a **floating ring garden** (an original twin-tower design inspired by the Sky Building: mirror glass, a ring void at the top, a glass escalator tube crossing between them). A **red Ferris wheel** on a mall roof. A huge **curved station roof**. 2050 towers with vertical gardens and a timber-lattice crown (a Grand Ring descendant). A maglev line on a viaduct, drones and hovercar lanes. |
| L2 | **League HQ facade** (centre): a glass atrium behind vertical **LED fins**, a giant league emblem, a **holographic champion Tokonmon** looping above the entrance, and a grand staircase. Either side: a Grand Front-like glass mall with a stepped water cascade, and the `HOTEL KANSAI-FORNIA` and `SKY CAFÉ` buildings. |
| L3 | A wide **plaza**: paved (`P`) with a lawn strip (Umekita park); benches; kiosks; a bus stop; the skybridge stairs to the stadium; a bank/ATM (`ELEMON BANK` to be renamed `TOKONMON BANK`). |
| L4 | Glass deck railings, planters, a hovercar passing, banner flags on poles. |

- **Props:**
  - **existing:** `umeda_sky`, `ferris_wheel`, `league_hq_sign`, `holo_billboard`, `hovercar`,
    `drone`, `bus_stop`, `bench`, `fountain`, `flowerbed`, `streetlamp`, `traffic_light`, `vending`;
  - **new:**
    - glass deck railing;
    - LED fin facade module;
    - water-step cascade;
    - maglev viaduct;
    - banner flag pole;
    - timber-lattice canopy;
    - skybridge;
    - league emblem;
    - holo-statue projector.
- **Signs:**
  - `トコンモンリーグ関西 / TOKONMON LEAGUE KANSAI` (replaces `ELEMON LEAGUE KANSAI`);
  - `梅田駅 / UMEDA STA.`;
  - `スカイゲート展望台 / LUCY IN THE SKY OBSERVATORY` (Beatles; Lucydiamond nod);
  - `ヒア・カムズ・ザ・サン広場 / HERE COMES THE SUN PLAZA`;
  - mall: `グランドフロント2050 / GRAND FRONT 2050` (exists);
  - the existing hotel and café signs.
- **Palette (day):**
  - sky `#8fd0ff`;
  - mirror glass `#9cc8e8` / `#5d8fb8` / sky-reflection `#cfe8ff`;
  - aluminium `#c7ced6`;
  - white stone `#eef0f0`;
  - timber `#c99a68`;
  - lawn `#6fb24a`;
  - Ferris red `#d83a3c`.
- **League brand:** navy `#141a3a`, electric cyan `#3ff0ff`, gold `#f2c24c`, magenta accent
  `#ff4ac8`, white `#f4f6fb`.
- **Lighting:**
  - **Day:** crisp, with sky reflections in the glass. The mirror facades show a scrolled, simplified copy of L0.
  - **Golden:** the towers flare orange.
  - **Night:** the ring garden glows (a halo of light at the top of the towers), the LED fins play the league
    colours, and the hologram is the brightest thing on screen.

**League HQ lobby (cut-away interior)**

| Layer | Contents |
|---|---|
| L2 back wall | Triple-height atrium. A huge **LED rankings wall** (scrolling ladder of trainers, the player's rank updating live). Ceiling banners for the **Elite Four** (a marching-band, Sgt.-Pepper-style military-coat motif, original emblem) and the **Champions** (a crest with a crowned lion pose, original, not Queen's crest). A grand staircase/escalator up to the stadium skybridge. |
| L3 | **Reception desk** (a sculptural curved monolith, white stone with a cyan light seam, Ms. Aoi behind it); registration kiosks; **security gates** with glass flaps; a **hologram pit** in the floor (a rotating 3D Tokonmon from the current champion team); trophy cases; lounge sofas; a merch corner (`TOKONMON GOODS`). |
| L4 | Glass gate flaps, potted plants, a hanging league banner edge, stanchion ropes. |

- **Props (new):**
  - reception monolith;
  - kiosk;
  - glass security gate;
  - hologram pit;
  - trophy case (with league trophies);
  - LED ranking wall;
  - banners;
  - lounge sofa;
  - stanchions;
  - merch shelf.
- **Existing:** `holo_billboard`, `flowerbed`, `bench`.
- **Palette:** floor polished white `#eef0f4` with cyan reflections; walls navy `#141a3a`; gold trim
  `#f2c24c`; cyan seams `#3ff0ff`; hologram `#7ff6ff` at 50% with scanlines.
- **Lighting:** cool, bright and ceremonial. Skylights cast a downward light-shaft column on the hologram
  pit, and the rankings wall throws a coloured glow onto the floor.
- **★ZOOM:**
  1. **Reception first-person**: League registration with Ms. Aoi (story beat 7). Her desk is in the lower third, she is in the middle, and the
     rankings wall glows behind her.
  2. **Rankings wall close-up** after each ranked win.

### (d) Do / Don't
- **Do** make the twin-tower-plus-ring silhouette the district's skyline signature. It is Osaka's most
  futuristic real building, so lean into it, transformed.
- **Do** mix timber, glass and greenery for 2050. The Expo Grand Ring proves Osaka's future is warm.
- **Do** keep the HQ symmetrical and ceremonial, with a clear axis from entrance to desk to stairs.
- **Don't** use the Pokémon League logo, the Riot or Blizzard statues, or Queen's real crest.
- **Don't** make the lobby a generic sci-fi white box. Add Osaka warmth: timber ceiling slats, plants,
  a Showa-retro food alley in the basement (a Takimi Koji nod, reached by escalator).

---------------------------------------------------------------------------------------------------

## 6. High-tech stadium (battle arena: rocky / grassy / water floors)

### (a) References
- [K] *Super Smash Bros. Melee*, "Pokémon Stadium" stage: a giant screen announces a type, then the floor rebuilds into Fire/Water/Grass/Rock layouts. *Brawl*'s "Pokémon Stadium 2" (Electric/Ground/Ice/Flying) **is the closest existing reference for a transforming battle floor**: https://en.wikipedia.org/wiki/Super_Smash_Bros._Melee
- [K] *Pokémon Stadium* (N64 arenas): https://en.wikipedia.org/wiki/Pok%C3%A9mon_Stadium
- [K] *Pokémon Colosseum* (Orre stadiums, crowd and announcer framing): https://en.wikipedia.org/wiki/Pok%C3%A9mon_Colosseum
- [K] *Pokémon Battle Revolution* (themed colosseums: Gateway, Main Street, Waterfall, Magma, Sunny Park, Neon, Crystal, Sunset, Courtyard, Stargazer): https://en.wikipedia.org/wiki/Pok%C3%A9mon_Battle_Revolution
- [K] *Pokémon Sword/Shield* gym stadiums (football-stadium battles, crowd chants, Dynamax): search the "Galar gym stadium" wiki.
- [K] League of Legends World Championship (2017 Beijing AR Elder Dragon; team booths flanking a central stage; LED backdrop; trophy plinth): https://en.wikipedia.org/wiki/League_of_Legends_World_Championship
- [K] Cirque du Soleil *O* (Bellagio): a stage that changes from a deep pool to a dry floor on perforated hydraulic lifts. This is the **real-world reference for the water arena**: https://en.wikipedia.org/wiki/O_(Cirque_du_Soleil)
- [K] *The House of Dancing Water* (Macau; pool stage with lifts): https://en.wikipedia.org/wiki/The_House_of_Dancing_Water
- [K] Sapporo Dome (the grass pitch **hovers in and out** of the stadium on air cushions): https://en.wikipedia.org/wiki/Sapporo_Dome
- [K] State Farm Stadium (natural-grass field tray rolls outside): https://en.wikipedia.org/wiki/State_Farm_Stadium
- [K] Tottenham Hotspur Stadium (split grass pitch slides away to reveal a second surface): https://en.wikipedia.org/wiki/Tottenham_Hotspur_Stadium
- [K] Allianz Arena (ETFE cushion facade lit in any colour): https://en.wikipedia.org/wiki/Allianz_Arena
- [K] Tokyo Dome (air-supported white roof): https://en.wikipedia.org/wiki/Tokyo_Dome · Kyocera Dome Osaka (silver disc roof; Osaka's own dome): https://en.wikipedia.org/wiki/Kyocera_Dome_Osaka
- [K] Sphere, Las Vegas (fully LED exterior): https://en.wikipedia.org/wiki/Sphere_(venue) · SoFi Stadium (double-sided oval "Infinity Screen"): https://en.wikipedia.org/wiki/SoFi_Stadium
- [K] Jumbotron: https://en.wikipedia.org/wiki/Jumbotron

### (b) Study notes

**Arena anatomy (NBA / football / esports)**
- A **centre-hung video cube** or end-wall mega screen.
- **LED ribbon boards** running around the fascia between tiers. These are the wipes of colour.
- **Pitch-side LED perimeter boards.**
- Lighting rigs on the roof truss.
- **Tunnel entrance** with pyro and CO₂ jets.
- Team benches or **booths** on both sides. In LoL these are glass booths facing each other across the stage.
- **Press row** tables along the side.
- **Photographers** kneeling at the baseline.
- **Camera crew:**
  - handheld camera operator + cable puller;
  - **jib/crane** sweeping over the crowd;
  - **rail-cam dolly** along the front edge;
  - **cable-cam** flying overhead.
- A **sideline reporter** with a microphone in front of a sponsor-logo "step-and-repeat" backdrop for interviews.
- A **commentator booth** high up behind glass.

**Crowds**
- Coloured seating in team colours.
- **Card mosaics.**
- Phone flashlights at night events.
- Flags and towels twirled.
- Cheering waves that travel around the bowl.

**Esports staging**
- A dark auditorium with all light on stage.
- Giant LED backdrop.
- **AR creatures** flying over the crowd (LoL 2017's dragon).
- Confetti cannons at the win.

**Transforming floors (real tech)**
- **O / House of Dancing Water:** perforated lift platforms rise and the pool drains
  through them. The stage goes from a lake to dry land in seconds, with water streaming off the edges.
- **Sapporo Dome:** an entire grass pitch glides in through a giant opening.
- **Tottenham:** the pitch splits into three trays that slide under the stand, revealing a different
  surface below.
- **Smash Pokémon Stadium:** a screen shows the type, then platform pieces rearrange into type
  terrain. It reads instantly because the **screen announces it first**.

**Osaka flavour**
- Kyocera Dome's silver UFO-like stepped roof.
- Tokyo Dome's white air-supported roof.
- Allianz Arena's glowing cushion skin as the exterior.

### (c) Design direction

**Exterior (L1 landmark in Umeda).** A **disc-shaped dome** with a stepped silver roof (a Kyocera
nod) wrapped in a **pixel-LED cushion skin** (an Allianz/Sphere nod) that shows the current match's
element colours and the league emblem. Name suggestion: `ロック・ユー・ドーム / ROCK YOU DOME` (a
Queen nod for the Champions' home), optional.

**Interior stage set.** The camera looks **across** the arena from the broadcast side (like Pokémon
Stadium or a fighting game). Trainers stand on podiums at left and right. Tokonmon fight on the floor
between them.

| Layer | Contents |
|---|---|
| L0 | The roof: a truss with moving-head light rigs, a **centre-hung jumbotron cube** (live feed of the fight, replays, the arena-type announcement, crits), and an opening roof showing the sky at night matches. |
| L1 | **Upper tiers of crowd** (sprite cards, 3–4 frame cheer loops, card mosaics spelling the trainer's name), **LED ribbon boards** across each tier fascia, the commentator booth behind glass (announcer visible), the VIP box. |
| L2 | **Lower stands** close enough to read faces. The **tunnel mouth** with CO₂ jets. The **trainer podiums**: elevated platforms with holographic UI rings (left = player, right = opponent), glowing in each team's colour. **Press row** with reporters typing. |
| L3 | The **arena floor**: a 14–16 m hex-panel field with a glowing perimeter ring, which **transforms** (below). The battle circle `r ≈ 6–8` sits here (`MAPS.md` arenas). |
| L4 | **Camera crew** (handheld op crouching, rail-cam dolly sliding along the front edge), **photographers**, pitch-side **LED perimeter boards**, the sideline reporter, and the backs of the front-row crowd's heads. Tilt-shift blur heavy. |

**The changing floor (rocky / grassy / water).** Build the floor from **hexagonal columns about 1 m wide**
on hydraulic pistons (the O/Tottenham logic in a modular form). Each column has **three faces on a
rotating drum**, rock, turf and a perforated grate, and can rise or sink.

| Floor | Look | What rises / changes | Palette |
|---|---|---|---|
| **Rocky** | Cracked sandstone and basalt slabs, dust, gravel | Columns rise to **staggered heights** (0–1.5 m) as rock pillars and boulders, giving cover and high ground; dust puffs from seams | `#8f7a62` `#b59a76` `#5a4a3c` `#3e342c` dust `#d9c3a0` |
| **Grassy** | Lush turf, tall-grass tufts, flowers, a small tree or two | Columns **flip** to turf; folded **bushes and trees unfold** from hatches (paper-pop-up feel); petals or seeds burst | `#4f8f38` `#6fb24a` `#b4d96a` `#2c5a2b` flowers `#ffb6cb` `#fff0a6` |
| **Water** | A shallow-to-deep pool with floating stepping platforms and lily pads | Columns **sink**, perforated grates face up, the pool fills from **jets at the rim** (fountain arcs); a few columns stay as islands; ripple and caustic shader | `#2c84bf` `#4fb4e2` `#a6e6ff` foam `#e8fbff` deep `#1a4f80` |

**Transformation sequence** (at the start, and again **at halftime**, synced to the music beat)

| Beats | What happens |
|---|---|
| 1 | Lights dip. The jumbotron flashes the **chosen type icon** with a 3-2-1 countdown, and the announcer calls it. |
| 2 | **LED ribbons wipe** around the bowl in the element colour. The crowd roars and the card mosaic flips. |
| 3 | The **floor seams glow** and the hex columns unlock with an audible clack. |
| 4 | A **ripple of transformation travels from the centre outward**: column by column, each one rising, sinking or flipping on twos (2–3 frames each), with a 1-frame delay per ring. This domino wave is the money shot. |
| 5 | A burst of **steam / dust / spray** hides the seams; terrain props rise or fill (rock pillars shed debris, trees unfold, water jets arc). |
| 6 | Final settle. Confetti or petals or spray drift, and the camera does a quick push-in onto the trainers. |

At halftime, add a short **halftime show** on the jumbotron and the LED skin while the floor runs the
sequence to the new type.

**Props (new, all need building)**
- hex arena column (3-face drum);
- rock pillar set;
- pop-up tree and bush;
- water jets;
- floating platforms;
- trainer podium with holo-ring;
- LED perimeter board;
- jumbotron cube;
- ribbon board segment;
- tunnel with CO₂ jets;
- commentator booth;
- press desk;
- camera-crew sprites (handheld, jib, rail dolly);
- photographers;
- step-and-repeat backdrop;
- crowd sprite cards (team colours, card mosaic, phone lights);
- confetti cannon.

**Existing:** `stadium` (exterior), `holo_billboard`, `barrier`.

**Lighting**
- **Intro:** a dark bowl with **beam sweeps** and the spotlight on each trainer as they walk out of the tunnel.
- **Match:** bright white flood key (`#f4f6ff`, overhead) with **element-colour washes** from the
  LED ribbons.
- **Crits / ultimates:** strobes and a jumbotron zoom-in.
- **Bonding:** an aura light on the trainer's podium.
- **Night matches:** the roof opens to the stars and the crowd's phone lights twinkle.

**Base palette**
- bowl navy `#10152b` / `#1c2340`;
- seats `#2a3560` with team-colour blocks;
- LED cyan `#3ff0ff` / magenta `#ff4ac8` / gold `#f2c24c`;
- floor ring `#3ff0ff`.

**★ZOOM spots**
1. **Trainer podium** (over-the-shoulder; the phone is the controller).
2. **Post-match interview** with the sideline reporter in front of the step-and-repeat, with camera-crew flashes.
3. **Commentator booth** (cutscene).

### (d) Do / Don't
- **Do** announce every transformation on the jumbotron first. Readability first, spectacle second.
- **Do** make the domino ripple of columns the signature visual, and sync it to the beat (bible: music sync).
- **Do** keep the floor's three looks clearly distinct in **value and hue**: rocky = warm mid-browns,
  grassy = greens, water = blues.
- **Do** show the press and camera crews physically. The bible wants reporters, not just a UI.
- **Don't** copy the Smash/Pokémon Stadium layouts or the Poké Ball floor emblem. Use the original hex grid
  and the league emblem.
- **Don't** let crowd animation steal attention. Crowds are 3–4 frame loops in L1/L2 with lower contrast
  than the fighters.

---------------------------------------------------------------------------------------------------

## 7. Shinsekai (street, dojo, onsen, arcade, shops, Team Metallica back alley)

### (a) References
- [K] Shinsekai (built in 1912: north half modelled on Paris, south half on Coney Island's Luna Park; Showa-retro district): https://en.wikipedia.org/wiki/Shinsekai
- [K] Tsūtenkaku (current tower from 1956, ~103 m; observation deck; Billiken statue upstairs; big vertical neon ad on its side; top lights said to signal the weather) (verify): https://en.wikipedia.org/wiki/Ts%C5%ABtenkaku
- [K] Billiken (1908 "god of things as they ought to be"; pointed head, sly smile; rub his soles for luck): https://en.wikipedia.org/wiki/Billiken
- [K] Kushikatsu (Shinsekai's dish; shared sauce, "no double dipping"): https://en.wikipedia.org/wiki/Kushikatsu
- [S] Kushikatsu Daruma sign (glaring chef): https://jp.openrice.com/en/osaka/article/this-is-dotonbori-top-12-gourmet-signboards-a25
- [S] Zuboraya also had a Shinsekai branch with a fugu lantern (closed 2020); Spa World's operator offered to rehome the Dotonbori lantern: https://soranews24.com/2020/08/29/osakas-giant-pufferfish-may-be-saved-by-neighboring-business/amp/ · https://japon-secreto.com/zuboraya-restaurante-shinsekai-dotonbori-osaka-cierra/
- [K] Shōtengai (covered shopping streets such as Janjan Yokocho): https://en.wikipedia.org/wiki/Sh%C5%8Dtengai
- [K] Abeno Harukas (300 m tower visible from Shinsekai): https://en.wikipedia.org/wiki/Abeno_Harukas
- [K] Dojo: https://en.wikipedia.org/wiki/Dojo · Kamidana: https://en.wikipedia.org/wiki/Kamidana · Shimenawa: https://en.wikipedia.org/wiki/Shimenawa · Makiwara: https://en.wikipedia.org/wiki/Makiwara
- [K] Sentō (bathhouse murals of Mt Fuji, tiled baths, lockers): https://en.wikipedia.org/wiki/Sent%C5%8D · Onsen: https://en.wikipedia.org/wiki/Onsen
- [K] Claw machine (UFO catchers): https://en.wikipedia.org/wiki/Claw_machine · Purikura: https://en.wikipedia.org/wiki/Purikura · Taiko no Tatsujin: https://en.wikipedia.org/wiki/Taiko_no_Tatsujin
- [K] Pachinko (parlour facades, LED and sound walls): https://en.wikipedia.org/wiki/Pachinko
- [K] Amerikamura (Osaka's street-culture district: graffiti, record shops, vintage): https://en.wikipedia.org/wiki/Amerikamura
- [K] Search: "Spa World Osaka Asian European zones", "Janjan Yokocho shogi parlour", "Shinsekai Kokusai Gekijo hand-painted signboards", "Shinsekai smart ball shateki", "Kerorin yellow bucket sento", "Disk Union record store interior".
- [K] *Yakuza* series retro arcades and back alleys; *Persona 5* (Shibuya back alleys, the record-strewn café): https://en.wikipedia.org/wiki/Persona_5

### (b) Study notes

**Street**
- **Tsūtenkaku** stands over the central crossing, a steel tower on a **four-legged base**.
  - Its shaft is lit in neon, with a long **vertical sponsor sign** down one side.
  - Its top light changes colour (said to be a weather forecast; verify the codes).
  - The tower base ceiling has a **painted peacock/flower mural** (verify).
- **Tsutenkaku Hondori** runs from the tower under a **lit arch gate** into a shotengai.
- Facades are low (2–4 storeys) and **maximalist**:
  - giant 3D fugu;
  - giant hands holding kushikatsu;
  - dragons;
  - golden **Billiken statues** at every second shop;
  - glaring-chef signs;
  - rows of red lanterns;
  - **hand-painted movie billboards** on an old cinema (verify).
- **Kushikatsu shops** open onto the street: long counters with stools, steel sauce trays with
  "二度漬け禁止" (no double dipping) signs, and cabbage in bowls.

**Janjan Yokocho**
- A narrow, roofed alley (~180 m) of tiny eateries and **shogi/go parlours** where old men play
  behind open windows.
- Low ceilings, fluorescent light, awnings and handwritten signs.

**Game culture**
- **Shateki** (cork-gun shooting galleries) and **smart ball** (old pinball-like bagatelle).
- Retro arcades with white candy-cabinet machines.

**Spa World**
- A big hot-spring theme complex with **Asian and European-themed bath zones** (swapped monthly by
  gender) and a rooftop pool.
- In general, a sentō/onsen has:
  - **noren** marked ゆ (*yu*), indigo for men and red for women;
  - a shoe locker with wooden keys;
  - a changing room with wicker baskets and an old scale;
  - **washing stations** with low stools, mirrors, taps and **yellow plastic buckets**;
  - **tiled baths** and a **Mt Fuji mural** on the back wall (a sentō tradition);
  - outdoor **rotenburo** with rocks, bamboo fence and cedar;
  - **coffee milk** in a fridge;
  - massage chairs;
  - a tatami rest area.

**Dojo**
- **Floor:** a polished wooden *itanoma* (kendo) or **tatami** (judo/aikido).
- **Shōmen / kamiza** (front wall of honour):
  - a **kamidana** shelf shrine (unpainted hinoki, a small shrine box, a sakaki branch in vases, white
    *shide* paper zigzags);
  - a **shimenawa** straw rope;
  - **calligraphy scrolls** (dōjō-kun rules; words like 心技体 *shin-gi-tai* "mind, technique, body" and 絆
    *kizuna* "bond").
- A **name-plaque board** (*nafudakake*) listing members on wooden tags in rank order.
- Weapon racks (bokken, shinai), a **makiwara** striking post, a taiko drum used to start class,
  shoji screens, and an engawa onto a garden.
- Shoes come off at the genkan step.
- **Light:** soft daylight through shoji, warm wood and calm order.

**Arcade (game centre)**
- The **ground floor is crane games** in bright pink and white cabinets with LED trim and plush
  prizes.
- Upper floors hold **rhythm games**: drums, "washing-machine" circular touch cabinets, dance
  pads, DJ turntable cabinets.
- Also:
  - a **purikura** photo-booth zone, curtained, with pastel models on the curtains;
  - medal-pusher games;
  - retro cabinets in the basement.
- Dark ceilings. **Light comes from the machines**, carpet with neon patterns and a wall of sound.

**Shops**
- **Accessory/bling shop:**
  - glass showcases on black velvet;
  - mirrors;
  - spotlights making gold sparkle;
  - rotating ring trays;
  - grillz displayed on a jaw bust;
  - soul stones in a lit case.
- **Goods shop with vinyl/discs** (record-store language):
  - **wooden crates (bins)** of LPs with divider cards by genre;
  - LP sleeves pinned face-out on the walls;
  - a **listening station** with headphones and a turntable;
  - a counter with a till;
  - handwritten staff-pick cards;
  - posters;
  - a **7-inch singles rack**.
  - The game's skill **discs** sit here, sorted by element.

**Back alley (Team Metallica turf)**
- Corrugated **shutters covered in graffiti** (tags, throw-ups, stickers).
- **Pachinko parlour** backs: service doors, a blazing LED sign on the front corner, AC units, a cable
  tangle.
- Oil drums, a chain-link fence, a fire escape.
- **Metal gig posters** layered and torn.
- A puddle reflecting neon, a flickering sodium lamp, a vending machine, crates.
- **Stray cats** (Moshi feeds them).

### (c) Design direction: street strip

| Layer | Contents |
|---|---|
| L0 | Dusk sky gradient (Shinsekai's best hour is dusk into night); a bright moon. |
| L1 | **Abeno Harukas-like** 300 m tower glass silhouette to the right; Spa World-like dome building; the trees of Tennoji Park. |
| L2 | **Tsūtenkaku-like tower** (`tsutenkaku`, an original design: steel lattice + neon shaft + an original sponsor sign) straddling the street at centre; **arch gate** `新世界 SHINSEKAI` (exists) over the shotengai entrance; low facades with giant 3D signs: fugu, kushikatsu hands, dragon, glaring chef; a **hand-painted movie billboard** cinema; the covered mouth of **Janjan Yokocho**; doors to the dojo, onsen, arcade and shops. |
| L3 | Street (cobbles + asphalt) with **open-front kushikatsu counters**, a shateki stall, a smart-ball corner, **original lucky-god statues** (`lucky_statue`) everywhere, bicycles, a delivery scooter, vending. |
| L4 | Strings of red lanterns, the arch's bulb border, a lucky-god statue in the foreground, crates of beer bottles. |

**Lucky-god statue.** It replaces Billiken: an original chubby "god of things as they should be".
Give it a **different head shape** (a flame-tip or onion-dome topknot), sitting cross-legged with
upturned soles (keep the "rub the soles" ritual), gold `#d8a53a`.

**Street signs**
- `串カツ / FRIED ZEPPELIN` and `KUSHIKATSU KISS` (both exist).
- `タワーみやげ / TOWER GIFTS` (exists).
- `新世界1912 喫茶 / SHINSEKAI 1912 KISSATEN` (exists).
- `射的 / SHOT THROUGH THE HEART` (Bon Jovi, shooting gallery).
- `スマートボール / SMOOTH OPERATOR`.
- Cinema: `新世界劇場 / PURPLE RAIN DOUBLE FEATURE` with a painted poster of an original monster movie.

**Palette (dusk / night)**
- tower steel `#b7bcc4` / neon shaft `#3ff0ff` + `#ff4ac8`;
- lantern red `#d83a3c`;
- bulb warm `#ffd27a`;
- Showa signboard yellow `#ffd23f`;
- facade tile `#e9e2d6`;
- dark wood `#5a3b25`;
- lucky-god gold `#d8a53a`;
- sky `#3a3f8f` → `#f08a7a`.

#### 7.1 Dojo interior: `虎の目道場 / EYE OF THE TIGER DOJO` (Master Genryu)

| Layer | Contents |
|---|---|
| L2 | Shōmen wall: **kamidana** with sakaki and shide, a **shimenawa** rope, **calligraphy scrolls** (心技体, 絆), and a big **name-plaque board** (nafudakake). The plaque board is the **in-world roster display**, with Tokonmon names on wooden tags (matches bible: the dojo is "where you see your roster"). |
| L3 | **Tatami** training floor (tiles `m`) with a wooden edge walk; `wooden_dummy`, `training_dummy`, `punching_bag`, `target_post`; makiwara; weapon rack; taiko on a stand; a meditation cushion facing the open **engawa**. |
| L4 | Shoji frames, the genkan step with shoes lined up, a hanging lamp. |

- **Meditation spot** (for the Harrisun evolution: "dojo meditation, then sunrise"):
  - the engawa opens east onto a small **raked-gravel garden** (tile `r`) with a stone lantern and a
    maple;
  - at the sunrise beat, shoji glow gold and light shafts cross the tatami.
- **Palette:**
  - tatami `#c9c27a` (aged) / `#a9b86a` (fresh);
  - tatami border cloth `#2a3550` with gold `#c9a24a`;
  - hinoki `#e3c495`;
  - dark beams `#6b4a2b`;
  - shoji paper `#f4efe2`;
  - sumi ink `#1b1a19`;
  - shimenawa straw `#d4b56a`;
  - sakaki `#2f6a3a`;
  - sunrise shaft `#ffd98a`.
- **Lighting:** soft, diffused daylight through shoji (no hard shadows indoors), a warm lamp at night,
  a gold sunrise at the meditation beat.
- **★ZOOM:**
  1. **Meditation cushion** (side view, sunrise through the shoji).
  2. **Roster plaque board** close-up.
  3. **Training bench** with Master Genryu (table grammar for swapping passives).

#### 7.2 Onsen interior: `スモーク・オン・ザ・ウォーター 銭湯 / SMOKE ON THE WATER` (exists)
- **Cut-away split in three rooms left to right:**
  1. **Entrance and lobby:** ゆ noren, shoe lockers with wooden keys, a ticket counter, a coffee-milk fridge,
     massage chairs.
  2. **Bath hall:** washing stations with stools, mirrors and yellow buckets; a tiled bath; a giant **mountain
     mural** (an original Fuji-like volcano with a Tokonmon sky whale in the clouds); a steam layer.
  3. **Rotenburo outdoors:** rock pool, bamboo fence, cedar, a stone lantern, night sky.
- **Palette:**
  - hinoki `#e7c999`;
  - stone `#8d8a83` / `#b4b0a6`;
  - water `#6fc7c0` → milky `#dfe9e4`;
  - tile blue `#5a8fb8` / white `#eef4f8`;
  - mural blue `#3d6fb0`;
  - noren indigo `#2a3a6b` / red `#c43a3a`;
  - bucket yellow `#f2c53d`;
  - steam `#ffffff` at 30%.
- **Lighting:** warm interior lamps diffused by steam (bloom up), with moonlight and lantern glow
  outdoors.
- **★ZOOM:**
  1. **Soaking in the bath with your Tokonmon** (two-shot, steam, a reflection on the water).
  2. **Coffee-milk** fridge first-person.
- Keep it wholesome: characters shoulders-up in water, towels on heads, lots of steam.

#### 7.3 Arcade: `スメルズ・ライク・ティーン・スピリット / SMELLS LIKE TEEN SPIRIT ARCADE` (exists)
- **L2:** a wall of rhythm-game cabinets (a drum game, a circular touch cabinet, a DJ deck cabinet) and a `HI-SCORE 999999`
  board (exists).
- **L3:** two rows of **crane cabinets** (`UFO CATCHER`, exists) with Tokonmon plush, a purikura curtain booth,
  a medal pusher, a retro cabinet corner.
- **L4:** the backs of cabinets, a change machine, the stair rail.
- **Palette:**
  - ceiling `#0d0b18`;
  - carpet `#2a1b4a` with a neon squiggle pattern;
  - crane cabinet `#ff7ac8` / `#f6f3ff`;
  - screens `#3ff0ff`;
  - LED trims from the neon keys.
- **Lighting:** no ceiling lights. Every machine is a light source with attract-mode colour cycling.
- **★ZOOM:**
  1. **Crane game first-person** (claw view through the glass).
  2. **Rhythm cabinet** (Echo-element flavour).

#### 7.4 Shops
- **Bling shop** (`BLING ★ SOUL STONES` / `GRILLZ & THRILLZ`, both exist):
  - black velvet `#1a1420`, gold `#f2c24c`, glass highlights `#eafcff`, mirror strips;
  - spotlit showcases of **watches, earrings, badges, hair clips, grillz and soul-stone cosmetics**
    (bible §8 cosmetics);
  - **special eyeballs for Ecto Tokonmon** in a creepy-cute jar case.
  - **★ZOOM:** counter first-person, with the showcase tray in the lower third.
- **Goods / record shop:** `レボルバー・レコード / REVOLVER RECORDS` (new; a Beatles album about spinning).
  - **Walls:** LP sleeves face-out, a 7-inch rack, posters.
  - **L3:** **wooden crates** of discs with element divider cards (Pyro/Hydro/Bio/Geo/Echo…), a **listening
    station**, a till counter.
  - The skill **discs** look like vinyl with element-coloured labels (they can spin: `spin` part).
  - **Palette:** crate wood `#a8744a`, warm tungsten `#ffcf8a`, sleeves in a riot of flat colours, vinyl
    black `#16141c` with grooves `#3a404c`.
  - **★ZOOM:** a listening station first-person (headphones on, the disc spins, the skill preview plays).
  - Also keep `LUCKY GOODS`, `KANSAI CALLING SUPPLIES` and `PAPERBACK WRITER BOOKS` as neighbours (existing).

#### 7.5 Team Metallica back alley

| Layer | Contents |
|---|---|
| L0 | A strip of night sky between buildings, with the tower's neon peeking over the roofs. |
| L2 | **Graffiti-covered shutters** (original tags; one big piece of a skull with horns made of guitar heads), the back of the **pachinko parlour** (`RIDE THE LIGHTNING パチンコ`, exists) with its LED corner sign bleeding light into the alley, a `MASTER OF PUPPETS PAWN 質屋` (exists) back door, layered metal gig posters, a fire escape, AC units, a cable tangle, `TEAM METALLICA NO TRESPASSING` (exists). |
| L3 | Wet asphalt with **puddles reflecting neon**, oil drums (one with fire at night), crates, a beat-up scooter, a vending machine, a chain-link fence with a gap, the gang's hangout couch, **stray cats + food bowls** (Moshi's spot). |
| L4 | Dripping pipes, a flickering sodium lamp, a chain-link fence edge, trash bins. |

- **New pun signs:**
  - `シーク&デストロイ スクラップ / SEEK & DESTROY SCRAP`;
  - `サッド・バット・トゥルー ローン / SAD BUT TRUE LOANS`;
  - `キル・エム・オール食べ放題 / KILL 'EM ALL-YOU-CAN-EAT`.
- **Palette:**
  - asphalt `#2b2a2e`;
  - wet sheen `#4a4f6a`;
  - rust shutter `#6b4b3a` / `#8a6a52`;
  - graffiti lime `#b6ff3c` / pink `#ff3fa4` / chrome `#d5dbe1` / black outline `#111`;
  - pachinko red `#ff3b4f`, yellow `#ffe45c`, green `#5dff9a`;
  - sodium lamp `#ffb35c`;
  - poster paper `#e8e0cf`.
- **Lighting:** a sodium-orange key, with a pachinko-LED colour spill that changes every few seconds and an oil-drum fire flicker.
  This is the moodiest scene: high contrast, deep shadows.
- **★ZOOM:**
  1. **Feeding the stray cats with Moshi** (crouched two-shot; the befriend route).
  2. **The gang couch** confrontation.

### (d) Do / Don't
- **Do** make Shinsekai **warmer and older** than Dotonbori: bulbs, red lanterns, painted signs and gold
  statues versus Dotonbori's LED and neon.
- **Do** make the dojo the calmest room in the game. Order, wood, paper and empty space.
- **Do** use the name-plaque board and the record crates as diegetic UI (bible: almost no UI).
- **Don't** reproduce Billiken's face, the real Tsūtenkaku sponsor logo, Kushikatsu Daruma's chairman or real
  band logos and artwork on the posters.
- **Don't** sexualise the onsen. Keep it steam, towels and Tokonmon.
- **Don't** make graffiti readable as real crew tags or slurs. Use original tags and band-pun throw-ups.

---------------------------------------------------------------------------------------------------

## 8. Minoh Safari Reserve (three trails: waterfall, bamboo grove, maple ridge)

### (a) References
- [K] Minoh Falls / Minoo Park (Meiji-no-Mori Minoh Quasi-National Park; falls ~33 m, one of Japan's top 100 waterfalls; ~2.8 km riverside trail from Minoh Station; momiji tempura shops; wild Japanese macaques; insect museum) (verify): search "Minoo Park waterfall trail", "Minoh momiji tempura", "Minoh monkeys feeding ban".
- [K] Japanese macaque: https://en.wikipedia.org/wiki/Japanese_macaque
- [K] *Acer palmatum* (Japanese maple: leaf shape, autumn colours): https://en.wikipedia.org/wiki/Acer_palmatum
- [K] Arashiyama (Sagano bamboo grove: towering moso bamboo, brushwood fences along the path): https://en.wikipedia.org/wiki/Arashiyama
- [K] *Muramasa: The Demon Blade* (Vanillaware; side-scrolling painted Japanese forests, bamboo, waterfalls, maples, the best side-scroll Japan nature reference): https://en.wikipedia.org/wiki/Muramasa:_The_Demon_Blade
- [K] *Owlboy* (layered pixel forests and skies): https://en.wikipedia.org/wiki/Owlboy
- [K] *Sea of Stars* (pixel forests, waterfalls, day/night light): https://en.wikipedia.org/wiki/Sea_of_Stars
- [K] *Eastward* (lush pixel foliage, warm light): https://en.wikipedia.org/wiki/Eastward_(video_game)
- [K] *Octopath Traveler* (HD-2D forests with depth-of-field): https://en.wikipedia.org/wiki/Octopath_Traveler
- [K] *Ōkami* (sumi-e Japanese nature, maple and bamboo motifs): https://en.wikipedia.org/wiki/%C5%8Ckami
- [K] *Ghost of Tsushima* (wind-driven tall grass, red-maple and pampas palettes): https://en.wikipedia.org/wiki/Ghost_of_Tsushima
- [S] HD-2D depth-of-field / tilt-shift (applies to every forest layer): https://en.wikipedia.org/wiki/HD-2D

### (b) Study notes

**Minoh trail**
- A gentle paved and riverside path follows the **Minoh River** up a forested gorge to the falls.
- On the way:
  - souvenir and **momiji tempura** stalls;
  - an old temple area;
  - stone steps;
  - wooden and stone railings;
  - small bridges.
- **Momiji tempura:** maple leaves salted for about a year, coated in a sweet sesame batter and deep-fried. They come out
  golden, **leaf-shaped crisps**, sold in paper bags. Vendors fry them in big woks on the street.
- **Wild monkeys** (Japanese macaques) live on the trail. They have pink-red faces, grey-brown fur and short tails. They
  **snatch food**, so feeding is banned (warning signs). They sit on railings and roofs.
- **Minoh Falls:** a single ~33 m ribbon of white water off a dark rock lip into a rocky basin, with mist,
  ferns and moss. Maples frame it in autumn, so it's the top foliage spot from mid-November.

**Bamboo grove (Arashiyama logic)**
- **Moso bamboo** 15–25 m tall.
- Culms are bright green when young (a powdery white band under each node) and olive or yellow when old.
- **Brushwood fences** (*shibagaki*) line both sides of a packed-earth path.
- Light comes down in thin green shafts.
- The creaking and rustling sound is itself famous.
- **Sasa** (dwarf bamboo) carpets the ground. **It is the perfect "tall grass" for sneaking.**

**Maple ridge**
- Stone steps climbing under a **ceiling of red, orange and gold leaves**.
- A carpet of fallen leaves.
- Moss on stones.
- A small vermilion shrine or temple gate.
- A lookout over the Osaka plain (city haze, distant towers).

**Pixel forest lessons**
- **Owlboy / Sea of Stars:** 4–6 parallax foliage planes, each step darker and bluer toward the back.
  Light shafts as additive dithered beams. Leaves drawn as clusters, not single leaves.
- **Muramasa:** side-scroll framing puts **tree trunks in L4 as dark verticals** to frame the shot,
  waterfalls as stacked animated bands, and maples as big flat shapes with a few hand-placed leaf
  details.
- **Octopath:** tilt-shift blur on near and far planes, so the play strip stays sharp.

### (c) Design direction

**Shared: Safari entrance and ranger post** (Ranger Sora)

| Layer | Contents |
|---|---|
| L2 | Wooden **ranger cabin** with a deep eave, a trail-map board, a binocular stand, a first-aid box, a radio mast with a small solar panel, the safari gate (timber torii-like frame, not a shrine torii) with `箕面サファリ保護区 / MINOH SAFARI RESERVE`. |
| L3 | `safari_jeep`, `tent`, `campfire`, `binoculars`, `signpost` to the three trails, `noticeboard` (rules: no feeding monkeys, stay on the trail, **wild beast warnings** for the Rift Boar and Oni Bear). |

- **Ranger signs:**
  - `サルに餌をやらないで / DON'T FEED THE MONKEYS`;
  - `野獣注意 / BEWARE: RIFT BOAR & ONI BEAR`;
  - a stand: `もみじ天ぷら / AUTUMN LEAVES TEMPURA` (song title, many artists).

**Trail A: Waterfall** (`minoh_waterfall`)

| Layer | Contents |
|---|---|
| L0 | Narrow sky between gorge walls, misty. |
| L1 | Forested ridges (cedar and hinoki, dark and cool), mist bands. |
| L2 | The **falls** at the trail's end: a white ribbon in 3–4 animated bands, a dark rock lip, a mist cloud, a rainbow in the spray at midday. Moss cliffs and ferns. |
| L3 | Riverside path (stone pavers, stepping stones across shallows `,`), wooden railings, a small arched footbridge, a rest bench, a momiji tempura stand. Kappachi (Hydro) and other spawns sit at the riverbank. |
| L4 | Maple branches, ferns, moss-covered river rocks (`waterfall_rock`, `rock_*`), spray particles. |

- **Palette:**
  - water white `#e8fbff` / `#a6e6ff`;
  - pool `#2c84bf` → `#1a4f80`;
  - rock `#3e3a3a` / `#5a5450`;
  - moss `#7fa64e` / `#5a8239`;
  - cedar `#2c4a3a`;
  - mist `#dfe9ee` at 40%.

**Trail B: Bamboo grove** (`minoh_bamboo`)

| Layer | Contents |
|---|---|
| L0–L1 | Hardly any sky. Back planes of bamboo fade to pale green-grey haze. |
| L2 | A dense **wall of culms** (vertical rhythm, varied thickness and lean, node bands), with leaf canopy only at the very top of frame. |
| L3 | Packed-earth path between **shibagaki fences**; **sasa tall-grass patches** for sneaking (`tallgrass`, safari `grass` zones); a stone marker; a fallen culm. At night, **fireflies** (Hotarumi). |
| L4 | Thick foreground culms as dark vertical frames (Muramasa-style), sasa leaves, a fence edge. |

- **Palette:**
  - young culm `#7fae4e` / node band `#d8e8c0`;
  - old culm `#a8a85a`;
  - shadow `#2f5a3a`;
  - haze `#cfe0c8`;
  - path `#8a6a4a`;
  - fence `#6a5146`;
  - light shaft `#f4ffd8` at 30%;
  - firefly `#d8ff7a`.
- **Lighting:** cool green ambient with thin moving light shafts (sway with the wind). Dusk turns gold-green,
  and at night it's moonlight plus fireflies.

**Trail C: Maple ridge** (`minoh_maple`)

| Layer | Contents |
|---|---|
| L0 | Clear autumn sky. |
| L1 | **Lookout view** over the Osaka plain: hazy blue city, tiny towers (the Sky Gate and the stadium disc are recognisable). |
| L2 | Ridge slope with maples in **three colour groups** (scarlet, orange, gold), a small vermilion shrine gate, a stone lantern, a mossy stone wall. |
| L3 | **Stone steps** and a leaf-carpet path (tile `L`), tall pampas/susuki patches for sneaking, a monkey troop on the railing, the **momiji tempura** stall (wok, paper bags), a bench at the lookout. This is the Lemmo / Alpha Lemmo boss ground or wherever the map places it. |
| L4 | Maple branches across the top of the frame, falling-leaf particles (`leaves`), fern tips. |

- **Palette:**
  - maple scarlet `#c8263a` / `#e0462e`;
  - orange `#f2892e`;
  - gold `#f7c04a`;
  - deep red shadow `#7a1f2a`;
  - leaf carpet `#b8432e` / `#d8752e`;
  - moss `#7fa64e`;
  - shrine vermilion `#e2482e`;
  - macaque fur `#8a7b6b` / face `#e07a7a`;
  - city haze `#9fb4d8`.
- **Lighting:** golden afternoon light shining **through** the leaves (red-orange translucency glow), with long shadows on the steps.
  Dusk turns into a pink-violet city view.

**Props**
- **Existing:** `bamboo`, `maple`, `tallgrass`, `reeds`, `lilypad`, `waterfall_rock`, `rock_l/m/s`, `log`,
  `stump`, `mushrooms`, `pine`, `stone_lantern`, `torii`, `safari_jeep`, `tent`, `campfire`,
  `binoculars`, `signpost`, `noticeboard`, `bench`.
- **New:**
  - ranger cabin;
  - safari gate;
  - shibagaki fence;
  - sasa patch;
  - arched footbridge;
  - wooden railing;
  - momiji tempura stall (wok, paper bags, leaf baskets);
  - macaque NPC set (sit, groom, snatch);
  - lookout railing;
  - stone steps;
  - moss wall;
  - fern clusters;
  - firefly emitter;
  - mist emitter.

**★ZOOM spots**
1. **Momiji tempura stall**: counter first-person; you buy and eat the crispy leaves (eating = skills).
2. **Lookout bench** over the city (two-shot at dusk).
3. **Tall-grass sneak** camera: a lower, closer side view while the player is inside sasa or susuki, with grass
   blades in L4 partly covering the view.

### (d) Do / Don't
- **Do** give each trail **one dominant hue**: waterfall = white and cool blue-green, bamboo = green verticals,
  maple = red-orange-gold. Players should know the trail from a thumbnail.
- **Do** use Muramasa-style dark foreground trunks to frame each screen.
- **Do** make tall grass visually obvious (a distinct darker clump shape with sway) so sneaking reads.
- **Don't** paint every leaf. Use clusters plus a few hand-placed silhouettes on the edges.
- **Don't** show anyone feeding the monkeys. Do show the warning signs and a monkey stealing a snack.

---------------------------------------------------------------------------------------------------

## 9. Cool buildings for Osaka 2050 (facade library for every street strip)

### (a) References
- [K] Metabolism (Japanese architecture movement; capsules, megastructures): https://en.wikipedia.org/wiki/Metabolism_(architecture) · Nakagin Capsule Tower: https://en.wikipedia.org/wiki/Nakagin_Capsule_Tower
- [K] Gate Tower Building (Osaka: a highway passes through floors 5–7): https://en.wikipedia.org/wiki/Gate_Tower_Building
- [K] Namba Parks (Osaka: terraced rooftop garden canyon): https://en.wikipedia.org/wiki/Namba_Parks
- [K] Tower of the Sun (Taro Okamoto, Expo '70, Osaka): https://en.wikipedia.org/wiki/Tower_of_the_Sun
- [K] Expo 2025 Grand Ring (timber megastructure): https://en.wikipedia.org/wiki/Expo_2025
- [K] Umeda Sky Building: https://en.wikipedia.org/wiki/Umeda_Sky_Building · Abeno Harukas: https://en.wikipedia.org/wiki/Abeno_Harukas
- [K] Search: "Maishima incineration plant Hundertwasser" (Osaka's fairy-tale factory), "Osaka Central Public Hall Nakanoshima red brick", "gado-shita izakaya under railway Osaka", "Osaka pencil building", "Showa retro tile facade".
- [S] Kanban (shop-sign craft: signs shaped like the goods): https://mingei.org/exhibitions/kanban/
- [S] *The Last Night* (low-poly 3D + pixel textures, fixed side camera, neon city): https://80.lv/articles/the-last-night-pixel-art-cyberpunk-open-world
- [S] *Blade Runner 2049* (Brutalist megacity + giant holograms): https://www.artofvfx.com/blade-runner-2049-paul-lambert-vfx-supervisor-double-negative/
- [K] *Akira* (1988) and *Ghost in the Shell* (1995) for dense Japanese future-city layering: https://en.wikipedia.org/wiki/Akira_(1988_film) · https://en.wikipedia.org/wiki/Ghost_in_the_Shell_(1995_film)
- [K] eBoy Pixoramas (dense pixel cities): https://en.wikipedia.org/wiki/EBoy · *Kowloon Walled City* cut-away illustrations: https://en.wikipedia.org/wiki/Kowloon_Walled_City

### (b) Study notes: Osaka facade typologies (all readable from the front)

| # | Type | Front read | 2050 retrofit |
|---|---|---|---|
| 1 | **Pencil building** (4–8 m wide, 6–10 floors) | Ground-floor shop, then a stack of blade signs, external stair, AC units, tiny balconies | LED blade signs, a balcony drone dock, rooftop solar |
| 2 | **Machiya / nagaya townhouse** (2 floors) | Wooden lattice (*kōshi*), noren, tiled eave, a low second floor with *mushiko* slit windows | Hidden PV tiles, an e-paper kanban |
| 3 | **Showa tile building** (3–5 floors) | Mosaic-tiled facade (cream, mint, brown), steel sash windows, rooftop sign frame | Holo sign replacing the old frame |
| 4 | **Shotengai arcade** | Covered street, translucent roof, arch gate with bulbs, banner flags | Smart-glass roof showing the sky |
| 5 | **Gado-shita** (shops under a rail viaduct) | Brick or concrete arches, izakaya lanterns, a train overhead | A maglev overhead, magnetic hum particles |
| 6 | **Sentō** | A tall chimney, a temple-style curved gable (*karahafu*) entrance, ゆ noren | A steam-vent turbine on the chimney |
| 7 | **Pachinko palace** | Full LED facade, gold lettering, flower stands | Already future-looking: louder |
| 8 | **Metabolist capsule tower** | Stacked boxes with round windows | 2050 capsule hotel and the hero landmark |
| 9 | **Glass + timber tower** (Grand Ring descendant) | Glass curtain wall behind a timber lattice, terraced gardens | Hero-future (Umeda) |
| 10 | **Road-through building** (Gate Tower) | A viaduct entering the building's middle floors | A maglev line threading a tower (Umeda L1) |
| 11 | **Fairy-tale factory** (Maishima) | Colourful stripes, gold onion domes, random windows | Use as a power plant or waste centre in L1 |

**Universal facade anatomy**
- Ground-floor tenant (shopfront, shutter or noren), a **sign band**, upper windows with life (laundry,
  plants, curtains, cats).
- **Roofline clutter:** water tanks (`water_tank`), antennas (`antenna`), billboard frames, AC units
  (`ac_unit`), drone pads.
- **Street clutter in front:** utility poles and wires, vending (`vending`), bicycles, potted plants (Osaka
  residents line the street with pots).

### (c) Design direction
- **Modular facade kit:**
  - Build facades as **modules 1 bay = 2 m wide, 3 m storey** (matching `MAPS.md` building floors × 3 m).
  - Types: shopfront bays, window bays, stair bays and corner bays (corner bays carry the blade signs).
  - Mix 4–6 bays per building and vary the roofline every building.
- **Front-face rule.** Facades face the camera within 10°. Side walls show only as a 1–2 bay slice
  to give depth. Deep set-backs are faked with layered planes.
- **Silhouette rhythm along a strip:** low, low, tall, mid, **landmark**, low. Never an even skyline.
- **Material palette (shared)**

| Material | Hex |
|---|---|
| Concrete light / dark | `#b8b4ac` / `#6f6c68` |
| Showa tile cream / mint / brown | `#e9e2d6` / `#9fcdb8` / `#8a5a3a` |
| Machiya wood / dark lattice | `#8a5a3a` / `#3a2a22` |
| Kawara roof | `#4b5362` |
| Rust shutter | `#8a6a52` |
| Glass day / night | `#9cc8e8` / `#1c2a48` with lit `#ffd98a` |
| Timber lattice (2050) | `#c99a68` |
| PV panel | `#1f2a4a` with `#5a7ab8` grid |
| Grow-light window | `#c86bff` |

- **Futurism density by district:**

| District | Futurism |
|---|---|
| Farm | almost none |
| Castle Park | edges only |
| Dotonbori | holograms + LED on old buildings |
| Shinsekai | mostly retro, a few hovercars |
| Umeda | hero-future |
| Minoh | ranger tech only |

### (d) Do / Don't
- **Do** let every building tell what's inside from its ground floor.
- **Do** keep Showa-retro textures (tiles, painted tin signs, lanterns) visible under 2050 additions.
- **Don't** build glass boxes with no signage. Osaka is loud.
- **Don't** align every roof or window. Hand-built irregularity is the charm.

---------------------------------------------------------------------------------------------------

## 10. Lore murals: the gods of light (Dark Side of the Moon prism dragon, Back in Black dark dragon)

### (a) References
- [K] Takamatsuzuka Tomb (late 7th / early 8th c. murals: Four Symbols, court ladies, a **gold-leaf star chart** on the ceiling; mineral pigments on plaster): https://en.wikipedia.org/wiki/Takamatsuzuka_Tomb
- [K] Kitora Tomb (oldest East Asian astronomical chart, Four Symbols): https://en.wikipedia.org/wiki/Kitora_Tomb
- [K] Four Symbols (Azure Dragon, White Tiger, Vermilion Bird, Black Tortoise): https://en.wikipedia.org/wiki/Four_Symbols
- [K] Hōryū-ji (Kondō Buddhist murals): https://en.wikipedia.org/wiki/H%C5%8Dry%C5%AB-ji
- [K] Byōdō-in (Phoenix Hall: celestial beings on clouds, painted doors): https://en.wikipedia.org/wiki/By%C5%8Dd%C5%8D-in
- [K] Kennin-ji (*Twin Dragons* ceiling, 2002): https://en.wikipedia.org/wiki/Kennin-ji · Tenryū-ji (*Cloud Dragon* ceiling): https://en.wikipedia.org/wiki/Tenry%C5%AB-ji
- [K] Kofun (mounded tombs; decorated chambers in Kyushu with red, yellow, white, black and green geometry): https://en.wikipedia.org/wiki/Kofun · Mozu-Furuichi Kofun Group (Osaka, UNESCO 2019: keyhole mounds with moats): https://en.wikipedia.org/wiki/Mozu-Furuichi_Kofun_Group
- [K] Dōtaku (Yayoi bronze bells with line drawings): https://en.wikipedia.org/wiki/D%C5%8Dtaku
- [K] Rinpa school (gold-leaf grounds, bold stylised forms; Sōtatsu's Wind and Thunder Gods screens): https://en.wikipedia.org/wiki/Rinpa_school
- [K] *The Dark Side of the Moon* (cover: a white beam through a triangular prism splitting into a spectrum on black): https://en.wikipedia.org/wiki/The_Dark_Side_of_the_Moon · Hipgnosis: https://en.wikipedia.org/wiki/Hipgnosis
- [K] *Back in Black* (all-black cover with an outlined grey logo, "black on black"): https://en.wikipedia.org/wiki/Back_in_Black
- [K] Search: "Ozuka kofun mural", "Takamatsuzuka Seiryu mural detail", "raden mother of pearl inlay", "iwa-enogu mineral pigments".

### (b) Study notes

**Ancient Japanese mural language**
- **Mineral pigments** (*iwa-enogu*) on **lime plaster**, plus **ink outlines**.
- Pigments:
  - cinnabar or vermilion red;
  - red and yellow ochre;
  - malachite green;
  - azurite blue;
  - shell white (*gofun*);
  - soot black.
  - **Gold leaf** for stars.
- **Takamatsuzuka/Kitora:**
  - creatures on the four walls by direction;
  - a **ceiling star map** of gold dots joined by red lines;
  - plaster cracked, flaked and water-stained.
- **Decorated kofun:** bold geometric bands (triangles, concentric circles, spirals), figures and horses
  in a 4–5 colour palette.
- **Temple dragon ceilings:** a huge ink dragon coiling in clouds, one eye that "follows you".
- **Rinpa screens:** stylised gods on **flat gold**, with dynamic silhouettes and very little background.

**Album sources (transform, never copy)**
- **Dark Side of the Moon:** a **thin white beam → triangle → six-band spectrum** on pure black. The
  idea is light becoming colour.
- **Back in Black:** **black on black**, with outlines only in dull silver. The idea is darkness so deep only
  the edges show.

### (c) Design direction
- **Setting.** A painted chamber or temple hall wherever the quest puts the murals (Dr. Hoshino's dig).
  Kofun chambers suit Osaka, which has the Mozu-Furuichi tombs. Stage it as a cut-away **stone burial
  chamber**:
  - **L2:** the mural wall;
  - **L3:** the dig floor (grid strings, brushes, crates, lamp stands, Dr. Hoshino's 2050 scanning gear:
    a tripod LIDAR, a UV lamp, a drone);
  - **L4:** stone lintels, scaffolding poles and cables.
- **Composition (one long wall, read left to right like an emakimono scroll)**
  1. **The world before light:** black and soot, with dull silver outlines of mountains and sea. This is the
     **Back in Black** dragon's realm: a dragon drawn **only as silver outline on black**, coiling,
     eyes as two tarnished-silver dots.
  2. **The meeting:** a beam of white (thick gofun plus inlaid **mother-of-pearl** chips that catch
     light) strikes the **prism dragon**, whose body is a chain of **triangular crystal scales**
     outlined in gold.
  3. **The making of the world:** from the prism dragon's far side a **six-band spectrum** fans out (vermilion,
     ochre-orange, yellow ochre, malachite green, azurite blue, a violet glaze). The bands become
     rivers, forests, fire, sky, the five core elements, and tiny Tokonmon silhouettes are born in them.
  4. **Ceiling:** a **gold-leaf star chart** (Kitora homage). The constellations hide the dragons' shapes.
- **Pixel treatment:**
  - a flat-colour mural, 1-px ink outlines, a plaster texture with **flake-loss patches** showing bare
    plaster `#e8dcc4`;
  - hairline cracks and water stains;
  - gold leaf and mother-of-pearl get a **slow 2-frame sparkle** when the player's light passes.
- **Light reveal.**
  - The chamber is dark. A lamp or phone light sweeps across, and the mural's **spectrum band glows**
    (emissive pigments) where the light hits.
  - The silver outlines of the dark dragon are **only visible at a grazing angle**, so it appears
    as you move.
  - These are visual cues only; any gameplay use is for design to decide.

**Palette**

| Pigment | Hex |
|---|---|
| Plaster ground / bare plaster | `#efe4cc` / `#e8dcc4` |
| Soot black / ink | `#1e1b18` / `#2a2522` |
| Vermilion (shu) | `#d9381e` |
| Red ochre (bengara) | `#9a3a24` |
| Yellow ochre | `#c9a227` |
| Malachite (rokushō) | `#3e8e5e` |
| Azurite (gunjō) | `#2a4d8f` |
| Violet glaze | `#6b4a9a` |
| Shell white (gofun) | `#f6f2e8` |
| Gold leaf / shadow | `#d4af37` / `#8a6a1f` |
| Tarnished silver | `#8d8f94` / `#5d5f66` |
| Mother-of-pearl glints | `#e8f4ff` `#ffe8f4` `#e8fff0` |

### (d) Do / Don't
- **Do** make it feel **ancient and hand-painted**: mineral flatness, cracks, losses and gold.
- **Do** keep the prism-to-spectrum idea, but draw it as a dragon and a fan of bands, never a black square with a
  triangle and a straight beam (that is the album cover).
- **Do** let the dark dragon be the hardest thing to see.
- **Don't** use rainbow gradients or neon in the murals. Use the six flat mineral bands.
- **Don't** put the AC/DC or Pink Floyd logos or typography anywhere.
- **Don't** make the gods catchable or meetable in the art. They are lore only (bible §3).

---------------------------------------------------------------------------------------------------

## 11. Sign bank (band-pun names; ✓ = already in a map)

| District | Signs |
|---|---|
| Farm | `久保農園 KUBO FARM` · `無人販売 HARVEST MOON` · `トコンモン保護区域 PROTECTED TOKONMON` · (opt.) `STRAWBERRY FIELDS` |
| Castle Park | `大阪城公園 OSAKA CASTLE PARK` · `GONDA TRAINING GROUND` · `茶屋 さくら` ✓ · `CHERRY BOMB CRÊPES` · `HERE COMES THE SUN TEA` · `OBP 2050` ✓ |
| Dotonbori | `RED HOT CHILI CRABBERS` ✓ · `FUGU FIGHTERS` ✓ · `RAMONES RAMEN` ✓ · `FRIED ZEPPELIN` ✓ · `WONDERWALL GYOZA` ✓ · `KARAOKE QUEEN` ✓ · `UDON STOP ME NOW` ✓ · `PURPLE RAIN CAFÉ` ✓ · `HOTEL KANSAI-FORNIA` ✓ · `YELLOW SUBMARINE SOFT-SERVE` ✓ · `ABBEY ROAD お好み焼き` ✓ · `OCTOPUS'S GARDEN たこ焼き` · `THE LONG RUN` (runner board) · `DRUM MACHINE` (drummer) |
| Food hall | `UMEDA FOOD HALL` ✓ · `CURRY ON MY WAYWARD SON` · `SUSHI DREAMER` · `TEMPURA TANTRUM` · `CRÊPES OF WRATH` · `BOHEMIAN RHAP-SODA` ✓ |
| Umeda | `TOKONMON LEAGUE KANSAI` (rename) · `LUCY IN THE SKY OBSERVATORY` · `HERE COMES THE SUN PLAZA` · `GRAND FRONT 2050` ✓ · `SKY CAFÉ` ✓ · `TOKONMON BANK` (rename) · (opt.) `ROCK YOU DOME` |
| Shinsekai | `新世界 SHINSEKAI` ✓ · `KUSHIKATSU KISS` ✓ · `TOWER GIFTS` ✓ · `SHINSEKAI 1912 KISSATEN` ✓ · `SHOT THROUGH THE HEART 射的` · `SMOOTH OPERATOR スマートボール` · `EYE OF THE TIGER DOJO 虎の目道場` · `SMOKE ON THE WATER 銭湯` ✓ · `SMELLS LIKE TEEN SPIRIT ARCADE` ✓ · `BLING ★ SOUL STONES` ✓ · `GRILLZ & THRILLZ` ✓ · `REVOLVER RECORDS` · `LUCKY GOODS` ✓ · `PAPERBACK WRITER BOOKS` ✓ · `KANSAI CALLING SUPPLIES` ✓ |
| Back alley | `RIDE THE LIGHTNING パチンコ` ✓ · `MASTER OF PUPPETS PAWN 質屋` ✓ · `TEAM METALLICA NO TRESPASSING` ✓ · `SEEK & DESTROY SCRAP` · `SAD BUT TRUE LOANS` · `KILL 'EM ALL-YOU-CAN-EAT` |
| Minoh | `MINOH SAFARI RESERVE 箕面サファリ保護区` · `DON'T FEED THE MONKEYS` · `BEWARE: RIFT BOAR & ONI BEAR` · `AUTUMN LEAVES TEMPURA もみじ天ぷら` |

---------------------------------------------------------------------------------------------------

## 12. Follow-up search queue (run before final art for scenes 4–10)

The session's web-search budget ran out after scene 3, so these queries are still to run. Each one
should yield 2–4 photo or article references to add to the matching (a) list. Fix anything marked
(verify).

| Scene | Queries |
|---|---|
| 4 Restaurants | "Osaka okonomiyaki restaurant interior teppan table" · "Chibo / Mizuno Dotonbori interior" · "shokuhin sampuru window display Osaka" · "Sennichimae Doguyasuji sampuru" · "ramen shop ticket machine counter interior" · "Ichiran booth interior" · "Japanese soft serve giant cone sign shop" · "Showa kissaten melon cream soda interior" · "1950s diner interior checker floor" · "Yellow Submarine film Pepperland background art" · "Umeda food hall Hankyu Sanbangai" |
| 5 Umeda | "Umeda Sky Building Floating Garden night Lumi Sky Walk" · "Umeda Sky Building escalator tube" · "Takimi Koji Showa alley" · "HEP Five Ferris wheel red whale atrium" · "Grand Green Osaka Umekita Park roof" · "Grand Front Osaka plaza water" · "esports arena lobby design" · "Pokémon Center Mega Tokyo statue" |
| 6 Stadium | "Pokémon Stadium Melee transformation stages" · "Pokémon Battle Revolution colosseum list" · "Cirque du Soleil O stage hydraulic lift" · "Sapporo Dome hovering stage" · "Tottenham retractable pitch" · "LoL Worlds 2017 Elder Dragon AR" · "NBA arena broadcast camera positions" · "Kyocera Dome Osaka roof" · "Allianz Arena ETFE lighting" |
| 7 Shinsekai | "Tsutenkaku weather light colours" · "Tsutenkaku base ceiling painting" · "Janjan Yokocho shogi" · "Shinsekai Kokusai Gekijo painted signboards" · "Spa World Osaka Asian European zone" · "sento Mt Fuji mural Kerorin bucket" · "kendo dojo kamidana interior" · "nafudakake dojo name board" · "Japanese game center crane floor" · "maimai cabinet" · "Disk Union record store interior" · "Amerikamura graffiti shutters" · "pachinko parlor back alley" |
| 8 Minoh | "Minoh Falls height trail Minoh Station" · "Minoh momiji tempura how made" · "Minoh monkeys feeding ban" · "Minoo Park Ryuanji" · "Arashiyama bamboo grove fence shibagaki" · "Muramasa Demon Blade bamboo background" · "Owlboy forest parallax" · "Sea of Stars forest pixel" |
| 9 Buildings | "Gate Tower Building highway" · "Namba Parks terraces" · "Maishima incineration plant" · "Osaka pencil buildings" · "Showa retro tile building facade" · "gado-shita izakaya Osaka" · "Expo 2025 Grand Ring structure" |
| 10 Murals | "Takamatsuzuka mural Seiryu detail" · "Kitora tomb star chart" · "Ozuka kofun decorated chamber" · "Kennin-ji twin dragons" · "raden mother of pearl inlay" · "iwa-enogu pigment colours" |

Also re-check scenes 1–3 with image-capable tools when available. The searches only returned text summaries.
