// Words for Sunset Row: Mom, the TV, books, mail, games, neighbours. All original.
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
/** the player's name and a pronoun-free nickname, from whatever the save has */
export function who(app) {
  const s = app.state || {}, p = s.player || {};
  const name = s.name || p.name || 'kiddo';
  const g = s.gender || p.gender || p.sex || (p.look && (p.look.sex || p.look.gender)) || (p.preset === 'player_b' ? 'f' : p.preset === 'player_a' ? 'm' : null);
  const kind = g === 'f' || g === 'girl' || g === 'female' ? 'girl' : g === 'm' || g === 'boy' || g === 'male' ? 'boy' : null;
  return { name, kind };
}

export const MOM = [
  ['Morning, sweetheart! Breakfast is on the table — the toast, not the dish towel. I checked.', 'Your partner already ate half of yours, by the way. I let it. Look at that face.'],
  ['Going out? Take a jacket. I know it is sunny. It is San Francisco. The fog is just waiting for you to trust it.'],
  ['Mrs. Ochoa next door says the Pidgun on our roof are "plotting". I told her they are just pigeons with ambition.', 'Then one of them stole her clothespin. So. Maybe she has a point.'],
  ['I found three capsule toys in the washing machine. Again.', 'I am not angry. I am just... rinsing them. Gently. Like a mother.'],
  ['Tamers your age are out there making history, and I am in here making soup.', 'Honestly? Good soup is also history. Small history. The kind you can eat.'],
  ['Dad sent a postcard from the research ship! He says the sea Tokonmon keep stealing his hat.', 'He also says "tell the kid I am proud". So. Consider yourself told.'],
  ['If you are heading into the city, say hi to Mr. Park at the corner market.', 'And do NOT let him talk you into the "mystery" flavour of ramune again.'],
  ['You are always welcome to rest up here, you know. Your bed. Your snacks. Your mother, judging your snacks.'],
];
export const MOM_STOVE = [
  ['Mom: Hands off the stove, chef. That pot is older than your league licence and twice as temperamental.'],
  ['Mom: That is a curry, not a science experiment. Stir it and you are on dish duty for a week.'],
  ['Mom: The left burner only works if you believe in it. I believe in it. You are not ready.'],
];

export const TV = [   // [channel title, ...alternative line sets]
  ['Bay Area Morning — News', [
    'ANCHOR: Good morning, Bay Area! A flock of Pidgun has once again occupied the cable-car turnaround.',
    'ANCHOR: Officials ask commuters to please stop feeding them fries. "It only encourages the strutting."'],
  [
    'ANCHOR: Weather now: sunny until 3 PM, then the fog arrives on schedule, as it has every day since records began.',
    'ANCHOR: Experts recommend layers, patience, and a warm Pyro-type.'],
  [
    'ANCHOR: In local news, the Sunset Row Community Garden reports a record zucchini.',
    'ANCHOR: A Trashcoon was seen fleeing the scene. Investigations continue.']],
  ['Wok This Way — Cooking', [
    'HOST (offscreen): Today: dumplings so good, even your Pyro partner will wait for them to cool down. Probably.',
    'HOST: The secret? Fold with love. And with chopsticks. Mostly chopsticks.'],
  [
    'HOST: Tip of the day — a pinch of salt in the rice. A pinch. Not the jar. Put down the jar.',
    'HOST: ...My producer says I am "talking to the camera like it owes me money". Moving on!']],
  ['League Tonight — Highlights', [
    'COMMENTATOR: What a finish at the Bay Arena! A rookie\'s fire chick held on with one sliver of health...',
    'COMMENTATOR: ...and turned it all around with a team combo! The crowd is on its feet! The Pidgun in the rafters are on THEIR feet!'],
  [
    'COMMENTATOR: Rank D tonight is wide open. Plenty of fresh tamers climbing. Any one of them could be next season\'s Champion.',
    'COMMENTATOR: Could be someone watching right now. Yes, you. Sit up straight.']],
  ['Wild Bay — Nature Documentary', [
    'NARRATOR (hushed): The Foopod. Small. Determined. Entirely unaware that it is not the size of a whale.',
    'NARRATOR: It punches the tide each morning. The tide has never once lost. The Foopod remains undefeated in spirit.'],
  [
    'NARRATOR: At dusk, Snoozaque drift in on the fog. Few have seen one awake.',
    'NARRATOR: Fewer still have seen one interested in anything at all. We admire its commitment.']],
];

export const BOOKS = [
  ['A Pocket History of Tamers', 'Long before capture gems and keychain devices, tamers made friends with Tokonmon the slow way: by sharing lunch.', 'Chapter 2 is titled "Why Your Partner Ate Your Lunch: A Retrospective."'],
  ['Elements for Beginners', 'Pyro, Hydro, Bio, Geo, Echo... and then the strange ones: Volto, Cryo, Aero, Ecto, Ferro.', 'Somebody has pencilled in the margin: "the chart is a suggestion. the crowd is the law."'],
  ['Fog City Field Guide', 'Pidgun: everywhere. Trashcoon: alleys, bins, your heart. Foopod: the bay, punching things.', 'The Snoozaque page is just a photo of fog with a small arrow that says "probably here".'],
  ['101 Dishes Your Partner Will Steal', 'Recipe 1: Rice. Recipe 2: Rice, but you turned around for one second.', 'Mom\'s notes in the margins get angrier as the recipes get better.'],
  ['The Bracelet and the Bond', 'A soul stone does not make a Tokonmon trust you. It only lets the trust you already built go somewhere.', 'It is underlined twice. In Dad\'s handwriting.'],
];
export const COMICS = [
  ['Captain Chilichick #12', 'The Captain faces the Fog Emperor! "You cannot burn fog!" "Watch me!"', 'It turns out you can, in fact, burn fog. Comics are great.'],
  ['Pocket Kart Monthly (2 years old)', 'Shortcut tips for a game you mastered ages ago. You read them anyway. Nostalgia.'],
  ['Your old sketchbook', 'Page after page of Tokonmon you made up when you were small. One is a toaster with legs.', 'Honestly? Still a great design.'],
];

