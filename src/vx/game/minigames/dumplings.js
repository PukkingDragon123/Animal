// DUMPLING RUSH — the lunch rush at Dumpling Auntie's cart on Grant Lane.
// Tokonmon queue up across the counter, each wanting one steamer of bao, har gow or siu mai. Pick the dough
// (A / S / D), pleat it (SPACE as the needle crosses each mark), and it goes into a free steamer. Pull a
// steamer (J / K / L) while it glows gold — too soon is doughy, too late and it burns. The dumplings fly to
// whoever ordered them. Perfect folds + perfect steams in a row build the combo; let a customer wait too long
// and they storm off.
import * as THREE from '../../../../vendor/three.module.js';
import { T } from '../../../px/game/ui.js';
import { SPECIES } from '../../../data/species.js';
import { V3, clamp, clamp01, lerp, easeOut, boing, fmt, drawTimer, drawScore, drawCombo, keyRow, boxes, cyl, ball, WHITE, worldText } from './kit.js';

const ROUND = 75, COOK = 4.2, PERF = [1.0, 1.42], BURN = 2.05;
const TYPES = [
  { id: 'bao', name: 'Bao', key: 'a', alt: 'ArrowLeft', col: '#fbf3e3', dot: '#e2403a' },
  { id: 'hargow', name: 'Har gow', key: 's', alt: 'ArrowDown', col: '#f8c8c0', dot: '#e8743a' },
  { id: 'siumai', name: 'Siu mai', key: 'd', alt: 'ArrowRight', col: '#f0c040', dot: '#e8743a' },
];
const STEAM_KEYS = ['j', 'k', 'l'];
const TX0 = 145.45, TX1 = 146.15, TZ0 = 84.2, TZ1 = 86.3, TY = 0.92;          // the folding counter
const SLOTS = [84.55, 85.2, 85.85];                                              // steamer z positions
const QUEUE = [[147.35, 84.45], [147.35, 85.35], [147.35, 86.25]];
const CUSTOMERS = ['pidgun', 'cabbunny', 'lemmo', 'zapanda', 'trashcoon', 'kappachi', 'strawbaa', 'gradcub', 'zapkit', 'woodbub', 'beatlet', 'pepperhorn'];

export default class Dumplings {
  static howto = 'Fold the dough each Tokonmon wants, steam it, and pull the steamer while it glows gold. Burnt bottoms make Auntie sad!';
  static keys = [['A S D', 'Dough'], ['SPACE', 'Pleat'], ['J K L', 'Steamers']];
  static ranks = [2600, 1700, 900];
  static rewards(res, o) {
    const items = []; if (res.served >= 8) items.push(['takoyaki', 1]); if (res.perfect >= 6) items.push(['okonomiyaki', 1]);
    return { money: Math.round(res.score * 0.35), friend: (res.score >= 1700 ? 4 : res.score >= 800 ? 3 : 2) + (o.record ? 1 : 0), items };
  }
  constructor(sess) { this.s = sess; this.prefer = 20; }

