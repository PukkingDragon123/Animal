// Director: the cutscene toolkit used by the story scripts. Wraps camera
// shots, actor choreography, dialogue with live 3D portraits + voices,
// choices, fades, time-lapses and small FX beats.
import { getTemplate, instantiate } from '../gfx/model.js';
import { Animator } from '../gfx/anim.js';
import { SPR } from '../gfx/particles.js';
import { creatureDesign, humanDesignFor, characterLore, HUMANS } from '../data/designs/index.js';
import { SPECIES, elemsOf } from '../data/species.js';
import { ELEMENTS } from '../data/elements.js';
import { wait } from '../ui/dom.js';
import { nameOf } from './elemon.js';

const CHAR_STYLE = {
  coach: { color: '#ff7a2f', bg: ['#ffd36b', '#ff7a2f'], voice: 'coach' },
  mika: { color: '#ff4fa8', bg: ['#ffe0f0', '#ff6bb5'], voice: 'friend' },
  kaito: { color: '#e8233a', bg: ['#c8d0ff', '#3a2a6a'], voice: 'rival' },
  taro: { color: '#e8a21e', bg: ['#fff3b0', '#7ad04a'], voice: 'kid' },
  thrash: { color: '#33d65a', bg: ['#d8ff3a', '#1b1230'], voice: 'punk' },
  riff: { color: '#ff7ab5', bg: ['#ffb3d0', '#1b1230'], voice: { pitch: 1.3, timbre: 'square', speed: 1.25, gruff: 0.2, nasal: 0.8 } },
  moshi: { color: '#6b6b80', bg: ['#a0a0b8', '#1b1230'], voice: { pitch: 0.55, timbre: 'square', speed: 0.8, gruff: 0.9 } },
  hoshino: { color: '#8a5aff', bg: ['#e8dcff', '#5a3aa0'], voice: 'professor' },
  farmer: { color: '#7a9a3a', bg: ['#fff0c0', '#9ab04a'], voice: 'elder' },
  granny: { color: '#b07ad6', bg: ['#fde8ff', '#b07ad6'], voice: 'elder' },
  dojo_master: { color: '#4a4a5a', bg: ['#f5efe0', '#7a5a3a'], voice: 'elder' },
  receptionist: { color: '#2fa8ff', bg: ['#dff6ff', '#2fa8ff'], voice: { pitch: 1.3, timbre: 'triangle', speed: 1.05 } },
  vendor: { color: '#d2502a', bg: ['#ffe2b0', '#d2502a'], voice: { pitch: 0.8, timbre: 'saw', speed: 1.2, gruff: 0.4 } },
  clerk: { color: '#ffb52e', bg: ['#fff7c2', '#ff9ec7'], voice: { pitch: 1.5, timbre: 'triangle', speed: 1.15 } },
  ranger: { color: '#3a8a4a', bg: ['#e0ffd0', '#3a8a4a'], voice: { pitch: 0.95, timbre: 'triangle', speed: 1 } },
  shopkeeper: { color: '#8a4fbf', bg: ['#f3e0ff', '#8a4fbf'], voice: { pitch: 1.2, timbre: 'triangle', speed: 1.3 } },
  idol: { color: '#b46bff', bg: ['#ffd0f5', '#b46bff'], voice: { pitch: 1.7, timbre: 'sine', speed: 1.2 } },
  salaryman: { color: '#3a4a6a', bg: ['#e0e6f0', '#3a4a6a'], voice: { pitch: 0.9, timbre: 'triangle', speed: 1.1 } },
  announcer: { color: '#ffd23a', bg: ['#fff7c2', '#ff4fa8'], voice: 'robot' },
};

export class Director {
  constructor(app) {
    this.app = app;
    this.cutscene = false;
    this.portraits = new Map();   // speaker key → { model, anim, lookKey }
    this.skip = false;
  }
  get w() { return this.app.world; }
  get gfx() { return this.app.gfx; }
  get ui() { return this.app.ui; }
  get audio() { return this.app.audio; }
  get s() { return this.app.state; }

  // ------------------------------------------------------------------ cutscene frame
  async scene(fn, opts = {}) {
    this.begin(opts);
    try { return await fn(this); } finally { this.end(opts); }
  }
  begin(opts = {}) {
    this.cutscene = true;
    this.app.busy = true;
    this.w.enableControl(false);
    this.app.hud.show(false);
    if (opts.letterbox !== false) this.gfx.setLetterbox(true);
    const p = this.w.rec('player'); if (p) p.path = null;
  }
  end(opts = {}) {
    this.cutscene = false;
    for (const id of ['buddy', ...this.w.followers]) this.free(id);
    this.app.busy = false;
    this.gfx.setLetterbox(false);
    this.ui.closeDialogue();
    if (opts.keepCam) return;
    this.release();
    if (!this.app.battle.active && opts.control !== false) { this.w.enableControl(true); this.app.hud.show(true); }
  }

