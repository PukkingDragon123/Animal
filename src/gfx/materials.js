// Anime material system. Every lit voxel surface uses a cel-shaded toon
// material extended (onBeforeCompile) with per-instance FX uniforms:
//   uFlash   — white hit flash          uTint/uTintAmt — status tints (freeze, poison)
//   uDissolve— voxel dissolve w/ edge   uSpectral      — holographic Spectral-form shimmer
//   uRim     — anime rim light          uFade*         — screen-space occlusion cutout
// Emissive voxels use an unlit HDR material so they bloom.
import * as THREE from '../../vendor/three.module.js';

let _gradient = null;
export function toonGradient() {
  if (_gradient) return _gradient;
  // 20 steps over (dotNL*0.5+0.5): deep shade, core shadow, half-tone, lit, key-lit.
  const data = new Uint8Array(20);
  for (let i = 0; i < 20; i++) data[i] = i < 7 ? 30 : i < 10 ? 105 : i < 13 ? 196 : i < 16 ? 228 : 255;
  const t = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat, THREE.UnsignedByteType);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false; t.needsUpdate = true;
  _gradient = t;
  return t;
}

// Shared uniforms (time, occlusion fade) — one object referenced by all materials.
export const shared = {
  uTime: { value: 0 },
  uFadeCenter: { value: new THREE.Vector2(-9999, -9999) }, // px, screen space (drawing buffer)
  uFadeRadius: { value: 0 },
  uFadeDepth: { value: 0 },   // view-space depth of the protected subject
  uRes: { value: new THREE.Vector2(1, 1) },
};

// Cel ramp with a cool anime shadow tint (instead of plain darkening).
const GRADIENT_PARS = /* glsl */`
#ifdef USE_GRADIENTMAP
  uniform sampler2D gradientMap;
#endif
uniform vec3 uShadowTint;
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
  float dotNL = dot( normal, lightDirection );
  vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
  #ifdef USE_GRADIENTMAP
    float g = texture2D( gradientMap, coord ).r;
  #else
    float g = smoothstep(0.45, 0.55, coord.x);
  #endif
  return mix( uShadowTint, vec3( 1.0 ), g );
}
`;
export const shadowTint = { value: new THREE.Color(0.42, 0.36, 0.62) };

const FX_PARS = /* glsl */`
uniform float uTime;
uniform float uFlash; uniform vec3 uFlashColor;
uniform vec3 uTint; uniform float uTintAmt;
uniform float uDissolve; uniform vec3 uDissolveColor;
uniform float uSpectral;
uniform float uRim; uniform vec3 uRimColor;
uniform vec2 uFadeCenter; uniform float uFadeRadius; uniform float uFadeDepth; uniform float uFadeOn;
varying vec3 vWPos;
float fxHash(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
`;

function patch(shader, mat) {
  const u = mat.userData.fx;
  Object.assign(shader.uniforms, u, { uShadowTint: shadowTint, uTime: shared.uTime, uFadeCenter: shared.uFadeCenter, uFadeRadius: shared.uFadeRadius, uFadeDepth: shared.uFadeDepth });
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
    .replace('#include <project_vertex>', `#include <project_vertex>
      vec4 fxwp = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        fxwp = instanceMatrix * fxwp;
      #endif
      vWPos = (modelMatrix * fxwp).xyz;`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <gradientmap_pars_fragment>', GRADIENT_PARS)
    .replace('#include <common>', '#include <common>\n' + FX_PARS)
    .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      if (uFadeOn > 0.5 && uFadeRadius > 0.0) {
        float fd = length(gl_FragCoord.xy - uFadeCenter);
        float viewZ = -vViewPosition.z;
        if (fd < uFadeRadius && -vViewPosition.z < uFadeDepth - 0.6) {
          float k = fd / uFadeRadius;
          float th = fxHash(floor(gl_FragCoord.xyx * vec3(0.5, 0.5, 0.0)));
          if (k < 0.72 || th > (k - 0.72) / 0.28) discard;
        }
      }
      if (uDissolve > 0.0) {
        float dn = fxHash(floor(vWPos * 18.0));
        if (dn < uDissolve) discard;
      }`)
    .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      {
        vec3 vdir = normalize(vViewPosition);
        float fres = pow(1.0 - clamp(abs(dot(normal, vdir)), 0.0, 1.0), 2.5);
        gl_FragColor.rgb += uRimColor * fres * uRim;
        if (uTintAmt > 0.0) gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * uTint * 1.6 + uTint * 0.12, uTintAmt);
        if (uSpectral > 0.0) {
          float band = sin(vWPos.y * 9.0 - uTime * 3.0 + vWPos.x * 3.0) * 0.5 + 0.5;
          vec3 holo = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + band * 0.6 + uTime * 0.15));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.6 + holo * (0.55 + fres * 1.6), uSpectral * 0.75);
        }
        if (uDissolve > 0.0) {
          float dn = fxHash(floor(vWPos * 18.0));
          if (dn < uDissolve + 0.08) gl_FragColor.rgb = uDissolveColor * 3.0;
        }
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uFlashColor * 1.4, uFlash);
      }`);
}

