// A small, self-contained rotating low-poly Earth for the main menu — its own
// WebGL context + scene (disposed when the menu closes). Pure decoration that
// sets a more serious, natural-history tone. No WebGL (e.g. jsdom) → silent
// no-op, exactly like Preview.
import * as THREE from '../vendor/three.module.js';

// rough land patches as [latitude°, longitude°, size] — enough to read as Earth
const LAND = [
  [50, -100, 0.42], [40, -90, 0.34], [10, -65, 0.30], [-15, -60, 0.40],   // Americas
  [10, 18, 0.40], [-8, 22, 0.42], [30, 8, 0.26],                           // Africa
  [50, 15, 0.30], [60, 70, 0.46], [35, 100, 0.40], [22, 78, 0.26],         // Eurasia
  [-25, 134, 0.30], [68, -45, 0.26],                                       // Australia, Greenland
];

function onSphere(lat, lon, r) {
  const a = lat * Math.PI / 180, b = lon * Math.PI / 180;
  return new THREE.Vector3(r * Math.cos(a) * Math.cos(b), r * Math.sin(a), r * Math.cos(a) * Math.sin(b));
}

export class Globe {
  constructor(canvas) {
    this.canvas = canvas; this.ok = false; this.running = false; this._raf = null; this._t = 0;
    if (!canvas) return;
    try { this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch (e) { this.renderer = null; return; }
    this.ok = true;
    this.renderer.setPixelRatio(Math.min((typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1), 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(0, 0.5, 4.6);
    this.scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x101820, 0.6));
    const sun = new THREE.DirectionalLight(0xfff3da, 1.6); sun.position.set(3, 2, 4); this.scene.add(sun);

    const R = 1.3;
    this.earth = new THREE.Group(); this.earth.rotation.z = 0.41; this.scene.add(this.earth);   // axial tilt
    const ocean = new THREE.Mesh(new THREE.IcosahedronGeometry(R, 3), new THREE.MeshStandardMaterial({ color: 0x1f6fb0, roughness: 0.85, flatShading: true, emissive: 0x0a2236, emissiveIntensity: 0.5 }));
    this.earth.add(ocean);
    const landMat = new THREE.MeshStandardMaterial({ color: 0x5aa64a, roughness: 1, flatShading: true });
    const iceMat = new THREE.MeshStandardMaterial({ color: 0xeaf4ff, roughness: 1, flatShading: true });
    for (const [lat, lon, s] of LAND) {
      const p = onSphere(lat, lon, R);
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), Math.abs(lat) > 60 ? iceMat : landMat);
      blob.position.copy(p); blob.lookAt(0, 0, 0); blob.scale.set(1, 1, 0.4);
      this.earth.add(blob);
    }
    // polar ice caps
    for (const lat of [90, -90]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), iceMat); c.position.copy(onSphere(lat, 0, R)); c.lookAt(0, 0, 0); c.scale.set(1, 1, 0.35); this.earth.add(c); }
    // soft atmosphere shell
    this.scene.add(new THREE.Mesh(new THREE.IcosahedronGeometry(R * 1.16, 3), new THREE.MeshBasicMaterial({ color: 0x69b6ff, transparent: true, opacity: 0.12, side: THREE.BackSide })));
  }

  resize() {
    if (!this.ok) return;
    const w = this.canvas.clientWidth || 240, h = this.canvas.clientHeight || 240;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  start() {
    if (!this.ok || this.running) return;
    this.running = true; this.resize();
    const loop = () => {
      if (!this.running) return;
      this._raf = requestAnimationFrame(loop);
      this._t += 0.016;
      if (this.earth) this.earth.rotation.y = this._t * 0.32;
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  stop() { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }

  dispose() {
    this.stop();
    if (this.scene) this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    if (this.renderer) this.renderer.dispose();
  }
}
