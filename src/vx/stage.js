// The voxel stage: three.js scene for a fine-voxel diorama seen from above —
// a warm sun with soft shadows, sky/ground hemisphere fill, baked corner
// occlusion, fog that melts the edges of the set, glowing windows, neon and lamps
// at night. Box-model creatures and people stand in it.
// The stage renders into its own canvas; the HD-2D post pass (bloom, tilt-shift,
// grade) is applied on top by src/px/hd2d.js.
import * as THREE from '../../vendor/three.module.js';
import { OUTLINE } from './model.js';
export const MOODS = {
  day: { sun: 0xfff1d6, sunI: 1.6, sunDir: [-0.55, 1, 0.42], hemiSky: 0xc4dcff, hemiGround: 0x9a8a6a, hemiI: 0.85, fog: 0xc8d8e8, bg: 0x9cc4ec, sky: ['#5a8ad0', '#9cc4ec', '#dceaf4'], glow: 0.12, exposure: 1.0 },
  golden: { sun: 0xffcf98, sunI: 1.75, sunDir: [-0.85, 0.7, 0.35], hemiSky: 0xc4c0ec, hemiGround: 0x8a6a4a, hemiI: 0.85, fog: 0xe8c8b0, bg: 0xe8b898, sky: ['#7a8ec8', '#d8b0b8', '#f6c49a'], glow: 0.3, exposure: 1.05 },
  night: { sun: 0x8aa0ff, sunI: 0.32, sunDir: [0.4, 1, 0.5], hemiSky: 0x3a4a8a, hemiGround: 0x241c30, hemiI: 0.55, fog: 0x161a30, bg: 0x0c1020, sky: ['#060812', '#121a36', '#2a2a4a'], glow: 1.15, exposure: 1.1 },
};

