// Full-screen UI flows: title, character creator, starter select, choice
// scenes, level-up rewards, evolution cinematic, pause menu (team, Elemon
// detail with stats/loadout/Astral tree, bag, quests, style, dex, system),
// world map, shops and dojo.
import { h, clear, wait, tapBtn } from './dom.js';
import { Preview, disposeAllPreviews } from './preview.js';
import { SPECIES, STARTERS, elemsOf, primaryElem } from '../data/species.js';
import { SKILLS } from '../data/skills.js';
import { ELEMENTS } from '../data/elements.js';
import { ITEMS } from '../data/items.js';
import { COSMETICS, SLOT_NAMES, COSMETIC_SLOTS } from '../data/cosmetics.js';
import { LOCATIONS, TOWNS } from '../data/locations.js';
import { QUESTS, questProgress } from '../data/quests.js';
import { MEALS } from '../data/events.js';
import { astralTree, nodeState, unlockNode } from '../data/astral.js';
import { creatureDesign, humanDesignFor, HUMANS, LORE } from '../data/designs/index.js';
import { STAT_KEYS, STAT_NAMES, statsOf, maxHpOf, allocate, learn, equip, unequip, nameOf, expToNext, condProgress, evolve, SPECTRAL_FRIENDSHIP } from '../game/elemon.js';
import * as S from '../game/state.js';
import { skillIcon, elemColor, monIcon } from './battlehud.js';
import { Actor } from '../gfx/actor.js';
import { SPR } from '../gfx/particles.js';

const elChip = (e) => h('span.el', { style: { background: elemColor(e) } }, (ELEMENTS[e]?.icon || '') + ' ' + (ELEMENTS[e]?.name || e));
const skillDesc = (sk) => `${sk.desc}${sk.kind === 'active' ? ` · ${sk.cost} EN · ${sk.cd}s CD` : ''}`;

export class Screens {
  constructor(app) { this.app = app; this.ui = app.ui; this.audio = app.audio; }
  get s() { return this.app.state; }
  close() { disposeAllPreviews(); this.ui.closeModal(); }

  // ================================================================= title
  title(hasSave) {
    return new Promise((res) => {
      const t = clear(this.ui.L.title);
      t.classList.add('show');
      const mk = (label, cls, val) => { const b = h('button.btn' + cls, {}, h('span', {}, label)); tapBtn(b, () => { this.audio.unlock && this.audio.unlock(); this.audio.sfx('ui_confirm'); t.classList.remove('show'); clear(t); res(val); }); return b; };
      t.append(
        h('div.logo', {}, 'ELEMON'), h('div.tag', {}, 'OSAKA 2050'), h('div.jp', {}, 'エレモン ・ ソウルリンク'),
        h('div.menu', {}, hasSave ? mk('▶  Continue', '.primary', 'continue') : '', mk(hasSave ? '✦  New Game' : '▶  New Game', hasSave ? '.cyan' : '.primary', 'new')),
        h('div.foot', {}, 'Tap to move · drag skills to aim · swipe to dodge  —  A creature-battle RPG in 3D pixel art'),
      );
    });
  }

  // ================================================================= character creator
  creator() {
    return new Promise((res) => {
      const C = HUMANS.CHARACTERS || {};
      let preset = 'player_a';
      let look = JSON.parse(JSON.stringify(C[preset] || {}));
      let name = 'Rin';
      const prevBox = h('div.preview3d', { style: { height: 'min(52vh,420px)', background: 'radial-gradient(circle at 50% 40%,#ffe9f6,#c9b5ff)' } });
      const nameIn = h('input.name', { value: name, maxlength: 12, placeholder: 'Your name' });
      nameIn.addEventListener('input', () => { name = nameIn.value; });
      const body = h('div.split');
      const ctrls = h('div.col');
      body.append(h('div.col', {}, prevBox, h('div.muted', { style: { textAlign: 'center' } }, 'Drag to rotate')), ctrls);
      const sheet = this.ui.sheet('Who are you?', body, { noClose: true });
      this.ui.modal(sheet);
      const pv = new Preview(prevBox, { spin: 0.4 });
      const refresh = () => { pv.show(humanDesignFor(S.playerLook(this.s, look))); };
      const row = (label, items) => h('div', {}, h('div', { style: { fontWeight: 900, margin: '6px 0 4px' } }, label), h('div.row', {}, ...items));
      const presets = ['player_a', 'player_b', 'player_c'].filter((p) => C[p]).map((p, i) => { const b = h('button.opt' + (p === preset ? '.on' : ''), {}, ['Style A', 'Style B', 'Style C'][i]); tapBtn(b, () => { preset = p; look = JSON.parse(JSON.stringify(C[p])); refresh(); build(); }); return b; });
      const build = () => {
        clear(ctrls);
        ctrls.append(h('div', { style: { fontWeight: 900 } }, 'Name'), nameIn, row('Preset', presets.map((b, i) => { b.className = 'opt' + (['player_a', 'player_b', 'player_c'][i] === preset ? ' on' : ''); return b; })));
        const hs = (HUMANS.HAIR_STYLES || []).slice(0, 14).map((st) => { const b = h('button.opt' + ((look.hair?.style || '') === st ? '.on' : ''), {}, st.replace('_', ' ')); tapBtn(b, () => { look.hair = Object.assign({}, look.hair, { style: st }); refresh(); build(); }); return b; });
        ctrls.append(row('Hair', hs));
        const sw = (list, get, set) => list.map((c) => { const b = h('button.sw' + (get() === c ? '.on' : ''), { style: { background: c } }); tapBtn(b, () => { set(c); refresh(); build(); }); return b; });
        ctrls.append(row('Hair colour', sw(HUMANS.HAIR_COLORS || [], () => look.hair?.color, (c) => { look.hair = Object.assign({}, look.hair, { color: c }); })));
        ctrls.append(row('Skin', sw(HUMANS.SKIN_TONES || [], () => look.skin, (c) => { look.skin = c; })));
        ctrls.append(row('Eyes', sw(HUMANS.IRIS_COLORS || [], () => look.eyes?.iris, (c) => { look.eyes = Object.assign({}, look.eyes, { iris: c }); })));
        ctrls.append(row('Jacket', sw(['#ff4fa8', '#2fa8ff', '#ffd23a', '#5fd35a', '#8a5aff', '#ff6a2b', '#1b1230', '#f4f4f4'], () => look.top?.color, (c) => { look.top = Object.assign({}, look.top, { color: c }); })));
        const go = h('button.btn.primary', { style: { marginTop: '12px' } }, h('span', {}, "That's me! ▶"));
        tapBtn(go, () => { this.audio.sfx('ui_confirm'); this.close(); res({ name: (name || 'Rin').trim().slice(0, 12) || 'Rin', look, preset }); });
        ctrls.append(go);
      };
      refresh(); build();
    });
  }

