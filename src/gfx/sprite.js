// 2D pixel sprites in the 3D world (HD-2D style). A SpriteSet lazily bakes
// a design's animations (via the Baker) into nearest-filtered textures; a
// SpriteActor shows them on a camera-facing billboard that is lit by the
// scene, casts a sprite-shaped shadow and exposes the same API as Actor
// (pos, face, play, mode, talk, emote, flash, dissolve…) so world, battle and
// cutscene code can drive 2D characters and 3D Tokonmon alike.
import * as THREE from '../../vendor/three.module.js';
import { baker } from './bake.js';
import { toonMaterial, setFx } from './materials.js';
import { SPR } from './particles.js';
import { lerpAngle, damp } from '../core/mathx.js';

// Standard character animation set (frames × directions). Actions bake on first use.
export const CHAR_ANIMS = {
  idle: { frames: 4, dur: 1.6 },
  walk: { frames: 8, dur: 0.75, speed: 2.4 },
  run: { frames: 6, dur: 0.48, speed: 4.6 },
  talk: { frames: 2, dur: 0.24, talk: true },
  wave: { frames: 6, dur: 1.2, action: 'wave', dirs: ['side', 'front'] },
  cheer: { frames: 6, dur: 1.2, action: 'cheer', dirs: ['side', 'front'] },
  point: { frames: 5, dur: 1.0, action: 'point', dirs: ['side', 'front'] },
  bow: { frames: 5, dur: 1.2, action: 'bow', dirs: ['side', 'front'] },
  shocked: { frames: 4, dur: 0.9, action: 'shocked', dirs: ['side', 'front'] },
  laugh: { frames: 6, dur: 1.2, action: 'laugh', dirs: ['side', 'front'] },
  think: { frames: 4, dur: 1.6, action: 'think', dirs: ['side', 'front'] },
  nod: { frames: 4, dur: 0.6, action: 'nod', dirs: ['side', 'front'] },
  shrug: { frames: 4, dur: 1.0, action: 'shrug', dirs: ['side', 'front'] },
  flex: { frames: 5, dur: 1.2, action: 'flex', dirs: ['side', 'front'] },
  stomp: { frames: 5, dur: 0.8, action: 'stomp', dirs: ['side', 'front'] },
  headbang: { frames: 6, dur: 1.4, action: 'headbang', dirs: ['side', 'front'] },
  hop: { frames: 5, dur: 0.6, action: 'hop', dirs: ['side', 'front'] },
  command: { frames: 5, dur: 0.8, action: 'command', dirs: ['side', 'front'] },
  stretch: { frames: 5, dur: 1.4, action: 'stretch', dirs: ['side', 'front'] },
  eat: { frames: 6, dur: 1.2, action: 'eat', dirs: ['side', 'front'] },
  throwKey: { frames: 5, dur: 0.7, action: 'throwKey', dirs: ['side', 'front'] },
  victory: { frames: 6, dur: 1.4, action: 'victory', dirs: ['side', 'front'] },
  scratch: { frames: 4, dur: 1.0, action: 'scratch', dirs: ['side', 'front'] },
  sway: { frames: 6, dur: 1.6, action: 'sway', dirs: ['side', 'front'] },
  spin: { frames: 6, dur: 0.8, action: 'spin', dirs: ['side', 'front'] },
  sit: { frames: 2, dur: 1.6, mode: 'sit', dirs: ['side', 'front', 'back'] },
  sad: { frames: 2, dur: 1.6, mode: 'sad', dirs: ['side', 'front'] },
};
const DIRS = { side: Math.PI / 2, front: 0.3, back: Math.PI };

