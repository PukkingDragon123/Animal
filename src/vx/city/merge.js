// Static merge: the city's draw-call diet.
// The builder keeps one mesh per (group, texture) so the camera can cut and fade every building storey by storey,
// which costs thousands of draw calls. Most of the time a building is just scenery, so finalize() also builds a
// merged copy of everything static outside: every building's outer walls, façade decals and roof, the ground, the
// skirt and the street furniture groups, packed into 64 m tiles with one mesh per tile and material:
//  - every pixel texture, tiling or fitted, goes into a few atlas pages (with its emissive twin for lit windows and
//    neon, and a roughness twin for glass). Each vertex carries its texture's rectangle in the page (aAt); the
//    shader wraps the metre-based UVs inside that rectangle and samples with the unwrapped gradients, so tiling
//    surfaces repeat seamlessly and mipmap correctly. Gutters hold wrapped copies of the opposite edges.
//    The pixel relief (render/surface.js) runs in the rectangle's own texel grid, its strength per vertex (aRel);
//  - plain solid-colour parts (trim, sills, bands, the batched solids) become vertex colours on one material.
// Every vertex knows its building (aBid). The cutaway (control.js) shows a building's own groups only while it
// needs them (you're inside, it's fading between you and the camera); those building ids go into HIDE and the
// merged copy collapses their triangles in the vertex shader, in both the colour and the shadow pass.
// Shadows come from one merged caster per tile, drawn only by the shadow cameras (layer 1).
import * as THREE from '../../../vendor/three.module.js';
import { family } from '../render/surface.js';
import { glowInfo } from '../render/glow.js';

export const HIDE_N = 16;
export const HIDE = { value: new Float32Array(HIDE_N).fill(-10) };     // building ids drawn by their own groups right now
export const SHADOW_LAYER = 1;                                         // shadow-only casters (proxies) live here
const TILE = 64;
const EXT = /^b(\d+):(f\d+:(front|back)|roof)$/;
/** the building id a group belongs to (-1: ground, skirt, street furniture), or null when the group is not merged */
export function mergeKey(gk) { const m = EXT.exec(gk); if (m) return +m[1]; return gk === 'ground' || gk === 'skirt' || gk === 'props' ? -1 : null; }

const VS_P = '\nattribute float aBid;\nuniform float uHide[' + HIDE_N + '];\n';
const VS_M = '\n{ for (int i = 0; i < ' + HIDE_N + '; i++) { if (abs(uHide[i] - aBid) < 0.5) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); } }\n';
/** chain the hide-by-building patch onto a material (keeps its own patch; the light pools chain after it) */
export function bidPatch(m) {
  const prev = m.onBeforeCompile, own = prev !== THREE.Material.prototype.onBeforeCompile ? prev : null, key = (m.userData.vxKey || 'std') + '|bid';
  m.onBeforeCompile = function (sh, r) {
    if (own) own.call(this, sh, r);
    sh.uniforms.uHide = HIDE;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + VS_P).replace('#include <project_vertex>', '#include <project_vertex>' + VS_M);
  };
  m.customProgramCacheKey = () => key; m.userData.vxChain = true; m.userData.vxKey = key;
  return m;
}
const DEPTH = bidPatch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
export const PROXY_MAT = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide });

