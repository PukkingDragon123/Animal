// BAYSIDE BITE — a 75-second fishing derby off the end of Bayside Pier.
// Aim with ◀ ▶ and cast on the swinging power meter (the gold zone is a perfect cast). Shadows of water
// Tokonmon cruise under the surface: land the bobber near one and it comes to look. Nibbles are a tease — strike
// (SPACE / tap) only when the bobber plunges. Then reel: hold to wind in, let go when the line screams (a surge) so
// it doesn't snap, and don't leave it slack or it slips away. Tokonmon leap out over the rail (catch and
// release, logged in the TokoDex); junk and the odd treasure come up too. Landing catches in a row builds a combo.
import * as THREE from '../../../../vendor/three.module.js';
import { T } from '../../../px/game/ui.js';
import { V3, clamp, clamp01, lerp, smooth, easeOut, boing, weighted, fmt, drawTimer, drawScore, drawCombo, keyRow, vGauge, boxes, ball, cyl } from './kit.js';

const HX = 166.6, HZ = 1.95, WY = -0.8, ROUND = 75;
const ZONE = { x0: 159.5, x1: 173.5, z0: -14, z1: -1.4 };
const CATCH = [
  { id: 'kappachi', name: 'Kappachi', size: 0, w: 30, pull: 0.34, erratic: 0.35, kg: [1, 4], pts: 80 },
  { id: 'weirdfin', name: 'Weirdfin', size: 0, w: 26, pull: 0.42, erratic: 0.5, kg: [1.5, 5], pts: 95 },
  { id: 'woodbub', name: 'Woodbub', size: 1, w: 14, pull: 0.5, erratic: 0.45, kg: [3, 9], pts: 130 },
  { id: 'kanizumo', name: 'Kanizumo', size: 1, w: 14, pull: 0.58, erratic: 0.65, kg: [3, 8], pts: 150 },
  { id: 'foopod', name: 'Foopod', size: 1, w: 10, pull: 0.62, erratic: 0.85, kg: [4, 10], pts: 170 },
  { id: 'bubblion', name: 'Bubblion', size: 1, w: 6, pull: 0.5, erratic: 0.5, kg: [4, 7], pts: 230, rare: true },
  { id: 'thrashark', name: 'Thrashark', size: 2, w: 6, pull: 0.84, erratic: 0.95, kg: [18, 36], pts: 450, rare: true },
  { id: 'dreadrake', name: 'Dreadrake', size: 2, w: 1.4, pull: 0.95, erratic: 1.1, kg: [60, 90], pts: 900, rare: true, legend: true },
];
const JUNK = [
  { id: 'boot', name: 'Old Boot', w: 10, pts: 10, look: 'boot' }, { id: 'can', name: 'Tin Can', w: 8, pts: 10, look: 'can' },
  { id: 'kelp', name: 'Kelp Tangle', w: 8, pts: 5, look: 'kelp' }, { id: 'tire', name: 'Bike Tyre', w: 4, pts: 20, look: 'tire' },
  { id: 'bottle', name: 'Message in a Bottle', w: 3, pts: 60, look: 'bottle', note: true },
  { id: 'ramune', name: 'Sealed Ramune', w: 3, pts: 60, look: 'bottle2', item: 'ramune', treasure: true },
  { id: 'quartz', name: 'Quartz Gem', w: 2.5, pts: 120, look: 'gem', item: 'quartz', treasure: true },
  { id: 'sapphire', name: 'Sapphire Gem', w: 1, pts: 220, look: 'gem2', item: 'sapphire', treasure: true },
];
const NOTES = ['"Whoever finds this: the big one lives under the pier. — S."', '"Day 41 on Gull Rock. The Thrashark still owes me a lure."', '"Dear diary, I am a bottle."'];

export default class Fishing {
  static howto = 'Aim and cast near a shadow. Strike when the bobber plunges, then hold to reel — let go when the line surges!';
  static keys = [['◀ ▶', 'Aim'], ['SPACE', 'Cast · Strike · Reel']];
  static ranks = [2400, 1500, 750];
  static rewards(res, o) {
    const items = res.treasure ? Object.entries(res.treasure) : [];
    if (o.first) items.push(['takoyaki', 1]);
    return { money: Math.round(res.score * 0.4), friend: (res.score >= 1500 ? 4 : res.score >= 600 ? 3 : 2) + (o.record ? 1 : 0), items, seen: res.species || [] };
  }
  constructor(sess) { this.s = sess; this.prefer = 200; }