export class SpriteSet {
  constructor(renderer, design, opts = {}) {
    this.design = design;
    this.r = renderer;
    this.w = opts.w || 48; this.h = opts.h || 64; this.ppm = opts.ppm || 32;
    this.anchor = opts.anchor || [this.w / 2, this.h - 3];
    this.specs = Object.assign({}, CHAR_ANIMS, opts.anims || {});
    this.pitch = opts.pitch ?? 0.14;
    this.anims = {};
    for (const n of opts.preload || ['idle', 'walk', 'run', 'talk']) this.ensure(n);
  }
  ensure(name) {
    if (this.anims[name]) return this.anims[name];
    const spec = this.specs[name];
    if (!spec) return null;
    const sh = baker(this.r).sheet(this.design, { w: this.w, h: this.h, ppm: this.ppm, pitch: this.pitch, anchor: this.anchor, dirs: DIRS, anims: { [name]: spec }, mode: 'albedo' });
    const tex = new THREE.CanvasTexture(sh.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    const a = { tex, frames: sh.frames[name], fps: spec.frames / (spec.dur || 1), loop: !spec.action, n: spec.frames, cw: sh.canvas.width, ch: sh.canvas.height, canvas: sh.canvas };
    this.anims[name] = a;
    return a;
  }
  dispose() { for (const a of Object.values(this.anims)) a.tex.dispose(); }
}

const setCache = new Map();
export function spriteSetFor(renderer, design, key, opts) {
  const k = key || design.id;
  let s = setCache.get(k);
  if (!s) { s = new SpriteSet(renderer, design, opts); setCache.set(k, s); }
  return s;
}

const EMOTES = { '!': SPR.bang, '?': SPR.bang, heart: SPR.heart, note: SPR.note, zz: SPR.zz, star: SPR.star5, anger: SPR.cross, sweat: SPR.drop, swirl: SPR.swirl };
const EMOTE_COL = { '!': [2, 1.6, 0.3, 1], '?': [0.8, 1.6, 2.4, 1], heart: [2.4, 0.6, 1.2, 1], note: [1.8, 1.2, 2.4, 1], zz: [1.2, 1.4, 2, 1], star: [2.4, 2.2, 0.6, 1], anger: [2.4, 0.3, 0.3, 1], sweat: [0.7, 1.4, 2.4, 1], swirl: [1.6, 1.6, 1.6, 1] };

// Animator-compatible facade so world/battle code can drive sprites.
class SpriteAnim {
  constructor(actor) { this.a = actor; this.maxSpeed = 4.6; this.speed = 0; }
  setSpeed(v) { this.speed = v; }
  play(name) { return this.a.play(name); }
  isPlaying(name) { return this.a.action && (!name || this.a.action.name === name); }
  setMode(m) { this.a.mode(m); }
  setFace() {}
  talk(on) { this.a.talk(on); }
  lookAt() {}
  update() {}
}

export class SpriteActor {
  constructor(gfx, set, opts = {}) {
    this.gfx = gfx; this.set = set; this.isSprite = true;
    this.design = set.design;
    const w = set.w / set.ppm, h = set.h / set.ppm;
    const [ax, ay] = set.anchor;
    const geo = new THREE.PlaneGeometry(w, h);
    // put the anchor pixel (feet) on the origin
    geo.translate(w / 2 - ax / set.ppm, -h / 2 + ay / set.ppm, 0);
    this.geo = geo;
    this.uv = geo.attributes.uv;
    const idle = set.ensure('idle');
    this.mat = toonMaterial({ map: idle.tex, alphaTest: 0.5, vertexColors: false, side: THREE.DoubleSide, rim: 0 });
    this.mat.userData.fx.uRim.value = 0;
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.castShadow = opts.shadow !== false;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: idle.tex, alphaTest: 0.5 });
    this.mesh.userData.sprite = true;
    this.obj = new THREE.Group();
    this.obj.add(this.mesh);
    // soft contact blob
    if (opts.blob !== false) {
      const blob = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x140a24, transparent: true, opacity: 0.32, depthWrite: false }));
      blob.position.y = 0.02; blob.renderOrder = 1; blob.scale.set(1.2, 1, 0.7);
      this.obj.add(blob); this.blob = blob;
    }
    this.scale = opts.scale || 1;
    this.obj.scale.setScalar(this.scale);
    this.pos = new THREE.Vector3();
    this.yaw = 0; this.yawT = 0;
    this.visible = true;
    this.cur = 'idle'; this.ft = 0; this.dir = 'front'; this.flip = false;
    this.action = null; this.modeName = null; this.talking = false;
    this.flashT = 0; this.dissolveT = 0; this.dissolveDir = 0;
    this.anim = new SpriteAnim(this);
    this.rig = { height: (set.anchor[1] - 4) / set.ppm, radius: 0.3, bones: {}, materials: [this.mat], emitters: [], tagged: {} };
    this.onUpdate = null;
    (opts.parent || gfx.actors).add(this.obj);
    this._setFrame();
  }
  get height() { return this.rig.height * this.scale; }
  setPos(x, y, z) { this.pos.set(x, y, z); this.obj.position.copy(this.pos); return this; }
  face(yaw, instant = false) { this.yawT = yaw; if (instant) this.yaw = yaw; return this; }
  faceTo(x, z, instant = false) { return this.face(Math.atan2(x - this.pos.x, z - this.pos.z), instant); }
  play(name) {
    const a = this.set.ensure(name);
    if (!a) return 0;
    this.action = { name, t: 0, dur: a.n / a.fps };
    return this.action.dur;
  }
  mode(name) { this.modeName = name || null; if (name) this.set.ensure(name); }
  expr() {}
  talk(on) { this.talking = on; }
  flash(color = 0xffffff, t = 0.12) { this.flashCol = color; this.flashT = t; }
  setTint(color, amt) { setFx(this.obj, 'uTint', color); setFx(this.obj, 'uTintAmt', amt); }
  dissolve(dir = 1, dur = 0.8, color = 0x9fe8ff) { setFx(this.obj, 'uDissolveColor', color); this.dissolveDir = dir; this.dissolveDur = dur; this.dissolveT = dir > 0 ? 0 : 1; }
  setSpectral() {}
  setBond() {}
  wearHat() {}
  setForm() { return false; }
  headPos(out = new THREE.Vector3()) { return out.set(this.pos.x, this.pos.y + this.height + 0.25, this.pos.z); }
  emote(kind, fx = this.gfx.fx) {
    const p = this.headPos();
    fx.particle({ pos: [p.x, p.y + 0.15, p.z], vel: [0, 0.6, 0], life: 1.2, size: 0.4, size1: 0.46, color: EMOTE_COL[kind] || [2, 2, 2, 1], color1: EMOTE_COL[kind] || [2, 2, 2, 0], sprite: EMOTES[kind] ?? SPR.bang, drag: 2 });
  }
  setVisible(v) { this.visible = v; this.obj.visible = v; }
  // choose side/front/back relative to the camera
  _pickDir() {
    const cam = this.gfx.camera;
    const cx = cam.position.x - this.pos.x, cz = cam.position.z - this.pos.z;
    const cyaw = Math.atan2(cx, cz);                      // direction toward camera
    const rel = Math.atan2(Math.sin(this.yaw - cyaw), Math.cos(this.yaw - cyaw));
    const ar = Math.abs(rel);
    if (ar < 0.6) { this.dir = 'front'; this.flip = false; }
    else if (ar > 2.55) { this.dir = 'back'; this.flip = false; }
    else { this.dir = 'side'; this.flip = rel < 0; }
    return cyaw;
  }
  _setFrame() {
    let name = this.cur;
    const a = this.set.anims[name] || this.set.ensure(name);
    if (!a) return;
    let dirs = a.frames[this.dir] ? this.dir : (a.frames.side ? 'side' : Object.keys(a.frames)[0]);
    const fr = a.frames[dirs];
    let i = Math.floor(this.ft * a.fps);
    i = a.loop ? i % fr.length : Math.min(fr.length - 1, i);
    const f = fr[i];
    if (this.mat.map !== a.tex) { this.mat.map = a.tex; this.mesh.customDepthMaterial.map = a.tex; this.mat.needsUpdate = true; this.mesh.customDepthMaterial.needsUpdate = true; }
    let u0 = f.x / a.cw, u1 = (f.x + f.w) / a.cw;
    const v1 = 1 - f.y / a.ch, v0 = 1 - (f.y + f.h) / a.ch;
    if (this.flip && dirs === 'side') [u0, u1] = [u1, u0];
    // side frames are baked facing right (+x); facing left mirrors them
    const uv = this.uv;
    uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
    uv.needsUpdate = true;
  }
  update(dt) {
    this.yaw = lerpAngle(this.yaw, this.yawT, damp(14, dt));
    this.obj.position.copy(this.pos);
    const cyaw = this._pickDir();
    // cylindrical billboard: the plane faces the camera
    this.mesh.rotation.y = cyaw;
    // state machine: action > mode > talk > locomotion
    const sp = this.anim.speed;
    let want;
    if (this.action) { want = this.action.name; this.action.t += dt; if (this.action.t >= this.action.dur) this.action = null; }
    if (!want) want = this.modeName && this.set.anims[this.modeName] ? this.modeName : sp > 3.4 ? 'run' : sp > 0.25 ? 'walk' : this.talking ? 'talk' : 'idle';
    if (want !== this.cur) { this.cur = want; this.ft = 0; }
    const rate = want === 'walk' ? Math.max(0.6, sp / 2.4) : want === 'run' ? Math.max(0.7, sp / 4.6) : 1;
    // stepped like hand-drawn frames: advance time, pick frame by fps
    this.ft += dt * rate;
    this._setFrame();
    if (this.flashT > 0) { this.flashT -= dt; setFx(this.obj, 'uFlashColor', this.flashCol); setFx(this.obj, 'uFlash', Math.max(0, Math.min(1, this.flashT * 8))); }
    else if (this.flashT > -1) { this.flashT = -2; setFx(this.obj, 'uFlash', 0); }
    if (this.dissolveDir) {
      this.dissolveT += (dt / this.dissolveDur) * this.dissolveDir;
      if (this.dissolveT >= 1) { this.dissolveT = 1; this.dissolveDir = 0; }
      if (this.dissolveT <= 0) { this.dissolveT = 0; this.dissolveDir = 0; }
      setFx(this.obj, 'uDissolve', this.dissolveT);
    }
    if (this.onUpdate) this.onUpdate(dt);
  }
  dispose() {
    if (this.obj.parent) this.obj.parent.remove(this.obj);
    this.mat.dispose(); this.mesh.customDepthMaterial.dispose(); this.geo.dispose();
    if (this.blob) { this.blob.geometry.dispose(); this.blob.material.dispose(); }
  }
}
