// Paradove — the legendary last form of the street-pigeon line ("Paradise City"; homage: Guns N' Roses).
// Jungeon that fainted from a burn while bonded comes back as this: a giant pigeon skeleton, 2.2 m tall,
// burning from the inside — bone legs on taloned feet, a ribcage with a heart of fire, an S-curved neck of
// vertebrae, a pigeon skull with a long bone beak and big round glowing eyes deep in its sockets, and bone
// wings whose feathers are flames. It wears a huge curly black wig and a tall black top hat with a crimson
// band. Drip (one choice per tier): a rose in the hat band or, on its keel, a charred plaque with a cross
// ringed by five little skulls; a gold chain with a skull or aviators parked on the brim; a black guitar slung
// across its burning back or spiked bone pauldrons.
// Menacing, unhurried, theatrical: it stalks, it tips its hat, and it sweeps a wall of fire across the field.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { defineFx } from '../fx.js';
import { C, P, pigeonEyeRig, rose, guitarCubes, chainCubes, shadesCubes, padCubes, at, strut, plant, clamp } from './pigeon_parts.js';
import { h2 } from './kit.js';

// ---------------------------------------------------------------- painters
const BN = ['#fffaee', '#efe4c8', '#d6c6a2', '#ac9a7a', '#7a6a56'], SOOT = ['#5a4a42', '#3a2e2c'];
// bone: clean top-lit bands, darker toward the ends, a few cracks and soot where the fire licks it
const boneP = (o = {}) => (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let k = face === 'up' ? 0 : face === 'down' ? 3 : (face === 'east' || face === 'north') ? 2 : 1;
    if (face !== 'up' && face !== 'down') { if (y === 0) k = Math.max(0, k - 1); if (y >= h - 1) k = Math.min(4, k + 1); }
    let col = BN[k];
    const g = h2(x >> 1, y >> 1, o.seed || 3);
    if (g > 0.93) col = SOOT[0]; else if (g > 0.86) col = BN[Math.min(4, k + 1)];
    p.px(x, y, col);
  }
  if ((face === 'south' || face === 'west' || face === 'east') && w > 5 && h > 3) { const x0 = (o.seed || 3) % (w - 3); p.px(x0, 1, BN[4]); p.px(x0 + 1, 2, BN[4]); p.px(x0 + 1, 3, BN[3]); }
};
const bone = boneP(), bone2 = boneP({ seed: 7 }), bone3 = boneP({ seed: 11 });
const knob = (p, w, h, face) => { bone(p, w, h, face); if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) { p.px(x, 0, BN[0]); p.px(x, h - 1, BN[3]); } };
// the skull: bone with suture cracks across the crown
const skullP = (p, w, h, face) => {
  boneP({ seed: 5 })(p, w, h, face);
  if (face === 'up' || face === 'north') { const m = Math.floor(w / 2); for (let y = 0; y < h; y++) p.px(m + (y % 3 === 0 ? 1 : 0), y, BN[4]); }
  if (face === 'east' || face === 'west') for (let x = 2; x < w - 2; x++) if (x % 4 !== 0) p.px(x, Math.floor(h * 0.3) + (x % 3 === 0 ? 1 : 0), BN[3]);
};
// the beak: long and bony, a nostril slit near the root, darker toward the hooked tip
const beakBoneP = (z0, z1) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), t = clamp((q[2] - z0) / (z1 - z0));
    let k = face === 'up' ? 0 : face === 'down' ? 3 : (face === 'east' ? 2 : 1);
    if (t > 0.8) k = Math.min(4, k + 1);
    let col = BN[k];
    if ((face === 'east' || face === 'west' || face === 'up') && t > 0.12 && t < 0.32 && j === Math.floor(h * 0.35)) col = '#2a1418';
    if (face !== 'up' && face !== 'down' && j === h - 1) col = BN[4];
    p.px(i, j, col);
  }
};
// a dark eye socket: a ragged hole with a faint ember rim
const socketP = (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2)) + ((x * 7 + y * 3) % 5 === 0 ? 0.06 : 0);
    if (d > 1) continue; p.px(x, y, d > 0.86 ? '#5a2018' : d > 0.7 ? '#2a0c10' : '#14060a');
  }
};
// the wig: glossy black curls — spiral C-curls with violet-blue gloss
const WIG = ['#8a86b0', '#4a4766', '#2a2840', '#1a1826', '#0c0b12'];
const curlP = (seed = 1) => (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, WIG[face === 'up' ? 2 : face === 'down' ? 4 : 3]);
  const S = 5;
  for (let gy = -2, r = 0; gy < h + 3; gy += 4, r++) for (let gx = -3 + ((r + seed) % 2) * 2; gx < w + 3; gx += S) {
    const pts = [[1, 0], [2, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 2], [0, 1]];
    pts.forEach(([a, b], i) => p.px(gx + a, gy + b, i < 2 ? WIG[0] : i < 4 ? WIG[1] : i < 6 ? WIG[2] : WIG[1]));
    p.px(gx + 1, gy + 1, WIG[4]); p.px(gx + 2, gy + 2, WIG[4]);
  }
  if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) if ((x * 5) % 3 === 0) p.px(x, h - 1, 0);   // ragged ends
};
const curl = curlP(1), curl2 = curlP(2);
// the top hat: black felt with a soft sheen line, a crimson band
const FELT = ['#4c4a5e', '#2a2836', '#1c1a24', '#14121a', '#0c0a10'];
const feltP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, FELT[face === 'up' ? 1 : face === 'down' ? 4 : face === 'east' || face === 'north' ? 3 : 2]);
  if (face === 'south' || face === 'west') for (let y = 1; y < h - 1; y++) if (h2(3, y >> 1, 4) < 0.7) p.px(Math.floor(w * 0.22), y, FELT[0]);
  if (face === 'up') for (let x = 0; x < w; x++) { p.px(x, 0, FELT[0]); }
};
const bandP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? C.rose[4] : y === 0 ? C.rose[1] : y === h - 1 ? C.rose[4] : C.rose[2 + ((x + y) % 5 === 0 ? 1 : 0)]); };
// the plaque on the keel: charred iron, a ring of five little skulls round the crossing of a raised cross
const plaqueP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' ? (h2(x >> 1, y >> 1, 9) > 0.8 ? '#3a302e' : '#2a2224') : '#1e1818');
  if (face !== 'south') return;
  for (let x = 0; x < w; x++) { p.px(x, 0, '#5a4a44'); p.px(x, h - 1, '#120e10'); }
  for (let y = 0; y < h; y++) { p.px(0, y, '#5a4a44'); p.px(w - 1, y, '#120e10'); }
  const cx = (w - 1) / 2, cy = h * 0.42, R = Math.min(w, h) * 0.34;
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k / 5) * Math.PI * 2 + Math.PI / 5, sx = Math.round(cx + Math.cos(a) * R) - 1, sy = Math.round(cy + Math.sin(a) * R) - 1;
    const SK = ['.ww.', 'wwww', 'kwwk', '.ww.', '.ww.'];
    SK.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'w') p.px(sx + i, sy + j, j === 0 ? '#ffffff' : BN[1]); else if (ch === 'k') p.px(sx + i, sy + j, '#14060a'); }));
  }
};
// fire: n tongues rising, three frames that flicker (glow planes)
const fireP = (f, n = 3, o = {}) => (p, w, h) => {
  for (let k = 0; k < n; k++) {
    const cxF = (k + 0.5) / n, hgt = (o.hs ? o.hs[k % o.hs.length] : 0.75 + 0.25 * ((k * 7 + 3) % 4) / 3) * (0.84 + 0.16 * Math.sin(f * 2.1 + k * 1.7));
    const H = h * hgt, cx = cxF * w, half0 = (w / n) * 0.62;
    for (let y = 0; y < h; y++) {
      const v = (h - 1 - y) / Math.max(1, H); if (v > 1) continue;
      const half = (v < 0.3 ? 1 : Math.sqrt(1 - (v - 0.3) / 0.7)) * half0, sway = Math.sin(v * 4 + f * 1.9 + k) * v * (w / n) * 0.35;
      for (let x = Math.floor(cx - half + sway); x <= Math.ceil(cx + half + sway); x++) {
        const d = Math.abs(x - cx - sway) / Math.max(0.5, half);
        if (d > 1) continue;
        p.px(x, y, d < 0.35 && v < 0.55 ? '#fff6c8' : d < 0.68 && v < 0.82 ? '#ffd040' : v > 0.78 ? '#ff5a1a' : '#ff9a2a');
      }
    }
  }
};
// talons: bone toes with black claws
const toeP = (back) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), tip = back ? q[2] - c.o[2] : c.o[2] + c.s[2] - q[2];
    const k = face === 'up' ? 0 : face === 'down' ? 3 : (face === 'east' || face === 'north') ? 2 : 1;
    p.px(i, j, tip < 1.0 ? (tip < 0.4 ? '#0c0a10' : '#2a2430') : Math.floor(tip * 1.5) % 2 === 0 && face === 'up' ? BN[1] : BN[k]);
  }
};
const talons = (x, z) => {
  const ank = [x, 0.4, z], toe = (yaw, len) => P([x - 0.6, 0, z], [1.2, 1.0, len], toeP(false), { pivot: ank, rot: [0, yaw, 0] });
  return [toe(0, 6.0), toe(-30, 5.0), toe(30, 5.0), P([x - 0.55, 0, z - 3.0], [1.1, 0.9, 3.0], toeP(true)), P([x - 1.0, 0, z - 1.0], [2.0, 1.6, 2.0], knob)];
};

