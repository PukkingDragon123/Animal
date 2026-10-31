// [cave] The mouth of the Deep Cave, on the north flank of Alamo Hill (called once from scenes/city.js, after the
// park). A knot of weathered rock pushes out of the grassy terraces; between two shoulders of it an old timber
// mine portal (Shaft No. 3, sealed in 1906, its boards pried loose) frames a black throat that breathes cold air.
// An old miner's lantern hangs on a nail by the entrance until you take it; Ranger Imani keeps an eye on the
// place. Walking up the hill starts the quest ("Something rumbles under Alamo Hill…"), and the ground keeps
// grumbling until whatever lives down there has been calmed. [E] at the mouth runs the first-entry cinematic and
// loads the cave (src/vx/game/cave.js).
import * as THREE from '../../../../vendor/three.module.js';
import { TX } from '../build.js';
import * as K from './cave_tex.js';
import { Emit, boulder, obox, Piece, motes } from './cave_geo.js';
import { lantern, sign, caveMat, pieceMat } from './cave_build.js';

/** where the mouth opens (the throat runs south, into the hill) */
export const MOUTH = { x: 47.75, z: 45.6 };
/** where you stand when you come back out (and the fast-travel pin) */
export const MOUTH_OUT = [47.75, 43.2, Math.PI];
const PI = Math.PI;
const sfx = (app, n, o) => app && app.audio && app.audio.sfx && app.audio.sfx(n, o);
const yawAlong = (dx, dz) => Math.atan2(-dz, dx);

