// San Francisco kit: the shared builders and painters behind the California Street
// cable car (tram.js), the street arena under the freeway (arena.js) and Pier 39
// (pier39.js). Voxel builders work in voxels (8 per metre); facades face +z unless
// noted. The 2D layer is drawn with the Canvas 2D API — smooth, anti-aliased vector
// illustration at a high texel density (signs ≥ 96 px per metre), never chunky pixel
// art: painted backdrops that wrap so they can scroll past a moving car (backdrop()),
// card sprites (grab straps, seagulls, sea lions, steam, string-light bulbs, carousel
// horses) and text signs (route maps, menus, banners, shop boards). Posters and ads are
// not painted here: scenes leave a plain framed card and export a named poster slot
// (posterSlot / posterFrame) for the poster system to fill with rendered Tokon art.
import * as THREE from '../../../vendor/three.module.js';
import { h3, noise2 } from '../kit.js';
import { sprite, spriteInfo } from '../cards.js';
import { shift } from '../../px/paint.js';
import { bx, one, many, ell, cylY, line3, shade } from './chinatown_parts.js';
export { bx, one, many, ell, cylY, line3, shade };

// ============================================================ palette
// Build with an unbounded palette (16-bit voxels), then fold it into the 255 entries the
// mesher supports (as chinatown.js: least-used colours merge into their nearest
// neighbour with the same flags).
export function widePalette(v) {
  v.d = new Uint16Array(v.X * v.Y * v.Z);
  v.c = function (hex, flags = 0) {
    const key = hex + '|' + flags; let i = this.idx.get(key);
    if (i === undefined) { const n = parseInt(hex.slice(1), 16); i = this.pal.length; this.pal.push([(n >> 16) & 255, (n >> 8) & 255, n & 255]); this.flag.push(flags); this.idx.set(key, i); }
    return i;
  };
}
export function foldPalette(v, max = 255) {
  const n = v.pal.length, cnt = new Float64Array(n), d = v.d;
  for (let i = 0; i < d.length; i++) cnt[d[i]]++;
  const rep = new Int32Array(n).map((_, i) => i), live = [];
  for (let i = 1; i < n; i++) if (cnt[i] > 0) live.push(i);
  const dist = (a, b) => { const A = v.pal[a], B = v.pal[b], rm = (A[0] + B[0]) / 2, dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2]; return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db; };
  while (live.length > max) {
    let best = Infinity, bi = -1, bj = -1;
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j]; if (v.flag[a] !== v.flag[b]) continue;
      const c = dist(a, b) * Math.min(cnt[a], cnt[b]); if (c < best) { best = c; bi = i; bj = j; }
    }
    if (bi < 0) break;
    const a = live[bi], b = live[bj], keep = cnt[a] >= cnt[b] ? a : b, drop = keep === a ? b : a;
    rep[drop] = keep; cnt[keep] += cnt[drop]; live.splice(keep === a ? bj : bi, 1);
  }
  const root = (i) => { while (rep[i] !== i) i = rep[i]; return i; }, map = new Uint8Array(n), pal = [[0, 0, 0]], flag = [0];
  for (const i of live) { map[i] = pal.length; pal.push(v.pal[i]); flag.push(v.flag[i]); }
  for (let i = 1; i < n; i++) map[i] = map[root(i)];
  const d8 = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) d8[i] = map[d[i]];
  const idx = new Map(); for (const [key, i] of v.idx) if (map[root(i)]) idx.set(key, map[root(i)]);
  Object.assign(v, { d: d8, pal, flag, idx }); delete v.c;
  return { colours: n - 1, kept: live.length };
}

// ============================================================ decals on voxel faces
// S = +z face of layer zl, N = −z face of layer zl, E = +x face of column xl, W = −x face, U = top of layer yl
export function decalSet(D) {
  const S = (x0, y0, x1, y1, zl, paint, q = {}) => D.push({ x: (x0 + x1 + 1) / 16, y: y0 / 8, z: (zl + 1) / 8, w: (x1 - x0 + 1) / 8, h: (y1 - y0 + 1) / 8, face: 's', paint, ppm: 96, ...q });
  const N = (x0, y0, x1, y1, zl, paint, q = {}) => D.push({ x: (x0 + x1 + 1) / 16, y: y0 / 8, z: zl / 8, w: (x1 - x0 + 1) / 8, h: (y1 - y0 + 1) / 8, face: 'n', paint, ppm: 96, ...q });
  const E = (z0, y0, z1, y1, xl, paint, q = {}) => D.push({ x: (xl + 1) / 8, y: y0 / 8, z: (z0 + z1 + 1) / 16, w: (z1 - z0 + 1) / 8, h: (y1 - y0 + 1) / 8, face: 'e', paint, ppm: 96, ...q });
  const W = (z0, y0, z1, y1, xl, paint, q = {}) => D.push({ x: xl / 8, y: y0 / 8, z: (z0 + z1 + 1) / 16, w: (z1 - z0 + 1) / 8, h: (y1 - y0 + 1) / 8, face: 'w', paint, ppm: 96, ...q });
  const U = (x0, z0, x1, z1, yl, paint, q = {}) => D.push({ x: (x0 + x1 + 1) / 16, y: (yl + 1) / 8, z: (z1 + 1) / 8, w: (x1 - x0 + 1) / 8, h: (z1 - z0 + 1) / 8, face: 'up', paint, ppm: 96, ...q });
  return { S, N, E, W, U };
}
// ---- poster slots: { id, x, y, z, w, h, face, kind } in metres. (x, z) is the centre of the
// poster's plane, y its bottom edge, w × h its size, face the way it looks ('s' +z, 'n' −z,
// 'e' +x, 'w' −x). The plane lies on the voxel face of the backing card; offset it ~2 cm
// along the facing. a0..a1 run along x for 's'/'n' and along z for 'e'/'w'; layer is the
// backing card's z (s/n) or x (e/w) voxel layer.
export function posterSlot(id, face, a0, y0, a1, y1, layer, kind = 'poster') {
  const w = (a1 - a0 + 1) / 8, h = (y1 - y0 + 1) / 8, c = (a0 + a1 + 1) / 16, y = y0 / 8;
  const at = face === 's' ? { x: c, z: (layer + 1) / 8 } : face === 'n' ? { x: c, z: layer / 8 } : face === 'e' ? { x: (layer + 1) / 8, z: c } : { x: layer / 8, z: c };
  return { id, ...at, y, w, h, face, kind, vox: [a0, y0, a1, y1, layer] };
}
// a plain card (the backing) in the slot's rectangle, with a frame one voxel proud of it
export function posterFrame(k, s, o = {}) {
  const [a0, y0, a1, y1, L] = s.vox, out = s.face === 's' || s.face === 'e' ? 1 : -1, back = one(k, o.back || '#efe8da'), fr = one(k, o.frame || '#2a2622');
  const P = (a, y, l, c) => (s.face === 's' || s.face === 'n' ? k.v.set(a, y, l, c) : k.v.set(l, y, a, c));
  for (let a = a0; a <= a1; a++) for (let y = y0; y <= y1; y++) P(a, y, L, back);
  if (o.frame !== false) for (let a = a0 - 1; a <= a1 + 1; a++) for (let y = y0 - 1; y <= y1 + 1; y++) if (a < a0 || a > a1 || y < y0 || y > y1) { P(a, y, L, fr); P(a, y, L + out, fr); }
}
// count the triangles of the built world (dev log)
export function triCount(st) { let n = 0; st.world.traverse((q) => { if (q.geometry && q.geometry.index) n += q.geometry.index.count / 3; }); return n; }
export function devParam(name) { try { return typeof location !== 'undefined' ? new URLSearchParams(location.search).get(name) : null; } catch (e) { return null; } }

// ============================================================ smooth 2D painting (Canvas 2D)
export const FF = {
  display: '"Bebas Neue", "Oswald", "Arial Narrow", Impact, sans-serif',
  sans: '"Noto Sans TC", "Noto Sans CJK TC", "Helvetica Neue", Arial, sans-serif',
  serif: '"Noto Serif TC", "Noto Serif CJK TC", Georgia, "Times New Roman", serif',
  slab: 'Rockwell, "Roboto Slab", Georgia, serif',
};
function mkCanvas(W, H) {
  if (typeof document !== 'undefined' && document.createElement) { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(W, H);
  return null;
}
// copy a canvas into a Surf with a hard alpha cut (the cards and decals alpha-test at 0.5)
function copyIn(s, g, W, H, off = 0, SW = W) {
  const src = new Uint32Array(g.getImageData(0, 0, W, H).data.buffer), dst = s.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = src[y * W + x]; if ((c >>> 24) >= 110) dst[y * SW + x + off] = (c | 0xff000000) >>> 0; }
  s.touch && s.touch();
}
// wrap a Canvas 2D drawing fn(g, W, H) as a Pen painter for decal() / sprite()
export function smooth(fn) { return (p, W, H) => { const c = mkCanvas(W, H); if (!c) return; const g = c.getContext('2d', { willReadFrequently: true }); fn(g, W, H); copyIn(p.s, g, W, H); }; }
// shapes
export const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
export function rr(g, x, y, w, h, r, c, stroke, lw) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); if (c) { g.fillStyle = c; g.fill(); } if (stroke) { g.lineWidth = lw || 1; g.strokeStyle = stroke; g.stroke(); } }
export function circ(g, x, y, r, c) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, 6.2832); g.fillStyle = c; g.fill(); }
export function ellp(g, x, y, rx, ry, c, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 6.2832); g.fillStyle = c; g.fill(); }
export function poly(g, pts, c) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = c; g.fill(); }
export function lineW(g, pts, c, w, cap = 'round') { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineWidth = w; g.strokeStyle = c; g.lineCap = cap; g.lineJoin = 'round'; g.stroke(); }
export function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => gr.addColorStop(i / Math.max(1, stops.length - 1), c)); return gr; }
// a sphere-ish blob lit from the upper left
export function orb(g, x, y, r, c, ry) { const gr = g.createRadialGradient(x - r * 0.35, y - (ry || r) * 0.4, r * 0.08, x, y, r * 1.05); gr.addColorStop(0, shift(c, 0.75)); gr.addColorStop(0.45, c); gr.addColorStop(1, shift(c, -0.9)); ellp(g, x, y, r, ry || r, gr); }
// text fitted into a box centred at (cx, cy): o { font, weight, color, stroke, sw, shadow, align, k, italic }
export function txt(g, str, cx, cy, w, h, o = {}) {
  const fam = FF[o.font || 'display'] || o.font, wt = o.weight || ((o.font || 'display') === 'display' ? 400 : 800), it = o.italic ? 'italic ' : '';
  g.font = `${it}${wt} 100px ${fam}`; let m = g.measureText(str);
  const tw0 = m.width || 1, th0 = (m.actualBoundingBoxAscent || 70) + (m.actualBoundingBoxDescent || 0) || 70;
  const size = 100 * Math.min(w / tw0, h / th0) * (o.k || 1);
  g.font = `${it}${wt} ${size}px ${fam}`; m = g.measureText(str);
  const asc = m.actualBoundingBoxAscent ?? size * 0.7, desc = m.actualBoundingBoxDescent ?? 0, tw = m.width;
  const x = o.align === 'left' ? cx - w / 2 : o.align === 'right' ? cx + w / 2 - tw : cx - tw / 2, y = cy + (asc - desc) / 2;
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  if (o.shadow) { g.fillStyle = o.shadow; g.fillText(str, x + size * 0.04, y + size * 0.05); }
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw || size * 0.14; g.strokeStyle = o.stroke; g.strokeText(str, x, y); }
  g.fillStyle = o.color || '#ffffff'; g.fillText(str, x, y);
  return { size, w: tw };
}