// ---------------------------------------------------------------- particles
const blazeSpr = (f) => (p, W, H) => fireP(f, 1, { hs: [1] })(p, W, H);
defineFx('pg_blaze', { w: 14, h: 22, frames: [0, 1, 2, 3].map(blazeSpr), glow: true, life: [0.55, 0.9], size: [0.5, 0.18], speed: [0.6, 1.4], grav: -2.2, drag: 1.4, spread: 0.35, fps: 12, tint: [[1, 1, 1], [1, 0.8, 0.5], [0.9, 0.35, 0.15]] });
// the ultra-drip form burns blue: the same flames repainted through a blue pen
const BLUE = { '#fff6c8': '#f0fcff', '#ffd040': '#8ae4ff', '#ff9a2a': '#3c96ff', '#ff5a1a': '#2a52e0' };
const blueSpr = (f) => (p, W, H) => blazeSpr(f)({ px: (x, y, c) => p.px(x, y, BLUE[c] || c) }, W, H);
defineFx('pg_blueblaze', { w: 14, h: 22, frames: [0, 1, 2, 3].map(blueSpr), glow: true, life: [0.55, 0.9], size: [0.5, 0.18], speed: [0.6, 1.4], grav: -2.2, drag: 1.4, spread: 0.35, fps: 12, tint: [[1, 1, 1], [0.6, 0.85, 1], [0.25, 0.35, 0.95]] });
const chipSpr = (c) => (p) => { p.px(0, 0, c); p.px(1, 0, BN[0]); p.px(1, 1, c); p.px(2, 1, BN[3]); };
defineFx('pg_bone', { w: 3, h: 2, frames: [chipSpr(BN[1]), chipSpr(BN[2])], life: [0.5, 0.9], size: [0.06, 0.06], speed: [2, 3.6], grav: 8, drag: 0.4, spread: 0.7, spin: 10 });

