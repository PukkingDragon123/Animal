# TOKONMON — Design Bible

The single source of truth for the remake. Every agent reads this first. **Keep every idea in here
exactly as described. Do not remove or change anything, and do not invent extra features.** Where the
owner's words were open to interpretation, the interpretation used is written in *italics*.

The game was called "Elemon"; it is now **Tokonmon** (the creatures are Tokonmon, singular and plural).
Setting: futuristic **Osaka, Japan, 2050**.

---------------------------------------------------------------------------------------------------

## 1. Art direction (new)

- **Super beautiful, detailed, polished 2D pixel art, anime style.** Everything must read as 2D pixel art.
- **Tokonmon have 3D models that look super 2D**:
  - **Rendering:** cel shading with 2–3 hard bands, hue-shifted shadows, 1-pixel outlines, low-resolution pixel rendering.
  - **Animation:** stepped "on twos", 12 fps poses.
  - **Each also has a 2D model:** pixel sprites used on the phone and in the scan app, dex, team lists and cut-ins.
- **Humans are 2D pixel sprites:**
  - **Style:** anime chibi, crisp outlines, limited palettes, 4 directions, walk/idle/emote animations.
  - **Portraits:** expressive pixel-art portraits for dialogue.
- **The map is 3D, super detailed and beautiful, in an HD-2D spirit:**
  - **Layout:** 3D dioramas with pixel-art textures, voxel/pixel props and 2D sprite assets.
  - **Lighting:** dynamic light and shadows.
  - **Depth:** tilt-shift depth of field and parallax.
- **The screen works like a restaurant in a 3D side-scrolling style with 2D assets:**
  - **Controls:** you can move the camera (pan/zoom) and tap to walk.
  - **Zoom-in scenes:** you can enter scenes that zoom the camera in, like eating at a table, or ordering in first person at a counter.
  - *Every location is a side-scrolling 2.5D "stage set": long street strips and cut-away interiors viewed from the front.*
- **Almost no UI.**
  - **The phone:** mostly use the custom high-tech phone, with buttons and interactive features, instead of traditional menus.
  - **Everything else stays in the world:** speech bubbles, in-world signs, the stadium jumbotron.
- Dynamic lighting, particles, destruction, cinematic intros, animated dialogue and choice scenes (kept from v1).
- **References:** every asset is designed after studying real visual references.
  - **Sources:** Pokémon, anime pixel-art games, songs, artists and album covers.
  - **Where the notes live:** `docs/refs/*.md`.
  - **Use them as inspiration:** transform them into original designs, never copy them.

## 2. Core loop & story (kept from v1, adapted)

1. **Cinematic: the farm at dawn.**
   - Farm Tokonmon and normal farm animals; humans still eat normal farm animals.
   - A fire wolf (Kagarou) bursts in, and the sky whale Polaris passes overhead.
   - Tokonmon are protected by law: they can't be caught without a license.
2. **Start in a park (Osaka Castle Park).**
   - Receive your first Tokonmon, plus a **bracelet with a soul stone** that links you with your buddy.
   - Also receive your **custom high-tech phone**.
3. **Choose from 3 starters:**
   - Chilichick (Pyro)
   - Bubblion (Hydro)
   - Strawbaa (Bio)
4. **Battle the coach, then the rival.** After winning, level up, choose a reward and learn new skills.
5. **Eat ice cream with the coach and the gang.**
   - A punk (Team Metallica) challenges you, your friend and your trainer to a **3v3**.
   - Borrow a kid's **bug-type beetle** Tokonmon (Beatlet).
   - Learn switching, team combos and strategy.
6. **After the punk battle:** dinner, return to the training ground, the story continues.
7. **Next day: register for the League.**
   - Fight players and gain ranks.
   - Lunch breaks, then afternoon free time: train, explore the safari, relax.
8. **Goals:** become League champion, defeat Team Metallica, do side quests.
9. **Time & choices:**
   - Day-based time system, deadlines, branching choices.
   - Random fun events, and detailed animated choice scenes with stat boosts.
   - Activities unlock progressively.

## 3. Tokonmon roster

`stage → stage (alt)`. Every final evolution can reach an **Elemental Form** (see §5). Elements:

| Group | Elements |
|---|---|
| Core | Pyro, Hydro, Bio, Geo, Echo |
| Extra | Volto, Cryo, Aero, Ecto, Ferro, Astro, Nucleo |

**Element styles:**
- **Pyro:** raw power and charge.
- **Hydro:** precision, strategy and aiming.
- **Bio:** healing, poison, sleep and support.
- **Geo:** walls and parries.
- **Echo:** rhythm.