  // ------------------------------------------------------------------ dialogue
  speaker(id) {
    if (id && typeof id === 'object') return id;
    const st = CHAR_STYLE[id] || {};
    if (id === 'player') return { name: this.s.player.name, color: '#2fa8ff', voice: { pitch: 1.18, timbre: 'triangle', speed: 1.1 }, portrait: this.portraitFor('player'), colors: ['#d8f4ff', '#2fa8ff'] };
    if (id === 'buddy' || (id && id.startsWith && id.startsWith('mon:'))) {
      const mon = id === 'buddy' ? this.s.party[0] : null;
      const species = mon ? mon.species : id.slice(4);
      const sp = SPECIES[species];
      const el = ELEMENTS[elemsOf(sp)[0]];
      return { name: mon ? nameOf(mon) : sp.name, color: el.color, voice: { pitch: 1.6 + (0.5 - (sp.radius || 0.5)), timbre: 'sine', speed: 1.3 }, portrait: this.portraitFor('mon:' + species), colors: [el.accent, el.color] };
    }
    const lore = characterLore(id);
    return { name: lore.name || id, color: st.color || '#8a5aff', voice: st.voice || lore.voice || { pitch: 1 }, portrait: id === 'narrator' || id === 'announcer' ? null : this.portraitFor(id), colors: st.bg || ['#ffd36b', '#ff6b8a'] };
  }
  portraitFor(id) {
    let design, key;
    if (id === 'player') { const look = this.app.playerLook(); key = 'player:' + JSON.stringify(look); design = humanDesignFor(look); }
    else if (id.startsWith('mon:')) { key = id; design = creatureDesign(id.slice(4)); }
    else { key = id; design = humanDesignFor(id); }
    if (!design) return null;
    let p = this.portraits.get(id);
    if (!p || p.key !== key) {
      if (p) for (const m of p.model.userData.rig.materials) m.dispose();
      const model = instantiate(getTemplate(design, design.id), { rim: 0.2, shadow: false });
      const anim = new Animator(model);
      const fr = design.portrait || (id.startsWith('mon:') ? { y: model.userData.rig.height * 0.6, dist: model.userData.rig.height * 1.6 + 0.6, yaw: 0.45 } : {});
      p = { key, model, anim, frame: fr };
      this.portraits.set(id, p);
    }
    return p;
  }
  // say('coach', 'text', { expr:'happy', play:'nod', actor:true })
  async say(id, text, opts = {}) {
    const sp = this.speaker(id);
    const P = sp.portrait;
    const spk = { name: opts.name || sp.name, color: sp.color, voice: sp.voice, portrait: P ? { model: P.model, anim: P.anim, frame: P.frame, colors: sp.colors, expr: opts.expr, play: opts.play } : null };
    // the world actor reacts too
    const a = opts.actor === false ? null : (id && typeof id === 'object' ? id.actor || null : this.actorOf(id));
    if (a) { a.talk(true); if (opts.play) a.play(opts.play); if (opts.expr) a.expr(opts.expr, 3); }
    if (opts.emote && a) a.emote(opts.emote);
    if (opts.cam) this.closeUp(id, opts.cam === true ? {} : opts.cam);
    await this.ui.say(spk, text, { keep: opts.keep, auto: opts.auto, speed: opts.speed });
    if (a) a.talk(false);
  }
  async lines(list) { for (const l of list) { if (typeof l === 'function') await l(); else await this.say(l[0], l[1], l[2] || {}); } }
  // ask: dialogue line + choice buttons → index
  async ask(id, text, options, opts = {}) {
    const p = this.say(id, text, Object.assign({ keep: true }, opts));
    // show choices once the line finishes typing (or immediately on tap)
    const idx = await Promise.race([p.then(() => null), wait(Math.min(2600, text.length * 26 + 200)).then(() => 'show')]);
    if (idx === 'show') { this.ui.dlg.onpointerup = null; this.ui.onAdvanceKey = null; }
    const pick = await this.ui.choose(options);
    this.ui.closeDialogue();
    return pick;
  }
  narrate(text) { return this.ui.narrate(text); }
  caption(text, ms) { return this.ui.caption(text, ms); }
  titleCard(big, sub, ms) { return this.ui.titleCard(big, sub, ms); }

