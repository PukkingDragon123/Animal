// Procedural animator for rigged voxel models. Layers, blended every frame:
//   locomotion (per archetype gait, speed-driven)  · one-shot actions (attack,
//   cast, dodge, hit…) · persistent modes (stun, sleep, faint, charge…) ·
//   face (expressions, blinking, talking) · secondary motion (sway/spin parts)
//   · personality idle quirks (headbang, spin, stretch…).
// Bone naming convention (all optional): body, neck, head, jaw, earL/R,
// tail, tail2.., legFL/FR/BL/BR, legL/R, legML/MR, armL/R, wingL/R, finL/R,
// tent1.., antL/R, seg1.. . 'R' bones mirror y/z rotation signs automatically.
import { clamp, clamp01, ease, TAU, damp } from '../core/mathx.js';

const S = Math.sin, C = Math.cos;
const bell = (t, a, b) => (t <= a || t >= b ? 0 : S(((t - a) / (b - a)) * Math.PI));
const ramp = (t, a, b) => clamp01((t - a) / (b - a || 1e-6));

// Action catalogue: duration (s), face, mouth, loop?
export const ACTIONS = {
  attack: { dur: 0.42, face: 'angry', mouth: 0.6 },
  attack2: { dur: 0.42, face: 'angry', mouth: 0.6 },
  attack3: { dur: 0.6, face: 'angry', mouth: 1 },
  shoot: { dur: 0.36, face: 'angry', mouth: 0.8 },
  cast: { dur: 0.7, face: 'angry', mouth: 1 },
  slam: { dur: 0.7, face: 'angry', mouth: 1 },
  dodge: { dur: 0.36, face: 'normal' },
  parry: { dur: 0.42, face: 'angry' },
  grab: { dur: 0.45, face: 'angry', mouth: 1 },
  throw: { dur: 0.6, face: 'angry', mouth: 1 },
  hit: { dur: 0.32, face: 'hurt' },
  bigHit: { dur: 0.6, face: 'hurt' },
  roar: { dur: 1.0, face: 'angry', mouth: 1 },
  victory: { dur: 1.4, face: 'happy', mouth: 1 },
  happy: { dur: 0.9, face: 'happy', mouth: 0.5 },
  nod: { dur: 0.6 }, shake: { dur: 0.7, face: 'sad' },
  eat: { dur: 1.2, face: 'happy', mouth: 1 },
  spawn: { dur: 0.55, face: 'happy' },
  wave: { dur: 1.2, face: 'happy', mouth: 0.5 },
  point: { dur: 1.0 }, cheer: { dur: 1.2, face: 'happy', mouth: 1 },
  bow: { dur: 1.2, face: 'closed' }, shrug: { dur: 1.0 }, think: { dur: 1.6 },
  shocked: { dur: 0.9, face: 'ko', mouth: 1 }, stomp: { dur: 0.8, face: 'angry', mouth: 1 },
  laugh: { dur: 1.2, face: 'happy', mouth: 1 }, throwKey: { dur: 0.7, face: 'angry' },
  command: { dur: 0.8, face: 'angry', mouth: 1 },
  // personality quirks
  headbang: { dur: 1.4, face: 'closed', mouth: 0.3 }, spin: { dur: 0.8, face: 'happy' },
  stretch: { dur: 1.4, face: 'closed', mouth: 1 }, scratch: { dur: 1.0, face: 'closed' },
  shakeoff: { dur: 0.8, face: 'closed' }, hop: { dur: 0.6, face: 'happy' }, sniff: { dur: 1.1 },
  flex: { dur: 1.2, face: 'angry', mouth: 1 }, sway: { dur: 1.6, face: 'happy' },
};

const MODE_FACE = { stun: 'ko', sleep: 'closed', faint: 'ko', charge: 'angry', grabbed: 'hurt', frozen: 'hurt', guard: 'angry', sit: null, float: 'closed', sad: 'sad', angry: 'angry', happy: 'happy' };

export class Animator {
  static STEP_FPS = 12;
  constructor(model, params = {}) {
    this.model = model;
    this.rig = model.userData.rig;
    const d = this.rig.design || {};
    this.p = Object.assign({ bounce: 1, gait: 1, stride: 1, tail: 1, quirk: null, hover: 0, flap: 1, weight: 1 }, d.anim || {}, params);
    this.arch = this.rig.arch;
    this.t = Math.random() * 10;
    this.speed = 0; this.speedS = 0; this.phase = 0;
    this.maxSpeed = this.p.maxSpeed || 4;
    this.action = null; this.prev = null; this.prevW = 0;
    this.mode = null; this.modeW = 0; this.modeT = 0; this.lastMode = null;
    this.faceOverride = null; this.faceT = 0;
    this.talking = false; this.talkT = 0; this.mouthOpen = false;
    this.blinkT = 1 + Math.random() * 3; this.blinking = 0;
    this.quirkT = 4 + Math.random() * 5;
    this.lookYaw = 0; this.lookPitch = 0; this.lookYawS = 0; this.lookPitchS = 0;
    this.scale = this.p.scale || 1;
    this.P = {};
    for (const n of Object.keys(this.rig.bones)) this.P[n] = [0, 0, 0, 0, 0, 0];
    this.root = [0, 0, 0, 0, 0, 0, 0]; // px,py,pz, rx,ry,rz, squash
    this.bones = this.rig.bones;
    this.has = (n) => !!this.bones[n];
    this.tails = []; for (let i = 1; i < 8; i++) { const n = i === 1 ? 'tail' : 'tail' + i; if (this.bones[n]) this.tails.push(n); }
    this.segs = []; for (let i = 1; i < 12; i++) if (this.bones['seg' + i]) this.segs.push('seg' + i);
    this.tents = Object.keys(this.bones).filter((n) => /^tent/.test(n));
    this.legs6 = ['legFL', 'legML', 'legBL', 'legFR', 'legMR', 'legBR'].filter((n) => this.bones[n]);
    this.h = this.rig.height || 1;
    // 2D look: poses update in steps ("on twos", 12 fps) while motion stays smooth
    this.stepFps = this.p.stepFps ?? (this.arch === 'static' ? 0 : Animator.STEP_FPS);
    this.stepAcc = 0;
  }

