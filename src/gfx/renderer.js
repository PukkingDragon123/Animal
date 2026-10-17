// Gfx: owns the WebGL renderer, scene graph, camera rig, lighting, sky, FX,
// post pipeline and portrait viewports. Gameplay code never talks to WebGL
// directly — it moves Object3Ds under `actors`/`world` and calls helpers here.
import * as THREE from '../../vendor/three.module.js';
import { Post } from './post.js';
import { Sky, timeOfDay } from './sky.js';
import { FX } from './particles.js';
import { shared, shadowTint } from './materials.js';
import { clamp, damp, lerp, ease, clamp01 } from '../core/mathx.js';
import { vnoise3 } from '../core/rng.js';

const QUALITY = {
  high: { dpr: 2, msaa: 4, levels: 5, shadow: 2048, post: true, tilt: 0.55, outline: 1 },
  medium: { dpr: 1.5, msaa: 4, levels: 4, shadow: 1024, post: true, tilt: 0, outline: 1 },
  low: { dpr: 1, msaa: 0, levels: 3, shadow: 512, post: false, tilt: 0, outline: 0 },
};

export function detectQuality() {
  const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('q');
  if (q && QUALITY[q]) return q;
  const mobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return mobile ? 'medium' : 'high';
}

// ---------------------------------------------------------------- camera rig
export class CameraRig {
  constructor(camera) {
    this.cam = camera;
    this.mode = 'follow';
    this.target = new THREE.Vector3();      // desired focus
    this.focus = new THREE.Vector3();       // smoothed focus
    this.yaw = Math.PI / 4; this.yawT = this.yaw;
    this.pitch = 0.72;                      // radians above horizon
    this.dist = 19; this.distT = 19;
    this.fov = 30; this.fovT = 30;
    this.lag = 6;
    this.bounds = null;                     // {minX,maxX,minZ,maxZ}
    this.trauma = 0; this.shakeT = 0;
    this.punch = 0;                         // momentary zoom punch
    this.shot = null;                       // cinematic shot
    this.offset = new THREE.Vector3();
    this._p = new THREE.Vector3(); this._l = new THREE.Vector3();
  }
  snap() { this.focus.copy(this.target); this.dist = this.distT; this.yaw = this.yawT; this.fov = this.fovT; }
  shake(amount) { this.trauma = Math.min(1, this.trauma + amount); }
  rotateBy(dYaw) { this.yawT += dYaw; }
  // Cinematic shot: from/to camera positions + look targets over dur (s).
  play(shot) {
    this.mode = 'cinema';
    const s = Object.assign({ t: 0, dur: 3, ease: 'inOut', fov: this.fov }, shot);
    s.from = new THREE.Vector3(...shot.from); s.to = new THREE.Vector3(...(shot.to || shot.from));
    s.lookFrom = new THREE.Vector3(...shot.look); s.lookTo = new THREE.Vector3(...(shot.lookTo || shot.look));
    s.fov0 = shot.fov ?? this.fov; s.fov1 = shot.fov1 ?? s.fov0;
    this.shot = s;
    return new Promise((res) => { s.resolve = res; });
  }
  release() { this.mode = 'follow'; this.shot = null; }
  update(dt, time) {
    const cam = this.cam;
    let px, py, pz, lx, ly, lz, fov;
    if (this.mode === 'cinema' && this.shot) {
      const s = this.shot;
      s.t += dt;
      const u = clamp01(s.t / s.dur), e = (ease[s.ease] || ease.inOut)(u);
      this._p.lerpVectors(s.from, s.to, e); this._l.lerpVectors(s.lookFrom, s.lookTo, e);
      if (s.orbit) { // orbit around look point
        const a = lerp(s.orbit[0], s.orbit[1], e), r = s.radius || 6, h = s.height || 2;
        this._p.set(this._l.x + Math.sin(a) * r, this._l.y + h, this._l.z + Math.cos(a) * r);
      }
      px = this._p.x; py = this._p.y; pz = this._p.z; lx = this._l.x; ly = this._l.y; lz = this._l.z;
      fov = lerp(s.fov0, s.fov1, e);
      if (u >= 1 && s.resolve) { const r = s.resolve; s.resolve = null; r(); }
    } else {
      const k = damp(this.lag, dt);
      this.focus.lerp(this.target, k);
      if (this.bounds) {
        this.focus.x = clamp(this.focus.x, this.bounds.minX, this.bounds.maxX);
        this.focus.z = clamp(this.focus.z, this.bounds.minZ, this.bounds.maxZ);
      }
      this.dist += (this.distT - this.dist) * damp(5, dt);
      this.yaw += (this.yawT - this.yaw) * damp(7, dt);
      this.fov += (this.fovT - this.fov) * damp(5, dt);
      const d = this.dist * (1 - this.punch * 0.12);
      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      lx = this.focus.x + this.offset.x; ly = this.focus.y + this.offset.y; lz = this.focus.z + this.offset.z;
      px = lx + Math.sin(this.yaw) * cp * d; py = ly + sp * d; pz = lz + Math.cos(this.yaw) * cp * d;
      fov = this.fov;
    }
    this.punch = Math.max(0, this.punch - dt * 3);
    // trauma shake (squared falloff, smooth noise)
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const sh = this.trauma * this.trauma;
    this.shakeT += dt * 22;
    const sx = (vnoise3(this.shakeT, 0, 0) - 0.5) * sh * 0.7, sy = (vnoise3(0, this.shakeT, 5) - 0.5) * sh * 0.7, sz = (vnoise3(9, 0, this.shakeT) - 0.5) * sh * 0.7;
    cam.position.set(px + sx, py + sy, pz + sz);
    cam.lookAt(lx + sx * 0.5, ly + sy * 0.5, lz);
    if (sh > 0) cam.rotateZ((vnoise3(this.shakeT, 3, 3) - 0.5) * sh * 0.05);
    if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }
}

