// Tokonmon in daily life: the creatures who live in the walkable city alongside its people.
//  · Partners at their people's heels (passers-by on the avenues, joggers) or next to them (shopkeepers,
//    kids, the chess players…); helpers at work (a tea tray, a boba tray, a broom, a fish crate, a parcel,
//    a crossing guard's sign); pets napping on sofas, porches, fences and roofs; wild ones in the park's
//    tall grass and pond; birds on the wires and railings, swimmers and a surfer in the bay; little
//    moments (tag on the half-court, a cub chasing a pigeon round the fountain, kids' pretend battles).
//  · LIFE lists them per district; NPC partners are keyed by the NPC's id (districts stay untouched).
//  · Day / night: entries marked t: 'night' only come out after dark (lantern ghosts, the alley raccoon,
//    an owl on the wire), t: 'day' ones go home; `dusk` swaps a clip (sleepy ones nod off).
//  · Every resident is BAKED (bakeModel): its few hundred cube + outline meshes merge into a handful of
//    skinned meshes sharing one skeleton made of the rig's own bones, so animation is unchanged but it
//    costs ~5–10 draw calls instead of ~400.
//  · LOD: residents more than ~28 m from the player are detached from the scene and stop animating
//    (companions keep pace with their owner invisibly); indoor ones show only while you're in that building.
//  · They notice you (turn, look, emote, cry, hop; shy ones startle, birds fly off) and [E] lets you pet,
//    play with or share a snack with them; wild ones in the grass can be battled.
// Hooks in world.js: load() makes a CityLife for the city, spawnLife() starts it, update() ticks it,
// clear() disposes it. Cutscenes can call world.life.hush(true) to clear the streets and hush(false) after.
import * as THREE from '../../../vendor/three.module.js';
import { SPECIES } from '../../data/species.js';
import { ITEMS } from '../../data/items.js';
import * as S from '../../game/state.js';
import { OUTLINE } from '../model.js';

// LOD radii (m): animate within ANIM (hysteresis to ANIM2), draw (frozen in their last pose) out to VIS (VIS2)
const PI = Math.PI, ANIM = 27, ANIM2 = 31, VIS = 48, VIS2 = 54;
const NOOP = () => {};
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ==================================================================================== baking
const _m = new THREE.Matrix4(), _n = new THREE.Matrix3(), _l = new THREE.Matrix3(), _p = new THREE.Vector3(), _d = new THREE.Vector3();
const HULLS = new Map();
/** the outline hull material, skinned: the same inverted hull, pushed out by uPx screen pixels along the cube's own axes */
function skinnedHull(src) {
  if (HULLS.has(src)) return HULLS.get(src);
  const m = new THREE.ShaderMaterial({
    uniforms: src.uniforms, side: THREE.BackSide, fragmentShader: src.fragmentShader,
    vertexShader: `#include <common>
#include <skinning_pars_vertex>
attribute vec3 hd; uniform float uK; uniform float uPx;
void main() {
  #include <skinbase_vertex>
  vec3 transformed = position;
  #include <skinning_vertex>
  vec3 dd = hd;
  #ifdef USE_SKINNING
    dd = (bindMatrixInverse * (boneMatX * (bindMatrix * vec4(hd, 0.0)))).xyz;
  #endif
  vec4 mv0 = modelViewMatrix * vec4(transformed, 1.0);
  float sc = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
  float e = uPx * uK * max(0.5, -mv0.z) / max(1e-4, sc);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed + dd * e, 1.0);
}`,
  });
  HULLS.set(src, m); OUTLINE.mats.add(m); m.visible = src.visible; return m;      // the stage hides hulls under its ink pass
}
/**
 * Merge a Model's cube and outline meshes into skinned meshes (one per material, plus one per expression
 * part the animator toggles), bound to a skeleton made of the rig's bone groups. Hidden accessory cubes are
 * dropped. Model.show(id) keeps working for expression parts. Returns { meshes, skeleton, dispose }.
 */
export function bakeModel(model, spec = model.def.anim || {}) {
  const g = model.group; g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  const partOf = new Map(); for (const [id, list] of Object.entries(model.parts)) for (const ms of list) partOf.set(ms, id);
  const live = new Set(); for (const f of Object.values(spec.faces || {})) for (const ids of Object.values(f.states || {})) for (const id of ids) live.add(id);
  const meshes = []; g.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && !o.userData.keep) meshes.push(o); });
  const owner = new Map(); for (const o of meshes) if (o.userData.hull) owner.set(o.userData.hull, o);
  const bones = [], bix = new Map(), buckets = new Map(), gone = [];
  for (const o of meshes) {
    const own = owner.get(o) || o, id = partOf.get(own), dyn = id !== undefined && live.has(id), hull = own !== o;
    gone.push(o);
    if (!dyn && !own.visible) continue;                       // an accessory this one doesn't wear
    const host = o.parent; let bi = bix.get(host); if (bi === undefined) { bi = bones.length; bones.push(host); bix.set(host, bi); }
    const key = (dyn ? id : '') + '|' + o.material.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0);
    let B = buckets.get(key);
    if (!B) buckets.set(key, (B = { id: dyn ? id : null, hull, mat: hull ? skinnedHull(o.material) : o.material, cast: o.castShadow, recv: o.receiveShadow, vis: own.visible, list: [] }));
    B.list.push([o, bi]);
  }
  const out = [], byId = {};
  for (const B of buckets.values()) {
    let nv = 0, ni = 0; for (const [o] of B.list) { nv += o.geometry.attributes.position.count; ni += o.geometry.index.count; }
    const P = new Float32Array(nv * 3), N = B.hull ? null : new Float32Array(nv * 3), UV = B.hull ? null : new Float32Array(nv * 2), H = B.hull ? new Float32Array(nv * 3) : null;
    const SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4), I = new Uint32Array(ni);
    let v = 0, k = 0;
    for (const [o, bi] of B.list) {
      const geo = o.geometry, pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv, bc = geo.attributes.bc, idx = geo.index;
      _m.multiplyMatrices(inv, o.matrixWorld); _n.getNormalMatrix(_m); _l.setFromMatrix4(_m);
      for (let i = 0; i < pos.count; i++) {
        const j = v + i; _p.fromBufferAttribute(pos, i);
        if (H) { _d.set(Math.sign(_p.x - bc.getX(i)), Math.sign(_p.y - bc.getY(i)), Math.sign(_p.z - bc.getZ(i))).applyMatrix3(_l); H[j * 3] = _d.x; H[j * 3 + 1] = _d.y; H[j * 3 + 2] = _d.z; }
        _p.applyMatrix4(_m); P[j * 3] = _p.x; P[j * 3 + 1] = _p.y; P[j * 3 + 2] = _p.z;
        if (N) { _d.fromBufferAttribute(nor, i).applyMatrix3(_n).normalize(); N[j * 3] = _d.x; N[j * 3 + 1] = _d.y; N[j * 3 + 2] = _d.z; }
        if (UV) { UV[j * 2] = uv.getX(i); UV[j * 2 + 1] = uv.getY(i); }
        SI[j * 4] = bi; SW[j * 4] = 1;
      }
      for (let t = 0; t < idx.count; t++) I[k++] = idx.getX(t) + v;
      v += pos.count;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    if (N) geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    if (UV) geo.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
    if (H) geo.setAttribute('hd', new THREE.BufferAttribute(H, 3));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4));
    geo.setIndex(new THREE.BufferAttribute(I, 1));
    geo.computeBoundingSphere(); geo.boundingSphere.radius = geo.boundingSphere.radius * 1.4 + 0.3;   // room for the animated pose
    const sm = new THREE.SkinnedMesh(geo, B.mat);
    sm.boundingSphere = geo.boundingSphere.clone(); sm.castShadow = B.cast; sm.receiveShadow = B.recv; sm.visible = B.vis;
    g.add(sm); out.push(sm);
    if (B.id) { const e = byId[B.id] || (byId[B.id] = { meshes: [], hull: null }); if (B.hull) e.hull = sm; else e.meshes.push(sm); }
  }
  for (const o of gone) { o.removeFromParent(); o.geometry.dispose(); }
  g.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  for (const sm of out) sm.bind(skeleton, g.matrixWorld);
  // expression parts toggle their merged meshes; fixed parts have nothing left to toggle
  for (const id of Object.keys(model.parts)) {
    const e = byId[id]; model.parts[id] = e ? e.meshes : [];
    if (e && e.hull) { if (e.meshes[0]) e.meshes[0].userData.hull = e.hull; else model.parts[id] = [e.hull]; }
  }
  model.baked = true;
  return { meshes: out, skeleton, dispose() { for (const sm of out) sm.geometry.dispose(); skeleton.dispose(); } };
}

// ==================================================================================== little props
const PROP_MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
function boxes(list) {
  const P = [], N = [], C = [], I = [], col = new THREE.Color();
  for (const [x0, y0, z0, x1, y1, z1, hex] of list) {
    col.set(hex).convertSRGBToLinear();
    const F = [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
      [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]],
      [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]]];
    for (const [a, b, c, d, n] of F) { const base = P.length / 3; for (const q of [a, b, c, d]) { P.push(...q); N.push(...n); C.push(col.r, col.g, col.b); } I.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
  return g;
}
// metres; origin = where it rests (the top of the head for carried things, the paw for held ones)
const PROPS = {
  tray: () => boxes([[-0.19, 0, -0.14, 0.19, 0.025, 0.14, '#b8864a'], [-0.13, 0.025, -0.06, -0.04, 0.13, 0.03, '#f4f0e8'], [-0.12, 0.13, -0.05, -0.05, 0.135, 0.02, '#7a4a2a'], [0.03, 0.025, -0.04, 0.12, 0.13, 0.05, '#f4f0e8'], [0.04, 0.13, -0.03, 0.11, 0.135, 0.04, '#7a4a2a']]),
  boba: () => boxes([[-0.19, 0, -0.14, 0.19, 0.025, 0.14, '#e8e0d0'], [-0.13, 0.025, -0.06, -0.03, 0.17, 0.04, '#d8b890'], [-0.12, 0.025, -0.05, -0.04, 0.06, 0.03, '#3a2418'], [-0.09, 0.17, -0.02, -0.07, 0.26, 0.0, '#e84a6a'], [0.03, 0.025, -0.04, 0.13, 0.17, 0.06, '#f0a8c0'], [0.04, 0.025, -0.03, 0.12, 0.06, 0.05, '#3a2418'], [0.07, 0.17, 0.0, 0.09, 0.26, 0.02, '#3ab8e8']]),
  parcel: () => boxes([[-0.16, 0, -0.13, 0.16, 0.2, 0.13, '#c89a5a'], [-0.161, 0, -0.03, 0.161, 0.203, 0.03, '#ead8a8'], [0.02, 0.201, 0.04, 0.12, 0.204, 0.11, '#f8f4ec']]),
  crate: () => boxes([[-0.2, 0, -0.15, 0.2, 0.16, 0.15, '#a8784a'], [-0.201, 0.05, -0.151, 0.201, 0.07, 0.151, '#7a5232'], [-0.17, 0.16, -0.12, 0.17, 0.2, 0.12, '#cfe0e8'], [-0.12, 0.2, -0.05, 0.1, 0.24, 0.04, '#8aa0b8'], [-0.05, 0.2, 0.05, 0.14, 0.235, 0.11, '#e0806a']]),
  broom: () => boxes([[-0.015, 0, -0.015, 0.015, 0.95, 0.015, '#a8784a'], [-0.1, -0.16, -0.035, 0.1, 0.02, 0.035, '#e0c060'], [-0.1, 0.0, -0.04, 0.1, 0.03, 0.04, '#c84a3a']]),
  sign: () => boxes([[-0.018, 0, -0.018, 0.018, 0.9, 0.018, '#9a9aa2'], [-0.19, 0.86, -0.02, 0.19, 1.24, 0.02, '#d83a2a'], [-0.14, 1.02, 0.021, 0.14, 1.08, 0.025, '#f8f4ec'], [-0.14, 1.02, -0.025, 0.14, 1.08, -0.021, '#f8f4ec']]),
};
const PROP_GEO = {};
function propMesh(kind) { const g = PROP_GEO[kind] || (PROP_GEO[kind] = PROPS[kind]()); const m = new THREE.Mesh(g, PROP_MAT); m.castShadow = true; m.userData.keep = true; return m; }

