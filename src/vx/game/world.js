// The world view: one San Francisco location at a time — its voxel diorama, the
// people and Tokonmon standing in it (each with an Animator), particle effects,
// a cinematic camera (named shots with eased moves) and tappable hotspots.
// Cutscenes drive it through a small director API: shot(), addPerson(), addMon(),
// actor.walkTo(), actor.play(), emote().
import * as THREE from '../../../vendor/three.module.js';
import { Model } from '../model.js';
import { Animator, E } from '../anim.js';
import { FX } from '../fx.js';
import { cast } from '../people/cast.js';
import { LOCATIONS } from './locations.js';
import { T } from '../../px/game/ui.js';

const MON_DEFS = {};
export async function monDef(species) { if (!MON_DEFS[species]) { try { MON_DEFS[species] = (await import(`../mons/${species}.js`)).def; } catch (e) { console.warn('no model for', species, e); MON_DEFS[species] = (await import('../mons/chilichick.js')).def; } } return MON_DEFS[species]; }
const _v = new THREE.Vector3();

// ---------------------------------------------------------------- actors
export class Actor {
  constructor(world, id, model, kind) {
    this.w = world; this.id = id; this.m = model; this.kind = kind; this.anim = new Animator(model);
    this.yaw = 0; this.targetYaw = 0; this.path = null; this.speed = kind === 'mon' ? 1.6 : 1.35; this.look = null;
    this.idleClip = 'idle'; this.walkClip = 'walk'; this.hidden = false;
  }
  get g() { return this.m.group; }
  place(x, z, yaw = this.yaw) { this.g.position.set(x, this.w.ground(x, z), z); this.yaw = this.targetYaw = yaw; this.g.rotation.y = yaw; return this; }
  play(clip, o) { this.anim.play(clip, o); return this; }
  // walk along points [[x, z], …] → resolves on arrival
  walkTo(pts, o = {}) {
    if (!Array.isArray(pts[0])) pts = [pts];
    this.path = pts.slice(); this.pathSpeed = o.speed || this.speed; this.anim.play(o.clip || this.walkClip, { fade: 0.15 });
    return new Promise((r) => { this.arrive = r; });
  }
  faceTo(x, z) { const p = this.g.position; this.targetYaw = Math.atan2(x - p.x, z - p.z); return this; }
  face(other) { const q = (other.g || other).position || other; return this.faceTo(q.x, q.z); }
  headPos(out = new THREE.Vector3()) { const b = this.m.bones.head || this.m.bones.body || this.m.group; b.updateWorldMatrix(true, false); out.setFromMatrixPosition(b.matrixWorld); out.y += this.kind === 'mon' ? 0.25 : 0.3; return out; }
  update(dt, ctx) {
    if (this.path && this.path.length) {
      const p = this.g.position, [tx, tz] = this.path[0], dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), stepL = this.pathSpeed * dt;
      if (d <= stepL) { p.x = tx; p.z = tz; this.path.shift(); if (!this.path.length) { this.path = null; this.anim.play(this.idleClip, { fade: 0.2 }); const r = this.arrive; this.arrive = null; if (r) r(); } }
      else { p.x += (dx / d) * stepL; p.z += (dz / d) * stepL; this.targetYaw = Math.atan2(dx, dz); }
      p.y = this.w.ground(p.x, p.z);
    }
    let dy = this.targetYaw - this.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    this.yaw += dy * (1 - Math.exp(-dt * 9)); this.g.rotation.y = this.yaw;
    this.anim.update(dt, { fx: ctx.fx, look: this.look ? (this.look.g ? this.look.headPos(_v) : this.look) : ctx.look });
  }
}

