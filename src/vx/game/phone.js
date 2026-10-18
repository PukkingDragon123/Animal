// The TokoPhone: your way around San Francisco. The Map app draws the city as pixel
// art (the peninsula, the bay, the bridges, the parks) with a pin for every place
// you can go — tap one to travel. The Team app lists your Tokonmon.
import { T } from '../../px/game/ui.js';
import { LOCATIONS, MAP_SIGHTS } from './locations.js';
import { SPECIES } from '../../data/species.js';
import { maxHp } from '../../game/elemon.js';

const LAND = [[0.0, 0.2], [0.04, 0.14], [0.1, 0.12], [0.16, 0.135], [0.22, 0.095], [0.33, 0.1], [0.42, 0.08], [0.5, 0.085], [0.58, 0.11], [0.66, 0.095], [0.73, 0.12], [0.77, 0.19], [0.8, 0.27], [0.86, 0.33], [0.84, 0.42], [0.86, 0.5], [0.84, 0.6], [0.88, 0.72], [0.9, 0.86], [0.93, 1], [0, 1]];
const MARIN = [[0, 0], [0.32, 0], [0.26, 0.03], [0.17, 0.045], [0.1, 0.04], [0.04, 0.06], [0, 0.07]];
export class SFPhone {
  constructor(app) { this.app = app; this.open = false; this.tab = 'map'; this.t = 0; }
  toggle() { this.open = !this.open; this.app.audio.sfx && this.app.audio.sfx(this.open ? 'phone_open' : 'phone_close'); }
  draw(ui, dt) {
    this.t += dt;
    const W = ui.w, H = ui.h, pw = Math.min(W - 16, Math.round(H * 0.62)), ph = H - 14, px = Math.round(W / 2 - pw / 2), py = 7;
    ui.fade(0.45, '#0c0814');
    ui.rrect(px - 3, py - 3, pw + 6, ph + 6, '#141018', 6); ui.rrect(px - 2, py - 2, pw + 4, ph + 4, '#2e2a36', 5);
    ui.rect(px, py, pw, ph, '#0e1420');
    // status bar
    ui.rect(px, py, pw, 11, '#161c2a'); ui.text('TokoPhone', px + 4, py + 2, T.cyan, { mini: true });
    const s = this.app.state, hh = String(s.time.hour).padStart(2, '0');
    ui.text(`DAY ${s.time.day}  ${hh}:00`, px + pw - 4, py + 2, T.text, { mini: true, align: 'right' });
    // tabs
    const tabs = [['map', 'MAP'], ['team', 'TEAM']], tw = Math.floor((pw - 8) / tabs.length);
    tabs.forEach(([id, label], i) => { if (ui.button(px + 4 + i * tw, py + ph - 18, tw - 2, 14, label, { color: this.tab === id ? T.amber : T.dim })) this.tab = id; });
    if (ui.button(px + pw - 20, py + 13, 16, 12, 'X', { color: T.red, hotkey: 'Escape' })) this.toggle();
    const ax = px + 3, ay = py + 13, aw = pw - 6, ah = ph - 34;
    if (this.tab === 'map') this.drawMap(ui, ax, ay, aw, ah); else this.drawTeam(ui, ax, ay, aw, ah);
  }
  drawMap(ui, x0, y0, w, h) {
    const M = (u, v) => [Math.round(x0 + u * w), Math.round(y0 + v * h)];
    // water with a gentle shimmer
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) ui.px(x0 + x, y0 + y, ((x + y * 3 + Math.floor(this.t * 4)) % 17 === 0) ? '#3a78b0' : y % 2 ? '#24507e' : '#285684');
    ui.s.poly(MARIN.map(([u, v]) => M(u, v)), '#5a7a4a');
    ui.s.poly(LAND.map(([u, v]) => M(u, v)), '#c8bc9c');
    // street grid, parks, Presidio
    for (let k = 1; k < 18; k++) { const [gx] = M(k / 18, 0); for (let y = Math.round(y0 + h * 0.14); y < y0 + h; y += 1) if (y % 3) ui.px(gx, y, '#b4a888'); }
    for (let k = 3; k < 24; k++) { const [, gy] = M(0, k / 24); for (let x = x0 + 2; x < x0 + w * 0.86; x += 1) if (x % 3) ui.px(x, gy, '#b4a888'); }
    const park = (u0, v0, u1, v1) => { const [a, b] = M(u0, v0), [c, d] = M(u1, v1); ui.rect(a, b, c - a, d - b, '#5a9a4a'); for (let x = a; x < c; x += 3) ui.px(x, b + ((x >> 1) % (d - b || 1)), '#7ab85a'); };
    park(0.02, 0.43, 0.36, 0.5); park(0.1, 0.12, 0.24, 0.24); park(0.6, 0.53, 0.66, 0.56); park(0.41, 0.6, 0.45, 0.64);
    // bridges
    { const [a, b] = M(0.13, 0.115), [c, d] = M(0.07, 0.03); ui.s.line(a, b, c, d, '#e0502a'); ui.s.line(a + 1, b, c + 1, d, '#c8401e'); }
    { const [a, b] = M(0.8, 0.3), [c, d] = M(1, 0.22); ui.s.line(a, b, c, d, '#9aa0aa'); }
    // Alcatraz
    { const [a, b] = M(0.58, 0.03); ui.rect(a - 2, b - 1, 5, 3, '#8a8478'); }
    ui.text('PACIFIC', x0 + 3, y0 + Math.round(h * 0.7), '#5a8ac0', { mini: true }); ui.text('BAY', x0 + Math.round(w * 0.9) - 8, y0 + Math.round(h * 0.12), '#5a8ac0', { mini: true });
    // sights not yet open
    for (const sg of MAP_SIGHTS) { const [a, b] = M(...sg.at); ui.rect(a - 1, b - 1, 3, 3, '#6a6a74'); }
    // open places
    const s = this.app.state, here = this.app.world.id;
    for (const [id, L] of Object.entries(LOCATIONS)) {
      if (L.hidden || !L.map || !(s.unlocks.locations.includes(id) || id === here)) continue;
      const [a, b] = M(...L.map), bob = id === here ? 0 : Math.round(Math.sin(this.t * 4 + a) * 1);
      ui.rect(a - 2, b - 6 + bob, 5, 5, id === here ? T.cyan : T.red); ui.px(a, b - 1 + bob, id === here ? T.cyan : T.red); ui.px(a - 1, b - 5 + bob, '#ffffff');
      const lw = ui.tw(L.name, { mini: true }) + 6;
      if (ui.button(Math.max(x0, Math.min(x0 + w - lw, a - (lw >> 1))), b + 2, lw, 9, L.name, { mini: true, color: id === here ? T.cyan : T.text }) && id !== here) { this.open = false; this.app.story.run(() => this.app.travel(id)); }
    }
  }
  drawTeam(ui, x0, y0, w) {
    const party = this.app.state.party;
    if (!party.length) { ui.text('No Tokonmon yet.', x0 + 6, y0 + 8, T.dim); return; }
    party.forEach((m, i) => {
      const y = y0 + 4 + i * 22, sp = SPECIES[m.species];
      ui.panel(x0 + 2, y, w - 4, 20, {});
      ui.text(`${m.nick || sp.name}`, x0 + 7, y + 3, T.text); ui.text(`Lv${m.level}`, x0 + w - 8, y + 3, T.amber, { align: 'right', mini: true });
      ui.bar(x0 + 7, y + 13, w - 20, 3, m.hp ?? 1, { color: (m.hp ?? 1) > 0.3 ? T.green : T.red });
      void maxHp;
    });
  }
}
