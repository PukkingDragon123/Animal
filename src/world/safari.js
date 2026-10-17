// Safari layer: wild Elemon with awareness & temperament, stealth (sneak +
// tall grass), ambushes, rare/time-of-day spawns, untameable wild beasts that
// patrol and charge, a boss, and hidden star fragments.
import * as THREE from '../../vendor/three.module.js';
import { creatureDesign } from '../data/designs/index.js';
import { SPECIES } from '../data/species.js';
import { findPath } from './nav.js';
import { SPR } from '../gfx/particles.js';
import { h } from '../ui/dom.js';

const STAR = { id: 'star_fragment', vs: 0.05, arch: 'static', pal: { a: '#fff6b0', b: '#ffd23a' }, parts: [{ n: 'body', p: [0, 0.5, 0], s: [['poly', [0, 0.5, 0], [[0, 0.3], [0.08, 0.08], [0.3, 0.06], [0.11, -0.07], [0.18, -0.3], [0, -0.15], [-0.18, -0.3], [-0.11, -0.07], [-0.3, 0.06], [-0.08, 0.08]], 0.06, 'a', { glow: 3 }]], spin: { axis: 'y', speed: 2 } }] };

export class Safari {
  constructor(world, cfg) {
    this.w = world; this.cfg = cfg; this.app = world.app;
    this.wild = []; this.beasts = []; this.n = 0;
    this.detect = 0;
    this.hud = null;
    this.engaging = false;
    this.grace = 10;   // seconds after arriving before beasts hunt the player
  }
  inGrass(x, z) { for (const [gx, gz, gw, gh] of this.cfg.grass || []) if (x >= gx && x <= gx + gw && z >= gz && z <= gz + gh) return true; return false; }
  populate() {
    const hour = this.app.state.time.hour;
    const inHours = (s) => !s.hours || (s.hours[0] <= s.hours[1] ? hour >= s.hours[0] && hour < s.hours[1] : hour >= s.hours[0] || hour < s.hours[1]);
    for (const s of this.cfg.spawns || []) {
      if (!SPECIES[s.species] || !inHours(s)) continue;
      const count = s.rare ? (Math.random() < 0.45 ? 1 : 0) : Math.max(1, Math.round((s.weight || 1) * (0.8 + Math.random() * 0.8)));
      for (let i = 0; i < count; i++) this.spawnWild(s);
    }
    for (const b of this.cfg.beasts || []) {
      if (this.app.state.flags['repelled_' + this.w.mapId + '_' + b.species]) continue;
      // start on the path node farthest from where the player arrives
      const pl = this.w.actor('player');
      let i0 = 0, best = -1;
      b.path.forEach((q, i) => { const d = pl ? Math.hypot(q[0] - pl.pos.x, q[1] - pl.pos.z) : 0; if (d > best) { best = d; i0 = i; } });
      const p = b.path[i0];
      const rec = this.w.addActor('beast' + this.n++, creatureDesign(b.species), p[0], p[1], 0, { kind: 'beast', key: b.species, speed: b.speed || 2.2, rec: { beast: { def: b, i: i0, state: 'patrol', cool: 0, species: b.species } } });
      this.beasts.push(rec);
    }
    if (this.cfg.boss && !this.app.state.flags['boss_' + this.w.mapId]) {
      const b = this.cfg.boss;
      const rec = this.w.addActor('boss', creatureDesign(b.species), b.x, b.z, 180, { kind: 'wild', key: b.species, rec: { wild: { species: b.species, level: b.level || 14, temper: 'boss', state: 'idle', home: [b.x, b.z], r: 0.5, alert: 0, boss: true } } });
      rec.mark = '👑';
      rec.label = this.app.ui.label('');
      this.wild.push(rec);
    }
    (this.cfg.fragments || []).forEach(([x, z], i) => {
      const key = `frag_${this.w.mapId}_${i}`;
      if (this.app.state.flags[key]) return;
      const rec = this.w.addActor('frag' + i, STAR, x, z, 0, { kind: 'pickup', key: 'star_fragment', rec: { frag: key } });
      rec.actor.setVisible(false);
    });
    this.buildHud();
  }
  spawnWild(s) {
    let x = s.x + (Math.random() - 0.5) * 2 * (s.r || 2), z = s.z + (Math.random() - 0.5) * 2 * (s.r || 2);
    if (!this.w.grid.walkable(Math.floor(x), Math.floor(z))) { x = s.x; z = s.z; }
    const lv = s.level ? s.level[0] + Math.floor(Math.random() * (s.level[1] - s.level[0] + 1)) : 5;
    const sp = SPECIES[s.species];
    const rec = this.w.addActor('wild' + this.n++, creatureDesign(s.species), x, z, Math.random() * 360, { kind: 'wild', key: s.species, speed: 1.4, rec: { wild: { species: s.species, level: lv, temper: sp.temper, state: 'idle', home: [s.x, s.z], r: s.r || 2, alert: 0, rare: !!s.rare, sneakOnly: !!s.sneakOnly, wanderT: Math.random() * 3 } } });
    if (s.sneakOnly) rec.actor.setVisible(false);
    this.wild.push(rec);
    return rec;
  }
  buildHud() {
    const hud = this.app.ui.L.hud;
    this.hud = h('div.stealth', {}, h('span', {}, '👁'), h('div.bar', {}, h('i')), h('span.lbl', {}, 'Hidden'));
    hud.append(this.hud);
    this.app.hud && this.app.hud.showSneak(true);
  }
  dispose() {
    if (this.hud) this.hud.remove();
    this.app.hud && this.app.hud.showSneak(false);
  }
  update(dt) {
    const w = this.w, pl = w.rec('player');
    this.grace = Math.max(0, this.grace - dt);
    if (!pl || this.engaging) return;
    const p = pl.actor.pos;
    const moving = !!pl.path || pl.kbd;
    const sneaking = w.sneak;
    const grass = this.inGrass(p.x, p.z);
    const noise = (moving ? (sneaking ? 0.35 : 1.0) : 0.12) * (grass ? 0.45 : 1) * (this.app.gfx.tod.night > 0.5 ? 0.8 : 1);
    let maxAlert = 0;
    for (const r of this.wild) {
      if (!this.w.actors.has(r.id)) continue;
      const W = r.wild, a = r.actor;
      const dx = p.x - a.pos.x, dz = p.z - a.pos.z, d = Math.hypot(dx, dz);
      if (W.sneakOnly) { const vis = sneaking && d < 9; if (vis !== a.visible) { a.setVisible(vis); if (vis) a.dissolve(-1, 0.6, 0xa07aff); } }
      if (W.boss) { if (d < 6 && !W.warned) { W.warned = true; a.play('roar'); a.emote('anger'); this.app.ui.toast('The Alpha Lemmo has noticed you…'); } if (d < 2.6 && this.w.control) this.engage(r); continue; }
      // facing-based perception: harder to notice from behind
      const facing = Math.cos(Math.atan2(dx, dz) - a.yaw);
      const sight = (W.temper === 'aggressive' ? 8 : W.temper === 'territorial' ? 6.5 : 7) * (facing > 0 ? 1 : 0.55);
      const perceive = d < sight ? noise * (1 - d / sight) * 2.4 : 0;
      W.alert = Math.max(0, Math.min(1.2, W.alert + (perceive - 0.25) * dt));
      maxAlert = Math.max(maxAlert, W.alert);
      if (W.alert > 0.35 && W.state === 'idle') { W.state = 'curious'; a.emote('?'); a.faceTo(p.x, p.z); }
      if (W.alert > 0.9 && W.state !== 'alert') {
        W.state = 'alert'; a.emote('!'); a.play('roar');
        this.app.audio.sfx('alert');
      }
      if (W.state === 'alert') {
        if (W.temper === 'skittish' || W.temper === 'shy' || (W.temper === 'curious' && W.alert > 1.1)) { // flee
          if (!r.path) { const fx = a.pos.x - dx / d * 5, fz = a.pos.z - dz / d * 5; const path = findPath(w.grid, a.pos.x, a.pos.z, fx, fz); if (path) { r.path = path; r.speed = 4.5; } }
          if (d > 12) { W.state = 'idle'; W.alert = 0; }
        } else if (W.temper === 'aggressive' || W.temper === 'territorial') { // charge
          r.path = [[p.x, p.z]]; r.speed = 4.2;
          if (d < 1.4 && this.w.control) { this.engage(r, { charged: true }); return; }
        } else W.state = 'curious';
      } else if (W.state === 'curious') { a.faceTo(p.x, p.z); if (W.alert < 0.2) W.state = 'idle'; }
      else { // idle wander
        W.wanderT -= dt;
        if (W.wanderT <= 0 && !r.path) {
          W.wanderT = 2.5 + Math.random() * 4;
          const tx = W.home[0] + (Math.random() - 0.5) * 2 * W.r, tz = W.home[1] + (Math.random() - 0.5) * 2 * W.r;
          if (w.grid.walkable(Math.floor(tx), Math.floor(tz))) { const path = findPath(w.grid, a.pos.x, a.pos.z, tx, tz); if (path && path.length < 6) { r.path = path; r.speed = 1.3; } }
          if (Math.random() < 0.3) a.play(['sniff', 'happy', 'hop', 'spin'][Math.floor(Math.random() * 4)]);
        }
      }
      // ambush prompt: unaware + close + sneaking
      r.mark = W.state === 'idle' && d < 3 && sneaking ? '✨' : W.state === 'alert' ? '❗' : W.state === 'curious' ? '❓' : null;
      if (!r.label) r.label = this.app.ui.label('');
    }
    // beasts
    for (const r of this.beasts) {
      if (!this.w.actors.has(r.id)) continue;
      const B = r.beast, a = r.actor;
      const dx = p.x - a.pos.x, dz = p.z - a.pos.z, d = Math.hypot(dx, dz);
      B.cool = Math.max(0, B.cool - dt);
      const sees = d < (sneaking ? 4.5 : 8.5) * (grass ? 0.6 : 1) && B.cool <= 0 && this.grace <= 0;
      if (B.state === 'patrol') {
        if (sees) { B.state = 'chase'; a.play('roar'); a.emote('anger'); this.app.audio.sfx('beast_roar'); this.app.ui.toast(`⚠️ A wild ${SPECIES[B.species].name} is charging!`, 'gold'); this.app.gfx.rig.shake(0.3); }
        else if (!r.path) { B.i = (B.i + 1) % B.def.path.length; const [tx, tz] = B.def.path[B.i]; const path = findPath(w.grid, a.pos.x, a.pos.z, tx, tz); r.path = path || null; r.speed = B.def.speed || 2.2; }
      } else if (B.state === 'chase') {
        r.path = [[p.x, p.z]]; r.speed = 5.4;
        if (Math.random() < dt * 8) this.app.gfx.fx.particle({ pos: [a.pos.x, a.pos.y + 0.1, a.pos.z], vel: [0, 0.4, 0], life: 0.6, size: 0.3, size1: 0.7, color: [0.6, 0.5, 0.4, 0.5], color1: [0.6, 0.5, 0.4, 0], sprite: SPR.smoke, additive: false });
        if (d > 14) { B.state = 'patrol'; r.path = null; }
        if (d < 1.5 && this.w.control) { this.beastHit(r); return; }
      }
      maxAlert = Math.max(maxAlert, B.state === 'chase' ? 1 : 0);
    }
    // fragments: sparkle when close
    for (const [id, r] of this.w.actors) {
      if (r.kind !== 'pickup') continue;
      const a = r.actor, d = Math.hypot(p.x - a.pos.x, p.z - a.pos.z);
      const vis = d < 6 || this.app.gfx.tod.night > 0.6;
      if (vis !== a.visible) a.setVisible(vis);
      if (vis && Math.random() < dt * 6) this.app.gfx.fx.particle({ pos: [a.pos.x + (Math.random() - 0.5) * 0.6, a.pos.y + 0.6 + Math.random() * 0.5, a.pos.z + (Math.random() - 0.5) * 0.6], vel: [0, 0.4, 0], life: 0.8, size: 0.14, color: [2.6, 2.4, 1.2, 1], color1: [2, 2, 1, 0], sprite: SPR.star });
      r.mark = d < 6 ? '✨' : null;
      if (!r.label) r.label = this.app.ui.label('');
    }
    this.detect += (maxAlert - this.detect) * Math.min(1, dt * 6);
    if (this.hud) {
      this.hud.querySelector('i').style.width = Math.min(100, this.detect * 100) + '%';
      this.hud.querySelector('.lbl').textContent = this.detect > 0.85 ? 'Spotted!' : this.detect > 0.35 ? 'Noticed…' : grass ? 'Hidden in grass' : sneaking ? 'Sneaking' : 'Exposed';
    }
  }
  async engage(r, opts = {}) {
    if (this.engaging || !this.w.actors.has(r.id)) return;
    this.engaging = true;
    const W = r.wild;
    const pl = this.w.rec('player').actor;
    const behind = Math.cos(Math.atan2(pl.pos.x - r.actor.pos.x, pl.pos.z - r.actor.pos.z) - r.actor.yaw) < -0.2;
    const ambush = !opts.charged && W.state === 'idle' && this.w.sneak && behind;
    if (ambush) this.app.ui.callout('AMBUSH!', 'Sneak attack — easier capture', '#a6ff4a', 1200);
    r.path = null;
    const res = await this.app.game.wildBattle(W.species, W.level, { ambush, boss: W.boss, actor: r.actor, mapId: this.w.mapId });
    this.engaging = false;
    if (!res) return;
    if (res.reason === 'capture' || res.winner === 0) {
      r.actor.dissolve(1, 0.6);
      setTimeout(() => this.w.removeActor(r.id), 650);
      this.wild = this.wild.filter((x) => x !== r);
      if (W.boss) this.app.state.flags['boss_' + this.w.mapId] = true;
      // keep the reserve lively: respawn commons after a while
      if (!W.rare && !W.boss) { const def = (this.cfg.spawns || []).find((s) => s.species === W.species); if (def) setTimeout(() => { if (this.w.safari === this) this.spawnWild(def); }, 25000); }
    } else { W.state = 'idle'; W.alert = 0; }
  }
  async beastHit(r) {
    if (this.engaging) return;
    this.engaging = true;
    const B = r.beast;
    this.app.gfx.impact(1.2); this.app.audio.sfx('hit_heavy');
    // the charge scatters nearby wild Elemon
    for (const wr of this.wild) { if (!wr.wild.boss && Math.hypot(wr.actor.pos.x - r.actor.pos.x, wr.actor.pos.z - r.actor.pos.z) < 9) { wr.wild.alert = 1.2; wr.wild.state = 'alert'; } }
    const res = await this.app.game.beastBattle(B.species, { actor: r.actor, mapId: this.w.mapId });
    this.engaging = false;
    if (res && res.winner === 0) {
      r.actor.play('shakeoff'); r.actor.emote('sweat');
      this.app.state.flags['repelled_' + this.w.mapId + '_' + B.species] = true;
      setTimeout(() => { r.actor.dissolve(1, 0.8); setTimeout(() => this.w.removeActor(r.id), 850); }, 600);
      this.beasts = this.beasts.filter((x) => x !== r);
    } else { B.cool = 12; B.state = 'patrol'; }
  }
  pickup(r) {
    this.app.state.flags[r.frag] = true;
    this.app.game.give('star_fragment', 1);
    this.app.ui.callout('STAR FRAGMENT!', 'It hums with starlight…', '#ffe36b', 1400);
    this.app.audio.sfx('evolve_burst');
    r.actor.dissolve(1, 0.6, 0xfff0a0);
    setTimeout(() => this.w.removeActor(r.id), 650);
  }
}
