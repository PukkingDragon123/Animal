// Real-time strategic battle simulation — PURE and deterministic (fixed
// timestep + seeded RNG, no rendering). The presentation layer reads
// `st.units/proj/zones/walls/tele…` every frame and consumes `st.events`.
//
// Player-facing mechanics:
//  tap-to-move / tap-to-target auto-attack · aimed abilities (dir/point/target,
//  hold-to-charge) · dodge (i-frames, perfect dodge → witch-time) · parry
//  (perfect parry → big stagger; reflects projectiles) · grab (+ struggle parry)
//  · basic-action combos (grab+parry+attack, charge+attack, dodge+attack …)
//  · elemental auras & reactions · switching & tag strikes · team combos ·
//  ultimates with QTEs · Echo beat bonus · Pyro heat · Spectral form · capture.
//
// Tokonmon rules (docs/TOKONMON.md §5–6):
//  · auto-control: the player's Tokonmon fights on its own (buddy AI); player
//    ORDERS (order()) execute after a short delay (dodge 0.25 s … charge 0.5 s)
//  · BONDING (trainerCommand bond): full direct control (no delay, no AI), the
//    species' bond gimmick (mods/shield), the ultimate meter only fills while
//    bonded, ultimates are bonded-only and end the bond; bonded finals with a
//    Spectral stone can enter their Elemental Form
//  · switching takes rules.switchTime (7 s) with the field empty meanwhile and a
//    rules.switchCd (15 s) cooldown; comeback passives on re-entry
//  · emotes (taunt/dance/shake/flex/bow) · skill levels scale power/cooldown ·
//    conditional passives (when: bonded/bondT/switchedIn/lowHp/arena…)
//  · match clock with halftime pause + arena types (rocky/grassy/water)
import { Rng } from '../core/rng.js';
import { clamp, clamp01, TAU, angleDiff, segCircle } from '../core/mathx.js';
import { SKILLS, COMBOS } from '../data/skills.js';
import { SPECIES, elemsOf } from '../data/species.js';
import { effectiveness, reactionFor, teamCombo } from '../data/elements.js';
import { think } from './ai.js';

export const DT = 1 / 30;
const PARRY_WIN = 0.3, PERFECT_PARRY = 0.15, PERFECT_DODGE = 0.18;
const DODGE_DIST = 3.4, DODGE_TIME = 0.22, DODGE_IFRAMES = 0.26, DODGE_CD = 0.9;
const GRAB_REACH = 1.5, GRAB_HOLD = 1.7;
const COMBO_WINDOW = 1.25;
const BASIC_MUL = 1.3, ATK_K = 0.045, DEF_K = 0.05, DMG_SCALE = 0.62, BASIC_RATE = 1.35;

// ------------------------------------------------------------------ helpers
const len = (x, z) => Math.hypot(x, z);
const dirTo = (a, b) => { const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
const faceDir = (u) => [Math.sin(u.face), Math.cos(u.face)];
function ev(st, type, data = {}) { data.type = type; data.t = st.t; st.events.push(data); return data; }
export const unitById = (st, id) => st.units.find((u) => u.id === id) || null;
export const alive = (u) => u && u.onField && u.state !== 'faint';
export const enemiesOf = (st, u) => st.units.filter((o) => o.side !== u.side && alive(o));
export const alliesOf = (st, u, self = true) => st.units.filter((o) => o.side === u.side && alive(o) && (self || o !== u));
const has = (u, s) => u.st.some((x) => x.s === s);
const stOf = (u, s) => u.st.find((x) => x.s === s);
const buffOf = (u, s) => u.buffs.find((b) => b.s === s);
function removeSt(u, s) { u.st = u.st.filter((x) => x.s !== s); }

// ------------------------------------------------------------------ creation
export function createBattle(spec) {
  const st = {
    t: 0, tick: 0, rng: new Rng(spec.seed ?? 1),
    arena: { r: spec.arena?.r ?? 8.5, props: [], boost: spec.arena?.boost || null, name: spec.arena?.name || 'Arena' },
    rules: Object.assign({ wild: false, capture: false, canSwitch: true, beast: false, items: true, flee: false, tutorial: null, noFaint: false,
      bond: true, orders: true, switchTime: 7, switchCd: 15, sendOut: 2.5 }, spec.rules || {}),
    clock: spec.clock ? { len: spec.clock.len || 180, t: 0, half: 1, halftime: spec.clock.halftime !== false } : null, paused: null,
    units: [], trainers: [], proj: [], zones: [], walls: [], traps: [], seeds: [], tele: [], pending: [], clones: [],
    sides: [{ meter: 0 }, { meter: 0 }],
    events: [], over: false, result: null, qte: null, slowmo: 0, nextId: 1,
    beat: { bpm: spec.bpm || 120, t: 0, n: 0 },
    stats: { reactions: 0, reactionIds: {}, combos: {}, teamCombos: 0, perfectParries: 0, perfectDodges: 0, precise: 0, beats: 0, destroyed: 0, ults: 0, switches: 0, bonds: 0, emotes: 0, crits: 0 },
    defeats: [], captured: null, used: { gems: [], items: [] }, flags: {},
  };
  for (const p of spec.arena?.props || []) st.arena.props.push(Object.assign({ id: 'p' + st.nextId++, hp: 40, maxHp: p.hp ?? 40, r: 0.5, destructible: true, alive: true }, p, { maxHp: p.hp ?? 40 }));
  if (spec.arena?.type) setArenaType(st, spec.arena.type);
  spec.sides.forEach((side, si) => {
    side.trainers.forEach((tr, ti) => addTrainer(st, si, ti, side.trainers.length, tr));
  });
  ev(st, 'start', {});
  return st;
}

function addTrainer(st, side, idx, count, tr) {
  const T = { id: tr.id, name: tr.name || tr.id, side, isPlayer: !!tr.isPlayer, ai: tr.ai || (tr.isPlayer ? null : 'normal'), team: [], active: null,
    switchCd: 0, itemCd: 0, items: Object.assign({}, tr.items || {}), out: false, look: tr.look || null, autoSwitch: tr.autoSwitch ?? !tr.isPlayer, pendingSwitch: 0,
    bondCd: 0, bonded: null, switching: null, canBond: tr.canBond ?? true, gate: null };
  st.trainers.push(T);
  const spread = (idx - (count - 1) / 2) * 3.2;
  const z = side === 0 ? 3.6 : -3.6;
  T.gate = { x: spread, z: side === 0 ? z + 1.4 : z - 1.4 };
  tr.team.forEach((snap, k) => {
    const u = makeUnit(st, snap, T, side);
    u.x = spread; u.z = z; u.face = side === 0 ? Math.PI : 0;
    T.team.push(u.id);
    if (k === 0) { u.onField = true; T.active = u.id; u.state = 'idle'; }
  });
}

function makeUnit(st, snap, T, side) {
  const sp = SPECIES[snap.species];
  // passives: static mods, plus conditional ones (`when`) evaluated every tick
  const mods = {}, cpass = [];
  for (const pid of snap.passives || []) {
    const p = SKILLS[pid];
    if (!p || !p.mods) continue;
    if (p.when) cpass.push({ id: pid, when: p.when, mods: p.mods, on: false });
    else addMods(mods, p.mods);
  }
  const u = {
    id: 'u' + st.nextId++, uid: snap.uid, side, trainer: T.id, species: snap.species, name: snap.name || sp.name, level: snap.level,
    elems: elemsOf(sp), elem: elemsOf(sp)[0], snap, mods, modsBase: mods, cpass, basic: sp.basic, boss: !!sp.boss, beast: !!sp.beast,
    gimmick: sp.gimmick || null, final: snap.final ?? !(sp.evolve && sp.evolve.length), skillLv: Object.assign({}, snap.skillLv || {}), names: Object.assign({}, snap.names || {}),
    bonded: false, bondT: 0, form: null, wasOut: false, comeback: 0, inAt: 0, order: null, obey: 0, emoteCd: 0, cracks: snap.cracks || 0,
    stats: Object.assign({}, snap.stats), maxHp: snap.maxHp, hp: snap.hp ?? snap.maxHp, energy: 60, shield: 0,
    r: sp.radius || 0.5, mass: Math.max(0.4, (sp.radius || 0.5) * 2), x: 0, z: 0, vx: 0, vz: 0, face: 0, y: 0,
    onField: false, state: 'out', stateT: 0, act: null, cmd: null, cmdQ: null, cmdQT: 0, target: null,
    basicT: 0, chain: 0, chainT: 0, cds: {}, dodgeCd: 0, parryCd: 0, grabCd: 0, parryT: 0, parryAge: 9, dodgeAge: 9, iframes: 0,
    dash: null, grab: null, grabbedBy: null, charge: null,
    st: [], buffs: [], aura: null, heat: 0, rhythm: 0, ult: 0, soul: 0, spectral: 0,
    hist: [], hpHist: [], relay: null, lastHitBy: null,
    k: { dealt: 0, taken: 0, precise: 0, healed: 0, blocked: 0, beats: 0, charged: 0, teamCombos: 0, reactions: 0, kos: 0, crits: 0, bondT: 0, bondKos: 0, emotes: 0, uses: {}, hits: {} },
    disobey: (snap.friendship ?? 100) < 40 && T.isPlayer ? 0.14 : 0,
    brain: null, drowsy: 0, moveSpeedMul: 1, auto: !T.isPlayer || st.rules.orders,
  };
  u.skills = (snap.skills || []).filter((id) => SKILLS[id]);
  u.ultSkill = snap.ult && SKILLS[snap.ult] ? snap.ult : null;
  st.units.push(u);
  return u;
}

// ------------------------------------------------------------------ passives & conditional mods
const MUL_KEYS = new Set(['defMul', 'healMul', 'chargeSpeed', 'costMul', 'dodgeCd', 'heatGain', 'shieldMul', 'wallHp', 'teamGain', 'beatMul', 'stagger',
  'dmgMul', 'physMul', 'elmMul', 'spdMul', 'takenMul', 'ultGain', 'cdMul', 'projSpeed', 'rangeMul']);
function addMods(m, src) {
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'number' && typeof m[k] === 'number') m[k] = MUL_KEYS.has(k) ? m[k] * v : m[k] + v;
    else if (Array.isArray(v) && Array.isArray(m[k])) m[k] = [...m[k], ...v];
    else m[k] = v;
  }
  return m;
}
// `when` conditions for passives: { bonded, unbonded, bondT: s, switchedIn: s, lowHp: f, highHp: f, arena, wet, burning, form }
function whenOk(st, u, w) {
  if (w.bonded && !u.bonded) return false;
  if (w.unbonded && u.bonded) return false;
  if (w.bondT != null && !(u.bonded && u.bondT >= w.bondT)) return false;
  if (w.switchedIn != null && !(u.wasOut && st.t - u.inAt <= w.switchedIn)) return false;
  if (w.lowHp != null && u.hp >= u.maxHp * w.lowHp) return false;
  if (w.highHp != null && u.hp < u.maxHp * w.highHp) return false;
  if (w.arena && st.arena.type !== w.arena) return false;
  if (w.wet && !(u.aura && u.aura.e === 'hydro')) return false;
  if (w.burning && !has(u, 'burn')) return false;
  if (w.form && u.form !== w.form) return false;
  return true;
}
function refreshMods(st, u) {
  let changed = false;
  for (const p of u.cpass) { const on = whenOk(st, u, p.when); if (on !== p.on) { p.on = on; changed = true; if (on) ev(st, 'passiveOn', { u: u.id, id: p.id }); } }
  const g = u.bonded && u.gimmick && u.gimmick.mods;
  if (!changed && !!g === !!u._gOn && !u._dirty) return;
  u._gOn = !!g; u._dirty = false;
  const m = Object.assign({}, u.modsBase);
  for (const p of u.cpass) if (p.on) addMods(m, p.mods);
  if (g) addMods(m, g);
  u.mods = m;
}

// ------------------------------------------------------------------ stat helpers
function statMul(u, key) {
  let m = 1;
  for (const b of u.buffs) if (b.s === key) m += b.k;
  if (u.spectral > 0) m += 0.35;
  return m;
}
const atkStat = (u, scale) => (scale === 'phys' ? u.stats.dmg * statMul(u, 'dmg') : u.stats.elm * statMul(u, 'elm'));
function defStat(u) {
  let d = u.stats.def * statMul(u, 'def') * (u.mods.defMul || 1);
  const dd = stOf(u, 'defdown'); if (dd) d *= 1 - dd.k;
  if (u.mods.wetDef && u.aura && u.aura.e === 'hydro') d *= 1 + u.mods.wetDef;
  return d;
}
export function moveSpeed(u) {
  let s = 2.8 + u.stats.spd * 0.14;
  s *= statMul(u, 'spd') * (u.mods.spdMul || 1);
  const sl = stOf(u, 'slow'); if (sl) s *= 1 - sl.k;
  const mosh = u.buffs.filter((b) => b.s === 'mosh').length; s *= 1 + mosh * (u.mods.mosh || 0);
  if (u.charge) s *= 0.45;
  if (u.boss) s *= 0.85;
  return Math.min(8, s);
}
const cdMul = (u) => (1 - Math.min(0.3, u.stats.spd * 0.01)) * (u.mods.cdMul || 1);
// skill level (levels up by use, see src/data/progress.js): +12% power and −5% cooldown per level
export const skillLevel = (u, id) => Math.max(1, Math.min(5, (u.skillLv && u.skillLv[id]) || 1));
export const skillName = (u, id) => (u.names && u.names[id]) || (SKILLS[id] ? SKILLS[id].name : id);
export const canAct = (u) => alive(u) && !['stun', 'sleep', 'frozen'].some((s) => has(u, s)) && !['stagger', 'grabbed', 'knock', 'faint', 'out'].includes(u.state) && !(u.act && u.act.lock);
const canMove = (u) => canAct(u) && !has(u, 'root') && !u.grab;

// ------------------------------------------------------------------ commands
// Unit-level commands, executed now (AI, bonded player, internal).
export function command(st, unitId, cmd) {
  const u = unitById(st, unitId);
  if (!u || !alive(u) || st.paused) return false;
  if (u.disobey && cmd.type !== 'qte' && st.rng.chance(u.disobey)) { ev(st, 'disobey', { u: u.id }); return false; }
  u.cmdQ = cmd; u.cmdQT = 0.4;
  return true;
}
// Player ORDERS: an auto-controlled Tokonmon hears the order and executes it
// after a short delay (shown as the move's anticipation). Bonded → instant.
export const ORDER_DELAY = { dodge: 0.25, parry: 0.3, move: 0.12, stop: 0.1, target: 0.35, attack: 0.4, grab: 0.4, skill: 0.45, charge: 0.5, emote: 0.3 };
const OBEY = { move: 2.2, target: 4, attack: 1.2, grab: 1.2, skill: 1.2, charge: 6, dodge: 0.7, parry: 0.7, emote: 1.5, stop: 2 };
export function orderDelay(u, type) {
  if (u.bonded) return 0;
  let d = ORDER_DELAY[type] ?? 0.35;
  d *= 1 - Math.min(0.3, u.stats.spd * 0.008);
  d *= 1 - Math.min(0.25, ((u.snap.friendship ?? 70) / 255) * 0.25);
  return d;
}
export function order(st, unitId, cmd) {
  const u = unitById(st, unitId);
  if (!u || !alive(u) || st.paused) return false;
  if (!st.rules.orders || u.bonded || cmd.type === 'release' || cmd.type === 'aim' || cmd.type === 'qte' || (cmd.type === 'charge' && !cmd.on)) {
    if (cmd.type === 'charge' && !cmd.on) u.obey = 0.6;
    return command(st, unitId, cmd);
  }
  const d = orderDelay(u, cmd.type);
  const repl = !!u.order;
  u.order = { cmd, t: d, dur: d };
  ev(st, 'order', { u: u.id, kind: cmd.type, delay: d, replaced: repl, skill: cmd.type === 'skill' ? (cmd.id || u.skills[cmd.slot]) : null });
  return true;
}
function stepOrder(st, u, dt) {
  u.obey = Math.max(0, u.obey - dt);
  if (!u.order) return;
  u.order.t -= dt;
  if (u.order.t > 0) return;
  const c = u.order.cmd;
  u.order = null;
  u.obey = OBEY[c.type] ?? 1;
  ev(st, 'orderGo', { u: u.id, kind: c.type });
  command(st, u.id, c);
}

// Trainer-level commands: switch, item, team combo, capture, flee, bond, unbond, elemental form.
export function trainerCommand(st, trainerId, cmd) {
  const T = st.trainers.find((t) => t.id === trainerId);
  if (!T || T.out || st.over || st.paused) return false;
  if (cmd.type === 'bond') return doBond(st, T);
  if (cmd.type === 'unbond') { const u = unitById(st, T.bonded); if (!u) return false; endBond(st, u, 'manual'); return true; }
  if (cmd.type === 'elemental') { const u = unitById(st, T.active); return !!u && beginElemental(st, u); }
  if (cmd.type === 'switch') return doSwitch(st, T, cmd.to);
  if (cmd.type === 'item') return useItem(st, T, cmd.id);
  if (cmd.type === 'team') return teamComboStart(st, T);
  if (cmd.type === 'capture') return captureStart(st, T, cmd.gem, cmd.gemMul ?? 1);
  if (cmd.type === 'flee') { if (!st.rules.flee) return false; endBattle(st, -1, 'flee'); return true; }
  return false;
}

