// ToonPerson: the from-scratch anime people as Tokonmon actors (a Model-like object: group, bones,
// animator(), dispose()), in the hand-painted PS1 anime style: one low-poly, flat-shaded, softly skinned
// body with a small pixel-painted texture (body.js), a faceted head with a painted pixel face and chunky
// hair (head.js) riding the head bone, springy tails / skirt / ahoge, ribbons, hats and hand props,
// driven by ToonAnim (anim.js).
import * as THREE from '../../../../vendor/three.module.js';
import { dims, joints, buildBody, BONES, PARENT } from './body.js';
import { ToonAnim } from './anim.js';
import { ToonHead, softMat } from './head.js';
import { TOON_CAST, passerby } from './cast.js';

const lam = (c) => softMat({ color: c });

export class ToonPerson {
  constructor(spec, o = {}) {
    this.spec = spec; this.name = o.name || spec.id || 'person';
    const D = this.D = dims(spec), J = this.J = joints(D, spec);
    this.group = new THREE.Group(); this.group.name = this.name;
    // the skeleton (rest pose: no rotations, so bind = translation)
    const b = this.b = {};
    for (const n of BONES) { const bn = new THREE.Bone(); bn.name = n; b[n] = bn; }
    for (const n of BONES) { if (n === 'root') continue; const pa = PARENT[n]; b[pa].add(b[n]); b[n].position.set(J[n][0] - J[pa][0], J[n][1] - J[pa][1], J[n][2] - J[pa][2]); }
    this.rest = Object.fromEntries(BONES.map((n) => [n, b[n].position.clone()]));
    const body = buildBody(spec, D, J);
    this.tex = body.tex; this.mat = softMat({ map: body.tex });
    const mesh = this.mesh = new THREE.SkinnedMesh(body.geo, this.mat);
    mesh.add(b.root); mesh.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(BONES.map((n) => b[n])));
    mesh.castShadow = true; mesh.receiveShadow = false;
    // a generous fixed bound (covers sitting and lying down)
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, D.H * 0.5, 0), D.H * 1.2);
    this.group.add(mesh);
    // the head: ToonHead reads { P, J, b, spec, tails } (a hat flattens the ahoge)
    const st = (spec.hair || {}).style;
    this.twin = st === 'twintails' || st === 'pigtails';
    const hs = spec.hat && spec.hat.kind !== 'headband' ? { ...spec, hair: { ...spec.hair, ahoge: 0 } } : spec;
    this.h = { P: D, J, b, spec: hs, tails: [{ x: 0, z: 0 }, { x: 0, z: 0 }] };
    this.head = new ToonHead(this.h);
    this.extras = [];
    this.buildHat(spec.hat); this.buildBows(); this.buildProps();
    this.bones = { head: b.head, body: b.chest };
    this.def = { name: this.name, anim: {} }; this.order = []; this.talking = false;
  }
  animator() { return new ToonAnim(this); }
  // ---------------------------------------------------------------- accessories
  add(bone, mesh, at) { const g = new THREE.Group(); g.position.set(-this.J[bone][0], -this.J[bone][1], -this.J[bone][2]); this.b[bone].add(g); if (at) mesh.position.set(...at); g.add(mesh); mesh.castShadow = true; this.extras.push(mesh); return mesh; }
  buildHat(h) {
    if (!h) return;
    const D = this.D, hu = D.hu, cy = D.chin + hu * 0.6, hw = D.hw * 1.04, hd = D.hd;
    if (h.kind === 'cap' || h.kind === 'flatcap' || h.kind === 'beanie') {
      const g = new THREE.Group(); g.position.set(-this.J.head[0], -this.J.head[1], -this.J.head[2]); this.b.head.add(g);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam(h.col || '#c83a3a'));
      const k = h.kind === 'beanie' ? 1.2 : 1.16; dome.scale.set(hw * k, hu * (h.kind === 'flatcap' ? 0.42 : h.kind === 'beanie' ? 0.66 : 0.56), hd * k); dome.position.set(0, cy, D.hcz - hd * 0.04);
      if (h.kind === 'flatcap') dome.rotation.x = 0.12;
      g.add(dome); this.extras.push(dome);
      if (h.kind === 'beanie') { const cuff = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 18, 1, true), lam(h.col2 || h.col || '#c83a3a')); cuff.material.side = THREE.DoubleSide; cuff.scale.set(hw * 1.24, hu * 0.16, hd * 1.24); cuff.position.set(0, cy + hu * 0.04, D.hcz - hd * 0.04); g.add(cuff); }
      else {
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, -Math.PI / 2, Math.PI), lam(h.col2 || h.col || '#c83a3a'));
        brim.scale.set(hw * 0.95, hu * 0.04, hd * (h.kind === 'flatcap' ? 0.55 : 0.85)); brim.position.set(0, cy + hu * 0.02, D.hcz + hd * 0.92); brim.rotation.x = h.kind === 'flatcap' ? 0.25 : 0.1; g.add(brim);
        if (h.kind === 'cap') { const btn = new THREE.Mesh(new THREE.SphereGeometry(hu * 0.05, 8, 6), lam(h.col2 || '#f4efe6')); btn.position.set(0, cy + hu * 0.56, D.hcz - hd * 0.04); g.add(btn); }
      }
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    } else if (h.kind === 'headband') {
      const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 24), lam(h.col || '#28bcc0'));
      band.scale.set(hw * 1.1, hd * 1.12, hu * 0.7); band.rotation.x = Math.PI / 2 - 0.2; band.position.set(0, D.chin + hu * 0.78, D.hcz - hd * 0.05);
      this.add('head', band);
      const knot = new THREE.Mesh(new THREE.SphereGeometry(hu * 0.07, 8, 6), lam(h.col || '#28bcc0')); knot.scale.set(1, 0.7, 0.8);
      this.add('head', knot, [0, D.chin + hu * 0.7, D.hcz - hd * 1.1]);
      for (const s of [1, -1]) { const tail = new THREE.Mesh(new THREE.BoxGeometry(hu * 0.07, hu * 0.32, hu * 0.02), lam(h.col || '#28bcc0')); tail.rotation.set(0.5, 0, s * 0.35); this.add('head', tail, [s * hu * 0.06, D.chin + hu * 0.55, D.hcz - hd * 1.16]); }
    }
  }
  bow(bone, at, col, size = 1) {
    const hu = this.D.hu, m = lam(col), g = new THREE.Group();
    for (const s of [1, -1]) { const loop = new THREE.Mesh(new THREE.ConeGeometry(hu * 0.1 * size, hu * 0.2 * size, 4), m); loop.rotation.z = s * Math.PI / 2; loop.scale.set(1, 1, 0.45); loop.position.x = s * hu * 0.1 * size; g.add(loop); }
    for (const s of [1, -1]) { const tail = new THREE.Mesh(new THREE.BoxGeometry(hu * 0.05 * size, hu * 0.16 * size, hu * 0.02), m); tail.position.set(s * hu * 0.04 * size, -hu * 0.09 * size, -hu * 0.01); tail.rotation.z = s * 0.35; g.add(tail); }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(hu * 0.045 * size, 8, 6), m); g.add(knot);
    g.position.set(...at); const holder = new THREE.Group(); holder.position.set(-this.J[bone][0], -this.J[bone][1], -this.J[bone][2]); holder.add(g); this.b[bone].add(holder);
    g.traverse((x) => { if (x.isMesh) x.castShadow = true; });
    return g;
  }
  buildBows() {
    const H = this.spec.hair || {}, D = this.D, hu = D.hu, J = this.J, st = H.style;
    if (H.ribbon) {
      if (st === 'ponytail') { const b = this.bow('tailL', [J.tailL[0], J.tailL[1] - hu * 0.02, J.tailL[2] - hu * 0.03], H.ribbon); b.rotation.x = -0.4; }
      else if (this.twin) for (const n of ['tailL', 'tailR']) { const b = this.bow(n, [J[n][0], J[n][1] + hu * 0.04, J[n][2]], H.ribbon, 0.9); b.rotation.y = Math.sign(J[n][0]) * Math.PI / 2; }
      else this.bow('head', [D.hw * 0.62, D.chin + hu * 0.94, D.hcz + D.hd * 0.2], H.ribbon, 0.8).rotation.set(-0.3, 0.3, 0.3);
    }
    if (H.clip) for (let k = 0; k < 2; k++) {
      const x = -D.hw * (0.5 + k * 0.1), y = D.chin + hu * (0.74 + k * 0.07), clip = new THREE.Mesh(new THREE.BoxGeometry(hu * 0.18, hu * 0.035, hu * 0.03), lam(H.clip));
      clip.rotation.z = -0.5; this.add('head', clip, [x, y, this.head.surfZ(x, y, 1.12)]);
    }
  }
  buildProps() {
    // a phone and a takeaway cup that appear in the right hand for gestures that use them
    const D = this.D, hu = D.hu, J = this.J, w = J.hR, d = D.armDir, at = [w[0] - d[0] * D.hand * 0.55, w[1] + d[1] * D.hand * 0.55, w[2] + hu * 0.06];
    const phone = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(hu * 0.17, hu * 0.32, hu * 0.03), lam('#26222c')); phone.add(body);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(hu * 0.14, hu * 0.27), new THREE.MeshBasicMaterial({ color: 0x9ad8ff, side: THREE.DoubleSide })); scr.position.z = -hu * 0.016; scr.rotation.y = Math.PI; phone.add(scr);
    phone.rotation.set(-1.0, 0, 0);
    const cup = new THREE.Group();
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(hu * 0.1, hu * 0.08, hu * 0.3, 10), lam('#f4efe6')); cup.add(c1);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(hu * 0.105, hu * 0.105, hu * 0.05, 10), lam('#5a3a2a')); lid.position.y = hu * 0.17; cup.add(lid);
    const sl = new THREE.Mesh(new THREE.CylinderGeometry(hu * 0.103, hu * 0.093, hu * 0.1, 10), lam('#c8823a')); cup.add(sl);
    this.props = { phone, cup };
    for (const [k, m] of Object.entries(this.props)) { m.visible = false; m.position.set(...at); const g = new THREE.Group(); g.position.set(-w[0], -w[1], -w[2]); g.add(m); this.b.hR.add(g); m.traverse((x) => { if (x.isMesh) x.castShadow = true; }); void k; }
    // a walking cane for the elders who carry one
    for (const a of (this.spec.outfit || {}).acc || []) if ((a.kind || a) === 'cane') {
      const cane = new THREE.Mesh(new THREE.CylinderGeometry(hu * 0.035, hu * 0.035, J.hR[1] - hu * 0.05, 6), lam(a.color || '#5a3a22'));
      cane.position.set(J.hR[0] - d[0] * D.hand * 0.5, J.hR[1] / 2 - hu * 0.2, J.hR[2] + hu * 0.12);
      const g = new THREE.Group(); g.position.set(-J.hR[0], -J.hR[1], -J.hR[2]); g.add(cane); this.b.hR.add(g); cane.castShadow = true;
    }
  }
  showProp(name) { for (const [k, m] of Object.entries(this.props)) m.visible = k === name; }
  finishPaint() { return this; }
  dispose() {
    this.mesh.geometry.dispose(); this.mat.dispose(); this.tex.dispose(); this.head.dispose();
    this.group.traverse((o) => { if (o.isMesh && o !== this.mesh) { if (o.geometry) o.geometry.dispose(); } });
  }
}

