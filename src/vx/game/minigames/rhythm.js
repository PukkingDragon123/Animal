// BEAT CLASH — a rhythm battle on the Street Arena court. Your partner (box A) faces DJ Kiki's champion (box B)
// to "Osaka Clash". Arrows fall down four lanes; hit each one as it crosses the line (◀ ▼ ▲ ▶, or D F J K).
// Every hit lands a blow on the rival (perfect hits land harder), a miss lets the rival hit back, and every ten
// in a row unleash your partner's special. Knock the rival out before the track ends — or just outscore them.
import * as THREE from '../../../../vendor/three.module.js';
import { T } from '../../../px/game/ui.js';
import { SPECIES, elemsOf } from '../../../data/species.js';
import { V3, clamp, clamp01, lerp, fmt, drawScore, drawCombo, voxel, GLOW, WHITE, worldText, rng } from './kit.js';

const BPM = 144, FIRST = 8, LAST = 120, A = [139, 165], B = [147, 165];
const LANES = [
  { key: 'ArrowLeft', alt: 'd', glyph: '◀', col: '#e86a9a', dk: '#8a2a4e' },
  { key: 'ArrowDown', alt: 'f', glyph: '▼', col: '#3ab8d8', dk: '#1f6a8a' },
  { key: 'ArrowUp', alt: 'j', glyph: '▲', col: '#5cc24a', dk: '#2e7a2e' },
  { key: 'ArrowRight', alt: 'k', glyph: '▶', col: '#f0b030', dk: '#9a6a1a' },
];
const J = [[0.05, 'PERFECT', 300, 3], [0.1, 'GREAT', 200, 2], [0.15, 'GOOD', 100, 1]];
const RIVAL = ['purrcussion', 'foopod', 'mopzart', 'beatlet', 'pepperhorn'];
const HIT_FX = { pyro: 'fire', hydro: 'splash', bio: 'leaf', volto: 'bolt', geo: 'rock', echo: 'note', ecto: 'ghostfire', cryo: 'sparkle', ferro: 'shard', aero: 'dust', astro: 'star', nucleo: 'ember', draco: 'ghostfire' };

export default class Rhythm {
  static howto = 'Hit each arrow as it reaches the line. Hits make your partner attack, misses let the rival strike back. Ten in a row = SPECIAL!';
  static keys = [['◀ ▼ ▲ ▶', 'or D F J K']];
  static ranks = [55000, 35000, 20000];
  static rewards(res, o) {
    const items = []; if (res.won) items.push(['matcha', 1]); if (res.won && !o.mem.firsts.clash) { o.mem.firsts.clash = true; items.push(['star_candy', 1]); }
    return { money: Math.round(res.score / 60) + (res.won ? 200 : 0), friend: (res.won ? 4 : 2) + (o.record ? 1 : 0), items };
  }
  constructor(sess) { this.s = sess; this.prefer = 0; }

