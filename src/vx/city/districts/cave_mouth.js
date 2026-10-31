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
import { Emit, obox, motes } from './cave_geo.js';
import { sign, caveMat } from './cave_build.js';
import { voxMesh } from './cave_props.js';   // registers the cave's voxel kinds (crags, the portal, posts…)

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
  // (everything inside the rock's footprint; on the approach — a clearing of 10 m — only plants and leaf litter, so path furniture stays)
  const X0 = mx - 6.5, X1 = mx + 6.5, Z0 = mz - 1.2, Z1 = mz + 8, plant = (k) => /^(tr_|gr_|lt_|tree|bush)|litter|leaves|fern|shrub/i.test(k);
  for (let i = C.props.length - 1; i >= 0; i--) { const p = C.props[i]; if (p.x > X0 && p.x < X1 && ((p.z > Z0 && p.z < Z1) || (p.z > mz - 10 && p.z <= Z0 && plant(p.kind)))) C.props.splice(i, 1); }
  nav.open(X0, Z0, X1, Z1, 0);
  const block = (x, z, r) => nav.each(x - r, z - r, x + r, z + r, (c, cx, cz) => { if (Math.hypot(cx - x, cz - z) < r) nav.walk[0][c] = 0; });
  const VOID = K.voidTex(), ROPE = K.ropeTex();
  const P = (kind, dx, dz, o = {}) => { const x = mx + dx, z = mz + dz; C.prop(kind, x, z, { y: (o.y ?? gy(x, z)) + (o.dy || 0), yaw: o.yaw || 0, s: o.s || 1, collide: false, light: false }); if (o.block) block(x, z, o.block); };
  // ---- the rock: two shoulders either side of the throat, a lintel slab over it, a back mass, flanks and scree
  P('cv_crag0', -3.2, 2.3, { s: 1.15, yaw: 0.3, dy: -0.35, block: 1.7 }); P('cv_crag1', 3.2, 2.4, { s: 1.15, yaw: -0.4, dy: -0.35, block: 1.7 });
  P('cv_rock_hill1', 0, 2.2, { y: y0 + 2.45, s: 1.25, yaw: 1.57 }); P('cv_crag2', 0.2, 6.1, { s: 1.55, yaw: 1.2, dy: -0.4, block: 2.4 });
  P('cv_crag3', -5.4, 4.3, { s: 1.0, yaw: 2.1, dy: -0.3, block: 1.5 }); P('cv_crag0', 5.5, 4.6, { s: 0.95, yaw: 2.0, dy: -0.3, block: 1.5 });
  P('cv_crag1', -2.8, 7.4, { s: 1.1, yaw: 0.8, dy: -0.4, block: 1.6 }); P('cv_crag3', 3.0, 7.6, { s: 1.15, yaw: -0.6, dy: -0.4, block: 1.6 });
  for (const [dx, dz, s, v] of [[-1.95, -0.8, 0.32, 0], [2.1, -0.6, 0.26, 2], [-3.8, 0.2, 0.42, 1], [3.7, 0.3, 0.36, 0], [-5.9, 1.5, 0.5, 2], [6.0, 2.0, 0.45, 1], [0.95, -1.7, 0.18, 0]]) P('cv_rock_hill' + v, dx, dz, { s, yaw: dx * 3, dy: -0.05, block: s * 0.9 });
  // ---- the throat: a black passage into the hill (inward-facing, near-black; the hill's shadow does the rest)
  // (a short throat: its floor follows the hill's terraces up, so no grass pokes through; the dark does the rest)
  const t0 = mz - 0.1, t1 = mz + 2.0, hw = 1.25, yf0 = y0 + 0.03, yf1 = Math.max(y0, gy(mx - 1, t1), gy(mx + 1, t1), gy(mx, t1 - 0.5)) + 0.05, top = y0 + 3.0;
  C.quad(gk, VOID, [mx + hw, yf1 - 0.1, t1], [mx - hw, yf1 - 0.1, t1], [mx - hw, top, t1], [mx + hw, top, t1], { u0: 0, v0: 0 });            // back
  C.quad(gk, VOID, [mx - hw, yf1 - 0.1, t1], [mx - hw, yf0 - 0.1, t0], [mx - hw, top, t0], [mx - hw, top, t1], { u0: 0, v0: 0 });         // west side
  C.quad(gk, VOID, [mx + hw, yf0 - 0.1, t0], [mx + hw, yf1 - 0.1, t1], [mx + hw, top, t1], [mx + hw, top, t0], { u0: 0, v0: 0 });         // east side
  C.quad(gk, VOID, [mx - hw, top, t0], [mx + hw, top, t0], [mx + hw, top, t1], [mx - hw, top, t1], { u0: 0, v0: 0 });                     // roof
  C.quad(gk, VOID, [mx - hw, yf1, t1], [mx + hw, yf1, t1], [mx + hw, yf0, t0], [mx - hw, yf0, t0], { u0: 0, v0: 0 });                     // floor (faces up)
  nav.each(mx - 1.4, t0 - 0.2, mx + 1.4, t1 + 0.5, (c) => { nav.walk[0][c] = 0; });
  // ---- the old mine portal (its loose boards are hung in the updater: they hang askew)
  P('cv_portal', 0, -0.05, { yaw: Math.PI, dy: -0.05, s: 1.0 }); block(mx - 1.55, mz - 0.05, 0.25); block(mx + 1.55, mz - 0.05, 0.25);
  sign(E, gk, K.plankSign('SHAFT No. 3', 'SEALED · APRIL 1906', 1.7, 0.55, '#e8d0a0'), mx, y0 + 3.55, mz - 0.32, 0, -1, 1.7, 0.55, 1);
  // a warning sign on a stake by the trail, and a sagging rope that used to bar the way
  const sx = mx - 2.3, sz = mz - 2.6;
  P('cv_post', -2.3, -2.55, { s: 0.65, block: 0.2 });
  sign(E, gk, K.plankSign('DANGER', 'KEEP OUT · OLD WORKINGS', 1.2, 0.48, '#e86a4a'), sx, gy(sx, sz) + 1.15, sz - 0.07, 0, -1, 1.2, 0.48, 1);
  for (const [ax, az, bx, bz] of [[mx - 2.1, mz - 1.2, mx - 0.4, mz - 1.5], [mx + 0.4, mz - 1.5, mx + 2.1, mz - 1.1]]) {
    const ya = gy(ax, az), yb2 = gy(bx, bz), L = Math.hypot(bx - ax, bz - az);
    P('cv_ropepost', ax - mx, az - mz, { s: 0.55, block: 0.12 });
    obox(E, gk, ROPE, [(ax + bx) / 2, (ya + yb2) / 2 + 0.25, (az + bz) / 2], [L, 0.04, 0.04], yawAlong(bx - ax, bz - az), { pitch: -0.25 });
  }
  // a trail sign where the summit path passes
  {
    const px = 54.0, pz = 46.9, py = gy(px, pz);
    P('cv_post', px - mx, pz - mz, { s: 0.75, block: 0.2 });
    sign(E, gk, K.plankSign('← CAVE', 'NO ENTRY', 1.0, 0.42, '#f0e0b0'), px, py + 1.35, pz - 0.08, 0, -1, 1.0, 0.42, 1);
  }
  // ---- the gameplay hooks: enter, the lantern on its nail, the ranger, the rumbling hill
  C.interact({ x: mx, z: mz - 0.95, r: 2.1, label: 'Enter the Deep Cave', icon: 'door', mm: true, act: async (app) => { const m = await import('../../game/cave.js'); await m.enterCave(app); } });
  C.interact({ x: mx - 2.1, z: mz - 2.6, r: 1.1, label: 'Read the sign', icon: 'eye', act: async (app) => app.say('', '"DANGER — OLD WORKINGS. Shaft No. 3 of the Alamo Hill Mining Co., sealed by order of the city, April 1906."', 'Someone has scratched underneath: "it glows down there".') });
  C.spot('caveMouth', MOUTH_OUT[0], MOUTH_OUT[1], 0); C.spot('caveOut', MOUTH_OUT[0], MOUTH_OUT[1], 0);
  C.npc({ id: 'cv_ranger', who: { id: 'cv_ranger', preset: 'construction', seed: 77, sex: 'f', age: 'adult', hat: { kind: 'hardhat', col: 0x3a8a4a } }, name: 'Ranger Imani', x: mx + 3.0, z: mz - 3.3, yaw: 2.8,
    lines: async (app) => { const m = await import('../../game/cave.js'); await m.rangerTalk(app); } });
  // the lantern on its nail (a piece of its own: it goes when you take it), cold air out of the mouth, the rumbles
  const lx = mx + 1.5, ly = y0 + 1.25, lz = mz - 0.42;
  let rt = 0, fxOn = null, lan = null, rumbleT = 8 + Math.random() * 10;
  C.updaters.push((dt) => {
    const app = globalThis.__app, w = app && app.world; if (!w || !w.city || w.id !== 'city' || !w.sc || !w.sc.city) return;
    const root = w.sc.city.root;
    if (fxOn !== root) {   // once per city build: materials, the lantern, the cold air
      fxOn = root;
      const g = root.getObjectByName(gk); if (g) g.traverse((o) => { if (o.isMesh && o.material && o.material.map && String(o.material.map.userData.key || '').startsWith('cave_')) { caveMat(o.material, o.material.map); o.material.side = THREE.DoubleSide; } });
      const mats = app.stage.mats;
      lan = voxMesh('cv_lantern', mats); lan.position.set(lx, ly, lz); root.add(lan);
      // the boards somebody pried off the portal: one hanging askew from a nail, one still up, two in the grass
      for (const [x, y, z, rx, ry, rz] of [[mx - 0.5, y0 + 1.75, mz - 0.3, 0, 0, -0.55], [mx + 0.85, y0 + 2.2, mz - 0.3, 0, 0, 0.12], [mx + 0.4, gy(mx + 0.4, mz - 1.4) + 0.04, mz - 1.4, Math.PI / 2, 0.4, 0], [mx - 1.1, gy(mx - 1.1, mz - 1.9) + 0.04, mz - 1.9, Math.PI / 2, -0.9, 0]]) {
        const b = voxMesh('cv_board', mats); b.position.set(x, y, z); b.rotation.set(rx, ry, rz, 'YXZ'); root.add(b);
      }
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
