// Meta progression persistence (DNA + unlocks + stats). localStorage, guarded.

const KEY = 'wiststba.save.v1';

const DEFAULT = {
  dna: 0,
  unlocked: ['rabbit'],     // rabbit is free
  runs: 0,
  bestScore: 0,
  totalOffspring: 0,
  deaths: {},               // cause -> count (for the funny stats)
  seenIntro: false,
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const data = JSON.parse(raw);
    return { ...DEFAULT, ...data, unlocked: data.unlocked || ['rabbit'] };
  } catch (e) {
    return { ...DEFAULT };
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) { /* private mode / quota — ignore, run still works */ }
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  return { ...DEFAULT };
}
