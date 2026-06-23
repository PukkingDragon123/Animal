// Roguelike mutations. Each run rolls a mix → a different build every time.
// `mods` are aggregated into the player's derived stats by applyMutations().

export const MUTATIONS = {
  // ---- positive ----
  fast:     { id: 'fast',     name: 'Fast',          good: true,  desc: 'You move 25% quicker.',         mods: { speed: 1.25 } },
  strong:   { id: 'strong',   name: 'Strong',        good: true,  desc: 'Hits hurt you half as much.',    mods: { dmg: 0.5 } },
  longlife: { id: 'longlife', name: 'Long Life',     good: true,  desc: 'Your life clock runs slow.',     mods: { life: 1.5 } },
  fertile:  { id: 'fertile',  name: 'Fertile',       good: true,  desc: 'Reproduce faster. Maybe twins.', mods: { fertile: 1 } },
  keen:     { id: 'keen',     name: 'Keen Senses',   good: true,  desc: 'You sniff out food from afar.',  mods: { eat: 1.6 } },
  tough:    { id: 'tough',    name: 'Tough',         good: true,  desc: 'Survive one extra hit.',         mods: { hits: 1 } },

  // ---- negative ----
  small:    { id: 'small',    name: 'Small',         good: false, desc: 'Tiny. Easy to miss… and catch.', mods: { size: 0.7, speed: 0.92 } },
  weak:     { id: 'weak',     name: 'Weak',          good: false, desc: 'You are slow.',                  mods: { speed: 0.78 } },
  shortlife:{ id: 'shortlife',name: 'Short Life',    good: false, desc: 'Your life clock runs fast.',     mods: { life: 0.6 } },
  clumsy:   { id: 'clumsy',   name: 'Clumsy',        good: false, desc: 'Your steps wobble.',             mods: { clumsy: 1 } },
  hungry:   { id: 'hungry',   name: 'Always Hungry', good: false, desc: 'You burn through food fast.',    mods: { hunger: 1.5 } },
  frail:    { id: 'frail',    name: 'Frail',         good: false, desc: 'One hit and it is over.',        mods: { frail: 1 } },
};

const POS = Object.values(MUTATIONS).filter(m => m.good).map(m => m.id);
const NEG = Object.values(MUTATIONS).filter(m => !m.good).map(m => m.id);

// Seeded roll. Most runs get one good + one bad (a build with a twist).
export function rollMutations(rng) {
  const r = rng.next();
  let ids = [];
  if (r < 0.58) {                      // one good + one bad
    ids = [rng.pick(POS), rng.pick(NEG)];
  } else if (r < 0.80) {               // two random
    const all = POS.concat(NEG);
    const a = rng.pick(all);
    let b = rng.pick(all);
    if (b === a) b = rng.pick(all);
    ids = a === b ? [a] : [a, b];
  } else if (r < 0.93) {               // single quirk
    ids = [rng.pick(POS.concat(NEG))];
  } else {                             // rare: two good (lucky) or none
    ids = rng.chance(0.5) ? [rng.pick(POS), rng.pick(POS)] : [];
  }
  // de-dup
  ids = [...new Set(ids)];
  return ids;
}

export function applyMutations(ids) {
  const m = {
    speed: 1, size: 1, life: 1, hunger: 1, eat: 1, dmg: 1,
    extraHits: 0, fertile: false, clumsy: false, frail: false,
  };
  for (const id of ids) {
    const mod = MUTATIONS[id]?.mods;
    if (!mod) continue;
    if (mod.speed) m.speed *= mod.speed;
    if (mod.size) m.size *= mod.size;
    if (mod.life) m.life *= mod.life;
    if (mod.hunger) m.hunger *= mod.hunger;
    if (mod.eat) m.eat *= mod.eat;
    if (mod.dmg) m.dmg *= mod.dmg;
    if (mod.hits) m.extraHits += mod.hits;
    if (mod.fertile) m.fertile = true;
    if (mod.clumsy) m.clumsy = true;
    if (mod.frail) m.frail = true;
  }
  return m;
}
