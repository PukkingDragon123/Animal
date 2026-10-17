// Friends you can contact and hang out with (Persona-style). Each friend has a
// bond rank 1–10 raised by hangouts, gifts and friend quests; ranks unlock perks.
// Messages arrive on the phone's Contacts app (LINE-style chat).
//
//   likes: what makes a hangout choice land (+5 bonus)
//   hangouts: places you can invite them to → a short scene (lines + one choice)
export const RANK_PTS = [0, 10, 25, 45, 70, 100, 135, 175, 220, 270];
export const MAX_RANK = RANK_PTS.length;

export const FRIENDS = {
  mika: {
    name: 'Mika', role: 'Best friend', color: '#ffcf2e', partner: 'zapanda', met: 'start', likes: ['sweet', 'arcade', 'dance', 'karaoke'],
    perks: { 3: 'Mika tags along in the safari and joins wild battles.', 6: 'Team-combo meter fills 20% faster when she fights with you.', 10: 'Best Friends Forever: a two-team combo ultimate.' },
    quest: 'mika_panda_parade',
    hangouts: [
      { id: 'mika_icecream', place: 'yellow_submarine', title: 'Soft-serve run', lines: ['Two spoons, one giant sundae. Mika insists it is "for sharing".', "She steals your cherry. Then gives you hers. \"That's friendship math!\""],
        choice: { q: 'Mika: "Which flavour is the best one? Be honest!"', options: [{ label: 'Chili-Mango, obviously', tag: 'spicy' }, { label: "Octopus's Garden!", tag: 'sweet', good: true }, { label: 'Whatever you pick', tag: 'easy' }] } },
      { id: 'mika_arcade', place: 'arcade', title: 'Claw-machine heist', lines: ['Mika has a "foolproof" claw-machine strategy. It costs ¥800 and wins one tiny panda.', 'She names it after you.'],
        choice: { q: 'Mika: "Rhythm game! Loser buys takoyaki!"', options: [{ label: 'Let her win', tag: 'kind' }, { label: 'Go all out', tag: 'arcade', good: true }, { label: 'Dance instead', tag: 'dance', good: true }] } },
      { id: 'mika_park', place: 'castle_park', title: 'Bench by the moat', lines: ['Zapanda naps on both of your laps. Neither of you dares to move for an hour.'],
        choice: { q: 'Mika: "Do you ever get scared before battles?"', options: [{ label: 'All the time', tag: 'honest', good: true }, { label: 'Never!', tag: 'brag' }, { label: 'Only of Coach', tag: 'joke', good: true }] } },
    ],
  },
  kaito: {
    name: 'Kaito', role: 'Rival', color: '#e8233a', partner: null, met: 'flag:met_kaito', likes: ['training', 'spicy', 'honest', 'dojo'],
    perks: { 3: 'Spar with Kaito at the dojo any afternoon (training battles).', 6: 'He shares his bonding notes: your bonds start 10% fuller.', 10: 'Rivals for life: he cheers in your stadium matches.' },
    quest: 'kaito_dawn_training',
    hangouts: [
      { id: 'kaito_dojo', place: 'dojo', title: 'Dawn sparring', lines: ['Kaito pretends he "just happened" to be at the dojo at 6 a.m. again.', 'He shows you a footwork drill. Then does it 200 more times.'],
        choice: { q: 'Kaito: "Why do you even battle?"', options: [{ label: 'For my partner', tag: 'honest', good: true }, { label: 'To beat you', tag: 'training', good: true }, { label: 'For the snacks', tag: 'joke' }] } },
      { id: 'kaito_curry', place: 'food_hall', title: 'Curry challenge', lines: ['Kaito orders the Super Spicy Curry "for training purposes". He does not blink. He cries a little.'],
        choice: { q: 'Kaito: "...Want to try it?"', options: [{ label: 'Bring it on', tag: 'spicy', good: true }, { label: 'Hard pass', tag: 'easy' }, { label: 'Only if you finish yours', tag: 'training', good: true }] } },
    ],
  },
  taro: {
    name: 'Taro', role: 'Bug-catching kid', color: '#3fae4a', partner: 'beatlet', met: 'flag:met_taro', likes: ['bugs', 'explore', 'sweet', 'kind'],
    perks: { 3: 'Taro texts you where rare bugs and Lemmo are hiding.', 6: 'He gifts you a beetle gem now and then.', 10: 'Beetle Brothers: Beatlet evolves 25% faster with you.' },
    quest: 'taro_lemon_grove',
    hangouts: [
      { id: 'taro_minoh', place: 'minoh_maple', title: 'Bug safari', lines: ['Taro knows every bug in Minoh by first name. Some of them have middle names.'],
        choice: { q: 'Taro: "Which bug is the coolest?"', options: [{ label: 'Rhinoceros beetle', tag: 'bugs', good: true }, { label: 'Fireflies', tag: 'kind', good: true }, { label: 'Ew, bugs', tag: 'rude' }] } },
      { id: 'taro_takoyaki', place: 'dotonbori', title: 'Takoyaki stakeout', lines: ['Taro is convinced a rare bug lives in the takoyaki stall. It is a moth. He is thrilled.'],
        choice: { q: 'Taro: "Can we share the last one?"', options: [{ label: 'It\'s all yours', tag: 'kind', good: true }, { label: 'Rock-paper-scissors', tag: 'joke', good: true }, { label: 'Mine!', tag: 'rude' }] } },
    ],
  },
  moshi: {
    name: 'Moshi', role: 'Team Metallica (softie)', color: '#7b5cff', partner: 'moshbull', met: 'flag:moshi_friend', likes: ['cats', 'kind', 'metal', 'sweet'],
    perks: { 3: 'The metal bullies stop picking on you in Shinsekai.', 6: 'Moshi gets you 20% off at the Grillz shop.', 10: 'In the final showdown with Team Metallica, Moshi fights on your side.' },
    quest: 'moshi_stray_cats',
    hangouts: [
      { id: 'moshi_cats', place: 'shinsekai', title: 'Stray-cat patrol', lines: ['Moshi has a secret route through Shinsekai. Every alley has a cat. Every cat has a name.', 'He made them tiny studded collars. They are ADORABLE.'],
        choice: { q: 'Moshi: "...Don\'t tell Thrash about this, okay?"', options: [{ label: 'Your secret is safe', tag: 'kind', good: true }, { label: 'Cats are metal', tag: 'metal', good: true }, { label: 'I might', tag: 'rude' }] } },
      { id: 'moshi_records', place: 'kansai_calling', title: 'Vinyl digging', lines: ['Moshi flips through the metal crate in silence, then hands you a lullaby record. "For my cats."'],
        choice: { q: 'Moshi: "Is it weird? A metalhead who likes lullabies?"', options: [{ label: 'It\'s awesome', tag: 'kind', good: true }, { label: 'A little weird', tag: 'honest' }, { label: 'Play both at once', tag: 'metal', good: true }] } },
    ],
  },
  lumi: {
    name: 'Lumi★', role: 'Idol', color: '#ff6ad5', partner: 'idolark', met: 'flag:met_lumi', likes: ['dance', 'karaoke', 'fans', 'sweet'],
    perks: { 3: 'Concert tickets: your lead Tokonmon can learn Crowd Pleaser.', 6: 'Dance lessons: dancing on the beat in battle heals 5% more.', 10: 'A duet at the stadium halftime show.' },
    quest: 'lumi_stage_fright',
    hangouts: [
      { id: 'lumi_karaoke', place: 'arcade', title: 'Karaoke booth', lines: ['Lumi★ picks the hardest song in the machine and nails it in one take. Then makes you sing the second verse.'],
        choice: { q: 'Lumi★: "Rate my dance break! 1 to 10!"', options: [{ label: '11', tag: 'fans', good: true }, { label: 'A solid 7', tag: 'honest' }, { label: 'Teach me!', tag: 'dance', good: true }] } },
      { id: 'lumi_umeda', place: 'umeda', title: 'Incognito shopping', lines: ['Lumi★ wears sunglasses, a hat and a mask. Everyone recognises her instantly by the sparkles.'],
        choice: { q: 'Lumi★: "Do I look like a normal person?"', options: [{ label: 'Totally normal', tag: 'kind', good: true }, { label: 'You look like an idol in disguise', tag: 'honest', good: true }, { label: 'You look suspicious', tag: 'rude' }] } },
    ],
  },
  hoshino: {
    name: 'Dr. Hoshino', role: 'Archaeologist', color: '#2f6fd6', partner: null, met: 'flag:met_hoshino', likes: ['history', 'stars', 'explore', 'honest'],
    perks: { 3: 'Legend quests: the trail of Polaris and Solaris.', 6: 'She trades Star Gems for star fragments.', 10: 'The murals: the full story of the gods of light.' },
    quest: 'hoshino_murals',
    hangouts: [
      { id: 'hoshino_castle', place: 'castle_park', title: 'Stone-wall survey', lines: ['Dr. Hoshino reads the castle stones like a book. One of them, she says, is 400 years older than the rest.'],
        choice: { q: 'Hoshino: "Do you believe gods made the world?"', options: [{ label: 'Tell me about them', tag: 'history', good: true }, { label: 'I believe in Tokonmon', tag: 'honest', good: true }, { label: 'Sounds boring', tag: 'rude' }] } },
      { id: 'hoshino_stars', place: 'minoh_waterfall', title: 'Stargazing', lines: ['Away from the neon, the sky over Minoh is full of stars. Dr. Hoshino points at a prism-shaped constellation and goes quiet.'],
        choice: { q: 'Hoshino: "What do you see up there?"', options: [{ label: 'A dragon made of light', tag: 'stars', good: true }, { label: 'Satellites', tag: 'honest' }, { label: 'Lunch', tag: 'joke' }] } },
    ],
  },
};

