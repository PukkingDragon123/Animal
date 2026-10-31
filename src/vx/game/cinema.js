// The cinematic director. Story scripts ask it for shots, and it frames them like a JRPG cutscene:
// letterbox bars that slide in and out, a camera rig with a shot grammar (establishing crane, slow dolly,
// two-shot, over-the-shoulder, low-angle hero, orbit, snap push-in, tracking, inserts), lens work on top
// (handheld micro-shake, impulse shake, dutch roll, a field-of-view punch), HD-2D focus pulls and grades
// (src/px/hd2d.js options only), fades, veils and flashes, hit-stop and slow motion, title / location /
// character cards, set dressing (a sunbeam through a window, a storm sky) and hold-to-skip.
//
// The camera: the rig never fights the follow camera. It drives the world camera through the world's own
// director tween (world.tween): while it holds a shot it keeps an endless tween installed whose `from` view
// it rewrites every frame, so anything that yields to world.tween (the city follow camera) stays out of the
// way. A tween someone else starts (world.shot, world.followCam) runs untouched; the rig picks up from where
// it ends. release() drops the tween and hands the camera back through world.followCam.
//
// Skipping: hold Esc (or Backspace, or the SKIP chip on touch screens) during a cutscene. The script keeps
// running — every line, flag, quest step and toast happens in order — only faster: lines close at once,
// moves cut, waits shrink, walks arrive, the screen stays black. It stops at the next thing the player
// must do (a choice, a name entry, a battle, walking somewhere) or when the cutscene ends.
//
//   const cin = app.cinema;
//   await cin.begin({ prefer: 200 });                       // bars in; the camera side to prefer (yaw, degrees)
//   await cin.establish([149, 1, 111], { from: { dist: 70, pitch: 60 }, to: { dist: 16, pitch: 22 } });
//   cin.place('Market Street', 'Cable-car stop');
//   await cin.talk(spike, lau, 'Spike', 'Pay up.');           // an over-the-shoulder on the speaker, then the line
//   await cin.push(hero); cin.shake(0.25); await cin.hitStop(160); cin.flash('#ffffff', 0.3);
//   await cin.end();                                         // bars out, grade back, camera eases to the player
import * as THREE from '../../../vendor/three.module.js';
import { E } from '../anim.js';
import { POST } from '../render/look.js';
import { T } from '../../px/game/ui.js';
import { mx, clamp01, easeOut } from '../../px/game/uikit/theme.js';
import { gem, sparkle, blendRect } from '../../px/game/uikit/frame.js';

const V3 = THREE.Vector3, D2R = Math.PI / 180;
const _v = new V3(), _a = new V3(), _b = new V3(), _ndc = new V3();
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const sine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const angDiff = (a, b) => Math.abs(((((a - b + 180) % 360) + 360) % 360) - 180);

// ---------------------------------------------------------------- views (the world camera's own terms)
// a view: { target: Vector3, dist (m), yaw (deg; 0 = camera south of the target, 90 = east), pitch (deg, up) }
export function view(target, dist, yaw, pitch) { return { target: target.isVector3 ? target.clone() : new V3(...target), dist, yaw, pitch }; }
export function camPos(v, out = new V3()) {
  const yr = v.yaw * D2R, pr = v.pitch * D2R;
  return out.set(v.target.x + Math.sin(yr) * Math.cos(pr) * v.dist, v.target.y + Math.sin(pr) * v.dist, v.target.z + Math.cos(yr) * Math.cos(pr) * v.dist);
}
/** the view of a camera standing at pos and looking at at */
export function lookFrom(pos, at) {
  const d = _v.subVectors(pos, at), L = Math.max(0.05, d.length());
  return { target: at.clone(), dist: L, yaw: Math.atan2(d.x, d.z) / D2R, pitch: Math.asin(clampN(d.y / L, -1, 1)) / D2R };
}
const cloneV = (v) => ({ target: v.target.clone(), dist: v.dist, yaw: v.yaw, pitch: v.pitch });
// target and pitch linear, distance in log space (cranes swoop), yaw the short way round
function lerpV(a, b, k, out) {
  out.target.lerpVectors(a.target, b.target, k);
  out.dist = Math.exp(Math.log(Math.max(0.05, a.dist)) + (Math.log(Math.max(0.05, b.dist)) - Math.log(Math.max(0.05, a.dist))) * k);
  let dy = b.yaw - a.yaw; dy = ((((dy + 180) % 360) + 360) % 360) - 180;
  out.yaw = a.yaw + dy * k; out.pitch = a.pitch + (b.pitch - a.pitch) * k;
  return out;
}
const catmull = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

// ---------------------------------------------------------------- grades (HD-2D pass options layered over the mood)
export const GRADES = {
  warm: { warm: 0.8, rays: 0.24, rayCol: [1.0, 0.82, 0.55], bloom: 0.6, wide: 0.7, sat: 1.15, lift: 0.024, vig: 0.5 },
  morning: { warm: 0.7, rays: 0.3, rayDir: [1, 0.9], rayCol: [1.0, 0.86, 0.6], bloom: 0.7, threshold: 0.72, wide: 0.75, sat: 1.1, lift: 0.03, vig: 0.55 },
  tense: { sat: 0.94, contrast: 1.14, vig: 0.66, warm: 0.15, rays: 0, lift: 0.006 },
  hero: { bloom: 0.62, wide: 0.7, warm: 0.6, sat: 1.2, vig: 0.48, rays: 0.16 },
  storm: { sat: 0.7, contrast: 1.16, warm: 0.0, rays: 0, vig: 0.8, night: 0.24, bloom: 0.7, threshold: 0.66, wide: 0.6, shadowTint: [0.8, 0.86, 1.12], highTint: [0.96, 1.0, 1.06], lift: 0.02 },
  dusk: { warm: 0.5, sat: 1.08, vig: 0.55, rays: 0.12, rayCol: [1.0, 0.7, 0.5], bloom: 0.65 },
};
const POST_KEYS = ['focus', 'band', 'dof', 'bloom', 'threshold', 'wide', 'rays', 'rayDir', 'rayCol', 'vig', 'warm', 'night', 'sat', 'contrast', 'shadowTint', 'highTint', 'lift'];
const copyOpts = (o) => { const r = {}; for (const k of POST_KEYS) if (o[k] !== undefined) r[k] = Array.isArray(o[k]) ? o[k].slice() : o[k]; return r; };

export class Cinema {
  constructor(app) {
    this.app = app;
    this.active = false; this.driving = false; this.hold = null; this.shot = null; this.cur = view([0, 0, 0], 20, 45, 30);
    this.bars = 0; this.barsTo = 0; this.prefer = 45; this.room = null; this.time = 0; this.frame = 0;
    this.fx = null; this.gradeWant = {}; this.base = null; this.pp = false; this.baseSc = null;
    this.sh = { amp: 0, t: 0, decay: 5 }; this.hh = 0; this.roll = 0; this.rollTo = 0; this.fovTo = null; this.fovBase = null; this.fovK = 0; this.fovSet = false;
    this.ts = null; this.cards = []; this.flashes = []; this.veil = { a: 0, to: 0, color: '#fff4dc', speed: 2, done: null };
    this.skipping = false; this.skipHold = 0; this.cover = 0; this.chip = null;
    this.looked = new Set(); this.axis = new Map(); this.lastSpeaker = null; this.dressing = [];
    this.debug = !!(app.params && app.params.get('cine'));
    this.k = app.auto ? (this.debug ? 0.6 : 0.3) : 1;             // dev auto-play runs the reel faster
    this.beatN = 0; this.beatName = ''; this.beatReady = 0;
    if (app.stage && app.stage.hooks) app.stage.hooks.push((st) => this.lens(st));
  }
  get w() { return this.app.world; }
  get st() { return this.app.stage; }
  dur(s) { return this.skipping ? 0 : s * this.k; }
  wait(ms) { return this.skipping ? Promise.resolve() : this.app.wait(ms * this.k); }

