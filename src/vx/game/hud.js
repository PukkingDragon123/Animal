// The roaming HUD: location plate + day-cycle clock (top-left), money + menu
// button (top-right), party cards (bottom-left), framed minimap (bottom-right),
// a centred title card when you enter a new area, and the pause menu (Party,
// Bag, Map, Save, Options, Close) which opens as a modal over everything.
// Call hud.draw(ui, dt) every frame while the player is roaming.
import { T } from '../../px/game/ui.js';
import { sh, mx, clamp01, easeOut } from '../../px/game/uikit/theme.js';
import { gradFill, hgradRun, tri, gem, sparkle, ball, ringPx } from '../../px/game/uikit/frame.js';
import { fmtNum } from '../../px/game/uikit/widgets.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { ITEMS } from '../../data/items.js';
import { maxHp } from '../../game/elemon.js';
import { weatherOf } from '../../game/time.js';

const MENU = [
  { id: 'party', label: 'Party', icon: 'party', color: T.amber, hint: 'Your Tokonmon' },
  { id: 'bag', label: 'Bag', icon: 'bag', color: T.coral, hint: 'Items you carry' },
  { id: 'map', label: 'Map', icon: 'map', color: T.cyan, hint: 'Open the TokoPhone map' },
  { id: 'save', label: 'Save', icon: 'save', color: T.green, hint: 'Write your progress' },
  { id: 'options', label: 'Options', icon: 'gear', color: T.violet, hint: 'Sound and display' },
  { id: 'close', label: 'Close', icon: 'cross', color: T.dim, hint: 'Back to the game' },
];
const ITEM_ICON = { food: 'bowl', disc: 'disc', gear: 'gear', key: 'star', gem: 'coin', capture: 'coin', boost: 'bolt' };

