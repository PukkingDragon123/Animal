// Two shadow cascades for the sun. The close street-level camera needs crisp contact shadows right around
// the player (feet, kerbs, door steps, the shadow of a lamp post across the pavement) and still a shadow on
// the buildings 40 m down the street. One map can't do both, so the stage runs two directional lights that
// share the sun's direction: the sun itself carries a tight, high-resolution box that follows the camera
// target (the near cascade), and a dark twin carries the wide box (the far cascade). This patch teaches
// every built-in lit material to read the near map inside its box and fade to the far map toward its rim,
// and to ignore the twin's (black) light. It only switches on when exactly two shadow-casting directional
// lights are in the scene (the stage's pair); every other setup compiles the stock three.js code.
import * as THREE from '../../../vendor/three.module.js';

const CASCADE = `
#if defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHTS == 2 ) && ( NUM_DIR_LIGHT_SHADOWS == 2 ) && defined( RE_Direct )
	{
		DirectionalLight vxSun = directionalLights[ 0 ];
		getDirectionalLightInfo( vxSun, directLight );
		if ( directLight.visible && receiveShadow ) {
			DirectionalLightShadow s0 = directionalLightShadows[ 0 ];
			DirectionalLightShadow s1 = directionalLightShadows[ 1 ];
			vec4 c0 = vDirectionalShadowCoord[ 0 ];
			vec2 q = abs( c0.xy / c0.w - 0.5 );
			float w = smoothstep( 0.36, 0.47, max( q.x, q.y ) );
			float sh = 1.0;
			if ( w < 1.0 ) sh = getShadow( directionalShadowMap[ 0 ], s0.shadowMapSize, s0.shadowIntensity, s0.shadowBias, s0.shadowRadius, c0 );
			if ( w > 0.0 ) sh = mix( sh, getShadow( directionalShadowMap[ 1 ], s1.shadowMapSize, s1.shadowIntensity, s1.shadowBias, s1.shadowRadius, vDirectionalShadowCoord[ 1 ] ), w );
			directLight.color *= sh;
		}
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
#else
`;

// The environment (the sky, render/sky.js) only adds reflections: the sky's diffuse light already comes from
// the hemisphere light, which every material (Lambert too) receives alike, so the image-based irradiance is
// dropped and lit Standard and Lambert surfaces stay matched.
const ENV_SPEC_ONLY = `
#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV ) && defined( RE_IndirectDiffuse )
	iblIrradiance = vec3( 0.0 );
#endif
`;

let done = false;
/** install the cascade-aware directional light loop and the reflection-only environment (once, globally) */
export function installLighting() {
  if (done) return; done = true;
  const C = THREE.ShaderChunk, src = C.lights_fragment_begin, a = src.indexOf('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )');
  if (a >= 0) {
    const b = src.indexOf('#endif', src.indexOf('#pragma unroll_loop_end', a)) + '#endif'.length;
    C.lights_fragment_begin = src.slice(0, a) + CASCADE + src.slice(a, b) + '\n#endif\n' + src.slice(b);
  }
  C.lights_fragment_maps = C.lights_fragment_maps + ENV_SPEC_ONLY;
}

const _up = new THREE.Vector3(0, 1, 0), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _p = new THREE.Vector3();
/** aim a directional light's shadow box (half-size R) at point t along the unit direction d, snapped to whole texels */
export function aimShadow(light, t, R, d, back = 120) {
  const sc = light.shadow.camera;
  if (sc.right !== R) { sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = back + 280; sc.updateProjectionMatrix(); }
  // snap the box to whole shadow texels in the light's own frame, so shadow edges don't crawl as you walk
  const tx = (2 * R) / light.shadow.mapSize.x, z = _z.copy(d), x = _x.crossVectors(_up, z).normalize(), y = _y.crossVectors(z, x);
  const p = _p.set(t.x, t.y || 0, t.z), a = Math.round(p.dot(x) / tx) * tx, b = Math.round(p.dot(y) / tx) * tx, c = p.dot(z);
  p.copy(x).multiplyScalar(a).addScaledVector(y, b).addScaledVector(z, c);
  light.target.position.copy(p); light.position.copy(p).addScaledVector(z, back); light.target.updateMatrixWorld(); light.updateMatrixWorld();
}