// ---------------------------------------------------------------- the atlas material patch
const AT_VS_P = '\nattribute vec4 aAt;\nattribute float aRel;\nvarying vec4 vAt;\nvarying float vRel;\n';
const AT_VS_M = '\nvAt = aAt; vRel = aRel;\n';
const AT_FS_P = `
varying vec4 vAt; varying float vRel; uniform vec2 uAtSize;
vec2 atUV(vec2 uv) { return vAt.xy + fract(uv) * vAt.zw; }
vec4 atTex(sampler2D t, vec2 uv) { return textureGrad(t, atUV(uv), dFdx(uv) * vAt.zw, dFdy(uv) * vAt.zw); }
float atH(vec3 c) { float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); return vRel < 0.0 ? -sqrt(l) : sqrt(l); }
`;
// pixel relief inside the rectangle: the texel grid of the texture itself (render/surface.js, re-done for the atlas)
const AT_RELIEF = `
if (vRel != 0.0) {
  float vxFade = 1.0 - smoothstep(12.0, 34.0, length(vViewPosition));
  if (vxFade > 0.0) {
    vec2 ts = vAt.zw * uAtSize;                 // the texture's size in texels
    vec2 T = vMapUv * ts, tc = (floor(T) + 0.5) / ts, e = 1.0 / ts;
    float hl = atH(texture2D(map, atUV(tc - vec2(e.x, 0.0))).rgb), hr = atH(texture2D(map, atUV(tc + vec2(e.x, 0.0))).rgb);
    float hd = atH(texture2D(map, atUV(tc - vec2(0.0, e.y))).rgb), hu = atH(texture2D(map, atUV(tc + vec2(0.0, e.y))).rgb);
    vec2 G = vec2(hr - hl, hu - hd) * 0.5 * abs(vRel) * vxFade;
    vec2 dTx = dFdx(T), dTy = dFdy(T);
    vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
    float mpt = (length(sx) + length(sy)) / max(length(dTx) + length(dTy), 1e-6);
    float dHx = dot(G, dTx) * mpt, dHy = dot(G, dTy) * mpt;
    vec3 R1 = cross(sy, normal), R2 = cross(normal, sx);
    float det = dot(sx, R1) * faceDirection;
    normal = normalize(abs(det) * normal - sign(det) * (dHx * R1 + dHy * R2));
  }
}
`;
function atlasPatch(m, size) {
  const U = { value: new THREE.Vector2(size, size) }, prev = m.onBeforeCompile, own = prev !== THREE.Material.prototype.onBeforeCompile ? prev : null;
  m.onBeforeCompile = function (sh, r) {
    if (own) own.call(this, sh, r);
    sh.uniforms.uAtSize = U;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + AT_VS_P).replace('#include <begin_vertex>', '#include <begin_vertex>' + AT_VS_M);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>' + AT_FS_P)
      .replace('vec4 sampledDiffuseColor = texture2D( map, vMapUv );', 'vec4 sampledDiffuseColor = atTex( map, vMapUv );')
      .replace('vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );', 'vec4 texelRoughness = atTex( roughnessMap, vRoughnessMapUv );')
      .replace('vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );', 'vec4 emissiveColor = atTex( emissiveMap, vEmissiveMapUv );')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + AT_RELIEF);
  };
  m.userData.vxChain = true; m.userData.vxKey = 'atlas1'; m.customProgramCacheKey = () => 'atlas1';
  return m;
}

