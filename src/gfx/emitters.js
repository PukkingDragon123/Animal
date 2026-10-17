// Ambient particle emitters attached to model anchors (design.fx entries):
// flame tails, dripping water, drifting spores, music notes, ghost wisps…
// `tickEmitters(fx, rig, dt, mul)` spawns particles at each anchor's world pos.
import * as THREE from '../../vendor/three.module.js';
import { SPR } from './particles.js';

const _v = new THREE.Vector3();
const rnd = (a = 1) => (Math.random() - 0.5) * 2 * a;
const C = (hex, k = 1, a = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k, a]; };

// type → (fx, p:[x,y,z], s:scale, color) spawn function; `rate` = particles/sec at scale 1
export const EMITTERS = {
  flame: { rate: 28, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.03 * s), p[1], p[2] + rnd(0.03 * s)], vel: [rnd(0.15), 0.9 * s + Math.random() * 0.4, rnd(0.15)], life: 0.38 + Math.random() * 0.2, size: 0.16 * s, size1: 0.03 * s, color: col || [3.2, 1.5, 0.35, 1], color1: [2.2, 0.25, 0.05, 0], sprite: SPR.flame, drag: 1.5 }) },
  ember: { rate: 6, f: (fx, p, s, col) => fx.particle({ pos: [p[0], p[1], p[2]], vel: [rnd(0.4), 0.8 + Math.random() * 0.8, rnd(0.4)], life: 0.9, size: 0.04 * s, color: col || [3, 1.2, 0.2, 1], color1: [1.5, 0.2, 0, 0], sprite: SPR.ember, drag: 0.6 }) },
  smoke: { rate: 5, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [rnd(0.1), 0.5, rnd(0.1)], life: 1.6, size: 0.12 * s, size1: 0.4 * s, color: col || [0.3, 0.28, 0.3, 0.55], color1: [0.5, 0.5, 0.52, 0], sprite: SPR.smoke, additive: false, spin: rnd(1) }) },
  steam: { rate: 8, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [rnd(0.15), 0.7, rnd(0.15)], life: 1.2, size: 0.1 * s, size1: 0.35 * s, color: col || [0.95, 0.97, 1, 0.5], color1: [1, 1, 1, 0], sprite: SPR.smoke, additive: false, spin: rnd(1) }) },
  drip: { rate: 3, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [0, -0.2, 0], gravity: 6, life: 0.7, size: 0.06 * s, color: col || [0.5, 0.8, 1.2, 0.95], color1: [0.4, 0.7, 1, 0.6], sprite: SPR.drop, additive: false, floor: 0.02 }) },
  bubble: { rate: 4, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.05), p[1], p[2] + rnd(0.05)], vel: [rnd(0.1), 0.35, rnd(0.1)], life: 1.4, size: 0.07 * s, size1: 0.1 * s, color: col || [0.7, 0.9, 1.1, 0.85], color1: [0.8, 1, 1.2, 0], sprite: SPR.bubble, additive: false }) },
  spore: { rate: 5, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.1 * s), p[1], p[2] + rnd(0.1 * s)], vel: [rnd(0.2), 0.25 + Math.random() * 0.2, rnd(0.2)], life: 1.8, size: 0.05 * s, color: col || [1.2, 1.6, 0.5, 1], color1: [0.6, 1.4, 0.4, 0], sprite: SPR.dot, drag: 0.5 }) },
  leaf: { rate: 1.5, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [rnd(0.3), -0.25, rnd(0.3)], life: 2.2, size: 0.08 * s, color: col || [0.45, 0.85, 0.3, 1], color1: [0.4, 0.7, 0.25, 0], sprite: SPR.leaf, additive: false, spin: rnd(3), floor: 0.02 }) },
  petal: { rate: 2, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [rnd(0.3), -0.2, rnd(0.3)], life: 2.4, size: 0.07 * s, color: col || [1, 0.75, 0.85, 1], color1: [1, 0.8, 0.9, 0], sprite: SPR.petal, additive: false, spin: rnd(3), floor: 0.02 }) },
  spark: { rate: 7, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [rnd(1.6), rnd(1.6), rnd(1.6)], life: 0.18, size: 0.12 * s, aspect: 0.25, color: col || [2.5, 2.4, 0.6, 1], color1: [1.5, 1.4, 2, 0], sprite: SPR.streak, align: true }) },
  note: { rate: 0.9, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [rnd(0.25), 0.6, rnd(0.25)], life: 1.5, size: 0.12 * s, color: col || [1, 0.85, 1.2, 1], color1: [0.8, 0.6, 1, 0], sprite: Math.random() < 0.5 ? SPR.note : SPR.note2, additive: false }) },
  dust: { rate: 3, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [rnd(0.3), 0.15, rnd(0.3)], life: 0.9, size: 0.08 * s, size1: 0.25 * s, color: col || [0.6, 0.5, 0.4, 0.5], color1: [0.65, 0.55, 0.45, 0], sprite: SPR.smoke, additive: false }) },
  snow: { rate: 3, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.1), p[1], p[2] + rnd(0.1)], vel: [rnd(0.2), -0.15, rnd(0.2)], life: 1.6, size: 0.06 * s, color: col || [1.2, 1.3, 1.5, 1], color1: [1, 1, 1.2, 0], sprite: SPR.snow, spin: rnd(2) }) },
  glow: { rate: 4, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.04 * s), p[1] + rnd(0.04 * s), p[2] + rnd(0.04 * s)], vel: [0, 0.05, 0], life: 0.6, size: 0.25 * s, size1: 0.1 * s, color: col || [1.4, 1.2, 0.6, 0.6], color1: [1, 0.8, 0.4, 0], sprite: SPR.dot }) },
  star: { rate: 2, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.15 * s), p[1] + rnd(0.15 * s), p[2] + rnd(0.15 * s)], vel: [0, 0.1, 0], life: 0.7, size: 0.1 * s, size1: 0.02, color: col || [2, 2, 1.6, 1], color1: [1.5, 1.5, 2, 0], sprite: SPR.star, spin: 2 }) },
  wisp: { rate: 6, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.05 * s), p[1], p[2] + rnd(0.05 * s)], vel: [rnd(0.2), 0.45, rnd(0.2)], life: 1.0, size: 0.14 * s, size1: 0.02, color: col || [0.8, 0.5, 2.2, 0.9], color1: [0.3, 0.9, 1.6, 0], sprite: SPR.dot }) },
  rift: { rate: 10, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.08 * s), p[1] + rnd(0.08 * s), p[2] + rnd(0.08 * s)], vel: [rnd(0.6), 0.5 + rnd(0.3), rnd(0.6)], life: 0.5, size: 0.08 * s, color: col || [1.4, 3, 0.5, 1], color1: [0.4, 2, 0.6, 0], sprite: Math.random() < 0.3 ? SPR.shard : SPR.pix, spin: rnd(6) }) },
  gem: { rate: 2, f: (fx, p, s, col) => fx.particle({ pos: [p[0] + rnd(0.05), p[1] + rnd(0.05), p[2] + rnd(0.05)], vel: [0, 0.2, 0], life: 0.6, size: 0.08 * s, color: col || [1, 2.2, 2.6, 1], color1: [1, 1, 2, 0], sprite: SPR.star, spin: 3 }) },
  zz: { rate: 0.7, f: (fx, p, s, col) => fx.particle({ pos: p.slice(), vel: [0.15, 0.4, 0], life: 1.6, size: 0.1 * s, size1: 0.18 * s, color: col || [0.9, 0.95, 1.2, 1], color1: [0.8, 0.9, 1.2, 0], sprite: SPR.zz, additive: false }) },
};

export function tickEmitters(fx, rig, dt, mul = 1, scaleMul = 1) {
  if (!rig || !rig.emitters) return;
  for (const e of rig.emitters) {
    const def = EMITTERS[e.type];
    if (!def) continue;
    e.acc += dt * def.rate * e.rate * mul;
    if (e.acc < 1) continue;
    e.anchor.getWorldPosition(_v);
    const p = [_v.x, _v.y, _v.z];
    const col = e.color ? C(e.color, e.glow ?? 1.6) : null;
    while (e.acc >= 1) { e.acc -= 1; def.f(fx, p, e.scale * scaleMul, col); }
  }
}
