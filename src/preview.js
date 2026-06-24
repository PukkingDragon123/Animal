// Tiny standalone 3D turntable for the character-select screen. Its own WebGL
// context + scene; shows the actual procedural creature, lit and slowly
// spinning with its idle animation. Disposed when the select screen closes.
import * as THREE from '../vendor/three.module.js';
import { buildCreature } from './meshes.js';
import { animateCreature } from './animator.js';
import { speciesOf } from './species.js';

export class Preview {
  constructor(canvas) {
    this.canvas = canvas; this.ok = false; this.mesh = null; this.running = false; this._raf = null; this._t = 0;
    try { this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch (e) { this.renderer = null; return; }       // no WebGL → silent no-op
    this.ok = true;
    this.renderer.setPixelRatio(Math.min((typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1), 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(0, 1.7, 4.4);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x6f86a6, 1.15));
    const key = new THREE.DirectionalLight(0xfff2d6, 1.25); key.position.set(2.5, 5, 3); this.scene.add(key);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.25, 24), new THREE.MeshStandardMaterial({ color: 0x8fd06a, roughness: 1, flatShading: true }));
    disc.position.y = -0.12; this.scene.add(disc);
    this.mesh = null; this.running = false; this._raf = null; this._t = 0;
  }

  resize() {
    if (!this.ok) return;
    const w = this.canvas.clientWidth || 240, h = this.canvas.clientHeight || 240;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  show(speciesId) {
    if (!this.ok) return;
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); }); this.mesh = null; }
    const sp = speciesOf(speciesId);
    const m = buildCreature(sp.build, sp.colors);
    const fit = 1.5 / Math.max(0.6, sp.baseScale);
    m.scale.setScalar(fit); m.userData.baseY = 0.05;
    this.scene.add(m); this.mesh = m;
    this.camera.lookAt(0, 0.8, 0);
    this.start();
  }

  start() {
    if (!this.ok || this.running) return;
    this.running = true; this.resize();
    const loop = () => {
      if (!this.running) return;
      this._raf = requestAnimationFrame(loop);
      this._t += 0.016;
      if (this.mesh) {
        animateCreature(this.mesh, 0.016, this._t, { dt: 0.016, time: this._t, speed: 0, moving: false });
        this.mesh.rotation.y = this._t * 0.7;     // turntable (after animator, which never sets .y for idle)
      }
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  stop() { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }

  dispose() {
    this.stop();
    if (this.mesh && this.scene) { this.scene.remove(this.mesh); this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); }); this.mesh = null; }
    if (this.renderer) this.renderer.dispose();
  }
}
