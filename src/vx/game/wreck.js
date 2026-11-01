// Wreck: the street takes the fight. While a battle runs, the props around the ring can break and the ground cracks:
//  · bins, bollards, mailboxes and barriers topple; benches snap in the middle; crates, boxes and planters shatter;
//    signs and bike racks bend; cones and A-boards go flying; hydrants spout; vending machines crack their glass.
//    The prop's own geometry is lifted out of the city's merged static meshes (its vertices collapsed in place and
//    remembered), so what falls over is the real thing.
//  · voxel debris chunks in the prop's own colours fly with gravity, bounce and settle (one pooled instanced mesh)
//  · pixel decals: cracks and craters on the ground, cracked glass on nearby windows; dust and smoke (vfx.js)
//  · restore() puts every vertex back and clears the debris and decals: the city is never left broken.
// Battle.js makes one per fight: new Wreck(app, { at: [x, z], r }) and calls impact(x, z, o) on heavy blows.
import * as THREE from '../../../vendor/three.module.js';
import { PROPS } from '../city/voxprops.js';
import { VFX } from './vfx.js';

const V3 = THREE.Vector3, _m = new THREE.Matrix4(), _p = new V3(), _q = new THREE.Quaternion(), _s = new V3(), _e = new THREE.Euler(), _inv = new THREE.Matrix4();
// what breaks and how: hp (hits), how (topple / split / shatter / bend / fly / spout / glass / dent), material (sound, chips)
const BREAK = [
  [/bench/i, { hp: 3, how: 'split', mat: 'wood' }], [/^bin|trash|bin$/i, { hp: 2, how: 'topple', mat: 'metal' }], [/crate/i, { hp: 2, how: 'shatter', mat: 'wood' }],
  [/boxes|parcel|carton/i, { hp: 1, how: 'shatter', mat: 'wood' }], [/^sign|psign|_sign/i, { hp: 2, how: 'bend', mat: 'metal' }], [/cone/i, { hp: 1, how: 'fly', mat: 'plastic' }],
  [/bollard/i, { hp: 3, how: 'topple', mat: 'metal' }], [/mailbox|postbox/i, { hp: 3, how: 'topple', mat: 'metal' }], [/hydrant/i, { hp: 4, how: 'spout', mat: 'metal' }],
  [/planter|pot$/i, { hp: 3, how: 'shatter', mat: 'stone' }], [/bikeRack|bike_?rack/i, { hp: 3, how: 'bend', mat: 'metal' }], [/sandwich|aboard/i, { hp: 1, how: 'fly', mat: 'wood' }],
  [/bags/i, { hp: 1, how: 'shatter', mat: 'plastic' }], [/barrier/i, { hp: 2, how: 'topple', mat: 'plastic' }], [/vending/i, { hp: 5, how: 'glass', mat: 'glass' }],
  [/scooter/i, { hp: 2, how: 'topple', mat: 'metal' }], [/dumpster/i, { hp: 5, how: 'dent', mat: 'metal' }], [/bucket/i, { hp: 1, how: 'fly', mat: 'plastic' }],
];
const specOf = (kind) => { for (const [re, s] of BREAK) if (re.test(kind)) return s; return null; };
const SOUND = { wood: 'destroy_wood', metal: 'destroy_metal', glass: 'destroy_glass', stone: 'destroy_wood', plastic: 'destroy_wood' };