  async setup() {
    const s = this.s, st = s.st, gy = s.ground(143, 165, 0); this.gy = gy;
    // a pair of stage speakers and a light rig either side of the court centre (voxels), and the DJ
    const speaker = (F, r, H) => { const b = F.c('#2a2632'), bD = F.c('#1a1620'), cone = F.c('#4a4656'), rim = F.c('#c8ccd4'), led = F.c('#ff74c0', GLOW); F.box(0, 0, 0, 13, 27, 11, (x, y) => (x === 0 || x === 13 || y === 27 ? bD : b)); for (const [cy, rr] of [[8, 5], [20, 3]]) for (let y = cy - rr; y <= cy + rr; y++) for (let x = 7 - rr; x <= 7 + rr; x++) { const d = (x - 6.5) ** 2 + (y - cy) ** 2; if (d <= rr * rr) F.set(x, y, 12, d > (rr - 1) ** 2 ? rim : cone); } F.box(3, 25, 12, 10, 25, 12, led); };
    this.speakers = [];
    for (const [x, z, yaw] of [[143 - 6.5, 160.6, 0.35], [143 + 6.5, 160.6, -0.35]]) { const g = voxel(st, [14, 28, 13], speaker, { vpm: 16, key: 'mg-speaker' }); g.position.set(x, gy, z); g.rotation.y = yaw; s.root.add(g); this.speakers.push(g); }
    // spotlights on the two fighters: coloured discs that pulse on the beat
    this.spots = [A, B].map(([x, z], i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1.2, 20), new THREE.MeshBasicMaterial({ color: i ? '#e86a9a' : '#3ab8d8', transparent: true, opacity: 0.25, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, gy + 0.03, z); s.root.add(m); return m; });
    this.dj = s.person('passerby222', [120.5, 150.95, 0, gy + 0.33]); this.dj.play('dance');
    // the fighters
    const sp = (s.lead && s.lead.species) || 'chilichick', pool = RIVAL.filter((id) => SPECIES[id] && id !== sp);
    this.rivalSp = pool[Math.floor(s.rand() * pool.length)] || 'foopod';
    this.me = s.partner || await s.mon(sp, [A[0], A[1], Math.PI / 2]);
    this.me.place(A[0], A[1], Math.PI / 2, gy); this.me.play('idle');
    this.foe = await s.mon(this.rivalSp, [B[0], B[1], -Math.PI / 2, gy]);
    this.foe.place(B[0], B[1], -Math.PI / 2, gy);
    const el = elemsOf(SPECIES[sp] || {})[0]; this.fx = HIT_FX[el] || 'spark';
    const fel = elemsOf(SPECIES[this.rivalSp] || {})[0]; this.foeFx = HIT_FX[fel] || 'note';
    if (s.hero) { s.hero.place(A[0] - 2.2, A[1] + 2.4, Math.PI * 0.8, gy); s.hero.play('cheer'); }
    this.foeName = SPECIES[this.rivalSp] ? SPECIES[this.rivalSp].name : 'Champion';
  }
  async intro(cin) {
    const s = this.s, gy = this.gy, V = (x, y, z) => new V3(x, y, z);
    await cin.cut({ target: V(143, gy + 1, 162), dist: 30, yaw: 20, pitch: 34 });
    cin.move({ target: V(143, gy + 0.8, 165), dist: 10, yaw: 0, pitch: 14 }, { dur: 2.6 });
    await s.app.wait(2000);
    await cin.frame(this.foe, { dist: 3.2, rel: 20, pitch: 8, dur: 0.5, hold: 2, at: 'chest' }); this.foe.play('special', { restart: true }); s.audio.sfx('roar');
    cin.nameCard(this.foeName.toUpperCase(), "DJ Kiki's champion", { hold: 1600, side: 'right' });
    await s.app.wait(1200);
    await cin.frame(this.me, { dist: 3.2, rel: -20, pitch: 8, dur: 0.5, hold: 2, at: 'chest' }); this.me.play('win', { restart: true });
    await s.app.wait(1000);
  }
  reset() {
    const r = rng((Date.now() & 0xffff) + 7);
    this.notes = []; let lane = Math.floor(r() * 4);
    for (let bar = FIRST; bar < LAST; bar += 4) {
      const prog = (bar - FIRST) / (LAST - FIRST), pat = prog < 0.2 ? [0, 2] : prog < 0.45 ? [0, 1, 2, 3] : prog < 0.75 ? [0, 1, 1.5, 2, 3] : [0, 0.5, 1, 2, 2.5, 3, 3.5];
      const rest = bar % 32 === 28;                                       // a breather every eight bars
      for (const b of rest ? [0, 2] : pat) { const step = r() < 0.3 ? 0 : r() < 0.5 ? 1 : 3; lane = (lane + step) % 4; this.notes.push({ b: bar + b, lane, hit: false, miss: false }); }
    }
    this.score = 0; this.shown = 0; this.combo = 0; this.bestCombo = 0; this.comboT = 9; this.counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    this.hp = 1; this.foeHp = 1; this.judge = null; this.flashLane = [0, 0, 0, 0]; this.over = false; this.clock = 0; this.started = false; this.lastBeat = -1;
    this.me && this.me.play('idle'); this.foe && this.foe.play('idle');
    this.cam(true);
  }
  start() { this.started = true; this.clock = 0; this.s.audio.music('battle', { fade: 0.05, restart: true }); }
  beat() { const c = this.s.simmed ? null : this.s.audio.clock('battle'); if (c && c.beat > -1) { this.synced = true; return c.beat; } this.synced = false; return this.clock * BPM / 60; }
  // ================================================================ per frame
  update(dt, inp, live) {
    const s = this.s;
    this.shown += (this.score - this.shown) * Math.min(1, dt * 10); if (Math.abs(this.score - this.shown) < 1) this.shown = this.score;
    this.comboT += dt; for (let i = 0; i < 4; i++) this.flashLane[i] = Math.max(0, this.flashLane[i] - dt * 5); if (this.judge) this.judge.t += dt;
    if (!this.started) { this.cam(false); return; }
    if (live) this.clock += dt;
    const b = this.beat(), sec = 60 / BPM;
    if (Math.floor(b) !== Math.floor(this.lastBeat) && b > 0) this.onBeat(Math.floor(b));
    this.lastBeat = b;
    if (live && !this.over) {
      // presses: the nearest unhit note in that lane
      for (let L = 0; L < 4; L++) {
        const ln = LANES[L]; if (!(inp.pressed.has(ln.key) || inp.pressed.has(ln.alt) || this.touch === L)) continue;
        this.flashLane[L] = 1;
        let best = null; for (const n of this.notes) if (!n.hit && !n.miss && n.lane === L && Math.abs(n.b - b) * sec < 0.18 && (!best || Math.abs(n.b - b) < Math.abs(best.b - b))) best = n;
        if (best) this.hit(best, Math.abs(best.b - b) * sec); else s.audio.sfx('ui_tap', { vol: 0.25, pitch: 0.7 });
      }
      this.touch = null;
      for (const n of this.notes) if (!n.hit && !n.miss && (b - n.b) * sec > 0.15) this.miss(n);
      if (b > LAST + 2 || this.foeHp <= 0 || this.hp <= 0) this.finish();
    }
    // the spotlights and speakers pump with the beat
    const ph = b - Math.floor(b), pump = Math.max(0, 1 - ph * 3);
    for (const g of this.speakers) g.scale.set(1 + pump * 0.03, 1 - pump * 0.02, 1 + pump * 0.03);
    this.spots[0].material.opacity = 0.18 + pump * 0.22; this.spots[1].material.opacity = 0.18 + pump * 0.22;
    this.cam(false);
  }
  onBeat(n) {
    const s = this.s;
    if (!this.synced && !this.over) s.audio.sfx('ui_tap', { vol: 0.25, pitch: n % 4 ? 1 : 1.4 });
    if (n % 2 === 0 && !this.over) s.punch(0.8);
    if (!this.over && n % 4 === 0 && this.foe.anim.cur && this.foe.anim.cur.name === 'idle') this.foe.play('dance', { restart: true });
  }
  hit(n, dtS) {
    const s = this.s, j = J.find(([w]) => dtS <= w) || J[2], [, name, pts, dmg] = j;
    n.hit = true; this.counts[name]++; this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo); this.comboT = 0;
    const mult = 1 + Math.min(1.5, Math.floor(this.combo / 10) * 0.25);
    this.score += Math.round(pts * mult); this.judge = { name, t: 0, col: name === 'PERFECT' ? T.amber : name === 'GREAT' ? T.cyan : T.green };
    s.audio.sfx(name === 'PERFECT' ? 'qte_perfect' : 'qte_good', { vol: 0.45, pitch: 1 + (n.lane - 1.5) * 0.06 });
    // the blow lands
    this.foeHp = Math.max(0, this.foeHp - dmg * 0.0024);
    this.me.play('attack', { restart: true, speed: 1.6 });
    const fp = this.foe.g.position; s.burst(this.fx, [fp.x, fp.y + 0.55, fp.z], { n: name === 'PERFECT' ? 6 : 3 }); s.burst('spark', [fp.x - 0.2, fp.y + 0.6, fp.z], { n: 1 });
    if (name === 'PERFECT') s.shake(0.02, 14);
    if (this.combo % 4 === 0) this.foe.play('hurt', { restart: true });
    if (this.combo > 0 && this.combo % 10 === 0) this.special();
  }
  special() {
    const s = this.s, fp = this.foe.g.position;
    this.me.play('special', { restart: true }); this.foe.play('hurt', { restart: true });
    this.foeHp = Math.max(0, this.foeHp - 0.03); this.score += 1000;
    s.burst(this.fx, [fp.x, fp.y + 0.6, fp.z], { n: 24, scale: 1.6 }); s.burst('star', [fp.x, fp.y + 0.9, fp.z], { n: 8 });
    s.audio.sfx('charge_release'); s.audio.sfx('crowd_cheer', { vol: 0.6 }); s.shake(0.1); s.punch(7); s.flash('#ffe8a0', 0.2, 0.35); s.hitstop(70);
    s.banner('SPECIAL!', { dur: 0.9, scale: 4, grad: [WHITE, T.coral], y: 0.3 });
    this.closeT = 1.1;
  }
  miss(n) {
    const s = this.s; n.miss = true; this.counts.MISS++; this.combo = 0; this.judge = { name: 'MISS', t: 0, col: T.red };
    this.hp = Math.max(0, this.hp - 0.035);
    this.foe.play('attack', { restart: true, speed: 1.5 }); this.me.play('hurt', { restart: true });
    const p = this.me.g.position; s.burst(this.foeFx, [p.x, p.y + 0.55, p.z], { n: 4 }); s.audio.sfx('hit_light', { vol: 0.5 }); s.shake(0.03);
  }
  finish() {
    if (this.over) return; this.over = true;
    const s = this.s, won = this.foeHp <= 0 || (this.hp > 0 && this.foeHp < this.hp), ko = this.foeHp <= 0;
    if (won) { this.me.play('win', { restart: true }); this.foe.play(ko ? 'faint' : 'cry', { restart: true }); s.confettiBurst(70); if (s.hero) s.hero.play('win', { restart: true }); }
    else { this.me.play('cry', { restart: true }); this.foe.play('win', { restart: true }); if (s.hero) s.hero.play('facepalm', { restart: true }); }
    if (ko) this.score += 5000;
    const c = this.counts, tot = Math.max(1, c.PERFECT + c.GREAT + c.GOOD + c.MISS), acc = Math.round(((c.PERFECT + c.GREAT * 0.7 + c.GOOD * 0.4) / tot) * 100);
    s.end({ banner: ko ? 'K.O.!' : won ? 'YOU WIN!' : 'DEFEATED…', score: this.score, won, lines: [`Perfect ${c.PERFECT} · great ${c.GREAT} · good ${c.GOOD} · miss ${c.MISS}`, `Accuracy ${acc}%  ·  best combo ×${this.bestCombo}`, won ? `${s.partnerName} out-grooved ${this.foeName}!` : `${this.foeName} keeps the crown… for now.`] });
  }
  cam(snap) {
    const s = this.s, gy = this.gy;
    if (this.closeT > 0) { this.closeT -= 1 / 60; const p = this.me.g.position; s.look(new V3(p.x + 0.8, gy + 0.6, p.z), 3.4, 330, 8, 38, { rate: 8 }); return; }
    s.look(new V3(143, gy + 0.9, 165), 9.5, 0, 12, 40, { rate: 4, snap });
  }
  // ================================================================ HUD: the HP bars and the note highway
  draw(ui) {
    const s = this.s, W = ui.w, H = ui.h, narrow = W < 360;
    // HP: your partner (left) and the rival (right)
    const bw = Math.min(150, Math.round(W * 0.32));
    ui.panel(6, 6, bw + 16, 30, {}); ui.text(s.partnerName.toUpperCase(), 14, 12, T.text, { mini: true }); ui.bar(14, 21, bw, 8, this.hp, { color: 'green', id: 'mg-rh-me' });
    ui.panel(W - bw - 22, 6, bw + 16, 30, {}); ui.text(this.foeName.toUpperCase(), W - 14, 12, T.text, { mini: true, align: 'right' }); ui.bar(W - bw - 14, 21, bw, 8, this.foeHp, { color: 'red', id: 'mg-rh-foe' });
    if (!narrow) { ui.panel(W / 2 - 34, 6, 68, 18, { thin: true }); ui.text(fmt(this.shown), W / 2, 12, T.text, { align: 'center' }); }
    drawCombo(ui, 10, 44, this.combo, this.comboT, { hot: 30 });
    // the highway
    const lw = narrow ? 20 : 22, hw = lw * 4, x0 = Math.round(W / 2 - hw / 2), top = Math.round(H * 0.36), hitY = H - 30, sec = 60 / BPM, b = this.beat(), ppS = (hitY - top) / 1.25;
    ui.panel(x0 - 6, top - 6, hw + 12, hitY - top + 28, { fill: '#2e2a3a', alpha: 0.82 });
    for (let L = 0; L < 4; L++) { const lx = x0 + L * lw; ui.rect(lx + lw - 1, top, 1, hitY - top + 14, '#463e52'); if (this.flashLane[L] > 0) ui.rect(lx + 1, top, lw - 2, hitY - top + 14, `rgba(255,248,236,${(this.flashLane[L] * 0.18).toFixed(2)})`); }
    // the hit line + receptors (keycaps)
    ui.rect(x0, hitY - 1, hw, 3, '#fbf3e3');
    for (let L = 0; L < 4; L++) arrow(ui, x0 + L * lw + lw / 2, hitY, L, this.flashLane[L] > 0.3 ? LANES[L].col : '#5a464a', 0.9);
    for (const n of this.notes) {
      if (n.hit) continue; const y = Math.round(hitY - (n.b - b) * sec * ppS); if (y < top - 6 || y > hitY + 16) continue;
      arrow(ui, x0 + n.lane * lw + lw / 2, y, n.lane, n.miss ? '#5a464a' : LANES[n.lane].col, 1);
    }
    if (this.judge && this.judge.t < 0.6) worldText(ui, this.judge.name, W / 2, top - 18 - Math.round(this.judge.t * 10), { align: 'center', color: this.judge.name === 'MISS' ? '#ffbc94' : '#fff8ec', scale: this.judge.name === 'PERFECT' ? 2 : 1 });
    // touch: the four lanes are buttons
    if (s.live && ui.ptr.pressed && ui.ptr.y > top) { const L = Math.floor((ui.ptr.x - x0) / lw); if (L >= 0 && L < 4) { this.touch = L; ui.ptr.pressed = false; } }
    if (!narrow) { ui.text('◀ ▼ ▲ ▶', x0 + hw + 14, hitY - 4, WHITE, { outline: T.ink, mini: true }); ui.text('D F J K', x0 + hw + 14, hitY + 4, WHITE, { outline: T.ink, mini: true }); }
  }
  bot(inp) { const b = this.beat(), sec = 60 / BPM; for (const n of this.notes) if (!n.hit && !n.miss && Math.abs(n.b - b) * sec < 0.03) inp.pressed.add(LANES[n.lane].key); }
  debug() { return { beat: +this.beat().toFixed(2), score: this.score, combo: this.combo, hp: +this.hp.toFixed(2), foeHp: +this.foeHp.toFixed(2), counts: this.counts }; }
  dispose() { if (this.dj) this.dj = null; }
}
// a lane arrow as a chunky pixel sprite centred on (cx, cy)
function arrow(ui, cx, cy, lane, col, k = 1) {
  const x = Math.round(cx), y = Math.round(cy), dk = LANES[lane].dk, s = 7;
  ui.rrect(x - s - 1, y - s - 1, s * 2 + 2, s * 2 + 2, T.ink, 4); ui.rrect(x - s, y - s, s * 2, s * 2, col, 3); ui.rect(x - s + 1, y + s - 2, s * 2 - 2, 1, dk);
  const g = ui.g, rot = [Math.PI, Math.PI / 2, -Math.PI / 2, 0][lane];
  g.save(); g.translate(x, y); g.rotate(rot);
  ui.rect(-3, -1, 4, 3, '#fff8ec'); ui.rect(1, -3, 1, 7, '#fff8ec'); ui.rect(2, -2, 1, 5, '#fff8ec'); ui.rect(3, -1, 1, 3, '#fff8ec'); ui.rect(4, 0, 1, 1, '#fff8ec');
  g.restore(); ui._fs = null; void k;
}
void clamp; void clamp01; void lerp; void drawScore;
