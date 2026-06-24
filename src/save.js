// Meta progression persistence: DNA (score), quest flags → species unlocks,
// tutorials seen, lifetime stats. localStorage, guarded for private mode.

const KEY = 'wiststba.save.v2';

const DEFAULT = {
  dna: 0,
  genes: 0, exp: 0, level: 1,   // Spore-style evolution meta
  evolution: {},                // (legacy) speciesId -> flat upgrades
  skills: {},                   // speciesId -> array of unlocked skill-tree node ids
  unlocked: ['rabbit'],         // rabbit is free; the rest are quest-locked
  runs: 0,
  bestScore: 0,
  totalOffspring: 0,
  totalMeals: 0,
  deaths: {},                   // cause -> count
  flags: {                      // quest progress, accumulated across runs
    reproduced: {},             // speciesId -> true
    adult: {},                  // speciesId -> reached adult
    elderAny: false,
    meals15: false,
    builtNest: false,
  },
  tutorialsSeen: {},            // hintId -> true
  seenIntro: false,
};

function deepDefault(data) {
  const out = { ...DEFAULT, ...data };
  out.unlocked = Array.isArray(data.unlocked) && data.unlocked.length ? [...new Set(data.unlocked)] : ['rabbit'];
  out.flags = { ...DEFAULT.flags, ...(data.flags || {}) };
  out.flags.reproduced = { ...(data.flags && data.flags.reproduced || {}) };
  out.flags.adult = { ...(data.flags && data.flags.adult || {}) };
  out.tutorialsSeen = { ...(data.tutorialsSeen || {}) };
  out.deaths = { ...(data.deaths || {}) };
  out.evolution = { ...(data.evolution || {}) };
  out.skills = { ...(data.skills || {}) };
  out.level = data.level || 1;
  return out;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return deepDefault({});
    return deepDefault(JSON.parse(raw));
  } catch (e) { return deepDefault({}); }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

export function resetSave() { try { localStorage.removeItem(KEY); } catch (e) {} return deepDefault({}); }
