// Elemon procedural music: synthesis kit, instruments, step sequencer and track
// data. Everything here targets ANY BaseAudioContext (realtime or offline), so
// the same code renders live music and headless OfflineAudioContext checks.
// No audio files: every sound is built from oscillators, noise and filters.
//
// Layout:
//   1. helpers (pitch, rng, curves)
//   2. Kit  — per-context toolkit (cached noise buffers, IRs, curves) + Voice
//             builder that auto-disconnects its nodes when the sound ends
//   3. INST — instruments (drums, basses, keys, guitars, taiko, flute, …)
//   4. compiler + TrackPlayer — lookahead step sequencer with swing, chords,
//             chord-relative patterns and intensity layers
//   5. TRACKS / STINGERS — the actual music

// ---------------------------------------------------------------------------
// 1. helpers
// ---------------------------------------------------------------------------
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE_PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
export function noteToMidi(s) {
  const m = /^([a-gA-G])(#|b)?(-?\d)$/.exec(s);
  if (!m) return null;
  return 12 * (+m[3] + 1) + NOTE_PC[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smoothstep = (a, b, x) => { if (a === b) return x >= a ? 1 : 0; const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Fast deterministic RNG (mulberry32). Music humanisation uses a seeded one so
// renders are reproducible; SFX use the shared module RNG.
export function rngFrom(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const rand = rngFrom(0xE1E3);
export const rr = (a, b) => a + (b - a) * rand();

// Wave-shaper curves are context independent → cached once globally.
const CURVES = {};
export function curve(name) {
  if (CURVES[name]) return CURVES[name];
  const n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    let y;
    switch (name) {
      case 'amp': y = Math.tanh(x * 4.0) * 0.92 + 0.06 * Math.tanh(x * 9); break; // high-gain guitar amp
      case 'crunch': y = Math.tanh(x * 2.2 + 0.15) - Math.tanh(0.15); break;          // asymmetric tube
      case 'soft': y = Math.tanh(x * 1.6) / Math.tanh(1.6); break;
      case 'fuzz': y = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * 7)); break;
      case 'crush': y = Math.round(x * 7) / 7; break;                                     // 3-bit stairs
      case 'clip': { const a = Math.abs(x); y = a < 0.75 ? x : Math.sign(x) * (0.75 + 0.25 * Math.tanh((a - 0.75) / 0.25)); break; } // master safety
      default: y = x;
    }
    c[i] = y;
  }
  return (CURVES[name] = c);
}

// ---------------------------------------------------------------------------
// 2. Kit — per-context toolkit
// ---------------------------------------------------------------------------
const KITS = new WeakMap();
export function kitFor(ctx) { let k = KITS.get(ctx); if (!k) { k = new Kit(ctx); KITS.set(ctx, k); } return k; }

export class Kit {
  constructor(ctx) {
    this.ctx = ctx; this.sr = ctx.sampleRate; this._bufs = {};
    this.hasPan = typeof ctx.createStereoPanner === 'function';
  }
  get now() { return this.ctx.currentTime; }
  // Cached noise buffers (generated once per context, reused by every voice).
  buf(kind) {
    if (this._bufs[kind]) return this._bufs[kind];
    const sr = this.sr, R = rngFrom(kind.length * 7919 + 17);
    const secs = kind === 'crackle' ? 4 : 3;
    const len = Math.floor(sr * secs), b = this.ctx.createBuffer(1, len, sr), d = b.getChannelData(0);
    if (kind === 'white') for (let i = 0; i < len; i++) d[i] = R() * 2 - 1;
    else if (kind === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = R() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    } else if (kind === 'brown') {
      let l = 0; for (let i = 0; i < len; i++) { l = (l + 0.02 * (R() * 2 - 1)) / 1.02; d[i] = l * 3.5; }
    } else if (kind === 'crackle') { // vinyl: sparse clicks + faint hiss
      for (let i = 0; i < len; i++) d[i] = (R() * 2 - 1) * 0.02;
      for (let k = 0; k < secs * 22; k++) {
        const p = Math.floor(R() * (len - 60)), a = (R() < 0.15 ? 0.9 : 0.35) * (R() < 0.5 ? -1 : 1);
        for (let j = 0; j < 40; j++) d[p + j] += a * Math.exp(-j / 5) * (j % 2 ? -0.6 : 1);
      }
    }
    // tiny fade at the loop seam
    for (let i = 0; i < 64; i++) { const g = i / 64; d[i] *= g; d[len - 1 - i] *= g; }
    return (this._bufs[kind] = b);
  }
  // Procedural reverb impulse: early reflections + damped exponential tail.
  ir(secs = 2.2, damp = 0.5, key = 'ir') {
    const id = `${key}:${secs}:${damp}`;
    if (this._bufs[id]) return this._bufs[id];
    const sr = this.sr, len = Math.floor(sr * secs), b = this.ctx.createBuffer(2, len, sr), R = rngFrom(99 + len);
    const pre = Math.floor(sr * 0.012);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let lp = 0;
      for (let i = pre; i < len; i++) {
        const t = (i - pre) / sr, env = Math.pow(1 - (i - pre) / (len - pre), 2.2) * Math.exp(-t * 2.2);
        const k = 0.15 + 0.8 * Math.exp(-t * (2 + damp * 6)); // brightness falls over time
        lp += k * ((R() * 2 - 1) - lp);
        d[i] = lp * env;
      }
      for (let e = 0; e < 9; e++) { const p = pre + Math.floor(sr * (0.006 + R() * 0.07)); if (p < len) d[p] += (R() - 0.5) * 0.9 * (1 - e / 10); }
    }
    return (this._bufs[id] = b);
  }
  v(dest) { return new Voice(this, dest); }
}

// A Voice collects every node of one sound so it can all be disconnected when
// its last source stops (keeps long sessions leak-free).
export class Voice {
  constructor(kit, dest) { this.k = kit; this.ctx = kit.ctx; this.dest = dest; this.nodes = []; this.mods = []; this.end = 0; this.last = null; }
  _src(n, stop) { this.nodes.push(n); if (stop >= this.end) { this.end = stop; this.last = n; } return n; }
  osc(type, f, t0, t1, detune = 0) {
    const o = this.ctx.createOscillator();
    if (type === 'pulse') { o.setPeriodicWave(pulseWave(this.ctx)); } else o.type = type;
    o.frequency.setValueAtTime(f, t0); if (detune) o.detune.setValueAtTime(detune, t0);
    o.start(t0);
    if (t1 == null) { this.nodes.push(o); return o; } // persistent (ambience beds): stopped via kill()
    o.stop(t1); return this._src(o, t1);
  }
  noise(kind, t0, t1, rate = 1, loop = true) {
    const s = this.ctx.createBufferSource(), b = this.k.buf(kind);
    s.buffer = b; s.loop = loop; s.playbackRate.setValueAtTime(rate, t0);
    const off = rand() * (b.duration - 0.05);
    s.start(t0, off);
    if (t1 == null) { this.nodes.push(s); return s; }
    s.stop(t1); return this._src(s, t1);
  }
  // silent source that keeps the voice alive until t1 (for delay/reverb tails)
  hold(t0, t1) {
    const o = this.ctx.createOscillator(), g = this.gain(0); o.connect(g); g.connect(this.dest);
    o.start(t0); o.stop(t1); return this._src(o, t1);
  }
  // stop every source at t (persistent beds); nodes are disconnected by dispose()
  kill(t) { for (const n of this.nodes) if (typeof n.stop === 'function') { try { n.stop(t); } catch (e) { /* not started */ } } }
  dispose() {
    for (const [src, p] of this.mods) { try { src.disconnect(p); } catch (e) { /* gone */ } }
    for (const n of this.nodes) { try { n.disconnect(); } catch (e) { /* gone */ } }
    this.nodes = []; this.mods = [];
  }
  gain(v = 1) { const g = this.ctx.createGain(); g.gain.value = v; this.nodes.push(g); return g; }
  filter(type, f, q = 0.7, gainDb = 0) {
    const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; if (gainDb) b.gain.value = gainDb;
    this.nodes.push(b); return b;
  }
  shaper(name, os = '2x') { const w = this.ctx.createWaveShaper(); w.curve = curve(name); w.oversample = os; this.nodes.push(w); return w; }
  pan(p = 0) {
    if (this.k.hasPan) { const n = this.ctx.createStereoPanner(); n.pan.value = clamp(p, -1, 1); this.nodes.push(n); return n; }
    return this.gain(1);
  }
  delay(t, max = 2) { const d = this.ctx.createDelay(max); d.delayTime.value = t; this.nodes.push(d); return d; }
  // connect a,b,c,... in series; returns first node
  chain(...ns) { for (let i = 0; i < ns.length - 1; i++) ns[i].connect(ns[i + 1]); return ns[0]; }
  out(n) { n.connect(this.dest); return n; }
  mod(src, param) { src.connect(param); this.mods.push([src, param]); }
  done() {
    if (!this.last) return;
    const nodes = this.nodes, mods = this.mods;
    this.last.onended = () => {
      for (const [s, p] of mods) { try { s.disconnect(p); } catch (e) { /* already gone */ } }
      for (const n of nodes) { try { n.disconnect(); } catch (e) { /* ignore */ } }
    };
  }
  // ---- envelope helpers -------------------------------------------------
  // percussive: tiny linear attack then exponential decay to silence
  perc(param, t, peak, a, d) {
    param.setValueAtTime(0.0001, t); param.linearRampToValueAtTime(peak, t + a);
    param.exponentialRampToValueAtTime(0.0001, t + a + d); return t + a + d;
  }
  // ADSR on a gain param; returns the time the sound has fully released
  adsr(param, t, peak, a, d, s, dur, r) {
    param.setValueAtTime(0, t); param.linearRampToValueAtTime(peak, t + a);
    param.setTargetAtTime(peak * s, t + a, Math.max(0.005, d / 3));
    const rs = Math.max(t + dur, t + a + 0.005);
    param.setTargetAtTime(0, rs, Math.max(0.005, r / 4));
    return rs + r * 1.4;
  }
}

let _pulse = new WeakMap();
function pulseWave(ctx) { // 25% pulse (NES-ish lead) via Fourier series
  let w = _pulse.get(ctx); if (w) return w;
  const n = 48, re = new Float32Array(n), im = new Float32Array(n), duty = 0.25;
  for (let i = 1; i < n; i++) im[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty) * 0.9;
  w = ctx.createPeriodicWave(re, im); _pulse.set(ctx, w); return w;
}

// ---------------------------------------------------------------------------
// 3. Instruments. Signature: INST[name](kit, dest, t, ev, o)
//    ev = { notes:[midi], dur:sec, vel:0..1, mute, slide, vib, dead, ch, st }
//    o  = the part's instrument options; st = per-channel mutable state
// ---------------------------------------------------------------------------
export const INST = {};
const I = INST;

// ---- drums -----------------------------------------------------------------
I.kick = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), vel = ev.vel;
  const P = { tight: [165, 50, 0.3, 0.45], rock: [190, 52, 0.36, 0.7], '808': [125, 43, 0.85, 0.15], soft: [105, 48, 0.26, 0.12], deep: [150, 41, 0.55, 0.3], metal: [210, 55, 0.22, 1.0] }[o.tone || 'tight'];
  const [f0, f1, dec, click] = P, end = t + dec + 0.05;
  const s = v.osc('sine', f0, t, end);
  s.frequency.exponentialRampToValueAtTime(f1, t + 0.065);
  s.frequency.exponentialRampToValueAtTime(f1 * 0.82, t + dec);
  const g = v.gain(0); v.perc(g.gain, t, vel, 0.0015, dec);
  s.connect(g);
  if (o.tone === 'soft') { const lp = v.filter('lowpass', 700); g.connect(lp); v.out(lp); }
  else if (o.tone === 'rock' || o.tone === '808' || o.tone === 'metal') { const sh = v.shaper('soft'); const pg = v.gain(0.9); g.connect(sh); sh.connect(pg); v.out(pg); }
  else v.out(g);
  if (click) {
    const n = v.noise('white', t, t + 0.025), hp = v.filter('highpass', o.tone === 'metal' ? 3500 : 2200), cg = v.gain(0);
    v.perc(cg.gain, t, vel * click * 0.6, 0.0008, 0.014); v.chain(n, hp, cg); v.out(cg);
  }
  v.done();
};

I.snare = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), vel = ev.vel, tone = o.tone || 'tight';
  if (tone === 'brush') { // circular brush swish + tap
    const n = v.noise('white', t, t + 0.4), bp = v.filter('bandpass', 3200, 0.55), g = v.gain(0);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.5, t + 0.018); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    v.chain(n, bp, g); v.out(g); v.done(); return;
  }
  if (tone === 'rim') {
    const n = v.noise('white', t, t + 0.05), bp = v.filter('bandpass', 1900, 2.5), g = v.gain(0);
    v.perc(g.gain, t, vel * 0.9, 0.0008, 0.03); v.chain(n, bp, g); v.out(g);
    const s = v.osc('triangle', 820, t, t + 0.05), sg = v.gain(0); v.perc(sg.gain, t, vel * 0.5, 0.0008, 0.035); v.chain(s, sg); v.out(sg);
    v.done(); return;
  }
  const S = {
    tight: { nf: 1700, lp: 9500, nd: 0.15, nv: 0.75, bf: 205, bd: 0.07, bv: 0.55 },
    rock: { nf: 1100, lp: 8500, nd: 0.21, nv: 0.9, bf: 185, bd: 0.09, bv: 0.75 },
    lofi: { nf: 800, lp: 3600, nd: 0.15, nv: 0.55, bf: 175, bd: 0.08, bv: 0.45 },
    metal: { nf: 1500, lp: 10000, nd: 0.17, nv: 0.95, bf: 230, bd: 0.07, bv: 0.7 },
  }[tone];
  const n = v.noise('white', t, t + S.nd + 0.05), hp = v.filter('highpass', S.nf, 0.8), lp = v.filter('lowpass', S.lp), pk = v.filter('peaking', 4500, 1, 3), g = v.gain(0);
  v.perc(g.gain, t, vel * S.nv, 0.001, S.nd); v.chain(n, hp, lp, pk, g); v.out(g);
  const b = v.osc('triangle', S.bf * 1.25, t, t + S.bd + 0.05), bg = v.gain(0);
  b.frequency.exponentialRampToValueAtTime(S.bf * 0.85, t + S.bd);
  v.perc(bg.gain, t, vel * S.bv, 0.001, S.bd); v.chain(b, bg); v.out(bg);
  v.done();
};

I.clap = (k, dest, t, ev) => {
  const v = k.v(dest), vel = ev.vel * 0.9;
  const n = v.noise('white', t, t + 0.3), bp = v.filter('bandpass', 1150, 1.1), hp = v.filter('highpass', 500), g = v.gain(0);
  const p = g.gain; p.setValueAtTime(0.0001, t);
  for (let i = 0; i < 3; i++) { const ti = t + i * 0.0105; p.setValueAtTime(vel, ti); p.exponentialRampToValueAtTime(vel * 0.12, ti + 0.0095); }
  p.setValueAtTime(vel * 0.85, t + 0.032); p.exponentialRampToValueAtTime(0.0001, t + 0.032 + 0.17);
  v.chain(n, bp, hp, g); v.out(g); v.done();
};

I.hat = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), st = ev.st || {}, open = o.open || ev.ch === 'O';
  const dec = open ? (o.decay || 0.3) : (o.decay || 0.042) * (ev.vel > 0.9 ? 1.5 : 1);
  if (!open && st.openHat) { st.openHat.gain.setTargetAtTime(0, t, 0.008); st.openHat = null; }
  const n = v.noise('white', t, t + dec + 0.05), hp = v.filter('highpass', o.tone === 'dark' ? 5200 : 7200, 0.7), pk = v.filter('peaking', 10500, 1.2, 5), g = v.gain(0), cg = v.gain(1);
  v.perc(g.gain, t, ev.vel * (open ? 0.55 : 0.6), 0.0008, dec);
  v.chain(n, hp, pk, g, cg); v.out(cg);
  if (open) st.openHat = cg;
  v.done();
};

I.ride = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), vel = ev.vel, dec = o.decay || 0.6;
  const n = v.noise('white', t, t + dec + 0.05), bp = v.filter('bandpass', 5600, 1.4), g = v.gain(0);
  v.perc(g.gain, t, vel * 0.5, 0.001, dec); v.chain(n, bp, g); v.out(g);
  const s = v.osc('square', 2950, t, t + dec * 0.5), hp = v.filter('highpass', 4000), g2 = v.gain(0); // inharmonic "ping"
  v.perc(g2.gain, t, vel * 0.08, 0.001, dec * 0.45); v.chain(s, hp, g2); v.out(g2); v.done();
};

I.crash = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), vel = ev.vel, china = o.tone === 'china', dec = o.decay || (china ? 1.1 : 2.0);
  for (const side of [-0.35, 0.35]) {
    const n = v.noise('white', t, t + dec + 0.05), hp = v.filter('highpass', china ? 2200 : 3800), pk = v.filter('peaking', china ? 3200 : 6200, 1.2, china ? 9 : 5), pn = v.pan(side), g = v.gain(0);
    v.perc(g.gain, t, vel * 0.42, 0.002, dec);
    if (china) { const sh = v.shaper('crunch'); v.chain(n, hp, pk, sh, g, pn); } else v.chain(n, hp, pk, g, pn);
    v.out(pn);
  }
  const b = v.noise('white', t, t + 0.2), bh = v.filter('highpass', 6500), bg = v.gain(0);
  v.perc(bg.gain, t, vel * 0.35, 0.001, 0.12); v.chain(b, bh, bg); v.out(bg);
  v.done();
};