// ---------------------------------------------------------------- light pool
class LightPool {
  constructor(scene, n = 6) {
    this.lights = [];
    for (let i = 0; i < n; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 8, 1.6);
      l.castShadow = false;
      scene.add(l); this.lights.push(l);
    }
    this.static = [];   // {pos:[x,y,z], color, intensity, range, night:bool}
    this.dynamic = [];  // {pos, color, intensity, range, life, age}
  }
  setStatic(list) { this.static = list || []; }
  flash(pos, color, intensity = 8, range = 7, life = 0.35) { this.dynamic.push({ pos: pos.slice ? pos.slice() : [pos.x, pos.y, pos.z], color: new THREE.Color(color), intensity, range, life, age: 0 }); }
  update(dt, focus, night) {
    for (let i = 0; i < this.dynamic.length; i++) { const d = this.dynamic[i]; d.age += dt; if (d.age >= d.life) { this.dynamic.splice(i, 1); i--; } }
    const cands = [];
    for (const s of this.static) {
      const k = s.night ? night : 1;
      if (k <= 0.02) continue;
      const dx = s.pos[0] - focus.x, dz = s.pos[2] - focus.z, d2 = dx * dx + dz * dz;
      if (d2 > 900) continue;
      cands.push({ s, w: (s.intensity * k) / (1 + d2 * 0.05), k });
    }
    for (const d of this.dynamic) cands.push({ s: d, w: 1000, k: 1 - d.age / d.life, dyn: true });
    cands.sort((a, b) => b.w - a.w);
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i], c = cands[i];
      if (!c) { l.intensity = 0; continue; }
      l.position.set(c.s.pos[0], c.s.pos[1], c.s.pos[2]);
      l.color.set(c.s.color);
      l.intensity = c.s.intensity * c.k * (c.dyn ? 1 : 1);
      l.distance = c.s.range || 8;
    }
  }
}

