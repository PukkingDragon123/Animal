// Battle presentation: binds the deterministic sim to actors, VFX, camera,
// HUD and touch input. Battles happen *in place* on the current world map:
// props around the arena become destructible.
import * as THREE from '../../vendor/three.module.js';
import { createBattle, step, command, trainerCommand, resolveQte, unitById, DT, playerTrainer, activeOf, captureChance } from './sim.js';
import { Actor } from '../gfx/actor.js';
import { VFX, ELEM_COL } from '../gfx/vfx.js';
import { SPR } from '../gfx/particles.js';
import { destroyProp } from '../gfx/env.js';
import { creatureDesign } from '../data/designs/index.js';
import { SKILLS } from '../data/skills.js';
import { SPECIES } from '../data/species.js';
import { ELEMENTS, effLabel } from '../data/elements.js';
import { BattleHud, elemColor } from '../ui/battlehud.js';
import { QteUI } from '../ui/qte.js';
import { h, clear, wait } from '../ui/dom.js';
import { damp, clamp } from '../core/mathx.js';

const STATUS_EMOTE = { sleep: 'zz', stun: 'star', confuse: 'swirl', poison: 'anger', blind: 'sweat', frozen: 'sweat', burn: 'anger', root: '!' };
const SFX_ELEM = { pyro: 'pyro', hydro: 'hydro', bio: 'bio', geo: 'geo', echo: 'echo', volto: 'volto', cryo: 'cryo', aero: 'aero', ecto: 'ecto', ferro: 'ferro', astro: 'astro', nucleo: 'nucleo' };

export class BattleScene {
  constructor(app) {
    this.app = app; this.gfx = app.gfx; this.ui = app.ui; this.audio = app.audio;
    this.vfx = new VFX(this.gfx);
    this.qte = new QteUI(this.ui);
    this.active = false;
    this.ray = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.hud = new BattleHud(this.ui, {
      attack: () => this.cmd({ type: 'attack', id: this.me()?.target || undefined }),
      dodge: () => this.dodge(),
      parry: () => this.cmd({ type: 'parry' }),
      grab: () => this.cmd({ type: 'grab' }),
      charge: (on) => this.cmd({ type: 'charge', on }),
      aimStart: (i) => this.aimStart(i), aimMove: (i, dx, dy, moved) => this.aimMove(i, dx, dy, moved), aimEnd: (i, dx, dy, moved, cancel) => this.aimEnd(i, dx, dy, moved, cancel),
      ult: () => this.cmd({ type: 'ult', id: this.me()?.target || undefined }),
      team: () => { if (trainerCommand(this.st, this.ptr.id, { type: 'team' })) this.audio.sfx('team_combo'); },
      spectral: () => this.cmd({ type: 'spectral' }),
      item: () => this.useItem(),
      capture: () => this.capture(),
      switch: (id) => { if (trainerCommand(this.st, this.ptr.id, { type: 'switch', to: id })) this.audio.sfx('switch'); },
    });
  }
  me() { return this.st ? activeOf(this.st, this.ptr.id) : null; }
  cmd(c) { const u = this.me(); if (!u || !this.st || this.st.over) return false; return command(this.st, u.id, c); }