  // ================================================================ the set
  async setup() {
    const s = this.s, root = s.root, gy = s.ground(146, 85.2, 0);
    this.gy = gy; const ty = gy + TY;
    // the counter: legs, top, a red cloth skirt with gold trim, a dough board at the south end
    root.add(boxes([
      [TX0, gy, TZ0, TX0 + 0.06, ty, TZ0 + 0.06, '#5a3a24'], [TX1 - 0.06, gy, TZ0, TX1, ty, TZ0 + 0.06, '#5a3a24'], [TX0, gy, TZ1 - 0.06, TX0 + 0.06, ty, TZ1, '#5a3a24'], [TX1 - 0.06, gy, TZ1 - 0.06, TX1, ty, TZ1, '#5a3a24'],
      [TX0 - 0.02, ty - 0.05, TZ0 - 0.02, TX1 + 0.02, ty, TZ1 + 0.02, '#a8804a'],
      [TX1 + 0.0, gy + 0.3, TZ0, TX1 + 0.02, ty - 0.05, TZ1, '#c8282a'], [TX1 + 0.021, gy + 0.62, TZ0, TX1 + 0.03, gy + 0.7, TZ1, '#f0c040'],
      [TX0 + 0.08, ty, 85.95, TX1 - 0.08, ty + 0.025, 86.25, '#d8b080'],
    ]));
    // three steamer stacks, each with a lid that lifts
    this.slots = SLOTS.map((z, i) => {
      const g = new THREE.Group(); g.position.set((TX0 + TX1) / 2, ty, z); root.add(g);
      const b1 = cyl(0.2, 0.2, 0.11, '#c8a060', 14); b1.position.y = 0.055; g.add(b1);
      const b2 = cyl(0.205, 0.205, 0.02, '#a8804a', 14); b2.position.y = 0.11; g.add(b2);
      const lid = new THREE.Group(); lid.position.y = 0.12; g.add(lid);
      const l1 = cyl(0.19, 0.21, 0.07, '#d4b070', 14); l1.position.y = 0.035; lid.add(l1);
      const knob = cyl(0.03, 0.03, 0.04, '#8a6a3a', 6); knob.position.y = 0.09; lid.add(knob);
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.2, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd860', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      glow.position.y = 0.1; g.add(glow);
      return { i, g, lid, glow, b1, food: null, cook: 0, q: 1, type: null, puffT: 0, dinged: false, shake: 0 };
    });
    this.boardAt = new V3((TX0 + TX1) / 2, ty + 0.03, 86.1);
    // people: you behind the counter, Auntie at her cart, your partner minding the queue
    if (s.hero) { s.hero.place(144.95, 85.25, Math.PI / 2, gy); s.hero.play('idle'); }
    this.auntie = s.w.actor('ctDumpling');
    if (s.partner) { s.partner.place(145.6, 86.95, Math.PI * 0.75, gy); s.partner.play('idle'); }
    this.custPool = CUSTOMERS.filter((id) => SPECIES[id] && id !== (s.lead && s.lead.species));
  }
  async intro(cin) {
    const s = this.s, V = (x, y, z) => new V3(x, y, z), gy = this.gy;
    await cin.cut({ target: V(146, gy + 1.5, 80), dist: 30, yaw: 10, pitch: 30 });
    cin.move({ target: V(145.6, gy + 1.0, 85.3), dist: 6.2, yaw: 24, pitch: 30 }, { dur: 3.2 });
    if (this.auntie) this.auntie.play('wave');
    if (s.hero) s.hero.play('cheer');
    await s.app.wait(2800);
    if (this.auntie) { await cin.frame(this.auntie, { dist: 2.6, yaw: 80, pitch: 6, dur: 0.7, hold: 3 }); this.auntie.play('point'); }
    await s.app.wait(800);
  }
  reset() {
    this.t = ROUND; this.score = 0; this.shown = 0; this.combo = 0; this.bestCombo = 0; this.comboT = 9; this.served = 0; this.perfect = 0; this.lost = 0; this.burnt = 0;
    this.fold = null; this.board = null; this.spawnT = 1.2; this.queue = [null, null, null]; this.leaving = []; this.flying = []; this.msg = null; this.over = false;
    for (const sl of this.slots) this.clearSlot(sl);
    for (const c of this.allCust || []) this.s.drop(c.a);
    this.allCust = [];
    this.cam(true);
  }
  start() { this.s.audio.music('e4_paul', { fade: 0.6 }); }
  // ================================================================ customers
  async spawn(qi) {
    const s = this.s, sp = this.custPool[Math.floor(s.rand() * this.custPool.length)], fromN = s.rand() < 0.5, [qx, qz] = QUEUE[qi];
    const c = { qi, type: Math.floor(s.rand() * 3), wait: 0, patience: lerp(17, 11, clamp01((ROUND - this.t) / ROUND)) + s.rand() * 3, arrived: false, a: null, mood: 0 };
    this.queue[qi] = c;
    const a = await s.mon(sp, [qx + 0.6, fromN ? 78 : 92, fromN ? 0 : Math.PI]).catch(() => null);
    if (!a) { this.queue[qi] = null; return; }
    c.a = a; this.allCust.push(c);
    a.walkTo([[qx + 0.5, qz], [qx, qz]], { speed: 2.4 }).then(() => { c.arrived = true; a.faceTo(TX1, qz); a.play('idle'); s.audio.sfx('notification', { vol: 0.3, pitch: 1.3 + qi * 0.1 }); });
  }
  leave(c, happy) {
    const s = this.s, a = c.a; this.queue[c.qi] = null; if (!a) return;
    if (happy) { a.play('win', { restart: true }); s.burst('heart', this.head(a), { n: 4 }); }
    else { a.play('cry', { restart: true }); s.burst('anger', this.head(a), { n: 1 }); }
    setTimeout(() => { if (this.over || !a.g.parent) return; const z = a.g.position.z < 85.3 ? 76 : 94; a.walkTo([[a.g.position.x + 0.6, a.g.position.z], [a.g.position.x + 0.8, z]], { speed: 2.6 }).then(() => s.drop(a)); }, happy ? 900 : 700);
  }
  head(a) { const p = a.g.position; return [p.x, p.y + 0.9, p.z]; }
  // ================================================================ steamers
  clearSlot(sl) { if (sl.food) sl.g.remove(sl.food); sl.food = null; sl.type = null; sl.cook = 0; sl.dinged = false; sl.q = 1; sl.burnt = false; sl.lid.position.y = 0.12; sl.glow.material.opacity = 0; }
  dumplingMesh(type, n = 3) {
    const T0 = TYPES[type], g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, x = Math.cos(a) * 0.08, z = Math.sin(a) * 0.08;
      let m;
      if (type === 0) { m = ball(0.065, T0.col, { seg: 10, seg2: 7 }); m.scale.y = 0.75; }
      else if (type === 1) { m = ball(0.06, T0.col, { seg: 8, seg2: 6 }); m.scale.set(1.2, 0.65, 0.8); }
      else { m = cyl(0.055, 0.05, 0.08, T0.col, 8); }
      m.position.set(x, 0.05, z); g.add(m);
      const dot = ball(0.018, T0.dot, { seg: 6, seg2: 4 }); dot.position.set(x, type === 2 ? 0.095 : 0.098, z); g.add(dot);
    }
    return g;
  }
  /** a folded batch into the first free steamer */
  load(type, q) {
    const s = this.s, sl = this.slots.find((x) => !x.type && x.type !== 0);
    if (!sl) { this.say('All steamers busy!', 1.2); s.audio.sfx('ui_error'); return false; }
    sl.type = type; sl.q = q; sl.cook = 0; sl.dinged = false; sl.burnt = false;
    sl.food = this.dumplingMesh(type); sl.food.position.y = 0.11; sl.g.add(sl.food);
    sl.lid.position.y = 0.42; sl.shake = 0.3;
    s.audio.sfx('plop', { pitch: 1.2 }); s.burst('steam', [sl.g.position.x, sl.g.position.y + 0.3, sl.g.position.z], { n: 6 });
    return true;
  }
  pull(sl) {
    const s = this.s, p = sl.g.position;
    if (sl.type === null || sl.type === undefined) { s.audio.sfx('ui_error', { vol: 0.5 }); return; }
    if (sl.burnt) { this.clearSlot(sl); s.audio.sfx('whoosh'); s.burst('smoke', [p.x, p.y + 0.3, p.z], { n: 8 }); this.say('Tossed it.', 1); return; }
    if (sl.cook < 0.7) { this.say('Not ready yet!', 0.9); s.audio.sfx('ui_error', { vol: 0.5 }); sl.shake = 0.2; return; }
    const k = sl.cook, steamQ = k >= PERF[0] && k <= PERF[1] ? 1 : k < PERF[0] ? 0.6 : 0.7, q = sl.q * steamQ, perfect = sl.q >= 0.99 && steamQ === 1;
    // who ordered it? the one who has waited longest
    let best = null; for (const c of this.queue) if (c && c.arrived && c.type === sl.type && (!best || c.wait / c.patience > best.wait / best.patience)) best = c;
    s.burst('steam', [p.x, p.y + 0.35, p.z], { n: 14, scale: 1.4 }); s.audio.sfx('steam_explosion', { vol: 0.45, pitch: 1.4 });
    const food = sl.food; sl.food = null; sl.g.remove(food); this.s.root.add(food); food.position.set(p.x, p.y + 0.13, p.z);
    const type = sl.type; this.clearSlot(sl);
    if (!best) { this.say(`Nobody ordered ${TYPES[type].name}!`, 1.4); s.audio.sfx('qte_miss'); this.combo = 0; this.flyTo(food, new V3(p.x - 0.8, this.gy + 0.2, p.z + 2), () => { s.root.remove(food); s.burst('dust', [p.x - 0.8, this.gy + 0.2, p.z + 2], { n: 4 }); }); return; }
    best.served = true; this.queue[best.qi] = null;
    const tgt = new V3(best.a.g.position.x, best.a.g.position.y + 0.55, best.a.g.position.z);
    this.flyTo(food, tgt, () => {
      s.root.remove(food);
      const tip = Math.round(40 * clamp01(1 - best.wait / best.patience)), mult = 1 + Math.min(1, this.combo * 0.12), pts = Math.round((100 * q + tip) * mult);
      this.score += pts; this.served++; if (perfect) { this.perfect++; this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo); this.comboT = 0; } else this.combo = 0;
      s.pop('+' + pts, new V3(tgt.x, tgt.y + 0.6, tgt.z), { scale: 2, rise: 22 });
      if (perfect) { s.pop(this.combo >= 2 ? `PERFECT ×${this.combo}` : 'PERFECT!', new V3(tgt.x, tgt.y + 0.95, tgt.z), { grad: [WHITE, T.amber], rise: 20 }); s.audio.sfx('qte_perfect'); s.punch(3); }
      else s.audio.sfx('coin');
      s.audio.sfx('coin', { pitch: 1.3 }); s.burst('sparkle', [tgt.x, tgt.y, tgt.z], { n: 8 });
      if (this.auntie && perfect && this.combo % 3 === 0) this.auntie.play('cheer', { restart: true });
      if (s.partner && this.combo >= 4 && this.combo % 4 === 0) s.partner.play('dance', { restart: true });
      this.leave(best, true);
    });
  }
  flyTo(obj, to, done) { const from = obj.position.clone(); this.flying.push({ obj, from, to, t: 0, dur: 0.45, done }); }
  // ================================================================ per frame
  update(dt, inp, live) {
    const s = this.s;
    this.shown += (this.score - this.shown) * Math.min(1, dt * 8); if (Math.abs(this.score - this.shown) < 1) this.shown = this.score;
    this.comboT += dt; if (this.msg) { this.msg.t += dt; if (this.msg.t > this.msg.dur) this.msg = null; }
    for (const f of this.flying) { f.t += dt; const k = clamp01(f.t / f.dur); f.obj.position.lerpVectors(f.from, f.to, k); f.obj.position.y += Math.sin(k * Math.PI) * 0.6; f.obj.rotation.y += dt * 9; if (k >= 1) { f.done(); f.fin = true; } }
    this.flying = this.flying.filter((f) => !f.fin);
    for (const sl of this.slots) this.tickSlot(sl, dt, live);
    if (live) {
      this.t -= dt;
      if (this.t <= 5 && Math.ceil(this.t) !== Math.ceil(this.t + dt) && this.t > 0) s.audio.sfx('ui_tap', { pitch: 1.6, vol: 0.8 });
      // new customers
      this.spawnT -= dt;
      const free = this.queue.findIndex((q) => !q);
      if (this.spawnT <= 0 && free >= 0 && this.t > 4) { this.spawnT = lerp(5.5, 2.8, clamp01((ROUND - this.t) / ROUND)) + s.rand() * 1.5; this.spawn(free); }
      for (const c of this.queue) if (c && c.arrived && !c.served) {
        c.wait += dt;
        if (c.wait > c.patience) { this.lost++; this.combo = 0; s.audio.sfx('qte_miss'); s.pop('Too slow!', new V3(...this.head(c.a)), { color: '#ffd2dc' }); s.shake(0.04); this.leave(c, false); if (this.auntie) this.auntie.play('facepalm', { restart: true }); }
      }
      this.input(inp, dt);
      if (this.t <= 0) return this.finish();
    }
    this.tickFold(dt);
    this.cam(false);
  }
  input(inp, dt) {
    const s = this.s, P = inp.pressed;
    // dough (keys, or the on-screen buttons)
    for (let i = 0; i < 3; i++) if ((P.has(TYPES[i].key) || P.has(TYPES[i].alt) || this.tapped === 'd' + i) && !this.fold) this.startFold(i);
    for (let i = 0; i < 3; i++) if (P.has(STEAM_KEYS[i]) || this.tapped === 's' + i) this.pull(this.slots[i]);
    if (this.fold && (P.has(' ') || P.has('Enter') || this.tapped === 'pleat')) this.pleat();
    this.tapped = null;
  }
  startFold(type) {
    const s = this.s; if (!this.slots.some((x) => x.type === null || x.type === undefined)) { this.say('All steamers busy!', 1.2); s.audio.sfx('ui_error'); return; }
    this.fold = { type, t: 0, hits: [], marks: [0.15, 0.4, 0.65, 0.9], miss: 0 };
    this.board = this.dumplingMesh(type, 1); this.board.position.copy(this.boardAt); this.board.scale.setScalar(0.4); s.root.add(this.board);
    s.audio.sfx('cloth', { pitch: 1.2 });
  }
  pleat() {
    const s = this.s, F = this.fold, ph = F.t / 1.6;
    let hit = -1; F.marks.forEach((m, i) => { if (!F.hits[i] && Math.abs(ph - m) < 0.075) hit = i; });
    if (hit >= 0) { F.hits[hit] = true; s.audio.sfx('qte_good', { pitch: 1 + F.hits.filter(Boolean).length * 0.08, vol: 0.6 }); this.board.scale.setScalar(0.4 + 0.15 * F.hits.filter(Boolean).length); s.burst('sparkle', [this.boardAt.x, this.boardAt.y + 0.1, this.boardAt.z], { n: 2 }); }
    else { F.miss++; s.audio.sfx('ui_error', { vol: 0.4 }); }
  }
  tickFold(dt) {
    const F = this.fold; if (!F) return;
    F.t += dt;
    if (F.t >= 1.6 || F.hits.filter(Boolean).length === 4) {
      const n = F.hits.filter(Boolean).length, q = clamp01(n / 4 - F.miss * 0.1);
      const s = this.s; s.root.remove(this.board); this.board = null; this.fold = null;
      if (n === 4 && F.miss === 0) s.pop('NEAT FOLD!', [s.app.ui.w * 0.5, s.app.ui.h - 70], { grad: [WHITE, T.amber] });
      else if (n <= 1) s.pop('Sloppy…', [s.app.ui.w * 0.5, s.app.ui.h - 70], { color: '#ffd2dc' });
      this.load(F.type, Math.max(0.35, q));
    }
  }
  tickSlot(sl, dt, live) {
    const s = this.s, p = sl.g.position;
    sl.shake = Math.max(0, sl.shake - dt); sl.g.rotation.z = Math.sin(s.t * 40) * sl.shake * 0.15;
    if (sl.type === null || sl.type === undefined) { sl.lid.position.y += (0.12 - sl.lid.position.y) * Math.min(1, dt * 10); return; }
    sl.lid.position.y += (0.12 - sl.lid.position.y) * Math.min(1, dt * 6);
    if (live) sl.cook += dt / COOK;
    const k = sl.cook;
    sl.puffT -= dt; if (sl.puffT <= 0 && k > 0.2) { sl.puffT = k >= PERF[0] && k <= PERF[1] ? 0.12 : 0.35; s.burst(k > PERF[1] ? 'smoke' : 'steam', [p.x + (s.rand() - 0.5) * 0.2, p.y + 0.3, p.z], { n: 1 }); }
    if (k >= PERF[0] && !sl.dinged) { sl.dinged = true; s.audio.sfx('notification', { pitch: 1.5 + sl.i * 0.15, vol: 0.7 }); sl.shake = 0.25; }
    sl.glow.material.opacity = k >= PERF[0] && k <= PERF[1] ? 0.25 + Math.sin(s.t * 12) * 0.12 : 0;
    if (k > PERF[1] && k < BURN) sl.shake = Math.max(sl.shake, 0.08);
    if (k >= BURN && !sl.burnt) { sl.burnt = true; this.burnt++; this.combo = 0; s.audio.sfx('fire', { vol: 0.6 }); s.burst('smoke', [p.x, p.y + 0.3, p.z], { n: 16, scale: 1.4 }); s.shake(0.06); this.say('BURNT! Toss it (' + STEAM_KEYS[sl.i].toUpperCase() + ')', 1.6); if (this.auntie) this.auntie.play('angry', { restart: true }); sl.food.traverse((m) => { if (m.material && m.material.color) m.material.color.set('#3a2a22'); }); this.score = Math.max(0, this.score - 30); }
  }
  finish() {
    if (this.over) return; this.over = true;
    this.s.end({ score: this.score, served: this.served, perfect: this.perfect, lines: [`Served ${this.served}  ·  perfect ${this.perfect}`, `Walked out ${this.lost}  ·  burnt ${this.burnt}`, `Best streak ×${this.bestCombo}`] });
  }
  say(text, dur = 1.4) { this.msg = { text, t: 0, dur }; }
  cam(snap) { this.s.look(new V3(145.95, this.gy + 0.95, 85.35), 5.6, 22, 36, 40, { rate: 4, snap }); }
  // ================================================================ HUD
  draw(ui) {
    const s = this.s, W = ui.w, H = ui.h, narrow = W < 360;
    drawScore(ui, 6, 6, this.shown, { best: s.mg.best('dumplings') });
    drawTimer(ui, W / 2, 6, Math.max(0, this.t), ROUND, s.t);
    ui.panel(W - 70, 6, 64, 18, { thin: true }); ui.icon('heart', W - 64, 11.5, T.red); ui.text(String(this.served), W - 53, 12, T.text); ui.icon('close', W - 34, 11.5, '#8c6650'); ui.text(String(this.lost), W - 23, 12, T.text);
    drawCombo(ui, 10, 48, this.combo, this.comboT, { hot: 6, label: 'STREAK' });
    // order bubbles over the queue
    for (const c of this.queue) {
      if (!c || !c.a || !c.arrived) continue;
      const pr = s.project([c.a.g.position.x, c.a.g.position.y + 1.25, c.a.g.position.z]); if (!pr.vis) continue;
      const x = Math.round(pr.x) - 15, y = Math.round(pr.y) - 30, frac = clamp01(1 - c.wait / c.patience), urgent = frac < 0.3 && ((s.t * 6) | 0) % 2;
      ui.panel(x, y, 30, 28, { thin: true, edge: urgent ? '#d8443e' : undefined });
      dumplingIcon(ui, c.type, x + 15, y + 11, 1.4);
      ui.bar(x + 4, y + 22, 22, 3, frac, { color: frac > 0.5 ? 'green' : frac > 0.25 ? 'orange' : 'red', shine: false, trail: false, id: 'mg-dq' + c.qi });
      ui.rect(Math.round(pr.x) - 1, y + 28, 3, 2, T.ink);
    }
    // steamer rings with their keys
    for (const sl of this.slots) {
      const p = sl.g.position, pr = s.project([p.x, p.y + 0.55, p.z]); if (!pr.vis) continue;
      const cx = Math.round(pr.x), cy = Math.round(pr.y), k = sl.cook, has = sl.type !== null && sl.type !== undefined;
      ringGauge(ui, cx, cy, 11, has ? clamp01(k / BURN) : 0, has ? (sl.burnt ? '#3a2a22' : k >= PERF[0] && k <= PERF[1] ? '#f0b030' : k > PERF[1] ? '#e2403a' : '#3ab8d8') : '#a89a8c');
      ui.keycap(cx - 5, cy - 6, STEAM_KEYS[sl.i].toUpperCase());
      if (has && k >= PERF[0] && k <= PERF[1]) worldText(ui, 'NOW!', cx, cy - 22 - (((s.t * 8) | 0) % 2), { align: 'center', mini: true, color: '#ffe8a0' });
      if (sl.burnt) worldText(ui, 'BURNT', cx, cy - 22, { align: 'center', mini: true, color: '#ffbc94' });
      if (s.live && ui.ptr.pressed && Math.hypot(ui.ptr.x - cx, ui.ptr.y - cy) < 16) { this.tapped = 's' + sl.i; ui.ptr.pressed = false; }
    }
    // the dough buttons (bottom left) and the fold ring (bottom centre)
    const bw = narrow ? 50 : 62, by = H - 34;
    TYPES.forEach((tp, i) => {
      const x = 8 + i * (bw + 6), dis = !!this.fold;
      ui.panel(x, by, bw, 28, { thin: true, edge: dis ? '#a89a8c' : undefined });
      dumplingIcon(ui, i, x + 12, by + 13, 1.3);
      ui.keycap(x + bw - 15, by + 4, tp.key.toUpperCase());
      ui.text(tp.name.toUpperCase(), x + 22, by + 19, dis ? '#a89a8c' : T.text, { mini: true });
      if (s.live && ui.ptr.pressed && ui.inside(x, by, bw, 28)) { this.tapped = 'd' + i; ui.ptr.pressed = false; }
    });
    const F = this.fold;
    if (F) {
      const cx = Math.round(W / 2 + (narrow ? 40 : 30)), cy = H - 44, R = 22, ph = F.t / 1.6;
      ui.panel(cx - 32, cy - 32, 64, 64, {});
      for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2 - Math.PI / 2; ui.rect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 2, 2, T.creamD || '#e5d2b4'); }
      F.marks.forEach((m, i) => { const a = m * Math.PI * 2 - Math.PI / 2, mx = Math.round(cx + Math.cos(a) * R), my = Math.round(cy + Math.sin(a) * R); ui.rrect(mx - 4, my - 4, 8, 8, F.hits[i] ? '#5cc24a' : '#f0b030', 4); ui.rrect(mx - 2, my - 2, 4, 4, WHITE, 2); });
      const a = ph * Math.PI * 2 - Math.PI / 2; for (let r = 4; r < R + 6; r += 2) ui.rect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2, T.ink);
      dumplingIcon(ui, F.type, cx, cy, 2);
      worldText(ui, 'SPACE: PLEAT', cx, cy + 36, { mini: true, align: 'center' });
      if (s.live && ui.ptr.pressed && ui.inside(cx - 32, cy - 32, 64, 64)) { this.tapped = 'pleat'; ui.ptr.pressed = false; }
    } else if (!narrow) keyRow(ui, W / 2 + 70, H - 26, [['J K L', 'Pull steamer']]);
    if (this.msg) worldText(ui, this.msg.text, W / 2, H * 0.22, { align: 'center' });
  }
  bot(inp) {
    // pull anything in the gold window (or burnt), fold what the oldest customer wants, pleat on the marks
    for (const sl of this.slots) if (sl.type !== null && sl.type !== undefined && ((sl.cook >= PERF[0] + 0.05 && sl.cook <= PERF[1]) || sl.burnt)) { inp.pressed.add(STEAM_KEYS[sl.i]); return; }
    if (this.fold) { const ph = this.fold.t / 1.6; if (this.fold.marks.some((m, i) => !this.fold.hits[i] && Math.abs(ph - m) < 0.03)) inp.pressed.add(' '); return; }
    const want = this.queue.filter((c) => c && c.arrived && !this.slots.some((x) => x.type === c.type)).sort((a, b) => b.wait - a.wait)[0];
    if (want && this.slots.some((x) => x.type === null || x.type === undefined)) inp.pressed.add(TYPES[want.type].key);
  }
  waiting() { return false; }
  debug() { return { t: +this.t.toFixed(1), score: this.score, served: this.served, perfect: this.perfect, lost: this.lost, slots: this.slots.map((x) => x.type === null ? '-' : TYPES[x.type].id + ':' + x.cook.toFixed(2)), queue: this.queue.map((c) => c ? TYPES[c.type].id + (c.arrived ? '' : '…') : '-') }; }
  dispose() { this.over = true; if (this.auntie) this.auntie.play('idle'); }
}
// a dumpling as a little pixel picture, centred on (cx, cy)
export function dumplingIcon(ui, type, cx, cy, k = 1) {
  const T0 = TYPES[type], r = Math.round(5 * k), x = Math.round(cx), y = Math.round(cy);
  if (type === 0) { ui.rrect(x - r - 1, y - r, r * 2 + 2, r * 2, T.ink, r); ui.rrect(x - r, y - r + 1, r * 2, r * 2 - 2, T0.col, r); ui.rect(x - 1, y - r + 2, 2, 2, T0.dot); ui.rect(x - r + 2, y - 1, 2, 1, '#e5d2b4'); }
  else if (type === 1) { ui.rrect(x - r - 1, y - r + 2, r * 2 + 2, r * 2 - 3, T.ink, r); ui.rrect(x - r, y - r + 3, r * 2, r * 2 - 5, T0.col, r); for (let i = -r + 2; i < r - 1; i += 2) ui.rect(x + i, y - r + 3, 1, 2, '#e8a090'); ui.rect(x - 1, y, 2, 2, T0.dot); }
  else { ui.rect(x - r, y - r + 1, r * 2, r * 2 - 1, T.ink); ui.rect(x - r + 1, y - r + 2, r * 2 - 2, r * 2 - 3, T0.col); ui.rect(x - r + 1, y - r + 2, r * 2 - 2, 2, '#f8e070'); ui.rect(x - 1, y - r + 2, 3, 2, T0.dot); }
}
// a ring gauge of pixel dots (v 0..1 filled clockwise from the top)
function ringGauge(ui, cx, cy, R, v, col) {
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2 - Math.PI / 2, on = i / 28 < v; ui.rect(Math.round(cx + Math.cos(a) * R) - 1, Math.round(cy + Math.sin(a) * R) - 1, 3, 3, on ? col : 'rgba(43,26,23,0.45)'); }
}
void easeOut; void boing; void fmt; void clamp;
