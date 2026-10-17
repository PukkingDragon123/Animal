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
| 4 | **180** | 1.333 s | 21 beats (whole) | 45 beats (whole) | thrash, Team Metallica, frantic finales |
| 5 | **144** | 1.667 s | 16.8 beats | 36 beats = **9 bars** (whole) | Champions (Queen), big anthems |
| 6 | **120** | 2.000 s | 14 beats (whole) | 30 beats (whole) | **default battle tempo**, Elite Four (Beatles) |
| 8 | **90** | 2.667 s | 10.5 beats | 22.5 beats | funk (RHCP), stadium hip-hop (Kanye), pastoral |
| 10 | **72** | 3.333 s | 8.4 beats | 18.75 beats | half-time ballads, a-cappella intros |
| 12 | **60** | 4.000 s | 7 beats (whole) | 15 beats (whole) | power ballads (Purple Rain), doom (Iron Man) |

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

### A10. Queen: the crest and *A Night at the Opera* (1975)

**(a) References**
- [S] Design Your Way, "Queen album covers": https://www.designyourway.net/blog/queen-album-covers/
- [S] The crest's zodiac symbolism (low-quality, reworded pages; verify against an official source): https://sa.sothebysinstitute.com/who-designed-queen-logo
- [K] https://en.wikipedia.org/wiki/A_Night_at_the_Opera_(Queen_album)

**(b) Study notes**
- **Designer [S]:** Freddie Mercury, who studied graphic design at Ealing Art College, designed the crest to echo the British Royal
  Coat of Arms.
- **First appearances [S]:** on the back of the debut album (1973), then on the **front** of *A Night at the Opera*.
- **Symbol map [S]:**
  - a **crab** on top (Cancer: Brian May);
  - **two lions** (Leo: Roger Taylor and John Deacon);
  - **two fairies** beside the lions (Virgo: Mercury);
  - a **phoenix** arching over everything (immortality and ambition);
  - a big central **Q** with a small crown inside *(verify)*;
  - flames at the base [K].
- **ANATO cover [K]:** the crest in fine line on a white field with jewel-tone fills; the title in ornate script.
- **Palette** (approximate): ivory `~#F3EEDC`, gold `~#C9A227`, crimson `~#B3122E`, royal blue `~#1F3F9A`, emerald `~#1E7B4E`.

**(c) Direction for Tokonmon**
- **Champions crest *(proposal)*:** an **original** heraldic crest for the Champions (the Queen tribute supergroup) built
  with the same *method*: the members' symbols composed symmetrically. The parts come from the five Queen partners
  in bible §3:
  - **Killerqueen** (the queen bee) crowned at the top;
  - **Bohemoth** and **Radiogaga** as the two supporters;
  - **Dontstopmeow** and **Bitesdust** as the small flanking figures;
  - a central **"K"** (for Kansai) shaped like a lyre;
  - a base of **Osaka Castle roof waves** in place of flames.
- **Uses:** stadium banners, the floor graphic in the Champions' final, the end-credits title card and the "crown" stamp on the
  player's license after becoming champion.

**(d) Do / Don't**
- Do: heraldic symmetry; symbols that encode members; ivory, gold and crimson.
- Don't: the crab, lions, fairies, phoenix and Q combination; an ornate script reading "A Night at the…"; the real crest anywhere (it is a trademark).

### A11. Queen: *News of the World* (1977)

**(a) References**
- [S] Louder, "Queen: how a legendary artist and a violent robot led to their iconic News of the World artwork": https://loudersound.com/features/queens-news-of-the-world-the-story-behind-the-cover
- [S] Radio X, "The secret history behind Queen's News of the World album cover": https://radiox.co.uk/artists/queen/story-behind-queen-news-of-the-world-album-cover
- [S] Fonts In Use, News of the World: https://www.fontsinuse.com/uses/34974/queen-news-of-the-world-album-art
- [S] brianmay.com, Marvel × Queen 40th anniversary: https://brianmay.com/queen-news/2017/10/press-release-marvel-queen-celebrate-40-years-of-news-of-the-world/
- [S] Frank the Robot (fan wiki): https://bohemianrhapsody.fandom.com/wiki/Frank_the_Robot

