// Overworld scene: loads a map diorama, tap-to-move with A* paths, buddy Elemon
// + companions following, NPCs, exits & zone triggers, occlusion fade,
// ambient particles and the safari layer.
import * as THREE from '../../vendor/three.module.js';
import { buildGrid } from './map.js';
import { findPath } from './nav.js';
import { buildEnvironment, updateEnvironment, disposeEnvironment, restoreProps, setPropLibrary } from '../gfx/env.js';
import { Actor } from '../gfx/actor.js';
import { shared } from '../gfx/materials.js';
import { SPR } from '../gfx/particles.js';
import { creatureDesign, humanDesignFor, PROPS, HUMANS, characterLore } from '../data/designs/index.js';
import { Safari } from './safari.js';
import { clamp, damp, headingTo } from '../core/mathx.js';
import { hashStr } from '../core/rng.js';
import { tileDef } from './tiles.js';

setPropLibrary(PROPS);
const mapCache = new Map();
export async function loadMapDef(id) {
  if (mapCache.has(id)) return mapCache.get(id);
  const mod = await import(`./maps/${id}.js`);
  mapCache.set(id, mod.default);
  return mod.default;
}

export class WorldScene {
  constructor(app) {
    this.app = app; this.gfx = app.gfx; this.ui = app.ui; this.audio = app.audio;
    this.env = null; this.grid = null; this.def = null;
    this.actors = new Map();        // id → { actor, kind, npc, path, speed, ... }
    this.control = false;           // player input enabled
    this.followers = [];            // ids following the player
    this.trail = [];
    this.zoneWaiters = [];
    this.handlers = new Map();      // npc id → interact fn
    this.sneak = false;
    this.ray = new THREE.Raycaster();
    this.time = 0;
    this._v = new THREE.Vector3();
    this.ambientT = 0;
  }
  get state() { return this.app.state; }

  // ------------------------------------------------------------------ loading
  async load(mapId, spawn = 'start', opts = {}) {
    const def = await loadMapDef(mapId);
    this.unload();
    this.def = def;
    this.grid = buildGrid(def);
    this.env = buildEnvironment(def, this.grid);
    this.gfx.world.add(this.env.group);
    for (const m of this.env.emissiveMats) this.gfx.registerEmissive(m, 1);
    this.gfx.lights.setStatic(this.env.lights);
    this.gfx.fx.debris.groundAt = (x, z) => this.grid.heightAt(x, z);
    const [W, H] = def.size;
    this.gfx.rig.bounds = { minX: 2, maxX: W - 2, minZ: 2, maxZ: H - 2 };
    const sp = this.resolvePoint(spawn) || this.resolvePoint('start') || [W / 2, H / 2];
    // player + buddy
    this.ensurePlayer();
    this.place('player', sp[0], sp[1], sp[2]);
    this.refreshBuddy(true);
    // companions
    for (const id of this.followers) if (this.actors.has(id)) this.place(id, sp[0] + 0.8, sp[1] + 1.2);
    // npcs
    for (const n of def.npcs || []) {
      if (opts.hideNpcs && opts.hideNpcs.includes(n.id)) continue;
      if (this.app.story && this.app.story.npcHidden && this.app.story.npcHidden(mapId, n.id)) continue;
      this.addNpc(n);
    }
    this.trail = [];
    this.gfx.rig.target.set(sp[0], this.grid.heightAt(sp[0], sp[1]), sp[1]);
    this.gfx.rig.snap();
    this.gfx.rig.distT = opts.dist || 20; this.gfx.rig.dist = this.gfx.rig.distT;
    this.safari = def.safari ? new Safari(this, def.safari) : null;
    if (this.safari) this.safari.populate();
    const amb = def.ambience || {};
    if (opts.music !== false) this.audio.music(opts.music || amb.music || 'park');
    this.audio.ambience && this.audio.ambience(amb.sound || null);
    this.state.map = { id: mapId, x: sp[0], z: sp[1] };
    this.mapId = mapId;
    if (opts.banner !== false) this.ui.banner(def.name, def.area || '');
    return def;
  }
  unload() {
    for (const [id, a] of this.actors) if (id !== 'player' && id !== 'buddy' && !this.followers.includes(id)) { a.actor.dispose(); if (a.label) this.ui.freeLabel(a.label); this.actors.delete(id); }
    if (this.safari) { this.safari.dispose(); this.safari = null; }
    if (this.env) { this.gfx.world.remove(this.env.group); disposeEnvironment(this.env); this.gfx.emissives = []; this.env = null; }
    this.zoneWaiters = [];
    this.handlers.clear();
  }
  resolvePoint(p) {
    if (Array.isArray(p)) return p;
    const d = this.def;
    if (!p || !d) return null;
    if (d.points && d.points[p]) return d.points[p];
    if (d.spawns && d.spawns[p]) return d.spawns[p];
    if (d.arenas && d.arenas[p]) return [d.arenas[p].x, d.arenas[p].z];
    return null;
  }
  arena(name) { const a = this.def && this.def.arenas && (this.def.arenas[name] || Object.values(this.def.arenas)[0]); return a || { x: this.def.size[0] / 2, z: this.def.size[1] / 2, r: 7 }; }

