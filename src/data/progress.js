// Tokonmon progression: skills and passives are gained mostly through battles,
// exploring, activities, side quests and EATING (docs/TOKONMON.md §7).
//
//   how (unlock condition) — one of, or combined with { all: [...] } / { any: [...] }:
//     { start: true }                         known from the start
//     { level: n }                            reach a level
//     { eat: { tag: 'spicy', n } }            eat n dishes with a taste tag   · { eat: { food: id, n } }
//     { battle: { ev, n } }                   battle events (see BATTLE_EVENTS; also usable in evolve conds)
//     { uses: { skill, n } }                  use a skill n times
//     { explore: mapId }                      visit a place together          · { explore: { map, hour: [a, b] } }
//     { activity: { id, n } }                 dojo, onsen, arcade, karaoke, listen, hangout, train_<stat>
//     { quest: questId }                      finish a quest (with it in the party)
//     { friendship: n }                       friendship level
//     { stat: { dmg: n } }                    allocated stat points (the radar stat chart)
//     { disc: true }                          only from a vinyl disc
//   mon.prog = { ev: {}, eat: { tags: {}, foods: {} }, uses: {}, visits: {}, acts: {}, quests: [], got: [] }
//   Skill levels rise ONLY by using the skill: mon.skillXp[id] → level 1–5 (SKILL_XP thresholds).
import { SPECIES } from './species.js';
import { SKILLS } from './skills.js';
import { FOODS } from './foods.js';

export const BATTLE_EVENTS = {
  burned: 'Got burned', crit: 'Critical hits', drowned: 'Nearly drowned', drown_foe: 'Foes soaked until they nearly drowned',
  perfect_dodge: 'Perfect dodges', perfect_parry: 'Perfect parries', ko: 'Knockouts', bond_ko: 'Knockouts while bonded',
  on_beat: 'On-beat hits', switch_in: 'Times switched back in', comeback: 'Comeback punches', emote: 'Emotes in battle',
  reaction: 'Elemental reactions', steam: 'Steam explosions', heal: 'HP healed', hit_taken: 'Hits taken', shield_block: 'Damage absorbed by shields',
  stun: 'Foes stunned', bond_secs: 'Seconds bonded', ult: 'Ultimates used', win: 'Battles won', win_bonded: 'Wins while bonded',
  low_hp_win: 'Wins from below 40% HP', flawless: 'Wins above 70% HP', stadium_win: 'Stadium wins',
  // evolution events (sim: faint() / buff shield / heal effects)
  ko_bonded: 'Fainted while bonded', burn_faint_bonded: 'Fainted from a burn while bonded', shield_ally: 'Teammates shielded', heal_move: 'Healing moves used',
};

// ---------------------------------------------------------------- skill levels
export const SKILL_XP = [0, 6, 18, 40, 80];
export const MAX_SKILL_LV = SKILL_XP.length;
export function skillLevelOf(mon, id) {
  const xp = (mon.skillXp && mon.skillXp[id]) || 0;
  let lv = 1;
  for (let i = 1; i < SKILL_XP.length; i++) if (xp >= SKILL_XP[i]) lv = i + 1;
  return lv;
}
export function skillXpInfo(mon, id) {
  const lv = skillLevelOf(mon, id), xp = (mon.skillXp && mon.skillXp[id]) || 0;
  return { lv, xp, next: lv < MAX_SKILL_LV ? SKILL_XP[lv] : null, max: lv >= MAX_SKILL_LV };
}
// returns [{ id, from, to }] for skills that levelled up
export function addSkillXp(mon, uses = {}, hits = {}) {
  mon.skillXp = mon.skillXp || {};
  const ups = [];
  for (const [id, n] of Object.entries(uses)) {
    if (!SKILLS[id]) continue;
    const from = skillLevelOf(mon, id);
    mon.skillXp[id] = (mon.skillXp[id] || 0) + n + Math.min(n, hits[id] || 0);
    const to = skillLevelOf(mon, id);
    if (to > from) ups.push({ id, from, to });
  }
  return ups;
}
export const skillLevels = (mon) => Object.fromEntries(Object.keys(mon.skillXp || {}).map((id) => [id, skillLevelOf(mon, id)]));

