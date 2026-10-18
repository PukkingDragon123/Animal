// Battle2D: the real-time Tokonmon battle sim (battle/sim.js) staged on an HD-2D
// pixel scene. Street battles happen right where you stand (the arena is laid
// over the current map); stadium battles get their own scene. Tokonmon are the
// 3D-rendered pixel sprites, turning to face where they really face.
//
// Controls: tap a skill (your partner obeys after a short beat — BOND to remove
// the delay), ATTACK, DODGE, BOND, SWITCH, EMOTE, ITEM; tap the ground to move,
// tap a foe to target. Keys: 1-4 skills, Space attack, Shift dodge, B bond,
// Tab switch, E emote, Q item.
import { createBattle, step, DT, order, trainerCommand, unitById, playerTrainer, cooldownFrac, skillCost, skillName, switchLeft, EMOTES } from '../../battle/sim.js';
import { Actor } from '../scene2d.js';
import { MonSprite, bank } from './mon.js';
import { T } from './ui.js';
import { SKILLS } from '../../data/skills.js';
import { SPECIES, elemsOf } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { createElemon, battleSnapshot, gainExp, addFriendship } from '../../game/elemon.js';
import * as S from '../../game/state.js';
import { mix, shift } from '../color.js';

const SX = 11, SZ = 7;                    // arena metres → world pixels (top-down ¾)
const ELC = (e) => (ELEMENTS[e] && ELEMENTS[e].color) || '#ffffff';
const ANIM = { attack: 'attack', bite: 'attack', slash: 'attack', peck: 'attack', punch: 'attack', kick: 'attack', ram: 'dash', bigHit: 'attack', slam: 'attack', parry: 'attack', grab: 'attack',
  cast: 'cast', shoot: 'cast', spit: 'cast', blast: 'breath', beam: 'breath', breath: 'breath', roar: 'buff', flex: 'buff', throw: 'throw', dodge: 'dash', spawn: 'happy', taunt: 'happy', dance: 'happy', bow: 'happy', shake: 'hurt' };

export class Battle2D {
  constructor(app) { this.app = app; this.active = false; }

  // spec: { foe: { name, team: [[species, level, opts]], ai }, title, subtitle, tutorial, canLose, rules, scene }
  start(spec) {
    return new Promise((resolve) => {
      const app = this.app, s = app.state;
      this.resolve = resolve; this.spec = spec;
      // staging: on the current map, arena centred near the player (or a given point)
      const w = app.world;
      this.sc = w.sc;
      const c = spec.at || [Math.max(140, Math.min(this.sc.w - 140, w.me.x)), Math.max(260, Math.min(this.sc.h - 70, w.me.y - 10))];
      this.ox = c[0]; this.oy = c[1];
      this.savedActors = new Set(this.sc.actors); this.sc.actors.clear();
      for (const n of w.npcs) n.a.hidden = true;
      // teams
      const mine = S.battleTeam(s, 3).map((m) => battleSnapshot(m, s.unlocks.slots));
      const foeSnaps = spec.foe.team.map(([sp, lv, o]) => { const m = createElemon(sp, { level: lv, wild: true, friendship: 100 }); for (const [l, id] of SPECIES[sp].learn) if (l <= lv && !m.skills.known.includes(id)) m.skills.known.push(id); m.skills.active = m.skills.known.filter((id) => SKILLS[id] && SKILLS[id].kind === 'active').slice(0, 4); return battleSnapshot(m, { active: 4, ult: 1, passive: 2 }); });
      const items = {}; for (const id of ['takoyaki', 'okonomiyaki', 'ramune', 'matcha']) if (s.bag[id]) items[id] = s.bag[id];
      this.st = createBattle({
        seed: (Math.random() * 1e9) | 0, arena: { r: 8 },
        sides: [{ trainers: [{ id: 'player', name: s.player.name, isPlayer: true, team: mine, items, canBond: !!s.flags.bracelet }] }, { trainers: [{ id: 'foe', name: spec.foe.name, ai: spec.foe.ai || 'normal', team: foeSnaps }] }],
        rules: Object.assign({ items: true }, spec.rules || {}),
      });
      this.ptr = playerTrainer(this.st);
      // sprites
      this.units = new Map();
      for (const u of this.st.units) {
        const spr = new MonSprite(u.species, { scale: 0.62, pitch: 24, yaw: u.face * 180 / Math.PI });
        const rec = { u, spr, a: null, once: null, flash: 0 };
        rec.a = new Actor({ x: 0, y: 0, src: () => (rec.u.onField || rec.u.state === 'faint' ? spr.frame() : null) });
        this.sc.actors.add(rec.a);
        this.units.set(u.id, rec);
      }
      this.fx = []; this.pops = []; this.callouts = []; this.acc = 0; this.t = 0; this.ending = false; this.frozen = true; this.camX = null;
      this.sc.fx.push(this.fxPainter = (ctx, cam) => this.paintFx(ctx, cam));
      this.active = true;
      app.mode = 'battle';
      app.audio.music && app.audio.music('battle', { fade: 0.5 });
      this.intro().catch((e) => console.error(e));
    });
  }
  me() { return this.ptr && unitById(this.st, this.ptr.active); }
  foe() { return this.st.units.find((u) => u.side === 1 && u.onField && u.state !== 'faint'); }

