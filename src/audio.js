// Self-contained Web Audio engine: synthesized SFX + a gentle generative cozy
// loop. No asset files, no network, no credits — instant and tiny. Created on a
// user gesture (autoplay policy). All wrapped so a missing AudioContext is a
// silent no-op, never a crash.

export class Audio {
  constructor() {
    this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null;
    this.muted = false; this.musicOn = false; this._timer = null; this._step = 0; this._nextTime = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.85; this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.0; this.musicGain.connect(this.master);
      this.musicLP = this.ctx.createBiquadFilter(); this.musicLP.type = 'lowpass'; this.musicLP.frequency.value = 2600; this.musicLP.connect(this.musicGain);
    } catch (e) { this.ctx = null; }
  }

  resume() { this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.9; }

  _now() { return this.ctx ? this.ctx.currentTime : 0; }

  // one oscillator note with an ADSR-ish envelope
  _note(freq, dur, type = 'sine', gain = 0.2, dest = null, when = 0, glideTo = null) {
    if (!this.ctx) return;
    const t = this._now() + when;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  _noise(dur, gain = 0.2, lp = 1800, when = 0) {
    if (!this.ctx) return;
    const t = this._now() + when;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    const g = this.ctx.createGain(); g.gain.value = gain;
    s.connect(f); f.connect(g); g.connect(this.sfxGain);
    s.start(t);
  }

  // ---- SFX ----
  eat() { this.resume(); this._noise(0.12, 0.18, 1200); this._note(420, 0.12, 'triangle', 0.16, null, 0.02, 620); }
  hurt() { this.resume(); this._note(300, 0.22, 'square', 0.22, null, 0, 90); this._noise(0.14, 0.2, 900); }
  grow() { this.resume(); [523, 659, 784].forEach((f, i) => this._note(f, 0.16, 'triangle', 0.16, null, i * 0.06)); }
  alert() { this.resume(); this._note(220, 0.1, 'square', 0.16, null, 0); this._note(180, 0.12, 'square', 0.16, null, 0.14); }
  reachWater() { this.resume(); this._noise(0.3, 0.22, 2200); [392, 523, 659].forEach((f, i) => this._note(f, 0.2, 'sine', 0.14, null, i * 0.05)); }
  birth() { this.resume(); [523, 659, 784, 1047, 1319].forEach((f, i) => this._note(f, 0.22, 'triangle', 0.15, null, i * 0.07)); this._note(1568, 0.5, 'sine', 0.1, null, 0.4); }
  die() { // comedic sad descending trombone-ish
    this.resume();
    const seq = [330, 294, 262, 196];
    seq.forEach((f, i) => this._note(f, 0.45, 'sawtooth', 0.18, null, i * 0.22, f * 0.94));
    this._note(165, 0.8, 'sine', 0.14, null, seq.length * 0.22);
  }
  success() { this.resume(); [523, 587, 659, 784, 880, 1047].forEach((f, i) => this._note(f, 0.2, 'triangle', 0.16, null, i * 0.09)); }
  swipe() { this.resume(); this._noise(0.14, 0.16, 2600); }
  bonk() { this.resume(); this._note(150, 0.18, 'square', 0.22, null, 0, 70); this._noise(0.1, 0.18, 700); }

  // ---- generative cozy music ----
  startMusic() {
    this.init(); if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.musicGain.gain.cancelScheduledValues(this._now());
    this.musicGain.gain.setTargetAtTime(0.18, this._now(), 1.2);
    this._step = 0; this._nextTime = this._now() + 0.1;
    const tick = () => {
      if (!this.musicOn || !this.ctx) return;
      const ahead = this._now() + 0.2;
      while (this._nextTime < ahead) { this._scheduleStep(this._nextTime); this._nextTime += 0.30; this._step++; }
      this._timer = setTimeout(tick, 60);
    };
    tick();
  }
  stopMusic() { this.musicOn = false; if (this._timer) clearTimeout(this._timer); if (this.musicGain) this.musicGain.gain.setTargetAtTime(0.0, this._now(), 0.4); }

  _scheduleStep(when) {
    // C major pentatonic, gentle. Chord changes every 8 steps (2 bars).
    const chords = [ [130.81, 164.81, 196.00], [110.00, 130.81, 164.81], [87.31, 110.00, 130.81], [98.00, 123.47, 146.83] ];
    const mel = [523.25, 587.33, 659.25, 783.99, 880.00, 659.25, 587.33, 783.99];
    const bar = Math.floor(this._step / 8) % chords.length;
    const s = this._step % 8;
    const dest = this.musicLP;
    if (s === 0) chords[bar].forEach((f) => this._note(f, 2.6, 'sine', 0.07, dest, when - this._now()));     // soft pad
    if (s % 2 === 0) { const f = mel[(this._step) % mel.length]; this._note(f, 0.42, 'triangle', 0.06, dest, when - this._now()); } // marimba-ish
    if (s === 0 || s === 4) this._note(65.41, 0.3, 'sine', 0.07, dest, when - this._now());                  // soft bass
  }

  // a tiny event dispatcher
  onEvent(t) {
    switch (t) {
      case 'eat': this.eat(); break;
      case 'hit': this.hurt(); break;
      case 'birth': this.birth(); break;
      case 'alert': this.alert(); break;
      case 'stage': this.grow(); break;
      case 'reachedWater': this.reachWater(); break;
    }
  }
}
