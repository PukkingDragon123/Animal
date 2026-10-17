// Actor: a rigged voxel model + animator + particle emitters + FX states.
// Used for Elemon and humans in the overworld, battles and cutscenes.
import * as THREE from '../../vendor/three.module.js';
import { getTemplate, instantiate, formDesign } from './model.js';
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
    this.animOpts = opts.anim;
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

  // ---- forms (e.g. 'elemental'): swap to the derived model, keep pose & state
  setForm(form) {
    const base = this.baseDesign || this.design; this.baseDesign = base;
    const d = form ? formDesign(base, form) : base;
    if (d === this.design) return false;
    const parent = this.obj.parent, hat = this.hatDesign, bonded = this.bonded;
    if (parent) parent.remove(this.obj);
    for (const m of this.rig.materials) m.dispose();
    this.design = d;
    this.tpl = getTemplate(d, d.id);
    this.obj = instantiate(this.tpl, { rim: 0.14, shadow: true });
    this.rig = this.obj.userData.rig;
    this.anim = new Animator(this.obj, this.animOpts);
    this.obj.scale.setScalar(this.scale);
    this.obj.position.copy(this.pos); this.obj.rotation.y = this.yaw;
    this.obj.visible = this.visible;
    if (parent) parent.add(this.obj);
    this.hatObj = null;
    if (bonded) this.setBond(true);
    if (hat) this.wearHat(hat);
    this.form = form || null;
    return true;
  }
  // ---- Bonding: overlay parts appear, gimmick parts grow, aura particles
  setBond(on) {
    this.bonded = on;
    const rig = this.rig;
    for (const n of (rig.tagged && rig.tagged.bond) || []) { const b = rig.bones[n]; if (b) b.visible = on; }
    this.growT = on ? 1 : 0;
  }
  // ---- wear the trainer's accessory (hat etc.) on the bond anchor
  wearHat(design, key) {
    if (this.hatObj) { this.hatObj.parent && this.hatObj.parent.remove(this.hatObj); for (const m of this.hatObj.userData.rig.materials) m.dispose(); this.hatObj = null; }
    const a = this.rig.hat;
    if (!design) this.hatDesign = null;
    if (!design || !a) return null;
    const bone = this.rig.bones[a.part || 'head'] || this.rig.pose;
    const tpl = getTemplate(design, key || design.id);
    const obj = instantiate(tpl, { rim: 0.14 });
    this.hatDesign = design;
    const piv = (this.tpl.parts.find((p) => p.name === (a.part || 'head')) || { pivot: [0, 0, 0] }).pivot;
    obj.position.set(a.at[0] - piv[0], a.at[1] - piv[1], a.at[2] - piv[2]);
    obj.rotation.set((a.tilt || 0) * Math.PI / 180, 0, (a.roll || 0) * Math.PI / 180);
    obj.scale.setScalar(a.scale || 1);
    bone.add(obj);
    this.hatObj = obj;
    return obj;
  }
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
    // bond gimmick growth (e.g. expanding horns) eases in/out
    const grow = this.rig.bond && this.rig.bond.grow;
    if (grow) {
      this.growS = (this.growS || 0) + ((this.growT || 0) - (this.growS || 0)) * damp(6, dt);
      for (const [n, k] of Object.entries(grow)) { const b = this.rig.bones[n]; if (b) b.scale.setScalar(1 + (k - 1) * this.growS); }
    }
    if (this.bonded && this.rig.bond && this.rig.bond.aura && this.visible) this.bondAura(dt);
    if (this.onUpdate) this.onUpdate(dt);
  }
  bondAura(dt) {
    this.auraAcc = (this.auraAcc || 0) + dt * 14;
    const fx = this.gfx.fx, kind = this.rig.bond.aura, col = this.rig.bond.auraColor || [1.6, 1.4, 2.6, 1];
    while (this.auraAcc >= 1) {
      this.auraAcc -= 1;
      const r = (this.rig.radius || 0.5) * this.scale, ang = Math.random() * Math.PI * 2;
      const p = [this.pos.x + Math.cos(ang) * r, this.pos.y + Math.random() * this.height, this.pos.z + Math.sin(ang) * r];
      const spr = { flame: SPR.flame, bubbles: SPR.bubble, petals: SPR.petal, sparks: SPR.star, notes: SPR.note, leaves: SPR.leaf }[kind] ?? SPR.dot;
      fx.particle({ pos: p, vel: [(Math.random() - 0.5) * 0.4, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 0.4], life: 0.9, size: 0.12, size1: 0.03, color: col, color1: [col[0], col[1], col[2], 0], sprite: spr, additive: kind !== 'petals' && kind !== 'leaves' });
    }
  }
  dispose() {
    if (this.obj.parent) this.obj.parent.remove(this.obj);
    for (const m of this.rig.materials) m.dispose();
  }
}
