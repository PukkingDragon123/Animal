// Elemon audio engine — 100% procedural Web Audio (no files).
//
//   import { audio } from './audio/audio.js';
//   button.onclick = () => audio.unlock();          // first user gesture
//   audio.music('title');                           // crossfading looped tracks
//   audio.setIntensity(0.8);                        // battle layers in/out
//   audio.stinger('victory');                       // one-shot cue, ducks music
//   audio.sfx('hit_heavy', { pitch: 1.1, pan: -0.3 });
//   audio.voice(VOICES.coach, 'a');                 // dialogue babble, per typed char
//   audio.ambience('canal_night');
//
// Safe to import in Node / tests: nothing touches Web Audio until unlock(),
// and every method silently no-ops when Web Audio is unavailable.
// Routing:  tracks → duck → music ┐
//           stingers ─────→ music ├→ master → glue comp → limiter → soft clip → out
//           sfx (+ambience) ──────┤      (music & sfx each own a convolution reverb)
//           voice ────────────────┘
import { kitFor, TrackPlayer, TRACKS, STINGERS, stingerLength, curve, rand, rr, mtof, fxRiser, fxBoom, fxShimmer } from './music.js';
import { SampleBank, BGM, BEDS } from './samples.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const DEFAULT_VOL = { master: 0.9, music: 0.6, sfx: 0.9, voice: 0.8, ambience: 0.8 };

export class AudioEngine {
  constructor(opts = {}) {
    this.opts = opts; this.ctx = null; this.k = null; this.offline = false;
    this.vol = { ...DEFAULT_VOL }; this.muted = false; this.intensity = 0;
    this.track = null; this.trackId = null; this.fading = []; this.stingers = [];
    this.amb = null; this.ambId = null; this.ambFading = [];
    this._pending = { music: undefined, fade: 1.2, amb: undefined };
    this._active = []; this._sfxLast = new Map(); this._voiceLast = new Map();
    this._timer = null; this._lookahead = 0.1; this._lastWall = 0; this._hidden = false; this._duckUntil = 0; this._duckLevel = 1;
    this.quality = opts.quality || 'auto';
    if (opts.context) this._init(opts.context);
  }
  // 'high' | 'low' | 'auto'. Low thins oscillator stacks and skips ornamental
  // music layers (~40% less audio-thread CPU); auto picks low on weak devices.
  setQuality(q = 'auto') { this.quality = q; if (this.k) this.k.lite = this._isLite(); }
  _isLite() {
    if (this.quality === 'low') return true;
    if (this.quality === 'high' || this.offline) return false;
    const n = globalThis.navigator || {};
    return (n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (n.deviceMemory && n.deviceMemory <= 3) || false;
  }

  static get supported() { return !!(globalThis.AudioContext || globalThis.webkitAudioContext); }
  get ready() { return !!this.ctx; }
  get time() { return this.ctx ? this.ctx.currentTime : 0; }

  // ---- lifecycle -----------------------------------------------------------
  unlock() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return false;
      let ctx = null;
      try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return false; } }
      this._init(ctx);
      try { // iOS: a silent buffer started inside the gesture unlocks output
        const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); s.connect(ctx.destination); s.start(0);
      } catch (e) { /* ignore */ }
      if (typeof document !== 'undefined' && document.addEventListener && this.opts.pauseWhenHidden !== false) {
        document.addEventListener('visibilitychange', () => {
          if (!this.ctx) return;
          if (document.hidden) { this._hidden = true; this.ctx.suspend && this.ctx.suspend().catch(() => {}); }
          else { this._hidden = false; this.ctx.resume && this.ctx.resume().catch(() => {}); }
        });
      }
    }
    if (!this.offline && this.ctx.state !== 'running' && !this._hidden && this.ctx.resume) this.ctx.resume().catch(() => {});
    return true;
  }
  // Attach one-shot gesture listeners that call unlock() (convenience).
  autoUnlock(target = globalThis.window) {
    if (!target || !target.addEventListener) return;
    const evs = ['pointerdown', 'touchend', 'keydown', 'mousedown'];
    const h = () => { this.unlock(); if (this.ctx && this.ctx.state === 'running') evs.forEach((e) => target.removeEventListener(e, h, true)); };
    evs.forEach((e) => target.addEventListener(e, h, true));
  }

  _init(ctx) {
    this.ctx = ctx; this.k = kitFor(ctx);
    this.offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    this.k.lite = this._isLite();
    const g = (v) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    this.master = g(this.muted ? 0 : this.vol.master);
    const dcBlock = ctx.createBiquadFilter(); dcBlock.type = 'highpass'; dcBlock.frequency.value = 25; dcBlock.Q.value = 0.7; // DC + sub-rumble
    this.master.connect(dcBlock);
    let head = dcBlock;
    if (this.opts.limiter !== false) {
      const glue = ctx.createDynamicsCompressor();
      glue.threshold.value = -16; glue.knee.value = 10; glue.ratio.value = 2.5; glue.attack.value = 0.01; glue.release.value = 0.25;
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.1;
      const clip = ctx.createWaveShaper(); clip.curve = curve('clip'); clip.oversample = '2x';
      head.connect(glue); glue.connect(lim); lim.connect(clip); head = clip;
    }
    head.connect(ctx.destination);
    this.musicBus = g(this.vol.music); this.musicBus.connect(this.master);
    this.musicDuck = g(1); this.musicDuck.connect(this.musicBus);
    this.stingerBus = g(1); this.stingerBus.connect(this.musicBus);
    this.sfxBus = g(this.vol.sfx); this.sfxBus.connect(this.master);
    this.ambBus = g(this.vol.ambience); this.ambBus.connect(this.sfxBus);
    this.voiceBus = g(this.vol.voice); this.voiceBus.connect(this.master);
    // reverbs: mono send → stereo convolution (cheaper than true-stereo)
    const reverb = (secs, damp, out, wet) => {
      const inp = g(1); inp.channelCount = 1; inp.channelCountMode = 'explicit'; inp.channelInterpretation = 'speakers';
      const cv = ctx.createConvolver(); cv.normalize = true; cv.buffer = this.k.ir(secs, damp);
      const w = g(wet); inp.connect(cv); cv.connect(w); w.connect(out); return inp;
    };
    this.musicRevIn = reverb(2.4, 0.45, this.musicBus, 0.55);
    this.musicRevDuck = g(1); this.musicRevDuck.connect(this.musicRevIn);
    this.sfxRevIn = reverb(1.3, 0.7, this.sfxBus, 0.5);
    // recorded music / ambience beds / sampled sfx (assets/audio)
    if (this.opts.samples !== false) this.samples = new SampleBank(this);
    // apply anything requested before unlock
    const p = this._pending;
    if (p.music !== undefined) { const id = p.music; p.music = undefined; this.music(id, { fade: p.fade }); }
    if (p.amb !== undefined) { const id = p.amb; p.amb = undefined; this.ambience(id); }
    if (p.bed !== undefined) { const id = p.bed; p.bed = undefined; this.bed(id); }
  }

  // ---- mix -----------------------------------------------------------------
  setMuted(m) {
    this.muted = !!m;
    if (this.ctx) this._ramp(this.master.gain, this.muted ? 0 : this.vol.master, 0.04);
  }
  setVolumes(v = {}) {
    for (const key of Object.keys(DEFAULT_VOL)) if (typeof v[key] === 'number' && isFinite(v[key])) this.vol[key] = clamp(v[key], 0, 1);
    if (!this.ctx) return;
    if (!this.muted) this._ramp(this.master.gain, this.vol.master, 0.05);
    this._ramp(this.musicBus.gain, this.vol.music, 0.05); this._ramp(this.sfxBus.gain, this.vol.sfx, 0.05);
    this._ramp(this.voiceBus.gain, this.vol.voice, 0.05); this._ramp(this.ambBus.gain, this.vol.ambience, 0.05);
  }
  getVolumes() { return { ...this.vol, muted: this.muted }; }
  _ramp(param, v, tc) { const t = this.ctx.currentTime; param.cancelScheduledValues(t); param.setTargetAtTime(v, t, tc); }
  // Overlapping ducks merge: deepest level wins, music returns after the latest one ends.
  _duck(amount, t, dur) {
    let end = t + Math.max(0.1, dur);
    if (this._duckUntil > t) { amount = Math.min(amount, this._duckLevel); end = Math.max(end, this._duckUntil); }
    this._duckLevel = amount; this._duckUntil = end;
    for (const n of [this.musicDuck, this.musicRevDuck]) {
      const p = n.gain; p.cancelScheduledValues(t); p.setTargetAtTime(amount, t, 0.04); p.setTargetAtTime(1, end, 0.4);
    }
  }

  // ---- scheduler -------------------------------------------------------------
  // Realtime: 25 ms setInterval, ~0.1 s lookahead (grows a little if the main
  // thread hitches). Offline: driven by OfflineAudioContext.suspend() steps.
  _ensureTimer() {
    if (!this.ctx || this.offline || this._timer) return;
    this._timer = setInterval(() => this._tick(), 25);
  }
  _tick() {
    const ctx = this.ctx; if (!ctx) return;
    const now = ctx.currentTime;
    if (!this.offline) {
      const wall = (globalThis.performance ? performance.now() : Date.now());
      if (this._lastWall && wall - this._lastWall > 70) this._lookahead = Math.min(0.3, this._lookahead + 0.04);
      else this._lookahead = Math.max(0.1, this._lookahead - 0.001);
      this._lastWall = wall;
    }
    const until = now + (this.offline ? 0.35 : this._lookahead);
    if (this.track) this.track.tick(until);
    for (const f of this.fading) f.tick(until);
    this.fading = this.fading.filter((f) => { if (now > f.stopAt + 3.5) { f.dispose(); return false; } return true; });
    for (const s of this.stingers) s.tick(until);
    this.stingers = this.stingers.filter((s) => { if ((s.ended && now > s.endTime + (s.tr.tail || 2) + 0.5) || now > s.stopAt + 3) { s.dispose(); return false; } return true; });
    if (this.amb) this.amb.tick(until);
    this.ambFading = this.ambFading.filter((a) => { if (now > a.stopAt + 0.2) { a.dispose(); return false; } return true; });
    this._active = this._active.filter((a) => { if (now > a.end) { a.out.disconnect(); if (a.pn) a.pn.disconnect(); return false; } return true; });
    if (!this.offline && !this.track && !this.fading.length && !this.stingers.length && !this.amb && !this.ambFading.length && !this._active.length && this._timer) {
      clearInterval(this._timer); this._timer = null; this._lastWall = 0;
    }
  }
  _driveOffline(dur, step = 0.2) {
    const ctx = this.ctx;
    this._tick();
    const go = (t) => {
      if (t >= dur - 0.01) return;
      ctx.suspend(t).then(() => { this._tick(); go(t + step); ctx.resume(); });
    };
    go(step);
  }
  // Render anything into an AudioBuffer offline (used by tools/audio.html).
  // limiter:false bypasses the master dynamics so levels/clipping are honest.
  static async renderOffline(setup, { duration = 2, sampleRate = 44100, channels = 2, limiter = false, quality = 'high' } = {}) {
    const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
    if (!OAC) return null; // no Web Audio (e.g. Node): graceful no-op
    const ctx = new OAC(channels, Math.ceil(duration * sampleRate), sampleRate);
    const eng = new AudioEngine({ context: ctx, limiter, quality });
    await setup(eng, ctx);
    eng._driveOffline(duration);
    return ctx.startRendering();
  }

  // ---- music -----------------------------------------------------------------
  get tracks() { return Object.keys(TRACKS); }
  get stingerIds() { return Object.keys(STINGERS); }
  music(id, { fade = 1.2, intensity, restart = false } = {}) {
    if (id != null && !TRACKS[id] && !BGM[id]) return false;
    if (BGM[id]) {
      // a recorded track: the procedural one fades out
      if (!this.ctx) { this._pending.music = id; this._pending.fade = fade; return true; }
      if (this.track) { this.track.fadeOut(this.ctx.currentTime, fade); this.fading.push(this.track); this.track = null; }
      this.trackId = id; if (this.samples) this.samples.bgm(id);
      return true;
    }
    if (this.samples) this.samples.bgm(null);
    if (typeof intensity === 'number') this.intensity = clamp(intensity, 0, 1);
    if (!this.ctx) { this._pending.music = id; this._pending.fade = fade; return true; }
    if (id === this.trackId && (this.track || id == null) && !restart) return true;
    const now = this.ctx.currentTime;
    if (this.track) { this.track.fadeOut(now, fade); this.fading.push(this.track); this.track = null; }
    this.trackId = id;
    if (id == null) { this._ensureTimer(); return true; }
    const p = new TrackPlayer(this.k, TRACKS[id], this.musicDuck, { rev: this.musicRevDuck, intensity: this.intensity });
    p.start(now + 0.05, fade);
    this.track = p;
    this._ensureTimer(); this._tick();
    return true;
  }
  setIntensity(x) {
    this.intensity = clamp(+x || 0, 0, 1);
    if (this.track) this.track.setIntensity(this.intensity);
  }
  stinger(id, { duck = 0.22 } = {}) {
    if (!this.ctx || !STINGERS[id]) return 0;
    const t = this.ctx.currentTime + 0.03, len = stingerLength(id);
    const p = new TrackPlayer(this.k, STINGERS[id], this.stingerBus, { rev: this.musicRevIn });
    p.start(t, 0); this.stingers.push(p);
    if (duck < 1) this._duck(duck, t, len - 1.2);
    this._ensureTimer(); this._tick();
    return len;
  }
  stopAll(fade = 0.4) {
    this.music(null, { fade }); this.ambience(null, { fade }); this.bed(null);
    if (this.ctx) for (const s of this.stingers) s.fadeOut(this.ctx.currentTime, 0.2);
  }

  // ---- sfx -------------------------------------------------------------------
  get sfxNames() { return Object.keys(SFX); }
  sfx(name, { vol = 1, pitch = 1, pan = 0 } = {}) {
    if (!this.ctx) return false;
    const sm = this.samples ? this.samples.play(name, { vol, pitch, pan }) : false;
    if (sm === true) return true;
    const fn = SFX[name]; if (!fn) return !!sm;
    if (sm === 'layer') vol *= 0.6;
    const ctx = this.ctx, now = ctx.currentTime, t = now + 0.004;
    const last = this._sfxLast.get(name);
    if (last != null && t - last < 0.028) return false; // same sound same frame → once
    this._sfxLast.set(name, t);
    this._active = this._active.filter((a) => a.end > now || (a.out.disconnect(), a.pn && a.pn.disconnect(), false));
    const same = this._active.filter((a) => a.name === name);
    if (same.length >= 4) this._steal(same[0], t);
    if (this._active.length >= 28) this._steal(this._active.find((a) => !a.stolen) || this._active[0], t);
    const out = ctx.createGain(); out.gain.value = clamp(vol, 0, 4) * (LEVEL[name] ?? 1);
    let pn = null;
    if (pan && this.k.hasPan) { pn = ctx.createStereoPanner(); pn.pan.value = clamp(pan, -1, 1); out.connect(pn); pn.connect(this.sfxBus); } else out.connect(this.sfxBus);
    const S = new SfxCtx(this, out, Math.max(0.05, pitch));
    let dur = 1;
    try { dur = fn(S, t) || 1; } catch (e) { out.disconnect(); if (pn) pn.disconnect(); return false; }
    const d = DUCK[name]; if (d) this._duck(d[0], t, d[1]);
    this._active.push({ name, out, pn, end: t + dur + 0.3, stolen: false });
    this._ensureTimer();
    return true;
  }
  _steal(a, t) { if (!a || a.stolen) return; a.stolen = true; a.out.gain.cancelScheduledValues(t); a.out.gain.setTargetAtTime(0, t, 0.015); a.end = Math.min(a.end, t + 0.12); }

  // ---- dialogue babble ---------------------------------------------------------
  // One blip per typed character. profile: preset name or
  // { pitch 0.5..2, timbre 'square'|'triangle'|'saw'|'sine'|'fm', speed, gruff 0..1, nasal 0..1 }
  voice(profile, ch, at) {
    if (!this.ctx || ch == null) return false;
    const p = resolveVoice(profile), c = String(ch).charAt(0);
    if (!c || !/[0-9A-Za-zÀ-ɏ぀-ヿ一-鿿가-힯]/.test(c)) return false; // spaces & punctuation → silent
    const key = p._key, lastT = this._voiceLast.get(key);
    let t = at ?? this.ctx.currentTime + 0.005;
    const gap = 0.028 / p.speed;
    if (lastT && t - lastT.t < gap) { if (at == null) return false; }
    if (lastT && lastT.g && t < lastT.end) { lastT.g.gain.cancelScheduledValues(t); lastT.g.gain.setTargetAtTime(0, t, 0.006); }
    const r = babble(this, p, c, t);
    this._voiceLast.set(key, { t, g: r.g, end: r.end });
    return true;
  }
  // Schedule a whole line at `cps` characters/second (handy for barks & tests).
  say(profile, text, { cps = 20 } = {}) {
    if (!this.ctx || !text) return 0;
    const p = resolveVoice(profile), t0 = this.ctx.currentTime + 0.02, step = 1 / (cps * p.speed);
    let t = t0;
    for (const c of String(text)) { this.voice(p, c, t); t += /[.,!?;:…]/.test(c) ? step * 4 : step; }
    return t - t0 + 0.15;
  }

  // ---- recorded ambience beds (birds, street, cicadas) and jingles -----------------
  bed(id) { if (id != null && !BEDS[id]) return false; if (!this.ctx) { this._pending.bed = id; return true; } if (this.samples) this.samples.bed(id); return true; }
  jingle(id) { if (this.samples) this.samples.jingle(id); }

  // ---- ambience ------------------------------------------------------------------
  get ambienceIds() { return Object.keys(AMB); }
  ambience(id, { fade = 2 } = {}) {
    if (id != null && !AMB[id]) return false;
    if (!this.ctx) { this._pending.amb = id; return true; }
    if (id === this.ambId && (this.amb || id == null)) return true;
    const now = this.ctx.currentTime;
    if (this.amb) { this.amb.stop(now, fade); this.ambFading.push(this.amb); this.amb = null; }
    this.ambId = id;
    if (id != null) { this.amb = new AmbPlayer(this, AMB[id]); this.amb.start(now + 0.02, fade); this._tick(); }
    this._ensureTimer();
    return true;
  }
}