// ---------------------------------------------------------------- portraits
export class PortraitView {
  constructor(gfx) {
    this.g = gfx;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(24, 1, 0.05, 50);
    const key = new THREE.DirectionalLight(0xfff2e0, 2.6); key.position.set(1.2, 2, 2.5);
    const rim = new THREE.DirectionalLight(0x9fc4ff, 1.8); rim.position.set(-2, 1.5, -1.5);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xdfe8ff, 0x4a3a50, 0.9));
    // halftone gradient backdrop
    this.bgU = { uA: { value: new THREE.Color(0xffd36b) }, uB: { value: new THREE.Color(0xff6b8a) }, uTime: shared.uTime };
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.bgU, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }',
      fragmentShader: `uniform vec3 uA; uniform vec3 uB; uniform float uTime; varying vec2 vUv;
        void main(){ vec3 c = mix(uB, uA, vUv.y); vec2 g = fract(vUv * vec2(14.0, 14.0) + vec2(uTime * 0.05, 0.0)) - 0.5;
          float dotm = step(length(g), 0.18 + 0.12 * (1.0 - vUv.y)); c = mix(c, c * 1.18, dotm * 0.5);
          float stripe = step(0.5, fract((vUv.x + vUv.y) * 6.0 - uTime * 0.2)); c *= 0.94 + stripe * 0.06; gl_FragColor = vec4(c, 1.0); }`,
    }));
    bg.frustumCulled = false; bg.renderOrder = -5;
    this.scene.add(bg);
    this.slots = new Map(); // id → {model, anim, el, frame}
  }
  // frame: {y (look height), dist, yaw}
  show(id, model, anim, el, frame = {}, colors) {
    this.hide(id);
    this.scene.add(model);
    this.slots.set(id, { model, anim, el, frame, colors });
  }
  hide(id) { const s = this.slots.get(id); if (s) { this.scene.remove(s.model); this.slots.delete(id); } }
  render() {
    const r = this.g.renderer;
    if (!this.slots.size) return;
    const dpr = r.getPixelRatio();
    const H = r.domElement.clientHeight;
    r.autoClear = false;
    for (const [, s] of this.slots) {
      if (!s.el || !s.el.isConnected) continue;
      const rc = s.el.getBoundingClientRect();
      if (rc.width < 4 || rc.height < 4) continue;
      for (const [, o] of this.slots) o.model.visible = o === s;
      if (s.colors) { this.bgU.uA.value.set(s.colors[0]); this.bgU.uB.value.set(s.colors[1]); }
      const f = s.frame, rig = s.model.userData.rig;
      const h = f.y ?? (rig ? rig.height * 0.78 : 1);
      const dist = f.dist ?? (rig ? rig.height * 1.15 + 0.5 : 2);
      const yaw = f.yaw ?? 0.35;
      this.cam.aspect = rc.width / rc.height; this.cam.updateProjectionMatrix();
      this.cam.position.set(Math.sin(yaw) * dist, h + 0.05, Math.cos(yaw) * dist);
      this.cam.lookAt(0, h, 0);
      const x = rc.left, y = H - rc.bottom;
      r.setViewport(x, y, rc.width, rc.height);
      r.setScissor(x, y, rc.width, rc.height);
      r.setScissorTest(true);
      r.clearDepth();
      r.render(this.scene, this.cam);
    }
    r.setScissorTest(false);
    r.setViewport(0, 0, r.domElement.clientWidth, r.domElement.clientHeight);
    r.autoClear = true;
  }
  update(dt) { for (const [, s] of this.slots) if (s.anim) s.anim.update(dt); }
}

