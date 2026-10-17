// Diorama environment builder: turns a map definition + grid into meshes.
//   ground  — pixel-art tile tops with corner AO, stepped sides, diorama cut edges
//   water   — stylised animated surface (canals, ponds, waterfalls' pools)
//   buildings — box volumes clad in facade bays (lit windows at night), parapets,
//               pitched kawara roofs, rooftop clutter, neon signs
//   props   — voxel props (instanced when static), destructible, light emitters
import * as THREE from '../../vendor/three.module.js';
import { tileDef } from '../world/tiles.js';
import { tileAtlas, tileCell, tileUV, facadeAtlas, facadeCell, facadeUV, FACADE_NAMES, signTexture } from './textures.js';
import { toonMaterial, glowMaterial, shared } from './materials.js';
import { getTemplate, instantiate } from './model.js';
import { hash3 } from '../core/rng.js';
import { EMITTERS } from './emitters.js';
const _cc = new Map();
function colorArr(hex) { let a = _cc.get(hex); if (!a) { const c = new THREE.Color(hex); a = [c.r * 1.6, c.g * 1.6, c.b * 1.6, 1]; _cc.set(hex, a); } return a; }
import { blockRect, blockCircle } from '../world/map.js';

const BASE_DEPTH = -2.6;

class Geo {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.i = []; this.v = 0; }
  quad(a, b, c, d, n, uv, col = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]) {
    // a,b,c,d counter-clockwise viewed from the normal side; uv = [u0,v0,u1,v1] mapped a(u0,v0) b(u1,v0) c(u1,v1) d(u0,v1)
    this.p.push(...a, ...b, ...c, ...d);
    for (let k = 0; k < 4; k++) this.n.push(n[0], n[1], n[2]);
    this.uv.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[3]);
    this.c.push(...col);
    const v = this.v; this.i.push(v, v + 1, v + 2, v, v + 2, v + 3); this.v += 4;
  }
  build() {
    if (!this.v) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.v > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere();
    return g;
  }
}
const col4 = (r, g, b) => [r, g, b, r, g, b, r, g, b, r, g, b];
function rotUV(uv, rot) { // rotate tile UV in 90° steps by permuting corners
  if (!rot) return uv;
  return { rot, uv };
}

// ------------------------------------------------------------------ ground
function buildGround(def, g, occ) {
  const geo = new Geo();
  const W = g.w, Hh = g.h;
  const hAt = (i, j) => (g.inb(i, j) && !tileDef(g.t[g.idx(i, j)]).void ? g.hgt[g.idx(i, j)] : BASE_DEPTH);
  const occAt = (i, j) => (g.inb(i, j) ? Math.max(hAt(i, j), occ[g.idx(i, j)]) : BASE_DEPTH);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const k = g.idx(i, j), ch = g.t[k], d = tileDef(ch);
    if (d.void) continue;
    const h = g.hgt[k] + (d.water ? -0.15 : 0);
    const variant = Math.floor(hash3(i, j, 77) * 3);
    const [u0, v0, u1, v1] = tileUV(tileCell(d.tex, variant));
    // corner AO from taller neighbours (buildings, raised tiles)
    const cornerAO = (ci, cj) => {
      let n = 0;
      for (const [di, dj] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const oi = ci + di, oj = cj + dj; if (oi === i && oj === j) continue; if (occAt(oi, oj) > h + 0.3) n++; }
      return [1, 0.8, 0.68, 0.6][Math.min(3, n)];
    };
    const a = cornerAO(i, j + 1), b = cornerAO(i + 1, j + 1), c = cornerAO(i + 1, j), dd = cornerAO(i, j);
    // top quad, normal +y; vertices CCW from above: (i,j+1) (i+1,j+1) (i+1,j) (i,j)
    const rot = g.rot[k] || 0;
    let uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    for (let r = 0; r < rot; r++) uvs = [uvs[3], uvs[0], uvs[1], uvs[2]];
    geo.p.push(i, h, j + 1, i + 1, h, j + 1, i + 1, h, j, i, h, j);
    for (let q = 0; q < 4; q++) geo.n.push(0, 1, 0);
    for (const uv of uvs) geo.uv.push(uv[0], uv[1]);
    geo.c.push(a, a, a, b, b, b, c, c, c, dd, dd, dd);
    const v = geo.v; geo.i.push(v, v + 1, v + 2, v, v + 2, v + 3); geo.v += 4;
    // sides toward lower neighbours
    const sides = [[0, 1, [i, j + 1], [i + 1, j + 1], [0, 0, 1]], [0, -1, [i + 1, j], [i, j], [0, 0, -1]], [1, 0, [i + 1, j + 1], [i + 1, j], [1, 0, 0]], [-1, 0, [i, j], [i, j + 1], [-1, 0, 0]]];
    for (const [di, dj, p0, p1, n] of sides) {
      const ni = i + di, nj = j + dj;
      const nh = hAt(ni, nj) + (g.inb(ni, nj) && tileDef(g.t[g.idx(ni, nj)]).water ? -0.15 : 0);
      if (nh >= h - 0.01) continue;
      const edge = !g.inb(ni, nj) || tileDef(g.t[g.idx(ni, nj)]).void;
      let y = h;
      let seg = 0;
      while (y > nh + 0.001) {
        const y0 = Math.max(nh, y - 1);
        let tex = d.side || 'side_dirt';
        if (edge && seg > 0) tex = 'side_dirt';
        if (edge && seg === 0 && (d.side === 'side_soil')) tex = 'side_soil';
        const [s0, t0, s1, t1] = tileUV(tileCell(tex, Math.floor(hash3(i, j, seg + 5) * 3)));
        const tt = t0 + (t1 - t0) * (1 - (y - y0));
        const shadeK = 0.92 - seg * 0.06;
        // quad: bottom-left, bottom-right, top-right, top-left (viewed from outside)
        geo.quad([p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y, p1[1]], [p0[0], y, p0[1]], n, [s0, t1 - (t1 - t0) * (y - y0), s1, t1], col4(shadeK, shadeK, shadeK));
        y = y0; seg++;
        if (seg > 8) break;
      }
    }
  }
  return geo.build();
}