// ---------------------------------------------------------------- the model
const ABC = ['a', 'b', 'c'], PL = { id: 'pd-plaque', hide: true };
// a bone of flames: every plane in three flickering frames (slot 'fire')
const flameBone = (name, parent, pivot, planes, rot) => ({ name, parent, pivot, rot, cubes: planes.flatMap(([o, s, plane, n, hs]) => ABC.map((f, i) => P(o, s, fireP(i * 2 + o[0] * 0.3, n, { hs }), { plane, glow: true, shadow: false, id: 'fire-' + f, hide: i > 0 }))) });
// its own low-res eyes: glowing embers deep in the sockets — round, no pupils, a white-hot core and one glint
const EYES = pigeonEyeRig({ grid: [5, 5], ring: ['#ffd04a', '#ff9a2a'], pupil: 'none', core: '#fff6c8', glow: true, at: [-2.62, 36.07, 7.1], size: [10 / 3, 10 / 3] });
const ribs = [];
for (let k = 0; k < 5; k++) {
  const y = 24.4 - k * 1.85, len = 4.3 - Math.abs(k - 1.5) * 0.3, tex = [bone, bone2, bone3][k % 3];
  for (const s of [-1, 1]) {
    ribs.push(P([s < 0 ? -1.0 - len : 1.0, y, -3.3], [len, 0.75, 0.6], tex, { pivot: [s * 1.0, y + 0.37, -3.0], rot: [0, s * -24, s * -8] }));
    ribs.push(P([s * 5.0 - 0.37, y - 0.7, -1.4], [0.75, 0.75, 3.8], tex, { pivot: [s * 5.0, y - 0.35, -1.2], rot: [10, s * -10, 0] }));
    ribs.push(P([s < 0 ? -5.6 : 2.6, y - 1.5, 2.9], [3.0, 0.75, 0.6], tex, { pivot: [s * 4.1, y - 1.1, 3.2], rot: [0, s * 20, s * 6] }));
  }
}
const spine = [];
for (let i = 0; i < 7; i++) { const y = 14.6 + i * 1.85, z = -3.8 + i * 0.25; spine.push(P([-0.9, y, z - 0.9], [1.8, 1.25, 1.8], i % 2 ? bone : bone2), P([-0.3, y + 0.1, z - 2.0], [0.6, 0.9, 1.2], bone3)); }
const wing = (s) => {
  const X = (x) => s * x, R = s < 0 ? 'R' : 'L';
  return [
    { name: 'wing' + R, parent: 'body', pivot: [X(4.6), 25.6, -1.8], rot: [-12, s * -26, s * -38], cubes: [
      P([s < 0 ? -12.0 : 4.6, 25.0, -2.4], [7.4, 1.2, 1.2], bone), P([s < 0 ? -12.8 : 11.0, 24.6, -2.8], [1.8, 2.0, 2.0], knob),
    ] },
    { name: 'fore' + R, parent: 'wing' + R, pivot: [X(11.9), 25.6, -1.8], rot: [0, 0, s * -78], cubes: [
      P([s < 0 ? -21.0 : 11.8, 25.2, -2.0], [9.2, 0.8, 0.8], bone2), P([s < 0 ? -21.0 : 11.8, 24.0, -2.6], [9.2, 1.0, 1.0], bone3),
      P([s < 0 ? -21.6 : 19.8, 24.0, -2.8], [1.8, 1.8, 1.8], knob),
    ] },
    flameBone('fxFore' + R, 'fore' + R, [X(16.4), 25.6, -2.2], [[[s < 0 ? -21.0 : 11.8, 25.4, -2.2], [9.2, 8.0, 0], 'z', 4], [[X(16.4), 25.4, -5.8], [0, 7.0, 7.2], 'x', 3]]),
    { name: 'hand' + R, parent: 'fore' + R, pivot: [X(20.8), 25.0, -2.0], rot: [0, 0, s * 26], cubes: [
      P([s < 0 ? -27.4 : 20.8, 24.6, -2.4], [6.6, 0.9, 0.9], bone), P([s < 0 ? -30.8 : 27.4, 24.7, -2.3], [3.4, 0.6, 0.6], bone2),
    ] },
    flameBone('fxHand' + R, 'hand' + R, [X(26), 25.0, -2.2], [[[s < 0 ? -31.4 : 20.8, 25.0, -2.3], [10.6, 10.0, 0], 'z', 4, [1, 0.7, 0.85, 0.55]]]),
  ];
};
const hairRing = (s) => [
  { name: 'curl' + (s < 0 ? 'R' : 'L') + '1', parent: 'head', pivot: [s * 5.2, 31.4, 4.6], cubes: [P([s < 0 ? -6.0 : 4.4, 27.2, 3.8], [1.6, 4.2, 1.6], curl), P([s < 0 ? -5.8 : 4.6, 25.4, 4.0], [1.2, 1.8, 1.2], curl2)] },
  { name: 'curl' + (s < 0 ? 'R' : 'L') + '2', parent: 'head', pivot: [s * 5.0, 31.0, 1.0], cubes: [P([s < 0 ? -5.9 : 4.3, 26.0, 0.2], [1.6, 5.0, 1.6], curl2), P([s < 0 ? -5.7 : 4.5, 24.2, 0.4], [1.2, 1.8, 1.2], curl)] },
];

