// The mini-games' shared kit: the play session (its own 3D group, spawned actors, a game camera with shake and
// field-of-view punches, slow motion, floating pop-ups, flashes, confetti), input (keys, pointer, gamepad, held
// and pressed), the cinematic flow (intro → how-to card → countdown → play → finish → results → again / done),
// HUD widgets drawn with the UI kit's public PixelUI API (so they pick up its look), and little mesh / pixel
// texture builders for the set pieces.
//
// A game is a class constructed with the session: new Game(sess). The session calls, in order:
//   await setup()          build the set, place the actors (behind a fade)
//   await intro(cin)       the camera move under the title card (the cinema has the camera)
//   reset()                a fresh round (also before every "play again")
//   start()                the countdown finished: go
//   update(dt, inp, live)  every frame once set up (live: playing and not paused; inp is empty otherwise)
//   draw(ui, dt)           the in-game HUD (countdown, play, finish)
//   bot(inp, dt)           fills inp for the dev autoplayer (?mgbot=1) and sess.sim()
//   dispose()              anything not in sess.root (the session removes its own group and actors)
// and the game calls sess.end({ score, ... }) when its round is over.
import * as THREE from '../../../../vendor/three.module.js';
import { T } from '../../../px/game/ui.js';

export const V3 = THREE.Vector3;
export const D2R = Math.PI / 180;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v) => clamp(v, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const kexp = (dt, r) => 1 - Math.exp(-dt * r);
export const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t) => Math.pow(clamp01(t), 3);
export const easeOutBack = (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const boing = (t) => (t <= 0 ? 0 : t >= 1.2 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(18 * t));
export const wrapDeg = (a) => { a %= 360; if (a > 180) a -= 360; if (a < -180) a += 360; return a; };
export const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const fmtTime = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m ? `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}` : r.toFixed(2) + 's'; };
/** a small seeded random (mulberry32) */
export function rng(seed = 1) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
/** pick from [{ w, ... }] by weight */
export function weighted(r, list) { let s = 0; for (const e of list) s += e.w; let x = r() * s; for (const e of list) { x -= e.w; if (x <= 0) return e; } return list[list.length - 1]; }

// ================================================================== audio (ids stay literal at the call sites)
export function audioOf(app) {
  const au = () => app.audio || null;
  return {
    sfx(name, o) { const a = au(); if (a && a.sfx) try { a.sfx(name, o); } catch (e) { /* audio is optional */ } },
    music(id, o) { const a = au(); if (a && a.music) try { a.music(id, o); } catch (e) { /* optional */ } },
    stinger(id, o) { const a = au(); if (a && a.stinger) try { a.stinger(id, o); } catch (e) { /* optional */ } },
    /** the beat clock of the procedural track now playing ({ beat, bpm }) or null */
    clock(id) {
      const a = au(); const tr = a && a.track, ctx = a && a.ctx;
      if (!tr || !ctx || a.trackId !== id || !tr.running || !(tr.t0 > 0)) return null;
      const lat = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
      return { beat: ((ctx.currentTime - lat - tr.t0) * tr.bpm) / 60, bpm: tr.bpm };
    },
  };
}

// ================================================================== input
const TAP_KEYS = [' ', 'Enter', 'z', 'x', 'j', 'k'];
/** this frame's input: pressed edges (tap, left, right, up, down, keys) and held state (hold, L, R, U, D) */
export class Input {
  constructor(app) { this.app = app; this.padPrev = {}; this.clear(); }
  clear() {
    this.tap = false; this.hold = false; this.left = this.right = this.up = this.down = false; this.L = this.R = this.U = this.D = false;
    this.esc = false; this.pressed = new Set(); this.ptr = null; this.ptrDown = false; this.ptrUp = false; this.release = false;
    return this;
  }
  /** a synthetic, empty input (bots and the simulator fill it) */
  static empty() { return new Input(null); }
  key(k) { return this.pressed.has(k); }
  poll(ui) {
    const app = this.app, kd = app.keysDown || {}, held = (k) => !!kd[k];
    const was = this.hold;
    this.clear();
    for (const k of Object.keys(ui.keys)) if (ui.keys[k] === 'pressed') this.pressed.add(k);
    const P = ui.ptr; this.ptr = { x: P.x, y: P.y }; this.ptrDown = !!P.pressed; this.ptrUp = !!P.released;
    // the gamepad: A / B (either face button) tap and hold, the d-pad / stick steer
    let padA = false, padX = 0, padY = 0, padHit = false;
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const g of pads || []) if (g && g.connected !== false && g.buttons) {
        padA = [0, 1, 2, 3, 5, 7].some((i) => g.buttons[i] && g.buttons[i].pressed);
        padHit = padA && !this.padPrev.a; padX = g.axes[0] || 0; padY = g.axes[1] || 0; break;
      }
    } catch (e) { /* no gamepads */ }
    this.padPrev.a = padA;
    this.tap = TAP_KEYS.some((k) => this.pressed.has(k)) || padHit || this.ptrDown;
    this.hold = TAP_KEYS.some(held) || padA || !!P.down;
    this.release = was && !this.hold;
    this.left = this.pressed.has('ArrowLeft') || this.pressed.has('a');
    this.right = this.pressed.has('ArrowRight') || this.pressed.has('d');
    this.up = this.pressed.has('ArrowUp') || this.pressed.has('w');
    this.down = this.pressed.has('ArrowDown') || this.pressed.has('s');
    this.L = held('ArrowLeft') || held('a') || padX < -0.4; this.R = held('ArrowRight') || held('d') || padX > 0.4;
    this.U = held('ArrowUp') || held('w') || padY < -0.4; this.D = held('ArrowDown') || held('s') || padY > 0.4;
    this.esc = this.pressed.has('Escape') || this.pressed.has('p');
    return this;
  }
}

