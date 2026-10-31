// The stage's HD frame, all in the stage's own WebGL context (no second canvas, no frame copy):
//  1. the scene renders into a linear HDR target (MSAA on desktop) with a depth texture;
//  2. ambient occlusion (scalable ambient obscurance, spiral taps) at reduced resolution from the depth, with
//     normals rebuilt from the depth, then a depth-aware blur — contact shadow in creases, at the feet of walls
//     and under everything that stands on the ground;
//  3. bloom: a soft-knee bright pass at quarter resolution and a wider eighth-resolution level (four small blurs);
//  4. the final pass: occlusion, aerial perspective (distance haze tinted to the sky, thicker near the ground),
//     bloom, exposure, AgX filmic tone mapping, a neutral grade (white balance, saturation, gentle contrast,
//     a light vignette) and the sRGB transfer;
//  5. FXAA when the HDR target has no MSAA (lite / phones).
// The old screen-space ink outline is kept only for the dialogue portraits (inkPass); the world wears none.
import * as THREE from '../../../vendor/three.module.js';

const VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const COMMON = `
#include <packing>
uniform sampler2D tDepth; uniform mat4 uProjInv;
vec3 viewPos(vec2 uv) { float d = texture2D(tDepth, uv).x; vec4 v = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return v.xyz / v.w; }
`;
const AO_FS = `
varying vec2 vUv; uniform vec2 uTexel; uniform float uRadius; uniform float uProjY; uniform float uAspect; uniform float uBias; uniform float uStrength;
${COMMON}
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  float d = texture2D(tDepth, vUv).x;
  if (d >= 1.0) { gl_FragColor = vec4(1.0); return; }
  vec3 P = viewPos(vUv);
  vec3 pr = viewPos(vUv + vec2(uTexel.x, 0.0)), pl = viewPos(vUv - vec2(uTexel.x, 0.0)), pu = viewPos(vUv + vec2(0.0, uTexel.y)), pd = viewPos(vUv - vec2(0.0, uTexel.y));
  vec3 dx = abs(pr.z - P.z) < abs(P.z - pl.z) ? pr - P : P - pl;
  vec3 dy = abs(pu.z - P.z) < abs(P.z - pd.z) ? pu - P : P - pd;
  vec3 N = normalize(cross(dx, dy));
  float rs = uRadius * uProjY * 0.5 / -P.z;
  float a0 = ign(gl_FragCoord.xy) * 6.2831853, occ = 0.0, r2 = uRadius * uRadius;
  for (int i = 0; i < SAMPLES; i++) {
    float t = (float(i) + 0.5) / float(SAMPLES), a = a0 + float(i) * 2.3999632;
    vec2 off = vec2(cos(a) * uAspect, sin(a)) * (rs * sqrt(t));
    vec3 v = viewPos(vUv + off) - P;
    float vv = dot(v, v), vn = dot(v, N);
    occ += max(0.0, 1.0 - vv / r2) * max(0.0, vn * inversesqrt(vv + 1e-4) - uBias);
  }
  gl_FragColor = vec4(vec3(clamp(1.0 - occ / float(SAMPLES) * uStrength, 0.0, 1.0)), 1.0);
}`;
const AOBLUR_FS = `varying vec2 vUv; uniform sampler2D tAO; uniform vec2 uDir; uniform vec2 uNF;
${COMMON}
float lz(vec2 uv) { float d = texture2D(tDepth, uv).x; return d >= 1.0 ? 1e5 : -perspectiveDepthToViewZ(d, uNF.x, uNF.y); }
void main() {
  float z = lz(vUv), s = 0.0, w = 0.0;
  for (int i = -3; i <= 3; i++) {
    vec2 uv = vUv + uDir * float(i);
    float k = exp(-float(i * i) / 8.0) * max(0.0, 1.0 - abs(lz(uv) - z) / (z * 0.03));
    s += texture2D(tAO, uv).r * k; w += k;
  }
  gl_FragColor = vec4(vec3(w > 0.0 ? s / w : 1.0), 1.0);
}`;
// bright pass with a 4-tap box downsample (the source is linear-filtered: 16 texels per output texel at 1/4)
const BRIGHT_FS = `varying vec2 vUv; uniform sampler2D tColor; uniform vec2 uTexel; uniform float uTh; uniform float uKnee; uniform float uExp;
void main() {
  vec3 c = (texture2D(tColor, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tColor, vUv + uTexel * vec2(1.0, -1.0)).rgb + texture2D(tColor, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tColor, vUv + uTexel * vec2(1.0, 1.0)).rgb) * 0.25 * uExp;
  c = min(c, vec3(60.0));
  float l = max(c.r, max(c.g, c.b));
  float s = clamp(l - uTh + uKnee, 0.0, 2.0 * uKnee); s = s * s / (4.0 * uKnee + 1e-4);
  gl_FragColor = vec4(c * max(s, l - uTh) / max(l, 1e-4), 1.0);
}`;
const BLUR_FS = `varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uDir;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270;
  c += (texture2D(tSrc, vUv + uDir * 1.3846154).rgb + texture2D(tSrc, vUv - uDir * 1.3846154).rgb) * 0.3162162;
  c += (texture2D(tSrc, vUv + uDir * 3.2307692).rgb + texture2D(tSrc, vUv - uDir * 3.2307692).rgb) * 0.0702703;
  gl_FragColor = vec4(c, 1.0);
}`;
// three's tone mapping functions, with our own exposure uniform (the pass writes its own sRGB)
const TONE = THREE.ShaderChunk.tonemapping_pars_fragment.replace(/toneMappingExposure/g, 'uExposure');
const FINAL_FS = `varying vec2 vUv; uniform sampler2D tColor; uniform sampler2D tAO; uniform sampler2D tB4; uniform sampler2D tB8; uniform float uAO; uniform vec2 uNF;
uniform mat4 uCamWorld; uniform vec3 uHaze; uniform vec4 uHazeP; uniform float uHazeY;
uniform float uBloom; uniform float uSat; uniform float uCon; uniform float uVig; uniform vec3 uWB; uniform float uLift; uniform vec2 uAspect; uniform float uTime; uniform float uDebug;
${COMMON}
${TONE}
float h12(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 col = texture2D(tColor, vUv).rgb;
  float d = texture2D(tDepth, vUv).x;
  if (d < 1.0) {
    vec3 vp = viewPos(vUv); float dist = length(vp);
    float ao = texture2D(tAO, vUv).r;
    col *= mix(1.0, ao, uAO);
    if (uDebug > 0.5) col = vec3(ao * 0.5);
    // aerial perspective: in-scatter toward the sky's horizon colour with distance, more near the ground
    vec3 wp = (uCamWorld * vec4(vp, 1.0)).xyz;
    float hz = 1.0 - exp(-max(dist - uHazeP.x, 0.0) * uHazeP.y);
    float hh = exp(-max(wp.y - uHazeY, 0.0) * uHazeP.w);
    col = mix(col, uHaze, clamp(hz * (0.5 + 0.5 * hh), 0.0, 1.0) * uHazeP.z);
  }
  col += (texture2D(tB4, vUv).rgb * 0.6 + texture2D(tB8, vUv).rgb * 0.4) * uBloom;
  col *= uWB;
  col = TONE_FN(col);
  // grade (display-referred, gentle): saturation, a soft S-curve around mid grey, lift, vignette
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(l), col, uSat), 0.0);
  vec3 cc = clamp(col, 0.0, 1.0);
  col = mix(col, cc * cc * (3.0 - 2.0 * cc), uCon);
  col = col * (1.0 - uLift) + uLift;
  vec2 q = (vUv - 0.5) * uAspect;
  col *= mix(1.0, smoothstep(1.1, 0.3, length(q)), uVig);
  col = sRGBTransferOETF(vec4(col, 1.0)).rgb;
  col += (h12(vUv * 1000.0 + uTime) - 0.5) / 255.0;          // dither away banding
  #ifdef FXAA_OUT
  gl_FragColor = vec4(col, dot(col, vec3(0.299, 0.587, 0.114)));
  #else
  gl_FragColor = vec4(col, 1.0);
  #endif
}`;
// FXAA 3.11 (quality preset ~12), luma in alpha
const FXAA_FS = `varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel;
float L(vec2 p) { return texture2D(tSrc, p).a; }
void main() {
  vec2 p = vUv; vec4 rgbM = texture2D(tSrc, p); float lM = rgbM.a;
  float lN = L(p + vec2(0.0, uTexel.y)), lS = L(p - vec2(0.0, uTexel.y)), lE = L(p + vec2(uTexel.x, 0.0)), lW = L(p - vec2(uTexel.x, 0.0));
  float mx = max(max(lN, lS), max(max(lE, lW), lM)), mn = min(min(lN, lS), min(min(lE, lW), lM)), rng = mx - mn;
  if (rng < max(0.0312, mx * 0.125)) { gl_FragColor = vec4(rgbM.rgb, 1.0); return; }
  float lNW = L(p + vec2(-uTexel.x, uTexel.y)), lNE = L(p + uTexel), lSW = L(p - uTexel), lSE = L(p + vec2(uTexel.x, -uTexel.y));
  float edgeH = abs(lNW + lNE - 2.0 * lN) + 2.0 * abs(lW + lE - 2.0 * lM) + abs(lSW + lSE - 2.0 * lS);
  float edgeV = abs(lNW + lSW - 2.0 * lW) + 2.0 * abs(lN + lS - 2.0 * lM) + abs(lNE + lSE - 2.0 * lE);
  bool hor = edgeH >= edgeV;
  float l1 = hor ? lS : lW, l2 = hor ? lN : lE;
  float g1 = abs(l1 - lM), g2 = abs(l2 - lM);
  float step = hor ? uTexel.y : uTexel.x;
  float lLocal; float gs;
  if (g1 >= g2) { step = -step; lLocal = 0.5 * (l1 + lM); gs = g1; } else { lLocal = 0.5 * (l2 + lM); gs = g2; }
  vec2 cur = p; if (hor) cur.y += step * 0.5; else cur.x += step * 0.5;
  vec2 off = hor ? vec2(uTexel.x, 0.0) : vec2(0.0, uTexel.y);
  vec2 p1 = cur - off, p2 = cur + off;
  float e1 = L(p1) - lLocal, e2 = L(p2) - lLocal; bool d1 = abs(e1) >= gs * 0.25, d2 = abs(e2) >= gs * 0.25;
  for (int i = 0; i < 8; i++) {
    if (d1 && d2) break;
    float s = i < 3 ? 1.0 : (i < 6 ? 1.5 : 3.0);
    if (!d1) { p1 -= off * s; e1 = L(p1) - lLocal; d1 = abs(e1) >= gs * 0.25; }
    if (!d2) { p2 += off * s; e2 = L(p2) - lLocal; d2 = abs(e2) >= gs * 0.25; }
  }
  float dst1 = hor ? p.x - p1.x : p.y - p1.y, dst2 = hor ? p2.x - p.x : p2.y - p.y;
  bool near1 = dst1 < dst2; float dst = min(dst1, dst2), len = dst1 + dst2;
  float pixOff = -dst / len + 0.5;
  bool good = ((near1 ? e1 : e2) < 0.0) != (lM < lLocal);
  float fin = good ? pixOff : 0.0;
  float lA = (2.0 * (lN + lS + lE + lW) + lNW + lNE + lSW + lSE) / 12.0;
  float sub = clamp(abs(lA - lM) / rng, 0.0, 1.0); sub = (-2.0 * sub + 3.0) * sub * sub; sub = sub * sub * 0.75;
  fin = max(fin, sub);
  vec2 fp = p; if (hor) fp.y += fin * step; else fp.x += fin * step;
  gl_FragColor = vec4(texture2D(tSrc, fp).rgb, 1.0);
}`;
// the ink alone over a finished colour target (dialogue portraits): silhouettes from the depth, alpha kept
const INKONLY_FS = `varying vec2 vUv; uniform sampler2D tColor; uniform vec2 uTexel; uniform vec2 uNF; uniform vec3 uInk; uniform float uInkA; uniform float uInkW; uniform vec4 uInkP;
${COMMON}
float iz(vec2 uv) { float d = texture2D(tDepth, uv).x; return d >= 1.0 ? 0.0 : -1.0 / perspectiveDepthToViewZ(d, uNF.x, uNF.y); }
void main() {
  vec4 c = texture2D(tColor, vUv);
  float d = texture2D(tDepth, vUv).x;
  if (d < 1.0 && uInkA > 0.0) {
    float z = iz(vUv); vec2 o = uTexel * uInkW;
    vec4 A = vec4(iz(vUv - vec2(o.x, 0.0)), iz(vUv - vec2(0.0, o.y)), iz(vUv - o), iz(vUv + vec2(o.x, -o.y)));
    vec4 B = vec4(iz(vUv + vec2(o.x, 0.0)), iz(vUv + vec2(0.0, o.y)), iz(vUv + o), iz(vUv + vec2(-o.x, o.y)));
    vec4 D = (2.0 * z - A - B) / z;
    float hi = max(max(D.x, D.y), max(D.z, D.w));
    c.rgb = mix(c.rgb, uInk + c.rgb * 0.12, smoothstep(uInkP.x, uInkP.x * 1.6, hi) * uInkA);
  }
  gl_FragColor = c;
}`;

