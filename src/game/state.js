// Game state: everything that persists in the save. Pure data + helpers.
import { createElemon, gainExp, maxHp, addFriendship, statsOf, equipGear, unequipGear, newLook } from './elemon.js';
import { advance } from './time.js';
import { ITEMS } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { COSMETICS, cosmeticsToLook } from '../data/cosmetics.js';
import { SKILLS } from '../data/skills.js';
import { elemsOf } from '../data/species.js';
import { FOODS } from '../data/foods.js';
import { recordEat } from '../data/progress.js';

export const SAVE_KEY = 'elemon.save.v1';
export const PARTY_MAX = 6;
export const RANKS = [
  { id: 'D', name: 'Rookie D', pts: 0 }, { id: 'C', name: 'Rookie C', pts: 100 }, { id: 'B', name: 'Challenger B', pts: 260 },
  { id: 'A', name: 'Ace A', pts: 480 }, { id: 'S', name: 'Star S', pts: 760 }, { id: 'X', name: 'Champion', pts: 1100 },
];

export function newGame(opts = {}) {
  return {
    version: 1, created: Date.now(), playtime: 0,
    player: { name: opts.name || 'Rin', look: opts.look || null, preset: opts.preset || 'player_a', cosmetics: { stone: 'stone_cyan' }, owned: ['stone_cyan'] },
    party: [], box: [], bag: { takoyaki: 2 }, money: 1500,
    flags: {}, quests: {}, time: { day: 1, hour: 6 }, deadlines: [],
    map: { id: null, x: 0, z: 0 }, story: { chapter: 1, beat: 'prologue' },
    unlocks: { slots: { active: 2, ult: 0, passive: 0 }, locations: ['castle_park'] },
    league: { rank: 'D', points: 0, wins: 0, losses: 0, matchesToday: 0 },
    dex: { seen: {}, caught: {} },
    stats: { battles: 0, wins: 0, captures: 0, reactions: 0, teamCombos: 0, steps: 0 },
    dojo: { training: [] }, followers: [], settings: { music: 0.7, sfx: 0.9, quality: null },
  };
}

// ------------------------------------------------------------- flags & unlocks
export const flag = (s, k) => !!s.flags[k];
export function setFlag(s, k, v = true) { s.flags[k] = v; }
export function unlockLocation(s, id) { if (!s.unlocks.locations.includes(id)) s.unlocks.locations.push(id); }
export function checkReq(s, req) {
  if (!req || req === 'start') return true;
  if (req.startsWith('flag:')) return flag(s, req.slice(5));
  return true;
}

// ------------------------------------------------------------- party
export function addElemon(s, mon) {
  s.dex.seen[mon.species] = true; s.dex.caught[mon.species] = true;
  if (s.party.length < PARTY_MAX) { s.party.push(mon); return 'party'; }
  s.box.push(mon); return 'box';
}
export function giveStarter(s, speciesId, level = 5) {
  const mon = createElemon(speciesId, { level, ot: s.player.name, friendship: 90 });
  addElemon(s, mon);
  return mon;
}
export const lead = (s) => s.party[0] || null;
export function battleTeam(s, n = 3) { return s.party.filter((m) => m.hp > 0 && !inDojo(s, m.uid)).slice(0, n); }
export function healParty(s, frac = 1) { for (const m of s.party) m.hp = Math.min(1, (m.hp ?? 1) + frac); }
export function monByUid(s, uid) { return s.party.find((m) => m.uid === uid) || s.box.find((m) => m.uid === uid) || null; }

