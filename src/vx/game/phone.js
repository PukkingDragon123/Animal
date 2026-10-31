// The TokoPhone: your gadget. A chunky red handheld slides up with a boing; its home screen is a grid of
// big candy app tiles — Party, TokoBook (the collection book with live 3D Tokonmon), Bag, Map, Quests and
// Settings. Tap an app (or use the arrows + Enter), Esc / Backspace goes back, then closes.
// The Map app draws the walkable city from its minimap (tap a pin to fast-travel); away from the city it
// falls back to the San Francisco overview with its location pins.
// Kept API (app.js, story.js, hud.js): open, tab, toggle(), draw(ui, dt), plus show(tab) / close().
import { T } from '../../px/game/ui.js';
import { mx, clamp01, easeOut, boing } from '../../px/game/uikit/theme.js';
import { rr, circle, vgrad, rgba, cachedDraw, pixelCanvas } from '../../px/game/uikit/gfx.js';
import { frame, candy, ball, sparkle, tri } from '../../px/game/uikit/frame.js';
import { roundButton, fmtNum } from '../../px/game/uikit/widgets.js';
import { P } from '../../px/surface.js';
import { LOCATIONS, MAP_SIGHTS } from './locations.js';
import { SPECIES } from '../../data/species.js';
import { ITEMS } from '../../data/items.js';
import { maxHp } from '../../game/elemon.js';
import { tramOpen, rideTram } from './quests.js';
import { DexBook, elemColor, ELEM_ICON } from './dex.js';

export const APPS = [
  { id: 'party', label: 'Party', icon: 'party', color: '#ffb020' },
  { id: 'dex', label: 'TokoBook', icon: 'book', color: '#8a5cf0' },
  { id: 'bag', label: 'Bag', icon: 'bag', color: '#ff7a3a' },
  { id: 'map', label: 'Map', icon: 'map', color: '#2fbf5a' },
  { id: 'quests', label: 'Quests', icon: 'quest', color: '#2f8cff' },
  { id: 'settings', label: 'Settings', icon: 'gear', color: '#6a76a8' },
];
const TAB_ALIAS = { team: 'party', menu: 'home', options: 'settings', save: 'settings', close: 'home', collection: 'dex', book: 'dex' };
// fast-travel spots in the walkable city (same table as app.js)
const CITY_SPOTS = { chinatown: 'square', alamo: 'park', pier39: 'pier', dojo: 'dojoDoor', arena: 'arena', home: 'frontDoorOut', lab: 'labDoor' };
// an item's picture
export function itemIcon(id, it = ITEMS[id] || {}) {
  if (/ramune|soda|cola|juice/.test(id)) return 'soda';
  if (/onigiri|rice/.test(id)) return 'onigiri';
  if (/candy|konpeito|mochi/.test(id)) return 'candy';
  if (/tart|bun|takoyaki|okonomiyaki|bread|cake/.test(id)) return 'bun';
  if (/matcha|latte|tea|ice_cream|potion|tonic/.test(id)) return 'potion';
  return { food: 'bowl', disc: 'disc', gear: 'gear', key: 'star', gem: 'sparkle', capture: 'coin', boost: 'candy' }[it.kind] || 'bag';
}
// the old San Francisco overview (outside the walkable city)
const LAND = [[0.0, 0.2], [0.04, 0.14], [0.1, 0.12], [0.16, 0.135], [0.22, 0.095], [0.33, 0.1], [0.42, 0.08], [0.5, 0.085], [0.58, 0.11], [0.66, 0.095], [0.73, 0.12], [0.77, 0.19], [0.8, 0.27], [0.86, 0.33], [0.84, 0.42], [0.86, 0.5], [0.84, 0.6], [0.88, 0.72], [0.9, 0.86], [0.93, 1], [0, 1]];

