// Tokonmon (2D HD-2D edition) — app shell. Two canvases: the WebGL HD-2D stage
// (world/battle frame + lighting) and a crisp low-res pixel UI layer above it,
// both scaled by the same whole-number factor so pixels line up exactly.
import { HD2D } from '../hd2d.js';
import { Stage3D } from '../stage3d.js';
import { PixelUI, T } from './ui.js';
import { World2D } from './world.js';
import { loadFonts } from '../font.js';
import * as S from '../../game/state.js';
import { Story2D } from './story.js';
import { Phone } from './phone.js';
import { MAPS, loadMaps } from './maps.js';
import { loadDesigns } from './mon.js';
import { createElemon } from '../../game/elemon.js';
import { ITEMS } from '../../data/items.js';
import { recordEat } from '../../data/progress.js';
import { FOODS } from '../../data/foods.js';
import { SPECIES } from '../../data/species.js';

const NO_AUDIO = { sfx() {}, voice() {}, music() {}, stinger() {}, ambience() {}, unlock() {}, setVolumes() {}, setIntensity() {}, stopAll() {}, autoUnlock() {} };

export class App {
  constructor() {
    this.params = new URLSearchParams(location.search);
    this.keysDown = {}; this.tapWorld = null; this.mode = 'boot'; this.t = 0; this.fadeA = 1; this.fadeTo = 0;
    this.state = S.newGame();
  }
  async boot() {
    this.gl = document.getElementById('gl'); this.uiCv = document.getElementById('ui');
    this.post = new HD2D(this.gl);
    this.ui = new PixelUI(320, 180, { canvas: this.uiCv });
    const VOICES = { 'Coach Gonda': 'coach', Kaito: 'rival', Mika: 'friend', Taro: 'kid', Thrash: 'punk', Riff: 'punk', Moshi: 'punk', 'Dr. Hoshino': 'professor', Barber: 'elder', '???': 'rival' };
    this.ui.voice = (name, ch) => { if (this.audio && this.audio.voice) this.audio.voice(VOICES[name] || 'friend', ch); };
    this.layout();
    addEventListener('resize', () => this.layout());
    this.bindInput();
    try { const m = await import('../../audio/audio.js'); this.audio = m.audio || m.default || NO_AUDIO; } catch (e) { this.audio = NO_AUDIO; }
    if (this.audio.autoUnlock) this.audio.autoUnlock(window);
    await loadFonts();
    await loadMaps(); this.MAPS = MAPS;
    await loadDesigns();
    this.world = new World2D(this);
    this.phone = new Phone(this);
    this.story = new Story2D(this);
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    window.__app = this;
    await this.story.boot();
  }
  // ------------------------------------------------------------------ view
  layout() {
    const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    // whole-number scale so the low-res view is ~270 px tall in landscape, ~240 px wide in portrait
    const target = W >= H ? H / 270 : W / 240;
    const S_ = Math.max(1, Math.round(target * dpr));
    this.vw = Math.ceil(W * dpr / S_); this.vh = Math.ceil(H * dpr / S_); this.scale = S_;
    this.gl.width = this.vw * S_; this.gl.height = this.vh * S_;
    for (const c of [this.gl, this.uiCv]) { c.style.width = (this.vw * S_ / dpr) + 'px'; c.style.height = (this.vh * S_ / dpr) + 'px'; }
    const ud = Math.min(2, devicePixelRatio || 1);          // the UI draws at device resolution over the same layout grid
    this.uiCv.style.imageRendering = 'auto';
    this.ui.resize(this.vw, this.vh, Math.round((this.vw * S_ / dpr) * ud), Math.round((this.vh * S_ / dpr) * ud));
    if (this.world && this.world.sc) { this.world.sc.setView(this.vw, this.vh); }
    if (this.stage3d) this.stage3d.setView(this.vw, this.vh);
    if (this.battle && this.battle.sc) this.battle.sc.setView(this.vw, this.vh);
  }
  bindInput() {
    const cv = this.uiCv, p = this.ui.ptr;
    const pos = (e) => { const r = cv.getBoundingClientRect(); p.x = Math.floor((e.clientX - r.left) / r.width * this.vw); p.y = Math.floor((e.clientY - r.top) / r.height * this.vh); };
    cv.addEventListener('pointerdown', (e) => { pos(e); p.down = true; p.pressed = true; p.sx = p.x; p.sy = p.y; this.audio.unlock && this.audio.unlock(); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => pos(e));
    cv.addEventListener('pointerup', (e) => { pos(e); p.down = false; p.released = true; });
    cv.addEventListener('pointercancel', () => { p.down = false; });
    addEventListener('keydown', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (!e.repeat) this.ui.keys[k] = 'pressed'; this.keysDown[k] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault(); });
    addEventListener('keyup', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; this.keysDown[k] = false; });
    addEventListener('blur', () => { this.keysDown = {}; });
  }
  // ------------------------------------------------------------------ loop
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000)); this.last = now; this.t += dt;
    try {
      const mode = this.modeObj();
      if (mode && mode.update) mode.update(dt);
      const frame = mode && mode.render ? mode.render(this.t) : null;
      if (frame) this.post.draw(frame, this.t);
      const ui = this.ui; ui.begin(dt);
      if (mode && mode.drawUI) mode.drawUI(ui, dt);
      if (this.mode === 'world' && !this.phone.open) this.drawHud(ui);
      if (this.overlay) this.overlay(ui, dt);
      if (this.phone && this.phone.open) this.phone.draw(ui, dt);
      // fades
      this.fadeA += Math.sign(this.fadeTo - this.fadeA) * Math.min(Math.abs(this.fadeTo - this.fadeA), dt * 3.2);
      if (this.fadeA > 0.001) ui.fade(this.fadeA, '#0c0814');
      // a release nobody consumed is a tap on the world
      if (ui.ptr.released && !ui.dialog && Math.hypot(ui.ptr.x - ui.ptr.sx, ui.ptr.y - ui.ptr.sy) < 8) this.tapWorld = [ui.ptr.x, ui.ptr.y];
      ui.end();
    } catch (e) { if (!this._err) { this._err = true; console.error(e); const el = document.getElementById('err'); if (el) { el.style.display = 'block'; el.textContent = 'Frame: ' + (e.stack || e); } } }
  }
  modeObj() { return this.mode === 'world' ? this.world : this.mode === 'battle' ? this.battle : this.mode === 'title' ? this.story.title : this.story.scene; }
  fade(to, ms = 400) { this.fadeTo = to; return new Promise((r) => setTimeout(r, ms)); }
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ------------------------------------------------------------------ services used by maps / story
  say(name, ...lines) { return lines.reduce((p, l) => p.then(() => this.ui.say(name, l)), Promise.resolve()); }
  async shop(stock, blurb) {
    const opts = stock.map(([id, price]) => `${(ITEMS[id] && ITEMS[id].name) || id}  ¥${price}`).concat(['Leave']);
    const i = await this.ui.choose(blurb + `  (¥${this.state.money})`, opts);
    if (i == null || i >= stock.length) return;
    const [id, price] = stock[i];
    if (this.state.money < price) { await this.ui.say('', "Not enough yen."); return; }
    this.state.money -= price; S.addItem(this.state, id, 1); this.audio.sfx('coin');
    this.ui.toast(`Got ${(ITEMS[id] && ITEMS[id].name) || id}!`, { icon: 'bag' });
    this.save();
  }
  async eatAt(where) {
    const lead = this.state.party[0];
    if (!lead) return this.say('', 'You should find a partner first.');
    const ids = where === 'ramen' ? ['ramen', 'red_hot_ramen'] : ['fruit_sando', 'lemon_tart'];
    const menu = ids.filter((id) => FOODS[id]).map((id) => [id, FOODS[id].name, FOODS[id].price]);
    const i = await this.ui.choose(where === 'ramen' ? 'The ramen master nods. "What\'ll it be?"' : 'A quiet kissaten that smells of coffee and old records.', menu.map(([, n, p]) => `${n}  ¥${p}`).concat(['Maybe later']));
    if (i == null || i >= menu.length) return;
    const [id, n, price] = menu[i];
    if (this.state.money < price) return this.say('', 'Not enough yen.');
    this.state.money -= price;
    lead.hp = 1;
    const unlocked = recordEat(lead, id, this.state.unlocks.slots) || [];
    const name = lead.nick || SPECIES[lead.species].name;
    await this.say('', `${name} digs into the ${n}!`);
    if (FOODS[id].heat > 2 && lead.species === 'chilichick') await this.say('', 'Tears stream down its cheeks… and it asks for another bowl.');
    for (const u of unlocked) this.ui.toast(`New: ${u.name || u.id || u}`, { icon: 'star' });
    this.save();
  }
  async rest() { await this.say('', 'You sit on the bench for a while. The afternoon light crawls across the tiles.'); S.healParty(this.state, 1); this.ui.toast('Team rested', { icon: 'heart' }); }
  onExit(ex) { if (ex.act) return ex.act(this); }
  places() {
    const s = this.state, has = s.party.length > 0;
    return Object.entries(MAPS).map(([id, M]) => ({ id, name: M.name, open: id === 'plaza' || (has && (!M.unlock || s.flags[M.unlock])) }));
  }
  async travel(id, spawn) {
    if (!MAPS[id] || this._travelling) return;
    this._travelling = true;
    const prev = this.world.control; this.world.control = false;
    this.audio.sfx('whoosh');
    await this.fade(1, 450);
    await this.world.load(id, spawn || 'start', { night: MAPS[id].night });
    Object.assign(this.post.opts, MAPS[id].night ? { night: 0.25, rays: 0, warm: 0.25, threshold: 0.72, bloom: 0.75 } : { night: 0, rays: 0.11, warm: 0.65, threshold: 0.78, bloom: 0.5 });
    this.state.map = { id }; this.save();
    await this.fade(0, 500);
    this.world.control = prev !== false; this._travelling = false;
    this.ui.toast(MAPS[id].name, { icon: 'map', color: T.cyan, dur: 2.4 });
  }
  save() { if (this.state.party.length) S.save(this.state); }
  // HD-2D diorama: rebuild a painted scene as a lit 3D set (falls back to flat 2D with ?flat=1 or without WebGL)
  attachStage(sc, o = {}) {
    if (this.params.has('flat')) return;
    try {
      if (!this.stage3d) { this.stage3d = new Stage3D({ pitch: +(this.params.get('pitch') || 38), fov: +(this.params.get('fov') ?? 18) }); }
      this.stage3d.setView(this.vw, this.vh);
      this.stage3d.dispose();
      this.stage3d.build(sc, o);
      sc.stage = this.stage3d;
    } catch (e) { console.warn('3D stage unavailable, staying flat', e); }
  }
  async startBattle(spec) {
    if (!this.battle || !this.battle.start) { const m = await import('./battle.js').catch(() => null); if (m) this.battle = new m.Battle2D(this); }
    if (!this.battle || !this.battle.start) { await this.say('', '(Battle!)'); return { winner: 0 }; }
    const prev = this.mode;
    await this.fade(1, 350);
    const res = await this.battle.start(spec);
    await this.fade(1, 350);
    this.mode = prev;
    if (this.world.sc) this.world.sc.setView(this.vw, this.vh);
    await this.fade(0, 400);
    return res;
  }
  // world HUD: objective, money, phone
  drawHud(ui) {
    if (this.mode !== 'world' || ui.dialog || this.overlay) return;
    if (this.objective) { const w = Math.min(ui.w - 70, ui.tw(this.objective) + 22); ui.panel(4, 4, w, 15, {}); ui.icon('star', 8, 8, T.amber); ui.text(this.objective.length * 6 > w - 20 ? this.objective.slice(0, Math.floor((w - 22) / 6) - 1) + '…' : this.objective, 18, 8, T.text, { shadow: T.ink }); }
    if (this.state.flags.phone && ui.button(ui.w - 26, 4, 22, 20, '', { icon: 'phone', color: T.cyan, hotkey: 'Tab' })) this.phone.toggle();
  }
  newMon(species, level = 5) { return createElemon(species, { level, friendship: 70 }); }
}