  // ------------------------------------------------------------------ actors
  actorOf(id) {
    if (id === 'player') return this.w.actor('player');
    if (id === 'buddy') return this.w.actor('buddy');
    return this.w.actor(id);
  }
  // spawn a character / creature at a map point
  spawn(id, what, at, face = null, opts = {}) {
    const pt = this.pt(at);
    let design;
    if (what.species) design = creatureDesign(what.species);
    else if (what.random != null) design = humanDesignFor(HUMANS.randomLook ? HUMANS.randomLook(what.random, what.role) : {});
    else design = humanDesignFor(what.char || what);
    const npc = Object.assign({ id, name: opts.name, static: opts.static, species: what.species || null }, opts.npc || {});
    const rec = this.w.addActor(id, design, pt[0], pt[1], face ?? pt[2] ?? 0, Object.assign({}, opts, { kind: opts.kind || 'npc', key: what.species || null, rec: { npc, scripted: opts.scripted !== false, home: [pt[0], pt[1]], wanderT: 1 + Math.random() * 3 } }));
    if (opts.label !== false && rec.kind === 'npc') rec.label = this.ui.label('');
    if (opts.fadeIn) { rec.actor.dissolve(-1, 0.6); }
    return rec;
  }
  remove(id, fade = false) {
    const a = this.actorOf(id); if (!a) return;
    if (fade) { a.dissolve(1, 0.5); setTimeout(() => this.w.removeActor(id), 550); } else this.w.removeActor(id);
  }
  pt(at) {
    if (Array.isArray(at)) return at;
    if (typeof at === 'string') { const a = this.actorOf(at); if (a) return [a.pos.x, a.pos.z]; return this.w.resolvePoint(at) || [0, 0]; }
    if (at && at.pos) return [at.pos.x, at.pos.z];
    return [0, 0];
  }
  offset(at, dx, dz) { const p = this.pt(at); return [p[0] + dx, p[1] + dz, p[2]]; }
  place(id, at, faceDeg) { const p = this.pt(at); this.w.place(id, p[0], p[1], faceDeg ?? p[2]); }
  walk(id, at, opts = {}) {
    const p = this.pt(at);
    const r = this.w.rec(id); if (r) r.scripted = true;
    return this.w.walkTo(id, p[0], p[1], opts).then((v) => { if (opts.face != null) this.face(id, opts.face); return v; });
  }
  run(id, at, opts = {}) { return this.walk(id, at, Object.assign({ run: true }, opts)); }
  free(id) { const r = this.w.rec(id); if (r) r.scripted = false; }
  // straight-line move ignoring navigation (leaps, flights, dramatic entrances)
  // o: { speed, arc (hop height), alt (absolute altitude), trail(actor, dt), face }
  glide(id, at, o = {}) {
    const a = this.actorOf(id); if (!a) return Promise.resolve();
    const r = this.w.rec(id); if (r) { r.path = null; r.scripted = true; }
    const p = this.pt(at);
    const x0 = a.pos.x, z0 = a.pos.z, y0 = a.pos.y;
    const L = Math.hypot(p[0] - x0, p[1] - z0) || 0.01, speed = o.speed || 6, dur = o.dur || L / speed;
    if (o.face !== false) a.faceTo(p[0], p[1]);
    return new Promise((res) => {
      let t = 0;
      a.onUpdate = (dt) => {
        t += dt;
        const u = Math.min(1, t / dur);
        const x = x0 + (p[0] - x0) * u, z = z0 + (p[1] - z0) * u;
        const gy = o.alt != null ? y0 + (o.alt - y0) * u : this.w.grid.heightAt(x, z);
        a.pos.set(x, gy + (o.arc ? Math.sin(u * Math.PI) * o.arc : 0), z);
        a.obj.position.copy(a.pos);
        a.anim.setSpeed(u < 1 ? (o.animSpeed ?? speed) : 0);
        if (o.trail) o.trail(a, dt);
        if (u >= 1) { a.onUpdate = null; res(); }
      };
    });
  }
  // speaker built from an arbitrary world actor (townsfolk with random looks)
  speakerFrom(rec, name) {
    const key = 'rec:' + rec.id + ':' + rec.actor.design.id;
    let p = this.portraits.get(key);
    if (!p) {
      const model = instantiate(getTemplate(rec.actor.design, rec.actor.design.id), { rim: 0.2, shadow: false });
      p = { key, model, anim: new Animator(model), frame: rec.actor.design.portrait || {} };
      this.portraits.set(key, p);
    }
    return { actor: rec.actor, name: name || (rec.npc && rec.npc.name) || 'Passer-by', color: '#6a5a8a', voice: { pitch: 0.8 + (rec.id.length % 5) * 0.12, timbre: 'triangle', speed: 1.05 }, portrait: p, colors: ['#e8e0ff', '#8a7ab0'] };
  }
  face(id, target) {
    const a = this.actorOf(id); if (!a) return;
    if (typeof target === 'number') a.face((target * Math.PI) / 180);
    else { const p = this.pt(target); a.faceTo(p[0], p[1]); }
  }
  faceEach(a, b) { this.face(a, b); this.face(b, a); }
  play(id, name, opts) { const a = this.actorOf(id); if (a) a.play(name, opts); }
  mode(id, m) { const a = this.actorOf(id); if (a) a.mode(m); }
  expr(id, e, dur = 2) { const a = this.actorOf(id); if (a) a.expr(e, dur); }
  emote(id, kind) { const a = this.actorOf(id); if (a) { a.emote(kind); this.audio.sfx(kind === '!' ? 'alert' : kind === 'heart' ? 'heart' : 'ui_tap', { vol: 0.6 }); } }
  visible(id, on) { const a = this.actorOf(id); if (a) a.setVisible(on); }

