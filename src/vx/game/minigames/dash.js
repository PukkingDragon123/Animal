// TOKON DASH — your partner races three Tokonmon down Steiner Walk (the cobbled lane in front of the Painted
// Ladies), round the cones and back: 100 m, five rows of hurdles each way.
// One button. Tap on the beat (the rings close on the centre mark) and your partner strides faster; miss the
// beat and it stumbles. When a hurdle's marker reaches the jump zone, tap to jump — the gold window is a
// perfect jump with a burst of speed; no jump means a crash. Fill the FEVER meter with an on-beat streak.
import * as THREE from '../../../../vendor/three.module.js';
import { T } from '../../../px/game/ui.js';
import { SPECIES } from '../../../data/species.js';
import { V3, clamp, clamp01, lerp, easeOut, boing, fmtTime, drawClock, drawCombo, keyRow, boxes, canvasTex, picture, cyl, WHITE, worldText } from './kit.js';

const LANES = [16.35, 15.45, 14.55, 13.65], Z0 = 40.0, LEG = 50, RACE = 100, HURDLES = [9, 17, 25, 33, 41];
const V0 = 4.6, VMAX = 8.4, BPM = 120, JUMP = [0.45, 2.1], PERFECT = [0.85, 1.5];
const RIVALS = ['pidgun', 'cabbunny', 'lemmo', 'zapanda', 'trashcoon', 'strawbaa', 'kappachi', 'zapkit', 'gradcub'];
const PLACE = ['1st', '2nd', '3rd', '4th'];

export default class Dash {
  static howto = 'Tap on the beat to run faster. Tap again as a hurdle reaches the jump zone — gold is a perfect jump!';
  static keys = [['SPACE', 'Stride on the beat · Jump']];
  static rank(res) { if (!res.finished) return 'D'; return res.place === 1 ? (res.perfects >= 12 ? 'S' : 'A') : res.place === 2 ? 'B' : res.place === 3 ? 'C' : 'D'; }
  static rewards(res, o) {
    const p = res.place || 4, items = [];
    if (p === 1 && !o.mem.firsts.dashWin) { o.mem.firsts.dashWin = true; items.push(['protein_mochi', 1]); }
    if (p === 1) items.push(['ramune', 1]);
    return { money: [600, 300, 150, 60][p - 1] + (res.perfects || 0) * 10, friend: [5, 4, 3, 2][p - 1] + (o.record ? 1 : 0), items };
  }
  constructor(sess) { this.s = sess; this.prefer = 90; }

