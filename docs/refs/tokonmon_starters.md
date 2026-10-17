# Starter Tokonmon — Reference Study & Design Direction

Scope: the three starters, their main and alternate evolutions, their Elemental Forms and their Bond gimmicks.
Read `docs/TOKONMON.md` §1, §3 and §5 first. This file is for the **3D modelers** (voxel/SDF pipeline in
`docs/MODELING.md`) and the **pixel artists** (2D sprites for phone, scan app, dex, team lists, cut-ins).

> **Rule from the bible (§1):** every asset is designed after studying real visual references, which are then
> **transformed into original designs and never copied.** Each section below ends with a Do / Don't list.

---------------------------------------------------------------------------------------------------

## 0. How to read this file

### 0.1 Evidence legend
- **✓** — the fact was confirmed by web-search results in this research pass. The source is linked in that
  section's References.
- **[K]** — the fact comes from the researcher's background knowledge. **This pass could not confirm it**,
  because the session's shared web-search budget (200 calls across all agents) ran out during the Bubblion
  research. Treat **[K]** facts as strong leads, and confirm them before final art (see §12, follow-up
  searches).
- Image downloads and page fetches were blocked, so every reference was studied through search-result text
  (wiki descriptions, design breakdowns and gear write-ups). **Artists should still open the linked pages and
  look at the pictures themselves** before modeling.
- Links marked *(canonical, not opened)* are standard pages (Wikipedia or Bulbapedia) that searches did not
  return. Their URLs follow the sites' normal patterns, but nobody has opened them yet.

### 0.2 Coverage of this pass
| Design | Searches run | Status |
|---|---|---|
| Chilichick | 15 | Well covered ✓ |
| Riffrooster | 10 | Well covered ✓ |
| Funkadoodle | 5 (+ shared rooster/RHCP results) | Covered ✓ |
| Bubblion | 2 (Soft & Wet ✓). Lionfish and Pokémon-fish searches were cut off by the budget | Partly [K] |
| Princeidon, Purple Rain, Strawbaa, Ramberry, Pennyewe, Elemental Forms, Bond | 0, budget exhausted | Mostly [K]. **Re-run the §12 searches** |

### 0.3 House rules the specs below already follow
- **Look:** 3D models that read as 2D, with cel shading in **2–3 hard bands**, **hue-shifted shadows**,
  **1-px outlines**, low-res pixel rendering and **stepped animation on twos (12 fps)**. Each palette therefore
  gives a *base / shadow / deep* ramp per material, and shadows shift hue rather than just darkening.
- **Sizes:** the `MODELING.md` budgets are base starters 0.55–0.9 m tall, finals 1.6–2.6 m. Each spec gives a
  target height, an animation archetype (`arch`) and the particle emitters (`fx`) the engine already has.
- **Outline colours:** never pure black. Each line has a dark outline hue (wine for fire, navy-violet for water,
  plum for bio).
- **Sprites:** the 2D sprites must read at **64 × 64 px**. Each section has a "64-px read" note listing the 3–4
  features that must survive the downscale.