export class SFPhone {
  constructor(app) { this.app = app; this.open = false; this.tab = 'home'; this.t = 0; this.appT = 0; this.sel = 0; this.book = null; this.bagSel = 0; this.mapCv = null; }
  toggle() { if (this.open) this.close(); else this.show('home'); }
  show(tab = 'home') {
    if (!this.open) { this.open = true; this.t = 0; this.sfx('phone_open'); if (this.app.keysDown) this.app.keysDown = {}; }
    this.go(tab);
  }
  close() { if (!this.open) return; this.open = false; this.sfx('phone_close'); if (this.book) this.book.release(); }
  go(tab) { tab = TAB_ALIAS[tab] || tab || 'home'; if (tab !== this.tab) { this.tab = tab; this.appT = 0; } const i = APPS.findIndex((a) => a.id === tab); if (i >= 0) this.sel = i; }
  sfx(id, o) { const a = this.app.audio; if (a && a.sfx) a.sfx(id, o); }
  // ------------------------------------------------------------------ the device
  draw(ui, dt) {
    if (this._lastOpenT !== this.t) { /* noop */ }
    if (this.tab === 'team') this.tab = 'party';
    this.t += dt; this.appT += dt;
    const W = ui.w, H = ui.h, narrow = W < H * 1.15, g = ui.g;
    const k = boing(this.t * 1.5);
    ui.fade(0.5 * clamp01(this.t * 4), T.deep);
    const dw = narrow ? W - 8 : Math.min(W - 12, Math.round(H * 1.78)), dh = narrow ? H - 8 : H - 10;
    const dx = Math.round((W - dw) / 2), dy = Math.round((H - dh) / 2 + (1 - k) * H * 0.6);
    // the body: red plastic, a thick ink outline, a glossy top, speaker dots, a hinge line
    cachedDraw(ui, 'TP' + dw + 'x' + dh + (narrow ? 'n' : ''), dx, dy, dw, dh, 5, (c) => paintBody(c, dw, dh, narrow));
    const sx = dx + (narrow ? 8 : 26), sy = dy + (narrow ? 10 : 9), sw = dw - (narrow ? 16 : 60), sh = dh - (narrow ? 48 : 18);
    // the home button (right side; bottom on narrow screens) and a back button
    const hb = narrow ? [dx + dw / 2, dy + dh - 19] : [dx + dw - 17, dy + dh / 2 + 10];
    const home = roundButton(ui, hb[0], hb[1], narrow ? 9 : 10, this.tab === 'home' ? 'close' : 'home', { color: '#ffffff', modal: true, tip: this.tab === 'home' ? 'Close' : 'Home' });
    const bb = narrow ? [dx + dw / 2 - 40, dy + dh - 19] : [dx + dw - 17, dy + dh / 2 - 22];
    const back = this.tab !== 'home' && roundButton(ui, bb[0], bb[1], 7, 'left', { color: '#ffd23a', modal: true }).clicked;
    if (home.clicked) { if (this.tab === 'home') return this.close(); this.go('home'); }
    if (back) this.go('home');
    if (ui.key('Escape') || ui.key('Backspace') || (ui.key('Tab') && this.t > 0.2)) { if (this.tab === 'home' || ui.key('Tab')) { this.close(); return; } this.go('home'); this.sfx('ui_back'); }
    // the screen
    ui.fill(T.ink); rr(g, sx - 2, sy - 2, sw + 4, sh + 4, 10); g.fill();
    ui.clip(sx, sy, sw, sh, () => {
      g.fillStyle = vgrad(g, sy, sy + sh, ['#24357a', '#1b2760', '#141c48']); ui._fs = null; g.fillRect(sx, sy, sw, sh);
      // a soft dot grid on the screen
      g.fillStyle = 'rgba(255,255,255,0.06)'; for (let yy = sy + 4; yy < sy + sh; yy += 8) for (let xx = sx + 4; xx < sx + sw; xx += 8) g.fillRect(xx, yy, 1, 1);
      this.statusBar(ui, sx, sy, sw);
      const cy = sy + 16, ch = sh - 18;
      const appK = easeOut(this.appT * 5), ox = (1 - appK) * 18;
      g.save(); g.globalAlpha = Math.max(0.05, appK); g.translate(ox, 0);
      try {
        if (this.tab === 'home') this.drawHome(ui, sx, cy, sw, ch, dt);
        else {
          const A = APPS.find((a) => a.id === this.tab) || { label: this.tab, icon: 'phone', color: T.blue };
          this.appHeader(ui, sx + 6, cy, sw - 12, A);
          const ax = sx + 6, ay = cy + 18, aw = sw - 12, ah = ch - 22;
          ({ party: () => this.drawParty(ui, ax, ay, aw, ah), dex: () => this.drawDex(ui, ax, ay, aw, ah, dt), bag: () => this.drawBag(ui, ax, ay, aw, ah), map: () => this.drawMap(ui, ax, ay, aw, ah), quests: () => this.drawQuests(ui, ax, ay, aw, ah), settings: () => this.drawSettings(ui, ax, ay, aw, ah) }[this.tab] || (() => {}))();
        }
      } finally { g.restore(); ui._fs = null; ui._font = null; }
      // screen glare
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + sw * 0.4, sy); g.lineTo(sx + sw * 0.18, sy + sh); g.lineTo(sx, sy + sh); g.closePath(); g.fill();
    }, 8);
    // anything left unclicked inside the device must not fall through to the world
    if (ui.ptr.released && ui.inside(dx, dy, dw, dh)) ui.ptr.released = false;
  }
  statusBar(ui, x, y, w) {
    const st = this.app.state || {}, t = st.time || { day: 1, hour: 12 }, h = Math.floor(t.hour), m = Math.floor((t.hour % 1) * 60);
    ui.fill('rgba(0,0,0,0.25)'); ui.g.fillRect(x, y, w, 13);
    ui.text('TokoPhone', x + 6, y + 3.5, '#ffd23a', { mini: true, bold: true });
    const right = `DAY ${t.day}  ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    let rx = x + w - 6;
    // battery
    ui.fill('#ffffff'); rr(ui.g, rx - 11, y + 3.5, 10, 6, 1.5); ui.g.fill(); ui.fill(T.green); rr(ui.g, rx - 10, y + 4.5, 7, 4, 1); ui.g.fill(); ui.fill('#ffffff'); ui.g.fillRect(rx - 1, y + 5.3, 1.2, 2.4);
    rx -= 15;
    ui.text(right, rx, y + 3.5, '#ffffff', { mini: true, bold: true, align: 'right' });
    rx -= ui.tw(right, { mini: true, bold: true }) + 8;
    const money = fmtNum(st.money || 0);
    ui.text(money, rx, y + 3.5, '#ffe28a', { mini: true, bold: true, align: 'right' });
    ui.bigIcon('coin', rx - ui.tw(money, { mini: true, bold: true }) - 11, y + 1, null, { scale: 0.85, shadow: false });
  }
  appHeader(ui, x, y, w, A) {
    candy(ui, x, y, w, 15, { color: A.color, state: 0, lip: 2, r: 7.5 });
    ui.bigIcon(A.icon, x + 4, y + 0.5, null, { shadow: false });
    ui.text(A.label, x + 20, y + 3, '#ffffff', { bold: true, outline: mx(A.color, T.ink, 0.7) });
  }
  // ------------------------------------------------------------------ home: the app grid
  drawHome(ui, x, y, w, h, dt) {
    const n = APPS.length, cols = w < 200 ? 2 : 3, rows = Math.ceil(n / cols);
    const tile = Math.min(64, Math.floor((w - 20) / cols) - 12, Math.floor((h - 12) / rows) - 18), gapX = Math.floor((w - cols * tile) / (cols + 1)), gapY = Math.max(14, Math.floor((h - rows * tile) / (rows + 1)));
    if (ui.key('ArrowRight') || ui.key('d')) this.pick((this.sel + 1) % n);
    if (ui.key('ArrowLeft') || ui.key('a')) this.pick((this.sel + n - 1) % n);
    if (ui.key('ArrowDown') || ui.key('s')) this.pick(Math.min(n - 1, this.sel + cols));
    if (ui.key('ArrowUp') || ui.key('w')) this.pick(Math.max(0, this.sel - cols));
    if (ui.key('Enter') || ui.key(' ') || ui.key('e')) { this.sfx('ui_tap'); return this.go(APPS[this.sel].id); }
    const st = this.app.state || {}, badges = { party: (st.party || []).length, bag: Object.values(st.bag || {}).filter((v) => v > 0).length, quests: this.app.quests ? this.app.quests.list().filter((q) => q.active).length : 0 };
    const g = ui.g;
    APPS.forEach((A, i) => {
      const c = i % cols, r = Math.floor(i / cols), tx = x + gapX + c * (tile + gapX), ty = y + gapY * 0.6 + r * (tile + gapY), cx = tx + tile / 2, cy = ty + tile / 2;
      const pop = boing(this.t * 1.6 - 0.15 - i * 0.07), over = ui.inside(tx, ty, tile, tile + 12), on = i === this.sel;
      if (over && (ui.ptr.x !== this._px || ui.ptr.y !== this._py)) this.sel = i;
      if (over && ui.ptr.pressed) { this.sfx('ui_tap'); this.pressT = 0; this.pressI = i; }
      const pk = this.pressI === i ? (this.pressT = (this.pressT || 0) + dt / APPS.length) : 9;
      const sq = pk < 0.7 ? Math.exp(-7 * pk) * Math.sin(pk * 26) * 0.1 : 0, s = Math.max(0.05, pop) * (on ? 1.07 : 1);
      g.save(); g.translate(cx, cy); g.scale(s + sq, s - sq); g.translate(-cx, -cy);
      if (on) { ui.fill('rgba(255,255,255,0.85)'); rr(g, tx - 3, ty - 3, tile + 6, tile + 6, 15); g.fill(); }
      candy(ui, tx, ty, tile, tile, { color: A.color, state: over && ui.ptr.down ? 2 : on ? 1 : 0, lip: 4, r: 13 });
      const isz = tile * 0.56;
      ui.bigIcon(A.icon, cx - isz / 2, ty + (tile - 4) / 2 - isz / 2, null, { scale: isz / 12 });
      const b = badges[A.id];
      if (b) { ball(ui.s, tx + tile - 4, ty + 3, 6, T.berry); ui.text(String(b), tx + tile - 3.5, ty - 0.5, '#ffffff', { mini: true, bold: true, align: 'center' }); }
      g.restore(); ui._fs = null; ui._font = null;
      ui.text(A.label, cx, ty + tile + 3, '#ffffff', { align: 'center', bold: true, outline: T.ink });
      if (over && ui.ptr.released) { ui.ptr.released = false; this.go(A.id); }
      if (on && ((this.t * 0.8) % 1) < 0.3) sparkle(ui.s, tx + tile - 6, ty + 6, '#ffffff', 1 - ((this.t * 0.8) % 1) / 0.3);
    });
    this._px = ui.ptr.x; this._py = ui.ptr.y;
  }
  pick(i) { if (i !== this.sel) { this.sel = i; this.sfx('ui_tap', { vol: 0.4, pitch: 1.3 }); } }
  // ------------------------------------------------------------------ apps
  party() {
    const st = this.app.state; if (!st || !st.party) return [];
    return st.party.map((m) => {
      const sp = SPECIES[m.species] || {}, { el, color } = elemColor(m.species);
      let mh = 0; try { mh = maxHp(m); } catch (e) { mh = 0; }
      return { id: m.species, name: m.nick || sp.name || m.species, hp: mh ? Math.round(mh * (m.hp ?? 1)) : 0, maxHp: mh, frac: m.hp ?? 1, color, level: m.level, elem: el, drip: m.drip || 1 };
    });
  }
  drawParty(ui, x, y, w, h) {
    const list = this.party(), g = ui.g;
    if (!list.length) { ui.emblem('party', x + w / 2, y + h / 2 - 8, 4); ui.text('No Tokonmon yet', x + w / 2, y + h / 2 + 22, '#ffffff', { align: 'center', bold: true }); return; }
    const cols = w > 260 ? 2 : 1, cw = (w - (cols - 1) * 6) / cols, rh = Math.min(42, (h - 4) / Math.ceil(list.length / cols) - 5);
    list.forEach((m, i) => {
      const c = i % cols, r = Math.floor(i / cols), cx = x + c * (cw + 6), cy = y + r * (rh + 5) + (1 - boing(this.appT * 1.6 - i * 0.08)) * 20;
      frame(ui, cx, cy, cw, rh, { paper: '#ffffff', r: 8, thin: true, edge: i === 0 ? T.amber : null });
      const R = Math.min(13, rh / 2 - 4), mx0 = cx + 6 + R, my = cy + rh / 2;
      ball(ui.s, mx0, my, R, m.color);
      ui.bigIcon(ELEM_ICON[m.elem] || 'star', mx0 - R * 0.6, my - R * 0.6, null, { scale: (R * 1.2) / 12, shadow: false });
      const nx = mx0 + R + 7;
      ui.text(m.name, nx, cy + 5, T.paperText, { bold: true });
      ui.text('Lv ' + m.level, cx + cw - 7, cy + 5, T.blue, { bold: true, mini: true, align: 'right' });
      if (m.drip > 1) ui.text(m.drip === 3 ? 'ULTRA DRIP' : 'DRIP', nx + ui.tw(m.name, { bold: true }) + 5, cy + 6, m.drip === 3 ? T.amber2 : T.cyan2, { mini: true, bold: true });
      const bw = cw - (nx - cx) - 48;
      ui.bar(nx, cy + rh - 11, Math.max(20, bw), 5, m.maxHp ? m.hp / m.maxHp : m.frac, { seg: 6, id: 'tp-party' + i });
      ui.text(m.maxHp ? `${m.hp}/${m.maxHp}` : '', cx + cw - 7, cy + rh - 12, T.paperDim, { mini: true, bold: true, align: 'right' });
      if (ui.inside(cx, cy, cw, rh) && ui.ptr.released) { ui.ptr.released = false; this.go('dex'); const b = this.dexBook(); const k = b.list.indexOf(m.id); if (k >= 0) b.select(k); }
    });
    void g;
  }
  dexBook() { return this.book || (this.book = new DexBook(this.app)); }
  drawDex(ui, x, y, w, h, dt) { this.dexBook().draw(ui, x, y, w, h, dt, true); }
  drawBag(ui, x, y, w, h) {
    const bag = (this.app.state && this.app.state.bag) || {}, ids = Object.keys(bag).filter((id) => bag[id] > 0);
    if (!ids.length) { ui.emblem('bag', x + w / 2, y + h / 2 - 8, 4); ui.text('Your bag is empty', x + w / 2, y + h / 2 + 22, '#ffffff', { align: 'center', bold: true }); return; }
    const ts = 30, gap = 7, cols = Math.max(1, Math.floor((w + gap) / (ts + gap))), maxRows = Math.max(1, Math.floor((h - 28 + gap) / (ts + gap)));
    const list = ids.slice(0, cols * maxRows), gx = x + (w - (cols * (ts + gap) - gap)) / 2;
    if (ui.key('ArrowRight') || ui.key('d')) this.bagSel++; if (ui.key('ArrowLeft') || ui.key('a')) this.bagSel--;
    if (ui.key('ArrowDown') || ui.key('s')) this.bagSel += cols; if (ui.key('ArrowUp') || ui.key('w')) this.bagSel -= cols;
    this.bagSel = Math.max(0, Math.min(list.length - 1, this.bagSel));
    list.forEach((id, i) => {
      const it = ITEMS[id] || { name: id }, cx = gx + (i % cols) * (ts + gap), cy = y + Math.floor(i / cols) * (ts + gap) + (1 - boing(this.appT * 1.6 - i * 0.03)) * 12;
      const over = ui.inside(cx, cy, ts, ts); if (over && ui.ptr.pressed) { this.bagSel = i; this.sfx('ui_tap', { vol: 0.5 }); }
      const on = this.bagSel === i;
      candy(ui, cx, cy - (on ? 1.5 : 0), ts, ts, { color: on ? '#fff3b8' : '#ffffff', state: over && ui.ptr.down ? 2 : on ? 1 : 0, lip: 3, r: 7, active: false });
      ui.bigIcon(itemIcon(id, it), cx + 5, cy + 3.5 - (on ? 1.5 : 0), null, { scale: 20 / 12 });
      const cnt = '×' + bag[id], cw = ui.tw(cnt, { mini: true, bold: true }) + 6;
      ui.fill(T.ink); rr(ui.g, cx + ts - cw + 1, cy + ts - 10, cw, 9, 4.5); ui.g.fill(); ui.text(cnt, cx + ts - cw + 4, cy + ts - 8, '#ffffff', { mini: true, bold: true });
      if (on) sparkle(ui.s, cx + 4, cy + 3, T.amber, ((this.t * 1.3) % 1) < 0.4 ? 1 : 0);
    });
    const sel = ITEMS[list[this.bagSel]] || { name: list[this.bagSel] };
    frame(ui, x, y + h - 22, w, 22, { paper: '#ffffff', r: 8, thin: true });
    ui.text(sel.name || list[this.bagSel], x + 8, y + h - 16, T.paperText, { bold: true });
    if (sel.price) ui.text(fmtNum(sel.price), x + w - 8, y + h - 15.5, T.amber2, { bold: true, align: 'right', mini: true });
  }
  drawQuests(ui, x, y, w, h) {
    const list = this.app.quests ? this.app.quests.list() : [];
    if (!list.length) { ui.emblem('quest', x + w / 2, y + h / 2 - 8, 4); ui.text('No quests yet', x + w / 2, y + h / 2 + 22, '#ffffff', { align: 'center', bold: true }); return; }
    let yy = y;
    list.forEach((q, i) => {
      if (yy > y + h - 26) return;
      const step = q.active ? (q.steps && q.steps[q.step]) || '' : 'Complete!', cy = yy + (1 - boing(this.appT * 1.6 - i * 0.08)) * 16;
      frame(ui, x, cy, w, 26, { paper: q.active ? '#ffffff' : '#e8ecf8', r: 8, thin: true, edge: q.main ? T.amber : null });
      ball(ui.s, x + 12, cy + 13, 7, q.active ? (q.main ? T.amber : T.cyan) : T.green);
      ui.bigIcon(q.active ? (q.main ? 'star' : 'talk') : 'check', x + 6.5, cy + 7.5, null, { scale: 11 / 12, shadow: false });
      ui.text(q.title || q.id, x + 24, cy + 4, T.paperText, { bold: true });
      const line = ui.wrap(step, w - 30, { mini: true })[0] || '';
      ui.text(line, x + 24, cy + 15.5, q.active ? T.paperDim : T.green, { mini: true, bold: true });
      yy += 30;
    });
  }
  drawSettings(ui, x, y, w, h) {
    const st = this.app.state || {}, set = st.settings || (st.settings = {});
    const step = (key, d) => { set[key] = Math.round(clamp01((set[key] ?? 0.8) + d) * 10) / 10; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); };
    [['music', 'Music', 'music', T.pink, '-', '='], ['sfx', 'Sound', 'bell', T.cyan, '[', ']']].forEach(([key, label, icon, col, kDn, kUp], i) => {
      const ry = y + 4 + i * 34, v = clamp01(set[key] ?? 0.8);
      frame(ui, x, ry, w, 30, { paper: '#ffffff', r: 8, thin: true });
      ui.bigIcon(icon, x + 6, ry + 9, null, { shadow: false });
      ui.text(label, x + 22, ry + 11, T.paperText, { bold: true });
      const bx = x + 80, bw = Math.max(40, w - 132);
      if (ui.button(x + 58, ry + 7, 18, 16, '', { color: col, icon: 'left', hotkey: kDn })) step(key, -0.1);
      ui.bar(bx, ry + 12, bw, 7, v, { color: col, seg: 8, id: 'tp-opt' + key, trail: false });
      if (ui.button(bx + bw + 6, ry + 7, 18, 16, '', { color: col, icon: 'right', hotkey: kUp })) step(key, 0.1);
      if (ui.ptr.down && ui.inside(bx, ry + 6, bw, 18)) { set[key] = Math.round(clamp01((ui.ptr.x - bx) / bw) * 20) / 20; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); }
    });
    const by = y + 76, bw = Math.min(120, (w - 10) / 2);
    if (ui.button(x + w / 2 - bw - 5, by, bw, 22, 'Save', { color: T.green, icon: 'save' })) { if (this.app.save) this.app.save(); ui.toast('Saved!', { icon: 'check', color: T.green }); this.savedT = this.t; }
    if (ui.button(x + w / 2 + 5, by, bw, 22, 'Resume', { color: T.blue, icon: 'play' })) this.close();
    if (this.savedT != null && this.t - this.savedT < 1.2) sparkle(ui.s, x + w / 2 - bw / 2 - 5, by - 2, T.amber, 1 - (this.t - this.savedT) / 1.2);
  }
  // ------------------------------------------------------------------ map
  drawMap(ui, x, y, w, h) {
    const world = this.app.world, city = world && world.city;
    frame(ui, x, y, w, h, { fill: '#2a6ab0', r: 8, thin: true, shadow: false });
    if (city && city.c && city.c.minimap) return this.drawCityMap(ui, x + 3, y + 3, w - 6, h - 6, city);
    this.drawSFMap(ui, x + 3, y + 3, w - 6, h - 6);
  }
  cityCanvas(mm) {
    if (this.mapCv && this.mapCv.src === mm) return this.mapCv.cv;
    const cv = pixelCanvas(mm.w, mm.h, (d) => { const cache = new Map(); for (let i = 0; i < mm.col.length; i++) { const c = mm.col[i]; let v = cache.get(c); if (v === undefined) { v = P(c); cache.set(c, v); } d[i] = v; } });
    this.mapCv = { src: mm, cv }; return cv;
  }
  drawCityMap(ui, x, y, w, h, city) {
    const mm = city.c.minimap, cv = this.cityCanvas(mm), g = ui.g, app = this.app, world = app.world;
    const k = Math.min(w / mm.w, h / mm.h), mw = mm.w * k, mh = mm.h * k, ox = x + (w - mw) / 2, oy = y + (h - mh) / 2;
    ui.clip(x, y, w, h, () => {
      g.fillStyle = '#2a6ab0'; ui._fs = null; g.fillRect(x, y, w, h);
      const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(cv, ox, oy, mw, mh); g.imageSmoothingEnabled = sm;
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(ox, oy, mw, mh);
    }, 6);
    const toMap = (wx, wz) => [ox + wx * k, oy + wz * k];
    // district labels
    for (const z of (city.c.zones || [])) {
      const [x0, z0, x1, z1] = z.rect; if ((x1 - x0) * (z1 - z0) < 900) continue;
      const [lx, ly] = toMap((x0 + x1) / 2, (z0 + z1) / 2);
      ui.text(String(z.label).toUpperCase(), lx, ly - 2, '#ffffff', { align: 'center', mini: true, bold: true, outline: T.ink });
    }
    // fast-travel pins
    const s = app.state;
    for (const [id, spot] of Object.entries(CITY_SPOTS)) {
      if (id !== 'home' && !(s.unlocks && s.unlocks.locations.includes(id))) continue;
      const p = world.spot(spot); if (!p) continue;
      const [px, py] = toMap(p[0], p[1]), bob = Math.sin(this.t * 4 + px) * 1.2, L = LOCATIONS[id];
      const over = ui.inside(px - 7, py - 16, 14, 16);
      ui.bigIcon(id === 'home' ? 'home' : 'pin', px - 6, py - 13 + bob - (over ? 1.5 : 0), null, { scale: over ? 1.15 : 1 });
      if (over) { const nm = (L && L.name) || id; const lw = ui.tw(nm, { bold: true, mini: true }) + 10; frame(ui, px - lw / 2, py - 28, lw, 12, { fill: T.ink, edge: '#3a3570', thin: true, r: 6, shadow: false }); ui.text(nm, px, py - 25, '#ffffff', { mini: true, bold: true, align: 'center' }); }
      if (over && ui.ptr.pressed) this.sfx('ui_tap');
      if (over && ui.ptr.released) { ui.ptr.released = false; this.close(); app.story.run(() => app.travel(id)); return; }
    }
    // you are here
    const pl = world.player;
    if (pl) {
      const q = pl.g.position, [px, py] = toMap(q.x, q.z);
      const pulse = (this.t * 1.5) % 1; g.strokeStyle = rgba('#ffffff', 1 - pulse); g.lineWidth = 1.2; circle(g, px, py, 3 + pulse * 8); g.stroke();
      g.save(); g.translate(px, py); g.rotate(Math.PI - pl.yaw); ui.fill(T.ink); g.beginPath(); g.moveTo(0, -6); g.lineTo(4.5, 4.5); g.lineTo(0, 2.5); g.lineTo(-4.5, 4.5); g.closePath(); g.fill(); ui.fill(T.red); g.beginPath(); g.moveTo(0, -4.4); g.lineTo(3, 3.2); g.lineTo(0, 1.6); g.lineTo(-3, 3.2); g.closePath(); g.fill(); g.restore(); ui._fs = null;
    }
    const g2 = app.story && app.story.goal;
    if (g2) { const [gx, gy] = toMap(g2.x, g2.z); tri(ui.s, gx - 3, gy - 10 + Math.abs(Math.sin(this.t * 5)) * 2, 'down', 3, T.amber); }
  }
  drawSFMap(ui, x0, y0, w, h) {
    const g = ui.g, M = (u, v) => [x0 + u * w, y0 + v * h];
    g.fillStyle = vgrad(g, y0, y0 + h, ['#3a8ad8', '#2a6ab0']); ui._fs = null; g.fillRect(x0, y0, w, h);
    ui.s.poly(LAND.map(([u, v]) => M(u, v)), '#f2e6c4');
    g.strokeStyle = 'rgba(180,160,120,0.5)'; g.lineWidth = 0.6; g.beginPath();
    for (let k = 1; k < 18; k++) { const [gx] = M(k / 18, 0); g.moveTo(gx, y0 + h * 0.14); g.lineTo(gx, y0 + h); }
    for (let k = 3; k < 24; k++) { const [, gy] = M(0, k / 24); g.moveTo(x0 + 2, gy); g.lineTo(x0 + w * 0.86, gy); }
    g.stroke();
    const park = (u0, v0, u1, v1) => { const [a, b] = M(u0, v0), [c, d] = M(u1, v1); ui.rrect(a, b, c - a, d - b, '#7ad85a', 2); };
    park(0.02, 0.43, 0.36, 0.5); park(0.1, 0.12, 0.24, 0.24); park(0.6, 0.53, 0.66, 0.56); park(0.41, 0.6, 0.45, 0.64);
    { const [a, b] = M(0.13, 0.115), [c, d] = M(0.07, 0.03); g.strokeStyle = '#ff5a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    for (const sg of MAP_SIGHTS) { const [a, b] = M(...sg.at); ui.rrect(a - 1.5, b - 1.5, 3, 3, '#8a8eaa', 1); }
    const s = this.app.state, here = this.app.world && this.app.world.id;
    for (const [id, L] of Object.entries(LOCATIONS)) {
      if (L.hidden || !L.map || !(s.unlocks.locations.includes(id) || id === here)) continue;
      const [a, b] = M(...L.map), bob = id === here ? 0 : Math.sin(this.t * 4 + a) * 1.2;
      ui.bigIcon(id === here ? 'home' : 'pin', a - 6, b - 13 + bob, null, {});
      const lw = ui.tw(L.name, { mini: true, bold: true }) + 10;
      if (ui.button(Math.max(x0, Math.min(x0 + w - lw, a - lw / 2)), b + 1, lw, 11, L.name, { mini: true, color: id === here ? T.cyan : T.blue }) && id !== here) { this.close(); this.app.story.run(() => (tramOpen(this.app, id) ? rideTram(this.app, id) : this.app.travel(id))); }
    }
  }
}
export { SFPhone as TokoPhone };

// the device body (painted once into a sprite)
function paintBody(g, w, h, narrow) {
  const css = (c) => c;
  g.fillStyle = 'rgba(10,8,32,0.4)'; rr(g, 0, 3, w, h, 18); g.fill();
  g.fillStyle = css(T.ink); rr(g, 0, 0, w, h, 18); g.fill();
  g.fillStyle = vgrad(g, 1.5, h - 1.5, [T.phoneL, T.phone, T.phone, T.phoneD]); rr(g, 1.8, 1.8, w - 3.6, h - 3.6, 16.5); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.28)'; rr(g, 6, 3.2, w - 12, Math.min(16, h * 0.1), 8); g.fill();
  g.strokeStyle = 'rgba(28,24,56,0.35)'; g.lineWidth = 1; rr(g, 4, 4, w - 8, h - 8, 14); g.stroke();
  // speaker dots + status LEDs
  g.fillStyle = 'rgba(28,24,56,0.45)';
  if (narrow) { for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w / 2 - 8 + i * 4, 5.5, 0.9, 0, 6.283); g.fill(); } }
  else { for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(11 + i * 4, h / 2 - 8 + j * 5, 1, 0, 6.283); g.fill(); } }
  const led = (lx, ly, c) => { g.fillStyle = T.ink; g.beginPath(); g.arc(lx, ly, 2, 0, 6.283); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(lx, ly, 1.3, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(lx - 0.5, ly - 0.5, 0.45, 0, 6.283); g.fill(); };
  if (narrow) { led(w - 14, h - 19, '#5fdc4a'); led(w - 22, h - 19, '#ffd23a'); }
  else { led(13, 16, '#5fdc4a'); led(13, 23, '#ffd23a'); }
  // the "TOKO" badge
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = '800 6px ' + '"TokoRound", "Baloo 2", Arial, sans-serif'; g.textAlign = 'center';
  if (narrow) g.fillText('TOKOPHONE', w / 2 + 34, h - 17); else { g.save(); g.translate(w - 17, h - 14); g.fillText('TOKO', 0, 0); g.restore(); }
  void mx;
}