// =============================================================================
// SFX bank. Each entry: (S, t) => approxDurationSeconds. S.p = pitch multiplier.
// All sounds go through S.out (per-call gain → pan → sfx bus); S.wet() sends to
// the sfx reverb. LEVEL[] trims loudness so the set mixes consistently.
// =============================================================================
class SfxCtx {
  constructor(eng, out, pitch) { this.e = eng; this.k = eng.k; this.ctx = eng.ctx; this.out = out; this.p = pitch; this.rev = eng.sfxRevIn; }
  v(dest) { return this.k.v(dest || this.out); }
  wet(v, node, amt) { const s = v.gain(amt); node.connect(s); s.connect(this.rev); }
}
function env2(p, t, vol, rise, fall) { p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(vol, t + rise); p.exponentialRampToValueAtTime(0.0001, t + rise + fall); }
function tone(v, t, o) {
  const { type = 'sine', f, f1, dur = 0.2, vol = 0.3, a = 0.003, det = 0 } = o, end = t + a + dur + 0.03;
  const s = v.osc(type, f, t, end, det); if (f1 && f1 !== f) s.frequency.exponentialRampToValueAtTime(f1, t + (o.sweep ?? dur));
  const g = v.gain(0); if (o.rise) env2(g.gain, t, vol, o.rise, dur); else v.perc(g.gain, t, vol, a, dur);
  let last = g; s.connect(g);
  if (o.lp) { const l = v.filter('lowpass', o.lp, o.q || 0.7); g.connect(l); last = l; }
  if (o.hp) { const h = v.filter('highpass', o.hp, 0.7); last.connect(h); last = h; }
  if (o.pan) { const pn = v.pan(o.pan); last.connect(pn); last = pn; }
  last.connect(o.dest || v.dest); return { s, g, out: last };
}
function noise(v, t, o) {
  const { kind = 'white', type = 'bandpass', f = 1000, f1, q = 1, dur = 0.2, vol = 0.3, a = 0.002, rate = 1 } = o, end = t + a + dur + (o.rise || 0) + 0.03;
  const n = v.noise(kind, t, end, rate), fl = v.filter(type, f, q), g = v.gain(0);
  if (f1 && f1 !== f) fl.frequency.exponentialRampToValueAtTime(f1, t + (o.sweep ?? dur));
  if (o.rise) env2(g.gain, t, vol, o.rise, dur); else v.perc(g.gain, t, vol, a, dur);
  n.connect(fl); fl.connect(g); let last = g;
  if (o.shape) { const sh = v.shaper(o.shape); g.connect(sh); last = sh; }
  if (o.pan != null && o.pan !== 0) { const pn = v.pan(o.pan); last.connect(pn); last = pn; }
  if (o.panTo != null) { const pn = v.pan(o.pan0 ?? -o.panTo); if (pn.pan) { pn.pan.setValueAtTime(o.pan0 ?? -o.panTo, t); pn.pan.linearRampToValueAtTime(o.panTo, t + (o.rise || 0) + dur); } last.connect(pn); last = pn; }
  last.connect(o.dest || v.dest); return { n, fl, g, out: last };
}
function fm(v, t, o) {
  const { f, ratio = 1, index = 2, index1 = 0.02, dur = 0.5, vol = 0.3, a = 0.002, idx = dur * 0.6 } = o, end = t + a + dur + 0.03;
  const c = v.osc('sine', f, t, end), m = v.osc('sine', f * ratio, t, end), mg = v.gain(0);
  mg.gain.setValueAtTime(f * index, t); mg.gain.exponentialRampToValueAtTime(Math.max(0.01, f * index1), t + idx);
  m.connect(mg); mg.connect(c.frequency);
  if (o.f1) c.frequency.exponentialRampToValueAtTime(o.f1, t + (o.sweep ?? dur));
  const g = v.gain(0); v.perc(g.gain, t, vol, a, dur); c.connect(g);
  let last = g; if (o.pan) { const pn = v.pan(o.pan); g.connect(pn); last = pn; }
  last.connect(o.dest || v.dest); return { c, g, out: last };
}
const thump = (v, t, f0, f1, dur, vol, dest) => tone(v, t, { f: f0, f1, dur, vol, sweep: Math.min(dur, 0.09), a: 0.002, dest });
const grains = (v, t, n, span, fn) => { for (let i = 0; i < n; i++) fn(t + rand() * span, i); };

export const SFX = {};
const X = SFX;

