// The voxel stage: the three.js scene for the city and the dioramas, lit physically: a sun at a believable angle
// with crisp cascaded shadows, a sky-coloured hemisphere fill with a ground bounce, an analytic scattering sky
// (render/sky.js) that is also the reflection environment, screen-space ambient occlusion, aerial perspective,
// emissive windows, neon and lamps that throw real pools of light at night (render/pools.js), and AgX filmic tone
// mapping with a neutral grade (render/composite.js). Everything renders in this one WebGL context straight to
// the canvas (no second post-processing canvas). Box-model creatures and people stand in it.
// Styles (setStyle): { hd: true } is the realistic look; { ink, toon } is the old cel look (?look=toon).
import * as THREE from '../../vendor/three.module.js';
import { OUTLINE } from './model.js';
import { LightPools, Halos } from './render/pools.js';
import { Composite } from './render/composite.js';
import { installLighting, aimShadow } from './render/shadows.js';
import { Sky } from './render/sky.js';

installLighting();
const LITE = !!globalThis.TOKON_LITE;
// the outline ink: near-black for every mood (a hair of warmth, never pure black)
const INK = new THREE.Color('#0a0608');

// per mood: sun (colour, intensity, direction toward the sun: its elevation sets the shadow length), sky / ground
// fill (hemisphere: the sky's own colour, the ground colour is light bounced off sunlit streets), haze (aerial
// perspective: colour and [start m, density /m, max, falloff with height /m]), skyP (the scattering sky:
// turbidity, rayleigh, scale; night: the moonlit variant), clouds, environment reflection strength, emissive
// levels (glow voxels, lit textures), light-pool gain, ambient occlusion strength, exposure.
// Values follow the real thing: a near-white sun at ~48° by day (sun ≈ 4–5× the sky fill on the ground), an
// amber low sun at golden hour, deep orange at dusk, and a dim cool moon at night where the street lamps,
// windows and neon do the lighting.
export const MOODS = {
  day: { ink: '#2e1c18', sun: 0xfff3e2, sunI: 4.6, sunDir: [-0.55, 0.78, 0.42], hemiSky: 0x9ec2ea, hemiGround: 0x8a7a68, hemiI: 1.15, fog: 0xc2d2e2, hazeP: [45, 0.006, 0.55, 0.035], skyP: { turbidity: 2.6, rayleigh: 1.3, scale: 1.0 }, clouds: 0.32, env: 1.0, glow: 0.25, emissive: 0, pools: 0, ao: 0.8, exposure: 0.92 },
  golden: { ink: '#3a1c12', sun: 0xffc48a, sunI: 4.0, sunDir: [-0.9, 0.36, 0.3], hemiSky: 0x93a8d0, hemiGround: 0x8a6a50, hemiI: 1.0, fog: 0xe0c0a4, hazeP: [40, 0.008, 0.6, 0.035], skyP: { turbidity: 3.6, rayleigh: 1.6, scale: 1.0 }, clouds: 0.3, env: 1.0, glow: 0.6, emissive: 0.25, pools: 0.05, halo: 0, ao: 0.8, exposure: 1.0 },
  dusk: { ink: '#2a1626', sun: 0xff9a5c, sunI: 2.2, sunDir: [-0.95, 0.12, 0.3], hemiSky: 0x5a6aa0, hemiGround: 0x4a3a34, hemiI: 0.75, fog: 0x8a86a8, hazeP: [36, 0.01, 0.6, 0.04], skyP: { turbidity: 4, rayleigh: 2.2, scale: 1.0 }, clouds: 0.36, env: 0.9, glow: 1.8, emissive: 0.85, pools: 0.55, halo: 0.35, ao: 0.8, exposure: 1.25 },
  night: { ink: '#180e16', sun: 0x9fb4e8, sunI: 0.28, sunDir: [0.35, 1, 0.55], hemiSky: 0x24304e, hemiGround: 0x1c1a1e, hemiI: 0.5, fog: 0x101a2c, hazeP: [30, 0.012, 0.6, 0.05], skyP: { night: 1, sunElev: -0.12, turbidity: 3, rayleigh: 2, scale: 1.0 }, clouds: 0.18, env: 0.6, glow: 3.2, emissive: 1.0, pools: 0.85, halo: 0.45, ao: 0.75, exposure: 1.9 },
};

