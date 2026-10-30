// The world view: one San Francisco location at a time — its voxel diorama, the
// people and Tokonmon standing in it (each with an Animator), particle effects,
// a cinematic camera (named shots with eased moves) and tappable hotspots.
// Cutscenes drive it through a small director API: shot(), addPerson(), addMon(),
// actor.walkTo(), actor.play(), emote().
import * as THREE from '../../../vendor/three.module.js';
import { Model, dripForm } from '../model.js';
import { Animator, E } from '../anim.js';
import { FX } from '../fx.js';
import { cast, castAnime } from '../people/cast.js';
import { castHuman } from '../people/human.js';
import { person } from '../people/person.js';
import { LOCATIONS } from './locations.js';
import { T } from '../../px/game/ui.js';
import { NavGrid, pick } from './nav.js';
import { Fine } from '../fine.js';
import { CityControl } from '../city/control.js';

const MON_DEFS = {};
// a species' model; variants like 'barkorious_forced' fall back to their base model, unknown ones to Chilichick
export async function monDef(species) {
  if (!MON_DEFS[species]) {
    const tries = [species, species.split('_')[0], 'chilichick'];
    for (const id of tries) { try { MON_DEFS[species] = (await import(`../mons/${id}.js`)).def; break; } catch (e) { if (id === species) console.warn('no model for', species); } }
  }
  return MON_DEFS[species];
}
const _v = new THREE.Vector3();

// ---------------------------------------------------------------- actors
export class Actor {
  constructor(world, id, model, kind) {
    this.w = world; this.id = id; this.m = model; this.kind = kind; this.anim = model.animator ? model.animator() : new Animator(model);
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
    // footsteps for the player (surface per location)
    if (this.path && this.kind === 'person' && this.w.player === this) {
      this.stepD = (this.stepD || 0) + this.pathSpeed * dt;
      const stride = this.pathSpeed > 2 ? 0.55 : 0.4;
      if (this.stepD > stride) { this.stepD = 0; const au = this.w.app && this.w.app.audio; if (au && au.sfx) au.sfx(STEP[this.w.id] || 'step_concrete', { vol: 0.8, pitch: 0.95 + Math.random() * 0.1 }); }
    }
    let dy = this.targetYaw - this.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    this.yaw += dy * (1 - Math.exp(-dt * 9)); this.g.rotation.y = this.yaw;
    this.anim.update(dt, { fx: ctx.fx, look: this.look ? (this.look.g ? this.look.headPos(_v) : this.look) : ctx.look });
  }
}