// ---------------------------------------------------------------- decal textures (pixel art, nearest)
let TEX = null;
function decalTex() {
  if (TEX) return TEX;
  const mk = (W, H, fn) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), img = g.createImageData(W, H); fn((x, y, col) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4, n = parseInt(col.slice(1), 16); img.data[i] = n >> 16; img.data[i + 1] = (n >> 8) & 255; img.data[i + 2] = n & 255; img.data[i + 3] = 255; }, W, H); g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return t; };
  let s = 7; const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const crackLines = (px, cx, cy, n, len, dark, lite) => {
    for (let b = 0; b < n; b++) { let x = cx, y = cy, a = (b / n) * Math.PI * 2 + R() * 0.6; const L = len * (0.6 + R() * 0.5);
      for (let d = 0; d < L; d++) { a += (R() - 0.5) * 0.5; x += Math.cos(a); y += Math.sin(a); px(x, y, dark); if (d % 3 === 0) px(x + 1, y, dark); if (d % 2) px(x, y - 1, lite);
        if (R() < 0.06 && d > 4) { let x2 = x, y2 = y, a2 = a + (R() < 0.5 ? 1 : -1) * (0.7 + R() * 0.5); for (let e = 0; e < L * 0.3; e++) { a2 += (R() - 0.5) * 0.5; x2 += Math.cos(a2); y2 += Math.sin(a2); px(x2, y2, dark); } } } }
  };
  const crack = mk(64, 64, (px) => { crackLines(px, 32, 32, 6, 30, '#1e1a1c', '#8a8488'); for (let i = 0; i < 6; i++) px(30 + R() * 4, 30 + R() * 4, '#1e1a1c'); });
  const crater = mk(64, 64, (px) => {
    // a jagged pit (many-sided, never round): rubble rim, dark scorched floor, cracks running off it
    const n = 11, pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + R() * 0.3, r = 14 + R() * 8; pts.push([32 + Math.cos(a) * r, 32 + Math.sin(a) * r]); }
    const inside = (x, y, sc) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) { const xi = 32 + (pts[i][0] - 32) * sc, yi = 32 + (pts[i][1] - 32) * sc, xj = 32 + (pts[j][0] - 32) * sc, yj = 32 + (pts[j][1] - 32) * sc; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { if (inside(x, y, 1.12) && !inside(x, y, 1)) px(x, y, (x + y) % 3 ? '#6a625e' : '#9a928c'); else if (inside(x, y, 1)) px(x, y, inside(x, y, 0.6) ? '#1a1416' : (x * 7 + y * 3) % 5 ? '#2e2628' : '#4a4042'); }
    crackLines(px, 32, 32, 7, 30, '#1a1416', '#7a7276');
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = 20 + R() * 9, x = 32 + Math.cos(a) * r, y = 32 + Math.sin(a) * r; px(x, y, '#5a524e'); px(x + 1, y, '#8a827c'); }
  });
  const glass = mk(48, 48, (px) => { crackLines(px, 24, 22, 8, 22, '#f4fbff', '#a8d8f0'); for (let i = 0; i < 5; i++) { const x = 22 + R() * 4, y = 20 + R() * 4; px(x, y, '#ffffff'); } });
  return (TEX = { crack, crater, glass });
}