### 0.4 Starter trio: read them as a set
| | Chilichick (Pyro) | Bubblion (Hydro) | Strawbaa (Bio) |
|---|---|---|---|
| Base shape | **Vertical teardrop / chili pod** (tall, pointy tail) | **Sphere** (water ball) | **Horizontal heart / loaf** (quadruped) |
| Hue family | **Orange-red** (hue ≈ 8°) + sunny yellow | **Cyan ball** + coral/cream fish + gold crown | **Rose/pink-red** (hue ≈ 350°) + cream + leaf green |
| Value | Mid-dark, high contrast | Light (ball) around a mid-value fish | Light (cream face, pink tufts) |
| Music source | Red Hot Chili Peppers | Prince + *Soft & Wet* (the JoJo Stand is itself named after Prince's 1978 debut single "Soft and Wet" [K]) | The Beatles / Paul & Linda McCartney |
| Signature gag | Always eating a pepper, **crying from the heat** | A **crown** worn inside a bouncy water ball | Strawberry wool, **plants vines** |

> Chilichick and Strawbaa are both "red". Keep them apart with **hue** (orange-red vs rose-red), **value**
> (Strawbaa has far more cream and pink) and **shape** (tall teardrop vs wide heart). Put the three base
> sprites side by side at 64 px before signing anything off.

---------------------------------------------------------------------------------------------------

## 1. Chilichick (Pyro) — base starter

**Owner's description (verbatim, TOKONMON.md §3):**
> **Concept:** a red hot chili pepper chicken (Red Hot Chili Peppers). It is always eating a pepper and breathes fire.
> **Signature look:** it is crying because of the heat.

### 1a. References
**Red Hot Chili Peppers (band imagery)**
- RHCP asterisk / "Star of Affinity" logo history ✓ — https://fontmeme.com/red-hot-chili-peppers-font/ ;
  https://www.deconetwork.com/the-red-hot-chilli-peppers-star-of-affinity-t-shit-story/ ;
  https://xpressmag.com.au/8-of-the-most-iconic-band-t-shirts/
- *The Uplift Mofo Party Plan* cover (Gary Panter collage) ✓ — https://peoplesgdarchive.org/item/22378/google
- *Mother's Milk* cover ✓ — https://pure-music.co.uk/mothers-milk-album-cover/
- *Blood Sugar Sex Magik* cover story ✓ (text did not describe the art) — https://diffuser.fm/cover-stories-red-hot-chili-peppers-blood-sugar-sex-magik/
- Early stage gimmicks and the band's history ✓ — https://www.britannica.com:443/print/article/1395426 ;
  https://www.songfacts.com/facts/red-hot-chili-peppers ;
  https://www.dallasobserver.com/music/echoes-and-reverberations-anthony-and-fleas-tube-sock-diaries-7053884/
- Album-art overview ✓ — https://www.classicrockhistory.com/complete-list-of-red-hot-chili-peppers-albums-and-discography/
- *(canonical, not opened)* https://en.wikipedia.org/wiki/Red_Hot_Chili_Peppers ;
  https://en.wikipedia.org/wiki/Give_It_Away_(Red_Hot_Chili_Peppers_song)

**Chili peppers**
- Visual guide to pepper varieties ✓ — https://spice.alibaba.com/spice-basics/types-of-chili-peppers-images ;
  https://www.ufseeds.com/on/demandware.static/-/Sites-UrbanFarmer-Library/default/dw698fd756/images/content/Hot-Pepper-Comparison-Chart.pdf
- Pepper anatomy (calyx, pedicel, shoulder, exocarp) ✓ — https://pepperscale.com/?p=32504 ;
  https://spice.alibaba.com/spice-basics/chili-peppers-other-side
- Pepper characters as heroes and villains ✓ — https://comiccrusaders.com/editorial/heroes-villains-chilli-pepper-style-because-who-doesnt-want-to-see-tangerine-dream-take-on-carolina-reaper-right/

**Chick and chicken creature designs**
- Torchic ✓ — https://bulbapedia.bulbagarden.net/wiki/Torchic
- Combusken / Blaziken ✓ — https://m.bulbapedia.bulbagarden.net/wiki/Combusken ; https://en.wikipedia.org/wiki/Blaziken
- Fletchling / Talonflame ✓ — https://pokemaniacal.com/tag/talonflame/ ; https://www.sportskeeda.com/pokemon/fletchling
- Scovillain (Pokémon's chili pepper, for contrast) ✓ — https://bulbapedia.bulbagarden.net/wiki/Scovillain
- Chocobo, including chicks ✓ — https://en.wikipedia.org/wiki/Chocobo ;
  https://gonintendo.com/stories/331560-square-enix-character-artist-talks-about-the-creation-of-chocobos
- Cucco (Zelda) ✓ — https://www.ssbwiki.com/Cucco ; https://zeldawiki.wiki/wiki/Gold_Cucco
- Basan, the yokai fire-breathing chicken ✓ — https://yokai.com/basan/ ; https://en.wikipedia.org/wiki/Basan_(legendary_bird)

**Crying from spice (anime reactions)**
- "Fire-Breathing Diner" trope ✓ — https://Tvtropes.org/pmwiki/pmwiki.php/Main/FireBreathingDiner ;
  https://allthetropes.fandom.com/wiki/Fire-Breathing_Diner
- Manga iconography (manpu: sweat drops, veins, symbols) ✓ — https://en.wikipedia.org/wiki/Manga_iconography ;
  https://public.websites.umich.edu/%7Eanime/info_emotions.html
- Spicy-ramen ad reactions (sweat, steam) ✓ — https://soranews24.com/2016/03/09/sweating-snuggling-models-and-voice-actresses-steam-up-series-of-spice-ramen-ads-%E3%80%90videos%E3%80%91/amp/

**Pixel readability**
- Small-sprite readability ✓ — https://www.indiedb.com/tutorials/through-the-magnifying-glass-part-three ;
  https://humbird0.com/makes/tutorials/create_sprites/content.htm ; https://photonstorm.com/?p=2291

### 1b. Study notes
**RHCP**
- The band logo is an **eight-pointed asterisk** that Anthony Kiedis sketched quickly for a label request, with
  no planned meaning ✓. It is usually called the "Star of Affinity" ✓. It is red, flat and graphic, and fans
  read it as a burst or spark. Kiedis and Frusciante reportedly have it tattooed on their wrists ✓.
  → *Lesson:* a simple **radial burst** is the band's visual signature. We can echo it as a **spark or burst**
  without copying the 8-point mark.
- **Album art:** *Uplift Mofo* is a hand-drawn psychedelic collage (Gary Panter) ✓. *Mother's Milk* is a
  black-and-white photo ✓. *I'm With You* (Damien Hirst) shows a fly on a pill ✓. The *Blood Sugar Sex Magik*
  cover is four heads in black and white wrapped in red tattoo-flash roses and thorns [K]; searches could not
  confirm this, and the Henk Schiffmacher credit is unconfirmed.
  → *Lesson:* the RHCP palette is **red + black + white**, a hand-drawn tattoo-flash line quality, and LA
  punk-funk energy.
- **Stage history:** the band played the Sunset Strip in the early 1980s ✓; the infamous sock gimmick is
  **not usable**. Kiedis also wore a skirt on stage ✓. At Woodstock '94 the band wore giant **light-bulb
  costumes** [K]. The "Give It Away" video put the band in **silver body paint** in a black-and-white desert
  [K]. → *Lesson:* a cartoonish, physical, shirtless, jumping energy.

**Chili peppers**
- **Anatomy ✓:**
  - The **pedicel** (stem) joins the fruit to the plant.
  - The **calyx** is the green cap that "sits there like a hat". Seen from above it is a **5-pointed star**
    formed from the sepals.
  - The **shoulder** is the rounded part under the calyx, and its width varies by variety.
  - The **exocarp** (skin) is **shiny and waxy**.
  → *Lesson:* a pepper reads through a **hat-like green star cap**, a **curling stem**, a **long glossy specular
  streak** and a **tapering tip**.
- **Varieties ✓:**
  - Habanero: small and **lantern-shaped**, orange or red, with white, brown, pink and purple variants.
  - Ghost pepper: wrinkled and tapered, with a **tail-like point**; a **chocolate (brown)** ghost exists.
  - Carolina Reaper: red and **bumpy**, with a small tail.
  - Thai bird's eye: 1–2 in, slender, growing **upright**, in red, green or purple.
  → *Lesson:* the habanero **lantern** is the cutest body shape, the ghost/reaper **tail point** becomes a
  tail, and the bird's eye "grows upward", which suits an upright chick.
- **Scovillain ✓** already owns "pepper with two angry faces, red and green". Avoid two heads, bell-pepper
  heads, and a leafy collar on a dark green body.

**Chicks and chickens**
- **Torchic ✓:** an orange chick with a **flame-shaped crest** of orange and yellow, **stubby downy yellow
  wings**, and fire held *inside* its belly rather than on its body. Its orange is said to come from
  **painted festival chicks**, and it may draw on the **basan** ✓. Early concept art had floppy ears.
  → *Avoid* the orange-plus-yellow-tufted-crest silhouette. Our chick must read as **pepper first, chick second**.
- **Fletchling ✓:** a reddish-orange head with yellow triangle marks behind the eyes, a grey body, and a black
  tail with a white V that suggests arrow fletching.
- **Talonflame ✓:** flame patterns mark the borders between its colour fields. → *Lesson:* put **flame-shaped
  boundaries between colour zones** instead of plain blending. This is perfect for cel bands.
- **Basan ✓:** a turkey-sized chicken with a bright red comb and plumage "like tongues of flame". It breathes
  a cold fire, eats embers and charred wood, and is named for its rustling "basabasa" wing sound. It is a
  harmless startler. → *Lesson:* folklore precedent for a **fire-eating, fire-breathing chicken**, plus a
  wing-flap sound cue for SFX.
- **Chocobo chicks ✓:** born from the creator's memory of raising a chick. Fans criticised a stretched forehead
  in the FFVII Remake chick, and the FFXV team said the balance between realism and lovable touches was the
  hardest part. → *Lesson:* keep the **forehead short** and the **eyes big and low**, and don't overstretch the
  head.
- **Cucco ✓:** a plain white chicken, with yellow chicks in *Minish Cap*. The anger swarm is the famous gag.
  → *Lesson:* chickens become comedic through **exaggerated emotional reactions**.

**Crying from spice**
- **The trope ✓:**
  - The eater flushes red from feet to head, often with a **kettle or steam-whistle** sound, then **blasts
    flame** from the mouth.
  - Lips may swell.
  - In *Toradora!* eyes bulge, faces turn bright red and characters sweat heavily.
  - *Shirokuma Cafe* has someone **tear up from a habanero**.
- **Manga symbols ✓:** a **bigger, more swollen sweat drop** means funnier embarrassment, and **multiple small
  drops** mean anxiety or excitement.
- **Combined reaction sheet:** red flush, **twin tear streams**, sweat drops, steam puffs, a panting open mouth
  and a fire belch.

**Pixel readability ✓**
- At tiny sizes, block in hue masses first and outline second.
- **Exaggerate defining features.**
- Use about **4 values** per material, counting the outline.
- **Value beats hue.**
- Saturated coloured outlines can stand in for black ones.

### 1c. Design direction — Chilichick
**One-line pitch:** a plump, glossy **red chili pod with a chick's face**, wearing its green calyx like a beret.
It chews a pepper nonstop while two waterfall tears stream down its flushed cheeks, and it hiccups fire.

**Silhouette and proportions**
- **Height:** ≈ 0.6 m (base starter).
- **Shape:** an upright **lantern-habanero teardrop** with three soft vertical lobes (pepper ridges). The
  widest point is at the cheeks.
- **Tail:** the pepper tip curls up and back like the ghost pepper's tail point ✓.
- **Head:body:** ≈ **1:1**. The head and body are one gourd mass with no visible neck (chibi). The eyes sit low,
  on the upper-middle of the mass.
- **Legs:** short stubby orange legs (≈ 12% of height) and tiny 3-toed feet.
- **Overall read:** "a chili pepper that stood up and grew a face".

**Body parts**
1. `body` — the glossy chili gourd, with its lobes and a long curved **specular streak** (waxy exocarp ✓).
2. `head` — merged with the body. Cheek **down-tufts** in sunny yellow puff out at the sides.
3. **Calyx beret** — a green **5-point star cap** ✓ tilted on top, with a **curling stem** sticking up as an
   anime *ahoge* (cowlick). The stem hook is where the trainer's hat hangs when bonded (§11).
4. **Flame crest** — a small 3-tongue real flame behind the stem, low and flickering. This is the **blazing
   crest** that ignites during Bond.
5. **Chest bib** — a cream-yellow down patch shaped like an **uneven 6–7-point spark** (an RHCP nod, *not*
   the 8-point asterisk).
6. `wingL/R` — stubby downy wings. One wing usually holds the pepper it is eating.
7. `tail` — the pepper-tip tail, with a tiny ember at the end.
8. `legL/R` — short orange legs. *Optional:* two thin cream bands on each shank as a playful nod to 80s
   athletic striped tube socks (keep it subtle and fashion-only).
9. **Prop: the pepper it is eating.** A small chili held in the beak like a lollipop. **It swaps variety by
   mood or level:** green jalapeño-type (default), orange habanero lantern, red bird's eye, brown "chocolate
   ghost" ✓.

**Palette (core)**
| Role | Base | Shadow (hue-shifted) | Deep / AO | Highlight |
|---|---|---|---|---|
| Chili skin | `#E8321E` | `#A31845` | `#5C0E33` | `#FF8A5C` (spec `#FFE3C8`) |
| Calyx and stem | `#3E9E3A` | `#1E5E46` | — | `#8FD45A` |
| Down (cheeks, bib, wings) | `#FFD34D` | `#E89A2E` | — | `#FFF1B8` |
| Beak and feet | `#FF9F1C` | `#C9601A` | — | — |
| Tears | `#6FD3FF` | `#3B8FD9` | — | `#E8FBFF` |
| Outline | `#2B0A14` (dark wine) | | | |

**VFX colours:** flame core `#FFF6C9` → mid `#FFC233` → outer `#FF5A1F` → smoke `#5A4A55`;
blush `#FF5C7A`; steam `#F4F0F0` at 60%.

**Signature details**
- **The tears:** two continuous anime waterfall streams (3-frame flipbook loop) from the lower eyelids, sliding
  down the cheeks and dripping off. Where a drop meets the hot cheek it **hisses into a small steam puff**, a
  visual pun on the game's *water + fire = steam* reaction.
- **The flush:** a hot-pink blush oval on each cheek with three diagonal hatch lines. In the "too hot" quirk the
  whole body flushes one band brighter for 2 frames.
- **Heat shimmer:** two wavy squiggle lines rise above the stem, and a steam puff comes out of the stem.
- **Hiccup fire:** a small involuntary flame burps out mid-chew. It breathes fire *because* it is eating peppers.
- **Spark motif:** the chest-bib spark is the line's shared mark. It returns on Riffrooster's pickguard and on
  Funkadoodle's bass.

**Face, eyes and expression**
- **Eyes:** big, glossy (`style: 'big'`) and always **wet**. A blue tear-meniscus band sits along the lower lid,
  the iris is amber `#FFB12B`, and two white highlights give the "sparkly watery" look.
- **Brows:** angled up (worried).
- **Mouth:** a small orange **beak**, usually open and panting ("hah-hah"), chomping the pepper in idle.
- **Expression range:**
  - default: *teary but stubborn*, still eating
  - happy: ^ ^ with tears still flowing
  - angry: tears plus a fire puff
  - hurt: > < with a tear spray
  - KO: x x with the pepper dropping

**Poses**
- Front ¾ "hero" pose: chomping a pepper, one wing raised to fan its beak, tears streaming, small fire puff.
- Battle-ready: leaning forward on its tiny legs, puffed cheeks, embers in the beak.
- Dex pose: holding the pepper like a microphone, the face of crying but loving it.

**Animation (12 fps, on twos)**
- **Idle:**
  - chomp-chomp (beak 2 frames), tears loop (3 frames), body bob
  - every 5–12 s a quirk: *hiccup flame*, *fans its beak with a wing*, *pulls a new pepper from under its
    wing*, or *full-body flush + steam whistle*
- **Walk:** a waddle-hop that drips a tear trail which steams on the ground.
- **Attack (fire breath):**
  - inhale: the body squashes and the cheeks balloon (2 frames)
  - hold: the flush brightens (1 frame)
  - release: a cone of flame for 4–6 frames, with tears blown backwards by the recoil
  - smear frame on release
- **Hit:**
  - tears spray sideways in an arc (anime tear-burst)
  - down feathers puff out
  - the pepper pops out of its beak and it catches it again on the recovery frame
- **KO:** falls back, x x eyes, the pepper drops, a steam column rises.

**VFX**
- `drip` (tears, continuous)
- `steam` from the stem and wherever tears hit the cheek or floor
- `flame` and `ember` (hiccup, breath)
- `smoke` (KO)
- Breath flame: hard-banded cel flame with a **white core, yellow middle, orange edge and a dark smoke tip**,
  in teardrop "tongue" shapes.

**3D build notes**
- `arch: 'biped'`, `vs` ≈ 0.024.
- The stem uses `sway`, the crest flame is an `fx: flame` at the crest point (small scale), and the tears are
  an `fx: drip` from each eye corner plus a decal stream.
- Eyes `style: 'big'`, mouth `style: 'beak'` (model the beak in voxels).
- Quirks: `hop`, `shakeoff`, `happy`.

**64-px read (priority order)**
1. A **red teardrop** with a **green star cap and curl** on top.
2. **Two bright blue tear lines** (2 px wide). Blue against red is complementary and pops hardest; never drop
   them.
3. **Big white eye highlights.**
4. A yellow beak holding a small green pepper.
- The chest spark can shrink to a 3×3 cream plus-shape. Drop the shank bands.
- Use ≤ 14 colours plus the outline.

**Bond gimmick:** **blazing crest** — the small flame behind the stem ignites into a tall fire mohawk, the tears
**flash-boil to steam** before they fall, and the chest spark glows. Trainer accessory: see §11.
*(Elemental Forms are for finals only.)*

**Eating tie-in (§7):** in zoom-in eating scenes (super-spicy curry), play the flush plus double-tears plus
fire-belch sequence. That makes the passives "Heat Tolerance" and fire-breathing feel earned.

### 1d. Do / Don't
- **Do:**
  - make it read as **a pepper with a chick's face**
  - keep the calyx a 5-point star beret
  - keep the tears in *every* pose and sprite (owner's signature)
  - put a dark wine outline on the red
  - use the spark motif as an uneven 6–7-point burst
- **Don't:**
  - use the RHCP 8-point asterisk, the band's lettering or any album art
  - draw band members' faces
  - make any reference to the stage-nudity sock gimmick
  - copy Torchic's orange body with a yellow tufted crest
  - copy Scovillain's two pepper heads and leaf collar
  - make the tears small or optional

---------------------------------------------------------------------------------------------------

## 2. Riffrooster (Pyro/Echo) — main evolution of Chilichick

**Owner's description (verbatim):**
> **Main evolution: Riffrooster** (Pyro/Echo), a guitarist chicken.
> Close-range, with fast attacks, fast movement and scary fire.

### 2a. References
**RHCP guitarists and guitars**
- Frusciante's 1962 Stratocaster ✓ — https://www.groundguitar.com/john-frusciante-gear/john-frusciantes-1962-fender-stratocaster/ ;
  https://www.guitarplayer.com/gear/the-vintage-fender-stratocasters-of-john-frusciante
- *Californication* gear rundown ✓ — https://mixdownmag.com.au/features/rig-rundown-red-hot-chili-peppers-californication/
- Frusciante gear list ✓ — https://equipboard.com/pros/john-frusciante/gear/guitars
- Fender Stratocaster body, pickguard and headstock ✓ — https://en.wikipedia.org/wiki/Fender_Stratocaster

**Rock guitarist poses**
- Guitar showmanship ✓ — https://en.wikipedia.org/wiki/Guitar_showmanship
- Ten classic guitarist stage moves ✓ — https://www.musicradar.com/news/10-classic-guitarist-stage-moves
- Signature rock and metal stage moves ✓ — https://loudwire.com/signature-rock-metal-stage-moves/
- The windmill ✓ — https://ultimateclassicrock.com/pete-townshend-windmill-keith-richards/

**Rooster anatomy and gamefowl**
- Comb, wattles, hackles, saddle, sickles, spurs ✓ — https://animalcorner.co.uk/chicken-anatomy/ ;
  https://www.Wikipedia.org/wiki/Pea_comb ; https://www.hobbyfarms.com/?p=176
- Shamo gamecock posture ✓ — https://livestockconservancy.org/?p=2695 ; https://creatures.com/species/chicken/oh-shamo ;
  https://animal-world.com/shamo-chicken/

**Fire birds and "scary fire"**
- Blaziken and Combusken ✓ — https://en.wikipedia.org/wiki/Blaziken ; https://m.bulbapedia.bulbagarden.net/wiki/Combusken
- Galarian Moltres ✓ — https://bulbapedia.bulbagarden.net/wiki/Galarian_Moltres ;
  https://pokejungle.net/2022/08/11/galarian-articuno-zapdos-moltres-origin-of-species/
- Ho-Oh ✓ — https://bulbapedia.bulbagarden.net/wiki/Ho-Oh_(Pok%C3%A9mon) ; https://breezewiki.discard.no/pokemon/wiki/Ho-Oh
- Talonflame flame-boundary colour fields ✓ — https://pokemaniacal.com/tag/talonflame/
- *(canonical, not opened)* [K] https://en.wikipedia.org/wiki/Promare ; https://en.wikipedia.org/wiki/Fire_Force ;
  https://en.wikipedia.org/wiki/Yoshinori_Kanada

**Guitar-wielding characters**
- Hi-Fi Rush (rhythm-synced combat) ✓ — https://80.lv/articles/hi-fi-rush-stylish-rhythm-brawler-from-evil-within-dev-tango-gameworks/ ;
  https://xbox.com/games/hi-fi-rush
- FLCL, Haruko's bass weapon ✓ — https://en.wikipedia.org/wiki/List_of_FLCL_characters ; https://flcl.fandom.com/wiki/Bat
- Toxtricity (punk guitar/bass Pokémon) ✓ — https://bulbapedia.bulbagarden.net/wiki/Toxtricity ;
  https://pokejungle.net/2020/12/19/toxel-toxtricity-origin-of-species/
- *(canonical, not opened)* [K] https://en.wikipedia.org/wiki/Br%C3%BCtal_Legend ;
  https://en.wikipedia.org/wiki/Bocchi_the_Rock!

### 2b. Study notes
**Guitars**
- **Frusciante's '62 Strat ✓:** a **3-tone sunburst** with a rosewood fretboard, his main guitar on stage and in
  the studio from 1999. The other Strats of the era were a 1955 2-tone sunburst maple-neck, a 1961 **Fiesta
  Red** and a 1964 **Olympic White** ✓.
  → *Lesson:* the "RHCP guitarist" read is a **worn sunburst Strat-type**, not a pointy metal guitar.
- **Stratocaster anatomy ✓:**
  - a contoured, **asymmetric double cutaway** with an **extended upper horn**
  - a plastic **pickguard** carrying the electronics
  - a headstock with **six tuners in one line**
  → *Lesson:* two "horns" plus a pickguard plus inline pegs are what make a silhouette say "guitar". We keep the
  *grammar* (double horn, inline pegs, pickguard) and swap every *shape* for a pepper or flame shape.
- **Guitar-shaped weapons ✓:**
  - Haruko's left-handed blue Rickenbacker 4001 **bass** (FLCL) shoots bullets, has axe and rocket-launcher
    modes, and has a pull-cord motor on the back.
  - Toxtricity puts strings *on its body*: six chest organs for guitar, four for bass.
  - In Hi-Fi Rush, **every action syncs to the beat**, and keeping time rewards combos and finishers.
  → *Lessons:* the guitar can be swung as a melee weapon, and **attacks on the beat** fit our Echo element and
  §6 music sync.

**Rock poses ✓**
- **Windmill:** big arm circles over the strings (Townshend, borrowed from Keith Richards).
- **Duckwalk:** a one-leg hopping walk (popularised by Chuck Berry, done by Angus Young).
- **Knee slide:** a "powerslide" on both knees.
- **Behind-the-head:** playing with the guitar behind the head (Stevie Ray Vaughan).
→ *Lesson:* these are ready-made attack, dodge and emote silhouettes.

**Rooster anatomy ✓**
- The **single comb** runs in one sawtooth line from the beak to the back of the head.
- The **wattles** hang under the chin.
- The **hackles** are the neck feathers, the **saddle** covers the back, and the **sickles** are the long curved
  tail feathers.
- A **spur** sits on the male's shank.
- The neck, back and tail feathers are glossy and **iridescent**.

**Shamo gamecock ✓**
- A **near-vertical body carriage**, long legs, broad shoulders and well-muscled thighs.
- Hard, tight feathers that don't fully cover the body.
- A pea comb and pearl eyes with "a rather cruel expression".
→ *Lesson:* the **upright fighter silhouette plus a cold stare** gives "scary" without adding size.

**Blaziken ✓**
- Based on a cockfighting Shamo.
- **V-shaped crest**, a face nearly covered in feathers, shaggy feathers hiding scaly legs.
- Wrist markings that produce fire, **flames from the ankles**, and cockfighting-style **spurs**.
→ *Avoid:* the V crest, the wrist-flame bands and the human-like kickboxer torso.

**"Scary fire"**
- **Galarian Moltres ✓:** black wings, crest and tail glowing with **magenta flame-like energy** that is "an
  evil aura, not fire". → *Lesson:* **dark body + unnatural flame colour = menace.**
- **Ho-Oh ✓:** a gold and red **sacred fire** whose prismatic wings trail a rainbow. This is the opposite pole:
  holy fire. We want the dark pole.
- **Promare [K]:** flames drawn as flat **geometric pink, magenta and cyan triangles**.
- **Yoshinori Kanada-style effects [K]:** angular, jagged, hard-edged flames and explosions animated on limited
  frames. Both suit 12-fps cel VFX.
- **Fire Force [K]:** Shinra propels himself with **flames jetting from his feet**, a reference for "fast
  movement".

### 2c. Design direction — Riffrooster
**One-line pitch:** a lean, upright **gamecock rock guitarist**. Its comb is a row of live flames, its long
hackle feathers fall like rock-star hair, and the tear tracks it cried as a chick have dried into **black
"mascara-run" war paint**. It wields a sunburst **pepper-gourd guitar** like a blade, and its close-range fire
turns **dark and frightening** when it attacks.

**Silhouette and proportions**
- **Height:** ≈ 1.85 m including the comb (final).
- **Build:** upright Shamo carriage with the torso nearly vertical, a **V-taper chest** and **long legs**
  (≈ 45% of height).
- **Head:** ≈ 1/6.5 of height (heroic, not chibi).
- **Shape language:** **triangles and sharp diagonals.** The guitar is slung diagonally across the body, the tail
  sickles sweep up and back, and the comb points flick forward.
- **Silhouette test:** "a rooster with a guitar" must read in pure black fill.

**Body parts**
1. `head` — a sharp face with a short hooked beak in bone-yellow. A **single comb ✓** with five sawtooth points,
   each point a **flame tongue** (emissive).
2. **Wattles** — two small flame-red drops that swing during headbangs.
3. **Hackle mane** — long shaggy feathers falling past the shoulders like 90s rocker hair, fire-orange to gold,
   with darker tips. They whip during headbangs (`sway`).
4. **Tear-track war paint** — one soot-black streak below each eye, running down the cheek. This is the
   Chilichick "crying" signature, grown up.
5. `body` — crimson, with a slightly lighter breast. The **saddle feathers** fan over the hips like a jacket hem.
6. `armL/R` (wings as arms) — feathered arms whose **3–4 primary feathers act as fingers** for fretting and
   picking. **One black leather band on the picking wrist**, studded with tiny dried-chili studs.
7. `legL/R` — long, scaly, bone-yellow legs with **one spur each ✓** that glows white-hot when charged, and
   **ankle flame jets** for dashing.
8. `tail`, `tail2`, `tail3` — three long **sickle feathers ✓**, black at the root fading to crimson and
   **burning at the tips**.
9. **Prop: the guitar.**
   - **Body:** grown from a **hardened giant chili gourd** (gourd instruments are real) and lacquered in a
     **3-tone fire sunburst**: black edge → crimson → amber centre (borrowing the '62 Strat's 3-tone sunburst
     ✓, recoloured).
   - **Horns:** an offset double cutaway whose two horns are **flame tongues**, the upper one longer ✓.
   - **Pickguard:** shaped like a **single cream feather**, with the line's spark motif engraved.
   - **Headstock:** shaped like a **rooster comb**, with six inline pegs ✓.
   - **Pickups:** three ember slots that glow when it plays.
   - **Strap:** a **chili ristra** (a string of dried red peppers) [K].
   - **Pick:** a dried chili flake. A short pepper stem sticks out of the beak like a toothpick, because it is
     still always eating a pepper.

**Palette (core)**
| Role | Base | Shadow | Deep | Highlight |
|---|---|---|---|---|
| Plumage | `#C4182C` | `#74103A` | `#3B0A26` | `#F0503A` |
| Hackle mane | `#FF7A1A` | `#C2421E` | — | `#FFC23D` |
| Comb and wattles | `#FF3A2E` (glow) | `#B3122E` | — | `#FFD27A` |
| Soot black (primaries, tail root, war paint) | `#1C1220` | `#0E0910` | — | `#4A3550` (rim) |
| Beak, legs, spur | `#E9B44C` | `#9C6A2E` | — | `#FFE8A8` |
| Guitar sunburst | edge `#2B0B0E` → `#B3201A` → centre `#FFB12E` | pickguard `#F6E7C8` | hardware `#D8D8E0` | |
| Outline | `#1A0710` | | | |

**"Scary fire" VFX palette:** rim `#FFF0D6` → hot pink-red `#FF2E55` → wine `#8A0E3E` → **black core**
`#12060E` (inverted: the flame is dark inside and bright only at the edges).

**Face, eyes and expression**
- **Eyes:** `style: 'fierce'` with **pearl-pale irises** `#F2E6D0` (the Shamo's pearl eyes ✓) and pinprick
  pupils, rimmed in soot "eyeliner". In scary-fire mode the irises **glow** (`glow: 2`).
- **Mouth:** the beak, open on attacks (`beak`).
- **Default expression:** a cool, cold stare with a half-smirk around the pepper-stem toothpick.
- **Range:** happy is a cocky grin with eyes closed; angry is a wide open beak with the comb flaring; hurt
  shows the tear tracks glistening for 1 frame.

**Poses**
- **Hero:** low wide stance, guitar held diagonally across the body, wing raised mid-strum, tail sickles fanned,
  comb blazing.
- **Behind-the-head solo ✓:** the bonded ultimate pose.
- **Duckwalk ✓:** taunt emote, hopping on one leg across the arena (§6 emote moves).

**Animation (12 fps, on twos)**
- **Idle:** taps a foot on the beat (2 frames) with the guitar slung low and the comb flames flicking. Quirks:
  `headbang` (mane whip), `flex`, and *chewing the pepper stem*.
- **Move:** fast. It leans 30° forward and the **ankle jets** leave short flame skid-marks (`flame` fx at the
  ankles). Use 1-frame smear frames on dashes.
- **Attacks (close range, fast, on the beat):**
  1. **Neck-slash string** — a 3-hit combo swinging the guitar neck like a blade, with arc trails in scary fire.
  2. **Power-chord burst** — a strum that throws a short cone of dark fire.
  3. **Windmill ✓** — the arm circles and a **ring of fire** spins around it, hitting nearby enemies.
  4. **Spur kick** — a leaping kick led by a white-hot spur.
  5. **Knee slide ✓** — the dodge: it slides under an attack on its knees, sparks spraying from the guitar.
- **Hit:** body feathers spike outward, the comb flames **go out for 1 frame** then re-ignite, and the audio is
  guitar feedback.
- **KO:** drops to one knee with the guitar neck planted in the ground like a sword and smoke rising from the
  comb.

**VFX**
- `flame` (comb, tail tips, ankles), `ember`, `spark` (string hits), `note` (Echo element), `smoke`.
- **Scary fire:** hard-banded, **jagged angular tongues** (Kanada-style [K]) with the **dark core** palette above.
  The big attacks briefly form a **flaming rooster-skull silhouette** inside the burst, for 2 frames only.
- **Beat flash:** on each beat the ember pickups and spurs pulse together.

**3D build notes**
- `arch: 'biped'`, `vs` ≈ 0.05.
- Mirrored parts `armL`, `legL`. The tail chain uses `sway`. The guitar is its own bone on `armR`.
- Eyes `fierce` with a pearl iris. Mouth `beak`.
- `fx`: flame on the five comb points (small), flame on the 3 tail tips, flame and ember on the ankles (only
  while moving).
- Quirks: `headbang`, `flex`, `roar`. `anim.maxSpeed` high.

**64-px read**
1. A **tall upright rooster** with a **flame comb** (5 bright pixels of yellow-white over red).
2. The **guitar as one strong diagonal** with a sunburst: dark edge, bright amber centre.
3. **Long swooping tail.**
4. Bone-yellow beak and legs to break up the red mass.
- The war-paint streaks can be 1 px.
- Keep the scary-fire black core only in VFX, never on the body sprite, so the body never reads as a "dark
  version".

**Elemental Form (final, bonded + Spectral stone)**
- From the waist down the body becomes **living flame**: an elemental-avatar body like Pixar's *Elemental*
  [K] or Ifrit, with the plumage turning into **fire feathers with hard cel bands**.
- The comb becomes a **crown of five pillar flames**.
- The **guitar strings become lines of fire**, the sunburst becomes white-hot, and the ristra strap becomes a
  chain of burning peppers.
- The tear tracks **glow like magma cracks**.
- Colour shift: the scary-fire palette now lives *on the body* (black-red core with pink-white rim lines).
- **The silhouette stays Riffrooster:** upright, diagonal guitar, sickle tail.

**Bond gimmick:** **blazing crest** — the comb flames triple in height and stream backwards as it moves; the
mane becomes partly fire. Trainer accessory: see §11.

### 2d. Do / Don't
- **Do:**
  - use the upright gamecock posture
  - give the guitar inline pegs, a double horn and a pickguard, built from pepper and flame shapes
  - use a 3-tone fire sunburst
  - keep the tear-track war paint
  - make the scary fire dark-cored and jagged
  - time the attacks to the beat
- **Don't:**
  - copy a Fender Stratocaster outline, the Fender logo or headstock decal, or any real guitar
  - give it Blaziken's V crest, wrist flames or kickboxer human torso
  - copy Galarian Moltres's magenta-on-black colouring wholesale (we use pink-red and wine on crimson)
  - draw any real guitarist's face, hair or tattoos

---------------------------------------------------------------------------------------------------

## 3. Funkadoodle (Pyro/Echo) — alternate evolution of Chilichick

**Owner's description (verbatim):**
> **Alt evolution: Funkadoodle** (Pyro/Echo), the band's *bassist* rooster.
> *Interpretation: alternate band member, keeping the RHCP theme.*
> Slap-bass fire shockwaves; still fast and close-range.

### 3a. References
**Flea (RHCP bassist): stage energy and gear**
- Bass style and stage presence ✓ — https://media.igefa.de/flea-and-the-red-hot-chili-peppers-why-his-bass-style-changed-everything-22q0
- Gear (StingRay → Modulus, '61 Jazz Bass) ✓ — https://www.uberproaudio.com/who-plays-what/104-red-hot-chili-peppers-fleas-bass-gear-rig-and-equipment ;
  https://www.bonedo.de/artikel/play-alike-34-flea
- *(canonical, not opened)* [K] https://en.wikipedia.org/wiki/Flea_(musician)

**Slap bass**
- Slapping (music) ✓ — https://en.wikipedia.org/wiki/Slapping_(music)
- How Larry Graham invented slap bass ✓ — https://guitarworld.com/features/how-larry-graham-invented-slap-bass ;
  https://www.premierguitar.com/artists/interview-larry-graham-sheer-energy

**Bass guitars**
- Jazz Bass vs Precision Bass ✓ — https://en.wikipedia.org/wiki/Fender_Jazz_Bass ;
  https://www.guitarworld.com/features/fender-jazz-bass-vs-fender-precision-bass

**Funk fashion**
- Bootsy Collins: star glasses, Bootzilla, space bass ✓ — https://soultracks.com/artist/bootsy_collins/ ;
  https://dailynexus.com/2002-10-30/glory-be-the-funks-on-artsweek/ ;
  https://www.rollingstone.com/music/music-features/bootsy-collins-impostor-fake-crime-1234629225/

**Crests and fluffy chickens**
- Polish crest, Silkie pompom, frizzle feathers ✓ — https://en.wikipedia.org/wiki/Frizzle_(chicken_plumage) ;
  https://animal-world.com/fluffiest-chicken-breeds/ ;
  https://mypetchicken.com/blogs/faqs/what-are-frizzles-sizzles-and-frazzles

**Punk and bass creature designs**
- Toxtricity, Low Key form (bass) ✓ — https://bulbapedia.bulbagarden.net/wiki/Toxtricity
- FLCL bass weapon ✓ — https://en.wikipedia.org/wiki/List_of_FLCL_characters

### 3b. Study notes
**Flea ✓**
- On stage he **jumps all around**, moves erratically, **headbangs**, and plays wild and slap-heavy.
- His main bass was a **Music Man StingRay** until *Californication*, then a **Modulus** signature (sunburst),
  with a '61 **Jazz Bass** on *Stadium Arcadium*.
- [K] He often has **brightly dyed hair** (green, pink, bleached), goes shirtless, and has a well-known habit of
  **walking on his hands**.

**Slap mechanics ✓**
- **Slap:** the **thumb** strikes the low strings near the neck with the bony side joint, and the string hits
  the frets for a buzzy tone.
- **Pop:** the **index finger hooks** a high string and snaps it against the fretboard.
- Fast slapping uses **forearm rotation** to alternate slap and pop.
- Larry Graham invented it to imitate **kick drum (thumb) and snare (pop)** with no drummer; he called it
  "thumpin' and pluckin'".
→ *Lesson:* two distinct visual beats. The **thump is low, heavy and wide** (ground shockwave). The **pop is
sharp, high and vertical** (spike burst).

**Bass shapes ✓**
- The Jazz Bass has an **offset waist**. The Precision is more symmetrical, chunkier and has a wider neck.
- A bass reads through **four strings**, a **longer neck** and a **bigger body** than a guitar.
- Toxtricity also uses **four** chest organs for its bass form ✓.

**Funk fashion ✓**
- Bootsy wore **star-shaped rhinestone mirror glasses** and a top hat, **star-spangled flared pants**,
  open-chested jumpsuits, and played a **star-pattern crystal bass**.
- P-Funk staging had robes, big hats and boots, and a sci-fi cartoon alter ego (Bootzilla).
→ *Lesson:* the funk read is **flares, sparkle, shades and swagger**. We translate it into feathers and
peppers, and do not copy the star glasses.

**Chicken breeds ✓**
- The **Polish** has a huge pompom crest that can block its eyes.
- The **Silkie** has fur-like wispy plumage and pompom "hats".
- **Frizzle** feathers **curl outward** instead of lying flat.
→ *Lesson:* natural "crazy hair" for a rooster, so **frizzle the crest into a dyed-looking mohawk.**

**Toxtricity ✓** already owns "punk mohawk + chest strings + electric". Keep our strings on a held bass, not
on the chest.

### 3c. Design direction — Funkadoodle
**One-line pitch:** a bouncy, crouching **funk-punk rooster bassist**. It has a frizzled mohawk crest that
fades **from ripe red to unripe lime** like a pepper ripening, **pepper-ring sunglasses**, and flared feathered
"bell-bottom" legs. Every thumb-slap on its **bell-pepper bass** stamps a fire shockwave into the ground.

**Silhouette and proportions** (deliberately the *opposite* of Riffrooster)
- **Height:** ≈ 1.65 m (shorter), and **wider** at the hips and legs.
- **Pose:** a permanent **crouched funk stance** with knees bent and the torso tilted back, as if leaning into a
  groove.
- **Head:** ≈ 1/5 of height. Bigger and more cartoonish: funny rather than scary.
- **Shape language:** **circles and bouncy S-curves plus zigzags.** The bass is held **lower and more
  horizontal** (Riffrooster's guitar is diagonal).
- **Silhouette keys:** a **tall frizzled crest** on top, **flared leg feathers** at the bottom, and a long bass
  neck sticking out sideways.

**Body parts**
1. `head` — a wide grinning beak with tiny cheek streaks in orange (the tear-track echo of Chilichick, rendered
   as "sweat stripes").
2. **Frizzle mohawk crest** — a tall, curled-outward feather mohawk (frizzle ✓ / Polish crest ✓). The colour
   gradient runs **red root → amber → lime tips**, reading like dyed hair and like a pepper ripening.
3. **Pepper-ring shades** — round sunglasses whose rims are **cross-section slices of a chili pepper** (a red
   ring with tiny seed dots). The lenses are dark with an orange reflection. They are part of its look, not a
   trainer item.
4. `body` — a round, fluffy chest with a cream bib carrying the **spark motif**. The plumage is tangerine-red
   and slightly frizzled on the shoulders.
5. `armL/R` — feathered wing-arms with a **big thumb-like alula feather** on the slapping hand. The alula is the
   real bird "thumb" [K], which makes it a perfect slap thumb.
6. `legL/R` — **"bell-bottom" leg feathers**: Cochin-style feathered legs ✓ that **flare out widely** below the
   knee, cream with orange flame-stripes and a burning hem. Under them sit big stomping feet.
7. `tail` — a short, round, **frizzled pompom tail** that is round, not sickle.
8. **Prop: the bass.**
   - **Body:** a glossy **green bell pepper** with lobes and an **offset waist** ✓.
   - **Neck:** long.
   - **Headstock:** the **pepper stem curl**.
   - **Strings:** **4 strings ✓** that glow like coals.
   - **Bridge:** a strip of seeds.
   The green bass contrasts with the red body, the inverse of Riffrooster's red-on-red.

**Palette (core)**
| Role | Base | Shadow | Deep | Highlight |
|---|---|---|---|---|
| Plumage | `#F25A2A` | `#B02A3C` | `#521338` | `#FF9A5A` |
| Mohawk gradient | root `#FF3B2F` → `#FFB020` → tips `#A8EB3A` | `#C2202C` | — | `#E6FF9A` |
| Bell-bottom leg feathers | `#FFE9B8` | `#E0A86A` | — | stripes `#FF8A1F` |
| Bass (bell pepper) | `#5DBB46` | `#2C6E3A` | `#173D25` | gloss `#D2F7A0` |
| Bass strings (coal glow) | `#FF7A2E` (glow) | | | |
| Shades | lens `#1D1A33` | rims `#E8321E` | | reflection `#FF9A3D` |
| Beak and feet | `#FFB52E` | `#C26A1E` | | |
| Outline | `#2A0B18` | | | |

**Face, eyes and expression**
- **Eyes** sit hidden behind the shades most of the time; use the shades decal as the default face. When the
  shades slip, the eyes are `anime` with amber irises and are **still slightly teary**, the Chilichick callback.
- **Mouth:** a wide **grin**. When playing it pulls a **"bass face"**: beak scrunched, head tilted, eyes squinted.
- **Personality:** joker, show-off, groove-driven, unstoppable energy.

**Poses**
- **Hero:** a deep crouch with one bell-bottom foot stomping, the bass held low and horizontal, the thumb raised
  mid-slap, and the mohawk swept back.
- **Jump:** a mid-air scissor-split with the bass held overhead.
- **Handstand walk** [K] Flea nod: an emote (§6). The bass is balanced on its tail feathers.

**Animation (12 fps, on twos)**
- **Idle:**
  - **knee-bounce on every beat** (2 frames) with a **chicken head-bob** forward and back on the off-beat
    (real chickens bob, which suits funk)
  - the mohawk springs (`sway`)
  - quirks: `spin`, `hop`, `happy`, *handstand*
- **Move:** fast skip-hops, a slide-step sideways and a backslide, with a burning footprint on every step.
- **Attacks (close range, fast, on the beat):**
  1. **Thump ✓ (thumb slap):** the thumb hits the low strings and an **expanding fire shockwave ring** runs
     flat along the ground. It is low and wide, the kick drum.
  2. **Pop ✓ (finger pop):** a high string snaps and a **vertical fire spike** bursts up under the nearest
     enemy. It is narrow and sharp, the snare.
  3. **Slap-pop combo:** alternating rings and spikes on consecutive beats, using the forearm-rotation loop ✓.
  4. **Split slam:** it jumps into a split, lands, and a **big double ring** spreads out.
- **Hit:**
  - the frizzle feathers **puff out to 1.3× for 2 frames**
  - the **shades slip down its beak** and reveal teary Chilichick eyes for 2 frames, then it pushes them back
    up (a signature gag)
- **KO:** flat on its back with the bass lying on its chest and the strings fizzing out.

**VFX**
- **Ground rings:** flat torus-shaped flame bands with hard 3-band colours and *visible beat timing* (one ring
  per beat).
- **Spikes:** pillar flames. `note` fx in lime/amber pops off the strings.
- `flame` on the leg hems, `spark` on pops, `dust` on landings.

**3D build notes**
- `arch: 'biped'`, `vs` ≈ 0.048.
- The crest chain uses `sway`. The shades are a decal or a voxel part on the head. The bass is its own bone on
  `armL`.
- Quirks: `spin`, `hop`, `happy`, `headbang`. `anim.bounce` high.

**64-px read**
1. **Lime-tipped mohawk** (lime against red is the colour signature of the alt).
2. **Dark shades with red rims.**
3. **Green bass held horizontally.**
4. **Wide cream flared legs.**
- Funkadoodle and Riffrooster must be told apart in 1 second: **green horizontal bass + lime crest + flares**
  vs **sunburst diagonal guitar + flame comb + long tail**.

**Elemental Form (final, bonded + Spectral stone)**
- Its body becomes a **walking speaker of fire**: **concentric fire rings orbit its torso** like a speaker cone
  or vinyl grooves, rippling outward on every beat.
- The bell-bottom flares become **pure flame**.
- The mohawk becomes a **lime-to-white plasma crest**.
- The bass's bell-pepper body splits open to reveal **glowing seed-embers**, and its strings turn to lava.
- Every footstep leaves a burning ring.
- **Silhouette kept:** a crouched stance, a tall crest, wide flares and a horizontal bass.

**Bond gimmick:** **blazing crest** — the frizzle mohawk ignites from the roots up, and the **feathers puff**
in rhythm. Trainer accessory: see §11.

### 3d. Do / Don't
- **Do:**
  - make it crouched, wide and bouncy
  - use a frizzle crest and a ripening gradient
  - use pepper-ring shades
  - give the bass four strings, an offset bell-pepper body and a long neck
  - show the thump as a ring and the pop as a spike, on the beat
  - use the shades-slip tear gag
- **Don't:**
  - copy Bootsy's star glasses or star bass
  - copy the Music Man, Modulus or Fender shapes or logos
  - put strings on its chest (that is Toxtricity)
  - draw Flea's face, tattoos or likeness
  - caricature any real person's hair
  - copy Michael Jackson's moonwalk choreography

---------------------------------------------------------------------------------------------------

## 4. Bubblion (Hydro) — base starter

**Owner's description (verbatim):**
> **Concept:** a bubbly lionfish inside a soft, bouncy ball of water, inspired by **Soft & Wet**.
> **Look:** wears a **crown**.
> **Play:** water bullet attacks; long-range and slow.

### 4a. References
**Soft & Wet (JoJo's Bizarre Adventure Part 8, *JoJolion*)**
- Soft & Wet on the JoJo wiki ✓ — https://jojowiki.com/Soft_and_Wet ; https://jojowiki.com/Soft_and_Wet_Go_Beyond ;
  https://breezewiki.discard.no/jojo/wiki/Soft_%26_Wet
- Ability write-up ✓ — https://sportskeeda.com/anime/jojo-s-bizarre-adventures-the-versatile-joestar-stand-unexpected-one ;
  https://jojowiki.com/Soft_%26_Wet/fr
- *(canonical, not opened)* [K] https://jojowiki.com/Josuke_Higashikata_(JoJolion)
- **The Prince link [K]:** the Stand is named after **Prince's 1978 debut single "Soft and Wet"**, which is why
  the owner pairs Prince with Soft & Wet in this line. *(canonical, not opened)*
  https://en.wikipedia.org/wiki/Soft_and_Wet

**Lionfish** *(searches cut off by the budget; all [K])*
- *(canonical, not opened)* https://en.wikipedia.org/wiki/Red_lionfish ; https://en.wikipedia.org/wiki/Pterois
- Water-jet hunting behaviour [K]: Albins & Lyons (2012), "Invasive red lionfish *Pterois volitans* blow
  directed jets of water at prey fish", *Marine Ecology Progress Series*. Verify.

**Pokémon fish, water guns and bubbles** *(all [K]; canonical Bulbapedia pages, not opened)*
- Clauncher / Clawitzer (pistol-shrimp water cannon) — https://bulbapedia.bulbagarden.net/wiki/Clawitzer_(Pok%C3%A9mon)
- Popplio / Brionne / Primarina (water balloons, singing) — https://bulbapedia.bulbagarden.net/wiki/Popplio_(Pok%C3%A9mon)
- Dewpider / Araquanid (water-bubble head dome, ability *Water Bubble*) — https://bulbapedia.bulbagarden.net/wiki/Araquanid_(Pok%C3%A9mon)
- Finneon / Lumineon (butterfly fins, neon spots) — https://bulbapedia.bulbagarden.net/wiki/Lumineon_(Pok%C3%A9mon)
- Goldeen / Seaking (horn, flowing fins) — https://bulbapedia.bulbagarden.net/wiki/Seaking_(Pok%C3%A9mon)
- Inkay (small cute sea creature, glowing spots) — https://bulbapedia.bulbagarden.net/wiki/Inkay_(Pok%C3%A9mon)
- Slowking (a living crown: the Shellder bite) — https://bulbapedia.bulbagarden.net/wiki/Slowking_(Pok%C3%A9mon)

### 4b. Study notes
**Soft & Wet ✓**
- A **streamlined, robotic humanoid**, light in colour, about the height of its user (Josuke). Its **theme is
  mechanical and naval**.
- A **five-pointed star inside a circle** sits on top of its head.
- **Horn-like ears taper into pentagram-shaped prisms**, so the head looks like a **submarine's sail**.
- Its bubbles **steal ("plunder") properties and objects**, such as sight, water from a body, or sound, and
  **pop with a slight explosive force**. Josefumi's bubbles had no markings; **after the fusion, Josuke's
  bubbles carry a five-pointed star**.
- **Go Beyond ✓:** the bubbles are really **very fine, rapidly spinning threads or lines**. A thread can pass
  through a body and burst inside it.
- [K] Josuke (JoJolion) wears a **sailor uniform and sailor cap**, and stars are a family motif.
→ *Lessons:*
  - **naval / sailor** styling
  - **star-marked bubbles**
  - bubbles that **spin**
  - **plunder** as a flavour for status effects (the designers decide whether to use it)
  - **pop with a small blast**

**Lionfish [K]**
- **Bands:** red lionfish have bold **vertical bands of maroon or red-brown alternating with cream or white**,
  including thin stripes radiating across the face and through the eye.
- **Spines:** about **13 long, separate, venomous dorsal spines** like a mohawk or crown, plus venomous pelvic
  and anal spines (≈ 18 in all).
- **Pectoral fins:** **huge, feathery and fan-like**, with banded spotted rays, held out like wings or a cape
  while hovering.
- **Face:** **fleshy tentacles above the eyes** (supraocular "eyebrows") and a large upturned mouth.
- **Tail:** a clear caudal fin with rows of small dark spots.
- **Behaviour:** a **slow, hovering ambush predator** that herds prey with its spread fins and, documented,
  **blows jets of water at prey**.
→ *Lesson:* the **water-bullet attack has a real biological basis**, and "slow" is true to the animal.

**Pokémon references [K]**
- **Clawitzer:** a giant cannon-claw that fires water and aura blasts. The read of "water gun as artillery".
- **Popplio:** **blows water balloons from its nose**. **Primarina** controls water balloons **with its
  singing**. Bubble attacks become musical, which fits our Echo world.
- **Araquanid:** its head sits inside a **water-bubble dome** that it uses as armour and as a weapon. This is
  the closest existing "creature in a water bubble"; make ours a **full bouncy ball**, not a helmet.
- **Lumineon:** neon spots on butterfly fins. **Slowking:** a crown that is a living creature.
- **No lionfish Pokémon exists**, so the lionfish read is free for us.

### 4c. Design direction — Bubblion
**One-line pitch:** a chubby baby **lionfish prince** floating inside a **soft, wobbly ball of water**. A
tilted gold crown pokes out through the top of the ball, and the ball bounces like a jelly. It puckers and
**spits spinning bubble-bullets** from long range.

**Silhouette and proportions**
- **Height:** ≈ 0.75 m overall. The ball is ≈ 0.7 m in diameter and slightly squashed when resting.
- **The fish:** ≈ 55% of the ball's diameter, centred slightly high.
- **Fish head:body:** ≈ **1:1** (chibi round fish).
- **Silhouette:** a **sphere** with a **crown notch** at the top and fin fans pressing against the inner wall.
  It is the roundest of the three starters.

**Body parts**
1. **Water ball** (`body`, blob):
   - a translucent shell with a **bright rim line**, one big **window-shaped highlight** at the top left, and a
     darker refracted lower third
   - **caustic light lines** that crawl over the fish inside
   - small bubbles rising inside, each with a **4-point star glint** (the Soft & Wet star-bubbles, transformed
     into a sparkle rather than a stamped emblem)
2. **Fish body** — round and chubby, with **3–4 coral bands on cream** and thin face stripes through the eyes.
3. **Dorsal spines** — **5–7 long separate spines** fanned behind the crown like a punk crest, each tipped with
   a tiny pearl bubble (safe: no stinging look on the base form).
4. **Pectoral fins** — two oversized **lavender translucent fan-fins** with purple spot rows. They work as
   "hands" (adjusting the crown) and as wings. The purple foreshadows Prince.
5. **Supraocular tentacles** — two soft frilly "eyebrows" above the eyes that wiggle with expressions.
6. **Mouth** — a **pouty upturned mouth**, coral-pink.
7. **Tail fin** — small and clear, with spot rows.
8. **Crown** — a **small gold 5-point crown** worn tilted. Each point ends in a **pearl bubble**. **The crown
   tips pierce the top of the water ball**, and the surface tension visibly dimples and clings around them.
   This keeps the crown readable from outside.
9. **Sailor accent (Soft & Wet's naval theme)** — the cream band right behind the head carries **two thin navy
   stripes** like a sailor collar.

**Palette (core)**
| Role | Base | Shadow | Deep | Highlight |
|---|---|---|---|---|
| Water ball (tint, ~40%) | `#7FDBFF` | `#2F8FD0` | `#1A5FA8` | rim `#E9FCFF`, caustics `#BFF4FF` |
| Fish bands (coral) | `#EE5A4E` | `#B2384A` | `#6E1E3E` | `#FF9180` |
| Fish cream | `#FFF2E4` | `#E6C9C2` (pink-shifted) | | |
| Fins (translucent lavender) | `#CDB8F5` | `#9A82D6` | | spots `#7A4CC8` |
| Crown gold | `#FFC83A` | `#C7862A` | `#7A4A1E` | `#FFF0A0` |
| Pearls | `#F7F3FF` | `#C8C2E8` | | |
| Sailor stripes | `#24306E` | | | |
| Outline | `#1E1A3D` (navy-violet) | | | |

**Face, eyes and expression**
- **Eyes:** big round anime eyes (`style: 'anime'` or `'big'`) with dark navy irises and a **star-shaped glint**
  as the main highlight (`star` exists as an eye style; use it as the highlight shape).
- **Mouth:** a pout (`tiny` / `w`), with a "puff" open shape when shooting.
- **Personality:** a spoiled little prince. Proud, a little lazy (slow), and dramatic about its crown.
- **Expression range:** a smug half-lidded pout by default, ^ ^ when happy, puffed cheeks when angry, swirly eyes
  when hurt.

**Poses**
- **Hero:** inside the ball, one fin raised to straighten its crown, the other fin pointing forward like a
  finger-gun, with a bubble forming at its lips.
- **Dex:** facing the viewer, crown tilted, a bubble with a star glint floating up.

**Animation (12 fps, on twos)**
- **Idle:**
  - the ball "breathes" (a 2-frame squash cycle)
  - the fish drifts in slow circles, fins billowing
  - quirks: *re-tilts its crown*, *blows a bubble that pops on its own face*, *peeks out*
- **Move (slow):** the ball **bounces and rolls**. Every landing does a big squash-and-stretch with a splash
  ring. The fish lags behind the ball's motion like jelly follow-through.
- **Attack (water bullet):**
  - charge: the ball flattens backward and the front surface bulges (2 frames)
  - the fish puckers
  - release: a dense **spinning bubble-bullet** shoots out, with a **spiral spin-line** drawn on it (the Go
    Beyond "spinning thread" idea ✓), and **the ball recoils backward**
  - impact: the bubble **pops with a small blast** ✓ and a splash ring
  - **Aimed shot** (Hydro = precision): a dotted aim line from the ball to the target while charging
- **Hit:**
  - the ball **jiggles violently** (3-frame wobble) and throws droplets
  - the fish's eyes go swirly
  - the **crown pops up out of the ball and lands back on its head**
- **KO:** the ball bursts into a splash and the fish flops on the ground in a puddle with its crown askew,
  pouting.

**VFX**
- `bubble` (constant and on attacks), `drip` (droplets on bounces), `glow` (caustics), `star` (glints on
  bubbles).
- Bullets: a cel-shaded sphere with 2 bands, a white rim and **a 1-px spiral line rotating 45° per frame**.
- Pop: a ring of 6–8 droplets plus a small star flash.

**3D build notes**
- `arch: 'blob'` for the ball, with the fish as a child part using `sway` (follow-through).
- `vs` ≈ 0.026.
- **Transparency in a cel pipeline:**
  - render the ball as **two shells**: the outer rim plus the highlight band
  - tint the interior colours **20% toward `#7FDBFF`**
  - in the 2D sprite, use **every-other-pixel dither or a flat tint** instead of real alpha
- Crown tips use `over: true` so they claim the voxels where they pierce the ball.

**64-px read**
1. **A circle with a bright rim arc and a top-left highlight** (it must read as a ball of water, not a
   glass bowl).
2. **Gold crown points breaking the top edge.**
3. **Coral and cream fish bands**, simplified to **3 bands** at this size.
4. Big dark eyes with one star glint.
- Fins: two lavender wedges.
- Keep ≤ 16 colours, and keep the water to 3 values (rim, body, deep).

**Bond gimmick:** **bubbles** — **3–5 satellite bubbles** form and orbit the ball. Each one is a "loaded
round", and their star glints pulse on the beat. Trainer accessory: see §11.

### 4d. Do / Don't
- **Do:**
  - put a round fish inside a round, soft, bouncy ball
  - use spinning bubble bullets that pop with a small blast
  - keep the crown readable through the ball's surface
  - give the bubbles star glints and the fish naval stripes
  - use the lionfish's real banding, spines and fan fins
- **Don't:**
  - copy Soft & Wet's robotic humanoid body, its circle-star head emblem or its pentagram-prism ears
  - stamp a JoJo-style star logo on every bubble
  - copy Araquanid's head-dome
  - make it a fishbowl or glass sphere: the water is soft and wobbles
  - give it a menacing, venomous look at the base stage

---------------------------------------------------------------------------------------------------

## 5. Princeidon (Hydro) — main evolution of Bubblion

**Owner's description (verbatim):**
> **Main evolution: Princeidon** (Hydro), a king.
> A giant water-tsunami Poseidon lionfish in **bubble armor**.
> Based on **Prince** and **Soft & Wet**.

### 5a. References *(all [K] except Soft & Wet ✓; canonical, not opened)*
**Prince**
- Prince (musician) — https://en.wikipedia.org/wiki/Prince_(musician)
- *Purple Rain* (album) — https://en.wikipedia.org/wiki/Purple_Rain_(album)
- *Purple Rain* (film) — https://en.wikipedia.org/wiki/Purple_Rain_(film)
- The Love Symbol — https://en.wikipedia.org/wiki/Prince_logo_(symbol)
- The Cloud guitar — https://en.wikipedia.org/wiki/Cloud_guitar
- "Soft and Wet" (the 1978 debut single that names the Stand) — https://en.wikipedia.org/wiki/Soft_and_Wet

**Soft & Wet**
- Soft & Wet and Go Beyond ✓ — https://jojowiki.com/Soft_and_Wet ; https://jojowiki.com/Soft_and_Wet_Go_Beyond

**Poseidon and tsunami**
- Poseidon — https://en.wikipedia.org/wiki/Poseidon
- *The Great Wave off Kanagawa* (Hokusai) — https://en.wikipedia.org/wiki/The_Great_Wave_off_Kanagawa

**Water kings in Pokémon**
- Kyogre — https://bulbapedia.bulbagarden.net/wiki/Kyogre_(Pok%C3%A9mon)
- Primarina — https://bulbapedia.bulbagarden.net/wiki/Primarina_(Pok%C3%A9mon)
- Palkia — https://bulbapedia.bulbagarden.net/wiki/Palkia_(Pok%C3%A9mon)
- Empoleon (trident-like horns, "Emperor") — https://bulbapedia.bulbagarden.net/wiki/Empoleon_(Pok%C3%A9mon)
- Gigantamax Kingler (foam) — https://bulbapedia.bulbagarden.net/wiki/Kingler_(Pok%C3%A9mon)

### 5b. Study notes
**Prince, *Purple Rain* era [K]**
- **Clothes:** a **purple** brocade or velvet **long coat** (frock or military cut) with a **high stand-up
  collar**, a **white ruffled shirt** with a lace **jabot** and cuffs, and heeled boots.
- **Face and hair:** curly hair, a thin moustache and eyeliner.
- **Persona:** confident, sensual and theatrical. He did splits and spins on stage, and famously played "Purple
  Rain" **in real pouring rain** at the Super Bowl XLI halftime show (2007).
- **Guitar and symbol:** the custom white **"Cloud" guitar**, with a swooping, scrolling body and a long curled
  horn. From 1993, the **Love Symbol**, a glyph combining the ♂ and ♀ signs with a horn-like flourish.
- **Colour:** Pantone named a purple **"Love Symbol #2"** after him (2017).
- **Name link:** the JoJo Stand **Soft & Wet** takes its name from his **first single, "Soft and Wet" (1978)**.
→ *Lessons:*
  - **purple + white ruffles + gold**
  - a **high collar** and a **long coat silhouette**
  - **swooping curl shapes** (Cloud guitar)
  - **regal confidence**

**Soft & Wet ✓** — bubbles that **spin** (Go Beyond), **star**-marked bubbles, a **naval** theme, and pops with
an explosive force (see §4b).

**Poseidon [K]**
- Iconography: the **trident**, a crown or diadem, a full beard, **horses and hippocampi**, dolphins and a
  shell chariot.
- Epithet: **"Earth-Shaker"**. He causes **earthquakes and tsunamis**.
→ *Lesson:* trident + crown + a wave chariot = sea king.

***The Great Wave off Kanagawa* (Hokusai, c. 1831) [K]**
- A woodblock print dominated by **Prussian blue**.
- A giant wave whose crest breaks into **claw-like fingers of foam**.
- Three boats underneath, and a tiny Mount Fuji in the trough.
→ *Lesson:* **claw-foam fingers** are the iconic way to draw a tsunami in flat colour. They are perfect for cel
bands.

**Pokémon water kings [K]**
- **Kyogre:** a massive whale with **red line markings** that glow cyan in its Primal form.
- **Primarina:** an opera-singer diva with a flowing mane, **a frilled ruff collar** and a coronet. It **sings
  to control water balloons**.
- **Empoleon:** a **three-pronged trident horn** and "Emperor" posture.
- **Palkia:** pearls on its shoulders.
- **G-Max Kingler:** a foam and bubble theme (G-Max Foam Burst).
→ *Lesson:* sea royalty reads as **a collar/ruff, a crown or coronet, pearls, and a trident shape**. The
crowd of existing designs means ours must win through **the lionfish fins as a royal coat** and **bubble
armour**.

### 5c. Design direction — Princeidon
**One-line pitch:** a towering **lionfish king** who stands upright on a curling **tsunami wave**. He wears
**armour made of thick, iridescent, spinning bubbles**, and his giant purple pectoral fins sweep behind him
like a royal frock coat. His spines rise into a high collar, a white frill jabot sits at his throat, and he
holds a gold **trident** with a swooping cloud-curl guard.

**Silhouette and proportions**
- **Height:** ≈ 2.5 m, the tallest of the line. It floats, with its lower body merging into a wave crest.
- **Upright "merman-king" carriage:** the head on top, the torso vertical, and the tail curling down into the
  wave base.
- **Head:** ≈ 1/7 of height.
- **Shape language:** a **wide A-line / triangle**. Broad bubble pauldrons, fin-coat fanned toward the bottom,
  crown points and a **trident vertical** as the strongest line.

**Body parts**
1. `head` — the adult lionfish face, regal and handsome:
   - **eyeliner** around the eyes
   - **two thin curling barbels** under the mouth like a moustache (lionfish face tentacles [K])
   - frilly supraocular tentacles as brows
   - a **curling foam pompadour** of white water on top (Prince's curls, transformed into wave foam)
2. **Crown** — Bubblion's tilted crown grown into a **tall 5-point gold crown**. The points are shaped like
   **lionfish spines**, each tipped with a pearl bubble, and the crown sits straight now.
3. **High collar** — the dorsal spines rise behind the head in a **tall fan collar**, with purple spine
   membranes and gold tips.
4. **Jabot** — **cream ruffled throat frills** cascade down the chest (the ruffled shirt, transformed into fins).
5. `body` — lionfish banding in **plum and cream** (Prince purple meets lionfish bands).
6. **Bubble armour:**
   - **Pauldrons:** clusters of 3–5 big thick bubbles on each shoulder.
   - **Breastplate:** one large convex bubble dome over the chest, showing the plum bands warped beneath it.
   - **Bracers:** bubble rings on the wrists.
   - Every armour bubble has an **iridescent rim** (cyan to pink) and a **slowly rotating spiral spin-line**
     (Go Beyond ✓).
   - The armour is Bubblion's water ball, "hardened and split into plates".
7. `armL/R` — fin-arms: the inner pectoral rays form hands.
8. **Fin-coat** — the **two huge pectoral fins sweep behind him** like a long purple frock coat, with gold-spotted
   ray bands, hanging almost to the wave. It flares dramatically on spins.
9. `tail` → **wave base** — the tail fin flows into a **cresting wave** whose foam breaks into **claw-like
   fingers** (Great Wave [K], our own shapes).
10. **Trident** — a gold shaft with three spine-shaped prongs, sitting on a **swooping cloud-curl guard** (Cloud
    guitar [K], transformed). A pearl bubble spins at the centre.

**Palette (core)**
| Role | Base | Shadow | Deep | Highlight |
|---|---|---|---|---|
| Royal purple (fin-coat, collar) | `#5A2A8C` | `#2F1257` | `#190A33` | `#9A66DA` |
| Body bands (plum / cream) | `#74204F` / `#FFF1DE` | `#45133A` / `#DCC2B6` | | |
| Jabot frills | `#FFF6E6` | `#E2C9B0` | | |
| Gold (crown, trident, tips) | `#E9B23A` | `#9C6A1E` | `#5A3A12` | `#FFE08A` |
| Tsunami water | `#2FB4D8` | `#1B3F7A` (Prussian) | `#0E2148` | foam `#F4FBFF` |
| Bubble-armour rim (iridescent) | `#A6F1FF` → `#FFB7E8` | | | spec `#FFFFFF` |
| Eyes | iris `#B07CFF` | | | |
| Outline | `#160A2B` | | | |

**Face, eyes and expression**
- **Eyes:** half-lidded, confident, with violet irises and an eyeliner rim (`sharp` or `anime` with a heavy upper
  lid).
- **Mouth:** a slight smirk or **pout**.
- **Personality:** regal, theatrical and seductive-cool. A showman king.
- **Expression range:** a raised-brow smirk by default, eyes closed with chin up when happy, a narrow cold stare
  when angry, a gasp when hurt.

**Poses**
- **Hero:** standing tall on the wave crest, the trident planted, the fin-coat swept back, chin raised, one fin
  extended palm-up.
- **Showman spin:** a full rotation that whips the fin-coat into a perfect circle (`spin` quirk).
- **Throne:** the wave curls behind him into a seat-back.

**Animation (12 fps, on twos)**
- **Idle:**
  - a slow float sway with fin-coat billows (2-frame wave) and armour bubbles' spin-lines rotating
  - foam fingers curl and uncurl
  - quirks: `spin`, `flex` (adjusts his collar), *a royal wave of the trident*
- **Move (slow):** glides forward on the wave base. The wave rolls under him with no steps.
- **Attacks (long range, precise):**
  1. **Trident volley** — 3 spinning bubble-bullets in a fan spread, with spiral lines.
  2. **Royal decree** — one big charged bubble, aimed, that **pops with an explosive blast** ✓.
  3. **Tsunami** (heavy, slow) — the wave base rears up into a full **Great-Wave silhouette with claw foam**
     and sweeps across the arena lane.
  4. **Bubble prison** — traps a target in a bubble, using the "plunder" flavour (the designers may make it a
     slow or a silence).
- **Hit:** **1–2 armour bubbles pop** with a visible "armour pip lost" flash, the fin-coat flares, and he
  recoils with a dignified head-turn.
- **KO:** all the armour pops in a chain, the crown tumbles into the wave, and he sinks into the foam.

**VFX**
- `bubble` (armour sheen, attacks), `drip`, `glow` on the crown pearls, `star` glints.
- **Wave:** flat Prussian and teal bands with white **claw-foam** ends, animated as 4-frame cycles.
- **Bubble-armour pop:** a ring of droplets plus a cyan-pink iridescent flash.

**3D build notes**
- `arch: 'floater'` (upright) with arms. `vs` ≈ 0.055. Within the final budget (≤ 20k faces): use **few big
  bubbles**, not many small ones.
- The fin-coat is a chain of `tail`-style parts or `finL/R` with `sway`. The wave base gets its own spin/sway
  bone.
- Armour bubbles are separate parts so each can pop and hide (`hide`).

**64-px read**
1. **A tall purple triangle** (fin-coat).
2. **Gold crown points plus a gold trident line.**
3. **White jabot at the centre.**
4. **Cyan bubble pauldrons** with white highlights.
- The wave base becomes **3 bands of blue with 3–4 white claw-foam pixels**.
- Purple is the dominant hue; gold and cyan are the accents.

**Elemental Form (final, bonded + Spectral stone)** — *"the tide king"*
- The lionfish body becomes **translucent living water**, and the bands become **glowing current lines** (like
  Primal Kyogre's glowing lines [K], in our own pattern).
- The **wave base grows into a full tsunami mantle** curling over his head like a hood, with claw-foam fringe.
- The bubble armour **crystallises into faceted water-glass** (Terastal-like [K]).
- The crown becomes a **ring of standing foam spikes**, and the trident becomes a spinning whirlpool spear.
- **Silhouette kept:** A-line, crown, trident.

**Bond gimmick:** **bubbles** — the armour multiplies, and a **ring of armour bubbles orbits him like a planetary
ring**, each spinning on its own spiral line. Trainer accessory: see §11.

### 5d. Do / Don't
- **Do:**
  - use purple, white ruffles and gold
  - give him a high collar and long coat made from real lionfish fins and spines
  - make the bubble armour with spinning spiral lines
  - use a trident and a 5-spine crown
  - draw the tsunami with claw-foam fingers
  - make him a showman king
- **Don't:**
  - draw Prince's face, his Love Symbol glyph or the Cloud guitar's exact body
  - use song lyrics or text
  - copy Hokusai's composition (boats, Fuji)
  - copy Kyogre's red line pattern or Empoleon's beak-horn trident
  - make him look like a human in a costume (he is a lionfish king)

---------------------------------------------------------------------------------------------------

## 6. Purple Rain (Hydro) — alternate evolution of Bubblion

**Owner's description (verbatim):**
> **Alt evolution: Purple Rain** (Hydro), the **queen** version, wearing a **dress**.

### 6a. References *(all [K]; canonical, not opened)*
**Purple Rain and Prince**
- *Purple Rain* (album, 1984) — https://en.wikipedia.org/wiki/Purple_Rain_(album)
- *Purple Rain* (film, 1984) — https://en.wikipedia.org/wiki/Purple_Rain_(film)
- "Purple Rain" (song) — https://en.wikipedia.org/wiki/Purple_Rain_(song)
- Super Bowl XLI halftime show (played in real rain) — https://en.wikipedia.org/wiki/Super_Bowl_XLI_halftime_show

**Elegant water Pokémon**
- Primarina — https://bulbapedia.bulbagarden.net/wiki/Primarina_(Pok%C3%A9mon)
- Milotic — https://bulbapedia.bulbagarden.net/wiki/Milotic_(Pok%C3%A9mon)
- Lumineon — https://bulbapedia.bulbagarden.net/wiki/Lumineon_(Pok%C3%A9mon)

**Umbrellas and gowns**
- Wagasa (Japanese umbrella) — https://en.wikipedia.org/wiki/Wagasa
- Ruff (clothing) — https://en.wikipedia.org/wiki/Ruff_(clothing)
- Ball gown — https://en.wikipedia.org/wiki/Ball_gown

**Soft & Wet** ✓ (see §4a).

### 6b. Study notes
***Purple Rain* imagery [K]**
- **Album cover:** a purple-toned night photo of Prince on a **motorcycle** in an alley haze, with a woman in a
  doorway, framed by a **painted border of flowers** and script title lettering.
- **Film:** the purple motorcycle, stage smoke, ruffled shirts and lace, and purple everything.
- **Song:** a slow, epic, **emotional guitar ballad**. *Never quote its lyrics.*
- **Super Bowl XLI:** he performed it **in real pouring rain**.
→ *Lessons:* **purple, rain, lace, ruffles and flowers framing a figure**, plus a melancholy grandeur.

**Elegant water Pokémon [K]**
- **Primarina:** a **frilled white ruff** collar, a pearl **coronet**, a long cascading mane, a diva who sings.
- **Milotic:** a cream serpent body, long red hair-like feelers, peacock tail fins with blue and pink scales.
  "The most beautiful Pokémon", calming.
- **Lumineon:** pink neon fin spots.
→ *Lesson:* beauty reads as **long flowing lines, a ruff collar, pearls, and a soft cream plus jewel-tone
palette.**

**Lionfish fins** (see §4b) are **naturally frilly, fan-pleated and spotted**, so they already look like a
**ruffled gown and lace**. The pectoral fin's spread rays look exactly like **umbrella ribs**.

### 6c. Design direction — Purple Rain
**One-line pitch:** an elegant **lionfish queen** whose fins have become a **layered, ruffled purple ball gown**.
She holds a **parasol made from her own lionfish fin**, its spine-ribs fanned out, and **purple rain** falls
from its rim. Where the king is armour and a spear, the queen is a bell, a parasol and a storm of drops.

**Silhouette and proportions**
- **Height:** ≈ 2.1 m (floating).
- **Shape:** an **hourglass / bell**. A narrow cinched waist, a **wide bell-shaped gown** that hovers just off
  the ground, and a **round parasol disk** above her head.
- **At a glance:** the silhouette is **"circle over bell"**. Princeidon is **"triangle with a spear"**. These
  must never be confused.
- **Head:** ≈ 1/7 of height.
- **Shape language:** curves, scallops and drips.

**Body parts**
1. `head` — a refined lionfish face with **long lashes**, rose lips and frilly supraocular tentacles as
   delicate brows. *Optional:* a small beauty mark spot (a natural lionfish spot).
2. **Tiara** — Bubblion's crown refined into a **delicate tiara**. The centre jewel is a **purple raindrop**,
   with pearl bubbles on the points.
3. **Medici fan collar** — the dorsal spines rise behind the head as a tall, **lace-membraned fan collar**
   tipped with pearls.
4. **Ruff** — cream frills circling the neck (ruffles ✓ from the owner's list, and Primarina's ruff
   [K], in our own shape).
5. **Bodice** — the torso keeps lionfish **plum and cream bands** that read as a **corset pattern**, with the
   waist cinched.
6. **Gown** — **3–4 tiers of ruffled fin membranes**, purple to lavender, each tier scalloped. The **lionfish
   spot rows become lace patterns**. The **hem drips water** in a fringe of falling droplets, as if the dress
   is raining.
7. `armL/R` — slender fin-arms with **opera-glove** fin membranes.
8. **Parasol** — the canopy is a **lionfish pectoral fin**: spine-ribs, translucent lilac membrane and spot
   lace. Its rim is trimmed with **tiny purple flowers** (a nod to the album cover's flower frame) and **drips
   purple rain**. The handle is a curled coral stem.
9. **Train** — the tail fin trails behind as a short sheer **train**.

**Palette (core)**
| Role | Base | Shadow | Deep | Highlight |
|---|---|---|---|---|
| Gown violet | `#6B2FA6` | `#3A1468` | `#1E0A3A` | `#A77BEA` |
| Lace / lavender tiers | `#D9C2F7` | `#A98ADB` | | cream lace `#FFF3FA` |
| Bodice bands (plum / cream) | `#7A2458` / `#FFF0E8` | `#4A143C` | | |
| Parasol membrane | `#C79BF0` (translucent) | ribs `#4A1E73` | | |
| Pearl and silver | `#E6E4F2` | `#A9A6C8` | | |
| Lips and blush | `#FF78B8` | `#C2448A` | | |
| Purple rain | `#8C6BFF` | | | `#D4C8FF` |
| Outline | `#1B0A2E` | | | |

**Face, eyes and expression**
- **Eyes:** half-lidded, long-lashed (`anime` with lash pixels), with lilac irises and a single sparkle.
- **Mouth:** `lips` (rose), small.
- **Personality:** graceful, melancholy and commanding. A **diva queen**, the ballad to Princeidon's showman.
- **Expression range:** a serene soft smile by default, eyes closed while singing when happy, a cold raised
  chin when angry, a hand to the cheek when hurt.

**Poses**
- **Hero:** standing in a three-quarter turn, parasol over her shoulder, rain falling from the rim, one fin-hand
  extended, gown flaring.
- **Curtsy** emote.
- **Singing pose:** parasol raised high, head tilted back, rain becoming a curtain around her.

**Animation (12 fps, on twos)**
- **Idle:**
  - **parasol twirl** (rotating canopy, `spin`)
  - gown tiers sway in sequence (follow-through)
  - continuous drips from the hem and the parasol rim
  - quirks: *curtsy*, *adjusts tiara*, *catches a raindrop on a fin*
- **Move (slow):** a **glide** with no steps. The gown hem ripples and leaves a short rain streak behind.
- **Attacks (long range):**
  1. **Purple Rain barrage** — she raises the parasol, a **purple raincloud** forms over the targeted area
     (aim zone), and spinning droplet-bullets rain down for several beats.
  2. **Teardrop** — one precise long-range sniper drop (Hydro precision). The parasol tilts like a sight.
  3. **Parasol guard** — the parasol snaps closed and opens forward as a shield. The drops ricochet.
- **Hit:** the ruffle tiers fling droplets outward, the parasol briefly closes, and her head turns away.
- **KO:** she sinks into a curtsy-collapse, and the parasol drifts down slowly like a leaf.

**VFX**
- `drip` (hem, parasol rim), `bubble`, `petal` (in purple, for the flower rim), `glow` (tiara jewel).
- **Rain:** 1×3-px violet streaks with a white top pixel, angled 10°. Splash rings on the ground.
- **Raincloud:** a flat cel cloud in 2 purple bands, with pulses on the beat.

**3D build notes**
- `arch: 'floater'`. `vs` ≈ 0.05.
- The gown tiers are stacked parts with staggered `sway` phases. The parasol is a part on `armR` with `spin`.
- Mouth `lips`.

**64-px read**
1. **Lilac disk (parasol) above a purple bell (gown).**
2. **Violet rain pixels** falling from the disk.
3. **Cream ruff plus a small tiara sparkle.**
4. A narrow waist with plum and cream bands.

**Elemental Form (final, bonded + Spectral stone)** — *"the storm queen"*
- The gown **dissolves into a falling curtain of purple rain**: the lower body is the downpour itself.
- The parasol becomes a **floating ring-cloud halo** raining around her in a circle.
- The tiara jewel turns into a **glowing raindrop star**, and her skin turns translucent water with lace
  patterns glowing.
- **Silhouette kept:** circle (halo) over bell (rain curtain).

**Bond gimmick:** **bubbles** — the raindrops **freeze mid-fall into floating bubbles** that orbit her skirt,
each a stored shot. Trainer accessory: see §11.

### 6d. Do / Don't
- **Do:**
  - build the dress *from fins*
  - make the parasol *from a fin*
  - use purple rain, lace, ruffles and flowers on the rim
  - keep the bell-plus-disk silhouette
  - make her graceful and melancholic
- **Don't:**
  - copy the album cover composition, the motorcycle or the lettering
  - quote the song
  - draw a real person's likeness
  - copy Primarina's mane and coronet or Milotic's tail
  - make her a recolour of Princeidon (she has a different silhouette, attacks and personality)

---------------------------------------------------------------------------------------------------

## 7. Strawbaa (Bio) — base starter

**Owner's description (verbatim):**
> **Concept:** a cute strawberry sheep, based on **Strawberry Fields**.
> **Role:** healer and support. It can **ram** and has a lot of health.
> **Gimmick:** it can **place plants that damage and heal**, like strawberry vines.

### 7a. References *(all [K]; canonical, not opened)*
**Strawberry Fields Forever and Strawberry Field**
- "Strawberry Fields Forever" — https://en.wikipedia.org/wiki/Strawberry_Fields_Forever
- Strawberry Field (Liverpool) — https://en.wikipedia.org/wiki/Strawberry_Field
- Strawberry Field official site (gates, garden, visitor centre) — https://www.strawberryfieldliverpool.com/

**Strawberries**
- Strawberry — https://en.wikipedia.org/wiki/Strawberry
- Stolons / runners — https://en.wikipedia.org/wiki/Stolon
- Pineberry (white strawberry with red seeds) — https://en.wikipedia.org/wiki/Pineberry

**Sheep designs**
- Wooloo — https://bulbapedia.bulbagarden.net/wiki/Wooloo_(Pok%C3%A9mon)
- Mareep — https://bulbapedia.bulbagarden.net/wiki/Mareep_(Pok%C3%A9mon)
- Shaun the Sheep — https://en.wikipedia.org/wiki/Shaun_the_Sheep
- Alcremie (Strawberry Sweet decoration) — https://bulbapedia.bulbagarden.net/wiki/Alcremie_(Pok%C3%A9mon)

**Kawaii**
- Sanrio — https://en.wikipedia.org/wiki/Sanrio
- Kawaii — https://en.wikipedia.org/wiki/Kawaii

### 7b. Study notes
**"Strawberry Fields Forever" (The Beatles, released Feb 1967 as a double A-side with "Penny Lane") [K]**
- Inspired by **Strawberry Field**, a **Salvation Army children's home** in Woolton, Liverpool, where Lennon
  played in the garden as a child.
- The site is known for its **red-painted wrought-iron gates** with scrollwork between sandstone gateposts.
  The originals were replaced by replicas, and the site opened to the public as a visitor centre in 2019.
- The **promo film** was shot at Knole Park, Kent: the band around a **dead tree and an upright piano strung
  with wires**, with **reversed footage**, colour filters and paint poured over the piano.
- The sound is dreamy and hazy, with a **Mellotron flute** intro.
→ *Lessons:*
  - **dreamy, nostalgic and psychedelic-soft**
  - **red gates with scrollwork curls**
  - a garden of childhood
  - **things moving backwards**
  - poured, dripping colour

**Strawberries [K]**
- **Seeds:** the "seeds" are **achenes** (the true fruits), about **200 per berry**, each sitting in a small
  **dimple** in a regular diagonal lattice.
- **Calyx:** the green **leafy cap of sepals** (the hull).
- **Flowers:** white, **5 petals**, yellow centre.
- **Leaves:** **trifoliate** with serrated edges.
- **Runners:** plants spread by **stolons**, long runners that root and **sprout new plantlets**.
- **Unripe and pineberry:** unripe berries have white shoulders, and the **pineberry** is white with red seeds,
  a natural "shiny" variant.
→ *Lesson:* **runners** are the real-world version of "places plants that spread".

**Sheep and cute references [K]**
- **Wooloo:** a near-perfect **ball of white wool** with a dark face and stubby legs; it rolls.
- **Mareep:** fluffy wool around a blue body, with a striped tail tipped by an orb.
- **Shaun the Sheep:** a black face and legs, a fluffy white body, **eyes close together** and a tuft fringe,
  using flat, readable claymation shapes.
- **Alcremie:** the strawberry decoration is a small accent on a cream body.
- **Kawaii / Sanrio:** a **big head**, **eyes set low and wide apart**, a tiny or absent mouth, rounded
  silhouettes and soft pastels. Sanrio has long used the **strawberry** as a house motif (its company newsletter
  is "Ichigo Shimbun", Strawberry News).

### 7c. Design direction — Strawbaa
**One-line pitch:** a round, squishy **sheep whose wool is a ripe strawberry**. The rose-red fleece is dotted
with golden "seed" tufts, a **leafy green calyx collar** circles its neck, a white strawberry blossom is pinned
in its forelock, and it has **tiny curled horn-buds** like strawberry tendrils. Wherever it stamps, **runners
sprout strawberry plants** that heal friends and snag foes.

**Silhouette and proportions**
- **Height:** ≈ 0.6 m. Length ≈ 0.7 m (a quadruped).
- **Body:** a **wide, heart-shaped wool loaf** (a strawberry seen from the side: broad at the shoulders,
  tapering to a rounded point at the rump).
- **Head:body:** ≈ **1:1.2** (big kawaii head).
- **Legs:** very short (≈ 18% of height), round hooves.
- **Overall read:** a **plush toy**.
- **Shape language:** **circles and soft hearts**, no sharp angles except the tiny calyx points.

**Body parts**
1. `body` — rose-red **fleece in puffy cloud-tufts**:
   - each tuft has a soft pink highlight
   - **golden seed-tufts sit in shallow dimples** on a diagonal lattice (strawberry achenes [K]), ~10–14
     visible per side on the 3D model
2. **Calyx collar** — a ruff of **green sepal leaves** around the neck, 8–10 pointed leaves like a little
   leafy scarf. It holds the trainer's hat during Bond (§11).
3. `head` — a **cream face** (the white flesh of the berry), round, with a **forelock tuft of red wool**.
4. **Blossom clip** — a **white 5-petal strawberry flower with a yellow centre** pinned in the forelock.
5. `earL/R` — soft droopy ears, cream outside and pink inside, shaped like **strawberry leaflets** (serrated
   edge, 3 soft points).
6. **Horn-buds** — two **tiny curled horn-buds**, cream, that **curl like vine tendrils or gate scrollwork**.
   These are what **expand when bonded**.
7. `legFL/FR/BL/BR` — short cream legs with leaf-green "socks" and round hooves.
8. `tail` — a tiny **strawberry** tail, red with seeds and a mini calyx.

**Palette (core)**
| Role | Base | Shadow | Deep | Highlight |
|---|---|---|---|---|
| Fleece rose-red | `#EC3B50` | `#A81E4C` | `#5E1240` | `#FF8496` |
| Fleece tuft pink (soft rims) | `#FFC0CB` | | | |
| Seeds | `#FFD34A` | `#C99A2A` | | `#FFF2A8` |
| Calyx green | `#52B848` | `#2A7040` | `#173F2C` | `#A6E27A` |
| Face cream | `#FFF2E3` | `#E8C6BE` (pink-shifted) | | |
| Blossom | `#FFFDF5` | centre `#FFC93A` | | |
| Blush | `#FF9EAE` | | | |
| Horn-buds and hooves | `#F2DDB8` | `#B9926A` | | |
| Outline | `#3A0F26` | | | |

> **Trio check:** Strawbaa's red is **rose (cool)**. Chilichick's is **orange-red (warm)**. Strawbaa also
> carries much more cream, pink and green.

**Face, eyes and expression**
- **Eyes:** big, round, **set low and wide** (`style: 'round'` or `'big'`), dark plum irises with two highlights.
  Pink blush ovals sit under them.
- **Mouth:** a tiny **ω** (`cat`), opening into a "baa" on bleats.
- **Personality:** gentle, sleepy-sweet, sturdy, and **surprisingly stubborn when it rams**.
- **Expression range:** a content smile by default, ^ ^ with petals when happy, a determined frown with horn-buds
  forward when angry, a dizzy wool-puff when hurt.

**Poses**
- **Hero:** front three-quarter, head tilted, one front hoof raised, a strawberry runner curling out from under it
  with a blossom on the end.
- **Ram-ready:** head lowered, horn-buds forward, back legs digging in.
- **Dex:** sitting like a loaf, with a strawberry balanced on its head.

**Animation (12 fps, on twos)**
- **Idle:**
  - the wool breathes
  - the ears flop on the off-beat
  - quirks: *nibbles a strawberry leaf*, *a blossom pops open in its wool*, `shakeoff` (wool shakes and seeds
    sparkle), `happy` hop
- **Move:** a bouncy trot with the wool jiggling (follow-through) and small petals left behind.
- **Attacks and skills:**
  1. **Ram** — a short charge with the head down, then a cartoon impact star and the wool squashing on contact.
  2. **Plant (runner)** — stamps both front hooves and a **runner vine snakes along the ground** to the target
     point, where a **strawberry plant pops up** (trifoliate leaves, a white blossom and 1–3 berries).
     - **Heal plant:** ripe berries glow and release **pink heal motes** to allies in a radius.
     - **Damage plant:** tendrils **lash and snare** nearby foes, and berries **burst into a juice splash**.
     - The two kinds read differently: a **white blossom on top = heal**, **red curled tendrils on top =
       damage**.
  3. **Heal pulse** — it spins once and a ring of **petals drifts *backwards* into its wool** (reversed motion,
     the promo film's backward footage [K]). Then it releases them outward to heal.
- **Hit:** the **wool puffs out** and a few seed-tufts pop off and sparkle (`spore` or `leaf` fx). It wobbles
  but doesn't fall over (tanky).
- **KO:** it rolls onto its back like a dropped strawberry, legs up, with a little blossom wilting.

**VFX**
- `petal` (white and pink), `leaf`, `spore` (golden seed sparkles), `glow` (heal).
- **Heal motes:** small pink hearts or berries with a white rim, rising.
- **Damage tendrils:** dark-green curls with red thorn-dots.
- Runners: a 2-band green line that "draws itself" across the ground over 4 frames.
- **Dreamy haze:** while it heals, a faint pastel colour-shift ring wobbles outward (the psychedelic softness of
  the song).

**3D build notes**
- `arch: 'quad'`. `vs` ≈ 0.024. Use `noise` on the fleece for cloud-tufts and `spots` for the seed lattice (or
  hand-placed seed shapes for regularity).
- Ears use `sway`. The calyx collar is a ring of `poly` leaves.
- Eyes `round` or `big`. Mouth `cat`.
- `fx`: `petal` at low rate in idle.
- Quirks: `shakeoff`, `happy`, `sniff`, `hop`. `anim.bounce` moderate.

**64-px read**
1. **A rose-red heart-shaped puff**, with 6–10 **2-px gold seed dots** on a diagonal grid. Don't over-speckle.
2. **A green leaf collar.**
3. **A cream face with big low eyes and pink blush.**
4. A **white blossom** on the head (3×3 px plus a yellow centre pixel).
- The horn-buds can be 2 px curls.

**Bond gimmick:** **expanding horns** — the horn-buds **unfurl into big curling vine-horns** with leaves and
blossoms along them. The **wool puffs** up 1.3×. Trainer accessory: see §11.

### 7d. Do / Don't
- **Do:**
  - make the wool *be* the strawberry
  - put seed-tufts in a regular lattice
  - use a calyx collar and a blossom clip
  - add runner-vine plants with distinct heal (blossom) and damage (tendril) silhouettes
  - use kawaii proportions
  - add reversed-motion heal VFX
- **Don't:**
  - copy Wooloo's pure white ball and dark face
  - copy Shaun's face shape
  - use a Sanrio character style 1:1
  - use the Beatles' name, likenesses, lyrics or the Strawberry Field signage text
  - make the damage plants look gory

---------------------------------------------------------------------------------------------------

## 8. Ramberry (Bio/Geo) — main evolution of Strawbaa

**Owner's description (verbatim):**
> **Main evolution: Ramberry** (Bio/Geo), a **giant ram with horns**.
> *Interpretation: also a nod to the album* Ram.

### 8a. References *(all [K]; canonical, not opened)*
**Paul and Linda McCartney, *Ram* (1971)**
- *Ram* (album) — https://en.wikipedia.org/wiki/Ram_(album)

**Ram horns**
- Bighorn sheep — https://en.wikipedia.org/wiki/Bighorn_sheep
- Mouflon — https://en.wikipedia.org/wiki/Mouflon
- Scottish Blackface sheep — https://en.wikipedia.org/wiki/Scottish_Blackface

**Pokémon references**
- Dubwool — https://bulbapedia.bulbagarden.net/wiki/Dubwool_(Pok%C3%A9mon)
- Gogoat (leafy mane, grass ruminant) — https://bulbapedia.bulbagarden.net/wiki/Gogoat_(Pok%C3%A9mon)
- Ampharos (the owner's "?": a sheep line that sheds its wool) — https://bulbapedia.bulbagarden.net/wiki/Ampharos_(Pok%C3%A9mon)

**Strawberry Field gates (scrollwork)** — see §7a.

### 8b. Study notes
***Ram* (1971) [K]**
- The cover is **Linda McCartney's photo of Paul holding a ram by its horns** in a field at their Scottish farm.
- It is framed with **Paul's own hand-drawn, colourful marker doodle border**, with "L.I.L.Y." hidden in it.
- The mood is **homespun, rustic, pastoral and DIY**, warm and a little scruffy.
→ *Lessons:*
  - a **farm ram held by the horns**, so the horns are the "handle" of the design
  - **hand-drawn folk doodles**
  - pastoral warmth

**Bighorn and mouflon rams [K]**
- **Massive spiral horns** that can approach a full curl, with visible **growth rings (annuli)** and ridges.
- A ram's horns can weigh up to ~14 kg, reportedly more than the rest of its skeleton.
- Rams **clash head-on** at speed.
- The **horizontal rectangular pupils** give a calm, alien stare.
→ *Lesson:* the horns are **heavy, ridged, stone-like spirals** that sell "Geo" and "ram".

**Dubwool [K]**
- Large curled horns, a dark face, and wool with a **braided** pattern.
→ *Avoid* the braided wool and the dark face mask.

**Gogoat [K]**
- A **leafy mane and a leafy back** on a ruminant, which shows how to fuse plant and herbivore.

**Strawberry Field gates [K]**
- **Red wrought-iron scrollwork.** It visually rhymes with **ram horn spirals** and **vine tendrils**: one
  curl shape unifies the whole line.

### 8c. Design direction — Ramberry
**One-line pitch:** a **giant, broad-shouldered strawberry ram**. Its deep-red fleece is studded with golden
seeds, a **thick leafy calyx mane** frames its neck, and two **colossal ridged spiral horns**, pale as stone and
banded with folk-doodle growth rings, curl like the scrollwork of a garden gate. It's a living wall: it parries
with its horns and charges like a landslide.

**Silhouette and proportions**
- **Height:** ≈ 2.0 m at the horn tips. Length ≈ 2.4 m (a heavy quadruped).
- **Build:** a **front-heavy wedge**. Massive shoulders and a fleece hump, then the hindquarters taper (the
  strawberry heart shape scaled up and made powerful).
- **Head:** ≈ 1/4 of height *including horns*. The **horns are ~60% of the head's mass**.
- **Legs:** sturdy, ≈ 35% of height.
- **Shape language:** **big spirals and blocks.** Spirals for the horns, blocks for the body and hooves, so it
  reads as rock-solid.

**Body parts**
1. `head` — a long ram face, cream, with a short **dark umber muzzle** and calm eyes (with horizontal
   highlights).
2. `hornL/R` (attached to the head) — **heavy spiral horns** that curl back, down and forward past the cheeks
   to nearly a full curl:
   - stone-cream with **deep annual ridge rings**
   - in the grooves, **hand-painted folk doodles**: tiny hearts, dots, flowers and squiggles in red, green and
     gold (the *Ram* doodle-border nod, made ours)
   - the horn **tips are leaf-green**, as if sprouting
3. **Calyx mane** — a **thick double ruff of green sepal leaves** around the neck and chest (Gogoat-like
   leafiness [K], shaped as a strawberry hull).
4. `body` — deep red **fleece in big rounded tufts**, with **gold seed-studs** in a lattice. On the shoulders
   the seeds are larger, like rivets: Geo armour hints.
5. **Runner vines** — 2–3 green runners trail from the fleece and hang down the flanks. Tiny strawberries hang
   from them and swing as it walks.
6. `legFL/FR/BL/BR` — thick legs, cream with fleece "boots" at the top, and **dark stone hooves** that crack the
   ground.
7. `tail` — a short fluffy tail with one big strawberry tip.

**Palette (core)**
| Role | Base | Shadow | Deep | Highlight |
|---|---|---|---|---|
| Fleece red | `#D02B47` | `#861A45` | `#470E36` | `#FF6E80` |
| Seeds / rivets | `#F5C842` | `#B98A26` | | `#FFF0A0` |
| Horn stone | `#EADBB8` | `#B39A74` | `#6B5440` | `#FFF6E0` |
| Calyx mane | `#3EA14F` | `#1D5C35` | `#0F3322` | `#8FD86A` |
| Face cream | `#FBEAD5` | `#D9B8A6` | | |
| Muzzle and hooves | `#5A3530` | `#3A2A2C` | | |
| Doodles (horn grooves) | red `#E8354A`, green `#52B848`, gold `#FFD34A` | | | |
| Outline | `#2A0C1C` | | | |

**Face, eyes and expression**
- **Eyes:** calm and steady (`anime`, slightly heavy-lidded), amber irises with a **horizontal highlight bar**
  (a gentle nod to sheep pupils).
- **Mouth:** a `line` at rest, a `smile` when happy.
- **Personality:** a **gentle giant**. Protective, slow to anger, immovable once it decides.
- **Expression range:** a serene look by default; when angry, a lowered brow, flared nostrils and the
  hoof-stamp.

**Poses**
- **Hero:** head lowered and turned three-quarter toward the viewer with the horns dominating the frame, a front
  hoof planted on a cracked rock, the calyx mane bristling.
- **Guard:** head down, horns forward like a shield wall.

**Animation (12 fps, on twos)**
- **Idle:**
  - heavy breathing, the mane rustling, the strawberries on its runners swinging
  - quirks: `shakeoff` (the fleece shakes, seeds fall and **sprout tiny seedlings** that vanish), *hoof-stamp*
    (`dust`), *chews cud*
- **Move:** a heavy trot with **dust** on each hoof-fall. In a sprint charge the ground cracks behind it.
- **Attacks and skills (Bio/Geo: walls, parries, healing support):**
  1. **Ram charge** — head down, a long charge, a rock-shard plus petal impact.
  2. **Horn parry** — tilts its horns to deflect. A ring-shaped flash runs along the horn ridges.
  3. **Garden gate wall** — strawberry vines erupt and **weave into a red-and-green scrollwork gate-wall**
     (gate-scroll shapes, never the real gates or signs), which blocks projectiles.
  4. **Runner field** — runners spread in a fan and plant several strawberry plants (heal and damage plants, as
     for Strawbaa, but more of them).
- **Hit:** the fleece ripples, seeds scatter, and it **does not budge**: a 1-frame push-back only.
- **KO:** it kneels down slowly and lies like a hill, the horns resting on the ground and the runners going limp.

**VFX**
- `dust` (hooves), `leaf`, `petal`, `spore` (seed sparkle), `glow` (heal), `gem` (rock-shard sparks on parries).
- **Gate-wall:** flat red-green vine scrolls with 2-band shading, drawn growing over 6 frames.

**3D build notes**
- `arch: 'quad'`. `vs` ≈ 0.05. The horns are **tapered capsule chains** curling around (or a `tor` segment plus
  capsules), with `stripes` for the ridge rings and `paint` decals for the doodles.
- The fleece uses `noise` tufts and seed shapes. The runner vines are short chains with `sway`.
- Quirks: `shakeoff`, `nod`, `sniff`. `anim.maxSpeed` low-medium, with a heavy `gait`.

**64-px read**
1. **Two huge cream spirals** (10–12 px each) on a dark-red mass. **The horns are the read.**
2. **A green leafy mane** between head and body.
3. **Gold seed dots** (3–4 visible clusters).
4. Dark hooves at the base.

**Elemental Form (final, bonded + Spectral stone)** — *"the living field"*
- Its back becomes a **blooming strawberry field on a hillside**: the fleece transforms into **terraced soil and
  leaves with ripe berries**, and white blossoms open and close on the beat.
- The horns **petrify into crystal-veined stone spirals** wrapped in flowering vines (Geo plus Bio).
- A **vine arch** (gate-scroll shape) rises over its shoulders like a garden archway.
- Each hoof-step makes flowers bloom in a ring.
- **Silhouette kept:** a giant quadruped with spiral horns.

**Bond gimmick:** **expanding horns** — the horns **grow another half-curl and sprout flowering vines** along the
ridges. The **fleece puffs**. Trainer accessory: see §11.

### 8d. Do / Don't
- **Do:**
  - make the horns colossal, ridged and stone-like
  - put folk doodles in the ridge grooves
  - use a leafy calyx mane and a seed lattice
  - make vine scroll walls
  - make it a gentle-giant guardian
- **Don't:**
  - recreate the *Ram* cover photo, a pose of a person holding a ram, or the doodle border
  - hide initials or letters
  - copy Dubwool's braided wool or dark mask
  - copy Gogoat's leaf-back saddle
  - draw the real Strawberry Field gates or signage

---------------------------------------------------------------------------------------------------

## 9. Pennyewe (Bio) — alternate evolution of Strawbaa

**Owner's description (verbatim):**
> **Alt evolution: Pennyewe** (Bio), a "Penny Lane" nurse ewe selling poppies from a tray.
> *Interpretation: the pure-healer alternate.*

### 9a. References *(all [K]; canonical, not opened)*
**"Penny Lane"**
- "Penny Lane" (song) — https://en.wikipedia.org/wiki/Penny_Lane
- Penny Lane (the street) — https://en.wikipedia.org/wiki/Penny_Lane_(street)
- Piccolo trumpet (the song's famous solo instrument) — https://en.wikipedia.org/wiki/Piccolo_trumpet

**Poppies**
- Remembrance poppy (history, trays, sensitivities) — https://en.wikipedia.org/wiki/Remembrance_poppy
- *Papaver rhoeas* (common field poppy) — https://en.wikipedia.org/wiki/Papaver_rhoeas

**Nurse motifs**
- Candy striper (red-and-white striped volunteer uniform) — https://en.wikipedia.org/wiki/Candy_striper
- Nurse uniform — https://en.wikipedia.org/wiki/Nurse_uniform
- Florence Nightingale, "the Lady with the Lamp" — https://en.wikipedia.org/wiki/Florence_Nightingale
- Emblem misuse (why games must not use the red cross) — https://www.icrc.org/en/war-and-law/emblem

**Healer Pokémon**
- Chansey — https://bulbapedia.bulbagarden.net/wiki/Chansey_(Pok%C3%A9mon)
- Blissey — https://bulbapedia.bulbagarden.net/wiki/Blissey_(Pok%C3%A9mon)
- Audino — https://bulbapedia.bulbagarden.net/wiki/Audino_(Pok%C3%A9mon)
- Comfey — https://bulbapedia.bulbagarden.net/wiki/Comfey_(Pok%C3%A9mon)

### 9b. Study notes
**"Penny Lane" (The Beatles, 1967) [K]**
- A street in Liverpool. The song paints a **bright, nostalgic, cheerful suburban scene**: a barber showing
  photographs, a banker, a fireman with an hourglass, **a nurse selling poppies from a tray**, the shelter on the
  roundabout, and **blue suburban skies**.
- The sound is famous for its bright **piccolo trumpet** solo.
- *Never quote the lyrics.* We only use the owner's own phrases, "nurse selling poppies from a tray" and "blue
  suburban skies".
→ *Lessons:*
  - **sky blue + cheerful red accents**
  - a **barber-pole stripe**
  - an **hourglass**
  - a **tray of red poppies**
  - bright, tidy, sunny and nostalgic

**Poppies and the poppy tray [K]**
- Remembrance poppies are traditionally sold from **trays** by volunteers. A **red poppy** has 4 papery petals,
  a **black centre** and a green stem.
- **Sensitivity:** it is a war-remembrance symbol, and the Royal British Legion's paper-poppy design is
  protected.
→ *Lesson:* use **natural field poppies** (*Papaver rhoeas*): four soft red petals and a dark centre with a
seed-head boss. Never use the RBL two-petal paper-poppy design.

**Nurse motifs [K]**
- **Candy stripers** are hospital volunteers in **red-and-white striped pinafores**. This fuses the song's
  **barber pole** with **nurse**, an ideal original mash-up.
- Classic nurse caps are folded white caps. Florence Nightingale is "the Lady with the Lamp".
- **The red cross on white is a protected emblem** under the Geneva Conventions, and the ICRC asks games not to
  use it.
→ *Lesson:* use a **heart, a poppy or a blossom** as our medical mark instead.

**Healer Pokémon [K]**
- **Chansey:** pink, egg-shaped, carries an **egg in a pouch**, the Pokémon Center assistant.
- **Blissey:** **fluffy white curls**, an egg pouch, and **nurse-cap-like** head curls.
- **Audino:** **ear feelers that listen to heartbeats** (like a stethoscope).
- **Comfey:** a flower lei that heals.
→ *Lesson:* healers read through **soft round shapes, white and pink, a carried healing item, and a "listening
and caring" gesture.** Ours must not be an egg shape.

### 9c. Design direction — Pennyewe
**One-line pitch:** a gentle upright **nurse ewe**. She has cloud-soft **strawberries-and-cream wool**, a
sky-blue dress with a **red-and-white candy-striped pinafore** (barber pole meets candy striper) and a folded
nurse cap with a **poppy badge**, and she carries a **woven tray of red poppies** on a strap. She hands out
poppies that bloom into healing.

**Silhouette and proportions**
- **Height:** ≈ 1.6 m (a final, but light and petite). **Upright biped.**
- **Body:** a **round wool cloud** (bodice and skirt) on small hooves.
- **Head:** ≈ 1/4.5 of height (softer and more kawaii than Ramberry).
- **Shape language:** circles and soft scallops. **Horizontal tray line** at the waist, **triangle cap** on top.
- **Silhouette vs Ramberry:** **upright, small, a horizontal tray and a cap** vs **a giant quadruped with spiral
  horns**. They are completely distinct.

**Body parts**
1. `head` — a **cream face** with soft droopy ears (leaf-shaped like Strawbaa's), a **curled pink wool fringe**,
   and **tiny curled horns** behind the ears (the expanding-horns gimmick).
2. **Nurse cap** — a **folded white cap** with a scalloped edge. The badge on the front is a **red field poppy**
   (not a cross).
3. **Wool** — the bodice and a **full round skirt of wool curls**, **cream with pink**
   (strawberries-and-cream: the strawberry line, softened). **Gold seed buttons** run down the front.
4. **Dress** — **sky-blue** sleeves and dress panel ("blue suburban skies").
5. **Pinafore** — a **red-and-white candy-stripe** apron over the wool, with a small pocket holding **a tiny
   hourglass** (the fireman nod; it doubles as a heal-over-time timer prop).
6. **Calyx collar** — a slim **green sepal collar**, the line marker, tied with a ribbon.
7. **Poppy tray** — a woven basket-tray hung from a strap around her neck, held at the waist, with **6–8 red
   poppies** and one strawberry.
8. `armL/R` — soft wool arms with cream hooves as hands.
9. `legL/R` — short, with cream hooves and pink "nurse shoes" bands.
10. `tail` — a little pom of pink wool.

**Palette (core)**
| Role | Base | Shadow | Deep | Highlight |
|---|---|---|---|---|
| Wool cream | `#FFF5EC` | `#E9CFC8` | | |
| Wool pink | `#FFD6DE` | `#D7A9BC` | `#8C5B7A` | |
| Sky-blue dress | `#8FCBF2` | `#4F89C6` | `#2C4F86` | `#D4EEFF` |
| Candy stripe red | `#E2384D` | `#A01F44` | | |
| Poppy red | `#E3271F` | `#9E1630` | | centre `#1F1A1C` |
| Leaf green (collar, stems) | `#4F9F55` | `#2A6640` | | |
| Gold buttons | `#F2C548` | `#B48A2A` | | |
| Tray wicker | `#D9A766` | `#9C6B3A` | | |
| Outline | `#3A1B2C` | | | |

**Face, eyes and expression**
- **Eyes:** large, gentle and **kind** (`anime`), soft lilac-brown irises, rounded lower lids with blush.
- **Mouth:** a `smile`, small.
- **Personality:** warm, attentive and quietly brave. The friend who shows up with exactly what you need.
- **Expression range:** a soft smile by default, ^ ^ with a head-tilt when happy, a worried frown (when an ally
  is hurt) with brows angled up, a wince when hurt.

**Poses**
- **Hero:** standing three-quarter, offering a poppy forward with one hoof, the tray tilted toward the viewer,
  head tilted, cap bright.
- **Listening pose:** one ear tipped toward an ally, the "checking on you" gesture (Audino-like caring, in our
  own pose).

**Animation (12 fps, on twos)**
- **Idle:**
  - a gentle sway
  - rearranges the poppies on the tray
  - checks the little hourglass and flips it
  - the ears flop on the off-beat
  - quirks: `nod`, `happy`, *curtsy*, *sniffs a poppy*
- **Move:** small brisk steps (a nurse's hurry). The tray bobs, and a **petal** falls now and then.
- **Skills (pure healer):**
  1. **Poppy toss** — throws a poppy in an arc to an ally. **It blooms on arrival into a burst of healing
     petals** and a pink glow ring.
  2. **Rounds** — walks a small circle and leaves a **ring of poppies** that heals over time while the hourglass
     runs.
  3. **Bedside bloom** — plants a **poppy bed** (the line's plant gimmick, heal-only).
- **Hit:** the wool puffs, **2–3 poppies spill off the tray** and she catches one, and the cap tilts.
- **KO:** she sits down gently with the tray in her lap, the hourglass sand stopping.

**VFX**
- `petal` (red poppy and pink), `glow` (heal rings), `star` (small sparkles), `leaf`.
- **SFX hint (§10):** a bright **piccolo-trumpet-like** fanfare sting on big heals. Original melody only.

**3D build notes**
- `arch: 'biped'`. `vs` ≈ 0.045. The wool skirt uses `noise` curls and the stripes use `stripes`.
- The poppy badge and seed buttons are decals. The tray is a part on the body with a strap, and the poppies are
  small `poly` shapes.
- Eyes `anime`. Mouth `smile`.

**64-px read**
1. **A white-pink round wool cloud with a sky-blue dress.**
2. **A white triangle cap with a red dot.**
3. **A horizontal tray line with 3–4 red poppy pixels.**
4. **A red-and-white striped apron** (alternate 1-px rows).

**Elemental Form (final, bonded + Spectral stone)** — *"the poppy dawn"*
- The wool turns into a **cloud of floating petals and pastel light**, and the dress becomes **sky** with drifting
  cloud shapes on the fabric.
- A **halo-wreath of poppies** floats behind her head like a sunrise.
- The tray becomes a **floating ring of blooming poppies** orbiting her waist, and **healing petals rain** in a
  wide circle.
- The hourglass grows and floats over her shoulder, its sand glowing gold.
- **Silhouette kept:** a small upright figure, a cap, and a ring at the waist.

**Bond gimmick:** **expanding horns** — the tiny horns **unfurl into a wreath of vine-horns with blossoms** that
frame her face. The **wool puffs**. Trainer accessory: see §11.

### 9d. Do / Don't
- **Do:**
  - use a field poppy (four soft petals) as her medical mark
  - combine the candy-stripe and barber-pole look in the apron
  - use sky blue
  - carry the hourglass charm and the poppy tray
  - keep strawberries-and-cream wool linking her to the line
- **Don't:**
  - use the **red cross** emblem
  - use the RBL paper-poppy design or any military insignia
  - quote "Penny Lane" lyrics or draw the band
  - give her Chansey's or Blissey's egg pouch or egg body
  - copy Audino's ear feelers

---------------------------------------------------------------------------------------------------

## 10. Elemental Forms (finals: Riffrooster, Funkadoodle, Princeidon, Purple Rain, Ramberry, Pennyewe)

**Owner's rule (verbatim, §5):**
> **Full potential:** at its **final evolution** a bonded Tokonmon can achieve a **full Elemental Form**.
> It unlocks its full potential, a new form evolution and an elemental form: a special type of form.
> *Kept from v1: at extreme friendship the soul stone transforms (Spectral stone). That stone is what lets a
> bonded final evolution enter its Elemental Form.*

### 10a. References *(all [K]; canonical, not opened)*
**Pokémon form changes**
- Mega Evolution — https://bulbapedia.bulbagarden.net/wiki/Mega_Evolution
- Gigantamax — https://bulbapedia.bulbagarden.net/wiki/Gigantamax
- Terastal phenomenon — https://bulbapedia.bulbagarden.net/wiki/Terastal_phenomenon
- Bond Phenomenon (Ash-Greninja) — https://bulbapedia.bulbagarden.net/wiki/Bond_Phenomenon

**Other transformations**
- Armor Digivolution (*Digimon Adventure 02*, Digi-Eggs) — https://digimon.fandom.com/wiki/Armor_Digivolution
- Super Saiyan — https://dragonball.fandom.com/wiki/Super_Saiyan

**Elemental bodies**
- *Elemental* (Pixar 2023; fire and water bodies) — https://en.wikipedia.org/wiki/Elemental_(2023_film)
- *Promare* (geometric flame style) — https://en.wikipedia.org/wiki/Promare

### 10b. Study notes [K]
- **Mega Evolution:**
  - needs a **trainer Key Stone plus a held Mega Stone** and a **bond**
  - the transformation wraps the Pokémon in a **glowing cocoon** that **cracks** open, with a rainbow DNA-like
    symbol flashing
  - Mega designs **exaggerate existing features** (bigger spikes, longer fins, extra colour accents) and keep
    the base silhouette
- **Gigantamax:** a huge size, **red-pink energy and a red cloud halo** above the head, with a unique redesigned
  look per species (G-Max Charizard's **flame wings**).
- **Terastal:** the body is coated in **faceted crystal**, and a **type-specific Tera Jewel crown** appears on
  the head (Fire's resembles candles). It reads instantly as "gem form".
- **Armor Digivolution:** a **virtue-themed Digi-Egg becomes armour** plates on the partner (Courage → flame
  armour).
- **Ash-Greninja (Bond Phenomenon):**
  - the Pokémon's body takes on **its trainer's look** (a red-and-black crest echoing Ash's cap)
  - a **water vortex** surrounds the transformation, and a **giant water shuriken** appears on its back
  - **trainer and Pokémon share sight and pain**
  - in the games (*Sun/Moon*), the *Battle Bond* ability triggers **after it knocks out a foe**, which parallels
    our Heartbox kills-while-bonded rule
- **Super Saiyan:**
  - **golden spiky hair, a golden flame aura and teal eyes**
  - higher stages add **electric sparks** and longer hair
  - Toriyama reportedly left the hair uninked (white in the manga), saving ink, so the look is readable through
    **value**, not detail
- **Elemental bodies:** Pixar's Ember is **made of flame** whose colour and intensity change with emotion, and
  Wade is **made of water**. Promare draws fire as **flat triangles of pink, magenta and cyan**.

### 10c. Shared Elemental Form rules (all six finals)
1. **The silhouette survives.** Each form keeps its final's top-3 silhouette features (listed in each
   section's Elemental Form note). This is the Mega lesson.
2. **The element takes over 30–60% of the body:** fire below the waist, water as the body or mantle, flowers and
   soil as the back. This is the elemental-avatar lesson.
3. **One element crown.** Every form gains **one readable "crown" element** on or above the head, Tera-jewel
   style: a fire-pillar comb, a lime plasma crest, a foam crown, a halo-cloud, a vine arch, a poppy sunrise.
4. **The trainer's echo.** In Elemental Form the Tokonmon's marks take on **one colour and one shape from the
   trainer's equipped accessory** (the Ash-Greninja lesson). For example, the trainer's cap colour appears in
   Riffrooster's ristra strap or Princeidon's collar tips.
5. **The Spectral stone glows on the body.** A small spectral-stone jewel appears at the chest or brow,
   matching the trainer's bracelet. This is the visual link to the v1 stone.
6. **Palette:** saturate by one step, add `glow` 2–3 on the element parts, and keep **hard cel bands** even in
   glowing fire and water (no soft gradients).
7. **Size:** +10–20% scale (not Gigantamax-giant; the arena must still read).

**Transformation sequence (≈ 2.5 s at 12 fps, music-synced, for the cut-in camera)**
1. **Link** (beat 1): a soul-stone beam from the trainer's bracelet to the Tokonmon, and both flash
   simultaneously.
2. **Cocoon** (beats 2–3): an element cocoon forms. Flame vortex for Pyro, **water vortex** for Hydro
   (Ash-Greninja), petal and vine pod for Bio. The Spectral stone sigil spins in front of it.
3. **Crack** (beat 4): the cocoon cracks along hard lines (Mega), with 2 frames of white silhouette.
4. **Reveal** (beat 5): a smear frame, then the hero pose with the element crown igniting last.
5. **Afterglow:** a ring shockwave in the element's colour and a jumbotron cut-in (§6 stadium).

### 10d. Elemental Form summary
| Final | Element takeover | Element crown | Silhouette kept |
|---|---|---|---|
| Riffrooster | Fire body below the waist, fire feathers, strings of fire | Five pillar flames | Upright, diagonal guitar, sickle tail |
| Funkadoodle | Orbiting fire rings (speaker cone), flame flares | Lime-to-white plasma mohawk | Crouch, tall crest, horizontal bass |
| Princeidon | Translucent water body, tsunami hood-mantle, crystal bubble armour | Foam-spike ring crown | A-line, crown, trident |
| Purple Rain | Gown becomes a rain curtain | Ring-cloud halo raining | Circle over bell |
| Ramberry | Back becomes a blooming strawberry hillside, crystal-stone horns | Vine archway over the shoulders | Quadruped, spiral horns |
| Pennyewe | Petal-cloud wool, sky dress | Poppy sunrise halo | Small upright figure, cap, waist ring |

### 10e. Do / Don't
- **Do:** keep the silhouettes, give each one crown, echo the trainer's accessory, keep hard bands, sync the
  transformation to the music.
- **Don't:**
  - recreate Mega, Tera or Gigantamax visuals literally (the rainbow DNA symbol, Tera crystal jewels, the
    Dynamax red cloud)
  - use Super Saiyan gold hair as a generic power-up
  - make the forms so big they block the arena

---------------------------------------------------------------------------------------------------

## 11. Bond gimmicks (Bonding state) and wearing the trainer's accessories

**Owner's rule (verbatim, §5):**
> **Bonding** links the player with their Tokonmon, with a cool effect (soul-stone beam, aura).
> **Special gimmick:** each Tokonmon gets its own, e.g. expanding horns (Strawbaa/Ramberry), bubbles (Bubblion
> line), fur, blazing crest (Chilichick line).
> **Accessories:** the Tokonmon **wears the trainer's accessories**, like a hat.

### 11a. References *(all [K]; canonical, not opened)*
**Bond Phenomenon**
- Ash-Greninja — https://bulbapedia.bulbagarden.net/wiki/Bond_Phenomenon

**Pokémon wearing hats and costumes**
- Pikachu in a cap (Ash's caps, distributed in the games) — https://bulbapedia.bulbagarden.net/wiki/Pikachu_in_a_cap
- Cosplay Pikachu (Rock Star, Belle, Pop Star, Ph. D., Libre) — https://bulbapedia.bulbagarden.net/wiki/Cosplay_Pikachu

**Link effects in other series**
- Stands (*JoJo*: shared damage, the Stand behind its user) — https://jojowiki.com/Stand
- Persona summoning (*Persona 3/4/5*: card shatter, blue flame) — https://megamitensei.fandom.com/wiki/Persona
- Bit-beasts (*Beyblade*: a spirit emerging in a beam from the bit-chip) — https://beyblade.fandom.com/wiki/Bit-Beast
- Link monsters / Link arrows (*Yu-Gi-Oh! VRAINS*) — https://yugioh.fandom.com/wiki/Link_Monster
- Soul Resonance (*Soul Eater*: weapon and meister sync, weapon grows) — https://souleater.fandom.com/wiki/Soul_Resonance

### 11b. Study notes [K]
- **Ash-Greninja:**
  - the Pokémon *takes on the trainer's look*
  - the two **share sight and pain**
  - the bond reads as **mirroring**: the same pose and the same moment
- **Pikachu in a cap:**
  - the trainer's real cap, **scaled down and worn on top of the head between the ears**, the brim forward or
    backward
  - instantly lovable, and it reads as "this is *my* partner"
  - Cosplay Pikachu shows costumes made *for the creature's anatomy* (ears through holes, tail free)
- **JoJo Stands:**
  - the spirit appears **behind** the user
  - damage to one shows on the other
  - the "menacing" katakana sound-effect text (ゴゴゴ) floats in the air
- **Persona:** a **card shatters**, and a blue flame and silhouette rise behind the user.
- **Beyblade:** a **vertical beam of light** from the top's chip releases the beast.
- **Yu-Gi-Oh! VRAINS:** **link arrows** point from card to card.
- **Soul Eater:** both partners' **wavelengths sync** and the weapon **grows and changes shape**.

### 11c. Shared Bonding visuals (all starters)
1. **Activation:** a **soul-stone beam** (a 2-px line with a hard bright core, in the element colour) from the
   trainer's bracelet to the Tokonmon's chest, with 3 frames of travel.
2. **Aura:** a **1–2-px coloured rim outline** around the Tokonmon (sprite and 3D outline colour swap) that
   **pulses on the beat** (§6 music sync). Pyro is orange-white, Hydro cyan-white, Bio pink-green.
3. **Mirroring:** on activation and on the ultimate, the trainer sprite and the Tokonmon **strike the same pose
   on the same frame** (Ash-Greninja).
4. **Link marker:** a small **floating sigil** above the Tokonmon (soul-stone shape plus three orbiting dots
   that count bond duration). It feeds §5's "how long you've been bonded" passives.
5. **Ultimate:** using it **shatters the link** (Persona card-shatter style). The rim outline breaks into
   shards and the gimmick reverts. This shows that "using an ultimate stops the bonding" (§5).

### 11d. Per-line Bond gimmicks
| Line | Gimmick (owner's) | Visual spec |
|---|---|---|
| Chilichick | **Blazing crest** | The crest flame becomes a tall fire mohawk, tears flash-boil to steam, the chest spark glows |
| Riffrooster | **Blazing crest** | The comb flames triple and stream back, the mane is partly fire, the spurs go white-hot |
| Funkadoodle | **Blazing crest** (plus feather puff) | The mohawk ignites from root to lime tips, and the frizzle feathers puff on the beat |
| Bubblion | **Bubbles** | 3–5 orbiting satellite bubbles (stored shots), star glints pulsing on the beat |
| Princeidon | **Bubbles** | A planetary ring of spinning armour bubbles around the body |
| Purple Rain | **Bubbles** | Raindrops freeze into bubbles that orbit the skirt |
| Strawbaa | **Expanding horns** (plus wool puff) | The horn-buds unfurl into big curled vine-horns with blossoms, and the wool puffs 1.3× |
| Ramberry | **Expanding horns** (plus fleece puff) | The horns grow another half-curl, sprouting flowering vines along the ridges |
| Pennyewe | **Expanding horns** (plus wool puff) | The tiny horns unfurl into a blossom-vine wreath around her face |

### 11e. Wearing the trainer's accessories ("hat sockets")
Every model gets an **accessory socket**: an attachment bone, an offset and a scale. Every sprite gets a
**hat-anchor pixel** plus a per-frame offset table, so any trainer hat (and other accessories, such as hair
clips, earrings or glasses where they fit) can be layered on.

**Guidelines from Pikachu-in-a-cap:**
- Scale the hat **down to the head**.
- Let anatomy poke **through or around** it.
- **Tilt it slightly** for charm.
- The hat **bounces with follow-through** on twos.

| Tokonmon | How it wears the trainer's hat |
|---|---|
| Chilichick | **Hung on its curled stem**: the stem pokes through the cap's button hole, so the hat sits tilted on the calyx beret |
| Riffrooster | Tilted forward low over the eyes (rock-star style). The flame comb burns **around** the brim (the hat never burns; the flames part around it) |
| Funkadoodle | Cocked **sideways** on the side of the mohawk, which springs up through or beside it |
| Bubblion | **Floats on top of the water ball**, held by surface tension and dimpling the ball. The crown pokes up next to it |
| Princeidon | **Worn under the crown**: the crown sits on top of the hat, a comedic royal stack |
| Purple Rain | Pinned atop the tiara at an elegant angle, like a fascinator |
| Strawbaa | **Nestled in the forelock wool**, held by two tiny vine tendrils from the calyx collar |
| Ramberry | Sitting **between the horns** on the brow, small relative to the giant head (cute contrast) |
| Pennyewe | Worn **over** the nurse cap, with the poppy badge clipped onto the hat band |

### 11f. Do / Don't
- **Do:**
  - beat-synced aura pulses
  - the mirrored trainer–Tokonmon pose
  - hats scaled to the anatomy with things poking through
  - a shard-break when the ultimate ends the bond
- **Don't:**
  - copy Ash's cap design or the Ash-Greninja head crest
  - use the JoJo ゴゴゴ text verbatim (we may use our own in-world SFX lettering)
  - copy Persona's card or the Yu-Gi-Oh! Link arrow graphics
  - let accessories hide the eyes or the signature feature (the tears, the crown, the horns)

---------------------------------------------------------------------------------------------------

## 12. Follow-up searches (run when the search budget is available)

These confirm the **[K]** facts above. Run each one in "standard" mode unless marked "extended". Then update the
relevant section and flip **[K]** to **✓**.

**Bubblion / lionfish**
1. `red lionfish Pterois volitans coloration bands dorsal spines pectoral fins supraocular tentacles`
2. `lionfish blow jets of water at prey Albins Lyons 2012`
3. `Clawitzer Clauncher design pistol shrimp water cannon`
4. `Araquanid Dewpider water bubble head design`
5. `Popplio Primarina water balloons singing design`
6. `Josuke Higashikata JoJolion sailor outfit design` (extended)
7. `Soft & Wet stand official colour illustration palette` (extended)

**Princeidon / Purple Rain**
8. `Prince Purple Rain era outfit purple coat ruffled shirt`
9. `Purple Rain album cover photography Ed Thrasher motorcycle flowers border`
10. `Prince Cloud guitar design Dave Rusan`
11. `Prince Soft and Wet 1978 debut single`
12. `Pantone Love Symbol #2 purple hex`
13. `Great Wave off Kanagawa claw foam Prussian blue analysis`
14. `Poseidon iconography trident earthshaker tsunami`
15. `Primarina Milotic design elegance ruff coronet`
16. `Empoleon trident horn design; Gigantamax Kingler foam`

**Strawbaa / Ramberry / Pennyewe**
17. `Strawberry Field Liverpool red gates history replica`
18. `Strawberry Fields Forever promotional film Knole Park piano tree reversed footage`
19. `strawberry achenes number calyx sepals runners stolons`
20. `Ram 1971 album cover Paul McCartney holding ram doodle border Linda photograph`
21. `bighorn sheep horn weight growth rings annuli`
22. `Dubwool Wooloo design; Gogoat leaf mane design`
23. `Penny Lane song imagery nurse poppies tray piccolo trumpet`
24. `candy striper uniform history red white stripes`
25. `ICRC red cross emblem video games misuse`
26. `Royal British Legion poppy design trademark`
27. `Chansey Blissey Audino nurse design origin`

**Elemental Forms / Bond**
28. `Mega Evolution transformation cocoon design philosophy`
29. `Terastal Tera Jewel shapes per type`
30. `Ash-Greninja Bond Phenomenon appearance changes`
31. `Pikachu in a cap Ash hats distribution`
32. `Cosplay Pikachu Rock Star outfit`
33. `Yoshinori Kanada effects style angular flames`
34. `Promare fire design triangles colours`
35. `Fire Force Shinra devil's footprints feet flames`

**RHCP checks**
36. `Blood Sugar Sex Magik cover art credits Henky Penky Gus Van Sant` (extended)
37. `Red Hot Chili Peppers Woodstock 1994 light bulb costumes`
38. `Flea walking on hands stage; Flea hair colours`
39. `ristra chili string New Mexico`

---------------------------------------------------------------------------------------------------

## 13. Global Do / Don't (all starters)
- **Do:**
  - Transform every reference into a creature trait: fins become a coat, a calyx becomes a beret, horns become
    gate scrolls, a gourd becomes a guitar.
  - Keep the owner's signatures sacred: **crying**, **always eating a pepper**, **crown**, **ball of water**,
    **bubble armour**, **dress**, **strawberry vines**, **horns**, **poppy tray**.
  - Check every sprite at **64 px** and every model in **pure black silhouette**.
  - Use hue-shifted shadows and tinted outlines.
- **Don't:**
  - Use real people's likenesses, logos, lettering, lyrics, album compositions or instrument trade dress.
  - Copy any Pokémon, Digimon, JoJo or Sanrio design, even recoloured.
  - Use the **red cross** emblem or military insignia.
  - Make any reference to RHCP stage nudity.
  - Write melodies or lyrics from the songs (§10: original melodies only).
