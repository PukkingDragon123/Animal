// Three.js rendering layer. Owns scene/camera/lights/renderer, builds the run's
// world + creatures, and every frame syncs sim state → animated meshes, follows
// the player with a size-scaled top-down camera, and drives FX. Reads the sim;
// never mutates it. Lighting/fog derive from the biome (STYLE FORMULA blocks 3-4).
import * as THREE from '../vendor/three.module.js';
import { CONFIG as C } from './config.js';
import { buildCreature, buildInteractable } from './meshes.js';
import { buildFoodGeometry, propMaterial } from './props.js';
import { buildEnvironment } from './world.js';
import { animateCreature } from './animator.js';
import { FX } from './fx.js';
import { foodOf } from './species.js';

const isMobile = (typeof navigator !== 'undefined') && (navigator.maxTouchPoints > 0 || /Mobi|Android/i.test(navigator.userAgent || ''));

// per-build display scale + base hover height
const BUILD_SIZE = { rabbit: 0.9, fox: 1.05, bee: 0.7, penguin: 1.0, turtle: 1.0, salmon: 0.8, shark: 1.2, bird: 0.85, seal: 1.35, bear: 1.6, fish: 0.7 };

function predatorColors(build) {
  switch (build) {
    case 'fox': return { body: 0xe07a32, belly: 0xf3e2c8, accent: 0x7a2d20, eye: 0xd83a2a };
    case 'bird': return { body: 0x8d8072, belly: 0xf0f0f0, accent: 0xcf4a2a, eye: 0xd83a2a };
    case 'seal': return { body: 0x7a8694, belly: 0xc9d3df, accent: 0x8a3b3b, eye: 0xd83a2a };
    case 'bear': return { body: 0x8a5a3c, belly: 0xa9774f, accent: 0x6e2f22, eye: 0xd83a2a };
    case 'fish': return { body: 0x6f93a8, belly: 0xdfe9ef, accent: 0x8a3b3b, eye: 0xd83a2a };
    default: return { body: 0xcc5555, belly: 0xeecccc, accent: 0x882222, eye: 0xd83a2a };
  }
}
function preyColors(build) {
  if (build === 'rabbit') return { body: 0xd8c0a0, belly: 0xf4ecdd, accent: 0xe8a0ad, eye: 0x2a2320 };
  if (build === 'fish') return { body: 0x9ad3ec, belly: 0xeaf2f6, accent: 0x6fb6d6, eye: 0x141414 };
  return { body: 0xcccccc, belly: 0xffffff, accent: 0x999999, eye: 0x222222 };
}

// ambient critters per biome (decorative life that scatters from the player)
const CRITTERS = {
  forest: [['squirrel', 3], ['butterfly', 5], ['raven', 2]],
  meadow: [['butterfly', 8], ['squirrel', 2], ['raven', 1]],
  savanna: [['squirrel', 2], ['raven', 3], ['butterfly', 3]],
  arctic: [['raven', 2]],
  ocean: [['fish', 6]],
  river: [['butterfly', 4], ['frog', 3]],
};
const CRITTER_SIZE = { squirrel: 0.7, raven: 0.8, butterfly: 0.7, frog: 0.6, fish: 0.55 };
function critterColors(kind) {
  switch (kind) {
    case 'squirrel': return { body: 0xb5652f, belly: 0xe9d8b0, accent: 0x6e3b18, eye: 0x201510 };
    case 'raven': return { body: 0x2a2d33, belly: 0x3a3f47, accent: 0x6a6f77, eye: 0x111111 };
    case 'butterfly': { const c = [0xff7ab0, 0xffc14a, 0x8a6bff, 0x57c8ff, 0xff6b6b][Math.floor(Math.random() * 5)]; return { body: c, belly: c, accent: 0xfff0c0, eye: 0x222222 }; }
    case 'frog': return { body: 0x6fbf4a, belly: 0xd9e8a0, accent: 0x4f9a3a, eye: 0x141410 };
    case 'fish': return { body: 0x9ad3ec, belly: 0xeaf2f6, accent: 0x6fb6d6, eye: 0x141414 };
    default: return { body: 0xcccccc, belly: 0xffffff, accent: 0x888888, eye: 0x222222 };
  }
}