// ============================================================ painted backdrops
// A big painted plane (metres; bottom-centre at x, y, z) facing +z ('s') or −z ('n').
// draw(g, W, H, ppm) paints it with Canvas 2D. wrap: the painting tiles horizontally (what
// runs past the right edge is folded onto the left), so scroll (metres per second; + moves
// the scenery toward −x on a south-facing plane) can slide it past a moving car.
export function backdrop(st, o) {
  const ppm = o.ppm || 8, W = Math.round(o.w * ppm), H = Math.round(o.h * ppm), M = o.wrap ? Math.round((o.margin ?? 14) * ppm) : 0;
  const cv = mkCanvas(W + M, H); if (!cv) return null;
  const g = cv.getContext('2d', { willReadFrequently: true }); o.draw(g, W, H, ppm);
  const src = new Uint32Array(g.getImageData(0, 0, W + M, H).data.buffer), out = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) { const c = src[y * (W + M) + x]; if ((c >>> 24) >= 110) out[y * W + x] = (c | 0xff000000) >>> 0; }
    for (let x = W; x < W + M; x++) { const c = src[y * (W + M) + x]; if ((c >>> 24) >= 110) out[y * W + x - W] = (c | 0xff000000) >>> 0; }
  }
  const fc = mkCanvas(W, H), fg = fc.getContext('2d'), img = fg.createImageData(W, H); new Uint32Array(img.data.buffer).set(out); fg.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(fc); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.wrap) t.wrapS = THREE.RepeatWrapping;
  const side = o.both ? THREE.DoubleSide : THREE.FrontSide;
  const mat = o.basic ? new THREE.MeshBasicMaterial({ map: t, alphaTest: 0.5, side, fog: o.fog ?? true }) : new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side, fog: o.fog ?? true });
  if (o.basic && o.tint) mat.color.setScalar(o.tint);
  const geo = new THREE.PlaneGeometry(o.w, o.h); geo.translate(0, o.h / 2, 0);
  const m = new THREE.Mesh(geo, mat); m.position.set(o.x, o.y, o.z); m.rotation.y = o.face === 'n' ? Math.PI : (o.yaw || 0);
  m.receiveShadow = !!o.shadow; m.renderOrder = o.order || 0;
  st.scene.add(m);
  if (o.scroll) st.hooks.push((s2) => { t.offset.x = ((s2.time * o.scroll) / o.w) % 1; });
  return m;
}
// a flat sea that runs out to the horizon (metres)
export function farWater(st, o) {
  const geo = new THREE.PlaneGeometry(o.w, o.d); geo.rotateX(-Math.PI / 2);
  // the same look as the stage's voxel water: translucent, glossy, and no depth writes (so the ink pass sees one continuous sea)
  const m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: o.color || 0x2e72a2, transparent: true, opacity: 0.78, shininess: 90, specular: 0x6a7a8a, depthWrite: false }));
  m.position.set(o.x, o.y, o.z); m.receiveShadow = true; m.renderOrder = 2; st.scene.add(m);
  if (o.deep) {                                                    // a deep-water base under the translucent sea, drawn first, no depth (no ink bands)
    const g2 = new THREE.PlaneGeometry(o.w, o.d); g2.rotateX(-Math.PI / 2);
    const b = new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ color: o.deep, depthWrite: false }));
    b.position.set(o.x, o.y - 0.9, o.z); b.renderOrder = -10; st.scene.add(b);
  }
  return m;
}

// ============================================================ card sprites (registered once, shared by the SF scenes)
// sea lion drawn in a box: pose 'lie' (on its belly, head right), 'up' (propped on its flippers), 'bark' (head thrown back)
export function seaLion(g, x, y, w, h, c, pose = 'lie') {
  const dk = shift(c, -0.9), lt = shift(c, 0.6), body = lin(g, x, y, x, y + h, [lt, c, dk]);
  if (pose === 'lie') {
    g.beginPath(); g.moveTo(x + w * 0.02, y + h * 0.78); g.bezierCurveTo(x + w * 0.2, y + h * 0.3, x + w * 0.62, y + h * 0.18, x + w * 0.8, y + h * 0.36);
    g.bezierCurveTo(x + w * 0.9, y + h * 0.42, x + w * 0.94, y + h * 0.7, x + w * 0.86, y + h * 0.95); g.lineTo(x + w * 0.14, y + h * 0.98); g.closePath(); g.fillStyle = body; g.fill();
    ellp(g, x + w * 0.86, y + h * 0.42, w * 0.1, h * 0.26, c); ellp(g, x + w * 0.95, y + h * 0.5, w * 0.06, h * 0.13, lt);
    circ(g, x + w * 0.88, y + h * 0.33, h * 0.055, '#140c08'); circ(g, x + w * 0.99, y + h * 0.47, h * 0.04, '#140c08');
    poly(g, [[x + w * 0.04, y + h * 0.78], [x - w * 0.02, y + h * 0.5], [x + w * 0.12, y + h * 0.82]], dk);
    poly(g, [[x + w * 0.55, y + h * 0.9], [x + w * 0.66, y + h * 0.62], [x + w * 0.7, y + h * 0.95]], dk);
    lineW(g, [[x + w * 0.3, y + h * 0.42], [x + w * 0.6, y + h * 0.32]], 'rgba(255,255,255,0.55)', h * 0.06);
    for (const dy of [0.48, 0.56]) lineW(g, [[x + w * 0.97, y + h * dy], [x + w * 1.08, y + h * (dy - 0.04)]], '#e8dcc8', Math.max(1, h * 0.025));
  } else {
    const back = pose === 'bark';
    g.beginPath(); g.moveTo(x + w * 0.12, y + h); g.bezierCurveTo(x + w * 0.05, y + h * 0.55, x + w * 0.3, y + h * 0.3, x + w * 0.48, y + h * 0.18);
    g.lineTo(x + w * 0.66, y + h * 0.2); g.bezierCurveTo(x + w * 0.7, y + h * 0.5, x + w * 0.62, y + h * 0.75, x + w * 0.9, y + h); g.closePath(); g.fillStyle = body; g.fill();
    const hx = x + w * (back ? 0.6 : 0.62), hy = y + h * (back ? 0.12 : 0.18);
    ellp(g, hx, hy, w * 0.15, h * 0.11, c, back ? -0.9 : -0.2); ellp(g, hx + w * 0.16, hy + (back ? -h * 0.08 : h * 0.02), w * 0.09, h * 0.06, lt, back ? -0.9 : 0);
    circ(g, hx + w * 0.03, hy - h * 0.03, h * 0.025, '#140c08');
    if (back) poly(g, [[hx + w * 0.12, hy - h * 0.06], [hx + w * 0.26, hy - h * 0.16], [hx + w * 0.22, hy - h * 0.02]], '#7a2a2a');
    poly(g, [[x + w * 0.4, y + h * 0.62], [x + w * 0.62, y + h * 0.98], [x + w * 0.38, y + h * 0.9]], dk);
    poly(g, [[x + w * 0.12, y + h * 0.96], [x - w * 0.04, y + h * 0.86], [x + w * 0.16, y + h * 0.82]], dk);
    lineW(g, [[x + w * 0.22, y + h * 0.65], [x + w * 0.4, y + h * 0.3]], 'rgba(255,255,255,0.5)', w * 0.04);
  }
}
let SP = null;
export function sfSprites() {
  if (SP) return SP;
  const mk = (name, W, H, fn, ppm) => sprite('sf2-' + name, W, H, smooth(fn), { ppm });
  SP = {};
  // grab strap: brass clip, leather strap, ivory loop
  SP.strap = [0, 1].map((i) => mk('strap' + i, 16, 44 + i * 3, (g, W, H) => {
    rr(g, 3, 0, 10, 4, 1.5, '#c8a040'); R(g, 4, 1, 8, 1, '#f0d070');
    rr(g, 5, 3, 6, H - 16, 2, lin(g, 5, 0, 11, 0, ['#8a5432', '#6a3c22', '#4a2816']));
    g.beginPath(); g.arc(8, H - 7.5, 5.2, 0, 6.2832); g.lineWidth = 2.6; g.strokeStyle = '#efe4c8'; g.stroke();
    g.beginPath(); g.arc(8, H - 7.5, 5.2, 3.6, 5.2); g.lineWidth = 1.2; g.strokeStyle = '#ffffff'; g.stroke();
  }, 72));
  // seagulls: flying (wings up / down) and standing
  SP.gullFly = [0, 1].map((i) => mk('gull' + i, 44, 22, (g, W, H) => {
    const wy = i ? -6 : 5;
    for (const s of [-1, 1]) { poly(g, [[22, 11], [22 + s * 7, 9 + wy * 0.6], [22 + s * 20, 8 + wy], [22 + s * 21, 10 + wy], [22 + s * 9, 13]], '#c8ced6'); poly(g, [[22 + s * 16, 8.5 + wy], [22 + s * 21, 8 + wy], [22 + s * 21.5, 10.5 + wy]], '#2a2a30'); }
    ellp(g, 23, 12.5, 8, 3.2, '#fbfcfd'); ellp(g, 30, 10.8, 3, 2.6, '#ffffff'); poly(g, [[32.5, 10.5], [36, 11.4], [32.5, 12.2]], '#f0b020'); circ(g, 31, 10.2, 0.6, '#1a1a1a');
    poly(g, [[15, 12], [11, 10.5], [11, 14]], '#e8ecf0');
  }, 48));
  SP.gullStand = [0, 1].map((i) => mk('gullS' + i, 26, 28, (g, W, H) => {
    lineW(g, [[10, 20], [10, 27]], '#e8a040', 1.4); lineW(g, [[14, 20], [14, 27]], '#e8a040', 1.4);
    ellp(g, 12, 15, 9, 6, '#fafbfc'); poly(g, [[3, 15], [16, 11], [20, 16], [8, 19], [1, 19]], '#9aa2ac'); poly(g, [[0, 18], [4, 16], [5, 20]], '#2a2a30');
    ellp(g, 18 + i, 7, 4.2, 3.8, '#ffffff'); poly(g, [[21.5 + i, 6.5], [25.5 + i, 7.5], [21.5 + i, 8.6]], '#f0b020'); circ(g, 19.5 + i, 6, 0.8, '#1a1a1a');
  }, 56));
  // sea lions on the floats
  SP.seaLie = ['#8a6446', '#7a5a40', '#9c7652', '#6a4c36'].map((c, i) => mk('slLie' + i, 84, 30, (g, W, H) => seaLion(g, 3, 2, W - 12, H - 3, c, 'lie'), 46));
  SP.seaUp = ['#8a6446', '#9c7652', '#7a5a40'].map((c, i) => mk('slUp' + i, 56, 56, (g, W, H) => seaLion(g, 2, 2, W - 6, H - 3, c, i === 2 ? 'bark' : 'up'), 46));
  // steam over hot food
  SP.steam = [0, 1, 2].map((i) => mk('steam' + i, 28, 54, (g, W, H) => {
    for (let k = 0; k < 3; k++) { const pts = []; for (let y = H - 2; y > 6 + k * 6; y -= 2) pts.push([7 + k * 7 + i + Math.sin(y * 0.18 + k * 2 + i) * 4, y]); lineW(g, pts, k === 1 ? '#ffffff' : '#f2f4f4', 3.2 - k * 0.5); }
  }, 64));
  // string-light bulbs (warm, amber, pink, teal) with a lit night version
  SP.bulb = ['#fff0c0', '#ffc860', '#ff8ab0', '#7af0e0'].map((c, i) => {
    const d = mk('bulb' + i, 10, 14, (g) => { R(g, 3, 0, 4, 4, '#2a2a2e'); orb(g, 5, 8.5, 4.2, c, 5); }, 80);
    const n = mk('bulbL' + i, 10, 14, (g) => { R(g, 3, 0, 4, 4, '#2a2a2e'); ellp(g, 5, 8.5, 4.4, 5.2, c); ellp(g, 5, 8, 2.6, 3.2, '#fffbe8'); }, 80);
    spriteInfo(d).night = n; return d;
  });
  // carousel horses on twisted brass poles, and a sea lion
  const pole = (g, x, H) => { R(g, x - 1.5, 0, 3, H, lin(g, x - 1.5, 0, x + 1.5, 0, ['#fff0a0', '#d8a838', '#8a6018'])); for (let y = 2; y < H; y += 5) lineW(g, [[x - 1.5, y], [x + 1.5, y + 2.5]], '#f8e080', 0.8); circ(g, x, 2, 2.6, '#f0c848'); };
  const horse = (g, W, H, body, saddle, mane) => {
    pole(g, 30, H);
    const B = lin(g, 0, 20, 0, 50, [shift(body, 0.5), body, shift(body, -0.7)]);
    lineW(g, [[18, 42], [12, 54], [9, 62]], shift(body, -0.5), 4); lineW(g, [[24, 44], [22, 58], [23, 66]], shift(body, -0.4), 4);   // hind legs
    lineW(g, [[38, 42], [46, 50], [44, 58]], shift(body, -0.3), 4); lineW(g, [[42, 40], [52, 44], [55, 52]], body, 4);                   // raised forelegs
    for (const [x, y] of [[9, 62], [23, 66], [44, 58], [55, 52]]) ellp(g, x, y + 1, 2.6, 1.8, '#3a2a20');
    ellp(g, 30, 36, 19, 10, B);
    poly(g, [[40, 32], [46, 14], [54, 12], [52, 22], [46, 36]], B);
    ellp(g, 53, 13, 8, 5, B, 0.5); ellp(g, 58, 17, 4, 3, shift(body, 0.2));
    lineW(g, [[46, 10], [42, 16], [40, 24], [38, 30]], mane, 4); lineW(g, [[48, 8], [46, 6]], mane, 3);
    lineW(g, [[12, 32], [5, 40], [3, 50]], mane, 4.5);
    circ(g, 52, 11, 1.2, '#1a1010'); lineW(g, [[48, 14], [57, 18], [44, 26]], '#c8962c', 1.2);
    rr(g, 22, 25, 14, 9, 3, saddle); lineW(g, [[22, 27], [36, 27]], shift(saddle, 0.6), 1.4); circ(g, 29, 34, 2.4, '#f0c848');
    for (let x = 16; x <= 42; x += 6) circ(g, x, 44, 1.2, '#f0c848');
  };
  SP.mount = [
    mk('horse0', 64, 72, (g, W, H) => horse(g, W, H, '#f6f0e4', '#c8242c', '#e8c060'), 48),
    mk('horse1', 64, 72, (g, W, H) => horse(g, W, H, '#ece4d4', '#2e5a9c', '#8a5a2a'), 48),
    mk('horse2', 64, 72, (g, W, H) => horse(g, W, H, '#d8a868', '#2e8a5a', '#3a2418'), 48),
    mk('horse3', 64, 72, (g, W, H) => horse(g, W, H, '#f6f0e4', '#8a2a8a', '#f0d080'), 48),
    mk('horse4', 64, 72, (g, W, H) => horse(g, W, H, '#5a4a52', '#f0c040', '#1e1a1e'), 48),
    mk('mSeal', 64, 72, (g, W, H) => { pole(g, 30, H); seaLion(g, 8, 18, 48, 44, '#7e5638', 'up'); rr(g, 22, 40, 16, 6, 2, '#c8242c'); }, 48),
  ];
  // little flags for the pier
  SP.flag = ['#c8302c', '#2e5a9c', '#f0c040', '#2e8a5a'].map((c, i) => mk('flag' + i, 34, 22, (g, W, H) => {
    R(g, 0, 0, 2, H, '#e8e4dc');
    g.beginPath(); g.moveTo(2, 1); g.bezierCurveTo(12, -1, 20, 4, 33, 2); g.lineTo(33, 15); g.bezierCurveTo(20, 17, 12, 12, 2, 15); g.closePath(); g.fillStyle = lin(g, 0, 0, 34, 0, [c, shift(c, 0.4), c, shift(c, -0.4)]); g.fill();
    if (i % 2 === 0) circ(g, 15, 8, 3.2, '#f8f2e4');
  }, 48));
  return SP;
}