function processCommand(st, u, c) {
  switch (c.type) {
    case 'move': u.cmd = { type: 'move', x: c.x, z: c.z }; u.target = null; if (u.act && u.act.kind === 'basic' && u.act.phase !== 'active') u.act = null; return true;
    case 'target': { const t = unitById(st, c.id); if (!alive(t)) return true; u.target = t.id; u.cmd = { type: 'chase' }; return true; }
    case 'stop': u.cmd = null; u.target = null; return true;
    case 'attack': return manualAttack(st, u, c);
    case 'charge': return c.on ? startCharge(st, u) : stopCharge(st, u);
    case 'dodge': return doDodge(st, u, c.dx, c.dz);
    case 'parry': return doParry(st, u);
    case 'grab': return doGrab(st, u);
    case 'skill': return beginSkill(st, u, c.id || u.skills[c.slot], c);
    case 'release': if (c.x != null) aimUpdate(st, u, c); return releaseCharge(st, u);
    case 'aim': return aimUpdate(st, u, c);
    case 'ult': return beginUlt(st, u, c);
    case 'spectral': return beginElemental(st, u);
    case 'emote': return doEmote(st, u, c.id);
    default: return true;
  }
}
const instantCmd = (c) => c.type === 'dodge' || c.type === 'parry' || c.type === 'move' || c.type === 'stop' || c.type === 'release' || c.type === 'charge' || c.type === 'aim';

// ------------------------------------------------------------------ bonding & elemental form
const trainerOf = (st, u) => st.trainers.find((t) => t.id === u.trainer) || null;
function doBond(st, T) {
  if (!st.rules.bond || !T.canBond || T.bondCd > 0 || T.bonded || T.switching || st.qte) return false;
  const u = unitById(st, T.active);
  if (!alive(u) || u.bonded || u.beast || u.state === 'captured') return false;
  u.bonded = true; u.bondT = 0; u.order = null; u.obey = 0;
  if (T.isPlayer) { u.auto = false; u.cmd = null; }
  T.bonded = u.id;
  st.stats.bonds++;
  const g = u.gimmick;
  if (g && g.shield) { u.shield = Math.max(u.shield, u.maxHp * g.shield * (u.mods.shieldMul || 1)); u.shieldT = null; }
  if (g && g.heal) heal(st, u, u, u.maxHp * g.heal);
  st.slowmo = Math.max(st.slowmo, 0.5);
  ev(st, 'bond', { u: u.id, trainer: T.id, gimmick: g ? g.id : null, name: g ? g.name : null });
  ev(st, 'anim', { u: u.id, anim: 'roar' });
  refreshMods(st, u);
  return true;
}
function endBond(st, u, reason) {
  if (!u.bonded) return;
  u.bonded = false; u.k.bondT += u.bondT;
  const T = trainerOf(st, u);
  if (T) {
    T.bonded = null;
    T.bondCd = reason === 'ult' ? 20 : reason === 'manual' ? 6 : 12;
    if (T.isPlayer && st.rules.orders) { u.auto = true; u.brain = null; }
  }
  if (u.form) { u.form = null; u.spectral = 0; ev(st, 'form', { u: u.id, form: null }); ev(st, 'spectralEnd', { u: u.id }); }
  if (u.gimmick && u.gimmick.shield && u.shieldT == null) u.shield = 0;
  ev(st, 'unbond', { u: u.id, reason, bondT: u.bondT });
  u.bondT = 0;
  u._dirty = true; refreshMods(st, u);
}
function beginElemental(st, u) {
  if (!alive(u) || !u.bonded || !u.final || !u.snap.spectral || u.soul < 100 || u.form) return false;
  u.soul = 0; u.form = 'elemental'; u.spectral = 1e6; u.ult = Math.min(100, u.ult + 40);
  heal(st, u, u, u.maxHp * 0.3);
  ev(st, 'form', { u: u.id, form: 'elemental' });
  ev(st, 'spectral', { u: u.id });
  st.slowmo = Math.max(st.slowmo, 1.2);
  u._dirty = true;
  return true;
}

// ------------------------------------------------------------------ emotes
export const EMOTES = {
  taunt: { name: 'Taunt', dur: 1.1, anim: 'taunt', desc: 'Nearby foes lock onto you, riled (+15% damage dealt AND taken). +Energy.' },
  dance: { name: 'Dance', dur: 1.5, anim: 'dance', desc: 'On the beat: +25 energy, heal 5%, hype the crowd. Off-beat: +10 energy.' },
  shake: { name: 'Shake', dur: 0.8, anim: 'shake', desc: 'Shake off burn, poison, slow, drowsiness and elemental auras.' },
  flex: { name: 'Flex', dur: 1.1, anim: 'flex', desc: '+25% defense for 6 s.' },
  bow: { name: 'Bow', dur: 1.0, anim: 'bow', desc: 'Respect: heal 6% and +15 team-combo meter.' },
};
function doEmote(st, u, id) {
  const e = EMOTES[id];
  if (!e || !canAct(u) || u.act || u.emoteCd > 0) return false;
  u.act = { kind: 'emote', id, phase: 'active', t: 0, w: 0, a: e.dur, r: 0.1 };
  u.emoteCd = 3.5; u.k.emotes++; st.stats.emotes++;
  u.cmd = null;
  let beat = false;
  if (id === 'taunt') {
    for (const o of enemiesOf(st, u)) if (len(o.x - u.x, o.z - u.z) < 10) { o.target = u.id; o.cmd = { type: 'chase' }; addBuff(o, 'riled', 0.15, 5); }
    u.energy = Math.min(100, u.energy + 12);
    if (u.bonded) u.ult = Math.min(100, u.ult + 8);
  } else if (id === 'dance') {
    beat = onBeat(st, u) || (u.mods.beatWindow || 0) > 0.15;
    u.energy = Math.min(100, u.energy + (beat ? 25 : 10));
    if (beat) { heal(st, u, u, u.maxHp * 0.05); u.rhythm = Math.min(100, u.rhythm + 25); if (u.bonded) u.ult = Math.min(100, u.ult + 10); }
  } else if (id === 'shake') {
    u.st = u.st.filter((s) => !['burn', 'poison', 'slow', 'confuse', 'blind', 'weaken', 'defdown'].includes(s.s));
    u.drowsy = 0; u.aura = null;
  } else if (id === 'flex') addBuff(u, 'def', 0.25, 6);
  else if (id === 'bow') { heal(st, u, u, u.maxHp * 0.06); st.sides[u.side].meter = Math.min(100, st.sides[u.side].meter + 15); }
  ev(st, 'emote', { u: u.id, id, beat });
  ev(st, 'anim', { u: u.id, anim: e.anim });
  return true;
}

// ------------------------------------------------------------------ action history (combos)
function pushHist(st, u, a) { u.hist.push({ a, t: st.t }); if (u.hist.length > 6) u.hist.shift(); }
function matchCombo(st, u) {
  const now = st.t;
  const h = u.hist.filter((e) => now - e.t <= COMBO_WINDOW * 2.2);
  for (const c of COMBOS) {
    const seq = c.seq.slice(0, -1); // final 'attack' is the trigger
    if (seq.length > h.length) continue;
    let ok = true, prevT = now;
    for (let i = seq.length - 1, j = h.length - 1; i >= 0; i--, j--) {
      const e = h[j];
      if (!e || e.a !== seq[i] || prevT - e.t > COMBO_WINDOW) { ok = false; break; }
      prevT = e.t;
    }
    if (ok) {
      if (c.id === 'throw' || c.id === 'reversal_suplex') { if (!u.grab) continue; }
      return c;
    }
  }
  return null;
}

// ------------------------------------------------------------------ basic actions
function manualAttack(st, u, c) {
  if (u.grab) { // throw / suplex
    const combo = matchCombo(st, u) || COMBOS.find((x) => x.id === 'throw');
    return doComboAttack(st, u, combo, c);
  }
  if (!canAct(u)) return false;
  if (u.act && !(u.act.kind === 'basic' && u.act.phase === 'recover')) return false;
  const combo = matchCombo(st, u);
  if (u.charge) { const lvl = u.charge.lvl; u.charge = null; const cc = lvl >= 2 ? COMBOS.find((x) => x.id === 'overdrive') : COMBOS.find((x) => x.id === 'elemental_strike'); return doComboAttack(st, u, cc, c); }
  if (combo) return doComboAttack(st, u, combo, c);
  // plain basic attack (chain)
  const tgt = pickTarget(st, u, c);
  if (tgt) { u.target = tgt.id; u.face = Math.atan2(tgt.x - u.x, tgt.z - u.z); }
  else if (c.x != null) u.face = Math.atan2(c.x - u.x, c.z - u.z);
  startBasic(st, u, tgt, true);
  return true;
}

function pickTarget(st, u, c) {
  if (c && c.id) { const t = unitById(st, c.id); if (alive(t) && t.side !== u.side) return t; }
  const cur = unitById(st, u.target);
  if (alive(cur) && cur.side !== u.side) return cur;
  let best = null, bd = 1e9;
  for (const o of enemiesOf(st, u)) { const d = len(o.x - u.x, o.z - u.z); if (d < bd) { bd = d; best = o; } }
  return best;
}

function startBasic(st, u, tgt, manual) {
  if (u.chainT <= 0) u.chain = 0;
  const step = u.chain % 3;
  u.chain++; u.chainT = 1.0;
  const b = u.basic;
  const rate = b.rate * BASIC_RATE / (1 + u.stats.spd * 0.012) / statMul(u, 'spd');
  u.act = { kind: 'basic', phase: 'windup', t: 0, w: step === 2 ? 0.2 : 0.12, a: 0.06, r: Math.max(0.14, rate - 0.2), step, tid: tgt ? tgt.id : null, manual };
  u.basicT = rate;
  pushHist(st, u, 'attack');
  ev(st, 'anim', { u: u.id, anim: step === 0 ? 'attack' : step === 1 ? 'attack2' : (b.type === 'ranged' ? 'shoot' : 'attack3') });
}

function execBasic(st, u) {
  const a = u.act, b = u.basic, tgt = unitById(st, a.tid);
  const finisher = a.step === 2;
  const power = b.power * BASIC_MUL * (finisher ? 1.6 : 1);
  if (b.type === 'ranged') {
    const [dx, dz] = tgt ? dirTo(u, tgt) : faceDir(u);
    spawnProj(st, u, { power, speed: b.speed || 14, r: 0.22, scale: 'phys', aura: finisher ? 0.5 : 0, elem: finisher ? u.elem : null, kind: 'basic', knock: finisher ? 2 : 0.4, range: b.range + 1.5, sprite: 'basic' }, dx, dz);
  } else {
    const reach = (b.range || 1.5);
    let hitAny = false;
    for (const o of enemiesOf(st, u)) {
      const d = len(o.x - u.x, o.z - u.z) - o.r - u.r;
      if (d > reach * 0.8 + 0.35) continue;
      const ang = Math.abs(angleDiff(u.face, Math.atan2(o.x - u.x, o.z - u.z)));
      if (ang > 1.2 && d > 0.2) continue;
      applyHit(st, u, o, { power, scale: 'phys', elem: finisher ? u.elem : null, aura: finisher ? 0.5 : 0, knock: finisher ? 3 : 0.6, kind: 'basic', parryable: true, beat: u.elem === 'echo' });
      hitAny = true;
    }
    if (!hitAny) ev(st, 'whiff', { u: u.id });
  }
  ev(st, 'swing', { u: u.id, step: a.step, ranged: b.type === 'ranged' });
}

function startCharge(st, u) {
  if (!canAct(u) || u.act || u.charge) return false;
  u.charge = { t: 0, lvl: 1 };
  pushHist(st, u, 'charge');
  ev(st, 'charge', { u: u.id, lvl: 1 });
  ev(st, 'anim', { u: u.id, mode: 'charge' });
  return true;
}
function stopCharge(st, u) { if (u.charge) { u.charge = null; ev(st, 'anim', { u: u.id, mode: null }); } return true; }

function doDodge(st, u, dx = 0, dz = 0) {
  if (!alive(u) || u.dodgeCd > 0) return false;
  if (['stun', 'sleep', 'frozen'].some((s) => has(u, s)) || ['grabbed', 'knock', 'faint'].includes(u.state)) return false;
  if (u.act && (u.act.lock || u.act.kind === 'ult')) return false;
  if (u.act && u.act.kind === 'skill' && u.act.phase !== 'windup') return false;
  if (u.act && u.act.tele) removeTele(st, u.act.tele);
  u.act = null; u.charge = null; u.grab = null;
  let l = Math.hypot(dx, dz);
  if (l < 0.01) { const f = faceDir(u); dx = -f[0]; dz = -f[1]; l = 1; }
  dx /= l; dz /= l;
  u.dash = { dx, dz, speed: DODGE_DIST / DODGE_TIME, t: DODGE_TIME, kind: 'dodge' };
  u.iframes = DODGE_IFRAMES; u.dodgeAge = 0;
  u.dodgeCd = DODGE_CD * (u.mods.dodgeCd || 1);
  pushHist(st, u, 'dodge');
  ev(st, 'dodge', { u: u.id, dx, dz });
  ev(st, 'anim', { u: u.id, anim: 'dodge' });
  return true;
}

function doParry(st, u) {
  if (!alive(u) || u.parryCd > 0) return false;
  if (['stun', 'sleep', 'frozen', 'knock'].some((s) => has(u, s)) || ['knock', 'faint', 'grabbed'].includes(u.state) && !(u.state === 'grabbed')) return false;
  if (u.act && u.act.kind === 'skill' && u.act.phase !== 'windup') return false;
  if (u.act && u.act.tele) removeTele(st, u.act.tele);
  if (u.act && !u.act.lock) u.act = null;
  const geo = u.elems.includes('geo');
  u.parryT = PARRY_WIN + (geo ? 0.1 : 0); u.parryAge = 0;
  u.parryCd = 0.75;
  ev(st, 'parryStance', { u: u.id });
  ev(st, 'anim', { u: u.id, anim: 'parry' });
  return true;
}

function doGrab(st, u) {
  if (!canAct(u) || u.grabCd > 0 || u.act) return false;
  u.act = { kind: 'grab', phase: 'windup', t: 0, w: 0.14, a: 0.05, r: 0.32 };
  u.grabCd = 2.2;
  const tgt = pickTarget(st, u, null);
  if (tgt) u.face = Math.atan2(tgt.x - u.x, tgt.z - u.z);
  ev(st, 'anim', { u: u.id, anim: 'grab' });
  return true;
}
function execGrab(st, u) {
  for (const o of enemiesOf(st, u)) {
    const d = len(o.x - u.x, o.z - u.z) - o.r - u.r;
    const ang = Math.abs(angleDiff(u.face, Math.atan2(o.x - u.x, o.z - u.z)));
    if (d > GRAB_REACH || ang > 1.0) continue;
    if (o.iframes > 0 || o.state === 'grabbed' || o.beast && o.mass > u.mass * 1.6) continue;
    if (o.parryT > 0) { parrySuccess(st, o, u, { kind: 'grab' }); return; }
    o.state = 'grabbed'; o.grabbedBy = u.id; o.act = null; o.charge = null; o.dash = null;
    u.grab = { tid: o.id, t: 0, struggleAt: 0.5 + st.rng.next() * 0.25, struggle: null, parried: false };
    u.act = null;
    pushHist(st, u, 'grab');
    ev(st, 'grab', { u: u.id, tgt: o.id });
    ev(st, 'anim', { u: o.id, mode: 'grabbed' });
    if (o.trainer && st.trainers.find((t) => t.id === o.trainer)?.isPlayer) st.qte = st.qte || { id: 'q' + st.nextId++, type: 'mash', n: 7, owner: o.id, kind: 'escape', t: 0, dur: 1.4 };
    return;
  }
  ev(st, 'whiff', { u: u.id, grab: true });
}

function releaseGrab(st, u, stagger = 0) {
  const g = u.grab; if (!g) return;
  const o = unitById(st, g.tid);
  if (o && o.state === 'grabbed') { o.state = 'idle'; o.grabbedBy = null; ev(st, 'anim', { u: o.id, mode: null }); }
  u.grab = null;
  if (stagger) stun(st, u, 'stagger', stagger);
}

