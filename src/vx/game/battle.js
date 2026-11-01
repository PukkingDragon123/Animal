// Battle3D: the real-time Tokonmon battle sim (battle/sim.js) staged right where
// you are — the location's arena spot — with the 3D models acting out every event:
// wind-ups and attacks, specials, hits, dodges, faints; projectiles fly, zones
// glow on the ground, element particles burst on impact, damage numbers pop.
// Controls: tap a skill (your partner obeys after a short beat — BOND removes the
// delay), ATTACK, DODGE, BOND / ULT, SWAP, EMOTE, CATCH, RUN; tap the ground to
// move, tap a foe to target. Keys: 1-4 skills, Space attack, Shift dodge, B bond,
// F ult, Tab swap, E emote, C catch, R run.
//
// Presentation (all on the battle's own clock, so it plays the same at any frame rate):
//  · an intro: a sweeping establishing crane round the ring, a name card for each side, the foe trainer's
//    send-out (a throw, a flash, the Tokonmon popping out with its cry), then yours over your shoulder;
//    Space / Enter / a tap skips it
//  · the trainers stand at the ring's edge behind their Tokonmon and react: cheering a crit, wincing at a
//    big hit, pointing when you give an order, slumping when one goes down; bystanders turn to watch
//  · a director camera: push-ins on big skills and ultimates, a lens punch, hit-stop and shake on heavy
//    blows, a slow-motion push on every knock-out, a victory / defeat orbit at the end
//  · callouts: CRITICAL / SUPER EFFECTIVE / not very effective banners, bouncing damage numbers
//  · switching: the outgoing one shrinks into a beam of light, the next one pops out with a flash
//  · hit reactions: a springy knock-back away from the blow and a squash
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
import { E } from '../anim.js';
import { VOICE } from './life.js';
import { VFX } from './vfx.js';            // hand-drawn pixel sprite effects
import { Wreck } from './wreck.js';        // breaking props, debris, cracks and craters (restored after)
import { BattleHud } from './battlehud.js';   // the battle HUD

const ELC = (e) => (ELEMENTS[e] && ELEMENTS[e].color) || '#ffffff';
const HIT_FX = { pyro: 'fire', hydro: 'splash', bio: 'leaf', volto: 'bolt', geo: 'rock', echo: 'note', ecto: 'ghostfire', cryo: 'sparkle', ferro: 'shard', aero: 'dust', astro: 'star', nucleo: 'ember', draco: 'ghostfire' };
const MELEE = new Set(['attack', 'attack2', 'attack3', 'bite', 'slash', 'peck', 'punch', 'kick', 'ram', 'bigHit', 'slam', 'parry', 'grab', 'dodge']);
const V3 = THREE.Vector3, D2R = Math.PI / 180;
const _v = new V3(), _r = new THREE.Raycaster(), _p = new THREE.Plane(new V3(0, 1, 0), 0), _n = new THREE.Vector2();
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const wrapD = (a) => { a %= 360; if (a > 180) a -= 360; if (a < -180) a += 360; return a; };
const backOut = (t) => { t = clamp(t, 0, 1); const s = 2.2; return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2; };
// the trainers in the world: a battle name → the actor id that plays them
const ROLE = { 'Coach Gonda': 'coach', Coach: 'coach', Spike: 'spike', Kaito: 'kaito', Yumi: 'yumi', 'Farmer Aldo': 'gd_farmer', 'Uncle Ho': 'uncleHo', 'Professor Aoi': 'prof', Mom: 'mom' };
const NO_TRAINER = /^(wild\b|pidgun gang|barkorious)/i;
// how the trainers take it
const REACT = {
  good: { clips: ['cheer', 'pump', 'clap'], face: 'happy' }, bad: { clips: ['shock', 'flinch', 'facepalm'], face: 'surprised' },
  down: { clips: ['sad', 'facepalm', 'shock'], face: 'sad' }, ko: { clips: ['pump', 'cheer'], face: 'grin' }, order: { clips: ['command'], face: 'angry' },
  win: { clips: ['win', 'cheer'], face: 'grin' }, lose: { clips: ['defeat', 'sad'], face: 'sad' }, sore: { clips: ['angry', 'stomp'], face: 'angry' },
};
/** how big a skill is (total power across its effects; charged skills count double) */
function skillWeight(id) {
  const sk = SKILLS[id]; if (!sk) return 0;
  let p = 0; for (const e of sk.eff || []) p += (e.power || 0) * (e.count || 1);
  if ((sk.tags || []).includes('charge')) p *= 1.4;
  return p;
}
const cloneView = (v) => ({ target: v.target.clone(), dist: v.dist, yaw: v.yaw, pitch: v.pitch, fov: v.fov });
function lerpView(a, b, k, out = { target: new V3() }) {
  out.target = (out.target || new V3()).lerpVectors(a.target, b.target, k);
  out.dist = Math.exp(Math.log(Math.max(0.05, a.dist)) * (1 - k) + Math.log(Math.max(0.05, b.dist)) * k);
  out.yaw = a.yaw + wrapD(b.yaw - a.yaw) * k; out.pitch = a.pitch + (b.pitch - a.pitch) * k; out.fov = (a.fov ?? 30) + ((b.fov ?? 30) - (a.fov ?? 30)) * k;
  return out;
}

