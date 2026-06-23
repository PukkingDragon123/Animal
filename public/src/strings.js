// All player-visible text. Switching language = swapping this data, not code.
export const STR = {
  title: 'WHY IT SUCKS TO BE A…',
  tagline: 'Live a whole animal life. It will not go well.',
  tapToLive: 'BE BORN',
  chooseSpecies: 'CHOOSE YOUR DOOM',
  dna: 'DNA',
  locked: 'LOCKED',
  unlock: 'UNLOCK',
  back: 'BACK',
  play: 'PLAY',
  sprint: 'RUN',
  resume: 'RESUME',
  restart: 'AGAIN',
  menu: 'MENU',

  // HUD need labels
  hunger: 'Food',
  energy: 'Energy',
  life: 'Life',
  warmth: 'Warmth',

  // life stages
  stage: { baby: 'Baby', juvenile: 'Juvenile', adult: 'Adult', elder: 'Elder' },

  // objectives by struggle / phase
  obj: {
    grow: 'Grow up — eat and survive',
    findFood: 'Find food before you starve',
    reproduce: 'Find a mate and pass on your genes!',
    reproduceNest: 'Reach the nest to reproduce!',
    survive: 'Just… keep living',
    hatchling_reachWater: 'Reach the ocean! Run, tiny one, run!',
    upstream: 'Swim UPSTREAM to your spawning ground!',
    cold: 'Stay near warmth — do not freeze!',
    hunt: 'Catch prey before you starve!',
    keepMoving: 'Keep swimming or you suffocate!',
    elder: 'You are old. Make it count.',
  },

  birth: {
    youAre: 'You are',
    aMut: 'Your quirks:',
    noMut: 'Perfectly average. Boring. Good luck.',
    begin: 'BEGIN LIFE',
  },

  death: {
    title: 'YOU DIED',
    successTitle: 'A LIFE WELL LIVED',
    dnaEarned: 'DNA earned',
    livedFor: 'Lived for',
    ate: 'Meals eaten',
    babies: 'Offspring',
    again: 'LIVE AGAIN',
    menu: 'MENU',
  },

  // funny documentary quips shown during play / on events
  quips: {
    born: ['A new life begins. Statistically, briefly.', 'Welcome to the food chain. You are near the bottom.'],
    ateFirst: ['Delicious. Only 9,000 more to go.'],
    grewUp: ['Adulthood! Now everything wants to eat you AND you must find a date.'],
    chased: ['RUN.', 'This is the cardio you never trained for.', 'Nature is just running, mostly.'],
    reproduced: ['Genes: passed on. The species thanks you.', 'Congratulations, your DNA escapes oblivion!'],
    elder: ['You are ancient now. A wise, crunchy snack.'],
  },

  // controls hint (first run)
  hint: 'Drag the left side to move • hold RUN to sprint',
  hintKeys: 'WASD / arrows to move • Shift to run',

  pausedTitle: 'PAUSED',
};

// death cause -> epitaph line(s)
export const EPITAPH = {
  oldAge: 'Died peacefully of old age. A rare achievement.',
  predator: 'Was eaten. Classic.',
  starved: 'Forgot to eat. We all do.',
  cold: 'Froze solid. The arctic does not care.',
  drowned: 'Stopped swimming. The ocean noticed.',
  current: 'Swept away by the current. So close.',
  gull: 'Snatched by a seagull on the beach. Brutal.',
};
