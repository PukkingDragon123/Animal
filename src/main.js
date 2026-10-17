// Tokonmon — Osaka 2050. App shell: boots the renderer, UI, world, battle
// scene, game services, director and story, then runs the frame loop.
import { Gfx } from './gfx/renderer.js';
import { Input } from './core/input.js';
import { UI } from './ui/ui.js';
import { WorldScene } from './world/world.js';
import { BattleScene } from './battle/scene.js';
import { Game } from './game/game.js';
import { Screens } from './ui/screens.js';
import { WorldHud } from './ui/hud.js';
import { Director } from './game/director.js';
import { Story } from './story/chapter1.js';
import { LOCATIONS } from './data/locations.js';
import { QUESTS, questProgress } from './data/quests.js';
import * as S from './game/state.js';
import { Activities } from './game/activities.js';
import { recordVisit } from './data/progress.js';

const $ = (id) => document.getElementById(id);
const loadbar = $('loadbar'), loadmsg = $('loadmsg');
function progress(f, msg) { if (loadbar) loadbar.style.width = Math.round(f * 100) + '%'; if (msg && loadmsg) loadmsg.textContent = msg; }

// silent stand-in if the audio module fails to load
const NO_AUDIO = { sfx() {}, voice() {}, music() {}, stinger() {}, ambience() {}, unlock() {}, setVolumes() {}, setIntensity() {}, stopAll() {}, autoUnlock() {} };

class App {
  constructor() {
    this.busy = false;
    this.state = S.newGame();
    this.paused = false;
    this.last = performance.now();
    this.clockRunning = false;
    this.params = new URLSearchParams(location.search);
    this.renderEvery = +this.params.get('renderEvery') || 0;
  }

