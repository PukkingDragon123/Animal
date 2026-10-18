// Game services: battles (trainer / wild / beast) with rewards, EXP,
// evolution counters, captures, level-ups, evolutions, items and money.
import { createElemon, battleSnapshot, gainExp, evolutionOptions, addFriendship, learn, nameOf } from './elemon.js';
import * as S from './state.js';
import { SPECIES, elemsOf } from '../data/species.js';
import { SKILLS } from '../data/skills.js';
import { ITEMS, gemMultiplier, GEM_IDS } from '../data/items.js';
import { questProgress, QUESTS } from '../data/quests.js';
import { ELEMENTS } from '../data/elements.js';
import { weatherOf } from './time.js';

export class Game {
  constructor(app) { this.app = app; }
  get s() { return this.app.state; }

  // ------------------------------------------------------------- teams
  npcMon(species, level, opts = {}) {
    const m = createElemon(species, { level, wild: true, friendship: 100 });
    const sp = SPECIES[species];
    for (const [lv, id] of sp.learn) if (lv <= level && !m.skills.known.includes(id)) m.skills.known.push(id);
    m.skills.active = (opts.skills || m.skills.known).filter((id) => SKILLS[id] && SKILLS[id].kind === 'active').slice(0, 4);
    if (opts.ult !== false && (opts.ult || (level >= 14 && sp.ult))) m.skills.ult = opts.ult || sp.ult;
    m.skills.passives = (opts.passives || (level >= 10 ? (sp.passives || []).slice(0, 1) : [])).slice(0, 2);
    if (opts.hp != null) m.hp = opts.hp;
    return m;
  }
  npcSnap(species, level, opts) { return battleSnapshot(this.npcMon(species, level, opts), { active: 4, ult: 1, passive: 2 }); }
  playerSnaps(n = 3, only = null) {
    const mons = only ? only : S.battleTeam(this.s, n);
    return mons.map((m) => battleSnapshot(m, this.s.unlocks.slots));
  }
  battleItems() { const b = {}; for (const id of ['takoyaki', 'okonomiyaki', 'ramune', 'matcha', 'revive_onigiri']) if (this.s.bag[id]) b[id] = this.s.bag[id]; return b; }

