// Walking the city, Pokémon Sword/Shield style. A third-person camera rides behind and above you; you can
// orbit it (right stick, mouse drag, a finger on the right half of a touch screen, Q / E) and zoom it a
// little (wheel, pinch, + / -), and while you walk forward it eases back behind you on its own. Movement is
// relative to the camera (WASD / arrows / left stick / the thumbstick on the left half of a touch screen;
// Shift or the B button to run, or push the thumbstick all the way), and the trainer sets off, turns and
// stops with a little weight. When a building gets between the camera and you the camera pulls in in front
// of it, and anything still in the way fades out. Indoors the camera frames you closer and steeper: the roof
// and the storeys above vanish, and so do the outer walls on the camera's side and any inner wall between the
// camera and you, from whichever side you look. Cutscenes take the camera through the world's shot() /
// setCam() / tween API; when they hand it back the follow camera blends in from wherever the shot left it.
// Doors swing open as you come near. Interactables nearby show a prompt ([E] / A / tap) and run their act().
// Zones set the place name and music. The minimap turns with the camera.
import * as THREE from '../../../vendor/three.module.js';

const WALK = 2.5, RUN = 5.2, R = 0.26;
// m/s² up to walking pace, then on to a run (the short run-start), braking; turn rates in rad/s
const ACC = 16, ACC_RUN = 6.5, DEC = 20, TURN = 11, TURN_RUN = 7.5;
// framing: distance (m), pitch (°), look-at height above the feet (m), vertical lens (°), look-ahead (s of velocity)
// LOCATIONS.city.follow overrides these ({ ..., indoor: { ... } })
export const FRAME = {
  out: { dist: 5.2, pitch: 17, h: 1.3, fov: 42, lead: 0.28 },
  in: { dist: 5.0, pitch: 40, h: 1.0, fov: 42, lead: 0.1 },
};
// zoom multiplies the distance: 3.5 m in to 10 m out outdoors (zooming out also tilts the camera down a little)
const ZMIN = 0.67, ZMAX = 1.92, MIN_D = 2.0, D2R = Math.PI / 180, FH = 3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const kexp = (dt, r) => 1 - Math.exp(-dt * r);
const ease = (t) => t * t * (3 - 2 * t);
const wrapR = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const wrapD = (a) => { a %= 360; if (a > 180) a -= 360; if (a < -180) a += 360; return a; };
const _s = new THREE.Vector3();

