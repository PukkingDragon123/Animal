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
    // five-species lives
    forageOut: 'Find a flower and gather nectar',
    forageHome: 'Carry the nectar home to your hive',
    forageDone: 'The colony is fed — keep working till the end',
    mayflyGrow: 'Grow up — you have only minutes',
    mayflyMate: 'Find the swarm and a mate — FAST!',
    mayflyDone: 'Your purpose is fulfilled. Rest now.',
    findFemale: 'Follow her faint glow through the dark',
    fused: 'Fused to her, forever. This is… success.',
    spent: 'Your life’s one great act is done.',
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
    continueHeir: 'CONTINUE AS YOUR YOUNG',
    dynasty: 'Dynasty score',
    generation: 'Generation',
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
    killed: ['Predator down. Today, YOU are the apex.', 'It started this. You finished it.', 'One fewer thing trying to eat you.'],
    den: ['Underground and out of sight. Cozy.', 'Let them search. You are not home.'],
    mud: ['Caked in mud — you basically smell like dirt now.', 'Scent masked. Sneaky little thing.'],
    ambush: ['AMBUSH! Where did THAT come from?!', 'Surprise! Everything still wants you dead.'],
    gift: ['A gift offered. Romance, animal-style.', 'Nothing wins hearts like a free snack.'],
    dynasty: ['The bloodline continues. No pressure.', 'You ARE your descendants now. Keep it going!'],
    // five-species flavour
    swarm: ['The swarm! Somewhere in here is the one.', 'Mate now — there is no “later” for a mayfly.'],
    delivery: ['Nectar delivered. The hive hums its approval.', 'Another load home. The colony grows.'],
    forage: ['So many flowers, so little lifespan.'],
    fused: ['You are now… part of her. Forever. Congrats?'],
    spent: ['That was everything you had. Worth it.'],
    dark: ['It is very, very dark down here.', 'Your lure is the only light for miles.'],
    goalDone: ['Life goal complete!'],
    digout: ['Out of the nest! Now… RUN for the sea.', 'You claw to the surface. Daylight. Danger.'],
    leapWin: ['Clean leap! The rapid is behind you.', 'Up and over — the gravel beds are closer now.'],
    leapFail: ['Smacked the rocks — swept back downstream.', 'Missed the leap. The current wins this round.'],
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
    burrow: 'Tap ⚔ at a burrow to dive in — a safe den that heals you. Move to pop out.',
    twigs: 'Collect twigs, then reach the nest spot to build it.',
    hive: 'Careful — beehives sting anyone who is not a bee!',
    cold: 'Stand in the warm glow so you do not freeze.',
    mud: 'Wallow in a mud puddle to mask your scent — predators lose your trail.',
    mate: 'Tap ⚔ near a mate to offer a gift and win them over before reproducing.',
    forage: 'Sip nectar at flowers, then fly back to your hive to deliver it.',
    female: 'You can only see by your lure. Wander the dark to find her faint glow.',
    clock: 'You have no mouth — you cannot eat. Race the life bar to find a mate!',
    upstreamTip: 'Swim against the current — push upstream toward the spawning gravel.',
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
  spent: 'Spent everything on one last act of creation — the truest animal death.',
  fused: 'Found her in the dark and became part of her, forever. Mission accomplished, technically.',
  crab: 'Pulled under by a ghost crab on the sand. So close to the waves.',
  snapped: 'Snapped out of the air by a hungry fish. The river always wins.',
  wasp: 'Stung to pieces defending the patch. Bees have enemies too.',
};

// the "family moment" shown when you reproduce — the realistic circle of life
export const FAMILY = {
  turtle: 'You haul ashore and bury a clutch of eggs in the warm sand. Most will never make it — but some might.',
  mayfly: 'In a frenzied dusk swarm you mate on the wing. Your eggs scatter on the river. Your one purpose: complete.',
  bee: 'Your deliveries become honey and brood. The colony will outlive you — that was always the point.',
  salmon: 'You sweep out a gravel nest and release the next generation over it, then drift, spent, into the shallows.',
  angler: 'You bite down and never let go. Your body fuses to hers — you will father her young for the rest of her life.',
};