// ==================================================================================== the residents
// species voice: the little cry in their bubble, a voice pitch, an extra sound, the happy clip
const VOICE = {
  mopzart: ['Wuff… mop.', 0.9, null, 'conduct'], wheezowl: ['Hoo-hoo!', 1.3, null, 'hug'], kissmet: ['Mrrrow!', 1.7, 'meow', 'tailtiff'], zapkit: ['Mew! Zzt!', 2.2, 'meow', 'pounce'],
  snoozaque: ['Mmh… zzz', 1.0, null, 'comb'], cabbunny: ['Pip!', 2.4, null, 'thump'], lemmo: ['Lem-lem!', 2.1, null, 'zap'], pidgun: ['Coo-RR!', 1.5, 'coo', 'puff'], pidrose: ['Coo~', 1.7, 'coo', 'preen'],
  trashcoon: ['Chrr-chrr!', 1.6, null, 'capspin'], chochobake: ['Boo~', 1.4, null, 'lick'], weirdfin: ['Blub.', 1.8, 'bubble', 'loop'], blowhale: ['Fwoo!', 1.1, null, 'skirl'],
  hawkabunga: ['Kee-yah!', 1.4, null, 'kickflip'], takaptain: ['Kyaa!', 1.2, null, 'salute'], talonaka: ['Kip-kip!', 1.8, null, 'solo'], beatlet: ['Yeah yeah!', 2.0, null, 'mopshake'],
  foopod: ['Hup! Hup!', 2.0, null, 'shadowbox'], gradcub: ['Rrr-wuh!', 1.4, null, 'shades'], grenaday: ['Tick-tick!', 1.9, null, 'dance'], creepetal: ['…hi.', 1.6, null, 'peek'],
  bearbreak: ['Hhh…', 0.8, null, 'sigh'], studrat: ['Skree!', 2.0, null, 'swagger'], dreadrake: ['QUACK.', 0.9, null, 'flex'], woodbub: ['Bub!', 2.3, 'bubble', 'roll'],
  kanizumo: ['Kani!', 0.9, null, 'shimmy'], zapanda: ['Pan-pan!', 1.9, null, 'tailcheck'], metalfang: ['Grr.', 1.0, null, 'chug'], plastree: ['Rustle.', 1.2, null, 'pricecheck'],
  kappachi: ['Kap!', 1.5, 'plop', 'munch'], thundersabre: ['RAWR!', 0.8, 'roar', 'roar'], polobruin: ['Hrm!', 0.8, null, 'pop'], barkorious: ['ORK!', 0.7, 'roar', 'clap'],
};
// ==================================================================================== no animals but Tokonmon
// The world has no animals except Tokonmon: the voxel animal props are hidden (their spots are kept, and stand()
// puts Tokonmon there), and every line an interactable or resident says passes through tokonize().
const ANIMAL_PROPS = new Set(['wf_gull', 'wf_sealion', 'pk_pigeons', 'pk_duck']);
const REWORD = [
  [/Eight sea lions on five rafts/g, 'Barkorious and his raft gang, sprawled over five rafts'],
  [/A big bull shoves two others/g, 'Barkorious shoves two Kappachi'], [/A pup slides off the raft/g, 'A little Kappachi slides off the raft'],
  [/like warm sausages, flippers twitching/g, 'like warm dumplings, flippers and claws twitching'],
  [/Sea lions guaranteed, whales if you're lucky/g, 'Barkorious guaranteed, a Blowhale if you\'re lucky'],
  [/sea lions arguing over their rafts/g, 'raft Tokonmon arguing over their rafts'], [/\bsea lions\b/g, 'raft Tokonmon'], [/\bSea lions\b/g, 'Raft Tokonmon'], [/\ba sea lion\b/g, 'a Barkorious'],
  [/\bseagulls?\b|\bgulls?\b/g, 'Pidgun'], [/a seal pops up/g, 'a Weirdfin pops up'], [/\bpigeons\b/g, 'Pidgun'], [/\bA pigeon\b/g, 'A Pidgun'], [/\ba pigeon\b/g, 'a Pidgun'],
  [/It's got a crab living in it/g, 'It\'s got a Foopod living in it'], [/a silver perch/g, 'a startled Weirdfin'], [/a grinning crab painted/g, 'a grinning Kanizumo painted'],
  [/Look at the size of this one — it waved at me!/g, 'Clawdia hauled the whole catch up here herself!'],
  [/Three ducks race over, followed — very slowly — by a turtle with a Tokonmon sitting on its shell/g, 'A Weirdfin and a Woodbub race over, followed — very slowly — by a Kappachi with a Lemmo sitting on its head'],
  [/A little red bird is having the bath of its life/g, 'A little Pidrose is having the bath of its life'], [/A small dog barks/g, 'A small Tokonmon yaps'], [/shaped like a fish/g, 'shaped like a Weirdfin'],
  [/One is the hamster\./g, 'One is Commander Biscuit, his Lemmo.'], [/about the hamster\. We have a hamster\./g, 'about the Lemmo. We have a Lemmo.'], [/That cat on the counter/g, 'That Kissmet on the counter'],
];
export const tokonize = (t) => (typeof t === 'string' ? REWORD.reduce((s, [re, to]) => s.replace(re, to), t) : t);
const RELABEL = { 'Feed the ducks': 'Feed the pond Tokonmon', 'Watch the sea lions': 'Watch the Tokon rafts' };
/** hide the voxel animals (remembering where they stood) and make every interactable speak tokonize()d lines */
function purge(city, app) {
  const spots = {};
  city.root.traverse((o) => {
    if (!o.isInstancedMesh || !ANIMAL_PROPS.has(o.userData.prop)) return;
    const k = o.userData.prop, L = spots[k] || (spots[k] = []), M = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3();
    if (o.visible) for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); M.decompose(P, Q, Sc); if (!L.some((q) => Math.hypot(q[0] - P.x, q[2] - P.z) < 0.05)) L.push([P.x, P.y, P.z, new THREE.Euler().setFromQuaternion(Q).y]); }
    o.visible = false;
  });
  for (const it of city.inter) {
    if (RELABEL[it.label]) it.label = RELABEL[it.label];
    if (it.lifeSay) continue;
    const act = it.act; it.lifeSay = true;
    it.act = async (a, x) => { const say = a.say; a.say = (n, ...l) => say.call(a, n, ...l.map(tokonize)); try { return await act(a, x); } finally { a.say = say; } };
  }
  void app; return spots;
}
/** Tokonmon for the spots the voxel animals left: Tokon pigeons for the flocks and gulls, a raft gang, pond swimmers */
function stand(L) {
  const S_ = L.animals, out = [], near = (x, z, r) => L.res.some((R) => (R.e.sp === 'pidgun' || R.e.sp === 'pidrose') && Math.hypot(R.x - x, R.z - z) < r);
  (S_.pk_pigeons || []).slice(0, 10).forEach(([x, , z], i) => {
    if (near(x, z, 3)) return;
    const d = x < 104 && z > 32 && z < 98 ? 'park' : z < 32 ? 'wharf' : x > 116 && z < 98 ? 'chinatown' : 'downtown';
    for (let k = 0; k < (i < 2 ? 2 : 1); k++) out.push({ sp: k ? 'pidrose' : 'pidgun', at: [x + (k - 0.5) * 0.8, z, rnd(0, 6)], do: 'wander', area: [x - 1.4, z - 1.2, x + 1.4, z + 1.2], fid: k ? ['peck', 'preen'] : ['peck', 'puff'], speed: 0.6, t: 'day', d });
  });
  (S_.wf_gull || []).filter(([, , z]) => z > 0).filter((_, i) => i % 3 === 0).slice(0, 6).forEach(([x, y, z, yaw], i) => out.push({ sp: i % 2 ? 'pidrose' : 'pidgun', at: [x, z, yaw], y, do: 'perch', fid: ['peck', i % 2 ? 'preen' : 'puff'], d: 'wharf' }));
  const raft = [['kappachi', 'nap'], ['kanizumo', 'pose', ['shimmy', 'salt']], ['kappachi', 'pose', ['munch', 'wax']], ['woodbub', 'pose', ['roll']]];
  (S_.wf_sealion || []).filter(([, y, z]) => z > 0 && y < 0).slice(0, raft.length).forEach(([x, y, z, yaw], i) => out.push({ sp: raft[i][0], at: [x, z, yaw], y, do: raft[i][1], fid: raft[i][2], pet: false, name: nameOf(raft[i][0]), d: 'wharf' }));
  const pond = [['woodbub', 'roll'], ['kappachi', 'munch']];
  (S_.pk_duck || []).slice(0, pond.length).forEach(([x, , z], i) => out.push({ sp: pond[i][0], at: [x, z, 0], y: -0.62, do: 'swim', c: [x, z], r: [1.1, 0.8], spin: 0.3 + i * 0.1, fid: [pond[i][1]], pet: false, d: 'park' }));
  return out;
}
const nameOf = (sp) => (SPECIES[sp] && SPECIES[sp].name) || (sp === 'pidrose' ? 'Pidgun' : sp[0].toUpperCase() + sp.slice(1));