**Reactions:** water + fire = steam explosion. Switching is essential.

### Starters (all have alternate evolutions)

**Chilichick** (Pyro)
- **Concept:** a red hot chili pepper chicken (Red Hot Chili Peppers). It is always eating a pepper and breathes fire.
- **Signature look:** it is crying because of the heat.
- **Main evolution: Riffrooster** (Pyro/Echo), a guitarist chicken.
  - Close-range, with fast attacks, fast movement and scary fire.
- **Alt evolution: Funkadoodle** (Pyro/Echo), the band's *bassist* rooster.
  - *Interpretation: alternate band member, keeping the RHCP theme.*
  - Slap-bass fire shockwaves; still fast and close-range.

**Bubblion** (Hydro)
- **Concept:** a bubbly lionfish inside a soft, bouncy ball of water, inspired by **Soft & Wet**.
- **Look:** wears a **crown**.
- **Play:** water bullet attacks; long-range and slow.
- **Main evolution: Princeidon** (Hydro), a king.
  - A giant water-tsunami Poseidon lionfish in **bubble armor**.
  - Based on **Prince** and **Soft & Wet**.
- **Alt evolution: Purple Rain** (Hydro), the **queen** version, wearing a **dress**.

**Strawbaa** (Bio)
- **Concept:** a cute strawberry sheep, based on **Strawberry Fields**.
- **Role:** healer and support. It can **ram** and has a lot of health.
- **Gimmick:** it can **place plants that damage and heal**, like strawberry vines.
- **Main evolution: Ramberry** (Bio/Geo), a **giant ram with horns**.
  - *Interpretation: also a nod to the album* Ram.
- **Alt evolution: Pennyewe** (Bio), a "Penny Lane" nurse ewe selling poppies from a tray.
  - *Interpretation: the pure-healer alternate.*

### Other owner-specified Tokonmon

**Rolling Stone line** (Geo)
- Rollingstone (a rolling stone) → **Fivestones** (5 stones of armor) → **Fiftystone** (a 50-stone giant golem).
- **Alternate from Rollingstone:** **Gradbear**, a Kanye *Graduation* bear Tokonmon.

**Heartbox → Inbloom** (Ecto): a gimmick Tokonmon, a heart-shaped box inspired by **Nirvana**.
- **Starts as a giant golem:** super slow, and does almost no damage.
- **Transformation:** when you **bond** with it and it **gets kills**, the box breaks and reveals **Inbloom**, a beautiful humanoid angel with blades.
- *The name nods to "In Bloom"; the angel nods to the* In Utero *angel.*

**Beatlet** (Bio), a Beatles-inspired beetle. It evolves into **four forms based on the members**:

| Form | Element | Condition |
|---|---|---|
| **Lenshorn** | Echo | defeat 20 Lemmo + the Alpha Lemmo boss in the safari |
| **McCarapace** | Hydro | deep friendship by the Dotonbori canal |
| **Harrisun** | Pyro | dojo meditation, then sunrise |
| **Starrab** | Geo | 25 team combos |

**The rest of the roster:**
- **Lemmo** and **Alpha Lemmo** (Volto): the lemon Tokonmon of the beetle evolution (a "Lemon" song nod).
- **Kagarou** (Pyro): the fire wolf from the cinematic.
- **Farm Tokonmon:** Cabbunny (Bio) and Moglow (Geo).
- **Farm animals** (not Tokonmon): cow, chicken, pig, farm dog.
- **Legendaries**, catchable through archaeologist (Dr. Hoshino) quests:
  - **Polaris**, the sky whale (Aero/Astro)
  - **Solaris**, the giant lion (Pyro/Astro)
- **Final boss: Atomic** (Nucleo), a nuclear-shard, rift-born dragon crocodile that wants to reset the world. Catchable after defeat.
- **Untameable wild beasts** that disrupt exploration: Rift Boar and Oni Bear.

### Song / artist / album Tokonmon
*Owner asked for super cool Tokonmon based on songs, artists and album covers.*