export const def = {
  name: 'paradove', ppu: 3, scale: 0.7, outline: { color: '#1a0c0e', px: 1.6 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'footR', parent: 'root', pivot: [-4.2, 0, 2.0], cubes: talons(-4.2, 2.0) },
    { name: 'footL', parent: 'root', pivot: [4.2, 0, 2.0], cubes: talons(4.2, 2.0) },
    { name: 'legR', parent: 'root', pivot: [-4.2, 13.4, 0.4], cubes: [
      P([-4.9, 6.5, -0.3], [1.4, 6.9, 1.4], bone, { pivot: [-4.2, 13.4, 0.4], rot: [16.9, 0, 0] }),
      P([-4.8, -0.2, -2.2], [1.2, 7.0, 1.2], bone2, { pivot: [-4.2, 6.8, -1.6], rot: [-31, 0, 0] }),
      P([-5.2, 5.8, -2.6], [2.0, 2.0, 2.0], knob),
    ] },
    { name: 'legL', parent: 'root', pivot: [4.2, 13.4, 0.4], cubes: [
      P([3.5, 6.5, -0.3], [1.4, 6.9, 1.4], bone, { pivot: [4.2, 13.4, 0.4], rot: [16.9, 0, 0] }),
      P([3.6, -0.2, -2.2], [1.2, 7.0, 1.2], bone2, { pivot: [4.2, 6.8, -1.6], rot: [-31, 0, 0] }),
      P([3.2, 5.8, -2.6], [2.0, 2.0, 2.0], knob),
    ] },
    { name: 'body', parent: 'root', pivot: [0, 16.0, -0.4], cubes: [
      P([-3.8, 12.4, -4.6], [7.6, 3.0, 5.0], bone), P([-5.0, 12.5, -0.5], [1.8, 1.8, 1.8], knob), P([3.2, 12.5, -0.5], [1.8, 1.8, 1.8], knob),
      ...spine, ...ribs,
      P([-3.2, 16.4, 3.3], [6.4, 9.0, 0.6], bone2), P([-0.8, 15.6, 3.6], [1.6, 10.0, 1.8], bone),
      P([-2.9, 17.0, 5.3], [5.8, 8.0, 0.35], plaqueP, PL), P([-0.4, 17.6, 5.62], [0.8, 6.8, 0.4], knob, PL), P([-2.0, 21.4, 5.62], [4.0, 0.8, 0.4], knob, PL),
      P([-4.4, 25.2, -3.0], [8.8, 1.2, 1.4], bone3),
    ] },
    flameBone('fxCore', 'body', [0, 16, 0], [[[-3.4, 15.2, 0.2], [6.8, 9.6, 0], 'z', 3], [[0, 15.2, -2.8], [0, 9.6, 5.6], 'x', 2]]),
    flameBone('fxBack', 'body', [0, 22, -4.6], [[[-5.0, 21.0, -4.9], [10.0, 12.0, 0], 'z', 4, [0.7, 1, 0.85, 0.6]], [[0, 21.0, -9.0], [0, 11.0, 7.0], 'x', 3]]),
    { name: 'tail', parent: 'body', pivot: [0, 13.6, -4.6], rot: [-22, 0, 0], cubes: [P([-0.8, 13.0, -7.6], [1.6, 1.4, 3.2], bone)] },
    flameBone('fxTail', 'tail', [0, 13.6, -7.6], [[[0, 12.8, -16.0], [0, 9.0, 8.6], 'x', 3, [0.9, 1, 0.7]], [[-4.0, 12.8, -7.8], [8.0, 7.0, 0], 'z', 3]]),
    { name: 'neck', parent: 'body', pivot: [0, 26.6, -1.0], cubes: [
      ...chainCubes({ xs: 1.4, y: 27.0, z0: -3.0, z1: -0.2, at: [0, 22.8, 6.4], id: 'pd-chain', kind: 'skull' }),
      P([-1.0, 26.6, -2.6], [2.0, 1.6, 2.0], bone), P([-1.0, 28.4, -1.6], [2.0, 1.6, 2.0], bone2), P([-1.0, 30.2, -0.2], [2.0, 1.6, 2.0], bone3), P([-1.0, 31.8, 1.4], [2.0, 1.6, 2.0], bone),
    ] },
    { name: 'head', parent: 'neck', pivot: [0, 32.8, 3.0], cubes: [
      P([-4.2, 32.6, -0.4], [8.4, 6.6, 7.4], skullP), P([-3.5, 32.2, -1.0], [7.0, 7.6, 7.4], skullP), P([-4.6, 32.4, 1.6], [9.2, 2.2, 4.8], skullP),
      P([-1.5, 33.6, 7.0], [3.0, 1.8, 4.6], beakBoneP(7, 14.4)), P([-1.1, 33.45, 11.4], [2.2, 1.5, 2.6], beakBoneP(7, 14.4)),
      P([-0.7, 32.7, 13.5], [1.4, 1.6, 1.0], beakBoneP(7, 14.4), { pivot: [0, 34.2, 14.0], rot: [20, 0, 0] }),
      P([-4.35, 34.35, 7.03], [3.45, 3.45, 0], socketP, { plane: 'z' }), P([0.9, 34.35, 7.03], [3.45, 3.45, 0], socketP, { plane: 'z' }),
      // the wig: a mop of curls under the hat — ringlet columns hanging round the skull with gaps between them,
      // a fall down the back, short curls over the brow
      P([-5.0, 38.0, -2.6], [10.0, 2.8, 8.8], curl),
      ...[[4.6, 29.4], [2.0, 28.2], [-0.8, 29.0]].flatMap(([z, y0], i) => [
        P([-6.4, y0, z - 0.9], [1.9, 39.0 - y0, 1.9], i % 2 ? curl : curl2), P([4.5, y0 + 0.6, z - 0.9], [1.9, 38.4 - y0, 1.9], i % 2 ? curl2 : curl)]),
      ...[[-3.2, 28.4], [-1.0, 27.4], [1.2, 28.0], [3.4, 28.8]].map(([x, y0], i) => P([x - 1.0, y0, -4.0], [2.0, 39.4 - y0, 2.0], i % 2 ? curl : curl2)),
      P([-4.6, 38.4, 5.4], [3.0, 1.6, 2.0], curl2), P([1.6, 38.4, 5.4], [3.0, 1.6, 2.0], curl), P([-1.4, 38.9, 5.8], [2.8, 1.2, 1.6], curl),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 33.4, 7.0], cubes: [P([-1.3, 32.3, 7.0], [2.6, 1.1, 6.4], beakBoneP(7, 13.4)), P([-1.2, 33.3, 7.2], [2.4, 0.3, 5.0], (p, w, h) => p.rect(0, 0, w, h, '#2a0a0e'), { outline: false })] },
    ...hairRing(-1), ...hairRing(1),
    { name: 'hat', parent: 'head', pivot: [0, 41.0, 2.4], rot: [-6, 0, -5], cubes: [
      P([-6.2, 40.6, -3.6], [12.4, 0.7, 12.0], feltP), P([-4.2, 41.3, -1.6], [8.4, 8.6, 8.0], feltP), P([-4.45, 49.6, -1.85], [8.9, 0.5, 8.5], feltP),
      P([-4.3, 41.3, -1.7], [8.6, 1.6, 8.2], bandP),
    ] },
    { name: 'hatRose', parent: 'hat', pivot: [4.3, 42.1, 3.0], rot: [0, 0, -72], cubes: rose([4.3, 43.0, 3.0], 0.95, { stem: 0, leaves: false, id: 'pd-rose', hide: true }) },
    // mirrored aviators parked on the hat's brim
    { name: 'shades', parent: 'hat', pivot: [0, 41.6, 6.6], rot: [-58, 0, 0], cubes: shadesCubes([0, 41.6, 6.6], { k: 1.5, id: 'pd-shades', hide: true }) },
    // a black single-cut slung across its burning back
    { name: 'guitar', parent: 'body', pivot: [0.6, 20.0, -6.4], rot: [-8, 180, 32], cubes: guitarCubes([0.6, 20.0, -6.4], { k: 1.7, id: 'pd-guitar', hide: true, finish: ['#3a3446', '#262230', '#1a1622', '#0e0c12'] }) },
    ...EYES.bones,
    ...wing(-1), ...wing(1),
    { name: 'padR', parent: 'wingR', pivot: [-5.6, 25.8, -1.8], cubes: padCubes(-1, [-5.6, 25.8, -1.8], { k: 1.5, id: 'pd-pads' }) },
    { name: 'padL', parent: 'wingL', pivot: [5.6, 25.8, -1.8], cubes: padCubes(1, [5.6, 25.8, -1.8], { k: 1.5, id: 'pd-pads' }) },
  ],
};
// appearance tiers (the top hat, the wig and the fire are always worn): one choice per tier
def.drip = [
  [{ id: 'pd-rose', name: 'Rose in the hat band' }, { id: 'pd-plaque', name: 'Cross of five skulls' }],
  [{ id: 'pd-chain', name: 'Gold skull chain' }, { id: 'pd-shades', name: 'Aviators on the brim' }],
  [{ id: 'pd-guitar', name: 'Black guitar' }, { id: 'pd-pads', name: 'Spiked bone pauldrons' }],
];
def.attach = {
  head: { bone: 'hat', at: [0, 50.1, 2.4], size: 8.9 },
  face: { bone: 'head', at: [0, 36.1, 7.2], size: 8.4 },
  neck: { bone: 'neck', at: [0, 30.0, 1.6], size: 6.0 },
  back: { bone: 'body', at: [0, 21.0, -5.4], size: 11.0 },
};

