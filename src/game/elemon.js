// Tokonmon instances (party members): stats, levels, EXP, skill loadout,
// friendship, progress counters for evolution conditions, unlock progress
// (mon.prog, src/data/progress.js), skill XP/levels, renamed skills, forms (♂/♀ models),
// drip tier + look seed (cosmetic), gear (equipped stat items, src/data/gear.js).
import { SPECIES } from '../data/species.js';
import { SKILLS } from '../data/skills.js';
import { ensureProg, checkUnlocks, skillLevels, condOk, BATTLE_EVENTS } from '../data/progress.js';
import { GEAR } from '../data/gear.js';

export const STAT_KEYS = ['dmg', 'elm', 'def', 'spd', 'hp'];
export const STAT_NAMES = { dmg: 'Damage', elm: 'Element', def: 'Defense', spd: 'Speed', hp: 'Health' };
export const SP_PER_LEVEL = 3;
export const AP_PER_LEVEL = 1;
export const MAX_LEVEL = 60;
export const SPECTRAL_FRIENDSHIP = 240;

let _uid = 1;
export function newUid() { return 'm' + Date.now().toString(36) + (_uid++).toString(36); }

// Drip: cosmetic appearance tier (number of accessories). Rolled for wild Tokonmon and gifts; starters are normal.
// Accessories come from the look seed and can't be bought.
export const DRIP = { 1: { id: 'normal', tag: '', acc: 1 }, 2: { id: 'dripped', tag: 'DRIP', acc: 2 }, 3: { id: 'ultra', tag: 'ULTRA DRIP', acc: 3 } };
export function rollDrip(r = Math.random) { const x = r(); return x < 0.02 ? 3 : x < 0.15 ? 2 : 1; } // 85% / 13% / 2%
export const dripTag = (mon) => (DRIP[mon.drip] || DRIP[1]).tag;
export const newLook = (r = Math.random) => Math.floor(r() * 0x7fffffff);
// model id for this mon's form (Pidgun ♂ revolver / ♀ rose…)
export function modelOf(mon) { const f = SPECIES[mon.species].forms; return (f && mon.form && f[mon.form] && f[mon.form].model) || mon.species; }

export function expToNext(level) { return Math.round(18 * Math.pow(level, 1.55) + 24); }

export function createElemon(speciesId, opts = {}) {
  const sp = SPECIES[speciesId];
  if (!sp) throw new Error('unknown species ' + speciesId);
  const level = opts.level ?? 5;
  const r = opts.rng || Math.random;
  const known = [...sp.start];
  const forms = sp.forms ? Object.keys(sp.forms) : null;
  const form = opts.form || (forms ? forms[Math.floor(r() * forms.length)] : null);
  // naturally known learnset moves up to this level
  for (const [lv, id] of sp.learn) if (lv <= level - 2 && !known.includes(id) && opts.wild) known.push(id);
  const mon = {
    uid: opts.uid || newUid(), species: speciesId, nick: opts.nick || null, level, exp: 0,
    alloc: { dmg: 0, elm: 0, def: 0, spd: 0, hp: 0 }, sp: 0, ap: 0,
    skills: { known, active: known.slice(0, 4), ult: null, passives: [] },
    astral: [], hp: 1, friendship: opts.friendship ?? sp.bond ?? 70,
    counters: { wins: 0, battles: 0, precise: 0, healed: 0, blocked: 0, beats: 0, charged: 0, teamCombos: 0, dojo: 0, reactions: 0, foods: [], defeat: {} },
    cosmetic: { eye: null }, ot: opts.ot || null, caught: opts.caught || null, gift: opts.gift || null,
    names: {}, skillXp: {}, prog: null, cracks: 0,
    drip: opts.drip || (opts.wild || opts.gift ? rollDrip(r) : 1), look: opts.look ?? newLook(r), gear: [],
  };
  if (form) mon.form = form;
  ensureProg(mon);
  // wild / NPC Tokonmon arrive with what their level would have taught them
  if (opts.wild || opts.npc) checkUnlocksQuiet(mon, level);
  if (opts.wild) {
    // wild Elemon spread a few points
    for (let i = 0; i < (level - 1) * 2; i++) mon.alloc[STAT_KEYS[Math.floor(r() * 5)]]++;
  }
  return mon;
}

function checkUnlocksQuiet(mon, level) {
  const sp = SPECIES[mon.species];
  for (const u of sp.unlocks || []) {
    if (u.kind === 'move' && u.how && u.how.level && u.how.level <= level && !mon.skills.known.includes(u.id)) { mon.skills.known.push(u.id); if (mon.skills.active.length < 4) mon.skills.active.push(u.id); }
  }
  if (level >= 18 && sp.ult && !mon.skills.ult) { mon.skills.ult = sp.ult; mon.skills.known.push(sp.ult); }
  const ps = (sp.passives || []).slice(0, level >= 12 ? 2 : level >= 6 ? 1 : 0);
  for (const id of ps) if (SKILLS[id] && !mon.skills.known.includes(id)) { mon.skills.known.push(id); mon.skills.passives.push(id); }
}

export function nameOf(mon) { return mon.nick || SPECIES[mon.species].name; }
// the player can rename skills and ultimates
export const skillNameOf = (mon, id) => (mon.names && mon.names[id]) || (SKILLS[id] ? SKILLS[id].name : id);
export function renameSkill(mon, id, name) {
  mon.names = mon.names || {};
  const n = String(name || '').trim().slice(0, 24);
  if (!n || n === (SKILLS[id] && SKILLS[id].name)) delete mon.names[id]; else mon.names[id] = n;
  return skillNameOf(mon, id);
}

