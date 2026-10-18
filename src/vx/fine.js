// Fine voxels: the world is built from small voxels (8 per metre by default, 12.5 cm)
// coloured from a palette, the way voxel-art dioramas are — no textures, the detail
// is real geometry (inset windows, cornices, railings, leaves, cobbles).
// Meshing is per 32³ chunk: only faces that touch air are emitted, merged greedily
// into larger quads when colour and corner shading match, and every vertex gets
// ambient occlusion from its neighbours, so creases and corners darken softly.
// Palette flags: GLOW (unlit, blooms), WATER (translucent surface), GLASS (shiny, lit at night).
import * as THREE from '../../vendor/three.module.js';

export const GLOW = 1, WATER = 2, GLASS = 4;
const CS = 32;
const AOK = [0.5, 0.68, 0.84, 1];
const lin = (v) => Math.pow(v / 255, 2.2);

export class Fine {
  constructor(X, Y, Z, vpm = 8) {
    this.X = X; this.Y = Y; this.Z = Z; this.vpm = vpm; this.s = 1 / vpm;
    this.d = new Uint8Array(X * Y * Z);
    this.pal = [[0, 0, 0]]; this.flag = [0]; this.idx = new Map();
  }
  // palette index for a '#rrggbb' colour (+ flags), created on first use
  c(hex, flags = 0) {
    const k = hex + '|' + flags; let i = this.idx.get(k);
    if (i === undefined) {
      if (this.pal.length >= 256) { i = this.nearest(hex); this.idx.set(k, i); return i; }
      const v = parseInt(hex.slice(1), 16); i = this.pal.length; this.pal.push([(v >> 16) & 255, (v >> 8) & 255, v & 255]); this.flag.push(flags); this.idx.set(k, i);
    }
    return i;
  }
  nearest(hex) { const v = parseInt(hex.slice(1), 16), r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255; let best = 1, bd = 1e9; for (let i = 1; i < this.pal.length; i++) { const p = this.pal[i], d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < bd) { bd = d; best = i; } } return best; }
  inb(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.X && y < this.Y && z < this.Z; }
  get(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.X && y < this.Y && z < this.Z ? this.d[(y * this.Z + z) * this.X + x] : 0; }
  set(x, y, z, c) { if (x >= 0 && y >= 0 && z >= 0 && x < this.X && y < this.Y && z < this.Z) this.d[(y * this.Z + z) * this.X + x] = c; }
  // inclusive box; c is a palette index or fn(x, y, z) → index (0 = carve air)
  box(x0, y0, z0, x1, y1, z1, c) {
    const ax = Math.max(0, Math.min(x0, x1)), bx = Math.min(this.X - 1, Math.max(x0, x1)), ay = Math.max(0, Math.min(y0, y1)), by = Math.min(this.Y - 1, Math.max(y0, y1)), az = Math.max(0, Math.min(z0, z1)), bz = Math.min(this.Z - 1, Math.max(z0, z1));
    const f = typeof c === 'function';
    for (let y = ay; y <= by; y++) for (let z = az; z <= bz; z++) { let i = (y * this.Z + z) * this.X + ax; for (let x = ax; x <= bx; x++, i++) { const v = f ? c(x, y, z) : c; if (v !== undefined && v !== null) this.d[i] = v; } }
    return this;
  }
  // highest solid voxel in a column (−1 if none)
  top(x, z) { for (let y = this.Y - 1; y >= 0; y--) { const v = this.get(x, y, z); if (v && !(this.flag[v] & WATER)) return y; } return -1; }
  // metres ↔ voxels
  m(v) { return Math.round(v * this.vpm); }

  // → { opaque: BufferGeometry[], glow: BufferGeometry[], water: BufferGeometry[] }
  mesh() {
    const X = this.X, Y = this.Y, Z = this.Z, d = this.d, F = this.flag, P = this.pal, s = this.s;
    const solid = (x, y, z) => { if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return 0; const v = d[(y * Z + z) * X + x]; return v && !(F[v] & WATER) ? 1 : 0; };
    const linPal = P.map((c) => c.map(lin));
    const out = { opaque: [], glow: [], water: [] };
    const mask = new Int32Array(CS * CS);
    for (let cy = 0; cy < Y; cy += CS) for (let cz = 0; cz < Z; cz += CS) for (let cx = 0; cx < X; cx += CS) {
      // skip empty chunks fast
      let any = false;
      for (let y = cy; y < Math.min(Y, cy + CS) && !any; y++) for (let z = cz; z < Math.min(Z, cz + CS) && !any; z++) { const i0 = (y * Z + z) * X + cx; for (let x = 0; x < Math.min(CS, X - cx); x++) if (d[i0 + x]) { any = true; break; } }
      if (!any) continue;
      const G = { o: newG(), g: newG(), w: newG() };
      // 6 directions: axis a ∈ {0:x, 1:y, 2:z}, sign ±1
      for (let a = 0; a < 3; a++) for (const sg of [1, -1]) {
        const u = (a + 1) % 3, v = (a + 2) % 3;
        const lo = [cx, cy, cz], dim = [X, Y, Z];
        const nA = Math.min(CS, dim[a] - lo[a]), nU = Math.min(CS, dim[u] - lo[u]), nV = Math.min(CS, dim[v] - lo[v]);
        const p = [0, 0, 0];
        for (let i = 0; i < nA; i++) {
          let has = false;
          for (let jv = 0; jv < nV; jv++) for (let ju = 0; ju < nU; ju++) {
            p[a] = lo[a] + i; p[u] = lo[u] + ju; p[v] = lo[v] + jv;
            const id = d[(p[1] * Z + p[2]) * X + p[0]]; let key = 0;
            if (id) {
              const q0 = p[0] + (a === 0 ? sg : 0), q1 = p[1] + (a === 1 ? sg : 0), q2 = p[2] + (a === 2 ? sg : 0);
              const nb = (q0 < 0 || q1 < 0 || q2 < 0 || q0 >= X || q1 >= Y || q2 >= Z) ? 0 : d[(q1 * Z + q2) * X + q0];
              const isW = F[id] & WATER;
              const visible = isW ? (!nb) : (!nb || (F[nb] & WATER));
              if (visible && !(a === 1 && sg === -1 && p[1] === 0)) {
                // corner ambient occlusion (4 corners in u/v order: (−,−) (+,−) (+,+) (−,+))
                let ao = 0;
                if (!isW) {
                  const q = [q0, q1, q2];
                  const occ = (du, dv) => { const r = [q[0], q[1], q[2]]; r[u] += du; r[v] += dv; return solid(r[0], r[1], r[2]); };
                  const corner = (su, sv) => { const s1 = occ(su, 0), s2 = occ(0, sv), c = occ(su, sv); return s1 && s2 ? 0 : 3 - (s1 + s2 + c); };
                  ao = corner(-1, -1) | (corner(1, -1) << 2) | (corner(1, 1) << 4) | (corner(-1, 1) << 6);
                } else ao = 0xff;
                key = (id << 8) | ao | (1 << 30);
                has = true;
              }
            }
            mask[jv * CS + ju] = key;
          }
          if (!has) continue;
          // greedy merge rectangles of equal key
          for (let jv = 0; jv < nV; jv++) for (let ju = 0; ju < nU;) {
            const key = mask[jv * CS + ju]; if (!key) { ju++; continue; }
            let w = 1; while (ju + w < nU && mask[jv * CS + ju + w] === key) w++;
            let h = 1; outer: while (jv + h < nV) { for (let k = 0; k < w; k++) if (mask[(jv + h) * CS + ju + k] !== key) break outer; h++; }
            for (let hh = 0; hh < h; hh++) for (let k = 0; k < w; k++) mask[(jv + hh) * CS + ju + k] = 0;
            const id = (key >> 8) & 255, ao = key & 255, fl = F[id];
            const T = fl & WATER ? G.w : fl & GLOW ? G.g : G.o;
            emit(T, a, u, v, sg, lo[a] + i, lo[u] + ju, lo[v] + jv, w, h, linPal[id], ao, s, !!(fl & WATER));
            ju += w;
          }
        }
      }
      if (G.o.p.length) out.opaque.push(toGeo(G.o)); if (G.g.p.length) out.glow.push(toGeo(G.g)); if (G.w.p.length) out.water.push(toGeo(G.w));
    }
    return out;
  }
}
function newG() { return { p: [], n: [], c: [], i: [] }; }
// one quad: slice i along axis a, spanning [u0, u0+w] × [v0, v0+h]
function emit(G, a, u, v, sg, i, u0, v0, w, h, col, ao, s, water) {
  const base = G.p.length / 3, pa = (sg > 0 ? i + 1 : i) - (water && a === 1 && sg > 0 ? 0.18 : 0);
  const corners = [[u0, v0], [u0 + w, v0], [u0 + w, v0 + h], [u0, v0 + h]];
  const n = [0, 0, 0]; n[a] = sg;
  const aov = [ao & 3, (ao >> 2) & 3, (ao >> 4) & 3, (ao >> 6) & 3];
  for (let k = 0; k < 4; k++) {
    const q = [0, 0, 0]; q[a] = pa; q[u] = corners[k][0]; q[v] = corners[k][1];
    G.p.push(q[0] * s, q[1] * s, q[2] * s); G.n.push(n[0], n[1], n[2]);
    const l = AOK[aov[k]]; G.c.push(col[0] * l, col[1] * l, col[2] * l);
  }
  // winding: counter-clockwise seen from the outside
  const flip = aov[0] + aov[2] < aov[1] + aov[3];
  const t = sg > 0 ? (flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3]) : (flip ? [1, 3, 2, 1, 0, 3] : [0, 2, 1, 0, 3, 2]);
  for (const k of t) G.i.push(base + k);
}
function toGeo(G) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(G.c, 3));
  g.setIndex(G.p.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(G.i, 1) : new THREE.Uint16BufferAttribute(G.i, 1));
  g.computeBoundingSphere();
  return g;
}