// ---- UI ---------------------------------------------------------------------
X.ui_tap = (S, t) => { const v = S.v(), P = S.p; tone(v, t, { f: 1900 * P, f1: 1300 * P, dur: 0.035, vol: 0.32 }); noise(v, t, { type: 'highpass', f: 5000, dur: 0.012, vol: 0.12 }); v.done(); return 0.06; };
X.ui_confirm = (S, t) => {
  const v = S.v(), P = S.p;
  tone(v, t, { type: 'triangle', f: 880 * P, dur: 0.08, vol: 0.3 }); tone(v, t + 0.065, { type: 'triangle', f: 1318.5 * P, dur: 0.16, vol: 0.3 });
  tone(v, t + 0.065, { f: 2637 * P, dur: 0.12, vol: 0.08 }); v.done(); return 0.25;
};
X.ui_back = (S, t) => { const v = S.v(), P = S.p; tone(v, t, { type: 'triangle', f: 1046.5 * P, dur: 0.06, vol: 0.28 }); tone(v, t + 0.055, { type: 'triangle', f: 698.5 * P, dur: 0.11, vol: 0.28 }); v.done(); return 0.18; };
X.ui_open = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { f: 900, f1: 4200, q: 1.2, rise: 0.08, dur: 0.06, vol: 0.18 });
  tone(v, t + 0.06, { f: 620 * P, f1: 1240 * P, dur: 0.1, vol: 0.26, sweep: 0.05 }); tone(v, t + 0.06, { type: 'triangle', f: 1860 * P, dur: 0.08, vol: 0.08 });
  v.done(); return 0.22;
};
X.ui_error = (S, t) => {
  const v = S.v(), P = S.p;
  for (const d of [0, 0.11]) { tone(v, t + d, { type: 'square', f: 196 * P, dur: 0.08, vol: 0.16, lp: 1600 }); tone(v, t + d, { type: 'square', f: 207.6 * P, dur: 0.08, vol: 0.14, lp: 1600 }); }
  v.done(); return 0.25;
};
X.coin = (S, t) => {
  const v = S.v(), P = S.p;
  tone(v, t, { type: 'square', f: 987.8 * P, dur: 0.06, vol: 0.14, lp: 6000 }); tone(v, t + 0.065, { type: 'square', f: 1318.5 * P, dur: 0.38, vol: 0.14, lp: 6000 });
  fm(v, t + 0.065, { f: 2637 * P, ratio: 3.5, index: 1.2, dur: 0.4, vol: 0.06 }); v.done(); return 0.5;
};
X.notification = (S, t) => {
  const v = S.v(), P = S.p;
  [1046.5, 1318.5, 1568].forEach((f, i) => fm(v, t + i * 0.075, { f: f * P, ratio: 3.5, index: 1.5, dur: 0.55, vol: 0.13 }));
  v.done(); return 0.8;
};
X.alert = (S, t) => { // the "!" sting
  const v = S.v(), P = S.p;
  for (const f of [880, 1318.5, 1760]) tone(v, t, { type: 'sawtooth', f: f * 0.97 * P, f1: f * P, sweep: 0.03, dur: 0.32, vol: 0.09, lp: 5000 });
  noise(v, t, { type: 'highpass', f: 3000, dur: 0.05, vol: 0.25 }); tone(v, t, { f: 3520 * P, dur: 0.25, vol: 0.06 });
  const r = tone(v, t, { type: 'square', f: 440 * P, dur: 0.12, vol: 0.12, lp: 2500 }); S.wet(v, r.out, 0.4);
  v.done(); return 0.5;
};
X.heart = (S, t) => {
  const v = S.v(), P = S.p;
  thump(v, t, 95, 55, 0.12, 0.6); thump(v, t + 0.17, 85, 50, 0.14, 0.45);
  const a = fm(v, t + 0.34, { f: 1568 * P, ratio: 2, index: 0.8, dur: 0.45, vol: 0.12 }); fm(v, t + 0.42, { f: 2093 * P, ratio: 2, index: 0.8, dur: 0.5, vol: 0.1 });
  S.wet(v, a.out, 0.5); v.done(); return 0.95;
};
X.door = (S, t) => { // automatic sliding door, Osaka 2050
  const v = S.v(), P = S.p;
  noise(v, t, { f: 2200, q: 3, dur: 0.02, vol: 0.25 }); tone(v, t, { type: 'square', f: 1200 * P, dur: 0.01, vol: 0.06 });
  noise(v, t + 0.03, { kind: 'pink', f: 700, f1: 1500, q: 0.9, rise: 0.14, dur: 0.24, vol: 0.3, panTo: 0.5, pan0: -0.3 });
  thump(v, t + 0.38, 120, 70, 0.1, 0.35); tone(v, t + 0.42, { f: 1318.5 * P, dur: 0.3, vol: 0.05 });
  v.done(); return 0.75;
};
X.whoosh = (S, t) => { const v = S.v(), P = S.p; noise(v, t, { kind: 'pink', f: 450 * P, f1: 2400 * P, q: 1.4, rise: 0.15, dur: 0.22, vol: 0.5, sweep: 0.3, panTo: 0.6 }); v.done(); return 0.42; };
X.sneak_rustle = (S, t) => {
  const v = S.v(), P = S.p;
  grains(v, t, 7, 0.32, (ti) => noise(v, ti, { f: rr(2200, 4200) * P, q: 1.2, a: 0.01, dur: rr(0.03, 0.07), vol: rr(0.1, 0.22), pan: rr(-0.3, 0.3) }));
  noise(v, t, { kind: 'pink', f: 1800, q: 0.6, rise: 0.08, dur: 0.25, vol: 0.12 });
  v.done(); return 0.45;
};
X.beast_roar = (S, t) => {
  const v = S.v(), P = S.p, end = t + 1.4;
  const bus = v.gain(1), sh = v.shaper('fuzz'), f1 = v.filter('bandpass', 520, 2.5), f2 = v.filter('bandpass', 1250, 3), lp = v.filter('lowpass', 2600), out = v.gain(0);
  env2(out.gain, t, 0.5, 0.12, 1.15);
  for (const [w, d] of [['sawtooth', 0], ['sawtooth', 15], ['square', -12]]) {
    const o = v.osc(w, 90 * P, t, end, d); o.frequency.setValueAtTime(80 * P, t); o.frequency.linearRampToValueAtTime(135 * P, t + 0.35); o.frequency.exponentialRampToValueAtTime(70 * P, t + 1.3); o.connect(bus);
  }
  const am = v.osc('square', 31, t, end), ag = v.gain(0.45); v.chain(am, ag); ag.connect(bus.gain);
  const n = v.noise('white', t, end), ng = v.gain(0.3); v.chain(n, ng, bus);
  bus.connect(sh); sh.connect(f1); sh.connect(f2); f1.connect(lp); f2.connect(lp); v.chain(lp, out); out.connect(v.dest); S.wet(v, out, 0.45);
  v.done(); return 1.4;
};

// ---- footsteps (randomised so repeats never machine-gun) ------------------------
X.step_grass = (S, t) => {
  const v = S.v(), P = S.p * rr(0.9, 1.1);
  noise(v, t, { f: 2600 * P, q: 0.8, a: 0.008, dur: 0.07, vol: 0.3 }); noise(v, t + 0.02, { f: 4200 * P, q: 1.5, dur: 0.04, vol: 0.18 });
  thump(v, t, 140 * P, 90, 0.05, 0.12); v.done(); return 0.12;
};
X.step_stone = (S, t) => {
  const v = S.v(), P = S.p * rr(0.9, 1.12);
  noise(v, t, { f: 1900 * P, q: 2, dur: 0.03, vol: 0.32 }); tone(v, t, { type: 'triangle', f: 420 * P, f1: 260 * P, dur: 0.035, vol: 0.18 });
  noise(v, t + 0.012, { type: 'highpass', f: 5000, dur: 0.015, vol: 0.08 }); v.done(); return 0.07;
};
X.step_wood = (S, t) => {
  const v = S.v(), P = S.p * rr(0.92, 1.08);
  tone(v, t, { f: 190 * P, f1: 145 * P, dur: 0.08, vol: 0.4 }); tone(v, t, { type: 'triangle', f: 430 * P, dur: 0.04, vol: 0.14 });
  noise(v, t, { f: 950 * P, q: 2, dur: 0.035, vol: 0.2 }); v.done(); return 0.11;
};
X.step_asphalt = (S, t) => {
  const v = S.v(), P = S.p * rr(0.9, 1.1);
  noise(v, t, { type: 'highpass', f: 1400 * P, a: 0.004, dur: 0.05, vol: 0.2 }); noise(v, t, { type: 'lowpass', f: 800, dur: 0.04, vol: 0.3 });
  thump(v, t, 120, 80, 0.04, 0.12); v.done(); return 0.09;
};