// ---------------------------------------------------------------- the cast
const cache = new Map();
export function toonSpec(who) {
  if (who && typeof who === 'object') return who.outfit ? who : fromOld(who);
  if (cache.has(who)) return cache.get(who);
  // named cast members; passers-by from their number, or (named extras without one) from a hash of the name
  const str = String(who), num = +str.replace(/\D/g, ''), h = [...str].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;
  const s = TOON_CAST[who] ? { ...TOON_CAST[who], id: who } : passerby(/^passerby\d+$/.test(str) && num ? num : 1000 + (h % 100000));
  cache.set(who, s);
  return s;
}
// specs in the older people's format ({ sex, age, hair: { style, col }, top: { kind, col, col2 }, bottom, shoes, hat, glasses, acc }) → toon specs
const OLD_TOP = { tee: 'tee', shirt: 'shirt', polo: 'shirt', jacket: 'jacket', blazer: 'blazer', cardigan: 'cardigan', knit: 'knit', hoodie: 'hoodie', coat: 'coat', blouse: 'blouse', tank: 'tank' };
const hexc = (c) => (c === undefined || c === null ? undefined : Array.isArray(c) ? '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('') : typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c);
export function fromOld(o) {
  const T = o.top || {}, B = o.bottom || {}, S = o.shoes || {}, base = passerby(o.seed || 1);
  return {
    ...base, id: o.id || base.id, sex: o.sex || base.sex, age: o.age || base.age, H: o.H || base.H, build: o.build || base.build, belly: o.belly || 0, skin: hexc(o.skin) || base.skin,
    hair: o.hair ? { ...base.hair, ...o.hair, col: hexc(o.hair.col) || base.hair.col } : base.hair,
    hat: o.hat ? { kind: o.hat.kind, col: hexc(o.hat.col), col2: hexc(o.hat.col2) } : null, glasses: o.glasses ? { kind: o.glasses.kind, col: hexc(o.glasses.col) } : null,
    outfit: {
      top: { kind: OLD_TOP[T.kind] || base.outfit.top.kind, color: hexc(T.col) || base.outfit.top.color, inner: hexc(T.shirt || T.col2), stripe: T.print === 'stripes' ? hexc(T.col2) : hexc(T.stripe) },
      bottom: { kind: B.kind === 'slacks' ? 'slacks' : B.kind || base.outfit.bottom.kind, color: hexc(B.col) || base.outfit.bottom.color, cut: B.cut },
      legs: o.legs === 'kneesocks' ? 'kneesocks' : B.kind === 'shorts' ? 'socks' : undefined, tights: hexc(o.tights),
      shoes: { kind: S.kind === 'sneaker' ? 'sneakers' : S.kind || 'sneakers', color: hexc(S.col) || '#f2f0ea', accent: hexc(S.col2) },
      acc: (o.acc || []).map((a) => ({ kind: a.kind, color: hexc(a.col), side: a.side })),
    },
  };
}
export function castToon(who, o = {}) { return new ToonPerson(toonSpec(who), { name: typeof who === 'string' ? who : who.id, ...o }); }
