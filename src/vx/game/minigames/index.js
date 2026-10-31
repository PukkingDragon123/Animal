// Mini-games in the walkable city: the registry, the venues (interactables, a host NPC, signs and the arcade
// cabinet, registered at runtime after the city loads — the district files stay untouched), the high scores
// and rewards in the save, the "well fed" team buff, and the dev entry (?mg=<id>).
//
//   fishing    BAYSIDE BITE      the end of Bayside Pier (Old Salt's "Try fishing" spot)
//   dash       TOKON DASH        a hurdle race down Steiner Walk, Alamo Hill Park
//   dumplings  DUMPLING RUSH     Dumpling Auntie's cart on Grant Lane, Chinatown
//   curry      MOM'S CURRY       the stove at home, Sunset Row
//   arcade     TIDE POOL ARCADE  a cabinet outside the arcade on Bayside Pier
//   rhythm     BEAT CLASH        the DJ booth at the Street Arena
//
// Dev URLs: ?mg=fishing (boots straight into the game), &mgbot=1 (it plays itself), &mgskip=1 (no intro),
// &mgdebug=1 (logs). From the console: __app.minigames.play('dash'), __app.minigames.cur.sim(10).
// Hooks: app.js builds `new Minigames(app)` and lets it boot ?mg=; world.js calls onCity() after the city loads.
import * as S from '../../../game/state.js';
import { addFriendship, gainExp } from '../../../game/elemon.js';
import { ITEMS } from '../../../data/items.js';
import { SPECIES } from '../../../data/species.js';
import { T } from '../../../px/game/ui.js';
import { Session, fmt, fmtTime, signTex, signPost, boxes, picture, canvasTex } from './kit.js';
import { buildCabinet } from './cabinet.js';

export const GAMES = {
  fishing: {
    id: 'fishing', title: 'BAYSIDE BITE', short: 'Bayside Bite', sub: 'Fishing derby · Bayside Pier', icon: 'drop', color: '#2f9ad8',
    load: () => import('./fishing.js'),
    venue: { hijack: 'Try fishing', x: 170.0, z: 4.4, label: 'Fishing derby', start: [168.6, 4.6, Math.PI] },
    ask: ['Old Salt', 'Fishing derby, eh? Seventy-five seconds, as many bites as you can land. Biggest haul gets paid.'],
  },
  dash: {
    id: 'dash', title: 'TOKON DASH', short: 'Tokon Dash', sub: 'Hurdle race · Steiner Walk', icon: 'shoe', color: '#4cc04a', lowerBetter: true,
    load: () => import('./dash.js'),
    venue: { npc: { id: 'mgMarshal', who: 'passerby131', x: 18.1, z: 39.6, yaw: -Math.PI / 2, name: 'Race Marshal', clip: 'idle' }, label: 'Enter the Tokon Dash', r: 1.9, start: [19.4, 40.6, -Math.PI / 2] },
    ask: ['Race Marshal', 'Tokon Dash! Down Steiner Walk, round the cone and back. Jump the hurdles, keep the beat. Your partner in?'],
  },
  dumplings: {
    id: 'dumplings', title: 'DUMPLING RUSH', short: 'Dumpling Rush', sub: "Auntie's cart · Grant Lane", icon: 'bowl', color: '#e8603a',
    load: () => import('./dumplings.js'),
    venue: { x: 145.2, z: 87.4, label: 'Help at the cart', r: 1.2, start: [146.4, 88.2, -Math.PI / 2] },
    ask: ['Dumpling Auntie', 'Lunch rush! My hands are only two. Fold, steam, serve — and NO burnt bottoms. You help, I pay.'],
  },
  curry: {
    id: 'curry', title: "MOM'S CURRY", short: "Mom's Curry", sub: 'Cooking with Mom · Sunset Row', icon: 'flame', color: '#f0a020',
    load: () => import('./curry.js'),
    venue: { hijack: 'Stove', x: 59.55, z: 142.3, label: 'Cook curry with Mom', keepOrig: true, start: [61.2, 143.6, Math.PI] },
    ask: ['Mom', 'Curry night! Chop, add, simmer, stir. A good curry makes a strong team, sweetheart.'],
  },
  arcade: {
    id: 'arcade', title: 'TIDE POOL ARCADE', short: 'Reef Rumble', sub: 'REEF RUMBLE · Bayside Pier', icon: 'star', color: '#9c5ae0',
    load: () => import('./arcade.js'),
    venue: { x: 156.95, z: 5.0, label: 'Play REEF RUMBLE', r: 1.1, cabinet: [156.05, 5.0], start: [158.2, 5.4, -Math.PI / 2] },
  },
  rhythm: {
    id: 'rhythm', title: 'BEAT CLASH', short: 'Beat Clash', sub: 'Rhythm battle · Street Arena', icon: 'music', color: '#ff4a8a',
    load: () => import('./rhythm.js'),
    venue: { x: 120.5, z: 152.9, L: 0, label: 'DJ booth: Beat Clash', r: 1.4, start: [121.4, 155.6, Math.PI] },
    ask: ['DJ Kiki', 'Beat Clash! Your partner versus my champ, one track, every hit on the beat lands a blow. Ready to drop it?'],
  },
};
export const GAME_IDS = Object.keys(GAMES);