  // ------------------------------------------------------------------ actors
  ensurePlayer() {
    const look = this.app.playerLook();
    const key = JSON.stringify(look);
    const cur = this.actors.get('player');
    if (cur && cur.lookKey === key) return cur;
    let pos = null, yaw = 0;
    if (cur) { pos = cur.actor.pos.clone(); yaw = cur.actor.yaw; cur.actor.dispose(); }
    const actor = new Actor(this.gfx, humanDesignFor(look), null, {});
    const rec = { id: 'player', actor, kind: 'player', path: null, speed: 4.6, lookKey: key };
    this.actors.set('player', rec);
    if (pos) { actor.setPos(pos.x, pos.y, pos.z); actor.face(yaw, true); }
    return rec;
  }
  refreshBuddy(snap = false) {
    const lead = this.state.party[0];
    const cur = this.actors.get('buddy');
    if (!lead) { if (cur) { cur.actor.dispose(); this.actors.delete('buddy'); } return null; }
    if (cur && cur.species === lead.species) return cur;
    const p = this.actors.get('player').actor.pos;
    if (cur) cur.actor.dispose();
    const actor = new Actor(this.gfx, creatureDesign(lead.species), lead.species, {});
    actor.setPos(p.x - 1, p.y, p.z + 0.8);
    const rec = { id: 'buddy', actor, kind: 'buddy', species: lead.species, speed: 5 };
    this.actors.set('buddy', rec);
    if (!snap) { actor.dissolve(-1, 0.5); actor.play('spawn'); }
    return rec;
  }
  addActor(id, design, x, z, face = 0, opts = {}) {
    if (this.actors.has(id)) this.removeActor(id);
    const actor = new Actor(this.gfx, design, opts.key || null, opts);
    const y = this.grid ? this.grid.heightAt(x, z) : 0;
    actor.setPos(x, y, z); actor.face((face * Math.PI) / 180, true);
    const rec = Object.assign({ id, actor, kind: opts.kind || 'npc', speed: opts.speed || 3.6, path: null }, opts.rec || {});
    this.actors.set(id, rec);
    return rec;
  }
  addNpc(n) {
    let design;
    if (typeof n.char === 'string') design = humanDesignFor(n.char);
    else if (n.char && n.char.random != null) design = humanDesignFor(HUMANS.randomLook ? HUMANS.randomLook(n.char.random, n.char.role) : {});
    else if (n.species) design = creatureDesign(n.species);
    else design = humanDesignFor(n.char || {});
    if (!design) return null;
    const rec = this.addActor(n.id, design, n.x, n.z, n.face || 0, { kind: 'npc', rec: { npc: n, home: [n.x, n.z], wanderT: 2 + Math.random() * 4 } });
    if (n.idle) rec.actor.play(n.idle);
    if (n.mode) rec.actor.mode(n.mode);
    rec.label = this.ui.label('');
    return rec;
  }
  removeActor(id) { const r = this.actors.get(id); if (!r) return; r.actor.dispose(); if (r.label) this.ui.freeLabel(r.label); this.actors.delete(id); this.followers = this.followers.filter((f) => f !== id); }
  actor(id) { const r = this.actors.get(id); return r ? r.actor : null; }
  rec(id) { return this.actors.get(id) || null; }
  place(id, x, z, faceDeg) {
    const r = this.actors.get(id); if (!r) return;
    const y = this.grid ? this.grid.heightAt(x, z) : 0;
    r.actor.setPos(x, y, z);
    if (faceDeg != null) r.actor.face((faceDeg * Math.PI) / 180, true);
    r.path = null;
  }
  setFollowers(ids) { this.followers = ids.filter((id) => this.actors.has(id)); }

