// Pixel-art render pipeline ("3D that looks 2D"):
//   1. scene → low-res HDR target (+ depth), no MSAA, nearest sampling
//   2. bloom chain (soft, HD-2D glow)
//   3. pixel pass at low res: depth-of-field (HD-2D diorama blur), 1-px
//      outlines on the nearer object's edge (selective, hue-shifted
//      darkening), ACES + grading, ordered-dither colour quantisation
//   4. present: sharp-bilinear upscale to the canvas with sub-pixel camera
//      compensation, soft bloom, flash, speed lines, vignette, letterbox.
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
  vec3 c = q(vUv + uTexel*vec2(-0.5,-0.5)) + q(vUv + uTexel*vec2(0.5,-0.5)) + q(vUv + uTexel*vec2(-0.5,0.5)) + q(vUv + uTexel*vec2(0.5,0.5));
  c *= 0.25;
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
  o = vec4(min(c * contrib, vec3(30.0)), 1.0);
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
uniform sampler2D tSrc; uniform sampler2D tAdd; uniform vec2 uTexel;
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
  o = vec4(c / 16.0 + texture(tAdd, vUv).rgb, 1.0);
}`;

// Low-res pixel pass. Works in integer pixel coordinates (texelFetch).
const PIXEL = /* glsl */`
precision highp float;
uniform sampler2D tScene; uniform sampler2D tDepth; uniform sampler2D tBloom;
uniform vec2 uRes; uniform float uNear; uniform float uFar;
uniform float uExposure; uniform float uSat; uniform float uContrast; uniform vec3 uLift; uniform vec3 uGain;
uniform float uOutline; uniform float uOutlineK; uniform vec3 uOutlineTint;
uniform float uDofFocus; uniform float uDofRange; uniform float uDofMax; uniform float uTilt; uniform float uFocusY;
uniform float uBloomPix; uniform float uLevels; uniform float uDither; uniform float uDesat; uniform float uOrtho;
in vec2 vUv; out vec4 o;

float lin(float z){ if (uOrtho > 0.5) return uNear + z * (uFar - uNear); float n = z * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - n * (uFar - uNear)); }
float depthAt(ivec2 p){ p = clamp(p, ivec2(0), ivec2(uRes) - 1); return lin(texelFetch(tDepth, p, 0).r); }
vec3 colAt(ivec2 p){ p = clamp(p, ivec2(0), ivec2(uRes) - 1); return texelFetch(tScene, p, 0).rgb; }
vec3 aces(vec3 x){ const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0); }
float bayer4(ivec2 p){
  int x = p.x & 3, y = p.y & 3;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[y * 4 + x]) + 0.5) / 16.0 - 0.5;
}
const vec2 DISK[12] = vec2[12](vec2(1.0,0.0), vec2(0.5,0.866), vec2(-0.5,0.866), vec2(-1.0,0.0), vec2(-0.5,-0.866), vec2(0.5,-0.866),
  vec2(1.732,1.0), vec2(0.0,2.0), vec2(-1.732,1.0), vec2(-1.732,-1.0), vec2(0.0,-2.0), vec2(1.732,-1.0));

void main(){
  ivec2 p = ivec2(gl_FragCoord.xy);
  float d0 = depthAt(p);
  vec3 col = colAt(p);
  // ---- HD-2D depth of field (focal depth + tilt band), blurred in pixel space
  float coc = 0.0;
  if (uDofRange > 0.0) coc = clamp(abs(d0 - uDofFocus) / uDofRange - 0.25, 0.0, 1.0);
  if (uTilt > 0.0) coc = max(coc, smoothstep(0.22, 0.62, abs(vUv.y - uFocusY)) * uTilt);
  coc *= uDofMax;
  if (coc > 0.35) {
    vec3 acc = col; float w = 1.0;
    float r = coc;
    for (int i = 0; i < 12; i++) {
      vec2 off = DISK[i] * r * (i < 6 ? 0.55 : 0.5);
      ivec2 q = p + ivec2(floor(off + 0.5));
      float dq = depthAt(q);
      // don't let sharp foreground bleed into blurred background
      float wq = dq < d0 - 1.5 && abs(dq - uDofFocus) < uDofRange * 0.3 ? 0.15 : 1.0;
      acc += colAt(q) * wq; w += wq;
    }
    col = acc / w;
  }
  // ---- 1-px outlines on the nearer side of depth discontinuities (slope-corrected)
  float edge = 0.0;
  if (uOutline > 0.0) {
    float dl = depthAt(p + ivec2(-1, 0)), dr = depthAt(p + ivec2(1, 0)), dd = depthAt(p + ivec2(0, -1)), du = depthAt(p + ivec2(0, 1));
    float ex = max((dl - d0) - max(0.0, d0 - dr), (dr - d0) - max(0.0, d0 - dl));
    float ey = max((dd - d0) - max(0.0, d0 - du), (du - d0) - max(0.0, d0 - dd));
    float thr = 0.06 + d0 * uOutlineK;
    edge = step(thr, max(ex, ey));
    edge *= 1.0 - smoothstep(uFar * 0.5, uFar * 0.85, d0);
    edge *= 1.0 - clamp(coc / max(uDofMax, 1e-3) * 1.4, 0.0, 1.0);
  }
  // ---- tone & grade (linear HDR → display)
  col *= uExposure;
  col = aces(col);
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, uSat * (1.0 - uDesat));
  col = (col - 0.5) * uContrast + 0.5;
  col = col * uGain + uLift * (1.0 - col);
  col = clamp(col, 0.0, 1.0);
  // selective outline: darker, hue-shifted version of the object's own colour
  if (edge > 0.0) col = mix(col, col * col * uOutlineTint, uOutline);
  // sRGB encode, then quantise with ordered dither (pixel-art colour steps)
  col = mix(col * 12.92, 1.055 * pow(col, vec3(1.0/2.4)) - 0.055, step(0.0031308, col));
  if (uLevels > 1.0) col = floor(col * uLevels + 0.5 + bayer4(p) * uDither) / uLevels;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// Present: sharp-bilinear upscale + overlays (full canvas resolution).