  // ================================================================ the set
  async setup() {
    const s = this.s, w = s.w, root = s.root;
    this.deck = s.ground(HX, HZ, 0.36);
    if (s.hero) { s.hero.place(HX, HZ, Math.PI, this.deck); s.hero.play('idle'); }
    if (s.partner) { s.partner.place(HX - 1.15, HZ + 0.35, Math.PI * 0.85, this.deck); s.partner.play('idle'); }
    this.host = w.actor('wfFisher');
    // rod (base + bendy tip), line, bobber, aim ring, ripples, the shadows of the fish
    this.rod = new THREE.Group(); root.add(this.rod);
    const rb = cyl(0.012, 0.022, 1.05, '#5a3a24', 6); rb.rotation.x = Math.PI / 2; rb.position.z = 0.52; this.rod.add(rb);
    this.reel = cyl(0.045, 0.045, 0.05, '#c8ccd4', 10); this.reel.rotation.z = Math.PI / 2; this.reel.position.set(0.04, -0.04, 0.22); this.rod.add(this.reel);
    this.tip = new THREE.Group(); this.tip.position.z = 1.04; this.rod.add(this.tip);
    const rt = cyl(0.004, 0.012, 0.75, '#e8e0c8', 5); rt.rotation.x = Math.PI / 2; rt.position.z = 0.37; this.tip.add(rt);
    this.tipEnd = new THREE.Object3D(); this.tipEnd.position.z = 0.75; this.tip.add(this.tipEnd);
    const N = 20; this.lineN = N; this.lineGeo = new THREE.BufferGeometry(); this.lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: '#f4f4f0' })); this.line.frustumCulled = false; root.add(this.line);
    this.bob = new THREE.Group(); root.add(this.bob);
    const top = ball(0.07, '#e8283a'); top.scale.y = 0.8; top.position.y = 0.04; this.bob.add(top);
    const bot = ball(0.07, '#f4f4f0'); bot.scale.y = 0.6; bot.position.y = -0.02; this.bob.add(bot);
    const stick = cyl(0.008, 0.008, 0.12, '#1c1838', 4); stick.position.y = 0.13; this.bob.add(stick);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 28), new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; root.add(this.ring);
    this.rips = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 24), new THREE.MeshBasicMaterial({ color: '#e8f6ff', transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; root.add(m); this.rips.push({ m, t: 9, dur: 1 }); }
    this.shadows = [];
    const shMat = new THREE.MeshBasicMaterial({ color: '#06202e', transparent: true, opacity: 0.42, depthWrite: false });
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group(), body = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), shMat); body.scale.set(0.42, 1, 1); body.rotation.x = -Math.PI / 2; g.add(body);
      const tail = new THREE.Mesh(new THREE.CircleGeometry(0.22, 3), shMat); tail.rotation.x = -Math.PI / 2; tail.position.z = 0.5; g.add(tail);
      g.position.y = WY + 0.02; root.add(g); this.shadows.push({ g, tail, i });
    }
    this.junkMeshes = {};
  }
  async intro(cin) {
    const s = this.s, V = (x, y, z) => new V3(x, y, z);
    cin.set({ prefer: 200 });
    await cin.cut({ target: V(HX + 2, 0.5, -6), dist: 30, yaw: 160, pitch: 24 });
    cin.move({ target: V(HX, 0.6, HZ - 2), dist: 7.5, yaw: 200, pitch: 14 }, { dur: 3.2 });
    if (this.host) { this.host.faceTo(HX, HZ); this.host.play('wave'); }
    if (s.hero) s.hero.play('cheer');
    await s.app.wait(2800);
  }
  reset() {
    this.t = ROUND; this.score = 0; this.shown = 0; this.combo = 0; this.bestCombo = 0; this.comboT = 9;
    this.catches = []; this.treasure = {}; this.species = new Set(); this.biggest = null; this.msg = null;
    this.state = 'aim'; this.st = 0; this.aim = 0; this.power = 0; this.pdir = 1; this.cast = null; this.fish = null; this.anims = [];
    this.bobPos = new V3(HX, WY, HZ - 2); this.bob.visible = false; this.tension = 0; this.surge = 0; this.slackT = 0;
    for (const sh of this.shadows) this.spawnShadow(sh, true);
    if (this.land) { this.s.drop(this.land); this.land = null; }
    this.setCam(true);
  }
  start() { this.state = 'aim'; this.st = 0; this.s.audio.music('dotonbori', { fade: 1 }); }

  // ================================================================ shadows (the fish under the surface)
  spawnShadow(sh, anywhere) {
    const r = this.s.rand, size = weighted(r, [{ w: 6, v: 0 }, { w: 3.2, v: 1 }, { w: 0.9, v: 2 }]).v;
    sh.size = size; sh.kind = weighted(r, CATCH.filter((c) => c.size === size));
    const sc = [0.55, 0.85, 1.35][size]; sh.g.scale.setScalar(sc);
    sh.g.position.x = lerp(ZONE.x0, ZONE.x1, r()); sh.g.position.z = anywhere ? lerp(ZONE.z0, ZONE.z1 - 1, r()) : ZONE.z0 - 1;
    sh.vx = (r() - 0.5) * 0.8; sh.vz = (r() - 0.5) * 0.8; sh.turn = 0; sh.seek = null; sh.fade = anywhere ? 1 : 0; sh.gone = false; sh.g.visible = true;
  }
  updateShadows(dt) {
    const r = this.s.rand;
    for (const sh of this.shadows) {
      const p = sh.g.position;
      if (sh.gone) { sh.fade -= dt * 2; p.x += sh.vx * dt * 3; p.z += sh.vz * dt * 3; if (sh.fade <= 0) this.spawnShadow(sh, false); }
      else if (sh.seek) {
        const dx = sh.seek.x - p.x, dz = sh.seek.z - p.z, d = Math.hypot(dx, dz), sp = d > 0.5 ? 1.1 : 0.2;
        sh.vx += ((dx / (d || 1)) * sp - sh.vx) * dt * 2; sh.vz += ((dz / (d || 1)) * sp - sh.vz) * dt * 2;
        p.x += sh.vx * dt; p.z += sh.vz * dt;
      } else {
        sh.turn -= dt; if (sh.turn <= 0) { sh.turn = 1 + r() * 2.5; sh.vx = (r() - 0.5) * 1.1; sh.vz = (r() - 0.5) * 1.1; }
        if (p.x < ZONE.x0) sh.vx = Math.abs(sh.vx); if (p.x > ZONE.x1) sh.vx = -Math.abs(sh.vx); if (p.z < ZONE.z0) sh.vz = Math.abs(sh.vz); if (p.z > ZONE.z1) sh.vz = -Math.abs(sh.vz);
        p.x += sh.vx * dt; p.z += sh.vz * dt;
      }
      sh.fade = Math.min(1, sh.fade + dt); sh.g.children[0].material.opacity = 0.42;
      sh.g.visible = sh.fade > 0.05;
      if (Math.hypot(sh.vx, sh.vz) > 0.05) sh.g.rotation.y = Math.atan2(-sh.vx, -sh.vz);
      sh.tail.rotation.z = Math.sin(this.s.t * 9 + sh.i) * 0.5;
    }
  }
  // ================================================================ per frame
  update(dt, inp, live) {
    const s = this.s;
    this.updateShadows(dt);
    this.updateRips(dt);
    for (const a of this.anims) { a.t += dt; a.fn(clamp01(a.t / a.dur), dt); } this.anims = this.anims.filter((a) => { if (a.t >= a.dur) { if (a.done) a.done(); return false; } return true; });
    this.shown += (this.score - this.shown) * Math.min(1, dt * 8); if (Math.abs(this.score - this.shown) < 1) this.shown = this.score;
    this.comboT += dt; if (this.msg) { this.msg.t += dt; if (this.msg.t > this.msg.dur) this.msg = null; }
    if (live) {
      if (this.state !== 'land') this.t -= dt;
      if (this.t <= 5 && Math.ceil(this.t) !== Math.ceil(this.t + dt) && this.t > 0) s.audio.sfx('ui_tap', { pitch: 1.6, vol: 0.8 });
      this.st += dt;
      this['s_' + this.state](dt, inp);
      if (this.t <= 0 && this.state !== 'land' && this.state !== 'reel') return this.finish();
      if (this.t <= -6) return this.finish();            // a fight past the horn gets a few seconds' grace
    }
    this.poseRod(dt); this.drawLine();
    this.setCam(false);
  }
  finish() {
    if (this.over) return; this.over = true;
    const big = this.biggest, nT = Object.values(this.treasure).reduce((a, b) => a + b, 0);
    this.s.end({
      score: this.score, species: [...this.species], treasure: this.treasure,
      lines: [`Catches ${this.catches.length}  ·  Tokonmon ${this.catches.filter((c) => !c.junk).length}  ·  junk ${this.catches.filter((c) => c.junk).length}`,
        big ? `Biggest: ${big.name} ${big.kg.toFixed(1)} kg` : 'Biggest: the one that got away', `Best combo ×${this.bestCombo}${nT ? `  ·  treasure ${nT}` : ''}`],
    });
  }
  // ---------------------------------------------------------------- states
  s_aim(dt, inp) {
    const s = this.s;
    this.bob.visible = false; this.ring.visible = true;
    if (inp.L) this.aim = Math.max(-1, this.aim - dt * 1.5); if (inp.R) this.aim = Math.min(1, this.aim + dt * 1.5);
    this.power += this.pdir * dt * 1.25; if (this.power > 1) { this.power = 1; this.pdir = -1; } if (this.power < 0) { this.power = 0; this.pdir = 1; }
    const tgt = this.castTarget(this.aim, this.power);
    this.ring.position.set(tgt.x, WY + 0.03, tgt.z); this.ring.scale.setScalar(0.8 + Math.sin(s.t * 8) * 0.08 + (this.power > 0.86 ? 0.25 : 0));
    this.ring.material.color.set(this.power > 0.86 ? '#ffe066' : '#ffffff');
    if (inp.tap && this.st > 0.25) {
      const perfect = this.power > 0.86;
      this.cast = { from: this.tipWorld(new V3()), to: tgt, t: 0, perfect };
      this.state = 'fly'; this.st = 0; this.ring.visible = false; this.bob.visible = true;
      s.audio.sfx('whoosh', { pitch: perfect ? 1.2 : 1 }); s.punch(perfect ? 3 : 1.5);
      if (perfect) { s.pop('PERFECT CAST!', [s.app.ui.w / 2, s.app.ui.h * 0.62], { grad: ['#ffffff', '#fff3b8', T.amber] }); s.audio.sfx('qte_perfect'); }
      if (s.hero) s.hero.play('throw', { restart: true });
    }
  }
  castTarget(aim, power) {
    const ang = aim * 0.62, d = 3.6 + power * 9.6;
    return new V3(clamp(HX + Math.sin(ang) * d, ZONE.x0, ZONE.x1), WY, clamp(HZ - 1.2 - Math.cos(ang) * d, ZONE.z0, ZONE.z1));
  }
  s_fly(dt) {
    const c = this.cast, k = clamp01(this.st / 0.65), s = this.s;
    this.bobPos.lerpVectors(c.from, c.to, k); this.bobPos.y = lerp(c.from.y, c.to.y, k) + Math.sin(k * Math.PI) * 2.6;
    if (k >= 1) {
      this.bobPos.copy(c.to); this.state = 'wait'; this.st = 0;
      s.audio.sfx('plop', { pitch: 1.1 }); this.ripple(c.to, c.perfect ? 1.6 : 1, 1.2); s.burst('splash', [c.to.x, WY + 0.1, c.to.z], { n: c.perfect ? 14 : 8 });
      // who comes to look: the nearest shadow in reach (a perfect cast reaches further), else junk or nothing
      let best = null, bd = c.perfect ? 4.2 : 3.0;
      for (const sh of this.shadows) { if (sh.gone) continue; const d = Math.hypot(sh.g.position.x - c.to.x, sh.g.position.z - c.to.z); if (d < bd) { bd = d; best = sh; } }
      const r = s.rand;
      if (best) { best.seek = this.bobPos; this.bite = { sh: best, kind: best.kind, at: 0.7 + bd * 0.45 + r() * 0.8, nibbles: Math.floor(r() * 3), nt: 0 }; }
      else this.bite = { junk: true, kind: weighted(r, JUNK), at: r() < 0.72 ? 2.4 + r() * 2.2 : 99, nibbles: 0, nt: 0 };
      this.bite.perfectCast = c.perfect;
      this.bitT = -1;
    }
  }
  s_wait(dt, inp) {
    const s = this.s, B = this.bite, p = this.bobPos;
    if (this.bitT < 0) {
      // nibbles before the real bite
      if (B.sh && B.nibbles > 0 && this.st > B.at * (0.45 + B.nt * 0.22)) { B.nibbles--; B.nt++; this.dip = 0.04; s.audio.sfx('plop', { vol: 0.35, pitch: 1.6 }); this.ripple(p, 0.5, 0.6); }
      if (this.st > B.at) {
        this.bitT = 0; this.dip = 0.22; s.audio.sfx('alert'); s.audio.sfx('hydro_splash', { vol: 0.8 }); s.shake(0.06); this.ripple(p, 1.3, 0.9);
        s.burst('splash', [p.x, WY + 0.1, p.z], { n: 12 }); s.pop('!', new V3(p.x, WY + 0.9, p.z), { scale: 3, color: T.red, dur: 0.6, rise: 6 });
        if (s.partner) s.partner.play('cry', { restart: true });
      }
      if (inp.tap && this.st > 0.3) return this.miss(B.sh ? 'Too early!' : 'Nothing there…', B.sh);
      if (this.st > 7 && B.at > 50) { this.say('Nothing biting here — try near a shadow', 2.2); this.state = 'aim'; this.st = 0; this.bob.visible = false; s.audio.sfx('whoosh', { vol: 0.5 }); }
    } else {
      this.bitT += dt;
      if (inp.tap) {
        const perfect = this.bitT < 0.26;
        this.hook(perfect);
      } else if (this.bitT > 0.62) this.miss('It stole the bait!', B.sh);
    }
  }
  hook(perfect) {
    const s = this.s, B = this.bite, k = B.kind, r = s.rand;
    s.audio.sfx(perfect ? 'qte_perfect' : 'qte_good'); s.shake(perfect ? 0.12 : 0.07); s.punch(perfect ? 5 : 3); s.hitstop(perfect ? 110 : 60);
    s.pop(perfect ? 'PERFECT HOOK!' : 'HOOKED!', [s.app.ui.w / 2, s.app.ui.h * 0.36], { scale: 2, grad: perfect ? ['#ffffff', '#fff3b8', T.amber] : ['#ffffff', '#c8f6ff', T.cyan] });
    if (s.hero) s.hero.play('jump', { restart: true });
    const dist = Math.hypot(this.bobPos.x - HX, this.bobPos.z - HZ);
    const kg = B.junk ? 0.5 + r() * 2 : lerp(k.kg[0], k.kg[1], r() * r() + r() * 0.3);
    this.fish = { k, junk: !!B.junk, sh: B.sh, perfect, dist, d0: dist, pull: B.junk ? 0.16 : k.pull, erratic: B.junk ? 0 : k.erratic, stam: 1, kg, side: 0, sv: 0, nextSurge: 1.2 + r() * 1.6 };
    this.tension = perfect ? 0.32 : 0.45; this.surge = 0; this.slackT = 0; this.state = 'reel'; this.st = 0;
    if (B.sh) { B.sh.g.visible = false; B.sh.seek = null; }
    this.pending = (this.pending || 0) + (B.junk ? 0 : 1);
    this.ready = B.junk ? Promise.resolve(null) : s.mon(k.id, [HX, HZ - 30, 0, -5]).then((a) => { a.g.visible = false; return a; }).catch(() => null).finally(() => { this.pending--; });
    this.say(B.junk ? 'Something heavy…' : 'Hold to reel — let go when it surges!', 2);
  }
  miss(text, sh) {
    const s = this.s;
    this.combo = 0; s.audio.sfx('qte_miss'); this.say(text, 1.6);
    s.pop(text, [s.app.ui.w / 2, s.app.ui.h * 0.38], { scale: 1.6, color: '#ffd2dc', dur: 1.1 });
    if (sh) { sh.seek = null; sh.gone = true; sh.vx = (sh.g.position.x - HX) * 0.3; sh.vz = -1; }
    if (s.hero) s.hero.play('facepalm', { restart: true });
    this.state = 'aim'; this.st = 0; this.bob.visible = false; this.tension = 0; this.fish = null;
  }
  s_reel(dt, inp) {
    const s = this.s, F = this.fish, r = s.rand;
    // surges: telegraphed, then the fish runs
    F.nextSurge -= dt;
    if (!this.surge && F.erratic > 0 && F.nextSurge <= 0) { this.surge = 0.001; this.warn = 0.28; F.sv = (r() < 0.5 ? -1 : 1) * (1 + F.erratic); s.audio.sfx('alert', { pitch: 1.3 }); this.ripple(this.bobPos, 1, 0.7); s.burst('splash', [this.bobPos.x, WY + 0.1, this.bobPos.z], { n: 10 }); }
    if (this.surge) {
      this.surge += dt;
      if (this.surge > this.warn + 0.55 + F.erratic * 0.45) { this.surge = 0; F.nextSurge = (1.0 + r() * 1.8) / Math.max(0.4, F.erratic) * (0.6 + 0.4 * F.stam); F.sv *= 0.3; }
    }
    const surging = this.surge > this.warn, power = F.pull * (0.55 + 0.45 * F.stam);
    if (inp.hold) {
      this.tension += (0.36 + power * 0.5 + (surging ? 1.7 * power : 0)) * dt;
      const zone = this.tension > 0.28 && this.tension < 0.8, sp = (zone ? 2.7 : 1.6) * (1 - F.pull * 0.3);
      if (!surging || !zone) F.dist -= sp * dt; else F.dist -= sp * 0.25 * dt;
      if (zone) F.stam = Math.max(0, F.stam - dt * (0.12 + (surging ? 0.25 : 0)));
      if (this.reel) this.reel.rotation.x += dt * 22;
      this.reelSnd = (this.reelSnd || 0) - dt; if (this.reelSnd <= 0) { this.reelSnd = 0.11; s.audio.sfx('ui_tap', { vol: 0.25, pitch: 2.2 + this.tension }); }
    } else {
      this.tension -= (surging ? 0.35 : 0.8) * dt;
      if (surging) F.dist += power * 1.8 * dt;
    }
    this.tension = Math.max(0, this.tension);
    F.dist = Math.min(F.dist, F.d0 + 3);
    if (this.tension >= 1) { s.audio.sfx('blade', { pitch: 1.4 }); s.shake(0.15); s.flash('#ffffff', 0.2, 0.5); if (s.partner) s.partner.play('cry', { restart: true }); return this.lost('SNAP! The line broke'); }
    this.slackT = this.tension < 0.06 ? this.slackT + dt : 0;
    if (this.slackT > 1.7) return this.lost('Too slack — it got away');
    if (surging && this.tension > 0.75) s.shake(0.025, 12);
    // the bobber is dragged in (and side to side by the runs)
    F.side += F.sv * dt; F.side *= Math.exp(-dt * 0.4); F.side = clamp(F.side, -4, 4);
    const ang = Math.atan2(this.bobPos.x - HX, -(this.bobPos.z - HZ)), dd = Math.max(1, F.dist);
    const tx = HX + Math.sin(ang) * dd + F.sv * dt * 0.6, tz = HZ - Math.cos(ang) * dd;
    this.bobPos.set(clamp(tx + F.side * dt, ZONE.x0 - 1, ZONE.x1 + 1), WY, clamp(tz, ZONE.z0 - 3, HZ - 1));
    this.wakeT = (this.wakeT || 0) - dt; if (this.wakeT <= 0) { this.wakeT = surging ? 0.12 : 0.35; this.ripple(this.bobPos, surging ? 0.6 : 0.4, 0.5); if (surging) s.burst('drop', [this.bobPos.x, WY + 0.1, this.bobPos.z], { n: 3 }); }
    if (F.dist <= 1.4) this.landIt();
  }
  lost(text) {
    const F = this.fish; this.combo = 0; this.s.audio.sfx('qte_miss');
    this.s.pop(text, [this.s.app.ui.w / 2, this.s.app.ui.h * 0.38], { scale: 1.5, color: '#ffd2dc', dur: 1.3 });
    if (F && F.sh) { F.sh.g.visible = true; F.sh.gone = true; F.sh.g.position.set(this.bobPos.x, WY + 0.02, this.bobPos.z); F.sh.vx = 0; F.sh.vz = -1.5; }
    this.ready && this.ready.then((a) => a && this.s.drop(a)); this.ready = null;
    this.state = 'aim'; this.st = 0; this.bob.visible = false; this.tension = 0; this.fish = null;
    if (this.s.hero) this.s.hero.play('sad', { restart: true });
  }
  // ---------------------------------------------------------------- the catch: out of the water, over the rail, onto the deck
  landIt() {
    const s = this.s, F = this.fish, k = F.k, from = this.bobPos.clone(), to = new V3(HX + 0.95, this.deck, HZ - 0.15);
    this.state = 'land'; this.st = 0; this.bob.visible = false; this.tension = 0;
    this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo); this.comboT = 0;
    const mult = 1 + Math.min(1, (this.combo - 1) * 0.2), wf = F.junk ? 1 : Math.sqrt(F.kg / ((k.kg[0] + k.kg[1]) / 2));
    const pts = Math.round(k.pts * wf * (F.perfect ? 1.25 : 1) * mult);
    this.score += pts;
    const rec = { name: k.name, kg: F.kg, junk: F.junk, pts, id: k.id };
    this.catches.push(rec);
    if (!F.junk) { this.species.add(k.id); if (!this.biggest || F.kg > this.biggest.kg) this.biggest = rec; }
    if (k.item) this.treasure[k.item] = (this.treasure[k.item] || 0) + 1;
    if (F.sh) this.spawnShadow(F.sh, false);
    s.audio.sfx('hydro_splash'); s.burst('splash', [from.x, WY + 0.2, from.z], { n: 22 }); this.ripple(from, 2, 1.2);
    s.slowmo(0.35, 0.7); s.punch(6); s.shake(0.08);
    this.catchCard = { rec, t: 0, k, legend: k.legend, treasure: k.treasure };
    const go = (obj) => {
      const done = () => {
        s.audio.sfx(F.junk ? (k.treasure ? 'sparkle' : 'thud') : 'capture_success'); s.burst(F.junk && !k.treasure ? 'dust' : 'sparkle', [to.x, to.y + 0.4, to.z], { n: 14 });
        if (!F.junk) { s.burst('heart', [to.x, to.y + 0.9, to.z], { n: 5 }); obj.play('win', { restart: true }); }
        if (k.treasure) { s.audio.stinger('reward'); s.confettiBurst(30, s.app.ui.w / 2, s.app.ui.h * 0.3); }
        s.pop('+' + fmt(pts), new V3(to.x, to.y + 1.3, to.z), { scale: 2.2, dur: 1.2, rise: 24 });
        if (this.combo >= 2) s.pop('×' + this.combo + ' COMBO', new V3(to.x, to.y + 1.75, to.z), { scale: 1.3, grad: ['#ffffff', '#c8f6ff', T.cyan], dur: 1.1, rise: 20 });
        if (s.partner) s.partner.play('win', { restart: true });
        if (s.hero) s.hero.play(k.legend ? 'flex' : 'cheer', { restart: true });
        if (k.legend) { s.audio.sfx('crowd_cheer'); s.shake(0.2); s.flash('#fff4d0', 0.4, 0.6); }
        this.anims.push({ t: 0, dur: 1.5, fn: () => {}, done: () => this.release(obj, F.junk) });
      };
      obj.g ? (obj.g.visible = true) : (obj.visible = true);
      const g = obj.g || obj;
      g.position.copy(from); if (obj.faceTo) { obj.yaw = obj.targetYaw = Math.atan2(to.x - from.x, to.z - from.z); }
      this.anims.push({ t: 0, dur: 0.95, fn: (u) => { g.position.lerpVectors(from, to, u); g.position.y = lerp(from.y, to.y, u) + Math.sin(u * Math.PI) * 2.4; g.rotation.x = F.junk ? u * 6 : 0; if (obj.faceTo && u > 0.6) obj.faceTo(HX, HZ + 2); }, done });
      if (obj.play) obj.play('special', { restart: true });
    };
    if (F.junk) { const m = this.junkMesh(k.look); this.s.root.add(m); go(m); this.land = null; this.landMesh = m; }
    else this.ready.then((a) => { if (!a) { this.state = 'aim'; return; } this.land = a; go(a); });
    this.ready = null;
  }
  release(obj, junk) {
    const s = this.s, g = obj.g || obj, from = g.position.clone(), to = new V3(from.x - 0.4, WY, HZ - 3.4);
    if (junk) {
      this.anims.push({ t: 0, dur: 0.35, fn: (u) => g.scale.setScalar(1 - u), done: () => { g.parent && g.parent.remove(g); this.next(); } });
      s.audio.sfx('coin', { pitch: 1.2 }); return;
    }
    if (obj.play) obj.play('special', { restart: true });
    this.anims.push({ t: 0, dur: 0.8, fn: (u) => { g.position.lerpVectors(from, to, u); g.position.y = lerp(from.y, to.y, u) + Math.sin(u * Math.PI) * 1.6; },
      done: () => { s.audio.sfx('plop'); this.ripple(to, 1.2, 0.9); s.burst('splash', [to.x, WY + 0.2, to.z], { n: 10 }); s.drop(obj); this.land = null; this.next(); } });
    this.next(true);
  }
  next(early) { if (this.state === 'land') { this.state = 'aim'; this.st = early ? -0.3 : 0; this.catchCard = null; } }
  junkMesh(look) {
    const L = {
      boot: [[-0.12, 0, -0.18, 0.12, 0.12, 0.2, '#5a3a24'], [-0.12, 0.12, -0.18, 0.12, 0.38, 0.0, '#6a4a2e'], [-0.13, 0, 0.12, 0.13, 0.05, 0.22, '#2a2a30']],
      can: [[-0.08, 0, -0.08, 0.08, 0.22, 0.08, '#c8ccd4'], [-0.085, 0.06, -0.085, 0.085, 0.16, 0.085, '#e8283a']],
      kelp: [[-0.2, 0, -0.05, 0.2, 0.06, 0.05, '#3a7a3a'], [-0.05, 0, -0.2, 0.05, 0.08, 0.2, '#4a8a3a'], [-0.14, 0.04, -0.14, 0.0, 0.1, 0.0, '#2a6a2a']],
      tire: [[-0.3, 0, -0.06, -0.2, 0.5, 0.06, '#1e1e22'], [0.2, 0, -0.06, 0.3, 0.5, 0.06, '#1e1e22'], [-0.3, 0.4, -0.06, 0.3, 0.5, 0.06, '#1e1e22'], [-0.3, 0, -0.06, 0.3, 0.1, 0.06, '#1e1e22']],
      bottle: [[-0.06, 0, -0.06, 0.06, 0.24, 0.06, '#6ab88a'], [-0.025, 0.24, -0.025, 0.025, 0.32, 0.025, '#6ab88a'], [-0.03, 0.06, -0.03, 0.03, 0.18, 0.03, '#f4ecd8']],
      bottle2: [[-0.06, 0, -0.06, 0.06, 0.24, 0.06, '#5ac8e8'], [-0.03, 0.24, -0.03, 0.03, 0.32, 0.03, '#5ac8e8'], [-0.065, 0.08, -0.065, 0.065, 0.14, 0.065, '#ffffff']],
      gem: [[-0.1, 0, -0.1, 0.1, 0.16, 0.1, '#e8e4f4'], [-0.06, 0.16, -0.06, 0.06, 0.24, 0.06, '#ffffff']],
      gem2: [[-0.1, 0, -0.1, 0.1, 0.16, 0.1, '#2a6ae8'], [-0.06, 0.16, -0.06, 0.06, 0.24, 0.06, '#8ab8ff']],
    }[look] || [[-0.1, 0, -0.1, 0.1, 0.2, 0.1, '#8a8478']];
    const m = boxes(L); if (look.startsWith('gem')) m.material = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#303050' });
    return m;
  }
  s_land() { /* the catch animation runs; the derby clock waits */ }
  // ================================================================ visuals
  tipWorld(out) { this.tipEnd.updateWorldMatrix(true, false); return out.setFromMatrixPosition(this.tipEnd.matrixWorld); }
  poseRod(dt) {
    const s = this.s, h = s.hero; if (!h) return;
    const hp = h.g.position;
    let hand = null; try { const b = h.m.h && h.m.h.b && h.m.h.b.handR; if (b) { b.updateWorldMatrix(true, false); hand = new V3().setFromMatrixPosition(b.matrixWorld); } } catch (e) { hand = null; }
    if (!hand || hand.distanceTo(hp) > 2) hand = new V3(hp.x + 0.22, hp.y + 0.95, hp.z - 0.12);
    this.rod.position.lerp(hand, this.rodInit ? kk(dt, 25) : 1); this.rodInit = true;
    const want = this.state === 'aim' ? 0.55 + this.power * 0.25 : this.state === 'fly' ? 0.2 : this.state === 'reel' ? 0.75 : 0.45;
    this.rodP = lerp(this.rodP ?? want, want, kk(dt, 8));
    const aimYaw = this.state === 'aim' ? this.aim * 0.62 : Math.atan2(this.bobPos.x - HX, HZ - this.bobPos.z);
    this.rodY = lerp(this.rodY ?? aimYaw, aimYaw, kk(dt, 6));
    this.rod.rotation.set(0, 0, 0); this.rod.rotateY(Math.PI - this.rodY); this.rod.rotateX(-this.rodP);
    const bend = this.state === 'reel' ? this.tension * 0.9 + (this.surge > (this.warn || 0) ? 0.25 : 0) : this.state === 'wait' && this.bitT >= 0 ? 0.4 : 0.05;
    this.tip.rotation.x = lerp(this.tip.rotation.x, bend, kk(dt, 12));
    // the bobber floats and dips
    this.dip = Math.max(0, (this.dip || 0) - dt * 0.6);
    if (this.state === 'wait' || this.state === 'reel') { const bobY = WY + 0.02 + Math.sin(s.t * 3) * 0.02 - (this.state === 'wait' && this.bitT >= 0 ? 0.18 : this.dip) - (this.state === 'reel' ? 0.06 + this.tension * 0.08 : 0); this.bobPos.y = bobY; }
    this.bob.position.copy(this.bobPos);
  }
  drawLine() {
    const N = this.lineN, a = this.tipWorld(new V3()), b = this.bob.visible ? this.bobPos : a, arr = this.lineGeo.attributes.position.array;
    const d = a.distanceTo(b), sag = this.state === 'reel' ? Math.max(0, 0.45 - this.tension) * d * 0.12 : this.state === 'fly' ? 0 : d * 0.06;
    for (let i = 0; i < N; i++) { const t = i / (N - 1); arr[i * 3] = lerp(a.x, b.x, t); arr[i * 3 + 1] = lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * sag; arr[i * 3 + 2] = lerp(a.z, b.z, t); }
    this.lineGeo.attributes.position.needsUpdate = true; this.line.visible = this.bob.visible;
  }
  ripple(p, size = 1, dur = 0.9) { const R = this.rips.find((r) => r.t >= r.dur) || this.rips[0]; R.t = 0; R.dur = dur; R.size = size; R.m.position.set(p.x, WY + 0.025, p.z); R.m.visible = true; }
  updateRips(dt) { for (const R of this.rips) { if (R.t >= R.dur) { R.m.visible = false; continue; } R.t += dt; const k = R.t / R.dur; R.m.scale.setScalar(0.15 + easeOut(k) * R.size); R.m.material.opacity = (1 - k) * 0.7; } }
  say(text, dur = 2) { this.msg = { text, t: 0, dur }; }
  setCam(snap) {
    const s = this.s, st = this.state;
    if (st === 'land' && this.catchCard) { const p = (this.land && this.land.g.position) || new V3(HX + 0.95, this.deck, HZ); s.look(new V3(p.x, p.y + 0.7, p.z), 4.6, 200, 12, 36, { rate: 4 }); return; }
    if (st === 'reel' && this.fish) { const mx = (HX + this.bobPos.x) / 2, mz = (HZ + this.bobPos.z) / 2; s.look(new V3(mx, 0.2, mz - 1), 8 + this.fish.dist * 0.25, -8 + (this.bobPos.x - HX) * 1.5, 22, 42, { rate: 3 }); return; }
    const ax = HX + this.aim * 1.2; s.look(new V3(ax, 0.1, HZ - 5.2), 9.5, -10 + this.aim * 8, 24, 42, { rate: 3, snap });
  }
  // ================================================================ HUD
  draw(ui, dt) {
    const s = this.s, W = ui.w, H = ui.h, narrow = W < 360;
    drawScore(ui, 6, 6, this.shown, { best: s.mg.best('fishing') });
    drawTimer(ui, W / 2, 6, Math.max(0, this.t), ROUND, s.t);
    // the catch log (top right): little badges, gold for treasure
    const n = this.catches.length; ui.panel(W - 64, 6, 58, 18, { r: 9, thin: true }); ui.icon('drop', W - 58, 11.5, T.cyan); ui.text('×' + n, W - 47, 11, '#ffffff', { bold: true });
    drawCombo(ui, narrow ? 8 : 10, 42, this.combo, this.comboT);
    const st = this.state, by = H - 30;
    if (st === 'aim' && this.s.live) {
      // the power meter: a swinging needle over a bar, the gold perfect zone at the end
      const bw = Math.min(200, W - 40), bx = (W - bw) / 2;
      ui.panel(bx - 6, by - 18, bw + 12, 26, { r: 6 });
      ui.bar(bx, by - 11, bw, 7, this.power, { color: this.power > 0.86 ? T.amber : T.cyan, shine: false, trail: false, id: 'mg-fish-power' });
      ui.rect(bx + bw * 0.86, by - 12, 1, 9, '#ffffff'); ui.text('POWER', bx, by - 16, '#ffffff', { mini: true, bold: true });
      keyRow(ui, W / 2, by + 10, narrow ? [['SPACE', 'Cast']] : [['◀ ▶', 'Aim'], ['SPACE', 'Cast']]);
    } else if (st === 'wait') {
      const bite = this.bitT >= 0, k = bite ? 1 + Math.sin(s.t * 30) * 0.1 : 1;
      const g = ui.g; g.save(); g.translate(W / 2, by); g.scale(k, k); g.translate(-W / 2, -by);
      ui.text(bite ? 'STRIKE!' : 'Wait for the bite…', W / 2, by - 8, bite ? T.amber : '#ffffff', { align: 'center', bold: true, scale: bite ? 2 : 1, outline: T.ink });
      g.restore(); ui._fs = null; ui._font = null;
    } else if (st === 'reel' && this.fish) {
      const gx = W - 26, gy = Math.max(48, H * 0.26), gh = Math.min(120, H * 0.45);
      vGauge(ui, gx, gy, 10, gh, this.tension, [[0, 0.28, '#3a6ac8'], [0.28, 0.8, '#3fbf5a'], [0.8, 1, '#e8283a']], { needle: this.surge > (this.warn || 0) ? T.red : '#ffffff' });
      ui.text('LINE', gx + 5, gy + gh + 6, '#ffffff', { mini: true, bold: true, align: 'center', outline: T.ink });
      if (this.surge && this.surge <= (this.warn || 0) + 0.6) { const blink = ((s.t * 12) | 0) % 2; if (blink) ui.text('!!', gx - 10, gy - 2, T.red, { scale: 2, bold: true, outline: T.ink, align: 'right' }); }
      const F = this.fish, bw = Math.min(180, W - 80), bx = (W - bw) / 2;
      ui.panel(bx - 6, by - 14, bw + 12, 20, { r: 6 });
      ui.bar(bx, by - 8, bw, 6, 1 - clamp01((F.dist - 1.4) / Math.max(1, F.d0 - 1.4)), { color: T.green, shine: true, id: 'mg-fish-dist' });
      ui.text(`${Math.max(0, F.dist - 1.4).toFixed(1)} m`, bx + bw, by - 20, '#ffffff', { mini: true, bold: true, align: 'right', outline: T.ink });
      ui.text(this.surge > (this.warn || 0) ? 'LET GO!' : 'HOLD TO REEL', bx, by - 20, this.surge > (this.warn || 0) ? T.red : '#ffffff', { mini: true, bold: true, outline: T.ink });
    }
    if (this.msg && st !== 'reel') { const a = Math.min(1, (this.msg.dur - this.msg.t) * 3); ui.g.globalAlpha = a; ui.text(this.msg.text, W / 2, H * 0.27, '#ffffff', { align: 'center', bold: true, outline: T.ink }); ui.g.globalAlpha = 1; }
    // the catch card
    const C = this.catchCard;
    if (C) {
      C.t += dt; const k = boing(C.t * 2.2), w = 170, x = W / 2 - w / 2, y = H * 0.14, g = ui.g;
      g.save(); g.translate(W / 2, y + 18); g.scale(k, k); g.translate(-W / 2, -(y + 18));
      ui.panel(x, y, w, 36, { paper: true, edge: C.legend ? T.amber : C.treasure ? T.cyan : undefined });
      ui.text(C.rec.junk ? (C.treasure ? 'TREASURE!' : 'JUNK…') : C.legend ? 'LEGENDARY!' : C.k.rare ? 'RARE CATCH!' : 'CAUGHT!', W / 2, y + 5, C.rec.junk && !C.treasure ? (T.paperDim || '#7a72a0') : '#d8365a', { align: 'center', mini: true, bold: true });
      ui.text(C.rec.name.toUpperCase(), W / 2, y + 13, T.paperText, { align: 'center', bold: true, scale: 1.3 });
      ui.text(C.rec.junk ? `+${C.rec.pts}` : `${C.rec.kg.toFixed(1)} kg  ·  +${fmt(C.rec.pts)}`, W / 2, y + 26, T.paperText, { align: 'center', mini: true, bold: true });
      g.restore(); ui._fs = null; ui._font = null;
      if (C.k.note && C.t > 0.6 && C.t < 1.5) ui.text(NOTES[this.catches.length % NOTES.length], W / 2, y + 42, '#ffffff', { align: 'center', mini: true, bold: true, outline: T.ink });
    }
  }
  // ================================================================ the dev autoplayer
  bot(inp, dt) {
    const st = this.state;
    if (st === 'aim') {
      let best = null, bd = 1e9; for (const sh of this.shadows) { if (sh.gone) continue; const d = Math.hypot(sh.g.position.x - HX, sh.g.position.z - HZ); if (d < bd && d > 4 && d < 13) { bd = d; best = sh; } }
      const want = best ? clamp(Math.atan2(best.g.position.x - HX, HZ - 1.2 - best.g.position.z) / 0.62, -1, 1) : 0, wp = best ? clamp01((bd - 3.6) / 9.6) : 0.5;
      if (this.aim < want - 0.05) inp.R = true; else if (this.aim > want + 0.05) inp.L = true;
      else if (Math.abs(this.power - wp) < 0.05 && this.st > 0.4) inp.tap = true;
    } else if (st === 'wait') { if (this.bitT >= 0.12) inp.tap = true; }
    else if (st === 'reel') { const surging = this.surge > (this.warn || 0); inp.hold = !surging && this.tension < 0.62; }
  }
  waiting() { return this.state === 'land' && this.pending > 0; }
  debug() { return { state: this.state, t: +this.t.toFixed(1), score: this.score, catches: this.catches.map((c) => c.name), combo: this.combo, tension: +this.tension.toFixed(2) }; }
  dispose() { if (this.host) this.host.play('think'); }
}
const kk = (dt, r) => 1 - Math.exp(-dt * r);
void smooth;