| Group | Tokonmon |
|---|---|
| Safari & city wilds | Kappachi (Hydro), Hotarumi (Volto/Bio), Chochobake (Ecto), Tengale (Aero), Yukiusa (Cryo) |
| Friends' and other trainers' partners | Zapanda (Volto, Mika's), Kanizumo (Hydro/Geo, Coach's), Idolark (Echo), Mechanyan (Ferro/Volto) |
| Team Metallica & metal bullies | Studrat (Ferro), Moshbull (Geo), Thrashark (Hydro), Marionoir (Ecto, "Master of Puppets"), **Sandmare** (Ecto/Geo, "Enter Sandman"), **Ironmaw** (Ferro, "Iron Man") |
| The Beatles (Elite Four) partners | **Yellowsub** (Hydro/Ferro, "Yellow Submarine"), **Blackbyrd** (Aero, "Blackbird"), **Lucydiamond** (Astro/Cryo, "Lucy in the Sky with Diamonds") |
| Queen (Champions) partners | **Killerqueen** (Ecto/Bio queen bee, "Killer Queen"), **Bohemoth** (Echo/Ecto, "Bohemian Rhapsody"), **Dontstopmeow** (Volto speed cat, "Don't Stop Me Now"), **Radiogaga** (Echo/Volto radio robot, "Radio Ga Ga"), **Bitesdust** (Geo, "Another One Bites the Dust") |
| Other artists | **Thrillghoul** (Ecto, "Thriller"), **Ziggystar** (Astro/Volto, "Ziggy Stardust") |

### Lore only (do NOT add as Tokonmon yet)
The **gods of light** who made the world:
- **Dark Side of the Moon**, a prism-like dragon.
- **Back in Black**, a dark dragon.

