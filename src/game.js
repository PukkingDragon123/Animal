// Orchestrator + state machine. Wires sim ↔ render ↔ input ↔ audio ↔ hud,
// runs the fixed-timestep loop, dispatches sim events to feedback, and owns the
// menu → birth → play → death → unlock meta loop. Entry point (index.html).
import { CONFIG as C } from './config.js';
import { createRun, step, liveDna } from './sim.js';
import { speciesOf, foodOf, SPECIES_LIST } from './species.js';
import { freshSeed } from './rng.js';
import { STR } from './strings.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { Hud } from './hud.js';
import * as save from './save.js';

const STEP = C.sim.step;            // ms
const STEP_S = STEP / 1000;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function hasWebGL(canvas) {
  try { return !!(canvas.getContext('webgl2') || canvas.getContext('webgl')); }
  catch (e) { return false; }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('c');
    this.renderer = new Renderer(this.canvas);
    this.input = new Input(this.canvas);
    this.audio = new Audio();
    this.save = save.load();
    this.hud = new Hud({
      onPick: (id) => this.startRun(id),
      onUnlock: (id) => this.unlock(id),
      onBegin: () => this.begin(),
      onAgain: () => this.startRun(this.state ? this.state.speciesId : null),
      onMenu: () => this.toMenu(),
      onResume: () => this.resume(),
      onPause: () => this.pause(),
      onToggleMute: () => { const m = !this.audio.muted; this.audio.setMuted(m); return m; },
      setSprint: (v) => this.input.setSprintButton(v),
    });

    this.mode = 'menu';            // menu | birth | playing | paused | dead
    this.state = null;
    this.acc = 0; this.last = performance.now();
    this.deathTimer = 0;
    this.dev = new URLSearchParams(location.search).has('dev');
    this._frames = 0; this._fpsAt = this.last; this._fps = 0;

    this._resize = this._resize.bind(this);
    addEventListener('resize', this._resize); addEventListener('orientationchange', this._resize);
    this._resize();
    addEventListener('blur', () => { if (this.mode === 'playing') this.pause(); });

    // first gesture: unlock audio + start cozy music
    const wake = () => { this.audio.resume(); this.audio.startMusic(); removeEventListener('pointerdown', wake); removeEventListener('keydown', wake); };
    addEventListener('pointerdown', wake); addEventListener('keydown', wake);

    if (this.dev) document.getElementById('dev').style.display = 'block';
    this.toMenu();
    requestAnimationFrame((t) => this._loop(t));
  }

  _resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.resize(w, h);
  }

  // ---- meta loop ----
  toMenu() {
    this.mode = 'menu'; this.input.enabled = false; this.input.reset();
    this.hud.showHud(false); this.hud.menu(this.save);
  }

  unlock(id) {
    const sp = speciesOf(id);
    if (this.save.unlocked.includes(id) || this.save.dna < sp.unlockCost) return;
    this.save.dna -= sp.unlockCost;
    this.save.unlocked.push(id);
    save.save(this.save);
    this.hud.speciesSelect(this.save);
  }

  startRun(speciesId) {
    if (!speciesId) speciesId = pick(this.save.unlocked);
    if (!this.save.unlocked.includes(speciesId)) speciesId = 'rabbit';
    this.state = createRun({ speciesId, seed: freshSeed() });
    this.renderer.setupRun(this.state);
    this.foodColor = (this.state.species.diet.kind === 'graze') ? foodOf(this.state.species.diet.food).color : 0xffd23f;
    this.state.events.length = 0;            // consume the 'born' event after birth card
    this.mode = 'birth'; this.input.enabled = false;
    this.hud.showHud(false);
    this.hud.birth(speciesId, this.state.mutationIds);
  }

  begin() {
    this.audio.resume(); this.audio.startMusic();
    this.hud.hideScreen(); this.hud.showHud(true);
    this.mode = 'playing'; this.input.enabled = true; this.input.reset();
    this.hud.showQuip(pick(STR.quips.born));
    this.last = performance.now(); this.acc = 0;
  }

  pause() { if (this.mode !== 'playing') return; this.mode = 'paused'; this.input.enabled = false; this.hud.pause(); }
  resume() { if (this.mode !== 'paused') return; this.hud.hideScreen(); this.mode = 'playing'; this.input.enabled = true; this.last = performance.now(); this.acc = 0; }

  _drain() {
    const s = this.state, P = s.player, fx = this.renderer.fx, swimY = this.renderer.swimY || 0;
    for (const e of s.events) {
      this.audio.onEvent(e.t);
      switch (e.t) {
        case 'eat': fx.burst(e.x, swimY + 0.4, e.z, this.foodColor, 8, { up: 1.8 }); break;
        case 'hit': fx.burst(P.x, swimY + 0.6, P.z, 0xff5040, 12, { up: 2.6, speed: 3 }); break;
        case 'birth': fx.sparkleRing(e.x, swimY, e.z, 0xff8fc0, 16); break;
        case 'stage': fx.sparkleRing(P.x, swimY, P.z, 0xffe27a, 12); this.hud.setStage(s.stage); break;
        case 'reachedWater': fx.burst(P.x, swimY, P.z, 0x9fe0ff, 16, { up: 2.2, speed: 3 }); break;
        case 'quip': this.hud.showQuip(pick(STR.quips[e.key] || [''])); break;
        case 'alert': this.hud.setVignette(0.6); break;
        case 'death': this._pendingDeath = { cause: e.cause, success: e.success }; break;
      }
    }
    s.events.length = 0;
  }

  _stepSim() {
    const cmd = this.input.get();
    let steps = 0;
    while (this.acc >= STEP && steps < 5) {
      step(this.state, cmd, STEP_S);
      this.acc -= STEP; steps++;
      if (!this.state.alive) break;
    }
    this._drain();
    if (this._pendingDeath && this.deathTimer === 0) {
      this.audio.die(); this.deathTimer = 1.25;
      const col = this.state.species.colors.body;
      this.renderer.fx.burst(this.state.player.x, (this.renderer.swimY || 0) + 0.5, this.state.player.z, col, 18, { up: 3, speed: 3.2, life: 0.9 });
    }
  }

  _hud() {
    const s = this.state, S = s.stats;
    const warmth = s.species.struggle === 'cold' ? s.warmth : null;
    this.hud.setNeeds(S.hunger, S.energy, s.ageFrac * 100, warmth);
    this.hud.setObjective(STR.obj[s.objective] || STR.obj.survive);
    this.hud.setDna(liveDna(s));
    this.hud.setStage(s.stage);
    this.hud.setVignette(s.danger);
    this.hud.updateJoystick(this.input.joyVisual());
  }

  _finishDeath() {
    const s = this.state;
    const earned = liveDna(s);
    this.save.dna += earned;
    this.save.runs += 1;
    this.save.totalOffspring += s.offspring;
    this.save.deaths[s.cause] = (this.save.deaths[s.cause] || 0) + 1;
    if (s.dnaRun > this.save.bestScore) this.save.bestScore = earned;
    save.save(this.save);
    this.mode = 'dead'; this.input.enabled = false; this.hud.showHud(false);
    this.hud.death({
      success: s.reproduced, cause: s.cause,
      lived: `${STR.stage[s.stage]} · ${Math.round(s.ageFrac * 100)}%`,
      meals: s.meals, offspring: s.offspring, dna: earned, newUnlocks: [],
    });
    if (s.reproduced) this.audio.success();
    this._pendingDeath = null; this.deathTimer = 0;
  }

  _loop(now) {
    requestAnimationFrame((t) => this._loop(t));
    const dtMs = Math.min(now - this.last, 100); this.last = now;
    const dt = dtMs / 1000;

    if (this.mode === 'playing') {
      this.acc += dtMs;
      this._stepSim();
      this.renderer.update(this.state, dt, now / 1000);
      this._hud();
      if (this.deathTimer > 0) { this.deathTimer -= dt; if (this.deathTimer <= 0) this._finishDeath(); }
    } else if (this.mode === 'birth' || this.mode === 'paused' || this.mode === 'dead') {
      // keep the world gently alive behind the panel
      if (this.state) this.renderer.update(this.state, 0, now / 1000);
    }
    this.renderer.render();

    if (this.dev) {
      this._frames++;
      if (now - this._fpsAt >= 500) { this._fps = Math.round(this._frames * 1000 / (now - this._fpsAt)); this._frames = 0; this._fpsAt = now; }
      const s = this.state;
      const ec = s ? (1 + s.predators.length + s.prey.length + s.food.length) : 0;
      document.getElementById('dev').textContent = `${this._fps} fps · ${this.mode} · ent ${ec}` + (s ? ` · ${s.stage} ${Math.round(s.ageFrac * 100)}%` : '');
    }
  }
}

function boot() {
  if (window.__game) return;
  const canvas = document.getElementById('c');
  if (!hasWebGL(canvas)) {
    const s = document.getElementById('screen');
    s.classList.add('show');
    s.innerHTML = `<div class="panel"><div class="ptitle">Oops</div><div class="fact">This game needs WebGL. Try a modern browser (Chrome, Safari, Firefox) with hardware acceleration enabled.</div></div>`;
    return;
  }
  try { window.__game = new Game(); }
  catch (e) {
    const s = document.getElementById('screen');
    s.classList.add('show');
    s.innerHTML = `<div class="panel"><div class="ptitle">Something broke</div><div class="fact">${String(e && e.message || e)}</div></div>`;
    throw e;
  }
}
addEventListener('DOMContentLoaded', boot);
if (document.readyState !== 'loading') boot();
