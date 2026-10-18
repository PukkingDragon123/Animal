// 2D pixel scene with HD-2D staging: a baked ground layer, depth-sorted sprites
// (props, buildings, actors) and an overlay layer, composed every frame into a
// low-resolution canvas that hd2d.js then lights and grades.
//
// Every sprite casts a sun shadow built from its own silhouette (pixels higher
// up the sprite land further along the sun direction), so shadows match the
// art exactly and actors' shadows move with their animation.
import { Surf } from './surface.js';

const mk = (w, h) => { const c = typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(w, h); c.width = w; c.height = h; return c; };
const toCanvas = (s) => (s.canvas ? s.canvas() : s);
const hexA = (h, a) => { const v = parseInt(h.slice(1), 16); return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`; };

export class Scene2D {
  // o: { w, h, viewW, viewH, sun: [kx, ky] shadow shear per pixel of height, shadowAlpha, shadowColor }
  constructor(o) {
    this.w = o.w; this.h = o.h; this.vw = o.viewW || 480; this.vh = o.viewH || 270;
    this.sun = o.sun || [0.5, 0.26]; this.shadowAlpha = o.shadowAlpha ?? 0.34; this.shadowColor = o.shadowColor || '#3a2448';
    this.ground = new Surf(this.w, this.h);       // painted directly
    this.overlay = new Surf(this.w, this.h);      // wires, foreground haze… drawn over everything
    this.sprites = [];                            // { surf|canvas, x, y (ground anchor), ax, ay, shadow, z }
    this.actors = new Set();
    this.cam = { x: 0, y: 0 };
    this.out = mk(this.vw, this.vh); this.ctx = this.out.getContext('2d');
    this.fx = [];                                 // per-frame painters (particles, motes): fn(ctx, cam, t)
    this.glows = [];                              // light halos for bloom: { x, y, r, color, a }
  }
  setView(w, h) { this.vw = w; this.vh = h; this.out.width = w; this.out.height = h; this._dyn = null; }
  add(spr, x, y, o = {}) { const s = Object.assign({ x, y, shadow: true, z: 0 }, spr, o); s.cv = toCanvas(spr.surf); this.sprites.push(s); return s; }
  // bake: ground + static shadows into one canvas
  bake() {
    const g = mk(this.w, this.h), gx = g.getContext('2d');
    gx.drawImage(toCanvas(this.ground), 0, 0);
    const sh = mk(this.w, this.h), sx = sh.getContext('2d');
    for (const s of this.sprites) if (s.shadow && !s.dynamic) this.castShadow(sx, s.cv, s.x - s.ax, s.y, s.ay, s.shadowLift || 0);
    this._shadowStatic = sh;
    gx.globalAlpha = this.shadowAlpha; gx.drawImage(this.tint(sh), 0, 0); gx.globalAlpha = 1;
    this.baked = g;
    this.ov = toCanvas(this.overlay);
  }
  tint(cv) { const t = mk(cv.width, cv.height), x = t.getContext('2d'); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = this.shadowColor; x.fillRect(0, 0, t.width, t.height); return t; }
  // shear the sprite's silhouette onto the ground: a pixel h above the base lands h·(kx, ky) away
  castShadow(ctx, cv, left, baseY, ay, lift = 0) {
    const [kx, ky] = this.sun;
    ctx.save();
    ctx.setTransform(1, 0, -kx, -ky, left + kx * ay, baseY + ky * ay - lift);
    ctx.drawImage(cv, 0, 0);
    ctx.restore();
  }
  // frame compose (camera in world px, integer-snapped)
  render(t = 0) {
    const c = this.ctx, cx = Math.round(Math.max(0, Math.min(this.w - this.vw, this.cam.x))), cy = Math.round(Math.max(0, Math.min(this.h - this.vh, this.cam.y)));
    this.cam.x = cx; this.cam.y = cy;
    c.imageSmoothingEnabled = false;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.vw, this.vh);
    c.drawImage(this.baked, cx, cy, this.vw, this.vh, 0, 0, this.vw, this.vh);
    // dynamic shadows (actors), merged so overlaps don't double-darken
    if (!this._dyn) { this._dyn = mk(this.vw, this.vh); this._dynx = this._dyn.getContext('2d'); }
    const dx = this._dynx; dx.setTransform(1, 0, 0, 1, 0, 0); dx.clearRect(0, 0, this.vw, this.vh);
    const list = [...this.sprites.filter((s) => s.y + 80 > cy && s.y - (s.cv.height + 80) < cy + this.vh && s.x + s.cv.width > cx - 60 && s.x - s.cv.width < cx + this.vw + 60)];
    for (const a of this.actors) {
      const f = a.frame(t); if (!f) continue;
      const cv = toCanvas(f.surf); a.cv = cv; a.ax = f.ax; a.ay = f.ay;
      list.push(a);
      if (a.shadow !== false) this.castShadow(dx, cv, Math.round(a.x - f.ax) - cx, Math.round(a.y) - cy, f.ay, f.lift || 0);
    }
    if (this.actors.size) { c.globalAlpha = this.shadowAlpha; c.drawImage(this.tint(this._dyn), 0, 0); c.globalAlpha = 1; }
    list.sort((a, b) => (a.y + (a.z || 0)) - (b.y + (b.z || 0)));
    for (const s of list) c.drawImage(s.cv, Math.round(s.x - s.ax) - cx, Math.round(s.y - s.ay) - cy);
    c.drawImage(this.ov, cx, cy, this.vw, this.vh, 0, 0, this.vw, this.vh);
    // soft light halos (lamps, neon, lanterns) — added light, picked up by bloom
    c.globalCompositeOperation = 'lighter';
    for (const L of this.glows) {
      const x = L.x - cx, y = L.y - cy; if (x < -L.r || y < -L.r || x > this.vw + L.r || y > this.vh + L.r) continue;
      const a = L.a * (L.flicker ? 0.85 + 0.15 * Math.sin(t * 7 + L.x) : 1);
      const gr = c.createRadialGradient(x, y, 0, x, y, L.r); gr.addColorStop(0, hexA(L.color, a)); gr.addColorStop(1, hexA(L.color, 0));
      c.fillStyle = gr; c.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2);
    }
    c.globalCompositeOperation = 'source-over';
    for (const f of this.fx) f(c, this.cam, t);
    return this.out;
  }
}

// an actor driven by a frame source: frame(t) → { surf, ax, ay }
export class Actor {
  constructor(o) { Object.assign(this, { x: 0, y: 0, z: 0, shadow: true }, o); }
  frame(t) { return this.src ? this.src(t, this) : null; }
}