const PRESENT = /* glsl */`
precision highp float;
uniform sampler2D tPix; uniform sampler2D tBloom; uniform vec2 uRes; uniform vec2 uOffset;
uniform float uBloom; uniform float uVignette; uniform float uAspect; uniform float uTime;
uniform float uLetter; uniform float uFlash; uniform vec3 uFlashColor; uniform float uChroma; uniform float uSpeed; uniform vec2 uSpeedCenter;
in vec2 vUv; out vec4 o;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 toLin(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
vec3 sharp(vec2 uv){
  vec2 t = uv * uRes;
  vec2 seam = floor(t + 0.5);
  vec2 dudv = max(fwidth(t), vec2(1e-4));
  t = seam + clamp((t - seam) / dudv, -0.5, 0.5);
  return texture(tPix, t / uRes).rgb;
}
void main(){
  vec2 uv = vUv + uOffset / uRes;
  vec3 col;
  if (uChroma > 0.0) { vec2 dir = (uv - 0.5) * uChroma * 0.01; col = vec3(sharp(uv + dir).r, sharp(uv).g, sharp(uv - dir).b); }
  else col = sharp(uv);
  // soft HD-2D bloom over the crisp pixels (work in linear)
  vec3 lc = toLin(col);
  vec3 b = texture(tBloom, uv).rgb;
  lc += b * uBloom * 0.6 / (1.0 + b * 0.35);
  if (uSpeed > 0.0) {
    vec2 q = uv - uSpeedCenter; q.x *= uAspect;
    float a = atan(q.y, q.x), r = length(q);
    float n = h12(vec2(floor(a * 64.0), floor(uTime * 16.0)));
    float line = step(0.82, n) * smoothstep(0.2, 0.78, r);
    lc = mix(lc, vec3(1.0), line * uSpeed * 0.7);
  }
  vec2 vv = (vUv - 0.5) * vec2(uAspect, 1.0);
  lc *= 1.0 - uVignette * smoothstep(0.4, 1.1, length(vv));
  lc = mix(lc, uFlashColor, uFlash);
  col = toSrgb(clamp(lc, 0.0, 1.0));
  if (uLetter > 0.0) { float bb = uLetter * 0.12; if (vUv.y < bb || vUv.y > 1.0 - bb) col = vec3(0.0); }
  o = vec4(col, 1.0);
}`;

function pass(frag, uniforms) {
  return new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
}

