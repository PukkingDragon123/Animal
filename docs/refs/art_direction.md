# Tokonmon: Art Direction & Rendering Reference Study

**Who reads this:** every artist (sprites, portraits, textures, Tokonmon models, VFX) and the engine programmer, **before** making anything.
**What it is:** the study notes for TOKONMON.md §1 (Art direction). For each topic: (a) references found, (b) facts pulled from them, (c) exactly what we do, plus Do and Don't lists. It ends with a one-page **Style Guide** and an **engine checklist**.

**Golden rule (from the design bible):** study references, then **transform** them into original designs. Never trace, never edit ripped sprites, never reproduce a recognisable character, logo, sign or composition.

---

## 0. Research status & source legend (read this first)

- 31 web searches ran in this session (HD-2D, Octopath/Triangle Strategy/Live A Live/DQ3 HD-2D, t3ssel8r-style 3D pixel art, Guilty Gear Xrd, A Short Hike, Pokémon BW/BDSP/SwSh, Paper Mario, Sea of Stars, Eastward, CrossCode).
- The shared web-search budget for this turn (200 calls across all agents) **ran out before topics 3–8 could be searched**. Those sections are built from well-known references I already knew, plus engineering and art reasoning. Their numbers are **our recommendations**, not quotes. Their URLs are canonical but were **not re-checked here**; check them before quoting. Appendix A lists the follow-up searches to run when budget is available.
- Image downloads and page fetches are blocked in this environment, so every reference was studied through search-result text (interviews, breakdowns, forum and tutorial summaries).

| Tag | Meaning |
|---|---|
| **[S]** | Fact surfaced by a web search in this session (source URL listed in that topic). |
| **[S-weak]** | Found by search, but the source is a forum post, anecdote, or a low-reliability aggregator. Use it as a hint only. |
| **[K]** | Established reference from prior knowledge, not re-checked this session. |
| **[D]** | **Direction**: our decision or rule for Tokonmon. These are binding unless the owner changes them. |

**Repo context the rules below build on:**
- The engine is three.js r169 (WebGL2), mobile-first.
- `src/gfx/pixel.js` (`PixelPost`) already does: a low-res HDR render, a bloom chain, a pixel pass (DOF and tilt band, 1-px depth outlines with hue-shifted darkening, ACES grading, ordered-dither quantisation), and a sharp-bilinear present with sub-pixel camera offset.
- `src/gfx/renderer.js` quality presets: `pixelH` is 360 (high), 320 (medium) and 270 (low). The default camera uses FOV 30°, distance 19 and pitch 0.72 rad, which shows about 10.2 m of vertical view.
- `src/gfx/materials.js` uses `MeshToonMaterial` with a nearest-filtered cel ramp plus a hard fresnel rim.
- This document sets **targets** for that pipeline; it does not replace it.

---

## 1. HD-2D (Octopath Traveler 1/2, Triangle Strategy, Live A Live, Dragon Quest III HD-2D)

### 1a. References

| # | Source | URL |
|---|---|---|
| 1 | Wikipedia: HD-2D | https://en.wikipedia.org/wiki/HD-2D |
| 2 | Unreal Engine spotlight: Octopath Traveler's HD-2D art style (2019) | https://www.unrealengine.com/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true |
| 3 | Unreal Engine developer interview: Octopath Traveler II | https://www.unrealengine.com/en-us/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style |
| 4 | Siliconera: Project Octopath devs on troubles developing HD-2D (Famitsu translation) | https://www.siliconera.com/project-octopath-traveler-developers-answer-project-started-troubles-developing-hd-2d/ |
| 5 | Nintendo Everything: Octopath devs on visual style | https://nintendoeverything.com/octopath-traveler-devs-on-character-origins-visual-style-initial-hd-rumble-plans-much-more/ |
| 6 | TechRaptor: HD-2D trademark (diorama/tilt-shift blur) | https://techraptor.net/gaming/news/trademark-for-octopath-travelers-hd-2d-filed-by-square-enix |
| 7 | HandWiki: HD-2D (point lights, post, particles) | https://handwiki.org/wiki/HD-2D |
| 8 | Nintendo Life: Triangle Strategy producers on HD-2D | https://www.nintendolife.com/news/2022/05/triangle-strategy-producers-talk-hd-2d-and-why-other-devs-havent-used-it |
| 9 | Nintendo Everything (4Gamer translation): HD-2D "costs more than you'd think" | https://nintendoeverything.com/triangle-strategy-producers-say-hd-2d-costs-more-than-youd-think-internal-teams-shared-knowledge-to-help-with-its-implementation/ |
| 10 | GoNintendo: recreating an accurate HD-2D style | https://gonintendo.com/contents/4132-triangle-strategy-producer-talks-about-recreating-an-accurate-hd-2d-style |
| 11 | Inverse: Triangle Strategy interview | https://www.inverse.com/gaming/triangle-strategy-interview-hd-2d |
| 12 | Foro3D: Triangle Strategy and HD-2D in UE4 [S-weak] | https://foro3d.com/en/2026/mayo/triangle-strategy-y-el-arte-hd-2d-con-unreal-engine-4.html |
| 13 | Prima: Live A Live remake differences | https://primagames.com/tips/live-a-live-remake-all-differences-from-the-original |
| 14 | NME: Live A Live is HD-2D thanks to Octopath | https://www.nme.com/news/live-a-live-remake-is-hd-2d-thanks-to-the-success-of-octopath-traveler-3202619 |
| 15 | Finger Guns: Live A Live review | https://fingerguns.net/games/2023/05/08/live-a-live-review-ps5-alive-and-kicking/ |
| 16 | Inverse: Dragon Quest III HD-2D | https://inverse.com/gaming/dragon-quest-3-remake-hd-2d-nintendo-release-square-enix |
| 17 | Nintendo Wire: DQ3 HD-2D hands-on preview | https://nintendowire.com/?p=198568 |
| 18 | DEV: Creating an HD-2D rendering pipeline on DX12 | https://dev.to/gaurav_de/creating-an-hd-2d-rendering-pipeline-on-dx12-205k |
| 19 | SIGGRAPH 2014 poster: 2D additive and dynamic shadows for HD sprites | https://history.siggraph.org/wp-content/uploads/2022/12/2014-Poster-01-Serera_2D-Additive-and-Dynamic-Shadows.pdf |
| 20 | Unreal forum: DOF on sprites (all-or-none problem) | https://forums.unrealengine.com/t/dof-or-blur-sprites/428166 |
| 21 | Unity discussion: billboard shadow-caster problem | https://discussions.unity.com/t/need-help-with-matrix-algebra-in-2d-billboard-shader/856626 |
| 22 | ORK forum: pointer to "Perfecting Unity's Billboard Shader for HD2D" | https://forum.orkframework.com/discussion/8539/spiral-fantasy |
| 23 | itch.io: 2D depth-of-field shaders (z-distance blur + edge radial blur) | https://tlsaxt.itch.io/2d-depth-of-field-shaders |

### 1b. Study notes