/*
 * entry fields: sp, at [x, z, yaw], L (storey), y (absolute height; 'roof' / 'wire' are found by raycast),
 * do (behaviour: pose | nap | heel | wander | route | swim | float | perch | tag | spar | rummage), clip, speed,
 * fid [clips], every [s, s], fx [kind, every], owner (npc id), name (pet name), t ('day' | 'night'), dusk (clip),
 * prop, pts [[x, z, wait, clip]], area [x0, z0, x1, z1], game, c [x, z], r, temper (shy | proud | wild | sleepy),
 * wild (battle it), pet (false: out of reach), line (what petting it says), say [bubbles its owner says], talk
 * [a dialogue its owner adds], skip (story actor id that replaces it), out (show even from outside its building)
 */
const LIFE = {
  // ------------------------------------------------------------------------ Sunset Row
  home: [
    { sp: 'mopzart', at: [60.42, 148.55, -PI / 2], y: 0.43, do: 'nap', name: 'Mopzart', skip: 'mop', line: 'Old Mopzart thumps his tail on the sofa cushion without opening his eyes. His curls smell of powder and toast.' },
    { sp: 'wheezowl', at: [59.6, 142.55, PI], do: 'pose', clip: 'cook', fid: ['swivel', 'wheeze'], fx: ['steam', 3], owner: 'mom', name: 'Wheezowl', skip: 'owl',
      line: 'Wheezowl stirs the pot with one wing and shoos you off the wontons with the other. Hoo-WHEEZE.', say: ['Wheezowl, don\'t let it boil over!', 'She\'s a better cook than me, honestly.'] },
    { sp: 'kissmet', at: [36.3, 155.66, 0.15], y: 0.72, do: 'pose', fid: ['tailtiff', 'firetrick'], every: [7, 12], owner: 'ochoa', name: 'Bruja', temper: 'proud',
      line: 'Bruja balances on the picket fence like it\'s a catwalk, lets you scratch her chin exactly twice, then looks away.', say: ['Bruja! Off the fence, mija!'], talk: ['That little lion on my fence is Bruja. She guards the roses from the pigeons. And from me.'] },
    { sp: 'zapkit', at: [36.55, 150.72, PI / 2], y: 0.12, do: 'nap', owner: 'ochoa', name: 'Duchess', temper: 'proud',
      line: 'Duchess the Zapkit opens one eye, judges you thoroughly, and allows exactly three strokes. On the fourth, a tiny spark. A warning.' },
    { sp: 'kissmet', at: [102.95, 149.9, 0.3], y: 1.0, do: 'nap', owner: 'mrpark', name: 'Ginger',
      line: 'Ginger the Kissmet sleeps on the counter by the register, one paw on the "ring for service" bell. Nobody rings it. Nobody dares.' },
    { sp: 'lemmo', at: [56.25, 118.1, -PI / 2], do: 'nap', owner: 'milo', name: 'Commander Biscuit',
      line: 'Commander Biscuit, Milo\'s Lemmo, naps beside an exercise wheel he has never once used. Milo: "He\'s officially Tokon number nine. The League hasn\'t replied to my letter yet."' },
    { sp: 'snoozaque', at: [23.6, 152.6, 0.1], do: 'nap', name: 'Snoozaque', temper: 'sleepy', line: 'It is sprawled across the porch step in the sun, one arm over its eyes. It snores a little louder when you pet it.' },
    { sp: 'zapkit', at: [76.4, 123.32, 0], y: 3.86, do: 'pose', fid: ['ho', 'pounce'], every: [8, 14], dusk: 'sleep', pet: false, name: 'Zapkit', temper: 'proud' },
    { sp: 'grenaday', at: [64.7, 174.6, PI / 2], do: 'spar', game: 'pocket', owner: 'kidA', name: 'Kaboom' },
    { sp: 'beatlet', at: [66.9, 174.6, -PI / 2], do: 'spar', game: 'pocket', owner: 'kidB', name: 'Ringo Jr.' },
    { sp: 'woodbub', at: [86.5, 174.4, 0], do: 'route', pts: [[83.6, 172.5, 2.5, 'grab'], [87.0, 172.5, 2], [90.4, 172.5, 3, 'grab']], speed: 0.6, fx: ['bubble', 0.8], owner: 'gardener', name: 'Sprinkles', t: 'day',
      line: 'Sprinkles bobs over the tomato bed, blowing bubbles onto the leaves. That\'s… actually watering them.', say: ['Not the zucchini again, Sprinkles!', 'Best watering can I ever had.'] },
    { sp: 'cabbunny', at: [97.6, 170.2, 0.3], y: 0.12, do: 'pose', clip: 'idle', fid: ['peek', 'thump', 'yawn'], every: [4, 8], temper: 'shy', name: 'Cabbunny',
      line: 'Is that a cabbage? It\'s a bunny. It\'s a cabbage bunny, hiding in the pumpkin patch. It lets you pat its leaves.' },
    { sp: 'zapkit', at: [152.0, 141.6, PI], do: 'route', prop: 'parcel', pts: [[152.0, 141.6, 3, 'ho'], [97.2, 154.6, 3, 'win'], [66.0, 156.4, 3, 'ho']], speed: 1.9, t: 'day', name: 'Zap Express', temper: 'proud',
      line: 'The courier Zapkit holds still for exactly one pat, then checks the parcel label and zips off. Next-day delivery waits for no one.' },
    { sp: 'polobruin', at: [105.4, 99.0, PI], do: 'route', prop: 'sign', pts: [[105.4, 98.9, 6, 'scan'], [105.4, 104.0, 3, 'pop'], [105.4, 109.0, 6, 'scan'], [105.4, 104.0, 3, 'pop']], speed: 0.9, t: 'day', name: 'Crossing Guard', temper: 'proud',
      line: 'The crossing guard Polobruin pops its collar, raises the STOP sign and walks you across even though you weren\'t crossing.' },
    { sp: 'pidgun', at: [31.0, 136.4, 0], y: 'wire', do: 'perch', fid: ['peck', 'puff'] },
    { sp: 'pidrose', at: [86.0, 166.4, PI], y: 'wire', do: 'perch', fid: ['preen', 'sniff'] },
    { sp: 'wheezowl', at: [48.0, 136.4, 0], y: 'wire', do: 'perch', fid: ['swivel'], t: 'night' },
  ],
  // ------------------------------------------------------------------------ Alamo Hill Park
  park: [
    { sp: 'cabbunny', at: [7.6, 48.2, -0.4], do: 'pose', fid: ['peek', 'thump'], owner: 'pk_gardener', name: 'Sprout', temper: 'shy',
      line: 'Sprout pretends it wasn\'t nibbling the roses. There is a petal stuck to its ear.', say: ['Sprout! Those are heritage roses!'], talk: ['That cabbage with ears is Sprout. Bio-type. Eats my roses, then looks at me like I planted them for it.'] },
    { sp: 'zapkit', at: [27.8, 43.0, 0.6], do: 'pose', fid: ['pounce', 'ho'], every: [3, 6], owner: 'pk_kidslide', name: 'Sparky', line: 'Sparky crackles happily and rolls over. Your fingers tingle.', say: ['Sparky, wait for me at the bottom!'] },
    { sp: 'gradcub', at: [91.0, 42.0, 0], do: 'tag', game: 'court', c: [92.0, 42.6], r: 2.6, owner: 'pk_baller', name: 'Gradcub' },
    { sp: 'grenaday', at: [93.0, 42.0, 0], do: 'tag', game: 'court', c: [92.0, 42.6], r: 2.6, name: 'Grenaday' },
    { sp: 'pidrose', at: [88.6, 89.6, 0], do: 'wander', area: [87.6, 88.6, 90.4, 93.6], fid: ['peck', 'preen'], owner: 'pk_pigeonman', name: 'Duchess', t: 'day',
      line: 'Duchess allows one gentle pat. She has been coming here for eleven years, and she is not impressed.' },
    { sp: 'kissmet', at: [95.0, 87.0, 0], do: 'tag', game: 'fountain', c: [95.0, 91.2], r: 4.15, chaser: true, name: 'Kissmet', t: 'day' },
    { sp: 'pidgun', at: [95.0, 95.4, 0], do: 'tag', game: 'fountain', c: [95.0, 91.2], r: 4.15, fly: true, t: 'day' },
    { sp: 'snoozaque', at: [40.2, 93.7, 0.4], do: 'nap', owner: 'pk_mom', name: 'Mochi', temper: 'sleepy', line: 'Mochi is asleep in a sunbeam on the picnic blanket, belly up. It smells faintly of jam.', say: ['Shh, Mochi\'s napping in the sun.'], talk: ['Our Snoozaque, Mochi, has slept through three picnics in a row. Never misses the sandwiches, though.'] },
    { sp: 'talonaka', at: [49.6, 65.6, 2.2], do: 'pose', fid: ['solo', 'breeze'], every: [5, 9], owner: 'pk_tourist', name: 'Taka', line: 'Taka strikes a pose for the camera, then plays a little guitar lick just for you.', say: ['Taka, look here! Say "Tokon"!'] },
    { sp: 'lemmo', at: [69.0, 42.0, 0], do: 'wander', area: [64.5, 38.5, 73.5, 45.5], wild: true, temper: 'wild', fid: ['pucker', 'buzz'], speed: 0.7 },
    { sp: 'cabbunny', at: [23.5, 55.8, 0], do: 'wander', area: [20.5, 52.5, 26.5, 59.5], wild: true, temper: 'wild', fid: ['peek', 'thump'], speed: 0.8 },
    { sp: 'snoozaque', at: [28.3, 74.0, 0], do: 'nap', wild: true, temper: 'wild', name: 'Snoozaque' },
    { sp: 'weirdfin', at: [64.5, 86.0, 0], y: -0.6, do: 'swim', c: [64.6, 86.0], r: [2.8, 2.6], spin: 0.35, clip: 'idle', fid: ['loop'], pet: false },
    { sp: 'kappachi', at: [59.9, 84.6, 1.2], do: 'pose', fid: ['munch', 'wax'], every: [6, 10], name: 'Kappachi', temper: 'shy', line: 'The pond Kappachi lets you pat its shell, very carefully, so the water in its head-dish doesn\'t spill.' },
    { sp: 'snoozaque', at: [82.0, 57.0, PI / 4], y: 'roof', do: 'nap', pet: false },
    { sp: 'zapkit', at: [80, 84, 0], do: 'heel', owner: 'pk_joggerA', off: [0.7, 0.4], name: 'Bolt', run: true, line: 'Bolt bounces on the spot, impatient to keep running.' },
  ],
  // ------------------------------------------------------------------------ Chinatown
  chinatown: [
    { sp: 'lemmo', at: [190.8, 39.4, -0.4], do: 'pose', fid: ['pucker', 'zap'], owner: 'lau', name: 'Little Lemon', line: 'Little Lemon puffs up proudly. It has been training with Master Lau. It is still a lemon.',
      say: ['Little Lemon, horse stance! Lower!'], talk: ['My partner is small, but its spirit is sour. That is a compliment, young one.'] },
    { sp: 'foopod', at: [198.6, 40.2, PI / 2], do: 'pose', clip: 'shadowbox', fid: ['airdrum'], every: [9, 14], owner: 'ctStudent', name: 'Jab', line: 'Jab throws a one-two at the air, then bumps its club against your fist.', say: ['Jab! Faster than me again!'] },
    { sp: 'kappachi', at: [195.4, 69.9, PI / 2], do: 'pose', fid: ['munch'], owner: 'uncleHo', name: 'Pebble', line: 'Pebble is watching the xiangqi board very seriously. It points at a piece with its bill. Bad move.',
      say: ['Pebble, no hints for Mr. Tam!'], talk: ['Pebble watches every game. It thinks it could beat me. …It probably could.'] },
    { sp: 'snoozaque', at: [173.9, 80.0, PI / 2], do: 'pose', clip: 'dance', speed: 0.4, owner: 'ctTaichi1', name: 'Cloud', line: 'Cloud moves through its tai chi with its eyes closed. It might be asleep. It might be enlightened.', say: ['Slowly, Cloud. Like pushing clouds.'] },
    { sp: 'grenaday', at: [177.8, 89.2, -0.6], do: 'pose', clip: 'dance', fid: ['pin', 'tick'], owner: 'ctPlayKid', name: 'Kaboom', line: 'Kaboom headbangs, then pulls its own pin out of excitement. You both hold your breath. …It puts it back.', say: ['Kaboom! Headfirst down the dragon!'] },
    { sp: 'kappachi', at: [136.6, 66.4, 0], do: 'route', prop: 'tray', pts: [[136.6, 66.3, 2.5, 'idle'], [133.6, 69.8, 2.5, 'munch'], [139.6, 70.6, 2.5, 'idle']], speed: 0.8, owner: 'ctTeaHost', name: 'Sencha', t: 'day',
      line: 'Sencha balances a tray of oolong on its head-dish without spilling a drop. It bows. A little tea spills.', say: ['Sencha, table three is waiting!'] },
    { sp: 'mopzart', at: [144.5, 86.4, -PI / 2], do: 'pose', clip: 'beg', fid: ['beg'], every: [6, 9], owner: 'ctDumpling', name: 'Mopzart', t: 'day', line: 'Old Mopzart sits up with his paws together and gives you the saddest, wettest eyes in Chinatown.',
      say: ['No more siu mai for you, old man!', 'Fine. ONE dumpling.'] },
    { sp: 'beatlet', at: [144.1, 75.0, 0], do: 'route', prop: 'broom', pts: [[144.1, 74.8, 1.5], [144.1, 80.8, 1.5, 'mopshake']], speed: 0.45, dust: true, owner: 'ctBaker', name: 'Bun', t: 'day',
      line: 'Bun stops sweeping to shake its mop-top at you. Crumbs fly everywhere. It starts sweeping again.', say: ['Bun, you missed a spot!'] },
    { sp: 'trashcoon', at: [173.4, 61.6, 0], do: 'wander', area: [169.8, 60.8, 176.6, 62.8], fid: ['spin', 'capspin'], owner: 'ctGrocer', name: 'Mister Lid', t: 'day', temper: 'shy',
      line: 'A Trashcoon in a cardboard cap that reads "MISTER LID" in marker. It is holding an orange behind its back. Someone on Sunset Row put up a LOST notice for it…',
      say: ['Hey! That Trashcoon has my oranges again!'] },
    { sp: 'trashcoon', at: [129.5, 52.0, 0], do: 'rummage', pts: [[129.5, 50.0, 4], [129.6, 62.0, 4], [129.4, 74.0, 4]], t: 'night', name: 'Mister Lid', temper: 'shy',
      line: 'Mister Lid freezes mid-rummage, a fortune cookie in each paw. Then it offers you one.' },
    { sp: 'chochobake', at: [146.0, 50.0, 0], do: 'float', c: [146.0, 52.0], r: 2.2, h: 1.6, t: 'night', name: 'Chochobake', temper: 'shy', line: 'The lantern ghost glows a little brighter when you pat its paper. It feels warm, like a hand-warmer.' },
    { sp: 'chochobake', at: [186.0, 88.0, 0], do: 'float', c: [184.0, 87.0], r: 2.6, h: 1.8, t: 'night', name: 'Chochobake', temper: 'shy', line: 'The lantern ghost circles the pavilion with the other lanterns. It giggles when you pat it.' },
    { sp: 'pidrose', at: [186.0, 92.4, 0], do: 'wander', area: [182.0, 91.0, 191.0, 94.5], fid: ['peck', 'preen'], t: 'day' },
  ],
  // ------------------------------------------------------------------------ the Wharf
  wharf: [
    { sp: 'kanizumo', at: [10.0, 16.3, PI / 2], do: 'route', prop: 'crate', pts: [[8.0, 16.2, 2.5, 'salt'], [24.0, 16.2, 2.5, 'shimmy']], speed: 0.8, owner: 'wfFishmonger', name: 'Clawdia', t: 'day',
      line: 'Clawdia clacks a claw at you in greeting. The crate of fish on her head doesn\'t even wobble.', say: ['Careful with those crabs, Clawdia — they\'re your cousins!'] },
    { sp: 'thundersabre', at: [68.2, 17.6, -PI / 2], do: 'pose', fid: ['yawn', 'roar'], every: [9, 15], owner: 'wfGripman', name: 'Brakes', temper: 'proud',
      line: 'Brakes rumbles like a cable car on a hill. It leans into your hand. The fur crackles.', say: ['Brakes helps me turn her around. Strongest partner on the line!'] },
    { sp: 'takaptain', at: [96.6, 7.6, -PI / 2], do: 'pose', fid: ['salute', 'helm'], every: [7, 12], owner: 'wfFerryman', name: 'Skipper', line: 'Skipper snaps you a crisp salute. Permission to come aboard: granted.', say: ['Skipper, ring the bell!'] },
    { sp: 'blowhale', at: [101.4, 13.5, 0.6], do: 'pose', clip: 'skirl', fx: ['note', 1.4], owner: 'wfBusker', name: 'Piper', line: 'Piper wheezes a happy chord on its bagpipe blowhole. The busker bows like it was planned.', say: ['♪ Piper on the pipes, everybody! ♪'] },
    { sp: 'barkorious', at: [141.6, 8.1, 2.4], y: -0.62, do: 'nap', pet: false, name: 'Barkorious' },
    { sp: 'weirdfin', at: [176, 10.2, 0], y: -0.95, do: 'swim', c: [176.2, 10.3], r: [2.2, 0.8], spin: 0.5, fid: ['loop', 'bait'], pet: false },
    { sp: 'hawkabunga', at: [186, 6, 0], y: -0.78, do: 'swim', c: [186.0, 6.2], r: [6.0, 2.6], spin: 0.32, clip: 'shred', fid: ['kickflip'], pet: false, t: 'day' },
    { sp: 'pidgun', at: [169.4, 12.0, -PI / 2], do: 'pose', fid: ['peck', 'puff'], every: [3, 6], owner: 'wfIce', name: 'Pidgun', temper: 'wild', t: 'day', line: 'The Pidgun pretends to like you. Its eyes never leave your hands. It is waiting for a cone.' },
  ],
  // ------------------------------------------------------------------------ Downtown
  downtown: [
    { sp: 'lemmo', at: [152.4, 111.6, -PI / 2], do: 'pose', clip: 'idle', fid: ['zap', 'buzz'], every: [4, 7], owner: 'dt_commuter', name: 'Juice', out: true,
      line: 'Juice zaps the commuter\'s phone back to 100% and gives you a sour little salute.', say: ['Juice, I\'m at 3%. Please.'], talk: ['My Lemmo, Juice, charges my phone. The tram is late, my battery isn\'t.'] },
    { sp: 'zapanda', at: [164.5, 132.4, 0], do: 'route', prop: 'boba', pts: [[164.5, 132.3, 2.5, 'tailcheck'], [162.0, 135.8, 2.5], [166.2, 136.6, 2.5]], speed: 0.9, owner: 'dt_barista', name: 'Boba', t: 'day',
      line: 'Boba the Zapanda serves you an imaginary mango boba with a wink of its prism. Its tail flicks the tip jar.', say: ['Boba, mango for table two!'] },
    { sp: 'beatlet', at: [159.6, 141.8, 0], do: 'pose', fid: ['strum', 'mopshake', 'spin45'], owner: 'dt_taro', name: 'Beatlet', line: 'Taro\'s Beatlet strums a tiny chord on its shell and shakes its mop-top. Yeah yeah yeah.', say: ['Beatlet, don\'t eat the capsules!'] },
    { sp: 'creepetal', at: [170.0, 118.6, PI], do: 'pose', fid: ['hide', 'peek'], every: [5, 9], owner: 'dt_florist', name: 'Wallflower', temper: 'shy', line: 'Wallflower hides behind the tulip buckets. When you pat its petals it stops crying — for a second.', say: ['Wallflower, you ARE the prettiest one here.'] },
    { sp: 'bearbreak', at: [209.4, 127.6, -0.3], do: 'pose', fid: ['sigh', 'look'], every: [6, 10], owner: 'dt_suit', name: 'Monday', temper: 'shy', line: 'Monday the Bearbreak straightens its tie, looks at you with tired eyes, and sighs. Same, buddy. Same.', say: ['Monday, we have a call in five.'] },
    { sp: 'dreadrake', at: [136.8, 152.9, 0], do: 'pose', fid: ['flex', 'menace'], every: [6, 11], owner: 'dt_spike', name: 'Dreadrake', temper: 'proud', line: 'Spike\'s Dreadrake flexes at you. You pat its leather jacket anyway. It… quacks. Quietly.', say: ['Tch. Don\'t pet my Dreadrake.'] },
    { sp: 'studrat', at: [168.0, 165.2, -PI / 2], do: 'pose', fid: ['nibble', 'swagger'], every: [5, 9], owner: 'dt_riff', name: 'Rivet', line: 'Rivet sharpens its chrome mohawk on your shoe, then lets you scratch behind its torn ear.', say: ['Rivet! Spray cans are not snacks!'] },
    { sp: 'kissmet', at: [141.9, 165.0, PI / 2], do: 'spar', game: 'arena', name: 'Kissmet', t: 'day' },
    { sp: 'zapkit', at: [144.1, 165.0, -PI / 2], do: 'spar', game: 'arena', name: 'Zapkit', t: 'day' },
  ],
};
// partners for passers-by walking the avenues (assigned to the first walkers spawned)
const WALKERS = ['gradcub', 'kissmet', 'cabbunny', 'beatlet'];
// people life.js adds: two kids pretend-battling in the pocket park
const KIDS = [
  { id: 'kidA', who: { id: 'kidA', preset: 'kid', seed: 23, sex: 'm', age: 'kid' }, at: [63.3, 174.9, PI / 2], name: 'Kid', lines: [['Kaboom, use… uh… BIG EXPLOSION! …Okay, pretend it was big.'], ['We\'re practising for the League! I\'m gonna be champion. After school.']] },
  { id: 'kidB', who: { id: 'kidB', preset: 'kid', seed: 31, sex: 'f', age: 'kid' }, at: [68.3, 174.9, -PI / 2], name: 'Kid', lines: [['Ringo Jr. dodged that! It totally dodged. Right? RIGHT?'], ['My Beatlet is learning to strum. It only knows one chord. It\'s a good chord.']] },
];

