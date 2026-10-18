// World2D: explore HD-2D maps as your partner Tokonmon (the player is never
// shown — you see the world through your buddy). Tap to walk (A* on the walk
// mask) or use WASD/arrows; walk up to a hotspot and tap its bubble (or press
// Space/E) to talk, eat, read, enter or battle.
import { Actor } from '../scene2d.js';
import { MonSprite, yawOf, bank } from './mon.js';
import { T } from './ui.js';
import { MAPS } from './maps.js';

const CELL = 6;

export class World2D {
  constructor(app) { this.app = app; this.map = null; this.control = true; this.t = 0; this.path = null; this.npcs = []; this.hotNear = null; this.flags = {}; }

  async load(id, spawn = 'start', o = {}) {
    const M = MAPS[id]; if (!M) throw new Error('no map ' + id);
    const app = this.app;
    const built = M.build({ viewW: app.vw, viewH: app.vh, night: o.night, state: app.state });
    this.id = id; this.M = M; this.sc = built.scene; this.meta = built;
    app.attachStage(this.sc, { terrain: built.terrain || this.sc.terrain, night: !!o.night });
    this.buildMask(built);
    // avatar = your lead Tokonmon
    const sp = (app.state && app.state.party[0] && app.state.party[0].species) || o.species || 'chilichick';
    this.avatar = new MonSprite(sp, { scale: 0.58, pitch: 24, yaw: 0 });
    const [x, y] = built.spawns[spawn] || built.spawns.start || [this.sc.w / 2, this.sc.h / 2];
    this.me = new Actor({ x, y, src: () => this.avatar.frame() });
    this.me.src = () => this.avatar.frame();
    this.sc.actors.add(this.me);
    // wandering Tokonmon / NPC creatures
    this.npcs = [];
    for (const n of built.npcs || []) this.addNpc(n);
    this.cam(true);
    this.path = null; this.hotNear = null;
    if (M.music && app.audio.music) app.audio.music(M.music, { fade: 1.2 });
    if (M.ambience && app.audio.ambience) app.audio.ambience(M.ambience);
    if (M.onEnter) M.onEnter(this);
    return this;
  }
  addNpc(n) {
    const spr = new MonSprite(n.species, { scale: n.scale || 0.58, pitch: 24, yaw: n.yaw ?? 0 });
    const a = new Actor({ x: n.x, y: n.y, src: () => spr.frame() });
    const rec = Object.assign({ spr, a, home: [n.x, n.y], wait: Math.random() * 3, target: null }, n);
    this.sc.actors.add(a); this.npcs.push(rec);
    return rec;
  }
  refreshAvatar() { const sp = this.app.state.party[0] && this.app.state.party[0].species; if (sp && sp !== this.avatar.species) { this.avatar = new MonSprite(sp, { scale: 0.58, pitch: 24, yaw: this.avatar.yaw }); } }
  removeNpc(rec) { this.sc.actors.delete(rec.a); this.npcs = this.npcs.filter((r) => r !== rec); }

