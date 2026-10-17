// Anime sky + time-of-day lighting. A gradient dome with sun/moon discs,
// twinkling stars and hand-drawn puffy cloud billboards; `timeOfDay(hour)`
// returns blended light/fog/exposure presets (dawn pinks, golden hour,
// neon-blue Osaka nights).
import * as THREE from '../../vendor/three.module.js';
import { clamp01, lerp, smooth } from '../core/mathx.js';

const KEYS = [
  { h: 0, zen: '#070a24', hor: '#231f52', sun: '#8ea6ff', si: 0.55, hs: '#3a4a8f', hg: '#170f25', hi: 0.55, fog: '#141838', exp: 1.05, night: 1, glow: '#6a5aff' },
  { h: 4.6, zen: '#0d1238', hor: '#3d2f63', sun: '#8ea6ff', si: 0.5, hs: '#3f4a8a', hg: '#1c1426', hi: 0.55, fog: '#211f45', exp: 1.05, night: 0.95, glow: '#6a5aff' },
  { h: 5.8, zen: '#3a4c96', hor: '#ff9a7a', sun: '#ffb08a', si: 1.4, hs: '#a7b0ff', hg: '#6a4658', hi: 0.7, fog: '#d29aa2', exp: 1.08, night: 0.35, glow: '#ff9a6a' },
  { h: 7.5, zen: '#4f9de8', hor: '#cfe7ff', sun: '#fff1d8', si: 2.5, hs: '#cfe3ff', hg: '#8a7a62', hi: 0.8, fog: '#cfe0f2', exp: 1.0, night: 0, glow: '#fff3d0' },
  { h: 12, zen: '#3b93ee', hor: '#c2e2ff', sun: '#ffffff', si: 2.9, hs: '#d6eaff', hg: '#8f8268', hi: 0.85, fog: '#cde4fa', exp: 1.0, night: 0, glow: '#ffffff' },
  { h: 16, zen: '#4a8ce0', hor: '#ffe2bc', sun: '#ffe7c4', si: 2.6, hs: '#d8e2ff', hg: '#8a7660', hi: 0.8, fog: '#f2dcc2', exp: 1.0, night: 0, glow: '#ffe2b0' },
  { h: 17.8, zen: '#5562b8', hor: '#ff9150', sun: '#ff9a50', si: 2.0, hs: '#ffb7a0', hg: '#5a3a42', hi: 0.7, fog: '#ee9a74', exp: 1.05, night: 0.15, glow: '#ff8a40' },
  { h: 19.0, zen: '#26286a', hor: '#c6618c', sun: '#ff6c78', si: 0.85, hs: '#7a6ab8', hg: '#2c1e34', hi: 0.6, fog: '#5a3f72', exp: 1.08, night: 0.65, glow: '#ff5a9a' },
  { h: 20.3, zen: '#0b1033', hor: '#35296a', sun: '#8ea6ff', si: 0.55, hs: '#3f4b92', hg: '#191126', hi: 0.55, fog: '#1a1c42', exp: 1.05, night: 1, glow: '#6a5aff' },
  { h: 24, zen: '#070a24', hor: '#231f52', sun: '#8ea6ff', si: 0.55, hs: '#3a4a8f', hg: '#170f25', hi: 0.55, fog: '#141838', exp: 1.05, night: 1, glow: '#6a5aff' },
];
const _ca = new THREE.Color(), _cb = new THREE.Color();
function mixC(a, b, t, out) { _ca.set(a); _cb.set(b); return out.copy(_ca).lerp(_cb, t); }

export function timeOfDay(hour) {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = smooth(clamp01((h - a.h) / (b.h - a.h)));
  const o = {
    zen: mixC(a.zen, b.zen, t, new THREE.Color()), hor: mixC(a.hor, b.hor, t, new THREE.Color()),
    sun: mixC(a.sun, b.sun, t, new THREE.Color()), sunI: lerp(a.si, b.si, t),
    hemiSky: mixC(a.hs, b.hs, t, new THREE.Color()), hemiGround: mixC(a.hg, b.hg, t, new THREE.Color()), hemiI: lerp(a.hi, b.hi, t),
    fog: mixC(a.fog, b.fog, t, new THREE.Color()), exposure: lerp(a.exp, b.exp, t), night: lerp(a.night, b.night, t),
    glow: mixC(a.glow, b.glow, t, new THREE.Color()),
  };
  // sun arc: rises east (−x), sets west (+x); moon takes over at night
  const day = clamp01((h - 5.5) / 14);
  const th = day * Math.PI;
  const elev = Math.sin(th);
  o.dayArc = h > 5.5 && h < 19.6;
  if (o.dayArc) o.sunDir = new THREE.Vector3(-Math.cos(th) * 0.85, 0.22 + elev * 0.9, 0.55).normalize();
  else o.sunDir = new THREE.Vector3(0.45, 0.85, 0.35).normalize(); // moonlight
  return o;
}

