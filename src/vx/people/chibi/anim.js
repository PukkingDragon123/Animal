// The toon people's procedural animator (the Actor contract: play, update, clips, spec.fidget, face).
//  - locomotion from the root motion: a phase-driven walk that blends into a run (stride sized so the
//    planted foot barely slides), hip bob / sway / twist, counter-swinging arms, lean into speed and turns
//  - idle: breathing, weight shifts, a girl's contrapposto, glances around
//  - gestures: arm targets solved with two-bone IK (hands go where the pose says: chin, hips, face, lap),
//    plus spine / head offsets, hops and squash, blended in and out
//  - face: expressions, blinks, glances, a talking mouth → the person's pixel face
//  - springs: twin tails / ponytail / long hair, the skirt (sways and flares), the ahoge
// Axes: +x is the character's left, +y up, +z forward. A thigh / arm swings forward on −x.
import * as THREE from '../../../../vendor/three.module.js';
import { BONES } from './rig.js';

const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();

// ---------------------------------------------------------------- faces
export const EXPR = {
  neutral: {},
  smile: { corner: 1.5, cheek: 0.6, mouthW: 1.05, brow: 0.3 },
  happy: { corner: 2.2, open: 2.4, teeth: 1, cheek: 1, brow: 0.7, mouthW: 1.1, upper: 0.85 },
  grin: { corner: 2.6, cheek: 1.2, teeth: 1, open: 1.4, mouthW: 1.16, brow: 0.6, upper: 0.82 },
  surprised: { brow: 2.6, upper: 1.35, open: 4.4, round: 0.9, mouthW: 0.7 },
  sad: { inner: 2.2, brow: -0.3, corner: -1.3, upper: 0.8, lookY: 1 },
  angry: { inner: -2.0, brow: -0.6, upper: 0.85, corner: -0.8, mouthW: 0.9 },
  sleepy: { upper: 0.4, brow: -0.2, open: 0.8, round: 0.4, mouthW: 0.85, lookY: 0.6 },
  duck: { round: 1.1, open: 1.3, mouthW: 0.52, brow: 0.9, cheek: 0.5, upper: 0.92 },
  cool: { corner: 0.9, upper: 0.74, brow: -0.2, cheek: 0.3 },
  asleep: { upper: 0, open: 0.4, round: 0.3, mouthW: 0.7 },
};
const EKEYS = ['corner', 'cheek', 'mouthW', 'brow', 'open', 'teeth', 'upper', 'round', 'inner', 'lookY'];
const EDEF = { mouthW: 1, upper: 1 };