const TONES = { agx: 'AgXToneMapping', aces: 'ACESFilmicToneMapping', neutral: 'NeutralToneMapping' };

export class Composite {
  constructor(renderer, o = {}) {
    this.r = renderer; this.lite = !!o.lite;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    const sh = (fs, u, defines) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false, ...(defines ? { defines } : {}) });
    const projInv = { value: new THREE.Matrix4() };
    this.u = { projInv };
    this.mAO = sh(AO_FS, { tDepth: { value: null }, uProjInv: projInv, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 0.9 }, uProjY: { value: 1 }, uAspect: { value: 1 }, uBias: { value: 0.05 }, uStrength: { value: 2.6 } }, { SAMPLES: this.lite ? 6 : 10 });
    this.mAOBlur = sh(AOBLUR_FS, { tDepth: { value: null }, uProjInv: projInv, tAO: { value: null }, uDir: { value: new THREE.Vector2() }, uNF: { value: new THREE.Vector2() } });
    this.mBright = sh(BRIGHT_FS, { tColor: { value: null }, uTexel: { value: new THREE.Vector2() }, uTh: { value: 1 }, uKnee: { value: 0.5 }, uExp: { value: 1 } });
    this.mBlur = sh(BLUR_FS, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
    const fu = () => ({
      tColor: { value: null }, tDepth: { value: null }, tAO: { value: null }, tB4: { value: null }, tB8: { value: null }, uProjInv: projInv, uAO: { value: 0.85 }, uNF: { value: new THREE.Vector2() },
      uCamWorld: { value: new THREE.Matrix4() }, uHaze: { value: new THREE.Color() }, uHazeP: { value: new THREE.Vector4(30, 0.02, 0.4, 0.12) }, uHazeY: { value: 0 },
      uExposure: { value: 1 }, uBloom: { value: 0.2 }, uSat: { value: 1 }, uCon: { value: 0.1 }, uVig: { value: 0.2 }, uWB: { value: new THREE.Vector3(1, 1, 1) }, uLift: { value: 0 }, uAspect: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uDebug: { value: 0 },
    });
    this.finals = new Map(); this.fu = fu; this.sh = sh;
    this.mFxaa = sh(FXAA_FS, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.mInk = sh(INKONLY_FS, { tColor: { value: null }, tDepth: { value: null }, uProjInv: { value: new THREE.Matrix4() }, uTexel: { value: new THREE.Vector2() }, uNF: { value: new THREE.Vector2() }, uInk: { value: new THREE.Color(0.03, 0.018, 0.016) }, uInkA: { value: 0 }, uInkW: { value: 1 }, uInkP: { value: new THREE.Vector4(0.03, 1.4, 0.85, 0.5) } });
    this.white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); this.white.needsUpdate = true;
    this.black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); this.black.needsUpdate = true;
  }
  final(tone, fxaa) {
    const k = tone + (fxaa ? '|fxaa' : '');
    let m = this.finals.get(k);
    if (!m) {
      const def = { TONE_FN: TONES[tone] || TONES.agx }; if (fxaa) def.FXAA_OUT = '';
      m = this.sh(FINAL_FS, this.fuShared || (this.fuShared = this.fu()), def); this.finals.set(k, m);
    }
    return m;
  }
  rtOpts(o) { return Object.assign({ depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false }, o); }
  targets(W, H, aoScale, samples, fxaa) {
    if (!this.rt || this.rt.width !== W || this.rt.height !== H || this.rt.samples !== samples) {
      if (this.rt) { this.rt.dispose(); this.rt.depthTexture.dispose(); }
      this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples, depthTexture: new THREE.DepthTexture(W, H, THREE.UnsignedIntType), minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    }
    const aw = Math.max(1, Math.round(W * aoScale)), ah = Math.max(1, Math.round(H * aoScale));
    if (!this.aoA || this.aoA.width !== aw || this.aoA.height !== ah) {
      for (const t of [this.aoA, this.aoB]) if (t) t.dispose();
      this.aoA = new THREE.WebGLRenderTarget(aw, ah, this.rtOpts()); this.aoB = new THREE.WebGLRenderTarget(aw, ah, this.rtOpts());
    }
    const qw = Math.max(1, W >> 2), qh = Math.max(1, H >> 2), ew = Math.max(1, W >> 3), eh = Math.max(1, H >> 3);
    if (!this.b4 || this.b4.width !== qw || this.b4.height !== qh) {
      for (const t of [this.b4, this.b4b, this.b8, this.b8b]) if (t) t.dispose();
      const o = this.rtOpts({ type: THREE.HalfFloatType });
      this.b4 = new THREE.WebGLRenderTarget(qw, qh, o); this.b4b = new THREE.WebGLRenderTarget(qw, qh, o); this.b8 = new THREE.WebGLRenderTarget(ew, eh, o); this.b8b = new THREE.WebGLRenderTarget(ew, eh, o);
    }
    if (fxaa && (!this.ldr || this.ldr.width !== W || this.ldr.height !== H)) { if (this.ldr) this.ldr.dispose(); this.ldr = new THREE.WebGLRenderTarget(W, H, this.rtOpts()); }
  }
  /** the portrait ink outline alone: src (a target with a depthTexture, rendered through cam) → dst, alpha kept */
  inkPass(src, cam, dst, o = {}) {
    const U = this.mInk.uniforms, W = src.width, H = src.height;
    U.tColor.value = src.texture; U.tDepth.value = src.depthTexture; U.uProjInv.value.copy(cam.projectionMatrixInverse);
    U.uTexel.value.set(1 / W, 1 / H); U.uNF.value.set(cam.near, cam.far); U.uInkA.value = o.ink || 0; if (o.inkCol) U.uInk.value.copy(o.inkCol);
    U.uInkW.value = o.inkW ?? 1; if (o.inkP) U.uInkP.value.set(...o.inkP);
    const prev = this.r.getRenderTarget(); this.pass(this.mInk, dst); this.r.setRenderTarget(prev);
  }
  pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.scene, this.cam); }
  /** o: { ao (0..1), aoRadius, aoK, haze: Color, hazeP: [start, density, max, heightFalloff], hazeY, exposure, tone ('agx' | 'aces' | 'neutral'),
   *       bloom, threshold, sat, contrast, vig, wb: [r, g, b], lift, msaa (samples), fxaa, aoScale, time } */
  render(scene, cam, W, H, o = {}) {
    const aoOn = (o.ao ?? 0.85) > 0, aoScale = o.aoScale ?? Math.min(0.5, 960 / Math.max(W, 1)), fxaa = !!o.fxaa, samples = o.msaa || 0;
    this.targets(W, H, aoScale, samples, fxaa);
    const r = this.r;
    r.setRenderTarget(this.rt); r.render(scene, cam);
    this.u.projInv.value.copy(cam.projectionMatrixInverse);
    const depth = this.rt.depthTexture, nf = [cam.near, cam.far];
    if (aoOn) {
      const A = this.mAO.uniforms, aw = this.aoA.width, ah = this.aoA.height;
      A.tDepth.value = depth; A.uTexel.value.set(1 / aw, 1 / ah); A.uRadius.value = o.aoRadius ?? 0.9; A.uStrength.value = o.aoK ?? 2.6; A.uProjY.value = cam.projectionMatrix.elements[5]; A.uAspect.value = H / W;
      this.pass(this.mAO, this.aoA);
      const B = this.mAOBlur.uniforms; B.tDepth.value = depth; B.uNF.value.set(...nf);
      B.tAO.value = this.aoA.texture; B.uDir.value.set(1 / aw, 0); this.pass(this.mAOBlur, this.aoB);
      B.tAO.value = this.aoB.texture; B.uDir.value.set(0, 1 / ah); this.pass(this.mAOBlur, this.aoA);
    }
    // bloom
    const bloom = o.bloom ?? 0.2;
    if (bloom > 0) {
      const Br = this.mBright.uniforms, Bl = this.mBlur.uniforms;
      Br.tColor.value = this.rt.texture; Br.uTexel.value.set(1 / W, 1 / H); Br.uTh.value = o.threshold ?? 1.2; Br.uKnee.value = (o.threshold ?? 1.2) * 0.5; Br.uExp.value = o.exposure ?? 1;
      this.pass(this.mBright, this.b4);
      Bl.tSrc.value = this.b4.texture; Bl.uDir.value.set(1 / this.b4.width, 0); this.pass(this.mBlur, this.b4b);
      Bl.tSrc.value = this.b4b.texture; Bl.uDir.value.set(0, 1 / this.b4.height); this.pass(this.mBlur, this.b4);
      Bl.tSrc.value = this.b4.texture; Bl.uDir.value.set(1.5 / this.b8.width, 0); this.pass(this.mBlur, this.b8b);
      Bl.tSrc.value = this.b8b.texture; Bl.uDir.value.set(0, 1.5 / this.b8.height); this.pass(this.mBlur, this.b8);
    }
    const M = this.final(o.tone || 'agx', fxaa), F = M.uniforms;
    F.tColor.value = this.rt.texture; F.tDepth.value = depth; F.tAO.value = aoOn ? this.aoA.texture : this.white; F.uAO.value = aoOn ? o.ao ?? 0.85 : 0;
    F.tB4.value = bloom > 0 ? this.b4.texture : this.black; F.tB8.value = bloom > 0 ? this.b8.texture : this.black; F.uBloom.value = bloom;
    F.uNF.value.set(...nf); F.uCamWorld.value.copy(cam.matrixWorld);
    if (o.haze) F.uHaze.value.copy(o.haze);
    if (o.hazeP) F.uHazeP.value.set(...o.hazeP); F.uHazeY.value = o.hazeY || 0;
    F.uExposure.value = o.exposure ?? 1; F.uSat.value = o.sat ?? 1; F.uCon.value = o.contrast ?? 0.1; F.uVig.value = o.vig ?? 0.2; F.uLift.value = o.lift || 0;
    const wb = o.wb || [1, 1, 1]; F.uWB.value.set(wb[0], wb[1], wb[2]);
    F.uAspect.value.set(W / H, 1); F.uTime.value = (o.time || 0) % 100; F.uDebug.value = o.debug ? 1 : 0;
    if (!fxaa) { this.pass(M, null); return; }
    this.pass(M, this.ldr);
    this.mFxaa.uniforms.tSrc.value = this.ldr.texture; this.mFxaa.uniforms.uTexel.value.set(1 / W, 1 / H);
    this.pass(this.mFxaa, null);
  }
}