export class VxStage {
  constructor(o = {}) {
    this.cv = o.canvas || document.createElement('canvas');
    const r = this.r = new THREE.WebGLRenderer({ canvas: this.cv, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1;
    const S = this.scene = new THREE.Scene();
    this.mats = {
      solid: new THREE.MeshLambertMaterial({ vertexColors: true }),
      glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
      water: new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.78, shininess: 90, specular: 0x6a7a8a, depthWrite: false }),
    };
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1); S.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(o.shadowSize || 4096, o.shadowSize || 4096); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.04; this.sun.shadow.radius = 2.5;
    S.add(this.sun, this.sun.target);
    this.cam = new THREE.PerspectiveCamera(o.fov || 32, 16 / 9, 0.5, 2000);
    this.view = { target: new THREE.Vector3(0, 0, 0), dist: 60, yaw: 0, pitch: 52 };
    this.actors = new THREE.Group(); S.add(this.actors);
    this.lamps = [];
    this.hooks = []; this.time = 0;            // per-frame hooks (card billboards, wind, animation)
    this.style = {};
    this.setMood('day');
  }
  setSize(w, h) { this.w = w; this.h = h; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
  // (ink and toon: see setStyle)
  // world: a Fine voxel volume → chunk meshes; the sun's shadow box covers it
  setWorld(vox) {
    if (this.world) { this.scene.remove(this.world); this.world.traverse((o) => o.geometry && o.geometry.dispose()); }
    const g = vox.mesh(), W = this.world = new THREE.Group();
    for (const geo of g.opaque) { const m = new THREE.Mesh(geo, this.mats.solid); m.castShadow = m.receiveShadow = true; W.add(m); }
    for (const geo of g.glow) W.add(new THREE.Mesh(geo, this.mats.glow));
    for (const geo of g.water) { const m = new THREE.Mesh(geo, this.mats.water); m.receiveShadow = true; m.renderOrder = 2; W.add(m); }
    this.scene.add(W);
    this.vox = vox; this.size = [vox.X * vox.s, vox.Y * vox.s, vox.Z * vox.s];
    this.fitShadow();
    return this;
  }
  fitShadow() {
    if (!this.size) return;
    const [SX, , SZ] = this.size, cx = SX / 2, cz = SZ / 2, R = Math.hypot(SX, SZ) * 0.55 + 4, sc = this.sun.shadow.camera;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 600; sc.updateProjectionMatrix();
    const d = this.mood.sunDir, L = Math.hypot(...d);
    this.sun.position.set(cx + d[0] / L * 200, d[1] / L * 200, cz + d[2] / L * 200); this.sun.target.position.set(cx, 0, cz);
  }
  setMood(name) {
    const m = this.mood = Object.assign({}, MOODS[name] || MOODS.day); this.moodName = name;
    this.sun.color.set(m.sun); this.sun.intensity = m.sunI;
    this.hemi.color.set(m.hemiSky); this.hemi.groundColor.set(m.hemiGround); this.hemi.intensity = m.hemiI;
    this.scene.fog = new THREE.Fog(m.fog, 70, 220);
    this.scene.background = m.sky ? skyTexture(m.sky) : new THREE.Color(m.bg);
    this.mats.glow.color.setScalar(m.glow);
    this.r.toneMappingExposure = m.exposure;
    for (const l of this.lamps) l.visible = name === 'night';
    this.fitShadow();
  }
  // a warm point light (street lamps, windows) that only shows at night
  lamp(x, y, z, color = 0xffc070, power = 30, dist = 14) {
    const l = new THREE.PointLight(color, power, dist, 1.6); l.position.set(x, y, z); l.visible = this.moodName === 'night';
    this.scene.add(l); this.lamps.push(l); return l;
  }
  // camera: look at target from yaw/pitch (degrees) at a distance
  look(target, dist, yaw = 0, pitch = 52) { this.view.target.set(...target); Object.assign(this.view, { dist, yaw, pitch }); }
  updateCamera() {
    const v = this.view, yr = v.yaw * Math.PI / 180, pr = v.pitch * Math.PI / 180;
    this.cam.position.set(v.target.x + Math.sin(yr) * Math.cos(pr) * v.dist, v.target.y + Math.sin(pr) * v.dist, v.target.z + Math.cos(yr) * Math.cos(pr) * v.dist);
    this.cam.lookAt(v.target);
  }
  render() {
    this.updateCamera(); this.cam.updateMatrixWorld(); OUTLINE.uK.value = (2 * Math.tan((this.cam.fov * Math.PI) / 360)) / (this.h || 720);
    for (const f of this.hooks) f(this);
    if (this.style.toon) this.toonify(this.scene);
    if (!this.style.ink) { this.r.render(this.scene, this.cam); return this.cv; }
    // ink: render into a target with depth, then composite with outlines found in the depth buffer
    const W = this.w, H = this.h;
    if (!this.rt || this.rt.width !== W || this.rt.height !== H) {
      if (this.rt) this.rt.dispose();
      this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(W, H, THREE.UnsignedIntType) });
      this.inkQuad.material.uniforms.tColor.value = this.rt.texture; this.inkQuad.material.uniforms.tDepth.value = this.rt.depthTexture;
    }
    const u = this.inkQuad.material.uniforms;
    u.uTexel.value.set((this.style.inkPx ?? 1.5) / W, (this.style.inkPx ?? 1.5) / H); u.uNear.value = this.cam.near; u.uFar.value = this.cam.far; u.uFog.value.set(this.scene.fog ? this.scene.fog.near : 1e4, this.scene.fog ? this.scene.fog.far : 2e4);
    u.uInk.value.set(this.style.inkColor || 0x140e16); u.uK.value = this.style.inkDepth ?? 0.018; u.uCrease.value = this.style.inkCrease ?? 0.006; u.uAlpha.value = this.style.inkAlpha ?? 0.92;
    this.r.setRenderTarget(this.rt); this.r.render(this.scene, this.cam);
    this.r.setRenderTarget(null); this.r.render(this.inkScene, this.inkCam);
    return this.cv;
  }
  // stylized look: { ink: outlines from depth, toon: banded cel shading }
  setStyle(o = {}) {
    this.style = Object.assign(this.style || {}, o);
    if (o.ink && !this.inkScene) {
      this.inkCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.inkScene = new THREE.Scene();
      this.inkQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: { tColor: { value: null }, tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, uNear: { value: 0.5 }, uFar: { value: 2000 }, uFog: { value: new THREE.Vector2(70, 220) }, uInk: { value: new THREE.Color(0x140e16) }, uK: { value: 0.018 }, uCrease: { value: 0.006 }, uAlpha: { value: 0.92 } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `#include <packing>
          uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uTexel; uniform float uNear; uniform float uFar; uniform vec2 uFog; uniform vec3 uInk; uniform float uK; uniform float uCrease; uniform float uAlpha;
          varying vec2 vUv;
          float lz(vec2 uv) { float d = texture2D(tDepth, uv).x; return d >= 1.0 ? 1e5 : -perspectiveDepthToViewZ(d, uNear, uFar); }
          void main() {
            vec4 col = texture2D(tColor, vUv);
            float c = lz(vUv);
            float l = lz(vUv - vec2(uTexel.x, 0.0)), r = lz(vUv + vec2(uTexel.x, 0.0)), d = lz(vUv - vec2(0.0, uTexel.y)), u = lz(vUv + vec2(0.0, uTexel.y));
            // silhouettes: this pixel is in front of a neighbour by a good margin (lines sit on the near object)
            float jump = max(max(l - c, r - c), max(d - c, u - c)) / c;
            float edge = smoothstep(uK, uK * 1.6, jump);
            // creases: the depth bends sharply (corners, folds) — only on surfaces, not into the sky
            if (c < 1e4 && l < 1e4 && r < 1e4 && u < 1e4 && d < 1e4) edge = max(edge, smoothstep(uCrease, uCrease * 2.2, abs(l + r + u + d - 4.0 * c) / c) * 0.7);
            float fog = 1.0 - smoothstep(uFog.x, uFog.y, c);
            gl_FragColor = vec4(mix(col.rgb, uInk, edge * uAlpha * fog), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }));
      this.inkQuad.frustumCulled = false; this.inkScene.add(this.inkQuad);
    }
    if (o.toon) {
      const g = new Uint8Array([90, 90, 90, 255, 168, 168, 168, 255, 230, 230, 230, 255, 255, 255, 255, 255]);
      this.toonRamp = new THREE.DataTexture(g, 4, 1, THREE.RGBAFormat); this.toonRamp.minFilter = this.toonRamp.magFilter = THREE.NearestFilter; this.toonRamp.needsUpdate = true;
      this.toonCache = new Map();
    }
    return this;
  }
  // swap lit materials for cel-shaded twins (patched or unlit materials are left alone)
  toonify(root) {
    const C = this.toonCache;
    root.traverse((o) => {
      const m = o.material; if (!m || Array.isArray(m) || !m.isMeshLambertMaterial || m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile || m.userData.keep) return;
      let t = C.get(m);
      if (!t) { t = new THREE.MeshToonMaterial({ color: m.color, map: m.map, vertexColors: m.vertexColors, alphaTest: m.alphaTest, side: m.side, transparent: m.transparent, opacity: m.opacity, gradientMap: this.toonRamp, emissive: m.emissive, emissiveMap: m.emissiveMap, emissiveIntensity: m.emissiveIntensity }); C.set(m, t); }
      o.material = t;
    });
  }
}

// a vertical sky gradient for the background
function skyTexture(cols) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); cols.forEach((col, i) => gr.addColorStop(i / (cols.length - 1), col)); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// a hazy distant skyline (boxes with window grids) standing behind the diorama
export function skyline(stage, o = {}) {
  const G = new THREE.Group(), r = (n) => { let s = (o.seed || 7) * 9301 + n * 49297; s = (s * 233280 + 12345) % 2147483647; return s / 2147483647; };
  const night = stage.moodName === 'night';
  const mat = new THREE.MeshLambertMaterial({ color: night ? 0x2a3050 : 0x9aa4bc, fog: true });
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffd890, toneMapped: false, fog: true });
  const [x0, x1] = o.x || [-40, 110], z = o.z ?? -70;
  for (let i = 0; i < (o.n || 40); i++) {
    const w = 4 + r(i) * 9, d = 4 + r(i + 99) * 8, h = 12 + Math.pow(r(i + 7), 2) * 70, x = x0 + r(i + 3) * (x1 - x0), zz = z - r(i + 5) * 60;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, h / 2 - 2, zz); G.add(b);
    if (night) for (let k = 0; k < 6; k++) { const wnd = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), winMat); wnd.position.set(x - w / 2 + 0.8 + r(i * 13 + k) * (w - 1.6), 2 + r(i * 7 + k) * (h - 4), zz + d / 2 + 0.05); G.add(wnd); }
  }
  // the pyramid and the tall tower: San Francisco's silhouette
  const pyr = new THREE.Mesh(new THREE.ConeGeometry(7, 64, 4), mat); pyr.position.set((x0 + x1) * 0.45, 30, z - 30); pyr.rotation.y = Math.PI / 4; G.add(pyr);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 6, 92, 8), mat); tower.position.set((x0 + x1) * 0.6, 44, z - 50); G.add(tower);
  stage.scene.add(G); return G;
}
