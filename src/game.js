// Orchestrator + state machine. Wires sim ↔ render ↔ input ↔ audio ↔ hud,
// runs the fixed-timestep loop, dispatches sim events to feedback, and owns the
// menu → birth → play → death → unlock meta loop. Entry point (index.html).
import { CONFIG as C } from './config.js';
import { createRun, step, liveDna } from './sim.js';
import { speciesOf, foodOf, SPECIES_LIST } from './species.js';
import { freshSeed } from './rng.js';
import { STR, FAMILY } from './strings.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { Hud } from './hud.js';
import * as save from './save.js';
import { recordRun, checkUnlocks } from './quests.js';
import { runRewards, addExp } from './evolution.js';
import { applySkills, speciesSkills, unlockSkill } from './skills.js';

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
      onContinue: () => this.continueAsOffspring(),
      onMenu: () => this.toMenu(),
      onResume: () => this.resume(),
      onPause: () => this.pause(),
      onToggleMute: () => { const m = !this.audio.muted; this.audio.setMuted(m); return m; },
      setSprint: (v) => this.input.setSprintButton(v),
      setAttack: (v) => this.input.setAttackButton(v),
      onEvolve: (id) => this.openEvolution(id),
      onUnlockSkill: (id, nodeId) => { const ok = unlockSkill(this.save, id, nodeId); if (ok) save.save(this.save); return ok; },
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

  openEvolution(id) {
    this.mode = 'menu'; this.input.enabled = false; this.input.reset();
    this.hud.showHud(false);
    this.hud.evolution(this.save, id || this.lastSpecies);
  }

  startRun(speciesId, lineage) {
    if (!speciesId) speciesId = pick(this.save.unlocked);
    if (!this.save.unlocked.includes(speciesId)) speciesId = 'turtle';
    this.lastSpecies = speciesId;
    const gen = (lineage && lineage.generation) || 1;
    const evo = applySkills(speciesSkills(this.save, speciesId));
    // dynasty: each surviving generation toughens the bloodline a little
    const bonus = Object.assign({}, evo.bonus);
    if (gen > 1) {
      const g = gen - 1;
      bonus.lifeMul = (bonus.lifeMul || 1) * (1 + 0.04 * g);
      bonus.eatMul = (bonus.eatMul || 1) * (1 + 0.03 * g);
      bonus.extraHits = (bonus.extraHits || 0) + Math.floor(g / 2);
    }
    this.state = createRun({ speciesId, seed: freshSeed(), bonus, visuals: evo.visuals, generation: gen, lineageScore: (lineage && lineage.lineageScore) || 0 });
    this.renderer.setupRun(this.state);
    this.foodColor = (this.state.species.diet.kind === 'graze') ? foodOf(this.state.species.diet.food).color : 0xffd23f;
    this.hud.setDiet(this.state.species.dietIcon, this.state.species.dietName);
    this.state.events.length = 0;            // consume the 'born' event after birth card
    this.mode = 'birth'; this.input.enabled = false;
    this.hud.showHud(false);
    this.hud.birth(speciesId, this.state.mutationIds, gen);
  }

  // dynasty loop: when you've left young behind, carry on as your offspring —
  // same species, a fresh roll of mutations, and an accumulating dynasty score.
  continueAsOffspring() {
    const ln = this._lineage; this._lineage = null;
    if (!ln) { this.startRun(this.lastSpecies); return; }
    this.startRun(ln.speciesId, { generation: ln.generation, lineageScore: ln.lineageScore });
  }

  begin() {
    this.audio.resume(); this.audio.startMusic();
    this.hud.hideScreen(); this.hud.showHud(true);
    this.mode = 'playing'; this.input.enabled = true; this.input.reset();
    this.hud.showQuip(pick(STR.quips.born));
    this._tut('move');
    this._tut('attack');
    const sp = this.state.species;
    if (sp.struggle === 'cold') this._tut('cold');
    if (sp.noEat && sp.struggle === 'ephemeral') this._tut('clock');
    if (sp.forage) this._tut('forage');
    if (sp.dark) this._tut('female');
    if (sp.struggle === 'upstream') this._tut('upstreamTip');
    this.last = performance.now(); this.acc = 0;
  }

  // one-time contextual tutorial hint (persisted so it never nags twice)
  _tut(id) {
    if (!this.save.tutorialsSeen || this.save.tutorialsSeen[id]) return;
    this.save.tutorialsSeen[id] = true; save.save(this.save);
    this.hud.showTutorial(STR.tutorials[id]);
  }

  _tutorials(s) {
    if (!this.save.tutorialsSeen.eat && s.stats.hunger < 60) this._tut('eat');
    const P = s.player;
    for (const it of s.interactables) {
      if ((it.x - P.x) ** 2 + (it.z - P.z) ** 2 > 25) continue;     // within ~5 units
      if (it.type === 'fruitTree') this._tut('fruitTree');
      else if (it.type === 'burrow') this._tut('burrow');
      else if (it.type === 'mud') this._tut('mud');
      else if (it.type === 'hive' && s.species.build !== 'bee') this._tut('hive');
    }
    if (s.mate && s.mate.active && (s.mate.x - P.x) ** 2 + (s.mate.z - P.z) ** 2 < 49) this._tut('mate');
  }

  pause() { if (this.mode !== 'playing') return; this.mode = 'paused'; this.input.enabled = false; this.hud.pause(); }
  resume() { if (this.mode !== 'paused') return; this.hud.hideScreen(); this.mode = 'playing'; this.input.enabled = true; this.last = performance.now(); this.acc = 0; }

  _drain() {
    const s = this.state, P = s.player, fx = this.renderer.fx, swimY = this.renderer.swimY || 0;
    for (const e of s.events) {
      this.audio.onEvent(e.t);
      switch (e.t) {
        case 'eat': fx.burst(e.x, swimY + 0.4, e.z, this.foodColor, 8, { up: 1.8 }); if (e.combo >= 3) this.hud.flashCombo(e.combo); break;
        case 'hit': fx.burst(P.x, swimY + 0.6, P.z, 0xff5040, 10, { up: 2.6, speed: 3 }); fx.blood(P.x, swimY + 0.6, P.z, 12); break;
        case 'birth': fx.sparkleRing(e.x, swimY, e.z, 0xff8fc0, 16); this.hud.xpPopup(C.xp.reproduce); break;
        case 'goal': this.hud.xpPopup(e.exp); this.hud.showQuip('✓ ' + e.label); this.audio.grow(); break;
        case 'delivery': fx.sparkleRing(e.x, swimY + 0.4, e.z, 0xffd23f, 10); fx.burst(e.x, swimY + 0.5, e.z, 0xffcf5a, 5, { up: 1.6, life: 0.7 }); this.hud.xpPopup((e.n || 1) * C.xp.delivery); this.hud.showQuip(pick(STR.quips.delivery)); this.audio.success(); break;
        case 'family': this.hud.familyMoment(FAMILY[e.key] || ''); break;
        case 'fused': fx.sparkleRing(e.x, swimY + 0.4, e.z, 0x9ffcff, 20); fx.burst(e.x, swimY + 0.6, e.z, 0x9ffcff, 10, { up: 1.8, life: 0.9 }); this.audio.success(); this.hud.showQuip(pick(STR.quips.fused)); break;
        case 'stage':
          fx.sparkleRing(P.x, swimY, P.z, 0xffe27a, 12); this.hud.setStage(s.stage);
          if (e.stage === 'adult') { this._tut('grow'); if (s.species.reproduce === 'nest' && s.needsMaterials) this._tut('twigs'); }
          break;
        case 'reachedWater': fx.burst(P.x, swimY, P.z, 0x9fe0ff, 16, { up: 2.2, speed: 3 }); break;
        case 'quip': this.hud.showQuip(pick(STR.quips[e.key] || [''])); break;
        case 'alert': this.hud.setVignette(0.6); this._tut('sprint'); break;
        case 'fruitDrop': fx.burst(e.x, 1.6, e.z, 0x5fb050, 6, { up: 1.0, speed: 1.4, life: 0.5 }); this.audio.eat(); break;
        case 'mushroom': fx.sparkleRing(e.x, swimY, e.z, 0xb072e0, 10); this.audio.grow(); break;
        case 'sting': fx.burst(e.x, swimY + 0.5, e.z, 0xffd23f, 10, { up: 2, speed: 2.4 }); fx.blood(P.x, swimY + 0.5, P.z, 6); this.audio.hurt(); this.hud.setVignette(0.4); break;
        case 'bite': this.audio.swipe(); this.renderer.bitePulse(); break;
        case 'bonk': this.audio.bonk(); fx.burst(e.x, swimY + 0.6, e.z, 0xffe27a, 8, { up: 2, speed: 2.6 }); break;
        case 'blood': fx.blood(e.x, swimY + 0.5, e.z, e.big ? 16 : 9, !!e.big); break;
        case 'twig': fx.burst(e.x, swimY + 0.3, e.z, 0x9a6f44, 5, { up: 1.2, life: 0.5 }); this.audio.eat(); this.hud.showQuip(pick(STR.quips.twig)); break;
        case 'nestBuilt': fx.sparkleRing(e.x, swimY, e.z, 0xffe27a, 18); this.audio.success(); this.hud.showQuip(pick(STR.quips.nestBuilt)); break;
        case 'killed': fx.blood(e.x, swimY + 0.5, e.z, 20, true); fx.sparkleRing(e.x, swimY, e.z, 0xffd23f, 12); this.audio.bonk(); this.audio.success(); this.hud.xpPopup(C.xp.kill); this.hud.showQuip(pick(STR.quips.killed)); break;
        case 'gift': fx.sparkleRing(e.x, swimY + 0.4, e.z, 0xff8fc0, 10); fx.burst(e.x, swimY + 0.7, e.z, 0xff5fa2, 5, { up: 1.6, life: 0.8, grav: -1 }); this.audio.grow(); this.hud.showQuip(pick(STR.quips.gift)); break;
        case 'denEnter': fx.burst(e.x, swimY + 0.15, e.z, 0x8a6b4a, 12, { up: 1.0, speed: 1.8, life: 0.5, grav: 7 }); this.audio.swipe(); this.hud.showQuip(pick(STR.quips.den)); break;
        case 'denExit': fx.burst(e.x, swimY + 0.15, e.z, 0x8a6b4a, 8, { up: 1.2, speed: 2.0, life: 0.45, grav: 7 }); this.audio.swipe(); break;
        case 'mud': fx.burst(e.x, swimY + 0.1, e.z, 0x5a4632, 12, { up: 0.8, speed: 1.6, life: 0.6, grav: 8 }); this.audio.bonk(); this.hud.showQuip(pick(STR.quips.mud)); this._tut('mud'); break;
        case 'ambush': this.hud.setVignette(0.7); this.hud.showQuip(pick(STR.quips.ambush)); break;
        case 'qteStart': this.audio.alert(); break;
        case 'qteEnd': if (e.success) { this.audio.success(); fx.sparkleRing(P.x, swimY + 0.4, P.z, 0xffe27a, 14); } else { this.audio.bonk(); } break;
        case 'leap': if (e.success) { fx.burst(e.x, swimY + 0.6, e.z, 0x9fe0ff, 14, { up: 3, speed: 3 }); this.hud.showQuip(pick(STR.quips.leapWin)); } else { fx.burst(e.x, swimY + 0.4, e.z, 0xbfb089, 8, { up: 1.5 }); this.hud.showQuip(pick(STR.quips.leapFail)); } break;
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
      const col = this.state.species.colors.body, sy = (this.renderer.swimY || 0) + 0.5;
      this.renderer.fx.burst(this.state.player.x, sy, this.state.player.z, col, 16, { up: 3, speed: 3.2, life: 0.9 });
      if (this.state.cause === 'predator') this.renderer.fx.blood(this.state.player.x, sy, this.state.player.z, 20, true);
    }
  }

  _hud() {
    const s = this.state, S = s.stats;
    const warmth = s.species.struggle === 'cold' ? s.warmth : null;
    this.hud.setVitals(S.health, s.species.noEat ? null : S.hunger, S.energy, s.ageFrac * 100, warmth);
    this.hud.setGeneration(s.generation);
    this.hud.setGoals(s.goals, s.goalIndex);
    this.hud.setCarry(s.species.forage ? `🌼 ${s.pollen}/${C.forage.capacity} · 🍯 ${s.deliveries}` : null);
    this.hud.setObjective(STR.obj[s.objective] || STR.obj.survive);
    this.hud.setDna(liveDna(s));
    this.hud.setStage(s.stage);
    this.hud.setVignette(s.danger);
    this.hud.setClock(s.light);
    this.hud.setScore(s.score);
    this.hud.setQte(s.qte);
    this.hud.updateJoystick(this.input.joyVisual());
    this._tutorials(s);
  }

  _finishDeath() {
    const s = this.state;
    const earned = liveDna(s);
    this.save.dna += earned;
    this.save.runs += 1;
    this.save.totalOffspring += s.offspring;
    this.save.totalMeals += s.meals;
    this.save.deaths[s.cause] = (this.save.deaths[s.cause] || 0) + 1;
    if (earned > this.save.bestScore) this.save.bestScore = earned;
    // Spore-style rewards: genes + EXP. EXP = end-of-run rewards + everything you
    // earned live this life (life goals, kills, deliveries, mating…).
    const rw = runRewards(s);
    const totalExp = rw.exp + (s.actionExp || 0);
    this.save.genes = (this.save.genes || 0) + rw.genes;
    const levels = addExp(this.save, totalExp);
    // record quest flags, then see which species just unlocked
    recordRun(this.save, { speciesId: s.speciesId, reproduced: s.reproduced, maxStageIndex: s.maxStageIndex, meals: s.meals, builtNest: s.nestBuilt, reachedSea: s.reachedWater });
    const newly = checkUnlocks(this.save);
    const newNames = newly.map(id => speciesOf(id).name);
    save.save(this.save);

    // dynasty: leaving young behind lets you carry on as your offspring
    const dynastyScore = (s.lineageScore || 0) + (s.score || 0);
    this._lineage = s.reproduced
      ? { speciesId: s.speciesId, generation: (s.generation || 1) + 1, lineageScore: dynastyScore }
      : null;

    this.mode = 'dead'; this.input.enabled = false; this.hud.showHud(false);
    this.hud.death({
      success: s.reproduced, cause: s.cause, speciesId: s.speciesId,
      lived: `${STR.stage[s.stage]} · ${Math.round(s.ageFrac * 100)}%`,
      meals: s.meals, offspring: s.offspring, dna: earned, score: s.score || 0,
      genes: rw.genes, exp: totalExp, levelUp: levels > 0, level: this.save.level,
      newUnlocks: newNames,
      generation: s.generation || 1, dynastyScore,
      canContinue: !!this._lineage, nextGen: this._lineage ? this._lineage.generation : 0,
    });
    if (s.reproduced || newly.length || levels) this.audio.success();
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
