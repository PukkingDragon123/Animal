// The roaming HUD, TokoPhone style — icons and numbers first, a few words at most:
//  • top-left: the clock pill with its little sky dial (and the objective tag under it)
//  • top-centre: the place ribbon that drops in with a boing when you enter a new zone, then rises away
//  • top-right: the coin pill and the big red TokoPhone button (Tab / Esc also open it)
//  • bottom-left: party medals with tiny HP bars
//  • bottom-right: the round radar (the city map turning with the camera, places and the goal on it) and,
//    next to it, the TokoLens button that lights up and wobbles when something nearby is worth a closer look
//    (tap it or press R to search in first person — see search.js)
//  • the controls as key glyphs + icons, until you first move
// The pause menu is the TokoPhone itself (phone.js): openMenu(tab) opens it on that app.
// Call hud.draw(ui, dt) every frame while the player is roaming.
import { T } from '../../px/game/ui.js';
import { mx, clamp01, boing } from '../../px/game/uikit/theme.js';
import { circle, rgba, pixelCanvas } from '../../px/game/uikit/gfx.js';
import { frame, sparkle, ball } from '../../px/game/uikit/frame.js';
import { roundButton } from '../../px/game/uikit/widgets.js';
import { P } from '../../px/surface.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { maxHp } from '../../game/elemon.js';
import { weatherOf } from '../../game/time.js';
import { ELEM_ICON } from './dex.js';

const HINT_KEY = 'tokonmon.hintDone';
const TAB_OF = { party: 'party', bag: 'bag', map: 'map', save: 'settings', options: 'settings', close: 'home', quests: 'quests', dex: 'dex', home: 'home' };

