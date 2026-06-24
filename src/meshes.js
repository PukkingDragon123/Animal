// Procedural low-poly creature meshes. Detail from faceted geometry, flat matte
// shading, almost no textures, oversized heads + big eyes — the STYLE FORMULA in
// code. Each builder returns a THREE.Group whose userData.parts are the named
// pieces the animator drives (ears, tail, wings, flippers, legs…).
import * as THREE from '../vendor/three.module.js';

// ---- matte material cache (few materials → few state changes) ----
const _mats = new Map();
export function matte(color, opts = {}) {
  const key = color + '|' + (opts.rough ?? 0.92) + '|' + (opts.flat !== false) + '|' + (opts.emissive || 0) + '|' + (opts.opacity ?? 1);
  let m = _mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color, roughness: opts.rough ?? 0.92, metalness: 0.0,
      flatShading: opts.flat !== false,
      emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissive ? 1 : 0,
      transparent: (opts.opacity ?? 1) < 1, opacity: opts.opacity ?? 1,
    });
    _mats.set(key, m);
  }
  return m;
}

// low-poly primitives (faceted)
const SPH = (r) => new THREE.SphereGeometry(r, 8, 6);
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CON = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s);
const CYL = (rt, rb, h, s = 7) => new THREE.CylinderGeometry(rt, rb, h, s);

function mesh(geo, mat, p = {}) {
  const m = new THREE.Mesh(geo, mat);
  if (p.pos) m.position.set(p.pos[0], p.pos[1], p.pos[2]);
  if (p.scl) m.scale.set(p.scl[0], p.scl[1], p.scl[2]);
  if (p.rot) m.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
  m.castShadow = p.cast !== false; m.receiveShadow = false;
  return m;
}

// cute big eyes: white ball + dark pupil, symmetric pair on the head front
function eyes(group, parent, color, r, sep, fwd, up) {
  const white = matte(0xffffff, { flat: false });
  const dark = matte(color, { flat: false });
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    e.position.set(s * sep, up, fwd);
    const w = mesh(SPH(r), white, { cast: false }); w.scale.set(1, 1, 0.7); e.add(w);
    const p = mesh(SPH(r * 0.55), dark, { pos: [0, 0, r * 0.55], cast: false }); e.add(p);
    parent.add(e);
  }
}

// ---------------------------------------------------------------------------
// Creature builders. All face +Z. Built around unit ~1.2 tall; caller scales.
// ---------------------------------------------------------------------------
function rabbit(c) {
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const body = mesh(SPH(0.5), matte(c.body), { pos: [0, 0.5, 0], scl: [1, 0.95, 1.15] }); g.add(body);
  g.add(mesh(SPH(0.34), matte(c.belly), { pos: [0, 0.34, 0.3], scl: [0.7, 0.6, 0.55], cast: false }));
  const head = new THREE.Group(); head.position.set(0, 0.92, 0.34); g.add(head); parts.head = head;
  head.add(mesh(SPH(0.34), matte(c.body)));
  head.add(mesh(SPH(0.12), matte(c.accent), { pos: [0, -0.04, 0.3], scl: [1, 0.8, 0.8], cast: false })); // muzzle/nose
  eyes(g, head, c.eye, 0.1, 0.16, 0.27, 0.06);
  parts.ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.13, 0.28, 0);
    ear.add(mesh(BOX(0.14, 0.5, 0.08), matte(c.body), { pos: [0, 0.25, 0] }));
    ear.add(mesh(BOX(0.08, 0.34, 0.04), matte(c.accent), { pos: [0, 0.26, 0.045], cast: false }));
    ear.rotation.z = -s * 0.12; head.add(ear); parts.ears.push(ear);
  }
  const tail = mesh(SPH(0.16), matte(0xffffff), { pos: [0, 0.5, -0.55] }); g.add(tail); parts.tail = tail;
  parts.legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = mesh(BOX(0.16, 0.22, 0.2), matte(c.body), { pos: [sx * 0.26, 0.12, sz * 0.22] });
    g.add(leg); parts.legs.push(leg);
  }
  parts.gait = 'hop'; return g;
}