// ---------------------------------------------------------------- gestures
// g(t, a) → { L, R: [x, y, z, poleX, poleY, poleZ] hand (wrist) targets from the shoulder in arm lengths
//   (x is outward for either arm), spine / chest / head: [x, y, z] radians, hips: [x, y, z] in head units,
//   sh: shoulder shrug (head units), hop }
// a: anchors in arm lengths from the shoulder: cx (the body's midline, as an outward x), chin, eye, fz (face front)
const S = Math.sin, E_ = Math.exp, A0 = (t) => sstep(0, 0.3, t);
const hand = (a, dx, dy, dz) => [a.cx + dx, a.chin + dy, a.fz + dz];
const G = {
  talk: (t) => ({ R: [0.24 + 0.05 * S(t * 2.3), -0.5 + 0.09 * Math.abs(S(t * 3.1)), 0.36, 1, -0.6, -0.4], w: { R: 0.75 } }),
  explain: (t) => ({ R: [0.3 + 0.08 * S(t * 3), -0.22 + 0.1 * S(t * 5), 0.55, 1, -1, 0], L: [0.2, -0.45, 0.4, 1, -0.6, -0.4] }),
  wave: (t) => ({ R: [0.44 + 0.13 * S(t * 12), 0.64, 0.16, 1, -0.4, -0.6], head: [0, 0.06, -0.1] }),
  point: () => ({ R: [0.14, 0.22, 0.94, 1, -1, 0], chest: [0, -0.12, 0] }),
  think: (t, a) => ({ R: [...hand(a, 0.1, -0.06, 0.06), 0.3, -1, 0.2], L: [a.cx * 0.6, -0.42, 0.34, 1, -0.5, -0.4], head: [0.06, 0.12, 0.13 + 0.02 * S(t)] }),
  bow: (t) => { const k = sstep(0, 0.5, t) * (1 - sstep(1.3, 1.9, t)); return { spine: [0.45 * k, 0, 0], chest: [0.18 * k, 0, 0], head: [0.15 * k, 0, 0], L: [-0.1, -0.86, 0.26, 1, -0.5, -0.3], R: [-0.1, -0.86, 0.26, 1, -0.5, -0.3] }; },
  cheer: (t) => ({ L: [0.32 + 0.05 * S(t * 14), 0.9, 0.12, 1, 0, -0.4], R: [0.32 + 0.05 * S(t * 14 + 1), 0.9, 0.12, 1, 0, -0.4], spine: [-0.08, 0, 0], hop: 0.08 }),
  win: (t) => ({ R: [0.1, 0.96, 0.1, 1, 0, 0], L: [0.3, -0.26 + 0.12 * Math.max(0, S(t * 12)), 0.42, 1, -1, 0], spine: [-0.08, 0, 0], hop: 0.12 }),
  jump: () => ({ L: [0.42, 0.3, 0.16, 1, -0.5, -0.4], R: [0.42, 0.3, 0.16, 1, -0.5, -0.4], hop: 0.22 }),
  clap: (t, a) => { const o = 0.07 * Math.max(0, S(t * 14)); return { L: [a.cx + 0.08 + o, -0.06, 0.5, 1, -0.6, -0.2], R: [a.cx + 0.08 + o, -0.06, 0.5, 1, -0.6, -0.2] }; },
  shrug: () => ({ L: [0.44, -0.42, 0.42, 0.4, -1, -0.4], R: [0.44, -0.42, 0.42, 0.4, -1, -0.4], sh: 0.1, head: [0, 0, 0.12] }),
  peace: (t, a) => ({ R: [...hand(a, 0.14, 0.12, 0.1), 1, -0.6, 0], head: [0, -0.06, -0.14] }),
  dab: (t, a) => ({ R: [0.92, 0.42, 0.02, 0, -1, 0], L: [...hand(a, -0.12, 0.1, 0.14), 1, -0.2, 0.3], head: [0.45, -0.3, 0], chest: [0.1, -0.2, 0] }),
  flex: () => ({ L: [0.56, 0.42, 0.04, 1, -0.8, 0], R: [0.56, 0.42, 0.04, 1, -0.8, 0], spine: [-0.06, 0, 0] }),
  shock: (t, a) => ({ L: [...hand(a, 0.2, 0.0, 0.26), 1, -1, 0], R: [...hand(a, 0.2, 0.0, 0.26), 1, -1, 0], spine: [-0.14 * E_(-t * 3) - 0.03, 0, 0], hop: t < 0.4 ? 0.05 : 0 }),
  angry: (t) => ({ L: [0.22, -0.5 + 0.02 * S(t * 20), 0.35, 1, -0.6, -0.6], R: [0.22, -0.5 + 0.02 * S(t * 20 + 2), 0.35, 1, -0.6, -0.6], spine: [0.1 + S(t * 18) * 0.012, 0, 0], head: [0.06, 0, 0] }),
  laugh: (t, a) => ({ R: [a.cx * 0.6, -0.5, 0.36, 1, -0.5, -0.4], L: [a.cx * 0.4, -0.25 + 0.04 * S(t * 9), 0.44, 1, -0.5, -0.4], spine: [-0.07 + Math.abs(S(t * 9)) * 0.07, 0, 0], head: [-0.12, 0, 0.06] }),
  sad: () => ({ L: [0.04, -0.95, 0.16, 1, 0, -0.5], R: [0.04, -0.95, 0.16, 1, 0, -0.5], spine: [0.14, 0, 0], head: [0.26, 0, 0] }),
  cry: (t, a) => ({ L: [...hand(a, 0.13, 0.12, 0.08), 1, -1, 0], R: [...hand(a, 0.13, 0.12, 0.08), 1, -1, 0], spine: [0.16 + S(t * 14) * 0.012, 0, 0], head: [0.16, 0, 0] }),
  hurt: (t, a) => ({ L: [a.cx * 0.6, -0.36, 0.34, 1, -0.5, -0.4], spine: [-0.24 * E_(-t * 4) + 0.1, 0, 0.06], head: [0.1, 0, 0.08] }),
  phone: (t, a) => ({ R: [a.cx * 0.55, -0.1, 0.5, 1, -1, -0.2], L: [a.cx * 0.75, -0.16, 0.47, 1, -1, -0.2], head: [0.38, 0, 0], prop: 'phone' }),
  sip: (t, a) => { const up = sstep(0, 0.3, (t % 4) - 1) * (1 - sstep(0, 0.3, (t % 4) - 2.4)); return { R: up > 0.01 ? [...hand(a, 0.06, lerp(-0.45, -0.1, up), lerp(0.22, 0.12, up)), 1, -1, 0] : [a.cx * 0.5, -0.4, 0.4, 1, -1, 0], head: [-0.12 * up, 0, 0], prop: 'cup' }; },
  selfie: () => ({ R: [0.62, 0.2, 0.62, 1, -0.8, -0.2], L: [0.03, -0.64, 0.05, 1, -0.3, -0.6], head: [-0.06, -0.22, -0.12], chest: [0, -0.12, 0.04], prop: 'phone' }),
  throw: (t) => { const k = sstep(0.28, 0.42, t); return { R: [lerp(0.4, 0.15, k), lerp(0.55, 0.22, k), lerp(-0.45, 0.92, k), 1, -0.6, 0], chest: [lerp(-0.1, 0.12, k), lerp(-0.35, 0.3, k), 0], spine: [lerp(-0.05, 0.1, k), 0, 0] }; },
  stretch: (t) => ({ L: [0.12, 0.99, 0.02, 1, 0, 0], R: [0.12, 0.99, 0.02, 1, 0, 0], spine: [-0.12, 0, 0.05 * S(t * 1.4)], head: [-0.2, 0, 0], hop: 0 }),
  wheeze: (t) => ({ L: [0.1, -1.0, 0.46, 1, 0, 0], R: [0.1, -1.0, 0.46, 1, 0, 0], spine: [0.42 + S(t * 6) * 0.03, 0, 0], head: [-0.25, 0, 0] }),
  nod: (t) => ({ head: [S(t * 9) * 0.16 * E_(-t * 1.2), 0, 0] }),
  facepalm: (t, a) => ({ R: [...hand(a, 0.16, 0.24, 0.06), 1, -1, 0], head: [0.25, 0, 0], spine: [0.06, 0, 0] }),
  proud: () => ({ L: [0.03, -0.64, 0.05, 1, -0.3, -0.6], R: [0.03, -0.64, 0.05, 1, -0.3, -0.6], spine: [-0.08, 0, 0], head: [-0.1, 0, 0] }),
  shy: (t, a) => ({ L: [a.cx * 0.35, -0.8, 0.3, 1, 0, -0.5], R: [a.cx * 0.35, -0.8, 0.3, 1, 0, -0.5], head: [0.18, 0.1, 0.12 + S(t * 1.5) * 0.04], hips: [0.04 * S(t * 1.5), 0, 0] }),
  hug: (t, a) => ({ L: [a.cx + 0.12, -0.1, 0.7, 1, 0, -0.3], R: [a.cx + 0.12, -0.1, 0.7, 1, 0, -0.3] }),
  menace: (t, a) => ({ L: [a.cx - 0.14, -0.38, 0.33, 1, -0.4, 0.1], R: [a.cx - 0.1, -0.31, 0.37, 1, -0.4, 0.1], spine: [0.06, 0, 0], head: [0.05, 0, 0] }),
  wet: (t, a) => ({ L: [a.cx - 0.1, -0.2, 0.38, 1, -0.5, 0], R: [a.cx - 0.08, -0.14, 0.4, 1, -0.5, 0], hips: [S(t * 40) * 0.012, 0, 0], head: [0.15, 0, 0] }),
  dance: (t) => { const b = t * 112 / 60 * Math.PI, u = Math.max(0, S(b)), v = Math.max(0, -S(b)); return { L: [0.36, -0.2 + 0.7 * u, 0.3, 1, -0.6, -0.2], R: [0.36, -0.2 + 0.7 * v, 0.3, 1, -0.6, -0.2], hips: [0.12 * S(b), -0.06 * Math.abs(S(b * 2)), 0], spine: [0, 0, -0.08 * S(b)], head: [0, 0, 0.1 * S(b)], bob: true }; },
};
// clip → { g: gesture, e: expression, talk, dur (one-shot), sit, lie }
const CLIPS = {
  idle: {}, walk: {}, run: {},
  talk: { g: 'talk', talk: true }, explain: { g: 'explain', talk: true },
  wave: { g: 'wave', e: 'smile', dur: 2.6 }, point: { g: 'point', dur: 2.6 }, think: { g: 'think' }, bow: { g: 'bow', e: 'smile', dur: 2 },
  cheer: { g: 'cheer', e: 'happy', dur: 2.6 }, win: { g: 'win', e: 'grin', dur: 3 }, jump: { g: 'jump', e: 'happy', dur: 1.3 },
  clap: { g: 'clap', e: 'happy', dur: 2.6 }, shrug: { g: 'shrug', dur: 2.2 }, peace: { g: 'peace', e: 'happy', dur: 3.2 }, dab: { g: 'dab', e: 'smile', dur: 2.2 }, flex: { g: 'flex', e: 'grin', dur: 2.6 },
  shock: { g: 'shock', e: 'surprised' }, angry: { g: 'angry', e: 'angry', talk: true }, laugh: { g: 'laugh', e: 'grin', talk: true },
  sad: { g: 'sad', e: 'sad' }, cry: { g: 'cry', e: 'sad' }, hurt: { g: 'hurt', e: 'angry', dur: 1.8 },
  phone: { g: 'phone' }, sip: { g: 'sip', e: 'smile' }, selfie: { g: 'selfie', e: 'duck' }, throw: { g: 'throw', dur: 1.4 },
  stretch: { g: 'stretch', e: 'sleepy', dur: 3 }, wheeze: { g: 'wheeze', e: 'sleepy' }, nod: { g: 'nod', e: 'smile', dur: 1.8 },
  facepalm: { g: 'facepalm', e: 'sad' }, proud: { g: 'proud', e: 'cool' }, shy: { g: 'shy', e: 'smile' }, dance: { g: 'dance', e: 'happy' },
  hug: { g: 'hug', e: 'happy' }, menace: { g: 'menace', e: 'angry' }, nope: { g: 'menace', e: 'angry' }, wet: { g: 'wet', e: 'sad' },
  sit: { sit: true }, sitPhone: { sit: true, g: 'phone' }, sitSad: { sit: true, e: 'sad', g: 'sad' }, sleep: { lie: true, e: 'asleep' },
};