  // ------------------------------------------------ public API
  setSpeed(v) { this.speed = Math.max(0, v); }
  play(name, opts = {}) {
    const def = ACTIONS[name] || { dur: 0.5 };
    if (this.action) { this.prev = this.action; this.prevW = 1; }
    this.action = { name, t: 0, dur: (opts.dur || def.dur) / (opts.rate || 1), def, w: 0 };
    return this.action.dur;
  }
  isPlaying(name) { return this.action && (!name || this.action.name === name); }
  setMode(name) { if (name === this.mode) return; this.lastMode = this.mode; this.mode = name; this.modeT = 0; }
  setFace(expr, dur = 1.2) { this.faceOverride = expr; this.faceT = dur; }
  talk(on) { this.talking = on; }
  lookAt(yaw, pitch = 0) { this.lookYaw = clamp(yaw, -1.1, 1.1); this.lookPitch = clamp(pitch, -0.5, 0.5); }

  // ------------------------------------------------ helpers
  _rot(n, x, y, z, w = 1) {
    const b = this.P[n]; if (!b) return;
    const m = /R\d*$/.test(n) && !/^(head|neck|jaw)/.test(n) ? -1 : 1;
    b[0] += x * w; b[1] += y * w * m; b[2] += z * w * m;
  }
  _pos(n, x, y, z, w = 1) { const b = this.P[n]; if (!b) return; b[3] += x * w; b[4] += y * w; b[5] += z * w; }
  _pair(base, x, y, z, w = 1) { this._rot(base + 'L', x, y, z, w); this._rot(base + 'R', x, y, z, w); }
  _root(px, py, pz, rx, ry, rz, sq = 0, w = 1) { const r = this.root; r[0] += px * w; r[1] += py * w; r[2] += pz * w; r[3] += rx * w; r[4] += ry * w; r[5] += rz * w; r[6] += sq * w; }

  // ------------------------------------------------ update
  update(dt) {
    if (!this.stepFps) return this._update(dt);
    this.stepAcc += dt;
    if (this.stepAcc < 1 / this.stepFps) return;
    const d = this.stepAcc; this.stepAcc = 0;
    this._update(d);
  }
  _update(dt) {
    dt = Math.min(dt, 0.1);
    this.t += dt;
    this.speedS += (this.speed - this.speedS) * damp(10, dt);
    const sp = this.speedS;
    const s01 = clamp01(sp / Math.max(0.5, this.maxSpeed));
    const cad = (this.p.gait || 1) * (this.arch === 'biped' ? 1.5 : 1.8) / Math.max(0.35, this.h);
    this.phase += dt * (1.2 + sp * cad * 1.6);
    for (const n in this.P) { const b = this.P[n]; b[0] = b[1] = b[2] = b[3] = b[4] = b[5] = 0; }
    this.root.fill(0);

    const frozen = this.mode === 'frozen';
    const tt = frozen ? 0 : this.t;

    // mode weight
    if (this.mode) { this.modeT += dt; this.modeW = Math.min(1, this.modeW + dt * 5); }
    else this.modeW = Math.max(0, this.modeW - dt * 4);
    const lockLoco = this.mode && ['sleep', 'faint', 'stun', 'grabbed', 'frozen', 'sit'].includes(this.mode) ? this.modeW : 0;

    // locomotion + idle
    if (!frozen) {
      const wl = 1 - lockLoco;
      this._idle(tt, (1 - s01) * wl);
      if (s01 > 0.01) this._loco(this.phase, s01, wl);
    }

    // action
    if (this.action) {
      const a = this.action;
      a.t += dt;
      const u = a.t / a.dur;
      const w = Math.min(1, a.t / 0.06) * (u > 0.85 ? Math.max(0, (1 - u) / 0.15) : 1);
      this._action(a.name, clamp01(u), w, a.t);
      if (u >= 1) this.action = null;
    }
    // persistent mode
    if (this.modeW > 0) this._mode(this.mode || this.lastMode, this.modeT, this.modeW);

    // quirks (idle personality)
    if (!this.action && !this.mode && sp < 0.2 && this.p.quirk) {
      this.quirkT -= dt;
      if (this.quirkT <= 0) {
        const q = Array.isArray(this.p.quirk) ? this.p.quirk[Math.floor(Math.random() * this.p.quirk.length)] : this.p.quirk;
        this.play(q); this.quirkT = 5 + Math.random() * 7;
      }
    }

    // look (head)
    this.lookYawS += (this.lookYaw - this.lookYawS) * damp(6, dt);
    this.lookPitchS += (this.lookPitch - this.lookPitchS) * damp(6, dt);
    if (this.has('neck')) { this._rot('neck', this.lookPitchS * 0.4, this.lookYawS * 0.4, 0); this._rot('head', this.lookPitchS * 0.6, this.lookYawS * 0.6, 0); }
    else this._rot('head', this.lookPitchS, this.lookYawS, 0);

    // secondary motion
    for (const s of this.rig.sway) {
      if (s.sway) {
        const sw = s.sway, v = S(tt * (sw.freq || 2) * TAU / 2 + (sw.phase || 0)) * (sw.amp || 0.2) * (1 + s01 * (sw.move || 0.5));
        const ax = sw.axis || 'z';
        this._rot(s.name, ax === 'x' ? v : 0, ax === 'y' ? v : 0, ax === 'z' ? v : 0);
      }
      if (s.spin) { const v = tt * (s.spin.speed || 2); const ax = s.spin.axis || 'y'; this._rot(s.name, ax === 'x' ? v : 0, ax === 'y' ? v : 0, ax === 'z' ? v : 0); }
    }

    this._apply();
    this._face(dt);
  }

