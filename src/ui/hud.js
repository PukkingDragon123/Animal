// Overworld HUD: clock (day/slot), location, objective, money, party bubble,
// menu/map buttons, sneak toggle (safari).
import { h, clear, tapBtn } from './dom.js';
import { slotOf, clockText } from '../game/time.js';
import { SPECIES } from '../data/species.js';
import { monIcon, elemColor } from './battlehud.js';
import { nameOf } from '../game/elemon.js';

export class WorldHud {
  constructor(app) {
    this.app = app; this.ui = app.ui;
    this.root = app.ui.L.hud;
    this.objective = '';
    this.build();
  }
  build() {
    const r = clear(this.root);
    this.sunEl = h('div.sun'); this.tEl = h('div.t'); this.sEl = h('div.s'); this.locEl = h('div.loc');
    this.objEl = h('div.objective.hide');
    this.moneyEl = h('div.money');
    this.menuBtn = h('button.iconbtn', { title: 'Menu' }, '☰');
    this.mapBtn = h('button.iconbtn', { title: 'Map' }, '🗺️');
    tapBtn(this.menuBtn, () => this.app.openMenu());
    tapBtn(this.mapBtn, () => this.app.openMap());
    this.party = h('div.partybub');
    tapBtn(this.party, () => this.app.openMenu('team'));
    this.sneakBtn = h('button.iconbtn.hide', { id: 'sneak', title: 'Sneak' }, '🥷');
    tapBtn(this.sneakBtn, () => { const w = this.app.world; w.sneak = !w.sneak; this.sneakBtn.classList.toggle('on', w.sneak); this.app.ui.toast(w.sneak ? 'Sneaking — slower, much quieter' : 'Walking'); });
    this.rotBtn = h('button.iconbtn', { title: 'Rotate camera' }, '⟲');
    tapBtn(this.rotBtn, () => this.app.gfx.rig.rotateBy(Math.PI / 2));
    r.append(
      h('div.hud-tl', {}, h('div.clock', {}, this.sunEl, h('div', {}, this.tEl, this.sEl)), this.locEl, this.objEl),
      h('div.hud-tr', {}, this.moneyEl, this.mapBtn, this.menuBtn),
      h('div.hud-bl', {}, this.party),
      h('div.hud-br', {}, this.rotBtn, this.sneakBtn),
    );
  }
  show(on) { this.root.classList.toggle('show', on); }
  showSneak(on) { this.sneakBtn.classList.toggle('hide', !on); if (!on) { this.app.world.sneak = false; this.sneakBtn.classList.remove('on'); } }
  setObjective(text) { this.objective = text; this.objEl.classList.toggle('hide', !text); this.objEl.innerHTML = text ? `<b>Objective</b>${text}` : ''; }
  update() {
    const s = this.app.state;
    const t = s.time, slot = slotOf(t.hour);
    const hh = t.hour;
    const icon = hh >= 5.5 && hh < 7 ? '🌅' : hh >= 7 && hh < 17 ? '☀️' : hh >= 17 && hh < 19.5 ? '🌇' : '🌙';
    if (this._ic !== icon) { this._ic = icon; this.sunEl.textContent = icon; this.sunEl.style.background = icon === '🌙' ? 'radial-gradient(circle at 30% 30%,#c8d8ff,#3a4a9a)' : 'radial-gradient(circle at 30% 30%,#fff7c2,#ffb52e)'; }
    const txt = clockText(t);
    if (this._t !== txt) { this._t = txt; this.tEl.textContent = txt; this.sEl.textContent = slot.name; }
    const loc = this.app.world.def ? this.app.world.def.name : '';
    if (this._loc !== loc) { this._loc = loc; this.locEl.textContent = '📍 ' + loc; }
    const m = '¥' + s.money.toLocaleString();
    if (this._m !== m) { this._m = m; this.moneyEl.textContent = m; }
    const lead = s.party[0];
    const key = lead ? lead.species + lead.level + Math.round((lead.hp ?? 1) * 20) : '';
    if (this._p !== key) {
      this._p = key; clear(this.party);
      if (lead) this.party.append(h('div.ic', { style: { background: `radial-gradient(circle at 35% 30%,#fff,${elemColor(SPECIES[lead.species].elem[0] ? (Array.isArray(SPECIES[lead.species].elem) ? SPECIES[lead.species].elem[0] : SPECIES[lead.species].elem) : 'geo')})` } }, monIcon(lead.species)), h('div', {}, h('div', { style: { fontSize: '12px' } }, `${nameOf(lead)} Lv${lead.level}`), h('div.minibar', {}, h('i', { style: { width: Math.round((lead.hp ?? 1) * 100) + '%' } }))));
      this.party.style.display = lead ? '' : 'none';
    }
  }
}