export class CityControl {
  constructor(world, city) {
    this.w = world; this.app = world.app; this.c = city; this.nav = city.nav;
    this.L = 0; this.vx = 0; this.vz = 0; this.spd = 0; this.head = 0; this.pvx = 0; this.pvz = 0; this.last = null;
    this.near = null; this.inside = -1; this.zone = null; this.stepD = 0; this.moving = false; this.camLead = { x: 0, z: 0 };
    // the follow camera: orbit yaw (target and smoothed, unwrapped degrees), the player's pitch tilt, zoom
    this.yaw = 45; this.cyaw = 45; this.pitchOff = 0; this.zoom = 1; this.zoomT = 1; this.manualT = 0; this.orbiting = false;
    this.ft = new THREE.Vector3(); this.fd = FRAME.out.dist; this.fp = FRAME.out.pitch; this.fh = FRAME.out.h; this.fdb = FRAME.out.dist; this.fpb = FRAME.out.pitch; this.ffov = FRAME.out.fov;
    this.following = false; this.blend = null; this.blendDur = 0.9; this.snapNext = false; this.frameYaw = null; this.inAng = 0;
    this.ptrs = new Map(); this.joyP = null; this.pinch = null; this.pad = null; this.padPrev = {}; this.eLatch = false;
    this.touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    this.mm = null; this.cutB = -1;
    // what the camera bumps into (solid blocks; gates you walk under only fade) and how tall each building stands
    for (const B of city.buildings) {
      const rf = B.o && B.o.roof, rh = rf && rf.type && rf.type !== 'flat' ? rf.h || Math.min(B.w, B.d) * 0.45 : 0.5;
      B.ftop = B.H + rh; B.ctop = B.H + (rf && rf.type && rf.type !== 'flat' ? rh * 0.6 : 0.5);
      B.solid = B.enter || !this.nav.ok(B.x + B.w / 2, B.z + B.d / 2, 0);
    }
    for (const D of city.doors) { const B = city.buildings[D.building]; if (B) D.side = D.axis === 'x' ? (Math.abs(D.z - B.z - B.d) < Math.abs(D.z - B.z) ? 's' : 'n') : (Math.abs(D.x - B.x - B.w) < Math.abs(D.x - B.x) ? 'e' : 'w'); }
    this.onWheel = (e) => { if (!this.active()) return; this.zoomT = clamp(this.zoomT * (e.deltaY > 0 ? 1.08 : 1 / 1.08), ZMIN, ZMAX); };
    addEventListener('wheel', this.onWheel, { passive: true });
    // every pointer on its own (a thumb on the stick and another turning the camera, or two pinching)
    const cv = this.app.uiCv;
    if (cv && cv.addEventListener) {
      const at = (e, q) => { const r = cv.getBoundingClientRect(); q.x = ((e.clientX - r.left) / (r.width || 1)) * this.app.vw; q.y = ((e.clientY - r.top) / (r.height || 1)) * this.app.vh; };
      this.onDown = (e) => { const q = { id: e.pointerId, type: e.pointerType || 'mouse', btn: e.button || 0, role: null, moved: false, up: false, dx: 0, dy: 0, m: 0 }; at(e, q); q.sx = q.px = q.x; q.sy = q.py = q.y; this.ptrs.set(e.pointerId, q); };
      this.onMove = (e) => { const q = this.ptrs.get(e.pointerId); if (q) at(e, q); };
      this.onUp = (e) => { const q = this.ptrs.get(e.pointerId); if (q) { at(e, q); q.up = true; } };
      this.onCtx = (e) => { if (this.w.free) e.preventDefault(); };
      cv.addEventListener('pointerdown', this.onDown); cv.addEventListener('pointermove', this.onMove); cv.addEventListener('pointerup', this.onUp); cv.addEventListener('pointercancel', this.onUp); cv.addEventListener('contextmenu', this.onCtx);
      this.cv = cv;
    }
  }
  dispose() {
    removeEventListener('wheel', this.onWheel);
    const cv = this.cv; if (cv) { cv.removeEventListener('pointerdown', this.onDown); cv.removeEventListener('pointermove', this.onMove); cv.removeEventListener('pointerup', this.onUp); cv.removeEventListener('pointercancel', this.onUp); cv.removeEventListener('contextmenu', this.onCtx); }
  }
  get player() { return this.w.player; }
  active() { return this.w.free && this.player && !this.blocked(); }
  blocked() { const a = this.app; return !!(a.ui.dialog || a.ui.modal || a.story.busy || (a.phone && a.phone.open) || (a.battle && a.battle.active) || (a.hud && a.hud.menuOpen) || a._travelling); }
  /** place the player (and work out which storey they stand on) */
  placed() { const p = this.player.g.position; this.L = this.nav.levelAt(p.x, p.z, p.y); this.last = null; this.spd = this.vx = this.vz = 0; }
  /** the follow camera takes the camera back: blended in over dur seconds from wherever it is, or snapped behind you (0) */
  resume(dur = 0.9) {
    this.w.camHeld = false; this.following = false;
    if (dur > 0) this.blendDur = dur; else this.snapNext = true;
    return dur > 0 ? new Promise((r) => setTimeout(r, dur * 1000)) : Promise.resolve();
  }
  /** swing the camera back behind the player (C, the left stick click / ZL) */
  recentre() { const a = this.player; if (!a) return; this.yaw = this.cyaw + wrapD(a.yaw / D2R + 180 - this.cyaw); this.pitchOff = 0; this.manualT = 0.8; }
  /** the minimap / compass turn: the camera's heading (radians; 0 = looking north) */
  mapYaw() { return ((this.w.cam && this.w.cam.yaw) || 0) * D2R; }
  preset() {
    const F = (this.w.loc && this.w.loc.follow) || {}, inn = this.inside >= 0;
    return Object.assign({}, inn ? FRAME.in : FRAME.out, inn ? F.indoor || {} : F);
  }
  // ---------------------------------------------------------------- input
  input() {
    const k = this.app.keysDown;
    let x = (k.d || k.ArrowRight ? 1 : 0) - (k.a || k.ArrowLeft ? 1 : 0), y = (k.s || k.ArrowDown ? 1 : 0) - (k.w || k.ArrowUp ? 1 : 0), run = !!(k.Shift || k.shift);
    const J = this.joyP && this.joyP.moved ? this.joyP : null;
    if (J) { x = J.dx; y = J.dy; run = run || J.m > 0.92; }
    const G = this.pad; if (G && G.mag > 0) { x = G.lx; y = G.ly; } if (G && G.run) run = true;
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    return { x, y, run, mag: Math.min(1, m) };
  }
  overUI(q) { return q.y < 30 || (q.y > this.app.vh - 52 && q.x > this.app.vw - 80); }
  // pointers: the touch thumbstick on the left half, camera drags on the right half (mouse: anywhere), pinch zoom
  pointers() {
    const ui = this.app.ui, act = this.active(), cams = [];
    for (const q of this.ptrs.values()) {
      if (!q.role) {
        if (!act || this.overUI(q)) q.role = 'none';
        else if (q.type !== 'mouse' && q.sx < this.app.vw * 0.5 && !this.joyP) { q.role = 'joy'; this.joyP = q; }
        else q.role = 'cam';
      }
      const dx = q.x - q.px, dy = q.y - q.py; q.px = q.x; q.py = q.y;
      if (!q.moved && Math.hypot(q.x - q.sx, q.y - q.sy) > (q.role === 'joy' ? 4 : 6)) q.moved = true;
      if (q.role === 'joy') { const R0 = 26, ex = q.x - q.sx, ey = q.y - q.sy, d = Math.hypot(ex, ey), m = Math.min(1, d / R0); q.m = act ? m : 0; q.dx = d && act ? (ex / d) * m : 0; q.dy = d && act ? (ey / d) * m : 0; }
      if (q.role === 'cam' && !q.up) cams.push([q, dx, dy]);
      if (q.up) { if (q.moved && q.role !== 'none') ui.ptr.released = false; if (q === this.joyP) this.joyP = null; this.ptrs.delete(q.id); }
    }
    if (cams.length >= 2) {
      const a = cams[0][0], b = cams[1][0], d = Math.max(8, Math.hypot(a.x - b.x, a.y - b.y)); a.moved = b.moved = true;
      if (!this.pinch) this.pinch = { d, z: this.zoomT }; else if (act) this.zoomT = clamp((this.pinch.z * this.pinch.d) / d, ZMIN, ZMAX);
    } else {
      this.pinch = null;
      if (cams.length === 1 && cams[0][0].moved && act) this.orbit(-cams[0][1] * 0.9, cams[0][2] * 0.5);
    }
  }
  orbit(dyaw, dpitch) { this.yaw += dyaw; this.pitchOff = clamp(this.pitchOff + dpitch, -12, 28); this.manualT = 2.2; this.orbiting = true; }
  // a standard-mapping gamepad, laid out like the Switch: left stick walks, right stick turns the camera, A (right
  // face button) talks and confirms, B (bottom) runs and skips text, L / R turn the camera, ZL or a stick click
  // recentres it, + opens the menu, the d-pad drives menus
  gamepad() {
    let pads = null; try { pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : null; } catch (e) { pads = null; }
    let g = null; if (pads) for (const q of pads) if (q && q.connected !== false && q.axes && q.axes.length >= 4) { g = q; break; }
    if (!g) { this.pad = null; return; }
    const ui = this.app.ui, kd = this.app.keysDown, prev = this.padPrev, now = {}, bt = (i) => !!(g.buttons[i] && g.buttons[i].pressed);
    const dz = (x, y, d) => { const m = Math.hypot(x, y); if (m < d) return [0, 0, 0]; const k = Math.min(1, (m - d) / (1 - d)); return [(x / m) * k, (y / m) * k, k]; };
    const [lx, ly, lm] = dz(g.axes[0] || 0, g.axes[1] || 0, 0.2), [rx, ry] = dz(g.axes[2] || 0, g.axes[3] || 0, 0.18);
    for (let i = 0; i < 16; i++) now[i] = bt(i);
    const hit = (i) => now[i] && !prev[i];
    if (hit(1)) ui.keys.Enter = 'pressed';
    if (hit(9)) ui.keys.Escape = 'pressed';
    if (hit(0)) { if (ui.dialog) ui.keys[' '] = 'pressed'; else if (ui.modal) ui.keys.Escape = 'pressed'; }
    for (const [i, key] of [[12, 'ArrowUp'], [13, 'ArrowDown'], [14, 'ArrowLeft'], [15, 'ArrowRight']]) if (now[i] !== !!prev[i]) { kd[key] = now[i]; if (now[i]) ui.keys[key] = 'pressed'; }
    if (hit(6) || hit(10) || hit(11)) this.recentre();
    this.pad = { lx, ly, mag: lm, rx, ry, run: now[0] && !ui.dialog, l: now[4], r: now[5] };
    this.padPrev = now;
  }
  // ---------------------------------------------------------------- per frame
  update(dt) {
    this.gamepad();
    const a = this.player; if (!a) return;
    const p = a.g.position;
    // how fast the player really moves (keys, tap-to-walk paths and cutscene walks alike)
    if (this.last && dt > 0) { const ex = (p.x - this.last.x) / dt, ez = (p.z - this.last.z) / dt, ok = Math.hypot(ex, ez) < 12, k = kexp(dt, 10); this.pvx += ((ok ? ex : 0) - this.pvx) * k; this.pvz += ((ok ? ez : 0) - this.pvz) * k; }
    this.last = { x: p.x, z: p.z };
    this.pointers();
    this.move(dt, a, p);
    if (a.path) this.L = this.nav.levelAt(p.x, p.z, p.y);
    this.inside = this.nav.buildingAt(p.x, p.z, this.L);
    this.camera(dt, p);
    this.cutaway(dt, p);
    this.doors(dt, p);
    this.partner(dt);
    this.interactions(p);
    this.zones(p);
    this.c.update(dt, this.app.t);
  }
  move(dt, a, p) {
    if (!this.vx && !this.vz) this.spd = 0;                         // somebody stopped us (a story beat, use())
    let ts = 0, td = this.head, run = false;
    if (this.active()) {
      const I = this.input(); run = I.run;
      if (I.mag > 0.1) {
        // the input is read against the camera's heading when you set off; it stays put while you hold the same
        // direction, so the camera easing round behind you doesn't bend your path (turning it yourself does)
        const ang = Math.atan2(I.x, -I.y);
        if (this.frameYaw === null || this.orbiting || Math.abs(wrapR(ang - this.inAng)) > 0.42) { this.frameYaw = this.cyaw; this.inAng = ang; }
        const yr = this.frameYaw * D2R, fx = -Math.sin(yr), fz = -Math.cos(yr), rx = Math.cos(yr), rz = -Math.sin(yr);
        td = Math.atan2(rx * I.x - fx * I.y, rz * I.x - fz * I.y); ts = (run ? RUN : WALK) * Math.max(0.35, I.mag);
        if (a.path) { a.path = null; a.arrive = null; }
      } else this.frameYaw = null;
    } else this.frameYaw = null;
    if (ts > 0) {
      if (this.spd < 0.4) this.head = td;                           // from a standstill: off the way you push
      else { const d = wrapR(td - this.head), tr = (this.spd > WALK + 0.3 ? TURN_RUN : TURN) * dt; this.head = wrapR(this.head + clamp(d, -tr, tr)); }
      const want = ts * (0.25 + 0.75 * Math.max(0, Math.cos(wrapR(td - this.head))));   // ease off through a sharp turn
      this.spd = want > this.spd ? Math.min(want, this.spd + (this.spd < WALK ? ACC : ACC_RUN) * dt) : Math.max(want, this.spd - DEC * dt);
    } else this.spd = Math.max(0, this.spd - DEC * dt);
    this.vx = Math.sin(this.head) * this.spd; this.vz = Math.cos(this.head) * this.spd;
    if (this.spd > 0.05 && !a.path) {
      const r = this.nav.move(p.x, p.z, this.vx * dt, this.vz * dt, this.L, R);
      const moved = Math.hypot(r.x - p.x, r.z - p.z);
      p.x = r.x; p.z = r.z; p.y += (r.y - p.y) * (1 - Math.exp(-dt * 20)); this.L = r.L;
      if (r.hit && moved < this.spd * dt * 0.2) { this.spd *= 0.5; this.vx *= 0.5; this.vz *= 0.5; }
      a.targetYaw = this.head;
      if (!this.moving && a.anim.play && !(a.m && a.m.animator)) a.play(run ? 'run' : 'walk', { fade: 0.12 });
      this.moving = true;
      // footsteps by surface
      this.stepD += moved;
      if (this.stepD > (this.spd > 3.2 ? 0.62 : 0.44)) { this.stepD = 0; const au = this.app.audio; if (au && au.sfx) au.sfx(this.stepKind(p), { vol: this.spd > 3.2 ? 1 : 0.75, pitch: 0.94 + Math.random() * 0.12 }); }
    } else if (this.moving) { this.moving = false; if (!(a.m && a.m.animator)) a.play(a.idleClip || 'idle', { fade: 0.2 }); }
  }
  stepKind(p) {
    const b = this.nav.buildingAt(p.x, p.z, this.L);
    if (b >= 0) return (this.c.buildings[b].o.step) || 'step_wood';
    const z = this.zone; return (z && z.step) || 'step_concrete';
  }
  // ---------------------------------------------------------------- camera
  camera(dt, p) {
    const w = this.w, c = w.cam, app = this.app, st = w.st, battle = !!(app.battle && app.battle.active);
    // a cutscene that set a shot keeps the camera until its story beat is over
    if (w.camHeld && w.free && !w.tween && !battle && !app.story.busy && !app.ui.dialog) w.camHeld = false;
    const follow = !!(w.free && !w.tween && !w.camHeld && !battle);
    this.zoom += (this.zoomT - this.zoom) * kexp(dt, 8);
    this.steer(dt);
    if (follow) { if (!this.following) this.beginFollow(p); this.follow(dt, p); }
    else if (battle && c.fov !== undefined) c.fov += ((st.baseFov || 30) - c.fov) * kexp(dt, 4);
    this.following = follow;
    // the sun's shadow box follows what the camera sees (the city is too big for one shadow map)
    if (st.followShadow) { const yr = c.yaw * D2R, off = 13 * Math.cos(c.pitch * D2R); st.followShadow(_s.set(c.target.x - Math.sin(yr) * off, 0, c.target.z - Math.cos(yr) * off), 40); }
  }
  // camera keys and sticks: Q / E (E only when there is nothing to talk to), L / R, the right stick; C recentres; + / - zoom
  steer(dt) {
    this.orbiting = false; this.manualT = Math.max(0, this.manualT - dt);
    const k = this.app.keysDown, ui = this.app.ui;
    if (!k.e) this.eLatch = false;
    if (!this.active()) return;
    if (ui.key('e') && this.near) this.eLatch = true;
    const G = this.pad;
    const turn = (k.q ? 1 : 0) - (k.e && !this.eLatch ? 1 : 0) + (G ? (G.l ? 1 : 0) - (G.r ? 1 : 0) - G.rx : 0), tilt = G ? G.ry : 0;
    if (turn || tilt) { this.yaw += turn * 115 * dt; this.pitchOff = clamp(this.pitchOff + tilt * 60 * dt, -12, 28); this.manualT = 2.2; this.orbiting = true; }
    if (ui.key('c')) this.recentre();
    if (ui.key('=') || ui.key('+')) this.zoomT = clamp(this.zoomT / 1.15, ZMIN, ZMAX);
    if (ui.key('-')) this.zoomT = clamp(this.zoomT * 1.15, ZMIN, ZMAX);
  }
  beginFollow(p) {
    const c = this.w.cam, a = this.player, P = this.preset(), behind = a.yaw / D2R + 180;
    const from = { t: c.target.clone(), dist: c.dist, yaw: c.yaw, pitch: c.pitch, fov: c.fov ?? (this.w.st.baseFov || 30) };
    // keep looking the way the last shot looked, unless that faces the player: then swing round behind them
    this.yaw = this.cyaw = this.snapNext || Math.abs(wrapD(c.yaw - behind)) > 100 ? c.yaw + wrapD(behind - c.yaw) : c.yaw;
    this.fh = P.h; this.fdb = P.dist; this.fpb = P.pitch; this.ffov = P.fov; this.camLead.x = this.camLead.z = 0;
    this.ft.set(p.x, p.y + P.h, p.z); this.fd = P.dist * this.zoom; this.fp = P.pitch + (this.zoom - 1) * 14 + this.pitchOff;
    this.blend = this.snapNext ? null : { from, t: 0, dur: this.blendDur || 0.9 };
    this.snapNext = false; this.blendDur = 0.9; this.manualT = 0;
  }
  follow(dt, p) {
    const c = this.w.cam, P = this.preset(), inn = this.inside >= 0, sp = Math.hypot(this.pvx, this.pvz);
    // ease round behind the walking direction while you head away from the camera (not while you turn it yourself)
    if (sp > 0.6 && this.manualT <= 0) {
      const d = wrapD(Math.atan2(this.pvx, this.pvz) / D2R + 180 - this.yaw), ad = Math.abs(d), wt = ad < 70 ? 1 : ad < 115 ? (115 - ad) / 45 : 0;
      this.yaw += d * kexp(dt, (inn ? 0.5 : 1.1) * wt * Math.min(1, sp / WALK));
    }
    this.cyaw += (this.yaw - this.cyaw) * kexp(dt, 12);
    // outdoors ↔ indoors framing
    const kp = kexp(dt, 3);
    this.fh += (P.h - this.fh) * kp; this.fdb += (P.dist - this.fdb) * kp; this.fpb += (P.pitch - this.fpb) * kp; this.ffov += (P.fov - this.ffov) * kp;
    // look at the player, a little ahead of where they're going
    const kl = kexp(dt, 2.5); this.camLead.x += (this.pvx * P.lead - this.camLead.x) * kl; this.camLead.z += (this.pvz * P.lead - this.camLead.z) * kl;
    const kt = kexp(dt, 10); this.ft.x += (p.x + this.camLead.x - this.ft.x) * kt; this.ft.z += (p.z + this.camLead.z - this.ft.z) * kt; this.ft.y += (p.y + this.fh - this.ft.y) * kexp(dt, 6);
    // distance and pitch; outdoors the camera pulls in in front of a building that gets in the way (fast in, slow out)
    const dist = this.fdb * this.zoom, pitch = clamp(this.fpb + (this.zoom - 1) * 14 + this.pitchOff, 6, 72);
    let want = dist;
    if (!inn) { const t = this.cast(this.ft, this.cyaw * D2R, pitch * D2R, dist + 0.5); if (t < dist + 0.4) want = Math.max(MIN_D, t - 0.4); }
    this.fd = want < this.fd ? want + (this.fd - want) * Math.exp(-dt * 30) : this.fd + (want - this.fd) * kexp(dt, 2);
    const pull = clamp(1 - this.fd / dist, 0, 1);
    this.fp += (pitch + pull * 14 - this.fp) * kexp(dt, 6);
    const b = this.blend;
    if (b) {
      b.t += dt; const k = ease(Math.min(1, b.t / b.dur));
      c.target.lerpVectors(b.from.t, this.ft, k); c.dist = b.from.dist + (this.fd - b.from.dist) * k; c.yaw = b.from.yaw + wrapD(this.cyaw - b.from.yaw) * k;
      c.pitch = b.from.pitch + (this.fp - b.from.pitch) * k; c.fov = b.from.fov + (this.ffov - b.from.fov) * k;
      if (b.t >= b.dur) this.blend = null;
    } else { c.target.copy(this.ft); c.dist = this.fd; c.yaw = this.cyaw; c.pitch = this.fp; c.fov = this.ffov; }
  }
  /** distance from f along the camera ray (yaw, pitch in radians) to the first solid building, up to maxD */
  cast(f, yr, pr, maxD) {
    const dx = Math.sin(yr) * Math.cos(pr), dy = Math.sin(pr), dz = Math.cos(yr) * Math.cos(pr);
    let best = maxD;
    for (const B of this.c.buildings) {
      if (!B.solid || B.id === this.inside) continue;
      const x0 = B.x - 0.15, x1 = B.x + B.w + 0.15, z0 = B.z - 0.15, z1 = B.z + B.d + 0.15;
      if (f.x > x0 && f.x < x1 && f.z > z0 && f.z < z1 && f.y < B.ctop) continue;        // standing in its doorway
      const t = rayBox(f.x, f.y, f.z, dx, dy, dz, x0, -1, z0, x1, B.ctop, z1, best);
      if (t < best) best = t;
    }
    return best;
  }
  /** where the camera is (from the world's camera state; the stage renders it next) */
  camPos(out) { const c = this.w.cam, yr = c.yaw * D2R, pr = c.pitch * D2R, cp = Math.cos(pr); return out.set(c.target.x + Math.sin(yr) * cp * c.dist, c.target.y + Math.sin(pr) * c.dist, c.target.z + Math.cos(yr) * cp * c.dist); }
  // ---------------------------------------------------------------- cutaway
  cutaway(dt, p) {
    const inside = this.inside, L = this.L, cam = this.camPos(_s), t = this.w.cam.target;
    // what must stay in view: the player head to toe (unless a cutscene looks elsewhere), and whatever the camera looks at
    const pts = Math.hypot(p.x - t.x, p.z - t.z) < 12 ? [[p.x, p.y + 1.6, p.z], [p.x, p.y + 0.9, p.z], [t.x, t.y, t.z]] : [[t.x, t.y, t.z]];
    if (this.cutB !== inside) { const P = this.c.buildings[this.cutB]; if (P && P.cut) uncut(P, this.c.doors); this.cutB = inside; }
    for (const B of this.c.buildings) {
      if (!B.groups) continue;
      if (B.id === inside) {
        if (B.roofG) B.roofG.visible = false;
        // walked in while it was faded (you stood behind it): make it solid again
        if ((B.fade ?? 1) < 1 || (B.fA ?? 1) < 1) { if (B.roofG) alpha(B.roofG, 1); B.groups.forEach((G) => { alpha(G.front, 1); alpha(G.back, 1); alpha(G.in, 1); }); if (B.roofG) B.roofG.visible = false; }
        B.fade = B.fA = 1;
        B.groups.forEach((G, k) => { const show = k <= L; vis(G.back, show); vis(G.in, show); vis(G.front, show); });
        this.cut(B, L, cam, pts);
        continue;
      }
      if (B.roofG) B.roofG.visible = true;
      B.groups.forEach((G) => { vis(G.back, true); vis(G.in, true); vis(G.front, true); });
      // standing between the camera and the player (or the camera inside it)? fade it out
      const x0 = B.x - 0.1, x1 = B.x + B.w + 0.1, z0 = B.z - 0.1, z1 = B.z + B.d + 0.1;
      let occ = false;
      for (const q of pts) if (rayBox(cam.x, cam.y, cam.z, q[0] - cam.x, q[1] - cam.y, q[2] - cam.z, x0, -1, z0, x1, B.ftop, z1, 1) < 1) { occ = true; break; }
      const want = occ ? 0.16 : 1;
      B.fade = (B.fade ?? 1) + (want - (B.fade ?? 1)) * kexp(dt, 8);
      if (B.fade > 0.995) B.fade = 1;
      const f = B.fade;
      if (Math.abs(f - (B.fA ?? 1)) < 0.004) continue;
      B.fA = f;
      if (B.roofG) alpha(B.roofG, f);
      B.groups.forEach((G) => { alpha(G.front, f); alpha(G.back, f); alpha(G.in, f); });
    }
  }
  /** cut open the storey you stand on: the outer walls on the camera's side and any inner wall between camera and you */
  cut(B, L, cam, pts) {
    if (!B.cut) splitBuilding(B);
    if (B.cutL !== L) { uncut(B, this.c.doors); B.cutL = L; }
    const S = B.cut[L]; if (!S) return;
    const hide = { s: cam.z > B.z + B.d - 0.3, n: cam.z < B.z + 0.3, e: cam.x > B.x + B.w - 0.3, w: cam.x < B.x + 0.3 };
    for (const sd in S.sides) for (const m of S.sides[sd]) m.visible = !hide[sd];
    // the hidden walls stop casting shadows too (as the whole group did before)
    if (S.proxy.front) S.proxy.front.castShadow = !(hide.s || hide.e);
    if (S.proxy.back) S.proxy.back.castShadow = !(hide.n || hide.w);
    for (const W of S.walls) { const h = blocks(W, cam, pts); if (h !== W.hidden) { W.hidden = h; for (const m of W.meshes) m.visible = !h; } }
    for (const D of this.c.doors) if (D.building === B.id && D.pivot && (D.L || 0) === L && D.side) D.pivot.visible = !hide[D.side];
  }
  // ---------------------------------------------------------------- doors
  doors(dt, p) {
    const actors = [...this.w.actors.values()];
    for (const D of this.c.doors) {
      if (!D.pivot) continue;
      let want = 0;
      if (!D.locked) for (const a of actors) { const q = a.g.position; if (Math.abs(q.y - D.y) < 1.5 && Math.hypot(q.x - D.x, q.z - D.z) < 1.5) { want = 1; break; } }
      if (want !== D.want) { D.want = want; const au = this.app.audio; if (D.sfx && au && au.sfx && Math.hypot(p.x - D.x, p.z - D.z) < 8) au.sfx(want ? 'door' : 'door_close', { vol: 0.5 }); }
      D.open += (want - D.open) * (1 - Math.exp(-dt * (want ? 9 : 5)));
      // swing away from the side the player is on
      if (want && D.open < 0.05) D.dir = D.axis === 'x' ? (p.z > D.z ? -1 : 1) : (p.x > D.x ? 1 : -1);
      D.pivot.rotation.y = D.base + (D.dir || 1) * D.swing * D.open * 1.45;
    }
  }
  // the lead Tokonmon trots after you (steered on the grid, warps back in if it gets stuck)
  partner(dt) {
    const b = this.w.partner, a = this.player; if (!b || !a || b.busy || b.path) return;
    const p = a.g.position, q = b.g.position, back = a.yaw + Math.PI, tx = p.x + Math.sin(back) * 1.2 + Math.cos(back) * 0.5, tz = p.z + Math.cos(back) * 1.2 - Math.sin(back) * 0.5;
    const dx = tx - q.x, dz = tz - q.z, d = Math.hypot(dx, dz), L = this.nav.levelAt(q.x, q.z, q.y);
    if (d > 14 || (b.stuck || 0) > 1.6) { q.set(tx, this.nav.ground(tx, tz, this.L), tz); b.stuck = 0; return; }
    if (d < 0.6) { if (b.trot) { b.trot = false; b.play('idle', { fade: 0.2 }); } if (Math.hypot(p.x - q.x, p.z - q.z) < 3) b.face(a); return; }
    const sp = Math.min(d > 3 ? 5.6 : 2.7, d * 2.2), r = this.nav.move(q.x, q.z, (dx / d) * sp * dt, (dz / d) * sp * dt, L, 0.22);
    const moved = Math.hypot(r.x - q.x, r.z - q.z); q.x = r.x; q.z = r.z; q.y += (r.y - q.y) * (1 - Math.exp(-dt * 18));
    b.stuck = moved < sp * dt * 0.3 ? (b.stuck || 0) + dt : 0;
    b.targetYaw = Math.atan2(dx, dz);
    if (!b.trot) { b.trot = true; b.play(b.anim.clips && b.anim.clips.run && sp > 4 ? 'run' : 'walk', { fade: 0.15 }); }
  }
  // ---------------------------------------------------------------- interactions
  interactions(p) {
    if (!this.active()) { this.near = null; return; }
    let best = null, bd = 1e9; const fy = Math.sin(this.player.yaw), fz = Math.cos(this.player.yaw);
    for (const it of this.c.inter) {
      if (it.npc) { const a = this.w.actor(it.npc); if (!a) continue; const q = a.g.position; it.x = q.x; it.z = q.z; it.y = q.y + 1.9; }
      if ((it.L || 0) !== this.L || (it.when && !it.when(this.app))) continue;
      const dx = it.x - p.x, dz = it.z - p.z, d = Math.hypot(dx, dz); if (d > it.r) continue;
      const facing = d > 0.3 ? (dx * fy + dz * fz) / d : 1, score = d - facing * 0.6;
      if (score < bd) { bd = score; best = it; }
    }
    this.near = best;
    const ui = this.app.ui;
    if (best && (ui.key('e') || ui.key('Enter') || ui.key(' ') || ui.key('f'))) this.use(best);
  }
  use(it) {
    const a = this.player; this.vx = this.vz = this.spd = 0;
    if (a) a.faceTo(it.x, it.z);
    this.app.audio.sfx && this.app.audio.sfx('ui_tap');
    this.app.story.run(async () => { await it.act(this.app, it); });
  }
  zones(p) {
    const z = this.nav.zoneAt(p.x, p.z);
    if (z && z !== this.zone) {
      this.zone = z; this.w.zoneName = z.label;
      if (this.app.hud && this.app.hud.showLocation) this.app.hud.showLocation(z.label, z.sub); else this.app.toast(z.label, { icon: 'map', dur: 2 });
      const au = this.app.audio; if (au && au.music && z.music) au.music(z.music, { fade: 2 }); if (au && au.bed) au.bed(this.w.mood === 'night' ? 'cicadas' : z.bed || null);
    }
  }
  // ---------------------------------------------------------------- UI: prompt, thumbstick, minimap
  drawUI(ui) {
    if (this.near && this.active()) {
      const it = this.near, s = this.w.project([it.x, it.y + 0.35, it.z]);
      if (s.vis) {
        const label = it.label || 'Examine', x = Math.round(s.x), y = Math.round(s.y) - 8, key = this.pad ? 'A' : 'E';
        let tapped = false;
        if (ui.prompt) tapped = ui.prompt(x, y, key, label, { icon: it.icon });
        else { const w = ui.tw(label) + 26; ui.panel(x - w / 2, y - 8, w, 15, {}); ui.rrect(x - w / 2 + 3, y - 5, 10, 9, '#f4ecdc', 2); ui.text(key, x - w / 2 + 6, y - 3, '#2a1a32'); ui.text(label, x - w / 2 + 17, y - 4); tapped = ui.ptr.released && ui.inside(x - w / 2, y - 8, w, 15); }
        if (tapped) { ui.ptr.released = false; this.use(it); }
      }
    }
    const J = this.joyP;
    if (J && J.moved) {
      if (ui.joystick) ui.joystick(J.sx, J.sy, 26, J.dx, J.dy, true);
      else { for (let a = 0; a < 6.28; a += 0.2) ui.px(Math.round(J.sx + Math.cos(a) * 26), Math.round(J.sy + Math.sin(a) * 26), '#f4ecdc'); ui.rrect(Math.round(J.sx + J.dx * 26) - 6, Math.round(J.sy + J.dy * 26) - 6, 12, 12, '#f4ecdc', 5); }
    } else if (this.touch && ui.joystick && this.active() && !this.pad) ui.joystick(34, ui.h - 74, 20, 0, 0, false, { ghost: true });   // where to put your thumb
  }
  /** the minimap: a 1 px = 1 m picture of the city around the player, turned so the camera looks up (called by the HUD) */
  drawMinimap(ui, x0, y0, w, h) {
    const mm = this.c.minimap; if (!mm || !this.player) return;
    const p = this.player.g.position, S = this.mmScale || 1, yr = this.mapYaw();
    const rx = Math.cos(yr), rz = -Math.sin(yr), fx = -Math.sin(yr), fz = -Math.cos(yr);
    for (let j = 0; j < h; j++) {
      const dj = (j + 0.5 - h / 2) * S;
      for (let i = 0; i < w; i++) {
        const di = (i + 0.5 - w / 2) * S, mx = Math.floor(p.x + rx * di - fx * dj), mz = Math.floor(p.z + rz * di - fz * dj);
        ui.px(x0 + i, y0 + j, mx < 0 || mz < 0 || mx >= mm.w || mz >= mm.h ? '#1a1226' : mm.col[mz * mm.w + mx]);
      }
    }
    const toMap = (wx, wz) => { const dx = wx - p.x, dz = wz - p.z; return [Math.round(w / 2 + (dx * rx + dz * rz) / S), Math.round(h / 2 - (dx * fx + dz * fz) / S)]; };
    for (const it of this.c.inter) if (it.mm) { const [ix, iz] = toMap(it.x, it.z); if (ix >= 1 && iz >= 1 && ix < w - 1 && iz < h - 1) { ui.px(x0 + ix, y0 + iz, '#ffcc2e'); ui.px(x0 + ix + 1, y0 + iz, '#ffcc2e'); } }
    // the story's objective: a dot, held at the rim when it's off the map
    const g = this.app.story && this.app.story.goal;
    if (g) { let [gx, gz] = toMap(g.x, g.z); const cx = w / 2, cz = h / 2, ex = gx - cx, ez = gz - cz, k = Math.min(1, (cx - 3) / Math.max(1e-3, Math.abs(ex)), (cz - 3) / Math.max(1e-3, Math.abs(ez))); gx = Math.round(cx + ex * k); gz = Math.round(cz + ez * k); const blink = ((this.app.t * 3) | 0) % 2; for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) ui.px(x0 + gx + u - 1, y0 + gz + v - 1, blink ? '#ff5a64' : '#ffffff'); }
    // the player arrow, pointing the way they face relative to the camera
    const ax = x0 + Math.round(w / 2), ay = y0 + Math.round(h / 2), sy = Math.sin(this.player.yaw), cy = Math.cos(this.player.yaw), hx = sy * rx + cy * rz, hy = -(sy * fx + cy * fz);
    for (let t = -2; t <= 3; t++) ui.px(Math.round(ax + hx * t), Math.round(ay + hy * t), t > 1 ? '#ffffff' : '#e8473a');
    ui.px(ax, ay, '#ffffff');
  }
}
function vis(g, v) { if (g) g.visible = v; }
function alpha(g, a) {
  if (!g) return;
  g.visible = true;
  for (const m of g.children) {
    if (m.userData.proxy) { m.castShadow = a > 0.6; continue; }      // the group's merged shadow caster
    const mt = m.material; if (!mt) continue;
    const tr = a < 0.98;
    if (mt.transparent !== tr) { mt.transparent = tr; mt.needsUpdate = true; }
    mt.opacity = a; mt.depthWrite = !tr; m.castShadow = (m.userData.cast ?? true) && (!tr || a > 0.6);
  }
}
// ---------------------------------------------------------------- geometry helpers
/** entry distance (in units of the direction vector) of a ray into a box, or Infinity past tmax; 0 when it starts inside */
function rayBox(ox, oy, oz, dx, dy, dz, x0, y0, z0, x1, y1, z1, tmax) {
  let t0 = 0, t1 = tmax;
  const o = [ox, oy, oz], d = [dx, dy, dz], lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (o[i] < lo[i] || o[i] > hi[i]) return Infinity; continue; }
    let a = (lo[i] - o[i]) / d[i], b = (hi[i] - o[i]) / d[i]; if (a > b) { const s = a; a = b; b = s; }
    if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) return Infinity;
  }
  return t0;
}
/** does an inner wall piece stand between the camera and any of the points? */
function blocks(W, cam, pts) {
  const ca = W.axis === 'z' ? cam.z : cam.x;
  for (const q of pts) {
    const qa = W.axis === 'z' ? q[2] : q[0];
    if ((ca - W.c) * (qa - W.c) >= 0) continue;
    const t = (W.c - ca) / (qa - ca), along = W.axis === 'z' ? cam.x + (q[0] - cam.x) * t : cam.z + (q[2] - cam.z) * t, y = cam.y + (q[1] - cam.y) * t;
    if (along > W.a0 - 0.3 && along < W.a1 + 0.3 && y < W.y1 + 0.1 && y > W.y0 - 0.5) return true;
  }
  return false;
}
function uncut(B, doors) {
  if (!B.cut) return;
  for (const S of B.cut) {
    for (const sd in S.sides) for (const m of S.sides[sd]) m.visible = true;
    for (const W of S.walls) { W.hidden = false; for (const m of W.meshes) m.visible = true; }
    if (S.proxy.front) S.proxy.front.castShadow = true; if (S.proxy.back) S.proxy.back.castShadow = true;
  }
  for (const D of doors) if (D.building === B.id && D.pivot) D.pivot.visible = true;
}
/**
 * Split a building's storey groups into pieces the cutaway can hide one at a time, the first time you step
 * inside: the outer walls by side (s, e, n, w; with whatever hangs on their inner faces) and every wall-high
 * vertical plane inside (the inner walls, with their end and top caps). The pieces share the original vertex
 * buffers; only the index is new. B.cut[k] = { sides: { s: [meshes], … }, walls: [{ axis, c, a0, a1, y0, y1, meshes }], proxy }
 */