  _apply() {
    const R = this.rig.rest;
    for (const n in this.P) {
      const b = this.bones[n], p = this.P[n], r = R[n];
      b.rotation.set(p[0], p[1], p[2]);
      b.position.set(r.pos.x + p[3], r.pos.y + p[4], r.pos.z + p[5]);
    }
    const pose = this.rig.pose, r = this.root;
    pose.position.set(r[0], r[1] + (this.p.hover || 0), r[2]);
    pose.rotation.set(r[3], r[4], r[5]);
    const k = clamp(r[6], -0.45, 0.6);
    const sy = 1 + k, sxz = 1 / Math.sqrt(Math.max(0.3, sy));
    pose.scale.set(sxz * this.scale, sy * this.scale, sxz * this.scale);
  }

  // ------------------------------------------------ idle
  _idle(t, w) {
    if (w <= 0 || this.arch === 'static') return;
    const h = this.h, a = this.arch;
    const br = S(t * 2.2);
    this._root(0, 0, 0, 0, 0, 0, br * 0.018 * this.p.bounce, w);
    this._rot('body', br * 0.02, 0, 0, w);
    this._rot('head', S(t * 0.9) * 0.05, S(t * 0.45) * 0.12, S(t * 0.7) * 0.03, w);
    this._rot('jaw', 0, 0, 0, w);
    this._pair('ear', S(t * 1.3) * 0.06 + (S(t * 0.37) > 0.97 ? S(t * 40) * 0.3 : 0), 0, S(t * 1.1) * 0.05, w);
    this._pair('ant', S(t * 2.1) * 0.12, S(t * 1.7) * 0.1, 0, w);
    for (let i = 0; i < this.tails.length; i++) this._rot(this.tails[i], S(t * 1.6 - i * 0.7) * 0.05, S(t * 1.2 - i * 0.6) * 0.22 * this.p.tail, 0, w);
    for (let i = 0; i < this.segs.length; i++) this._rot(this.segs[i], 0, S(t * 1.4 - i * 0.6) * 0.12, 0, w);
    for (let i = 0; i < this.tents.length; i++) this._rot(this.tents[i], S(t * 2 + i * 1.3) * 0.18, 0, S(t * 1.6 + i * 0.9) * 0.15, w);
    if (a === 'biped') { this._pair('arm', S(t * 2.2) * 0.04, 0, 0.06 + br * 0.02, w); }
    if (a === 'flyer') {
      const f = S(t * 9 * this.p.flap);
      this._pair('wing', 0, 0, f * 0.7, w);
      this._root(0, S(t * 2) * 0.06 * h, 0, 0, 0, 0, 0, w);
      this._pair('leg', 0.35, 0, 0, w);
    } else {
      this._pair('wing', 0, 0, S(t * 1.5) * 0.06, w);
    }
    if (a === 'floater') {
      this._root(0, (S(t * 2) * 0.5 + 0.5) * 0.06 * h, 0, 0, 0, S(t * 0.9) * 0.05, S(t * 2 + 1.2) * 0.05, w);
      this._pair('arm', S(t * 2.4) * 0.2, 0, 0.25 + S(t * 1.9) * 0.15, w);
    }
    if (a === 'swimmer') {
      this._root(0, S(t * 1.6) * 0.05 * h, 0, 0, 0, 0, 0, w);
      this._rot('body', 0, S(t * 2.6) * 0.06, 0, w);
      this._pair('fin', 0, S(t * 3) * 0.25, S(t * 3) * 0.2, w);
    }
    if (a === 'insect') this._pair('wing', 0, 0, S(t * 40) * 0.05, w);
    this._pair('fin', 0, S(t * 2.2) * 0.12, 0, w);
  }

