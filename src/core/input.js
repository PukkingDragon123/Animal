// Unified pointer + keyboard input for touch-first play.
// Emits: tap, longpress, swipe, dragstart, drag, dragend, pinch, wheel, key
import { Emitter } from './events.js';

export class Input extends Emitter {
  constructor(el) {
    super();
    this.el = el;
    this.ptrs = new Map();
    this.keys = new Set();
    this.enabled = true;
    this.pinch0 = null;
    el.addEventListener('pointerdown', (e) => this._down(e));
    addEventListener('pointermove', (e) => this._move(e));
    addEventListener('pointerup', (e) => this._up(e));
    addEventListener('pointercancel', (e) => this._up(e, true));
    el.addEventListener('wheel', (e) => { e.preventDefault(); if (this.enabled) this.emit('wheel', { dy: e.deltaY, x: e.clientX, y: e.clientY }); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (!this.keys.has(e.code)) { this.keys.add(e.code); this.emit('key', { code: e.code, down: true, repeat: false }); }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => { this.keys.delete(e.code); this.emit('key', { code: e.code, down: false }); });
    addEventListener('blur', () => { this.keys.clear(); this.ptrs.clear(); });
  }
  isDown(code) { return this.keys.has(code); }
  _down(e) {
    if (!this.enabled) return;
    this.el.setPointerCapture && this.el.setPointerCapture(e.pointerId);
    const p = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), drag: false, long: false, btn: e.button };
    this.ptrs.set(e.pointerId, p);
    if (this.ptrs.size === 2) { const [a, b] = [...this.ptrs.values()]; this.pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x) }; for (const q of this.ptrs.values()) q.multi = true; }
    p.timer = setTimeout(() => { if (this.ptrs.get(e.pointerId) === p && !p.drag && !p.multi) { p.long = true; this.emit('longpress', { x: p.x, y: p.y }); } }, 480);
    this.emit('down', { x: p.x, y: p.y, id: p.id, btn: p.btn });
  }
  _move(e) {
    const p = this.ptrs.get(e.pointerId);
    if (!p) { this.emit('hover', { x: e.clientX, y: e.clientY }); return; }
    p.x = e.clientX; p.y = e.clientY;
    if (this.ptrs.size >= 2 && this.pinch0) {
      const [a, b] = [...this.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
      this.emit('pinch', { scale: d / (this.pinch0.d || 1), rot: ang - this.pinch0.ang });
      this.pinch0 = { d, ang };
      return;
    }
    if (!p.drag && Math.hypot(p.x - p.x0, p.y - p.y0) > 14) { p.drag = true; clearTimeout(p.timer); this.emit('dragstart', { x: p.x0, y: p.y0, id: p.id }); }
    if (p.drag) this.emit('drag', { x: p.x, y: p.y, dx: p.x - p.x0, dy: p.y - p.y0, id: p.id });
  }
  _up(e, cancel) {
    const p = this.ptrs.get(e.pointerId);
    if (!p) return;
    clearTimeout(p.timer);
    this.ptrs.delete(e.pointerId);
    if (this.ptrs.size < 2) this.pinch0 = null;
    if (cancel || !this.enabled) return;
    const dt = performance.now() - p.t0, dist = Math.hypot(p.x - p.x0, p.y - p.y0);
    if (p.multi) { if (!this.ptrs.size) for (const q of this.ptrs.values()) q.multi = false; return; }
    if (p.drag) {
      this.emit('dragend', { x: p.x, y: p.y, dx: p.x - p.x0, dy: p.y - p.y0, id: p.id });
      if (dt < 300 && dist > 50) this.emit('swipe', { x: p.x0, y: p.y0, dx: p.x - p.x0, dy: p.y - p.y0 });
    } else if (!p.long && dt < 450) this.emit('tap', { x: p.x, y: p.y, btn: p.btn });
    this.emit('up', { x: p.x, y: p.y });
  }
}
