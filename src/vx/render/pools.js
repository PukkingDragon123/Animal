// Light pools: hundreds of cheap night lights (street lamps, lanterns, neon, lit shop windows, glowing
// props). Instead of real three.js lights (each one costs every lit pixel, and three compiles their count
// into every shader), the lights are splatted once into a small top-down light map that follows the
// camera: each light adds the pool it throws on the ground, shaped like a real lamp (cos³ falloff from
// its height, windowed to its radius). Every lit material samples the map at its world position (a step
// out along its normal, so walls catch the pool in front of them) and adds it as diffuse light, fading
// above the height of the lights around it. One texture tap per pixel, whatever the number of lights.
import * as THREE from '../../../vendor/three.module.js';

const RES = 512;   // light-map texels (the map covers `size` metres around the camera target)

const SPLAT_VS = `
attribute vec4 aLight;   // x, y, z, radius
attribute vec4 aCol;     // rgb (linear, × intensity), shape height
uniform vec3 uRect;      // x0, z0, size
varying vec2 vD; varying float vR; varying float vY; varying float vS; varying vec3 vCol;
void main() {
  vD = position.xy * aLight.w; vR = aLight.w; vY = aLight.y; vS = max(aCol.w, 0.3); vCol = aCol.rgb;
  vec2 p = aLight.xz + vD;
  gl_Position = vec4((p - uRect.xy) / uRect.z * 2.0 - 1.0, 0.0, 1.0);
}`;
const SPLAT_FS = `
varying vec2 vD; varying float vR; varying float vY; varying float vS; varying vec3 vCol;
void main() {
  float d2 = dot(vD, vD), r2 = vR * vR;
  if (d2 >= r2) discard;
  float c = vS * vS / (d2 + vS * vS);            // cos² of the angle from straight below
  float w = 1.0 - d2 / r2;
  float e = c * sqrt(c) * w * w;                 // cos³ (inverse square × Lambert), windowed to the radius
  float L = (vCol.r + vCol.g + vCol.b) * 0.3333;
  gl_FragColor = vec4(vCol * e, e * L * vY);     // A: light-weighted height (→ the height of the lights here)
}`;

// injected into every lit material (Lambert, Phong, Standard, Toon)
const VS_PARS = '\nvarying vec3 vPoolW;\n';
const VS_MAIN = `
  {
    vec4 vxW = vec4( transformed, 1.0 );
    #ifdef USE_BATCHING
      vxW = batchingMatrix * vxW;
    #endif
    #ifdef USE_INSTANCING
      vxW = instanceMatrix * vxW;
    #endif
    vPoolW = ( modelMatrix * vxW ).xyz;
  }
`;
const FS_PARS = '\nuniform sampler2D uPoolMap;\nuniform vec4 uPoolRect;\nvarying vec3 vPoolW;\n';
const FS_MAIN = `
  if ( uPoolRect.w > 0.0 ) {
    vec3 vxN = inverseTransformDirection( normal, viewMatrix );
    vec2 vxUV = ( vPoolW.xz + vxN.xz * 0.35 - uPoolRect.xy ) * uPoolRect.z;
    if ( vxUV.x > 0.0 && vxUV.y > 0.0 && vxUV.x < 1.0 && vxUV.y < 1.0 ) {
      vec4 vxP = texture2D( uPoolMap, vxUV );
      float vxL = ( vxP.r + vxP.g + vxP.b ) * 0.3333 + 1e-4;
      float vxH = clamp( 1.0 - ( vPoolW.y - vxP.a / vxL ) * 0.4, 0.0, 1.0 );      // above the lights: fades out over 2.5 m
      float vxF = 0.32 + 0.68 * clamp( vxN.y * 0.5 + 0.5, 0.0, 1.0 );              // up-facing 1, walls 0.66, undersides 0.32
      reflectedLight.directDiffuse += vxP.rgb * ( uPoolRect.w * vxH * vxF ) * material.diffuseColor;
    }
  }
`;