const TOM_F = { 1: 215, 2: 165, 3: 122, 4: 92 };
I.tom = (k, dest, t, ev) => {
  const v = k.v(dest), vel = ev.vel, f = ev.notes && ev.notes.length ? mtof(ev.notes[0]) : (TOM_F[ev.ch] || 150), dec = 0.25 + 30 / f;
  const s = v.osc('sine', f * 1.7, t, t + dec + 0.05), g = v.gain(0);
  s.frequency.exponentialRampToValueAtTime(f, t + 0.06); s.frequency.exponentialRampToValueAtTime(f * 0.9, t + dec);
  v.perc(g.gain, t, vel * 0.95, 0.0015, dec); v.chain(s, g); v.out(g);
  const tr = v.osc('triangle', f * 2.6, t, t + 0.12), tg = v.gain(0); tr.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.05);
  v.perc(tg.gain, t, vel * 0.18, 0.001, 0.08); v.chain(tr, tg); v.out(tg);
  const n = v.noise('white', t, t + 0.06), lp = v.filter('lowpass', 3000), ng = v.gain(0);
  v.perc(ng.gain, t, vel * 0.25, 0.001, 0.035); v.chain(n, lp, ng); v.out(ng);
  v.done();
};

I.taiko = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), vel = ev.vel, small = o.size === 'small';
  const [f0, f1, dec] = small ? [420, 310, 0.17] : [125, 58, 1.05];
  const s = v.osc('sine', f0, t, t + dec + 0.05), g = v.gain(0);
  s.frequency.exponentialRampToValueAtTime(f1, t + (small ? 0.03 : 0.12)); s.frequency.exponentialRampToValueAtTime(f1 * 0.92, t + dec);
  v.perc(g.gain, t, vel, 0.002, dec); v.chain(s, g); v.out(g);
  const ov = v.osc('triangle', f1 * 1.58, t, t + dec * 0.4), og = v.gain(0); v.perc(og.gain, t, vel * 0.22, 0.002, dec * 0.35); v.chain(ov, og); v.out(og);
  const n = v.noise('white', t, t + 0.12), lp = v.filter(small ? 'bandpass' : 'lowpass', small ? 2200 : 1100, small ? 1.2 : 0.7), ng = v.gain(0);
  v.perc(ng.gain, t, vel * (small ? 0.5 : 0.6), 0.001, small ? 0.04 : 0.07); v.chain(n, lp, ng); v.out(ng);
  v.done();
};

I.ka = (k, dest, t, ev) => { // taiko rim / woodblock "ka"
  const v = k.v(dest), vel = ev.vel;
  const n = v.noise('white', t, t + 0.05), bp = v.filter('bandpass', 2500, 3), g = v.gain(0);
  v.perc(g.gain, t, vel * 0.8, 0.0008, 0.028); v.chain(n, bp, g); v.out(g);
  const s = v.osc('sine', 1150, t, t + 0.06), sg = v.gain(0); v.perc(sg.gain, t, vel * 0.45, 0.0008, 0.04); v.chain(s, sg); v.out(sg);
  v.done();
};

I.shaker = (k, dest, t, ev) => {
  const v = k.v(dest), n = v.noise('white', t, t + 0.12), bp = v.filter('bandpass', 6500, 0.9), g = v.gain(0);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ev.vel * 0.45, t + 0.014); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
  v.chain(n, bp, g); v.out(g); v.done();
};

I.tamb = (k, dest, t, ev) => {
  const v = k.v(dest), n = v.noise('white', t, t + 0.2), hp = v.filter('highpass', 6000), pk = v.filter('peaking', 7600, 2, 8), g = v.gain(0);
  const p = g.gain, a = ev.vel * 0.4; p.setValueAtTime(0.0001, t);
  p.linearRampToValueAtTime(a, t + 0.002); p.exponentialRampToValueAtTime(a * 0.3, t + 0.012);
  p.linearRampToValueAtTime(a * 0.8, t + 0.016); p.exponentialRampToValueAtTime(0.0001, t + 0.15);
  v.chain(n, hp, pk, g); v.out(g); v.done();
};

I.snap = (k, dest, t, ev) => {
  const v = k.v(dest), n = v.noise('white', t, t + 0.06), bp = v.filter('bandpass', 2300, 2), g = v.gain(0);
  v.perc(g.gain, t, ev.vel * 0.9, 0.0008, 0.035); v.chain(n, bp, g); v.out(g); v.done();
};

I.stomp = (k, dest, t, ev) => {
  const v = k.v(dest), vel = ev.vel;
  const s = v.osc('sine', 95, t, t + 0.4), g = v.gain(0); s.frequency.exponentialRampToValueAtTime(46, t + 0.12);
  v.perc(g.gain, t, vel, 0.003, 0.32); v.chain(s, g); v.out(g);
  const n = v.noise('brown', t, t + 0.2), lp = v.filter('lowpass', 520, 1.5), ng = v.gain(0);
  v.perc(ng.gain, t, vel * 0.9, 0.002, 0.13); v.chain(n, lp, ng); v.out(ng);
  const w = v.noise('white', t, t + 0.06), bp = v.filter('bandpass', 1600, 1.2), wg = v.gain(0);
  v.perc(wg.gain, t, vel * 0.3, 0.001, 0.04); v.chain(w, bp, wg); v.out(wg);
  v.done();
};

// ---- basses ----------------------------------------------------------------
I.bass = (k, dest, t, ev, o = {}) => {
  const vel = ev.vel, mute = ev.mute || ev.dead;
  for (const m of ev.notes) {
    const v = k.v(dest), f = mtof(m), dur = mute ? Math.min(ev.dur, 0.11) : ev.dur, r = 0.06;
    const rel = t + Math.max(dur, 0.01), end = rel + r * 1.5;
    const s = v.osc(o.wave || 'sawtooth', f, t, end);
    if (ev.slide) { s.frequency.setValueAtTime(f * 0.89, t); s.frequency.exponentialRampToValueAtTime(f, t + 0.07); }
    const cut = o.cut || 650, lp = v.filter('lowpass', cut, o.q || 3);
    lp.frequency.setValueAtTime(cut * (1 + (o.env ?? 3) * vel), t); lp.frequency.exponentialRampToValueAtTime(cut, t + 0.16 + (o.envT || 0));
    const g = v.gain(0); v.adsr(g.gain, t, vel * 0.6, 0.004, 0.25, mute ? 0.15 : 0.7, dur, r);
    v.chain(s, lp, g);
    if (o.sub) { const sb = v.osc('sine', f, t, end), sg = v.gain(o.sub); v.chain(sb, sg, g); }
    v.out(g); v.done();
  }
};

// DX7-style FM slap bass: bright index burst = the "slap", octave pops brighter
I.slap = (k, dest, t, ev, o = {}) => {
  const m = ev.notes[0], f = mtof(m), v = k.v(dest), vel = ev.vel, dead = ev.dead, pop = ev.vel > 0.9 || m >= (o.popAbove || 48);
  const dur = dead ? 0.035 : ev.dur, rel = t + dur, end = rel + 0.12;
  const car = v.osc('sine', f, t, end), mod = v.osc('sine', f, t, end), mg = v.gain(0);
  mg.gain.setValueAtTime(f * (dead ? 9 : pop ? 6.5 : 4.2) * (0.5 + vel * 0.5), t);
  mg.gain.exponentialRampToValueAtTime(f * 0.7, t + 0.08); mg.gain.setTargetAtTime(f * 0.35, t + 0.08, 0.2);
  v.chain(mod, mg); mg.connect(car.frequency);
  const ck = v.osc('sine', f * 3, t, t + 0.05), cg = v.gain(0); cg.gain.setValueAtTime(f * (pop ? 3 : 1.5), t); cg.gain.exponentialRampToValueAtTime(1, t + 0.035);
  v.chain(ck, cg); cg.connect(car.frequency);
  const lp = v.filter('lowpass', pop ? 4200 : 3000, 0.8), g = v.gain(0);
  if (dead) v.perc(g.gain, t, vel * 0.45, 0.001, 0.05);
  else v.adsr(g.gain, t, vel * 0.62, 0.002, 0.28, 0.5, dur, 0.07);
  v.chain(car, lp, g); v.out(g); v.done();
};

I.upright = (k, dest, t, ev) => {
  const m = ev.notes[0], f = mtof(m), v = k.v(dest), vel = ev.vel, rel = t + ev.dur, end = rel + 0.2;
  const s = v.osc('sine', f * 1.01, t, end), tr = v.osc('triangle', f * 1.01, t, end);
  for (const o of [s, tr]) o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
  const tg = v.gain(0.45), lp = v.filter('lowpass', 900, 0.7), g = v.gain(0);
  v.adsr(g.gain, t, vel * 0.85, 0.008, 0.5, 0.35, ev.dur, 0.1);
  s.connect(lp); v.chain(tr, tg, lp); v.chain(lp, g); v.out(g);
  const n = v.noise('white', t, t + 0.05), np = v.filter('lowpass', 1400), ng = v.gain(0);
  v.perc(ng.gain, t, vel * 0.18, 0.001, 0.025); v.chain(n, np, ng); v.out(ng);
  v.done();
};

// ---- keys / bells / plucks ---------------------------------------------------
// FM Rhodes: ratio 1 body + very short ratio-14 tine bark; velocity = brightness
I.epiano = (k, dest, t, ev, o = {}) => {
  const n = ev.notes.length, lvl = (o.level || 0.34) / Math.sqrt(Math.max(1, n * 0.6));
  ev.notes.forEach((m, i) => {
    const f = mtof(m), v = k.v(dest), vel = ev.vel * (1 - i * 0.04), ti = t + (o.roll || 0) * i, rel = ti + ev.dur, end = rel + 0.45;
    const car = v.osc('sine', f, ti, end), mod = v.osc('sine', f, ti, end), mg = v.gain(0);
    mg.gain.setValueAtTime(f * (0.9 + 1.7 * vel), ti); mg.gain.setTargetAtTime(f * 0.18, ti, 0.35);
    v.chain(mod, mg); mg.connect(car.frequency);
    const tf = Math.min(f * 14, 16000), tine = v.osc('sine', tf, ti, ti + 0.08), tg = v.gain(0);
    tg.gain.setValueAtTime(f * 1.1 * vel, ti); tg.gain.exponentialRampToValueAtTime(0.5, ti + 0.05); v.chain(tine, tg); tg.connect(car.frequency);
    const g = v.gain(0); v.adsr(g.gain, ti, vel * lvl, 0.003, 1.3, 0.38, ev.dur, 0.3);
    v.chain(car, g); v.out(g); v.done();
  });
};

I.bell = (k, dest, t, ev, o = {}) => {
  const variant = o.variant || 'bell', n = ev.notes.length, lvl = (o.level || 0.3) / Math.sqrt(n);
  for (const m of ev.notes) {
    const f = mtof(m), v = k.v(dest), vel = ev.vel;
    if (variant === 'glock') {
      const dec = 1.1, g = v.gain(0); v.perc(g.gain, t, vel * lvl, 0.001, dec);
      const s = v.osc('sine', f, t, t + dec + 0.05); v.chain(s, g);
      const p2 = v.osc('sine', f * 2.756, t, t + 0.5), g2 = v.gain(0); v.perc(g2.gain, t, vel * lvl * 0.35, 0.001, 0.4); v.chain(p2, g2); v.out(g2);
      const p3 = v.osc('sine', Math.min(f * 5.404, 18000), t, t + 0.25), g3 = v.gain(0); v.perc(g3.gain, t, vel * lvl * 0.15, 0.001, 0.18); v.chain(p3, g3); v.out(g3);
      v.out(g); v.done(); continue;
    }
    const ratio = { city: 1, vibes: 4, tubular: 3.5, bell: 3.5 }[variant] || 3.5;
    const dec = { city: 1.6, vibes: 2.2, tubular: 3.2, bell: 2.0 }[variant] || 2;
    const rel = t + (variant === 'city' ? ev.dur : dec), end = rel + (variant === 'city' ? 0.6 : 0.05);
    const car = v.osc('sine', f, t, end), mod = v.osc('sine', f * ratio, t, end), mg = v.gain(0);
    mg.gain.setValueAtTime(f * (variant === 'vibes' ? 0.7 : variant === 'city' ? 1.6 : 2.8) * (0.4 + vel * 0.6), t);
    mg.gain.setTargetAtTime(f * (variant === 'city' ? 0.3 : 0.02), t, variant === 'city' ? 0.3 : 0.35);
    v.chain(mod, mg); mg.connect(car.frequency);
    if (variant === 'city') { // extra inharmonic sparkle partial (DX bell/EP blend)
      const m2 = v.osc('sine', f * 3.5, t, t + 0.7), g2 = v.gain(0); g2.gain.setValueAtTime(f * 1.4 * vel, t); g2.gain.exponentialRampToValueAtTime(1, t + 0.6);
      v.chain(m2, g2); g2.connect(car.frequency);
      const lfo = v.osc('sine', 5.2, t, end), lg = v.gain(0); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(14, t + 0.45);
      v.chain(lfo, lg); lg.connect(car.detune);
    }
    const g = v.gain(0);
    if (variant === 'city') v.adsr(g.gain, t, vel * lvl, 0.002, 0.9, 0.42, ev.dur, 0.45);
    else v.perc(g.gain, t, vel * lvl, 0.001, dec);
    if (variant === 'vibes') { // motor tremolo
      const tr = v.gain(0.75), lfo = v.osc('sine', 5.6, t, end), lg = v.gain(0.25); v.chain(lfo, lg); lg.connect(tr.gain);
      v.chain(car, g, tr); v.out(tr);
    } else { v.chain(car, g); v.out(g); }
    v.done();
  }
};
I.glock = (k, dest, t, ev, o = {}) => I.bell(k, dest, t, ev, { ...o, variant: 'glock' });

// Koto: bright pluck with a fast lowpass sweep and the characteristic bend-in
I.koto = (k, dest, t, ev, o = {}) => {
  for (const m of ev.notes) {
    const f = mtof(m), v = k.v(dest), vel = ev.vel, dec = o.decay || 1.5, end = t + dec + 0.05;
    const s = v.osc('sawtooth', f, t, end), tr = v.osc('triangle', f, t, end), tg = v.gain(0.6);
    for (const x of [s, tr]) { x.frequency.setValueAtTime(f * (ev.slide ? 0.944 : 1.012), t); x.frequency.exponentialRampToValueAtTime(f, t + (ev.slide ? 0.13 : 0.045)); }
    const lp = v.filter('lowpass', Math.min(f * 11, 9000), 2.2), pk = v.filter('peaking', 1300, 1, 3), g = v.gain(0);
    lp.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.32, t + 0.003);
    g.gain.exponentialRampToValueAtTime(vel * 0.11, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    s.connect(lp); v.chain(tr, tg, lp); v.chain(lp, pk, g); v.out(g);
    const n = v.noise('white', t, t + 0.03), hp = v.filter('highpass', 2600), ng = v.gain(0);
    v.perc(ng.gain, t, vel * 0.12, 0.001, 0.014); v.chain(n, hp, ng); v.out(ng);
    v.done();
  }
};

I.pluck = (k, dest, t, ev, o = {}) => {
  for (const m of ev.notes) {
    const f = mtof(m), v = k.v(dest), dec = o.decay || 0.35, end = t + dec + 0.05;
    const s = v.osc(o.wave || 'sawtooth', f, t, end), lp = v.filter('lowpass', Math.min(f * 9, 9000), o.q || 4), g = v.gain(0);
    lp.frequency.exponentialRampToValueAtTime(f * 1.4, t + dec * 0.6);
    v.perc(g.gain, t, ev.vel * (o.level || 0.3), 0.002, dec); v.chain(s, lp, g); v.out(g); v.done();
  }
};

I.pizz = (k, dest, t, ev, o = {}) => {
  for (const m of ev.notes) {
    const f = mtof(m), v = k.v(dest), dec = 0.32, end = t + dec + 0.05;
    const s = v.osc('triangle', f, t, end), sw = v.osc('sawtooth', f, t, end), sg = v.gain(0.3);
    const lp = v.filter('lowpass', 2200, 1), g = v.gain(0); lp.frequency.exponentialRampToValueAtTime(520, t + 0.18);
    v.perc(g.gain, t, ev.vel * (o.level || 0.32), 0.003, dec);
    s.connect(lp); v.chain(sw, sg, lp); v.chain(lp, g); v.out(g); v.done();
  }
};

// Acoustic guitar strum / fingerpick (per-string offsets)
I.acoustic = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), body = v.filter('peaking', 210, 1.2, 5), air = v.filter('highshelf', 4000, 0.7, 3);
  v.chain(body, air); v.out(air);
  const notes = ev.up ? [...ev.notes].reverse() : ev.notes, strum = o.strum ?? 0.016, lvl = (o.level || 0.3) / Math.sqrt(notes.length);
  notes.forEach((m, i) => {
    const f = mtof(m), ti = t + i * strum, dec = Math.min(o.decay || 1.6, ev.dur + 0.35), end = ti + dec + 0.05;
    const tr = v.osc('triangle', f, ti, end), sw = v.osc('sawtooth', f, ti, end), sg = v.gain(0.4);
    const lp = v.filter('lowpass', Math.min(f * 12, 8000), 1.1), g = v.gain(0); lp.frequency.exponentialRampToValueAtTime(f * 2.8, ti + 0.4);
    v.perc(g.gain, ti, ev.vel * lvl, 0.002, dec);
    tr.connect(lp); v.chain(sw, sg, lp); v.chain(lp, g, body);
  });
  const n = v.noise('white', t, t + 0.04), hp = v.filter('highpass', 3200), ng = v.gain(0);
  v.perc(ng.gain, t, ev.vel * 0.05, 0.001, 0.02 + strum * notes.length); v.chain(n, hp, ng); v.out(ng);
  v.done();
};

// ---- pads / strings / choir / brass -------------------------------------------
function vibrato(v, t, end, rate, cents, delay, targets) {
  const lfo = v.osc('sine', rate, t, end), lg = v.gain(0);
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(cents, t + delay);
  lfo.connect(lg); for (const p of targets) lg.connect(p);
}