// ================================================================== meshes and textures
const _col = new THREE.Color();
/** boxes [[x0, y0, z0, x1, y1, z1, '#hex'], …] → one vertex-coloured geometry */
export function boxGeo(list) {
  const P = [], N = [], C = [], I = [];
  for (const [x0, y0, z0, x1, y1, z1, hex] of list) {
    _col.set(hex).convertSRGBToLinear();
    const F = [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
      [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]],
      [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]]];
    for (const [a, b, c, d, n] of F) { const base = P.length / 3; for (const q of [a, b, c, d]) { P.push(...q); N.push(...n); C.push(_col.r, _col.g, _col.b); } I.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
  g.computeBoundingSphere();
  return g;
}
export const LAMBERT = new THREE.MeshLambertMaterial({ vertexColors: true });
/** a mesh of coloured boxes (o: { shadow, mat }) */
export function boxes(list, o = {}) {
  const m = new THREE.Mesh(boxGeo(list), o.mat || LAMBERT);
  m.castShadow = o.shadow !== false; m.receiveShadow = true;
  return m;
}
/** a nearest-filtered canvas texture painted by paint(g, w, h) */
export function canvasTex(w, h, paint, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; if (paint) paint(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = o.smooth ? THREE.LinearFilter : THREE.NearestFilter; t.minFilter = o.smooth ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter; t.generateMipmaps = !!o.smooth;
  t.userData.canvas = c; t.userData.g = g;
  return t;
}
/** a flat picture (unlit unless o.lit), w × h metres, facing +z */
export function picture(tex, w, h, o = {}) {
  const mat = o.lit ? new THREE.MeshLambertMaterial({ map: tex, transparent: !!o.alpha, alphaTest: o.alpha ? 0.5 : 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide })
    : new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.alpha, alphaTest: o.alpha ? 0.5 : 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide, toneMapped: o.toneMapped ?? true });
  if (o.color) mat.color.set(o.color);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return m;
}
/** a cylinder (flat-shaded, coloured) */
export function cyl(rTop, rBot, h, color, seg = 10, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, !!o.open), new THREE.MeshLambertMaterial({ color, flatShading: true, side: o.open ? THREE.DoubleSide : THREE.FrontSide }));
  m.castShadow = o.shadow !== false; m.receiveShadow = true;
  return m;
}
export function ball(r, color, o = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg || 10, o.seg2 || 8), new THREE.MeshLambertMaterial({ color, flatShading: !o.smooth, emissive: o.glow || 0x000000 }));
  m.castShadow = o.shadow !== false; return m;
}
/** a crisp pixel sign: text on a coloured board with a border (returns a texture) */
export function signTex(text, o = {}) {
  const fs = o.fs || 14, pad = 6, W = o.w || Math.max(48, Math.ceil(text.length * fs * 0.62) + pad * 2), H = o.h || fs + pad * 2 + (o.sub ? fs * 0.8 : 0);
  return canvasTex(W, H, (g) => {
    g.fillStyle = o.border || '#1c1838'; g.fillRect(0, 0, W, H);
    g.fillStyle = o.bg || '#ffc93a'; g.fillRect(2, 2, W - 4, H - 4);
    g.fillStyle = o.hi || 'rgba(255,255,255,0.25)'; g.fillRect(2, 2, W - 4, 2);
    g.font = `bold ${fs}px "Trebuchet MS", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const ty = o.sub ? pad + fs / 2 + 1 : H / 2 + 1;
    g.fillStyle = o.shadow || 'rgba(0,0,0,0.35)'; g.fillText(text, W / 2 + 1, ty + 1);
    g.fillStyle = o.fg || '#1c1838'; g.fillText(text, W / 2, ty);
    if (o.sub) { g.font = `bold ${Math.round(fs * 0.62)}px "Trebuchet MS", Arial, sans-serif`; g.fillStyle = o.fg || '#1c1838'; g.fillText(o.sub, W / 2, H - pad - fs * 0.32); }
    thresholdAlpha(g, W, H);
  });
}
// keep the canvas text crisp: every pixel fully opaque or fully clear (pixel-art look)
function thresholdAlpha(g, W, H) { try { const d = g.getImageData(0, 0, W, H); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0; g.putImageData(d, 0, 0); } catch (e) { /* tainted / headless */ } }
/** a sign on two posts: a board (w × h m) facing yaw, standing at (x, y, z) */
export function signPost(tex, w, h, x, y, z, yaw = 0, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw;
  const post = o.post || '#5a3a24', top = o.top ?? 1.5;
  g.add(boxes([[-w / 2 + 0.04, 0, -0.04, -w / 2 + 0.12, top + h, 0.04, post], [w / 2 - 0.12, 0, -0.04, w / 2 - 0.04, top + h, 0.04, post], [-w / 2 - 0.04, top - 0.04, -0.06, w / 2 + 0.04, top + h + 0.04, -0.01, o.back || '#2a2240']]));
  const front = picture(tex, w, h, { lit: true }); front.position.set(0, top + h / 2, 0.0); g.add(front);
  const back = picture(tex, w, h, { lit: true }); back.position.set(0, top + h / 2, -0.07); back.rotation.y = Math.PI; g.add(back);
  return g;
}
/** dispose every geometry / material / texture under an object */
export function disposeTree(o) {
  o.traverse((m) => {
    if (m.geometry) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mt of mats) { if (mt === LAMBERT) continue; for (const k of ['map', 'emissiveMap', 'alphaMap']) if (mt[k] && mt[k].dispose) mt[k].dispose(); mt.dispose(); }
  });
}

// ================================================================== HUD widgets (PixelUI public API only)
// The kit is a pixel GUI: cream cards in copper frames (dark-brown ink on cream), outlined light type over
// the world, a pixel font whose big sizes are whole steps (scale 2, 3, 4…). Pop-ins scale briefly, then sit
// at whole pixels.
const WHITE = '#fff8ec';
/** big centred text (scale 2–5), o: { grad [top, body], color, k (0..1 pop-in), rot, outline } */
export function bigText(ui, str, cx, cy, scale = 3, o = {}) {
  const k = o.k ?? 1, g = ui.g;
  let sc = scale; const sw = ui.tw(str, { scale: sc }); if (sw > ui.w - 16) sc = Math.max(2, Math.floor(scale * (ui.w - 16) / sw));
  const cap = 5 * Math.max(2, Math.round(sc)), xf = Math.abs(k - 1) > 0.02 || o.rot;
  if (xf) { g.save(); g.translate(Math.round(cx), Math.round(cy)); g.scale(Math.max(0.01, k), Math.max(0.01, k)); if (o.rot) g.rotate(o.rot); g.translate(-Math.round(cx), -Math.round(cy)); }
  ui.text(str, cx, cy - cap / 2, o.color || null, { align: 'center', scale: sc, outline: o.outline || T.ink, grad: o.grad || [WHITE, o.color || T.amber] });
  if (xf) { g.restore(); ui._fs = null; ui._font = null; }
}
/** a little framed pill with an icon and a value; returns its width */
export function pill(ui, x, y, icon, str, o = {}) {
  const w = Math.round(o.w || ui.tw(str) + (icon ? 22 : 14)), h = 18;
  ui.panel(x, y, w, h, { thin: true, fill: o.fill, edge: o.edge });
  if (icon) ui.icon(icon, x + 5, y + 5.5, o.iconColor || T.copper);
  ui.text(str, icon ? x + 15 : x + w / 2, y + 6, o.color || T.text, { align: icon ? 'left' : 'center' });
  return w;
}
/** the round timer: seconds left (pulses red in the last 10 s) */
export function drawTimer(ui, cx, y, left, total, t) {
  const low = left <= 10 && left > 0, str = left >= 10 ? String(Math.ceil(left)) : left > 0 ? left.toFixed(1) : '0.0';
  const w = 56, x = Math.round(cx - w / 2), bump = low && Math.sin(t * 10) > 0.6 ? 1 : 0;
  ui.panel(x, y - bump, w, 18, { thin: true, fill: low ? '#d8443e' : undefined, edge: low ? '#8e2626' : undefined });
  ui.icon('clock', x + 6, y + 5.5 - bump, low ? WHITE : T.copper);
  ui.text(str, cx + 6, y + 6 - bump, low ? WHITE : T.text, { align: 'center' });
  if (total) ui.bar(x + 4, y + 20, w - 8, 3, left / total, { color: low ? 'red' : 'cyan', shine: false, trail: false, id: 'mg-timer' });
}
/** a stopwatch pill (elapsed seconds) */
export function drawClock(ui, cx, y, sec) {
  const w = 62, x = Math.round(cx - w / 2);
  ui.panel(x, y, w, 18, { thin: true }); ui.icon('clock', x + 6, y + 5.5, T.copper);
  ui.text(sec.toFixed(1) + 's', cx + 7, y + 6, T.text, { align: 'center' });
}
/** the score card (top left): label + a rolling number */
export function drawScore(ui, x, y, shown, o = {}) {
  const str = fmt(shown), bestS = o.best != null ? 'BEST ' + fmt(o.best) : '', w = Math.max(78, ui.tw(str, { scale: 2 }) + 18, ui.tw(bestS, { mini: true }) + ui.tw(o.label || 'SCORE', { mini: true }) + 24);
  ui.panel(x, y, w, 34, {});
  ui.text(o.label || 'SCORE', x + 8, y + 7, T.dim, { mini: true });
  ui.text(str, x + 8, y + 16, T.text, { scale: 2 });
  if (bestS) ui.text(bestS, x + w - 8, y + 7, T.amber2, { mini: true, align: 'right' });
  return w;
}
/** the combo counter over the world: "×N COMBO", bouncing when it grows */
export function drawCombo(ui, x, y, combo, bump, o = {}) {
  if (combo < 2) return;
  const hot = combo >= (o.hot || 10), k = 1 + Math.max(0, 0.3 - bump) * 1.4, g = ui.g, sx = Math.round(x), sy = Math.round(y);
  if (k > 1.01) { g.save(); g.translate(sx, sy + 5); g.scale(k, k); g.translate(-sx, -(sy + 5)); }
  const w = ui.text('×' + combo, sx, sy, null, { scale: 2, outline: T.ink, grad: hot ? [WHITE, T.coral] : [WHITE, T.cyan] });
  ui.text(o.label || 'COMBO', sx + w + 3, sy + 4, hot ? T.amberL : WHITE, { mini: true, outline: T.ink });
  if (k > 1.01) { g.restore(); ui._fs = null; ui._font = null; }
}
/** a row of keycaps + labels centred on cx: [['SPACE', 'Cast'], ['◀ ▶', 'Aim']]; o.paper: dark labels (on a card) */
export function keyRow(ui, cx, y, pairs, o = {}) {
  const gap = 10, parts = pairs.map(([k, l]) => ({ k, l, w: ui.tw(k, { mini: k.length > 3 }) + 8 + 3 + ui.tw(l, { mini: true }) }));
  let x = Math.round(cx - (parts.reduce((s, p) => s + p.w, 0) + gap * (parts.length - 1)) / 2);
  for (const p of parts) {
    const kw = ui.keycap(x, y, p.k) || ui.tw(p.k) + 8;
    ui.text(p.l, x + kw + 3, y + 4, o.paper ? T.text : WHITE, o.paper ? { mini: true } : { mini: true, outline: T.ink });
    x += kw + 3 + ui.tw(p.l, { mini: true }) + gap;
  }
}
/** text over the world: light with a dark outline */
export function worldText(ui, str, x, y, o = {}) { return ui.text(str, x, y, o.color || WHITE, Object.assign({ outline: T.ink }, o)); }
/** a vertical gauge with coloured zones: v 0..1, zones [[a, b, '#col'], …] */
export function vGauge(ui, x, y, w, h, v, zones, o = {}) {
  x = Math.round(x); y = Math.round(y);
  ui.panel(x - 4, y - 4, w + 8, h + 8, { thin: true });
  ui.rect(x, y, w, h, T.track || '#3a2a2e');
  for (const [a, b, c] of zones) ui.rect(x, y + Math.round(h * (1 - b)), w, Math.round(h * (b - a)), c);
  const yy = Math.round(y + h * (1 - clamp01(v)));
  ui.rect(x - 3, yy - 2, w + 6, 4, T.ink); ui.rect(x - 2, yy - 1, w + 4, 2, o.needle || WHITE);
}
export { WHITE };

// ================================================================== the session
let SID = 0;
export class Session {
  constructor(mg, def, Game, o = {}) {
    this.mg = mg; this.app = mg.app; this.def = def; this.o = o;
    this.w = this.app.world; this.st = this.app.stage; this.cin = this.app.cinema; this.audio = audioOf(this.app);
    this.root = new THREE.Group(); this.root.name = 'mg-' + def.id; this.st.scene.add(this.root);
    this.actors = []; this.sid = ++SID; this.n = 0;
    this.cam = { target: new V3(), dist: 6, yaw: 0, pitch: 15, fov: 40 }; this.camCur = null; this.camRate = 5; this.camOn = false;
    this.shk = { amp: 0, t: 9, decay: 6 }; this.fovK = 0;
    this.pops = []; this.flashes = []; this.confetti = []; this.banners = [];
    this.slow = null; this.phase = 'init'; this.paused = false; this.t = 0; this.pt = 0; this.round = 0;
    this.input = new Input(this.app); this.none = Input.empty();
    this.bot = !!o.bot; this.rand = rng((Date.now() ^ (SID * 7919)) >>> 0);
    this.lead = (this.app.state.party || [])[0] || null;
    this.partner = this.w.partner || null; this.hero = this.w.player || null;
    this.partnerName = this.lead ? (this.lead.nick || speciesName(this.lead.species)) : 'your partner';
    this.hook = (st) => this.lens(st); this.st.hooks.push(this.hook);
    this.ov = (ui, dt) => this.frame(ui, dt); this.app.overlays.push(this.ov);
    this.game = new Game(this);
  }
  get live() { return this.phase === 'play' && !this.paused; }
  log(...a) { if (this.mg.debug) console.log('[mg]', this.def.id, ...a); }

  // ---------------------------------------------------------------- the whole flow
  async run() {
    const app = this.app, g = this.game, cin = this.cin, o = this.o;
    this.keep();
    let quit = false;
    try {
      await app.fade(1, 260);
      await g.setup();
      g.reset && g.reset(); this.round = 1;
      this.hush(true);
      if (!o.skipIntro) {
        if (cin) await cin.begin({ bars: true, prefer: g.prefer ?? 45 });
        this.phase = 'intro';
        await app.fade(0, 450);
        const mv = g.intro ? g.intro(cin) : Promise.resolve();
        if (cin) cin.title(this.def.title, this.def.sub, { hold: 2600 });
        await Promise.all([mv, app.wait(this.bot ? 900 : 2300)]);
        this.phase = 'howto'; this.pt = 0;
        await this.waitTap(this.bot || o.auto ? 0.8 : 60);
        this.audio.sfx('ui_confirm');
        if (cin) await cin.begin({ bars: false });       // bars out; the director stays on duty (no roaming HUD) but lets go of the camera
        this.hush(true);
      } else { this.phase = 'howto'; if (cin) await cin.begin({ bars: false }); await app.fade(0, 300); }
      this.camOn = true; this.camCur = null; this.camSnapSoon = false;   // the game camera eases in from the intro's last shot
      for (;;) {
        this.phase = 'count'; this.pt = 0;
        await this.countdown();
        this.phase = 'play'; this.pt = 0; this.res = null;
        g.start && g.start();
        const res = await new Promise((r) => { this.finish = r; });
        this.finish = null;
        if (res && res.quit) { quit = true; break; }
        if (res && res.restart) { g.reset && g.reset(); this.round++; continue; }
        this.phase = 'over'; this.pt = 0;
        await this.outro(res);
        const rec = this.mg.record(this.def, res, this);
        const pick = await this.results(rec);
        if (pick !== 'again') break;
        g.reset && g.reset(); this.round++;
      }
    } catch (e) { console.error('[mg]', e); }
    finally { await this.teardown(); }
    return quit;
  }
  /** the game's round is over: res = { score, …game stats } */
  end(res) { if (this.finish) { const f = this.finish; this.finish = null; f(res || { score: 0 }); } }
  waitTap(maxS = 60) {
    return new Promise((r) => { const t0 = this.t; this.tapWait = () => { if (this.input.tap || this.t - t0 > maxS || (this.cin && this.cin.skipping && this.t - t0 > 0.3)) { this.tapWait = null; r(); } }; });
  }
  async countdown() {
    const A = this.audio;
    for (const n of ['3', '2', '1']) { this.banner(n, { dur: 0.6, scale: 4, grad: [WHITE, T.cyan] }); A.sfx('ui_tap', { pitch: 0.9 + (3 - n) * 0.12, vol: 1 }); await this.app.wait(this.bot ? 250 : 620); }
    this.banner('GO!', { dur: 0.75, scale: 5, grad: [WHITE, T.amber] }); A.sfx('combo', { pitch: 1.1 }); this.shake(0.05);
  }
  async outro(res) {
    const txt = (res && res.banner) || 'TIME UP!';
    this.banner(txt, { dur: 1.6, scale: 4, grad: [WHITE, T.red] });
    this.audio.sfx('gong', { vol: 0.8 }); this.slowmo(0.3, 0.9);
    if (this.game.outro) await this.game.outro(res);
    await this.app.wait(this.bot ? 400 : 1500);
  }
  async teardown() {
    const app = this.app;
    try { this.phase = 'done'; await app.fade(1, 300); } catch (e) { /* ignore */ }
    try { this.game.dispose && this.game.dispose(); } catch (e) { console.error(e); }
    for (const a of this.actors) this.w.remove(a.id);
    this.actors = [];
    this.st.scene.remove(this.root); disposeTree(this.root);
    this.st.hooks = this.st.hooks.filter((h) => h !== this.hook);
    const i = app.overlays.indexOf(this.ov); if (i >= 0) app.overlays.splice(i, 1);
    this.restore();
    this.hush(false);
    if (this.cin && this.cin.active) await this.cin.end({ release: false });
    const w = this.w; if (w.cam) w.cam.fov = undefined;
    if (w.player && w.followCam) w.followCam(0);
    const z = w.city && w.city.zone; if (z && z.music) this.audio.music(z.music, { fade: 1.5 }); else if (w.locAudio) w.locAudio();
    await app.fade(0, 450);
  }
  // ---------------------------------------------------------------- the world around the game
  keep() {
    const w = this.w, h = w.player, p = w.partner, P = (a) => a && { x: a.g.position.x, y: a.g.position.y, z: a.g.position.z, yaw: a.yaw, vis: a.g.visible };
    this.saved = { hero: P(h), partner: P(p) };
    if (p) { p.busy = true; p.path = null; }
    if (h) h.path = null;
  }
  restore() {
    const w = this.w, S = this.saved || {};
    for (const [a, s] of [[w.player, S.hero], [w.partner, S.partner]]) {
      if (!a || !s) continue;
      a.path = null; a.arrive = null; a.g.visible = s.vis !== false; a.g.scale.setScalar(1);
      a.place(s.x, s.z, s.yaw, s.y); a.play(a.idleClip || 'idle', { fade: 0.1 });
    }
    if (w.partner) w.partner.busy = false;
    if (w.city && w.player) w.city.placed();
  }
  hush(on) { const L = this.w.life; if (L && L.hush) L.hush(on); }
  async mon(species, at, o = {}) {
    const a = await this.w.addMon('mg' + this.sid + '_' + (++this.n), species, at, o);
    if (this.phase === 'done') { this.w.remove(a.id); throw new Error('session over'); }
    a.life = null; this.actors.push(a); return a;
  }
  person(who, at, o = {}) { const a = this.w.addPerson('mg' + this.sid + '_' + (++this.n), who, at, o); this.actors.push(a); return a; }
  drop(a) { if (!a) return; this.w.remove(a.id); this.actors = this.actors.filter((x) => x !== a); }
  ground(x, z, y) { return this.w.ground(x, z, y); }
  project(p) { return this.w.project(p); }
  /** world particles (the FX kinds: sparkle, star, heart, splash, drop, dust, steam, smoke, note, ring, spark, fire…) */
  burst(kind, pos, o = {}) { try { this.w.fx.emit(kind, pos.isVector3 ? pos : new V3(pos[0], pos[1], pos[2]), o); } catch (e) { /* unknown kind */ } }

  // ---------------------------------------------------------------- camera
  /** the game camera target: set every frame (eased at camRate) or cut with snap */
  look(target, dist, yaw, pitch, fov = 40, o = {}) {
    const c = this.cam; if (target.isVector3) c.target.copy(target); else c.target.set(target[0], target[1], target[2]);
    c.dist = dist; c.yaw = yaw; c.pitch = pitch; c.fov = fov; if (o.rate) this.camRate = o.rate; if (o.snap) this.camSnapSoon = true;
  }
  applyCam(dt) {
    if (!this.camOn) return;
    const w = this.w, c = this.cam;
    if (this.cin && this.cin.driving) this.cin.letGo();
    if (!this.camCur) { const wc = w.cam; this.camCur = { target: wc.target.clone(), dist: wc.dist, yaw: wc.yaw, pitch: wc.pitch, fov: wc.fov ?? (this.st.baseFov || 40) }; }
    if (this.camSnapSoon) { this.camCur = { target: c.target.clone(), dist: c.dist, yaw: c.yaw, pitch: c.pitch, fov: c.fov }; this.camSnapSoon = false; }
    else {
      const k = kexp(dt, this.camRate), q = this.camCur;
      q.target.lerp(c.target, k); q.dist += (c.dist - q.dist) * k; q.yaw += wrapDeg(c.yaw - q.yaw) * k; q.pitch += (c.pitch - q.pitch) * k; q.fov += (c.fov - q.fov) * k;
    }
    const q = this.camCur;
    if (w.tween && w.tween.director !== 'cinema') { /* someone else's move: let it land */ } else w.tween = null;
    w.cam.target.copy(q.target); w.cam.dist = q.dist; w.cam.yaw = q.yaw; w.cam.pitch = q.pitch; w.cam.fov = q.fov - this.fovK; w.camHeld = true;
  }
  /** stage hook: the shake impulse, applied after the camera is placed */
  lens(st) {
    const S = this.shk, a = S.amp * Math.exp(-S.t * S.decay);
    if (a < 1e-4 || this.phase === 'done') return;
    const t = this.t, cam = st.cam, ox = (Math.sin(t * 43) * 0.6 + Math.sin(t * 27 + 1.3) * 0.4) * a, oy = (Math.sin(t * 37 + 0.6) * 0.6 + Math.sin(t * 21 + 2.1) * 0.4) * a;
    const r = new V3().setFromMatrixColumn(cam.matrixWorld, 0), u = new V3().setFromMatrixColumn(cam.matrixWorld, 1);
    cam.position.addScaledVector(r, ox).addScaledVector(u, oy); cam.rotateZ(Math.sin(t * 31) * a * 0.05); cam.updateMatrixWorld();
  }
  // ---------------------------------------------------------------- juice
  shake(amp = 0.08, decay = 7) { const S = this.shk, cur = S.amp * Math.exp(-S.t * S.decay); this.shk = { amp: Math.max(amp, cur), t: 0, decay }; }
  punch(deg = 4) { this.fovK = Math.min(14, this.fovK + deg); }
  flash(color = '#ffffff', dur = 0.25, a = 0.7) { this.flashes.push({ color, dur, a, t: 0 }); }
  slowmo(scale = 0.3, dur = 0.6) { this.slow = { scale, dur, t: 0 }; }
  hitstop(ms = 90) { this.slow = { scale: 0.02, dur: ms / 1000, t: 0 }; }
  timeScale() { const s = this.slow; if (!s) return 1; const k = s.t / s.dur; return k >= 1 ? 1 : k < 0.7 ? s.scale : lerp(s.scale, 1, (k - 0.7) / 0.3); }
  /** a floating pop-up: at = [x, y] (UI units) or a world point; o: { color, scale, dur, rise, grad, icon } */
  pop(text, at, o = {}) { this.pops.push({ text: String(text), at, o, t: 0, dur: o.dur || 0.9, dx: (this.rand() - 0.5) * 6 }); if (this.pops.length > 24) this.pops.shift(); }
  /** a big centred word ("PERFECT!", "GO!") */
  banner(text, o = {}) { this.banners = this.banners.filter((b) => b.o.stack); this.banners.push({ text, o, t: 0, dur: o.dur || 1 }); }
  confettiBurst(n = 60, x, y) {
    const W = this.app.ui.w, cols = ['#ff4d6a', '#ffc93a', '#2fd4f0', '#5fdc4a', '#ff74c0', '#ffffff'];
    for (let i = 0; i < n; i++) this.confetti.push({ x: x ?? W * this.rand(), y: y ?? -10 - this.rand() * 40, vx: (this.rand() - 0.5) * (x != null ? 160 : 40), vy: x != null ? -60 - this.rand() * 90 : 20 + this.rand() * 40, r: this.rand() * 6, vr: (this.rand() - 0.5) * 12, c: cols[i % cols.length], life: 2.2 + this.rand() * 1.2, t: 0 });
  }
  tickFx(dt, rdt) {
    if (this.slow) { this.slow.t += rdt; if (this.slow.t >= this.slow.dur) this.slow = null; }
    this.shk.t += rdt; this.fovK *= Math.exp(-rdt * 6);
    for (const p of this.pops) p.t += rdt; this.pops = this.pops.filter((p) => p.t < p.dur);
    for (const b of this.banners) b.t += rdt; this.banners = this.banners.filter((b) => b.t < b.dur);
    for (const f of this.flashes) f.t += rdt; this.flashes = this.flashes.filter((f) => f.t < f.dur);
    for (const c of this.confetti) { c.t += rdt; c.vy += 60 * rdt; c.vx *= Math.exp(-rdt * 1.5); c.x += c.vx * rdt + Math.sin(c.t * 5 + c.r) * 12 * rdt; c.y += c.vy * rdt; c.r += c.vr * rdt; }
    this.confetti = this.confetti.filter((c) => c.t < c.life);
  }
  drawFx(ui) {
    const g = ui.g;
    for (const p of this.pops) {
      let x, y; if (Array.isArray(p.at)) [x, y] = p.at; else { const sp = this.project(p.at); if (!sp.vis) continue; x = sp.x; y = sp.y; }
      const k = p.t / p.dur, inK = boing(p.t * 3.2), sc = p.o.scale || 1, yy = Math.round(y - easeOut(k) * (p.o.rise ?? 18)), xx = Math.round(x + p.dx), xf = inK < 0.98 || inK > 1.02;
      const cap = sc >= 1.5 ? 5 * Math.max(2, Math.round(sc)) : 7;
      g.save(); g.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      if (xf) { g.translate(xx, yy); g.scale(Math.max(0.05, inK), Math.max(0.05, inK)); g.translate(-xx, -yy); }
      ui.text(p.text, xx, yy - cap / 2, p.o.color || null, { align: 'center', scale: sc, outline: T.ink, grad: p.o.color ? null : (p.o.grad || [WHITE, T.amber]) });
      g.restore(); ui._fs = null; ui._font = null;
    }
    for (const b of this.banners) {
      const k = b.t / b.dur, inK = boing(b.t * 2.6), out = k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1;
      if (out <= 0) continue;
      g.save(); g.globalAlpha = out;
      bigText(ui, b.text, ui.w / 2, ui.h * (b.o.y ?? 0.42), b.o.scale || 3, { k: inK, grad: b.o.grad, color: b.o.color, rot: b.o.rot });
      g.restore(); ui._fs = null; ui._font = null;
    }
    for (const c of this.confetti) { g.save(); g.globalAlpha = Math.min(1, (c.life - c.t) * 2); ui.rect(c.x, c.y, Math.abs(Math.cos(c.r)) * 3 + 1, 2, c.c); g.restore(); ui._fs = null; }
    for (const f of this.flashes) { const a = f.a * (1 - f.t / f.dur) ** 1.5; if (a > 0.01) ui.fade(a, f.color); }
  }
  // ---------------------------------------------------------------- per frame (an app overlay)
  frame(ui, dt) {
    if (this.phase === 'init' || this.phase === 'done') return;
    this.t += dt; this.pt += dt;
    const gdt = dt * this.timeScale();
    const live = this.live && !ui.modal && !ui.dialog;
    const inp = live || this.phase === 'howto' ? this.input.poll(ui) : this.none.clear();
    if (this.bot && (live || this.phase === 'howto')) { this.game.bot && this.game.bot(inp, gdt); if (this.phase === 'howto') inp.tap = this.pt > 0.6; }
    if (this.tapWait) this.tapWait();
    if (live && inp.esc && !this.bot) { this.pause(); return; }
    try { this.game.update(gdt, live ? inp : this.none, live); } catch (e) { if (!this.err) { this.err = true; console.error('[mg]', e); } }
    this.tickFx(gdt, dt);
    this.applyCam(dt);
    if (this.phase === 'count' || this.phase === 'play' || this.phase === 'over' || this.phase === 'results') { try { this.game.draw(ui, dt); } catch (e) { if (!this.derr) { this.derr = true; console.error('[mg]', e); } } }
    this.drawFx(ui);
    if (this.phase === 'howto') this.drawHowto(ui);
  }
  /** fast-forward the round (dev / tests): the bot plays for `seconds` of game time in fixed steps */
  async sim(seconds = 5, step = 1 / 30) {
    const inp = Input.empty(), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let n = 0, waits = 0;
    for (let t = 0; t < seconds && this.phase === 'play';) {
      if (this.game.waiting && this.game.waiting() && waits < 400) { waits++; await sleep(15); continue; }   // an actor is loading
        this.simulating = true; inp.clear(); if (this.game.bot) this.game.bot(inp, step); this.game.update(step, inp, true); this.tickFx(step, step); t += step; this.simulating = false;
      if (++n % 8 === 0) await sleep(0);
    }
    return this.game.debug ? this.game.debug() : null;
  }
  // ---------------------------------------------------------------- the how-to card (after the title)
  drawHowto(ui) {
    const W = ui.w, H = ui.h, d = this.def, G = this.game.constructor, k = boing(this.pt * 1.8), g = ui.g;
    const w = Math.min(320, W - 16), lines = ui.wrap(G.howto || d.howto || '', w - 28), h = 46 + lines.length * 10 + (G.keys ? 18 : 0);
    const x = Math.round((W - w) / 2), y = Math.round(H - h - Math.max(12, H * 0.07));
    const xf = Math.abs(k - 1) > 0.02; if (xf) { g.save(); g.translate(W / 2, y + h); g.scale(k, k); g.translate(-W / 2, -(y + h)); }
    ui.panel(x, y, w, h, {});
    ui.banner(x + 10, y - 6, (d.short || d.title).toUpperCase(), { icon: d.icon, color: d.color });
    lines.forEach((l, i) => ui.text(l, W / 2, y + 14 + i * 10, T.text, { align: 'center' }));
    let yy = y + 16 + lines.length * 10;
    if (G.keys) { keyRow(ui, W / 2, yy, G.keys, { paper: true }); yy += 18; }
    const best = this.mg.best(d.id);
    if (best != null) ui.text('BEST ' + (d.lowerBetter ? fmtTime(best) : fmt(best)), x + 10, y + h - 15, T.dim, { mini: true });
    if (Math.sin(this.t * 6) > -0.4) ui.text(touchy() ? 'TAP TO START' : 'PRESS SPACE TO START', x + w - 10, y + h - 15, T.amber2, { mini: true, align: 'right' });
    if (xf) { g.restore(); ui._fs = null; ui._font = null; }
  }
  // ---------------------------------------------------------------- pause
  pause() {
    if (this.paused) return; this.paused = true; this.audio.sfx('ui_back');
    const ui = this.app.ui, m = { resolve: (v) => { this.paused = false; if (v === 'quit') this.end({ quit: true }); else if (v === 'restart') this.end({ restart: true }); } };
    m.draw = (ui, dt, live) => {
      ui.fade(0.45, '#1a0f0c');
      const W = ui.w, H = ui.h, w = 150, h = 112, x = Math.round((W - w) / 2), y = Math.round((H - h) / 2);
      ui.panel(x, y, w, h, {}); ui.banner(x + 10, y - 6, 'PAUSED', { icon: 'menu', color: this.def.color });
      const b = (i, label, icon, color, hk) => ui.button(x + 14, y + 16 + i * 30, w - 28, 22, label, { icon, color, hotkey: hk, modal: true, disabled: !live });
      if (b(0, 'Resume', 'play', T.green, 'Escape') || (live && ui.key('Enter'))) ui.closeModal(m, 'resume');
      else if (b(1, 'Restart', 'swap', T.blue, 'r')) ui.closeModal(m, 'restart');
      else if (b(2, 'Quit', 'close', T.red, 'q')) ui.closeModal(m, 'quit');
    };
    ui.openModal(m);
  }
  // ---------------------------------------------------------------- results
  results(rec) {
    this.phase = 'results';
    const A = this.audio, d = this.def;
    if (rec.record) { this.confettiBurst(90); A.stinger('reward'); } else A.sfx('reward');
    return new Promise((resolve) => {
      const m = { resolve, t: 0, rew: 0, tick: -1 };
      m.draw = (ui, dt, live) => {
        const W = ui.w, H = ui.h, t = m.t, g = ui.g, narrow = W < 360;
        ui.fade(Math.min(0.5, t * 2), '#1a0f0c');
        const w = Math.min(340, W - 12), h = Math.min(H - 14, 220), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + 3, k = easeOutBack(t * 2.6);
        const xf = Math.abs(k - 1) > 0.01; if (xf) { g.save(); g.translate(W / 2, y + h / 2); g.scale(Math.max(0.01, k), Math.max(0.01, k)); g.translate(-W / 2, -(y + h / 2)); }
        ui.panel(x, y, w, h, {});
        ui.banner(x + 10, y - 6, d.title, { icon: d.icon, color: d.color });
        // the score rolls up
        const target = rec.score, dur = 1.1, rolled = t < 0.25 ? 0 : t < 0.25 + dur ? target * easeOut((t - 0.25) / dur) : target;
        const step = Math.floor((rolled / Math.max(1, target)) * 14); if (step !== m.tick && t < 0.25 + dur && t > 0.25) { m.tick = step; A.sfx('coin', { vol: 0.35, pitch: 1 + step * 0.06 }); }
        const sx = x + 14, sy = y + 13;
        ui.text(rec.scoreLabel || 'SCORE', sx, sy, T.dim, { mini: true });
        ui.text(rec.scoreText && t > 0.25 + dur ? rec.scoreText : rec.scoreText ? rec.scoreText : fmt(rolled), sx, sy + 9, T.text, { scale: narrow ? 2 : 3 });
        ui.text((rec.bestLabel || 'BEST') + '  ' + rec.bestText, sx, sy + (narrow ? 22 : 28), T.amber2, { mini: true });
        if (rec.record && t > 0.25 + dur) {
          const sk = boing((t - 0.25 - dur) * 2), cx = sx + (narrow ? 96 : 130), cy = sy + 12;
          g.save(); g.translate(cx, cy); g.scale(Math.max(0.01, sk), Math.max(0.01, sk)); g.translate(-cx, -cy);
          ui.panel(cx - 38, cy - 9, 76, 18, { thin: true, fill: '#d8443e', edge: '#8e2626' }); ui.text('NEW RECORD!', cx, cy - 3, WHITE, { align: 'center', mini: true });
          g.restore(); ui._fs = null; ui._font = null;
          if (!m.boomed) { m.boomed = true; A.sfx('crowd_cheer'); this.confettiBurst(50, W / 2, y + 30); }
        }
        // the rank medal
        if (rec.rank) {
          const rk = boing((t - 0.9) * 1.8), cx = x + w - 36, cy = y + 32, col = { S: '#f0b030', A: '#e86a9a', B: '#3ab8d8', C: '#5cc24a', D: '#a89a8c' }[rec.rank] || T.cyan;
          if (rk > 0.02) {
            g.save(); g.translate(cx, cy); g.scale(rk, rk); g.translate(-cx, -cy);
            ui.rrect(cx - 18, cy - 18, 36, 36, T.ink, 18); ui.rrect(cx - 16, cy - 16, 32, 32, T.copperL || '#d48c5c', 16); ui.rrect(cx - 13, cy - 13, 26, 26, col, 13);
            ui.text(rec.rank, cx, cy - 7, WHITE, { align: 'center', scale: 3, outline: T.ink });
            g.restore(); ui._fs = null; ui._font = null;
            if (!m.rankSnd) { m.rankSnd = true; A.sfx(rec.rank === 'S' ? 'perfect_parry' : 'qte_good'); }
            if (rec.rank === 'S') ui.sparkle(cx + Math.cos(t * 3) * 20, cy + Math.sin(t * 3) * 20, '#fff3b8', (Math.sin(t * 5) + 1) / 2);
          }
          ui.text('RANK', cx, cy + 21, T.dim, { mini: true, align: 'center' });
        }
        // stats, then the rewards popping in one by one
        let ly = y + (narrow ? 50 : 58);
        for (const L of (rec.lines || []).slice(0, 3)) { ui.text(L, sx, ly, T.text, { mini: true }); ly += 9; }
        ly += 5;
        ui.text('REWARDS', sx, ly, T.dim, { mini: true }); ly += 9;
        const R = rec.rewards || [], showN = Math.max(0, Math.min(R.length, Math.floor((t - 1.4) / 0.28) + 1));
        if (showN > m.rew) { m.rew = showN; A.sfx('coin', { pitch: 1.1 + showN * 0.08 }); }
        const colW = narrow ? w - 28 : (w - 28) / 2;
        R.slice(0, showN).forEach((r, i) => {
          const cx = Math.round(sx + (narrow ? 0 : (i % 2) * colW)), cy = Math.round(ly + (narrow ? i : Math.floor(i / 2)) * 15), pk = boing((t - 1.4 - i * 0.28) * 2.4), pxf = pk < 0.98 || pk > 1.02;
          if (pxf) { g.save(); g.translate(cx + 6, cy + 6); g.scale(Math.max(0.01, pk), Math.max(0.01, pk)); g.translate(-(cx + 6), -(cy + 6)); }
          ui.bigIcon(r.icon || 'star', cx, cy, null, {});
          ui.text(r.text, cx + 15, cy + 3, r.color || T.text, {});
          if (pxf) { g.restore(); ui._fs = null; ui._font = null; }
        });
        // buttons
        const bw = Math.min(112, Math.round((w - 40) / 2)), by = y + h - 32, ready = t > 1.0 && live;
        if (ui.button(Math.round(x + w / 2 - bw - 6), by, bw, 22, 'Play again', { icon: 'swap', color: T.blue, hotkey: 'r', modal: true, disabled: !ready })) ui.closeModal(m, 'again');
        else if (ui.button(Math.round(x + w / 2 + 6), by, bw, 22, 'Done', { icon: 'check', color: T.green, hotkey: 'Enter', modal: true, disabled: !ready }) || (ready && ui.key('Escape'))) ui.closeModal(m, 'done');
        if (xf) { g.restore(); ui._fs = null; ui._font = null; }
        if (this.bot && t > 3 && this.o.botQuit !== false) ui.closeModal(m, 'done');
      };
      this.app.ui.openModal(m);
    });
  }
}
function speciesName(id) { return id ? id[0].toUpperCase() + id.slice(1) : 'Partner'; }
function touchy() { return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches; }