// ---------------------------------------------------------------- the radar stat chart
// Allocating level-up points into a stat crosses marks; each mark grants a passive.
export const STAT_MARKS = {
  dmg: [[5, 'power_up'], [15, 'heavy_hitter'], [30, 'last_stand']],
  elm: [[5, 'attuned'], [15, 'deep_energy'], [30, 'overflow']],
  def: [[5, 'sturdy'], [15, 'thick_skin'], [30, 'iron_wall']],
  spd: [[5, 'light_feet'], [15, 'sharp_eye'], [30, 'afterimage']],
  hp: [[5, 'hearty'], [15, 'second_wind'], [30, 'big_heart']],
};
export function statMarks(mon) {
  const sp = SPECIES[mon.species];
  const marks = Object.assign({}, STAT_MARKS, (sp && sp.marks) || {});
  const out = [];
  for (const [stat, list] of Object.entries(marks)) for (const [at, id] of list) out.push({ stat, at, id, got: (mon.alloc[stat] || 0) >= at });
  return out;
}

// ---------------------------------------------------------------- counters
export function ensureProg(mon) {
  if (!mon.prog) mon.prog = {};
  const p = mon.prog;
  p.ev = p.ev || {}; p.eat = p.eat || { tags: {}, foods: {} }; p.eat.tags = p.eat.tags || {}; p.eat.foods = p.eat.foods || {};
  p.uses = p.uses || {}; p.visits = p.visits || {}; p.acts = p.acts || {}; p.quests = p.quests || []; p.got = p.got || [];
  return p;
}

// ---------------------------------------------------------------- conditions
export function condOk(mon, how, ctx = {}) {
  if (!how) return false;
  const p = ensureProg(mon);
  if (how.all) return how.all.every((h) => condOk(mon, h, ctx));
  if (how.any) return how.any.some((h) => condOk(mon, h, ctx));
  if (how.start) return true;
  if (how.disc) return false;
  if (how.level != null) return mon.level >= how.level;
  if (how.friendship != null) return (mon.friendship || 0) >= how.friendship;
  if (how.eat) { const e = how.eat, n = e.n || 1; return e.food ? (p.eat.foods[e.food] || 0) >= n : (p.eat.tags[e.tag] || 0) >= n; }
  if (how.battle) return (p.ev[how.battle.ev] || 0) >= (how.battle.n || 1);
  if (how.uses) return (p.uses[how.uses.skill] || 0) >= (how.uses.n || 1);
  if (how.explore) { const m = typeof how.explore === 'string' ? how.explore : how.explore.map; return !!p.visits[m]; }
  if (how.activity) return (p.acts[how.activity.id] || 0) >= (how.activity.n || 1);
  if (how.quest) return p.quests.includes(how.quest);
  if (how.stat) return Object.entries(how.stat).every(([k, v]) => (mon.alloc[k] || 0) >= v);
  return false;
}
// { cur, need, label } for the phone's skill tree (hint text comes from the species data)
export function condProgress(mon, how) {
  const p = ensureProg(mon);
  if (!how) return { cur: 0, need: 1, label: '?' };
  if (how.all || how.any) { const parts = (how.all || how.any).map((h) => condProgress(mon, h)); return { cur: parts.filter((x) => x.cur >= x.need).length, need: how.all ? parts.length : 1, label: parts.map((x) => x.label).join(how.all ? ' + ' : ' or ') }; }
  if (how.level != null) return { cur: mon.level, need: how.level, label: `Lv.${how.level}` };
  if (how.friendship != null) return { cur: mon.friendship || 0, need: how.friendship, label: 'Friendship' };
  if (how.eat) { const e = how.eat, n = e.n || 1; return e.food ? { cur: p.eat.foods[e.food] || 0, need: n, label: `Eat ${FOODS[e.food] ? FOODS[e.food].name : e.food}` } : { cur: p.eat.tags[e.tag] || 0, need: n, label: `Eat ${e.tag} food` }; }
  if (how.battle) return { cur: Math.floor(p.ev[how.battle.ev] || 0), need: how.battle.n || 1, label: BATTLE_EVENTS[how.battle.ev] || how.battle.ev };
  if (how.uses) return { cur: p.uses[how.uses.skill] || 0, need: how.uses.n || 1, label: `Use ${SKILLS[how.uses.skill] ? SKILLS[how.uses.skill].name : how.uses.skill}` };
  if (how.explore) { const m = typeof how.explore === 'string' ? how.explore : how.explore.map; return { cur: p.visits[m] ? 1 : 0, need: 1, label: `Visit ${m}` }; }
  if (how.activity) return { cur: p.acts[how.activity.id] || 0, need: how.activity.n || 1, label: how.activity.id };
  if (how.quest) return { cur: p.quests.includes(how.quest) ? 1 : 0, need: 1, label: 'Quest' };
  if (how.stat) { const [k, v] = Object.entries(how.stat)[0]; return { cur: mon.alloc[k] || 0, need: v, label: k.toUpperCase() }; }
  if (how.disc) return { cur: 0, need: 1, label: 'Vinyl disc' };
  return { cur: 0, need: 1, label: '?' };
}

