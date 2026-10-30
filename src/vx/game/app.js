// Tokonmon: San Francisco — the voxel edition's app shell. The world is a fine-voxel
// diorama rendered by three.js (VxStage: cel shading, ink outlines, soft shadows),
// finished by the HD-2D post pass (tilt-shift focus, bloom, grade), with a crisp
// low-resolution pixel UI on top (dialogue, phone, battle HUD). There is no free
// walking: the game is told through camera shots and cutscenes; you travel with
// the phone map and tap hotspots in each place.
import { HD2D } from '../../px/hd2d.js';
import { VxStage } from '../stage.js';
import { PixelUI, T } from '../../px/game/ui.js';
import { loadFonts } from '../../px/font.js';
import { loadSignFonts } from '../decals.js';
import * as S from '../../game/state.js';
import { createElemon } from '../../game/elemon.js';
import { VxWorld } from './world.js';
import { SFPhone } from './phone.js';
import { Story } from './story.js';
import { LOCATIONS } from './locations.js';
import { Quests, visit, drawTramSign } from './quests.js';
import { Hud } from './hud.js';

// fast-travel targets on the city map (phone map / cable car)
const CITY_SPOTS = { chinatown: 'square', alamo: 'park', pier39: 'pier', dojo: 'dojoDoor', arena: 'arena', apartment: 'frontDoorOut', home: 'frontDoorOut', lab: 'labDoor', city: 'frontDoorOut' };
const NO_AUDIO = { sfx() {}, voice() {}, music() {}, stinger() {}, ambience() {}, unlock() {}, setVolumes() {}, setIntensity() {}, stopAll() {}, autoUnlock() {} };
export const POST = {
  day: { focus: 0.5, band: 0.3, dof: 0.5, bloom: 0.42, threshold: 0.84, rays: 0.05, vig: 0.4, warm: 0.35, sat: 1.08, contrast: 1.06, night: 0 },
  golden: { focus: 0.5, band: 0.3, dof: 0.5, bloom: 0.5, threshold: 0.8, rays: 0.08, vig: 0.45, warm: 0.5, sat: 1.1, contrast: 1.06, night: 0 },
  night: { focus: 0.5, band: 0.3, dof: 0.5, bloom: 0.95, threshold: 0.58, rays: 0, vig: 0.5, warm: 0.2, sat: 1.12, contrast: 1.08, night: 0.15 },
};