// ---- combat -------------------------------------------------------------------
X.hit_light = (S, t) => {
  const v = S.v(), P = S.p * rr(0.95, 1.05);
  thump(v, t, 240 * P, 95 * P, 0.09, 0.55); noise(v, t, { f: 1800 * P, q: 1, dur: 0.06, vol: 0.4 }); noise(v, t, { type: 'highpass', f: 4000, dur: 0.012, vol: 0.2 });
  v.done(); return 0.15;
};
X.hit_heavy = (S, t) => {
  const v = S.v(), P = S.p * rr(0.96, 1.04);
  const a = thump(v, t, 170 * P, 42 * P, 0.28, 0.85); noise(v, t, { type: 'lowpass', f: 2600, dur: 0.16, vol: 0.55 });
  noise(v, t, { f: 1200 * P, q: 0.8, dur: 0.08, vol: 0.45, shape: 'crunch' }); noise(v, t, { type: 'highpass', f: 3500, dur: 0.02, vol: 0.25 });
  S.wet(v, a.out, 0.25); v.done(); return 0.42;
};
X.crit = (S, t) => {
  const v = S.v(), P = S.p;
  thump(v, t, 180 * P, 40 * P, 0.3, 0.8); noise(v, t, { type: 'lowpass', f: 3000, dur: 0.14, vol: 0.5, shape: 'crunch' });
  const s = fm(v, t + 0.01, { f: 2400 * P, ratio: 1.414, index: 3, dur: 0.6, vol: 0.14 }); tone(v, t + 0.01, { f: 3520 * P, dur: 0.5, vol: 0.06 });
  noise(v, t, { f: 3000, f1: 7000, q: 2, dur: 0.18, vol: 0.2 }); S.wet(v, s.out, 0.5);
  v.done(); return 0.75;
};
X.parry = (S, t) => {
  const v = S.v(), P = S.p * rr(0.97, 1.03);
  const c = fm(v, t, { f: 1250 * P, ratio: 2.76, index: 2.5, dur: 0.35, vol: 0.2 }); noise(v, t, { type: 'highpass', f: 3000, dur: 0.025, vol: 0.35 });
  thump(v, t, 300 * P, 150, 0.05, 0.3); S.wet(v, c.out, 0.35); v.done(); return 0.45;
};
X.perfect_parry = (S, t) => {
  const v = S.v(), P = S.p;
  const c = fm(v, t, { f: 1600 * P, ratio: 2.76, index: 3, dur: 0.6, vol: 0.2 }); noise(v, t, { type: 'highpass', f: 3500, dur: 0.03, vol: 0.4 });
  [1318.5, 1975.5, 2637].forEach((f, i) => { const r = tone(v, t + 0.03 + i * 0.03, { f: f * P, dur: 0.9, vol: 0.08 }); S.wet(v, r.out, 0.5); });
  tone(v, t, { f: 220, f1: 90, dur: 0.5, vol: 0.35, sweep: 0.4 }); fxShimmer(S.k, S.out, t + 0.05, 0.7, { vol: 0.12, base: 2637, count: 8 });
  S.wet(v, c.out, 0.4); v.done(); return 1.0;
};
X.dodge = (S, t) => { const v = S.v(), P = S.p * rr(0.95, 1.05); noise(v, t, { f: 1300 * P, f1: 3600 * P, q: 1.6, rise: 0.04, dur: 0.12, vol: 0.4, panTo: rr(-0.5, 0.5) }); v.done(); return 0.2; };
X.grab = (S, t) => { const v = S.v(), P = S.p; noise(v, t, { f: 1100 * P, q: 0.6, a: 0.006, dur: 0.08, vol: 0.4 }); thump(v, t, 170 * P, 100, 0.08, 0.4); noise(v, t + 0.03, { f: 2500, q: 1.5, dur: 0.05, vol: 0.12 }); v.done(); return 0.15; };
X.throw = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { kind: 'pink', f: 500 * P, f1: 2600 * P, q: 1.5, rise: 0.12, dur: 0.2, vol: 0.55, sweep: 0.25, panTo: 0.6 }); tone(v, t, { f: 210 * P, f1: 120 * P, dur: 0.25, vol: 0.2 });
  v.done(); return 0.38;
};
X.slam = (S, t) => {
  const v = S.v(), P = S.p;
  const a = thump(v, t, 130 * P, 34, 0.6, 0.9); noise(v, t, { kind: 'brown', type: 'lowpass', f: 450, dur: 0.5, vol: 0.9 });
  noise(v, t, { f: 900, q: 0.7, dur: 0.12, vol: 0.4, shape: 'crunch' });
  grains(v, t + 0.06, 9, 0.35, (ti) => noise(v, ti, { f: rr(1500, 4000), q: 2, dur: rr(0.01, 0.03), vol: rr(0.06, 0.16), pan: rr(-0.7, 0.7) }));
  S.wet(v, a.out, 0.5); v.done(); return 0.85;
};
X.charge = (S, t) => { // ~1.5 s rising charge
  const v = S.v(), P = S.p, dur = 1.5, end = t + dur + 0.05;
  const lp = v.filter('lowpass', 300, 6), trem = v.gain(0.6), g = v.gain(0);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + dur * 0.95); g.gain.linearRampToValueAtTime(0.0001, end);
  lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(5000, t + dur);
  for (const d of [-10, 10]) { const o = v.osc('sawtooth', 110 * P, t, end, d); o.frequency.exponentialRampToValueAtTime(520 * P, t + dur); o.connect(lp); }
  const lfo = v.osc('sine', 6, t, end), lg = v.gain(0.4); lfo.frequency.exponentialRampToValueAtTime(28, t + dur); v.chain(lfo, lg); lg.connect(trem.gain);
  v.chain(lp, trem, g); g.connect(v.dest);
  noise(v, t, { f: 600, f1: 7000, q: 3, rise: dur * 0.95, dur: 0.05, vol: 0.15, sweep: dur });
  v.done(); return 1.6;
};
X.charge_release = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { kind: 'pink', type: 'highpass', f: 400, f1: 3000, dur: 0.4, vol: 0.5 }); thump(v, t, 160 * P, 40, 0.4, 0.75);
  tone(v, t, { type: 'sawtooth', f: 1400 * P, f1: 180 * P, dur: 0.22, vol: 0.15, lp: 5000 });
  fxShimmer(S.k, S.out, t, 0.4, { vol: 0.1, count: 6 }); v.done(); return 0.7;
};
X.switch = (S, t) => {
  const v = S.v(), P = S.p;
  tone(v, t, { f: 380 * P, f1: 1250 * P, dur: 0.12, vol: 0.3, sweep: 0.1 }); tone(v, t + 0.11, { type: 'triangle', f: 1250 * P, f1: 640 * P, dur: 0.13, vol: 0.25, sweep: 0.1 });
  noise(v, t, { f: 3000, q: 1, rise: 0.08, dur: 0.15, vol: 0.12 }); v.done(); return 0.35;
};
X.ko = (S, t) => {
  const v = S.v(), P = S.p;
  tone(v, t, { type: 'square', f: 880 * P, f1: 110 * P, dur: 0.6, vol: 0.14, sweep: 0.55, lp: 3000 }); tone(v, t, { type: 'triangle', f: 1320 * P, f1: 165 * P, dur: 0.6, vol: 0.12, sweep: 0.55 });
  const a = thump(v, t + 0.5, 100, 36, 0.45, 0.85); noise(v, t + 0.5, { type: 'lowpass', f: 1200, dur: 0.25, vol: 0.45 });
  S.wet(v, a.out, 0.4); v.done(); return 1.05;
};

// ---- capture / QTE / combos ---------------------------------------------------------
X.capture_throw = (S, t) => {
  const v = S.v(), P = S.p, end = t + 0.55;
  noise(v, t, { kind: 'pink', f: 700, f1: 2200, q: 1.3, rise: 0.1, dur: 0.3, vol: 0.4, panTo: 0.5 });
  const o = v.osc('sine', 1500 * P, t, end), lfo = v.osc('square', 17, t, end), lg = v.gain(180 * P), g = v.gain(0);
  o.frequency.exponentialRampToValueAtTime(900 * P, t + 0.5); v.chain(lfo, lg); lg.connect(o.frequency);
  env2(g.gain, t, 0.07, 0.05, 0.45); v.chain(o, g); g.connect(v.dest); v.done(); return 0.55;
};
X.capture_shake = (S, t) => {
  const v = S.v(), P = S.p;
  for (const [d, f] of [[0, 640], [0.13, 520]]) { noise(v, t + d, { f: 3200, q: 2, dur: 0.02, vol: 0.3 }); tone(v, t + d, { type: 'triangle', f: f * P, dur: 0.07, vol: 0.25 }); thump(v, t + d, 180, 110, 0.05, 0.2); }
  v.done(); return 0.3;
};
X.capture_success = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { f: 4200, q: 2, dur: 0.02, vol: 0.4 }); tone(v, t, { type: 'square', f: 2400 * P, dur: 0.03, vol: 0.08 }); thump(v, t, 220, 120, 0.06, 0.3);
  [1046.5, 1318.5, 1568, 2093].forEach((f, i) => { const r = fm(v, t + 0.14 + i * 0.065, { f: f * P, ratio: 2, index: 1, dur: 0.45, vol: 0.13 }); S.wet(v, r.out, 0.3); });
  fxShimmer(S.k, S.out, t + 0.35, 0.6, { vol: 0.1, base: 2093, count: 7 }); v.done(); return 1.05;
};
X.capture_fail = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { f: 1500, q: 0.8, dur: 0.06, vol: 0.4 }); tone(v, t, { f: 300 * P, f1: 850 * P, dur: 0.07, vol: 0.3, sweep: 0.05 });
  const r = tone(v, t + 0.12, { type: 'triangle', f: 420 * P, f1: 190 * P, dur: 0.45, vol: 0.28, sweep: 0.45 });
  const lfo = v.osc('sine', 9, t + 0.12, t + 0.6), lg = v.gain(12); v.chain(lfo, lg); lg.connect(r.s.frequency);
  v.done(); return 0.65;
};
X.qte_perfect = (S, t) => {
  const v = S.v(), P = S.p;
  const a = fm(v, t, { f: 1568 * P, ratio: 3.5, index: 1.4, dur: 0.45, vol: 0.18 }); fm(v, t + 0.04, { f: 2093 * P, ratio: 3.5, index: 1.2, dur: 0.5, vol: 0.14 });
  noise(v, t, { type: 'highpass', f: 7000, dur: 0.12, vol: 0.12 }); S.wet(v, a.out, 0.3); v.done(); return 0.55;
};
X.qte_good = (S, t) => { const v = S.v(), P = S.p; tone(v, t, { type: 'triangle', f: 1174.7 * P, dur: 0.12, vol: 0.25 }); tone(v, t + 0.05, { f: 1568 * P, dur: 0.2, vol: 0.16 }); v.done(); return 0.3; };
X.qte_miss = (S, t) => { const v = S.v(), P = S.p; tone(v, t, { type: 'square', f: 140 * P, f1: 110 * P, dur: 0.2, vol: 0.2, lp: 700 }); thump(v, t, 160, 70, 0.1, 0.35); v.done(); return 0.3; };
X.combo = (S, t) => { // call with rising pitch per combo step
  const v = S.v(), P = S.p;
  tone(v, t, { type: 'square', f: 660 * P, f1: 990 * P, dur: 0.09, vol: 0.13, sweep: 0.05, lp: 4500 }); tone(v, t, { type: 'triangle', f: 1320 * P, f1: 1980 * P, dur: 0.1, vol: 0.12, sweep: 0.05 });
  v.done(); return 0.15;
};
X.team_combo = (S, t) => {
  const v = S.v(), P = S.p, end = t + 0.9;
  const lp = v.filter('lowpass', 500, 3), g = v.gain(0); lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(6000, t + 0.08); lp.frequency.exponentialRampToValueAtTime(900, t + 0.8);
  v.perc(g.gain, t, 0.3, 0.005, 0.8);
  for (const m of [48, 55, 60, 64, 67, 72]) for (const d of [-8, 8]) v.osc('sawtooth', mtof(m) * P, t, end, d).connect(lp);
  v.chain(lp, g); g.connect(v.dest); S.wet(v, g, 0.4);
  noise(v, t, { kind: 'pink', f: 500, f1: 3500, q: 1, rise: 0.06, dur: 0.3, vol: 0.3 }); thump(v, t, 150, 40, 0.45, 0.6);
  v.done(); return 0.95;
};
X.ult_start = (S, t) => { // big riser into an impact
  const v = S.v(), P = S.p, dur = 1.6;
  fxRiser(S.k, S.out, t, dur, { vol: 0.32, f0: 200, f1: 9000, p0: 55 * P, p1: 660 * P });
  const g = tone(v, t, { type: 'sawtooth', f: 55 * P, f1: 110 * P, dur: dur, vol: 0.2, rise: dur * 0.9, lp: 900 });
  fxBoom(S.k, S.out, t + dur, { vol: 0.75, dur: 1.2, f0: 110, f1: 30 }); fxShimmer(S.k, S.out, t + dur, 0.8, { vol: 0.14, count: 9 });
  noise(v, t + dur, { type: 'highpass', f: 2500, dur: 0.5, vol: 0.35 }); S.wet(v, g.out, 0.3);
  v.done(); return 2.8;
};

// ---- elements -------------------------------------------------------------------------
const crackle = (v, t, span, n, vol, f = 3000) => grains(v, t, n, span, (ti) => noise(v, ti, { type: 'highpass', f: f * rr(0.7, 1.4), dur: rr(0.004, 0.012), vol: vol * rr(0.4, 1), pan: rr(-0.6, 0.6) }));
const bloops = (v, t, span, n, f0, f1, vol) => grains(v, t, n, span, (ti) => tone(v, ti, { f: f0 * rr(0.8, 1.25), f1: f1 * rr(0.8, 1.25), dur: rr(0.03, 0.06), vol: vol * rr(0.5, 1), sweep: 0.03, pan: rr(-0.5, 0.5) }));

