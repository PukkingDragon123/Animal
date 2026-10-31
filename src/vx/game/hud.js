// The roaming HUD: almost nothing, so the 3D city is the star. Only a few richly detailed pixel icons:
//  • bottom-right: a little row of icon buttons on wooden plinths — Bag, TokoPhone (menu), Map, Quests
//    (Tab / Esc open the TokoPhone too)
//  • top-right: one small cream coin pill
//  • the TokoLens icon, popping up above the row only while something nearby is worth a closer look (R)
//  • the place name as a brief small banner when you enter a zone (then it rises away), the objective as a
//    brief tag when it changes, the controls as keycaps until you first move
// Prompts over things are single small icon bubbles (control.js → ui.prompt). Bars, cards and stat panels
// live in the TokoPhone apps, battles and pick screens.
// Call hud.draw(ui, dt) every frame while the player is roaming.
import { T } from '../../px/game/ui.js';
import { clamp01, boing, easeOut } from '../../px/game/uikit/theme.js';
import { frame, sparkle } from '../../px/game/uikit/frame.js';
import { roundButton, plinthButton, hudMoney } from '../../px/game/uikit/widgets.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { maxHp } from '../../game/elemon.js';
import { ELEM_ICON } from './dex.js';

const HINT_KEY = 'tokonmon.hintDone';
const TAB_OF = { party: 'party', bag: 'bag', map: 'map', save: 'settings', options: 'settings', close: 'home', quests: 'quests', dex: 'dex', home: 'home' };
const ROW = [['bag', 'bag', 'Bag'], ['phone', 'home', 'Menu'], ['map', 'map', 'Map'], ['quest', 'quests', 'Quests']];
const R = Math.round;

