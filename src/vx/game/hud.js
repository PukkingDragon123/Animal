// The roaming HUD, icons and numbers first: a sun/moon dial with the time
// (top-left), a coin purse + round menu button (top-right), party beads
// (bottom-left), a round minimap (bottom-right), a wooden place sign that drops
// in on a rope when you enter a new zone and then rises away, and the control
// hint (key glyphs + icons) until you first move. The pause menu is a row of big
// round wooden buttons with tooltips over a parchment page (Party, Bag, Map,
// Save, Options, Close), opened as a modal over everything.
// Call hud.draw(ui, dt) every frame while the player is roaming.
import { T } from '../../px/game/ui.js';
import { mx, clamp01, easeOut, easeOutBack } from '../../px/game/uikit/theme.js';
import { gradFill, sparkle, ball, frame, woodRing } from '../../px/game/uikit/frame.js';
import { fmtNum, roundButton } from '../../px/game/uikit/widgets.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { ITEMS } from '../../data/items.js';
import { maxHp } from '../../game/elemon.js';
import { weatherOf } from '../../game/time.js';

const MENU = [
  { id: 'party', label: 'Party', icon: 'party', color: T.amber },
  { id: 'bag', label: 'Bag', icon: 'bag', color: T.coral },
  { id: 'map', label: 'Map', icon: 'map', color: T.cyan },
  { id: 'save', label: 'Save', icon: 'save', color: T.green },
  { id: 'options', label: 'Sound', icon: 'music', color: T.violet },
  { id: 'close', label: 'Resume', icon: 'play', color: T.amber },
];
const ITEM_ICON = { food: 'bowl', disc: 'disc', gear: 'gear', key: 'star', gem: 'coin', capture: 'coin', boost: 'bolt' };
const ELEM_ICON = { pyro: 'flame', hydro: 'drop', bio: 'leaf', volto: 'bolt', geo: 'shield', echo: 'music', cryo: 'drop', aero: 'cloud', ecto: 'eye', ferro: 'gear', astro: 'star', nucleo: 'bolt', draco: 'flame' };
const HINT_KEY = 'tokonmon.hintDone';

