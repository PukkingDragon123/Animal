// TIDE POOL ARCADE — REEF RUMBLE, a 60-second pixel arcade game played on the 3D cabinet outside the arcade on
// Bayside Pier (a first-person view of the cabinet; the stick and buttons move with your hands).
// You are Kani, a little crab on the sand at the bottom of a tide pool. Catch the pearls and starfish that sink
// down (every catch in a row raises the multiplier), blow bubbles (SPACE) to pop jellies before they sting, and
// keep out from under the urchins. A golden shell sends you into FEVER (double points). Three hearts.
import * as THREE from '../../../../vendor/three.module.js';
import { T } from '../../../px/game/ui.js';
import { V3, clamp, clamp01, lerp, fmt, canvasTex, keyRow, worldText } from './kit.js';
import { SCREEN } from './cabinet.js';

const W = SCREEN.w, H = SCREEN.h, SAND = 104, ROUND = 60;
const PAL = { sea0: '#06163a', sea1: '#0a2450', sea2: '#0e3a6a', sand: '#e8c890', sand2: '#c8a870', ink: '#0a0816', white: '#ffffff', pearl: '#f4f0ff', pearl2: '#b8c0e8', star: '#ffc93a', star2: '#e8902a', jelly: '#ff74c0', jelly2: '#c84a9a', urch: '#3a2a5a', urch2: '#8a6ad8', crab: '#ff5a4a', crab2: '#c8382e', gold: '#ffe066', bub: '#bfeaff' };

export default class Arcade {
  static howto = 'Catch pearls and starfish with Kani the crab, blow bubbles to pop jellies, dodge the urchins. Three hearts, sixty seconds!';
  static keys = [['◀ ▶', 'Move'], ['SPACE', 'Bubble']];
  static ranks = [4500, 2500, 1200];
  static rewards(res, o) {
    const items = []; if (res.score >= 2500) items.push(['ramune', 1]); if (o.record && res.score >= 1200) items.push(['quartz', 1]);
    return { money: Math.round(res.score * 0.15), friend: (res.score >= 2500 ? 3 : 2) + (o.record ? 1 : 0), items };
  }
  constructor(sess) { this.s = sess; this.prefer = 90; }

