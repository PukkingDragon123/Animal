// Unified input → one command object {mx, mz, sprint}. Touch joystick (left
// half) + sprint zone (right half) via pointer events, physical-keycode
// keyboard (WASD/arrows + Shift/Space), and the Gamepad API. Fixed camera:
// screen-up = world +Z. No hover-only interactions; every verb works on touch.

const MOVE = {
  KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};
const SPRINT_KEYS = new Set(['ShiftLeft', 'ShiftRight', 'Space']);

export class Input {
  constructor(el) {
    this.el = el;
    this.keys = new Set();
    this.sprintKey = false;
    this.sprintBtn = false;
    this.maxR = 64;
    this.joy = { active: false, id: -1, ox: 0, oy: 0, cx: 0, cy: 0 };
    this.sprintId = -1;
    this.enabled = true;
    this._bind();
  }

  _bind() {
    addEventListener('keydown', (e) => {
      if (MOVE[e.code]) { this.keys.add(e.code); e.preventDefault(); }
      if (SPRINT_KEYS.has(e.code)) { this.sprintKey = true; e.preventDefault(); }
    });
    addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (SPRINT_KEYS.has(e.code)) this.sprintKey = false;
    });

    const down = (e) => {
      if (!this.enabled) return;
      const left = e.clientX < innerWidth * 0.5;
      if (left && !this.joy.active) {
        this.joy.active = true; this.joy.id = e.pointerId;
        this.joy.ox = this.joy.cx = e.clientX; this.joy.oy = this.joy.cy = e.clientY;
      } else if (!left) {
        this.sprintId = e.pointerId;
      }
      this.el.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };
    const move = (e) => {
      if (this.joy.active && e.pointerId === this.joy.id) { this.joy.cx = e.clientX; this.joy.cy = e.clientY; }
    };
    const up = (e) => {
      if (e.pointerId === this.joy.id) { this.joy.active = false; this.joy.id = -1; }
      if (e.pointerId === this.sprintId) this.sprintId = -1;
    };
    this.el.addEventListener('pointerdown', down, { passive: false });
    this.el.addEventListener('pointermove', move, { passive: false });
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  }

  setSprintButton(v) { this.sprintBtn = v; }
  reset() { this.keys.clear(); this.sprintKey = false; this.sprintBtn = false; this.joy.active = false; this.joy.id = -1; this.sprintId = -1; }

  // joystick visual for the HUD
  joyVisual() {
    if (!this.joy.active) return null;
    let dx = this.joy.cx - this.joy.ox, dy = this.joy.cy - this.joy.oy;
    const len = Math.hypot(dx, dy) || 1;
    const cl = Math.min(len, this.maxR);
    return { ox: this.joy.ox, oy: this.joy.oy, kx: this.joy.ox + (dx / len) * cl, ky: this.joy.oy + (dy / len) * cl, maxR: this.maxR };
  }

  get() {
    let mx = 0, mz = 0, sprint = this.sprintKey || this.sprintBtn || this.sprintId >= 0;

    // keyboard
    for (const k of this.keys) { const m = MOVE[k]; if (m) { mx += m[0]; mz += m[1]; } }

    // touch joystick
    if (this.joy.active) {
      const dx = this.joy.cx - this.joy.ox, dy = this.joy.cy - this.joy.oy;
      const len = Math.hypot(dx, dy);
      if (len > 6) {
        const cl = Math.min(len, this.maxR) / this.maxR;
        mx += (dx / len) * cl; mz += -(dy / len) * cl;     // screen up = +z
      }
    }

    // gamepad
    const pads = (typeof navigator !== 'undefined' && navigator.getGamepads) ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (Math.abs(ax) > 0.18) mx += ax;
      if (Math.abs(ay) > 0.18) mz += -ay;
      if (gp.buttons[0]?.pressed || gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) sprint = true;
      // dpad
      if (gp.buttons[12]?.pressed) mz += 1; if (gp.buttons[13]?.pressed) mz -= 1;
      if (gp.buttons[14]?.pressed) mx -= 1; if (gp.buttons[15]?.pressed) mx += 1;
    }

    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }
    return { mx, mz, sprint };
  }
}
