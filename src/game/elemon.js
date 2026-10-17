// Elemon instances (party members): stats, levels, EXP, skill loadout,
// friendship, progress counters for evolution conditions.
import { SPECIES } from '../data/species.js';
import { SKILLS } from '../data/skills.js';

export const STAT_KEYS = ['dmg', 'elm', 'def', 'spd', 'hp'];
export const STAT_NAMES = { dmg: 'Damage', elm: 'Element', def: 'Defense', spd: 'Speed', hp: 'Health' };
export const SP_PER_LEVEL = 3;
export const AP_PER_LEVEL = 1;
export const MAX_LEVEL = 60;
export const SPECTRAL_FRIENDSHIP = 240;

let _uid = 1;
export function newUid() { return 'm' + Date.now().toString(36) + (_uid++).toString(36); }

export function expToNext(level) { return Math.round(18 * Math.pow(level, 1.55) + 24); }

export function createElemon(speciesId, opts = {}) {
  const sp = SPECIES[speciesId];
  if (!sp) throw new Error('unknown species ' + speciesId);
  const level = opts.level ?? 5;
  const known = [...sp.start];
  // naturally known learnset moves up to this level
  for (const [lv, id] of sp.learn) if (lv <= level - 2 && !known.includes(id) && opts.wild) known.push(id);
  const mon = {
    uid: opts.uid || newUid(), species: speciesId, nick: opts.nick || null, level, exp: 0,
    alloc: { dmg: 0, elm: 0, def: 0, spd: 0, hp: 0 }, sp: 0, ap: 0,
    skills: { known, active: known.slice(0, 4), ult: null, passives: [] },
    astral: [], hp: 1, friendship: opts.friendship ?? sp.bond ?? 70,
    counters: { wins: 0, battles: 0, precise: 0, healed: 0, blocked: 0, beats: 0, charged: 0, teamCombos: 0, dojo: 0, reactions: 0, foods: [], defeat: {} },
    cosmetic: { eye: null }, ot: opts.ot || null, caught: opts.caught || null, gift: opts.gift || null,
  };
  if (opts.wild) {
    // wild Elemon spread a few points
    const r = opts.rng || Math.random;
    for (let i = 0; i < (level - 1) * 2; i++) mon.alloc[STAT_KEYS[Math.floor(r() * 5)]]++;
  }
  return mon;
}

export function nameOf(mon) { return mon.nick || SPECIES[mon.species].name; }

// Stats with level growth, allocation and Astral stat nodes.
export function statsOf(mon, extra = null) {
  const sp = SPECIES[mon.species];
  const g = 1 + 0.075 * (mon.level - 1);
  const out = {};
  for (const k of STAT_KEYS) out[k] = sp.base[k] * g + (mon.alloc[k] || 0) + ((extra && extra[k]) || 0);
  if (mon.astralStats) for (const k of STAT_KEYS) out[k] += mon.astralStats[k] || 0;
  return out;
}
export function maxHpOf(stats, level) { return Math.round(80 + stats.hp * 16 + level * 5); }
export function maxHp(mon) { return maxHpOf(statsOf(mon), mon.level); }

// Snapshot consumed by the battle sim.
export function battleSnapshot(mon, slots = { active: 4, ult: 1, passive: 2 }) {
  const stats = statsOf(mon);
  const mh = maxHpOf(stats, mon.level);
  const sp = SPECIES[mon.species];
  const act = mon.skills.active.filter((id) => SKILLS[id] && SKILLS[id].kind === 'active').slice(0, slots.active);
  const ult = slots.ult > 0 ? mon.skills.ult : null;
  const passives = mon.skills.passives.filter((id) => SKILLS[id]).slice(0, slots.passive);
  return {
    uid: mon.uid, species: mon.species, name: nameOf(mon), level: mon.level, stats, maxHp: mh,
    hp: Math.max(1, Math.round(mh * (mon.hp ?? 1))), skills: act, ult, passives, friendship: mon.friendship,
    spectral: mon.friendship >= SPECTRAL_FRIENDSHIP, elem: sp.elem, cosmetic: mon.cosmetic,
  };
}

// EXP gain → list of level-up records {level, sp, ap, learnable:[ids]}
export function gainExp(mon, amount) {
  const ups = [];
  if (mon.level >= MAX_LEVEL) return ups;
  mon.exp += Math.max(0, Math.round(amount));
  while (mon.level < MAX_LEVEL && mon.exp >= expToNext(mon.level)) {
    mon.exp -= expToNext(mon.level);
    mon.level++;
    mon.sp += SP_PER_LEVEL; mon.ap += AP_PER_LEVEL;
    const sp = SPECIES[mon.species];
    const learnable = sp.learn.filter(([lv, id]) => lv <= mon.level && !mon.skills.known.includes(id)).map(([, id]) => id);
    ups.push({ level: mon.level, sp: SP_PER_LEVEL, ap: AP_PER_LEVEL, learnable });
  }
  return ups;
}

