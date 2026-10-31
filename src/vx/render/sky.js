// The sky: a physically based daylight model (Preetham / Hosek-style analytic scattering: Rayleigh + Mie with
// turbidity), drawn as a dome that follows the camera into the HDR frame, so the close street-level camera sees
// a believable sky: deep blue at the zenith, a pale hazy horizon, the sun's bright forward-scattering glow and a
// sharp disc. Soft fbm cumulus drift overhead, lit from the sun's side. At night the scattering model is run for
// a sun well below the horizon (the last blue of twilight), with stars and a moon disc on top.
// The same dome (without the sun's disc, which would only add fireflies) is rendered once per mood into a
// prefiltered (PMREM) cube environment that glossy surfaces reflect: glass, car paint, wet ground.
import * as THREE from '../../../vendor/three.module.js';

const VS = `
uniform vec3 uSun; uniform float uRayleigh; uniform float uTurbidity; uniform float uMie;
varying vec3 vDir; varying vec3 vSunDir; varying float vSunfade; varying vec3 vBetaR; varying vec3 vBetaM; varying float vSunE;
const float e = 2.718281828459045;
const vec3 totalRayleigh = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);
const vec3 MieConst = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);
const float cutoffAngle = 1.6110731556870734;
const float steepness = 1.5;
float sunIntensity(float c) { c = clamp(c, -1.0, 1.0); return 1000.0 * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(c)) / steepness))); }
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position + cameraPosition, 1.0);
  gl_Position = p.xyww;
  vSunDir = normalize(uSun);
  vSunE = sunIntensity(vSunDir.y);
  vSunfade = min(1.0, exp(vSunDir.y * 0.89));
  vBetaR = totalRayleigh * (uRayleigh - (1.0 - vSunfade));
  vBetaM = 0.434 * (0.2 * uTurbidity) * 10E-18 * MieConst * uMie;
}`;
const FS = `
uniform float uMieG; uniform float uScale; uniform float uDisc; uniform float uNight; uniform float uClouds; uniform float uTime;
uniform vec3 uMoon; uniform vec3 uGround; uniform vec3 uNightCol;
varying vec3 vDir; varying vec3 vSunDir; varying float vSunfade; varying vec3 vBetaR; varying vec3 vBetaM; varying float vSunE;
const float pi = 3.141592653589793;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += vn(p) * a; p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
void main() {
  vec3 dir = normalize(vDir);
  float up = max(dir.y, 0.0);
  float zen = acos(up);
  float inv = 1.0 / (cos(zen) + 0.15 * pow(93.885 - zen * 180.0 / pi, -1.253));
  vec3 Fex = exp(-(vBetaR * 8.4E3 * inv + vBetaM * 1.25E3 * inv));
  float cosT = dot(dir, vSunDir);
  float rPh = 0.05968310365946075 * (1.0 + pow(cosT * 0.5 + 0.5, 2.0));
  float g2 = uMieG * uMieG, mPh = 0.07957747154594767 * (1.0 - g2) / pow(1.0 - 2.0 * uMieG * cosT + g2, 1.5);
  vec3 bt = (vBetaR * rPh + vBetaM * mPh) / (vBetaR + vBetaM);
  vec3 Lin = pow(vSunE * bt * (1.0 - Fex), vec3(1.5));
  Lin *= mix(vec3(1.0), pow(vSunE * bt * Fex, vec3(0.5)), clamp(pow(1.0 - vSunDir.y, 5.0), 0.0, 1.0));
  vec3 L0 = vec3(0.1) * Fex;
  float disc = smoothstep(0.99995, 0.999975, cosT) * uDisc;
  L0 += vSunE * 19000.0 * Fex * disc;
  vec3 col = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
  col = pow(col, vec3(1.0 / (1.2 + 1.2 * vSunfade)));
  col *= uScale;
  // night: a deep blue air glow, stars and the moon
  if (uNight > 0.0) {
    vec3 n = uNightCol * (0.35 + 0.65 * pow(1.0 - up, 3.0));
    float st = 0.0;
    if (dir.y > 0.05) { vec2 sp = vec2(atan(dir.z, dir.x) * 180.0, asin(dir.y) * 180.0); float h = h21(floor(sp)); st = step(0.9965, h) * (0.4 + 0.6 * h21(floor(sp) + 3.1)) * smoothstep(0.05, 0.3, dir.y) * 2.5; }
    float md = dot(dir, normalize(uMoon));
    vec3 moon = vec3(0.9, 0.93, 1.0) * (smoothstep(0.99985, 0.99992, md) * 6.0 + pow(max(md, 0.0), 300.0) * 0.18);
    col = mix(col, n + vec3(st) + moon, uNight);
  }
  // clouds: an fbm layer on a plane overhead, lit from the sun's side, thinning toward the horizon
  if (uClouds > 0.0 && dir.y > 0.0) {
    vec2 cp = dir.xz / (dir.y + 0.08) * 0.9 + vec2(uTime * 0.004, uTime * 0.0015);
    float d = fbm(cp * 1.3), d2 = fbm(cp * 1.3 + vSunDir.xz * 0.06);
    float cov = smoothstep(1.0 - uClouds * 0.85, 1.12 - uClouds * 0.6, d) * smoothstep(0.0, 0.18, dir.y);
    float lit = clamp(0.55 + (d - d2) * 6.0, 0.0, 1.0);
    vec3 sunC = vSunE * Fex * 0.00095 * uScale;
    vec3 base = mix(col * 0.75 + vec3(0.08) * uScale * (1.0 - uNight), sunC + col * 0.6, lit);
    col = mix(col, base, cov * 0.9);
  }
  // below the horizon: the haze over the land beyond the city
  if (dir.y < 0.0) col = mix(col, uGround, smoothstep(0.0, -0.2, dir.y));
  gl_FragColor = vec4(col, 1.0);
}`;