// ---------------------------------------------------------------- animation
const cyc = (t, fps, n) => Math.floor(t * fps) % n;
const ES = (P, x, y = x) => P.scl('eyeR', x, y, 1).scl('eyeL', x, y, 1);
const FX = ['fxCore', 'fxBack', 'fxTail', 'fxForeR', 'fxForeL', 'fxHandR', 'fxHandL'];
const MOUTH = [0, 33.4, 13.6], HANDR = [-28, 25, -2.2], HANDL = [28, 25, -2.2];
// the fire: flicker every frame; k scales the flames (roar > 1, gutter < 1)
function burn(P, t, k = 1) {
  P.face('fire', ABC[cyc(t, 10, 3)]);
  if (k !== 1) for (const f of FX) P.scl(f, 1, Math.max(0.05, k), 1);
}
function embers(P, rate = 1) {
  P.stream('ember', 'body', [0, 27, -5], { rate: 10 * rate, dir: [0, 1, -0.3], spread: 0.8 });
  P.stream('fire', 'handR', HANDR, { rate: 6 * rate, spread: 0.6 }).stream('fire', 'handL', HANDL, { rate: 6 * rate, spread: 0.6, key: 'L' });
}
export const anim = {
  start: 'idle', seed: 31,
  breathe: { bone: 'body', amp: 0.014, per: 3.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [3.0, 6.0], dur: 0.12 },
  look: { bone: 'head', yaw: 26, pitch: 12, speed: 4 },
  springs: [
    { bone: 'curlR1', tip: [0, -5, 0], k: 90, d: 6, gain: 1.0, max: 26 }, { bone: 'curlR2', tip: [0, -6, 0], k: 80, d: 6, gain: 1.0, max: 26 },
    { bone: 'curlL1', tip: [0, -5, 0], k: 90, d: 6, gain: 1.0, max: 26 }, { bone: 'curlL2', tip: [0, -6, 0], k: 80, d: 6, gain: 1.0, max: 26 },
    { bone: 'hat', tip: [0, 8, 0], k: 260, d: 12, gain: 0.25, max: 8 },
    { bone: 'tail', tip: [0, 0, -4], k: 160, d: 10, gain: 0.5, max: 14 },
  ],
  faces: { eyes: EYES.slot, fire: { default: 'a', states: { a: ['fire-a'], b: ['fire-b'], c: ['fire-c'], off: [] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'hattrick', 'hattrick', 'tiphat', 'rattle', 'preen'] },
  clips: {
    // menace at rest: slow heavy breaths that swell the fire, the wings lifting and settling like a burning
    // cloak, the skull tilting to size you up, the jaw creaking, embers streaming off its back
    idle: { len: 3.0, loop: true, f(P, t) {
      const br = Math.sin((t / 3.0) * Math.PI * 2), dy = 0.35 * br;
      P.pos('body', 0, dy, 0).sq('body', 0.015 * br); plant(P, dy, 13);
      burn(P, t, 1 + 0.12 * br); embers(P);
      P.rot('wingR', -3 * br, 0, -5 * br).rot('wingL', -3 * br, 0, 5 * br).rot('foreR', 0, 0, 3 * br).rot('foreL', 0, 0, -3 * br);
      const tilt = bump(t, 1.2, 2.6);
      P.rot('head', 4 - 3 * br, 10 * Math.sin((t / 3.0) * Math.PI * 2 + 1), 12 * tilt).rot('jaw', 3 + 5 * bump(t, 1.4, 2.0));
      P.face('eyes', tilt > 0.5 ? 'angry' : undefined); ES(P, 1, 1 - 0.2 * tilt + 0.05 * br); P.pos('eyeR', 0.3 * Math.round(wave(t, 1 / 3, 1)), 0, 0).pos('eyeL', 0.3 * Math.round(wave(t, 1 / 3, 1)), 0, 0);
    } },
    // the stalk: long slow strides, the skull thrusting and holding like any pigeon's, the wings swaying
    walk: { len: 1.1, loop: true, f(P, t) {
      const r = strut(P, t, 1.1, { Z: 3.6, H: 2.6, A: 2.0, roll: 3, yaw: 5, bounce: 1.0, tilt: 2 });
      burn(P, t); embers(P, 0.8);
      P.rot('wingR', -r.s * 6, 0, -2).rot('wingL', r.s * 6, 0, 2).rot('foreR', 0, 0, r.s * 4).rot('foreL', 0, 0, r.s * 4);
      P.burst(0.1, 'ember', 'footR', [-4.2, 0.5, 4], { n: 6, spread: 1 }).burst(0.65, 'ember', 'footL', [4.2, 0.5, 4], { n: 6, spread: 1 });
    } },
    // battle cry: it rears back, wings flung wide, the jaw drops in a roar of fire, the flames double, the hat lifts
    cry: { len: 2.4, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.35, E.inout) * (1 - seg(t, 0.35, 0.45, E.out)), up = seg(t, 0.4, 0.58, E.back) * (1 - seg(t, 1.8, 2.3, E.inout));
      const dy = -2.0 * crouch + 1.0 * up; P.pos('body', 0, dy, 0).sq('body', -0.06 * crouch + wob(t, 2.1, 0.03, 3, 5)); plant(P, dy, 13);
      burn(P, t, 1 + 0.9 * up); embers(P, 1 + 3 * up);
      P.rot('body', 8 * crouch - 12 * up, 0, 0).rot('head', 14 * crouch - 30 * up + wave(t, 11) * 3 * up, 0, wave(t, 7) * 3 * up).rot('jaw', 6 * crouch + 44 * up);
      P.rot('wingR', -20 * up, 20 * up, -40 * up).rot('wingL', -20 * up, -20 * up, 40 * up).rot('foreR', 0, 0, -50 * up).rot('foreL', 0, 0, 50 * up).rot('handR', 0, 0, 20 * up).rot('handL', 0, 0, -20 * up);
      P.pos('hat', 0, 2.2 * bump(t, 0.55, 1.1), 0).rot('hat', -12 * bump(t, 0.55, 1.1), 0, 0);
      P.face('eyes', up > 0.3 ? 'angry' : crouch > 0.4 ? 'shut' : undefined); P.lookW = 1 - up; ES(P, 1 + 0.2 * up, 1 + 0.3 * up - 0.3 * crouch);
      if (t > 0.6 && t < 1.6) P.stream('breath', 'head', MOUTH, { rate: 90, dir: [0, 0.5, 1], speed: 1.1, spread: 0.35, scale: 2.2 });
      P.burst(0.6, 'ring', 'root', [0, 1, 0], { scale: 3 }).burst(0.6, 'pg_blaze', 'root', [0, 1, 0], { n: 18, spread: 1, speed: 2.2 });
    } },
    // attack: the right wing rises high and slashes down and across, trailing fire, bones cracking on impact
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.32, E.out) * (1 - seg(t, 0.32, 0.4, E.in)), hit = seg(t, 0.32, 0.46, E.in3) * (1 - seg(t, 0.6, 1.05, E.inout));
      burn(P, t, 1 + 0.4 * hit); embers(P);
      P.pos('root', 0, 0, key([[0, 0], [0.32, -1.6], [0.46, 7, 'out'], [0.7, 6], [1.1, 0]], t));
      P.rot('wingR', -50 * wind + 40 * hit, 60 * wind - 60 * hit, -60 * wind + 30 * hit).rot('foreR', 0, 0, -40 * wind + 30 * hit);
      P.rot('body', -10 * wind + 14 * hit, 20 * wind - 24 * hit, 0).rot('head', -10 * wind + 12 * hit, -14 * wind + 10 * hit, 0).rot('jaw', 18 * wind);
      const dy = -1.4 * wind + wob(t, 0.46, -1.0, 3, 6); P.pos('body', 0, dy, 0); plant(P, dy, 13);
      if (t > 0.32 && t < 0.52) P.stream('pg_blaze', 'handR', HANDR, { rate: 60, speed: 0.6 });
      P.burst(0.46, 'spark', 'handR', HANDR, { scale: 2 }).burst(0.46, 'pg_bone', 'handR', HANDR, { n: 8 }).burst(0.46, 'star', 'handR', HANDR, { n: 4 });
      P.face('eyes', t > 0.05 && t < 0.85 ? 'angry' : undefined);
    } },
    // special (wall of fire): it rises, wings spread high, then sweeps them down and forward — a wall of fire
    // erupts from the ground and rolls across the field
    special: { len: 2.6, next: 'idle', f(P, t) {
      const rise = seg(t, 0, 0.6, E.inout) * (1 - seg(t, 0.62, 0.8, E.in)), sweep = seg(t, 0.62, 0.86, E.in3) * (1 - seg(t, 1.9, 2.5, E.inout));
      const dy = 1.6 * rise - 1.2 * sweep; P.pos('body', 0, dy, 0); plant(P, dy, 13);
      burn(P, t, 1 + 0.8 * rise + 0.6 * sweep); embers(P, 1 + 2 * rise);
      P.rot('wingR', -40 * rise + 40 * sweep, 30 * rise - 50 * sweep, -60 * rise + 10 * sweep).rot('wingL', -40 * rise + 40 * sweep, -30 * rise + 50 * sweep, 60 * rise - 10 * sweep);
      P.rot('foreR', 0, 0, -60 * rise + 20 * sweep).rot('foreL', 0, 0, 60 * rise - 20 * sweep).rot('body', -10 * rise + 16 * sweep, 0, 0).rot('head', -20 * rise + 18 * sweep, 0, 0).rot('jaw', 30 * rise + 20 * sweep);
      P.face('eyes', rise > 0.4 || sweep > 0.2 ? 'angry' : undefined); P.lookW = 1 - rise;
      if (t > 0.7 && t < 1.9) {
        const z = 8 + (t - 0.7) * 34;
        for (let i = -3; i <= 3; i++) P.stream('pg_blaze', 'root', [i * 4.5, 0.6, z + Math.abs(i) * -1.5], { rate: 26, dir: [0, 1, 0.2], speed: 1.3, spread: 0.3, key: 'w' + i, scale: 1.6 });
        P.stream('ember', 'root', [0, 2, z], { rate: 40, spread: 1, speed: 2 });
      }
      P.burst(0.8, 'ring', 'root', [0, 1, 6], { scale: 4 }).burst(0.8, 'pg_blaze', 'root', [0, 1, 4], { n: 24, spread: 1, speed: 2.4 });
    } },
    // hurt: the bones rattle, the flames gutter, chips of bone fly
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.25, 0.7, E.inout)), rat = wave(t, 18) * k;
      burn(P, t, 1 - 0.6 * k);
      P.pos('root', 0, 0, -3 * k).rot('body', -12 * k + rat * 3, rat * 4, rat * 3).rot('head', -16 * k + rat * 6, rat * 8, 10 * k).rot('jaw', 22 * k);
      P.rot('wingR', 0, 0, -16 * k + rat * 6).rot('wingL', 0, 0, 16 * k - rat * 6).rot('hat', 0, 0, rat * 6).pos('hat', 0, 1.2 * k, 0);
      P.face('eyes', t < 0.1 ? 'shock' : t < 0.45 ? 'shut' : undefined); ES(P, 1 + 0.3 * bump(t, 0, 0.12), 1 + 0.4 * bump(t, 0, 0.12));
      P.burst(0.02, 'pg_bone', 'body', [0, 22, 4], { n: 10 }).burst(0.02, 'spark', 'body', [0, 22, 6], { scale: 2 }).burst(0.05, 'smoke', 'body', [0, 26, 0], { n: 4, scale: 2 });
    } },
    // faint: the fire gutters out, the skeleton sways and folds into a heap; the hat tumbles to the ground
    faint: { len: 2.6, next: 'down', f(P, t) {
      const sway = seg(t, 0, 0.4) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.55, E.bounce), out = seg(t, 0.3, 1.2);
      burn(P, t, 1 - out); if (out >= 1) P.face('fire', 'off');
      P.rot('body', wave(t, 1.2) * 6 * sway, wave(t, 1.5) * 10 * sway, wave(t, 1.8) * 6 * sway).rot('head', 0, wave(t, 1.8, 1) * 16 * sway, 0);
      const dy = -8.0 * fall - 1.2 * sway; P.pos('body', 0, dy, 2 * fall).rot('body', 30 * fall, 0, 8 * fall); plant(P, dy, 13);
      P.rot('legR', -40 * fall, 0, 20 * fall).rot('legL', -40 * fall, 0, -20 * fall);
      P.rot('head', 40 * fall, 0, -20 * fall).rot('jaw', 24 * fall).rot('wingR', 30 * fall, 0, 30 * fall).rot('wingL', 30 * fall, 0, -30 * fall);
      const tum = seg(t, 1.05, 1.7, E.out); P.pos('hat', 6 * tum, -16 * tum, 6 * tum).rot('hat', 70 * tum, 0, -90 * tum);
      P.face('eyes', t < 0.4 ? 'teary' : t < 1.0 ? 'swirl' : 'x'); P.blinkOK = false; P.lookW = 0; ES(P, 1 - 0.3 * out + 0.3);
      P.stream('smoke', 'body', [0, 26, 0], { rate: 6 * out, scale: 2 });
      P.burst(1.55, 'dust', 'root', [0, 1, 4], { n: 12, spread: 1, scale: 2 }).burst(1.55, 'pg_bone', 'root', [0, 2, 4], { n: 10 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      P.face('fire', 'off'); P.pos('body', 0, -8.0, 2).rot('body', 30, 0, 8); plant(P, -8.0, 13);
      P.rot('legR', -40, 0, 20).rot('legL', -40, 0, -20).rot('head', 40, 0, -20).rot('jaw', 24 + wave(t, 0.33) * 3).rot('wingR', 30, 0, 30).rot('wingL', 30, 0, -30);
      P.pos('hat', 6, -16, 6).rot('hat', 70, 0, -90);
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.3;
      P.stream('smoke', 'body', [0, 24, 2], { rate: 2, scale: 2 }).stream('ember', 'body', [0, 22, 2], { rate: 2 });
    } },
    // victory: a slow theatrical bow, the hat swept off with a wing and back on, the fire flaring into a pillar
    win: { len: 2.6, next: 'idle', f(P, t) {
      const bow = bump(t, 0.3, 1.9), doff = seg(t, 0.25, 0.6, E.out) * (1 - seg(t, 1.6, 2.1, E.inout));
      burn(P, t, 1 + 0.6 * bump(t, 1.9, 2.5)); embers(P, 1 + bump(t, 1.9, 2.5) * 4);
      P.rot('body', 22 * bow, 0, 0).rot('head', 16 * bow, 0, 0).pos('body', 0, -1.2 * bow, 0); plant(P, -1.2 * bow, 13);
      P.rot('wingR', -60 * doff, 20 * doff, -30 * doff).rot('foreR', 0, 0, -60 * doff);
      P.pos('hat', -5 * doff, 3 * doff, 4 * doff).rot('hat', -30 * doff, 0, 30 * doff);
      P.rot('wingL', 0, -30 * bow, 30 * bow);
      P.face('eyes', doff > 0.5 ? 'star' : bow > 0.4 ? 'happy' : undefined); ES(P, 1 + 0.15 * doff);
      P.burst(2.0, 'pg_blaze', 'root', [0, 1, 0], { n: 30, spread: 0.6, speed: 3 }).burst(2.0, 'ring', 'root', [0, 1, 0], { scale: 3 });
    } },
    // asleep: hunched, wings wrapped round it like a cloak, the skull bowed, the wig over its face, the fire low
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * Math.PI * 2), dy = -2.0 + br * 0.3;
      burn(P, t, 0.35 + 0.05 * br); P.pos('body', 0, dy, 0).rot('body', 10, 0, 0); plant(P, dy, 13);
      P.rot('head', 30 + br * 2, 0, 8).rot('wingR', 10, -40, 20).rot('wingL', 10, 40, -20).rot('foreR', 0, 0, 30).rot('foreL', 0, 0, -30);
      P.face('eyes', 'closed'); ES(P, 1.05, 0.7 + 0.05 * br); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.stream('pg_smoke', 'head', [0, 36, 10], { rate: 1.5, scale: 2 });
      P.burst(0.6, 'z', 'head', [4, 44, 6], { scale: 2 }).burst(2.2, 'z', 'head', [4, 44, 6], { scale: 2 });
    } },
    // dance: a slow burning stomp on a heavy 0.7 s beat — the body drops on each beat, a talon stamps sparks, the
    // wings flap the flames high in turn, the hat rocks; a full turn on beat four, then the finish: wings flung
    // wide, a pillar of fire, the hat tipped and held
    dance: { len: 3.4, next: 'idle', f(P, t) {
      const B = 0.7, b = Math.min(3, Math.floor(t / B)), u = (t % B) / B, side = b % 2 ? 1 : -1, live = 1 - seg(t, 2.6, 2.8, E.inout);
      const drop = (1 - Math.min(1, u * 3.2)) * (u < 0.85 ? 1 : 0) * live, lift = Math.sin(u * Math.PI) * live;
      const spin = seg(t, 2.1, 2.75, E.inout), fin = seg(t, 2.7, 2.95, E.back) * (1 - seg(t, 3.15, 3.4, E.inout));
      const dy = -1.6 * drop + 0.6 * lift + 1.0 * fin; P.pos('body', 0, dy, 0).sq('body', -0.05 * drop + 0.03 * fin); plant(P, dy, 13);
      P.rot('root', 0, 360 * spin, 0).rot('body', 6 * drop - 8 * fin, 12 * side * lift * (1 - spin), 6 * side * lift);
      P.rot('legR', side < 0 ? -26 * lift : 0, 0, 0).rot('legL', side > 0 ? -26 * lift : 0, 0, 0);
      P.rot('head', 10 * drop - 14 * fin, -14 * side * lift, -10 * side * lift).rot('jaw', 10 * drop + 30 * fin);
      const fr = side < 0 ? lift : 0.3 * lift, fl = side > 0 ? lift : 0.3 * lift;
      P.rot('wingR', -30 * fr - 40 * fin, 10 * fr + 20 * fin, -40 * fr - 50 * fin).rot('foreR', 0, 0, -30 * fr - 40 * fin).rot('handR', 0, 0, 20 * fr);
      P.rot('wingL', -30 * fl - 40 * fin, -10 * fl - 20 * fin, 40 * fl + 50 * fin).rot('foreL', 0, 0, 30 * fl + 40 * fin).rot('handL', 0, 0, -20 * fl);
      P.rot('hat', -18 * fin, 0, 12 * side * lift).pos('hat', 0, 1.6 * fin, 1.2 * fin);
      burn(P, t, 1 + 0.5 * drop + 0.9 * fin); embers(P, 1 + 2 * drop + 4 * fin);
      for (let i = 0; i < 4; i++) P.burst(i * B + 0.02, 'spark', i % 2 ? 'footL' : 'footR', [i % 2 ? 4.2 : -4.2, 0.5, 4], { scale: 1.6 }).burst(i * B + 0.02, 'dust', 'root', [i % 2 ? 4 : -4, 0.5, 4], { n: 4 });
      P.burst(2.8, 'pg_blaze', 'root', [0, 1, 0], { n: 34, spread: 0.5, speed: 3.2 }).burst(2.8, 'ring', 'root', [0, 1, 0], { scale: 3.5 }).burst(2.8, 'note', 'head', [0, 46, 4], { n: 3 });
      P.face('eyes', fin > 0.3 ? 'star' : drop > 0.6 ? 'angry' : 'smug'); ES(P, 1 + 0.1 * fin, 1 - 0.15 * drop + 0.15 * fin); P.lookW = 0.3;
    } },
    // signature: the hat trick — a wingtip flicks the top hat off, it spins high up through a column of fire, the
    // skull follows it with its eyes, and it drops back dead on the wig with a wobble; star eyes and a jaw grin
    hattrick: { len: 2.8, next: 'idle', f(P, t) {
      const reach = seg(t, 0.05, 0.35, E.inout) * (1 - seg(t, 0.45, 0.8, E.inout)), flick = seg(t, 0.35, 0.45, E.out);
      const fly = seg(t, 0.4, 1.7, E.lin), arc = 4 * fly * (1 - fly) * (t < 1.7 ? 1 : 0);
      const land = t > 1.7 ? wob(t, 1.7, 1, 4, 5) : 0, pose = seg(t, 1.75, 2.0, E.back) * (1 - seg(t, 2.4, 2.8, E.inout));
      burn(P, t, 1 + 0.7 * arc); embers(P, 1 + 2 * arc);
      P.rot('wingR', -70 * reach - 30 * flick * (1 - fly), 30 * reach, -20 * reach - 30 * flick * (1 - fly)).rot('foreR', 0, 0, -70 * reach);
      P.pos('hat', 0, 26 * arc + 1.2 * reach, 1.5 * arc).rot('hat', -20 * reach + 360 * 2 * fly * (t < 1.7 ? 1 : 0) + 6 * land, 540 * fly * (t < 1.7 ? 1 : 0), 4 * land);
      P.rot('head', -28 * arc + 10 * land, 0, 0).rot('jaw', 12 * arc + 20 * pose).rot('body', -6 * arc, 0, 0);
      const dy = -1.2 * Math.abs(land) + 0.6 * pose; P.pos('body', 0, dy, 0).sq('body', -0.04 * Math.abs(land)); plant(P, dy, 13);
      P.rot('wingL', -30 * pose, -20 * pose, 40 * pose).rot('foreL', 0, 0, 40 * pose);
      if (t > 0.45 && t < 1.6) P.stream('pg_blaze', 'head', [0, 44 + 26 * arc, 3], { rate: 30, spread: 0.5, speed: 0.8, key: 'ht' });
      P.burst(0.42, 'spark', 'head', [0, 44, 3], { scale: 1.5 }).burst(1.72, 'ring', 'head', [0, 44, 3], { scale: 2 }).burst(1.72, 'star', 'head', [0, 46, 3], { n: 5 });
      P.face('eyes', t > 1.75 ? (pose > 0.2 ? 'star' : undefined) : arc > 0.15 ? 'wide' : undefined); P.lookW = 1 - Math.min(1, arc * 3); ES(P, 1 + 0.15 * arc + 0.1 * pose);
      P.pos('eyeR', 0, 0.3 * arc, 0).pos('eyeL', 0, 0.3 * arc, 0);
    } },
    // fidget: tips its top hat with a wingtip — a slow, polite, terrifying greeting
    tiphat: { len: 2.0, next: 'idle', f(P, t) {
      burn(P, t); embers(P);
      const up = seg(t, 0.1, 0.5, E.inout) * (1 - seg(t, 1.4, 1.9, E.inout)), tip = bump(t, 0.6, 1.3);
      P.rot('wingR', -70 * up, 30 * up, -20 * up).rot('foreR', 0, 0, -70 * up);
      P.pos('hat', 0, 1.4 * tip, 1.0 * tip).rot('hat', -24 * tip, 0, 0).rot('head', 12 * tip, 0, 0).rot('body', 6 * tip, 0, 0);
      P.face('eyes', tip > 0.4 ? 'happy' : undefined);
    } },
    // fidget: shakes itself like a wet dog — bones rattling, embers flying
    rattle: { len: 1.6, next: 'idle', f(P, t) {
      const k = bump(t, 0.2, 1.3), r = wave(t, 9) * k;
      burn(P, t, 1 + 0.4 * k); embers(P, 1 + 3 * k);
      P.rot('body', 0, r * 10, r * 6).rot('head', 0, -r * 14, -r * 8).rot('wingR', 0, 0, r * 10).rot('wingL', 0, 0, r * 10).rot('jaw', 10 * k * Math.max(0, wave(t, 12)));
      P.pos('hat', 0, 0.8 * k * Math.max(0, wave(t, 9)), 0);
      P.burst(0.7, 'pg_bone', 'body', [0, 22, 0], { n: 6 }).burst(0.5, 'ember', 'body', [0, 22, 0], { n: 20, spread: 1, speed: 2 });
    } },
    // fidget: twirls a ringlet of the wig round a bone wingtip
    preen: { len: 2.4, next: 'idle', f(P, t) {
      burn(P, t); embers(P);
      const up = seg(t, 0.1, 0.5, E.inout) * (1 - seg(t, 1.7, 2.2, E.inout)), tw = Math.sin(seg(t, 0.5, 1.7, E.lin) * Math.PI * 4) * up;
      P.rot('wingL', -40 * up, -50 * up, 30 * up).rot('foreL', 0, 0, 50 * up + tw * 10).rot('handL', 0, 0, tw * 14);
      P.rot('head', 6 * up, 18 * up, 10 * up).rot('curlL1', tw * 20, 0, tw * 12);
      P.face('eyes', up > 0.5 ? 'happy' : undefined);
    } },
  },
};
def.anim = anim;
// the ultra-drip form (&drip=3): the automatic black-and-gold map; flames, embers and the blaze sprites burn blue
def.dripForm = { fx: { pg_blaze: 'pg_blueblaze' } };
