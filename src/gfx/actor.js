// Actor: a rigged voxel model + animator + particle emitters + FX states.
// Used for Elemon and humans in the overworld, battles and cutscenes.
import * as THREE from '../../vendor/three.module.js';
import { getTemplate, instantiate } from './model.js';
import { Animator } from './anim.js';
import { tickEmitters } from './emitters.js';
import { setFx } from './materials.js';
import { SPR } from './particles.js';
import { lerpAngle, damp } from '../core/mathx.js';

const EMOTES = { '!': SPR.bang, '?': SPR.bang, heart: SPR.heart, note: SPR.note, zz: SPR.zz, star: SPR.star5, anger: SPR.cross, sweat: SPR.drop, swirl: SPR.swirl };
const EMOTE_COL = { '!': [2, 1.6, 0.3, 1], '?': [0.8, 1.6, 2.4, 1], heart: [2.4, 0.6, 1.2, 1], note: [1.8, 1.2, 2.4, 1], zz: [1.2, 1.4, 2, 1], star: [2.4, 2.2, 0.6, 1], anger: [2.4, 0.3, 0.3, 1], sweat: [0.7, 1.4, 2.4, 1], swirl: [1.6, 1.6, 1.6, 1] };

export class Actor {
  constructor(gfx, design, key, opts = {}) {
    this.gfx = gfx;
    this.design = design;
    this.tpl = getTemplate(design, key || design.id);
    this.obj = instantiate(this.tpl, { rim: opts.rim ?? 0.14, shadow: opts.shadow !== false });
    this.rig = this.obj.userData.rig;
    this.anim = new Animator(this.obj, opts.anim);
    this.scale = opts.scale || 1;
    this.obj.scale.setScalar(this.scale);
    this.pos = new THREE.Vector3();
    this.yaw = 0; this.yawT = 0; this.turnRate = opts.turnRate ?? 10;
    this.flashT = 0; this.flashCol = 0xffffff;
    this.dissolveT = 0; this.dissolveDir = 0; this.spectral = 0; this.spectralT = 0;
    this.tint = null;
    this.emitMul = 1;
    this.visible = true;
    this.onUpdate = null;
    if (opts.parent !== null) (opts.parent || gfx.actors).add(this.obj);
  }
  get height() { return this.rig.height * this.scale; }
  setPos(x, y, z) { this.pos.set(x, y, z); this.obj.position.copy(this.pos); return this; }
  face(yaw, instant = false) { this.yawT = yaw; if (instant) { this.yaw = yaw; this.obj.rotation.y = yaw; } return this; }
  faceTo(x, z, instant = false) { return this.face(Math.atan2(x - this.pos.x, z - this.pos.z), instant); }
  play(name, opts) { return this.anim.play(name, opts); }
  mode(name) { this.anim.setMode(name); }
  expr(e, dur) { this.anim.setFace(e, dur); }
  talk(on) { this.anim.talk(on); }
  flash(color = 0xffffff, t = 0.12) { this.flashCol = color; this.flashT = t; }
  setTint(color, amt) { setFx(this.obj, 'uTint', color); setFx(this.obj, 'uTintAmt', amt); }
  dissolve(dir = 1, dur = 0.8, color = 0x9fe8ff) { setFx(this.obj, 'uDissolveColor', color); this.dissolveDir = dir; this.dissolveDur = dur; if (dir > 0) this.dissolveT = 0; else this.dissolveT = 1; }
  setSpectral(on) { this.spectralT = on ? 1 : 0; }
  headPos(out = new THREE.Vector3()) { return out.set(this.pos.x, this.pos.y + this.height + 0.25, this.pos.z); }
  emote(kind, fx = this.gfx.fx) {
    const p = this.headPos();
    fx.particle({ pos: [p.x, p.y + 0.15, p.z], vel: [0, 0.6, 0], life: 1.2, size: 0.4, size1: 0.46, color: EMOTE_COL[kind] || [2, 2, 2, 1], color1: EMOTE_COL[kind] || [2, 2, 2, 0], sprite: EMOTES[kind] ?? SPR.bang, drag: 2 });
  }
  setVisible(v) { this.visible = v; this.obj.visible = v; }
  update(dt) {
    this.yaw = lerpAngle(this.yaw, this.yawT, damp(this.turnRate, dt));
    this.obj.rotation.y = this.yaw;
    this.obj.position.copy(this.pos);
    this.anim.update(dt);
    if (this.visible && this.emitMul > 0) tickEmitters(this.gfx.fx, this.rig, dt, this.emitMul, this.scale);
    if (this.flashT > 0) { this.flashT -= dt; setFx(this.obj, 'uFlashColor', this.flashCol); setFx(this.obj, 'uFlash', Math.max(0, Math.min(1, this.flashT * 8))); }
    else if (this.flashT > -1) { this.flashT = -2; setFx(this.obj, 'uFlash', 0); }
    if (this.dissolveDir) {
      this.dissolveT += (dt / this.dissolveDur) * this.dissolveDir;
      if (this.dissolveT >= 1) { this.dissolveT = 1; this.dissolveDir = 0; }
      if (this.dissolveT <= 0) { this.dissolveT = 0; this.dissolveDir = 0; }
      setFx(this.obj, 'uDissolve', this.dissolveT);
    }
    if (Math.abs(this.spectral - this.spectralT) > 0.001) { this.spectral += (this.spectralT - this.spectral) * damp(3, dt); setFx(this.obj, 'uSpectral', this.spectral); }
    if (this.onUpdate) this.onUpdate(dt);
  }
  dispose() {
    if (this.obj.parent) this.obj.parent.remove(this.obj);
    for (const m of this.rig.materials) m.dispose();
  }
}
