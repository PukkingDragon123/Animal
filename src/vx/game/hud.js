// The roaming HUD in the pixel-GUI style — icons and numbers first, a few words at most:
//  • top-left: the party card — a portrait slot with the player's live 3D render, a raised name plate with
//    diamond ornaments and the partner's level on a square badge, the partner's name under it, and thin
//    HP / BOND / EXP bars; under it a row of icon buttons on wooden plinths (Bag, Party, Quests, Map,
//    TokoBook) that open the TokoPhone on that app; the objective tag below
//  • top-centre: the place plate that drops in with a boing when you enter a new zone, then rises away
//  • top-right: cream value pills — coins, gems, the clock
//  • bottom-right: the round copper radar (the city map turning with the camera), the TokoPhone button and
//    the TokoLens button, which pops up and wobbles when something nearby is worth a closer look (R)
//  • the controls as keycaps + icons, until you first move
// The pause menu is the TokoPhone itself (phone.js): openMenu(tab) opens it on that app.
import { T } from '../../px/game/ui.js';
import { mx, clamp01, boing } from '../../px/game/uikit/theme.js';
import { pixelCanvas, fillDisc } from '../../px/game/uikit/gfx.js';
import { frame, sparkle, ball, gem, tri } from '../../px/game/uikit/frame.js';
import { roundButton, plinthButton, valuePill, hudMoney, fmtNum } from '../../px/game/uikit/widgets.js';
import { drawPortrait } from '../../px/game/uikit/dialog.js';
import { P } from '../../px/surface.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { ITEMS } from '../../data/items.js';
import { maxHp, expToNext } from '../../game/elemon.js';
import { weatherOf } from '../../game/time.js';
import { ELEM_ICON } from './dex.js';

const HINT_KEY = 'tokonmon.hintDone';
const TAB_OF = { party: 'party', bag: 'bag', map: 'map', save: 'settings', options: 'settings', close: 'home', quests: 'quests', dex: 'dex', home: 'home' };
const ROW = [['bag', 'bag', 'Bag'], ['party', 'party', 'Party'], ['quest', 'quests', 'Quests'], ['map', 'map', 'Map'], ['book', 'dex', 'TokoBook']];
const R = Math.round;