// ------------------------------------------------------------------ water
const WATER_V = /* glsl */`
varying vec3 vW; varying float vDepth;
attribute float depth;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vDepth = depth; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WATER_F = /* glsl */`
uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform float uNight; uniform vec3 uNeon;
varying vec3 vW; varying float vDepth;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 p = floor(vW.xz * 16.0) / 16.0;          // pixel-art quantised
  float t = uTime;
  float w = sin(p.x * 2.1 + t * 1.3) * 0.5 + sin(p.y * 1.7 - t * 1.1) * 0.5 + sin((p.x + p.y) * 3.3 + t * 2.0) * 0.25;
  vec3 col = mix(uShallow, uDeep, clamp(vDepth, 0.0, 1.0));
  col = mix(col, uSky, 0.18 + 0.1 * w);
  // ripple highlights (crisp bands)
  float band = step(0.82, fract(w * 0.9 + p.x * 0.05));
  col += vec3(0.55, 0.75, 0.9) * band * 0.35 * (1.0 - uNight * 0.5);
  // sparkles
  float sp = step(0.985, h2(floor(vW.xz * 8.0) + floor(t * 3.0)));
  col += vec3(1.0) * sp * 0.6;
  // neon reflections at night (streaky)
  float streak = smoothstep(0.6, 1.0, sin(vW.x * 1.3 + w) * 0.5 + 0.5) * smoothstep(0.3, 1.0, sin(vW.z * 0.7 + t * 0.4) * 0.5 + 0.5);
  col += uNeon * streak * uNight * 0.9;
  // foam at shores
  col = mix(col, vec3(0.95, 0.98, 1.0), step(0.97, 1.0 - vDepth) * 0.6);
  gl_FragColor = vec4(col, 0.9);
  #include <colorspace_fragment>
}`;
function buildWater(def, g) {
  const geo = new Geo();
  const depth = [];
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
    const k = g.idx(i, j), d = tileDef(g.t[k]);
    if (!d.water) continue;
    const y = d.deep ? -0.55 : d.shallow ? -0.06 : -0.3;
    const dep = (ii, jj) => { let n = 0; for (const [di, dj] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) { const a = ii + di, b = jj + dj; if (g.inb(a, b) && tileDef(g.t[g.idx(a, b)]).water) n++; } return n / 4; };
    geo.p.push(i, y, j + 1, i + 1, y, j + 1, i + 1, y, j, i, y, j);
    for (let q = 0; q < 4; q++) { geo.n.push(0, 1, 0); geo.uv.push(0, 0); geo.c.push(1, 1, 1); }
    depth.push(dep(i, j + 1), dep(i + 1, j + 1), dep(i + 1, j), dep(i, j));
    const v = geo.v; geo.i.push(v, v + 1, v + 2, v, v + 2, v + 3); geo.v += 4;
  }
  const bg = geo.build();
  if (!bg) return null;
  bg.setAttribute('depth', new THREE.Float32BufferAttribute(depth, 1));
  const uniforms = { uTime: shared.uTime, uDeep: { value: new THREE.Color(def.water?.deep || 0x1b5f8f) }, uShallow: { value: new THREE.Color(def.water?.shallow || 0x4fc0e0) }, uSky: { value: new THREE.Color(0x9fd8ff) }, uNight: { value: 0 }, uNeon: { value: new THREE.Color(def.water?.neon || 0xff4fc8) } };
  const m = new THREE.Mesh(bg, new THREE.ShaderMaterial({ vertexShader: WATER_V, fragmentShader: WATER_F, uniforms, transparent: true, depthWrite: false }));
  m.renderOrder = 2;
  m.userData.uniforms = uniforms;
  return m;
}

// ------------------------------------------------------------------ buildings
const STYLES = {
  apartment: { upper: ['balcony', 'balcony', 'ac', 'window'], ground: ['door', 'shutter', 'wall'], roof: 'flat', tint: ['#f2ead8', '#e8eef2', '#f6e0d0', '#dfe8d8', '#ece2f0'] },
  office: { upper: ['glass'], ground: ['door', 'glass'], roof: 'flat', tint: ['#e8f0ff', '#d8e4f0', '#f0f0f6'] },
  shop: { upper: ['window', 'window2', 'ac', 'tile_window'], ground: ['shop', 'shop', 'door'], roof: 'flat', tint: ['#fff4e0', '#ffe8e8', '#e8f6ff', '#fff8d8', '#f0e8ff'] },
  brick: { upper: ['brick_window', 'brick'], ground: ['shop', 'door'], roof: 'flat', tint: ['#ffffff', '#f0e8e0'] },
  tile: { upper: ['tile_window', 'tile'], ground: ['shop', 'shutter'], roof: 'flat', tint: ['#f6f0e6', '#e6eef6', '#f2e6e6'] },
  machiya: { upper: ['wood'], ground: ['wood', 'shoji'], roof: 'tile', tint: ['#ffffff'] },
  kura: { upper: ['white_window', 'white_wall'], ground: ['plaster'], roof: 'tile', tint: ['#ffffff'] },
  temple: { upper: ['wood'], ground: ['shoji', 'wood'], roof: 'tile', tint: ['#ffffff'] },
  concrete: { upper: ['concrete', 'window2'], ground: ['shutter', 'concrete'], roof: 'flat', tint: ['#ffffff', '#e8e8f0'] },
  dojo: { upper: ['wood'], ground: ['shoji', 'wood', 'shoji'], roof: 'tile', tint: ['#ffffff'] },
  tower: { upper: ['glass', 'glass', 'window2'], ground: ['door', 'glass'], roof: 'flat', tint: ['#dfe9ff', '#e9f0f8'] },
  stone: { upper: ['stone_base'], ground: ['stone_base'], roof: 'flat', tint: ['#ffffff'] },
};

function buildBuildings(def, g, out) {
  const geo = new Geo();
  const roofGeo = new Geo();
  const signs = [];
  const rooftop = [];
  for (const [bi, b] of (def.buildings || []).entries()) {
    const st = STYLES[b.style] || STYLES.apartment;
    const floors = b.floors || Math.max(1, Math.round((b.h || 6) / 3));
    const H = floors * 3;
    const y0 = b.y ?? (g.inb(Math.floor(b.x), Math.floor(b.z)) ? g.hgt[g.idx(Math.floor(b.x), Math.floor(b.z))] : 0);
    const tintHex = b.color || st.tint[Math.floor(hash3(bi, 3, 9) * st.tint.length)];
    const tint = new THREE.Color(tintHex);
    const front = b.front || 's';
    const x0 = b.x, z0 = b.z, x1 = b.x + b.w, z1 = b.z + b.d;
    blockRect(g, x0, z0, x1, z1);
    out.footprints.push({ x0, z0, x1, z1, h: y0 + H });
    // walls: side → [p0, p1, normal, key]
    const walls = [['s', [x0, z1], [x1, z1], [0, 0, 1]], ['n', [x1, z0], [x0, z0], [0, 0, -1]], ['e', [x1, z1], [x1, z0], [1, 0, 0]], ['w', [x0, z0], [x0, z1], [-1, 0, 0]]];
    for (const [side, p0, p1, n] of walls) {
      const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const cols = Math.max(1, Math.round(L / 2));
      const bw = L / cols;
      const isFront = side === front || (b.fronts && b.fronts.includes(side));
      for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
        const hsh = hash3(bi * 7 + c, f, side.charCodeAt(0));
        let name;
        if (f === 0) name = isFront ? (b.ground || st.ground[Math.floor(hsh * st.ground.length)]) : (st.style === 'machiya' ? 'wood' : st.upper.includes('glass') ? 'glass' : (st.ground.includes('plaster') ? 'plaster' : 'wall'));
        else name = (b.upper ? b.upper[Math.floor(hsh * b.upper.length)] : st.upper[Math.floor(hsh * st.upper.length)]);
        if (f === 0 && !isFront && b.style !== 'office' && b.style !== 'tower') name = hsh > 0.6 ? (st.ground.includes('plaster') ? 'plaster' : 'shutter') : name;
        if (b.style === 'stone') name = 'stone_base';
        if (!FACADE_NAMES.includes(name)) name = 'wall';
        const uv = facadeUV(facadeCell(name, Math.floor(hash3(bi, c * 3 + f, 5) * 3)));
        const t0 = c / cols, t1 = (c + 1) / cols;
        const ax = p0[0] + (p1[0] - p0[0]) * t0, az = p0[1] + (p1[1] - p0[1]) * t0;
        const bx = p0[0] + (p1[0] - p0[0]) * t1, bz = p0[1] + (p1[1] - p0[1]) * t1;
        const ya = y0 + f * 3, yb = ya + 3;
        const k = 0.94 + hash3(bi, f, 1) * 0.06;
        const sideShade = side === 'n' || side === 'w' ? 0.96 : 1;
        geo.quad([ax, ya, az], [bx, ya, bz], [bx, yb, bz], [ax, yb, az], n, uv, col4(tint.r * k * sideShade, tint.g * k * sideShade, tint.b * k * sideShade));
      }
    }
    // roof
    const roof = b.roof || st.roof;
    if (roof === 'flat') {
      const cuv = facadeUV(facadeCell('roof_flat', bi % 3));
      for (let x = x0; x < x1 - 1e-6; x += 2) for (let z = z0; z < z1 - 1e-6; z += 3) {
        const xa = x, xb = Math.min(x1, x + 2), za = z, zb = Math.min(z1, z + 3);
        const uv = [cuv[0], cuv[1], cuv[0] + (cuv[2] - cuv[0]) * (xb - xa) / 2, cuv[1] + (cuv[3] - cuv[1]) * (zb - za) / 3];
        roofGeo.quad([xa, y0 + H, zb], [xb, y0 + H, zb], [xb, y0 + H, za], [xa, y0 + H, za], [0, 1, 0], uv, col4(0.95, 0.95, 0.97));
      }
      // parapet (thin raised border): four boxes as quads (outer + top)
      const ph = 0.35, pt = 0.18, top = y0 + H + ph;
      const wuv = facadeUV(facadeCell('concrete', 0));
      const pc = col4(tint.r * 0.9, tint.g * 0.9, tint.b * 0.9);
      const band = (ax, az, bx, bz, n) => geo.quad([ax, y0 + H, az], [bx, y0 + H, bz], [bx, top, bz], [ax, top, az], n, [wuv[0], wuv[1], wuv[2], wuv[1] + (wuv[3] - wuv[1]) * 0.12], pc);
      band(x0, z1, x1, z1, [0, 0, 1]); band(x1, z0, x0, z0, [0, 0, -1]); band(x1, z1, x1, z0, [1, 0, 0]); band(x0, z0, x0, z1, [-1, 0, 0]);
      const tuv = [wuv[0], wuv[1], wuv[2], wuv[1] + (wuv[3] - wuv[1]) * 0.05];
      roofGeo.quad([x0, top, z1], [x1, top, z1], [x1, top, z1 - pt], [x0, top, z1 - pt], [0, 1, 0], tuv, pc);
      roofGeo.quad([x0, top, z0 + pt], [x1, top, z0 + pt], [x1, top, z0], [x0, top, z0], [0, 1, 0], tuv, pc);
      roofGeo.quad([x1 - pt, top, z1], [x1, top, z1], [x1, top, z0], [x1 - pt, top, z0], [0, 1, 0], tuv, pc);
      roofGeo.quad([x0, top, z1], [x0 + pt, top, z1], [x0 + pt, top, z0], [x0, top, z0], [0, 1, 0], tuv, pc);
      // inner parapet faces
      band(x1, z1 - pt, x0, z1 - pt, [0, 0, -1]); band(x0, z0 + pt, x1, z0 + pt, [0, 0, 1]);
      // rooftop clutter
      if (b.clutter !== false) {
        const n = Math.floor(1 + hash3(bi, 9, 9) * 3);
        for (let q = 0; q < n; q++) {
          const kind = ['ac_unit', 'water_tank', 'antenna', 'ac_unit', 'solar_panel'][Math.floor(hash3(bi, q, 13) * 5)];
          rooftop.push([kind, x0 + 1 + hash3(bi, q, 14) * Math.max(0.1, b.w - 2), z0 + 1 + hash3(bi, q, 15) * Math.max(0.1, b.d - 2), Math.floor(hash3(bi, q, 16) * 4) * 90, 1, y0 + H]);
        }
      }
    } else {
      // pitched kawara roof along the long axis with overhang
      const kind = roof === 'green' ? 'roof_green' : roof === 'red' ? 'roof_red' : 'roof_tile';
      const ruv = facadeUV(facadeCell(kind, 0));
      const ov = 0.6, rise = Math.min(b.w, b.d) * 0.42;
      const alongX = b.w >= b.d;
      const ya = y0 + H;
      const rc = col4(1, 1, 1);
      if (alongX) {
        const zm = (z0 + z1) / 2, xa = x0 - ov, xb = x1 + ov;
        const nz1 = new THREE.Vector3(0, b.d / 2 + ov, rise).normalize(), nz0 = new THREE.Vector3(0, b.d / 2 + ov, -rise).normalize();
        roofGeo.quad([xa, ya - 0.25, z1 + ov], [xb, ya - 0.25, z1 + ov], [xb, ya + rise, zm], [xa, ya + rise, zm], [nz1.x, nz1.y, nz1.z], [ruv[0], ruv[1], ruv[2] * 0 + ruv[0] + (ruv[2] - ruv[0]) * Math.min(1, (xb - xa) / 2), ruv[3]], rc);
        roofGeo.quad([xb, ya - 0.25, z0 - ov], [xa, ya - 0.25, z0 - ov], [xa, ya + rise, zm], [xb, ya + rise, zm], [nz0.x, nz0.y, nz0.z], [ruv[0], ruv[1], ruv[0] + (ruv[2] - ruv[0]) * Math.min(1, (xb - xa) / 2), ruv[3]], rc);
        // gables
        const wuv = facadeUV(facadeCell(b.style === 'kura' ? 'white_wall' : 'wood', 0));
        const gc = col4(tint.r * 0.9, tint.g * 0.9, tint.b * 0.9);
        for (const [x, nx] of [[x1, 1], [x0, -1]]) {
          geo.p.push(x, ya, nx > 0 ? z1 : z0, x, ya, nx > 0 ? z0 : z1, x, ya + rise, zm);
          for (let q = 0; q < 3; q++) geo.n.push(nx, 0, 0);
          geo.uv.push(wuv[0], wuv[1], wuv[2], wuv[1], (wuv[0] + wuv[2]) / 2, wuv[3]);
          geo.c.push(...gc.slice(0, 9));
          geo.i.push(geo.v, geo.v + 1, geo.v + 2); geo.v += 3;
        }
      } else {
        const xm = (x0 + x1) / 2, za = z0 - ov, zb = z1 + ov;
        const nx1 = new THREE.Vector3(rise, b.w / 2 + ov, 0).normalize(), nx0 = new THREE.Vector3(-rise, b.w / 2 + ov, 0).normalize();
        roofGeo.quad([x1 + ov, ya - 0.25, zb], [x1 + ov, ya - 0.25, za], [xm, ya + rise, za], [xm, ya + rise, zb], [nx1.x, nx1.y, nx1.z], [ruv[0], ruv[1], ruv[0] + (ruv[2] - ruv[0]) * Math.min(1, (zb - za) / 2), ruv[3]], rc);
        roofGeo.quad([x0 - ov, ya - 0.25, za], [x0 - ov, ya - 0.25, zb], [xm, ya + rise, zb], [xm, ya + rise, za], [nx0.x, nx0.y, nx0.z], [ruv[0], ruv[1], ruv[0] + (ruv[2] - ruv[0]) * Math.min(1, (zb - za) / 2), ruv[3]], rc);
        const wuv = facadeUV(facadeCell(b.style === 'kura' ? 'white_wall' : 'wood', 0));
        const gc = col4(tint.r * 0.9, tint.g * 0.9, tint.b * 0.9);
        for (const [z, nz] of [[z1, 1], [z0, -1]]) {
          geo.p.push(nz > 0 ? x0 : x1, ya, z, nz > 0 ? x1 : x0, ya, z, xm, ya + rise, z);
          for (let q = 0; q < 3; q++) geo.n.push(0, 0, nz);
          geo.uv.push(wuv[0], wuv[1], wuv[2], wuv[1], (wuv[0] + wuv[2]) / 2, wuv[3]);
          geo.c.push(...gc.slice(0, 9));
          geo.i.push(geo.v, geo.v + 1, geo.v + 2); geo.v += 3;
        }
      }
    }
    // signs
    for (const s of b.signs || (b.sign ? [b.sign] : [])) signs.push({ s, b, y0, H, bi });
  }
  return { walls: geo.build(), roofs: roofGeo.build(), signs, rooftop };
}

function buildSigns(list, group, lights) {
  const plane = new THREE.PlaneGeometry(1, 1);
  const out = [];
  for (const { s, b, y0, H, bi } of list) {
    const tex = signTexture(s.text, { color: s.color, bg: s.bg, vertical: s.vertical });
    const mat = glowMaterial({ vertexColors: false, map: tex, color: 0xffffff });
    mat.color.setScalar(s.intensity ?? 1.6);
    const m = new THREE.Mesh(plane, mat);
    const tw = tex ? tex.userData.w : (s.vertical ? 1.5 : String(s.text).length * 0.8 + 1), th = tex ? tex.userData.h : (s.vertical ? String(s.text).length + 1 : 1.6);
    const sc = s.scale || (s.vertical ? 0.9 : 0.75);
    m.scale.set(tw * sc, th * sc, 1);
    const side = s.side || b.front || 's';
    const y = y0 + (s.y ?? (s.vertical ? Math.min(H - th * sc / 2 - 0.3, 3 + th * sc / 2) : 3.0));
    const along = s.at ?? 0.5;
    if (s.vertical) {
      // blade sign perpendicular to the wall, at a corner
      const off = 0.65;
      if (side === 's') { m.position.set(b.x + b.w * along, y, b.z + b.d + off); m.rotation.y = Math.PI / 2; }
      else if (side === 'n') { m.position.set(b.x + b.w * along, y, b.z - off); m.rotation.y = Math.PI / 2; }
      else if (side === 'e') { m.position.set(b.x + b.w + off, y, b.z + b.d * along); m.rotation.y = 0; }
      else { m.position.set(b.x - off, y, b.z + b.d * along); m.rotation.y = 0; }
      const back = m.clone(); back.rotation.y += Math.PI; group.add(back);
    } else {
      const eps = 0.06;
      if (side === 's') { m.position.set(b.x + b.w * along, y, b.z + b.d + eps); }
      else if (side === 'n') { m.position.set(b.x + b.w * along, y, b.z - eps); m.rotation.y = Math.PI; }
      else if (side === 'e') { m.position.set(b.x + b.w + eps, y, b.z + b.d * along); m.rotation.y = Math.PI / 2; }
      else { m.position.set(b.x - eps, y, b.z + b.d * along); m.rotation.y = -Math.PI / 2; }
    }
    group.add(m);
    const c = new THREE.Color(s.color || '#ff5ac8');
    lights.push({ pos: [m.position.x, m.position.y, m.position.z], color: c, intensity: 5, range: 7, night: true });
    out.push({ mesh: m, flicker: s.flicker ?? (hash3(bi, 1, 2) < 0.15), phase: hash3(bi, 2, 3) * 10, base: s.intensity ?? 1.6 });
  }
  return out;
}

// ------------------------------------------------------------------ props
let PROP_LIB = null; // { DESIGNS, PROP_META }
export function setPropLibrary(lib) { PROP_LIB = lib; }
const FALLBACK = { vs: 0.1, arch: 'static', pal: { a: '#c8b8a0' }, parts: [{ n: 'body', p: [0, 0, 0], s: [['box', [0, 0.4, 0], [0.4, 0.4, 0.4], 'a']] }] };

// Wind sway for instanced prop parts, done in the vertex shader (rotation about
// the part pivot; per-instance phase from its world position).
const SWAY_AXIS = { x: 0, z: 1, y: 2 };
function withSway(m, sw, baseKey) {
  const prev = m.onBeforeCompile;
  const u = { uSwayAmp: { value: sw.amp ?? 0.1 }, uSwayFreq: { value: sw.freq ?? 1 }, uSwayPhase: { value: sw.phase ?? 0 }, uSwayAxis: { value: SWAY_AXIS[sw.axis || 'z'] ?? 1 }, uSwayTime: shared.uTime };
  m.onBeforeCompile = (sh) => {
    if (prev) prev(sh);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uSwayAmp; uniform float uSwayFreq; uniform float uSwayPhase; uniform float uSwayAxis; uniform float uSwayTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float swPh = uSwayPhase;
        #ifdef USE_INSTANCING
          swPh += dot(instanceMatrix[3].xz, vec2(0.37, 0.53));
        #endif
        float swA = sin(uSwayTime * uSwayFreq * 3.14159 + swPh) * uSwayAmp;
        float swC = cos(swA), swS = sin(swA);
        if (uSwayAxis < 0.5) transformed.yz = vec2(transformed.y * swC - transformed.z * swS, transformed.y * swS + transformed.z * swC);
        else if (uSwayAxis < 1.5) transformed.xy = vec2(transformed.x * swC - transformed.y * swS, transformed.x * swS + transformed.y * swC);
        else transformed.xz = vec2(transformed.x * swC - transformed.z * swS, transformed.x * swS + transformed.z * swC);`);
  };
  const k = m.customProgramCacheKey ? m.customProgramCacheKey() : baseKey;
  m.customProgramCacheKey = () => k + '|sway';
  return m;
}
const _pm = new THREE.Matrix4(), _pv = new THREE.Vector3();