function splitBuilding(B) {
  const xw = B.x, xe = B.x + B.w, zn = B.z, zs = B.z + B.d;
  B.cut = B.groups.map((G, k) => {
    const S = { sides: { s: [], e: [], n: [], w: [] }, walls: [], proxy: {} }, y0 = k * FH;
    for (const part of ['front', 'back']) {
      const grp = G[part]; if (!grp) continue;
      S.proxy[part] = grp.children.find((m) => m.userData.proxy) || null;
      for (const m of meshesOf(grp)) {
        const keys = tris(m).map((T) => part === 'front' ? (Math.abs(T.cz - zs) <= Math.abs(T.cx - xe) ? 's' : 'e') : (Math.abs(T.cz - zn) <= Math.abs(T.cx - xw) ? 'n' : 'w'));
        for (const [key, mesh] of splitMesh(m, keys)) S.sides[key].push(mesh);
      }
    }
    const grp = G.in; if (!grp) return S;
    // the inner group: things on the outer walls' inner faces go with their side; vertical planes become wall candidates
    const items = [];
    for (const m of meshesOf(grp)) {
      const T = tris(m), keys = new Array(T.length).fill('rest');
      T.forEach((t, i) => {
        const vert = Math.abs(t.ny) < 0.25, high = t.y1 > y0 + 1.2;
        if (vert && Math.abs(t.nz) > 0.7) {
          if (high && Math.abs(t.cz - zn) < 0.3) keys[i] = 'n'; else if (high && Math.abs(t.cz - zs) < 0.3) keys[i] = 's';
          else items.push({ m, i, axis: 'z', c: t.cz, a0: t.x0, a1: t.x1, y0: t.y0, y1: t.y1 });
        } else if (vert && Math.abs(t.nx) > 0.7) {
          if (high && Math.abs(t.cx - xw) < 0.3) keys[i] = 'w'; else if (high && Math.abs(t.cx - xe) < 0.3) keys[i] = 'e';
          else items.push({ m, i, axis: 'x', c: t.cx, a0: t.z0, a1: t.z1, y0: t.y0, y1: t.y1 });
        } else if (Math.abs(t.ny) > 0.7 && t.cy > y0 + 2 && Math.min(t.x1 - t.x0, t.z1 - t.z0) < 0.3) items.push({ m, i, top: true, t });
      });
      m.userData.keys = keys;
    }
    // planes → runs along each plane (pieces of wall), then the small bits (end caps, tops) join the wall they cap
    const runs = [];
    for (const axis of ['z', 'x']) {
      const L = items.filter((it) => it.axis === axis).sort((a, b) => a.c - b.c);
      for (let i = 0; i < L.length;) {
        let j = i; const c0 = L[i].c; while (j < L.length && L[j].c - c0 < 0.3) j++;
        const plane = L.slice(i, j).sort((a, b) => a.a0 - b.a0);
        let run = null;
        for (const it of plane) {
          if (run && it.a0 <= run.a1 + 0.12) { run.a1 = Math.max(run.a1, it.a1); run.y0 = Math.min(run.y0, it.y0); run.y1 = Math.max(run.y1, it.y1); run.items.push(it); run.cs += it.c; }
          else { run = { axis, a0: it.a0, a1: it.a1, y0: it.y0, y1: it.y1, items: [it], cs: it.c }; runs.push(run); }
        }
        i = j;
      }
    }
    for (const r of runs) r.c = r.cs / r.items.length;
    const walls = runs.filter((r) => r.y1 - r.y0 >= 2.0 && r.y1 > y0 + 2.2 && r.a1 - r.a0 >= 0.5);
    const owner = (axis, c, a, tol) => walls.find((W) => W.axis === axis && Math.abs(W.c - c) < tol && a > W.a0 - 0.12 && a < W.a1 + 0.12);
    for (const r of runs) if (!walls.includes(r) && r.a1 - r.a0 < 0.35) { const W = owner(r.axis === 'z' ? 'x' : 'z', (r.a0 + r.a1) / 2, r.c, 0.2); if (W) W.items.push(...r.items); }
    for (const it of items) if (it.top) { const t = it.t, thinZ = t.z1 - t.z0 < t.x1 - t.x0, W = thinZ ? owner('z', t.cz, t.cx, 0.2) : owner('x', t.cx, t.cz, 0.2); if (W) W.items.push(it); }
    walls.forEach((W, n) => { for (const it of W.items) it.m.userData.keys[it.i] = 'W' + n; W.meshes = []; });
    for (const m of meshesOf(grp)) {
      const keys = m.userData.keys; delete m.userData.keys;
      for (const [key, mesh] of splitMesh(m, keys)) {
        if (key === 'rest') continue;
        if (key.length === 1) S.sides[key].push(mesh); else walls[+key.slice(1)].meshes.push(mesh);
      }
    }
    S.walls = walls.map((W) => ({ axis: W.axis, c: W.c, a0: W.a0, a1: W.a1, y0: W.y0, y1: W.y1, meshes: W.meshes, hidden: false }));
    return S;
  });
}
function meshesOf(grp) { return grp.children.filter((m) => m.isMesh && !m.userData.proxy && m.geometry && m.geometry.index); }
/** per triangle: centroid, face normal and bounds */
function tris(m) {
  const P = m.geometry.attributes.position.array, I = m.geometry.index.array, out = [];
  for (let i = 0; i < I.length; i += 3) {
    const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    out.push({ cx: (P[a] + P[b] + P[c]) / 3, cy: (P[a + 1] + P[b + 1] + P[c + 1]) / 3, cz: (P[a + 2] + P[b + 2] + P[c + 2]) / 3, nx, ny, nz,
      x0: Math.min(P[a], P[b], P[c]), x1: Math.max(P[a], P[b], P[c]), y0: Math.min(P[a + 1], P[b + 1], P[c + 1]), y1: Math.max(P[a + 1], P[b + 1], P[c + 1]), z0: Math.min(P[a + 2], P[b + 2], P[c + 2]), z1: Math.max(P[a + 2], P[b + 2], P[c + 2]) });
  }
  return out;
}
/** split a mesh's triangles by key → Map(key → mesh); the original mesh keeps the first key's (or 'rest') triangles */
function splitMesh(m, keys) {
  const I = m.geometry.index.array, by = new Map();
  keys.forEach((k, t) => { let a = by.get(k); if (!a) by.set(k, (a = [])); a.push(I[t * 3], I[t * 3 + 1], I[t * 3 + 2]); });
  const out = new Map();
  if (by.size <= 1) { if (keys.length) out.set(keys[0], m); return out; }
  const keep = by.has('rest') ? 'rest' : by.keys().next().value, g = m.geometry;
  for (const [k, list] of by) {
    const idx = new THREE.BufferAttribute(new I.constructor(list), 1);
    if (k === keep) { g.setIndex(idx); out.set(k, m); continue; }
    const ng = new THREE.BufferGeometry();
    for (const name in g.attributes) ng.setAttribute(name, g.attributes[name]);
    ng.setIndex(idx); ng.boundingSphere = g.boundingSphere ? g.boundingSphere.clone() : null;
    const nm = new THREE.Mesh(ng, m.material);
    nm.castShadow = m.castShadow; nm.receiveShadow = m.receiveShadow; nm.renderOrder = m.renderOrder; nm.userData = { ...m.userData, piece: k };
    m.parent.add(nm); out.set(k, nm);
  }
  return out;
}