  // ================================================================= starter select
  starterSelect() {
    return new Promise((res) => {
      let i = 0;
      const prev = h('div', { style: { position: 'absolute', left: '50%', top: '12%', transform: 'translateX(-50%)', width: 'min(70vw,440px)', height: 'min(42vh,380px)' } });
      const info = h('div.starter-info.panel');
      const dots = h('div.dots');
      const left = h('button.iconbtn', { style: { position: 'absolute', left: '4vw', top: '32%' } }, '◀'), right = h('button.iconbtn', { style: { position: 'absolute', right: '4vw', top: '32%' } }, '▶');
      const choose = h('button.btn.primary', {}, h('span', {}, 'Choose this partner!'));
      const wrap = h('div.cscene', {}, h('div.head', {}, h('h2', {}, 'Choose your partner'), h('p', {}, 'Your soul stone will link with them forever.')), prev, left, right, dots, info, choose);
      this.ui.modal(wrap, { clear: true });
      const pv = new Preview(prev, { spin: 0.35, floor: true });
      const render = () => {
        const id = STARTERS[i], sp = SPECIES[id], e = primaryElem(sp), L = LORE[id] || {};
        pv.show(creatureDesign(id), id, { play: 'happy' });
        clear(info).append(
          h('div.row', {}, h('div.title-font', { style: { fontSize: '26px' } }, sp.name), elChip(e), h('span.chip', { style: { background: 'var(--ink)', color: '#fff' } }, ELEMENTS[e].role)),
          h('div', { style: { fontSize: '13px', margin: '6px 0', lineHeight: 1.45 } }, L.desc || ''),
          h('div', { style: { fontSize: '13px', color: '#5a4c78', lineHeight: 1.4 } }, h('b', {}, 'Playstyle: '), ELEMENTS[e].desc),
          h('div', { style: { fontSize: '13px', color: '#5a4c78', marginTop: '4px' } }, h('b', {}, 'Personality: '), sp.personality || L.personality || ''),
          h('div.row', { style: { marginTop: '8px' } }, ...sp.start.map((sid) => h('span.chip', { style: { background: elemColor(SKILLS[sid].elem), color: '#160c26', border: '2px solid #1b1230' } }, skillIcon(SKILLS[sid]) + ' ' + SKILLS[sid].name))),
        );
        clear(dots).append(...STARTERS.map((_, k) => h('i' + (k === i ? '.on' : ''))));
        this.app.onStarterFocus && this.app.onStarterFocus(id, i);
        this.audio.sfx('ui_open', { pitch: 0.9 + i * 0.05 });
      };
      tapBtn(left, () => { i = (i + STARTERS.length - 1) % STARTERS.length; render(); });
      tapBtn(right, () => { i = (i + 1) % STARTERS.length; render(); });
      tapBtn(choose, async () => {
        this.audio.sfx('ui_confirm');
        const ok = await this.confirm(`Link souls with ${SPECIES[STARTERS[i]].name}?`);
        if (ok) { this.close(); res(STARTERS[i]); }
      });
      render();
    });
  }
  confirm(text, yes = 'Yes!', no = 'Not yet') {
    return new Promise((res) => {
      const box = h('div.panel', { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', padding: '18px 20px', width: 'min(88vw,380px)', textAlign: 'center', zIndex: 5, pointerEvents: 'auto' } }, h('div', { style: { fontWeight: 900, fontSize: '17px', marginBottom: '12px' } }, text));
      const y = h('button.btn.primary', {}, h('span', {}, yes)), n = h('button.btn', {}, h('span', {}, no));
      box.append(h('div.row', { style: { justifyContent: 'center' } }, y, n));
      const m = this.ui.L.modal, shown = m.classList.contains('show');
      if (!shown) m.classList.add('show', 'clear');
      m.append(box);
      const done = (v) => { box.remove(); if (!shown) m.classList.remove('show', 'clear'); res(v); };
      tapBtn(y, () => done(true));
      tapBtn(n, () => done(false));
    });
  }

  // ================================================================= choice scene (meals / events)
  // cfg: { title, subtitle, options:[{label, icon, desc, stat, friend, money, items}], picks }
  choiceScene(cfg) {
    return new Promise((res) => {
      const picks = cfg.picks || 1;
      const chosen = [];
      const opts = h('div.copts');
      const head = h('div.head', {}, h('h2', {}, cfg.title), h('p', {}, cfg.subtitle || ''));
      const wrap = h('div.cscene', {}, head, opts);
      this.ui.modal(wrap, { clear: true });
      cfg.options.forEach((o, k) => {
        const tags = [];
        if (o.stat) tags.push(h('span.boost', {}, `${o.stat.stat.toUpperCase()} +${o.stat.n}`));
        if (o.friend) tags.push(h('span.boost', {}, `♥ +${o.friend}`));
        if (o.money) tags.push(h('span.boost', {}, (o.money > 0 ? '+' : '') + '¥' + o.money));
        if (o.items) for (const [it, n] of Object.entries(o.items)) tags.push(h('span.boost', {}, `${ITEMS[it]?.icon || ''}×${n}`));
        if (o.battle) tags.push(h('span.boost', {}, '⚔ Battle'));
        const card = h('button.copt', { style: { animationDelay: k * 70 + 'ms' } }, h('div.ic', {}, o.icon || '✦'), h('div.ttl', {}, o.label), h('div.desc', {}, o.desc || ''), h('div.row', { style: { justifyContent: 'center', gap: '4px' } }, ...tags));
        tapBtn(card, () => {
          if (chosen.includes(o)) return;
          chosen.push(o); card.classList.add('picked');
          this.audio.sfx('ui_confirm');
          if (this.app.onChoicePicked) this.app.onChoicePicked(o, cfg);
          if (chosen.length >= picks) setTimeout(() => { this.close(); res(chosen); }, 450);
        });
        opts.append(card);
      });
    });
  }

  // ================================================================= level up
  levelUp(mon, ups) {
    return new Promise((res) => {
      const sp = SPECIES[mon.species];
      const last = ups[ups.length - 1];
      const learnable = [...new Set(ups.flatMap((u) => u.learnable))].filter((id) => !mon.skills.known.includes(id));
      this.audio.stinger && this.audio.stinger('levelup');
      const body = h('div.split');
      const prev = h('div.preview3d', { style: { height: 'min(40vh,320px)', background: `radial-gradient(circle at 50% 40%,#fff,${elemColor(primaryElem(sp))})` } });
      const right = h('div.col');
      body.append(h('div.col', {}, prev, h('div.title-font', { style: { fontSize: '22px', textAlign: 'center' } }, `${nameOf(mon)}  Lv ${mon.level - ups.length} → ${mon.level}`)), right);
      const sheet = this.ui.sheet('LEVEL UP!', body, { noClose: true });
      this.ui.modal(sheet);
      new Preview(prev, { spin: 0.5 }).show(creatureDesign(mon.species), mon.species, { play: 'victory' });
      let rewardTaken = false;
      // reward cards
      const rewards = [];
      if (learnable.length) rewards.push({ kind: 'skill', id: learnable[0], label: `Learn ${SKILLS[learnable[0]].name}`, icon: skillIcon(SKILLS[learnable[0]]), desc: SKILLS[learnable[0]].desc });
      const best = STAT_KEYS.slice().sort((a, b) => sp.base[b] - sp.base[a])[Math.floor(Math.random() * 2)];
      rewards.push({ kind: 'stat', stat: best, n: 2, label: `${STAT_NAMES[best]} +2`, icon: '⬆', desc: 'A permanent stat bonus that also helps unlock Astral stars.' });
      rewards.push(Math.random() < 0.5 ? { kind: 'items', items: { takoyaki: 2, quartz: 2 }, label: 'Supply drop', icon: '🎁', desc: 'Takoyaki ×2 and Quartz gems ×2.' } : { kind: 'ap', label: '+1 Astral Point', icon: '✴', desc: 'Light another star in the Astral tree.' });
      if (learnable.length > 1) rewards.splice(1, 0, { kind: 'skill', id: learnable[1], label: `Learn ${SKILLS[learnable[1]].name}`, icon: skillIcon(SKILLS[learnable[1]]), desc: SKILLS[learnable[1]].desc });
      const draw = () => {
        clear(right);
        const st = statsOf(mon);
        right.append(h('div', { style: { fontWeight: 900 } }, `Stat points: ${mon.sp}  ·  Astral points: ${mon.ap}`));
        for (const k of STAT_KEYS) {
          const plus = h('button.plus', { disabled: mon.sp <= 0 }, '+');
          tapBtn(plus, () => { if (allocate(mon, k)) { this.audio.sfx('ui_tap', { pitch: 1.3 }); draw(); } });
          right.append(h('div.statrow', {}, h('b', {}, STAT_NAMES[k]), h('div.statbar', {}, h('i', { style: { width: Math.min(100, st[k] * 2.5) + '%' } })), h('span', {}, st[k].toFixed(0)), plus));
        }
        right.append(h('div', { style: { fontWeight: 900, marginTop: '6px' } }, rewardTaken ? 'Reward claimed!' : 'Choose a level-up reward:'));
        const row = h('div.copts', { style: { justifyContent: 'flex-start' } });
        if (!rewardTaken) for (const rw of rewards.slice(0, 3)) {
          const c = h('button.copt', { style: { width: '150px', minHeight: '120px' } }, h('div.ic', {}, rw.icon), h('div.ttl', {}, rw.label), h('div.desc', {}, rw.desc));
          tapBtn(c, () => {
            rewardTaken = true; this.audio.sfx('reward');
            if (rw.kind === 'skill') { learn(mon, rw.id); const ok = equip(mon, rw.id, this.s.unlocks.slots); this.ui.toast(`${nameOf(mon)} learned ${SKILLS[rw.id].name}!${ok ? '' : ' (equip it in the Skills tab)'}`, 'gold'); }
            else if (rw.kind === 'stat') { mon.alloc[rw.stat] += rw.n; }
            else if (rw.kind === 'items') for (const [it, n] of Object.entries(rw.items)) S.addItem(this.s, it, n);
            else if (rw.kind === 'ap') mon.ap += 1;
            draw();
          });
          row.append(c);
        }
        right.append(row);
        // other learnable skills just get learned (no reward cost) except the one offered
        const done = h('button.btn.primary', { style: { marginTop: '8px' } }, h('span', {}, mon.sp > 0 ? 'Continue (keep points for later)' : 'Continue ▶'));
        tapBtn(done, () => {
          for (const id of learnable) if (!mon.skills.known.includes(id) && !rewards.some((r) => r.id === id)) learn(mon, id);
          this.close(); res();
        });
        right.append(done);
      };
      draw();
    });
  }

  // ================================================================= evolution
  pickEvolution(mon, opts) {
    return this.choiceScene({ title: `${nameOf(mon)} can evolve!`, subtitle: 'Choose a path — this cannot be undone.', options: opts.map((o) => ({ label: SPECIES[o.to].name, icon: ELEMENTS[primaryElem(SPECIES[o.to])].icon, desc: (LORE[o.to] || {}).desc || o.hint, to: o.to })).concat([{ label: 'Not now', icon: '✋', desc: 'Stay as you are for now.' }]) }).then((r) => (r[0].to ? { to: r[0].to } : null));
  }
  async evolve(mon, to) {
    const app = this.app, gfx = app.gfx, w = app.world;
    const from = mon.species;
    app.busy = true; w.enableControl(false); app.hud.show(false);
    const pl = w.actor('player');
    const buddy = w.actor('buddy');
    const px = pl.pos.x + Math.sin(pl.yaw) * 1.8, pz = pl.pos.z + Math.cos(pl.yaw) * 1.8, py = w.grid.heightAt(px, pz);
    if (buddy) buddy.setVisible(false);
    const A = new Actor(gfx, creatureDesign(from), from);
    A.setPos(px, py, pz); A.faceTo(pl.pos.x, pl.pos.z, true);
    gfx.setLetterbox(true);
    this.audio.music(null); this.audio.stinger && this.audio.stinger('evolution');
    const orbit = gfx.rig.play({ from: [px + 3, py + 1.6, pz + 3], look: [px, py + A.height * 0.6, pz], dur: 7, orbit: [0.4, 0.4 + Math.PI * 0.9], radius: 3.4 + A.height, height: 1.2 + A.height * 0.4 });
    this.ui.captionOn(`What…? ${nameOf(mon)} is reacting to your soul stone!`);
    A.mode('float');
    const col = elemColor(primaryElem(SPECIES[to]));
    const C3 = new (await import('../../vendor/three.module.js')).Color(col);
    let t = 0;
    const tick = setInterval(() => {
      t += 0.05; A.update(0.05);
      const k = Math.min(1, t / 4);
      for (let i = 0; i < 6 + k * 14; i++) { const a = Math.random() * 6.28, r = 2.5 - k; gfx.fx.particle({ pos: [px + Math.cos(a) * r, py + Math.random() * 2.2, pz + Math.sin(a) * r], vel: [-Math.cos(a) * 3, 0.5, -Math.sin(a) * 3], life: 0.5, size: 0.14 + k * 0.1, color: [C3.r * 3, C3.g * 3, C3.b * 3, 1], color1: [2, 2, 2, 0], sprite: SPR.star }); }
      if (Math.random() < 0.1 + k * 0.4) A.flash(0xffffff, 0.15);
    }, 50);
    await wait(4200);
    clearInterval(tick);
    gfx.flash(0xffffff, 1);
    gfx.impact(1.6);
    const cols = Object.values(creatureDesign(from).pal || {}).slice(0, 4).map((c) => parseInt(String(c).replace('#', ''), 16) || 0xffffff);
    gfx.fx.shatter([px, py + A.height * 0.5, pz], { count: 90, size: 0.09, colors: cols, force: 6, up: 6, spread: A.height * 0.5 });
    A.dispose();
    evolve(mon, to);
    const B = new Actor(gfx, creatureDesign(to), to);
    B.setPos(px, py, pz); B.faceTo(pl.pos.x, pl.pos.z, true);
    B.dissolve(-1, 1.0, 0xffffff); B.play('spawn');
    gfx.fx.shape({ kind: 'pillar', pos: [px, py, pz], r0: 0.4, r1: 1.8, h0: 10, life: 1.6, color: col, intensity: 3, hold: 0.5 });
    gfx.fx.shape({ kind: 'ring', pos: [px, py + 0.1, pz], r0: 0.5, r1: 6, life: 1.2, color: col, intensity: 3 });
    this.audio.sfx('evolve_burst');
    this.ui.captionOff();
    const tk2 = setInterval(() => B.update(0.05), 50);
    await wait(900);
    B.play('roar');
    await this.ui.titleCard(SPECIES[to].name.toUpperCase(), `${SPECIES[from].name} evolved!`, 2600);
    clearInterval(tk2);
    B.dispose();
    gfx.rig.release(); gfx.setLetterbox(false);
    w.refreshBuddy(true);
    const bud = w.actor('buddy'); if (bud) { bud.setVisible(true); bud.setPos(px, py, pz); }
    this.s.dex.seen[to] = this.s.dex.caught[to] = true;
    app.hud.show(true); app.busy = false; w.enableControl(true);
    this.audio.music(w.def.ambience?.music || 'park');
  }

  // ================================================================= pause menu
  menu(tab = 'team', arg = null) {
    disposeAllPreviews();
    const tabs = [['team', '🐾 Team'], ['bag', '🎒 Bag'], ['quests', '📜 Quests'], ['style', '💎 Style'], ['dex', '📖 Dex'], ['system', '⚙️ System']];
    const tabEl = h('div.tabs', {}, ...tabs.map(([k, l]) => { const b = h('button.tab' + (k === tab || (tab === 'mon' && k === 'team') ? '.on' : ''), {}, l); tapBtn(b, () => { this.audio.sfx('ui_tap'); this.menu(k); }); return b; }));
    const body = h('div');
    const sheet = this.ui.sheet('Menu', body, { tabs: tabEl, onClose: () => { this.close(); this.app.onMenuClosed && this.app.onMenuClosed(); } });
    this.ui.modal(sheet);
    const fn = { team: () => this.tabTeam(body), mon: () => this.tabMon(body, arg), bag: () => this.tabBag(body), quests: () => this.tabQuests(body), style: () => this.tabStyle(body), dex: () => this.tabDex(body), system: () => this.tabSystem(body) }[tab];
    if (fn) fn();
  }
  monCard(mon, onTap, extra) {
    const sp = SPECIES[mon.species], e = primaryElem(sp);
    const hearts = Math.round(mon.friendship / 51);
    const c = h('button.card', {}, h('div.row', {}, h('div', { style: { width: '42px', height: '42px', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '22px', background: `radial-gradient(circle at 35% 30%,#fff,${elemColor(e)})`, border: '2px solid var(--ink)' } }, monIcon(mon.species)),
      h('div', { style: { flex: 1 } }, h('div.ttl', {}, nameOf(mon)), h('div.row', { style: { gap: '4px' } }, elChip(e), h('span.muted', {}, 'Lv ' + mon.level)))),
      h('div.statbar', { style: { marginTop: '6px', height: '9px' } }, h('i', { style: { width: Math.round((mon.hp ?? 1) * 100) + '%', background: 'linear-gradient(90deg,#6dff7a,#2fd7a5)' } })),
      h('div.muted', { style: { marginTop: '4px' } }, '♥'.repeat(hearts) + '♡'.repeat(5 - hearts) + (mon.friendship >= SPECTRAL_FRIENDSHIP ? '  💠 Soul stone glowing' : '') + (S.inDojo(this.s, mon.uid) ? '  🥋 at dojo' : '')), extra || '');
    tapBtn(c, onTap);
    return c;
  }
  tabTeam(body) {
    const s = this.s;
    clear(body).append(h('div', { style: { fontWeight: 900, marginBottom: '8px' } }, `Team (${s.party.length}/${S.PARTY_MAX}) — the first three fight. Tap an Elemon for stats, skills and its Astral tree.`));
    const g = h('div.grid');
    s.party.forEach((m, i) => {
      const lead = i > 0 ? h('button.btn.small', {}, h('span', {}, '★ Make lead')) : h('span.chip', { style: { background: 'var(--pink)', color: '#fff' } }, '★ Lead');
      if (i > 0) tapBtn(lead, (e) => { s.party.splice(i, 1); s.party.unshift(m); this.app.world.refreshBuddy(); this.tabTeam(body); });
      g.append(this.monCard(m, () => this.menu('mon', m.uid), lead));
    });
    body.append(g);
    if (s.box.length) {
      body.append(h('div', { style: { fontWeight: 900, margin: '14px 0 8px' } }, `Elemon Box (${s.box.length})`));
      const g2 = h('div.grid');
      s.box.forEach((m, i) => { const sw = h('button.btn.small', {}, h('span', {}, '⇄ To team')); tapBtn(sw, () => { if (s.party.length >= S.PARTY_MAX) { const out = s.party.pop(); s.box.push(out); } s.box.splice(i, 1); s.party.push(m); this.tabTeam(body); }); g2.append(this.monCard(m, () => this.menu('mon', m.uid), sw)); });
      body.append(g2);
    }
  }
  tabMon(body, uid, sub = 'stats') {
    const mon = S.monByUid(this.s, uid); if (!mon) return this.tabTeam(body);
    const sp = SPECIES[mon.species], e = primaryElem(sp), L = LORE[mon.species] || {};
    clear(body);
    const prev = h('div.preview3d', { style: { height: 'min(34vh,280px)', background: `radial-gradient(circle at 50% 40%,#fff,${elemColor(e)})` } });
    const subTabs = h('div.row', {}, ...[['stats', 'Stats'], ['skills', 'Skills'], ['astral', 'Astral ✴'], ['evo', 'Evolution']].map(([k, l]) => { const b = h('button.opt' + (k === sub ? '.on' : ''), {}, l); tapBtn(b, () => this.tabMon(body, uid, k)); return b; }));
    const panel = h('div.col');
    const left = h('div.col', {}, prev, h('div.title-font', { style: { fontSize: '22px' } }, nameOf(mon)), h('div.row', {}, ...elemsOf(sp).map(elChip), h('span.chip', { style: { background: 'var(--ink)', color: '#fff' } }, 'Lv ' + mon.level), h('span.muted', {}, sp.family)), h('div.muted', {}, L.desc || ''),
      h('div', {}, h('div.muted', {}, `EXP ${mon.exp} / ${expToNext(mon.level)}`), h('div.statbar', {}, h('i', { style: { width: (mon.exp / expToNext(mon.level) * 100) + '%' } }))));
    const back = h('button.btn.small', {}, h('span', {}, '← Team')); tapBtn(back, () => this.menu('team'));
    body.append(h('div.split', {}, h('div.col', {}, back, left), h('div.col', {}, subTabs, panel)));
    new Preview(prev, { spin: 0.4 }).show(creatureDesign(mon.species), mon.species);
    const slots = this.s.unlocks.slots;
    if (sub === 'stats') {
      const st = statsOf(mon);
      panel.append(h('div', { style: { fontWeight: 900 } }, `Stat points: ${mon.sp}`));
      for (const k of STAT_KEYS) {
        const plus = h('button.plus', { disabled: mon.sp <= 0 }, '+');
        tapBtn(plus, () => { if (allocate(mon, k)) { this.audio.sfx('ui_tap', { pitch: 1.3 }); this.tabMon(body, uid, 'stats'); } });
        panel.append(h('div.statrow', {}, h('b', {}, STAT_NAMES[k]), h('div.statbar', {}, h('i', { style: { width: Math.min(100, st[k] * 2.5) + '%' } })), h('span', {}, st[k].toFixed(0)), plus));
      }
      panel.append(h('div.muted', {}, `Max HP ${maxHpOf(st, mon.level)} · Move speed ${(2.8 + st.spd * 0.14).toFixed(1)} m/s · Friendship ${mon.friendship}/255`));
      panel.append(h('div.card', {}, h('div.ttl', {}, '💠 Soul Stone'), h('div.desc', {}, mon.friendship >= SPECTRAL_FRIENDSHIP ? 'Your soul stone glows with this bond. In battle, fill the Spectral gauge and transform into Spectral form!' : `Bond ${mon.friendship}/${SPECTRAL_FRIENDSHIP}. At extreme friendship the soul stone transforms, unlocking a Spectral form. Battle together, share food and make choices together to grow your bond.`)));
      panel.append(h('div.muted', {}, 'Personality: ' + (sp.personality || L.personality || '—')));
      const dojo = h('button.btn.small', {}, h('span', {}, S.inDojo(this.s, mon.uid) ? '🥋 Bring back from dojo' : '🥋 Leave at dojo (slow auto-training)'));
      if (this.s.flags.unlock_shinsekai) { tapBtn(dojo, () => { if (S.inDojo(this.s, mon.uid)) S.stopDojo(this.s, mon.uid); else S.startDojo(this.s, mon.uid); this.tabMon(body, uid, 'stats'); }); panel.append(dojo); }
    } else if (sub === 'skills') {
      panel.append(h('div.muted', {}, 'Tap a known skill to equip it. Slots unlock as you progress.'));
      const slot = (id, locked, kind, idx) => {
        const sk = SKILLS[id];
        const el = h('div.slot' + (sk ? '.filled' : '') + (locked ? '.locked' : ''), {}, sk ? h('div.skillicon', { style: { background: elemColor(sk.elem) } }, kind === 'ult' ? '🔥' : kind === 'passive' ? '◈' : skillIcon(sk)) : h('div.skillicon', {}, locked ? '🔒' : '+'),
          h('div', { style: { flex: 1 } }, h('b', {}, sk ? sk.name : locked ? 'Locked' : 'Empty'), h('div.muted', {}, sk ? skillDesc(sk) : locked ? 'Unlocks through the story' : '')));
        if (sk) { const rm = h('button.btn.small', {}, h('span', {}, '✕')); tapBtn(rm, () => { unequip(mon, id); this.tabMon(body, uid, 'skills'); }); el.append(rm); }
        return el;
      };
      panel.append(h('b', {}, `Active (${slots.active}/4)`));
      for (let i = 0; i < 4; i++) panel.append(slot(mon.skills.active[i], i >= slots.active, 'active', i));
      panel.append(h('b', {}, 'Ultimate'), slot(mon.skills.ult, slots.ult < 1, 'ult'));
      panel.append(h('b', {}, `Passives (${slots.passive}/2)`));
      for (let i = 0; i < 2; i++) panel.append(slot(mon.skills.passives[i], i >= slots.passive, 'passive', i));
      panel.append(h('b', {}, 'Known skills'));
      const g = h('div.grid');
      for (const id of mon.skills.known) {
        const sk = SKILLS[id]; if (!sk) continue;
        const on = mon.skills.active.includes(id) || mon.skills.passives.includes(id) || mon.skills.ult === id;
        const c = h('button.card' + (on ? '.sel' : ''), {}, h('div.row', {}, h('div.skillicon', { style: { background: elemColor(sk.elem) } }, skillIcon(sk)), h('div.ttl', { style: { fontSize: '14px' } }, sk.name)), h('div.desc', {}, `${sk.kind.toUpperCase()} · ${skillDesc(sk)}`));
        tapBtn(c, () => { if (!equip(mon, id, slots)) this.ui.toast('No free slot of that kind yet'); else this.audio.sfx('ui_confirm'); this.tabMon(body, uid, 'skills'); });
        g.append(c);
      }
      panel.append(g);
    } else if (sub === 'astral') {
      this.astral(panel, mon, () => this.tabMon(body, uid, 'astral'));
    } else if (sub === 'evo') {
      if (!sp.evolve.length) panel.append(h('div.card', {}, h('div.desc', {}, 'This is a final form — or one whose secrets are not yet known.')));
      for (const ev of sp.evolve) {
        const prog = condProgress(mon, ev.cond, { location: this.app.world.mapId, hour: this.s.time.hour });
        panel.append(h('div.card', {}, h('div.row', {}, h('div.ttl', {}, '→ ' + SPECIES[ev.to].name), ...elemsOf(SPECIES[ev.to]).map(elChip)), h('div.desc', {}, ev.hint),
          ...prog.map((p) => h('div.row', { style: { fontSize: '12px', marginTop: '3px' } }, h('span', {}, p.ok ? '✅' : '⬜'), h('span', {}, p.label + (p.need != null ? ` ${Math.min(p.cur, p.need)}/${p.need}` : ''))))));
      }
      if (sp.eyeSlot) {
        const eq = mon.cosmetic.eye;
        panel.append(h('b', {}, '👁 Ecto Eyeball slot'));
        const g = h('div.grid');
        for (const [id, c] of Object.entries(COSMETICS)) if (c.slot === 'ectoEye' && this.s.player.owned.includes(id)) { const b = h('button.card' + (eq === id ? '.sel' : ''), {}, h('div.ttl', {}, c.name)); tapBtn(b, () => { mon.cosmetic.eye = eq === id ? null : id; this.tabMon(body, uid, 'evo'); }); g.append(b); }
        panel.append(g.childNodes.length ? g : h('div.muted', {}, 'Buy special eyeballs at Grillz & Thrillz in Shinsekai.'));
      }
    }
  }
  astral(panel, mon, redraw) {
    const t = astralTree(mon.species), st = statsOf(mon);
    const box = h('div.astral');
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    box.append(svg);
    const tip = h('div.tip', {}, `Astral points: ${mon.ap}. Tap a star. Lit stars connect to new ones; some need stat thresholds — spend stat points to reach them.`);
    const pos = (n) => [50 + n.x * 9, 50 + n.y * 9];
    for (const [a, b] of t.links) {
      const na = t.nodes.find((n) => n.id === a), nb = t.nodes.find((n) => n.id === b);
      const [x1, y1] = pos(na), [x2, y2] = pos(nb);
      const l = document.createElementNS(svgNS, 'line');
      const lit = (mon.astral.includes(a) || a === 'core') && mon.astral.includes(b);
      Object.entries({ x1: x1 + '%', y1: y1 + '%', x2: x2 + '%', y2: y2 + '%', stroke: lit ? '#ffd23a' : 'rgba(255,255,255,.25)', 'stroke-width': lit ? 3 : 1.5 }).forEach(([k, v]) => l.setAttribute(k, v));
      svg.append(l);
    }
    for (const n of t.nodes) {
      const stt = nodeState(mon, n, st);
      const [x, y] = pos(n);
      const ic = n.kind === 'core' ? '✴' : n.kind === 'stat' ? '+' : n.kind === 'passive' ? '◈' : n.kind === 'ult' ? '🔥' : skillIcon(SKILLS[n.ref]);
      const el = h('button.node.' + stt + (n.kind === 'ult' || n.kind === 'core' ? '.big' : ''), { style: { left: x + '%', top: y + '%' } }, ic);
      tapBtn(el, () => {
        const req = [];
        if (n.req.level) req.push(`Lv ${n.req.level}`);
        for (const [k, v] of Object.entries(n.req.stats || {})) req.push(`${STAT_NAMES[k]} ${v}`);
        clear(tip).append(h('b', {}, n.name), h('div.muted', {}, n.ref ? SKILLS[n.ref].desc : n.kind === 'stat' ? `Permanently +${n.amount} ${STAT_NAMES[n.stat]}` : 'The heart of the constellation.'), h('div.muted', {}, `Cost ${n.cost} AP${req.length ? ' · Needs ' + req.join(', ') : ''} · You have ${mon.ap} AP`));
        if (stt === 'ready') { const b = h('button.btn.primary.small', {}, h('span', {}, '✴ Light this star')); tapBtn(b, () => { if (unlockNode(mon, n.id, st, (m, id) => { learn(m, id); equip(m, id, this.s.unlocks.slots); })) { this.audio.sfx('evolve_burst', { vol: 0.5 }); redraw(); } }); tip.append(b); }
      });
      box.append(el);
    }
    box.append(tip);
    panel.append(box);
  }
  tabBag(body) {
    const s = this.s;
    clear(body).append(h('div', { style: { fontWeight: 900, marginBottom: '8px' } }, `Money: ¥${s.money.toLocaleString()}`));
    const g = h('div.grid');
    for (const [id, n] of Object.entries(s.bag)) {
      const it = ITEMS[id]; if (!it || n <= 0) continue;
      const c = h('button.card', {}, h('div.row', {}, h('span', { style: { fontSize: '24px' } }, it.icon), h('div.ttl', { style: { fontSize: '14px' } }, it.name), h('span.chip', { style: { background: 'var(--ink)', color: '#fff' } }, '×' + n)), h('div.desc', {}, it.desc));
      if (it.kind === 'food' || it.kind === 'boost' || it.kind === 'mixtape') tapBtn(c, () => this.useItemPick(id, body));
      g.append(c);
    }
    body.append(g);
  }
  useItemPick(id, body) {
    const it = ITEMS[id];
    const g = h('div.grid');
    const box = h('div.panel', { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', padding: '14px', width: 'min(92vw,560px)', maxHeight: '80vh', overflow: 'auto', zIndex: 5, pointerEvents: 'auto' } }, h('div', { style: { fontWeight: 900, marginBottom: '8px' } }, `Use ${it.name} on…`), g);
    for (const m of this.s.party) g.append(this.monCard(m, () => {
      if (it.kind === 'mixtape') { const sk = SKILLS[it.skill]; if (!elemsOf(SPECIES[m.species]).includes(sk.elem)) { this.ui.toast(`${nameOf(m)} can't learn a ${ELEMENTS[sk.elem].name} skill`); return; } learn(m, it.skill); S.addItem(this.s, id, -1); this.ui.toast(`${nameOf(m)} learned ${sk.name}!`, 'gold'); }
      else { const r = S.useItemOn(this.s, id, m); if (r.ok) { this.ui.toast(`${nameOf(m)}: ${r.msgs.join(' · ')}`, 'good'); m.anim; } }
      this.audio.sfx('bio_heal'); box.remove(); this.tabBag(body); this.app.game.checkQuests(); this.app.game.checkEvolutions();
    }));
    const x = h('button.btn.small', {}, h('span', {}, 'Cancel')); tapBtn(x, () => box.remove()); box.append(x);
    this.ui.L.modal.append(box);
  }
  tabQuests(body) {
    const s = this.s;
    clear(body);
    const ids = Object.keys(s.quests).sort((a, b) => (QUESTS[b].main ? 1 : 0) - (QUESTS[a].main ? 1 : 0));
    if (!ids.length) body.append(h('div.muted', {}, 'No quests yet.'));
    for (const id of ids) {
      const q = QUESTS[id], pr = questProgress(s, id);
      body.append(h('div.card', { style: { marginBottom: '10px' } }, h('div.row', {}, h('div.ttl', {}, (q.main ? '⭐ ' : '📜 ') + q.name), s.quests[id].done ? h('span.chip', { style: { background: '#5fd35a' } }, 'Complete') : ''), h('div.desc', {}, q.desc),
        ...pr.steps.map((st, i) => h('div.row', { style: { fontSize: '12.5px', marginTop: '3px', opacity: i > pr.current && pr.current >= 0 ? 0.45 : 1 } }, h('span', {}, st.done ? '✅' : i === pr.current ? '▶' : '⬜'), h('span', {}, st.text)))));
    }
    if (s.deadlines.length) for (const d of s.deadlines) body.append(h('div.card', {}, h('div.ttl', {}, '⏰ ' + d.name), h('div.desc', {}, `Due Day ${d.day} at ${String(d.hour).padStart(2, '0')}:00`)));
  }
  tabStyle(body) {
    const s = this.s;
    clear(body);
    const prev = h('div.preview3d', { style: { height: 'min(46vh,380px)', background: 'radial-gradient(circle at 50% 40%,#ffe9f6,#c9b5ff)' } });
    const right = h('div.col');
    body.append(h('div.split', {}, h('div.col', {}, prev, h('div.muted', { style: { textAlign: 'center' } }, 'Bracelet & soul stone on your left wrist')), right));
    const pv = new Preview(prev, { spin: 0.3, frame: 'full' });
    pv.show(humanDesignFor(this.app.playerLook()));
    for (const slot of COSMETIC_SLOTS) {
      const owned = s.player.owned.filter((id) => COSMETICS[id] && COSMETICS[id].slot === slot);
      right.append(h('b', {}, SLOT_NAMES[slot]));
      if (!owned.length) { right.append(h('div.muted', {}, 'None owned — visit Grillz & Thrillz in Shinsekai.')); continue; }
      right.append(h('div.row', {}, ...owned.map((id) => { const on = s.player.cosmetics[slot] === id; const b = h('button.opt' + (on ? '.on' : ''), {}, COSMETICS[id].name); tapBtn(b, () => { S.equipCosmetic(s, id); this.app.world.ensurePlayer(); this.audio.sfx('ui_confirm'); this.tabStyle(body); }); return b; })));
    }
  }
  tabDex(body) {
    const s = this.s;
    clear(body);
    const ids = Object.keys(SPECIES).filter((id) => !SPECIES[id].beast);
    const caught = ids.filter((id) => s.dex.caught[id]).length, seen = ids.filter((id) => s.dex.seen[id]).length;
    body.append(h('div', { style: { fontWeight: 900, marginBottom: '8px' } }, `Seen ${seen} · Caught ${caught} · Total ${ids.length}`));
    const g = h('div.grid');
    for (const id of ids) {
      const sp = SPECIES[id], kn = s.dex.seen[id];
      const c = h('button.card', { style: { opacity: kn ? 1 : 0.55 } }, h('div.row', {}, h('span', { style: { fontSize: '20px' } }, kn ? monIcon(id) : '❔'), h('div.ttl', { style: { fontSize: '14px' } }, kn ? sp.name : '???'), s.dex.caught[id] ? h('span', {}, '🔑') : ''), kn ? h('div.row', { style: { gap: '4px', marginTop: '4px' } }, ...elemsOf(sp).map(elChip)) : '', h('div.desc', {}, kn ? (LORE[id]?.desc || '') : (sp.legendary ? 'A legend whispered about in old star charts…' : 'Not yet encountered.')));
      g.append(c);
    }
    body.append(g);
  }
  tabSystem(body) {
    const s = this.s;
    clear(body);
    const save = h('button.btn.primary', {}, h('span', {}, '💾 Save game'));
    tapBtn(save, () => { this.app.saveGame(); this.ui.toast('Game saved!', 'good'); });
    const vol = (label, key) => { const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s.settings[key] ?? 0.8, style: { width: '200px', pointerEvents: 'auto' } }); inp.addEventListener('input', () => { s.settings[key] = +inp.value; this.app.applySettings(); }); return h('div.row', {}, h('b', { style: { width: '90px' } }, label), inp); };
    const q = h('div.row', {}, h('b', { style: { width: '90px' } }, 'Graphics'), ...['high', 'medium', 'low'].map((k) => { const b = h('button.opt' + ((s.settings.quality || this.app.gfx.qName) === k ? '.on' : ''), {}, k); tapBtn(b, () => { s.settings.quality = k; this.app.saveGame(); this.ui.toast('Reloading with ' + k + ' graphics…'); setTimeout(() => location.search = '?q=' + k, 600); }); return b; }));
    const title = h('button.btn', {}, h('span', {}, '🏠 Save & return to title'));
    tapBtn(title, () => { this.app.saveGame(); location.reload(); });
    body.append(h('div.col', {}, save, vol('Music', 'music'), vol('Effects', 'sfx'), q,
      h('div.card', {}, h('div.ttl', {}, 'Controls'), h('div.desc', { html: 'Tap ground: move · Tap Elemon/NPC: interact/target · Battle: drag a skill button to aim (tap = auto-aim, hold charge skills) · Swipe: dodge · Shield: parry (time it as the hit lands!) · Grab → Parry → Attack: Reversal Suplex · Charge → Attack: Elemental Strike · Switch then Attack: Tag Strike<br>Keyboard: WASD/Arrows move · E interact · Space attack · Shift dodge · Q grab · E parry (battle) · 1–4 skills (aim with mouse) · F ultimate · T team combo · Tab switch · X spectral' })),
      h('div.muted', {}, `Day ${s.time.day} · Battles ${s.stats.battles} · Wins ${s.stats.wins} · Captures ${s.stats.captures} · Reactions ${s.stats.reactions}`), title));
  }

  // ================================================================= world map
  worldMap() {
    return new Promise((res) => {
      disposeAllPreviews();
      const s = this.s;
      const map = h('div', { style: { position: 'relative', width: '100%', height: 'min(64vh,560px)', borderRadius: '18px', border: '3px solid var(--ink)', overflow: 'hidden', background: 'linear-gradient(160deg,#1b3a5a 0%,#2a1f5a 50%,#3a1a4a 100%)' } });
      // stylised Osaka: bay, rivers, town discs
      map.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">
        <path d="M0,62 C12,58 18,70 26,76 C34,84 30,100 0,100Z" fill="#2fa8ff" opacity=".45"/>
        <path d="M20,0 C28,20 34,30 36,48 C38,62 46,72 52,100" stroke="#4fc8ff" stroke-width="2.2" fill="none" opacity=".55"/>
        <path d="M60,0 C56,20 58,40 50,58" stroke="#4fc8ff" stroke-width="1.4" fill="none" opacity=".45"/>
        <circle cx="16" cy="20" r="15" fill="#3f8a3a" opacity=".55"/>
        ${Object.values(TOWNS).map(() => '').join('')}
      </svg>`;
      for (const [tid, t] of Object.entries(TOWNS)) { /* labels via pins */ }
      const card = h('div.card', { style: { marginTop: '10px' } }, h('div.desc', {}, 'Tap a location. Travelling takes 30 minutes.'));
      for (const [id, L] of Object.entries(LOCATIONS)) {
        const open = s.unlocks.locations.includes(id) || S.checkReq(s, L.unlock) && L.unlock !== 'start' && S.checkReq(s, L.unlock);
        const pin = h('button', { style: { position: 'absolute', left: L.pos[0] * 100 + '%', top: L.pos[1] * 100 + '%', transform: 'translate(-50%,-50%)', width: '50px', height: '50px', borderRadius: '50%', fontSize: '24px', background: open ? `radial-gradient(circle at 35% 30%,#fff,${TOWNS[L.town].color})` : '#3a3050', border: '3px solid ' + (this.app.world.mapId === L.map ? '#fff' : 'var(--ink)'), boxShadow: open ? `0 0 16px ${TOWNS[L.town].color}` : 'none', opacity: open ? 1 : 0.55, pointerEvents: 'auto' } }, open ? L.icon : '🔒');
        tapBtn(pin, () => {
          this.audio.sfx('ui_tap');
          clear(card).append(h('div.row', {}, h('div.ttl', {}, L.icon + ' ' + (open ? L.name : '???')), h('span.chip', { style: { background: TOWNS[L.town].color, color: '#160c26' } }, TOWNS[L.town].name)), h('div.desc', {}, open ? L.desc : 'Not unlocked yet — keep following the story.'));
          if (open && this.app.world.mapId !== L.map) { const go = h('button.btn.primary.small', { style: { marginTop: '8px' } }, h('span', {}, '🚃 Travel here')); tapBtn(go, () => { this.close(); res(id); }); card.append(go); }
        });
        map.append(pin, h('div', { style: { position: 'absolute', left: L.pos[0] * 100 + '%', top: `calc(${L.pos[1] * 100}% + 30px)`, transform: 'translateX(-50%)', fontSize: '11px', fontWeight: 900, color: '#fff', textShadow: '0 1px 0 #000', whiteSpace: 'nowrap', pointerEvents: 'none' } }, open ? L.name : '???'));
      }
      const sheet = this.ui.sheet('Osaka 2050', h('div', {}, map, card), { onClose: () => { this.close(); res(null); } });
      this.ui.modal(sheet);
    });
  }

  // ================================================================= shops
  shop(kind = 'goods') {
    return new Promise((res) => {
      const s = this.s;
      const body = h('div');
      const title = kind === 'cosmetics' ? 'Grillz & Thrillz' : 'Kansai Calling Supplies';
      const draw = () => {
        clear(body).append(h('div', { style: { fontWeight: 900, marginBottom: '8px' } }, `Money: ¥${s.money.toLocaleString()}`));
        const g = h('div.grid');
        if (kind === 'cosmetics') {
          for (const [id, c] of Object.entries(COSMETICS)) {
            if (!c.price || (c.req && !S.checkReq(s, c.req))) continue;
            const own = s.player.owned.includes(id);
            const b = h('button.card' + (own ? '.sel' : ''), {}, h('div.ttl', { style: { fontSize: '14px' } }, c.name), h('div.desc', {}, SLOT_NAMES[c.slot]), h('div', { style: { fontWeight: 900, marginTop: '4px' } }, own ? 'Owned' : '¥' + c.price.toLocaleString()));
            if (!own) tapBtn(b, () => { if (S.spend(s, c.price)) { S.ownCosmetic(s, id); if (c.slot !== 'ectoEye') S.equipCosmetic(s, id); this.app.world.ensurePlayer(); this.audio.sfx('coin'); this.ui.toast(`Bought ${c.name}!`, 'gold'); draw(); } else { this.ui.toast('Not enough money'); this.audio.sfx('ui_error'); } });
            g.append(b);
          }
        } else {
          const stock = ['takoyaki', 'okonomiyaki', 'ramune', 'matcha', 'revive_onigiri', 'quartz', 'amethyst', 'ruby', 'sapphire', 'emerald', 'topaz', 'opal', 'diamond', 'protein_mochi', 'mixtape_heat_wave', 'mixtape_ricochet', 'mixtape_sleep_pollen', 'mixtape_stone_wall', 'mixtape_bass_drop'];
          for (const id of stock) {
            const it = ITEMS[id];
            if (it.kind === 'gem' && !S.flag(s, 'license')) continue;
            const b = h('button.card', {}, h('div.row', {}, h('span', { style: { fontSize: '22px' } }, it.icon), h('div.ttl', { style: { fontSize: '14px' } }, it.name)), h('div.desc', {}, it.desc), h('div.row', { style: { marginTop: '4px' } }, h('b', {}, '¥' + it.price.toLocaleString()), h('span.muted', {}, `own ${s.bag[id] || 0}`)));
            tapBtn(b, () => { if (S.buy(s, id)) { this.audio.sfx('coin'); this.ui.toast(`Bought ${it.name}`, 'good'); draw(); } else { this.ui.toast('Not enough money'); this.audio.sfx('ui_error'); } });
            g.append(b);
          }
        }
        body.append(g);
      };
      draw();
      this.ui.modal(this.ui.sheet(title, body, { onClose: () => { this.close(); res(); } }));
    });
  }
}
