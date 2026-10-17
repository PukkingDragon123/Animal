// Stage-set activities behind hotspots (docs/SCENES.md): ordering in first
// person at a counter, sitting down to eat with your Tokonmon (eating unlocks
// skills/passives), the onsen, the arcade (claw + rhythm cabinets), the record
// shop listening booth, dojo training drills and the dojo roster wall.
// The story can intercept any hotspot first (story.hotspot(h) → true).
import { FOODS, MENUS } from '../data/foods.js';
import { SPECIES, elemsOf } from '../data/species.js';
import { recordEat, recordActivity } from '../data/progress.js';
import { addFriendship, nameOf, allocate } from './elemon.js';
import { dishDesign } from '../data/designs/dishes.js';
import * as S from './state.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const MENU_OF = { dotonbori: 'dotonbori_stalls', shinsekai: 'shinsekai_stalls', minoh_waterfall: 'minoh', minoh_bamboo: 'minoh', minoh_maple: 'minoh' };
export const DRILLS = {
  dmg: { name: 'Board Breaking', desc: 'Smash a stack of boards on the beat.', qte: { type: 'mash', n: 14 } },
  elm: { name: 'Elemental Meditation', desc: 'Breathe with the taiko and focus your element.', qte: { type: 'rhythm', n: 6 } },
  def: { name: 'Waterfall Stance', desc: 'Hold your stance under the dojo\'s waterfall bucket.', qte: { type: 'timing', n: 3 } },
  spd: { name: 'Footwork Ladder', desc: 'Hop the rope ladder faster than Master Genryu\'s fan.', qte: { type: 'rhythm', n: 8 } },
  hp: { name: 'Endurance Laps', desc: 'Laps around the dojo yard with weights on.', qte: { type: 'mash', n: 18 } },
};

export class Activities {
  constructor(app) { this.app = app; this.tray = null; }
  get s() { return this.app.state; }
  get w() { return this.app.world; }
  get d() { return this.app.director; }
  lead() { return this.s.party[0] || null; }
  slots() { return this.s.unlocks.slots; }
  menuOf(mapId) { return MENUS[mapId] || MENUS[MENU_OF[mapId]] || null; }

  async run(h) {
    switch (h.kind) {
      case 'order': return this.order(h);
      case 'seat': return this.sit(h);
      case 'bath': return this.bath(h);
      case 'crane': return this.arcade(h);
      case 'booth': return this.listen(h);
      case 'train': return this.train(h);
      case 'roster': return this.roster(h);
      case 'records': return this.app.phone ? this.app.phone.open('discs', { shop: true }) : this.app.screens.shop('goods');
      case 'shop': return this.app.screens.shop('goods');
      case 'cosmetics': return this.app.screens.shop('cosmetics');
      case 'look': if (h.text) await this.d.say('player', h.text, { actor: false }); return;
      default: return;
    }
  }

  // -------------------------------------------------------------- ordering (first person)
  async order(h) {
    const map = this.w.mapId, menu = this.menuOf(map);
    if (!menu) return;
    const zoom = (this.w.def.zooms || {})[h.zoom || h.id] ? (h.zoom || h.id) : 'counter';
    this.app.phone && this.app.phone.dock(false);
    await this.w.zoom(zoom, 1.0);
    const clerk = h.clerk || null;
    if (clerk) await this.d.say(clerk, 'Irasshaimase! What can I get you?', { actor: false });
    const opts = menu.map((id) => { const f = FOODS[id]; return { id, label: `${f.icon} ${f.name} — ¥${f.price}${f.heat >= 4 ? ' 🌶️'.repeat(Math.min(3, f.heat - 2)) : ''}` }; });
    opts.push({ id: null, label: 'Nothing, thanks' });
    const pick = await this.app.ui.choose(opts);
    const id = opts[pick].id;
    if (id) {
      const f = FOODS[id];
      if (!S.spend(this.s, f.price)) { this.app.ui.toast(`Not enough ¥ (need ¥${f.price})`, 'bad'); this.app.audio.sfx('ui_error'); }
      else {
        this.app.audio.sfx('coin');
        this.tray = { food: id, map };
        this.app.ui.toast(`📱 Paid ¥${f.price} — ${f.name}. Find a seat!`, 'good', 2200);
        if (clerk) await this.d.say(clerk, f.heat >= 5 ? 'The challenge curry?! ...We are not responsible.' : 'Coming right up!', { actor: false });
      }
    }
    this.w.unzoom();
    this.app.phone && this.app.phone.dock(true);
  }