// ============================================================ voxel builders
// planks: a weathered deck of boards (boards run along `along`) over [x0..x1]×[z0..z1] at layer y
export function planks(k, x0, z0, x1, z1, y, o = {}) {
  const S = many(k, o.cols || ['#9a8268', '#a48c70', '#8e7660', '#b09878', '#86705a', '#9c8a76']), G = one(k, o.gap || '#5a4a3c'), N = one(k, o.nail || '#4a4038');
  const along = o.along || 'x', bw = o.bw || 2, len = o.len || 24;
  k.v.box(x0, y - (o.th ?? 1), z0, x1, y, z1, (x, yy, z) => {
    const a = along === 'x' ? x : z, b = along === 'x' ? z : x, board = Math.floor(b / bw), seg = Math.floor((a + board * 7) / len);
    if (yy < y) return S[(board + seg) % S.length];
    if ((a + board * 7) % len === 0) return G;
    if ((a + board * 7) % len === 1 && (b % bw === 0)) return N;
    const r = h3(board, seg, 3), wet = o.wear && noise2(x, z, 9) > 0.72;
    return wet ? S[(Math.floor(r * 3) + 3) % S.length] : S[Math.floor(r * S.length)];
  });
}
// a round timber pile with a wet tide band, barnacles and a cap
export function pile(k, x, z, y0, y1, r = 1.3, o = {}) {
  const W = many(k, o.cols || ['#6a5440', '#5e4a38', '#76604a']), WET = many(k, ['#3a3228', '#463c30']), BAR = one(k, '#c8c4b4'), tide = o.tide ?? y0 + 6;
  cylY(k.v, x, z, r, y0, y1, (xx, yy, zz, d, a) => (yy <= tide ? (h3(xx, yy, zz) < 0.12 ? BAR : WET[(yy + xx) & 1]) : W[(Math.floor(a * 3) + (yy >> 2)) % 3]));
  if (o.cap) cylY(k.v, x, z, r + 0.4, y1 + 1, y1 + 1, one(k, o.cap));
}
// a wooden or iron railing along an axis: posts every `step`, a top rail, a mid rail
export function rail(k, o) {
  const { a, b, y, at, axis = 'x', h = 8, step = 8 } = o, P = many(k, o.post || ['#6a5038', '#5e4632']), T = many(k, o.top || ['#8a6a4a', '#94744e']), M = one(k, o.midCol || (o.post && o.post[0]) || '#6a5038');
  const set = (u, yy, c) => (axis === 'x' ? k.v.set(u, yy, at, c) : k.v.set(at, yy, u, c));
  for (let u = a; u <= b; u++) {
    const post = (u - a) % step === 0 || u === b;
    if (post) for (let j = 0; j < h; j++) set(u, y + j, P[(u + j) & 1]);
    set(u, y + h, T[(u >> 2) & 1]);
    if (o.mid !== false) set(u, y + Math.round(h * 0.45), M);
    if (o.bars && (u - a) % 2 === 0) for (let j = 1; j < h; j++) set(u, y + j, M);
  }
}
// a cast-iron lamp post (pier/park style): fluted shaft, a globe (two with `double`) → light position (metres)
export function lampPost(k, x, y, z, o = {}) {
  const I = many(k, o.iron || ['#22302a', '#2a3a32', '#1c2822']), GL = one(k, '#f6eed8'), CAP = one(k, '#c8a040');
  bx(k, x - 1, y, z - 1, x + 2, y + 2, z + 2, I[0]); bx(k, x - 1, y + 3, z - 1, x + 2, y + 3, z + 2, I[2]);
  bx(k, x, y + 4, z, x + 1, y + 30, z + 1, (xx, yy) => I[yy % 5 === 0 ? 2 : (xx & 1)]);
  bx(k, x - 1, y + 14, z - 1, x + 2, y + 15, z + 2, I[1]);
  const top = y + 31;
  if (o.double) {
    for (const s of [-1, 1]) for (let i = 1; i <= 4; i++) k.v.set(x + (s > 0 ? 1 + i : -i), top - 2 + (i >> 1), z, I[1]);
    for (const gx of [x - 5, x + 6]) { ell(k.v, gx + 0.5, top + 2, z + 0.5, 1.7, 2.1, 1.7, GL); k.v.set(gx, top + 4, z, CAP); k.v.set(gx + 1, top + 4, z, CAP); }
  }
  bx(k, x - 1, top, z - 1, x + 2, top, z + 2, CAP);
  ell(k.v, x + 0.5, top + 3, z + 0.5, 2, 2.6, 2, GL);
  bx(k, x, top + 6, z, x + 1, top + 6, z + 1, CAP); k.v.set(x, top + 7, z, I[0]);
  return [(x + 1) / 8, (top + 3) / 8, (z + 1) / 8];
}
// a café table under a striped umbrella with chairs; → { seats: [x, z, yaw, y] (voxels), top, c }
export function cafeSet(k, x, y, z, o = {}) {
  const v = k.v, M = one(k, o.metal || '#2e3a3a'), T = many(k, o.top || ['#e8e4d8', '#dedad0']), SEAT = one(k, o.seat || '#2e6a5a'), r = o.r ?? 4;
  bx(k, x - 1, y, z - 1, x + 1, y, z + 1, M); bx(k, x, y + 1, z, x, y + 5, z, M);
  cylY(v, x + 0.5, z + 0.5, r, y + 6, y + 6, (xx, yy, zz, d) => (d > r - 0.8 ? M : T[(xx + zz) & 1]));
  const seats = [];
  for (const [dx, dz, yaw] of [[-r - 3, 0, Math.PI / 2], [r + 3, 0, -Math.PI / 2], [0, -r - 3, 0], [0, r + 3, Math.PI]].slice(0, o.chairs ?? 4)) {
    const cx = x + dx, cz = z + dz, bxs = Math.sign(dx), bzs = Math.sign(dz);
    bx(k, cx - 1, y, cz - 1, cx + 1, y + 3, cz + 1, (xx, yy, zz) => (yy === y + 3 ? SEAT : (Math.abs(xx - cx) === 1 && Math.abs(zz - cz) === 1 ? M : undefined)));
    if (bxs) bx(k, cx + bxs * 2, y + 3, cz - 1, cx + bxs * 2, y + 7, cz + 1, (xx, yy) => (yy === y + 7 || yy === y + 5 ? SEAT : M));
    if (bzs) bx(k, cx - 1, y + 3, cz + bzs * 2, cx + 1, y + 7, cz + bzs * 2, (xx, yy) => (yy === y + 7 || yy === y + 5 ? SEAT : M));
    seats.push([cx + 0.5, cz + 0.5, yaw, y + 4]);
  }
  if (o.umbrella !== false) {
    const U = (o.um || ['#e8e0cc', '#2e7a6a']).map((c) => one(k, c)), H = y + (o.uh || 18), Rr = o.ur || 11, P = one(k, '#d8d0c0');
    bx(k, x, y + 7, z, x, H + 1, z, P);
    for (let dz = -Rr; dz <= Rr; dz++) for (let dx = -Rr; dx <= Rr; dx++) { const dd = Math.hypot(dx, dz); if (dd > Rr + 0.3) continue; const yy = H - Math.round((dd / Rr) * 3), seg = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * 8); v.set(x + dx, yy, z + dz, U[seg % 2]); if (dd > Rr - 1) v.set(x + dx, yy - 1, z + dz, U[seg % 2]); }
    v.set(x, H + 2, z, P);
  }
  return { seats, top: y + 6, c: [x + 0.5, z + 0.5] };
}
// a sourdough bread bowl of chowder on a plate (voxels) → its top (for steam)
export function breadBowl(k, x, y, z) {
  const v = k.v, CR = many(k, ['#a86a2a', '#b87a34', '#9a5e24']), CH = many(k, ['#f4ecd4', '#ece2c4']), PL = one(k, '#f4f2ec');
  bx(k, x - 2, y, z - 2, x + 2, y, z + 2, PL);
  bx(k, x - 1, y + 1, z - 1, x + 1, y + 2, z + 1, (xx, yy, zz) => (yy === y + 2 && xx === x && zz === z ? CH[0] : CR[(xx + zz + yy) % 3]));
  v.set(x, y + 2, z, CH[(x + z) & 1]); v.set(x - 1, y + 3, z - 1, CR[0]);
  return [x + 0.5, y + 3, z + 0.5];
}
// an old CRT television (the scoreboard) → the screen rect for a decal (on the +z face)
export function crt(k, x, y, z, o = {}) {
  const w = o.w || 20, h = o.h || 15, d = o.d || 14, CA = many(k, o.case || ['#5a4a3a', '#62523e', '#544434']), BZ = one(k, o.bezel || '#2a2622'), KN = one(k, '#c8c0a8');
  bx(k, x, y, z - d + 4, x + w - 1, y + h - 1, z, (xx, yy, zz) => (zz > z - d + 6 ? CA[(yy >> 1) % 3] : one(k, '#3a3430')));
  bx(k, x + 3, y + 2, z - d, x + w - 4, y + h - 3, z - d + 3, one(k, '#3a3430'));
  bx(k, x + 1, y + 1, z, x + w - 6, y + h - 2, z, BZ);
  bx(k, x + w - 5, y + 2, z, x + w - 2, y + h - 2, z, one(k, '#3e3a36'));
  for (const yy of [y + h - 5, y + h - 9]) k.v.set(x + w - 3, yy, z + 1, KN);
  for (let yy = y + 3; yy < y + 7; yy++) if (yy & 1) bx(k, x + w - 5, yy, z, x + w - 2, yy, z, BZ);
  line3(k.v, [x + w / 2, y + h, z - d / 2], [x + w / 2 - 7, y + h + 9, z - d / 2], one(k, '#b8bcc4'));
  line3(k.v, [x + w / 2, y + h, z - d / 2], [x + w / 2 + 6, y + h + 10, z - d / 2 + 1], one(k, '#b8bcc4'));
  return { x0: x + 2, y0: y + 2, x1: x + w - 7, y1: y + h - 3, z };
}
// a step-van food truck along x (cab toward +x), service window on the +z side → sign/menu/window rects
export function foodTruck(k, x, y, z, o = {}) {
  const v = k.v, L = o.L || 52, W = o.W || 18, H = o.H || 23, Bd = many(k, o.body || ['#f0e8d8', '#e8e0d0']), ST = one(k, o.stripe || '#e8502c'), ST2 = one(k, o.stripe2 || '#2e8a7a');
  const G = many(k, ['#2a3a52', '#34486a']), T = many(k, ['#1c1c20', '#26262a']), CH = one(k, '#c8ccd4'), DK = one(k, '#3a3a40'), RF = one(k, '#d8d4cc');
  for (let i = 0; i < L; i++) for (let w = 0; w < W; w++) {
    const cab = i >= L - 11, nose = i >= L - 3, top = cab ? (nose ? 11 : 18) : H, side = w === 0 || w === W - 1;
    for (let hh = 3; hh <= top; hh++) {
      let c = hh === 3 ? DK : Bd[(i >> 3) & 1];
      if (!cab && side && (hh === 7 || hh === 8)) c = ST; if (!cab && side && hh === 9) c = ST2;
      if (hh === top && !cab) c = RF;
      if (cab && !nose && hh >= 12 && hh <= 16 && (side || i >= L - 5)) c = G[(i + hh) & 1];
      if (nose && hh >= 8 && hh <= 9 && (w === 2 || w === W - 3)) c = one(k, '#fff6d8');
      v.set(x + i, y + hh, z + w, c);
    }
  }
  for (const fx of [9, L - 9]) for (const w of [-1, W]) for (let dx = -3; dx <= 3; dx++) for (let hh = 0; hh <= 6; hh++) { if (Math.hypot(dx, hh - 3) > 3.3) continue; v.set(x + fx + dx, y + hh, z + w, Math.hypot(dx, hh - 3) < 1.4 ? CH : T[(dx + hh) & 1]); }
  const wx0 = x + 10, wx1 = x + 34, wy0 = y + 10, wy1 = y + 18;
  bx(k, wx0, wy0, z + W - 3, wx1, wy1, z + W - 1, 0);
  bx(k, wx0, wy0, z + W - 4, wx1, wy1, z + W - 4, one(k, '#c8bca8'));
  bx(k, wx0, wy0 - 1, z + W, wx1, wy0 - 1, z + W + 3, one(k, '#b8bcc4'));
  const A = [one(k, o.aw || '#e8502c'), one(k, '#f4efe4')];
  for (let dz = 0; dz <= 5; dz++) for (let xx = wx0 - 2; xx <= wx1 + 2; xx++) v.set(xx, wy1 + 3 - (dz >> 1), z + W + dz, A[Math.floor((xx - wx0) / 3) & 1]);
  bx(k, x + 4, y + H + 1, z + 3, x + 36, y + H + 6, z + 4, one(k, o.signBg || '#2e8a7a'));
  return { L, W, H, window: [wx0, wy0, wx1, wy1, z + W - 4], sign: [x + 4, y + H + 1, x + 36, y + H + 6, z + 4], side: [x + 2, y + 4, x + 40, y + 9, z + W - 1] };
}
// concrete planter box with soil; optional tree (dress) and tufts
export function planter(k, dr, x0, z0, x1, z1, y, o = {}) {
  const C = many(k, o.cols || ['#b0aca4', '#a8a49c', '#bab6ae']), S = one(k, '#4a3424'), h = o.h ?? 4;
  bx(k, x0, y, z0, x1, y + h, z1, (x, yy, z) => (yy === y + h && x > x0 && x < x1 && z > z0 && z < z1 ? S : yy === y + h ? one(k, o.cap || '#c4c0b8') : C[(x + z + yy) % 3]));
  if (o.tree) dr.tree(Math.round((x0 + x1) / 2), y + h, Math.round((z0 + z1) / 2), o.tree, o.seed || 1, o.treeO || {});
  if (dr && o.list) dr.tufts(x0 + 2, z0 + 2, x1 - 2, z1 - 2, o.n ?? Math.max(2, Math.round(((x1 - x0) * (z1 - z0)) / 24)), o.list, o.seed || 3, { scale: o.scale || 0.9 });
}
// string lights between two points (voxels): glowing bulb cards on a sagging wire
export function stringLights(dr, a, b, o = {}) {
  const S2 = sfSprites(), at = dr.wire(a, b, o.sag ?? 6, 0x2a2626), L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.floor(L / (o.step || 5)));
  for (let i = 1; i < n; i++) { const p = at(i / n); dr.card(S2.bulb[(i + (o.alt || 0)) % (o.cols || 4)], p[0], p[1], p[2], { hang: true, glow: true, sway: 0.3, scale: o.scale || 1 }); }
}
// small clutter
export function crate(k, x, y, z, w = 5, h = 4, d = 5, col = '#9a7448') {
  const A = one(k, col), Bd = one(k, shade(col, -0.3));
  bx(k, x, y, z, x + w - 1, y + h - 1, z + d - 1, (xx, yy, zz) => ((yy === y || yy === y + h - 1 || xx === x || xx === x + w - 1) && (zz === z || zz === z + d - 1) ? Bd : (yy - y) % 2 ? A : Bd));
}
export function barrel(k, x, y, z, col = '#3a6a9a', h = 7) { cylY(k.v, x, z, 2.2, y, y + h - 1, (xx, yy) => (yy === y + 1 || yy === y + h - 2 ? one(k, shade(col, -0.4)) : yy === y + h - 1 ? one(k, shade(col, 0.2)) : one(k, col))); }
export function tyres(k, x, y, z, n = 3) { for (let i = 0; i < n; i++) cylY(k.v, x, z, 3, y + i * 2, y + i * 2 + 1, (xx, yy, zz, d) => (d < 1.4 ? undefined : one(k, d > 2.6 ? '#1a1a1e' : '#2a2a2e'))); }
export function cone(k, x, y, z) { bx(k, x - 1, y, z - 1, x + 1, y, z + 1, one(k, '#2a2a2e')); for (let j = 1; j <= 5; j++) { const r = j < 3 ? 1 : 0; bx(k, x - r, y + j, z - r, x + r, y + j, z + r, one(k, j === 3 ? '#f4f0e8' : '#f0601a')); } }
export function lifeRing(k, x, y, z, axis = 'z') {
  const Rd = one(k, '#e8502c'), Wh = one(k, '#f4f0e8');
  for (let a = 0; a < 6.283; a += 0.12) for (const r of [2.2, 3]) { const u = Math.round(Math.cos(a) * r), w = Math.round(Math.sin(a) * r), c = Math.floor((a / 6.283) * 8) % 2 ? Rd : Wh; if (axis === 'z') k.v.set(x + u, y + w, z, c); else k.v.set(x, y + w, z + u, c); }
}
export function viewer(k, x, y, z, dz = 2) {
  const M = many(k, ['#3a6a5a', '#2e5a4a']), CH = one(k, '#c8ccd4');
  bx(k, x - 1, y, z - 1, x + 1, y, z + 1, M[1]); bx(k, x, y + 1, z, x, y + 7, z, M[0]);
  bx(k, x - 2, y + 8, z - 1, x + 2, y + 10, z + 1, M[0]); bx(k, x - 1, y + 11, z - 1, x + 1, y + 11, z + 1, M[1]);
  k.v.set(x - 1, y + 9, z + dz, CH); k.v.set(x + 1, y + 9, z + dz, CH);
}