export class Renderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance', alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.shadows = !isMobile;
    this.renderer.shadowMap.enabled = this.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.5, 700);

    this.hemi = new THREE.HemisphereLight(0xbfe4ff, 0x4f8a45, 0.85);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d6, 1.05);
    this.sun.castShadow = this.shadows;
    if (this.shadows) {
      this.sun.shadow.mapSize.set(2048, 2048);
      const s = this.sun.shadow.camera; s.near = 1; s.far = 80; s.left = -24; s.right = 24; s.top = 24; s.bottom = -24;
      this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sun); this.scene.add(this.sun.target);
    // soft cool fill from the opposite side for nicer modelling (no shadow)
    this.fill = new THREE.DirectionalLight(0xcfe2ff, 0.28); this.fill.position.set(14, 12, 18);
    this.scene.add(this.fill);

    this.dyn = new THREE.Group(); this.scene.add(this.dyn);
    this.fx = new FX(this.scene, C.fx.poolSize);

    this.envGroup = null;
    this.playerMesh = null;
    this.predMeshes = []; this.preyMeshes = []; this.dangerRings = [];
    this.foodInst = null; this.foodColor = 0x57bf43;
    this.mateMesh = null; this.nestMesh = null; this.beacon = null; this.warmthMeshes = [];
    this.interactMeshes = []; this.fruitInst = null; this.twigInst = null; this.stepTimer = 0;
    this.ambient = null; this.ambData = null; this.ambKind = 'pollen';
    this.critters = [];

    this.camPos = new THREE.Vector3(0, 18, -14);
    this.camLook = new THREE.Vector3();
    this.curDist = C.camera.minDist;
    this._tmp = new THREE.Vector3(); this._d = new THREE.Object3D();
    this.dpr = Math.min((typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1), isMobile ? 1.5 : C.camera.dprCap);
  }

  resize(w, h) {
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  teardown() {
    if (this.envGroup) { this.scene.remove(this.envGroup); this.envGroup.userData.dispose?.(); this.envGroup = null; }
    const clear = (m) => { if (m) { this.dyn.remove(m); m.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } };
    clear(this.playerMesh); this.playerMesh = null;
    this.predMeshes.forEach(clear); this.predMeshes = [];
    this.preyMeshes.forEach(clear); this.preyMeshes = [];
    this.dangerRings.forEach(r => { this.scene.remove(r); r.geometry.dispose(); }); this.dangerRings = [];
    this.warmthMeshes.forEach(m => { this.scene.remove(m); m.geometry.dispose(); }); this.warmthMeshes = [];
    if (this.foodInst) { this.dyn.remove(this.foodInst); this.foodInst.geometry.dispose(); this.foodInst = null; }
    this.interactMeshes.forEach(clear); this.interactMeshes = [];
    if (this.fruitInst) { this.dyn.remove(this.fruitInst); this.fruitInst.geometry.dispose(); this.fruitInst = null; }
    if (this.twigInst) { this.dyn.remove(this.twigInst); this.twigInst.geometry.dispose(); this.twigInst = null; }
    if (this.ambient) { this.scene.remove(this.ambient); this.ambient.geometry.dispose(); this.ambient.material.dispose(); this.ambient = null; this.ambData = null; }
    this.critters.forEach(c => clear(c.mesh)); this.critters = [];
    clear(this.mateMesh); this.mateMesh = null;
    if (this.nestMesh) { this.dyn.remove(this.nestMesh); this.nestMesh = null; }
    if (this.beacon) { this.scene.remove(this.beacon); this.beacon = null; }
    this.fx.reset();
  }

  setupRun(state) {
    this.teardown();
    const b = state.biome;
    this.envGroup = buildEnvironment(b, state.seed);
    this.scene.add(this.envGroup);

    // lighting + fog from biome (formula)
    this.hemi.color.set(b.ambSky); this.hemi.groundColor.set(b.ambGround); this.hemi.intensity = b.ambInt;
    this.sun.color.set(b.sun); this.sun.intensity = b.sunInt;
    this.scene.fog = new THREE.FogExp2(b.fog, b.fogDensity);

    this.swimY = b.water ? 0.7 : 0;

    // player (with its evolved skill-tree visuals)
    this.playerMesh = buildCreature(state.species.build, state.species.colors, state.visuals);
    this.playerMesh.userData.baseY = this.swimY;
    this.dyn.add(this.playerMesh);

    // food (instanced) for grazers
    if (state.species.diet.kind === 'graze') {
      const f = foodOf(state.species.diet.food);
      this.foodColor = f.color;
      const geo = buildFoodGeometry(f.build, f.color);
      this.foodInst = new THREE.InstancedMesh(geo, propMaterial.clone(), state.food.length);
      this.foodInst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(state.food.length * 3).fill(1), 3);
      this.foodInst.castShadow = false;
      this.dyn.add(this.foodInst);
    } else {
      this.foodColor = 0xffd23f;
    }

    // predators / prey meshes built lazily in update (counts can grow)
    this.predMeshes = []; this.preyMeshes = []; this.warmthMeshes = [];

    // warmth spots (cold struggle)
    for (const w of state.warmthSpots) {
      const ring = new THREE.Mesh(new THREE.CircleGeometry(w.r, 22), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.32, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(w.x, 0.04, w.z);
      this.scene.add(ring); this.warmthMeshes.push(ring);
    }

    // interactive objects (fruit trees, mushrooms, hives, burrows)
    this.interactMeshes = [];
    for (const it of state.interactables) {
      const m = buildInteractable(it.type);
      m.position.set(it.x, 0, it.z);
      m.rotation.y = (it.id % 7) * 0.9;
      this.dyn.add(m); this.interactMeshes.push(m);
    }

    // bonus fruit (instanced, capacity matches the sim cap)
    {
      const cap = 40, d = this._d;
      this.fruitInst = new THREE.InstancedMesh(buildFoodGeometry('berry', 0xff7a3c), propMaterial.clone(), cap);
      this.fruitInst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3);
      this.fruitInst.castShadow = false;
      d.scale.setScalar(0); d.updateMatrix();
      for (let i = 0; i < cap; i++) this.fruitInst.setMatrixAt(i, d.matrix);
      this.dyn.add(this.fruitInst);
    }
    this.twigInst = null; this.stepTimer = 0;

    // ambient critters (decorative wandering life)
    this.critters = [];
    for (const [kind, count] of (CRITTERS[b.id] || [])) {
      for (let i = 0; i < count; i++) {
        const m = buildCreature(kind, critterColors(kind));
        const sc = CRITTER_SIZE[kind] || 0.7; m.scale.setScalar(sc);
        const fly = !!(m.userData.parts && m.userData.parts.fly) || kind === 'raven';
        const a = Math.random() * 6.283, r = 6 + Math.random() * (C.world.radius - 9);
        const hoverY = b.water ? 0.7 : (fly ? 1.3 + Math.random() * 1.6 : 0);
        const c = { mesh: m, x: Math.cos(a) * r, z: Math.sin(a) * r, vx: 0, vz: 0, heading: Math.random() * 6.283, retarget: 0, fly, baseY: hoverY, hoverY, sp: kind === 'butterfly' ? 1.5 : (fly ? 3 : 2.3) };
        m.position.set(c.x, hoverY, c.z); this.dyn.add(m); this.critters.push(c);
      }
    }

    // ambient biome particles (pollen / snow / bubbles) for atmosphere
    {
      const n = 28, isSnow = b.cold, isWater = b.underwater;
      this.ambKind = isSnow ? 'snow' : (isWater ? 'bubble' : 'pollen');
      const col = isSnow ? 0xffffff : (isWater ? 0xcdeeff : 0xfff0a0);
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: isWater ? 0.45 : 0.7 });
      this.ambient = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(isWater ? 0.12 : 0.08, 0), mat, n);
      this.ambient.frustumCulled = false; this.ambient.castShadow = false;
      this.ambData = [];
      for (let i = 0; i < n; i++) this.ambData.push({ x: (Math.random() * 2 - 1) * 40, y: Math.random() * 14, z: (Math.random() * 2 - 1) * 40, ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.7 });
      this.scene.add(this.ambient);
    }

    // initial camera snap
    this.curDist = this._distFor(state.size);
    this._placeCamera(state, true);
  }

  _distFor(size) { return THREE.MathUtils.lerp(C.camera.minDist, C.camera.maxDist, THREE.MathUtils.clamp((size - 0.4) / 1.3, 0, 1)); }

  _ensureCount(arr, n, makeFn) { while (arr.length < n) arr.push(makeFn(arr.length)); }

  _syncCreature(mesh, e, baseY, scale, ctx) {
    mesh.position.x = e.x; mesh.position.z = e.z;
    mesh.userData.baseY = baseY;
    mesh.scale.setScalar(scale);
    // heading: face movement direction (mesh faces +Z)
    if (e.heading != null) mesh.rotation.y = e.heading;
    animateCreature(mesh, ctx.dt, ctx.time, ctx);
  }

  update(state, dt, time) {
    const ctxBase = { dt, time };
    // --- player ---
    const P = state.player;
    const pm = this.playerMesh;
    pm.position.x = P.x; pm.position.z = P.z;
    pm.userData.baseY = this.swimY;
    pm.scale.setScalar(Math.max(0.2, state.size));
    pm.rotation.y = P.heading;
    animateCreature(pm, dt, time, { dt, time, speed: P.speed, moving: P.moving });
    pm.visible = !(state.invuln > 0 && Math.floor(time * 16) % 2 === 0);

    // footstep / wake puffs while moving
    this.stepTimer -= dt;
    if (P.moving && this.stepTimer <= 0) {
      this.stepTimer = 0.16;
      const col = state.inWater ? 0xbfe9ff : (state.biome.cold ? 0xffffff : (state.biome.id === 'savanna' ? 0xe0c070 : 0x9ad86a));
      this.fx.burst(P.x, (this.swimY || 0) + 0.08, P.z, col, 2, { up: state.inWater ? 0.9 : 0.5, speed: 0.8, life: 0.45, size: 0.7, grav: state.inWater ? 1.5 : 5 });
    }

    // --- predators ---
    this._ensureCount(this.predMeshes, state.predators.length, (i) => {
      const b = state.predators[i].build;
      const m = buildCreature(b, predatorColors(b));
      m.userData.bsize = BUILD_SIZE[b] || 1; this.dyn.add(m);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.1, 24), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.0, fog: false, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; this.scene.add(ring); this.dangerRings.push(ring);
      return m;
    });
    for (let i = 0; i < state.predators.length; i++) {
      const e = state.predators[i], m = this.predMeshes[i];
      const fly = m.userData.parts?.fly;
      const baseY = fly ? 1.1 : (this.swimY);
      const moving = (Math.abs(e.vx) + Math.abs(e.vz)) > 0.4;
      this._syncCreature(m, e, baseY, m.userData.bsize, { dt, time, speed: Math.hypot(e.vx, e.vz), moving, diving: e.aggro && fly });
      m.visible = e.domain !== 'gone';
      // danger ring
      const ring = this.dangerRings[i];
      ring.position.set(e.x, 0.05, e.z);
      const want = e.aggro ? 0.5 + Math.sin(time * 8) * 0.2 : 0;
      ring.material.opacity += (want - ring.material.opacity) * Math.min(1, dt * 8);
      const rs = e.aggro ? 1 + Math.sin(time * 8) * 0.08 : 1; ring.scale.setScalar(rs);
    }

    // --- prey ---
    if (state.prey.length) {
      this._ensureCount(this.preyMeshes, state.prey.length, (i) => {
        const b = state.prey[i].build || state.species.diet.preyBuild;
        const m = buildCreature(b, preyColors(b)); m.userData.bsize = BUILD_SIZE[b] || 0.8; this.dyn.add(m); return m;
      });
      for (let i = 0; i < state.prey.length; i++) {
        const e = state.prey[i], m = this.preyMeshes[i];
        m.visible = e.alive;
        if (!e.alive) continue;
        const moving = (Math.abs(e.vx) + Math.abs(e.vz)) > 0.3;
        this._syncCreature(m, e, this.swimY, m.userData.bsize, { dt, time, speed: Math.hypot(e.vx, e.vz), moving });
      }
    }

    // --- food ---
    if (this.foodInst) {
      const d = this._d;
      for (let i = 0; i < state.food.length; i++) {
        const f = state.food[i];
        if (f.alive) {
          d.position.set(f.x, this.swimY + Math.sin(time * 2 + f.phase) * C.food.bobAmp, f.z);
          d.rotation.set(0, time * C.food.spin + f.phase, 0);
          d.scale.setScalar(1);
        } else { d.scale.setScalar(0); }
        d.updateMatrix(); this.foodInst.setMatrixAt(i, d.matrix);
      }
      this.foodInst.instanceMatrix.needsUpdate = true;
    }

    // --- interactive objects + bonus fruit + nest twigs ---
    this._syncInteractables(state, dt, time);

    // --- mate / nest + beacon ---
    this._syncRepro(state, dt, time);

    // --- ambient particles ---
    if (this.ambient && this.ambData) {
      const d = this._d, P = state.player;
      for (let i = 0; i < this.ambData.length; i++) {
        const a = this.ambData[i];
        if (this.ambKind === 'snow') { a.y -= a.sp * dt * 2; if (a.y < 0) { a.y = 14; a.x = P.x + (Math.random() * 2 - 1) * 40; a.z = P.z + (Math.random() * 2 - 1) * 40; } }
        else if (this.ambKind === 'bubble') { a.y += a.sp * dt * 2; if (a.y > 14) { a.y = 0; a.x = P.x + (Math.random() * 2 - 1) * 40; a.z = P.z + (Math.random() * 2 - 1) * 40; } }
        else { a.ph += dt; a.y += Math.sin(a.ph) * dt * 0.4; }
        d.position.set(a.x + Math.sin(a.ph + time) * 0.6, a.y, a.z); d.rotation.set(0, a.ph, 0); d.scale.setScalar(1); d.updateMatrix();
        this.ambient.setMatrixAt(i, d.matrix);
      }
      this.ambient.instanceMatrix.needsUpdate = true;
    }

    // --- ambient critters ---
    this._updateCritters(state, dt, time);

    // --- camera + light follow ---
    this._placeCamera(state, false);
    this.fx.update(dt);
  }

  _updateCritters(state, dt, time) {
    const P = state.player, R = C.world.radius;
    for (const c of this.critters) {
      const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz) || 1;
      const fleeR = c.fly ? 4.5 : 6.5;
      if (d < fleeR) {                                  // scatter from the player
        c.heading = Math.atan2(dx, dz);
        c.vx = (dx / d) * c.sp * 1.9; c.vz = (dz / d) * c.sp * 1.9;
        if (c.fly) c.baseY = Math.min(c.baseY + dt * 2.2, 4);
      } else {
        c.retarget -= dt;
        if (c.retarget <= 0) { c.heading = Math.random() * 6.283; c.retarget = 1 + Math.random() * 2.5; }
        c.vx = Math.sin(c.heading) * c.sp * 0.5; c.vz = Math.cos(c.heading) * c.sp * 0.5;
        c.baseY += (c.hoverY - c.baseY) * Math.min(1, dt);
      }
      c.x += c.vx * dt; c.z += c.vz * dt;
      const rr = Math.hypot(c.x, c.z);
      if (rr > R) { c.x = c.x / rr * R; c.z = c.z / rr * R; c.heading += Math.PI; }
      c.mesh.position.x = c.x; c.mesh.position.z = c.z; c.mesh.userData.baseY = c.baseY;
      c.mesh.rotation.y = Math.atan2(c.vx, c.vz);
      const moving = Math.abs(c.vx) + Math.abs(c.vz) > 0.3;
      animateCreature(c.mesh, dt, time, { dt, time, speed: Math.hypot(c.vx, c.vz) * 3, moving, diving: false });
    }
  }

  _syncRepro(state, dt, time) {
    const target = state.mate || state.nest;
    if (target && target.active) {
      if (state.mate && !this.mateMesh) {
        this.mateMesh = buildCreature(state.species.build, state.species.colors, state.visuals);
        this.mateMesh.userData.baseY = this.swimY; this.dyn.add(this.mateMesh);
      }
      if (state.nest && !this.nestMesh) {
        this.nestMesh = new THREE.Group();
        const mound = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 10), new THREE.MeshStandardMaterial({ color: 0xcaa86a, flatShading: true, roughness: 1 }));
        mound.position.y = this.swimY + 0.2; mound.castShadow = true; this.nestMesh.add(mound);
        this.dyn.add(this.nestMesh);
      }
      if (!this.beacon) {
        this.beacon = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 8, 20), new THREE.MeshBasicMaterial({ color: 0xff5fa2, fog: false }));
        ring.rotation.x = Math.PI / 2; this.beacon.add(ring);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff8fc0, transparent: true, opacity: 0.35, fog: false }));
        beam.position.y = 3; this.beacon.add(beam);
        this.scene.add(this.beacon);
      }
      if (this.mateMesh) {
        this.mateMesh.position.set(target.x, this.swimY, target.z);
        this.mateMesh.scale.setScalar(state.species.baseScale * C.life.stageScale.adult);
        animateCreature(this.mateMesh, dt, time + 1.3, { dt, time, speed: 0, moving: false });
      }
      if (this.nestMesh) this.nestMesh.position.set(target.x, 0, target.z);
      this.beacon.visible = true;
      this.beacon.position.set(target.x, this.swimY + 1.6 + Math.sin(time * 3) * 0.2, target.z);
      this.beacon.rotation.y = time * 1.5;
    } else if (this.beacon) {
      this.beacon.visible = false;
      if (this.mateMesh) this.mateMesh.visible = false;
      if (this.nestMesh) this.nestMesh.visible = false;
    }
  }

  _syncInteractables(state, dt, time) {
    const baseY = this.swimY || 0, d = this._d;
    for (let i = 0; i < this.interactMeshes.length; i++) {
      const it = state.interactables[i], m = this.interactMeshes[i];
      if (!it || !m) continue;
      if (it.type === 'mushroom') m.visible = it.alive !== false;
      else if (it.type === 'fruitTree' && m.userData.canopy) {
        m.userData.canopy.rotation.z = it.shake > 0 ? Math.sin(time * 34) * 0.14 * it.shake : m.userData.canopy.rotation.z * 0.8;
      } else if (it.type === 'hive') m.rotation.y += dt * 0.3;
    }
    // bonus fruit
    if (this.fruitInst) {
      for (let i = 0; i < this.fruitInst.count; i++) {
        const f = state.fruits[i];
        if (f && f.alive) { d.position.set(f.x, baseY + 0.25 + Math.sin(time * 3 + f.phase) * 0.08, f.z); d.rotation.set(0, time + f.phase, 0); d.scale.setScalar(1); }
        else d.scale.setScalar(0);
        d.updateMatrix(); this.fruitInst.setMatrixAt(i, d.matrix);
      }
      this.fruitInst.instanceMatrix.needsUpdate = true;
    }
    // nest twigs (appear at adulthood)
    if (state.nestTwigs.length && !this.twigInst) {
      this.twigInst = new THREE.InstancedMesh(buildFoodGeometry('twig', 0x8a6038), propMaterial.clone(), state.nestTwigs.length);
      this.twigInst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(state.nestTwigs.length * 3).fill(1), 3);
      this.dyn.add(this.twigInst);
    }
    if (this.twigInst) {
      for (let i = 0; i < this.twigInst.count; i++) {
        const tw = state.nestTwigs[i];
        if (tw && tw.alive) { d.position.set(tw.x, baseY + 0.12 + Math.sin(time * 2 + tw.phase) * 0.05, tw.z); d.rotation.set(0, tw.phase, 0); d.scale.setScalar(1); }
        else d.scale.setScalar(0);
        d.updateMatrix(); this.twigInst.setMatrixAt(i, d.matrix);
      }
      this.twigInst.instanceMatrix.needsUpdate = true;
    }
  }

  _placeCamera(state, snap) {
    const P = state.player;
    const targetDist = this._distFor(state.size);
    this.curDist += (targetDist - this.curDist) * (snap ? 1 : 0.04);
    const pitch = C.camera.pitchDeg * Math.PI / 180;
    const hy = Math.sin(pitch) * this.curDist;
    const hz = Math.cos(pitch) * this.curDist;
    this._tmp.set(P.x, this.swimY + hy, P.z - hz);
    if (snap) this.camPos.copy(this._tmp);
    else this.camPos.lerp(this._tmp, C.camera.follow);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(P.x, this.swimY + 0.6, P.z + 1.5);

    // keep the shadow frustum on the player
    this.sun.position.set(P.x - 18, 34, P.z - 12);
    this.sun.target.position.set(P.x, 0, P.z);
    this.sun.target.updateMatrixWorld();
  }

  render() { this.renderer.render(this.scene, this.camera); }
}