function doComboAttack(st, u, combo, c) {
  if (!combo) return false;
  const tgt = u.grab ? unitById(st, u.grab.tid) : pickTarget(st, u, c);
  st.stats.combos[combo.id] = (st.stats.combos[combo.id] || 0) + 1;
  ev(st, 'combo', { u: u.id, id: combo.id, name: combo.name });
  pushHist(st, u, 'attack');
  u.hist = [];
  if (combo.id === 'throw' || combo.id === 'reversal_suplex') {
    const o = tgt; releaseGrab(st, u);
    if (!o) return true;
    if (combo.id === 'throw') {
      const [fx, fz] = c && c.x != null ? (() => { const dx = c.x - u.x, dz = c.z - u.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; })() : faceDir(u);
      applyHit(st, u, o, { power: combo.power, scale: 'phys', kind: 'combo', knock: 0, parryable: false });
      o.vx = fx * combo.thrown * 2.2; o.vz = fz * combo.thrown * 2.2; o.state = 'knock'; o.thrownBy = u.id;
      ev(st, 'anim', { u: u.id, anim: 'throw' });
    } else {
      applyHit(st, u, o, { power: combo.power, scale: 'phys', kind: 'combo', knock: combo.knock, up: combo.up, crit: true, parryable: false, status: { s: 'stun', dur: combo.stun } });
      aoeHit(st, u, o.x, o.z, combo.aoe, { power: combo.power * 0.35, scale: 'phys', kind: 'combo', knock: 3, exclude: o.id });
      ev(st, 'slam', { u: u.id, x: o.x, z: o.z, r: combo.aoe, crack: true });
      ev(st, 'anim', { u: u.id, anim: 'slam' });
      st.slowmo = Math.max(st.slowmo, 0.5);
    }
    return true;
  }
  if (!canAct(u)) return false;
  if (tgt) u.face = Math.atan2(tgt.x - u.x, tgt.z - u.z);
  u.act = { kind: 'combo', combo, phase: 'windup', t: 0, w: 0.14, a: 0.06, r: 0.3, tid: tgt ? tgt.id : null, aim: c };
  if (combo.lunge && tgt) { const [dx, dz] = dirTo(u, tgt); const dd = Math.max(0, Math.min(combo.lunge, len(tgt.x - u.x, tgt.z - u.z) - tgt.r - u.r - 0.3)); u.dash = { dx, dz, speed: dd / 0.12, t: 0.12, kind: 'lunge' }; }
  ev(st, 'anim', { u: u.id, anim: combo.elemental ? 'attack3' : 'attack' });
  return true;
}
function execCombo(st, u) {
  const c = u.act.combo, tgt = unitById(st, u.act.tid);
  const elemental = c.elemental;
  const h = { power: c.power, scale: elemental ? 'elm' : 'phys', elem: elemental ? u.elem : null, aura: elemental ? 1.5 : 0, knock: c.knock || 2, kind: 'combo', crit: !!c.crit, parryable: !c.crit, combo: c.id };
  if (u.elems.includes('pyro') && elemental) { h.power *= 1.3; u.k.charged++; }
  if (c.id === 'tag_strike' && u.relay && st.t - u.relay.t < 3.2 && tgt) {
    if (!tgt.aura) tgt.aura = { e: u.relay.elem, amt: 1, t: 6, src: u.relay.from };
    h.relay = true;
  }
  if (c.aoe) { aoeHit(st, u, u.x + Math.sin(u.face) * 1.2, u.z + Math.cos(u.face) * 1.2, c.aoe, Object.assign({}, h, { parryable: false })); ev(st, 'burst', { x: u.x + Math.sin(u.face) * 1.2, z: u.z + Math.cos(u.face) * 1.2, r: c.aoe, elem: u.elem }); return; }
  if (tgt && len(tgt.x - u.x, tgt.z - u.z) - tgt.r - u.r < (u.basic.type === 'ranged' ? 7 : 2.4)) applyHit(st, u, tgt, h);
  else if (u.basic.type === 'ranged' || elemental) { const [dx, dz] = faceDir(u); spawnProj(st, u, Object.assign({}, h, { speed: 16, r: 0.4, range: 9, sprite: 'combo' }), dx, dz); }
  else ev(st, 'whiff', { u: u.id });
}

// ------------------------------------------------------------------ skills
function beginSkill(st, u, skillId, c) {
  const sk = SKILLS[skillId];
  if (!sk || sk.kind !== 'active') return false;
  if (!canAct(u) || (u.act && !(u.act.kind === 'basic' && u.act.phase !== 'active'))) return false;
  if ((u.cds[sk.id] || 0) > 0) { ev(st, 'cooldown', { u: u.id, skill: sk.id }); return false; }
  const cost = Math.round(sk.cost * (u.mods.costMul || 1) * (u.spectral > 0 ? 0.5 : 1));
  if (u.energy < cost) { ev(st, 'noEnergy', { u: u.id, skill: sk.id }); return false; }
  u.energy -= cost;
  u.cds[sk.id] = sk.cd * cdMul(u) * (1 - 0.05 * (skillLevel(u, sk.id) - 1));
  u.k.uses[sk.id] = (u.k.uses[sk.id] || 0) + 1;
  if (u.bonded) u.ult = Math.min(100, u.ult + 4 * (u.mods.ultGain || 1));
  const aim = resolveAim(st, u, sk, c);
  if (aim.face != null) u.face = aim.face;
  u.charge = null;
  const hold = !!(sk.charge && c && c.hold);
  u.act = { kind: 'skill', sk, phase: hold ? 'charge' : 'windup', t: 0, w: sk.windup, a: 0, r: sk.recover, aim, chg: 0, maxChg: sk.charge ? sk.charge.max / (u.mods.chargeSpeed || 1) / (u.elems.includes('pyro') ? 1.25 : 1) : 0 };
  if (sk.telegraph && (sk.windup >= 0.3 || hold || u.side === 1)) u.act.tele = addTele(st, u, sk, aim);
  ev(st, 'cast', { u: u.id, skill: sk.id, phase: hold ? 'charge' : 'windup' });
  ev(st, 'anim', hold ? { u: u.id, mode: 'charge' } : { u: u.id, anim: sk.anim || 'cast' });
  if (sk.beat) u.act.beatAt = st.t;
  return true;
}
function aimUpdate(st, u, c) {
  const a = u.act;
  if (!a || a.kind !== 'skill' || (a.phase !== 'charge' && a.phase !== 'windup')) return false;
  a.aim = resolveAim(st, u, a.sk, c);
  if (a.aim.face != null) u.face = a.aim.face;
  if (a.tele) { const tl = st.tele.find((t) => t.id === a.tele); if (tl && !tl.follow) { tl.x = a.aim.x; tl.z = a.aim.z; tl.dx = a.aim.dx; tl.dz = a.aim.dz; } }
  return true;
}
function releaseCharge(st, u) {
  if (u.act && u.act.phase === 'charge') { u.act.phase = 'windup'; u.act.t = 0; ev(st, 'anim', { u: u.id, mode: null, anim: u.act.sk.anim || 'cast' }); return true; }
  if (u.charge) return true;
  return false;
}

function resolveAim(st, u, sk, c) {
  const aim = { x: u.x, z: u.z, dx: Math.sin(u.face), dz: Math.cos(u.face), tid: null, face: null };
  const tgtFromC = c && c.id ? unitById(st, c.id) : null;
  if (sk.aim === 'self') return aim;
  if (sk.aim === 'ally') {
    let t = tgtFromC && tgtFromC.side === u.side ? tgtFromC : null;
    if (!t) { let lo = 2; for (const a of alliesOf(st, u)) { const f = a.hp / a.maxHp; if (f < lo) { lo = f; t = a; } } }
    aim.tid = (t || u).id; aim.x = (t || u).x; aim.z = (t || u).z;
    return aim;
  }
  let tx, tz;
  if (c && c.x != null) { tx = c.x; tz = c.z; }
  else { const t = tgtFromC && alive(tgtFromC) ? tgtFromC : pickTarget(st, u, null); if (t) { tx = t.x; tz = t.z; aim.tid = t.id; } else { tx = u.x + Math.sin(u.face) * 4; tz = u.z + Math.cos(u.face) * 4; } }
  if (sk.aim === 'target') {
    let t = tgtFromC && alive(tgtFromC) ? tgtFromC : null;
    if (!t) { let bd = 1e9; for (const o of enemiesOf(st, u)) { const d = len(o.x - tx, o.z - tz); if (d < bd) { bd = d; t = o; } } }
    if (t) { aim.tid = t.id; tx = t.x; tz = t.z; }
  }
  const dx = tx - u.x, dz = tz - u.z, l = Math.hypot(dx, dz);
  if (l > 0.05) { aim.dx = dx / l; aim.dz = dz / l; aim.face = Math.atan2(dx, dz); }
  if (sk.aim === 'point' || sk.aim === 'target') {
    const rr = Math.min(l, sk.range || 8);
    aim.x = u.x + aim.dx * rr; aim.z = u.z + aim.dz * rr;
    if (sk.aim === 'target' && aim.tid) { const t = unitById(st, aim.tid); aim.x = t.x; aim.z = t.z; }
  }
  return aim;
}

function addTele(st, u, sk, aim) {
  const e = sk.eff.find((x) => x.t === 'aoe' || x.t === 'line' || x.t === 'cone' || x.t === 'dash' || x.t === 'melee' || x.t === 'proj') || {};
  const tl = { id: 'tl' + st.nextId++, owner: u.id, side: u.side, shape: sk.telegraph, x: aim.x, z: aim.z, dx: aim.dx, dz: aim.dz, r: e.r || 2, len: e.range || e.dist || sk.range || 6, width: e.width || (e.r ? e.r * 2 : 1.4), arc: e.arc || 70, t: 0, dur: sk.windup + (sk.charge ? sk.charge.max : 0) + (e.delay || 0) };
  if (sk.telegraph === 'circle' && (e.at === 'self' || sk.aim === 'self')) { tl.x = u.x; tl.z = u.z; tl.follow = u.id; }
  if (sk.telegraph === 'line' || sk.telegraph === 'cone') { tl.x = u.x; tl.z = u.z; tl.follow = u.id; }
  st.tele.push(tl);
  ev(st, 'telegraph', { id: tl.id, u: u.id });
  return tl.id;
}
function removeTele(st, id) { const i = st.tele.findIndex((t) => t.id === id); if (i >= 0) st.tele.splice(i, 1); }

// Run a skill's effect list. mult multiplies power (charge, QTE, overheat…).
function runEffects(st, u, sk, aim, mult = 1, grow = 1) {
  if (sk.kind === 'active') mult *= 1 + 0.12 * (skillLevel(u, sk.id) - 1);
  const beatOk = sk.beat && onBeat(st, u);
  if (beatOk) { mult *= u.mods.beatMul || 1.3; u.k.beats++; st.stats.beats++; u.rhythm = Math.min(100, u.rhythm + 20); ev(st, 'onBeat', { u: u.id }); }
  if (u.heat >= 100 && sk.charge) { mult *= 1.5; u.heat = 0; ev(st, 'overheat', { u: u.id }); if (u.mods.overheatDmg) addBuff(u, 'dmg', u.mods.overheatDmg, 6); }
  const kin = buffOf(u, 'kindle');
  for (const e of sk.eff) {
    const base = { elem: sk.elem, scale: sk.scale === 'phys' ? 'phys' : 'elm', kind: sk.kind === 'ultimate' ? 'ult' : 'skill', skill: sk.id, beat: beatOk };
    switch (e.t) {
      case 'proj': {
        const n = e.count || 1;
        for (let i = 0; i < n; i++) {
          let dx = aim.dx, dz = aim.dz;
          if (n > 1 && e.spread) { const a = Math.atan2(dx, dz) + ((i / (n - 1)) - 0.5) * e.spread * Math.PI / 180; dx = Math.sin(a); dz = Math.cos(a); }
          const p = Object.assign({}, base, { power: e.power * mult, speed: e.speed, r: e.r * (e.grow ? grow : 1), aura: e.aura, knock: e.knock || 0.8, status: e.status, crit: e.crit, pierce: e.pierce, bounce: e.bounce || 0, homing: e.homing, arc: e.arc, explode: e.explode, chain: e.chain, boomerang: e.boomerang, wave: e.wave, range: (sk.range || 8) * (e.arc ? 1 : 1.25), tx: aim.x, tz: aim.z, tid: aim.tid, sprite: sk.fx });
          if (e.burst && i > 0) st.pending.push({ at: st.t + e.burst * i, kind: 'proj', u: u.id, p, dx: () => { const t = unitById(st, aim.tid); return t ? dirTo(u, t) : [dx, dz]; } });
          else spawnProj(st, u, p, dx, dz);
        }
        break;
      }
      case 'melee': {
        const tgt = aim.tid ? unitById(st, aim.tid) : null;
        if (e.lunge && tgt) { const [dx, dz] = dirTo(u, tgt); const dd = Math.max(0, Math.min(e.lunge, len(tgt.x - u.x, tgt.z - u.z) - tgt.r - u.r - 0.25)); u.x += dx * dd; u.z += dz * dd; u.face = Math.atan2(dx, dz); }
        const n = e.count || 1;
        for (let i = 0; i < n; i++) {
          const hit = Object.assign({}, base, { power: e.power * mult, aura: e.aura, knock: e.knock || 1, status: e.status, parryable: true, kind: 'skill' });
          if (i === n - 1 && e.beatStatus && beatOk) hit.status = e.beatStatus;
          if (i === 0) meleeSweep(st, u, e.reach || 1.6, e.arc || 90, hit);
          else st.pending.push({ at: st.t + (e.interval || 0.2) * i, kind: 'melee', u: u.id, reach: e.reach || 1.6, arc: e.arc || 90, hit });
        }
        break;
      }
      case 'aoe': {
        const n = e.count || 1;
        for (let i = 0; i < n; i++) {
          let x = aim.x, z = aim.z;
          if (e.at === 'self') { x = u.x; z = u.z; }
          if (e.at === 'target' && aim.tid) { const t = unitById(st, aim.tid); if (t) { x = t.x; z = t.z; } }
          if (e.scatter && n > 1) { x += (st.rng.next() - 0.5) * 2 * e.scatter; z += (st.rng.next() - 0.5) * 2 * e.scatter; }
          let pw = e.power * mult; if (e.lastMul && i === n - 1) pw *= e.lastMul;
          const job = { kind: 'aoe', u: u.id, x, z, r: e.r * (sk.charge && sk.charge.grow ? grow : 1), follow: e.at === 'self', at: e.at, tid: aim.tid, hit: Object.assign({}, base, { power: pw, aura: e.aura, knock: e.knock || 1, up: e.up, status: e.status, destroy: e.destroy, crack: e.crack }) };
          const delay = (e.delay || 0) + (e.interval || 0) * i;
          if (delay > 0) { st.pending.push(Object.assign(job, { at: st.t + delay })); ev(st, 'aoeWarn', { x, z, r: job.r, delay, elem: sk.elem, side: u.side }); }
          else runAoe(st, job);
        }
        break;
      }
      case 'cone': {
        const hit = Object.assign({}, base, { power: e.power * mult, aura: e.aura, knock: e.knock || 1, status: e.status });
        const half = (e.arc || 70) * Math.PI / 360;
        for (const o of enemiesOf(st, u)) {
          const d = len(o.x - u.x, o.z - u.z) - o.r;
          if (d > e.range) continue;
          if (Math.abs(angleDiff(Math.atan2(aim.dx, aim.dz), Math.atan2(o.x - u.x, o.z - u.z))) > half + 0.15) continue;
          applyHit(st, u, o, Object.assign({}, hit, { dir: dirTo(u, o) }));
        }
        ev(st, 'cone', { u: u.id, dx: aim.dx, dz: aim.dz, range: e.range, arc: e.arc, elem: sk.elem, fx: sk.fx });
        hitProps(st, u.x + aim.dx * e.range * 0.5, u.z + aim.dz * e.range * 0.5, e.range * 0.5, e.power * mult * 0.5, u);
        break;
      }
      case 'line': {
        const job = { kind: 'line', u: u.id, x: u.x, z: u.z, dx: aim.dx, dz: aim.dz, range: e.range, width: e.width, hit: Object.assign({}, base, { power: e.power * mult, aura: e.aura, knock: e.knock || 1, up: e.up, status: e.status, destroy: e.destroy }) };
        if (e.delay) { st.pending.push(Object.assign(job, { at: st.t + e.delay })); ev(st, 'lineWarn', { x: job.x, z: job.z, dx: job.dx, dz: job.dz, range: e.range, width: e.width, delay: e.delay, elem: sk.elem }); }
        else runLine(st, job);
        break;
      }
      case 'zone': {
        let x = aim.x, z = aim.z; if (e.at === 'self') { x = u.x; z = u.z; }
        addZone(st, { kind: e.kind, x, z, r: e.r, dur: e.dur, owner: u.id, side: u.side, tick: e.tick, pull: e.pull, enemy: e.enemy, elem: sk.elem, mult });
        break;
      }
      case 'dash': {
        if (e.leap) { const d = len(aim.x - u.x, aim.z - u.z); u.dash = { dx: aim.dx, dz: aim.dz, speed: d / 0.28, t: 0.28, kind: 'leap', leap: true }; ev(st, 'leap', { u: u.id, x: aim.x, z: aim.z }); break; }
        const sp = e.speed || 16;
        u.dash = { dx: aim.dx, dz: aim.dz, speed: sp, t: e.dist / sp, kind: 'skill', hit: Object.assign({}, base, { power: e.power * mult, aura: e.aura, knock: e.knock || 2, r: e.r || 1 }), hitSet: new Set(), trail: e.trail, trailT: 0 };
        if (e.iframe) u.iframes = Math.max(u.iframes, e.dist / sp + 0.05);
        break;
      }
      case 'heal': {
        const who = e.who === 'team' ? alliesOf(st, u) : e.who === 'target' ? [unitById(st, aim.tid) || u] : [u];
        for (const w of who) {
          if (!alive(w)) continue;
          if (e.rewind) { const past = w.hpHist.find((h) => st.t - h.t >= e.rewind - 0.05) || w.hpHist[0]; if (past) heal(st, u, w, Math.max(0, past.hp - w.hp)); continue; }
          const amt = w.maxHp * e.k * (u.mods.healMul || 1) * (0.85 + u.stats.elm * 0.02);
          if (e.over) addStatus(st, w, { s: 'regen', dur: e.over, k: amt / e.over, src: u.id });
          else heal(st, u, w, amt);
        }
        ev(st, 'healFx', { u: u.id, who: who.map((w) => w.id) });
        break;
      }
      case 'buff': {
        const who = e.who === 'team' ? alliesOf(st, u) : [u];
        for (const w of who) {
          if (e.s === 'shield') { w.shield = Math.max(w.shield, w.maxHp * e.k * (u.mods.shieldMul || 1)); w.shieldT = e.dur || 7; ev(st, 'shield', { u: w.id }); }
          else if (e.s === 'energy') w.energy = Math.min(100, w.energy + e.k);
          else if (e.s === 'cleanse') { w.st = w.st.filter((x) => !['poison', 'burn', 'slow', 'root', 'defdown', 'curse', 'blind', 'confuse', 'radiation'].includes(x.s)); ev(st, 'cleanse', { u: w.id }); }
          else if (e.s === 'phase') { w.iframes = Math.max(w.iframes, e.dur); addBuff(w, 'phase', 1, e.dur); }
          else if (e.s === 'guard') { addBuff(w, 'guard', e.k, e.dur, { counter: e.counter }); ev(st, 'anim', { u: w.id, mode: 'guard' }); }
          else addBuff(w, e.s, e.k ?? 1, e.dur ?? 6, { n: e.n });
        }
        ev(st, 'buffFx', { u: u.id, s: e.s, elem: sk.elem });
        break;
      }
      case 'wall': {
        if (e.ring) {
          const t = aim.tid ? unitById(st, aim.tid) : null; const cx = t ? t.x : aim.x, cz = t ? t.z : aim.z;
          for (let i = 0; i < 6; i++) { const a0 = (i / 6) * TAU, a1 = ((i + 1) / 6) * TAU; addWall(st, u, cx + Math.sin(a0) * e.r, cz + Math.cos(a0) * e.r, cx + Math.sin(a1) * e.r, cz + Math.cos(a1) * e.r, e.hp, e.dur); }
        } else {
          const px = -aim.dz, pz = aim.dx, hl = e.len / 2;
          addWall(st, u, aim.x - px * hl, aim.z - pz * hl, aim.x + px * hl, aim.z + pz * hl, e.hp * (u.mods.wallHp || 1), e.dur);
        }
        break;
      }
      case 'pull': {
        if (e.who === 'target') { const t = unitById(st, aim.tid); if (alive(t) && !t.mods.knockImmune) { const [dx, dz] = dirTo(t, u); const d = Math.max(0, Math.min(e.k, len(t.x - u.x, t.z - u.z) - t.r - u.r - 0.4)); t.x += dx * d; t.z += dz * d; ev(st, 'pull', { u: u.id, tgt: t.id }); } }
        else for (const o of enemiesOf(st, u)) { const d = len(o.x - u.x, o.z - u.z); if (d > e.range || o.mods.knockImmune) continue; const [dx, dz] = dirTo(o, u); const m = Math.min(e.k, d - o.r - u.r - 0.3); if (m > 0) { o.x += dx * m; o.z += dz * m; } }
        break;
      }
      case 'summon': {
        if (e.kind === 'trap') st.traps.push({ id: 'tr' + st.nextId++, x: aim.x, z: aim.z, r: e.r, t: e.dur, arm: 0.7, owner: u.id, side: u.side, hit: Object.assign({}, base, { power: e.power * mult, aura: e.aura, status: e.status, knock: 0.5 }) });
        if (e.kind === 'clone') { st.clones.push({ id: 'cl' + st.nextId++, owner: u.id, x: u.x, z: u.z, face: u.face, t: e.dur, k: e.k }); ev(st, 'clone', { u: u.id }); }
        break;
      }
      case 'status': {
        if (e.who === 'aoe') for (const o of enemiesOf(st, u)) { if (len(o.x - u.x, o.z - u.z) <= e.r) addStatus(st, o, { s: e.s, dur: e.dur, k: e.k, src: u.id }); }
        else { const t = unitById(st, aim.tid); if (alive(t)) addStatus(st, t, { s: e.s, dur: e.dur, k: e.k, src: u.id }); }
        break;
      }
      case 'mark': {
        for (const o of enemiesOf(st, u)) if (len(o.x - u.x, o.z - u.z) <= e.r) { addStatus(st, o, { s: 'mark', dur: e.dur, k: e.k, src: u.id }); if (o.act && o.act.phase === 'charge') interrupt(st, o); }
        ev(st, 'sonar', { u: u.id, r: e.r });
        break;
      }
      default: break;
    }
  }
  if (kin) { /* kindle charges consumed on hits */ }
}

