// High-level battle VFX recipes built on the particle/shape/debris system.
import * as THREE from '../../vendor/three.module.js';
import { SPR } from './particles.js';
import { ELEMENTS } from '../data/elements.js';
import { buildModel } from './model.js';

const rnd = (a = 1) => (Math.random() - 0.5) * 2 * a;
const C = (hex, k = 1, a = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k, a]; };
export const ELEM_COL = Object.fromEntries(Object.entries(ELEMENTS).map(([k, v]) => [k, v.color]));
const ecol = (e) => ELEM_COL[e] || '#ffffff';

const PROJ_STYLE = {
  pyro: { sprite: SPR.flame, trail: SPR.flame, col: '#ff8a2b', core: '#fff2a0', size: 0.55, glow: 3 },
  hydro: { sprite: SPR.drop, trail: SPR.bubble, col: '#4fc8ff', core: '#e8fbff', size: 0.45, glow: 2.2 },
  bio: { sprite: SPR.leaf, trail: SPR.dot, col: '#7ae05a', core: '#e8ffd0', size: 0.4, glow: 1.8 },
  geo: { sprite: SPR.pix, trail: SPR.smoke, col: '#c8925a', core: '#f0d0a0', size: 0.5, glow: 0.8, cube: true },
  echo: { sprite: SPR.ring, trail: SPR.note, col: '#c890ff', core: '#5ff4ff', size: 0.7, glow: 2.4 },
  volto: { sprite: SPR.bolt, trail: SPR.streak, col: '#ffe84a', core: '#ffffff', size: 0.5, glow: 3 },
  cryo: { sprite: SPR.shard, trail: SPR.snow, col: '#a8f4ff', core: '#ffffff', size: 0.45, glow: 2.2 },
  aero: { sprite: SPR.swirl, trail: SPR.streak, col: '#b8ffd8', core: '#ffffff', size: 0.55, glow: 1.8 },
  ecto: { sprite: SPR.dot, trail: SPR.dot, col: '#a07aff', core: '#ff8af2', size: 0.55, glow: 2.6 },
  ferro: { sprite: SPR.shard, trail: SPR.streak, col: '#d0dae4', core: '#ffffff', size: 0.4, glow: 1.4 },
  astro: { sprite: SPR.star, trail: SPR.star, col: '#ffe8a0', core: '#ffffff', size: 0.6, glow: 3 },
  nucleo: { sprite: SPR.shard, trail: SPR.pix, col: '#9aff4a', core: '#f0ffd0', size: 0.55, glow: 3 },
  none: { sprite: SPR.dot, trail: SPR.dot, col: '#ffffff', core: '#ffffff', size: 0.3, glow: 1.4 },
};