  // walk an actor to a point; resolves on arrival
  walkTo(id, x, z, opts = {}) {
    const r = this.actors.get(id);
    if (!r) return Promise.resolve(false);
    if (typeof x === 'string') { const p = this.resolvePoint(x); if (!p) return Promise.resolve(false); [x, z] = p; }
    const a = r.actor;
    const path = this.grid ? findPath(this.grid, a.pos.x, a.pos.z, x, z) : [[x, z]];
    if (!path) { a.setPos(x, this.grid.heightAt(x, z), z); return Promise.resolve(true); }
    r.path = path; r.pathRun = !!opts.run; r.stopDist = opts.stop || 0.08;
    return new Promise((res) => { r.onArrive = res; });
  }

  // ------------------------------------------------------------------ input
  enableControl(on) {
    this.control = on;
    const I = this.app.input;
    if (on && !this._h) {
      this._h = [
        I.on('tap', (e) => this.onTap(e)),
        I.on('wheel', (e) => { this.gfx.rig.distT = clamp(this.gfx.rig.distT * (1 + e.dy * 0.001), 11, 32); }),
        I.on('pinch', (e) => { this.gfx.rig.distT = clamp(this.gfx.rig.distT / e.scale, 11, 32); if (Math.abs(e.rot) > 0.002) this.gfx.rig.yawT -= e.rot; }),
        I.on('key', (e) => { if (e.down && e.code === 'KeyE') this.interactNearest(); if (e.down && e.code === 'KeyQ') this.gfx.rig.rotateBy(Math.PI / 2); if (e.down && e.code === 'KeyR') this.gfx.rig.rotateBy(-Math.PI / 2); }),
      ];
    } else if (!on && this._h) { for (const off of this._h) off(); this._h = null; const p = this.actors.get('player'); if (p) p.path = null; }
  }
  screenToGround(x, y) {
    const ndc = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    this.ray.setFromCamera(ndc, this.gfx.camera);
    // march the ray against the height field
    const o = this.ray.ray.origin, d = this.ray.ray.direction;
    let t = 0;
    for (let i = 0; i < 400; i++) {
      t += 0.15;
      const px = o.x + d.x * t, py = o.y + d.y * t, pz = o.z + d.z * t;
      const gy = this.grid.heightAt(px, pz);
      if (py <= gy + 0.02 && px >= 0 && pz >= 0 && px < this.grid.w && pz < this.grid.h) return { x: px, z: pz };
      if (py < -4) break;
    }
    const p = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return { x: p.x, z: p.z };
    return null;
  }
  pickActor(x, y) {
    let best = null, bd = 70;
    for (const [id, r] of this.actors) {
      if (id === 'player' || id === 'buddy' || !r.actor.visible) continue;
      if (r.kind !== 'npc' && r.kind !== 'wild' && r.kind !== 'pickup') continue;
      const a = r.actor;
      for (const k of [0.4, 0.8]) {
        const p = this.gfx.project(this._v.set(a.pos.x, a.pos.y + a.height * k, a.pos.z));
        const dd = Math.hypot(p.x - x, p.y - y);
        if (p.visible && dd < bd) { bd = dd; best = r; }
      }
    }
    return best;
  }
  onTap(e) {
    if (!this.control || this.app.busy) return;
    const hit = this.pickActor(e.x, e.y);
    const pl = this.actors.get('player');
    if (hit) {
      const a = hit.actor;
      const d = Math.hypot(a.pos.x - pl.actor.pos.x, a.pos.z - pl.actor.pos.z);
      const go = d > 1.8 ? this.walkTo('player', a.pos.x, a.pos.z, { stop: 1.3 }) : Promise.resolve();
      this.marker(a.pos.x, a.pos.z, 0xffd23a);
      go.then(() => { if (this.control) this.interact(hit); });
      return;
    }
    const g = this.screenToGround(e.x, e.y);
    if (!g) return;
    this.marker(g.x, g.z, 0x3ff0ff);
    this.walkTo('player', g.x, g.z);
    this.audio.sfx('ui_tap', { vol: 0.3, pitch: 1.4 });
  }
  marker(x, z, color) { const y = this.grid.heightAt(x, z); this.gfx.fx.shape({ kind: 'ring', pos: [x, y + 0.06, z], r0: 0.7, r1: 0.12, life: 0.45, color, intensity: 2.4 }); }
  onInteract(id, fn) { if (fn) this.handlers.set(id, fn); else this.handlers.delete(id); }
  async interact(rec) {
    if (rec.kind === 'wild' && this.safari) return this.safari.engage(rec);
    if (rec.kind === 'pickup' && this.safari) return this.safari.pickup(rec);
    const pl = this.actors.get('player');
    pl.actor.faceTo(rec.actor.pos.x, rec.actor.pos.z);
    if (rec.kind === 'npc' && !rec.npc?.static) rec.actor.faceTo(pl.actor.pos.x, pl.actor.pos.z);
    const fn = this.handlers.get(rec.id) || (this.app.story && this.app.story.interact && ((r) => this.app.story.interact(r)));
    if (fn) { this.app.busy = true; this.enableControl(false); try { await fn(rec); } finally { this.app.busy = false; if (!this.app.director || !this.app.director.cutscene) this.enableControl(true); } }
  }
  interactNearest() {
    const pl = this.actors.get('player'); let best = null, bd = 2.4;
    for (const [id, r] of this.actors) { if (r.kind !== 'npc' && r.kind !== 'wild' && r.kind !== 'pickup') continue; const d = Math.hypot(r.actor.pos.x - pl.actor.pos.x, r.actor.pos.z - pl.actor.pos.z); if (d < bd) { bd = d; best = r; } }
    if (best) this.interact(best);
  }
  waitZone(name) { return new Promise((res) => this.zoneWaiters.push({ name, res })); }