function buildProps(def, g, extra, env, propShadows = true) {
  const group = new THREE.Group();
  const lib = PROP_LIB || { DESIGNS: {}, PROP_META: {} };
  const list = [...(def.props || []), ...extra];
  const byType = new Map();
  for (const p of list) { const [id] = p; if (!byType.has(id)) byType.set(id, []); byType.get(id).push(p); }
  const lit = toonMaterial({ rim: 0.05 });
  const glow = glowMaterial();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), e = new THREE.Euler();
  for (const [id, items] of byType) {
    const design = lib.DESIGNS[id] || FALLBACK;
    const meta = Object.assign({ footprint: [0.8, 0.8], solid: true, destructible: false, hp: 0, debris: ['#8a7a6a'] }, lib.PROP_META[id] || {});
    let tpl;
    try { tpl = getTemplate(design, 'prop:' + (lib.DESIGNS[id] ? id : '_fallback')); } catch (err) { console.warn('prop build failed', id, err); tpl = getTemplate(FALLBACK, 'prop:_fallback'); }
    // only props with spinning parts (windmills, rotors, wheels) need full rigs;
    // everything else is instanced per part, with sway done on the GPU
    const animated = tpl.parts.some((p) => p.spin);
    // small, non-solid ground cover (grass, crops, reeds, flowers) skips the shadow pass
    // (lower quality: only tall props like trees and lamps cast)
    const tall = (tpl.bounds && !tpl.bounds.isEmpty() ? tpl.bounds.max.y : 1) > 2.4;
    const castsShadow = (meta.solid !== false || meta.footprint[0] * meta.footprint[1] > 1.6) && (propShadows || tall);
    let inst = null;
    if (!animated) {
      inst = { parts: [] };
      for (const part of tpl.parts) {
        if (part.hide) continue;
        const off = new THREE.Matrix4().makeTranslation(part.pivot[0], part.pivot[1], part.pivot[2]);
        const litM = part.sway ? withSway(toonMaterial({ rim: 0.05 }), part.sway, 'toon') : lit;
        const glowM = part.sway ? withSway(glowMaterial(), part.sway, 'glow') : glow;
        if (part.lit) { const im = new THREE.InstancedMesh(part.lit, litM, items.length); im.castShadow = castsShadow; im.receiveShadow = true; group.add(im); inst.parts.push({ m: im, off }); }
        if (part.glow) { const im = new THREE.InstancedMesh(part.glow, glowM, items.length); group.add(im); inst.parts.push({ m: im, off }); }
      }
    }
    items.forEach((it, n) => {
      const [, x, z, rotDeg = 0, scale = 1, yOver] = it;
      const y = yOver ?? (g.inb(Math.floor(x), Math.floor(z)) ? g.hgt[g.idx(Math.floor(x), Math.floor(z))] : 0);
      const rot = (rotDeg * Math.PI) / 180;
      const rec = { id, x, z, y, rot, scale, meta, alive: true, hp: meta.hp, key: id + '@' + x.toFixed(1) + ',' + z.toFixed(1) };
      e.set(0, rot, 0); q.setFromEuler(e); s3.setScalar(scale); p3.set(x, y, z);
      m4.compose(p3, q, s3);
      rec.matrix = m4.clone();
      // static particle emitters (petals, steam, campfire smoke…)
      for (const f of tpl.fx || []) {
        const part = tpl.parts.find((pp) => pp.name === f.part) || { pivot: [0, 0, 0] };
        _pv.set(part.pivot[0] + f.local[0], part.pivot[1] + f.local[1], part.pivot[2] + f.local[2]).applyMatrix4(m4);
        env.emitters.push({ rec, pos: [_pv.x, _pv.y, _pv.z], type: f.type, rate: f.rate ?? 1, scale: (f.scale ?? 1) * scale, color: f.color || null, acc: Math.random() });
      }
      if (inst) {
        for (const ip of inst.parts) { _pm.multiplyMatrices(m4, ip.off); ip.m.setMatrixAt(n, _pm); }
        rec.inst = inst; rec.index = n;
      } else {
        const obj = instantiate(tpl, { rim: 0.05, shadow: true });
        obj.position.set(x, y, z); obj.rotation.y = rot; obj.scale.setScalar(scale);
        obj.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
        group.add(obj);
        rec.obj = obj;
      }
      // navigation footprint (rotated)
      if (meta.solid !== false && yOver == null) {
        const [fw, fd] = meta.footprint;
        const sw = Math.abs(Math.cos(rot)) * fw + Math.abs(Math.sin(rot)) * fd, sd = Math.abs(Math.sin(rot)) * fw + Math.abs(Math.cos(rot)) * fd;
        if (meta.round) blockCircle(g, x, z, Math.max(sw, sd) * scale / 2);
        else if (sw * scale > 0.3 && sd * scale > 0.3) blockRect(g, x - (sw * scale) / 2 + 0.15, z - (sd * scale) / 2 + 0.15, x + (sw * scale) / 2 - 0.15, z + (sd * scale) / 2 - 0.15);
      }
      if (meta.light) env.lights.push({ pos: [x, y + (meta.light.y ?? 2) * scale, z], color: new THREE.Color(meta.light.color || '#ffd890'), intensity: meta.light.intensity ?? 4, range: meta.light.range ?? 6, night: meta.light.night !== false });
      env.props.push(rec);
    });
    if (inst) for (const ip of inst.parts) { ip.m.instanceMatrix.needsUpdate = true; ip.m.computeBoundingSphere(); }
  }
  return group;
}