export const MAIL = [
  ['From: Tokon League Office', '"Reminder: rookie matches run every day. Bring your licence, your partner, and snacks for both."'],
  ['From: Mika', '"r u coming downtown later?? there\'s a new crêpe stand and I need a taste-tester. it\'s u. ur the tester."'],
  ['From: Grandma', '"Dear, I learned to send electronic mail. This is electronic mail. Love, Grandma. P.S. how do I turn it off"'],
  ['From: Dad', '"Greetings from the research ship! A Grillfin tried to bite the antenna. It is fine. The antenna is not. Love you, kid."'],
  ['From: D3ALZ D3ALZ', '"CONGRATULATIONS!!! You have won ONE (1) Diamond Gem!!! Click here!!!" ...Delete. Obviously.'],
];

export const GAMES = [
  ['Pocket Kart DX', ['You take the jump, fly over the bridge... and land in the bay. Lap 3 of 3. Seventh place. A personal best, technically.', 'Photo finish! You win by a single pixel. You do a victory lap around the bedroom.', 'Your kart spins out on a banana. You did not even know there were bananas.']],
  ['Fog Runner II', ['World 4-2: you finally find the secret pipe. It leads to World 4-2.', 'You beat the boss on your first try. Your partner, watching, is visibly impressed.', 'You fall into the same pit three times. The pit is getting smug.']],
  ['Dance Dance Pidgun', ['PERFECT x 12! Your partner bops along. The floor creaks. Mom yells "everything OK?"', 'You fail the song but you did it with style. The game disagrees about the style.', 'NEW HIGH SCORE. You type your initials. The game only allows three letters. You choose wisely.']],
];

export const MIRROR = (name, kind) => [
  [`Looking sharp, ${name}. The hair is doing its own thing again, but it is doing it confidently.`],
  [`You practise your League entrance pose. ...Maybe skip the finger guns.`],
  [kind === 'girl' ? `Future Champion of the Bay, ${name}. Obviously. Look at that determination.` : kind === 'boy' ? `Future Champion of the Bay, ${name}. Obviously. Look at that determination.` : `Future Champion of the Bay, ${name}. Obviously. Look at that determination.`, 'There is toothpaste on your chin. Champions also have toothpaste on their chins.'],
];

export const NEIGHBOR_GRAN = [
  ['Mrs. Ochoa: Oh! It is you! Come in, come in — mind the yarn, it has opinions.', 'Mrs. Ochoa: I have lived on Sunset Row for fifty-one years. The houses change colour every decade. The fog never does.'],
  ['Mrs. Ochoa: When I was your age I trained a Snoozaque. Champion of naps, three years running.', 'Mrs. Ochoa: We never won a single battle. But oh, we had the best afternoons.'],
  ['Mrs. Ochoa: Your mother brings me soup every Thursday. Tell her the soup is perfect.', 'Mrs. Ochoa: ...And tell her she uses too much ginger. Lovingly. Use the word lovingly.'],
  ['Mrs. Ochoa: Those Pidgun on your roof? Plotting. I have watched them. They have a leader. He has a limp and a vision.'],
];
export const NEIGHBOR_KID = [
  ['Milo: WHOA, a real tamer! In MY room! Do you want to see my Tokon chart? I have 9 out of 150! Some of them are drawings.'],
  ['Milo: Did you know Pidgun can see ultraviolet? That is why they stare at you. They are reading your aura. Yours is orange. Probably.'],
  ['Milo: When I am old enough I am going to catch a Trashcoon and name it Mister Lid.', 'Milo: Mom says "absolutely not". Mom also said that about the hamster. We have a hamster.'],
  ['Milo: Can you battle me?? I am using Plush Gradcub. He has 999 HP. I made him.', 'Milo: ...Okay he has zero attack. He is a defence build. A HUGGING defence build.'],
];
export const SHOPKEEPER = [
  ['Mr. Park: Welcome to the Corner Market! Open late, closed early, mostly in between.', 'Mr. Park: The delivery truck is stuck on the hill again, so the shelves are, er... decorative today.'],
  ['Mr. Park: Ramune flavour of the week: "Mystery". I do not know what it is. The supplier does not know. It is selling extremely well.'],
  ['Mr. Park: Your mom was in this morning. Bought ginger. A LOT of ginger. Tell Mrs. Ochoa I said nothing.'],
  ['Mr. Park: That cat on the counter is not mine. She came with the shop. I think I came with her, actually.'],
];
export const GARDENER = [
  ['Gardener: Morning! This plot is mine. Those sunflowers? Also mine. That zucchini the size of a sea lion? We do not talk about the zucchini.'],
  ['Gardener: Bio-types love this garden. Last spring a Creepetal moved into the tomatoes. Best tomatoes we ever had. Slightly haunted.'],
];
export const PARKGOER = [
  ['Neighbour: Nice day for it, huh? Sun out, fog on its way. Classic Sunset Row.'],
  ['Neighbour: I come here to read. I have been on the same page for a month. The view keeps interrupting.'],
];
