// Feel: the small things that make the walkable city feel lived in, and touching it feel good.
//  · emote bubbles: a little pixel speech balloon with an icon over anyone's head (! ? ♥ ♪ … z) — feel.emote(actor, kind)
//  · the street's people: they glance at you when you walk up (and sometimes wave), fidget (check a phone, stretch,
//    look around, scratch their head, yawn), and neighbours standing together strike up two-line conversations
//  · footfalls: every human's steps land on their gait's contacts (people/human.js onStep): yours by the surface you
//    walk on, everyone else's quieter with distance and panned
//  · you: when you stand still you look around, stretch, check your phone; you look at whatever you could interact with
//  · your partner: sniffs around when you stop, greets the Tokonmon it meets, curls up for a nap if you stand still too
//    long (and jumps up when you move), cheers after a win
//  · interacting: talking to someone frames it as a short over-the-shoulder conversation with a light letterbox
//    (cinema.js); anything else nudges the follow camera toward the thing; items you get pop over your head
//  · stepping through a door: a quick dip of the screen hides the walls being cut away, and the door shuts behind you
// Hooked from app.js (update / drawUI), city/control.js (use(), the camera nudge) and battle.js (afterBattle()).
import * as THREE from '../../../vendor/three.module.js';
import { T } from '../../px/game/ui.js';
import { ITEMS } from '../../data/items.js';
import { VOICE } from './life.js';
import { VFX } from './vfx.js';

const V3 = THREE.Vector3, _v = new V3(), _w = new V3();
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
const dist2 = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
// emote kinds → [icon, colour] (null icon: drawn by hand)
const EMOTE = {
  '!': ['exclaim', '#e8283a'], '?': ['question', '#3a7ae8'], heart: ['heart', '#ff4a7a'], note: ['music', '#8a4ae8'], happy: ['smile', '#e89a20'],
  star: ['star', '#e8b020'], sweat: ['drop', '#4aa8e0'], idea: ['sparkle', '#e8b020'], zzz: [null, '#6a7ab8'], '...': [null, '#4a4458'], anger: [null, '#e8283a'], food: ['onigiri', '#6a8a3a'],
};
// two neighbours chatting (original lines)
const CHATS = [
  ['Did you see the fog this morning?', 'Like soup! My Pidgun flew into a lamppost.'],
  ['Entering the League this year?', 'Only if my Lemmo stops napping first.'],
  ['The cable car was late again.', 'It\'s never late. It runs on cable-car time.'],
  ['Tried the new boba place yet?', 'Twice! Mango, extra pearls, no regrets.'],
  ['My Tokon learned a new move!', 'Show me! …Was that it? It sneezed.'],
  ['Lanterns go up in Chinatown tonight.', 'I\'ll bring snacks. You bring the Kanizumo.'],
  ['Rent went up again.', 'Everything went up. Except my Tokon\'s level.'],
  ['Nice day for a battle.', 'Nice day for a nap, you mean.'],
  ['Is that kid the new rookie?', 'The one with the loud partner? Yep.'],
  ['I left my umbrella on the tram.', 'In this city? It\'s gone, friend. Gone.'],
  ['Who keeps feeding the Pidgun fries?', '…No comment.'],
  ['My grandma beat me at xiangqi again.', 'Uncle Ho trained her. Nobody beats Uncle Ho.'],
];
const NPC_FIDGETS = ['phone', 'lookAround', 'scratch', 'yawn', 'sigh', 'shrug', 'stretch', 'think', 'phone'];
const ME_FIDGETS = [['lookAround', 3.4], ['stretch', 2.4], ['yawn', 2.4], ['scratch', 2.6], ['phone', 6]];
const CHAT_VOICES = ['friend', 'kid', 'elder', 'rival', 'punk'];

