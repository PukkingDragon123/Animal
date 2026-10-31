// MOM'S CURRY — curry night in the kitchen on Sunset Row, four quick steps with Mom:
//   CHOP     beat markers slide to the knife line: SPACE on each to chop (onion, carrot, potato, mushroom)
//   ADD      Mom calls the order once — then add them in that order (◀ ▲ ▶ ▼)
//   SIMMER   hold SPACE to turn the flame up, let go to lower it: keep the pot in the moving sweet spot
//   STIR     the roux goes in: mash ◀ ▶ to stir it smooth before it catches
// The curry's grade heals the team, feeds them EXP and friendship, and gives a "well fed" boost for the next
// battles (index.js applies it to the battle snapshot).
import * as THREE from '../../../../vendor/three.module.js';
import { T } from '../../../px/game/ui.js';
import { V3, clamp, clamp01, lerp, easeOut, boing, fmt, drawScore, keyRow, voxel, GLOW, WHITE, worldText, bigText, vGauge } from './kit.js';

const BPM = 96, BOARD = new V3(60.34, 0.95, 141.66), POT = new V3(59.37, 0.915, 141.7);   // the pot on the free front-left burner (the stove model keeps a pot and a kettle on two others)
const ING = [
  { id: 'onion', name: 'Onion', key: 'ArrowLeft', glyph: '◀', col: '#e8c8e8' },
  { id: 'carrot', name: 'Carrot', key: 'ArrowUp', glyph: '▲', col: '#f0802a' },
  { id: 'potato', name: 'Potato', key: 'ArrowRight', glyph: '▶', col: '#d8b070' },
  { id: 'mushroom', name: 'Mushroom', key: 'ArrowDown', glyph: '▼', col: '#a8805a' },
];
const ALT = { ArrowLeft: 'a', ArrowUp: 'w', ArrowRight: 'd', ArrowDown: 's' };
const STAGES = ['chop', 'add', 'simmer', 'stir'];
const LABEL = { chop: 'CHOP!', add: 'IN THEY GO!', simmer: 'SIMMER', stir: 'STIR!' };

export default class Curry {
  static howto = 'Four steps with Mom: chop on the beat, add in her order, keep the simmer in the sweet spot, then stir like crazy!';
  static keys = [['SPACE', 'Chop · Flame'], ['◀ ▲ ▶ ▼', 'Add · Stir']];
  static ranks = [860, 680, 460];
  static rewards(res, o) {
    const g = o.rank, items = [];
    if (g === 'S' && !o.mem.firsts.curryS) { o.mem.firsts.curryS = true; items.push(['protein_mochi', 1]); }
    const k = { S: 3, A: 2, B: 1, C: 0 }[g] ?? 0;
    return { heal: true, exp: [25, 50, 80, 120][k], friend: [2, 3, 4, 6][k] + (o.record ? 1 : 0), items,
      buff: { id: 'curry', name: "Mom's Curry", battles: [1, 2, 2, 3][k], stats: { dmg: [1, 2, 4, 6][k], def: [1, 2, 3, 5][k], elm: [0, 1, 2, 4][k] } } };
  }
  constructor(sess) { this.s = sess; this.prefer = 0; }