  // ================================================================ the cutscene
  /** bars in, the camera taken: o.prefer (deg) — the side shots favour; o.room [x0, z0, x1, z1] — keep the camera inside (interiors) */
  begin(o = {}) {
    if (!this.active) { this.active = true; this.lastSpeaker = null; this.axis.clear(); }
    this.barsTo = o.bars === false ? 0 : 1;
    this.set(o);
    this.take();
    return o.wait ? this.app.wait(450 * this.k) : Promise.resolve();
  }
  set(o = {}) { if (o.prefer !== undefined) this.prefer = o.prefer; if ('room' in o) this.room = o.room; return this; }
  /** bars out, grade and lens back to normal, the camera eased back to the player (o.release === false keeps it where it is) */
  async end(o = {}) {
    const w = this.w;
    if (this.skipping) this.stopSkip();
    this.active = false; this.barsTo = 0; this.hh = 0; this.rollTo = 0; this.fovTo = null; this.fx = null; this.room = null;
    if (!o.keepGrade) this.gradeWant = {};
    for (const a of this.looked) a.look = null; this.looked.clear();
    this.letGo();
    // hand the camera back through the world: its follow camera blends in from wherever this shot left it
    if (o.release !== false && w && w.player && w.followCam) { const p = w.followCam(this.skipping ? 0 : o.dur ?? 1.1); if (o.wait) await p; }
  }
  /** take the camera from wherever it is now (no move) */
  take() {
    const w = this.w; if (!w || !w.cam) return;
    if (!this.driving) { this.driving = true; this.sync(); this.fovBase = typeof w.cam.fov === 'number' ? w.cam.fov : this.st.baseFov || this.st.cam.fov; }
    if (!this.pp) { this.pp = true; this.base = null; }
  }
  /** let the camera go (the world / follow camera own it again) */
  letGo() {
    const w = this.w;
    if (this.shot && !this.shot.landed) { this.shot.landed = true; this.shot.resolve(); }
    this.shot = null; this.driving = false;
    if (w && w.tween === this.hold) w.tween = null;
    this.hold = null;
  }
  sync() { const c = this.w.cam; this.cur = { target: c.target.clone(), dist: c.dist, yaw: c.yaw, pitch: c.pitch }; }

  // ================================================================ subjects
  /** a live point to frame: an actor (its face; at: 'chest' | 'waist' | 'feet' | 'top' | metres), [x, y, z], a Vector3 or a function */
  pt(s, at = 'face') {
    if (typeof s === 'function') return s;
    if (s && s.isVector3) { const v = s.clone(); return () => v.clone(); }
    if (Array.isArray(s)) { const v = new V3(s[0], s[1] ?? 0, s[2] ?? 0); return () => v.clone(); }
    if (s && s.g && s.m) { const h = typeof at === 'number' ? at : this.height(s, at); return () => new V3(s.g.position.x, s.g.position.y + h, s.g.position.z); }
    const c = this.cur.target.clone(); return () => c.clone();
  }
  height(a, at = 'face') {
    let face = NaN;
    try { a.g.updateWorldMatrix(true, true); face = a.headPos(_a).y - a.g.position.y - (a.kind === 'mon' ? 0.22 : 0.24); } catch (e) { /* not posed yet */ }
    if (!(face > 0.2 && face < 14)) face = a.kind === 'mon' ? 0.55 : 1.5;
    // just sat down: the hips are still on their way onto the seat
    const an = a.anim; if (an && an.c && an.c.sit && (an.sitK ?? 1) < 0.9) face -= 0.47 * (1 - (an.sitK ?? 1));
    return at === 'chest' ? face * 0.78 : at === 'waist' ? face * 0.62 : at === 'feet' ? 0.15 : at === 'top' ? face + 0.3 : face;
  }
  /** how tall an actor stands (m) — close-ups of a big Tokonmon step back */
  size(a) {
    if (a._cinH) return a._cinH;
    let h = a.kind === 'mon' ? 0.8 : 1.7;
    try { const b = new THREE.Box3().setFromObject(a.g); if (b.max.y > b.min.y) h = b.max.y - b.min.y; } catch (e) { /* keep the guess */ }
    return (a._cinH = clampN(h, 0.3, 12));
  }
  facing(a) { return ((a.targetYaw ?? a.yaw ?? 0) / D2R); }
  pos(a) { return a.g ? a.g.position : a; }
  // the side of the line between two subjects the camera stays on (the 180° rule): the one nearer the preferred side
  side(a, b) {
    const key = [a && a.id, b && b.id].sort().join('|'), p = this.pos(a), q = this.pos(b);
    let n = this.axis.get(key);
    if (!n) {
      const dx = q.x - p.x, dz = q.z - p.z, L = Math.hypot(dx, dz) || 1, py = this.prefer * D2R;
      n = new V3(dz / L, 0, -dx / L); if (n.x * Math.sin(py) + n.z * Math.cos(py) < 0) n.negate();
      this.axis.set(key, n);
    }
    return n;
  }

  // ================================================================ moves
  /** move to a view (or a function of time → view) over o.dur seconds (0 = a cut). Resolves when it lands; the
   *  view keeps being evaluated afterwards, so a function view keeps living (a dolly, an orbit, a track). */
  move(v, o = {}) {
    const to = typeof v === 'function' ? v : () => v, dur = this.dur(o.dur ?? 1);
    this.take();
    if (this.shot && !this.shot.landed) { this.shot.landed = true; this.shot.resolve(); }
    const w = this.w; if (w.tween && w.tween !== this.hold && w.tween.done) { const d = w.tween.done; w.tween = null; d(); }
    if (!this.hold || w.tween !== this.hold) this.sync();
    return new Promise((resolve) => {
      const s = this.shot = { from: cloneV(this.cur), to, dur, ease: o.ease || E.inout, t: 0, landed: false, resolve, name: o.name || '' };
      if (dur <= 0) { const v0 = to(0); this.cur = cloneV(v0); this.write(this.cur); s.landed = true; resolve(); }
    });
  }
  cut(v, o = {}) { return this.move(v, Object.assign({}, o, { dur: 0 })); }
  /** the generic framing: subject (actor / point), o: { dist, yaw (abs) | rel (to the actor's facing), pitch, at, off: [x, y, z],
   *  dur (transition, 0 = cut), push (fraction of the distance closed while it holds), orbit (deg while it holds), rise (deg),
   *  hold (s the drift spans), focus (false | 'wide' | band), safe (false skips the occlusion check), room } */
  frame(subject, o = {}) {
    const P = this.pt(subject, o.at), isA = subject && subject.g;
    const yaw = o.yaw ?? (isA && o.rel !== undefined ? this.facing(subject) + o.rel : this.prefer);
    const off = o.off ? new V3(...o.off) : null;
    const p0 = P(); if (off) p0.add(off);
    const v0 = this.safe(view(p0, o.dist ?? 4, yaw, o.pitch ?? 10), o);
    const hold = Math.max(0.5, o.hold ?? 9), push = o.push ?? 0.05, orb = o.orbit ?? 0, rise = o.rise ?? 0, lift = o.lift ?? 0, dur = o.dur ?? 0.9;
    const to = (t) => {
      const p = P(); if (off) p.add(off);
      const u = clamp01(t / (dur * this.k + hold)), e = o.lin ? u : sine(u);
      p.y += lift * e;
      return { target: p, dist: v0.dist * (1 - push * e), yaw: v0.yaw + orb * e, pitch: v0.pitch + rise * e };
    };
    if (o.focus !== false) this.focus(o.focus === 'wide' ? null : subject, { band: typeof o.focus === 'number' ? o.focus : o.band, dof: o.dof, at: o.at });
    return this.move(to, { dur, ease: o.ease || (dur > 0 && dur < 0.5 ? E.out3 : E.inout) });
  }