/** the sky's parameters for a mood (sunDir, sky: { turbidity, rayleigh, mie, g, scale, clouds, night }) */
function params(m) {
  const s = m.skyP || {};
  return { turbidity: s.turbidity ?? 3.2, rayleigh: s.rayleigh ?? 1.4, mie: s.mie ?? 0.004, g: s.g ?? 0.82, scale: s.scale ?? 1, clouds: m.clouds ?? 0.35, night: s.night ?? 0, sunElev: s.sunElev };
}

export class Sky {
  constructor() {
    this.u = {
      uSun: { value: new THREE.Vector3(0, 1, 0) }, uRayleigh: { value: 1.4 }, uTurbidity: { value: 3 }, uMie: { value: 0.004 }, uMieG: { value: 0.8 }, uScale: { value: 1 },
      uDisc: { value: 1 }, uNight: { value: 0 }, uClouds: { value: 0.35 }, uTime: { value: 0 }, uMoon: { value: new THREE.Vector3(0.3, 0.8, 0.5) }, uGround: { value: new THREE.Color(0.2, 0.2, 0.2) }, uNightCol: { value: new THREE.Color(0.004, 0.007, 0.018) },
    };
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VS, fragmentShader: FS, side: THREE.BackSide, depthWrite: false, depthTest: true, toneMapped: false, fog: false });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = -100; this.mesh.name = 'sky'; this.mesh.userData.sky = true;
    this.mesh.castShadow = this.mesh.receiveShadow = false;
    this.envCache = new Map();
  }
  setMood(m, key) {
    const p = params(m), d = new THREE.Vector3(...(m.sunDir || [0, 1, 0])).normalize(), U = this.u;
    // the night "sun" is the moon: scatter for a sun well below the horizon instead
    if (p.night > 0) { U.uMoon.value.copy(d); d.set(-0.6, p.sunElev ?? -0.08, 0.3).normalize(); }
    else if (p.sunElev !== undefined) { d.y = p.sunElev; d.normalize(); }
    U.uSun.value.copy(d); U.uRayleigh.value = p.rayleigh; U.uTurbidity.value = p.turbidity; U.uMie.value = p.mie; U.uMieG.value = p.g; U.uScale.value = p.scale;
    U.uClouds.value = p.clouds; U.uNight.value = p.night;
    U.uGround.value.set(m.fog || 0x808890).multiplyScalar(p.night ? 0.05 : 0.6 * p.scale);
    this.key = key;
  }
  /** the prefiltered environment for the current mood (rendered once per mood key, without the sun disc) */
  env(renderer) {
    if (this.key && this.envCache.has(this.key)) return this.envCache.get(this.key);
    const pm = new THREE.PMREMGenerator(renderer), sc = new THREE.Scene(), mesh = new THREE.Mesh(this.mesh.geometry, this.mat);
    mesh.frustumCulled = false; sc.add(mesh);
    const disc = this.u.uDisc.value; this.u.uDisc.value = 0;
    const prevAuto = renderer.autoClear;
    const rt = pm.fromScene(sc, 0, 0.1, 2000);
    this.u.uDisc.value = disc; renderer.autoClear = prevAuto;
    pm.dispose();
    if (this.key) this.envCache.set(this.key, rt.texture);
    return rt.texture;
  }
}
