// Battle3D: the real-time Tokonmon battle sim (battle/sim.js) staged right where
// you are — the location's arena spot — with the 3D models acting out every event:
// wind-ups and attacks, specials, hits, dodges, faints; projectiles fly, zones
// glow on the ground, element particles burst on impact, damage numbers pop.
// Controls: tap a skill (your partner obeys after a short beat — BOND removes the
// delay), ATTACK, DODGE, BOND / ULT, SWAP, EMOTE, CATCH, RUN; tap the ground to
// move, tap a foe to target. Keys: 1-4 skills, Space attack, Shift dodge, B bond,
// F ult, Tab swap, E emote, C catch, R run.
import * as THREE from '../../../vendor/three.module.js';
import { createBattle, step, DT, order, trainerCommand, unitById, playerTrainer, cooldownFrac, skillCost, skillName, switchLeft, EMOTES, ARENA_TYPES, resumeMatch } from '../../battle/sim.js';
import { T } from '../../px/game/ui.js';
import { SKILLS } from '../../data/skills.js';
import { SPECIES } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { createElemon, battleSnapshot, gainExp, addFriendship, evolutionOptions, evolve } from '../../game/elemon.js';
import { BattleTracker } from '../../data/progress.js';
import { weatherOf } from '../../game/time.js';
import * as S from '../../game/state.js';

const ELC = (e) => (ELEMENTS[e] && ELEMENTS[e].color) || '#ffffff';
const HIT_FX = { pyro: 'fire', hydro: 'splash', bio: 'leaf', volto: 'bolt', geo: 'rock', echo: 'note', ecto: 'ghostfire', cryo: 'sparkle', ferro: 'shard', aero: 'dust', astro: 'star', nucleo: 'ember', draco: 'ghostfire' };
const MELEE = new Set(['attack', 'bite', 'slash', 'peck', 'punch', 'kick', 'ram', 'bigHit', 'slam', 'parry', 'grab', 'dodge']);
const _v = new THREE.Vector3(), _r = new THREE.Raycaster(), _p = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _n = new THREE.Vector2();