**(b) Study notes**
- **Source image [S]:** Roger Taylor owned the **October 1953 *Astounding Science Fiction***, whose Frank Kelly Freas cover (for
  Tom Godwin's "The Gulf Between") shows a giant robot holding a dead man. The caption reads roughly "Please… fix it, Daddy?"
  (wording varies).
- **The LP version [S]:** Freas adapted it in 1977. The robot holds band members while others fall. In the gatefold, the robot's hand reaches through
  a concert-hall roof towards the fleeing audience. Fans nicknamed the robot **"Frank"**.
- **The emotional key [K]:** a **violent scene with an innocent, puzzled, sad face**. The pathos comes from the huge round eyes and the head tilt.
- **Palette** (approximate): steel `~#8E9AA6`, highlight `~#D7DEE5`, cold shadow `~#3A4A5E`, night navy `~#14203A`, accent red `~#A3161A`.
  Pulp-magazine halftone.

**(c) Direction for Tokonmon**
- **Radiogaga (Echo/Volto radio robot, bible §3):**
  - a gentle giant with **big round lamp-eyes** and a **puzzled head-tilt idle**;
  - a speaker-grille chest, antenna ears, riveted panels and over-large hands.
- **Radiogaga's ultimate:** the camera sits *inside* the stadium roof as a giant hand reaches down and the roof panels peel
  away. This reverses the gatefold: the crowd **cheers** instead of fleeing.
- **Champions match posters:** 1950s pulp sci-fi halftone posters on the Umeda stadium concourse, with original masthead titles.

**(d) Do / Don't**
- Do: pathos in the robot's eyes; low-angle scale; pulp halftone.
- Don't: bodies or blood; Frank's head and visor design; the caption.

### A12. Queen: *The Game* (1980)

**(a) References**
- [S] Wikipedia, The Game (Queen album): https://en.wikipedia.org/wiki/The_Game_(Queen_album)
- [S] Queen Vinyls, The Game: https://queenvinyls.com/vinyls-2/prova/the-game-1980/
- [S] Font Meme, The Game font: https://fontmeme.com/the-game-queen-font/
- [S] Tracks UK, promotional photograph: https://www.tracks.co.uk/product/b52854-queen-the-game-london-1980-emi-records-promotional-photograph-uk/

**(b) Study notes**
- **Photo [S]:** a **black-and-white photo** of the four in **black leather motorcycle jackets**, Brian in **mirrored aviators**. A dealer listing says it was shot at Trillion Studios, London, in May 1980.
- **Variants [S]:** the CD photo differs from the LP's.
- **Type [S]:** Cheltenham Bold, with the title in Cheltenham Bold Condensed.
- **Credits [S]:** a German wiki mirror credits the design to the Amsterdam agency Cream (weak source).
- **Finish [K]:** the original LP sleeve was printed with a **reflective silver** finish *(verify)*.
- **Palette:** greyscale `#0E0E0E` to `#E6E6E6`, with chrome highlights.

**(c) Direction for Tokonmon**
- **Champions' second outfits *(proposal)* for the final phase after halftime:** black leather jackets with chrome studs.
  The guitarist-tribute wears mirrored shades that reflect the arena in two pixels.
- **Dontstopmeow (Volto speed cat):** a black, glossy, leather-like coat pattern; chrome claw tips; speed lines that leave chrome streaks.
- **Title cards:** a silver-foil effect (animated specular sweep across 1-px highlights). Choose an open-licence condensed serif
  close in *spirit* to Cheltenham.

**(d) Do / Don't**
- Do: monochrome plus chrome; biker leather; condensed serif.
- Don't: recreate the photo's poses or lineup.

### A13. Queen: *Innuendo* (1991)

**(a) References**
- [S] Wikipedia, Innuendo (album): https://en.wikipedia.org/wiki/Innuendo_(album)
- [S] Far Out, "The Cover Uncovered: Innuendo": https://faroutmagazine.co.uk/freddie-mercurys-queen-album-innuendo-cover-art/
- [S] Pixartprinting, "#AlbumCovers: the cover for Queen's Innuendo": https://www.pixartprinting.co.uk/blog/albumcovers-the-cover-queen-innuendo/
- [S] TV Tropes, Innuendo: https://tvtropes.org/pmwiki/pmwiki.php/Music/Innuendo

**(b) Study notes**
- **Source [S]:** adapted from J.J. Grandville's engraving **"Juggler of Universes"** from *Un Autre Monde* (1844 per most sources). It was colourised by
  **Richard Gray**, who kept most of the image. The booklet and single sleeves also use Grandville engravings.
- **Look [K]:** engraving cross-hatching; a harlequin-like juggler balancing and juggling planets; Victorian whimsy.
- **Palette** (approximate, Gray's colouring): ochre `~#D9A441`, teal `~#4F7F86`, rust `~#B5532E`, paper `~#EDE3CC`.
- **Rights:** Grandville (1803–1847) is public domain, so artists may study his *original* engravings directly. Gray's colouring is not public domain.

**(c) Direction for Tokonmon**
- **Bohemoth (Echo/Ecto, "Bohemian Rhapsody"):** a harlequin-juggler spirit with small **planet-orbs orbiting** it.
  The orbs are its projectiles, launched in time with the beat. Dex art is in engraved cross-hatch pixel style.
- **Dr. Hoshino's lore pages (the gods of light):** draw them consistently as **19th-century engravings** (hatch shading, sepia paper).
  This gives the lore an "old book" identity separate from the neon city.

**(d) Do / Don't**
- Do: hatch shading; Victorian whimsy; orbiting spheres.
- Don't: Gray's colourised composition; a juggler standing on a globe in the same pose.

### A14. Queen: *Queen II* (1974) and the "Bohemian Rhapsody" video (1975)

**(a) References**
- [S] American Songwriter, "The story behind the famous Queen II album cover": https://americansongwriter.com/queen-ii-queen-album-cover-story-explained
- [S] brianmay.com, "Passing of our friend, photographer Mick Rock": https://brianmay.com/brians-soapbox/2021/11/passing-of-our-friend-photographer-mick-rock/
- [S] Louder, "One Vision: the unseen Queen as photographed by Mick Rock": https://loudersound.com/features/one-vision-the-unseen-queen-as-photographed-by-mick-rock
- [S] Songfacts blog, Mick Rock outtakes: https://dev-www.songfacts.com/blog/writing/mick-rock-stories-and-outtakes-from-classic-album-covers
- [K] https://en.wikipedia.org/wiki/Bohemian_Rhapsody

**(b) Study notes**
- **Inspiration [S]:** Mick Rock based it on a **Marlene Dietrich still from *Shanghai Express* (1932)** with a **single top light**.
- **Composition [S]:** the band in a **diamond formation on black**. A white version sits inside the gatefold, matching the album's "Side White / Side Black".
- **Link to the video [S]:** the cover was brought to life in the "Bohemian Rhapsody" video.
- **The video [K]:** directed by Bruce Gowers. Same lit-from-above diamond. The operatic section uses **face-multiplying prism and
  video-feedback trails**.
- **Palette:** black `~#050505`, skin highlight `~#E8D2BC`, mid `~#7A5E4B`. Two-value chiaroscuro.

**(c) Direction for Tokonmon**
- **Champions intro cinematic:** the four tribute members' heads in a **diamond, floating out of black, under one top light**.
  In pixel terms: one light band, then a hard fall-off to pure black.
- **Bohemoth's Echo/Ecto signature VFX:** **echo clones**, three to five translucent copies of the sprite fanning out on successive 16ths and
  then collapsing on the downbeat.
- **Stage lighting *(proposal)*:** the Champions' stage is lit **white** in the first half and **black** after the halftime arena
  choice, the Side White / Side Black idea. This is lighting only; arena types are unchanged.

**(d) Do / Don't**
- Do: the diamond; a single top light; face-fan echo trails.
- Don't: a front figure with crossed arms on the chest plus a likeness; a shot-for-shot recreation of the video.

### A15. Queen: Live Aid (Wembley, 13 July 1985) and Wembley '86 (Magic Tour)

**(a) References**
- [S] Wikipedia, Queen's performance at Live Aid: https://en.wikipedia.org/wiki/Queen%27s_performance_at_Live_Aid
- [S] QueenConcerts, Live Aid detail: https://www.queenconcerts.com/detail/live/672/queen-live-13-07-1985-wembley-stadium-london-uk-live-aid-festival.html
- [S] uDiscover, "Queen at Live Aid": https://www.udiscovermusic.com/stories/queen-live-aid-concert-performance
- [S] American Songwriter, the 20-minute set: https://americansongwriter.com/remember-when-queen-performed-a-momentous-20-minute-set-at-live-aid/?nb=1
- [K] https://en.wikipedia.org/wiki/Live_at_Wembley_%2786

**(b) Study notes**
- **Live Aid [S]:**
  - A **21-minute set** at about 18:44 GMT.
  - Only the *intro* of "Bohemian Rhapsody" was played (the opera part could not be played from tape), followed by "Radio Ga Ga", "We Will Rock You" and others.
  - Voted the best rock gig of all time (2005). Elton John told them "You stole the show".
  - Queen returned to Wembley on **12 July 1986**.
- **Look and moments [K]:**
  - **Daylight** show.
  - The singer wore a white vest, light jeans, a studded armband, and a short "half" mic stand.
  - **72,000 people double-clapping with arms overhead** in unison on the "Radio Ga Ga" chorus.
  - An a-cappella **call-and-response** vocal improvisation with the crowd.
- **Wembley '86 [K]:**
  - an enormous stage with wide runways;
  - a yellow military jacket;
  - an encore with **crown and ermine-trimmed red robe**;
  - giant **inflatable band-member balloons** released over the crowd *(verify)*.

**(c) Direction for Tokonmon** (Umeda stadium, bible §6)
- **Crowd animation set:**
  - an **overhead double-clap** loop (arms up, two claps on beats 1 and 2 of marked bars);
  - a **lighter / phone-light sway** for ballads;
  - a **wave**;
  - a **stomp** (crowd sprites dip on stomps).
  - All crowd loops are driven by the music clock (§B5).
- **Champion trainer emote (bible §6 emote moves):** a **"crowd call"**. The mic stick goes up, the crowd answers with an original
  two-syllable chant (§B4), and the jumbotron shows the crowd.
- **Final-phase costume *(proposal)*:** crown plus a red cape with ermine-like spots (generic royalty, not the real robe pattern).
- **Halftime set piece *(proposal)*:** giant inflatables of the Champions' Tokonmon drift over the stands during the halftime arena choice.
- **Lighting:** the final is staged at **golden hour into dusk** (Live Aid's daylight-to-evening arc), using the city-pop dusk gradient (§0.5).

**(d) Do / Don't**
- Do: a stadium that sings back; daylight warmth; big simple gestures.
- Don't: more than two real costume cues on one tribute character (for example vest plus armband, then add original traits such as a crown-shaped quiff); real likeness.

### A16. Prince and the Revolution: *Purple Rain* (1984)

**(a) References**
- [S] American Songwriter, "The story behind Prince's drama-infused Purple Rain album cover": https://americansongwriter.com/purple-rain-album-cover-prince-story-meaning
- [S] Juxtapoz, "Sound and Vision: Prince's Purple Rain": https://www.juxtapoz.com/news/design/sound-and-vision-prince-s-purple-rain/
- [S] People's Graphic Design Archive, Purple Rain: https://peoplesgdarchive.org/item/21835/purple-rain-prince
- [S] Wayne State, "Purple Rain" record: https://waynestateu.omeka.net/items/show/2135
- [S] Complex, a visual history of Prince's covers: https://www.complex.com/style/2018/06/visual-history-of-princes-album-covers/parade
- [K] https://en.wikipedia.org/wiki/Purple_Rain_(album)

**(b) Study notes**
- **The image [S]:** Prince astride a customised **1981 Hondamatic Honda CM400A** in an **ornate purple suit** amid **billowing smoke**.
  A **floral frame** cushions the photo left and right.
- **Title [S]:** **thick purple lettering** "Purple Rain · Prince and the Revolution", by Jay Vigon.
- **Credits [S]:** design by Laura LiPuma (Nash); photography by Ed Thrasher (with Stuart Douglas Watson or Ron Slenzak, depending on the source).
- **Setting [S]:** a Warner backlot, in an alley. One source has Apollonia in a doorway behind.
- **Palette** (approximate):
  - purple `~#5B2C83`;
  - haze `~#7E5BA6`;
  - magenta `~#B0307A`;
  - smoke `~#C9B7D9`;
  - flowers pink `~#E58BB0` and white;
  - brick `~#6B3A3A`.
- **Trademark:** Prince's **Love Symbol** is a trademark.

**(c) Direction for Tokonmon** (Bubblion line, bible §3)
- **Purple Rain (Hydro, the queen version in a dress):**
  - lionfish spines become **Victorian ruffles and a high collar**;
  - its body has a violet-to-magenta gradient;
  - purple rain particles fall around it;
  - its dex card has a **floral side frame**;
  - its entrance comes through rolling **smoke and fog** with a single backlight.
- **Princeidon (Hydro king):**
  - **bubble armour** with gold trims;
  - a high-collared coat silhouette made of lionfish fins;
  - a crown;
  - a coral **trident with a guitar-headstock-like head**. It must not be a copy of any real guitar shape.
- **Namba set dressing:** a brick back-alley with purple neon, flower boxes and a generic custom motorbike (no specific model look).

**(d) Do / Don't**
- Do: purple, smoke, a floral frame, ruffles and high collars.
- Don't: the Love Symbol; a rider on a motorbike in the same three-quarter pose; any likeness; the "Purple Rain" lettering style.

### A17. Red Hot Chili Peppers: the asterisk logo

**(a) References**
- [S] MoneyInc, the history of the Red Hot Chili Peppers: https://moneyinc.com/red-hot-chili-peppers/
- [S] Deconetwork, "The Red Hot Chili Peppers Star of Affinity T-shirt story": https://www.deconetwork.com/the-red-hot-chilli-peppers-star-of-affinity-t-shit-story/
- [S] Xpress Mag (logo article): https://xpressmag.com.au/?p=229190

**(b) Study notes**
- **Origin [S]:** in **1984**, when the label asked for a logo, Anthony Kiedis sketched an **eight-pronged asterisk**. It was the first thing that
  came to mind, with no stated meaning.
- **Names and readings [S]:** fans call it the "Star of Affinity" or "Star of Infinity". It resembles Michael Moorcock's chaos symbol.
- **Typical use [K]:** solid red on black, or black on white.
- **Palette** (approximate): chili red `~#D7261E`, black.

**(c) Direction for Tokonmon**
- **Chilichick line emblem *(proposal)*:** an **original flame-spark**. A chili pepper's stem splits into **six** tapered flames.
  - It is the Chilichick line's bonded **blazing crest** (bible §5).
  - It is also Riffrooster's comb shape.
  - It is the headstock inlay on Funkadoodle's bass-fin.
- **Usage:** on stickers for the phone (bible §8 decorate) and on the Chilichick line's dex card.

**(d) Do / Don't**
- Do: one bold, simple mark in red and black.
- Don't: eight equal arms; anything readable as the asterisk or a chaos star.

### A18. Red Hot Chili Peppers: *By the Way* (2002)

**(a) References**
- [S] Wikipedia, Julian Schnabel: https://en.wikipedia.org/wiki/Julian_Schnabel
- [S] Wikipedia, Stella Schnabel: https://en.wikipedia.org/wiki/Stella_Schnabel
- [S] By the Way (Wikipedia 2007 mirror): https://wikipedia2007.classicistranieri.com/b/y/_/By_the_Way_c167.html
- [K] https://en.wikipedia.org/wiki/By_the_Way_(album)

**(b) Study notes**
- **Credits [S]:** a **Julian Schnabel painting** of his daughter **Stella Schnabel**, who was dating John Frusciante at the time. Schnabel is credited with the paintings, photos and art direction.
- **The commission [S]:** the band sent him rough mixes.
- **Colours [K]:** not confirmed by the search *(verify)*. From memory it is a loose, brushy, unfinished-looking portrait with hand-written titling.

**(c) Direction for Tokonmon**
- **Friend bond-rank portraits (bible §4: Persona-style friends):** when a bond rank goes up, show a **loose painterly portrait**
  of the friend (Mika, Kaito, Taro, Moshi, Lumi★, Dr. Hoshino) with visible brush texture, raw canvas showing at the edges and **hand-lettered** captions.
  This is a deliberate style break from crisp pixel art. Make it from 2× chunky pixels painted to look brushy.

**(d) Do / Don't**
- Do: gestural strokes; unfinished edges; hand lettering.
- Don't: paint a young woman in the original composition; Schnabel's plate-painting style.

### A19. Red Hot Chili Peppers: *Californication* (1999)

**(a) References**
- [S] A Journal of Musical Things, "Tracking down real-world RHCP landmarks": https://www.ajournalofmusicalthings.com/ongoing-history-daily-tracking-down-real-world-red-hot-chili-peppers-landmarks
- [S] Kerrang!, "Californication is a perfect record": https://www.kerrang.com/you-can-make-fun-of-the-red-hot-chili-peppers-all-you-want-but-californication-is-a-perfect-record
- [S] People's GD Archive (designer index): https://peoplesgdarchive.org/item/21112/google
- [K] https://en.wikipedia.org/wiki/Californication_(album)

**(b) Study notes**
- **Credits [S]:** designed by **Lawrence Azerrad** from a vision by John Frusciante.
- **The image [S]:** a swimming pool where **sky and water swap**. A fiery orange-red sky sits *inside* the pool, against blue mountains, read as people reshaping themselves for California.
- **Location [S]:** a single report locates the pool at 2227 Summitridge Dr, Beverly Hills *(verify)*.
- **Palette** (approximate): pool-sky gradient `~#E9622A → ~#F6A03C`, mountains `~#2E5D8C`, deck `~#E9E1D3`.

**(c) Direction for Tokonmon**
- **Water arena at dusk (bible §6 arena "water"):** a shader Easter egg. When the sun sets during a match, the arena water reflects a
  **sunset orange** while the visible sky is still blue (an inverted reflection). It is subtle and readable in pixels.
- **Mural:** an "upside-down pool" mural on an Umeda rooftop, with Osaka Bay at sunset inside the pool.

**(d) Do / Don't**
- Do: sky and water inversion; a warm sunset gradient against cool mountains.
- Don't: the same pool shape and angle.

### A20. Red Hot Chili Peppers: *Stadium Arcadium* (2006)

**(a) References**
- [S] Classic Rock History, "Top 10 Red Hot Chili Peppers album covers": https://www.classicrockhistory.com/?p=30809
- [K] https://en.wikipedia.org/wiki/Stadium_Arcadium

**(b) Study notes**
- **Designer [S]:** Storm Thorgerson pitched ideas that were rejected; the band went with **Gus Van Sant**. This comes from a single listicle *(verify)*.
- **The image [S]:** the letters sit **in the middle with a ring around them, surrounded by planets on a cobalt blue background**, an "intergalactic" cover.
- **Palette** (approximate): cobalt `~#1B3FA0`, planets in warm `~#F2A65A` and cool `~#7FC8E8`.

**(c) Direction for Tokonmon**
- **Umeda stadium identity *(proposal)*:** the stadium as a **ringed planet** with orbiting satellites, used for the jumbotron boot-up animation and
  the League match-start sting. This links to the bible's high-tech arena.
- **Chilichick line Elemental Form ultimates:** a cosmic cobalt background with **fireballs in orbit**.

**(d) Do / Don't**
- Do: cobalt cosmos; ring typography.
- Don't: the band's lettering arrangement inside a ring.

### A21. Nirvana: *In Utero* (1993)

**(a) References**
- [S] Far Out, "The Cover Uncovered: In Utero": https://faroutmagazine.co.uk/behind-the-artwork-of-nirvana-album-in-utero/
- [S] American Songwriter, "The story behind Nirvana's In Utero album cover": https://americansongwriter.com/the-story-behind-nirvanas-in-utero-album-cover
- [S] Rolling Stone, "In Utero: 20 things you didn't know": https://www.rollingstone.com/feature/nirvana-in-utero-trivia-kurt-cobain-722109/
- [S] Loudwire, meaning of the title: https://loudwire.com/meaning-behind-nirvana-in-utero-album-title/
- [S] LiquiSearch, packaging and title: https://www.liquisearch.com/in_utero_album/packaging_and_title
- [K] https://en.wikipedia.org/wiki/In_Utero_(album)

**(b) Study notes**
- **Credits [S]:** realised by art director **Robert Fisher** from Kurt Cobain's ideas.
- **The front [S]:** a **Transparent Anatomical Manikin** (a medical teaching model) with **wings superimposed**. Cobain added the wings.
- **The back [S]:** Cobain's collage of model fetuses and body parts **among flowers** (orchids, lilies), photographed by Charles Peterson.
- **Reception [S]:** the label prepared alternates but the original held. **Winged replicas were used as stage props** on tour.
- **Look [K]:** arms out, wings spread; a mottled **cream** background.
- **Palette** (approximate): cream `~#E7D9B8`, vein blue `~#4C6FA8`, organ red `~#B3342E`, wing translucency `~#F3EEDC`.

**(c) Direction for Tokonmon** (Heartbox → Inbloom, bible §3, §5)
- **Inbloom (Ecto, a beautiful humanoid angel with blades):** a **translucent "glass-skin" shell**, drawn as dithered lighter bands over a visible inner structure.
  - The inner structure is **never organs**: show **petals, stems and clockwork filigree** blooming inside, which ties to the name "In Bloom".
  - The wings are drawn like an **anatomical diagram** (thin vein lines, faint label ticks) but in petal shapes.
  - The blades are leaf-shaped.
- **Reveal frame:** when the box breaks, flash one frame of **cream background with Inbloom spread-winged**, then return to the arena.
  The pose is **arms angled downward and open**, never cruciform.
- **Heartbox's cracks:** through each crack you glimpse **orchids and lilies** (the back-cover flowers, without the fetuses).
  - *(proposal)* One crack per kill while bonded; see `tokonmon_roster.md`.

**(d) Do / Don't**
- Do: a translucent model aesthetic; a floral and mechanical interior; cream and pale-blue palette.
- Don't: fetuses, organs, cruciform poses; the manikin silhouette with superimposed wings.

### A22. Nirvana: *Nevermind* (1991)

**(a) References**
- [S] Far Out, "The Cover Uncovered: Nevermind": https://faroutmagazine.co.uk/nirvana-nevermind-cover-story/
- [S] Flashbak, "How I shot the cover to Nirvana's Nevermind": https://flashbak.com/how-i-shot-the-cover-to-nirvanas-nevermind-419252/
- [S] Design You Trust, Kirk Weddle's underwater shoot photos: https://designyoutrust.com/2019/08/float-around-photos-from-nirvanas-underwater-nevermind-shoot/
- [K] https://en.wikipedia.org/wiki/Nevermind

**(b) Study notes**
- **Shoot [S]:** photographed by **Kirk Weddle**, art director **Robert Fisher**. A stock photo cost $7,500/year, so they shot their own.
  The camera sat in an underwater housing on a tripod at the bottom of a pool.
- **Post-production [S]:** the **dollar bill and fishhook were added in post**.
- **The idea [S]:** Cobain conceived it watching a TV programme on water births.
- **Look [K]:** deep pool blue with **caustic light ripples** and bubbles. The wordmark is a condensed typeface (Onyx *(verify)*) in white.
- **Palette** (approximate): pool `~#1D63A8 → ~#3E8FD0`, caustics `~#9CD3F2`, white type.

**(c) Direction for Tokonmon**
- **Bubblion (Hydro, a lionfish in a water ball):** underwater idle with **animated caustic light** on its body. This caustic shader is also
  reused for all **Hydro dex photos** ("underwater photograph" style).
- **Dotonbori canal underpass mural *(proposal)*:** Kappachi (Hydro, bible §3) chasing a **takoyaki dangling on a fishhook**.
  The satire about chasing money becomes Osaka's *kuidaore* ("eat till you drop") food greed.

**(d) Do / Don't**
- Do: caustics; bubbles; a chase-the-lure joke.
- Don't: babies or nudity; a dollar bill; Nirvana's wordmark typeface for anything.

### A23. Nirvana: "Heart-Shaped Box" music video (1993, dir. Anton Corbijn)

**(a) References**
- [S] Radio X, "The making of Nirvana's final video": https://radiox.co.uk/artists/nirvana/heart-shaped-box-video-making-meaning
- [S] Elephant, "Anton Corbijn's terrifying Technicolor Nirvana video": https://elephant.art/anton-corbijns-terrifying-technicolor-nirvana-video
- [S] The Daily Beast, "How Nirvana shot the Heart-Shaped Box video": https://thedailybeast.com/how-nirvana-shot-the-heart-shaped-box-video
- [S] Songfacts, Heart-Shaped Box: https://www.songfacts.com/facts/Nirvana/Heart-shaped-box
- [S] American Songwriter, meaning: https://americansongwriter.com/behind-the-meaning-of-heart-shaped-box-by-nirvana/?nb=1

**(b) Study notes**
- **Authorship [S]:** Cobain storyboarded most of it and faxed the drawings. Corbijn said the video was about 15 % his own.
- **Imagery [S]:**
  - an old man on a cross wearing a **Santa hat** with an IV drip;
  - **fake-looking crows** nodding back and forth;
  - a **poppy field**;
  - a girl in a white robe and peaked hood reaching for figures hanging from trees;
  - a large woman in a painted anatomical suit like the In Utero figure.
- **Colour process [S]:** shot in colour, transferred to B/W, then **every frame was hand-painted** in Mexico to mimic Technicolor.
- **Palette** (approximate): poppy red `~#D3202A`, toxic green `~#5FA83A`, artificial sky teal `~#2BA5A0`, flesh pink `~#E7A08F`.

**(c) Direction for Tokonmon** (Heartbox → Inbloom)
- **Heartbox (Ecto, a gimmick golem):** a giant **heart-shaped box** body (lid hinge on top, ribbon belt, latch mouth). Its sprite palette
  uses **"hand-tinted Technicolor"**: oversaturated, slightly off-register colours with a 1-px colour offset on edges.
- **Lair set dressing *(proposal)*:** a theatrical poppy-field clearing with **crow puppets on sticks that nod on the beat**. It is a deliberately fake
  "stage set", which fits the 2.5D stage-set world (bible §1).
- **Transformation wipe:** colour drops to B/W, then is re-tinted in hand-painted colour, over three steps of 2 poses each, at the moment the box breaks.

**(d) Do / Don't**
- Do: artificial tinted colour; theatrical sets; nodding crows.
- Don't: a crucifix; hooded robes; hanging figures; IV drips; morphine references.

### A24. Kanye West: *Graduation* (2007, art direction Takashi Murakami)

**(a) References**
- [S] Wikipedia, Graduation (album): https://en.wikipedia.org/wiki/Graduation_(album)
- [S] Wikipedia, Dropout Bear: https://en.wikipedia.org/wiki/Dropout_Bear
- [S] American Songwriter, "Graduation album cover story": https://americansongwriter.com/graduation-kanye-west-album-cover-story
- [S] Juxtapoz, "Sound and Vision: Kanye West's Graduation by Takashi Murakami": https://juxtapoz.com/news/music/sound-vision-kanye-west-s-graduation-by-takashi-murakami/

**(b) Study notes**
- **Credits [S]:** Murakami led the art direction and designed the single covers, with the **Dropout Bear** as the central figure.
- **The image [S]:** the bear is **launched into the atmosphere** from a fictional college in "Universe City".
- **Style [S]:** colourful, **pastel Superflat** (manga and anime-influenced). Murakami described school as "a place of dreams, of righteousness, a place to have fun".
- **Palette** (approximate):
  - magenta `~#E4007F`;
  - purple `~#6A3FA0`;
  - cyan `~#00A7E1`;
  - sun yellow `~#FFD100`;
  - pastel pink `~#F7B6D2`;
  - mint `~#7FD6B6`.

  Flat fills with even outlines. Rounded bubbly type.
- **Trademarks [K]:** Murakami's smiling flower and the Dropout Bear design are trademarked or strongly owned identities.

**(c) Direction for Tokonmon**
- **Gradbear (Geo, the alternate from Rollingstone):**
  - a bear with a **mortarboard and tassel**;
  - a stone-shard diploma scroll;
  - its dex art in a **Superflat** treatment (flat fills, no gradients, candy palette).
- **Gradbear's ultimate:** it is **launched skyward** from a catapult of stacked boulders and crashes down on the downbeat (sync: launch on the
  pickup bar, land on beat 1).
- **Umeda billboards:** an original "Kansai Tokon Academy" campus ad in Superflat style, with our own **six-petal tokon-flower** mascot
  with a different face style (dot eyes, no grin).

**(d) Do / Don't**
- Do: Superflat pastels; mascot charm; cartoon-scale launches.
- Don't: Murakami's grinning flower; the Dropout Bear's head and polo design; the "Universe City" name.

> **From A25 onward the search budget was exhausted.** Every fact below is **[K]**, and every URL is a canonical page that was
> **not opened** in this pass. The design direction is unaffected; the facts need a check (§V).

### A25. The Rolling Stones: the tongue-and-lips logo (1970–71)

**(a) References**
- [K] https://en.wikipedia.org/wiki/John_Pasche
- [K] https://en.wikipedia.org/wiki/Sticky_Fingers
- [K] V&A collection search for "Rolling Stones tongue" (the V&A acquired the original artwork) *(verify)*: https://collections.vam.ac.uk/

**(b) Study notes [K]**
- **Origin:** designed by **John Pasche**, then a Royal College of Art student, in 1970. Mick Jagger showed him an image of the Hindu goddess **Kali**
  with her tongue out.
- **First use:** on the *Sticky Fingers* inner sleeve and label (1971). The flared version is a later adaptation.
- **Shape:** red lips, white teeth, a fat protruding tongue, black outline. It reads as cheeky and irreverent.
- **Palette** (approximate): red `~#E3201B`, black, white.

**(c) Direction for Tokonmon** (Rollingstone line, bible §3)
- **Rollingstone (Geo, a rolling stone):** a boulder with a **crack-mouth and a moss tongue** that flaps out while it rolls, a mischievous blep.
  The tongue is **green moss, never red lips**.
- **Fivestones:** five armour stones, each with a small crack-grin.
- **Fiftystone:** a golem whose chest cavity has a **glowing magma "tongue"** that lolls out when it taunts (bible §6 emote).
- **Shinsekai rock-bar sign:** an original icon, a **jagged stone mouth** in neon.

**(d) Do / Don't**
- Do: a cheeky tongue gag; an irreverent attitude.
- Don't: lips plus tongue in a single logo shape; red lips; Kali references.

### A26. The Rolling Stones: *Sticky Fingers* (1971)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Sticky_Fingers
- [K] https://en.wikipedia.org/wiki/Craig_Braun *(verify the page exists)*

**(b) Study notes [K]**
- **Concept:** an **Andy Warhol** concept, a close-up photograph of the crotch of tight jeans with a **real, working zipper** in the sleeve.
  The packaging was produced by Craig Braun. Pulling the zipper reveals underwear on the inner sleeve.
- **Logo:** the first appearance of the tongue logo.
- **Palette:** greyscale denim photograph, with a metallic zipper.

**(c) Direction for Tokonmon**
- **Bullies' studded denim battle vests (bible §4):** real hardware detail on the sprites (zips, studs, safety pins, patches). Animate the zipper
  pulls as 1-px glints.
- **Phone case cosmetic *(proposal)*:** within the bible's "decorate the phone" (§8), a **denim case with a working zipper**. Tapping it unzips to show
  the wallpaper.

**(d) Do / Don't**
- Do: denim texture; interactive hardware.
- Don't: crotch framing; underwear gags.

### A27. JoJo's Bizarre Adventure Part 8 (*JoJolion*): Stand "Soft & Wet"

**(a) References**
- [K] https://en.wikipedia.org/wiki/JoJolion
- [K] https://jojowiki.com/Soft_%26_Wet (fan wiki) *(verify the URL)*
- [K] https://en.wikipedia.org/wiki/Soft_and_Wet (Prince's 1978 debut single)

**(b) Study notes [K]**
- **Source:** Hirohiko Araki's *JoJolion* (2011–2021). The protagonist Josuke Higashikata's Stand **Soft & Wet** is named after **Prince's 1978 debut single "Soft and Wet"**.
- **Ability:** it releases **soap-like bubbles** that **"plunder"** (steal) a property from what they touch, such as friction, sound, eyesight or water, and can release
  it elsewhere.
- **Look:** the Stand is humanoid with **star motifs**. Josuke wears a **sailor-style outfit** and has star-shaped marks.
- **Araki's colour:** deliberately non-naturalistic (pink skies, green skin), high-contrast flats, and fashion-magazine poses ("JoJo poses").
- **Palette** (approximate, direction only): bubble iridescence `~#BFE9FF / ~#FFC4E6 / ~#E8D4FF`, star gold `~#F2C94C`.

**(c) Direction for Tokonmon** (Bubblion line, bible §3: "inspired by Soft & Wet")
- **Bubblion:**
  - its **crown** (bible) plus fins shaped like a **sailor collar**;
  - every bubble it fires **carries a tiny visible "stolen" thing** (a spark, a leaf, a droplet);
  - its bubbles burst into **star-shaped pops**.
- **Ultimate cut-ins for the whole Bubblion line:** a **palette inversion flash** (Araki-style non-natural colour) for 2 poses on the impact downbeat.
- **Trainer victory emotes:** borrow the *principle* of dramatic contrapposto fashion poses, with original silhouettes.

**(d) Do / Don't**
- Do: star-burst bubble pops; a sailor collar; dramatic poses; colour-swap flashes.
- Don't: a humanoid Stand-like spirit floating behind Bubblion; Soft & Wet's design; quoted catchphrases.

### A28. Pink Floyd: *The Dark Side of the Moon* (1973). Lore only (bible §3: "a prism-like dragon")

**(a) References**
- [K] https://en.wikipedia.org/wiki/The_Dark_Side_of_the_Moon
- [K] https://en.wikipedia.org/wiki/Hipgnosis
- [K] https://en.wikipedia.org/wiki/Storm_Thorgerson

**(b) Study notes [K]**
- **Credits:** Hipgnosis (Storm Thorgerson and Aubrey Powell); final art by **George Hardie**. Inspired by a physics-textbook photo of a prism.
- **The front:** pure **black** field. A thin white beam enters an **equilateral prism** from the left and a **six-band spectrum** exits right (no indigo).
- **Gatefold and back:** in the gatefold the spectrum becomes a **heartbeat (EKG) line**. The back shows the reverse, with the spectrum recombining, so sleeves tile endlessly.
- **Palette** (approximate):
  - `#000000`;
  - beam `~#F2F2F2`;
  - red `~#E1261C`;
  - orange `~#F28C1E`;
  - yellow `~#FFE500`;
  - green `~#00A650`;
  - blue `~#00AEEF`;
  - violet `~#6B2C91`.

**(c) Direction for Tokonmon** (lore murals, Dr. Hoshino's research, phone lore entries; it cannot be met)
- **The god "Dark Side of the Moon":** a **dragon whose body is a crystalline triangular prism**. Its breath is a single white beam that splits into
  **12 bands, one per element** (Pyro, Hydro, Bio, Geo, Echo, Volto, Cryo, Aero, Ecto, Ferro, Astro, Nucleo).
  - Lore reading *(proposal)*: the god of light **split the world into elements**.
  - Twelve bands instead of six, plus the dragon form, transform the cover thoroughly.
- **Dig-site walls:** a thin **heartbeat line** runs around the ruin walls as the "pulse of the world". In the dark it glows faintly in each element's colour.
- **Phone lore page:** a black page with thin geometric line art.

**(d) Do / Don't**
- Do: black, geometric minimalism, a single beam, 12 element hues.
- Don't: a bare prism on black with a six-colour spectrum as a standalone graphic. Always show the dragon and the 12 bands.

### A29. AC/DC: *Back in Black* (1980). Lore only (bible §3: "a dark dragon")

**(a) References**
- [K] https://en.wikipedia.org/wiki/Back_in_Black
- [K] https://en.wikipedia.org/wiki/Hells_Bells

**(b) Study notes [K]**
- **The sleeve:** an **all-black** sleeve, as **mourning for Bon Scott** (died February 1980). The band logo is **outlined in thin grey**, barely visible, and the title is in grey.
- **"Hells Bells":** opens with a **tolling bronze bell** cast for the band.
- **Palette:** `#000000`, outline `~#8C8C8C`, near-black `~#2A2A2A`.

**(c) Direction for Tokonmon**
- **The god "Back in Black":** murals **painted black on black**. They read only through **raking light**: a 1-px grey rim light that slides
  across as the camera pans (a parallax specular pass). They are invisible at first glance, so finding them is part of the mystery.
- **Leitmotif:** **four slow tolls of a temple bell (bonshō)**, each 2 bars apart at 60 BPM. Synthesise them with `bell` `variant:'tubular'` an octave below, plus a `sub` hum.

**(d) Do / Don't**
- Do: black-on-black emboss; outline-only reveals; bell tolls.
- Don't: AC/DC's lightning-bolt wordmark; "Hells Bells" imitation riffs.

### A30. Metallica: *Master of Puppets* (1986)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Master_of_Puppets
- [K] https://en.wikipedia.org/wiki/Master_of_Puppets_(song)

**(b) Study notes [K]**
- **Credits:** a painting by **Don Brautigam** to a concept by the band and Peter Mensch.
- **Composition:** a **field of white crosses** (a military cemetery, with helmets and dog tags) recedes to the horizon. **Puppet strings** run from every cross up to a pair of
  **puppeteer's hands** emerging from a **blood-orange, clouded sky**. A large cross sits in the foreground. The logo is at the top.
- **Palette** (approximate): sky `~#C24A2A → ~#E58A3A`, crosses `~#EDE6D6`, grass `~#5D6B3A`, strings `~#F2EDE0`, hands `~#D9B08C`.

**(c) Direction for Tokonmon**
- **Marionoir (Ecto, "Master of Puppets"):** a marionette ghost whose own **control bar floats above its head, held by shadowy hands**.
  - Its attacks shoot **strings** that tether an opponent.
  - VFX: thin 1-px lines that catch the light on beats.
- **Team Metallica hideout mural *(proposal)*:** rows of **amp stacks** (not crosses) receding to a red-orange horizon, strung up to the gloved
  hands of **Thrash** (the leader), who "pulls the strings" of the bullies.

**(d) Do / Don't**
- Do: strings from the sky; a red-orange sky; receding rows.
- Don't: crosses, graves, dog tags, helmets; the Metallica wordmark.

### A31. Metallica: *Ride the Lightning* (1984)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Ride_the_Lightning

**(b) Study notes [K]**
- **The image:** an **electric chair** floating in a **deep blue void**, ringed by **lightning bolts**. The logo is at the top, the title at the bottom.
- **Pressings:** the standard pressing is blue. Collectors prize a **green** misprint.
- **Palette** (approximate): void `~#0E1B4A → ~#2A4FB0`, bolt `~#E8F1FF`, chair `~#2E2A28`. Green variant `~#1E6B3A`.

**(c) Direction for Tokonmon**
- **Volto ultimate backgrounds:** a deep blue void with white branching arcs. Used for Volto Elemental Form cut-ins (Zapanda, Lemmo / Alpha Lemmo, Dontstopmeow, Radiogaga, Ziggystar, Hotarumi, Mechanyan).
- **Thrash's "throne" *(proposal)*:** an **amp-stack throne** crackling with blue arcs (a power seat, not an execution device). The green-tint poster in the hideout is a collector's
  Easter egg.

**(d) Do / Don't**
- Do: a blue void with white arcs.
- Don't: an electric chair or any execution imagery.

### A32. Metallica: *Kill 'Em All* (1983)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Kill_%27Em_All

**(b) Study notes [K]**
- **The image:** a photograph of the **shadow of a hand** above a **hammer lying in a pool of blood**. Stark B/W with red, logo on top.
- **Palette:** B/W plus blood red `~#9E0F14`.

**(c) Direction for Tokonmon**
- **Team Metallica's calling-card sticker (story step 5, the ice-cream challenge, bible §2):** a hand's shadow over a **dropped
  sledgehammer in a puddle of melted strawberry ice cream**. The punks slap it on Yuzu's ice-cream counter. Moshbull and Studrat sprites can carry
  hammers.

**(d) Do / Don't**
- Do: a stark single prop with a hard shadow.
- Don't: blood.

### A33. Metallica: "Enter Sandman" (1991) and the *Metallica* ("Black Album") sleeve

**(a) References**
- [K] https://en.wikipedia.org/wiki/Enter_Sandman
- [K] https://en.wikipedia.org/wiki/Metallica_(album)

**(b) Study notes [K]**
- **Sleeve:** all **black**, with the logo and a **coiled snake** ("Don't Tread on Me" style) barely visible in dark grey.
- **Video:** directed by Wayne Isham. A **child's nightmares** (falling, drowning, a snake in the bed, being chased by a truck, a creepy old "sandman") intercut with the band, in
  **desaturated blue-grey** tones.
- **Musical feel:** a heavy mid-tempo groove (~123 BPM) in E minor, built on a lullaby-versus-nightmare contrast.
- **Palette** (approximate): black, slate `~#3C4652`, moonlight `~#C9D3DD`. Our "sand" accent `~#C8A55A`.

**(c) Direction for Tokonmon**
- **Sandmare (Ecto/Geo, "Enter Sandman"):** a **night-mare horse made of drifting sand**.
  - an **hourglass mane** that empties as it attacks and refills when it idles;
  - a tail like a **coiled sand serpent**;
  - eyes like two dim moons.
- **Palette:** night blue-grey with sand gold.
- **VFX:** sleep fog of slow-falling sand grains (Ecto + Geo), and a desaturation pulse on the screen edges when its sleep move lands.

**(d) Do / Don't**
- Do: dreamlike desaturation; sand particles; a lullaby-into-nightmare feeling.
- Don't: the coiled-snake flag icon; child-in-danger imagery.

### A34. Black Sabbath: *Paranoid* (1970) and "Iron Man"

**(a) References**
- [K] https://en.wikipedia.org/wiki/Paranoid_(album)
- [K] https://en.wikipedia.org/wiki/Iron_Man_(song)

**(b) Study notes [K]**
- **Paranoid sleeve:** photographed by Keith "Keef" Macmillan. A **blurry figure in a helmet with shield and sword** steps out of dark trees, in a pink-white motion blur on
  black. It illustrates the planned title "War Pigs".
- **"Iron Man":** a slow, plodding, unison heavy riff (~76 BPM), an intro of **ring-modulated robotic voice**, doom heaviness. Lyrically, a time traveller
  turned to steel who is ignored and takes revenge.
- **Palette** (approximate): rust `~#6E4B3A`, steel `~#7D8791`, ember `~#FF7A1A`, blur pink `~#E9B9C9`.

**(c) Direction for Tokonmon**
- **Ironmaw (Ferro, "Iron Man"):**
  - a hulking **iron jaw** creature with rivets, rust bloom and ember eyes;
  - it moves slowly with ground-shaking steps, every step on a beat at 60 BPM half-time;
  - its sprite has rust patches dithered over steel.
- **Paranoid motion blur:** a **ghost-trail** effect when metal bullies charge (two trailing silhouettes at 50 % and 25 %, tinted pink-grey).

**(d) Do / Don't**
- Do: weight; rust; a ring-mod "robot" growl in its cry.
- Don't: anything resembling **Marvel's Iron Man** armour (red and gold suit, faceplate, arc reactor). That is a separate IP.

### A35. Michael Jackson: *Thriller* (1982) and the "Thriller" video (1983)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Thriller_(album)
- [K] https://en.wikipedia.org/wiki/Thriller_(song)

**(b) Study notes [K]**
- **Album cover:** photographed by Dick Zimmerman. Jackson in a **white suit** reclines on white, with a **tiger cub** in the gatefold (its paw is visible on the cover).
- **Video:** directed by John Landis. A werewolf and zombie transformation, a **red leather jacket with black V-shaped ribs**, synchronised **zombie choreography**, graveyard fog and moonlight.
- **Musical feel:** ~118 BPM, a minor-key funk groove, horror sound effects (creaking door, howl, footsteps) and a spooky spoken interlude.
- **Palette** (approximate): suit `~#F4F1EA`, jacket red `~#B3141C`, zombie grey-green `~#7E8A6A`, night `~#1B2340`.

**(c) Direction for Tokonmon**
- **Thrillghoul (Ecto, "Thriller"):**
  - a lanky dancing ghoul;
  - a **crimson carapace with chevron bands across the belly**, never the shoulder V-rib layout of the real jacket;
  - glowing eyes and torn-cloth ribbons.
- **Its emote (bible §6, dance):** small ghost minions pop up and perform a **synchronised group dance on the beat**.
- **Battle entrance:** fog rolls in, a moon flares and a howl sound effect lands on the downbeat.

**(d) Do / Don't**
- Do: horror comedy; choreography locked to the beat.
- Don't: the red jacket's real design; a white glove and fedora combination; any likeness; the spoken interlude style.

### A36. David Bowie: *The Rise and Fall of Ziggy Stardust and the Spiders from Mars* (1972)

**(a) References**
- [K] https://en.wikipedia.org/wiki/The_Rise_and_Fall_of_Ziggy_Stardust_and_the_Spiders_from_Mars

**(b) Study notes [K]**
- **Photo:** by **Brian Ward** in **Heddon Street, London**, at night in the rain. Bowie, with a guitar, stands alone under a lit shop sign. The colour is
  **hand-tinted** (Terry Pastor), with cold blue-green tones and warm lamp yellow. The back cover has a red phone box.
- **Costume:** a teal-green quilted jumpsuit.
- **Palette** (approximate): night `~#22344F`, lamp `~#F2C14E`, sign `~#E8E2C8`, jumpsuit `~#2F7F7A`, wet reflections.

**(c) Direction for Tokonmon**
- **Ziggystar (Astro/Volto):** a glam **star-creature** (a star-shaped alien with platform-boot legs, a glitter mane and a lightning mark; see A37).
- **Its encounter scene *(proposal)*:** a **Shinsekai back-alley at night in the rain**, under one warm shop sign with an original name.
  The phone box becomes a **green Japanese public phone booth**. Hand-tinted look: cold ambient light plus one warm key.

**(d) Do / Don't**
- Do: a lone figure under a lit sign; wet reflections; hand-tint.
- Don't: the real sign's text; a guitar-holding figure in the same stance.

### A37. David Bowie: *Aladdin Sane* (1973)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Aladdin_Sane

**(b) Study notes [K]**
- **Photo:** by **Brian Duffy**. A **red-and-blue lightning bolt** across the face, eyes closed, red hair, on a white background. An airbrushed
  **teardrop** sits on the collarbone (Philip Castle airbrush).
- **Palette** (approximate): bolt red `~#D2232A`, bolt blue `~#2B6FB6`, skin `~#F2E3D5`, hair `~#C4472B`, `#FFFFFF`.

**(c) Direction for Tokonmon**
- **Ziggystar's face marking:** an **asymmetric three-colour zig-zag** (Astro violet `~#7A4FD0`, Volto yellow `~#FFD23F`, white) running
  *down one side of the body*, not across the eye. A **liquid-silver droplet gem** sits on its collar.

**(d) Do / Don't**
- Do: glam make-up as an element marking.
- Don't: a red and blue bolt diagonally across one eye.

### A38. Kenshi Yonezu: "Lemon" (2018)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Lemon_(Kenshi_Yonezu_song)
- [K] https://en.wikipedia.org/wiki/Kenshi_Yonezu

**(b) Study notes [K]**
- **Context:** the theme song of the TBS drama *Unnatural* and a record-breaking hit in Japan.
- **Artwork:** Yonezu **paints his own cover art**. The cover's specific content has not been confirmed *(verify)*.
- **Music video:** a pale, chapel-like set with slow camera moves *(verify the details)*.
- **Sound:** ~87 BPM *(verify)*, piano, strings and band, and a distinctive **percussive vocal "hiccup" sample** used as a rhythmic accent. The mood is grief, **bittersweet**.
- **Palette** (lemon motif, approximate): lemon `~#F4D03F`, peel shadow `~#C9A227`, leaf `~#5E8C3A`, bittersweet grey-blue `~#8FA3B0`.

**(c) Direction for Tokonmon**
- **Lemmo and Alpha Lemmo (Volto; the lemons of the beetle evolution, bible §3):**
  - **Lemmo:** a sour-faced lemon that **puckers** when it attacks. The **lemon-battery** joke (copper and zinc nail "antennae") explains Volto.
  - **Alpha Lemmo:** a crowned big lemon with zest spikes and a peel cape.
- **Mood:** bittersweet. Alpha Lemmo's defeat animation is slightly melancholic: a slow peel unfurl.
- **Music:** see §B3.8 for the Lemmo encounter cue.

**(d) Do / Don't**
- Do: lemon-battery science humour; a bittersweet tone.
- Don't: Yonezu's paintings; the vocal hiccup sample; any lyric.

### A39. Japanese city pop: Mariya Takeuchi, "Plastic Love" (1984)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Plastic_Love
- [K] https://en.wikipedia.org/wiki/City_pop
- [K] https://en.wikipedia.org/wiki/Mariya_Takeuchi

**(b) Study notes [K]**
- **Release:** from the album *Variety* (1984), arranged and produced by **Tatsuro Yamashita**.
- **Revival:** in 2017 a YouTube upload whose still image is a portrait of Takeuchi (taken from a different release *(verify)*) made the song the face of city pop online. An official video followed in 2019.
- **Sound:** ~100–106 BPM *(verify)*, minor-key urban funk and disco:
  - a light four-on-the-floor;
  - octave-popping bass;
  - Rhodes;
  - string pads;
  - horn stabs;
  - **tight guitar "cutting"**;
  - a late-night, wistful mood.
- **City-pop visual language:** illustrators such as **Eizin Suzuki** and **Hiroshi Nagai**:
  - flat sky gradients, pools, palm trees, empty resort architecture, convertibles, diners;
  - 1980s Japanese ad typography (thin sans with English captions).
- **Palette** (approximate): dusk `~#FF9A8B → ~#FF6A88 → ~#6A5ACD → ~#2B2D6E`, pool aqua `~#5ED1E2`, architecture white `~#F5F5F0`, neon pink `~#FF4FA3`, neon cyan `~#3FF0FF`.

**(c) Direction for Tokonmon** (Osaka 2050 vibe, bible §1, §9)
- **City palette:** the overworld at dusk, the title screen and Umeda skyline gradients use the city-pop dusk ramp. The existing `title` track
  ("Neon Skyline: city pop", 100 BPM) already matches.
- **Billboards and maglev ads:** a Nagai and Suzuki-like flat-gradient poster style with original English-Japanese copy (thin sans, generous spacing).
- **Idol Lumi★ (bible §4):** her concert posters mix city-pop gradients with idol sparkle.

**(d) Do / Don't**
- Do: flat gradients; clean geometry; nostalgic-futurist mood.
- Don't: Takeuchi's photo; Nagai's or Suzuki's actual paintings; the song's melody or bass line.

### A40. Japanese city pop: Tatsuro Yamashita, "Ride on Time" (1980)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Tatsuro_Yamashita
- [K] https://en.wikipedia.org/wiki/City_pop

**(b) Study notes [K]**
- **Context:** Yamashita's breakthrough single and album (1980), tied to a **Maxell cassette tape TV commercial** in which he appeared.
- **Sound:** an up-tempo funk and soul-pop feel (~115–125 BPM *(verify)*):
  - tight 16th hi-hats;
  - punchy bass;
  - bright horns;
  - Yamashita's famous **one-man stacked vocal overdubs**;
  - **Telecaster "cutting"** rhythm guitar.
- **Cover art:** not confirmed *(verify)*.

**(c) Direction for Tokonmon**
- **Phone travel sting *(proposal)*:** when you travel with the phone map (bible §8), play a 2-bar city-pop sting at 120 BPM:
  - a cutting guitar figure;
  - a horn stab;
  - a stacked "aah" `choir` chord.
- **In-world ads:** **2050 "data-cassette"** product billboards (a homage to the cassette-tape commercials) in Umeda and the maglev stations.

**(d) Do / Don't**
- Do: cutting guitar; stacked vocal chords as `choir` pads.
- Don't: the hook, the brass line or the chorus melody.

---------------------------------------------------------------------------------------------------

## Part B: Music style analyses and original-track specs (for the composer)

### B0. Composer brief: how to read a spec

- **Notation follows `src/audio/music.js`.** One bar has 16 steps (`res: 4`). Drum and chord grids are shown one bar per 16 characters,
  with a space between bars. Chord grids use the engine's symbols (`Bb`, `Gm7`, `F7sus4`, `C/D`, `Ebm6`, `F69`, and so on, all in `QUAL`).
  `rel` tokens are chord-relative (`1 3 5 b7 8 >`; `,` means octave down). `abs` tokens are note names (`c4:2`, with `/` for slide-in).
- **Everything below is original.** The analyses describe *what makes the style*. The specs are new compositions *in that spirit*. "Seed
  motifs" are optional original starting points. The composer may replace them, and must run the §0.2 self-test on every melody they write.
- **The tempo always comes from §0.4** (frame-locked). Sections change *feel* (half-time, double-time, shuffle) rather than BPM, so the beat
  clock that drives VFX stays constant within a track.
- **Intensity mapping** (`audio.setIntensity`), a *(proposal)* for battle state:

  | Battle state | Intensity |
  |---|---|
  | Neutral | 0.2 |
  | Your Tokonmon bonded | +0.25 |
  | Combo streak of 3 or more on-beat hits | +0.15 |
  | Opponent below 30 % | +0.2 |
  | Ultimate cut-in | 1.0 for 2 bars |

  Layers use `int: [in, full]` exactly like the existing `battle` track.
- **Each battle track exposes sync markers:** bar numbers where phase changes, ultimates and camera cuts may land (§B5).
- **Loudness:** match the existing tracks (`vol` 0.6–0.85 for full-band battle tracks). Leave about 3 dB of headroom for crowd SFX (§B4).

### B1. Elite Four: "The Beatles". Style study and five original battle themes

**(a) References**
- [S] Wikipedia, Strawberry Fields Forever: https://en.wikipedia.org/wiki/Strawberry_Fields_Forever
- [S] Wikipedia, Penny Lane: https://en.wikipedia.org/wiki/Penny_Lane
- [S] The Beatles Bible, SFF promo: https://beatlesbible.com/songs/strawberry-fields-forever/3
- [K] Alan W. Pollack, "Notes On…" series (song-by-song harmonic analyses): https://www.icce.rug.nl/~soundscapes/DATABASES/AWP/awp-notes_on.shtml
- [K] Ian MacDonald, *Revolution in the Head* (book): track-by-track production notes
- [K] Walter Everett, *The Beatles as Musicians* (two volumes, book)
- [K] https://en.wikipedia.org/wiki/Merseybeat
- [K] https://en.wikipedia.org/wiki/Tomorrow_Never_Knows
- [K] https://en.wikipedia.org/wiki/The_End_(Beatles_song)
- [K] https://en.wikipedia.org/wiki/Artificial_double_tracking
- [K] https://en.wikipedia.org/wiki/Rickenbacker_360/12
- [K] https://en.wikipedia.org/wiki/H%C3%B6fner_500/1
- [K] https://en.wikipedia.org/wiki/Mellotron

**(b) Study notes by era [K]** (BPMs are approximate and only calibrate feel)

| Era | Tempo and feel | Keys | Signature sounds | Arrangement tricks |
|---|---|---|---|---|
| **Merseybeat 1963–64** | fast and bright: about 130–170 BPM (She Loves You ≈152, I Want to Hold Your Hand ≈131, A Hard Day's Night ≈139, Can't Buy Me Love ≈171) | guitar keys: G, E, D, C, A | 2 electric guitars through Vox AC30s; from 1964 the **Rickenbacker 12-string** chime; **Höfner violin bass** (short, thumpy, flatwound); handclaps; harmonica on early singles | starts with the hook or chorus; 2–2:30 length; AABA with a "middle eight"; stop-time breaks; falsetto "ooh" with head-shake; **2–3-part harmonies in parallel 3rds and 5ths**; an **added-6th final chord** |
| **Rubber Soul / Revolver 1965–66** | mid tempos, 95–140 (Taxman ≈129, Tomorrow Never Knows ≈130, Eleanor Rigby ≈137) | D, C, E minor | sitar; fuzz bass; **backwards guitar**; **tape loops**; **ADT** double-tracking (invented at EMI for Revolver); Leslie-speaker vocal; double string quartet; brass section; close-miked, damped drums | **one-chord drones** with a **bVII** colour (Mixolydian); dominant-7 riffs; melodic, louder bass |
| **Sgt. Pepper / Magical Mystery Tour 1967** | 80–135; meter shifts (3/4 verse, 4/4 chorus in Lucy) | A, B, G, E | **Mellotron flute** (the SFF intro); swarmandal; **piccolo trumpet** (Penny Lane); cellos; varispeed; Lowrey organ; tabla, dilruba, tambura | **two takes spliced at different speeds and keys** (SFF); orchestral **crescendo glissando** (A Day in the Life); fake endings and fade-ins; segues between tracks; crowd sound effects; music-hall pastiche (clarinets) |
| **White Album / Abbey Road 1968–69** | 65–130 (Come Together ≈83, Something ≈66, Here Comes the Sun ≈129) | A, C, D minor | acoustic **Travis-picking**; **Moog** synthesiser; swampy sliding bass; Ringo's tea-towel-damped toms; 3-part vocals tripled (9 voices) | **the Abbey Road medley:** about 16 minutes of linked fragments with segues and reprises. "The End" holds Ringo's only drum solo and a **three-way guitar trade, 2 bars each, three rounds**. Odd-meter groupings in the "Here Comes the Sun" bridge *(verify the exact meters)* |

- **Chord vocabulary to borrow** (as *functions*, never as a famous song's sequence):
  - **bVII** (Mixolydian lift: in C, a Bb chord) and **I–bVII–IV–I** motion.
  - **Minor iv** (in C, an Fm chord) for wistfulness.
  - **bVI–bVII–I** heroic cadence.
  - **II7** (major supertonic, a "lift": in C, a D7 chord).
  - **III7** (V of vi, a surprise: in C, an E7 chord).
  - Augmented passing chords (I–I+–I6–I7).
  - A **chromatic line** descending under a held chord.
  - Key shifts by a **minor third** or a **semitone** between sections.
  - **Added-6th or 6/9** final chords.
- **Ringo's feel:**
  - sits slightly **behind the beat**;
  - loose, half-open **hi-hat wash** in the early era;
  - **fills that lead with the left hand and go round "backwards"** (a left-hander on a right-handed kit);
  - plays for the song, with tom-heavy grooves in the psychedelic period.
- **Höfner bass role:** short notes and **melodic counter-lines** that answer the vocal (most clearly from 1966).
- **Rickenbacker 12-string:** the octave courses produce a shimmering "chime" on arpeggiated chords and short stabs.

**(c) Direction: the original Elite Four set**

#### B1.1 Shared rules (all five tracks)

- **120 BPM**: 6 poses per beat, and the 7 s switch and 15 s cooldown both land on whole beats (§0.4).
- **The shared "Brigade" signature:** the B section of every member theme ends with the lift **II7 → V7sus4 → V7** back into the loop, and the brass or lead plays the League's
  original **rhythmic cell "short-short-long"** (8th, 8th, dotted quarter) at the start of every A section. The cell is rhythm only; each member theme puts different pitches on it.
- **One element per member,** matching the Beatlet forms (bible §3): John → Lenshorn (Echo), Paul → McCarapace (Hydro),
  George → Harrisun (Pyro), Ringo → Starrab (Geo).

#### B1.2 Elite Four "John" (Lenshorn, Echo): "Echo Chamber"

- **Header:** `id:'e4_john' bpm:120 res:4 human:0.004 rev:0.22 transpose:0`, with track `delay:{beats:0.75}` for tape-echo throws.
- **Key and mode:** **C Mixolydian** drone (C pedal, with Bb as the colour).
- **Inspiration (style only):** the mid-60s drone and tape-loop psychedelia.

| Part | Patch | Settings | Role |
|---|---|---|---|
| `drone` | `drone` | chord, `voicing:{center:48,n:2}`, `o:{cut:900, rate:0.13}` | tanpura-like C+G bed |
| `kick` / `snare` / `tom` / `hat` / `tamb` | `kick` rock, `snare` tight (damped), `tom`, `hat`, `tamb` | | tom-heavy, looped groove |
| `bass` | `bass` | rel, `o:{wave:'triangle', cut:700, env:1, sub:0.3}` | pedal ostinato |
| `sitar` | `koto` | abs, `o:{decay:2}`, slides `/` | modal phrases |
| `gull` | `lead` | abs, `o:{wave:'sawtooth', glide:0.12, vib:30, cut:2600}`, `dly:0.35`, `int:[0.3,0.5]` | **tape-loop "gull" glides**, a texture rather than a melody |
| `leslie` | `choir` | abs, `o:{vowel:'u'}`, `chorus:0.9`, `int:[0.45,0.7]` | swirling sustained notes |
| `gtr` | `guitar` | chord, amp drive 1.2 | off-beat chimes |

| Section | Bars | Chords | What happens |
|---|---|---|---|
| `intro` | 4 | `C \| C \| C \| C` | drone and gull glides; a **reversed swell** (`fxRiser`) over bars 3–4 |
| `A` | 8 | `C \| C \| C \| Bb/C \| C \| C \| Bb/C \| C` | groove, sitar phrases, bass ostinato |
| `B` | 8 | `Bb \| F/A \| C \| C \| Bb \| F/A \| D7 \| G7sus4 G7` | the Leslie choir enters; **II7 → V7 lift** |
| `C` | 4 | `C \| C \| C \| C` | break: drums, bass and tape throws only. **Camera-cut bars** |

`form: ['intro','A','B','A','C']`, `loop: 1`. One pass from `A` is 28 bars, 56 s.

Drums (A):
```
kick  | X..x....X.x..... |
snare | ....X.......X..o |
tom   | ......12......3. |
hat   | x.x.x.x.x.xOx.x. |
tamb  | ....x.......x... |
```
- **Bass (A, rel):** `1:3 1:1 8:2 1:2 b7,:2 1:2 5,:2 1:2`.
- **Sitar seed motif (original, 2 bars):** `g4:2 bb4:2/ c5:4 d5:3/ c5:1 bb4:4 | g4:6/ f4:2 g4:8`.
- **Melody rules:** narrow range (a 6th at most), chant-like repetition, slides into the b7 and 3rd, long held tones with vibrato.

#### B1.3 Elite Four "Paul" (McCarapace, Hydro): "Canal Bounce"

- **Header:** `id:'e4_paul' bpm:120 res:4 human:0.005 rev:0.16`.
- **Key:** **Bb major**, with borrowed iv and II7/III7 colours. Straight eighths, a bouncy piano-and-bass music-hall rock feel.

| Part | Patch | Settings |
|---|---|---|
| `piano` | `epiano` | chord, `voicing:{center:64,n:4}`, high velocity, `o:{roll:0.012}` |
| `honk` | `pluck` | chord one octave up, `vol` low, the honky-tonk doubling |
| `bass` | `bass` | rel, triangle, `cut:650`, the melodic walking line (Höfner role) |
| `picc` | `lead` | abs, `oct:+1`, `o:{wave:'square', wave2:'triangle', vib:8, glide:0.02}`, `int:[0.35,0.55]` (a piccolo-trumpet-like lead) |
| `brass` | `brass` | chord, `voicing:{center:66,n:3}` |
| `strings` | `strings` | chord, bridge only |
| `kick` / `snare` / `hat` / `tamb` | tight kit | |

| Section | Bars | Chords |
|---|---|---|
| `intro` | 2 | `Bb \| F7` (piano alone) |
| `A` | 8 | `Bb \| Gm7 \| Eb \| F7 \| Bb \| D7 \| Eb Ebm6 \| Bb F7` |
| `B` | 8 | `Eb \| Bb/D \| Cm7 \| F7 \| Eb \| Bb/D \| C7 \| F7sus4 F7` |
| `bridge` | 8 | `Db \| Bbm7 \| Gb \| Ab7 \| Db \| Bbm7 \| Eb7 \| F7` (up a **minor third**, then back through F7) |
| `tag` | 2 | `Bb \| F7` |

`form: ['intro','A','B','A','bridge','B','tag']`, `loop: 1`.

Drums and piano (A):
```
kick  | X.......X..x.... |
snare | ....X.......X... |
hat   | x.x.x.x.x.x.x.x. |
tamb  | ..x...x...x...x. |
piano | x...X...x...X... |
```
- **Bass (A, rel, walking):** `1:4 3:2 5:2 6:4 >:4`. The `>` is a chromatic approach into the next chord.
- **Melody rules:**
  - stepwise motion broken by **leaps of a 6th**;
  - dotted rhythms;
  - phrase ends on the **6th or 9th** of the chord (sweet);
  - the piccolo lead answers the piano in **call and response**.
- **Hydro touch:** a `glock` "droplet" ping on beat 4 of every 4th bar.

#### B1.4 Elite Four "George" (Harrisun, Pyro): "Sunrise Raga"

- **Header:** `id:'e4_george' bpm:120 res:4 human:0.006 rev:0.25`.
- **Key:** **D**, with a Khamaj-like double 7th (C# when rising, C natural when falling). The tanpura drone stays on **D + A** throughout.
- **Story tie:** Harrisun evolves after **dojo meditation, then sunrise** (bible §3). Reuse this track's `dawn` section for that evolution scene.

| Part | Patch | Settings |
|---|---|---|
| `tanpura` | `drone` | chord, `voicing:{center:50,n:2}`, `o:{rate:0.09}` |
| `sitar` | `koto` | abs, `o:{decay:2}`, many `/` slides (meend) |
| `tablaHi` | `tom` | drum, `note:74` |
| `tablaLo` | `tom` | drum, `note:50` |
| `ka` | `ka` | |
| `acou` | `acoustic` | chord, a strummed 12-string feel |
| `moog` | `lead` | abs, `o:{wave:'sawtooth', glide:0.06, cut:3000, vib:10}`, `int:[0.4,0.6]` |
| `bass` / `kick` / `snare` / `hat` / `crash` | rock kit | |

| Section | Bars | Chords | What happens |
|---|---|---|---|
| `dawn` | 8 | `D` (pedal) | tanpura plus free-feeling sitar phrases of long notes and slides; sparse tabla; `fxShimmer` on bar 7 |
| `A` | 8 | `D \| D \| C/D \| D \| G/D \| D \| Em7 A7sus4 \| D` | groove enters over the pedal |
| `B` | 8 | `G \| A \| Bm7 \| A \| G \| A7sus4 \| D/F# \| A7` | the bright "sunrise" Moog lead. **Bars 7–8 use a metric illusion** (below) |

`form: ['dawn','A','B','A','B']`, `loop: 1`.

Tabla (dawn and A) and rock grid (A):
```
tablaHi | x.xx..x.x.xx..x. |
tablaLo | X.....x...X..... |
ka      | ...x.......x.... |
kick    | X.....X.X....... |
snare   | ....X.......X... |
hat     | x.x.x.x.x.x.x.x. |
```
- **Metric illusion (B, bars 7–8):** kick, crash and guitar stab together in **3+3+3+3+2+2** groupings. It *feels* like odd meter but stays on the 4/4 grid,
  so the beat clock is safe:
  ```
  kick+crash | X..X..X..X..X.X. |
  ```
- **Melody rules:**
  - The sitar stays inside a raga-like scale and **always resolves to D (Sa) or A (Pa)**.
  - The Moog lead uses wide portamento leaps (5ths and octaves) climbing over the 8 bars of B, like the sun rising.

#### B1.5 Elite Four "Ringo" (Starrab, Geo): "Coral Parade"

- **Header:** `id:'e4_ringo' bpm:120 res:4 swing:0.2 human:0.007 rev:0.18`.
- **Key:** **G major**; the final A section goes **up a whole step** (to A).
- **Feel:** a sing-along oompah shuffle, drum-forward. It is a parade, not a ballad.
- **Story tie:** Starrab evolves after **25 team combos** (bible §3). The **2-bar drum breaks** are this track's team-combo showcase windows (§B5).

| Part | Patch | Settings |
|---|---|---|
| `tuba` | `bass` | rel, `oct:-1`, `o:{wave:'triangle', cut:500, env:0.6, sub:0.4}` |
| `brass` | `brass` | chord, `voicing:{center:64,n:3}` |
| `glock` | `glock` | abs, the toy-band melody doubling |
| `gang` | `gang` | `o:{voices:6}` |
| `kick` / `snare` / `hat` / `tom` / `crash` / `tamb` | `snare` rock, `kick` rock | |

| Section | Bars | Chords |
|---|---|---|
| `count` | 1 | `G` (drum count-in fill) |
| `A` | 8 | `G \| G \| C \| G \| Em \| Am7 D7 \| G E7 \| Am7 D7` |
| `B` | 8 | `C \| G \| D7 \| G \| C \| G \| A7 \| D7` (the A7 is the **II7 lift**) |
| `A2` | 8 | `A \| A \| D \| A \| F#m \| Bm7 E7 \| A F#7 \| Bm7 E7` (up a whole step) |
| `brk` | 2 | `A \| D7` (drum break, team-combo window) |

`form: ['count','A','B','A2','brk']`, `loop: 1`.

Drums and oompah (A):
```
kick  | X.......X....... |
snare | ....X.......X... |
hat   | x.x.x.x.x.x.x.x. |
brass | ....x-......x-.. |
```
- **Tuba (rel):** `1:4 r:4 5,:4 r:4`.
- **Fill on every 4th bar (bar 4 only):** `tom | ........1.2.3.4. |`.
- **Drum break `brk` (2 bars):**
  ```
  snare | X.x.X.x.X.xxX.xx X.X.X.X.XXXXXXXX |
  tom   | ................ 1.1.2.2.3.3.4.4. |
  kick  | X.......X....... X...X...X...X... |
  ```
- **Gang:** "HEY" on beat 1 of B bars 4 and 8 (original shout, no words).
- **Melody rules:** a simple sing-along, mostly stepwise, range of an octave, repeated 2-bar phrases. The glock doubles the line one octave up.

#### B1.6 Elite Four Final (all four): "Encore Suite" (medley, Abbey-Road-medley *method*)

- **Header:** `id:'e4_final' bpm:120 res:4 human:0.004 rev:0.2`, track `delay:{beats:0.75}`.
- **Concept:** chained short segments with segues, **reprising the four member themes' own original cells** from B1.2–B1.5, then a drum solo, then a three-voice
  **lead trade**, then an orchestral coda. Each segment changes feel, never BPM.

| # | Section | Bars | Key | Content | Chords |
|---|---|---|---|---|---|
| 1 | `ovt` | 8 | Eb | half-time overture: strings, brass, piano | `Eb \| Ab/Eb \| Eb \| Bb7sus4 \| Cm \| Ab \| F7 \| Bb7` |
| 2 | `echo` | 4 | C | the John cell (drone, tom groove, sitar) | `C \| C \| Bb/C \| C` |
| 3 | `canal` | 4 | Bb | the Paul cell (piano bounce, walking bass, piccolo) | `Bb \| Gm7 \| C7 \| F7` |
| 4 | `sun` | 4 | D | the George cell; **bar 4 is the 3+3+3+3+2+2 illusion** | `D \| C/D \| G/D \| A7` |
| 5 | `parade` | 4 | G | the Ringo cell, as a straight-eighth march (swing is per-track) | `G \| C \| D7 \| D7` |
| 6 | `lull` | 8 | Eb | hush: piano, `choir` 'o', `snare` brush | `Eb \| Gm/D \| Cm \| Ab \| Fm7 \| Bb7 \| Eb/G Ab \| Bb7sus4` |
| 7 | `weight` | 8 | Eb → F | full-band reprise of `ovt` material, **up a whole step at bar 5** | `Eb \| Ab/Eb \| Eb \| Bb7 \| F \| Bb/F \| F \| C7sus4` |
| 8 | `drums` | 8 | – | Starrab drum solo plus crowd stomps (drums only) | – |
| 9 | `trade` | 12 | F | lead trade, 2 bars each, **3 voices × 2 rounds**: Lenshorn (`lead` square, Echo delay), McCarapace (`lead` triangle, clean), Harrisun (`lead` saw, `amp:{drive:5}`) | `F7 \| Bb7 \| F7 \| C7 \| F7 \| Bb7 \| F7 \| C7 \| Bb7 \| Bb7 \| F7 \| C7` |
| 10 | `coda` | 4 | F | orchestral swell (`fxRiser`), then the **final 6/9 chord** | `Bb \| C7sus4 \| F69 \| F69` |

- `form: ['ovt','echo','canal','sun','parade','lull','weight','drums','trade','coda']`, `loop: 1` (back to `echo`).
- **Length:** 64 bars, 128 s.
- **Sync map** (the bar numbers below are track bars, counting the overture from bar 1):
  - **Spotlight cues:** bars 9, 13, 17 and 21 start each member segment. Light the matching tribute trainer and play that trainer's Tokonmon crowd chant (§B4).
  - **Phase change:** jump to `lull` (bar 25) at the next bar line.
  - **Preferred ultimate impacts:** bar 33 (start of `weight`), bar 41 (start of `drums`) and bar 63 (the coda's 6/9 chord).
  - **The white-silence beat** (A6) is the bar before the track starts.
- **Drum solo grid (`drums`, 8 bars):** a 2-bar tom-cascade cell repeated with growing density. Original, built from the Ringo fill vocabulary: lead with the left hand, run floor tom → high tom ("backwards").
  ```
  tom   | 4...3...2...1... 4.4.3.3.2.2.1.1. |
  kick  | X.......X....... X...X...X...X.X. |
  snare | ....x.......x... ....X..X..X.XXXX |
  crash | X............... ................ |
  ```
  Bars 5–8 use the same cell with `kick` in 8ths and the `snare` roll doubled.
- **Lead trade rules:** each 2-bar solo starts on its owner's element motif and ends on the next owner's starting note (a baton pass). Round 2 is faster: 16ths instead of 8ths.

**(d) Do / Don't**
- Do:
  - use Mixolydian bVII and II7 lifts;
  - use melodic bass and jangle chimes;
  - lay brass and Mellotron-flute colours over a rock band;
  - make medley segues land exactly on bar lines.
- Don't:
  - quote any Beatles melody, riff, bass line or drum intro;
  - copy The End's A7/D7 trade vamp (we use a 12-bar F blues instead);
  - copy She Loves You's sixth-chord ending voicing (we use 6/9);
  - use a backwards vocal;
  - imitate a famous drum intro;
  - let the sitar phrase resemble any known raga-rock song.

### B2. Champions: "Queen". Style study and original champion battle theme

**(a) References**
- [S] Wikipedia, Queen's performance at Live Aid: https://en.wikipedia.org/wiki/Queen%27s_performance_at_Live_Aid
- [S] uDiscover, Queen at Live Aid: https://www.udiscovermusic.com/stories/queen-live-aid-concert-performance
- [S] Louder, News of the World story: https://loudersound.com/features/queens-news-of-the-world-the-story-behind-the-cover
- [S] American Songwriter, Queen II cover story: https://americansongwriter.com/queen-ii-queen-album-cover-story-explained
- [K] https://en.wikipedia.org/wiki/We_Will_Rock_You
- [K] https://en.wikipedia.org/wiki/Bohemian_Rhapsody
- [K] https://en.wikipedia.org/wiki/Red_Special
- [K] https://en.wikipedia.org/wiki/Deacy_Amp
- [K] https://en.wikipedia.org/wiki/Another_One_Bites_the_Dust
- [K] https://en.wikipedia.org/wiki/Radio_Ga_Ga
- [K] https://en.wikipedia.org/wiki/Don%27t_Stop_Me_Now

**(b) Study notes [K]**
- **Stadium rhythm:**
  - "We Will Rock You" (≈81 BPM) is built on **stomp-stomp-clap**, recorded by overdubbing many stomps and claps on boards with **delays at non-musical
    intervals** so the room sounds enormous. It is otherwise a-cappella until a closing guitar solo.
  - At Live Aid, 72,000 people performed the **"Radio Ga Ga" (≈112 BPM) overhead double-clap** [S for the set, K for the clap].
- **Brian May's guitar orchestra:**
  - the home-built **Red Special**, a bank of **Vox AC30s**, a treble booster, and a **sixpence coin** for a pick;
  - the **Deacy Amp** (a tiny transistor amp built by John Deacon) for violin-like tones;
  - **multi-tracked, harmonised lines in 3rds and 6ths**;
  - live **delay canons**, where the delay repeats harmonise the line ("Brighton Rock" style).
- **Vocals:** Mercury, May and Taylor stacked into a **choir**, with Taylor's very high falsetto on top. The operatic section of "Bohemian Rhapsody" used extreme
  overdubbing. Call-and-response antiphony between groups.
- **Piano:** Mercury's piano drives "Bohemian Rhapsody" (ballad intro), "Killer Queen" (≈117, honky staccato with finger snaps) and "Don't Stop Me Now"
  (≈156, F major, pumping 8ths).
- **Form:** "Bohemian Rhapsody" has **no repeating chorus**: a-cappella intro, ballad, guitar solo, opera, hard rock, coda. "We Are the Champions" is a slow
  power-ballad anthem.
- **Funk side:** "Another One Bites the Dust" (≈110, E minor) is a minimal bass-riff funk with dry drums, handclaps and reversed effects.
- **Drums (Roger Taylor):** big tuned toms, a **gong**, timpani colours, open hi-hats.
- **Harmony:** piano-key flats (Eb, Bb, Ab, F); secondary dominants; **diminished passing chords**; frequent **modulations by 3rds**; pedal points;
  chromatic bass descents.

**(c) Direction: the original track "Crowned Kansai"** (working title)

- **Header:** `id:'champions' bpm:144 res:4 human:0.003 rev:0.18 transpose:0`, track `delay:{beats:0.75}` (dotted-8th canon).
- **Why 144:** 5 poses per beat, and the **15 s switch cooldown is exactly 9 bars**. Half-time sections feel like 72.
- **Key plan:** **Eb major**, a **C minor** opera section, an **Ab** ballad break, and the anthem back in Eb.

| Part | Patch | Settings |
|---|---|---|
| `stomp` / `clap` | `stomp`, `clap` | `rev:0.4` (the big-room delays are in the track delay) |
| `kick` / `snare` | `kick` rock / `snare` rock | |
| `hat` / `crash` / `tom` | | |
| `timp` | `tom` | low pitched notes |
| `gong` | `fxBoom` + `crash` | crash `o:{decay:3}` |
| `piano` | `epiano` | high velocity, `o:{roll:0.01}`, plus `pluck` doubling |
| `bass` | `bass` | rock patch |
| `gtrL` / `gtrR` | `guitar` | chord, `amp:{drive:4}`, `pan` ±0.7, `nudge` 7 ms |
| `orch1` / `orch2` / `orch3` | `lead` | **guitar orchestra:** abs, `amp:{drive:5, cab:4200}`, `pan` −0.6 / 0 / +0.6, `o:{vib:14}`, `orn:true` on voices 2–3, `int:[0.3,0.5] / [0.55,0.7] / [0.6,0.8]` |
| `choirA` / `choirB` / `choirLo` | `choir` | `vowel:'a'` / `'a'` / `'o'`, `pan` −0.6 / +0.6 / 0, `chorus:0.6` |
| `gang` | `gang` | `o:{voices:6}`, `rev:0.4` |

| Section | Bars | Chords | Feel and content |
|---|---|---|---|
| `crest` | 4 | `Eb \| Cm/Eb \| Ab/Eb \| Bb7sus4` | half-time **"Royal Stomp"** plus stacked choir swells (a-cappella feeling) |
| `A` | 8 | `Eb \| Bb/D \| Cm \| Ab \| Eb/G \| Fm7 Bb7 \| Gb \| Bb7sus4 Bb7` | full-time rock; guitar orchestra in harmony; piano 8ths. The **Gb** (bIII) is the heroic borrowed chord |
| `B` | 8 | `Cm \| Ab \| Fm \| G7 \| Cm \| Ab \| Db \| Bb7` | **"Opera":** choir antiphony L and R; drums drop to timpani and stomp; gang shout on bar 8 |
| `C` | 8 | `Ab \| Fm7 \| Db \| Eb7sus4 \| Ab/C \| Db \| Bbm7 \| Eb7` | **ballad break** (half-time): piano arpeggios, choir pad, soft stomp. Plays during the **halftime arena choice** |
| `D` | 8 | `Ab \| Eb/G \| Fm7 \| Bb \| Ab \| Eb/G \| Cm7 F7 \| Bb7sus4 Bb7` | **"Anthem":** Royal Stomp under the full kit; crowd "Tokon double-clap" (§B4); F7 is the V/V lift |
| `E` | 4 | `Cb \| Db \| Eb \| Eb` | **"Cadenza":** stop-time hits; the guitar orchestra plays a **delay canon**; bVI–bVII–I |

- `form: ['crest','A','B','A','D','C','D','E']`, `loop: 1`.
- **Length:** 56 bars, about 93 s.
- **Phase plan:**
  - **First half:** loop A, B, A, D, E.
  - **Halftime:** jump to `C` at the next bar line.
  - **Second half:** jump to `D` at intensity 1.0.
  - **Final KO:** a `crown` stinger (a 2-bar choir-and-orchestra Eb69 chord with `fxBoom` and gong).

**"Royal Stomp"** (original variant of the stadium stomp-clap family; a 2-bar cycle at 144 felt as 72, with a pickup stomp and a final double clap):
```
stomp | X...X.........x. X...X.X......... |
clap  | ........X....... ........X...X... |
```

Drums (A):
```
kick  | X...X...X.x.X... |
snare | ....X.......X... |
hat   | x.x.x.x.x.x.x.x. |
piano | x.x.x.x.x.x.x.x. |
```
- **Bass (A, rel):** `1:2 1:2 1:2 1:2 1:2 1:2 5,:2 >:2`.

Opera antiphony (B):
```
choirA | X--.x-.......... |
choirB | ........X--.x-.. |
timp   | 1.......1...2... |
```
- **Guitar orchestra writing rules:**
  - Voice 1 carries the line.
  - Voice 2 sits a 3rd below, voice 3 a 6th below (or a 3rd above for climaxes).
  - Lines are mostly **stepwise with a held, vibrato-rich top note** every 2 bars.
  - Under the `E` canon, a dotted-8th track delay makes each phrase harmonise itself.
- **Choir writing rules:** 3–5-voice block chords on "ah"; short stabs in the opera section; long swells in the crest and ballad. Never a sung melody line, so no lyrics are implied.

**Partner entrance stings** (2 bars at 144; play when the Champion sends out a partner, bible §3):

| Tokonmon | Inspired by (style only) | Original sting |
|---|---|---|
| **Killerqueen** (Ecto/Bio queen bee) | 70s honky cabaret rock | staccato piano chord stabs, finger `snap` on 2 and 4, a "bee buzz" `lead` glide (saw, `vib:40`). `snap \| ....x.......x... \|`, `piano \| x.x...x.x.x..... \|` |
| **Bohemoth** (Echo/Ecto) | operatic multi-part suite | `choirA` calls a chord, `choirB` echoes it one beat later (Echo), then a **gong** on bar 2 beat 1 |
| **Dontstopmeow** (Volto speed cat) | pumping piano rock at speed | piano 8ths at full intensity, a rising 16th-note `lead` run, and a closing **"meow" glide** (`lead` triangle, `glide:0.15`, down then up a 5th) |
| **Radiogaga** (Echo/Volto radio robot) | 80s synth-pop anthem | 16th `pluck` square arpeggio, a robotic `choir` vowel sweep o→i, and the **Tokon double-clap** |
| **Bitesdust** (Geo) | minimal bass-riff funk | an original E Dorian 16th bass figure with rests (`bass` rock), dry `kick` and `snare`, a reversed cymbal (`fxRiser` 1 bar), `clap` on 2 and 4 |

**(d) Do / Don't**
- Do:
  - harmonised guitar choirs;
  - stacked "ah" choirs;
  - piano-led rock;
  - modulations by 3rds;
  - one stomp-clap family groove with our own accent pattern;
  - big toms and a gong on phase changes.
- Don't:
  - the exact "boom-boom-clap" at about 81 BPM in a-cappella context;
  - the Radio Ga Ga clap placement (beats 1 and 2 after the hook);
  - any Bohemian Rhapsody section order (ballad, then solo, then opera, then hard rock, in that sequence);
  - the "Another One Bites the Dust" bass riff shape (a repeated note into a descending run);
  - Galileo-style name chants;
  - the "We Are the Champions" chord climb.

### B3. Starter and artist motifs

All of B3 is **[K]** for the musical facts. The specs are original.

#### B3.1 Red Hot Chili Peppers funk-rock → Chilichick / Riffrooster / Funkadoodle (Pyro, Pyro/Echo)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Flea_(musician)
- [K] https://en.wikipedia.org/wiki/John_Frusciante
- [K] https://en.wikipedia.org/wiki/Chad_Smith
- [K] https://en.wikipedia.org/wiki/Slapping_(music)
- [K] https://en.wikipedia.org/wiki/Give_It_Away_(Red_Hot_Chili_Peppers_song)
- [K] https://en.wikipedia.org/wiki/Can%27t_Stop_(Red_Hot_Chili_Peppers_song)

**(b) Study notes [K]**
- **Tempos:** mostly **84–96 BPM** (Under the Bridge ≈84, Give It Away ≈92, Can't Stop ≈91, Californication ≈96).
- **Keys:** E and A minor, often **Dorian** (major 6th over a minor chord).
- **Flea's slap:**
  - thumb strikes on the low strings;
  - **index or middle-finger pops** on the high strings, usually **octaves**;
  - **dead or ghost notes** between them;
  - **16th-note syncopation**, with the pop often on the "e" or "a" of the beat.
- **Frusciante:**
  - **muted 16th "chicken-scratch"** strums;
  - Hendrix-style double-stops and hammer-on embellishments;
  - sparse, melodic, lots of space.
- **Chad Smith:** a hard kick, **snare ghost notes**, open hi-hat barks, cowbell accents.
- **Vocals:** rap-sung, percussive cadences.
- **Arrangement:**
  - funk verses switch to **distorted rock-out choruses**;
  - **stop-time breaks**;
  - **a bass-only intro**;
  - gang shouts.

**(c) Direction: the original track "Hot Pepper Strut"**
- **Header:** `id:'starter_pyro' bpm:90 res:4 swing:0.06 human:0.004 rev:0.1`.
- **Key:** **E Dorian**.

| Part | Patch | Settings |
|---|---|---|
| `slap` | `slap` | rel, `base:28`, `o:{popAbove:48}` |
| `scratch` | `guitar` | chord, `voicing:{type:'root', base:40}` (the patch builds root + 5th + octave), amp drive 1.5; the `m` steps are muted |
| `dist` | `guitar` | chord, `amp:{drive:5, scoop:-4}`, B section only, `int:[0.3,0.5]` |
| `vox` | `lead` | abs, `o:{cut:1800, vib:20}`, slides (a wah-ish vocal tone; *(proposal)* add `o.wah` for a filter sweep) |
| `kick` / `snare` / `hat` / `crash` | kick rock, snare tight, `hat` with `O` barks | |
| `gang` | `gang` | |

| Section | Bars | Chords | Content |
|---|---|---|---|
| `intro` | 2 | `Em7 \| A9` | slap bass alone |
| `A` | 8 | `Em7 \| A9 \| Em7 \| A9 \| Em7 \| A9 \| F#m7 \| G6 A9` | funk vamp |
| `B` | 4 | `C5 \| D5 \| E5 \| E5 G5` | distorted rock-out plus gang "HAH!" on bar 1 |
| `brk` | 2 | `Em7 \| Em7` | stop-time: everything hits on step 0 and step 6, then rests |

`form: ['intro','A','B','A','brk']`, `loop: 1`.

Drums and guitar (A):
```
kick    | X..x..X...X.x... |
snare   | ....X..o.o..X..o |
hat     | xxxOxxxxxxxOxxxx |
scratch | x.mxm.x.mxx.m.x. |
```
- **Slap (A, rel):** `1:1! x:1 8:1! x:1 1:1 r:1 b7:1 8:1! 1:2 x:1 5:1 8:1! r:1 b3:1 >:1`.
- **Riffrooster variant (the main evolution, a guitarist):** the `vox` lead becomes a hot guitar lead, and `dist` comes in from intensity 0.2.
- **Funkadoodle variant (the alternate, a bassist):** `slap` is +3 dB with extra `8!` pops, `scratch` plays only on the B section, and the drums gain ghost notes.
- **Chilichick send-out sting (1 bar):** a high `lead` note that **slides down a whole step** (the "crying from the heat" gag, bible §3), a sizzling open hat, and gang "HAH!".
- **Fire-breath SFX:** sync it to the snare backbeat.

**(d) Do / Don't**
- Do: octave pops; ghost notes; Dorian vamps; bass-only intros; stop-time breaks.
- Don't: any RHCP bass line or guitar riff; a rap cadence imitating a known verse; the Under-the-Bridge-style arpeggio intro.

#### B3.2 Prince / Minneapolis sound → Bubblion / Princeidon / Purple Rain (Hydro)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Minneapolis_sound
- [K] https://en.wikipedia.org/wiki/Linn_LM-1
- [K] https://en.wikipedia.org/wiki/Oberheim_OB-X
- [K] https://en.wikipedia.org/wiki/When_Doves_Cry
- [K] https://en.wikipedia.org/wiki/Purple_Rain_(song)
- [K] https://en.wikipedia.org/wiki/Soft_and_Wet

**(b) Study notes [K]**
- **The Minneapolis sound (early 80s):**
  - **synthesiser stabs in place of a horn section** (Oberheim OB-X / OB-8);
  - the **Linn LM-1 / LinnDrum** with dry, punchy, pitched toms and claps;
  - tight funk guitar;
  - new-wave edges;
  - falsetto vocals.
- **"When Doves Cry"** (≈126 BPM) famously has **no bass line**.
- **"Purple Rain"** (≈57 BPM, Bb):
  - a **gospel-rock power ballad** of sus2 and add9 shimmer;
  - a long cathartic **guitar solo**;
  - strings;
  - a crowd sing-along "ooh".
- **"Soft and Wet"** (1978): Prince's debut single. Late-70s synth-funk with falsetto; Prince played nearly every instrument *(verify)*.

**(c) Direction: two original tracks**

**1) "Bubble Royale"**, the Bubblion and Princeidon battle theme
- **Header:** `id:'starter_hydro' bpm:120 res:4 human:0.002 rev:0.12` (machine-tight).
- **Key:** **A Dorian**.

| Part | Patch | Settings |
|---|---|---|
| `kick` / `snare` / `clap` / `hat` / `tom` | `kick` tight, `snare` tight, `clap` on the snare grid, pitched `tom` | LinnDrum-style |
| `stab` | `brass` | chord, short, `voicing:{center:64,n:4}` (OB-style synth horns) |
| `gtr` | `guitar` | chord, muted 16ths |
| `bass` | `bass` | `o:{wave:'square', cut:800, env:2.5}`, B only |
| `fals` | `choir` | `vowel:'i'`, `oct:+1`, `int:[0.4,0.6]` |
| `bub` | `glock` | random high notes, the bubble pops |

| Section | Bars | Chords | Content |
|---|---|---|---|
| `A` | 8 | `Am9 \| D9 \| Am9 \| D9 \| Fmaj7#11 \| Em7 \| Dm9 \| E7#9` | **no bass**: tension, LinnDrum and stabs only |
| `B` | 8 | same chords | **bass drops in** with the falsetto choir |
| `fill` | 1 | `E7#9` | a LinnDrum tom fill |

`form: ['A','B','A','B','fill']`, `loop: 0`.

```
kick  | X.....X...X..... |
snare | ....X.......X... |
clap  | ....X.......X... |
hat   | x.xxx.xxx.xxx.xx |
stab  | ..X...X...X.X... |
tom   | ........1.2.3.4. |   (fill bar only)
```
- **Princeidon (the main evolution, a king):** `transpose:+2` plus a royal `brass` fanfare layer at `int:[0.5,0.7]`, and a crown `bell` hit on every 8th bar.

**2) "Violet Downpour"**, the Purple Rain (queen) theme, also used for its evolution scene and ultimate
- **Header:** `id:'purple_rain' bpm:60 res:6 human:0.006 rev:0.35`. At `res:6` there are 24 steps per bar of sixteenth-triplets, giving a 12/8 lilt.
- **Key:** **Eb major**. The voicings are deliberately different from the reference (no Bbsus2–Gm–F–Eb).

| Section | Bars | Chords | Content |
|---|---|---|---|
| `intro` | 4 | `Ebmaj9 \| Cm11 \| Abmaj7#11 \| Bbsus4 Bb` | clean guitar arpeggios (`pluck`) and an organ pad (`pad` square, `chorus:0.9`) |
| `verse` | 8 | intro chords × 2 | strings and choir 'o' gospel swells |
| `climax` | 8 | `Ab \| Eb/G \| Fm7 \| Bbsus4 \| Ab \| Eb/G \| Cm7 \| Bbsus4 Bb` | **the cathartic guitar solo** (`lead`, `amp:{drive:4}`, `vib:20`); crowd "ooh" swells (§B4) |
| `out` | 4 | `Ebmaj9 \| Ebmaj9 \| Abmaj7#11 \| Ebmaj9` | |

```
kick  | X...........X........... |
snare | ......X...........X..... |
hat   | x.x.x.x.x.x.x.x.x.x.x.x. |
```
- **Rain:** soft `shaker` 16th-triplets, randomly thinned, as rain.
- **Bubblion send-out sting:** two LinnDrum claps, a falsetto "ooh", and a glock bubble pop **on the downbeat**.

**(d) Do / Don't**
- Do: synth horn stabs; dry drum-machine punch; falsetto; the no-bass-then-bass trick; a gospel power ballad with a big solo.
- Don't: the "Purple Rain" chord loop in Bb; the "When Doves Cry" drum and guitar intro; any Prince melody.

#### B3.3 Beatles psychedelic pastoral (Strawberry Fields / Penny Lane / Ram) → Strawbaa / Ramberry / Pennyewe (Bio, Bio/Geo)

**(a) References**
- [S] Wikipedia, Strawberry Fields Forever: https://en.wikipedia.org/wiki/Strawberry_Fields_Forever
- [S] Wikipedia, Penny Lane: https://en.wikipedia.org/wiki/Penny_Lane
- [K] https://en.wikipedia.org/wiki/Mellotron
- [K] https://en.wikipedia.org/wiki/Swarmandal
- [K] https://en.wikipedia.org/wiki/Ram_(album)

**(b) Study notes [K]**
- **"Strawberry Fields Forever"** (≈90–95 BPM *(verify)*):
  - the **Mellotron flute** intro;
  - swarmandal glissandi;
  - cellos and trumpets;
  - **reversed cymbals**;
  - a **varispeed splice of two takes in different keys** (the final song drifts between keys);
  - a **fake ending followed by a fade back in**;
  - dreamy, heavy, slow drums.
- **"Penny Lane"** (≈113 BPM, B major):
  - bright **staccato piano**;
  - a **piccolo trumpet** solo;
  - a **fireman's bell**;
  - suburban storytelling.
- ***Ram***: homespun pastoral rock, ukulele, sudden heavy rock passages.

**(c) Direction: the original track "Strawberry Meadow"**
- **Header:** `id:'starter_bio' bpm:90 res:4 human:0.008 rev:0.3`.
- **Key:** **F major** with **bVII (Eb)** and **minor iv (Bbm)**. The `A2` section is a semitone up (Gb), our own take on the varispeed-splice *method*.

| Part | Patch | Settings |
|---|---|---|
| `mello` | `flute` | `o:{breath:0.25}`, `chorus:0.5` |
| `melloLo` | `pad` | triangle, one octave below |
| `cello` | `pizz` | |
| `strings` | `strings` | `A2` only |
| `swarm` | `koto` | fast up-glissando arpeggios at section starts |
| `bass` | `bass` | triangle (Höfner-ish) |
| `kick` / `snare` / `tamb` | kick soft, `snare` 'lofi' (heavy, slow, damped) | |
| `rev` | `fxRiser` | a 1-bar reversed swell before every section |

| Section | Bars | Chords |
|---|---|---|
| `intro` | 2 | `F \| Eb` (Mellotron flute alone) |
| `A` | 6 | `F \| Am7 \| Bb \| Bbm6 \| F/C \| Eb` |
| `B` | 6 | `Dm \| Dm/C \| Bb \| F/A \| Gm7 \| C7sus4` |
| `A2` | 6 | `Gb \| Bbm7 \| B \| Bm6 \| Gb/Db \| E` (**a semitone up**, strings join) |
| `fake` | 2 | `E \| F` (bar 1 is silent except reverb tails; bar 2 is a soft `?` flute pickup back into A) |

- `form: ['intro','A','B','A2','fake']`, `loop: 1`.
- **Phrasing:** six-bar phrases make the dreamy asymmetry, while the 4/4 grid stays stable.

```
kick  | X......xX....... |
snare | ....X.......X... |
tamb  | ....x...x...x..x |
```
- **Ramberry variant (the main evolution, Bio/Geo, a giant ram):**
  - the same harmony at **half-time**;
  - `kick` rock;
  - a fuzz `bass` (`saw`, `drive:3`);
  - **big tom rolls into each section** (Geo weight).
- **Pennyewe variant "Poppy Round" (the alternate, a nurse ewe):**
  - **90 BPM, straight and bright**, in **E major**;
  - chords `E | Emaj7 | E6 | B7sus4 | A | Am6 | E/G# | F#7 B7`;
  - staccato piano (`epiano`);
  - a **piccolo-trumpet-like lead** (`lead` square plus triangle, `oct:+1`);
  - a **fire-bell** `bell` 'tubular' ding at the end of each 8-bar phrase.
- **Heal-cast SFX:** a Mellotron-flute grace-note flourish quantised to the next 8th.

**(d) Do / Don't**
- Do: Mellotron-flute colour; reversed swells; a key drift between sections; fake endings; piccolo-trumpet brightness.
- Don't: the SFF flute intro's notes; Penny Lane's piccolo solo shape; a fire bell on the same beat placement as the record.

#### B3.4 Rolling Stones blues-rock → Rollingstone / Fivestones / Fiftystone (Geo)

**(a) References**
- [K] https://en.wikipedia.org/wiki/Keith_Richards
- [K] https://en.wikipedia.org/wiki/Open_tuning
- [K] https://en.wikipedia.org/wiki/Charlie_Watts
- [K] https://en.wikipedia.org/wiki/Brown_Sugar_(song)
- [K] https://en.wikipedia.org/wiki/Start_Me_Up

**(b) Study notes [K]**
- **Keith Richards' riffing:**
  - **five-string open-G tuning** (G D G B D);
  - riffs made by **rocking between the I chord and a IV-over-I or sus4 shape** on the top strings, with syncopated pushes;
  - Telecaster grit;
  - two guitars **weaving** ("the ancient art of weaving").
- **Charlie Watts:**
  - jazz-schooled and laid back;
  - famously **lifts off the hi-hat on the backbeat** (no hat on 2 and 4 when the snare hits);
  - often slightly behind the beat.
- **Tempos:** ≈115–136 (Honky Tonk Women ≈115, Start Me Up ≈122, Brown Sugar ≈128, Satisfaction ≈136).
- **Extras:** cowbell, maracas, honky-tonk piano, gang "woo"s, fuzz on early singles.

**(c) Direction: the original track "Boulder Boogie"**
- **Header:** `id:'rollingstone' bpm:120 res:4 swing8:0.12 human:0.007 rev:0.12`.
- **Key:** **G**, with an open-G riff *method* (the I ↔ IV/I rocking).

| Part | Patch | Settings |
|---|---|---|
| `riff` | `guitar` | chord, `voicing:{type:'root', base:43}`, `amp:{drive:3}`, pan −0.6 |
| `weave` | `guitar` | abs, single notes, `o:{single:true}`, pan +0.6, `nudge` 9 ms |
| `piano` | `epiano` + `pluck` | honky |
| `bass` | `bass` | rock patch |
| `kick` / `snare` / `hat` | | |
| `shaker` | `shaker` | |
| `bell` | `ka` | cowbell stand-in, intro only |
| `woo` | `choir` | `o:{vowel:'u'}`, short |

| Section | Bars | Chords |
|---|---|---|
| `intro` | 2 | `G \| G` (cowbell and riff alone) |
| `A` | 8 | `G:6 C/G:2 G:4 C/G:4 \| G \| F:8 C/G:8 \| G` ×2 (F is the **bVII**) |
| `B` | 8 | `C \| G \| C \| D7 \| C \| G \| Am7 D7 \| G` |

`form: ['intro','A','B','A']`, `loop: 1`.

```
kick   | X.......X.x..... |
snare  | ....X.......X... |
hat    | x.x.....x.x..... |   Charlie lift: no hat on 2 and 4
shaker | xxxxxxxxxxxxxxxx |
bell   | x...x...x...x... |   (intro only)
riff   | X.x.X-.xX.x.X-.x |
```
- **Fivestones:** the same track with **tom accents on every "and" of 4** (stone armour clacks) and `woo` silenced.
- **Fiftystone (the 50-stone golem):** the A material at **half-time feel** (kick on 1, snare on beat 3), down-tuned (`transpose:-5`), and a `stomp` layer on every beat. Each footstep lands on the beat.
- **Gradbear (the alternate):** see B3.6.

**(d) Do / Don't**
- Do: open-G rocking riffs; behind-the-beat swing; the hat lift on backbeats; cowbell and maracas.
- Don't: the Satisfaction, Start Me Up or Brown Sugar riff shapes or rhythms; a sampled "woo" from records.

#### B3.5 Nirvana grunge (loud-quiet-loud) → Heartbox → Inbloom (Ecto)

**(a) References**
- [S] Radio X, making of Heart-Shaped Box: https://radiox.co.uk/artists/nirvana/heart-shaped-box-video-making-meaning
- [K] https://en.wikipedia.org/wiki/Smells_Like_Teen_Spirit
- [K] https://en.wikipedia.org/wiki/Heart-Shaped_Box
- [K] https://en.wikipedia.org/wiki/In_Bloom
- [K] https://en.wikipedia.org/wiki/Butch_Vig
- [K] https://en.wikipedia.org/wiki/Steve_Albini

**(b) Study notes [K]**
- **Loud-quiet-loud** (a Pixies-inherited dynamic):
  - **quiet verses** are a clean or chorus-effected guitar figure over bass and restrained drums;
  - **loud choruses** are distorted power chords, crash-ride wash, double-tracked guitars and heavy hitting.
- **Tempos:** ≈100–120 (Heart-Shaped Box ≈101, Smells Like Teen Spirit ≈117 in F minor, Come As You Are ≈120 with a chorused riff).
- **Harmony:** chromatic **power-chord** moves; Phrygian and Aeolian colour.
- **Production:**
  - **Butch Vig** (*Nevermind*): polished, double-tracked.
  - **Steve Albini** (*In Utero*): raw room-mic drums, abrasive.
- **Drums (Dave Grohl):** big crash-heavy choruses; **16th-note snare pickups** into choruses.

**(c) Direction: the original track "Box & Bloom"**
- **Header:** `id:'heartbox' bpm:120 res:4 human:0.005 rev:0.15`.
- **Key:** **E minor** with chromatic power-chord slides.
- **Story tie (bible §3, §5):** Heartbox is slow and does almost no damage until bonding plus kills break the box and reveal Inbloom. The music follows that: a **lullaby (quiet)** for Heartbox, then a **loud** explosion for Inbloom.

| Part | Patch | Settings |
|---|---|---|
| `mbox` | `glock` | the music-box arpeggio of the verse chords (Heartbox) |
| `clean` | `guitar` | chord, amp drive 1, `chorus:0.6` |
| `gtrL` / `gtrR` | `guitar` | `amp:{drive:6, scoop:-5}`, `pan` ±0.75, `nudge` 7 ms |
| `bass` | `bass` | saw, `drive:2` |
| `kick` / `snare` / `crash` | kick rock, snare rock (rim tone in quiet sections) | |
| `bloom` | `choir` | `vowel:'o'`, loud sections, `int:[0.5,0.7]` |

| Section | Bars | Chords | Content |
|---|---|---|---|
| `box` | 8 | `Emadd9 \| Cmaj7 \| Emadd9 \| F#5 F5` | **Heartbox:** music box, rim clicks, sub-bass heartbeat on beats 1 and 3 |
| `quiet` | 8 | `Emadd9 \| Cmaj7 \| Emadd9 \| F#5 F5` | **Inbloom verse:** clean chorused guitar, bass, rim. Last bar = snare pickup |
| `loud` | 8 | `E5 \| G5 A5 \| C5 \| B5 Bb5` | **Inbloom chorus:** distortion, crash 8ths, choir bloom |

- `forms`: Heartbox phase `['box']`, looping. Inbloom phase `['quiet','loud']`, looping.
- **The break moment:** the box-break VFX lands on **the downbeat of `loud`**, with `fxBoom`, a crash and the B/W-to-tint wipe (A23).

```
-- quiet
kick  | X.......X....... |
snare | ....x.......x... |   (tone: rim)
snare | ............XXXX |   (pickup bar only, tone: rock)
-- loud
kick  | X.x...x.X.x...x. |
snare | ....X.......X... |
crash | x.x.x.x.x.x.x.x. |
```

**(d) Do / Don't**
- Do: extreme dynamic contrast; chorused clean verses; chromatic power-chord slides; 16th snare pickups.
- Don't: the F5–Bb5–Ab5–Db5 loop in the "Teen Spirit" rhythm; the "Come As You Are" riff; the Heart-Shaped Box verse figure.

#### B3.6 Kanye West *Graduation* stadium synths → Gradbear (Geo)

**(a) References**
- [S] Wikipedia, Graduation (album): https://en.wikipedia.org/wiki/Graduation_(album)
- [K] https://en.wikipedia.org/wiki/Stronger_(Kanye_West_song)
- [K] https://en.wikipedia.org/wiki/Flashing_Lights

**(b) Study notes [K]**
- **Intent:** *Graduation* consciously aimed for **stadium-size anthems**, made after touring arenas with U2. It moved from chopped soul samples towards **big synthesiser
  chords**, electronic and house influences (the "Stronger" Daft Punk sample), and vocoder textures.
- **Tempos:** ≈85–104 (Good Life ≈85, Flashing Lights ≈90, Stronger ≈104).
- **Drums:** 808 and 909 hybrid kicks, claps layered on snares, hat rolls.
- **Arrangement:** sing-along crowd hooks; **filtered intro → full-band drop** dynamics.

**(c) Direction: the original track "Launch Day"**
- **Header:** `id:'gradbear' bpm:90 res:4 human:0.003 rev:0.2`.
- **Key:** **F minor / Ab major**.

| Part | Patch | Settings |
|---|---|---|
| `kick` | `kick` | `o:{tone:'808'}` |
| `snare` + `clap` | `snare` tight, `clap` | layered |
| `hat` | `hat` | |
| `saw` | `pad` | `o:{wave:'sawtooth', detune:14}`, `chorus:0.8`, `voicing:{center:62,n:4}` |
| `stab` | `brass` | chord, short |
| `chop` | `choir` | `vowel:'a'`, short stabs (soul-chop feel) |
| `keys` | `epiano` | |
| `sub` | `sub` | |
| `gang` | `gang` | |

| Section | Bars | Chords | Content |
|---|---|---|---|
| `intro` | 4 | `Fm9 \| Dbmaj9 \| Abadd9 \| Eb/G` | filtered `saw` chords plus crowd bed |
| `A` | 8 | same, ×2 | drums in, `keys` chops |
| `B` | 8 | same, ×2 | **stadium drop:** supersaw, `chop`, `gang` "HEY" on bars 4 and 8 |
| `launch` | 2 | `Eb/G \| Eb/G` | `fxRiser` plus a snare roll. **Gradbear's launch ultimate** fires here and lands on `B` bar 1 |

`form: ['intro','A','B','A','B','launch']`, `loop: 1` (the launch goes back to A; after an ultimate, jump to `B`).

```
kick  | X..X......X..X.. |
snare | ....X.......X... |
clap  | ....X.......X... |
hat   | x.x.x.x.x.x.xxxx |
stab  | X..X..X...X.X... |
```

**(d) Do / Don't**
- Do: filtered-to-full drops; detuned saw stacks; clap-snare layers; crowd hooks.
- Don't: any Daft Punk or *Graduation* sample, hook or synth riff; vocoder phrases that imply words.

#### B3.7 Metallica thrash (+ Black Sabbath doom) → Team Metallica and metal bullies

**(a) References**
- [K] https://en.wikipedia.org/wiki/Thrash_metal
- [K] https://en.wikipedia.org/wiki/Master_of_Puppets_(song)
- [K] https://en.wikipedia.org/wiki/Enter_Sandman
- [K] https://en.wikipedia.org/wiki/Iron_Man_(song)
- [K] https://en.wikipedia.org/wiki/Blast_beat
- [K] https://en.wikipedia.org/wiki/Nu_metal
- In-repo: `TRACKS.battle_punk` in `src/audio/music.js` (E, 184 BPM)

**(b) Study notes [K]**
- **Thrash** (Master of Puppets ≈212, Battery ≈190, Seek & Destroy ≈140, Enter Sandman ≈123):
  - **all-downpicked gallops** (an 8th plus two 16ths);
  - **palm mutes** on an **E pedal tone**;
  - **Phrygian b2 (F)** and **tritone (Bb)** stabs;
  - **chromatic descents**;
  - **harmonised twin leads in 3rds**;
  - **clean or acoustic intros** before the onslaught;
  - tempo and meter shifts mid-song;
  - double-bass kick runs;
  - china cymbals;
  - gang shouts.
- **"Enter Sandman":** a **lullaby-versus-nightmare** contrast at mid-tempo.
- **Black Sabbath "Iron Man"** (≈76): **slow, plodding unison doom**, a ring-modulated "robot" voice intro, tritone heaviness.
- **Bully sub-genres** (bible §4):
  - **black metal:** blast beats, tremolo picking, cold minor drones;
  - **glam:** shuffle, gang vocals, cowbell;
  - **nu-metal:** down-tuned syncopated chugs, turntable scratches.

**(c) Direction**

- **Team Metallica main battle:** keep the existing `battle_punk` arrangement, with two *(proposal)* changes:
  - **retempo it to 180** (frame-locked, §0.4);
  - **rename** its display name from "Master of Muppets", because "Muppets" is a Disney trademark. For example "Mosh Pit Monarchs".
- **Its harmony:** E pedal gallops answered by **F** and **Bb** hits, a chromatic run-down every 8th bar, and twin leads in 3rds in section B. That is already the right vocabulary.

| Cue | Header | Content |
|---|---|---|
| **Thrash (leader) "Amp Throne"** | 180, E Phrygian | a skank-beat section plus a twin-lead section; a gang "HEY!" on every 4th bar; an **8-bar clean intro** (`guitar` drive 1, `chorus:0.5`) before the first battle |
| **Riff (shredder) "Shred Alley"** | 180 | the Thrash material with a **tremolo-picked lead** (`lead` 16ths) and a **double-time** final 4 bars (kick 16ths) |
| **Moshi (the softie) "Soft Mosh"** | 90 (half of 180) | the **same gallop motif played clean and slow** in E minor with strings and a soft rain `shaker`. After befriending (bible §4), the motif returns in **E major** as his friendship theme |

Thrash skank beat (180):
```
kick  | X.x.X.x.X.x.X.x. |
snare | ..X...X...X...X. |
ride  | x...x...x...x... |
```

**Bully sub-genre loops** (8 bars each, for the "lots of other bullies with metallic styles", bible §4):

| Style | BPM | Grid / instruments |
|---|---|---|
| Black metal (corpse paint) | 180 | blast: `kick \| X.X.X.X.X.X.X.X. \|`, `snare \| .x.x.x.x.x.x.x.x \|`; tremolo `guitar` 16ths on minor triads; cold `choir` 'o' drone |
| Glam | 120, `swing:0.18` | big snare `\| ....X.......X... \|`, cowbell (`ka`) `\| x.x.x.x.x.x.x.x. \|`, gang shouts, a bright major `I–bVII–IV` |
| Nu-metal | 90 | down-tuned (`transpose:-7`) syncopated chugs `\| X..X..X...X..X.. \|` on kick and guitar together; `lead` square fast glides as scratches |
| Thrash / studded denim | 180 | as above |

**Metal Tokonmon stings** (2 bars, at the battle's tempo):

| Tokonmon | Original sting |
|---|---|
| **Studrat** (Ferro) | palm-muted 16th chugs plus a `snare` metal flam, ending on a pinch-harmonic-like `lead` squeal |
| **Moshbull** (Geo) | two `stomp`s plus a china crash, a half-time chug and a gang "HUH" |
| **Thrashark** (Hydro) | a chromatic gallop rising like a fin, with a `glock` water-drop on the downbeat |
| **Marionoir** (Ecto, "Master of Puppets") | a **music-box `pizz` chromatic figure** (a puppet box), then a crash into a gallop; strings tremolo |
| **Sandmare** (Ecto/Geo, "Enter Sandman") | a 1-bar `glock` **lullaby** at soft velocity, then a 1-bar **gallop slam** (lullaby to nightmare) |
| **Ironmaw** (Ferro, "Iron Man") | **doom at 60-feel** (one third of 180): a unison slow `guitar` and `bass` riff on E–G–A–Bb (our own), a `kick` deep on every beat, and a **ring-mod "robot" roar** (`choir` 'o' + `lead` square at low `cut`) |

**(d) Do / Don't**
- Do: downpicked gallops; palm mutes; Phrygian and tritone colour; clean-to-heavy intros; twin leads.
- Don't:
  - the Master of Puppets chromatic riff;
  - the Enter Sandman riff and its E–Bb tritone shape;
  - the Iron Man riff contour;
  - Metallica or Sabbath lyrics;
  - trademarked names in track titles.

#### B3.8 Song-Tokonmon cue table (send-out stings and encounter loops)

| Tokonmon (bible §3) | Style source (feel only) | Original cue spec |
|---|---|---|
| **Yellowsub** (Hydro/Ferro) | nautical brass-band singalong | 120 march, a `brass` oompah, a **sonar ping** (`bell` 'vibes', with `dly`), bubble `glock`, a gang "HEY" on bar 2 |
| **Blackbyrd** (Aero) | solo acoustic fingerpicking | 90, `acoustic` picked 8ths in parallel 10ths, **bird trills** (`flute` high grace notes). Avoid the metronome-tap texture |
| **Lucydiamond** (Astro/Cryo) | late-60s psychedelic waltz | 90, verses phrased in **3s over the 4/4 grid** (groupings of 6 eighths), `glock` celesta arpeggio, a `pad` square "organ", `drone` tanpura, `fxShimmer` diamonds |
| **Thrillghoul** (Ecto) | early-80s horror-funk | 120, a minor synth-bass ostinato (`bass` square), a **door creak plus a howl** sound effect on the downbeat, `clap` on 2 and 4, ghost-minion "ooh" (`choir` 'u') |
| **Ziggystar** (Astro/Volto) | early-70s glam rock | 120, `acoustic` strum plus a saturated `lead` (glam), strings, chromatic chord slides (I–bIII–IV), `fxShimmer` stardust |
| **Lemmo / Alpha Lemmo** (Volto) | late-2010s J-pop grief ballad | 90, a bittersweet `epiano` and `strings` motif in **Ab major with minor iv**, a **"zest squeeze" `snap`** accent, and a Volto `lead` square zap. No vocal samples |
| **Kagarou** (Pyro, the fire wolf) | (no artist source) | reuse the `boss` vocabulary: `taiko` plus a `flute` shakuhachi howl |
| **God "Dark Side of the Moon"** (lore) | early-70s prog atmospherics | 60, a **sub heartbeat** (`kick` soft, two beats then a rest), a 12-note `bell` spectrum arpeggio (one note per element, rising), `drone` |
| **God "Back in Black"** (lore) | stark hard-rock mourning | 60, **four temple-bell tolls** (`bell` 'tubular' plus `sub`), 2 bars apart, then silence |
| **Osaka 2050 city cues** | city pop | already covered by `title` (100) and `dotonbori` (128). Phone-travel sting per A40 |

---------------------------------------------------------------------------------------------------

### B4. Stadium audio: crowds, chants, air horns, press cameras, announcer stingers, halftime show

**(a) References**
- [S] Wikipedia, Queen's performance at Live Aid (the stadium-crowd archetype): https://en.wikipedia.org/wiki/Queen%27s_performance_at_Live_Aid
- [K] https://en.wikipedia.org/wiki/%C5%8Cendan (Japanese cheer squads)
- [K] https://en.wikipedia.org/wiki/Hanshin_Tigers (Osaka-region baseball fan culture)
- [K] https://en.wikipedia.org/wiki/Koshien_Stadium
- [K] https://en.wikipedia.org/wiki/Camera_phone (Japan's camera shutter-sound custom)
- [K] https://en.wikipedia.org/wiki/Air_horn
- [K] https://en.wikipedia.org/wiki/Goal_horn
- In-repo: `src/audio/audio.js`. It has `crowd_cheer`, `crowd_gasp`, the `stadium` ambience (`roar` and `murmur` beds; `cheer`, `whistle` and `applause` events), the city `horn`, and the `DUCK` table.

**(b) Study notes [K]**
- **Japanese pro baseball (NPB):**
  - organised **ōendan** in the outfield lead the crowd with **trumpets, taiko and flags**;
  - **every batter has his own cheer song**, a short trumpet tune with a chanted name;
  - fans clap **plastic mini-bats or megaphones** in rhythm;
  - it is all synchronised call-and-response;
  - at the **"lucky seventh"**, fans release long **jet balloons** that shriek as they fly up.
- **Osaka's own fans:** **Hanshin Tigers** fans at Kōshien (in the Osaka region) are the archetype. Their fight song is "Rokkō Oroshi". Do **not** use its melody.
- **J.League:** supporters drum and chant non-stop for 90 minutes, with flags and clap patterns.
- **Western arenas:**
  - **stomp-clap** grooves;
  - organ cues;
  - DJ drops;
  - air horns and **goal horns**;
  - a hype PA announcer;
  - the **wave**.
- **Press pit:**
  - pro DSLRs shoot **bursts of about 10–14 frames per second** (mechanical shutter clatter);
  - mirrorless electronic shutters are silent;
  - older flashes **whine while recharging**;
  - **phones sold in Japan play a shutter sound by industry custom**, so a Japanese crowd "clicks" on every big moment.
- **TV broadcast:** graphic "whoosh" stingers, scoreboard buzzers, and a PA **chime** before announcements (common in Japanese venues and stations).

**(c) Direction: original stadium audio set** (procedural, scheduled on the music clock, §B5)

**1. Crowd beds**

| Layer | Recipe | Driven by |
|---|---|---|
| Murmur | pink noise, band-pass 300–1200 Hz, slow random gain LFO (0.1–0.3 Hz) | always on (the existing `murmur`) |
| Roar | pink noise, band-pass 500–2500 Hz plus 2.6 kHz "voices" | battle intensity, smoothed over 1.5 s (the existing `roar`) |
| Swell | a 1.5–2.5 s crescendo **timed so its peak lands on a downbeat** (start = downbeat − length) | KOs, ultimates, evolutions, phase changes |
| Gasp | the existing `crowd_gasp` | crits against the home side, near-KO |
| "Ooh" | a `choir` 'u' cluster around 200–400 Hz gliding down a minor 3rd over 0.8 s | near misses, dodges |
| Applause | the existing `applause` | between rounds |

**2. Chants** (always on bar lines of the current battle track, at its BPM)
- **Tokon double-clap** (original stadium signature): two claps on beat 4 and 4-and of bar 2 of a 2-bar cycle, then a gang **"HO!"** on the next downbeat.
  ```
  clap | ................ ............X.X. |
  gang | X............... ................ |   (the "HO!" lands on the next cycle's bar 1)
  ```
- **Royal Stomp** (B2): the Champions match only.
- **Rhythm chant** (any match): a gang shout on beats 1, 2 and 3, then claps answer.
  ```
  gang | X...X...X....... |
  clap | ............X.X. |
  ```
- **Ōendan cheer-song per Tokonmon *(proposal)*:**
  - when a home Tokonmon enters, lands a crit or bonds, the home stand's trumpets play a **2-bar original fanfare derived from that Tokonmon's leitmotif** (B2 / B3 tables);
  - instruments: `lead` square plus triangle, `brass`, `taiko`, and mini-bat clacks as `ka` in 8ths;
  - the rival stand answers with the opponent's fanfare;
  - this is the "Hanshin" flavour of Osaka.
- **The wave:** a 4-bar left-to-right crowd-sprite wave; the cheer bed pans from −1 to +1 over the same 4 bars.

**3. Air horns**
- A **three-voice chord** (about Bb3–D4–F4, 233/294/349 Hz): detuned square plus saw, low-pass at 1.6 kHz, 0.6–1.0 s, with a −30-cent pitch sag at the tail.
- Plays on KOs, phase changes and wins, **on the downbeat**.
- It is a lower, chordal stadium variant of the existing city `horn` (350/440 Hz).

**4. Press and reporter cameras** (bible §4 reporters plus camera crew; §6 "reporters")

| Sound | Recipe |
|---|---|
| Mechanical shutter | a 3 ms noise click (high-pass 3 kHz), plus a 15 ms band-pass 1.2 kHz "curtain", plus a 10 ms band-pass 900 Hz "mirror return" 35 ms later |
| Burst | repeat every **80–100 ms** (10–12 fps) for 0.5–1.5 s, ±5 ms jitter. Pan each camera crew member separately |
| Flash | a 5 ms high-pass 6 kHz pop, plus a 1-frame white flash on the reporter sprite and a 1-pose light pop on nearby crowd sprites |
| Flash recharge whine | a sine sweeping 2→7 kHz exponentially over 1.2 s, very quiet |
| Crowd phone shutters | scattered two-part synthetic "ka-sha" clicks, randomly panned. **Density follows the hype of the moment** (KO > evolution > ultimate > crit) |

- **Sync:** the reporters' bursts **start on the ultimate's impact downbeat**. Flash pops in the crowd fall on random 16ths for 1 bar.

**5. Announcer stingers** (original, at the current track's BPM; no TTS voice, since announcements appear as jumbotron text and speech bubbles)

| Event | Stinger |
|---|---|
| Before any announcement | a 2-note PA **chime** (a major 6th up, then a 4th down), `bell` 'vibes' |
| Match start | 2 bars: `brass` fanfare rising a 4th, snare roll, crash plus air horn on the downbeat |
| Switch out / in | 1 beat: a noise-sweep whoosh plus a 2-note `pluck` blip (5th down for out, 5th up for in) |
| Critical hit | an orchestra hit (`brass` chord plus `fxBoom`) **on the next 8th** |
| KO | the air-horn chord plus the crowd swell peak **on the downbeat** |
| Halftime | the band break, then the halftime show (6.) |
| Win | the existing `victory` stinger with the crowd roar peak aligned to its first downbeat |

**6. Halftime show** (bible §6: the arena changes, choose again; the idol Lumi★ from §4 is the natural performer *(proposal)*)
- **The track "Halftime Sparkle":** `bpm:144` (frame-locked), **D major** idol pop.
  - four-on-the-floor `kick`;
  - off-beat open hats;
  - synth `brass`;
  - `glock` sparkle;
  - `choir` 'a' backing;
  - crowd **"Oi! Oi!"** gang calls on the off-beats of the chorus (idol-fan call culture).

| Section | Bars | Notes |
|---|---|---|
| `intro` | 4 | jumbotron logo |
| `verse` | 8 | |
| `chorus` | 8 | crowd claps on 2 and 4, "Oi!" calls |
| `choice` | 4 | the **arena-choice countdown**: three hits on beats 1, 2 and 3 of bar 4, then the drop |

- **Arena stingers** (1 bar each, on the downbeat after the choice):
  - **rocky:** `taiko`, `stomp`, low `brass`;
  - **grassy:** a `flute` trill, `shaker`, a `koto` glissando;
  - **water:** `glock` droplets plus a filtered `pad` sweep.

**7. Mix and ducking**
- Crowd beds duck −6 dB under ultimates (extend the existing `DUCK` entries).
- Music ducks −4 dB under the PA chime.
- **Every event SFX is scheduled at its quantised audio time** (§B5), never at the moment of the frame.

**(d) Do / Don't**
- Do: crowd energy that follows the music clock; Osaka baseball-cheer flavour; per-Tokonmon cheer fanfares; dense shutter clicks on big moments.
- Don't: "Rokkō Oroshi" or any real team or player cheer melody; real announcer catchphrases; the WWRY tempo and a-cappella stomp; sampled crowd recordings (keep it procedural).

### B5. Beat-synced gameplay: how rhythm games do it, and what Tokonmon should do

**(a) References** (all [K], not opened in this pass)
- https://en.wikipedia.org/wiki/Hi-Fi_Rush
- https://en.wikipedia.org/wiki/Crypt_of_the_NecroDancer
- https://en.wikipedia.org/wiki/Sayonara_Wild_Hearts
- https://en.wikipedia.org/wiki/Metal:_Hellsinger
- https://en.wikipedia.org/wiki/Patapon
- Chris Wilson, "A Tale of Two Clocks" (Web Audio scheduling): https://web.dev/articles/audio-scheduling
- MDN, `AudioContext.outputLatency`: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency
- MDN, `AudioContext.getOutputTimestamp()`: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp
- GDC Vault: search for the Tango Gameworks Hi-Fi Rush rhythm-combat talk *(verify the title and year)*: https://gdcvault.com/

**(b) Study notes [K]**
- ***Hi-Fi Rush*** (Tango Gameworks, 2023):
  - **everything pulses to the beat**: props, enemies, UI and the companion cat;
  - **attacks always land on the beat.** Animations are timed so the impact hits the beat even if the press is a little early or late, while **on-beat presses score higher**. This is *forgiving quantisation*.
  - enemies telegraph on beats, which invites parries on beats;
  - QTEs and cutscenes are cut to the soundtrack;
  - an optional visual beat aid.
- ***Crypt of the NecroDancer*** (2015):
  - **every move must be on the beat**; a beat bar and heart show the pulse;
  - **off-beat input breaks the coin multiplier** ("groove chain");
  - enemies move in beat patterns, for example every other beat;
  - songs speed up per floor;
  - there are audio and video **latency calibration** options.
- ***Sayonara Wild Hearts*** (2019):
  - a "pop album video game";
  - on-rails levels **choreographed to each song**;
  - prompts and **camera cuts on beats and phrase boundaries**;
  - **the song never waits** for the player.
- ***Metal: Hellsinger*** (2022): shooting on the beat raises a multiplier ("Fury") and **unlocks more music layers, finally the vocals**. Adaptive layering is the reward.
- ***Patapon***: 4-beat drum commands execute in the next measure. It is the closest analogue to Tokonmon's **order delay** under auto-control (bible §6).
- **Shared principles:**
  1. the music is the master clock;
  2. **quantise the presentation more strictly than the input**;
  3. use forgiving input windows (roughly ±50 ms "perfect", ±100–120 ms "good" *(verify)*);
  4. adaptive music layers are a reward;
  5. schedule every VFX and camera event *ahead* on the audio clock;
  6. offer latency calibration.

**(c) Direction for Tokonmon** (bible §6 "music sync"; §10 "attacks and cutscenes sync to the music's beat")

1. **Beat clock *(proposal for programmers)*.** One `BeatClock` per playing track: `{ bpm, res, t0 }`, where `t0` is the AudioContext time of step 0 of the loop.
   - Song position: `ctx.currentTime − t0 − (ctx.outputLatency || ctx.baseLatency || 0)`. Prefer `getOutputTimestamp()` where it exists.
   - Helpers: `next(gridBeats)` for the 1/16, 1/8, 1/4, 1-bar and 4-bar grids.
   - `TrackPlayer` already has `stepDur`, `spb` and `loopAt` from `compileTrack`. Expose **section and bar markers** (`at(sectionName)`, `barOf(t)`).
   - **When the music changes** (battle → halftime → second half), start the new track on the old one's next bar line so the grid never jumps.
2. **Quantisation rules:**

   | Event | Grid | Rule | Max added wait at 120 BPM |
   |---|---|---|---|
   | Order execution under auto-control (bible §6 "little delay") | 1/8 | executes on the first 8th ≥ command time + base delay. **The bible's delay *is* the quantisation window** | +250 ms |
   | Bonded direct control ("no order delay", bible §5) | input: none; VFX: 1/16 | the action starts at once. Only the impact flash, hit-stop and camera kick snap to the nearest 16th, and only if within ±60 ms | ±60 ms (VFX only) |
   | Basic attack impact | 1/8 | stretch or squash the wind-up by up to ±20 %, **in whole poses**, so the impact pose lands on an 8th | n/a |
   | Charged attack release (Pyro "charge") | beat | the charge loop holds until the next beat after release | 500 ms |
   | Elemental reaction (water + fire = steam explosion) | beat | `fxBoom` plus crash on the next beat; screen shake for 1 beat | 500 ms |
   | **Ultimate** (bonded only; it ends bonding) | **bar** | the cut-in starts at once and lasts 1–2 bars, so the **impact hits the first downbeat at least 1 bar after activation**. Music intensity goes to 1.0; the crowd swell and press bursts peak on that downbeat | cinematic (2–4 s) |
   | Switch (7 s; 15 s cooldown) | beat (cosmetic) | **gameplay timers are unchanged.** Only the swap-in flash and entrance sting snap to the next beat | ≤ 500 ms, cosmetic |
   | Dodge and parry | input: none; VFX: 1/16 | success VFX on the next 16th. *(proposal)* a "perfect" if the input is within ±70 ms of a beat | n/a |
   | Team combo | beat | combo steps chain on consecutive beats; the finisher lands on a downbeat | n/a |
   | Emote moves (taunt, dance, shake) | beat | authored in beats (6 poses per beat at 120) | n/a |
   | Cutscene camera cuts | bar (major), beat (minor) | the cutscene director reads track bar markers | n/a |
   | Cutscene text reveal | 1/8 | | n/a |
   | Crowd reactions, jumbotron graphics | bar or 4-bar phrase | | n/a |
   | Evolution sequence | 8 bars | build for 8 bars, reveal on the downbeat of bar 9 (`evolution` stinger) | n/a |
   | Capture throw (gem keychain) | beat | the gem flash on the beat; the shake ticks on the following beats | n/a |

3. **Echo element = rhythm (bible §3) *(proposal)*.** Echo skills get a bonus when their *input* lands within **±70 ms ("perfect") or ±120 ms ("good")** of a beat.
   Feedback is a **soul-stone pulse on the bracelet**, not a UI meter (almost no UI). Other elements only sync cosmetically, so nobody is forced to play rhythmically.
4. **Animation authoring:**
   - Put impact poses on whole-pose indices that fall on 8ths: at 120 BPM, 3 poses per 8th; at 144, impacts snap to 16ths (1.25 poses) or beats (5 poses); at 180, 2 poses per 8th.
   - **Hit-stop:** 1 pose (83 ms) for light hits, 2 for heavy, and **never longer than one 16th at the current tempo**. The music never pauses.
   - **Camera shake:** only on the snare backbeats (2 and 4) at intensity ≥ 0.6, with amplitude proportional to intensity.
5. **Adaptive layers as reward** (the *Hellsinger* lesson): bonding adds the lead layer; a streak of 3 or more on-beat hits adds the harmony voices; an ultimate adds everything for 2 bars (see the B0 intensity table).
6. **Latency calibration *(proposal)*:** a phone **Settings → Rhythm calibration** tap test (tap along to 8 clicks; store the median offset). Settings already live in the phone (bible §8).
7. **Recommended tempos per track type:**

   | Track type | BPM |
   |---|---|
   | Elite Four | 120 |
   | Champions | 144 |
   | Thrash / metal bullies | 180 |
   | Funk and stadium hip-hop starter themes | 90 |
   | Power ballads and doom | 60 |
   | Generic battle | 120 or 144 (or 160 only with 24 fps VFX) |

8. **Test harness *(proposal)*:** the engine already supports `renderOffline`. Render a battle track, log the scheduled impact, cut and crowd-peak times, and assert each lands within ±1 pose of its grid line.

**(d) Do / Don't**
- Do: forgiving input with strict presentation; the music as master clock; whole-pose snapping; bar-line track switches; latency compensation.
- Don't: block input until the beat while bonded; change gameplay timers to match music; pause or stretch the music for hit-stop; schedule SFX at frame time.

---------------------------------------------------------------------------------------------------

## Part C: Cheat sheets

### C1. Track list (original tracks specified in this file)

| id (suggested) | Working title | BPM | Key / mode | Feel | Used for |
|---|---|---|---|---|---|
| `e4_john` | Echo Chamber | 120 | C Mixolydian | drone, tape-loop psychedelia | Elite Four "John" (Lenshorn) |
| `e4_paul` | Canal Bounce | 120 | Bb major | piano music-hall rock, walking bass, piccolo lead | Elite Four "Paul" (McCarapace) |
| `e4_george` | Sunrise Raga | 120 | D (Khamaj-like) | tanpura, sitar, tabla to sunrise rock, 3+3+3+3+2+2 illusion | Elite Four "George" (Harrisun), Harrisun's sunrise evolution |
| `e4_ringo` | Coral Parade | 120 (swing) | G → A | oompah sing-along, drum breaks | Elite Four "Ringo" (Starrab) |
| `e4_final` | Encore Suite | 120 | Eb → C → Bb → D → G → Eb → F | medley chain, drum solo, lead trade | Elite Four final |
| `champions` | Crowned Kansai | 144 | Eb / Cm / Ab | Royal Stomp, guitar orchestra, opera antiphony, ballad break, anthem | Champions (Queen) |
| `crown` (stinger) | – | 144 | Eb69 | choir, orchestra, gong | Champion KO |
| `starter_pyro` | Hot Pepper Strut | 90 | E Dorian | slap funk-rock | Chilichick, Riffrooster, Funkadoodle |
| `starter_hydro` | Bubble Royale | 120 | A Dorian | Minneapolis LinnDrum funk, no bass then bass | Bubblion, Princeidon |
| `purple_rain` | Violet Downpour | 60 (res 6) | Eb major | gospel power ballad, guitar solo | Purple Rain (queen form) |
| `starter_bio` | Strawberry Meadow | 90 | F → Gb | psychedelic pastoral, Mellotron flute, fake ending | Strawbaa, Ramberry (half-time variant), Pennyewe ("Poppy Round", E major) |
| `rollingstone` | Boulder Boogie | 120 (swing8) | G (open-G method) | blues-rock weave, Charlie lift | Rollingstone, Fivestones, Fiftystone |
| `heartbox` | Box & Bloom | 120 | E minor | music box, then loud-quiet-loud | Heartbox → Inbloom |
| `gradbear` | Launch Day | 90 | F minor / Ab | stadium supersaw hip-hop | Gradbear |
| `battle_punk` (existing) | → 180, rename | 180 | E Phrygian | thrash | Team Metallica |
| `thrash_amp` / `riff_shred` / `moshi_soft` | Amp Throne / Shred Alley / Soft Mosh | 180 / 180 / 90 | E Phrygian / E minor → E major | thrash, shred, clean ballad | Thrash, Riff, Moshi (befriend theme) |
| `halftime` | Halftime Sparkle | 144 | D major | idol pop, "Oi!" calls | halftime show and arena choice |

### C2. Asset matrix (reference → where it's used)

| Reference | Tokonmon / character | World, VFX, audio |
|---|---|---|
| Abbey Road | Beatlet family walk cycle; McCarapace's barefoot gag | Elite Four poster (scramble crossing); tiled street plates |
| Sgt. Pepper | Elite Four uniforms (lime / sky / vermilion / rose-quartz plus element trims) | Elite Four hall cut-out collage of the Tokonmon cast; fairground drum; evolution frame |
| Yellow Submarine | Yellowsub | Edelmann-style jumbotron stings; colour-return VFX |
| Revolver | Lenshorn cut-in | ink-halftone phone lore filter |
| Rubber Soul | – | looking-down defeat shot; stretch VFX; "Sap" pixel font |
| White Album | – | embossed Elite Four pass with save serial; white-silence bar |
| Let It Be | – | 2×2 Elite Four progress board; contact cards |
| SFF / Penny Lane | Strawbaa, Pennyewe | red iron gate; piano-and-dead-tree safari prop; suburban props |
| Ram | Ramberry | marker-border dex card; horn-grip bond pose; farm flashback frames |
| Queen crest / ANATO | Champions crest (Killerqueen, Bohemoth, Radiogaga, Dontstopmeow, Bitesdust) | banners, floor graphic, license crown stamp |
| News of the World | Radiogaga | roof-reach ultimate camera; pulp posters |
| The Game | Dontstopmeow | Champions second-phase outfits; silver-foil title cards |
| Innuendo | Bohemoth | engraving style for Dr. Hoshino's lore pages |
| Queen II / Bohemian Rhapsody video | Bohemoth echo clones | top-lit diamond intro; white/black stage lighting by half |
| Live Aid / Wembley '86 | Champion trainer "crowd call" emote; final costume | crowd double-clap loop; inflatables at halftime; golden-hour lighting |
| Purple Rain | Purple Rain, Princeidon, Bubblion | purple alley; smoke entrance; floral frame |
| RHCP logo / By the Way / Californication / Stadium Arcadium | Chilichick line flame-spark crest | painterly bond portraits; inverted-reflection water arena; ringed-planet stadium identity |
| In Utero | Inbloom | glass-skin and floral interior; cream reveal frame; cracks showing flowers |
| Nevermind | Bubblion; Hydro dex photos | caustic shader; takoyaki-on-a-hook mural |
| Heart-Shaped Box video | Heartbox | hand-tinted palette; crow puppets; B/W-to-tint transformation wipe |
| Graduation | Gradbear | Superflat academy billboards; tokon-flower mascot |
| Stones tongue / Sticky Fingers | Rollingstone line (moss tongue) | rock-bar sign; denim and zipper hardware; zipper phone case |
| Soft & Wet | Bubblion line | bubbles carrying stolen items; star pops; palette-inversion flash |
| Dark Side of the Moon | lore god (prism dragon) | 12-element spectrum murals; heartbeat line |
| Back in Black | lore god (dark dragon) | black-on-black raking-light murals; 4 bell tolls |
| Master of Puppets / Ride the Lightning / Kill 'Em All / Black Album | Marionoir, Sandmare; Team Metallica | amp-stack mural; amp throne; ice-cream hammer sticker; Volto void backgrounds |
| Paranoid / Iron Man | Ironmaw | ghost-trail charge VFX; doom sting |
| Thriller | Thrillghoul | dance-minion emote; fog and howl entrance |
| Ziggy Stardust / Aladdin Sane | Ziggystar | rainy Shinsekai alley under one warm sign; zig-zag marking |
| Lemon | Lemmo, Alpha Lemmo | lemon-battery gag; bittersweet cue |
| Plastic Love / Ride on Time (city pop) | Lumi★ posters | Osaka dusk palette; billboards; data-cassette ads; travel sting |

### C3. Never-do list (all disciplines)

1. **Trademarks.** No real logos, crests or wordmarks:
   - RHCP asterisk;
   - Stones tongue;
   - Queen crest;
   - AC/DC and Metallica logos;
   - Nirvana wordmark and smiley;
   - Prince's Love Symbol;
   - Murakami's flower;
   - Dropout Bear;
   - Marvel's Iron Man look;
   - the "Muppets" name.
2. **Words.** No lyrics, no real track or album titles beyond the Tokonmon names already in the bible, and no song quotes on signs.
3. **Music copying.** No melodies, riffs, bass lines, recognisable drum intros or samples. Apply the rule of 3 (§0.2) to every cue.
4. **People.** No likeness portraits of real musicians. At most two real costume cues per tribute character.
5. **Sensitive imagery.** No fetuses, organs, crucifixes, hooded robes, hanging figures, graves, execution devices, blood, nudity, or the Red Cross emblem.
6. **Layouts.** No one-to-one cover layouts. Apply the rule of 3 (§0.2) to every visual homage.

---------------------------------------------------------------------------------------------------

## §V. Verification backlog (run these searches when the budget allows)

Facts tagged [K] or *(verify)* that matter for production, with the search to run:

1. **Sgt. Pepper:**
   - the uniform colours per member: "Sgt Pepper uniforms colours John green Paul blue George red Ringo pink";
   - the bass-drum painter: "Joe Ephgrave Sgt Pepper drum".
2. **Revolver:** Voormann's hidden self-portrait: "Voormann self portrait hidden Revolver cover George hair".
3. **SFF / Penny Lane:** the US picture-sleeve artwork, "Capitol 5810 picture sleeve design".
4. **The Game:** the reflective silver original sleeve, "Queen The Game original LP silver reflective sleeve".
5. **Live Aid:** the costume; the Radio Ga Ga clap placement; the Wembley '86 inflatables: "Queen Wembley 1986 inflatable balloons".
6. **By the Way:** the cover colours, "By the Way album cover Schnabel painting description".
7. **Stadium Arcadium:** the cover designer, "Stadium Arcadium cover art Gus Van Sant".
8. **Nevermind:** the wordmark typeface, "Nirvana logo font Onyx".
9. **Covers searched for nothing yet:** Stones tongue (Pasche, Kali, V&A); Sticky Fingers (Warhol, Braun); Dark Side of the Moon (Hardie, six bands, EKG gatefold); Back in Black (grey outline, mourning); Master of Puppets (Brautigam); Ride the Lightning (blue and green); Kill 'Em All (Gene Ambo photo); the Black Album snake; Paranoid (Keef); Thriller (Zimmerman, tiger cub); Ziggy (Brian Ward, Heddon St, Terry Pastor); Aladdin Sane (Duffy, Castle).
10. **Lemon:** the single cover content, MV details, BPM and key: "Kenshi Yonezu Lemon BPM key", "Lemon single cover painting".
11. **City pop:** Plastic Love BPM and key; the 2017 thumbnail source; the "Ride on Time" album cover; Eizin Suzuki and Hiroshi Nagai cover lists.
12. **JoJo:** the Soft & Wet design details and colours, "Soft & Wet stand appearance star".
13. **All song BPMs and keys in §B1–B3:** check against a reliable tempo database or published analyses (for example Alan W. Pollack's notes for Beatles keys and forms). In particular: Strawberry Fields Forever, Here Comes the Sun bridge meters, Killer Queen, Heart-Shaped Box, Purple Rain, Soft and Wet.
14. **Rhythm games:**
    - Hi-Fi Rush GDC talk title, and its timing-window details;
    - NecroDancer default beat window;
    - *Metal: Hellsinger* layer unlocking.
15. **Japanese stadium culture:** NPB cheer-song conventions; jet-balloon timing at Kōshien; the shutter-sound custom on Japanese phones.
