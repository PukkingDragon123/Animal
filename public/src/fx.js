// Pooled particle FX — one InstancedMesh, zero per-frame allocation, scale 0
// when idle. Eat puffs, growth/birth sparkles, splashes, death poofs.
import * as THREE from '../vendor/three.module.js';

export class FX {
  constructor(scene, max = 90) {
    this.max = max;
    const geo = new THREE.IcosahedronGeometry(0.12, 0);
    // particles tint via per-instance instanceColor (no geometry color attr)
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.6, emissive: 0x222222 });
    this.mesh = new THREE.InstancedMesh(geo, this.mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    const colors = new Float32Array(max * 3);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    scene.add(this.mesh);
    // particle state
    this.px = new Float32Array(max); this.py = new Float32Array(max); this.pz = new Float32Array(max);
    this.vx = new Float32Array(max); this.vy = new Float32Array(max); this.vz = new Float32Array(max);
    this.life = new Float32Array(max); this.maxlife = new Float32Array(max);
    this.size = new Float32Array(max); this.grav = new Float32Array(max); this.spin = new Float32Array(max);
    this.next = 0;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(); this._e = new THREE.Euler();
    this._c = new THREE.Color();
    for (let i = 0; i < max; i++) { this.life[i] = 0; this._hide(i); }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  _hide(i) { this._m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this._m); }

  _emit(x, y, z, vx, vy, vz, life, size, color, grav) {
    const i = this.next; this.next = (this.next + 1) % this.max;
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.life[i] = life; this.maxlife[i] = life; this.size[i] = size; this.grav[i] = grav; this.spin[i] = Math.random() * 6;
    this._c.set(color);
    this.mesh.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);
  }

  burst(x, y, z, color, n = 8, opts = {}) {
    const sp = opts.speed ?? 2.2, up = opts.up ?? 1.6, size = opts.size ?? 1, life = opts.life ?? 0.6, grav = opts.grav ?? 6;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.283, r = Math.random();
      this._emit(x, y, z, Math.cos(a) * sp * r, up * (0.5 + Math.random()), Math.sin(a) * sp * r, life * (0.7 + Math.random() * 0.6), size * (0.6 + Math.random() * 0.7), color, grav);
    }
    this.mesh.instanceColor.needsUpdate = true;
  }

  sparkleRing(x, y, z, color, n = 12) {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.283;
      this._emit(x, y + 0.2, z, Math.cos(a) * 2.4, 1.2 + Math.random(), Math.sin(a) * 2.4, 0.9, 1.1, color, -1.5);
    }
    this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt) {
    const m = this._m, q = this._q, p = this._p, s = this._s, e = this._e;
    let any = false;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      any = true;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this._hide(i); continue; }
      this.vy[i] -= this.grav[i] * dt;
      this.px[i] += this.vx[i] * dt; this.py[i] += this.vy[i] * dt; this.pz[i] += this.vz[i] * dt;
      if (this.py[i] < 0.05) { this.py[i] = 0.05; this.vy[i] *= -0.3; this.vx[i] *= 0.6; this.vz[i] *= 0.6; }
      const t = this.life[i] / this.maxlife[i];
      const sc = this.size[i] * (0.3 + t * 0.7);
      e.set(this.spin[i] * (1 - t) * 3, this.spin[i] * 2, 0);
      q.setFromEuler(e);
      p.set(this.px[i], this.py[i], this.pz[i]); s.set(sc, sc, sc);
      m.compose(p, q, s); this.mesh.setMatrixAt(i, m);
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset() { for (let i = 0; i < this.max; i++) { this.life[i] = 0; this._hide(i); } this.mesh.instanceMatrix.needsUpdate = true; }
}
