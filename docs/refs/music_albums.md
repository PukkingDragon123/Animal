# Music, Songs, Artists & Album Covers: Reference Study and Direction

Companion to `docs/TOKONMON.md` §3 (roster), §4 (characters & trainers), §6 (combat, stadium, League,
music sync) and §10 (audio). This file holds the **reference study notes** for every album cover, song and
artist used in Tokonmon, plus **design direction** for pixel/3D artists and **original-track specs** for the
composer of the procedural Web Audio engine (`src/audio/music.js`). If this file and the design bible ever
disagree, **the bible wins**. Nothing here adds Tokonmon, characters or mechanics; anything that goes beyond
presentation is marked *(proposal)* for the owner to accept or reject.

Every item has four parts: **(a) References**, **(b) Study notes**, **(c) Direction for Tokonmon**,
**(d) Do / Don't**.

---------------------------------------------------------------------------------------------------

## 0. Read me first

### 0.1 Research status and tags

| Tag | Meaning |
|---|---|
| **[S]** | The fact or page came up in a WebSearch in this research pass. The note repeats what the search result said. |
| **[K]** | Researcher's background knowledge. The fact is widely documented but was **not** re-checked in this pass, and the URL (usually a canonical Wikipedia page) was **not opened**. Check it before final art or music lock. |
| *(verify)* | A specific detail that is uncertain even from memory. Confirm it first. |
| `~#hex` | An approximate colour from descriptions and memory. Images could not be downloaded or viewed. Artists must eyedrop a licensed reference and adjust before locking a palette; these values are mood anchors, not measurements. |
| *(proposal)* | A presentation or design suggestion that goes beyond the bible's wording. The owner decides. |

**Coverage, stated honestly.** Image downloads and page fetches are blocked, so every visual fact was
*described* by search-result text, never *seen*. The session's web-search budget (200 calls per turn,
shared by every agent working in parallel) ran out after 33 searches in this pass, 29 of which returned results. By then they had covered:
the Beatles covers (Abbey Road, Sgt. Pepper, Yellow Submarine, Revolver, Rubber Soul, the White Album, Let It
Be, the Strawberry Fields / Penny Lane single, Ram), the Queen visuals (the crest, News of the World, The Game,
Innuendo, Queen II, Live Aid), Purple Rain, the RHCP logo, By the Way, Californication, Stadium Arcadium, In
Utero, Nevermind, Heart-Shaped Box and Graduation. **Everything after that, and every musical figure in
this file (BPM, keys, instruments), is [K].** BPMs and keys of real songs are listed only to calibrate
*feel*. They are approximate and were chosen to differ from our own tracks. The §V Verification backlog lists the exact searches to run
when the budget allows.

### 0.2 Originality contract (bible §1 and §10, made concrete)

**Music. The composer may take:** tempo range, groove family, instrumentation, production tricks
(double-tracking, reversed cymbals, tape-loop textures, stomp-clap layering), arrangement shapes
(loud-quiet-loud, ballad-to-rock switch, medley chaining, call-and-response) and harmonic *vocabulary*
(for example "a bVII–IV–I cadence", "minor iv for wistfulness", "Phrygian b2 riffing").

**Music. The composer must never take:**
- a melody, hook, riff (pitch **and** rhythm), bass line or solo phrase;
- a lyric, a spoken line or a sampled sound;
- a drum intro or fill that people recognise;
- a chord progression *together with* its signature rhythm and voicing.

**Music, rule of 3.** Every cue must differ from the song that inspired it in at least three of these:
- tempo (by at least 8 BPM);
- key;
- meter or feel;
- lead instrument;
- melodic contour;
- harmonic rhythm.

Also, no run of 4 or more consecutive pitches with the same rhythm may match a known song.
**Self-test:** play the cue to someone who knows the reference. If they name the song within two bars, rewrite it.