function meleeSweep(st, u, reach, arcDeg, hit) {
  const half = arcDeg * Math.PI / 360;
  let any = false;
  for (const o of enemiesOf(st, u)) {
    const d = len(o.x - u.x, o.z - u.z) - o.r - u.r;
    if (d > reach) continue;
    if (Math.abs(angleDiff(u.face, Math.atan2(o.x - u.x, o.z - u.z))) > half + 0.2 && d > 0.15) continue;
    applyHit(st, u, o, Object.assign({}, hit, { dir: dirTo(u, o) }));
    any = true;
  }
  hitProps(st, u.x + Math.sin(u.face) * reach * 0.6, u.z + Math.cos(u.face) * reach * 0.6, reach * 0.6, hit.power, u);
  if (!any) ev(st, 'whiff', { u: u.id });
}
function runAoe(st, job) {
  const u = unitById(st, job.u); if (!u) return;
  let x = job.x, z = job.z;
  if (job.follow && alive(u)) { x = u.x; z = u.z; }
  if (job.at === 'target' && job.tid) { const t = unitById(st, job.tid); if (alive(t)) { x = t.x; z = t.z; } }
  aoeHit(st, u, x, z, job.r, job.hit);
  ev(st, 'burst', { x, z, r: job.r, elem: job.hit.elem, skill: job.hit.skill, crack: job.hit.crack, up: job.hit.up });
}
function runLine(st, job) {
  const u = unitById(st, job.u); if (!u) return;
  const ex = job.x + job.dx * job.range, ez = job.z + job.dz * job.range;
  for (const o of enemiesOf(st, u)) if (segCircle(job.x, job.z, ex, ez, o.x, o.z, o.r + job.width / 2)) applyHit(st, u, o, Object.assign({}, job.hit, { dir: [job.dx, job.dz] }));
  if (job.hit.destroy) for (const p of st.arena.props) if (p.alive && segCircle(job.x, job.z, ex, ez, p.x, p.z, p.r + job.width / 2)) damageProp(st, p, job.hit.power * 2, u);
  ev(st, 'line', { x: job.x, z: job.z, dx: job.dx, dz: job.dz, range: job.range, width: job.width, elem: job.hit.elem, skill: job.hit.skill });
}
function aoeHit(st, u, x, z, r, hit) {
  for (const o of st.units) {
    if (!alive(o) || o.side === u.side || o.id === hit.exclude) continue;
    if (len(o.x - x, o.z - z) - o.r > r) continue;
    const dx = o.x - x, dz = o.z - z, l = Math.hypot(dx, dz) || 1;
    applyHit(st, u, o, Object.assign({}, hit, { dir: [dx / l, dz / l], parryable: false }));
  }
  if (hit.destroy !== false) hitProps(st, x, z, r, hit.power * (hit.destroy ? 2 : 0.6), u);
}

// ------------------------------------------------------------------ ultimate / spectral / team
function beginUlt(st, u, c) {
  // ultimates are bonded-only; using one ends the bond (when the move finishes)
  if (!canAct(u) || !u.ultSkill || u.ult < 100 || u.act || (st.rules.bond && !u.bonded)) return false;
  const sk = SKILLS[u.ultSkill];
  const aim = resolveAim(st, u, sk, c);
  if (aim.face != null) u.face = aim.face;
  u.ult = 0;
  st.stats.ults++;
  u.k.uses[sk.id] = (u.k.uses[sk.id] || 0) + 1;
  u.act = { kind: 'ult', sk, phase: 'qte', t: 0, w: 0.35, a: 0, r: 0.5, aim, lock: true };
  const T = st.trainers.find((t) => t.id === u.trainer);
  ev(st, 'ult', { u: u.id, skill: sk.id, name: skillName(u, sk.id), form: u.form });
  ev(st, 'anim', { u: u.id, anim: sk.anim || 'roar' });
  if (T && T.isPlayer && sk.qte) st.qte = { id: 'q' + st.nextId++, type: sk.qte.type, n: sk.qte.beats || sk.qte.n || 1, owner: u.id, kind: 'ult', t: 0, dur: 6 };
  else { u.act.phase = 'windup'; u.act.mult = 1; u.act.w = 0.9; u.act.tele = addTele(st, u, Object.assign({}, sk, { telegraph: 'circle', windup: 0.9 }), aim); }
  return true;
}
function teamComboStart(st, T) {
  const side = st.sides[T.side];
  if (side.meter < 100 || st.qte) return false;
  const me = unitById(st, T.active);
  if (!alive(me)) return false;
  let partner = alliesOf(st, me, false)[0] || null;
  let assist = null;
  if (!partner) { const b = T.team.map((id) => unitById(st, id)).find((x) => x && !x.onField && x.state !== 'faint' && x.hp > 0); if (b) { assist = b; partner = b; } }
  if (!partner) return false;
  side.meter = 0;
  const tgt = pickTarget(st, me, null);
  const combo = teamCombo(me.elem, partner.elem);
  st.qte = { id: 'q' + st.nextId++, type: 'timing', n: 1, owner: me.id, kind: 'team', t: 0, dur: 5, data: { a: me.id, b: partner.id, assist: assist ? assist.id : null, tid: tgt ? tgt.id : null, combo } };
  ev(st, 'teamCombo', { a: me.id, b: partner.id, assist: !!assist, name: combo.name, desc: combo.desc, tid: tgt ? tgt.id : null });
  st.stats.teamCombos++;
  return true;
}
function teamComboExec(st, q, score) {
  const d = q.data, a = unitById(st, d.a), b = unitById(st, d.b);
  let t = unitById(st, d.tid);
  if (!alive(t) && a) t = pickTarget(st, a, null);
  if (!a || !t) return;
  const combo = d.combo, mult = 0.8 + score * 0.7;
  const elmAvg = (a.stats.elm + (b ? b.stats.elm : a.stats.elm)) / 2;
  const power = 22 * combo.k * mult * (1 + elmAvg * ATK_K) / (1 + a.stats.elm * ATK_K);
  for (const o of enemiesOf(st, a)) {
    if (len(o.x - t.x, o.z - t.z) - o.r > combo.r) continue;
    applyHit(st, a, o, { power, scale: 'elm', elem: a.elem, aura: 2, knock: 4, up: 4, kind: 'team', parryable: false, status: combo.status ? { s: combo.status, dur: combo.status === 'sleep' ? 2.4 : 1.2, k: 0.4 } : null, dir: dirTo(t, o) });
    if (b && b.elem !== a.elem && alive(o)) applyHit(st, b.onField ? b : a, o, { power: power * 0.35, scale: 'elm', elem: b.elem, aura: 2, knock: 1, kind: 'team', parryable: false });
  }
  if (combo.heal) for (const al of alliesOf(st, a)) heal(st, a, al, al.maxHp * combo.heal);
  hitProps(st, t.x, t.z, combo.r, power * 2, a);
  for (const m of [a, b]) if (m) m.k.teamCombos++;
  ev(st, 'teamComboHit', { a: a.id, b: b ? b.id : null, x: t.x, z: t.z, r: combo.r, name: combo.name, fx: combo.fx, score });
  st.slowmo = Math.max(st.slowmo, 0.6);
}

// ------------------------------------------------------------------ switching & items & capture
// A switch recalls the active Tokonmon at once and leaves the trainer's spot
// on the field EMPTY for rules.switchTime (7 s) while the incoming one comes
// through the gate — the other team can charge, buff and set up meanwhile.
// After a faint, sending the next one out takes rules.sendOut and no cooldown.
function doSwitch(st, T, toId) {
  if (!st.rules.canSwitch || T.switching || st.qte) return false;
  const out = unitById(st, T.active);
  const forced = !out || out.state === 'faint' || out.hp <= 0;
  if (!forced && T.switchCd > 0) return false;
  const inn = unitById(st, toId) || T.team.map((id) => unitById(st, id)).find((x) => x && !x.onField && x.hp > 0 && x.state !== 'faint');
  if (!inn || inn.onField || inn.hp <= 0 || inn.state === 'faint' || inn.trainer !== T.id) return false;
  if (out && out.state === 'grabbed') return false;
  let relay = null, at = null;
  if (out && alive(out)) {
    if (out.bonded) endBond(st, out, 'switch');
    if (out.grab) releaseGrab(st, out);
    for (const t of st.tele.filter((x) => x.owner === out.id)) removeTele(st, t.id);
    at = { x: out.x, z: out.z };
    relay = out.aura || out.elem ? { elem: out.elem, from: out.id } : null;
    out.onField = false; out.state = 'out'; out.act = null; out.cmd = null; out.dash = null; out.charge = null; out.target = null; out.order = null;
    out.wasOut = true;
    ev(st, 'recall', { u: out.id, trainer: T.id, x: at.x, z: at.z });
  }
  T.pendingSwitch = 0;
  const dur = forced ? st.rules.sendOut : st.rules.switchTime;
  T.switching = { to: inn.id, t: 0, dur, forced, relay, from: out ? out.id : null };
  if (dur <= 0) { completeSwitch(st, T); return true; }
  ev(st, 'switchStart', { trainer: T.id, out: out && !forced ? out.id : null, in: inn.id, dur, forced });
  return true;
}
function completeSwitch(st, T) {
  const sw = T.switching;
  T.switching = null;
  const inn = sw && unitById(st, sw.to);
  if (!inn || inn.hp <= 0 || inn.state === 'faint') return false;
  inn.x = T.gate.x; inn.z = T.gate.z; inn.face = T.side === 0 ? Math.PI : 0;
  inn.onField = true; inn.state = 'idle'; inn.iframes = 0.6; inn.act = null; inn.cmd = null; inn.energy = Math.max(inn.energy, 40);
  inn.inAt = st.t; inn.order = null; inn.obey = 0;
  inn.relay = sw.relay ? Object.assign({ t: st.t }, sw.relay) : null;
  if (T.isPlayer && st.rules.orders) inn.auto = true;
  if (inn.wasOut && inn.modsBase.comeback) { inn.comeback = inn.modsBase.comeback; ev(st, 'comebackReady', { u: inn.id }); }
  T.active = inn.id;
  if (!sw.forced) T.switchCd = st.rules.switchCd;
  pushHist(st, inn, 'switch');
  st.stats.switches++;
  ev(st, 'switch', { trainer: T.id, out: sw.from, in: inn.id, forced: sw.forced });
  ev(st, 'anim', { u: inn.id, anim: 'spawn' });
  return true;
}
// remaining switch time for the UI (0 when not switching)
export const switchLeft = (T) => (T && T.switching ? Math.max(0, T.switching.dur - T.switching.t) : 0);
export const ITEMS_BATTLE = { takoyaki: { heal: 0.3 }, okonomiyaki: { heal: 0.6 }, ramune: { energy: 60 }, matcha: { ult: 35 }, revive_onigiri: { revive: 0.4 } };
function useItem(st, T, id) {
  if (!st.rules.items || T.itemCd > 0 || !(T.items[id] > 0)) return false;
  const it = ITEMS_BATTLE[id]; if (!it) return false;
  const u = unitById(st, T.active); if (!u) return false;
  if (it.revive) { const f = T.team.map((x) => unitById(st, x)).find((x) => x.state === 'faint'); if (!f) return false; f.state = 'out'; f.hp = Math.round(f.maxHp * it.revive); }
  else if (!alive(u)) return false;
  if (it.heal) heal(st, u, u, u.maxHp * it.heal);
  if (it.energy) u.energy = Math.min(100, u.energy + it.energy);
  if (it.ult) u.ult = Math.min(100, u.ult + it.ult);
  T.items[id]--; T.itemCd = 6;
  st.used.items.push(id);
  ev(st, 'item', { trainer: T.id, id, u: u.id });
  return true;
}
export function captureChance(st, tgt, gemMul = 1) {
  const sp = SPECIES[tgt.species];
  if (!sp || sp.beast || !sp.catch) return 0;
  const hpF = tgt.hp / tgt.maxHp;
  let c = sp.catch * (1.25 - hpF * 0.9) * gemMul;
  if (has(tgt, 'sleep') || has(tgt, 'frozen')) c *= 1.6; else if (has(tgt, 'stun') || has(tgt, 'root')) c *= 1.3;
  if (st.flags.ambush) c *= 1.25;
  if (st.flags.angry) c *= 0.6;
  return clamp(c, 0.01, 0.96);
}
function captureStart(st, T, gem, gemMul) {
  if (!st.rules.capture || st.qte) return false;
  const tgt = st.units.find((o) => o.side !== T.side && alive(o));
  if (!tgt) return false;
  const chance = captureChance(st, tgt, gemMul);
  if (chance <= 0) { ev(st, 'captureImmune', { tgt: tgt.id }); return false; }
  st.used.gems.push(gem);
  st.qte = { id: 'q' + st.nextId++, type: 'timing', n: 1, owner: T.active, kind: 'capture', t: 0, dur: 4, data: { tid: tgt.id, chance, gem } };
  ev(st, 'captureThrow', { trainer: T.id, tgt: tgt.id, gem, chance });
  return true;
}
function captureResolve(st, q, score) {
  const d = q.data, tgt = unitById(st, d.tid);
  if (!tgt) return;
  const chance = clamp(d.chance * (0.85 + score * 0.55), 0.01, 0.98);
  const shakes = [st.rng.next(), st.rng.next(), st.rng.next()];
  const per = Math.pow(chance, 1 / 3);
  let n = 0; while (n < 3 && shakes[n] < per) n++;
  const ok = n === 3;
  tgt.capture = { t: 0, shakes: n, ok };
  tgt.state = 'captured'; tgt.act = null; tgt.dash = null;
  ev(st, 'captureShake', { tgt: tgt.id, shakes: n, ok, chance });
}

