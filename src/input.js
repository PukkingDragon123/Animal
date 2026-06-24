// Unified input → one command object {mx, mz, sprint, attack}.
//
// Touch: the WHOLE canvas is a dynamic joystick. pointerdown on the canvas
// drops a stick at the touch point; window-level move/up listeners track it (no
// setPointerCapture reliance — that was flaky on mobile). The RUN and ATTACK
// HUD buttons are separate DOM elements, so taps on them never reach the canvas
// and never start the stick. Sprint/attack come from those buttons + keyboard +
// gamepad — there is no invisible screen-half that can swallow a touch.
//
// Camera note: the follow camera looks toward +Z (yaw 180° from the Three.js
// default), so world +X renders to SCREEN-LEFT. We return -X so "push right"
// moves the player right on screen; world +Z = screen-up.

const MOVE = {
  KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};
const SPRINT_KEYS = new Set(['ShiftLeft', 'ShiftRight']);
const ATTACK_KEYS = new Set(['Space', 'KeyJ', 'Enter']);

export class Input {
  constructor(el) {
    this.el = el;
    this.keys = new Set();
    this.sprintKey = false; this.sprintBtn = false;
    this.attackKey = false; this.attackBtn = false;
    this.maxR = 60;
    this.joy = { active: false, id: -1, ox: 0, oy: 0, cx: 0, cy: 0 };
    this.enabled = true;
    this._bind();
  }

  _bind() {
    addEventListener('keydown', (e) => {
      if (MOVE[e.code]) { this.keys.add(e.code); e.preventDefault(); }
      if (SPRINT_KEYS.has(e.code)) { this.sprintKey = true; e.preventDefault(); }
      if (ATTACK_KEYS.has(e.code)) { this.attackKey = true; e.preventDefault(); }
    });
    addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (SPRINT_KEYS.has(e.code)) this.sprintKey = false;
      if (ATTACK_KEYS.has(e.code)) this.attackKey = false;
    });

    // whole-canvas dynamic joystick
    this.el.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.joy.active) return;
      this.joy.active = true; this.joy.id = e.pointerId;
      this.joy.ox = this.joy.cx = e.clientX; this.joy.oy = this.joy.cy = e.clientY;
      try { this.el.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    }, { passive: false });

    const onMove = (e) => { if (this.joy.active && e.pointerId === this.joy.id) { this.joy.cx = e.clientX; this.joy.cy = e.clientY; } };
    const onUp = (e) => { if (e.pointerId === this.joy.id) { this.joy.active = false; this.joy.id = -1; } };
    addEventListener('pointermove', onMove, { passive: false });
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
  }

  setSprintButton(v) { this.sprintBtn = v; }
  setAttackButton(v) { this.attackBtn = v; }
  reset() { this.keys.clear(); this.sprintKey = this.sprintBtn = this.attackKey = this.attackBtn = false; this.joy.active = false; this.joy.id = -1; }

  // joystick visual for the HUD (client px)
  joyVisual() {
    if (!this.joy.active) return null;
    const dx = this.joy.cx - this.joy.ox, dy = this.joy.cy - this.joy.oy;
    const len = Math.hypot(dx, dy) || 1, cl = Math.min(len, this.maxR);
    return { ox: this.joy.ox, oy: this.joy.oy, kx: this.joy.ox + (dx / len) * cl, ky: this.joy.oy + (dy / len) * cl, maxR: this.maxR };
  }

  get() {
    let mx = 0, mz = 0;
    let sprint = this.sprintKey || this.sprintBtn;
    let attack = this.attackKey || this.attackBtn;

    for (const k of this.keys) { const m = MOVE[k]; if (m) { mx += m[0]; mz += m[1]; } }

    if (this.joy.active) {
      const dx = this.joy.cx - this.joy.ox, dy = this.joy.cy - this.joy.oy;
      const len = Math.hypot(dx, dy);
      if (len > 4) {
        const cl = Math.min(len, this.maxR) / this.maxR;
        mx += (dx / len) * cl; mz += -(dy / len) * cl;     // screen up = +z
      }
    }

    const pads = (typeof navigator !== 'undefined' && navigator.getGamepads) ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (Math.abs(ax) > 0.18) mx += ax;
      if (Math.abs(ay) > 0.18) mz += -ay;
      if (gp.buttons[4]?.pressed || gp.buttons[5]?.pressed || gp.buttons[6]?.pressed || gp.buttons[7]?.pressed) sprint = true;
      if (gp.buttons[0]?.pressed || gp.buttons[2]?.pressed) attack = true;
      if (gp.buttons[12]?.pressed) mz += 1; if (gp.buttons[13]?.pressed) mz -= 1;
      if (gp.buttons[14]?.pressed) mx -= 1; if (gp.buttons[15]?.pressed) mx += 1;
    }

    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }
    return { mx: -mx, mz, sprint, attack };       // negate X: camera maps +X to screen-left
  }
}
