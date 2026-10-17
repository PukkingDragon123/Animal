// Custom HDR post pipeline (WebGL2): scene → MSAA half-float target with depth
// → bloom (threshold + dual-filter mip chain) → composite: anime depth
// outlines, tilt-shift DOF, ACES, grading, vignette, grain, chromatic
// aberration, radial speed lines, flash, letterbox → screen (sRGB).
import * as THREE from '../../vendor/three.module.js';

const VERT = /* glsl */`
precision highp float;
in vec3 position; in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const PREFILTER = /* glsl */`
precision highp float;
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold; uniform float uKnee;
in vec2 vUv; out vec4 o;
vec3 q(vec2 uv){ return texture(tSrc, uv).rgb; }
void main(){
  vec3 c = q(vUv + uTexel*vec2(-1.,-1.)) + q(vUv + uTexel*vec2(1.,-1.)) + q(vUv + uTexel*vec2(-1.,1.)) + q(vUv + uTexel*vec2(1.,1.));
  c *= 0.25;
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
  o = vec4(min(c * contrib, vec3(40.0)), 1.0);
}`;

const DOWN = /* glsl */`
precision highp float;
uniform sampler2D tSrc; uniform vec2 uTexel;
in vec2 vUv; out vec4 o;
void main(){
  vec3 c = texture(tSrc, vUv).rgb * 4.0;
  c += texture(tSrc, vUv + uTexel*vec2(-1.,-1.)).rgb;
  c += texture(tSrc, vUv + uTexel*vec2( 1.,-1.)).rgb;
  c += texture(tSrc, vUv + uTexel*vec2(-1., 1.)).rgb;
  c += texture(tSrc, vUv + uTexel*vec2( 1., 1.)).rgb;
  o = vec4(c / 8.0, 1.0);
}`;

const UP = /* glsl */`
precision highp float;
uniform sampler2D tSrc; uniform sampler2D tAdd; uniform vec2 uTexel; uniform float uMix;
in vec2 vUv; out vec4 o;
void main(){
  vec3 c = vec3(0.0);
  c += texture(tSrc, vUv + uTexel*vec2(-1.,-1.)).rgb;
  c += texture(tSrc, vUv + uTexel*vec2( 0.,-1.)).rgb * 2.0;
  c += texture(tSrc, vUv + uTexel*vec2( 1.,-1.)).rgb;
  c += texture(tSrc, vUv + uTexel*vec2(-1., 0.)).rgb * 2.0;
  c += texture(tSrc, vUv).rgb * 4.0;
  c += texture(tSrc, vUv + uTexel*vec2( 1., 0.)).rgb * 2.0;
  c += texture(tSrc, vUv + uTexel*vec2(-1., 1.)).rgb;
  c += texture(tSrc, vUv + uTexel*vec2( 0., 1.)).rgb * 2.0;
  c += texture(tSrc, vUv + uTexel*vec2( 1., 1.)).rgb;
  o = vec4(c / 16.0 * uMix + texture(tAdd, vUv).rgb, 1.0);
}`;

const COMPOSITE = /* glsl */`
precision highp float;
uniform sampler2D tScene; uniform sampler2D tDepth; uniform sampler2D tBloom;
uniform vec2 uTexel; uniform float uNear; uniform float uFar;
uniform float uBloom; uniform float uExposure; uniform float uSat; uniform float uContrast;
uniform vec3 uLift; uniform vec3 uGain; uniform float uVignette; uniform float uGrain; uniform float uTime;
uniform float uOutline; uniform vec3 uOutlineColor; uniform float uOutlineDepthK;
uniform float uTilt; uniform float uFocusY; uniform float uFocusBand; uniform float uDofDepth; uniform float uDofRange;
uniform float uLetter; uniform float uFlash; uniform vec3 uFlashColor; uniform float uChroma; uniform float uSpeed; uniform vec2 uSpeedCenter;
uniform float uAspect; uniform float uDesat;
in vec2 vUv; out vec4 o;

float linDepth(vec2 uv){ float z = texture(tDepth, uv).r * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
vec3 aces(vec3 x){ const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0); }
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }

