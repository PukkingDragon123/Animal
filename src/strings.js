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
  diet: 'Eats',

  // controls
  attack: 'ATTACK',

  // character select
  statSpeed: 'Speed', statSize: 'Size', statLife: 'Longevity',
  questToUnlock: 'QUEST TO UNLOCK',
  twigsLabel: 'Twigs',
  abilityLabel: 'Ability', rarityLabel: 'Rarity',

  // evolution lab
  evolve: 'EVOLVE', evoTitle: 'EVOLUTION LAB',
  genes: 'Genes', exp: 'EXP', levelLabel: 'Lvl', maxed: 'MAX',
  evoBlurb: 'Spend genes to permanently mutate this species.',

  // life stages
  stage: { baby: 'Baby', juvenile: 'Juvenile', adult: 'Adult', elder: 'Elder' },

  // objectives by struggle / phase
  obj: {
    grow: 'Grow up — eat and survive',
    findFood: 'Find food before you starve',
    reproduce: 'Find a mate and pass on your genes!',
    reproduceNest: 'Reach the nest to reproduce!',
    gatherTwigs: 'Gather twigs to build your nest',
    buildNest: 'Twigs ready! Reach the nest spot to build it',
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
    genesEarned: 'Genes', expEarned: 'EXP',
    livedFor: 'Lived for',
    ate: 'Meals eaten',
    babies: 'Offspring',
    levelUp: 'LEVEL UP!',
    again: 'LIVE AGAIN',
    evolve: 'EVOLVE',
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
    fruit: ['Free fruit! Nature does occasionally tip.'],
    mushroom: ['Zoomies! That mushroom was… interesting.'],
    sting: ['BEES. Bad idea. Very bad idea.'],
    burrow: ['Safe. Cramped, but safe.'],
    twig: ['A twig! Only a few more for the nest.'],
    nestBuilt: ['Nest built. Now make it worthwhile.'],
  },

  // one-time contextual tutorial hints (💡)
  tutorials: {
    move: 'Drag the LEFT side of the screen to move (or WASD).',
    attack: 'Tap ⚔ to attack — bonk predators or snatch prey (Space / J).',
    eat: 'Walk into your glowing food to eat it.',
    sprint: 'Danger nearby! Hold RUN to sprint away.',
    grow: 'You grew up! Follow the glowing beacon to reproduce.',
    fruitTree: 'Bump a fruit tree to shake down a snack.',
    mushroom: 'Munch a mushroom for a quick speed buzz.',
    burrow: 'Dive into a burrow to hide from predators.',
    twigs: 'Collect twigs, then reach the nest spot to build it.',
    hive: 'Careful — beehives sting anyone who is not a bee!',
    cold: 'Stand in the warm glow so you do not freeze.',
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
