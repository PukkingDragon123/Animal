// Recorded audio on top of the procedural engine (assets/audio, see assets/audio/CREDITS.md):
// looping background music per location, ambience beds (birds, street, cicadas), and sampled sound
// effects that replace or layer over the synthesised ones. Everything is fetched lazily after the
// first user gesture and goes through the engine's buses, so volumes, ducking and the limiter apply.
// a bundled build sets globalThis.TOKON_AUDIO_BASE (its files sit beside the page)
const BASE = globalThis.TOKON_AUDIO_BASE || new URL('../../assets/audio/', import.meta.url).href;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// background music: id → file (Kevin MacLeod CC BY 4.0 / CC0 lo-fi)
export const BGM = {
  menu: 'music/menu.mp3', senbazuru: 'music/intro.mp3', party: 'music/party.mp3', lemon: 'music/garage1.mp3',
  vibes: 'music/garage2.mp3', lofi: 'music/garage3.mp3', city: 'music/radio_city1.mp3', lofi2: 'music/radio_lofi1.mp3',
};
export const JINGLES = { new: 'music/jingle_new.mp3', complete: 'music/jingle_complete.mp3', task: 'music/jingle_task.mp3', rare: 'music/jingle_reveal_rare.mp3' };
export const BEDS = { birds: 'amb/birds.mp3', street: 'amb/street.mp3', cicadas: 'amb/cicadas.mp3' };

// sfx name → [variants, gain, layer (also play the synthesised one)]
const v = (base, n, from = 1, pad = 0) => Array.from({ length: n }, (_, i) => `sfx/${base}${String(from + i).padStart(pad, '0')}.mp3`);
export const SFX_SAMPLES = {
  ui_tap: [v('click', 3), 0.7], ui_confirm: [['sfx/switch2.mp3'], 0.8], ui_error: [v('ui_error', 2), 0.8], ui_hover: [v('rollover', 3), 0.4],
  ui_back: [['sfx/switch3.mp3'], 0.7], phone_open: [['sfx/switch1.mp3'], 0.8], phone_close: [['sfx/switch3.mp3'], 0.8],
  notification: [['sfx/bell01.mp3'], 0.6], reward: [['sfx/coins_jingle.mp3'], 0.9, true], coin: [v('coin_clink', 4), 0.8],
  whoosh: [v('swing', 3), 0.8], hit_light: [v('hit', 2, 1, 2), 0.9, true], hit_heavy: [['sfx/slam01.mp3', 'sfx/slam03.mp3', 'sfx/hit03.mp3'], 1, true],
  crit: [['sfx/hit04.mp3', 'sfx/slam05.mp3'], 1.1, true], ko: [v('thud', 4), 1, true], hydro_splash: [v('splash', 2, 1, 2), 0.9, true],
  charge_release: [['sfx/magic.mp3', 'sfx/spell01.mp3'], 0.8, true], fire: [['sfx/fire01.mp3', 'sfx/fire03.mp3', 'sfx/fire05.mp3'], 0.8], sparkle: [v('gem', 4, 1, 2), 0.6],
  blade: [v('blade', 3, 1, 2), 0.8], roar: [v('roar', 3, 1, 2), 0.7], hurt: [v('hurt', 2, 1, 2), 0.8], boing: [v('boing', 3, 1, 2), 0.7], plop: [v('plop', 2, 1, 2), 0.8],
  bubble: [v('bubble', 3), 0.7], gong: [['sfx/gong.mp3'], 0.8], door: [['sfx/door_open.mp3'], 0.8], door_close: [['sfx/door_close.mp3'], 0.8], slide_door: [['sfx/slide_door.mp3'], 0.8],
  doorbell: [['sfx/doorbell.mp3'], 0.7], cloth: [v('cloth', 3), 0.7], page: [v('page', 3), 0.7], camera: [['sfx/camera.mp3'], 0.8], gacha: [v('gachan', 3), 0.8],
  furin: [v('furin', 3), 0.5], meow: [v('meow', 4), 0.7], coo: [v('coo', 3), 0.6], crow: [v('crow', 2), 0.6], flap: [v('flap', 3), 0.6], thud: [v('thud', 4), 0.8],
  step_concrete: [v('step_concrete', 5), 0.35], step_wood: [v('step_wood', 5), 0.35], step_carpet: [v('step_carpet', 4), 0.35], step_grass: [v('step_grass', 4), 0.35],
};

export class SampleBank {
  constructor(eng) {
    this.e = eng; this.ctx = eng.ctx; this.buf = new Map(); this.loading = new Map();
    this.bgmId = null; this.bgmEl = null; this.bedId = null; this.bedEl = null;
    this.ok = typeof fetch === 'function' && typeof document !== 'undefined' && !eng.offline;
    if (this.ok) for (const k in SFX_SAMPLES) for (const f of SFX_SAMPLES[k][0]) this.load(f);   // ~1 MB, all small
  }
  load(f) {
    if (this.buf.has(f) || this.loading.has(f)) return this.loading.get(f);
    const p = fetch(BASE + f).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status))).then((a) => this.ctx.decodeAudioData(a))
      .then((b) => { this.buf.set(f, b); return b; }).catch(() => null);
    this.loading.set(f, p);
    return p;
  }
  has(name) { return !!SFX_SAMPLES[name]; }
  /** Play a sampled effect. Returns 'layer' when the synthesised sound should play too, true when handled, false otherwise. */
  play(name, { vol = 1, pitch = 1, pan = 0 } = {}) {
    const S = SFX_SAMPLES[name]; if (!S || !this.ok) return false;
    const files = S[0], f = files[Math.floor(Math.random() * files.length)], b = this.buf.get(f);
    if (!b) return false;
    const ctx = this.ctx, src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = b; src.playbackRate.value = clamp(pitch * (0.96 + Math.random() * 0.08), 0.3, 3);
    g.gain.value = clamp(vol * S[1], 0, 3);
    src.connect(g);
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); p.connect(this.e.sfxBus); } else g.connect(this.e.sfxBus);
    src.start(ctx.currentTime + 0.003);
    return S[2] ? 'layer' : true;
  }
  // a looping media element routed into a bus, crossfaded in / out
  _loop(file, bus, vol) {
    const el = new Audio(BASE + file); el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous';
    const src = this.ctx.createMediaElementSource(el), g = this.ctx.createGain();
    g.gain.value = 0; src.connect(g); g.connect(bus);
    el.play().catch(() => {});
    g.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.6);
    return { el, g };
  }
  _fade(L) { if (!L) return; L.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); setTimeout(() => { L.el.pause(); L.el.src = ''; }, 2500); }
  bgm(id) {
    if (!this.ok || id === this.bgmId) return;
    this._fade(this.bgmEl); this.bgmEl = null; this.bgmId = id;
    if (id && BGM[id]) this.bgmEl = this._loop(BGM[id], this.e.musicDuck, 0.55);
  }
  bed(id) {
    if (!this.ok || id === this.bedId) return;
    this._fade(this.bedEl); this.bedEl = null; this.bedId = id;
    if (id && BEDS[id]) this.bedEl = this._loop(BEDS[id], this.e.ambBus, 0.5);
  }
  jingle(id) {
    if (!this.ok || !JINGLES[id]) return;
    this.load(JINGLES[id]).then((b) => { if (!b) return; const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = b; g.gain.value = 0.8; s.connect(g); g.connect(this.e.stingerBus); s.start(); this.e._duck && this.e._duck(0.25, this.ctx.currentTime, b.duration); });
  }
}
