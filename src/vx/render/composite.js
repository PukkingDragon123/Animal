// The stage's HD frame: the scene renders into a linear HDR target with a depth texture; then
//  1. ambient occlusion (scalable ambient obscurance, 12 spiral taps) at half resolution from the depth,
//     with normals rebuilt from the depth itself, so creases, corners, the feet of walls and everything
//     standing on the ground (props, people, creatures) sit in soft contact shadow;
//  2. a depth-aware blur (horizontal + vertical) that keeps the occlusion from bleeding across edges;
//  3. the composite: occlusion, the ink outline (below), aerial haze (thicker with distance and near the
//     ground, tinted to the sky), then filmic tone mapping into the canvas;
//  4. for the close third-person camera, a depth of field focused on the player: the shaded frame goes to
//     an HDR target, a half-resolution disc blur gathers it (each tap weighted by its own blur, so the sharp
//     player never smears into the soft street behind), and the last pass blends sharp and soft by each
//     pixel's circle of confusion before the tone mapping.
// The ink outline (one line style for every asset: buildings, voxel props, furniture, trees, people and the
// Tokonmon, whose own inverted-hull lines are switched off while this pass draws; see stage.js) is found in the
// same depth buffer, inside the composite pass: no extra scene render, no extra target, nine depth taps.
//  - The signed second difference of INVERSE depth along four directions (horizontal, vertical, both
//    diagonals). 1/z is linear in screen space on any plane, so flat surfaces give exactly zero however
//    grazing they are: no false lines on the street running to the horizon, and texture detail never draws a
//    line (depth knows nothing of the paint), so finely textured walls and floors stay clean.
//  - Silhouettes: a neighbour lies well behind the plane through this pixel (relative jump > uInkP.x); the
//    line lands on the NEAR side only, so it is one sample wide and hugs the object.
//  - Creases: the same difference divided by the pixel's angular size measures the change of surface slope
//    (≈ Δtan of the facing angle), independent of distance; folds sharper than uInkP.y (box corners, a wall
//    meeting the floor, the edge of a step) get a slightly lighter line; low-poly facets on people stay clean.
//  - Width: the taps sit uInkW pixels apart (about 1 px at 1080p, more on bigger canvases), so the line keeps
//    a constant screen width at any distance. It thins out with distance (to uInkP.w) and then the haze,
//    applied after it, fades it like everything else. The ink is a warm dark colour per mood, picking up a
//    little of the surface colour underneath (hand-inked, not a black stencil).
import * as THREE from '../../../vendor/three.module.js';

const VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const COMMON = `
#include <packing>
uniform sampler2D tDepth; uniform mat4 uProjInv;
vec3 viewPos(vec2 uv) { float d = texture2D(tDepth, uv).x; vec4 v = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return v.xyz / v.w; }
`;
const INK = `
uniform vec3 uInk; uniform float uInkA; uniform float uInkW; uniform vec4 uInkP; uniform vec2 uInkF; uniform float uPixK;
// inverse view depth (0 for the sky: infinitely far)
float iz(vec2 uv) { float d = texture2D(tDepth, uv).x; return d >= 1.0 ? 0.0 : -1.0 / perspectiveDepthToViewZ(d, uNF.x, uNF.y); }
// ink coverage 0..1 at this pixel (c: its inverse depth)
float ink(float c) {
  vec2 o = uTexel * uInkW;
  vec4 A = vec4(iz(vUv - vec2(o.x, 0.0)), iz(vUv - vec2(0.0, o.y)), iz(vUv - o), iz(vUv + vec2(o.x, -o.y)));
  vec4 B = vec4(iz(vUv + vec2(o.x, 0.0)), iz(vUv + vec2(0.0, o.y)), iz(vUv + o), iz(vUv + vec2(-o.x, o.y)));
  vec4 D = (2.0 * c - A - B) / c;                                 // 0 on a plane; > 0: the neighbours fall away behind
  float hi = max(max(D.x, D.y), max(D.z, D.w)), lo = min(min(D.x, D.y), min(D.z, D.w));
  // silhouette, near side: a neighbour lies far behind the plane through this pixel
  float sil = smoothstep(uInkP.x, uInkP.x * 1.6, hi);
  // the far side of a silhouette (a neighbour far in front): no line here, the near side has it
  float far = step(uInkP.x, -lo);
  // crease: the change of slope across this pixel, in units of tan(angle) (diagonals are √2 longer)
  vec4 C = abs(D) / (uPixK * uInkW * vec4(1.0, 1.0, 1.4142, 1.4142));
  float crease = smoothstep(uInkP.y, uInkP.y * 1.7, max(max(C.x, C.y), max(C.z, C.w))) * (1.0 - far) * uInkP.z;
  return max(sil, crease);
}
`;
const AO_FS = `#define SAMPLES 12
varying vec2 vUv; uniform vec2 uTexel; uniform float uRadius; uniform float uProjY; uniform float uAspect; uniform float uBias; uniform float uPower; uniform float uStrength;
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
  float rs = uRadius * uProjY * 0.5 / -P.z;                  // the radius in uv (fraction of the height)
  float a0 = ign(gl_FragCoord.xy) * 6.2831853, occ = 0.0, r2 = uRadius * uRadius;
  for (int i = 0; i < SAMPLES; i++) {
    float t = (float(i) + 0.5) / float(SAMPLES), a = a0 + float(i) * 2.3999632;
    vec2 off = vec2(cos(a) * uAspect, sin(a)) * (rs * sqrt(t));
    vec3 v = viewPos(vUv + off) - P;
    float vv = dot(v, v), vn = dot(v, N);
    occ += max(0.0, 1.0 - vv / r2) * max(0.0, vn * inversesqrt(vv + 1e-4) - uBias);
  }
  float ao = clamp(1.0 - occ / float(SAMPLES) * uStrength, 0.0, 1.0);
  gl_FragColor = vec4(vec3(pow(ao, uPower)), 1.0);
}`;
const BLUR_FS = `varying vec2 vUv; uniform sampler2D tAO; uniform vec2 uDir; uniform vec2 uNF;
${COMMON}
float lz(vec2 uv) { float d = texture2D(tDepth, uv).x; return d >= 1.0 ? 1e5 : -perspectiveDepthToViewZ(d, uNF.x, uNF.y); }
void main() {
  float z = lz(vUv), s = 0.0, w = 0.0;
  for (int i = -4; i <= 4; i++) {
    vec2 uv = vUv + uDir * float(i);
    float k = exp(-float(i * i) / 10.0) * max(0.0, 1.0 - abs(lz(uv) - z) / (z * 0.03));
    s += texture2D(tAO, uv).r * k; w += k;
  }
  gl_FragColor = vec4(vec3(w > 0.0 ? s / w : 1.0), 1.0);
}`;
const FINAL_FS = `varying vec2 vUv; uniform sampler2D tColor; uniform sampler2D tAO; uniform float uAO; uniform vec2 uTexel; uniform vec2 uNF;
uniform mat4 uCamWorld; uniform vec3 uHaze; uniform vec4 uHazeP; uniform float uHazeY;
uniform float uDebug;
${COMMON}
${INK}
void main() {
  vec3 col = texture2D(tColor, vUv).rgb;
  float d = texture2D(tDepth, vUv).x;
  if (d < 1.0) {
    vec3 vp = viewPos(vUv); float dist = length(vp);
    // ambient occlusion
    float ao = texture2D(tAO, vUv).r;
    col *= mix(1.0, ao, uAO);
    if (uDebug > 0.5) col = vec3(ao * 0.6);
    // the ink outline: silhouettes and strong creases, thinning with distance (the haze below fades it further)
    if (uInkA > 0.0) {
      // (alpha = how much of this opaque surface still shows through faded cut-away walls, water, glass: see coverage())
      float k = ink(-1.0 / vp.z) * uInkA * mix(1.0, uInkP.w, smoothstep(uInkF.x, uInkF.y, dist)) * clamp(texture2D(tColor, vUv).a, 0.0, 1.0);
      col = mix(col, uInk + col * 0.12, k);
      if (uDebug > 1.5) col = vec3(1.0 - k);
    }
    // aerial haze: grows with distance past the start, thicker near the ground
    vec3 wp = (uCamWorld * vec4(vp, 1.0)).xyz;
    float hz = 1.0 - exp(-max(dist - uHazeP.x, 0.0) * uHazeP.y);
    float hh = exp(-max(wp.y - uHazeY, 0.0) * uHazeP.w);
    col = mix(col, uHaze, clamp(hz * (0.45 + 0.55 * hh), 0.0, 1.0) * uHazeP.z);
  }
  gl_FragColor = vec4(col, 1.0);
  #ifndef NO_TONE
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #endif
}`;
// the ink alone over a finished colour target (dialogue portraits): alpha kept, lines on the subject's own pixels
const INKONLY_FS = `varying vec2 vUv; uniform sampler2D tColor; uniform vec2 uTexel; uniform vec2 uNF;
${COMMON}
${INK}
void main() {
  vec4 c = texture2D(tColor, vUv);
  float d = texture2D(tDepth, vUv).x;
  if (d < 1.0 && uInkA > 0.0) c.rgb = mix(c.rgb, uInk + c.rgb * 0.12, ink(-1.0 / viewPos(vUv).z) * uInkA);
  gl_FragColor = c;
}`;
// circle of confusion (0..1 of the largest blur) from the view depth: a thin lens focused at uDof.x metres
const COC = `
float coc(float z) { return clamp((abs(z - uDofP.x) / max(z, 1e-3)) * uDofP.y - uDofP.z, 0.0, 1.0); }
`;
const DOF_FS = `varying vec2 vUv; uniform sampler2D tColor; uniform vec2 uNF; uniform vec4 uDofP; uniform vec2 uRad;
${COMMON}
float lz(vec2 uv) { float d = texture2D(tDepth, uv).x; return d >= 1.0 ? 1e5 : -perspectiveDepthToViewZ(d, uNF.x, uNF.y); }
${COC}
void main() {
  float c0 = coc(lz(vUv));
  vec3 s = texture2D(tColor, vUv).rgb * (c0 + 0.02); float w = c0 + 0.02;
  for (int i = 0; i < 20; i++) {
    float t = (float(i) + 0.5) / 20.0, a = float(i) * 2.3999632;
    vec2 uv = vUv + vec2(cos(a), sin(a)) * uRad * sqrt(t);
    float c = coc(lz(uv));
    float k = smoothstep(sqrt(t) * 0.9 - 0.25, sqrt(t) * 0.9, c);     // a tap counts when its own blur reaches this far
    s += texture2D(tColor, uv).rgb * k; w += k;
  }
  gl_FragColor = vec4(s / w, c0);
}`;
const BLEND_FS = `varying vec2 vUv; uniform sampler2D tColor; uniform sampler2D tSoft; uniform vec2 uNF; uniform vec4 uDofP;
${COMMON}
float lz(vec2 uv) { float d = texture2D(tDepth, uv).x; return d >= 1.0 ? 1e5 : -perspectiveDepthToViewZ(d, uNF.x, uNF.y); }
${COC}
void main() {
  vec3 col = texture2D(tColor, vUv).rgb;
  vec4 soft = texture2D(tSoft, vUv);
  float c = coc(lz(vUv));
  col = mix(col, soft.rgb, smoothstep(0.04, 0.45, c));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class Composite {
  constructor(renderer) {
    this.r = renderer;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    const sh = (fs, u) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false });
    const projInv = { value: new THREE.Matrix4() };
    this.u = { projInv };
    this.mAO = sh(AO_FS, { tDepth: { value: null }, uProjInv: projInv, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 0.9 }, uProjY: { value: 1 }, uAspect: { value: 1 }, uBias: { value: 0.06 }, uPower: { value: 1.0 }, uStrength: { value: 3.2 } });
    this.mBlur = sh(BLUR_FS, { tDepth: { value: null }, uProjInv: projInv, tAO: { value: null }, uDir: { value: new THREE.Vector2() }, uNF: { value: new THREE.Vector2() } });
    this.mFinal = sh(FINAL_FS, {
      tColor: { value: null }, tDepth: { value: null }, tAO: { value: null }, uProjInv: projInv, uAO: { value: 0.85 }, uTexel: { value: new THREE.Vector2() }, uNF: { value: new THREE.Vector2() },
      uCamWorld: { value: new THREE.Matrix4() }, uHaze: { value: new THREE.Color() }, uHazeP: { value: new THREE.Vector4(30, 0.02, 0.4, 0.12) }, uHazeY: { value: 0 },
      uDebug: { value: 0 },
    });
    const inkU = () => ({ uInk: { value: new THREE.Color(0.03, 0.018, 0.016) }, uInkA: { value: 0 }, uInkW: { value: 1 }, uInkP: { value: new THREE.Vector4(0.03, 1.4, 0.85, 0.5) }, uInkF: { value: new THREE.Vector2(14, 90) }, uPixK: { value: 0.001 } });
    Object.assign(this.mFinal.uniforms, inkU());
    this.mInk = sh(INKONLY_FS, { tColor: { value: null }, tDepth: { value: null }, uProjInv: { value: new THREE.Matrix4() }, uTexel: { value: new THREE.Vector2() }, uNF: { value: new THREE.Vector2() }, ...inkU() });
    this.mFinal.toneMapped = true;      // the canvas gets the renderer's filmic tone mapping + sRGB
    this.mShade = this.mFinal.clone(); this.mShade.uniforms = this.mFinal.uniforms; this.mShade.defines = { NO_TONE: '' }; this.mShade.toneMapped = false;
    const dofP = { value: new THREE.Vector4(5, 1.4, 0.1, 0) };
    this.mDof = sh(DOF_FS, { tDepth: { value: null }, uProjInv: projInv, tColor: { value: null }, uNF: { value: new THREE.Vector2() }, uDofP: dofP, uRad: { value: new THREE.Vector2() } });
    this.mBlend = sh(BLEND_FS, { tDepth: { value: null }, uProjInv: projInv, tColor: { value: null }, tSoft: { value: null }, uNF: { value: new THREE.Vector2() }, uDofP: dofP });
    this.mBlend.toneMapped = true;
    this.white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); this.white.needsUpdate = true;
  }
  targets(W, H, aoScale) {
    if (!this.rt || this.rt.width !== W || this.rt.height !== H) {
      if (this.rt) { this.rt.dispose(); this.rt.depthTexture.dispose(); }
      this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(W, H, THREE.UnsignedIntType), minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    }
    const aw = Math.max(1, Math.round(W * aoScale)), ah = Math.max(1, Math.round(H * aoScale));
    if (!this.aoA || this.aoA.width !== aw || this.aoA.height !== ah) {
      for (const t of [this.aoA, this.aoB]) if (t) t.dispose();
      const o = { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
      this.aoA = new THREE.WebGLRenderTarget(aw, ah, o); this.aoB = new THREE.WebGLRenderTarget(aw, ah, o);
    }
  }
  inkUniforms(U, cam, H, o) {
    U.uInkA.value = o.ink || 0; if (o.inkCol) U.uInk.value.copy(o.inkCol);
    U.uInkW.value = o.inkW ?? Math.max(1, Math.round(H / 1080 * 1.25)); U.uPixK.value = 2 / (cam.projectionMatrix.elements[5] * H);
    if (o.inkP) U.uInkP.value.set(...o.inkP); if (o.inkFade) U.uInkF.value.set(...o.inkFade);
  }
  /** Transparent surfaces (cut-away walls, water, glass) write no depth, so the ink comes from the opaque surface
   *  behind them. Their alpha is made to blend multiplicatively into the target's alpha (colour blending unchanged):
   *  after the frame, alpha = how much of that opaque surface is still seen, and the ink is faded by it. */
  coverage(scene) {
    const P = this.patched || (this.patched = new Set());
    for (const m of P) if (!m.transparent) { m.blending = THREE.NormalBlending; P.delete(m); }
    scene.traverseVisible((o) => {
      const m = o.material;
      if (!o.isMesh || !m || Array.isArray(m) || !m.transparent || m.blending !== THREE.NormalBlending || m.premultipliedAlpha) return;
      m.blending = THREE.CustomBlending; m.blendEquation = m.blendEquationAlpha = THREE.AddEquation;
      m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
      P.add(m);
    });
  }
  /** the ink outline alone: src (a target with a depthTexture, rendered through cam) → dst, alpha kept */
  inkPass(src, cam, dst, o = {}) {
    const U = this.mInk.uniforms, W = src.width, H = src.height;
    U.tColor.value = src.texture; U.tDepth.value = src.depthTexture; U.uProjInv.value.copy(cam.projectionMatrixInverse);
    U.uTexel.value.set(1 / W, 1 / H); U.uNF.value.set(cam.near, cam.far); this.inkUniforms(U, cam, H, o);
    const prev = this.r.getRenderTarget(); this.pass(this.mInk, dst); this.r.setRenderTarget(prev);
  }
  pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.scene, this.cam); }
  dofTargets(W, H) {
    if (!this.rtS || this.rtS.width !== W || this.rtS.height !== H) {
      if (this.rtS) { this.rtS.dispose(); this.rtD.dispose(); }
      this.rtS = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      this.rtD = new THREE.WebGLRenderTarget(Math.max(1, W >> 1), Math.max(1, H >> 1), { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    }
  }
  /** o: { ao (strength 0..1), aoRadius, haze: Color, hazeP: [start, density, max, heightFalloff], hazeY,
   *       ink (outline strength 0..1), inkCol (Color, linear), inkW (tap spacing px; default ~1 px per 1080 rows),
   *       inkP: [silhouette jump, crease Δtan, crease strength, far strength], inkFade: [start m, end m],
   *       dof: { focus (m), k (blur growth), tol (in-focus slack), px (largest blur radius, fraction of the height) } } */
  render(scene, cam, W, H, o = {}) {
    const aoOn = (o.ao ?? 0.85) > 0, aoScale = Math.min(0.5, 720 / Math.max(W, 1));
    this.targets(W, H, aoScale);
    const r = this.r;
    if ((o.ink || 0) > 0) this.coverage(scene);
    r.setRenderTarget(this.rt); r.render(scene, cam);
    this.u.projInv.value.copy(cam.projectionMatrixInverse);
    const depth = this.rt.depthTexture, nf = [cam.near, cam.far];
    if (aoOn) {
      const A = this.mAO.uniforms, aw = this.aoA.width, ah = this.aoA.height;
      A.tDepth.value = depth; A.uTexel.value.set(1 / aw, 1 / ah); A.uRadius.value = o.aoRadius ?? 1.2; A.uStrength.value = o.aoK ?? 3.2; A.uProjY.value = cam.projectionMatrix.elements[5]; A.uAspect.value = H / W;
      this.pass(this.mAO, this.aoA);
      const B = this.mBlur.uniforms; B.tDepth.value = depth; B.uNF.value.set(...nf);
      B.tAO.value = this.aoA.texture; B.uDir.value.set(1 / aw, 0); this.pass(this.mBlur, this.aoB);
      B.tAO.value = this.aoB.texture; B.uDir.value.set(0, 1 / ah); this.pass(this.mBlur, this.aoA);
    }
    const F = this.mFinal.uniforms;
    F.tColor.value = this.rt.texture; F.tDepth.value = depth; F.tAO.value = aoOn ? this.aoA.texture : this.white; F.uAO.value = aoOn ? o.ao ?? 0.85 : 0;
    F.uTexel.value.set(1 / W, 1 / H); F.uNF.value.set(...nf); F.uCamWorld.value.copy(cam.matrixWorld);
    if (o.haze) F.uHaze.value.copy(o.haze);
    if (o.hazeP) F.uHazeP.value.set(...o.hazeP); F.uHazeY.value = o.hazeY || 0;
    F.uDebug.value = o.debug === 'ink' ? 2 : o.debug ? 1 : 0; this.inkUniforms(F, cam, H, o);
    const D = o.dof;
    if (!D || !(D.px > 0)) { this.pass(this.mFinal, null); return; }
    // depth of field: shade into HDR, gather the soft copy at half resolution, blend + tone map
    this.dofTargets(W, H);
    this.pass(this.mShade, this.rtS);
    const U = this.mDof.uniforms; U.tDepth.value = depth; U.tColor.value = this.rtS.texture; U.uNF.value.set(...nf);
    U.uDofP.value.set(D.focus, D.k ?? 1.4, D.tol ?? 0.1, 0); U.uRad.value.set(D.px * H / W, D.px);
    this.pass(this.mDof, this.rtD);
    const Bl = this.mBlend.uniforms; Bl.tDepth.value = depth; Bl.tColor.value = this.rtS.texture; Bl.tSoft.value = this.rtD.texture; Bl.uNF.value.set(...nf);
    this.pass(this.mBlend, null);
  }
}