export class Hud {
  constructor(app) { this.app = app; this.t = 0; this.menu = null; this.hideK = 0; this.zone = null; this.card = null; this.ui = null; this.locN = 0; }
  get menuOpen() { return !!this.menu; }
  // called by the world when you walk into a new zone / arrive somewhere: the place sign drops in
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
      return { name: m.nick || sp.name || m.species, species: sp.name || m.species, hp: mh ? Math.round(mh * (m.hp ?? 1)) : (m.hp ?? 1), maxHp: mh || 0, color: (ELEMENTS[el] && ELEMENTS[el].color) || T.cyan, level: m.level, elem: el, fainted: (m.hp ?? 1) <= 0 };
    });
  }
  // ------------------------------------------------------------------ the roaming HUD
  draw(ui, dt) {
    this.ui = ui; this.t += dt;
    const app = this.app, st = app.state || {}, W = ui.w, H = ui.h, narrow = W < 360;
    if ((app.phone && app.phone.open) || this.menu) return;
    const busy = !!(ui.dialog || (app.story && app.story.busy));
    this.hideK += ((busy ? 1 : 0) - this.hideK) * Math.min(1, dt * 10);
    const off = Math.round(this.hideK * 48), offL = Math.round(this.hideK * 110);
    // top-left: the sun/moon dial + time, then the objective tag
    const time = st.time || { day: 1, hour: 12 };
    ui.hudClock(5 - offL, 4, { day: time.day, time: time.hour, weather: safeWeather(time) });
    const obj = (app.story && app.story.objective) || (app.quests && app.quests.objective && app.quests.objective());
    if (obj && !busy) ui.objective(6, 36, obj, { maxW: narrow ? W - 12 : Math.min(220, W - 150) });
    // top-centre: the place sign (drops in when the zone changes, then rises away)
    const w = this.where();
    const signW = w.name ? ui.hudLocation(W >> 1, narrow ? 26 : 0, w.name, w.sub, { align: 'center', hold: 3.2, id: 'zone' + this.locN }) : 0;
    ui.toastY = signW && !narrow ? 40 : null;     // toasts queue under the sign while it hangs there
    // top-right: menu button + coin purse
    const mb = 24;
    if (ui.iconButton(W - mb - 4, 3, mb, 'menu', { color: T.amber, tip: 'Menu' })) this.openMenu('party', ui);
    if (!ui.dialog && !ui.modal && (ui.key('Escape') || ui.key('Tab'))) this.openMenu('party', ui);
    ui.hudMoney(W - mb - 8, 8, st.money || 0, { align: 'right' });
    // bottom-right: round minimap; bottom-left: party beads
    const mmD = narrow ? 52 : 64, mmX = W - mmD - 4, mmY = H - mmD - 4 + off;
    const world = app.world;
    ui.minimap(mmX, mmY, mmD, mmD, world && world.drawMinimap ? (u, x, yy, ww, hh) => world.drawMinimap(u, x, yy, ww, hh) : placeholderMap, { player: !(world && world.drawMinimap), north: northOf(world) });
    const party = this.party();
    if (party.length) ui.partyBar(6, H - 36 + off, party, { maxW: mmX - 12 });
    if (world && world.city) this.drawHint(ui, dt, busy, mmX);
  }
  // the controls as key glyphs + icons, until you first move (then never again)
  drawHint(ui, dt, busy, maxX) {
    const c = this.app.world.city, H = ui.h, p = this.app.world.player;
    if (this.hintDone == null) { try { this.hintDone = typeof localStorage !== 'undefined' && localStorage.getItem(HINT_KEY) === '1'; } catch (e) { this.hintDone = false; } }
    if (this.hintDone && !this.hintOut) return;
    if (busy || !c.active()) return;
    // first use: the player has walked a couple of steps
    if (p && p.g) { const q = p.g.position; if (!this.hintAt) this.hintAt = [q.x, q.z]; else if (!this.hintOut && Math.hypot(q.x - this.hintAt[0], q.z - this.hintAt[1]) > 1.5) { this.hintOut = 0.001; try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* private mode */ } } }
    this.hintT = (this.hintT || 0) + dt;
    if (this.hintOut) { this.hintOut += dt; if (this.hintOut > 0.5) { this.hintDone = true; this.hintOut = 0; return; } }
    if (c.touch && !c.pad) return;    // the ghost thumbstick shows touch players where to start
    const a = Math.min(1, this.hintT / 0.4) * (this.hintOut ? 1 - this.hintOut / 0.5 : 1); if (a <= 0.05) return;
    const rows = c.pad ? [['LS', 'dpad'], ['B', 'shoe'], ['RS', 'eye'], ['A', 'talk']] : [['WASD', 'dpad'], ['SHIFT', 'shoe'], ['Q E', 'eye'], ['E', 'talk']];
    const kw = (k) => Math.max(11, ui.tw(k, { mini: k.length > 3 }) + 6);
    const widthOf = (L) => L.reduce((s, [k]) => s + kw(k) + 17, 0) - 4;
    const list = widthOf(rows) + 16 > Math.min(ui.w - 12, maxX - 12) ? rows.slice(0, 2) : rows;
    const tw = widthOf(list) + 14, x0 = Math.round((ui.w - tw) / 2), y = (ui.w < 360 ? H - 66 : H - 30) + Math.round((1 - a) * 10);
    frame(ui, x0, y - 4, tw, 21, { thin: true, r: 6, fill: T.wood, rivets: false, seams: false, alpha: 0.92, shadowA: 0.3 });
    let x = x0 + 7;
    for (const [k, icon] of list) { x += ui.keycap(x, y, k) + 2; ui.bigIcon(icon, x, y, null, { shadow: false }); x += 15; }
  }
  // ------------------------------------------------------------------ pause menu (a modal over everything)
  openMenu(tab = 'party', ui = this.ui || this.app.ui) {
    if (this.menu || !ui) return;
    const sel = Math.max(0, MENU.findIndex((m) => m.id === tab));
    this.menu = { sel, view: null, t: 0, lp: null, opt: 0, selT: 0, bag: 0 };
    if (this.app.keysDown) this.app.keysDown = {};          // stop walking
    this.sfx('phone_open');
    this.modal = ui.openModal({ capture: true, draw: (u, dt, live) => this.drawPauseMenu(u, dt, live), onClose: () => { this.menu = null; this.modal = null; } });
    ui.keys = {};                                            // the key that opened the menu must not also close it this frame
  }
  closeMenu(ui = this.ui || this.app.ui) { if (!this.menu) return; this.sfx('phone_close'); if (ui && this.modal) ui.closeModal(this.modal); else this.menu = null; }
  sfx(id) { const a = this.app.audio; if (a && a.sfx) a.sfx(id); }
  activate(id, ui) {
    const app = this.app, M = this.menu;
    if (id === 'close') return this.closeMenu(ui);
    if (id === 'map') { this.closeMenu(ui); if (app.phone && app.phone.toggle) app.phone.toggle(); return; }
    if (id === 'save') { if (app.save) app.save(); ui.toast('Saved', { icon: 'check', color: T.green }); this.sfx('ui_confirm'); M.saved = this.t; return; }
    M.view = id; this.sfx('ui_tap');
  }
  select(i) { const M = this.menu; if (M.sel !== i) { M.sel = i; M.selT = 0; M.view = null; this.sfx('ui_tap'); } }
  drawPauseMenu(ui, dt, live = true) {
    const M = this.menu; if (!M) return;
    M.t += dt; M.selT += dt; this.ui = ui;
    const W = ui.w, H = ui.h, s = ui.s, narrow = W < 360, k = easeOut(M.t * 4.5), n = MENU.length;
    ui.fade(0.55 * k, '#1a120a');
    // input
    if (live) {
      if (ui.key('Escape') || ui.key('Tab')) return this.closeMenu(ui);
      if (ui.key('ArrowLeft') || ui.key('a')) this.select((M.sel + n - 1) % n);
      if (ui.key('ArrowRight') || ui.key('d')) this.select((M.sel + 1) % n);
      if (ui.key('Enter') || ui.key(' ') || ui.key('e')) this.activate(MENU[M.sel].id, ui);
      if (!this.menu) return;
    }
    // the row of big round buttons
    const r = narrow ? 10 : 13, R = r + 3, gap = narrow ? 6 : 12, rowW = n * (2 * R + 1) + (n - 1) * gap;
    const rx0 = Math.round((W - rowW) / 2) + R, ry = 8 + R + Math.round((1 - k) * -40);
    let tipAt = null;
    MENU.forEach((it, i) => {
      const cx = rx0 + i * (2 * R + 1 + gap), pop = easeOutBack(clamp01(M.t * 4 - i * 0.12));
      const cy = ry + Math.round((1 - pop) * -12);
      const b = roundButton(ui, cx, cy, r, it.icon, { modal: true, sel: M.sel === i, color: it.color, tip: it.label });
      if (b.over) { if (M.lp !== i) { M.lp = i; this.select(i); } tipAt = [cx, cy, it.label]; }
      if (b.clicked && live) { this.select(i); this.activate(it.id, ui); }
    });
    if (!this.menu) return;
    if (!tipAt) { const i = M.sel; tipAt = [rx0 + i * (2 * R + 1 + gap), ry, MENU[i].label]; }
    // the page
    const it = MENU[M.sel], pw = Math.min(W - 16, 352), px = (W - pw) >> 1, py = ry + R + 14, ph = Math.min(H - py - 6, 176) + Math.round((1 - k) * 40);
    frame(ui, px, py, pw, ph, { paper: true, fill: T.wood, leaves: true });
    const ax = px + 10, ay = py + 9, aw = pw - 20, ah = ph - 18;
    ({ party: () => this.panelParty(ui, ax, ay, aw, ah), bag: () => this.panelBag(ui, ax, ay, aw, ah, live), map: () => this.panelMap(ui, ax, ay, aw, ah), save: () => this.panelSave(ui, ax, ay, aw, ah), options: () => this.panelOptions(ui, ax, ay, aw, ah, live), close: () => this.panelClose(ui, ax, ay, aw, ah) })[it.id]();
    tip(ui, tipAt[0], tipAt[1] + R + 3, tipAt[2]);
    void s;
  }
  panelParty(ui, x, y, w, h) {
    const party = this.party(), s = ui.s;
    if (!party.length) { ui.bigIcon('party', x + (w >> 1) - 12, y + (h >> 1) - 16, null, { scale: 2, dim: 0.4 }); return; }
    const rh = Math.min(30, Math.floor((h - 4) / Math.max(1, party.length)) - 3);
    party.forEach((m, i) => {
      const ry = y + i * (rh + 3), pop = easeOut(clamp01(this.menu.selT * 5 - i * 0.25)), rx = x + Math.round((1 - pop) * 16);
      frame(ui, rx, ry, w, rh, { thin: true, r: 4, fill: i === 0 ? mx(T.wood, T.amber, 0.12) : T.wood, rivets: false, seams: false, shadowA: 0.25 });
      const rr = Math.min(8, (rh >> 1) - 4), ex = rx + 5 + rr + 2, ey = ry + (rh >> 1);
      woodRing(s, ex, ey, rr, { th: 2, fill: m.fainted ? '#8a7a6a' : m.color, shadow: false });
      ball(s, ex, ey, rr - 1, m.fainted ? '#8a7a6a' : m.color, { ink: mx(m.color, T.ink, 0.5) });
      ui.text(m.name[0].toUpperCase(), ex + 1, ey - 3, '#ffffff', { align: 'center', bold: true, outline: mx(m.color, T.ink, 0.65) });
      const nx = ex + rr + 8;
      ui.text(m.name, nx, ry + 4, T.text, { bold: true, shadow: T.woodDD });
      ui.text(String(m.level), nx + ui.tw(m.name, { bold: true }) + 4, ry + 5, T.amber, { mini: true, shadow: T.woodDD });
      if (m.elem) ui.bigIcon(ELEM_ICON[m.elem] || 'star', rx + w - 17, ry + ((rh - 12) >> 1), null, { shadow: false });
      if (rh >= 20) {
        const bw = Math.max(30, w - (nx - rx) - 70);
        ui.bar(nx, ry + rh - 9, bw, 4, m.maxHp ? m.hp / m.maxHp : m.hp, { seg: 5, id: 'menu-party' + i });
        if (m.fainted) ui.icon('cross', nx + bw + 5, ry + rh - 11, T.red, T.woodDD);
        else ui.text(`${m.hp}/${m.maxHp}`, nx + bw + 5, ry + rh - 9, T.dim, { mini: true, shadow: T.woodDD });
      }
    });
  }
  panelBag(ui, x, y, w, h, live) {
    const bag = (this.app.state && this.app.state.bag) || {}, ids = Object.keys(bag).filter((id) => bag[id] > 0), M = this.menu;
    if (!ids.length) { ui.bigIcon('bag', x + (w >> 1) - 12, y + (h >> 1) - 16, null, { scale: 2, dim: 0.4 }); return; }
    const ts = 30, gap = 6, cols = Math.max(1, Math.floor((w + gap) / (ts + gap))), rowsMax = Math.max(1, Math.floor((h - 16 + gap) / (ts + gap)));
    const list = ids.slice(0, cols * rowsMax), gx = x + Math.round((w - (cols * (ts + gap) - gap)) / 2);
    if (live && (ui.key('ArrowDown') || ui.key('s'))) M.bag = Math.min(list.length - 1, M.bag + cols);
    if (live && (ui.key('ArrowUp') || ui.key('w'))) M.bag = Math.max(0, M.bag - cols);
    M.bag = Math.min(M.bag, list.length - 1);
    list.forEach((id, i) => {
      const it = ITEMS[id] || { name: id }, cx = gx + (i % cols) * (ts + gap), cy = y + Math.floor(i / cols) * (ts + gap);
      const over = live && ui.inside(cx, cy, ts, ts); if (over) M.bag = i;
      const on = M.bag === i, lift = on ? -1 : 0;
      frame(ui, cx, cy + lift, ts, ts, { thin: true, r: 5, fill: on ? mx(T.wood, T.leaf, 0.25) : T.wood, edge: on ? T.leaf : undefined, rivets: false, seams: false, shadowA: 0.25 });
      ui.bigIcon(ITEM_ICON[it.kind] || 'bag', cx + 9, cy + 6 + lift, null, { shadow: false });
      ui.text('×' + bag[id], cx + ts - 4, cy + ts - 9 + lift, T.text, { align: 'right', mini: true, shadow: T.woodDD });
      if (on && ((ui.t * 1.3) % 1) < 0.3) sparkle(ui.s, cx + ts - 4, cy + 3 + lift, T.amberL, 0.6);
    });
    const sel = ITEMS[list[M.bag]] || { name: list[M.bag] };
    ui.text(sel.name || list[M.bag], x + (w >> 1), y + h - 8, T.paperText, { align: 'center', bold: true });
  }
  panelMap(ui, x, y, w, h) {
    const where = this.where(), world = this.app.world, d = Math.min(h - 4, w >> 1, 120);
    ui.minimap(x + 4, y + ((h - d) >> 1), d, d, world && world.drawMinimap ? (u, a, b2, c, dd) => world.drawMinimap(u, a, b2, c, dd) : placeholderMap, { player: !(world && world.drawMinimap), north: northOf(world) });
    const tx = x + d + 18, cy = y + (h >> 1);
    ui.icon('pin', tx, cy - 26, T.coral, T.paperE);
    ui.text(where.name || '—', tx + 10, cy - 26, T.paperText, { bold: true });
    if (where.sub) ui.text(where.sub, tx + 10, cy - 15, T.paperDim, {});
    const b = roundButton(ui, tx + 16, cy + 18, 13, 'map', { modal: true, sel: true, color: T.cyan, tip: 'Open map' });
    if (b.over) tip(ui, tx + 16, cy + 37, 'Open map');
    if (b.clicked) this.activate('map', ui);
  }
  panelSave(ui, x, y, w, h) {
    const st = this.app.state || {}, t = st.time || { day: 1, hour: 12 };
    const rows = [['star', (st.player && st.player.name) || '—'], ['sun', String(t.day)], ['party', String((st.party || []).length)], ['coin', fmtNum(st.money || 0)]];
    const cx = x + (w >> 1) - 90, ry0 = y + Math.max(2, (h - rows.length * 18) >> 1);
    rows.forEach(([icon, v], i) => { const ry = ry0 + i * 18; ui.bigIcon(icon, cx, ry, null, { shadow: false }); ui.text(v, cx + 18, ry + 3, T.paperText, { bold: true }); });
    const M = this.menu, bx = x + (w >> 1) + 50, by = y + (h >> 1) - 6;
    const done = M.saved != null && this.t - M.saved < 2;
    const b = roundButton(ui, bx, by, 13, done ? 'check' : 'save', { modal: true, sel: true, color: T.green, tip: 'Save' });
    if (b.over) tip(ui, bx, by + 19, 'Save');
    if (b.clicked) this.activate('save', ui);
  }
  panelOptions(ui, x, y, w, h, live) {
    const st = this.app.state || {}, set = st.settings || (st.settings = {});
    const opts = [['music', T.pink, 'music', '-', '='], ['sfx', T.cyan, 'bell', '[', ']']];
    const step = (key, d) => { set[key] = Math.round(clamp01((set[key] ?? 0.8) + d) * 10) / 10; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); this.sfx('ui_tap'); };
    opts.forEach(([key, col, icon, kDn, kUp], i) => {
      const ry = y + 8 + i * 30, v = clamp01(set[key] ?? 0.8);
      ui.bigIcon(icon, x + 4, ry, null, { shadow: false });
      const bx = x + 46, bw = Math.max(40, w - 96);
      if (ui.button(x + 22, ry - 1, 18, 15, '', { modal: true, color: col, icon: 'left', hotkey: kDn })) step(key, -0.1);
      ui.bar(bx, ry + 4, bw, 6, v, { color: col, seg: 6, id: 'opt' + key, trail: false });
      if (ui.button(bx + bw + 6, ry - 1, 18, 15, '', { modal: true, color: col, icon: 'right', hotkey: kUp })) step(key, 0.1);
      if (live && ui.ptr.down && ui.inside(bx, ry, bw, 14)) { set[key] = Math.round(clamp01((ui.ptr.x - bx) / bw) * 20) / 20; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); }
    });
  }
  panelClose(ui, x, y, w, h) {
    const b = roundButton(ui, x + (w >> 1), y + (h >> 1) - 4, 16, 'play', { modal: true, sel: true, color: T.amber, tip: 'Resume' });
    if (b.over) tip(ui, x + (w >> 1), y + (h >> 1) + 18, 'Resume');
    if (b.clicked) this.closeMenu(ui);
  }
}

