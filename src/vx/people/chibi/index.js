// ChibiPerson: the game's people — blocky chibi characters as Tokonmon actors (a Model-like object: group,
// bones, animator(), dispose()). Rigid boxes on an animated skeleton (rig.js), dressed in one pixel-art
// atlas, with a 32×30 pixel face that changes with blinks, glances, talking and expressions (build.js),
// driven by the procedural animator (anim.js): walk / run, idle, gestures, look-at, springy hair and skirts.
import * as THREE from '../../../../vendor/three.module.js';
import { dims, joints, BONES, PARENT } from './rig.js';
import { buildChibi, paintFace, FW, FH } from './build.js';
import { ToonAnim } from './anim.js';
import { Buf, rgb } from './raster.js';
import { TOON_CAST, passerby } from './cast.js';

/** soft, bright, flat material: Lambert with a little self-light scaled by the texture (the stage's cel pass skips it) */
function soft(o = {}) {
  const m = new THREE.MeshLambertMaterial({ map: o.map || null, alphaTest: o.alpha ? 0.5 : 0, side: o.side || THREE.FrontSide });
  if (o.color !== undefined) m.color.setRGB(...rgb(o.color).map((v) => Math.pow(v / 255, 2.2)));
  m.emissive.setRGB(0.36, 0.36, 0.36); if (o.map) m.emissiveMap = o.map; else m.emissive.copy(m.color).multiplyScalar(0.36);
  m.userData.keep = true;
  return m;
}

export class ChibiPerson {
  constructor(spec, o = {}) {
    this.spec = spec; this.name = o.name || spec.id || 'person';
    const D = this.D = dims(spec), J = this.J = joints(D, spec);
    this.group = new THREE.Group(); this.group.name = this.name;
    const b = this.b = {};
    for (const n of BONES) { const bn = new THREE.Bone(); bn.name = n; b[n] = bn; }
    for (const n of BONES) { if (n === 'root') continue; const pa = PARENT[n]; b[pa].add(b[n]); b[n].position.set(J[n][0] - J[pa][0], J[n][1] - J[pa][1], J[n][2] - J[pa][2]); }
    this.rest = Object.fromEntries(BONES.map((n) => [n, b[n].position.clone()]));
    const { geo, atlas } = buildChibi(spec, D, J);
    this.atlasTex = atlas.texture();
    this.face = new Buf(FW, FH); this.faceTex = this.face.texture();
    this.mats = [soft({ map: this.atlasTex, alpha: true }), soft({ map: this.faceTex })];
    const mesh = this.mesh = new THREE.SkinnedMesh(geo, this.mats);
    mesh.add(b.root); mesh.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(BONES.map((n) => b[n])));
    mesh.castShadow = true; mesh.receiveShadow = false;
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, D.H * 0.5, 0), D.H * 1.3);
    this.group.add(mesh);
    // the animator's hooks: hair springs and the face
    const st = (spec.hair || {}).style;
    this.twin = st === 'twintails' || st === 'pigtails';
    this.h = { tails: [{ x: 0, z: 0 }, { x: 0, z: 0 }] };
    this.head = { update: (E) => this.updateFace(E) };
    this.key = ''; this.setFace({ eye: 'open', mouth: 'neutral', look: 0 });
    this.buildProps();
    this.bones = { head: b.head, body: b.chest };
    this.def = { name: this.name, anim: {} }; this.order = []; this.talking = false;
  }
  animator() { return new ToonAnim(this); }
  setFace(st) {
    const key = st.eye + st.mouth + st.look + (st.blush ?? '');
    if (key === this.key) return; this.key = key;
    paintFace(this.face, this.spec, this.D, st); this.faceTex.needsUpdate = true;
  }
  /** the animator's expression parameters → a pixel face */
  updateFace(E) {
    const blink = E.blink || 0, up = E.upper ?? 1, inn = E.inner || 0, ch = E.cheek || 0;
    let eye = 'open';
    if (blink > 0.5 || up < 0.15) eye = 'closed'; else if (ch >= 0.95 && up < 0.9) eye = 'happy'; else if (up < 0.6) eye = 'half'; else if (up > 1.2) eye = 'wide'; else if (inn > 1) eye = 'sad'; else if (inn < -1) eye = 'angry';
    const o = E.open || 0, r = E.round || 0, c = E.corner || 0;
    let mouth = 'neutral';
    if (r > 0.95 && o < 2) mouth = 'duck'; else if (o > 3 && r > 0.5) mouth = 'O'; else if (o > 1.8) mouth = E.teeth > 0.5 && c > 1.8 ? 'grin' : 'open'; else if (o > 0.7) mouth = 'small'; else if (c > 1.1) mouth = 'smile'; else if (c < -0.5) mouth = 'frown';
    const fem = this.D.f || this.D.kid, blush = ch > 0.9 ? 2 : ch > 0.4 || fem ? 1 : 0;
    this.setFace({ eye, mouth, look: Math.max(-1, Math.min(1, Math.round((E.lookX || 0) * 0.6))), blush });
  }
  buildProps() {
    // a phone and a takeaway cup appear in the right hand for the gestures that use them; elders may carry a cane
    const J = this.J, w = J.hR, hold = new THREE.Group(); hold.position.set(0, -this.D.hand * 0.7, 0.04); this.b.hR.add(hold);
    const box = (sx, sy, sz, c, at = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), soft({ color: c })); m.position.set(...at); m.castShadow = true; return m; };
    const phone = new THREE.Group(); phone.add(box(0.055, 0.1, 0.012, '#26222c')); const scr = box(0.045, 0.085, 0.002, '#9ad8ff', [0, 0, -0.007]); scr.material.emissive.setRGB(0.4, 0.6, 0.7); phone.add(scr); phone.rotation.x = -0.9;
    const cup = new THREE.Group(); cup.add(box(0.05, 0.08, 0.05, '#f4efe6')); cup.add(box(0.054, 0.015, 0.054, '#5a3a2a', [0, 0.045, 0])); cup.add(box(0.052, 0.03, 0.052, '#c8823a', [0, -0.005, 0]));
    this.props = { phone, cup };
    for (const m of Object.values(this.props)) { m.visible = false; hold.add(m); }
    for (const a of (this.spec.outfit || {}).acc || []) if ((a.kind || a) === 'cane') { const c = box(0.025, w[1] - 0.02, 0.025, a.color || '#5a3a22', [0, -(w[1] - 0.02) / 2 + 0.04, 0.02]); hold.add(c); }
  }
  showProp(name) { for (const [k, m] of Object.entries(this.props)) m.visible = k === name; }
  finishPaint() { return this; }
  dispose() {
    this.mesh.geometry.dispose(); for (const m of this.mats) m.dispose(); this.atlasTex.dispose(); this.faceTex.dispose();
    this.group.traverse((o) => { if (o.isMesh && o !== this.mesh) { o.geometry.dispose(); o.material.dispose(); } });
  }
}