// a damped spring (semi-implicit, sub-stepped)
function spring(s, target, dt, k = 70, c = 9) {
  const n = Math.max(1, Math.ceil(dt / 0.012)), h = dt / n;
  for (let i = 0; i < n; i++) { s.v += (-(s.x - target) * k - s.v * c) * h; s.x += s.v * h; }
  return s.x;
}

export class ToonAnim {
  constructor(p) {
    this.p = p; this.b = p.b; this.D = p.D; this.J = p.J; this.clips = CLIPS;
    this.spec = { fidget: { clips: ['wave', 'shrug', 'think', 'phone', 'stretch'] } };
    this.cur = 'idle'; this.c = CLIPS.idle; this.t = 0; this.gw = 0; this.sitK = 0; this.lieK = 0;
    this.phase = Math.random() * 6.28; this.speed = 0; this.prev = null; this.prevYaw = null; this.yawRate = 0; this.vel = [0, 0]; this.acc = [0, 0];
    this.hopY = 0; this.hopV = 0; this.look = [0, 0]; this.glance = [0, 0]; this.glanceT = 1 + Math.random() * 3;
    this.blinkT = 1 + Math.random() * 3; this.sacc = 0; this.saccT = 1; this.talkT = 0; this.talkOpen = 0;
    this.expr = 'neutral'; this.hold = 0; this.override = null;
    this.E = { corner: 0, cheek: 0, mouthW: 1, brow: 0, open: 0, teeth: 0, upper: 1, round: 0, inner: 0, lookY: 0, blink: 0, lookX: 0 };
    this.sp = { tx: { x: 0, v: 0 }, tz: { x: 0, v: 0 }, sx: { x: 0, v: 0 }, sz: { x: 0, v: 0 }, flare: { x: 0, v: 0 }, ah: { x: 0, v: 0 } };
    const D = this.D, A = D.uarm + D.farm, sh = this.J.uaL;
    this.A = A;
    // anchors from the shoulder, in arm lengths
    this.anc = { cx: -sh[0] / A, chin: (D.chin + D.hu * 0.05 - sh[1]) / A, fz: (D.hd + D.hcz + D.hu * 0.12) / A };
    // rest directions and lengths for the arm IK (in the parent's frame; the rest pose has no rotations)
    this.ikR = {};
    for (const k of ['L', 'R']) {
      const s = this.J['ua' + k], e = this.J['fa' + k], w = this.J['h' + k];
      this.ikR[k] = { dU: new THREE.Vector3(e[0] - s[0], e[1] - s[1], e[2] - s[2]).normalize(), dF: new THREE.Vector3(w[0] - e[0], w[1] - e[1], w[2] - e[2]).normalize(), a: Math.hypot(e[0] - s[0], e[1] - s[1], e[2] - s[2]), c: Math.hypot(w[0] - e[0], w[1] - e[1], w[2] - e[2]) };
    }
    this.qU = new THREE.Quaternion(); this.qF = new THREE.Quaternion(); this.qInv = new THREE.Quaternion(); this.qH = new THREE.Quaternion(); this.qG = new THREE.Quaternion(); this.qC = new THREE.Quaternion();
    this.eul = Object.fromEntries(BONES.map((n) => [n, [0, 0, 0]]));
    const st = (p.spec.walk || {}).style, f = D.f, old = D.old;
    this.style = { sway: f ? 1.6 : 1, armOut: f ? 1.15 : 1, knees: f ? -0.03 : 0.035, hunch: old ? 0.16 : st === 'slouch' ? 0.1 : 0, bounce: D.kid ? 1.6 : st === 'heavy' ? 0.7 : 1, stride: old ? 0.7 : st === 'brisk' ? 1.1 : 1 };
  }
  play(name, o = {}) {
    const c = CLIPS[name] || CLIPS.idle;
    if (name === this.cur && !o.restart) return this;
    // the previous gesture fades out while the new one fades in (the blend weight restarts)
    this.cur = name; this.c = c; this.t = 0; this.gw = c.g ? Math.min(this.gw, 0.3) : this.gw;
    this.lastG = c.g ? c.g : this.lastG;
    this.expr = c.e || 'neutral';
    return this;
  }
  /** a face for a moment (the dialogue layer calls this on emphasis lines) */
  face(expr, hold = 2) { this.override = EXPR[expr] ? expr : null; this.hold = hold; }