// ============================================================ backdrop painters (Canvas 2D, metres → px via u)
export const VIC = [['#5e9c98', '#e6a4a6', '#2f5e5a'], ['#e6c45c', '#8a6ab4', '#7a5a20'], ['#e8a2a8', '#7e9a6a', '#9a4a54'], ['#6a86c2', '#e8d8b0', '#2e3e6a'], ['#a28ec4', '#e88c6a', '#4e3e6e'], ['#8ec8a8', '#e6b85a', '#3a6a52'], ['#e88c70', '#f0e6d0', '#8a3e2e'], ['#f0e8d8', '#5a8ab0', '#8a7a60'], ['#f4f0e8', '#c84a4a', '#5a5a6a']];
const GLASS = (g, x, y, w, h, lit) => { R(g, x, y, w, h, lit ? lin(g, x, y, x, y + h, ['#ffe2a0', '#ffc860']) : lin(g, x, y, x + w, y + h, ['#9ab8d4', '#3c5276', '#28364e'])); };
// one row house standing on `base` (px): bay window, Italianate cornice or a fish-scale gable, stoop and garage
export function house(g, x, base, w, h, sch, r, u, o = {}) {
  const [body, acc, deep] = sch, T = '#f8f2e6', top = base - h, gap = Math.max(2, u * 0.2);
  R(g, x, top, w, h, body);
  g.fillStyle = shift(body, -0.22); for (let y = top + gap; y < base; y += gap) g.fillRect(x, y, w, Math.max(0.6, gap * 0.16));
  if (r < 0.45) {
    const gh = w * 0.42, e = u * 0.25;
    poly(g, [[x - e, top], [x + w / 2, top - gh], [x + w + e, top]], o.roof || '#5a5662');
    poly(g, [[x + e * 0.8, top], [x + w / 2, top - gh + e * 1.2], [x + w - e * 0.8, top]], acc);
    g.fillStyle = shift(acc, -0.35); for (let yy = top - gh + e * 2; yy < top; yy += u * 0.28) for (let xx = x; xx < x + w; xx += u * 0.3) { const inset = ((top - yy) / gh) * (w / 2); if (xx > x + inset + e && xx < x + w - inset - e) { g.beginPath(); g.arc(xx, yy, u * 0.13, 0, Math.PI); g.fill(); } }
    lineW(g, [[x - e, top], [x + w / 2, top - gh], [x + w + e, top]], T, Math.max(1, u * 0.12));
    rr(g, x + w / 2 - u * 0.35, top - gh * 0.5, u * 0.7, u * 0.9, u * 0.35, T); GLASS(g, x + w / 2 - u * 0.25, top - gh * 0.5 + u * 0.12, u * 0.5, u * 0.7, o.lit);
  } else {
    R(g, x - u * 0.15, top - u * 0.45, w + u * 0.3, u * 0.45, T); R(g, x - u * 0.15, top - u * 0.1, w + u * 0.3, u * 0.1, shift(T, -0.5));
    g.fillStyle = shift(T, -0.35); for (let xx = x + u * 0.2; xx < x + w - u * 0.2; xx += u * 0.7) g.fillRect(xx, top, u * 0.14, u * 0.3);
  }
  // the bay window
  const bw = w * 0.56, bx0 = x + u * 0.25, btop = top + u * 0.3, bbot = base - h * 0.24;
  R(g, bx0, btop, bw, bbot - btop, lin(g, bx0, 0, bx0 + bw, 0, [shift(body, 0.35), shift(body, 0.12), shift(body, -0.3)]));
  const floors = Math.max(1, Math.round((bbot - btop) / (u * 2.8)));
  for (let f = 0; f < floors; f++) {
    const fh = (bbot - btop) / floors, fy = btop + f * fh + u * 0.3, wh = fh - u * 0.75;
    for (let i = 0; i < 3; i++) { const ww = (bw - u * 0.9) / 3, wx = bx0 + u * 0.25 + i * (ww + u * 0.2); R(g, wx - u * 0.08, fy - u * 0.08, ww + u * 0.16, wh + u * 0.16, T); GLASS(g, wx, fy, ww, wh, o.lit && h3(x | 0, f, i) < 0.5); R(g, wx, fy + wh * 0.5, ww, Math.max(1, u * 0.06), T); }
    R(g, bx0 - u * 0.1, fy + wh + u * 0.12, bw + u * 0.2, u * 0.14, T);
  }
  const rx = x + bw + u * 0.55, rw = w - bw - u * 0.85;
  if (rw > u * 0.4) {
    R(g, rx - u * 0.08, btop + u * 0.22, rw + u * 0.16, h * 0.28 + u * 0.16, T); GLASS(g, rx, btop + u * 0.3, rw, h * 0.28, o.lit);
    const dy = base - h * 0.44; R(g, rx - u * 0.1, dy - u * 0.12, rw + u * 0.2, h * 0.26 + u * 0.12, T); R(g, rx, dy, rw, h * 0.26, deep);
    g.fillStyle = '#c8c2b8'; for (let s = 0; s < 4; s++) g.fillRect(rx - s * u * 0.18, base - h * 0.18 + s * (h * 0.045), rw + s * u * 0.36, h * 0.045 - 0.5);
  }
  R(g, bx0 + u * 0.1, bbot + u * 0.12, bw - u * 0.2, base - bbot - u * 0.12, '#e8e2d4'); g.fillStyle = '#c8c2b4'; for (let yy = bbot + u * 0.4; yy < base; yy += u * 0.3) g.fillRect(bx0 + u * 0.1, yy, bw - u * 0.2, Math.max(1, u * 0.04));
  R(g, x, top, Math.max(1, u * 0.06), h, shift(body, -1.2)); R(g, x + w - Math.max(1, u * 0.06), top, Math.max(1, u * 0.06), h, shift(body, -1.2));
}
function tree(g, x, base, h, r, u, cols = ['#2a5222', '#3e7230', '#5a9440', '#8ac05e']) {
  R(g, x - u * 0.12, base - h, u * 0.24, h, lin(g, x - u * 0.12, 0, x + u * 0.12, 0, ['#8a7a64', '#5a4a3a']));
  for (let k = 0; k < 9; k++) { const a = k * 2.4, rr2 = r * (0.42 + (k % 3) * 0.12); orb(g, x + Math.cos(a) * r * 0.55, base - h - r * 0.35 + Math.sin(a) * r * 0.42, rr2, cols[1 + (k % 2)]); }
  for (let k = 0; k < 4; k++) circ(g, x - r * 0.3 + k * r * 0.2, base - h - r * 0.75 + (k % 2) * r * 0.1, r * 0.18, cols[3]);
}
// downhill rooftops toward the Bay: a tiling band of Victorians, trees and wires (cable car mid layer)
export function drawHillHouses(g, W, H, u, o = {}) {
  const amp = (o.amp ?? 3.4) * u, ground = (x) => H - u * 1.0 - (Math.sin((x / W) * Math.PI * 2 * (o.waves || 2)) * 0.5 + 0.5) * amp;
  const items = []; let sum = 0;
  for (let i = 0; sum < W; i++) { const tr = h3(i, 7, 9) < 0.15, w = tr ? u * 3.2 : u * (4.6 + h3(i, 5, 9) * 2.2); items.push({ i, tr, w }); sum += w; }
  const k = W / sum; let x = 0;                                           // squeeze the row to tile exactly
  for (const it of items) {
    const w = it.w * k, h = u * (6.2 + h3(it.i, 6, 9) * 3.4), base = ground(x + w / 2);
    if (it.tr) tree(g, x + w / 2, base, u * 3.2, u * 1.9, u);
    else { house(g, x, base, w, h, VIC[Math.floor(h3(it.i, 8, 9) * VIC.length)], h3(it.i, 9, 9), u, { lit: o.lit }); R(g, x, base, w + 1, H - base, '#9a9a9e'); R(g, x, base, w + 1, u * 0.12, '#c8c4bc'); }
    x += w;
  }
  const n = Math.max(1, Math.round(W / (u * 18))), sp = W / n;
  for (let j = 0; j < n; j++) { const px = j * sp + u * 4, b0 = ground(px), b1 = ground(px + sp); R(g, px, b0 - u * 9, u * 0.28, u * 9, '#5a4a3a'); R(g, px - u * 0.8, b0 - u * 8.6, u * 1.9, u * 0.18, '#4a3a2a'); for (const dy of [8.4, 7.9]) { g.beginPath(); g.moveTo(px, b0 - u * dy); g.quadraticCurveTo(px + sp / 2, (b0 + b1) / 2 - u * dy + u * 1.1, px + sp, b1 - u * dy); g.lineWidth = Math.max(1, u * 0.05); g.strokeStyle = '#2a2a2e'; g.stroke(); } }
}
// the Bay from Nob Hill: water, the Bay Bridge, Treasure Island, East Bay hills, clouds (cable car far layer)
export function drawBayView(g, W, H, u, o = {}) {
  const hz = H - u * (o.horizon ?? 16);
  const per = (x, f, ph) => Math.sin((x / W) * Math.PI * 2 * f + ph) * 0.5 + 0.5;
  for (const [lift, col, ph] of [[7, '#a8bcd8', 0], [4, '#8ea8c8', 2]]) { g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= W; x += u) g.lineTo(x, hz - u * lift * (0.35 + per(x, 3, ph) * 0.45 + per(x, 11, ph * 3) * 0.25 + per(x, 29, ph) * 0.08)); g.lineTo(W, hz); g.closePath(); g.fillStyle = col; g.fill(); }
  R(g, 0, hz, W, H - hz, lin(g, 0, hz, 0, H, ['#9cc4e0', '#6c9cc8', '#4e82b4', '#447aac']));
  g.fillStyle = 'rgba(232,244,252,0.85)'; for (let i = 0; i < W / u * 1.4; i++) { const x = h3(i, 1, 2) * W, y = hz + u * 0.4 + h3(i, 2, 2) ** 1.6 * (H - hz - u); g.fillRect(x, y, u * (0.4 + h3(i, 3, 2) * 1.2), Math.max(1, u * 0.07)); }
  // Treasure Island, Yerba Buena
  ellp(g, W * 0.43, hz, u * 9, u * 2.2, '#5e7e56'); R(g, W * 0.43 - u * 6, hz - u * 0.9, u * 7, u * 0.9, '#8a9a8a');
  // the Bay Bridge: west spans with four towers, then the white east tower
  const deck = hz - u * 1.6, t = [0.06, 0.14, 0.24, 0.32].map((f) => W * f), top = deck - u * 7.5;
  lineW(g, [[W * 0.01, deck], [W * 0.38, deck]], '#7e8898', Math.max(1.5, u * 0.35), 'butt');
  for (let xx = W * 0.01; xx < W * 0.38; xx += u * 1.6) lineW(g, [[xx, deck], [xx, hz]], '#6e7888', Math.max(1, u * 0.12), 'butt');
  for (const tx of t) { R(g, tx - u * 0.35, top, u * 0.7, deck - top, lin(g, tx - u * 0.35, 0, tx + u * 0.35, 0, ['#c8d0dc', '#8a94a4'])); R(g, tx - u * 0.5, top - u * 0.15, u, u * 0.3, '#d8dee8'); R(g, tx - u * 0.35, top + u * 2.6, u * 0.7, u * 0.18, '#7a8494'); }
  g.lineWidth = Math.max(1, u * 0.1); g.strokeStyle = '#a8b0bc';
  for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(t[k], top); g.quadraticCurveTo((t[k] + t[k + 1]) / 2, deck + u * 1.2, t[k + 1], top); g.stroke(); }
  g.beginPath(); g.moveTo(W * 0.01, deck - u * 0.3); g.lineTo(t[0], top); g.moveTo(t[3], top); g.lineTo(W * 0.38, deck - u * 0.3); g.stroke();
  const ex = W * 0.52; lineW(g, [[W * 0.45, deck + u * 0.3], [W * 0.62, deck + u * 0.3]], '#8a94a4', Math.max(1.5, u * 0.3), 'butt'); R(g, ex - u * 0.3, deck - u * 6, u * 0.6, u * 6.3, '#eef2f6');
  g.strokeStyle = '#c8d0dc'; g.lineWidth = Math.max(1, u * 0.08); g.beginPath(); g.moveTo(W * 0.45, deck); g.lineTo(ex, deck - u * 6); g.lineTo(W * 0.6, deck); g.stroke();
  // sailboats and a ferry
  for (let i = 0; i < 10; i++) { const sx = ((i * 0.113 + 0.05) % 1) * W, sy = hz + u * (1 + ((i * 0.37) % 1) * 7); poly(g, [[sx, sy], [sx + u * 0.6, sy - u * 1.7], [sx + u * 0.75, sy]], '#fbfbf6'); poly(g, [[sx - u * 0.1, sy], [sx - u * 0.6, sy - u * 0.9], [sx - u * 0.05, sy - u * 1.2]], '#eef0f2'); R(g, sx - u * 0.3, sy, u * 1.3, u * 0.22, '#2a3a5a'); }
  const fx = W * 0.72, fy = hz + u * 3; rr(g, fx, fy - u * 0.8, u * 4.2, u * 0.8, u * 0.3, '#f6f4ee'); R(g, fx + u * 0.6, fy - u * 1.4, u * 2.6, u * 0.6, '#e8e6e0'); R(g, fx + u * 1.6, fy - u * 2, u * 0.5, u * 0.6, '#c8302c'); R(g, fx, fy, u * 4.2, u * 0.15, '#24344e');
  // clouds
  for (let i = 0; i < 7; i++) { const cx = ((i * 0.173 + 0.08) % 1) * W, cy = H - u * (24 + (i % 3) * 4); for (let kk = 0; kk < 6; kk++) ellp(g, cx + (kk - 2.5) * u * 1.6, cy - (kk % 2) * u * 0.7, u * 2.2, u * 1.2, kk % 2 ? '#f8fbfe' : '#eef4fa'); R(g, cx - u * 5, cy + u * 0.4, u * 10, u * 0.5, '#e2eaf4'); }
}
// a sidewalk passing close by: curb, street trees, lamp posts, hydrant, parked cars, people (cable car near layer)
export function drawSidewalk(g, W, H, u, o = {}) {
  const curb = H - u * 0.38;
  R(g, 0, curb, W, H - curb, '#4a4c52'); R(g, 0, curb - u * 0.16, W, u * 0.16, lin(g, 0, curb - u * 0.16, 0, curb, ['#e4e0d8', '#b8b4ac']));
  const SPAN = { tree: 3.8, lamp: 3, car: 6, people: 3.2, hydrant: 2.2, sign: 2 }, items = []; let sum = 0;
  for (let i = 0; sum < W; i++) { const r = h3(i, 3, 11), kind = r < 0.3 ? 'tree' : r < 0.48 ? 'lamp' : r < 0.68 ? 'car' : r < 0.8 ? 'people' : r < 0.88 ? 'hydrant' : 'sign'; items.push({ i, kind }); sum += SPAN[kind] * u; }
  const kk0 = W / sum; let x = u * 0.6;
  for (const { i, kind } of items) {
    if (kind === 'tree') tree(g, x + u * 1.2, curb, u * (2.8 + h3(i, 4, 11) * 0.8), u * 1.7, u);
    else if (kind === 'lamp') { const lx0 = x + u * 1.2; R(g, lx0 - u * 0.09, curb - u * 4.5, u * 0.18, u * 4.5, '#2a3a32'); R(g, lx0 - u * 0.16, curb - u * 0.5, u * 0.32, u * 0.5, '#22302a'); lineW(g, [[lx0 - u * 0.55, curb - u * 4.6], [lx0, curb - u * 4.4], [lx0 + u * 0.55, curb - u * 4.6]], '#22302a', u * 0.1); for (const lx of [lx0 - u * 0.55, lx0 + u * 0.55]) { orb(g, lx, curb - u * 4.95, u * 0.22, '#fff2d4', u * 0.28); R(g, lx - u * 0.14, curb - u * 5.3, u * 0.28, u * 0.1, '#22302a'); } }
    else if (kind === 'car') { const c = ['#c8483e', '#3a6ab0', '#e8e4da', '#2e2e34', '#5a8a6a', '#e8b830'][Math.floor(h3(i, 5, 11) * 6)], L = u * 4.2, cx0 = x + u * 0.6; rr(g, cx0, curb - u * 1.05, L, u * 0.75, u * 0.2, lin(g, 0, curb - u * 1.05, 0, curb - u * 0.3, [shift(c, 0.5), c, shift(c, -0.6)])); poly(g, [[cx0 + L * 0.2, curb - u * 1.0], [cx0 + L * 0.3, curb - u * 1.55], [cx0 + L * 0.72, curb - u * 1.55], [cx0 + L * 0.82, curb - u * 1.0]], c); const gl = lin(g, 0, curb - u * 1.45, 0, curb - u, ['#9ab8d4', '#3c5276']); poly(g, [[cx0 + L * 0.24, curb - u * 1.02], [cx0 + L * 0.32, curb - u * 1.45], [cx0 + L * 0.5, curb - u * 1.45], [cx0 + L * 0.5, curb - u * 1.02]], gl); poly(g, [[cx0 + L * 0.53, curb - u * 1.02], [cx0 + L * 0.53, curb - u * 1.45], [cx0 + L * 0.7, curb - u * 1.45], [cx0 + L * 0.78, curb - u * 1.02]], gl); for (const wx of [cx0 + L * 0.2, cx0 + L * 0.8]) { circ(g, wx, curb - u * 0.3, u * 0.33, '#18181c'); circ(g, wx, curb - u * 0.3, u * 0.15, '#a8acb4'); } }
    else if (kind === 'people') { for (let kk = 0; kk < 2 + (i % 2); kk++) { const px = x + u * (0.8 + kk * 0.9), top = curb - u * (1.55 + (kk % 2) * 0.12), cl = ['#e8603a', '#3a6ab0', '#f0c840', '#5a9a6a', '#c84a7a', '#2e2e38'][(i + kk) % 6]; R(g, px - u * 0.13, top + u * 1.0, u * 0.11, u * 0.55, '#2e3a5e'); R(g, px + u * 0.03, top + u * 1.0, u * 0.11, u * 0.55, '#2e3a5e'); rr(g, px - u * 0.22, top + u * 0.48, u * 0.44, u * 0.6, u * 0.12, cl); orb(g, px, top + u * 0.24, u * 0.27, ['#d8a27a', '#f0c8a0', '#a8724a'][(i + kk) % 3]); ellp(g, px, top + u * 0.08, u * 0.28, u * 0.15, ['#2a1e1a', '#e8c060', '#6a3a22'][(i + kk) % 3]); } }
    else if (kind === 'hydrant') { const hx = x + u * 0.9; rr(g, hx, curb - u * 0.7, u * 0.34, u * 0.7, u * 0.08, '#e8e4dc'); R(g, hx - u * 0.08, curb - u * 0.5, u * 0.5, u * 0.12, '#c8c4bc'); ellp(g, hx + u * 0.17, curb - u * 0.72, u * 0.2, u * 0.1, '#3a6ac8'); }
    else { const sx = x + u * 0.9; R(g, sx, curb - u * 2.8, u * 0.1, u * 2.8, '#8a8e94'); rr(g, sx - u * 0.5, curb - u * 3.2, u * 1.1, u * 0.42, u * 0.05, '#2a6a3a', '#f4f4ec', Math.max(1, u * 0.04)); }
    x += SPAN[kind] * u * kk0;
  }
}
// hillside of houses climbing behind a city block (arena backdrop), a fluted tower on the crest
export function drawHillside(g, W, H, u, o = {}) {
  const crest = (x) => H * 0.3 + (1 - Math.sin((x / W) * Math.PI)) * H * 0.3 + noise2(x / u, 2, 30) * u * 1.5;
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += u) g.lineTo(x, crest(x)); g.lineTo(W, H); g.closePath(); g.fillStyle = lin(g, 0, H * 0.3, 0, H, ['#6a9a50', '#4e7e40']); g.fill();
  const tx = W * (o.towerAt ?? 0.62), tb = crest(tx) + u * 0.6, th = u * 9;
  for (let k = 0; k < 7; k++) orb(g, tx - u * 3 + k * u, tb + u * 0.3 - (k % 2) * u * 0.4, u * 0.9, '#3e7230');
  R(g, tx - u * 1.1, tb - th, u * 2.2, th, lin(g, tx - u * 1.1, 0, tx + u * 1.1, 0, ['#fbf4e4', '#ece0c8', '#c8bca4'])); g.fillStyle = 'rgba(160,140,110,0.4)'; for (let xx = -0.9; xx <= 0.9; xx += 0.3) g.fillRect(tx + xx * u, tb - th, Math.max(1, u * 0.05), th);
  R(g, tx - u * 1.3, tb - th - u * 0.3, u * 2.6, u * 0.35, '#d8ccb4'); for (let xx = -0.9; xx <= 0.7; xx += 0.45) R(g, tx + xx * u, tb - th + u * 0.3, u * 0.22, u * 0.8, '#3a4a5a');
  for (let row = 0; row < 40 && H * 0.3 + u * (1.6 + row * 2.1) < H + u * 3; row++) {
    let x = ((row * 0.37) % 1) * u * 3 - u * 3;
    while (x < W) {
      const w = u * (3.2 + h3(x | 0, row, 3) * 2), base = crest(x + w / 2) + u * (1.6 + row * 2.1), h = u * (2.8 + h3(x | 0, row, 4) * 2.2);
      if (Math.abs(x + w / 2 - tx) < u * 2.8 && row < 2) { x += w; continue; }
      if (base < H + u && h3(x | 0, row, 5) > 0.1) {
        const sch = VIC[Math.floor(h3(x | 0, row, 6) * VIC.length)];
        if (row < 3 && h3(x | 0, row, 7) < 0.35) { R(g, x, base - h, w, h, shift(sch[0], 0.15)); g.fillStyle = o.lit ? '#ffd27a' : '#3a4a62'; for (let yy = base - h + u * 0.4; yy < base - u * 0.5; yy += u * 0.8) for (let xx = x + u * 0.3; xx < x + w - u * 0.5; xx += u * 0.7) g.fillRect(xx, yy, u * 0.35, u * 0.4); R(g, x, base - h, w, u * 0.15, shift(sch[0], -0.5)); }
        else house(g, x, base, w, h, sch, h3(x | 0, row, 8), u, { lit: o.lit });
      } else if (base < H + u) for (let kk = 0; kk < 4; kk++) orb(g, x + u * (0.8 + kk * 0.7), base - u * (0.5 + (kk % 2) * 0.4), u * 0.75, '#3e7230');
      x += w + h3(x | 0, row, 10) * u * 0.5;
    }
  }
}
// the Bay looking north from the wharf at golden hour: Alcatraz, Angel Island, Marin, the Golden Gate, the Bay Bridge
export function drawBayNorth(g, W, H, u, o = {}) {
  const wl = H - u * 0.2;
  const ridge = (x0, x1, peak, col, top, seed) => { g.beginPath(); g.moveTo(x0, wl); for (let x = x0; x <= x1; x += u * 2) { const t = (x - x0) / (x1 - x0); g.lineTo(x, wl - peak * Math.pow(Math.sin(t * Math.PI), 0.75) * (0.8 + noise2(x / u, seed, 18) * 0.4)); } g.lineTo(x1, wl); g.closePath(); g.fillStyle = lin(g, 0, wl - peak, 0, wl, [top, col]); g.fill(); };
  ridge(-W * 0.05, W * 0.44, u * 26, '#a08890', '#c4a8a8', 3);
  ridge(W * 0.55, W * 1.05, u * 18, '#a890a0', '#c8aeb0', 7);
  ridge(W * 0.2, W * 0.53, u * 20, '#7e8070', '#a49c86', 11);
  // fog spilling over the Marin ridge
  for (let i = 0; i < 16; i++) ellp(g, W * (0.01 + i * 0.024), wl - u * (19 + Math.sin(i * 1.3) * 3), u * 4.2, u * 1.6, i % 2 ? 'rgba(250,240,232,0.92)' : 'rgba(240,226,218,0.92)');
  // the Golden Gate, far left in haze
  const gd = wl - u * 9, g1 = W * 0.035, g2 = W * 0.15, gt = gd - u * 17;
  lineW(g, [[-u * 5, gd], [W * 0.2, gd]], '#c4604a', u * 0.6, 'butt');
  for (const gx of [g1, g2]) { R(g, gx - u * 0.5, gt, u, gd - gt + u * 2, lin(g, gx - u * 0.5, 0, gx + u * 0.5, 0, ['#e07a5a', '#b8503a'])); for (let j = 0; j < 4; j++) R(g, gx - u * 0.5, gt + u * (1 + j * 4), u, u * 0.3, '#a8462e'); }
  g.lineWidth = Math.max(1, u * 0.18); g.strokeStyle = '#d8745a'; g.beginPath(); g.moveTo(g1, gt); g.quadraticCurveTo((g1 + g2) / 2, gd + u * 2, g2, gt); g.moveTo(-u * 5, gd - u * 2); g.lineTo(g1, gt); g.moveTo(g2, gt); g.lineTo(W * 0.2, gd - u); g.stroke();
  // Alcatraz: the rock, the cellhouse, the lighthouse, the water tower
  const ax = W * 0.36, aw = W * 0.17, ah = u * 12;
  g.beginPath(); g.moveTo(ax - aw / 2, wl); for (let x = -aw / 2; x <= aw / 2; x += u * 0.5) { const t = x / (aw / 2); g.lineTo(ax + x, wl - ah * (1 - t * t * 0.5) * Math.min(1, (1 - Math.abs(t)) * 6) * (0.92 + noise2(x / u, 5, 6) * 0.16)); } g.lineTo(ax + aw / 2, wl); g.closePath(); g.fillStyle = lin(g, 0, wl - ah, 0, wl, ['#b8a07a', '#8a7a5c', '#5e5040']); g.fill();
  for (let i = 0; i < 26; i++) ellp(g, ax + (h3(i, 1, 4) - 0.5) * aw * 0.9, wl - h3(i, 2, 4) * ah * 0.7, u * 0.9, u * 0.5, i % 2 ? '#6a7a4a' : '#7a8a52');
  const cw = aw * 0.48, cy = wl - ah - u * 0.3;
  R(g, ax - cw / 2, cy - u * 3.2, cw, u * 3.4, lin(g, 0, cy - u * 3.2, 0, cy, ['#fff4dc', '#e6dac0'])); R(g, ax - cw / 2, cy - u * 3.4, cw, u * 0.25, '#c8bca0');
  g.fillStyle = '#5a5a62'; for (let x = ax - cw / 2 + u * 0.5; x < ax + cw / 2 - u * 0.4; x += u * 0.75) g.fillRect(x, cy - u * 2.4, u * 0.3, u * 1.4);
  R(g, ax + cw / 2 - u * 1.2, cy - u * 8, u * 1.1, u * 5, lin(g, 0, 0, u * 2, 0, ['#fffaf0', '#e0d4bc'])); R(g, ax + cw / 2 - u * 1.4, cy - u * 8.8, u * 1.5, u * 0.8, '#3a3a40'); circ(g, ax + cw / 2 - u * 0.65, cy - u * 8.3, u * 0.25, '#fff6c0');
  R(g, ax - cw / 2 - u * 3, cy - u * 1, u * 2.4, u * 2, '#ece0c8'); for (let j = 0; j < 4; j++) R(g, ax - cw / 2 - u * 2.9 + j * u * 0.7, cy + u, u * 0.14, u * 3.5, '#8a7a62');
  R(g, ax - aw / 2 + u * 1.5, wl - u * 2.4, u * 4.5, u * 1.8, '#dccfb2'); R(g, ax + aw / 2 - u * 6, wl - u * 2, u * 4, u * 1.4, '#d4c6a8');
  // the Bay Bridge far right
  const bd = wl - u * 5, bt = [0.8, 0.88, 0.96].map((f) => W * f), btop = bd - u * 12;
  lineW(g, [[W * 0.72, bd], [W * 1.02, bd]], '#8a8a9a', u * 0.5, 'butt');
  for (const tx of bt) R(g, tx - u * 0.4, btop, u * 0.8, bd - btop + u * 0.5, lin(g, tx - u * 0.4, 0, tx + u * 0.4, 0, ['#d0d0dc', '#9a9aa8']));
  g.strokeStyle = '#b4b4c4'; g.lineWidth = Math.max(1, u * 0.14); g.beginPath(); for (let k = 0; k < 2; k++) { g.moveTo(bt[k], btop); g.quadraticCurveTo((bt[k] + bt[k + 1]) / 2, bd + u * 2, bt[k + 1], btop); } g.stroke();
  // boats
  for (let i = 0; i < 11; i++) { const sx = ((i * 0.137 + 0.03) % 1) * W, sy = wl - u * 0.1; if (Math.abs(sx - ax) < aw * 0.6) continue; poly(g, [[sx, sy], [sx + u * 0.8, sy - u * (2.2 + (i % 3) * 0.6)], [sx + u * 0.95, sy]], i % 4 === 1 ? '#f8d8b0' : '#fffaf2'); if (i % 3 === 0) poly(g, [[sx - u * 0.1, sy], [sx - u * 0.8, sy - u], [sx - u * 0.1, sy - u * 1.5]], '#f4f0e8'); R(g, sx - u * 0.35, sy, u * 1.6, u * 0.22, '#2a3a52'); }
  const fx = W * 0.62, fy = wl - u * 0.4; rr(g, fx, fy - u * 0.8, u * 5.5, u * 0.9, u * 0.3, '#fbf8f0'); R(g, fx + u * 0.8, fy - u * 1.5, u * 3.6, u * 0.7, '#eeeae2'); R(g, fx + u * 1.9, fy - u * 2.1, u * 0.6, u * 0.6, '#c8302c'); g.fillStyle = '#3a4a62'; for (let x = fx + u; x < fx + u * 4.2; x += u * 0.45) g.fillRect(x, fy - u * 1.3, u * 0.22, u * 0.3);
  g.fillStyle = 'rgba(255,224,160,0.9)'; for (let x = 0; x < W; x += u * 0.6) if (h3(x | 0, 3, 1) < 0.3) g.fillRect(x, wl - Math.max(1, u * 0.05), u * (0.3 + h3(x | 0, 4, 1)), Math.max(1, u * 0.08));
}