export function build(C) {
  const { x: mx, z: mz } = MOUTH, nav = C.nav, gk = 'cave_mouth', E = new Emit(C);
  const gy = (x, z) => nav.ground(x, z, 0), y0 = gy(mx, mz - 0.6);
  // ---- clear the slope: trees, litter and undergrowth that grew where the rock now stands
  // (everything inside the rock's footprint; only plants and leaf litter on the approach, so path furniture stays)
  const X0 = mx - 6.5, X1 = mx + 6.5, Z0 = mz - 1.2, Z1 = mz + 8, plant = (k) => /^(tr_|gr_|lt_|tree|bush)|litter|leaves|fern|shrub/i.test(k);
  for (let i = C.props.length - 1; i >= 0; i--) { const p = C.props[i]; if (p.x > X0 && p.x < X1 && ((p.z > Z0 && p.z < Z1) || (p.z > mz - 5 && p.z <= Z0 && plant(p.kind)))) C.props.splice(i, 1); }
  nav.open(X0, Z0, X1, Z1, 0);
  const block = (x, z, r) => nav.each(x - r, z - r, x + r, z + r, (c, cx, cz) => { if (Math.hypot(cx - x, cz - z) < r) nav.walk[0][c] = 0; });
  const ROCK = K.rockTex('brown'), TOP = TX.grass('#5e9a46'), VOID = K.voidTex(), TV = K.timberTex('v'), TH = K.timberTex('h'), DECK = K.deckTex();
  // ---- the rock: two shoulders, a lintel, a back mass, flanks and scree (the throat between them stays clear)
  const R = (dx, dz, dy, rx, ry, rz, seed, o = {}) => { const x = mx + dx, z = mz + dz; boulder(E, gk, ROCK, x, gy(x, z) + dy, z, rx, ry, rz, seed, { top: TOP, ...o }); if (o.block !== false) block(x, z, Math.min(rx, rz) * 0.9); };
  R(-2.75, 2.0, 0, 1.55, 2.5, 2.7, 11); R(2.75, 2.1, 0, 1.6, 2.35, 2.8, 12);
  R(-0.2, 2.6, 3.35, 2.5, 1.05, 2.5, 13, { sink: 0, block: false }); R(0, 5.7, 0.4, 2.8, 3.0, 1.5, 14);
  R(-4.6, 3.6, 0, 1.9, 1.7, 2.3, 15); R(4.5, 3.9, 0, 2.0, 1.55, 2.1, 16); R(-2.2, 6.6, 0.6, 2.2, 2.0, 1.8, 17); R(2.4, 6.4, 0.5, 2.0, 2.2, 1.9, 18);
  R(1.5, 3.9, 4.1, 1.3, 0.8, 1.4, 19, { sink: 0, block: false }); R(-1.6, 4.2, 4.0, 1.1, 0.7, 1.2, 20, { sink: 0, block: false });
  for (const [dx, dz, r, s] of [[-1.85, -0.75, 0.42, 21], [2.0, -0.55, 0.34, 22], [-3.6, 0.1, 0.62, 23], [3.5, 0.2, 0.5, 24], [-5.4, 1.4, 0.7, 25], [5.6, 1.9, 0.6, 26], [0.9, -1.6, 0.22, 27]]) R(dx, dz, 0, r * 1.2, r * 0.8, r, s);
  // ---- the throat: a black passage into the hill (inward-facing, near-black; the hill's shadow does the rest)
  const t0 = mz + 0.15, t1 = mz + 4.2, hw = 1.05, th = 2.55, yb = y0 - 0.05;
  C.quad(gk, VOID, [mx + hw, yb, t1], [mx - hw, yb, t1], [mx - hw, yb + th + 0.3, t1], [mx + hw, yb + th + 0.3, t1], { u0: 0, v0: 0 });            // back
  C.quad(gk, VOID, [mx - hw, yb, t1], [mx - hw, yb, t0], [mx - hw, yb + th, t0], [mx - hw, yb + th + 0.3, t1], { u0: 0, v0: 0 });              // west side
  C.quad(gk, VOID, [mx + hw, yb, t0], [mx + hw, yb, t1], [mx + hw, yb + th + 0.3, t1], [mx + hw, yb + th, t0], { u0: 0, v0: 0 });              // east side
  C.quad(gk, VOID, [mx - hw, yb + th, t0], [mx + hw, yb + th, t0], [mx + hw, yb + th + 0.3, t1], [mx - hw, yb + th + 0.3, t1], { u0: 0, v0: 0 }); // roof
  C.quad(gk, VOID, [mx - hw, yb + 0.02, t1], [mx + hw, yb + 0.02, t1], [mx + hw, yb + 0.02, t0], [mx - hw, yb + 0.02, t0], { u0: 0, v0: 0 }); // floor (faces up)
  nav.each(mx - 1.3, t0 - 0.2, mx + 1.3, t1 + 0.5, (c) => { nav.walk[0][c] = 0; });
  // ---- the old mine portal: two posts, a cap, the boards somebody pried loose
  for (const sd of [-1, 1]) { obox(E, gk, TV, [mx + sd * 1.3, y0 + 1.3, mz - 0.05], [0.26, 2.75, 0.26], 0, { roll: sd * 0.03, end: TH }); block(mx + sd * 1.3, mz - 0.05, 0.25); }
  obox(E, gk, TH, [mx, y0 + 2.72, mz - 0.05], [3.2, 0.3, 0.32], 0, { end: TV });
  obox(E, gk, DECK, [mx - 0.55, y0 + 1.9, mz - 0.22], [1.6, 0.22, 0.05], 0, { roll: 0, pitch: -0.5, fit: true });       // one board left, hanging askew
  obox(E, gk, DECK, [mx + 0.9, y0 + 2.25, mz - 0.22], [0.8, 0.2, 0.05], 0, { pitch: 0.15, fit: true });
  obox(E, gk, DECK, [mx + 0.4, y0 + 0.08, mz - 1.4], [1.9, 0.05, 0.22], 0.4, { fit: true });                                 // pried off, lying in the grass
  obox(E, gk, DECK, [mx - 1.1, y0 + 0.07, mz - 1.9], [1.7, 0.05, 0.2], -0.9, { fit: true });
  sign(E, gk, K.plankSign('SHAFT No. 3', 'SEALED · APRIL 1906', 1.7, 0.55, '#e8d0a0'), mx, y0 + 3.15, mz - 0.25, 0, -1, 1.7, 0.55, 1);
  // a warning sign on a stake by the trail, and a sagging rope that used to bar the way
  const sx = mx - 2.3, sz = mz - 2.6;
  obox(E, gk, TV, [sx, gy(sx, sz) + 0.65, sz], [0.1, 1.4, 0.1], 0);
  sign(E, gk, K.plankSign('DANGER', 'KEEP OUT · OLD WORKINGS', 1.2, 0.48, '#e86a4a'), sx, gy(sx, sz) + 1.15, sz - 0.07, 0, -1, 1.2, 0.48, 1);
  block(sx, sz, 0.2);
  const ROPE = K.ropeTex();
  for (const [ax, az, bx, bz] of [[mx - 2.1, mz - 1.2, mx - 0.4, mz - 1.5], [mx + 0.4, mz - 1.5, mx + 2.1, mz - 1.1]]) {
    const ya = gy(ax, az), yb2 = gy(bx, bz), L = Math.hypot(bx - ax, bz - az);
    obox(E, gk, TV, [ax, ya + 0.35, az], [0.07, 0.7, 0.07], 0); block(ax, az, 0.12);
    obox(E, gk, ROPE, [(ax + bx) / 2, (ya + yb2) / 2 + 0.25, (az + bz) / 2], [L, 0.04, 0.04], yawAlong(bx - ax, bz - az), { pitch: -0.25 });
  }
  // a trail sign where the summit path passes
  {
    const px = 54.0, pz = 46.9, py = gy(px, pz);
    obox(E, gk, TV, [px, py + 0.75, pz], [0.12, 1.6, 0.12], 0); block(px, pz, 0.2);
    sign(E, gk, K.plankSign('← CAVE', 'NO ENTRY', 1.0, 0.42, '#f0e0b0'), px, py + 1.35, pz - 0.08, 0, -1, 1.0, 0.42, 1);
  }
  // ---- the gameplay hooks: enter, the lantern on its nail, the ranger, the rumbling hill
  C.interact({ x: mx, z: mz - 0.95, r: 2.1, label: 'Enter the Deep Cave', icon: 'door', mm: true, act: async (app) => { const m = await import('../../game/cave.js'); await m.enterCave(app); } });
  C.interact({ x: mx - 2.1, z: mz - 2.6, r: 1.1, label: 'Read the sign', icon: 'eye', act: async (app) => app.say('', '"DANGER — OLD WORKINGS. Shaft No. 3 of the Alamo Hill Mining Co., sealed by order of the city, April 1906."', 'Someone has scratched underneath: "it glows down there".') });
  C.spot('caveMouth', MOUTH_OUT[0], MOUTH_OUT[1], 0); C.spot('caveOut', MOUTH_OUT[0], MOUTH_OUT[1], 0);
  C.npc({ id: 'cv_ranger', who: { id: 'cv_ranger', preset: 'construction', seed: 77, sex: 'f', age: 'adult', hat: { kind: 'hardhat', col: 0x3a8a4a } }, name: 'Ranger Imani', x: mx + 3.0, z: mz - 3.3, yaw: 2.8,
    lines: async (app) => { const m = await import('../../game/cave.js'); await m.rangerTalk(app); } });
  // the lantern on its nail (a piece of its own: it goes when you take it), cold air out of the mouth, the rumbles
  const L = new Piece(); lantern(L, '', 0, 0, 0, K.rustTex(), K.lanternTex());
  const lx = mx + 1.55, ly = y0 + 1.55, lz = mz - 0.3;
  let rt = 0, fxOn = null, lan = null, rumbleT = 8 + Math.random() * 10;
  C.updaters.push((dt) => {
    const app = globalThis.__app, w = app && app.world; if (!w || !w.city || w.id !== 'city' || !w.sc || !w.sc.city) return;
    const root = w.sc.city.root;
    if (fxOn !== root) {   // once per city build: materials, the lantern, the cold air
      fxOn = root;
      const g = root.getObjectByName(gk); if (g) g.traverse((o) => { if (o.isMesh && o.material && o.material.map && String(o.material.map.userData.key || '').startsWith('cave_')) { caveMat(o.material, o.material.map); o.material.side = THREE.DoubleSide; } });
      lan = L.build(pieceMat); lan.position.set(lx, ly, lz); root.add(lan);
      const air = motes(70, [mx - 1.6, y0 + 0.1, mz - 3.5, mx + 1.6, y0 + 2.4, mz + 1.5], { colors: ['#e8f4ff', '#cfe6ff'], size: 0.03, drift: [0, -0.04, -0.4], wob: 0.2, gain: 0.55, seed: 13 });
      air.name = 'cv_air'; root.add(air); lan.userData.air = air;
    }
    const s = (app.state && app.state.flags && app.state.flags.cave) || {};
    if (lan) { lan.visible = !s.lantern; const air = lan.userData.air; if (air) air.material.uniforms.uTime.value += dt; }
    const me = w.player; if (!me || app.story.busy) return;
    const d = Math.hypot(me.g.position.x - mx, me.g.position.z - mz), Q = app.quests;
    // the first rumble: the quest begins
    if (Q && d < 26 && !Q.has('deepcave') && !Q.done('deepcave')) {
      Q.start('deepcave'); rumble(app, 0.22);
      app.toast('Something rumbles under Alamo Hill…', { icon: 'star', dur: 3.2 });
      if (w.burst) w.burst('dust', [mx, y0 + 2.5, mz], { n: 18 });
    }
    // and it keeps grumbling until the deep is calm
    rt += dt;
    if (!s.boss && d < 34 && rt > rumbleT) { rt = 0; rumbleT = 22 + Math.random() * 26; rumble(app, 0.07 + Math.random() * 0.06); if (w.burst) w.burst('dust', [mx + (Math.random() - 0.5) * 2, y0 + 2.6, mz + 0.2], { n: 6 }); }
  });
  return { mouth: MOUTH };
}

/** a low rumble: the camera trembles, the ground groans (with a late echo off the hill) */
export function rumble(app, k = 0.15) {
  if (app.cinema && app.cinema.shake) app.cinema.shake(k, 2.6);
  sfx(app, 'thud', { vol: 0.5 + k * 2, pitch: 0.35 }); setTimeout(() => sfx(app, 'thud', { vol: 0.2 + k, pitch: 0.3, pan: -0.4 }), 260);
  if (k > 0.12) sfx(app, 'beast_roar', { vol: 0.25, pitch: 0.35 });
}