export class Hud {
  constructor(app) { this.app = app; this.t = 0; this.menu = null; this.hideK = 0; this.zone = null; this.card = null; this.ui = null; this.locN = 0; this.mmCv = null; this.lensK = 0; this.portrait = null; this.portT = 0; }
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
      return { name: m.nick || sp.name || m.species, species: sp.name || m.species, hp: mh ? Math.round(mh * (m.hp ?? 1)) : (m.hp ?? 1), maxHp: mh || 0, color: (ELEMENTS[el] && ELEMENTS[el].color) || T.cyan, level: m.level, elem: el, icon: ELEM_ICON[el], fainted: (m.hp ?? 1) <= 0, exp: m.exp || 0, bond: m.friendship ?? 70 };
    });
  }
  // ------------------------------------------------------------------ the roaming HUD
  draw(ui, dt) {
    this.ui = ui; this.t += dt;
    const app = this.app, st = app.state || {}, W = ui.w, H = ui.h, narrow = W < 400;
    if (app.phone && app.phone.open) return;
    const busy = !!(ui.dialog || (app.story && app.story.busy));
    this.hideK += ((busy ? 1 : 0) - this.hideK) * Math.min(1, dt * 10);
    const off = R(this.hideK * 70), offL = R(this.hideK * 240);
    // top-left: the party card and the icon row
    const cardH = this.drawCard(ui, 6 - offL, 6, narrow);
    const rowY = 6 + cardH + 6;
    ROW.forEach(([icon, tab, label], i) => { const b = plinthButton(ui, 6 - offL + 15 + i * 30, rowY, icon, { label, tip: label }); if (b.clicked) this.openMenu(tab, ui); });
    const obj = (app.story && app.story.objective) || (app.quests && app.quests.objective && app.quests.objective());
    if (obj && !busy) ui.objective(6, rowY + 30, obj, { maxW: narrow ? W - 12 : Math.min(260, W - 200) });
    // top-centre: the place plate
    const w = this.where();
    // the place plate goes in the free space between the party card and the pills (else low in the middle)
    let lx = W / 2, ly = 2;
    if (w.name) {
      const nmW = Math.max(ui.tw(String(w.name).toUpperCase(), { mini: true, bold: true }) + 34, ui.tw(String(w.sub || '').toUpperCase(), { mini: true }) + 20);
      const left = 6 + (narrow ? 168 : 200) + 8, right = W - 116;
      if (lx - nmW / 2 < left || lx + nmW / 2 > right) { if (right - left >= nmW) lx = R((left + right) / 2); else { lx = R(W / 2); ly = H - 74; } }
    }
    const signW = w.name ? ui.hudLocation(lx, ly, w.name, w.sub, { align: 'center', hold: 3.2, id: 'zone' + this.locN }) : 0;
    ui.toastY = signW && ly < 10 ? 36 : null;
    // top-right: value pills (coins, gems, clock)
    const px = W - 84 + off;
    hudMoney(ui, px, 6, st.money || 0, { id: 'hud' });
    const gems = Object.entries(st.bag || {}).reduce((s, [id, n]) => s + ((ITEMS[id] && ITEMS[id].kind === 'gem') ? n : 0), 0);
    valuePill(ui, px, 26, 78, 'sparkle', fmtNum(gems), { color: T.blue });
    const time = st.time || { day: 1, hour: 12 }, hour = ((time.hour % 24) + 24) % 24, hh = Math.floor(hour), mm = Math.floor((hour % 1) * 60), night = hour < 5 || hour >= 19.5;
    valuePill(ui, px, 46, 78, night ? 'moon' : 'clock', `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, { color: night ? T.violet : T.red });
    const wn = { fog: 'fog', storm: 'storm', rain: 'rain', cloud: 'cloud', cloudy: 'cloud' }[safeWeather(time)];
    frame(ui, px - 24, 46, 18, 15, { thin: true, r: 1, shadowA: 0.3 }); ui.text('D' + time.day, px - 15, 51, T.text, { mini: true, bold: true, align: 'center' });
    if (wn) ui.bigIcon(wn, px - 22, 64, null, {});
    if (!ui.dialog && !ui.modal && !busy && (ui.key('Escape') || ui.key('Tab'))) this.openMenu('home', ui);
    // bottom-right: radar, phone, lens
    const mmD = narrow ? 64 : 76, mmX = W - mmD - 6, mmY = H - mmD - 6 + off;
    const world = app.world;
    ui.minimap(mmX, mmY, mmD, mmD, (u, x, y, ww, hh2) => this.drawRadar(u, x, y, ww, hh2), { player: !(world && world.city && world.player), north: northOf(world) });
    const pb = roundButton(ui, mmX - 14, mmY + mmD - 14, 10, 'phone', { color: T.phone, tip: 'TokoPhone', badge: this.newQuests() || null });
    if (pb.clicked) this.openMenu('home', ui);
    this.drawLens(ui, dt, mmX - 16, mmY + 8, busy);
    if (world && world.city) this.drawHint(ui, dt, busy, mmX - 50);
  }
  // the party card: portrait slot, name plate + level badge, partner name, HP / BOND / EXP bars
  drawCard(ui, x, y, narrow) {
    const app = this.app, st = app.state || {}, lead = this.party()[0], w = narrow ? 168 : 200, h = 74;
    frame(ui, x, y, w, h, {});
    // the portrait: the player's live 3D render, refreshed now and then
    this.portT -= ui.dt;
    const hero = app.world && app.world.actor && app.world.actor('hero');
    if (hero && app.renderPortrait && (this.portT <= 0 || !this.portrait)) { this.portT = 2.5; try { this.portrait = app.renderPortrait(hero, 96); } catch (e) { this.portrait = null; } }
    drawPortrait(ui, this.portrait || ((u, px, py, s) => { u.emblem('party', px + s / 2, py + s / 2, 2); }), x + 10, y + 12, 48, lead ? lead.color : T.cyan);
    // name plate + level badge
    const nx = x + 66, nw = w - 66 - 26, name = String((st.player && st.player.name) || 'Ren').toUpperCase();
    frame(ui, nx, y + 7, nw, 13, { thin: true, r: 1, fill: T.creamL, shadow: false });
    gem(ui.s, nx + 5, y + 13, T.copperL, 2); gem(ui.s, nx + nw - 6, y + 13, T.copperL, 2);
    ui.text(name, R(nx + nw / 2), y + 11, T.text, { mini: true, bold: true, align: 'center' });
    frame(ui, nx + nw + 2, y + 6, 16, 15, { thin: true, r: 1, fill: T.copperL, shadow: false });
    ui.text(lead ? String(lead.level) : '-', nx + nw + 10, y + 10, '#ffffff', { mini: true, bold: true, align: 'center', outline: T.copperD });
    ui.text(lead ? lead.name.toUpperCase() : 'NO PARTNER', R(nx + nw / 2), y + 23, T.dim, { mini: true, align: 'center' });
    // the bars
    const bx = nx, bw = w - 66 - 8;
    const rows = lead ? [['HP', lead.maxHp ? lead.hp / lead.maxHp : lead.hp, 'green', lead.maxHp ? `${lead.hp}/${lead.maxHp}` : ''], ['BOND', clamp01(lead.bond / 255), 'blue', `${lead.bond}/255`], ['EXP', clamp01(lead.exp / expToNext(lead.level)), 'orange', `${lead.exp}/${expToNext(lead.level)}`]] : [];
    rows.forEach(([lab, v, col, val], i) => {
      const by = y + 32 + i * 12;
      ui.bar(bx + 1, by, bw - 2, 3, v, { color: col, id: 'hud-' + lab, shine: false });
      ui.text(lab, bx, by + 5, T.dim, { mini: true });
      ui.text(val, bx + bw, by + 5, T.dim, { mini: true, align: 'right' });
    });
    return h;
  }
  newQuests() { const q = this.app.quests; if (!q || !q.list) return 0; try { return q.list().filter((x) => x.active).length; } catch (e) { return 0; } }
  heading() { const w = this.app.world, p = w && w.player; if (!p || !w.city) return 0; const yr = w.city.mapYaw ? w.city.mapYaw() : 0; return Math.PI - (p.yaw - yr); }
  // the radar: the city map (1 px = 1 m), turned with the camera and centred on you
  drawRadar(ui, x, y, w, h) {
    const world = this.app.world, g = ui.g, city = world && world.city, mm = city && city.c && city.c.minimap, p = world && world.player;
    if (!mm || !p) { ui.rect(x, y, w, h, '#3a6a3e'); for (let i = 4; i < w; i += 10) { ui.rect(x + i, y, 1, h, '#4a7a4a'); ui.rect(x, y + i, w, 1, '#4a7a4a'); } return; }
    if (!this.mmCv || this.mmCv.src !== mm) this.mmCv = { src: mm, cv: pixelCanvas(mm.w, mm.h, (d) => { const c = new Map(); for (let i = 0; i < mm.col.length; i++) { const k = mm.col[i]; let v = c.get(k); if (v === undefined) { v = P(k); c.set(k, v); } d[i] = v; } }) };
    const q = p.g.position, yr = city.mapYaw ? city.mapYaw() : 0, cx = R(x + w / 2), cy = R(y + h / 2);
    ui.rect(x, y, w, h, '#2a2430');
    g.save(); g.translate(cx, cy); g.rotate(yr); g.translate(-q.x, -q.z); g.imageSmoothingEnabled = false; g.drawImage(this.mmCv.cv, 0, 0); g.restore(); ui._fs = null;
    const toMap = (wx, wz) => { const dx = wx - q.x, dz = wz - q.z, c = Math.cos(yr), s = Math.sin(yr); return [R(cx + dx * c - dz * s), R(cy + dx * s + dz * c)]; };
    for (const it of city.c.inter) if (it.mm) { const [ix, iy] = toMap(it.x, it.z); if (Math.hypot(ix - cx, iy - cy) < w / 2 - 2) ui.rect(ix - 1, iy - 1, 2, 2, T.amber); }
    const sr = this.app.search, near = sr && sr.near;
    if (near) { const [ix, iy] = toMap(near.x, near.z); if (((this.t * 3) | 0) % 2) ui.rect(ix - 1, iy - 1, 3, 3, '#ffffff'); }
    const goal = this.app.story && this.app.story.goal;
    if (goal) { let [gx, gy] = toMap(goal.x, goal.z); const d = Math.hypot(gx - cx, gy - cy), Rr = w / 2 - 4; if (d > Rr) { gx = R(cx + (gx - cx) * Rr / d); gy = R(cy + (gy - cy) * Rr / d); } ball(ui.s, gx, gy, 2, ((this.t * 3) | 0) % 2 ? T.red : '#ffffff'); }
    // you: a pixel arrow turned to your heading (8 directions)
    const hd = this.heading(), dirs = ['up', 'right', 'down', 'left'], k = ((Math.round(hd / (Math.PI / 2)) % 4) + 4) % 4;
    fillDisc(ui, cx, cy, 3, T.ink); fillDisc(ui, cx, cy, 2, '#ffffff');
    const ax = cx + R(Math.sin(hd) * 5), ay = cy - R(Math.cos(hd) * 5);
    tri(ui.s, ax - 2, ay - 2, dirs[k], 2, T.red);
  }
  // the TokoLens button: hidden away when nothing is near; it pops and wobbles when something is
  drawLens(ui, dt, cx, cy, busy) {
    const sr = this.app.search, near = !busy && sr ? sr.scan(dt) : null;
    this.lensK += ((near ? 1 : 0) - this.lensK) * Math.min(1, dt * 10);
    if (this.lensK < 0.05) { this.lensT = 0; return; }
    this.lensT = (this.lensT || 0) + dt;
    const g = ui.g, k = Math.max(0.1, boing(this.lensT * 1.4) * this.lensK), wob = Math.sin(this.t * 9) * 0.1 * (((this.t * 0.7) % 1) < 0.35 ? 1 : 0);
    g.save(); g.translate(cx, cy); g.rotate(wob); g.scale(k, k); g.translate(-cx, -cy);
    const b = roundButton(ui, cx, cy, 11, 'lens', { color: T.amber, tip: 'TokoLens', hotkey: 'r', sel: true });
    g.restore(); ui._fs = null;
    if (near && this.lensT < 3 && this.lensK > 0.9) {
      const label = 'LOOK CLOSER', lw = R(ui.tw(label, { mini: true, bold: true }) + 12);
      frame(ui, R(cx - lw / 2), cy - 30, lw, 12, { thin: true, r: 1, fill: T.ink, edge: T.copperD, shadow: false });
      ui.text(label, cx, cy - 27, T.cream, { mini: true, bold: true, align: 'center' });
    }
    if (b.clicked && near) sr.enter(near);
  }
  // the controls as keycaps + icons, until you first move (then never again)
  drawHint(ui, dt, busy, maxX) {
    const c = this.app.world.city, H = ui.h, p = this.app.world.player;
    if (this.hintDone == null) { try { this.hintDone = typeof localStorage !== 'undefined' && localStorage.getItem(HINT_KEY) === '1'; } catch (e) { this.hintDone = false; } }
    if (this.hintDone && !this.hintOut) return;
    if (busy || !c.active()) return;
    if (p && p.g) { const q = p.g.position; if (!this.hintAt) this.hintAt = [q.x, q.z]; else if (!this.hintOut && Math.hypot(q.x - this.hintAt[0], q.z - this.hintAt[1]) > 1.5) { this.hintOut = 0.001; try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* private mode */ } } }
    this.hintT = (this.hintT || 0) + dt;
    if (this.hintOut) { this.hintOut += dt; if (this.hintOut > 0.5) { this.hintDone = true; this.hintOut = 0; return; } }
    if (c.touch && !c.pad) return;
    const a = Math.min(1, this.hintT / 0.4) * (this.hintOut ? 1 - this.hintOut / 0.5 : 1); if (a <= 0.05) return;
    const rows = c.pad ? [['LS', 'dpad'], ['B', 'shoe'], ['RS', 'eye'], ['A', 'talk']] : [['WASD', 'dpad'], ['SHIFT', 'shoe'], ['Q E', 'eye'], ['E', 'talk'], ['R', 'lens']];
    const kw = (k) => Math.max(11, R(ui.tw(k, { mini: true, bold: true }) + 7));
    const widthOf = (L) => L.reduce((s, [k]) => s + kw(k) + 20, 0) - 4;
    let list = rows; while (list.length > 2 && widthOf(list) + 16 > Math.min(ui.w - 12, maxX - 150)) list = list.slice(0, -1);
    const tw = widthOf(list) + 14, x0 = R((ui.w - tw) / 2), y = R(H - 30 + (1 - a) * 10);
    const g = ui.g; g.save(); g.globalAlpha = a;
    frame(ui, x0, y - 5, tw, 23, { thin: true, r: 2, shadowA: 0.3 });
    let x = x0 + 7;
    for (const [k, icon] of list) { x += ui.keycap(x, y, k) + 3; ui.bigIcon(icon, x, y, null, { shadow: false, scale: 14 / 12 }); x += 17; }
    g.restore(); ui._fs = null;
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
function northOf(world) { return world && world.city && world.city.mapYaw ? world.city.mapYaw() : 0; }
function safeWeather(t) { try { return weatherOf(t); } catch (e) { return 'clear'; } }
void mx; void sparkle;