// ==================================================================================== the manager
export class CityLife {
  constructor(world, city) {
    this.w = world; this.app = world.app; this.c = city; this.nav = city.nav;
    this.res = []; this.games = {}; this.started = false; this.debug = !!(this.app.params && this.app.params.get('lifedebug')); this.hushed = false; this.t = 0; this.phase = null; this.moodT = 0; this.queue = [];
    this.animals = purge(city, this.app);                       // no animals in this world but Tokonmon (see purge)
  }
  /** spawn everything for this time of day (nearest first, a few per frame); safe to call twice */
  start() {
    if (this.started || this.disposed) return; this.started = true;
    if (this.app.params && this.app.params.get('nolife')) return;      // ?nolife=1: an empty city (A/B cost checks)
    this.phase = phaseOf(this.w.mood);
    const w = this.w;
    // the kids in the pocket park
    for (const k of KIDS) if (!w.actor(k.id)) { const a = w.addPerson(k.id, k.who, k.at); a.npc = { id: k.id, name: k.name }; this.kid(k); }
    for (const [d, list] of Object.entries(LIFE)) list.forEach((e, i) => this.res.push(this.make(e, `lf-${d}${i}`, d)));
    // companions for passers-by on the avenues
    const walkers = [...w.actors.values()].filter((a) => a.life && a.life.walker).slice(0, WALKERS.length * 2).filter((_, i) => i % 2 === 0);
    walkers.forEach((a, i) => this.res.push(this.make({ sp: WALKERS[i], at: [a.g.position.x, a.g.position.z, 0], do: 'heel', owner: a.id, off: [0.5, -0.8] }, `lf-walk${i}`, 'avenue')));
    // Tokonmon where the old voxel animals stood (pigeon flocks, gulls, sea lions, ducks)
    stand(this).forEach((e, i) => this.res.push(this.make(e, `lf-swap${i}`, e.d)));
    // partner lines for their people
    for (const R of this.res) if (R.e.owner && (R.e.talk || R.e.say)) this.ownerLines(R);
    this.spawnLoop();
  }
  make(e, id, d) {
    const [x, z, yaw] = e.at;
    return { e, id, d, x, z, yaw: yaw || 0, L: e.L || 0, a: null, shown: false, state: 'new', t: rnd(0, 3), ft: rnd(2, 6), react: 0, petN: 0, bid: -1 };
  }
  wanted(R) { const t = R.e.t; return !t || t === (this.phase === 'night' ? 'night' : 'day'); }
  async spawnLoop() {
    if (this.spawning) return; this.spawning = true;
    try {
      for (;;) {
        if (this.disposed) return;
        const me = this.focus(), todo = this.res.filter((R) => R.state === 'new' && this.wanted(R) && !(R.e.skip && this.w.actor(R.e.skip)));
        if (!todo.length) break;
        todo.sort((A, B) => Math.hypot(A.x - me.x, A.z - me.z) - Math.hypot(B.x - me.x, B.z - me.z));
        await this.spawn(todo[0]);
        await new Promise((r) => setTimeout(r, 0));
      }
    } finally { this.spawning = false; }
  }
  focus() { const p = this.w.player; return p ? p.g.position : this.w.cam.target; }
  async spawn(R) {
    const w = this.w, e = R.e, nav = this.nav; R.state = 'loading';
    // ground creatures: nudge onto the nearest walkable cell
    let { x, z } = R, y = null;
    if (e.y === 'roof' || e.y === 'wire') { y = this.raycastY(x, z, e.y); if (y === null) { R.state = 'off'; return; } }
    else if (typeof e.y === 'number') y = e.y;
    else if (!['swim', 'float', 'heel'].includes(e.do) && !nav.ok(x, z, R.L)) {
      let best = null; for (let r = 0.25; r <= 2 && !best; r += 0.25) for (let k = 0; k < 16; k++) { const a = (k / 16) * PI * 2, qx = x + Math.cos(a) * r, qz = z + Math.sin(a) * r; if (nav.ok(qx, qz, R.L)) { best = [qx, qz]; break; } }
      if (best) { if (this.debug) console.warn('[life] nudged', R.id, e.sp, x, z, '→', best[0].toFixed(2), best[1].toFixed(2)); [x, z] = best; R.x = x; R.z = z; }
    }
    let a;
    try { a = await w.addMon(R.id, e.sp, [x, z, R.yaw, R.L * 3]); } catch (err) { console.warn('[life] spawn', e.sp, err); R.state = 'off'; return; }
    if (this.disposed || w.actors.get(R.id) !== a) { if (w.actors.get(R.id) === a) w.remove(R.id); return; }
    R.a = a; a.res = R; a.speed = e.speed || 1;
    if (y !== null) a.g.position.y = y;
    R.y0 = a.g.position.y;
    const b = nav.buildingAt(x, z, R.L); R.bid = !e.out && b >= 0 && this.c.buildings[b] && this.c.buildings[b].enter ? b : -1;
    if (e.prop) this.attachProp(R);
    R.baked = bakeModel(a.m, a.anim.spec);
    this.base(R);
    for (let i = 0; i < 4; i++) a.anim.update(0.1, {});          // settle into its pose + expression before it can be seen frozen
    // the [E] prompt (follows the creature)
    if (e.pet !== false) {
      R.it = { x, z, L: R.L, y: R.y0 + 1.2, r: 1.5, icon: e.wild ? 'leaf' : 'heart', label: this.label(R), when: () => R.live && !R.busy && !R.away, act: (app) => this.interact(R, app) };
      this.c.inter.push(R.it);
    }
    a.g.removeFromParent(); a.update = NOOP; R.shown = R.live = false; R.state = 'ok';
    if (e.do === 'route') this.routePaths(R);
  }
  label(R) { const e = R.e, n = e.name || nameOf(e.sp); return e.wild ? `Wild ${nameOf(e.sp)}` : e.do === 'nap' ? `Pet the sleeping ${n}` : `Pet ${n}`; }
  // the height of a roof / wire at (x, z), found by casting a ray down onto the city's meshes
  raycastY(x, z, kind) {
    const root = this.c.root, ray = new THREE.Raycaster(new THREE.Vector3(x, kind === 'wire' ? 8.4 : 40, z), new THREE.Vector3(0, -1, 0), 0, 50);
    let targets;
    if (kind === 'roof') { const b = this.c.buildings.find((B) => x > B.x && x < B.x + B.w && z > B.z && z < B.z + B.d); targets = b ? [b.roofG, ...(b.groups || []).flatMap((G) => [G.front, G.back])].filter(Boolean) : root.children; }
    else targets = root.children.filter((c) => c.name === 'props' && c.children.some((m) => m.isMesh && !m.isInstancedMesh));
    root.updateMatrixWorld(true);
    const hits = ray.intersectObjects(targets, true).filter((h) => !h.object.isInstancedMesh && (kind !== 'wire' || (h.point.y > 6 && h.point.y < 8.2)));
    return hits.length ? hits[0].point.y - (kind === 'wire' ? 0.03 : 0) : null;
  }
  attachProp(R) {
    const e = R.e, m = R.a.m, s = m.scale, mesh = propMesh(e.prop);
    if (e.prop === 'broom' || e.prop === 'sign') {
      const body = m.bones.body || m.group, hold = e.prop === 'sign' ? [0.32, 0.25, 0.18] : [0.2, 0.18, 0.2];
      m.group.updateMatrixWorld(true);
      const p = new THREE.Vector3(hold[0], hold[1], hold[2]); m.group.localToWorld(p.divideScalar(s)); body.worldToLocal(p);
      mesh.position.copy(p); mesh.scale.setScalar(1 / s); mesh.rotation.z = e.prop === 'broom' ? 0.35 : 0; body.add(mesh);
    } else {
      const head = m.bones[(m.def.anim && m.def.anim.look && m.def.anim.look.bone) || 'head'] || m.bones.head || m.bones.body || m.group;
      m.group.updateMatrixWorld(true);
      const box = new THREE.Box3(); head.traverse((o) => { if (o.isMesh && o.visible && !o.userData.hull) box.expandByObject(o); });
      if (box.isEmpty()) box.setFromObject(m.group);
      const p = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y - 0.01, (box.min.z + box.max.z) / 2); head.worldToLocal(p);
      mesh.position.copy(p); mesh.scale.setScalar(1 / s); head.add(mesh);
    }
    R.prop = mesh;
  }
  routePaths(R) {
    const pts = R.e.pts; R.paths = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
      const p = this.nav.path({ x: ax, y: R.L * 3, z: az }, { x: bx, y: R.L * 3, z: bz });
      R.paths.push(p && p.length > 1 ? p.slice(1).map(([px, pz]) => [px, pz]) : [[bx, bz]]);
    }
    R.seg = 0;
  }
  // ---------------------------------------------------------------- per frame
  update(dt) {
    if (!this.started || this.disposed) return;
    const w = this.w, app = this.app;
    if (app.battle && app.battle.active) return;                 // the battle hides what stands in its ring; leave it be
    this.t += dt;
    if ((this.moodT -= dt) <= 0) { this.moodT = 2; const ph = phaseOf(w.mood); if (ph !== this.phase) { this.phase = ph; for (const R of this.res) if (R.a) this.base(R); this.spawnLoop(); } }
    const f = this.focus(), inside = w.city ? w.city.inside : -1, L = w.city ? w.city.L : 0, me = w.player;
    let n = 0, nl = 0;
    for (const R of this.res) {
      if (R.state !== 'ok') continue;
      const a = R.a, p = a.g.position, heel = R.e.do === 'heel';
      if (heel && !R.live) this.trail(R);
      const d = Math.hypot(p.x - f.x, p.z - f.z);
      if (R.away) { R.away -= dt; if (R.away <= 0) { R.away = 0; if (d < 10) R.away = 3; else p.set(R.x, R.y0, R.z); } }
      let vis = !this.hushed && this.wanted(R) && !R.away && d < (R.shown ? VIS2 : VIS);
      if (vis && R.bid >= 0) vis = inside === R.bid && L >= R.L;          // indoors: only while you're in there
      if (vis && R.e.owner && heel && !w.actor(R.e.owner)) vis = false;
      const live = vis && (heel || d < (R.live ? ANIM2 : ANIM));
      if (vis !== R.shown) this.show(R, vis);
      if (live !== R.live) this.animate(R, live);
      if (!R.shown) continue;
      n++;
      if (!live) continue;
      nl++;
      if (R.busy) continue;
      this.behave(R, dt, me, d);
      if (R.it) { R.it.x = p.x; R.it.z = p.z; R.it.y = p.y + 0.9; }
    }
    this.nLive = nl;
    this.nShown = n;
  }
  /** in the scene or not (beyond VIS, or indoors while you're outside) */
  show(R, on) {
    R.shown = on;
    if (on) { this.w.st.actors.add(R.a.g); if (R.e.do === 'heel') this.trail(R); }
    else R.a.g.removeFromParent();
  }
  /** animated or frozen (an own update() masks Actor.update, so world.update skips its animator) */
  animate(R, on) {
    const a = R.a; R.live = on;
    if (on) { delete a.update; this.base(R); }
    else { a.update = NOOP; a.path = null; a.arrive = null; a.look = null; R.moving = false; }
  }
  /** the clip a resident rests in, by behaviour and time of day */
  base(R) {
    const e = R.e, a = R.a, clips = a.anim.clips;
    let c = e.do === 'nap' ? 'sleep' : e.clip || 'idle';
    if (e.dusk && (this.phase === 'dusk' || this.phase === 'night')) c = e.dusk;
    if (!clips[c]) c = 'idle';
    R.baseClip = c; a.idleClip = c;
    if (!a.path) a.play(c, { fade: 0.25, speed: e.speed && !['route', 'wander', 'heel'].includes(e.do) ? e.speed : undefined });
  }
  // ---------------------------------------------------------------- behaviours
  behave(R, dt, me, d) {
    const e = R.e, a = R.a, p = a.g.position;
    (BEHAVE[e.do] || BEHAVE.pose)(this, R, dt);
    // look at the player when close (the camera otherwise)
    a.look = me && d < 6 ? me : null;
    // notice the player coming close
    R.react -= dt;
    if (me && d < 2.8 && R.react <= 0 && !R.game && Math.abs(me.g.position.y - p.y) < 1.5) { R.react = 14; this.notice(R); }
    // owner chatter about their partner, when you come near the owner
    if (R.ownerSay && me) {
      const o = this.w.actor(e.owner);
      if (o && (R.sayT = (R.sayT || 0) - dt) <= 0 && Math.hypot(o.g.position.x - me.g.position.x, o.g.position.z - me.g.position.z) < 4.5) { R.sayT = 50; this.bubble(o, pick(R.ownerSay), 'friend'); }
    }
    // a little hop (procedural, on top of the clip)
    if (R.hop > 0) { R.hop -= dt; const k = Math.max(0, R.hop) / 0.42; p.y = R.hopY + Math.sin((1 - k) * PI) * (R.hopH || 0.28); if (R.hop <= 0) p.y = R.hopY; }
    // periodic particles (z's, steam, notes, bubbles)
    if (e.fx && (R.fxT = (R.fxT ?? rnd(0, e.fx[1])) - dt) <= 0) { R.fxT = e.fx[1] * rnd(0.8, 1.3); this.w.fx.emit(e.fx[0], a.headPos(), { n: 1, scale: 1 }); }
    if (e.do === 'nap' && (R.zT = (R.zT ?? rnd(0, 2)) - dt) <= 0) { R.zT = rnd(2.2, 3.4); this.w.fx.emit('z', a.headPos(), { n: 1, scale: 1 }); }
  }
  hopNow(R, h = 0.28) { if (R.hop > 0 || R.a.path) return; R.hopY = R.a.g.position.y; R.hop = 0.42; R.hopH = h; }
  notice(R) {
    const e = R.e, a = R.a, w = this.w, me = w.player, temper = e.temper || (e.do === 'nap' ? 'sleepy' : 'friendly');
    if (e.do === 'nap') { w.fx.emit('z', a.headPos(), { n: 2 }); return; }
    if (e.do === 'perch') return;
    if (!a.path && !['route', 'swim', 'float', 'tag', 'spar'].includes(e.do)) a.face(me);
    if (temper === 'wild') { w.fx.emit('sweat', a.headPos(), { n: 2 }); this.cry(R, 0.7); if (e.do === 'wander') { const q = a.g.position, mp = me.g.position, dx = q.x - mp.x, dz = q.z - mp.z, dd = Math.hypot(dx, dz) || 1, [x0, z0, x1, z1] = e.area; a.walkTo([[clamp(q.x + (dx / dd) * 2.4, x0, x1), clamp(q.z + (dz / dd) * 2.4, z0, z1)]], { speed: 2.4 }); R.t = 3; } return; }
    if (temper === 'shy') { w.fx.emit('sweat', a.headPos(), { n: 1 }); return; }
    if (temper === 'sleepy') { w.fx.emit('z', a.headPos(), { n: 1 }); return; }
    w.fx.emit(temper === 'proud' ? 'note' : Math.random() < 0.6 ? 'heart' : 'note', a.headPos(), { n: 1 });
    this.cry(R, 0.8); this.hopNow(R);
  }
  /** its cry: a bubble with its sound, babbled in a voice its size, plus a sampled call for birds and cats */
  cry(R, vol = 1, text) {
    const V = VOICE[R.e.sp] || ['!', 1.5], au = this.app.audio;
    this.bubble(R.a, text || V[0], { pitch: V[1], timbre: 'triangle', speed: 1.5, level: 0.8 * vol });
    if (V[2] && au && au.sfx) au.sfx(V[2], { vol: 0.5 * vol, pitch: 0.9 + Math.random() * 0.2 });
  }
  bubble(a, text, voice) {
    const w = this.w, B = w.bubbles || (w.bubbles = []);
    for (let i = B.length - 1; i >= 0; i--) if (B[i].a === a) B.splice(i, 1);
    B.push({ a, text, t: 0, n: 0, dur: 1.6 + text.length * 0.06, voice });
  }
  // ---------------------------------------------------------------- following people
  heelTarget(R, o) {
    const off = R.e.off || [0.6, -0.7], op = o.g.position, oy = o.yaw;
    return [op.x + Math.cos(oy) * off[0] + Math.sin(oy) * off[1], op.z - Math.sin(oy) * off[0] + Math.cos(oy) * off[1], op.y];
  }
  trail(R) { const o = this.w.actor(R.e.owner); if (!o || !R.a) return; const [tx, tz, ty] = this.heelTarget(R, o); R.a.g.position.set(tx, ty, tz); R.a.yaw = R.a.targetYaw = o.yaw; R.lastO = null; }
  // ---------------------------------------------------------------- owners: a partner line in their dialogue, a bubble when you come close
  ownerLines(R) {
    const e = R.e, n = (this.c.npcs || []).find((x) => x.id === e.owner);
    if (e.say) R.ownerSay = e.say;
    if (!n) return;
    if (e.talk && Array.isArray(n.lines) && n.lines.length && !n.lines.lifeAdded) {
      if (!Array.isArray(n.lines[0])) n.lines = [n.lines.slice()];
      n.lines = n.lines.concat([e.talk]); n.lines.lifeAdded = true;
    }
    // the partner perks up when you talk to its person
    const it = this.c.inter.find((x) => x.npc === e.owner);
    if (it && !it.lifeWrapped) { const act = it.act; it.lifeWrapped = true; it.act = async (app, i2) => { if (R.live && !R.busy) { R.a.face(this.w.player); this.cry(R, 0.6); this.w.fx.emit('heart', R.a.headPos(), { n: 1 }); this.hopNow(R); } return act(app, i2); }; }
  }
  kid(k) {
    const it = { npc: k.id, x: k.at[0], z: k.at[1], L: 0, r: 1.8, icon: 'chat', label: 'Talk to ' + k.name, act: async (app) => {
      const a = this.w.actor(k.id), me = this.w.player; if (a && me) { a.face(me); me.face(a); a.play('talk', { restart: true }); }
      k.said = ((k.said ?? -1) + 1) % k.lines.length; await app.say(k.name, ...k.lines[k.said]); if (a) a.play('idle');
    } };
    this.c.inter.push(it); (this.kidIts || (this.kidIts = [])).push(it);
  }
  // ---------------------------------------------------------------- [E]: pet, play, share a snack (or battle a wild one)
  async interact(R, app) {
    const w = this.w, a = R.a, me = w.player, e = R.e, nm = e.name || nameOf(e.sp), st = app.state, au = app.audio;
    R.busy = true; a.path = null; a.arrive = null;
    try {
      a.face(me); if (me) me.face(a);
      a.play(R.baseClip === 'sleep' ? 'idle' : R.baseClip, { fade: 0.2 });
      if (e.wild) {
        this.cry(R); w.fx.emit('sweat', a.headPos(), { n: 2 });
        const k = await app.choose(`A wild ${nameOf(e.sp)} peeks out of the grass!`, st.party && st.party.length ? ['Battle it', 'Leave it be'] : ['Leave it be']);
        if (st.party && st.party.length && k === 0) {
          const res = await app.startBattle({ foe: { name: 'Wild ' + nameOf(e.sp), team: [[SPECIES[e.sp] ? e.sp : 'lemmo', 4 + Math.floor(Math.random() * 3)]] }, wild: true, title: 'WILD TOKONMON!', subtitle: nameOf(e.sp) });
          await app.fade(0, 400);
          if (res && res.winner === 0) S.setFlag(st, 'alamo_done');
          R.away = 60;                                       // it runs off into the grass for a while
        }
        return;
      }
      const snack = snackOf(st), sname = snack && ITEMS[snack].name.replace(/\s*×\d+$/, ''), opts = ['Pet', 'Play'];
      if (snack) opts.push(`Share a snack (${sname})`);
      opts.push('Leave it be');
      const who = e.owner && e.name ? `${nm} (${ownerName(this, e.owner)}'s partner)` : nm;
      const k = await app.choose(who + (e.do === 'nap' ? ' is fast asleep.' : ' looks up at you.'), opts);
      const pick_ = opts[k ?? opts.length - 1] || 'Leave it be';
      if (pick_ === 'Pet') {
        if (me) me.play('wave');
        if (a.anim.clips.idle && R.baseClip === 'sleep') { a.play('idle'); await app.wait(300); }
        this.happy(R, 'heart', 4); au.sfx && au.sfx('cloth', { vol: 0.4 });
        R.petN++;
        await app.say('', R.petN > 3 ? `${nm} leans into your hand like you've been friends forever.` : e.line || pick(PET_LINES).replace(/\$/g, nm));
      } else if (pick_ === 'Play') {
        if (me) me.play('cheer');
        this.happy(R, 'star', 5); this.partnerJoins();
        au.sfx && au.sfx('boing', { vol: 0.6 });
        await app.say('', pick(PLAY_LINES).replace(/\$/g, nm));
      } else if (pick_.startsWith('Share')) {
        S.addItem(st, snack, -1); app.save && app.save();
        this.happy(R, 'heart', 6); w.fx.emit('sparkle', a.headPos(), { n: 10 });
        au.sfx && au.sfx('reward', { vol: 0.5 });
        await app.say('', `${nm} gobbles up the ${sname} and does a happy little wiggle. Crumbs everywhere.`);
      }
      // its person notices
      const o = e.owner && w.actor(e.owner);
      if (o && pick_ !== 'Leave it be' && Math.random() < 0.7) this.bubble(o, pick(['Aww, it likes you!', `${nm} doesn't do that for just anyone.`, 'Ha! Careful, it\'ll follow you home.']), 'friend');
    } finally {
      R.busy = false; R.react = 10;
      setTimeout(() => { if (R.a && !R.busy && R.live) this.base(R); }, 1500);
    }
  }
  happy(R, fx, n) {
    const a = R.a, V = VOICE[R.e.sp], clips = a.anim.clips;
    const c = (V && clips[V[3]] && V[3]) || (clips.win ? 'win' : clips.dance ? 'dance' : 'idle');
    a.play(c, { restart: true, fade: 0.15 }); this.w.fx.emit(fx, a.headPos(), { n }); this.cry(R); this.hopNow(R);
  }
  partnerJoins() { const b = this.w.partner; if (!b) return; b.face(this.w.player); b.play(b.anim.clips.dance ? 'dance' : 'win', { restart: true }); this.w.fx.emit('note', b.headPos(), { n: 2 }); }
  // ---------------------------------------------------------------- cutscenes
  /** clear the streets (true) for a cutscene, bring everyone back (false) */
  hush(on = true) { this.hushed = !!on; }
  stats() {
    const by = {}; let shown = 0, live = 0, tot = 0;
    for (const R of this.res) { if (R.state !== 'ok') continue; tot++; if (R.shown) shown++; if (R.live) live++; by[R.d] = (by[R.d] || 0) + 1; }
    return { total: tot, shown, live, pending: this.res.filter((R) => (R.state === 'new' || R.state === 'loading') && this.wanted(R)).length, byDistrict: by, phase: this.phase };
  }
  dispose() {
    this.disposed = true;
    for (const R of this.res) {
      if (R.it) { const i = this.c.inter.indexOf(R.it); if (i >= 0) this.c.inter.splice(i, 1); }
      if (R.baked) R.baked.dispose();
      if (R.a && this.w.actors.get(R.id) === R.a) { this.w.actors.delete(R.id); R.a.g.removeFromParent(); }
    }
    for (const it of this.kidIts || []) { const i = this.c.inter.indexOf(it); if (i >= 0) this.c.inter.splice(i, 1); }
    this.res = []; this.games = {};
  }
}