const SOLID = /^solid(#[0-9a-fA-F]{6})/;
const isSolid = (tex) => SOLID.exec((tex && tex.userData && tex.userData.key) || '');

// ---------------------------------------------------------------- the atlas
class Atlas {
  constructor(size, gut) { this.S = size; this.G = gut; this.pages = []; this.at = new Map(); }
  page() {
    // the emissive and roughness pages are half the size of the colour page (same UVs)
    const mk = (k = 1) => { const c = document.createElement('canvas'); c.width = c.height = this.S * k; const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); g.imageSmoothingEnabled = false; return c; };
    const p = { map: mk(), em: null, rough: mk(0.5), shelves: [], mk };
    const g = p.rough.getContext('2d'); g.fillStyle = 'rgb(255,200,0)'; g.fillRect(0, 0, this.S, this.S);
    this.pages.push(p); return p;
  }
  /** room for a w × h block (shelf packing over every page) */
  place(w, h) {
    const S = this.S;
    for (const p of this.pages) {
      for (const sh of p.shelves) if (h <= sh.h && sh.x + w <= S) { const r = { p, x: sh.x, y: sh.y }; sh.x += w; return r; }
      const y = p.shelves.reduce((m, sh) => Math.max(m, sh.y + sh.h), 0);
      if (y + h <= S) { p.shelves.push({ y, h, x: w }); return { p, x: 0, y }; }
    }
    const p = this.page(); p.shelves.push({ y: 0, h, x: w }); return { p, x: 0, y: 0 };
  }
  /** place a texture → { page, x, y, w, h } (canvas pixels, top-left) or null when it can't go in */
  add(tex, night, fit) {
    const key = tex.userData.key; if (this.at.has(key)) return this.at.get(key);
    const img = tex.image, W = img && img.width, H = img && img.height, G = this.G, S = this.S;
    if (!W || !H || W + 2 * G > S / 2 || H + 2 * G > S / 2) { this.at.set(key, null); return null; }
    const pl = this.place(W + 2 * G, Math.ceil((H + 2 * G) / 8) * 8), p = pl.p, x = pl.x + G, y = pl.y + G;
    const g = p.map.getContext('2d');
    const gutters = (ctx, src, w, h, sx = 1) => {
      // fitted decals: the edge pixels stretched outward; tiling textures: the opposite edges (seamless wrap)
      const d = (a, b, c, e, f, h2, i, j) => ctx.drawImage(src, a * sx, b * sx, c * sx, e * sx, f, h2, i, j);
      if (fit) { d(0, 0, 1, h, x - G, y, G, h); d(w - 1, 0, 1, h, x + w, y, G, h); d(0, 0, w, 1, x, y - G, w, G); d(0, h - 1, w, 1, x, y + h, w, G); d(0, 0, 1, 1, x - G, y - G, G, G); d(w - 1, 0, 1, 1, x + w, y - G, G, G); d(0, h - 1, 1, 1, x - G, y + h, G, G); d(w - 1, h - 1, 1, 1, x + w, y + h, G, G); }
      else { d(w - G, 0, G, h, x - G, y, G, h); d(0, 0, G, h, x + w, y, G, h); d(0, h - G, w, G, x, y - G, w, G); d(0, 0, w, G, x, y + h, w, G); d(w - G, h - G, G, G, x - G, y - G, G, G); d(0, h - G, G, G, x + w, y - G, G, G); d(w - G, 0, G, G, x - G, y + h, G, G); d(0, 0, G, G, x + w, y + h, G, G); }
    };
    g.drawImage(img, x, y); gutters(g, img, W, H);
    // emissive: the texture's glowing pixels, at its strength (its map may be at the design size: scaled up)
    const gi = glowInfo(tex, night);
    if (gi && gi.map && gi.map.image) {
      if (!p.em) { p.em = p.mk(0.5); const e = p.em.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, S, S); }
      const e = p.em.getContext('2d'); e.globalAlpha = Math.min(1, gi.k); e.drawImage(gi.map.image, x, y, W, H); e.globalAlpha = 1;
    }
    // roughness (G): the family's, mirror-smooth glass panes
    const f = family(tex), rg = p.rough.getContext('2d');
    rg.fillStyle = `rgb(255,${Math.round(255 * f.rough)},0)`; rg.fillRect(x - G, y - G, W + 2 * G, H + 2 * G);
    if (tex.userData.glass) { rg.fillStyle = 'rgb(255,16,0)'; for (const [gx, gy, gw, gh] of tex.userData.glass) rg.fillRect(x + gx, y + gy, gw, gh); }
    const r = { page: this.pages.indexOf(p), x, y, w: W, h: H, rel: f.relief };
    this.at.set(key, r); return r;
  }
}
const canAtlas = (tex, night) => {
  if (isSolid(tex)) return false;
  const ud = tex.userData || {}, k = String(ud.key || '');
  if (/^dress_ground|^water/.test(k)) return false;
  if (tex.repeat.x !== 1 || tex.repeat.y !== 1 || tex.offset.x || tex.offset.y || tex.flipY === false) return false;
  const gi = glowInfo(tex, night); if (gi && gi.always) return false;
  return !!(tex.image && tex.image.width);
};

/**
 * C: the CityBuilder (its groups: gk → Map(texKey → A { tex, P, N, U, I, solid }), its solid batches);
 * root: the city root; stage; materialFor(tex): the per-texture material for textures kept out of the atlas.
 * → the merged group (added to root)
 */
