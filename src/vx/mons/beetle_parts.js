// Shared parts for the Beatlet line (Beatlet → Pepperhorn → Abbeyhorn | Walrusk): bipedal
// rhinoceros/Hercules beetles in the Cobblemon box style. Painters (glossy chitin, segmented
// plates, fur and hair, satin, gold frogging), mirroring helpers, a two-bone leg IK that keeps
// the feet planted, arm posing, an emote() that drives eyes + squash/stretch + brow plates +
// mandibles together, eye darts, and the clips every stage shares (walk, hurt, faint, down, sleep).
//
// Rig convention (every stage uses these bone names):
//   root · thighR/L → shinR/L → footR/L (hips at [∓hipX, hipY, 0]) · pelvis → torso → head
//   torso → armR/L → foreR/L → handR/L · torso → elytraR/L · head → browR/L, mandR/L, horn…, antR/L
//   head → eyeR/eyeL (from eyes.js eyeRig)
import { E, seg, bump, wob, wave } from '../anim.js';
import { defineFx } from '../fx.js';
import { ramp, shift } from './kit.js';
import { blackGold } from '../model.js';

export const TAU = Math.PI * 2, R2D = 180 / Math.PI, PPU = 3;
export const B = (x0, y0, z0, x1, y1, z1, tex, x = {}) => ({ o: [x0, y0, z0], s: [x1 - x0, y1 - y0, z1 - z0], tex, ...x });
// mirror a right-side (−x) part to the left: x flips, y/z rotations flip, texture U flips
export const flipC = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: c.plane === 'x' ? c.mirror : !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
const side = (n) => n && n.replace(/R$/, 'L').replace(/R(\d)$/, 'L$1');
export const flipB = (b) => ({ name: side(b.name), parent: side(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: b.cubes.map(flipC) });
export const both = (...bs) => [...bs, ...bs.map(flipB)];

// ---------------------------------------------------------------- painters
// model-space position of a texel centre on a cube face (honours mirrored cubes)
export function at(face, c, x, y) {
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s, u = (x + 0.5) / PPU, v = (y + 0.5) / PPU, m = !!c.mirror;
  switch (face) {
    case 'south': return [m ? ox + sx - u : ox + u, oy + sy - v, oz + sz];
    case 'north': return [m ? ox + u : ox + sx - u, oy + sy - v, oz];
    case 'east': return [m ? ox : ox + sx, oy + sy - v, oz + sz - u];
    case 'west': return [m ? ox + sx : ox, oy + sy - v, oz + u];
    case 'up': return [m ? ox + sx - u : ox + u, oy + sy, oz + v];
    case 'down': return [m ? ox + sx - u : ox + u, oy, oz + sz - v];
    default: return [ox + u, oy + sy - v, oz + sz];
  }
}
export const band = (cols, face, x, y, h) => (face === 'up' ? cols[0] : face === 'down' ? cols[3] : ramp([cols[0], cols[1], cols[2]], h > 1 ? y / (h - 1) : 0.5, x, y));
export const jit = (x) => (((x * 7919) % 13) + 13) % 13 / 13;
// glossy chitin: clean bands, a lit rim, one specular streak across the lit faces, a few punctures
export function chitin(cols, o = {}) {
  const gl = o.gloss || shift(cols[0], 0.3);
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = band(cols, face, x, y, h);
      if (o.dots !== false && (x * 5 + y * 3) % 13 === 0 && face !== 'down' && face !== 'up') c = shift(c, -0.12);
      if ((face === 'south' || face === 'west' || face === 'up') && o.streak !== false) {
        const d = face === 'up' ? Math.abs(x - y - w * 0.3) : Math.abs(x + y * 0.35 - w * (o.streakAt ?? 0.28));
        if (d < 0.8 && y > 0 && y < h - 1) c = gl; else if (d < 1.8 && y > 0 && y < h - 1) c = shift(c, 0.1);
      }
      p.px(x, y, c);
    }
    if (face !== 'up' && face !== 'down' && o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(cols[0], 0.12));
  };
}
// segmented plates (belly, abdomen): bands with a dark groove and a lit lip every `every` units
export function segs(cols, o = {}) {
  const every = o.every || 1.6;
  return (p, w, h, face, cube) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [, Y] = at(face, cube, x, y), k = (((Y - (o.y0 || 0)) % every) + every) % every;
      let c = band(cols, face, x, y, h);
      if (face !== 'up' && face !== 'down') { if (k < 1 / PPU) c = cols[3]; else if (k < 2 / PPU) c = shift(c, 0.16); }
      p.px(x, y, c);
    }
  };
}
// hair / fur: combed strands (jittered partings), a broken line of shine, ragged tips along the bottom
export function fur(cols, o = {}) {
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (face === 'up') { p.px(x, y, (x + y) % 3 ? cols[1] : cols[0]); continue; }
      if (face === 'down') { p.px(x, y, cols[2]); continue; }
      const part = (x + Math.floor(jit(Math.floor(x / 3)) * 2)) % 3 === 0, v = h > 1 ? y / (h - 1) : 0.5;
      let c = v < 0.5 ? cols[1] : cols[2];
      const sh = Math.round(h * (o.shine ?? 0.3) + Math.sin(x * 0.7) * 0.6);
      if (y === sh && !part && jit(x + 3) > 0.15) c = o.gloss || cols[0]; else if (Math.abs(y - sh) === 1 && !part) c = cols[0];
      else if (part) c = shift(c, -0.15);
      if (o.ragged !== false && y >= h - 1 && (x + Math.floor(jit(x) * 3)) % 3 !== 1) c = 0;
      if (o.ragged !== false && y >= h - 2 && x % 5 === 2) c = 0;
      p.px(x, y, c);
    }
  };
}
// satin cloth: smooth bands with soft diagonal sheen
// long hair and beards: smooth vertical strands, a soft sheen band near the top, a gently uneven tip row
export function locks(cols, o = {}) {
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (face === 'up') { p.px(x, y, (x * 3 + y) % 5 ? cols[1] : cols[0]); continue; }
      if (face === 'down') { p.px(x, y, cols[3]); continue; }
      const v = h > 1 ? y / (h - 1) : 0.5, part = (x + Math.floor(jit(Math.floor(x / 3)) * 2)) % 3 === 0;
      let c = v < 0.3 ? cols[0] : v < 0.75 ? cols[1] : cols[2];
      if (part) c = shift(c, -0.1);
      const sh = Math.round(h * (o.sheen ?? 0.18) + Math.sin(x * 0.6) * 0.5);
      if (y === sh) c = o.gloss || shift(cols[0], 0.12); else if (Math.abs(y - sh) === 1 && !part) c = shift(cols[0], 0.05);
      if (o.tips !== false && y === h - 1 && (x + Math.floor(jit(x) * 2)) % 3 === 1) c = 0;
      p.px(x, y, c);
    }
  };
}
export function satin(cols) {
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = band(cols, face, x, y, h);
      if (face !== 'down' && ((x + y * 2) % 11 === 0 || (x + y * 2) % 11 === 1)) c = shift(c, 0.14);
      p.px(x, y, c);
    }
  };
}
export const GOLD = ['#fff6b0', '#ffd23e', '#d0902a', '#8a561a'];
export const goldP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 4 === 0 && face !== 'down' ? GOLD[0] : band(GOLD, face, x, y, h)); };
export const fringeP = (p, w, h) => { for (let x = 0; x < w; x++) if (x % 2 === 0) for (let y = 0; y < h - (x % 4 === 0 ? 0 : 1); y++) p.px(x, y, y === 0 ? GOLD[0] : y > h - 3 ? GOLD[2] : GOLD[1]); };
// rows of gold frogging (horizontal braid with a loop at each end) painted over a south face at model heights Ys
export function frogging(base, Ys, o = {}) {
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face !== 'south') return;
    const m = (w - 1) / 2, half = Math.round((o.half ?? 0.36) * w);
    for (const Y of Ys) {
      const row = Math.round((cube.o[1] + cube.s[1] - Y) * PPU);
      for (const s of [-1, 1]) {
        for (let i = 2; i <= half; i++) p.px(Math.round(m + s * i), row, i === half ? GOLD[0] : GOLD[1]);
        for (let i = 3; i < half; i++) p.px(Math.round(m + s * i), row + 1, GOLD[2]);
        p.px(Math.round(m + s * half), row - 1, GOLD[1]); p.px(Math.round(m + s * (half + 1)), row, GOLD[1]); p.px(Math.round(m + s * half), row + 1, GOLD[2]);
      }
      p.px(Math.round(m), row, GOLD[0]); p.px(Math.round(m), row + 1, GOLD[2]);
    }
  };
}
// claws / horn tips: a ramp darkening toward the tip (tip at the bottom unless o.up)
export const tipP = (cols, o = {}) => (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = h > 1 ? y / (h - 1) : 0.5; p.px(x, y, face === 'up' ? cols[o.up ? 3 : 0] : face === 'down' ? cols[o.up ? 0 : 3] : ramp(cols, o.up ? 1 - v : v, x, y)); } };
// a leaf (plane)
export const leafP = (c, lo) => (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = Math.abs(y - (h - 1) / 2) / (h / 2), u = x / Math.max(1, w - 1); if (v < Math.sin(u * Math.PI) * 1.05) p.px(x, y, Math.abs(y - (h - 1) / 2) < 0.6 ? lo : c); } };