// ---------------------------------------------------------------- Gfx
export class Gfx {
  constructor(canvas, opts = {}) {
    this.qName = opts.quality || detectQuality();
    this.Q = QUALITY[this.qName];
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.Q.post, powerPreference: 'high-performance', stencil: false, alpha: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xcfe0f2, 40, 160);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.3, 700);
    this.rig = new CameraRig(this.camera);
    this.sky = new Sky();
    this.sky.makeClouds();
    this.scene.add(this.sky.group);
    this.hemi = new THREE.HemisphereLight(0xcfe3ff, 0x8a7a62, 0.8);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.6);
    this.sun.castShadow = this.Q.shadow > 0;
    this.sun.shadow.mapSize.set(this.Q.shadow, this.Q.shadow);
    const sc = this.sun.shadow.camera;
    sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 120;
    this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.world = new THREE.Group(); this.world.name = 'world';
    this.actors = new THREE.Group(); this.actors.name = 'actors';
    this.scene.add(this.world, this.actors);
    this.fx = new FX();
    this.scene.add(this.fx.group);
    this.lights = new LightPool(this.scene, this.qName === 'low' ? 3 : 6);
    this.post = this.Q.post ? new Post(this.renderer, { msaa: this.Q.msaa, levels: this.Q.levels }) : null;
    if (this.post) { this.post.u.uOutline.value = this.Q.outline; this.post.u.uTilt.value = this.Q.tilt; }
    this.portraits = new PortraitView(this);
    this.hour = 12; this.tod = timeOfDay(12);
    this.time = 0;
    this.flashV = 0; this.flashColor = new THREE.Color(1, 1, 1);
    this.chroma = 0; this.speedLines = 0; this.letterbox = 0; this.letterT = 0; this.desat = 0;
    this.nightBoost = 0;   // extra for emissive windows/neon
    this.emissives = [];   // materials whose emissiveIntensity follows night
    this.onFrame = null;
    this._v = new THREE.Vector3();
    this.setTime(12);
  }

  resize(w, h) {
    const dpr = Math.min(typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1, this.Q.dpr);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.post) this.post.setSize(Math.round(w * dpr), Math.round(h * dpr));
    shared.uRes.value.set(w * dpr, h * dpr);
    this.w = w; this.h = h; this.dpr = dpr;
  }

  setTime(hour) {
    this.hour = hour;
    const t = this.tod = timeOfDay(hour);
    this.sky.apply(t, this.time);
    this.sun.color.copy(t.sun); this.sun.intensity = t.sunI;
    this.hemi.color.copy(t.hemiSky); this.hemi.groundColor.copy(t.hemiGround); this.hemi.intensity = t.hemiI;
    this.scene.fog.color.copy(t.fog);
    shadowTint.value.set(0.42, 0.36, 0.62).lerp(new THREE.Color(0.28, 0.3, 0.6), t.night);
    if (this.post) this.post.u.uExposure.value = t.exposure;
    else this.renderer.toneMappingExposure = t.exposure;
    for (const m of this.emissives) m.emissiveIntensity = (m.userData.baseEmissive ?? 1) * (0.05 + t.night * 1.4);
  }

  registerEmissive(mat, base = 1) { mat.userData.baseEmissive = base; this.emissives.push(mat); mat.emissiveIntensity = base * (0.05 + this.tod.night * 1.4); }

  // screen flash / impact frame helpers
  flash(color = 0xffffff, amount = 0.6) { this.flashColor.set(color); this.flashV = Math.max(this.flashV, amount); }
  impact(strength = 1) { this.rig.shake(0.35 * strength); this.chroma = Math.max(this.chroma, 1.2 * strength); this.rig.punch = Math.min(1, this.rig.punch + 0.5 * strength); }
  setLetterbox(on) { this.letterT = on ? 1 : 0; }

  project(v, out = {}) {
    this._v.copy(v).project(this.camera);
    out.x = (this._v.x * 0.5 + 0.5) * this.w; out.y = (-this._v.y * 0.5 + 0.5) * this.h;
    out.visible = this._v.z < 1 && this._v.z > -1;
    return out;
  }

  frame(dt, realDt = dt) {
    this.time += realDt;
    shared.uTime.value = this.time;
    this.rig.update(realDt, this.time);
    // sun follows focus for crisp shadows (snapped to shadow texels)
    const f = this.rig.mode === 'cinema' && this.rig.shot ? this.rig._l : this.rig.focus;
    const sd = this.tod.sunDir;
    const texel = 44 / this.Q.shadow;
    const fx = Math.round(f.x / texel) * texel, fz = Math.round(f.z / texel) * texel;
    this.sun.target.position.set(fx, 0, fz);
    this.sun.position.set(fx + sd.x * 50, sd.y * 50, fz + sd.z * 50);
    this.sky.group.position.copy(this.camera.position);
    this.sky.uniforms.uTime.value = this.time;
    this.fx.update(dt, this.camera);
    this.lights.update(dt, f, this.tod.night);
    this.portraits.update(realDt);
    this.flashV = Math.max(0, this.flashV - realDt * 3.2);
    this.chroma = Math.max(0, this.chroma - realDt * 4);
    this.letterbox += (this.letterT - this.letterbox) * damp(4, realDt);
    if (this.onFrame) this.onFrame(dt);
    if (this.post) {
      const u = this.post.u;
      u.uFlash.value = this.flashV; u.uFlashColor.value.set(this.flashColor.r, this.flashColor.g, this.flashColor.b);
      u.uChroma.value = this.chroma; u.uSpeed.value = this.speedLines; u.uLetter.value = this.letterbox; u.uDesat.value = this.desat;
      u.uBloom.value = 0.55 + this.tod.night * 0.45;
      this.post.render(this.scene, this.camera, this.time);
    } else {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    }
    this.portraits.render();
  }
}