  // ------------------------------------------------ locomotion
  _loco(ph, s, w) {
    const a = this.arch, A = (0.55 + 0.25 * s) * s * this.p.stride, h = this.h, bnc = this.p.bounce;
    const ww = w;
    if (a === 'quad') {
      const sw = S(ph), cw = C(ph);
      this._rot('legFL', sw * A, 0, 0, ww); this._rot('legBR', sw * A, 0, 0, ww);
      this._rot('legFR', -sw * A, 0, 0, ww); this._rot('legBL', -sw * A, 0, 0, ww);
      this._root(0, Math.abs(cw) * 0.05 * h * s * bnc, 0, 0, 0, 0, -Math.abs(sw) * 0.04 * s * bnc, ww);
      this._rot('body', S(ph * 2) * 0.04 * s, 0, S(ph) * 0.03 * s, ww);
      this._rot('head', -S(ph * 2) * 0.06 * s, 0, 0, ww);
      for (let i = 0; i < this.tails.length; i++) this._rot(this.tails[i], 0.15 * s, S(ph - i * 0.8) * 0.3 * s * this.p.tail, 0, ww);
      this._pair('ear', -0.25 * s, 0, 0, ww);
    } else if (a === 'biped') {
      const sw = S(ph);
      this._rot('legL', sw * A * 1.1, 0, 0, ww); this._rot('legR', -sw * A * 1.1, 0, 0, ww);
      this._rot('armL', -sw * A * 0.9, 0, 0.05, ww); this._rot('armR', sw * A * 0.9, 0, 0.05, ww);
      this._root(0, Math.abs(C(ph)) * 0.045 * h * s * bnc, 0, 0.06 * s, 0, 0, 0, ww);
      this._rot('body', 0, sw * 0.12 * s, 0, ww);
      this._rot('head', 0, -sw * 0.08 * s, 0, ww);
      for (let i = 0; i < this.tails.length; i++) this._rot(this.tails[i], 0.1 * s, S(ph - i * 0.8) * 0.25 * s, 0, ww);
    } else if (a === 'hopper') {
      const hp = (ph * 0.5) % 1, j = S(hp * Math.PI);
      this._root(0, j * 0.28 * h * s, 0, -0.1 * j * s, 0, 0, (j > 0.15 ? 0.12 * j : -0.15) * s, ww);
      this._pair('leg', -0.6 * j * s, 0, 0, ww); this._pair('legB', -0.8 * j * s, 0, 0, ww); this._pair('legF', 0.6 * j * s, 0, 0, ww);
      this._pair('ear', -0.4 * j * s, 0, 0, ww);
    } else if (a === 'serpent') {
      for (let i = 0; i < this.segs.length; i++) this._rot(this.segs[i], 0, S(ph - i * 0.9) * 0.35 * s, 0, ww);
      for (let i = 0; i < this.tails.length; i++) this._rot(this.tails[i], 0, S(ph - (i + this.segs.length) * 0.9) * 0.4 * s, 0, ww);
      this._rot('head', 0, -S(ph) * 0.15 * s, 0, ww);
    } else if (a === 'flyer') {
      const f = S(this.t * 11 * this.p.flap);
      this._pair('wing', 0, 0, f * 0.95 * s, ww);
      this._root(0, 0.05 * h * s, 0, 0.18 * s, 0, 0, 0, ww);
      this._pair('leg', 0.6 * s, 0, 0, ww);
    } else if (a === 'floater') {
      this._root(0, 0.04 * h * s, 0, 0.2 * s, 0, 0, S(ph * 2) * 0.06 * s, ww);
      for (let i = 0; i < this.tents.length; i++) this._rot(this.tents[i], -0.4 * s + S(ph * 2 + i) * 0.3 * s, 0, 0, ww);
    } else if (a === 'swimmer') {
      this._rot('body', 0, S(ph * 1.5) * 0.12 * s, 0, ww);
      for (let i = 0; i < this.tails.length; i++) this._rot(this.tails[i], 0, S(ph * 1.5 - (i + 1) * 0.9) * 0.45 * s, 0, ww);
      this._root(0, S(ph * 1.5) * 0.04 * h * s, 0, 0.08 * s, 0, 0, 0, ww);
    } else if (a === 'insect') {
      const sw = S(ph * 1.6);
      const L = ['legFL', 'legMR', 'legBL'], Rr = ['legFR', 'legML', 'legBR'];
      for (const n of L) this._rot(n, sw * A * 0.8, sw * 0.3 * s, 0, ww);
      for (const n of Rr) this._rot(n, -sw * A * 0.8, -sw * 0.3 * s, 0, ww);
      this._root(0, Math.abs(C(ph * 1.6)) * 0.03 * h * s, 0, 0, 0, S(ph * 1.6) * 0.04 * s, 0, ww);
      if (this.has('legL')) { this._rot('legL', sw * A, 0, 0, ww); this._rot('legR', -sw * A, 0, 0, ww); }
    } else if (a === 'octo') {
      for (let i = 0; i < this.tents.length; i++) this._rot(this.tents[i], S(ph * 1.4 + i * 1.57) * 0.55 * s, 0, C(ph * 1.4 + i * 1.57) * 0.25 * s, ww);
      this._root(0, Math.abs(S(ph * 1.4)) * 0.06 * h * s, 0, 0.1 * s, 0, 0, S(ph * 2.8) * 0.06 * s, ww);
    } else if (a === 'blob') {
      const hp = (ph * 0.45) % 1, j = S(hp * Math.PI);
      this._root(0, j * 0.18 * h * s, 0, 0.1 * s, 0, 0, (j > 0.2 ? 0.18 * j : -0.2 * (1 - j)) * s, ww);
    }
  }

