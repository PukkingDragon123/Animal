# Tokonmon roster — San Francisco edition

Every Tokonmon is an original homage to a music artist: its design, its moves and its
animations wink at the artist's album covers, eras and stage persona. Homage, never copy —
no real logos, cover artwork, mascots or likenesses. Models live in `src/vx/mons/<id>.js`
(see docs/MODELS.md); gameplay data in `src/data/species/`.

## Starters
| Line | Artist homage | Stages |
|---|---|---|
| **Chilichick** → Riffrooster / Funkadoodle | Red Hot Chili Peppers (chili, heat, funk-rock) | a small, fat, furious fire chick in a chili headband, crying and screaming, swigging its own hot sauce → a rock front-man rooster / a slap-bass funk rooster |
| **Bubblion** → Princeidon / Purple Rain | Prince | a black-and-white lionfish prince swimming inside a water bubble, ruffled fin frills, tiny crown → the showman king / the purple queen of rain |
| **Strawbaa** → Ramberry / Pennyewe | Willie Nelson (country legend) | a grizzled old strawberry ram with white braids, beard and a red bandana, a healer → a giant-horned tank / a poppy healer |

## Wild and partner Tokonmon
| Tokonmon | Artist homage | Notes |
|---|---|---|
| **Pidgun ♂ / Pidgun ♀** → **Jungeon** → **Paradove** | Guns N' Roses | street pigeons: ♂ carries a revolver, ♀ a rose → a punk in a skeleton shirt holding the gun / rose in its beak → a giant flaming skeleton pigeon with a curly wig and top hat ("Paradise City"). **Paradove evolves when Jungeon faints from a burn while bonded.** |
| **Trashcoon** → **Dynacoon** → **Hellcoon** | AC/DC | a trash raccoon in a cardboard schoolboy cap playing a stick like a guitar (duck-walk) → TNT bandolier, scarier ("T.N.T.") → rides a scrap motorbike in a devil iron helmet ("Highway to Hell", bell, cannon, black leather) |
| **Gradcub** → **Bearbreak** → **Yeezilla** / **Polobruin** | Kanye West | an extra-furry graduation teddy cub with shutter shades, chain and a colour-explosion knit → a lonely grey "808s" bear with a deflated heart balloon → a giant scary bear in a spiky crystal mask ("Yeezus") or a hero protector in the classic popped-collar polo |
| **Foopod** → **Everpunch** | Foo Fighters | a rainbow mantis-shrimp boxer with long hair and a toy ray gun → an armoured brawler with drumstick antennae and UFO orbs ("Everlong") |
| **Barkorious** | The Notorious B.I.G. | the giant sea-lion king of Pier 39: tilted crown, gold chain, loud 90s knit pattern, nods to the beat |
| **Kanizumo** | The B-52's ("Rock Lobster") | Coach's sumo crab with a towering beehive topknot and cat-eye markings |
| **Zapanda** | Pink Floyd ("The Dark Side of the Moon") | Mika's electric red panda: prism emblem, a battery tail that splits light into a rainbow |
| **Beatlet** → Lenshorn / McCarapace / Harrisun / Starrab | The Beatles | Taro's mop-top beetle with a Sgt.-Pepper collar; the crosswalk walk |
| **Studrat** | Metallica ("Kill 'Em All") | Team Metallica's street rat with a sledgehammer and chrome mohawk |
| **Moshbull** | Metallica ("Master of Puppets") | rock-plated mosh-pit bull with marionette strings and a field of crosses |
| **Thrashark** | Metallica ("Ride the Lightning") | sawblade-finned walking shark crackling with lightning |
| **Lemmo** | Beyoncé ("Lemonade") | the walking lemon battery with a little baseball bat and a bee motif |
| **Cabbunny** | Bad Bunny | the cabbage bunny with edgy shades, painted claws, summer swagger |
| **Kappachi** | Nirvana ("Nevermind") | the Tea Garden kappa chasing a cucumber on a fishhook, flannel round its waist |
| **Chochobake** | Michael Jackson ("Thriller") | Chinatown's one-eyed paper-lantern ghost in a red-jacket pattern with one sparkly glove; moonwalks |

## Evolution conditions (new)
* **Paradove**: Jungeon faints from a burn while bonded with its trainer (battle event `burn_faint_bonded`).
* **Hellcoon**: Dynacoon reaches Lv.32 after winning a race on the Highway (Great Highway at night).
* **Yeezilla / Polobruin**: Bearbreak at Lv.30 — Yeezilla if it has more KOs than heals, Polobruin if its friendship is maxed and it has shielded a teammate 20 times.
* **Everpunch**: Foopod lands 50 critical punches.