export class Minigames {
  constructor(app) {
    this.app = app; this.cur = null; this.venueObjs = [];
    const P = app.params || new URLSearchParams('');
    this.debug = !!P.get('mgdebug'); this.bot = !!P.get('mgbot'); this.skip = !!P.get('mgskip');
    this.wrapBattles();
  }
  // ---------------------------------------------------------------- save data
  mem() {
    const s = this.app.state;
    if (!s.minigames || typeof s.minigames !== 'object') s.minigames = {};
    const M = s.minigames; M.best = M.best || {}; M.plays = M.plays || {}; M.firsts = M.firsts || {};
    return M;
  }
  best(id) { const v = this.mem().best[id]; return v == null ? null : v; }
  // ---------------------------------------------------------------- dev entry: ?mg=<id>
  wants() { const id = this.app.params && this.app.params.get('mg'); return !!id; }
  async devBoot() {
    const app = this.app, P = app.params, id = P.get('mg'), def = GAMES[id];
    app.story.loadSave();
    if (!app.state.party.length) { S.giveStarter(app.state, P.get('starter') || 'chilichick', 8); S.setFlag(app.state, 'phone'); }
    const at = (def && def.venue.start) || [110, 104, 0];
    await app.story.run(async () => {
      await app.world.load('city', { mood: P.get('mood') || undefined });
      await app.story.startRoam([at[0], at[1], at[2] || 0]);
      await app.fade(0, 300);
    });
    if (def) setTimeout(() => this.play(id, { dev: true }), 250);
    else console.warn('[mg] unknown mini-game', id, '— try one of', GAME_IDS.join(', '));
  }
  /** start a game from anywhere (dev, console): waits for the story to be free */
  async play(id, o = {}) {
    const st = this.app.story;
    for (let i = 0; i < 200 && st.busy; i++) await new Promise((r) => setTimeout(r, 100));
    return st.run(() => this.launch(id, o));
  }
  // ---------------------------------------------------------------- the city venues (called by world.load)
  onCity(world, city) {
    for (const o of this.venueObjs) if (o.parent) o.parent.remove(o);
    this.venueObjs = [];
    const scene = world.st.scene, nav = city.nav;
    for (const def of Object.values(GAMES)) {
      const v = def.venue, act = async (app) => { await this.launch(def.id, { from: 'venue' }); };
      try {
        if (v.hijack) {
          const it = city.inter.find((i) => i.label === v.hijack && Math.hypot(i.x - v.x, i.z - v.z) < 2);
          if (it) {
            const orig = it.act;
            it.label = v.label; it.icon = def.icon; it.mm = true; it.mg = def.id;
            it.act = v.keepOrig ? async (app, i) => { const k = await app.choose(def.ask ? def.ask[1] : 'Play?', [v.label, 'Just look']); if (k === 0) return this.launch(def.id, { asked: true }); return orig(app, i); } : act;
            continue;
          }
        }
        if (v.npc) {
          const n = { ...v.npc, L: 0, lines: [] };
          city.npcs.push(n);
          city.inter.push({ npc: n.id, x: n.x, z: n.z, L: 0, r: v.r || 1.8, y: nav.ground(n.x, n.z, 0) + 1.9, label: v.label, icon: def.icon, mm: true, mg: def.id, act });
        } else city.inter.push({ x: v.x, z: v.z, L: v.L || 0, r: v.r || 1.4, y: nav.ground(v.x, v.z, v.L || 0) + 1.2, label: v.label, icon: def.icon, mm: true, mg: def.id, act });
        // signs and set pieces
        const add = (o) => { scene.add(o); this.venueObjs.push(o); };
        if (v.cabinet) { const cab = buildCabinet(); cab.position.set(v.cabinet[0], nav.ground(v.cabinet[0], v.cabinet[1], 0), v.cabinet[1]); cab.rotation.y = Math.PI / 2; add(cab); this.cabinet = cab; nav.block(v.cabinet[0] - 0.35, v.cabinet[1] - 0.42, v.cabinet[0] + 0.4, v.cabinet[1] + 0.42, 0); }
        const sign = SIGNS[def.id]; if (sign) { const [x, z, yaw, w, h, o] = sign; add(signPost(signTex(o.text, o), w, h, x, nav.ground(x, z, 0), z, yaw, { top: o.top ?? 1.3 })); nav.block(x - 0.15, z - 0.15, x + 0.15, z + 0.15, 0); }
      } catch (e) { console.warn('[mg] venue', def.id, e); }
    }
  }
  // ---------------------------------------------------------------- one play: ask, run the session, record
  async launch(id, o = {}) {
    if (this.cur) return;
    const def = GAMES[id], app = this.app; if (!def) return;
    if (def.ask && !o.dev && !o.asked && !app.auto) {
      const k = await app.choose(def.ask[0] + ': ' + def.ask[1], ["Let's go!", 'Not now']);
      if (k !== 0) return;
    }
    let mod; try { mod = await def.load(); } catch (e) { console.error('[mg] load', id, e); app.toast('That game is closed for now', { icon: 'close' }); return; }
    const sess = new Session(this, def, mod.default, { bot: this.bot, skipIntro: this.skip || app.auto, auto: app.auto });
    this.cur = sess;
    try { await sess.run(); } finally { this.cur = null; app.save(); }
  }
  /** the round is over: high score, rewards (applied now), and the results-screen summary */
  record(def, res, sess) {
    const app = this.app, s = app.state, M = this.mem(), G = sess.game.constructor;
    res = res || { score: 0 };
    const prev = M.best[def.id], plays = (M.plays[def.id] || 0) + 1; M.plays[def.id] = plays;
    const lower = !!def.lowerBetter, val = lower ? res.time : res.score;
    const valid = val != null && (lower ? res.finished !== false : true);
    const record = valid && (prev == null || (lower ? val < prev : val > prev)) && (lower || val > 0);
    if (record) M.best[def.id] = val;
    const rank = G.rank ? G.rank(res) : rankOf(res.score, G.ranks);
    const R = G.rewards ? G.rewards(res, { first: plays === 1, record, prev, rank, state: s, mem: M }) : { money: Math.round(res.score / 10) };
    const rows = this.grant(R, sess);
    const bestV = M.best[def.id];
    return {
      score: res.score || 0, scoreText: res.scoreText, scoreLabel: res.scoreLabel, record, rank, lines: res.lines || [],
      bestText: bestV == null ? '—' : lower ? fmtTime(bestV) : fmt(bestV), bestLabel: lower ? 'BEST TIME' : 'BEST', rewards: rows,
    };
  }
  grant(R, sess) {
    const s = this.app.state, rows = [], lead = s.party[0];
    if (R.money) { s.money = (s.money || 0) + R.money; rows.push({ icon: 'coin', text: '+' + fmt(R.money) }); }
    for (const [id, n] of R.items || []) { if (!ITEMS[id] || !n) continue; S.addItem(s, id, n); rows.push({ icon: ITEM_ICON[ITEMS[id].kind] || 'bag', text: `${ITEMS[id].name}${n > 1 ? ' ×' + n : ''}` }); }
    if (R.friend && lead) { addFriendship(lead, R.friend); rows.push({ icon: 'heart', text: `${sess.partnerName} +${R.friend}`, color: '#d8365a' }); }
    if (R.exp && s.party.length) { let ups = 0; for (const m of s.party) ups += gainExp(m, R.exp).length; rows.push({ icon: 'star', text: `Team +${R.exp} EXP${ups ? ' · Lv UP!' : ''}` }); }
    if (R.heal) { S.healParty(s, 1); rows.push({ icon: 'potion', text: 'Team healed' }); }
    if (R.buff) { this.mem().buff = R.buff; rows.push({ icon: 'flame', text: `${R.buff.name}: next ${R.buff.battles} battles` }); }
    for (const sp of R.seen || []) if (SPECIES[sp]) S.seen(s, sp);
    if (R.note) rows.push({ icon: R.note.icon || 'star', text: R.note.text });
    return rows;
  }
  // ---------------------------------------------------------------- the "well fed" buff (Mom's curry): real battle stats
  // While a buff lasts, each battle's party snapshot gets +k on the listed stats. The bonus rides on a Proxy over
  // mon.astralStats whose toJSON() hands back the untouched stats, so a save during the battle never keeps it.
  wrapBattles() {
    const app = this.app; if (!app || typeof app.startBattle !== 'function' || app.startBattle.mgWrapped) return;
    const orig = app.startBattle.bind(app);
    const wrapped = async (spec) => { const undo = this.applyBuff(); try { return await orig(spec); } finally { if (undo) undo(); } };
    wrapped.mgWrapped = true; app.startBattle = wrapped;
  }
  applyBuff() {
    const app = this.app, M = this.mem(), B = M.buff; if (!B || !(B.battles > 0) || app.auto) return null;
    const add = B.stats || {}, undo = [];
    for (const m of app.state.party || []) {
      const real = m.astralStats, base = real || {};
      const px = new Proxy(base, { get(t, k) { if (k === 'toJSON') return () => (real ? { ...t } : undefined); return typeof k === 'string' && add[k] ? (t[k] || 0) + add[k] : t[k]; } });
      m.astralStats = px; undo.push(() => { if (m.astralStats === px) { if (real || Object.keys(base).length) m.astralStats = base; else delete m.astralStats; } });
    }
    B.battles--; if (B.battles <= 0) M.buff = null;
    try { app.toast(`${B.name}: your team feels strong!`, { icon: 'flame', color: T.amber, dur: 2.6 }); } catch (e) { /* ui */ }
    return () => undo.forEach((f) => f());
  }
}
const ITEM_ICON = { food: 'bowl', gem: 'disc', boost: 'candy', key: 'star', disc: 'disc', gear: 'bag' };
function rankOf(score, ranks) { if (!ranks) return null; const [s, a, b] = ranks; return score >= s ? 'S' : score >= a ? 'A' : score >= b ? 'B' : 'C'; }

// little signs at the venues: [x, z, yaw, w, h, { text, sub, bg, fg }]
const SIGNS = {
  dash: [16.9, 41.8, Math.PI / 2, 1.3, 0.62, { text: 'TOKON DASH', sub: 'HURDLE RACE · TODAY', bg: '#4cc04a', fg: '#ffffff', shadow: '#1c5a1a', fs: 16 }],
  dumplings: [146.3, 87.9, -Math.PI / 2, 1.1, 0.55, { text: 'HELP WANTED', sub: 'DUMPLING RUSH', bg: '#e8603a', fg: '#fff4d8', shadow: '#7a2410', fs: 16 }],
  rhythm: [123.6, 154.4, 0, 1.2, 0.6, { text: 'BEAT CLASH', sub: 'DJ BOOTH · OPEN', bg: '#ff4a8a', fg: '#ffffff', shadow: '#6a1a3a', fs: 16, top: 0.9 }],
  fishing: [169.2, 5.6, Math.PI / 2, 1.1, 0.55, { text: 'FISHING DERBY', sub: '75 SECONDS · PRIZES', bg: '#2f9ad8', fg: '#ffffff', shadow: '#123a5a', fs: 14 }],
};
void boxes; void picture; void canvasTex;