You can find them (murals, Dr. Hoshino's research, phone lore entries), but they cannot be met or caught yet.

## 4. Characters & trainers

**Story cast:**

| Group | Characters |
|---|---|
| Player and friends | the **player** (customizable); **Mika** (best friend, Zapanda); **Kaito** (rival); **Taro** (kid with the beetle) |
| Mentor and allies | **Coach Gonda** (Kanizumo); **Dr. Hoshino** (archaeologist; legend quests; lore) |
| Townsfolk | Takoyaki Taisho (vendor); Yuzu (ice-cream clerk); Old Man Kubo (farmer); Ms. Aoi (League receptionist); Lumi★ (idol); Mr. Tanaka (salaryman); Granny Fuku; Master Genryu (dojo); Auntie Kazu (shopkeeper); Ranger Sora |
| Restaurant & stadium staff | chefs, **reporters** (sideline reporter + camera crew), stadium announcer, **cheering crowds** |

**Bullies:**
- **Team Metallica**, a punk gang that bullies people and collects money: **Thrash** (leader), **Riff**, **Moshi**.
- **A lot of other bullies with metallic styles:** thrash, black-metal corpse paint, glam, nu-metal, studded denim battle vests, chains.
- **You can befriend one of them:** *Moshi, the softie who feeds stray cats.*

**The League:**
- **Elite Four: The Beatles.** *In-world they are a Beatles tribute band of master trainers with the stage names John, Paul, George and Ringo; styled after Sgt. Pepper / Abbey Road looks.*
- **Champions: Queen.** *A Queen tribute supergroup with the stage names Freddie, Brian, Roger and John.*
- **Rank-match opponents.**

**Super cool trainers based on songs, artists and album covers:** *rank-match opponents, safari rivals and bullies themed on music.*

**Friends you can contact and hang out with (Persona-style):** Mika, Kaito, Taro, Moshi (once befriended), Lumi★ and Dr. Hoshino.
- Each friend has a **bond rank**, hangouts, and **quests involving friends**.

## 5. Bonding (new gimmick) & Elemental Forms

- **Bonding** links the player with their Tokonmon, with a cool effect (soul-stone beam, aura).
- **While bonded:**
  - **Full control:** you control the Tokonmon directly, with no order delay.
  - **Special gimmick:** each Tokonmon gets its own, e.g. expanding horns (Strawbaa/Ramberry), bubbles (Bubblion line), fur, blazing crest (Chilichick line).
  - **Accessories:** the Tokonmon **wears the trainer's accessories**, like a hat.
- **Full potential:** at its **final evolution** a bonded Tokonmon can achieve a **full Elemental Form**.
  - It unlocks its full potential, a new form evolution and an elemental form: a special type of form.
  - *Kept from v1: at extreme friendship the soul stone transforms (Spectral stone). That stone is what lets a bonded final evolution enter its Elemental Form.*
- **Ultimates** are super cool and **only usable when bonded**. **Using an ultimate stops the bonding.**
- **Bonding comes first, and you have to think:** some passives, requirements and skills depend on:
  - the moves you use
  - how long you've been bonded
  - switching
  - etc.
- **Heartbox → Inbloom** requires bonding plus kills while bonded.

## 6. Combat (kept + new)

**Kept from v1:**
- Real-time strategic combat with tap-to-move commands, aimed abilities, dodge orders, parries, attacks, elemental reactions, QTEs and team combos.
- **Combo moves** built from basic actions: grab + parry + attack; elemental charge + attack.
- Captures with the **keychain capture device powered by gems**.

**New:**
- **More fun and immersive.**
- **Control:** Tokonmon have **auto-control**. When you give orders (dodge, attack, charge, …) there is a **little delay** before they execute. *Bonding removes the delay and gives full control.*
- **Switching:**
  - It takes **7 seconds**, and the other team can do other things, like charge, while waiting.
  - It has a **15-second cooldown**.
- **Gimmicks and passives:** cool gimmicks for each Tokonmon, and passives like **when you switch out and come back, you get an extra punch**.
- **Emote moves:** taunt, dance, shake, etc.
- **Stadium:** a high-tech sports arena with **reporters**, **cheering crowds** and an **arena that can change**.
  - **When you start**, choose an arena from 3 types: **rocky, grassy, water**.
  - **At halftime**, choose again.

**The League:**
- **A full ranking system.**
- **Elite Four (The Beatles)** and **Champions (Queen)**, with **epic soundtracks inspired by their songs**.
- **Music sync:** attacks, cutscenes, etc. **sync with the songs**.
- *Kept from v1:* arenas can have requirements by elements, environments and challenges.

## 7. Skills, stats & progression

- **Phone scan:** to view a Tokonmon's information, scan it with your phone. You enter an **elemental, cool skill tree shaped like a stat chart** (radar chart over the five stats: Damage, Element, Defense, Speed, Health).
  - **Levels upgrade stats;** when a stat reaches **a certain mark you gain a passive**.
  - *This chart is the v1 "Astral" tree reshaped. The v1 slots stay: up to 4 active skills, 1 ultimate and 2 passive slots, unlocked through progression.*
  - *Level-up rewards, items, evolutions and team-building are kept.*
- **Skills and passives are gained mostly through:**
  - battles
  - exploring
  - activities and side quests
  - **eating**
- **Eating examples:**
  - Take the chili pepper chicken to eat **super spicy curry** → it gains a **Heat Tolerance** passive.
  - Feed it **a lot of spicy food** → it gains a **fire-breathing** skill.
- **You need to bond with them more.** Swap passives and abilities **on your phone** or **train them at the dojo**.
- **In-battle unlocks:** unlocking skills is fun and can happen during battles, e.g.:
  - when you get **burned**
  - when you land a **critical hit**
  - when you **drown**
  - etc.
- **Learning rules:**
  - Moves are learned **one by one** and are **not shared** between Tokonmon.
  - **The exception: discs.** Vinyl-like discs teach skills, and you can buy them.
- **Renaming:** you can change skill names and ultimate names.
- **Skill levels:** skills get better as they level up, and they **level up only by using them**.
- **Dojo:**
  - **Auto-training** is very slow (kept).
  - It is a place where you can **train**.
  - It's where you **see your roster**.
- **Evolutions are spectacular,** with specific conditions (kept).

## 8. The phone

- **The device:** a custom high-tech phone that you can **decorate** (case, stickers, charms, wallpaper).
- **What it does:** view your **license**, **scan** Tokonmon, **set up your team**.
- **It is the main interface** in place of menus:
  - map / travel
  - quests
  - contacts & messages (friends)
  - bag
  - discs
  - save / settings
- **In battle,** the phone is the command controller.
- **Cosmetics** (kept from v1): watches, earrings, badges, hair clips and grillz for the bracelet and soul stone, plus special eyeballs for Ecto Tokonmon.

## 9. World

- **Three explorable towns plus outskirts:**
  - Chuo (Castle Park)
  - Namba (Dotonbori)
  - Umeda (League HQ + Stadium)
  - Shinsekai
  - Minoh Safari (three trails)
- **The map unlocks progressively:** restaurants, shops, stadiums, dojos, safari zones.
- **Safari zone:**
  - Three trails, with careful movement (sneaking through tall grass) to find rare creatures.
  - Some Tokonmon are aggressive or hard to bond with.
  - Untameable wild beasts disrupt exploration.
- **Scenes:** side-scroll street strips; cut-away interiors (restaurants, dojo, shops, onsen, arcade, League lobby); **zoom-in scenes** (sit and eat at a table, first-person ordering at a counter).
- **Cool buildings.**

## 10. Audio

- Procedural music and SFX, kept.
- **New tracks:**
  - an Elite Four theme inspired by The Beatles' songs
  - a Champions theme inspired by Queen's songs
  - stadium crowd, chants and reporter camera SFX
- **Music sync:** attacks and cutscenes **sync to the music's beat**.
- **Originality:** only original melodies, inspired by the style; never reproduce real melodies or lyrics.