  // -------------------------------------------------------------- eating together (zoom-in)
  async sit(h) {
    const map = this.w.mapId;
    if (!this.tray || this.tray.map !== map) {
      // a short rest
      await this.d.say('player', this.menuOf(map) ? 'Better order something at the counter first.' : 'A nice spot to sit for a bit.', { actor: false });
      return;
    }
    const food = this.tray.food, f = FOODS[food];
    this.tray = null;
    const zoomName = (this.w.def.zooms || {})[h.zoom || h.id] ? (h.zoom || h.id) : 'seat';
    const z = (this.w.def.zooms || {})[zoomName];
    this.app.phone && this.app.phone.dock(false);
    const look = z ? z.look : [h.x, 0.9, h.z];
    // the dish on the table and your partner beside it
    const dish = this.w.addActor('_dish', dishDesign(food), look[0], look[2], 0, { kind: 'prop', model3d: true });
    dish.actor.setPos(look[0], Math.max(0.05, look[1] - 0.12), look[2]);
    const mon = this.lead();
    const buddy = this.w.rec('buddy');
    if (buddy) { buddy.path = null; buddy.actor.setPos(look[0] + 0.45, Math.max(0, look[1] - 0.55), look[2] + 0.05); buddy.actor.faceTo(look[0], look[2], true); buddy.scripted = true; }
    await this.w.zoom(zoomName, 1.1);
    this.app.audio.sfx('ui_confirm');
    await wait(500);
    const sp = mon ? SPECIES[mon.species] : null;
    const pyro = sp && elemsOf(sp).includes('pyro');
    const name = mon ? nameOf(mon) : 'Your partner';
    if (buddy) buddy.actor.play('happy');
    if (mon && f.heat >= 3) {
      if (pyro) { buddy && buddy.actor.emote('heart'); await this.d.say('player', f.heat >= 5 ? `${name} is crying rivers… and going back for MORE. It loves the heat!` : `${name} is sweating and grinning. Spicy is its favourite.`, { actor: false }); }
      else { buddy && buddy.actor.emote('sweat'); await this.d.say('player', `${name} takes one bite of the ${f.name}… and its face turns red! Water! WATER!`, { actor: false }); }
    } else if (mon) {
      buddy && buddy.actor.emote(f.tags.includes('sweet') ? 'heart' : 'note');
      await this.d.say('player', `You share the ${f.name} with ${name}. ${f.tags.includes('sweet') ? 'Pure happiness.' : 'Delicious!'}`, { actor: false });
    }
    // results: heal, friendship, eating unlocks for the partner (+ a nibble for the rest of the team)
    for (const m of this.s.party) m.hp = Math.min(1, (m.hp ?? 1) + (f.heal || 0.2));
    const got = [];
    if (mon) {
      addFriendship(mon, f.friend || 3);
      for (const u of recordEat(mon, food, this.slots())) got.push({ mon, u });
      if (mon.counters && !mon.counters.foods.includes(food)) mon.counters.foods.push(food);
    }
    for (const g of got) await this.stamp(g.mon, g.u);
    S.passTime(this.s, 0.75);
    this.w.removeActor('_dish');
    if (buddy) buddy.scripted = false;
    this.w.unzoom();
    this.app.phone && this.app.phone.dock(true);
    this.app.saveGame(true);
  }

  async stamp(mon, u) {
    const kind = u.kind === 'ult' ? 'ULTIMATE' : u.kind === 'passive' ? 'PASSIVE' : 'NEW MOVE';
    this.app.audio.sfx('notification');
    if (this.app.phone) this.app.phone.stamp({ kind: u.kind, title: u.name, sub: `${nameOf(mon)} · ${kind}` });
    else this.app.ui.callout(`${kind}: ${u.name}`, nameOf(mon), '#ffd23a', 1600);
    await wait(1500);
  }

  // -------------------------------------------------------------- onsen
  async bath(h) {
    this.app.phone && this.app.phone.dock(false);
    await this.w.zoom(h.zoom || 'bath', 1.2);
    await this.d.say('player', 'Ahh… the hot spring melts every bit of tiredness away. Your Tokonmon float happily beside you.', { actor: false });
    S.healParty(this.s, 1);
    for (const m of this.s.party) { addFriendship(m, 3); for (const u of recordActivity(m, 'onsen', this.slots())) await this.stamp(m, u); }
    await this.app.passTime(1, false);
    this.w.unzoom();
    this.app.phone && this.app.phone.dock(true);
  }

