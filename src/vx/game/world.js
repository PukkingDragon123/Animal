// The world view: one San Francisco location at a time — its voxel diorama, the
// people and Tokonmon standing in it (each with an Animator), particle effects,
// a cinematic camera (named shots with eased moves) and tappable hotspots.
// Cutscenes drive it through a small director API: shot(), addPerson(), addMon(),
// actor.walkTo(), actor.play(), emote().
import * as THREE from '../../../vendor/three.module.js';
import { Model, dripForm } from '../model.js';
import { Animator, E } from '../anim.js';
import { FX } from '../fx.js';
import { cast } from '../people/cast.js';
import { person } from '../people/person.js';
import { LOCATIONS } from './locations.js';
import { T } from '../../px/game/ui.js';
import { NavGrid, pick } from './nav.js';

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
  place(x, z, yaw = this.yaw, y) { this.g.position.set(x, this.w.ground(x, z, y), z); this.yaw = this.targetYaw = yaw; this.g.rotation.y = yaw; return this; }
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
      p.y = this.w.ground(p.x, p.z, p.y);
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
    this.nav = new NavGrid(sc.vox); this.free = false; this.player = null; this.partner = null;
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
  // ground height (metres) under x, z — the floor nearest nearY when given (interiors have several)
  ground(x, z, nearY) {
    const v = this.st.vox; if (!v) return 0;
    if (nearY !== undefined && this.nav) {
      const g = this.nav, cx = Math.floor((x * v.vpm) / g.c), cz = Math.floor((z * v.vpm) / g.c), k = g.nearest(cx, cz, nearY * v.vpm, g.step * 2 + 1);
      if (k >= 0) return g.floor(cx, cz, k) / v.vpm;
    }
    const t = v.top(Math.floor(x * v.vpm), Math.floor(z * v.vpm)); return t < 0 ? 0 : (t + 1) / v.vpm;
  }
  spot(name) { const s = this.loc && this.loc.spots && this.loc.spots[name]; return s || [this.cam.target.x, this.cam.target.z, 0]; }
  // ---- free roam: tap the ground to walk there; the camera follows; the partner tags along
  setPlayer(a, partner = null) { this.player = a; this.partner = partner; return this; }
  roam(on = true) { this.free = on; if (on && this.player) this.followCam(0.8); return this; }
  followCam(dur = 0) {
    const p = this.player.g.position, f = Object.assign({ dist: 13, pitch: 32, yaw: (this.loc.view || {}).yaw || 0, h: 1.0 }, this.loc.follow || {});
    const v = { target: [p.x, p.y + f.h, p.z], dist: f.dist, yaw: f.yaw, pitch: f.pitch };
    if (dur > 0) return this.shot(v, dur); this.setCam(v); return Promise.resolve();
  }
  // walk the player to a world point along a nav path (resolves on arrival; false if unreachable)
  async goTo(x, z, y, o = {}) {
    const a = this.player; if (!a) return false;
    const p = a.g.position, path = this.nav.path({ x: p.x, y: p.y, z: p.z }, { x, y: y ?? p.y, z });
    if (!path || !path.length) { this.app.audio.sfx && this.app.audio.sfx('error'); return false; }
    const pts = path.slice(1).map(([px, pz]) => [px, pz]);
    if (o.stopShort && pts.length) { const [lx, lz] = pts[pts.length - 1], [qx, qz] = pts.length > 1 ? pts[pts.length - 2] : [p.x, p.z], d = Math.hypot(lx - qx, lz - qz); if (d > o.stopShort) pts[pts.length - 1] = [lx - ((lx - qx) / d) * o.stopShort, lz - ((lz - qz) / d) * o.stopShort]; else if (pts.length > 1) pts.pop(); }
    if (!pts.length) return true;
    a.speed = o.run ? 3.2 : 2.2;
    await a.walkTo(pts, { clip: o.run && a.anim.clips.run ? 'run' : 'walk', speed: a.speed });
    return true;
  }
  // a tap that no button took: walk there (free roam only)
  handleTap(ui) {
    const P = ui.ptr;
    if (!P.released || !this.free || !this.player || ui.dialog || this.app.story.busy || this.app.phone.open || (this.app.battle && this.app.battle.active)) return;
    if (Math.hypot(P.x - (P.sx ?? P.x), P.y - (P.sy ?? P.y)) > 6) return;            // a swipe, not a tap
    const ndc = new THREE.Vector2((P.x / this.app.vw) * 2 - 1, 1 - (P.y / this.app.vh) * 2), ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.st.cam);
    const hit = pick(this.st.vox, ray.ray.origin, ray.ray.direction); if (!hit || hit.water) return;
    P.released = false;
    this.fx.emit('ring', new THREE.Vector3(hit.x, hit.y + 0.05, hit.z), { scale: 0.6 });
    this.player.path = null; this.goTo(hit.x, hit.z, hit.y);
  }
  thinkFollow(dt) {
    if (this.free && this.player) {                                                // the camera trails the player
      const p = this.player.g.position, c = this.cam, k = 1 - Math.exp(-dt * 3.2), f = this.loc.follow || {};
      if (!this.tween) { c.target.x += (p.x - c.target.x) * k; c.target.y += (p.y + (f.h ?? 1.0) - c.target.y) * k; c.target.z += (p.z - c.target.z) * k; }
    }
    const b = this.partner, a = this.player; if (!b || !a || b.busy) return;
    b.followT = (b.followT || 0) - dt; if (b.followT > 0) return; b.followT = 0.4;
    const p = a.g.position, q = b.g.position, d = Math.hypot(p.x - q.x, p.z - q.z);
    if (d > 2.2) {
      const back = a.yaw + Math.PI, tx = p.x + Math.sin(back) * 1.1 + Math.cos(back) * 0.6, tz = p.z + Math.cos(back) * 1.1 - Math.sin(back) * 0.6;
      const path = this.nav.path({ x: q.x, y: q.y, z: q.z }, { x: tx, y: p.y, z: tz });
      if (path && path.length > 1) { b.speed = d > 4 ? 3.4 : 2.4; b.walkTo(path.slice(1).map(([x, z]) => [x, z]), { speed: b.speed }); }
    } else if (!b.path && d < 1.6) b.face(a);
  }
  // ---- actors
  async addMon(id, species, at, o = {}) {
    const def = await monDef(species), m = new Model((o.drip || 1) >= 3 ? dripForm(def) : def), a = new Actor(this, id, m, 'mon'); m.drip(o.drip || 1, o.look || 0);
    this.st.actors.add(m.group); this.actors.set(id, a);
    const [x, z, yaw, y] = typeof at === 'string' ? this.spot(at) : at; a.place(x, z, o.yaw ?? yaw ?? 0, o.y ?? y);
    if (o.clip) a.play(o.clip, { fade: 0 });
    return a;
  }
  addPerson(id, who, at, o = {}) {
    const m = new Model(typeof who === 'string' ? cast(who) : person(who)), a = new Actor(this, id, m, 'person');
    this.st.actors.add(m.group); this.actors.set(id, a);
    const [x, z, yaw, y] = typeof at === 'string' ? this.spot(at) : at; a.place(x, z, o.yaw ?? yaw ?? 0, o.y ?? y);
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
    this.thinkFollow(dt);
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
      if (ui.button(x, y, w, 14, h.label, { icon: h.icon || 'star', color: h.color || T.amber })) { this.app.audio.sfx && this.app.audio.sfx('select'); this.app.story.run(async () => { if (this.free && this.player && h.walk !== false) { const [wx, wz] = h.walk || [h.at[0], h.at[2]]; await this.goTo(wx, wz, h.at[1], { stopShort: h.walk ? 0 : 1.2 }); this.player.faceTo(h.at[0], h.at[2]); } await h.act(this.app); }); }
      ui.px(Math.round(s.x), y + 15, T.amber); ui.px(Math.round(s.x), y + 16, T.amber);
    }
  }
}