  // ------------------------------------------------ actions
  _action(name, u, w, tsec) {
    const h = this.h;
    switch (name) {
      case 'attack': case 'attack2': {
        const wind = bell(u, 0, 0.45), strike = bell(u, 0.35, 0.8);
        const tw = name === 'attack2' ? 1 : 0;
        this._root(0, strike * 0.04 * h, (strike * 0.28 - wind * 0.08) * h, (strike * 0.25 - wind * 0.15) * (1 - tw), (strike * 0.6 - wind * 0.3) * tw, 0, -strike * 0.1 + wind * 0.06, w);
        this._rot('body', strike * 0.25 - wind * 0.2, tw * (strike - wind) * 0.4, 0, w);
        this._rot('head', strike * 0.3 - wind * 0.35, 0, 0, w);
        this._rot('jaw', strike * 0.6, 0, 0, w);
        this._rot('legFL', -strike * 0.9, 0, 0, w); this._rot('legFR', -strike * 0.7, 0, 0, w);
        this._rot(tw ? 'armR' : 'armL', -strike * 1.9 + wind * 0.6, 0, -strike * 0.2, w);
        this._rot(tw ? 'armL' : 'armR', wind * 0.4, 0, 0, w);
        this._pair('wing', 0, 0, (strike - wind) * 0.9, w);
        for (let i = 0; i < this.tents.length; i++) this._rot(this.tents[i], -strike * 1.2, 0, 0, w);
        for (const t of this.tails) this._rot(t, wind * 0.4, strike * 0.5, 0, w);
        break;
      }
      case 'attack3': case 'slam': {
        const up = bell(u, 0, 0.6), down = ramp(u, 0.5, 0.65) * (1 - ramp(u, 0.75, 1));
        this._root(0, up * 0.45 * h - down * 0.05 * h, up * 0.2 * h, -up * 0.3 + down * 0.35, name === 'attack3' ? ease.cubicOut(ramp(u, 0, 0.6)) * TAU : 0, 0, down * -0.35 + up * 0.15, w);
        this._pair('arm', -up * 2.4 + down * 1.0, 0, 0.2, w);
        this._pair('leg', up * 0.5, 0, 0, w); this._pair('legF', -up * 0.7, 0, 0, w);
        this._rot('jaw', up * 0.7, 0, 0, w);
        this._pair('wing', 0, 0, up * 1.2 - down * 0.6, w);
        break;
      }
      case 'shoot': {
        const k = bell(u, 0.1, 0.55), r = bell(u, 0.3, 0.8);
        this._root(0, 0, (-r * 0.12 + k * 0.03) * h, -r * 0.15, 0, 0, r * 0.08, w);
        this._rot('head', k * 0.2 - r * 0.25, 0, 0, w); this._rot('jaw', k * 0.7, 0, 0, w);
        this._pair('arm', -k * 1.5, 0, 0, w);
        for (let i = 0; i < this.tents.length; i++) this._rot(this.tents[i], -k * (i % 2 ? 1.4 : 0.6), 0, 0, w);
        this._pair('wing', 0, 0, -r * 0.6, w);
        break;
      }
      case 'cast': {
        const k = bell(u, 0, 1), sh = S(tsec * 50) * 0.02 * k;
        this._root(sh, k * 0.12 * h, 0, -k * 0.25, 0, sh, k * 0.12, w);
        this._rot('head', -k * 0.45, 0, 0, w); this._rot('jaw', k * 0.5, 0, 0, w);
        this._pair('arm', -k * 0.6, 0, k * 1.5, w);
        this._pair('wing', 0, 0, -k * 1.1, w);
        for (let i = 0; i < this.tents.length; i++) this._rot(this.tents[i], -k * 0.9, 0, k * 0.4, w);
        this._pair('ear', -k * 0.4, 0, 0, w);
        for (const t of this.tails) this._rot(t, -k * 0.5, 0, 0, w);
        break;
      }
      case 'dodge': {
        const j = S(u * Math.PI);
        this._root(0, j * 0.3 * h, 0, 0, 0, ease.inOut(u) * TAU * (this.p.dodgeSpin ?? 0) , (u < 0.12 ? -0.25 : u > 0.85 ? -0.2 : 0.15), w);
        this._root(0, 0, 0, 0, 0, S(u * TAU) * 0.35, 0, w);
        this._pair('leg', -j * 0.7, 0, 0, w); this._pair('arm', -j * 0.8, 0, j * 0.6, w);
        break;
      }
      case 'parry': {
        const k = bell(u, 0, 0.7), fl = bell(u, 0.15, 0.4);
        this._root(0, -k * 0.05 * h, -k * 0.06 * h, -k * 0.15, 0, 0, -k * 0.08 + fl * 0.1, w);
        this._rot('armL', -k * 1.6, -k * 0.6, -k * 0.3, w); this._rot('armR', -k * 1.6, -k * 0.6, -k * 0.3, w);
        this._rot('head', k * 0.25, 0, 0, w);
        this._pair('legF', -k * 0.4, 0, 0, w);
        this._pair('wing', -k * 0.5, k * 0.9, 0, w);
        for (let i = 0; i < this.tents.length; i++) this._rot(this.tents[i], -k * 1.0, 0, 0, w);
        break;
      }
      case 'grab': case 'throw': {
        const reach = bell(u, 0, 0.55), hold = ramp(u, 0.4, 0.6);
        const spin = name === 'throw' ? ease.inOut(ramp(u, 0.2, 0.8)) * TAU : 0;
        this._root(0, 0, reach * 0.3 * h, reach * 0.2, spin, 0, 0, w);
        this._pair('arm', -1.6 * Math.max(reach, hold * 0.8), 0.4 * hold, 0, w);
        this._rot('jaw', reach * 0.8, 0, 0, w);
        this._pair('legF', -reach * 1.0, 0, 0, w);
        for (let i = 0; i < this.tents.length; i++) this._rot(this.tents[i], -reach * 1.6 + hold * 0.5, 0, 0, w);
        break;
      }
      case 'hit': case 'bigHit': {
        const k = name === 'bigHit' ? 1.6 : 1, r = bell(u, 0, 1);
        this._root(0, 0, -r * 0.1 * h * k, -r * 0.25 * k, 0, S(u * 30) * 0.05 * r, r * 0.12, w);
        this._rot('head', -r * 0.35, 0, 0, w); this._rot('body', -r * 0.2, 0, 0, w);
        this._pair('arm', -r * 0.5, 0, r * 0.6, w); this._pair('ear', r * 0.5, 0, 0, w);
        break;
      }
      case 'roar': {
        const k = bell(u, 0.05, 0.95), sh = S(tsec * 45) * 0.025 * k;
        this._root(sh, k * 0.05 * h, 0, -k * 0.3, sh, 0, k * 0.12, w);
        this._rot('head', -k * 0.55, 0, 0, w); this._rot('jaw', k * 0.9, 0, 0, w);
        this._pair('arm', -k * 0.4, 0, k * 1.2, w); this._pair('wing', 0, 0, -k * 1.2, w);
        this._pair('ear', -k * 0.6, 0, 0, w);
        break;
      }
      case 'victory': case 'happy': case 'hop': {
        const n = name === 'victory' ? 2 : name === 'hop' ? 1 : 2;
        const ph = (u * n) % 1, j = S(ph * Math.PI);
        this._root(0, j * (name === 'victory' ? 0.35 : 0.2) * h, 0, 0, name === 'victory' ? ease.inOut(ramp(u, 0.5, 1)) * TAU : 0, 0, j > 0.2 ? 0.12 * j : -0.15, w);
        this._pair('arm', -j * 0.6, 0, 1.9 * (name === 'victory' ? 1 : j), w);
        this._pair('wing', 0, 0, -j * 1.2, w); this._pair('ear', -j * 0.5, 0, 0, w);
        for (const t of this.tails) this._rot(t, -0.3, S(u * 40) * 0.4, 0, w);
        break;
      }
      case 'spawn': {
        const s = ease.backOut(u);
        this._root(0, (1 - s) * 0.2 * h, 0, 0, (1 - u) * TAU * 0.5, 0, (s - 1) * 0.9 + bell(u, 0.5, 1) * 0.1, w);
        break;
      }
      case 'nod': this._rot('head', bell(u, 0, 0.5) * 0.4 + bell(u, 0.5, 1) * 0.3, 0, 0, w); break;
      case 'shake': this._rot('head', 0.1, S(u * TAU * 2.5) * 0.4 * (1 - u), 0, w); break;
      case 'eat': { const k = Math.abs(S(u * TAU * 3)); this._rot('head', k * 0.4, 0, 0, w); this._rot('jaw', k * 0.5, 0, 0, w); this._rot('armL', -1.6 * bell(u, 0, 1), 0.5, 0, w); break; }
      case 'wave': { const k = bell(u, 0, 1); this._rot('armR', -0.3 * k, 0, 2.6 * k + S(u * TAU * 3) * 0.35 * k, w); this._rot('head', 0, -0.15, 0.12 * k, w); break; }
      case 'point': case 'command': { const k = bell(u, 0, 1); this._rot('armR', -1.55 * k, 0.15, 0, w); this._root(0, 0, 0.04 * k, 0.1 * k, 0, 0, 0, w); this._rot('head', 0.05, 0, 0, w); if (name === 'command') this._rot('armL', 0, 0, 0.4 * k, w); break; }
      case 'cheer': { const ph = (u * 2) % 1, j = S(ph * Math.PI); this._pair('arm', -0.3, 0, 2.7 + S(u * 30) * 0.15, w); this._root(0, j * 0.18 * h, 0, 0, 0, 0, j * 0.1, w); break; }
      case 'bow': { const k = bell(u, 0, 1); this._rot('body', k * 0.7, 0, 0, w); this._rot('head', k * 0.3, 0, 0, w); this._pair('arm', k * 0.3, 0, 0, w); break; }
      case 'shrug': { const k = bell(u, 0, 1); this._pair('arm', -0.4 * k, 0, 0.9 * k, w); this._root(0, k * 0.03 * h, 0, 0, 0, 0, 0, w); this._rot('head', 0, 0, 0.25 * k, w); break; }
      case 'think': { const k = bell(u, 0, 1); this._rot('armR', -2.2 * k, 0.7 * k, 0, w); this._rot('head', -0.15 * k, 0.2 * k, 0.15 * k, w); break; }
      case 'shocked': { const k = bell(u, 0, 0.5), r = ramp(u, 0, 0.3); this._root(0, k * 0.25 * h, -r * 0.15 * h, -0.2 * k, 0, 0, k * 0.2, w); this._pair('arm', -0.5, 0, 2.2 * k, w); break; }
      case 'stomp': { const k = Math.abs(S(u * TAU * 2)); this._rot('legL', -k * 0.8, 0, 0, w); this._pair('arm', 0, 0, 0.5, w); this._root(0, k * 0.04 * h, 0, 0, 0, 0, -k * 0.08, w); this._rot('head', 0.2, 0, 0, w); break; }
      case 'laugh': { const k = bell(u, 0, 1); this._root(0, 0, 0, -0.15 * k + S(u * 50) * 0.04, 0, 0, S(u * 50) * 0.04, w); this._rot('head', -0.3 * k, 0, 0, w); this._pair('arm', 0, 0, 0.3 * k, w); break; }
      case 'throwKey': { const wind = bell(u, 0, 0.45), rel = bell(u, 0.35, 0.8); this._rot('armR', wind * 2.4 - rel * 2.8, 0, 0.2, w); this._root(0, 0, rel * 0.05 * h, rel * 0.2 - wind * 0.1, -wind * 0.3 + rel * 0.3, 0, 0, w); break; }
      case 'headbang': { const k = bell(u, 0, 1); const b = S(u * TAU * 5); this._rot('head', b * 0.45 * k, 0, 0, w); this._rot('body', b * 0.12 * k, 0, 0, w); this._root(0, Math.abs(b) * 0.03 * h * k, 0, 0, 0, 0, b * 0.04 * k, w); this._pair('wing', 0, 0, -0.5 * k + b * 0.3 * k, w); this._pair('ear', b * 0.5 * k, 0, 0, w); break; }
      case 'spin': this._root(0, bell(u, 0, 1) * 0.12 * h, 0, 0, ease.inOut(u) * TAU, 0, 0, w); break;
      case 'stretch': { const k = bell(u, 0, 1); this._root(0, 0, 0, -k * 0.2, 0, 0, k * 0.15, w); this._rot('head', -k * 0.5, 0, 0, w); this._rot('jaw', k * 0.8, 0, 0, w); this._pair('arm', -k * 0.5, 0, 2 * k, w); this._pair('legF', -k * 0.8, 0, 0, w); break; }
      case 'scratch': { const k = bell(u, 0, 1); this._rot('legBL', -k * 1.2 + S(u * 60) * 0.2 * k, 0, -k * 0.4, w); this._rot('armL', -2.4 * k, 0, 0.4 * k + S(u * 50) * 0.15 * k, w); this._rot('head', 0, 0, -0.35 * k, w); break; }
      case 'shakeoff': { const k = bell(u, 0, 1); this._root(0, 0, 0, 0, S(u * 70) * 0.25 * k, S(u * 70) * 0.12 * k, 0, w); this._pair('ear', S(u * 70) * 0.5 * k, 0, 0, w); break; }
      case 'sniff': { const k = bell(u, 0, 1); this._rot('head', k * 0.45 + S(u * 60) * 0.03, S(u * 6) * 0.25 * k, 0, w); this._root(0, -k * 0.03 * h, 0, k * 0.12, 0, 0, 0, w); break; }
      case 'flex': { const k = bell(u, 0, 1); this._pair('arm', -0.2 * k, 0, 1.6 * k, w); this._root(0, 0, 0, 0, 0, 0, k * 0.12 + S(u * 40) * 0.02 * k, w); this._rot('jaw', k * 0.6, 0, 0, w); break; }
      case 'sway': { const k = bell(u, 0, 1); this._root(0, 0, 0, 0, 0, S(u * TAU * 2) * 0.2 * k, 0, w); this._rot('head', 0, 0, S(u * TAU * 2) * 0.2 * k, w); break; }
      default: break;
    }
  }