**Visuals. The artist may take:** motif families, colour moods, composition *principles* (frieze, diamond
formation, top light, flat Superflat colour), typographic *principles* (swelling sap terminals, emboss) and
symbolic *methods* (for example, building a heraldic crest out of the members' symbols).

**Visuals, rule of 3.** Change at least three of these:
- subject (Tokonmon instead of people);
- camera or composition;
- palette;
- typography;
- medium (pixel, cel);
- symbol.

Never trace, and never reproduce a cover's layout one-to-one.

**Trademarks and logos: never use them.** This covers:
- the RHCP asterisk;
- the Rolling Stones tongue and lips;
- the Queen crest;
- the AC/DC and Metallica wordmarks;
- Nirvana's condensed wordmark and the smiley;
- Prince's Love Symbol;
- Murakami's smiling flower;
- the Dropout Bear.

Design in-world equivalents instead.

**Real people.** The Elite Four and the Champions are **original tribute-band characters** (bible §4). Do
not draw a likeness portrait of a real musician. Costume cues are fine when filtered through chibi design.
Use **no more than two signature cues of one real person on one character**, and add original traits.

**Text.** No lyrics may appear anywhere: signs, murals, dex entries, dialogue, jumbotron. Song titles appear
only where the bible already uses them as Tokonmon names.

**Protected or sensitive imagery that must be transformed** (each section gives the transform):
- In Utero fetuses and anatomy;
- Heart-Shaped Box crucifix, IV drip and hooded figure;
- Kill 'Em All blood;
- Master of Puppets military graves;
- the Nevermind baby;
- Sticky Fingers crotch;
- Ride the Lightning electric chair;
- the **Red Cross emblem** (legally protected; never use it for nurse characters).

### 0.3 Engine mapping: real instruments to patches in `src/audio/music.js`

The engine is a 16-step-per-bar sequencer (`res: 4`) with chord grids, `rel` (chord-relative degree),
`abs` (note name), `chord` and `drum` modes.
- **Part options:** `vol`, `pan`, `rev`, `dly`, `chorus`, `nudge` (ms offset for double-tracking),
  `int: [in, full]` (intensity layer), `amp: {drive, scoop, cab, post}`, `hp`, `o: {...patch options}`.
- **Drum characters:** `X` accent, `x` normal, `o` ghost, `m`/`M` muted, `O` open hat, `1`–`4` toms,
  `-` hold, `.` rest.

| Real sound | Patch and starting options | Notes |
|---|---|---|
| Rickenbacker 12-string jangle | two `guitar` parts in `chord` mode, amp drive ≤ 1.5. Part 2 is `o:{single:true}`, one octave up, `nudge` 6–8 ms, `chorus` 0.4, plus a quiet `glock` doubling the top note | The octave course plus the slight detune gives the "chime". Keep the decay short. |
| Höfner violin bass (thumpy, short) | `bass`, `o:{wave:'triangle', cut:650, env:1, q:1, sub:0.3}`, staccato `_` on non-phrase-end notes | Melodic counter-lines, not root-pumping. |
| Rock bass (P/J) | `bass`, `o:{wave:'sawtooth', cut:900, env:2, q:2, drive:1.6}` | |
| Flea-style slap | `slap`. Accent `!` or notes above `popAbove` become pops; `x` gives dead notes | Octave pops on the "and"s. |
| Upright / skiffle bass | `upright` | Penny-Lane-ish bounce, Ringo shuffle. |
| Piano (Paul, Freddie) | no acoustic piano patch exists. Use `epiano` at high velocity with `o:{roll:0.012}`, plus a `pluck` octave doubling for honky-tonk | *(proposal)* the composer may add a `piano` patch: FM with ratio 1 plus a short inharmonic hammer noise. |
| Mellotron flute | `flute` (non-shaku), `o:{breath:0.25}`, plus a quiet `pad` triangle one octave below; slight `chorus` | The tape "wobble" is a slow vibrato. |
| Mellotron strings, orchestra | `strings` (chord), `pizz` for cellos and basses pizzicato | |
| Sitar / swarmandal | `koto` with slides `/` and `o:{decay:2}`, over a `drone` tanpura (root + 5th) | The meend slides are the identity. |
| Tabla | `tom` with high pitched `notes`, plus `ka` | |
| Piccolo trumpet / brass band | `lead` (`wave:'square', wave2:'triangle', vib:8, glide:0.02`) one octave up, or `brass` | |
| Hammond / Lowrey organ, Leslie | `pad`, `o:{wave:'square', detune:4}` with part `chorus:0.9` | |
| Queen "guitar orchestra" | three `lead` parts in parallel 3rds and 6ths: `amp:{drive:5, cab:4200}`, `pan` −0.6 / 0 / +0.6, `vib:14`. Use `orn:true` on the harmony voices | Brian May's stacked harmonised lines. |
| Operatic multitrack choir | 3–5 `choir` parts (`vowel` 'a' / 'o'), `chorus:0.6`, `rev:0.35` | Antiphonal L and R stabs. |
| Stomp, clap, gang shout | `stomp`, `clap`, `gang` (`o:{voices:6}`) | The stadium layer. |
| LinnDrum (Prince) | `kick` tight + `snare` tight + `clap` layered on the snare + pitched `tom` + `hat` | Dry, gated, no swing. |
| OB-X synth-horn stab | `brass` in chord mode with staccato, or `pad` saw with `o:{a:0.005, r:0.12}` | Minneapolis "synths instead of horns". |
| Grunge clean verse / dirty chorus | `guitar` at amp drive 1 with `chorus:0.6` / `guitar` with `amp:{drive:6, scoop:-5}` | Same chords, a loud-quiet-loud switch by section. |
| Thrash rhythm guitar | `guitar` in `abs` mode with `m` palm mutes, `amp:{drive:6, scoop:-7, cab:4600}` | As in the existing `battle_punk`. |
| Stadium "supersaw" (Kanye era) | `pad`, `o:{wave:'sawtooth', detune:14}` with `chorus:0.8`, plus `strings` an octave up | |
| Vocoder / robot voice | `choir` with quick vowel changes, layered with a `lead` square at low `cut` | There is no vocoder patch. |
| Taiko, ōendan | `taiko`, `ka` | Japanese stadium cheering (§B4). |
| Tambourine, shaker, snaps | `tamb`, `shaker`, `snap` | |
| Reverse cymbal, swell, hit | exported `fxRiser`, `fxBoom`, `fxShimmer` | Ultimates and transitions. |

### 0.4 Frame-locked tempos (the most important number in this file)

Bible §1: Tokonmon animate in stepped poses at **12 poses/s, each held 2 frames ("on twos")**. One pose lasts 83.3 ms.
A beat contains a whole number of poses only when **BPM = 720 / n**:

| Poses per beat | BPM | Bar (4/4) | 7 s switch | 15 s cooldown | Use |
|---|---|---|---|---|---|
| 4 | **180** | 1.333 s | 21 beats ✓ | 45 beats ✓ | thrash, Team Metallica, frantic finales |
| 5 | **144** | 1.667 s | 16.8 beats | 36 beats = **9 bars** ✓ | Champions (Queen), big anthems |
| 6 | **120** | 2.000 s | 14 beats ✓ | 30 beats ✓ | **default battle tempo**, Elite Four (Beatles) |
| 8 | **90** | 2.667 s | 10.5 beats | 22.5 beats | funk (RHCP), stadium hip-hop (Kanye), pastoral |
| 10 | **72** | 3.333 s | 8.4 beats | 18.75 beats | half-time ballads, a-cappella intros |
| 12 | **60** | 4.000 s | 7 beats ✓ | 15 beats ✓ | power ballads (Purple Rain), doom (Iron Man) |

- At 120 BPM an eighth note is exactly **3 poses**. At 180 BPM it is exactly **2 poses**.
- On a 24 fps VFX layer, 160 BPM (9 frames per beat) and 96 BPM (15 frames per beat) also lock.
- Existing tracks *(proposal)*:
  - `battle_punk` from 184 to **180**;
  - `boss` from 140 to **144**;
  - `battle` at 160 (keep it only if hit VFX run at 24 fps, otherwise move it to 144 or 180);
  - `league` at 120 is already locked.

### 0.5 Family palettes (keep murals and signage coherent)

| Family | Anchor colours (approximate) | Mood |
|---|---|---|
| Beatles: Pepper day-glo | lime `~#9BCB3C`, sky `~#4FA3D9`, vermilion `~#E2432A`, pink `~#E2508E`, braid gold `~#D4A93A` | festive and brassy |
| Beatles: Abbey Road neutrals | asphalt `~#5B5D5A`, stripe `~#ECEAE2`, foliage `~#4E7A3A`, haze sky `~#9DB3C4` | calm and iconic |
| Queen: regal | ivory `~#F3EEDC`, gold `~#C9A227`, crimson `~#B3122E`, royal blue `~#1F3F9A`, black `~#0A0A0A` | operatic and heraldic |
| Minneapolis purple | purple `~#5B2C83`, violet haze `~#7E5BA6`, magenta `~#B0307A`, smoke `~#C9B7D9` | sensual and royal |
| RHCP sunset | chili red `~#D7261E`, sunset orange `~#F28C28`, pool blue `~#2E8BC0` | hot and Californian |
| Grunge | pool blue `~#1D63A8`, caustic `~#9CD3F2`, In Utero cream `~#E7D9B8`, tint red `~#D3202A` | raw and uncanny |
| Metal | black `~#0B0B0D`, blood orange `~#C24A2A`, steel `~#7D8791`, lightning blue `~#2A4FB0` | menacing |
| City pop / Osaka 2050 | dusk `~#FF9A8B → ~#FF6A88 → ~#6A5ACD → ~#2B2D6E`, neon pink `~#FF4FA3`, neon cyan `~#3FF0FF` | nostalgic future |

---------------------------------------------------------------------------------------------------

## Part A: Album covers and visual identities

### A1. The Beatles: *Abbey Road* (1969)

**(a) References**
- [S] uDiscover: "Abbey Road album cover: behind the Beatles' most famous photograph": https://www.udiscovermusic.com/stories/four-beatles-one-zebra-crossing-london-nw8
- [S] The Paul McCartney Project, "The Abbey Road photo session": https://www.the-paulmccartney-project.com/1969/08/photo-shoot-of-the-abbey-road-cover/amp/
- [S] Sotheby's outtake lot: https://www.sothebys.com/en/auctions/ecatalogue/2016/rock-roll-n09587/lot.13.html
- [S] Webgrafikk, "Abbey Road – the road that goes on forever": https://webgrafikk.com/blog/abbey-road-road-that-goes-on-forever
- [K] https://en.wikipedia.org/wiki/Abbey_Road

**(b) Study notes**
- **The shoot [S]:**
  - Shot on 8 Aug 1969 by Iain Macmillan, standing on a stepladder in the road outside EMI Studios while a policeman held traffic. He took six frames.
  - McCartney sketched the idea, Macmillan refined it into a plan, and the session followed that sketch almost exactly.
  - Frame 5 was chosen because it is the only one where all four are walking *in step*.
- **The line-up [S]:** single file, left to right: Lennon (white suit), Starr (black suit), McCartney (barefoot, out of step), Harrison (denim). A white VW Beetle is parked beside the crossing. A street sign was photographed separately for the back cover.
- **Composition [K]:**
  - No text on the front.
  - A tree-lined street recedes to a vanishing point just right of centre.
  - The white stripes make a horizontal band across the lower middle.
  - The four figures form an evenly spaced **frieze**, legs in inverted-V "scissor strides".
  - Soft overcast light with short shadows.
- **Colours** (approximate):
  - sky haze `~#9DB3C4`;
  - trees `~#4E7A3A`;
  - asphalt `~#5B5D5A`;
  - stripes `~#ECEAE2`;
  - suits: white `~#F1EEE4`, black `~#1C1C21`, grey `~#6F7074`, denim `~#3C5878`;
  - Beetle `~#D8D3C4`.
- **Typography [K]:** the back cover's street sign: black sans capitals on white tiles.

**(c) Direction for Tokonmon**
- **Elite Four reveal poster and jumbotron intro *(proposal)*:** the four Beatlet member forms (Lenshorn, McCarapace,
  Harrisun, Starrab) cross an **Osaka scramble crossing** at Umeda at dusk, seen from a low drone angle
  that differs from the original's eye-level street axis. The road is wet with neon reflections (city-pop palette, §0.5).
  - In place of the Beetle, a sleeping **Beatlet** is curled at the kerb. It is a visual pun, not a new creature.
  - McCarapace is the only one without leg-spurs, an Easter egg for the barefoot detail.
- **Walk cycles:** the "scissor stride" is the key pose for the Beatlet family. Use 4 poses on twos, with legs in clear
  inverted-V silhouettes so the stride reads at sprite size.
- **Signage:** Namba street-name plates use the **tiled-plate** principle (white ceramic tiles, black sans,
  grout lines in 1-pixel grey).

**(d) Do / Don't**
- Do: the frieze of four evenly spaced figures; one light-coloured focal figure; neutral overcast palette; the in-step / out-of-step gag.
- Don't: the same left-to-right order of costumes; a street receding to centre-right with a white car at left; the words "Abbey Road"; real faces.

### A2. The Beatles: *Sgt. Pepper's Lonely Hearts Club Band* (1967)

**(a) References**
- [S] The Beatles Bible, Sgt. Pepper: https://www.beatlesbible.com/albums/sgt-peppers-lonely-hearts-club-band/5/
- [S] Rolling Stone, "Beatles' Sgt. Pepper artwork: 10 things you didn't know": https://www.rollingstone.com/feature/beatles-sgt-pepper-artwork-10-things-you-didnt-know-107812/
- [S] V&A collection entries: https://collections.vam.ac.uk/item/O183248 and https://collections.vam.ac.uk/item/O88532
- [S] Good Times, "The truth behind the most iconic Beatles cover": https://www.goodtimes.sc/truth-behind-iconic-beatles-cover/
- [K] https://en.wikipedia.org/wiki/Sgt._Pepper%27s_Lonely_Hearts_Club_Band

**(b) Study notes**
- **Makers and process [S]:**
  - Peter Blake and Jann Haworth built the set, including the life-size cardboard cut-outs, over two weeks in late March 1967. Robert Fraser was the art director.
  - Michael Cooper photographed it in a three-hour session on 30 March.
  - There are **88 figures** including the band.
  - The band wear **day-glo military-style uniforms**.
  - The cover won the 1968 Grammy for Best Album Cover.
- **The drum and the flowers [K]:** the bass-drum skin is painted in ornate Victorian fairground lettering (by fairground artist Joe Ephgrave *(verify)*). A flower bed spells the band name. Wax figures of the band's earlier mop-top selves stand beside them, the **past self beside the new self**.
- **Uniform colours [K]** *(verify)*: Lennon lime `~#9BCB3C`, McCartney sky blue `~#4FA3D9`, Harrison vermilion `~#E2432A`, Starr pink `~#E2508E`. Braid and frogging gold `~#D4A93A`. Sky `~#6FA6D6`. Most cut-outs are sepia or B/W photos (`~#B9A68A`).
- **Composition:** stepped tiers of faces like bleachers, the band centred in front, a foreground "garden" of objects and statuettes. Everything looks flat and cardboard-like, which suits 2D pixel art.

**(c) Direction for Tokonmon**
- **Elite Four costumes (bible §4: "styled after Sgt. Pepper / Abbey Road looks"):** satin marching-band tunics
  with gold frogging, one colour per member, matched to that member's Beatlet form and element:
  - **John (Lenshorn, Echo):** lime;
  - **Paul (McCarapace, Hydro):** sky blue;
  - **George (Harrisun, Pyro):** vermilion;
  - **Ringo (Starrab, Geo):** rose-quartz pink. Pink suits Geo through crystal minerals.
- Shift each hue about 10° away from the reference colours and add an element trim (wave, flame, crystal, sound-ring) so the uniforms are not copies.
- **Elite Four hall backdrop *(proposal)*:** a tiered wall of cardboard cut-outs of **Tokonmon's own cast**:
  - Takoyaki Taisho, Granny Fuku, Dr. Hoshino, Lumi★, Ms. Aoi, Master Genryu and other townsfolk;
  - farm Tokonmon.

  It becomes an Easter-egg collage of the game itself. In the centre stands a parade bass drum with **original fairground
  lettering** reading "TOKON LEAGUE · ELITE FOUR". A pixel flower bed spells "E4".
- **Past and present beside each other:** each member stands beside a statue of **Beatlet**, the pre-evolution form. This is
  the waxwork idea turned into an evolution theme.
- **Evolution and cut-in frame:** a round drum-skin frame with fairground scrollwork for Beatlet's four evolutions.

**(d) Do / Don't**
- Do: tiers of faces; saturated satin with gold braid; fairground lettering with drop shadows; cardboard-cutout flatness.
- Don't: any real person in the collage; the drum's actual wording or design; four uniforms in the exact original hue set without element trims.

### A3. The Beatles: *Yellow Submarine* (1968 film art)

**(a) References**
- [S] The Paul McCartney Project, Heinz Edelmann: https://the-paulmccartney-project.com/artist/heinz-edelmann
- [S] Offscreen, "A deep dive in a Yellow Submarine": https://offscreen.com/view/A_Deep_Dive_in_a_Yellow_Submarine
- [S] Cartoon Research, Animation Anecdotes: https://cartoonresearch.com/?p=56279
- [S] Lambiek Comiclopedia, Heinz Edelmann: https://www.lambiek.net/artists/e/edelmann_heinz.htm
- [S] Bonhams, Edelmann concept drawing: https://wwtest.bonhams.com/auction/25996/lot/183/the-beatles-a-rare-concept-drawing-by-heinz-edelmann-for-the-film-yellow-submarine-1967
- [K] https://en.wikipedia.org/wiki/Yellow_Submarine_(film)

**(b) Study notes**
- **Edelmann's role [S]:** chief designer and art director. He designed the Beatles figures, the Submarine, Pepperland,
  the Blue Meanies, the Flying Glove and most monsters.
- **The look [S]:**
  - His line was unlike anything in earlier animation.
  - Flat 2D designs were animated in a mix of 2D and 3D.
  - Live action and photo cut-outs were mixed in.
  - It draws on pop art and surrealism, with bold colour.
  - Anecdote: the Meanies were meant to be red, but an assistant coloured them blue.
- **Signatures [K]:**
  - flat colour fields with no shading;
  - art-nouveau S-curves and op-art stripes;
  - a painterly rotoscoped sequence;
  - **colour as narrative:** Pepperland is drained to grey and then re-coloured as joy returns.
- **Palette** (approximate):
  - submarine yellow `~#F6C516`, orange trim `~#F08A24`;
  - sea teal `~#2A9D8F`;
  - magenta sky `~#E0458C`;
  - Meanie blue `~#2E4FA8`;
  - Pepperland mint `~#9ED9B4`, lavender `~#B9A2D8`.
- **Typography:** bulbous, hand-drawn psychedelic lettering.

**(c) Direction for Tokonmon**
- **Yellowsub (Hydro/Ferro, bible §3):**
  - The body is a rounded hull: portholes as spot markings, rivet freckles, a periscope eye-stalk and a propeller tail fin.
  - Draw it with Edelmann-like **thick, even outlines and big flat fields**, keeping the 2–3 cel bands the bible requires.
  - **Silhouette rule:** it must read as a *creature first* (a fish or seal-like face and fins), never as a vehicle with a face.
- **VFX:** Yellowsub's water attacks leave a ribbon of flat colour stripes that fade back to normal. This is the
  "colour returns" device in miniature.
- **Elite Four jumbotron intros:** Edelmann-style flat 2D animated stings (art-nouveau curves, op-art stripes), shown
  before each Beatles match.
- **World storytelling *(proposal)*:** a Namba mural that Team Metallica tagged in grey is shown re-coloured after
  the player beats them. Art only, no mechanic.

**(d) Do / Don't**
- Do: flat colour, art-nouveau line, joyful saturation, colour as story.
- Don't: the film submarine's stacked-deck-and-funnel silhouette; Blue Meanie lookalikes; the Flying Glove.

### A4. The Beatles: *Revolver* (1966)

**(a) References**
- [S] Webgrafikk, "Album covers: Revolver": https://webgrafikk.com/blog/uncategorized/album-covers-revolver
- [S] Ultimate Classic Rock, the Revolver cover: https://ultimateclassicrock.com/beatles-revolver-cover/
- [S] Beatles Blogger, "Origins of the Revolver cover art": https://beatlesblogger.com/2021/10/29/origins-of-the-revolver-cover-art/
- [S] The Paul McCartney Project, "Designing the Revolver cover": https://www.the-paulmccartney-project.com/1966/06/designing-the-revolver-cover
- [K] https://en.wikipedia.org/wiki/Revolver_(Beatles_album)

**(b) Study notes**
- **Origin [S]:**
  - Robert Freeman's photo-montage design was rejected, but one of his photos stayed central.
  - Klaus Voormann drew the four faces in **pen and ink, in black and white**, deliberately against the era's full-colour psychedelic portraits.
  - He cut eyes and a mouth from newspapers for George.
  - The collage was assembled from magazine and newspaper clippings.
  - It won the 1967 Grammy for Best Cover / Graphic Arts.
- **Composition [K]:**
  - Oversized heads with gazes pointing different ways.
  - The **hair becomes a flowing mass that fills the square**, with tiny photos nested inside it.
  - A small, thin title sits at the top.
  - Voormann hid a tiny self-portrait and signature in the hair *(verify)*.
- **Colours:** pure black `#111111` on paper `~#F2EFE7`, with halftone photos.

**(c) Direction for Tokonmon**
- **Lenshorn (Echo; John's form):**
  - its antennae and horn-crest sweep back like a mane in the ink-drawn cut-in;
  - in the Elite-Four-John ultimate cut-in, the mane is **filled with live mini-snapshots of the current battle** (rendered frames of the player's party) in 1-bit halftone.
- **Phone lore filter *(proposal)*:** Elite Four phone entries render in an ink-and-halftone style (1-px black line, ordered dither).
- **Easter egg:** our own pixel artist's tiny self-portrait hidden in the mural's mane, matching Voormann's gesture without copying it.

**(d) Do / Don't**
- Do: monochrome ink; hair or mane as a container for collage; dithered halftone photos.
- Don't: real faces; the four-heads layout with the same placement; the "REVOLVER" title treatment.

### A5. The Beatles: *Rubber Soul* (1965)

**(a) References**
- [S] Wikipedia, Robert Freeman (photographer): https://en.wikipedia.org/wiki/Robert_Freeman_(photographer)
- [S] The Paul McCartney Project, "Designing the Rubber Soul cover": https://www.the-paulmccartney-project.com/1965/10/designing-the-rubber-soul-cover/
- [S] The Fest, "Rubber Soul deep dive: the iconic album cover": https://www.thefest.com/?p=8755
- [S] We Are Cult, "11 things you probably didn't know about Rubber Soul": https://wearecult.rocks/11-things-you-probably-didnt-know-about-rubber-soul
- [K] https://en.wikipedia.org/wiki/Rubber_Soul

**(b) Study notes**
- **The stretch [S]:** Freeman projected the photos onto album-sized card. The card slipped backwards and the image
  **stretched**. The band loved it and asked for it.
- **The lettering [S]:** Charles Front drew it, thinking of **sap from a rubber tree**. Each letter starts thin and swells into a
  globule. It was widely imitated in the flower-power era and Front was never credited. His original sold for £9,600 in 2008.
- **Composition [K]:** four faces looking *down* into a low lens, slightly fish-eyed, against dark foliage, in suede jackets.
- **Colours** (approximate): foliage `~#3B4A2E`, suede `~#6B4A2F`, skin `~#C99A78`, warm amber title `~#C8742A` *(verify)*.

**(c) Direction for Tokonmon**
- **Defeat and victory screen *(proposal)*:** after a Beatles match, the four tribute members **look down at the camera**
  (low angle, gentle fish-eye, with a 6–10 % vertical stretch).
- **VFX:** Echo sound-wave hits briefly squash and stretch the target sprite vertically on the beat, a nod to the
  "accidental stretch".
- **Typography:** build an original pixel display font, "Sap", in which every stroke starts hairline and ends in a droplet terminal.
  Use it for psychedelic shop signs in the Beatles-themed corners of Namba and for the Elite Four ticket stubs.

**(d) Do / Don't**
- Do: swelling droplet terminals; the looking-down group shot; warm brown and bottle-green.
- Don't: trace Front's letterforms; real faces; the "Rubber Soul" words.

### A6. The Beatles: *The Beatles* ("White Album", 1968)

**(a) References**
- [S] The Paul McCartney Project, design of the White Album packaging: https://www.the-paulmccartney-project.com/1968/09/design-of-the-white-album-packaging/
- [S] Stylepark, "If you ask me, everything should be white": https://www.stylepark.com/en/news/if-you-ask-me-everything-should-be-white
- [S] The Beatles Bible, title and cover artwork: https://www.beatlesbible.com/albums/the-beatles-white-album/4/
- [S] PS Audio, "So you think you love the White Album": https://psaudio.com/article/so-you-think-you-love-the-white-album/
- [K] https://en.wikipedia.org/wiki/The_Beatles_(album)

**(b) Study notes**
- **The design [S]:**
  - Richard Hamilton's plain white sleeve.
  - The band name is **blind-embossed**, slightly to the right.
  - Each copy carries a **grey serial number**, an ironic "numbered edition" of millions.
  - It is the only Beatles studio cover without the band on it, and a deliberate counterpoint to Pepper.
- **Variants [S]:** a coffee-ring stain was proposed and dropped. On later CDs the name was printed in grey and the numbers removed.
- **Colours** (approximate): paper `~#F4F2EC`, emboss shadow `~#D9D6CE`, number `~#8A8A8A`.

**(c) Direction for Tokonmon**
- **Elite Four pass *(proposal)*:** the Elite Four entry pass on the player's phone license (bible §8 "view your license")
  is a pearl-white card with a **blind-embossed** League mark and a **serial number derived from the save file**
  (for example "No. 0004721"). It feels unique and collectible.
- **The silence beat:** just before the Elite Four medley finale (§B1.6), the jumbotron goes **pure white with an embossed
  crest** for one bar of silence, then the final starts on the downbeat.

**(d) Do / Don't**
- Do: minimalism; emboss made from 1-px highlight and shadow pairs; serial-number irony.
- Don't: the band name or its typeface; a coffee-ring stain (too specific a nod).

### A7. The Beatles: *Let It Be* (1970)

**(a) References**
- [S] Webgrafikk, "Album covers: Let It Be": https://webgrafikk.com/blog/uncategorized/album-covers-let-it-be
- [S] The Paul McCartney Project, designing the packaging of Let It Be: https://www.the-paulmccartney-project.com/1969/07/designing-the-packaging-of-let-it-be/
- [S] V&A record of the 1988 reprint: https://collections.vam.ac.uk/item/O190761
- [S] Wikipedia, Ethan Russell: https://en.wikipedia.org/wiki/Ethan_Russell
- [K] https://en.wikipedia.org/wiki/Let_It_Be_(album)

**(b) Study notes**
- **Credits [S]:** photographs by Ethan Russell from the January 1969 sessions; design by John Kosh.
- **Composition [S]:** **four individual square portraits on black**, with the title in simple white sans-serif capitals at the top.
- **Why four separate portraits [S]:** the band had split by release, so no group photo was possible.
- **Colours:** black `~#0A0A0A`, white type, warm portrait tones.

**(c) Direction for Tokonmon**
- **Diegetic Elite Four progress board (bible: in-world signs, almost no UI):** in the League HQ lobby, a black wall
  with a **2×2 grid of square portraits** of the four tribute trainers. Each lit square goes dim and gets a stamped
  seal when its trainer is beaten.
- **Phone contacts:** Elite Four contact cards use square portraits with heavy black borders.

**(d) Do / Don't**
- Do: the 2×2 grid; black gutters; plain white sans capitals.
- Don't: copy the original photos' poses or lighting per person.

### A8. The Beatles: "Strawberry Fields Forever" / "Penny Lane" (double A-side single, 1967)

**(a) References**
- [S] Wikipedia, Strawberry Fields Forever: https://en.wikipedia.org/wiki/Strawberry_Fields_Forever
- [S] Wikipedia, Penny Lane: https://en.wikipedia.org/wiki/Penny_Lane
- [S] The Beatles Bible, SFF promo film: https://beatlesbible.com/songs/strawberry-fields-forever/3
- [S] Beatles Australia sleeve entry: https://www.beatlesaustralia.com/SP23_A8243.html
- [S] The Paul McCartney Project, the single: https://www.the-paulmccartney-project.com/album/strawberry-fields-forever-penny-lane/

**(b) Study notes**
- **Release [S]:** 13 Feb 1967, double A-side, Parlophone (UK) and Capitol 5810 (US).
- **Sleeves [S]:**
  - a US picture sleeve and an Australian paper picture sleeve exist;
  - a 1976 reissue used a different photo;
  - the oft-repeated "baby photos" sleeve detail was **not confirmed** *(verify)*.
- **Promo films [K]:**
  - **SFF:** Knole Park, Sevenoaks. A dead tree, an upright piano strung like a harp, the band pouring paint over it, reverse footage and day/night jump-cuts.
  - **Penny Lane:** the band on white horses in red hunting jackets, intercut with suburban Liverpool street life (barber, bank, fire station, the roundabout shelter).
- **The real places [K]:**
  - Strawberry Field was a Salvation Army children's home in Woolton, Liverpool, with **red-painted wrought-iron gates**.
  - Penny Lane is a Liverpool street whose signs were famously stolen and later painted onto walls.
- **Palette** (approximate): gate red `~#C4232B`, foliage `~#3D6B35`, suburban sky `~#7FB4E0`, hunting red `~#B2232C`, poppy red `~#D8262E`.

**(c) Direction for Tokonmon** (Strawbaa line, bible §3)
- **Strawbaa (Bio):**
  - wool tufts with a **seed-dot pattern** and a calyx-leaf fringe;
  - its planted vines (bible gimmick) sprout from tiny **red wrought-iron spiral stakes**, a quiet nod to the gates.
- **Ramberry:** see A9.
- **Pennyewe (Bio, a "Penny Lane" nurse ewe selling poppies from a tray):**
  - 1960s nurse cap and cape in navy, with a strap-on tray of pixel poppies;
  - the cap badge is a **heart-leaf**, **never a red cross**.
- **Castle Park starter scene *(proposal)*:** a red wrought-iron garden gate opens onto the strawberry patch where Strawbaa is presented.
- **Set dressing (Minoh Safari clearing) *(proposal)*:** a dead tree with an abandoned upright piano, strings exposed. Crows nod on the beat.
- **Street dressing (Chuo / Namba alleys):** barber pole, a tiny bank, fire-engine bay, roundabout shelter. This is "English
  suburbia viewed through Osaka". Keep the signage original.

**(d) Do / Don't**
- Do: storybook suburban details; a memory-haze palette; red gates; a tray of poppies.
- Don't: lyrics; the real street-sign wording; the Red Cross emblem (protected); recreate the promo film shots.

### A9. Paul & Linda McCartney: *Ram* (1971)

**(a) References**
- [S] The Paul McCartney Project, "Designing the packaging for Ram": https://www.the-paulmccartney-project.com/1971/01/designing-the-packaging-for-ram/
- [S] uDiscover, "Paul McCartney's album covers, explained": https://www.udiscovermusic.com/?p=2670628
- [S] HighResAudio, Ram (remastered): https://mag.highresaudio.com/album/view/kbrqck/paul-mccartney-ram-remastered
- [K] https://en.wikipedia.org/wiki/Ram_(album)

**(b) Study notes**
- **Photo and frame [S]:** Linda's **black-and-white photo** of Paul holding a ram by its horns on the Scottish farm. Around it,
  Paul drew a **childlike felt-tip frame of rainbow zig-zags** on a bright background (one source says yellow).
- **Hidden letters [S]:** tiny letters reading **"L.I.L.Y."** ("Linda I Love You").
- **Colours** (approximate): yellow `~#F2D21B`, zig-zag red `~#E23B2E`, green `~#3DA44A`, blue `~#2F6DB5`, orange `~#F28C28`, B/W photo greys.

**(c) Direction for Tokonmon**
- **Ramberry (Bio/Geo, a giant ram with horns):** its dex and phone card is framed by a **hand-drawn marker zig-zag
  border** in Bio greens and berry reds. Hide **our own** micro-letters in the border (for example the team's initials), never "L.I.L.Y.".
- **Bond pose (bible §5: Ramberry's horns expand when bonded):** the trainer's **horn-grip** stance is the bonding pose.
  Draw it as two hands on the horn bases, so the bonding beam runs from the bracelet into the horns.
- **Farm cinematic (Old Man Kubo's farm, bible §2):** flashback frames as grey "photos" inside crayon-coloured borders.

**(d) Do / Don't**
- Do: a monochrome subject inside a loud naive border; hidden micro-letters.
- Don't: a person bent over a ram in profile at centre (the original pose); "L.I.L.Y."