  // ================================================================ the set
  async setup() {
    const s = this.s, root = s.root, st = s.st;
    this.fy = s.ground(60.2, 142.4, 0);
    // the cutting board, the knife, the pot with its ladle (voxels)
    this.board = voxel(st, [26, 2, 18], (F) => { const w = F.c('#d8a868'), wD = F.c('#b88848'), wL = F.c('#e8c088'); F.box(0, 0, 0, 25, 1, 17, (x, y, z) => (y === 1 ? (z % 5 === 0 ? wD : (x + z * 3) % 13 === 0 ? wL : w) : wD)); F.box(22, 1, 7, 24, 1, 10, wD); }, { vpm: 64, key: 'mg-board' });
    this.board.position.copy(BOARD); root.add(this.board);
    this.knife = new THREE.Group(); this.knife.position.set(BOARD.x + 0.12, BOARD.y + 0.2, BOARD.z + 0.02); root.add(this.knife);
    this.knife.add(voxel(st, [2, 4, 26], (F) => { const bl = F.c('#e8ecf4'), blD = F.c('#a8acb8'), h = F.c('#3a2a24'), r = F.c('#c8a050'); F.box(0, 0, 0, 1, 3, 15, (x, y) => (y === 0 ? blD : bl)); F.box(0, 2, 16, 1, 3, 16, r); F.box(0, 1, 17, 1, 3, 25, h); }, { vpm: 64, key: 'mg-knife', origin: [1 / 64, 0, 13 / 64] }));
    this.knife.rotation.y = -0.4;
    this.pot = new THREE.Group(); this.pot.position.copy(POT); this.pot.scale.setScalar(0.85); root.add(this.pot);
    this.pot.add(voxel(st, [26, 15, 26], (F, r, H) => {
      const m = F.c('#c8ccd4'), mD = F.c('#9aa0aa'), mL = F.c('#e8ecf4'), h = F.c('#2a2a32');
      H.ring(F, 12.5, 12.5, 0, 13, 10, 11.6, (x, y, z) => (y === 13 ? mL : (x + y) % 9 === 0 ? mL : x < 10 ? m : mD)); H.disc(F, 12.5, 12.5, 0, 0, 10.5, mD);
      for (const x of [0, 1, 24, 25]) F.box(x, 10, 11, x, 11, 14, h);
    }, { vpm: 64, key: 'mg-pot' }));
    // the curry surface (its colour follows the cooking), the ladle, the flame ring
    this.soupMat = new THREE.MeshLambertMaterial({ color: '#a87a3a' });
    this.soup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 18), this.soupMat); this.soup.position.y = 0.05; this.soup.visible = false; this.pot.add(this.soup);
    this.ladle = new THREE.Group(); this.ladle.position.y = 0.2; this.pot.add(this.ladle);
    const ld = voxel(st, [6, 24, 6], (F, r, H) => { const w = F.c('#c89a5a'), wD = F.c('#a87a42'); F.box(2, 4, 2, 3, 23, 3, (x, y) => (y % 6 === 0 ? wD : w)); H.ball(F, 2.5, 2.5, 2.5, 2.6, 2.4, 2.6, wD); }, { vpm: 64, key: 'mg-ladle', origin: [3 / 64, 2 / 64, 3 / 64] });
    ld.position.set(0.09, -0.12, 0); ld.rotation.z = -0.35; this.ladle.add(ld); this.ladle.visible = false;
    this.flame = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.15, 16), new THREE.MeshBasicMaterial({ color: '#4aa8ff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    this.flame.rotation.x = -Math.PI / 2; this.flame.position.set(POT.x, POT.y + 0.005, POT.z); root.add(this.flame);
    this.ingMeshes = ING.map((g, i) => this.ingMesh(i));
    // people
    this.mom = s.w.actor('mom'); if (this.mom) { const p = this.mom.g.position; this.momWas = [p.x, p.z, this.mom.yaw, p.y]; this.mom.place(61.55, 142.75, Math.PI * 1.2, this.fy); this.mom.play('idle'); }
    if (s.hero) { s.hero.place(60.78, 142.28, Math.PI * 1.18, this.fy); s.hero.play('idle'); }
    if (s.partner) { s.partner.place(61.4, 143.5, Math.PI * 1.2, this.fy); s.partner.play('idle'); }
  }
  /** an ingredient (whole) in voxels, 80 per metre */
  ingMesh(i) {
    const st = this.s.st;
    const B = [
      (F, r, H) => { const a = F.c('#e8c8e8'), b = F.c('#c898c8'), t = F.c('#8a6a3a'); H.ball(F, 5, 4.5, 5, 4.8, 4.4, 4.8, (x, y, z) => ((x + z) % 3 === 0 ? b : a)); F.box(5, 9, 5, 5, 10, 5, t); },
      (F) => { const o = F.c('#f0802a'), oD = F.c('#c8601a'), g = F.c('#5cc24a'); for (let z = 0; z < 16; z++) { const r = 2.6 - z * 0.13; for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) if ((x - 2.5) ** 2 + (y - 2.5) ** 2 <= r * r) F.set(x, y, z, z % 3 === 0 ? oD : o); } F.box(2, 2, 16, 3, 4, 17, g); F.box(1, 4, 17, 2, 5, 17, g); },
      (F, r, H) => { const p = F.c('#d8b070'), pD = F.c('#b8904a'), e = F.c('#8a6a3a'); H.ball(F, 6, 3.5, 4.5, 5.8, 3.6, 4.5, (x, y, z) => ((x * 3 + z * 5 + y) % 11 === 0 ? e : y < 2 ? pD : p)); },
      (F, r, H) => { const c = F.c('#a8805a'), cD = F.c('#8a6040'), s = F.c('#f0e0c8'); H.ball(F, 5, 6, 5, 4.8, 2.6, 4.8, (x, y) => (y < 5 ? cD : c)); F.box(4, 0, 4, 6, 4, 6, s); },
    ][i];
    return () => voxel(st, i === 1 ? [6, 6, 18] : [12, 10, 10], B, { vpm: 80, key: 'mg-ing' + i });
  }
  async intro(cin) {
    const s = this.s, V = (x, y, z) => new V3(x, y, z);
    await cin.cut({ target: V(61, 1.4, 143.4), dist: 9, yaw: 30, pitch: 40 });
    cin.move({ target: V(60.0, 1.15, 141.9), dist: 3.4, yaw: 12, pitch: 26 }, { dur: 3.0 });
    if (this.mom) this.mom.play('wave');
    await s.app.wait(2400);
    if (this.mom) { await cin.frame(this.mom, { dist: 1.9, yaw: 200, pitch: 4, dur: 0.6, hold: 3, at: 'face' }); this.mom.play('explain'); }
    await s.app.wait(800);
  }
  reset() {
    this.stage = -1; this.st = 0; this.q = { chop: 0, add: 0, simmer: 0, stir: 0 }; this.score = 0; this.shown = 0; this.msg = null; this.over = false;
    this.chop = null; this.addSeq = null; this.heat = 0.3; this.zone = 0.5; this.simT = 0; this.inZone = 0; this.stirN = 0; this.lastStir = null; this.thick = 0;
    for (const m of this.pieces || []) m.parent && m.parent.remove(m); this.pieces = [];
    if (this.onBoard) { this.onBoard.parent && this.onBoard.parent.remove(this.onBoard); this.onBoard = null; }
    this.soup.visible = false; this.ladle.visible = false; this.flame.material.opacity = 0; this.soupMat.color.set('#c8a058');
    this.stageCam = 'chop'; this.cam(true);
  }
  start() { this.s.audio.music('dinner', { fade: 0.4, restart: true }); this.clock = 0; this.next(); }
  next() {
    const s = this.s; this.stage++; this.st = 0;
    if (this.stage >= STAGES.length) return this.finish();
    const k = STAGES[this.stage]; this.stageCam = k;
    s.banner(LABEL[k], { dur: 1.1, scale: 4, grad: [WHITE, T.amber] }); s.audio.sfx('ui_confirm');
    if (this.mom) this.mom.play(k === 'add' ? 'point' : k === 'simmer' ? 'think' : 'cheer', { restart: true });
    if (k === 'chop') this.beginChop();
    if (k === 'add') this.beginAdd();
    if (k === 'simmer') { this.soup.visible = true; this.simT = 0; this.inZone = 0; this.zone = 0.45; this.say('Mom: Low and slow, sweetheart…', 2.4); }
    if (k === 'stir') { this.ladle.visible = true; this.stirN = 0; this.thick = 0; this.dropRoux(); this.say('Mom: Roux in! Stir, stir, stir!', 2.2); }
  }
  /** beat clock: the music's own, else ours */
  beat() { const c = this.s.simmed ? null : this.s.audio.clock('dinner'); return c ? c.beat : (this.clock || 0) * BPM / 60; }
  // ================================================================ CHOP: 4 ingredients × 4 chops on the beat
  beginChop() { this.chop = { ing: 0, n: 0, notes: [], hits: 0, total: 0, startBeat: Math.ceil(this.beat()) + 2 }; this.placeIngredient(0); this.scheduleChops(); }
  scheduleChops() { const C = this.chop, b0 = Math.max(C.startBeat, Math.ceil(this.beat()) + 2); C.notes = [0, 1, 2, 3].map((i) => ({ b: b0 + i, done: false })); }
  placeIngredient(i) { if (this.onBoard) this.onBoard.parent && this.onBoard.parent.remove(this.onBoard); const m = this.ingMeshes[i](); m.position.set(BOARD.x - 0.04, BOARD.y + 0.03, BOARD.z); m.rotation.y = i === 1 ? Math.PI / 2 : 0; this.s.root.add(m); this.onBoard = m; this.s.audio.sfx('plop', { pitch: 1.3 }); }
  tickChop(dt, inp, live) {
    const s = this.s, C = this.chop, b = this.beat();
    if (live && inp.tap) {
      let best = null; for (const n of C.notes) if (!n.done && Math.abs(n.b - b) < 0.45 && (!best || Math.abs(n.b - b) < Math.abs(best.b - b))) best = n;
      this.knifeT = 0.18;
      if (best) {
        const off = Math.abs(best.b - b), g = off < 0.12 ? 2 : off < 0.25 ? 1 : 0.4; best.done = true; C.total++; C.hits += g / 2;
        s.audio.sfx('blade', { pitch: 1.1 + C.n * 0.05, vol: 0.8 }); s.audio.sfx(g === 2 ? 'qte_perfect' : 'qte_good', { vol: 0.45 }); s.shake(0.015);
        s.burst('dust', [BOARD.x, BOARD.y + 0.08, BOARD.z], { n: 3, tint: ING[C.ing].col, scale: 0.5 });
        s.pop(g === 2 ? 'PERFECT' : g === 1 ? 'GOOD' : 'OK', [s.app.ui.w / 2 + 60, s.app.ui.h - 70], { grad: g === 2 ? [WHITE, T.amber] : [WHITE, T.cyan] });
        this.slice(C.n++);
      } else { s.audio.sfx('hit_light', { vol: 0.5 }); s.audio.sfx('qte_miss', { vol: 0.4 }); }
    }
    for (const n of C.notes) if (!n.done && b - n.b > 0.45) { n.done = true; C.total++; C.n++; s.audio.sfx('qte_miss', { vol: 0.4 }); s.pop('MISS', [s.app.ui.w / 2 + 60, s.app.ui.h - 70], { color: '#ffd2dc' }); this.slice(C.n - 1, true); }
    if (C.notes.every((n) => n.done) && this.st > 0.3) {
      // the chopped pieces slide to the side; the next ingredient
      this.pieces.push(...this.chunks); this.chunks = [];
      C.ing++; C.n = 0;
      if (C.ing >= ING.length) { this.q.chop = clamp01(C.hits / Math.max(1, C.total)); this.score += Math.round(this.q.chop * 250); if (this.onBoard) { this.onBoard.parent.remove(this.onBoard); this.onBoard = null; } this.next(); return; }
      this.placeIngredient(C.ing); this.scheduleChops();
    }
  }
  slice(n, sloppy) {
    // each chop takes a slice off the whole ingredient (it shrinks; a little cube pile grows)
    if (!this.onBoard) return;
    const k = 1 - (n + 1) * 0.2; this.onBoard.scale.set(Math.max(0.2, k), 1, 1);
    const st = this.s.st, i = this.chop.ing, col = ING[i].col;
    const c = voxel(st, [4, 3, 4], (F) => { const a = F.c(col), b = F.c('#f4f0e6'); F.box(0, 0, 0, 3, 2, 3, (x, y) => (y === 2 && !sloppy ? b : a)); }, { vpm: 80, key: 'mg-chunk' + i + (sloppy ? 's' : '') });
    c.position.set(BOARD.x + 0.08 + (n % 2) * 0.05, BOARD.y + 0.03, BOARD.z - 0.08 + Math.floor(n / 2) * 0.06 + (this.s.rand() - 0.5) * 0.02); c.rotation.y = this.s.rand() * 0.6;
    this.s.root.add(c); (this.chunks = this.chunks || []).push(c);
  }
  // ================================================================ ADD: remember Mom's order
  beginAdd() {
    const s = this.s, order = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const j = Math.floor(s.rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    this.addSeq = { order, i: 0, show: 3.2, ok: 0, wrong: 0 };
    s.audio.sfx('notification');
  }
  tickAdd(dt, inp, live) {
    const s = this.s, A = this.addSeq;
    if (A.show > 0) { A.show -= dt; return; }
    if (!live) return;
    for (let k = 0; k < 4; k++) {
      const I = ING[k]; if (!(inp.pressed.has(I.key) || inp.pressed.has(ALT[I.key]) || this.tapIng === k)) continue;
      if (k === A.order[A.i]) {
        A.ok++; A.i++; s.audio.sfx('hydro_splash', { vol: 0.6, pitch: 1.2 }); s.audio.sfx('qte_good', { vol: 0.5, pitch: 1 + A.i * 0.1 });
        s.burst('splash', [POT.x, POT.y + 0.3, POT.z], { n: 8 }); s.burst('steam', [POT.x, POT.y + 0.35, POT.z], { n: 4 });
        this.throwIn(k); if (this.mom) this.mom.play('nod', { restart: true });
        if (A.i >= 4) { this.q.add = clamp01(A.ok / (A.ok + A.wrong)); this.score += Math.round(this.q.add * 200); if (A.wrong === 0) { s.pop('PERFECT ORDER!', [s.app.ui.w / 2, s.app.ui.h * 0.3], { scale: 2, grad: [WHITE, T.amber] }); s.audio.sfx('qte_perfect'); } setTimeout(() => this.stage === 1 && this.next(), 600); A.done = true; }
      } else { A.wrong++; s.audio.sfx('qte_miss'); s.shake(0.03); s.pop('Not yet!', [s.app.ui.w / 2, s.app.ui.h * 0.32], { color: '#ffd2dc' }); if (this.mom) this.mom.play('shrug', { restart: true }); if (A.wrong >= 3 && A.wrong % 3 === 0) A.show = 1.6; }
      break;
    }
    this.tapIng = null;
  }
  throwIn(k) {
    const st = this.s.st, m = voxel(st, [4, 3, 4], (F) => { F.box(0, 0, 0, 3, 2, 3, F.c(ING[k].col)); }, { vpm: 80, key: 'mg-chunk' + k });
    m.position.set(BOARD.x, BOARD.y + 0.06, BOARD.z); this.s.root.add(m);
    this.flying = this.flying || []; this.flying.push({ m, from: m.position.clone(), to: new V3(POT.x, POT.y + 0.1, POT.z), t: 0 });
    // the chopped pile of that ingredient goes too
    for (const p of this.pieces.splice(0, 4)) p.parent && p.parent.remove(p);
  }
  // ================================================================ SIMMER: hold to heat, keep in the moving zone
  tickSimmer(dt, inp, live) {
    const s = this.s;
    if (!live) return;
    this.simT += dt;
    this.heat = clamp01(this.heat + (inp.hold ? 0.55 : -0.42) * dt);
    this.zone = 0.45 + Math.sin(this.simT * 0.9) * 0.18 + Math.sin(this.simT * 2.3) * 0.06;
    const inZ = Math.abs(this.heat - this.zone) < 0.11; if (inZ) this.inZone += dt;
    if (this.simT > 2.5 && Math.floor(this.simT * 1.0) !== Math.floor((this.simT - dt) * 1.0)) { if (this.heat - this.zone > 0.2) this.say('Mom: Too hot! It\'ll boil over!', 1.2); else if (this.zone - this.heat > 0.2) this.say('Mom: A little more heat…', 1.2); }
    if (this.heat > 0.88) { s.shake(0.012, 14); this.boilT = (this.boilT || 0) - dt; if (this.boilT <= 0) { this.boilT = 0.25; s.burst('steam', [POT.x, POT.y + 0.3, POT.z], { n: 3 }); s.audio.sfx('steam_explosion', { vol: 0.2, pitch: 1.6 }); } }
    if (this.simT >= 11) { this.q.simmer = clamp01(this.inZone / (11 * 0.8)); this.score += Math.round(this.q.simmer * 300); this.next(); }
  }
  // ================================================================ STIR: mash ◀ ▶
  dropRoux() {
    const st = this.s.st, m = voxel(st, [8, 3, 8], (F) => { const a = F.c('#8a4a1a'), b = F.c('#6a3410'); F.box(0, 0, 0, 7, 2, 7, (x, y, z) => ((x >> 1) + (z >> 1)) % 2 ? a : b); }, { vpm: 64, key: 'mg-roux' });
    m.position.set(POT.x, POT.y + 0.6, POT.z); this.s.root.add(m);
    this.flying = this.flying || []; this.flying.push({ m, from: m.position.clone(), to: new V3(POT.x, POT.y + 0.08, POT.z), t: 0, plop: true });
  }
  tickStir(dt, inp, live) {
    const s = this.s;
    if (!live) return;
    const L = inp.pressed.has('ArrowLeft') || inp.pressed.has('a') || inp.edgeTap < 0, R = inp.pressed.has('ArrowRight') || inp.pressed.has('d') || inp.edgeTap > 0;
    const side = L ? 'L' : R ? 'R' : null;
    if (side && side !== this.lastStir) { this.lastStir = side; this.stirN++; this.ladleSpin = (this.ladleSpin || 0) + Math.PI * 0.55; s.audio.sfx('bubble', { vol: 0.5, pitch: 0.9 + Math.min(0.8, this.stirN * 0.02) }); if (this.stirN % 6 === 0) { s.burst('bubble', [POT.x, POT.y + 0.25, POT.z], { n: 3 }); s.shake(0.01); } if (this.stirN % 10 === 0) s.pop(`×${this.stirN}`, [s.app.ui.w / 2, s.app.ui.h * 0.62], { grad: [WHITE, T.amber] }); }
    else if (side) { s.audio.sfx('ui_error', { vol: 0.25 }); }
    this.thick = clamp01(this.stirN / 36);
    if (this.st >= 8 || this.stirN >= 40) { this.q.stir = clamp01(this.stirN / 36); this.score += Math.round(this.q.stir * 250); this.next(); }
  }
  // ================================================================ per frame
  update(dt, inp, live) {
    const s = this.s;
    this.shown += (this.score - this.shown) * Math.min(1, dt * 8); if (Math.abs(this.score - this.shown) < 1) this.shown = this.score;
    if (this.msg) { this.msg.t += dt; if (this.msg.t > this.msg.dur) this.msg = null; }
    if (live) { this.st += dt; this.clock = (this.clock || 0) + dt; }
    const k = STAGES[this.stage];
    if (k === 'chop') this.tickChop(dt, inp, live);
    else if (k === 'add') this.tickAdd(dt, inp, live);
    else if (k === 'simmer') this.tickSimmer(dt, inp, live);
    else if (k === 'stir') this.tickStir(dt, inp, live);
    // the knife chops down, pieces fly, the pot bubbles and steams with the heat, the ladle turns
    this.knifeT = Math.max(0, (this.knifeT || 0) - dt);
    this.knife.position.y = BOARD.y + 0.04 + (this.knifeT > 0 ? (this.knifeT / 0.18) * 0.04 : 0.12 + Math.sin(s.t * 6) * 0.01);
    this.knife.rotation.z = this.knifeT > 0 ? 0 : -0.1;
    for (const f of this.flying || []) { f.t += dt * 2.6; const u = clamp01(f.t); f.m.position.lerpVectors(f.from, f.to, u); f.m.position.y += Math.sin(u * Math.PI) * 0.35; if (u >= 1 && !f.fin) { f.fin = true; f.m.parent && f.m.parent.remove(f.m); if (f.plop) { s.audio.sfx('plop'); s.burst('splash', [POT.x, POT.y + 0.25, POT.z], { n: 10 }); } } }
    if (this.flying) this.flying = this.flying.filter((f) => !f.fin);
    const heat = k === 'simmer' ? this.heat : k === 'stir' ? 0.5 : this.stage >= 1 ? 0.3 : 0;
    this.flame.material.opacity = 0;
    // the gas ring: pixel flames round the burner, taller and orange-tipped as the heat goes up
    if (heat > 0.02) { this.flT = (this.flT || 0) - dt; if (this.flT <= 0) { this.flT = 0.09; const n = heat > 0.6 ? 2 : 1; for (let i = 0; i < n; i++) { const a = s.rand() * Math.PI * 2, r = 0.13; s.burst(heat > 0.78 ? 'fire' : 'bluefire', [POT.x + Math.cos(a) * r, POT.y + 0.005, POT.z + Math.sin(a) * r], { n: 1, scale: 0.22 + heat * 0.25, speed: 0.15 + heat * 0.25 }); } } }
    if (heat > 0.05 && this.stage >= 1) { this.bubT = (this.bubT || 0) - dt; if (this.bubT <= 0) { this.bubT = 0.65 - heat * 0.4; s.burst('bubble', [POT.x + (s.rand() - 0.5) * 0.14, POT.y + 0.12, POT.z + (s.rand() - 0.5) * 0.14], { n: 1, scale: 0.35, speed: 0.3 }); if (heat > 0.3) s.burst('steam', [POT.x, POT.y + 0.3, POT.z], { n: 1, scale: 0.7 }); } }
    this.soup.position.y = 0.04 + (this.stage >= 1 ? 0.04 : 0) + (k === 'simmer' ? Math.sin(s.t * 14) * 0.004 * this.heat : 0) + this.thick * 0.02;
    this.soupMat.color.set(this.thick > 0 ? lerpHex('#c8a058', '#7a4418', this.thick) : '#c8a058');
    if (this.ladleSpin) { this.ladle.rotation.y += Math.min(this.ladleSpin, dt * 14); this.ladleSpin = Math.max(0, this.ladleSpin - dt * 14); }
    this.cam(false);
  }
  async outro() {
    // a bowl of curry rice for your partner
    const s = this.s, st = s.st, bowl = voxel(st, [14, 7, 14], (F, r, H) => { const w = F.c('#f4f0e6'), b = F.c('#3e8ee8'), rice = F.c('#fbf3e3'), cur = F.c('#8a4a1a'), car = F.c('#f0802a'), pot = F.c('#d8b070'); H.ring(F, 6.5, 6.5, 0, 5, 5, 6.6, (x, y) => (y === 3 ? b : w)); H.disc(F, 6.5, 6.5, 0, 0, 5, w); H.disc(F, 6.5, 6.5, 1, 5, 5, (x) => (x < 7 ? rice : cur)); F.set(9, 6, 5, car); F.set(8, 6, 8, pot); F.set(10, 6, 7, car); }, { vpm: 48, key: 'mg-bowl' });
    const p = s.partner ? s.partner.g.position : new V3(61.4, this.fy, 143.5); bowl.position.set(p.x - 0.35, this.fy, p.z - 0.3); s.root.add(bowl);
    s.burst('steam', [bowl.position.x, bowl.position.y + 0.3, bowl.position.z], { n: 6 }); s.audio.sfx('plop');
    if (s.partner) { s.partner.faceTo(bowl.position.x, bowl.position.z); s.partner.play(s.partner.anim.clips && s.partner.anim.clips.munch ? 'munch' : 'win', { restart: true }); s.burst('heart', [p.x, p.y + 0.9, p.z], { n: 6 }); }
    if (this.mom) this.mom.play('clap', { restart: true });
    if (s.hero) s.hero.play('cheer', { restart: true });
    this.stageCam = 'eat';
  }
  finish() {
    if (this.over) return; this.over = true;
    const q = this.q, total = this.score, grade = total >= 860 ? 'S' : total >= 680 ? 'A' : total >= 460 ? 'B' : 'C';
    const line = { S: 'Mom: Chef\'s kiss! Even Grandma would ask for seconds.', A: 'Mom: Mmm! That\'s a proper curry, sweetheart.', B: 'Mom: Not bad at all! A little lumpy, but full of love.', C: 'Mom: …We\'ll call it "rustic". Your partner doesn\'t mind!' }[grade];
    this.s.end({ banner: 'ITADAKIMASU!', score: total, grade, lines: [`Chop ${Math.round(q.chop * 100)}%  ·  Order ${Math.round(q.add * 100)}%`, `Simmer ${Math.round(q.simmer * 100)}%  ·  Stir ${Math.round(q.stir * 100)}%`, line] });
  }
  say(text, dur = 1.6) { this.msg = { text, t: 0, dur }; }
  cam(snap) {
    const k = this.stageCam;
    if (k === 'chop') this.s.look(new V3(BOARD.x - 0.02, BOARD.y + 0.08, BOARD.z + 0.02), 1.8, -32, 42, 40, { rate: 3, snap });
    else if (k === 'eat') { const p = this.s.partner ? this.s.partner.g.position : new V3(61.4, this.fy, 143.5); this.s.look(new V3(p.x - 0.2, p.y + 0.5, p.z - 0.15), 2.4, 330, 14, 40, { rate: 3 }); }
    else this.s.look(new V3(POT.x + 0.1, POT.y + 0.2, POT.z + 0.05), 2.0, -24, 38, 40, { rate: 3, snap });
  }
  // ================================================================ HUD
  draw(ui) {
    const s = this.s, W = ui.w, H = ui.h, k = STAGES[this.stage];
    drawScore(ui, 6, 6, this.shown, { label: 'TASTE', best: s.mg.best('curry') });
    // the step tracker
    const sx = W / 2 - 92; STAGES.forEach((n, i) => { const on = i === this.stage, done = i < this.stage, x = sx + i * 46; ui.panel(x, 6, 42, 18, { thin: true, fill: on ? '#f0b030' : done ? '#a6ec80' : undefined }); ui.text(n.toUpperCase(), x + 21, 12, T.text, { mini: true, align: 'center' }); });
    if (k === 'chop' && this.chop) this.drawChop(ui, W, H);
    if (k === 'add' && this.addSeq) this.drawAdd(ui, W, H);
    if (k === 'simmer') {
      const gx = W - 30, gy = Math.round(H * 0.24), gh = Math.round(Math.min(120, H * 0.48));
      vGauge(ui, gx, gy, 12, gh, this.heat, [[0, 1, '#3e8ee8'], [clamp01(this.zone - 0.11), clamp01(this.zone + 0.11), '#5cc24a']], { needle: this.heat > 0.88 ? T.red : WHITE });
      worldText(ui, 'HEAT', gx + 6, gy + gh + 8, { mini: true, align: 'center' });
      ui.bar(W / 2 - 60, H - 46, 120, 5, this.simT / 11, { color: 'orange', shine: false, trail: false, id: 'mg-sim' });
      keyRow(ui, W / 2, H - 30, [['HOLD SPACE', 'Flame up'], ['LET GO', 'Down']]);
    }
    if (k === 'stir') {
      const n = this.stirN; ui.panel(W / 2 - 70, H - 64, 140, 30, {}); ui.text('STIR', W / 2 - 60, H - 57, T.dim, { mini: true }); ui.bar(W / 2 - 60, H - 48, 120, 6, n / 36, { color: n >= 36 ? 'yellow' : 'orange', id: 'mg-stir' });
      const blink = ((s.t * 8) | 0) % 2; keyRow(ui, W / 2, H - 28, [[blink ? '◀' : '▶', 'Mash left / right!']]);
    }
    if (this.msg) worldText(ui, this.msg.text, W / 2, Math.round(H * 0.2), { align: 'center' });
  }
  drawChop(ui, W, H) {
    const C = this.chop, b = this.beat(), y = H - 44, x0 = Math.round(W / 2 - 110), w = 220, hitX = x0 + 40, ppb = 46;
    ui.panel(x0 - 8, y - 18, w + 16, 34, {});
    ui.text(ING[C.ing].name.toUpperCase() + `  ${C.ing + 1}/4`, x0, y - 11, T.dim, { mini: true });
    ui.rect(x0, y + 1, w, 3, T.creamD || '#e5d2b4');
    ui.rect(hitX - 1, y - 6, 3, 14, T.amber2);
    for (const n of C.notes) { if (n.done) continue; const x = Math.round(hitX + (n.b - b) * ppb); if (x < x0 - 4 || x > x0 + w) continue; ui.rrect(x - 4, y - 2, 9, 9, T.ink, 4); ui.rrect(x - 3, y - 1, 7, 7, ING[C.ing].col, 3); }
    keyRow(ui, W / 2, y + 22, [['SPACE', 'Chop on the line']]);
  }
  drawAdd(ui, W, H) {
    const A = this.addSeq, cx = W / 2, y = Math.round(H * 0.26), show = A.show > 0;
    ui.panel(cx - 104, y, 208, 48, {}); ui.text(show ? 'MOM SAYS: REMEMBER THE ORDER!' : 'ADD THEM IN ORDER', cx, y + 7, T.dim, { mini: true, align: 'center' });
    A.order.forEach((k, i) => {
      const x = Math.round(cx - 78 + i * 52), I = ING[k], revealed = show || i < A.i;
      ui.panel(x - 2, y + 16, 54 - 6, 24, { thin: true, fill: i < A.i ? '#a6ec80' : undefined });
      if (revealed) { ui.rrect(x + 3, y + 21, 12, 12, I.col, 5); ui.text(I.name.slice(0, 6).toUpperCase(), x + 18, y + 25, T.text, { mini: true }); }
      else ui.text('?', x + 22, y + 22, T.dim, { scale: 2, align: 'center' });
    });
    if (!show) {
      // four big ingredient buttons (keys or taps)
      const bw = Math.min(70, Math.floor((W - 20) / 4) - 4), bx = Math.round(cx - (bw * 4 + 12) / 2), by = H - 40;
      ING.forEach((I, k) => { const x = bx + k * (bw + 4); ui.panel(x, by, bw, 30, { thin: true }); ui.rrect(x + 5, by + 9, 12, 12, I.col, 5); ui.keycap(x + bw - 16, by + 5, I.glyph); ui.text(I.name.slice(0, 6).toUpperCase(), x + 20, by + 18, T.text, { mini: true }); if (this.s.live && ui.ptr.pressed && ui.inside(x, by, bw, 30)) { this.tapIng = k; ui.ptr.pressed = false; } });
    }
  }
  bot(inp) {
    const k = STAGES[this.stage];
    if (k === 'chop') { const b = this.beat(); if (this.chop.notes.some((n) => !n.done && Math.abs(n.b - b) < 0.05)) inp.tap = true; }
    else if (k === 'add') { const A = this.addSeq; if (A.show <= 0 && !A.done) inp.pressed.add(ING[A.order[A.i]].key); }
    else if (k === 'simmer') inp.hold = this.heat < this.zone;
    else if (k === 'stir') inp.pressed.add(this.lastStir === 'L' ? 'ArrowRight' : 'ArrowLeft');
  }
  debug() { return { stage: STAGES[this.stage], st: +this.st.toFixed(1), score: this.score, q: this.q }; }
  dispose() { if (this.mom && this.momWas) { const [x, z, yaw, y] = this.momWas; this.mom.place(x, z, yaw, y); this.mom.play('idle'); } }
}
function lerpHex(a, b, t) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), m = (s) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * t); return '#' + ((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0'); }
void lerp; void easeOut; void boing; void fmt; void clamp; void GLOW; void bigText;