export class LightPools {
  constructor(renderer) {
    this.r = renderer;
    this.rt = new THREE.WebGLRenderTarget(RES, RES, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    this.uniforms = { uPoolMap: { value: this.rt.texture }, uPoolRect: { value: new THREE.Vector4(0, 0, 1 / 128, 0) } };
    this.size = 128; this.key = ''; this.count = -1; this.version = 0;
    const geo = this.geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uRect: { value: new THREE.Vector3() } }, vertexShader: SPLAT_VS, fragmentShader: SPLAT_FS,
      depthTest: false, depthWrite: false, transparent: true, toneMapped: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    });
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.mesh); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const U = this.uniforms;
    // one shared patch function (its identity marks a patched material)
    this.onBC = (sh) => {
      sh.uniforms.uPoolMap = U.uPoolMap; sh.uniforms.uPoolRect = U.uPoolRect;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + VS_PARS).replace('#include <project_vertex>', '#include <project_vertex>' + VS_MAIN);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>' + FS_PARS).replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>' + FS_MAIN);
    };
    this.cacheKey = () => 'vxpool1';
    this.seen = new WeakSet();
  }
  /** make a material receive the pools (built-in lit materials without their own shader patch) */
  patch(m) {
    if (!m || this.seen.has(m)) return;
    this.seen.add(m);
    if (!(m.isMeshLambertMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial || m.isMeshToonMaterial)) return;
    if (m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) return;
    m.onBeforeCompile = this.onBC; m.customProgramCacheKey = this.cacheKey; m.needsUpdate = true;
  }
  patchTree(root) { root.traverse((o) => { const m = o.material; if (!m) return; if (Array.isArray(m)) m.forEach((x) => this.patch(x)); else this.patch(m); }); }
  /** lights: [{ x, y, z, r, col: [r, g, b] (linear, × intensity), sh }] — re-splat around `target` when it moved */
  update(lights, target, gain, size = 128) {
    const U = this.uniforms.uPoolRect.value;
    if (!(gain > 0) || !lights.length) { U.w = 0; return; }
    if (lights.length !== this.count || lights.version !== this.lv) { this.count = lights.length; this.lv = lights.version; this.upload(lights); this.key = ''; }
    const tx = size / RES, x0 = Math.round((target.x - size / 2) / (tx * 4)) * tx * 4, z0 = Math.round((target.z - size / 2) / (tx * 4)) * tx * 4;
    const key = x0 + ',' + z0 + ',' + size + ',' + this.version;
    if (key !== this.key) {
      this.key = key; this.mat.uniforms.uRect.value.set(x0, z0, size);
      const r = this.r, prevRT = r.getRenderTarget(), prevAuto = r.autoClear, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
      r.setRenderTarget(this.rt); r.setClearColor(0x000000, 0); r.clear(true, false, false);
      r.autoClear = false; r.render(this.scene, this.cam);
      r.autoClear = prevAuto; r.setClearColor(cc, ca); r.setRenderTarget(prevRT);
    }
    U.set(x0, z0, 1 / size, gain);
  }
  upload(all) {
    const lights = all.filter((l) => l.r > 0), n = lights.length;
    if (!n) { this.geo.instanceCount = 0; this.version++; return; }
    const L = new Float32Array(n * 4), C = new Float32Array(n * 4);
    lights.forEach((l, i) => { L.set([l.x, l.y, l.z, l.r], i * 4); C.set([l.col[0], l.col[1], l.col[2], l.sh ?? l.y], i * 4); });
    this.geo.setAttribute('aLight', new THREE.InstancedBufferAttribute(L, 4)); this.geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(C, 4));
    this.geo.instanceCount = n; this.version++;
  }
  /** a light record from a colour (hex / Color), an intensity (pool brightness right below it) and a radius */
  static light(x, y, z, color = 0xffc070, intensity = 1, r = 9, sh) {
    const c = new THREE.Color(color);
    return { x, y, z, r, col: [c.r * intensity, c.g * intensity, c.b * intensity], sh: sh ?? Math.max(0.6, y) };
  }
}

/** merge lights that sit close together (strings of lanterns, rows of window panes) into one */
export function mergeLights(list, cell = 1.6) {
  const M = new Map();
  for (const l of list) {
    const k = Math.round(l.x / cell) + ',' + Math.round(l.y / 2) + ',' + Math.round(l.z / cell);
    const w = l.col[0] + l.col[1] + l.col[2] + 1e-6, m = M.get(k);
    if (!m) { M.set(k, { ...l, col: l.col.slice(), w }); continue; }
    const t = m.w + w;
    m.x = (m.x * m.w + l.x * w) / t; m.y = (m.y * m.w + l.y * w) / t; m.z = (m.z * m.w + l.z * w) / t; m.sh = (m.sh * m.w + l.sh * w) / t;
    for (let i = 0; i < 3; i++) m.col[i] += l.col[i] * 0.5;
    m.r = Math.max(m.r, l.r) * 1.04; m.w = t;
  }
  return [...M.values()];
}

// Halos: a soft glow sprite around each light source (lamp heads, lanterns, neon) — the light scattering
// in the night air. One additive point cloud, sized in metres, drawn into the HDR frame (so the haze, the
// tone mapping and the bloom treat it like any other light).
const HALO_VS = `attribute float aSize; uniform float uScale; uniform float uGain; varying vec3 vCol;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aSize * uScale / -mv.z, 1.0, 256.0); vCol = color * uGain; }`;
const HALO_FS = `varying vec3 vCol;
void main() { vec2 d = gl_PointCoord * 2.0 - 1.0; float r2 = dot(d, d); if (r2 >= 1.0) discard; float a = exp(-r2 * 5.0) * (1.0 - r2) + exp(-r2 * 40.0) * 0.6; gl_FragColor = vec4(vCol * a, 1.0); }`;
export class Halos {
  constructor() {
    this.geo = new THREE.BufferGeometry();
    this.mat = new THREE.ShaderMaterial({ uniforms: { uScale: { value: 500 }, uGain: { value: 0 } }, vertexShader: HALO_VS, fragmentShader: HALO_FS, vertexColors: true,
      transparent: true, depthWrite: false, depthTest: true, toneMapped: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
    this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5; this.points.visible = false;
    this.lv = -1;
  }
  update(lights, cam, H, gain) {
    if (lights.version !== this.lv || lights.length !== this.n) {
      this.lv = lights.version; this.n = lights.length;
      const hs = lights.filter((l) => l.halo > 0), P = new Float32Array(hs.length * 3), C = new Float32Array(hs.length * 3), S = new Float32Array(hs.length);
      hs.forEach((l, i) => { P.set([l.x, l.y, l.z], i * 3); const c = l.hcol || l.col, m = Math.max(c[0], c[1], c[2], 1e-4); C.set([c[0] / m, c[1] / m, c[2] / m], i * 3); S[i] = l.halo; });
      this.geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); this.geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); this.geo.setAttribute('aSize', new THREE.Float32BufferAttribute(S, 1));
      this.count = hs.length;
    }
    this.points.visible = gain > 0 && this.count > 0;
    this.mat.uniforms.uGain.value = gain; this.mat.uniforms.uScale.value = H / (2 * Math.tan((cam.fov * Math.PI) / 360));
  }
}