  // ------------------------------------------------------------------ start
  start(spec) {
    return new Promise(async (resolve) => {
      this.resolve = resolve;
      this.spec = spec;
      const world = this.app.world;
      const A = spec.arena || { x: 0, z: 0, r: 8 };
      this.origin = new THREE.Vector3(A.x, world.grid ? world.grid.heightAt(A.x, A.z) : 0, A.z);
      this.plane.constant = -this.origin.y;
      // arena props from the environment
      this.propMap = new Map();
      const props = [];
      if (world.env) for (const rec of world.env.props) {
        if (!rec.alive) continue;
        const dx = rec.x - A.x, dz = rec.z - A.z, d = Math.hypot(dx, dz);
        if (d > A.r + 1.5 || rec.y > this.origin.y + 1) continue;
        const fp = rec.meta.footprint || [0.8, 0.8];
        const pr = { x: dx, z: dz, r: Math.max(0.25, Math.min(1.2, Math.max(fp[0], fp[1]) * rec.scale * 0.5)), hp: rec.meta.destructible ? (rec.meta.hp || 40) : 9999, destructible: !!rec.meta.destructible, solid: rec.meta.solid !== false, kind: rec.id };
        props.push(pr);
        this.propMap.set(props.length - 1, rec);
      }
      this.st = createBattle({ seed: spec.seed ?? ((Math.random() * 1e9) | 0), arena: { r: A.r, props, boost: spec.boost, name: spec.name }, sides: spec.sides, rules: spec.rules, bpm: spec.bpm || 120 });
      this.st.arena.props.forEach((p, i) => { p.rec = this.propMap.get(i); });
      if (spec.ambush) { this.st.flags.ambush = true; for (const u of this.st.units) if (u.side === 1 && u.onField) u.hp = Math.round(u.hp * 0.85); }
      this.ptr = playerTrainer(this.st) || this.st.trainers[0];
      // actors
      this.actors = new Map();
      for (const u of this.st.units) {
        const a = new Actor(this.gfx, creatureDesign(u.species), u.species, { scale: spec.scale?.[u.species] || 1 });
        a.setPos(this.origin.x + u.x, this.origin.y, this.origin.z + u.z); a.face(u.face, true);
        a.setVisible(u.onField);
        if (u.onField) { a.dissolve(-1, 0.5); a.play('spawn'); }
        a.anim.maxSpeed = 5;
        this.actors.set(u.id, a);
        u.lab = this.ui.label('unitlab' + (u.side ? ' enemy' : ''));
      }
      // trainers (human actors)
      this.trainerActors = new Map();
      const tcount = [0, 0];
      for (const T of this.st.trainers) {
        const act = spec.trainerActors && spec.trainerActors[T.id];
        if (!act) continue;
        const n = this.st.trainers.filter((t) => t.side === T.side).length, i = tcount[T.side]++;
        const lx = (i - (n - 1) / 2) * 3.4, lz = T.side === 0 ? A.r - 0.6 : -(A.r - 0.6);
        act.__saved = { x: act.pos.x, y: act.pos.y, z: act.pos.z, yaw: act.yaw };
        act.setPos(this.origin.x + lx, this.origin.y, this.origin.z + lz);
        act.face(T.side === 0 ? Math.PI : 0, true);
        this.trainerActors.set(T.id, act);
      }
      if (spec.hideActors) for (const a of spec.hideActors) a.setVisible(false);
      // camera
      const rig = this.gfx.rig;
      this.savedCam = { dist: rig.distT, pitch: rig.pitch, fov: rig.fovT, bounds: rig.bounds };
      rig.bounds = null; rig.distT = 16; rig.pitch = 0.66; rig.fovT = 32;
      rig.target.copy(this.origin);
      // HUD
      this.hud.build(this.st, this.me()?.id);
      this.active = true;
      this.acc = 0; this.timeScale = 1; this.aiming = null; this.paused = false; this.frozen = false;
      this.evHandlers = []; this.waiters = [];
      this.input(true);
      this.audio.music(spec.music || 'battle', { fade: 0.6 });
      // aim indicators
      this.aimGroup = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0x3ff0ff, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false });
      this.aimLine = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5), mat);
      this.aimRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2), mat.clone());
      this.aimRange = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }));
      this.aimGroup.add(this.aimLine, this.aimRing, this.aimRange); this.aimGroup.visible = false;
      this.gfx.scene.add(this.aimGroup);
      // intro
      if (spec.intro !== false) {
        const L = this.st.trainers.filter((t) => t.side === 0).map((t) => t.name).join(' & ');
        const R = this.st.trainers.filter((t) => t.side === 1).map((t) => t.name).join(' & ');
        this.frozen = true;
        this.audio.sfx('whoosh');
        await this.ui.cutin(spec.title || `${L}  VS  ${R}`, spec.subtitle || (this.st.rules.wild ? (this.st.rules.capture ? 'A wild Elemon appears!' : 'A wild beast attacks!') : 'Elemon battle!'), spec.colors || ['#ff4fa8', '#2fa8ff'], 1400);
        this.ui.callout('BATTLE START!', '', '#fff', 900);
        this.frozen = false;
      }
      if (spec.tutorial) spec.tutorial(this.controller()).catch((e) => console.error(e));
    });
  }

  // ------------------------------------------------------------------ tutorial controller
  controller() {
    const self = this;
    return {
      get st() { return self.st; }, get me() { return self.me(); }, scene: self,
      foe: () => self.st.units.find((u) => u.side === 1 && u.onField && u.state !== 'faint'),
      pauseAI(on) { for (const u of self.st.units) if (u.side === 1 || (u.side === 0 && u.trainer !== self.ptr.id)) { u.brain = u.brain || { t: 0, seen: new Set(), kiteDir: 1 }; u.brain.paused = on; } },
      freeze(on) { self.frozen = on; },
      tip: (text, target, opts = {}) => self.ui.tutorial(Object.assign({ text, target: typeof target === 'string' ? self.button(target) : target }, opts)),
      tipDone: () => self.ui.tutDone(),
      button: (n) => self.button(n),
      waitEvent(type, filter, timeout = 1e9) { return new Promise((res) => self.waiters.push({ type, filter, res, until: performance.now() + timeout })); },
      wait(sec) { return wait(sec * 1000); },
      foeCmd(c) { const f = this.foe(); if (f) command(self.st, f.id, c); },
      setNoFaint(on) { self.st.rules.noFaint = on; self.st.rules.noFaintFoe = on; },
    };
  }
  button(n) {
    const H = this.hud;
    return { attack: H.bAttack, dodge: H.bDodge, parry: H.bParry, grab: H.bGrab, charge: H.bCharge, skill0: H.sbtns[0], skill1: H.sbtns[1], skill2: H.sbtns[2], skill3: H.sbtns[3], ult: H.bUlt, team: H.bTeam, spectral: H.bSpec, item: H.bItem, capture: H.bCap, bench: H.bench }[n] || null;
  }

  // ------------------------------------------------------------------ input
  input(on) {
    const I = this.app.input;
    if (on) {
      this._h = [
        I.on('tap', (e) => this.onTap(e)),
        I.on('swipe', (e) => this.onSwipe(e)),
        I.on('wheel', (e) => { this.gfx.rig.distT = clamp(this.gfx.rig.distT * (1 + e.dy * 0.001), 9, 26); }),
        I.on('pinch', (e) => { this.gfx.rig.distT = clamp(this.gfx.rig.distT / e.scale, 9, 26); }),
        I.on('key', (e) => this.onKey(e)),
        I.on('hover', (e) => { this.mouse = e; }),
      ];
    } else if (this._h) { for (const off of this._h) off(); this._h = null; }
  }
  screenToWorld(x, y) {
    const ndc = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    this.ray.setFromCamera(ndc, this.gfx.camera);
    const p = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(this.plane, p)) return null;
    return { x: p.x - this.origin.x, z: p.z - this.origin.z };
  }
  screenDirToWorld(dx, dy) {
    const cam = this.gfx.camera;
    const r = new THREE.Vector3(), f = new THREE.Vector3();
    r.setFromMatrixColumn(cam.matrixWorld, 0); r.y = 0; r.normalize();
    cam.getWorldDirection(f); f.y = 0; f.normalize();
    const x = r.x * dx - f.x * dy, z = r.z * dx - f.z * dy;
    const l = Math.hypot(x, z) || 1;
    return [x / l, z / l];
  }
  pickUnit(x, y) {
    let best = null, bd = 60;
    for (const u of this.st.units) {
      if (!u.onField || u.state === 'faint') continue;
      const a = this.actors.get(u.id);
      const p = this.gfx.project(new THREE.Vector3(a.pos.x, a.pos.y + a.height * 0.5, a.pos.z));
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd + a.height * 18) { bd = d; best = u; }
    }
    return best;
  }
  onTap(e) {
    if (!this.active || this.st.over || this.st.qte) return;
    const u = this.pickUnit(e.x, e.y);
    const me = this.me();
    if (u && me && u.side !== me.side) { this.cmd({ type: 'target', id: u.id }); this.marker(u.x, u.z, 0xff3f5a); this.audio.sfx('ui_tap'); return; }
    const w = this.screenToWorld(e.x, e.y);
    if (!w) return;
    const d = Math.hypot(w.x, w.z), R = this.st.arena.r - 0.3;
    if (d > R) { w.x *= R / d; w.z *= R / d; }
    this.cmd({ type: 'move', x: w.x, z: w.z });
    this.marker(w.x, w.z, 0x3ff0ff);
  }
  onSwipe(e) {
    if (!this.active || this.st.over) return;
    const [dx, dz] = this.screenDirToWorld(e.dx, e.dy);
    if (this.cmd({ type: 'dodge', dx, dz })) this.audio.sfx('dodge');
  }
  dodge() {
    const me = this.me(); if (!me) return;
    let dx = 0, dz = 0;
    if (me.cmd && me.cmd.type === 'move') { dx = me.cmd.x - me.x; dz = me.cmd.z - me.z; }
    else { const t = unitById(this.st, me.target) || this.st.units.find((o) => o.side !== me.side && o.onField && o.state !== 'faint'); if (t) { dx = -(t.z - me.z); dz = t.x - me.x; if (Math.random() < 0.5) { dx = -dx; dz = -dz; } } }
    if (this.cmd({ type: 'dodge', dx, dz })) this.audio.sfx('dodge');
  }
  onKey(e) {
    if (!this.active || !e.down) return;
    const m = this.mouse ? this.screenToWorld(this.mouse.x, this.mouse.y) : null;
    const me = this.me(); if (!me) return;
    switch (e.code) {
      case 'Space': this.cmd({ type: 'attack', id: me.target || undefined }); break;
      case 'ShiftLeft': case 'ShiftRight': if (m) this.cmd({ type: 'dodge', dx: m.x - me.x, dz: m.z - me.z }); else this.dodge(); this.audio.sfx('dodge'); break;
      case 'KeyE': this.cmd({ type: 'parry' }); break;
      case 'KeyQ': this.cmd({ type: 'grab' }); break;
      case 'KeyF': this.cmd({ type: 'ult' }); break;
      case 'KeyT': trainerCommand(this.st, this.ptr.id, { type: 'team' }); break;
      case 'KeyX': this.cmd({ type: 'spectral' }); break;
      case 'KeyC': this.capture(); break;
      case 'Tab': trainerCommand(this.st, this.ptr.id, { type: 'switch' }); break;
      case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': {
        const i = +e.code.slice(5) - 1, id = me.skills[i];
        if (id) this.cmd(Object.assign({ type: 'skill', id }, m ? { x: m.x, z: m.z } : {}));
        break;
      }
      default: break;
    }
  }
  // skill aiming (drag from button) with tactical slow-motion
  aimStart(i) {
    const me = this.me(); if (!me) return;
    const id = me.skills[i], sk = SKILLS[id]; if (!sk) return;
    this.aiming = { i, sk, x: null, z: null, moved: false };
    this.timeScale = 0.3;
    if (sk.charge) this.cmd({ type: 'skill', id, hold: true });
    this.aimGroup.visible = true;
  }
  aimMove(i, dx, dy, moved) {
    const A = this.aiming; const me = this.me(); if (!A || !me) return;
    A.moved = moved;
    if (!moved) return;
    const [wx, wz] = this.screenDirToWorld(dx, dy);
    const len = Math.min(1, Math.hypot(dx, dy) / 130);
    const range = A.sk.range || 6;
    const d = A.sk.aim === 'point' ? Math.max(1, len * range) : range;
    A.x = me.x + wx * d; A.z = me.z + wz * d;
    if (A.sk.charge) this.cmd({ type: 'aim', x: A.x, z: A.z });
  }
  aimEnd(i, dx, dy, moved, cancel) {
    const A = this.aiming; this.aiming = null; this.timeScale = 1; this.aimGroup.visible = false;
    const me = this.me(); if (!A || !me) return;
    if (cancel) { if (A.sk.charge) this.cmd({ type: 'release' }); return; }
    if (A.sk.charge) { this.cmd(Object.assign({ type: 'release' }, A.x != null ? { x: A.x, z: A.z } : {})); return; }
    const c = { type: 'skill', id: A.sk.id };
    if (moved && A.x != null) { c.x = A.x; c.z = A.z; }
    if (!this.cmd(c)) this.audio.sfx('ui_error');
  }
  marker(x, z, color) {
    this.gfx.fx.shape({ kind: 'ring', pos: [this.origin.x + x, this.origin.y + 0.06, this.origin.z + z], r0: 0.6, r1: 0.15, life: 0.4, color, intensity: 2.5 });
  }
  useItem() {
    const T = this.ptr;
    const order = ['takoyaki', 'okonomiyaki', 'ramune', 'matcha', 'revive_onigiri'];
    const me = this.me();
    let pick = null;
    if (me && me.hp < me.maxHp * 0.6) pick = order.find((id) => (T.items[id] || 0) > 0 && (id === 'takoyaki' || id === 'okonomiyaki'));
    if (!pick) pick = order.find((id) => (T.items[id] || 0) > 0);
    if (!pick) { this.ui.toast('No usable items!'); this.audio.sfx('ui_error'); return; }
    if (trainerCommand(this.st, T.id, { type: 'item', id: pick })) this.audio.sfx('bio_heal');
  }
  capture() {
    if (!this.st.rules.capture) return;
    const gems = this.spec.gems ? this.spec.gems() : null;
    if (!gems) { this.ui.toast('No gems for the keychain!'); return; }
    const foe = this.st.units.find((u) => u.side === 1 && u.onField && u.state !== 'faint');
    if (!foe) return;
    const mul = gems.mul(foe);
    if (trainerCommand(this.st, this.ptr.id, { type: 'capture', gem: gems.id, gemMul: mul })) { gems.consume(); this.audio.sfx('capture_throw'); }
  }

  // ------------------------------------------------------------------ frame
  update(dt) {
    if (!this.active) return;
    const st = this.st;
    // QTE owned by the player
    if (st.qte && !this.qteBusy) {
      const q = st.qte;
      const owner = unitById(st, q.owner);
      if (owner && owner.trainer === this.ptr.id) {
        this.qteBusy = true;
        if (q.kind === 'ult') { const sk = owner.act && owner.act.sk; this.ui.cutin(owner.name, sk ? sk.name : 'ULTIMATE', [elemColor(owner.elem), '#1b1230'], 900); this.gfx.speedLines = 1; }
        if (q.kind === 'team') this.gfx.speedLines = 0.8;
        setTimeout(() => this.qte.run(q, { bpm: st.beat.bpm }).then((score) => { resolveQte(st, q.id, score); this.qteBusy = false; this.gfx.speedLines = 0; }), q.kind === 'ult' ? 950 : 50);
      }
    }
    // fixed-step sim with slow-mo / hit-stop / aiming bullet-time
    let scale = this.frozen ? 0 : this.timeScale;
    if (st.slowmo > 0) scale *= 0.35;
    if (st.hitstop > 0) scale *= 0.12;
    this.acc += dt * scale;
    let steps = 0;
    while (this.acc >= DT && steps < 4) { step(st, DT); this.acc -= DT; steps++; this.handleEvents(st.events); }
    this.gfx.desat = st.slowmo > 0.2 ? 0.25 : 0;
    this.sync(dt);
    this.hud.update(st, this.me()?.id, dt);
    for (let i = 0; i < this.waiters.length; i++) { const w = this.waiters[i]; if (performance.now() > w.until) { this.waiters.splice(i, 1); i--; w.res(null); } }
    if (st.over && !this.ending) this.end();
  }

  sync(dt) {
    const st = this.st, o = this.origin;
    // camera framing
    const on = st.units.filter((u) => u.onField && u.state !== 'faint');
    if (on.length && !this.ending) {
      let cx = 0, cz = 0; for (const u of on) { cx += u.x; cz += u.z; } cx /= on.length; cz /= on.length;
      const me = this.me(); if (me) { cx = cx * 0.6 + me.x * 0.4; cz = cz * 0.6 + me.z * 0.4; }
      let spread = 0; for (const u of on) spread = Math.max(spread, Math.hypot(u.x - cx, u.z - cz));
      this.gfx.rig.target.set(o.x + cx, o.y + 0.6, o.z + cz);
      if (!this.userZoom) this.gfx.rig.distT = clamp(11 + spread * 1.2, 11, 22);
    }
    for (const u of st.units) {
      const a = this.actors.get(u.id);
      if (!a) continue;
      const vis = u.onField || u.state === 'faint' && a.visible;
      if (!u.onField && a.visible && !a._leaving && u.state !== 'faint') { a._leaving = true; a.dissolve(1, 0.35); setTimeout(() => { a.setVisible(false); a._leaving = false; }, 380); }
      if (u.onField && !a.visible) { a.setVisible(true); a.dissolve(-1, 0.45); a.play('spawn'); }
      const tx = o.x + u.x, tz = o.z + u.z, ty = o.y + (u.y || 0);
      const k = damp(22, dt);
      a.pos.x += (tx - a.pos.x) * k; a.pos.z += (tz - a.pos.z) * k; a.pos.y += (ty - a.pos.y) * k;
      a.face(u.face);
      a.anim.setSpeed(u.dash ? 6 : (u.moving || 0));
      // status visuals
      const frozen = u.st.some((s) => s.s === 'frozen'), poison = u.st.some((s) => s.s === 'poison'), burn = u.st.some((s) => s.s === 'burn');
      const tintKey = frozen ? 'f' : poison ? 'p' : burn ? 'b' : '';
      if (a._tint !== tintKey) { a._tint = tintKey; if (frozen) a.setTint(0x8fe8ff, 0.7); else if (poison) a.setTint(0xb46bff, 0.35); else if (burn) a.setTint(0xff8a3a, 0.3); else a.setTint(0xffffff, 0); }
      a.anim.lookAt(0, 0);
      if (u.onField && u.state !== 'faint') {
        // aura orb & charge glow & spectral
        if (u.aura && Math.random() < dt * 8) { const c = new THREE.Color(ELEM_COL[u.aura.e]); this.gfx.fx.particle({ pos: [a.pos.x + (Math.random() - 0.5) * 0.4, a.pos.y + a.height + 0.1, a.pos.z + (Math.random() - 0.5) * 0.4], vel: [0, 0.4, 0], life: 0.5, size: 0.2, color: [c.r * 2.5, c.g * 2.5, c.b * 2.5, 1], color1: [c.r, c.g, c.b, 0], sprite: SPR.dot }); }
        const charging = u.charge || (u.act && u.act.phase === 'charge');
        if (charging && Math.random() < dt * 30) { const c = new THREE.Color(ELEM_COL[u.elem]); const ang = Math.random() * 6.28, r = 1.4; this.gfx.fx.particle({ pos: [a.pos.x + Math.cos(ang) * r, a.pos.y + 0.4 + Math.random() * a.height, a.pos.z + Math.sin(ang) * r], vel: [-Math.cos(ang) * 4, 0.3, -Math.sin(ang) * 4], life: 0.32, size: 0.18, color: [c.r * 3, c.g * 3, c.b * 3, 1], color1: [c.r * 2, c.g * 2, c.b * 2, 0], sprite: SPR.dot }); }
        if (u.heat >= 100 && Math.random() < dt * 20) this.gfx.fx.particle({ pos: [a.pos.x + (Math.random() - 0.5) * 0.8, a.pos.y + 0.2, a.pos.z + (Math.random() - 0.5) * 0.8], vel: [0, 2, 0], life: 0.5, size: 0.3, size1: 0.05, color: [3, 1.4, 0.3, 1], color1: [2, 0.2, 0, 0], sprite: SPR.flame });
        if (u.iframes > 0 && u.dash && Math.random() < 0.6) this.gfx.fx.particle({ pos: [a.pos.x, a.pos.y + a.height * 0.5, a.pos.z], life: 0.25, size: a.height * 0.9, color: [0.6, 0.9, 1.4, 0.35], color1: [0.4, 0.6, 1, 0], sprite: SPR.dot2 });
        if (u.parryT > 0 && !a._parryFx) { a._parryFx = true; this.gfx.fx.shape({ kind: 'sphere', pos: [a.pos.x, a.pos.y + a.height * 0.5, a.pos.z], r0: a.height * 0.6, r1: a.height * 0.75, life: 0.3, color: 0xffe36b, intensity: 1.4 }); }
        if (u.parryT <= 0) a._parryFx = false;
        if (u.shield > 0 && Math.random() < dt * 6) this.gfx.fx.particle({ pos: [a.pos.x + (Math.random() - 0.5) * a.height, a.pos.y + Math.random() * a.height, a.pos.z + (Math.random() - 0.5) * a.height], life: 0.5, size: 0.18, color: [0.6, 1.4, 2.2, 1], color1: [0.4, 0.8, 1.6, 0], sprite: SPR.shard, spin: 4 });
        const sleeping = u.st.some((s) => s.s === 'sleep'); if (sleeping && Math.random() < dt * 1.5) a.emote('zz');
        const stunned = u.st.some((s) => s.s === 'stun') || u.state === 'stagger'; if (stunned && Math.random() < dt * 5) this.gfx.fx.particle({ pos: [a.pos.x + Math.cos(this.gfx.time * 6) * 0.4, a.pos.y + a.height + 0.15, a.pos.z + Math.sin(this.gfx.time * 6) * 0.4], life: 0.3, size: 0.18, color: [2.4, 2.2, 0.6, 1], color1: [2, 2, 0.5, 0], sprite: SPR.star5 });
        a.setSpectral(u.spectral > 0);
        if (u.spectral > 0 && Math.random() < dt * 14) this.gfx.fx.particle({ pos: [a.pos.x + (Math.random() - 0.5) * 0.8, a.pos.y + Math.random() * a.height, a.pos.z + (Math.random() - 0.5) * 0.8], vel: [0, 1.2, 0], life: 0.7, size: 0.22, color: [0.8, 1.6, 2.6, 1], color1: [1.6, 0.6, 2.2, 0], sprite: SPR.star });
      }
      a.update(dt);
      // label
      const head = a.headPos(this._v || (this._v = new THREE.Vector3()));
      const p = this.gfx.project(head);
      if (u.lab) {
        const show = u.onField && u.state !== 'faint' && p.visible;
        this.ui.place(u.lab, p.x, p.y, show);
        if (show) {
          const f = Math.max(0, u.hp / u.maxHp);
          const key = Math.round(f * 100) + '|' + (u.aura ? u.aura.e : '') + '|' + u.st.length;
          if (u.lab._k !== key) {
            u.lab._k = key;
            u.lab.innerHTML = `<div class="nm">${u.aura ? `<i class="aura" style="color:${ELEM_COL[u.aura.e]};background:${ELEM_COL[u.aura.e]};display:inline-block"></i> ` : ''}${u.name}</div><div class="hp"><b style="width:${f * 100}%"></b><i style="width:${f * 100}%"></i></div>`;
          }
        }
      }
    }
    for (const [, a] of this.trainerActors) a.update(dt);
    // projectiles, zones, walls, telegraphs
    for (const pr of st.proj) { if (!this.vfx.proj.has(pr.id)) this.vfx.projStart(Object.assign({}, pr, { x: o.x + pr.x, z: o.z + pr.z })); this.vfx.projUpdate(Object.assign({}, pr, { x: o.x + pr.x, z: o.z + pr.z }), dt, o.y + 0.6); }
    this.vfx.zoneUpdate(dt, st.zones.map((z) => Object.assign({}, z, { x: o.x + z.x, z: o.z + z.z })));
    this.vfx.wallUpdate(dt);
    this.vfx.teleSync(st.tele.map((t) => Object.assign({}, t, { x: o.x + t.x, z: o.z + t.z })), 0);
    for (const tr of st.traps) if (Math.random() < dt * 3) this.gfx.fx.particle({ pos: [o.x + tr.x, o.y + 0.4, o.z + tr.z], vel: [0, 0.3, 0], life: 0.8, size: 0.5, color: [0.6, 1.2, 1.8, 0.7], color1: [0.6, 1.2, 1.8, 0], sprite: SPR.bubble, additive: false });
    for (const s of st.seeds) if (Math.random() < dt * 4) this.gfx.fx.particle({ pos: [o.x + s.x, o.y + 0.3, o.z + s.z], vel: [0, 0.6, 0], life: 0.7, size: 0.3, color: [1.6, 2.4, 1, 1], color1: [1, 2, 1, 0], sprite: SPR.flower, spin: 2 });
    // aim indicator
    if (this.aiming && this.aimGroup.visible) {
      const me = this.me(), A = this.aiming;
      if (me) {
        const mx = o.x + me.x, mz = o.z + me.z;
        const range = A.sk.range || 6;
        this.aimRange.position.set(mx, o.y + 0.07, mz); this.aimRange.scale.set(range, 1, range);
        const ax = A.x != null ? o.x + A.x : mx + Math.sin(me.face) * range, az = A.z != null ? o.z + A.z : mz + Math.cos(me.face) * range;
        if (A.sk.aim === 'point' || A.sk.aim === 'self') {
          const r = (A.sk.eff.find((e) => e.r)?.r) || 1.5;
          this.aimRing.visible = true; this.aimLine.visible = A.sk.aim !== 'self';
          if (A.sk.aim === 'self') this.aimRing.position.set(mx, o.y + 0.08, mz); else this.aimRing.position.set(ax, o.y + 0.08, az);
          this.aimRing.scale.set(r, 1, r);
        } else { this.aimRing.visible = false; this.aimLine.visible = true; }
        const dx = ax - mx, dz = az - mz, L = Math.hypot(dx, dz) || 0.01;
        this.aimLine.position.set(mx, o.y + 0.07, mz); this.aimLine.rotation.y = Math.atan2(dx, dz); this.aimLine.scale.set(A.sk.eff.find((e) => e.width)?.width || 0.5, 1, L);
      }
    }
  }

  // ------------------------------------------------------------------ events → presentation
  handleEvents(evs) {
    const st = this.st, o = this.origin, U = (id) => unitById(st, id), A = (id) => this.actors.get(id);
    const wpos = (u, yk = 0.5) => { const a = A(u.id); return new THREE.Vector3(a.pos.x, a.pos.y + a.height * yk, a.pos.z); };
    for (const e of evs) {
      for (let i = 0; i < this.waiters.length; i++) { const w = this.waiters[i]; if (w.type === e.type && (!w.filter || w.filter(e))) { this.waiters.splice(i, 1); i--; w.res(e); } }
      switch (e.type) {
        case 'anim': { const a = A(e.u); if (!a) break; if (e.anim) a.play(e.anim); if ('mode' in e) a.mode(e.mode); break; }
        case 'hit': {
          const t = U(e.tgt); if (!t) break;
          const a = A(t.id), p = wpos(t);
          this.vfx.hit(p, e.elem, { crit: e.crit, big: e.dmg > t.maxHp * 0.15, precise: e.precise });
          a.flash(e.crit ? 0xffe36b : 0xffffff, 0.1);
          const sp = this.gfx.project(new THREE.Vector3(p.x, p.y + a.height * 0.6, p.z));
          const cls = e.kind === 'dot' ? 'weak' : e.crit ? 'crit' : e.eff > 1.2 ? 'eff' : e.eff < 0.8 ? 'weak' : '';
          this.ui.pop(sp.x, sp.y, (e.precise ? '🎯' : '') + e.dmg, cls);
          if (e.eff > 1.2 && e.kind !== 'dot' && Math.random() < 0.6) this.ui.pop(sp.x, sp.y - 26, effLabel(e.eff), 'tag');
          if (e.kind !== 'dot') { this.audio.sfx(e.crit ? 'crit' : e.dmg > t.maxHp * 0.12 ? 'hit_heavy' : 'hit_light', { pitch: 0.9 + Math.random() * 0.2 }); if (e.dmg > t.maxHp * 0.1 || e.crit) this.gfx.rig.shake(e.crit ? 0.3 : 0.15); }
          break;
        }
        case 'miss': { const t = U(e.u); if (!t) break; const p = this.gfx.project(wpos(t, 1.1)); this.ui.pop(p.x, p.y, e.blind ? 'MISS' : 'DODGE', 'weak'); break; }
        case 'perfectDodge': { const t = U(e.u); this.ui.callout('PERFECT DODGE!', 'Counter now for a guaranteed crit', '#3ff0ff', 900); this.audio.sfx('perfect_parry', { pitch: 1.3 }); if (t) A(t.id).emote('star'); break; }
        case 'parry': {
          const t = U(e.u); if (!t) break;
          this.ui.callout(e.perfect ? 'PERFECT PARRY!' : 'PARRY!', e.perfect ? 'Riposte — attack now!' : '', '#ffe36b', 850);
          this.audio.sfx(e.perfect ? 'perfect_parry' : 'parry');
          const p = wpos(t); this.gfx.fx.shape({ kind: 'ring', pos: [p.x, p.y, p.z], r0: 0.4, r1: 2.2, life: 0.35, color: 0xffe36b, intensity: 3, vertical: true, yaw: t.face });
          this.gfx.flash(0xfff6c0, e.perfect ? 0.35 : 0.15); this.gfx.impact(e.perfect ? 0.7 : 0.35);
          break;
        }
        case 'stagger': { const t = U(e.u); if (t) A(t.id).emote('star'); break; }
        case 'reaction': {
          this.vfx.reaction(e.id, o.x + e.x, o.z + e.z, e.color);
          this.ui.callout(e.name, `${ELEMENTS[e.a]?.icon || ''} + ${ELEMENTS[e.b]?.icon || ''}`, e.color, 1300);
          this.audio.sfx(e.id === 'steam' ? 'steam_explosion' : 'reaction');
          break;
        }
        case 'combo': { this.ui.callout(e.name.toUpperCase(), 'COMBO!', '#ff8ad8', 1000); this.audio.sfx('combo'); break; }
        case 'teamCombo': this.ui.cutin(e.name, e.desc, ['#2fa8ff', '#a6ff4a'], 1000); break;
        case 'teamComboHit': {
          this.vfx.burst(o.x + e.x, o.z + e.z, e.r, U(e.a)?.elem || 'none', { up: 4 });
          const b = U(e.b); if (b) this.vfx.burst(o.x + e.x, o.z + e.z, e.r * 0.8, b.elem, { up: 2 });
          this.ui.callout(e.name.toUpperCase(), e.score >= 0.95 ? 'PERFECT SYNC!' : 'TEAM COMBO!', '#a6ff4a', 1400);
          this.gfx.flash(0xffffff, 0.4); this.audio.sfx('team_combo');
          if (e.b && !U(e.b).onField) { const ab = A(e.b); const me = this.me(); if (ab && me) { ab.setVisible(true); ab.setPos(o.x + me.x + 1, o.y, o.z + me.z); ab.play('cast'); ab.dissolve(-1, 0.25); setTimeout(() => { ab.dissolve(1, 0.4); setTimeout(() => ab.setVisible(false), 420); }, 900); } }
          break;
        }
        case 'ult': { const u = U(e.u); if (u && u.trainer !== this.ptr.id) this.ui.cutin(u.name, e.name, [elemColor(u.elem), '#1b1230'], 900); this.audio.setIntensity && this.audio.setIntensity(1); break; }
        case 'cast': {
          const u = U(e.u); if (!u) break;
          if (e.phase === 'release') { const sk = SKILLS[e.skill]; this.audio.sfx(SFX_ELEM[sk?.elem] || 'whoosh', { vol: 0.8 }); if (e.mult > 1.4) this.gfx.impact(0.4); }
          if (e.phase === 'charge') this.audio.sfx('charge', { vol: 0.6 });
          break;
        }
        case 'burst': this.vfx.burst(o.x + e.x, o.z + e.z, e.r, e.elem || 'none', { small: e.small, crack: e.crack, up: e.up, y: o.y }); if (!e.small) this.audio.sfx(e.elem === 'geo' ? 'slam' : (SFX_ELEM[e.elem] || 'reaction') + (e.elem === 'pyro' ? '_boom' : ''), { vol: 0.8 }); break;
        case 'line': this.vfx.line(o.x + e.x, o.z + e.z, e.dx, e.dz, e.range, e.width, e.elem); this.audio.sfx(e.elem === 'geo' ? 'geo_wall' : 'whoosh'); break;
        case 'cone': { const u = U(e.u); if (u) this.vfx.cone(o.x + u.x, o.z + u.z, e.dx, e.dz, e.range, e.arc, e.elem); break; }
        case 'aoeWarn': this.gfx.fx.decal('glyph', [o.x + e.x, o.y, o.z + e.z], e.r * 2, e.side === 0 ? 0x3ff0ff : 0xff3f5a, e.delay + 0.2, true); break;
        case 'projEnd': this.vfx.projEnd(e.id, o.x + e.x, o.z + e.z); break;
        case 'ricochet': this.audio.sfx('hydro', { pitch: 1.5, vol: 0.5 }); break;
        case 'reflect': this.ui.callout('REFLECT!', '', '#ffe36b', 700); break;
        case 'zone': this.vfx.zoneStart(Object.assign({}, e, { x: o.x + e.x, z: o.z + e.z })); break;
        case 'zoneEnd': this.vfx.zoneEnd(e.id); break;
        case 'wall': { const w = st.walls.find((x) => x.id === e.id); if (w) this.vfx.wallStart({ id: w.id, x1: o.x + w.x1, z1: o.z + w.z1, x2: o.x + w.x2, z2: o.z + w.z2 }); this.audio.sfx('geo_wall'); break; }
        case 'wallBreak': this.vfx.wallEnd(e.id, true); this.audio.sfx('destroy_wood'); break;
        case 'wallEnd': this.vfx.wallEnd(e.id, false); break;
        case 'trap': this.vfx.burst(o.x + e.x, o.z + e.z, 1.2, 'hydro', { small: true }); this.audio.sfx('hydro_splash'); break;
        case 'destroy': {
          const p = st.arena.props.find((x) => x.id === e.id);
          if (p && p.rec) destroyProp(this.app.world.env, p.rec, this.gfx.fx);
          this.gfx.impact(0.5); this.audio.sfx(p && /sign|vending|lamp|neon|board/.test(p.kind) ? 'destroy_glass' : /barrel|bin|cone|car|bike|metal/.test(p && p.kind) ? 'destroy_metal' : 'destroy_wood');
          break;
        }
        case 'faint': {
          const u = U(e.u); if (!u) break;
          const a = A(u.id);
          if (u.side === 1) this.ui.callout('KNOCKED OUT!', u.name, '#ff8ad8', 1000);
          this.audio.sfx('ko');
          setTimeout(() => { if (u.state === 'faint') { a.dissolve(1, 0.8, u.side === 0 ? 0x3ff0ff : 0xff8ad8); setTimeout(() => a.setVisible(false), 850); } }, 900);
          break;
        }
        case 'switch': {
          const inn = U(e.in); if (!inn) break;
          this.ui.callout(inn.name + '!', 'Switch in', elemColor(inn.elem), 700);
          this.audio.sfx('switch');
          const T = st.trainers.find((t) => t.id === e.trainer); const ta = T && this.trainerActors.get(T.id);
          if (ta) ta.play('command');
          if (inn.side === 0 && inn.trainer === this.ptr.id) this.hud.build(st, inn.id);
          break;
        }
        case 'status': { const u = U(e.u); if (u && STATUS_EMOTE[e.s]) A(u.id).emote(STATUS_EMOTE[e.s]); break; }
        case 'heal': { const u = U(e.u); if (!u) break; const p = this.gfx.project(wpos(u, 1)); this.ui.pop(p.x, p.y, '+' + e.amt, 'heal'); if (Math.random() < 0.5) A(u.id).emote('heart'); break; }
        case 'healFx': { for (const id of e.who || []) { const u = U(id); if (!u) continue; const p = wpos(u, 0.2); this.gfx.fx.burst(14, () => ({ pos: [p.x + (Math.random() - 0.5), p.y, p.z + (Math.random() - 0.5)], vel: [0, 1.5 + Math.random(), 0], life: 0.9, size: 0.22, color: [0.8, 2.4, 1, 1], color1: [0.6, 1.6, 0.8, 0], sprite: SPR.cross })); } this.audio.sfx('bio_heal'); break; }
        case 'buffFx': { const u = U(e.u); if (u) { const p = wpos(u, 0.1); this.gfx.fx.shape({ kind: 'pillar', pos: [p.x, p.y, p.z], r0: 0.8, r1: 0.9, h0: 2.2, life: 0.6, color: ELEM_COL[e.elem] || '#fff', intensity: 1.5 }); } break; }
        case 'shield': { const u = U(e.u); if (u) { const p = wpos(u); this.gfx.fx.shape({ kind: 'sphere', pos: [p.x, p.y, p.z], r0: 0.5, r1: 1.3, life: 0.5, color: 0x8fe8ff, intensity: 2 }); } break; }
        case 'onBeat': { const u = U(e.u); if (u) { const p = wpos(u, 1.05); this.gfx.fx.particle({ pos: [p.x, p.y, p.z], vel: [0, 1, 0], life: 0.6, size: 0.35, color: [2, 1.2, 2.6, 1], color1: [1, 1, 2, 0], sprite: SPR.note }); if (u.trainer === this.ptr.id) this.ui.pop(this.gfx.project(p).x, this.gfx.project(p).y, 'ON BEAT!', 'tag'); } break; }
        case 'overheat': this.ui.callout('OVERHEAT!', 'Charged attack +50%', '#ff6a2b', 900); this.audio.sfx('pyro_boom'); break;
        case 'spectral': {
          const u = U(e.u); if (!u) break;
          this.ui.cutin('SOUL STONE RESONANCE', `${u.name} — SPECTRAL FORM!`, ['#8a5aff', '#3ff0ff'], 1400);
          this.gfx.flash(0xc8f0ff, 0.7); this.audio.sfx('evolve_burst'); this.audio.stinger && this.audio.stinger('spectral');
          const p = wpos(u, 0); this.gfx.fx.shape({ kind: 'pillar', pos: [p.x, p.y, p.z], r0: 0.3, r1: 1.6, h0: 8, life: 1.2, color: 0x9fd8ff, intensity: 3, hold: 0.5 });
          break;
        }
        case 'grab': { this.audio.sfx('grab'); break; }
        case 'struggle': {
          const g = U(e.grabber);
          if (g && g.trainer === this.ptr.id) { this.ui.callout('PARRY NOW!', 'They are struggling free', '#ffe36b', 700); this.hud.bParry.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300, iterations: 2 }); }
          break;
        }
        case 'escape': this.ui.callout('ESCAPED!', '', '#3ff0ff', 700); break;
        case 'slam': this.vfx.burst(o.x + e.x, o.z + e.z, e.r, 'geo', { crack: true, up: 3 }); this.audio.sfx('slam'); break;
        case 'leap': this.audio.sfx('whoosh'); break;
        case 'land': if (e.heavy) { this.gfx.impact(0.4); } break;
        case 'wallSlam': case 'bowl': this.gfx.impact(0.5); this.audio.sfx('hit_heavy'); break;
        case 'disobey': { const u = U(e.u); if (u) { const p = this.gfx.project(wpos(u, 1.1)); this.ui.pop(p.x, p.y, 'ignores you…', 'tag'); A(u.id).emote('sweat'); } break; }
        case 'noEnergy': if (U(e.u)?.trainer === this.ptr.id) this.ui.toast('Not enough energy', '', 900); break;
        case 'sync': this.audio.sfx('notification', { vol: 0.4, pitch: 1.5 }); break;
        case 'chain': { const a = U(e.a), b = U(e.b); if (a && b) { const pa = wpos(a), pb = wpos(b); for (let i = 0; i < 8; i++) { const t = i / 8; this.gfx.fx.particle({ pos: [pa.x + (pb.x - pa.x) * t, pa.y + (pb.y - pa.y) * t + (Math.random() - 0.5) * 0.4, pa.z + (pb.z - pa.z) * t], life: 0.2, size: 0.35, color: [2.4, 2.4, 0.8, 1], color1: [1.6, 1.6, 2.4, 0], sprite: SPR.bolt, rot: Math.random() * 6 }); } } break; }
        case 'captureThrow': {
          const T = st.trainers.find((t) => t.id === e.trainer); const ta = T && this.trainerActors.get(T.id); if (ta) ta.play('throwKey');
          this.ui.callout('KEYCHAIN, GO!', `${Math.round(e.chance * 100)}% base chance`, '#a6ff4a', 900);
          break;
        }
        case 'captureShake': {
          const u = U(e.tgt); if (!u) break; const a = A(u.id);
          a.dissolve(1, 0.5, 0xa6ff4a);
          const p = wpos(u);
          this.gfx.fx.shape({ kind: 'pillar', pos: [p.x, o.y, p.z], r0: 0.2, r1: 0.9, h0: 3, life: 0.8, color: 0xa6ff4a, intensity: 2.5 });
          for (let i = 0; i < e.shakes; i++) setTimeout(() => { this.ui.callout(String(i + 1) + '…', '', '#fff', 500); this.audio.sfx('capture_shake'); }, 700 * (i + 1));
          if (!e.ok) setTimeout(() => { a.dissolve(-1, 0.3); this.ui.callout('IT BROKE FREE!', 'It looks angrier…', '#ff8a2b', 1000); this.audio.sfx('capture_fail'); }, 700 * (e.shakes + 1));
          break;
        }
        case 'captured': this.ui.callout('GOTCHA!', 'Soul link established', '#a6ff4a', 1600); this.audio.sfx('capture_success'); this.audio.stinger && this.audio.stinger('capture'); break;
        case 'captureImmune': this.ui.callout('CAN\'T BE CAUGHT!', 'Wild beasts reject soul links', '#ff4b5c', 1200); break;
        case 'interrupt': { const u = U(e.u); if (u) A(u.id).emote('!'); break; }
        case 'item': this.ui.toast('Used ' + e.id.replace('_', ' ')); break;
        case 'wake': { const u = U(e.u); if (u) A(u.id).emote('!'); break; }
        default: break;
      }
    }
  }

  // ------------------------------------------------------------------ end
  async end() {
    this.ending = true;
    const st = this.st, r = st.result;
    this.input(false);
    this.aimGroup.visible = false;
    const won = r.winner === 0;
    for (const u of st.units) { const a = this.actors.get(u.id); if (u.onField && u.state !== 'faint' && a) { if (u.side === r.winner) a.play('victory'); } }
    for (const [id, ta] of this.trainerActors) { const T = st.trainers.find((t) => t.id === id); ta.play(T.side === r.winner ? 'cheer' : 'shrug'); }
    this.audio.music(null, { fade: 0.3 });
    this.audio.stinger && this.audio.stinger(won ? 'victory' : 'defeat');
    if (r.reason !== 'capture') this.ui.callout(won ? 'VICTORY!' : r.reason === 'flee' ? 'GOT AWAY…' : 'DEFEAT…', won ? '' : 'Your Elemon need rest', won ? '#ffe36b' : '#9fb3ff', 2200);
    this.gfx.rig.distT = 9;
    await wait(2300);
    this.cleanup();
    this.resolve(r);
  }
  cleanup() {
    this.active = false; this.ending = false;
    this.hud.hide();
    this.ui.tutDone();
    this.qte.active && this.qte.active.cancel();
    for (const [, a] of this.actors) a.dispose();
    this.actors.clear();
    for (const u of this.st.units) if (u.lab) { this.ui.freeLabel(u.lab); u.lab = null; }
    for (const [, ta] of this.trainerActors) { if (ta.__saved) { ta.setPos(ta.__saved.x, ta.__saved.y, ta.__saved.z); ta.face(ta.__saved.yaw, true); } }
    this.trainerActors.clear();
    if (this.spec.hideActors) for (const a of this.spec.hideActors) a.setVisible(true);
    this.vfx.clear();
    this.gfx.scene.remove(this.aimGroup);
    const rig = this.gfx.rig; rig.distT = this.savedCam.dist; rig.pitch = this.savedCam.pitch; rig.fovT = this.savedCam.fov; rig.bounds = this.savedCam.bounds;
    this.gfx.speedLines = 0; this.gfx.desat = 0;
    this.input(false);
  }
}
