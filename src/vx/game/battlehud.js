// The battle HUD, in the game's pixel GUI style: cream panels in chunky copper frames, glossy capsule bars with brass
// clamps, detailed pixel icons, keycaps — drawn on a fine art-pixel grid (two device pixels a pixel) so it stays crisp
// at high resolution. No circles anywhere: every shape is a rectangle, a bevel or a 45° chamfer.
//  · your Tokonmon's panel (top left) and the foe's (top right): element tile, name, level tag, HP capsule with a
//    lagging damage trail and a shake when hit, energy bar, a segmented ULTIMATE meter that glows when full, team pips
//  · skill cards: chunky pixel cards with the element's strip and icon, energy cost tag, keycap, a rectangular
//    cooldown fill with the seconds left, a flash when ready again, a squash and sparks when pressed
//  · action buttons, a combo counter that pops and escalates, initiative pips while an order winds up,
//    starburst callouts, slanted banners, bouncing damage numbers, a red edge flash when you take a heavy hit
// Battle.js owns one: hud.draw(ui) each frame, hud.hit(e, …) / hud.comboHit() from its events.
import { T } from '../../px/game/ui.js';
import { BARS } from '../../px/game/uikit/theme.js';
import { order, trainerCommand, unitById, cooldownFrac, skillCost, skillName, switchLeft, EMOTES } from '../../battle/sim.js';
import { SKILLS } from '../../data/skills.js';
import { SPECIES } from '../../data/species.js';
import { ELEMENTS } from '../../data/elements.js';
import { ELEM_ICON } from './dex.js';
import * as THREE from '../../../vendor/three.module.js';

const ELC = (e) => (ELEMENTS[e] && ELEMENTS[e].color) || '#ffffff';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const _r = new THREE.Raycaster(), _p = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _n = new THREE.Vector2(), _v = new THREE.Vector3();