X.pyro = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { kind: 'pink', f: 350 * P, f1: 1700 * P, q: 0.9, rise: 0.15, dur: 0.5, vol: 0.55 }); noise(v, t, { kind: 'brown', type: 'lowpass', f: 260, rise: 0.08, dur: 0.6, vol: 0.5 });
  crackle(v, t + 0.05, 0.6, 16, 0.25); v.done(); return 0.8;
};
X.pyro_boom = (S, t) => {
  const v = S.v(), P = S.p;
  fxBoom(S.k, S.out, t, { vol: 0.85, dur: 1.2, f0: 100 * P, f1: 30 }); noise(v, t, { type: 'lowpass', f: 3500, f1: 300, dur: 0.7, vol: 0.6 });
  crackle(v, t + 0.05, 0.9, 22, 0.22); const r = noise(v, t, { kind: 'pink', f: 800, q: 0.6, dur: 0.4, vol: 0.4, shape: 'crunch' }); S.wet(v, r.out, 0.4);
  v.done(); return 1.4;
};
X.hydro = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { kind: 'pink', f: 700 * P, f1: 2200 * P, q: 1.4, rise: 0.12, dur: 0.35, vol: 0.45, panTo: 0.4 });
  bloops(v, t + 0.05, 0.4, 6, 320 * P, 950 * P, 0.22); v.done(); return 0.6;
};
X.hydro_splash = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { f: 1400 * P, q: 0.6, dur: 0.35, vol: 0.6 }); noise(v, t, { type: 'highpass', f: 4000, dur: 0.25, vol: 0.25 }); thump(v, t, 140, 60, 0.12, 0.35);
  grains(v, t + 0.06, 9, 0.6, (ti) => tone(v, ti, { f: rr(1400, 3200) * P, f1: rr(2400, 4800) * P, dur: 0.035, vol: rr(0.05, 0.12), sweep: 0.03, pan: rr(-0.7, 0.7) }));
  v.done(); return 0.85;
};
X.bio = (S, t) => {
  const v = S.v(), P = S.p;
  fm(v, t, { f: 330 * P, f1: 660 * P, sweep: 0.15, ratio: 1, index: 2.5, dur: 0.4, vol: 0.25 }); noise(v, t + 0.02, { f: 3200, q: 1, rise: 0.05, dur: 0.18, vol: 0.18 });
  tone(v, t + 0.1, { f: 990 * P, dur: 0.25, vol: 0.08 }); thump(v, t, 210, 140, 0.06, 0.2); v.done(); return 0.6;
};
X.bio_heal = (S, t) => {
  const v = S.v(), P = S.p;
  [523.25, 587.33, 659.25, 783.99, 880, 1046.5].forEach((f, i) => { const r = fm(v, t + i * 0.07, { f: f * P, ratio: 2, index: 0.9, dur: 0.6, vol: 0.12 }); S.wet(v, r.out, 0.45); });
  fxShimmer(S.k, S.out, t + 0.2, 0.8, { vol: 0.1, base: 2093, count: 8 }); noise(v, t, { f: 5000, q: 0.8, rise: 0.3, dur: 0.5, vol: 0.06 });
  v.done(); return 1.2;
};
X.bio_poison = (S, t) => {
  const v = S.v(), P = S.p, end = t + 0.9;
  bloops(v, t, 0.7, 8, 190 * P, 330 * P, 0.25);
  const lp = v.filter('lowpass', 900, 2), g = v.gain(0); env2(g.gain, t, 0.15, 0.08, 0.75);
  for (const f of [180, 190.5]) { const o = v.osc('square', f * P, t, end); o.frequency.exponentialRampToValueAtTime(f * 0.7 * P, t + 0.85); o.connect(lp); }
  const lfo = v.osc('sine', 7, t, end), lg = v.gain(380); v.chain(lfo, lg); lg.connect(lp.frequency);
  v.chain(lp, g); g.connect(v.dest); v.done(); return 0.9;
};
X.sleep = (S, t) => {
  const v = S.v(), P = S.p;
  [1318.5, 1046.5, 880, 698.5].forEach((f, i) => { const r = fm(v, t + i * 0.16, { f: f * P, ratio: 2, index: 0.6, dur: 0.7, vol: 0.11 }); S.wet(v, r.out, 0.6); });
  const n = noise(v, t + 0.3, { f: 900, q: 2, rise: 0.25, dur: 0.8, vol: 0.12 });
  const lfo = v.osc('sine', 3.2, t + 0.3, t + 1.4), lg = v.gain(0.5); v.chain(lfo, lg); lg.connect(n.g.gain);
  v.done(); return 1.4;
};
X.geo = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { kind: 'brown', type: 'lowpass', f: 180, rise: 0.05, dur: 0.5, vol: 0.9 }); thump(v, t, 105 * P, 55, 0.3, 0.6);
  grains(v, t, 12, 0.35, (ti) => noise(v, ti, { type: 'lowpass', f: rr(900, 2200), q: 2, dur: rr(0.01, 0.03), vol: rr(0.1, 0.25), pan: rr(-0.5, 0.5) }));
  v.done(); return 0.7;
};
X.geo_wall = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { kind: 'brown', type: 'lowpass', f: 100, f1: 700, q: 2, rise: 0.75, dur: 0.15, vol: 0.8, sweep: 0.8 });
  grains(v, t + 0.2, 14, 0.6, (ti) => noise(v, ti, { type: 'lowpass', f: rr(1000, 2500), q: 2, dur: 0.02, vol: rr(0.08, 0.2), pan: rr(-0.6, 0.6) }));
  const a = thump(v, t + 0.8, 120 * P, 40, 0.4, 0.8); noise(v, t + 0.8, { type: 'lowpass', f: 2000, dur: 0.2, vol: 0.5, shape: 'crunch' });
  S.wet(v, a.out, 0.35); v.done(); return 1.25;
};
X.echo = (S, t) => { // sonic pulse with ping-pong echoes
  const v = S.v(), P = S.p, dl = v.delay(0.11), fb = v.gain(0.5), lp = v.filter('lowpass', 3000), pn = v.pan(0.4);
  const r = fm(v, t, { f: 880 * P, ratio: 1.5, index: 1.8, dur: 0.18, vol: 0.25 }); r.out.connect(dl); v.chain(dl, lp, fb, dl); lp.connect(pn); pn.connect(v.dest);
  tone(v, t, { f: 1760 * P, f1: 1320 * P, dur: 0.1, vol: 0.08 }); v.hold(t, t + 0.9); v.done(); return 0.95;
};
X.echo_boom = (S, t) => {
  const v = S.v(), P = S.p, end = t + 1.3;
  const s = v.osc('sine', 120 * P, t, end), am = v.osc('sine', 37, t, end), rm = v.gain(0.35), g = v.gain(0);
  s.frequency.exponentialRampToValueAtTime(45, t + 1); am.connect(rm.gain); v.perc(g.gain, t, 0.55, 0.005, 1.1); v.chain(s, rm, g); g.connect(v.dest);
  noise(v, t, { kind: 'pink', type: 'lowpass', f: 2500, f1: 200, dur: 0.6, vol: 0.5 });
  const dl = v.delay(0.16), fb = v.gain(0.45), lp = v.filter('lowpass', 1800); g.connect(dl); v.chain(dl, lp, fb, dl); lp.connect(v.dest);
  v.hold(t, t + 1.4); v.done(); return 1.45;
};
X.volto = (S, t) => {
  const v = S.v(), P = S.p, end = t + 0.5;
  const o = v.osc('square', 120 * P, t, end), mod = v.osc('sawtooth', 47, t, end), mg = v.gain(420 * P), lp = v.filter('lowpass', 4000), g = v.gain(0);
  v.chain(mod, mg); mg.connect(o.frequency); v.perc(g.gain, t, 0.16, 0.003, 0.45); v.chain(o, lp, g); g.connect(v.dest);
  crackle(v, t, 0.4, 18, 0.25, 4000); tone(v, t, { f: 3000 * P, f1: 3700 * P, dur: 0.35, vol: 0.05 });
  noise(v, t, { f: 5000, q: 1, dur: 0.05, vol: 0.3 }); v.done(); return 0.55;
};
X.cryo = (S, t) => {
  const v = S.v(), P = S.p;
  for (let i = 0; i < 7; i++) { const r = fm(v, t + i * 0.05 + rand() * 0.03, { f: rr(2200, 5200) * P, ratio: 2.76, index: 1.2, dur: rr(0.25, 0.5), vol: 0.06, pan: rr(-0.6, 0.6) }); S.wet(v, r.out, 0.35); }
  noise(v, t, { type: 'highpass', f: 3500, dur: 0.06, vol: 0.4 }); noise(v, t, { f: 6000, f1: 3000, q: 1.2, rise: 0.05, dur: 0.5, vol: 0.18 });
  v.done(); return 0.8;
};
X.aero = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { kind: 'pink', f: 500 * P, f1: 1700 * P, q: 2, rise: 0.25, dur: 0.4, vol: 0.55, sweep: 0.5, panTo: 0.7 });
  const w = tone(v, t + 0.1, { f: 1200 * P, f1: 1800 * P, dur: 0.4, vol: 0.05, rise: 0.15 });
  const lfo = v.osc('sine', 6, t + 0.1, t + 0.7), lg = v.gain(30); v.chain(lfo, lg); lg.connect(w.s.frequency);
  v.done(); return 0.7;
};
X.ecto = (S, t) => {
  const v = S.v(), P = S.p, end = t + 1.1, g = v.gain(0);
  env2(g.gain, t, 0.18, 0.35, 0.7);
  for (const d of [0, 18]) {
    const o = v.osc('sine', 500 * P, t, end, d); o.frequency.linearRampToValueAtTime(760 * P, t + 0.4); o.frequency.exponentialRampToValueAtTime(420 * P, t + 1.05);
    const lfo = v.osc('sine', 6.5, t, end), lg = v.gain(30); v.chain(lfo, lg); lg.connect(o.frequency); o.connect(g);
  }
  g.connect(v.dest); S.wet(v, g, 0.8); noise(v, t, { f: 1200, q: 4, rise: 0.4, dur: 0.6, vol: 0.06 });
  v.done(); return 1.15;
};
X.ferro = (S, t) => {
  const v = S.v(), P = S.p;
  const c = fm(v, t, { f: 520 * P, ratio: 1.414, index: 4, index1: 0.3, dur: 0.6, vol: 0.2 }); tone(v, t, { f: 2200 * P, dur: 0.5, vol: 0.05 });
  noise(v, t + 0.02, { f: 5000, f1: 9000, q: 3, dur: 0.3, vol: 0.18 }); thump(v, t, 200, 120, 0.06, 0.25); S.wet(v, c.out, 0.35);
  v.done(); return 0.8;
};
X.astro = (S, t) => {
  const v = S.v(), P = S.p, end = t + 0.9;
  const lp = v.filter('lowpass', 200, 12), g = v.gain(0); lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(3500, t + 0.35); lp.frequency.exponentialRampToValueAtTime(400, t + 0.85);
  env2(g.gain, t, 0.14, 0.05, 0.8); for (const d of [-12, 12]) v.osc('sawtooth', 220 * P, t, end, d).connect(lp); v.chain(lp, g); g.connect(v.dest);
  tone(v, t, { f: 3200 * P, f1: 300 * P, dur: 0.28, vol: 0.09, sweep: 0.25 }); fxShimmer(S.k, S.out, t + 0.05, 0.7, { vol: 0.12, base: 1760 * P, count: 9 });
  S.wet(v, g, 0.5); v.done(); return 1.0;
};
X.nucleo = (S, t) => {
  const v = S.v(), P = S.p, end = t + 1.2;
  tone(v, t, { type: 'sawtooth', f: 55 * P, dur: 0.9, vol: 0.25, rise: 0.2, lp: 220 });
  const w = v.osc('square', 300 * P, t, end), cr = v.shaper('crush', 'none'), wg = v.gain(0), lp = v.filter('lowpass', 3000);
  w.frequency.exponentialRampToValueAtTime(2400 * P, t + 0.6); env2(wg.gain, t, 0.07, 0.5, 0.15); v.chain(w, cr, lp, wg); wg.connect(v.dest);
  fxBoom(S.k, S.out, t + 0.6, { vol: 0.6, dur: 0.6, f0: 140, f1: 40 }); noise(v, t + 0.6, { type: 'highpass', f: 2000, dur: 0.3, vol: 0.3, shape: 'crush' });
  v.done(); return 1.25;
};
X.steam_explosion = (S, t) => { // pyro + hydro reaction: huge boom + long hiss
  const v = S.v(), P = S.p;
  fxBoom(S.k, S.out, t, { vol: 0.95, dur: 1.8, f0: 95 * P, f1: 24, lp: 1200 });
  noise(v, t, { type: 'lowpass', f: 4000, f1: 400, dur: 0.6, vol: 0.6, shape: 'crunch' });
  const h = noise(v, t + 0.05, { type: 'highpass', f: 2500, f1: 5000, rise: 0.08, dur: 1.9, vol: 0.38, sweep: 1.5 }); S.wet(v, h.out, 0.3);
  crackle(v, t + 0.05, 1, 20, 0.2); bloops(v, t + 0.2, 0.8, 6, 300, 900, 0.12);
  v.done(); return 2.2;
};
X.reaction = (S, t) => {
  const v = S.v(), P = S.p, end = t + 0.7, lp = v.filter('lowpass', 600, 4), g = v.gain(0);
  lp.frequency.setValueAtTime(600, t); lp.frequency.exponentialRampToValueAtTime(5000, t + 0.05); lp.frequency.exponentialRampToValueAtTime(800, t + 0.6);
  v.perc(g.gain, t, 0.2, 0.004, 0.6); for (const m of [57, 64, 69, 76]) v.osc('sawtooth', mtof(m) * P, t, end, rr(-8, 8)).connect(lp);
  v.chain(lp, g); g.connect(v.dest); thump(v, t, 140, 50, 0.25, 0.5); fxShimmer(S.k, S.out, t, 0.5, { vol: 0.1, count: 6 });
  v.done(); return 0.75;
};