  // ------------------------------------------------------------- battles
  // o: { foes:[{id,name,ai,team:[[sp,lv,opts]], actor}], allies:[...], arena, rules, tutorial, title, subtitle, music, money, league, canLose, partySize, only, boost, expMul }
  async trainerBattle(o) {
    const w = this.app.world;
    if (!this.s.party.length) return null;
    const A = typeof o.arena === 'object' ? o.arena : w.arena(o.arena || 'main');
    const mkT = (t, isPlayer) => ({ id: t.id, name: t.name, ai: isPlayer ? null : (t.ai || 'normal'), isPlayer, team: t.snaps || t.team.map(([sp, lv, op]) => this.npcSnap(sp, lv, op)), items: isPlayer ? this.battleItems() : (t.items || {}) });
    const sides = [
      { trainers: [mkT({ id: 'player', name: this.s.player.name, snaps: this.playerSnaps(o.partySize || 3, o.only) }, true), ...(o.allies || []).map((t) => mkT(t, false))] },
      { trainers: (o.foes || []).map((t) => mkT(t, false)) },
    ];
    const trainerActors = { player: w.actor('player') };
    for (const t of [...(o.allies || []), ...(o.foes || [])]) { const a = t.actor ? (typeof t.actor === 'string' ? w.actor(t.actor) : t.actor) : w.actor(t.id); if (a) trainerActors[t.id] = a; }
    const hide = [w.actor('buddy')].filter(Boolean);
    for (const t of [...(o.allies || []), ...(o.foes || [])]) if (t.hideActor) { const a = w.actor(t.hideActor); if (a) hide.push(a); }
    // other wild Elemon / beasts near the arena step out of the way
    for (const [, r] of w.actors) if ((r.kind === 'wild' || r.kind === 'beast') && r.actor.visible && !hide.includes(r.actor) && Math.hypot(r.actor.pos.x - A.x, r.actor.pos.z - A.z) < A.r + 5) hide.push(r.actor);
    // companion Elemon wandering with the player step aside during battles
    for (const id of w.followers) { const r = w.rec(id); if (r && r.npc && r.npc.species && !hide.includes(r.actor)) hide.push(r.actor); }
    this.app.hud.show(false);
    w.enableControl(false);
    const res = await this.app.battle.start({
      sides, arena: A, rules: Object.assign({ items: true }, o.rules), tutorial: o.tutorial, gems: o.gems, ambush: o.ambush, title: o.title, subtitle: o.subtitle, music: o.music || 'battle', trainerActors, hideActors: hide, boost: o.boost, intro: o.intro, colors: o.colors, seed: o.seed,
    });
    w.restore();
    await this.afterBattle(res, Object.assign({ trainer: true }, o));
    if (!this.app.director.cutscene) { this.app.hud.show(true); if (!this.app.busy) w.enableControl(true); }
    return res;
  }
  async wildBattle(species, level, opts = {}) {
    const w = this.app.world;
    const A = { x: w.actor('player').pos.x, z: w.actor('player').pos.z, r: 7 };
    // nudge the arena centre between player and creature
    if (opts.actor) { A.x = (A.x + opts.actor.pos.x) / 2; A.z = (A.z + opts.actor.pos.z) / 2; }
    const licensed = S.flag(this.s, 'license');
    const gemsApi = {
      id: null,
      mul: (u) => gemMultiplier(this.pickGem(u.species), elemsOf(SPECIES[u.species])),
      consume: () => { const g = this.pickGem(); if (g) S.addItem(this.s, g, -1); },
    };
    const self = this;
    Object.defineProperty(gemsApi, 'id', { get() { return self.pickGem(); } });
    if (opts.actor) opts.actor.setVisible(false);
    const snap = this.npcSnap(species, level);
    if (opts.boss) snap.maxHp = Math.round(snap.maxHp * 1.8), snap.hp = snap.maxHp;
    const res = await this.trainerBattle({
      arena: A, foes: [{ id: 'wild', name: SPECIES[species].name, ai: opts.boss ? 'boss' : 'wild', snaps: [snap] }],
      rules: { wild: true, capture: licensed && !opts.boss, flee: true },
      title: opts.boss ? `${SPECIES[species].name} — Boss!` : `Wild ${SPECIES[species].name}!`, subtitle: opts.ambush ? 'Ambush! You struck first.' : 'Weaken it, then use your keychain!', music: opts.boss ? 'boss' : 'battle',
      colors: [ELEMENTS[elemsOf(SPECIES[species])[0]].color, '#1b1230'], wild: true, gems: gemsApi, ambush: opts.ambush,
    });
    if (opts.actor && !(res && (res.winner === 0))) opts.actor.setVisible(true);
    if (!licensed && res && res.winner === 0 && !this._warnedLicense) { this._warnedLicense = true; this.app.ui.toast('You need a Tamer License to catch Elemon!'); }
    return res;
  }
  async beastBattle(species, opts = {}) {
    if (opts.actor) opts.actor.setVisible(false);
    const w = this.app.world;
    const A = { x: w.actor('player').pos.x, z: w.actor('player').pos.z, r: 7 };
    const res = await this.trainerBattle({
      arena: A, foes: [{ id: 'beast', name: SPECIES[species].name, ai: 'beast', team: [[species, Math.max(8, this.avgLevel() + 2)]] }],
      rules: { wild: true, beast: true, capture: false, flee: true }, title: `${SPECIES[species].name}!`, subtitle: 'Untameable wild beast — repel it!', music: 'boss', colors: ['#8aff3a', '#1b1230'],
    });
    if (opts.actor) opts.actor.setVisible(true);
    return res;
  }
  // Legendary encounter: boss-scaled HP; only a Star Gem resonates strongly
  // enough to capture it (and it is only spent on a successful capture).
  async legendBattle(species, level, opts = {}) {
    const w = this.app.world;
    const pl = w.actor('player');
    const A = opts.arena || { x: pl.pos.x, z: pl.pos.z, r: 8 };
    if (opts.actor) opts.actor.setVisible(false);
    const snap = this.npcSnap(species, level);
    snap.maxHp = Math.round(snap.maxHp * 2.2); snap.hp = snap.maxHp;
    const hasStar = S.hasItem(this.s, 'star_gem');
    const gems = { get id() { return hasStar ? 'star_gem' : null; }, mul: () => gemMultiplier('star_gem', elemsOf(SPECIES[species])), consume: () => {} };
    const res = await this.trainerBattle({
      arena: A, foes: [{ id: 'legend', name: SPECIES[species].name, ai: 'boss', snaps: [snap] }],
      rules: { wild: true, capture: hasStar, flee: true }, title: `${SPECIES[species].name}!`,
      subtitle: hasStar ? 'The Star Gem resonates… weaken it, then throw!' : 'A living legend. Without a Star Gem you can only hold your ground.',
      music: 'boss', colors: ['#ffd98a', '#3a2a8a'], gems, wild: true, expMul: 1.5,
    });
    if (res && res.reason === 'capture') S.addItem(this.s, 'star_gem', -1);
    else if (opts.actor) opts.actor.setVisible(true);
    return res;
  }
  pickGem() { const order = ['diamond', 'amethyst', 'ruby', 'sapphire', 'emerald', 'topaz', 'opal', 'quartz']; return order.find((g) => this.s.bag[g] > 0) || null; }
  avgLevel() { const p = this.s.party; return p.length ? Math.round(p.reduce((a, m) => a + m.level, 0) / p.length) : 5; }