// a small wooden tooltip tag centred under (cx, y)
function tip(ui, cx, y, str) {
  const w = ui.tw(str) + 12, x = Math.round(cx - w / 2), s = ui.s;
  frame(ui, x, y + 3, w, 13, { thin: true, r: 4, fill: T.woodL, edge: T.wood, rivets: false, seams: false, shadowA: 0.3 });
  s.px(cx, y + 1, T.ink); s.px(cx - 1, y + 2, T.ink); s.px(cx, y + 2, T.woodL); s.px(cx + 1, y + 2, T.ink);
  ui.text(str, x + 6, y + 6, T.text, { shadow: T.woodDD });
}
// the minimap and its compass turn with the city's camera (north stays up elsewhere)
function northOf(world) { return world && world.city && world.city.mapYaw ? world.city.mapYaw() : 0; }
function safeWeather(t) { try { return weatherOf(t); } catch (e) { return 'clear'; } }
// stand-in minimap texture when the world has no drawMinimap
function placeholderMap(ui, x, y, w, h) {
  const s = ui.s;
  gradFill(s, x, y, w, h, ['#6a9a4a', '#4f7a3a'], 0);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + 2) % 12 === 0 || (j + 4) % 10 === 0) s.px(x + i, y + j, '#c8b890');
}
