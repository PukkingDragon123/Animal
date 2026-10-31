// The TokoPhone: your gadget, in the pixel-GUI style. A chunky red pixel handheld slides up with a boing;
// its home screen is a cream panel of app icons standing on wooden plinths — Party, TokoBook (the
// collection book with live 3D Tokonmon), Bag, Map, Quests and Settings. Tap an app (or arrows + Enter),
// Esc / Backspace goes back, then closes. The Map app shows the walkable city (tap a pin to fast-travel);
// away from the city it falls back to the San Francisco overview.
// Kept API (app.js, story.js, hud.js): open, tab, toggle(), draw(ui, dt), plus show(tab) / close().
import { T } from '../../px/game/ui.js';
import { mx, clamp01, easeOut, boing } from '../../px/game/uikit/theme.js';
import { pixelCanvas, fillDisc } from '../../px/game/uikit/gfx.js';
import { frame, knob, ball, sparkle, tri, gem, woodRing } from '../../px/game/uikit/frame.js';
import { roundButton, plinthButton, fmtNum, badge } from '../../px/game/uikit/widgets.js';
import { P } from '../../px/surface.js';
import { LOCATIONS, MAP_SIGHTS } from './locations.js';
import { SPECIES } from '../../data/species.js';
import { ITEMS } from '../../data/items.js';
import { maxHp } from '../../game/elemon.js';
import { tramOpen, rideTram } from './quests.js';
import { DexBook, elemColor, ELEM_ICON } from './dex.js';