**What HD-2D is**
- **[S] Definition:** retro SNES-style character sprites and textures, combined with polygonal environments and high-definition effects (Live A Live, Wikipedia). Octopath's director called it reproducing older pixel graphics "in a rich way with current technology" (#4).
- **[S] Why 3D at all:** environments were made 3D to give depth, and lighting was added to show how light interacts with pixel scenes. Built in Unreal Engine 4 (#1).

**Two lessons from Octopath's prototyping (#4)**
- **[S] Detail:** sprites looked "lonely and simple" on a big screen, so the team **raised the density of tile variations and colours**.
- **[S] Restraint:** one prototype lacked depth and was dull. Another pushed **resolution and saturation so far it lost the appeal of pixel art**. HD-2D lives in the narrow band between the two.

**Lighting, shadows and camera**
- **[S] Effects light the actors:** early combat effects looked flat until a **point light was attached to each effect**, so characters cast shadows onto the environment (#2). Point lights let sprite characters cast shadows; post-processing and particles finish the look (#7).
- **[S] Diorama blur:** the out-of-focus blur gives "almost every scene a diorama/tilt-shift aesthetic" (#6). The style rests on dynamic lighting + depth of field + tilt-shift (#1, #6).
- **[S] Big camera moves:** Octopath II made heavier use of 3D camera work, rotating nearly **90° in some battle effects and 180° in some events** (#3).
- **[S] Free camera:** Triangle Strategy lets the player swing the camera in battles, so the art had to hold up from many angles. The hard problem was balancing camera freedom against the visuals (#8, #10).

**Character proportions**
- **[S] Deformation level:** realistic lighting falls on "deformed" (chibi) characters, which reads as a diorama. The producer said the team had to find **the right level of character deformation so the pixel characters still work as pixel art** (#9).
- **[S] Cost:** the style "costs more than you'd think", and the team relied on people who already knew the technique (#9).

**Atmosphere**
- **[S] DQ3 HD-2D:** previews praise ambient life rather than the sprites themselves: **wind moving grass tufts and trees, and dust particles drifting in dungeons** (#17).
- **[S] Live A Live:** a full 3D remake would have changed the look too much, so HD-2D kept the pixel identity while adding 3D effects (#13, #14).

**Technical notes (from the dev blog and forums)**
- **[S] Forward vs deferred:** with deferred rendering (UE4's default), transparency is hard, so sprites often need **extra forward passes**. Indie HD-2D-likes such as Sea of Stars tend to use Forward+ (#18).
- **[S] Sprite volume:** sprites have no thickness, which makes grounded shadows and lighting hard. One fix is **sprite normal mapping** (#18). A SIGGRAPH poster derives sprite self-shadowing from a "volumetric map" and projects shadows between sprites with a "shape map" (#19).
- **[S] DOF and translucency:** in UE4 (2018), blur could only apply to *all* sprites or *none*, because translucent sprites don't feed depth-based DOF (#20). **Lesson:** sprites must be **alpha-tested (cutout) and write depth**, so DOF and outlines see them.
- **[S] Billboard shadows:** a billboard rotates to face the *light* during the shadow pass, so it self-shadows like two crossed quads. A custom shadow-caster that faces the main camera, or a separate shadow proxy, is needed (#21).
- **[S-weak] Camera FOV:** Triangle Strategy sprites were made in Aseprite and composited over UE4 environments with a soft background DOF. A low FOV (~35°) is suggested for the isometric feel (#12).

**Well-known observations about the look [K]**
- **Colour grade:** Octopath grades warm, slightly golden highlights against cool, desaturated shadows, with a heavy vignette and strong bloom on light sources.
- **Water:** real 3D planes with reflections and pixel ripple textures.
- **Sprite size:** characters are small next to the world, roughly SNES scale.
- **Reception:** many players found Octopath 1's blur and vignette too strong. The sequels and DQ3 HD-2D are generally seen as brighter and more restrained.

### 1c. Direction for Tokonmon [D]

Our version: **pixel-render everything** (t3ssel8r-style, §2), then add **HD-2D atmosphere** on top (bloom, DOF, tilt band, light shafts, particles, vignette). Octopath renders 3D geometry at native resolution with pixel textures; we render *the whole frame* at art-pixel resolution, because the bible says everything must read as 2D pixel art. Only the soft post effects (bloom halo, vignette, flashes) are applied at display resolution. That's the "HD" layer.

**1. World pixel density (the "32 rule")**
- **1 m = 32 art pixels at the focal lane** (where the player walks) at the default zoom.
- **1 tile = 1 m = 32×32 texels.** **1 building floor = 3 m = 96 px.**
- At pixelH 320, the screen shows **10 m** of vertical world. The current camera (FOV 30°, distance 19, about 10.2 m visible) already matches.

**2. Sprite and world density must match**
- Every pixel-art texture, sprite and billboard card is authored so that **1 texel = 1 art pixel at the depth where it lives**.
- No "mixels": no mixing of pixel sizes on screen.

**3. Character deformation**
- Humans are chibi, **≈3 heads tall**: head ≈ 1/3 of height (bible).
- Adults are **48–54 px** tall, kids **38–42 px**, big characters (Coach Gonda) up to **60 px**.

**4. Sprites in 3D**
- Humans are camera-facing **Y-axis (cylindrical) billboards**.
- **Alpha-test cutout, depth write on, no alpha blending** (so DOF and outlines work, per lesson #20).
- When the camera rotates around a sprite (battle, cinematics), the billboard picks one of **4 facing frame sets** from the camera-relative angle, the way Paper Mario does (§2).

**5. Sprite lighting**
- Sprites keep their hand-painted shading. The engine only **tints** them (light colour × intensity, quantised to 3 steps).
- The engine adds a **1-px rim** on the silhouette side facing a strong light (neon, fire, sunset).
- Optional later: auto-generated normal maps (§2 references) for Tokonmon 2D sprites in big scenes.

**6. Sprite shadows (three layers)**
- **(a) Contact blob, always on:** a pixel-art ellipse (human 20×6 px, small Tokonmon 12×4 px) at 40% opacity in the scene's shadow-tint colour.
- **(b) Cast shadow from the key light:** use a shadow proxy (the sprite's silhouette on a quad that faces the light, or a camera-facing caster pass) to avoid the self-shadow bug (#21).
- **(c) Receiving:** sprites receive shadows from awnings, trees and so on.

**7. Effects are lights**
- Every big VFX (fireball, bonding beam, neon sign, takoyaki grill) spawns a **coloured point light**, range 3–6 m, so actors cast moving shadows (lesson #2).
- The light's intensity animates in **stepped 12 fps** to match the VFX flipbook.

**8. Depth of field and tilt-shift**
- **Focus:** the focal plane sits on the player's lane, with a sharp zone of **±2 m** around it.
- **Blur ramp:** blur ramps up to its maximum by **±10 m**.
- **Blur limits:**
  - midground: max **3 art px**
  - far backdrop: **5–6 px**
  - near foreground occluders: **4–6 px**
- **Tilt band:** top **18%** and bottom **10%** of the screen add blur in wide or establishing shots only. Keep it off during gameplay close-ups.

**9. Camera FOV and pitch:** see §4 for the full table. In short: street strips use vertical FOV **24°** (allowed 20–30°) with a **12–18°** downward pitch. The narrow FOV keeps sprite scale within about ±13% across the ±3 m walk lanes.

**10. Atmosphere layer (always on)**
- **Ambient motion:** every scene has at least **2 ambient motion systems**: dust motes, drifting petals or leaves, swaying grass and laundry, steam, rain, fireflies, flickering neon.
- **Density over resolution:** every surface uses **3–5 tile variants plus decals** (cracks, puddles, stickers, leaves). That's the Octopath lesson: texture variety, not higher resolution.

**11. Colour grade:** per-scene lift, gain and saturation (§6). Keep saturation **1.05–1.15** (never above 1.2) and vignette **0.10–0.30**, lighter than Octopath 1.

**Do**
- Do treat every location as a hand-made diorama: a tabletop model with a visible base edge where the set ends (MAPS.md already cuts away the diorama edge).
- Do attach lights to effects, and let actors cast shadows.
- Do keep sprites crisp in the focal lane, and blur only what's off-lane.
- Do add ambient motion: dust, grass sway, steam.

**Don't**
- Don't render 2D sprites with alpha blending. They vanish from the depth buffer and DOF/outlines break.
- Don't push saturation or resolution "because it's HD". That was Octopath's own failed prototype.
- Don't blur the player, the active NPC, or any in-world text being read (speech bubbles, the sign the player is facing).
- Don't copy Octopath sprites, tiles, UI frames or compositions. Learn the *principles*: density, light on chibi, diorama blur.

---

## 2. 3D pixel art / "3D that looks 2D"

### 2a. References

| # | Source | URL |
|---|---|---|
| 1 | Fab: t3ssel8r-style 3D pixel art plugin listing (low-res + sharp upscale + snapping; silhouette and crease outline materials) | https://www.fab.com/listings/816f34f2-1a2e-4910-b3dd-009b5da0873b |
| 2 | Transcript: "Drawing the Line on 3D Pixel Art" (depth and normal outlines) | https://sozai.app/transcript/drawing-the-line-on-3d-pixel-art-pixel-perfect-transcript/index.md |
| 3 | arXiv 2603.14587: "Texel Splatting" (why camera snapping only works orthographically) | https://arxiv.org/abs/2603.14587 |
| 4 | 80.lv: Tips on convincing animations for 3D pixel art games (t3ssel8r) | https://80.lv/articles/tips-on-convincing-animations-for-3d-pixel-art-games |
| 5 | Cascadeur: making an animation for a 3D pixel art game (interview with t3ssel8r) | https://cascadeur.com/forum/news/1989-making-an-animation-for-a-3d-pixel-art-game-interview-with-t3ssel8r |
| 6 | GitHub: Dasfaust/PixelEngine (Unity, replicating t3ssel8r) | https://github.com/Dasfaust/PixelEngine |
| 7 | Unity Discussions: Recreating t3ssel8r's 3D pixel art | https://discussions.unity.com/t/recreating-t3ssel8rs-3d-pixel-art/928878 |
| 8 | GitHub: unity-isometric-pixel-pipeline (640×360, sharp upscale, pixel-perfect pan offset) | https://github.com/bababuyyy/unity-isometric-pixel-pipeline |
| 9 | YouTube: Making a Smooth Pixel Camera for 3D Pixel Art | https://www.youtube.com/watch?v=zi_-OssZh7U |
| 10 | GitHub: ekx/PixelCamera (low-res RT and upscale shaders) | https://github.com/ekx/PixelCamera |
| 11 | Godot Shaders: 3D pixel art outline & highlight (Leo Peltola) | https://godotshaders.com/shader/3d-pixel-art-outline-highlight-post-processing-shader/ |
| 12 | Godot Shaders: post-process outline (depth/normal) | https://godotshaders.com/shader/post-process-outline-depth-normal/ |
| 13 | Godot Shaders: Sobel outline post-process | https://godotshaders.com/shader/sobel-outline-shader/ |
| 14 | Nuzcraft: Godot shader project (Sobel depth, then normals) | https://nuzcraft.substack.com/p/godot-shader-project |
| 15 | three.js example: webgl_postprocessing_pixel (RenderPixelatedPass) | https://threejs.org/examples/webgl_postprocessing_pixel.html |
| 16 | Godot forum: subpixel snapping in a 3D pixel art game | https://godotforums.org/d/36180-subpixel-snapping-in-a-3d-pixel-art-game |
| 17 | Godot forum: smooth camera in a pixel-perfect game | https://forum.godotengine.org/t/smooth-camera-in-pixel-perfect-game/112586?page=2 |
| 18 | Unity: UPixelator (sub-pixel offset after snapping) | https://discussions.unity.com/t/released-upixelator-pixelate-your-scenes/909110 |
| 19 | GDC Vault: GuiltyGearXrd's Art Style: The X Factor Between 2D and 3D (Junya C. Motomura, GDC 2015) | https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The |
| 20 | Talk slides/transcript PDF (Arc System Works) | https://www.ggxrd.com/Motomura_Junya_GuiltyGearXrd.pdf |
| 21 | Arc System Works: GDC 2015 art talk post | https://www.arcsystemworks.com/guilty-gear-xrd-art-talk-at-game-developers-conference-2015/ |
| 22 | BlenderNation: Motomura behind the scenes of GG Xrd | https://www.blendernation.com/2015/07/26/junya-c-motomura-behind-the-scenes-of-guilty-gear-xrd/ |
| 23 | Unity Discussions: Guilty Gear Xrd shader test (community reverse-engineering) | https://discussions.unity.com/t/guilty-gear-xrd-shader-test/650399?page=2 |
| 24 | Polycount: GG Xrd shader in Unity | https://polycount.com/discussion/138014/guilty-gear-xrd-shader-in-unity |
| 25 | Amara transcript: "The Animation of Guilty Gear Xrd & Dragon Ball FighterZ" (Daniel Floyd) | https://amara.org/videos/bDmpkclvfB5I/info/the-animation-of-guilty-gear-xrd-dragon-ball-fighterz |
| 26 | Kill Screen: GG Xrd's limited frame rates | https://www.killscreen.com/good-lord-guilty-gear-xrd-pretty-and-impenetrable/ |
| 27 | PlayStation Blog: crafting A Short Hike | https://blog.playstation.com/2021/08/05/crafting-a-tiny-open-world-a-look-behind-the-scenes-at-the-creation-of-a-short-hike/ |
| 28 | Wikipedia: A Short Hike | https://en.wikipedia.org/wiki/A_Short_Hike |
| 29 | Substack: Recreating the 2.5D effect from Pokémon Black & White | https://mjakeman.substack.com/p/recreating-the-25d-effect-from-pokemon |
| 30 | Serebii: Pokémon Black & White | https://serebii.net/blackwhite/ |
| 31 | PokémonDB: Black & White | https://pokemondb.net/black-white |
| 32 | Vooks: BDSP preview (pseudo tilt-shift, sunbeams) | https://vooks.net/preview-pokemon-brilliant-diamond-and-shining-pearl |
| 33 | GameSpot: BDSP announced (chibi overworld vs realistic battle models) | https://gamespot.com/articles/pokemon-diamond-and-pearl-remakes-announced-for-switch/1100-6488144/ |
| 34 | Nintendo Life: BDSP review (chibi criticised up close) | https://www.nintendolife.com/reviews/nintendo-switch/pokemon-brilliant-diamond-and-shining-pearl |
| 35 | Dexerto: SwSh fresnel rim lighting observation [S-weak] | https://www.dexerto.com/pokemon/pokemon-sword-shield-recycle-textures-748841 |
| 36 | hexaquo: toon light shader with hard rim in Godot | https://hexaquo.at/pages/understanding-godot-light-shaders-and-light-calculations-by-implementing-a-toon-light-shader/ |
| 37 | Super Mario Broth: Paper Mario characters are 3D models made to look 2D | https://www.suppermariobroth.com/post/775484483311960064/main-blog-patreon-twitter-bluesky-small/amp |
| 38 | Nintenderos: Paper Mario rim light trick (offset shadow copy) [S-weak] | https://www.nintenderos.com/2026/05/el-primer-paper-mario-usa-este-simple-truco-para-la-iluminacion-y-las-sombras/ |
| 39 | GodIsAGeek: Sea of Stars hands-off preview (dynamic lighting, moving shadows) | https://godisageek.com/2022/03/sea-of-stars-seems-like-a-must-play-already-hands-off-preview/ |
| 40 | Sabotage press release (Radiant Lighting, day/night) | https://sabotagestudio.com/press-release/sea-of-stars-the-highly-anticipated-turn-based-rpg-from-sabotage-studio-primed-for-playstation-consoles-in-2023/ |
| 41 | Game Developer: Road to the IGF, Pixpil's Eastward | https://www.gamedeveloper.com/disciplines/road-to-the-igf-pixpil-s-i-eastward-i- |
| 42 | Nintendo: How the developers began (then remade) Eastward | https://www.nintendo.com/us/whatsnew/how-the-developers-began-making-then-remaking-eastward |
| 43 | GoNintendo: Eastward inspirations (Akira, Cowboy Bebop, EarthBound) | https://gonintendo.com/archives/331402-eastward-devs-say-akira-cowboy-bebop-and-earthbound-have-inspired-the-game-mention |
| 44 | Eurographics 2025: "Light the Sprite" (dynamic light maps for pixel sprites) | https://diglib.eg.org/handle/10.2312/egs20251032 |
| 45 | arXiv 2212.09692: Normal map generation techniques for pixel art | https://ar5iv.labs.arxiv.org/html/2212.09692 |
| 46 | UPC thesis: Developing 3D Pixel Art Rendering | https://upcommons.upc.edu/handle/2117/416925 |
| 47 | [K] Dead Cells: using a 3D pipeline for 2D animation (Thomas Vasseur, Game Developer, 2018) | https://www.gamedeveloper.com (search "Dead Cells 3D pipeline 2D animation") |
| 48 | [K] CrossCode (Radical Fish Games): 16-bit pixel art on a 3D-height engine | https://www.radicalfishgames.com |

### 2b. Study notes

**t3ssel8r-style 3D pixel art**

*Rendering*
- **[S] Pipeline:** render the 3D scene at **low resolution**, upscale with **sharp sampling**, and **snap** to remove pixel creep and jitter (#1).
- **[S] Two outline materials:** one for **silhouette lines**, one for **interior crease lines** (#1).
- **[S] Where outlines come from:**
  - **silhouettes** come from **depth discontinuities** between neighbouring pixels
  - **creases** come from **normal-buffer differences**, even at equal depth (a building's corner)
  - both are merged into one outline texture
  - depth and normal buffers sit on the **same low-res pixel grid**
  - **raw depth must be linearised** before one threshold works at all distances (#2)
- **[S] Known reference shader:** "outline & highlight" is the standard set: dark outlines on silhouettes, a **lighter highlight on convex edges**. Normal textures use nearest filtering. It is credited as inspired by the three.js pixel post-processing example (#11, #15).
- **[S] Depth-only edges are not enough:** they miss corners, and they flag floors and walls far from the camera as edges. Normals fix both (#14).

*Camera*
- **[S] Snapping is exact only in orthographic:** every pixel shifts by the same amount, so one snap fixes all of them. Under **perspective**, nearer geometry drifts more, so **no single snap holds every depth** (#3). Practical tools snap the camera, then apply the **leftover sub-pixel offset at upscale time** to hide the snapping shake (#18, #8).
- **[S] Hybrid:** snap the foreground and let the background move sub-pixel. "Pixel-perfect implies jitter; you can mitigate it but not eliminate it" (#16, #17).
- **[S] Typical internal resolution:** 640×360 with sharp interpolation and a pixel-perfect panning offset (#8). PixelEngine renders to a low-res RenderTexture and snaps the camera 1:1 to the pixel grid. Its perspective mode has no snapping yet (#6).

*Animation*
- **[S] Different from normal 3D animation:** t3ssel8r says convincing animation in this style is "a little different from typical 3D game animations" (#4).
- **[S] Workflow:** references → passes → preview in engine → tweak (#4). He animated in Cascadeur, with critique from a professional animator teammate. The final animation took about 90 minutes *after* days of failed attempts (#5).

**Guilty Gear Xrd (GDC 2015, Junya C. Motomura)**

*Philosophy*
- **[S] Rule:** "If you find something that looks 3D, you just have to find a way to avoid it" (#20, #22).
- **[S] Method:** custom cel shaders, plus 3D models built specifically *for* those shaders (#20). The team **shunned mathematical accuracy** to get consistent cel shading (#22).

*Shading (from community reverse-engineering, #23 and #24)*
- **[S] Vertex colour:** a vertex-colour channel **offsets the lighting threshold**, so artists can force areas darker or more likely to be shaded (painted occlusion).
- **[S] Shadow colour:** shadows are coloured by **multiplying the base texture with a tint / "SSS" texture**, which gives skin its reddish shadows.
- **[S] Packed control texture:** shadow-threshold map, specular intensity, specular size, and interior lines in alpha. One channel is thresholded at 50%.
- **[S] Outlines:** an **inverted-hull mesh**, with vertex colours darkening or thinning the line.
- **[S] Interior lines:** drawn **axis-aligned in UV space** (only horizontal and vertical texel edges), so they stay crisp. Keep all UV lines square to avoid AA artefacts.

*Animation*
- **[S] Limited frame rates:** character animation runs at deliberately limited rates to mimic TV anime, which historically ran at 12 or even 8 fps (#26).
- **[S] Poses as drawings:** each pose is treated as a hand-made still, not keyframes for the computer to interpolate (#25).
- **[S-weak] Hand-fixed frames:** key poses are held longer for readability, and the model is adjusted by hand on individual frames to remove "too perfect" 3D consistency.
- **[S-weak] Hitstop:** heavy use of hitstop (the game freezes for a few frames on hits).
- **[S] Camera:** the camera swoops for supers and replays, while the 2D gameplay plane is preserved (#26 and TV Tropes summary).
- **[K] Normals:** hand-edited vertex normals so shadow shapes look drawn (faces get simple, flattering shadow masses).
- **[K] Camera-specific posing:** poses are tuned for the camera (cheating proportions per shot).

**A Short Hike**
- **[S] Goal:** "a beautiful (and readable) 3D world using **as few pixels as possible**".
- **[S] Look:** **flat cohesive shading**, **no anti-aliasing**, and a **soft outline** for readability. The pixel size is player-adjustable (4 presets) (#27, #28).
- **[S] Origin:** the art style was the very first thing built.

**Pokémon Black & White (2.5D)**
- **[S] Flat-looking 3D:** maps were built in 3D on purpose, "though physically three-dimensional, they were built so they would not appear that way" (Ishihara, via #29).
- **[S] Per-area cameras:** camera angles change per area. Buildings show their 3D as you walk past. Bridges and cities are fully 3D. Most interiors keep the flat camera. **Overworld characters remain 2D sprites** (#29, #30, #31).
- **[K] Sprite sizes:** BW overworld sprites use 32×32 frames. Battle sprites are 96×96, fully animated.

**Pokémon BDSP / Sword & Shield**
- **[S] BDSP overworld:** chibi, toy-like overworld models, with **shadows, sunbeams and a subtle pseudo tilt-shift** that separates the focal point. Battles use realistic proportions (#32, #33).
- **[S] BDSP criticism:** chibi figures read as "emotionless" up close (#34). **Lesson: chibi needs expressive faces, emotes and portraits for close shots.**
- **[S-weak] SwSh rim:** Pokémon models show a fresnel-style rim light. A hard-stepped rim (step function) gives the cartoon version (#35, #36).

**Paper Mario**
- **[S] Flat-looking models:** characters are 3D models made to look 2D, with only **4 facing graphic sets** that suggest more directions (#37).
- **[S-weak] Rim trick:** some areas fake a rim light by offsetting a shadow copy of the sprite behind it (#38).

**Sea of Stars**
- **[S] Lighting:** "Radiant Lighting", dynamic light with a day/night cycle. Sprites' shadows move with the sun or moon (#39, #40).

**Eastward**
- **[S] Look:** retro pixel artwork plus a modern **3D lighting system**.
- **[S] Visual roots:** dense "urban decay" built from sketches resembling Kowloon Walled City. Influences: Macross, Akira, Cowboy Bebop, Ghibli, Mother (#41, #42, #43).

**Pixel-art normal maps**
- **[S] Research:** generating light and normal maps for pixel art is an active topic: compiled techniques (#45), deep-learning light maps (#44).

**Dead Cells and CrossCode [K]**
- **Dead Cells (#47):**
  - animates 3D models, then renders each frame to a small sprite **without anti-aliasing**, using toon shading
  - in-game lighting comes from normal maps rendered alongside
  - **Proof:** 3D-to-pixel pipelines can look hand-drawn when AA is off and the frame rate is limited.
- **CrossCode (#48):** pure 16-bit tiles on a multi-height engine. Proof that readable height comes from consistent cliff and wall shading plus shadows.

### 2c. Direction for Tokonmon [D]

**Tokonmon 3D models: the "looks 2D" recipe**

1. **One render resolution for everything.** The whole frame renders at **pixelH 270–360**; one art pixel equals one texel at 32 px/m on the focal lane. Models are never rendered at a finer resolution than the world.

2. **Cel shading: 2 hard bands + 1 optional deep band + highlights.**
   - **Lit band:** the base colour.
   - **Shadow band:** a *per-material* **hand-picked shadow colour**, one ramp step darker with the hue shifted toward violet/blue (§3). Never `base × grey`.
   - **Deep band (optional):** creases, under-chin, inside ears and mouth. Driven by a painted **threshold-bias** channel (GG Xrd vertex-colour trick) or by baked AO from `voxel.js`.
   - **Highlight:** at most 1–2 px specular "glint" shapes on glossy parts (eyes, wet skin, armour, bubbles), plus a **hard rim band** (1 px) on the back-lit side when the scene has a strong back or side light (dusk, neon, fire).
   - **Threshold:** hard (`step`), terminator at `N·L ≈ 0.05–0.1`, with **zero smoothing width**.

3. **Shape the shadows.** Shadow shapes on faces and bellies must read as *drawn*:
   - **hand-edit normals** (or use simplified proxy normals) so the face gets one clean shadow mass;
   - in the voxel pipeline, set `belly`/`top` paint regions and the AO bias so shadows land where an anime artist would put them.
   - Avoid "3D noise" in shadows: no speckled self-shadowing from small voxels (raise the shadow-bias, or exclude tiny parts from casting).

4. **Outlines: exactly 1 art px.** Silhouettes come from linear-depth discontinuities. The outline is drawn on the **nearer object's** pixels (already implemented). Outline colour follows **selout**: the object's own colour darkened and hue-shifted, never pure black (§3). Interior creases from normal discontinuities draw at **50% strength** or as a **light highlight** on convex creases (the t3ssel8r/Peltola look). Outlines fade beyond ~30 m and inside DOF blur (already implemented).

5. **Stepped animation.**
   - Tokonmon poses update at **12 fps** ("on twos"): each pose holds **5 game frames at 60 fps**.
   - **No interpolated in-betweens.** Every pose is authored as a drawing.
   - Root translation and camera stay at **60 fps** (smooth travel, stepped body), with the screen position snapped to the art-pixel grid.
   - Holds of 3–4 poses (8 or 6 fps) are allowed for anticipation and dramatic beats. See §7.

6. **No AA anywhere in the pixel buffer:** no MSAA, FXAA or TAA (msaa is already 0). Textures use `NearestFilter`.

7. **Camera snapping.**
   - **Free-roam and street strips:** translate the camera only **parallel to the image plane**; snap that translation to the art-pixel grid **measured at the focal lane depth**; pass the remainder as the sub-pixel `uOffset` to the present pass (already implemented). Under perspective, other depths creep slightly; DOF hides it (§1).
   - **No camera rotation while exploring.** Rotation only in battle and cinematic shots, where motion hides shimmer (Octopath II rotates 90–180° in effects and events, so we may too).

8. **2D proxies of every Tokonmon** (bible): the phone, dex, scan, team list and cut-ins use **hand-pixelled sprites** made from the same model. Render a turnaround at the target size as a *sketch base*, then **repaint by hand** (clean clusters, selout, expression). Never ship raw renders as 2D sprites.

**Sprites in 3D (Paper Mario / BW lessons)**

9. **Humans and directions.** Humans are 2D billboards with **4 directions** (front, back, left, right; mirror left/right only for symmetrical designs). When the camera orbits, pick the frame set from the camera-relative yaw: front 315–45°, right 45–135°, back 135–225°, left 225–315°.

10. **Per-area camera rigs.** Every stage set defines its camera (pitch, FOV, height, bounds), the way BW changed the camera per area. No single global camera.

11. **Chibi needs faces.** Overworld sprites carry big readable eyes (2×3 to 3×4 px with a 1-px catch-light). Close shots switch to **portraits or close-up drawings** (§5), never a magnified overworld sprite (the BDSP lesson).

**Do**
- Do model Tokonmon for the shader: simple big forms, clean planes where shadows should fall, and no tiny bumps that create shadow noise.
- Do test every model at its **real in-game pixel size** (overworld base forms are only 18–29 px tall at 32 px/m) **and** at battle and close-up framing.
- Do author poses as key drawings at 12 fps, with 1-frame smears for speed (§7).

**Don't**
- Don't use smooth gradients, PBR roughness looks, soft shadows, SSAO halos or specular sheen across large areas. All of these "look 3D".
- Don't rotate the exploration camera, or zoom it non-integrally while idle. Both cause pixel crawl.
- Don't interpolate between poses (no 60 fps easing on body parts). Secondary motion (tail sway, flames) is stepped too.
- Don't copy GG Xrd's characters, t3ssel8r's scenes, or any Pokémon sprite. We borrow the techniques only.

---

## 3. Anime pixel art style (shading, hue shift, selout, palettes, dithering, AA, readability)

### 3a. References
These are [K] canonical tutorials and references; the search budget ran out before they could be searched, so check the URLs.

| # | Source | URL |
|---|---|---|
| 1 | Slynyrd Pixelblog (Raymond Schlitter): colour palettes, hue-shifted ramps, sprite tutorials | https://www.slynyrd.com/blog |
| 2 | Saint11 (Pedro Medeiros, Celeste/TowerFall): pixel art and animation tutorial cards | https://saint11.org/blog/pixel-art-tutorials/ |
| 3 | Lospec pixel art tutorials index | https://lospec.com/pixel-art-tutorials |
| 4 | Derek Yu: Pixel Art Tutorial (outline, selout, AA, shading) | https://www.derekyu.com/makegames/pixelart.html |
| 5 | Pixel Logic (Michael Azzi), book: jaggies, banding, pillow shading, readability | (book, search "Pixel Logic Michael Azzi") |
| 6 | AdamCYounis (author of the Apollo palette): pixel art tutorials, palette construction | https://www.youtube.com/@AdamCYounis |
| 7 | Brandon James Greer: pixel art and shading tutorials | https://www.youtube.com/@BJGpixel |
| 8 | Pixel Joint forum: "So you want to be a pixel artist?" (Cure) | https://pixeljoint.com/forum/forum_posts.asp?TID=11299 |
| 9 | Pokémon Gen 4/5 sprites (Game Freak): reference for creature readability at 32–96 px. Study only | (study in-game) |
| 10 | Octopath / Live A Live HD-2D sprites: chibi proportion and limited-colour sprites under 3D light (§1) | (see §1) |

### 3b. Study notes [K]

**Shading**

*Anime cel structure*
- **Typical bands:** base + 1 shadow, often a 2nd darker "core" shadow, plus a highlight.
- **In pixel art:** this becomes **3–4 values per material + an outline value**.
- **Terminator shape:** hard terminator lines; shadow shapes are designed, not computed.

*Hue shifting*
- **Direction:** darker steps rotate hue **toward cool/violet** (≈240–280°); lighter steps rotate **toward warm/yellow** (≈50–60°).
- **Amount:** a common practice is **≈10–20° of hue shift per step**.
- **Saturation:** **peaks in the midtones**, drops at the darkest and lightest ends.
- **Value spacing:** **≈12–18%** between steps.
- **Result:** a "straight" ramp (same hue, darker only) looks muddy and 3D-rendered. A hue-shifted ramp looks painterly and anime.

**Outlines**
- **Selout (selective outlining):**
  - the outline takes a **darker shade of the colour it borders**, not one global black
  - the lit side's outline can be lightened, or even dropped
  - the outer silhouette stays darker than interior lines
- **Effect:** softer and more "anime-clean" than black outlines, while keeping readability.
- **Interior lines:** only where they explain form or expression (eyes, mouth, overlapping limbs, clothing edges).

**Anti-aliasing (AA)**
- **Manual only:** AA by hand, with 1 (at most 2) intermediate colours on curves and diagonal steps.
- **Never AA the outer silhouette** of a sprite that moves over varied backgrounds: the AA colour would be wrong against unknown pixels.
- **Line steps:** consistent progressions (1-1-1, 2-2-2, 3-2-1, 1-2-3) avoid "jaggies".

**Errors to avoid**
- **Banding:** parallel stripes of colours that follow the outline.
- **Pillow shading:** light from the centre outward, ignoring the light direction.
- **Noise:** isolated single pixels with no purpose.
- **Too many near-identical colours.**

**Dithering**
- **When it helps:** sparingly, for large gradients (sky, light shafts, fog edges) and textures (rock, fabric).
- **On small sprites:** it reads as noise and breaks when the sprite moves.
- **Patterns:** ordered patterns (2×2 checker, Bayer 4×4) are the pixel-art norm. Random dithering looks like compression artefacts.

**Colour counts (hardware heritage)**
- **[K] Old hardware limits:** SNES and GBA sprites used **16-colour palettes (15 + transparent)**. DS Pokémon sprites live in 16-colour palettes too.
- **Why it still matters:** the limit drives clean, readable art and is a good **discipline target** today.

**Readability**
- **Silhouette test:** fill the sprite with one flat colour; the character, pose and facing must still read.
- **Value test:** desaturate; the key features (eyes, face, hands, element marking) must sit at least **2 value steps** from their surroundings.
- **Squint test** at 1× zoom.

**Anime faces at small size**
- **Eyes:** dominate: tall eyes with a 1-px white catch-light.
- **Mouth:** a 1–3 px mouth.
- **Blush:** 1–2 px of pink under the eyes for emotion.
- **Hair:** reads as **big clumps** (3–5 spikes or locks), never strands.

### 3c. Direction for Tokonmon [D]

**Shading bands (hand-pixelled sprites, portraits, 2D Tokonmon)**
- Per material: **Highlight (optional) · Base · Shade 1 · Shade 2 (sparing) · Outline**, which is **max 5 values per material**.
- **Light direction for baked sprite shading: top-front** (light from above, slightly in front), **not** top-left. The engine adds directional tint and rim dynamically (§1), so baked left/right lighting would fight it.
- **Exception:** portraits and cut-ins may use dramatic top-left key + rim, because they are not dynamically lit.

**Hue-shift ramp rule (use the ramps in §6)**
- Each step toward shadow: hue **+10–20° toward violet/blue**, value −12–18%, saturation +5–10% until the last step, which desaturates.
- Each step toward highlight: hue **toward yellow**, value +10–15%, saturation −10–20%.
- Skin shadows go toward **rose/magenta** (anime convention), not brown or grey.

**Outlines (selout)**
- **Thickness:** always 1 px.
- **Outer silhouette:** the darkest step of the adjacent ramp (the "Outline" column in §6).
- **Lit edge:** where the silhouette faces the light (top of head, shoulders), the outline may go one step lighter. Never remove more than 30% of the outline.
- **Interior lines:** Shade 2 of the material, only for eyes, mouth, fingers, overlapping parts and clothing seams.
- **No `#000000`** anywhere except the pupil core or a void. The darkest neutral is **#2e222f**.
- **3D Tokonmon:** the engine outline equals the object colour × outline tint (currently `(0.55, 0.42, 0.62)`, a violet-leaning darkening, which **matches** the selout rule). Keep it.

**Colour budgets**

| Asset | Max colours (incl. outline colours) |
|---|---|
| Human overworld sprite | **16** |
| NPC / crowd sprite | **10–12** |
| Tokonmon 2D icon (32×32) | **8–10** |
| Tokonmon dex/scan sprite (96×96) | **16–20** |
| Dialogue portrait (96×96) | **24–32** |
| Close-up drawing (zoom-in scenes, 160×160+) | **32–48** |
| Environment texture (32×32 tile) | **6–12** |
| 3D Tokonmon model | **3–5 material families**, each with lit/shadow/deep colours, plus emissives (≈ 12–18 rendered colours) |

**Dithering**
- **Allowed:** skies, large walls, light shafts, fog banding, shadow edges (1-px checker transition), transitions (pixel dissolve), and Ecto/ghost translucency (50% checker instead of alpha blending).
- **Forbidden:** faces, hands, small creatures, UI text.
- **Engine quantisation:** the global quantise-and-dither (`uLevels` 48, `uDither` 0.85) is a *gradient smoother*, not a style. **Keep levels ≥ 32** so hand-picked sprite colours are not shifted. Exception: the low preset uses 24, and must be checked against skin ramps.

**AA**
- Inside sprites only; max 1 AA colour between any two colours.
- No AA on the outer silhouette.
- Curves follow consistent step lengths.

**Readability**
- Every character and Tokonmon must pass the **silhouette, value and 1× squint tests** at its real in-game size.
- Every Tokonmon has **2–3 key colours** plus its element accent (§6, element table), so it is recognisable as a coloured blob at 20 px.
- Eyes are the **highest-contrast** feature on every face.

**Do**
- Do build every material from a ramp in §6. Do reuse ramps across characters (palette discipline gives cohesion).
- Do check sprites over **day, dusk, night and interior** backgrounds. Selout must hold up on all four.
- Do give each character one signature colour that appears in their portrait, sprite and phone contact icon.

**Don't**
- Don't use pure black outlines, pure grey shadows, gradients, pillow shading, banding, or random-noise dithering.
- Don't add colours "just for this one pixel". Pick from the ramp.
- Don't trace or edit ripped sprites, even as a base.

---

## 4. Side-scrolling 2.5D and cut-away "stage set" scenes

### 4a. References
All [K]; titles are well known, URLs were not checked this session.

| # | Source | What to study |
|---|---|---|
| 1 | Good Pizza, Great Pizza (TapBlaze), mobile | Fixed front view of the counter: the customer faces you, speech bubbles carry the dialogue, almost no UI |
| 2 | Kairosoft games (Cafeteria Nipponica, Game Dev Story) | Tiny chibi staff in a cut-away "dollhouse" shop: readable busy-ness at very small sprite sizes |
| 3 | Tiny Tower (NimbleBit) | Vertical stack of cut-away pixel floors; each floor is a mini stage |
| 4 | Fallout Shelter (Bethesda), mobile | Side cut-away "ant farm" with 3D lighting; **pinch-zoom, drag-pan, tap-a-room-to-zoom** conventions on phones |
| 5 | Battle Chef Brigade (Trinket Studios) | Side-on kitchen stations, food as hero objects |
| 6 | Cozy Grove (Spry Fox) | Cozy diorama lighting and props |
| 7 | Persona 5 (Atlus): Café Leblanc, ramen shop, diner interiors | Interiors framed like stage sets; strong colour identity per venue |
| 8 | Kingdom / Kingdom Two Crowns (Noio) | Side-scrolling pixel parallax, water reflection strip, day/night colour |
| 9 | Owlboy (D-Pad Studio) | Deep pixel parallax with many layers, foreground silhouettes |
| 10 | The Last Night (Odd Tales) | Cyberpunk pixel-art city with 3D lighting and neon (closest mood match for Osaka 2050) |
| 11 | Eastward (Pixpil) | Dense urban side views, interiors as cut-aways (§2) |
| 12 | Pokémon BW (§2) | Per-area camera, 3D city that reads as 2D |
| 13 | Paper Mario: The Thousand-Year Door | The world literally as a theatre stage set: curtains and stage-flat scenery |

### 4b. Study notes [K + reasoning]

**Cut-away interiors**
- **Framing:** the front wall is removed and the camera looks in like a theatre audience. Floors, counters and tables are arranged in **horizontal strata** so actors walk left/right with a little depth.
- **Readability:** comes from **one strong focal object per room** (counter, stage, grill) and **warm interior light against a cooler exterior**.

**Mobile camera conventions (Fallout Shelter / Tiny Tower)**
- One-finger **drag pans**; **pinch zooms** between a few stops; **tapping a room zooms into it**.
- The camera is **clamped** to the set's bounds.
- Taps on interactive things take priority over walk taps.

**Parallax**
- **Classic 2D:** separate layers at speed ratios such as sky 0.05, far 0.1–0.25, mid 0.5, play 1.0, foreground 1.2–1.5.
- **Foreground framing:** dark, slightly blurred silhouettes (posts, plants, railings) that **frame** the stage. Keep them sparse.
- **In 3D with a perspective camera:** parallax is automatic. The ratio is `D / (D + z)`, where D is the camera distance to the focal lane and z is the depth behind it.

**Front-facing facades are a pixel-art gift**
- Planes parallel to the image plane map texels almost exactly 1:1, so they stay crisp under nearest sampling.
- Receding side walls are resampled and shimmer.

### 4c. Direction for Tokonmon [D]

**Stage-set anatomy (every street strip and cut-away)**

| Layer | Depth relative to the focal lane | Content | Treatment |
|---|---|---|---|
| Sky | ∞ | Gradient + cloud cards + occasional **Polaris** silhouette | No outlines; dithered gradient; scene grade |
| Far skyline (BG2) | 150–400 m behind | Original Osaka-2050 skyline cards (castle keep, retro-futurist towers, a tower inspired by Tsutenkaku, monorails) | Pre-drawn at **on-screen size** (1 texel = 1 art px at that depth); atmospheric fade 40–60% toward the fog colour |
| Back block (BG1) | 20–60 m behind | Simplified building masses, signs as light dots | DOF blur 3–5 px; fade 20–30%; no outlines |
| Facade line (MG) | 3–8 m behind | The stage: shopfronts, doors, windows, signs, cut-away rooms | Sharp, outlined, full detail; **parallel to the camera** |
| Play lanes (PL) | 0 to −3 m (2–3 walk lanes) | Player, NPCs, Tokonmon followers, props | Sharp; sprites 1:1 |
| Street / foreground (FG) | 2–6 m *in front of* the focal lane | Kerb, railings, lamp posts, plants, vending machines, passing cars or bikes | Darker (−20–30% value), DOF blur 4–6 px; **≤15% of screen coverage**; never covers the player for more than 0.5 s |

**Camera rigs (per scene type)**

| Scene | Vertical FOV | Pitch (down) | pixelH (zoom stop) | Visible height at 32 px/m | Notes |
|---|---|---|---|---|---|
| Street strip (Dotonbori, Shinsekai, Umeda) | **24°** (20–30) | **12–18°** | 320 (or 360 wide) | 10 m (11.25 m) | Camera distance ≈ 23.5 m at 24°; tilt band only on the widest stop |
| Cut-away interior (restaurant, dojo, shop, onsen, arcade, League lobby) | **28–32°** | **18–25°** | 270 | 8.4 m | Shows floor plus 1–2 storeys; the ceiling cut line is visible as a clean edge |
| Park / safari trail | 24–30° | 20–30° | 320 | 10 m | More ground visible for tall grass and sneaking |
| Stadium battle | 30–35° | 25–35° | 320–360 | 10–11 m | Free dynamic camera for skills and ultimates (§2 rules) |
| Establishing / transition shots | 18–24° | 30–45° | 360 | 11 m | Tilt-shift band on (diorama look) |

**Parallax check** (24°, D ≈ 23.5 m):
- facades at −5 m → **0.82** of the camera pan speed
- back block at −40 m → **0.37**
- skyline at −300 m → **0.07**
- foreground at +4 m → **1.21**

This matches classic hand-tuned parallax, so **no fake parallax layers are needed**. Use real depth.

**Zoom: pinch and the integer-stop rule**
- Zoom **changes how many screen pixels one art pixel covers**, while density stays 32 px/m on the focal lane.
- Allowed stops are integer upscales k of the canvas height, giving `pixelH = canvasH / k`. On a 1080-px-tall canvas: k = 3 → 360 (wide), 4 → 270 (default interior), 5 → 216 (close), 6 → 180 (closest).
- Choose k so `pixelH` is nearest each scene's target. Non-integer remainders are handled by the sharp-bilinear present.
- Pinch animates between stops over **0.25–0.35 s** (ease-out); intermediate frames may be non-integer.
- **The camera never rests on a non-integer zoom.**

**Pan**
- One-finger drag pans along the strip (x only on street strips; x+y on tall cut-aways).
- Inertia with damping of 0.85–0.9 per frame; clamped to set bounds with a 0.2 s soft spring.
- Releasing the drag for **2.5 s** returns the camera to follow mode.

**Follow camera**
- Horizontal dead-zone of **25%** of screen width around centre.
- Look-ahead **1.5–3 m** in the walking direction, eased over 0.6 s.
- Vertical locked on street strips.

**Tap-to-walk in 2.5D**
- **Picking:** raycast the tap onto the walk-lane navmesh. If the tap hits an interactable first (NPC, door, sign, counter seat, Tokonmon), path to its **interaction point** and auto-interact on arrival.
- **Tap marker:** a 4-frame pixel ring at the target (12 fps, 10×4 px ellipse expanding to 16×6 px), in the scene's accent colour.
- **Speeds at 32 px/m:**
  - walk **1.4 m/s = 45 px/s**
  - run (double-tap, or a long path over 8 m) **3.2 m/s ≈ 100 px/s**
  - sprite positions accumulate in floats but **render snapped to whole art pixels**
- **Lane changes** happen diagonally along the path. Draw sprites in the nearer lane **after** sprites in farther lanes (depth sort by lane z, then by y).

**Restaurant-like composition**
- One **hero station** per venue (takoyaki grill, ramen counter, ice-cream freezer, okonomiyaki teppan), at screen-centre on the default stop.
- **Staff idle loops** at stations: steam, flipping, wiping.
- Seat and stool "hotspots" glow faintly (1-px outline pulse at 2 Hz) only when the phone's interaction hint is on. *Interpretation: keeps "almost no UI".*

**Front walls in cut-aways**
- The removed front wall is shown as a **cut edge**: wall thickness drawn as a dark cross-section line (2–3 px, in the darkest wall colour), plus a floor-slab cross-section.
- The diorama-edge soil layers shown in MAPS.md work the same way for outdoor sets.

**Real Dotonbori signage is trademarked.** The running-man board, the giant mechanical crab and the drumming clown are real brands. Make **original** equivalents that fit our world, for example:
- a running athlete Tokonmon board
- a giant mechanical Kanizumo sign
- an idol drummer robot
- MAPS.md's band-pun shop names

**Do**
- Do keep facades parallel to the camera, and keep receding side walls simple (flat colour, 1–2 details).
- Do frame each screen with one or two foreground silhouettes, and keep the play lanes clear.
- Do put light inside interiors (warm) to contrast with the exterior (cool or neon).

**Don't**
- Don't stack more than three foreground occluders on one screen, or block doors and NPCs with them.
- Don't let zoom rest at non-integer scales. Don't rotate the exploration camera.
- Don't replicate real signage, logos or shop interiors. Use original designs and band-pun names.

---

## 5. Zoom-in scenes (first-person ordering at a counter; eating at a table)

### 5a. References
All [K]; URLs were not checked this session.

| # | Source | What to study |
|---|---|---|
| 1 | VA-11 Hall-A (Sukeban Games) | Bar counter scene: customers seated across the counter at large pixel scale, a dim neon-pink/blue palette, conversation driven by drinks |
| 2 | Coffee Talk (Toge Productions) | Night café counter, rain on the window, lo-fi palette, customers as big pixel busts |
| 3 | Good Pizza, Great Pizza | First-person counter: the customer faces the player, the order is told in a speech bubble |
| 4 | Persona 5 / Persona 4 (Atlus) | Food challenges and meals: dramatic close-ups, reaction cut-ins, comedic over-the-top bowls |
| 5 | Pokémon Sword/Shield camp curry; Scarlet/Violet picnic | Top-down cooking interaction (stir, fan the fire, add berries), "reveal" of the dish, Pokémon eating reactions |
| 6 | Studio Ghibli food scenes (e.g. Ponyo's ramen, Howl's breakfast) | Anime food rendering: saturated, glossy, steam, exaggerated deliciousness |
| 7 | Anime food-reaction tropes (Food Wars! / Shokugeki no Soma) | Reaction shots, radial backgrounds, sparkles. Transform; never reproduce compositions |
| 8 | Fallout Shelter "tap a room to zoom" (§4) | Continuity of the zoom transition on mobile |

### 5b. Study notes [K]

**Counter scenes (VA-11 Hall-A, Coffee Talk, Good Pizza)**
- The person across the counter is drawn **much larger** (bust or half-body) than any overworld sprite. It is a different, bigger drawing, not a magnified sprite.
- The counter edge forms a strong horizontal band at the bottom of the frame.
- Background props are dimmer and softer.
- Dialogue lives in bubbles anchored to the person.

**Anime food**
- **Look:** saturated, warm colours; **glossy highlight shapes** (curved 1–2 px white bands on sauce, rice and noodles); steam wisps; small sparkles at the "reveal".
- **Reaction:** an exaggerated reaction face.
- **Before/after states:** whole, bitten, empty.

**Pokémon curry**
- The camera is top-down over the pot; the cooking actions are simple taps or swipes.
- The finished dish is "revealed" with a flourish.
- The creatures' eating reactions vary by flavour, which ties directly to our bible's **eating → passives** system.

### 5c. Direction for Tokonmon [D]

**Rule 1: close-ups use bigger drawings, not bigger pixels.**
- **Kept:** the art-pixel size on screen stays at the current zoom stop.
- **Switched:** the zoom-in scene uses a **dedicated close-up set**, authored at **higher world density (64–96 px/m)**, with its own drawings.
- **One density per shot:** everything visible in that shot shares one density.

**Ordering at a counter (first person)**

*Camera*
- **Eye height:** 1.25 m when seated, 1.55 m when standing.
- **Framing:** pitch 0–5° down, vertical FOV **38–45°** (first person needs a wider view), and pixelH 270.

*Composition*
- **Bottom 18–22%:** the counter top in the foreground, with a light DOF blur and a 1-px specular edge line.
- **Centre:** the clerk as a **half-body close-up drawing, 140–170 px tall**, with 6+ expressions, 2-frame blink and 3-frame mouth.
- **Upper left/right:** the menu board as **in-world signage** (pixel text 7–9 px tall, prices on hanging tags).

*Choices and phone*
- Order choices are **in-world items**: tap the menu tags, or the clerk's speech-bubble options. No UI panels (bible: almost no UI).
- The phone can be raised from the bottom edge for scan or pay. That is the only "UI".

*Clerk idles:* wiping the counter, steam from the grill behind, a customer silhouette passing by.

**Eating at a table (close-up)**

*Camera*
- **Framing:** pitch **40–55°** down (a ¾ top-down view of the table), FOV 28–32°, pixelH 270.
- **In frame:** the table fills **70%**. Hands, chopsticks and the Tokonmon's head and arms enter from the edges.

*The dish*
- **Size:** a hero bowl or plate **64–112 px wide**, drawn at close-up density.
- **States:** 3–4 frames: full → bitten → half → empty.
- **Glossy highlights:** 1–2 px white curves; sauce gets a hue-shifted highlight (warm).

*Living details*
- **Steam:** 2–3 wisp flipbooks, 6 frames at 10–12 fps, rising 8–12 px/s, white at 50% via dither, fading over the top 30%.
- **Reveal sparkle:** 3–5 four-point stars with a 3-frame twinkle.

*The Tokonmon's reaction (connects to the eating → passives system)*
- a **reaction portrait** or cut-in: delicious / too spicy / sour / weird
- spicy reactions show **steam from ears, sweat drops and a red flush**
- Chilichick's signature crying gets **extra tears** in this scene
- the passive or skill gained (e.g. **Heat Tolerance**) appears as an **in-world sticker** that slaps onto the phone screen

**Transition into and out of a zoom-in scene (continuity matters)**

1. **Approach:** the player taps a seat or counter. They walk there, sit (3-frame sit animation), and the camera **dollies and pitches** toward the table or counter from the *same side* over **0.6–0.8 s** (cubic ease-in-out). DOF pulls focus from the player to the table, and ambient sound ducks −6 dB.
2. **Swap:** at the end of the dolly, run a **pixel dissolve** (Bayer 4×4 threshold animated over **8–10 frames at 60 fps**) from the stage set into the close-up set. An alternative is a 2-frame white flash for comedic or hype scenes (the spicy-food challenge).
3. **Exit:** play the reverse dissolve, then dolly out (0.5 s).

Never cut hard without a transition, except for comedic smash cuts, which are deliberate.

**Do**
- Do give every venue its own close-up set with signature details: takoyaki grill dimples, the ramen bowl pattern, the ice-cream freezer glow.
- Do keep food appetising: warm key light, saturated base colours, gloss, steam.
- Do make reactions character-specific; they sell the bond system.

**Don't**
- Don't magnify overworld sprites for close-ups.
- Don't reproduce existing anime food compositions or VA-11 Hall-A's / Coffee Talk's character designs or layouts.
- Don't cover the scene with menu panels. Choices live on signs, tags, bubbles and the phone.

---

## 6. Palettes

### 6a. References

[K] All are Lospec palettes; the hex values were transcribed from memory, so **verify them against lospec.com before importing** (search budget exhausted). Lospec palettes are free to use; credit their authors in the game credits.

| Palette | Author | Size | URL |
|---|---|---|---|
| Resurrect 64 | Kerrie Lake | 64 | https://lospec.com/palette-list/resurrect-64 |
| Endesga 32 | ENDESGA | 32 | https://lospec.com/palette-list/endesga-32 |
| Endesga 64 | ENDESGA | 64 | https://lospec.com/palette-list/endesga-64 |
| Apollo | AdamCYounis | 46 | https://lospec.com/palette-list/apollo |
| Sweetie 16 | GrafxKid | 16 | https://lospec.com/palette-list/sweetie-16 |
| AAP-64 | Adigun A. Polack | 64 | https://lospec.com/palette-list/aap-64 |
| DawnBringer 32 | DawnBringer | 32 | https://lospec.com/palette-list/dawnbringer-32 |
| Nyx8 | Javier Guerrero | 8 | https://lospec.com/palette-list/nyx8 |
| Twilight 5 | (Lospec) | 5 | https://lospec.com/palette-list/twilight-5 |
| Other mood references | City-pop album illustration (Eizin Suzuki, Hiroshi Nagai); Makoto Shinkai skies; 90s anime cels | n/a | Study colour relationships only; never copy compositions |

### 6b. Study notes

**Why Resurrect 64 as master [K]**
- Its ramps are built **hue-shifted**: reds into wine-violets, greens into teals, greys tinted purple.
- It has good **skin steps** (`#fdcbb0 → #fca790 → #cf657f`) and enough **saturated accents** for anime.
- Its darkest colour is a **purple-black** (`#2e222f`), not pure black, which matches our selout rule.

**Resurrect 64** (master; verify):
```
2e222f 3e3546 625565 966c6c ab947a 694f62 7f708a 9babb2 c7dcd0 ffffff
6e2727 b33831 ea4f36 f57d4a ae2334 e83b3b fb6b1d f79617 f9c22b 7a3045
9e4539 cd683d e6904e fbb954 4c3e24 676633 a2a947 d5e04b fbff86 165a4c
239063 1ebc73 91db69 cddf6c 313638 374e4a 547e64 92a984 b2ba90 0b5e65
0b8a8f 0eaf9b 30e1b9 8ff8e2 323353 484a77 4d65b4 4d9be6 8fd3ff 45293f
6b3e75 905ea9 a884f3 eaaded 753c54 a24b6f cf657f ed8099 831c5d c32454
f04f78 f68181 fca790 fdcbb0
```

**Emissive / neon extension** (from Endesga 64; HDR-boosted in engine; verify):
```
ff0040 (neon red-magenta)  f389f5 (neon pink)  db3ffd (neon violet)  0cf1ff (neon cyan)
94fdff (ice glow)          00cdf9 (electric blue)  ffeb57 (neon yellow)  ff5000 (neon orange)
d3fc7e (radiant lime)      99e65f (bio glow)
```

**Endesga 32** (alternative; strong for creatures; verify):
```
be4a2f d77643 ead4aa e4a672 b86f50 733e39 3e2731 a22633 e43b44 f77622 feae34 fee761
63c74d 3e8948 265c42 193c3e 124e89 0099db 2ce8f5 ffffff c0cbdc 8b9bb4 5a6988 3a4466
262b44 181425 ff0044 68386c b55088 f6757a e8b796 c28569
```

**Nyx8** (night mood reference; verify): `08141e 0f2a3f 20394f 4e495f 816271 997577 c3a38a f6d6bd`
**Twilight 5** (dusk mood reference; verify): `fbbbad ee8695 4a7a96 333f58 292831`
**Sweetie 16** (UI and phone themes, small icons; verify):
```
1a1c2c 5d275d b13e53 ef7d57 ffcd75 a7f070 38b764 257179 29366f 3b5dc9 41a6f6 73eff7 f4f4f4 94b0c2 566c86 333c57
```

### 6c. Direction for Tokonmon [D]

**Palette policy**
- **All hand-made pixel art** (sprites, portraits, textures, decals, 2D Tokonmon) uses **Resurrect 64 + the 10-colour emissive extension** = **74 colours**.
- **A palette file is the source of truth:** a `.gpl`/`.ase` swatch, and later a JSON in the repo, made by the art lead after checking against Lospec.
- **Lighting, fog, sky and grade** can use the custom hex below; those are *light* colours, not paint colours.
- Custom paint colours outside the master (e.g. a skin tone) need a note in the asset's study file explaining why.

**Scene palettes.** Each scene defines: sky gradient, key light, fill, shadow tint, fog, its subset of the master palette, emissives, and grade (lift, gain, saturation, contrast, bloom, vignette).

**1) Day city: Chuo / Umeda, 09:00–16:00**

| Role | Hex | Note |
|---|---|---|
| Sky zenith → horizon | `#4d9be6` → `#8fd3ff` | Dithered 4-step gradient |
| Haze / far fade | `#c7dcd0` | BG2 fade target |
| Key light (sun) | `#fff4e0` (custom) | Intensity ≈ 3; shadows hard |
| Fill (sky) | `#8fd3ff` | Intensity ≈ 0.35 |
| Shadow tint | `#484a77` | Cool blue-violet shadows |
| Concrete / asphalt ramp | `#ffffff #c7dcd0 #9babb2 #7f708a #625565 #3e3546` | Purple-tinted greys |
| Foliage ramp | `#cddf6c #91db69 #1ebc73 #239063 #165a4c` | Yellow → teal shift |
| Brick / wood ramp | `#e6904e #cd683d #9e4539 #7a3045` | |
| Warm accents (awnings, signs) | `#f9c22b #fb6b1d #e83b3b` | ≤ 10% of screen |
| Darkest | `#2e222f` | |

Grade: lift (0.00, 0.00, 0.02) · gain (1.00, 0.99, 0.96) · sat 1.08 · contrast 1.04 · bloom 0.3 · vignette 0.15.

**2) Dusk neon city: Osaka 2050 (Dotonbori, Shinsekai, 17:30–19:30, then blue hour)**

| Role | Hex | Note |
|---|---|---|
| Sky top → upper → mid → horizon | `#323353` → `#6b3e75` → `#a24b6f` → `#fca790` (sun glow `#fdcbb0`) | City-pop dusk gradient, 5–6 dithered bands |
| Key (low sun) | `#f79617` | Intensity ≈ 1.2, long shadows; fades out at blue hour |
| Fill (sky bounce) | `#905ea9` | Violet fill |
| Shadow tint | `#45293f` | |
| Building silhouettes | `#2e222f #3e3546 #45293f` | Upper facades go to silhouette against the sky |
| Rim on west-facing edges | `#fca790` | 1-px rim on rooflines and characters |
| Neon set (emissive ×2–4 HDR) | magenta `#ff0040`/`#f04f78`, pink `#f389f5`, cyan `#0cf1ff`/`#30e1b9`, violet `#db3ffd`/`#a884f3`, yellow `#ffeb57`/`#f9c22b`, orange `#ff5000` | **Max 3 neon hues per screen** plus white |
| Canal water | `#0b5e65` base, `#323353` deep, neon reflections | |
| Fog (far) | `#6b3e75` | 30–40% at BG1 |

Grade: lift (0.03, 0.00, 0.06) (violet lift) · gain (1.04, 0.96, 0.98) · sat 1.15 · contrast 1.08 · bloom 0.8 · vignette 0.25.

**3) Night: 21:00–04:00 (Nyx8 mood, mapped to the master palette)**

| Role | Hex | Note |
|---|---|---|
| Sky | `#08141e` → `#0f2a3f` → `#20394f` | Stars: `#c7dcd0` single pixels, a few `#fbff86` |
| Key (moon) | `#8fd3ff` | Intensity ≈ 0.35 |
| Ambient | `#20394f` | |
| Shadow tint | `#0f2a3f` | |
| Lit-surface mids | `#4e495f #816271 #997577` | Mood targets; paint with the nearest master colours (`#625565 #694f62 #966c6c`) |
| Window glow | `#fbb954` / `#f9c22b` | Emissive ×1.5 |
| Sodium street lamps | `#f79617` | Point lights range 5 m, flicker on 1 lamp in 6 |
| Vending machines / konbini | `#8ff8e2`, `#ffffff` | Cool white light pools |

Grade: lift (0.00, 0.02, 0.05) · gain (0.92, 0.96, 1.05) · sat 0.95 (emissives exempt) · contrast 1.10 · bloom 1.0 · vignette 0.30.

**4) Forest safari: Minoh (three trails)**

| Role | Hex | Note |
|---|---|---|
| Canopy lights → shadows | `#fbff86 #d5e04b #cddf6c #91db69 #1ebc73 #239063 #165a4c #0b5e65` | Shadows go **teal**, never grey-green |
| Moss / olive | `#a2a947 #676633 #547e64 #92a984 #374e4a` | |
| Bark / soil | `#966c6c #694f62 #4c3e24` | Purple-brown bark |
| Stream and Minoh Falls | `#8ff8e2 #30e1b9 #0eaf9b #0b8a8f` + foam `#ffffff` | |
| Mist | `#c7dcd0` | Height fog |
| Autumn maples (momiji, Minoh's signature) | `#ea4f36 #f57d4a #f9c22b` | Seasonal or trail-3 accent |
| Flower accents | `#f04f78 #a884f3` | |
| Key light | `#fff0c8` (custom) | Through a leaf "cookie" → dappled light |
| Light shafts | `#fbff86` at 12–20% | Dithered cards |

Grade: lift (0.00, 0.01, 0.02) · gain (1.00, 1.00, 0.95) · sat 1.10 · bloom 0.35 · vignette 0.20.
**Tall grass:** 3 tones plus a 1-px tip highlight (`#cddf6c` / `#91db69` / `#239063` + `#fbff86` tips).

**5) Interiors: warm restaurant (takoyaki, okonomiyaki, ramen, café, ice-cream parlour)**

| Role | Hex | Note |
|---|---|---|
| Wood ramp | `#fbb954 #e6904e #cd683d #9e4539 #7a3045 #45293f` | Counters, beams |
| Plaster walls | `#fdcbb0 #fca790` | Warm |
| Paper lanterns (emissive) | core `#fbff86`, body `#fbb954` | Point lights range 3 m |
| Noren / cloth | indigo `#4d65b4 #323353`, or crimson `#b33831 #6e2727` | |
| Tatami | `#b2ba90 #92a984 #547e64` | |
| Steel counter, teppan | `#9babb2 #7f708a #625565` + 1-px `#ffffff` specular | |
| Steam | `#ffffff` at 50% (dithered) | |
| Key light | `#ffd9a0` (custom, ~2700 K) | Intensity ≈ 1.6 |
| Fill / shadow tint | `#753c54` | Warm rose-violet shadows |

Grade: lift (0.03, 0.01, 0.00) · gain (1.05, 0.98, 0.90) · sat 1.10 · bloom 0.5 · vignette 0.25.
**Ice-cream parlour variant:** pastel; swap the wood for `#eaaded #ed8099 #8ff8e2 #ffffff`.

**6) Stadium: Umeda League arena**

| Role | Hex | Note |
|---|---|---|
| Floodlight key (night) | `#f0f6ff` (custom) | 4 towers, intensity ≈ 4; 4 faint crossed shadows |
| Turf | `#1ebc73 #239063 #165a4c` | Mowing stripes alternate ±1 step |
| Lines | `#ffffff` | |
| Crowd mass | `#484a77 #4d65b4 #323353` | + confetti/team speckle `#f04f78 #f9c22b #30e1b9` |
| Structure | `#9babb2 #625565 #3e3546` | |
| Jumbotron / LED boards | `#0cf1ff #ff0040 #ffeb57` (emissive) | |
| Arena: rocky | `#ab947a #966c6c #625565 #3e3546` | |
| Arena: grassy | `#cddf6c #91db69 #1ebc73 #239063` | |
| Arena: water | `#8ff8e2 #30e1b9 #0eaf9b #0b8a8f #0b5e65` | |

Grade: sat 1.15 · contrast 1.10 · bloom 0.6 (night 0.9) · vignette **0.10** (battle readability first).

**Bonus: farm at dawn (opening cinematic)**
- **Sky:** `#484a77 → #905ea9 → #ed8099 → #fdcbb0`.
- **Key:** `#fca790` at a low angle, with very long shadows.
- **Mist:** `#eaaded`.
- **Grade:** sat 1.05, bloom 0.5. Kagarou's fire (`#ff5000`, `#f9c22b`) is the first saturated hit of colour in the game.

**Character ramps** (HL · Base · Shade 1 · Shade 2 · Outline). Custom entries are marked (c); everything else is Resurrect 64.

| Material | HL | Base | Shade 1 | Shade 2 | Outline | Notes |
|---|---|---|---|---|---|---|
| Skin, fair | `#fff1e6` (c) | `#fdcbb0` | `#fca790` | `#cf657f` | `#7a3045` | Blush `#f68181`; shadows go rose |
| Skin, medium | `#f6c9a0` (c) | `#e0a070` (c) | `#b86d55` (c) | `#874252` (c) | `#4a2236` (c) | Hue shifts to wine |
| Skin, deep | `#c88a64` (c) | `#9a5f45` (c) | `#6e3c3a` (c) | `#4a2532` (c) | `#2e222f` | HL slightly warm-gold |
| Hair, blue-black | sheen `#9babb2` | `#323353` | `#2e222f` | n/a | `#2e222f` | HL band `#484a77`; anime "angel ring" sheen 1 px |
| Hair, brown | `#e6904e` | `#9e4539` | `#7a3045` | `#45293f` | `#45293f` | |
| Hair, blonde | `#fbff86` | `#fbb954` | `#e6904e` | `#cd683d` | `#7a3045` | |
| Hair, idol pink (Lumi★) | `#eaaded` | `#ed8099` | `#cf657f` | `#a24b6f` | `#753c54` | |
| Hair, cyber teal | `#8ff8e2` | `#30e1b9` | `#0eaf9b` | `#0b8a8f` | `#0b5e65` | Futurist NPCs |
| Hair, punk red (Thrash) | `#f57d4a` | `#e83b3b` | `#b33831` | `#6e2727` | `#45293f` | |
| Hair, white/silver (elders) | `#ffffff` | `#c7dcd0` | `#9babb2` | `#7f708a` | `#625565` | |
| Cloth, white shirt | `#ffffff` | `#ffffff` | `#c7dcd0` | `#9babb2` | `#625565` | Cool shadows on white |
| Cloth, denim | `#4d9be6` | `#4d65b4` | `#484a77` | `#323353` | `#2e222f` | |
| Cloth, black leather / metal vest | spec `#c7dcd0` (1 px) | `#3e3546` | `#2e222f` | n/a | `#2e222f` | Sheen band `#7f708a`; studs `#ffffff/#9babb2/#625565` |
| Cloth, red jacket | `#f57d4a` | `#e83b3b` | `#ae2334` | `#6e2727` | `#45293f` | |
| Cloth, green (Ranger Sora) | `#91db69` | `#1ebc73` | `#239063` | `#165a4c` | `#0b5e65` | |
| Cloth, yellow raincoat | `#fbff86` | `#f9c22b` | `#f79617` | `#cd683d` | `#7a3045` | |
| Cloth, purple | `#a884f3` | `#905ea9` | `#6b3e75` | `#45293f` | `#2e222f` | |
| Gold | `#fbff86` | `#f9c22b` | `#f79617` | `#cd683d` | `#9e4539` | Soul stone fittings, crowns (Bubblion line) |
| Silver / chrome | `#ffffff` | `#c7dcd0` | `#9babb2` | `#7f708a` | `#625565` | Phone body, chains, studs |

**Element accent colours** (VFX, bonding aura, phone themes, dex badges; use consistently):

| Element | Light → dark | Emissive | Idea |
|---|---|---|---|
| Pyro | `#f9c22b #fb6b1d #e83b3b #6e2727` | `#ff5000` | Raw heat |
| Hydro | `#8fd3ff #4d9be6 #4d65b4 #323353` | `#00cdf9` | Precise, cool |
| Bio | `#cddf6c #1ebc73 #239063 #165a4c` (+ berry `#f04f78`) | `#99e65f` | Growth / heal |
| Geo | `#e6904e #cd683d #9e4539 #4c3e24` (+ stone `#ab947a`) | n/a | Solid, no glow |
| Echo | `#ed8099 #f04f78 #c32454 #831c5d` | `#f389f5` | Stage-light magenta: rhythm |
| Volto | `#fbff86 #f9c22b #f79617` | `#ffeb57` | |
| Cryo | `#ffffff #8ff8e2 #8fd3ff #4d9be6` | `#94fdff` | |
| Aero | `#ffffff #c7dcd0 #92a984 #547e64` | n/a | Sage wind, distinct from Cryo cyan |
| Ecto | `#a884f3 #905ea9 #6b3e75 #45293f` (+ spectral `#30e1b9`) | `#db3ffd` | |
| Ferro | `#ffffff #9babb2 #7f708a #625565 #3e3546` (+ spark `#f9c22b`) | n/a | |
| Astro | `#323353 #484a77` + stars `#fbff86 #fbb954` + nebula `#a884f3` | `#ffeb57` | |
| Nucleo | `#fbff86 #d5e04b #a2a947` + void `#2e222f` | `#d3fc7e` | Radiant, toxic |

**Do**
- Do pick from the master palette and the ramps; scene mood comes from **light and grade**, not from repainting assets per scene.
- Do test every character sprite under all 6 scene grades (palette "lighting check" sheet).
- Do keep **max 3 neon hues per screen**, so the city stays designed rather than noisy.

**Don't**
- Don't sample colours from screenshots of other games or anime.
- Don't use pure `#000000`, or fully saturated `#ff0000`/`#00ff00`/`#0000ff` as paint.
- Don't let the global quantiser fight the palette: keep `uLevels ≥ 32`.

---

## 7. Animation principles for pixel sprites and 2D-looking 3D

### 7a. References
[K]; URLs were not checked this session.

| # | Source | URL / note |
|---|---|---|
| 1 | Richard Williams, *The Animator's Survival Kit* | Book: timing, spacing, walk cycles, anticipation |
| 2 | Thomas & Johnston, *The Illusion of Life* (Disney's 12 principles) | Book: squash & stretch, anticipation, follow-through, arcs |
| 3 | Saint11 (Pedro Medeiros): animation cards (smears, impact, run cycles) | https://saint11.org/blog/pixel-art-tutorials/ |
| 4 | Guilty Gear Xrd GDC talk and analysis videos (§2 #19–#26) [S] | Limited animation, held keys, hitstop, hand-fixed frames |
| 5 | t3ssel8r animation workflow (§2 #4–#5) [S] | 3D pixel art animation passes, previews in engine |
| 6 | Dead Cells 3D-to-pixel pipeline (§2 #47) | Low-res renders, no AA, frame-rate discipline |
| 7 | Pokémon BW animated battle sprites (96×96) | Readable idle loops at small size |
| 8 | TV anime production conventions (on 2s/3s, impact frames, smears) | Anime "sakuga" timing |

### 7b. Study notes [K + S]

**Frame-rate vocabulary**
- **On ones / twos / threes:** a new drawing every 1, 2 or 3 film frames at 24 fps, i.e. 24, 12 or 8 drawings per second.
- **TV anime** mixes 2s and 3s, holding keys for emphasis.
- **[S] GG Xrd and TV anime:** GG Xrd copies this choppiness deliberately. TV anime ran at 12 or even 8 fps.

**Converting to 60 fps games**

| Drawings per second | Game frames per drawing |
|---|---|
| 12 | 5 |
| 8 | 7.5 (alternate 7 and 8) |
| 10 | 6 |
| 15 | 4 |
| 6 | 10 |

**Fighting-game timing [K + S-weak]**
- **Hitstop** freezes both attacker and target for a few frames on contact; more frames means a heavier hit.
- **Anticipation** is held longer than the strike.
- **Smear frames:** 1 frame of stretched, blurred or multiplied shapes sells speed between two poses.

**Pixel animation [K]**
- **Fewer frames, stronger poses:** a 4–8 frame cycle with clear keys beats a 16-frame mushy one.
- **Pixel-sized motion:** sub-pixel motion is impossible, so motion is planned in whole pixels; 1-px bobs are visible and meaningful.
- **Animate the silhouette:** small interior changes vanish at 1×.

**Squash & stretch:** preserve volume (`sx × sy ≈ 1`). Cute and bouncy characters take more of it; heavy and armoured ones less.

**Impact frames (anime):**
- **What:** 1–3 frames of a high-contrast, inverted or 2-tone full-screen image at the moment of a big hit.
- **When:** used in ultimates and finishers.

### 7c. Direction for Tokonmon [D]

**Global rules**
- **Gameplay at 60 fps; bodies stepped.**
  - 3D Tokonmon pose at **12 fps** (5 game frames per pose; bible).
  - Human sprites use the per-animation rates below.
  - VFX flipbooks run at **12 fps** (fire, water, sparks), so they match the bodies.
  - **Root motion, camera and particles** move at 60 fps, snapped to art pixels when drawn.
- **No in-betweening.** Every pose is a drawing (sprites) or an authored key (3D). Easing exists only in *how long* poses are held.
- **Music sync (Echo, bible):** dance and taunt loops are built in **multiples of one beat**.
  - At 120 BPM a beat is 0.5 s = 6 poses at 12 fps.
  - Loops are 12 or 24 poses (2 or 4 beats).
  - The animation clock locks to the beat by stretching or shrinking holds by ±1 game frame.

**Human sprites (64×64 canvas; feet pivot at (32, 60); adults 48–54 px tall)**

| Animation | Frames (per direction) | Timing | Notes |
|---|---|---|---|
| Idle | 4 | 250–300 ms each (≈1.1 s loop) | 1-px shoulder/chest rise; hair or clothing tips move 1 px on frame 3. **Blink:** 1 frame, 100 ms, random every 3–5 s |
| Walk | **6** (contact, down, pass, contact, down, pass) | **100 ms each** (0.6 s per 2 steps) | Body bobs 1 px on the "down" frames. **Planted foot travels ≈13–14 px per step** (45 px/s at 1.4 m/s) so feet don't slide. NPC fallback: 4 frames at 150 ms |
| Run | 6 | 70–80 ms each | Forward lean 1–2 px, 2-px bob, arms pumping; 1 airborne frame per step |
| Talk (overworld) | 2 | 120 ms | Head bob 1 px, used while a speech bubble types |
| Emotes | 4–8 | 80–120 ms; final pose held | wave, nod, laugh, cheer, surprised, angry, sad, think, love, sleep. Each pairs with an **in-world emote bubble** (12×12 px icon: `!` `?` `♪` `anger-vein` `sweat-drop` `…` `heart` `zZ`) that pops in 3 frames (60% → 115% → 100%) |
| Sit / stand | 3 | 80 ms | For counters, tables and benches (zoom-in entry) |
| Interact / reach | 3 | 80 ms; hold the last | Doors, signs, phone |
| Phone raise | 4 | 70 ms | Signature move: the phone is the UI |
| Hurt / knockdown (rare, story) | 3 + hold | 60 ms | |
| Bond pose (bracelet beam) | 6 | 83 ms (12 fps) | Synced with the Tokonmon's bond animation |

**Dialogue portraits (96×96 bust, ≤32 colours)**
- **Expressions:** at least **8**: neutral, happy, laugh, angry, sad, surprised, embarrassed/blush, determined. Add a signature 9th per character (Moshi: soft smile with cat; Thrash: sneer).
- **Blink:** 2 frames (half, closed), 60 ms each, random every 2–5 s.
- **Mouth:** 3 frames (closed, half, open) at 8–10 fps, synced to text blips.
- **Entrance:** a 3-frame slide-in with a 2-px overshoot.

**3D Tokonmon (stepped at 12 fps; voxel rig in `anim.js`)**

| Animation | Poses at 12 fps | Duration | Notes |
|---|---|---|---|
| Idle loop | 8–12 | 0.67–1.0 s | Breathing squash ≤5%; element secondary motion (flames, bubbles, leaves) also stepped |
| Quirk idles | 8–16 | 0.7–1.3 s | Existing `quirk` set (headbang, shakeoff, sniff…); every 5–12 s |
| Walk | 8 | 0.67 s | Quadrupeds: trot; bipeds: 2 steps per loop; ground contacts on poses 1 and 5 |
| Run | 6 | 0.5 s | 1–2 airborne poses with 10–15% stretch |
| Attack (basic) | anticipation 2–3 (hold the last for 2 beats = 167 ms) → **smear 1** → **impact 1** (held through hitstop) → follow-through 2–3 → recover 2 | ~0.6–0.9 s | Squash **20–30%** on anticipation for cute forms, ≤10% for golems (Fiftystone, Heartbox) |
| Charge (Pyro charge, Hydro aim) | loop of 4 + aura flipbook | until released | Aura pulses on the beat when music sync is active |
| Hit / hurt | **flash 2 game frames white** → 2 poses knockback → 1 recover | ~0.3 s | Knockback 2–6 art px by hit weight |
| Dodge | 1 anticipation → 2 move (smear) → 1 land squash | ~0.33 s | |
| Parry (Geo) | 1 snap pose held + spark VFX | 0.25 s hold | Freeze both for 6 game frames |
| Faint | 6–10 | 0.5–0.9 s | Wobble → fall → **1 small bounce** → KO eyes (x x) from `model.js` expressions |
| Emote moves (taunt, dance, shake) | 12–24 | 1–2 s (2–4 beats) | Beat-locked |
| Switch in / out | 6 | 0.5 s | Soul-stone beam materialise: silhouette fill → colour (dither dissolve) |
| Evolution | custom | 3–6 s | Silhouette flashes accelerating 4 → 8 → 12 fps, then a full-screen white impact |

**Impact and hit feel (all 60 fps game frames)**

| Event | Hitstop | Screen shake | Extras |
|---|---|---|---|
| Light hit | 4 frames (67 ms) | 1 art px, 6 frames | White flash 2f |
| Medium hit | 6 frames (100 ms) | 2 px, 8 frames | + spark burst |
| Heavy / critical | 9–12 frames (150–200 ms) | 3 px, 12 frames, decaying | + 1-frame **2-tone impact frame** (element colour + `#2e222f`) |
| Ultimate finisher | 18–24 frames (300–400 ms) | 4 px, 20 frames | 2–3 frame impact frame sequence, radial speed lines (existing `uSpeed`), chromatic aberration ≤ 2 px |
| Steam explosion (Hydro + Pyro reaction) | 10 frames | 3 px | White-out flash 3f, then a steam-cloud flipbook (8 frames at 12 fps) |

Screen shake uses **integer art-pixel offsets** only, biased along the hit direction.

**Smears (choose per move)**
- **Stretch smear:** a 1-pose mesh stretch of 1.3–1.8× along the motion.
- **Multiples:** 2–3 duplicate limbs in the same pose (solid, or 50% checker dither; never alpha-blended).
- **Arc smear card:** a hand-drawn 2-frame crescent in the element colour.

**Cut-ins** (bonding, ultimates, evolution; 192×108 art-px banner, or full-width)
- **Motion:** slide in over 3 frames (anticipation offscreen → 8-px overshoot → settle).
- **Hold:** 0.6–1.0 s, with a 2-frame eye glint.
- **Exit:** slide out over 2 frames.
- **Background:** element colour + speed lines.

**Do**
- Do block every animation as key poses first (silhouette readable), then add breakdowns, and **preview in-engine at real size and 12 fps** before polishing (t3ssel8r workflow).
- Do exaggerate: anticipation longer than the action, an impact pose held, recovery lazy.
- Do sync Echo-type and Elite Four / Champion battle animations to the music beat.

**Don't**
- Don't play 3D Tokonmon at 60 fps interpolation, even "just for this move".
- Don't move a character's body sub-pixel while it is in a hold. Holds are perfectly still, except for secondary loops.
- Don't use alpha-blended motion trails on sprites. Use dithered or solid multiples.

---

## 8. Lighting & effects in pixel art (bloom, light shafts, neon, rain, fog, dust, petals, fire, water)

### 8a. References
Mostly [K]; [S] entries come from §1–§2.

| # | Source | What to study |
|---|---|---|
| 1 | Octopath Traveler 1/2, DQ3 HD-2D [S] | Effect-attached point lights, dust motes, grass sway, diorama blur |
| 2 | Sea of Stars [S] | Day/night dynamic light; sprite shadows follow the sun or moon |
| 3 | Eastward [S] | 3D lighting over pixel art; dense urban light pools |
| 4 | The Last Night (Odd Tales) [K] | Neon rain city in pixel art with 3D lighting and reflections |
| 5 | Katana ZERO (Askiisoft) [K] | Neon pixel palettes, VHS-style flashes, impact frames |
| 6 | Kingdom Two Crowns [K] | Pixel water reflection strip with ripple offsets |
| 7 | Hyper Light Drifter (Heart Machine) [K] | Pixel light shafts, dithered fog, limited palettes |
| 8 | VA-11 Hall-A, Coffee Talk [K] | Rain-on-window, neon interiors at night |
| 9 | Makoto Shinkai films (Your Name, Weathering With You) [K] | Neon reflections on wet streets, rain glints, light bloom. Colour and light study only |
| 10 | Unity Learn: 2D Lighting for Pixel Art [S] | https://learn.unity.com/course/2d-lighting-for-pixel-art |
| 11 | Light the Sprite (EG 2025) [S]; normal maps for pixel art (arXiv 2212.09692) [S] | Sprite light maps |

### 8b. Study notes [K + S]

- **Two kinds of glow in pixel art:**
  - a **painted halo**: a 1–2 px ring of a lighter, more saturated colour drawn around the source
  - an **engine bloom**: a soft, high-resolution glow
  - HD-2D uses the second heavily; pure pixel art uses only the first; the best results use both.
- **Light shafts in pixel art** are banded (3–4 steps) and often dithered at the edges, with dust motes that only show inside the shaft.
- **Rain in pixel art:** thin diagonal streaks of 1 px width, in 2–3 depth layers (near = longer, brighter, faster), with small splash sprites on the ground. Wet surfaces darken and reflect lights as **vertical streaks**.
- **Fog in pixel art:** layered bands of colour (quantised) rather than smooth gradients. Height fog in valleys; distance fog toward the sky colour.
- **Fire:** a hand-drawn flipbook of 6–8 frames, with a ramp from white or yellow core to red edges, then dark smoke. It flickers the light around it.
- **[S] HD-2D lesson:** effects become convincing when they **cast light and shadows** (Octopath point-light-per-effect), and when the **world has ambient motion** (DQ3 grass and dust).

### 8c. Direction for Tokonmon [D]

**Bloom (two-tier)**
- **Tier 1, painted:** neon tubes, lanterns and screens carry a **painted 1-px halo** in their texture: core near-white tinted (`#fff0ff` magenta tube, `#e6ffff` cyan tube) → 1 px saturated hue → 1 px darker halo.
- **Tier 2, engine:** HDR emissive values: neon **2–4**, lanterns and windows **1.3–1.8**, fire **2–3**, VFX cores **3–6**. Threshold **1.0** (knee 0.6, as implemented).

| Engine bloom intensity | Value |
|---|---|
| Day | 0.25–0.35 |
| Dusk | 0.7–0.8 |
| Night | 0.9–1.0 |
| Interiors | 0.5 |

- **Placement:** compute bloom from the low-res HDR buffer and composite it at display resolution (the "HD" glow over crisp pixels). Implemented: the present pass keeps a soft bloom.

**Light shafts (god rays)**
- **Build:** additive **3D cards** (quads in the set) with a pixel-art texture: 3–4 bands plus a dithered edge, opacity **10–25%**.
- **Motion:** opacity breathes ±5% over 4–6 s.
- **Where:** forests (Minoh), interior windows (dojo, café), the stadium tunnel, the castle park at dawn.
- **Dust motes:** **1-px particles** in the key-light colour (2 shades), drifting 2–6 px/s with random twinkle. They are **visible only inside shaft volumes and light pools** (masked).

**Neon signs (Osaka 2050 identity)**
- **Sign anatomy:** tube core 1–2 px + painted halo (above) + engine bloom + a **coloured point light** (range 3–6 m) that tints nearby walls, ground and actors.
- **Flicker:** 1 sign in 5–8 has a fault: off for 2–4 frames at random, every 2–8 s, or a buzzing 2-frame alternation. Flicker updates at 12 fps steps.
- **Animated signs:** 2–6 frame loops at **6–8 fps** (chasing borders, a blinking arrow, a waving Tokonmon mascot).
- **Text:** in-world signs use Japanese + English (MAPS.md); pixel font 7–12 px tall for readable signs, decorative glyphs on far signs.
- **Wet-ground reflections:** a planar or screen-space reflection of emissives, **stretched 2–3× vertically**, broken into horizontal rows with a sine row offset (1–2 px, 4–6 s period). Reflection intensity 30–50% on wet asphalt, 60–80% on canal water.

**Rain**
- **Streaks:** 1 px wide, 4–8 px long (near layer) or 2–4 px (far layer), angled 10–15° with the wind.
- **Colour:** `#c7dcd0` (day) or `#8fd3ff` (night) at 60–80%. Near-layer streaks catch neon colour when they pass a light (tint by the nearest emissive).
- **Count:** 300–600 visible. Positions snap to art pixels; a streak lives about 0.3–0.5 s.
- **Splashes:** a 3-frame sprite (2×1 → 3×2 → ring 5×2) at 12 fps on ground and props.
- **Puddles:** 4-frame ripple rings.
- **Wet look:** albedo −20–30%, emissive reflections on (above).
- **Windows** (interior during rain, Coffee Talk mood): droplets run down in 1-px paths with 2-px heads.

**Fog and haze**
- **Kinds:** distance fog toward the scene fog colour (§6), plus height fog in the safari valleys, the canal at night, and the dawn farm.
- **Quantise:** fog amount into **4 bands with Bayer-dither transitions**, so the fog itself reads as pixel art.
- **Mist cards:** slow scrolling (2–4 px/s) with dithered edges, 15–30% opacity.

**Petals and leaves**
- **Castle Park sakura:**
  - **Look:** petals 3×2 to 4×3 px, 2 shades (`#eaaded`, `#ed8099`), plus `#ffffff` on some.
  - **Spin:** a 4-frame flip at 8–12 fps.
  - **Motion:** fall 10–20 px/s, sine sway amplitude 4–8 px over a 1.5–2.5 s period.
  - **Density:** 20–40 on screen; ground accumulation on `k` tiles.
- **Minoh maples:** 4×4 px, `#ea4f36 #f57d4a #f9c22b`, slower and more tumbling (6-frame flip).
- **Fireflies (Hotarumi habitats):** 1-px `#fbff86` cores with 3×3 dithered glow, pulsing at 0.5–1 Hz, emissive 2 → bloom.

**Fire (Pyro, Kagarou, grills, braziers)**
- **Flipbook:** 6–8 frames at **12 fps**.
- **Ramp:** core `#ffffff`/`#fbff86` → `#f9c22b` → `#fb6b1d` → `#e83b3b` → `#ae2334` edge → smoke `#3e3546` → `#625565` (dithered fade).
- **Light:** every fire is a light; intensity jitters 0.85–1.15 **in 12 fps steps**.
- **Embers:** 1-px `#f9c22b`/`#fb6b1d` particles rising 15–30 px/s with sideways drift, life 0.5–1.2 s.
- **Chilichick's breath:** short bursts (4 frames) with a **2-tone impact flash** on contact.

**Water**
- **Surfaces:** canal, pond and stream are 3D planes with: a pixel ripple texture (2–3 tones), **1-px foam lines** at walls and edges, reflections (above), and caustic flicker in the shallows (`#8ff8e2` 1-px web pattern, 4 frames at 8 fps).
- **Minoh Falls:** scrolling vertical flipbook columns (8 frames) + spray particles + mist card + rainbow card (dithered, 10%) in sunlight.
- **Bubblion's water ball:** **dithered 50% translucency** (not alpha blending) + 1-px rim highlight + 2 specular dots.

**Destruction and dust (battle props)**
- **Debris chunks:** 2–4 px, in the prop's palette, bouncing once with a 1-px shadow.
- **Dust puff:** a 5-frame flipbook at 12 fps (`#c7dcd0 → #9babb2`, dithered fade).

**Bonding effect (signature)**
- **Soul-stone beam:** a 3-px-wide beam (core `#ffffff`, edges in the element emissive) from bracelet to Tokonmon, with an 8-frame wave pattern scrolling along it.
- **Aura:** a stepped 12 fps flame-like outline, 2 px outside the silhouette, in the element emissive.
- **Accessories:** the trainer's accessories appear on the Tokonmon (bible).

**Do**
- Do give every emissive both a painted halo and an engine glow. Do make effects cast light.
- Do quantise light and fog into visible steps, and keep particles 1–4 px with stepped flipbooks.
- Do keep the effect count per screen readable: in battle, VFX must never hide the two Tokonmon's silhouettes for more than 0.3 s.

**Don't**
- Don't use smooth alpha-blended smoke or particle soup, or high-res sprite effects over pixel art (mixels).
- Don't let bloom wash out faces. Clamp bloom on character pixels, or keep character emissive < 1.0 except eyes and element parts.
- Don't use realistic lens flares. One stylised pixel star (4-point, 5–9 px) on very strong lights is the maximum.

---

## 9. STYLE GUIDE: one-page summary (everyone follows this)

**Pixel grid**
- **Internal render:** **pixelH 270–360** (street 320, interiors 270, wide 360), integer upscale, sharp-bilinear present. One art pixel is the unit of everything.
- **World density:** **32 art px = 1 m at the focal lane** (1 tile = 32×32; 1 floor = 96 px). Every texture, card and sprite is authored **1 texel = 1 art px at its depth**.
- **Zoom** changes the integer upscale (k), never the density. **Close-ups use bigger drawings (64–96 px/m sets), never bigger pixels.**
- **No mixels:** never mix pixel sizes on screen. No AA in the pixel buffer. Nearest filtering.

**Characters**
- **Humans:** chibi ≈3 heads; adults **48–54 px**, kids 38–42, big 60 px; **64×64 frames**, feet pivot (32, 60); **4 directions**; ≤16 colours.
- **Portraits:** 96×96, ≤32 colours, ≥8 expressions + blink + 3 mouth frames. Close-up drawings 140–170 px tall.
- **Tokonmon 2D sprites:**

| Use | Size | Frames / colours |
|---|---|---|
| Icon | 32×32 | 2 frames |
| Team card | 64×64 | n/a |
| Dex / scan | 96×96 | 8–12 frame idle, ≤20 colours |
| Cut-in | 192×108 | n/a |

- **Tokonmon 3D:** stepped **12 fps**; every model must read at its overworld size (18–29 px for base forms).

**Outlines**
- **Exactly 1 art px**, **selout**: the darkest step of the adjacent colour, hue-shifted toward violet; the lit side may go one step lighter.
- Never `#000000`; the darkest neutral is `#2e222f`.
- The engine draws 1-px depth outlines on 3D, plus crease highlights at 50%. Outlines fade off beyond ~30 m and inside DOF blur.

**Shading**
- **3D:** 2 hard bands (lit / hand-picked hue-shifted shadow) + optional deep band + 1–2 px glints + 1-px hard rim under strong back or side light.
- **Sprites:** HL · Base · Shade 1 · Shade 2 · Outline (≤5 values per material). Baked light is **top-front**.
- **Hue shift:** shadows +10–20° toward violet or blue per step; highlights toward yellow. Skin shadows go rose.
- **No:** gradients, pillow shading, banding, random dither, soft shadows.

**Palette**
- **Master:** **Resurrect 64 + 10 emissives** (from Endesga 64). Scene mood comes from **light and grade** (§6 tables).
- **Max 3 neon hues per screen.**
- **Element colours** follow the §6 element table everywhere (VFX, aura, phone, dex).

**Animation**
- 60 fps game. **Tokonmon poses at 12 fps** (hold 5 frames) with **no interpolation**. VFX flipbooks at 12 fps.
- **Human walk:** 6 frames at 100 ms; run 6 at 70–80 ms; idle 4 at 250–300 ms; emotes 4–8 at 80–120 ms.
- **Attacks:** anticipation held → 1 smear → impact held through **hitstop** (light 4f, medium 6f, heavy 9–12f, ultimate 18–24f) → follow-through.
- **Shake** in integer pixels. Hit flash white for 2 frames.
- **Beat-lock** dances and emotes to music (loops of 2 or 4 beats).

**Camera, DOF, light**
- **Camera:**
  - **street:** FOV 24°, pitch 12–18°
  - **interior:** FOV 28–32°, pitch 18–25°
  - **battle:** FOV 30–35°, pitch 25–35°, free orbit only in skills, ultimates and cinematics
  - **counter (first person):** FOV 38–45°, pitch 0–5°
  - **table close-up:** pitch 40–55°
- **Exploration camera:** pans parallel to the image plane, **snapped** with sub-pixel compensation; **no rotation**.
- **DOF:** focus on the player lane, sharp ±2 m, max blur 3 px midground, 5–6 px far, 4–6 px foreground. Tilt band (top 18%, bottom 10%) only in wide or establishing shots. Never blur the player, the active NPC, or text being read.
- **Light:** every effect is a light. Sprites get a contact blob shadow (40%) + key-light cast shadow + 3-step tint + 1-px rim from strong lights.
- **Bloom:** threshold 1.0; day 0.3 / dusk 0.8 / night 1.0 / interior 0.5. Neon emissive 2–4. Painted halos on all emissives.
- **Grade:** saturation 1.05–1.15 (night 0.95), vignette 0.10–0.30. No film grain on pixels. Chromatic aberration only on big impacts.

**Scenes**
- Front-facing **stage sets**: sky / skyline cards / back block / facades (parallel to camera) / 2–3 walk lanes / sparse dark foreground (≤15% coverage).
- **Ambient life:** ≥2 ambient motion systems per scene.
- **Detail:** 3–5 tile variants + decals per surface. Detail density, not resolution.
- **Almost no UI:** speech bubbles, in-world signs, menu tags, the jumbotron and **the phone**.

**Originality**
- Study, then transform. No tracing, no ripped-sprite edits, no recognisable characters, logos or real trademarked signage.
- Every asset links to its study notes in `docs/refs/*.md`.

---

## 10. For the engine programmer: checklist

These are mapped to the current code (`src/gfx/pixel.js`, `renderer.js`, `materials.js`, `particles.js`, `vfx.js`). Items marked [exists] are already implemented; verify they meet these targets.

**Render pipeline**
- [ ] [exists] Low-res HDR target, nearest sampling, no MSAA (`PixelPost`, `msaa: 0`).
  - [ ] Choose `pixelH = canvasH / k` with integer k nearest each scene's target (360 / 320 / 270 / 216). Expose `setZoomStop(k)`.
  - [ ] Pinch zoom tweens between stops in 0.25–0.35 s and never rests on a non-integer stop.
- [ ] [exists] Sharp-bilinear present with sub-pixel `uOffset`.
  - [ ] Snap the camera translation **in the image plane at the focal-lane depth** (`worldPerPixel = 2·D·tan(fov/2)/pixelH`; already computed near line 187 of `pixel.js`) and pass the remainder to `uOffset`.
  - [ ] Disable snapping during cinematic camera moves that rotate.
- [ ] Exploration rigs: **no yaw or pitch changes** while exploring. Per-scene camera presets (FOV, pitch, distance, bounds) from the §4 table. The street default is FOV 24° with distance chosen so the visible height = `pixelH / 32` m.

**Outlines**
- [ ] [exists] 1-px depth outlines on the nearer object, selout tint `(0.55, 0.42, 0.62)`, fade with distance and DOF.
- [ ] Add a **normal-discontinuity crease pass** (needs a low-res normal target or packed normals). Convex creases get a **lighter highlight** at ~50% (t3ssel8r/Peltola look); concave ones get a 50% dark line.
- [ ] Linearise depth before thresholding ([exists] `lin()`); keep the slope-corrected threshold.

**Materials**
- [ ] [exists] Toon ramp with a nearest gradient map.
  - [ ] Replace "lit × ramp" with **per-material shadow colours** (`uShadowColor` per palette key, or a shadow-colour vertex attribute) so shadows are *hue-shifted picks*, not darkened base colours.
  - [ ] Hard terminator: `step(threshold + vertexBias, NdotL·shadow)`, smoothing 0.
  - [ ] A **threshold-bias attribute** (GG Xrd style) baked from `voxel.js` AO and paint regions (belly, top).
- [ ] Optional deep band (3rd step) per material. Hard rim `step()` ([exists] fresnel at 0.6–0.66; make the colour = light colour, and only when a strong back light is present).
- [ ] Emissive materials: HDR values per §8 (neon 2–4, lanterns 1.3–1.8, VFX 3–6).

**Sprites (humans, 2D props, cards)**
- [ ] Y-axis billboards, **alpha-test cutout (`alphaTest ≈ 0.5`), `depthWrite: true`, no blending**, so DOF and outlines see them.
- [ ] Screen-position **snap to the art-pixel grid** (round the projected anchor in clip space).
- [ ] **Scale compensation** in the walk lanes so sprites render exactly 1 texel = 1 art px at any lane depth (±3 m).
- [ ] 4-direction frame pick from the camera-relative yaw (front 315–45°, right 45–135°, back 135–225°, left 225–315°).
- [ ] Lighting: tint = ambient + Σ(light colour × attenuation), quantised to 3 steps; plus a 1-px **rim mask** (alpha-edge detection, on the side facing the strongest light above an intensity threshold).
- [ ] Shadows:
  - contact blob ellipse (40%, scene shadow tint)
  - key-light cast shadow from a **light-facing proxy quad** or a camera-facing caster pass (avoid the self-shadow bug)
  - receive shadows

**Depth of field and tilt**
- [ ] [exists] Pixel-space DOF with focal depth + tilt band.
  - [ ] Focus = the player's lane depth (smoothed 0.3 s); sharp zone ±2 m; max CoC 3 px midground, 5–6 px far, 4–6 px near foreground.
  - [ ] Tilt band (top 18%, bottom 10%) only in wide or establishing shots.
- [ ] Render speech bubbles, the sign being read, the interaction marker and the phone **after** DOF (never blurred).
- [ ] Experiment, owner to choose: in-focus pixels nearest, blurred pixels sampled **bilinear at display resolution** for a smoother "HD" bokeh.

**Post and grade**
- [ ] [exists] ACES, lift/gain/saturation/contrast, vignette, flash, letterbox, speed lines, chromatic aberration.
  - [ ] Load **per-scene grade presets** from §6 (day, dusk, night, forest, interior, stadium, dawn) and blend presets with time of day.
- [ ] [exists] Ordered-dither quantise. Keep `uLevels ≥ 32` on medium and high. Check the low preset against skin ramps. Dither is a gradient smoother only.
- [ ] Optional: a **palette-lock LUT** mode (map the final colour to the nearest master-palette colour) for cut-ins and UI screenshots. Test it; don't enable globally without owner sign-off.
- [ ] No film grain at art-pixel scale on characters. If grain is kept, ≤ 0.02 and only on backgrounds.

**Lights and shadows**
- [ ] Shadow map texel density ≥ 32 texels/m in the play area. **Hard shadows** (no PCF blur, or a 1-step dithered edge). [exists] The sun follows focus, snapped to shadow texels.
- [ ] **VFX lights:** each big effect spawns a point light (range 3–6 m) whose intensity animates in **12 fps steps**. Pool and cap: max 8 dynamic lights on mobile; extra effects borrow the nearest light.
- [ ] Neon signs: emissive mesh + baked or cheap point light + optional flicker (12 fps stepped).

**Animation timing**
- [ ] Global `POSE_HZ = 12`: the 3D rig samples poses on a 12 fps clock (pose index = floor(t·12)). **No interpolation between samples.** Root motion stays at 60 fps.
- [ ] Hitstop system: freeze attacker and target pose clocks for N frames (4 / 6 / 9–12 / 18–24). Camera and particles keep running.
- [ ] Screen shake: integer art-pixel offsets, decaying, biased along the hit vector.
- [ ] Beat clock: when music sync is on, align dance and charge loops to beats (stretch holds ±1 frame).
- [ ] Impact frame: a full-screen 2-tone shader mode (threshold luminance → element colour / `#2e222f`) for 1–3 frames.

**Particles and VFX**
- [ ] Particles render as **1–4 px quads snapped to the art-pixel grid**, flipbooks at 12 fps, cutout or dithered alpha (no smooth alpha blending on the pixel buffer, except additive emissive glows).
- [ ] Ambient systems per scene: sakura, maple, fireflies, dust motes (masked to light volumes), rain (2 layers + splashes + puddle rings), mist cards, steam.
- [ ] Rain wet mode: albedo −25%, emissive reflections stretched 2–3× vertically with a row-offset shimmer.

**Scenes and camera UX**
- [ ] Stage-set layer conventions (§4 table); BG cards scaled so 1 texel = 1 art px at their depth.
- [ ] Pan (drag + inertia 0.85–0.9 + bounds spring), pinch zoom stops, follow camera (25% dead-zone, 1.5–3 m look-ahead), return-to-follow after 2.5 s.
- [ ] Tap-to-walk: raycast to the lane navmesh; interactables take priority; a 4-frame tap ring; walk 45 px/s, run ~100 px/s; sort by lane z.
- [ ] Zoom-in scene transition: dolly + pitch blend 0.6–0.8 s (cubic in-out) + focus pull → **Bayer pixel dissolve** (8–10 frames) into the close-up set → reverse on exit (0.5 s).

**Performance (mobile)**
- [ ] The low preset (pixelH 270) must hold 60 fps on mid-range phones. The DOF tap count and bloom mip count scale with the preset.
- [ ] Shadows: one cascade for the play area; props beyond 25 m don't cast.

**Review tooling**
- [ ] Extend `tools/shot.mjs` captures with `&grade=day|dusk|night|interior|forest|stadium` and `&zoom=k`, so artists can run the palette "lighting check" and test every asset at real pixel size.

---

## Appendix A: Follow-up searches to run when budget allows

1. Slynyrd Pixelblog "color palettes" / hue-shift ramp specifics; Saint11 smear and impact cards; Derek Yu tutorial: confirm the §3 numbers and URLs.
2. Lospec: verify the hex lists for Resurrect 64, Endesga 32/64, Nyx8, Twilight 5, Sweetie 16, Apollo, AAP-64.
3. Octopath sprite sizes (Spriters Resource rips) and the DQ3 HD-2D camera FOV: calibrate the 48–54 px chibi target.
4. GG Xrd slides PDF: confirm the animation frame-rate figures, vertex-colour channel assignments and normal-editing details.
5. t3ssel8r YouTube videos ("Pixel Art in 3D", shaders, camera): confirm the crease-highlight rule and the camera-snapping method.
6. VA-11 Hall-A and Coffee Talk internal resolution and portrait sizes; Good Pizza Great Pizza counter layout; Fallout Shelter zoom UX.
7. The Last Night and Katana ZERO neon pixel lighting breakdowns; pixel rain tutorials.
8. Dead Cells 3D-to-pixel pipeline article (frame rates, no-AA rendering, normal maps).
9. Pokémon curry and picnic camera transitions; Persona food scenes (camera timing of the cut-ins).