// ---------------------------------------------------------------- the world
export class VxWorld {
  constructor(app) {
    this.app = app; this.st = app.stage; this.actors = new Map(); this.fx = new FX(this.st); this.extra = [];
    this.cam = { target: new THREE.Vector3(), dist: 40, yaw: 0, pitch: 40 }; this.tween = null; this.hotspots = []; this.ready = false; this.drift = 1;
  }
  async load(id, o = {}) {
    const L = LOCATIONS[id], st = this.st;
    this.clear();
    const mod = await import(`../scenes/${L.scene}.js`);
    if (mod.prepare) await mod.prepare();
    const mood = o.mood || L.mood || 'golden';
    const before = new Set(st.scene.children);
    const sc = mod.build({ mood });
    st.setWorld(sc.vox); st.setMood(mood); this.app.setPost(mood);
    for (const lp of sc.lamps || []) st.lamp(lp[0], lp[1], lp[2]);
    if (sc.setup) sc.setup(st);
    this.extra = st.scene.children.filter((c) => !before.has(c));
    this.sc = sc; this.loc = L; this.id = id; this.mood = mood;
    this.shots = Object.assign({}, Object.fromEntries((sc.shots || []).map((s) => [s.name, s])), L.shots || {});
    const v = (o.shot && this.shots[o.shot]) || L.view || sc.view;
    this.setCam(v);
    this.hotspots = (L.hotspots || []).map((h) => ({ ...h }));
    this.ready = true;
    if (o.life !== false) this.spawnLife(L.life || []).catch((e) => console.warn('life', e));
    return sc;
  }
  clear() {
    const st = this.st;
    for (const a of this.actors.values()) st.actors.remove(a.g);
    this.actors.clear();
    for (const o of this.extra) st.scene.remove(o);
    this.extra = []; st.decals = null; st.lamps.length = 0; this.fx.clear(); this.hotspots = [];
  }
  // ground height (metres) under x, z
  ground(x, z) { const v = this.st.vox; if (!v) return 0; const t = v.top(Math.floor(x * v.vpm), Math.floor(z * v.vpm)); return t < 0 ? 0 : (t + 1) / v.vpm; }
  spot(name) { const s = this.loc && this.loc.spots && this.loc.spots[name]; return s || [this.cam.target.x, this.cam.target.z, 0]; }
  // ---- actors
  async addMon(id, species, at, o = {}) {
    const def = await monDef(species), m = new Model(def), a = new Actor(this, id, m, 'mon');
    this.st.actors.add(m.group); this.actors.set(id, a);
    const [x, z, yaw] = typeof at === 'string' ? this.spot(at) : at; a.place(x, z, o.yaw ?? yaw ?? 0);
    if (o.clip) a.play(o.clip, { fade: 0 });
    return a;
  }
  addPerson(id, who, at, o = {}) {
    const m = new Model(cast(who)), a = new Actor(this, id, m, 'person');
    this.st.actors.add(m.group); this.actors.set(id, a);
    const [x, z, yaw] = typeof at === 'string' ? this.spot(at) : at; a.place(x, z, o.yaw ?? yaw ?? 0);
    if (o.clip) a.play(o.clip, { fade: 0 });
    return a;
  }
  actor(id) { return this.actors.get(id); }
  // ambient life: pigeons strutting and pecking, passers-by walking the sidewalks.
  // life: [{ kind: 'mon', species: ['pidgun', 'pidrose'], n, area: [x0, z0, x1, z1] } | { kind: 'person', n, lanes: [[[x, z], …], …] }]
  async spawnLife(list = []) {
    let k = 0;
    for (const L of list) for (let i = 0; i < (L.n || 1); i++) {
      const id = 'life' + k++, r = () => Math.random();
      if (L.kind === 'mon') {
        const sp = Array.isArray(L.species) ? L.species[Math.floor(r() * L.species.length)] : L.species, [x0, z0, x1, z1] = L.area;
        const a = await this.addMon(id, sp, [x0 + r() * (x1 - x0), z0 + r() * (z1 - z0), r() * 6.28]);
        a.life = { area: L.area, wait: r() * 3, fidget: L.fidget }; a.speed = L.speed || 0.9;
      } else {
        const lane = L.lanes[Math.floor(r() * L.lanes.length)], fwd = r() < 0.5, pts = fwd ? lane : lane.slice().reverse();
        const a = this.addPerson(id, 'passerby' + (1 + Math.floor(r() * 400)), [pts[0][0], pts[0][1], 0]);
        const t = r(); a.g.position.x += (pts[1][0] - pts[0][0]) * t; a.g.position.z += (pts[1][1] - pts[0][1]) * t;
        a.life = { lane: pts, walker: true }; a.speed = 1.1 + r() * 0.5;
      }
    }
  }
  thinkLife(a, dt) {
    const L = a.life; if (!L || a.path) return;
    if (L.walker) { this.remove(a.id); const r = Math.random(), lane = L.lane.slice().reverse(); const b = this.addPerson(a.id, 'passerby' + (1 + Math.floor(r * 400)), [lane[0][0], lane[0][1], 0]); b.life = { lane, walker: true }; b.speed = a.speed; b.walkTo(lane.slice(1)); return; }
    L.wait -= dt; if (L.wait > 0) return;
    const [x0, z0, x1, z1] = L.area, r = Math.random();
    const fid = L.fidget && a.anim.clips[L.fidget] ? [L.fidget] : (a.anim.spec.fidget && a.anim.spec.fidget.clips) || [];
    if (r < 0.35 && fid.length) { a.play(fid[Math.floor(Math.random() * fid.length)], { restart: true }); L.wait = 2 + Math.random() * 2; return; }
    a.walkTo([x0 + Math.random() * (x1 - x0), z0 + Math.random() * (z1 - z0)]).then(() => { L.wait = 1 + Math.random() * 3; });
  }
  remove(id) { const a = this.actors.get(id); if (a) { this.st.actors.remove(a.g); this.actors.delete(id); } }
  emote(id, kind = 'anger', n = 1) { const a = this.actor(id); if (a) this.fx.emit(kind, a.headPos(), { n, scale: 1 }); }
  burst(kind, at, o = {}) { this.fx.emit(kind, new THREE.Vector3(...at), o); }
  // ---- camera
  setCam(v) { this.cam.target.set(...v.target); this.cam.dist = v.dist; this.cam.yaw = v.yaw ?? 0; this.cam.pitch = v.pitch ?? 40; this.tween = null; }
  shot(s, dur = 1.4, ease = E.inout) {
    const v = typeof s === 'string' ? this.shots[s] || this.loc.view : s;
    if (!v) return Promise.resolve();
    if (dur <= 0) { this.setCam(v); return Promise.resolve(); }
    return new Promise((r) => { this.tween = { from: { target: this.cam.target.clone(), dist: this.cam.dist, yaw: this.cam.yaw, pitch: this.cam.pitch }, to: { target: new THREE.Vector3(...v.target), dist: v.dist, yaw: v.yaw ?? 0, pitch: v.pitch ?? 40 }, t: 0, dur, ease, done: r }; });
  }
  // frame an actor (or two) for dialogue
  closeOn(a, o = {}) { const p = a.g.position, h = a.kind === 'mon' ? 0.5 : 1.0; return this.shot({ target: [p.x + (o.dx || 0), p.y + (o.h ?? h), p.z], dist: o.dist || 4.2, yaw: o.yaw ?? (a.yaw * 180) / Math.PI * 0.35, pitch: o.pitch ?? 14 }, o.dur ?? 1.1); }
  update(dt) {
    if (!this.ready) return;
    this.st.time += dt;
    const look = this.st.cam.position;
    for (const a of [...this.actors.values()]) { if (a.life) { if (a.life.walker && !a.path && !a.started) { a.started = true; a.walkTo(a.life.lane.slice(1)); } else this.thinkLife(a, dt); } a.update(dt, { fx: this.fx, look }); }
    this.fx.update(dt);
    const c = this.cam;
    if (this.tween) {
      const tw = this.tween; tw.t += dt; const k = tw.ease(Math.min(1, tw.t / tw.dur));
      c.target.lerpVectors(tw.from.target, tw.to.target, k); c.dist = tw.from.dist + (tw.to.dist - tw.from.dist) * k;
      let dy = tw.to.yaw - tw.from.yaw; if (dy > 180) dy -= 360; if (dy < -180) dy += 360;
      c.yaw = tw.from.yaw + dy * k; c.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * k;
      if (tw.t >= tw.dur) { this.tween = null; tw.done(); }
    }
    const dr = this.drift * Math.sin(this.st.time * 0.21) * 0.6;            // a slow, breathing camera
    this.st.look([c.target.x, c.target.y, c.target.z], c.dist, c.yaw + dr, c.pitch + Math.sin(this.st.time * 0.17) * 0.3 * this.drift);
  }
  // world position → UI pixel coordinates
  project(p) { const v = _v.set(...(Array.isArray(p) ? p : [p.x, p.y, p.z])).project(this.st.cam); return { x: ((v.x + 1) / 2) * this.app.vw, y: ((1 - v.y) / 2) * this.app.vh, vis: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 }; }
  // hotspot markers you can tap (only when no dialogue / cutscene holds the screen)
  drawUI(ui) {
    if (!this.ready || this.app.story.busy || this.app.story.title || ui.dialog || this.app.phone.open) return;
    for (const h of this.hotspots) {
      if (h.when && !h.when(this.app)) continue;
      const s = this.project(h.at); if (!s.vis) continue;
      const bob = Math.round(Math.sin(this.app.t * 3 + h.at[0]) * 1.5), w = ui.tw(h.label) + 18, x = Math.round(s.x - w / 2), y = Math.round(s.y - 20 + bob);
      if (ui.button(x, y, w, 14, h.label, { icon: h.icon || 'star', color: h.color || T.amber })) { this.app.audio.sfx && this.app.audio.sfx('select'); this.app.story.run(() => h.act(this.app)); }
      ui.px(Math.round(s.x), y + 15, T.amber); ui.px(Math.round(s.x), y + 16, T.amber);
    }
  }
}