  // ---------------------------------------------------------------- the shot grammar
  /** establishing crane: cut to a high, wide view of a place and swoop down onto it. o.from / o.to: { dist, yaw, pitch, at: [x, y, z] } */
  async establish(at, o = {}) {
    const P = Array.isArray(at) ? new V3(...at) : this.pt(at, o.at)();
    const f = Object.assign({ dist: 70, yaw: this.prefer - 30, pitch: 58 }, o.from || {}), t = Object.assign({ dist: 18, yaw: this.prefer, pitch: 24 }, o.to || {});
    const A = f.at ? new V3(...f.at) : P, B = t.at ? new V3(...t.at) : P;
    await this.cut(view(A, f.dist, f.yaw, f.pitch));
    this.focus(null, { band: o.band ?? 0.22, dof: o.dof ?? 0.8 });
    const end = this.safe(view(B, t.dist, t.yaw, t.pitch), { solid: o.solid });
    const drift = o.drift ?? 6, hold = o.hold ?? 8;
    return this.move((s) => { const u = clamp01((s - (o.dur ?? 5) * this.k) / hold); return { target: end.target.clone(), dist: end.dist * (1 - 0.04 * sine(u)), yaw: end.yaw + drift * sine(u), pitch: end.pitch }; }, { dur: o.dur ?? 5, ease: E.inout3 });
  }
  /** a slow dolly-in: from o.from metres to o.to metres over o.hold seconds (eases in over o.dur first) */
  dolly(subject, o = {}) {
    const d0 = o.from ?? 6, d1 = o.to ?? 4;
    return this.frame(subject, Object.assign({ dist: d0, push: 1 - d1 / d0, hold: o.hold ?? 7, pitch: 12, dur: 1.2 }, o, { dist: d0 }));
  }
  /** two people in one frame, side on, the camera on the friendly side of the line between them */
  two(a, b, o = {}) {
    const Pa = this.pt(a, o.at), Pb = this.pt(b, o.at), A = Pa(), B = Pb(), sep = Math.hypot(A.x - B.x, A.z - B.z), dy = o.dy ?? -0.12;
    const n = this.side(a, b), yaw = Math.atan2(n.x, n.z) / D2R + (o.angle ?? 18) * (o.flip ? -1 : 1);
    const dist = o.dist ?? clampN((sep / 2 + 0.85) / 0.45, 3.2, 16);
    const mid = () => { const p = Pa().add(Pb()).multiplyScalar(0.5); p.y += dy; return p; };
    return this.frame(mid, Object.assign({ dist, yaw, pitch: 8, push: 0.04, band: 0.2, dof: 0.82 }, o, { off: null, at: undefined }));
  }
  /** over the listener's shoulder onto the speaker (falls back to a close single when there's no room behind the listener) */
  ots(sp, li, o = {}) {
    if (!li || li === sp) return this.close(sp, o);
    const S = this.pt(sp)(), L = this.pt(li)(), n = this.side(sp, li);
    const ax = _a.set(L.x - S.x, 0, L.z - S.z); const d = ax.length() || 1; ax.multiplyScalar(1 / d);
    const back = o.back ?? 1.0, sd = o.side ?? 0.5, rise = o.rise ?? 0.1;
    const cam = L.clone().addScaledVector(ax, back).addScaledVector(n, sd); cam.y += rise;
    const at = S.clone().addScaledVector(n, -(o.lead ?? 0.22));
    let v = lookFrom(cam, at);
    const room = o.room || this.room;
    if (room && !inRoom(cam, room)) {   // no room behind the listener: a single on the speaker from the listener's side
      const f = _b.copy(ax).addScaledVector(n, 0.5).normalize();
      return this.close(sp, Object.assign({ yaw: Math.atan2(f.x, f.z) / D2R }, o));
    }
    v = this.safe(v, Object.assign({}, o, { tries: [0, 8, -8, 16, -16] }));
    const Ps = this.pt(sp), off = at.clone().sub(S);
    return this.frame(() => Ps().add(off), Object.assign({ dist: v.dist, yaw: v.yaw, pitch: v.pitch, dur: 0, push: 0.05, safe: false, band: 0.13, dof: 0.95 }, o));
  }
  // the yaw beside an actor's facing (± angle) nearer the preferred side
  aside(s, angle) { const f = this.facing(s); return angDiff(f + angle, this.prefer) <= angDiff(f - angle, this.prefer) ? f + angle : f - angle; }
  /** a close single on a face (persons) or a whole small Tokonmon */
  close(s, o = {}) {
    const mon = s.kind === 'mon', h = mon ? this.size(s) : 1.7;
    const yaw = o.yaw ?? this.aside(s, o.angle ?? 22);
    return this.frame(s, Object.assign({ dist: mon ? clampN(h * 2.4, 1.6, 30) : 2.3, yaw, pitch: 5, dur: 0, push: 0.06, band: 0.12, dof: 0.95, at: mon ? 'chest' : 'face' }, o));
  }
  /** low angle, looking up: the hero shot */
  hero(s, o = {}) {
    const mon = s.kind === 'mon', h = mon ? this.size(s) : 1.7;
    const yaw = o.yaw ?? this.aside(s, o.angle ?? 28);
    return this.frame(s, Object.assign({ dist: mon ? clampN(h * 3, 2.2, 40) : 3.3, yaw, pitch: o.low ?? -11, dur: 0.8, push: 0.08, rise: 2, band: 0.16, dof: 0.9, at: mon ? 'chest' : 'face' }, o));
  }
  /** circle a subject: o.deg over o.time seconds (an orbit reveal) */
  orbit(s, o = {}) {
    const mon = s.kind === 'mon', h = s.g ? this.size(s) : 2;
    return this.frame(s, Object.assign({ dist: clampN(h * 3.2, 3, 60), pitch: 8, orbit: o.deg ?? 70, hold: o.time ?? 7, push: 0.1, dur: 0.8, lin: false, safe: false, band: 0.2, dof: 0.85, at: mon ? 'chest' : 'face' }, o));
  }
  /** a snap push-in for a surprise: quick and close, a jolt of shake and a whoosh */
  push(s, o = {}) {
    const mon = s.kind === 'mon', h = mon ? this.size(s) : 1.7;
    this.shake(o.shake ?? 0.12, 4);
    if (!this.skipping && o.sfx !== false && this.app.audio.sfx) this.app.audio.sfx('whoosh', { vol: 0.7, pitch: 1.3 });
    if (o.punch !== false) this.punch(o.punch ?? 6);
    return this.frame(s, Object.assign({ dist: mon ? clampN(h * 2.2, 1.4, 30) : 1.9, yaw: this.aside(s, 14), pitch: 4, dur: 0.28, push: 0.04, band: 0.11, dof: 1, at: mon ? 'chest' : 'face' }, o));
  }
  /** follow a moving subject at a fixed angle */
  track(s, o = {}) { return this.frame(s, Object.assign({ dist: 6, pitch: 12, dur: 0.7, push: 0, hold: 30, band: 0.18, at: 'chest' }, o)); }
  /** a slow sweep over a list of views (the title flyover), looping until another move replaces it */
  flyover(views, o = {}) {
    const V = views.map((v) => ({ t: new V3(...v.target), dist: v.dist, yaw: v.yaw, pitch: v.pitch })), n = V.length, seg = o.seg ?? 12;
    for (let i = 1; i < n; i++) { let dy = V[i].yaw - V[i - 1].yaw; while (dy > 180) dy -= 360; while (dy < -180) dy += 360; V[i].yaw = V[i - 1].yaw + dy; }
    const turn = V[n - 1].yaw - V[0].yaw + (((V[0].yaw - V[n - 1].yaw + 540) % 360) - 180);
    const at = (i) => { const k = ((i % n) + n) % n, lap = Math.floor(i / n); return { ...V[k], yaw: V[k].yaw + lap * turn }; };
    const fn = (t) => {
      const u = t / seg, i = Math.floor(u), f = u - i, a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2), C = (k) => catmull(a[k], b[k], c[k], d[k], f);
      return { target: new V3(catmull(a.t.x, b.t.x, c.t.x, d.t.x, f), catmull(a.t.y, b.t.y, c.t.y, d.t.y, f), catmull(a.t.z, b.t.z, c.t.z, d.t.z, f)), dist: C('dist'), yaw: C('yaw'), pitch: C('pitch') };
    };
    this.focus(null, { band: 0.24, dof: 0.75 });
    return this.move(fn, { dur: o.dur ?? 0 });
  }

  // ---------------------------------------------------------------- occlusion: keep walls and buildings out of the shot
  safe(v, o = {}) {
    if (o.safe === false) return v;
    let out = cloneV(v);
    const room = o.room || this.room;
    if (room) out = clampRoom(out, room);
    const w = this.w, city = w && w.sc && w.sc.city;
    if (city && city.buildings && o.solid !== false && !room) {
      const tries = o.tries || [0, 12, -12, 24, -24, 38, -38, 55, -55];
      let ok = null;
      for (const dy of tries) { const t = Object.assign(cloneV(out), { yaw: out.yaw + dy }); if (!this.blocked(t)) { ok = t; break; } }
      if (!ok) { const hit = this.blocked(out); ok = out; if (hit) ok.dist = Math.max(1.2, out.dist * hit - 0.6); }
      out = ok;
    }
    return this.clearGround(out);
  }
  /** the fraction along target → camera where a building box is hit first (0 = clear) */
  blocked(v) {
    const w = this.w, city = w.sc && w.sc.city; if (!city || !city.buildings) return 0;
    const A = v.target, C = camPos(v, _b), nav = w.nav;
    let skip = -1, skip2 = -1;
    if (nav && nav.buildingAt) { skip = nav.buildingAt(A.x, A.z, nav.levelAt ? nav.levelAt(A.x, A.z, A.y - 1.4) : 0); const p = w.player && w.player.g.position; if (p) skip2 = nav.buildingAt(p.x, p.z, w.city ? w.city.L : 0); }
    let best = 0;
    for (const B of city.buildings) {
      if (B.id === skip || B.id === skip2 || (B.fade ?? 1) < 0.5) continue;
      const top = B.H + (B.o && B.o.roof && B.o.roof.type !== 'flat' ? (B.o.roof.h || 2) : 0.6), s = 0.12;
      const t = segBox(A, C, B.x + s, 0, B.z + s, B.x + B.w - s, top, B.z + B.d - s);
      if (t > 0 && (!best || t < best)) best = t;
    }
    return best;
  }
  clearGround(v) {
    const w = this.w, c = camPos(v, _a); let g = 0;
    try { g = w.ground(c.x, c.z, v.target.y - 1.2); } catch (e) { g = 0; }
    if (c.y < g + 0.3) { const s = clampN((g + 0.3 - v.target.y) / v.dist, -0.99, 0.99); v.pitch = Math.asin(s) / D2R; }
    return v;
  }

  // ================================================================ lens & grade
  /** where the HD-2D focus band sits: on a subject (a focus pull), or null for a wide tilt-shift */
  focus(s, o = {}) {
    if (s && (s.g || Array.isArray(s) || s.isVector3 || typeof s === 'function')) this.fx = { pt: this.pt(s, o.at || 'face'), band: o.band ?? 0.13, dof: o.dof ?? 0.95 };
    else this.fx = { pt: null, y: o.y ?? 0.5, band: o.band ?? 0.27, dof: o.dof ?? 0.68 };
    return this;
  }
  /** a grade preset name (GRADES) or options for the HD-2D pass; null goes back to the mood's own */
  grade(g, o = {}) { this.gradeWant = g ? Object.assign({}, typeof g === 'string' ? GRADES[g] : g) : {}; this.gradeRate = o.rate ?? 1.6; this.pp = true; return this; }
  /** an impulse of shake (amp ≈ metres of jolt; decays at decay /s) */
  shake(amp = 0.15, decay = 5) { if (this.skipping) return this; this.sh = { amp: Math.max(amp, this.sh.amp * Math.exp(-this.sh.t * this.sh.decay)), t: 0, decay }; return this; }
  /** a constant handheld micro-shake while the cutscene lasts (0 turns it off) */
  handheld(amp = 0.02) { this.hh = amp; return this; }
  dutch(deg = 0) { this.rollTo = deg; return this; }
  lensFov(deg = null) { this.fovTo = deg; return this; }
  punch(deg = 6) { if (this.skipping) return this; this.fovKick = deg; return this; }
  /** a full-screen flash (white for a hit, warm for a memory) fading over dur seconds */
  flash(color = '#ffffff', dur = 0.35, a = 1) { if (!this.skipping) this.flashes.push({ color, dur, t: 0, a }); return this; }
  /** fade to / from a colour (white, warm light, black…): to 1 covers the screen */
  veilTo(to, ms = 600, color) {
    if (color) this.veil.color = color;
    if (this.skipping || ms <= 0) { this.veil.a = this.veil.to = to; return Promise.resolve(); }
    this.veil.to = to; this.veil.speed = 1000 / Math.max(30, ms * this.k);
    return new Promise((r) => { this.veil.done = r; });
  }
  fadeOut(ms = 500) { return this.app.fade(1, ms * this.k); }
  fadeIn(ms = 700) { return this.app.fade(0, ms * this.k); }
  /** freeze the world for a beat (scale ≈ 0), then let it run again */
  hitStop(ms = 140, o = {}) { if (this.skipping) return Promise.resolve(); this.ts = { scale: o.scale ?? 0.03, t0: now(), hold: ms * this.k, back: (o.back ?? 220) * this.k }; return sleep(ms * this.k); }
  /** slow motion: scale for ms, then back to normal over back ms */
  slowmo(scale = 0.35, ms = 900, back = 450) { if (this.skipping) return Promise.resolve(); this.ts = { scale, t0: now(), hold: ms * this.k, back: back * this.k }; return sleep(ms * this.k); }
  timeScale() {
    const s = this.ts; if (!s || this.skipping) { this.ts = null; return 1; }
    const e = now() - s.t0;
    if (e < s.hold) return s.scale;
    if (e < s.hold + s.back) return s.scale + (1 - s.scale) * sine((e - s.hold) / s.back);
    this.ts = null; return 1;
  }

  // ================================================================ cards
  /** a chapter title card, centred ("DAY 1" / "San Francisco"): resolves after it has been read (o.hold ms) */
  title(text, sub, o = {}) { return this.card({ kind: 'title', text, sub, dur: (o.hold ?? 3200) / 1000, ...o }); }
  /** a location card, top left ("Market Street" / "Cable-car stop · 12:40") */
  place(text, sub, o = {}) { return this.card({ kind: 'place', text, sub, dur: (o.hold ?? 3600) / 1000, ...o }); }
  /** a character's introduction ("YUMI" / "Tokon bond researcher") on o.side ('left' | 'right') */
  nameCard(text, sub, o = {}) { return this.card({ kind: 'name', text, sub, dur: (o.hold ?? 3000) / 1000, side: o.side || 'right', ...o }); }
  card(c) {
    if (this.skipping) return Promise.resolve();
    c.t = 0; c.dur *= this.k > 0.5 ? 1 : 0.5; this.cards = this.cards.filter((x) => x.kind !== c.kind); this.cards.push(c);
    if (c.sfx !== false && this.app.audio.sfx) this.app.audio.sfx(c.kind === 'title' ? 'gong' : 'whoosh', { vol: c.kind === 'title' ? 0.5 : 0.45, pitch: c.kind === 'name' ? 1.2 : 0.9 });
    return c.wait === false ? Promise.resolve() : new Promise((r) => { c.done = r; });
  }

  // ================================================================ dialogue
  /** a line (or lines) with the camera over the listener's shoulder onto the speaker. Last argument may be
   *  options: { shot: 'ots' | 'close' | 'hero' | 'two' | 'keep', clip, face (expression), hold, back, side… } */
  async talk(sp, li, name, ...lines) {
    let o = {}; if (lines.length && typeof lines[lines.length - 1] === 'object') o = lines.pop();
    const app = this.app;
    if (sp && li && sp !== li) { sp.look = li; li.look = sp; this.looked.add(sp); this.looked.add(li); }
    const kind = o.shot || (li && li !== sp ? 'ots' : 'close');
    if (sp && kind !== 'keep' && (sp !== this.lastSpeaker || o.shot)) {
      if (kind === 'ots') await this.ots(sp, li, o); else if (kind === 'hero') await this.hero(sp, o); else if (kind === 'two') await this.two(sp, li, o); else await this.close(sp, o);
    }
    this.lastSpeaker = sp;
    let talked = false;
    if (sp && sp.kind === 'person') {
      if (o.clip) sp.play(o.clip, { restart: true });
      else if (sp.anim && (sp.anim.cur === 'idle' || sp.anim.cur === 'talk')) { sp.play('talk', { restart: true }); talked = true; }
      if (o.face && sp.anim && sp.anim.face) sp.anim.face(o.face, o.faceHold || 3);
    } else if (sp && o.clip) sp.play(o.clip, { restart: true });
    await app.say(name, ...lines);
    if (talked && sp.anim && sp.anim.cur === 'talk') sp.play('idle', { fade: 0.3 });
  }
  /** a person walks along the nav grid to (x, z); when skipping they're simply there */
  walk(a, x, z, o = {}) {
    const w = this.w;
    if (this.skipping) { a.path = null; a.place(x, z, Math.atan2(x - a.g.position.x, z - a.g.position.z) || a.yaw, a.g.position.y); a.play(a.idleClip || 'idle'); return Promise.resolve(); }
    const p = a.g.position, path = w.nav && w.nav.path ? w.nav.path({ x: p.x, y: p.y, z: p.z }, { x, y: p.y, z }) : null;
    return a.walkTo(path && path.length > 1 ? path.slice(1).map((q) => [q[0], q[1]]) : [[x, z]], o);
  }
  finishWalks() {
    const w = this.w; if (!w || !w.actors) return;
    for (const a of w.actors.values()) {
      if (!a.path || !a.path.length || a.life || a === w.partner) continue;
      const [x, z] = a.path[a.path.length - 1]; a.path = null;
      a.g.position.x = x; a.g.position.z = z; a.g.position.y = w.ground(x, z, a.g.position.y);
      a.play(a.idleClip || 'idle', { fade: 0 }); const r = a.arrive; a.arrive = null; if (r) r();
    }
  }

  // ================================================================ skipping
  canSkip() {
    const app = this.app, ui = app.ui;
    return this.active && !this.skipping && !ui.modal && !(ui.dialog && ui.dialog.choices) && !(app.battle && app.battle.active) && !(this.w && this.w.free);
  }
  skip() {
    if (this.skipping) return;
    this.skipping = true; this.cover = Math.max(this.cover, 0.85); this.skipHold = 0;
    if (this.app.log) this.app.log.push('SKIP');
    this.app.audio.sfx && this.app.audio.sfx('ui_confirm');
    this.cards.forEach((c) => c.done && c.done()); this.cards = []; this.flashes = []; this.ts = null;
    if (this.veil.done) { const d = this.veil.done; this.veil.done = null; this.veil.a = this.veil.to; d(); }
    if (this.shot && !this.shot.landed) { this.shot.landed = true; this.cur = cloneV(this.shot.to(this.shot.t)); this.shot.resolve(); }
    this.finishWalks();
    this.closeLine();
  }
  stopSkip() { if (!this.skipping) return; this.skipping = false; if (this.shot) this.cur = cloneV(this.shot.to(this.shot.t)); }
  closeLine() { const ui = this.app.ui; if (ui.dialog && !ui.dialog.choices) ui.closeDialog(null); }
  updateSkip(dt) {
    const app = this.app, ui = app.ui, k = app.keysDown || {};
    if (this.skipping) {
      this.closeLine(); this.finishWalks();
      if (!this.active || ui.modal || (ui.dialog && ui.dialog.choices) || (app.battle && app.battle.active) || (this.w && this.w.free)) this.stopSkip();
      return;
    }
    const held = (k.Escape || k.Backspace || (this.chip && ui.ptr.down && ui.inside(this.chip.x, this.chip.y, this.chip.w, this.chip.h))) && this.canSkip();
    this.skipHold = held ? this.skipHold + dt : Math.max(0, this.skipHold - dt * 3);
    if (this.skipHold >= 0.65) this.skip();
  }

  // ================================================================ beats (for screenshots in dev runs: ?auto=1&cine=1)
  async beat(name) {
    this.beatN++; this.beatName = name; const n = this.beatN;
    if (this.app.log) this.app.log.push('BEAT ' + name);
    if (!this.debug || this.skipping) return;
    const f0 = this.frame; while (this.frame < f0 + 8) await sleep(30);
    this.beatReady = n;
    const t0 = now(); while ((window.__cineAck || 0) < n && now() - t0 < 40000) await sleep(80);
  }

  // ================================================================ set dressing
  /** a shaft of sunlight through a window: from the window centre win [x, y, z] along dir (the light's travel),
   *  w × h the window, len the beam length; dust motes drift in it. Returns { remove() }. */
  sunbeam(win, dir, o = {}) {
    const st = this.st, D = new V3(...dir).normalize(), W = new V3(...win), len = o.len ?? 4, bw = o.w ?? 0.9, col = new THREE.Color(o.color ?? 0xffd49a);
    const G = new THREE.Group();
    const tex = beamTexture(), mat = new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, opacity: o.opacity ?? 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
    const X = new V3().crossVectors(D, new V3(0, 1, 0)); if (X.lengthSq() < 1e-4) X.set(1, 0, 0); X.normalize(); const Z = new V3().crossVectors(X, D).normalize();
    const mk = (ax, nz) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); const B = new THREE.Matrix4().makeBasis(ax, D, nz); m.quaternion.setFromRotationMatrix(B); m.scale.set(bw, len, 1); m.position.copy(W).addScaledVector(D, len / 2); m.renderOrder = 5; m.frustumCulled = false; return m; };
    G.add(mk(X, Z), mk(Z.clone().negate(), X), mk(X.clone().add(Z).normalize(), Z.clone().sub(X).normalize()));
    // the bright patch where it lands
    if (o.floor !== undefined) {
      const t = (o.floor - W.y) / D.y, hit = W.clone().addScaledVector(D, t);
      const pm = new THREE.MeshBasicMaterial({ map: patchTexture(), color: col, transparent: true, opacity: o.patch ?? 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pm); patch.rotation.x = -Math.PI / 2; patch.rotation.z = Math.atan2(-D.z, D.x);
      patch.scale.set(bw * 1.6 / Math.max(0.3, -D.y), bw * 1.25, 1); patch.position.set(hit.x, o.floor + 0.02, hit.z); patch.renderOrder = 4; G.add(patch);
    }
    // dust motes: a few glowing points drifting slowly inside the beam
    const N = o.motes ?? 46, pos = new Float32Array(N * 3), seed = [];
    for (let i = 0; i < N; i++) seed.push([Math.random(), (Math.random() - 0.5) * bw * 0.8, (Math.random() - 0.5) * bw * 0.8, Math.random() * 6.28]);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xfff0d0, size: 0.028, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    pts.frustumCulled = false; G.add(pts);
    st.scene.add(G);
    const hook = (s) => {
      const T0 = s.time;
      for (let i = 0; i < N; i++) { const [u, a, b, ph] = seed[i], uu = (u + T0 * 0.012) % 1, p = _a.copy(W).addScaledVector(D, uu * len).addScaledVector(X, a + Math.sin(T0 * 0.4 + ph) * 0.05).addScaledVector(Z, b + Math.cos(T0 * 0.3 + ph) * 0.05); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y + Math.sin(T0 * 0.5 + ph) * 0.03; pos[i * 3 + 2] = p.z; }
      pg.attributes.position.needsUpdate = true;
      const k = 0.85 + Math.sin(T0 * 0.7) * 0.08 + Math.sin(T0 * 1.9) * 0.04; mat.opacity = (o.opacity ?? 0.32) * k;
    };
    st.hooks.push(hook);
    const h = { group: G, remove: () => { st.scene.remove(G); const i = st.hooks.indexOf(hook); if (i >= 0) st.hooks.splice(i, 1); G.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); this.dressing = this.dressing.filter((x) => x !== h); } };
    this.dressing.push(h);
    return h;
  }
  /** dark clouds rolling in (stage lights + sky + grade) over dur seconds; weather(null) clears back to the mood */
  weather(kind, dur = 1.6) {
    const st = this.st, w = this.w;
    if (!kind) { this.storm = null; if (w && w.mood) st.setMood(w.mood); this.grade(null); return this; }
    const m = st.mood;
    this.storm = { t: 0, dur: Math.max(0.01, this.dur(dur)), sun0: st.sun.intensity, sunC0: st.sun.color.clone(), hemi0: st.hemi.intensity, hemiC0: st.hemi.color.clone(), exp0: st.r.toneMappingExposure, sky: false, m };
    this.grade('storm', { rate: 1.2 });
    return this;
  }
  updateStorm(dt) {
    const S = this.storm; if (!S) return;
    const st = this.st; S.t += dt; const k = sine(S.t / S.dur);
    st.sun.intensity = S.sun0 + (S.sun0 * 0.32 - S.sun0) * k; st.sun.color.copy(S.sunC0).lerp(_c1.set(0x9aa8c8), k);
    st.hemi.intensity = S.hemi0 * (1 - 0.3 * k); st.hemi.color.copy(S.hemiC0).lerp(_c2.set(0x5a6688), k);
    st.r.toneMappingExposure = S.exp0 * (1 - 0.12 * k);
    if (!S.sky && k > 0.5) { S.sky = true; st.scene.background = stormSky(); }
    // a lightning flicker now and then
    S.next = (S.next ?? 1.2) - dt;
    if (S.next <= 0 && S.t > S.dur * 0.6) { S.next = 3.5 + Math.random() * 4; this.lightning(); }
    if (S.bolt > 0) { S.bolt -= dt; st.sun.intensity += S.sun0 * 1.4 * Math.max(0, S.bolt / 0.12); }
  }
  lightning() {
    if (!this.storm || this.skipping) return;
    this.storm.bolt = 0.12; this.flash('#e8eeff', 0.22, 0.55);
    const au = this.app.audio; if (au && au.sfx) setTimeout(() => au.sfx('thud', { vol: 0.9, pitch: 0.45 }), 260);
  }
  clearDressing() { for (const d of this.dressing.slice()) d.remove(); }

  // ================================================================ per frame
  /** called by the app loop before the world updates; returns the (slow-motion / hit-stop scaled) dt for the world */
  tick(dt) {
    this.frame++;
    this.updateSkip(dt);
    const sdt = dt * this.timeScale();
    this.time += sdt;
    this.bars += clampN(this.barsTo - this.bars, -dt * 2.4, dt * 2.4);
    this.cover += clampN((this.skipping ? 1 : 0) - this.cover, -dt * 2.2, dt * 6);
    for (const c of this.cards) { c.t += dt; if (c.t > c.dur && c.done) { const d = c.done; c.done = null; d(); } }
    this.cards = this.cards.filter((c) => c.t < c.dur + 0.05);
    for (const f of this.flashes) f.t += dt; this.flashes = this.flashes.filter((f) => f.t < f.dur);
    const V = this.veil; if (V.a !== V.to) { V.a += clampN(V.to - V.a, -dt * V.speed, dt * V.speed); if (V.a === V.to && V.done) { const d = V.done; V.done = null; d(); } }
    if (this.fovKick) { this.fovK = (this.fovK || 0) + this.fovKick; this.fovKick = 0; }
    this.fovK = (this.fovK || 0) * Math.exp(-dt * 5);
    this.updateStorm(sdt);
    this.rig(sdt);
    return sdt;
  }
  rig(dt) {
    const w = this.w, app = this.app;
    if (!this.driving || !w || !w.ready || (app.battle && app.battle.active)) return;
    if (w.tween && w.tween !== this.hold) { this.sync(); return; }                 // someone else's move: let it run
    const s = this.shot;
    if (s) {
      s.t += dt;
      const to = s.to(s.t), k = s.dur > 0 ? s.ease(Math.min(1, s.t / s.dur)) : 1;
      lerpV(s.from, to, k, this.cur);
      if (!s.landed && s.t >= s.dur) { s.landed = true; s.resolve(); }
    }
    // a breathing camera: the faintest drift so a held shot never looks frozen
    const o = this.out || (this.out = cloneV(this.cur)), T0 = this.time, b = this.active ? 1 : 0.4;
    o.target.copy(this.cur.target); o.dist = this.cur.dist; o.yaw = this.cur.yaw + (Math.sin(T0 * 0.31) * 0.35 + Math.sin(T0 * 0.13) * 0.25) * b; o.pitch = this.cur.pitch + Math.sin(T0 * 0.23) * 0.2 * b;
    this.write(o);
  }
  // the world camera's director tween: endless, its `from` rewritten every frame (ease 0 → the world applies it as is)
  write(v) {
    const w = this.w; if (!w) return;
    let h = this.hold;
    if (!h || w.tween !== h) { h = this.hold = { from: { target: new V3(), dist: 1, yaw: 0, pitch: 0 }, t: 0, dur: Infinity, ease: () => 0, done() {}, director: 'cinema' }; h.to = h.from; w.tween = h; }
    h.from.target.copy(v.target); h.from.dist = v.dist; h.from.yaw = v.yaw; h.from.pitch = v.pitch;
    if (this.st.baseFov !== undefined) h.from.fov = this.fovWant();       // the world camera carries a lens
    w.camHeld = true;                                                      // a shot holds the camera until it's handed back
  }
  fovWant() { return (this.fovTo ?? this.fovBase ?? 30) - (this.fovK || 0); }
  // stage hook (after the camera is placed, before the frame renders): shake, roll, field of view, focus, grade, shadows
  lens(st) {
    const t = now() / 1000, dt = Math.min(0.1, Math.max(0, t - (this.lt || t))); this.lt = t;
    const cam = st.cam, app = this.app;
    if (app.battle && app.battle.active) return;
    let touched = false;
    // shake: a decaying impulse (fast) plus the handheld wobble (slow), both smooth sums of sines in real time
    const S = this.sh; S.t += dt;
    const imp = S.amp * Math.exp(-S.t * S.decay), hand = this.active && !this.skipping ? this.hh : 0;
    if ((imp > 1e-4 || hand > 0) && !this.skipping) {
      let ox = 0, oy = 0, rz = 0;
      if (imp > 1e-4) { ox += (Math.sin(t * 41) * 0.6 + Math.sin(t * 23 + 1.7) * 0.4) * imp; oy += (Math.sin(t * 37 + 0.4) * 0.6 + Math.sin(t * 19 + 2.3) * 0.4) * imp; rz += Math.sin(t * 29 + 0.9) * imp * 0.06; }
      if (hand > 0) { ox += (Math.sin(t * 1.7 + 0.3) * 0.7 + Math.sin(t * 0.9 + 1.1) * 0.3) * hand; oy += (Math.sin(t * 1.3 + 2.1) * 0.7 + Math.sin(t * 0.7) * 0.3) * hand; rz += Math.sin(t * 0.8 + 0.5) * hand * 0.25; }
      cam.position.addScaledVector(_a.setFromMatrixColumn(cam.matrixWorld, 0), ox).addScaledVector(_b.setFromMatrixColumn(cam.matrixWorld, 1), oy);
      cam.rotateZ(rz); cam.rotateX(oy * 0.02); cam.rotateY(-ox * 0.02);
      touched = true;
    }
    // dutch roll
    this.roll += (this.rollTo - this.roll) * (1 - Math.exp(-dt * 3));
    if (Math.abs(this.roll) > 0.01) { cam.rotateZ(this.roll * D2R); touched = true; }
    // field of view (a punch that springs back, a held lens): through the world camera when it carries a lens,
    // else set on the stage camera directly while an effect lasts, and put back after
    const w = this.w;
    if (st.baseFov === undefined) {
      const fxOn = this.driving && (this.fovTo !== null || (this.fovK || 0) > 0.02);
      if (fxOn) { if (!this.fovSet) { this.fovSet = true; this.fovBase = cam.fov; } const f = this.fovWant(); if (Math.abs(cam.fov - f) > 0.01) { cam.fov = f; cam.updateProjectionMatrix(); } }
      else if (this.fovSet) { this.fovSet = false; cam.fov = this.fovBase ?? cam.fov; cam.updateProjectionMatrix(); }
    }
    if (touched) cam.updateMatrixWorld();
    // the shadow box: with no player the city's controller isn't placing it; wide shots want it bigger
    if (this.driving && w && w.city && st.followShadow && w.cam && (!w.player || w.cam.dist > 34)) {
      const c = w.cam, yr = c.yaw * D2R, off = Math.min(30, c.dist * 0.35) * Math.cos(c.pitch * D2R);
      st.followShadow(_a.set(c.target.x - Math.sin(yr) * off, 0, c.target.z - Math.cos(yr) * off), clampN(c.dist * 0.8, 40, 110));
    }
    this.post(dt, cam);
  }
  // the HD-2D pass: focus band on the subject, grade overrides, everything eased; back to the mood's own when done
  post(dt, cam) {
    if (!this.pp || !this.app.post) return;
    const opts = this.app.post.opts, w = this.w;
    if (!this.base || (w && w.sc !== this.baseSc)) { this.base = copyOpts(this.base && w && w.sc !== this.baseSc ? (POST[w.mood] || opts) : opts); this.baseSc = w && w.sc; }
    const want = Object.assign({}, this.base, this.gradeWant);
    let fRate = 0;
    if (this.driving && this.fx) {
      const f = this.fx; let y = f.y ?? 0.5;
      if (f.pt) { const p = f.pt(); _ndc.copy(p).project(cam); if (_ndc.z < 1) y = clampN((1 - _ndc.y) / 2, 0.12, 0.88); }
      want.focus = y; want.band = f.band; want.dof = f.dof; fRate = 5;
    }
    const kG = 1 - Math.exp(-dt * (this.gradeRate || 1.6)), kF = 1 - Math.exp(-dt * (fRate || 2.5));
    let off = 0;
    for (const key of POST_KEYS) {
      const a = opts[key], b = want[key]; if (b === undefined || a === undefined) continue;
      const k = key === 'focus' || key === 'band' || key === 'dof' ? kF : kG;
      if (Array.isArray(b)) { const arr = Array.isArray(a) ? a.slice() : b.slice(); for (let i = 0; i < b.length; i++) { arr[i] = (arr[i] ?? b[i]) + (b[i] - (arr[i] ?? b[i])) * k; off = Math.max(off, Math.abs(b[i] - arr[i])); } opts[key] = arr; }
      else { opts[key] = a + (b - a) * k; off = Math.max(off, Math.abs(b - opts[key])); }
    }
    if (!this.driving && !this.active && off < 0.003) { Object.assign(opts, copyOpts(this.base)); this.pp = false; this.base = null; }
  }

  // ================================================================ UI: under the HUD-free story layer, and over the fade
  drawUnder(ui) {
    if (this.bars > 0.001) {
      const k = this.bars < 0.5 ? 2 * this.bars * this.bars : 1 - (-2 * this.bars + 2) ** 2 / 2, h = Math.round(ui.h * 0.11 * k);
      if (h > 0) { ui.rect(0, 0, ui.w, h, '#05030a'); ui.rect(0, ui.h - h, ui.w, h, '#05030a'); }
    }
  }
  drawOver(ui) {
    const app = this.app;
    for (const f of this.flashes) { const a = f.a * (1 - f.t / f.dur) ** 1.6; if (a > 0.01) ui.fade(a, f.color); }
    if (this.veil.a > 0.004) ui.fade(this.veil.a, this.veil.color);
    for (const c of this.cards) this.drawCard(ui, c);
    if (this.cover > 0.01) {
      ui.fade(Math.min(1, this.cover), '#05030a');
      if (this.skipping) { const dots = '.'.repeat(1 + (Math.floor(app.t * 4) % 3)); ui.text('SKIPPING' + dots, ui.w - 10, ui.h - 16, T.dim, { align: 'right', mini: true }); }
    }
    // the skip chip (top right, in the bar): hold Esc / hold it to skip
    this.chip = null;
    if (this.active && this.bars > 0.6 && !this.skipping && this.canSkip()) {
      const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches, label = touch ? 'HOLD  SKIP' : 'HOLD ESC  SKIP';
      const w = ui.tw(label, { mini: true }) + 12, x = ui.w - w - 4, y = 3, hgt = 11, k = clamp01(this.skipHold / 0.65);
      this.chip = { x, y, w, h: hgt };
      const on = k > 0 || ui.inside(x, y, w, hgt);
      if (on) blendRect(ui.s, x, y, w, hgt, '#1a1428', 0.85);
      ui.text(label, x + 6, y + 3, on ? T.text : '#6a6488', { mini: true });
      if (k > 0) ui.rect(x + 1, y + hgt - 2, Math.round((w - 2) * k), 1, T.amber);
      if (ui.ptr.released && ui.inside(x, y, w, hgt)) ui.ptr.released = false;     // a hold on the chip never advances the line
    }
  }
  drawCard(ui, c) {
    const W = ui.w, s = ui.s, kin = easeOut(c.t / 0.55), kout = clamp01((c.dur - c.t) / 0.45), k = Math.min(kin, kout);
    if (k <= 0) return;
    if (c.kind === 'title') {
      const big = ui.tw(c.text) * 3 + 30 < W, sc = big ? 3 : 2, tw = ui.tw(c.text) * sc, cy = Math.round(ui.h * (c.y ?? 0.4)), cx = W >> 1;
      const half = Math.round((tw / 2 + 26) * k), n = Math.ceil(c.text.length * clamp01(c.t / 0.7));
      for (let i = -half; i <= half; i++) { const d = Math.abs(i) / Math.max(1, half); s.px(cx + i, cy - 7, mx(T.amberL, T.amber2, d)); s.px(cx + i, cy + 8 * sc + 6, mx(T.amber, T.coral2, d)); }
      gem(s, cx - half, cy - 7, T.cyan, 2); gem(s, cx + half, cy - 7, T.cyan, 2);
      ui.clip(0, cy - 4, W, 8 * sc + 8, () => {
        const str = c.text.slice(0, n), x0 = cx - Math.floor(tw / 2);
        ui.text(str, x0 + 1, cy + 1, '#05030a', { scale: sc }); ui.text(str, x0, cy, null, { scale: sc, outline: T.ink, grad: ['#ffffff', T.amberL, T.amber] });
      });
      if (c.sub && c.t > 0.45) {
        const m = Math.ceil(c.sub.length * clamp01((c.t - 0.45) / 0.6));
        ui.text(c.sub.toUpperCase().slice(0, m), cx, cy + 8 * sc + 12, T.cyan, { align: 'center', outline: T.ink, spacing: 1 });
      }
      if (c.t < 1.2) sparkle(s, cx + half - 1, cy - 10, T.amberL, 1 - c.t / 1.2);
    } else if (c.kind === 'place') {
      const top = Math.round(ui.h * 0.11 * this.bars) + 6, x = 10 - Math.round((1 - k) * 60), tw = Math.max(ui.tw(c.text, { bold: true }) * 2, ui.tw((c.sub || '').toUpperCase(), { mini: true }));
      blendRect(s, x - 4, top - 2, tw + 22, 32, '#0c0814', 0.55 * k);
      ui.rect(x - 4, top - 2, 2, 32, T.amber);
      ui.clip(x, top, Math.round((tw + 18) * kin), 30, () => {
        ui.text(c.text, x + 4, top + 1, null, { scale: 2, outline: T.ink, grad: ['#ffffff', T.amberL] });
        if (c.sub) ui.text(c.sub.toUpperCase(), x + 5, top + 20, T.cyan, { mini: true, outline: T.ink });
      });
    } else if (c.kind === 'name') {
      const right = c.side !== 'left', tw = Math.max(ui.tw(c.text) * 2, ui.tw((c.sub || '').toUpperCase(), { mini: true })) + 20, cy = Math.round(ui.h * (c.y ?? 0.56));
      const x = right ? W - tw - 14 + Math.round((1 - k) * 50) : 14 - Math.round((1 - k) * 50);
      blendRect(s, x - 6, cy - 4, tw + 12, 30, c.color || '#2a1838', 0.7 * k);
      ui.rect(right ? x - 6 : x + tw + 5, cy - 4, 2, 30, c.accent || T.coral);
      ui.clip(x - 6, cy - 4, tw + 14, 32, () => {
        ui.text(c.text.toUpperCase(), x + (right ? 0 : 2), cy, null, { scale: 2, outline: T.ink, grad: ['#ffffff', c.accentL || T.coralL] });
        if (c.sub) ui.text(c.sub.toUpperCase(), x + (right ? 1 : 3), cy + 19, T.amberL, { mini: true, outline: T.ink });
      });
    }
  }
}

