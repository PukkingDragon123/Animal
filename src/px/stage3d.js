// HD-2D diorama stage: a hand-painted Scene2D rebuilt as a real 3D set.
//   · the painted ground becomes terrain: flat floors at their elevation and
//     vertical walls between them (terraces declared by the map),
//   · every painted prop / building / creature stands up as a 2D billboard,
//   · a real sun casts soft shadows from each billboard's silhouette across the
//     terrain (and onto walls), point lights make lamp pools and neon spill at night,
//   · power lines are real 3D catenaries between pole tops,
//   · a perspective camera with a narrow lens gives the diorama depth; the HD-2D
//     post pass (bloom, tilt-shift DOF, grading) is applied on top by hd2d.js.
// The mapping is chosen so that, seen from the default camera, every pixel lands
// exactly where the painter put it: a ground point at painted (x, y) on a level
// raised h painted pixels sits at Z = (y + h) / sin(pitch), Y = h / cos(pitch).
import * as THREE from '../../vendor/three.module.js';

const toCanvas = (s) => (s && s.canvas ? s.canvas() : s);

export class Stage3D {
  constructor(o = {}) {
    this.pitch = (o.pitch ?? 38) * Math.PI / 180;
    this.fov = o.fov ?? 14;
    this.cv = document.createElement('canvas');
    this.r = new THREE.WebGLRenderer({ canvas: this.cv, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.r.setPixelRatio(1);
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.texCache = new WeakMap();
    this.billboards = new Map();          // actor → mesh
    this.scene = null;
  }
  setView(w, h) { this.vw = w; this.vh = h; this.r.setSize(w, h, false); if (this.cam) this.makeCamera(); }

  // ------------------------------------------------------------------ mapping
  sinP() { return Math.sin(this.pitch); } cosP() { return Math.cos(this.pitch); }
  band(y) { for (const b of this.terrain) if (y >= b.y0 && y < b.y1) return b; return this.terrain[this.terrain.length - 1]; }
  // ground point under a painted (x, y): returns [X, Y, Z]
  ground(x, y) {
    const b = this.band(y), s = this.sinP(), c = this.cosP();
    if (b.h0 === b.h1) return [x, b.h0 / c, (y + b.h0) / s];
    // inside a wall band: stand just in front of the wall face, raised so it projects where painted
    const Zw = (b.y1 + b.h1) / s + 0.6, Y = (Zw * s - y) / c;
    return [x, Math.max(b.h1 / c, Y), Zw];
  }
  tex(cv, rep = false) {
    let t = this.texCache.get(cv);
    if (!t) { t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; this.texCache.set(cv, t); }
    return t;
  }

  // ------------------------------------------------------------------ build from a Scene2D
  // opts: { terrain: [{ y0, y1, h0, h1 }], night, wires: [{ a: [x, y, h], b: [x, y, h], sag }], lights: [{ x, y, h, color, power, dist }] }
  build(sc, opts = {}) {
    this.sc = sc;
    this.terrain = (opts.terrain && opts.terrain.length ? opts.terrain : [{ y0: -1e4, y1: 1e5, h0: 0, h1: 0 }]).slice().sort((a, b) => a.y0 - b.y0);
    const S = this.scene = new THREE.Scene();
    const s = this.sinP(), c = this.cosP();
    // ---- lights
    const night = !!opts.night;
    this.night = night;
    const hemi = new THREE.HemisphereLight(night ? 0x7a84d0 : 0xc8c0f0, night ? 0x2a2040 : 0x8a6a9a, night ? 1.15 : 1.5);
    S.add(hemi);
    const sun = this.sun = new THREE.DirectionalLight(night ? 0x8ea0ff : 0xffc88a, night ? 0.35 : 1.85);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    const W = sc.w, Zmax = (sc.h + 200) / s;
    sun.shadow.camera.left = -W * 0.75; sun.shadow.camera.right = W * 0.75; sun.shadow.camera.top = Zmax * 0.75; sun.shadow.camera.bottom = -Zmax * 0.75;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 4000; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6; sun.shadow.radius = 3;
    const ctr = new THREE.Vector3(W / 2, 0, Zmax / 2);
    sun.position.set(ctr.x - 1000, 820, ctr.z + 380); sun.target.position.copy(ctr);   // low golden-hour sun from the left: long shadows
    S.add(sun, sun.target);
    // ---- terrain: floors + walls, all mapped from the painted ground
    const gcv = toCanvas(sc.ground), gtex = this.tex(gcv);
    const mat = new THREE.MeshLambertMaterial({ map: gtex });
    const H = sc.h;
    for (const b of this.terrain) {
      const y0 = Math.max(0, b.y0), y1 = Math.min(H, b.y1); if (y1 <= y0) continue;
      let geo;
      if (b.h0 === b.h1) {   // floor
        geo = new THREE.PlaneGeometry(W, (y1 - y0) / s);
        geo.rotateX(-Math.PI / 2);
        geo.translate(W / 2, b.h0 / c, (y0 + y1) / 2 / s + b.h0 / s);
      } else {               // vertical wall
        const Zw = (b.y1 + b.h1) / s;
        geo = new THREE.PlaneGeometry(W, (b.h0 - b.h1) / c);
        geo.translate(W / 2, (b.h0 + b.h1) / 2 / c, Zw);
      }
      // UVs: this band of the painted ground (v flipped: canvas row 0 = top)
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) { const v = uv.getY(i); uv.setY(i, 1 - (y0 + (1 - v) * (y1 - y0)) / H); }
      const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; S.add(m);
    }
    // ---- billboards for every painted sprite, each seated on a soft contact shadow
    for (const spr of sc.sprites) { S.add(this.billboard(spr, spr.x, spr.y, spr)); if (spr.shadow !== false && !(spr.ay > spr.cv.height + 2)) S.add(this.contact(spr.x, spr.y, Math.min(60, spr.cv.width * 0.42))); }
    // ---- wires (catenaries) and point lights
    const wmat = new THREE.LineBasicMaterial({ color: 0x2a2030 });
    for (const w of opts.wires || sc.wires3d || []) {
      const A = this.ground(w.a[0], w.a[1]), B = this.ground(w.b[0], w.b[1]);
      A[1] += w.a[2] / c; B[1] += w.b[2] / c;
      const pts = []; for (let k = 0; k <= 32; k++) { const t = k / 32; pts.push(new THREE.Vector3(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - Math.sin(t * Math.PI) * (w.sag || 12) / c, A[2] + (B[2] - A[2]) * t)); }
      S.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wmat));
    }
    this.points = [];
    const lights = (opts.lights || sc.lights3d || []).concat(night ? (sc.glows || []).filter((g) => g.light !== false).map((g) => ({ x: g.x, y: g.base ?? g.y + 30, h: g.h ?? 30, color: g.color, power: Math.min(1.2, (g.a || 0.4) * 1.6), dist: Math.max(90, g.r * 6) })) : []);
    for (const L of lights.slice(0, 24)) {
      const p = new THREE.PointLight(new THREE.Color(L.color), (L.power || 1) * 520, L.dist || 120, 1.4);
      const G = this.ground(L.x, L.y); p.position.set(G[0], G[1] + (L.h || 20) / c, G[2] + 6);
      S.add(p); this.points.push(p);
    }
    S.fog = new THREE.Fog(night ? 0x141026 : 0xf0dcc0, 900, 2600);
    S.background = new THREE.Color(night ? 0x0c0814 : 0x2a2030);
    this.makeCamera();
    return this;
  }
  // a painted sprite as an upright card; its normals lean toward the sky so lighting matches the ground
  billboard(spr, x, y, o = {}) {
    const cv = spr.cv || toCanvas(spr.surf), w = cv.width, h = cv.height, c = this.cosP();
    const geo = new THREE.PlaneGeometry(1, 1);
    const n = geo.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0.5, 0.87);   // (tilted with the card → points mostly up)
    const mat = new THREE.MeshLambertMaterial({ map: this.tex(cv), alphaTest: 0.5, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = o.shadow !== false; m.receiveShadow = true;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: mat.map, alphaTest: 0.5 });
    this.place(m, cv, x, y, spr.ax, spr.ay);
    return m;
  }
  // cards lean back to face the camera (so verticals stay vertical and texels map 1:1),
  // pivoting on their painted ground row
  place(m, cv, x, y, ax, ay) {
    const w = cv.width, h = cv.height, s = this.sinP(), c = this.cosP(), G = this.ground(x, y);
    const up = ay - h / 2;                        // card centre above the ground row, in painted px
    m.scale.set(w, h, 1);
    m.rotation.x = -(Math.PI / 2 - this.pitch);
    m.position.set(G[0] - ax + w / 2, G[1] + up * c, G[2] - up * s);
  }
  contact(x, y, rx) {
    if (!this._blob) {
      const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
      const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(30,14,40,0.55)'); gr.addColorStop(0.6, 'rgba(30,14,40,0.28)'); gr.addColorStop(1, 'rgba(30,14,40,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
      this._blob = new THREE.CanvasTexture(c); this._blobMat = new THREE.MeshBasicMaterial({ map: this._blob, transparent: true, depthWrite: false });
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), this._blobMat);
    const G = this.ground(x, y); m.scale.set(rx * 2, 1, rx * 0.9 / this.sinP()); m.position.set(G[0], G[1] + 0.3, G[2] - 1);
    m.renderOrder = 1;
    return m;
  }
  makeCamera() {
    if (!this.vw) return;
    const s = this.sinP(), c = this.cosP();
    if (this.fov > 0) { this.cam = new THREE.PerspectiveCamera(this.fov, this.vw / this.vh, 10, 8000); this.dist = this.vh / (2 * Math.tan(this.fov * Math.PI / 360)); }
    else { this.cam = new THREE.OrthographicCamera(-this.vw / 2, this.vw / 2, this.vh / 2, -this.vh / 2, 1, 8000); this.dist = 1500; }
  }
  // ------------------------------------------------------------------ frame
  // cam: { x, y } top-left of the painted view (as Scene2D); actors: Actor list with frame() → { surf, ax, ay }
  render(cam, actors, t = 0) {
    const s = this.sinP(), c = this.cosP();
    // look at the painted point at the centre of the view, on the floor of whatever level is there
    const cx = cam.x + this.vw / 2, cy = cam.y + this.vh / 2;
    const G = this.ground(cx, cy);
    const tgt = new THREE.Vector3(G[0], G[1], G[2]);
    const yaw = (this.yaw || 0) * Math.PI / 180;
    this.cam.position.set(tgt.x + Math.sin(yaw) * c * this.dist, tgt.y + s * this.dist, tgt.z + Math.cos(yaw) * c * this.dist);
    this.cam.lookAt(tgt);
    // dynamic billboards (creatures)
    const seen = new Set();
    for (const a of actors) {
      const f = a.frame(t); if (!f) continue;
      let m = this.billboards.get(a);
      const cv = toCanvas(f.surf);
      if (!m) { m = this.billboard({ cv, ax: f.ax, ay: f.ay }, a.x, a.y); this.scene.add(m); this.billboards.set(a, m); m.userData.blob = this.contact(a.x, a.y, 9); this.scene.add(m.userData.blob); }
      { const G = this.ground(a.x, a.y); m.userData.blob.position.set(G[0], G[1] + 0.3, G[2] - 1); m.userData.blob.visible = true; }
      const tx = this.tex(cv); if (m.material.map !== tx) { m.material.map = tx; m.material.needsUpdate = true; m.customDepthMaterial.map = tx; m.customDepthMaterial.needsUpdate = true; }
      this.place(m, cv, a.x, a.y - (a.z || 0), f.ax, f.ay);
      if (yaw) m.rotation.y = yaw;
      m.visible = true; seen.add(a);
    }
    for (const [a, m] of this.billboards) if (!seen.has(a)) { m.visible = false; if (m.userData.blob) m.userData.blob.visible = false; }
    for (const p of this.points) if (p.userData.flick !== false) p.intensity *= 1;
    this.r.render(this.scene, this.cam);
    return this.cv;
  }
  dispose() { if (this.scene) this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); this.billboards.clear(); }
}