// ------------------------------------------------------------------ QTE resolution
// score: 0..1 (1 = all perfect). For mash/escape: 1 = escaped.
export function resolveQte(st, id, score) {
  const q = st.qte;
  if (!q || q.id !== id) return false;
  st.qte = null;
  score = clamp01(score);
  ev(st, 'qteResult', { kind: q.kind, score });
  if (q.kind === 'ult') {
    const u = unitById(st, q.owner);
    if (u && u.act && u.act.kind === 'ult') { u.act.phase = 'windup'; u.act.t = 0; u.act.mult = 0.75 + score * 0.75; u.act.w = 0.25; }
  } else if (q.kind === 'team') teamComboExec(st, q, score);
  else if (q.kind === 'capture') captureResolve(st, q, score);
  else if (q.kind === 'escape') {
    const u = unitById(st, q.owner);
    if (u && u.state === 'grabbed' && score >= 0.99) { const g = unitById(st, u.grabbedBy); if (g) releaseGrab(st, g, 0.5); u.iframes = 0.4; ev(st, 'escape', { u: u.id }); }
  }
  return true;
}

// ------------------------------------------------------------------ hits & damage
function onBeat(st, u) {
  const period = 60 / st.beat.bpm;
  const ph = (st.beat.t % period) / period;
  const dist = Math.min(ph, 1 - ph) * period;
  return dist <= (u.mods.beatWindow || 0.11);
}

export function applyHit(st, src, tgt, h) {
  if (!alive(tgt) || tgt.state === 'captured') return 0;
  const isDot = h.kind === 'dot' || h.kind === 'zone';
  // invulnerable / dodge
  if (!isDot && (tgt.iframes > 0 || buffOf(tgt, 'phase'))) {
    if (tgt.dodgeAge < PERFECT_DODGE && !tgt.perfectDodged) {
      tgt.perfectDodged = true; pushHist(st, tgt, 'dodge!'); st.stats.perfectDodges++;
      st.sides[tgt.side].meter = Math.min(100, st.sides[tgt.side].meter + 12);
      st.slowmo = Math.max(st.slowmo, 0.55);
      ev(st, 'perfectDodge', { u: tgt.id, src: src ? src.id : null });
    } else ev(st, 'miss', { u: tgt.id });
    return 0;
  }
  // parry
  if (!isDot && h.parryable && tgt.parryT > 0 && src) { parrySuccess(st, tgt, src, h); return 0; }
  // blind → miss chance for attacker
  if (!isDot && src && has(src, 'blind') && st.rng.chance(h.kind === 'basic' ? 0.35 : 0.25)) { ev(st, 'miss', { u: tgt.id, blind: true }); return 0; }
  let mult = h.mult || 1;
  // guard (frontal block)
  const guard = buffOf(tgt, 'guard');
  if (!isDot && guard && src) {
    const toSrc = Math.atan2(src.x - tgt.x, src.z - tgt.z);
    if (Math.abs(angleDiff(tgt.face, toSrc)) < 1.3) { mult *= 1 - guard.k; tgt.k.blocked++; ev(st, 'guardBlock', { u: tgt.id }); guard.blocked = (guard.blocked || 0) + 1; }
  }
  // reaction check (before damage so multipliers apply)
  let rx = null;
  if (h.elem && (h.aura || 0) > 0 && !isDot) {
    if (tgt.aura && tgt.aura.e !== h.elem && tgt.aura.t > 0) rx = reactionFor(tgt.aura.e, h.elem);
    if (rx) for (const f of rx.fx) if (f.mult) mult *= f.mult.k;
  }
  // damage
  let crit = !!h.crit;
  const focus = src && h.kind !== 'basic' ? buffOf(src, 'focus') : null;
  if (focus && h.crit === 'center') { crit = true; focus.n--; if (focus.n <= 0) focus.t = 0; }
  if (h.precise) crit = true;
  const quick = src && buffOf(src, 'quicken'); if (quick && !isDot) crit = true;
  // natural critical hits (Speed and passives raise the chance)
  if (!crit && src && !isDot && h.kind !== 'reaction' && h.kind !== 'team' && h.flat == null && st.rng.chance(0.04 + src.stats.spd * 0.002 + (src.mods.critChance || 0))) crit = true;
  // comeback punch: the first hit after returning from a switch
  let comeback = false;
  if (src && src.comeback > 0 && !isDot && h.kind !== 'reaction' && h.kind !== 'clone') { mult *= 1 + src.comeback; src.comeback = 0; comeback = true; h = Object.assign({}, h, { knock: (h.knock || 0) + 3 }); }
  let dmg;
  if (h.flat != null) dmg = h.flat;
  else {
    const atk = src ? atkStat(src, h.scale) : 10;
    dmg = h.power * (1 + atk * ATK_K);
    dmg *= 1 / (1 + defStat(tgt) * DEF_K);
  }
  const eff = h.elem ? effectiveness(h.elem, tgt.elems) : 1;
  dmg *= eff * mult;
  dmg *= tgt.mods.takenMul || 1;
  const rt = buffOf(tgt, 'riled'); if (rt && !isDot) dmg *= 1 + rt.k;
  if (src) {
    if (st.arena.boost && h.elem === st.arena.boost) dmg *= 1.2;
    if (st.arena.type === 'water' && h.elem === 'pyro') dmg *= 0.85;
    dmg *= (src.mods.dmgMul || 1) * (h.scale === 'phys' ? (src.mods.physMul || 1) : (src.mods.elmMul || 1));
    const rs = buffOf(src, 'riled'); if (rs && !isDot) dmg *= 1 + rs.k;
    const kin = buffOf(src, 'kindle');
    if (kin && !isDot && h.kind !== 'reaction') { dmg *= 1 + kin.k; h.elem = h.elem || 'pyro'; h.aura = Math.max(h.aura || 0, 0.6); kin.n--; if (kin.n <= 0) kin.t = 0; }
    if (src.mods.lowHpDmg && src.hp < src.maxHp * 0.4) dmg *= 1 + src.mods.lowHpDmg;
    const wk = stOf(src, 'weaken'); if (wk) dmg *= 1 - wk.k;
    if (h.beat && !h.beatApplied && onBeat(st, src) && !isDot) { dmg *= src.mods.beatMul || 1.3; src.k.beats++; st.stats.beats++; src.rhythm = Math.min(100, src.rhythm + 10); ev(st, 'onBeat', { u: src.id }); }
    const grp = alliesOf(st, src, false).some((a) => a.mods.groupie && len(a.x - src.x, a.z - src.z) < 5); if (grp) dmg *= 1.1;
  }
  const mark = stOf(tgt, 'mark'); if (mark) dmg *= 1 + mark.k;
  const curse = stOf(tgt, 'curse'); if (curse) dmg *= 1 + curse.k;
  if (has(tgt, 'sleep') && !isDot) { dmg *= 1 + (src && src.mods.wakeDmg ? src.mods.wakeDmg : 0.15); removeSt(tgt, 'sleep'); ev(st, 'wake', { u: tgt.id }); }
  if (has(tgt, 'frozen') && !isDot && (h.scale === 'phys' || h.kind === 'basic')) { dmg *= 1.6; removeSt(tgt, 'frozen'); ev(st, 'shatter', { u: tgt.id }); }
  if (crit) dmg *= 1.5 + (src && src.mods.critDmg ? src.mods.critDmg : 0);
  dmg *= 0.95 + st.rng.next() * 0.1;
  if (tgt.boss) dmg *= 0.85;
  if (h.flat == null) dmg *= DMG_SCALE;
  dmg = Math.max(1, Math.round(dmg));
  if (st.rules.noFaint && tgt.side === 0) dmg = Math.min(dmg, Math.max(0, tgt.hp - 1));
  // shield
  let absorbed = 0;
  if (tgt.shield > 0) { absorbed = Math.min(tgt.shield, dmg); tgt.shield -= absorbed; dmg -= absorbed; }
  tgt.hp -= dmg;
  const total = dmg + absorbed;
  if (src) {
    src.k.dealt += total;
    if (h.crit === 'center' || h.precise) { if (crit) { src.k.precise++; st.stats.precise++; } }
    if (crit && !isDot) { src.k.crits++; st.stats.crits++; }
    if (h.skill) src.k.hits[h.skill] = (src.k.hits[h.skill] || 0) + 1;
    if (src.mods.lifesteal && !isDot) heal(st, src, src, total * src.mods.lifesteal);
  }
  tgt.k.taken += total;
  // meters (the ultimate gauge only fills while BONDED)
  const ultOn = (u) => !st.rules.bond || u.bonded;
  if (src && !isDot) {
    if (h.kind === 'basic') src.energy = Math.min(100, src.energy + 5);
    if (ultOn(src)) src.ult = Math.min(100, src.ult + (total / tgt.maxHp) * 75 * (src.mods.ultGain || 1));
    st.sides[src.side].meter = Math.min(100, st.sides[src.side].meter + 2.5 * (src.mods.teamGain || 1) + (h.kind === 'skill' ? 1.5 : 0));
    if (src.elems.includes('pyro') && h.elem === 'pyro') src.heat = Math.min(100, src.heat + total * 0.6 * (src.mods.heatGain || 1));
    // sync hits: allied hit on the same target within 0.6s
    if (tgt.lastHitBy && tgt.lastHitBy.side === src.side && tgt.lastHitBy.id !== src.id && st.t - tgt.lastHitBy.t < 0.6) { st.sides[src.side].meter = Math.min(100, st.sides[src.side].meter + 6); ev(st, 'sync', { a: src.id, b: tgt.lastHitBy.id, tgt: tgt.id }); }
    tgt.lastHitBy = { id: src.id, side: src.side, t: st.t };
    if (src.snap.spectral && src.bonded && src.final) src.soul = Math.min(100, src.soul + (total / tgt.maxHp) * 30);
    if (src.mods.burnOnHit && st.rng.chance(src.mods.burnOnHit) && alive(tgt)) addStatus(st, tgt, { s: 'burn', dur: 3, k: 0.25, src: src.id, srcElm: src.stats.elm });
  }
  if (ultOn(tgt)) tgt.ult = Math.min(100, tgt.ult + (total / tgt.maxHp) * 45 * (tgt.mods.ultGain || 1));
  if (!isDot) tgt.energy = Math.min(100, tgt.energy + 3);
  if (tgt.snap.spectral && tgt.bonded && tgt.final) tgt.soul = Math.min(100, tgt.soul + (total / tgt.maxHp) * 55);
  if (tgt.mods.mosh && !isDot) addBuff(tgt, 'mosh', tgt.mods.mosh, 3);
  ev(st, 'hit', { src: src ? src.id : null, tgt: tgt.id, dmg: total, crit, eff, elem: h.elem || null, kind: h.kind, precise: crit && (h.crit === 'center' || h.precise), absorbed, x: tgt.x, z: tgt.z, combo: h.combo || null, skill: h.skill || null, comeback, bonded: !!(src && src.bonded) });
  if (comeback) ev(st, 'comebackPunch', { u: src.id, tgt: tgt.id });
  // drowning: a soaked Tokonmon hit by more water
  if (h.elem === 'hydro' && !isDot && tgt.aura && tgt.aura.e === 'hydro' && tgt.aura.amt >= 1.5 && !tgt.elems.includes('hydro')) {
    ev(st, 'drowned', { u: tgt.id, src: src ? src.id : null });
    addStatus(st, tgt, { s: 'slow', dur: 1.5, k: 0.35, src: src ? src.id : null });
  }
  // reflect / ember skin
  if (src && !isDot && h.kind !== 'reaction' && len(src.x - tgt.x, src.z - tgt.z) < 3) {
    if (tgt.mods.reflect) applyHit(st, tgt, src, { flat: Math.max(1, Math.round(total * tgt.mods.reflect)), kind: 'dot' });
    if (tgt.mods.emberSkin) addStatus(st, src, { s: 'burn', dur: 2, k: tgt.mods.emberSkin, src: tgt.id });
  }
  // clone echo
  if (src && !isDot && h.kind !== 'clone' && h.kind !== 'reaction') {
    for (const c of st.clones) if (c.owner === src.id) st.pending.push({ at: st.t + 0.22, kind: 'clonehit', u: src.id, tgt: tgt.id, hit: Object.assign({}, h, { power: (h.power || 0) * c.k, flat: h.flat != null ? h.flat * c.k : undefined, kind: 'clone', aura: 0, parryable: false }), cx: c.x, cz: c.z });
    if (src.mods.reverb && st.rng.chance(src.mods.reverb)) st.pending.push({ at: st.t + 0.3, kind: 'clonehit', u: src.id, tgt: tgt.id, hit: Object.assign({}, h, { power: (h.power || 0) * 0.4, kind: 'clone', aura: 0, parryable: false }) });
  }
  // reaction effects / aura application
  if (rx) doReaction(st, src, tgt, rx, h);
  else if (h.elem && (h.aura || 0) > 0 && !isDot) {
    if (tgt.aura && tgt.aura.e === h.elem) { tgt.aura.amt = Math.min(2, tgt.aura.amt + h.aura); tgt.aura.t = 6; }
    else if (!tgt.aura || tgt.aura.t <= 0) { tgt.aura = { e: h.elem, amt: h.aura, t: 6, src: src ? src.id : null }; ev(st, 'aura', { u: tgt.id, e: h.elem }); }
  }
  if (h.relay && src) { st.sides[src.side].meter = Math.min(100, st.sides[src.side].meter + 8); ev(st, 'relay', { u: src.id }); }
  // status
  if (h.status && alive(tgt) && (!h.status.chance || st.rng.chance(h.status.chance))) addStatus(st, tgt, Object.assign({}, h.status, { src: src ? src.id : null, srcElm: src ? src.stats.elm : 10 }));
  // knockback
  if (!isDot && (h.knock || h.up) && !tgt.mods.knockImmune && tgt.state !== 'grabbed') {
    let dx, dz;
    if (h.dir) [dx, dz] = h.dir; else if (src) [dx, dz] = dirTo(src, tgt); else { dx = 0; dz = 1; }
    let k = (h.knock || 0) * (src && buffOf(src, 'amp') ? 2 : 1);
    if (tgt.boss) k *= 0.35;
    const imp = k * 2.2 / Math.sqrt(tgt.mass);
    tgt.vx += dx * imp; tgt.vz += dz * imp;
    if (imp > 5 && !tgt.boss) { tgt.state = 'knock'; tgt.act = null; tgt.charge = null; if (tgt.act && tgt.act.tele) removeTele(st, tgt.act.tele); }
    if (h.up) { tgt.vy = (tgt.vy || 0) + h.up; tgt.airborne = true; }
  }
  // hit stun / interrupt (heavy hits interrupt windups)
  if (!isDot && alive(tgt) && tgt.act && tgt.act.phase === 'windup' && (h.knock >= 3 || crit) && !tgt.boss) interrupt(st, tgt);
  if (!isDot) ev(st, 'anim', { u: tgt.id, anim: total > tgt.maxHp * 0.2 ? 'bigHit' : 'hit' });
  st.hitstop = Math.max(st.hitstop || 0, crit || total > tgt.maxHp * 0.18 ? 0.09 : h.kind === 'basic' ? 0.03 : 0.05);
  if (tgt.hp <= 0) faint(st, tgt, src);
  return total;
}

function parrySuccess(st, def, att, h) {
  const perfect = def.parryAge < PERFECT_PARRY || h.heavy;
  def.parryT = 0; def.parryCd = 0;
  def.k.blocked++;
  pushHist(st, def, 'parry!');
  if (def.grab) def.grab.parried = true;
  st.sides[def.side].meter = Math.min(100, st.sides[def.side].meter + (perfect ? 12 : 7));
  def.ult = Math.min(100, def.ult + (perfect ? 10 : 5));
  if (perfect) { st.stats.perfectParries++; st.slowmo = Math.max(st.slowmo, 0.45); }
  if (att && h.kind !== 'proj') {
    const dur = (perfect ? 1.15 : 0.6) * (att.mods.stagger || 1) * (att.boss ? 0.5 : 1);
    stun(st, att, 'stagger', dur);
    if (att.act && att.act.tele) removeTele(st, att.act.tele);
    att.act = null;
  }
  if (def.elems.includes('geo')) { const g = buffOf(def, 'guard'); if (g && g.counter && att) applyHit(st, def, att, { power: g.counter, scale: 'phys', elem: 'geo', aura: 1, knock: 3, kind: 'skill', parryable: false }); }
  ev(st, 'parry', { u: def.id, src: att ? att.id : null, perfect });
}

