// A small sculpting kit: primitives (lathes, tubes, bevelled boxes, extruded profiles) appended into one vertex-
// coloured geometry. props_real.js sculpts its street furniture and cars with it and then voxelises them; the geometry
// can also carry a per-vertex roughness / metalness (aRM) for the shared VPBR material, which the baked prop statics
// (build.js) use.
import * as THREE from '../../../vendor/three.module.js';

const TAU = Math.PI * 2;
export const rng = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };

/** surface presets: [roughness, metalness] */
export const RM = { paint: [0.32, 0.25], glass: [0.06, 0.0], rubber: [0.92, 0], chrome: [0.18, 1], steel: [0.45, 0.85], iron: [0.55, 0.6], plastic: [0.5, 0], wood: [0.78, 0], bark: [0.95, 0], leaf: [0.7, 0], stone: [0.85, 0], concrete: [0.9, 0], enamel: [0.35, 0.1], matte: [0.8, 0], light: [0.3, 0] };

export class Geo {
  constructor() { this.P = []; this.N = []; this.C = []; this.R = []; this.UV = []; this.I = []; this.cur = { col: [1, 1, 1], rm: RM.matte }; }
  /** set the colour (hex / Color) and surface ([rough, metal] or preset name) for what follows */
  /** colour (hex / Color) and surface ([rough, metal] or a preset name) for what follows; o.flat: no painted shading */
  mat(col, rm = 'matte', o = {}) { const c = new THREE.Color(col); this.cur = { col: [c.r, c.g, c.b], rm: typeof rm === 'string' ? RM[rm] : rm, flat: !!o.flat }; return this; }
  // painted light baked into the vertex colour (like the hand-painted textures): tops lit, undersides dark,
  // a soft occlusion near the ground
  paint(p, n, c) { if (this.cur.flat || this.noPaint) return c; const k = (0.8 + 0.2 * n[1] + (n[1] < -0.5 ? -0.12 : 0)) * (0.72 + 0.28 * Math.min(1, Math.max(0, p[1]) / 0.45)); return [c[0] * k, c[1] * k, c[2] * k]; }
  v(p, n, col, uv) { const c = col || this.paint(p, n, this.cur.col); this.P.push(p[0], p[1], p[2]); this.N.push(n[0], n[1], n[2]); this.C.push(c[0], c[1], c[2]); this.R.push(this.cur.rm[0], this.cur.rm[1]); this.UV.push(uv ? uv[0] : 0, uv ? uv[1] : 0); return this.P.length / 3 - 1; }
  tri(a, b, c) { this.I.push(a, b, c); return this; }
  /** append a THREE geometry (non-indexed or indexed) transformed by matrix m, in the current colour (or col(p, n) → [r,g,b]) */
  add(geo, m, col) {
    const g = geo.index ? geo : geo, p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, base = this.P.length / 3;
    const nm = new THREE.Matrix3().getNormalMatrix(m), v = new THREE.Vector3(), w = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m); w.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      this.v([v.x, v.y, v.z], [w.x, w.y, w.z], col ? col(v, w) : null, uv ? [uv.getX(i), uv.getY(i)] : null);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) this.I.push(base + g.index.getX(i)); else for (let i = 0; i < p.count; i++) this.I.push(base + i);
    geo.dispose(); return this;
  }
  /** a box centred at c, size s, rotated by yaw (and pitch about x) */
  box(c, s, o = {}) { const m = new THREE.Matrix4().compose(new THREE.Vector3(...c), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0)), new THREE.Vector3(1, 1, 1)); return this.add(new THREE.BoxGeometry(s[0], s[1], s[2]).toNonIndexed(), m); }
  /** a rounded box (bevelled edges), radius r */
  rbox(c, s, r, o = {}) {
    const sh = new THREE.Shape(), w = s[0] / 2 - r, h = s[1] / 2 - r;
    sh.moveTo(-w, -s[1] / 2); sh.lineTo(w, -s[1] / 2); sh.quadraticCurveTo(s[0] / 2, -s[1] / 2, s[0] / 2, -h); sh.lineTo(s[0] / 2, h); sh.quadraticCurveTo(s[0] / 2, s[1] / 2, w, s[1] / 2);
    sh.lineTo(-w, s[1] / 2); sh.quadraticCurveTo(-s[0] / 2, s[1] / 2, -s[0] / 2, h); sh.lineTo(-s[0] / 2, -h); sh.quadraticCurveTo(-s[0] / 2, -s[1] / 2, -w, -s[1] / 2);
    const d = Math.max(0.001, s[2] - 2 * r), g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.6, bevelSegments: 2, curveSegments: 3 });
    g.translate(0, 0, -d / 2); g.computeVertexNormals();
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...c), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0)), new THREE.Vector3(1, 1, 1));
    return this.add(g, m);
  }
  /** a tapered cylinder from point a to point b (radii r0 → r1), n sides */
  cyl(a, b, r0, r1, n = 8, o = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
    const g = new THREE.CylinderGeometry(r1, r0, L, n, o.seg || 1, !o.caps);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return this.add(g, new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
  }
  /** a lathe: profile [[r, y], ...] around the y axis at c */
  lathe(c, prof, n = 12, o = {}) { const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(1e-4, r), y)), n); return this.add(g, new THREE.Matrix4().compose(new THREE.Vector3(...c), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0)), new THREE.Vector3(...(o.s || [1, 1, 1])))); }
  sphere(c, r, o = {}) { const g = new THREE.SphereGeometry(1, o.w || 10, o.h || 7); return this.add(g, new THREE.Matrix4().compose(new THREE.Vector3(...c), new THREE.Quaternion(), new THREE.Vector3(...(Array.isArray(r) ? r : [r, r, r])))); }
  /** a tube along points pts (radius r, n sides) */
  tube(pts, r, n = 6, o = {}) { const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2); return this.add(new THREE.TubeGeometry(curve, o.seg || pts.length * 4, r, n, false), new THREE.Matrix4()); }
  /** an extruded side profile (pts in the x-y plane) of width w, centred on z = 0 */
  extrude(pts, w, o = {}) {
    const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), bv = o.bevel ?? 0.04;
    const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, w - 2 * bv), bevelEnabled: bv > 0, bevelThickness: bv, bevelSize: bv * 0.8, bevelSegments: o.bseg ?? 2, curveSegments: o.curve ?? 4 });
    g.translate(0, 0, -(w - 2 * bv) / 2); g.computeVertexNormals();
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...(o.at || [0, 0, 0])), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, o.ry || 0, 0)), new THREE.Vector3(1, 1, 1));
    return this.add(g, m);
  }
  geometry(ox = 0, oz = 0) {
    const g = new THREE.BufferGeometry(), P = new Float32Array(this.P);
    if (ox || oz) for (let i = 0; i < P.length; i += 3) { P[i] -= ox; P[i + 2] -= oz; }
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.setAttribute('aRM', new THREE.Float32BufferAttribute(this.R, 2)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.UV, 2));
    g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1)); g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- the shared material: per-vertex roughness / metalness
const VPBR_VS_P = '\nattribute vec2 aRM;\nvarying vec2 vRM;\n';
const VPBR_FS_P = '\nvarying vec2 vRM;\n';
/** patch a Standard material so the geometry's aRM attribute sets roughness (x) and metalness (y) */
export function vpbr(m) {
  const prev = m.onBeforeCompile, own = prev !== THREE.Material.prototype.onBeforeCompile ? prev : null, key = (m.userData.vxKey || 'std') + '|vpbr';
  m.onBeforeCompile = function (sh, r) {
    if (own) own.call(this, sh, r);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + VPBR_VS_P).replace('#include <begin_vertex>', '#include <begin_vertex>\nvRM = aRM;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>' + VPBR_FS_P)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= vRM.x;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor *= vRM.y;');
  };
  m.customProgramCacheKey = () => key; m.userData.vxChain = true; m.userData.vxKey = key;
  return m;
}
export const VPBR = vpbr(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 1 }));