  async setup() {
    const s = this.s, cab = s.mg.cabinet;
    this.cab = cab;
    this.tex = canvasTex(W, H, null); this.g = this.tex.userData.g;
    if (cab) { this.prevMap = cab.userData.screen.material.map; cab.userData.screen.material.map = this.tex; cab.userData.screen.material.needsUpdate = true; }
    const cp = cab ? cab.position : new V3(156.05, 0.36, 5.0);
    this.cp = cp.clone();
    this.screenW = cab ? cab.localToWorld(cab.userData.screenAt.clone()) : new V3(cp.x + 0.07, cp.y + 1.29, cp.z);
    if (s.hero) { s.hero.place(cp.x + 0.95, cp.z, -Math.PI / 2, cp.y); s.hero.play('idle'); }
    if (s.partner) { s.partner.place(cp.x + 0.85, cp.z + 0.85, -Math.PI * 0.7, cp.y); s.partner.play('idle'); }
    this.reset(); this.paint();
  }
  async intro(cin) {
    const s = this.s, c = this.screenW, V = (x, y, z) => new V3(x, y, z);
    await cin.cut({ target: V(c.x, c.y - 0.2, c.z - 1), dist: 9, yaw: 120, pitch: 16 });
    cin.move({ target: V(c.x + 0.4, c.y - 0.1, c.z), dist: 2.6, yaw: 70, pitch: 10 }, { dur: 2.8 });
    await s.app.wait(2300);
    s.audio.sfx('coin', { pitch: 0.9 }); setTimeout(() => s.audio.sfx('gacha'), 350);
    if (s.hero) s.hero.play('point', { restart: true });
    await cin.move({ target: c.clone(), dist: 1.0, yaw: 90, pitch: 17 }, { dur: 1.0 });
    if (s.hero) s.hero.g.visible = false;
  }
  reset() {
    this.t = ROUND; this.score = 0; this.lives = 3; this.mult = 1; this.chain = 0; this.fever = 0; this.over = false; this.inv = 0;
    this.x = W / 2; this.vx = 0; this.bubs = []; this.things = []; this.parts = []; this.texts = []; this.spawnT = 0.6; this.shk = 0; this.flash = 0; this.cool = 0;
    this.stats = { pearls: 0, stars: 0, jellies: 0, gold: 0 }; this.started = false; this.blink = 0;
    if (this.s.hero && this.s.phase !== 'intro' && this.s.phase !== 'init') this.s.hero.g.visible = false;
    this.cam(true);
  }
  start() { this.started = true; this.s.audio.music('e4_ringo', { fade: 0.5, restart: true }); if (this.s.hero) this.s.hero.g.visible = false; }
  // ================================================================ the game
  spawn() {
    const r = this.s.rand, prog = clamp01((ROUND - this.t) / ROUND), u = r();
    let kind = u < 0.5 ? 'pearl' : u < 0.66 ? 'star' : u < 0.84 ? 'jelly' : u < 0.985 ? 'urchin' : 'gold';
    if (prog < 0.15 && kind === 'urchin') kind = 'pearl';
    const sp = { pearl: 22, star: 18, jelly: 12, urchin: 34, gold: 20 }[kind] * (1 + prog * 0.9);
    this.things.push({ kind, x: 8 + r() * (W - 16), y: -8, vy: sp, ph: r() * 6, hp: kind === 'urchin' ? 2 : 1, r: { pearl: 3, star: 4, jelly: 5, urchin: 5, gold: 4 }[kind] });
  }
  update(dt, inp, live) {
    const s = this.s;
    this.cam(false);
    this.pressAnim(inp, dt);
    if (live && this.started && !this.over) this.step(dt, inp);
    for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; } this.parts = this.parts.filter((p) => p.t < p.life);
    for (const q of this.texts) { q.t += dt; q.y -= 14 * dt; } this.texts = this.texts.filter((q) => q.t < 0.9);
    this.shk = Math.max(0, this.shk - dt * 3); this.flash = Math.max(0, this.flash - dt * 3); this.blink += dt;
    this.paint();
  }
  step(dt, inp) {
    const s = this.s, A = s.audio, r = s.rand;
    this.t -= dt; if (this.fever > 0) this.fever -= dt; if (this.inv > 0) this.inv -= dt; this.cool -= dt;
    if (this.t <= 5 && Math.ceil(this.t) !== Math.ceil(this.t + dt) && this.t > 0) A.sfx('ui_tap', { pitch: 1.8, vol: 0.7 });
    // Kani: quick on the sand, a little slide
    const want = (inp.R ? 1 : 0) - (inp.L ? 1 : 0);
    this.vx += (want * 120 - this.vx) * Math.min(1, dt * 12); this.x = clamp(this.x + this.vx * dt, 8, W - 8);
    if (((inp.tap && !inp.edgeTap) || inp.up) && this.cool <= 0 && this.bubs.length < 3) { this.cool = 0.22; this.bubs.push({ x: this.x, y: SAND - 10, t: 0 }); A.sfx('bubble', { pitch: 1.5 }); }
    for (const b of this.bubs) { b.t += dt; b.y -= 110 * dt; b.x += Math.sin(b.t * 18) * 0.6; }
    this.bubs = this.bubs.filter((b) => b.y > -6 && !b.hit);
    // things sink
    this.spawnT -= dt; if (this.spawnT <= 0) { const prog = clamp01((ROUND - this.t) / ROUND); this.spawnT = lerp(0.85, 0.38, prog) * (0.7 + r() * 0.6); this.spawn(); if (r() < prog * 0.4) this.spawn(); }
    for (const o of this.things) {
      o.ph += dt; o.y += o.vy * dt;
      if (o.kind === 'jelly') { o.x += Math.sin(o.ph * 2.4) * 18 * dt; o.y += Math.sin(o.ph * 4) * 6 * dt; }
      if (o.kind === 'star' || o.kind === 'gold') o.x += Math.sin(o.ph * 1.6) * 6 * dt;
      o.x = clamp(o.x, 4, W - 4);
      // bubbles pop jellies (and crack urchins)
      for (const b of this.bubs) if (!b.hit && Math.abs(b.x - o.x) < o.r + 3 && Math.abs(b.y - o.y) < o.r + 3) {
        if (o.kind === 'jelly') { b.hit = true; o.dead = true; this.stats.jellies++; this.gain(30, o.x, o.y, true); this.burst(o.x, o.y, PAL.jelly, 10); A.sfx('hit_light', { pitch: 1.6 }); this.things.push({ kind: 'pearl', x: o.x - 4, y: o.y, vy: 26, ph: 0, hp: 1, r: 3 }, { kind: 'pearl', x: o.x + 4, y: o.y, vy: 26, ph: 1, hp: 1, r: 3 }); }
        else if (o.kind === 'urchin') { b.hit = true; o.hp--; this.burst(o.x, o.y, PAL.urch2, 5); A.sfx('parry', { pitch: 1.5, vol: 0.6 }); if (o.hp <= 0) { o.dead = true; this.gain(80, o.x, o.y, true); this.burst(o.x, o.y, PAL.urch2, 14); A.sfx('crit', { vol: 0.6, pitch: 1.4 }); this.shk = 0.4; } }
      }
      // Kani catches (or gets stung)
      if (!o.dead && o.y > SAND - 12 && o.y < SAND && Math.abs(o.x - this.x) < o.r + 7) {
        o.dead = true;
        if (o.kind === 'pearl') { this.stats.pearls++; this.gain(10, o.x, o.y); this.burst(o.x, o.y, PAL.pearl, 6); A.sfx('coin', { pitch: 1.2 + Math.min(1.2, this.chain * 0.05), vol: 0.6 }); }
        else if (o.kind === 'star') { this.stats.stars++; this.gain(50, o.x, o.y); this.burst(o.x, o.y, PAL.star, 10); A.sfx('sparkle', { pitch: 1.3 }); }
        else if (o.kind === 'gold') { this.stats.gold++; this.fever = 6; this.gain(150, o.x, o.y); this.burst(o.x, o.y, PAL.gold, 24); A.sfx('charge_release'); this.flash = 0.8; s.shake(0.02); this.text('FEVER!', W / 2, 50, PAL.gold); }
        else this.hurt(o);
      }
      if (!o.dead && o.y > SAND + 2) { o.dead = true; if (o.kind === 'pearl' || o.kind === 'star') { if (this.chain > 0) this.text('MISS', o.x, SAND - 4, '#ff9a9a'); this.chain = 0; this.mult = 1; } else this.burst(o.x, SAND, PAL.sand2, 4); }
    }
    this.things = this.things.filter((o) => !o.dead);
    if (this.t <= 0 || this.lives <= 0) this.end();
  }
  gain(pts, x, y, pop) {
    this.chain++; if (this.chain % 5 === 0 && this.mult < 8) { this.mult++; this.text('×' + this.mult, this.x, SAND - 22, PAL.gold); this.s.audio.sfx('combo', { pitch: 1 + this.mult * 0.05 }); }
    const v = pts * this.mult * (this.fever > 0 ? 2 : 1); this.score += v; this.text('+' + v, x, y - 6, pop ? PAL.jelly : PAL.white);
  }
  hurt(o) {
    if (this.inv > 0) return;
    const s = this.s; this.lives--; this.inv = 1.4; this.chain = 0; this.mult = 1; this.shk = 1; this.flash = 0.6;
    this.burst(this.x, SAND - 4, o.kind === 'jelly' ? PAL.jelly : PAL.urch2, 16); s.audio.sfx('hurt'); s.audio.sfx('hit_heavy', { vol: 0.6 }); s.shake(0.03); s.punch(2);
    this.text(this.lives > 0 ? 'OUCH!' : 'K.O.', this.x, SAND - 24, '#ff9a9a');
  }
  end() {
    if (this.over) return; this.over = true;
    const st = this.stats, s = this.s;
    s.audio.sfx(this.lives > 0 ? 'ui_confirm' : 'ko');
    setTimeout(() => s.end({ banner: this.lives > 0 ? 'TIME UP!' : 'GAME OVER', score: this.score, lines: [`Pearls ${st.pearls}  ·  starfish ${st.stars}  ·  jellies popped ${st.jellies}`, `Golden shells ${st.gold}  ·  hearts left ${Math.max(0, this.lives)}`, 'HI-SCORE goes on the cabinet!'] }), 700);
  }
  burst(x, y, c, n) { const r = this.s.rand; for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (r() - 0.5) * 90, vy: -30 - r() * 60, c, t: 0, life: 0.4 + r() * 0.4 }); }
  text(str, x, y, c) { this.texts.push({ str, x, y, c, t: 0 }); }
  // ================================================================ the cabinet's controls move with you
  pressAnim(inp, dt) {
    const cab = this.cab; if (!cab) return;
    const U = cab.userData, tilt = ((inp.R ? 1 : 0) - (inp.L ? 1 : 0)) * 0.45;
    U.stick.rotation.z += (-tilt - U.stick.rotation.z) * Math.min(1, dt * 18);
    const down = inp.hold || inp.up; U.buttons[0].position.y += ((down ? 0.955 : 0.965) - U.buttons[0].position.y) * Math.min(1, dt * 30);
  }
  // ================================================================ the pixel picture
  paint() {
    const g = this.g, P = PAL, t = this.s.t, sx = Math.round((Math.random() - 0.5) * this.shk * 6), sy = Math.round((Math.random() - 0.5) * this.shk * 4);
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x) + sx, Math.round(y) + sy, w, h); };
    // the sea: bands, light rays, drifting motes
    for (let y = 0; y < H; y += 4) R(0, y, W, 4, y < 30 ? P.sea0 : y < 70 ? P.sea1 : P.sea2);
    for (let i = 0; i < 4; i++) { const x0 = ((i * 47 + t * 6) % (W + 40)) - 20; for (let y = 0; y < 90; y += 2) R(x0 + y * 0.35, y, 3, 1, 'rgba(120,200,255,0.10)'); }
    for (let i = 0; i < 18; i++) R((i * 37 + t * 4 * (1 + (i % 3))) % W, (i * 23 + Math.sin(t + i) * 3 + 200) % 96, 1, 1, i % 3 ? '#2a5a8a' : '#5ab0e0');
    // seaweed and the sand
    for (const [x, c] of [[14, '#2a8a4a'], [22, '#3aa05a'], [138, '#2a8a4a'], [146, '#3aa05a']]) for (let y = 0; y < 18; y++) R(x + Math.round(Math.sin(t * 2 + y * 0.4 + x) * 2), SAND - y, 2, 1, c);
    R(0, SAND, W, H - SAND, P.sand); for (let x = 0; x < W; x += 5) R(x, SAND + 2 + (x % 3), 2, 1, P.sand2);
    R(30, SAND + 6, 4, 3, '#f4a0b0'); R(120, SAND + 8, 3, 2, '#f4f0e6');
    // things
    for (const o of this.things) this.sprite(o.kind, o.x, o.y, o.ph, R);
    for (const b of this.bubs) { R(b.x - 2, b.y - 2, 5, 1, P.bub); R(b.x - 2, b.y + 2, 5, 1, P.bub); R(b.x - 3, b.y - 1, 1, 3, P.bub); R(b.x + 3, b.y - 1, 1, 3, P.bub); R(b.x - 1, b.y - 1, 1, 1, P.white); }
    // Kani
    if (!(this.inv > 0 && Math.floor(this.blink * 16) % 2)) this.crab(this.x, SAND - 1, R);
    for (const p of this.parts) R(p.x, p.y, 1 + (p.t < 0.15 ? 1 : 0), 1 + (p.t < 0.15 ? 1 : 0), p.c);
    g.font = '8px "TKSilkscreen", monospace'; g.textBaseline = 'top';
    for (const q of this.texts) { g.textAlign = 'center'; g.fillStyle = P.ink; g.fillText(q.str, q.x + 1 + sx, q.y + 1 + sy); g.fillStyle = q.c; g.fillText(q.str, q.x + sx, q.y + sy); }
    // HUD: score, hi, hearts, time, multiplier
    g.textAlign = 'left'; g.fillStyle = P.ink; g.fillRect(0, 0, W, 11); g.fillStyle = P.white; g.fillText(String(this.score).padStart(6, '0'), 3, 2);
    g.fillStyle = '#5ae0ff'; g.textAlign = 'center'; g.fillText('HI ' + String(Math.max(this.score, this.s.mg.best('arcade') || 0)).padStart(6, '0'), W / 2 + 4, 2);
    for (let i = 0; i < 3; i++) this.heart(W - 10 - i * 9, 3, i < this.lives, R);
    const tw = Math.round((W - 6) * clamp01(this.t / ROUND)); R(3, H - 3, W - 6, 2, '#1a1030'); R(3, H - 3, tw, 2, this.t < 10 ? '#ff5a4a' : '#5ae0ff');
    if (this.mult > 1 || this.fever > 0) { g.textAlign = 'left'; g.fillStyle = this.fever > 0 ? P.gold : '#ff74c0'; g.fillText((this.fever > 0 ? 'FEVER ' : '') + '×' + this.mult * (this.fever > 0 ? 2 : 1), 3, 13); }
    if (!this.started) { g.textAlign = 'center'; g.fillStyle = P.ink; g.fillText('READY?', W / 2 + 1, 51); g.fillStyle = P.gold; g.fillText('READY?', W / 2, 50); }
    if (this.over) { g.textAlign = 'center'; g.fillStyle = P.ink; g.fillRect(30, 44, 100, 24); g.fillStyle = this.lives > 0 ? P.gold : '#ff5a4a'; g.fillText(this.lives > 0 ? 'TIME UP!' : 'GAME OVER', W / 2, 48); g.fillStyle = P.white; g.fillText(String(this.score), W / 2, 57); }
    // CRT: scanlines + a flash
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 1; y < H; y += 2) g.fillRect(0, y, W, 1);
    if (this.flash > 0) { g.fillStyle = `rgba(255,240,200,${(this.flash * 0.5).toFixed(2)})`; g.fillRect(0, 0, W, H); }
    this.tex.needsUpdate = true;
  }
  sprite(kind, x, y, ph, R) {
    const P = PAL;
    if (kind === 'pearl') { R(x - 1, y - 2, 3, 5, P.pearl); R(x - 2, y - 1, 5, 3, P.pearl); R(x + 1, y, 1, 2, P.pearl2); R(x - 1, y - 1, 1, 1, P.white); }
    else if (kind === 'star' || kind === 'gold') {
      const c = kind === 'gold' ? P.gold : P.star, c2 = kind === 'gold' ? '#fff8c0' : P.star2, k = Math.floor(ph * 4) % 2;
      R(x - 1, y - 4, 3, 9, c); R(x - 4, y - 1, 9, 3, c); R(x - 3 + k, y - 3 + k, 2, 2, c); R(x + 2 - k, y - 3 + k, 2, 2, c); R(x - 3 + k, y + 2 - k, 2, 2, c); R(x + 2 - k, y + 2 - k, 2, 2, c); R(x, y, 1, 1, c2);
      if (kind === 'gold' && Math.floor(ph * 8) % 2) R(x + 4, y - 5, 1, 1, P.white);
    } else if (kind === 'jelly') {
      R(x - 4, y - 4, 9, 4, P.jelly); R(x - 3, y - 5, 7, 1, P.jelly); R(x - 2, y - 3, 2, 1, P.white); R(x - 4, y, 9, 1, P.jelly2);
      for (let i = 0; i < 4; i++) R(x - 3 + i * 2, y + 1 + (Math.floor(ph * 6 + i) % 2), 1, 3, P.jelly2);
    } else if (kind === 'urchin') {
      R(x - 3, y - 3, 7, 7, P.urch); R(x - 1, y - 1, 2, 2, P.urch2);
      for (const [dx, dy] of [[0, -5], [0, 5], [-5, 0], [5, 0], [-4, -4], [4, -4], [-4, 4], [4, 4]]) R(x + dx, y + dy, 1, 1, P.urch2);
      R(x - 1, y - 1, 1, 1, '#ff5a4a'); R(x + 1, y - 1, 1, 1, '#ff5a4a');
    }
  }
  crab(x, y, R) {
    const P = PAL, k = Math.floor(this.s.t * (Math.abs(this.vx) > 10 ? 14 : 3)) % 2;
    R(x - 5, y - 6, 11, 5, P.crab); R(x - 4, y - 7, 9, 1, P.crab); R(x - 5, y - 2, 11, 1, P.crab2);
    R(x - 3, y - 10, 1, 3, P.crab2); R(x + 3, y - 10, 1, 3, P.crab2); R(x - 4, y - 11, 2, 2, P.white); R(x + 3, y - 11, 2, 2, P.white); R(x - 3, y - 11, 1, 1, P.ink); R(x + 4, y - 11, 1, 1, P.ink);
    R(x - 9, y - 8 - k, 3, 3, P.crab); R(x + 7, y - 8 - k, 3, 3, P.crab); R(x - 9, y - 9 - k, 1, 1, P.crab2); R(x + 9, y - 9 - k, 1, 1, P.crab2);
    for (let i = 0; i < 3; i++) { R(x - 6 + i * 2 - k, y - 1, 1, 2, P.crab2); R(x + 2 + i * 2 + k, y - 1, 1, 2, P.crab2); }
    R(x - 1, y - 5, 3, 1, P.ink);
  }
  heart(x, y, on, R) { const c = on ? '#ff5a6a' : '#3a2a4a'; R(x, y, 2, 1, c); R(x + 3, y, 2, 1, c); R(x - 1, y + 1, 7, 2, c); R(x, y + 3, 5, 1, c); R(x + 1, y + 4, 3, 1, c); R(x + 2, y + 5, 1, 1, c); }
  // ================================================================ camera + 2D overlay
  cam(snap) { const c = this.screenW; if (c) this.s.look(c.clone().add(new V3(0, -0.02, 0)), 0.98, 90, 17, 42, { rate: 6, snap }); }
  draw(ui) {
    const s = this.s, Wd = ui.w, Hd = ui.h;
    if (s.live && !this.over) keyRow(ui, Wd / 2, Hd - 20, [['◀ ▶', 'Move'], ['SPACE', 'Bubble']]);
    if (this.over) worldText(ui, '', 0, 0);
  }
  bot(inp) {
    // chase the nearest pearl / star / gold that is falling, step away from urchins, bubble jellies overhead
    let tgt = null, best = 1e9, danger = 0;
    for (const o of this.things) {
      if (o.kind === 'urchin' && o.y > 40 && Math.abs(o.x - this.x) < 14) danger = o.x < this.x ? 1 : -1;
      if ((o.kind === 'pearl' || o.kind === 'star' || o.kind === 'gold') && o.y > 20) { const d = (SAND - o.y) / o.vy * 120 - Math.abs(o.x - this.x); const sc = Math.abs(o.x - this.x) + (SAND - o.y) * 0.3; if (sc < best && d > -20) { best = sc; tgt = o; } }
      if (o.kind === 'jelly' && Math.abs(o.x - this.x) < 6 && o.y < SAND - 20) inp.tap = true;
    }
    if (danger) { if (danger > 0) inp.R = true; else inp.L = true; return; }
    if (tgt) { if (tgt.x > this.x + 2) inp.R = true; else if (tgt.x < this.x - 2) inp.L = true; }
  }
  debug() { return { t: +this.t.toFixed(1), score: this.score, lives: this.lives, mult: this.mult, things: this.things.length, stats: this.stats }; }
  dispose() {
    const cab = this.cab; if (cab && this.prevMap) { cab.userData.screen.material.map = this.prevMap; cab.userData.screen.material.needsUpdate = true; cab.userData.stick.rotation.z = 0; }
    if (this.tex) this.tex.dispose();
  }
}
void T; void fmt;