  // ------------------------------------------------------------- rewards
  async afterBattle(res, o) {
    if (!res) return;
    const s = this.s;
    s.stats.battles++;
    const won = res.winner === 0;
    if (won) s.stats.wins++;
    s.stats.reactions += res.stats.reactions; s.stats.teamCombos += res.stats.teamCombos;
    // sync party HP + counters
    const parts = [];
    for (const u of res.units) {
      if (u.side !== 0 || u.trainer !== 'player') continue;
      const mon = S.monByUid(s, u.uid);
      if (!mon) continue;
      mon.hp = u.fainted ? 0 : Math.max(0.05, u.hp / u.maxHp);
      const k = mon.counters;
      k.precise += u.k.precise; k.healed += u.k.healed; k.blocked += u.k.blocked; k.beats += u.k.beats; k.charged += u.k.charged; k.teamCombos += u.k.teamCombos; k.reactions += u.k.reactions;
      if (u.took) { k.battles++; parts.push(mon); if (won) k.wins++; }
    }
    for (const d of res.defeats) { const mon = S.monByUid(s, d.by); if (mon) mon.counters.defeat[d.species] = (mon.counters.defeat[d.species] || 0) + 1; }
    for (const id of res.used.items) S.addItem(s, id, -1);
    for (const u of res.units) if (u.side === 1) S.seen(s, u.species);
    // capture
    if (res.reason === 'capture' && res.captured) {
      const c = res.captured;
      const mon = createElemon(c.species, { level: c.level, wild: true, drip: c.drip, look: c.look, ot: s.player.name, caught: { day: s.time.day, map: this.app.world.mapId, gem: c.gem } });
      mon.hp = Math.max(0.2, c.hp);
      for (const [lv, id] of SPECIES[c.species].learn) if (lv <= c.level && !mon.skills.known.includes(id)) mon.skills.known.push(id);
      mon.skills.active = mon.skills.known.filter((id) => SKILLS[id].kind === 'active').slice(0, 4);
      const where = S.addElemon(s, mon);
      s.stats.captures++;
      if (c.species === 'rollingstone') this.startQuest('satisfaction');
      this.app.ui.toast(`${SPECIES[c.species].name} joined your ${where === 'party' ? 'team' : 'Elemon Box'}!`, 'gold', 3200);
      if (SPECIES[c.species].bond < 40) this.app.ui.toast(`${SPECIES[c.species].name} doesn't trust you yet… (low friendship: it may ignore commands)`, '', 4200);
    }
    // EXP
    if ((won || res.reason === 'capture') && parts.length) {
      let exp = 0;
      for (const u of res.units) if (u.side === 1) { const sp = SPECIES[u.species]; exp += (sp.exp || 50) * (u.level || 5) / 6; }
      exp *= (o.trainer && !o.wild ? 1.4 : 1) * (o.expMul || 1);
      const allUps = [];
      for (const mon of parts) {
        const ups = gainExp(mon, exp);
        addFriendship(mon, 3);
        if (ups.length) allUps.push({ mon, ups });
      }
      // benched party members get a share
      for (const mon of s.party) if (!parts.includes(mon) && !S.inDojo(s, mon.uid)) { const ups = gainExp(mon, exp * 0.3); if (ups.length) allUps.push({ mon, ups }); }
      this.app.ui.toast(`+${Math.round(exp)} EXP`, 'good', 1800);
      if (o.money && won) { s.money += o.money; this.app.ui.toast(`+¥${o.money.toLocaleString()}`, 'gold'); }
      if (o.league && won) { s.league.wins++; const up = S.addLeaguePoints(s, o.league); this.app.ui.toast(`+${o.league} League points`, 'gold'); if (up) { await this.app.ui.cutin('RANK UP!', S.rankOf(s).name, ['#ffd23a', '#ff4fa8'], 1600); } }
      for (const { mon, ups } of allUps) await this.app.screens.levelUp(mon, ups);
    } else if (!won && o.league) { s.league.losses++; S.addLeaguePoints(s, -Math.round(o.league / 3)); }
    if (!won && res.reason !== 'capture' && res.reason !== 'flee') {
      // knocked out: everyone is exhausted, revive weakly
      for (const m of s.party) if (!m.hp) m.hp = 0.15;
    }
    await this.checkEvolutions();
    this.checkQuests();
  }
  async checkEvolutions() {
    for (const mon of this.s.party) {
      const opts = evolutionOptions(mon, { location: this.app.world.mapId, hour: this.s.time.hour, weather: weatherOf(this.s.time) });
      if (!opts.length) continue;
      const pick = opts.length > 1 ? await this.app.screens.pickEvolution(mon, opts) : opts[0];
      if (pick) await this.app.screens.evolve(mon, pick.to);
    }
  }
  checkQuests() {
    const s = this.s;
    for (const id of Object.keys(s.quests)) {
      const q = s.quests[id];
      if (q.done) continue;
      const pr = questProgress(s, id);
      if (pr.current !== q.step) {
        if (pr.complete) this.completeQuest(id);
        else if (pr.current > (q.step ?? 0)) this.app.ui.toast(`📜 ${QUESTS[id].name}: ${pr.steps[pr.current].text}`, '', 3000);
        q.step = pr.current;
      }
    }
    this.app.updateObjective && this.app.updateObjective();
  }
  startQuest(id) { if (!this.s.quests[id]) { this.s.quests[id] = { step: 0, done: false, started: this.s.time.day }; this.app.ui.toast(`📜 New quest: ${QUESTS[id].name}`, 'gold', 3000); this.app.audio.sfx('notification'); } }
  completeQuest(id) {
    const q = this.s.quests[id]; if (!q || q.done) return;
    q.done = true;
    const r = QUESTS[id].reward || {};
    if (r.money) this.s.money += r.money;
    for (const [it, n] of Object.entries(r.items || {})) S.addItem(this.s, it, n);
    for (const c of r.cosmetics || []) S.ownCosmetic(this.s, c);
    Object.assign(this.s.flags, r.flags || {});
    this.app.ui.toast(`🏆 Quest complete: ${QUESTS[id].name}!`, 'gold', 3600);
    this.app.audio.stinger && this.app.audio.stinger('quest');
  }
  give(id, n = 1) { S.addItem(this.s, id, n); const it = ITEMS[id]; this.app.ui.toast(`${it ? it.icon + ' ' + it.name : id} ×${n}`, 'good'); this.app.audio.sfx('reward'); this.checkQuests(); }
  pay(n) { this.s.money += n; this.app.ui.toast((n >= 0 ? '+' : '') + '¥' + n.toLocaleString(), n >= 0 ? 'gold' : ''); this.app.audio.sfx('coin'); }
  // apply a choice-scene option
  applyBoost(opt, mon = this.s.party[0]) {
    const msgs = [];
    if (opt.stat && mon) { mon.alloc[opt.stat.stat] += opt.stat.n; msgs.push(`${nameOf(mon)} ${opt.stat.stat.toUpperCase()} +${opt.stat.n}`); }
    if (opt.friend && mon) { addFriendship(mon, opt.friend); msgs.push(`Friendship +${opt.friend}`); }
    if (opt.money) { this.s.money += opt.money; msgs.push((opt.money > 0 ? '+' : '') + '¥' + opt.money); }
    for (const [it, n] of Object.entries(opt.items || {})) { S.addItem(this.s, it, n); msgs.push(`${ITEMS[it]?.name || it} ×${n}`); }
    if (opt.food && mon && !mon.counters.foods.includes(opt.food)) mon.counters.foods.push(opt.food);
    if (opt.flag) S.setFlag(this.s, opt.flag);
    if (msgs.length) this.app.ui.toast('⬆ ' + msgs.join(' · '), 'good', 2800);
    return msgs;
  }
  healAll() { S.healParty(this.s, 1); }
}
