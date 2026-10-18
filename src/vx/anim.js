// Animation for box-model creatures, tuned for bouncy, polished Cobblemon-style
// motion.
//  · Clips are small functions f(P, t, c) that write pose offsets into a Pose —
//    rotations in degrees, offsets in model units, scale factors, squash and
//    stretch — built from easing curves, keyframe tracks, hop and bounce cycles
//    (anticipation, stretch, landing squash, settle) and damped wobbles.
//  · The Animator crossfades between clips, then layers procedural life on top:
//    breathing, blinking, head look-at and expression slots (eyes, mouth, …).
//  · Soft parts (ears, tails, crests, ribbons, fins) hang on springs that feel the
//    motion of their bone: they lag, swing and overshoot whenever the body moves.
//  · Clips fire effects (particles) exactly once at chosen times, or stream them.
import * as THREE from '../../vendor/three.module.js';
import { U } from './model.js';

const D2R = Math.PI / 180, TAU = Math.PI * 2;
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;
// easing curves (t in 0..1)
export const E = {
  lin: (t) => t,
  in: (t) => t * t, out: (t) => 1 - (1 - t) * (1 - t), inout: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  in3: (t) => t * t * t, out3: (t) => 1 - (1 - t) ** 3, inout3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  back: (t, s = 1.9) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,          // overshoot then settle
  anti: (t, s = 1.7) => (s + 1) * t * t * t - s * t * t,                          // wind back first (anticipation)
  elastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (-9 * t) * Math.sin((t * 9 - 0.75) * (TAU / 3)) + 1),
  bounce: (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
};
// eased progress of t through [a, b]
export const seg = (t, a, b, e = E.inout) => e(clamp01((t - a) / (b - a)));
// a smooth 0 → 1 → 0 bump across [a, b]
export const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));
// damped wobble after an impulse at t0
export const wob = (t, t0, amp, hz = 3, k = 6) => (t < t0 ? 0 : amp * Math.exp(-k * (t - t0)) * Math.sin((t - t0) * hz * TAU));
export const wave = (t, hz, ph = 0) => Math.sin(t * hz * TAU + ph);
// keyframe track: keys [[t, value, ease], ...]; value may be a number or an array.
// ease (on the key a segment ends at) is a name from E, or 'smooth' (Catmull-Rom, default)
export function key(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length; if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const u = (t - k1[0]) / (k2[0] - k1[0]), mode = k2[2] || 'smooth';
  const f = (a, b, c, d) => {
    if (mode !== 'smooth') return b + (c - b) * (E[mode] || E.lin)(u);
    const u2 = u * u, u3 = u2 * u;
    return 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
  };
  if (Array.isArray(k1[1])) return k1[1].map((_, j) => f(k0[1][j], k1[1][j], k2[1][j], k3[1][j]));
  return f(k0[1], k1[1], k2[1], k3[1]);
}
// a bouncing-ball idle: up arcs are round, contacts are sharp. u = height 0..1, sq = squash (−) / stretch (+)
export function bounce(t, per = 0.9, o = {}) {
  const ph = (t / per) % 1, u = Math.abs(Math.sin(ph * Math.PI));
  const contact = (1 - u) ** (o.sharp || 6), v = Math.cos(ph * Math.PI);            // v: +1 rising after contact, −1 falling
  return { u, sq: -contact * (o.squash ?? 0.12) + Math.max(0, v) * (1 - contact) * (o.stretch ?? 0.05) * u * 2, ph };
}
// one hop of period per: crouch → launch (stretch) → arc → land (squash) → settle. y in units
export function hop(t, per = 0.8, height = 4, o = {}) {
  const u = ((t / per) % 1 + 1) % 1, c = o.crouch ?? height * 0.25;
  const a = o.air || [0.2, 0.62];
  if (u < a[0]) { const k = E.inout(u / a[0]); return { y: -c * k, sq: -0.16 * k, air: false, u }; }
  if (u < a[1]) { const k = (u - a[0]) / (a[1] - a[0]), y = Math.sin(k * Math.PI) * height; return { y, sq: 0.16 * (1 - k) ** 2 - 0.04 + 0.1 * k ** 6, air: true, u, k }; }
  const k = (u - a[1]) / (1 - a[1]);
  return { y: -c * 0.7 * Math.exp(-k * 6) * Math.cos(k * 9), sq: -0.22 * Math.exp(-k * 7) * Math.cos(k * 11), air: false, u };
}
// seeded random for clips
export function rnd(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ------------------------------------------------------------ pose buffer
export class Pose {
  constructor(names) { this.names = names; this.b = {}; for (const n of names) this.b[n] = { r: [0, 0, 0], p: [0, 0, 0], s: [1, 1, 1] }; this.reset(); }
  reset() { for (const n of this.names) { const o = this.b[n]; o.r[0] = o.r[1] = o.r[2] = 0; o.p[0] = o.p[1] = o.p[2] = 0; o.s[0] = o.s[1] = o.s[2] = 1; } this.slots = {}; this.fx = []; this.lookW = 1; this.breathW = 1; this.blinkOK = true; this.t0 = 0; this.t1 = 0; this.wrap = false; return this; }
  rot(n, x = 0, y = 0, z = 0) { const o = this.b[n]; if (o) { o.r[0] += x; o.r[1] += y; o.r[2] += z; } return this; }
  pos(n, x = 0, y = 0, z = 0) { const o = this.b[n]; if (o) { o.p[0] += x; o.p[1] += y; o.p[2] += z; } return this; }
  scl(n, x = 1, y = x, z = x) { const o = this.b[n]; if (o) { o.s[0] *= x; o.s[1] *= y; o.s[2] *= z; } return this; }
  // volume-preserving squash (a < 0) / stretch (a > 0) along y
  sq(n, a) { const o = this.b[n]; if (!o) return this; const k = Math.max(0.3, 1 + a), side = 1 / Math.sqrt(k); o.s[0] *= side; o.s[1] *= k; o.s[2] *= side; return this; }
  face(slot, state) { this.slots[slot] = state; return this; }
  // true once when the clip clock crosses `time`
  at(time) { return this.wrap ? time > this.t0 || time <= this.t1 : time > this.t0 && time <= this.t1; }
  // particle effects: stream (every frame, rate per second) or burst (once at `time`)
  stream(kind, bone, off, o = {}) { this.fx.push({ kind, bone, off, o, stream: true }); return this; }
  burst(time, kind, bone, off, o = {}) { if (this.at(time)) this.fx.push({ kind, bone, off, o }); return this; }
  copy(src) { for (const n of this.names) { const a = this.b[n], b = src.b[n]; for (let i = 0; i < 3; i++) { a.r[i] = b.r[i]; a.p[i] = b.p[i]; a.s[i] = b.s[i]; } } this.slots = { ...src.slots }; this.fx = src.fx.slice(); this.lookW = src.lookW; this.breathW = src.breathW; this.blinkOK = src.blinkOK; return this; }
}
function mixPose(out, a, b, w) {
  for (const n of out.names) {
    const o = out.b[n], A = a.b[n], B = b.b[n];
    for (let i = 0; i < 3; i++) { o.r[i] = A.r[i] + (B.r[i] - A.r[i]) * w; o.p[i] = A.p[i] + (B.p[i] - A.p[i]) * w; o.s[i] = A.s[i] + (B.s[i] - A.s[i]) * w; }
  }
  out.slots = w < 0.5 ? { ...a.slots } : { ...b.slots }; out.fx = b.fx.concat(w < 0.5 ? a.fx.filter((e) => !e.stream) : []);
  out.lookW = lerp(a.lookW, b.lookW, w); out.breathW = lerp(a.breathW, b.breathW, w); out.blinkOK = w < 0.5 ? a.blinkOK : b.blinkOK;
  return out;
}

// ------------------------------------------------------------ animator
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _a = new THREE.Vector3(), _r = new THREE.Vector3(), _t = new THREE.Vector3();
export class Animator {
  // spec: { clips: { name: { len, loop, f(P, t, c), next, fade, out } }, start, springs: [{ bone, tip: [x,y,z] units, k, d, gain, max }],
  //         breathe: { bone, amp, per }, blink: { slot, closed, every: [a, b], dur }, look: { bone, yaw, pitch, speed },
  //         faces: { slot: { default, states: { name: [part ids] } } }, fidget: { every: [a, b], clips: [] } }
  constructor(model, spec = model.def.anim || {}) {
    this.m = model; this.spec = spec; this.clips = spec.clips || {}; this.time = 0;
    const names = model.order;
    this.A = new Pose(names); this.B = new Pose(names); this.O = new Pose(names);
    this.springs = (spec.springs || []).filter((s) => model.bones[s.bone]).map((s) => ({ k: 160, d: 10, gain: 1, max: 40, ...s, th: new THREE.Vector3(), w: new THREE.Vector3(), h: [] }));
    this.rand = rnd(spec.seed || 11);
    this.blinkAt = 1.5 + this.rand() * 2.5; this.blinkEnd = -1;
    this.look = { yaw: 0, pitch: 0 }; this.applied = {};
    this.fidgetAt = this.nextFidget();
    this.play(spec.start || 'idle', { fade: 0 });
  }
  nextFidget() { const f = this.spec.fidget; return f ? this.time + f.every[0] + this.rand() * (f.every[1] - f.every[0]) : Infinity; }
  // play a clip. o: { fade, speed, next, onEnd, restart }
  play(name, o = {}) {
    const c = this.clips[name]; if (!c) return this;
    if (this.cur && this.cur.name === name && !o.restart) return this;
    this.prev = this.cur || null;
    this.fadeLen = o.fade ?? c.fade ?? 0.18; this.fade = this.prev && this.fadeLen > 0 ? 0 : 1;
    this.cur = { name, c, t: 0, pt: -1e-6, speed: o.speed || c.speed || 1, next: o.next ?? c.next, onEnd: o.onEnd, seed: Math.floor(this.rand() * 1e6) };
    return this;
  }
  get clip() { return this.cur ? this.cur.name : null; }
  evalClip(P, s, ctx) {
    const c = s.c, len = c.len || 1;
    P.reset();
    let t0 = s.pt, t1 = s.t;
    if (c.loop) { const a = ((t0 % len) + len) % len, b = ((t1 % len) + len) % len; P.wrap = b < a; t0 = a; t1 = b; }
    else { t0 = Math.min(t0, len); t1 = Math.min(t1, len); P.wrap = false; }
    P.t0 = t0; P.t1 = t1;
    c.f(P, t1, Object.assign({ time: this.time, len, seed: s.seed, R: rnd(s.seed), loopN: Math.floor(s.t / len) }, ctx));
  }
  update(dt, ctx = {}) {
    dt = Math.min(dt, 0.1); this.time += dt;
    const adv = (s) => { if (!s) return; s.pt = s.t; s.t += dt * s.speed; };
    adv(this.cur); adv(this.prev);
    // end of a one-shot clip → its follow-up
    const cc = this.cur.c;
    if (!cc.loop && this.cur.t >= (cc.len || 1)) {
      const cb = this.cur.onEnd, nx = this.cur.next || 'idle';
      this.evalClip(this.A, this.cur, ctx);           // fire the last events
      this.play(nx, { fade: cc.out ?? 0.22, restart: nx === this.cur.name });
      if (cb) cb();
    }
    // idle fidgets
    if (this.cur.name === (this.spec.start || 'idle') && this.time >= this.fidgetAt) { const f = this.spec.fidget; this.play(f.clips[Math.floor(this.rand() * f.clips.length)], { next: this.cur.name }); this.fidgetAt = this.nextFidget(); }
    // evaluate + crossfade
    this.evalClip(this.A, this.cur, ctx);
    let P = this.A;
    if (this.prev && this.fade < 1) {
      this.fade = Math.min(1, this.fade + dt / this.fadeLen);
      this.evalClip(this.B, this.prev, ctx);
      P = mixPose(this.O, this.B, this.A, E.inout(this.fade));
      if (this.fade >= 1) this.prev = null;
    }
    const S = this.spec, T = this.time;
    // breathing
    if (S.breathe && P.breathW > 0) P.sq(S.breathe.bone, Math.sin((T / (S.breathe.per || 3)) * TAU) * (S.breathe.amp ?? 0.018) * P.breathW);
    // blinking
    if (S.blink) {
      if (T >= this.blinkAt) { this.blinkEnd = T + (S.blink.dur || 0.12); this.blinkAt = T + (S.blink.every || [2, 5])[0] + this.rand() * ((S.blink.every || [2, 5])[1] - (S.blink.every || [2, 5])[0]); if (this.rand() < 0.2) this.blinkAt = this.blinkEnd + 0.12; }
      if (T < this.blinkEnd && P.blinkOK) P.face(S.blink.slot || 'eyes', S.blink.closed || 'closed');
    }
    // head look-at (yaw/pitch toward a world point)
    if (S.look) {
      let ty = 0, tp = 0;
      if (ctx.look && P.lookW > 0) {
        const g = this.m.group; g.updateWorldMatrix(true, false);
        _v.copy(ctx.look); g.worldToLocal(_v); const head = this.m.bones[S.look.bone];
        const hp = _t.copy(head.position); for (let o = head.parent; o && o !== g; o = o.parent) hp.add(o.position);
        _v.sub(hp);
        ty = Math.max(-S.look.yaw, Math.min(S.look.yaw, Math.atan2(_v.x, _v.z) / D2R)) * P.lookW;
        tp = Math.max(-S.look.pitch, Math.min(S.look.pitch, -Math.atan2(_v.y, Math.hypot(_v.x, _v.z)) / D2R)) * P.lookW;
      }
      const k = 1 - Math.exp(-dt * (S.look.speed || 6));
      this.look.yaw += (ty - this.look.yaw) * k; this.look.pitch += (tp - this.look.pitch) * k;
      P.rot(S.look.bone, this.look.pitch, this.look.yaw, 0);
    }
    // write bones
    const M = this.m;
    for (const n of M.order) {
      const o = M.bones[n], r = M.rest[n], b = P.b[n];
      o.rotation.set(r.r.x + b.r[0] * D2R, r.r.y + b.r[1] * D2R, r.r.z + b.r[2] * D2R);
      o.position.set(r.p.x + b.p[0] * U, r.p.y + b.p[1] * U, r.p.z + b.p[2] * U);
      o.scale.set(r.s.x * b.s[0], r.s.y * b.s[1], r.s.z * b.s[2]);
    }
    // springs: secondary motion from the bone's own movement
    for (const s of this.springs) this.spring(s, dt);
    // expressions
    if (S.faces) for (const [slot, def] of Object.entries(S.faces)) {
      const want = P.slots[slot] || def.default;
      if (this.applied[slot] === want) continue;
      for (const [state, ids] of Object.entries(def.states)) for (const id of ids) M.show(id, false);
      for (const id of def.states[want] || []) M.show(id, true);
      this.applied[slot] = want;
    }
    // effects
    if (ctx.fx && P.fx.length) {
      for (const e of P.fx) {
        const bone = M.bones[e.bone] || M.group, pv = M.pivots[e.bone] || [0, 0, 0], off = e.off || pv; bone.updateWorldMatrix(true, false);
        const pos = new THREE.Vector3(off[0] - pv[0], off[1] - pv[1], off[2] - pv[2]).multiplyScalar(U).applyMatrix4(bone.matrixWorld);   // offsets are model coordinates
        let dir = null; if (e.o.dir) { bone.getWorldQuaternion(_q); dir = new THREE.Vector3(...e.o.dir).applyQuaternion(_q).normalize(); }
        ctx.fx.emit(e.kind, pos, { ...e.o, dir, dt: e.stream ? dt : 0, scale: M.scale * (e.o.scale || 1) });
      }
    }
    this.pose = P;
    return P;
  }
  spring(s, dt) {
    const o = this.m.bones[s.bone]; o.updateWorldMatrix(true, false);
    const tip = _t.set(s.tip[0] * U, s.tip[1] * U, s.tip[2] * U).applyMatrix4(o.matrixWorld);
    s.h.unshift(tip.clone()); if (s.h.length > 3) s.h.length = 3;
    if (s.h.length === 3 && dt > 0) {
      _a.copy(s.h[0]).addScaledVector(s.h[1], -2).add(s.h[2]).divideScalar(dt * dt);
      const L = _a.length(); if (L > 80) _a.multiplyScalar(80 / L);
      o.getWorldQuaternion(_q); _a.applyQuaternion(_q.invert());
      _r.set(s.tip[0], s.tip[1], s.tip[2]).multiplyScalar(U * this.m.scale);
      const r2 = Math.max(1e-4, _r.lengthSq());
      const alpha = _v.crossVectors(_r, _a.negate()).divideScalar(r2).multiplyScalar(s.gain);
      // integrate (sub-stepped)
      const n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
      for (let i = 0; i < n; i++) {
        s.w.x += (alpha.x - s.k * s.th.x - s.d * s.w.x) * h; s.w.y += (alpha.y - s.k * s.th.y - s.d * s.w.y) * h; s.w.z += (alpha.z - s.k * s.th.z - s.d * s.w.z) * h;
        s.th.addScaledVector(s.w, h);
      }
      const mx = s.max * D2R; s.th.x = Math.max(-mx, Math.min(mx, s.th.x)); s.th.y = Math.max(-mx, Math.min(mx, s.th.y)); s.th.z = Math.max(-mx, Math.min(mx, s.th.z));
    }
    const ax = s.axes || [1, 1, 1];
    o.rotation.x += s.th.x * ax[0]; o.rotation.y += s.th.y * ax[1]; o.rotation.z += s.th.z * ax[2];
  }
}