const STEP = { apartment: 'step_wood', dojo: 'step_wood', pier39: 'step_wood', tram: 'step_wood', alamo: 'step_grass', lab: 'step_carpet' };
// ambient chatter: little speech bubbles over the locals while you roam
const CHATTER = {
  any: ['Did you catch the League replay last night?', 'My Pidgun stole my fries AGAIN.', 'Chili sauce sold out?! Again?!', 'Fog\'s rolling in early today.', 'Is that a Chilichick? So cute!',
    'I\'m training for the League. For real this time.', 'Team Metallica tagged the wall again…', 'Have you tried the gear shop?', 'Boba first, battles later.', 'Who\'s that rookie with the angry chick?',
    'My Tokon only listens to vinyl.', 'Rent is SO high in this city.', 'Lunch break! Finally.', 'Hehe, nice partner!'],
  chinatown: ['Fresh dumplings! Hot hot hot!', 'Mr. Wong is still mad about that hot sauce.', 'Lanterns go up tonight!'],
  pier39: ['The sea lions are loud today.', 'Barkorious was here last night!', 'Clam chowder in a bread bowl. Peak.'],
  dojo: ['Breathe in… strike!', 'Master Lau never misses tea time.', 'Again! From the top!'],
  tram: ['Hold on tight!', 'Next stop: Pier 39!', 'Ding ding!'],
  arena: ['Who\'s up next?', 'That combo was nasty!', 'The street league is heating up!'],
  alamo: ['Best view of the Painted Ladies.', 'Perfect picnic weather.', 'My Tokon loves this hill.'],
};
const LOC_AUDIO = {
  chinatown: { music: 'senbazuru', bed: 'street' }, alamo: { music: 'lemon', bed: 'birds' }, apartment: { music: 'lofi' }, dojo: { music: 'senbazuru', bed: 'birds' },
  tram: { music: 'city', bed: 'street' }, arena: { music: 'party', bed: 'street' }, pier39: { music: 'vibes', bed: 'birds' }, lab: { music: 'lofi2' },
};

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
    const sc = mod.build({ mood, stage: st, app: this.app });
    if (sc.city) {
      // the walkable city: low-poly pixel-textured meshes + a collision / storey grid, steered directly
      st.setWorld(new Fine(4, 4, 4)); st.setMood(mood); this.app.setPost(mood); st.world.visible = false;
      st.scene.add(sc.city.root); this.nav = sc.city.nav; this.city = new CityControl(this, sc.city); this.drift = 0;
      sc.spots = sc.spots || sc.city.spots; sc.lamps = sc.lamps || sc.city.lamps;
    } else {
      st.setWorld(sc.vox); st.setMood(mood); this.app.setPost(mood);
      st.world.visible = !sc.hideVox;                 // low-poly scenes keep the voxels only for walking / navigation
      this.nav = new NavGrid(sc.vox); this.city = null; this.drift = 1;
    }
    this.free = false; this.player = null; this.partner = null;
    for (const lp of sc.lamps || []) st.lamp(lp[0], lp[1], lp[2]);
    if (sc.setup) sc.setup(st);
    // 3D-render posters into the scene's poster slots
    const slots = sc.posterSlots || mod.posterSlots;
    if (slots && slots.length) { const P = await import('../posters.js'); slots.forEach((sl, i) => P.posterDecal(st, { ...sl, poster: P.posterFor(sl, i, id) })); }
    this.extra = st.scene.children.filter((c) => !before.has(c));
    this.sc = sc; this.loc = L; this.id = id; this.mood = mood;
    this.locAudio();
    this.shots = Object.assign({}, Object.fromEntries((sc.shots || []).map((s) => [s.name, s])), L.shots || {});
    const v = (o.shot && this.shots[o.shot]) || L.view || sc.view;
    this.setCam(v);
    this.hotspots = (L.hotspots || []).map((h) => ({ ...h }));
    for (const h of this.hotspots) if (h.spotAt) { const p = this.spot(h.spotAt); h.at = [p[0], (p[3] ?? this.ground(p[0], p[1])) + 1.4, p[1]]; h.walk = [p[0], p[1]]; }
    this.ready = true;
    if (sc.city) for (const n of sc.city.npcs) { const a = this.addPerson(n.id, n.who || n.id, [n.x, n.z, n.yaw || 0, (n.L || 0) * 3]); if (n.clip) a.play(n.clip, { fade: 0 }); a.npc = n; }
    if (o.life !== false) this.spawnLife(L.life || []).catch((e) => console.warn('life', e));
    return sc;
  }
  clear() {
    const st = this.st;
    if (this.city) { this.city.dispose(); this.city = null; }
    for (const a of this.actors.values()) st.actors.remove(a.g);
    this.actors.clear();
    for (const o of this.extra) st.scene.remove(o);
    this.extra = []; st.decals = null; st.lamps.length = 0; this.fx.clear(); this.hotspots = [];
  }
  // ground height (metres) under x, z — the floor nearest nearY when given (interiors have several)
  ground(x, z, nearY) {
    if (this.city) return this.nav.ground(x, z, nearY === undefined ? 0 : this.nav.levelAt(x, z, nearY));
    const v = this.st.vox; if (!v) return 0;
    if (nearY !== undefined && this.nav) {
      const g = this.nav, cx = Math.floor((x * v.vpm) / g.c), cz = Math.floor((z * v.vpm) / g.c), k = g.nearest(cx, cz, nearY * v.vpm, g.step * 2 + 1);
      if (k >= 0) return g.floor(cx, cz, k) / v.vpm;
    }
    const t = v.top(Math.floor(x * v.vpm), Math.floor(z * v.vpm)); return t < 0 ? 0 : (t + 1) / v.vpm;
  }
  // named spots come from the location table, else from the scene module itself (interiors carry their own)
  spot(name) { const s = (this.loc && this.loc.spots && this.loc.spots[name]) || (this.sc && this.sc.spots && this.sc.spots[name]); return s || [this.cam.target.x, this.cam.target.z, 0]; }
  // ---- free roam: tap the ground to walk there; the camera follows; the partner tags along
  setPlayer(a, partner = null) { this.player = a; this.partner = partner; if (this.city && a) this.city.placed(); return this; }
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
    if (!path || !path.length) { this.app.audio.sfx && this.app.audio.sfx('ui_error'); return false; }
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
    let hit;
    if (this.city) {   // tap the floor of the storey you stand on
      const y = this.player.g.position.y, o = ray.ray.origin, d = ray.ray.direction; if (d.y > -0.01) return;
      const t = (y - o.y) / d.y, x = o.x + d.x * t, z = o.z + d.z * t; if (!this.nav.ok(x, z, this.city.L)) return;
      hit = { x, y, z };
    } else hit = pick(this.st.vox, ray.ray.origin, ray.ray.direction);
    if (!hit || hit.water) return;
    P.released = false;
    this.fx.emit('ring', new THREE.Vector3(hit.x, hit.y + 0.05, hit.z), { scale: 0.6 });
    this.player.path = null; this.goTo(hit.x, hit.z, hit.y);
  }
  thinkFollow(dt) {
    if (this.city) return;                                                       // the city controller drives camera + partner
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
    const mode = this.app && this.app.params && this.app.params.get('people');   // default: realistic low-poly humans; 'folk' / 'box' bring back the older people
    const m = mode === 'box' ? new Model(typeof who === 'string' ? cast(who) : person(who)) : mode === 'folk' ? castAnime(who) : castHuman(who), a = new Actor(this, id, m, 'person');
    this.st.actors.add(m.group); this.actors.set(id, a);
    const [x, z, yaw, y] = typeof at === 'string' ? this.spot(at) : at; a.place(x, z, o.yaw ?? yaw ?? 0, o.y ?? y);
    if (o.clip) a.play(o.clip, { fade: 0 });
    return a;
  }
  actor(id) { return this.actors.get(id); }
  // each place has its own recorded music and ambience bed (night swaps the bed for cicadas)
  locAudio() {
    const au = this.app && this.app.audio, A = LOC_AUDIO[this.id] || {}, L = this.loc || {};
    if (!au || !au.music) return;
    au.music(L.music || A.music || 'lofi', { fade: 1.5 });
    if (au.bed) au.bed(this.mood === 'night' ? 'cicadas' : L.bed || A.bed || null);
  }
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
  remove(id) { const a = this.actors.get(id); if (a) { this.st.actors.remove(a.g); this.actors.delete(id); if (a.m.dispose) a.m.dispose(); } }
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
    this.thinkChatter(dt);
    if (this.city) this.city.update(dt);
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
  thinkChatter(dt) {
    const B = this.bubbles || (this.bubbles = []);
    for (let i = B.length - 1; i >= 0; i--) {
      const b = B[i], n0 = Math.floor(b.n); b.t += dt; b.n = Math.min(b.text.length, b.n + dt * 28);
      const au = this.app && this.app.audio;
      for (let k = n0; k < Math.floor(b.n); k++) if (au && au.voice && k % 2 === 0) au.voice(b.voice, b.text[k]);
      if (b.t > b.dur || !this.actors.has(b.a.id)) B.splice(i, 1);
    }
    if (this.app.story.busy || this.app.story.title || !this.free) return;
    this.chatT = (this.chatT ?? 3) - dt;
    if (this.chatT > 0 || B.length >= 2) return;
    this.chatT = 5 + Math.random() * 7;
    const cands = [...this.actors.values()].filter((a) => a.kind === 'person' && a !== this.player && !B.some((b) => b.a === a) && this.project(a.headPos()).vis);
    if (!cands.length) return;
    const a = cands[Math.floor(Math.random() * cands.length)], pool = [...(CHATTER[this.id] || []), ...(CHATTER[this.id] || []), ...CHATTER.any];
    const text = pool[Math.floor(Math.random() * pool.length)];
    B.push({ a, text, t: 0, n: 0, dur: 2.2 + text.length * 0.06, voice: ['friend', 'kid', 'elder', 'rival', 'punk'][a.id.length % 5] });
    if (a.anim && a.anim.face) a.anim.face(Math.random() < 0.6 ? 'smile' : 'happy', 2);
    if (a.anim && a.anim.clips && a.anim.clips.talk && !a.path) a.play('talk', { restart: true });
  }
  // world position → UI pixel coordinates
  project(p) { const v = _v.set(...(Array.isArray(p) ? p : [p.x, p.y, p.z])).project(this.st.cam); return { x: ((v.x + 1) / 2) * this.app.vw, y: ((1 - v.y) / 2) * this.app.vh, vis: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 }; }
  // hotspot markers you can tap (only when no dialogue / cutscene holds the screen)
  drawMinimap(ui, x, y, w, h) { if (this.city) this.city.drawMinimap(ui, x, y, w, h); }
  drawUI(ui) {
    if (!this.ready || this.app.story.title || ui.dialog || this.app.phone.open) return;
    if (this.city) this.city.drawUI(ui);
    for (const b of this.bubbles || []) {
      const s = this.project(b.a.headPos()); if (!s.vis) continue;
      const str = b.text.slice(0, Math.max(1, Math.floor(b.n))), w = Math.min(160, ui.tw(b.text) + 10), x = Math.round(s.x - w / 2), y = Math.round(s.y - 26 - Math.min(1, b.t * 6) * 2);
      const fade = b.t > b.dur - 0.3 ? 0.4 : 1;
      if (fade > 0.5) ui.panel(x, y, w, 14, { shadow: true });
      ui.text(str, x + 5, y + 3, T.text);
      ui.px(Math.round(s.x), y + 14, T.text); ui.px(Math.round(s.x) - 1, y + 14, T.text); ui.px(Math.round(s.x), y + 15, T.text);
    }
    if (this.app.story.busy) return;
    for (const h of this.hotspots) {
      if (h.when && !h.when(this.app)) continue;
      const s = this.project(h.at); if (!s.vis) continue;
      const bob = Math.round(Math.sin(this.app.t * 3 + h.at[0]) * 1.5), w = ui.tw(h.label) + 18, x = Math.round(s.x - w / 2), y = Math.round(s.y - 20 + bob);
      if (ui.button(x, y, w, 14, h.label, { icon: h.icon || 'star', color: h.color || T.amber })) { this.app.audio.sfx && this.app.audio.sfx('ui_tap'); this.app.story.run(async () => { if (this.free && this.player && h.walk !== false) { const [wx, wz] = h.walk || [h.at[0], h.at[2]]; await this.goTo(wx, wz, h.at[1], { stopShort: h.walk ? 0 : 1.2 }); this.player.faceTo(h.at[0], h.at[2]); } await h.act(this.app); }); }
      ui.px(Math.round(s.x), y + 15, T.amber); ui.px(Math.round(s.x), y + 16, T.amber);
    }
  }
}