export class Battle3D {
  constructor(app) { this.app = app; this.active = false; this.units = new Map(); }
  // spec: { foe: { name, team: [[species, level, opts]], ai }, foes, allies, title, subtitle, tutorial, wild, rules, arenaType, money, only, partySize, arena }
  start(spec) {
    return new Promise((resolve) => this._start(spec, resolve).catch((e) => { console.error(e); try { this.cleanup(); } catch (e2) { /* already gone */ } this.active = false; resolve({ winner: 0, error: true }); }));
  }
  async _start(spec, resolve) {
    const app = this.app, s = app.state, w = app.world, L = w.loc;
    const A = spec.arena || L.arena || (w.sc && w.sc.arena) || this.autoArena();
    this.resolve = resolve; this.spec = spec; this.prevCam = { target: w.cam.target.toArray(), dist: w.cam.dist, yaw: w.cam.yaw, pitch: w.cam.pitch, fov: w.cam.fov };
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
    this.A = A; this.cx = A.at[0]; this.cz = A.at[1]; this.k = (A.r || 5) / this.st.arena.r; this.phi = yaw - Math.PI / 2; this.gy = w.ground(this.cx, this.cz);
    this.pops = []; this.callouts = []; this.banners = []; this.cries = []; this.waits = []; this.acc = 0; this.t = 0; this.ending = false; this.frozen = true; this.intro = true; this.skipIntro = false;
    this.beatT = -9; this.shot = null; this.rel = null; this.defT = null; this.hud = 0;
    // the trainers step up to the ring's edge; bystanders turn to watch; anything else in the ring steps out of it
    this.trainers = this.stageTrainers();
    this.hidden = [];
    const keep = new Set(this.trainers.map((tr) => tr.a));
    const homes = this.trainers.map((tr) => tr.saved);
    for (const a of w.actors.values()) {
      if (keep.has(a)) continue;
      const p = a.g.position, d = Math.hypot(p.x - this.cx, p.z - this.cz);
      // the ring is cleared; Tokonmon standing with a trainer are the ones fighting, so they step out too
      const withTrainer = a.kind === 'mon' && (d < (A.r || 5) + 3.5 || homes.some((h) => Math.hypot(p.x - h.x, p.z - h.z) < 2.5));
      if (a === w.partner || d < (A.r || 5) + 1.2 || withTrainer) { if (a.g.visible) { a.g.visible = false; this.hidden.push(a); } }
    }
    this.watchers = this.stageWatchers(keep);
    this.vfx = VFX.of(app); this.hudUI = new BattleHud(this);
    try { this.wreck = new Wreck(app, { at: [this.cx, this.cz], r: A.r || 5 }); } catch (e) { console.warn('[battle] wreck', e); this.wreck = null; }
    this.units = new Map();
    for (const u of this.st.units) {
      const a = await w.addMon('bu-' + u.id, u.model || u.species, [this.cx, this.cz, 0], { drip: u.drip || 1, look: u.look || 0 });
      a.g.visible = false; a.life = null;
      this.units.set(u.id, { u, a, once: 0, clip: 'idle', sent: false, sc: 0, base: a.g.scale.clone(), px: 0, pz: 0, kb: null, sq: null, pop: null, leave: null, h: null });
    }
    // a ring on the ground, discs for zones, glowing orbs for projectiles
    this.grp = new THREE.Group(); app.stage.scene.add(this.grp);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.965, 1, 8, 1, Math.PI / 8), new THREE.MeshBasicMaterial({ color: 0x5fd8e8, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));   // an octagon, never a circle
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.set(this.cx, this.gy + 0.03, this.cz); this.ring.scale.setScalar(0.01); this.grp.add(this.ring);
    this.orbs = []; this.zones = [];
    this.camCfg = { dist: C.dist || 8.2, yaw: C.yaw ?? 0, pitch: C.pitch ?? 18 };
    this.defT = new V3(this.cx, this.gy + 0.6, this.cz); this.defD = this.camCfg.dist;
    this.camNow = { target: this.defT.clone(), dist: this.camCfg.dist * 2, yaw: this.camCfg.yaw - 70, pitch: 38, fov: 30 };
    this.cin0 = app.cinema ? app.cinema.barsTo : 0;
    this.active = true; app.audio.music && app.audio.music(spec.music || 'battle', { fade: 0.5 });
    this.sync(0.016); this.camUpdate(0);
    await this.introSeq(spec);
    if (!this.active) return;
    this.intro = false; this.frozen = false;
    if (spec.tutorial) this.tutorial();
  }
  /** no arena given: the most open ring of ground near you (ahead of you preferred), the camera keeping roughly the
   *  angle you were looking from but swung clear of buildings */
  autoArena() {
    const w = this.app.world, p = w.player ? w.player.g.position : w.cam.target, yaw0 = w.cam.yaw || 0, nav = w.nav, L = w.city ? w.city.L : 0;
    const ok = (x, z) => !nav || !nav.ok || nav.ok(x, z, L);
    let best = null;
    for (const r of [5, 4.2, 3.6]) {
      for (const da of [0, 30, -30, 60, -60, 90, -90, 135, -135, 180]) for (const k of [0.75, 0.45, 0.15]) {
        const a = (yaw0 + 180 + da) * D2R, cx = p.x + Math.sin(a) * r * k, cz = p.z + Math.cos(a) * r * k;
        if (!ok(cx, cz)) continue;
        let n = 0, m = 0;
        for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; m++; if (ok(cx + Math.cos(t) * r, cz + Math.sin(t) * r)) n++; if (i % 2 === 0) { m++; if (ok(cx + Math.cos(t) * r * 0.55, cz + Math.sin(t) * r * 0.55)) n++; } }
        // the trainers' spots just outside the ring, across the camera's view
        const sx = -Math.cos(yaw0 * D2R), sz = Math.sin(yaw0 * D2R), R2 = r + 1.15; m += 2; if (ok(cx + sx * R2, cz + sz * R2)) n++; if (ok(cx - sx * R2, cz - sz * R2)) n++;
        const score = n / m + Math.cos(da * D2R) * 0.06 + k * 0.02 + (r - 3.6) * 0.03;
        if (!best || score > best.score) best = { score, at: [cx, cz], r, fill: n / m };
      }
      if (best && best.fill > 0.93) break;
    }
    if (!best) best = { at: [p.x, p.z], r: 4 };
    // the camera: the angle you looked from, swung off any building in the way
    const gy = w.ground(best.at[0], best.at[1]), yaw = this.clearView({ target: new V3(best.at[0], gy + 0.6, best.at[1]), dist: 8.2, yaw: yaw0, pitch: 18 }, [0, 15, -15, 30, -30, 45, -45, 70, -70]).yaw;
    return { at: best.at, r: best.r, cam: { yaw, dist: 8.2, pitch: 18 } };
  }
  // ------------------------------------------------------------------ people at the ringside
  findActor(name) {
    const w = this.app.world; if (!name) return null;
    let a = ROLE[name] && w.actor(ROLE[name]);
    if (!a) for (const x of w.actors.values()) if (x.kind === 'person' && x.npc && x.npc.name === name) { a = x; break; }
    return a || w.actor(String(name).toLowerCase()) || null;
  }
  /** each trainer stands just outside the ring behind their side's gate, facing in */
  stageTrainers() {
    const w = this.app.world, st = this.st, out = [];
    const R = st.arena.r + 1.15 / this.k;
    for (const T_ of st.trainers) {
      let a = null, temp = false;
      if (T_.isPlayer) a = w.player || w.actor('hero');
      else a = this.findActor(T_.name);
      if (!a && !T_.isPlayer && T_.side === 1 && !this.spec.wild && !NO_TRAINER.test(T_.name)) { a = w.addPerson('bt-' + T_.id, T_.name, [this.cx, this.cz, 0]); temp = true; }
      if (!a || a.kind !== 'person') continue;
      const p = a.g.position, saved = { x: p.x, y: p.y, z: p.z, yaw: a.yaw, vis: a.g.visible, clip: a.anim && a.anim.cur, idle: a.idleClip, look: a.look };
      a.path = null; if (a.arrive) { const r = a.arrive; a.arrive = null; r(); }
      // the spot: behind the gate, outside the ring (pulled in a little if that's a wall)
      let [x, z] = this.W(T_.gate.x * 0.85, T_.side === 0 ? R : -R);
      if (w.nav && w.nav.ok && w.city) for (let k = 0; k < 6 && !w.nav.ok(x, z, w.city.L); k++) [x, z] = this.W(T_.gate.x * 0.85, (T_.side === 0 ? 1 : -1) * R * (0.92 - k * 0.06));
      a.place(x, z, Math.atan2(this.cx - x, this.cz - z)); a.g.visible = true; a.look = null;
      a.play('idle', { fade: 0.1 }); a.idleClip = 'idle';
      out.push({ T: T_, a, side: T_.side, saved, temp, cool: 0, back: 0 });
    }
    return out;
  }
  /** people standing near the ring turn to watch the fight (and cheer and gasp along) */
  stageWatchers(skip) {
    const w = this.app.world, out = [], R = (this.A.r || 5) + 1.2;
    for (const a of w.actors.values()) {
      if (skip.has(a) || a.kind !== 'person' || !a.g.visible || a === w.player || a.life || out.length >= 10) continue;
      const p = a.g.position, d = Math.hypot(p.x - this.cx, p.z - this.cz);
      if (d < R || d > 15) continue;
      const seated = !!(a.anim && a.anim.c && a.anim.c.sit);
      out.push({ a, yaw: a.yaw, look: a.look, clip: a.anim && a.anim.cur, seated, cool: 0 });
      if (!seated) a.faceTo(this.cx, this.cz);
      a.look = new V3(this.cx, this.gy + 0.6, this.cz);
    }
    return out;
  }
  react(side, kind, o = {}) {
    const R = REACT[kind]; if (!R) return;
    for (const tr of this.trainers) {
      if (tr.side !== side || (o.only && tr.T !== o.only) || (this.t < tr.cool && !o.force)) continue;
      tr.cool = this.t + (o.cool ?? 1.8); tr.back = o.hold === Infinity ? 0 : this.t + (o.hold ?? 1.9);
      const clip = pick(R.clips); tr.a.play(tr.a.anim.clips[clip] ? clip : 'cheer', { restart: true });
      if (tr.a.anim.face) tr.a.anim.face(R.face, 2.2);
    }
  }
  crowd(kind) {
    const clips = kind === 'cheer' ? ['cheer', 'clap', 'pump'] : ['shock', 'flinch', 'clap'];
    for (const wa of this.watchers) {
      if (this.t < wa.cool || Math.random() < 0.35) continue;
      wa.cool = this.t + 2.5; wa.back = this.t + 2;
      if (!wa.seated) wa.a.play(pick(clips), { restart: true }); else if (wa.a.anim.face) wa.a.anim.face(kind === 'cheer' ? 'happy' : 'surprised', 2);
    }
  }
  async tutorial() {
    const app = this.app, tips = [['Tap a SKILL: your partner obeys after a short beat.', 2], ['ATK swings at the target. Tap a foe to target it.', 7], ['When the foe winds up, DODGE (Shift).', 12]];
    for (const [tip, at] of tips) { while (this.t < at && this.active) await this.sleep(0.2); if (!this.active || this.ending) return; app.ui.toast(tip, { dur: 4.5, icon: 'star', color: T.cyan }); }
  }
  me() { return this.ptr && unitById(this.st, this.ptr.active); }
  foe() { return this.st.units.find((u) => u.side === 1 && u.onField && u.state !== 'faint'); }
  // sim ↔ world
  W(x, z) { const c = Math.cos(this.phi), s = Math.sin(this.phi), k = this.k; return [this.cx + (x * c + z * s) * k, this.cz + (-x * s + z * c) * k]; }
  S(wx, wz) { const c = Math.cos(this.phi), s = Math.sin(this.phi), k = this.k, x = (wx - this.cx) / k, z = (wz - this.cz) / k; return [x * c - z * s, x * s + z * c]; }
  wpos(u, h = 0.35) { const r = this.units.get(u.id); if (r && r.placed) return new V3(r.a.g.position.x, this.gy + (u.y || 0) * this.k + h, r.a.g.position.z); const [x, z] = this.W(u.x, u.z); return new V3(x, this.gy + (u.y || 0) * this.k + h, z); }
  once(r, clip, hold) { r.a.anim.play(clip, { restart: true, fade: 0.08 }); r.clip = clip; r.once = this.t + hold; }
  /** wait on the battle's own clock (skipping the intro resolves at once) */
  sleep(s) { return new Promise((r) => { if (this.skipIntro && this.intro) r(); else this.waits.push({ until: this.t + s, r }); }); }
  height(r) {
    if (!r.h) { const g = r.a.g, sc = g.scale.clone(); try { g.scale.copy(r.base); g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); r.h = clamp(b.max.y - b.min.y, 0.3, 8); } catch (e) { r.h = 0.8; } g.scale.copy(sc); g.updateMatrixWorld(true); }
    return r.h;
  }
  sfx(n, o) { const au = this.app.audio; if (au && au.sfx) au.sfx(n, o); }
  // ---- keeping the lens clear: tree canopies (the cinema already steers round buildings)
  trees() {
    if (this._trees && this._treesSc === this.app.world.sc) return this._trees;
    const out = [], w = this.app.world, root = w.sc && w.sc.city && w.sc.city.root;
    if (root) root.traverse((o) => { if (o.isInstancedMesh && !o.userData.data && o.geometry && o.geometry.attributes.position && /tree|^tr_|palm/i.test(o.userData.prop || '')) out.push(o); });
    this._treesSc = w.sc; return (this._trees = out);
  }
  /** is anything leafy between a view's target and its camera? */
  leafy(v) {
    const T_ = this.trees().filter((o) => o.visible && o.count > 0); if (!T_.length) return false;
    const yr = v.yaw * D2R, pr = v.pitch * D2R, dir = new V3(Math.sin(yr) * Math.cos(pr), Math.sin(pr), Math.cos(yr) * Math.cos(pr));
    _r.set(v.target, dir); _r.near = 0.4; _r.far = v.dist;
    try { return _r.intersectObjects(T_, false).length > 0; } catch (e) { return false; } finally { _r.near = 0; _r.far = Infinity; }
  }
  /** the first yaw (of offsets from v.yaw) whose view is clear of buildings and trees */
  clearView(v, tries = [0, 20, -20, 40, -40, 65, -65]) {
    const cin = this.app.cinema;
    for (const dy of tries) { let q = { target: v.target.clone(), dist: v.dist, yaw: v.yaw + dy, pitch: v.pitch }; if (cin && cin.safe) { const s2 = cin.safe(q, { tries: [0] }); if (s2.dist < q.dist * 0.8) continue; q = s2; } if (!this.leafy(q)) return q; }
    return cin && cin.safe ? cin.safe({ target: v.target.clone(), dist: v.dist, yaw: v.yaw, pitch: v.pitch }) : v;
  }

  // ------------------------------------------------------------------ the intro
  async introSeq(spec) {
    const app = this.app, cin = app.cinema, w = app.world, base = this.camCfg, C = new V3(this.cx, this.gy + 0.7, this.cz);
    if (cin) cin.barsTo = 1;
    // 1. the establishing crane: high over the ring, sweeping round and down to the fight's angle (whichever way round
    //    keeps more of it out of the trees)
    const craneAt = (sgn, u, p0) => ({ target: C, dist: base.dist * (2.2 - 1.0 * u), yaw: base.yaw + sgn * (75 - 60 * u), pitch: p0 - (p0 - 24) * u });
    let sgn = -1, p0 = 42, bestN = 9;
    for (const [sg, pp] of [[-1, 42], [1, 42], [-1, 56], [1, 56]]) { let n = 0; for (const u of [0, 0.35, 0.7]) if (this.leafy(craneAt(sg, u, pp))) n++; if (n < bestN) { bestN = n; sgn = sg; p0 = pp; } if (!n) break; }
    this.shotTo((t) => { const u = E.inout(clamp(t / 2.6, 0, 1)); return Object.assign(craneAt(sgn, u, p0), { fov: 30 }); }, { blend: 0 });
    this.camUpdate(0);
    app.fade(0, 350);
    this.sfx('whoosh', { pitch: 0.8 });
    this.callout(spec.title || 'BATTLE!', spec.subtitle || '', T.amber, 1.25, true);
    await this.sleep(1.2);
    // 2. a name card each side
    const foeT = this.trainers.find((tr) => tr.side === 1), foeName = spec.wild ? 'Wild ' + (SPECIES[this.st.units.find((u) => u.side === 1).species] || {}).name : (this.st.trainers.find((x) => x.side === 1) || {}).name || 'Rival';
    const myLead = this.st.units.find((u) => u.side === 0 && u.onField), allies = this.st.trainers.filter((x) => x.side === 0 && !x.isPlayer).map((x) => x.name);
    if (cin) {
      cin.nameCard(foeName, spec.wild ? 'appeared!' : this.st.units.filter((u) => u.side === 1).length + ' Tokonmon', { side: 'right', wait: false, hold: 2600, y: 0.3, color: '#3a1420', accent: T.coral, accentL: T.coralL, sfx: false });
      cin.nameCard(app.state.player.name, allies.length ? 'with ' + allies.join(' & ') : 'Rookie trainer', { side: 'left', wait: false, hold: 2600, y: 0.62, color: '#142a3a', accent: T.cyan, accentL: T.cyanL });
    }
    this.vs = { t: 0 };
    await this.sleep(1.5);
    this.vs = null;
    // 3. the foe sends out (a trainer throws; a wild one bursts out of hiding)
    const foeUnits = [...this.units.values()].filter((r) => r.u.side === 1 && r.u.onField);
    if (foeT && foeUnits.length) {
      this.shotOn(foeT.a, { dist: 3.4, ang: 0.55, pitch: 6, h: 1.25, blend: 0.45 });
      await this.sleep(0.5);
      for (const tr of this.trainers.filter((x) => x.side === 1)) { tr.a.play('throw', { restart: true }); if (tr.a.anim.face) tr.a.anim.face('angry', 2); }
      this.sfx('throw');
      await this.sleep(0.35);
    } else if (foeUnits.length) { this.sfx('sneak_rustle'); if (w.player && app.feel) app.feel.emote(w.player, '!', 1.4); }
    for (const r of foeUnits) this.sendOut(r, { first: r === foeUnits[0] });
    if (foeUnits[0]) this.shotOn(foeUnits[0].a, { dist: Math.max(3, this.height(foeUnits[0]) * 2.8), ang: 0.62, pitch: 9, h: this.height(foeUnits[0]) * 0.5, blend: 0.35, push: 0.12 });
    await this.sleep(1.1);
    // 4. yours, over your shoulder
    const meT = this.trainers.find((tr) => tr.T.isPlayer), mineU = [...this.units.values()].filter((r) => r.u.side === 0 && r.u.onField);
    if (meT) {
      const p = meT.a.g.position, f = meT.a.yaw, gate = mineU[0] ? mineU[0].a.g.position : C;
      const mid = new V3((p.x * 0.35 + this.cx * 0.65), this.gy + 0.9, (p.z * 0.35 + this.cz * 0.65)); void gate;
      this.shotTo(() => ({ target: mid, dist: 4.4, yaw: f / D2R + 180 + 24, pitch: 13, fov: 32 }), { blend: 0.45 });
      await this.sleep(0.4);
      meT.a.play('throw', { restart: true }); if (meT.a.anim.face) meT.a.anim.face('angry', 2);
      this.sfx('throw');
      if (myLead) this.callout(`Go, ${myLead.name}!`, '', T.cyan, 1.2);
      await this.sleep(0.3);
    }
    for (const r of mineU) this.sendOut(r, { first: r === mineU[0] });
    for (const tr of this.trainers.filter((x) => x.side === 0 && !x.T.isPlayer)) tr.a.play('point', { restart: true });
    await this.sleep(1.0);
    // 5. into the fight
    this.releaseShot(0.9);
    if (cin) cin.barsTo = this.cin0 || 0;
    for (const r of this.units.values()) if (r.u.onField && !r.sent) this.sendOut(r, { quiet: true });
    await this.sleep(0.6);
    this.skipIntro = false;
    this.callout('GO!', '', T.cyan, 0.8, true);
    this.sfx('ui_confirm');
  }
  /** a Tokonmon pops out of its gate: flash, ring, sparkle, cry */
  sendOut(r, o = {}) {
    if (r.sent && !o.again) return;
    const fx = this.app.world.fx, u = r.u;
    r.sent = true; r.placed = false; r.pop = { t: 0, dur: 0.5 }; r.leave = null;
    { const [x, z] = this.W(u.x, u.z), a = r.a; a.g.position.set(x, this.app.world.ground(x, z) + (u.y || 0) * this.k, z); a.yaw = a.targetYaw = u.face + this.phi; a.g.rotation.y = a.yaw; }   // on its gate, facing in, before the camera frames it
    const p = this.wpos(u, 0.3), col = ELC(u.elem);
    if (!o.quiet) {
      const v = this.vfx, top = p.clone().setY(p.y + 0.35); void fx;
      v.burst('flash', top, { scale: 1.3 }); v.burst('twinkle', top, { n: 14, tint: col, speed: 1.4 }); v.burst('impact', top, { scale: 0.8 });
      if (this.spec.wild && u.side === 1) { v.dust(p, 4, 1.1); v.burst('leaf', top, { n: 8 }); } else v.elementHit(u.elem, top, { power: 0.5 });
      this.sfx('charge_release', { vol: 0.7 }); this.sfx('sparkle', { vol: 0.6 });
      if (o.first && this.app.cinema) this.app.cinema.flash('#ffffff', 0.25, 0.55);
      setTimeout(() => this.cry(r), 120);
    }
    this.once(r, 'cry', 1.3);
  }
  /** its cry: a little bubble with its call, babbled in a voice its size */
  cry(r, text) {
    const V = VOICE[r.u.species] || VOICE[String(r.u.species).split('_')[0]] || [(SPECIES[r.u.species] || {}).name ? SPECIES[r.u.species].name.slice(0, 4) + '!' : '!', 1.4];
    const w = this.app.world, B = w.bubbles || (w.bubbles = []);
    for (let i = B.length - 1; i >= 0; i--) if (B[i].a === r.a) B.splice(i, 1);
    B.push({ a: r.a, text: text || V[0], t: 0, n: 0, dur: 1.4, voice: { pitch: V[1], timbre: 'triangle', speed: 1.5, level: 0.9 } });
    if (V[2]) this.sfx(V[2], { vol: 0.6, pitch: 0.95 + Math.random() * 0.1 });
    else this.sfx('roar', { vol: 0.35, pitch: 0.8 + V[1] * 0.4 });
    this.cries.push({ r, text: text || V[0], t: 0 });
  }

  // ------------------------------------------------------------------ the director camera
  defaultView(dt) {
    const st = this.st, me = this.me(); let mx = 0, mz = 0, k = 0;
    for (const [, r] of this.units) { const u = r.u; if (!r.sent || !u.onField || u.state === 'faint' || !r.placed) continue; mx += r.a.g.position.x; mz += r.a.g.position.z; k++; }
    if (k) { mx /= k; mz /= k; const rm = me && this.units.get(me.id); if (rm && rm.placed) { const p = rm.a.g.position; mx = mx * 0.7 + p.x * 0.3; mz = mz * 0.7 + p.z * 0.3; } } else { mx = this.cx; mz = this.cz; }
    const kk = 1 - Math.exp(-dt * 3), T0 = this.defT;
    T0.x += (mx - T0.x) * kk; T0.z += (mz - T0.z) * kk; T0.y += (this.gy + 0.6 - T0.y) * kk;
    this.defD += (this.camCfg.dist - this.defD) * kk;
    void st;
    return { target: T0, dist: this.defD, yaw: this.camCfg.yaw, pitch: this.camCfg.pitch, fov: 30 };
  }
  camUpdate(dt) {
    const c = this.app.world.cam, def = this.defaultView(dt);
    let v = def;
    if (this.shot) {
      const s = this.shot; s.t += dt;
      const want = s.fn(s.t, def), k = s.blend > 0 ? E.inout(clamp(s.t / s.blend, 0, 1)) : 1;
      v = lerpView(s.from, want, k);
      if (s.hold !== undefined && s.t > s.hold) { this.camNow = cloneView(v); this.releaseShot(s.out ?? 0.6); }
    } else if (this.rel) {
      const R = this.rel; R.t += dt; const k = E.inout(clamp(R.t / R.dur, 0, 1));
      v = lerpView(R.from, def, k); if (k >= 1) this.rel = null;
    }
    c.target.copy(v.target); c.dist = v.dist; c.yaw = v.yaw; c.pitch = v.pitch; c.fov = v.fov;
    this.camNow = cloneView(v);
  }
  shotTo(fn, o = {}) {
    this.shot = { fn: typeof fn === 'function' ? fn : () => fn, t: 0, blend: o.blend ?? 0.45, hold: o.hold, out: o.out, from: cloneView(this.camNow || { target: this.defT, dist: this.camCfg.dist, yaw: this.camCfg.yaw, pitch: this.camCfg.pitch, fov: 30 }), prio: o.prio || 0 };
    this.rel = null;
  }
  releaseShot(dur = 0.6) { if (!this.shot) return; this.rel = { from: cloneView(this.camNow), t: 0, dur: Math.max(0.01, dur) }; this.shot = null; }
  /** frame an actor: ang (0 = from the fight's side, 1 = from its front), dist, pitch, h (look-at height), push (fraction closed while held) */
  shotOn(a, o = {}) {
    const base = this.camCfg.yaw, f = a.yaw / D2R, h = o.h ?? 0.6, push = o.push ?? 0.06, orb = o.orbit || 0, hold = o.span || 3;
    let yaw = base + wrapD(f - base) * (o.ang ?? 0.4) + (o.yawOff || 0), d0 = o.dist ?? 3;
    if (o.safe !== false) { const q = a.g.position, v = this.clearView({ target: new V3(q.x, q.y + h, q.z), dist: d0, yaw, pitch: o.pitch ?? 8 }); yaw = v.yaw; d0 = Math.min(d0, v.dist); }   // swing off buildings and trees
    this.shotTo((t) => { const p = a.g.position, u = E.inout(clamp(t / hold, 0, 1)); return { target: new V3(p.x, p.y + h, p.z), dist: d0 * (1 - push * u), yaw: yaw + orb * u, pitch: (o.pitch ?? 8) + (o.rise || 0) * u, fov: o.fov ?? 30 }; }, o);
  }
  /** a director beat: only when the camera is free (or the new beat matters more) and not too often */
  beat(prio, gap = 2.2) {
    if (this.intro || this.ending) return false;
    if (this.shot && this.shot.prio > prio) return false;
    if (this.t - this.beatT < gap && prio < 3) return false;
    this.beatT = this.t; return true;
  }
  shake(a, decay = 6) { const c = this.app.cinema; if (c) c.shake(a, decay); }
  flash(col, dur = 0.2, a = 0.6) { const c = this.app.cinema; if (c) c.flash(col, dur, a); }
  punch(d = 5) { const c = this.app.cinema; if (c) c.punch(d); }

  // ------------------------------------------------------------------ simulation
  update(dt) {
    if (!this.active || !this.st) return;
    const st = this.st; this.t += dt;
    for (let i = this.waits.length - 1; i >= 0; i--) { const W_ = this.waits[i]; if (this.t >= W_.until || (this.skipIntro && this.intro)) { this.waits.splice(i, 1); W_.r(); } }
    let scale = this.frozen ? 0 : 1; if (st.slowmo > 0) scale *= 0.4; if (st.hitstop > 0) scale *= 0.15;
    this.acc += dt * scale; let n = 0;
    while (this.acc >= DT && n < 4) { step(st, DT); this.acc -= DT; n++; this.events(st.events); this.track(st.events); }
    if (st.qte && !this._qte) { this._qte = true; setTimeout(() => { import('../../battle/sim.js').then((m) => { if (this.st === st) m.resolveQte(st, st.qte.id, 0.75 + Math.random() * 0.2); this._qte = false; }); }, 600); }
    this.sync(dt);
    this.camUpdate(dt);
    if (this.wreck) this.wreck.update(dt);
    for (const tr of this.trainers) {
      if (tr.back && this.t > tr.back) { tr.back = 0; tr.a.play('idle', { fade: 0.3 }); }
      const u = tr.T.active && unitById(st, tr.T.active), r = u && this.units.get(u.id);   // eyes on their Tokonmon
      tr.a.look = r && r.sent && r.a.g.visible ? r.a : null;
    }
    for (const wa of this.watchers) if (wa.back && this.t > wa.back) { wa.back = 0; wa.a.play(wa.seated ? (wa.clip || 'sit') : 'idle', { fade: 0.3 }); }
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter((p) => p.t < 1.1);
    for (const c of this.callouts) c.t += dt; this.callouts = this.callouts.filter((c) => c.t < c.dur);
    for (const b of this.banners) b.t += dt; this.banners = this.banners.filter((b) => b.t < b.dur);
    for (const c of this.cries) c.t += dt; this.cries = this.cries.filter((c) => c.t < 1.3);
    if (this.vs) this.vs.t += dt;
    this.hud += ((this.intro ? 0 : 1) - this.hud) * Math.min(1, dt * 5);
    if (st.over && !this.ending) this.end();
  }
  sync(dt) {
    const w = this.app.world;
    for (const [, r] of this.units) {
      const u = r.u, a = r.a;
      if (r.leave) r.leave.t += dt;
      const leaving = r.leave && r.leave.t < r.leave.dur;
      const show = r.sent && (u.onField || u.state === 'faint' || leaving);
      a.g.visible = show && !(u.state === 'faint' && this.t - (r.faintT ?? this.t) > 4.5);
      if (!show) { r.placed = false; continue; }
      const [x, z] = this.W(u.x, u.z), first = !r.placed; r.placed = true;
      if (first) { r.px = x; r.pz = z; }
      const f = first ? 1 : Math.min(1, dt * 16); r.px += (x - r.px) * f; r.pz += (z - r.pz) * f;
      // a springy shove away from the blow (visual only: the sim keeps its own position)
      let ox = 0, oz = 0, sx = 1, sy = 1;
      if (r.kb) { r.kb.t += dt; const e = r.kb.amp * (Math.exp(-r.kb.t * 6) - Math.exp(-r.kb.t * 22)) * 1.9; ox = r.kb.dx * e; oz = r.kb.dz * e; if (r.kb.t > 1) r.kb = null; }
      if (r.sq) { r.sq.t += dt; const q = r.sq.amp * Math.exp(-r.sq.t * 9) * Math.cos(r.sq.t * 26); sy = 1 - q; sx = 1 + q * 0.6; if (r.sq.t > 0.8) r.sq = null; }
      const p = a.g.position; p.x = r.px + ox; p.z = r.pz + oz; p.y = w.ground(p.x, p.z) + (u.y || 0) * this.k;
      // popping out of the gate / shrinking into the recall beam
      let sc = 1;
      if (r.pop) { r.pop.t += dt; const k = r.pop.t / r.pop.dur; sc = k >= 1 ? 1 : Math.max(0.01, backOut(k)); p.y += Math.sin(clamp(k, 0, 1) * Math.PI) * 0.35; if (k >= 1) r.pop = null; }
      if (leaving) { const k = r.leave.t / r.leave.dur; sc = Math.max(0.01, 1 - k * k); p.y += k * 0.4; }
      r.sc = sc;
      a.g.scale.set(r.base.x * sc * sx, r.base.y * sc * sy, r.base.z * sc * sx);
      a.targetYaw = u.face + this.phi; if (first) a.yaw = a.targetYaw;
      // eyes on the opponent
      if (!a.look || !a.look.g || !a.look.g.visible) { const o = [...this.units.values()].find((q) => q.u.side !== u.side && q.u.onField && q.u.state !== 'faint' && q.sent); a.look = o ? o.a : null; }
      if (u.state === 'faint') { if (r.clip !== 'faint') { this.once(r, a.anim.clips.faint ? 'faint' : 'hurt', 99); r.faintT = r.faintT ?? this.t; } }
      else if (r.once > this.t) { /* a one-shot is playing */ }
      else {
        const charging = u.charge || (u.act && u.act.phase === 'charge');
        const want = charging ? 'cry' : u.moving > 0.4 || u.dash ? 'walk' : 'idle';
        if (r.clip !== want) { a.anim.play(want, { fade: 0.15 }); r.clip = want; }
      }
      if (u.bonded && Math.random() < dt * 6) this.vfx.burst('twinkle', this.wpos(u, 0.5), { tint: '#bff4ff', speed: 0.6 });
    }
    // the ring grows in under the first send-out
    const rs = this.ring.scale.x, rw = this.A.r || 5; if (rs < rw) this.ring.scale.setScalar(Math.min(rw, rs + (rw - rs) * Math.min(1, dt * 4) + dt * 0.5));
    // projectiles: a pixel sprite head each frame and a trail of the element's own sprites
    const st = this.st, orbs = st.proj || [];
    for (const pr of orbs) { const [x, z] = this.W(pr.x, pr.z); _v.set(x, this.gy + 0.45, z); this.vfx.head(pr.elem, _v); if (Math.random() < dt * 22) this.vfx.trail(pr.elem, _v); }
    const zs = st.zones || [];
    while (this.zones.length < zs.length) { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 8, Math.PI / 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; this.grp.add(m); this.zones.push(m); }   // octagons
    this.zones.forEach((m, i) => { const z0 = zs[i]; m.visible = !!z0; if (!z0) return; const [x, z] = this.W(z0.x, z0.z); m.position.set(x, this.gy + 0.04, z); m.scale.setScalar(z0.r * this.k); m.material.color.set(ELC(z0.elem)); });
  }
  events(evs) {
    const st = this.st, U = (id) => unitById(st, id), app = this.app, fx = app.world.fx, R = (u) => u && this.units.get(u.id);
    for (const e of evs) {
      switch (e.type) {
        case 'anim': {
          const u = U(e.u), r = R(u); if (!r || !e.anim || e.anim === 'spawn' || e.anim === 'hit') break;
          if (e.anim === 'bigHit') { this.once(r, r.a.anim.clips.hurt ? 'hurt' : 'idle', 0.55); break; }
          if (e.anim === 'dodge') { this.once(r, 'walk', 0.35); this.vfx.dust(this.wpos(u, 0.05), 2, 0.8); this.vfx.burst('wind', this.wpos(u, 0.4), { scale: 0.8 }); break; }
          this.once(r, MELEE.has(e.anim) ? 'attack' : 'special', MELEE.has(e.anim) ? 0.7 : 1.2); break;
        }
        case 'cast': {
          const u = U(e.u), r = R(u); if (!r) break;
          const big = skillWeight(e.skill) >= 44;
          if (e.phase !== 'release') { if (big) { this.vfx.burst('crackle', this.wpos(u, 0.1), { scale: 1.2, tint: ELC(u.elem) }); this.vfx.burst('twinkle', this.wpos(u, 0.5), { n: 8, tint: ELC(u.elem), speed: 1.2 }); this.sfx('charge', { vol: 0.5 }); } break; }
          this.once(r, 'special', 1.2); this.sfx('charge_release');
          if (big && this.beat(1)) {
            // a push-in on a big skill: from the attacker's front three-quarter, a lens punch and a jolt
            this.shotOn(r.a, { dist: Math.max(2.4, this.height(r) * 2.8), ang: 0.55, pitch: 5, h: this.height(r) * 0.55, blend: 0.22, hold: 0.85, out: 0.55, push: 0.1, prio: 1 });
            this.punch(4); this.shake(0.06); this.flash(ELC(u.elem), 0.18, 0.22);
            if (SKILLS[e.skill]) this.callout(skillName(u, e.skill).toUpperCase(), u.name, ELC(u.elem), 0.9);
          }
          break;
        }
        case 'hit': {
          const t = U(e.tgt), r = R(t); if (!r) break;
          const src = e.src ? U(e.src) : null, heavy = e.dmg > t.maxHp * 0.12, dot = e.kind === 'dot' || e.kind === 'recoil';
          if (!dot && e.dmg > t.maxHp * 0.08) this.once(r, r.a.anim.clips.hurt ? 'hurt' : 'idle', 0.5);
          const p = this.wpos(t, 0.45), sk = e.skill && SKILLS[e.skill], melee = !e.skill || (sk && sk.eff && sk.eff.some((f) => f.t === 'melee' || f.t === 'dash'));
          const dir = src && R(src) && R(src).placed ? new V3().subVectors(t ? this.wpos(t, 0) : p, this.wpos(src, 0)).setY(0.4).normalize() : null;
          if (!dot) { this.vfx.elementHit(e.elem || (src && src.elem) || 'astro', p, { power: e.crit ? 2 : heavy ? 1.5 : 0.8, crit: e.crit, dir }); if (melee && src) this.vfx.slash(p, { tint: ELC(src.elem), scale: e.crit ? 1.3 : 1 }); }
          else this.vfx.burst(HIT_FX[e.elem] === 'fire' ? 'ember' : 'spark', p, { n: 2, scale: 0.6 });
          this.hudUI.hit(t, e.dmg); if (!dot && src && src.side === 0 && t.side === 1) this.hudUI.comboHit();
          if (this.wreck && !dot && (heavy || e.crit)) { const g = this.wpos(t, 0); this.wreck.impact(g.x, g.z, { r: e.crit ? 2.2 : 1.6, power: e.crit ? 2 : 1.2, crack: e.crit || Math.random() < 0.4, y: this.gy }); }
          this.pop(p, String(e.dmg), e.crit ? T.amber : e.eff > 1.2 ? '#ff8a5a' : e.eff < 0.8 ? T.dim : T.text, e.crit ? 2 : heavy ? 1.5 : 1, 0, e.crit);
          if (dot) break;
          // the shove and squash
          if (src && R(src) && R(src).placed) { const sp = R(src).a.g.position, q = r.a.g.position, dx = q.x - sp.x, dz = q.z - sp.z, d = Math.hypot(dx, dz) || 1; r.kb = { dx: dx / d, dz: dz / d, amp: (e.crit ? 0.42 : heavy ? 0.3 : 0.14) * Math.max(0.6, this.height(r)), t: 0 }; }
          r.sq = { amp: e.crit ? 0.22 : heavy ? 0.15 : 0.08, t: 0 };
          this.sfx(e.crit ? 'crit' : heavy ? 'hit_heavy' : 'hit_light', { pitch: 0.9 + Math.random() * 0.2 });
          const cin = app.cinema;
          if (e.crit) { this.shake(0.22, 7); if (cin) cin.hitStop(110); this.flash('#ffffff', 0.12, 0.35); this.banner('CRITICAL HIT!', '#ffd84a'); }
          else if (heavy) { this.shake(0.12, 8); if (cin) cin.hitStop(55); }
          if (e.eff > 1.2) this.banner('SUPER EFFECTIVE!', '#ff8a5a');
          else if (e.eff < 0.8 && Math.random() < 0.6) this.banner('not very effective...', '#9a94b8', true);
          // the trainers feel it
          if (e.crit || e.eff > 1.2 || heavy) { this.react(t.side === 0 ? 1 : 0, 'good'); this.react(t.side, 'bad'); this.crowd(e.crit ? 'cheer' : 'gasp'); }
          break;
        }
        case 'miss': { const t = U(e.u); if (t) { this.pop(this.wpos(t, 0.6), e.blind ? 'miss' : 'dodge!', T.cyan, 1); this.vfx.dust(this.wpos(t, 0.05), 2, 0.8); this.vfx.burst('wind', this.wpos(t, 0.5), { scale: 0.7 }); } break; }
        case 'perfectDodge': { this.callout('PERFECT DODGE!', 'counter for a crit', T.cyan, 1); if (app.cinema) app.cinema.slowmo(0.35, 380, 260); const t = U(e.u); if (t) this.react(t.side, 'good', { force: true }); break; }
        case 'parry': { this.callout(e.perfect ? 'PERFECT PARRY!' : 'PARRY!', '', T.amber, 0.9); if (e.perfect) { this.shake(0.12); this.flash('#fff0b0', 0.15, 0.3); } break; }
        case 'reaction': { const [x, z] = this.W(e.x, e.z), q = new V3(x, this.gy + 0.5, z); this.vfx.burst('impact', q, { scale: 2, tint: e.color }); this.vfx.burst('flash', q, { scale: 1.6, tint: e.color }); this.vfx.burst('twinkle', q, { n: 16, tint: e.color, speed: 2 }); if (this.wreck) this.wreck.impact(x, z, { r: 2.6, power: 2, crack: true, y: this.gy }); this.callout(String(e.name).toUpperCase(), 'reaction!', e.color || T.amber, 1.2); this.shake(0.2, 5); this.flash(e.color || '#ffffff', 0.2, 0.3); this.crowd('cheer'); break; }
        case 'combo': this.callout(String(e.name).toUpperCase(), 'combo!', T.pink, 0.9); break;
        case 'teamComboHit': { const [x, z] = this.W(e.x, e.z), q = new V3(x, this.gy + 0.4, z); this.vfx.burst('impact', q, { scale: 2.6 }); this.vfx.burst('flash', q, { scale: 2 }); this.vfx.burst('chip', q, { n: 14 }); if (this.wreck) this.wreck.impact(x, z, { r: (e.r || 2) * this.k + 2, power: 3, crater: true, y: this.gy }); this.shake(0.3, 4); this.flash('#ffffff', 0.25, 0.45); this.crowd('cheer'); break; }
        case 'burst': { const [x, z] = this.W(e.x, e.z), rr = Math.max(0.6, (e.r || 1) * this.k); this.vfx.elementHit(e.elem || 'geo', new V3(x, this.gy + 0.3, z), { power: e.small ? 0.6 : 1.4 }); if (!e.small) { this.shake(0.08, 8); if (this.wreck) this.wreck.impact(x, z, { r: rr + 1.2, power: 1.5, crater: rr > 1.3 || !!e.crack, crack: true, y: this.gy }); } break; }
        case 'slam': { const [x, z] = this.W(e.x, e.z); this.vfx.burst('impact', new V3(x, this.gy + 0.2, z), { scale: 1.8 }); this.vfx.dust(new V3(x, this.gy + 0.1, z), 4, 1.3); this.shake(0.16, 6); if (this.wreck) this.wreck.impact(x, z, { r: (e.r || 1.5) * this.k + 1.5, power: 2.5, crater: true, y: this.gy }); break; }
        case 'wallSlam': case 'land': { if (e.type === 'land' && !e.heavy) break; const uu = e.u && U(e.u), q = uu ? this.wpos(uu, 0) : null; if (!q) break; this.vfx.dust(q, 3, 1); if (this.wreck) this.wreck.impact(q.x, q.z, { r: 1.4, power: 1.6, crack: true, y: this.gy }); break; }
        case 'projEnd': { const [x, z] = this.W(e.x, e.z); this.vfx.elementHit(e.elem || 'astro', new V3(x, this.gy + 0.45, z), { power: 0.6 }); if (this.wreck) this.wreck.impact(x, z, { r: 0.9, power: 1, y: this.gy }); break; }
        case 'faint': {
          const u = U(e.u), r = R(u); if (!r) break;
          this.once(r, r.a.anim.clips.faint ? 'faint' : 'hurt', 99); r.faintT = this.t;
          this.sfx('ko'); this.vfx.dust(this.wpos(u, 0.05), 4, 1.2); this.vfx.burst('twinkle', this.wpos(u, 0.8), { n: 8, speed: 1.5 }); this.vfx.smoke(this.wpos(u, 0.3), 1, 0.9); if (this.wreck) { const g = this.wpos(u, 0); this.wreck.impact(g.x, g.z, { r: 1.6, power: 1.4, crack: true, y: this.gy }); }
          if (u.side === 1) this.callout('KNOCKED OUT!', u.name, T.pink, 1.2); else this.callout(u.name + ' is down!', '', '#9fb3ff', 1.2);
          this.react(u.side, 'down', { force: true, hold: 2.4 }); this.react(u.side === 0 ? 1 : 0, 'ko', { force: true }); this.crowd(u.side === 1 ? 'cheer' : 'gasp');
          // slow motion, and the camera leans in on the fall (the last one down gets the full treatment in end())
          const left = st.units.some((x) => x.side === u.side && x.hp > 0 && x.state !== 'faint');
          if (left && this.beat(3)) { this.shotOn(r.a, { dist: Math.max(2.8, this.height(r) * 3), ang: 0.3, pitch: 12, h: this.height(r) * 0.4, blend: 0.3, hold: 1.2, out: 0.7, prio: 3, orbit: 18, span: 1.4 }); if (app.cinema) app.cinema.slowmo(0.3, 750, 400); this.flash('#ffffff', 0.18, 0.35); }
          break;
        }
        case 'recall': { const u = U(e.u), r = R(u); if (!r) break; r.leave = { t: 0, dur: 0.38 }; const p = this.wpos(u, 0.3); this.vfx.burst('flash', p, { scale: 1.2, tint: '#ff8a8a' }); this.vfx.burst('twinkle', p, { n: 10, tint: '#ffb0b0', speed: 1.3 }); this.sfx('switch'); if (u.side === 0) this.callout(u.name + ', come back!', '', T.text, 0.9); const tr = this.trainers.find((x) => x.T.id === u.trainer); if (tr) { tr.a.play('point', { restart: true }); tr.back = this.t + 1.5; } break; }
        case 'switch': {
          const inn = U(e.in), r = R(inn); if (!r) break;
          r.sent = false; this.sendOut(r, { again: true, first: inn.side === 0 });
          this.callout(inn.side === 0 ? `Go, ${inn.name}!` : inn.name + '!', inn.side === 0 ? 'switch in' : 'sent out', ELC(inn.elem), 0.9);
          const tr = this.trainers.find((x) => x.T.id === inn.trainer); if (tr) { tr.a.play('throw', { restart: true }); tr.back = this.t + 1.4; }
          if (this.beat(2, 1.2)) this.shotOn(r.a, { dist: Math.max(2.6, this.height(r) * 2.6), ang: 0.4, pitch: 6, h: this.height(r) * 0.5, blend: 0.3, hold: 1.0, out: 0.6, prio: 2 });
          break;
        }
        case 'bond': { const u = U(e.u), r = R(u); if (r) { this.callout('BOND!', e.name || 'soul stones in sync', T.cyan, 1.2, true); this.vfx.burst('flash', this.wpos(u, 0.5), { scale: 1.6, tint: '#bff4ff' }); this.vfx.burst('twinkle', this.wpos(u, 0.5), { n: 20, tint: '#bff4ff', speed: 2 }); this.once(r, 'cry', 1.4); this.flash('#bff4ff', 0.3, 0.5); this.react(u.side, 'good', { force: true }); if (this.beat(2)) this.shotOn(r.a, { dist: Math.max(2.6, this.height(r) * 2.6), ang: 0.5, pitch: 4, h: this.height(r) * 0.5, blend: 0.3, hold: 1.2, out: 0.6, prio: 2, orbit: 25, span: 1.4 }); } break; }
        case 'unbond': { const u = U(e.u); if (u && u.side === 0) app.ui.toast(e.reason === 'ult' ? 'The ultimate burned out the bond' : 'Bond released', { icon: 'link', color: T.dim }); break; }
        case 'ult': {
          const u = U(e.u), r = R(u); if (!r) break;
          this.callout(e.name ? e.name.toUpperCase() : 'ULTIMATE!', u.name, ELC(u.elem), 1.6, true); this.once(r, 'special', 1.6);
          this.shake(0.3, 3); this.punch(8); this.flash(ELC(u.elem), 0.4, 0.6); this.sfx('ult_start');
          if (this.beat(4)) { this.shotOn(r.a, { dist: Math.max(2.4, this.height(r) * 2.4), ang: 0.65, pitch: -6, h: this.height(r) * 0.55, blend: 0.25, hold: 1.5, out: 0.7, prio: 4, orbit: 30, span: 1.6, low: true }); if (app.cinema) app.cinema.dutch(u.side === 0 ? -6 : 6); setTimeout(() => app.cinema && app.cinema.dutch(0), 1500); }
          this.react(u.side, 'good', { force: true }); this.crowd('cheer');
          { const q = this.wpos(u, 0.4); this.vfx.burst('flash', q, { scale: 2.2, tint: ELC(u.elem) }); this.vfx.elementHit(u.elem, q, { power: 2 }); setTimeout(() => { if (this.active && this.wreck) { this.wreck.impact(q.x, q.z, { r: 4.5, power: 3, crater: true, y: this.gy }); this.vfx.burst('impact', q, { scale: 3 }); this.shake(0.3, 4); } }, 600); }
          break;
        }
        case 'heal': { const u = U(e.u); if (u) { this.pop(this.wpos(u, 0.6), '+' + e.amt, T.green, 1); this.vfx.burst('twinkle', this.wpos(u, 0.5), { n: 8, tint: '#9af06a', speed: 1 }); this.vfx.burst('leaf', this.wpos(u, 0.5), { n: 3 }); } break; }
        case 'status': { const u = U(e.u); if (u) this.pop(this.wpos(u, 0.8), String(e.s), T.pink, 1); break; }
        case 'emote': { const u = U(e.u), r = R(u); if (r) { this.once(r, r.a.anim.clips.dance ? 'dance' : 'win', 1.4); this.vfx.burst('note', this.wpos(u, 0.8), { n: 3 }); } break; }
        case 'order': { const u = U(e.u); if (u && u.side === 0 && e.kind === 'skill') { const tr = this.trainers.find((x) => x.T.isPlayer); if (tr && this.t >= tr.cool) { tr.cool = this.t + 1.4; tr.back = this.t + 1.3; tr.a.play('command', { restart: true }); } } break; }
        case 'item': app.ui.toast('Used ' + String(e.id).replace('_', ' '), { icon: 'bag' }); break;
        case 'captureThrow': this.callout('SOUL LINK!', Math.round((e.chance || 0) * 100) + '% chance', T.green, 1); { const tr = this.trainers.find((x) => x.T.isPlayer); if (tr) { tr.a.play('throw', { restart: true }); tr.back = this.t + 1.4; } } break;
        case 'captureShake': for (let i = 0; i < (e.shakes || 1); i++) setTimeout(() => this.callout(String(i + 1) + '...', '', T.text, 0.5), 650 * (i + 1)); if (!e.ok) setTimeout(() => this.callout('IT BROKE FREE!', '', T.red, 1), 650 * ((e.shakes || 1) + 1)); break;
        case 'captured': this.callout('GOTCHA!', 'soul link established', T.green, 1.6, true); this.react(0, 'win', { force: true }); this.flash('#d8ffd0', 0.3, 0.5); break;
        case 'captureImmune': this.callout("CAN'T BE CAUGHT!", '', T.red, 1); break;
        case 'disobey': { const u = U(e.u); if (u) this.pop(this.wpos(u, 0.7), 'ignores you...', T.dim, 1); break; }
        default: break;
      }
    }
  }
  pop(p, str, c, scale = 1, dy = 0, crit = false) { this.pops.push({ p: p.clone(), str, c, scale, t: 0, dy, crit, dx: (Math.random() - 0.5) * 10 }); }
  callout(str, sub, c, dur = 1, big = false) { this.callouts = this.callouts.filter((k) => !big || !k.big); this.callouts.push({ str, sub, c, dur, big, t: 0 }); }
  /** a slanted ribbon that sweeps across the screen: CRITICAL HIT! / SUPER EFFECTIVE! */
  banner(str, c, small = false) { if (this.banners.some((b) => b.str === str && b.t < 0.5)) return; this.banners = this.banners.filter((b) => b.t < b.dur - 0.25); this.banners.push({ str, c, small, t: 0, dur: small ? 0.9 : 1.15 }); }
  // ------------------------------------------------------------------ HUD + controls
  drawUI(ui) {
    if (!this.active || !this.st) return;
    // the intro can be skipped (Space / Enter / a tap)
    if (this.intro && !this.skipIntro && this.t > 0.6 && (ui.key(' ') || ui.key('Enter') || ui.ptr.released)) { this.skipIntro = true; ui.ptr.released = false; for (const W_ of this.waits.splice(0)) W_.r(); }
    this.hudUI.draw(ui);                                        // panels, cards, meters, combo, callouts (battlehud.js)
    if (this.st.paused === 'halftime' && !this.ending) this.arenaChoice(ui, 'HALFTIME');
  }
  arenaChoice(ui, title) {
    const W = ui.w, H = ui.h, bw = 96, gap = 6, x0 = Math.round(W / 2 - (bw * 3 + gap * 2) / 2), y = Math.round(H * 0.5);
    ui.fade(0.45, '#0c0814'); ui.text(title, W >> 1, y - 44, T.amber, { align: 'center', scale: 2, outline: true });
    Object.entries(ARENA_TYPES).forEach(([id, A], i) => { if (ui.button(x0 + i * (bw + gap), y, bw, 22, A.name, { color: T.amber, hotkey: String(i + 1) }) && this.st.paused) resumeMatch(this.st, { arena: id }); });
  }
  // ------------------------------------------------------------------ end
  async end() {
    this.ending = true;
    const app = this.app, st = this.st, r = st.result, won = r.winner === 0, fled = r.reason === 'flee', cin = app.cinema;
    this.releaseShot(0.3);
    // the final blow: slow motion and a half-orbit round the last one down
    let last = null; for (const rec of this.units.values()) if (rec.u.state === 'faint' && (!last || (rec.faintT ?? -1) > (last.faintT ?? -1))) last = rec;
    if (last && !fled && r.reason !== 'capture' && this.t - (last.faintT ?? -9) < 1.6) {
      if (cin) { cin.slowmo(0.22, 1200, 500); cin.flash('#ffffff', 0.3, 0.6); }
      this.shake(0.2, 4);
      const h = this.height(last); this.shotOn(last.a, { dist: Math.max(3, h * 3.2), ang: 0.35, pitch: 10, h: h * 0.4, blend: 0.35, orbit: 50, span: 1.6, push: 0.1, prio: 9 });
      await this.sleep(1.5);
    }
    // the winners strike a pose; the trainers celebrate (or don't)
    for (const [, rec] of this.units) if (rec.u.side === r.winner && rec.u.onField && rec.u.state !== 'faint') { this.once(rec, 'win', 9); this.vfx.burst('twinkle', this.wpos(rec.u, 0.8), { n: 10, speed: 1.5 }); }
    if (!fled) {
      this.react(r.winner, 'win', { force: true, hold: Infinity });
      this.react(r.winner === 0 ? 1 : 0, Math.random() < 0.5 ? 'lose' : 'sore', { force: true, hold: Infinity });
      this.crowd(won ? 'cheer' : 'gasp');
    }
    app.audio.stinger && app.audio.stinger(won ? 'victory' : 'defeat');
    this.callout(won ? 'VICTORY!' : fled ? 'GOT AWAY' : r.reason === 'capture' ? 'CAUGHT!' : 'DEFEAT!', won ? '' : fled ? '' : 'your team needs rest', won ? T.amber : '#9fb3ff', 2.6, true);
    // the orbit: round your partner and you when you win, round the victor when you lose
    const hero = this.trainers.find((tr) => tr.T.isPlayer), winU = [...this.units.values()].find((rec) => rec.u.side === r.winner && rec.u.onField && rec.u.state !== 'faint');
    if (!fled) {
      const focus = won && hero && winU ? null : winU ? winU.a : null;
      if (focus || (won && hero && winU)) {
        const P = () => { if (focus) return focus.g.position.clone(); const a = hero.a.g.position, b = winU.a.g.position; return a.clone().lerp(b, 0.5); };
        const h = winU ? this.height(winU) : 0.8, d0 = won && hero ? Math.max(4.2, Math.hypot(hero.a.g.position.x - winU.a.g.position.x, hero.a.g.position.z - winU.a.g.position.z) * 1.4 + 2) : Math.max(4.4, h * 3.8);
        const p0 = P(), yaw0 = this.clearView({ target: new V3(p0.x, p0.y + Math.max(0.6, h * 0.55), p0.z), dist: d0, yaw: this.camCfg.yaw + (won ? -40 : 30), pitch: 11 }).yaw;
        this.shotTo((t) => { const p = P(); return { target: new V3(p.x, p.y + Math.max(0.6, h * 0.55), p.z), dist: d0 * (1 - 0.06 * Math.min(1, t / 3)), yaw: yaw0 + t * 14 * (won ? 1 : -1), pitch: 9 + Math.min(1, t / 3) * 4, fov: 30 }; }, { blend: 0.8, prio: 9 });
      }
    }
    if (cin) cin.barsTo = 1;
    await this.sleep(2.6);
    for (const l of this.rewards(r)) app.ui.toast(l, { icon: 'star', dur: 3 });
    await this.sleep(0.9);
    await app.fade(1, 400);
    if (cin) cin.barsTo = this.cin0 || 0;
    this.cleanup();
    if (app.feel && app.feel.afterBattle) app.feel.afterBattle({ won, fled, reason: r.reason });
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
    const w = this.app.world, cin = this.app.cinema;
    for (const [id] of this.units) w.remove('bu-' + id);
    for (const a of this.hidden || []) a.g.visible = true;
    // the trainers and the onlookers go back to where (and how) they were
    for (const tr of this.trainers || []) {
      if (tr.temp) { w.remove(tr.a.id); continue; }
      const s = tr.saved, a = tr.a; a.path = null;
      a.place(s.x, s.z, s.yaw); a.g.position.y = s.y; a.g.visible = s.vis; a.look = s.look || null; a.idleClip = s.idle || 'idle';
      a.play(s.clip && a.anim.clips[s.clip] ? s.clip : 'idle', { fade: 0 });
    }
    for (const wa of this.watchers || []) { wa.a.look = wa.look || null; if (!wa.seated) { wa.a.yaw = wa.a.targetYaw = wa.yaw; wa.a.g.rotation.y = wa.yaw; } wa.a.play(wa.clip && wa.a.anim.clips[wa.clip] ? wa.clip : 'idle', { fade: 0.2 }); }
    if (w.bubbles) w.bubbles = w.bubbles.filter((b) => !String(b.a.id).startsWith('bu-'));
    if (this.grp) this.app.stage.scene.remove(this.grp);
    if (this.wreck) { try { this.wreck.restore(); } catch (e) { console.warn('[battle] restore', e); } this.wreck = null; }   // every broken prop back, no debris, no cracks
    if (this.vfx) this.vfx.clear();
    w.setCam(this.prevCam);
    if (cin) { cin.dutch(0); cin.barsTo = this.cin0 || 0; }
    this.active = false; this.st = null; this.units = new Map(); this.trainers = []; this.watchers = []; this.waits = [];
    if (w.city && w.player) w.city.placed();
    if (this.app.world && this.app.world.locAudio) this.app.world.locAudio();   // back to the place's own music
  }
}