  async intro() {
    const app = this.app;
    await app.fade(0, 300);
    this.callout(this.spec.title || 'BATTLE!', this.spec.subtitle || '', T.amber, 1.6, true);
    app.audio.sfx('whoosh');
    await app.wait(1500);
    this.callout('GO!', '', T.cyan, 0.8, true);
    this.frozen = false;
    if (this.spec.tutorial) this.tutorial();
  }
  async tutorial() {
    const app = this.app, tips = [
      ['Tap a SKILL: your partner obeys after a short beat.', 2],
      ['ATTACK swings at the target. Tap a foe to target it.', 7],
      ['When the foe winds up, DODGE (or Shift / swipe).', 12],
      ['BOND links your soul stones: no delay, bonus gimmick, ultimates!', 18],
    ];
    for (const [tip, at] of tips) { while (this.t < at && this.active) await app.wait(200); if (!this.active || this.ending) return; app.ui.toast(tip, { dur: 4.5, icon: 'star', color: T.cyan }); }
  }

  // ------------------------------------------------------------------ simulation
  update(dt) {
    if (!this.active) return;
    const st = this.st;
    this.t += dt;
    let scale = this.frozen ? 0 : 1;
    if (st.slowmo > 0) scale *= 0.4;
    if (st.hitstop > 0) scale *= 0.15;
    this.acc += dt * scale;
    let n = 0;
    while (this.acc >= DT && n < 4) { step(st, DT); this.acc -= DT; n++; this.events(st.events); }
    if (st.qte && !this._qte) { this._qte = true; setTimeout(() => { import('../../battle/sim.js').then((m) => { m.resolveQte(st, st.qte.id, 0.75 + Math.random() * 0.2); this._qte = false; }); }, 600); }
    this.sync(dt);
    for (const f of this.fx) { f.t += dt; if (f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt; } }
    this.fx = this.fx.filter((f) => f.t < f.life);
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter((p) => p.t < 1);
    for (const c of this.callouts) c.t += dt; this.callouts = this.callouts.filter((c) => c.t < c.dur);
    if (st.over && !this.ending) this.end();
  }
  W(x, z) { return [this.ox + x * SX, this.oy + z * SZ]; }
  sync(dt) {
    const st = this.st;
    let cx = 0, cy = 0, k = 0;
    for (const [, r] of this.units) {
      const u = r.u, [X, Y] = this.W(u.x, u.z);
      r.a.x += (X - r.a.x) * Math.min(1, dt * 18 + (r.a.x === 0 ? 1 : 0)); r.a.y += (Y - r.a.y) * Math.min(1, dt * 18 + (r.a.y === 0 ? 1 : 0));
      r.a.z = -(u.y || 0) * 8;
      r.spr.yaw = u.face * 180 / Math.PI;
      r.spr.bonded = !!u.bonded;
      if (u.onField && u.state !== 'faint') { cx += X; cy += Y; k++; }
      // clip choice: one-shots from events win; then state; then locomotion
      if (u.state === 'faint') { if (r.spr.clip !== 'faint') r.spr.play('faint', { restart: true }); }
      else if (r.once && r.once > this.t) { /* let the one-shot finish */ }
      else {
        const act = u.act, charging = u.charge || (act && act.phase === 'charge');
        const want = charging ? 'buff' : u.dash ? 'dash' : u.moving > 0.4 ? (u.moving > 3 ? 'run' : 'walk') : 'idle';
        if (r.spr.clip !== want) r.spr.play(want);
      }
      r.spr.expr = u.state === 'stagger' || u.st.some((s) => s.s === 'stun') ? 'hurt' : u.bonded ? 'fierce' : null;
      r.spr.update(dt);
      if (r.flash > 0) r.flash -= dt;
    }
    // camera: frame the fight
    if (k) { cx /= k; cy /= k; const me = this.me(); if (me) { const [mx, my] = this.W(me.x, me.z); cx = cx * 0.6 + mx * 0.4; cy = cy * 0.6 + my * 0.4; } }
    else { cx = this.ox; cy = this.oy; }
    const tx = cx - this.sc.vw / 2, ty = cy - this.sc.vh * 0.52;
    if (this.camX == null) { this.camX = tx; this.camY = ty; }
    const kk = 1 - Math.exp(-dt * 3); this.camX += (tx - this.camX) * kk; this.camY += (ty - this.camY) * kk;
    this.sc.cam.x = Math.max(0, Math.min(this.sc.w - this.sc.vw, this.camX + (this.shake > 0 ? (Math.random() - 0.5) * this.shake * 6 : 0)));
    this.sc.cam.y = Math.max(0, Math.min(this.sc.h - this.sc.vh, this.camY + (this.shake > 0 ? (Math.random() - 0.5) * this.shake * 4 : 0)));
    if (this.shake > 0) this.shake -= dt * 2;
  }
  playOnce(u, clip, hold = 0.6) { const r = this.units.get(u.id || u); if (!r) return; r.spr.play(clip, { restart: true }); r.once = this.t + hold; }
  events(evs) {
    const st = this.st, U = (id) => unitById(st, id), app = this.app;
    for (const e of evs) {
      switch (e.type) {
        case 'anim': { const u = U(e.u); if (!u) break; const clip = ANIM[e.anim] || (e.anim === 'roar' ? 'buff' : 'attack'); this.playOnce(u, clip, clip === 'breath' ? 0.9 : 0.55); break; }
        case 'cast': { const u = U(e.u); if (!u) break; if (e.phase === 'release') { const sk = SKILLS[e.skill]; const big = sk && (sk.power || 0) >= 60; this.playOnce(u, big && u.elem === 'pyro' ? 'breath' : 'cast', big ? 0.9 : 0.6); app.audio.sfx(u.elem === 'pyro' ? 'pyro' : u.elem === 'hydro' ? 'hydro' : u.elem === 'bio' ? 'bio' : 'whoosh', { vol: 0.7 }); } break; }
        case 'hit': {
          const t = U(e.tgt); if (!t) break;
          const r = this.units.get(t.id); r.flash = 0.12;
          if (e.kind !== 'dot' && e.dmg > t.maxHp * 0.08) this.playOnce(t, 'hurt', 0.35);
          const [X, Y] = this.W(t.x, t.z);
          this.spark(X, Y - 16, ELC(e.elem), e.crit ? 14 : 9);
          this.pop(X, Y - 34, String(e.dmg), e.crit ? T.amber : e.eff > 1.2 ? '#ff8a5a' : e.eff < 0.8 ? T.dim : T.text, e.crit ? 2 : 1);
          if (e.eff > 1.2 && e.kind !== 'dot' && Math.random() < 0.7) this.pop(X, Y - 46, 'super effective!', '#ff8a5a', 1);
          if (e.kind !== 'dot') { app.audio.sfx(e.crit ? 'crit' : e.dmg > t.maxHp * 0.12 ? 'hit_heavy' : 'hit_light', { pitch: 0.9 + Math.random() * 0.2 }); if (e.crit || e.dmg > t.maxHp * 0.12) this.shake = Math.max(this.shake || 0, e.crit ? 0.6 : 0.3); }
          break;
        }
        case 'miss': { const t = U(e.u); if (t) { const [X, Y] = this.W(t.x, t.z); this.pop(X, Y - 36, e.blind ? 'miss' : 'dodge!', T.cyan, 1); } break; }
        case 'perfectDodge': this.callout('PERFECT DODGE!', 'counter for a crit', T.cyan, 1); app.audio.sfx('perfect_parry', { pitch: 1.3 }); break;
        case 'parry': this.callout(e.perfect ? 'PERFECT PARRY!' : 'PARRY!', '', T.amber, 0.9); app.audio.sfx(e.perfect ? 'perfect_parry' : 'parry'); break;
        case 'reaction': { const [X, Y] = this.W(e.x, e.z); this.burst(X, Y - 10, e.color || '#ffffff', 26); this.callout(e.name.toUpperCase(), 'reaction!', e.color || T.amber, 1.2); app.audio.sfx(e.id === 'steam' ? 'steam_explosion' : 'reaction'); this.shake = 0.8; break; }
        case 'combo': this.callout(String(e.name).toUpperCase(), 'combo!', T.pink, 0.9); break;
        case 'burst': { const [X, Y] = this.W(e.x, e.z); this.burst(X, Y - 6, ELC(e.elem), e.small ? 10 : 20, e.r * SX); break; }
        case 'line': { const [X, Y] = this.W(e.x, e.z); for (let i = 0; i < 10; i++) { const t = i / 10; this.fx.push({ kind: 'dot', x: X + e.dx * e.range * SX * t, y: Y - 12 + e.dz * e.range * SZ * t, t: 0, life: 0.35 + t * 0.1, c: ELC(e.elem), r: 2 }); } break; }
        case 'faint': { const u = U(e.u); if (!u) break; this.playOnce(u, 'faint', 9); if (u.side === 1) this.callout('KNOCKED OUT!', u.name, T.pink, 1.1); app.audio.sfx('ko'); break; }
        case 'switch': { const inn = U(e.in); if (inn) { this.callout(inn.name + '!', 'switch in', ELC(inn.elem), 0.8); app.audio.sfx('switch'); this.playOnce(inn, 'happy', 0.8); } break; }
        case 'bond': { const u = U(e.u); if (u) { this.callout('BOND!', e.name ? e.name : 'soul stones in sync', T.cyan, 1.2, true); app.audio.sfx('evolve_burst'); const [X, Y] = this.W(u.x, u.z); this.burst(X, Y - 14, T.cyan, 28, 30); this.playOnce(u, 'buff', 1); } break; }
        case 'unbond': { const u = U(e.u); if (u && u.side === 0) app.ui.toast(e.reason === 'ult' ? 'The ultimate burned out the bond' : 'Bond released', { icon: 'link', color: T.dim }); break; }
        case 'ult': { const u = U(e.u); if (u) { this.callout(e.name ? e.name.toUpperCase() : 'ULTIMATE!', u.name, ELC(u.elem), 1.4, true); this.shake = 1; this.playOnce(u, 'breath', 1); } break; }
        case 'heal': { const u = U(e.u); if (u) { const [X, Y] = this.W(u.x, u.z); this.pop(X, Y - 34, '+' + e.amt, T.green, 1); for (let i = 0; i < 6; i++) this.fx.push({ kind: 'plus', x: X + (Math.random() - 0.5) * 16, y: Y - 8, vx: 0, vy: -18, t: 0, life: 0.8, c: T.green }); } break; }
        case 'status': { const u = U(e.u); if (u) { const [X, Y] = this.W(u.x, u.z); this.pop(X, Y - 44, String(e.s), T.pink, 1); } break; }
        case 'emote': { const u = U(e.u); if (u) this.playOnce(u, 'happy', 1); break; }
        case 'order': { const u = U(e.u); if (u && u.side === 0) { const r = this.units.get(u.id); r.orderT = e.delay; r.orderDur = e.delay; r.orderKind = e.kind; } break; }
        case 'item': app.ui.toast('Used ' + String(e.id).replace('_', ' '), { icon: 'bag' }); break;
        case 'disobey': { const u = U(e.u); if (u) { const [X, Y] = this.W(u.x, u.z); this.pop(X, Y - 40, 'ignores you…', T.dim, 1); } break; }
        default: break;
      }
    }
  }

