// Surfaces up close: what the city's pixel-art textures are made of.
//  - Every textured surface is a MeshStandardMaterial whose roughness / metalness come from its texture's
//    family (brick, stucco, painted siding, glazed roof tiles, asphalt, pavers, glass, enamel signs, canvas…),
//    so the sun leaves a soft sheen on painted wood, a glint on glazed tiles and glass, and almost nothing on
//    brick or tarmac; glossy surfaces reflect the mood's sky (render/sky.js) through the stage environment.
//  - Pixel relief: a per-texel normal derived from the pixel art itself (the texture's own luminance; bricks
//    read their light mortar as the groove), sampled at the texel centres so each art pixel becomes one
//    flat facet: mortar joints, paver bevels, siding laps, tile grout and wood grain catch the low sun and
//    shade on the far side, crisp and blocky like the art. No extra textures: four taps of the colour map.
//    The relief fades out with distance (no shimmer far away).
//  - Glass: windows, shop windows and glazed doors mark their panes (tex.userData.glass, texel rects); a
//    tiny roughness map makes just those panes mirror-smooth. Puddles in the ground atlas likewise.
// The patch chains with the light pools (render/pools.js), which wrap this material's onBeforeCompile.
import * as THREE from '../../../vendor/three.module.js';

// family (texture key prefix) → [roughness, metalness, relief (height amplitude in texels; < 0: light = groove)]
const FAMILIES = [
  [/^brick/, 0.86, 0, -1.1], [/^plaster/, 0.9, 0, 0.45], [/^siding/, 0.55, 0, 1.0], [/^rooftile/, 0.42, 0, 1.0], [/^shingle/, 0.85, 0, 0.9],
  [/^metalroof/, 0.42, 0.35, 0.8], [/^asphalt/, 0.86, 0, 0.55], [/^pavers|^slabs/, 0.74, 0, 1.0], [/^cobble/, 0.66, 0, 1.2], [/^grass/, 0.95, 0, 0.7],
  [/^dirt|soil|sand/, 0.96, 0, 0.6], [/^planks|wood|deck|board/, 0.6, 0, 0.8], [/^tiles/, 0.24, 0, 0.8], [/^carpet|rug|quilt|towel|knit|mat\b/, 1.0, 0, 0.4], [/^wallpaper/, 0.8, 0, 0.25],
  [/^concrete/, 0.84, 0, 0.5], [/^tactile/, 0.6, 0, 1.2], [/^roofmem/, 0.7, 0, 0.4], [/^win/, 0.45, 0, 0.35], [/^shopwin/, 0.35, 0, 0.3],
  [/^door/, 0.45, 0, 0.6], [/^garage/, 0.45, 0.15, 0.7], [/^sign|neon|marquee/, 0.4, 0, 0.25], [/^awning/, 0.9, 0, 0.5], [/^solid/, 0.62, 0, 0.2],
  [/^stripes|^dash|^zebra/, 0.6, 0, 0.3], [/^dress_ground/, 0.82, 0, 0.5], [/^dress_/, 0.6, 0, 0.5], [/^water/, 0.05, 0, 0],
  [/metal|steel|chrome|rail|pipe|tin/i, 0.4, 0.3, 0.4], [/glass|mirror|screen|tv|pc|monitor/i, 0.2, 0, 0.2], [/leaf|hedge|grass|bush|plant/i, 0.92, 0, 0.6],
];
const DEFAULT = [0.75, 0, 0.35];
export function family(tex) {
  const key = String((tex && tex.userData && tex.userData.key) || '');
  for (const f of FAMILIES) if (f[0].test(key)) return { rough: f[1], metal: f[2], relief: f[3] };
  return { rough: DEFAULT[0], metal: DEFAULT[1], relief: DEFAULT[2] };
}