  // ------------------------------------------------ modes
  _mode(name, t, w) {
    const h = this.h;
    switch (name) {
      case 'stun': {
        this._root(S(t * 6) * 0.03 * h, 0, C(t * 6) * 0.03 * h, S(t * 6) * 0.12, 0, C(t * 6) * 0.12, 0, w);
        this._rot('head', S(t * 6 + 1) * 0.25, C(t * 6) * 0.3, 0, w);
        break;
      }
      case 'sleep': {
        const br = S(t * 1.6);
        this._root(0, -0.12 * h, 0, 0.1, 0, 0.18, -0.12 + br * 0.03, w);
        this._rot('head', 0.35, 0.2, 0.2, w); this._pair('leg', -0.9, 0, 0.3, w); this._pair('legF', -1.2, 0, 0, w);
        this._pair('arm', 0.3, 0, 0.1, w); this._pair('ear', 0.6, 0, 0, w); this._pair('wing', 0, 0, 0.3, w);
        break;
      }
      case 'faint': {
        const k = ease.bounceOut(clamp01(t / 0.6));
        this._root(0, -0.06 * h * k, 0, 0, 0, 1.45 * k, -0.08 * k, w);
        this._pair('leg', 0.4 * k, 0, 0.2 * k, w); this._rot('head', 0.2 * k, 0, 0, w);
        break;
      }
      case 'charge': {
        const sh = S(t * 55) * 0.025 * Math.min(1, t * 0.6 + 0.4);
        this._root(sh, -0.06 * h, 0, 0.18, sh, sh, -0.12 - Math.min(0.08, t * 0.03), w);
        this._rot('head', 0.2, 0, 0, w); this._pair('legF', -0.3, 0, 0, w); this._pair('arm', -0.5, 0, 0.5, w);
        this._pair('wing', 0.3, 0.6, -0.4, w);
        for (const tl of this.tails) this._rot(tl, -0.6, 0, 0, w);
        break;
      }
      case 'guard': {
        this._root(0, -0.08 * h, 0, 0.2, 0, 0, -0.15, w);
        this._pair('arm', -1.3, -0.7, -0.2, w); this._rot('head', 0.35, 0, 0, w); this._pair('legF', -0.5, 0, 0, w);
        break;
      }
      case 'grabbed': {
        this._root(0, 0.25 * h, 0, S(t * 9) * 0.1, 0, C(t * 7) * 0.15, 0.1, w);
        this._pair('leg', S(t * 14) * 0.5, 0, 0, w); this._pair('arm', -0.4, 0, 1.2 + S(t * 12) * 0.3, w);
        break;
      }
      case 'sit': {
        this._root(0, -0.18 * h, -0.05 * h, 0, 0, 0, 0, w);
        this._pair('leg', -1.5, 0, 0, w); this._rot('legBL', 0, 0, 0, w);
        break;
      }
      case 'float': {
        this._root(0, (0.4 + S(t * 2) * 0.05) * h, 0, 0, t * 0.6, 0, 0, w);
        this._pair('arm', 0, 0, 0.8, w); this._pair('wing', 0, 0, -0.6, w);
        break;
      }
      case 'sad': this._rot('head', 0.35, 0, 0, w); this._pair('ear', 0.8, 0, 0, w); this._pair('arm', 0.1, 0, -0.05, w); break;
      case 'angry': this._root(S(t * 30) * 0.008, 0, 0, 0.05, 0, 0, 0, w); this._rot('head', 0.15, 0, 0, w); this._pair('arm', -0.2, 0, 0.3, w); break;
      case 'happy': this._root(0, Math.abs(S(t * 6)) * 0.05 * h, 0, 0, 0, 0, 0, w); break;
      default: break;
    }
  }