// ------------------------------------------------------------------ public
export function buildEnvironment(def, g, opts = {}) {
  const env = { group: new THREE.Group(), props: [], lights: [], footprints: [], signs: [], water: null, def, grid: g, emissiveMats: [], time: 0, emitters: [] };
  env.group.name = 'env:' + def.id;
  // buildings first (blocks nav + occluders for ground AO)
  const bres = buildBuildings(def, g, env);
  const occ = new Float32Array(g.w * g.h).fill(-10);
  for (const f of env.footprints) for (let j = Math.floor(f.z0); j < Math.ceil(f.z1); j++) for (let i = Math.floor(f.x0); i < Math.ceil(f.x1); i++) if (g.inb(i, j)) occ[g.idx(i, j)] = f.h;
  const groundGeo = buildGround(def, g, occ);
  const tex = opts.textures === false ? null : tileAtlas();
  if (groundGeo) {
    const m = new THREE.Mesh(groundGeo, toonMaterial({ map: tex, rim: 0 }));
    m.receiveShadow = true; m.name = 'ground';
    env.group.add(m); env.ground = m;
  }
  const water = buildWater(def, g);
  if (water) { env.group.add(water); env.water = water; }
  const fac = opts.textures === false ? { map: null, emissive: null } : facadeAtlas();
  if (bres.walls) {
    const mat = toonMaterial({ map: fac.map, emissiveMap: fac.emissive, emissive: 0xffffff, emissiveIntensity: 1, fade: true });
    const m = new THREE.Mesh(bres.walls, mat); m.castShadow = true; m.receiveShadow = true; m.name = 'buildings';
    env.group.add(m); env.emissiveMats.push(mat); env.buildings = m;
  }
  if (bres.roofs) {
    const mat = toonMaterial({ map: fac.map, fade: true });
    mat.side = THREE.DoubleSide;
    const m = new THREE.Mesh(bres.roofs, mat); m.castShadow = true; m.receiveShadow = true; m.name = 'roofs';
    env.group.add(m);
  }
  const signGroup = new THREE.Group();
  env.signs = buildSigns(bres.signs, signGroup, env.lights);
  env.group.add(signGroup);
  env.propGroup = buildProps(def, g, bres.rooftop, env, opts.propShadows !== false);
  env.group.add(env.propGroup);
  for (const l of def.lights || []) env.lights.push({ pos: l.pos, color: new THREE.Color(l.color || '#ffd890'), intensity: l.intensity ?? 4, range: l.range ?? 7, night: l.night !== false });
  return env;
}