// ------------------------------------------------------------- bag & money
export function addItem(s, id, n = 1) { s.bag[id] = (s.bag[id] || 0) + n; if (s.bag[id] <= 0) delete s.bag[id]; }
export const hasItem = (s, id, n = 1) => (s.bag[id] || 0) >= n;
export function spend(s, amt) { if (s.money < amt) return false; s.money -= amt; return true; }
export function buy(s, id, n = 1) { const it = ITEMS[id]; if (!it || !spend(s, it.price * n)) return false; addItem(s, id, n); return true; }
// Gear from the bag onto a Tokonmon (a piece pushed out of a full slot goes back to the bag) and back.
export function equipGearItem(s, mon, id) {
  const it = ITEMS[id];
  if (!it || it.kind !== 'gear' || !hasItem(s, id) || !mon) return false;
  const r = equipGear(mon, id); if (!r) return false;
  addItem(s, id, -1); if (r.off) addItem(s, r.off, 1);
  return true;
}
export function unequipGearItem(s, mon, id) { if (!unequipGear(mon, id)) return false; addItem(s, id, 1); return true; }
// Use a food/boost item on an Elemon outside battle.
export function useItemOn(s, id, mon) {
  const it = ITEMS[id];
  if (!it || !hasItem(s, id) || !mon) return { ok: false };
  const res = { ok: true, msgs: [], unlocked: [] };
  if (it.kind === 'disc') {
    // vinyl disc: the only way to share a skill; the disc is used up
    const sk = SKILLS[it.skill];
    if (!sk || !elemsOf(SPECIES[mon.species]).includes(it.elem)) return { ok: false, reason: 'element' };
    if (mon.skills.known.includes(it.skill)) return { ok: false, reason: 'known' };
    mon.skills.known.push(it.skill);
    if (mon.skills.active.length < 4) mon.skills.active.push(it.skill);
    addItem(s, id, -1);
    res.msgs.push('Learned ' + sk.name);
    res.unlocked.push({ kind: 'move', id: it.skill, name: sk.name });
    return res;
  }
  if (it.kind === 'food' || FOODS[id]) res.unlocked.push(...recordEat(mon, id));
  if (it.heal) { mon.hp = Math.min(1, (mon.hp ?? 1) + it.heal); res.msgs.push('HP restored'); }
  if (it.friend) { addFriendship(mon, it.friend); res.msgs.push('Friendship +' + it.friend); }
  if (it.sp) { mon.sp += it.sp; res.msgs.push('+1 stat point'); }
  if (it.ap) { mon.ap += it.ap; res.msgs.push('+1 Astral point'); }
  if (it.kind === 'food' && !mon.counters.foods.includes(id)) mon.counters.foods.push(id);
  addItem(s, id, -1);
  return res;
}

// ------------------------------------------------------------- cosmetics
export function ownCosmetic(s, id) { if (!s.player.owned.includes(id)) s.player.owned.push(id); }
export function equipCosmetic(s, id) {
  const c = COSMETICS[id];
  if (!c || !s.player.owned.includes(id)) return false;
  if (s.player.cosmetics[c.slot] === id) { if (c.slot !== 'stone') delete s.player.cosmetics[c.slot]; }
  else s.player.cosmetics[c.slot] = id;
  return true;
}
export function playerLook(s, baseLook) {
  const look = Object.assign({}, baseLook || s.player.look || {});
  look.cosmetics = Object.assign({}, look.cosmetics || {}, cosmeticsToLook(s.player.cosmetics));
  return look;
}

// ------------------------------------------------------------- league
export function rankOf(s) { let r = RANKS[0]; for (const k of RANKS) if (s.league.points >= k.pts) r = k; return r; }
export function addLeaguePoints(s, n) { const before = rankOf(s).id; s.league.points = Math.max(0, s.league.points + n); const after = rankOf(s).id; s.league.rank = after; return before !== after ? after : null; }

// ------------------------------------------------------------- time & dojo
export function passTime(s, hours) {
  const res = advance(s.time, hours);
  // dojo auto-training: slow EXP over time
  for (const tr of s.dojo.training) {
    const mon = monByUid(s, tr.uid);
    if (!mon) continue;
    const ups = gainExp(mon, hours * (14 + mon.level * 2.2));
    tr.levels = (tr.levels || 0) + ups.length;
  }
  return res;
}
export function startDojo(s, uid) { if (!s.dojo.training.find((t) => t.uid === uid)) s.dojo.training.push({ uid, since: { day: s.time.day, hour: s.time.hour }, levels: 0 }); }
export function stopDojo(s, uid) { s.dojo.training = s.dojo.training.filter((t) => t.uid !== uid); }
export const inDojo = (s, uid) => s.dojo.training.some((t) => t.uid === uid);

// ------------------------------------------------------------- dex
export function seen(s, speciesId) { s.dex.seen[speciesId] = true; }

// ------------------------------------------------------------- save
export function save(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
}
export function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; const s = JSON.parse(raw); return migrate(s); } catch (e) { return null; }
}
export function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
export function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
// retired species → their place in the new roster (the Beatles beetle line was remade)
const RETIRED = { lenshorn: 'abbeyhorn', starrab: 'walrusk' };
function migrate(s) {
  const base = newGame();
  for (const k of Object.keys(base)) if (s[k] === undefined) s[k] = base[k];
  for (const m of [...s.party, ...s.box]) {
    if (!m.counters) m.counters = base.party; if (m.hp == null) m.hp = 1;
    if (RETIRED[m.species]) m.species = RETIRED[m.species];
    if (!m.drip) m.drip = 1; if (m.look == null) m.look = newLook(); if (!Array.isArray(m.gear)) m.gear = [];
  }
  return s;
}

export { maxHp, statsOf, SPECIES };