// ---------------------------------------------------------------- geometry helpers
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function inRoom(p, r) { return p.x > r[0] && p.x < r[2] && p.z > r[1] && p.z < r[3]; }
// pull a camera in along its ray until it stands inside a room's walls
function clampRoom(v, r) {
  const C = camPos(v, _a), A = v.target;
  if (inRoom(C, r)) return v;
  let t = 1;
  const dx = C.x - A.x, dz = C.z - A.z, m = 0.12;
  if (dx > 0 && C.x > r[2] - m) t = Math.min(t, (r[2] - m - A.x) / dx); if (dx < 0 && C.x < r[0] + m) t = Math.min(t, (r[0] + m - A.x) / dx);
  if (dz > 0 && C.z > r[3] - m) t = Math.min(t, (r[3] - m - A.z) / dz); if (dz < 0 && C.z < r[1] + m) t = Math.min(t, (r[1] + m - A.z) / dz);
  v.dist = Math.max(0.9, v.dist * clampN(t, 0.05, 1));
  return v;
}
// segment A → B against an axis-aligned box: the entry fraction in (0, 1), or 0 if it misses
function segBox(A, B, x0, y0, z0, x1, y1, z1) {
  let t0 = 0, t1 = 1;
  const d = [B.x - A.x, B.y - A.y, B.z - A.z], a = [A.x, A.y, A.z], lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (a[i] < lo[i] || a[i] > hi[i]) return 0; continue; }
    let ta = (lo[i] - a[i]) / d[i], tb = (hi[i] - a[i]) / d[i]; if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return 0;
  }
  return t0 > 0.02 ? t0 : 0;
}
let _beam = null, _patch = null;
function beamTexture() {
  if (_beam) return _beam;
  const c = document.createElement('canvas'); c.width = 32; c.height = 128; const g = c.getContext('2d'), img = g.createImageData(32, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 32; x++) {
    const u = (x + 0.5) / 32, v = 1 - (y + 0.5) / 128, edge = Math.sin(Math.PI * u) ** 1.6, along = Math.pow(1 - v, 1.4) * (0.35 + 0.65 * smooth01(v * 6));
    const streak = 0.85 + 0.15 * Math.sin(u * 23 + 1.3) * Math.sin(u * 7.1);
    const a = clamp01(edge * along * streak); const i = (y * 32 + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(a * 255);
  }
  g.putImageData(img, 0, 0); _beam = new THREE.CanvasTexture(c); _beam.colorSpace = THREE.SRGBColorSpace; return _beam;
}
function patchTexture() {
  if (_patch) return _patch;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'), img = g.createImageData(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const u = (x + 0.5) / 64, v = (y + 0.5) / 64, e = smooth01(Math.min(u, 1 - u, v, 1 - v) * 7), bar = Math.abs(u - 0.5) < 0.035 || Math.abs(v - 0.5) < 0.035 ? 0.25 : 1;
    const i = (y * 64 + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(e * bar * 255);
  }
  g.putImageData(img, 0, 0); _patch = new THREE.CanvasTexture(c); _patch.colorSpace = THREE.SRGBColorSpace; return _patch;
}
function smooth01(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
// a heavy, slate-grey sky with torn cloud bands
function stormSky() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#1a1e2c'); gr.addColorStop(0.45, '#3a4256'); gr.addColorStop(0.8, '#5a6274'); gr.addColorStop(1, '#7a8090');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 70; i++) { const y = Math.random() * 220, h = 2 + Math.random() * 7; g.fillStyle = `rgba(${Math.random() < 0.5 ? '20,22,34' : '120,128,146'},${0.12 + Math.random() * 0.2})`; g.fillRect(0, y, 64, h); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
