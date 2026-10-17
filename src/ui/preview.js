// Self-contained 3D preview widget for menus (own canvas + renderer), so it
// can sit on top of opaque UI panels. Turntable + idle animation.
import * as THREE from '../../vendor/three.module.js';
import { getTemplate, instantiate } from '../gfx/model.js';
import { Animator } from '../gfx/anim.js';
import { shared } from '../gfx/materials.js';

let live = new Set();
let raf = 0;
function loop(t) {
  raf = 0;
  for (const p of live) p.frame(t);
  if (live.size) raf = requestAnimationFrame(loop);
}

export class Preview {
  constructor(parent, opts = {}) {
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });
    parent.append(this.canvas);
    this.parent = parent;
    this.r = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    this.r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    this.r.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(26, 1, 0.05, 80);
    const key = new THREE.DirectionalLight(0xfff2e0, 2.7); key.position.set(1.5, 3, 2.5);
    const rim = new THREE.DirectionalLight(0xa0c8ff, 1.6); rim.position.set(-2.5, 1.5, -2);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xe0e8ff, 0x5a4a60, 0.95));
    if (opts.floor !== false) {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }));
      this.disc = disc; this.scene.add(disc);
    }
    this.spin = opts.spin ?? 0.5;
    this.yaw = opts.yaw ?? 0.4;
    this.frameMode = opts.frame || 'full';   // 'full' | 'portrait'
    this.obj = null; this.anim = null;
    this.drag = null;
    this.canvas.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.drag = { x: e.clientX, yaw: this.yaw }; this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', (e) => { if (this.drag) this.yaw = this.drag.yaw + (e.clientX - this.drag.x) * 0.012; });
    this.canvas.addEventListener('pointerup', () => { this.drag = null; });
    this.last = performance.now();
    live.add(this);
    if (!raf) raf = requestAnimationFrame(loop);
  }
  show(design, key, opts = {}) {
    if (this.obj) { this.scene.remove(this.obj); for (const m of this.obj.userData.rig.materials) m.dispose(); }
    if (!design) { this.obj = null; return; }
    const tpl = getTemplate(design, key || design.id);
    this.obj = instantiate(tpl, { rim: 0.15, shadow: false });
    this.anim = new Animator(this.obj);
    if (opts.play) this.anim.play(opts.play);
    this.scene.add(this.obj);
    const b = tpl.bounds;
    this.h = Math.max(0.3, b.max.y);
    this.w = Math.max(b.max.x - b.min.x, b.max.z - b.min.z, 0.3);
    if (this.disc) this.disc.scale.setScalar(this.w * 0.7);
    this.portrait = design.portrait || null;
    return this.obj;
  }
  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    if (!this.canvas.isConnected) { this.dispose(); return; }
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (w < 2 || h < 2) return;
    if (this.canvas.width !== Math.round(w * this.r.getPixelRatio())) this.r.setSize(w, h, false);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    if (this.obj) {
      if (!this.drag) this.yaw += dt * this.spin;
      this.obj.rotation.y = this.yaw;
      this.anim.update(dt);
      let lookY, dist;
      if (this.frameMode === 'portrait') { lookY = this.portrait?.y ?? this.h * 0.8; dist = this.portrait?.dist ?? this.h * 0.9 + 0.4; }
      else { lookY = this.h * 0.5; const fit = Math.max(this.h, this.w / this.cam.aspect) * 0.5 / Math.tan((this.cam.fov * Math.PI) / 360); dist = fit * 1.25 + 0.2; }
      this.cam.position.set(0, lookY + dist * 0.12, dist);
      this.cam.lookAt(0, lookY, 0);
    }
    shared.uTime.value = t / 1000;
    this.r.render(this.scene, this.cam);
  }
  dispose() {
    live.delete(this);
    if (this.obj) for (const m of this.obj.userData.rig.materials) m.dispose();
    this.r.dispose();
    try { this.r.forceContextLoss(); } catch (e) { /* ignore */ }
    this.canvas.remove();
  }
}
export function disposeAllPreviews() { for (const p of [...live]) p.dispose(); }