function fxUniforms() {
  return {
    uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color(1, 1, 1) },
    uTint: { value: new THREE.Color(1, 1, 1) }, uTintAmt: { value: 0 },
    uDissolve: { value: 0 }, uDissolveColor: { value: new THREE.Color(0.5, 0.9, 1.0) },
    uSpectral: { value: 0 },
    uRim: { value: 0.0 }, uRimColor: { value: new THREE.Color(1, 0.95, 0.9) },
    uFadeOn: { value: 0 },
  };
}

// Toon material with vertex colours. opts: map, emissiveMap, rim, fade, side, transparent…
export function toonMaterial(opts = {}) {
  const params = {
    vertexColors: opts.vertexColors !== false,
    gradientMap: toonGradient(),
  };
  if (opts.map) params.map = opts.map;
  if (opts.color != null) params.color = new THREE.Color(opts.color);
  if (opts.emissiveMap) { params.emissiveMap = opts.emissiveMap; params.emissive = new THREE.Color(opts.emissive ?? 0xffffff); params.emissiveIntensity = opts.emissiveIntensity ?? 1; }
  if (opts.side != null) params.side = opts.side;
  if (opts.transparent) { params.transparent = true; params.opacity = opts.opacity ?? 1; }
  if (opts.alphaTest) params.alphaTest = opts.alphaTest;
  const m = new THREE.MeshToonMaterial(params);
  m.userData.fx = fxUniforms();
  m.userData.fx.uRim.value = opts.rim ?? 0.0;
  m.userData.fx.uFadeOn.value = opts.fade ? 1 : 0;
  m.onBeforeCompile = (sh) => patch(sh, m);
  m.customProgramCacheKey = () => 'elemon-toon' + (opts.map ? 'M' : '') + (opts.emissiveMap ? 'E' : '');
  return m;
}

// Unlit HDR material for emissive voxels/neon (vertex colours may exceed 1 → bloom).
export function glowMaterial(opts = {}) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: opts.vertexColors !== false, toneMapped: false, map: opts.map || null, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, side: opts.side ?? THREE.FrontSide, depthWrite: opts.depthWrite ?? true, blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  if (opts.color != null) m.color = new THREE.Color(opts.color);
  m.userData.fx = fxUniforms();
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.fx, { uTime: shared.uTime });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <project_vertex>', `#include <project_vertex>
      vec4 fxwp = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        fxwp = instanceMatrix * fxwp;
      #endif
      vWPos = (modelMatrix * fxwp).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; uniform float uFlash; uniform vec3 uFlashColor; uniform float uDissolve; uniform vec3 uDissolveColor; uniform float uSpectral; uniform vec3 uTint; uniform float uTintAmt;
        varying vec3 vWPos;
        float fxHash(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        if (uDissolve > 0.0 && fxHash(floor(vWPos * 18.0)) < uDissolve) discard;`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        if (uTintAmt > 0.0) gl_FragColor.rgb = mix(gl_FragColor.rgb, uTint * 2.0, uTintAmt * 0.6);
        if (uSpectral > 0.0) gl_FragColor.rgb += vec3(0.4, 0.7, 1.0) * uSpectral * (0.6 + 0.4 * sin(uTime * 6.0 + vWPos.y * 8.0));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uFlashColor * 1.6, uFlash);`);
  };
  m.customProgramCacheKey = () => 'elemon-glow' + (opts.map ? 'M' : '');
  return m;
}

// Helpers to drive FX uniforms on all materials under an object.
export function setFx(root, key, value) {
  root.traverse((o) => {
    if (!o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      const fx = m.userData && m.userData.fx;
      if (!fx || !fx[key]) continue;
      if (fx[key].value && fx[key].value.isColor) fx[key].value.set(value);
      else fx[key].value = value;
    }
  });
}