  // ------------------------------------------------------------------ camera
  // shot({ from:[x,y,z], to, look:[x,y,z], lookTo, dur, fov, fov1, ease, orbit:[a0,a1], radius, height })
  shot(o) {
    const s = Object.assign({}, o);
    const res = (v) => (typeof v === 'string' || (v && v.pos) ? this.lookPt(v, s.lookY) : v);
    s.look = res(o.look); if (o.lookTo) s.lookTo = res(o.lookTo);
    if (o.from) s.from = res(o.from); else if (!o.orbit) s.from = this.gfx.camera.position.toArray();
    if (o.to) s.to = res(o.to);
    if (!s.from) s.from = [s.look[0], s.look[1] + 4, s.look[2] + 8];
    const p = this.gfx.rig.play(s);
    return o.wait === false ? Promise.resolve() : p;
  }
  lookPt(at, yOff) {
    const a = typeof at === 'string' ? this.actorOf(at) : at && at.pos ? at : null;
    if (a) return [a.pos.x, a.pos.y + (yOff ?? a.height * 0.75), a.pos.z];
    const p = this.pt(at);
    return [p[0], (this.w.grid ? this.w.grid.heightAt(p[0], p[1]) : 0) + (yOff ?? 1), p[1]];
  }
  // close-up on a character from in front (side: -1/1 shifts over the shoulder)
  closeUp(id, o = {}) {
    const a = this.actorOf(id); if (!a) return Promise.resolve();
    const yaw = a.yawT + (o.angle ?? 0.5) * (o.side || 1);
    const d = o.dist ?? Math.max(2.4, a.height * 2.4);
    const ly = a.pos.y + a.height * (o.y ?? 0.8);
    const from = [a.pos.x + Math.sin(yaw) * d, ly + (o.h ?? 0.35), a.pos.z + Math.cos(yaw) * d];
    const to = o.push ? [a.pos.x + Math.sin(yaw) * d * 0.85, ly + (o.h ?? 0.35), a.pos.z + Math.cos(yaw) * d * 0.85] : from;
    return this.shot({ from, to, look: [a.pos.x, ly, a.pos.z], dur: o.dur ?? 2.5, fov: o.fov ?? 30, ease: 'out', wait: o.wait ?? false });
  }
  // two-shot framing a pair of actors
  twoShot(a, b, o = {}) {
    const A = this.pt(a), B = this.pt(b);
    const cx = (A[0] + B[0]) / 2, cz = (A[1] + B[1]) / 2;
    const dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz) || 1;
    let nx = -dz / L, nz = dx / L;
    if (nz < 0) { nx = -nx; nz = -nz; }   // keep the camera on the south (front) side
    const d = o.dist ?? Math.max(5, L * 1.6 + 2.5);
    const y = (this.w.grid ? this.w.grid.heightAt(cx, cz) : 0) + 1.1;
    const from = [cx + nx * d + (o.side ?? 0.3) * d, y + (o.h ?? 1.6), cz + nz * d];
    return this.shot({ from, to: o.push ? [from[0] * 0.92 + cx * 0.08, from[1], from[2] * 0.92 + cz * 0.08] : from, look: [cx, y, cz], dur: o.dur ?? 3, fov: o.fov ?? 32, wait: o.wait ?? false });
  }
  orbit(at, o = {}) {
    const L = this.lookPt(at, o.y);
    return this.shot({ look: L, orbit: [o.a0 ?? 0.2, o.a1 ?? 1.2], radius: o.radius ?? 6, height: o.height ?? 2, dur: o.dur ?? 5, fov: o.fov ?? 34, ease: o.ease || 'inOut', from: L, wait: o.wait ?? false });
  }
  // back to gameplay follow cam focused on the player
  release(snap = false) {
    const rig = this.gfx.rig;
    if (rig.mode === 'cinema') {
      // continue smoothly from the current view
      rig.release();
      const p = this.w.actor('player');
      if (p) rig.target.set(p.pos.x, p.pos.y + 0.6, p.pos.z);
      if (snap) rig.snap();
    }
  }
  followCam(dist = 20) { const rig = this.gfx.rig; rig.release(); rig.distT = dist; }

  // ------------------------------------------------------------------ timing & fx
  wait(sec) { return wait(sec * 1000); }
  async fadeOut(ms = 600) { await this.ui.fade(true, ms); }
  async fadeIn(ms = 700) { await this.ui.fade(false, ms); }
  async timeLapse(toHour, sec = 1.6) {
    // animate the sky from the current hour to toHour (wraps past midnight)
    const from = this.gfx.hour;
    let to = toHour; if (to < from) to += 24;
    const t0 = performance.now();
    await new Promise((res) => {
      const tick = () => {
        const u = Math.min(1, (performance.now() - t0) / (sec * 1000));
        const e = u * u * (3 - 2 * u);
        this.gfx.setTime((from + (to - from) * e) % 24);
        if (u < 1) requestAnimationFrame(tick); else res();
      };
      tick();
    });
  }
  // soul-link burst between the player's bracelet and a creature
  soulLink(monId = 'buddy', color = 0x3ff0ff) {
    const a = this.actorOf(monId), p = this.actorOf('player');
    const fx = this.gfx.fx;
    if (p) for (let i = 0; i < 40; i++) {
      const ang = (i / 40) * Math.PI * 2;
      fx.particle({ pos: [p.pos.x, p.pos.y + 0.9, p.pos.z], vel: [Math.cos(ang) * 3, 0.6 + Math.random(), Math.sin(ang) * 3], life: 1.2, size: 0.18, size1: 0.02, color: [0.6, 2.4, 2.8, 1], color1: [1, 0.6, 2.4, 0], sprite: SPR.star, drag: 1.5 });
    }
    if (a) {
      fx.shape({ kind: 'ring', pos: [a.pos.x, a.pos.y + 0.08, a.pos.z], r0: 0.2, r1: 3.2, life: 0.9, color, intensity: 3 });
      fx.shape({ kind: 'pillar', pos: [a.pos.x, a.pos.y, a.pos.z], r0: 0.6, r1: 0.9, h0: 6, h1: 7, life: 1.4, color, intensity: 2.6 });
      for (let i = 0; i < 30; i++) fx.particle({ pos: [a.pos.x + (Math.random() - 0.5), a.pos.y + Math.random() * 1.5, a.pos.z + (Math.random() - 0.5)], vel: [0, 1.5 + Math.random() * 2, 0], life: 1.4, size: 0.12, color: [1.2, 2.6, 2.8, 1], color1: [2, 1, 2.6, 0], sprite: SPR.ember });
      a.flash(0xbff8ff, 0.5);
    }
    this.gfx.flash(0xbff8ff, 0.7);
    if (p) this.gfx.lights.flash([p.pos.x, p.pos.y + 1, p.pos.z], color, 8, 9, 1.2);
    this.audio.sfx('evolve_burst', { vol: 1 });
    this.audio.stinger && this.audio.stinger('spectral');
  }
  shootingStar(at, opts = {}) {
    const p = this.pt(at);
    const fx = this.gfx.fx;
    const x0 = p[0] - 30, y0 = 34, z0 = p[1] - 30;
    for (let i = 0; i < 70; i++) {
      const u = i / 70;
      setTimeout(() => {
        const x = x0 + u * 60, y = y0 - u * 10, z = z0 + u * 20;
        fx.particle({ pos: [x, y, z], vel: [0, -0.2, 0], life: 1.4, size: 0.9 * (1 - u * 0.4), size1: 0.05, color: [3, 2.6, 1.4, 1], color1: [2, 0.8, 2.4, 0], sprite: SPR.star });
        if (i % 3 === 0) fx.particle({ pos: [x, y, z], vel: [(Math.random() - 0.5), -0.5, (Math.random() - 0.5)], life: 2, size: 0.3, color: [2, 2.4, 3, 1], color1: [1, 1, 2, 0], sprite: SPR.dot });
      }, u * (opts.dur || 1400));
    }
    this.audio.sfx('whoosh', { vol: 0.8, pitch: 0.6 });
  }
}