function doReaction(st, src, tgt, rx, h) {
  const auraE = tgt.aura ? tgt.aura.e : null;
  tgt.aura = null;
  st.stats.reactions++; st.stats.reactionIds[rx.id] = (st.stats.reactionIds[rx.id] || 0) + 1;
  if (src) { src.k.reactions++; st.sides[src.side].meter = Math.min(100, st.sides[src.side].meter + 10); }
  ev(st, 'reaction', { id: rx.id, name: rx.name, color: rx.color, x: tgt.x, z: tgt.z, tgt: tgt.id, src: src ? src.id : null, a: auraE, b: h.elem });
  const base = 22 * (1 + (src ? src.stats.elm : 10) * 0.07);
  for (const f of rx.fx) {
    if (f.burst) {
      for (const o of st.units) {
        if (!alive(o) || (src && o.side === src.side)) continue;
        if (len(o.x - tgt.x, o.z - tgt.z) - o.r > f.burst.r) continue;
        const dx = o.x - tgt.x, dz = o.z - tgt.z, l = Math.hypot(dx, dz) || 1;
        applyHit(st, src, o, { flat: Math.round(base * f.burst.k / (1 + defStat(o) * 0.03)), kind: 'reaction', knock: f.burst.knock, dir: l > 0.1 ? [dx / l, dz / l] : (src ? dirTo(src, o) : [0, 1]), parryable: false });
      }
      hitProps(st, tgt.x, tgt.z, f.burst.r, base * f.burst.k * (f.burst.destroy ? 3 : 1.2), src);
    }
    if (f.zone) addZone(st, { kind: f.zone.kind, x: tgt.x, z: tgt.z, r: f.zone.r, dur: f.zone.dur, owner: src ? src.id : null, side: src ? src.side : -1, enemy: true, react: true });
    if (f.status) {
      if (f.status.aoe) { for (const o of st.units) if (alive(o) && src && o.side !== src.side && len(o.x - tgt.x, o.z - tgt.z) < f.status.aoe) addStatus(st, o, { s: f.status.s, dur: f.status.dur, k: f.status.k, src: src.id }); }
      else addStatus(st, tgt, { s: f.status.s, dur: f.status.dur, k: f.status.k, src: src ? src.id : null });
    }
    if (f.dot) {
      addStatus(st, tgt, { s: f.dot.s, dur: f.dot.dur, k: base * f.dot.k * 0.5, src: src ? src.id : null, spread: f.dot.spread });
    }
    if (f.bloom && src) for (let i = 0; i < f.bloom.n; i++) { const a = (i / f.bloom.n) * TAU + st.rng.next(); st.seeds.push({ id: 'sd' + st.nextId++, x: tgt.x + Math.sin(a) * 1.3, z: tgt.z + Math.cos(a) * 1.3, side: src.side, heal: f.bloom.heal, t: 8 }); }
    if (f.chain && src) for (const o of enemiesOf(st, src)) { if (o === tgt || len(o.x - tgt.x, o.z - tgt.z) > f.chain.r) continue; applyHit(st, src, o, { flat: Math.round(base * f.chain.k), kind: 'reaction', parryable: false }); ev(st, 'chain', { a: tgt.id, b: o.id }); }
    if (f.pull && src) for (const o of enemiesOf(st, src)) { if (o === tgt) continue; const d = len(o.x - tgt.x, o.z - tgt.z); if (d > f.pull.r) continue; const [dx, dz] = dirTo(o, tgt); const m = Math.max(0, d - o.r - tgt.r - 0.2); o.x += dx * m * 0.8; o.z += dz * m * 0.8; }
    if (f.spread && src) for (const o of enemiesOf(st, src)) { if (o === tgt || len(o.x - tgt.x, o.z - tgt.z) > f.spread.r) continue; o.aura = { e: f.spread.aura, amt: 1, t: 6, src: src.id }; if (f.spread.poison) addStatus(st, o, { s: 'poison', dur: 4, stacks: 1, k: 0.12, src: src.id, srcElm: src.stats.elm }); }
    if (f.selfbuff && src) { if (f.selfbuff.s === 'shield') src.shield = Math.max(src.shield, src.maxHp * f.selfbuff.k); else addBuff(src, f.selfbuff.s, 1, f.selfbuff.dur || 3); }
  }
  st.slowmo = Math.max(st.slowmo, rx.id === 'steam' ? 0.35 : 0.15);
}

function heal(st, src, u, amt) {
  if (!alive(u) || amt <= 0) return 0;
  const a = Math.min(Math.round(amt), u.maxHp - u.hp);
  if (a <= 0) return 0;
  u.hp += a;
  if (src) src.k.healed += a;
  ev(st, 'heal', { u: u.id, amt: a, x: u.x, z: u.z, src: src ? src.id : null });
  return a;
}

// ------------------------------------------------------------------ statuses & buffs
export function addStatus(st, u, s) {
  if (!alive(u)) return;
  if (u.mods.immune && u.mods.immune.includes(s.s)) { ev(st, 'immune', { u: u.id, s: s.s }); return; }
  if (u.boss && ['sleep', 'frozen', 'stun', 'confuse'].includes(s.s)) s = Object.assign({}, s, { dur: (s.dur || 1) * 0.4 });
  const srcU = s.src ? unitById(st, s.src) : null;
  if (s.s === 'drowsy') {
    u.drowsy += s.dur || 0.5;
    if (u.drowsy >= 1.2) { u.drowsy = 0; addStatus(st, u, { s: 'sleep', dur: 2.8 + (srcU && srcU.mods.sleepDur ? srcU.mods.sleepDur : 0), src: s.src }); }
    return;
  }
  if (s.s === 'poison') {
    const cur = stOf(u, 'poison');
    const extra = srcU && srcU.mods.poisonStacks ? srcU.mods.poisonStacks : 0;
    const dur = (s.dur || 5) + (srcU && srcU.mods.poisonDur ? srcU.mods.poisonDur : 0);
    const per = 3 + (s.srcElm ?? 10) * 0.35;
    if (cur) { cur.stacks = Math.min(6, cur.stacks + (s.stacks || 1) + extra); cur.t = Math.max(cur.t, dur); }
    else u.st.push({ s: 'poison', t: dur, stacks: Math.min(6, (s.stacks || 1) + extra), k: per, src: s.src, tick: 1 });
    ev(st, 'status', { u: u.id, s: 'poison', src: s.src || null });
    return;
  }
  const cur = stOf(u, s.s);
  if (cur) { cur.t = Math.max(cur.t, s.dur || 1); if (s.k) cur.k = Math.max(cur.k || 0, s.k); return; }
  const rec = { s: s.s, t: s.dur || 1, k: s.k || 0, src: s.src, tick: 1, spread: s.spread };
  if (s.s === 'burn' || s.s === 'radiation') rec.k = s.k > 2 ? s.k : (4 + (s.srcElm ?? 10) * 0.4) * (s.k ? s.k * 3 : 1);
  if (s.s === 'regen') rec.k = s.k;
  u.st.push(rec);
  if (['stun', 'sleep', 'frozen'].includes(s.s)) { interrupt(st, u); if (u.grab) releaseGrab(st, u); ev(st, 'anim', { u: u.id, mode: s.s === 'frozen' ? 'frozen' : s.s }); }
  ev(st, 'status', { u: u.id, s: s.s, src: s.src || null });
}
function addBuff(u, s, k, dur, extra = {}) {
  const cur = u.buffs.find((b) => b.s === s && s !== 'mosh');
  if (cur) { cur.k = Math.max(cur.k, k); cur.t = Math.max(cur.t, dur); if (extra.n) cur.n = extra.n; Object.assign(cur, extra); return; }
  if (s === 'mosh' && u.buffs.filter((b) => b.s === 'mosh').length >= 3) { const old = u.buffs.find((b) => b.s === 'mosh'); old.t = dur; return; }
  u.buffs.push(Object.assign({ s, k, t: dur, n: extra.n ?? 0 }, extra));
}
function stun(st, u, kind, dur) {
  if (kind === 'stagger') { u.state = 'stagger'; u.stateT = dur; u.act = null; u.charge = null; ev(st, 'stagger', { u: u.id, dur }); ev(st, 'anim', { u: u.id, anim: 'bigHit' }); }
}
function interrupt(st, u) {
  if (u.act && u.act.tele) removeTele(st, u.act.tele);
  if (u.act && !u.act.lock) { u.act = null; ev(st, 'interrupt', { u: u.id }); }
  u.charge = null;
}

// ------------------------------------------------------------------ projectiles, zones, walls, props
function spawnProj(st, u, p, dx, dz) {
  const blind = has(u, 'blind');
  if (blind) { const a = Math.atan2(dx, dz) + (st.rng.next() - 0.5) * 0.9; dx = Math.sin(a); dz = Math.cos(a); }
  const pr = Object.assign({ id: 'pr' + st.nextId++, owner: u.id, side: u.side, x: u.x + dx * (u.r + 0.2), z: u.z + dz * (u.r + 0.2), dx, dz, dist: 0, hits: new Set(), y0: 0.5 }, p);
  if (pr.arc) { const tx = p.tx ?? (u.x + dx * 6), tz = p.tz ?? (u.z + dz * 6); pr.arcLen = Math.max(1.5, len(tx - pr.x, tz - pr.z)); pr.range = pr.arcLen; }
  st.proj.push(pr);
  ev(st, 'proj', { id: pr.id, u: u.id, sprite: pr.sprite, elem: pr.elem });
  return pr;
}
function stepProj(st, dt) {
  for (let i = 0; i < st.proj.length; i++) {
    const p = st.proj[i];
    const owner = unitById(st, p.owner);
    if (p.homing) { const t = p.tid ? unitById(st, p.tid) : null; if (alive(t)) { const [hx, hz] = dirTo(p, t); const k = Math.min(1, p.homing * dt); p.dx += (hx - p.dx) * k; p.dz += (hz - p.dz) * k; const l = Math.hypot(p.dx, p.dz) || 1; p.dx /= l; p.dz /= l; } }
    const step = p.speed * dt;
    const ox = p.x, oz = p.z;
    p.x += p.dx * step; p.z += p.dz * step; p.dist += step;
    let dead = false;
    if (p.arc) {
      if (p.dist >= p.arcLen) { explodeProj(st, p, owner); dead = true; }
    } else {
      // walls
      for (const w of st.walls) {
        if (w.hp <= 0) continue;
        if (segSegDist(ox, oz, p.x, p.z, w.x1, w.z1, w.x2, w.z2) < p.r + 0.3) { w.hp -= p.power * 0.8; ev(st, 'wallHit', { id: w.id, x: p.x, z: p.z }); if (w.hp <= 0) breakWall(st, w); if (p.explode) explodeProj(st, p, owner); dead = !p.pierce || true; break; }
      }
      // props
      if (!dead) for (const pp of st.arena.props) {
        if (!pp.alive || !pp.solid && !pp.destructible) continue;
        if (len(pp.x - p.x, pp.z - p.z) < pp.r + p.r) { damageProp(st, pp, p.power * 0.8, owner); if (p.explode) explodeProj(st, p, owner); if (!p.pierce) { dead = true; break; } }
      }
      // units
      if (!dead) for (const o of st.units) {
        if (!alive(o) || o.side === p.side || p.hits.has(o.id)) continue;
        if (!segCircle(ox, oz, p.x, p.z, o.x, o.z, o.r + p.r)) continue;
        // parry → reflect
        if (o.parryT > 0) { parrySuccess(st, o, owner, { kind: 'proj' }); p.side = o.side; p.owner = o.id; p.dx = -p.dx; p.dz = -p.dz; p.power *= 1.25; p.hits.clear(); p.dist = 0; ev(st, 'reflect', { id: p.id, u: o.id }); break; }
        let precise = false;
        if (p.crit === 'center') {
          const ax = p.dx, az = p.dz; const rx = o.x - ox, rz = o.z - oz;
          const perp = Math.abs(rx * az - rz * ax);
          precise = perp < o.r * 0.42;
        }
        applyHit(st, owner || null, o, { power: p.power, scale: p.scale || 'elm', elem: p.elem, aura: p.aura, knock: p.knock, status: p.status, kind: p.kind || 'skill', crit: precise ? 'center' : false, precise, parryable: false, dir: [p.dx, p.dz], beat: p.beat, skill: p.skill });
        p.hits.add(o.id);
        if (p.explode) explodeProj(st, p, owner);
        if (p.chain && owner) { let n = p.chain.n; for (const e2 of enemiesOf(st, owner)) { if (n <= 0) break; if (e2 === o || len(e2.x - o.x, e2.z - o.z) > p.chain.r) continue; applyHit(st, owner, e2, { power: p.power * p.chain.k, scale: 'elm', elem: p.elem, aura: p.aura, kind: 'skill', parryable: false }); ev(st, 'chain', { a: o.id, b: e2.id }); n--; } }
        if (p.bounce > 0 && owner) {
          p.bounce--; p.hits.clear(); p.hits.add(o.id);
          let best = null, bd = 7;
          for (const e2 of enemiesOf(st, owner)) { if (e2 === o) continue; const d = len(e2.x - p.x, e2.z - p.z); if (d < bd) { bd = d; best = e2; } }
          if (best) { const [bx, bz] = dirTo(p, best); p.dx = bx; p.dz = bz; } else { p.dx = -p.dx + (st.rng.next() - 0.5) * 0.6; p.dz = -p.dz + (st.rng.next() - 0.5) * 0.6; const l = Math.hypot(p.dx, p.dz) || 1; p.dx /= l; p.dz /= l; }
          p.dist = 0; ev(st, 'ricochet', { id: p.id, x: p.x, z: p.z });
          continue;
        }
        if (!p.pierce) { dead = true; break; }
      }
      // arena bounds
      if (!dead && len(p.x, p.z) > st.arena.r + 1.5) {
        if (p.bounce > 0) { p.bounce--; const l = len(p.x, p.z); const nx = p.x / l, nz = p.z / l; const d = p.dx * nx + p.dz * nz; p.dx -= 2 * d * nx; p.dz -= 2 * d * nz; p.hits.clear(); ev(st, 'ricochet', { id: p.id, x: p.x, z: p.z }); }
        else dead = true;
      }
      if (!dead && p.dist >= (p.range || 10)) {
        if (p.boomerang && !p.returning) { p.returning = true; p.dist = 0; p.hits.clear(); }
        else dead = true;
      }
      if (p.boomerang && p.returning && owner && alive(owner)) { const [hx, hz] = dirTo(p, owner); p.dx = hx; p.dz = hz; if (len(owner.x - p.x, owner.z - p.z) < owner.r + 0.3) dead = true; }
    }
    if (dead) { ev(st, 'projEnd', { id: p.id, x: p.x, z: p.z, elem: p.elem }); st.proj.splice(i, 1); i--; }
  }
}
function explodeProj(st, p, owner) {
  if (!owner) return;
  const r = p.explode ? p.explode.r : 0.9;
  aoeHit(st, owner, p.x, p.z, r, { power: p.power * (p.explode ? p.explode.k : 1), scale: p.scale || 'elm', elem: p.elem, aura: p.aura, knock: p.knock || 1.5, kind: p.kind || 'skill', status: p.status });
  ev(st, 'burst', { x: p.x, z: p.z, r, elem: p.elem, small: true });
}
function segSegDist(ax, az, bx, bz, cx, cz, dx, dz) {
  // distance between segments AB and CD (approx: min of point-segment distances)
  const ps = (px, pz, x1, z1, x2, z2) => { const vx = x2 - x1, vz = z2 - z1, l2 = vx * vx + vz * vz || 1e-9; const t = clamp01(((px - x1) * vx + (pz - z1) * vz) / l2); return Math.hypot(px - (x1 + vx * t), pz - (z1 + vz * t)); };
  const inter = (() => { const d = (bx - ax) * (dz - cz) - (bz - az) * (dx - cx); if (Math.abs(d) < 1e-9) return false; const t = ((cx - ax) * (dz - cz) - (cz - az) * (dx - cx)) / d; const u2 = ((cx - ax) * (bz - az) - (cz - az) * (bx - ax)) / d; return t >= 0 && t <= 1 && u2 >= 0 && u2 <= 1; })();
  if (inter) return 0;
  return Math.min(ps(ax, az, cx, cz, dx, dz), ps(bx, bz, cx, cz, dx, dz), ps(cx, cz, ax, az, bx, bz), ps(dx, dz, ax, az, bx, bz));
}