// Friend chat lines (LINE-style). {time} buckets: morning, day, evening, night.
export const CHATTER = {
  mika: ['ice cream later?? 🍦🍦', 'zapanda just sneezed lightning on my homework', 'GOOD LUCK TODAY!!! (you got this)', 'are you awake… i can\'t sleep, too excited'],
  kaito: ['Dojo. 6 a.m. Don\'t be late.', 'Your bond timing was sloppy. Fix it.', '…Good match today.', 'I am not texting you because I\'m bored.'],
  taro: ['FOUND A LEMMO!!! 🍋🍋🍋', 'do beetles dream', 'my mom says I have too many jars', 'Beatlet says hi (it headbanged)'],
  moshi: ['📷 [a cat in a tiny leather jacket]', 'thrash is in a mood. avoid the alley', 'u like lullabies?', 'thx for not telling anyone'],
  lumi: ['✨ rehearsal was a DISASTER (I fell. twice.)', 'free tickets for u at the stadium!!', 'teach me a battle dance pls', 'shhh I\'m incognito 🕶️'],
  hoshino: ['Found another mural fragment. Prism motif. Remarkable.', 'Bring any star fragments you find, please.', 'The night sky over Minoh is clear tonight.', 'Have you heard of the Dark Side of the Moon?'],
};
