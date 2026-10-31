// Static merge: the city's draw-call diet.
// The builder keeps one mesh per (group, texture) so the camera can cut and fade every building storey by storey,
// which costs thousands of draw calls. Most of the time a building is just scenery, so finalize() also builds a
// merged copy of everything static outside: every building's outer walls, façade decals and roof, the ground and
// the skirt, packed into 64 m tiles, one mesh per tile and material:
//  - tiling textures (brick, siding, asphalt…) keep their own material, shared by every tile;
//  - fitted decals (windows, doors, shopfronts, signs: UVs in 0..1) are packed into a few atlas pages with their
//    emissive (lit windows, neon) and roughness (glass panes) twins, so a whole street of windows is one draw;
//  - plain solid-colour parts (trim, sills, bands, the batched solids) become vertex colours on one material.
// Every vertex knows its building (aBid). The cutaway (control.js) shows a building's own groups only while it
// needs them (you're inside, it's fading between you and the camera); those building ids go into HIDE and the
// merged copy collapses their triangles in the vertex shader, in both the colour and the shadow pass.
// Shadows come from one merged caster per tile, drawn only by the shadow cameras (layer 1).
import * as THREE from '../../../vendor/three.module.js';
import { surfaceMaterial, family } from '../render/surface.js';
import { glowInfo } from '../render/glow.js';

export const HIDE_N = 16;
export const HIDE = { value: new Float32Array(HIDE_N).fill(-10) };     // building ids drawn by their own groups right now
export const SHADOW_LAYER = 1;                                         // shadow-only casters (proxies) live here
const TILE = 64;
const EXT = /^b(\d+):(f\d+:(front|back)|roof)$/;
/** the building id a group belongs to (-1: ground / skirt), or null when the group is not merged */
export function mergeKey(gk) { const m = EXT.exec(gk); if (m) return +m[1]; return gk === 'ground' || gk === 'skirt' ? -1 : null; }

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

const SOLID = /^solid(#[0-9a-fA-F]{6})/;
const isSolid = (tex) => SOLID.exec((tex && tex.userData && tex.userData.key) || '');

// ---------------------------------------------------------------- the decal atlas
class Atlas {
  constructor(size, gut) { this.S = size; this.G = gut; this.pages = []; this.at = new Map(); }
  page() {
    // the emissive and roughness pages are half the size of the colour page (same UVs)
    const mk = (k = 1) => { const c = document.createElement('canvas'); c.width = c.height = this.S * k; const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); return c; };
    const p = { map: mk(), em: null, rough: mk(0.5), x: 0, y: 0, rowH: 0, mk };
    const g = p.rough.getContext('2d'); g.fillStyle = 'rgb(255,200,0)'; g.fillRect(0, 0, this.S, this.S);
    this.pages.push(p); return p;
  }
  /** place a texture → { page, x, y, w, h } (canvas pixels, top-left) or null when it can't go in */
  add(tex, night) {
    const key = tex.userData.key; if (this.at.has(key)) return this.at.get(key);
    const img = tex.image, W = img && img.width, H = img && img.height, G = this.G, S = this.S;
    if (!W || !H || W + 2 * G > S / 2 || H + 2 * G > S / 2) { this.at.set(key, null); return null; }
    let p = this.pages[this.pages.length - 1] || this.page();
    if (p.x + W + 2 * G > S) { p.x = 0; p.y += p.rowH; p.rowH = 0; }
    if (p.y + H + 2 * G > S) { p = this.page(); }
    const x = p.x + G, y = p.y + G; p.x += W + 2 * G; p.rowH = Math.max(p.rowH, H + 2 * G);
    // colour, with its edge pixels stretched into the gutter (no bleeding between neighbours in the mipmaps)
    const g = p.map.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(img, x, y);
    g.drawImage(img, 0, 0, 1, H, x - G, y, G, H); g.drawImage(img, W - 1, 0, 1, H, x + W, y, G, H);
    g.drawImage(img, 0, 0, W, 1, x, y - G, W, G); g.drawImage(img, 0, H - 1, W, 1, x, y + H, W, G);
    g.drawImage(img, 0, 0, 1, 1, x - G, y - G, G, G); g.drawImage(img, W - 1, 0, 1, 1, x + W, y - G, G, G); g.drawImage(img, 0, H - 1, 1, 1, x - G, y + H, G, G); g.drawImage(img, W - 1, H - 1, 1, 1, x + W, y + H, G, G);
    // emissive: the texture's glowing pixels, at its strength
    const gi = glowInfo(tex, night);
    if (gi && gi.map && gi.map.image) {
      if (!p.em) { p.em = p.mk(0.5); const e = p.em.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, S, S); }
      const e = p.em.getContext('2d'); e.imageSmoothingEnabled = true; e.globalAlpha = Math.min(1, gi.k); e.drawImage(gi.map.image, x, y, W, H); e.globalAlpha = 1;
    }
    // roughness (G): the family's, mirror-smooth glass panes
    const f = family(tex), rg = p.rough.getContext('2d');
    rg.fillStyle = `rgb(255,${Math.round(255 * f.rough)},0)`; rg.fillRect(x - G, y - G, W + 2 * G, H + 2 * G);
    if (tex.userData.glass) { rg.fillStyle = 'rgb(255,16,0)'; for (const [gx, gy, gw, gh] of tex.userData.glass) rg.fillRect(x + gx, y + gy, gw, gh); }
    const r = { page: this.pages.indexOf(p), x, y, w: W, h: H };
    this.at.set(key, r); return r;
  }
}
const canAtlas = (tex, fit, night) => {
  if (!fit || isSolid(tex)) return false;
  const ud = tex.userData || {}, k = String(ud.key || '');
  if (/^dress_ground|^water/.test(k)) return false;
  if (tex.repeat.x !== 1 || tex.repeat.y !== 1 || tex.offset.x || tex.offset.y || tex.flipY === false) return false;
  const gi = glowInfo(tex, night); if (gi && gi.always) return false;
  return true;
};