export class Feel {
  constructor(app) {
    this.app = app; this.t = 0; this.emotes = []; this.pops = [];
    this.npcS = new Map(); this.chat = null; this.chatT = 6; this.pairs = null; this.pairsT = 0;
    this.pIdle = 0; this.nextFid = 8; this.fid = null; this.pLook = new V3(); this.P = { state: 'follow', t: 0, met: new Map(), next: 9 };
    this.watch = null; this.talking = new Set(); this.focusK = 0; this.lastInside = -1; this.stepGate = 0; this.sc = null;
  }
  get w() { return this.app.world; }
  // ================================================================ per frame
  update(dt) {
    this.t += dt;
    if (this.app.stage && this.app.world && this.app.world.ready) VFX.of(this.app).update(dt);   // the pixel sprite effects (battles and the street)
    for (const e of this.emotes) e.t += dt; this.emotes = this.emotes.filter((e) => e.t < e.dur && e.a && e.a.g);
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter((p) => p.t < p.dur);
    const app = this.app, w = this.w;
    if (!w || !w.ready || !w.city || !w.player) return;
    if (w.sc !== this.sc) this.attach();
    this.hookSteps();
    if (app.battle && app.battle.active) return;
    if (this.watch) this.checkPickups(false);
    this.doors();
    const cin = app.cinema, scene = !!(app.story.busy || (cin && cin.active) || !w.free || app.ui.dialog);
    this.me(dt, scene);
    this.partner(dt, scene);
    this.npcs(dt, scene);
    this.chats(dt, scene);
  }
  /** a new city: hook its quest scenes, forget the old people */
  attach() {
    const w = this.w; this.sc = w.sc; this.npcS.clear(); this.pairs = null; this.chat = null; this.P.met.clear(); this.lastInside = w.city ? w.city.inside : -1;
    if (this.app.quests && this.app.quests.attach && w.sc && w.sc.city) this.app.quests.attach(w.sc.city);
  }
  // ---------------------------------------------------------------- footfalls
  hookSteps() {
    const w = this.w;
    for (const a of w.actors.values()) {
      const m = a.m; if (a.kind !== 'person' || !m || m.onStep) continue;
      m.onStep = (spd) => this.step(a, spd);
    }
  }
  step(a, spd) {
    const app = this.app, w = this.w, au = app.audio; if (!au || !au.sfx || !w.city || !a.g.visible) return;
    const p = a.g.position;
    if (a === w.player) {
      au.sfx(w.city.stepKind(p), { vol: spd > 3.2 ? 1 : 0.72, pitch: 0.93 + Math.random() * 0.14 });
      if (spd > 3.6) VFX.of(app).burst('dust', _v.set(p.x, p.y + 0.08, p.z), { scale: 0.45, speed: 0.4 });
      return;
    }
    const me = w.player; if (!me) return;
    const d = dist2(p, me.g.position); if (d > 11 || this.t < this.stepGate) return;
    this.stepGate = this.t + 0.07;
    const cam = app.stage.cam; _w.setFromMatrixColumn(cam.matrixWorld, 0); _v.subVectors(p, cam.position);
    const pan = Math.max(-0.8, Math.min(0.8, _v.dot(_w) / Math.max(2, _v.length())));
    au.sfx(this.surface(p), { vol: 0.42 * (1 - d / 11) ** 1.4, pitch: 0.9 + Math.random() * 0.18, pan });
  }
  surface(p) {
    const w = this.w, nav = w.nav, c = w.city; if (!nav || !c) return 'step_concrete';
    const L = nav.levelAt ? nav.levelAt(p.x, p.z, p.y) : 0, b = nav.buildingAt ? nav.buildingAt(p.x, p.z, L) : -1;
    if (b >= 0 && c.c.buildings[b]) return (c.c.buildings[b].o && c.c.buildings[b].o.step) || 'step_wood';
    const z = nav.zoneAt && nav.zoneAt(p.x, p.z); return (z && z.step) || 'step_concrete';
  }
  // ---------------------------------------------------------------- doors: a quick dip as you cross a threshold
  doors() {
    const w = this.w, app = this.app, inside = w.city.inside, was = this.lastInside; this.lastInside = inside;
    if ((inside >= 0) === (was >= 0) || !w.free || app.story.busy || app._travelling) return;
    app.fadeA = Math.max(app.fadeA, 0.45);
    if (inside >= 0) setTimeout(() => { const au = app.audio; if (au && au.sfx) au.sfx('door_close', { vol: 0.32, pitch: 1.08 }); }, 380);
    if (app.moments && app.moments.cover) app.moments.cover();
  }
  // ---------------------------------------------------------------- you
  me(dt, scene) {
    const w = this.w, me = w.player, spd = me.anim ? me.anim.speed || 0 : 0, near = w.city.near;
    // look at whatever you could interact with (your own head turn: the follow camera shows it)
    if (!scene && near && spd < 3) { this.pLook.set(near.x, near.y + 0.1, near.z); me.look = this.pLook; }
    else if (me.look === this.pLook) me.look = null;
    // idle fidgets
    if (spd > 0.15 || scene) {
      if (this.fid && me.anim.cur === this.fid.clip) me.play('idle', { fade: 0.2 });   // put the phone away: something's happening
      if (spd > 0.15 && this.pIdle > 0) this.nextFid = 8 + Math.random() * 4;
      this.fid = null; this.pIdle = spd > 0.15 ? 0 : this.pIdle; return;
    }
    this.pIdle += dt;
    if (this.fid && this.t > this.fid.until) { if (me.anim.cur === this.fid.clip) me.play('idle', { fade: 0.3 }); this.fid = null; }
    if (!this.fid && this.pIdle > this.nextFid && !near) {
      const [clip, dur] = pick(ME_FIDGETS); me.play(clip, { restart: true }); this.fid = { clip, until: this.t + dur };
      this.nextFid = this.pIdle + rnd(9, 15);
      if (clip === 'yawn' && Math.random() < 0.6) this.emote(me, 'zzz', 1.6);
    }
  }
  // ---------------------------------------------------------------- your partner
  partner(dt, scene) {
    const w = this.w, b = w.partner, me = w.player, P = this.P; if (!b || b.kind !== 'mon' || !b.g.visible) return;
    const clips = b.anim.clips || {}, bp = b.g.position, mp = me.g.position, d = dist2(bp, mp);
    if (scene) { if (P.state !== 'follow' && P.state !== 'cheer') this.partnerFree(); return; }
    if (P.state === 'cheer') { if (this.t > P.until) this.partnerFree(); return; }
    if (P.state === 'sleep') {
      if (this.pIdle < 0.2) { this.partnerFree(); this.emote(b, '!', 1.1); w.fx.emit('star', b.headPos(), { n: 3 }); this.cry(b, 0.6); }
      else if ((P.zT = (P.zT ?? 0) - dt) <= 0) { P.zT = 2.6; w.fx.emit('z', b.headPos(), { n: 1 }); }
      return;
    }
    if ((P.state === 'sniff' || P.state === 'sniffed') && this.pIdle < 0.2) { this.partnerFree(); return; }      // you set off: back to heel
    if (P.state === 'react' || P.state === 'sniffed') { if (this.t > P.until) this.partnerFree(); return; }
    if (P.state === 'sniff') {
      if (!b.path) { P.state = 'sniffed'; P.until = this.t + 2.4; b.play(clips.cry ? 'cry' : 'idle', { restart: true }); this.emote(b, pick(['?', 'idea', 'note', '...']), 1.8); VFX.of(this.app).dust(_v.set(bp.x, bp.y + 0.08, bp.z), 2, 0.5); }
      else if (this.t > P.until) this.partnerFree();
      return;
    }
    // following: meet the Tokonmon of the city
    const life = w.life, mpd = me.anim ? me.anim.speed || 0 : 0;
    if (life && life.res && mpd < 3.2 && this.t > P.next - 6) {
      for (const R of life.res) {
        if (!R.a || !R.shown || !R.live || R.busy || R.a === b) continue;
        const rp = R.a.g.position; if (Math.abs(rp.y - bp.y) > 1.5 || dist2(rp, bp) > 3.2 || (P.met.get(R.id) || 0) > this.t) continue;
        P.met.set(R.id, this.t + 45); P.next = this.t + 12;
        b.path = null; b.face(R.a); if (R.e.do !== 'nap' && R.e.do !== 'perch') R.a.face(b);
        b.busy = true; P.state = 'react'; P.until = this.t + 1.8;
        b.play(clips.cry ? 'cry' : 'idle', { restart: true }); this.cry(b);
        const k = R.e.temper === 'shy' ? 'sweat' : R.e.do === 'nap' ? '...' : pick(['!', 'heart', 'note', 'happy']);
        this.emote(b, k === '...' ? '?' : '!', 1.2); setTimeout(() => { if (R.a && R.shown) this.emote(R.a, k, 1.5); }, 450);
        return;
      }
    }
    // stand still a while and it wanders off to sniff at something; longer, and it curls up for a nap
    if (this.pIdle > 32 && d < 3 && clips.sleep && !b.path) { P.state = 'sleep'; b.busy = true; b.play('sleep', { fade: 0.4 }); this.emote(b, 'zzz', 2); return; }
    if (this.pIdle > 5 && this.t > P.next && !b.path && d < 3.5) {
      P.next = this.t + rnd(9, 16);
      const tgt = this.sniffSpot(); if (!tgt) return;
      const path = w.nav.path({ x: bp.x, y: bp.y, z: bp.z }, { x: tgt[0], y: bp.y, z: tgt[1] });
      if (!path || path.length < 2) return;
      b.busy = true; P.state = 'sniff'; P.until = this.t + 6;
      b.walkTo(path.slice(1).map(([x, z]) => [x, z]), { speed: 1.5 });
    } else if (this.pIdle > 12 && clips.dance && this.t > (P.danceT || 0) && d < 3 && !b.path && Math.random() < dt * 0.05) {
      P.danceT = this.t + 40; b.busy = true; P.state = 'react'; P.until = this.t + 3.2; b.play('dance', { restart: true }); w.fx.emit('note', b.headPos(), { n: 3 });
    }
  }
  partnerFree() { const b = this.w.partner, P = this.P; if (b) { b.busy = false; if (P.state !== 'follow' && P.state !== 'cheer') b.play('idle', { fade: 0.25 }); if (P.state === 'sniff') b.path = null; } P.state = 'follow'; }
  /** somewhere to sniff at: a thing you could look at nearby, or just a spot of ground */
  sniffSpot() {
    const w = this.w, mp = w.player.g.position, L = w.city.L, nav = w.nav, its = [];
    for (const it of w.city.c.inter) if (!it.npc && (it.L || 0) === L && Math.hypot(it.x - mp.x, it.z - mp.z) < 4.5 && Math.hypot(it.x - mp.x, it.z - mp.z) > 1.2) its.push(it);
    if (its.length && Math.random() < 0.7) { const it = pick(its), dx = mp.x - it.x, dz = mp.z - it.z, dd = Math.hypot(dx, dz) || 1, x = it.x + (dx / dd) * 0.6, z = it.z + (dz / dd) * 0.6; if (nav.ok(x, z, L)) return [x, z]; }
    for (let k = 0; k < 6; k++) { const a = Math.random() * 6.28, r = rnd(1.4, 2.6), x = mp.x + Math.cos(a) * r, z = mp.z + Math.sin(a) * r; if (nav.ok(x, z, L)) return [x, z]; }
    return null;
  }
  /** a Tokonmon's call in a bubble (species voice from life.js) */
  cry(a, vol = 1) {
    const sp = (a.m && a.m.def && (a.m.def.name || a.m.def.id)) || '', key = Object.keys(VOICE).find((k) => sp.startsWith(k));
    const V = VOICE[key] || ['!', 1.5], w = this.w, B = w.bubbles || (w.bubbles = []);
    for (let i = B.length - 1; i >= 0; i--) if (B[i].a === a) B.splice(i, 1);
    B.push({ a, text: V[0], t: 0, n: 0, dur: 1.4, voice: { pitch: V[1], timbre: 'triangle', speed: 1.5, level: 0.8 * vol } });
  }
  /** after a battle: your partner cheers (or shakes it off) and so do you */
  afterBattle(o = {}) {
    setTimeout(() => {
      const app = this.app, w = this.w, b = w && w.partner, me = w && w.player, cin = app.cinema;
      if (!b || !me || (cin && cin.active) || (app.battle && app.battle.active) || o.fled) return;
      const clips = b.anim.clips || {}, P = this.P;
      b.path = null; b.face(me); b.busy = true; P.state = 'cheer'; P.until = this.t + 3;
      if (o.won) {
        b.play(clips.win ? 'win' : 'idle', { restart: true }); this.emote(b, pick(['star', 'heart', 'happy']), 2); w.fx.emit('heart', b.headPos(), { n: 3 }); this.cry(b);
        if (clips.dance) setTimeout(() => { if (P.state === 'cheer') b.play('dance', { restart: true }); }, 1300);
        me.play('pump', { restart: true }); setTimeout(() => { if (me.anim.cur === 'pump') me.play('idle', { fade: 0.3 }); }, 2200);
      } else {
        b.play(clips.hurt ? 'hurt' : 'idle', { restart: true }); this.emote(b, 'sweat', 1.8); me.play('sigh', { restart: true });
        setTimeout(() => { if (me.anim.cur === 'sigh') me.play('idle', { fade: 0.3 }); }, 2000);
      }
    }, 450);
  }
  // ---------------------------------------------------------------- the street's people
  npcs(dt, scene) {
    const w = this.w, me = w.player, mp = me.g.position;
    for (const a of w.actors.values()) {
      if (a.kind !== 'person' || !a.npc || a === me || a.path) continue;
      let S = this.npcS.get(a); if (!S) this.npcS.set(a, (S = { fidT: this.t + rnd(4, 18), glance: 0, glanceCool: 0, back: 0 }));
      const p = a.g.position, d = dist2(p, mp), posed = !!(a.npc.clip && a.npc.clip !== 'idle'), seated = !!(a.anim.c && a.anim.c.sit);
      if (scene || this.talking.has(a) || (this.chat && (this.chat.a === a || this.chat.b === a))) {
        if (S.glance && a.look === me && !this.talking.has(a)) a.look = null; S.glance = 0;
        if (S.back && scene && !this.talking.has(a)) { S.back = 0; a.play(a.npc.clip || 'idle', { fade: 0.2 }); }   // a cutscene starts: phones away
        continue;
      }
      if (S.back && this.t > S.back) { S.back = 0; a.play(a.npc.clip || 'idle', { fade: 0.3 }); }
      if (d > 22 || !a.g.visible) { if (S.glance) { if (a.look === me) a.look = null; S.glance = 0; } continue; }
      // a glance (and now and then a wave) when you walk up
      if (!S.glance && d < 3.6 && this.t > S.glanceCool && Math.abs(p.y - mp.y) < 1.6) {
        S.glance = this.t + rnd(2.4, 4.2); S.glanceCool = this.t + rnd(14, 24); a.look = me;
        if (Math.random() < 0.35) this.emote(a, pick(['!', 'happy', 'note', '?']), 1.3);
        if (!posed && Math.random() < 0.3 && d < 2.9) { a.play('wave', { restart: true }); S.back = this.t + 2.4; }
      }
      if (S.glance && (this.t > S.glance || d > 6)) { if (a.look === me) a.look = null; S.glance = 0; }
      // fidgets: a phone, a stretch, a look around
      if (!S.glance && !S.back && this.t > S.fidT && d < 18) {
        S.fidT = this.t + rnd(10, 24);
        if (seated) { a.play(Math.random() < 0.6 ? 'sitPhone' : 'sitTalk', { restart: true }); S.back = this.t + rnd(4, 8); }
        else if (!posed && a.anim.cur === 'idle') { const f = pick(NPC_FIDGETS); a.play(f, { restart: true }); S.back = this.t + (f === 'phone' ? rnd(5, 9) : 2.8); }
      }
    }
  }
  /** neighbours standing together trade two lines now and then */
  chats(dt, scene) {
    const w = this.w, me = w.player, mp = me.g.position, C = this.chat;
    if (C) {
      C.t += dt;
      const end = scene || C.t > C.dur || !w.actors.has(C.a.id) || !w.actors.has(C.b.id);
      if (!end) {
        if (!C.said1 && C.t > 0.3) { C.said1 = true; this.say(C.a, C.lines[0], C.va); C.a.play(pick(['talk', 'explain']), { restart: true }); C.b.play('nod', { restart: true }); }
        if (!C.said2 && C.t > C.t2) { C.said2 = true; this.say(C.b, C.lines[1], C.vb); C.b.play(pick(['laugh', 'talk', 'shrug']), { restart: true }); C.a.play(Math.random() < 0.5 ? 'laugh' : 'nod', { restart: true }); }
        return;
      }
      for (const [x, yaw] of [[C.a, C.ya], [C.b, C.yb]]) { if (!w.actors.has(x.id)) continue; if (x.look === C.a || x.look === C.b) x.look = null; x.targetYaw = yaw; x.play((x.npc && x.npc.clip) || 'idle', { fade: 0.3 }); }
      this.chat = null; this.chatT = rnd(8, 16); return;
    }
    if (scene || (this.chatT -= dt) > 0) return;
    this.chatT = 3;
    if (!this.pairs || this.t > this.pairsT) {
      this.pairsT = this.t + 6; this.pairs = [];
      const cand = [...w.actors.values()].filter((a) => a.kind === 'person' && a.npc && a !== me && a.g.visible && !(a.npc.clip && a.npc.clip !== 'idle') && dist2(a.g.position, mp) < 20);
      for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) { const A = cand[i].g.position, B = cand[j].g.position; if (dist2(A, B) < 3.4 && Math.abs(A.y - B.y) < 0.6) this.pairs.push([cand[i], cand[j]]); }
    }
    const ok = this.pairs.filter(([a, b]) => !a.path && !b.path && !this.talking.has(a) && !this.talking.has(b) && dist2(a.g.position, mp) > 2.2 && dist2(a.g.position, mp) < 16 && this.w.project(a.headPos(_v)).vis);
    if (!ok.length) return;
    const [a, b] = pick(ok), lines = pick(CHATS), BB = w.bubbles || [];
    if (BB.some((x) => x.a === a || x.a === b)) return;
    this.chat = { a, b, ya: a.yaw, yb: b.yaw, lines, t: 0, t2: 0.3 + 1.2 + lines[0].length * 0.05, dur: 0.3 + 2.6 + (lines[0].length + lines[1].length) * 0.06, va: pick(CHAT_VOICES), vb: pick(CHAT_VOICES) };
    a.face(b); b.face(a); a.look = b; b.look = a;
    this.emote(a, '...', 0.9);
  }
  say(a, text, voice) {
    const w = this.w, B = w.bubbles || (w.bubbles = []);
    for (let i = B.length - 1; i >= 0; i--) if (B[i].a === a) B.splice(i, 1);
    B.push({ a, text, t: 0, n: 0, dur: 1.4 + text.length * 0.06, voice });
  }

  // ================================================================ interacting (city/control.js use())
  /** run an interactable's act with the right camera: a conversation for people, a nudge toward anything else */
  async use(it, run) {
    const app = this.app, w = this.w, cin = app.cinema, npc = it.npc ? w.actor(it.npc) : null;
    this.watch = { bag: Object.assign({}, app.state.bag || {}), money: app.state.money || 0, toasts: app.ui.toasts.slice(), got: [] };
    try {
      if (npc && npc.kind === 'person' && cin && !cin.active && w.player) await this.converse(npc, it, run);
      else { this.focusOn(it); await run(); }
    } finally {
      this.focusOn(null);
      this.checkPickups(true); this.watch = null;
    }
  }
  focusOn(it) {
    const w = this.w, me = w && w.player;
    if (w && w.city) w.city.focusAt = it ? new V3(it.x, it.y ?? (me ? me.g.position.y + 1 : 1), it.z) : null;
    if (w && w.partner && w.partner.kind === 'mon') w.partner.look = it ? (it.npc ? w.actor(it.npc) : new V3(it.x, it.y ?? 1, it.z)) : null;
  }
  /** a short over-the-shoulder conversation: light bars, the camera cutting between the two of you as each speaks */
  async converse(npc, it, run) {
    const app = this.app, w = this.w, me = w.player, cin = app.cinema, name = (npc.npc && npc.npc.name) || '', mine = app.state.player.name;
    const tok = {}; this.talkTok = tok; this.talking.add(npc);
    npc.look = me; me.look = npc; if (w.partner && w.partner.kind === 'mon') w.partner.look = npc;
    const S = this.npcS.get(npc); if (S) { S.back = 0; S.glance = 0; }
    if (Math.random() < 0.4) this.emote(npc, pick(['!', 'happy', 'note']), 1.1);
    await cin.begin({ bars: 0.55, prefer: (w.cam.yaw || 0), hush: false, fov: 32 });
    let cur = null, own = null;
    // cut on each new speaker — but only while the camera is still ours (a scene that frames its own shots keeps them)
    const live = () => this.talkTok === tok && cin.active && cin.shot === own;
    const shoot = (sp, li) => { if (cur === sp || !live()) return null; cur = sp; const p = cin.ots(sp, li, { back: 0.95, side: 0.48, dur: 0, push: 0.05, hold: 14 }); own = cin.shot; return p; };
    // the first shot eases in from the follow camera
    const first = cin.ots(npc, me, { back: 1.05, side: 0.5, dur: 0.65, push: 0.05, hold: 14 }); cur = npc; own = cin.shot;
    const say0 = app.say;
    app.say = (n, ...lines) => {
      if (live()) { if (n === mine || n === 'You') shoot(me, npc); else if (n && n === name) shoot(npc, me); }
      return say0.call(app, n, ...lines);
    };
    try { await first; await run(); }
    finally {
      app.say = say0; this.talking.delete(npc);
      if (npc.look === me) npc.look = null; if (me.look === npc) me.look = null;
      if (w.partner && w.partner.look === npc) w.partner.look = null;
      if (this.talkTok === tok) { this.talkTok = null; if (cin.active) await cin.end({ dur: 0.7 }); }
      if (S) S.glanceCool = this.t + 10;
    }
  }
  // ---------------------------------------------------------------- pickups: what you got pops over your head
  checkPickups(final) {
    const W_ = this.watch, app = this.app, st = app.state; if (!W_ || !st) return;
    const bag = st.bag || {};
    for (const id of Object.keys(bag)) {
      const d = (bag[id] || 0) - (W_.bag[id] || 0);
      if (d > 0) { W_.bag[id] = bag[id]; this.pickup(id, d); W_.got.push([id, d]); }
      else if (d < 0) W_.bag[id] = bag[id];
    }
    const dm = (st.money || 0) - W_.money;
    if (dm > 0) { W_.money = st.money; this.popOver('coin', '+$' + dm, '#ffd84a'); const au = app.audio; if (au && au.sfx) au.sfx('coin', { vol: 0.8 }); }
    else if (dm < 0) W_.money = st.money;
    if (final) for (const [id, n] of W_.got) {
      const it = ITEMS[id], nm = it ? it.name.replace(/\s*×\d+$/, '') : id;
      if (!app.ui.toasts.some((t) => !W_.toasts.includes(t))) app.ui.toast(`Got ${n > 1 ? n + '× ' : ''}${nm}!`, { icon: 'bag', color: T.green, dur: 2.2 });
    }
  }
  pickup(id, n) {
    const it = ITEMS[id], kind = it && it.kind, icon = kind === 'food' ? 'onigiri' : kind === 'gem' ? 'sparkle' : kind === 'mixtape' ? 'disc' : kind === 'boost' ? 'candy' : 'bag';
    const nm = it ? it.name.replace(/\s*×\d+$/, '') : id;
    this.popOver(icon, `+${n} ${nm}`, kind === 'gem' ? '#8ae0ff' : '#ffffff');
    const w = this.w, me = w.player; if (me) { w.fx.emit('sparkle', me.headPos(_v).setY(me.headPos(_v).y + 0.2), { n: 10 }); w.fx.emit('star', me.headPos(_v), { n: 3 }); }
    const au = this.app.audio; if (au && au.sfx) { au.sfx('sparkle', { vol: 0.6 }); au.sfx('reward', { vol: 0.45 }); }
  }
  popOver(icon, label, color) { this.pops.push({ icon, label, color, t: 0, dur: 1.6, n: this.pops.length }); }
  // ================================================================ emotes
  emote(a, kind = '!', dur = 1.5) {
    if (!a || !a.g || !EMOTE[kind]) return;
    this.emotes = this.emotes.filter((e) => e.a !== a); this.emotes.push({ a, kind, t: 0, dur });
    const w = this.w, me = w && w.player, au = this.app.audio;
    if (me && au && au.sfx && dist2(a.g.position, me.g.position) < 9 && (kind === '!' || kind === '?')) au.sfx('ui_tap', { vol: 0.25, pitch: kind === '!' ? 1.7 : 1.3 });
  }
  drawUI(ui) {
    const w = this.w, app = this.app; if (!w || !w.ready || app.story.title || app.phone.open) return;
    for (const e of this.emotes) {
      if (!e.a.g.visible || !e.a.g.parent) continue;
      const hp = e.a.headPos(_v); hp.y += e.a.kind === 'mon' ? 0.25 : 0.32;
      const s = w.project(hp); if (!s.vis) continue;
      const kin = Math.min(1, e.t / 0.16), kout = Math.min(1, (e.dur - e.t) / 0.2), k = Math.min(kin, kout); if (k <= 0) continue;
      const bob = Math.round(Math.sin(e.t * 7) * 1 - (1 - kin) * 5), bw = 15, bh = 13, x = Math.round(s.x - bw / 2), y = Math.round(s.y - 22 + bob);
      if (k < 0.5) { cham(ui, x + 4, y + 3, bw - 8, bh - 6, 1, '#ffffff'); continue; }       // popping open
      cham(ui, x - 1, y - 1, bw + 2, bh + 2, 3, T.ink); cham(ui, x, y, bw, bh, 2, '#ffffff');
      const cx = Math.round(s.x); ui.rect(cx - 2, y + bh, 4, 1, '#ffffff'); ui.rect(cx - 1, y + bh + 1, 2, 1, '#ffffff'); ui.px(cx - 3, y + bh, T.ink); ui.px(cx + 2, y + bh, T.ink); ui.px(cx - 2, y + bh + 1, T.ink); ui.px(cx + 1, y + bh + 1, T.ink); ui.px(cx - 1, y + bh + 2, T.ink); ui.px(cx, y + bh + 2, T.ink);
      const [icon, col] = EMOTE[e.kind];
      if (icon) ui.icon(icon, x + 4, y + 3, col);
      else if (e.kind === 'zzz') { ui.text('z', x + 3, y + 4, col, { mini: true }); ui.text('Z', x + 7, y + 1 + Math.round(Math.sin(e.t * 4)), col, { mini: true }); }
      else if (e.kind === '...') { const n = 1 + (Math.floor(e.t * 5) % 3); for (let i = 0; i < n; i++) ui.rect(x + 3 + i * 4, y + 6, 2, 2, col); }
      else if (e.kind === 'anger') { for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ui.rect(x + 7 + dx * 2, y + 6 + dy * 2, 2, 1, col); ui.rect(x + 7 + dx * 3, y + 6 + dy, 1, 2, col); } }
    }
    // things you got: an icon and a label rising over your head
    const me = w.player;
    if (me && this.pops.length) {
      const hp = me.headPos(_v); hp.y += 0.45; const s = w.project(hp);
      if (s.vis) this.pops.forEach((p, i) => {
        const k = p.t / p.dur, rise = Math.round(Math.min(1, p.t / 0.35) * 14 + k * 8), pop = p.t < 0.15 ? 1 + (1 - p.t / 0.15) * 0.4 : 1;
        if (k > 0.82 && Math.floor(p.t * 30) % 2) return;
        const y = Math.round(s.y - 18 - rise - i * 16), tw = ui.tw(p.label) + 16, x = Math.round(s.x - tw / 2);
        cham(ui, x - 1, y - 1, tw + 2, 13, 2, T.ink); cham(ui, x, y, tw, 11, 1, pop > 1.05 ? '#fff6d0' : '#2a2238');
        ui.icon(p.icon, x + 3, y + 2, p.color); ui.text(p.label, x + 12, y + 2, p.color, { mini: true });
      });
    }
    void app;
  }
}
/** a box with 45° cut corners (c units): the GUI never draws a circle */
function cham(ui, x, y, w, h, c, col) { for (let i = 0; i < c; i++) { ui.rect(x + c - i, y + i, w - 2 * (c - i), 1, col); ui.rect(x + c - i, y + h - 1 - i, w - 2 * (c - i), 1, col); } ui.rect(x, y + c, w, h - 2 * c, col); }