  // ------------------------------------------------ face
  _face(dt) {
    const face = this.rig.face;
    if (!face) return;
    if (this.faceT > 0) { this.faceT -= dt; if (this.faceT <= 0) this.faceOverride = null; }
    let expr = 'normal';
    const a = this.action;
    if (this.faceOverride) expr = this.faceOverride;
    if (a && a.def.face) expr = a.def.face;
    if (this.mode && this.modeW > 0.5 && MODE_FACE[this.mode]) expr = MODE_FACE[this.mode];
    // blink
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blinking = 0.13; this.blinkT = 1.8 + Math.random() * 3.5; }
    if (this.blinking > 0) { this.blinking -= dt; if (expr === 'normal' || expr === 'angry' || expr === 'sad') expr = 'closed'; }
    for (const eye of face.eyes) {
      const want = eye[expr] ? expr : 'normal';
      for (const k in eye) eye[k].visible = k === want;
    }
    if (face.mouth) {
      let open = false;
      if (a && a.def.mouth) open = a.t / a.dur < a.def.mouth;
      if (this.talking) { this.talkT -= dt; if (this.talkT <= 0) { this.mouthOpen = !this.mouthOpen; this.talkT = 0.06 + Math.random() * 0.1; } open = this.mouthOpen; }
      if (this.mode === 'sleep' || this.mode === 'faint') open = this.mode === 'faint';
      const m = face.mouth;
      if (m.open) m.open.visible = open;
      if (m.closed) m.closed.visible = !open || !m.open;
    }
  }
}