export class Hud {
  constructor(app) { this.app = app; this.t = 0; this.menu = null; this.hideK = 0; this.zone = null; this.card = null; this.ui = null; this.locN = 0; this.lensK = 0; this.obj = null; this.objT = 99; }
  get menuOpen() { return !!(this.app.phone && this.app.phone.open); }
  showLocation(name, sub) { this.zone = { name, sub }; this.card = { name, sub: sub || this.city(), t: 0 }; this.locN++; }
  city() { const w = this.app.world || {}; return (w.loc && w.loc.city) || 'San Francisco'; }
  where() {
    const w = this.app.world || {}, locName = w.loc && w.loc.name;
    if (this.zone && this.zone.name === w.zoneName) return { name: this.zone.name, sub: this.zone.sub || locName || this.city() };
    if (w.zoneName) return { name: w.zoneName, sub: locName && locName !== w.zoneName ? locName : this.city() };
    return { name: locName || '', sub: this.city() };
  }
  party() {
    const st = this.app.state; if (!st || !st.party) return [];
    return st.party.map((m) => {
      const sp = SPECIES[m.species] || {}, el = sp.elem ? elemsOf(sp)[0] : null;
      let mh = 0; try { mh = maxHp(m); } catch (e) { mh = 0; }
      return { name: m.nick || sp.name || m.species, species: sp.name || m.species, hp: mh ? Math.round(mh * (m.hp ?? 1)) : (m.hp ?? 1), maxHp: mh || 0, color: (ELEMENTS[el] && ELEMENTS[el].color) || T.cyan, level: m.level, elem: el, icon: ELEM_ICON[el], fainted: (m.hp ?? 1) <= 0 };
    });
  }
  // ------------------------------------------------------------------ the roaming HUD
  draw(ui, dt) {
    this.ui = ui; this.t += dt;
    const app = this.app, st = app.state || {}, W = ui.w, H = ui.h;
    if (app.phone && app.phone.open) return;
    const busy = !!(ui.dialog || (app.story && app.story.busy));
    this.hideK += ((busy ? 1 : 0) - this.hideK) * Math.min(1, dt * 10);
    const off = this.hideK * 60;
    // top-centre: the place name, briefly
    const w = this.where();
    const signW = w.name ? ui.hudLocation(W / 2, 2, w.name, w.sub, { align: 'center', hold: 2.6, id: 'zone' + this.locN }) : 0;
    ui.toastY = signW ? 40 : null;
    // the objective, briefly when it changes
    const obj = (app.story && app.story.objective) || (app.quests && app.quests.objective && app.quests.objective());
    if (obj !== this.obj) { this.obj = obj; this.objT = 0; }
    this.objT += dt;
    if (obj && !busy && this.objT < 4.5) { const k = Math.min(boing(this.objT * 1.4), clamp01((4.5 - this.objT) * 2)); const ow = Math.min(260, W - 40); ui.push(W / 2, 46, 1, 1, 0, R((1 - k) * -20)); ui.objective(R(W / 2 - Math.min(ow, ui.tw(obj) + 28) / 2), 40 + (signW ? 6 : -24), obj, { maxW: ow }); ui.pop(); }
    // top-right: one coin pill
    hudMoney(ui, W - 6 + off, 6, st.money || 0, { align: 'right', id: 'hud' });
    // bottom-right: the icon row on plinths
    const size = 20, step = size + 14, x0 = W - ROW.length * step + R(step / 2) - 4, y0 = H - size - 16 + off;
    ROW.forEach(([icon, tab, label], i) => { const b = plinthButton(ui, x0 + i * step, y0, icon, { size, label, tip: label, badge: tab === 'quests' ? this.newQuests() || null : null }); if (b.clicked) this.openMenu(tab, ui); });
    if (!ui.dialog && !ui.modal && !busy && (ui.key('Escape') || ui.key('Tab'))) this.openMenu('home', ui);
    // the lens, only when something is near
    this.drawLens(ui, dt, W - 26, y0 - 26, busy);
    if (app.world && app.world.city) this.drawHint(ui, dt, busy);
  }
  newQuests() { const q = this.app.quests; if (!q || !q.list) return 0; try { return q.list().filter((x) => x.active).length; } catch (e) { return 0; } }
  // the TokoLens: pops up and wobbles while something nearby is worth a closer look
  drawLens(ui, dt, cx, cy, busy) {
    const sr = this.app.search, near = !busy && sr ? sr.scan(dt) : null;
    this.lensK += ((near ? 1 : 0) - this.lensK) * Math.min(1, dt * 10);
    if (this.lensK < 0.05) { this.lensT = 0; return; }
    this.lensT = (this.lensT || 0) + dt;
    const k = Math.max(0.1, boing(this.lensT * 1.4) * this.lensK), wob = Math.sin(this.t * 9) * 0.06 * (((this.t * 0.7) % 1) < 0.35 ? 1 : 0);
    ui.push(cx, cy, k * (1 + wob), k * (1 - wob));
    const b = roundButton(ui, cx, cy, 11, 'lens', { color: T.amber, tip: 'TokoLens', hotkey: 'r', sel: true });
    ui.pop();
    if (near && this.lensT < 3 && this.lensK > 0.9) {
      const label = 'LOOK CLOSER', lw = R(ui.tw(label, { mini: true, bold: true }) + 14);
      frame(ui, R(cx - lw / 2), cy - 32, lw, 13, { thin: true, r: 2, fill: T.ink, edge: T.copperD, shadow: false });
      ui.text(label, cx, cy - 28, T.cream, { mini: true, bold: true, align: 'center' });
    }
    if (((this.t * 1.1) % 1) < 0.25) sparkle(ui.s, cx + 10, cy - 11, '#ffffff', 1 - ((this.t * 1.1) % 1) / 0.25);
    if (b.clicked && near) sr.enter(near);
  }
  // the controls as keycaps + icons, until you first move (then never again)
  drawHint(ui, dt, busy) {
    const c = this.app.world.city, H = ui.h, p = this.app.world.player;
    if (this.hintDone == null) { try { this.hintDone = typeof localStorage !== 'undefined' && localStorage.getItem(HINT_KEY) === '1'; } catch (e) { this.hintDone = false; } }
    if (this.hintDone && !this.hintOut) return;
    if (busy || !c.active()) return;
    if (p && p.g) { const q = p.g.position; if (!this.hintAt) this.hintAt = [q.x, q.z]; else if (!this.hintOut && Math.hypot(q.x - this.hintAt[0], q.z - this.hintAt[1]) > 1.5) { this.hintOut = 0.001; try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* private mode */ } } }
    this.hintT = (this.hintT || 0) + dt;
    if (this.hintOut) { this.hintOut += dt; if (this.hintOut > 0.5) { this.hintDone = true; this.hintOut = 0; return; } }
    if (c.touch && !c.pad) return;
    const a = Math.min(1, this.hintT / 0.4) * (this.hintOut ? 1 - this.hintOut / 0.5 : 1); if (a <= 0.05) return;
    const rows = c.pad ? [['LS', 'dpad'], ['B', 'shoe'], ['A', 'talk']] : [['WASD', 'dpad'], ['SHIFT', 'shoe'], ['E', 'talk']];
    let x = 12; const y = R(H - 22 + (1 - easeOut(a)) * 10), g = ui.g; g.globalAlpha = a;
    for (const [k, icon] of rows) { x += ui.keycap(x, y, k) + 3; ui.bigIcon(icon, x, y - 1, null, { scale: 14 / 12 }); x += 20; }
    g.globalAlpha = 1;
  }
  // ------------------------------------------------------------------ the menu = the TokoPhone
  openMenu(tab = 'home', ui = this.ui || this.app.ui) {
    const ph = this.app.phone; if (!ph) return;
    if (this.app.keysDown) this.app.keysDown = {};
    if (ph.show) ph.show(TAB_OF[tab] || tab); else if (!ph.open) ph.toggle();
    if (ui) ui.keys = {};
  }
  closeMenu() { const ph = this.app.phone; if (ph && ph.open) { if (ph.close) ph.close(); else ph.toggle(); } }
  sfx(id) { const a = this.app.audio; if (a && a.sfx) a.sfx(id); }
}
