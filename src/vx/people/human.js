// The game's people: the realistic low-poly humans from Gacha Garage (src/vx/people/gg, vendored unchanged)
// as Tokonmon actors. castHuman(who) → a HumanPerson: a Model-like object (group, bones, dispose) whose
// animator() maps the game's clip names (idle, walk, talk, wave, cheer, sit, shock, …) onto the human's own
// procedural animation: speed-driven walk with planted feet, look-at, gestures, painted expressions, springs.
import * as THREE from '../../../vendor/three.module.js';
import { Human } from './gg/Human.js';
import { makeSpec, streetPreset } from './gg/presets.js';
import { hex, mixc } from './gg/paintlib.js';
import './gg/poses.js';
import { CAST } from './humancast.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3();

// clip → { g: gesture, go: gesture opts, e: expression, talk, sit, hop, post(h, t) }
const CLIPS = {
  idle: {}, walk: {}, run: {},
  talk: { g: 'talk', talk: true },
  wave: { g: 'wave', e: 'smile' }, point: { g: 'point' }, think: { g: 'think' }, bow: { g: 'bow', e: 'smile' },
  cheer: { g: 'cheer', e: 'happy', hop: 0.08 }, win: { g: 'cheer', e: 'grin', hop: 0.12 }, jump: { e: 'happy', hop: 0.22 },
  clap: { g: 'clap', e: 'happy' }, shrug: { g: 'shrug' }, peace: { g: 'peace', e: 'happy' }, dab: { g: 'dab' }, flex: { g: 'flex' },
  shock: { g: 'shrug', e: 'surprised', post: (h, t) => lean(h, -0.12 * Math.exp(-t * 3)) },
  angry: { e: 'angry', talk: true, g: 'nope', post: (h, t) => lean(h, 0.08 + Math.sin(t * 18) * 0.015) },
  laugh: { e: 'grin', talk: true, post: (h, t) => lean(h, -0.06 + Math.abs(Math.sin(t * 9)) * 0.06) },
  sad: { e: 'sad', post: (h) => lean(h, 0.14) }, cry: { e: 'sad', g: 'think', post: (h, t) => lean(h, 0.16 + Math.sin(t * 14) * 0.01) },
  hurt: { e: 'angry', post: (h, t) => lean(h, -0.22 * Math.exp(-t * 4) + 0.08) },
  phone: { g: 'phone_idle' }, sip: { g: 'phone_idle', e: 'smile' }, selfie: { g: 'selfie', e: 'duck' },
  throw: { g: 'point', post: (h, t) => lean(h, t < 0.25 ? -0.15 : 0.12 * Math.exp(-(t - 0.25) * 4)) },
  stretch: { g: 'cheer', e: 'sleepy' }, wheeze: { e: 'sleepy', post: (h, t) => lean(h, 0.18 + Math.sin(t * 6) * 0.03) },
  nod: { e: 'smile', post: (h, t) => nod(h, Math.sin(t * 9) * 0.16 * Math.exp(-t * 1.2)) },
  facepalm: { g: 'think', e: 'sad', post: (h) => nod(h, 0.25) }, proud: { g: 'hug', e: 'cool', post: (h) => lean(h, -0.1) },
  shy: { g: '_clasp', e: 'smile', post: (h) => nod(h, 0.18) }, dance: { g: 'dance', go: { bpm: 112, style: 'bounce' } },
  hug: { g: 'hug' }, explain: { g: 'explain', talk: true }, menace: { g: 'nope', e: 'angry' }, nope: { g: 'nope', e: 'angry' }, wet: { e: 'sad' },
  sit: { sit: true }, sitPhone: { sit: true, g: 'phone_idle' }, sitSad: { sit: true, e: 'sad', post: (h) => lean(h, 0.18) },
};
function lean(h, a) { _q.setFromEuler(_e.set(a, 0, 0)); h.b.spine.quaternion.multiply(_q); }
function nod(h, a) { _q.setFromEuler(_e.set(a, 0, 0)); h.b.head.quaternion.multiply(_q); }

// seated: hips down onto the root (the seat surface), thighs forward, shins down, hands on the lap
function sitPose(h, k) {
  const b = h.b, P = h.P;
  b.hips.position.y += (P.thighX * 1.05 + h.hipOff - b.hips.position.y) * k;
  b.hips.position.z += (-P.thighX * 0.4 - b.hips.position.z) * k;
  for (const s of ['L', 'R']) {
    const sd = s === 'L' ? 1 : -1;
    b['thigh' + s].quaternion.slerp(_q.setFromEuler(_e.set(-Math.PI / 2 + 0.06, sd * 0.06, sd * 0.05, 'ZXY')), k);
    b['shin' + s].quaternion.slerp(_q.setFromEuler(_e.set(Math.PI / 2 - 0.12, 0, 0)), k);
    b['foot' + s].quaternion.slerp(_q.setFromEuler(_e.set(0.06, sd * 0.1, 0)), k);
    const sc = P.H / 1.72;
    h.armIK(s, { t: [sd * 0.11 * sc, -0.3 * sc, 0.2 * sc], p: [sd * 0.4, -0.2, -1], hand: [0.6, 0, sd * -0.2] }, k);
  }
}