// ---------------------------------------------------------------- the cast
// specs in an older people format ({ sex, age, hair: { style, col }, top: { kind, col, col2 }, bottom, shoes, hat, glasses, acc }) → chibi specs
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
      bottom: { kind: B.kind || base.outfit.bottom.kind, color: hexc(B.col) || base.outfit.bottom.color, cut: B.cut },
      legs: o.legs === 'kneesocks' ? 'kneesocks' : B.kind === 'shorts' ? 'socks' : undefined, tights: hexc(o.tights),
      shoes: { kind: S.kind === 'sneaker' ? 'sneakers' : S.kind || 'sneakers', color: hexc(S.col) || '#f2f0ea', accent: hexc(S.col2) },
      acc: (o.acc || []).map((a) => ({ kind: a.kind, color: hexc(a.col), side: a.side })),
    },
  };
}
const cache = new Map();
export function chibiSpec(who) {
  if (who && typeof who === 'object') return who.outfit ? who : fromOld(who);
  if (cache.has(who)) return cache.get(who);
  // named cast members; passers-by from their number, or (named extras without one) from a hash of the name
  const str = String(who), num = +str.replace(/\D/g, ''), h = [...str].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;
  const s = TOON_CAST[who] ? { ...TOON_CAST[who], id: who } : passerby(/^passerby\d+$/.test(str) && num ? num : 1000 + (h % 100000));
  cache.set(who, s);
  return s;
}
export function castChibi(who, o = {}) { return new ChibiPerson(chibiSpec(who), { name: typeof who === 'string' ? who : who.id, ...o }); }