// Every unlock entry for a mon (its species, plus earlier forms of its line it can still learn).
export function unlocksFor(mon) {
  const sp = SPECIES[mon.species];
  return sp ? sp.unlocks || [] : [];
}
const knows = (mon, u) => (u.kind === 'ult' ? mon.skills.ult === u.id || mon.skills.known.includes(u.id) : mon.skills.known.includes(u.id));

// Learn one unlock (moves are learned one by one; they slot in if there's room).
export function grant(mon, u, slots = { active: 4, ult: 1, passive: 2 }) {
  if (!SKILLS[u.id] || knows(mon, u)) return false;
  mon.skills.known.push(u.id);
  if (u.kind === 'move' && mon.skills.active.length < slots.active) mon.skills.active.push(u.id);
  if (u.kind === 'passive' && mon.skills.passives.length < slots.passive) mon.skills.passives.push(u.id);
  if (u.kind === 'ult' && !mon.skills.ult) mon.skills.ult = u.id;
  ensureProg(mon).got.push(u.id);
  return true;
}
// Check and apply every unlock whose condition is now met → [{ kind, id, name }]
export function checkUnlocks(mon, ctx = {}, slots) {
  const out = [];
  for (const u of unlocksFor(mon)) {
    if (knows(mon, u) || !condOk(mon, u.how, ctx)) continue;
    if (grant(mon, u, slots)) out.push({ kind: u.kind, id: u.id, name: SKILLS[u.id].name });
  }
  for (const m of statMarks(mon)) if (m.got && SKILLS[m.id] && !mon.skills.known.includes(m.id)) {
    mon.skills.known.push(m.id);
    if (mon.skills.passives.length < ((slots && slots.passive) ?? 2)) mon.skills.passives.push(m.id);
    out.push({ kind: 'passive', id: m.id, name: SKILLS[m.id].name, mark: m.stat });
  }
  return out;
}

// ---------------------------------------------------------------- recording
export function bump(mon, ev, n = 1) { const p = ensureProg(mon); p.ev[ev] = (p.ev[ev] || 0) + n; }
export function recordEat(mon, foodId, slots) {
  const f = FOODS[foodId]; if (!f) return [];
  const p = ensureProg(mon);
  p.eat.foods[foodId] = (p.eat.foods[foodId] || 0) + 1;
  for (const t of f.tags) p.eat.tags[t] = (p.eat.tags[t] || 0) + 1;
  return checkUnlocks(mon, {}, slots);
}
export function recordVisit(mon, mapId, slots) { const p = ensureProg(mon); if (p.visits[mapId]) return []; p.visits[mapId] = 1; return checkUnlocks(mon, {}, slots); }
export function recordActivity(mon, id, slots, n = 1) { const p = ensureProg(mon); p.acts[id] = (p.acts[id] || 0) + n; return checkUnlocks(mon, {}, slots); }
export function recordQuest(mon, qid, slots) { const p = ensureProg(mon); if (!p.quests.includes(qid)) p.quests.push(qid); return checkUnlocks(mon, {}, slots); }

