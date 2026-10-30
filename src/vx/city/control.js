// Walking the city, top-down survival-game style: you steer the player directly (WASD / arrows,
// Shift to run, or a touch thumbstick), they accelerate and turn smoothly and slide along walls. An
// isometric camera trails a little ahead of where you are heading (mouse wheel / pinch zooms).
// Inside a building its roof and the storeys above you vanish and the walls facing the camera are cut
// away; buildings standing between the camera and you fade out. Doors swing open as you come near.
// Interactables nearby show a prompt ([E] / tap) and run their act(). Zones set the place name and music.
import * as THREE from '../../../vendor/three.module.js';

const WALK = 2.4, RUN = 4.9, ACC = 12, DEC = 14, R = 0.26;
const _v = new THREE.Vector3();

export class CityControl {
  constructor(world, city) {
    this.w = world; this.app = world.app; this.c = city; this.nav = city.nav;
    this.L = 0; this.vx = 0; this.vz = 0; this.yaw = 45; this.pitch = 40; this.zoom = 1; this.zoomT = 1;
    this.joy = null; this.near = null; this.inside = -1; this.zone = null; this.stepD = 0; this.moving = false; this.camLead = { x: 0, z: 0 };
    this.mm = null;
    this.onWheel = (e) => { if (!this.active()) return; this.zoomT = Math.max(0.55, Math.min(1.8, this.zoomT * (e.deltaY > 0 ? 1.1 : 0.9))); };
    addEventListener('wheel', this.onWheel, { passive: true });
  }
  dispose() { removeEventListener('wheel', this.onWheel); }
  get player() { return this.w.player; }
  active() { return this.w.free && this.player && !this.blocked(); }
  blocked() { const a = this.app; return !!(a.ui.dialog || a.ui.modal || a.story.busy || (a.phone && a.phone.open) || (a.battle && a.battle.active) || (a.hud && a.hud.menuOpen) || a._travelling); }
  /** place the player (and work out which storey they stand on) */
  placed() { const p = this.player.g.position; this.L = this.nav.levelAt(p.x, p.z, p.y); }
  // ---------------------------------------------------------------- input
  input() {
    const k = this.app.keysDown, ui = this.app.ui;
    let x = (k.d || k.ArrowRight ? 1 : 0) - (k.a || k.ArrowLeft ? 1 : 0), y = (k.s || k.ArrowDown ? 1 : 0) - (k.w || k.ArrowUp ? 1 : 0), run = !!(k.Shift || k.shift);
    // touch thumbstick: press on the left half of the screen and drag
    const P = ui.ptr;
    if (P.pressed && !this.joy && P.x < this.app.vw * 0.5 && P.y > 30 && !this.overUI(P)) this.joy = { cx: P.x, cy: P.y, dx: 0, dy: 0, moved: false };
    if (this.joy) {
      if (!P.down) { if (this.joy.moved) P.released = false; this.joy = null; }
      else { const R0 = 26, dx = P.x - this.joy.cx, dy = P.y - this.joy.cy, d = Math.hypot(dx, dy); if (d > 4) this.joy.moved = true; const m = Math.min(1, d / R0); this.joy.dx = d ? (dx / d) * m : 0; this.joy.dy = d ? (dy / d) * m : 0; if (this.joy.moved) { x = this.joy.dx; y = this.joy.dy; run = run || m > 0.92; } }
    }
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    return { x, y, run, mag: Math.min(1, m) };
  }
  overUI(P) { return P.y > this.app.vh - 52 && P.x > this.app.vw - 80; }
  // ---------------------------------------------------------------- per frame
  update(dt) {
    const a = this.player; if (!a) return;
    const p = a.g.position, yr = (this.yaw * Math.PI) / 180;
    // screen axes on the ground: up (away from the camera) and right
    const fx = -Math.sin(yr), fz = -Math.cos(yr), rx = Math.cos(yr), rz = -Math.sin(yr);
    let tx = 0, tz = 0, run = false;
    if (this.active()) {
      const I = this.input(); run = I.run;
      const sp = (run ? RUN : WALK) * (I.mag > 0 ? Math.max(0.35, I.mag) : 0);
      tx = (rx * I.x - fx * I.y) * sp; tz = (rz * I.x - fz * I.y) * sp;
      if (I.mag > 0 && a.path) { a.path = null; a.arrive = null; }
    } else this.joy = null;
    const kk = 1 - Math.exp(-dt * (tx || tz ? ACC : DEC));
    this.vx += (tx - this.vx) * kk; this.vz += (tz - this.vz) * kk;
    const spd = Math.hypot(this.vx, this.vz);
    if (spd > 0.05 && !a.path) {
      const r = this.nav.move(p.x, p.z, this.vx * dt, this.vz * dt, this.L, R);
      const moved = Math.hypot(r.x - p.x, r.z - p.z);
      p.x = r.x; p.z = r.z; p.y += (r.y - p.y) * (1 - Math.exp(-dt * 20)); this.L = r.L;
      if (r.hit && moved < spd * dt * 0.2) { this.vx *= 0.5; this.vz *= 0.5; }
      a.targetYaw = Math.atan2(this.vx, this.vz);
      if (!this.moving && a.anim.play && !(a.m && a.m.animator)) a.play(run ? 'run' : 'walk', { fade: 0.12 });
      this.moving = true;
      // footsteps by surface
      this.stepD += moved;
      if (this.stepD > (spd > 3.2 ? 0.62 : 0.44)) { this.stepD = 0; const au = this.app.audio; if (au && au.sfx) au.sfx(this.stepKind(p), { vol: spd > 3.2 ? 1 : 0.75, pitch: 0.94 + Math.random() * 0.12 }); }
    } else if (this.moving) { this.moving = false; if (!(a.m && a.m.animator)) a.play(a.idleClip || 'idle', { fade: 0.2 }); }
    if (a.path) this.L = this.nav.levelAt(p.x, p.z, p.y);
    this.camera(dt, p);
    this.cutaway(dt, p);
    this.doors(dt, p);
    this.partner(dt);
    this.interactions(p);
    this.zones(p);
    this.c.update(dt, this.app.t);
  }
  stepKind(p) {
    const b = this.nav.buildingAt(p.x, p.z, this.L);
    if (b >= 0) return (this.c.buildings[b].o.step) || 'step_wood';
    const z = this.zone; return (z && z.step) || 'step_concrete';
  }
  camera(dt, p) {
    const c = this.w.cam, k = 1 - Math.exp(-dt * 4.5), lead = 0.45;
    this.camLead.x += (this.vx * lead - this.camLead.x) * (1 - Math.exp(-dt * 2.5)); this.camLead.z += (this.vz * lead - this.camLead.z) * (1 - Math.exp(-dt * 2.5));
    this.zoom += (this.zoomT - this.zoom) * (1 - Math.exp(-dt * 8));
    if (!this.w.tween && this.w.free) {
      c.target.x += (p.x + this.camLead.x - c.target.x) * k; c.target.y += (p.y + 1.0 - c.target.y) * k; c.target.z += (p.z + this.camLead.z - c.target.z) * k;
      c.yaw += (this.yaw - c.yaw) * k; c.pitch += (this.pitch - c.pitch) * k; c.dist += (30 * this.zoom - c.dist) * k;
    }
    // the sun's shadow box follows the camera target (the city is too big for one shadow map)
    const st = this.w.st;
    if (st.followShadow) st.followShadow(c.target, 34 * Math.max(1, this.zoom));
  }
  // ---------------------------------------------------------------- cutaway
  cutaway(dt, p) {
    const inside = this.nav.buildingAt(p.x, p.z, this.L), L = this.L, cot = 1 / Math.tan((this.pitch * Math.PI) / 180);
    this.inside = inside;
    for (const B of this.c.buildings) {
      if (!B.groups) continue;
      if (B.id === inside) {
        if (B.roofG) B.roofG.visible = false;
        B.groups.forEach((G, k) => { const show = k <= L; vis(G.back, show); vis(G.in, show); vis(G.front, k < L); });
        // walked in while it was faded (you stood behind it): make it solid again
        if ((B.fade ?? 1) < 1) { if (B.roofG) alpha(B.roofG, 1); B.groups.forEach((G) => { alpha(G.front, 1); alpha(G.back, 1); alpha(G.in, 1); }); B.groups.forEach((G, k) => { vis(G.back, k <= L); vis(G.in, k <= L); vis(G.front, k < L); }); if (B.roofG) B.roofG.visible = false; }
        B.fade = 1; continue;
      }
      if (B.roofG) B.roofG.visible = true;
      B.groups.forEach((G) => { vis(G.back, true); vis(G.in, true); vis(G.front, true); });
      // standing behind it (north-west, within its shadow toward the camera)? fade the parts in the way
      const D = (B.H + (B.o.roof && B.o.roof.type !== 'flat' ? 2 : 0.5)) * cot * 0.75 + 0.6;
      const behind = p.x > B.x - D && p.x < B.x + B.w + 0.4 && p.z > B.z - D && p.z < B.z + B.d + 0.4 && (p.x - B.x - B.w) + (p.z - B.z - B.d) < -0.2 && !(p.x > B.x + B.w || p.z > B.z + B.d);
      const want = behind && (p.x < B.x || p.z < B.z) ? 0.22 : 1;
      B.fade = (B.fade ?? 1) + (want - (B.fade ?? 1)) * (1 - Math.exp(-dt * 8));
      const f = B.fade;
      if (B.roofG) alpha(B.roofG, f);
      B.groups.forEach((G, k) => { alpha(G.front, f); if (k > 0) { alpha(G.back, f); alpha(G.in, f); } });
    }
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
    const sp = Math.min(d > 3 ? 5.2 : 2.6, d * 2.2), r = this.nav.move(q.x, q.z, (dx / d) * sp * dt, (dz / d) * sp * dt, L, 0.22);
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
    const a = this.player; this.vx = this.vz = 0;
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
        const label = it.label || 'Examine', x = Math.round(s.x), y = Math.round(s.y) - 8;
        let tapped = false;
        if (ui.prompt) tapped = ui.prompt(x, y, 'E', label, { icon: it.icon });
        else { const w = ui.tw(label) + 26; ui.panel(x - w / 2, y - 8, w, 15, {}); ui.rrect(x - w / 2 + 3, y - 5, 10, 9, '#f4ecdc', 2); ui.text('E', x - w / 2 + 6, y - 3, '#2a1a32'); ui.text(label, x - w / 2 + 17, y - 4); tapped = ui.ptr.released && ui.inside(x - w / 2, y - 8, w, 15); }
        if (tapped) { ui.ptr.released = false; this.use(it); }
      }
    }
    if (this.joy && this.joy.moved) {
      if (ui.joystick) ui.joystick(this.joy.cx, this.joy.cy, 26, this.joy.dx, this.joy.dy, true);
      else { for (let a = 0; a < 6.28; a += 0.2) ui.px(Math.round(this.joy.cx + Math.cos(a) * 26), Math.round(this.joy.cy + Math.sin(a) * 26), '#f4ecdc'); ui.rrect(Math.round(this.joy.cx + this.joy.dx * 26) - 6, Math.round(this.joy.cy + this.joy.dy * 26) - 6, 12, 12, '#f4ecdc', 5); }
    }
  }
  /** the minimap: a 1 px = 1 m picture of the city around the player (called by the HUD) */
  drawMinimap(ui, x0, y0, w, h) {
    const mm = this.c.minimap; if (!mm || !this.player) return;
    const p = this.player.g.position, cx = Math.round(p.x), cz = Math.round(p.z), S = this.mmScale || 1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const mx = Math.floor(cx + (i - w / 2) * S), mz = Math.floor(cz + (j - h / 2) * S);
      if (mx < 0 || mz < 0 || mx >= mm.w || mz >= mm.h) { ui.px(x0 + i, y0 + j, '#1a1226'); continue; }
      ui.px(x0 + i, y0 + j, mm.col[mz * mm.w + mx]);
    }
    for (const it of this.c.inter) if (it.mm) { const ix = Math.round((it.x - cx) / S + w / 2), iz = Math.round((it.z - cz) / S + h / 2); if (ix >= 1 && iz >= 1 && ix < w - 1 && iz < h - 1) { ui.px(x0 + ix, y0 + iz, '#ffcc2e'); ui.px(x0 + ix + 1, y0 + iz, '#ffcc2e'); } }
    // the player arrow
    const ax = x0 + Math.round(w / 2), ay = y0 + Math.round(h / 2), yaw = this.player.yaw;
    for (let t = -2; t <= 3; t++) ui.px(Math.round(ax + Math.sin(yaw) * t), Math.round(ay + Math.cos(yaw) * t), t > 1 ? '#ffffff' : '#e8473a');
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