function fox(c) {
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const body = mesh(SPH(0.46), matte(c.body), { pos: [0, 0.52, 0], scl: [1, 0.9, 1.5] }); g.add(body);
  g.add(mesh(SPH(0.34), matte(c.belly), { pos: [0, 0.36, 0.15], scl: [0.7, 0.55, 1.0], cast: false }));
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.62); g.add(head); parts.head = head;
  head.add(mesh(SPH(0.3), matte(c.body), { scl: [1, 0.95, 1] }));
  head.add(mesh(CON(0.16, 0.34, 6), matte(c.body), { pos: [0, -0.05, 0.26], rot: [Math.PI / 2, 0, 0] })); // snout
  head.add(mesh(SPH(0.07), matte(c.accent), { pos: [0, -0.05, 0.42], cast: false }));
  eyes(g, head, c.eye, 0.085, 0.15, 0.22, 0.08);
  parts.ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.16, 0.24, -0.02);
    ear.add(mesh(CON(0.13, 0.26, 4), matte(c.body), { pos: [0, 0.1, 0] }));
    ear.add(mesh(CON(0.07, 0.16, 4), matte(c.accent), { pos: [0, 0.08, 0.04], cast: false }));
    head.add(ear); parts.ears.push(ear);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.5, -0.66); g.add(tail); parts.tail = tail;
  tail.add(mesh(CON(0.26, 0.8, 6), matte(c.body), { pos: [0, 0, -0.3], rot: [-Math.PI / 2, 0, 0], scl: [1, 1, 1] }));
  tail.add(mesh(SPH(0.16), matte(0xf6ebd6), { pos: [0, 0, -0.66], cast: false }));
  parts.legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = mesh(BOX(0.14, 0.34, 0.16), matte(c.accent), { pos: [sx * 0.22, 0.17, sz * 0.32] });
    g.add(leg); parts.legs.push(leg);
  }
  parts.gait = 'trot'; return g;
}

function bee(c) {
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const body = new THREE.Group(); body.position.y = 0.6; g.add(body); parts.body = body;
  body.add(mesh(SPH(0.34), matte(c.body), { scl: [1, 0.9, 1.25] }));
  for (let i = -1; i <= 1; i++) body.add(mesh(CYL(0.31, 0.31, 0.12, 8), matte(c.accent), { pos: [0, 0, i * 0.16 - 0.05], rot: [Math.PI / 2, 0, 0], cast: false }));
  const head = new THREE.Group(); head.position.set(0, 0, 0.38); body.add(head); parts.head = head;
  head.add(mesh(SPH(0.22), matte(c.accent)));
  eyes(g, head, 0xffffff, 0.07, 0.1, 0.17, 0.03);
  for (const s of [-1, 1]) { const a = mesh(CYL(0.012, 0.012, 0.22, 4), matte(c.accent), { pos: [s * 0.08, 0.2, 0.05], rot: [0.3, 0, s * 0.3], cast: false }); a.add(mesh(SPH(0.04), matte(c.body), { pos: [0, 0.12, 0], cast: false })); head.add(a); }
  body.add(mesh(CON(0.08, 0.2, 5), matte(c.accent), { pos: [0, 0, -0.42], rot: [-Math.PI / 2, 0, 0], cast: false }));
  parts.wings = [];
  const wingMat = matte(0xeaf6ff, { opacity: 0.55, flat: false, rough: 0.4 });
  for (const s of [-1, 1]) {
    const w = mesh(SPH(0.26), wingMat, { pos: [s * 0.22, 0.16, 0.02], scl: [0.5, 0.08, 1.0], cast: false });
    body.add(w); parts.wings.push(w);
  }
  parts.gait = 'fly'; return g;
}

function penguin(c) {
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const body = new THREE.Group(); body.position.y = 0.2; g.add(body); parts.body = body;
  body.add(mesh(CYL(0.34, 0.46, 0.95, 9), matte(c.body), { pos: [0, 0.48, 0] }));
  body.add(mesh(SPH(0.46), matte(c.body), { pos: [0, 0.92, 0], scl: [1, 0.85, 1] }));
  body.add(mesh(SPH(0.34), matte(c.belly), { pos: [0, 0.5, 0.2], scl: [0.78, 1.25, 0.6], cast: false }));
  const head = new THREE.Group(); head.position.set(0, 1.18, 0); body.add(head); parts.head = head;
  head.add(mesh(SPH(0.3), matte(c.body)));
  head.add(mesh(CON(0.1, 0.26, 5), matte(c.accent), { pos: [0, -0.02, 0.28], rot: [Math.PI / 2, 0, 0] }));
  eyes(g, head, c.eye, 0.075, 0.13, 0.24, 0.07);
  parts.flippers = [];
  for (const s of [-1, 1]) { const f = mesh(BOX(0.1, 0.6, 0.26), matte(c.body), { pos: [s * 0.44, 0.55, 0] }); f.rotation.z = s * 0.2; body.add(f); parts.flippers.push(f); }
  parts.feet = [];
  for (const s of [-1, 1]) { const ft = mesh(BOX(0.22, 0.1, 0.34), matte(c.accent), { pos: [s * 0.16, 0.05, 0.1] }); g.add(ft); parts.feet.push(ft); }
  parts.gait = 'waddle'; return g;
}

