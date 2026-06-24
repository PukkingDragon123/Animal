// Evolution economy: each run earns GENES (spent in the skill tree, see
// skills.js) and EXP (levels up the gene pool, granting bonus genes).

// per-run rewards from the finished run state
export function runRewards(s) {
  const sc = s.score || 0;
  const genes = s.meals * 1 + s.offspring * 10 + s.maxStageIndex * 4 + (s.reproduced ? 12 : 0) + (s.nestBuilt ? 4 : 0) + sc / 60;
  const exp = s.meals * 2 + s.offspring * 16 + s.maxStageIndex * 6 + (s.reproduced ? 22 : 0) + sc / 30;
  return { genes: Math.max(1, Math.floor(genes)), exp: Math.max(1, Math.floor(exp)) };
}

export function expForLevel(level) { return 80 + (level - 1) * 60; }   // exp for level → level+1

// adds exp, levels up (each level grants bonus genes); returns levels gained
export function addExp(save, exp) {
  save.exp = (save.exp || 0) + exp;
  let gained = 0;
  while (save.exp >= expForLevel(save.level || 1)) {
    save.exp -= expForLevel(save.level || 1);
    save.level = (save.level || 1) + 1;
    save.genes = (save.genes || 0) + 15;
    gained++;
    if (gained > 50) break;
  }
  return gained;
}