// Live battle tracking: feed sim events for the player's side; returns unlocks
// as they happen (the battle scene stamps them on screen and can slot new moves in).
export class BattleTracker {
  constructor(st, side = 0, monsByUid = {}) { this.st = st; this.side = side; this.mons = monsByUid; this.low = {}; this.minHp = {}; }
  monOf(unitId) { const u = this.st.units.find((x) => x.id === unitId); return u && u.side === this.side && this.mons[u.uid] ? { u, mon: this.mons[u.uid] } : null; }
  feed(events, slots) {
    const got = [];
    const add = (unitId, ev, n = 1) => { const r = this.monOf(unitId); if (!r) return; bump(r.mon, ev, n); for (const x of checkUnlocks(r.mon, {}, slots)) got.push(Object.assign({ u: unitId, uid: r.u.uid }, x)); };
    for (const e of events) {
      switch (e.type) {
        case 'status': if (e.s === 'burn') add(e.u, 'burned'); if (e.s === 'stun' && e.src) add(e.src, 'stun'); break;
        case 'hit':
          if (e.crit && e.src) add(e.src, 'crit');
          if (e.tgt) { add(e.tgt, 'hit_taken'); if (e.absorbed) add(e.tgt, 'shield_block', e.absorbed); }
          break;
        case 'drowned': add(e.u, 'drowned'); if (e.src) add(e.src, 'drown_foe'); break;
        case 'perfectDodge': add(e.u, 'perfect_dodge'); break;
        case 'parry': if (e.perfect) add(e.u, 'perfect_parry'); break;
        case 'faint':
          if (e.src) { add(e.src, 'ko'); const s = this.st.units.find((x) => x.id === e.src); if (s && s.bonded) add(e.src, 'bond_ko'); }
          if (e.bonded) { add(e.u, 'ko_bonded'); if (e.burning) add(e.u, 'burn_faint_bonded'); }
          break;
        case 'shield': if (e.src && e.src !== e.u) add(e.src, 'shield_ally'); break;
        case 'healFx': add(e.u, 'heal_move'); break;
        case 'onBeat': add(e.u, 'on_beat'); break;
        case 'switch': if (!e.forced && e.in) { const u = this.st.units.find((x) => x.id === e.in); if (u && u.wasOut) add(e.in, 'switch_in'); } break;
        case 'comebackPunch': add(e.u, 'comeback'); break;
        case 'emote': add(e.u, 'emote'); break;
        case 'reaction': if (e.src) { add(e.src, 'reaction'); if (e.id === 'steam') add(e.src, 'steam'); } break;
        case 'heal': if (e.src) add(e.src, 'heal', e.amt || 0); break;
        case 'ult': add(e.u, 'ult'); break;
        case 'bondTime': add(e.u, 'bond_secs', 10); break;
        default: break;
      }
    }
    // HP extremes for low-HP / flawless wins
    for (const u of this.st.units) if (u.side === this.side && u.onField) { this.minHp[u.uid] = Math.min(this.minHp[u.uid] ?? 1, u.hp / u.maxHp); }
    return got;
  }
  // after the battle: wins, uses → skill XP
  finish(result, opts = {}) {
    const ups = [], got = [];
    if (!result) return { ups, got };
    const won = result.winner === this.side;
    for (const ru of result.units) {
      if (ru.side !== this.side) continue;
      const mon = this.mons[ru.uid]; if (!mon) continue;
      const p = ensureProg(mon);
      for (const [id, n] of Object.entries(ru.k.uses || {})) p.uses[id] = (p.uses[id] || 0) + n;
      for (const x of addSkillXp(mon, ru.k.uses || {}, ru.k.hits || {})) ups.push(Object.assign({ uid: ru.uid }, x));
      if (won && ru.took) {
        bump(mon, 'win');
        if (ru.bondT > 0) bump(mon, 'win_bonded');
        if ((this.minHp[ru.uid] ?? 1) < 0.4 && !ru.fainted) bump(mon, 'low_hp_win');
        if ((this.minHp[ru.uid] ?? 1) >= 0.7) bump(mon, 'flawless');
        if (opts.stadium) bump(mon, 'stadium_win');
      }
      for (const x of checkUnlocks(mon, {}, opts.slots)) got.push(Object.assign({ uid: ru.uid }, x));
    }
    return { ups, got };
  }
}
