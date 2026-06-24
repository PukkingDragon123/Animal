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
      this.sun.shadow.mapSize.set(1024, 1024);
      const s = this.sun.shadow.camera; s.near = 1; s.far = 80; s.left = -24; s.right = 24; s.top = 24; s.bottom = -24;
      this.sun.shadow.bias = -0.0008;
    }
    this.scene.add(this.sun); this.scene.add(this.sun.target);

    this.dyn = new THREE.Group(); this.scene.add(this.dyn);
    this.fx = new FX(this.scene, C.fx.poolSize);

    this.envGroup = null;
    this.playerMesh = null;
    this.predMeshes = []; this.preyMeshes = []; this.dangerRings = [];
    this.foodInst = null; this.foodColor = 0x57bf43;
    this.mateMesh = null; this.nestMesh = null; this.beacon = null; this.warmthMeshes = [];
    this.interactMeshes = []; this.fruitInst = null; this.twigInst = null; this.stepTimer = 0;

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

    // player
    this.playerMesh = buildCreature(state.species.build, state.species.colors);
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

    // --- camera + light follow ---
    this._placeCamera(state, false);
    this.fx.update(dt);
  }

  _syncRepro(state, dt, time) {
    const target = state.mate || state.nest;
    if (target && target.active) {
      if (state.mate && !this.mateMesh) {
        this.mateMesh = buildCreature(state.species.build, state.species.colors);
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