export class Battle3D {
  constructor(app) { this.app = app; this.active = false; this.units = new Map(); }
  // spec: { foe: { name, team: [[species, level, opts]], ai }, foes, allies, title, subtitle, tutorial, wild, rules, arenaType, money, only, partySize }
  start(spec) {
    return new Promise((resolve) => this._start(spec, resolve).catch((e) => { console.error(e); this.active = false; resolve({ winner: 0, error: true }); }));
  }
  async _start(spec, resolve) {
    const app = this.app, s = app.state, w = app.world, L = w.loc, A = spec.arena || L.arena || (w.sc && w.sc.arena) || { at: [w.cam.target.x, w.cam.target.z], r: 5 };
    this.resolve = resolve; this.spec = spec; this.prevCam = { target: w.cam.target.toArray(), dist: w.cam.dist, yaw: w.cam.yaw, pitch: w.cam.pitch };
    const mine = (spec.only || S.battleTeam(s, spec.partySize || 3)).map((m) => battleSnapshot(m, s.unlocks.slots));
    const npcSnap = ([sp, lv, o]) => { const m = createElemon(sp, { level: lv, wild: true, friendship: 100, ...(o || {}) }); for (const [l, id] of SPECIES[sp].learn) if (l <= lv && !m.skills.known.includes(id)) m.skills.known.push(id); m.skills.active = m.skills.known.filter((id) => SKILLS[id] && SKILLS[id].kind === 'active').slice(0, 4); return battleSnapshot(m); };
    const items = {}; for (const id of Object.keys(s.bag)) if (s.bag[id] > 0) items[id] = s.bag[id];
    const foes = spec.foes || [spec.foe];
    this.st = createBattle({
      seed: (Math.random() * 1e9) | 0, arena: { r: spec.arenaR || 8, type: spec.arenaType },
      sides: [
        { trainers: [{ id: 'player', name: s.player.name, isPlayer: true, team: mine, items, canBond: !!s.flags.bracelet }, ...(spec.allies || []).map((a, i) => ({ id: 'ally' + i, name: a.name, ai: a.ai || 'normal', team: a.team.map(npcSnap) }))] },
        { trainers: foes.map((f, i) => ({ id: 'foe' + i, name: f.name, ai: f.ai || 'normal', team: f.team.map(npcSnap) })) },
      ],
      rules: Object.assign({ items: true }, spec.wild ? { wild: true, capture: !!s.flags.license, flee: true } : {}, spec.rules || {}),
    });
    this.ptr = playerTrainer(this.st);
    // progress: battle events count toward skill unlocks and evolution conditions
    const byUid = {}; for (const m of [...s.party, ...(s.box || [])]) byUid[m.uid] = m;
    this.tracker = new BattleTracker(this.st, 0, byUid);
    // the arena in the world: sim (x, z) → world, the player's side on the left of the camera
    const C = A.cam || {}, yaw = ((C.yaw ?? 0) * Math.PI) / 180;
    this.cx = A.at[0]; this.cz = A.at[1]; this.k = (A.r || 5) / this.st.arena.r; this.phi = yaw - Math.PI / 2; this.gy = w.ground(this.cx, this.cz);
    this.hidden = [];
    for (const a of w.actors.values()) { const p = a.g.position; if (Math.hypot(p.x - this.cx, p.z - this.cz) < (A.r || 5) + 1.2) { a.g.visible = false; this.hidden.push(a); } }
    this.units = new Map();
    for (const u of this.st.units) {
      const a = await w.addMon('bu-' + u.id, u.model || u.species, [this.cx, this.cz, 0], { drip: u.drip || 1, look: u.look || 0 });
      a.g.visible = false; a.life = null;
      this.units.set(u.id, { u, a, once: 0, clip: 'idle' });
    }
    // a ring on the ground, discs for zones, glowing orbs for projectiles
    this.grp = new THREE.Group(); app.stage.scene.add(this.grp);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 72), new THREE.MeshBasicMaterial({ color: 0x5fd8e8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.set(this.cx, this.gy + 0.03, this.cz); this.ring.scale.setScalar(A.r || 5); this.grp.add(this.ring);
    this.orbs = []; this.zones = [];
    this.camCfg = { dist: C.dist || 8.2, yaw: C.yaw ?? 0, pitch: C.pitch ?? 18 };
    w.setCam({ target: [this.cx, this.gy + 0.6, this.cz], dist: this.camCfg.dist * 1.25, yaw: this.camCfg.yaw, pitch: this.camCfg.pitch });
    this.pops = []; this.callouts = []; this.acc = 0; this.t = 0; this.ending = false; this.frozen = true; this.shake = 0;
    this.active = true; app.audio.music && app.audio.music(spec.music || 'battle', { fade: 0.5 });
    await app.fade(0, 300);
    this.callout(spec.title || 'BATTLE!', spec.subtitle || '', T.amber, 1.6, true);
    app.audio.sfx && app.audio.sfx('whoosh');
    this.sync(0.016);
    for (const [, r] of this.units) if (r.u.onField) this.once(r, 'cry', 1.6);
    await app.wait(1500);
    this.callout('GO!', '', T.cyan, 0.8, true);
    this.frozen = false;
    if (spec.tutorial) this.tutorial();
  }
  async tutorial() {
    const app = this.app, tips = [['Tap a SKILL: your partner obeys after a short beat.', 2], ['ATK swings at the target. Tap a foe to target it.', 7], ['When the foe winds up, DODGE (Shift).', 12]];
    for (const [tip, at] of tips) { while (this.t < at && this.active) await app.wait(200); if (!this.active || this.ending) return; app.ui.toast(tip, { dur: 4.5, icon: 'star', color: T.cyan }); }
  }
  me() { return this.ptr && unitById(this.st, this.ptr.active); }
  foe() { return this.st.units.find((u) => u.side === 1 && u.onField && u.state !== 'faint'); }
  // sim ↔ world
  W(x, z) { const c = Math.cos(this.phi), s = Math.sin(this.phi), k = this.k; return [this.cx + (x * c + z * s) * k, this.cz + (-x * s + z * c) * k]; }
  S(wx, wz) { const c = Math.cos(this.phi), s = Math.sin(this.phi), k = this.k, x = (wx - this.cx) / k, z = (wz - this.cz) / k; return [x * c - z * s, x * s + z * c]; }
  wpos(u, h = 0.35) { const [x, z] = this.W(u.x, u.z); return new THREE.Vector3(x, this.gy + (u.y || 0) * this.k + h, z); }
  once(r, clip, hold) { r.a.anim.play(clip, { restart: true, fade: 0.08 }); r.clip = clip; r.once = this.t + hold; }
  // ------------------------------------------------------------------ simulation
  update(dt) {
    if (!this.active || !this.st) return;
    const st = this.st; this.t += dt;
    let scale = this.frozen ? 0 : 1; if (st.slowmo > 0) scale *= 0.4; if (st.hitstop > 0) scale *= 0.15;
    this.acc += dt * scale; let n = 0;
    while (this.acc >= DT && n < 4) { step(st, DT); this.acc -= DT; n++; this.events(st.events); this.track(st.events); }
    if (st.qte && !this._qte) { this._qte = true; setTimeout(() => { import('../../battle/sim.js').then((m) => { if (this.st === st) m.resolveQte(st, st.qte.id, 0.75 + Math.random() * 0.2); this._qte = false; }); }, 600); }
    this.sync(dt);
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter((p) => p.t < 1);
    for (const c of this.callouts) c.t += dt; this.callouts = this.callouts.filter((c) => c.t < c.dur);
    if (st.over && !this.ending) this.end();
  }
  sync(dt) {
    const st = this.st, w = this.app.world; let mx = 0, mz = 0, k = 0;
    for (const [, r] of this.units) {
      const u = r.u, a = r.a, show = u.onField || u.state === 'faint';
      a.g.visible = show && !(u.state === 'faint' && this.t - (r.faintT ?? this.t) > 4);
      if (!show) { r.placed = false; continue; }
      const [x, z] = this.W(u.x, u.z), p = a.g.position, first = !r.placed; r.placed = true;
      const f = first ? 1 : Math.min(1, dt * 16);
      p.x += (x - p.x) * f; p.z += (z - p.z) * f; p.y = w.ground(p.x, p.z) + (u.y || 0) * this.k;
      a.targetYaw = u.face + this.phi; if (first) a.yaw = a.targetYaw;
      if (u.onField && u.state !== 'faint') { mx += p.x; mz += p.z; k++; }
      if (u.state === 'faint') { if (r.clip !== 'faint') { this.once(r, 'faint', 99); r.faintT = this.t; } }
      else if (r.once > this.t) { /* a one-shot is playing */ }
      else {
        const charging = u.charge || (u.act && u.act.phase === 'charge');
        const want = charging ? 'cry' : u.moving > 0.4 || u.dash ? 'walk' : 'idle';
        if (r.clip !== want) { a.anim.play(want, { fade: 0.15 }); r.clip = want; }
      }
      if (u.bonded && Math.random() < dt * 6) w.fx.emit('sparkle', this.wpos(u, 0.5), { n: 1, scale: 0.8 });
    }
    const orbs = st.proj || [];
    while (this.orbs.length < orbs.length) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); this.grp.add(m); this.orbs.push(m); }
    this.orbs.forEach((m, i) => { const pr = orbs[i]; m.visible = !!pr; if (!pr) return; const [x, z] = this.W(pr.x, pr.z); m.position.set(x, this.gy + 0.45, z); m.material.color.set(ELC(pr.elem)).multiplyScalar(1.6); if (Math.random() < dt * 30) w.fx.emit(HIT_FX[pr.elem] === 'fire' ? 'ember' : 'sparkle', m.position, { n: 1, scale: 0.7 }); });
    const zs = st.zones || [];
    while (this.zones.length < zs.length) { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; this.grp.add(m); this.zones.push(m); }
    this.zones.forEach((m, i) => { const z0 = zs[i]; m.visible = !!z0; if (!z0) return; const [x, z] = this.W(z0.x, z0.z); m.position.set(x, this.gy + 0.04, z); m.scale.setScalar(z0.r * this.k); m.material.color.set(ELC(z0.elem)); });
    // camera: frame the fight from the side, nudged toward your partner, with a little shake on big hits
    const me = this.me();
    if (k) { mx /= k; mz /= k; if (me && this.units.get(me.id)) { const p = this.units.get(me.id).a.g.position; mx = mx * 0.7 + p.x * 0.3; mz = mz * 0.7 + p.z * 0.3; } } else { mx = this.cx; mz = this.cz; }
    const c = w.cam, kk = 1 - Math.exp(-dt * 3);
    c.target.x += (mx - c.target.x) * kk; c.target.z += (mz - c.target.z) * kk; c.target.y += (this.gy + 0.6 - c.target.y) * kk;
    c.dist += (this.camCfg.dist - c.dist) * kk;
    if (this.shake > 0) { c.target.x += (Math.random() - 0.5) * this.shake * 0.12; c.target.y += (Math.random() - 0.5) * this.shake * 0.08; this.shake -= dt * 2; }
  }
  events(evs) {
    const st = this.st, U = (id) => unitById(st, id), app = this.app, fx = app.world.fx, R = (u) => this.units.get(u.id);
    for (const e of evs) {
      switch (e.type) {
        case 'anim': { const u = U(e.u); if (!u || !R(u)) break; this.once(R(u), MELEE.has(e.anim) ? 'attack' : 'special', MELEE.has(e.anim) ? 0.7 : 1.2); break; }
        case 'cast': { const u = U(e.u); if (!u || e.phase !== 'release' || !R(u)) break; this.once(R(u), 'special', 1.2); app.audio.sfx && app.audio.sfx('charge_release'); break; }
        case 'hit': {
          const t = U(e.tgt); if (!t || !R(t)) break;
          if (e.kind !== 'dot' && e.dmg > t.maxHp * 0.08) this.once(R(t), 'hurt', 0.5);
          const p = this.wpos(t, 0.45);
          fx.emit('spark', p, { n: 1, scale: e.crit ? 1.6 : 1 }); fx.emit(HIT_FX[e.elem] || 'star', p, { n: e.crit ? 10 : 5, scale: 0.9 });
          this.pop(p, String(e.dmg), e.crit ? T.amber : e.eff > 1.2 ? '#ff8a5a' : e.eff < 0.8 ? T.dim : T.text, e.crit ? 2 : 1);
          if (e.eff > 1.2 && e.kind !== 'dot' && Math.random() < 0.7) this.pop(p, 'super effective!', '#ff8a5a', 1, 10);
          if (e.kind !== 'dot') { app.audio.sfx && app.audio.sfx(e.crit ? 'crit' : e.dmg > t.maxHp * 0.12 ? 'hit_heavy' : 'hit_light', { pitch: 0.9 + Math.random() * 0.2 }); if (e.crit || e.dmg > t.maxHp * 0.12) this.shake = Math.max(this.shake, e.crit ? 0.8 : 0.4); }
          break;
        }
        case 'miss': { const t = U(e.u); if (t) this.pop(this.wpos(t, 0.6), e.blind ? 'miss' : 'dodge!', T.cyan, 1); break; }
        case 'perfectDodge': this.callout('PERFECT DODGE!', 'counter for a crit', T.cyan, 1); break;
        case 'parry': this.callout(e.perfect ? 'PERFECT PARRY!' : 'PARRY!', '', T.amber, 0.9); break;
        case 'reaction': { const [x, z] = this.W(e.x, e.z); fx.emit('ring', new THREE.Vector3(x, this.gy + 0.3, z), { scale: 2 }); fx.emit('sparkle', new THREE.Vector3(x, this.gy + 0.4, z), { n: 14 }); this.callout(String(e.name).toUpperCase(), 'reaction!', e.color || T.amber, 1.2); this.shake = 0.8; break; }
        case 'combo': this.callout(String(e.name).toUpperCase(), 'combo!', T.pink, 0.9); break;
        case 'burst': { const [x, z] = this.W(e.x, e.z); fx.emit('ring', new THREE.Vector3(x, this.gy + 0.2, z), { scale: Math.max(0.6, (e.r || 1) * this.k) }); fx.emit(HIT_FX[e.elem] || 'sparkle', new THREE.Vector3(x, this.gy + 0.3, z), { n: e.small ? 6 : 14 }); break; }
        case 'faint': { const u = U(e.u); if (!u || !R(u)) break; const r = R(u); this.once(r, 'faint', 99); r.faintT = this.t; if (u.side === 1) this.callout('KNOCKED OUT!', u.name, T.pink, 1.1); app.audio.sfx && app.audio.sfx('ko'); break; }
        case 'switch': { const inn = U(e.in); if (inn && R(inn)) { this.callout(inn.name + '!', 'switch in', ELC(inn.elem), 0.8); const r = R(inn); r.placed = false; this.once(r, 'cry', 1.4); } break; }
        case 'bond': { const u = U(e.u); if (u && R(u)) { this.callout('BOND!', e.name || 'soul stones in sync', T.cyan, 1.2, true); fx.emit('ring', this.wpos(u, 0.2), { scale: 1.5 }); fx.emit('sparkle', this.wpos(u, 0.5), { n: 20 }); this.once(R(u), 'cry', 1.4); } break; }
        case 'unbond': { const u = U(e.u); if (u && u.side === 0) app.ui.toast(e.reason === 'ult' ? 'The ultimate burned out the bond' : 'Bond released', { icon: 'link', color: T.dim }); break; }
        case 'ult': { const u = U(e.u); if (u && R(u)) { this.callout(e.name ? e.name.toUpperCase() : 'ULTIMATE!', u.name, ELC(u.elem), 1.4, true); this.shake = 1.2; this.once(R(u), 'special', 1.6); } break; }
        case 'heal': { const u = U(e.u); if (u) { this.pop(this.wpos(u, 0.6), '+' + e.amt, T.green, 1); fx.emit('heart', this.wpos(u, 0.5), { n: 4 }); } break; }
        case 'status': { const u = U(e.u); if (u) this.pop(this.wpos(u, 0.8), String(e.s), T.pink, 1); break; }
        case 'emote': { const u = U(e.u); if (u && R(u)) this.once(R(u), 'win', 1.4); break; }
        case 'item': app.ui.toast('Used ' + String(e.id).replace('_', ' '), { icon: 'bag' }); break;
        case 'captureThrow': this.callout('SOUL LINK!', Math.round((e.chance || 0) * 100) + '% chance', T.green, 1); break;
        case 'captureShake': for (let i = 0; i < (e.shakes || 1); i++) setTimeout(() => this.callout(String(i + 1) + '…', '', T.text, 0.5), 650 * (i + 1)); if (!e.ok) setTimeout(() => this.callout('IT BROKE FREE!', '', T.red, 1), 650 * ((e.shakes || 1) + 1)); break;
        case 'captured': this.callout('GOTCHA!', 'soul link established', T.green, 1.6, true); break;
        case 'captureImmune': this.callout("CAN'T BE CAUGHT!", '', T.red, 1); break;
        case 'disobey': { const u = U(e.u); if (u) this.pop(this.wpos(u, 0.7), 'ignores you…', T.dim, 1); break; }
        default: break;
      }
    }
  }
  pop(p, str, c, scale = 1, dy = 0) { this.pops.push({ p: p.clone(), str, c, scale, t: 0, dy }); }
  callout(str, sub, c, dur = 1, big = false) { this.callouts = this.callouts.filter((k) => !big || !k.big); this.callouts.push({ str, sub, c, dur, big, t: 0 }); }
  // ------------------------------------------------------------------ HUD + controls
  drawUI(ui) {
    if (!this.active || !this.st) return;
    const st = this.st, me = this.me(), W = ui.w, H = ui.h, w = this.app.world;
    for (const [, r] of this.units) {
      const u = r.u; if (!u.onField || u.state === 'faint') continue;
      const s = w.project(this.wpos(u, (r.a.m.scale || 1) * 1.6 + 0.2)); if (!s.vis) continue;
      const x = Math.round(s.x), y = Math.round(s.y);
      ui.bar(x - 12, y, 24, 2, u.hp / u.maxHp, {});
      if (u.side === 0 && u.order && u.order.dur > 0) { ui.bar(x - 12, y - 5, 24, 2, 1 - u.order.t / u.order.dur, { color: T.cyan }); ui.icon(u.order.cmd.type === 'dodge' ? 'dodge' : u.order.cmd.type === 'skill' ? 'star' : 'fist', x + 14, y - 8, T.cyan); }
      if (u.bonded) ui.icon('link', x - 4, y - 14 + Math.round(Math.sin(this.t * 6)), T.cyan);
    }
    for (const p of this.pops) { const s = w.project(p.p); if (!s.vis || p.t > 0.9) continue; ui.text(p.str, Math.round(s.x), Math.round(s.y - p.dy - p.t * 22), p.c, { align: 'center', outline: true, scale: p.scale }); }
    const panel = (u, x, y, right) => {
      const pw = 132; if (right) x -= pw;
      ui.panel(x, y, pw, 30, {});
      const sp = SPECIES[u.species];
      ui.icon(u.elem === 'pyro' ? 'flame' : u.elem === 'hydro' ? 'drop' : u.elem === 'bio' ? 'leaf' : u.elem === 'volto' ? 'bolt' : 'star', x + 5, y + 5, ELC(u.elem));
      ui.text(`${sp ? sp.name : u.name}`, x + 15, y + 5, T.text, { shadow: T.ink });
      ui.text(`Lv${u.level}`, x + pw - 6, y + 5, T.dim, { align: 'right', mini: true });
      ui.bar(x + 6, y + 16, pw - 12, 4, u.hp / u.maxHp, { seg: 4 });
      if (!right) { ui.bar(x + 6, y + 23, (pw - 12) * 0.62, 2, u.energy / 100, { color: T.cyan }); ui.bar(x + 6 + (pw - 12) * 0.66, y + 23, (pw - 12) * 0.34, 2, (u.ult || 0) / 100, { color: T.amber }); }
      else ui.text(`${Math.ceil(u.hp)}/${u.maxHp}`, x + pw - 6, y + 22, T.dim, { align: 'right', mini: true });
    };
    if (me) panel(me, 4, 4, false);
    const foe = this.foe(); if (foe) panel(foe, W - 4, 4, true);
    if (me && !this.ending && !this.frozen && !st.paused) this.controls(ui, me);
    if (st.paused === 'halftime' && !this.ending) this.arenaChoice(ui, 'HALFTIME');
    for (const c of this.callouts) {
      const a = Math.min(1, c.t * 8, (c.dur - c.t) * 5), y = Math.round(H * (c.big ? 0.36 : 0.26) - (1 - a) * 6); if (a <= 0) continue;
      ui.text(c.str, W >> 1, y, c.c, { align: 'center', outline: true, scale: c.big ? 3 : 2, spacing: 2 });
      if (c.sub) ui.text(c.sub, W >> 1, y + (c.big ? 26 : 18), T.text, { align: 'center', outline: true });
    }
  }
  arenaChoice(ui, title) {
    const W = ui.w, H = ui.h, bw = 96, gap = 6, x0 = Math.round(W / 2 - (bw * 3 + gap * 2) / 2), y = Math.round(H * 0.5);
    ui.fade(0.45, '#0c0814'); ui.text(title, W >> 1, y - 44, T.amber, { align: 'center', scale: 2, outline: true });
    Object.entries(ARENA_TYPES).forEach(([id, A], i) => { if (ui.button(x0 + i * (bw + gap), y, bw, 22, A.name, { color: T.amber, hotkey: String(i + 1) }) && this.st.paused) resumeMatch(this.st, { arena: id }); });
  }
  controls(ui, me) {
    const W = ui.w, H = ui.h, st = this.st, T_ = this.ptr, app = this.app;
    const cmd = (c) => { if (order(st, me.id, c)) app.audio.sfx && app.audio.sfx('ui_tap'); };
    const target = () => { const f = this.foe(); return f ? f.id : undefined; };
    const bw = Math.min(112, Math.floor((W - 70 - 4 * 3) / 4)), bh = 22, y = H - bh - 6;
    me.skills.forEach((id, i) => {
      const sk = SKILLS[id]; if (!sk) return;
      const x = 6 + i * (bw + 3), cd = cooldownFrac(st, me, id), cost = skillCost(me, id), ok = cd <= 0 && me.energy >= cost;
      const name = skillName(me, id), short = name.length * 6 > bw - 16 ? name.slice(0, Math.max(3, Math.floor((bw - 18) / 6))) + '.' : name;
      if (ui.button(x, y, bw, bh, short, { color: ELC(sk.elem), disabled: !ok, hotkey: String(i + 1), sub: cost ? String(cost) : '' })) cmd({ type: 'skill', id, target: target() });
      if (cd > 0) { const h = Math.round((bh - 4) * cd); for (let j = 0; j < h; j++) for (let k = 0; k < bw - 4; k++) if ((k + j) % 2 === 0) ui.px(x + 2 + k, y + 2 + (bh - 4 - h) + j, '#120c1c'); ui.text(Math.ceil(cd * (sk.cd || 1)) + 's', x + bw - 4, y + 3, T.amber, { align: 'right', mini: true }); }
    });
    const ax = W - 52, ab = 46, ah = 17; let yy = H - 6 - ah;
    const act = (label, icon, color, key, fn, o = {}) => { if (ui.button(ax, yy, ab, ah, label, Object.assign({ icon, color, hotkey: key }, o))) fn(); yy -= ah + 3; };
    act('Atk', 'fist', T.amber, ' ', () => cmd({ type: 'attack', id: target() }));
    act('Dodge', 'dodge', T.cyan, 'Shift', () => { const f = this.foe(); let dx = 1, dz = 0; if (f) { dx = -(f.z - me.z); dz = f.x - me.x; if (Math.random() < 0.5) { dx = -dx; dz = -dz; } } cmd({ type: 'dodge', dx, dz }); });
    const canBond = st.rules.bond && T_.canBond && !T_.bonded && T_.bondCd <= 0;
    if (me.bonded && me.ultSkill) act('Ult', 'star', T.amber, 'f', () => order(st, me.id, { type: 'ult' }), { disabled: (me.ult || 0) < 100 });
    else if (st.rules.bond && T_.canBond) act(T_.bonded ? 'Unbond' : T_.bondCd > 0 ? Math.ceil(T_.bondCd) + 's' : 'Bond', 'link', T.cyan, 'b', () => trainerCommand(st, T_.id, { type: T_.bonded ? 'unbond' : 'bond' }), { disabled: !T_.bonded && !canBond });
    const bench = T_.team.map((id) => unitById(st, id)).filter((u) => u && u.id !== me.id && u.state !== 'faint');
    if (bench.length) act(T_.switching ? Math.ceil(switchLeft(T_)) + 's' : 'Swap', 'swap', T.green, 'Tab', () => trainerCommand(st, T_.id, { type: 'switch', to: bench[0] && bench[0].id }), { disabled: !!T_.switching || T_.switchCd > 0 });
    act('Emote', 'smile', T.pink, 'e', () => cmd({ type: 'emote', id: Object.keys(EMOTES)[0] }), { disabled: me.emoteCd > 0 });
    if (st.rules.capture) act('Catch', 'star', T.green, 'c', () => { const f = this.foe(); if (!f) return; const gem = ['diamond', 'amethyst', 'ruby', 'sapphire', 'emerald', 'topaz', 'opal', 'quartz'].find((g) => app.state.bag[g] > 0) || 'quartz'; trainerCommand(st, T_.id, { type: 'capture', target: f.id, gem }); });
    if (st.rules.flee) act('Run', 'dodge', T.dim, 'r', () => trainerCommand(st, T_.id, { type: 'flee' }));
    // tap the arena: target a foe or move there
    const p = ui.ptr;
    if (p.released && !ui.dialog && Math.hypot(p.x - p.sx, p.y - p.sy) < 6 && p.y < H - 34 && p.x < W - 56 && p.y > 36) {
      p.released = false;
      let best = null, bd = 26;
      for (const [, r] of this.units) if (r.u.onField && r.u.side === 1 && r.u.state !== 'faint') { const s = app.world.project(this.wpos(r.u, 0.4)); const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = r.u; } }
      if (best) cmd({ type: 'target', id: best.id });
      else {
        _n.set((p.x / app.vw) * 2 - 1, -((p.y / app.vh) * 2 - 1)); _r.setFromCamera(_n, app.stage.cam); _p.constant = -this.gy;
        if (_r.ray.intersectPlane(_p, _v)) { let [x, z] = this.S(_v.x, _v.z); const d = Math.hypot(x, z), Rr = st.arena.r - 0.4; if (d > Rr) { x *= Rr / d; z *= Rr / d; } cmd({ type: 'move', x, z }); app.world.fx.emit('ring', _v.clone().setY(this.gy + 0.05), { scale: 0.5 }); }
      }
    }
  }
  // ------------------------------------------------------------------ end
  async end() {
    this.ending = true;
    const app = this.app, st = this.st, r = st.result, won = r.winner === 0;
    for (const [, rec] of this.units) if (rec.u.side === r.winner && rec.u.onField && rec.u.state !== 'faint') this.once(rec, 'win', 9);
    app.audio.stinger && app.audio.stinger(won ? 'victory' : 'defeat');
    this.callout(won ? 'VICTORY!' : r.reason === 'flee' ? 'GOT AWAY' : 'DEFEAT…', won ? '' : 'your team needs rest', won ? T.amber : '#9fb3ff', 2.4, true);
    await app.wait(2400);
    for (const l of this.rewards(r)) app.ui.toast(l, { icon: 'star', dur: 3 });
    await app.wait(600);
    await app.fade(1, 400);
    this.cleanup();
    this.resolve(r);
  }
  track(evs) {
    if (!this.tracker || !evs || !evs.length) return;
    for (const g of this.tracker.feed(evs, this.app.state.unlocks.slots)) {
      const mon = S.monByUid(this.app.state, g.uid), name = mon ? (mon.nick || SPECIES[mon.species].name) : '';
      this.app.ui.toast(`${name}: ${g.name || (g.skill && SKILLS[g.skill] ? SKILLS[g.skill].name : 'new skill')} unlocked!`, { icon: 'star', color: T.cyan, dur: 2.6 });
    }
  }
  rewards(r) {
    const s = this.app.state, out = [];
    if (this.tracker) { const fin = this.tracker.finish(r, { slots: s.unlocks.slots }); for (const g of fin.got) out.push(`${g.name || (g.skill && SKILLS[g.skill] ? SKILLS[g.skill].name : 'A new skill')} unlocked!`); }
    s.stats.battles++; const won = r.winner === 0; if (won) s.stats.wins++;
    const parts = [];
    for (const u of r.units) { if (u.side !== 0) { S.seen(s, u.species); continue; } const mon = S.monByUid(s, u.uid); if (!mon) continue; mon.hp = u.fainted ? 0 : Math.max(0.05, u.hp / u.maxHp); if (u.took) parts.push(mon); }
    for (const id of (r.used && r.used.items) || []) S.addItem(s, id, -1);
    if (r.reason === 'capture' && r.captured) {
      const c = r.captured, mon = createElemon(c.species, { level: c.level, wild: true, ot: s.player.name });
      mon.hp = Math.max(0.2, c.hp || 0.5);
      for (const [lv, id] of SPECIES[c.species].learn) if (lv <= c.level && !mon.skills.known.includes(id)) mon.skills.known.push(id);
      mon.skills.active = mon.skills.known.filter((id) => SKILLS[id] && SKILLS[id].kind === 'active').slice(0, 4);
      const where = S.addElemon(s, mon); s.stats.captures++;
      out.push(`${SPECIES[c.species].name} joined your ${where === 'party' ? 'team' : 'box'}!`);
    }
    if (won && parts.length) {
      let exp = 0; for (const u of r.units) if (u.side === 1) exp += ((SPECIES[u.species].exp || 50) * (u.level || 5)) / 6;
      exp *= 1.4;
      for (const mon of parts) { const ups = gainExp(mon, exp); addFriendship(mon, 3); if (ups.length) out.push(`${SPECIES[mon.species].name} grew to Lv${mon.level}!`); }
      out.unshift(`+${Math.round(exp)} EXP`);
      if (this.spec.money) { s.money += this.spec.money; out.push(`+$${this.spec.money}`); }
    } else if (!won) for (const m of s.party) if (!m.hp) m.hp = 0.15;
    // evolutions whose conditions are now met (battle events, level, time, weather, held gear)
    const ctx = { location: this.app.world.id, hour: s.time && s.time.hour, weather: s.time ? weatherOf(s.time) : null, state: s };
    for (const mon of [...s.party]) {
      if (!s.party.includes(mon)) continue;
      const opts = evolutionOptions(mon, ctx); if (!opts.length) continue;
      const from = SPECIES[mon.species].name; evolve(mon, opts[0].to);
      if (opts[0].cond.squad) S.consumeSquad(s, mon, opts[0].cond.squad);
      out.push(`${from} evolved into ${SPECIES[mon.species].name}!`);
    }
    this.app.save();
    return out;
  }
  cleanup() {
    const w = this.app.world;
    for (const [id] of this.units) w.remove('bu-' + id);
    for (const a of this.hidden) a.g.visible = true;
    this.app.stage.scene.remove(this.grp);
    w.setCam(this.prevCam);
    this.active = false; this.st = null; this.units = new Map();
  }
}