function turtle(c) {
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const shell = mesh(SPH(0.6), matte(c.body), { pos: [0, 0.4, 0], scl: [1.1, 0.6, 1.25] }); g.add(shell);
  // shell plates
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; shell.add(mesh(CON(0.14, 0.12, 5), matte(c.accent), { pos: [Math.cos(a) * 0.34, 0.34, Math.sin(a) * 0.42], cast: false })); }
  shell.add(mesh(CON(0.16, 0.14, 6), matte(c.accent), { pos: [0, 0.42, 0], cast: false }));
  g.add(mesh(SPH(0.5), matte(c.belly), { pos: [0, 0.16, 0], scl: [1.0, 0.4, 1.15], cast: false }));
  const head = new THREE.Group(); head.position.set(0, 0.32, 0.66); g.add(head); parts.head = head;
  head.add(mesh(SPH(0.22), matte(c.belly), { scl: [1, 0.9, 1.2] }));
  eyes(g, head, c.eye, 0.07, 0.11, 0.16, 0.06);
  parts.flippers = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const f = mesh(BOX(0.5, 0.1, 0.26), matte(c.belly), { pos: [sx * 0.5, 0.22, sz * 0.34], rot: [0, sz > 0 ? sx * 0.5 : sx * -0.5 + Math.PI, 0] });
    g.add(f); parts.flippers.push(f);
  }
  parts.gait = 'paddle'; parts.swim = true; return g;
}

function fishBody(c, big) {
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const k = big ? 1.5 : 1;
  const body = mesh(SPH(0.4 * k), matte(c.body), { pos: [0, 0.4, 0], scl: [0.7, 0.85, 1.7] }); g.add(body); parts.body = body;
  g.add(mesh(SPH(0.36 * k), matte(c.belly), { pos: [0, 0.3, 0.05], scl: [0.5, 0.5, 1.5], cast: false }));
  // dorsal
  g.add(mesh(CON(0.16 * k, 0.4 * k, 4), matte(c.accent), { pos: [0, 0.74 * k, -0.05], rot: [0, 0, 0], scl: [0.4, 1, 1.2], cast: false }));
  const tail = new THREE.Group(); tail.position.set(0, 0.4, -0.6 * k); g.add(tail); parts.tail = tail;
  tail.add(mesh(CON(0.34 * k, 0.5 * k, 3), matte(c.accent), { pos: [0, 0, -0.18 * k], rot: [Math.PI / 2, 0, 0], scl: [1, 1, 0.5] }));
  parts.fins = [];
  for (const s of [-1, 1]) { const f = mesh(CON(0.12 * k, 0.34 * k, 3), matte(c.accent), { pos: [s * 0.28 * k, 0.36, 0.12], rot: [Math.PI / 2, 0, s * 0.7], cast: false }); g.add(f); parts.fins.push(f); }
  const head = new THREE.Group(); head.position.set(0, 0.42, 0.6 * k); g.add(head); parts.head = head;
  eyes(g, head, c.eye, 0.08 * k, 0.18 * k, 0.02, 0.04);
  head.add(mesh(SPH(0.05), matte(c.eye), { pos: [0, -0.02, 0.18 * k], cast: false }));
  parts.gait = 'swimfish'; parts.swim = true; return g;
}
const salmon = (c) => fishBody(c, false);
const fish = (c) => fishBody(c, false);

function shark(c) {
  const g = fishBody(c, true);
  const parts = g.userData.parts;
  // tall dorsal
  g.add(mesh(CON(0.18, 0.7, 3), matte(c.accent), { pos: [0, 1.2, -0.1], scl: [0.4, 1, 1.0], cast: false }));
  parts.gait = 'swimfish'; parts.swim = true; return g;
}