// ============================================================ text signs and boards (decal painters, Canvas 2D, ppm ≥ 96)
const frameBox = (g, W, H, bg, fr, k = 0.05) => { const b = Math.max(2, Math.round(Math.min(W, H) * k)); R(g, 0, 0, W, H, fr); R(g, b, b, W - b * 2, H - b * 2, bg); return b; };
export const SG = {
  // ---- the cable car
  routeMap: () => smooth((g, W, H) => {
    const b = frameBox(g, W, H, '#f6eed8', '#7c1a20');
    txt(g, 'CALIFORNIA STREET LINE', W / 2, H * 0.18, W * 0.86, H * 0.18, { color: '#7c1a20' });
    const y = H * 0.56, stops = ['MARKET', 'KEARNY', 'GRANT', 'POWELL', 'JONES', 'HYDE', 'POLK', 'VAN NESS'];
    lineW(g, [[W * 0.07, y], [W * 0.93, y]], '#7c1a20', H * 0.06, 'butt');
    stops.forEach((s, i) => { const x = W * (0.07 + (i * 0.86) / (stops.length - 1)); circ(g, x, y, H * 0.055, i === 2 ? '#e8302c' : '#ffffff'); g.lineWidth = H * 0.025; g.strokeStyle = '#7c1a20'; g.beginPath(); g.arc(x, y, H * 0.055, 0, 6.2832); g.stroke(); txt(g, s, x, y + (i % 2 ? H * 0.2 : -H * 0.17), W * 0.13, H * 0.12, { color: '#3a2a1a', font: 'sans', weight: 700 }); });
    void b;
  }),
  rules: () => smooth((g, W, H) => {
    frameBox(g, W, H, '#fbf5e4', '#2a2a2a'); rr(g, W * 0.05, H * 0.08, W * 0.9, H * 0.84, 3, null, '#c8a040', Math.max(1, H * 0.02));
    txt(g, 'PLEASE HOLD ON', W / 2, H * 0.27, W * 0.8, H * 0.2, { color: '#7c1a20' });
    txt(g, 'Curves and hills ahead', W / 2, H * 0.5, W * 0.8, H * 0.13, { color: '#2a2a2a', font: 'serif', weight: 600, italic: true });
    txt(g, 'TOKON OFF THE SEATS  ·  FARE $8', W / 2, H * 0.74, W * 0.84, H * 0.13, { color: '#2a2a2a', font: 'sans', weight: 700 });
  }),
  carBand: (s = 'CALIFORNIA ST.') => smooth((g, W, H) => {
    R(g, 0, 0, W, H, lin(g, 0, 0, 0, H, ['#f6e8c0', '#ecdcac', '#d8c48c'])); R(g, 0, 0, W, Math.max(1, H * 0.06), '#d8a838'); R(g, 0, H - Math.max(1, H * 0.06), W, Math.max(1, H * 0.06), '#b88a2a');
    txt(g, s, W / 2, H / 2, W * 0.9, H * 0.62, { color: '#7c1a20', stroke: '#f8eed0', sw: H * 0.05 });
  }),
  carNumber: (n = '12') => smooth((g, W, H) => { rr(g, 0, 0, W, H, H * 0.2, '#d8a838'); rr(g, W * 0.08, H * 0.08, W * 0.84, H * 0.84, H * 0.16, '#7c1a20'); txt(g, n, W / 2, H / 2, W * 0.7, H * 0.62, { color: '#f4d470', stroke: '#4a0e10', sw: H * 0.06 }); }),
  pinstripe: () => smooth((g, W, H) => { g.lineWidth = Math.max(1.5, H * 0.04); g.strokeStyle = '#d8a838'; rr(g, H * 0.15, H * 0.15, W - H * 0.3, H * 0.7, H * 0.25, null, '#d8a838', Math.max(1.5, H * 0.04)); g.strokeStyle = '#f0cc68'; g.lineWidth = Math.max(1, H * 0.02); rr(g, H * 0.25, H * 0.25, W - H * 0.5, H * 0.5, H * 0.18, null, '#f0cc68', Math.max(1, H * 0.02)); }),
  dest: (a = 'VAN NESS', b = 'MARKET') => smooth((g, W, H) => { R(g, 0, 0, W, H, '#141414'); txt(g, a, W / 2, H * 0.3, W * 0.84, H * 0.34, { color: '#f6f2dc' }); txt(g, b, W / 2, H * 0.72, W * 0.84, H * 0.3, { color: '#f0c040' }); }),
  // ---- the arena
  chainLink: () => smooth((g, W, H) => { g.strokeStyle = '#a4a8b0'; g.lineWidth = 3; g.beginPath(); for (let x = -H; x < W + H; x += 8) { g.moveTo(x, 0); g.lineTo(x + H, H); g.moveTo(x, 0); g.lineTo(x - H, H); } g.stroke(); g.strokeStyle = '#d0d4da'; g.lineWidth = 1; g.stroke(); }),
  banner: (o) => smooth((g, W, H) => {
    R(g, 0, 0, W, H, o.bg); if (o.stripe) { R(g, 0, H * 0.82, W, H * 0.08, o.stripe); R(g, 0, H * 0.1, W, H * 0.04, o.stripe); }
    for (const x of [H * 0.12, W - H * 0.12]) for (const y of [H * 0.15, H * 0.85]) { circ(g, x, y, H * 0.05, '#e8e8ec'); circ(g, x, y, H * 0.025, '#6a6a70'); }
    txt(g, o.title, W / 2, H * (o.sub ? 0.4 : 0.5), W * 0.86, H * (o.sub ? 0.42 : 0.6), { color: o.ink || '#ffffff', stroke: o.outline, sw: H * 0.05, font: o.font || 'display' });
    if (o.sub) txt(g, o.sub, W / 2, H * 0.7, W * 0.8, H * 0.16, { color: o.ink2 || o.ink || '#ffffff', font: 'sans', weight: 700 });
  }),
  graffiti: (word, o = {}) => smooth((g, W, H) => {
    const cols = o.cols || ['#7af0e0', '#2ab0d8'], fam = FF.display;
    g.font = `400 100px ${fam}`; const m = g.measureText(word), size = 100 * Math.min((W * 0.92) / m.width, (H * 0.8) / ((m.actualBoundingBoxAscent || 70) + 2));
    g.font = `400 ${size}px ${fam}`; const tw = g.measureText(word).width, x = (W - tw) / 2, y = H * 0.84;
    g.lineJoin = 'round';
    g.lineWidth = size * 0.3; g.strokeStyle = '#1a1430'; g.strokeText(word, x + size * 0.06, y + size * 0.06);
    g.lineWidth = size * 0.2; g.strokeStyle = '#ffffff'; g.strokeText(word, x, y);
    g.fillStyle = lin(g, 0, y - size * 0.75, 0, y, cols); g.fillText(word, x, y);
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.save(); g.beginPath(); g.rect(0, y - size * 0.72, W, size * 0.16); g.clip(); g.fillText(word, x, y); g.restore();
    g.fillStyle = cols[1]; for (let i = 0; i < 14; i++) { const dx = x + h3(i, 9, 2) * tw, len = size * (0.12 + h3(i, 8, 2) * 0.3); rr(g, dx, y - size * 0.05, size * 0.05, len, size * 0.025, cols[1]); circ(g, dx + size * 0.025, y - size * 0.05 + len, size * 0.04, cols[1]); }
    for (let i = 0; i < 6; i++) { const sx = W * h3(i, 7, 3), sy = H * (0.1 + h3(i, 6, 3) * 0.3); g.strokeStyle = '#ffffff'; g.lineWidth = size * 0.03; g.beginPath(); g.moveTo(sx - size * 0.08, sy); g.lineTo(sx + size * 0.08, sy); g.moveTo(sx, sy - size * 0.08); g.lineTo(sx, sy + size * 0.08); g.stroke(); }
  }),
  tag: (word, col = '#e8302c') => smooth((g, W, H) => { txt(g, word, W / 2, H / 2, W * 0.95, H * 0.8, { color: col, font: 'serif', italic: true, weight: 900, stroke: '#1a1430', sw: H * 0.06 }); }),
  scoreboard: () => smooth((g, W, H) => {
    R(g, 0, 0, W, H, lin(g, 0, 0, 0, H, ['#0e2a1e', '#08160f'])); g.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    txt(g, 'STREET ARENA', W / 2, H * 0.14, W * 0.7, H * 0.13, { color: '#7af0a0' });
    txt(g, 'ROOKIE', W * 0.26, H * 0.36, W * 0.4, H * 0.13, { color: '#ffe060' }); txt(g, 'SPIKE', W * 0.74, H * 0.36, W * 0.4, H * 0.13, { color: '#ff7a6a' });
    txt(g, '0', W * 0.26, H * 0.63, W * 0.3, H * 0.32, { color: '#ffffff' }); txt(g, '0', W * 0.74, H * 0.63, W * 0.3, H * 0.32, { color: '#ffffff' }); txt(g, ':', W / 2, H * 0.62, W * 0.1, H * 0.25, { color: '#7af0a0' });
    txt(g, 'ROUND 1  ·  3:00', W / 2, H * 0.88, W * 0.6, H * 0.1, { color: '#7af0a0' });
    const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.65); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); R(g, 0, 0, W, H, gr);
  }),
  truckSign: () => smooth((g, W, H) => { R(g, 0, 0, W, H, '#2e8a7a'); rr(g, H * 0.08, H * 0.1, W - H * 0.16, H * 0.8, H * 0.2, null, '#f4efe4', H * 0.06); txt(g, 'BAO WOW!', W / 2, H / 2, W * 0.6, H * 0.62, { color: '#fff4d8', stroke: '#1a4a40', sw: H * 0.08 }); for (const x of [W * 0.12, W * 0.88]) { orb(g, x, H * 0.55, H * 0.3, '#f6f0e4', H * 0.25); circ(g, x, H * 0.32, H * 0.05, '#c8402c'); } }),
  truckSide: () => smooth((g, W, H) => { R(g, 0, 0, W, H, '#f0e8d8'); txt(g, 'STEAMED BAO  ·  BOBA  ·  TOKO TREATS', W / 2, H / 2, W * 0.92, H * 0.6, { color: '#2e8a7a' }); }),
  menuBoard: (title, lines, o = {}) => smooth((g, W, H) => {
    const b = frameBox(g, W, H, o.bg || '#1e2420', o.frame || '#8a6a3a', 0.035);
    if (o.chalk !== false) { g.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < 60; i++) g.fillRect(h3(i, 1, 5) * W, h3(i, 2, 5) * H, W * 0.15, 2); }
    txt(g, title, W / 2, b + H * 0.11, W * 0.8, H * 0.15, { color: o.title || '#f8d860' });
    lineW(g, [[W * 0.1, b + H * 0.21], [W * 0.9, b + H * 0.21]], o.title || '#f8d860', Math.max(1, H * 0.008));
    const n = lines.length, row = (H - b * 2 - H * 0.26) / n;
    lines.forEach((ln, i) => { const [a, p] = ln.split('|'), y = b + H * 0.25 + row * (i + 0.5); txt(g, a, W * 0.08 + W * 0.33, y, W * 0.64, row * 0.62, { color: o.ink || '#f4f0e0', align: 'left', font: o.font || 'sans', weight: 700 }); if (p) txt(g, p, W * 0.85, y, W * 0.16, row * 0.62, { color: o.price || '#ff9a7a', align: 'right', font: o.font || 'sans', weight: 800 }); });
  }),
  vending: () => smooth((g, W, H) => {
    rr(g, 0, 0, W, H, W * 0.04, lin(g, 0, 0, W, 0, ['#e83a2c', '#c8241c', '#9a1a12']));
    rr(g, W * 0.06, H * 0.05, W * 0.6, H * 0.74, W * 0.02, '#1a1a22');
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) { const x = W * (0.1 + c * 0.14), y = H * (0.08 + r * 0.14); rr(g, x, y, W * 0.09, H * 0.1, 2, ['#f8d030', '#2a8ae8', '#e8502c', '#7af0a0', '#ff8ab0'][(r + c) % 5]); R(g, x - W * 0.01, y + H * 0.11, W * 0.12, Math.max(1, H * 0.008), '#8a8a90'); }
    txt(g, 'TOKO', W * 0.83, H * 0.12, W * 0.28, H * 0.1, { color: '#fff4c0' }); R(g, W * 0.72, H * 0.3, W * 0.22, H * 0.03, '#1a1a1a'); rr(g, W * 0.72, H * 0.4, W * 0.22, H * 0.12, 2, '#2a2a2a'); rr(g, W * 0.08, H * 0.84, W * 0.56, H * 0.1, 2, '#141418');
  }),
  emblemFloor: () => smooth((g, W, H) => {
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 2;
    g.lineWidth = r * 0.07; g.strokeStyle = '#f0c040'; g.beginPath(); g.arc(cx, cy, r * 0.94, 0, 6.2832); g.stroke(); g.strokeStyle = '#1a2a5a'; g.lineWidth = r * 0.04; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, 6.2832); g.stroke();
    poly(g, [[cx - r * 0.45, cy - r * 0.42], [cx + r * 0.45, cy - r * 0.42], [cx + r * 0.42, cy + r * 0.05], [cx, cy + r * 0.55], [cx - r * 0.42, cy + r * 0.05]], lin(g, cx - r * 0.45, 0, cx + r * 0.45, 0, ['#f6d050', '#d8a028']));
    poly(g, [[cx - r * 0.04, cy - r * 0.34], [cx + r * 0.16, cy - r * 0.34], [cx + r * 0.04, cy - r * 0.04], [cx + r * 0.16, cy - r * 0.04], [cx - r * 0.12, cy + r * 0.38], [cx - r * 0.02, cy + r * 0.06], [cx - r * 0.14, cy + r * 0.06]], '#c8242c');
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) circ(g, h3(i, 1, 7) * W, h3(i, 2, 7) * H, 1 + h3(i, 3, 7) * r * 0.03, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'source-over';
  }),
  backDoor: (cj, en) => smooth((g, W, H) => { frameBox(g, W, H, '#f6eed8', '#c8302c', 0.06); txt(g, cj, W / 2, H * 0.4, W * 0.8, H * 0.48, { color: '#c8302c', font: 'sans', weight: 900 }); txt(g, en, W / 2, H * 0.8, W * 0.8, H * 0.16, { color: '#2a2a2a', font: 'sans', weight: 700 }); }),
  roadSign: () => smooth((g, W, H) => {
    rr(g, 0, 0, W, H, H * 0.06, '#1e6a3a'); rr(g, H * 0.04, H * 0.04, W - H * 0.08, H * 0.92, H * 0.05, null, '#f4f4ec', H * 0.025);
    txt(g, 'Broadway', W * 0.36, H * 0.32, W * 0.56, H * 0.26, { color: '#f4f4ec', font: 'sans', weight: 700 });
    txt(g, 'Chinatown', W * 0.36, H * 0.66, W * 0.56, H * 0.24, { color: '#f4f4ec', font: 'sans', weight: 700 });
    rr(g, W * 0.72, H * 0.2, W * 0.2, H * 0.6, H * 0.04, '#f4f4ec'); txt(g, 'EXIT', W * 0.82, H * 0.36, W * 0.16, H * 0.18, { color: '#1e6a3a' }); txt(g, '2B', W * 0.82, H * 0.62, W * 0.16, H * 0.24, { color: '#1e6a3a' });
  }),
  // ---- the pier
  woodSign: (s, o = {}) => smooth((g, W, H) => {
    rr(g, 0, 0, W, H, H * 0.12, o.edge || '#3a2414'); rr(g, H * 0.05, H * 0.05, W - H * 0.1, H * 0.9, H * 0.1, lin(g, 0, 0, 0, H, [o.bg2 || '#8a5c36', o.bg || '#6e4628']));
    g.strokeStyle = 'rgba(40,20,8,0.35)'; g.lineWidth = Math.max(1, H * 0.012); for (let i = 0; i < 9; i++) { const y = H * (0.12 + i * 0.1); g.beginPath(); g.moveTo(H * 0.1, y); g.bezierCurveTo(W * 0.3, y + H * 0.03, W * 0.6, y - H * 0.03, W - H * 0.1, y); g.stroke(); }
    rr(g, H * 0.11, H * 0.11, W - H * 0.22, H * 0.78, H * 0.08, null, o.gold || '#e0b048', Math.max(1.5, H * 0.03));
    txt(g, s, W / 2, H * (o.sub ? 0.42 : 0.52), W * 0.84, H * (o.sub ? 0.4 : 0.52), { color: o.ink || '#f8dc80', stroke: o.outline || '#2a1608', sw: H * 0.05, font: o.font || 'display' });
    if (o.sub) txt(g, o.sub, W / 2, H * 0.74, W * 0.76, H * 0.14, { color: o.ink2 || '#f4ecd8', font: 'serif', italic: true, weight: 700 });
  }),
  bigSign: () => smooth((g, W, H) => {
    rr(g, 0, 0, W, H, H * 0.08, '#2a1a0e'); rr(g, H * 0.04, H * 0.04, W - H * 0.08, H * 0.92, H * 0.06, lin(g, 0, 0, 0, H, ['#8e5e36', '#6e4628']));
    g.strokeStyle = 'rgba(40,20,8,0.3)'; g.lineWidth = Math.max(1, H * 0.01); for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0, H * i / 8); g.lineTo(W, H * i / 8); g.stroke(); }
    rr(g, H * 0.09, H * 0.09, W - H * 0.18, H * 0.82, H * 0.05, null, '#e8b840', H * 0.03);
    seaLion(g, W * 0.04, H * 0.2, W * 0.13, H * 0.66, '#7e5638', 'bark');
    txt(g, 'PIER 39', W * 0.54, H * 0.44, W * 0.62, H * 0.56, { color: '#fff2c8', stroke: '#2a1a0e', sw: H * 0.06 });
    txt(g, 'SHOPS  ·  FOOD  ·  SEA LIONS', W * 0.54, H * 0.8, W * 0.6, H * 0.12, { color: '#f8d870', font: 'serif', weight: 700 });
  }),
  iceDisplay: () => smooth((g, W, H) => {
    R(g, 0, 0, W, H, '#e8f4f8'); for (let i = 0; i < 160; i++) ellp(g, h3(i, 1, 3) * W, h3(i, 2, 3) * H, 2 + h3(i, 3, 3) * 3, 1.5 + h3(i, 4, 3) * 2, i % 3 ? '#ffffff' : '#cfe4ee');
    for (let i = 0; i < 4; i++) { const cx = W * (0.14 + i * 0.24), cy = H * 0.38, r = Math.min(W * 0.08, H * 0.2); for (const s of [-1, 1]) { lineW(g, [[cx + s * r * 0.8, cy - r * 0.2], [cx + s * r * 1.3, cy - r * 0.8]], '#c8301c', r * 0.18); orb(g, cx + s * r * 1.4, cy - r * 0.95, r * 0.3, '#d8381e'); for (let j = 0; j < 3; j++) lineW(g, [[cx + s * r * 0.5, cy + r * 0.2 + j * r * 0.15], [cx + s * r * 1.1, cy + r * 0.5 + j * r * 0.2]], '#a8281a', r * 0.1); } orb(g, cx, cy, r, '#d8381e', r * 0.7); circ(g, cx - r * 0.25, cy - r * 0.5, r * 0.08, '#1a1010'); circ(g, cx + r * 0.25, cy - r * 0.5, r * 0.08, '#1a1010'); }
    for (let i = 0; i < 3; i++) { const x = W * (0.12 + i * 0.3), y = H * 0.78, L = W * 0.18; ellp(g, x + L / 2, y, L / 2, H * 0.07, lin(g, 0, y - H * 0.07, 0, y + H * 0.07, ['#d0dce6', '#8a9aa8', '#6a7a88'])); poly(g, [[x + L, y], [x + L * 1.18, y - H * 0.07], [x + L * 1.18, y + H * 0.07]], '#7a8a98'); circ(g, x + L * 0.12, y - H * 0.01, H * 0.015, '#1a1a1a'); }
    for (let i = 0; i < 7; i++) { const x = W * (0.08 + i * 0.13), y = H * 0.6; g.beginPath(); g.arc(x, y, H * 0.05, 0.3, 3.6); g.lineWidth = H * 0.035; g.strokeStyle = '#f0906a'; g.stroke(); }
  }),
  shopWin: (kind) => smooth((g, W, H) => {
    R(g, 0, 0, W, H, lin(g, 0, 0, 0, H, ['#4a3426', '#2e2018']));
    const shelf = (y) => { R(g, 0, y, W, H * 0.03, '#b08050'); R(g, 0, y + H * 0.03, W, H * 0.02, '#5a3a20'); };
    if (kind === 'candy') { for (let s = 0; s < 3; s++) { const y = H * (0.06 + s * 0.31); shelf(y + H * 0.24); for (let i = 0; i < 6; i++) { const x = W * (0.04 + i * 0.16), c = ['#ff5a8a', '#7af0e0', '#ffd030', '#8ae86a', '#ff8a3a', '#b88aff'][(i + s) % 6]; rr(g, x, y + H * 0.03, W * 0.12, H * 0.21, W * 0.02, 'rgba(220,240,248,0.95)'); for (let kk = 0; kk < 9; kk++) circ(g, x + W * (0.025 + (kk % 3) * 0.035), y + H * (0.1 + Math.floor(kk / 3) * 0.045), W * 0.016, kk % 2 ? c : shift(c, 0.5)); R(g, x, y + H * 0.02, W * 0.12, H * 0.025, '#c8302c'); } } }
    else if (kind === 'plush') { shelf(H * 0.5); shelf(H * 0.94); for (let i = 0; i < 4; i++) seaLion(g, W * (0.03 + i * 0.24), H * 0.24, W * 0.2, H * 0.26, ['#7e5638', '#8a6448', '#6a4630', '#9a7454'][i], i % 2 ? 'up' : 'lie'); for (let i = 0; i < 5; i++) { orb(g, W * (0.1 + i * 0.2), H * 0.8, W * 0.06, ['#f0c040', '#e8502c', '#7af0e0', '#ff8ab0', '#f4f0e8'][i]); circ(g, W * (0.08 + i * 0.2), H * 0.78, W * 0.008, '#1a1a1a'); circ(g, W * (0.12 + i * 0.2), H * 0.78, W * 0.008, '#1a1a1a'); } }
    else if (kind === 'shirts') { for (let i = 0; i < 4; i++) { const x = W * (0.04 + i * 0.24), c = ['#e8502c', '#2e5a9c', '#f4f0e8', '#2e8a5a'][i], w = W * 0.19; poly(g, [[x, H * 0.12], [x + w * 0.3, H * 0.06], [x + w * 0.7, H * 0.06], [x + w, H * 0.12], [x + w * 0.88, H * 0.26], [x + w * 0.78, H * 0.22], [x + w * 0.78, H * 0.6], [x + w * 0.22, H * 0.6], [x + w * 0.22, H * 0.22], [x + w * 0.12, H * 0.26]], c); txt(g, ['SF', 'FOG', '39', 'BAY'][i], x + w / 2, H * 0.36, w * 0.5, H * 0.1, { color: i === 2 ? '#c8302c' : '#f8f0d8' }); } shelf(H * 0.8); for (let i = 0; i < 7; i++) rr(g, W * (0.04 + i * 0.135), H * 0.66, W * 0.11, H * 0.14, 2, ['#c8302c', '#f0c040', '#2e6a9a'][i % 3]); }
    else if (kind === 'cards') { for (let r2 = 0; r2 < 3; r2++) for (let c = 0; c < 5; c++) { const x = W * (0.04 + c * 0.19), y = H * (0.05 + r2 * 0.31), cw = W * 0.15, ch = H * 0.26; rr(g, x, y, cw, ch, cw * 0.08, '#f8f0d0', '#c8a040', 1.5); R(g, x + cw * 0.1, y + ch * 0.1, cw * 0.8, ch * 0.45, lin(g, 0, y, 0, y + ch * 0.5, [['#e8502c', '#2a8ae8', '#8ae86a', '#ff8ab0', '#f0c040'][(r2 * 5 + c) % 5], '#ffffff'])); for (let l = 0; l < 2; l++) R(g, x + cw * 0.12, y + ch * (0.65 + l * 0.12), cw * 0.76, Math.max(1, ch * 0.04), '#8a8070'); } }
    else if (kind === 'fudge') { shelf(H * 0.5); shelf(H * 0.94); for (let i = 0; i < 5; i++) { const x = W * (0.04 + i * 0.19), y = H * 0.36, c = ['#5a3018', '#e8dcc0', '#7a4a28', '#c88a5a', '#3a2010'][i]; R(g, x, y, W * 0.16, H * 0.14, lin(g, 0, y, 0, y + H * 0.14, [shift(c, 0.4), c])); R(g, x, y, W * 0.16, H * 0.025, shift(c, 0.8)); } for (let i = 0; i < 7; i++) orb(g, W * (0.08 + i * 0.14), H * 0.86, W * 0.05, '#6a3a1a'); }
    else { for (let i = 0; i < 3; i++) { const x = W * (0.06 + i * 0.32); poly(g, [[x, H * 0.62], [x + W * 0.12, H * 0.14], [x + W * 0.24, H * 0.62]], ['#e8502c', '#f0c040', '#2a8ae8'][i]); lineW(g, [[x + W * 0.12, H * 0.62], [x + W * 0.13, H * 0.95]], '#f4f0e8', 1.5); } }
    g.fillStyle = 'rgba(255,255,255,0.12)'; poly(g, [[W * 0.1, 0], [W * 0.22, 0], [W * 0.02, H], [0, H], [0, H * 0.7]], 'rgba(255,255,255,0.1)');
  }),
  infoBoard: () => smooth((g, W, H) => {
    frameBox(g, W, H, '#f6eedc', '#2e5a7a', 0.03); R(g, 0, 0, W, H * 0.2, '#2e5a7a');
    txt(g, 'THE SEA LIONS OF K-DOCK', W / 2, H * 0.1, W * 0.86, H * 0.12, { color: '#f6eedc' });
    seaLion(g, W * 0.05, H * 0.3, W * 0.36, H * 0.42, '#7e5638', 'lie');
    ['They arrived in 1990 and', 'never left. Up to 900 at', 'a time in winter. They', 'can be noisy: be kind.'].forEach((l, i) => txt(g, l, W * 0.71, H * (0.32 + i * 0.12), W * 0.5, H * 0.08, { color: '#2a2a2a', font: 'serif', weight: 500, align: 'left' }));
    txt(g, 'PLEASE DO NOT FEED THE SEA LIONS', W / 2, H * 0.88, W * 0.86, H * 0.09, { color: '#c8302c', font: 'sans', weight: 800 });
  }),
  rounding: (i) => smooth((g, W, H) => {
    R(g, 0, 0, W, H, lin(g, 0, 0, 0, H, ['#f8dc70', '#d8a838', '#a87a1c']));
    rr(g, W * 0.12, H * 0.14, W * 0.76, H * 0.72, H * 0.3, i % 2 ? '#c8242c' : '#2e5a9c');
    rr(g, W * 0.18, H * 0.22, W * 0.64, H * 0.56, H * 0.24, lin(g, 0, 0, W, H, ['#e8f0f4', '#a8bcc8', '#f4f8fa']));
    for (const s of [-1, 1]) { g.strokeStyle = '#fff0a0'; g.lineWidth = H * 0.06; g.beginPath(); g.arc(W / 2 + s * W * 0.43, H / 2, H * 0.22, s > 0 ? Math.PI * 0.6 : -Math.PI * 0.4, s > 0 ? Math.PI * 1.4 : Math.PI * 0.4); g.stroke(); }
    circ(g, W / 2, H * 0.1, H * 0.06, '#fff4b0'); circ(g, W / 2, H * 0.9, H * 0.06, '#fff4b0');
  }),
};