  // ---------------------------------------------------------------- per frame
  update(dt, ctx = {}) {
    dt = Math.min(dt, 0.1);
    const p = this.p, b = this.b, D = this.D, hu = D.hu, c = this.c, g = p.group, eul = this.eul;
    this.t += dt;
    // ---- root motion → speed, local velocity and acceleration, turn rate
    g.updateWorldMatrix(true, false); _v.setFromMatrixPosition(g.matrixWorld);
    const yaw = g.rotation.y;
    if (this.prev && dt > 0) {
      const dx = (_v.x - this.prev.x) / dt, dz = (_v.z - this.prev.z) / dt, d = Math.hypot(dx, dz), tele = d > 12;
      const cs = Math.cos(-yaw), sn = Math.sin(-yaw), lx = tele ? 0 : dx * cs + dz * sn, lz = tele ? 0 : -dx * sn + dz * cs;
      const k = 1 - Math.exp(-dt * 10);
      const nvx = this.vel[0] + (lx - this.vel[0]) * k, nvz = this.vel[1] + (lz - this.vel[1]) * k;
      this.acc[0] = (nvx - this.vel[0]) / dt; this.acc[1] = (nvz - this.vel[1]) / dt; this.vel[0] = nvx; this.vel[1] = nvz;
      this.speed += ((tele ? 0 : d) - this.speed) * (1 - Math.exp(-dt * 12));
      let dy = yaw - this.prevYaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      this.yawRate += (dy / dt - this.yawRate) * (1 - Math.exp(-dt * 8));
    }
    this.prev = (this.prev || new THREE.Vector3()).copy(_v); this.prevYaw = yaw;
    // ---- reset to the rest pose
    for (const n of BONES) { b[n].position.copy(p.rest[n]); b[n].quaternion.identity(); b[n].scale.set(1, 1, 1); const e = eul[n]; e[0] = e[1] = e[2] = 0; }
    const sitT = c.sit ? 1 : 0, lieT = c.lie ? 1 : 0, kb = 1 - Math.exp(-dt * 8);
    this.sitK += (sitT - this.sitK) * kb; this.lieK += (lieT - this.lieK) * kb;
    const still = Math.max(this.sitK, this.lieK);
    // ---- gesture weight
    const gf = c.g ? G[c.g] : null, inDur = !c.dur || this.t < c.dur;
    const gTarget = gf && inDur ? 1 : 0;
    this.gw += (gTarget - this.gw) * (1 - Math.exp(-dt * (gTarget ? 7 : 5)));
    const gfn = gf || (this.lastG && G[this.lastG]);
    const pose = gfn && this.gw > 0.01 ? gfn(this.t, this.anc) : null;
    const gw = pose ? this.gw : 0;
    // ---- locomotion
    const sp = still > 0.5 ? 0 : this.speed, L = D.hipJ, st = this.style;
    const walkK = sstep(0.05, 0.6, sp), runK = sstep(1.9, 3.0, sp);
    const cyc = L * lerp(1.7, 2.5, runK) * st.stride * (D.kid ? 0.85 : 1);
    this.phase += (sp / cyc) * Math.PI * 2 * dt;
    const ph = this.phase, sn = Math.sin(ph), cs = Math.cos(ph);
    const A = Math.asin(cl(cyc / (4 * L), 0, 0.8)) * walkK;
    // legs
    for (const [s, k, o] of [[1, 'L', 0], [-1, 'R', Math.PI]]) {
      const ps = Math.sin(ph + o), pc = Math.cos(ph + o);
      const thighX = -A * ps - 0.12 * runK * walkK;
      const knee = walkK * (0.06 + lerp(0.7, 1.55, runK) * Math.pow(Math.max(0, Math.cos(ph + o + 0.45)), 1.4)) + (1 - walkK) * 0.02;
      eul['th' + k][0] = thighX; eul['th' + k][2] = s * st.knees * (1 - walkK * 0.5);
      eul['sh' + k][0] = knee;
      eul['ft' + k][0] = -(thighX + knee) * 0.85 + walkK * 0.3 * Math.max(0, -ps) * Math.max(0, -pc);
    }
    // hips: bob, sway, twist
    const bw = (Math.cos(2 * ph) - 1) * 0.5 * L * 0.03 * st.bounce, br = (-Math.cos(2 * ph) - 1) * 0.5 * L * 0.06 * st.bounce;
    b.hips.position.y += lerp(bw, br, runK) * walkK - runK * L * 0.03;
    eul.hips[1] = -0.2 * A * sn; eul.hips[2] = 0.05 * st.sway * sn * walkK * (1 - runK * 0.5);
    b.hips.position.x += 0.012 * st.sway * sn * walkK * hu * 4 * (1 - runK);
    eul.chest[1] = 0.28 * A * sn;
    const lean = 0.03 * walkK + 0.2 * runK + cl(this.acc[1] * 0.02, -0.1, 0.12) * walkK + st.hunch;
    eul.spine[0] += lean * 0.6; eul.chest[0] += lean * 0.4; eul.spine[2] += cl(-this.yawRate * 0.03 * sp, -0.15, 0.15);
    eul.neck[0] -= lean * 0.5; eul.head[1] -= eul.chest[1] * 0.8;
    // arms: counter-swing, elbows bend more in a run
    const armA = lerp(0.32, 0.85, runK) * walkK;
    for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
      const swing = s * armA * sn, fwd = Math.max(0, -swing);
      eul['ua' + k][0] = swing; eul['ua' + k][2] = s * (-0.11 * st.armOut - 0.08 * runK * walkK);
      eul['fa' + k][0] = -(0.14 + lerp(0.2 * fwd * 2, 1.35, runK) * walkK);
      eul['h' + k][0] = -0.1;
    }
    // ---- idle: breathing, weight shift, contrapposto
    const idleK = 1 - walkK, br2 = Math.sin(this.t * 2.1);
    eul.chest[0] -= br2 * 0.012 * idleK; b.chest.position.y += br2 * hu * 0.006 * idleK;
    const shift = Math.sin(this.t * 0.42 + this.phase * 0.1);
    if (idleK > 0.01 && still < 0.5) {
      const cp = (D.f ? 1 : 0.4) * idleK;
      b.hips.position.x += shift * hu * 0.035 * cp; eul.hips[2] += shift * 0.035 * cp; eul.chest[2] -= shift * 0.03 * cp;
      const bend = Math.max(0, shift) * 0.14 * cp, bendR = Math.max(0, -shift) * 0.14 * cp;
      eul.thL[0] -= bend * 0.5; eul.shL[0] += bend; eul.ftL[0] -= bend * 0.5; eul.thR[0] -= bendR * 0.5; eul.shR[0] += bendR; eul.ftR[0] -= bendR * 0.5;
      b.hips.position.y -= (bend + bendR) * hu * 0.04;
    }
    // ---- gesture: spine / head / hips offsets, shoulder shrug, hop
    if (pose) {
      for (const n of ['spine', 'chest', 'head']) if (pose[n]) for (let i = 0; i < 3; i++) eul[n][i] += pose[n][i] * gw;
      if (pose.hips) { b.hips.position.x += pose.hips[0] * hu * gw; b.hips.position.y += pose.hips[1] * hu * gw; }
      if (pose.sh) { b.uaL.position.y += pose.sh * hu * gw; b.uaR.position.y += pose.sh * hu * gw; b.neck.position.y -= pose.sh * hu * 0.4 * gw; }
    }
    // hops: a squashy bounce of the whole body
    const hopA = pose && pose.hop && inDur ? pose.hop * gw : 0;
    if (hopA > 0.005 && this.hopY <= 0 && this.hopV <= 0) this.hopV = Math.sqrt(2 * 9.8 * hopA);
    this.hopV -= 9.8 * dt; this.hopY = Math.max(0, this.hopY + this.hopV * dt); if (this.hopY <= 0 && this.hopV < 0) { this.land = 1; this.hopV = 0; }
    this.land = Math.max(0, (this.land || 0) - dt * 6);
    // ---- seated / lying base poses
    if (this.sitK > 0.01) this.sitPose(sstep(0, 1, this.sitK));
    if (this.lieK > 0.01) this.liePose(sstep(0, 1, this.lieK));
    // ---- Euler → quaternions
    for (const n of BONES) { const e = eul[n]; if (e[0] || e[1] || e[2]) b[n].quaternion.setFromEuler(_e.set(e[0], e[1], e[2], n === 'head' || n === 'neck' || n === 'spine' || n === 'chest' || n === 'hips' ? 'YXZ' : 'XYZ')); }
    if (this.lieK > 0.01) b.hips.quaternion.premultiply(_q.setFromEuler(_e.set(-Math.PI / 2 * sstep(0, 1, this.lieK), 0, 0)));
    // ---- arm IK for the gesture (and the hands on the lap when seated)
    if (pose) for (const [s, k] of [[1, 'L'], [-1, 'R']]) { const T = pose[k]; if (T) this.ik(s, k, T, gw * (pose.w && pose.w[k] !== undefined ? pose.w[k] : 1)); }
    if (this.sitK > 0.01) { const k2 = sstep(0, 1, this.sitK) * (1 - gw * (pose && (pose.L || pose.R) ? 1 : 0)); if (k2 > 0.01) for (const [s, k] of [[1, 'L'], [-1, 'R']]) this.ik(s, k, [0.06, -0.7, 0.42, 1, -0.4, -0.6], k2); }
    // ---- hop + squash on the root
    const sq = 1 + (this.hopV > 0.3 ? 0.04 : 0) - this.land * 0.06;
    b.root.position.y = this.hopY; b.root.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    // ---- look-at (eyes lead, the head and neck follow, the chest a little)
    this.lookAt(dt, ctx, still);
    // ---- springs: tails / long hair, skirt, ahoge
    this.springs(dt, walkK, runK, A, ph);
    // ---- props (phone / cup in the right hand)
    p.showProp(pose && gw > 0.5 ? pose.prop : null);
    // ---- the face
    this.faceUpdate(dt, !!c.talk || !!p.talking);
  }
  /** two-bone IK: T = [x, y, z, poleX, poleY, poleZ] from the shoulder in arm lengths (x outward), blended by w */
  ik(s, k, T, w) {
    if (w <= 0.001) return;
    const R = this.ikR[k], ua = this.b['ua' + k], fa = this.b['fa' + k], a = R.a, c = R.c, Lm = this.A;
    const t = _v.set(s * T[0] * Lm, T[1] * Lm, T[2] * Lm);
    const d = cl(t.length(), Math.abs(a - c) + 1e-3, (a + c) * 0.995); t.normalize();
    const x = (a * a - c * c + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
    const pole = _v2.set(s * T[3], T[4], T[5]); pole.addScaledVector(t, -pole.dot(t)); if (pole.lengthSq() < 1e-6) pole.set(0, -1, -0.2); pole.normalize();
    const E = _v3.copy(t).multiplyScalar(x).addScaledVector(pole, h);
    this.qU.setFromUnitVectors(R.dU, E.clone().normalize());
    const F = t.multiplyScalar(d).sub(E).normalize().applyQuaternion(this.qInv.copy(this.qU).invert());
    this.qF.setFromUnitVectors(R.dF, F);
    ua.quaternion.slerp(this.qU, w); fa.quaternion.slerp(this.qF, w);
    this.b['h' + k].quaternion.slerp(_q2.identity(), w * 0.7);
  }
  sitPose(k) {
    const b = this.b, D = this.D, eul = this.eul, hu = D.hu;
    // the hips sink onto the seat (the root), thighs forward, shins down
    const hy = this.p.rest.hips.y, ty = D.r.thigh * 1.0 + (hy - D.hipJ);
    b.hips.position.y = lerp(b.hips.position.y, ty, k); b.hips.position.z = lerp(b.hips.position.z, -D.r.thigh * 0.5, k);
    for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
      eul['th' + n][0] = lerp(eul['th' + n][0], -Math.PI / 2 + 0.06, k); eul['th' + n][2] = lerp(eul['th' + n][2], s * (D.f ? -0.04 : 0.06), k);
      eul['sh' + n][0] = lerp(eul['sh' + n][0], Math.PI / 2 - 0.1, k); eul['ft' + n][0] = lerp(eul['ft' + n][0], 0.04, k);
    }
    eul.spine[0] = lerp(eul.spine[0], 0.04, k); void hu;
  }
  liePose(k) {
    const b = this.b, D = this.D, eul = this.eul;
    b.hips.position.y = lerp(b.hips.position.y, D.td.hip * 1.1, k);
    for (const n of ['L', 'R']) { eul['th' + n][0] *= 1 - k; eul['sh' + n][0] = lerp(eul['sh' + n][0], 0.05, k); eul['ft' + n][0] = lerp(eul['ft' + n][0], 0.5, k); eul['ua' + n][0] *= 1 - k; eul['fa' + n][0] = lerp(eul['fa' + n][0], -0.3, k); }
    eul.spine[0] *= 1 - k; eul.chest[0] *= 1 - k; eul.head[0] = lerp(eul.head[0], -0.15, k);
  }
  lookAt(dt, ctx, still) {
    const b = this.b, D = this.D, g = this.p.group;
    let want = [this.glance[0], this.glance[1]], has = false;
    if (ctx.look && ctx.look.isVector3 && this.lieK < 0.5) {
      const l = g.worldToLocal(_v.copy(ctx.look)), hx = l.x, hy = l.y - (D.chin + D.hu * 0.4), hz = l.z;
      const yw = Math.atan2(hx, hz), hd = Math.hypot(hx, hz);
      if (Math.abs(yw) < 2.3 && hd > 0.05) { want = [cl(yw, -1.25, 1.25), cl(Math.atan2(hy, hd), -0.6, 0.5)]; has = true; }
    }
    if (!has) {
      // glance around now and then
      this.glanceT -= dt;
      if (this.glanceT < 0) { const r = Math.random(); this.glance = r < 0.45 ? [0, 0] : [(Math.random() - 0.5) * 1.4, (Math.random() - 0.4) * 0.3]; this.glanceT = 1.5 + Math.random() * 3.5; }
      if (this.speed > 0.3) want = [want[0] * 0.3, 0];
    }
    const k = 1 - Math.exp(-dt * 6);
    this.look[0] += (want[0] - this.look[0]) * k; this.look[1] += (want[1] - this.look[1]) * k;
    const y = this.look[0], pch = this.look[1], m = 1 - still * 0.5;
    b.chest.quaternion.multiply(_q.setFromEuler(_e.set(0, y * 0.15 * m, 0)));
    b.neck.quaternion.multiply(_q.setFromEuler(_e.set(-pch * 0.35, y * 0.35, 0, 'YXZ')));
    b.head.quaternion.multiply(_q.setFromEuler(_e.set(-pch * 0.55, y * 0.45, 0, 'YXZ')));
    // the eyes lead toward where the head is still turning
    this.eyeLead = cl((want[0] - this.look[0]) * 3, -1.8, 1.8);
  }
  springs(dt, walkK, runK, A, ph) {
    const sp = this.sp, vx = this.vel[0], vz = this.vel[1], ax = this.acc[0], az = this.acc[1], b = this.b, h = this.p.h;
    const bounce = -Math.cos(2 * ph) * walkK * lerp(0.6, 1.4, runK) + this.hopV * 0.4;
    // tails / long hair: trail behind the motion, swing out in turns, bob with the steps
    const tx = cl(vz * 0.14 + az * 0.02 + bounce * 0.06, -0.4, 0.9), tz = cl(-vx * 0.12 - ax * 0.015 - this.yawRate * 0.12, -0.6, 0.6);
    spring(sp.tx, tx, dt, 55, 6); spring(sp.tz, tz, dt, 55, 6);
    sp.tx.v += bounce * dt * 2.5;
    h.tails[0].x = sp.tx.x; h.tails[0].z = sp.tz.x; h.tails[1].x = sp.tx.x; h.tails[1].z = sp.tz.x;
    // keep the tails hanging down while the head tilts (partly cancel the head's turn relative to the body)
    b.head.getWorldQuaternion(this.qH); this.p.group.getWorldQuaternion(this.qG);
    this.qC.copy(this.qG).invert().multiply(this.qH).invert();
    for (const [n, s] of [['tailL', 1], ['tailR', -1]]) {
      const spread = this.p.twin ? s * 0.12 : 0;
      b[n].quaternion.identity().slerp(this.qC, 0.75).multiply(_q.setFromEuler(_e.set(0.08 + sp.tx.x * 0.9, 0, spread + sp.tz.x * 0.8)));
    }
    // the skirt: trails, sways with the hips, flares with the stride and in a run or spin
    const sx = cl(vz * 0.05 + az * 0.012, -0.15, 0.3), sz = cl(-vx * 0.05 - this.yawRate * 0.04, -0.2, 0.2);
    spring(sp.sx, sx, dt, 80, 8); spring(sp.sz, sz, dt, 80, 8);
    const fl = A * 0.35 + runK * 0.1 + Math.abs(this.yawRate) * 0.03 + Math.max(0, this.hopV) * 0.05;
    spring(sp.flare, fl, dt, 90, 7); sp.flare.v += bounce * dt * 0.4;
    b.skirt.quaternion.setFromEuler(_e.set(sp.sx.x, 0, sp.sz.x));
    const f = 1 + Math.max(-0.05, sp.flare.x); b.skirt.scale.set(f, 1 - (f - 1) * 0.35, f);
    // the ahoge bobs with every step and hop
    spring(sp.ah, 0, dt, 120, 5); sp.ah.v += bounce * dt * 6 + this.yawRate * dt * 0.5;
    b.ahoge.quaternion.setFromEuler(_e.set(sp.ah.x * 0.35, 0, sp.ah.x * 0.2));
  }
  faceUpdate(dt, talking) {
    const E = this.E, k = 1 - Math.exp(-dt * 12);
    if (this.hold > 0) { this.hold -= dt; if (this.hold <= 0) this.override = null; }
    const name = this.override || (this.c.dur && this.t > this.c.dur ? 'neutral' : this.expr), T = EXPR[name] || EXPR.neutral;
    for (const key of EKEYS) E[key] += ((T[key] ?? EDEF[key] ?? 0) - E[key]) * k;
    // talking: syllables of varied size (kept to a few mouth shapes)
    if (talking) {
      this.talkT -= dt;
      if (this.talkT < 0) { const r = Math.random(); this.talkOpen = r < 0.22 ? 0 : r < 0.6 ? 1.2 : 2.2; this.talkT = 0.07 + Math.random() * 0.09; }
    } else this.talkOpen = 0;
    const o = E.open, r = E.round; E.open = Math.max(E.open, this.talkOpen); if (talking && this.talkOpen > 2) E.round = Math.max(r, 0.25);
    // blink (sometimes double)
    this.blinkT -= dt; let blink = 0;
    if (this.blinkT < 0) { const u = -this.blinkT / 0.15; blink = u < 0.4 ? u / 0.4 : u < 1 ? 1 - (u - 0.4) / 0.6 : 0; if (u >= 1) this.blinkT = Math.random() < 0.15 ? 0.2 : 2 + Math.random() * 4; }
    E.blink = blink > 0.6 ? 1 : 0;
    // glances: small saccades plus the eye lead from look-at
    this.saccT -= dt; if (this.saccT < 0) { this.sacc = Math.random() < 0.5 ? 0 : (Math.random() - 0.5) * 1.2; this.saccT = 0.6 + Math.random() * 2.2; }
    E.lookX = Math.round(cl(this.sacc + (this.eyeLead || 0), -1.8, 1.8) * 2) / 2;
    this.p.head.update(E, dt);
    E.open = o; E.round = r;
  }
}
