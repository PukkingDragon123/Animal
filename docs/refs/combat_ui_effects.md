# Tokonmon: Combat, Animations, Attacks, VFX & the Phone UI (reference study + design direction)

Companion to `docs/TOKONMON.md` **§5 (Bonding & Elemental Forms), §6 (Combat), §7 (Skills, stats &
progression) and §8 (The phone)**, plus the parts of §1, §2 and §9 they touch (almost no UI, speech
bubbles, jumbotron, zoom-in eating/ordering scenes, dojo).
Animators, VFX artists, UI artists and programmers read the matching section **before** making anything.
The references are study material only: **transform them, never copy them** (bible §1).

> **The owner's words are law.** Nothing here changes, removes or adds to the bible. Everything under
> "Design direction" is a proposal for *how to show* what the bible describes. Where a proposal touches
> gameplay (for example, what an emote does), it is marked **(open question for owner)** and the bible
> wins. Presentation-only details are marked *(proposal)* where they might be mistaken for rules.

---------------------------------------------------------------------------------------------------

## 0. How to read this file

### 0.1 Reference verification legend

| Tag | Meaning |
|---|---|
| **[S]** | The page came up in a WebSearch during this research pass. The study notes summarise what the search result said about it. |
| **[K]** | A well-known canonical reference (wiki page, GDC talk, official page) cited from the researcher's own knowledge. It was **not** opened or search-verified in this pass. **Verify it and study the actual visuals before production** (see Appendix A). |
| *(proposal)* | A Tokonmon design value invented here (timings, hexes, pixel sizes). It is a starting point to tune in engine, not a measured fact. |

**Research log.**
- **What was blocked:** image downloads and page fetching, so the study used search-result text and
  established reference knowledge. No visual was sampled, so every hex here is a Tokonmon proposal,
  not a colour copied from a reference.
- **What was searched:** 22 WebSearch queries covered topic 1 (real-time creature combat feel, hitstop,
  super freezes, bond transformations, command barks) and part of topic 2 (stadium commentary,
  broadcast graphics).
- **Where the budget ran out:** the shared session budget (200 calls across all parallel agents) was
  used up during topic 2.
- **The rest:** topics 3–8 are built from [K] references. **Appendix A** is a ready-to-run search
  queue to finish verifying them in a follow-up pass. The design directions do not depend on it, but the
  owner's rule ("search and study real references before making anything") is only fully met once
  Appendix A is done.

**Best study tools for artists** (all [K]; open them and look at the real frames):
- **Game UI Database:** https://www.gameuidatabase.com/. Screenshots of real game UIs, searchable by
  screen type (phone, map, inventory, dialogue, HUD…). This is the #1 tool for §6–§8 of this doc.
- **Interface In Game:** https://interfaceingame.com/. UI screenshots and videos per game.
- **The Spriters Resource:** https://www.spriters-resource.com/. Sprite sheets, for counting frames of
  attacks, hit sparks and idles. Study only; never trace.
- **Sakugabooru:** https://www.sakugabooru.com/. Clips of anime effects animation (fire, water,
  impact frames, transformations) with animator credits.
- **Lospec palette list:** https://lospec.com/palette-list. Pixel palettes, for learning ramp
  construction.

### 0.2 Units used in this file

| Unit | Value |
|---|---|
| **tick** | One 60 Hz game-logic step = **16.7 ms**. Hitstop and flashes are counted in ticks. |
| **pose / frame (anim)** | Creature and sprite animation is **12 fps "on twos"** (bible §1): **1 pose = 83 ms = 5 ticks**. VFX sprites also run at 12 fps unless a line says "tick". |
| **px** | One **game pixel** (one texel of the low-res render buffer), never a screen pixel. |
| **m** | One world metre (1 tile; see `docs/MODELING.md`). Starters are 0.55–0.9 m tall, finals 1.6–2.6 m. |
| **beat / bar** | From the music clock: BPM, with 4 beats = 1 bar, and a phrase of 8 bars. |

---------------------------------------------------------------------------------------------------

## 0.3 Global feel & VFX rules (apply to every section below)

### 0.3.1 Pixel VFX rules *(proposal, derived from §3 references)*
1. **Same pixel grid.** VFX render into the same low-res buffer as the creatures, with no "mixels"
   (mixed pixel sizes). Particles snap to whole px.
2. **Fade by ramp, not by alpha.** A particle "fades" by stepping down its colour ramp, then breaking
   up with a 2×2/4×4 Bayer dither, then disappearing. Smooth alpha fades read as non-pixel.
   - **Exception:** an additive bloom pass may sit on top, if it is quantised.
3. **Fast in, slow out.** Every burst is **flash (1 frame) → peak (1–2 frames) → linger and dissipate
   (3–8 frames)**. The biggest, brightest frame comes first or second, never last.
4. **Readable anticipation.** Every strong move has **≥ 2 poses (≥ 167 ms) of anticipation**. In real
   time, that anticipation is also the opponent's telegraph, which is what makes reacting fair.
5. **Smears, not motion blur.** One stretched or afterimage pose replaces motion blur on fast swings and
   dashes.
6. **Outline VFX that must read on every arena** with a 1-px outline in the darkest step of its own ramp.
   - That step is hue-shifted toward purple/blue, never pure `#000000`.
   - The only exception is scary fire (§3.2).
7. **Every VFX is also a light.** It emits a dynamic light in its ramp's mid colour, since the map has
   dynamic lights (bible §1). Flicker at 12 fps, ±10%.
8. **The impact stack.** Every hit is made of these layers, in this order:
   1. hitstop
   2. a 1–2 tick white silhouette flash on the victim
   3. the hit-spark sprite
   4. screen shake
   5. SFX and particles
   6. *optional:* a katakana SFX stamp, for heavy hits only (§0.3.5)

### 0.3.2 Hitstop table *(proposal; ranges from [S] research in §1b)*