// Stats with level growth, allocation and Astral stat nodes.
export function statsOf(mon, extra = null) {
  const sp = SPECIES[mon.species];
  const g = 1 + 0.075 * (mon.level - 1);
  const out = {};
  for (const k of STAT_KEYS) out[k] = sp.base[k] * g + (mon.alloc[k] || 0) + ((extra && extra[k]) || 0);
  if (mon.astralStats) for (const k of STAT_KEYS) out[k] += mon.astralStats[k] || 0;
  for (const id of mon.gear || []) { const g = GEAR[id]; if (g && g.stats) for (const [k, v] of Object.entries(g.stats)) out[k] *= 1 + v; } // gear: slight % boosts
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
    skillLv: skillLevels(mon), names: Object.assign({}, mon.names || {}), final: !(sp.evolve && sp.evolve.length), cracks: mon.cracks || 0,
    gear: (mon.gear || []).filter((id) => GEAR[id]), drip: mon.drip || 1, look: mon.look || 0, model: modelOf(mon),
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
    // level-based unlocks are granted one by one by the progress system
    ups.push({ level: mon.level, sp: SP_PER_LEVEL, ap: AP_PER_LEVEL, learnable: [], unlocked: checkUnlocks(mon) });
  }
  return ups;
}

// Spend stat points on the radar stat chart; crossing a mark grants a passive.
export function allocate(mon, stat, n = 1) {
  if (!STAT_KEYS.includes(stat) || mon.sp < n) return false;
  mon.sp -= n; mon.alloc[stat] += n;
  mon.lastUnlocks = checkUnlocks(mon);
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

// Gear slots: one, a second opens at Lv.40. Returns { off } (the piece pushed out, if any) or false.
export const gearSlots = (mon) => (mon.level >= 40 ? 2 : 1);
export function equipGear(mon, id) {
  if (!GEAR[id]) return false;
  const g = (mon.gear = mon.gear || []);
  const off = g.length >= gearSlots(mon) ? g.shift() : null;
  g.push(id);
  return { off };
}
export function unequipGear(mon, id) { const i = (mon.gear || []).indexOf(id); if (i < 0) return false; mon.gear.splice(i, 1); return true; }

export function addFriendship(mon, n) { mon.friendship = Math.max(0, Math.min(255, mon.friendship + n)); return mon.friendship; }

// Evolution: returns the list of evolutions whose conditions are met now.
// ctx: { location, hour, weather }. Conds also take the unlock DSL's { battle } / { activity } (mon.prog),
// { more: [evA, evB] } (battle event A counted more often than B), { weather }, { holding: gearId }.
const inHours = (h, [a, b]) => h != null && (a <= b ? h >= a && h < b : h >= a || h < b); // [20, 5] wraps past midnight
const evCount = (mon, ev) => ensureProg(mon).ev[ev] || 0;
// { squad: { of: [speciesIds], n } } — this one plus n − 1 others of those species owned (ctx.state: party + box).
// With consume: true the others merge into the evolved one (state.js consumeSquad).
export function squadCount(mon, sq, ctx = {}) {
  const st = ctx.state; if (!st) return 0;
  return [...(st.party || []), ...(st.box || [])].filter((m) => sq.of.includes(m.species)).length;
}
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
  if (c.hours && !inHours(ctx.hour, c.hours)) return false;
  if (c.weather && ctx.weather !== c.weather) return false;
  if (c.battle && !condOk(mon, { battle: c.battle })) return false;
  if (c.activity && !condOk(mon, { activity: c.activity })) return false;
  if (c.more && !(evCount(mon, c.more[0]) > evCount(mon, c.more[1]))) return false;
  if (c.holding && !(mon.gear || []).includes(c.holding)) return false;
  if (c.squad && squadCount(mon, c.squad, ctx) < c.squad.n) return false;
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
  if (c.hours) out.push({ label: `Between ${c.hours[0]}:00–${c.hours[1]}:00`, ok: inHours(ctx.hour, c.hours) });
  if (c.weather) out.push({ label: `Weather: ${c.weather}`, ok: ctx.weather === c.weather });
  if (c.battle) add(BATTLE_EVENTS[c.battle.ev] || c.battle.ev, Math.floor(evCount(mon, c.battle.ev)), c.battle.n || 1);
  if (c.activity) add(c.activity.id, ensureProg(mon).acts[c.activity.id] || 0, c.activity.n || 1);
  if (c.more) add(`${BATTLE_EVENTS[c.more[0]] || c.more[0]} > ${BATTLE_EVENTS[c.more[1]] || c.more[1]}`, evCount(mon, c.more[0]), evCount(mon, c.more[1]) + 1);
  if (c.squad) add(`${c.squad.label || 'Squad'} in your team & box`, squadCount(mon, c.squad, ctx), c.squad.n);
  if (c.holding) out.push({ label: `Holding ${GEAR[c.holding] ? GEAR[c.holding].name : c.holding}`, ok: (mon.gear || []).includes(c.holding) });
  return out;
}

export function evolve(mon, to) {
  const from = mon.species;
  // a held evolution item (Egg → Walrusk) is used up
  const e = (SPECIES[from].evolve || []).find((x) => x.to === to);
  if (e && e.cond && e.cond.holding) unequipGear(mon, e.cond.holding);
  mon.species = to;
  const sp = SPECIES[to];
  // the new form's signature moves go straight into the loadout; old moves are kept
  for (const id of sp.start) if (!mon.skills.known.includes(id)) mon.skills.known.push(id);
  mon.skills.active = [...sp.start.filter((id) => SKILLS[id]), ...mon.skills.active.filter((id) => !sp.start.includes(id))].slice(0, 4);
  mon.hp = 1;
  checkUnlocks(mon);
  return { from, to };
}