function addZone(st, z) {
  const zone = Object.assign({ id: 'z' + st.nextId++, t: z.dur, tickT: 0 }, z);
  st.zones.push(zone);
  ev(st, 'zone', { id: zone.id, kind: zone.kind, x: zone.x, z: zone.z, r: zone.r, dur: zone.dur });
  return zone;
}
function stepZones(st, dt) {
  for (let i = 0; i < st.zones.length; i++) {
    const z = st.zones[i];
    z.t -= dt;
    const owner = z.owner ? unitById(st, z.owner) : null;
    if (z.pull) for (const o of st.units) {
      if (!alive(o) || o.side === z.side || o.mods.knockImmune) continue;
      const d = len(o.x - z.x, o.z - z.z); if (d > z.r * 1.4 || d < 0.2) continue;
      o.x += ((z.x - o.x) / d) * z.pull * dt; o.z += ((z.z - o.z) / d) * z.pull * dt;
    }
    z.tickT -= dt;
    if (z.tickT <= 0) {
      z.tickT = 0.5;
      for (const o of st.units) {
        if (!alive(o) || len(o.x - z.x, o.z - z.z) - o.r * 0.5 > z.r) continue;
        const enemy = o.side !== z.side;
        const k = z.kind;
        if (k === 'steam' && enemy) addStatus(st, o, { s: 'blind', dur: 0.6, src: z.owner });
        else if (k === 'lava' && enemy) applyHit(st, owner, o, { flat: Math.round(5 + (owner ? owner.stats.elm : 8) * 0.6), kind: 'zone', parryable: false });
        else if (k === 'fire' && enemy) addStatus(st, o, { s: 'burn', dur: 1.5, src: z.owner, srcElm: owner ? owner.stats.elm : 8 });
        else if (k === 'mud' && enemy) addStatus(st, o, { s: 'slow', dur: 0.6, k: 0.45, src: z.owner });
        else if (k === 'sand' && enemy) addStatus(st, o, { s: 'blind', dur: 0.6, src: z.owner });
        else if (k === 'wet' && enemy && (!o.aura || o.aura.e === 'hydro')) { o.aura = { e: 'hydro', amt: 1, t: 4, src: z.owner }; }
        if (z.tick) {
          const t = z.tick;
          if (t.heal && !enemy) heal(st, owner, o, o.maxHp * t.heal * 0.5 * (owner && owner.mods.healMul || 1));
          if (enemy && (z.enemy !== false)) {
            if (t.power) applyHit(st, owner, o, { power: t.power * (z.mult || 1), scale: 'elm', elem: z.elem, aura: t.aura || 0, kind: 'zone', parryable: false });
            if (t.status) addStatus(st, o, Object.assign({}, t.status, { src: z.owner, srcElm: owner ? owner.stats.elm : 10 }));
            if (t.aura && z.elem && (!o.aura || o.aura.t <= 0)) o.aura = { e: z.elem, amt: t.aura, t: 4, src: z.owner };
          }
        }
      }
    }
    if (z.t <= 0) { ev(st, 'zoneEnd', { id: z.id }); st.zones.splice(i, 1); i--; }
  }
  // traps
  for (let i = 0; i < st.traps.length; i++) {
    const tr = st.traps[i]; tr.t -= dt; tr.arm = Math.max(0, (tr.arm || 0) - dt);
    let fired = false;
    if (tr.arm <= 0) for (const o of st.units) {
      if (!alive(o) || o.side === tr.side) continue;
      if (len(o.x - tr.x, o.z - tr.z) < tr.r + o.r) { applyHit(st, unitById(st, tr.owner), o, Object.assign({}, tr.hit, { parryable: false, kind: 'skill' })); ev(st, 'trap', { id: tr.id, x: tr.x, z: tr.z }); fired = true; break; }
    }
    if (fired || tr.t <= 0) { ev(st, 'trapEnd', { id: tr.id }); st.traps.splice(i, 1); i--; }
  }
  // bloom seeds
  for (let i = 0; i < st.seeds.length; i++) {
    const s = st.seeds[i]; s.t -= dt;
    let taken = false;
    for (const o of st.units) {
      if (!alive(o) || o.side !== s.side) continue;
      if (len(o.x - s.x, o.z - s.z) < o.r + 0.6) { heal(st, o, o, o.maxHp * s.heal); taken = true; break; }
    }
    if (taken || s.t <= 0) { ev(st, 'seedEnd', { id: s.id, taken }); st.seeds.splice(i, 1); i--; }
  }
  for (let i = 0; i < st.clones.length; i++) { const c = st.clones[i]; c.t -= dt; if (c.t <= 0) { ev(st, 'cloneEnd', { id: c.id }); st.clones.splice(i, 1); i--; } }
}
function addWall(st, u, x1, z1, x2, z2, hp, dur) {
  const w = { id: 'w' + st.nextId++, x1, z1, x2, z2, hp, maxHp: hp, t: dur, side: u.side, owner: u.id };
  st.walls.push(w);
  ev(st, 'wall', { id: w.id });
  // shove units out of the wall line
  for (const o of st.units) { if (!alive(o)) continue; pushOutOfWall(o, w); }
  return w;
}
function breakWall(st, w) { w.hp = 0; ev(st, 'wallBreak', { id: w.id, x: (w.x1 + w.x2) / 2, z: (w.z1 + w.z2) / 2 }); }
function pushOutOfWall(o, w) {
  const vx = w.x2 - w.x1, vz = w.z2 - w.z1, l2 = vx * vx + vz * vz || 1e-9;
  const t = clamp01(((o.x - w.x1) * vx + (o.z - w.z1) * vz) / l2);
  const px = w.x1 + vx * t, pz = w.z1 + vz * t;
  const dx = o.x - px, dz = o.z - pz, d = Math.hypot(dx, dz);
  const min = o.r + 0.3;
  if (d < min) { const nx = d > 1e-4 ? dx / d : -vz / Math.sqrt(l2), nz = d > 1e-4 ? dz / d : vx / Math.sqrt(l2); o.x = px + nx * min; o.z = pz + nz * min; return true; }
  return false;
}
function damageProp(st, p, dmg, src) {
  if (!p.alive || !p.destructible) return;
  p.hp -= dmg;
  ev(st, 'propHit', { id: p.id, x: p.x, z: p.z });
  if (p.hp <= 0) { p.alive = false; st.stats.destroyed++; ev(st, 'destroy', { id: p.id, x: p.x, z: p.z, kind: p.kind, src: src ? src.id : null }); }
}
function hitProps(st, x, z, r, power, src) {
  for (const p of st.arena.props) if (p.alive && p.destructible && len(p.x - x, p.z - z) < r + p.r) damageProp(st, p, power, src);
}

// ------------------------------------------------------------------ faint / end
function faint(st, u, src) {
  if (u.state === 'faint') return;
  u.hp = 0; u.state = 'faint'; u.act = null; u.dash = null; u.charge = null; u.st = []; u.vx = u.vz = 0;
  if (u.grab) releaseGrab(st, u);
  if (u.grabbedBy) { const g = unitById(st, u.grabbedBy); if (g) g.grab = null; u.grabbedBy = null; }
  for (const t of st.tele.filter((x) => x.owner === u.id)) removeTele(st, t.id);
  if (u.bonded) endBond(st, u, 'faint');
  if (src) {
    src.k.kos++;
    if (src.side === 0) st.defeats.push({ species: u.species, by: src.uid, level: u.level });
    if (src.bonded) {
      src.k.bondKos++;
      ev(st, 'bondKo', { u: src.id, n: src.k.bondKos });
      // gimmick: a box that cracks with every bonded KO and finally breaks open (Heartbox → Inbloom)
      const g = src.gimmick;
      if (g && g.breakAt && g.into && SPECIES[g.into]) {
        src.cracks++;
        ev(st, 'crack', { u: src.id, n: src.cracks, of: g.breakAt });
        if (src.cracks >= g.breakAt) transformUnit(st, src, g.into);
      }
    }
  }
  ev(st, 'faint', { u: u.id, src: src ? src.id : null });
  ev(st, 'anim', { u: u.id, mode: 'faint' });
  const T = st.trainers.find((t) => t.id === u.trainer);
  const next = T.team.map((id) => unitById(st, id)).find((x) => x && x !== u && x.hp > 0 && x.state !== 'faint');
  if (next) { T.pendingSwitch = 1.3; T.pendingTo = T.autoSwitch ? next.id : null; ev(st, 'needSwitch', { trainer: T.id }); }
  else { T.out = true; checkEnd(st); }
}
// Mid-battle transformation into another species (stats rescaled by base ratio).
function transformUnit(st, u, to) {
  const from = SPECIES[u.species], sp = SPECIES[to];
  if (!from || !sp) return;
  const hpF = u.hp / u.maxHp;
  for (const k of Object.keys(u.stats)) if (from.base[k]) u.stats[k] *= sp.base[k] / from.base[k];
  u.maxHp = Math.round(u.maxHp * (sp.base.hp / from.base.hp));
  u.hp = Math.max(1, Math.round(u.maxHp * Math.max(hpF, 0.6)));
  const prev = u.species;
  u.species = to; u.basic = sp.basic; u.r = sp.radius || u.r; u.mass = Math.max(0.4, u.r * 2);
  u.elems = elemsOf(sp); u.elem = u.elems[0]; u.gimmick = sp.gimmick || null; u.final = !(sp.evolve && sp.evolve.length);
  u.transformed = prev;
  u._dirty = true;
  st.slowmo = Math.max(st.slowmo, 1.6);
  ev(st, 'transform', { u: u.id, from: prev, to });
}
function checkEnd(st) {
  for (let s = 0; s < 2; s++) {
    const ts = st.trainers.filter((t) => t.side === s);
    if (ts.length && ts.every((t) => t.out)) { endBattle(st, 1 - s, 'ko'); return; }
  }
}
function endBattle(st, winner, reason) {
  if (st.over) return;
  st.over = true;
  st.result = {
    winner, reason, duration: st.t, stats: st.stats, defeats: st.defeats, captured: st.captured, used: st.used,
    units: st.units.map((u) => ({ id: u.id, uid: u.uid, side: u.side, trainer: u.trainer, species: u.species, hp: Math.max(0, u.hp), maxHp: u.maxHp, fainted: u.state === 'faint', took: u.onField || u.k.dealt > 0 || u.k.taken > 0, k: u.k, cracks: u.cracks, transformed: u.transformed || null, bondT: u.k.bondT + (u.bonded ? u.bondT : 0) })),
  };
  ev(st, 'end', { winner, reason });
}

// ------------------------------------------------------------------ main step
// ------------------------------------------------------------------ arenas & match clock
// Stadium arena types (picked at kickoff and again at halftime).
export const ARENA_TYPES = {
  rocky: { name: 'Rocky', boost: 'geo', desc: 'Geo moves +20%. Rock pillars give cover.' },
  grassy: { name: 'Grassy', boost: 'bio', desc: 'Bio moves +20%. Bio Tokonmon regenerate.' },
  water: { name: 'Water', boost: 'hydro', desc: 'Hydro moves +20%, Pyro −15%. Everyone gets soaked — beware steam!' },
};
export function setArenaType(st, type, props) {
  const A = ARENA_TYPES[type] || null;
  st.arena.type = A ? type : null;
  st.arena.boost = A ? A.boost : null;
  if (props) {
    st.arena.props = st.arena.props.filter((p) => !p.floor);
    for (const p of props) st.arena.props.push(Object.assign({ id: 'p' + st.nextId++, hp: 60, r: 0.6, destructible: true, alive: true, floor: true }, p, { maxHp: p.hp ?? 60 }));
  }
  ev(st, 'arena', { type: st.arena.type });
}
// Resume after a halftime pause (optionally with a new arena type + floor props).
export function resumeMatch(st, opts = {}) {
  if (!st.paused) return false;
  st.paused = null;
  if (opts.arena) setArenaType(st, opts.arena, opts.props);
  ev(st, 'resume', {});
  return true;
}
function stepClock(st, dt) {
  const c = st.clock;
  c.t += dt;
  if (c.half === 1 && c.halftime && c.t >= c.len / 2) { c.half = 2; st.paused = 'halftime'; ev(st, 'halftime', {}); return; }
  if (c.t >= c.len) {
    // time up: the side with more remaining team HP wins
    const score = [0, 1].map((s) => st.units.filter((u) => u.side === s).reduce((a, u) => a + Math.max(0, u.hp) / u.maxHp, 0));
    endBattle(st, score[0] >= score[1] ? 0 : 1, 'time');
  }
}

export function step(st, dt = DT) {
  st.events.length = 0;
  if (st.over || st.paused) return;
  if (st.clock && !st.qte) { stepClock(st, dt); if (st.paused || st.over) return; }
  // QTE pauses combat almost entirely (cinematic slow motion)
  if (st.qte) { st.qte.t += dt; dt *= 0.04; if (st.qte.t > st.qte.dur + 0.5) resolveQte(st, st.qte.id, st.qte.kind === 'escape' ? 0 : 0.4); }
  st.t += dt; st.tick++;
  // beat
  const period = 60 / st.beat.bpm;
  st.beat.t += dt;
  const n = Math.floor(st.beat.t / period);
  if (n !== st.beat.n) { st.beat.n = n; ev(st, 'beat', { n }); }
  // trainers
  for (const T of st.trainers) {
    T.switchCd = Math.max(0, T.switchCd - dt); T.itemCd = Math.max(0, T.itemCd - dt); T.bondCd = Math.max(0, T.bondCd - dt);
    if (T.switching) {
      const before = Math.floor(T.switching.t);
      T.switching.t += dt;
      if (Math.floor(T.switching.t) !== before && T.switching.t < T.switching.dur) ev(st, 'switchTick', { trainer: T.id, left: Math.ceil(T.switching.dur - T.switching.t) });
      if (T.switching.t >= T.switching.dur) completeSwitch(st, T);
    }
    if (T.pendingSwitch > 0) {
      T.pendingSwitch -= dt;
      if (T.pendingSwitch <= 0) {
        const cur = unitById(st, T.active);
        if ((!cur || cur.state === 'faint') && !T.switching) {
          const to = T.pendingTo || (T.autoSwitch ? T.team.map((id) => unitById(st, id)).find((x) => x && x.hp > 0 && x.state !== 'faint')?.id : null);
          if (to) doSwitch(st, T, to);
        }
      }
    }
  }
  // water arena: the floor keeps everyone soaked
  if (st.arena.type === 'water' && st.tick % 120 === 0) for (const u of st.units) if (alive(u) && !u.elems.includes('hydro') && (!u.aura || u.aura.e !== 'hydro')) { if (!u.aura || u.aura.t <= 0) { u.aura = { e: 'hydro', amt: 0.5, t: 4, src: null }; ev(st, 'aura', { u: u.id, e: 'hydro' }); } }
  // pending scheduled effects
  for (let i = 0; i < st.pending.length; i++) {
    const p = st.pending[i];
    if (p.at > st.t) continue;
    st.pending.splice(i, 1); i--;
    const u = unitById(st, p.u);
    if (!u || u.state === 'faint') continue;
    if (p.kind === 'aoe') runAoe(st, p);
    else if (p.kind === 'line') runLine(st, p);
    else if (p.kind === 'melee') { if (alive(u)) meleeSweep(st, u, p.reach, p.arc, p.hit); }
    else if (p.kind === 'proj') { if (alive(u)) { const [dx, dz] = p.dx(); spawnProj(st, u, p.p, dx, dz); } }
    else if (p.kind === 'clonehit') { const t = unitById(st, p.tgt); if (alive(t)) { applyHit(st, u, t, p.hit); ev(st, 'cloneStrike', { u: u.id, tgt: t.id, x: p.cx, z: p.cz }); } }
  }
  for (const u of st.units) if (u.onField) stepUnit(st, u, dt);
  stepProj(st, dt);
  stepZones(st, dt);
  // walls
  for (let i = 0; i < st.walls.length; i++) { const w = st.walls[i]; w.t -= dt; if (w.t <= 0 || w.hp <= 0) { if (w.hp > 0) ev(st, 'wallEnd', { id: w.id }); else if (!w.broken) { w.broken = true; } st.walls.splice(i, 1); i--; } }
  // telegraph timers & follow
  for (let i = 0; i < st.tele.length; i++) { const tl = st.tele[i]; tl.t += dt; if (tl.follow) { const o = unitById(st, tl.follow); if (o) { tl.x = o.x; tl.z = o.z; if (tl.shape !== 'circle') { tl.dx = Math.sin(o.face); tl.dz = Math.cos(o.face); } } } if (tl.t > tl.dur + 0.6) { st.tele.splice(i, 1); i--; } }
  collide(st);
  st.slowmo = Math.max(0, st.slowmo - dt * 6);
  st.hitstop = Math.max(0, (st.hitstop || 0) - dt);
  if (!st.over) checkEnd(st);
}