I.pad = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), a = o.a ?? 0.35, r = o.r ?? 0.9, rel = t + Math.max(ev.dur, a), end = rel + r * 1.4;
  const cut = o.cut || 1800, lp = v.filter('lowpass', cut, o.q || 0.6), g = v.gain(0), n = ev.notes.length;
  if (o.sweep) { lp.frequency.setValueAtTime(cut * 0.35, t); lp.frequency.linearRampToValueAtTime(cut, t + a + 0.4); }
  v.adsr(g.gain, t, ev.vel * (o.level || 0.2) / Math.sqrt(n * 2), a, 0.8, 0.85, ev.dur, r);
  const det = o.detune ?? 9, wave = o.wave || 'sawtooth';
  for (const m of ev.notes) { const f = mtof(m); v.osc(wave, f, t, end, -det).connect(lp); v.osc(wave, f, t, end, det).connect(lp); }
  v.chain(lp, g); v.out(g); v.done();
};

I.strings = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), a = o.a ?? 0.45, r = o.r ?? 0.7, rel = t + Math.max(ev.dur, a), end = rel + r * 1.4;
  const lp = v.filter('lowpass', o.cut || 2600, 0.5), hp = v.filter('highpass', 180), g = v.gain(0), n = ev.notes.length, oscs = [];
  v.adsr(g.gain, t, ev.vel * (o.level || 0.2) / Math.sqrt(n * 2), a, 0.6, 0.9, ev.dur, r);
  for (const m of ev.notes) { const f = mtof(m); for (const d of [-11, 10]) { const s = v.osc('sawtooth', f, t, end, d); s.connect(lp); oscs.push(s.detune); } }
  vibrato(v, t, end, 5.3, 9, 0.5, oscs);
  v.chain(lp, hp, g); v.out(g); v.done();
};

const VOWELS = { a: [730, 1090, 2440], o: [570, 840, 2410], u: [320, 870, 2240], e: [530, 1840, 2480], i: [290, 2250, 3000] };
I.choir = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), a = o.a ?? 0.6, r = o.r ?? 1.2, rel = t + Math.max(ev.dur, a), end = rel + r * 1.4;
  const src = v.gain(1), sum = v.gain(1), g = v.gain(0), lp = v.filter('lowpass', 3800), n = ev.notes.length, F = VOWELS[o.vowel || 'a'], oscs = [];
  F.forEach((fq, i) => { const bp = v.filter('bandpass', fq, [5, 7, 9][i]), bg = v.gain([3.2, 2.0, 1.1][i]); v.chain(src, bp, bg, sum); });
  v.adsr(g.gain, t, ev.vel * (o.level || 0.26) / Math.sqrt(n), a, 0.8, 0.9, ev.dur, r);
  for (const m of ev.notes) { const f = mtof(m); for (const d of [-8, 9]) { const s = v.osc('sawtooth', f, t, end, d); s.connect(src); oscs.push(s.detune); } }
  vibrato(v, t, end, 4.8, 12, 0.7, oscs);
  v.chain(sum, lp, g); v.out(g); v.done();
};

I.brass = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), r = o.r ?? 0.14, rel = t + Math.max(ev.dur, 0.05), end = rel + r * 1.5, n = ev.notes.length;
  const cut = (o.cut || 2600) * (0.6 + 0.4 * ev.vel), lp = v.filter('lowpass', 380, 1.4), g = v.gain(0);
  lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(cut, t + 0.06); lp.frequency.exponentialRampToValueAtTime(cut * 0.68, t + 0.5);
  v.adsr(g.gain, t, ev.vel * (o.level || 0.28) / Math.sqrt(n * 2), 0.022, 0.3, 0.75, ev.dur, r);
  for (const m of ev.notes) {
    const f = mtof(m);
    for (const d of [-6, 6]) { const s = v.osc('sawtooth', f * 0.985, t, end, d); s.frequency.exponentialRampToValueAtTime(f, t + 0.05); s.connect(lp); }
  }
  v.chain(lp, g); v.out(g); v.done();
};

// ---- leads -------------------------------------------------------------------
I.lead = (k, dest, t, ev, o = {}) => {
  const m = ev.notes[0], f = mtof(m), v = k.v(dest), st = ev.st || {}, r = o.r ?? 0.12, rel = t + Math.max(ev.dur, 0.02), end = rel + r * 1.5;
  const wave = o.wave || 'sawtooth';
  const s1 = v.osc(wave, f, t, end), s2 = v.osc(o.wave2 || wave, f, t, end, o.det ?? 7), sg = v.gain(o.mix2 ?? 0.6);
  const from = ev.slide ? f * 0.8909 : (o.glide && st.lastF && t - st.lastT < 0.25 ? st.lastF : 0);
  if (from) for (const s of [s1, s2]) { s.frequency.setValueAtTime(from, t); s.frequency.exponentialRampToValueAtTime(f, t + (ev.slide ? 0.09 : o.glide)); }
  st.lastF = f; st.lastT = rel;
  vibrato(v, t, end, o.vibRate || 5.4, (o.vib ?? 14) * (ev.vib ? 2.2 : 1), ev.vib ? 0.15 : 0.32, [s1.detune, s2.detune]);
  const cut = o.cut || 3200, lp = v.filter('lowpass', cut * 1.7, o.q || 1), g = v.gain(0);
  lp.frequency.exponentialRampToValueAtTime(cut, t + 0.25);
  v.adsr(g.gain, t, ev.vel * (o.level || 0.22), o.a ?? 0.01, 0.25, o.s ?? 0.8, ev.dur, r);
  s1.connect(lp); v.chain(s2, sg, lp); v.chain(lp, g);
  if (o.sub) { const so = v.osc('sine', f / 2, t, end), sgg = v.gain(o.sub); v.chain(so, sgg, g); }
  v.out(g); v.done();
};

// Distorted power chord DI → the channel's shared amp (see buildAmp).
// Palm mute = short envelope + dark pre-filter; open = sustained ring.
I.guitar = (k, dest, t, ev, o = {}) => {
  const root = ev.notes[0], v = k.v(dest), vel = ev.vel, mute = ev.mute;
  const tones = o.single ? [root] : o.fifthOnly || mute ? [root, root + 7] : [root, root + 7, root + 12];
  const dur = mute ? Math.min(ev.dur, 0.16) : ev.dur, rel = t + dur, end = mute ? t + 0.2 : rel + 0.12;
  const lp = v.filter('lowpass', mute ? 650 : 3400, 0.8), g = v.gain(0);
  if (mute) v.perc(g.gain, t, vel * 0.85, 0.002, 0.14);
  else v.adsr(g.gain, t, vel, 0.004, 0.6, 0.75, dur, 0.07);
  tones.forEach((m, i) => {
    const f = mtof(m), a = v.osc('sawtooth', f, t, end, rr(-6, 6)), ag = v.gain(i === 2 ? 0.24 : 0.42);
    if (ev.slide) { a.frequency.setValueAtTime(f * 0.94, t); a.frequency.exponentialRampToValueAtTime(f, t + 0.06); }
    v.chain(a, ag, lp);
  });
  v.chain(lp, g); v.out(g); v.done();
};

// Shakuhachi / flute: sine body + pitched breath noise, meri bend-in, late vibrato
I.flute = (k, dest, t, ev, o = {}) => {
  const m = ev.notes[0], f = mtof(m), v = k.v(dest), shaku = o.style === 'shaku', vel = ev.vel;
  const r = 0.18, rel = t + Math.max(ev.dur, 0.06), end = rel + r * 1.5, breath = o.breath ?? (shaku ? 0.5 : 0.16);
  const s = v.osc('sine', f, t, end), tr = v.osc('triangle', f, t, end), tg = v.gain(0.16);
  const bend = ev.slide ? -180 : shaku ? -70 : -18;
  for (const x of [s, tr]) { x.detune.setValueAtTime(bend, t); x.detune.linearRampToValueAtTime(0, t + (shaku || ev.slide ? 0.16 : 0.05)); }
  vibrato(v, t, end, shaku ? 4.6 : 5.2, (shaku ? 22 : 13) * (ev.vib ? 1.8 : 1), 0.45, [s.detune, tr.detune]);
  const body = v.gain(1), g = v.gain(0);
  v.adsr(g.gain, t, vel * (o.level || 0.3), shaku ? 0.1 : 0.05, 0.3, 0.85, ev.dur, r);
  s.connect(body); v.chain(tr, tg, body);
  const n = v.noise('white', t, end), bp = v.filter('bandpass', f, 7), ng = v.gain(breath * 1.6);
  v.chain(n, bp, ng, body);
  const c = v.noise('white', t, t + 0.15), hp = v.filter('highpass', 1800), cg = v.gain(0);
  v.perc(cg.gain, t, vel * breath * 0.16, 0.012, 0.09); v.chain(c, hp, cg); v.out(cg);
  v.chain(body, g); v.out(g); v.done();
};

I.sub = (k, dest, t, ev, o = {}) => {
  const f = mtof(ev.notes[0]), v = k.v(dest), r = o.r ?? 0.3, rel = t + ev.dur, end = rel + r * 1.5;
  const s = v.osc('sine', f, t, end), g = v.gain(0); v.adsr(g.gain, t, ev.vel * (o.level || 0.5), o.a ?? 0.04, 0.3, 0.9, ev.dur, r);
  v.chain(s, g); v.out(g); v.done();
};

I.drone = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), a = o.a ?? 1.4, r = o.r ?? 1.8, rel = t + Math.max(ev.dur, a), end = rel + r * 1.4, n = ev.notes.length;
  const cut = o.cut || 700, lp = v.filter('lowpass', cut, 2.5), g = v.gain(0);
  const lfo = v.osc('sine', o.rate || 0.13, t, end), lg = v.gain(cut * 0.55); v.chain(lfo, lg); lg.connect(lp.frequency);
  v.adsr(g.gain, t, ev.vel * (o.level || 0.22) / Math.sqrt(n * 3), a, 1, 1, ev.dur, r);
  for (const m of ev.notes) { const f = mtof(m); for (const d of [-13, 0, 12]) v.osc(o.wave || 'sawtooth', f, t, end, d).connect(lp); }
  v.chain(lp, g); v.out(g); v.done();
};

// Gang vocal "HEY!": several shouting voices into one shared formant bank (e→i)
I.gang = (k, dest, t, ev, o = {}) => {
  const v = k.v(dest), vel = ev.vel, nv = o.voices || 4, src = v.gain(1), sum = v.gain(1), end = t + 0.45;
  const F = [[620, 4, 3], [1750, 6, 2.2], [2600, 8, 1.2]];
  F.forEach(([fq, q, gg], i) => {
    const bp = v.filter('bandpass', fq, q), bg = v.gain(gg); v.chain(src, bp, bg, sum);
    if (i === 1) bp.frequency.linearRampToValueAtTime(2250, t + 0.2);
  });
  for (let i = 0; i < nv; i++) {
    const ti = t + rr(0, 0.02), f0 = rr(145, 205) * (o.pitch || 1);
    const s = v.osc('sawtooth', f0, ti, end), g = v.gain(0);
    s.frequency.setValueAtTime(f0 * 1.06, ti + 0.02); s.frequency.exponentialRampToValueAtTime(f0 * 0.8, ti + 0.24);
    g.gain.setValueAtTime(0, ti); g.gain.setValueAtTime(0, ti + 0.025); g.gain.linearRampToValueAtTime(vel * 0.5 / Math.sqrt(nv), ti + 0.045);
    g.gain.setTargetAtTime(0, ti + 0.14, 0.04); v.chain(s, g, src);
    const h = v.noise('white', ti, ti + 0.1), hg = v.gain(0); v.perc(hg.gain, ti, vel * 0.25 / Math.sqrt(nv), 0.004, 0.04); v.chain(h, hg, src);
  }
  const sh = v.shaper('soft'), hp = v.filter('highpass', 220), og = v.gain(0.9);
  v.chain(sum, sh, hp, og); v.out(og); v.done();
};

// Shared guitar amp for a channel: tight pre-EQ → tanh drive → cab sim.
export function buildAmp(k, o = {}) {
  const c = k.ctx, nodes = [];
  const mk = (n) => { nodes.push(n); return n; };
  const bq = (type, f, q, g) => { const b = mk(c.createBiquadFilter()); b.type = type; b.frequency.value = f; b.Q.value = q; if (g) b.gain.value = g; return b; };
  const input = bq('highpass', 120, 0.7), pre = bq('peaking', 900, 0.9, 5), drive = mk(c.createGain()); drive.gain.value = o.drive || 4;
  const sh = mk(c.createWaveShaper()); sh.curve = curve('amp'); sh.oversample = '4x';
  const cab1 = bq('lowpass', o.cab || 4800, 0.9), scoop = bq('peaking', 430, 1.1, o.scoop ?? -5), pres = bq('peaking', 2300, 1, 3), cab2 = bq('lowpass', 8000, 0.7), hp = bq('highpass', 85, 0.7);
  const output = mk(c.createGain()); output.gain.value = o.post || 0.3;
  input.connect(pre); pre.connect(drive); drive.connect(sh); sh.connect(cab1); cab1.connect(scoop); scoop.connect(pres); pres.connect(cab2); cab2.connect(hp); hp.connect(output);
  return { input, output, nodes };
}