// ---------------------------------------------------------------- effects
defineFx('soundring', { w: 16, h: 16, paint: (p) => { const m = 7.5; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - m, y - m); if (d < 7.6 && d > 5.6) p.px(x, y, d > 6.8 ? '#ffffff' : '#ffe9a0'); } }, glow: true, life: [0.7, 0.8], size: [0.08, 0.6], speed: [2.2, 2.6], grav: 0, drag: 0.6, spread: 0.02, fade: true });
defineFx('goldnote', { w: 8, h: 12, paint: (p) => { const c = '#ffd23e', d = '#a8661a'; p.rect(1, 8, 4, 3, c); p.px(0, 9, c); p.px(5, 9, d); p.vl(4, 1, 8, c); p.rect(5, 1, 2, 2, c); p.px(7, 3, c); p.px(7, 4, d); p.px(2, 8, '#fff6b0'); }, glow: true, life: [1.0, 1.3], size: [0.13, 0.11], speed: [0.9, 1.4], grav: -0.4, drag: 0.6, spread: 0.4, wob: 1.6, fade: true });
defineFx('confetti', { w: 3, h: 2, frames: ['#ff4fa3', '#22c8b8', '#ff8a2a', '#ffd23e'].map((c) => (p) => p.rect(0, 0, 3, 2, c)), life: [1.0, 1.6], size: [0.05, 0.05], speed: [1.6, 3], grav: 2.2, drag: 1.6, spread: 0.9, flutter: true });
defineFx('zebra', { w: 10, h: 3, paint: (p) => { p.rect(0, 0, 10, 3, '#ffffff'); p.hl(0, 9, 2, '#d8dce8'); }, glow: true, life: [0.3, 0.45], size: [0.32, 0.18], speed: [0, 0.3], grav: 0, spread: 0.2, fade: true });
defineFx('egg', { w: 6, h: 8, frames: ['#f6f0e0', '#ffd23e', '#b070ff'].map((c) => (p, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) { const v = (y - 4.6) / (y < 4.6 ? 4.4 : 3.2), u = (x - 2.5) / 2.8; if (u * u + v * v <= 1) p.px(x, y, x + y < 5 ? '#ffffff' : c); } }), life: [0.6, 1.0], size: [0.08, 0.08], speed: [1.6, 3.2], grav: 9, drag: 0.3, spread: 0.8, spin: 6 });
defineFx('psyring', { w: 32, h: 32, frames: [0, 1, 2].map((f) => (p) => { const m = 15.5; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - m, y - m); if (d < 15.6 && d > 11.5) { const k = Math.floor(d * 1.3 + Math.atan2(y - m, x - m) * 2 + f) % 3; p.px(x, y, ['#ffd23e', '#b050ff', '#ff6ad0'][k]); } } }), glow: true, life: [0.5, 0.5], size: [0.2, 2.4], speed: [0, 0], grav: 0, fps: 12, fade: true });