// the relief: per-texel normal from the colour map (inserted after the normal maps)
const FS_PARS = `
uniform float uVxRelief;
float vxH( vec3 c ) { float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) ); return uVxRelief < 0.0 ? - sqrt( l ) : sqrt( l ); }
`;
const FS_MAIN = `
#if defined( USE_MAP )
	if ( uVxRelief != 0.0 ) {
		float vxFade = 1.0 - smoothstep( 12.0, 34.0, length( vViewPosition ) );
		if ( vxFade > 0.0 ) {
			vec2 ts = vec2( textureSize( map, 0 ) );
			vec2 tc = ( floor( vMapUv * ts ) + 0.5 ) / ts, e = 1.0 / ts;
			float hl = vxH( texture2D( map, tc - vec2( e.x, 0.0 ) ).rgb ), hr = vxH( texture2D( map, tc + vec2( e.x, 0.0 ) ).rgb );
			float hd = vxH( texture2D( map, tc - vec2( 0.0, e.y ) ).rgb ), hu = vxH( texture2D( map, tc + vec2( 0.0, e.y ) ).rgb );
			// slope (texels of height per texel of run) → height change per screen pixel, in metres
			vec2 G = vec2( hr - hl, hu - hd ) * 0.5 * abs( uVxRelief ) * vxFade;
			vec2 T = vMapUv * ts, dTx = dFdx( T ), dTy = dFdy( T );
			vec3 sx = dFdx( - vViewPosition ), sy = dFdy( - vViewPosition );
			float mpt = ( length( sx ) + length( sy ) ) / max( length( dTx ) + length( dTy ), 1e-6 );   // metres per texel
			float dHx = dot( G, dTx ) * mpt, dHy = dot( G, dTy ) * mpt;
			// surface gradient bump (Mikkelsen) with unnormalised position derivatives
			vec3 R1 = cross( sy, normal ), R2 = cross( normal, sx );
			float det = dot( sx, R1 ) * faceDirection;
			vec3 grad = sign( det ) * ( dHx * R1 + dHy * R2 );
			normal = normalize( abs( det ) * normal - grad );
		}
	}
#endif
`;

export const ROUGH_CACHE = new Map();
/** a roughness map (G channel) for a texture with glossy patches: userData.glass rects, or bluish puddle pixels */
function glossMap(tex, rough) {
  const ud = tex.userData || {}, key = ud.key || tex.uuid;
  if (ROUGH_CACHE.has(key)) return ROUGH_CACHE.get(key);
  let out = null;
  const img = tex.image, W = img && img.width, H = img && img.height;
  const puddles = /^dress_ground/.test(String(ud.key || ''));
  if (W && H && (ud.glass || puddles)) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const base = Math.round(255 * Math.min(1, rough / Math.max(rough, 1e-3)));     // the map multiplies material.roughness (= the family's)
    g.fillStyle = `rgb(255,${base},0)`; g.fillRect(0, 0, W, H);
    const glass = Math.round(255 * Math.min(1, 0.06 / rough));
    if (ud.glass) { g.fillStyle = `rgb(255,${glass},0)`; for (const [x, y, w, h] of ud.glass) g.fillRect(x, y, w, h); }
    if (puddles) {
      const s = (img.getContext ? img.getContext('2d') : null); if (s) {
        const d = s.getImageData(0, 0, W, H).data, o = g.getImageData(0, 0, W, H);
        for (let i = 0; i < d.length; i += 4) { const r = d[i], gg = d[i + 1], b = d[i + 2], a = d[i + 3]; if (a > 128 && b > r + 24 && b > 110) o.data[i + 1] = Math.round(255 * Math.min(1, 0.08 / rough)); }
        g.putImageData(o, 0, 0);
      }
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.NoColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT;
    t.repeat.copy(tex.repeat); t.offset.copy(tex.offset); t.userData.key = 'rough|' + key;
    out = t;
  }
  ROUGH_CACHE.set(key, out);
  return out;
}

const onBC = function (sh) {
  sh.uniforms.uVxRelief = this.userData.vxReliefU;
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>' + FS_PARS).replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + FS_MAIN);
};

/** make a material show its texture's pixel relief (strength in texels of height; < 0: light pixels are grooves) */
export function relief(m, k) {
  m.userData.vxReliefU = { value: k };
  m.userData.vxChain = true;          // the light pools wrap this patch instead of skipping the material
  m.userData.vxKey = 'relief1';
  m.onBeforeCompile = onBC; m.customProgramCacheKey = () => 'relief1';
  return m;
}

/** the city's textured surface material: Standard, roughness / metalness / relief / glass by the texture's family */
export function surfaceMaterial(tex, o = {}) {
  const f = family(tex), rough = o.rough ?? f.rough;
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: o.metal ?? f.metal, side: o.side ?? THREE.DoubleSide, transparent: !!o.transparent, opacity: o.opacity ?? 1 });
  const gm = glossMap(tex, rough); if (gm) m.roughnessMap = gm;
  // rough surfaces barely mirror the sky (keeps brick, tarmac and stucco from greying over at grazing angles);
  // glazed textures reflect a little more than plain Fresnel, like real panes over a dim room
  m.envMapIntensity = (o.env ?? 1) * (rough > 0.6 ? 0.5 : 1) * (tex.userData && tex.userData.glass ? 1.6 : 1);
  if ((o.relief ?? f.relief) !== 0) relief(m, (o.relief ?? f.relief) * (o.reliefK ?? 1));
  return m;
}