export class VxApp {
  constructor() {
    this.params = new URLSearchParams(location.search);
    this.keysDown = {}; this.t = 0; this.fadeA = 1; this.fadeTo = 1; this.overlays = [];
    this.state = S.newGame({ name: 'Ren' });
    this.auto = this.params.get('auto') ? +this.params.get('auto') || 1 : 0;      // dev: auto-play cutscenes (tests)
  }
  async boot() {
    this.view = document.getElementById('view'); this.uiCv = document.getElementById('ui');
    this.stage = new VxStage({ fov: 30, shadowSize: +(this.params.get('shadow') || 4096) });
    if (this.params.get('ink') !== '0') this.stage.setStyle({ ink: true, toon: this.params.get('toon') !== '0', inkCrease: 0.03 });
    this.post = new HD2D(this.view);
    this.ui = new PixelUI(320, 180);
    const VOICES = { Coach: 'coach', 'Coach Gonda': 'coach', Kaito: 'rival', Mika: 'friend', Taro: 'kid', Riff: 'punk', Moshi: 'punk', Grandma: 'elder', 'Ms. Aoi': 'professor', '???': 'rival' };
    this.ui.voice = (name, ch) => { if (this.audio && this.audio.voice) this.audio.voice(VOICES[name] || 'friend', ch); };
    this.layout(); addEventListener('resize', () => this.layout());
    this.bindInput();
    try { const m = await import('../../audio/audio.js'); this.audio = m.audio || m.default || NO_AUDIO; } catch (e) { this.audio = NO_AUDIO; }
    if (this.audio.autoUnlock) this.audio.autoUnlock(window);
    await loadFonts();
    await loadSignFonts('中華街茶樓餅家金龍中藥點心福珠寶和平');
    this.world = new VxWorld(this);
    this.phone = new SFPhone(this);
    this.story = new Story(this);
    this.quests = new Quests(this);
    this.hud = new Hud(this);
    this.last = performance.now();
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    window.__app = this;
    await this.story.boot();
  }
  // ------------------------------------------------------------------ layout & input
  layout() {
    const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    // render at native resolution (up to 2560 px); resK drops it a little when frames run slow (see loop)
    const k = Math.min(dpr, (+(this.params.get('res') || 2560)) / Math.max(W, H)) * (this.resK || 1);
    this.rw = Math.max(320, Math.round(W * k)); this.rh = Math.max(180, Math.round(H * k));
    this.view.width = this.rw; this.view.height = this.rh; this.view.style.width = W + 'px'; this.view.style.height = H + 'px';
    this.stage.setSize(this.rw, this.rh);
    const target = W >= H ? H / 270 : W / 240, S_ = Math.max(1, Math.round(target * dpr));
    this.vw = Math.ceil((W * dpr) / S_); this.vh = Math.ceil((H * dpr) / S_); this.scale = S_;
    this.uiCv.width = this.vw; this.uiCv.height = this.vh;
    this.uiCv.style.width = (this.vw * S_) / dpr + 'px'; this.uiCv.style.height = (this.vh * S_) / dpr + 'px';
    this.ui.resize(this.vw, this.vh); this.uctx = this.uiCv.getContext('2d');
  }
  bindInput() {
    const cv = this.uiCv, p = this.ui.ptr;
    const pos = (e) => { const r = cv.getBoundingClientRect(); p.x = Math.floor(((e.clientX - r.left) / r.width) * this.vw); p.y = Math.floor(((e.clientY - r.top) / r.height) * this.vh); };
    cv.addEventListener('pointerdown', (e) => { pos(e); p.down = true; p.pressed = true; p.sx = p.x; p.sy = p.y; this.audio.unlock && this.audio.unlock(); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } });
    cv.addEventListener('pointermove', (e) => pos(e));
    cv.addEventListener('pointerup', (e) => { pos(e); p.down = false; p.released = true; });
    cv.addEventListener('pointercancel', () => { p.down = false; });
    addEventListener('keydown', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (!e.repeat) this.ui.keys[k] = 'pressed'; this.keysDown[k] = true; if (['ArrowUp', 'ArrowDown', ' ', 'Tab'].includes(e.key)) e.preventDefault(); });
    addEventListener('keyup', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; this.keysDown[k] = false; });
    addEventListener('blur', () => { this.keysDown = {}; });
  }
  // ------------------------------------------------------------------ loop
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000)); this.last = now; this.t += dt;
    // adaptive resolution: average the frame time over 2 s; below ~40 fps step down 15% (to 55%), above ~57 fps step back up
    if (!this.params.get('res')) { const P = this.perf || (this.perf = { n: 0, sum: 0 }); P.n++; P.sum += (now - (P.prev || now)) / 1000; P.prev = now;
      if (P.sum > 2) { const avg = P.sum / P.n; P.n = 0; P.sum = 0; const k0 = this.resK || 1; let k1 = k0; if (avg > 1 / 40) k1 = Math.max(0.55, k0 * 0.85); else if (avg < 1 / 57 && k0 < 1) k1 = Math.min(1, k0 / 0.85); if (k1 !== k0) { this.resK = k1; this.layout(); } } }
    try {
      this.world.update(dt);
      if (this.battle && this.battle.active) this.battle.update(dt);
      if (this.world.ready) { const frame = this.stage.render(); this.post.draw(frame, this.t); }
      const ui = this.ui; ui.begin(dt);
      if (this.battle && this.battle.active) this.battle.drawUI(ui, dt);
      else this.world.drawUI(ui, dt);
      if (this.roaming && !(this.battle && this.battle.active) && !this.story.title) this.hud.draw(ui, dt);
      if (this.story.drawUI) this.story.drawUI(ui, dt);
      for (const o of this.overlays) o(ui, dt);
      drawTramSign(this, ui, dt);
      if (this.phone.open) this.phone.draw(ui, dt);
      this.world.handleTap(ui);
      this.fadeA += Math.sign(this.fadeTo - this.fadeA) * Math.min(Math.abs(this.fadeTo - this.fadeA), dt * 3.2);
      if (this.fadeA > 0.001) ui.fade(this.fadeA, '#0c0814');
      ui.end();
      this.uctx.putImageData(new ImageData(new Uint8ClampedArray(ui.s.data.buffer), ui.w, ui.h), 0, 0);
    } catch (e) { if (!this._err) { this._err = true; console.error(e); const el = document.getElementById('err'); if (el) { el.style.display = 'block'; el.textContent = 'Frame: ' + (e.stack || e); } } }
  }
  // ------------------------------------------------------------------ services for the story
  fade(to, ms = 400) { this.fadeTo = to; return new Promise((r) => setTimeout(r, ms)); }
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  say(name, ...lines) { if (this.auto) { this.log && this.log.push(name + ': ' + lines[0]); return this.wait(40 * this.auto); } return lines.reduce((p, l) => p.then(() => this.ui.say(name, l)), Promise.resolve()); }
  choose(prompt, opts, o) { if (this.auto) return this.wait(40).then(() => 0); return this.ui.choose(prompt, opts, o); }
  toast(str, o) { this.ui.toast(str, o); }
  setPost(mood) { Object.assign(this.post.opts, POST[mood] || POST.day); }
  async travel(id, o = {}) {
    // in the walkable city, places are spots on the one map: fast-travel there
    if (this.world.city && CITY_SPOTS[id] && this.world.player) {
      if (this._travelling) return; this._travelling = true; this.audio.sfx && this.audio.sfx('whoosh');
      if (this.phone) this.phone.open = false;
      await this.fade(1, 380);
      const s = this.world.spot(CITY_SPOTS[id]), p = this.world.player, q = this.world.partner;
      p.path = null; p.place(s[0], s[1], s[2] || 0, s[3]); this.world.city.placed(); if (q) q.place(s[0] + 1, s[1] + 1, 0, s[3]);
      this.world.followCam(0); await this.fade(0, 450); this._travelling = false; visit(this, id); this.save();
      return;
    }
    if (!LOCATIONS[id] || this._travelling) return;
    this._travelling = true; this.audio.sfx && this.audio.sfx('whoosh');
    if (o.fade !== false) await this.fade(1, 420);
    await this.world.load(id, o);
    this.state.map = { id }; visit(this, id); this.save();
    if (this.roaming) {                                         // free roam: step in at the tram stop or the start spot
      const L = LOCATIONS[id], at = (o.at === 'tram' && L.tram && L.tram.spot) || (L.spots && (L.spots[o.at] || L.spots.start)) || (this.world.sc.spots && (this.world.sc.spots[o.at] || this.world.sc.spots.start)) || [(L.view || this.world.sc.view).target[0], (L.view || this.world.sc.view).target[2] + 2, 0];
      await this.story.startRoam(at);
    }
    await this.fade(0, 500);
    this._travelling = false;
    if (this.hud && this.hud.showLocation) this.hud.showLocation(LOCATIONS[id].name, 'San Francisco'); else this.toast(LOCATIONS[id].name, { icon: 'map', color: T.cyan, dur: 2.4 });
    if (this.story.onArrive) await this.story.onArrive(id);
  }
  async startBattle(spec) {
    if (this.auto) { this.log && this.log.push('BATTLE ' + (spec.title || '')); await this.wait(200); return { winner: 0, auto: true }; }
    if (!this.battle) { const m = await import('./battle.js'); this.battle = new m.Battle3D(this); }
    await this.fade(1, 300);
    const res = await this.battle.start(spec);
    return res;
  }
  newMon(species, level = 5) { return createElemon(species, { level, friendship: 70 }); }
  save() {
    const w = this.world;
    if (w && w.city && w.player) { const p = w.player.g.position; this.state.map = { id: 'city', x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +p.y.toFixed(2) }; }
    if (this.state.party.length) S.save(this.state);
  }
}