/**
 * C: the CityBuilder (its groups: gk → Map(texKey → A { tex, P, N, U, I, solid }), its solid batches);
 * root: the city root; stage. → the merged group (added to root)
 */
export function mergeCity(C, root, stage) {
  const night = C.night, lite = !!globalThis.TOKON_LITE;
  const out = new THREE.Group(); out.name = 'merged';
  // 1. which textures fit an atlas (every use maps 0..1)
  const fit = new Map();
  for (const [gk, G] of C.groups) {
    if (mergeKey(gk) === null) continue;
    for (const A of G.values()) {
      const k = A.tex.userData.key; let f = fit.get(k); if (f === undefined) f = true;
      if (f) for (let i = 0; i < A.U.length; i++) { const v = A.U[i]; if (v < -0.002 || v > 1.002) { f = false; break; } }
      fit.set(k, f);
    }
  }
  const atlas = new Atlas(lite ? 1024 : 2048, lite ? 2 : 4);
  // 2. buckets per tile and material
  const B = new Map(), shadow = new Map();
  const bucket = (tile, kind, mk) => { const key = tile + '|' + kind; let b = B.get(key); if (!b) { b = { tile, kind, P: [], N: [], U: [], C: [], D: [], I: [], ...mk() }; B.set(key, b); } return b; };
  const sbucket = (tile) => { let s = shadow.get(tile); if (!s) shadow.set(tile, (s = { P: [], D: [], I: [] })); return s; };
  const tileOf = (x, z) => Math.floor(x / TILE) + ',' + Math.floor(z / TILE);
  const col = new THREE.Color();
  const push = (b, A, idx, bid, uvT, c) => {
    // idx: the triangle-vertex indices of A to copy (a whole A, or one triangle), re-indexed into b
    const map = new Map();
    for (const i of idx) {
      let j = map.get(i);
      if (j === undefined) {
        j = b.P.length / 3; map.set(i, j);
        b.P.push(A.P[i * 3], A.P[i * 3 + 1], A.P[i * 3 + 2]); b.N.push(A.N[i * 3], A.N[i * 3 + 1], A.N[i * 3 + 2]); b.D.push(bid);
        if (c) b.C.push(...(A.C ? [A.C[i * 3], A.C[i * 3 + 1], A.C[i * 3 + 2]] : [c.r, c.g, c.b]));
        else if (A.U) { const u = A.U[i * 2], v = A.U[i * 2 + 1]; if (uvT) b.U.push(uvT[0] + u * uvT[2], uvT[1] + v * uvT[3]); else b.U.push(u, v); }
      }
      b.I.push(j);
    }
  };
  const pushShadow = (tile, A, idx, bid) => { const s = sbucket(tile), base = s.P.length / 3, map = new Map(); for (const i of idx) { let j = map.get(i); if (j === undefined) { j = s.P.length / 3; map.set(i, j); s.P.push(A.P[i * 3], A.P[i * 3 + 1], A.P[i * 3 + 2]); s.D.push(bid); } s.I.push(j); } return base; };
  const sources = [];
  for (const [gk, G] of C.groups) { const bid = mergeKey(gk); if (bid !== null) for (const A of G.values()) sources.push({ gk, bid, A }); }
  for (const [gk, S] of (C.solidBatches || new Map())) { const bid = mergeKey(gk); if (bid !== null) sources.push({ gk, bid, A: { P: S.P, N: S.N, C: S.C, I: S.I, solid: true }, batch: true }); }
  for (const { gk, bid, A } of sources) {
    const tex = A.tex, sm = tex ? isSolid(tex) : null, solidCol = sm ? col.set(sm[1]).clone() : null;
    let kind, mk, uvT = null, c = null;
    if (!tex || sm) { kind = 'S'; mk = () => ({}); c = solidCol || new THREE.Color(1, 1, 1); }
    else if (canAtlas(tex, fit.get(tex.userData.key), night) && atlas.add(tex, night)) {
      const r = atlas.add(tex, night), S = atlas.S; kind = 'A' + r.page; mk = () => ({ page: r.page });
      uvT = [r.x / S, 1 - (r.y + r.h) / S, r.w / S, r.h / S];
    } else { kind = 'T:' + tex.userData.key; mk = () => ({ tex }); }
    const casts = gk !== 'ground' && !!A.solid;
    if (bid >= 0) {
      const b = C.buildings[bid], tile = tileOf(b.x + b.w / 2, b.z + b.d / 2), all = Array.from(A.I);
      push(bucket(tile, kind, mk), A, all, bid, uvT, c);
      if (casts) pushShadow(tile, A, all, bid);
    } else {
      // ground / skirt: triangle by triangle into the tile under its centre
      for (let t = 0; t < A.I.length; t += 3) {
        const i0 = A.I[t], i1 = A.I[t + 1], i2 = A.I[t + 2], cx = (A.P[i0 * 3] + A.P[i1 * 3] + A.P[i2 * 3]) / 3, cz = (A.P[i0 * 3 + 2] + A.P[i1 * 3 + 2] + A.P[i2 * 3 + 2]) / 3, tile = tileOf(cx, cz);
        push(bucket(tile, kind, mk), A, [i0, i1, i2], -1, uvT, c);
        if (casts) pushShadow(tile, A, [i0, i1, i2], -1);
      }
    }
  }
  // 3. materials (shared by every tile)
  const mats = new Map();
  const glowSetup = (m, gi) => { m.emissive.set(0xffffff); m.emissiveMap = gi.map; if (stage && stage.glowMat) stage.glowMat(m, gi.k, gi.always); else m.emissiveIntensity = gi.k; };
  const matFor = (b) => {
    let m = mats.get(b.kind); if (m) return m;
    if (b.kind === 'S') m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, side: THREE.DoubleSide });
    else if (b.kind[0] === 'A') {
      const p = atlas.pages[b.page], tx = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; return t; };
      m = new THREE.MeshStandardMaterial({ map: tx(p.map, true), roughnessMap: tx(p.rough, false), roughness: 1, metalness: 0, side: THREE.DoubleSide, alphaTest: 0.5 });
      m.map.userData.key = 'atlas' + b.page;
      m.envMapIntensity = 1.3;
      if (p.em) { m.emissive.set(0xffffff); m.emissiveMap = tx(p.em, true); if (stage && stage.glowMat) stage.glowMat(m, 1, false); }
    } else {
      m = surfaceMaterial(b.tex, { side: THREE.DoubleSide });
      const gi = glowInfo(b.tex, night); if (gi) glowSetup(m, gi);
      if (b.tex.userData && b.tex.userData.cutout) m.alphaTest = 0.5;
    }
    bidPatch(m); mats.set(b.kind, m); return m;
  };
  // 4. meshes
  for (const b of B.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.N, 3));
    if (b.kind === 'S') g.setAttribute('color', new THREE.Float32BufferAttribute(b.C, 3)); else g.setAttribute('uv', new THREE.Float32BufferAttribute(b.U, 2));
    g.setAttribute('aBid', new THREE.Float32BufferAttribute(b.D, 1));
    g.setIndex(b.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(b.I, 1) : new THREE.Uint16BufferAttribute(b.I, 1)); g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, matFor(b)); mesh.castShadow = false; mesh.receiveShadow = true; mesh.userData.merged = true; mesh.name = 'm:' + b.tile;
    out.add(mesh);
  }
  for (const [tile, s] of shadow) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(s.P, 3)); g.setAttribute('aBid', new THREE.Float32BufferAttribute(s.D, 1));
    g.setIndex(s.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(s.I, 1) : new THREE.Uint16BufferAttribute(s.I, 1)); g.computeBoundingSphere();
    const px = new THREE.Mesh(g, PROXY_MAT); px.customDepthMaterial = DEPTH; px.castShadow = true; px.receiveShadow = false; px.layers.set(SHADOW_LAYER); px.userData.proxy = true; px.name = 's:' + tile;
    out.add(px);
  }
  out.userData.stats = { meshes: B.size, shadowTiles: shadow.size, atlasPages: atlas.pages.length, atlased: [...atlas.at.values()].filter(Boolean).length };
  root.add(out);
  return out;
}