// ---------------------------------------------------------------- rig helpers
// two-bone leg IK in the sagittal plane: hip at (hy, hz), ankle at (fy, fz) in model units; the foot stays level (+ toe)
function legIK(P, S, R, hy, hz, fy, fz, toe = 0) {
  const L1 = R.L1, L2 = R.L2;
  const dy = hy - fy, dz = fz - hz, d = Math.max(Math.abs(L1 - L2) + 0.05, Math.min(L1 + L2 - 0.02, Math.hypot(dy, dz)));
  const phi = Math.atan2(dz, dy), a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const b = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2)))), th = phi + a, kn = Math.PI - b;
  P.pos('thigh' + S, 0, hy - R.hipY, hz).rot('thigh' + S, -th * R2D, 0, 0).rot('shin' + S, kn * R2D, 0, 0).rot('foot' + S, (th - kn) * R2D + toe, 0, 0);
}
// place the pelvis and solve both legs. o: { y, z (hip offsets), pitch, roll, yaw (pelvis), fR/fL: [dy, dz] foot offsets, toeR/toeL, spread }
export function legs(P, R, o = {}) {
  const y = o.y || 0, z = o.z || 0, roll = (o.roll || 0) / R2D;
  P.pos('pelvis', 0, y, z).rot('pelvis', o.pitch || 0, o.yaw || 0, o.roll || 0);
  for (const [S, g] of [['R', -1], ['L', 1]]) {
    const f = o['f' + S] || [0, 0], hy = R.hipY + y + g * R.hipX * Math.sin(roll);
    legIK(P, S, R, hy, z, R.ankleY + f[0], f[1], o['toe' + S] || 0);
    if (o.spread) P.rot('thigh' + S, 0, 0, -g * o.spread);
  }
}
// arms: out (raise sideways), fwd (swing forward), bend (elbow), twist, wrist, grip (claws curl)
export function arm(P, S, o = {}) {
  const g = S === 'R' ? 1 : -1;
  P.rot('arm' + S, -(o.fwd || 0), g * (o.twist || 0), -g * (o.out || 0)).rot('fore' + S, -(o.bend || 0), g * (o.foreTwist || 0), -g * (o.foreOut || 0)).rot('hand' + S, -(o.wrist || 0), 0, 0);
  if (o.grip) P.rot('claw' + S, o.grip, 0, 0);
}
export const arms = (P, o) => { arm(P, 'R', o); arm(P, 'L', o); };
// expressions: the eye state drives brow plates, mandibles, eye squash/stretch and a little head motion
const EMO = {
  open: [0, 0, 0, 0, 0, 0], closed: [0, -0.15, 2, 6, 0.04, -0.1], happy: [-10, 0.45, 10, 6, 0.08, -0.08], shut: [18, -0.25, 24, 4, 0.14, -0.22],
  x: [8, 0.1, 20, 14, 0.1, -0.1], swirl: [-6, 0.2, 16, 16, 0, 0], shock: [-16, 0.8, 28, 12, 0.08, 0.2], wide: [-12, 0.6, 18, 6, 0.06, 0.14],
  angry: [24, -0.35, 20, -4, 0.06, -0.12], sad: [-22, 0.25, 4, 16, -0.02, -0.04], sleepy: [2, -0.35, 2, 10, 0, -0.12],
  heart: [-10, 0.4, 12, 4, 0.1, 0.06], star: [-12, 0.5, 18, 2, 0.12, 0.08], teary: [-20, 0.3, 8, 14, 0, 0.04], wink: [-6, 0.3, 10, 4, 0.04, 0],
};
export function emote(P, s, k = 1) {
  if (s) P.face('eyes', s);
  const m = EMO[s] || EMO.open;
  P.rot('browR', 0, 0, -m[0] * k).rot('browL', 0, 0, m[0] * k).pos('browR', 0, m[1] * k, 0).pos('browL', 0, m[1] * k, 0);
  P.rot('mandR', m[3] * k, -m[2] * k, 0).rot('mandL', m[3] * k, m[2] * k, 0);
  P.scl('eyeR', 1 + m[4] * k, 1 + m[5] * k, 1).scl('eyeL', 1 + m[4] * k, 1 + m[5] * k, 1);
}
// mandibles chatter / open (deg)
export const mand = (P, open, droop = 0) => P.rot('mandR', droop, -open, 0).rot('mandL', droop, open, 0);
// eye darts: hold, then a quick glance to a new spot
export function darts(P, t, amp = 0.3, every = 1.6, seed = 1) {
  const i = Math.floor(t / every), f = (t / every) - i, h = (n) => (((Math.sin((n + seed) * 91.7) * 43758.5) % 1) + 1) % 1;
  const a = [h(i) * 2 - 1, h(i + 0.5) * 2 - 1], b = [h(i + 1) * 2 - 1, h(i + 1.5) * 2 - 1], k = E.out(Math.min(1, Math.max(0, (f - 0.82) / 0.1)));
  const dx = (a[0] + (b[0] - a[0]) * k) * amp, dy = (a[1] + (b[1] - a[1]) * k) * amp * 0.4;
  P.pos('eyeR', dx, dy, 0).pos('eyeL', dx, dy, 0);
}
// the shared walk: o { len, stride, lift, bob, sway, swing, lean, heavy (stomp dust) }
export function walkCycle(P, R, t, o) {
  const ph = (t / o.len) * TAU, s = Math.sin(ph), c = Math.cos(ph);
  legs(P, R, { y: -o.crouch + o.bob * c * c, roll: -o.sway * c, yaw: o.twist * s, pitch: o.lean,
    fR: [o.lift * Math.max(0, c), o.stride * s], fL: [o.lift * Math.max(0, -c), -o.stride * s], toeR: -14 * Math.max(0, c), toeL: -14 * Math.max(0, -c) });
  arm(P, 'R', { fwd: -o.swing * s, out: o.out || 6, bend: (o.bend || 16) + Math.max(0, -s) * 10 }); arm(P, 'L', { fwd: o.swing * s, out: o.out || 6, bend: (o.bend || 16) + Math.max(0, s) * 10 });
  P.rot('torso', 0, -o.twist * s * 0.8, o.sway * c * 0.5);
  if (o.heavy) { P.sq('torso', -0.04 * o.heavy * Math.max(0, -Math.cos(ph * 2)) ** 4); }
  return { s, c, ph };
}