export class PixelPost {
  constructor(renderer, opts = {}) {
    this.r = renderer;
    this.pixelH = opts.pixelH || 320;           // target vertical resolution in "art pixels"
    this.levels = opts.levels ?? 4;
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.mPre = pass(PREFILTER, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1.0 }, uKnee: { value: 0.6 } });
    this.mDown = pass(DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.mUp = pass(UP, { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() } });
    // uniform names mirror the old Post so gameplay code keeps working
    this.u = {
      tScene: { value: null }, tDepth: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2(1, 1) },
      uNear: { value: 0.1 }, uFar: { value: 200 }, uOrtho: { value: 0 },
      uExposure: { value: 1.0 }, uSat: { value: 1.14 }, uContrast: { value: 1.05 },
      uLift: { value: new THREE.Vector3(0.012, 0.0, 0.035) }, uGain: { value: new THREE.Vector3(1, 0.99, 0.97) },
      uOutline: { value: 0.82 }, uOutlineK: { value: 0.022 }, uOutlineTint: { value: new THREE.Vector3(0.55, 0.42, 0.62) },
      uDofFocus: { value: 20 }, uDofRange: { value: 0 }, uDofMax: { value: 3.2 }, uTilt: { value: 0 }, uFocusY: { value: 0.5 },
      uBloomPix: { value: 0 }, uLevels: { value: 48 }, uDither: { value: 0.85 }, uDesat: { value: 0 },
    };
    this.p = {
      tPix: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uOffset: { value: new THREE.Vector2() },
      uBloom: { value: 0.7 }, uVignette: { value: 0.28 }, uAspect: { value: 1 }, uTime: { value: 0 },
      uLetter: { value: 0 }, uFlash: { value: 0 }, uFlashColor: { value: new THREE.Vector3(1, 1, 1) }, uChroma: { value: 0 }, uSpeed: { value: 0 }, uSpeedCenter: { value: new THREE.Vector2(0.5, 0.5) },
    };
    // proxy the legacy names used by Gfx.frame onto the present pass
    for (const k of ['uBloom', 'uLetter', 'uFlash', 'uFlashColor', 'uChroma', 'uSpeed', 'uSpeedCenter', 'uVignette', 'uTime']) this.u[k] = this.p[k];
    this.u.uGrain = { value: 0 }; this.u.uTexel = { value: new THREE.Vector2() }; this.u.uAspect = this.p.uAspect;
    this.mPix = pass(PIXEL, this.u);
    this.mPresent = pass(PRESENT, this.p);
    this.w = 1; this.h = 1; this.lw = 1; this.lh = 1;
    this.down = []; this.up = [];
    this.bloomLevels = opts.bloomLevels ?? 4;
  }

  // w,h: drawing-buffer size of the canvas (device pixels)
  setSize(w, h) {
    this.w = w; this.h = h;
    const lh = Math.max(120, Math.min(this.pixelH, Math.round(h / 1.5)));
    const lw = Math.max(64, Math.round(lh * (w / h)));
    this.lw = lw; this.lh = lh;
    for (const t of [this.main, this.pix, ...this.down, ...this.up]) if (t) t.dispose();
    const dt = new THREE.DepthTexture(lw, lh);
    dt.type = THREE.UnsignedIntType;
    this.main = new THREE.WebGLRenderTarget(lw, lh, { type: THREE.HalfFloatType, depthTexture: dt, depthBuffer: true });
    this.main.texture.minFilter = this.main.texture.magFilter = THREE.NearestFilter;
    this.main.texture.generateMipmaps = false;
    this.pix = new THREE.WebGLRenderTarget(lw, lh, { type: THREE.UnsignedByteType, depthBuffer: false });
    this.pix.texture.minFilter = this.pix.texture.magFilter = THREE.LinearFilter;
    this.pix.texture.generateMipmaps = false;
    this.down = []; this.up = [];
    let cw = Math.max(1, lw >> 1), ch = Math.max(1, lh >> 1);
    for (let i = 0; i < this.bloomLevels; i++) {
      const mk = () => { const t = new THREE.WebGLRenderTarget(cw, ch, { type: THREE.HalfFloatType, depthBuffer: false }); t.texture.minFilter = t.texture.magFilter = THREE.LinearFilter; t.texture.generateMipmaps = false; return t; };
      this.down.push(mk()); this.up.push(mk());
      cw = Math.max(1, cw >> 1); ch = Math.max(1, ch >> 1);
    }
    this.u.uRes.value.set(lw, lh);
    this.p.uRes.value.set(lw, lh);
    this.p.uAspect.value = w / h;
  }
  // size of one art pixel in world units at distance `dist` for this camera
  worldPerPixel(camera, dist) {
    if (camera.isOrthographicCamera) return (camera.top - camera.bottom) / camera.zoom / this.lh;
    return (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / this.lh;
  }

  _blit(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.qScene, this.qCam); }

  render(scene, camera, time = 0) {
    const r = this.r;
    r.setRenderTarget(this.main);
    r.clear();
    r.render(scene, camera);
    // bloom (soft, from the low-res HDR scene)
    const d = this.down, u = this.up;
    this.mPre.uniforms.tSrc.value = this.main.texture;
    this.mPre.uniforms.uTexel.value.set(1 / this.lw, 1 / this.lh);
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
      this._blit(this.mUp, u[i]);
      src = u[i];
    }
    // pixel pass
    const U = this.u;
    U.tScene.value = this.main.texture; U.tDepth.value = this.main.depthTexture; U.tBloom.value = src.texture;
    U.uNear.value = camera.near; U.uFar.value = camera.far; U.uOrtho.value = camera.isOrthographicCamera ? 1 : 0;
    this._blit(this.mPix, this.pix);
    // present
    this.p.tPix.value = this.pix.texture; this.p.tBloom.value = src.texture; this.p.uTime.value = time;
    this._blit(this.mPresent, null);
  }

  dispose() {
    for (const t of [this.main, this.pix, ...this.down, ...this.up]) if (t) t.dispose();
    [this.mPre, this.mDown, this.mUp, this.mPix, this.mPresent].forEach((m) => m.dispose());
  }
}