  // ================================================================ the set
  async setup() {
    const s = this.s, root = s.root, gy = s.ground(15, 60, 0);
    this.gy = gy;
    const lines = [], zA = Z0 - 1.2, zB = Z0 + LEG + 1.5;
    for (const x of [16.82, 15.92, 15.02, 14.12, 13.22]) lines.push([x - 0.03, gy + 0.005, zA, x + 0.03, gy + 0.025, zB, '#f4f0e6']);
    // start / finish: a checkered strip; the turn: a painted line
    for (let i = 0; i < 18; i++) for (let j = 0; j < 2; j++) lines.push([13.22 + i * 0.2, gy + 0.006, Z0 + j * 0.2 - 0.2, 13.42 + i * 0.2, gy + 0.03, Z0 + j * 0.2, (i + j) % 2 ? '#1c1838' : '#f4f0e6']);
    lines.push([13.22, gy + 0.005, Z0 + LEG - 0.05, 16.82, gy + 0.028, Z0 + LEG + 0.05, '#ffc93a']);
    root.add(boxes(lines, { shadow: false }));
    // the arch over the start line
    const banner = canvasTex(128, 24, (g, w, h) => {
      g.fillStyle = '#2b1a17'; g.fillRect(0, 0, w, h); g.fillStyle = '#4cc04a'; g.fillRect(2, 2, w - 4, h - 4);
      for (let x = 2; x < w - 2; x += 8) { g.fillStyle = (x / 8) % 2 ? '#f4f0e6' : '#2b1a17'; g.fillRect(x, h - 6, 4, 2); g.fillRect(x + 4, h - 4, 4, 2); }
      g.font = 'bold 13px "Trebuchet MS", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1c5a1a'; g.fillText('TOKON DASH', w / 2 + 1, 10); g.fillStyle = '#ffffff'; g.fillText('TOKON DASH', w / 2, 9);
    });
    const arch = new THREE.Group(); arch.position.set(15.0, gy, Z0 - 0.4);
    arch.add(boxes([[-2.2, 0, -0.08, -2.05, 2.6, 0.08, '#e8e4dc'], [2.05, 0, -0.08, 2.2, 2.6, 0.08, '#e8e4dc'], [-2.25, 2.55, -0.1, 2.25, 2.62, 0.1, '#2b1a17']]));
    for (const sgn of [1, -1]) { const p = picture(banner, 4.2, 0.78, { lit: true }); p.position.set(0, 2.2, sgn * 0.09); if (sgn < 0) p.rotation.y = Math.PI; arch.add(p); }
    root.add(arch);
    // cones at the turn, hurdles across the lanes
    for (const x of LANES) { const c = cyl(0.02, 0.13, 0.42, '#f0702a', 8); c.position.set(x, gy + 0.21, Z0 + LEG + 0.9); root.add(c); const band = cyl(0.07, 0.09, 0.08, '#f4f0e6', 8); band.position.set(x, gy + 0.24, Z0 + LEG + 0.9); root.add(band); }
    this.hurdles = [];
    for (const d of HURDLES) {
      const row = [];
      for (let i = 0; i < 4; i++) {
        const g = new THREE.Group(); g.position.set(LANES[i], gy, Z0 + d);
        const bar = []; for (let k = 0; k < 6; k++) bar.push([-0.38 + k * 0.127, 0.3, -0.03, -0.38 + (k + 1) * 0.127, 0.38, 0.03, k % 2 ? '#e8283a' : '#f4f0e6']);
        g.add(boxes([[-0.42, 0, -0.03, -0.37, 0.4, 0.03, '#d8d4cc'], [0.37, 0, -0.03, 0.42, 0.4, 0.03, '#d8d4cc'], [-0.44, 0, -0.18, -0.35, 0.03, 0.18, '#3a3a40'], [0.35, 0, -0.18, 0.44, 0.03, 0.18, '#3a3a40'], ...bar]));
        root.add(g); row.push({ g, down: 0, fell: false });
      }
      this.hurdles.push({ d, row });
    }
    // the runners: your partner in lane 0 (nearest the camera), three rivals
    const partnerSp = (s.lead && s.lead.species) || 'chilichick';
    const pool = RIVALS.filter((id) => id !== partnerSp && SPECIES[id]);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(s.rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    this.runners = [];
    const P = s.partner;
    if (P) { P.place(LANES[0], Z0 - 0.6, 0, gy); this.runners.push({ a: P, me: true, name: s.partnerName }); }
    for (let i = 0; i < 3; i++) { const a = await s.mon(pool[i], [LANES[i + 1], Z0 - 0.6, 0, gy]); this.runners.push({ a, me: false, name: SPECIES[pool[i]].name }); }
    if (!P) { const a = await s.mon(partnerSp, [LANES[0], Z0 - 0.6, 0, gy]); this.runners.unshift({ a, me: true, name: s.partnerName }); }
    this.me = this.runners[0];
    if (s.hero) { s.hero.place(18.3, Z0 + 1.2, -Math.PI / 2, gy); s.hero.play('cheer'); }
    this.marshal = s.w.actor('mgMarshal');
  }
  async intro(cin) {
    const s = this.s, V = (x, y, z) => new V3(x, y, z), gy = this.gy;
    await cin.cut({ target: V(14, gy + 1, Z0 + 26), dist: 46, yaw: 120, pitch: 34 });
    cin.move({ target: V(15, gy + 0.6, Z0 - 0.4), dist: 8.5, yaw: 150, pitch: 12 }, { dur: 3.4 });
    for (const r of this.runners) r.a.play(r.me ? 'dance' : 'idle', { restart: true });
    if (this.marshal) { this.marshal.faceTo(15, Z0); this.marshal.play('point'); }
    await s.app.wait(2600);
    cin.frame(this.me.a, { dist: 2.6, rel: 0, pitch: 6, dur: 0.6, hold: 3, at: 'chest' });
    this.me.a.play('win', { restart: true });
    await s.app.wait(900);
  }
  reset() {
    this.time = 0; this.started = false; this.combo = 0; this.bestCombo = 0; this.comboT = 9; this.perfects = 0; this.fever = 0; this.feverT = 0;
    this.lastBeat = -9; this.tapBeat = -9; this.clock = 0; this.msg = null; this.order = []; this.done = false; this.endT = 0; this.ringK = 0;
    for (const r of this.runners) {
      r.p = -0.6; r.v = 0; r.vb = 0; r.jump = -1; r.stun = 0; r.fin = null; r.next = 0; r.leg = 0; r.flip = 0; r.cleared = new Set();
      r.base = r.me ? V0 : 5.1 + this.s.rand() * 0.75; r.skill = r.me ? 1 : 0.8 + this.s.rand() * 0.15; r.ph = this.s.rand() * 6;
      r.a.place(LANES[this.runners.indexOf(r)], Z0 - 0.6, 0, this.gy); r.a.play('idle', { fade: 0 });
    }
    for (const H of this.hurdles) for (const h of H.row) { h.down = 0; h.fell = false; h.g.rotation.set(0, 0, 0); }
    this.cam(true);
  }
  start() {
    this.started = true; const A = this.s.audio;
    A.music('league', { fade: 0.2, restart: true }); A.sfx('crit', { vol: 0.8 });
    for (const r of this.runners) { r.v = r.me ? V0 * 0.8 : r.base * 0.8; r.a.play('walk', { restart: true }); }
    this.t0 = this.s.t;
  }
  /** the beat clock: the music's own when it's playing, else our metronome */
  beat() { const c = this.s.simulating ? null : this.s.audio.clock('league'); if (c) { this.synced = true; return c.beat; } this.synced = false; return (this.clock || 0) * BPM / 60; }
  // ================================================================ per frame
  update(dt, inp, live) {
    const s = this.s;
    for (const H of this.hurdles) for (const h of H.row) if (h.fell && h.down < 1) { h.down = Math.min(1, h.down + dt * 4); h.g.rotation.x = -easeOut(h.down) * 1.45 * (h.dir || 1); }
    this.comboT += dt; if (this.msg) { this.msg.t += dt; if (this.msg.t > this.msg.dur) this.msg = null; }
    this.ringK = Math.max(0, this.ringK - dt * 3);
    if (!this.started) { this.cam(false); return; }
    if (live) { this.time += dt; this.clock = (this.clock || 0) + dt; }
    const b = this.beat();
    if (Math.floor(b) !== Math.floor(this.lastBeat)) { this.onBeat(Math.floor(b)); }
    this.lastBeat = b;
    if (live && inp.tap && !this.me.fin) this.tap(b);
    for (const r of this.runners) this.run(r, dt, live);
    this.fever = Math.max(0, this.fever - dt * (this.feverT > 0 ? 0.25 : 0.02)); this.feverT = Math.max(0, this.feverT - dt);
    // the finish: the race ends 4 s after your partner crosses (or when everyone has)
    if (this.me.fin != null && !this.done) { this.endT += dt; if (this.endT > 3.5 || this.runners.every((r) => r.fin != null)) this.finish(); }
    if (live && this.time > 75 && !this.done) { this.me.fin = null; this.finish(); }
    this.cam(false);
  }
  onBeat(n) {
    const s = this.s;
    if (!this.synced && this.started && !this.me.fin) s.audio.sfx('ui_tap', { vol: 0.3, pitch: n % 4 === 0 ? 1.3 : 1.0 });
    // strides you didn't tap slowly sap the pace
    if (n - this.tapBeat > 2 && !this.me.fin && this.me.jump < 0) { this.me.vb = Math.max(-0.6, this.me.vb - 0.12); if (this.combo > 0 && n - this.tapBeat > 3) { this.combo = 0; } }
  }
  tap(b) {
    const s = this.s, r = this.me;
    if (r.jump >= 0 || r.stun > 0) return;
    // a hurdle in reach? then this tap is a jump
    const h = this.nextHurdle(r);
    if (h && h.gap < JUMP[1] && h.gap > JUMP[0] * 0.5) {
      const perfect = h.gap >= PERFECT[0] && h.gap <= PERFECT[1];
      this.jump(r, perfect);
      if (perfect) { this.perfects++; r.vb = Math.min(2.4, r.vb + 1.0); s.audio.sfx('qte_perfect'); s.punch(5); s.pop('PERFECT JUMP!', this.popAt(r, 1.2), { scale: 1, grad: [WHITE, T.amber] }); this.combo++; this.fever = Math.min(1, this.fever + 0.14); }
      else { s.audio.sfx('qte_good'); s.pop('JUMP', this.popAt(r, 1.1), { grad: [WHITE, T.cyan] }); this.combo++; this.fever = Math.min(1, this.fever + 0.06); }
      this.bumpCombo(); this.tapBeat = Math.round(b);
      return;
    }
    // else a stride on the beat
    const off = b - Math.round(b), a = Math.abs(off), nb = Math.round(b);
    if (nb === this.tapBeat) { this.offBeat('TOO MANY!'); return; }
    this.tapBeat = nb;
    if (a < 0.13) { r.vb = Math.min(2.4, r.vb + 0.55); this.combo++; this.fever = Math.min(1, this.fever + 0.07); s.audio.sfx('qte_perfect', { vol: 0.5, pitch: 1 + Math.min(0.5, this.combo * 0.02) }); s.burst('note', this.popAt3(r, 0.9), { n: 1 }); this.ringK = 1; if (this.combo % 4 === 0) s.pop('PERFECT ×' + this.combo, this.popAt(r, 1.4), { grad: [WHITE, T.amber] }); }
    else if (a < 0.24) { r.vb = Math.min(2.4, r.vb + 0.28); this.combo++; this.fever = Math.min(1, this.fever + 0.035); s.audio.sfx('qte_good', { vol: 0.45 }); this.ringK = 0.6; }
    else this.offBeat(off < 0 ? 'EARLY' : 'LATE');
    this.bumpCombo();
    if (this.fever >= 1 && this.feverT <= 0) { this.feverT = 4.2; s.audio.sfx('charge_release'); s.banner('FEVER!', { dur: 1.1, scale: 4, grad: [WHITE, T.coral] }); s.punch(7); s.flash('#ffe8a0', 0.25, 0.35); }
  }
  offBeat(text) { const s = this.s, r = this.me; r.vb = Math.max(-1.6, r.vb - 0.9); this.combo = 0; s.audio.sfx('qte_miss', { vol: 0.6 }); s.pop(text, this.popAt(r, 1.1), { color: '#ffd2dc' }); s.shake(0.03); }
  bumpCombo() { this.bestCombo = Math.max(this.bestCombo, this.combo); this.comboT = 0; }
  /** the next standing hurdle ahead of a runner: { H, h, gap (m) } */
  nextHurdle(r) {
    const i = this.runners.indexOf(r);
    for (const H of this.hurdles) {
      for (const leg of [0, 1]) {
        const at = leg === 0 ? H.d : RACE - H.d, gap = at - r.p;
        if (gap > -0.1 && gap < 6 && !H.row[i].fell && !(r.cleared || new Set()).has(H.d + ':' + leg)) return { H, h: H.row[i], gap, key: H.d + ':' + leg, leg };
      }
    }
    return null;
  }
  jump(r, perfect) {
    const n = this.nextHurdle(r); if (n) { r.cleared = r.cleared || new Set(); r.cleared.add(n.key); }
    r.jump = 0; r.jumpH = perfect ? 0.85 : 0.65; r.a.play('special', { restart: true, speed: 1.6 });
    this.s.audio.sfx('whoosh', { vol: r.me ? 0.8 : 0.25, pitch: 1.3 });
  }
  crash(r, n) {
    const s = this.s; r.cleared = r.cleared || new Set(); r.cleared.add(n.key);
    n.h.fell = true; n.h.dir = n.leg === 0 ? 1 : -1; r.stun = 0.7; r.v *= 0.35; r.vb = Math.min(r.vb, -0.4); r.a.play('hurt', { restart: true });
    const p = r.a.g.position; s.burst('dust', [p.x, p.y + 0.2, p.z], { n: 8 }); s.burst('star', [p.x, p.y + 0.7, p.z], { n: 4 });
    if (r.me) { this.combo = 0; s.audio.sfx('hit_heavy'); s.shake(0.12); s.pop('CRASH!', this.popAt(r, 1.2), { scale: 2, color: '#ffd2dc' }); }
    else s.audio.sfx('thud', { vol: 0.4 });
  }
  run(r, dt, live) {
    const s = this.s;
    if (r.fin != null && r.p > RACE + 3) { r.v = Math.max(0, r.v - dt * 6); }
    // pace: rivals have their own rhythm; you have your beat bonus (+ FEVER)
    let want;
    if (r.me) { r.vb *= Math.exp(-dt * 0.35); want = clamp(V0 + r.vb * 1.15 + (this.feverT > 0 ? 1.4 : 0), 2.5, VMAX); }
    else want = r.base + Math.sin(this.time * 0.8 + r.ph) * 0.35 + (r.p > 70 ? 0.35 : 0);
    if (r.fin != null) want = Math.max(1.5, want * 0.5);
    if (r.stun > 0) { r.stun -= dt; want *= 0.3; if (r.stun <= 0) r.a.play('walk', { restart: true }); }
    // the turn round the cone
    const turning = Math.abs(r.p - LEG) < 1.0; if (turning) want *= 0.55;
    r.v += (want - r.v) * Math.min(1, dt * (want > r.v ? 2.2 : 4));
    r.p += r.v * dt;
    // hurdles: rivals jump (mostly), you must tap
    const n = this.nextHurdle(r);
    if (n) {
      if (!r.me && r.jump < 0 && r.stun <= 0 && n.gap < 1.25) { if (s.rand() < r.skill) this.jump(r, s.rand() < 0.4); else this.crash(r, n); }
      else if (r.me && r.jump < 0 && n.gap < JUMP[0] * 0.5) this.crash(r, n);
    }
    if (r.jump >= 0) { r.jump += dt / 0.42; if (r.jump >= 1) { r.jump = -1; r.a.play('walk', { restart: true }); const p = r.a.g.position; s.burst('dust', [p.x, p.y + 0.1, p.z], { n: r.me ? 5 : 2 }); if (r.me) s.audio.sfx('thud', { vol: 0.35, pitch: 1.4 }); } }
    // place it
    const z = r.p <= LEG ? Z0 + r.p : Z0 + LEG - (r.p - LEG), i = this.runners.indexOf(r), g = r.a.g;
    const hop = r.jump >= 0 ? Math.sin(r.jump * Math.PI) * r.jumpH : Math.abs(Math.sin(r.p * 2.2)) * 0.05 * Math.min(1, r.v / 4);
    g.position.set(LANES[i], this.gy + hop, Math.min(Z0 + LEG + 0.6, z));
    const back = r.p > LEG; r.flip += ((back ? 1 : 0) - r.flip) * Math.min(1, dt * 6);
    r.a.yaw = r.a.targetYaw = Math.PI * r.flip * (i % 2 ? 1 : -1) + (turning ? Math.sin((r.p - LEG + 1) * Math.PI / 2) * 0.6 : 0);
    if (r.a.anim && r.a.anim.cur && r.jump < 0 && r.stun <= 0) r.a.anim.cur.speed = clamp(r.v / 2.2, 0.8, 3.6);
    if (r.me && r.v > 6.6) { this.dustT = (this.dustT || 0) - dt; if (this.dustT <= 0) { this.dustT = 0.12; s.burst('dust', [g.position.x, this.gy + 0.08, g.position.z], { n: 1, scale: 0.7 }); } }
    // the line
    if (r.fin == null && r.p >= RACE) {
      r.fin = this.time; this.order.push(r);
      const place = this.order.length;
      if (r.me) {
        s.audio.sfx(place === 1 ? 'crowd_cheer' : 'gong'); s.slowmo(0.3, 1.0); s.punch(8); s.flash('#ffffff', 0.25, 0.5);
        s.banner(PLACE[place - 1] + '!', { dur: 1.6, scale: 5, grad: place === 1 ? [WHITE, T.amber] : [WHITE, T.cyan] });
        if (place === 1) s.confettiBurst(80);
        r.a.play(place <= 2 ? 'win' : 'cry', { restart: true });
        if (s.hero) s.hero.play(place === 1 ? 'win' : place === 2 ? 'clap' : 'facepalm', { restart: true });
      } else r.a.play('win', { restart: true });
    }
  }
  finish() {
    if (this.done) return; this.done = true;
    const me = this.me, place = me.fin != null ? this.order.indexOf(me) + 1 : 4, fin = me.fin != null;
    for (const r of this.runners) if (r.fin == null) r.fin = Infinity;
    this.s.end({
      banner: fin ? 'FINISH!' : 'TIME!', finished: fin, place, time: fin ? me.fin : null, perfects: this.perfects,
      score: fin ? Math.max(0, Math.round(4000 - me.fin * 120 + this.perfects * 50 + this.bestCombo * 10)) : 0,
      scoreLabel: 'TIME', scoreText: fin ? fmtTime(me.fin) : 'DNF',
      lines: [`Place: ${PLACE[place - 1]} of 4`, `Perfect jumps ${this.perfects}  ·  best streak ×${this.bestCombo}`, this.order[0] && !this.order[0].me ? `Winner: ${this.order[0].name}` : `${this.s.partnerName} takes the ribbon!`],
    });
  }
  // ================================================================ camera and HUD
  popAt(r, h) { const p = r.a.g.position; return new V3(p.x, p.y + h, p.z); }
  popAt3(r, h) { const p = r.a.g.position; return [p.x, p.y + h, p.z]; }
  cam(snap) {
    const s = this.s, r = this.me; if (!r) return;
    const g = r.a.g.position, dir = r.p > LEG ? -1 : 1, lead = clamp(r.v * 0.25, 0, 2) * dir;
    const fast = this.feverT > 0 ? 6 : r.v > 6.6 ? 3 : 0;
    s.look(new V3(15.2, this.gy + 0.7, clamp(g.z + lead, Z0 - 2, Z0 + LEG + 1)), this.done ? 6.5 : 8.6, 90 + dir * 8, 11, 40 + fast, { rate: 4, snap });
  }
  draw(ui, dt) {
    const s = this.s, W = ui.w, H = ui.h, narrow = W < 360, r = this.me;
    // speed lines at the edges when flying
    if (r && (r.v > 6.4 || this.feverT > 0)) { const k = clamp01((r.v - 6.4) / 1.6) + (this.feverT > 0 ? 0.6 : 0); for (let i = 0; i < 10 * k; i++) { const y = (Math.sin(i * 91.7 + Math.floor(s.t * 20) * 3.1) * 0.5 + 0.5) * H, len = 20 + (i * 37) % 50; const lft = i % 2; ui.rect(lft ? 0 : W - len, y, len, 1, 'rgba(255,248,236,0.55)'); } }
    // top: place + progress strip (all four runners), the race clock
    const place = this.placeOf(r);
    ui.panel(6, 6, 64, 34, {}); ui.text(PLACE[place - 1], 14, 14, place === 1 ? T.amber2 : T.text, { scale: 2 }); ui.text('/4', 52, 19, T.dim, { mini: true });
    const bx = 78, bw = Math.min(W - bx - 70, 240), byy = 14;
    ui.panel(bx - 6, 6, bw + 12, 22, { thin: true });
    ui.rect(bx, byy + 2, bw, 4, T.track || '#3a2a2e'); ui.rect(bx + bw / 2 - 1, byy, 2, 8, '#ffc93a');
    this.runners.slice().reverse().forEach((q) => { const x = bx + clamp01(q.p / RACE) * bw; ui.rrect(x - 3, byy + 1, 6, 6, q.me ? T.red : '#a89a8c', 3); if (q.me) ui.rect(x - 1, byy - 2, 2, 2, T.red); });
    ui.text('GOAL', bx + bw - 1, byy + 10, T.dim, { mini: true, align: 'right' }); ui.text('TURN', bx + bw / 2, byy + 10, T.dim, { mini: true, align: 'center' });
    drawClock(ui, W - 40, 6, this.time);
    drawCombo(ui, 10, 48, this.combo, this.comboT, { hot: 12, label: 'STREAK' });
    // the beat bar: rings close on the centre on every beat; hurdle markers slide in to the jump zone
    if (this.started && !this.done) this.drawBeatBar(ui, W / 2, H - (narrow ? 34 : 30), Math.min(260, W - 30));
    // fever meter (right)
    const fx = W - 22, fy = Math.max(52, H * 0.3), fh = Math.min(90, H * 0.36);
    ui.panel(fx - 4, fy - 4, 16, fh + 8, { thin: true }); ui.rect(fx, fy, 8, fh, T.track || '#3a2a2e');
    const fk = this.feverT > 0 ? this.feverT / 4.2 : this.fever; ui.rect(fx, fy + fh * (1 - fk), 8, fh * fk, this.feverT > 0 ? (((s.t * 10) | 0) % 2 ? '#ffd860' : '#e8743a') : '#e86a9a');
    worldText(ui, 'FEVER', fx + 4, fy + fh + 7, { mini: true, align: 'center' });
    if (r && !narrow) worldText(ui, `${r.v.toFixed(1)} m/s`, fx + 8, fy - 14, { mini: true, align: 'right' });
  }
  placeOf(r) { if (!r) return 4; if (r.fin != null && this.order.includes(r)) return this.order.indexOf(r) + 1; let n = this.order.length + 1; for (const q of this.runners) if (q !== r && q.fin == null && q.p > r.p) n++; return Math.min(4, n); }
  drawBeatBar(ui, cx, y, w) {
    const s = this.s, b = this.beat(), ph = b - Math.floor(b), x0 = Math.round(cx - w / 2);
    ui.panel(x0 - 6, y - 12, w + 12, 26, {});
    ui.rect(x0, y - 1, w, 3, T.creamD || '#e5d2b4');
    // the jump zone: hurdles approach as markers (time to the hurdle at the current pace)
    const r = this.me, n = r && this.nextHurdle(r), pxPerM = (w / 2) / 6;
    ui.rect(Math.round(cx + JUMP[0] * pxPerM), y - 6, Math.round((JUMP[1] - JUMP[0]) * pxPerM), 12, 'rgba(62,142,232,0.35)');
    ui.rect(Math.round(cx + PERFECT[0] * pxPerM), y - 6, Math.round((PERFECT[1] - PERFECT[0]) * pxPerM), 12, 'rgba(240,176,48,0.55)');
    if (n) { const hx = Math.round(cx + n.gap * pxPerM); if (hx < x0 + w) { ui.rect(hx - 1, y - 8, 3, 16, T.red); ui.rect(hx - 4, y - 8, 9, 2, T.red); } }
    // beat rings: two pips sliding in from the sides, meeting at the centre on the beat
    for (const k of [0, 1]) { const t = (k ? ph + 1 : ph), off = (1 - (t % 1)) * (w / 2 - 8); if (off < 2) continue; for (const sg of [-1, 1]) ui.rrect(Math.round(cx + sg * off) - 3, y - 3, 6, 6, '#8a62d0', 3); }
    const pulse = Math.max(this.ringK, ph < 0.12 ? 1 - ph / 0.12 : 0);
    ui.rrect(Math.round(cx - 6 - pulse * 3), Math.round(y - 6 - pulse * 3), Math.round(12 + pulse * 6), Math.round(12 + pulse * 6), pulse > 0.3 ? '#ffd860' : T.copper, 7);
    ui.rrect(cx - 3, y - 3, 6, 6, WHITE, 3);
    keyRow(ui, cx, y + 16, [['SPACE', n && n.gap < JUMP[1] + 0.8 ? 'JUMP!' : 'Stride on the beat']]);
  }
  bot(inp) {
    const r = this.me; if (!r || r.fin != null) return;
    const n = this.nextHurdle(r);
    if (n && n.gap < 1.3 && n.gap > 0.9 && r.jump < 0) { inp.tap = true; return; }
    if (n && n.gap < JUMP[1] + 0.4) return;
    const b = this.beat(), off = Math.abs(b - Math.round(b));
    if (off < 0.05 && Math.round(b) !== this.tapBeat) inp.tap = true;
  }
  debug() { const r = this.me; return { t: +this.time.toFixed(1), p: r && +r.p.toFixed(1), v: r && +r.v.toFixed(2), place: this.placeOf(r), perfects: this.perfects, combo: this.combo, others: this.runners.slice(1).map((q) => +q.p.toFixed(1)) }; }
  dispose() { if (this.marshal) this.marshal.play('idle'); }
}
void lerp; void boing;