class HumanAnim {
  constructor(p) {
    this.p = p; this.h = p.h; this.clips = CLIPS; this.spec = { fidget: { clips: ['wave', 'shrug', 'think', 'phone'] } };
    this.cur = 'idle'; this.c = CLIPS.idle; this.t = 0; this.sitK = 0; this.hop = 0; this.prev = null; this.speed = 0;
  }
  play(name, o = {}) {
    const c = CLIPS[name] || CLIPS.idle, h = this.h;
    if (name === this.cur && !o.restart) return this;
    this.cur = name; this.c = c; this.t = 0;
    h.clearGesture();
    if (c.g) h.gesture(c.g, c.go || {});
    h.setExpression(c.e || 'neutral', 0);
    return this;
  }
  /** a face for a moment (the dialogue layer calls this on emphasis lines) */
  face(expr, hold = 2) { this.h.setExpression(expr, hold); }
  update(dt, ctx = {}) {
    const h = this.h, c = this.c, g = h.root;
    this.t += dt;
    // walking speed from the root motion (teleports ignored)
    g.updateWorldMatrix(true, false); _v.setFromMatrixPosition(g.matrixWorld);
    if (this.prev && dt > 0) { const d = Math.hypot(_v.x - this.prev.x, _v.z - this.prev.z) / dt; this.speed += ((d > 9 ? 0 : d) - this.speed) * (1 - Math.exp(-dt * 12)); }
    this.prev = (this.prev || new THREE.Vector3()).copy(_v);
    const look = ctx.look && ctx.look.isVector3 ? ctx.look : null;
    h.update(dt, { speed: this.speed, lookAt: c.sit ? null : look, talking: !!c.talk || !!this.p.talking });
    this.sitK += ((c.sit ? 1 : 0) - this.sitK) * (1 - Math.exp(-dt * 10));
    if (this.sitK > 0.01) sitPose(h, smooth(this.sitK));
    if (c.post) c.post(h, this.t);
    // hops (cheer / win / jump): a little bounce of the whole body
    const hp = c.hop ? Math.max(0, Math.sin(this.t * 7.5)) * c.hop * (this.t < 2.2 ? 1 : 0) : 0;
    this.hop += (hp - this.hop) * (1 - Math.exp(-dt * 25));
    h.mesh.position.y = this.hop;
  }
}

export class HumanPerson {
  constructor(spec, o = {}) {
    this.h = new Human(spec, { lazy: o.lazy ?? true });
    this.name = o.name || spec.id;
    this.group = this.h.root;
    this.bones = { head: this.h.b.head, body: this.h.b.chest };
    this.def = { name: this.name, anim: {} }; this.order = []; this.talking = false;
  }
  animator() { return new HumanAnim(this); }
  finishPaint() { this.h.finishPaint(); return this; }
  dispose() { this.h.dispose(); }
}

// ---------------------------------------------------------------- the cast
const normCol = (c) => (Array.isArray(c) ? c : typeof c === 'string' ? hex(parseInt(c.slice(1), 16)) : hex(c));
const COLKEYS = new Set(['col', 'col2', 'shirt', 'tie', 'collar', 'stripe', 'scarf', 'belt', 'band', 'vest', 'cardigan', 'iris', 'browCol', 'tights', 'skin']);
function deepCol(o) {
  if (Array.isArray(o)) return o.map((x) => (x && typeof x === 'object' && !Array.isArray(x) ? deepCol(x) : x));
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    if (COLKEYS.has(k) && (typeof v === 'number' || typeof v === 'string')) r[k] = normCol(v);
    else if (v && typeof v === 'object' && !Array.isArray(v)) r[k] = deepCol(v);
    else if (Array.isArray(v) && v.length && typeof v[0] === 'object') r[k] = deepCol(v);
    else r[k] = v;
  }
  return r;
}
/** a spec from a Gacha Garage preset + overrides (colours as 0xRRGGBB, '#rrggbb' or [r, g, b]) */
export function humanSpec(preset, seed, over = {}) {
  const s = makeSpec(preset, seed), o = deepCol(over);
  for (const [k, v] of Object.entries(o)) s[k] = v && typeof v === 'object' && !Array.isArray(v) && s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && !['top', 'bottom', 'shoes', 'hat', 'glasses'].includes(k) ? { ...s[k], ...v } : v;
  if (over.hair && over.hair.col !== undefined) s.hair.hi = s.hair.grey ? [250, 250, 248] : s.hair.col[0] < 80 ? mixc(s.hair.col, [176, 180, 214], 0.75) : mixc(s.hair.col, [255, 244, 222], 0.55);
  s.id = over.id || s.id;
  return s;
}
const cache = new Map();
/** who: a cast name, 'passerbyN', any other extra name (seeded from the name), or a spec object */
export function castSpec(who) {
  if (who && typeof who === 'object') return who.H && who.top ? who : humanSpec(who.preset || 'tourist', who.seed || 1, who);
  if (cache.has(who)) return cache.get(who);
  let s;
  if (CAST[who]) { const c = CAST[who]; s = humanSpec(c.preset, c.seed || 7, { ...c, id: who }); }
  else {
    const str = String(who), num = +str.replace(/\D/g, ''), h = [...str].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) | 0, 7) >>> 0;
    const seed = /^passerby\d+$/.test(str) && num ? num : 1000 + (h % 100000);
    s = makeSpec(streetPreset(seed), seed);
  }
  cache.set(who, s);
  return s;
}
export function castHuman(who, o = {}) { return new HumanPerson(castSpec(who), { name: typeof who === 'string' ? who : who.id, ...o }); }
