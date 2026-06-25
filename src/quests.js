// Species are unlocked by completing quests (not just DNA). Each quest is a
// condition over accumulated save flags; finishing a run records flags, then we
// check which species just unlocked. This chains the roster into a progression.
import { SPECIES_LIST } from './species.js';

// stage indices: baby 0, juvenile 1, adult 2, elder 3
export const QUESTS = {
  mayfly: { text: 'Reach the sea as a Sea Turtle Hatchling', check: (s) => !!s.flags.reachedSea },
  bee:    { text: 'Mate as a Mayfly',                        check: (s) => !!s.flags.reproduced.mayfly },
  salmon: { text: 'Help the colony as a Worker Honey Bee',   check: (s) => !!s.flags.reproduced.bee },
  angler: { text: 'Spawn upstream as a Pacific Salmon',      check: (s) => !!s.flags.reproduced.salmon },
};

// record one finished run into the save's quest flags
export function recordRun(save, r) {
  save.flags.reproduced = save.flags.reproduced || {};
  save.flags.adult = save.flags.adult || {};
  if (r.reproduced) save.flags.reproduced[r.speciesId] = true;
  if (r.maxStageIndex >= 2) save.flags.adult[r.speciesId] = true;
  if (r.maxStageIndex >= 3) save.flags.elderAny = true;
  if (r.meals >= 15) save.flags.meals15 = true;
  if (r.reachedSea) save.flags.reachedSea = true;
  if (r.builtNest) save.flags.builtNest = true;
}

// returns ids newly unlocked this check (and adds them to save.unlocked)
export function checkUnlocks(save) {
  const newly = [];
  for (const id of SPECIES_LIST) {
    if (save.unlocked.includes(id)) continue;
    const q = QUESTS[id];
    if (q && q.check(save)) { save.unlocked.push(id); newly.push(id); }
  }
  return newly;
}

export function questFor(id) { return QUESTS[id]; }