export class VFX {
  constructor(gfx) {
    this.g = gfx; this.fx = gfx.fx;
    this.proj = new Map();   // id → {mesh, style, last}
    this.zones = new Map();
    this.walls = new Map();
    this.tele = new Map();
    this.misc = new THREE.Group();
    gfx.scene.add(this.misc);
    this._cube = new THREE.BoxGeometry(1, 1, 1);
    this._sphere = new THREE.SphereGeometry(1, 16, 12);
    this._disc = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2);
    this._ring = new THREE.RingGeometry(0.92, 1, 48).rotateX(-Math.PI / 2);
    this._plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  }
  // ------------------------------------------------------------ hits
  hit(pos, elem, { crit = false, big = false, precise = false } = {}) {
    const st = PROJ_STYLE[elem] || PROJ_STYLE.none;
    const col = C(elem ? st.col : '#ffffff', 2.4);
    const n = crit ? 22 : big ? 16 : 9;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * (crit ? 7 : 4);
      this.fx.particle({ pos: [pos.x, pos.y, pos.z], vel: [Math.cos(a) * s, rnd(2) + 1.5, Math.sin(a) * s], life: 0.22 + Math.random() * 0.15, size: 0.28, aspect: 0.22, color: col, color1: [col[0], col[1], col[2], 0], sprite: SPR.streak, align: true, drag: 4 });
    }
    this.fx.particle({ pos: [pos.x, pos.y, pos.z], life: 0.16, size: crit ? 1.6 : 1.0, size1: 0.2, color: [3, 3, 3, 1], color1: [2, 2, 2, 0], sprite: SPR.star, rot: Math.random() * 6 });
    if (elem) this.fx.burst(crit ? 10 : 5, () => ({ pos: [pos.x, pos.y, pos.z], vel: [rnd(2.5), Math.random() * 2.5, rnd(2.5)], life: 0.5, size: st.size * 0.5, size1: 0.05, color: C(st.col, st.glow), color1: C(st.col, st.glow * 0.5, 0), sprite: st.trail, drag: 2, gravity: elem === 'geo' ? 8 : 0 }));
    if (elem === 'geo' || big) this.fx.shatter([pos.x, pos.y - 0.2, pos.z], { count: big ? 10 : 5, size: 0.08, colors: [0x9a8a7a, 0x6a5a4a], force: 3, up: 3, life: 1.2 });
    if (precise) this.fx.shape({ kind: 'ring', pos: [pos.x, pos.y, pos.z], r0: 0.2, r1: 1.4, life: 0.35, color: 0xffffff, intensity: 3, vertical: true, yaw: 0 });
    this.g.lights.flash([pos.x, pos.y, pos.z], elem ? st.col : '#ffffff', crit ? 9 : 5, 5, 0.18);
  }
  // ------------------------------------------------------------ projectiles
  projStart(p) {
    const elem = p.elem || 'none';
    const st = PROJ_STYLE[elem] || PROJ_STYLE.none;
    let mesh;
    if (st.cube || p.sprite === 'rock_lob') {
      mesh = new THREE.Mesh(this._cube, new THREE.MeshToonMaterial({ color: st.col }));
      mesh.scale.setScalar(0.35 + (p.r || 0.3) * 0.6); mesh.castShadow = true;
    } else {
      mesh = new THREE.Mesh(this._sphere, new THREE.MeshBasicMaterial({ color: new THREE.Color(st.core).multiplyScalar(st.glow), toneMapped: false }));
      mesh.scale.setScalar(Math.max(0.12, (p.r || 0.25) * 0.75));
    }
    this.misc.add(mesh);
    this.proj.set(p.id, { mesh, st, elem, wave: p.wave, t: 0 });
  }
  projUpdate(p, dt, y = 0.6) {
    const r = this.proj.get(p.id);
    if (!r) return;
    r.t += dt;
    let py = y;
    if (p.arc) { const u = Math.min(1, p.dist / (p.arcLen || 1)); py = y + Math.sin(u * Math.PI) * Math.max(1.2, (p.arcLen || 4) * 0.35); }
    r.mesh.position.set(p.x, py, p.z);
    if (r.st.cube) { r.mesh.rotation.x += dt * 9; r.mesh.rotation.z += dt * 7; }
    const st = r.st;
    const n = r.wave ? 3 : 2;
    for (let i = 0; i < n; i++) {
      this.fx.particle({ pos: [p.x + rnd(0.08), py + rnd(0.08), p.z + rnd(0.08)], vel: [-p.dx * 1.5 + rnd(0.6), rnd(0.6), -p.dz * 1.5 + rnd(0.6)], life: 0.32, size: st.size * (r.wave ? 1.4 : 0.8) * (0.6 + (p.r || 0.3)), size1: 0.04, color: C(st.col, st.glow), color1: C(st.col, st.glow * 0.4, 0), sprite: i === 0 ? st.sprite : st.trail, rot: Math.random() * 6, drag: 3 });
    }
    if (r.wave && Math.random() < 0.5) this.fx.shape({ kind: 'ring', pos: [p.x, py, p.z], r0: 0.3, r1: 1.0, life: 0.3, color: st.col, intensity: 1.6, vertical: true, yaw: Math.atan2(p.dx, p.dz) });
  }
  projEnd(id, x, z) {
    const r = this.proj.get(id);
    if (!r) return;
    this.misc.remove(r.mesh); r.mesh.material.dispose();
    this.proj.delete(id);
    this.fx.burst(6, () => ({ pos: [x, 0.6, z], vel: [rnd(2), Math.random() * 2, rnd(2)], life: 0.35, size: r.st.size * 0.5, color: C(r.st.col, r.st.glow), color1: C(r.st.col, 1, 0), sprite: r.st.trail, drag: 3 }));
  }
  // ------------------------------------------------------------ bursts & areas
  burst(x, z, r, elem, { small = false, crack = false, up = 0, y = 0 } = {}) {
    const st = PROJ_STYLE[elem] || PROJ_STYLE.none;
    this.fx.shape({ kind: 'ring', pos: [x, y + 0.08, z], r0: 0.2, r1: r * 1.1, life: small ? 0.35 : 0.55, color: st.col, intensity: 2.6 });
    if (!small) this.fx.shape({ kind: 'sphere', pos: [x, y + 0.3, z], r0: 0.3, r1: r * 0.9, life: 0.4, color: st.col, intensity: 1.6 });
    const n = small ? 14 : Math.round(26 + r * 10);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (1.5 + Math.random() * 3.5) * Math.max(1, r * 0.7);
      this.fx.particle({ pos: [x + Math.cos(a) * 0.3, y + 0.3, z + Math.sin(a) * 0.3], vel: [Math.cos(a) * s, 1 + Math.random() * 3 + up * 0.5, Math.sin(a) * s], life: 0.5 + Math.random() * 0.4, size: st.size * (0.7 + Math.random() * 0.8), size1: 0.05, color: C(st.col, st.glow), color1: C(st.col, 0.6, 0), sprite: Math.random() < 0.5 ? st.sprite : st.trail, rot: Math.random() * 6, spin: rnd(4), drag: 2.5, gravity: elem === 'geo' ? 6 : 0.5 });
    }
    if (elem === 'pyro' || elem === 'nucleo') this.fx.burst(10, () => ({ pos: [x + rnd(r * 0.5), y + 0.4, z + rnd(r * 0.5)], vel: [rnd(1), 1.5 + Math.random(), rnd(1)], life: 1.4, size: 0.4, size1: 1.4, color: [0.25, 0.22, 0.24, 0.6], color1: [0.4, 0.4, 0.42, 0], sprite: SPR.smoke, additive: false, spin: rnd(1) }));
    if (elem === 'geo' || crack) { this.fx.shatter([x, y + 0.2, z], { count: Math.round(12 + r * 8), size: 0.12, colors: [0xb08a5a, 0x8a6a44, 0x6a5a4a], force: 4 + r, up: 5 + up }); this.fx.decal('crack', [x, y, z], r * 1.6, 0x3a2a1a, 9); }
    if (elem === 'pyro') this.fx.decal('scorch', [x, y, z], r * 1.4, 0x1a0e08, 7);
    if (elem === 'hydro') this.fx.decal('puddle', [x, y, z], r * 1.3, 0x7fd0ff, 5);
    this.g.lights.flash([x, y + 1, z], st.col, small ? 6 : 12, r * 3 + 3, 0.3);
    if (!small) this.g.impact(Math.min(1.4, 0.4 + r * 0.25));
  }
  line(x, z, dx, dz, range, width, elem) {
    const st = PROJ_STYLE[elem] || PROJ_STYLE.none;
    const n = Math.ceil(range * 2.5);
    for (let i = 0; i < n; i++) {
      const t = i / n * range, px = x + dx * t, pz = z + dz * t;
      setTimeout(() => {
        this.fx.burst(3, () => ({ pos: [px + rnd(width * 0.4), 0.2, pz + rnd(width * 0.4)], vel: [rnd(1), 3 + Math.random() * 3, rnd(1)], life: 0.5, size: st.size * 0.9, size1: 0.05, color: C(st.col, st.glow), color1: C(st.col, 1, 0), sprite: st.sprite, drag: 1.5, gravity: 6 }));
        if (elem === 'geo') this.fx.shatter([px, 0.1, pz], { count: 3, size: 0.18, colors: [0xa08060, 0x7a6048], force: 1.5, up: 6, life: 1.6 });
      }, i * 18);
    }
    this.fx.shape({ kind: 'pillar', pos: [x, 0.6, z], dir: [dx, 0.0001, dz], r0: width * 0.35, r1: width * 0.45, h0: range, life: 0.4, color: st.col, intensity: 1.5 });
    this.g.impact(0.8);
  }
  cone(x, z, dx, dz, range, arc, elem) {
    const st = PROJ_STYLE[elem] || PROJ_STYLE.none;
    const a0 = Math.atan2(dx, dz), half = (arc || 70) * Math.PI / 360;
    for (let i = 0; i < 40; i++) {
      const a = a0 + rnd(half), s = range * (1.4 + Math.random() * 1.2);
      this.fx.particle({ pos: [x + Math.sin(a) * 0.5, 0.6, z + Math.cos(a) * 0.5], vel: [Math.sin(a) * s, rnd(0.6), Math.cos(a) * s], life: 0.45, size: st.size * 0.8, size1: st.size * 1.6, color: C(st.col, st.glow), color1: C(st.col, 0.5, 0), sprite: st.sprite, rot: Math.random() * 6, drag: 2.2 });
    }
    this.g.lights.flash([x + dx * range * 0.5, 1, z + dz * range * 0.5], st.col, 8, range * 2, 0.3);
  }
  // ------------------------------------------------------------ reactions (showpieces)
  reaction(id, x, z, color) {
    const p = [x, 0.8, z];
    const g = this.g;
    g.impact(1.2);
    switch (id) {
      case 'steam': {
        g.flash(0xffffff, 0.55);
        this.fx.shape({ kind: 'sphere', pos: [x, 0.8, z], r0: 0.5, r1: 3.6, life: 0.55, color: 0xffffff, intensity: 2.6 });
        this.fx.shape({ kind: 'ring', pos: [x, 0.1, z], r0: 0.5, r1: 4.5, life: 0.7, color: 0xffd0a0, intensity: 3 });
        for (let i = 0; i < 60; i++) { const a = Math.random() * 6.28, s = 2 + Math.random() * 5; this.fx.particle({ pos: [x, 0.6, z], vel: [Math.cos(a) * s, 1 + Math.random() * 4, Math.sin(a) * s], life: 1.6 + Math.random(), size: 0.5, size1: 2.2, color: [1, 1, 1.05, 0.75], color1: [1, 1, 1, 0], sprite: SPR.smoke, additive: false, drag: 2, spin: rnd(1.5) }); }
        g.lights.flash(p, '#ffe0c0', 22, 12, 0.5);
        break;
      }
      case 'wildfire': case 'magma': case 'overload': case 'sonicboom': case 'firestorm': case 'forge':
        this.burst(x, z, 2.6, id === 'sonicboom' ? 'echo' : id === 'overload' ? 'volto' : 'pyro', {});
        if (id === 'magma') this.fx.decal('scorch', [x, 0, z], 3.6, 0xff4a10, 4, true);
        break;
      case 'bloom':
        for (let i = 0; i < 30; i++) this.fx.particle({ pos: [x + rnd(1.5), 0.3, z + rnd(1.5)], vel: [rnd(1), 1.5 + Math.random() * 2, rnd(1)], life: 1.6, size: 0.3, color: C('#ff9ad8', 2), color1: C('#a8ff8a', 1.5, 0), sprite: Math.random() < 0.5 ? SPR.flower : SPR.petal, spin: rnd(4), drag: 1, gravity: 1 });
        this.fx.shape({ kind: 'ring', pos: [x, 0.08, z], r0: 0.3, r1: 3, life: 0.8, color: 0x8aff9a, intensity: 2 });
        break;
      case 'mudslide': this.burst(x, z, 2.2, 'geo', {}); this.fx.decal('puddle', [x, 0, z], 4, 0x6a4a2a, 6); break;
      case 'tidalring': this.fx.shape({ kind: 'ring', pos: [x, 0.3, z], r0: 0.4, r1: 4, life: 0.6, color: 0x7fd8ff, intensity: 3 }); this.burst(x, z, 2.4, 'hydro', {}); break;
      case 'electrocharged': case 'feedback': case 'magnetize':
        for (let i = 0; i < 16; i++) this.fx.particle({ pos: [x + rnd(1.5), 0.6 + Math.random() * 1.5, z + rnd(1.5)], life: 0.25, size: 0.6, color: C('#e0c8ff', 3), color1: C('#ffffff', 2, 0), sprite: SPR.bolt, rot: Math.random() * 6 });
        this.burst(x, z, 1.6, 'volto', { small: true });
        break;
      case 'freeze': case 'shatter': case 'permafrost': case 'frostbite':
        this.fx.shatter([x, 0.8, z], { count: 26, size: 0.12, colors: [0xc8f6ff, 0xffffff, 0x8ad8ff], force: 4, up: 4 });
        this.burst(x, z, 1.8, 'cryo', { small: true });
        break;
      case 'overgrowth':
        for (let i = 0; i < 24; i++) this.fx.particle({ pos: [x + rnd(1), 0.1, z + rnd(1)], vel: [rnd(0.6), 3 + Math.random() * 2, rnd(0.6)], life: 0.9, size: 0.3, color: C('#5fd35a', 1.8), color1: C('#2a8a2a', 1, 0), sprite: SPR.leaf, spin: rnd(6), gravity: 4 });
        break;
      case 'lullaby':
        for (let i = 0; i < 14; i++) this.fx.particle({ pos: [x + rnd(1.2), 1 + Math.random(), z + rnd(1.2)], vel: [rnd(0.4), 0.8, rnd(0.4)], life: 2, size: 0.32, color: C('#ffc8f0', 2), color1: C('#c8d8ff', 1.5, 0), sprite: i % 2 ? SPR.note : SPR.zz, additive: false });
        break;
      case 'quake':
        g.impact(1.6);
        this.fx.decal('crack', [x, 0, z], 6, 0x2a1a0a, 10);
        this.fx.shatter([x, 0.2, z], { count: 40, size: 0.16, colors: [0xb08a5a, 0x8a6a44, 0x5a4a3a], force: 6, up: 7, spread: 2.5 });
        this.fx.shape({ kind: 'ring', pos: [x, 0.1, z], r0: 0.5, r1: 4.5, life: 0.6, color: 0xe0b070, intensity: 2.5 });
        break;
      case 'haunt': case 'curse':
        for (let i = 0; i < 20; i++) this.fx.particle({ pos: [x + rnd(1), 0.5 + Math.random(), z + rnd(1)], vel: [rnd(1), 1, rnd(1)], life: 1.2, size: 0.3, color: C('#a07aff', 2.5), color1: C('#ff8af2', 1.5, 0), sprite: i % 3 ? SPR.dot : SPR.eye });
        break;
      case 'starfall': this.burst(x, z, 3, 'astro', { up: 4 }); g.flash(0xfff0c0, 0.4); break;
      case 'fission': this.burst(x, z, 2.8, 'nucleo', { up: 3 }); g.flash(0xaaff6a, 0.35); break;
      default: this.burst(x, z, 2, 'none', { small: true });
    }
  }
  // ------------------------------------------------------------ zones
  zoneStart(z) {
    const colors = { steam: '#ffffff', lava: '#ff5a1a', fire: '#ff8a2b', mud: '#7a5a3a', sand: '#e8c890', wet: '#4fc8ff', ink: '#2a1a3a', pollen: '#ffd0f0', spore: '#a8ff8a', static: '#ffe84a', snow: '#c8f6ff', whirl: '#4fa8ff', tornado: '#b8ffd8', gravity: '#8a6aff' };
    const col = new THREE.Color(colors[z.kind] || '#ffffff');
    const mat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(z.kind === 'lava' ? 1.8 : 0.9), transparent: true, opacity: z.kind === 'ink' ? 0.7 : 0.32, depthWrite: false, toneMapped: z.kind !== 'lava', blending: z.kind === 'ink' || z.kind === 'mud' ? THREE.NormalBlending : THREE.AdditiveBlending });
    const m = new THREE.Mesh(this._disc, mat);
    m.position.set(z.x, 0.05, z.z); m.scale.set(z.r, 1, z.r); m.renderOrder = 6;
    this.misc.add(m);
    this.zones.set(z.id, { m, z, col, t: 0 });
  }
  zoneUpdate(dt, list) {
    for (const z of list) {
      const r = this.zones.get(z.id); if (!r) continue;
      r.t += dt;
      r.m.position.set(z.x, 0.05, z.z);
      const k = z.kind, c = r.col;
      const rate = { steam: 14, lava: 8, fire: 5, mud: 3, sand: 10, wet: 2, ink: 10, pollen: 9, spore: 7, static: 8, snow: 12, whirl: 10, tornado: 18, gravity: 10 }[k] || 4;
      if (Math.random() < rate * dt * Math.min(2, z.r)) {
        const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * z.r;
        const px = z.x + Math.cos(a) * rr, pz = z.z + Math.sin(a) * rr;
        if (k === 'steam' || k === 'ink' || k === 'sand') this.fx.particle({ pos: [px, 0.3, pz], vel: [rnd(0.4), 0.6, rnd(0.4)], life: 1.4, size: 0.6, size1: 1.6, color: k === 'ink' ? [0.12, 0.08, 0.16, 0.7] : k === 'sand' ? [0.9, 0.78, 0.55, 0.5] : [1, 1, 1, 0.5], color1: [c.r, c.g, c.b, 0], sprite: SPR.smoke, additive: false, spin: rnd(1) });
        else if (k === 'tornado' || k === 'whirl' || k === 'gravity') this.fx.particle({ pos: [px, 0.2, pz], vel: [-(pz - z.z) * 3, 1 + Math.random() * 2, (px - z.x) * 3], life: 0.8, size: 0.25, color: [c.r * 2, c.g * 2, c.b * 2, 1], color1: [c.r, c.g, c.b, 0], sprite: SPR.swirl, spin: 8 });
        else this.fx.particle({ pos: [px, 0.15, pz], vel: [rnd(0.3), 0.8 + Math.random(), rnd(0.3)], life: 0.9, size: 0.2, color: [c.r * 2.2, c.g * 2.2, c.b * 2.2, 1], color1: [c.r, c.g, c.b, 0], sprite: k === 'pollen' ? SPR.petal : k === 'static' ? SPR.bolt : k === 'snow' ? SPR.snow : k === 'lava' || k === 'fire' ? SPR.flame : SPR.dot, spin: rnd(3) });
      }
      const fade = Math.min(1, z.t / 0.5, r.t / 0.3);
      r.m.material.opacity = (k === 'ink' ? 0.7 : 0.32) * fade * (0.85 + Math.sin(r.t * 6) * 0.15);
    }
  }
  zoneEnd(id) { const r = this.zones.get(id); if (!r) return; this.misc.remove(r.m); r.m.material.dispose(); this.zones.delete(id); }
  // ------------------------------------------------------------ walls (voxel stone)
  wallStart(w) {
    const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1);
    const design = { vs: 0.12, arch: 'static', pal: { s: '#9a8a76', d: '#6e604f', m: '#7a9a4a' }, parts: [{ n: 'body', p: [0, 0, 0], s: [['box', [0, 0.8, 0], [len / 2, 0.8, 0.25], 's', { noise: 0.05, top: 'm', topT: 0.7, dither: { col: 'd', amt: 0.3 } }]] }] };
    const m = buildModel(design, 'wall_' + len.toFixed(1));
    m.position.set((w.x1 + w.x2) / 2, -1.7, (w.z1 + w.z2) / 2);
    m.rotation.y = Math.atan2(w.z2 - w.z1, w.x2 - w.x1) * -1;
    this.misc.add(m);
    this.walls.set(w.id, { m, t: 0 });
    this.fx.shatter([m.position.x, 0.1, m.position.z], { count: 16, size: 0.12, colors: [0x9a8a76, 0x6e604f], force: 2, up: 5, spread: len / 2 });
    this.g.impact(0.5);
  }
  wallUpdate(dt) { for (const [, r] of this.walls) { r.t += dt; r.m.position.y = Math.min(0, -1.7 + r.t * 9); } }
  wallEnd(id, broken) {
    const r = this.walls.get(id); if (!r) return;
    this.fx.shatter([r.m.position.x, 0.8, r.m.position.z], { count: broken ? 40 : 20, size: 0.16, colors: [0x9a8a76, 0x6e604f, 0x7a9a4a], force: broken ? 5 : 2, up: broken ? 6 : 2, spread: 1.2 });
    this.misc.remove(r.m); this.walls.delete(id);
  }
  // ------------------------------------------------------------ telegraphs (ground warnings)
  teleSync(list, mySide) {
    const seen = new Set();
    for (const tl of list) {
      seen.add(tl.id);
      let r = this.tele.get(tl.id);
      if (!r) {
        const danger = tl.side !== mySide;
        const col = danger ? 0xff3f5a : 0x3ff0ff;
        const fill = new THREE.Mesh(tl.shape === 'circle' ? this._disc : this._plane, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false }));
        const edge = new THREE.Mesh(tl.shape === 'circle' ? this._ring : this._plane, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(2), transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }));
        const grow = new THREE.Mesh(tl.shape === 'circle' ? this._disc : this._plane, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.5), transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }));
        const grp = new THREE.Group(); grp.add(fill, edge, grow);
        fill.renderOrder = edge.renderOrder = grow.renderOrder = 7;
        this.misc.add(grp);
        r = { grp, fill, edge, grow, tl };
        this.tele.set(tl.id, r);
      }
      const u = Math.min(1, tl.t / Math.max(0.05, tl.dur));
      if (tl.shape === 'circle') {
        r.grp.position.set(tl.x, 0.06, tl.z); r.grp.rotation.set(0, 0, 0);
        r.fill.scale.set(tl.r, 1, tl.r); r.edge.scale.set(tl.r, 1, tl.r); r.grow.scale.set(tl.r * u, 1, tl.r * u);
      } else {
        const L = tl.len, W = tl.shape === 'cone' ? Math.tan((tl.arc * Math.PI) / 360) * L * 2 : tl.width;
        r.grp.position.set(tl.x + tl.dx * L / 2, 0.06, tl.z + tl.dz * L / 2);
        r.grp.rotation.set(0, Math.atan2(tl.dx, tl.dz), 0);
        r.fill.scale.set(W, 1, L); r.edge.scale.set(W * 1.02, 1, L * 1.02); r.edge.material.opacity = 0.25;
        r.grow.scale.set(W, 1, L * u); r.grow.position.z = -L / 2 + (L * u) / 2;
      }
      r.fill.material.opacity = 0.18 + Math.sin(tl.t * 20) * 0.06;
    }
    for (const [id, r] of this.tele) if (!seen.has(id)) { this.misc.remove(r.grp); for (const m of [r.fill, r.edge, r.grow]) m.material.dispose(); this.tele.delete(id); }
  }
  clear() {
    for (const [id] of this.proj) this.projEnd(id, 0, -999);
    for (const [id] of this.zones) this.zoneEnd(id);
    for (const [id] of this.walls) this.wallEnd(id);
    this.teleSync([], 0);
    this.misc.clear();
  }
}