export function mergeCity(C, root, stage, materialFor) {
  const night = C.night, lite = !!globalThis.TOKON_LITE;
  const out = new THREE.Group(); out.name = 'merged';
  // 1. fitted textures (every use maps 0..1) get stretched gutters, tiling ones wrapped gutters
  const fit = new Map();
  for (const [gk, G] of C.groups) {
    if (mergeKey(gk) === null) continue;
    for (const A of G.values()) {
      const k = A.tex.userData.key; let f = fit.get(k); if (f === undefined) f = true;
      if (f) for (let i = 0; i < A.U.length; i++) { const v = A.U[i]; if (v < -0.002 || v > 1.002) { f = false; break; } }
      fit.set(k, f);
    }
  }
  const atlas = new Atlas(2048, lite ? 2 : 4);
  // biggest first packs tighter
  const texs = new Map(); for (const [gk, G] of C.groups) if (mergeKey(gk) !== null) for (const A of G.values()) if (canAtlas(A.tex, night)) texs.set(A.tex.userData.key, A.tex);
  for (const t of [...texs.values()].sort((a, b) => b.image.height - a.image.height || b.image.width - a.image.width)) atlas.add(t, night, fit.get(t.userData.key));
  // 2. buckets per tile and material
  const B = new Map(), shadow = new Map();
  const bucket = (tile, kind, mk) => { const key = tile + '|' + kind; let b = B.get(key); if (!b) { b = { tile, kind, P: [], N: [], U: [], C: [], D: [], AT: [], RL: [], I: [], ...mk() }; B.set(key, b); } return b; };
  const sbucket = (tile) => { let s = shadow.get(tile); if (!s) shadow.set(tile, (s = { P: [], D: [], I: [] })); return s; };
  const tileOf = (x, z) => Math.floor(x / TILE) + ',' + Math.floor(z / TILE);
  const col = new THREE.Color();
  const push = (b, A, idx, bid, at, c) => {
    const map = new Map();
    for (const i of idx) {
      let j = map.get(i);
      if (j === undefined) {
        j = b.P.length / 3; map.set(i, j);
        b.P.push(A.P[i * 3], A.P[i * 3 + 1], A.P[i * 3 + 2]); b.N.push(A.N[i * 3], A.N[i * 3 + 1], A.N[i * 3 + 2]); b.D.push(bid);
        if (c) b.C.push(...(A.C ? [A.C[i * 3], A.C[i * 3 + 1], A.C[i * 3 + 2]] : [c.r, c.g, c.b]));
        else {
          let u = A.U[i * 2], v = A.U[i * 2 + 1];
          if (at) { if (at.fit) { u = Math.min(0.9995, Math.max(0.0005, u)); v = Math.min(0.9995, Math.max(0.0005, v)); } b.AT.push(at.r[0], at.r[1], at.r[2], at.r[3]); b.RL.push(at.rel); }
          b.U.push(u, v);
        }
      }
      b.I.push(j);
    }
  };
  const pushShadow = (tile, A, idx, bid) => { const s = sbucket(tile), map = new Map(); for (const i of idx) { let j = map.get(i); if (j === undefined) { j = s.P.length / 3; map.set(i, j); s.P.push(A.P[i * 3], A.P[i * 3 + 1], A.P[i * 3 + 2]); s.D.push(bid); } s.I.push(j); } };
  const sources = [];
  for (const [gk, G] of C.groups) { const bid = mergeKey(gk); if (bid !== null) for (const A of G.values()) sources.push({ gk, bid, A }); }
  for (const [gk, S] of (C.solidBatches || new Map())) { const bid = mergeKey(gk); if (bid !== null) sources.push({ gk, bid, A: { P: S.P, N: S.N, C: S.C, I: S.I, solid: true } }); }
  const S = atlas.S;
  for (const { gk, bid, A } of sources) {
    const tex = A.tex, sm = tex ? isSolid(tex) : null;
    let kind, mk, at = null, c = null;
    const r = tex && !sm ? atlas.at.get(tex.userData.key) : null;
    if (!tex || sm) { kind = 'S'; mk = () => ({}); c = sm ? col.set(sm[1]).clone() : new THREE.Color(1, 1, 1); }
    else if (r) {
      kind = 'A' + r.page; mk = () => ({ page: r.page });
      at = { r: [r.x / S, 1 - (r.y + r.h) / S, r.w / S, r.h / S], fit: fit.get(tex.userData.key), rel: r.rel };
    } else { kind = 'T:' + tex.userData.key; mk = () => ({ tex }); }
    const casts = gk !== 'ground' && !!A.solid;
    if (bid >= 0) {
      const b = C.buildings[bid], tile = tileOf(b.x + b.w / 2, b.z + b.d / 2), all = Array.from(A.I);
      push(bucket(tile, kind, mk), A, all, bid, at, c);
      if (casts) pushShadow(tile, A, all, bid);
    } else {
      // ground / skirt / street furniture: triangle by triangle into the tile under its centre
      for (let t = 0; t < A.I.length; t += 3) {
        const i0 = A.I[t], i1 = A.I[t + 1], i2 = A.I[t + 2], cx = (A.P[i0 * 3] + A.P[i1 * 3] + A.P[i2 * 3]) / 3, cz = (A.P[i0 * 3 + 2] + A.P[i1 * 3 + 2] + A.P[i2 * 3 + 2]) / 3, tile = tileOf(cx, cz);
        push(bucket(tile, kind, mk), A, [i0, i1, i2], -1, at, c);
        if (casts) pushShadow(tile, A, [i0, i1, i2], -1);
      }
    }
  }
  // 3. materials (shared by every tile)
  const mats = new Map();
  const tx = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.minFilter = THREE.NearestMipmapLinearFilter; t.magFilter = THREE.NearestFilter; t.anisotropy = 8; return t; };
  const matFor = (b) => {
    let m = mats.get(b.kind); if (m) return m;
    if (b.kind === 'S') m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0, side: THREE.DoubleSide });
    else if (b.kind[0] === 'A') {
      const p = atlas.pages[b.page];
      m = new THREE.MeshStandardMaterial({ map: tx(p.map, true), roughnessMap: tx(p.rough, false), roughness: 1, metalness: 0, side: THREE.DoubleSide, alphaTest: 0.5 });
      m.map.userData.key = 'atlas' + b.page; m.envMapIntensity = 0.8;
      if (p.em) { m.emissive.set(0xffffff); m.emissiveMap = tx(p.em, true); if (stage && stage.glowMat) stage.glowMat(m, 1, false); }
      atlasPatch(m, atlas.S);
    } else m = materialFor(b.tex);
    bidPatch(m); mats.set(b.kind, m); return m;
  };
  // 4. meshes
  for (const b of B.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.N, 3));
    if (b.kind === 'S') g.setAttribute('color', new THREE.Float32BufferAttribute(b.C, 3)); else g.setAttribute('uv', new THREE.Float32BufferAttribute(b.U, 2));
    if (b.kind[0] === 'A') { g.setAttribute('aAt', new THREE.Float32BufferAttribute(b.AT, 4)); g.setAttribute('aRel', new THREE.Float32BufferAttribute(b.RL, 1)); }
    g.setAttribute('aBid', new THREE.Float32BufferAttribute(b.D, 1));
    g.setIndex(b.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(b.I, 1) : new THREE.Uint16BufferAttribute(b.I, 1)); g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, matFor(b)); mesh.castShadow = false; mesh.receiveShadow = true; mesh.userData.merged = true; mesh.name = 'm:' + b.tile + ':' + b.kind.slice(0, 12);
    out.add(mesh);
  }
  for (const [tile, s] of shadow) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(s.P, 3)); g.setAttribute('aBid', new THREE.Float32BufferAttribute(s.D, 1));
    g.setIndex(s.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(s.I, 1) : new THREE.Uint16BufferAttribute(s.I, 1)); g.computeBoundingSphere();
    const px = new THREE.Mesh(g, PROXY_MAT); px.customDepthMaterial = DEPTH; px.castShadow = true; px.receiveShadow = false; px.layers.set(SHADOW_LAYER); px.userData.proxy = true; px.name = 's:' + tile;
    out.add(px);
  }
  out.userData.stats = { meshes: B.size, shadowTiles: shadow.size, atlasPages: atlas.pages.length, atlased: [...atlas.at.values()].filter(Boolean).length, kept: [...B.values()].filter((b) => b.kind[0] === 'T').length };
  root.add(out);
  return out;
}