  // ------------------------------------------------------------------ frame
  update(dt) {
    if (!this.env) return;
    this.time += dt;
    const pl = this.actors.get('player');
    // keyboard movement (desktop)
    const I = this.app.input;
    if (this.control && pl && !this.app.busy) {
      let kx = 0, kz = 0;
      if (I.isDown('KeyW') || I.isDown('ArrowUp')) kz -= 1; if (I.isDown('KeyS') || I.isDown('ArrowDown')) kz += 1;
      if (I.isDown('KeyA') || I.isDown('ArrowLeft')) kx -= 1; if (I.isDown('KeyD') || I.isDown('ArrowRight')) kx += 1;
      if (kx || kz) {
        const yaw = this.gfx.rig.yaw; const c = Math.cos(yaw), s = Math.sin(yaw);
        const wx = kx * c + kz * s, wz = -kx * s + kz * c, l = Math.hypot(wx, wz) || 1;
        const a = pl.actor, sp = (this.sneak ? 1.9 : 4.6) * dt;
        const nx = a.pos.x + (wx / l) * sp, nz = a.pos.z + (wz / l) * sp;
        if (this.grid.walkable(Math.floor(nx), Math.floor(nz)) && Math.abs(this.grid.heightAt(nx, nz) - this.grid.heightAt(a.pos.x, a.pos.z)) < 0.6) { a.pos.x = nx; a.pos.z = nz; }
        a.face(Math.atan2(wx, wz)); pl.path = null; pl.kbd = true;
      } else pl.kbd = false;
    }
    for (const [id, r] of this.actors) this.updateActor(id, r, dt);
    // followers along the trail
    if (pl) {
      const p = pl.actor.pos;
      const last = this.trail[this.trail.length - 1];
      if (!last || Math.hypot(last[0] - p.x, last[1] - p.z) > 0.25) { this.trail.push([p.x, p.z]); if (this.trail.length > 80) this.trail.shift(); }
      const chain = ['buddy', ...this.followers];
      chain.forEach((id, i) => {
        const r = this.actors.get(id); if (!r || r.path || r.scripted) return;
        const want = (i + 1) * 1.25;
        let acc = 0, tgt = null;
        for (let k = this.trail.length - 1; k > 0; k--) { acc += Math.hypot(this.trail[k][0] - this.trail[k - 1][0], this.trail[k][1] - this.trail[k - 1][1]); if (acc >= want) { tgt = this.trail[k - 1]; break; } }
        const a = r.actor;
        if (!tgt) { a.anim.setSpeed(0); return; }
        const dx = tgt[0] - a.pos.x, dz = tgt[1] - a.pos.z, d = Math.hypot(dx, dz);
        if (d > 0.15) { const sp = Math.min(d, (d > 3 ? 7 : 4.8) * dt); a.pos.x += (dx / d) * sp; a.pos.z += (dz / d) * sp; a.pos.y = this.grid.heightAt(a.pos.x, a.pos.z); a.face(Math.atan2(dx, dz)); a.anim.setSpeed(sp / dt); }
        else { a.anim.setSpeed(0); a.faceTo(p.x, p.z); }
        if (d > 9) { a.setPos(tgt[0], this.grid.heightAt(tgt[0], tgt[1]), tgt[1]); }
      });
      // camera follow
      if (this.gfx.rig.mode === 'follow' && !this.camLocked) this.gfx.rig.target.set(p.x, p.y + 0.6, p.z);
      // occlusion fade around the player
      const sp = this.gfx.project(this._v.set(p.x, p.y + 1, p.z));
      const dpr = this.gfx.dpr || 1;
      shared.uFadeCenter.value.set(sp.x * dpr, (innerHeight - sp.y) * dpr);
      shared.uFadeRadius.value = 85 * dpr;
      this._v.set(p.x, p.y + 1, p.z).applyMatrix4(this.gfx.camera.matrixWorldInverse);
      shared.uFadeDepth.value = -this._v.z;
      // triggers
      this.checkZones(p);
      this.state.map.x = p.x; this.state.map.z = p.z;
    }
    if (this.safari) this.safari.update(dt);
    updateEnvironment(this.env, dt, this.gfx.tod.night, this.gfx.fx, this.gfx.rig.focus);
    this.ambient(dt);
    this.updateLabels();
  }
  updateActor(id, r, dt) {
    const a = r.actor;
    if (r.path && r.path.length) {
      const [tx, tz] = r.path[0];
      const dx = tx - a.pos.x, dz = tz - a.pos.z, d = Math.hypot(dx, dz);
      const last = r.path.length === 1;
      const sp = (r.pathRun ? 6 : (id === 'player' && this.sneak ? 1.9 : r.speed)) * dt;
      if (d <= Math.max(sp, last ? r.stopDist : 0.1)) {
        if (!last || r.stopDist < 0.2) { a.pos.x = tx; a.pos.z = tz; }
        r.path.shift();
        if (!r.path.length) { r.path = null; a.anim.setSpeed(0); const f = r.onArrive; r.onArrive = null; if (f) f(true); }
      } else {
        if (last && d <= r.stopDist + sp) { r.path = null; a.anim.setSpeed(0); const f = r.onArrive; r.onArrive = null; if (f) f(true); }
        else { a.pos.x += (dx / d) * sp; a.pos.z += (dz / d) * sp; a.face(Math.atan2(dx, dz)); a.anim.setSpeed(sp / dt); }
      }
      a.pos.y += (this.grid.heightAt(a.pos.x, a.pos.z) - a.pos.y) * damp(20, dt);
      if (id === 'player') { this.state.stats.steps += sp; if (Math.random() < dt * 3.2) this.footstep(a); }
    } else if (id === 'player') { a.anim.setSpeed(r.kbd ? (this.sneak ? 1.9 : 4.6) : 0); a.pos.y = this.grid.heightAt(a.pos.x, a.pos.z); if (r.kbd && Math.random() < dt * 3.2) this.footstep(a); }
    else if (r.kind === 'npc' && r.npc && r.npc.wander && !r.scripted) {
      r.wanderT -= dt;
      if (r.wanderT <= 0) {
        r.wanderT = 3 + Math.random() * 5;
        const [hx, hz] = r.home, rad = r.npc.wander;
        const tx = hx + (Math.random() - 0.5) * 2 * rad, tz = hz + (Math.random() - 0.5) * 2 * rad;
        if (this.grid.walkable(Math.floor(tx), Math.floor(tz))) { const p = findPath(this.grid, a.pos.x, a.pos.z, tx, tz); if (p && p.length < 8) { r.path = p; r.speed = 1.6; } }
      }
    }
    // NPCs glance at a nearby player
    if (r.kind === 'npc' && !r.path && id !== 'player') {
      const pl = this.actors.get('player');
      if (pl) { const d = Math.hypot(pl.actor.pos.x - a.pos.x, pl.actor.pos.z - a.pos.z); if (d < 3 && !r.npc?.static) { const yaw = headingTo(a.pos.x, a.pos.z, pl.actor.pos.x, pl.actor.pos.z); a.anim.lookAt(Math.atan2(Math.sin(yaw - a.yaw), Math.cos(yaw - a.yaw)), 0); } else a.anim.lookAt(0, 0); }
    }
    a.update(dt);
  }
  footstep(a) {
    const t = this.grid.t[this.grid.at(a.pos.x, a.pos.z)];
    const def = tileDef(t);
    this.audio.sfx('step_' + (def.step || 'stone'), { vol: 0.25, pitch: 0.9 + Math.random() * 0.2 });
    if (def.step === 'grass' && Math.random() < 0.4) this.gfx.fx.particle({ pos: [a.pos.x, a.pos.y + 0.05, a.pos.z], vel: [(Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6], life: 0.5, size: 0.12, size1: 0.25, color: [0.7, 0.62, 0.5, 0.4], color1: [0.7, 0.62, 0.5, 0], sprite: SPR.smoke, additive: false });
  }
  checkZones(p) {
    const d = this.def;
    for (const ex of d.exits || []) {
      if (p.x >= ex.x && p.x <= ex.x + (ex.w || 1) && p.z >= ex.z && p.z <= ex.z + (ex.d || 1)) {
        if (!this._inExit) { this._inExit = ex; if (this.control && this.app.onExit) this.app.onExit(ex); }
        return;
      }
    }
    this._inExit = null;
    if (!this.zoneWaiters.length || !d.zones) return;
    for (let i = 0; i < this.zoneWaiters.length; i++) {
      const w = this.zoneWaiters[i], z = d.zones[w.name];
      if (z && p.x >= z[0] && p.x <= z[0] + z[2] && p.z >= z[1] && p.z <= z[1] + z[3]) { this.zoneWaiters.splice(i, 1); i--; w.res(); }
    }
  }
  updateLabels() {
    const pl = this.actors.get('player');
    for (const [id, r] of this.actors) {
      if (!r.label) continue;
      const a = r.actor;
      const d = pl ? Math.hypot(a.pos.x - pl.actor.pos.x, a.pos.z - pl.actor.pos.z) : 99;
      const mark = r.mark || (this.app.story && this.app.story.markFor ? this.app.story.markFor(this.mapId, id) : null);
      const show = a.visible && (mark || d < 6) && this.control;
      if (!show) { this.ui.place(r.label, 0, 0, false); continue; }
      const p = this.gfx.project(this._v.set(a.pos.x, a.pos.y + a.height + 0.35, a.pos.z));
      const html = mark ? `<div class="npcmark">${mark}</div>` : (r.npc && (r.npc.name || characterLore(r.npc.char).name) ? `<div class="unitlab"><div class="nm">${r.npc.name || characterLore(r.npc.char).name}</div></div>` : '');
      if (r.label._h !== html) { r.label._h = html; r.label.innerHTML = html; }
      this.ui.place(r.label, p.x, p.y, p.visible);
    }
  }
  ambient(dt) {
    const kind = this.def.ambience && this.def.ambience.particles;
    const night = this.gfx.tod.night;
    const f = this.gfx.rig.focus;
    this.ambientT += dt;
    const rate = { sakura: 10, leaves: 7, neon: 6, snow: 14, mist: 3, fireflies: 6 }[kind] || 0;
    const fx = this.gfx.fx;
    let n = Math.floor(this.ambientT * rate); this.ambientT -= n / Math.max(1, rate);
    if (!rate) this.ambientT = 0;
    while (n-- > 0) {
      const x = f.x + (Math.random() - 0.5) * 26, z = f.z + (Math.random() - 0.5) * 26;
      if (kind === 'sakura') fx.particle({ pos: [x, 7 + Math.random() * 3, z], vel: [0.6 + Math.random() * 0.4, -0.7, 0.2], life: 9, size: 0.14, color: [1, 0.75, 0.86, 1], color1: [1, 0.8, 0.9, 1], sprite: SPR.petal, additive: false, spin: (Math.random() - 0.5) * 4, floor: 0.02 });
      else if (kind === 'leaves') fx.particle({ pos: [x, 7 + Math.random() * 3, z], vel: [0.5, -0.8, 0.3], life: 8, size: 0.16, color: Math.random() < 0.5 ? [0.95, 0.4, 0.16, 1] : [1, 0.72, 0.2, 1], color1: [0.9, 0.5, 0.2, 1], sprite: SPR.leaf, additive: false, spin: (Math.random() - 0.5) * 5, floor: 0.02 });
      else if (kind === 'snow') fx.particle({ pos: [x, 8, z], vel: [0.2, -0.9, 0], life: 9, size: 0.1, color: [1.2, 1.25, 1.4, 1], color1: [1, 1, 1.2, 1], sprite: SPR.snow, spin: 1, floor: 0.02 });
      else if (kind === 'neon' && night > 0.3) fx.particle({ pos: [x, 0.5 + Math.random() * 4, z], vel: [(Math.random() - 0.5) * 0.2, 0.15, (Math.random() - 0.5) * 0.2], life: 3, size: 0.07, color: Math.random() < 0.5 ? [2.6, 0.6, 2.2, 1] : [0.5, 2.4, 2.6, 1], color1: [1, 1, 2, 0], sprite: SPR.dot });
      else if (kind === 'mist') fx.particle({ pos: [x, 0.3, z], vel: [0.2, 0.02, 0], life: 6, size: 1.8, size1: 3, color: [1, 1, 1, 0.14], color1: [1, 1, 1, 0], sprite: SPR.smoke, additive: false });
    }
    if ((kind === 'fireflies' || kind === 'leaves' || kind === 'sakura') && night > 0.4 && Math.random() < dt * 5) {
      const x = f.x + (Math.random() - 0.5) * 20, z = f.z + (Math.random() - 0.5) * 20;
      fx.particle({ pos: [x, 0.4 + Math.random() * 1.5, z], vel: [(Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.4], life: 3, size: 0.1, color: [1.6, 2.8, 0.6, 1], color1: [1, 2, 0.4, 0], sprite: SPR.dot });
    }
  }
  restore() { if (this.env) restoreProps(this.env); }
}