// ---- destruction -----------------------------------------------------------------------
X.destroy_wood = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { f: 1500 * P, q: 1.5, dur: 0.05, vol: 0.6 }); tone(v, t, { type: 'square', f: 900 * P, dur: 0.01, vol: 0.1 });
  grains(v, t + 0.03, 10, 0.3, (ti) => noise(v, ti, { f: rr(1800, 4200), q: 2.5, dur: rr(0.01, 0.04), vol: rr(0.1, 0.25), pan: rr(-0.6, 0.6) }));
  thump(v, t + 0.05, 150 * P, 70, 0.2, 0.55); grains(v, t + 0.2, 4, 0.35, (ti) => tone(v, ti, { f: rr(200, 320), f1: 120, dur: 0.08, vol: 0.15 }));
  v.done(); return 0.75;
};
X.destroy_glass = (S, t) => {
  const v = S.v(), P = S.p;
  noise(v, t, { type: 'highpass', f: 3500, dur: 0.5, vol: 0.4 }); noise(v, t, { f: 2500, q: 0.8, dur: 0.06, vol: 0.4 });
  grains(v, t, 20, 0.55, (ti) => tone(v, ti, { f: rr(2800, 8000) * P, dur: rr(0.04, 0.16), vol: rr(0.04, 0.1), pan: rr(-0.8, 0.8) }));
  v.done(); return 0.9;
};
X.destroy_metal = (S, t) => {
  const v = S.v(), P = S.p;
  const c = fm(v, t, { f: 310 * P, ratio: 1.53, index: 5, index1: 0.4, dur: 0.8, vol: 0.22 }); fm(v, t, { f: 870 * P, ratio: 2.41, index: 3, dur: 0.5, vol: 0.1 });
  noise(v, t, { type: 'lowpass', f: 2200, dur: 0.15, vol: 0.5, shape: 'crunch' }); thump(v, t, 160, 60, 0.25, 0.6);
  const sc = noise(v, t + 0.1, { f: 3200, q: 4, rise: 0.05, dur: 0.5, vol: 0.12 }); const lfo = v.osc('sine', 23, t + 0.1, t + 0.7), lg = v.gain(800); v.chain(lfo, lg); lg.connect(sc.fl.frequency);
  S.wet(v, c.out, 0.35); v.done(); return 1.0;
};

// ---- crowd -------------------------------------------------------------------------------
X.crowd_cheer = (S, t) => {
  const v = S.v(), P = S.p, dur = 2.2, end = t + dur + 0.1, sum = v.gain(0);
  env2(sum.gain, t, 0.5, 0.35, 1.8);
  for (const [f, q, gg] of [[520, 1.5, 1], [1150, 2, 0.7], [2500, 2.5, 0.35]]) {
    const n = v.noise('pink', t, end), bp = v.filter('bandpass', f * P, q), g = v.gain(gg); v.chain(n, bp, g, sum);
  }
  const lfo = v.osc('sine', 4.3, t, end), lg = v.gain(0.12); v.chain(lfo, lg); lg.connect(sum.gain);
  sum.connect(v.dest); S.wet(v, sum, 0.4);
  grains(v, t + 0.15, 5, 1.2, (ti) => { const w = tone(v, ti, { f: rr(1800, 2800), f1: rr(2400, 3400), dur: rr(0.25, 0.5), vol: 0.025, rise: 0.08, pan: rr(-0.8, 0.8) }); S.wet(v, w.out, 0.4); });
  grains(v, t + 0.1, 26, 1.5, (ti) => noise(v, ti, { f: rr(900, 1500), q: 1.2, dur: 0.03, vol: rr(0.04, 0.09), pan: rr(-0.9, 0.9) }));
  v.done(); return 2.3;
};
X.crowd_gasp = (S, t) => {
  const v = S.v(), P = S.p, end = t + 0.95, sum = v.gain(0);
  sum.gain.setValueAtTime(0.0001, t); sum.gain.exponentialRampToValueAtTime(0.55, t + 0.1); sum.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  for (const [f, q, gg] of [[480, 3, 1], [860, 4, 0.6]]) { const n = v.noise('pink', t, end), bp = v.filter('bandpass', f * P, q), g = v.gain(gg); v.chain(n, bp, g, sum); }
  const vf = v.filter('bandpass', 600, 2), vg = v.gain(0.1); vf.connect(vg); vg.connect(sum);
  for (let i = 0; i < 6; i++) { const o = v.osc('sawtooth', rr(170, 260) * P, t, end); o.frequency.exponentialRampToValueAtTime(rr(120, 160) * P, t + 0.85); o.connect(vf); }
  sum.connect(v.dest); S.wet(v, sum, 0.4); v.done(); return 0.95;
};
X.evolve_burst = (S, t) => {
  const v = S.v(), P = S.p, end = t + 1.3, lp = v.filter('lowpass', 800, 2), g = v.gain(0);
  lp.frequency.setValueAtTime(800, t); lp.frequency.exponentialRampToValueAtTime(7000, t + 0.06); lp.frequency.exponentialRampToValueAtTime(1500, t + 1.2);
  v.perc(g.gain, t, 0.22, 0.004, 1.2); for (const m of [60, 67, 72, 76, 79, 84]) for (const d of [-7, 7]) v.osc('sawtooth', mtof(m) * P, t, end, d).connect(lp);
  v.chain(lp, g); g.connect(v.dest); S.wet(v, g, 0.6);
  fxBoom(S.k, S.out, t, { vol: 0.6, dur: 1, f0: 120, f1: 35 }); fxShimmer(S.k, S.out, t, 1.2, { vol: 0.16, base: 2093, count: 14 });
  noise(v, t, { type: 'highpass', f: 3000, dur: 0.6, vol: 0.3 }); v.done(); return 1.4;
};

X.reward = (S, t) => { // short item-get chime (the game also has the longer 'reward' stinger)
  const v = S.v(), P = S.p;
  [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => { const r = fm(v, t + i * 0.055, { f: f * P, ratio: 3.5, index: 1.1, dur: i === 3 ? 0.6 : 0.25, vol: 0.13 }); S.wet(v, r.out, 0.35); });
  tone(v, t, { type: 'triangle', f: 392 * P, dur: 0.35, vol: 0.12 }); fxShimmer(S.k, S.out, t + 0.16, 0.5, { vol: 0.08, base: 3136, count: 6 });
  v.done(); return 0.8;
};

// Loudness trims (tuned with the offline self-check) and music ducking for big hits.
const LEVEL = {
  ui_tap: 1.21, ui_confirm: 0.94, ui_back: 1.08, ui_open: 1.05, ui_error: 1.02, coin: 1.29, notification: 1.19, alert: 1.86,
  heart: 0.74, door: 1.17, whoosh: 8.83, sneak_rustle: 3.24, beast_roar: 1.95, step_grass: 1.24, step_stone: 1.64, step_wood: 0.5,
  step_asphalt: 1.22, hit_light: 1.24, hit_heavy: 0.73, crit: 0.75, parry: 1.38, perfect_parry: 1.28, dodge: 7.49, grab: 1.4,
  throw: 1.72, slam: 0.78, charge: 1.06, charge_release: 1.02, switch: 1.26, ko: 0.87, capture_throw: 3.35, capture_shake: 1.93,
  capture_success: 1.97, capture_fail: 1.48, qte_perfect: 1.16, qte_good: 1.46, qte_miss: 0.67, combo: 1.73, team_combo: 0.27, ult_start: 0.72,
  pyro: 2.63, pyro_boom: 0.69, hydro: 3.68, hydro_splash: 1.42, bio: 1.22, bio_heal: 2.15, bio_poison: 0.96, sleep: 1.91,
  geo: 0.85, geo_wall: 0.71, echo: 1.77, echo_boom: 1.21, volto: 1.73, cryo: 2.45, aero: 5.1, ecto: 1.11,
  ferro: 1.51, astro: 1.38, nucleo: 0.98, steam_explosion: 0.53, reaction: 0.84, destroy_wood: 1.28, destroy_glass: 1.63, destroy_metal: 0.89,
  crowd_cheer: 4.03, crowd_gasp: 3.63, evolve_burst: 0.41,
  reward: 1.97,
};
const DUCK = { ult_start: [0.5, 2.4], steam_explosion: [0.55, 1.6], evolve_burst: [0.55, 1.2], team_combo: [0.7, 0.8], pyro_boom: [0.75, 0.8], crowd_cheer: [0.8, 1.6] };