| Hit class | Hitstop (ticks @ 60 Hz) | ms | Victim shake during hitstop | Use |
|---|---|---|---|---|
| Multi-hit tick | 2 | 33 | none | fire-breath ticks, rain ticks |
| Light | 4 | 67 | ±1 px, flip every 2 ticks | water bullet, jab, blade slash 1–2 |
| Medium | 6 | 100 | ±1 px | riff slash 3, rolling-boulder hit, charged bullet |
| Heavy | 9 | 150 | ±2 px, decaying to ±1 | ram charge, tsunami, steam explosion |
| Critical | 12 | 200 | ±2 px + a 2-tick white flash of the victim | any crit (the bible's in-battle unlocks trigger on crits, §7) |
| Golem / super-heavy | 12 | 200 | ±2 px vertical | Fiftystone slam |
| Ultimate final hit / KO hit | 16, then **0.3× slow-mo for 400 ms** | 267 + slow-mo | ±3 px decaying | ultimates, the last KO of a match |

**Rules from the research:**
- **Freeze poses:** freeze the attacker on its contact pose and the victim on its first flinch pose
  (SmashWiki, Hitlag [S]).
- **Shake the struck one, not the striker.** Shake horizontally for ground hits and vertically for
  airborne hits. Decay the shake during the stop, and scale it with camera distance (Sakurai, via
  NintendoWire [S]).
- **Keep music, UI and crowd running.** Hitstop runs on the game's scaled clock, and the presentation
  layer runs on unscaled time (bugnet [S]).
- **Hitstop adds length.** It makes a combo longer, so balance combo timings *with* hitstop included
  (Monster Hunter discussion [S]).

### 0.3.3 Screen shake: the trauma model [S] Eiserloh (via Bevy)

- `trauma` runs from 0 to 1 and decays at about **1.6/s**.
- Visible shake = **trauma²** (the exponent is a tuning choice).
- Offsets come from **smooth noise** (Perlin), not random jitter.
- **Pixel-art adaptations** *(proposal)*:
  - Snap the offset to **whole game px**.
  - Max offset is **5 px**; ultimates may reach 7 px.
  - **No camera roll.** Rotation shimmers the pixel grid and the HD-2D diorama.
  - Bias the axis: horizontal for side impacts, vertical for slams and stomps.
- **Recoil kick:** the camera kicks **1–2 px opposite to a shot's direction** for one pose, then
  returns (Vlambeer's Nuclear Throne gun, via infovore [S]).
- **Trauma to add per event** *(proposal)*: water bullet 0.05 · riff slash 0.10 · ram charge 0.35 ·
  tsunami 0.4 (sustained) · steam explosion 0.5 · golem slam 0.6 · ultimate 0.8.
- **Accessibility:** a shake slider from 0 to 100% in Settings, and a "reduce flashes" toggle that turns
  impact frames into a 30% dim.

### 0.3.4 Master element colour ramps *(proposal; dark → light, hue-shifted)*

Shadows lean toward purple/blue and highlights toward yellow/white, which matches the bible's hue-shifted
cel shading. The **0** step is the outline step.

| Ramp | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| **Pyro fire** | `#2A0E1A` | `#6B1420` | `#B8261E` | `#E8501C` | `#FF8A1F` | `#FFC63A` | `#FFF1A8` | `#FFFFFF` |
| **Smoke** | `#2E2A36` | `#4B4553` | `#757080` | `#A9A4B3` | `#D2CED9` | | | |
| **Scary fire** (black/red) | `#07040A` | `#1A0A14` | `#3B0B1C` | `#7A0F24` | `#C8102E` | `#FF3347` | `#FFB0B8` | |
| **Echo** (sound) | `#1B1033` | `#3A1C71` | `#7B2FBF` | `#D23FD6` | `#FF7BE5` | `#7FF3FF` | `#FFFFFF` | |
| **Hydro** | `#0B1640` | `#13307A` | `#1C5FC2` | `#2F9BEA` | `#6FD3FF` | `#BDF1FF` | `#FFFFFF` | |
| **Foam / bubble rim** | `#EAFBFF` | `#E8FDFF` | | | | | | |
| **Bubble film** (cycle) | `#FF9DE2` | `#A8F0FF` | `#FFF29D` | `#B9A8FF` | | | | |
| **Purple Rain** | `#1A0A33` | `#3D1673` | `#6A2BC2` | `#9B4DFF` | `#C99BFF` | `#F0DDFF` | gold accent `#FFD86B` | |
| **Bio** | `#0E2A1E` | `#1C5233` | `#2F8A3E` | `#5FBF45` | `#A8E05F` | `#E6FFB0` | | |
| **Strawberry** | `#5C0A22` | `#A3123A` | `#E0284F` | `#FF6B7F` | seed `#FFE36E` | flower `#FFF8F0` | | |
| **Heal glow** | `#C8FFB8` | `#FFF6C2` | `#FFFFFF` | | | | | |
| **Poppy** | `#7A0D12` | `#C41E1E` | `#FF3B2F` | `#FF8A70` | centre `#1B1420` | | | |
| **Geo** | `#1E1418` | `#45302A` | `#6E4E3A` | `#9C7752` | `#C9A774` | `#EBD9A8` | `#FFF6DD` | |
| **Ecto** | `#10081F` | `#2B1450` | `#5328A0` | `#8F5BFF` | `#C7A2FF` | `#F2E6FF` | | |
| **Heart box** | `#4A0E1E` | `#9E1638` | `#E0305A` | `#FF7A9C` | | | | |
| **Angel gold** | `#7A4A12` | `#C98A2B` | `#FFD15C` | `#FFF3B8` | `#FFFFFF` | blade tint `#B9E9FF` | | |
| **Volto** | `#3A2A05` | `#8A6A00` | `#E0B400` | `#FFE53B` | `#FFF9A8` | `#FFFFFF` | arc contrast `#6A4BFF` | |
| **Steam** | `#55606E` | `#7D8D9C` | `#A9B9C6` | `#CFDAE3` | `#EEF3F7` | `#FFFFFF` | hot core `#FFE2A8` | |
| **Neutral hit spark** | `#3A1E00` | `#FFD24A` | `#FFF5C2` | `#FFFFFF` | | | | |
| **Guard / parry spark** | `#123A66` | `#4FC3FF` | `#BFF4FF` | `#FFFFFF` | | | | |

### 0.3.5 Impact frames & manga SFX lettering
- **Anime impact frames** [K Sakugabooru]: 1–3 frames of hard two-tone or inverted art (black/white, or
  black/element colour) at the instant of a huge hit.
  - **Tokonmon use:** crits, ultimate final hits, the steam-explosion core, the evolution flash and the
    Heartbox shatter.
  - **Length:** max **2 poses (167 ms)**.
  - **Flashes:** "reduce flashes" swaps them for a 30% dim.
  - **Recipe:** creature silhouettes go `#FFFFFF`, background goes the element's 0 step, and FX shapes
    invert. On the second frame, swap the two.
- **Katakana SFX stamps.** Drawn in-world lettering, which counts as art, not UI.
  - **ゴゴゴ** (*gogogo*) is JoJo's soundless "menacing" ideophone, shown on screen with no sound effect
    (Know Your Meme, japanesewithanime [S]).
  - **Where to use it:** ゴゴゴ for bond activation and ultimate charge-ups; ドドド for golem
    approaches; ドンッ / バキッ for heavy hits; ジュワッ for the steam explosion.
  - **Look:** a 2-px outline, tilted 8–15°, popped in with scale 1.4 → 1.0 over 2 poses, then held for
    4 poses and dithered out. Max one stamp on screen at a time.
  - **Lettering:** use original lettering. Never trace a manga's lettering.

---------------------------------------------------------------------------------------------------

## 1. Real-time creature combat feel: auto-control, order delay, Bonding, ultimates

### 1(a) References

**Pokémon real-time battles**
- [S] Bulbapedia, *Pokémon battle (Legends: Z-A)*: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_battle_(Legends:_Z-A)
- [S] Bulbapedia, *Cooldown*: https://bulbapedia.bulbagarden.net/wiki/Cooldown
- [S] RPG Site, *Z-A's shift to fully real-time battles with timed cooldowns*: https://www.rpgsite.net/preview/18322-pokemon-legends-z-as-shift-to-fully-real-time-battles-with-timed-cooldowns-allows-for-unconventional-tactics
- [S] SuperJump, *Z-A's real-time combat is a breath of fresh air*: https://www.superjumpmagazine.com/pokemon-legends-z-as-real-time-combat-is-a-breath-of-fresh-air/
- [S] TechRadar, *Z-A at Gamescom 2025 ("vintage Final Fantasy")*: https://www.techradar.com/gaming/pokemon-legends-za-preview-gamescom-2025
- [S] TheSixthAxis, *Hands on Z-A*: https://www.thesixthaxis.com/2025/08/24/hands-on-pokemon-legends-z-a-real-time-battles-are-mega/
- [S] finalboss.io, *Z-A: how one battle logic supports two paces*: https://finalboss.io/pokemon-legends-z-a-how-one-battle-logic-supports-two-paces
- [S] Inverse, *Pokémon Unite producer Masaaki Hoshino interview*: https://www.inverse.com/gaming/pokemon-unite-masaaki-hoshino-interview
- [K] Bulbapedia, *Unite Move* (cut-in banner on activation): https://bulbapedia.bulbagarden.net/wiki/Unite_Move

**Hitstop, shake and game feel**
- [S] SmashWiki, *Hitlag*: https://ssbwiki.com/Hitlag
- [S] SmashWiki, *Hitstun*: https://ssbwiki.com/Hitstun
- [S] Source Gaming, *Sakurai: "Thinking about hitstop"* (Famitsu 490–491, fan translation): https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/
- [S] NintendoWire, *Sakurai: fine-tuning hit stop*: https://nintendowire.com/news/2022/12/12/this-week-in-sakurai-12-5-12-11-fine-tuning-hit-stop-and-cheating-the-system/
- [S] IEICE, study of optimum hit-stop and slow-motion durations: https://ken.ieice.org/ken/paper/20230315OCSt/eng/
- [S] SciTePress, *Dynamic hit stop using eye gaze* (2024): https://scitepress.org/PublishedPapers/2024/124614
- [S] bugnet, *How to fix hitstop feeling off*: https://bugnet.io/blog/how-to-fix-hitstop-or-freeze-frame-feeling-off
- [S] uhiyama-lab, *Game feel primer: hit stop, flash, shake, sound*: https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/
- [S] MP1st, *Monster Hunter Wilds combat feeling off? It's hitstop*: https://mp1st.com/news/monster-hunter-wilds-combat-feeling-off-its-because-of-hitstops
- [S] Push Square, *Why the Wilds beta felt weightless*: https://www.pushsquare.com/news/2024/11/fans-work-out-why-monster-hunter-wilds-feels-so-weird-and-weightless-in-ps5-beta
- [S] infovore, *Making game "feel"* (Nijman on Nuclear Throne's pistol shot): https://infovore.org/?p=5275
- [S] Kenney, *Must-see videos for indie developers* (lists *The Art of Screenshake*): https://kenney.nl/learn/must-see-videos-for-indie-developers
- [K] Vlambeer, *The Art of Screenshake* (talk video): https://www.youtube.com/watch?v=AJdEqssNZ-U
- [K] Jonasson & Purho, *Juice it or lose it* (talk video): https://www.youtube.com/watch?v=Fy0aCDmgnxg
- [S] Bevy, *2D screen shake* (Eiserloh trauma model): https://bevy.org/examples/camera/2d-screen-shake/
- [S] npm *screen-shake* (Perlin noise plus exponential trauma): https://www.npmjs.com/package/screen-shake
- [K] GDC Vault, Squirrel Eiserloh, *Math for Game Programmers: Juicing Your Cameras With Math* (GDC 2016). Search the title on https://www.gdcvault.com/

**AI partners and command barks**
- [S] KH wiki, *Abilities (KH)* (party AI frequency set in Customize): https://www.khwiki.com/Abilities_(KH)
- [S] StrategyWiki, *Kingdom Hearts gameplay*: https://strategywiki.org/wiki/Kingdom_Hearts/Gameplay
- [K] KH wiki, *Limit* (KH2 two-character team attacks): https://www.khwiki.com/Limit
- [K] Final Fantasy wiki, *Gambit* (FFXII programmable ally AI): https://finalfantasy.fandom.com/wiki/Gambit
- [S] Giant Bomb, *Digimon World* (yelled commands, partner may not listen): https://www.giantbomb.com/games/3030-3899/
- [S] Siliconera, *Re:Digitize: an icon shows if your Digimon follows or ignores an order*: https://siliconera.com/?p=205676
- [S] Siliconera, *Next Order two-Digimon battle system (cheering buffs)*: https://www.siliconera.com/digimon-world-next-order-details-its-two-digimon-party-battle-system/
- [S] PC Gamer, *Homeworld 3 chatter design: informational vs flavour barks*: https://pcgamer.com/homeworld-3-chatter-design-barks
- [S] Giant Bomb, *"Piss lines"* (funny lines on repeated clicks): https://giantbomb.com/wiki/Concepts/Piss_Lines
- [S] SpringRTS forum, *unit reply sounds stacking*: https://springrts.com/phpbb/viewtopic.php?p=478045

**Bond links and transformations**
- [S] Bulbapedia, *Bond Phenomenon*: https://bulbapedia.bulbagarden.net/wiki/Bond_Phenomenon
- [S] Bulbapedia, *Battle Bond*: https://bulbapedia.bulbagarden.net/wiki/Battle_Bond
- [S] MyAnimeList, *Greninja (anime)*: https://myanimelist.net/character/209632
- [K] Bulbapedia, *Mega Evolution* (Key Stone ↔ Mega Stone light strands): https://bulbapedia.bulbagarden.net/wiki/Mega_Evolution
- [S] Know Your Meme, *Menacing / ゴゴゴゴ*: https://knowyourmeme.com/memes/menacing-%E3%82%B4%E3%82%B4%E3%82%B4%E3%82%B4
- [S] japanesewithanime, *gogogogo*: https://www.japanesewithanime.com/2018/10/gogogogo.html
- [S] JoJo wiki, *List of JoJo sound effects*: https://jojowiki.com/List_of_JoJo_Sound_Effects
- [S] Wikipedia, *Medabots*: https://en.wikipedia.org/wiki/Medabots
- [S] Medabots wiki, *Medawatch*: https://medabots.fandom.com/wiki/Medawatch
- [S] Beyblade wiki, *Holy Beasts (bit-beasts)*: https://beyblade.fandom.com/wiki/Holy_Beasts
- [K] TV Tropes, *Battle Aura*: https://tvtropes.org/pmwiki/pmwiki.php/Main/BattleAura
- [K] TV Tropes, *Super Mode*: https://tvtropes.org/pmwiki/pmwiki.php/Main/SuperMode

**Ultimates and super freezes**
- [S] SmashWiki, *All-Out Attack* (Persona 5 finisher as adapted in Smash): https://www.ssbwiki.com/All-Out_Attack
- [S] New Frame Plus, *The Overwhelming Style of Persona 5's All-Out Attacks* (transcript): https://amara.org/videos/wIZbgZ3Jyy5D/en/3103539
- [S] TCRF, *Persona Q2 unused graphics* (early All-Out finisher pose): https://tcrf.net/Persona_Q2:_New_Cinema_Labyrinth/Unused_Graphics
- [S] MUGEN Guild, *SuperPause controller doc* (darken, 30-tick default): https://mugenguild.com/forum/msg.2327314/PHPSESSID.0et9t5cv5iggov4hovld72gpe2
- [S] Chronocrash, *Reproducing the super-flash stop effect*: https://mail.chronocrash.com/forum/threads/to-reproduce-shinku-hadoken-stop-effect.883/post-19637
- [S] SuperCombo, *KOF XIII super freeze*: https://srk.shib.live/w/The_King_of_Fighters_XIII/Game_Elements/Super_Freeze
- [S] EventHubs, *SF6 screen freeze and Drive Rush*: https://www.eventhubs.com/news/2023/oct/27/sf6-screen-freeze-drive-rush
- [S] Bulbapedia, *Z-Move*: https://bulbapedia.bulbagarden.net/wiki/Z-Move
- [S] Bulbapedia, *Bloom Doom*: https://m.bulbapedia.bulbagarden.net/wiki/Bloom_Doom_(move)
- [S] Bulbapedia, *Catastropika*: https://bulbapedia.bulbagarden.net/wiki/Catastropika_(move)
- [K] Bulbapedia, *Dynamax*: https://bulbapedia.bulbagarden.net/wiki/Dynamax
- [K] Megami Tensei wiki, *Baton Pass* (Persona 5 high-five turn hand-off): https://megamitensei.fandom.com/wiki/Baton_Pass

### 1(b) Study notes

**Pokémon Legends: Z-A (the closest real-time cousin) [S]**
- **Controls:** hold the lock-on button (ZL) on a target in line of sight, then a face button fires the
  move mapped to it.
- **Cooldowns replace PP:**
  - The countdown **starts after the move finishes executing**.
  - Final cooldowns range from about **3 to 60 s**, and the Speed stat shortens them.
  - The *drowsy* status makes timers tick at **half speed**.
- **What reviewers stress:**
  - A move off cooldown is not automatically a safe move, because the enemy acts in between.
  - The pacing reminded one reviewer of "vintage Final Fantasy", meaning ATB-like timing.
- **The trainer is in the fight.** Opposing moves can hit the trainer, so the trainer's positioning
  matters. A dodge roll exists, and sneaking up on a trainer gives a surprise first attack.
- **One creature out at a time.**
- **Tokonmon takeaway:**
  - Show each skill's cooldown **on its phone button** as a ring.
  - Keep the trainer as a visible actor in the arena, because the trainer is the source of every order.

**Pokémon Unite [S]/[K]**
- No hitstop data was found.
- **[S]** Previews praise "fluid animation, no wasted frames or unwanted delay" and colourful, flashy
  effects. The producer comes from fighting games (SoulCalibur).
- **[K]** A Unite Move flashes a **horizontal cut-in banner with the Pokémon's art** across the screen.
  This is a lightweight "ultimate" announcement that does **not** pause a 5v5 match.
- **Tokonmon takeaway:** a short banner works in real time; a full freeze must be brief.

**Hitstop numbers [S]**
- **How it works:**
  - Hitlag freezes **both** fighters.
  - It **scales with damage**: Ultimate gives about 15 frames for a 15% hit, Melee about 8.
  - Per-move multipliers exist; Marth's sweet-spot tipper uses 1.25×.
- **The study's optimum** for a blow-away hit: hitstop **0.1–0.2 s**, slow-motion **0.2–0.4 s** (IEICE).
- **The practitioner range:** 50–200 ms (3–12 frames @ 60).
- **Sakurai's tips:**
  - Shake the struck character more than the striker.
  - Shake horizontally on the ground and vertically in the air.
  - Reduce the shake gradually, and scale it to camera distance.
  - 2D fighters use heavy hitstop; 3D and musou games use it lightly.
- **Monster Hunter:**
  - Hitstop is "most noticeable on weapons that deal a ton of damage in a single hit (Great Sword,
    Hammer)".
  - When Wilds' beta reduced it, players called the combat weightless, and Capcom restored it.
  - Hitstop lengthens combos, so fights are designed around it.
- **Tokonmon takeaway:** use the §0.3.2 table, with Pyro/Geo heavies at the top and Hydro precision hits
  light.

**AI partners and delayed commands [S]/[K]**
- **Kingdom Hearts:**
  - You drive Sora; partners run on AI, and their *frequency* of abilities is tuned in Customize [S].
  - **[K]** KH2's *Limits* are two-character team attacks with a shared prompt, a good reference for
    the kept team combos.
- **FFXII Gambits [K]:** programmable if/then ally AI. Useful only as a reminder that auto-control must
  be *legible*.
- **Digimon World (1999) [S]:**
  - Battles are not direct control. You *yell* commands (attack, back off, switch target, run), and how
    many commands you have depends on the partner's Brain stat.
  - The partner **didn't always listen**, and the original gave little feedback about that.
  - **Re:Digitize** added **an icon over the Digimon's head showing whether it follows or ignores** the
    order.
  - **Next Order** lets you **cheer** to buff a partner after good plays.
  - **Lesson:** a delayed or indirect command needs an **on-creature acknowledgement icon**.
- **RTS acknowledgement barks [S]:**
  - Homeworld 3 splits voice into an **informational layer** (move confirmations heard anywhere) and a
    **flavour layer** (fuller chatter, only when relevant). It also uses a **sports-style announcer and
    colour commentator**.
  - Warcraft's "piss lines" reward repeated clicking with joke lines.
  - Rapid orders make samples **stack and distort**, so a new bark must cut or skip the old one.
  - Repetition fatigue means you need several variants per bark.

**Bond transformations [S]**
- **Ash-Greninja (Bond Phenomenon):**
  - A **turbulent veil of water** wraps Greninja before the form settles.
  - The completed form carries a **giant water shuriken on its back** and **takes on its trainer's
    features**.
  - Its speed becomes "nearly impossible to perceive".
  - In the games, the form triggers when Greninja **knocks out an opponent** (Battle Bond).
- **Tokonmon parallels:**
  - Bonded Tokonmon **wear the trainer's accessories** (bible §5), the same "creature takes on the
    trainer" idea.
  - Heartbox's **kills while bonded** trigger mirrors Battle Bond.
- **JoJo ゴゴゴ:** a silent visual ideophone for menace (see §0.3.5).
- **Medabots:** the Medawatch summons and talks to the Medal, and the **Medaforce** turns a special skill
  into a focused beam.
- **Beyblade:** a bit-beast spirit lives in the bit chip and is *called out* to empower the top.
- **Lesson for all three:** the **wrist device is the conduit** (the bible's bracelet and soul stone).
- **[K] Mega Evolution:** light strands link the trainer's Key Stone and the Pokémon's Mega Stone, then
  the Pokémon is wrapped in a light shell that breaks open. This is the closest visual for "soul-stone
  beam".

**Ultimates and super freezes [S]**
- **KOF XIII:** the game **pauses during the startup flash** of a super. Only the triggering player can
  input during the freeze, and the defender's inputs are consumed.
- **MUGEN's SuperPause:**
  - It **freezes gameplay and darkens the screen**.
  - The default is **30 ticks (0.5 s)**, and it plays a "charge" flash anim plus a sound.
  - It can temporarily scale the target's defence.
- **Chronocrash pattern:** pause everything except the super's own banner or effect.
- **Persona 5 All-Out Attack:**
  - The sequence ends on a **splash screen of the party**, with a final posed splash ("THE SHOW'S OVER"
    in Smash's version).
  - The finish splash appears **only if all enemies are KO'd**.
  - *Strikers* (real-time) dropped the single hero pose and showed the participants instead.
- **Z-Moves:**
  - The **trainer poses first**, then the Pokémon **mirrors the poses** and is wrapped in a **type-coloured
    aura**: green with flowers for Bloom Doom, yellow electricity for Catastropika.
  - Then the move plays. The cutscene can't be turned off.
- **[K] Dynamax:**
  - The Pokémon is recalled, and the ball **grows huge** and is thrown over the shoulder.
  - The Pokémon returns giant, under **red cloud crowns**.
- **Tokonmon takeaway:**
  - **Freeze everyone**, darken, and show the trainer-plus-creature pose and a slanted cut-in.
  - Then release on the beat, and show a **finish splash only on a KO**.

### 1(c) Design direction for Tokonmon

#### 1.1 Order → delay → execution: "the delay *is* the anticipation" *(proposal)*

The bible says auto-control plus "a little delay" before orders execute.
- **The feel goal:** the delay must read as **"my Tokonmon heard me and is reacting"**, never as input
  lag.
- **The rule:** feedback happens **every 100 ms or less** from the tap until execution.

| t (ms) | What happens | Channel |
|---|---|---|
| 0 | Phone button sinks 1 px, the inner glyph flashes the element's light step, and a haptic tick plays. | phone |
| 0–83 | The trainer sprite snaps into a 1-pose **"point/command"** pose. A tiny speech bubble (9×9 px) shows the order glyph. | world |
| ~80 | **Trainer bark** (informational layer; always plays; 0.3–0.6 s): "Dodge!", "Now!", "Charge it!". There are 3–5 variants per order, and a new bark **cuts** an older one. | audio |
| 150–250 | The **Tokonmon acknowledges**: ear, crest or head flicks toward the trainer for 2 poses. An **ack icon** pops above its head, scaling 1 → 1.25 → 1 over 2 poses. | world |
| 150 → execute | The icon's 1-px outline **fills clockwise like a fuse**, showing the remaining delay. Meanwhile the creature plays the **first anticipation poses of the ordered action** (crouch, inhale, paw-scrape). | world |
| execute | The icon bursts into 4 px sparks (2 poses) and the action fires. | world |

**Delay per order type** *(proposal; tune in playtests and scale by Speed and bond rank)*:

| Order | Delay |
|---|---|
| dodge | ≈ 250 ms |
| parry | ≈ 300 ms |
| basic attack | ≈ 400 ms |
| skill | ≈ 450 ms |
| charge | ≈ 500 ms |

The heavier the action, the longer its natural anticipation, so the delay hides inside it.

**Ack icons** are 9×9 px, with a white glyph, a 1-px outline in the creature's element 0-step and a 1-px
drop shadow:

| Order | Glyph |
|---|---|
| move | arrow |
| attack | fist |
| aimed skill | crosshair |
| charge | spiral |
| parry | shield |
| dodge | wind swoosh |
| switch | two arrows |

**Queue rules:**
- The queue holds one order. A newer order **replaces** the queued one: the icon flips in 1 pose to the
  new glyph, and the fuse restarts from the elapsed time.
- **Autonomous AI actions show no icon.** Icons mean "you ordered this", so the player can always tell
  their orders from the creature's own play.

**Barks:**
- **Voice layers:** the trainer's informational barks always play. The Tokonmon cry is flavour, for
  attacks and skills only, at most 1 per 1.5 s per creature. The commentator is flavour too (§2).
- **Spam:** after 5 rapid identical orders, one funny flavour line ("I heard you!"), at most once per
  match (the "piss lines" reference).

#### 1.2 Bonding: direct control *(proposal for presentation; the rules are the bible's)*

**Activation (≈ 1.3 s; the game keeps running at 0.6× for 400 ms of it, fair because both sides slow):**

| Poses | What happens |
|---|---|
| 1–3 | The trainer raises the wrist. The **soul stone flares**: 3-frame star, then its colour floods the bracelet. A **ゴゴゴ** stamp appears. |
| 4–7 | A **beam** fires from the stone to the Tokonmon in 4 poses: a 1-px white core, a 1-px element-colour side band and a soul-stone-colour outer glow. |
| 8–13 | An **element veil** wraps the creature (the Ash-Greninja water veil, adapted per element): **Pyro** a flame tornado; **Hydro** a water sphere; **Bio** a petal and vine whirl; **Geo** orbiting rock rings; **Ecto** a purple wisp swirl. |
| 14–16 | The veil bursts and reveals the **bonded look**: the per-creature gimmick (expanding horns for Strawbaa/Ramberry, bubbles for the Bubblion line, blazing crest for the Chilichick line, fur…). The **trainer's accessory pops onto the creature** with a 3-frame "poof" (white smoke puff) and lands with a 1-px bounce. |

**While bonded (a persistent, quiet presence that never covers the action):**
- **Link thread** between the trainer's wrist and the creature:
  - Structure: a 1-px white core, with 1-px element-colour lines either side.
  - Motion: it bows like a sine wave (amplitude 2 px, wavelength 24 px) and scrolls toward the creature.
  - **One bead per beat:** a 3×3 diamond in the soul-stone colour travels along it, synced to the music.
- **Aura outline:** a 1-px outer outline on the creature *and* the trainer alternates element step 4 / 5
  **on every beat**, so the two read as one unit.
- **Screen edges:** an 8-px Bayer-dithered vignette in the element colour at 25%.
- **Pain link (Ash-Greninja reference):** when the bonded creature takes a heavy hit, the trainer flinches
  for 1 pose and the thread jitters ±1 px.
- **Phone:** it swaps to the **Direct** layout (§6.3.2).
- **Bond time** (passives depend on how long you've been bonded, bible §5): the soul stone on the phone
  fills ring segments, one per 10 s *(proposal)*. When a bond-time passive comes online, its icon lights
  on the phone and the thread flashes once.

**Bond end** (after an ultimate, or any other end):
1. The thread **snaps at its midpoint**, and the halves whip back over 3 poses.
2. The halves dissolve into soul-stone motes over 6 poses.
3. The accessory poofs back to the trainer.
4. The aura outline turns off on the next beat.

#### 1.3 Ultimates: bonded only, and they end the bond (bible §5) *(proposal)*

The goal is maximum hype at minimum real-time cost: **freeze ≤ 1.2 s**, total ≈ 2.5–3.5 s.

| t (ms) | Beat | What happens |
|---|---|---|
| 0 | input | **Global freeze**: every creature, projectile and timer stops, including switch and cooldown timers. Music, crowd and the jumbotron keep running. The arena **darkens by palette shift to 40%** (not an alpha overlay), except the user, its trainer and their link thread. The crowd gasps. |
| 0–250 | | **Super flash**: a 4-frame starburst at the creature's chest (white → element step 6 → step 4 → gone) with a lens "ting". ゴゴゴ letters fade in around it. |
| 250–1050 | | **Cut-in band.** A band tilted 12° slides in from the right in 2 poses, holds, then exits left in 2 poses. **Contents:** (1) the creature's **2D sprite in its biggest dynamic pose**; (2) a top-left **eye-strip** inset of the trainer (a Persona-style horizontal crop of the eyes, 64×14 px); (3) the **ultimate's name, as renamed by the player** (bible §7), in a 12-px pixel font with a 2-px outline; (4) the band background: element ramp stripes scrolling 2 px per pose plus a halftone dot pattern. **During the hold:** the trainer strikes a pose, and the creature **mirrors it** (the Z-Move reference), wrapped in an element-colour aura. |
| 1050 → next downbeat | music sync | The freeze ends and the attack plays. Its **final impact is quantised to the next bar downbeat** if it is within one bar; otherwise to the next beat (§5.6). |
| impact | | **2 impact frames** (§0.3.5), hitstop 16 ticks, then **0.3× slow-mo for 400 ms**, and trauma +0.8. A katakana stamp. The commentator's top-priority line. |
| after | | The **bond-end** animation (§1.2). |
| KO only | | A **finish splash** (the Persona 5 reference: only when it ends the fight): a 1.0 s still of the creature's victory pose on the element background, with the renamed ultimate name stamped diagonally. Tap to skip. |

**Rules:**
- **Freeze fairness:** during the freeze nobody can input, and the opponent's buffered orders are
  cleared (KOF XIII's rule).
- **First use vs. repeats:** the first use of each ultimate may play a longer 1.6 s cut-in. Repeats use
  the 0.8 s version.

#### 1.4 Team combos (kept from v1) *(proposal)*
- **Two-panel split cut-in:** two 12° bands, one per partner, slide in from opposite sides for 600 ms.
  The partners' element ramps meet in the middle with a white seam.
- **A "hand-off" pose:** a 2-pose high-five or tap between the two creatures (Persona 5's Baton Pass,
  KH2's Limits).
- **Team-combo counter:** combos are also tracked for Starrab (25 team combos, bible §3). The jumbotron
  can show a running "COMBO" count in the score bug.

### 1(d) Do / Don't

**Do**
- Give feedback for every order on the phone, the trainer and the creature within **100 ms**.
- Make the delay play as the move's own anticipation.
- Use ack icons for player orders only.
- Scale hitstop by weight, using the §0.3.2 table.
- Freeze everyone during the super flash.
- Land ultimate impacts on the downbeat.
- Keep the bond thread thin and beat-synced.

**Don't**
- Don't let a tap produce nothing visible.
- Don't freeze real-time play for more than ~1.2 s per ultimate.
- Don't stack voice lines.
- Don't rotate or roll the camera in shakes.
- Don't run full-screen white flashes longer than 2 poses.
- Don't put HP bars over every creature's head (see §2.4 for the diegetic HP ring).
- Don't copy Greninja's shuriken, JoJo Stand designs or Persona's exact layouts. Take the *grammar*
  (veil → reveal, eye-strip, slanted band), not the look.

---------------------------------------------------------------------------------------------------

## 2. Switching (7 s / 15 s), halftime, arena choice: sports-broadcast presentation

### 2(a) References

**Commentary and stadiums**
- [S] Wikipedia, *Pokémon Stadium*: https://en.wikipedia.org/wiki/Pok%C3%A9mon_Stadium
- [S] Bulbapedia, *Voice acting in the Pokémon games* (Stadium announcer clips): https://bulbapedia.bulbagarden.net/wiki/Voice_acting_in_the_Pok%C3%A9mon_games
- [S] Bulbapedia, *Stadium Announcer quotes* (user page): https://bulbapedia.bulbagarden.net/wiki/User:Daniel_Carrero/Stadium_Announcer
- [S] GitHub, *StadiumBattleFX* (fan recreation; 823-clip announcer structure): https://github.com/anxiousintrovert/StadiumBattleFX
- [S] Nintendo Life, *Sword/Shield hands-on: Dynamax*: https://www.nintendolife.com/news/2019/06/hands_on_pokemon_sword_and_shieldrs_dynamax_mode_has_us_shook
- [S] Pokémon.com, *Battling Nessa at E3*: https://www.pokemon.com/uk/pokemon-news/we-battle-nessa-and-her-dynamax-pokemon-in-the-pokemon-sword-and-pokemon-shield-demo-at-e3
- [S] Tom's Guide, *Sword and Shield E3*: https://www.tomsguide.com/us/pokemon-sword-shield-e3,news-30341.html
- [S] iMore, *Gyms in Sword and Shield*: https://www.imore.com/everything-you-need-know-about-gyms-pokemon-sword-and-shield
- [K] Bulbapedia, *Pokémon Battle Revolution* (themed colosseums: Waterfall, Magma, Sunny Park, Crystal, Neon…): https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Battle_Revolution
- [K] SmashWiki, *Pokémon Stadium (stage)* (the big screen previews the next transformation; Fire/Water/Grass/Rock forms): https://www.ssbwiki.com/Pok%C3%A9mon_Stadium_(stage)

**Sports games and broadcasts**
- [S] Wikipedia, *Inside the NBA* (the studio show NBA 2K recreated): https://en.wikipedia.org/wiki/Inside_the_NBA
- [S] NBA2KW, *Ernie Johnson & Shaq in NBA 2K15*: https://nba2kw.com/tnts-ernie-johnson-and-shaq-will-be-in-nba-2k15
- [S] HNGN, *NBA 2K14 needs better presentation* (critique of disconnected highlights): https://www.hngn.com/articles/9324/20130803/nba-2k14-expansion-need-better-presentation.htm
- [S] Rocket League, *Stats API* (`CountdownBegin`, replay state): https://www.rocketleague.com/developer/stats-api
- [S] MarioWiki, *Mario Strikers: Battle League*: https://www.mariowiki.com/Mario_Strikers:_Battle_League
- [S] MarioWiki, *Hyper Strike* (example page): https://www.mariowiki.com/Flame_Cannon
- [S] School of Motion, *Sports lower thirds*: https://students.schoolofmotion.com/blog/sports-lower-thirds
- [S] SVG, *Designing the modern scorebug* (2026): https://www.sportsvideo.org/2026/06/09/designing-the-modern-scorebug-how-broadcast-graphics-teams-are-rethinking-the-most-important-element-on-screen/
- [S] NewscastStudio, *Fox enlarges its scorebug*: https://www.newscaststudio.com/2021/11/09/fox-sports-redesigns-college-basketball-look-enlarges-scorebug/
- [S] keepthescore, *What are lower thirds*: https://keepthescore.com/blog/posts/lower-thirds/
- [S] scoreleader, *What is a score bug*: https://scoreleader.com/what-is-score-bug/
- [S] Inkipedia, *Inkopolis News* (in-world TV hosts announce stage rotations): https://splatoonwiki.org/wiki/Inkopolis_News
- [S] PC Gamer, *Homeworld 3 sports-style announcer and colour commentator*: https://pcgamer.com/homeworld-3-chatter-design-barks
- [K] Wikipedia, *NBA Jam* ("He's on fire!" streak call): https://en.wikipedia.org/wiki/NBA_Jam
- [K] Bulbapedia, *Pokémon UNITE* (the "Final Stretch" last-2-minute call and music change): https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_UNITE
- [K] Wikipedia, *Tag team* (wrestling tag-in by hand contact): https://en.wikipedia.org/wiki/Tag_team

### 2(b) Study notes
- **Pokémon Stadium commentary is a clip-assembly system [S].**
  - The announcer **combines voice-clip segments** to describe moves and conditions, in every language.
  - **Line families:** move called ("Fire Blast!"), hit/miss ("It's a hit!" / "That's a miss!"), weak
    spot, status ("It's still snoozing!"), KO ("Down it goes!").
  - A fan rebuild counts **823 clips**: gym-leader intros, a send-out call for each species, move names,
    and effectiveness, crit and faint lines.
  - Calls **follow the action they describe** rather than an earlier queue.
- **Sword/Shield stadiums [S]:**
  - Gyms are huge stadiums, where "the fans in the stands react to your tactics".
  - The crowds belt out chants like at a real sporting event, and entrances are met with a roar.
  - The giant format (Dynamax) is reserved for the stadium.
  - **Lesson:** the crowd is a *feedback instrument* for the player's play.
- **NBA 2K [S]:**
  - It has pre-game, halftime and post-game studio shows with mo-capped hosts.
  - **Critique:** the highlights shown were insignificant and the talk wasn't tied to the game's real
    moments.
  - **Lesson:** halftime recaps must use **this match's real moments**.
- **Broadcast graphics [S]:**
  - **Score bugs:** compact and high-contrast, in a corner, top-centre in soccer at key moments.
    Oversizing them draws complaints.
  - **Lower thirds:** one message each, strong contrast, and on screen **5–7 s**. That is nearly the
    length of a Tokonmon switch.
- **Rocket League [S]:**
  - Each round starts with an explicit **countdown event**.
  - Goals trigger an explosion, then a **replay state**, and the replay camera used to push in on the
    scorer.
- **Mario Strikers: Battle League [S]:**
  - The opening merges two stages into one field and opens **a portal per team**. Characters flash
    cel-shaded.
  - The Hyper Strike shows **flames in the eyes** before the kick.
  - A Hyper Strike is unlocked by grabbing an orb on the field.
- **Inkopolis News [S]:** an in-world **TV studio with two hosts** announces the current stages. This is
  the model for the **reporter announcing the arena change**.
- **Homeworld 3 [S]:** a **sports-style announcer plus a colour commentator** for battle barks.
- **[K] Smash's *Pokémon Stadium* stage:**
  - The stadium's **big screen previews the next form**, then the floor transforms into Fire, Water,
    Grass or Rock layouts.
  - Rock pillars rise, a windmill or water appears, trees grow.
  - This is the direct model for the **rocky / grassy / water** arena change.
- **[K] Pokémon Battle Revolution:** each colosseum is a distinct themed set (waterfall, magma, sunny
  park…).
- **[K] NBA Jam:** after a hot streak, the announcer calls "He's on fire!" and the ball burns. A streak
  bark is a cheap, huge hype tool.
- **[K] Pokémon Unite:** the final 2 minutes are called out ("Final Stretch") and the music changes.
- **[K] Tag-team wrestling:** the partner waits outside, and a **hand tag** completes the switch. Every
  viewer understands it instantly.

### 2(c) Design direction for Tokonmon

#### 2.1 The 7-second switch (bible: 7 s, the other team can act; 15 s cooldown) *(proposal)*

**Arena prop: the Entry Gate.** Each trainer's side of the arena has a **gate pad** in the floor: a
high-tech ring, 1.4 m wide, with **7 LED pips**. This makes the timer diegetic, with no HUD.

| t | World | Phone | Jumbotron / audio |
|---|---|---|---|
| 0.0 | The trainer raises the keychain. The outgoing Tokonmon **breaks off** and runs toward the gate (it can still be hit). Gate pip 1 lights. | The bench portrait is pressed, and a 7-segment ring starts around it. | A lower-third slides in over 3 poses: **"SWITCH — [out] ⇄ [in]"** with both 2D sprite icons. Commentator: "[Trainer] is making a change!" |
| 0.0–1.0 | Recall: the outgoing creature becomes **light ribbons in the gem colour** that zip into the keychain (6 poses). If it reaches the gate first, it does a **tag high-five** with the arriving silhouette (2 poses) *(proposal)*. | | The crowd goes "ooh". |
| 1.0–6.0 | The **incoming creature's silhouette** rises inside the gate as a hologram scan: cyan scanlines move up 2 px per pose. **One pip lights per second**, the crowd chant builds per pip, and the camera crew turns to the gate. **The opponent acts freely.** | Countdown digits. | Jumbotron: incoming portrait plus "7…6…5…", readable by the **opponent** so they can plan a charge. |
| 6.0–7.0 | **Entrance:** the gate flashes white (1 tick), then a 12-pose **signature entrance pose** with an element burst (§3) and a ground ring. | The ring completes and goes **dim**. The cooldown begins. | "Here comes [name]!" A crowd cheer. |

**Cooldown (15 s):**
- **Phone:** the dimmed bench portraits fill clockwise in the element colour, with seconds in 5-px digits.
  When ready, a "ding" plays and the portrait flashes for 2 poses.
- **World:** the gate ring glows **red during cooldown and green when ready**.

**"Extra punch" passive** (switch out and come back, bible §6):
- **Ready state:** the returning creature's striking part (fist, beak, horns, tail…) wears a 1-px glow
  outline that **pulses on beats** until it is used.
- **The punch itself:** the hit uses **heavy** hitstop (+3 ticks), a special 5-pose star spark and a
  stamp.

#### 2.2 Arena choice: at start and at halftime (rocky / grassy / water) *(proposal)*
- **Pick UI (no menus):**
  - The **phone** shows three tall cards (Rocky, Grassy, Water), each with a 40×56 px pixel thumbnail
    and element-affinity icons. The kept v1 rule says arenas can have element and environment
    requirements.
  - The **jumbotron** mirrors the choice live.
  - A **10 s** decision timer.
  - *Who picks, if both trainers want different arenas, is an* **(open question for owner)**.
- **Transformation** (≈ 3 s, Smash Pokémon-Stadium style):
  1. The **jumbotron previews the result first**: "NEXT: WATER", 1 s.
  2. The floor is made of **hex panels, 16 px across**. Panels **flip in a ring wave from the centre
     outward** (4-pose flip, each ring starts 1 tick after the previous) and reveal the new surface.
- **Per-arena reveal:**

| Arena | Reveal |
|---|---|
| **Rocky** | Pillars **rise** over 6 poses with dust rings (Geo ramp) and pebbles bounce. |
| **Grassy** | Tufts **pop** and 2 trees grow in 8 poses. Leaves drift. |
| **Water** | Panels **sink**, water floods in with spray (Hydro ramp), and shallow pools stay walkable. |

- Stadium lights re-tint to the arena's colour. The crowd goes "whoa", and the commentator names the
  arena.
- **Arena palettes:** Rocky uses Geo plus slate `#8C8F99`; Grassy uses Bio; Water uses Hydro plus foam.
  These match the reactions, because the arena *colour language* equals the element colour language.

#### 2.3 Halftime *(proposal; the bible fixes only "at halftime, choose again")*
Total ≈ 15–25 s, with every beat skippable.
1. **Stinger (1.5 s):** a diagonal-stripe wipe in both team colours across the jumbotron. The stadium
   lights dim, a spotlight sweeps, and a horn sounds.
2. **Reporter flash (3 s):**
   - The **sideline reporter and camera crew** jog to the player.
   - Camera **flash pops** go off around them and in the crowd: 1-tick white 3×3 px stars, 2–6 per
     second.
   - The reporter asks a question in a speech bubble. The player may answer with **2–3 choice bubbles**
     (§7). That reuses the existing choice system and adds no new feature.
3. **Highlight replay (≤ 6 s):**
   - The jumbotron plays **this half's real top moments**: biggest hit, KOs, reactions, team combos.
   - Shown with a "REPLAY" tag, scanlines and 0.5× slow-mo.
4. **Stats lower-third (3 s):** KOs, reactions triggered and combos per team.
5. **Arena pick** (§2.2).
6. **Re-entry:** the crowd does a **wave** (each crowd column offset by 2 ticks), then the countdown
   "3-2-1-BATTLE", using the Rocket League countdown pattern.

#### 2.4 Always-on broadcast layer (replaces HUD) *(proposal)*

**Jumbotron** (in-world LED board above the arena):
- **LED look:** each display "pixel" is drawn as a 2×2 px cell with a 1-px darker gap. Every other row is
  dimmed 10% (scanline).
- **Layout:**
```
┌───────────────────────────── JUMBOTRON ─────────────────────────────┐
│ [TEAM A icon] ●●○  2  ─  1  ○●● [TEAM B icon]   1st HALF  03:12     │ ← score bug (KOs left as pips)
│                                                                     │
│          LIVE CAM / REPLAY / SWITCH COUNTDOWN / ARENA PREVIEW       │
│                                                                     │
│ ▸ ticker: "STEAM EXPLOSION! ✦ Riffrooster ★ 3-hit riff ✦ …"         │
└─────────────────────────────────────────────────────────────────────┘
```
- **Colours:** background `#050608`; Team A `#FF4A3D`; Team B `#3DA8FF`; gold `#FFD23F`; text
  `#F2F4FF`.

**Diegetic HP:**
- The stadium **projects a thin floor ring** under each creature: a 2-px ellipse arc that drains
  clockwise, in green `#6BFF8A` → amber `#FFC63A` → red `#FF4A5A`.
- The same values show on the jumbotron and on the phone's team tab.
- This is the "Dead Space spine" idea (§6): the info lives in the world.
- Below 25% HP, the creature also plays a **panting idle** and flashes 1 tick every 2 s.
- Outside the stadium (safari, street battles), the same ring is projected **by the phone** as an AR
  overlay.

**Commentary:**
- Two voices: a **PA announcer** (reverb, short calls) and a **colour commentator** (flavour, dry).
- **Built Stadium-style from segments:** `[name]` + `[verb/move]` + `[result]`, e.g. "Bubblion — water
  bullet — right on target!".
- **Triggers by priority:**
  1. ultimate
  2. KO
  3. bond start
  4. reaction (steam explosion)
  5. crit
  6. switch start/end
  7. team combo
  8. comeback (KO while under 20% HP)
  9. emote
  10. big miss
  11. idle colour talk
- **Throttle:** max 1 line per 2.5 s; a higher priority interrupts a lower one, and low priorities are
  dropped, not queued.
- **Calls fire on the event**, never ahead of it (the Stadium lesson).

**Crowd** (feedback instrument):
- **Tiers:** idle murmur → "ooh" (heavy hit) → cheer (KO, combo, reaction) → roar (bond, ultimate) → gasp
  (ultimate freeze) → chant (switch countdown, halftime).
- **Sprites:**
  - Sitting: a 2-pose breathing loop at 1 Hz.
  - Standing cheer: a 4-pose jump loop.
  - Arms up: the wave.
  - Each sprite starts at a random offset, and every 8th spectator holds a **sign with in-world text**
    (team names, puns).
- **On beats:** in League matches, crowd bobs, LED pulses and claps land **on beats 2 and 4**, using an
  original chant pattern (§5.6).

**Reporters and camera crew:**
- Sprites at the arena edge **turn to face the action**.
- They fire a **flash** on KOs, ultimates and reactions.

**Streak call** (an NBA Jam-style bark): "[Name] is on fire!" plays when a creature lands several hits
without being hit. This is **commentary only**, with no gameplay effect.

### 2(d) Do / Don't

**Do**
- Put every timer in the world: gate pips, the jumbotron, the gate ring colour.
- Let the opponent *see* your switch countdown.
- Use real match highlights at halftime.
- Make the arena change a spectacle, previewed on the jumbotron first.
- Throttle commentary by priority.

**Don't**
- Don't use generic canned highlights.
- Don't let the commentator talk over every hit, or bark before the event happens.
- Don't show oversized score bugs.
- Don't freeze the match during a switch. The bible says the other team keeps acting.
- Don't reproduce real chants or melodies (bible §10).

---------------------------------------------------------------------------------------------------

## 3. Attacks & VFX in pixel art: every starter and signature kit

### 3(a) References (all [K]; verify with Appendix A queries 3.x)

**Pixel-art VFX craft**
- Pedro Medeiros (Saint11; Celeste/TowerFall artist), pixel-art tutorials on fire, explosions, smears,
  impacts and water: https://saint11.art/blog/pixel-art-tutorials/
- Raymond Schlitter (Slynyrd), Pixelblog catalogue (fire, water, effects, palettes): https://www.slynyrd.com/pixelblog-catalogue
- Lospec palette list (ramp study): https://lospec.com/palette-list
- The Spriters Resource (count real frames; study only):
  - Pokémon Black/White battle-move sheets
  - Street Fighter III: 3rd Strike hit sparks
  - Metal Slug explosions
  - https://www.spriters-resource.com/

**3D that reads as 2D** (directly relevant to the bible's "3D models that look super 2D, stepped on twos")
- Junya Motomura, *GuiltyGearXrd's Art Style: The X Factor Between 2D and 3D* (GDC 2015). Covers stepped
  keys with no interpolation, per-pose hand deformation and cel-shading normal edits: https://www.gdcvault.com/play/1022031/
- Thomas Vasseur, *Art Design Deep Dive: Using a 3D pipeline for 2D animation in Dead Cells* (Game
  Developer). 3D models rendered to low-res pixel sprites without anti-aliasing: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-

**Anime effects animation**
- Sakugabooru, effects tags (fire, water, smoke, impact frames): https://www.sakugabooru.com/
- TV Tropes, *Impact Silhouette* / impact-frame conventions: https://tvtropes.org/pmwiki/pmwiki.php/Main/ImpactSilhouette

**Fighting-game spark language**
- SuperCombo wiki (SF3 parry with its blue flash; hit vs. block sparks): https://wiki.supercombo.gg/

**JoJo's Soft & Wet** (Bubblion's inspiration; bubble look only)
- JoJo wiki, *Soft & Wet*: https://jojowiki.com/Soft_%26_Wet

**Pokémon move animations** (staging and readability of elemental moves)
- Bulbapedia, *Bubble*: https://bulbapedia.bulbagarden.net/wiki/Bubble_(move)
- Bulbapedia, *Surf*: https://bulbapedia.bulbagarden.net/wiki/Surf_(move)
- Bulbapedia, *Flamethrower*: https://bulbapedia.bulbagarden.net/wiki/Flamethrower_(move)
- Bulbapedia, *Head Smash*: https://bulbapedia.bulbagarden.net/wiki/Head_Smash_(move)
- Bulbapedia, *Petal Dance*: https://bulbapedia.bulbagarden.net/wiki/Petal_Dance_(move)

**Black flames** (scary fire reference family)
- TV Tropes, *Black Fire*: https://tvtropes.org/pmwiki/pmwiki.php/Main/BlackFire

**Capture suspense**
- Bulbapedia, *Catch rate* (shake checks, up to 3 wobbles, critical capture): https://bulbapedia.bulbagarden.net/wiki/Catch_rate
- Bulbapedia, *Poké Ball*: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9_Ball

**Health-symbol caution**
- ICRC, *The emblems* (the red cross is protected; games are asked not to use it): https://www.icrc.org/en/war-and-law/emblem

### 3(b) Study notes [K]

**Fire (Medeiros/Slynyrd conventions)**
- Flames are **teardrop tongues that rise, split and shrink**.
- Each tongue **detaches** from the base and fades by colour step: white → yellow → orange → red →
  dark red → smoke.
- Loops run 4–8 frames, with 4–6 colours.
- The **brightest values sit at the base and core**, not the tips.

**Explosions**
- Frame 1 is a **solid bright flash shape**, with a fast expansion over 2–3 frames.
- Then a long, slow dissipation into smoke that rises and thins with dither.
- Debris and sparks fly on separate, faster timelines.

**Smears and slashes**
- A crescent arc lasts **3–4 frames**: a thin line, then the full arc with a white core, then a thinning
  break-up.
- The weapon's own pose is often skipped and the smear *is* the swing.

**Water**
- Splashes are **crowns plus droplets** with gravity arcs.
- Bubbles are **mostly empty outlines with 1–2 highlight arcs**; filled bubbles read as balls.
- Big water uses **foam clumps** on the lip to sell the scale.

**Fighting-game spark language**
- A hit spark is warm (white/yellow).
- A block/guard spark is **cool (blue/white)**.
- SF3's **parry** has a unique blue flash and its own freeze, so a defensive success is announced
  *differently* from a hit.

**3D → 2D**
- **Guilty Gear Xrd:**
  - No interpolation: every key is held, the stepped look the bible asks for.
  - Characters are **deformed per pose** for smears and silhouettes.
  - Shading normals are **hand-edited** so the cel bands land like drawn shadows.
- **Dead Cells:** renders 3D animations to small sprites **with no anti-aliasing**, so the result
  looks hand-pixeled.
- **Tokonmon takeaway:** VFX must match the same stepped 12 fps rhythm. A 60 fps smooth particle beside
  a stepped creature looks wrong.

**Soft & Wet (JoJolion)**
- The Stand makes **soap bubbles** with an iridescent film that "plunder" properties from what they
  touch.
- It has a star motif.
- **For Bubblion, take only the bubble aesthetic:** a thin rim, a rainbow film and the pop. Don't use
  the star-shaped design or the Stand's look.

**Capture suspense (Pokémon)**
- Up to **3 wobbles**, then a **click with a star burst**.
- From Gen V, a *critical capture* wobbles **once**.
- The suspense comes from **long rests between wobbles**.

**Red cross**
- The red-cross emblem is legally protected, and the Red Cross movement has asked game makers not to use
  it as a health symbol.
- **Pennyewe (the nurse) must use a heart, a poppy or a leaf instead.**

### 3(c) Design direction: attack specs *(all values are proposals to tune in engine)*

Each spec gives the move's phases, its VFX, its colours and its impact.
- **Phases:** startup / active / recovery, in **poses @ 12 fps** (1 pose = 83 ms).
- **VFX:** frame by frame.
- **Ramp:** from §0.3.4.
- **Impact:** the hitstop class (§0.3.2), the trauma to add (§0.3.3), and whether it uses impact frames
  (§0.3.5).

Sprite sizes assume a base-form starter about 26–40 voxels tall, which renders about 32–48 px on screen
at default zoom.

#### 3.1 Chilichick (Pyro): fire breath + signature tears
- **Signature tears (always):**
  - 1-px tear streams (Hydro 4/5) every 6 poses from each eye.
  - A **steam wisp** (smoke ramp, 3×3 → 2×2) rises from the head every 8 poses.
  - **Pepper-munch quirk** in idle: 4 poses, with 2 seed pixels (`#FFE36E`) flying out.
- **Fire breath:**
  - **Startup, 3 poses:** (1) bite the pepper, a crunch and 2 seeds; (2) cheeks puff, the face shifts
    one ramp step redder, and the tears double; (3) the head pulls back and steam puffs from both sides.
  - **Active (held loop):** spawn one flame puff per pose from the beak. Each puff lives **6 frames**:

| Frame | Size | Colours | Shape |
|---|---|---|---|
| f1 | 3×3 | P7 | core |
| f2 | 5×5 | P6/P5 | |
| f3 | 7×6 | P5/P4 | ragged edge |
| f4 | 9×7 | P4/P3 | splits into 2 lobes |
| f5 | 6×5 | P3/P2 | detached tongues |
| f6 | 3×3 | P1 | then turns into a smoke puff that drifts up 1 px per frame |

  - **Motion and shape:** travel 10 px per frame forward, a ±15° cone, and 1 px per frame of upward
    drift (heat rises).
  - **Light:** `#FF8A1F`, radius 3 m, flickering.
  - **Hits:** a multi-hit tick every 2 poses (2-tick hitstop) and +0.05 trauma per tick, capped at 0.2.
    Burned targets get 2-px flame licks on their top outline.
  - **Recovery, 3 poses:** coughs a **smoke ring** (5-frame ring sprite, smoke ramp), cries, pants.
- **Bonded gimmick, the blazing crest:** the comb grows 2× and becomes a looping 6-frame flame (P3–P7)
  with embers. The breath cone widens to ±22° *(visual only)*.

#### 3.2 Riffrooster (Pyro/Echo): fast riff slashes + scary fire
- **Scary fire (black/red flames):**
  - **Same shapes as normal fire, but the values are inverted.** Bodies are S1–S2 (near-black), rims are
    S4–S5, and S6 hot glints appear on only 1–2 px.
  - **Unnatural motion:** the tongues **sway at half speed and hang or droop** instead of rising cleanly,
    and every 3rd frame they **hold** (a stutter).
  - **Light:** a dim red light (`#C8102E`, low intensity) **plus a local darken** within 2 m (a negative
    light or vignette decal). The flames *eat* light.
  - **Ground scorch:** a black decal with red ember pixels that blink for 3 s.
  - The only ramp allowed a near-`#000000` outline.
  - **Big uses** get a **ゴゴゴ** stamp and a low drone.
- **Riff combo (3 hits, quantised to eighth notes when music is on, §5.6):**

| Hit | Phases | VFX | Impact |
|---|---|---|---|
| 1 Downstroke | 1 / 1 / 1 | **Smear arc**: f1 a 1-px arc line (P6); f2 a full crescent 18×10 px (core P7, edge P4, outer S3); f3 the arc thins and breaks into 4 embers. Two **music-note sprites** (5×7, Echo 3/5) pop off the guitar. | Light, 0.10 |
| 2 Upstroke | 1 / 1 / 1 | Mirrored arc, plus 1 extra note. | Light, 0.10 |
| 3 **Power chord** | 2 (knee slide) / 2 / 3 | **Chord shockwave**: 3 concentric arc rings (inner fire P5, outer Echo 3), expanding over 5 frames. **Feedback squiggles**: 1-px zigzag lines (Echo 3/5) radiate for 2 frames. Optional scary-fire burst on the ground. | Medium-heavy (9), 0.30 horizontal |

- **Fast movement (dash):**
  - **3 afterimages** trail at 1-pose spacing: S2 at 50% dither → P3 at 25% dither → gone.
  - A 2-px dust kick at the start.
  - 4 speed lines, 1 px thick and 6–12 px long.

#### 3.3 Funkadoodle (Pyro/Echo): slap-bass fire shockwaves
- **Thumb slap (ground wave):**
  - **Startup, 2 poses:** the thumb lifts and the body crouches.
  - **Active:** three **floor-ellipse rings** (2:1 perspective), released every 2 ticks. Each grows over
    6 frames from 8×4 to 64×32 px, and the line thins 2 px → 1 px.
  - **Ring colours:** inner P5, outer Echo 3.
  - **Dust:** puffs (Geo 5) every 8 px along the ring edge.
  - **Shake:** 0.25 trauma, **vertical** and low-frequency (a bass rumble). The whole arena floor
    "thumps" 1 px down for 1 tick.
  - **Speaker-cone pulse:** Funkadoodle's body squashes 1.05× on each ring.
- **Pop (finger pop): an upward fire pillar.**
  - A 12×40 px column over 5 frames: rise (2) / hold (1) / break into tongues (2), using the P ramp.
  - **Impact:** medium hitstop.
- **Groove look:** idle and run bounce on the beat. Notes (Echo ramp) float off the bass strings every
  bar.

#### 3.4 Bubblion (Hydro): water bullets, bubble shield, bubble trap, crown
- **Water bullet (long range, precise, slow):**
  - **Startup, 2 poses:** the water-ball body **squashes** (0.9 vertical), the mouth purses, the crown
    wobbles 1 px.
  - **Release, 1 pose:** a **muzzle splash** over 3 frames (5 droplets in a 30° fan, H4/H5). The body
    recoils with stretch, and the **camera kicks 1 px** opposite.
  - **Bullet:**
    - **Frame 1 is a round 5×5 blob**, then a 6×4 ellipse (Nijman's trick of a round first frame as a
      fake muzzle flash).
    - Core H5, a 1-px H6 highlight at the top-left, outline H1.
    - **Trail:** 3 droplets (2×2, H4 → H3 → H2) spawned each frame.
  - **Aim line** (from the phone, Hydro = aiming): a dotted 1-px H4 line whose dots march at 2 px per
    frame. It turns solid H6 when locked.
  - **Impact:** a **splash crown** over 4 frames:

| Frame | What it shows |
|---|---|
| f1 | a white 5×5 flash |
| f2 | a crown 12×8 (H5/H4) |
| f3 | 8 droplet arcs falling with gravity |
| f4 | a 10×4 puddle decal that evaporates in 3 dither steps over 2 s |

  - **Impact feel:** light hitstop, +0.05 trauma.
  - **Wet status:** 1-px drips (H4) every 0.5 s from the target's bottom outline.
  - **Charged bullet (hold):**
    - A water **spiral** circles the mouth in a 4-frame loop.
    - The bullet is 10×8 with a rotating spiral stripe, and the impact is medium.
- **Bubble shield (the Soft & Wet bubble look):**
  - **Form:** f1 a 6-px bubble at the chest; f2–f4 it expands to 1.3× the body size.
  - **Rim:** 1 px `#E8FDFF`, with **2 highlight arcs**: 6 px at the top-left, 3 px at the bottom-right.
  - **Film:** three 1-px iridescent arcs **rotate around the rim at 30° per frame**, cycling `#FF9DE2` →
    `#A8F0FF` → `#FFF29D` → `#B9A8FF`.
  - **Interior:** a 25% Bayer dither of H4, so the creature stays visible.
  - **On hit:** a 3-frame wobble (1.1×0.9 → 0.95×1.05 → 1) plus a 1-px ripple ring from the contact
    point. Deflected shots spawn an H6 glint.
  - **Pop:**
    1. The rim breaks into 8 arcs.
    2. The arcs become droplets, with a 4-point white "pop" star.
    3. The droplets fall.
    4. A "pip" SFX.
- **Bubble trap:**
  - **Launch:** an 8-px bubble that drifts on a sine path (3 px amplitude) toward the target.
  - **Enclose:** on contact it expands over 3 frames to enclose the target.
  - **Trapped:** the target **lifts 6 px**, bobs 2 px at 1 Hz, and struggles (±1 px every 3 frames).
  - **Warning:** for the last 0.5 s the rim **blinks every 2 frames**, a readable "about to pop" tell.
  - **Release:** the pop, then the target drops with a landing dust puff.
- **Bonded gimmick, bubbles:** a stream of tiny 2–3 px bubbles constantly rises from the body. The
  crown gains a bubble jewel that glints on beats.

#### 3.5 Princeidon (Hydro): tsunami + bubble armor
- **Tsunami:**
  - **Startup, 6 poses:** the bubble-armor plates glint in sequence. **Water gathers**: puddles stream
    toward Princeidon as converging 1-px lines. The arena edges tint 10% H1, and a low rumble plays.
  - **Wave** (a sprite sheet or a toon-shaded mesh with pixel foam particles):

| Frame | Height |
|---|---|
| f1 | low swell, 8 px |
| f2 | 16 px |
| f3 | 32 px, with a curl |
| f4 | 48 px, with a **breaking foam lip** (foam `#EAFBFF` + H5 clumps 3–6 px, plus spray) |

  - **Travel:** the wave crosses the arena in about 1.2 s, leaving a foam trail.
  - **Hits:** heavy hitstop per target, a tumble knockback, and **sustained trauma 0.4** with a
    horizontal bias while it travels.
  - **End:** the wave collapses into spray (12 frames). The wet floor decals fade over 3 s.
- **Bubble armor** *(proposal: one way to show it)*:
  - **Look:** overlapping bubble plates, each with its own iridescent rim.
  - **When hit:** the struck plate pops (small pop VFX) and regrows over time.
  - **Readability:** the armor's condition reads from its silhouette. More plates means healthier armor.

#### 3.6 Purple Rain (Hydro, the queen): purple rain + dress twirl
- **Startup, 4 poses:** a **dress twirl** with a ruffle smear pose, then an arm raised.
- **Clouds:** three cloud blobs (R1/R2 with an R3 rim) merge above the target area over 6 frames.
- **Floor telegraph:** a dotted R3 circle with a soft rain-shadow dither inside.
- **Active:**
  - **Rain streaks:** 1×5 px (R4) with a 1-px R5 head. They fall at **15° wind slant**, 8 px per frame,
    about 40 on screen.
  - **Splashes:** 2 frames each, a 3-px "v" (R4 → R3).
  - **Damage:** ticks every beat.
  - **Light:** a purple ambient tint `#6A2BC2` at 15% inside the area. An optional lightning flash
    `#F0DDFF` for 1 tick.
- **Royal accent:** sparse gold sparkles (`#FFD86B`) in the rain, 1 per 2 beats.
- **Guardrail:** inspired by Prince's colour world. **Don't** use his Love Symbol or the album-cover
  composition.

#### 3.7 Strawbaa (Bio): ram + strawberry vine traps (damage + heal)
- **Ram:**
  - **Startup, 3 poses:** a **paw scrape** (2 dust puffs, Geo 5), the head lowers, the wool bristles.
    A 1-tick white **eye glint**.
  - **Charge:** a run cycle at 2× with a smear pose. Speed lines are 4–6 px long × 1 px, in B5/white. A
    dust puff every 2 frames.
  - **Impact:**
    - **Star burst over 4 frames:** f1 a white 8-point star 9×9; f2 12×12 with a G5/P6 ring; f3 broken
      rays; f4 3 motes.
    - **Wool puffs:** 3×3 clumps of `#FFF8F0`, plus 2 strawberry seeds.
    - Heavy hitstop, 0.35 horizontal trauma, and the victim tumbles.
- **Strawberry vine trap:**
  - **Plant:** Strawbaa stamps or spits a **seed** (3×2 `#FFE36E`) on an arc, and it **burrows** in 2
    frames with a dirt pop.
  - **Sprout:** a 16×16 px vine patch grows over 4 frames: B2/B3 tendrils, B4 leaves and small white
    flowers (`#FFF8F0` with yellow centres).
  - **State readability:** berries show their state by colour.
    - **Unripe:** green (B4).
    - **Ripe:** red (`#E0284F`). The trap is armed and ready to heal.
  - **Ally steps on it:** ripe berries **burst** into pink juice droplets (`#FF6B7F`), then **heal
    motes** rise (2×2 `#C8FFB8` / `#FFF6C2`, 1 px per frame, life 12 frames) with **heart- or
    leaf-shaped** sparkles. Never a red cross.
  - **Foe steps on it:** vines **lash** over 3 frames (coil → smear → wrap) with 1-px dark-thorn
    pixels (B1). The target's feet are wrapped by 2 vine loops. Light hitstop.
  - **Expiry:** the vines **wither** to browns (Geo 2/3) over 4 frames and sink.

#### 3.8 Ramberry (Bio/Geo): giant ram + expanding horns
- **Horn charge:**
  - The ram spec at a bigger scale, with a **ground scar** decal left along the path.
  - On impact, a **ドンッ** stamp and 0.45 trauma.
- **Bonded gimmick, expanding horns:**
  - The horns grow over 4 poses, with spiral ridges in G4/G5 and B accents.
  - They gain a pulsing 1-px Bio glow outline.
  - The first charge after expansion spawns small strawberry-vine sprouts along the scar.

#### 3.9 Pennyewe (Bio, nurse ewe with a poppy tray): healing aura with poppies
- **Startup, 2 poses:** she lifts the tray and plucks a poppy, then a twirl.
- **Aura:** **12 poppies sprout in a floor ellipse** (radius 2 m), clockwise, **one per sixteenth note**
  (beat-synced). Each poppy grows over 3 frames:

| Frame | Stage | Look |
|---|---|---|
| f1 | bud | 2×3 B3 |
| f2 | opening | 4×3 Poppy 2 |
| f3 | bloom | 5×5, with Poppy 2/3 petals and a `#1B1420` centre |

- **Ring and pulses:**
  - A dithered 1-px ring of `#FFF6C2` links the poppies.
  - **Heal pulses fire every beat:** the ring brightens for 2 frames, and allies inside emit 3–6 motes
    (2×2, rising 1 px per frame with a 1-px sine sway, life 12 frames).
- **Petals** (`#FF8A70`, 2×1 px) drift across the area.
- **Nurse identity:** a cap with a **poppy or heart emblem**, never a red cross.

#### 3.10 Rolling Stone line (Geo): rolling boulder, stone armor, golem slam
- **Rollingstone, roll:**
  - **Tuck:** 2 poses.
  - **Roll:** the 3D mesh rotates in **45° steps, one per pose** (8 steps per revolution = 0.67 s),
    with one smear pose per 90° at top speed.
  - **Bounces:** dust puffs on each bounce, pebble debris (2×2, Geo 2/3) with gravity, and speed lines.
  - **Impact:** medium hitstop, a chunk-debris spray, and a bounce off the target.
- **Fivestones, stone armor:**
  - **Gather:** five stones orbit the body (radius 0.6 m, **one revolution per bar**).
  - **Snap-in:** the stones **snap in one per beat**. Each takes 2 frames of motion plus a "clack", and a
    **1-px white glint** sweeps across the stone.
  - **Finish:** a full-armor diagonal shine band (3 px wide) sweeps across over 4 frames.
  - **When hit:** chips (2×1, Geo 4/5), a spark, and a **crack overlay in 3 stages**.
- **Fiftystone, golem slam:**
  - **Startup, 4–5 poses (slow and heavy):** both arms rise, a **ドドド** stamp, and **small rocks lift
    off the ground and float 2 px** (menace).
  - **Active, 1 pose:** an arm smear plus an afterimage.
  - **Impact:**
    - **Crack decal:** 6 radiating cracks (1-px Geo 0 lines with Geo 4 lit edges) grow over 3 frames.
    - **Dust shockwave:** an ellipse ring expanding over 6 frames.
    - **Rock spikes:** erupt along 2 of the cracks, each going rise / hold / crumble over 4 frames.
    - **Debris:** 8–12 chunks arc out and bounce once.
    - **Feel:** 12-tick hitstop, 0.6 trauma with a vertical bias, and a **3% camera punch-in for 2
      poses**.
  - **Light:** the dust cloud darkens local lighting by 15%.
- See `docs/refs/tokonmon_roster.md` §1 for the model designs.

#### 3.11 Heartbox → Inbloom (Ecto): weak golem slam, box-break reveal, angel blade slashes
- **Heartbox slam** (super slow, almost no damage, bible §3):
  - Telegraph it as hugely as a golem (it *looks* scary), but the impact is a **comically small** puff:
    a tiny 5×5 spark and a "boing" squash of the box.
  - **The spark size is honest:** a small spark means small damage.
- **Crack progression** while bonded and getting kills *(proposal; coordinate with
  `tokonmon_roster.md`, which proposes one crack per kill)*:
  - **Each bonded kill:** adds a crack decal with **light leaking** (Ecto 4/5, plus heart-box pink).
  - **On the last crack:** add light beams, and the heartbeat SFX speeds up.
- **The break (in battle; the first time triggers the cinematic, §5.4):**
  1. The cracks blaze.
  2. 2 impact frames.
  3. The box **shatters into 16–24 shards** (heart-box ramp with Heart 0 edges) that fly out in **0.3×
     slow-mo for 600 ms**.
  4. White and gold feathers and petals burst out.
  5. **Inbloom unfolds its wings over 6 poses** and a halo appears (a gold 1-px ellipse).
  6. The music cuts to **silence for 1 beat**, then drops.
- **Angel blade slashes (Inbloom):**
  - **Crescent arcs over 3 frames:** core `#FFFFFF`, mid `#FFF3B8`, edge `#FFD15C`, with an **Ecto 3
    outer shadow** (a two-tone holy/ghost contrast).
  - **Feathers:** 3–5 per slash (3×2 white with a gold tip), falling slowly with a sway.
  - **Combo finisher:** an **X-cross spark** (two crossing lines growing 1 → 3 px), plus 2 impact frames.
  - **Impact:** light/medium hitstop, because Inbloom is fast.

#### 3.12 Elemental reactions: steam explosion (water + fire) and a template
- **Steam explosion:**

| Frame | What it shows |
|---|---|
| t0 (1 tick) | The target's silhouette flashes white, plus a 3-px white ring. |
| f1 | A 12-px expanding core (`#FFFFFF` / `#FFE2A8`). |
| f2 | A 24-px billow in 4 lobes (Steam 4/3), with an orange-tinted core. |
| f3–f4 | A 36-px puff. Droplets (H5) fly out. |
| f5–f10 | The lobes drift up 1 px per frame and step down the steam ramp, then dither out. |

  - **Impact:** heavy hitstop, **0.5 omni trauma**, a **ジュワッ** stamp, the commentator's "Steam
    explosion!", and the jumbotron ticker.
  - **No floating UI text.** The commentator, the jumbotron and the stamp carry the name.
- **Reaction template** for future reactions the owner defines:
  - **f0:** the two element colours **swirl** together for 2 frames at the contact point.
  - **f1:** a 1-tick white flash.
  - **After:** the result particle in a reaction-specific ramp.
  - **Rule:** reactions **always** get the heavy treatment, because they are the skill payoff of
    switching (bible §3: "switching is essential").

#### 3.13 Capture: the gem-powered keychain device
- **Gate:** the phone's **license chip glints** first (Tokonmon can't be caught without a license, bible
  §2): a 1-tick sparkle on the in-world phone sprite.
- **Startup, 2 poses:** the trainer raises the keychain, and the **gem charges** with a 4-frame
  sparkle. *(The gem's colour shows the gem type; the gem types are not yet defined.)*
- **Launch:**
  - Three concentric **gem-light rings** fly to the target and **close around it**, shrinking over 4
    frames.
  - The target becomes a white silhouette (2 frames), then shrinks into a light orb (6 frames).
  - The orb zips back to the keychain (4 frames) with a light trail.
- **Suspense** (the Pokémon wobble lesson):
  - The keychain charm **wobbles up to 3 times**. Each wobble is a 2-pose tilt plus a **4–6 pose
    rest**, and the gem pulses dimmer each time.
  - The trainer sprite leans in, and the crowd (in the stadium) or the ambience (in the wild) goes quiet.
- **Success:**
  - A **click**, then a gem flash and a burst of 5 star sparkles (5×5).
  - The charm now shows a tiny pixel portrait of the creature.
  - The phone buzzes in-world (the player sprite vibrates ±1 px), and the scan app registers it (§6).
- **Fail:**
  - The charm shakes violently, then **bursts**: gem-light shards (2×2) and a ring break.
  - The creature pops out with an angry 2-pose stomp.

#### 3.14 Shared combat VFX
- **Hit spark (neutral):** a 4-frame star using the neutral ramp. It scales with the hit class: 7 px
  (light), 11 px (medium), 15 px (heavy).
- **Guard:** a blue-white hexagon flash (guard ramp, 3 frames) with a "tunk" SFX.
- **Parry (kept from v1):**
  - **Both** creatures flash white for 1 tick, followed by a **12-tick freeze**.
  - A blue ring burst (guard ramp, 5 frames) and a high "ting".
  - The jumbotron ticker shows "PARRY!".
  - A parry must look **unlike** a hit (the SF3 lesson).
- **Dodge:**
  - 2 afterimages (element 2/3, dithered) and a dust kick.
  - The **dodged projectile** passes through with a 1-px "whiff" line.
- **Combo moves** (grab + parry + attack; elemental charge + attack; kept from v1):
  - **Grab:** a 2-pose "catch" pose with a white 1-px grip flash.
  - **Elemental charge:** a 4-frame aura loop in the element ramp, plus inward-flowing particles.
- **QTE** (kept from v1):
  - The prompt appears **on the phone** as one big pulsing button.
  - In-world, the creature freezes on a **held anticipation pose** with a 1-px white outline.
- **Status looks** (no icons):
  - **Burn:** flame licks.
  - **Wet:** drips.
  - **Sleep:** "zz" pixels (the `zz` emitter) plus closed eyes.
  - **Poison:** a purple bubble every 1 s.
  - **Drowning / underwater:** bubbles rise from the mouth.

### 3(d) Do / Don't

**Do**
- Run every VFX at the creatures' 12 fps step.
- Put the brightest frame first.
- Fade by ramp and dither.
- Make each element instantly identifiable by **shape** (tongues, crowns and droplets, vines, chunks,
  rings), not only by colour.
- Make block and parry sparks cool-coloured and hits warm.
- Show trap and bubble states by look (ripe/unripe, a blinking rim).

**Don't**
- Don't run 60 fps smooth particles beside stepped creatures.
- Don't use pure black (except scary fire), or smooth alpha gradients.
- Don't use a red cross for healing.
- Don't copy band logos, album art or Stand designs.
- Don't cover the target with the VFX for longer than 3 poses; the player must see the hit land.

---------------------------------------------------------------------------------------------------

## 4. Emote moves (taunt, dance, shake…)

### 4(a) References (all [K])

**Pokémon**
- Bulbapedia, *Splash* ("But nothing happened!"): https://bulbapedia.bulbagarden.net/wiki/Splash_(move)
- Bulbapedia, *Celebrate* (event move; "Congratulations, [player]!"): https://bulbapedia.bulbagarden.net/wiki/Celebrate_(move)
- Bulbapedia, *Taunt*: https://bulbapedia.bulbagarden.net/wiki/Taunt_(move)

**Smash and fighting games**
- SmashWiki, *Taunt* (up/side/down taunts; Luigi's down taunt can hit; Snake's codec call): https://www.ssbwiki.com/Taunt
- Wikipedia, *Art of Fighting* (1992; the taunt drains the opponent's spirit gauge): https://en.wikipedia.org/wiki/Art_of_Fighting
- SuperCombo wiki, *Street Fighter III: 3rd Strike* (Personal Actions give per-character buffs): https://wiki.supercombo.gg/
- Wikipedia, *Devil May Cry 3* (taunts build the Devil Trigger gauge and style): https://en.wikipedia.org/wiki/Devil_May_Cry_3:_Dante%27s_Awakening

**Sports**
- Wikipedia, *Celebration (sport)*: https://en.wikipedia.org/wiki/Celebration_(sport)

### 4(b) Study notes [K]
- **Splash and Celebrate (Pokémon):** these are **pure-flavour moves**. Splash's joke is that *nothing
  happens*; Celebrate exists only to make the creature look happy.
  - **Lesson:** emotes can be beloved with zero mechanical effect, if the animation is funny and
    in-character.
- **Smash:**
  - Three taunts mapped to directions. Most do nothing.
  - **A few have hidden hitboxes or secrets:** Luigi's down taunt can meteor-smash, and Snake's taunt
    opens a codec call on one stage. Players love discovering these.
- **Fighting games with mechanical taunts:**
  - **Art of Fighting** (the origin): the taunt **drains the opponent's special meter**.
  - **SF3: 3rd Strike** "Personal Actions" give the taunter a **temporary buff**.
  - **Devil May Cry:** taunting raises the style rank and the Devil Trigger meter.
  - **Common design:** a taunt is a **risk** (long and punishable) traded for meter or a buff.
- **Sports celebrations:** short and signature. Crowds and broadcasts amplify them.

### 4(c) Design direction for Tokonmon
- **What emotes *do* is an (open question for owner).** The bible lists "Emote moves: taunt, dance,
  shake, etc." without an effect.
  - **What the references suggest:**
    - the classic **risk-for-reward** model (a long, punishable animation in exchange for meter, a buff
      or bond time);
    - or Pokémon's **pure flavour**.
  - **The presentation below works for either.**
- **Input:** the phone's emote button opens a **3-slot radial** (Smash's up/side/down): **Taunt /
  Dance / Shake**. Long-pressing an order icon is not used.
- **Timing:**
  - Emotes are **12–24 poses (1–2 s)**.
  - They **start on the next beat**, and dances loop **1 bar**.
  - **No invulnerability:** they are readable windows for the opponent.
- **Feedback:**
  - The crowd cheers; the commentator gets a priority-9 line; the camera crew flashes.
  - Emotes are cosmetic **hype**, which suits the stadium.
- **Per-starter emote sketches** (in-character and original):

| Tokonmon | Taunt | Dance | Shake |
|---|---|---|---|
| **Chilichick** | Chomps a pepper, cries *harder*, then puffs its chest with steam jetting from its head (16 poses). | A chicken strut and head-bob on the beat. | Shakes off tears; droplets and embers spray. |
| **Riffrooster** | A knee-slide guitar-solo pose, then a scary-fire burst behind it plus a ゴゴゴ stamp. | Windmill strums. | A feathers-bristle shake with ember sparks. |
| **Funkadoodle** | A "come at me" bass slap toward the opponent, with 1 ground ring that does no damage. | Funk side-steps with a bob on the beat. | A strut-shake; the tail feathers fan out. |
| **Bubblion** | Blows a **raspberry bubble** that pops in its own face. | Bounces its water ball and **spins its crown up and catches it**. | A water-ball jiggle; tiny bubbles spray out. |
| **Princeidon** | A royal "beckon" with an armor-plate shimmer. | A slow regal spin with bubbles orbiting. | Plates rattle in sequence. |
| **Purple Rain** | A fan-flick with a purple sparkle. | A **dress twirl** with a ruffle smear and a ring of rain-sparkles. | A curtsy shake; rain droplets fall from the dress. |
| **Strawbaa** | Head-butts the air twice and huffs. | A sheep hop-dance. | **A wool shake like a wet dog**: wool tufts, seeds and petals fly (12 poses). |
| **Ramberry** | Horn flex; the horns glint. | A heavy stomp-dance; dust rings on each beat. | A head shake; strawberries tumble out of the wool. |
| **Pennyewe** | Offers a poppy **to the crowd**, and the crowd cheers. | A nurse-tray twirl. | A wool shake; poppy petals swirl. |

- **Generic emote VFX kit:**
  - Music notes (Echo ramp) for dances.
  - Sweat drops (Hydro 5) for shakes.
  - A 2-pose "!" anger-vein pop (Pyro 4) for taunts.

### 4(d) Do / Don't

**Do**
- Make emotes funny, in-character and beat-synced.
- Let the crowd react.
- Keep them short and punishable.

**Don't**
- Don't give emotes i-frames.
- Don't make them longer than 2 s.
- Don't decide their gameplay effect without the owner.
- Don't copy Fortnite or other games' famous dances. Make each emote from the creature's own concept.

---------------------------------------------------------------------------------------------------

## 5. Animation sets, evolution & transformation cinematics, bond link, music sync

### 5(a) References (all [K]; verify with Appendix A queries 5.x)

**Animation sets**
- PMDCollab, *SpriteCollab* (Pokémon Mystery Dungeon-style sprite sets; standard animation names and
  per-frame durations in `AnimData.xml`): https://github.com/PMDCollab/SpriteCollab
- PMDCollab sprite browser: https://sprites.pmdcollab.org/
- Motomura, *GuiltyGearXrd's Art Style* (GDC 2015): https://www.gdcvault.com/play/1022031/
- Vasseur, *3D pipeline for 2D animation in Dead Cells*: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-

**Evolution and transformation sequences**
- Bulbapedia, *Evolution* (the in-game evolution sequence; it can be cancelled): https://bulbapedia.bulbagarden.net/wiki/Evolution
- Bulbapedia, *Mega Evolution* (Key Stone ↔ Mega Stone light link, light shell, burst): https://bulbapedia.bulbagarden.net/wiki/Mega_Evolution
- TV Tropes, *Transformation Sequence*: https://tvtropes.org/pmwiki/pmwiki.php/Main/TransformationSequence
- TV Tropes, *Stock Footage* (reused henshin and digivolution footage): https://tvtropes.org/pmwiki/pmwiki.php/Main/StockFootage
- TV Tropes, *Magical Girl*: https://tvtropes.org/pmwiki/pmwiki.php/Main/MagicalGirl
- Wikipedia, *Digimon Adventure* (the Digivolution sequence): https://en.wikipedia.org/wiki/Digimon_Adventure
- Wikipedia, *Sailor Moon*: https://en.wikipedia.org/wiki/Sailor_Moon
- Wikipedia, *Pretty Cure*: https://en.wikipedia.org/wiki/Pretty_Cure
- Wikipedia, *Henshin* (Kamen Rider / Super Sentai pose culture): https://en.wikipedia.org/wiki/Henshin

**Bond link**
- TV Tropes, *Red String of Fate*: https://tvtropes.org/pmwiki/pmwiki.php/Main/RedStringOfFate
- Bulbapedia, *Bond Phenomenon* [S], listed in §1(a).

**Music-synced games**
- Wikipedia, *Hi-Fi Rush*: https://en.wikipedia.org/wiki/Hi-Fi_Rush
- GDC Vault, Tango Gameworks' *Hi-Fi Rush* talks (search "Hi-Fi Rush" on https://www.gdcvault.com/)
- Wikipedia, *Crypt of the NecroDancer*: https://en.wikipedia.org/wiki/Crypt_of_the_NecroDancer
- Wikipedia, *Sayonara Wild Hearts*: https://en.wikipedia.org/wiki/Sayonara_Wild_Hearts
- Wikipedia, *Rhythm Heaven*: https://en.wikipedia.org/wiki/Rhythm_Heaven
- Wikipedia, *Patapon* (commands on a beat): https://en.wikipedia.org/wiki/Patapon

### 5(b) Study notes [K]

**PMD SpriteCollab animation vocabulary**
- **Animation names (fan-standardised, used for 1,000+ creatures):** `Idle`, `Walk`, `Attack`,
  `Strike`, `Shoot`, `Charge`, `Swing`, `Double`, `Hop`, `Rotate`, `Hurt`, `Faint` and `Sleep`,
  `EventSleep`, `Wake`, `Eat`, `Pose`, `Nod`, `Sit`, `LookUp`, `Tumble`, `Trip`, `Cringe`,
  `Float`, `DeepBreath`, and more.
- **Format:** each sheet has **8 directions**, and each frame has a duration in ticks.
- **Why it matters:** this is a ready-made, proven list of what a creature needs to *act* in cutscenes,
  not just fight. Tokonmon's 2D phone sprites and its 3D creature animation should use the same names.

**Guilty Gear Xrd (3D that reads as 2D)**
- **Held keys:** no in-between interpolation, and the timing is chosen per pose like a 2D animator's
  timing sheet.
- **Pose sculpting:** models are **scaled or deformed per pose** to fake perspective and smears.
- **Cel shading:** shading normals are edited so the cel shadows fall in "drawn" places, and the
  outlines are inverted-hull.

**Dead Cells**
- 3D animation is rendered to low-res sprites with **no anti-aliasing**.
- Normals are baked for dynamic lighting, which keeps both lighting and a pixel look.

**Pokémon evolution sequence (games)**
- **Mood:** the music changes and the background goes abstract.
- **The flicker:** the sprite turns into a **white silhouette** that **alternates** between the old and
  new forms with **accelerating frequency**.
- **Climax and reveal:** a flash, the new form revealed in colour, and a congratulation jingle.
- **Cancel:** the player can cancel it, a kept tension beat. *(Whether Tokonmon evolutions can be
  cancelled is not in the bible, so it is not proposed.)*

**Mega Evolution**
- Light strands connect the trainer's stone and the creature's stone.
- The creature is enclosed in a **sphere or shell of light** that **cracks**, and the new form bursts
  out. The Mega symbol flashes.

**Digivolution (Digimon Adventure)**
- A reused **stock-footage** sequence with a **data / wireframe** look: the creature's body becomes
  light, code or polygons, and the new body assembles.
- It ends with a **name shout and pose**.
- **Length:** about 20–40 s on TV. Games shorten it.

**Magical-girl transformations (Sailor Moon, Precure)**
- **Fixed structure:**
  1. A trigger item and a call.
  2. An abstract background (ribbons, gradients).
  3. A **silhouetted body**.
  4. **Costume pieces appear one at a time**, each with its own sparkle (gloves → boots → skirt →
     accessory).
  5. A **signature final pose with the name call**.
  6. A return to the scene.
- **Reuse:** it is reused as stock footage, so it is designed to be **watchable many times**.

**Henshin (Kamen Rider, Sentai)**
- A **pose plus a call plus a device** activation.
- The device is the transformation's "key", which maps onto Tokonmon's bracelet and soul stone.

**Hi-Fi Rush**
- **The whole world moves on the beat:** props, enemies, lights and the hero's idle.
- **Generous timing:** attacks **always land on the beat** even if the press is a little off. Pressing
  on the beat gives extra damage and score.
- **Visual helpers:** an optional beat visualiser (a cat companion and a rhythm HUD).
- **Lesson:** sync the *animation* to the music, and never punish the player with dropped inputs.

**Crypt of the NecroDancer**
- Movement is **only on the beat**.
- **Beat markers scroll in from both sides toward a pulsing heart** at the bottom centre.
- **Missing a beat** breaks the coin multiplier. Enemies have per-beat patterns.

**Sayonara Wild Hearts**
- Each level is authored **on the song's timeline**: events, camera cuts and set pieces are placed at
  musical moments.
- The whole game is an "album".

**Rhythm Heaven**
- Every cue is **audio and visual together**, so the player can react to sound alone.
- A useful accessibility lesson.

**Patapon**
- Commands are drum phrases entered **on the beat**.
- Units respond after the phrase: a *delay that feels intentional* because it is musical.
- **Directly relevant to Tokonmon's order delay.**

### 5(c) Design direction for Tokonmon

#### 5.1 Creature animation set (3D model stepped at 12 fps, plus the matching 2D sprites) *(proposal)*

Names follow the PMD vocabulary where possible. Pose counts are at 12 fps.

| Animation | Poses | Loop? | Key poses / notes |
|---|---|---|---|
| `Idle` | 8–12 | loop | breath (1-px rise), element tell (Chilichick tears, Bubblion crown wobble) |
| `Quirk` | 12–24 | one-shot every 5–12 s | from `MODELING.md`'s quirks (headbang, spin, shakeoff, sniff…) |
| `Walk` | 8 | loop | contact / down / pass / up ×2 |
| `Run` | 6 | loop | 1 airborne pose; dust puff on contact |
| `Dash` / `Dodge` | 4 | one-shot | anticipate / smear / afterimage / land |
| `Ack` | 2 | one-shot | **order acknowledgement** (§1.1): head or ear flick toward the trainer |
| `Attack` (melee) | 2–4 / 1–2 / 3–5 | one-shot | startup / smear active / recovery |
| `Shoot` (ranged) | 2–3 / 1 / 3 | one-shot | startup / release with recoil / recovery |
| `Charge` | 2 + 4 loop | loop | aura loop in the element ramp; release goes into `Attack` / `Shoot` |
| `Cast` (support) | 3 + 4 loop + 2 | loop | Strawbaa seed spit, Pennyewe tray lift |
| `Parry` | 1 / 2 / 3 | one-shot | antic / parry flash pose / recover |
| `Guard` | 2 + hold | hold | |
| `Grab` | 2 / 1 / 3 | one-shot | for the kept grab+parry+attack combos |
| `Hurt` (light) | 2 | one-shot | plays *after* hitstop |
| `Hurt` (heavy) → `Tumble` → `GetUp` | 3 → 6 → 4 | one-shot | knockback chain |
| `Status` idles | 8 | loop | burned hop, wet drip, `Sleep` (zz), poisoned wobble, trapped struggle |
| `LowHP` idle | 8 | loop | panting; replaces `Idle` under 25% |
| `Faint` | 8–10 | one-shot, hold the last pose | falls, eyes go x x (`MODELING.md` face set); recall light follows |
| `Victory` | 12–16 | loop | signature pose per creature |
| `Emote` ×3 | 12–24 each | one-shot / 1-bar loop | §4 |
| `Enter` (switch-in) | 12 | one-shot | gate entrance pose (§2.1) |
| `Recall` | 6 | one-shot | becomes light ribbons |
| `BondIdle` | 8–12 | loop | the gimmick is visible; wears the trainer's accessory |
| `UltPose` | 6–8 | hold | mirrors the trainer's pose (§1.3) |
| `Eat` | 6–8 | loop | for eating scenes (§8) |
| `Sleep` / `Train` | 8 / varies | loop | dojo auto-training (§8) |
| `Float` | 8 | loop | evolution start (§5.2) |

**2D sprite companions** (the phone, scan, dex, team list and cut-ins, bible §1):
- A front-¾ `Idle` (4–6 frames).
- A **large cut-in pose** (the ultimate band, §1.3).
- A **16×16 or 24×24 icon** with a 2-frame bob (team list and box grid, §8).
- A **silhouette** version for unscanned "???" (§6).

**Humans** (4 directions):
- `Idle` 4, `Walk` 6–8, `Run` 6.
- **Emote set:** wave, think, cheer, laugh, surprised (!), sad, angry, eat, sit, *look at phone*, *phone
  buzz*.
- **Battle poses:** **command point** (§1.1), **bond wrist-raise** (§1.2), **ultimate pose** (§1.3),
  **recall / keychain raise** (§2.1, §3.13), **capture throw**, flinch (the bond pain link).

**Technique rules** (Guilty Gear Xrd lessons):
- Hold every key on twos.
- Deform the model per pose for smears and silhouettes.
- Pick each creature's **3 hero silhouettes** (idle, attack peak, victory) and polish them like
  illustrations.

#### 5.2 Evolution cinematic: "spectacular" (bible §7) *(proposal)*

The full version is about **8 s**, at 4/4 and roughly 120 BPM (1 beat = 0.5 s). Later evolutions of
the *same line* play the full version too; it happens rarely.

| Beat | t (s) | What happens |
|---|---|---|
| 1–2 | 0–1.0 | The world **dims by palette shift**, the music ducks to a pad, and the creature lifts into `Float`. The phone in the player's hand buzzes. |
| 3–6 | 1.0–3.0 | A **light cocoon**: the creature becomes a **white silhouette with a 1-px element-colour outline**. Element particles spiral in (flames, droplets, petals, pebbles, wisps). |
| 7–12 | 3.0–6.0 | **The flicker** (the Pokémon grammar): the silhouette alternates old ↔ new forms, **accelerating and locked to the music**: 1 per 2 beats → per beat → per 8th → per 16th → per 32nd. Under it, the **five-axis stat pentagon** of the skill tree (§6.7) draws itself as a glowing sigil on the floor. |
| 13 | 6.0 | **Burst**: 2 impact frames, a white-out of 1 tick, a shockwave ring and the sigil flashing. |
| 14–16 | 6.0–7.5 | **Reveal**: the new form in full colour does its `Victory` pose. A **name banner** (slanted band, the §1.3 grammar) shows the name in kana + Latin letters. Element confetti falls. |
| — | 7.5–8.0 | Back to the world. The phone gets a "Dex updated" toast (§6). |

**Alternate evolutions** use the same template with the alt form's colours. The **Beatlet** four-way
evolution stamps the condition's place or icon into the floor sigil:
- **Lenshorn:** the lemon boss.
- **McCarapace:** canal waves.
- **Harrisun:** a sunrise disc.
- **Starrab:** a combo counter.

#### 5.3 Elemental Form transformation (bonded final evolution + Spectral stone, bible §5) *(proposal)*

This uses the magical-girl / henshin grammar, built to be watched many times.
- **First time:** about 6 s.
- **Later:** a 2 s cut (only the trigger → final pose → name).

| Bar.beat | What happens |
|---|---|
| 1.1 | **Trigger**: the trainer's henshin-style wrist pose. The soul stone becomes the **Spectral stone** and refracts into a **prismatic beam** (cycling through the five core element colours). |
| 1.3 | The background goes **abstract**: element-ramp ribbons scroll on a dark gradient, and a holographic **data-wireframe grid** (cyan `#3FF2FF`, 1 px) sweeps across. This is the Osaka-2050 nod to Digivolution's data look. |
| 2.1–2.4 | The creature's **silhouette**. **One new form piece appears per beat** (crest, armor plate, horns, wings…), each with its own 4-frame sparkle and a chime pitched up the scale. |
| 3.1 | **Final pose** on the downbeat, a ゴゴゴ stamp and a name banner: "[Name] — Elemental Form". |
| 3.3 | A shockwave returns us to the arena. The bond thread (§1.2) is now **prismatic**. |

#### 5.4 Heartbox → Inbloom reveal cinematic (first time only; later breaks use the §3.11 in-battle version) *(proposal)*

About 7 s, in 4 bars:

| Bar | What happens |
|---|---|
| 1 | Silence except a **heartbeat**. A camera push-in on the cracked box. The light leaks pulse with each heartbeat. |
| 2 | The cracks spread **one per beat**, with a beam of light through each. |
| 3 | **Shatter** on the downbeat: shards in slow-mo, feathers and petals. The ghost-purple box interior releases wisps. |
| 4 | **Inbloom** unfolds (wings over 6 poses, then the blades draw with a glint), the halo lights, a name banner. The music **drops** into its full theme. |

#### 5.5 Bond link effects (soul-stone beam, threads) *(proposal)*
- **The beam (activation, §1.2):**
  - Three layers: a white 1-px core, then the element colour, then the soul-stone colour.
  - **Travel:** 4 poses, with a 3-frame starburst at both ends.
- **The thread (persistent):**
  - A sine-bowed, 3-px-wide line with **one bead per beat**.
  - **At Elemental Form:** it turns prismatic, cycling through the five core colours along its length.
- **Shared-feeling cues** (the Ash-Greninja reference):
  - The trainer flinches on the creature's heavy hits.
  - The creature glances back at the trainer during the trainer's barks.
- **Visual-language rule:** a **red-string-of-fate** silhouette (a thin line linking two hearts) is fine
  as a motif for friend bonds on the phone (§6.5). Keep it **out of** combat so threads stay readable.

#### 5.6 Music sync: attacks, camera cuts and cutscenes locked to beats and bars (bible §6, §10) *(proposal)*

**The clock:** the music system publishes `bpm`, `beatIndex`, `barIndex`, `phrase` (8 bars) and the
current time to the next beat, bar or phrase. Everything below subscribes to it.

| What | Sync rule |
|---|---|
| **Ultimate final impact** | Quantise to the **next bar downbeat** if ≤ 1 bar away. The cut-in hold stretches between 600 and 1200 ms to fit. Otherwise use the next beat. |
| **Basic and skill impacts** (Hi-Fi Rush model) | If the natural impact is within **±60 ms** of an 8th note, stretch the startup or recovery by up to **±15%** so the impact frame lands on it. Never drop or delay input beyond that. |
| **Order "on-beat" bonus** (Echo-element rhythm style, bible §3) | Order taps judged against the beat: **perfect ±50 ms, good ±100 ms**. On perfect, the ack icon (§1.1) flashes gold for 1 pose with a "♪" spark. *(The gameplay effect is the owner's call; the bible only says Echo = rhythm.)* |
| **Emotes and dances** | Start on the next beat; loop 1 bar. |
| **Bond thread beads, aura pulses, heal pulses** | Every beat. |
| **Crowd bob, jumbotron LED pulse** | Every beat. Claps on 2 and 4 in League matches. |
| **Stadium light chases** | Every 16th at climaxes: a KO, an ultimate, the last minute. |
| **Camera cuts** (cutscenes, evolution, halftime, intros) | **Only on bar lines**. Big reveals land on **phrase boundaries** (Sayonara Wild Hearts authoring). |
| **League (Elite Four / Champions) intros** | Edited to the theme's phrases: the walk-out on bar 1, the creature reveal on the downbeat of bar 5, "BATTLE!" on the phrase end. |
| **Visual beat helper** (accessibility, the NecroDancer / Hi-Fi Rush idea) | Optional: the soul stone on the phone pulses on beats, and the trainer's foot taps. No extra HUD. |
| **Rhythm Heaven rule** | Every beat-synced visual cue also has an audio cue, and vice versa. |

**Originality:** the chants, claps and stingers are original. Never reproduce a famous stomp-clap or
riff pattern, real melodies or lyrics (bible §10).

### 5(d) Do / Don't

**Do**
- Reuse one evolution template, so every evolution stays spectacular and consistent.
- Make transformations watchable 20+ times, with short versions.
- Snap animation to the beat, not input.
- Cut cameras on bars.
- Give every rhythmic visual an audio twin.

**Don't**
- Don't drop or ignore inputs to keep sync.
- Don't stretch animations more than ±15% (it breaks the 12 fps feel).
- Don't put more than one cinematic between a player and the battle.
- Don't copy the Sailor Moon, Digimon or Pokémon footage. Use the *structure*, not the imagery.

---------------------------------------------------------------------------------------------------

## 6. The phone UI: the main interface (bible §8, §7)

### 6(a) References (all [K]; verify with Appendix A queries 6.x)

**Phones and devices in games**
- Game UI Database (search *Persona 5*, *The World Ends with You*, *Pokémon Sword*, *Animal Crossing:
  New Horizons*, *Cyberpunk 2077*, *Dead Space*): https://www.gameuidatabase.com/
- Wikipedia, *Persona 5* (UI art direction; the chat and phone screens): https://en.wikipedia.org/wiki/Persona_5
- Megami Tensei wiki, *Confidant* (ranks, rank-up card, texting): https://megamitensei.fandom.com/wiki/Confidant
- Wikipedia, *The World Ends with You* (the phone as a menu; scanning for thoughts and Noise): https://en.wikipedia.org/wiki/The_World_Ends_with_You
- Bulbapedia, *Rotom Phone*: https://bulbapedia.bulbagarden.net/wiki/Rotom_Phone
- Bulbapedia, *Pokédex*: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex
- Wikipedia, *Yo-kai Watch* (the watch lens search; medal summons with tribe jingles): https://en.wikipedia.org/wiki/Yo-kai_Watch
- Nookipedia, *NookPhone*: https://nookipedia.com/wiki/NookPhone
- Zelda wiki, *Sheikah Slate*: https://zelda.fandom.com/wiki/Sheikah_Slate
- Metroid wiki, *Scan Visor*: https://metroid.fandom.com/wiki/Scan_Visor

**Diegetic UI**
- Wikipedia, *Dead Space (2008)*: https://en.wikipedia.org/wiki/Dead_Space_(2008_video_game)
- Wikipedia, *Firewatch*: https://en.wikipedia.org/wiki/Firewatch
- Wikipedia, *Metro Exodus*: https://en.wikipedia.org/wiki/Metro_Exodus

**Decorated phones**
- Wikipedia, *Decoden*: https://en.wikipedia.org/wiki/Decoden
- Wikipedia, *Mobile phone charm*: https://en.wikipedia.org/wiki/Mobile_phone_charm
- Wikipedia, *Purikura*: https://en.wikipedia.org/wiki/Purikura

**License and trainer cards**
- Bulbapedia, *Trainer Card*: https://bulbapedia.bulbagarden.net/wiki/Trainer_Card
- Wikipedia, *Driving licence in Japan* (green / blue / gold licence bands): https://en.wikipedia.org/wiki/Driving_licence_in_Japan

**Chat**
- Wikipedia, *Line (software)* (read receipts, stickers): https://en.wikipedia.org/wiki/Line_(software)

**Discs and record players**
- Bulbapedia, *TM* (disc-shaped, type-coloured; crafted discs in Scarlet/Violet): https://bulbapedia.bulbagarden.net/wiki/TM
- Wikipedia, *Phonograph record* (33⅓ / 45 rpm, labels, sleeves): https://en.wikipedia.org/wiki/Phonograph_record

**Radar charts and skill trees**
- Wikipedia, *Radar chart*: https://en.wikipedia.org/wiki/Radar_chart
- Bulbapedia, *Condition* (the five-stat **pentagon** of Pokémon Contests): https://bulbapedia.bulbagarden.net/wiki/Condition
- EA Sports FC, *Ratings* (six-attribute player cards: PAC, SHO, PAS, DRI, DEF, PHY): https://www.ea.com/games/ea-sports-fc/ratings
- UESP, *Skyrim: Skills* (perk trees drawn as constellations): https://en.uesp.net/wiki/Skyrim:Skills
- Final Fantasy wiki, *Sphere Grid*: https://finalfantasy.fandom.com/wiki/Sphere_Grid

**Renaming and text input**
- Bulbapedia, *Nickname* (the naming screen, character limits): https://bulbapedia.bulbagarden.net/wiki/Nickname
- Wikipedia, *Japanese input method* (12-key **flick input** on phones): https://en.wikipedia.org/wiki/Japanese_input_method

**Japanese pixel fonts**
- itouhiro, *PixelMplus* (10/12 px): https://github.com/itouhiro/PixelMplus
- Num Kadoma, *Misaki* (8×8): https://littlelimit.net/misaki.htm
- Num Kadoma, *k8x12*: https://littlelimit.net/k8x12.htm

### 6(b) Study notes [K]

**Persona 5**
- The UI *is* the art direction. It uses **red / black / white only**, with **tilted panels**,
  **ransom-note mixed typography** and everything **animating in at an angle**.
- The **phone chat** shows a group thread with portrait avatars in cut-out frames, at night between
  days.
- **Confidants** have **10 ranks**. A rank-up plays a **tarot-card** animation and texts arrive to
  invite you to hang out.
- **Lesson:** a menu can be pure personality, if it is one consistent graphic language.

**The World Ends with You**
- **The phone is the menu.** Missions arrive as **texts** with a deadline.
- **Scanning** overlays the city: you see **people's thoughts as floating text** and enemy symbols.
- **Lesson:** a phone scan can reveal a hidden *layer of the world*, not just a stats page.

**Rotom Phone (Sword/Shield)**
- The phone *is a character*: Rotom gives it a face, and it hosts the Pokédex, map, camera and
  bike.
- **Lesson:** the device can have a light personality (sound, a small face icon) without becoming a
  mascot.

**Yo-kai Watch**
- A **lens you sweep over the world** that **reacts when it nears something hidden**.
- Summoning puts a **medal into the watch**, and each **tribe has its own jingle**.
- **Lesson:** a gem or medal inserted into a wrist device, with a per-category jingle, is a great ritual
  for the capture keychain and the soul stone.

**NookPhone**
- A **3×n grid of big, friendly app icons**, warm and readable. The phone **case is customisable**.
- The player's character visibly holds the phone.
- **Lesson:** the simplest grid wins for frequent use.

**Sheikah Slate**
- A tablet held in-world, with runes as apps, a map with pins, and a camera feeding the compendium.
- The glowing-line ornament is consistent everywhere.
- **Lesson:** one ornament language (Tokonmon's would be the soul-stone glyphs) unifies the device.

**Metroid Prime Scan Visor**
- A dedicated scan mode **tints the view**. Scannable things get **colour-coded markers** (new vs.
  critical vs. done).
- **Hold to scan** with a **progress bar**; results go to a **logbook**.
- **Lesson:** use hold-to-scan with visible progress.

**Dead Space**
- Health is a **light bar on the hero's spine**, and the inventory is a **hologram in the world**.
- **The game doesn't pause.**
- **Firewatch:** a **physical paper map and compass** held up in first person.
- **Metro:** a **wristwatch** shows stealth and timers, and a **clipboard map**.
- **Lesson:** information carried by objects the character really has.

**Decoden** (*deko-den*, decoration + phone)
- Phone cases covered in **silicone "whipped cream"**, **cabochons** (sweets, bows, pearls,
  strawberries) and **rhinestones**.
- Plus **phone straps and charms** (keitai straps, 2000s Japan) and **purikura** photo stickers.
- **Lesson:** decoration is layered: case base → cream or frame → cabochons → rhinestones → stickers →
  dangling charms.

**Trainer Card (Pokémon)**
- **Front:** ID No., name, money, Pokédex count, play time.
- **Back:** badges.
- The card **colour upgrades with achievements** (bronze → silver → gold tiers).
- **Japanese driving licences** have a **validity band coloured green (new), blue (standard) or gold
  (excellent record)**, a real-world rank colour code everyone in Japan reads.

**LINE**
- Sent and received bubbles in **two clearly different colours**, with the **avatar on received
  messages only**.
- **"既読" (Read)** in small text beside your sent bubble, and timestamps beside the bubbles.
- **Big stickers without a bubble** are central to the culture.

**Pokémon TMs**
- Drawn as **discs coloured by move type**; Scarlet/Violet crafts them as physical discs.

**Vinyl**
- 33⅓ rpm is 1.8 s per revolution, and 45 rpm is 1.33 s.
- **Visual trick:** the groove **highlight stays still while the label rotates**.

**Radar charts**
- **Pokémon Contests** use a **pentagon** for five conditions (Cool, Beauty, Cute, Smart/Clever,
  Tough).
- **FIFA/FC cards** use **6 attributes**, read as a hexagon.
- **Lesson:** a 5-axis pentagon is instantly readable, and Tokonmon has exactly 5 stats.

**Constellation trees**
- **Skyrim** draws perks as **stars in constellations** that light up.
- **FFX's Sphere Grid** shows a path of nodes.
- **Lesson:** "marks" on the radar axes can be **stars** that join into a constellation, which also
  honours v1's "Astral" tree (bible §7).

**Naming**
- Pokémon's naming screen shows the creature's icon beside the name field.
- Nicknames are capped at 10–12 characters.
- Japanese phones use **12-key flick input**.

### 6(c) Design direction for Tokonmon

#### 6.1 The device and how it appears *(proposal)*

**Sizes** (reference buffer 640×360 px; scale proportionally if the internal resolution differs):

| Part | Size |
|---|---|
| Phone body | **168×296 px**, with a 6-px rounded bezel |
| Screen | **144×256 px** (9:16) |
| Status bar | 10 px |
| App area | 144×232 px |

**Opening:**
- **In the world:** the player sprite **pulls out the phone (2 poses)** in sync with the overlay.
- **On screen:** the overlay **slides up from the bottom-right over 6 poses** with ease-out and a 1-px
  overshoot, ending 16 px from the right edge.
- **Close:** 4 poses down.
- **The world stays visible** on the left. Outside battle, the day clock pauses while the phone is
  open *(proposal)*.

**OS look ("Tokon OS")** *(proposal)*:

| Role | Hex |
|---|---|
| Base | `#0F1220` |
| Panel | `#1B2140` |
| Accent cyan | `#3FF2FF` |
| Accent magenta | `#FF4FD8` |
| Gold | `#FFD23F` |
| Text | `#F2F4FF` |
| Dim text | `#8A93B8` |
| OK | `#6BFF8A` |
| Danger | `#FF4A5A` |

- **Ornament:** soul-stone glyph lines, 1 px, like the Sheikah Slate's consistency rule.
- **Transitions:** screens enter with a **6° skew for 2 poses, then settle** (Persona 5 energy, but with
  Tokonmon's own palette).

**Fonts:**
- **Latin:** a 5×7 / 6×8 pixel font.
- **Japanese:** **k8x12** or **PixelMplus10/12**, at 1× only.
- **Dense lists:** the **Misaki 8×8** font for tiny labels.

**Notifications:**
- **Phone closed:** the in-world phone sprite **buzzes**. The player sprite vibrates ±1 px for 3 poses,
  a tiny LED blinks in the **sender's colour**, and a 9×9 "!" pops.
- **Phone open:** a toast slides from the top of the screen over 3 poses.
- **No floating HUD toasts.**

**Personality** (the Rotom lesson, kept light):
- A 2-frame **soul-stone "eye"** in the status bar blinks and reacts: ♪ on a beat, ! on a notification,
  zz during auto-training.

#### 6.2 Home screen (the 9 apps of bible §8: a 3×3 grid, the NookPhone lesson)

```
┌────────── 144 × 256 ──────────┐
│ 08:12  DAY 3 ☀  ◉(soul-eye) ▮▮▮│  ← status bar 10px (time-of-day, day count, stone)
│                                │
│        [ wallpaper ]           │  ← user wallpaper (bible: decorate)
│  ┌────┐   ┌────┐   ┌────┐      │
│  │ ID │   │SCAN│   │TEAM│      │  License · Scan · Team
│  └────┘   └────┘   └────┘      │
│  ┌────┐   ┌────┐   ┌────┐      │
│  │ MAP│   │QUES│   │ MSG│      │  Map/Travel · Quests · Contacts & Messages
│  └────┘   └────┘   └────┘      │
│  ┌────┐   ┌────┐   ┌────┐      │
│  │ BAG│   │DISC│   │ SYS│      │  Bag · Discs · Save/Settings
│  └────┘   └────┘   └────┘      │
│           ⟲ flip = DECORATE     │  ← flip the phone to reach the case side
└────────────────────────────────┘
```

**Icons:**
- **32×32 px**, each with a **2-frame idle**: the Scan reticle blinks, the Disc spins, the MSG bubble
  bobs when there are unread messages.
- **Badges:** a 5×5 magenta dot with a count.
- **Tap:** the icon squashes for 1 pose (0.9×) and **zooms into the app** over 4 poses.

#### 6.3 Battle controller (bible §8: "In battle, the phone is the command controller")

The phone **docks** at the bottom-right, tilted 6°. Only the top ~150 px of its body is visible, so the
arena stays clear.

**6.3.1 Auto mode (orders with delay):**
```
  bench:  (◐ Tok2 07s)  (● Tok3 READY)           ← tap = switch (7 s); ring = 15 s cooldown
┌──────────────────────────────────────────┐
│  [DODGE]    [PARRY]    [CHARGE]           │  ← orders (ack icons in world, §1.1)
│  (S1)◔  (S2)●  (S3)◑  (S4)●               │  ← 4 skill discs, cooldown rings (Z-A lesson)
│  [ ATTACK  (hold+drag = aim) ]  [☺] [◆]   │  ← emote radial · BOND (soul stone, glows when ready)
└──────────────────────────────────────────┘
```
- **Movement:** tap the **world** to move; the phone isn't involved.
- **Aimed skills:** drag from a skill disc into the world, and an aim line appears **in the world**
  (§3.4).
- **Cooldowns:** each disc's ring fills clockwise in its element colour. When ready, it plays a "tick"
  and a 1-pose shine.
- **Bond button:** the soul stone is dim until bonding is available, then **pulses on the beat**.

**6.3.2 Bonded mode (direct control):**
- The phone border glows in the element colour and pulses on beats.
- **Left thumb:** a **floating stick** wherever the thumb lands (a 24-px ring that is drawn in the world
  layer, not the phone).
- **Right side of the phone:** 4 skill discs plus the **ULTIMATE** button (40 px, gold rim, showing
  the *renamed* ultimate name). A small "unbond" toggle.
- **Bond-time ring:** around the soul stone, one segment per 10 s (§1.2).

#### 6.4 Scan app: AR scanner *(proposal)*

**Raise:**
- The player sprite **holds the phone up** for 2 poses.
- The world gets a **scan tint** (TWEWY / Metroid): 50% desaturation, 1-px cyan scanlines every 4 px
  drifting down 1 px per pose, and **scannable things outlined** in 1 px.

**Outline colour code** (the Prime lesson):

| Outline | Meaning |
|---|---|
| **Cyan** | new |
| **White** | known |
| **Gold** | rare / legendary |
| **Magenta** | a lore object (murals, Dr. Hoshino's star fragments, bible §3) |

**Screen** (the camera view, with a 1-px RGB channel offset at the edges):
```
┌──────────────────────────────┐
│ SCAN  ▸ AUTO-FOCUS           │
│  ┌─         ─┐                │  ← 4 corner brackets (5×5 L-shapes) snap to target
│                 ▒▒ data ▒▒   │  ← scrolling glyph column (soul-stone glyphs)
│      (Tokonmon in view)      │
│  └─         ─┘                │
│  [■■■■■■□□□□] 62%            │  ← hold-to-scan progress (Prime lesson)
│  HOLD ◉ TO SCAN              │
└──────────────────────────────┘
```

**Hold to scan (1.2 s):**
1. The brackets close in **3 steps**.
2. A **scan line sweeps the target top → bottom twice** (0.5 s each), leaving a **voxel-grid
   wireframe** (cyan 1 px), a nod to the creatures being voxel models.
3. **Complete:** a chirp, the target flashes white for 1 tick, and a **card pops** (4 poses):
   - the 2D sprite (§5.1)
   - name and element badges
   - a mini radar
   - "OPEN TREE →"

**Unknown creatures:** a silhouette with "???" and the element badge only.

**Registration:** scanning registers the creature in the dex archive tab.

**Lore:** the phone's lore entries (gods of light) live in the same app's **ARCHIVE** tab.

#### 6.5 License app (ID card)

```
FRONT                                         BACK
┌────────────────────────────────────┐        ┌────────────────────────────────────┐
│ 大阪 TOKONMON LICENSE   ◆ soul stone │        │ LEAGUE RANK  [emblem]  B-12        │
│ ┌──────┐ NAME  ________________    │        │ SEEN 041   CAUGHT 017   PLAY 12:40 │
│ │photo │ ID    OSK-2050-000123     │        │ BADGES  ◇◇◆◆◆◇◇◇                   │
│ │pixel │ CLASS ★★☆  BRACELET ◉      │        │ BONDS   Mika 4 · Kaito 2 · Taro 3… │
│ └──────┘ ▓▓▓▓▓ (rank band) ▓▓▓▓▓   │        │ ▚▞▚▞ (decorative pixel code) ▚▞▚▞  │
└────────────────────────────────────┘        └────────────────────────────────────┘
```
- **Card size:** 136×86 px (the ID-1 card ratio, 1.586).
- **Photo:** the customisable player's portrait. It updates with their look.
- **Rank band**, after the Japanese licence code: **green `#3FBF6A`** for a rookie, **blue `#3D7BFF`**
  for a ranked player, **gold `#FFD23F`** for an elite or champion. A band upgrade plays a
  stamp-and-shine animation.
- **Hologram foil:** a diagonal **rainbow sheen** sweeps across every 4 s (a 3-px band cycling the
  bubble-film colours).
- **Flip:** tap to flip. The card's width scales 1 → 0.5 → 0 → 0.5 → 1 over 4 poses.
- **Soul stone and bracelet cosmetics** (bible §8: watches, earrings, badges, hair clips, grillz)
  show on the front's stone slot. Tapping it opens the cosmetics drawer.
- **In the world:** showing the license (League registration with Ms. Aoi, capture checks) is the
  player sprite **holding the phone out** for 2 poses, with the card visible on the in-world sprite.

#### 6.6 Contacts & Messages (Persona confidants × a LINE-style chat)

```
CONTACTS                               CHAT (Mika)
┌──────────────────────────┐           ┌──────────────────────────────┐
│ ◉ Mika        ◔ 4  ●new  │           │ ◀ Mika         ◔ Bond 4      │
│ ◉ Kaito       ◑ 2        │           │ (◉) [ Ice cream after? 🍦 ]   │ ← received: avatar + light bubble
│ ◉ Taro        ◕ 3        │           │          [ Sure! ] 既読 17:02 │ ← sent: accent bubble, read mark
│ ◉ Lumi★       ○ 1        │           │ (◉)  [STICKER: Zapanda ♪]     │ ← big sticker, no bubble
│ ◉ Dr. Hoshino ◔ 2        │           │ ┌ HANGOUT ───────────────┐   │
│ ◌ ???  (Moshi, locked)   │           │ │ Dotonbori · 18:00 · map│   │ ← invite card → choice bubbles
└──────────────────────────┘           └──────────────────────────────┘
```
- **Avatars:** 24×24 pixel portraits in round frames (the same art as the dialogue portraits, see
  `docs/refs/characters.md`).
- **Bond rank:** a **10-segment ring** around the avatar plus a number. *(The number of ranks is not
  fixed by the bible; 10 follows Persona.)*
- **Bubble colours:**
  - **received:** `#F2F4FF` with text `#1B2140`
  - **sent:** accent `#7DF2C9` (mint), with text `#0F1220`
  - It is **not** LINE's green: same grammar, our colour.
  - "既読" and the time are in dim 5-px text.
- **Arrival:** messages arrive with a **typing indicator** (3 dots bouncing 1 px in sequence, about
  1 s), then the bubble pops in over 2 poses.
- **Hangout invites and friend quests** come as **cards** inside the chat with a map pin, and are
  answered with **choice bubbles** (§7.3).
- **Rank up:**
  1. A full-phone **card-flip**: the friend's portrait card spins in.
  2. "BOND RANK 5" stamps on the beat.
  3. A chime, plus sparkles in the friend's colour.
- **Motif:** a thin **red-string** line can link the avatar to the player's icon on the rank-up card
  (§5.5).

#### 6.7 Skill tree: radar chart / constellation (bible §7)

```
                 DAMAGE
                   ★  ← mark (passive) — lit
                  /|\
        HEALTH ★ / | \ ☆ ELEMENT       ☆ = mark not reached (dim outline)
                \  ●  /                 ● = current stat polygon (element dither 50%)
                 \ | /
        SPEED   ☆─┴─★  DEFENSE
   ┌────────────────────────────────────┐
   │ (S1)(S2)(S3)(S4)  ⦿ULT   ⬡P1 ⬡P2   │ ← 4 active discs · 1 ultimate (gold rim) · 2 passives
   │  ▪▪▫  ▪▫▫  ...  ← skill level pips (level up by use)
   └────────────────────────────────────┘
```

**Axes:** a pentagon, clockwise from the top, in the bible's order: **Damage, Element, Defense, Speed,
Health**.

**Chart look:**
- **Polygon:** filled with the creature's main element colour at a 50% Bayer dither, with a 1-px
  outline in its light step.
- **Spokes:** 1-px axis spokes in `#3A4166`.
- **Background:** a **night sky** with that element's constellation (v1 "Astral").
- **Motion:** the whole chart **breathes 1 px on beats**.

**Marks** (bible: "when a stat reaches a certain mark you gain a passive") are **stars** on the axes:

| State | Look |
|---|---|
| unreached | a 5×5 dim outline |
| reached | the star **ignites** (a 4-frame sparkle), a **constellation line draws** to the nearest lit star (4 frames), and a passive card pops |

**Level-up:** the polygon **grows with a spring** (overshoot by 1 px, settle over 3 frames), and the
grown vertex sparkles.

**Slot row** (v1 slots kept):
- **4 active-skill discs:** 24 px, element-coloured labels.
- **1 ultimate:** 32 px, gold rim.
- **2 passives:** hexagons.
- **Locked slots** show a padlock until progression unlocks them.
- **Skill level pips** sit under each disc.
- **Swapping** (bible §7: swap passives and abilities on your phone): drag between slots, and the disc
  "clicks" in for 1 pose.

#### 6.8 Discs app (vinyl collection + record player) (bible §7)

**Crate view:**
- Discs are **sleeves standing in a crate**. Swipe to **flick through**: each sleeve tilts over 3
  poses.
- **Spines** show the element colour and the skill name.
- **Sleeve art** is original "album-cover parody" pixel art per skill (64×64). **Never** reproduce a
  real cover (bible §1, §10).

**Record player view:**
```
┌──────────────────────────────┐
│  ◖ sleeve ◗   ┌───────────┐  │
│               │  ◎ vinyl  │╲ │ ← tonearm (4-pose swing, 1-pose needle drop + crackle)
│  [TEACH ▸]    │  (label)  │ ╲│
│  (Tokonmon    └───────────┘  │
│   bobbing ♪)   ▸ progress = tonearm travel                     │
└──────────────────────────────┘
```

**Disc look:**
- **Vinyl:** `#15121C`, with groove rings `#2A2633`.
- **Fixed sheen:** two 1-px `#6E6A80` arcs that **do not rotate**.
- **Label:** in the element colour, and it **rotates in 45° steps, one step per 2 poses** (= 1.33 s
  per revolution = 45 rpm).

**Teach flow:**
1. Pick a Tokonmon.
2. The sleeve slides out, and the disc lands on the platter (3 poses).
3. The tonearm swings over (4 poses), and the needle drops with a crackle.
4. The skill's own musical sting plays.
5. The Tokonmon **bobs to the beat** with notes rising.
6. **Progress** is the tonearm creeping inward over 2 bars.
7. A "LEARNED!" stamp lands on the downbeat.

**Shop:** buying discs happens in in-world record shops (bible: you can buy them). The app only manages
the collection.

#### 6.9 Rename (skills & ultimates, bible §7)

- **Open:** tap a skill or ultimate name in the tree.
- **Preview:** the sheet shows a **live preview of the name inside its cut-in band** (§1.3), so the
  player sees exactly how the ultimate will be announced.
- **Input:** a 12-key **flick keyboard** (kana) or QWERTY (Latin). *(proposal)* The limit is 12
  characters, with a profanity filter.
- **Confirm:** the name "stamps" into the band with a ドンッ, plus a 1-tick shake.
- **Reset:** "Reset to default" is always available.

#### 6.10 Other apps (short specs) *(proposal)*

**TEAM**
- Creature cards (2D icon, element badges, HP, level, mini radar) in the active slots plus the bench.
- **Drag to reorder.**
- Tapping a card opens its skill tree.
- The full roster lives at the dojo (§8).

**MAP / TRAVEL**
- A stylised pixel map of Chuo, Namba, Umeda, Shinsekai and Minoh with pins.
- **Locked areas** are drawn as **static noise** that clears with a scan-line wipe when they unlock
  (bible §9: the map unlocks progressively).
- **Travel:** tap a pin → confirm → the phone shows a short maglev-ticket animation (6 poses).

**QUESTS**
- A list with a giver avatar on each row.
- **Deadlines:** "2 DAYS" chips (day-based time system, bible §2) that turn red on the last day.
- **Pinned:** one pinned quest shows its next step in the status bar.

**BAG**
- A 16×16 icon grid in category tabs, and a description panel.
- **Food** items show a tiny steam animation.

**SYS (Save/Settings)**
- **Save:** a "sync" animation (soul-stone glyphs orbit, 1 s).
- **Settings:** text speed, shake %, reduce flashes, beat helper, audio levels.

#### 6.11 Decorate (flip the phone) *(proposal)*

**Flip:** a 2D squash-flip over 4 poses shows the **back of the case**.

**Layers** (the decoden lesson):
1. **Case base:** a silhouette variant plus a material (matte, clear-glitter, metallic, wood, fur…).
2. **Frame:** whipped cream, with scalloped `#FFF8F0` / `#F2DCC8` shading.
3. **Cabochons:** strawberries, hearts, stars, crowns, guitars, mini Tokonmon. Each is 6–10 px with a
   1-px highlight.
4. **Rhinestones:** 1-px white **twinkles** on a random 2–6 s cadence.
5. **Stickers:** placed freely on the case back and on the screen bezel. **90°-step rotation only**,
   because free rotation breaks the pixels.
6. **Charms and straps:** hang from the top strap hole as a **2–3 segment pendulum**. They swing over 3
   poses whenever the phone opens or closes, and while the player walks.

**Wallpaper:** chosen here; it shows behind the home grid.

**Consistency:** the **in-world player sprite's phone** shows the case colour and the main charm as
2–3 px details.

### 6(d) Do / Don't

**Do**
- Keep one graphic language: Tokon OS colours plus soul-stone glyphs.
- Use big friendly icons and a 3×3 grid.
- Use hold-to-scan with visible progress.
- Make every timer and cooldown a ring on the thing it belongs to.
- Show the player physically handling the phone.
- Keep pixel text at 1×.

**Don't**
- Don't add menus outside the phone (except in-world signs, bubbles and the jumbotron).
- Don't mix pixel scales on the phone.
- Don't use free-rotation stickers.
- Don't reuse Persona's red/black palette, LINE's green or Rotom's face.
- Don't reproduce real album covers on the disc sleeves.
- Don't put tiny text below 8 px in Japanese.
