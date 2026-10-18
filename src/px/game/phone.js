// The phone: the game's main UI (no traditional menus). A pixel smartphone that
// slides up over the world with a dusk-Osaka wallpaper, a clock, and apps:
// Team, Bag, Map, Dex, League, Friends, Save, Settings.
import { T } from './ui.js';
import { MonSprite } from './mon.js';
import { blit } from './story.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { SKILLS } from '../../data/skills.js';
import { ITEMS } from '../../data/items.js';
import { FRIENDS } from '../../data/social.js';
import { statsOf } from '../../game/elemon.js';
import * as S from '../../game/state.js';
import { mix, shift } from '../color.js';

const APPS = [
  ['Team', 'team', '#ff7a5a'], ['Bag', 'bag', '#ffcf5a'], ['Map', 'map', '#5fd8e8'],
  ['Dex', 'eye', '#7ce07a'], ['League', 'star', '#ff7ab8'], ['Friends', 'talk', '#a88aff'],
  ['Save', 'check', '#9fb3ff'], ['Settings', 'gear', '#c8c0d8'],
];
const ELC = { pyro: '#ff7a3a', hydro: '#5ab8f0', bio: '#7ce07a', geo: '#d8a060', echo: '#c08aff', volto: '#ffe23a', cryo: '#9fefff', aero: '#a8f5c8', ecto: '#8a5aff', ferro: '#b8c4d0', astro: '#ffd98a', nucleo: '#8aff3a' };

export class Phone {
  constructor(app) { this.app = app; this.open = false; this.t = 0; this.view = 'home'; this.sel = 0; this.scroll = 0; this.minis = new Map(); }
  toggle() { if (this.open) this.close(); else { this.open = true; this.t = 0; this.view = 'home'; this.app.audio.sfx('ui_open'); this.app.world.control = false; } }
  close() { this.open = false; this.app.world.control = true; this.app.audio.sfx('ui_back'); }
  mini(species) { let m = this.minis.get(species); if (!m) { m = new MonSprite(species, { scale: 0.34, pitch: 16, yaw: -24 }); this.minis.set(species, m); } return m; }

