// Atmosphere: what drifts in the air around the camera — leaves and blossom petals tumbling on the wind, and steam
// rising from food stalls and street vents. Each is one point cloud (one draw call) drawn as square pixel flakes,
// never soft discs: a leaf is a two-tone square (lit corner, shaded corner), a puff of steam a dithered square.
// Leaves and petals live in a box that follows the camera and wrap around it; the steam puffs loop over their
// sources (only the ones near the camera are drawn).
import * as THREE from '../../../vendor/three.module.js';

const VS = `attribute float aSize; attribute vec3 aCol; attribute float aA; uniform float uScale; varying vec3 vCol; varying float vA;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aSize * uScale / -mv.z, 1.0, 14.0); vCol = aCol; vA = aA; }`;
const FS_LEAF = `uniform float uLight; varying vec3 vCol; varying float vA;
void main() { vec2 q = floor(gl_PointCoord * 3.0); if (q.x + q.y > 3.0 || vA <= 0.0) discard; vec3 c = vCol * (q.x + q.y < 1.0 ? 1.25 : q.x + q.y > 2.0 ? 0.7 : 1.0); gl_FragColor = vec4(c * uLight, 1.0); }`;
const FS_STEAM = `uniform float uLight; varying vec3 vCol; varying float vA;
void main() { vec2 q = floor(gl_PointCoord * 4.0); float d = mod(q.x + q.y * 2.0, 3.0); if (vA <= 0.0 || (vA < 0.5 && d < 1.0)) discard; gl_FragColor = vec4(vCol * uLight, vA * 0.5); }`;

const LEAF = ['#c8823a', '#e8b040', '#a8582a', '#7a9a3a', '#d89a3a', '#5a8a3a'], PETAL = ['#f4c0d4', '#fcd8e4', '#ffffff', '#e8a0bc'];
const lin = (h) => new THREE.Color(h);

export class Atmos {
  constructor(src = {}, o = {}) {
    const N = o.leaves ?? (globalThis.TOKON_LITE ? 90 : 220);
    this.group = new THREE.Group(); this.group.name = 'atmos';
    this.box = [44, 12, 44]; this.t = 0;
    // leaves + petals
    const P = new Float32Array(N * 3), C = new Float32Array(N * 3), S = new Float32Array(N), A = new Float32Array(N).fill(1);
    this.v = new Float32Array(N * 4);   // drift vx, vz, fall speed, flutter phase
    for (let i = 0; i < N; i++) {
      P[i * 3] = Math.random() * this.box[0]; P[i * 3 + 1] = Math.random() * this.box[1]; P[i * 3 + 2] = Math.random() * this.box[2];
      const petal = i % 3 === 0, c = lin((petal ? PETAL : LEAF)[i % (petal ? PETAL.length : LEAF.length)]);
      C.set([c.r, c.g, c.b], i * 3); S[i] = petal ? 0.09 : 0.13;
      this.v.set([0.6 + Math.random() * 0.8, 0.2 + Math.random() * 0.5, 0.35 + Math.random() * 0.4, Math.random() * 6.28], i * 4);
    }
    this.light = { value: 1 };
    const mk = (fs, transparent) => new THREE.ShaderMaterial({ uniforms: { uScale: { value: 500 }, uLight: this.light }, vertexShader: VS, fragmentShader: fs, transparent, depthWrite: !transparent, toneMapped: false });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(C, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(S, 1)); g.setAttribute('aA', new THREE.BufferAttribute(A, 1));
    this.leaves = new THREE.Points(g, mk(FS_LEAF, false)); this.leaves.frustumCulled = false; this.group.add(this.leaves);
    this.base = new THREE.Vector3();
    // steam: 12 puffs per source, looping
    this.src = (src.steam || []).slice(0, 80); const M = this.src.length * 12;
    const sp = new Float32Array(Math.max(1, M) * 3), sc = new Float32Array(Math.max(1, M) * 3), ss = new Float32Array(Math.max(1, M)), sa = new Float32Array(Math.max(1, M));
    for (let i = 0; i < M; i++) { sc.set([0.92, 0.94, 0.96], i * 3); ss[i] = 0.5; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aCol', new THREE.BufferAttribute(sc, 3)); sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1)); sg.setAttribute('aA', new THREE.BufferAttribute(sa, 1));
    sg.setDrawRange(0, M);
    this.steam = new THREE.Points(sg, mk(FS_STEAM, true)); this.steam.frustumCulled = false; this.steam.renderOrder = 4; this.group.add(this.steam);
  }
  /** dt seconds; cam: the stage camera; H: canvas height; light: 0..1 (the mood's daylight) */
  update(dt, cam, H, light = 1) {
    this.t += dt; this.light.value = light;
    const sc = H / (2 * Math.tan((cam.fov * Math.PI) / 360)); this.leaves.material.uniforms.uScale.value = sc; this.steam.material.uniforms.uScale.value = sc;
    // the leaf box sits around the point the camera looks at (a little ahead of it), and wraps
    const [bx, by, bz] = this.box, cx = cam.position.x - bx / 2, cz = cam.position.z - bz / 2, P = this.leaves.geometry.attributes.position, p = P.array, v = this.v;
    for (let i = 0; i < P.count; i++) {
      const ph = v[i * 4 + 3] + this.t * 2.2;
      let x = p[i * 3] + (v[i * 4] + Math.sin(ph) * 0.5) * dt, y = p[i * 3 + 1] - v[i * 4 + 2] * dt * (0.6 + 0.4 * Math.sin(ph * 1.7)), z = p[i * 3 + 2] + (v[i * 4 + 1] + Math.cos(ph * 0.8) * 0.4) * dt;
      if (y < 0.05) y += by;
      x = cx + ((((x - cx) % bx) + bx) % bx); z = cz + ((((z - cz) % bz) + bz) % bz);
      p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
    }
    P.needsUpdate = true;
    // steam: each puff rises 2.5 m over its life, widening and fading; sources far from the camera are skipped
    const SP = this.steam.geometry.attributes.position, sa = this.steam.geometry.attributes.aA, ss = this.steam.geometry.attributes.aSize;
    for (let s = 0; s < this.src.length; s++) {
      const [x, y, z] = this.src[s], near = Math.hypot(x - cam.position.x, z - cam.position.z) < 45;
      for (let k = 0; k < 12; k++) {
        const i = s * 12 + k, life = ((this.t * 0.35 + k / 12 + s * 0.137) % 1);
        SP.array[i * 3] = x + Math.sin(this.t * 0.7 + k) * 0.2 + life * 0.6; SP.array[i * 3 + 1] = y + life * 2.5; SP.array[i * 3 + 2] = z + Math.cos(this.t * 0.5 + k * 1.3) * 0.2;
        sa.array[i] = near ? (1 - life) * Math.min(1, life * 6) : 0; ss.array[i] = 0.35 + life * 0.9;
      }
    }
    SP.needsUpdate = true; sa.needsUpdate = true; ss.needsUpdate = true;
  }
}