  // -------------------------------------------------------------- arcade (claw machine + rhythm cabinet)
  async arcade(h) {
    const pick = await this.app.ui.choose(['🕹️ Claw machine (¥300)', '🎵 Rhythm cabinet (¥200)', 'Just watching']);
    if (pick === 2) return;
    const cost = pick === 0 ? 300 : 200;
    if (!S.spend(this.s, cost)) { this.app.ui.toast('Not enough ¥', 'bad'); return; }
    this.app.phone && this.app.phone.dock(false);
    if (pick === 0) await this.w.zoom(h.zoom || 'crane', 1.0);
    const score = await this.app.battle.qte.run(pick === 0 ? { type: 'timing', n: 1, kind: 'capture' } : { type: 'rhythm', n: 6 }, { bpm: 128, label: pick === 0 ? 'DROP THE CLAW!' : 'HIT THE NOTES!' });
    if (pick === 0) {
      if (score > 0.6) { const prize = ['sticker_star', 'sticker_heart', 'charm_panda', 'charm_pepper', 'charm_bubble', 'charm_berry'][Math.floor(Math.random() * 6)]; this.s.phone = this.s.phone || {}; (this.s.phone.owned = this.s.phone.owned || []).push(prize); this.app.ui.toast('🎁 You won a phone charm/sticker!', 'good'); }
      else this.app.ui.toast('So close! The claw slipped…');
      for (const m of this.s.party.slice(0, 1)) for (const u of recordActivity(m, 'arcade', this.slots())) await this.stamp(m, u);
    } else {
      this.app.ui.toast(score > 0.7 ? '★ FULL COMBO! ★' : score > 0.4 ? 'Nice groove!' : 'Keep practising!', score > 0.4 ? 'good' : '');
      for (const m of this.s.party.slice(0, 2)) for (const u of recordActivity(m, 'karaoke', this.slots())) await this.stamp(m, u);
    }
    await this.app.passTime(0.5, false);
    this.w.unzoom();
    this.app.phone && this.app.phone.dock(true);
  }

  // -------------------------------------------------------------- record shop listening booth
  async listen(h) {
    this.app.phone && this.app.phone.dock(false);
    await this.w.zoom(h.zoom || 'booth', 1.0);
    this.app.audio.sfx('ui_confirm');
    const tracks = ['e4_john', 'e4_paul', 'e4_george', 'e4_ringo', 'champions', 'battle_punk', 'dotonbori'];
    const prev = this.app.audio.trackId;
    this.app.audio.music(tracks[Math.floor(Math.random() * tracks.length)], { fade: 0.6 });
    await this.d.say('player', 'Headphones on. The vinyl crackles… your Tokonmon bob along to the beat.', { actor: false });
    for (const m of this.s.party) for (const u of recordActivity(m, 'listen', this.slots())) await this.stamp(m, u);
    await wait(1200);
    if (prev) this.app.audio.music(prev, { fade: 0.8 });
    this.w.unzoom();
    this.app.phone && this.app.phone.dock(true);
  }

  // -------------------------------------------------------------- dojo: training drills (one per radar stat)
  async train(h) {
    const mon = this.lead();
    if (!mon) return;
    const keys = Object.keys(DRILLS);
    const pick = await this.app.ui.choose([...keys.map((k) => `${DRILLS[k].name} (${k.toUpperCase()})`), 'Not now']);
    if (pick >= keys.length) return;
    const k = keys[pick], dr = DRILLS[k];
    this.app.phone && this.app.phone.dock(false);
    await this.d.say('dojo_master', dr.desc, { actor: false });
    const score = await this.app.battle.qte.run(dr.qte, { bpm: 100, label: dr.name.toUpperCase() });
    const pts = score > 0.75 ? 2 : score > 0.35 ? 1 : 0;
    if (pts) { mon.sp += pts; for (let i = 0; i < pts; i++) allocate(mon, k, 1); }
    this.app.ui.toast(pts ? `${nameOf(mon)}: ${k.toUpperCase()} +${pts}` : 'Master Genryu: "Again tomorrow."', pts ? 'good' : '');
    for (const u of [...(mon.lastUnlocks || []), ...recordActivity(mon, 'dojo', this.slots()), ...recordActivity(mon, 'train_' + k, this.slots())]) await this.stamp(mon, u);
    mon.lastUnlocks = [];
    if (mon.counters) mon.counters.dojo++;
    await this.app.passTime(1, true);
    this.app.phone && this.app.phone.dock(true);
  }

  // -------------------------------------------------------------- dojo: the roster wall
  async roster(h) {
    const all = [...this.s.party, ...this.s.box];
    this.app.phone && this.app.phone.dock(false);
    if ((this.w.def.zooms || {}).roster) await this.w.zoom('roster', 1.0);
    await this.d.say('dojo_master', `Your roster: ${all.length} Tokonmon. Every name plaque on this wall is a promise to train them well.`, { actor: false });
    if (this.app.phone) this.app.phone.open('team', { roster: true });
    this.w.unzoom();
    this.app.phone && this.app.phone.dock(true);
  }
}