  // ------------------------------------------------------------------ FX (painted into the low-res frame)
  spark(x, y, c, n = 8) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 70; this.fx.push({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, t: 0, life: 0.25 + Math.random() * 0.15, c }); } this.fx.push({ kind: 'star', x, y, t: 0, life: 0.16, c: '#ffffff', r: 7 }); }
  burst(x, y, c, n = 16, r = 20) { this.fx.push({ kind: 'ring', x, y, t: 0, life: 0.35, c, r }); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 60; this.fx.push({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 20, g: 60, t: 0, life: 0.4 + Math.random() * 0.3, c }); } }
  pop(x, y, str, c, scale = 1) { // stack pops that would overlap
    for (const p of this.pops) if (p.t < 0.5 && Math.abs(p.x - x) < 30 && Math.abs(p.y - p.t * 22 - y) < 9) y = p.y - p.t * 22 - 10;
    this.pops.push({ x, y, str, c, scale, t: 0 });
  }
  callout(str, sub, c, dur = 1, big = false) { this.callouts = this.callouts.filter((k) => !big || !k.big); this.callouts.push({ str, sub, c, dur, big, t: 0 }); }
  paintFx(ctx, cam) {
    if (!this.active) return;
    const st = this.st, px = (x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x - cam.x), Math.round(y - cam.y), w, h); };
    // arena ring on the ground
    const ox = this.ox - cam.x, oy = this.oy - cam.y, R = st.arena.r;
    ctx.fillStyle = 'rgba(95,216,232,0.55)';
    for (let a = 0; a < 360; a += 3) { const r = a * Math.PI / 180; ctx.fillRect(Math.round(ox + Math.cos(r) * R * SX), Math.round(oy + Math.sin(r) * R * SZ), (a / 3) % 2 ? 1 : 2, 1); }
    // shadows of units sitting on zones etc. are in the scene; here: zones, projectiles, order timers
    for (const z of st.zones) { const [X, Y] = this.W(z.x, z.z); const c = ELC(z.elem); ctx.fillStyle = hexA(c, 0.3); for (let a = 0; a < 360; a += 6) { const r = a * Math.PI / 180; ctx.fillRect(Math.round(X - cam.x + Math.cos(r) * z.r * SX), Math.round(Y - cam.y + Math.sin(r) * z.r * SZ), 2, 1); } }
    for (const p of st.proj) {
      const [X, Y] = this.W(p.x, p.z), c = ELC(p.elem), y = Y - 14;
      for (let k = 1; k < 5; k++) px(X - (p.vx || 0) * k * 0.012 * SX, y - (p.vz || 0) * k * 0.012 * SZ, hexA(c, 0.5 - k * 0.1), 2, 2);
      px(X - 2, y - 1, shift(c, -1.5), 5, 3); px(X - 1, y - 2, shift(c, -1.5), 3, 5); px(X - 1, y - 1, c, 3, 3); px(X - 1, y - 1, '#ffffff', 1, 1);
    }
    for (const f of this.fx) {
      const a = 1 - f.t / f.life;
      if (f.kind === 'spark') { px(f.x, f.y, f.c, 2, 2); if (a > 0.5) px(f.x, f.y, '#ffffff', 1, 1); }
      else if (f.kind === 'dot') px(f.x - f.r / 2, f.y - f.r / 2, hexA(f.c, a), f.r, f.r);
      else if (f.kind === 'plus') { px(f.x - 1, f.y, f.c, 3, 1); px(f.x, f.y - 1, f.c, 1, 3); }
      else if (f.kind === 'star') { const r = Math.round(f.r * (0.6 + a * 0.6)); px(f.x - r, f.y, f.c, r * 2 + 1, 1); px(f.x, f.y - r, f.c, 1, r * 2 + 1); px(f.x - (r >> 1), f.y - (r >> 1), f.c, 1, 1); px(f.x + (r >> 1), f.y + (r >> 1), f.c, 1, 1); px(f.x + (r >> 1), f.y - (r >> 1), f.c, 1, 1); px(f.x - (r >> 1), f.y + (r >> 1), f.c, 1, 1); }
      else if (f.kind === 'ring') { const r = f.r * (1.2 - a * 0.9); ctx.fillStyle = hexA(f.c, a); for (let k = 0; k < 360; k += 8) { const rr = k * Math.PI / 180; ctx.fillRect(Math.round(f.x - cam.x + Math.cos(rr) * r), Math.round(f.y - cam.y + Math.sin(rr) * r * 0.6), 2, 1); } }
    }
    // hit flash: overdraw a white silhouette… (cheap: a short white ring under the unit)
    for (const [, r] of this.units) if (r.flash > 0 && r.u.onField) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(Math.round(r.a.x - cam.x - 6), Math.round(r.a.y - cam.y - 1), 12, 2); }
  }

  render(t) { bank.tick(4); return this.sc.render(t); }

  // ------------------------------------------------------------------ HUD + controls
  drawUI(ui) {
    if (!this.active) return;
    const st = this.st, me = this.me(), W = ui.w, H = ui.h, cam = this.sc.cam;
    // order countdown + name/HP over each unit
    for (const [, r] of this.units) {
      const u = r.u; if (!u.onField || u.state === 'faint') continue;
      const x = Math.round(r.a.x - cam.x), y = Math.round(r.a.y - cam.y) - 46;
      ui.bar(x - 12, y, 24, 2, u.hp / u.maxHp, {});
      if (u.side === 0 && u.order && u.order.dur > 0) { ui.bar(x - 12, y - 5, 24, 2, 1 - u.order.t / u.order.dur, { color: T.cyan }); ui.icon(u.order.cmd.type === 'dodge' ? 'dodge' : u.order.cmd.type === 'skill' ? 'star' : 'fist', x + 14, y - 8, T.cyan); }
      if (u.bonded) { ui.icon('link', x - 4, y - 14 + Math.round(Math.sin(this.t * 6)), T.cyan); }
    }
    // damage pops
    for (const p of this.pops) { const y = Math.round(p.y - cam.y - p.t * 22), x = Math.round(p.x - cam.x); if (p.t < 0.9) ui.text(p.str, x, y, p.c, { align: 'center', outline: true, scale: p.scale }); }
    // panels: you (left), foe (right)
    const panel = (u, x, y, right) => {
      const pw = 132; if (right) x -= pw;
      ui.panel(x, y, pw, 30, {});
      const sp = SPECIES[u.species];
      ui.icon(u.elem === 'pyro' ? 'flame' : u.elem === 'hydro' ? 'drop' : u.elem === 'bio' ? 'leaf' : 'star', x + 5, y + 5, ELC(u.elem));
      ui.text(`${sp ? sp.name : u.name}`, x + 15, y + 5, T.text, { shadow: T.ink });
      ui.text(`Lv${u.level}`, x + pw - 6, y + 5, T.dim, { align: 'right', mini: true });
      ui.bar(x + 6, y + 16, pw - 12, 4, u.hp / u.maxHp, { seg: 4 });
      if (!right) { ui.bar(x + 6, y + 23, (pw - 12) * 0.62, 2, u.energy / 100, { color: T.cyan }); ui.bar(x + 6 + (pw - 12) * 0.66, y + 23, (pw - 12) * 0.34, 2, (u.ult || 0) / 100, { color: T.amber }); }
      else ui.text(`${Math.ceil(u.hp)}/${u.maxHp}`, x + pw - 6, y + 22, T.dim, { align: 'right', mini: true });
    };
    if (me) panel(me, 4, 4, false);
    const foe = this.foe(); if (foe) panel(foe, W - 4, 4, true);
    // controls
    if (me && !this.ending && !this.frozen) this.controls(ui, me);
    // callouts
    for (const c of this.callouts) {
      const a = Math.min(1, c.t * 8, (c.dur - c.t) * 5), y = Math.round(H * (c.big ? 0.36 : 0.26) - (1 - a) * 6);
      if (a <= 0) continue;
      ui.text(c.str, W >> 1, y, c.c, { align: 'center', outline: true, scale: c.big ? 3 : 2, spacing: 2 });
      if (c.sub) ui.text(c.sub, W >> 1, y + (c.big ? 26 : 18), T.text, { align: 'center', outline: true });
    }
  }
  controls(ui, me) {
    const W = ui.w, H = ui.h, st = this.st, T_ = this.ptr;
    const cmd = (c) => { if (order(st, me.id, c)) this.app.audio.sfx('ui_tap'); };
    const target = () => { const f = this.foe(); return f ? f.id : undefined; };
    // skills row
    const n = Math.max(1, me.skills.length), bw = Math.min(112, Math.floor((W - 70 - 4 * 3) / 4)), bh = 22, y = H - bh - 6;
    me.skills.forEach((id, i) => {
      const sk = SKILLS[id]; if (!sk) return;
      const x = 6 + i * (bw + 3), cd = cooldownFrac(st, me, id), cost = skillCost(me, id), ok = cd <= 0 && me.energy >= cost;
      const name = skillName(me, id), short = name.length * 6 > bw - 16 ? name.slice(0, Math.max(3, Math.floor((bw - 18) / 6))) + '.' : name;
      if (ui.button(x, y, bw, bh, short, { color: ELC(sk.elem), disabled: !ok, key: String(i + 1), hotkey: String(i + 1), sub: cost ? String(cost) : '' })) cmd({ type: 'skill', id, target: target() });
      if (cd > 0) { // cooldown: a dithered shade sweeping down + seconds left, the name stays readable
        const h = Math.round((bh - 4) * cd);
        for (let j = 0; j < h; j++) for (let i = 0; i < bw - 4; i++) if ((i + j) % 2 === 0) ui.px(x + 2 + i, y + 2 + (bh - 4 - h) + j, '#120c1c');
        ui.text(Math.ceil(cd * (sk.cd || 1)) + 's', x + bw - 4, y + 3, T.amber, { align: 'right', mini: true });
      }
    });
    // action column (right side)
    const ax = W - 52, ab = 46, ah = 17;
    let yy = H - 6 - ah;
    const act = (label, icon, color, key, fn, o = {}) => { if (ui.button(ax, yy, ab, ah, label, Object.assign({ icon, color, hotkey: key }, o))) fn(); yy -= ah + 3; };
    act('Atk', 'fist', T.amber, ' ', () => cmd({ type: 'attack', id: target() }));
    act('Dodge', 'dodge', T.cyan, 'Shift', () => { const f = this.foe(); let dx = 1, dz = 0; if (f) { dx = -(f.z - me.z); dz = f.x - me.x; if (Math.random() < 0.5) { dx = -dx; dz = -dz; } } cmd({ type: 'dodge', dx, dz }); });
    const canBond = st.rules.bond && T_.canBond && !T_.bonded && T_.bondCd <= 0;
    if (me.bonded && me.ultSkill) act('Ult', 'star', T.amber, 'f', () => order(st, me.id, { type: 'ult' }), { disabled: (me.ult || 0) < 100 });
    else act(T_.bonded ? 'Unbond' : T_.bondCd > 0 ? Math.ceil(T_.bondCd) + 's' : 'Bond', 'link', T.cyan, 'b', () => trainerCommand(st, T_.id, { type: T_.bonded ? 'unbond' : 'bond' }), { disabled: !T_.bonded && !canBond });
    const bench = T_.team.map((id) => unitById(st, id)).filter((u) => u && u.id !== me.id && u.state !== 'faint');
    act(T_.switching ? Math.ceil(switchLeft(T_)) + 's' : 'Swap', 'swap', T.green, 'Tab', () => trainerCommand(st, T_.id, { type: 'switch', to: bench[0] && bench[0].id }), { disabled: !bench.length || !!T_.switching || T_.switchCd > 0 });
    act('Emote', 'smile', T.pink, 'e', () => cmd({ type: 'emote', id: Object.keys(EMOTES)[0] }), { disabled: me.emoteCd > 0 });
    const hasItem = Object.values(T_.items || {}).some((v) => v > 0);
    act('Item', 'bag', T.green, 'q', () => { const id = ['takoyaki', 'okonomiyaki', 'ramune', 'matcha'].find((k) => (T_.items[k] || 0) > 0); if (id && trainerCommand(st, T_.id, { type: 'item', id })) this.app.audio.sfx('bio_heal'); }, { disabled: !hasItem });
    // tap the arena: target a foe or move there
    const app = this.app;
    if (app.tapWorld) {
      const [tx, ty] = app.tapWorld; app.tapWorld = null;
      const wx = tx + this.sc.cam.x, wy = ty + this.sc.cam.y;
      let best = null, bd = 22;
      for (const [, r] of this.units) if (r.u.onField && r.u.side === 1 && r.u.state !== 'faint') { const d = Math.hypot(r.a.x - wx, r.a.y - 16 - wy); if (d < bd) { bd = d; best = r.u; } }
      if (best) cmd({ type: 'target', id: best.id });
      else { let x = (wx - this.ox) / SX, z = (wy - this.oy) / SZ; const d = Math.hypot(x, z), R = st.arena.r - 0.4; if (d > R) { x *= R / d; z *= R / d; } cmd({ type: 'move', x, z }); this.fx.push({ kind: 'ring', x: wx, y: wy, t: 0, life: 0.3, c: T.cyan, r: 8 }); }
    }
  }

  // ------------------------------------------------------------------ end
  async end() {
    this.ending = true;
    const app = this.app, st = this.st, r = st.result, won = r.winner === 0;
    for (const [, rec] of this.units) if (rec.u.side === r.winner && rec.u.onField && rec.u.state !== 'faint') { rec.spr.play('happy', { restart: true }); rec.once = this.t + 9; }
    app.audio.stinger && app.audio.stinger(won ? 'victory' : 'defeat');
    this.callout(won ? 'VICTORY!' : r.reason === 'flee' ? 'GOT AWAY' : 'DEFEAT…', won ? '' : 'your team needs rest', won ? T.amber : '#9fb3ff', 2.4, true);
    await app.wait(2200);
    const lines = this.rewards(r);
    for (const l of lines) app.ui.toast(l, { icon: 'star', dur: 3 });
    await app.wait(600);
    this.cleanup();
    this.resolve(r);
  }
  rewards(r) {
    const s = this.app.state, out = [];
    s.stats.battles++; const won = r.winner === 0; if (won) s.stats.wins++;
    const parts = [];
    for (const u of r.units) { if (u.side !== 0) { S.seen(s, u.species); continue; } const mon = S.monByUid(s, u.uid); if (!mon) continue; mon.hp = u.fainted ? 0 : Math.max(0.05, u.hp / u.maxHp); if (u.took) parts.push(mon); }
    for (const id of r.used.items || []) S.addItem(s, id, -1);
    if (won && parts.length) {
      let exp = 0; for (const u of r.units) if (u.side === 1) exp += ((SPECIES[u.species].exp || 50) * (u.level || 5)) / 6;
      exp *= 1.4;
      for (const mon of parts) { const ups = gainExp(mon, exp); addFriendship(mon, 3); if (ups.length) out.push(`${SPECIES[mon.species].name} grew to Lv${mon.level}!`); }
      out.unshift(`+${Math.round(exp)} EXP`);
      if (this.spec.money) { s.money += this.spec.money; out.push(`+¥${this.spec.money}`); }
    } else if (!won) for (const m of s.party) if (!m.hp) m.hp = 0.15;
    this.app.save();
    return out;
  }
  cleanup() {
    this.active = false;
    this.sc.fx = this.sc.fx.filter((f) => f !== this.fxPainter);
    this.sc.actors.clear(); for (const a of this.savedActors) this.sc.actors.add(a);
    for (const n of this.app.world.npcs) n.a.hidden = false;
  }
}
function hexA(h, a) { const v = parseInt(String(h).slice(1, 7), 16); return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${Math.max(0, Math.min(1, a))})`; }