const _m = new THREE.Matrix4(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);
export function destroyProp(env, rec, fx) {
  if (!rec || !rec.alive) return;
  rec.alive = false;
  if (rec.inst) {
    for (const ip of rec.inst.parts) { ip.m.setMatrixAt(rec.index, _zero); ip.m.instanceMatrix.needsUpdate = true; }
  } else if (rec.obj) rec.obj.visible = false;
  if (fx) {
    const cols = (rec.meta.debris || ['#8a7a6a']).map((c) => new THREE.Color(c).getHex());
    const size = Math.max(rec.meta.footprint[0], rec.meta.footprint[1]) * rec.scale;
    fx.shatter([rec.x, rec.y + 0.5 * size, rec.z], { count: Math.round(18 + size * 14), size: 0.08 + size * 0.07, colors: cols, force: 5, spread: size * 0.5, up: 5 });
  }
}
export function restoreProps(env) {
  const e = new THREE.Euler(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (const rec of env.props) {
    if (rec.alive) continue;
    rec.alive = true; rec.hp = rec.meta.hp;
    if (rec.inst) { for (const ip of rec.inst.parts) { _m.multiplyMatrices(rec.matrix, ip.off); ip.m.setMatrixAt(rec.index, _m); ip.m.instanceMatrix.needsUpdate = true; } }
    else if (rec.obj) rec.obj.visible = true;
  }
}

const EMIT_RANGE2 = 26 * 26;
export function updateEnvironment(env, dt, night, fx = null, focus = null) {
  env.time += dt;
  if (fx && env.emitters.length) {
    for (const e of env.emitters) {
      if (!e.rec.alive) continue;
      if (focus) { const dx = e.pos[0] - focus.x, dz = e.pos[2] - focus.z; if (dx * dx + dz * dz > EMIT_RANGE2) continue; }
      const d = EMITTERS[e.type]; if (!d) continue;
      e.acc += dt * d.rate * e.rate;
      if (e.acc < 1) continue;
      const col = e.color ? colorArr(e.color) : null;
      while (e.acc >= 1) { e.acc -= 1; d.f(fx, e.pos, e.scale, col); }
    }
  }
  if (env.water) env.water.material.uniforms.uNight.value = night;
  for (const s of env.signs) {
    let k = s.base * (0.25 + night * 0.95);
    if (s.flicker) { const t = env.time * 7 + s.phase; if (Math.sin(t) > 0.93 || Math.sin(t * 2.3) > 0.97) k *= 0.2; }
    s.mesh.material.color.setScalar(k);
  }
  // animated props (sway/spin parts)
  for (const rec of env.props) {
    if (!rec.obj || !rec.alive) continue;
    const rig = rec.obj.userData.rig;
    for (const s of rig.sway) {
      const b = rig.bones[s.name];
      if (s.spin) { const ax = s.spin.axis || 'y'; b.rotation[ax] = env.time * (s.spin.speed || 1); }
      if (s.sway) { const ax = s.sway.axis || 'z'; b.rotation[ax] = Math.sin(env.time * (s.sway.freq || 1) * Math.PI + (s.sway.phase || 0)) * (s.sway.amp || 0.1); }
    }
  }
}

export function disposeEnvironment(env) {
  // only geometry generated for this map — prop/model templates are cached & shared
  for (const m of [env.ground, env.water, env.buildings]) if (m) m.geometry.dispose();
  env.group.traverse((o) => { if (o.name === 'roofs') o.geometry.dispose(); });
}