export class Hud {
  constructor(app) { this.app = app; this.t = 0; this.menu = null; this.hideK = 0; this.zone = null; this.card = null; this.ui = null; this.locN = 0; this.mmCv = null; this.lensK = 0; }
  get menuOpen() { return !!(this.app.phone && this.app.phone.open); }
  // called by the world when you walk into a new zone / arrive somewhere: the place ribbon drops in
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
    const app = this.app, st = app.state || {}, W = ui.w, H = ui.h, narrow = W < 360;
    if (app.phone && app.phone.open) return;
    const busy = !!(ui.dialog || (app.story && app.story.busy));
    this.hideK += ((busy ? 1 : 0) - this.hideK) * Math.min(1, dt * 10);
    const off = this.hideK * 60, offL = this.hideK * 120;
    // top-left: the clock, then the objective tag
    const time = st.time || { day: 1, hour: 12 };
    ui.hudClock(5 - offL, 4, { day: time.day, time: time.hour, weather: safeWeather(time) });
    const obj = (app.story && app.story.objective) || (app.quests && app.quests.objective && app.quests.objective());
    if (obj && !busy) ui.objective(6, 38, obj, { maxW: narrow ? W - 12 : Math.min(230, W - 160) });
    // top-centre: the place ribbon
    const w = this.where();
    const signW = w.name ? ui.hudLocation(W / 2, narrow ? 34 : 2, w.name, w.sub, { align: 'center', hold: 3.2, id: 'zone' + this.locN }) : 0;
    ui.toastY = signW && !narrow ? 36 : null;
    // top-right: the TokoPhone button + coins
    const pb = roundButton(ui, W - 18, 18 - off * 0.6, 12, 'phone', { color: T.phone, tip: 'TokoPhone', badge: this.newQuests() || null });
    if (pb.clicked) this.openMenu('home', ui);
    if (!ui.dialog && !ui.modal && !busy && (ui.key('Escape') || ui.key('Tab'))) this.openMenu('home', ui);
    ui.hudMoney(W - 38, 10 - off * 0.6, st.money || 0, { align: 'right' });
    // bottom-right: the radar; the lens button beside it
    const mmD = narrow ? 56 : 68, mmX = W - mmD - 4, mmY = H - mmD - 4 + off;
    const world = app.world;
    ui.minimap(mmX, mmY, mmD, mmD, (u, x, y, ww, hh) => this.drawRadar(u, x, y, ww, hh), { player: !(world && world.city && world.player), north: northOf(world), heading: this.heading() });
    this.drawLens(ui, dt, mmX - 22, H - 26 + off, busy);
    // bottom-left: party medals
    const party = this.party();
    if (party.length) ui.partyBar(6, H - 38 + off, party, { maxW: mmX - 60 });
    if (world && world.city) this.drawHint(ui, dt, busy, mmX - 44);
  }
  newQuests() { const q = this.app.quests; if (!q || !q.list) return 0; try { return q.list().filter((x) => x.active).length; } catch (e) { return 0; } }
  heading() { const w = this.app.world, p = w && w.player; if (!p || !w.city) return 0; const yr = w.city.mapYaw ? w.city.mapYaw() : 0; return Math.PI - (p.yaw - yr); }
  // the radar: the city's map (1 px = 1 m), turned with the camera and centred on you
  drawRadar(ui, x, y, w, h) {
    const world = this.app.world, g = ui.g, city = world && world.city, mm = city && city.c && city.c.minimap, p = world && world.player;
    if (!mm || !p) { g.fillStyle = '#2a6a4a'; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; g.beginPath(); for (let i = 6; i < w; i += 12) { g.moveTo(x + i, y); g.lineTo(x + i, y + h); g.moveTo(x, y + i); g.lineTo(x + w, y + i); } g.stroke(); ui._fs = null; return; }
    if (!this.mmCv || this.mmCv.src !== mm) this.mmCv = { src: mm, cv: pixelCanvas(mm.w, mm.h, (d) => { const c = new Map(); for (let i = 0; i < mm.col.length; i++) { const k = mm.col[i]; let v = c.get(k); if (v === undefined) { v = P(k); c.set(k, v); } d[i] = v; } }) };
    const q = p.g.position, yr = city.mapYaw ? city.mapYaw() : 0, S = 0.9, cx = x + w / 2, cy = y + h / 2;
    g.fillStyle = '#1d2a5a'; g.fillRect(x, y, w, h);
    g.save(); g.translate(cx, cy); g.rotate(yr); g.scale(S, S); g.translate(-q.x, -q.z);
    const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(this.mmCv.cv, 0, 0); g.imageSmoothingEnabled = sm;
    g.restore(); ui._fs = null;
    const toMap = (wx, wz) => { const dx = (wx - q.x) * S, dz = (wz - q.z) * S, c = Math.cos(yr), s = Math.sin(yr); return [cx + dx * c - dz * s, cy + dx * s + dz * c]; };
    for (const it of city.c.inter) if (it.mm) { const [ix, iy] = toMap(it.x, it.z); if (Math.hypot(ix - cx, iy - cy) < w / 2 - 2) { g.fillStyle = '#ffd23a'; circle(g, ix, iy, 1.3); g.fill(); } }
    const sr = this.app.search, near = sr && sr.near;
    if (near) { const [ix, iy] = toMap(near.x, near.z), pulse = (this.t * 2) % 1; g.strokeStyle = rgba('#ffd23a', 1 - pulse); g.lineWidth = 1; circle(g, ix, iy, 1.5 + pulse * 5); g.stroke(); }
    const goal = this.app.story && this.app.story.goal;
    if (goal) { let [gx, gy] = toMap(goal.x, goal.z); const d = Math.hypot(gx - cx, gy - cy), R = w / 2 - 4; if (d > R) { gx = cx + (gx - cx) * R / d; gy = cy + (gy - cy) * R / d; } ball(ui.s, gx - 0.5, gy - 0.5, 2.6, ((this.t * 3) | 0) % 2 ? T.red : '#ffffff'); }
    // you
    g.save(); g.translate(cx, cy); g.rotate(this.heading());
    g.fillStyle = T.ink; g.beginPath(); g.moveTo(0, -5.5); g.lineTo(4.2, 4.2); g.lineTo(0, 2.2); g.lineTo(-4.2, 4.2); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, -3.9); g.lineTo(2.8, 3); g.lineTo(0, 1.4); g.lineTo(-2.8, 3); g.closePath(); g.fill();
    g.restore(); ui._fs = null;
  }
  // the TokoLens button: hidden away when nothing is near, pops and wobbles when something is
  drawLens(ui, dt, cx, cy, busy) {
    const sr = this.app.search, near = !busy && sr ? sr.scan(dt) : null;
    this.lensK += ((near ? 1 : 0) - this.lensK) * Math.min(1, dt * 10);
    if (this.lensK < 0.03) { this.lensT = 0; return; }
    this.lensT = (this.lensT || 0) + dt;
    const g = ui.g, k = boing(this.lensT * 1.4) * this.lensK, wob = Math.sin(this.t * 9) * 0.08 * (((this.t * 0.7) % 1) < 0.35 ? 1 : 0);
    g.save(); g.translate(cx, cy); g.rotate(wob); g.scale(Math.max(0.05, k), Math.max(0.05, k)); g.translate(-cx, -cy);
    const pulse = (this.t * 1.4) % 1; g.strokeStyle = rgba(T.amber, 0.9 * (1 - pulse)); g.lineWidth = 2; circle(g, cx, cy, 16 + pulse * 10); g.stroke();
    const b = roundButton(ui, cx, cy, 13, 'lens', { color: T.amber, tip: 'TokoLens', hotkey: 'r' });
    g.restore(); ui._fs = null; ui._font = null;
    if (near && this.lensT < 3 && this.lensK > 0.9) {
      const label = 'Look closer', lw = ui.tw(label, { bold: true, mini: true }) + 12;
      frame(ui, cx - lw / 2, cy - 33, lw, 12, { fill: T.ink, edge: '#3a3570', thin: true, r: 6, shadow: false });
      ui.text(label, cx, cy - 30, '#ffffff', { mini: true, bold: true, align: 'center' });
    }
    if (((this.t * 1.1) % 1) < 0.25) sparkle(ui.s, cx + 10, cy - 11, '#ffffff', 1 - ((this.t * 1.1) % 1) / 0.25);
    if (b.clicked && near) sr.enter(near);
  }
  // the controls as key glyphs + icons, until you first move (then never again)
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
    const kw = (k) => Math.max(11, ui.tw(k, { mini: k.length > 3, bold: true }) + 6);
    const widthOf = (L) => L.reduce((s, [k]) => s + kw(k) + 17, 0) - 4;
    let list = rows; while (list.length > 2 && widthOf(list) + 16 > Math.min(ui.w - 12, maxX - 120)) list = list.slice(0, -1);
    const tw = widthOf(list) + 14, x0 = (ui.w - tw) / 2, y = (ui.w < 360 ? H - 70 : H - 30) + (1 - a) * 10;
    const g = ui.g; g.save(); g.globalAlpha = a;
    frame(ui, x0, y - 4, tw, 21, { fill: T.panel, r: 10.5, thin: true, alpha: 0.95, shadowA: 0.3 });
    let x = x0 + 7;
    for (const [k, icon] of list) { x += ui.keycap(x, y, k) + 2; ui.bigIcon(icon, x, y, null, { shadow: false }); x += 15; }
    g.restore(); ui._fs = null; ui._font = null;
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
// the minimap and its compass turn with the city's camera (north stays up elsewhere)
function northOf(world) { return world && world.city && world.city.mapYaw ? world.city.mapYaw() : 0; }
function safeWeather(t) { try { return weatherOf(t); } catch (e) { return 'clear'; } }
void mx; void clamp01;