export class Hud {
  constructor(app) { this.app = app; this.t = 0; this.menu = null; this.hideK = 0; this.zone = null; this.card = null; this.ui = null; }
  get menuOpen() { return !!this.menu; }
  // called by the world when you walk into a new zone / arrive somewhere: slides the plate and shows a title card
  showLocation(name, sub) { this.zone = { name, sub }; this.card = { name, sub: sub || this.city(), t: 0 }; }
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
    if (app.phone && app.phone.open) return;
    const busy = !!(ui.dialog || (app.story && app.story.busy));
    this.hideK += ((busy ? 1 : 0) - this.hideK) * Math.min(1, dt * 10);
    const off = Math.round(this.hideK * 48);
    // top-left: location plate, clock, objective
    const w = this.where();
    let y = 6;
    if (w.name) { ui.hudLocation(6, y, w.name, w.sub); y += 28; }
    const time = st.time || { day: 1, hour: 12 };
    ui.hudClock(6 - Math.round(this.hideK * 100), y, { day: time.day, time: time.hour, weather: safeWeather(time) });
    y += 30;
    const obj = (app.story && app.story.objective) || (app.quests && app.quests.objective && app.quests.objective());
    if (obj && !busy) ui.objective(6, y, obj, { maxW: narrow ? W - 12 : Math.min(240, W - 140) });
    // top-right: menu button + money
    const mb = 22;
    if (ui.iconButton(W - mb - 5, 5, mb, 'menu', { color: T.amber })) this.openMenu('party', ui);
    if (!ui.dialog && !ui.modal && (ui.key('Escape') || ui.key('Tab'))) this.openMenu('party', ui);
    ui.hudMoney(W - mb - 10, 8, st.money || 0, { align: 'right' });
    // bottom-right: minimap; bottom-left: party
    const mmW = narrow ? 58 : 78, mmH = narrow ? 50 : 62, mmX = W - mmW - 6, mmY = H - mmH - 6 + off;
    const world = app.world;
    ui.minimap(mmX, mmY, mmW, mmH, world && world.drawMinimap ? (u, x, yy, ww, hh) => world.drawMinimap(u, x, yy, ww, hh) : placeholderMap, { player: !(world && world.drawMinimap) });
    const party = this.party();
    if (party.length) ui.partyBar(6, H - 34 + off, party, { maxW: mmX - 12 });
    // centred title card for a new area
    if (this.card) this.drawCard(ui, dt);
  }
  drawCard(ui, dt) {
    const c = this.card; c.t += dt;
    const dur = 2.8, W = ui.w, s = ui.s;
    if (c.t > dur) { this.card = null; return; }
    const kin = easeOut(c.t / 0.5), kout = clamp01((dur - c.t) / 0.4), k = Math.min(kin, kout);
    const big = ui.tw(c.name) * 2 + 40 < W, tw = big ? ui.tw(c.name) * 2 : ui.tw(c.name, { bold: true }), cy = Math.round(ui.h * 0.2);
    const half = Math.round((tw / 2 + 30) * k), cx = W >> 1;
    // gold rules growing from the centre with gems at their ends
    for (let i = -half; i <= half; i++) { const d = Math.abs(i) / Math.max(1, half); s.px(cx + i, cy - 4, mx(T.amberL, T.amber2, d)); s.px(cx + i, cy + (big ? 20 : 13), mx(T.amber, T.coral2, d)); }
    gem(s, cx - half, cy - 4, T.cyan, 2); gem(s, cx + half, cy - 4, T.cyan, 2);
    ui.clip(cx - half, cy - 2, half * 2 + 1, big ? 30 : 24, () => {
      if (big) { ui.text(c.name, cx + 1, cy + 2, '#05030a', { align: 'center', scale: 2 }); ui.text(c.name, cx, cy, null, { align: 'center', scale: 2, outline: T.ink, grad: ['#ffffff', T.amberL, T.amber] }); }
      else ui.text(c.name, cx, cy + 1, null, { align: 'center', bold: true, outline: T.ink, grad: ['#ffffff', T.amberL] });
      if (c.sub) ui.text(c.sub.toUpperCase(), cx, cy + (big ? 23 : 16), T.cyan, { align: 'center', mini: true, outline: T.ink });
    });
    if (c.t < 0.9) sparkle(s, cx + half - 2, cy - 7, T.amberL, 1 - c.t / 0.9);
  }
  // ------------------------------------------------------------------ pause menu (a modal over everything)
  openMenu(tab = 'party', ui = this.ui || this.app.ui) {
    if (this.menu || !ui) return;
    const sel = Math.max(0, MENU.findIndex((m) => m.id === tab));
    this.menu = { sel, view: null, t: 0, lp: null, opt: 0 };
    if (this.app.keysDown) this.app.keysDown = {};          // stop walking
    this.sfx('phone_open');
    this.modal = ui.openModal({ capture: true, draw: (u, dt, live) => this.drawPauseMenu(u, dt, live), onClose: () => { this.menu = null; this.modal = null; } });
  }
  closeMenu(ui = this.ui || this.app.ui) { if (!this.menu) return; this.sfx('phone_close'); if (ui && this.modal) ui.closeModal(this.modal); else this.menu = null; }
  sfx(id) { const a = this.app.audio; if (a && a.sfx) a.sfx(id); }
  activate(id, ui) {
    const app = this.app, M = this.menu;
    if (id === 'close') return this.closeMenu(ui);
    if (id === 'map') { this.closeMenu(ui); if (app.phone && app.phone.toggle) app.phone.toggle(); return; }
    if (id === 'save') { if (app.save) app.save(); ui.toast('Game saved', { icon: 'check', color: T.green }); this.sfx('ui_confirm'); M.saved = this.t; return; }
    M.view = id; this.sfx('ui_tap');
  }
  drawPauseMenu(ui, dt, live = true) {
    const M = this.menu; if (!M) return;
    M.t += dt; this.ui = ui;
    const W = ui.w, H = ui.h, s = ui.s, narrow = W < 360, k = easeOut(M.t * 4.5);
    ui.fade(0.6 * k, '#0a0716');
    // input
    if (live) {
      const n = MENU.length;
      if (ui.key('Escape') || ui.key('Tab')) { if (narrow && M.view) M.view = null; else return this.closeMenu(ui); }
      if (!(narrow && M.view)) {
        if (ui.key('ArrowUp') || ui.key('w')) { M.sel = (M.sel + n - 1) % n; this.sfx('ui_tap'); if (!narrow) M.view = null; }
        if (ui.key('ArrowDown') || ui.key('s')) { M.sel = (M.sel + 1) % n; this.sfx('ui_tap'); if (!narrow) M.view = null; }
        if (ui.key('Enter') || ui.key(' ') || ui.key('e')) this.activate(MENU[M.sel].id, ui);
      }
      if (!this.menu) return;
    }
    // list panel
    const lw = narrow ? W - 16 : 132, lx = 8 - Math.round((1 - k) * 60), ly = 8, rowH = 22;
    const lh = narrow && M.view ? 0 : Math.min(H - 16, 44 + MENU.length * rowH + 22);
    if (!(narrow && M.view)) {
      ui.panel(lx, ly, lw, lh, { ornate: true, dots: true, gem: T.amber });
      ui.banner(lx + 6, ly + 8, 'MENU', { icon: 'star', color: T.amber, chev: !narrow || true });
      const moved = !M.lp || M.lp[0] !== ui.ptr.x || M.lp[1] !== ui.ptr.y; M.lp = [ui.ptr.x, ui.ptr.y];
      MENU.forEach((it, i) => {
        const ry = ly + 30 + i * rowH, rx = lx + 6, rw = lw - 12, on = M.sel === i, hit = live && ui.inside(rx, ry, rw, rowH - 2);
        if (hit && moved && M.sel !== i) { M.sel = i; if (!narrow) M.view = null; }
        if (on) {
          for (let j = 0; j < rowH - 2; j++) hgradRun(s, rx, ry + j, rw, j === 0 ? [mx(T.panel, it.color, 0.7), T.panel] : j === rowH - 3 ? [sh(mx(T.panel, it.color, 0.3), -0.5), T.panel] : [mx(T.panel, it.color, 0.38), mx(T.panel, it.color, 0.12), T.panel]);
          tri(s, rx + 2 + Math.round(Math.abs(Math.sin(M.t * 6)) * 2), ry + 7, 'right', 3, it.color);
        }
        ball(s, rx + 18, ry + 10, 8, on ? it.color : '#3a3058');
        ui.bigIcon(it.icon, rx + 12, ry + 4, null, { dim: on ? 0 : 0.15, shadow: false });
        ui.text(it.label, rx + 31, ry + 7, on ? '#ffffff' : T.dim, { bold: on, shadow: T.ink });
        if (hit && ui.ptr.released) { ui.ptr.released = false; M.sel = i; this.activate(it.id, ui); }
      });
      if (!this.menu) return;
      // footer: player + money + play info
      const st = this.app.state || {}, fy = ly + lh - 17;
      s.hline(lx + 8, lx + lw - 9, fy - 3, '#3a3058');
      ui.text((st.player && st.player.name) || 'You', lx + 10, fy + 1, T.text, { shadow: T.ink });
      ui.bigIcon('coin', lx + lw - 20 - ui.tw(fmtNum(st.money || 0), { mini: true }), fy - 2, null, { shadow: false });
      ui.text(fmtNum(st.money || 0), lx + lw - 9, fy + 2, T.amber, { mini: true, align: 'right' });
    }
    // content panel
    if (!narrow || M.view) {
      const it = MENU[M.sel], cx = narrow ? 8 : lx + lw + 6 + Math.round((1 - k) * 40), cy = 8, cw = narrow ? W - 16 : W - cx - 8, ch = H - 16;
      ui.panel(cx, cy, cw, ch, { dots: false, fill: '#262038' });
      ui.banner(cx + 6, cy + 8, it.label.toUpperCase(), { icon: it.icon === 'party' ? 'team' : it.icon === 'cross' ? 'cross' : it.icon, color: it.color });
      if (narrow && ui.button(cx + cw - 46, cy + 7, 40, 15, 'Back', { modal: true, color: T.dim, icon: 'back' })) M.view = null;
      const ax = cx + 10, ay = cy + 30, aw = cw - 20, ah = ch - 40;
      ({ party: () => this.panelParty(ui, ax, ay, aw, ah), bag: () => this.panelBag(ui, ax, ay, aw, ah), map: () => this.panelMap(ui, ax, ay, aw, ah), save: () => this.panelSave(ui, ax, ay, aw, ah), options: () => this.panelOptions(ui, ax, ay, aw, ah, live), close: () => this.panelClose(ui, ax, ay, aw, ah) })[it.id]();
      if (!narrow && H - 16 > 200) { const hy = cy + ch - 18; let hx = cx + 10; hx += ui.keycap(hx, hy, '↑') + 1; hx += ui.keycap(hx, hy, '↓') + 3; ui.text('SELECT', hx, hy + 4, T.textD, { mini: true }); hx += 30; hx += ui.keycap(hx, hy, 'Enter') + 3; ui.text('OPEN', hx, hy + 4, T.textD, { mini: true }); hx += 24; hx += ui.keycap(hx, hy, 'Esc') + 3; ui.text('CLOSE', hx, hy + 4, T.textD, { mini: true }); }
    }
  }
  panelParty(ui, x, y, w, h) {
    const party = this.party(), s = ui.s;
    if (!party.length) { ui.text('No Tokonmon yet.', x + 4, y + 6, T.dim, { shadow: T.ink }); return; }
    const rh = Math.min(30, Math.floor((h - 20) / Math.max(1, party.length)));
    party.forEach((m, i) => {
      const ry = y + i * (rh + 2);
      ui.panel(x, ry, w, rh, { fill: i === 0 ? mx('#2b2244', T.amber, 0.08) : '#2b2244', rivets: false, edge: i === 0 ? mx(T.edge, T.amber, 0.5) : T.edge, thin: rh < 22 });
      const ex = x + 14, ey = ry + (rh >> 1);
      ball(s, ex, ey, Math.min(9, (rh >> 1) - 3), m.fainted ? '#5a5478' : m.color);
      ringPx(s, ex, ey, Math.min(9, (rh >> 1) - 3) - 2, mx(m.color, '#ffffff', 0.3));
      ui.text(m.name[0].toUpperCase(), ex + 1, ey - 3, '#ffffff', { align: 'center', bold: true, outline: sh(m.color, -1.8) });
      ui.text(m.name, x + 28, ry + 5, '#ffffff', { bold: true, shadow: T.ink });
      ui.text('LV' + m.level, x + 32 + ui.tw(m.name, { bold: true }), ry + 6, T.amber, { mini: true });
      if (m.elem) { const el = ELEMENTS[m.elem], lab = (el ? el.name : m.elem).toUpperCase(), lw = ui.tw(lab, { mini: true }) + 6, lx = x + w - lw - 6; ui.rrect(lx, ry + 4, lw, 9, T.ink, 2); ui.rrect(lx + 1, ry + 5, lw - 2, 7, sh(m.color, -0.6), 1); ui.text(lab, lx + 3, ry + 6, '#ffffff', { mini: true }); }
      if (rh >= 24) {
        const bw = Math.max(30, w - 110);
        ui.text('HP', x + 28, ry + rh - 10, T.textD, { mini: true });
        ui.bar(x + 38, ry + rh - 10, bw, 4, m.maxHp ? m.hp / m.maxHp : m.hp, { seg: 5, id: 'menu-party' + i });
        ui.text(m.fainted ? 'FAINTED' : `${m.hp}/${m.maxHp}`, x + 42 + bw, ry + rh - 10, m.fainted ? T.red : T.dim, { mini: true });
      }
    });
  }
  panelBag(ui, x, y, w, h) {
    const bag = (this.app.state && this.app.state.bag) || {}, ids = Object.keys(bag).filter((id) => bag[id] > 0);
    if (!ids.length) { ui.bigIcon('bag', x + (w >> 1) - 6, y + 20, null); ui.text('Your bag is empty.', x + (w >> 1), y + 38, T.dim, { align: 'center', shadow: T.ink }); return; }
    const cols = w >= 220 ? 2 : 1, cw = Math.floor((w - (cols - 1) * 4) / cols), rh = 22;
    ids.slice(0, Math.floor((h - 20) / (rh + 3)) * cols).forEach((id, i) => {
      const it = ITEMS[id] || { name: id }, cx = x + (i % cols) * (cw + 4), cy = y + Math.floor(i / cols) * (rh + 3);
      ui.panel(cx, cy, cw, rh, { fill: '#2b2244', rivets: false, thin: true });
      ui.bigIcon(ITEM_ICON[it.kind] || 'bag', cx + 4, cy + 5, null, { shadow: false });
      let nm = it.name || id; while (nm.length > 2 && ui.tw(nm) > cw - 44) nm = nm.slice(0, -1);
      ui.text(nm, cx + 20, cy + 8, T.text, { shadow: T.ink });
      ui.text('×' + bag[id], cx + cw - 6, cy + 8, T.amber, { align: 'right', shadow: T.ink });
    });
  }
  panelMap(ui, x, y, w, h) {
    const where = this.where();
    ui.text('You are in', x + 4, y + 4, T.dim, { mini: true });
    ui.text(where.name || '—', x + 4, y + 12, '#ffffff', { bold: true, shadow: T.ink });
    if (where.sub) ui.text(where.sub.toUpperCase(), x + 4, y + 22, T.cyan, { mini: true });
    const mw = Math.min(w - 8, 150), mh = Math.min(h - 70, 80);
    if (mh > 30) { const world = this.app.world; ui.minimap(x + 4, y + 32, mw, mh, world && world.drawMinimap ? (u, a, b2, c, d) => world.drawMinimap(u, a, b2, c, d) : placeholderMap, { player: !(world && world.drawMinimap) }); }
    if (ui.button(x + 4, y + h - 22, Math.min(w - 8, 120), 18, 'Open map', { modal: true, icon: 'map', color: T.cyan })) this.activate('map', ui);
  }
  panelSave(ui, x, y, w, h) {
    const st = this.app.state || {}, t = st.time || { day: 1, hour: 12 };
    const rows = [['Player', (st.player && st.player.name) || '—'], ['Day', `${t.day}`], ['Party', `${(st.party || []).length} Tokonmon`], ['Money', fmtNum(st.money || 0)]];
    rows.forEach(([k, v], i) => { ui.text(k.toUpperCase(), x + 4, y + 6 + i * 12, T.dim, { mini: true }); ui.text(v, x + 60, y + 4 + i * 12, T.text, { shadow: T.ink }); });
    const M = this.menu;
    if (M.saved != null && this.t - M.saved < 2) { ui.bigIcon('check', x + 4, y + rows.length * 12 + 10, null); ui.text('Saved!', x + 20, y + rows.length * 12 + 13, T.green, { bold: true, shadow: T.ink }); }
    if (ui.button(x + 4, y + h - 22, Math.min(w - 8, 120), 18, 'Save game', { modal: true, icon: 'check', color: T.green })) this.activate('save', ui);
  }
  panelOptions(ui, x, y, w, h, live) {
    const st = this.app.state || {}, set = st.settings || (st.settings = {});
    const opts = [['music', 'Music', T.pink, 'music'], ['sfx', 'Sound FX', T.cyan, 'bell']];
    opts.forEach(([key, label, col, icon], i) => {
      const ry = y + 4 + i * 28, v = clamp01(set[key] ?? 0.8);
      ui.bigIcon(icon, x + 2, ry + 2, null, { shadow: false });
      ui.text(label, x + 18, ry + 4, T.text, { shadow: T.ink });
      const bx = x + 18, bw = Math.max(40, w - 70);
      ui.bar(bx, ry + 15, bw, 5, v, { color: col, seg: 6, id: 'opt' + key, trail: false });
      const step = (d) => { set[key] = Math.round(clamp01(v + d) * 10) / 10; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); this.sfx('ui_tap'); };
      if (ui.button(bx + bw + 6, ry + 10, 16, 14, '-', { modal: true, color: col })) step(-0.1);
      if (ui.button(bx + bw + 24, ry + 10, 16, 14, '+', { modal: true, color: col })) step(0.1);
      if (live && ui.ptr.down && ui.inside(bx, ry + 12, bw, 10)) { set[key] = Math.round(clamp01((ui.ptr.x - bx) / bw) * 20) / 20; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); }
    });
    if (live && (ui.key('ArrowLeft') || ui.key('ArrowRight'))) { const key = 'music', d = ui.key('ArrowLeft') ? -0.1 : 0.1; set[key] = Math.round(clamp01((set[key] ?? 0.8) + d) * 10) / 10; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); }
  }
  panelClose(ui, x, y, w, h) {
    ui.text('Back to the streets.', x + 4, y + 6, T.text, { shadow: T.ink });
    ui.text('Press Esc any time to pause.', x + 4, y + 18, T.dim, { mini: true });
    if (ui.button(x + 4, y + h - 22, Math.min(w - 8, 120), 18, 'Resume', { modal: true, icon: 'play', color: T.amber })) this.closeMenu(ui);
  }
}

function safeWeather(t) { try { return weatherOf(t); } catch (e) { return 'clear'; } }
// stand-in minimap texture when the world has no drawMinimap
function placeholderMap(ui, x, y, w, h) {
  const s = ui.s;
  gradFill(s, x, y, w, h, ['#24304a', '#1a2238'], 0);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + 2) % 12 === 0 || (j + 4) % 10 === 0) s.px(x + i, y + j, '#34446a');
}