// =============================================================================
// Dialogue babble (Animal-Crossing / Undertale style). Each letter → a short
// formant-filtered blip whose pitch & vowel colour derive from the letter, so
// lines "sound like speech" and every character profile is recognisable.
// =============================================================================
export const VOICES = {
  coach: { pitch: 0.55, timbre: 'saw', speed: 0.85, gruff: 0.85, level: 0.76 },        // gruff low coach
  friend: { pitch: 1.6, timbre: 'triangle', speed: 1.25, gruff: 0, level: 1.1 },      // bubbly high friend
  rival: { pitch: 0.95, timbre: 'fm', speed: 1.0, gruff: 0.12, level: 0.94 },          // cool mid rival
  punk: { pitch: 1.12, timbre: 'square', speed: 1.15, gruff: 0.4, nasal: 1, level: 1.38 }, // nasal Team Metallica punk
  kid: { pitch: 2.0, timbre: 'sine', speed: 1.35, gruff: 0, level: 1.3 },             // tiny kid
  elder: { pitch: 0.72, timbre: 'sine', speed: 0.75, gruff: 0.3, level: 0.95 },
  professor: { pitch: 0.85, timbre: 'triangle', speed: 0.95, gruff: 0.05, level: 1.23 },
  robot: { pitch: 1.0, timbre: 'fm', speed: 1.1, gruff: 0, robot: 1, level: 0.97 },
};
const VOWEL_F = { a: [800, 1200], e: [550, 1900], i: [330, 2300], o: [520, 900], u: [350, 800] };
const VOWEL_OF = { b: 'a', c: 'e', d: 'i', f: 'e', g: 'i', h: 'a', j: 'e', k: 'a', l: 'e', m: 'u', n: 'e', p: 'i', q: 'u', r: 'a', s: 'e', t: 'i', v: 'i', w: 'u', x: 'e', y: 'a', z: 'e' };
const SEMI = [0, 2, 4, 7, 9, 5, -3, 2, 0, -2, 4, 7];
const TIMBRE_GAIN = { sine: 1, triangle: 1.4, square: 0.7, saw: 0.85, fm: 0.8 };
const FRIC = 'cfhjsxz', PLOS = 'bdgkpqt';
const _vcache = new Map();
function resolveVoice(profile) {
  if (profile && profile.__r) return profile;
  const p = (typeof profile === 'string' ? VOICES[profile] : profile) || VOICES.rival;
  const r = { pitch: clamp(+p.pitch || 1, 0.3, 3), timbre: p.timbre || 'square', speed: clamp(+p.speed || 1, 0.3, 3), gruff: clamp(+p.gruff || 0, 0, 1), nasal: clamp(+p.nasal || 0, 0, 1), robot: p.robot ? 1 : 0, level: clamp(p.level ?? 1, 0, 3) };
  const key = `${r.pitch}|${r.timbre}|${r.speed}|${r.gruff}|${r.nasal}|${r.robot}|${r.level}`, hit = _vcache.get(key);
  if (hit) return hit;
  r._key = key; r.__r = true;
  if (_vcache.size > 64) _vcache.clear();
  _vcache.set(key, r); return r;
}
function babble(eng, p, c, t) {
  const k = eng.k, low = c.toLowerCase(), code = c.codePointAt(0);
  const isV = 'aeiou'.includes(low), vow = isV ? low : (VOWEL_OF[low] || 'aeiou'[code % 5]);
  const semi = SEMI[code % SEMI.length] * 0.7 + (c !== low ? 2 : 0);
  const f = 205 * p.pitch * Math.pow(2, semi / 12) * (p.robot ? 1 : rr(0.985, 1.015));
  const dur = (isV ? 0.072 : 0.056) / p.speed, end = t + dur + 0.04;
  // loudness compensation: formants favour high voices; timbres differ in energy
  const lvl = 0.22 * p.level * Math.pow(p.pitch, -1.2) * (TIMBRE_GAIN[p.timbre] ?? 1) * (p.nasal ? 1 - 0.25 * p.nasal : 1);
  const v = k.v(eng.voiceBus), out = v.gain(0);
  out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(lvl, t + 0.006); out.gain.setValueAtTime(lvl, t + dur * 0.7); out.gain.linearRampToValueAtTime(0, t + dur);
  const src = v.gain(1);
  const type = { saw: 'sawtooth', square: 'square', triangle: 'triangle', sine: 'sine', fm: 'sine' }[p.timbre] || 'square';
  const o = v.osc(type, f * 1.05, t, end); o.frequency.exponentialRampToValueAtTime(f * (p.robot ? 1 : 0.94), t + dur);
  if (p.timbre === 'fm') { const m = v.osc('sine', f * 2, t, end), mg = v.gain(f * (p.robot ? 2.5 : 1.3)); v.chain(m, mg); mg.connect(o.frequency); }
  o.connect(src);
  if (p.gruff > 0) { // rasp: sub-octave saw + 30-40 Hz amplitude flutter + noise
    const sub = v.osc('sawtooth', f / 2, t, end), sg = v.gain(p.gruff * 0.5); v.chain(sub, sg, src);
    const fl = v.osc('square', 34, t, end), flg = v.gain(p.gruff * 0.45); v.chain(fl, flg); flg.connect(src.gain);
    const n = v.noise('white', t, end), ng = v.gain(p.gruff * 0.18), nb = v.filter('bandpass', 1400, 0.8); v.chain(n, nb, ng, src);
  }
  const sc = 1 + (p.pitch - 1) * 0.25 - p.gruff * 0.12, [F1, F2] = VOWEL_F[vow];
  const b1 = v.filter('bandpass', F1 * sc, 4), b2 = v.filter('bandpass', F2 * sc, 6), g1 = v.gain(2.2), g2 = v.gain(1.4), dry = v.gain(p.timbre === 'sine' ? 0.6 : 0.28), sum = v.gain(1);
  v.chain(src, b1, g1, sum); v.chain(src, b2, g2, sum); v.chain(src, dry, sum);
  let last = sum;
  if (p.nasal) { const nz = v.filter('peaking', 1300, 3, 9 * p.nasal), hp = v.filter('highpass', 350); v.chain(last, nz, hp); last = hp; }
  if (p.gruff > 0.5) { const sh = v.shaper('crunch'); last.connect(sh); last = sh; }
  const lp = v.filter('lowpass', 4200 + 1500 * (p.pitch - 1)); v.chain(last, lp, out); out.connect(v.dest);
  if (FRIC.includes(low)) noise(v, t, { type: 'highpass', f: low === 'h' ? 1500 : 4200, dur: 0.028 / p.speed, vol: 0.12 });
  else if (PLOS.includes(low)) noise(v, t, { f: 1800, q: 1, dur: 0.008, vol: 0.18 });
  v.done();
  return { g: out, end: t + dur };
}

// =============================================================================
// Ambience: persistent noise "beds" + randomly scheduled events (Poisson).
// =============================================================================
function lfo(v, t, rate, depth, param, type = 'sine') { const o = v.osc(type, rate, t, null), g = v.gain(depth); o.connect(g); g.connect(param); }
const nbed = (v, t, kind, type, f, q, level) => { const n = v.noise(kind, t, null), fl = v.filter(type, f, q), g = v.gain(level); v.chain(n, fl, g); g.connect(v.dest); return { fl, g }; };

const BED = {
  breeze: (level) => (v, t) => {
    const a = nbed(v, t, 'pink', 'bandpass', 550, 0.6, level); lfo(v, t, 0.07, 260, a.fl.frequency); lfo(v, t, 0.11, level * 0.55, a.g.gain);
    const h = nbed(v, t, 'white', 'highpass', 3600, 0.7, level * 0.1); lfo(v, t, 0.13, level * 0.08, h.g.gain);
  },
  traffic: (v, t) => {
    const a = nbed(v, t, 'brown', 'lowpass', 240, 0.7, 0.45); lfo(v, t, 0.05, 0.14, a.g.gain);
    const b = nbed(v, t, 'pink', 'bandpass', 700, 0.5, 0.07); lfo(v, t, 0.09, 0.035, b.g.gain);
  },
  murmur: (level) => (v, t) => {
    for (const [f, q, r] of [[450, 2, 2.3], [1100, 3, 3.1], [2400, 3, 4.3]]) {
      const a = nbed(v, t, 'pink', 'bandpass', f, q, level); lfo(v, t, r, level * 0.6, a.g.gain); lfo(v, t, r * 0.37, f * 0.12, a.fl.frequency);
    }
  },
  water: (v, t) => {
    const a = nbed(v, t, 'brown', 'lowpass', 480, 1, 0.32); lfo(v, t, 0.23, 0.18, a.g.gain); lfo(v, t, 0.17, 150, a.fl.frequency);
    const b = nbed(v, t, 'pink', 'bandpass', 1100, 1.5, 0.06); lfo(v, t, 0.37, 0.05, b.g.gain);
  },
  neon: (v, t) => { // Osaka is on the 60 Hz grid → 120 Hz ballast buzz
    const o = v.osc('sawtooth', 120, t, null), b1 = v.filter('bandpass', 2400, 3), b2 = v.filter('bandpass', 240, 2), g = v.gain(0.014), pn = v.pan(0.35);
    o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); lfo(v, t, 0.3, 0.004, g.gain); v.chain(g, pn); pn.connect(v.dest);
    const h = v.osc('sine', 60, t, null), hg = v.gain(0.02); v.chain(h, hg); hg.connect(v.dest);
  },
  cicadas: (v, t) => {
    for (const [f, ar, sr, pan] of [[4300, 14, 0.21, -0.5], [5200, 19, 0.33, 0.45], [6100, 23, 0.27, 0.1]]) {
      const n = v.noise('white', t, null), bp = v.filter('bandpass', f, 9), am = v.gain(0.5), sw = v.gain(0.5), g = v.gain(0.1), pn = v.pan(pan);
      lfo(v, t, ar, 0.5, am.gain, 'triangle'); lfo(v, t, sr, 0.5, sw.gain); v.chain(n, bp, am, sw, g, pn); pn.connect(v.dest);
    }
  },
  stream: (v, t) => {
    const a = nbed(v, t, 'white', 'bandpass', 1500, 0.7, 0.05); lfo(v, t, 3.1, 0.022, a.g.gain); lfo(v, t, 0.7, 500, a.fl.frequency);
    const b = nbed(v, t, 'pink', 'bandpass', 600, 1, 0.1); lfo(v, t, 4.7, 0.04, b.g.gain);
  },
  roar: (v, t) => {
    const a = nbed(v, t, 'pink', 'bandpass', 850, 0.6, 0.22); lfo(v, t, 0.08, 0.08, a.g.gain);
    const b = nbed(v, t, 'pink', 'bandpass', 2300, 1, 0.07); lfo(v, t, 0.13, 0.03, b.g.gain);
    nbed(v, t, 'brown', 'lowpass', 250, 0.7, 0.25);
  },
  rain: (v, t) => {
    const a = nbed(v, t, 'white', 'highpass', 1200, 0.7, 0.11); lfo(v, t, 0.05, 0.03, a.g.gain);
    const lp = v.filter('lowpass', 9000); a.g.disconnect(); a.g.connect(lp); lp.connect(v.dest);
    nbed(v, t, 'pink', 'lowpass', 700, 0.7, 0.28);
  },
};