export class Wreck {
  constructor(app, o = {}) {
    this.app = app; this.w = app.world; this.vfx = VFX.of(app); this.at = o.at; this.r = o.r || 6;
    this.props = []; this.saved = []; this.pieces = []; this.decals = []; this.spouts = []; this.t = 0;
    this.grp = new THREE.Group(); this.grp.name = 'wreck'; app.stage.scene.add(this.grp);
    this.pool(); try { this.scan(); } catch (e) { console.warn('[wreck] scan', e); this.props = []; }
  }
  // ---------------------------------------------------------------- the breakable props round the ring
  scan() {
    const city = this.w.sc && this.w.sc.city, root = city && city.root; if (!root) return;
    const [cx, cz] = this.at, R = this.r + 4.5, found = [];
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isInstancedMesh || !o.userData || !o.userData.data) return;
      const kind = o.userData.prop || '', spec = specOf(kind); if (!spec) return;
      const PR = PROPS[kind], sz = PR && PR.size ? PR.size.map((v) => v / 16) : [0.8, 1, 0.8];
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, _m); _m.premultiply(o.matrixWorld); _m.decompose(_p, _q, _s);
        if (Math.hypot(_p.x - cx, _p.z - cz) > R) continue;
        const yaw = _e.setFromQuaternion(_q, 'YXZ').y, sc = _s.x || 1;
        found.push({ kind, spec, hp: spec.hp, x: _p.x, y: _p.y, z: _p.z, yaw, hx: (sz[0] * sc) / 2, hy: sz[1] * sc, hz: (sz[2] * sc) / 2, rad: Math.max(sz[0], sz[2]) * sc * 0.5, broken: false, verts: [] });
      }
    });
    if (!found.length) return;
    // find each prop's vertices in the merged static meshes (world-baked): an oriented box test round its footprint
    const statics = []; root.traverse((m) => { if (m.isMesh && m.name === 'statics' && m.geometry && m.geometry.attributes.position) statics.push(m); });
    for (const m of statics) {
      const bs = m.geometry.boundingSphere; if (!bs) continue;
      _p.copy(bs.center).applyMatrix4(m.matrixWorld); if (Math.hypot(_p.x - cx, _p.z - cz) > bs.radius + R + 2) continue;
      _inv.copy(m.matrixWorld).invert();
      const pos = m.geometry.attributes.position, A = pos.array, n = pos.count, local = found.map((f) => { const q = new V3(f.x, f.y, f.z).applyMatrix4(_inv); return { f, x: q.x, y: q.y, z: q.z, c: Math.cos(-f.yaw), s: Math.sin(-f.yaw) }; });
      const owner = new Int16Array(n).fill(-1); let any = false;
      for (let v = 0; v < n; v++) {
        const x = A[v * 3], y = A[v * 3 + 1], z = A[v * 3 + 2];
        for (let k = 0; k < local.length; k++) {
          const L = local[k], f = L.f, dx = x - L.x, dz = z - L.z;
          if (Math.abs(dx) > f.rad + 0.6 || Math.abs(dz) > f.rad + 0.6) continue;
          const lx = dx * L.c - dz * L.s, lz = dx * L.s + dz * L.c, dy = y - L.y;
          if (Math.abs(lx) <= f.hx * 1.15 + 0.06 && Math.abs(lz) <= f.hz * 1.15 + 0.06 && dy > -0.08 && dy < f.hy * 1.12 + 0.08) { owner[v] = k; any = true; break; }
        }
      }
      if (!any) continue;
      for (let k = 0; k < local.length; k++) { const idx = []; for (let v = 0; v < n; v++) if (owner[v] === k) idx.push(v); if (idx.length) local[k].f.verts.push({ m, idx: Uint32Array.from(idx), owner, k }); }
    }
    this.props = found.filter((f) => f.verts.length);
  }
  // ---------------------------------------------------------------- a blow at (x, z): o: { r, power, dir: [dx, dz], crack, crater, y }
  impact(x, z, o = {}) {
    const r = o.r ?? 1.2, pw = o.power ?? 1, gy = o.y ?? this.w.ground(x, z);
    if (o.crater) this.decal('crater', x, gy, z, Math.max(1.2, r * 1.2));
    else if (o.crack) this.decal('crack', x, gy, z, Math.max(1, r * 1.1));
    if (o.crater) { this.vfx.dust(new V3(x, gy + 0.2, z), 3, 1.2); this.vfx.smoke(new V3(x, gy + 0.5, z), 1); this.debris(x, gy + 0.1, z, Math.round(6 + pw * 4), ['#4a4446', '#6a625e', '#8a827c'], 3.5 + pw); }
    for (const P of this.props) {
      if (P.broken) continue;
      const d = Math.hypot(P.x - x, P.z - z); if (d > r + P.rad) continue;
      P.hp -= pw * (1 - 0.5 * d / (r + P.rad));
      const dir = d > 0.01 ? [(P.x - x) / d, (P.z - z) / d] : o.dir || [1, 0];
      if (P.hp <= 0) this.breakProp(P, dir, pw); else this.jolt(P, dir);
    }
    if (pw >= 1.4) this.windows(x, gy, z, r + 1.6);
  }
  jolt(P) { this.vfx.burst('chip', new V3(P.x, P.y + P.hy * 0.6, P.z), { n: 3, tint: P.spec.mat === 'wood' ? '#a8784a' : '#c8ccd8' }); }
  // ---------------------------------------------------------------- breaking one prop
  breakProp(P, dir, pw) {
    P.broken = true;
    const how = P.spec.how, cols = this.colours(P), au = this.app.audio, mid = new V3(P.x, P.y + P.hy * 0.5, P.z);
    if (au && au.sfx) au.sfx(SOUND[P.spec.mat] || 'destroy_wood', { vol: 0.8, pitch: 0.9 + Math.random() * 0.2 });
    this.vfx.dust(new V3(P.x, P.y + 0.15, P.z), 2, 0.9);
    if (P.spec.mat === 'metal') this.vfx.burst('spark', mid, { n: 2 });
    if (P.spec.mat === 'glass') this.vfx.burst('shard', mid, { n: 10 });
    const cine = this.app.cinema; if (cine) cine.shake(0.06 + 0.03 * pw, 7);
    if (how === 'spout') { this.spouts.push({ x: P.x, y: P.y + P.hy, z: P.z, t: 3.2 }); this.debris(P.x, mid.y, P.z, 4, cols, 2.5); return; }
    if (how === 'glass') { this.decalWall(P, dir); this.debris(P.x, mid.y, P.z, 6, ['#bfe8ff', '#e8f6ff', '#8ab8d8'], 3); return; }
    if (how === 'dent') { this.debris(P.x, mid.y, P.z, 5, cols, 3); return; }
    if (how === 'shatter') { this.hide(P); this.debris(P.x, mid.y, P.z, Math.round(12 + P.hy * 14), cols, 4 + pw); this.vfx.smoke(mid, 1, 0.8); return; }
    // the rest move the prop's own geometry
    const pieces = how === 'split' ? this.extract(P, 2) : this.extract(P, 1); if (!pieces.length) { this.debris(P.x, mid.y, P.z, 10, cols, 4); return; }
    this.hide(P);
    const dx = dir[0], dz = dir[1], axis = new V3(dz, 0, -dx).normalize();     // tip away from the blow
    if (how === 'topple') { const piv = new V3(P.x + dx * P.rad * 0.9, P.y, P.z + dz * P.rad * 0.9); this.piece(pieces[0], piv, { axis, to: Math.PI / 2 - 0.05, acc: 7 }); }
    else if (how === 'bend') { const piv = new V3(P.x, P.y, P.z); this.piece(pieces[0], piv, { axis, to: 0.5 + Math.random() * 0.25, acc: 10 }); }
    else if (how === 'fly') { const piv = new V3(P.x, P.y + P.hy * 0.5, P.z); this.piece(pieces[0], piv, { fly: new V3(dx * (3 + pw * 1.5), 3.5 + pw, dz * (3 + pw * 1.5)), spin: new V3(Math.random() * 8 - 4, Math.random() * 6 - 3, Math.random() * 8 - 4) }); }
    else if (how === 'split') {
      // snapped in the middle: each half sags toward the break
      const c = Math.cos(P.yaw), s = Math.sin(P.yaw), ax = new V3(s, 0, c).normalize();   // the bench's width axis (its length runs along local x): each half's inner end drops
      pieces.forEach((pc, i) => { const sg = i ? 1 : -1; this.piece(pc, new V3(P.x + c * P.hx * sg * 0.9, P.y, P.z - s * P.hx * sg * 0.9), { axis: ax.clone().multiplyScalar(sg), to: 0.42, acc: 6, drop: 0.06 }); });
      this.debris(P.x, mid.y, P.z, 8, cols, 3);
    }
    this.debris(P.x, mid.y, P.z, 5, cols, 2.5 + pw);
  }
  /** the prop's triangles lifted out of the static meshes into new meshes (2 halves split along its length) */
  extract(P, halves) {
    const out = []; const c = Math.cos(P.yaw), s = Math.sin(P.yaw);
    for (const V of P.verts) {
      const m = V.m; if (m.userData.lod) continue;                         // the near bake only (the far one just hides)
      const g = m.geometry, idx = g.index, pos = g.attributes.position, owner = V.owner;
      for (let h = 0; h < halves; h++) {
        const keep = []; const I = idx.array;
        for (let t = 0; t + 2 < I.length; t += 3) {
          const a = I[t], b = I[t + 1], d = I[t + 2]; if (owner[a] !== V.k || owner[b] !== V.k || owner[d] !== V.k) continue;
          if (halves > 1) { const cx = (pos.array[a * 3] + pos.array[b * 3] + pos.array[d * 3]) / 3 - P.x, cz = (pos.array[a * 3 + 2] + pos.array[b * 3 + 2] + pos.array[d * 3 + 2]) / 3 - P.z, lx = cx * c - cz * s; if ((lx < 0) !== (h === 0)) continue; }
          keep.push(a, b, d);
        }
        if (!keep.length) continue;
        const map = new Map(), ng = new THREE.BufferGeometry(), names = Object.keys(g.attributes), data = {}; for (const nm of names) data[nm] = [];
        const ni = keep.map((v) => { if (!map.has(v)) { map.set(v, map.size); for (const nm of names) { const A = g.attributes[nm]; for (let j = 0; j < A.itemSize; j++) data[nm].push(A.array[v * A.itemSize + j]); } } return map.get(v); });
        for (const nm of names) ng.setAttribute(nm, new THREE.Float32BufferAttribute(data[nm], g.attributes[nm].itemSize));
        ng.setIndex(ni); ng.applyMatrix4(m.matrixWorld);
        const mesh = new THREE.Mesh(ng, m.material); mesh.castShadow = true; mesh.receiveShadow = true;
        out.push(mesh);
      }
    }
    return out;
  }
  /** collapse a prop's vertices in place (remembered for restore) */
  hide(P) {
    for (const V of P.verts) {
      const pos = V.m.geometry.attributes.position, A = pos.array, keep = new Float32Array(V.idx.length * 3);
      const lx = P.x, ly = P.y - 0.6, lz = P.z; _p.set(lx, ly, lz).applyMatrix4(_inv.copy(V.m.matrixWorld).invert());
      V.idx.forEach((v, i) => { keep[i * 3] = A[v * 3]; keep[i * 3 + 1] = A[v * 3 + 1]; keep[i * 3 + 2] = A[v * 3 + 2]; A[v * 3] = _p.x; A[v * 3 + 1] = _p.y; A[v * 3 + 2] = _p.z; });
      pos.needsUpdate = true; this.saved.push({ pos, idx: V.idx, keep });
    }
  }
  /** a moving piece: pivot (world) + rotation about an axis toward an angle (topple / bend / sag), or a ballistic flight */
  piece(mesh, piv, o) {
    mesh.geometry.translate(-piv.x, -piv.y, -piv.z); mesh.position.copy(piv); this.grp.add(mesh);
    this.pieces.push({ mesh, piv: piv.clone(), axis: o.axis, ang: 0, to: o.to || 0, vel: 0, acc: o.acc || 6, drop: o.drop || 0, fly: o.fly, spin: o.spin, settled: false, bounce: 0 });
  }
  /** the prop's colours (from its vertex colours) for the debris */
  colours(P) {
    const out = []; for (const V of P.verts) { const C = V.m.geometry.attributes.color; if (!C) continue; for (let i = 0; i < V.idx.length && out.length < 24; i += Math.max(1, Math.floor(V.idx.length / 24))) { const v = V.idx[i]; out.push('#' + new THREE.Color(C.array[v * 3], C.array[v * 3 + 1], C.array[v * 3 + 2]).convertLinearToSRGB().getHexString()); } }
    return out.length ? out : ['#8a7a6a', '#6a5e52'];
  }
  // ---------------------------------------------------------------- debris: pooled voxel chunks with gravity, bounces, rest
  pool() {
    const N = this.N = 220;
    this.dm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 }), N);
    this.dm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.dm.castShadow = true; this.dm.receiveShadow = true; this.dm.frustumCulled = false; this.dm.count = 0;
    this.dm.setColorAt(0, new THREE.Color(1, 1, 1)); this.grp.add(this.dm);
    this.chunks = []; this.next = 0;
  }
  debris(x, y, z, n, cols, speed = 3) {
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const k = this.next++ % this.N, a = Math.random() * Math.PI * 2, sp = speed * (0.4 + Math.random() * 0.8), s = 0.05 + Math.random() * 0.11;
      const c = { p: new V3(x + (Math.random() - 0.5) * 0.3, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.3), v: new V3(Math.cos(a) * sp, 2 + Math.random() * speed, Math.sin(a) * sp), q: new THREE.Quaternion().setFromEuler(_e.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)), w: new V3(Math.random() * 14 - 7, Math.random() * 14 - 7, Math.random() * 14 - 7), s: new V3(s * (0.8 + Math.random() * 0.8), s * (0.6 + Math.random() * 0.6), s * (0.8 + Math.random() * 0.8)), rest: false, life: 0 };
      this.chunks[k] = c; col.set(cols[Math.floor(Math.random() * cols.length)]); this.dm.setColorAt(k, col);
      this.dm.count = Math.max(this.dm.count, k + 1);
    }
    if (this.dm.instanceColor) this.dm.instanceColor.needsUpdate = true;
  }
  // ---------------------------------------------------------------- decals
  decal(kind, x, y, z, size) {
    const T_ = decalTex()[kind];
    if (this.decals.length >= 16) { const old = this.decals.shift(); this.grp.remove(old.mesh); old.mesh.geometry.dispose(); }
    const mat = new THREE.MeshLambertMaterial({ map: T_, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2 - this.decals.length * 0.1, polygonOffsetUnits: -2, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); m.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2); m.position.set(x, y + 0.012 + this.decals.length * 0.002, z); m.receiveShadow = true; m.renderOrder = 1;
    this.grp.add(m); this.decals.push({ mesh: m, size, t: 0 }); m.scale.setScalar(size * 0.3);
  }
  /** cracked glass on the face of a nearby building (or a prop's front) */
  decalWall(P, dir) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: decalTex().glass, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(P.x - dir[0] * (P.rad + 0.04), P.y + P.hy * 0.62, P.z - dir[1] * (P.rad + 0.04)); m.rotation.y = Math.atan2(-dir[0], -dir[1]); this.grp.add(m); this.decals.push({ mesh: m, size: 1, t: 1, wall: true });
  }
  windows(x, y, z, reach) {
    const city = this.w.sc && this.w.sc.city; if (!city || !city.buildings || (this.wins || 0) >= 6) return;
    for (const B of city.buildings) {
      if (B.fade !== undefined && B.fade < 0.5) continue;
      const cx = Math.max(B.x, Math.min(B.x + B.w, x)), cz = Math.max(B.z, Math.min(B.z + B.d, z)), d = Math.hypot(cx - x, cz - z); if (d > reach || d < 0.05) continue;
      const nx = (x - cx) / d, nz = (z - cz) / d;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: decalTex().glass, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.position.set(cx + nx * 0.05, y + 1.6 + Math.random() * 0.6, cz + nz * 0.05); m.rotation.y = Math.atan2(nx, nz); this.grp.add(m); this.decals.push({ mesh: m, size: 1, t: 1, wall: true });
      this.wins = (this.wins || 0) + 1; this.vfx.burst('shard', m.position, { n: 6, tint: '#e8f6ff' }); const au = this.app.audio; if (au && au.sfx) au.sfx('destroy_glass', { vol: 0.6 });
      return;
    }
  }
  // ---------------------------------------------------------------- per frame
  update(dt) {
    this.t += dt; const w = this.w;
    for (const d of this.decals) if (!d.wall && d.t < 1) { d.t = Math.min(1, d.t + dt * 7); d.mesh.scale.setScalar(d.size * (0.3 + 0.7 * d.t)); }
    for (const P of this.pieces) {
      if (P.settled) continue;
      if (P.fly) {
        P.fly.y -= 9.8 * dt; P.mesh.position.addScaledVector(P.fly, dt); P.mesh.rotation.x += P.spin.x * dt; P.mesh.rotation.y += P.spin.y * dt; P.mesh.rotation.z += P.spin.z * dt;
        const g = w.ground(P.mesh.position.x, P.mesh.position.z);
        if (P.mesh.position.y < g + 0.1 && P.fly.y < 0) { P.mesh.position.y = g + 0.1; P.fly.y *= -0.3; P.fly.x *= 0.5; P.fly.z *= 0.5; P.spin.multiplyScalar(0.4); if (++P.bounce > 2 || Math.abs(P.fly.y) < 0.6) P.settled = true; this.vfx.dust(P.mesh.position, 1, 0.5); }
        continue;
      }
      P.vel += P.acc * dt; P.ang += P.vel * dt;
      if (P.ang >= P.to) { P.ang = P.to; if (P.vel > 1.2) { P.vel *= -0.25; this.vfx.dust(P.mesh.position.clone().addScaledVector(new V3(-P.axis.z, 0, P.axis.x), 0.4), 1, 0.7); } else { P.settled = true; } }
      P.mesh.quaternion.setFromAxisAngle(P.axis, P.ang); P.mesh.position.set(P.piv.x, P.piv.y - P.drop * Math.min(1, P.ang / Math.max(0.01, P.to)), P.piv.z);
    }
    for (const S of this.spouts) { if (S.t <= 0) continue; S.t -= dt; if ((S.k = (S.k || 0) - dt) <= 0) { S.k = 0.07; this.vfx.burst('drop', new V3(S.x, S.y + 0.1, S.z), { n: 3, speed: 1.5, spread: 0.25 }); if (Math.random() < 0.3) this.vfx.burst('splash', new V3(S.x, S.y, S.z), { scale: 0.6 }); } }
    // debris
    let moved = false; const dm = this.dm;
    for (let k = 0; k < this.chunks.length; k++) {
      const c = this.chunks[k]; if (!c || c.rest) continue;
      c.life += dt; c.v.y -= 9.8 * dt; c.p.addScaledVector(c.v, dt);
      _q.setFromEuler(_e.set(c.w.x * dt, c.w.y * dt, c.w.z * dt)); c.q.multiply(_q);
      const g = w.ground(c.p.x, c.p.z) + c.s.y * 0.5;
      if (c.p.y < g) { c.p.y = g; if (c.v.y < 0) c.v.y *= -0.32; c.v.x *= 0.55; c.v.z *= 0.55; c.w.multiplyScalar(0.5); if (Math.abs(c.v.y) < 0.5 && Math.hypot(c.v.x, c.v.z) < 0.4) { c.rest = true; _e.setFromQuaternion(c.q); c.q.setFromEuler(_e.set(0, _e.y, 0)); } }
      if (c.life > 6) c.rest = true;
      _m.compose(c.p, c.q, c.s); dm.setMatrixAt(k, _m); moved = true;
    }
    if (moved) dm.instanceMatrix.needsUpdate = true;
  }
  /** put the city back: every vertex where it was, no debris, no decals */
  restore() {
    for (const S of this.saved) { const A = S.pos.array; S.idx.forEach((v, i) => { A[v * 3] = S.keep[i * 3]; A[v * 3 + 1] = S.keep[i * 3 + 1]; A[v * 3 + 2] = S.keep[i * 3 + 2]; }); S.pos.needsUpdate = true; }
    this.saved = [];
    for (const P of this.pieces) P.mesh.geometry.dispose();
    for (const d of this.decals) { d.mesh.geometry.dispose(); d.mesh.material.dispose(); }
    this.dm.geometry.dispose(); this.dm.material.dispose();
    this.app.stage.scene.remove(this.grp);
    this.pieces = []; this.decals = []; this.chunks = []; this.spouts = [];
  }
}