// ---------------------------------------------------------------------------
// 4. Chords, pattern compiler and the lookahead step sequencer
//
// Pattern notations (per section, per part):
//  * grid  (drums, chord rhythms): one char per step, '|' and spaces ignored.
//      X=accent x=normal o=ghost m/M=palm-muted  O=open hat  1-4=tom pitch
//      '-' extends the previous hit (chord parts), '.' rest. Loops if short.
//  * tokens (melodies / basslines): "note:steps[mods]" separated by spaces.
//      abs mode:  c5:2  f#4:4  bb3:1   r:4 (rest)
//      rel mode:  chord-relative degrees: 1 3 5 7 (chord-aware), b3 b7 9 #11 13,
//                 8 = octave, ' / , = octave up/down, x = dead note,
//                 > / < = chromatic approach to the next chord's root.
//      mods: ! accent  ? soft  m palm mute  ~ vibrato  / slide-in  _ staccato
// ---------------------------------------------------------------------------
const QUAL = {
  '': [0, 4, 7], maj: [0, 4, 7], m: [0, 3, 7], 5: [0, 7], dim: [0, 3, 6], aug: [0, 4, 8],
  sus2: [0, 2, 7], sus4: [0, 5, 7], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9], 69: [0, 4, 7, 9, 14], add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14],
  7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], mmaj7: [0, 3, 7, 11], m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9],
  '7sus4': [0, 5, 7, 10], 9: [0, 4, 7, 10, 14], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14], m11: [0, 3, 7, 10, 14, 17],
  '9sus4': [0, 5, 7, 10, 14], 13: [0, 4, 7, 10, 14, 21], maj13: [0, 4, 7, 11, 14, 21], '7b9': [0, 4, 7, 10, 13], '7#9': [0, 4, 7, 10, 15],
  '7b13': [0, 4, 7, 10, 20], '7#5': [0, 4, 8, 10], 'maj7#11': [0, 4, 7, 11, 18], 'm7b9': [0, 3, 7, 10, 13], '13sus4': [0, 5, 7, 10, 14, 21],
};
const pcOf = (l, acc) => (NOTE_PC[l.toLowerCase()] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + 12) % 12;
export function parseChord(sym) {
  const m = /^([A-G])(#|b)?([^/]*)(?:\/([A-G])(#|b)?)?$/.exec(sym.trim());
  if (!m || !QUAL[m[3]]) throw new Error('bad chord "' + sym + '"');
  const iv = QUAL[m[3]], has = (x) => iv.includes(x), root = pcOf(m[1], m[2]);
  return {
    sym, root, iv, bass: m[4] ? pcOf(m[4], m[5]) : root,
    third: has(4) ? 4 : has(3) ? 3 : has(5) ? 5 : has(2) ? 2 : 4,
    fifth: has(7) ? 7 : has(6) ? 6 : has(8) ? 8 : 7,
    seventh: has(11) ? 11 : has(10) ? 10 : m[3] === 'dim7' ? 9 : has(9) ? 9 : null,
  };
}
const place = (pc, base) => base + ((((pc - base) % 12) + 12) % 12);

// Close / rootless voicing around a centre note (constant centre → smooth voice leading).
export function voicing(ch, vc = {}) {
  if (vc.type === 'root') return [place(ch.root, vc.base ?? 40)];
  const center = vc.center ?? 62, n = vc.n ?? 4, iv = ch.iv, pri = [];
  const add = (x) => { if (x != null && iv.includes(x) && !pri.includes(x)) pri.push(x); };
  add(ch.third); add(ch.seventh); add(9); for (const x of iv) if (x >= 13) add(x); add(ch.fifth); add(5); add(2);
  if (!vc.rootless || pri.length < 3) add(0);
  const pcs = pri.slice(0, n).map((x) => (ch.root + x) % 12);
  let notes = pcs.map((pc) => center - 6 + ((((pc - (center - 6)) % 12) + 12) % 12)).sort((a, b) => a - b);
  for (let i = 1; i < notes.length; i++) if (notes[i] <= notes[i - 1]) notes[i] += 12;
  notes.sort((a, b) => a - b);
  if (vc.drop2 && notes.length >= 4) { notes[notes.length - 2] -= 12; notes.sort((a, b) => a - b); }
  if (vc.bass != null) notes.unshift(place(ch.bass, vc.bass));
  if (vc.top) notes.push(notes[notes.length - 1 - (vc.bass != null ? 0 : 0)] + 12);
  return notes;
}

function chordGrid(str, len, spb) {
  const at = new Array(len).fill(null);
  if (!str) return at;
  const bars = str.split('|').map((b) => b.trim()).filter(Boolean);
  const seq = [];
  for (const b of bars) {
    const cs = b.split(/\s+/), explicit = cs.some((c) => c.includes(':'));
    let used = 0;
    cs.forEach((c, i) => {
      const [sym, d] = c.split(':'); const steps = explicit ? +d || 0 : (i === cs.length - 1 ? spb - used : Math.floor(spb / cs.length));
      seq.push([parseChord(sym), steps]); used += steps;
    });
  }
  let pos = 0;
  while (pos < len) for (const [c, d] of seq) { for (let i = 0; i < d && pos < len; i++) at[pos++] = c; if (pos >= len) break; }
  return at;
}

const VEL = { X: 1, x: 0.78, o: 0.45, m: 0.8, M: 1, O: 0.8, k: 0.8, 1: 0.85, 2: 0.85, 3: 0.85, 4: 0.85 };
const DEGS = [0, 0, 2, 4, 5, 7, 9, 11];
function degree(tok, ch) {
  const m = /^([b#]?)(\d+)([',]*)$/.exec(tok), n = +m[2], acc = m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0;
  const oct = Math.floor((n - 1) / 7), b = ((n - 1) % 7) + 1;
  let s = !acc && b === 3 ? ch.third : !acc && b === 5 ? ch.fifth : !acc && b === 7 ? (ch.seventh ?? 10) : DEGS[b] + acc;
  s += oct * 12; for (const c of m[3]) s += c === "'" ? 12 : -12;
  return { s, slash: b === 1 && !acc };
}

function compilePart(pat, len, part, chordAt, tr, warn, where) {
  const mode = part.mode || 'drum', shift = mode === 'drum' ? 0 : (tr.transpose || 0) + 12 * (part.oct || 0), out = [];
  if (mode === 'drum' || mode === 'chord') {
    const s = pat.replace(/[\s|]/g, '');
    if (len % s.length && s.length % len) warn.push(`${where}: grid length ${s.length} does not fit ${len}`);
    for (let i = 0; i < len; i++) {
      const c = s[i % s.length]; if (c === '.' || c === '-') continue;
      let d = 1; while (i + d < len && s[(i + d) % s.length] === '-') d++;
      const e = { s: i, d, vel: VEL[c] ?? 0.8, c, mute: c === 'm' || c === 'M' };
      if (mode === 'chord') { const ch = chordAt[i]; if (!ch) { warn.push(`${where}: no chord at step ${i}`); continue; } e.n = voicing(ch, part.voicing).map((x) => x + shift); }
      else if (part.note != null) e.n = [part.note];
      out.push(e);
    }
    return out;
  }
  const re = mode === 'abs' ? /^(r|[a-g][#b]?-?\d)(?::(\d+))?([!?m~/_]*)$/ : /^(r|x|>|<|[b#]?\d+[',]*)(?::(\d+))?([!?m~/_]*)$/;
  const toks = pat.split(/[\s|]+/).filter(Boolean).map((tk) => {
    const m = re.exec(tk); if (!m) throw new Error(`${tr.id || '?'} ${where}: bad token "${tk}"`);
    return { v: m[1], d: m[2] ? +m[2] : 1, mods: m[3] || '' };
  });
  const total = toks.reduce((a, t) => a + t.d, 0);
  if (!total) return out;
  if (len % total) warn.push(`${where}: token length ${total} does not divide section length ${len}`);
  let pos = 0;
  while (pos < len) {
    for (const t of toks) {
      if (pos >= len) break;
      const d = Math.min(t.d, len - pos), at = pos; pos += t.d;
      if (t.v === 'r') continue;
      const md = t.mods, e = { s: at, d, vel: md.includes('!') ? 1 : md.includes('?') ? 0.5 : 0.8, mute: md.includes('m'), vib: md.includes('~'), slide: md.includes('/') };
      if (md.includes('_')) e.gate = 0.45;
      if (mode === 'abs') e.n = [noteToMidi(t.v) + shift];
      else {
        const ch = chordAt[at]; if (!ch) { warn.push(`${where}: no chord at step ${at}`); continue; }
        const base = part.base ?? 36;
        if (t.v === 'x') { e.n = [place(ch.bass, base) + shift]; e.dead = true; }
        else if (t.v === '>' || t.v === '<') { const nx = chordAt[(at + t.d) % len] || ch; e.n = [place(nx.bass, base) + (t.v === '>' ? -1 : 1) + shift]; }
        else { const g = degree(t.v, ch); e.n = [place(g.slash ? ch.bass : ch.root, base) + g.s + shift]; }
      }
      out.push(e);
    }
  }
  return out;
}

const COMPILED = new WeakMap();
export function compileTrack(tr) {
  if (COMPILED.has(tr)) return COMPILED.get(tr);
  const res = tr.res || 4, spb = res * (tr.beats || 4), warnings = [], secs = {};
  for (const [name, sec] of Object.entries(tr.sections)) {
    const len = sec.bars * spb, chordAt = chordGrid(sec.chords, len, spb), steps = Array.from({ length: len }, () => []);
    for (const [pn, pat] of Object.entries(sec.p || {})) {
      const part = tr.parts[pn];
      if (!part) throw new Error(`${tr.id}: section ${name} uses unknown part ${pn}`);
      if (!INST[part.inst]) throw new Error(`${tr.id}: part ${pn} unknown instrument ${part.inst}`);
      if (!pat) continue;
      for (const e of compilePart(pat, len, part, chordAt, tr, warnings, `${name}.${pn}`)) { e.part = pn; steps[e.s].push(e); }
    }
    secs[name] = steps;
  }
  const tl = []; let loopAt = 0;
  tr.form.forEach((sn, i) => {
    if (!secs[sn]) throw new Error(`${tr.id}: form references missing section ${sn}`);
    if (i === (tr.loop ?? 0)) loopAt = tl.length;
    for (const st of secs[sn]) tl.push(st);
  });
  const stepDur = 60 / tr.bpm / res;
  const c = { tl, loopAt, spb, res, stepDur, warnings, total: tl.length * stepDur, loopLen: (tl.length - loopAt) * stepDur, events: tl.reduce((a, s) => a + s.length, 0) };
  COMPILED.set(tr, c);
  return c;
}

function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// Plays one compiled track into `dest`. Driven by the engine's tick(until).
export class TrackPlayer {
  constructor(k, tr, dest, opt = {}) {
    this.k = k; this.ctx = k.ctx; this.tr = tr; this.c = compileTrack(tr); this.nodes = []; this.srcs = [];
    this.I = opt.intensity ?? 0; this.rng = rngFrom(hashStr(tr.id || 'x'));
    this.out = this._g(0); this.out.connect(dest);
    this.bus = this._g(tr.vol ?? 1);
    let head = this.bus;
    if (tr.fx) {
      if (tr.fx.drive) { const pre = this._g(tr.fx.drive), sh = this.ctx.createWaveShaper(); sh.curve = curve('soft'); this.nodes.push(sh); const post = this._g(0.8 / tr.fx.drive); head.connect(pre); pre.connect(sh); sh.connect(post); head = post; }
      if (tr.fx.lp) { const lp = this._bq('lowpass', tr.fx.lp, 0.5); head.connect(lp); head = lp; }
      if (tr.fx.hp) { const hp = this._bq('highpass', tr.fx.hp, 0.6); head.connect(hp); head = hp; }
    }
    head.connect(this.out);
    this.revBus = null;
    if (opt.rev) { this.revBus = this._g(0); this.revBus.connect(opt.rev); }
    this.dly = null;
    if (tr.delay) {
      const c = this.ctx, dt = (tr.delay.beats || 0.75) * 60 / tr.bpm, inp = this._g(1), hp = this._bq('highpass', 350, 0.5), lp = this._bq('lowpass', 2800, 0.5);
      const dl = c.createDelay(2), dr = c.createDelay(2); dl.delayTime.value = dt; dr.delayTime.value = dt; this.nodes.push(dl, dr);
      const fb = this._g(tr.delay.fb ?? 0.32), wet = this._g(tr.delay.mix ?? 0.5), pl = this._pan(-0.55), pr = this._pan(0.55);
      inp.connect(hp); hp.connect(lp); lp.connect(dl); dl.connect(pl); pl.connect(wet); dl.connect(dr); dr.connect(pr); pr.connect(wet); dr.connect(fb); fb.connect(dl);
      wet.connect(this.bus); this.dly = inp;
    }
    this.ch = {};
    for (const [name, p] of Object.entries(tr.parts)) this.ch[name] = this._channel(p);
    this.pos = 0; this.next = 0; this.running = false; this.ended = false; this.stopAt = Infinity;
  }
  _g(v) { const g = this.ctx.createGain(); g.gain.value = v; this.nodes.push(g); return g; }
  _bq(type, f, q) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; this.nodes.push(b); return b; }
  _pan(p) { if (!this.k.hasPan) return this._g(1); const n = this.ctx.createStereoPanner(); n.pan.value = p; this.nodes.push(n); return n; }
  _layer(p) {
    if (!p.int) return 1;
    const [lo, hi] = p.int;
    return lo <= hi ? smoothstep(lo, hi, this.I) : 1 - smoothstep(hi, lo, this.I);
  }
  _channel(p) {
    const input = this._g(p.vol ?? 0.5); let head = input;
    if (p.amp) { const a = buildAmp(this.k, p.amp === true ? {} : p.amp); this.nodes.push(...a.nodes); input.connect(a.input); head = a.output; }
    const drive = p.drive ?? (p.inst === 'bass' && p.o ? p.o.drive : 0);
    if (drive) { const pre = this._g(drive), sh = this.ctx.createWaveShaper(), post = this._g(0.55); sh.curve = curve('crunch'); sh.oversample = '2x'; this.nodes.push(sh); head.connect(pre); pre.connect(sh); sh.connect(post); head = post; }
    if (p.lp) { const lp = this._bq('lowpass', p.lp, 0.6); head.connect(lp); head = lp; }
    const lt = this._layer(p), layer = this._g(lt); head.connect(layer);
    const pan = this._pan(p.pan || 0); layer.connect(pan); pan.connect(this.bus);
    const rv = p.rev ?? this.tr.rev ?? 0;
    if (this.revBus && rv > 0) { const s = this._g(rv); pan.connect(s); s.connect(this.revBus); }
    if (this.dly && p.dly) { const s = this._g(p.dly); pan.connect(s); s.connect(this.dly); }
    return { p, input, layer, lt, st: {} };
  }
  get loopLen() { return this.c.loopLen; }
  get length() { return this.c.total; }
  start(t, fade = 0) {
    this.next = t; this.t0 = t; this.running = true;
    for (const g of [this.out, this.revBus]) {
      if (!g) continue;
      g.gain.setValueAtTime(fade > 0 ? 0.0001 : 1, t);
      if (fade > 0) g.gain.linearRampToValueAtTime(1, t + fade);
    }
    const tr = this.tr;
    if (tr.bed === 'vinyl') { // looped crackle + hiss under lo-fi tracks
      const s = this.ctx.createBufferSource(); s.buffer = this.k.buf('crackle'); s.loop = true;
      const bp = this._bq('bandpass', 2400, 0.4), g = this._g(tr.bedVol ?? 0.5); s.connect(bp); bp.connect(g); g.connect(this.bus);
      s.start(t); this.srcs.push(s); this.nodes.push(s);
    }
    if (tr.script) tr.script(this.k, this.bus, t, this);
  }
  setIntensity(x) {
    this.I = clamp(x, 0, 1);
    const now = this.ctx.currentTime;
    for (const ch of Object.values(this.ch)) {
      if (!ch.p.int) continue;
      ch.lt = this._layer(ch.p);
      ch.layer.gain.cancelScheduledValues(now); ch.layer.gain.setTargetAtTime(ch.lt, now, 0.35);
    }
  }
  fadeOut(t, fade) {
    for (const g of [this.out, this.revBus]) {
      if (!g) continue;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t + Math.max(0.02, fade));
    }
    this.stopAt = t + Math.max(0.02, fade);
  }
  tick(until) {
    if (!this.running) return;
    const c = this.c;
    while (this.next < until) {
      if (this.next >= this.stopAt) { this.running = false; break; }
      if (this.pos >= c.tl.length) {
        if (this.tr.once) { this.running = false; this.ended = true; this.endTime = this.next; break; }
        this.pos = c.loopAt;
      }
      this._step(this.pos, this.next);
      this.pos++; this.next += c.stepDur;
    }
  }
  _step(pos, t) {
    const evs = this.c.tl[pos]; if (!evs.length) return;
    const tr = this.tr, sd = this.c.stepDur, now = this.ctx.currentTime;
    let sw = 0;
    if (this.c.res === 4) {
      if (tr.swing && pos % 2 === 1) sw += tr.swing * sd;
      if (tr.swing8) { const r = pos % 4, off = tr.swing8 * 2 * sd; sw += r === 2 ? off : r ? off / 2 : 0; }
    }
    for (const e of evs) {
      const ch = this.ch[e.part], p = ch.p;
      if (ch.lt < 0.01) continue;
      let tt = t + sw + (p.nudge || 0);
      if (tr.human) tt += (this.rng() - 0.5) * 2 * tr.human;
      if (tt < now) { if (now - tt > 0.05) continue; tt = now; }
      const vel = clamp(e.vel * (tr.human ? 1 + (this.rng() - 0.5) * 0.14 : 1), 0.05, 1);
      INST[p.inst](this.k, ch.input, tt, { notes: e.n || [], dur: e.d * sd * (e.gate ?? p.gate ?? 0.92), vel, mute: e.mute, slide: e.slide, vib: e.vib, dead: e.dead, ch: e.c, st: ch.st }, p.o || {});
    }
  }
  dispose() {
    for (const s of this.srcs) { try { s.stop(); } catch (e) { /* ignore */ } }
    for (const n of this.nodes) { try { n.disconnect(); } catch (e) { /* ignore */ } }
    this.nodes = []; this.srcs = []; this.running = false;
  }
}

// ---------------------------------------------------------------------------
// Shared one-shot FX (used by stinger scripts and by the SFX bank)
// ---------------------------------------------------------------------------
export function fxRiser(k, dest, t, dur, o = {}) {
  const v = k.v(dest), end = t + dur + 0.1, vol = o.vol ?? 0.3;
  const n = v.noise(o.noise || 'white', t, end), bp = v.filter('bandpass', o.f0 || 300, o.q || 2.5), g = v.gain(0);
  bp.frequency.setValueAtTime(o.f0 || 300, t); bp.frequency.exponentialRampToValueAtTime(o.f1 || 7000, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.97); g.gain.linearRampToValueAtTime(0.0001, end);
  v.chain(n, bp, g); v.out(g);
  if (o.tone !== false) {
    const s = v.osc('sawtooth', o.p0 || 110, t, end), s2 = v.osc('sawtooth', (o.p0 || 110) * 1.5, t, end, 8), lp = v.filter('lowpass', 400, 4), sg = v.gain(0);
    for (const x of [s, s2]) x.frequency.exponentialRampToValueAtTime((o.p1 || 880) * (x === s2 ? 1.5 : 1), t + dur);
    lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(6000, t + dur);
    sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(vol * 0.35, t + dur * 0.97); sg.gain.linearRampToValueAtTime(0.0001, end);
    s.connect(lp); s2.connect(lp); v.chain(lp, sg); v.out(sg);
  }
  v.done();
}
export function fxBoom(k, dest, t, o = {}) {
  const v = k.v(dest), dur = o.dur || 1.4, vol = o.vol ?? 0.8, end = t + dur + 0.05;
  const s = v.osc('sine', o.f0 || 90, t, end), g = v.gain(0); s.frequency.exponentialRampToValueAtTime(o.f1 || 28, t + dur * 0.8);
  v.perc(g.gain, t, vol, 0.004, dur); v.chain(s, g); v.out(g);
  const n = v.noise('brown', t, end), lp = v.filter('lowpass', o.lp || 900, 0.8), ng = v.gain(0);
  lp.frequency.setValueAtTime(o.lp || 900, t); lp.frequency.exponentialRampToValueAtTime(80, t + dur);
  v.perc(ng.gain, t, vol * 0.9, 0.003, dur * 0.9); v.chain(n, lp, ng); v.out(ng);
  v.done();
}
export function fxShimmer(k, dest, t, dur, o = {}) {
  const v = k.v(dest), vol = o.vol ?? 0.2, end = t + dur + 0.05, base = o.base || 1760;
  const n = v.noise('white', t, end), hp = v.filter('highpass', 6000), g = v.gain(0);
  v.perc(g.gain, t, vol * 0.5, 0.01, dur); v.chain(n, hp, g); v.out(g);
  const ratios = [1, 1.25, 1.5, 2, 2.5, 3, 4];
  for (let i = 0; i < (o.count || 10); i++) {
    const ti = t + rand() * dur * 0.6, f = base * ratios[Math.floor(rand() * ratios.length)] * (rand() < 0.5 ? 1 : 0.5);
    const s = v.osc('sine', f, ti, ti + 0.5), sg = v.gain(0), p = v.pan(rr(-0.8, 0.8));
    v.perc(sg.gain, ti, vol * 0.25, 0.002, 0.45); v.chain(s, sg, p); v.out(p);
  }
  v.done();
}

// ---------------------------------------------------------------------------
// 5. Tracks. Written as real arrangements (sections, chords, basslines,
//    melodies). `transpose` shifts all pitched parts; `int` = intensity layer.
// ---------------------------------------------------------------------------
const rep = (s, n) => Array(n).fill(s).join(' ');
const dots = (n) => '.'.repeat(n);
const once = (c, bars, spb = 16) => c + dots(bars * spb - 1);
const every = (c, barsPer, bars, spb = 16) => rep(c + dots(barsPer * spb - 1), bars / barsPer);

export const TRACKS = {};

// ---- title: 80s Japanese city pop (Marunouchi-sadistic progression) -------------
{
  const vA = 'r:2 e5:2 f5:1 g5:3 e5:2 c5:2 a4:4 | b4:4 g4:2 e4:2 r:6 g4:1 a4:1 | c5:3 a4:3 c5:2 d5:2 f5:2 e5:2 d5:2 | e5:8 r:4 d5:2 e5:2 | '
    + 'g5:2 e5:2 f5:2 g5:4 a5:2 g5:2 e5:2 | d5:4 b4:2 g4:2 c#5:4 e5:2 g5:2 | f5:6 e5:2 d5:2 c5:2 a4:4 | b4:4 d5:2 f5:2 e5:4 r:4';
  const hook = 'r:2 c5:2 e5:2 g5:2 a5:6 g5:2 | g#5:6 f5:2 e5:2 d5:2 b4:4 | c5:2 e5:2 a5:4 g5:2 e5:2 c5:4 | d5:4 bb4:4 c5:2 d5:2 e5:2 g5:2 | '
    + 'r:2 c5:2 e5:2 g5:2 a5:6 c6:2 | b5:6 g#5:2 e5:2 f5:2 g#5:4 | a5:4 g5:2 e5:2 c5:2 d5:2 e5:4 | f5:2 e5:2 d5:4 bb4:2 c5:2 e5:4';
  TRACKS.title = {
    id: 'title', vol: 1.22, name: 'Neon Skyline — city pop', bpm: 100, transpose: 3, swing: 0.06, human: 0.004, rev: 0.12,
    delay: { beats: 0.75, fb: 0.3, mix: 0.4 },
    parts: {
      kick: { inst: 'kick', vol: 0.8, o: { tone: 'tight' } },
      snare: { inst: 'snare', vol: 0.42, rev: 0.16 },
      clap: { inst: 'clap', vol: 0.26, rev: 0.2 },
      hat: { inst: 'hat', vol: 0.2, pan: 0.25 },
      ohat: { inst: 'hat', vol: 0.15, pan: 0.25, o: { open: true } },
      crash: { inst: 'crash', vol: 0.2, pan: -0.2 },
      bass: { inst: 'slap', mode: 'rel', base: 33, vol: 0.62, rev: 0 },
      ep: { inst: 'epiano', mode: 'chord', voicing: { center: 63, n: 4, rootless: true }, vol: 0.5, pan: -0.22, rev: 0.2 },
      strings: { inst: 'strings', mode: 'chord', voicing: { center: 70, n: 3 }, vol: 0.32, pan: 0.18, rev: 0.3, o: { a: 0.5 } },
      bell: { inst: 'bell', mode: 'abs', vol: 0.62, pan: 0.05, dly: 0.2, rev: 0.22, o: { variant: 'city' } },
      lead: { inst: 'lead', mode: 'abs', oct: -1, vol: 0.28, pan: -0.05, rev: 0.2, o: { wave: 'square', wave2: 'triangle', cut: 2400, vib: 10, glide: 0.03 } },
      sparkle: { inst: 'glock', mode: 'rel', base: 72, vol: 0.13, pan: 0.35, dly: 0.35 },
    },
    sections: {
      intro: {
        bars: 4, chords: 'Fmaj7 | E7 | Am7 | Gm7 C7',
        p: {
          ep: rep('x-----x-----x---', 3) + ' x-----x-x-----x-',
          bass: 'r:16 1:6 r:2 1:2 8:2 5:2 7:2 1:6 r:2 1:2 8:2 5:2 b7:2 1:4 8:4 1:2 x:2 8:2 5:2',
          kick: 'X.......X....... X.......X....... X.......X....... X.....x.X.......',
          snare: dots(48) + '....X.....x.x.XX',
          hat: rep('x.o.x.o.x.o.x.o.', 4),
          bell: 'r:16 r:16 r:16 r:8 c5:2 d5:2 e5:2 g5:2',
        },
      },
      A: {
        bars: 8, chords: 'Fmaj7 | Em7 | Dm7 | Cmaj7 | Fmaj7 | Em7 A7 | Dm9 | G13',
        p: {
          kick: rep('X.....x.X.....x.', 8),
          snare: rep('....X..o....X..o', 7) + ' ....X...o.X.X.XX',
          hat: rep('xoxoxoxoxoxoxo.o', 8), ohat: rep('..............x.', 8), crash: once('X', 8),
          bass: '1:2 r:1 1:1 8:1 x:1 1:2 r:1 1:1 5:1 8:1 x:1 1:1 7:2',
          ep: rep('x--..x-...x--.x-', 5) + ' x--..x-.x--.x-..' + rep('x--..x-...x--.x-', 2),
          strings: rep('x---------------', 5) + ' x-------x-------' + rep('x---------------', 2),
          bell: vA,
        },
      },
      B: {
        bars: 8, chords: 'Fmaj7 | E7 | Am7 | Gm7 C7 | Fmaj7 | E7 | Am7 | Gm7 C7',
        p: {
          kick: rep('X...x...X...x...', 8), clap: rep('....x.......x...', 8),
          snare: rep('....X.......X...', 7) + ' ....X.......XoXX',
          hat: rep('x..ox..ox..ox..o', 8), ohat: rep('..x...x...x...x.', 8), crash: every('X', 4, 8),
          bass: '1:1 x:1 8:1 x:1 1:1 x:1 8:1 1:1 r:1 1:1 8:1 x:1 5:1 x:1 8:1 7:1',
          ep: 'x-.x-.x-..x-.x-.',
          strings: rep('x--------------- x--------------- x--------------- x-------x-------', 2),
          bell: hook, lead: hook,
          sparkle: rep('1:2 5:2 8:2 10:2 8:2 5:2 3:2 5:2', 8),
        },
      },
    },
    form: ['intro', 'A', 'B'], loop: 1,
  };
}

// ---- farm: pastoral 6/8 morning (flute, strings, fingerpicked guitar) ----------
{
  const melA = 'd5:6 b4:4 d5:2 | e5:4 d5:2 a4:6 | b4:4 c5:2 d5:4 e5:2 | g5:6 e5:6 | d5:6 b4:4 g4:2 | c5:4 e5:2 g5:4 e5:2 | d5:4 c5:2 b4:4 a4:2 | a4:10 r:2';
  const melB = 'e5:4 g5:2 c6:6 | b5:4 a5:2 g5:6 | e5:4 a5:2 g5:4 e5:2 | f#5:6 d5:6 | g5:4 f#5:2 e5:4 b4:2 | c5:4 e5:2 g5:4 a5:2 | g5:4 e5:2 d5:4 c5:2 | d5:6 f#5:4 a5:2';
  TRACKS.farm = {
    id: 'farm', vol: 0.92, name: 'Morning on the Farm — pastoral', bpm: 90, beats: 3, human: 0.006, rev: 0.25,
    parts: {
      flute: { inst: 'flute', mode: 'abs', vol: 0.62, rev: 0.32, pan: 0.1, o: { style: 'flute', breath: 0.2 } },
      guitar: { inst: 'acoustic', mode: 'rel', base: 50, vol: 0.62, pan: -0.25, rev: 0.18, o: { strum: 0, decay: 1.2 } },
      strings: { inst: 'strings', mode: 'chord', voicing: { center: 62, n: 3 }, vol: 0.38, rev: 0.35, o: { a: 0.8, r: 1.2, cut: 2000 } },
      bass: { inst: 'upright', mode: 'rel', base: 36, vol: 0.6 },
      glock: { inst: 'glock', mode: 'abs', vol: 0.16, pan: 0.3, rev: 0.3 },
      shaker: { inst: 'shaker', vol: 0.2, pan: 0.4 },
      kick: { inst: 'kick', vol: 0.32, o: { tone: 'soft' } },
    },
    sections: {
      intro: { bars: 2, chords: 'G | G', p: { guitar: '1:2 5:2 8:2 10:2 8:2 5:2', strings: rep('x-----------', 2) } },
      A: {
        bars: 8, chords: 'G | D/F# | Em | C | G/B | C | D | D',
        p: { flute: melA, guitar: '1:2 5:2 8:2 10:2 8:2 5:2', strings: 'x-----------', bass: '1:6 5,:6', shaker: 'x.o.o.x.o.o.', kick: 'x.....o.....' },
      },
      B: {
        bars: 8, chords: 'C | G/B | Am | D | Em | C | Am7 | D7',
        p: { flute: melB, glock: melB, guitar: '1:2 5:2 8:2 10:2 12:2 10:2', strings: 'x-----------', bass: '1:6 5,:4 1:2', shaker: 'x.o.o.x.o.o.', kick: 'x.....o.....' },
      },
    },
    form: ['intro', 'A', 'B'], loop: 1,
  };
}

// ---- park: lo-fi hip-hop (swung, dusty Rhodes, vinyl) ----------------------------
{
  const mel = 'r:2 d5:2 f5:2 a5:4 g5:2 f5:2 d5:2 | e5:6 d5:2 r:4 c5:2 d5:2 | e5:3 c5:3 a4:2 g4:8 | r:4 f4:2 a4:2 c5:2 e5:4 d5:2 | '
    + 'd5:6 c5:2 a4:2 f4:2 a4:4 | g4:4 c5:2 e5:4 g5:2 e5:2 c5:2 | d5:6 f5:2 a5:4 g5:2 f5:2 | e5:4 db5:4 bb4:4 g4:4';
  TRACKS.park = {
    id: 'park', vol: 0.68, name: 'Sunday Bench — lo-fi', bpm: 82, swing: 0.2, human: 0.008, rev: 0.14,
    fx: { lp: 5200, drive: 1.3 }, bed: 'vinyl', bedVol: 0.55,
    parts: {
      kick: { inst: 'kick', vol: 0.9, o: { tone: 'soft' } },
      snare: { inst: 'snare', vol: 0.55, rev: 0.12, o: { tone: 'lofi' } },
      hat: { inst: 'hat', vol: 0.17, pan: 0.2, o: { tone: 'dark' } },
      rim: { inst: 'snare', vol: 0.18, pan: -0.2, o: { tone: 'rim' } },
      keys: { inst: 'epiano', mode: 'chord', voicing: { center: 62, n: 4, rootless: true }, vol: 0.62, pan: -0.12, rev: 0.22, o: { roll: 0.014 } },
      bass: { inst: 'bass', mode: 'rel', base: 34, vol: 0.85, o: { wave: 'triangle', cut: 520, env: 0.8, q: 1, sub: 0.6 } },
      vibes: { inst: 'bell', mode: 'abs', vol: 0.5, pan: 0.18, rev: 0.25, dly: 0.18, o: { variant: 'vibes' } },
    },
    delay: { beats: 0.75, fb: 0.28, mix: 0.4 },
    sections: {
      A: {
        bars: 8, chords: 'Gm9 | C13 | Fmaj9 | Dm9 | Bbmaj9 | Am7 | Gm9 | C7b9',
        p: {
          kick: rep('X......x..x.....', 7) + ' X......x..x..x..', snare: rep('....X.......X...', 8), hat: rep('x.o.x.o.x.o.x.oo', 8),
          keys: 'x----------x----', bass: '1:4 r:2 1:1 1:1 r:2 5,:2 b7,:2 >:2',
        },
      },
      B: {
        bars: 8, chords: 'Gm9 | C13 | Fmaj9 | Dm9 | Bbmaj9 | Am7 | Gm9 | C7b9',
        p: {
          kick: rep('X......x..x.....', 7) + ' X......x..x..x..', snare: rep('....X.......X...', 8), hat: rep('x.o.x.o.x.o.x.oo', 8), rim: rep('..........o.....', 8),
          keys: 'x-----x---.x----', bass: '1:4 r:2 1:1 1:1 r:2 5,:2 b7,:2 >:2', vibes: mel,
        },
      },
    },
    form: ['A', 'B'], loop: 0,
  };
}

// ---- dotonbori: upbeat Shibuya-kei / J-pop (royal-road chorus) ------------------
{
  const vA = 'e5:2 d5:2 c5:2 b4:2 c5:4 g4:4 | a4:2 c#5:2 e5:2 g5:2 f5:4 e5:4 | d5:2 f5:2 a5:4 g5:2 f5:2 e5:2 d5:2 | b4:4 d5:4 g5:6 r:2 | '
    + 'e5:2 d5:2 c5:2 b4:2 c5:4 e5:4 | g5:4 f5:2 e5:2 c#5:4 a4:4 | d5:4 f5:4 b4:2 d5:2 f5:2 a5:2 | g5:8 e5:2 g5:2 bb5:4';
  const hook = 'a5:3 g5:3 a5:2 c6:4 a5:4 | b5:4 a5:2 g5:2 d5:4 g5:4 | e5:2 g5:2 b5:4 a5:2 g5:2 e5:4 | a5:6 g5:2 e5:2 c5:2 d5:2 e5:2 | '
    + 'a5:3 g5:3 a5:2 c6:4 e6:4 | d6:4 c6:2 b5:2 g5:4 b5:4 | b5:4 g5:2 e5:2 a5:2 c#6:2 e6:4 | d6:4 c6:2 a5:2 b5:4 g5:4';
  TRACKS.dotonbori = {
    id: 'dotonbori', vol: 1.2, name: 'Dotonbori Lights — Shibuya-kei', bpm: 128, transpose: 2, human: 0.003, rev: 0.1,
    delay: { beats: 0.75, fb: 0.25, mix: 0.35 },
    parts: {
      kick: { inst: 'kick', vol: 0.8, o: { tone: 'tight' } },
      snare: { inst: 'snare', vol: 0.4, rev: 0.15 },
      clap: { inst: 'clap', vol: 0.3, rev: 0.18 },
      hat: { inst: 'hat', vol: 0.18, pan: 0.3 },
      ohat: { inst: 'hat', vol: 0.14, pan: 0.3, o: { open: true, decay: 0.2 } },
      tamb: { inst: 'tamb', vol: 0.22, pan: -0.4 },
      crash: { inst: 'crash', vol: 0.22 },
      bass: { inst: 'bass', mode: 'rel', base: 33, vol: 0.62, o: { wave: 'sawtooth', cut: 800, env: 2.2, q: 2, sub: 0.4 } },
      ep: { inst: 'epiano', mode: 'chord', voicing: { center: 64, n: 4, rootless: true }, vol: 0.42, pan: -0.25, rev: 0.12 },
      brass: { inst: 'brass', mode: 'chord', voicing: { center: 67, n: 4 }, vol: 0.38, pan: 0.2, rev: 0.18 },
      strings: { inst: 'strings', mode: 'chord', voicing: { center: 72, n: 3 }, vol: 0.22, pan: 0.15, rev: 0.3 },
      lead: { inst: 'lead', mode: 'abs', oct: -1, vol: 0.5, rev: 0.16, dly: 0.12, o: { wave: 'square', wave2: 'pulse', mix2: 0.5, cut: 3600, vib: 12, glide: 0.035, level: 0.2 } },
      glock: { inst: 'glock', mode: 'abs', vol: 0.22, pan: 0.35, dly: 0.2 },
    },
    sections: {
      A: {
        bars: 8, chords: 'Cmaj7 | A7 | Dm7 | G7 | Cmaj7 | A7 | Dm7 G7 | Cmaj7 C7',
        p: {
          kick: rep('X...x...X...x...', 8), snare: rep('....X.......X...', 7) + ' ....X.......X.XX',
          hat: rep('xo.oxo.oxo.oxo.o', 8), ohat: rep('..x...x...x...x.', 8), tamb: rep('....x.......x...', 8), crash: once('X', 8),
          bass: '1:2 r:1 1:1 5:2 8:2 1:2 r:1 1:1 5:2 3:2', ep: '..x-..x-..x-..x-', lead: vA,
        },
      },
      B: {
        bars: 8, chords: 'Fmaj7 | G7 | Em7 | Am7 | Fmaj7 | G7 | Em7 A7 | Dm7 G7',
        p: {
          kick: rep('X...x...X...x...', 8), snare: rep('....X.......X...', 7) + ' ....X.......XXXX', clap: rep('....x.......x...', 8),
          hat: rep('xo.oxo.oxo.oxo.o', 8), ohat: rep('..x...x...x...x.', 8), tamb: rep('.x.x.x.x.x.x.x.x', 8), crash: every('X', 4, 8),
          bass: '1:2 8:2 1:2 8:2 1:2 8:2 1:2 8:2', ep: '..x-..x-..x-..x-', brass: '..........x-.X--',
          strings: rep('x---------------', 6) + ' x-------x------- x-------x-------', lead: hook, glock: hook,
        },
      },
      C: {
        bars: 4, chords: 'Fmaj7 | Em7 | Dm7 | G7sus4 G7',
        p: {
          kick: rep('X...x...X...x...', 4), snare: rep('....X.......X...', 3) + ' ....X...X.X.XXXX', clap: rep('....x.......x...', 4),
          hat: rep('x.x.x.x.x.x.x.x.', 4), tamb: rep('.x.x.x.x.x.x.x.x', 4), crash: once('X', 4),
          bass: '1:3 1:3 8:2 1:3 1:3 5:2', brass: rep('X--.x--.....x-x-', 3) + ' X-------X-------', ep: '..x-..x-..x-..x-',
        },
      },
    },
    form: ['A', 'B', 'C'], loop: 0,
  };
}

// ---- battle: J-rock (E minor), intensity layers -------------------------------------
{
  const leadA = 'e5:3 g5:3 b5:2 a5:2 g5:2 f#5:2 d5:2 | e5:8 r:4 b4:2 d5:2 | e5:3 g5:3 c6:2 b5:2 a5:2 g5:2 e5:2 | f#5:8 r:4 d5:2 f#5:2 | '
    + 'e5:3 g5:3 b5:2 a5:2 g5:2 f#5:2 d5:2 | e5:8 r:4 e5:2 g5:2 | a5:3 g5:3 e5:2 c5:4 e5:4 | d#5:4 f#5:4 b5:8';
  const leadB = 'g5:6 f#5:2 e5:4 d5:4 | f#5:6 e5:2 d5:4 a4:4 | b4:4 d5:4 f#5:4 a5:4 | g5:8 f#5:4 e5:4 | '
    + 'g5:6 a5:2 b5:4 g5:4 | a5:6 b5:2 c6:4 d6:4 | d#6:8 b5:4 f#5:4 | b5:8 a5:2 g5:2 f#5:2 d#5:2';
  const leadC = 'e5:8 c5:4 e5:4 | a5:12 g5:4 | g5:8 f#5:4 e5:4 | b4:16 | c5:4 e5:4 a5:4 c6:4 | b5:8 a5:4 e5:4 | f#5:8 d#5:4 f#5:4 | b5:16';
  const gA = rep('X-m.m.mmX-m.m.mm', 8), gB = rep('X-x-x-x-X-x-x-x-', 8), gC = rep('X---------------', 6) + ' X-------x-x-x-x- mmmmmmmmMMMMMMMM';
  TRACKS.battle = {
    id: 'battle', vol: 0.82, name: 'Osaka Clash — J-rock battle', bpm: 160, human: 0.003, rev: 0.08,
    delay: { beats: 0.75, fb: 0.28, mix: 0.35 },
    parts: {
      kick: { inst: 'kick', vol: 0.85, o: { tone: 'rock' } },
      kick2: { inst: 'kick', vol: 0.5, o: { tone: 'rock' }, int: [0.72, 0.9] },
      snare: { inst: 'snare', vol: 0.55, rev: 0.12, o: { tone: 'rock' } },
      hat: { inst: 'hat', vol: 0.18, pan: 0.3 },
      ride: { inst: 'ride', vol: 0.15, pan: 0.35, int: [0.5, 0.65] },
      crash: { inst: 'crash', vol: 0.28, int: [0.18, 0.32] },
      tom: { inst: 'tom', vol: 0.45, pan: -0.15 },
      bass: { inst: 'bass', mode: 'rel', base: 28, vol: 0.55, o: { wave: 'sawtooth', cut: 900, env: 2, q: 2, drive: 2.2 } },
      gtrL: { inst: 'guitar', mode: 'chord', voicing: { type: 'root', base: 40 }, vol: 0.5, pan: -0.75, amp: { drive: 4 } },
      gtrR: { inst: 'guitar', mode: 'chord', voicing: { type: 'root', base: 40 }, vol: 0.5, pan: 0.75, nudge: 0.007, amp: { drive: 4.5, cab: 4400 }, int: [0.18, 0.35] },
      strings: { inst: 'strings', mode: 'chord', voicing: { center: 67, n: 3 }, vol: 0.25, rev: 0.25, int: [0.3, 0.5] },
      lead: { inst: 'lead', mode: 'abs', vol: 0.5, rev: 0.18, dly: 0.2, int: [0.42, 0.6], o: { wave: 'sawtooth', wave2: 'square', cut: 3600, vib: 18, glide: 0.04, level: 0.2 } },
      lgtr: { inst: 'lead', mode: 'abs', oct: -1, vol: 0.42, pan: 0.2, rev: 0.1, int: [0.62, 0.78], amp: { drive: 6, post: 0.22, cab: 4200 }, o: { cut: 5000, vib: 22, det: 4, level: 0.3 } },
      arp: { inst: 'pluck', mode: 'rel', base: 64, vol: 0.22, pan: -0.3, dly: 0.25, int: [0.75, 0.92], o: { decay: 0.18 } },
    },
    sections: {
      intro: {
        bars: 2, chords: 'Em | Em',
        p: {
          kick: 'X............... X.......X.X.X.X.', crash: once('X', 2), tom: dots(16) + ' 1.1.2.2.3.3.4.4.',
          gtrL: 'X--------------- X-------X-X-XXXX', gtrR: 'X--------------- X-------X-X-XXXX', bass: '1:16 1:8 1:2 1:2 1:2 1:2',
        },
      },
      A: {
        bars: 8, chords: 'Em | Em | C | D | Em | Em | C | B',
        p: {
          kick: rep('X.....x.X.x.....', 8), kick2: rep('..x...x...x...x.', 8), snare: rep('....X.......X...', 7) + ' ....X...X.X.XXXX',
          hat: rep('x.x.x.x.x.x.x.x.', 8), ride: rep('x.x.x.x.x.x.x.x.', 8), crash: once('X', 8),
          bass: '1:2 1:2 1:2 1:2 1:2 1:2 1:2 1:2', gtrL: gA, gtrR: gA, lead: leadA, arp: '1:1 5:1 8:1 5:1',
        },
      },
      B: {
        bars: 8, chords: 'C | D | Bm | Em | C | D | B | B',
        p: {
          kick: rep('X...X...X...X...', 8), kick2: rep('..x...x...x...x.', 8), snare: rep('....X.......X...', 7) + ' ....X.......XXXX',
          hat: rep('x.x.x.x.x.x.x.x.', 8), ride: rep('X.x.X.x.X.x.X.x.', 8), crash: every('X', 2, 8),
          bass: '1:2 1:2 8:2 1:2 1:2 8:2 1:2 5:2', gtrL: gB, gtrR: gB, strings: 'x---------------', lead: leadB, lgtr: leadB, arp: '1:1 5:1 8:1 10:1 8:1 5:1 1:1 5:1',
        },
      },
      C: {
        bars: 8, chords: 'Am | Am | Em | Em | Am | Am | B | B',
        p: {
          kick: rep('X.........x.....', 8), snare: rep('........X.......', 7) + ' oooooooxxxxXXXXX',
          hat: rep('x.x.x.x.x.x.x.x.', 8), ride: rep('x...x...x...x...', 8), crash: every('X', 4, 8),
          bass: '1:8 1:4 5,:4', gtrL: gC, gtrR: gC, strings: 'x---------------', lead: leadC, lgtr: leadC, arp: '1:2 5:2 8:2 5:2',
        },
      },
    },
    form: ['intro', 'A', 'B', 'C'], loop: 1,
  };
}

// ---- battle_punk: thrash / punk-metal for Team Metallica (E, 184 bpm) -----------------
{
  const G = (n, d = 2, m = 'm') => `${n}:${d}${m}`;
  const gal = (n) => `${n}:2m ${n}:1m ${n}:1m`; // gallop: 8th + two 16ths
  const R1 = `${gal('e2')} ${gal('e2')} ${gal('e2')} f2:2 e2:2`;
  const R2 = `${gal('e2')} ${gal('e2')} g2:2 f2:2 e2:2 bb2:2`;
  const R4 = `${gal('g2')} ${gal('g2')} ${gal('a2')} bb2:2 b2:2`;
  const R8 = 'c3:2 b2:2 bb2:2 a2:2 g2:2 f2:2 e2:4';
  const riffA = [R1, R2, R1, R4, R1, R2, R1, R8].join(' | ');
  const o8 = (n) => `${n}:2! ${n}:2 ${n}:2 ${n}:2`;
  const riffB = [o8('e2') + ' ' + o8('e2'), o8('c3') + ' ' + o8('d3'), o8('e2') + ' ' + o8('e2'), 'g2:2! g2:2 g2:2 g2:2 a2:2! a2:2 bb2:2 b2:2',
    o8('e2') + ' ' + o8('e2'), o8('c3') + ' ' + o8('d3'), o8('e2') + ' ' + o8('e2'), 'c3:4! b2:4! bb2:4! b2:4!'].join(' | ');
  const C1 = 'e2:3m e2:3m e2:4m e2:3m e2:3m', C2 = 'e2:3m e2:3m e2:4m f2:6!', C4 = 'e2:3m e2:3m e2:4m bb2:6!';
  const riffC = [C1, C2, C1, C4, C1, C2, rep(G('e2', 1), 8) + ' ' + rep(G('f2', 1), 8), rep(G('g2', 1), 8) + ' ' + rep('bb2:1', 4) + ' ' + rep('b2:1!', 4)].join(' | ');
  const riffI = 'e2:16! | r:4 e2:2m e2:2m e2:2m e2:2m e2:2! e2:2!';
  const l1 = 'b4:4 e5:4 g5:4 f#5:4 | e5:4 g5:4 a5:8 | b5:4 a5:4 g5:4 f#5:4 | g5:8 f#5:4 d5:4 | b4:4 e5:4 g5:4 f#5:4 | e5:4 g5:4 a5:4 b5:4 | c6:4 b5:4 a5:4 g5:4 | f#5:8 d#5:8';
  const l2 = 'd5:4 g5:4 b5:4 a5:4 | g5:4 b5:4 c6:8 | d6:4 c6:4 b5:4 a5:4 | b5:8 a5:4 f#5:4 | d5:4 g5:4 b5:4 a5:4 | g5:4 b5:4 c6:4 d6:4 | e6:4 d6:4 c6:4 b5:4 | a5:8 f#5:8';
  const amp = { drive: 6, scoop: -7, cab: 4600 };
  TRACKS.battle_punk = {
    id: 'battle_punk', vol: 0.8, name: 'Master of Muppets — Team Metallica thrash', bpm: 184, human: 0.002, rev: 0.06,
    parts: {
      kick: { inst: 'kick', vol: 0.8, o: { tone: 'metal' } },
      kick2: { inst: 'kick', vol: 0.5, o: { tone: 'metal' }, int: [0.55, 0.72] },
      snare: { inst: 'snare', vol: 0.55, rev: 0.1, o: { tone: 'metal' } },
      hat: { inst: 'hat', vol: 0.16, pan: 0.3 },
      crash: { inst: 'crash', vol: 0.26, pan: -0.25, int: [0.15, 0.3] },
      china: { inst: 'crash', vol: 0.24, pan: 0.3, o: { tone: 'china' } },
      tom: { inst: 'tom', vol: 0.45 },
      gtrL: { inst: 'guitar', mode: 'abs', vol: 0.5, pan: -0.8, amp },
      gtrR: { inst: 'guitar', mode: 'abs', vol: 0.5, pan: 0.8, nudge: 0.006, amp: { ...amp, drive: 6.5, cab: 4300 } },
      bass: { inst: 'bass', mode: 'abs', oct: -1, vol: 0.5, o: { wave: 'sawtooth', cut: 800, env: 2.5, q: 2, drive: 3 } },
      gang: { inst: 'gang', vol: 0.7, rev: 0.25 },
      lead1: { inst: 'lead', mode: 'abs', vol: 0.36, pan: -0.3, rev: 0.12, int: [0.45, 0.62], amp: { drive: 7, post: 0.22, cab: 4200 }, o: { vib: 24, det: 3, cut: 5200, level: 0.3 } },
      lead2: { inst: 'lead', mode: 'abs', vol: 0.32, pan: 0.3, rev: 0.12, nudge: 0.01, int: [0.6, 0.78], amp: { drive: 7, post: 0.22, cab: 4200 }, o: { vib: 24, det: 3, cut: 5200, level: 0.3 } },
    },
    sections: {
      intro: {
        bars: 2,
        p: {
          gtrL: riffI, gtrR: riffI, bass: riffI, gang: 'X...X...X....... ................', crash: 'X...X...X....... ................',
          kick: 'X...X...X....... X.......X.X.XXXX', snare: dots(16) + ' ....X.X.XXXXXXXX', tom: dots(16) + ' 1.2.............',
        },
      },
      A: {
        bars: 8,
        p: {
          gtrL: riffA, gtrR: riffA, bass: riffA, kick: rep('X...X...X...X...', 8), snare: rep('..x...x...x...x.', 7) + ' ..x...x...XXXXXX',
          hat: rep('x.x.x.x.x.x.x.x.', 8), crash: once('X', 8), gang: rep(dots(16) + ' ....X.......X...', 4),
        },
      },
      B: {
        bars: 8,
        p: {
          gtrL: riffB, gtrR: riffB, bass: riffB, kick: rep('X.x.X.x.X.x.X.x.', 8), kick2: rep('.x.x.x.x.x.x.x.x', 8),
          snare: rep('....X.......X...', 7) + ' ....X...X.X.XXXX', crash: rep('X...X...X...X...', 8), gang: rep('X...............', 8),
          lead1: l1, lead2: l2,
        },
      },
      C: {
        bars: 8,
        p: {
          gtrL: riffC, gtrR: riffC, bass: riffC, kick: rep('X..x..x...x..x..', 6) + ' xxxxxxxxxxxxxxxx XXXXXXXXXXXXXXXX', snare: rep('........X.......', 6) + ' ....X.......X... ....X...XXXXXXXX',
          china: rep('X.......X.......', 6) + ' X...X...X...X... X.X.X.X.X.X.X.X.', gang: rep('........X.......', 6) + dots(32),
        },
      },
    },
    form: ['intro', 'A', 'B', 'C'], loop: 1,
  };
}

// ---- boss: epic (choir + taiko + guitars + brass), D minor ------------------------
{
  const melA = 'd5:6 e5:2 f5:4 a5:4 | g5:4 f5:4 e5:4 d5:4 | f5:6 d5:2 bb4:4 d5:4 | f5:8 g5:4 a5:4 | bb5:6 a5:2 g5:4 d5:4 | g5:6 a5:2 bb5:4 c6:4 | c#6:8 a5:4 e5:4 | a5:16';
  const melB = 'a5:6 f5:2 d5:4 f5:4 | bb5:6 a5:2 f5:4 d5:4 | c6:6 a5:2 f5:4 a5:4 | g5:8 e5:4 c5:4 | d5:4 g5:4 bb5:4 d6:4 | d6:6 c6:2 bb5:4 f5:4 | e5:4 a5:4 c#6:4 e6:4 | e6:8 c#6:4 a5:4';
  const ost = '1:1 1:1 3:1 1:1 5:1 1:1 3:1 1:1';
  TRACKS.boss = {
    id: 'boss', vol: 0.78, name: 'Soulstone Titan — boss', bpm: 140, human: 0.003, rev: 0.16,
    parts: {
      taiko: { inst: 'taiko', vol: 0.75, rev: 0.25 },
      shime: { inst: 'taiko', vol: 0.3, pan: 0.3, o: { size: 'small' } },
      ka: { inst: 'ka', vol: 0.3, pan: -0.35 },
      kick: { inst: 'kick', vol: 0.6, o: { tone: 'deep' } },
      kick2: { inst: 'kick', vol: 0.4, o: { tone: 'rock' }, int: [0.6, 0.8] },
      snare: { inst: 'snare', vol: 0.45, rev: 0.2, o: { tone: 'rock' } },
      crash: { inst: 'crash', vol: 0.26 },
      choir: { inst: 'choir', mode: 'chord', voicing: { center: 62, n: 4 }, vol: 0.62, rev: 0.4, o: { a: 0.45, r: 1 } },
      strings: { inst: 'strings', mode: 'rel', base: 50, vol: 0.45, pan: -0.2, rev: 0.2, gate: 0.6, o: { a: 0.015, r: 0.08, cut: 3200, level: 0.4 } },
      gtrL: { inst: 'guitar', mode: 'chord', voicing: { type: 'root', base: 38 }, vol: 0.42, pan: -0.7, amp: { drive: 5 } },
      gtrR: { inst: 'guitar', mode: 'chord', voicing: { type: 'root', base: 38 }, vol: 0.42, pan: 0.7, nudge: 0.007, amp: { drive: 5.5, cab: 4300 } },
      bass: { inst: 'bass', mode: 'rel', base: 26, vol: 0.5, o: { cut: 700, env: 1.5, q: 2, drive: 2, sub: 0.5 } },
      brass: { inst: 'brass', mode: 'abs', vol: 0.55, rev: 0.3, dly: 0.1, o: { cut: 3000, level: 0.35 } },
      hiStr: { inst: 'strings', mode: 'abs', vol: 0.3, pan: 0.2, rev: 0.35, int: [0.55, 0.75], o: { a: 0.08, cut: 4000 } },
      bell: { inst: 'bell', mode: 'chord', voicing: { center: 74, n: 3 }, vol: 0.3, rev: 0.4, o: { variant: 'tubular' } },
    },
    delay: { beats: 1, fb: 0.25, mix: 0.3 },
    sections: {
      intro: {
        bars: 4, chords: 'Dm | Dm | Bb | A',
        p: {
          taiko: rep('X.......X.......', 2) + ' ' + rep('X..x..x.X.......', 2), choir: rep('x---------------', 4), bell: 'x' + dots(63),
          strings: 'r:32 ' + rep(ost, 4), bass: 'r:32 1:16 1:16', ka: dots(48) + ' ..k...k...k.kkkk',
        },
      },
      A: {
        bars: 8, chords: 'Dm | Dm | Bb | Bb | Gm | Gm | A | A',
        p: {
          taiko: rep('X..x..x.X.x.x...', 8), ka: rep('..k...k...k...k.', 8), kick: rep('X.......X.......', 8), crash: once('X', 8),
          choir: 'x---------------', strings: ost, gtrL: rep('M.m.m.m.M.m.m.m.', 3) + ' X---------------', gtrR: rep('M.m.m.m.M.m.m.m.', 3) + ' X---------------',
          bass: '1:2 1:2 1:2 1:2 1:2 1:2 1:2 1:2', brass: melA, hiStr: melA, bell: once('x', 8),
        },
      },
      B: {
        bars: 8, chords: 'Dm | Bb | F | C | Gm | Bb | A | A7',
        p: {
          taiko: rep('X.x.X.x.X.x.X.xx', 8), shime: rep('x.o.x.o.x.o.x.o.', 8), kick: rep('X...X...X...X...', 8), kick2: rep('..x...x...x...x.', 8),
          snare: rep('....X.......X...', 7) + ' ....X...X.X.XXXX', crash: every('X', 2, 8),
          choir: 'x---------------', strings: ost, gtrL: 'X---x-x-X---x-x-', gtrR: 'X---x-x-X---x-x-', bass: '1:2 1:2 8:2 1:2 1:2 1:2 8:2 1:2',
          brass: melB, hiStr: melB, bell: once('x', 8),
        },
      },
      C: {
        bars: 4, chords: 'Dm | Eb | Dm | Eb',
        p: {
          taiko: rep('X..xX..xX.xxX.xx', 3) + ' X.x.X.x.XxXxXXXX', shime: rep('x.x.x.x.x.x.x.x.', 4), ka: rep('k.k...k.k...k.k.', 4),
          choir: 'x---------------', bass: '1:16', strings: ost,
        },
      },
    },
    form: ['intro', 'A', 'B', 'C'], loop: 1,
  };
}

// ---- safari: sparse koto / shakuhachi over a drone (D yo scale, 32nd grid) ---------
{
  const kotoA = 'a4:4 b4:4 d5:8 r:8 e5:4 d5:4 | b4:12 r:12 a4:4 g4:4 | d5:1 e5:1 g5:1 a5:1 b5:12 r:8 a5:4 g5:4 | e5:8 d5:8 r:16 | '
    + 'b4:4 d5:4 e5:8 r:4 d5:4 b4:8 | a4:8 g4:8 r:8 e4:4 g4:4 | a4:16 r:8 b4:4 a4:4 | d5:1 e5:1 g5:1 a5:1 b5:1 d6:1 e6:2 d6:24';
  const kotoB = 'r:24 d5:2 e5:2 g5:4 | r:16 b4:8 a4:8 | r:24 g5:4 e5:4 | r:16 d5:16 | r:24 a4:4 b4:4 | r:32 | r:16 b4:4 d5:4 e5:8 | d5:1 e5:1 g5:1 a5:1 b5:4 a5:24';
  const fluteB = 'a4:16 b4:8 a4:8 | g4:24 r:8 | e4:8 g4:8 a4:16 | d5:24 r:8 | b4:16 a4:8 g4:8 | a4:16 r:16 | e4:12 g4:4 a4:8 b4:8 | a4:32';
  TRACKS.safari = {
    id: 'safari', vol: 1.55, name: 'Grass Sea — safari koto', bpm: 72, res: 8, human: 0.01, rev: 0.35,
    delay: { beats: 0.75, fb: 0.35, mix: 0.4 },
    parts: {
      koto: { inst: 'koto', mode: 'abs', vol: 0.62, pan: 0.15, dly: 0.25 },
      koto2: { inst: 'koto', mode: 'rel', base: 38, vol: 0.45, pan: -0.2, o: { decay: 2 } },
      drone: { inst: 'pad', mode: 'chord', voicing: { center: 57, n: 3 }, vol: 0.5, rev: 0.5, o: { wave: 'triangle', a: 1.4, r: 2, cut: 1200, level: 0.3, detune: 6 } },
      flute: { inst: 'flute', mode: 'abs', vol: 0.5, pan: -0.1, rev: 0.45, dly: 0.15, o: { style: 'shaku' } },
      chime: { inst: 'glock', mode: 'rel', base: 74, vol: 0.12, pan: 0.4, dly: 0.4 },
    },
    sections: {
      A: {
        bars: 8, chords: 'Dsus2 | Dsus2 | G/D | G/D | Bm | G | Asus4 | Dsus2',
        p: { koto: kotoA, koto2: '1:16 5:16 r:32', drone: 'x' + '-'.repeat(31) },
      },
      B: {
        bars: 8, chords: 'G | Dsus2 | Em7 | Dsus2 | Bm | G | Em7 | Asus4',
        p: { koto: kotoB, flute: fluteB, koto2: '1:32 r:32', drone: 'x' + '-'.repeat(31), chime: 'r:56 5:4 8:4' },
      },
    },
    form: ['A', 'B'], loop: 0,
  };
}

// ---- night: lo-fi jazz (Rhodes, brushes, walking upright, vibes) -------------------
{
  const vib = 'e5:4 g5:2 b5:4 a5:2 g5:4 | c5:6 b4:2 c5:2 e5:6 | f5:4 e5:2 d5:2 c5:4 a4:4 | b4:6 e5:2 d5:8 | '
    + 'g5:4 f#5:2 e5:2 d5:4 b4:4 | c#5:4 e5:2 g5:2 bb5:8 | a5:4 f5:4 e5:4 d5:4 | d5:6 bb4:2 a4:8';
  TRACKS.night = {
    id: 'night', vol: 0.78, name: 'Neon Canal — late-night lo-fi jazz', bpm: 76, transpose: -2, swing8: 0.3, human: 0.008, rev: 0.2,
    fx: { lp: 6500 }, bed: 'vinyl', bedVol: 0.35,
    parts: {
      kick: { inst: 'kick', vol: 0.45, o: { tone: 'soft' } },
      brush: { inst: 'snare', vol: 0.5, pan: 0.1, rev: 0.15, o: { tone: 'brush' } },
      ride: { inst: 'ride', vol: 0.16, pan: 0.35, o: { decay: 0.7 } },
      foot: { inst: 'hat', vol: 0.12, pan: 0.3, o: { tone: 'dark', decay: 0.03 } },
      rhodes: { inst: 'epiano', mode: 'chord', voicing: { center: 62, n: 4, rootless: true }, vol: 0.62, pan: -0.15, rev: 0.25, o: { roll: 0.01 } },
      upright: { inst: 'upright', mode: 'rel', base: 31, vol: 0.85 },
      vibes: { inst: 'bell', mode: 'abs', vol: 0.5, pan: 0.2, rev: 0.3, dly: 0.12, o: { variant: 'vibes' } },
    },
    delay: { beats: 1.5, fb: 0.25, mix: 0.3 },
    sections: {
      A: {
        bars: 8, chords: 'Fmaj9 | E7#9 | Am9 | Gm9 C13 | Fmaj9 | Bb13 | Em7 A7b9 | Dm9 G13',
        p: {
          kick: 'o.......o.......', brush: '....x.......x...', ride: 'x...x.x.x...x.x.', foot: '....x.......x...',
          rhodes: 'x-----x-x-----..', upright: '1:4 3:4 5:4 >:4',
        },
      },
      B: {
        bars: 8, chords: 'Cmaj9 | Am9 | Dm9 | G13 | Em7 | A7b9 | Dm9 G13 | Gm9 C13',
        p: {
          kick: 'o.......o.......', brush: '....x.......x..o', ride: 'x...x.x.x...x.x.', foot: '....x.......x...',
          rhodes: 'x--.....x-x-----', upright: '1:4 2:4 3:4 >:4', vibes: vib,
        },
      },
    },
    form: ['A', 'B'], loop: 0,
  };
}

// ---- tension: suspense pulses + drones (C phrygian), intensity adds ticks/drums ----
{
  TRACKS.tension = {
    id: 'tension', vol: 1.0, name: 'Something Is Watching — tension', bpm: 90, human: 0.002, rev: 0.3,
    delay: { beats: 0.75, fb: 0.45, mix: 0.45 },
    parts: {
      drone: { inst: 'drone', mode: 'chord', voicing: { center: 50, n: 3 }, vol: 0.6, rev: 0.3, o: { cut: 600, rate: 0.11 } },
      pulse: { inst: 'bass', mode: 'rel', base: 36, vol: 0.5, o: { wave: 'square', cut: 260, env: 2.5, q: 6 } },
      heart: { inst: 'kick', vol: 0.5, o: { tone: 'soft' } },
      tick: { inst: 'hat', vol: 0.13, pan: 0.4, int: [0.2, 0.4], o: { tone: 'dark', decay: 0.02 } },
      box: { inst: 'glock', mode: 'abs', vol: 0.12, pan: -0.35, dly: 0.5, rev: 0.4 },
      swell: { inst: 'strings', mode: 'chord', voicing: { center: 74, n: 3 }, vol: 0.3, rev: 0.5, o: { a: 4, r: 1.5, cut: 3000 } },
      boom: { inst: 'taiko', vol: 0.55, rev: 0.4 },
      tom: { inst: 'tom', vol: 0.32, int: [0.6, 0.8] },
      hat16: { inst: 'hat', vol: 0.1, pan: -0.3, int: [0.65, 0.85] },
    },
    sections: {
      A: {
        bars: 8, chords: 'Cm | Cm | Ab/C | Ab/C | Cm | Cm | Db/C | Db/C',
        p: {
          drone: 'x' + '-'.repeat(63), pulse: '1:2 1:2 1:2 1:2 1:2 1:2 b2:2 1:2', heart: 'X..x............', tick: 'x...x...x...x...',
          box: 'r:8 eb6:4 r:4 | r:16 | r:4 d6:4 r:8 | r:16 | r:8 g6:4 r:4 | r:16 | r:4 ab5:4 r:8 | r:16',
          swell: 'x' + '-'.repeat(63), boom: every('X', 4, 8), tom: rep('....3.....3.4...', 8), hat16: 'xxoxxxoxxxoxxxox',
        },
      },
      B: {
        bars: 8, chords: 'Fm | Fm | Db | Db | Cm | Cm | G7b9 | G7b9',
        p: {
          drone: 'x' + '-'.repeat(63), pulse: '1:2 1:2 1:2 b2:2 1:2 1:2 1:2 b2:2', heart: 'X..x....X..x....', tick: 'x.x.x.x.x.x.x.x.',
          box: 'r:16 | r:8 c6:4 r:4 | r:16 | r:4 b5:4 r:8 | r:16 | r:8 db6:4 r:4 | r:16 | r:12 d6:4',
          swell: 'x' + '-'.repeat(63), boom: every('X', 4, 8), tom: rep('....3.....3.4.4.', 8), hat16: 'xxoxxxoxxxoxxxox',
        },
      },
    },
    form: ['A', 'B'], loop: 0,
  };
}

// ---- league: stadium anthem (stomp-stomp-clap, power chords, "whoa-oh" chant) -------
{
  const brassA = 'f#5:6 e5:2 d5:4 a4:4 | e5:6 f#5:2 e5:4 c#5:4 | d5:6 c#5:2 b4:4 f#5:4 | g5:8 f#5:4 e5:4 | f#5:6 e5:2 d5:4 f#5:4 | a5:6 g5:2 f#5:4 e5:4 | d5:4 e5:4 g5:4 b5:4 | a5:12 r:4';
  const chant = 'b4:6 b4:2 d5:4 b4:4 | a4:6 a4:2 c#5:4 e5:4 | f#5:6 e5:2 d5:8 | b4:6 c#5:2 d5:4 f#5:4 | g5:6 f#5:2 e5:4 d5:4 | e5:6 f#5:2 e5:4 c#5:4 | d5:16 | r:8 a4:4 a4:4';
  TRACKS.league = {
    id: 'league', vol: 0.74, name: 'Champions of Kansai — league anthem', bpm: 120, human: 0.003, rev: 0.16,
    parts: {
      stomp: { inst: 'stomp', vol: 0.75, rev: 0.35 },
      clap: { inst: 'clap', vol: 0.5, rev: 0.4 },
      kick: { inst: 'kick', vol: 0.7, o: { tone: 'rock' } },
      snare: { inst: 'snare', vol: 0.5, rev: 0.3, o: { tone: 'rock' } },
      hat: { inst: 'hat', vol: 0.17, pan: 0.3 },
      crash: { inst: 'crash', vol: 0.26 },
      tom: { inst: 'tom', vol: 0.45 },
      gtrL: { inst: 'guitar', mode: 'chord', voicing: { type: 'root', base: 38 }, vol: 0.42, pan: -0.7, amp: { drive: 4 } },
      gtrR: { inst: 'guitar', mode: 'chord', voicing: { type: 'root', base: 38 }, vol: 0.42, pan: 0.7, nudge: 0.007, amp: { drive: 4.5, cab: 4300 } },
      bass: { inst: 'bass', mode: 'rel', base: 33, vol: 0.55, o: { cut: 800, env: 2, q: 2, drive: 1.6 } },
      brass: { inst: 'brass', mode: 'abs', vol: 0.55, rev: 0.25, o: { cut: 3200, level: 0.35 } },
      stab: { inst: 'brass', mode: 'chord', voicing: { center: 66, n: 4 }, vol: 0.4, rev: 0.25 },
      chant: { inst: 'choir', mode: 'abs', vol: 0.8, rev: 0.35, o: { vowel: 'o', a: 0.07, r: 0.25, level: 0.4 } },
      chantLo: { inst: 'choir', mode: 'abs', oct: -1, vol: 0.6, rev: 0.35, o: { vowel: 'o', a: 0.07, r: 0.25, level: 0.4 } },
      strings: { inst: 'strings', mode: 'chord', voicing: { center: 69, n: 3 }, vol: 0.25, rev: 0.3 },
      gang: { inst: 'gang', vol: 0.6, rev: 0.4, o: { voices: 6 } },
    },
    sections: {
      intro: {
        bars: 4, chords: 'D | D | D | D',
        p: { stomp: rep('X.X.....X.X.....', 4), clap: rep('....X.......X...', 4), gang: dots(48) + ' ........X...X...', crash: dots(48) + ' ............X...' },
      },
      A: {
        bars: 8, chords: 'D | A | Bm | G | D | A | G | A',
        p: {
          stomp: rep('X.X.....X.X.....', 8), clap: rep('....X.......X...', 8), kick: rep('X.X.....X.X.....', 8), snare: rep('....X.......X...', 7) + ' ....X.......XXXX',
          hat: rep('x.x.x.x.x.x.x.x.', 8), crash: once('X', 8), tom: dots(112) + ' ........1.2.3.4.',
          gtrL: 'X-------x-x-x-x-', gtrR: 'X-------x-x-x-x-', bass: '1:2 1:2 1:2 1:2 1:2 1:2 1:2 1:2', brass: brassA,
        },
      },
      B: {
        bars: 8, chords: 'G | A | D | Bm | G | A | D | D',
        p: {
          stomp: rep('X.X.....X.X.....', 8), clap: rep('....X.......X...', 8), kick: rep('X...X...X...X...', 8), snare: rep('....X.......X...', 7) + ' ....X.......X...',
          hat: rep('x.x.x.x.x.x.x.x.', 8), crash: every('X', 2, 8), gtrL: 'X-x-x-x-X-x-x-x-', gtrR: 'X-x-x-x-X-x-x-x-',
          bass: '1:2 1:2 8:2 1:2 1:2 1:2 8:2 1:2', chant, chantLo: chant, stab: '..........x-.X--', strings: 'x---------------',
          gang: dots(112) + ' ........X...X...',
        },
      },
    },
    form: ['intro', 'A', 'B'], loop: 1,
  };
}

// ---- dojo: taiko ensemble + shakuhachi + koto (D "in" scale) ----------------------
{
  const fl = 'a4:8 bb4:4 a4:4 | g4:12 r:4 | d4:4 eb4:4 g4:8 | a4:12 r:4 | d5:8 bb4:4 a4:4 | g4:4 a4:4 bb4:8 | a4:6 g4:2 eb4:8 | d4:16';
  const ko = 'd5:2 d5:2 a4:4 bb4:4 a4:4 | g4:4 a4:2 bb4:2 d5:8 | eb5:4 d5:4 bb4:4 a4:4 | g4:12 r:4 | d5:2 d5:2 a4:4 bb4:4 d5:4 | eb5:8 d5:4 bb4:4 | a4:4 g4:4 eb4:4 g4:4 | d4:1 eb4:1 g4:1 a4:1 bb4:1 d5:1 eb5:1 g5:1 a5:8';
  TRACKS.dojo = {
    id: 'dojo', vol: 1.12, name: 'Iron Sole Dojo — taiko', bpm: 100, human: 0.004, rev: 0.25,
    parts: {
      taiko: { inst: 'taiko', vol: 0.75, rev: 0.25 },
      shime: { inst: 'taiko', vol: 0.32, pan: 0.3, o: { size: 'small' } },
      ka: { inst: 'ka', vol: 0.32, pan: -0.35 },
      flute: { inst: 'flute', mode: 'abs', vol: 0.62, rev: 0.4, pan: 0.05, o: { style: 'shaku' } },
      koto: { inst: 'koto', mode: 'abs', vol: 0.62, pan: 0.2, rev: 0.2 },
      drone: { inst: 'pad', mode: 'chord', voicing: { center: 50, n: 2 }, vol: 0.42, rev: 0.3, o: { wave: 'triangle', a: 0.9, r: 1.5, cut: 900, level: 0.3 } },
    },
    sections: {
      intro: {
        bars: 2, chords: 'D5 | D5',
        p: { taiko: 'X...X...X.X.X... X.x.X.x.X.x.XxXx', ka: '..k...k...k...k. ..k...k...kkkkkk', drone: 'x---------------' },
      },
      A: {
        bars: 8, chords: 'D5 | D5 | Gm | D5 | Bb | Gm | Eb | D5',
        p: { taiko: rep('X.....x.X...x...', 7) + ' X.x.X.x.X.xxXxXx', shime: rep('x.o.x.o.x.o.x.o.', 8), ka: rep('..k...k...k...k.', 8), flute: fl, drone: 'x---------------' },
      },
      B: {
        bars: 8, chords: 'D5 | Gm | Eb | Gm | D5 | Eb | Gm | D5',
        p: { taiko: rep('X.x.X...X.x.X.x.', 7) + ' X.x.X.x.XxXxXXXX', shime: rep('x.x.x.x.x.x.x.x.', 8), ka: rep('k.k...k...k.k...', 8), koto: ko, drone: 'x---------------' },
      },
    },
    form: ['intro', 'A', 'B'], loop: 1,
  };
}

// ---- dinner: cozy acoustic (fingerpicked guitar, flute whistle, glock) -------------
{
  const melA = 'e5:3 d5:1 c5:4 g4:4 a4:4 | c5:6 b4:2 a4:4 g4:4 | f5:3 e5:1 d5:4 a4:4 c5:4 | b4:8 r:4 g4:2 a4:2 | '
    + 'b4:3 c5:1 d5:4 e5:4 g5:4 | e5:6 c#5:2 a4:8 | d5:3 e5:1 f5:4 a5:4 g5:4 | f5:4 e5:4 d5:8';
  const melB = 'a5:6 g5:2 e5:4 c5:4 | g5:6 e5:2 d5:4 b4:4 | f5:6 e5:2 d5:4 a4:4 | e5:8 g5:4 e5:4 | a5:6 c6:2 b5:4 a5:4 | g5:4 e5:4 c#5:4 e5:4 | f5:4 a5:4 g5:4 f5:4 | e5:12 r:4';
  TRACKS.dinner = {
    id: 'dinner', vol: 0.86, name: 'Kotatsu Supper — cozy acoustic', bpm: 96, transpose: -5, swing: 0.1, human: 0.007, rev: 0.18,
    parts: {
      pick: { inst: 'acoustic', mode: 'rel', base: 48, vol: 0.62, pan: -0.25, o: { strum: 0, decay: 1.1 } },
      strum: { inst: 'acoustic', mode: 'chord', voicing: { center: 62, n: 4, bass: 48 }, vol: 0.5, pan: 0.25, o: { strum: 0.014 } },
      bass: { inst: 'upright', mode: 'rel', base: 36, vol: 0.7 },
      flute: { inst: 'flute', mode: 'abs', vol: 0.55, rev: 0.25, pan: 0.05, o: { style: 'flute', breath: 0.22 } },
      glock: { inst: 'glock', mode: 'abs', vol: 0.14, pan: 0.35, rev: 0.25 },
      shaker: { inst: 'shaker', vol: 0.22, pan: 0.4 },
      kick: { inst: 'kick', vol: 0.4, o: { tone: 'soft' } },
      rim: { inst: 'snare', vol: 0.26, pan: -0.1, o: { tone: 'rim' } },
    },
    sections: {
      A: {
        bars: 8, chords: 'Cmaj7 | Am7 | Dm7 | G7 | Em7 | A7 | Dm7 | G7',
        p: { pick: '1:2 5:2 8:2 10:2 12:2 10:2 8:2 5:2', bass: '1:6 5,:2 1:4 5,:4', flute: melA, shaker: 'x.o.x.o.x.o.x.o.', kick: 'X.......x.......', rim: '....x.......x...' },
      },
      B: {
        bars: 8, chords: 'Fmaj7 | Em7 | Dm7 | Cmaj7 | Fmaj7 | Em7 A7 | Dm7 G7 | Cmaj7',
        p: {
          pick: '1:2 5:2 8:2 10:2 12:2 10:2 8:2 5:2', strum: rep('x--.x-.xx--.x-.x', 5) + ' x--.x-.xx--.x-.x x--.x-.xx--.x-.x x---------------',
          bass: '1:6 5,:2 1:4 5,:4', flute: melB, glock: melB, shaker: 'x.o.x.o.x.o.x.o.', kick: 'X.......x.......', rim: '....x.......x...',
        },
      },
    },
    form: ['A', 'B'], loop: 0,
  };
}

// ---------------------------------------------------------------------------
// Stingers: non-looping cues (same sequencer, `once: true`, optional script)
// ---------------------------------------------------------------------------
export const STINGERS = {};
const spb16 = (bpm) => 60 / bpm / 4; // seconds per 16th

STINGERS.victory = {
  id: 'victory', vol: 1.8, bpm: 150, once: true, rev: 0.2, tail: 2.2, form: ['S'],
  parts: {
    lead: { inst: 'brass', mode: 'abs', vol: 0.62, rev: 0.25, o: { cut: 3400, level: 0.4 } },
    lead2: { inst: 'lead', mode: 'abs', vol: 0.22, pan: 0.2, o: { wave: 'square', cut: 4000, level: 0.2 } },
    chords: { inst: 'brass', mode: 'chord', voicing: { center: 64, n: 4 }, vol: 0.45, pan: -0.15 },
    strings: { inst: 'strings', mode: 'chord', voicing: { center: 72, n: 3 }, vol: 0.32, rev: 0.4, o: { a: 0.2 } },
    timp: { inst: 'tom', vol: 0.6, rev: 0.3 }, snare: { inst: 'snare', vol: 0.4, o: { tone: 'rock' } }, crash: { inst: 'crash', vol: 0.32 },
    glock: { inst: 'glock', mode: 'abs', vol: 0.3, pan: 0.3, rev: 0.3 },
    bass: { inst: 'bass', mode: 'rel', base: 36, vol: 0.45, o: { cut: 700, env: 1.5 } },
  },
  sections: {
    S: {
      bars: 3, chords: 'C | F:8 G:8 | C',
      p: {
        lead: 'g4:2 g4:1 g4:1 c5:4 e5:2 d5:1 e5:1 g5:4 | f5:2 f5:1 f5:1 a5:4 g5:2 f5:1 g5:1 b5:4 | c6:12 r:4',
        lead2: 'g4:2 g4:1 g4:1 c5:4 e5:2 d5:1 e5:1 g5:4 | f5:2 f5:1 f5:1 a5:4 g5:2 f5:1 g5:1 b5:4 | c6:12 r:4',
        chords: 'X--------------- X-------X------- X-----------....', strings: dots(32) + ' X---------------',
        timp: '4............... 4.......4....... 4...............', snare: dots(16) + ' ........oooxxxXX X...............',
        crash: dots(32) + ' X...............', glock: 'r:32 c6:1 e6:1 g6:1 c7:13', bass: '1:4 1:4 1:4 1:4 1:8 1:8 1:16',
      },
    },
  },
};

STINGERS.levelup = {
  id: 'levelup', vol: 3.0, bpm: 160, once: true, rev: 0.2, tail: 1.6, form: ['S'],
  parts: {
    lead: { inst: 'lead', mode: 'abs', vol: 0.4, rev: 0.2, o: { wave: 'square', wave2: 'pulse', cut: 5000, level: 0.22, vib: 6 } },
    glock: { inst: 'glock', mode: 'abs', vol: 0.32, pan: 0.25, rev: 0.25 },
    chord: { inst: 'bell', mode: 'chord', voicing: { center: 72, n: 4 }, vol: 0.5, rev: 0.3, o: { variant: 'city' } },
    pad: { inst: 'strings', mode: 'chord', voicing: { center: 64, n: 4 }, vol: 0.3, rev: 0.35, o: { a: 0.05 } },
    crash: { inst: 'crash', vol: 0.22 },
  },
  sections: {
    S: {
      bars: 1, chords: 'Cmaj9',
      p: {
        lead: 'c5:1 e5:1 g5:1 c6:1 e5:1 g5:1 c6:1 e6:1 g6:8', glock: 'c6:1 e6:1 g6:1 c7:1 e6:1 g6:1 c7:1 e7:1 g7:8',
        chord: '........X-------', pad: '........X-------', crash: '........X.......',
      },
    },
  },
  script: (k, dest, t, pl) => fxShimmer(k, dest, t + 8 * pl.c.stepDur, 1.2, { vol: 0.15, base: 2093 }),
};

STINGERS.capture = {
  id: 'capture', vol: 1.45, bpm: 140, once: true, rev: 0.18, tail: 1.6, form: ['S'],
  parts: {
    bell: { inst: 'bell', mode: 'abs', vol: 0.6, rev: 0.25, dly: 0.1, o: { variant: 'city' } },
    pluck: { inst: 'pluck', mode: 'abs', oct: -1, vol: 0.3, pan: -0.2, o: { wave: 'square', decay: 0.25 } },
    ep: { inst: 'epiano', mode: 'chord', voicing: { center: 62, n: 4 }, vol: 0.45, pan: 0.2 },
    bass: { inst: 'slap', mode: 'rel', base: 36, vol: 0.55 },
    kick: { inst: 'kick', vol: 0.6 }, snare: { inst: 'snare', vol: 0.38 }, crash: { inst: 'crash', vol: 0.26 },
  },
  delay: { beats: 0.5, fb: 0.2, mix: 0.3 },
  sections: {
    S: {
      bars: 2, chords: 'C:4 G/B:4 Am7:4 G:4 | C',
      p: {
        bell: 'g5:2 e5:1 g5:1 c6:2 b5:2 a5:2 b5:2 g5:4 | c6:2 d6:2 e6:8 r:4', pluck: 'g5:2 e5:1 g5:1 c6:2 b5:2 a5:2 b5:2 g5:4 | c6:2 d6:2 e6:8 r:4',
        ep: 'x---x---x---x--- X-----------....', bass: '1:4 1:4 1:4 1:4 1:12 r:4',
        kick: 'x...x...x...x... X...............', snare: '....x.......x.xx X...............', crash: dots(16) + ' X...............',
      },
    },
  },
};

STINGERS.defeat = {
  id: 'defeat', vol: 1.17, bpm: 70, once: true, rev: 0.3, tail: 2.6, form: ['S'],
  parts: {
    mel: { inst: 'flute', mode: 'abs', vol: 0.55, rev: 0.35, o: { style: 'flute', breath: 0.25 } },
    ep: { inst: 'epiano', mode: 'chord', voicing: { center: 60, n: 4 }, vol: 0.5, pan: -0.15, rev: 0.3 },
    strings: { inst: 'strings', mode: 'chord', voicing: { center: 67, n: 3 }, vol: 0.32, pan: 0.15, rev: 0.4, o: { a: 0.4, r: 1.6 } },
    bass: { inst: 'upright', mode: 'rel', base: 33, vol: 0.6 },
    timp: { inst: 'tom', vol: 0.45, rev: 0.4 },
  },
  sections: {
    S: {
      bars: 1, chords: 'Fmaj7:8 E7:4 Am:4',
      p: { mel: 'e5:3 d5:3 c5:2 b4:4 a4:4', ep: 'x-------x---x---', strings: 'x-------x---x---', bass: '1:8 1:4 1:4', timp: '............4...' },
    },
  },
};

STINGERS.reward = {
  id: 'reward', vol: 2.45, bpm: 130, once: true, rev: 0.25, tail: 1.8, form: ['S'],
  parts: {
    koto: { inst: 'koto', mode: 'abs', vol: 0.6, pan: -0.15 },
    glock: { inst: 'glock', mode: 'abs', vol: 0.32, pan: 0.25 },
    chord: { inst: 'bell', mode: 'chord', voicing: { center: 74, n: 4 }, vol: 0.5, rev: 0.35, o: { variant: 'city' } },
    pad: { inst: 'strings', mode: 'chord', voicing: { center: 67, n: 4 }, vol: 0.28, rev: 0.4, o: { a: 0.08 } },
  },
  sections: {
    S: {
      bars: 1, chords: 'Gadd9',
      p: { koto: 'd5:1 e5:1 g5:1 a5:1 b5:1 d6:1 e6:1 g6:9', glock: 'r:7 g6:1 b6:1 d7:7', chord: '.......X--------', pad: '.......X--------' },
    },
  },
  script: (k, dest, t, pl) => fxShimmer(k, dest, t + 7 * pl.c.stepDur, 1.4, { vol: 0.16, base: 1568 }),
};

STINGERS.quest = {
  id: 'quest', vol: 1.64, bpm: 120, once: true, rev: 0.25, tail: 1.6, form: ['S'],
  parts: {
    lead: { inst: 'brass', mode: 'abs', vol: 0.6, rev: 0.25, o: { cut: 3200, level: 0.38 } },
    chords: { inst: 'brass', mode: 'chord', voicing: { center: 62, n: 4 }, vol: 0.42, pan: -0.15 },
    timp: { inst: 'tom', vol: 0.55, rev: 0.3 }, crash: { inst: 'crash', vol: 0.2 },
    glock: { inst: 'glock', mode: 'abs', vol: 0.28, pan: 0.3, rev: 0.3 },
    taiko: { inst: 'taiko', vol: 0.45, rev: 0.3 },
  },
  sections: {
    S: {
      bars: 1, chords: 'Gsus4:8 G:8',
      p: { lead: 'd5:2 g5:2 c6:4 b5:8', chords: 'X-------X-------', timp: '4.......4.......', taiko: 'X.......X.......', crash: '........X.......', glock: 'r:8 d6:2 g6:6' },
    },
  },
};

STINGERS.evolution = {
  id: 'evolution', vol: 1.24, bpm: 160, once: true, rev: 0.3, tail: 2.6, form: ['S'],
  parts: {
    choir: { inst: 'choir', mode: 'chord', voicing: { center: 64, n: 4 }, vol: 0.6, rev: 0.45, o: { a: 0.5, r: 1.6 } },
    strings: { inst: 'strings', mode: 'chord', voicing: { center: 72, n: 3 }, vol: 0.3, rev: 0.4, o: { a: 0.6 } },
    arp: { inst: 'glock', mode: 'rel', base: 72, vol: 0.32, pan: 0.25, rev: 0.3 },
    arp2: { inst: 'pluck', mode: 'rel', base: 60, vol: 0.25, pan: -0.25, rev: 0.25, o: { decay: 0.25 } },
    bell: { inst: 'bell', mode: 'chord', voicing: { center: 76, n: 4 }, vol: 0.45, rev: 0.4, o: { variant: 'tubular' } },
    bass: { inst: 'sub', mode: 'rel', base: 36, vol: 0.45, o: { a: 0.3 } },
    crash: { inst: 'crash', vol: 0.3 }, taiko: { inst: 'taiko', vol: 0.6, rev: 0.35 },
  },
  sections: {
    S: {
      bars: 4, chords: 'Am | F | G | C',
      p: {
        choir: 'x--------------- x--------------- x--------------- X---------------', strings: 'x--------------- x--------------- x--------------- X---------------',
        arp: '1:4 3:4 5:4 8:4 | 1:2 3:2 5:2 8:2 1:2 3:2 5:2 8:2 | ' + rep('1:1 3:1 5:1 8:1', 4) + ' | 8:16',
        arp2: 'r:32 ' + rep('1:1 3:1 5:1 8:1', 4) + ' 1:16', bell: dots(48) + ' X---------------',
        bass: '1:16 1:16 1:16 1:16', crash: dots(48) + ' X...............', taiko: dots(48) + ' X...............',
      },
    },
  },
  script: (k, dest, t, pl) => {
    const hit = t + 48 * pl.c.stepDur;
    fxRiser(k, dest, t, hit - t, { vol: 0.22, f0: 250, f1: 8000, p0: 110, p1: 880 });
    fxBoom(k, dest, hit, { vol: 0.5, dur: 1.6, f0: 80, f1: 30 });
    fxShimmer(k, dest, hit, 2.2, { vol: 0.22, base: 2093, count: 14 });
  },
};

STINGERS.spectral = {
  id: 'spectral', vol: 0.96, bpm: 100, once: true, rev: 0.35, tail: 3.2, form: ['S'],
  parts: {
    choir: { inst: 'choir', mode: 'chord', voicing: { center: 62, n: 4 }, vol: 0.62, rev: 0.5, o: { a: 0.6, r: 2 } },
    choirLo: { inst: 'choir', mode: 'chord', voicing: { center: 50, n: 3 }, vol: 0.5, rev: 0.45, o: { vowel: 'o', a: 0.8, r: 2 } },
    taiko: { inst: 'taiko', vol: 0.72, rev: 0.35 },
    gtrL: { inst: 'guitar', mode: 'chord', voicing: { type: 'root', base: 38 }, vol: 0.42, pan: -0.7, amp: { drive: 5 } },
    gtrR: { inst: 'guitar', mode: 'chord', voicing: { type: 'root', base: 38 }, vol: 0.42, pan: 0.7, nudge: 0.008, amp: { drive: 5.5 } },
    bell: { inst: 'bell', mode: 'chord', voicing: { center: 74, n: 4 }, vol: 0.45, rev: 0.45, o: { variant: 'tubular' } },
    strings: { inst: 'strings', mode: 'chord', voicing: { center: 69, n: 4 }, vol: 0.35, rev: 0.4, o: { a: 0.08, r: 2 } },
    crash: { inst: 'crash', vol: 0.32 },
  },
  sections: {
    S: {
      bars: 3, chords: 'Dm | Bb:8 A:8 | D',
      p: {
        choir: 'x--------------- x-------x------- X---------------', choirLo: 'x--------------- x-------x------- X---------------',
        taiko: 'X.......X....... X...X...X.x.XXXX X...............', gtrL: dots(32) + ' X---------------', gtrR: dots(32) + ' X---------------',
        bell: dots(32) + ' X---------------', strings: dots(32) + ' X---------------', crash: dots(32) + ' X...............',
      },
    },
  },
  script: (k, dest, t, pl) => {
    const hit = t + 32 * pl.c.stepDur;
    fxBoom(k, dest, t, { vol: 0.45, dur: 2.4, f0: 70, f1: 24, lp: 400 });
    fxRiser(k, dest, t + 0.3, hit - t - 0.3, { vol: 0.25, f0: 150, f1: 9000, p0: 55, p1: 440, noise: 'pink' });
    fxBoom(k, dest, hit, { vol: 0.75, dur: 2.2, f0: 95, f1: 26 });
    fxShimmer(k, dest, hit, 2.8, { vol: 0.24, base: 1175, count: 18 });
  },
};

// Validation helper for tools: compiles everything, returns lengths + warnings.
export function validateAll() {
  const out = [];
  for (const [kind, set] of [['track', TRACKS], ['stinger', STINGERS]]) {
    for (const [id, tr] of Object.entries(set)) {
      try { const c = compileTrack(tr); out.push({ kind, id, total: c.total, loopLen: c.loopLen, events: c.events, warnings: c.warnings }); }
      catch (e) { out.push({ kind, id, error: String(e.message || e) }); }
    }
  }
  return out;
}
export const stingerLength = (id) => { const s = STINGERS[id]; return s ? compileTrack(s).total + (s.tail || 2) : 0; };