export function allocate(mon, stat, n = 1) {
  if (!STAT_KEYS.includes(stat) || mon.sp < n) return false;
  mon.sp -= n; mon.alloc[stat] += n;
  return true;
}

export function learn(mon, skillId) {
  if (!SKILLS[skillId] || mon.skills.known.includes(skillId)) return false;
  mon.skills.known.push(skillId);
  const s = SKILLS[skillId];
  if (s.kind === 'ultimate' && !mon.skills.ult) mon.skills.ult = skillId;
  return true;
}

// Equip into the loadout respecting unlocked slot counts.
export function equip(mon, skillId, slots, slotIndex = null) {
  const s = SKILLS[skillId];
  if (!s || !mon.skills.known.includes(skillId)) return false;
  if (s.kind === 'ultimate') { if (slots.ult < 1) return false; mon.skills.ult = skillId; return true; }
  const list = s.kind === 'passive' ? mon.skills.passives : mon.skills.active;
  const cap = s.kind === 'passive' ? slots.passive : slots.active;
  if (cap < 1) return false;
  const cur = list.indexOf(skillId);
  if (cur >= 0) list.splice(cur, 1);
  if (slotIndex != null && slotIndex < cap) { list.splice(slotIndex, 0, skillId); }
  else list.push(skillId);
  while (list.length > cap) list.splice(slotIndex != null && slotIndex < cap ? cap : 0, 1);
  return true;
}
export function unequip(mon, skillId) {
  for (const k of ['active', 'passives']) { const i = mon.skills[k].indexOf(skillId); if (i >= 0) { mon.skills[k].splice(i, 1); return true; } }
  if (mon.skills.ult === skillId) { mon.skills.ult = null; return true; }
  return false;
}

export function addFriendship(mon, n) { mon.friendship = Math.max(0, Math.min(255, mon.friendship + n)); return mon.friendship; }

// Evolution: returns the list of evolutions whose conditions are met now.
// ctx: { location, hour }
export function evolutionOptions(mon, ctx = {}) {
  const sp = SPECIES[mon.species];
  if (!sp.evolve) return [];
  return sp.evolve.filter((e) => condMet(mon, e.cond, ctx));
}
export function condMet(mon, c, ctx = {}) {
  const k = mon.counters;
  if (c.level && mon.level < c.level) return false;
  if (c.wins && k.wins < c.wins) return false;
  if (c.friendship && mon.friendship < c.friendship) return false;
  if (c.precise && k.precise < c.precise) return false;
  if (c.healed && k.healed < c.healed) return false;
  if (c.blocked && k.blocked < c.blocked) return false;
  if (c.beats && k.beats < c.beats) return false;
  if (c.charged && k.charged < c.charged) return false;
  if (c.teamCombos && k.teamCombos < c.teamCombos) return false;
  if (c.dojo && k.dojo < c.dojo) return false;
  if (c.foods && (k.foods || []).length < c.foods) return false;
  if (c.location && ctx.location !== c.location) return false;
  if (c.hours && !(ctx.hour >= c.hours[0] && ctx.hour < c.hours[1])) return false;
  if (c.defeat) for (const [sid, n] of Object.entries(c.defeat)) if ((k.defeat[sid] || 0) < n) return false;
  return true;
}
// Progress breakdown for UI: [{label, cur, need, ok}]
export function condProgress(mon, c, ctx = {}) {
  const k = mon.counters, out = [];
  const add = (label, cur, need) => out.push({ label, cur, need, ok: cur >= need });
  if (c.level) add('Level', mon.level, c.level);
  if (c.wins) add('Battles won', k.wins, c.wins);
  if (c.friendship) add('Friendship', mon.friendship, c.friendship);
  if (c.precise) add('Precision crits', k.precise, c.precise);
  if (c.healed) add('HP healed', k.healed, c.healed);
  if (c.blocked) add('Attacks blocked', k.blocked, c.blocked);
  if (c.beats) add('On-beat hits', k.beats, c.beats);
  if (c.charged) add('Charged attacks', k.charged, c.charged);
  if (c.teamCombos) add('Team combos', k.teamCombos, c.teamCombos);
  if (c.dojo) add('Dojo meditations', k.dojo, c.dojo);
  if (c.foods) add('Different foods eaten', (k.foods || []).length, c.foods);
  if (c.defeat) for (const [sid, n] of Object.entries(c.defeat)) add(`Defeat ${SPECIES[sid] ? SPECIES[sid].name : sid}`, k.defeat[sid] || 0, n);
  if (c.location) out.push({ label: `Be at ${c.location}`, ok: ctx.location === c.location });
  if (c.hours) out.push({ label: `Between ${c.hours[0]}:00–${c.hours[1]}:00`, ok: ctx.hour >= c.hours[0] && ctx.hour < c.hours[1] });
  return out;
}

export function evolve(mon, to) {
  const from = mon.species;
  mon.species = to;
  const sp = SPECIES[to];
  for (const id of sp.start) if (!mon.skills.known.includes(id)) mon.skills.known.push(id);
  mon.hp = 1;
  return { from, to };
}