const _up = new THREE.Vector3(0, 1, 0), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
export class VxStage {
  constructor(o = {}) {
    this.cv = o.canvas || document.createElement('canvas');
    const r = this.r = new THREE.WebGLRenderer({ canvas: this.cv, antialias: o.antialias ?? false, preserveDrawingBuffer: !!o.preserve, powerPreference: 'high-performance', stencil: false });
    r.setPixelRatio(1);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.AgXToneMapping; r.toneMappingExposure = 1;
    const S = this.scene = new THREE.Scene();
    this.mats = {
      solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 }),
      glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
      water: new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.8, roughness: 0.08, metalness: 0, depthWrite: false }),
    };
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1); S.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(o.shadowSize || 2048, o.shadowSize || 2048); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.04; this.sun.shadow.radius = 2.5;
    S.add(this.sun, this.sun.target);
    // the far shadow cascade: a black twin of the sun that only casts (render/shadows.js); on while the shadow box follows the camera
    const fs = Math.max(1024, (o.shadowSize || 2048) / 2);
    this.lite = o.lite ?? LITE;              // lite (phones): one shadow cascade, FXAA instead of MSAA, cheaper occlusion
    this.sunFar = new THREE.DirectionalLight(0x000000, 0); this.sunFar.castShadow = true; this.sunFar.visible = false;
    this.sunFar.shadow.mapSize.set(fs, fs); this.sunFar.shadow.bias = -0.0005; this.sunFar.shadow.normalBias = 0.06;
    S.add(this.sunFar, this.sunFar.target);

    this.shadowNear = this.lite ? 16 : 12;     // the near cascade's half-size (m) around the player (lite: the only cascade)
    this.sky = new Sky();
    this.farHide = [];                         // objects the far shadow cascade skips (small props: build.js)
    this.post = { opts: {}, draw() {} };       // the grade (look.js POST, eased by the cinema); applied in the composite
    this.cam = new THREE.PerspectiveCamera(o.fov || 32, 16 / 9, 0.5, 2000); this.baseFov = this.cam.fov;
    // (three's shadow pass tests objects against the camera's layers: the shadow-only proxies of city/merge.js sit on
    // layer 1, and draw nothing in the colour pass: no colour, no depth)
    this.cam.layers.enable(1);
    this.view = { target: new THREE.Vector3(0, 0, 0), dist: 60, yaw: 0, pitch: 52 };
    this.actors = new THREE.Group(); S.add(this.actors);
    this.lamps = [];                           // light-pool records (see lamp / addLights)
    this.lamps.version = 0;
    this.pools = new LightPools(r);
    this.halos = new Halos(); S.add(this.halos.points);
    this.glowMats = new Map();                 // material → { k, always }: emissive textures scaled by the mood
    this.hooks = []; this.time = 0;            // per-frame hooks (card billboards, wind, animation)
    this.style = {}; this.frameN = 0;
    this.setMood('day');
  }
  setSize(w, h) { this.w = w; this.h = h; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
  // world: a Fine voxel volume → chunk meshes; the sun's shadow box covers it
  setWorld(vox) {
    if (this.world) { this.scene.remove(this.world); this.world.traverse((o) => o.geometry && o.geometry.dispose()); }
    const g = vox.mesh(), W = this.world = new THREE.Group();
    for (const geo of g.opaque) { const m = new THREE.Mesh(geo, this.mats.solid); m.castShadow = m.receiveShadow = true; W.add(m); }
    for (const geo of g.glow) W.add(new THREE.Mesh(geo, this.mats.glow));
    for (const geo of g.water) { const m = new THREE.Mesh(geo, this.mats.water); m.receiveShadow = true; m.renderOrder = 2; W.add(m); }
    this.scene.add(W);
    this.vox = vox; this.size = [vox.X * vox.s, vox.Y * vox.s, vox.Z * vox.s];
    this.shadowFollow = false;
    this.fitShadow();
    return this;
  }
  fitShadow() {
    if (!this.size || this.shadowFollow) return;
    this.sunFar.visible = false; this.sun.shadow.normalBias = 0.04; this.sun.shadow.bias = -0.0004;
    const [SX, , SZ] = this.size, cx = SX / 2, cz = SZ / 2, R = Math.hypot(SX, SZ) * 0.55 + 4, sc = this.sun.shadow.camera;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 600; sc.updateProjectionMatrix();
    const d = this.mood.sunDir, L = Math.hypot(...d);
    this.sun.position.set(cx + d[0] / L * 200, d[1] / L * 200, cz + d[2] / L * 200); this.sun.target.position.set(cx, 0, cz);
  }
  /** a shadow box of radius R that follows the camera target (worlds too big for one shadow map: the city). It is
   *  the far cascade; the near one (sharp, ±shadowNear m) is aimed at the player every frame in render(). */
  followShadow(t, R = 34) {
    this.shadowFollow = true;
    const d = this.mood.sunDir, L = Math.hypot(...d);
    this.sunDirN = (this.sunDirN || new THREE.Vector3()).set(d[0] / L, d[1] / L, d[2] / L);
    if (this.lite) { this.sunFar.visible = false; this.sun.shadow.normalBias = 0.03; this.sun.shadow.bias = -0.0003; return; }
    if (!this.sunFar.visible) { this.sunFar.visible = true; this.sun.shadow.normalBias = 0.02; this.sun.shadow.bias = -0.0002; }
    aimShadow(this.sunFar, t, R, this.sunDirN);
  }
  /** the near cascade: a tight box around what the camera looks at, pushed a little ahead along the view */
  aimNearShadow() {
    const v = this.view, R = Math.min(this.shadowNear * Math.max(1, v.dist / 6), 40), yr = v.yaw * Math.PI / 180, ahead = R * 0.45;
    _v1.set(v.target.x - Math.sin(yr) * ahead, 0, v.target.z - Math.cos(yr) * ahead);
    aimShadow(this.sun, _v1, R, this.sunDirN);
  }
  setMood(name) {
    const m = this.mood = Object.assign({}, MOODS[name] || MOODS.day); this.moodName = name;
    this.sun.color.set(m.sun); this.sun.intensity = m.sunI;
    this.hemi.color.set(m.hemiSky); this.hemi.groundColor.set(m.hemiGround); this.hemi.intensity = m.hemiI;
    this.haze = new THREE.Color(m.fog); this.inkCol = INK.clone();
    this.scene.fog = this.style.hd ? null : new THREE.Fog(m.fog, 70, 220);
    if (this.style.hd) {
      // the scattering sky dome (drawn in the HDR frame) and its reflection environment for glossy surfaces
      this.sky.setMood(m, MOODS[name] ? name : null);
      if (this.sky.mesh.parent !== this.scene) this.scene.add(this.sky.mesh);
      this.scene.background = null; this.scene.environment = this.sky.env(this.r);
      this.scene.environmentIntensity = m.env ?? 1;
      // the haze takes the colour of the sky's horizon
      this.haze = new THREE.Color(m.fog);
    } else { if (this.sky.mesh.parent) this.scene.remove(this.sky.mesh); this.scene.background = new THREE.Color(m.fog); this.scene.environment = null; }
    if (this.shadowFollow) { const d = m.sunDir, L = Math.hypot(...d); this.sunDirN = (this.sunDirN || new THREE.Vector3()).set(d[0] / L, d[1] / L, d[2] / L); }
    this.mats.glow.color.setScalar(m.glow);
    this.r.toneMappingExposure = m.exposure;
    for (const [mat, g] of this.glowMats) mat.emissiveIntensity = g.k * (g.always ? 1 : m.emissive);
    this.fitShadow();
  }
  /** a warm light (street lamp, window, neon) — a pool of light on the ground around it, shown by the mood */
  lamp(x, y, z, color = 0xffc070, power = 30, dist = 14) {
    const l = LightPools.light(x, y, z, color, Math.min(2.4, power / 22), dist * 0.7, Math.max(1, y)); l.halo = 1.2;
    this.lamps.push(l); this.lamps.version++; return l;
  }
  addLights(list) { for (const l of list) this.lamps.push(l); this.lamps.version++; }
  /** an emissive material whose glow follows the mood (always: shines by day too, like a screen) */
  glowMat(mat, k = 1, always = false) { this.glowMats.set(mat, { k, always }); mat.emissiveIntensity = k * (always ? 1 : this.mood.emissive); }
  // camera: look at target from yaw/pitch (degrees) at a distance, through a lens of fov degrees (default: baseFov)
  look(target, dist, yaw = 0, pitch = 52, fov) { this.view.target.set(...target); Object.assign(this.view, { dist, yaw, pitch, fov }); }
  updateCamera() {
    const v = this.view, yr = v.yaw * Math.PI / 180, pr = v.pitch * Math.PI / 180, fov = v.fov || this.baseFov;
    if (Math.abs(this.cam.fov - fov) > 1e-3) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
    this.cam.position.set(v.target.x + Math.sin(yr) * Math.cos(pr) * v.dist, v.target.y + Math.sin(pr) * v.dist, v.target.z + Math.cos(yr) * Math.cos(pr) * v.dist);
    this.cam.lookAt(v.target);
  }
  // every lit material receives the light pools: actors every frame, the whole scene now and then
  patchLights() {
    const n = this.scene.children.length;
    if (n !== this.lastN || this.frameN % 30 === 0) { this.lastN = n; this.pools.patchTree(this.scene); } else this.pools.patchTree(this.actors);
  }
  render() {
    this.frameN++;
    this.updateCamera(); this.cam.updateMatrixWorld(); OUTLINE.uK.value = (2 * Math.tan((this.cam.fov * Math.PI) / 360)) / (this.h || 720);
    for (const f of this.hooks) f(this);
    if (this.style.toon) this.toonify(this.scene);
    this.patchLights();
    this.pools.update(this.lamps, this.view.target, (this.mood.pools || 0) * (this.style.pools ?? 1), Math.max(96, this.view.dist * 3.4));
    this.halos.update(this.lamps, this.cam, this.h || 720, (this.mood.halo || 0) * (this.style.pools ?? 1));
    if (this.style.hd) {
      const m = this.mood, s = this.style, P = this.post.opts || {};
      if (this.shadowFollow && this.sunDirN) this.aimNearShadow();
      // the far cascade (wide, soft, distant shadows) is refreshed every third frame
      if (this.sunFar.visible) {
        this.sunFar.shadow.autoUpdate = false;
        // rendered here, on its own, without the people, creatures and the small props: in the far cascade their shadows
        // are a few texels, and they cost a draw call each
        if (this.frameN % 3 === 0) {
          const hid = [this.actors, ...this.farHide].filter((o) => o.visible); for (const o of hid) o.visible = false;
          // (a render through a camera that sees nothing, into a 1-pixel target: three draws only the shadow map)
          const dc = this.farCam || (this.farCam = new THREE.PerspectiveCamera(1, 1, 1e5, 1e5 + 1)), dt = this.farRT || (this.farRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false }));
          dc.layers.mask = this.cam.layers.mask; dc.position.set(0, -1e4, 0); dc.lookAt(0, -2e4, 0); dc.updateMatrixWorld();
          const prevRT = this.r.getRenderTarget(), sky = this.sky.mesh.visible, hv = this.halos.points.visible;
          this.sun.shadow.autoUpdate = false; this.sun.shadow.needsUpdate = false; this.sunFar.shadow.needsUpdate = true; this.sky.mesh.visible = false; this.halos.points.visible = false;
          try { this.r.setRenderTarget(dt); this.r.render(this.scene, dc); }
          finally { for (const o of hid) o.visible = true; this.sun.shadow.autoUpdate = true; this.sky.mesh.visible = sky; this.halos.points.visible = hv; this.r.setRenderTarget(prevRT); }
        }
        this.sunFar.shadow.needsUpdate = false;
      }
      this.sky.u.uTime.value = this.time = (this.time || 0) + 1 / 60;
      this.cv.depthDof = 0;
      // one ink line for every asset (the composite finds it in the depth buffer): the Tokonmon's own inverted-hull
      // outlines (model.js) step aside while it draws
      OUTLINE.show(false);
      const px = this.w * this.h, msaa = s.msaa ?? (this.lite || px > 3.7e6 ? 0 : 4);   // MSAA up to 1440p, FXAA above (and on lite)
      try {
        this.comp.render(this.scene, this.cam, this.w, this.h, {
          ao: (m.ao ?? 0.8) * (s.ao ?? 1), aoRadius: s.aoRadius ?? 0.9, aoK: s.aoK, aoScale: this.lite ? 0.33 : undefined,
          haze: this.haze, hazeP: [m.hazeP[0], m.hazeP[1], m.hazeP[2] * (s.haze ?? 1), m.hazeP[3]], exposure: this.r.toneMappingExposure, tone: s.tone || 'agx',
          bloom: P.bloom ?? 0.12, threshold: P.threshold ?? 1.4, sat: P.sat ?? 1, contrast: P.contrast ?? 0.12, vig: P.vig ?? 0.18, wb: P.wb, lift: P.lift || 0,
          msaa, fxaa: s.fxaa ?? !msaa, debug: s.debug, time: this.time,
          ink: s.inkA ?? 1, inkCol: INK, inkW: s.inkW, inkP: s.inkP, inkFade: s.inkFade,
        });
      } finally { OUTLINE.show(true); }
      return this.cv;
    }
    this.cv.depthDof = 0;
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
  // { hd: realistic HDR look (ao, aoRadius, haze, pools: multipliers; inkA: outline strength, inkW / inkP / inkFade:
  //   its width and thresholds, see render/composite.js) } or the old { ink: outlines, toon: banded cel shading }
  setStyle(o = {}) {
    this.style = Object.assign(this.style || {}, o);
    if (o.hd) { if (!this.comp) this.comp = new Composite(this.r, { lite: this.lite }); this.style.ink = false; this.style.toon = false; this.scene.fog = null; if (this.moodName) this.setMood(this.moodName); }
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
      this.r.toneMapping = THREE.ACESFilmicToneMapping;
    }
    return this;
  }
  // swap lit materials for cel-shaded twins (patched or unlit materials are left alone)
  toonify(root) {
    const C = this.toonCache;
    root.traverse((o) => {
      const m = o.material; if (!m || Array.isArray(m) || !(m.isMeshLambertMaterial || m.isMeshStandardMaterial) || (m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile && !m.userData.vxChain) || m.userData.keep) return;
      let t = C.get(m);
      if (!t) { t = new THREE.MeshToonMaterial({ color: m.color, map: m.map, vertexColors: m.vertexColors, alphaTest: m.alphaTest, side: m.side, transparent: m.transparent, opacity: m.opacity, gradientMap: this.toonRamp, emissive: m.emissive, emissiveMap: m.emissiveMap, emissiveIntensity: m.emissiveIntensity }); C.set(m, t); }
      o.material = t;
    });
  }
}

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// a vertical sky gradient for the background (the toon look; the HD look paints a sky dome, render/sky.js)
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