  draw(ui, dt) {
    if (!this.open) return;
    this.t += dt;
    const W = ui.w, H = ui.h;
    const pw = Math.min(156, W - 16), ph = Math.min(H - 10, 252);
    const slide = Math.min(1, this.t * 5), ease = 1 - (1 - slide) ** 3;
    const px = W - pw - 10, py = Math.round(H - ph - 4 + (1 - ease) * (ph + 20));
    ui.fade(0.35 * ease, '#0c0814');
    // ---- the device
    ui.rrect(px + 2, py + 3, pw, ph, '#06040a', 3);
    ui.rrect(px, py, pw, ph, '#120c1c', 3);
    ui.rrect(px + 1, py + 1, pw - 2, ph - 2, '#3a3256', 3);
    ui.rrect(px + 2, py + 2, pw - 4, ph - 4, '#221c34', 3);
    ui.s.hline(px + 6, px + pw - 7, py + 2, '#5a5280');
    ui.s.vline(px + pw - 1, py + 30, py + 44, '#5a5280'); ui.s.vline(px - 1 + 0, py + 40, py + 60, '#3a3256');
    const sx = px + 6, sy = py + 12, sw = pw - 12, sh = ph - 26;
    // notch + speaker, home bar
    ui.rrect(px + (pw >> 1) - 16, py + 4, 32, 5, '#0c0814', 2); ui.px(px + (pw >> 1) + 10, py + 6, '#3a5a8a');
    ui.rrect(px + (pw >> 1) - 14, py + ph - 9, 28, 3, '#4a4268', 1);
    if (ui.inside(px + (pw >> 1) - 20, py + ph - 13, 40, 10) && ui.ptr.released) { ui.ptr.released = false; if (this.view === 'home') this.close(); else this.view = 'home'; return; }
    // ---- screen
    ui.rect(sx, sy, sw, sh, '#140e22');
    this.wallpaper(ui, sx, sy, sw, sh);
    this.status(ui, sx, sy, sw);
    const area = { x: sx, y: sy + 9, w: sw, h: sh - 9 };
    const fn = this['v_' + this.view]; if (fn) fn.call(this, ui, area, dt);
    if (ui.key('Escape') || ui.key('Tab')) { if (this.view === 'home') this.close(); else this.view = 'home'; }
  }
  wallpaper(ui, x, y, w, h) {
    // dusk sky bands with dithered seams, a pixel Osaka skyline with lit windows and Tsutenkaku
    const bands = ['#2a1a4a', '#4a2a6a', '#7a3a7a', '#c05a6a', '#f08a5a', '#ffb870'];
    for (let j = 0; j < h; j++) { const t = Math.min(0.999, j / (h * 0.62)) * (bands.length - 1), k = Math.floor(t), f = t - k; for (let i = 0; i < w; i++) ui.px(x + i, y + j, f > [0.75, 0.25, 0.5, 1][(i % 2) + (j % 2) * 2] ? bands[Math.min(bands.length - 1, k + 1)] : bands[k]); }
    const base = y + Math.round(h * 0.62);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < w;) { const bw = 6 + Math.floor(rnd() * 10), bh = 10 + Math.floor(rnd() * 34); ui.rect(x + i, base - bh, bw, bh + (h - (base - y)), '#1e1430'); for (let j = base - bh + 3; j < base; j += 4) for (let k = i + 1; k < i + bw - 1; k += 3) if (rnd() < 0.35) ui.px(x + k, j, rnd() < 0.7 ? '#ffd890' : '#8ad8ff'); i += bw + 1; }
    const tx = x + Math.round(w * 0.7); ui.rect(tx, base - 52, 3, 52, '#1e1430'); ui.rect(tx - 4, base - 40, 11, 4, '#1e1430'); ui.rect(tx - 2, base - 56, 7, 4, '#1e1430'); ui.px(tx + 1, base - 58, '#ff5a64');
    ui.rect(x, base, w, y + h - base, '#1a1028');
  }
  status(ui, x, y, w) {
    const tm = this.app.state.time || { day: 1, hour: 12 }, hh = Math.floor(tm.hour), mm = Math.floor((tm.hour % 1) * 60);
    ui.text(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, x + 3, y + 2, T.text, { mini: true });
    ui.text(`DAY ${tm.day}`, x + w / 2, y + 2, T.dim, { mini: true, align: 'center' });
    ui.rect(x + w - 14, y + 2, 10, 5, T.ink); ui.rect(x + w - 13, y + 3, 7, 3, T.green); ui.px(x + w - 4, y + 4, T.ink);
    for (let k = 0; k < 3; k++) ui.rect(x + w - 24 + k * 3, y + 6 - k * 2, 2, 1 + k * 2, T.text);
  }
  back(ui, a, title) {
    ui.rect(a.x, a.y, a.w, 13, mix('#140e22', '#2b2442', 0.8));
    ui.text(title, a.x + a.w / 2, a.y + 3, T.text, { align: 'center', shadow: T.ink });
    if (ui.button(a.x + 2, a.y + 1, 18, 14, '', { icon: 'swap', color: T.dim })) this.view = 'home';
    ui.rect(a.x, a.y + 14, a.w, a.h - 14, '#160f24');
    return { x: a.x + 3, y: a.y + 17, w: a.w - 6, h: a.h - 19 };
  }
  // ------------------------------------------------------------------ home
  v_home(ui, a) {
    const tm = this.app.state.time || { hour: 12 };
    ui.text(`${String(Math.floor(tm.hour)).padStart(2, '0')}:${String(Math.floor((tm.hour % 1) * 60)).padStart(2, '0')}`, a.x + a.w / 2, a.y + 8, T.text, { align: 'center', scale: 2, outline: T.ink });
    ui.text('Osaka · 2050', a.x + a.w / 2, a.y + 26, '#ffe0c0', { align: 'center', mini: true });
    const cols = 3, cw = Math.floor((a.w - 8) / cols), ch = 34, gy = a.y + 40;
    APPS.forEach(([name, icon, col], i) => {
      const cx = a.x + 4 + (i % cols) * cw, cy = gy + Math.floor(i / cols) * (ch + 2);
      const tile = 22, tx = cx + Math.round((cw - tile) / 2);
      const over = ui.inside(tx, cy, tile, tile + 10), dn = over && ui.ptr.down;
      ui.rrect(tx + 1, cy + 2, tile, tile, '#0a0612', 3);
      ui.rrect(tx, cy + (dn ? 1 : 0), tile, tile, shift(col, -1.6), 3);
      ui.rrect(tx + 1, cy + 1 + (dn ? 1 : 0), tile - 2, tile - 2, over ? shift(col, 0.4) : col, 3);
      ui.s.hline(tx + 3, tx + tile - 4, cy + 2 + (dn ? 1 : 0), mix(col, '#ffffff', 0.45));
      ui.icon(icon, tx + 7, cy + 7 + (dn ? 1 : 0), '#ffffff', shift(col, -2));
      ui.text(name, cx + cw / 2, cy + tile + 3, T.text, { align: 'center', mini: true, shadow: T.ink });
      if (over && ui.ptr.released) { ui.ptr.released = false; this.app.audio.sfx('ui_tap'); this.openApp(name.toLowerCase()); }
    });
  }
  openApp(id) {
    if (id === 'save') { this.app.save(); this.app.ui.toast('Saved', { icon: 'check', color: T.green }); return; }
    this.view = id; this.sel = 0; this.scroll = 0; this.detail = null;
  }
  // ------------------------------------------------------------------ team
  v_team(ui, A, dt) {
    const a = this.back(ui, A, 'TEAM'), s = this.app.state;
    if (this.detail != null) return this.monDetail(ui, a, s.party[this.detail], dt);
    s.party.forEach((m, i) => {
      const y = a.y + i * 30; if (y + 28 > a.y + a.h) return;
      const sp = SPECIES[m.species], el = elemsOf(sp)[0];
      if (ui.button(a.x, y, a.w, 28, '', { color: ELC[el] || T.cyan, active: i === 0 })) this.detail = i;
      const mn = this.mini(m.species); mn.update(dt); const f = mn.frame(); if (f) blit(ui.s, f.surf, Math.round(a.x + 16 - f.ax), Math.round(y + 25 - f.ay));
      ui.text(m.nick || sp.name, a.x + 32, y + 5, T.text, { shadow: T.ink });
      ui.text('Lv' + m.level, a.x + a.w - 5, y + 5, T.dim, { mini: true, align: 'right' });
      ui.bar(a.x + 32, y + 16, a.w - 40, 3, m.hp ?? 1, {});
    });
    if (!s.party.length) ui.text('No partner yet.', a.x + a.w / 2, a.y + 20, T.dim, { align: 'center' });
  }
  monDetail(ui, a, m, dt) {
    if (!m) { this.detail = null; return; }
    const sp = SPECIES[m.species], st = statsOf(m), el = elemsOf(sp);
    if (!this._big || this._big.species !== m.species) this._big = new MonSprite(m.species, { scale: 0.62, pitch: 16, yaw: -24 });
    this._big.update(dt); const f = this._big.frame();
    ui.s.ellipse(a.x + a.w / 2, a.y + 58, 26, 5, '#2a2244');
    if (f) blit(ui.s, f.surf, Math.round(a.x + a.w / 2 - f.ax), Math.round(a.y + 58 - f.ay));
    ui.text(`${m.nick || sp.name}  Lv${m.level}`, a.x + a.w / 2, a.y + 64, T.text, { align: 'center', shadow: T.ink });
    ui.text(el.map((e) => e.toUpperCase()).join(' / '), a.x + a.w / 2, a.y + 74, ELC[el[0]] || T.cyan, { align: 'center', mini: true });
    // radar-ish stat bars
    const keys = [['dmg', 'DMG'], ['elm', 'ELM'], ['def', 'DEF'], ['spd', 'SPD'], ['hp', 'HP']];
    keys.forEach(([k, lab], i) => { const y = a.y + 84 + i * 8; ui.text(lab, a.x + 2, y, T.dim, { mini: true }); ui.bar(a.x + 20, y + 1, a.w - 24, 3, Math.min(1, (st[k] || 0) / 60), { color: [T.red, T.pink, T.amber, T.cyan, T.green][i] }); });
    const y0 = a.y + 128;
    ui.text('SKILLS', a.x + 2, y0, T.amber, { mini: true });
    (m.skills.active || []).slice(0, 4).forEach((id, i) => { const sk = SKILLS[id]; if (sk) ui.text('· ' + (m.names && m.names[id] || sk.name), a.x + 4, y0 + 8 + i * 9, T.text, { shadow: T.ink }); });
    if (this.detail > 0 && ui.button(a.x + 2, a.y + a.h - 18, a.w - 4, 16, 'Make lead', { icon: 'up', color: T.amber })) {
      const s = this.app.state; const [x] = s.party.splice(this.detail, 1); s.party.unshift(x); this.detail = 0; this.app.world.refreshAvatar && this.app.world.refreshAvatar();
    }
  }
  // ------------------------------------------------------------------ bag
  v_bag(ui, A) {
    const a = this.back(ui, A, 'BAG'), s = this.app.state;
    ui.text('¥' + s.money.toLocaleString(), a.x + a.w - 2, A.y + 3, T.amber, { align: 'right', mini: true });
    const ids = Object.keys(s.bag).filter((id) => s.bag[id] > 0);
    if (!ids.length) ui.text('Empty.', a.x + a.w / 2, a.y + 20, T.dim, { align: 'center' });
    ids.forEach((id, i) => {
      const y = a.y + i * 21; if (y + 19 > a.y + a.h) return;
      const it = ITEMS[id] || { name: id };
      if (ui.button(a.x, y, a.w, 19, '', { color: T.amber })) this.useItem(id);
      ui.text(it.name, a.x + 6, y + 5, T.text, { shadow: T.ink });
      ui.text('×' + s.bag[id], a.x + a.w - 5, y + 5, T.amber, { align: 'right', mini: true });
    });
  }
  async useItem(id) {
    const s = this.app.state, lead = s.party[0]; if (!lead) return;
    const res = S.useItemOn(s, id, lead);
    if (res.ok) { this.app.ui.toast(`${SPECIES[lead.species].name}: ${res.msgs.join(', ') || 'used'}`, { icon: 'heart', color: T.green }); this.app.save(); }
    else this.app.ui.toast(res.reason === 'element' ? "That disc doesn't fit this Tokonmon" : "Can't use that now", { icon: 'cross', color: T.red });
  }
  // ------------------------------------------------------------------ map
  v_map(ui, A) {
    const a = this.back(ui, A, 'MAP'), places = this.app.places();
    places.forEach((p, i) => {
      const y = a.y + i * 24; if (y + 22 > a.y + a.h) return;
      const here = this.app.world.id === p.id;
      if (ui.button(a.x, y, a.w, 22, p.name, { color: here ? T.green : T.cyan, disabled: !p.open || here, sub: here ? 'you are here' : p.open ? '' : 'locked' })) { this.close(); this.app.travel(p.id); }
    });
  }
  // ------------------------------------------------------------------ dex / league / friends / settings
  v_dex(ui, A) {
    const a = this.back(ui, A, 'TOKODEX'), s = this.app.state;
    const seen = Object.keys(s.dex.seen || {}), caught = Object.keys(s.dex.caught || {});
    ui.text(`Seen ${seen.length}   Caught ${caught.length}`, a.x + a.w / 2, a.y, T.amber, { align: 'center', mini: true });
    const ids = Object.keys(SPECIES);
    ids.forEach((id, i) => { const y = a.y + 10 + i * 10; if (y + 9 > a.y + a.h) return; const known = s.dex.seen[id]; ui.text(String(i + 1).padStart(3, '0'), a.x + 2, y, T.dim, { mini: true }); ui.text(known ? SPECIES[id].name : '?????', a.x + 18, y - 1, known ? (s.dex.caught[id] ? T.text : T.dim) : '#4a4466', {}); });
  }
  v_league(ui, A) {
    const a = this.back(ui, A, 'LEAGUE'), s = this.app.state, r = S.rankOf(s);
    ui.text('RANK', a.x + a.w / 2, a.y + 6, T.dim, { align: 'center', mini: true });
    ui.text(r.id || s.league.rank, a.x + a.w / 2, a.y + 16, T.amber, { align: 'center', scale: 3, outline: T.ink });
    ui.text(`${s.league.points} pts`, a.x + a.w / 2, a.y + 42, T.text, { align: 'center' });
    ui.text(`W ${s.league.wins}   L ${s.league.losses}`, a.x + a.w / 2, a.y + 54, T.dim, { align: 'center', mini: true });
    const lines = ui.wrap(s.flags.league ? 'Rank matches every afternoon at the stadium.' : 'Not registered yet. The League office is through the subway gate.', a.w - 8);
    lines.forEach((l, i) => ui.text(l, a.x + 4, a.y + 70 + i * 10, T.text, { shadow: T.ink }));
  }
  v_friends(ui, A) {
    const a = this.back(ui, A, 'FRIENDS'), s = this.app.state;
    Object.entries(FRIENDS).forEach(([id, f], i) => {
      const y = a.y + i * 22; if (y + 20 > a.y + a.h) return;
      const met = s.flags['met_' + id] || id === 'mika' && s.flags.met_mika;
      ui.panel(a.x, y, a.w, 20, { rivets: false, edge: met ? f.color : '#3a3450' });
      ui.text(met ? f.name : '???', a.x + 6, y + 4, met ? T.text : T.dim, { shadow: T.ink });
      ui.text(met ? f.role : 'not met yet', a.x + 6, y + 13, T.dim, { mini: true });
    });
  }
  v_settings(ui, A) {
    const a = this.back(ui, A, 'SETTINGS'), app = this.app, st = app.state.settings;
    const row = (i, label, val, fn) => { const y = a.y + i * 24; if (ui.button(a.x, y, a.w, 22, `${label}: ${val}`, { color: T.cyan })) fn(); };
    row(0, 'Music', Math.round((st.music ?? 0.7) * 100) + '%', () => { st.music = ((st.music ?? 0.7) + 0.25) % 1.25; app.audio.setVolumes && app.audio.setVolumes({ music: st.music, sfx: st.sfx ?? 0.9 }); });
    row(1, 'Sound', Math.round((st.sfx ?? 0.9) * 100) + '%', () => { st.sfx = ((st.sfx ?? 0.9) + 0.25) % 1.25; app.audio.setVolumes && app.audio.setVolumes({ music: st.music ?? 0.7, sfx: st.sfx }); });
    row(2, 'Graphics', app.params.has('flat') ? '2D' : 'HD-2D 3D', () => app.ui.toast('Add ?flat=1 to the URL for the flat 2D mode', { icon: 'gear' }));
  }
}
