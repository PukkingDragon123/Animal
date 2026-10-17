// Random daily events + meal/choice scenes. Each option grants boosts:
//   stat: {stat, n} (to the lead Elemon's allocation), friend: n, money: n,
//   items: {id:n}, flag, battle: spec key.
export const MEALS = {
  icecream: {
    title: 'Yellow Submarine Soft-Serve', subtitle: 'Pick a flavour for you and your partner!', art: 'icecream',
    options: [
      { id: 'yuzu', label: 'Yuzu Sorbet', icon: '🍋', desc: 'Zesty! Your partner zips around the table.', stat: { stat: 'spd', n: 1 }, friend: 4 },
      { id: 'matcha', label: 'Uji Matcha', icon: '🍵', desc: 'Calm, focused, elemental.', stat: { stat: 'elm', n: 1 }, friend: 4 },
      { id: 'sesame', label: 'Black Sesame', icon: '🖤', desc: 'Earthy and sturdy.', stat: { stat: 'def', n: 1 }, friend: 4 },
      { id: 'chili', label: 'Chili-Mango', icon: '🌶️', desc: 'Spicy! Fire in the belly.', stat: { stat: 'dmg', n: 1 }, friend: 4 },
      { id: 'tako', label: 'Takoyaki Swirl', icon: '🐙', desc: 'Weird. Wonderful. Very filling.', stat: { stat: 'hp', n: 1 }, friend: 6 },
    ],
  },
  dinner: {
    title: 'Abbey Road Okonomiyaki', subtitle: 'Dinner with the gang — what do you do?', art: 'dinner', picks: 2,
    options: [
      { id: 'league', label: 'Ask Coach about the League', icon: '🏆', desc: 'He talks strategy for an hour.', stat: { stat: 'elm', n: 1 }, flag: 'league_talk' },
      { id: 'arm', label: 'Arm-wrestle Coach Gonda', icon: '💪', desc: 'You lose. Gloriously.', stat: { stat: 'dmg', n: 1 } },
      { id: 'feast', label: 'Share a giant okonomiyaki with your partner', icon: '🥞', desc: 'Two spatulas, one dream.', stat: { stat: 'hp', n: 1 }, friend: 8 },
      { id: 'chopsticks', label: "Dodge Mika's flying chopsticks", icon: '🥢', desc: 'Reflex training, Osaka style.', stat: { stat: 'spd', n: 1 } },
      { id: 'band', label: 'Listen to the street band outside', icon: '🎸', desc: 'A Rolling Stones cover. Your partner sways.', stat: { stat: 'def', n: 1 }, friend: 3 },
    ],
  },
  lunch: {
    title: 'Umeda Food Hall', subtitle: 'Lunch break! Refuel before the afternoon.', art: 'lunch',
    options: [
      { id: 'kushikatsu', label: 'Kushikatsu set', icon: '🍢', desc: 'Crunchy power.', stat: { stat: 'dmg', n: 1 }, food: 'kushikatsu' },
      { id: 'udon', label: 'Curry udon', icon: '🍛', desc: 'Warm and hearty.', stat: { stat: 'hp', n: 1 }, food: 'ramen' },
      { id: 'omurice', label: 'Omurice', icon: '🍳', desc: 'Fluffy shield of egg.', stat: { stat: 'def', n: 1 }, food: 'okonomiyaki' },
      { id: 'sushi', label: 'Conveyor sushi', icon: '🍣', desc: 'Precision eating.', stat: { stat: 'elm', n: 1 }, food: 'takoyaki' },
      { id: 'crepe', label: 'Strawberry crepe', icon: '🥞', desc: 'Sugar rush!', stat: { stat: 'spd', n: 1 }, food: 'ice_cream' },
    ],
  },
};

export const RANDOM_EVENTS = [
  { id: 'busker', when: ['afternoon', 'evening'], weight: 3, title: 'Street Busker', text: 'A busker with an acoustic guitar is playing "Here Comes the Sun". Your partner starts dancing.',
    options: [{ label: 'Dance along', icon: '🕺', friend: 6, stat: { stat: 'spd', n: 1 } }, { label: 'Toss ¥500 in the case', icon: '💴', money: -500, friend: 2, items: { ramune: 1 } }, { label: 'Keep walking', icon: '🚶' }] },
  { id: 'takoyaki_fire', when: ['afternoon', 'evening'], weight: 2, title: 'Grill Flare-Up!', text: 'A takoyaki grill bursts into flames! The vendor panics.',
    options: [{ label: 'Have your partner help', icon: '💦', friend: 4, items: { takoyaki: 2 }, stat: { stat: 'elm', n: 1 } }, { label: 'Grab the extinguisher', icon: '🧯', money: 800 }] },
  { id: 'lost_cabbunny', when: ['morning', 'afternoon'], weight: 2, title: 'Lost Cabbunny', text: 'A little girl lost her Cabbunny in the crowd. It is hiding behind a vending machine, nibbling a leaf.',
    options: [{ label: 'Coax it out gently', icon: '🥬', friend: 3, money: 1000 }, { label: 'Let your partner sniff it out', icon: '👃', friend: 5, stat: { stat: 'def', n: 1 } }] },
  { id: 'metallica_graffiti', when: ['evening', 'night'], weight: 2, title: 'Spray Paint Punks', text: 'Two Team Metallica grunts are spraying "METALLICA RULEZ" over a shrine wall.',
    options: [{ label: 'Challenge them!', icon: '⚔️', battle: 'grunts', stat: { stat: 'dmg', n: 1 } }, { label: 'Report them to the police drone', icon: '🚨', money: 500 }] },
  { id: 'rain', when: ['morning'], weight: 1, title: 'Sudden Rain', text: 'A warm summer shower rolls over Osaka. Hydro Elemon are in a great mood.',
    options: [{ label: 'Play in the puddles', icon: '☔', friend: 5, stat: { stat: 'hp', n: 1 } }, { label: 'Wait it out at a café', icon: '☕', items: { matcha: 1 }, money: -400 }] },
  { id: 'food_festival', when: ['lunch', 'evening'], weight: 1, title: 'Kuidaore Festival', text: '"Eat till you drop!" — a street food festival with free samples.',
    options: [{ label: 'Eat everything', icon: '🍡', friend: 6, items: { kushikatsu: 2 }, stat: { stat: 'hp', n: 1 } }, { label: 'Enter the speed-eating contest', icon: '⏱️', money: 2000, stat: { stat: 'spd', n: 1 } }] },
  { id: 'sparring_kid', when: ['afternoon'], weight: 2, title: 'Spar Challenge', text: 'A cocky kid with a Zapanda wants a quick spar.',
    options: [{ label: 'Accept!', icon: '⚔️', battle: 'kid_spar' }, { label: 'Give tips instead', icon: '💡', friend: 2, stat: { stat: 'elm', n: 1 } }] },
];