function bird(c) {
  c = c || { body: 0x9a8c7a, belly: 0xeeeeee, accent: 0xd8b23a, eye: 0x141414 };
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const body = mesh(SPH(0.34), matte(c.body), { pos: [0, 0.5, 0], scl: [0.8, 0.8, 1.3] }); g.add(body);
  g.add(mesh(CON(0.12, 0.3, 4), matte(c.body), { pos: [0, 0.5, -0.4], rot: [-Math.PI / 2, 0, 0], cast: false }));
  const head = new THREE.Group(); head.position.set(0, 0.66, 0.34); g.add(head); parts.head = head;
  head.add(mesh(SPH(0.2), matte(c.body)));
  head.add(mesh(CON(0.07, 0.2, 4), matte(c.accent || 0xd8b23a), { pos: [0, 0, 0.22], rot: [Math.PI / 2, 0, 0] }));
  eyes(g, head, c.eye || 0x141414, 0.06, 0.1, 0.13, 0.05);
  parts.wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * 0.2, 0.55, 0);
    w.add(mesh(BOX(0.6, 0.06, 0.34), matte(c.body), { pos: [s * 0.3, 0, 0] }));
    g.add(w); parts.wings.push(w);
  }
  parts.gait = 'flap'; parts.fly = true; return g;
}

function seal(c) {
  c = c || { body: 0x8290a0, belly: 0xc9d3df, accent: 0x5a6573, eye: 0x141414 };
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const body = mesh(SPH(0.5), matte(c.body), { pos: [0, 0.4, 0], scl: [0.85, 0.8, 1.7] }); g.add(body);
  g.add(mesh(SPH(0.4), matte(c.belly), { pos: [0, 0.24, 0.1], scl: [0.6, 0.5, 1.5], cast: false }));
  const head = new THREE.Group(); head.position.set(0, 0.6, 0.66); g.add(head); parts.head = head;
  head.add(mesh(SPH(0.28), matte(c.body), { scl: [1, 0.95, 1.05] }));
  head.add(mesh(SPH(0.08), matte(c.accent), { pos: [0, -0.06, 0.26], cast: false }));
  eyes(g, head, c.eye, 0.085, 0.13, 0.2, 0.05);
  parts.flippers = [];
  for (const s of [-1, 1]) { const f = mesh(BOX(0.36, 0.1, 0.26), matte(c.body), { pos: [s * 0.4, 0.2, 0.1], rot: [0, s * 0.5, 0] }); g.add(f); parts.flippers.push(f); }
  g.add(mesh(BOX(0.5, 0.1, 0.3), matte(c.body), { pos: [0, 0.3, -0.7] }));
  parts.gait = 'undulate'; return g;
}

function bear(c) {
  c = c || { body: 0x8a5a3c, belly: 0xa9774f, accent: 0x5e3c27, eye: 0x141414 };
  const g = new THREE.Group(); const parts = g.userData.parts = {};
  const body = mesh(SPH(0.6), matte(c.body), { pos: [0, 0.7, 0], scl: [1, 0.95, 1.5] }); g.add(body);
  const head = new THREE.Group(); head.position.set(0, 0.95, 0.78); g.add(head); parts.head = head;
  head.add(mesh(SPH(0.36), matte(c.body)));
  head.add(mesh(SPH(0.18), matte(c.accent), { pos: [0, -0.08, 0.28], scl: [1, 0.8, 0.9] }));
  head.add(mesh(SPH(0.06), matte(0x14110e), { pos: [0, -0.04, 0.46], cast: false }));
  for (const s of [-1, 1]) head.add(mesh(SPH(0.12), matte(c.body), { pos: [s * 0.24, 0.26, -0.02] }));
  eyes(g, head, c.eye, 0.07, 0.15, 0.28, 0.1);
  parts.legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = mesh(CYL(0.18, 0.2, 0.5, 6), matte(c.accent), { pos: [sx * 0.34, 0.25, sz * 0.42] });
    g.add(leg); parts.legs.push(leg);
  }
  parts.gait = 'lumber'; return g;
}

const BUILDERS = { rabbit, fox, bee, penguin, turtle, salmon, shark, bird, seal, bear, fish };

export function buildCreature(buildKey, colors) {
  const fn = BUILDERS[buildKey] || rabbit;
  const c = colors || { body: 0xcccccc, belly: 0xffffff, accent: 0x888888, eye: 0x222222 };
  const g = fn(c);
  g.userData.build = buildKey;
  return g;
}