const R = Math.round;
export const APPS = [
  { id: 'party', label: 'Party', icon: 'party' },
  { id: 'dex', label: 'TokoBook', icon: 'book' },
  { id: 'bag', label: 'Bag', icon: 'bag' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'quests', label: 'Quests', icon: 'quest' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];
const TAB_ALIAS = { team: 'party', menu: 'home', options: 'settings', save: 'settings', close: 'home', collection: 'dex', book: 'dex' };
const CITY_SPOTS = { chinatown: 'square', alamo: 'park', pier39: 'pier', dojo: 'dojoDoor', arena: 'arena', home: 'frontDoorOut', lab: 'labDoor', cave: 'caveMouth' };   // [cave] pin once you've been in
// an item's picture
export function itemIcon(id, it = ITEMS[id] || {}) {
  if (/ramune|soda|cola|juice/.test(id)) return 'soda';
  if (/onigiri|rice/.test(id)) return 'onigiri';
  if (/candy|konpeito|mochi/.test(id)) return 'candy';
  if (/tart|bun|takoyaki|okonomiyaki|bread|cake/.test(id)) return 'bun';
  if (/matcha|latte|tea|ice_cream|potion|tonic/.test(id)) return 'potion';
  return { food: 'bowl', disc: 'disc', gear: 'gear', key: 'star', gem: 'sparkle', capture: 'coin', boost: 'candy' }[it.kind] || 'bag';
}
const LAND = [[0.0, 0.2], [0.04, 0.14], [0.1, 0.12], [0.16, 0.135], [0.22, 0.095], [0.33, 0.1], [0.42, 0.08], [0.5, 0.085], [0.58, 0.11], [0.66, 0.095], [0.73, 0.12], [0.77, 0.19], [0.8, 0.27], [0.86, 0.33], [0.84, 0.42], [0.86, 0.5], [0.84, 0.6], [0.88, 0.72], [0.9, 0.86], [0.93, 1], [0, 1]];

export class SFPhone {
  constructor(app) { this.app = app; this.open = false; this.tab = 'home'; this.t = 0; this.appT = 0; this.sel = 0; this.book = null; this.bagSel = 0; this.mapCv = null; }
  toggle() { if (this.open) this.close(); else this.show('home'); }
  show(tab = 'home') { if (!this.open) { this.open = true; this.t = 0; this.sfx('phone_open'); if (this.app.keysDown) this.app.keysDown = {}; } this.go(tab); }
  close() { if (!this.open) return; this.open = false; this.sfx('phone_close'); if (this.book) this.book.release(); }
  go(tab) { tab = TAB_ALIAS[tab] || tab || 'home'; if (tab !== this.tab) { this.tab = tab; this.appT = 0; } const i = APPS.findIndex((a) => a.id === tab); if (i >= 0) this.sel = i; }
  sfx(id, o) { const a = this.app.audio; if (a && a.sfx) a.sfx(id, o); }
  // ------------------------------------------------------------------ the device
  draw(ui, dt) {
    if (this.tab === 'team') this.tab = 'party';
    this.t += dt; this.appT += dt;
    const W = ui.w, H = ui.h, narrow = W < H * 1.15, k = boing(this.t * 1.5);
    ui.fade(0.55 * clamp01(this.t * 4), T.deep);
    const dw = narrow ? W - 8 : Math.min(W - 40, R(H * 1.62)), dh = narrow ? H - 8 : H - 24;
    const dx = R((W - dw) / 2), dy = R((H - dh) / 2 + (1 - k) * H * 0.6);
    // the body: red pixel plastic in a dark outline, speaker holes, LEDs
    frame(ui, dx, dy, dw, dh, { edge: T.phone, fill: T.phone, r: 8, big: true, brackets: false, shadowA: 0.45 });
    const sx = dx + (narrow ? 8 : 30), sy = dy + (narrow ? 10 : 10), sw = dw - (narrow ? 16 : 64), sh = dh - (narrow ? 46 : 20);
    if (!narrow) { for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) ui.rect(dx + 11 + i * 5, dy + R(dh / 2) - 10 + j * 6, 2, 2, T.phoneD); for (const [ly, c] of [[14, T.green], [22, T.amber]]) { ball(ui.s, dx + 14, dy + ly, 2, c); } }
    if (!narrow) { ui.text('TOKO', dx + dw - 17, dy + dh - 16, T.cream, { mini: true, bold: true, align: 'center', outline: T.phoneD }); for (let j = 0; j < 3; j++) ui.rect(dx + dw - 22, dy + 14 + j * 4, 10, 1, T.phoneD); }
    // buttons: home (close on the home screen) and back
    const hb = narrow ? [dx + R(dw / 2), dy + dh - 24] : [dx + dw - 17, dy + R(dh / 2) + 12];
    const home = roundButton(ui, hb[0], hb[1], 9, this.tab === 'home' ? 'close' : 'home', { color: T.cream, modal: true, tip: this.tab === 'home' ? 'Close' : 'Home' });
    const bb = narrow ? [dx + R(dw / 2) - 34, dy + dh - 24] : [dx + dw - 17, dy + R(dh / 2) - 20];
    const back = this.tab !== 'home' && roundButton(ui, bb[0], bb[1], 7, 'left', { color: T.amber, modal: true }).clicked;
    if (home.clicked) { if (this.tab === 'home') return this.close(); this.go('home'); }
    if (back) this.go('home');
    if (ui.key('Escape') || ui.key('Backspace') || (ui.key('Tab') && this.t > 0.2)) { if (this.tab === 'home' || ui.key('Tab')) { this.close(); return; } this.go('home'); this.sfx('ui_back'); }
    // the screen
    frame(ui, sx - 3, sy - 3, sw + 6, sh + 6, { thin: true, r: 3, fill: T.screen, edge: T.phoneD, shadow: false });
    ui.clip(sx, sy, sw, sh, () => {
      for (let yy = sy + 3; yy < sy + sh; yy += 6) for (let xx = sx + 3 + ((yy / 6) & 1) * 3; xx < sx + sw; xx += 6) ui.rect(xx, yy, 1, 1, T.screenL);
      this.statusBar(ui, sx, sy, sw);
      const cy = sy + 15, ch = sh - 17, appK = easeOut(this.appT * 5), ox = R((1 - appK) * 18), g = ui.g;
      ui.push(0, 0, 1, 1, ox, 0);
      try {
        if (this.tab === 'home') this.drawHome(ui, sx + 4, cy, sw - 8, ch - 4, dt);
        else {
          const A = APPS.find((a) => a.id === this.tab) || { label: this.tab, icon: 'phone' };
          this.appHeader(ui, sx + 6, cy, sw - 12, A);
          const ax = sx + 6, ay = cy + 20, aw = sw - 12, ah = ch - 24;
          ({ party: () => this.drawParty(ui, ax, ay, aw, ah), dex: () => this.drawDex(ui, ax, ay, aw, ah, dt), bag: () => this.drawBag(ui, ax, ay, aw, ah), map: () => this.drawMap(ui, ax, ay, aw, ah), quests: () => this.drawQuests(ui, ax, ay, aw, ah), settings: () => this.drawSettings(ui, ax, ay, aw, ah) }[this.tab] || (() => {}))();
        }
      } finally { ui.pop(); }
    });
    if (ui.ptr.released && ui.inside(dx, dy, dw, dh)) ui.ptr.released = false;
  }
  statusBar(ui, x, y, w) {
    const st = this.app.state || {}, t = st.time || { day: 1, hour: 12 }, h = Math.floor(t.hour), m = Math.floor((t.hour % 1) * 60);
    ui.rect(x, y, w, 12, T.ink); ui.rect(x, y + 12, w, 1, T.screenL);
    ui.text('TOKOPHONE', x + 5, y + 4, T.amber, { mini: true, bold: true });
    let rx = x + w - 5;
    ui.rect(rx - 11, y + 3, 10, 6, T.cream); ui.rect(rx - 10, y + 4, 7, 4, T.green); ui.rect(rx - 1, y + 5, 1, 2, T.cream);
    rx -= 15;
    const right = `DAY ${t.day}  ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    ui.text(right, rx, y + 4, T.cream, { mini: true, bold: true, align: 'right' });
    rx -= R(ui.tw(right, { mini: true, bold: true })) + 8;
    const money = fmtNum(st.money || 0);
    ui.text(money, rx, y + 4, T.amberL, { mini: true, bold: true, align: 'right' });
    ui.bigIcon('coin', rx - R(ui.tw(money, { mini: true, bold: true })) - 13, y, null, { shadow: false });
  }
  appHeader(ui, x, y, w, A) {
    frame(ui, x, y, w, 16, { thin: true, r: 2, shadow: false });
    ui.bigIcon(A.icon, x + 4, y + 2, null, { shadow: false });
    gem(ui.s, x + 21, y + 8, T.copperL, 2);
    ui.text(A.label.toUpperCase(), x + 27, y + 6, T.text, { mini: true, bold: true });
  }
  // ------------------------------------------------------------------ home: app icons on plinths
  drawHome(ui, x, y, w, h, dt) {
    const n = APPS.length, cols = w < 220 ? 2 : 3, rows = Math.ceil(n / cols);
    frame(ui, x, y, w, h, { r: 3 });
    if (ui.key('ArrowRight') || ui.key('d')) this.pick((this.sel + 1) % n);
    if (ui.key('ArrowLeft') || ui.key('a')) this.pick((this.sel + n - 1) % n);
    if (ui.key('ArrowDown') || ui.key('s')) this.pick(Math.min(n - 1, this.sel + cols));
    if (ui.key('ArrowUp') || ui.key('w')) this.pick(Math.max(0, this.sel - cols));
    if (ui.key('Enter') || ui.key(' ') || ui.key('e')) { this.sfx('ui_tap'); return this.go(APPS[this.sel].id); }
    const st = this.app.state || {}, badges = { party: (st.party || []).length, bag: Object.values(st.bag || {}).filter((v) => v > 0).length, quests: this.app.quests ? this.app.quests.list().filter((q) => q.active).length : 0 };
    const cellW = R((w - 16) / cols), cellH = R((h - 12) / rows), size = cellH - 34 >= 48 && cellW >= 64 ? 48 : cellH - 34 >= 32 ? 32 : 16;
    APPS.forEach((A, i) => {
      const c = i % cols, r = Math.floor(i / cols), cx = R(x + 8 + c * cellW + cellW / 2), top = R(y + 8 + r * cellH + (cellH - size - 26) / 2);
      const pop = boing(this.t * 1.6 - 0.15 - i * 0.07); if (pop < 0.1) return;
      const over = ui.inside(cx - cellW / 2, top - 4, cellW, size + 28);
      if (over && (ui.ptr.x !== this._px || ui.ptr.y !== this._py)) this.sel = i;
      const on = i === this.sel, g = ui.g;
      ui.push(cx, top + size, pop, pop);
      const b = plinthButton(ui, cx, top, A.icon, { size, sel: on, badge: badges[A.id] || null, modal: true });
      ui.pop();
      // the app's name on a little plate
      const nm = A.label.toUpperCase(), lw = R(ui.tw(nm, { mini: true, bold: true }) + 24);
      frame(ui, cx - R(lw / 2), top + size + 12, lw, 13, { thin: true, r: 1, fill: on ? T.creamL : T.cream, edge: on ? T.brass : null, shadow: false });
      gem(ui.s, cx - R(lw / 2) + 5, top + size + 18, on ? T.amber : T.copperL, 2); gem(ui.s, cx + R(lw / 2) - 6, top + size + 18, on ? T.amber : T.copperL, 2);
      ui.text(nm, cx, top + size + 16, T.text, { mini: true, bold: true, align: 'center' });
      if (b.clicked) this.go(A.id);
    });
    this._px = ui.ptr.x; this._py = ui.ptr.y;
    void dt;
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
  empty(ui, x, y, w, h, icon, msg) { frame(ui, x, y, w, h, { r: 3 }); ui.emblem(icon, R(x + w / 2), R(y + h / 2) - 8, 2); ui.text(msg, R(x + w / 2), R(y + h / 2) + 22, T.dim, { align: 'center', bold: true }); }
  drawParty(ui, x, y, w, h) {
    const list = this.party();
    if (!list.length) return this.empty(ui, x, y, w, h, 'party', 'No Tokonmon yet');
    const cols = w > 300 ? 2 : 1, cw = R((w - (cols - 1) * 6) / cols), rh = Math.min(42, R((h - 4) / Math.ceil(list.length / cols)) - 5);
    list.forEach((m, i) => {
      const c = i % cols, r = Math.floor(i / cols), cx = x + c * (cw + 6), cy = R(y + r * (rh + 5) + (1 - boing(this.appT * 1.6 - i * 0.08)) * 20);
      frame(ui, cx, cy, cw, rh, { thin: true, r: 2, edge: i === 0 ? T.brass : null });
      const Rr = Math.min(12, R(rh / 2) - 5), mx0 = cx + 6 + Rr + 3, my = cy + R(rh / 2);
      woodRing(ui.s, mx0, my, Rr, { th: 3, fill: m.color, shadow: false });
      ui.bigIcon(ELEM_ICON[m.elem] || 'star', mx0 - 6, my - 6, null, { shadow: false });
      const nx = mx0 + Rr + 8;
      ui.text(m.name, nx, cy + 5, T.text, { bold: true });
      frame(ui, cx + cw - 22, cy + 3, 18, 12, { thin: true, r: 1, fill: T.copperL, shadow: false });
      ui.text(String(m.level), cx + cw - 13, cy + 6, '#ffffff', { mini: true, bold: true, align: 'center', outline: T.copperD });
      if (m.drip > 1) ui.text(m.drip === 3 ? 'ULTRA' : 'DRIP', nx + R(ui.tw(m.name, { bold: true })) + 5, cy + 6, m.drip === 3 ? T.amber2 : T.cyan2, { mini: true, bold: true });
      const bw = cw - (nx - cx) - 52;
      ui.bar(nx, cy + rh - 11, Math.max(20, bw), 4, m.maxHp ? m.hp / m.maxHp : m.frac, { id: 'tp-party' + i, color: 'green' });
      ui.text('HP', nx, cy + rh - 6, T.dim, { mini: true });
      ui.text(m.maxHp ? `${m.hp}/${m.maxHp}` : '', cx + cw - 6, cy + rh - 12, T.dim, { mini: true, align: 'right' });
      if (ui.inside(cx, cy, cw, rh) && ui.ptr.released) { ui.ptr.released = false; this.go('dex'); const b = this.dexBook(); const kk = b.list.indexOf(m.id); if (kk >= 0) b.select(kk); }
    });
  }
  dexBook() { return this.book || (this.book = new DexBook(this.app)); }
  drawDex(ui, x, y, w, h, dt) { this.dexBook().draw(ui, x, y, w, h, dt, true); }
  drawBag(ui, x, y, w, h) {
    const bag = (this.app.state && this.app.state.bag) || {}, ids = Object.keys(bag).filter((id) => bag[id] > 0);
    if (!ids.length) return this.empty(ui, x, y, w, h, 'bag', 'Your bag is empty');
    frame(ui, x, y, w, h - 26, { r: 3 });
    const ts = 38, gap = 6, cols = Math.max(1, Math.floor((w - 12 + gap) / (ts + gap))), maxRows = Math.max(1, Math.floor((h - 40 + gap) / (ts + gap)));
    const list = ids.slice(0, cols * maxRows), gx = R(x + (w - (cols * (ts + gap) - gap)) / 2);
    for (let i = list.length; i < cols * maxRows; i++) { const cx = gx + (i % cols) * (ts + gap), cy = y + 7 + Math.floor(i / cols) * (ts + gap); ui.rect(cx, cy, ts, ts, T.creamD); ui.rect(cx, cy, ts, 1, T.creamLine); ui.rect(cx, cy, 1, ts, T.creamLine); ui.rect(cx + 1, cy + ts - 1, ts - 1, 1, T.creamL); ui.rect(cx + ts - 1, cy + 1, 1, ts - 1, T.creamL); }
    if (ui.key('ArrowRight') || ui.key('d')) this.bagSel++; if (ui.key('ArrowLeft') || ui.key('a')) this.bagSel--;
    if (ui.key('ArrowDown') || ui.key('s')) this.bagSel += cols; if (ui.key('ArrowUp') || ui.key('w')) this.bagSel -= cols;
    this.bagSel = Math.max(0, Math.min(list.length - 1, this.bagSel));
    list.forEach((id, i) => {
      const it = ITEMS[id] || { name: id }, cx = gx + (i % cols) * (ts + gap), cy = R(y + 7 + Math.floor(i / cols) * (ts + gap) + (1 - boing(this.appT * 1.6 - i * 0.03)) * 12);
      const over = ui.inside(cx, cy, ts, ts); if (over && ui.ptr.pressed) { this.bagSel = i; this.sfx('ui_tap', { vol: 0.5 }); }
      const on = this.bagSel === i;
      knob(ui, cx, cy, ts, ts, { color: on ? T.creamL : T.creamD, state: over && ui.ptr.down ? 2 : on ? 1 : 0, lip: 3, r: 2, active: on, frame: 'copper' });
      ui.bigIcon(itemIcon(id, it), cx + 3, cy + 1 + (over && ui.ptr.down ? 2 : 0), null, { scale: 32 / 12 });
      const cnt = '×' + bag[id], cw = R(ui.tw(cnt, { mini: true, bold: true }) + 6);
      frame(ui, cx + ts - cw + 2, cy + ts - 11, cw, 11, { thin: true, r: 1, fill: T.ink, edge: T.copperD, shadow: false });
      ui.text(cnt, cx + ts - cw + 5, cy + ts - 8, T.cream, { mini: true, bold: true });
      if (on && ((this.t * 1.3) % 1) < 0.4) sparkle(ui.s, cx + 4, cy + 4, T.amberL, 1);
    });
    const sel = ITEMS[list[this.bagSel]] || { name: list[this.bagSel] };
    frame(ui, x, y + h - 22, w, 22, { thin: true, r: 2 });
    ui.bigIcon(itemIcon(list[this.bagSel], sel), x + 5, y + h - 19, null, { scale: 16 / 12, shadow: false });
    ui.text(sel.name || list[this.bagSel], x + 25, y + h - 15, T.text, { bold: true });
    if (sel.desc) ui.text(ui.wrap(sel.desc, w - 150, { mini: true })[0] || '', x + 30 + R(ui.tw(sel.name || '', { bold: true })), y + h - 14, T.dim, { mini: true });
    if (sel.price) { ui.text(fmtNum(sel.price), x + w - 20, y + h - 15, T.amber2, { bold: true, align: 'right' }); ui.bigIcon('coin', x + w - 18, y + h - 18, null, { shadow: false }); }
  }
  drawQuests(ui, x, y, w, h) {
    const list = this.app.quests ? this.app.quests.list() : [];
    if (!list.length) return this.empty(ui, x, y, w, h, 'quest', 'No quests yet');
    let yy = y;
    list.forEach((q, i) => {
      if (yy > y + h - 28) return;
      const step = q.active ? (q.steps && q.steps[q.step]) || '' : 'Complete!', cy = R(yy + (1 - boing(this.appT * 1.6 - i * 0.08)) * 16);
      frame(ui, x, cy, w, 28, { thin: true, r: 2, edge: q.main && q.active ? T.brass : null, fill: q.active ? null : T.creamD });
      badge(ui, x + 13, cy + 14, 9, q.active ? (q.main ? 'star' : 'talk') : 'check', q.active ? (q.main ? T.amber : T.cyan) : T.green);
      ui.text(q.title || q.id, x + 27, cy + 5, T.text, { bold: true });
      ui.text(ui.wrap(step, w - 34, { mini: true })[0] || '', x + 27, cy + 17, q.active ? T.dim : T.leafD, { mini: true });
      yy += 32;
    });
  }
  drawSettings(ui, x, y, w, h) {
    const st = this.app.state || {}, set = st.settings || (st.settings = {});
    frame(ui, x, y, w, h, { r: 3 });
    const step = (key, d) => { set[key] = Math.round(clamp01((set[key] ?? 0.8) + d) * 10) / 10; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); };
    [['music', 'MUSIC', 'music', 'pink', '-', '='], ['sfx', 'SOUND', 'bell', 'cyan', '[', ']']].forEach(([key, label, icon, col, kDn, kUp], i) => {
      const ry = y + 12 + i * 32, v = clamp01(set[key] ?? 0.8);
      ui.bigIcon(icon, x + 10, ry, null, { scale: 16 / 12 });
      ui.text(label, x + 30, ry + 5, T.text, { mini: true, bold: true });
      const bx = x + 96, bw = Math.max(40, w - 140);
      if (roundButton(ui, x + 82, ry + 7, 6, 'left', { color: T.cream, hotkey: kDn, modal: true }).clicked) step(key, -0.1);
      ui.bar(bx, ry + 3, bw, 9, v, { color: col, id: 'tp-opt' + key, trail: false, shine: false });
      if (roundButton(ui, bx + bw + 14, ry + 7, 6, 'right', { color: T.cream, hotkey: kUp, modal: true }).clicked) step(key, 0.1);
      if (ui.ptr.down && ui.inside(bx, ry, bw, 14)) { set[key] = Math.round(clamp01((ui.ptr.x - bx) / bw) * 20) / 20; const a = this.app.audio; if (a && a.setVolumes) a.setVolumes({ [key]: set[key] }); }
    });
    const by = y + 80, bw = Math.min(110, R((w - 30) / 2));
    if (ui.button(R(x + w / 2 - bw - 5), by, bw, 22, 'Save', { color: T.green, icon: 'save' })) { if (this.app.save) this.app.save(); ui.toast('Saved!', { icon: 'check', color: T.green }); this.savedT = this.t; }
    if (ui.button(R(x + w / 2 + 5), by, bw, 22, 'Resume', { color: T.blue, icon: 'play' })) this.close();
    if (this.savedT != null && this.t - this.savedT < 1.2) sparkle(ui.s, R(x + w / 2 - bw / 2 - 5), by - 2, T.amber, 1 - (this.t - this.savedT) / 1.2);
  }
  // ------------------------------------------------------------------ map
  drawMap(ui, x, y, w, h) {
    const world = this.app.world, city = world && world.city;
    frame(ui, x, y, w, h, { r: 3, fill: '#3a78b8' });
    if (city && city.c && city.c.minimap) return this.drawCityMap(ui, x + 5, y + 5, w - 10, h - 10, city);
    this.drawSFMap(ui, x + 5, y + 5, w - 10, h - 10);
  }
  cityCanvas(mm) {
    if (this.mapCv && this.mapCv.src === mm) return this.mapCv.cv;
    const cv = pixelCanvas(mm.w, mm.h, (d) => { const cache = new Map(); for (let i = 0; i < mm.col.length; i++) { const c = mm.col[i]; let v = cache.get(c); if (v === undefined) { v = P(c); cache.set(c, v); } d[i] = v; } });
    this.mapCv = { src: mm, cv }; return cv;
  }
  drawCityMap(ui, x, y, w, h, city) {
    const mm = city.c.minimap, cv = this.cityCanvas(mm), g = ui.g, app = this.app, world = app.world;
    const fit = Math.min(w / mm.w, h / mm.h), k = fit >= 1 ? Math.floor(fit) : fit;
    const mw = R(mm.w * k), mh = R(mm.h * k), ox = R(x + (w - mw) / 2), oy = R(y + (h - mh) / 2);
    g.imageSmoothingEnabled = false; g.drawImage(cv, ox, oy, mw, mh);
    const toMap = (wx, wz) => [R(ox + wx * k), R(oy + wz * k)];
    for (const z of (city.c.zones || [])) {
      const [x0, z0, x1, z1] = z.rect; if ((x1 - x0) * (z1 - z0) < 900) continue;
      const [lx, ly] = toMap((x0 + x1) / 2, (z0 + z1) / 2);
      ui.text(String(z.label).toUpperCase(), lx, ly - 2, '#ffffff', { align: 'center', mini: true, outline: T.ink });
    }
    const s = app.state;
    for (const [id, spot] of Object.entries(CITY_SPOTS)) {
      if (id !== 'home' && !(s.unlocks && s.unlocks.locations.includes(id))) continue;
      const p = world.spot(spot); if (!p) continue;
      const [px, py] = toMap(p[0], p[1]), bob = R(Math.sin(this.t * 4 + px)), L = LOCATIONS[id];
      const over = ui.inside(px - 8, py - 18, 16, 18);
      ui.bigIcon(id === 'home' ? 'home' : 'pin', px - 8, py - 16 + bob - (over ? 2 : 0), null, { scale: 16 / 12 });
      if (over) { const nm = String((L && L.name) || id).toUpperCase(), lw = R(ui.tw(nm, { mini: true, bold: true }) + 12); frame(ui, px - R(lw / 2), py - 32, lw, 12, { thin: true, r: 1, shadow: false }); ui.text(nm, px, py - 29, T.text, { mini: true, bold: true, align: 'center' }); }
      if (over && ui.ptr.pressed) this.sfx('ui_tap');
      if (over && ui.ptr.released) { ui.ptr.released = false; this.close(); app.story.run(() => app.travel(id)); return; }
    }
    const pl = world.player;
    if (pl) {
      const q = pl.g.position, [px, py] = toMap(q.x, q.z), pulse = (this.t * 1.5) % 1;
      ui.g.globalAlpha = 1 - pulse; ui.s.ring(px, py, 3 + pulse * 8, 3 + pulse * 8, '#ffffff'); ui.g.globalAlpha = 1;
      fillDisc(ui, px, py, 3, T.ink); fillDisc(ui, px, py, 2, T.red);
    }
    const g2 = app.story && app.story.goal;
    if (g2) { const [gx, gy] = toMap(g2.x, g2.z); tri(ui.s, gx - 3, gy - 10 + R(Math.abs(Math.sin(this.t * 5)) * 2), 'down', 3, T.amber); }
  }
  drawSFMap(ui, x0, y0, w, h) {
    const M = (u, v) => [x0 + u * w, y0 + v * h];
    ui.rect(x0, y0, w, h, '#3a78b8');
    for (let j = 0; j < h; j += 5) for (let i = (j / 5 & 1) * 4; i < w; i += 9) ui.rect(x0 + i, y0 + j, 2, 1, '#4a88c8');
    ui.s.poly(LAND.map(([u, v]) => M(u, v)), '#f0e2c0');
    for (let kk = 1; kk < 18; kk++) { const [gx] = M(kk / 18, 0); ui.rect(R(gx), R(y0 + h * 0.14), 1, R(h * 0.86), '#e0cca4'); }
    const park = (u0, v0, u1, v1) => { const [a, b] = M(u0, v0), [c, d] = M(u1, v1); ui.rect(R(a), R(b), R(c - a), R(d - b), '#6ab84a'); };
    park(0.02, 0.43, 0.36, 0.5); park(0.1, 0.12, 0.24, 0.24); park(0.6, 0.53, 0.66, 0.56); park(0.41, 0.6, 0.45, 0.64);
    { const [a, b] = M(0.13, 0.115), [c, d] = M(0.07, 0.03); ui.s.line(a, b, c, d, '#d8443e'); ui.s.line(a + 1, b, c + 1, d, '#d8443e'); }
    for (const sg of MAP_SIGHTS) { const [a, b] = M(...sg.at); ui.rect(R(a) - 1, R(b) - 1, 3, 3, '#8a7e74'); }
    const s = this.app.state, here = this.app.world && this.app.world.id;
    for (const [id, L] of Object.entries(LOCATIONS)) {
      if (L.hidden || !L.map || !(s.unlocks.locations.includes(id) || id === here)) continue;
      const [a, b] = M(...L.map), bob = id === here ? 0 : R(Math.sin(this.t * 4 + a));
      ui.bigIcon(id === here ? 'home' : 'pin', R(a) - 6, R(b) - 13 + bob, null, {});
      const nm = L.name, lw = R(ui.tw(nm, { mini: true }) + 10);
      if (ui.button(Math.max(x0, Math.min(x0 + w - lw, R(a - lw / 2))), R(b) + 1, lw, 12, nm, { mini: true, color: id === here ? T.cyan : T.cream }) && id !== here) { this.close(); this.app.story.run(() => (tramOpen(this.app, id) ? rideTram(this.app, id) : this.app.travel(id))); }
    }
  }
}
export { SFPhone as TokoPhone };
void mx; void knob;