const vec2 PD[12] = vec2[12](vec2(-0.326,-0.406), vec2(-0.840,-0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621), vec2(0.962,-0.195), vec2(0.473,-0.480),
  vec2(0.519, 0.767), vec2(0.185,-0.893), vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322,-0.933), vec2(-0.792,-0.598));

void main(){
  vec2 uv = vUv;
  vec3 col;
  float dC = linDepth(uv);
  // depth of field: tilt-shift band (screen y) and/or focal depth
  float blur = 0.0;
  if (uTilt > 0.0) blur = max(blur, smoothstep(uFocusBand, uFocusBand + 0.35, abs(uv.y - uFocusY)) * uTilt);
  if (uDofRange > 0.0) blur = max(blur, clamp(abs(dC - uDofDepth) / uDofRange - 0.15, 0.0, 1.0));
  if (uChroma > 0.0) {
    vec2 dir = (uv - 0.5) * uChroma * 0.012;
    col = vec3(texture(tScene, uv + dir).r, texture(tScene, uv).g, texture(tScene, uv - dir).b);
  } else col = texture(tScene, uv).rgb;
  if (blur > 0.02) {
    vec3 acc = col; float wsum = 1.0;
    float rad = blur * 7.0;
    for (int i = 0; i < 12; i++) { vec2 o2 = PD[i] * uTexel * rad; acc += texture(tScene, uv + o2).rgb; wsum += 1.0; }
    col = acc / wsum;
  }
  // anime outlines from depth discontinuities
  if (uOutline > 0.0) {
    vec2 t = uTexel * uOutline;
    float d1 = linDepth(uv + vec2(t.x, 0.0)), d2 = linDepth(uv - vec2(t.x, 0.0));
    float d3 = linDepth(uv + vec2(0.0, t.y)), d4 = linDepth(uv - vec2(0.0, t.y));
    float dmax = max(max(d1 - dC, d2 - dC), max(d3 - dC, d4 - dC));
    float thr = 0.06 + dC * uOutlineDepthK;
    float edge = smoothstep(thr, thr * 1.6, dmax);
    edge *= 1.0 - smoothstep(uFar * 0.55, uFar * 0.9, dC);
    col = mix(col, col * uOutlineColor, edge * 0.85);
  }
  col += texture(tBloom, uv).rgb * uBloom;
  col *= uExposure;
  col = aces(col);
  // grading
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, uSat * (1.0 - uDesat));
  col = (col - 0.5) * uContrast + 0.5;
  col = col * uGain + uLift * (1.0 - col);
  // speed lines (anime ultimate / impact frames)
  if (uSpeed > 0.0) {
    vec2 p = uv - uSpeedCenter; p.x *= uAspect;
    float a = atan(p.y, p.x), r = length(p);
    float n = h12(vec2(floor(a * 70.0), floor(uTime * 18.0)));
    float line = step(0.82, n) * smoothstep(0.18, 0.75, r);
    col = mix(col, vec3(1.0), line * uSpeed * 0.75);
  }
  // vignette + grain
  vec2 vv = (uv - 0.5) * vec2(uAspect, 1.0);
  col *= 1.0 - uVignette * smoothstep(0.35, 1.05, length(vv));
  col += (h12(uv * 1024.0 + fract(uTime) * 91.0) - 0.5) * uGrain;
  col = mix(col, uFlashColor, uFlash);
  col = clamp(col, 0.0, 1.0);
  // letterbox
  if (uLetter > 0.0) { float b = uLetter * 0.12; if (uv.y < b || uv.y > 1.0 - b) col = vec3(0.0); }
  o = vec4(srgb(col), 1.0);
}`;

function pass(frag, uniforms) {
  return new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
}

export class Post {
  constructor(renderer, opts = {}) {
    this.r = renderer;
    this.levels = opts.levels ?? 5;
    this.msaa = opts.msaa ?? 4;
    this.enabled = true;
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.mPre = pass(PREFILTER, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1.0 }, uKnee: { value: 0.5 } });
    this.mDown = pass(DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.mUp = pass(UP, { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() }, uMix: { value: 1 } });
    this.u = {
      tScene: { value: null }, tDepth: { value: null }, tBloom: { value: null }, uTexel: { value: new THREE.Vector2() },
      uNear: { value: 0.1 }, uFar: { value: 200 }, uBloom: { value: 0.7 }, uExposure: { value: 1.0 }, uSat: { value: 1.12 }, uContrast: { value: 1.04 },
      uLift: { value: new THREE.Vector3(0.0, 0.0, 0.02) }, uGain: { value: new THREE.Vector3(1, 1, 1) }, uVignette: { value: 0.32 }, uGrain: { value: 0.018 }, uTime: { value: 0 },
      uOutline: { value: 1.0 }, uOutlineColor: { value: new THREE.Vector3(0.18, 0.12, 0.22) }, uOutlineDepthK: { value: 0.012 },
      uTilt: { value: 0 }, uFocusY: { value: 0.5 }, uFocusBand: { value: 0.18 }, uDofDepth: { value: 10 }, uDofRange: { value: 0 },
      uLetter: { value: 0 }, uFlash: { value: 0 }, uFlashColor: { value: new THREE.Vector3(1, 1, 1) }, uChroma: { value: 0 }, uSpeed: { value: 0 }, uSpeedCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uAspect: { value: 1 }, uDesat: { value: 0 },
    };
    this.mComp = pass(COMPOSITE, this.u);
    this.w = 1; this.h = 1;
    this.down = []; this.up = [];
  }

  setSize(w, h) {
    this.w = w; this.h = h;
    if (this.main) this.main.dispose();
    for (const t of this.down) t.dispose(); for (const t of this.up) t.dispose();
    const dt = new THREE.DepthTexture(w, h);
    dt.type = THREE.UnsignedIntType;
    this.main = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: this.msaa, depthTexture: dt, depthBuffer: true });
    this.main.texture.minFilter = THREE.LinearFilter; this.main.texture.magFilter = THREE.LinearFilter; this.main.texture.generateMipmaps = false;
    this.down = []; this.up = [];
    let cw = Math.max(1, w >> 1), ch = Math.max(1, h >> 1);
    for (let i = 0; i < this.levels; i++) {
      const mk = () => { const t = new THREE.WebGLRenderTarget(cw, ch, { type: THREE.HalfFloatType, depthBuffer: false }); t.texture.minFilter = t.texture.magFilter = THREE.LinearFilter; t.texture.generateMipmaps = false; return t; };
      this.down.push(mk()); this.up.push(mk());
      cw = Math.max(1, cw >> 1); ch = Math.max(1, ch >> 1);
    }
    this.u.uTexel.value.set(1 / w, 1 / h);
    this.u.uAspect.value = w / h;
  }

  _blit(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.qScene, this.qCam); }

  render(scene, camera, time = 0) {
    const r = this.r;
    r.setRenderTarget(this.main);
    r.clear();
    r.render(scene, camera);
    // bloom
    const d = this.down, u = this.up;
    this.mPre.uniforms.tSrc.value = this.main.texture;
    this.mPre.uniforms.uTexel.value.set(1 / this.w, 1 / this.h);
    this._blit(this.mPre, d[0]);
    for (let i = 1; i < d.length; i++) {
      this.mDown.uniforms.tSrc.value = d[i - 1].texture;
      this.mDown.uniforms.uTexel.value.set(1 / d[i - 1].width, 1 / d[i - 1].height);
      this._blit(this.mDown, d[i]);
    }
    let src = d[d.length - 1];
    for (let i = d.length - 2; i >= 0; i--) {
      this.mUp.uniforms.tSrc.value = src.texture;
      this.mUp.uniforms.tAdd.value = d[i].texture;
      this.mUp.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      this.mUp.uniforms.uMix.value = 1.0;
      this._blit(this.mUp, u[i]);
      src = u[i];
    }
    // composite
    const U = this.u;
    U.tScene.value = this.main.texture; U.tDepth.value = this.main.depthTexture; U.tBloom.value = src.texture;
    U.uNear.value = camera.near; U.uFar.value = camera.far; U.uTime.value = time;
    this._blit(this.mComp, null);
  }

  dispose() {
    if (this.main) this.main.dispose();
    for (const t of this.down) t.dispose(); for (const t of this.up) t.dispose();
    [this.mPre, this.mDown, this.mUp, this.mComp].forEach((m) => m.dispose());
  }
}