export class BattleHud {
  constructor(b) { this.b = b; this.bars = new Map(); this.combo = { n: 0, t: 0, pop: 0, best: 0, grade: null }; this.press = new Map(); this.sparks = []; this.readyT = new Map(); this.edge = 0; this.prevCd = new Map(); this.t = 0; }
  get app() { return this.b.app; }
  // ================================================================ the pen: rectangles on the art-pixel grid
  pen(ui) { this.ui = ui; this.q = Math.max(1, Math.round(ui.k * 0.5)) / ui.k; }
  sn(v) { return Math.round(v / this.q) * this.q; }
  r(x, y, w, h, c, a) {
    if (w <= 0 || h <= 0 || !c) return; const ui = this.ui, x0 = this.sn(x), y0 = this.sn(y), w0 = Math.max(this.q, this.sn(x + w) - x0), h0 = Math.max(this.q, this.sn(y + h) - y0);
    if (a !== undefined && a < 1) { if (a <= 0) return; ui.g.globalAlpha = a; ui.rect(x0, y0, w0, h0, c); ui.g.globalAlpha = 1; } else ui.rect(x0, y0, w0, h0, c);
  }
  /** a box with its corners cut at 45° (c art pixels) */
  cham(x, y, w, h, c, col, a) { const q = this.q; for (let i = 0; i < c; i++) { const ins = (c - i) * q; this.r(x + ins, y + i * q, w - 2 * ins, q, col, a); this.r(x + ins, y + h - (i + 1) * q, w - 2 * ins, q, col, a); } this.r(x, y + c * q, w, h - 2 * c * q, col, a); }
  /** the GUI's frame: ink outline, copper border with a lit rim, cream (or any) fill, a thin inner line, brass rivets */
  frame(x, y, w, h, o = {}) {
    const q = this.q, c = o.c ?? 3;
    if (o.shadow !== false) this.cham(x - q, y + q, w + 4 * q, h + 3 * q, c + 1, '#0c0809', 0.35);
    this.cham(x - 2 * q, y - 2 * q, w + 4 * q, h + 4 * q, c + 1, T.ink);
    this.cham(x - q, y - q, w + 2 * q, h + 2 * q, c, o.edge || T.copper);
    this.r(x + c * q, y - q, w - 2 * c * q, q, o.rim || T.copperH); this.r(x - q, y + c * q, q, h - 2 * c * q, o.rimL || T.copperL);
    this.r(x + c * q, y + h, w - 2 * c * q, q, T.copperD);
    this.cham(x, y, w, h, Math.max(1, c - 1), o.fill || T.cream);
    if (o.line !== false) this.r(x + 2 * q, y + h - 2 * q, w - 4 * q, q, o.lineCol || T.creamLine);
    if (o.rivets !== false) for (const [rx, ry] of [[x + q, y + q], [x + w - 2 * q, y + q]]) { this.r(rx, ry, q, q, T.brass); }
  }
  /** a glossy capsule bar with chamfered ends, brass clamps, ticks and a lagging damage trail */
  capsule(x, y, w, h, frac, trail, ramp, o = {}) {
    const q = this.q; frac = clamp(frac, 0, 1); trail = clamp(trail ?? frac, 0, 1);
    if (o.clamps !== false) for (const cx of [x - 4 * q, x + w + 2 * q]) { this.r(cx - q, y - 3 * q, 4 * q, h + 6 * q, T.ink); this.r(cx, y - 2 * q, 2 * q, h + 4 * q, T.brass); this.r(cx, y - 2 * q, q, h + 4 * q, '#fff0a0'); this.r(cx + q, y + h + q, q, q, T.brassD); }
    this.cham(x - q, y - q, w + 2 * q, h + 2 * q, 2, T.ink);
    this.cham(x, y, w, h, 1, T.track); this.r(x + q, y + q, w - 2 * q, q, T.trackL);
    const fw = w * frac, tw = w * trail;
    if (tw > fw + q * 0.5) this.r(x + fw, y, tw - fw, h, o.blink && Math.floor(this.t * 14) % 2 ? '#ffffff' : '#ff8a6a');
    if (fw > 0) {
      this.r(x, y + q, fw, h - 2 * q, ramp[0]); this.r(x + (fw > 2 * q ? q : 0), y, Math.max(q, fw - (fw > 2 * q ? 2 * q : 0)), q, ramp[1]);
      this.r(x, y + q, fw, q, ramp[1]); this.r(x, y + h - q, fw, q, ramp[2]);
      if (fw > 4 * q && h > 4 * q) this.r(x + 2 * q, y + 2 * q, Math.min(fw - 4 * q, w * 0.4), q, '#ffffff', 0.5);
    }
    if (o.ticks) for (let i = 1; i < o.ticks; i++) this.r(x + (w * i) / o.ticks, y + q, q, h - 2 * q, T.ink, 0.28);
  }
  /** a jagged starburst behind a callout (never round): alternating radii with jitter, ink edge */
  starburst(cx, cy, rx, ry, n, col, edge, seed = 1) {
    const s = this.ui.s, pts = [], pts2 = []; let h = seed * 9301 + 49297;
    const R = () => { h = (h * 9301 + 49297) % 233280; return h / 233280; };
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, k = i & 1 ? 0.72 : 1 + R() * 0.18; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); pts2.push([cx + Math.cos(a) * (rx * k - 2.5), cy + Math.sin(a) * (ry * k - 2.5)]); }
    s.poly(pts, edge); s.poly(pts2, col);
  }
  keycap(x, y, label, o = {}) {
    const q = this.q, w = Math.max(8, this.ui.tw(label, { mini: true }) + 5), h = 8;
    this.cham(x - q, y - q, w + 2 * q, h + 2 * q, 1, T.ink); this.r(x, y, w, h, T.keySide); this.r(x, y, w, h - 2 * q, o.down ? T.keyD : T.key);
    this.ui.text(label, x + w / 2, y + 1.5, T.paperText, { align: 'center', mini: true }); return w;
  }
  spark(x, y, c, n = 6) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 50; this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, life: 0.35 + Math.random() * 0.3, c }); } }
  // ================================================================ feedback hooks (from battle.events)
  /** a hit landed: the bar shakes and its trail holds before draining; a heavy one on you flashes the screen edges */
  hit(u, dmg) { const B = this.barOf(u); B.shake = Math.min(1, 0.4 + dmg / Math.max(1, u.maxHp) * 4); B.hold = 0.45; if (u.side === 0 && dmg > u.maxHp * 0.12) this.edge = 1; }
  comboHit() { const C = this.combo; C.n = this.t - C.t < 2.2 ? C.n + 1 : 1; C.t = this.t; C.pop = 1; C.best = Math.max(C.best, C.n); C.grade = null; if (C.n >= 3 && C.n % 5 === 0) this.app.audio.sfx && this.app.audio.sfx('combo', { vol: 0.5 }); }
  barOf(u) { let B = this.bars.get(u.id); if (!B) this.bars.set(u.id, (B = { hp: u.hp / u.maxHp, trail: u.hp / u.maxHp, hold: 0, shake: 0 })); return B; }
  tick(dt) {
    this.t += dt;
    for (const [id, B] of this.bars) {
      const u = unitById(this.b.st, id); if (!u) continue; const f = clamp(u.hp / u.maxHp, 0, 1);
      B.hp += (f - B.hp) * Math.min(1, dt * 14); if (f > B.trail) B.trail = f;
      if (B.hold > 0) B.hold -= dt; else B.trail += (B.hp - B.trail) * Math.min(1, dt * 3.2);
      B.shake = Math.max(0, B.shake - dt * 2.5);
    }
    const C = this.combo; C.pop = Math.max(0, C.pop - dt * 4);
    if (C.n && this.t - C.t > 2.2) { if (C.n >= 3) C.grade = { str: C.n >= 15 ? 'INCREDIBLE!' : C.n >= 10 ? 'AMAZING!' : C.n >= 6 ? 'GREAT!' : 'NICE!', t: 0, n: C.n }; C.n = 0; }
    if (C.grade) { C.grade.t += dt; if (C.grade.t > 1.3) C.grade = null; }
    for (const s of this.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 160 * dt; } this.sparks = this.sparks.filter((s) => s.t < s.life);
    for (const [k, v] of this.press) if (this.t - v > 0.5) this.press.delete(k);
    this.edge = Math.max(0, this.edge - dt * 2.4);
  }
  // ================================================================ the whole HUD
  draw(ui) {
    const b = this.b, st = b.st; if (!st) return;
    this.pen(ui); this.tick(ui.dt || 1 / 60);
    const me = b.me(), W = ui.w, H = ui.h, hk = b.hud, w = this.app.world;
    // the red edge flash when you take a big hit (rectangles at the screen edges)
    if (this.edge > 0.01) { const a = this.edge * 0.55, e = 10 * this.edge; this.r(0, 0, W, e, '#e2403a', a); this.r(0, H - e, W, e, '#e2403a', a); this.r(0, 0, e, H, '#e2403a', a); this.r(W - e, 0, e, H, '#e2403a', a); }
    // over each fighter: a small HP bar with its trail, a bond chain, the initiative pips of an order winding up
    for (const [, rr] of b.units) {
      const u = rr.u; if (!u.onField || u.state === 'faint' || !rr.sent || hk < 0.5 || b.ending) continue;
      const s = w.project(b.wpos(u, b.height(rr) + 0.28)); if (!s.vis) continue;
      const B = this.barOf(u), x = Math.round(s.x) - 14, y = Math.round(s.y) + Math.round(Math.sin(this.t * 50) * B.shake * 2);
      this.capsule(x, y, 28, 3, B.hp, B.trail, u.side === 0 ? BARS.green : BARS.red, { clamps: false });
      if (u.side === 0 && u.order && u.order.dur > 0) { const k = clamp(u.order.t / u.order.dur, 0, 1); for (let i = 0; i < 4; i++) { const on = k * 4 > i; this.r(x + 4 + i * 6, y - 6, 4, 3, T.ink); this.r(x + 4 + i * 6 + this.q, y - 6 + this.q, 4 - 2 * this.q, 3 - 2 * this.q, on ? T.cyan : T.track); } }
      if (u.bonded) ui.icon('link', x + 30, y - 3 + Math.round(Math.sin(this.t * 6)), T.cyan);
    }
    this.cries(ui); this.pops(ui);
    const slide = Math.round((1 - hk) * 170);
    if (me && hk > 0.02) this.panel(ui, me, 8 - slide, 7, false);
    const foe = b.foe(); if (foe && hk > 0.02) this.panel(ui, foe, W - 8 + slide, 7, true);
    if (me && !b.ending && !b.frozen && !st.paused) this.controls(ui, me);
    this.drawCombo(ui);
    for (const bn of b.banners) this.banner(ui, bn);
    if (b.vs) this.vs(ui, b.vs.t);
    for (const c of b.callouts) this.callout(ui, c);
    for (const s of this.sparks) { const a = 1 - s.t / s.life; this.r(s.x - 1, s.y, 3, 1, s.c, a); this.r(s.x, s.y - 1, 1, 3, s.c, a); }
    if (b.intro && b.t > 0.6 && !b.skipIntro) ui.text('SPACE / TAP  SKIP', W - 8, H - 14, '#8a84a8', { align: 'right', mini: true, outline: T.ink });
  }
  // ---------------------------------------------------------------- a fighter's panel
  panel(ui, u, x, y, right) {
    const q = this.q, pw = 156, ph = 42, B = this.barOf(u); if (right) x -= pw;
    x += Math.round(Math.sin(this.t * 60) * B.shake * 3);
    this.frame(x, y, pw, ph);
    // the element tile (bevelled square) with its detailed icon
    const el = u.elem, ec = ELC(el), tx = right ? x + pw - 22 : x + 5, ty = y + 5;
    this.cham(tx - q, ty - q, 18 + 2 * q, 18 + 2 * q, 2, T.ink); this.cham(tx, ty, 18, 18, 2, ec); this.r(tx + q, ty + q, 18 - 2 * q, q, '#ffffff', 0.45); this.r(tx + q, ty + 18 - 2 * q, 18 - 2 * q, q, T.ink, 0.35);
    ui.bigIcon(ELEM_ICON[el] || 'star', tx + 3, ty + 3, null, { scale: 1, shadow: false });
    const sp = SPECIES[u.species], nx = right ? x + 6 : x + 28, name = sp ? sp.name : u.name;
    ui.text(name, nx, y + 4, T.paperText, { bold: true });
    // the level tag (a brass plate with cut corners)
    const lv = 'Lv' + u.level, lw = ui.tw(lv, { mini: true }) + 6, lx = right ? x + pw - 28 - lw : x + pw - lw - 6;
    this.cham(lx - q, y + 3 - q, lw + 2 * q, 9 + 2 * q, 1, T.ink); this.r(lx, y + 3, lw, 9, T.brass); this.r(lx, y + 3, lw, q, '#fff0a0'); ui.text(lv, lx + 3, y + 5, T.paperText, { mini: true });
    // HP
    const f = u.hp / u.maxHp, ramp = f > 0.5 ? BARS.green : f > 0.22 ? BARS.yellow : BARS.red, bx = right ? x + 8 : x + 30, bw = pw - 40;
    this.capsule(bx, y + 16, bw, 7, B.hp, B.trail, ramp, { ticks: 10, blink: B.hold > 0 });
    ui.text(`${Math.ceil(u.hp)}/${u.maxHp}`, right ? bx : bx + bw, y + 26, T.paperDim, { mini: true, align: right ? 'left' : 'right' });
    ui.text('HP', right ? bx + bw - 10 : bx, y + 26, T.paperText, { mini: true, bold: true });
    // energy and the ultimate meter (yours), team pips (both)
    if (!right) {
      this.capsule(bx, y + 34, bw * 0.48, 3, u.energy / 100, u.energy / 100, BARS.cyan, { clamps: false });
      const ux = bx + bw * 0.55, segs = 5, sw = (bw * 0.45 - (segs - 1) * 2) / segs, uf = (u.ult || 0) / 100, full = uf >= 1;
      for (let i = 0; i < segs; i++) {
        const sx = ux + i * (sw + 2), k = clamp(uf * segs - i, 0, 1);
        this.cham(sx - q, y + 33 - q, sw + 2 * q, 5 + 2 * q, 1, full && Math.floor(this.t * 8) % 2 ? T.amberL : T.ink); this.r(sx, y + 33, sw, 5, T.track);
        if (k > 0) { this.r(sx, y + 33, sw * k, 5, full ? T.gold : T.amber); this.r(sx, y + 33, sw * k, q, '#fff0a0'); }
      }
      if (full) { const gx = ux + bw * 0.45 + 3, g = Math.floor(this.t * 6) % 3; ui.text('ULT', gx, y + 32, g ? T.gold : '#ffffff', { mini: true, outline: T.ink }); if (Math.random() < 0.15) this.spark(ux + Math.random() * bw * 0.45, y + 35, T.gold, 1); }
    }
    this.pips(ui, u, right ? x + pw - 8 : x + 8, y + ph + 6, right);
  }
  /** one square pip per Tokonmon in the trainer's team: lit = standing, dark with a cross = down, bright edge = out now */
  pips(ui, u, x, y, right) {
    const st = this.b.st, T_ = st.trainers.find((t) => t.id === u.trainer); if (!T_) return;
    const team = T_.team.map((id) => unitById(st, id)).filter(Boolean), q = this.q;
    team.forEach((m, i) => {
      const px = right ? x - (i + 1) * 9 : x + i * 9, down = m.state === 'faint' || m.hp <= 0, cur = m.id === T_.active;
      this.r(px - q, y - q, 7 + 2 * q, 7 + 2 * q, cur ? '#ffffff' : T.ink); this.r(px, y, 7, 7, down ? T.track : ELC(m.elem)); if (!down) this.r(px, y, 7, q, '#ffffff', 0.5);
      if (down) for (let k = 0; k < 5; k++) { this.r(px + 1 + k, y + 1 + k, q * 1.5, q * 1.5, T.red); this.r(px + 5 - k, y + 1 + k, q * 1.5, q * 1.5, T.red); }
    });
    if (T_.switching) ui.text(Math.ceil(switchLeft(T_)) + 's', right ? x - team.length * 9 - 4 : x + team.length * 9 + 2, y, T.amber, { mini: true, outline: T.ink, align: right ? 'right' : 'left' });
  }
  // ---------------------------------------------------------------- skill cards + actions
  pressed(key, x, y, w, h, hotkey) {
    const ui = this.ui, p = ui.ptr, hit = (p.released && ui.inside(x, y, w, h) && !ui.dialog) || (hotkey && ui.key(hotkey));
    if (hit && p.released && ui.inside(x, y, w, h)) p.released = false;
    if (hit) this.press.set(key, this.t);
    return hit;
  }
  squash(key) { const t0 = this.press.get(key); if (t0 === undefined) return 0; const t = this.t - t0; return t < 0.35 ? Math.exp(-t * 9) * Math.cos(t * 30) : 0; }
  controls(ui, me) {
    const b = this.b, st = b.st, T_ = b.ptr, app = this.app, W = ui.w, H = ui.h, q = this.q;
    const cmd = (c) => { if (order(st, me.id, c)) { app.audio.sfx && app.audio.sfx('ui_tap'); return true; } app.audio.sfx && app.audio.sfx('ui_error', { vol: 0.5 }); return false; };
    const target = () => { const f = b.foe(); return f ? f.id : undefined; };
    const n = 4, gap = 5, bw = Math.min(96, Math.floor((W - 76 - gap * 3 - 10) / 4)), bh = 32, y0 = H - bh - 8 + Math.round((1 - b.hud) * 46);
    me.skills.slice(0, n).forEach((id, i) => {
      const sk = SKILLS[id]; if (!sk) return;
      const x = 8 + i * (bw + gap), cd = cooldownFrac(st, me, id), cost = skillCost(me, id), ok = cd <= 0 && me.energy >= cost, key = 'sk' + i;
      const prev = this.prevCd.get(key) ?? 0; if (prev > 0 && cd <= 0) { this.readyT.set(key, this.t); this.spark(x + bw / 2, y0 + bh / 2, '#ffffff', 8); } this.prevCd.set(key, cd);
      const hover = ui.inside(x, y0 - 3, bw, bh + 3) && !ui.dialog, sq = this.squash(key), lift = hover && ok ? -2 : 0, y = y0 + lift + sq * 3;
      const ec = ELC(sk.elem), ordered = me.order && me.order.cmd && me.order.cmd.type === 'skill' && me.order.cmd.id === id;
      // the card
      this.frame(x, y, bw, bh, { c: 3, edge: ordered ? (Math.floor(this.t * 10) % 2 ? T.amber : T.brass) : T.copper, rivets: false, line: false });
      this.r(x, y, bw, 11, ec); this.r(x, y, bw, q, '#ffffff', 0.5); this.r(x, y + 11 - q, bw, q, T.ink, 0.4);
      ui.icon(ELEM_ICON[sk.elem] || 'star', x + 3, y + 2, '#ffffff', T.ink);
      const name = skillName(me, id), maxW = bw - 14; let nm = name; while (ui.tw(nm, { mini: true }) > maxW && nm.length > 3) nm = nm.slice(0, -1);
      ui.text(nm === name ? nm : nm + '.', x + 12, y + 3, '#ffffff', { mini: true, outline: T.ink });
      // the cost tag and the keycap
      if (cost) { const cw = ui.tw(String(cost), { mini: true }) + 11; this.cham(x + 3 - q, y + 15 - q, cw + 2 * q, 9 + 2 * q, 1, T.ink); this.r(x + 3, y + 15, cw, 9, T.brass); ui.icon('bolt', x + 3, y + 16, T.paperText, null); ui.text(String(cost), x + 11, y + 17, T.paperText, { mini: true }); }
      this.keycap(x + bw - 12, y + 16, String(i + 1), { down: sq > 0.2 });
      // cooldown: a rectangular fill draining from the top, the seconds big in the middle
      if (cd > 0) { this.r(x, y, bw, bh * cd, '#120c1c', 0.62); this.r(x, y + bh * cd - q, bw, q, T.amber); ui.text(Math.ceil(cd * (sk.cd || 1)) + 's', x + bw / 2, y + 12, T.amberL, { align: 'center', outline: T.ink, scale: 2 }); }
      else if (me.energy < cost) { this.r(x, y, bw, bh, '#120c1c', 0.42); ui.text('LOW EN', x + bw / 2, y + 23, '#ff8a6a', { align: 'center', mini: true, outline: T.ink }); }
      const rt = this.readyT.get(key); if (rt !== undefined && this.t - rt < 0.3) this.r(x, y, bw, bh, '#ffffff', 1 - (this.t - rt) / 0.3);
      if (sq > 0.05) this.r(x, y, bw, bh, '#ffffff', sq * 0.6);
      if (this.pressed(key, x, y0 - 3, bw, bh + 3, String(i + 1))) { if (ok && cmd({ type: 'skill', id, target: target() })) this.spark(x + bw / 2, y, ec, 10); }
    });
    // the action column
    const ax = W - 58, ab = 50, ah = 17; let yy = H - 8 - ah;
    const act = (label, icon, color, key, fn, o = {}) => {
      const k = 'a' + label, sq = this.squash(k), y = yy + sq * 2, glow = o.glow && Math.floor(this.t * 8) % 2;
      this.frame(ax, y, ab, ah, { c: 2, edge: glow ? T.gold : color, rim: glow ? '#ffffff' : undefined, rivets: false, line: false, fill: o.disabled ? T.creamD : T.cream, shadow: false });
      this.cham(ax + 2, y + 2, 13, ah - 4, 1, color); ui.icon(icon, ax + 5, y + 4, '#ffffff', T.ink);
      ui.text(label, ax + 18, y + 5, o.disabled ? T.paperDim : T.paperText, { mini: true, bold: true });
      if (key && key.length === 1 && key !== ' ') { ui.text(key.toUpperCase(), ax + ab - 4, y + 5, T.paperDim, { mini: true, align: 'right' }); }
      if (o.disabled) this.r(ax, y, ab, ah, '#120c1c', 0.25);
      if (sq > 0.05) this.r(ax, y, ab, ah, '#ffffff', sq * 0.6);
      if (this.pressed(k, ax, yy, ab, ah, key) && !o.disabled) { fn(); this.spark(ax + ab / 2, yy + ah / 2, color, 6); }
      yy -= ah + 4;
    };
    act('Atk', 'fist', T.amber, ' ', () => cmd({ type: 'attack', id: target() }));
    act('Dodge', 'dodge', T.cyan, 'Shift', () => { const f = b.foe(); let dx = 1, dz = 0; if (f) { dx = -(f.z - me.z); dz = f.x - me.x; if (Math.random() < 0.5) { dx = -dx; dz = -dz; } } cmd({ type: 'dodge', dx, dz }); });
    const canBond = st.rules.bond && T_.canBond && !T_.bonded && T_.bondCd <= 0;
    if (me.bonded && me.ultSkill) act('Ult', 'star', T.amber, 'f', () => order(st, me.id, { type: 'ult' }), { disabled: (me.ult || 0) < 100, glow: (me.ult || 0) >= 100 });
    else if (st.rules.bond && T_.canBond) act(T_.bonded ? 'Unbond' : T_.bondCd > 0 ? Math.ceil(T_.bondCd) + 's' : 'Bond', 'link', T.cyan, 'b', () => trainerCommand(st, T_.id, { type: T_.bonded ? 'unbond' : 'bond' }), { disabled: !T_.bonded && !canBond, glow: canBond });
    const bench = T_.team.map((id) => unitById(st, id)).filter((u) => u && u.id !== me.id && u.state !== 'faint');
    if (bench.length) act(T_.switching ? Math.ceil(switchLeft(T_)) + 's' : 'Swap', 'swap', T.green, 'Tab', () => trainerCommand(st, T_.id, { type: 'switch', to: bench[0] && bench[0].id }), { disabled: !!T_.switching || T_.switchCd > 0 });
    act('Emote', 'smile', T.pink, 'e', () => cmd({ type: 'emote', id: Object.keys(EMOTES)[0] }), { disabled: me.emoteCd > 0 });
    if (st.rules.capture) act('Catch', 'star', T.green, 'c', () => { const f = b.foe(); if (!f) return; const gem = ['diamond', 'amethyst', 'ruby', 'sapphire', 'emerald', 'topaz', 'opal', 'quartz'].find((g) => app.state.bag[g] > 0) || 'quartz'; trainerCommand(st, T_.id, { type: 'capture', target: f.id, gem }); });
    if (st.rules.flee) act('Run', 'dodge', T.dim, 'r', () => trainerCommand(st, T_.id, { type: 'flee' }));
    // tap the arena: target a foe or move there
    const p = ui.ptr;
    if (p.released && !ui.dialog && Math.hypot(p.x - p.sx, p.y - p.sy) < 6 && p.y < H - 44 && p.x < W - 62 && p.y > 56) {
      p.released = false;
      let best = null, bd = 26;
      for (const [, rr] of b.units) if (rr.u.onField && rr.u.side === 1 && rr.u.state !== 'faint') { const s = app.world.project(b.wpos(rr.u, 0.4)); const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = rr.u; } }
      if (best) cmd({ type: 'target', id: best.id });
      else {
        _n.set((p.x / app.vw) * 2 - 1, -((p.y / app.vh) * 2 - 1)); _r.setFromCamera(_n, app.stage.cam); _p.constant = -b.gy;
        if (_r.ray.intersectPlane(_p, _v)) { let [x, z] = b.S(_v.x, _v.z); const d = Math.hypot(x, z), Rr = st.arena.r - 0.4; if (d > Rr) { x *= Rr / d; z *= Rr / d; } cmd({ type: 'move', x, z }); if (app.vfx) app.vfx.burst('dust', _v.clone().setY(b.gy + 0.05), { scale: 0.5 }); }
      }
    }
    void q;
  }
  // ---------------------------------------------------------------- the combo counter
  drawCombo(ui) {
    const C = this.combo, W = ui.w, H = ui.h, x = W - 70, y = Math.round(H * 0.34);
    if (C.n >= 2) {
      const pop = 1 + C.pop * 0.6, sc = Math.max(2, Math.round(3 * pop)), col = C.n >= 15 ? T.pink : C.n >= 10 ? T.coral : C.n >= 6 ? T.amber : '#ffffff', jx = Math.round((Math.random() - 0.5) * C.pop * 4);
      // a slanted ink plate
      for (let i = 0; i < 26; i++) this.r(x - 22 + (26 - i) * 0.4 + jx, y - 4 + i, 70, 1, T.ink, 0.72);
      ui.text(String(C.n), x + 6 + jx, y - 2, null, { align: 'center', scale: sc, outline: T.ink, grad: ['#ffffff', col] });
      ui.text('HITS', x + 34 + jx, y + 6, col, { bold: true, outline: T.ink });
      const left = clamp(1 - (this.t - C.t) / 2.2, 0, 1); this.r(x - 16, y + 20, 60, 2, T.track); this.r(x - 16, y + 20, 60 * left, 2, col);
    }
    if (C.grade) { const g = C.grade, k = Math.min(1, g.t * 6), a = Math.min(1, (1.3 - g.t) * 3); if (a > 0) { this.starburst(x + 8, y + 8, 46 * k, 16 * k, 9, T.amber, T.ink, g.n); ui.text(g.str, x + 8, y + 3, '#ffffff', { align: 'center', bold: true, outline: T.ink }); } }
  }
  // ---------------------------------------------------------------- callouts, banners, VS, numbers, cries
  callout(ui, c) {
    const W = ui.w, H = ui.h, a = Math.min(1, c.t * 8, (c.dur - c.t) * 5); if (a <= 0) return;
    const y = Math.round(H * (c.big ? 0.36 : 0.26) - (1 - a) * 6), pop = c.t < 0.16 ? 1 + (1 - c.t / 0.16) * 0.5 : 1, sc = Math.round((c.big ? 3 : 2) * pop), tw = ui.tw(c.str) * sc + sc * 2 * c.str.length;
    if (c.big) this.starburst(W / 2, y + sc * 4, tw / 2 + 16, sc * 7 + 6, 14, c.c || T.amber, T.ink, c.str.length);
    else { for (let i = 0; i < 16; i++) this.r(W / 2 - tw / 2 - 10 + (16 - i) * 0.5, y - 3 + i, tw + 20, 1, T.ink, 0.6); this.r(W / 2 - tw / 2 - 10, y + 13, tw + 20, 1, c.c || T.amber); }
    ui.text(c.str, W >> 1, y, null, { align: 'center', outline: T.ink, scale: sc, spacing: 2, grad: c.big ? ['#ffffff', '#ffffff', T.amberL] : ['#ffffff', c.c || T.amber] });
    if (c.sub) ui.text(c.sub, W >> 1, y + sc * 8 + 6, T.text === '#4a2c22' ? '#ffffff' : T.text, { align: 'center', outline: T.ink });
  }
  banner(ui, b) {
    const W = ui.w, H = ui.h, kin = 1 - Math.pow(1 - clamp(b.t / 0.18, 0, 1), 3), kout = clamp((b.dur - b.t) / 0.2, 0, 1);
    const hgt = b.small ? 13 : 19, cy = Math.round(H * (b.small ? 0.47 : 0.45)), wid = Math.round(W * 0.62 * kout), x0 = Math.round(-W * (1 - kin)), cx = Math.round(W / 2 + (b.t / b.dur - 0.5) * 18);
    for (let i = 0; i < hgt; i++) { const off = hgt - i, xs = cx - (wid >> 1) + off + x0; this.r(xs, cy + i, wid, 1, i === 0 || i === hgt - 1 ? b.c : i < 3 ? '#2a2038' : '#120c1c'); }
    if (kout > 0.3) ui.text(b.str, cx + x0 + hgt / 2, cy + (b.small ? 3 : 4), null, { align: 'center', outline: T.ink, scale: b.small ? 1 : 2, spacing: 1, grad: ['#ffffff', b.c] });
  }
  vs(ui, t) {
    const W = ui.w, H = ui.h, k = clamp(t / 0.25, 0, 1), out = clamp((1.5 - t) / 0.3, 0, 1); if (out <= 0) return;
    const sc = Math.max(2, Math.round(4 * (1 + (1 - k) * 0.6))), y = Math.round(H * 0.46) - sc * 4;
    this.starburst(W / 2, y + sc * 4, 30 * k + 6, 22 * k + 4, 10, T.coral, T.ink, 3);
    ui.text('VS', W >> 1, y, null, { align: 'center', outline: T.ink, scale: sc, grad: ['#ffffff', T.amberL, T.coral] });
  }
  pops(ui) {
    const w = this.app.world;
    for (const p of this.b.pops) {
      const s = w.project(p.p); if (!s.vis || p.t > 1) continue;
      const k = p.t, bounce = k < 0.25 ? Math.sin((k / 0.25) * Math.PI) * 7 : 0, sc = Math.max(1, Math.round(p.scale * (k < 0.12 ? 1.5 : 1)));
      const y = Math.round(s.y - p.dy - k * 20 - bounce), x = Math.round(s.x + p.dx * k);
      if (k > 0.85 && Math.floor(k * 40) % 2) continue;
      if (p.crit && k < 0.7) this.starburst(x, y + sc * 4, 9 * sc, 6 * sc, 7, T.amber, T.ink, p.str.length);
      ui.text(p.str, x, y, p.c, { align: 'center', outline: T.ink, scale: sc });
      if (p.crit && k < 0.8) ui.text('CRIT', x, y - 9 * sc, '#fff0a0', { align: 'center', outline: T.ink, mini: true });
    }
  }
  cries(ui) {
    const b = this.b, w = this.app.world, q = this.q;
    for (const c of b.cries) {
      const rr = c.r; if (!rr.a.g.visible || c.t > 1.1) continue;
      const s = w.project(b.wpos(rr.u, b.height(rr) + 0.45)); if (!s.vis) continue;
      const k = Math.min(1, c.t * 8), bw = ui.tw(c.text) + 10, x = Math.round(s.x - bw / 2), y = Math.round(s.y - 18 - k * 3);
      this.cham(x - q, y - q, bw + 2 * q, 13 + 2 * q, 2, T.ink); this.cham(x, y, bw, 13, 2, '#ffffff'); ui.text(c.text, x + 5, y + 3, T.paperText);
      const cx = Math.round(s.x); this.r(cx - 2, y + 13, 4, 1, '#ffffff'); this.r(cx - 1, y + 14, 2, 1, '#ffffff'); this.r(cx - 3, y + 13, 1, 1, T.ink); this.r(cx + 2, y + 13, 1, 1, T.ink); this.r(cx - 2, y + 14, 1, 1, T.ink); this.r(cx + 1, y + 14, 1, 1, T.ink); this.r(cx - 1, y + 15, 2, 1, T.ink);
    }
  }
}
