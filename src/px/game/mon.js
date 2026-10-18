// Creature sprites for the game: frames come from the 3D models (sdf.js) and are
// rendered lazily per (clip, facing, frame) with a small per-tick budget, so a
// creature turning or starting a new move never stalls the frame loop — until a
// frame exists the nearest already-rendered one is shown.
import { renderFrame, CLIPS, FPS, isLoop } from '../sdf.js';
import { SPRITES } from '../../data/sprites/sdf_starters.js';

export const DESIGNS = Object.assign({}, SPRITES);
export const hasDesign = (id) => !!DESIGNS[id];

// 8 facings: yaw 0 = toward the viewer (screen down), 90 = screen right, 180 = away, -90 = left
export const YAWS = [0, 45, 90, 135, 180, -135, -90, -45];
export function yawOf(dx, dy) { return Math.atan2(dx, dy) * 180 / Math.PI; }
export function snapYaw(y) { const k = Math.round(((y % 360) + 360) % 360 / 45) % 8; return [0, 45, 90, 135, 180, -135, -90, -45][k]; }

export const bank = {
  cache: new Map(), budget: 3, used: 0, enabled: true,
  tick(budget) { this.used = 0; if (budget != null) this.budget = budget; },
  key(d, o) { return [d.id, o.clip, o.frame, o.yaw, o.scale, o.pitch ?? '', o.expr || '', o.bonded ? 1 : 0, (o.show || []).join('+')].join('|'); },
  peek(d, o) { return this.cache.get(this.key(d, o)) || null; },
  get(d, o, force = false) {
    const k = this.key(d, o);
    let f = this.cache.get(k);
    if (!f && (force || this.used < this.budget)) { this.used++; f = renderFrame(d, o); this.cache.set(k, f); }
    return f || null;
  },
  // warm a whole clip (loading screens)
  warm(d, clip, o) { const n = CLIPS[clip] || 24; for (let i = 0; i < n; i++) this.get(d, Object.assign({}, o, { clip, frame: i }), true); },
};

export class MonSprite {
  // o: { scale, yaw, pitch, bonded }
  constructor(species, o = {}) {
    this.species = species; this.d = DESIGNS[species] || DESIGNS.chilichick;
    this.scale = o.scale || 0.55; this.yaw = o.yaw ?? 0; this.pitch = o.pitch; this.bonded = !!o.bonded;
    this.clip = 'idle'; this.t = 0; this.base = 'idle'; this.then = null; this.done = false; this.last = null; this.expr = null; this.show = null;
  }
  play(clip, o = {}) { if (!CLIPS[clip]) clip = 'idle'; if (this.clip === clip && !o.restart) return; this.clip = clip; this.t = 0; this.then = o.then || null; this.done = false; this._resolve && this._resolve(); this._resolve = null; }
  playAsync(clip) { return new Promise((r) => { this.play(clip, { restart: true }); this._resolve = r; }); }
  setBase(c) { this.base = c; if (isLoop(this.clip) && this.clip !== c) this.play(c); }
  update(dt) {
    this.t += dt;
    const n = CLIPS[this.clip] || 24;
    if (!isLoop(this.clip) && this.t * FPS >= n) {
      if (this.clip === 'faint') { this.t = (n - 1) / FPS; this.done = true; }
      else { const r = this._resolve; this._resolve = null; this.done = true; this.play(this.then || this.base, { restart: true }); r && r(); }
    }
  }
  // animated "on twos": every pose is held for two 24 fps frames (classic 12 fps pixel animation, half the renders)
  frameIndex() { const n = CLIPS[this.clip] || 24; let f = Math.floor(this.t * FPS); f = isLoop(this.clip) ? f % n : Math.min(n - 1, f); return f - (f % 2); }
  opts(frame) { return { clip: this.clip, frame, yaw: snapYaw(this.yaw), scale: this.scale, pitch: this.pitch, bonded: this.bonded, expr: this.expr || undefined, show: this.show || undefined }; }
  // → { surf, ax, ay } (anchor = ground point under the creature)
  frame() {
    const fi = this.frameIndex(), o = this.opts(fi);
    let f = bank.get(this.d, o);
    if (!f) { // nearest available: same clip earlier frames, then the last frame shown, then force one
      for (let k = 1; k < 6 && !f; k++) f = bank.peek(this.d, this.opts((fi - k + 64) % (CLIPS[this.clip] || 24)));
      if (!f && this.last) return this.last;
      if (!f) f = bank.get(this.d, o, true);
    }
    const ax = (this.d.anchor[0]) * this.scale + (f.ox || 0), ay = this.d.anchor[1] * this.scale + (f.oy || 0);
    this.last = { surf: f, ax, ay };
    return this.last;
  }
}