// ==================================================================================== behaviours
const BEHAVE = {
  // stand / sit somewhere in a clip; fidgets now and then (and plays its base clip again after one-shots)
  pose(L, R, dt) {
    const e = R.e, a = R.a;
    if (e.fid && (R.ft -= dt) <= 0) { const ev = e.every || [6, 12]; R.ft = rnd(ev[0], ev[1]); const f = pick(e.fid); if (a.anim.clips[f]) { a.play(f, { restart: true, next: R.baseClip }); R.back = 4; } }
    if (R.back > 0) { R.back -= dt; if (R.back <= 0 && a.anim.clip !== R.baseClip && !a.path) a.play(R.baseClip, { fade: 0.3, speed: e.speed }); }
    else if (a.anim.clip === 'idle' && R.baseClip !== 'idle' && !a.path) a.play(R.baseClip, { fade: 0.3, speed: e.speed });   // one-shot base clips loop
  },
  nap(L, R, dt) { BEHAVE.pose(L, R, dt); },
  // trot after a person at their heel (passers-by, joggers)
  heel(L, R, dt) {
    const o = L.w.actor(R.e.owner), a = R.a, p = a.g.position; if (!o) return;
    const [tx, tz] = L.heelTarget(R, o), op = o.g.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    const ospd = R.lastO ? Math.hypot(op.x - R.lastO[0], op.z - R.lastO[1]) / Math.max(dt, 1e-3) : 0; R.lastO = [op.x, op.z];
    if (d > 9 || (R.stuck || 0) > 1.5) { L.trail(R); R.stuck = 0; return; }
    if (d > 0.35) {
      const sp = Math.min(Math.max(ospd, 1.0) + d * 1.2, 6), st = Math.min(d, sp * dt), lv = L.nav.levelAt(p.x, p.z, p.y);
      const r = L.nav.move(p.x, p.z, (dx / d) * st, (dz / d) * st, lv, 0.18), moved = Math.hypot(r.x - p.x, r.z - p.z);
      R.stuck = moved < st * 0.3 ? (R.stuck || 0) + dt : 0;
      p.x = r.x; p.z = r.z; p.y += (r.y - p.y) * Math.min(1, dt * 16); a.targetYaw = Math.atan2(dx, dz);
      const clip = sp > 3.2 && a.anim.clips.run ? 'run' : 'walk';
      if (a.anim.clip !== clip) a.play(clip, { fade: 0.15 });
      if (a.anim.cur) a.anim.cur.speed = clip === 'walk' ? Math.max(0.8, Math.min(2.6, sp / 1.4)) : 1;
      R.moving = true;
    } else if (R.moving) { R.moving = false; a.play(R.baseClip, { fade: 0.2 }); a.targetYaw = o.yaw; }
  },
  // potter about a rectangle (pigeons, wild ones in the grass)
  wander(L, R, dt) {
    const e = R.e, a = R.a;
    if (a.path) return;
    if ((R.t -= dt) > 0) {
      BEHAVE.pose(L, R, dt);
      // wild ones bob up out of the tall grass now and then ("something darts between the stalks")
      if (e.wild && (R.pk = (R.pk ?? rnd(1, 3)) - dt) <= 0) { R.pk = rnd(2.5, 5); L.hopNow(R, 0.55); L.w.fx.emit('leaf', a.headPos(), { n: 2, scale: 0.8 }); }
      return;
    }
    const p = a.g.position, [x0, z0, x1, z1] = e.area;
    if (Math.random() < 0.35 && e.fid) { const f = pick(e.fid); if (a.anim.clips[f]) a.play(f, { restart: true, next: R.baseClip }); R.t = rnd(2, 4); return; }
    for (let k = 0; k < 6; k++) {
      const x = rnd(x0, x1), z = rnd(z0, z1);
      if (L.nav.ok(x, z, R.L) && L.nav.los(p.x, p.z, x, z, R.L, 0.15)) { a.walkTo([[x, z]], { speed: e.speed || 0.8 }).then(() => { R.t = rnd(1.5, 4.5); }); return; }
    }
    R.t = 2;
  },
  // walk a loop of stops (helpers carrying trays and crates, sweepers, the courier, the crossing guard)
  route(L, R, dt) {
    const e = R.e, a = R.a;
    if (R.prop && e.prop === 'broom') R.prop.rotation.z = 0.35 + (a.path ? Math.sin(L.t * 7) * 0.35 : 0);
    if (e.dust && a.path && (R.dT = (R.dT || 0) - dt) <= 0) { R.dT = 0.45; const p = a.g.position; L.w.fx.emit('dust', new THREE.Vector3(p.x + Math.sin(a.yaw) * 0.35, p.y + 0.05, p.z + Math.cos(a.yaw) * 0.35), { n: 1, scale: 0.6 }); }
    if (a.path || !R.paths) return;
    if (R.wait === undefined) { const s = e.pts[R.seg]; R.wait = s[2] ?? 2; if (s[3] && a.anim.clips[s[3]]) a.play(s[3], { restart: true, next: R.baseClip }); }
    if ((R.wait -= dt) > 0) return;
    const path = R.paths[R.seg]; R.seg = (R.seg + 1) % e.pts.length; R.wait = undefined;
    a.walkTo(path, { speed: e.speed || 1 }).then(() => { const n = e.pts[R.seg]; if (n && n[4] !== undefined) a.targetYaw = n[4]; });
  },
  // trash raiding at night: walk between bins, rummage at each (dust, leaves, a clatter)
  rummage(L, R, dt) {
    const a = R.a;
    if (!R.paths) { L.routePaths(R); }
    if (!a.path && (R.wait ?? 0) > 0 && (R.rT = (R.rT || 0) - dt) <= 0) {
      R.rT = 0.6; const p = a.g.position, v = new THREE.Vector3(p.x, p.y + 0.3, p.z);
      L.w.fx.emit(Math.random() < 0.5 ? 'dust' : 'leaf', v, { n: 2, scale: 0.7 });
      const me = L.w.player; if (me && Math.hypot(me.g.position.x - p.x, me.g.position.z - p.z) < 9 && Math.random() < 0.3 && L.app.audio.sfx) L.app.audio.sfx(pick(['cloth', 'thud']), { vol: 0.25 });
    }
    BEHAVE.route(L, R, dt);
  },
  // swim / surf an ellipse on the water, bobbing (fish in the pond, a surfer in the bay)
  swim(L, R, dt) {
    const e = R.e, a = R.a, p = a.g.position, [cx, cz] = e.c, [rx, rz] = e.r;
    R.th = (R.th ?? rnd(0, 6)) + dt * (e.spin || 0.4);
    const x = cx + Math.cos(R.th) * rx, z = cz + Math.sin(R.th) * rz;
    p.set(x, R.y0 + Math.sin(L.t * 2.1 + R.th) * 0.05, z);
    a.yaw = a.targetYaw = Math.atan2(-Math.sin(R.th) * rx, Math.cos(R.th) * rz);
    a.g.rotation.y = a.yaw;
    if (e.fid && (R.ft -= dt) <= 0) { R.ft = rnd(6, 11); const f = pick(e.fid); if (a.anim.clips[f]) { a.play(f, { restart: true, next: R.baseClip }); L.w.fx.emit('splash', new THREE.Vector3(x, R.y0 + 0.3, z), { n: 8 }); } }
    if ((R.bT = (R.bT || 0) - dt) <= 0) { R.bT = rnd(0.5, 1.2); L.w.fx.emit(e.sp === 'hawkabunga' ? 'splash' : 'bubble', new THREE.Vector3(x - Math.sin(a.yaw) * 0.4, R.y0 + 0.25, z - Math.cos(a.yaw) * 0.4), { n: 1, scale: 0.7 }); }
  },
  // hover and drift in a small circle (lantern ghosts at night)
  float(L, R, dt) {
    const e = R.e, a = R.a, p = a.g.position, [cx, cz] = e.c;
    R.th = (R.th ?? rnd(0, 6)) + dt * 0.25;
    const x = cx + Math.cos(R.th) * e.r, z = cz + Math.sin(R.th) * e.r;
    p.set(x, L.w.ground(x, z) + (e.h || 1.4) + Math.sin(L.t * 1.3 + R.th * 3) * 0.18, z);
    a.targetYaw = Math.atan2(-Math.sin(R.th), Math.cos(R.th));
    if ((R.gT = (R.gT || 0) - dt) <= 0) { R.gT = rnd(0.8, 1.6); L.w.fx.emit('ghostfire', new THREE.Vector3(x, p.y - 0.1, z), { n: 1, scale: 0.6 }); }
    BEHAVE.pose(L, R, dt);
  },
  // birds on wires, railings and roofs: they fly off when you come close and come back later
  perch(L, R, dt) {
    const a = R.a, p = a.g.position, me = L.w.player;
    if (R.fly > 0) {
      R.fly -= dt; const k = 1 - R.fly / 1.2;
      p.set(R.x + R.fdx * k * 6, R.y0 + k * k * 5 + Math.sin(k * PI) * 0.6, R.z + R.fdz * k * 6);
      if (R.fly <= 0) { R.away = rnd(18, 30); }
      return;
    }
    BEHAVE.pose(L, R, dt);
    if (me) {
      const q = me.g.position, d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d < 2.4 && Math.abs(q.y - p.y) < 2.2) {
        const dx = p.x - q.x, dz = p.z - q.z, dd = Math.hypot(dx, dz) || 1; R.fdx = dx / dd; R.fdz = dz / dd; R.fly = 1.2;
        a.targetYaw = Math.atan2(R.fdx, R.fdz); if (a.anim.clips.walk) a.play('walk', { speed: 2.5 });
        L.w.fx.emit('feather', a.headPos(), { n: 5 }); L.app.audio.sfx && L.app.audio.sfx('flap', { vol: 0.6 });
      }
    }
  },
  // two playing tag round a circle; with `fly` the runner is a pigeon that flutters off when caught
  tag(L, R, dt) {
    const e = R.e, G = L.games[e.game] || (L.games[e.game] = { list: [], it: null, th: rnd(0, 6), dir: 1, pause: 0 });
    if (!G.list.includes(R)) G.list.push(R);
    R.game = G;
    if (G.list.length < 2 || G.list.some((x) => !x.live || x.busy)) { if (R.moving) { R.moving = false; R.a.play(R.baseClip); } return; }
    if (!G.it) G.it = G.list.find((x) => x.e.chaser) || G.list[0];
    if (G.lead !== R) { if (!G.lead || !G.list.includes(G.lead)) G.lead = R; else return; }
    // the leader ticks the whole game once per frame
    const it = G.it, run = G.list.find((x) => x !== it), [cx, cz] = e.c, r = e.r, A = it.a, B = run.a, pa = A.g.position, pb = B.g.position;
    if (G.pause > 0) { G.pause -= dt; if (G.fly) { const k = 1 - G.pause / 1.3; pb.x = G.fx0 + (G.fx1 - G.fx0) * k; pb.z = G.fz0 + (G.fz1 - G.fz0) * k; pb.y = L.w.ground(pb.x, pb.z) + Math.sin(k * PI) * 1.6; } return; }
    if (G.fly) { G.fly = false; B.play(run.baseClip); }
    G.th += dt * G.dir * (2.3 / r);
    const tx = cx + Math.cos(G.th) * r, tz = cz + Math.sin(G.th) * r;
    step(L, run, tx, tz, 2.3, dt); step(L, it, pb.x, pb.z, 2.55, dt);
    if (Math.hypot(pa.x - pb.x, pa.z - pb.z) < 0.6) {
      const me = L.w.player, near = me && Math.hypot(me.g.position.x - pa.x, me.g.position.z - pa.z) < 12;
      if (run.e.fly) {
        // the pigeon flutters to the far side; the cub sits down, baffled
        G.fly = true; G.pause = 1.3; G.fx0 = pb.x; G.fz0 = pb.z; G.th += PI; G.fx1 = cx + Math.cos(G.th) * r; G.fz1 = cz + Math.sin(G.th) * r;
        B.play('walk', { speed: 2.5 }); L.w.fx.emit('feather', B.headPos(), { n: 6 }); L.w.fx.emit('sweat', A.headPos(), { n: 1 }); A.play(it.baseClip);
        if (near && L.app.audio.sfx) L.app.audio.sfx('flap', { vol: 0.6 });
        it.moving = false;
      } else {
        G.it = run; G.pause = 0.9; G.dir = Math.random() < 0.5 ? -1 : 1; G.th = Math.atan2(pa.z - cz, pa.x - cx) + PI * 0.6 * G.dir;
        L.w.fx.emit('star', B.headPos(), { n: 3 }); for (const x of G.list) { x.a.play(x.baseClip); x.moving = false; }
        if (near && L.app.audio.sfx) L.app.audio.sfx('boing', { vol: 0.5 });
        if (near && Math.random() < 0.5) L.cry(run, 0.7);
      }
    }
  },
  // two Tokonmon sparring (pretend battles in the pocket park, practice in the arena); kids cheer
  spar(L, R, dt) {
    const e = R.e, G = L.games[e.game] || (L.games[e.game] = { list: [], t: 0, n: 0 });
    if (!G.list.includes(R)) G.list.push(R);
    R.game = G;
    if (G.list.length < 2 || G.list.some((x) => !x.live || x.busy)) return;
    if (G.lead !== R) { if (!G.lead || !G.list.includes(G.lead)) G.lead = R; else return; }
    const [A, B] = G.list, t0 = G.t; G.t += dt;
    for (const x of G.list) { const o = x === A ? B : A; x.a.face(o); }
    const at = (s) => t0 < s && G.t >= s, round = G.n % 2 === 0 ? [A, B] : [B, A], me = L.w.player;
    const near = me && Math.hypot(me.g.position.x - A.a.g.position.x, me.g.position.z - A.a.g.position.z) < 14;
    if (at(0.2)) { round[0].a.play('attack', { restart: true, next: round[0].baseClip }); }
    if (at(0.65)) { round[1].a.play('hurt', { restart: true, next: round[1].baseClip }); L.w.fx.emit('star', round[1].a.headPos(), { n: 3 }); if (near && L.app.audio.sfx) L.app.audio.sfx('hit_light', { vol: 0.35 }); for (const x of G.list) { const k = x.e.owner && L.w.actor(x.e.owner); if (k) k.play(x === round[0] ? 'cheer' : 'shock', { restart: true }); } }
    if (G.t > 2.8) {
      G.t = 0; G.n++;
      if (G.n % 6 === 0) { for (const x of G.list) { x.a.play(x.a.anim.clips.win ? 'win' : 'dance', { restart: true, next: x.baseClip }); L.w.fx.emit('note', x.a.headPos(), { n: 2 }); } G.t = -2.5; }
    }
  },
};
function step(L, R, tx, tz, sp, dt) {
  const a = R.a, p = a.g.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d < 0.05) return;
  const s = Math.min(d, sp * dt); p.x += (dx / d) * s; p.z += (dz / d) * s; p.y = L.w.ground(p.x, p.z, p.y);
  a.targetYaw = Math.atan2(dx, dz);
  if (!R.moving) { R.moving = true; a.play('walk', { fade: 0.12 }); if (a.anim.cur) a.anim.cur.speed = 1.7; }
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const phaseOf = (mood) => (mood === 'night' ? 'night' : mood === 'dusk' ? 'dusk' : 'day');
// the cheapest food in the bag to share
function snackOf(st) {
  if (!st || !st.bag) return null;
  const foods = Object.keys(st.bag).filter((id) => st.bag[id] > 0 && ITEMS[id] && ITEMS[id].kind === 'food');
  foods.sort((a, b) => (ITEMS[a].battle ? 1 : 0) - (ITEMS[b].battle ? 1 : 0) || (ITEMS[a].price || 0) - (ITEMS[b].price || 0));
  return foods[0] || null;
}
function ownerName(L, id) { const n = (L.c.npcs || []).find((x) => x.id === id) || (L.w.actor(id) && L.w.actor(id).npc); return (n && n.name) || 'someone'; }
const PET_LINES = [
  '$ closes its eyes and pushes its head into your hand. Its whole body goes soft.',
  'You scratch $ right behind the ears. It makes a noise like a tiny kettle.',
  '$ sniffs your fingers, decides you smell like your partner, and approves.',
  '$ rolls over for a belly rub. You oblige. Everyone wins.',
];
const PLAY_LINES = [
  'You toss an imaginary ball. $ chases it anyway, very seriously, and brings nothing back with great pride.',
  'You play peekaboo. $ is terrible at hiding. You pretend not to see it.',
  '$ bounces around your feet. Your partner joins in, and for a minute the street is a playground.',
  'You race $ to the lamppost. It wins. It always wins.',
];
