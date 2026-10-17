// Tiny event emitter used for decoupling systems (game ↔ ui ↔ gfx).
export class Emitter {
  constructor() { this._h = new Map(); }
  on(type, fn) { if (!this._h.has(type)) this._h.set(type, new Set()); this._h.get(type).add(fn); return () => this.off(type, fn); }
  once(type, fn) { const off = this.on(type, (...a) => { off(); fn(...a); }); return off; }
  off(type, fn) { const s = this._h.get(type); if (s) s.delete(fn); }
  emit(type, ...args) { const s = this._h.get(type); if (s) for (const fn of [...s]) fn(...args); }
}
export const bus = new Emitter();