// ---------------------------------------------------------------- shared clips
// R: rig numbers { hipX, hipY, ankleY, L1, L2 }, o: tuning { weight (0 light … 1 heavy), head (FX anchor), back, fall: 'back'|'front' }
export function sharedClips(R, o) {
  const HEAD = o.headTop, w = o.weight ?? 0.3;
  return {
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.22, 0.7, E.inout)), q = 1 - w * 0.6;
      legs(P, R, { y: -1.2 * k * q, z: -1.8 * k * q, pitch: -14 * k * q + wob(t, 0.08, 4 * q, 4, 7), roll: wave(t, 14) * 3 * k, fR: [0, -0.6 * k], fL: [0, 0.4 * k] });
      P.pos('root', 0, 0, -1.6 * k * q).rot('head', -18 * k, 0, wave(t, 13) * 8 * k).sq('torso', -0.08 * k);
      arms(P, { out: 34 * k, fwd: 22 * k, bend: 40 * k, grip: -20 * k });
      emote(P, t < 0.42 ? 'shut' : 'open', t < 0.42 ? 1 : 0); P.blinkOK = false;
      P.burst(0.02, 'spark', 'head', [0, HEAD[1] - 3, HEAD[2] + 2], { n: 2 }).burst(0.03, 'star', 'head', HEAD, { n: 3 }).burst(0.1, 'sweat', 'head', [HEAD[0] + 3, HEAD[1] - 1, HEAD[2]], { n: 2, dir: [1, 1, 0], speed: 1 });
      if (o.hurtExtra) o.hurtExtra(P, t, k);
    } },
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.98, 1.5 + w * 0.3, E.bounce);
      o.downPose(P, fall, t, 0);
      if (fall < 0.05) legs(P, R, { y: -0.8 * dizzy, roll: wave(t, 1.3) * 8 * dizzy, yaw: wave(t, 0.9) * 12 * dizzy, fR: [Math.max(0, wave(t, 1.3)) * 1.2 * dizzy, 0], fL: [Math.max(0, -wave(t, 1.3)) * 1.2 * dizzy, 0] });
      P.rot('head', 0, wave(t, 1.3, 1) * 14 * dizzy, wave(t, 1.3) * 10 * dizzy);
      arms(P, { out: 20 * dizzy, bend: 30 * dizzy });
      emote(P, 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.5 + w * 0.3, 'dust', 'root', [0, 1, 0], { n: 14, spread: 1, speed: 1.6 }).burst(0.7, 'star', 'head', HEAD, { n: 5 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      o.downPose(P, 1, t, 1);
      emote(P, 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
    } },
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      o.sleepPose(P, br, t);
      emote(P, 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', HEAD, {}).burst(1.9, 'z', 'head', HEAD, {});
    } },
  };
}
// a lying-on-its-back pose shared by the stages: the shell on the ground, legs and arms limp in the air
export function onBack(P, R, k, t, o = {}) {
  const lift = o.lift ?? 3;
  P.rot('root', -82 * k, 0, 0).pos('root', 0, lift * k, -(o.slide ?? 2) * k);
  for (const [S, g] of [['R', -1], ['L', 1]]) {
    P.rot('thigh' + S, (-50 + wave(t, 0.9, g) * 6) * k, 0, g * 14 * k).rot('shin' + S, (60 + wave(t, 1.2, g + 1) * 10) * k, 0, 0).rot('foot' + S, -20 * k, 0, 0);
  }
  arms(P, { out: 40 * k, fwd: -30 * k, bend: 50 * k });
  P.rot('head', 20 * k, 0, 10 * k);
}
// ---------------------------------------------------------------- the ultra-drip form (black lacquer and gold)
const hsl = (hex) => { const n = parseInt(hex.slice(1, 7), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l }; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return { h, s: d / (1 - Math.abs(2 * l - 1)), l }; };
const hex = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16).padStart(2, '0')).join(''); };
const inH = (h, [a, b]) => (a <= b ? h >= a && h < b : h >= a || h < b);
// a species' drip mapping: hue ranges that turn to black lacquer or to gold, colours to keep (eyes), exact colour swaps
// (swap: { "#hex": "#hex" }, e.g. piping that should turn gold), and whether greys go black
export function dripMap(o = {}) {
  const keep = new Set((o.keep || []).map((c) => c.toLowerCase())), swap = Object.fromEntries(Object.entries(o.swap || {}).map(([k, v]) => [k.toLowerCase(), v]));
  return { map(c, glow) {
    if (typeof c !== 'string' || c[0] !== '#' || c.length < 7 || keep.has(c.toLowerCase())) return c;
    if (swap[c.toLowerCase()]) return swap[c.toLowerCase()];
    if (glow) return blackGold(c, glow);
    const { h, s, l } = hsl(c);
    if (s < 0.08) return o.greys && l > 0.12 && l < 0.86 ? hex(255, 0.12, 0.05 + l * 0.22) : c;
    for (const r of o.black || []) if (inH(h, r)) return hex(255, 0.14, 0.05 + l * 0.24);
    for (const r of o.gold || []) if (inH(h, r)) return hex(44, 0.88, 0.22 + l * 0.58);
    return blackGold(c, glow);
  } };
}
// ---------------------------------------------------------------- full-res eye states
// Hand-pixelled eyes (eyeRig style 'pix', chunk 1) only carry an 'open' map; eyes.js derives the
// other states with 1-px lids, which read thin at full resolution. pixStates(open) draws the
// expressive ones properly: 2-px lid lines for angry / sad / sleepy / smug, a closed lid line, a
// cheek-push squint for happy (not anime ^^), tear pools, and a shrunken pupil for shock / wide.
//   o.lid: lid thickness in px (2) · o.fill: what a lowered lid shows ('.' clear, or a palette
//   char such as 'c' for eyes whose open map already carries a painted lid) · o.top: the first row
//   of the visible eye (lids are placed between it and the bottom)
export function pixStates(open, o = {}) {
  const H = open.length, W = open[0].length, T = o.lid ?? 2, fill = o.fill ?? '.', y0 = o.top ?? 0;
  const g = open.map((r) => [...r]), on = (x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] !== '.';
  const cols = [...Array(W)].map((_, x) => { let a = -1, b = -1; for (let y = 0; y < H; y++) if (on(x, y)) { if (a < 0) a = y; b = y; } return [a, b]; });
  const map = (fn) => g.map((r, y) => r.map((ch, x) => (ch === '.' ? '.' : fn(ch, x, y) ?? ch)).join(''));
  const hide = (ch) => (fill === '.' ? '.' : ch === 'l' ? 'l' : fill);
  const U = (x) => (x + 0.5) / W, span = H - 1 - y0;
  // an upper lid along y = y0 + span·f(u): hidden above, a T-px lid line on it
  const lid = (f) => map((ch, x, y) => { const [a, b] = cols[x], yl = Math.max(a, Math.min(b, Math.round(y0 + span * f(U(x))))); return y < yl ? hide(ch) : y < yl + T ? 'l' : undefined; });
  // iris centre and size (for the shock / wide pupils)
  let n = 0, sx = 0, sy = 0; g.forEach((r, y) => r.forEach((ch, x) => { if ('iIkh'.includes(ch)) { n++; sx += x; sy += y; } }));
  const cx = n ? Math.round(sx / n) : W >> 1, cy = n ? Math.round(sy / n) : H >> 1, whites = open.some((r) => r.includes('w'));
  const arch = (u) => 1 - (2 * u - 1) ** 2;
  return {
    angry: lid((u) => 0.08 + 0.52 * u),
    sad: lid((u) => 0.5 - 0.42 * u),
    sleepy: lid(() => 0.5),
    smug: lid((u) => 0.36 + 0.08 * u),
    // a lid line sagging across the lower half, lashes flicked at the outer corner
    closed: map((ch, x, y) => { const yl = Math.round(y0 + span * (0.5 + 0.22 * arch(U(x)))); return y >= yl && y < yl + T && cols[x][0] >= 0 ? 'l' : x === 0 && y === yl - 1 ? 'l' : hide(ch); }),
    // the lower lid pushed up into an arch by a grin; the top of the eye keeps its iris and shine
    happy: map((ch, x, y) => { const yb = Math.round(y0 + span * (1.0 - 0.32 * arch(U(x)))); return y > yb ? '.' : y > yb - T ? 'l' : undefined; }),
    // tears pooling along the bottom two rows
    teary: map((ch, x, y) => (ch !== 'l' && y >= cols[x][1] - 2 ? 'b' : ch === 'h' || ch === 'l' ? ch : undefined)),
    // shock: whites with a pinprick (eyes with whites), or the iris with a pinprick pupil (bead eyes)
    shock: map((ch, x, y) => { if (ch === 'l') return 'l'; if (Math.abs(x - cx) <= 0 && Math.abs(y - cy) <= 0) return 'k'; return whites ? (ch === 's' ? 's' : 'w') : ch === 'k' || ch === 'h' ? 'i' : ch; }),
    // wide: a small, sharp iris ringed by white
    wide: map((ch, x, y) => { if (ch === 'l') return 'l'; const d = Math.hypot(x - cx, y - cy); if (d < 1) return x < cx || y < cy ? 'h' : 'k'; if (d < 1.6) return 'k'; if (d < 2.6) return 'i'; return whites ? 'w' : ch === 'k' || ch === 'h' ? 'i' : ch; }),
  };
}

export { E, seg, bump, wob, wave };