  async boot() {
    progress(0.05, 'Warming up the neon…');
    let audio = NO_AUDIO;
    try { const mod = await import('./audio/audio.js'); audio = mod.audio || mod.default || NO_AUDIO; } catch (e) { console.warn('audio unavailable', e); }
    this.audio = audio;
    if (this.audio.autoUnlock) this.audio.autoUnlock(window);
    const saved = S.load();
    const quality = this.params.get('q') || (saved && saved.settings && saved.settings.quality) || undefined;
    progress(0.15, 'Linking soul stones…');
    this.canvas = $('c');
    this.gfx = new Gfx(this.canvas, { quality });
    this.input = new Input(this.canvas);
    this.ui = new UI({ audio: this.audio, gfx: this.gfx });
    this.world = new WorldScene(this);
    this.battle = new BattleScene(this);
    this.game = new Game(this);
    this.screens = new Screens(this);
    this.hud = new WorldHud(this);
    this.director = new Director(this);
    this.activities = new Activities(this);
    this.story = new Story(this);
    this.hud.show(false);
    addEventListener('resize', () => this.resize());
    this.resize();
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state.party.length && !this.battle.active) this.saveGame(true); });
    // title backdrop: Osaka Castle Park at dusk with a slow orbit
    progress(0.35, 'Building Osaka 2050…');
    await this.world.load('castle_park', 'castle_view', { music: false, hideNpcs: [] });
    this.ui.bannerEl.classList.remove('show');
    this.world.actor('player').setVisible(false);
    this.gfx.setTime(18.4);
    progress(0.9, 'Almost there…');
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    // let a few frames compile shaders before revealing
    await new Promise((r) => setTimeout(r, 400));
    progress(1, 'Ready!');
    const ld = $('loading'); ld.style.opacity = '0'; setTimeout(() => ld.remove(), 600);
    this.titleMode = true;
    this.titleOrbit();
    this.audio.music('title', { fade: 1.5 });
    if (this.params.has('dev')) { $('dev').style.display = 'block'; this.dev = true; }
    window.__app = this;  // handy for debugging & automated play tests
    let pick = this.params.get('auto');
    while (!pick) {
      pick = await this.screens.title(S.hasSave());
      if (pick === 'new' && S.hasSave() && !(await this.screens.confirm('Start a new game? Your current save will be overwritten.', 'Start over', 'Back'))) pick = null;
    }
    this.gfx.rig.release();
    if (pick === 'continue' && saved) { this.state = saved; this.applySettings(); await this.story.resume(); }
    else { S.wipe(); this.state = S.newGame(); this.applySettings(); await this.story.start(); }
  }
  titleOrbit() {
    const c = this.world.resolvePoint('castle_view') || [22, 21];
    this.gfx.rig.play({ look: [c[0], 6, c[1] - 6], from: [c[0], 6, c[1]], orbit: [0.5, 1.6], radius: 26, height: 9, dur: 60, fov: 36, ease: 'linear' });
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.gfx.resize(w, h);
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    this.ticks = (this.ticks || 0) + 1;
    if (window.__hold) { this.last = now; return; }   // test hook: freeze rendering (screenshots)
    let dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (this.paused) dt = 0;
    try {
      if (this.battle.active) this.battle.update(dt);
      else this.world.update(dt);
      this.tickClock(dt);
      if (!this.battle.active && this.hud.root.classList.contains('show')) this.hud.update();
      // test mode (?renderEvery=ms): simulate every frame, render only now and then
      this.gfxDt = (this.gfxDt || 0) + dt;
      if (!this.renderEvery || now - (this.lastRender || 0) >= this.renderEvery || window.__forceRender) {
        this.lastRender = now; window.__forceRender = false;
        const fdt = Math.min(this.gfxDt, 0.25); this.gfxDt = 0;
        this.gfx.frame(fdt, fdt);
      }
    } catch (e) {
      if (!this._loopErr) { this._loopErr = true; console.error(e); const el = $('err'); el.style.display = 'block'; el.textContent += 'Frame: ' + (e.stack || e) + '\n'; }
    }
    this.state.playtime += dt;
    if (this.dev) { this._fps = (this._fps || 60) * 0.95 + (dt > 0 ? 1 / dt : 60) * 0.05; if (((now / 250) | 0) !== this._devT) { this._devT = (now / 250) | 0; const info = this.gfx.renderer.info; $('dev').textContent = `${this._fps.toFixed(0)} fps · ${info.render.calls} calls · ${(info.render.triangles / 1000).toFixed(0)}k tris · ${this.gfx.qName}`; } }
  }
  // the in-game clock only runs during free roam; story scenes set time explicitly
  tickClock(dt) {
    const t = this.state.time;
    if (this.clockRunning && !this.busy && !this.battle.active && this.world.control) {
      const before = t.hour;
      S.passTime(this.state, dt / 120);          // 2 real minutes = 1 game hour
      if (Math.floor(before * 4) !== Math.floor(t.hour * 4)) this.story.onClock && this.story.onClock();
    }
    if (Math.abs(this.gfx.hour - t.hour) > 0.004 && !this.director.cutscene && !this.titleMode) this.gfx.setTime(t.hour);
  }
  // advance time by an activity, with a sky time-lapse
  async passTime(hours, lapse = true) {
    const res = S.passTime(this.state, hours);
    if (lapse) await this.director.timeLapse(this.state.time.hour, Math.min(2.2, 0.6 + hours * 0.5));
    else this.gfx.setTime(this.state.time.hour);
    return res;
  }

  // ------------------------------------------------------------------ player & party
  playerLook() {
    const s = this.state;
    const base = s.player.look || (this.world && null) || null;
    const look = S.playerLook(s, base || undefined);
    return look;
  }

  // ------------------------------------------------------------------ menus & travel
  openMenu(tab = 'team') {
    if (this.busy || this.battle.active || this.director.cutscene) return;
    this.busy = true;
    this.world.enableControl(false);
    this.audio.sfx('ui_open');
    this.screens.menu(tab);
  }
  onMenuClosed() {
    this.busy = false;
    this.world.ensurePlayer();
    this.world.refreshBuddy();
    if (!this.director.cutscene) this.world.enableControl(true);
    this.updateObjective();
  }
  async openMap() {
    if (this.busy || this.battle.active || this.director.cutscene) return;
    if (this.story.canTravel && !this.story.canTravel()) return;
    this.busy = true; this.world.enableControl(false);
    this.audio.sfx('ui_open');
    const dest = await this.screens.worldMap();
    this.busy = false;
    if (dest) await this.travel(dest);
    else this.world.enableControl(true);
  }
  async travel(locId, spawn) {
    const L = LOCATIONS[locId];
    if (!L) return;
    this.busy = true; this.world.enableControl(false); this.hud.show(false);
    this.audio.sfx('whoosh');
    await this.ui.fade(true, 500);
    S.passTime(this.state, 0.5);
    this.gfx.setTime(this.state.time.hour);
    await this.world.load(L.map, spawn || L.spawn || 'arrive', this.story.mapOpts ? this.story.mapOpts(L.map) : {});
    S.unlockLocation(this.state, locId);
    this.visited(L.map);
    await this.ui.fade(false, 600);
    this.busy = false;
    this.hud.show(true);
    this.world.enableControl(true);
    this.saveGame(true);
    if (this.story.onArrive) await this.story.onArrive(L.map, locId);
    this.updateObjective();
  }
  async onExit(ex) {
    if (this.busy) return;
    if (ex.to === 'worldmap') { this.openMap(); return; }
    // trail-to-trail links inside the safari
    const loc = Object.keys(LOCATIONS).find((k) => LOCATIONS[k].map === ex.to);
    if (loc) await this.travel(loc, ex.spawn);
    else await this.enterScene(ex.to, ex.spawn);
  }
  // walk through a door into a linked stage set (restaurants, shops, dojo, stadium…)
  async enterScene(mapId, spawn) {
    if (this.busy && !this.director.cutscene) return;
    const wasBusy = this.busy;
    this.busy = true; this.world.enableControl(false);
    this.audio.sfx('door');
    await this.ui.fade(true, 380);
    await this.world.load(mapId, spawn || 'door', this.story.mapOpts ? this.story.mapOpts(mapId) : {});
    this.visited(mapId);
    await this.ui.fade(false, 420);
    this.busy = wasBusy;
    if (!wasBusy) this.world.enableControl(true);
    this.saveGame(true);
    if (this.story.onArrive) await this.story.onArrive(mapId, null);
    this.updateObjective();
  }
  // exploring together counts toward unlocks ({ explore: mapId })
  visited(mapId) {
    for (const mon of this.state.party) for (const u of recordVisit(mon, mapId, this.state.unlocks.slots)) this.activities.stamp(mon, u);
  }

  // ------------------------------------------------------------------ objectives & saving
  updateObjective() {
    const s = this.state;
    let text = this.story.objective ? this.story.objective() : '';
    if (!text) {
      const main = Object.keys(s.quests).find((id) => QUESTS[id].main && !s.quests[id].done);
      if (main) { const pr = questProgress(s, main); if (!pr.complete) text = pr.steps[pr.current].text; }
    }
    this.hud.setObjective(text);
  }
  saveGame(silent = false) {
    if (!this.state.party.length) return false;
    this.state.story.savedAt = Date.now();
    const ok = S.save(this.state);
    if (!silent && ok) this.ui.toast('💾 Saved', 'good', 1400);
    return ok;
  }
  applySettings() {
    const st = this.state.settings;
    if (this.audio.setVolumes) this.audio.setVolumes({ music: st.music ?? 0.7, sfx: st.sfx ?? 0.9 });
  }
  onStarterFocus(id, i) { if (this.story.onStarterFocus) this.story.onStarterFocus(id, i); }
  onChoicePicked(o, cfg) { if (this.story.onChoicePicked) this.story.onChoicePicked(o, cfg); }
}

const app = new App();
app.boot().catch((e) => {
  console.error(e);
  const el = $('err'); el.style.display = 'block'; el.textContent += 'Boot failed: ' + (e.stack || e) + '\n';
});
export default app;