function stepUnit(st, u, dt) {
  if (u.state === 'faint') { u.vx *= 0.8; u.vz *= 0.8; return; }
  if (u.state === 'captured') {
    u.capture.t += dt;
    if (u.capture.t > 0.7 * (u.capture.shakes + 1) + 0.4) {
      if (u.capture.ok) { st.captured = { species: u.species, level: u.level, hp: u.hp / u.maxHp, uid: u.uid, gem: st.used.gems[st.used.gems.length - 1] }; ev(st, 'captured', { u: u.id }); u.onField = false; const T = st.trainers.find((t) => t.id === u.trainer); if (T) T.out = true; endBattle(st, 0, 'capture'); }
      else { u.state = 'idle'; u.capture = null; st.flags.angry = true; addBuff(u, 'dmg', 0.25, 10); ev(st, 'breakFree', { u: u.id }); }
    }
    return;
  }
  refreshMods(st, u);
  stepOrder(st, u, dt);
  u.emoteCd = Math.max(0, u.emoteCd - dt);
  if (u.bonded) {
    u.bondT += dt;
    u.ult = Math.min(100, u.ult + dt * 1.4 * (u.mods.ultGain || 1));
    if (u.mods.shieldRegen) u.shield = Math.min(u.maxHp * 0.35, u.shield + u.maxHp * u.mods.shieldRegen * dt);
    if (Math.floor(u.bondT / 10) !== Math.floor((u.bondT - dt) / 10)) ev(st, 'bondTime', { u: u.id, s: Math.floor(u.bondT) });
  }
  if (st.arena.type === 'grassy' && u.elems.includes('bio')) heal(st, u, u, u.maxHp * 0.006 * dt);
  // timers
  u.iframes = Math.max(0, u.iframes - dt); u.dodgeCd = Math.max(0, u.dodgeCd - dt); u.parryCd = Math.max(0, u.parryCd - dt); u.grabCd = Math.max(0, u.grabCd - dt);
  u.parryT = Math.max(0, u.parryT - dt); u.parryAge += dt; u.dodgeAge += dt; if (u.dodgeAge > 0.5) u.perfectDodged = false;
  u.basicT = Math.max(0, u.basicT - dt); u.chainT = Math.max(0, u.chainT - dt);
  for (const k in u.cds) u.cds[k] = Math.max(0, u.cds[k] - dt);
  u.energy = Math.min(100, u.energy + dt * (3.6 + u.stats.spd * 0.06));
  if (!st.rules.bond) u.ult = Math.min(100, u.ult + dt * 0.8);
  if (u.spectral > 0) { u.spectral -= dt; if (u.spectral <= 0) ev(st, 'spectralEnd', { u: u.id }); }
  if (u.shield > 0 && u.shieldT != null) { u.shieldT -= dt; if (u.shieldT <= 0) u.shield = 0; }
  u.heat = Math.max(0, u.heat - dt * 2);
  if (u.aura) { u.aura.t -= dt; if (u.aura.t <= 0) u.aura = null; }
  if (u.mods.regen) heal(st, u, u, u.maxHp * u.mods.regen * dt);
  if (st.tick % 3 === 0) { u.hpHist.push({ t: st.t, hp: u.hp }); while (u.hpHist.length && st.t - u.hpHist[0].t > 4) u.hpHist.shift(); }
  // statuses
  for (let i = 0; i < u.st.length; i++) {
    const s = u.st[i];
    s.t -= dt;
    if (s.s === 'burn' || s.s === 'poison' || s.s === 'radiation' || s.s === 'regen') {
      s.tick -= dt;
      if (s.tick <= 0) {
        s.tick = 1;
        const src = s.src ? unitById(st, s.src) : null;
        if (s.s === 'regen') heal(st, src, u, s.k);
        else applyHit(st, src, u, { flat: Math.max(1, Math.round(s.s === 'poison' ? s.k * s.stacks : s.k)), kind: 'dot', parryable: false });
        if (s.spread && src) for (const o of enemiesOf(st, src)) if (o !== u && !has(o, s.s) && len(o.x - u.x, o.z - u.z) < s.spread) addStatus(st, o, { s: s.s, dur: Math.max(1.5, s.t), k: s.k, src: s.src });
        if (!alive(u)) return;
      }
    }
    if (s.t <= 0) { u.st.splice(i, 1); i--; if (['stun', 'sleep', 'frozen'].includes(s.s)) ev(st, 'anim', { u: u.id, mode: null }); }
  }
  for (let i = 0; i < u.buffs.length; i++) { const b = u.buffs[i]; b.t -= dt; if (b.t <= 0) { if (b.s === 'guard') ev(st, 'anim', { u: u.id, mode: null }); u.buffs.splice(i, 1); i--; } }
  u.drowsy = Math.max(0, u.drowsy - dt * 0.35);
  if (u.state === 'stagger') { u.stateT -= dt; if (u.stateT <= 0) u.state = 'idle'; }
  // grabbing
  if (u.grab) {
    const g = u.grab, o = unitById(st, g.tid);
    g.t += dt;
    if (!alive(o) || o.state !== 'grabbed') { u.grab = null; }
    else {
      const f = faceDir(u);
      o.x = u.x + f[0] * (u.r + o.r + 0.1); o.z = u.z + f[1] * (u.r + o.r + 0.1); o.face = u.face + Math.PI;
      if (!g.struggle && g.t >= g.struggleAt) { g.struggle = { t: 0 }; ev(st, 'struggle', { u: o.id, grabber: u.id }); }
      if (g.struggle) {
        g.struggle.t += dt;
        if (!g.struggle.done && g.struggle.t >= 0.32) {
          g.struggle.done = true;
          if (u.parryT > 0) parrySuccess(st, u, null, { kind: 'struggle' });
          else { applyHit(st, o, u, { power: 8, scale: 'phys', kind: 'basic', knock: 1, parryable: false }); releaseGrab(st, u, 0.4); return; }
        }
      }
      if (u.grab && g.t >= GRAB_HOLD) releaseGrab(st, u, 0);
      if (u.side === 1 && u.grab && st.trainers.find((t) => t.id === u.trainer)?.ai) {
        // AI grabber finishes with a throw
        if (g.t > 0.9 && !g.thrown) { g.thrown = true; doComboAttack(st, u, COMBOS.find((x) => x.id === (g.parried ? 'reversal_suplex' : 'throw')), null); }
      }
    }
  }
  // AI brains
  const T = st.trainers.find((t) => t.id === u.trainer);
  if ((T && T.ai) || u.auto) think(st, u, dt, T);
  // commands
  if (u.cmdQ) {
    u.cmdQT -= dt;
    const c = u.cmdQ;
    if (instantCmd(c) || !u.act || (u.act.kind === 'basic' && u.act.phase === 'recover') || c.type === 'skill' && u.act && u.act.kind === 'basic' && u.act.phase !== 'active') {
      const confused = has(u, 'confuse') && c.type !== 'qte';
      if (confused && st.rng.chance(0.5)) {
        if (c.type === 'move') { const a = st.rng.next() * TAU; processCommand(st, u, { type: 'move', x: u.x + Math.sin(a) * 3, z: u.z + Math.cos(a) * 3 }); }
        ev(st, 'confused', { u: u.id });
      } else processCommand(st, u, c);
      u.cmdQ = null;
    } else if (u.cmdQT <= 0) u.cmdQ = null;
  }
  // charge (basic action)
  if (u.charge) {
    u.charge.t += dt * (u.elems.includes('pyro') ? 1.5 : 1) * (u.mods.chargeSpeed || 1);
    if (u.charge.lvl === 1 && u.charge.t >= 1.0) { u.charge.lvl = 2; pushHist(st, u, 'charge'); ev(st, 'charge', { u: u.id, lvl: 2 }); }
  }
  // action progression
  if (u.act && canActOrLocked(u)) progressAct(st, u, dt);
  // movement
  moveUnit(st, u, dt);
}
const canActOrLocked = (u) => alive(u) && !['stun', 'sleep', 'frozen'].some((s) => has(u, s)) && !['stagger', 'grabbed', 'knock'].includes(u.state);

function progressAct(st, u, dt) {
  const a = u.act;
  a.t += dt;
  if (a.phase === 'qte') return; // waiting for player QTE
  if (a.phase === 'charge') {
    a.chg += dt;
    if (a.chg >= a.maxChg + 0.6 && !(u.side === 0 && st.trainers.find((t) => t.id === u.trainer)?.isPlayer && a.chg < a.maxChg + 2.5)) { a.phase = 'windup'; a.t = 0; ev(st, 'anim', { u: u.id, mode: null, anim: a.sk.anim || 'cast' }); }
    return;
  }
  if (a.phase === 'windup' && a.t >= a.w) {
    a.phase = 'active'; a.t = 0;
    if (a.tele) { /* telegraph stays until effects resolve (delays) */ }
    if (a.kind === 'basic') execBasic(st, u);
    else if (a.kind === 'grab') execGrab(st, u);
    else if (a.kind === 'combo') execCombo(st, u);
    else if (a.kind === 'skill' || a.kind === 'ult') {
      const sk = a.sk;
      let mult = a.mult || 1, grow = 1;
      if (sk.charge && a.maxChg > 0) { const f = clamp01(a.chg / a.maxChg); mult *= 1 + (sk.charge.mult - 1) * f; grow = 1 + ((sk.charge.grow || 1.5) - 1) * f; if (f > 0.5) u.k.charged++; }
      if (a.kind === 'skill' && a.aim.tid && sk.aim === 'target') { const t = unitById(st, a.aim.tid); if (alive(t)) { a.aim.x = t.x; a.aim.z = t.z; const [dx, dz] = dirTo(u, t); a.aim.dx = dx; a.aim.dz = dz; u.face = Math.atan2(dx, dz); } }
      runEffects(st, u, sk, a.aim, mult, grow);
      ev(st, 'cast', { u: u.id, skill: sk.id, phase: 'release', mult });
    }
    if (a.tele) { const tl = st.tele.find((x) => x.id === a.tele); if (tl) tl.dur = Math.min(tl.dur, tl.t + 0.15 + (a.sk ? (a.sk.eff.find((e) => e.delay)?.delay || 0) : 0)); }
  }
  if (a.phase === 'active' && a.t >= a.a && !u.dash) { a.phase = 'recover'; a.t = 0; }
  if (a.phase === 'recover' && a.t >= a.r) { u.act = null; if (a.kind === 'ult' && u.bonded) endBond(st, u, 'ult'); }
}

function moveUnit(st, u, dt) {
  // knockback velocity
  if (Math.abs(u.vx) + Math.abs(u.vz) > 0.01) {
    u.x += u.vx * dt; u.z += u.vz * dt;
    const f = Math.exp(-(u.state === 'knock' ? 3.2 : 7) * dt);
    u.vx *= f; u.vz *= f;
    if (u.state === 'knock' && Math.hypot(u.vx, u.vz) < 1.4) { u.state = 'idle'; u.thrownBy = null; }
  } else if (u.state === 'knock') u.state = 'idle';
  if (u.airborne) { u.y += (u.vy || 0) * dt; u.vy = (u.vy || 0) - 22 * dt; if (u.y <= 0) { u.y = 0; u.vy = 0; u.airborne = false; ev(st, 'land', { u: u.id }); } }
  // dashes (dodge, lunge, skill dash, leap)
  if (u.dash) {
    const d = u.dash;
    const s = Math.min(d.t, dt);
    u.x += d.dx * d.speed * s; u.z += d.dz * d.speed * s;
    d.t -= dt;
    if (d.hit) {
      for (const o of enemiesOf(st, u)) { if (d.hitSet.has(o.id)) continue; if (len(o.x - u.x, o.z - u.z) < o.r + d.hit.r) { d.hitSet.add(o.id); applyHit(st, u, o, Object.assign({}, d.hit, { dir: [d.dx, d.dz], parryable: true })); } }
      hitProps(st, u.x, u.z, d.hit.r, d.hit.power, u);
      if (d.trail) { d.trailT -= dt; if (d.trailT <= 0) { d.trailT = 0.12; addZone(st, { kind: d.trail, x: u.x, z: u.z, r: 0.9, dur: 3, owner: u.id, side: u.side, enemy: true }); } }
    }
    if (d.t <= 0) { u.dash = null; if (d.leap) ev(st, 'land', { u: u.id, heavy: true }); }
    return;
  }
  if (!canMove(u) || (u.act && u.act.phase !== 'recover' && u.act.kind !== 'basic')) return;
  let tx = null, tz = null, stopAt = 0.05;
  if (u.cmd && u.cmd.type === 'move') { tx = u.cmd.x; tz = u.cmd.z; if (len(tx - u.x, tz - u.z) < 0.15) { u.cmd = null; tx = null; } }
  else if (u.target) {
    const t = unitById(st, u.target);
    if (!alive(t)) { u.target = null; }
    else {
      const range = u.basic.type === 'ranged' ? u.basic.range : (u.basic.range || 1.5) + 0.1;
      const d = len(t.x - u.x, t.z - u.z) - t.r - u.r;
      if (d > range * 0.9) { tx = t.x; tz = t.z; stopAt = range * 0.85 + t.r + u.r; }
      else if (!u.act && u.basicT <= 0 && canAct(u) && !u.charge) { u.face = Math.atan2(t.x - u.x, t.z - u.z); startBasic(st, u, t, false); }
    }
  }
  if (tx != null) {
    const dx = tx - u.x, dz = tz - u.z, d = Math.hypot(dx, dz);
    if (d > stopAt) {
      const sp = moveSpeed(u) * (u.act ? 0.5 : 1);
      const m = Math.min(sp * dt, d - stopAt);
      u.x += (dx / d) * m; u.z += (dz / d) * m;
      const want = Math.atan2(dx, dz);
      u.face += angleDiff(u.face, want) * Math.min(1, dt * 14);
      u.moving = sp;
      return;
    }
  }
  u.moving = 0;
}

function collide(st) {
  const R = st.arena.r;
  const us = st.units.filter((u) => u.onField && u.state !== 'out');
  for (let i = 0; i < us.length; i++) {
    const a = us[i];
    // arena boundary
    const d = len(a.x, a.z);
    if (d > R - a.r) {
      const speed = Math.hypot(a.vx, a.vz);
      a.x *= (R - a.r) / d; a.z *= (R - a.r) / d;
      if (a.state === 'knock' && speed > 5) { const src = a.thrownBy ? unitById(st, a.thrownBy) : null; applyHit(st, src, a, { flat: Math.round(4 + speed * 1.3), kind: 'dot' }); ev(st, 'wallSlam', { u: a.id, x: a.x, z: a.z }); a.vx *= -0.3; a.vz *= -0.3; }
    }
    // props
    for (const p of st.arena.props) {
      if (!p.alive || !p.solid && !p.destructible) continue;
      const dx = a.x - p.x, dz = a.z - p.z, dd = Math.hypot(dx, dz), min = a.r + p.r;
      if (dd < min && dd > 1e-4) {
        const speed = Math.hypot(a.vx, a.vz);
        if (a.state === 'knock' && speed > 3.5) { damageProp(st, p, speed * 9, a.thrownBy ? unitById(st, a.thrownBy) : null); if (a.state !== 'faint') applyHit(st, a.thrownBy ? unitById(st, a.thrownBy) : null, a, { flat: Math.round(3 + speed), kind: 'dot' }); a.vx *= 0.4; a.vz *= 0.4; }
        if (p.alive) { a.x = p.x + (dx / dd) * min; a.z = p.z + (dz / dd) * min; }
      }
    }
    for (const w of st.walls) if (w.hp > 0) { const speed = Math.hypot(a.vx, a.vz); if (pushOutOfWall(a, w) && a.state === 'knock' && speed > 4) { w.hp -= speed * 6; applyHit(st, null, a, { flat: Math.round(3 + speed), kind: 'dot' }); if (w.hp <= 0) breakWall(st, w); a.vx *= -0.2; a.vz *= -0.2; } }
    // unit-unit
    for (let j = i + 1; j < us.length; j++) {
      const b = us[j];
      if (a.state === 'grabbed' || b.state === 'grabbed' || a.state === 'faint' || b.state === 'faint') continue;
      const dx = b.x - a.x, dz = b.z - a.z, dd = Math.hypot(dx, dz), min = a.r + b.r;
      if (dd < min && dd > 1e-4) {
        const nx = dx / dd, nz = dz / dd, push = (min - dd);
        const ma = a.mass, mb = b.mass, ta = mb / (ma + mb), tb = ma / (ma + mb);
        a.x -= nx * push * ta; a.z -= nz * push * ta; b.x += nx * push * tb; b.z += nz * push * tb;
        // bowling: a knocked unit slamming into another
        for (const [k, o] of [[a, b], [b, a]]) {
          const sp = Math.hypot(k.vx, k.vz);
          if (k.state === 'knock' && sp > 5 && o.side === k.side) { const src = k.thrownBy ? unitById(st, k.thrownBy) : null; applyHit(st, src, o, { flat: Math.round(5 + sp * 1.4), kind: 'dot' }); o.vx += k.vx * 0.5; o.vz += k.vz * 0.5; k.vx *= 0.4; k.vz *= 0.4; ev(st, 'bowl', { a: k.id, b: o.id }); }
        }
      }
    }
  }
}

// ------------------------------------------------------------------ queries for UI
export function activeOf(st, trainerId) { const T = st.trainers.find((t) => t.id === trainerId); return T ? unitById(st, T.active) : null; }
export function playerTrainer(st) { return st.trainers.find((t) => t.isPlayer) || null; }
export function cooldownFrac(st, u, skillId) { const sk = SKILLS[skillId]; if (!sk) return 0; return (u.cds[skillId] || 0) / Math.max(0.01, sk.cd * cdMul(u)); }
export function skillCost(u, skillId) { const sk = SKILLS[skillId]; return sk ? Math.round(sk.cost * (u.mods.costMul || 1) * (u.spectral > 0 ? 0.5 : 1)) : 0; }
export function beatPhase(st) { const period = 60 / st.beat.bpm; return (st.beat.t % period) / period; }
export { onBeat };