  // ------------------------------------------------------------------ walk mask (1 = walkable)
  buildMask(b) {
    const W = this.sc.w, H = this.sc.h, m = new Uint8Array(W * H);
    const fillPoly = (pts, v) => {
      let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, Math.ceil(y1)); y++) {
        const xs = [], Y = y + 0.5;
        for (let i = 0; i < pts.length; i++) { const [xa, ya] = pts[i], [xb, yb] = pts[(i + 1) % pts.length]; if ((ya > Y) !== (yb > Y)) xs.push(xa + ((Y - ya) / (yb - ya)) * (xb - xa)); }
        xs.sort((a, c) => a - c);
        for (let k = 0; k + 1 < xs.length; k += 2) m.fill(v, y * W + Math.max(0, Math.round(xs[k])), y * W + Math.min(W, Math.round(xs[k + 1])));
      }
    };
    for (const p of b.walk) fillPoly(p, 1);
    for (const r of b.block || []) fillPoly(r.length === 4 && typeof r[0] === 'number' ? [[r[0], r[1]], [r[0] + r[2], r[1]], [r[0] + r[2], r[1] + r[3]], [r[0], r[1] + r[3]]] : r, 0);
    // solid sprites block a footprint ellipse at their base
    for (const s of this.sc.sprites) {
      if (s.solid === false || !s.cv) continue;
      const rx = s.foot ? s.foot[0] : Math.min(26, Math.max(3, s.cv.width * 0.32)), ry = s.foot ? s.foot[1] : Math.min(6, Math.max(2, rx * 0.35));
      for (let y = Math.floor(s.y - ry); y <= Math.ceil(s.y + 1); y++) for (let x = Math.floor(s.x - rx); x <= Math.ceil(s.x + rx); x++) { if (x < 0 || y < 0 || x >= W || y >= H) continue; const u = (x - s.x) / rx, v = (y - s.y + ry * 0.4) / ry; if (u * u + v * v <= 1) m[y * W + x] = 0; }
    }
    this.mask = m;
    // coarse grid for A*
    const gw = Math.ceil(W / CELL), gh = Math.ceil(H / CELL), g = new Uint8Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { let ok = 1; for (let y = j * CELL; y < Math.min(H, (j + 1) * CELL) && ok; y += 2) for (let x = i * CELL; x < Math.min(W, (i + 1) * CELL); x += 2) if (!m[y * W + x]) { ok = 0; break; } g[j * gw + i] = ok; }
    this.grid = { w: gw, h: gh, g };
  }
  walkable(x, y, r = 3) {
    const W = this.sc.w, H = this.sc.h, m = this.mask;
    for (const [dx, dy] of [[0, 0], [-r, 0], [r, 0], [0, -r * 0.5], [0, r * 0.5]]) { const X = Math.round(x + dx), Y = Math.round(y + dy); if (X < 0 || Y < 0 || X >= W || Y >= H || !m[Y * W + X]) return false; }
    return true;
  }
  findPath(x0, y0, x1, y1) {
    const { w, h, g } = this.grid, ci = (x, y) => [Math.max(0, Math.min(w - 1, Math.floor(x / CELL))), Math.max(0, Math.min(h - 1, Math.floor(y / CELL)))];
    let [sx, sy] = ci(x0, y0), [tx, ty] = ci(x1, y1);
    if (!g[ty * w + tx]) { // nearest walkable cell to the target
      let best = null, bd = Infinity;
      for (let j = Math.max(0, ty - 8); j < Math.min(h, ty + 9); j++) for (let i = Math.max(0, tx - 8); i < Math.min(w, tx + 9); i++) if (g[j * w + i]) { const d = (i - tx) ** 2 + (j - ty) ** 2; if (d < bd) { bd = d; best = [i, j]; } }
      if (!best) return null; [tx, ty] = best; x1 = (tx + 0.5) * CELL; y1 = (ty + 0.5) * CELL;
    }
    const N = w * h, gs = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open = [[0, sy * w + sx]]; gs[sy * w + sx] = 0;
    const H_ = (i) => Math.hypot((i % w) - tx, ((i / w) | 0) - ty);
    let iters = 0;
    while (open.length && iters++ < 6000) {
      let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
      const [, cur] = open.splice(bi, 1)[0];
      if (cur === ty * w + tx) break;
      if (closed[cur]) continue; closed[cur] = 1;
      const cx = cur % w, cy = (cur / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx; if (!g[ni] || closed[ni]) continue;
        if (dx && dy && (!g[cy * w + nx] || !g[ny * w + cx])) continue;
        const ng = gs[cur] + (dx && dy ? 1.414 : 1);
        if (ng < gs[ni]) { gs[ni] = ng; from[ni] = cur; open.push([ng + H_(ni), ni]); }
      }
    }
    const end = ty * w + tx; if (from[end] < 0 && end !== sy * w + sx) return null;
    const pts = [[x1, y1]]; let c = from[end];
    while (c >= 0 && c !== sy * w + sx) { pts.push([(c % w + 0.5) * CELL, (((c / w) | 0) + 0.5) * CELL]); c = from[c]; }
    pts.reverse();
    // string-pull: drop points we can see past
    const out = []; let ax = x0, ay = y0;
    for (let i = 0; i < pts.length; i++) { const nxt = pts[i + 1]; if (nxt && this.clear(ax, ay, nxt[0], nxt[1])) continue; out.push(pts[i]); [ax, ay] = pts[i]; }
    return out;
  }
  clear(x0, y0, x1, y1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3); for (let k = 1; k <= n; k++) { const t = k / n; if (!this.walkable(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 2)) return false; } return true; }

  // ------------------------------------------------------------------ frame
  walkTo(x, y) { this.path = this.findPath(this.me.x, this.me.y, x, y); }
  update(dt) {
    this.t += dt;
    const app = this.app, ui = app.ui, me = this.me;
    let vx = 0, vy = 0;
    if (this.control && !ui.dialog) {
      const k = app.keysDown;
      if (k.ArrowLeft || k.a) vx -= 1; if (k.ArrowRight || k.d) vx += 1; if (k.ArrowUp || k.w) vy -= 1; if (k.ArrowDown || k.s) vy += 1;
      if (vx || vy) this.path = null;
      // tap on the world (not on UI) → walk there; tap near a hotspot bubble handled in drawUI
      if (app.tapWorld) { const [tx, ty] = app.tapWorld; app.tapWorld = null; this.walkTo(tx + this.sc.cam.x, ty + this.sc.cam.y); this.tapMark = { x: tx + this.sc.cam.x, y: ty + this.sc.cam.y, t: 0 }; }
    } else this.path = null;
    if (!vx && !vy && this.path && this.path.length) {
      const [px, py] = this.path[0], dx = px - me.x, dy = py - me.y, d = Math.hypot(dx, dy);
      if (d < 2.5) this.path.shift(); else { vx = dx / d; vy = dy / d; }
    }
    const run = app.keysDown.Shift || (this.path && this.path.length > 3);
    const sp = (run ? 78 : 50) * dt;
    if (vx || vy) {
      const l = Math.hypot(vx, vy); vx /= l; vy /= l;
      const nx = me.x + vx * sp, ny = me.y + vy * sp;
      if (this.walkable(nx, ny)) { me.x = nx; me.y = ny; }
      else if (this.walkable(nx, me.y)) me.x = nx;
      else if (this.walkable(me.x, ny)) me.y = ny;
      else this.path = null;
      this.avatar.yaw = yawOf(vx, vy);
      this.avatar.setBase(run ? 'run' : 'walk'); if (this.avatar.clip !== (run ? 'run' : 'walk') && ['idle', 'walk', 'run'].includes(this.avatar.clip)) this.avatar.play(run ? 'run' : 'walk');
    } else { this.avatar.setBase('idle'); if (['walk', 'run'].includes(this.avatar.clip)) this.avatar.play('idle'); }
    this.avatar.update(dt);
    // npcs wander near home
    for (const n of this.npcs) {
      n.spr.update(dt);
      if (n.still) continue;
      if (!n.target) { n.wait -= dt; if (n.wait <= 0) { const a = Math.random() * Math.PI * 2, r = Math.random() * (n.roam || 30); const tx = n.home[0] + Math.cos(a) * r, ty = n.home[1] + Math.sin(a) * r * 0.6; if (this.walkable(tx, ty)) n.target = [tx, ty]; n.wait = 1 + Math.random() * 3; } n.spr.setBase('idle'); if (n.spr.clip === 'walk') n.spr.play('idle'); }
      else { const dx = n.target[0] - n.a.x, dy = n.target[1] - n.a.y, d = Math.hypot(dx, dy); if (d < 2) n.target = null; else { const s = 30 * dt; n.a.x += dx / d * s; n.a.y += dy / d * s; n.spr.yaw = yawOf(dx, dy); if (n.spr.clip === 'idle') n.spr.play('walk'); } }
    }
    // nearest hotspot within reach
    let best = null, bd = Infinity;
    for (const h of this.meta.hotspots) { if (h.when && !h.when(app)) continue; const d = Math.hypot(h.x - me.x, (h.y - me.y) * 1.4); if (d < (h.r || 26) && d < bd) { bd = d; best = h; } }
    for (const n of this.npcs) if (n.talk) { const d = Math.hypot(n.a.x - me.x, (n.a.y - me.y) * 1.2); if (d < (n.r || 36) && d < bd) { bd = d; best = { x: n.a.x, y: n.a.y - 20, label: n.label || n.name, icon: 'talk', npc: n, act: n.talk }; } }
    this.hotNear = best;
    if (best && this.control && !ui.dialog && (ui.key(' ') || ui.key('e') || ui.key('Enter'))) this.interact(best);
    // exits by walking into a zone
    for (const ex of this.meta.exits || []) if (me.x > ex.x && me.x < ex.x + ex.w && me.y > ex.y && me.y < ex.y + ex.h && this.control && !this._exiting) { this._exiting = true; Promise.resolve(app.onExit(ex)).finally(() => { this._exiting = false; }); }
    this.cam(false, dt);
    if (this.tapMark) this.tapMark.t += dt;
  }
  async interact(h) {
    if (this.busy) return;
    this.busy = true; this.path = null;
    const prev = this.control; this.control = false;
    // turn to face it
    this.avatar.yaw = yawOf(h.x - this.me.x, h.y - this.me.y);
    try { await h.act(this.app, this, h); } catch (e) { console.error(e); }
    this.control = prev; this.busy = false;
  }
  cam(snap, dt = 0) {
    const sc = this.sc, tx = this.me.x - sc.vw / 2, ty = this.me.y - sc.vh * 0.55;
    if (snap) { sc.cam.x = tx; sc.cam.y = ty; this._cx = tx; this._cy = ty; }
    else { const k = 1 - Math.exp(-dt * 5); this._cx += (tx - this._cx) * k; this._cy += (ty - this._cy) * k; sc.cam.x = this._cx; sc.cam.y = this._cy; }
    this._cx = Math.max(0, Math.min(sc.w - sc.vw, this._cx)); this._cy = Math.max(0, Math.min(sc.h - sc.vh, this._cy));
  }
  render(t) { bank.tick(); return this.sc.render(t); }
  // in-world UI: hotspot bubble, tap marker
  drawUI(ui) {
    const sc = this.sc, cx = Math.round(sc.cam.x), cy = Math.round(sc.cam.y);
    if (this.tapMark && this.tapMark.t < 0.5) { const x = Math.round(this.tapMark.x - cx), y = Math.round(this.tapMark.y - cy), r = Math.round(2 + this.tapMark.t * 10); ui.s.ring(x, y, r, Math.max(1, r * 0.5), T.cyan); }
    const h = this.hotNear;
    if (h && this.control && !ui.dialog) {
      const label = h.label || '…', w = ui.tw(label) + 20, x = Math.round(h.x - cx - w / 2), y = Math.round((h.y - (h.bubbleH || 34)) - cy + Math.sin(this.t * 4) * 1.5);
      if (ui.button(x, y, w, 14, label, { icon: h.icon || 'talk', color: T.amber })) this.interact(h);
      // little tail
      ui.px(x + (w >> 1), y + 14, T.ink); ui.px(x + (w >> 1) - 1, y + 14, T.ink); ui.px(x + (w >> 1), y + 15, T.ink);
    }
  }
}