const SKY_V = /* glsl */`
varying vec3 vDir;
void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_F = /* glsl */`
uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uGround; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uNight; uniform float uTime; uniform float uDay;
varying vec3 vDir;
float h3(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
void main(){
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = mix(uHor, uZen, pow(clamp(y, 0.0, 1.0), 0.55));
  col = mix(col, uGround, smoothstep(0.0, -0.25, y));
  // horizon glow band
  col += uHor * 0.25 * exp(-abs(y) * 9.0);
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  if (uDay > 0.5) {
    col += uSunCol * (pow(sd, 900.0) * 6.0 + pow(sd, 18.0) * 0.35 + pow(sd, 4.0) * 0.08);
  } else {
    col += vec3(0.85, 0.9, 1.0) * smoothstep(0.9993, 0.9996, sd) * 2.2 + vec3(0.4, 0.5, 1.0) * pow(sd, 60.0) * 0.25;
  }
  if (uNight > 0.01 && y > 0.0) {
    vec3 q = floor(d * 260.0);
    float s = h3(q);
    float tw = 0.6 + 0.4 * sin(uTime * (2.0 + s * 4.0) + s * 40.0);
    col += vec3(0.9, 0.95, 1.0) * step(0.9965, s) * tw * uNight * smoothstep(0.02, 0.25, y) * 1.4;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export class Sky {
  constructor() {
    this.uniforms = {
      uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uGround: { value: new THREE.Color(0.1, 0.1, 0.14) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uNight: { value: 0 }, uTime: { value: 0 }, uDay: { value: 1 },
    };
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ vertexShader: SKY_V, fragmentShader: SKY_F, uniforms: this.uniforms, side: THREE.BackSide, depthWrite: false, fog: false }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.clouds = new THREE.Group();
    this.group.add(this.clouds);
    this._cloudTex = null;
    this._cloudMat = null;
  }

  makeClouds(seedRand = Math.random, count = 14) {
    if (typeof document === 'undefined') return;
    if (!this._cloudTex) this._cloudTex = cloudTexture();
    this._cloudMat = new THREE.SpriteMaterial({ map: this._cloudTex, transparent: true, depthWrite: false, fog: false, color: 0xffffff });
    this.clouds.clear();
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(this._cloudMat);
      const a = seedRand() * Math.PI * 2, r = 140 + seedRand() * 120;
      s.position.set(Math.cos(a) * r, 25 + seedRand() * 60, Math.sin(a) * r);
      const sc = 50 + seedRand() * 70;
      s.scale.set(sc * 1.8, sc, 1);
      s.material = this._cloudMat;
      this.clouds.add(s);
    }
  }

  apply(tod, time) {
    const u = this.uniforms;
    u.uZen.value.copy(tod.zen); u.uHor.value.copy(tod.hor);
    u.uGround.value.copy(tod.fog).multiplyScalar(0.55);
    u.uSunDir.value.copy(tod.sunDir); u.uSunCol.value.copy(tod.sun);
    u.uNight.value = tod.night; u.uTime.value = time; u.uDay.value = tod.dayArc ? 1 : 0;
    if (this._cloudMat) {
      const c = this._cloudMat.color;
      c.copy(tod.hor).lerp(new THREE.Color(1, 1, 1), 0.55 * (1 - tod.night)).lerp(tod.zen, tod.night * 0.6);
      this._cloudMat.opacity = 0.92 - tod.night * 0.45;
    }
  }
}

function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  // flat anime cumulus: stacked circles, shaded underside, crisp pixel edge
  const blobs = [[60, 86, 34], [100, 70, 44], [150, 66, 48], [196, 84, 34], [126, 92, 40], [82, 98, 26], [176, 100, 26]];
  g.fillStyle = '#d9def0';
  for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y + 6, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#ffffff';
  for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x - 3, y - 2, r * 0.92, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#c6cce4';
  g.fillRect(24, 112, 208, 16);
  g.clearRect(0, 118, 256, 10);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter;
  return t;
}