const EV = {
  bird: (k, dest, t, e) => {
    const v = k.v(dest), lp = v.filter('lowpass', rr(5000, 9000)), pn = v.pan(rr(-0.9, 0.9)); v.chain(lp, pn); pn.connect(v.dest);
    const vol = rr(0.025, 0.07), base = rr(2400, 4200), type = Math.floor(rand() * 4);
    if (type === 0) { const n = 2 + Math.floor(rand() * 4); for (let i = 0; i < n; i++) tone(v, t + i * rr(0.07, 0.11), { f: base, f1: base * 1.6, dur: 0.045, vol, sweep: 0.04, dest: lp }); }
    else if (type === 1) { const r = tone(v, t, { f: base, dur: 0.32, vol, rise: 0.03, dest: lp }), m = v.osc('sine', rr(22, 34), t, t + 0.4), mg = v.gain(base * 0.15); v.chain(m, mg); mg.connect(r.s.frequency); }
    else if (type === 2) { tone(v, t, { f: base * 1.1, f1: base * 0.75, dur: 0.22, vol, dest: lp }); tone(v, t + 0.3, { f: base * 1.1, f1: base * 0.75, dur: 0.22, vol: vol * 0.8, dest: lp }); }
    else { const r = tone(v, t, { f: base * 1.2, dur: 0.4, vol, rise: 0.05, dest: lp }), m = v.osc('square', 38, t, t + 0.5), mg = v.gain(0.5); const am = v.gain(0.5); r.g.disconnect(); r.g.connect(am); am.connect(lp); v.chain(m, mg); mg.connect(am.gain); }
    if (e) { const s = v.gain(0.3); pn.connect(s); s.connect(e.sfxRevIn); }
    v.done();
  },
  songbird: (k, dest, t, e) => {
    const v = k.v(dest), pn = v.pan(rr(-0.8, 0.8)); pn.connect(v.dest);
    const scale = [0, 2, 4, 7, 9, 12], base = rr(2000, 2800), n = 4 + Math.floor(rand() * 5), vol = rr(0.03, 0.06);
    let tt = t; for (let i = 0; i < n; i++) { const f = base * Math.pow(2, scale[Math.floor(rand() * scale.length)] / 12), d = rr(0.05, 0.12); tone(v, tt, { f, f1: f * rr(0.9, 1.15), dur: d, vol, dest: pn }); tt += d + rr(0.02, 0.06); }
    if (e) { const s = v.gain(0.3); pn.connect(s); s.connect(e.sfxRevIn); }
    v.done();
  },
  leaves: (k, dest, t) => { const v = k.v(dest); noise(v, t, { f: 3000, q: 0.8, rise: 0.2, dur: 0.4, vol: 0.05, pan: rr(-0.6, 0.6) }); v.done(); },
  carPass: (k, dest, t) => {
    const v = k.v(dest), dir = rand() < 0.5 ? 1 : -1;
    noise(v, t, { kind: 'pink', f: 520, f1: 330, q: 1.2, rise: 1.4, dur: 1.6, vol: 0.12, sweep: 3, panTo: 0.8 * dir });
    noise(v, t, { type: 'highpass', f: 2500, rise: 1.4, dur: 1.2, vol: 0.02, panTo: 0.8 * dir }); v.done();
  },
  horn: (k, dest, t) => { const v = k.v(dest), p = rr(-0.7, 0.7); for (const f of [350, 440]) tone(v, t, { type: 'square', f, dur: 0.3, vol: 0.012, rise: 0.02, lp: 1200, pan: p }); v.done(); },
  crossing: (k, dest, t) => { // Japanese pedestrian-crossing "piyo piyo"
    const v = k.v(dest), p = rr(-0.6, 0.6);
    for (let i = 0; i < 4; i++) { tone(v, t + i * 0.45, { f: 2700, f1: 2100, dur: 0.07, vol: 0.02, pan: p }); tone(v, t + i * 0.45 + 0.15, { f: 2600, f1: 2000, dur: 0.07, vol: 0.018, pan: p }); }
    v.done();
  },
  maglev: (k, dest, t) => {
    const v = k.v(dest), dir = rand() < 0.5 ? 1 : -1;
    tone(v, t, { type: 'sawtooth', f: 170, f1: 110, dur: 1.4, vol: 0.03, rise: 1.0, lp: 600, sweep: 2.4 });
    noise(v, t, { kind: 'pink', f: 900, f1: 500, q: 0.8, rise: 1.0, dur: 1.3, vol: 0.08, sweep: 2.3, panTo: 0.9 * dir }); v.done();
  },
  lap: (k, dest, t) => { const v = k.v(dest); noise(v, t, { kind: 'pink', f: rr(450, 900), q: 1.5, rise: 0.12, dur: 0.3, vol: rr(0.03, 0.07), pan: rr(-0.5, 0.5) }); v.done(); },
  flicker: (k, dest, t) => { const v = k.v(dest); tone(v, t, { type: 'sawtooth', f: 120, dur: 0.08, vol: 0.03, hp: 2000, pan: 0.35 }); noise(v, t, { type: 'highpass', f: 5000, dur: 0.03, vol: 0.02 }); v.done(); },
  bloop: (k, dest, t) => { const v = k.v(dest); tone(v, t, { f: rr(280, 420), f1: rr(800, 1100), dur: 0.04, vol: rr(0.02, 0.05), sweep: 0.035, pan: rr(-0.6, 0.6) }); v.done(); },
  higurashi: (k, dest, t) => { // evening cicada "kana-kana-kana"
    const v = k.v(dest), r = tone(v, t, { f: 4900, f1: 4100, dur: 1.6, vol: 0.03, rise: 0.1, sweep: 1.6, pan: rr(-0.7, 0.7) });
    const am = v.gain(0.5), m = v.osc('square', 9, t, t + 1.8), mg = v.gain(0.5); r.g.disconnect(); r.g.connect(am); am.connect(r.out === r.g ? v.dest : r.out); v.chain(m, mg); mg.connect(am.gain); v.done();
  },
  rooster: (k, dest, t, e) => { // cock-a-doodle-doo
    const v = k.v(dest), pn = v.pan(rr(-0.7, 0.7)), f1 = v.filter('bandpass', 1100, 2), f2 = v.filter('bandpass', 2400, 3), lp = v.filter('lowpass', 3500), g = v.gain(0);
    const segs = [[0, 0.12, 520, 600], [0.16, 0.08, 600, 620], [0.27, 0.22, 700, 680], [0.52, 0.75, 760, 560]];
    g.gain.setValueAtTime(0, t);
    for (const [d, len, a, b] of segs) {
      const o = v.osc('sawtooth', a, t + d, t + d + len + 0.05); o.frequency.linearRampToValueAtTime(b * (len > 0.5 ? 1.08 : 1), t + d + len * 0.4); o.frequency.linearRampToValueAtTime(b, t + d + len);
      const og = v.gain(0); og.gain.setValueAtTime(0, t + d); og.gain.linearRampToValueAtTime(1, t + d + 0.02); og.gain.setValueAtTime(1, t + d + len - 0.04); og.gain.linearRampToValueAtTime(0, t + d + len);
      v.chain(o, og); og.connect(f1); og.connect(f2);
    }
    g.gain.value = 0.05; f1.connect(lp); f2.connect(lp); v.chain(lp, g, pn); pn.connect(v.dest);
    if (e) { const s = v.gain(0.35); pn.connect(s); s.connect(e.sfxRevIn); }
    v.done();
  },
  cow: (k, dest, t) => {
    const v = k.v(dest), o = v.osc('sawtooth', 115, t, t + 1.5), bp = v.filter('bandpass', 420, 2), lp = v.filter('lowpass', 700), g = v.gain(0), pn = v.pan(rr(-0.8, 0.8));
    o.frequency.linearRampToValueAtTime(150, t + 0.5); o.frequency.linearRampToValueAtTime(100, t + 1.4); env2(g.gain, t, 0.1, 0.25, 1.15);
    v.chain(o, bp, lp, g, pn); pn.connect(v.dest); v.done();
  },
  cheer: (k, dest, t) => { const v = k.v(dest); noise(v, t, { kind: 'pink', f: 1100, q: 1, rise: 0.5, dur: 1.5, vol: 0.12 }); noise(v, t, { kind: 'pink', f: 2600, q: 2, rise: 0.5, dur: 1.2, vol: 0.04 }); v.done(); },
  whistle: (k, dest, t) => {
    const v = k.v(dest), r = tone(v, t, { f: rr(2600, 3000), dur: rr(0.25, 0.5), vol: 0.025, rise: 0.02, pan: rr(-0.8, 0.8) });
    const m = v.osc('square', 30, t, t + 0.6), mg = v.gain(140); v.chain(m, mg); mg.connect(r.s.frequency); v.done();
  },
  applause: (k, dest, t) => { const v = k.v(dest); grains(v, t, 34, 1.6, (ti) => noise(v, ti, { f: rr(900, 1500), q: 1.2, dur: 0.025, vol: rr(0.015, 0.04), pan: rr(-0.9, 0.9) })); v.done(); },
  drop: (k, dest, t) => {
    const v = k.v(dest);
    if (rand() < 0.5) tone(v, t, { f: rr(2000, 5200), f1: rr(3000, 6000), dur: 0.01, vol: rr(0.006, 0.02), sweep: 0.008, pan: rr(-0.9, 0.9) });
    else noise(v, t, { type: 'highpass', f: rr(3000, 7000), dur: 0.006, vol: rr(0.01, 0.03), pan: rr(-0.9, 0.9) });
    v.done();
  },
  thunder: (k, dest, t) => { const v = k.v(dest); noise(v, t, { kind: 'brown', type: 'lowpass', f: 170, rise: 0.4, dur: 3, vol: 0.45 }); noise(v, t, { type: 'lowpass', f: 900, dur: 0.35, vol: 0.12 }); v.done(); },
};

const AMB = {
  park: { vol: 2.26, beds: [BED.breeze(0.16)], events: [[0.45, EV.bird], [0.08, EV.leaves]] },
  city: { vol: 0.6, beds: [BED.traffic, BED.murmur(0.035)], events: [[0.12, EV.carPass], [0.03, EV.horn], [0.025, EV.crossing], [0.025, EV.maglev]] },
  canal_night: { vol: 0.69, beds: [BED.water, BED.neon, BED.murmur(0.012)], events: [[0.35, EV.lap], [0.05, EV.flicker], [0.12, EV.bloop]] },
  safari: { vol: 3.4, beds: [BED.cicadas, BED.stream], events: [[0.25, EV.bird], [0.3, EV.bloop], [0.025, EV.higurashi]] },
  farm: { vol: 3.16, beds: [BED.breeze(0.1)], events: [[0.3, EV.songbird], [0.15, EV.bird], [0.04, EV.rooster], [0.015, EV.cow]] },
  stadium: { vol: 1.33, beds: [BED.roar, BED.murmur(0.05)], events: [[0.12, EV.cheer], [0.1, EV.whistle], [0.05, EV.applause]] },
  rain: { vol: 0.88, beds: [BED.rain], events: [[22, EV.drop], [0.012, EV.thunder]] },
};
export const AMBIENCES = Object.keys(AMB);

class AmbPlayer {
  constructor(eng, def) {
    this.e = eng; this.k = eng.k; this.def = def; this.stopAt = Infinity; this.last = 0;
    this.out = eng.ctx.createGain(); this.out.gain.value = 0; this.out.connect(eng.ambBus); this.v = this.k.v(this.out);
  }
  start(t, fade) {
    this.out.gain.setValueAtTime(0.0001, t); this.out.gain.linearRampToValueAtTime(this.def.vol ?? 1, t + Math.max(0.05, fade));
    for (const b of this.def.beds) b(this.v, t, this.e);
    this.last = t;
  }
  tick(until) {
    const dt = until - this.last; if (dt <= 0) return;
    for (const [rate, fn] of this.def.events) {
      for (let x = rate * dt; x > 0; x -= 1) if (rand() < Math.min(1, x)) fn(this.k, this.out, this.last + rand() * dt, this.e);
    }
    this.last = until;
  }
  stop(t, fade) {
    const g = this.out.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.0001, t + Math.max(0.05, fade));
    this.stopAt = t + Math.max(0.05, fade); this.v.kill(this.stopAt + 0.02);
  }
  dispose() { this.v.dispose(); try { this.out.disconnect(); } catch (e) { /* gone */ } }
}

export const SFX_NAMES = Object.keys(SFX);
export const TRACK_IDS = Object.keys(TRACKS);
export const STINGER_IDS = Object.keys(STINGERS);
export { TRACKS, STINGERS };

// Default singleton — constructing it touches no Web Audio API (Node-safe).
export const audio = new AudioEngine();
export default audio;
