// THE DEEP CAVE — gameplay (the map is src/vx/scenes/cave.js + src/vx/city/districts/cave_*.js; the way in is
// the old mine portal on Alamo Hill, src/vx/city/districts/cave_mouth.js).
//  - Getting there: walk up Alamo Hill (the ground rumbles: the quest "Something Rumbles Under Alamo Hill"
//    starts), take the old miner's lantern off its nail and [E] at the mouth. The first time, a cinematic: the
//    hillside, the place card, cold air breathing out, a dolly into the dark; inside, the wick catches.
//    Later visits (and the phone map's pin, once you've been in) just fade. Ways out: the mouth, the collapsed
//    passage once it's open, or any fast-travel pin on the phone (the cave hooks app.travel / app.save so
//    leaving loads the city and a save made down here resumes outside the mouth).
//  - The lantern: a PointLight that rides in the player's hand and swings; two accent lights hop to the
//    nearest strong glow (big crystals, glowcaps, mine lamps, braziers, daylight), light pools do the rest.
//  - Tokonmon (five of the cave's own — Geodig, Lumoth, Stalagrin, Lumifin, Tumblock — plus city species that
//    wandered down): Lumoths drift toward your light, Geodigs and Rainblins skitter away from it, Creepetals
//    hide from it, Snoozaques wake when it comes close, Lumifins circle under Mirror Lake. Encounters: Tumblocks
//    that spot you curl up and come rolling (touch = battle), Stalagrins asleep under the roof drop on you when
//    you pass below, and ore piles you dig through sometimes have a Tokonmon napping inside. A global calm
//    after each fight and per-creature cooldowns keep it from nagging.
//  - Old Gus (a retired miner, the grandson of the man who sealed the mine) by his adit in the Entrance Hall:
//    "Old Gus and the Lumen Ore" — chip 6 Lumen Ore from the veins (a timing tap at each vein: strike the
//    glint for bonus ore) and bring them to him at the miners' camp; he pays, and gives you his grandfather's
//    Rune Key — the only way into the Old Arena.
//  - Puzzles: turn two rose crystals so the shaft of daylight caught by the sun crystal bounces into the
//    crystal gate (it shatters); push the ore cart down the drift through the barricade; the rune door.
//  - The Old Arena: a ring of carved stone older than the city, a fall of lava, braziers and a rune circle.
//    Step into the ring and the camera circles it, the braziers light one by one, the runes ignite, the hill
//    rumbles — and Magmander, a salamander the size of a cable car, opens its eyes high on the wall and crawls
//    down it. Battle. Win: you pull an old drill bit out of its hide, it gives you an Ember Scale, punches the
//    collapsed passage open (a shortcut home) and goes back to sleep by the lava. The rumbling stops.
import * as THREE from '../../../vendor/three.module.js';
import { T } from '../../px/game/ui.js';
import * as S from '../../game/state.js';
import { SPECIES } from '../../data/species.js';
import { view } from './cinema.js';
import { MOODS } from '../stage.js';
import { POST } from '../render/look.js';
import { visit } from './quests.js';
import { SPOT, RAIL, WATER } from '../city/districts/cave_build.js';
import { MOUTH, MOUTH_OUT, rumble } from '../city/districts/cave_mouth.js';
import { voxMesh } from '../city/districts/cave_props.js';

const PI = Math.PI;
const sfx = (app, n, o) => { if (app.audio && app.audio.sfx) app.audio.sfx(n, o); };
const rnd = (a, b) => a + Math.random() * (b - a);
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
const anim = (ms, fn) => new Promise((res) => { const t0 = performance.now(), raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f) => setTimeout(() => f(performance.now()), 16); const step = (now) => { const k = Math.min(1, (now - t0) / ms); fn(k); if (k < 1) raf(step); else res(); }; raf(step); });
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
// fast-travel spots in the walkable city (the same table as app.js / phone.js)
const CITY_SPOTS = { chinatown: 'square', alamo: 'park', pier39: 'pier', dojo: 'dojoDoor', arena: 'arena', apartment: 'frontDoorOut', home: 'frontDoorOut', lab: 'labDoor', city: 'frontDoorOut' };

/** the cave's save state (app.state.flags.cave) */
export function CS(app) {
  const st = app.state || (app.state = {}), f = st.flags || (st.flags = {});
  const s = f.cave || (f.cave = {});
  return Object.assign(s, { ore: s.ore || {}, mirrors: s.mirrors || [1, 0], tries: s.tries || 0, gus: s.gus || 0 });
}

// ==================================================================== the look: a dark, cold, glowing mood
/** registers the 'cave' mood (stage.js MOODS) and its grade (look.js POST) — no sun, a dim cold fill, deep haze */
export function registerMood() {
  if (!MOODS.cave) MOODS.cave = { ink: '#100c12', sun: 0x9ab4d8, sunI: 0.0, sunDir: [0.2, 1, 0.15], hemiSky: 0x52648a, hemiGround: 0x2a2018, hemiI: 0.95, fog: 0x070b10, hazeP: [9, 0.035, 0.78, 0.02], skyP: { night: 1, sunElev: -0.4, turbidity: 2, rayleigh: 1, scale: 0.15 }, clouds: 0, env: 0.2, glow: 2.6, emissive: 1, pools: 1.05, halo: 0.6, ao: 0.95, exposure: 1.75 };
  if (!POST.cave) POST.cave = { bloom: 0.36, threshold: 0.8, sat: 1.1, contrast: 0.13, wb: [0.97, 1.0, 1.05], vig: 0.36, lift: 0.004 };
}

// ==================================================================== hooks into the app (installed once)
export function installCave(app) {
  registerMood();
  if (!app || app._caveHooks) return; app._caveHooks = true;
  const travel0 = app.travel.bind(app), save0 = app.save.bind(app);
  // leaving by the phone's map loads the city first; travelling "to the cave" walks you in
  app.travel = async (id, o = {}) => {
    const w = app.world;
    if (id === 'cave') return w && w.id === 'cave' ? hopTo(app, 'start') : enterCave(app, { fast: true });
    if (w && w.id === 'cave') return CITY_SPOTS[id] ? leaveCave(app, { spot: CITY_SPOTS[id], id }) : travel0(id, o);
    return travel0(id, o);
  };
  // a save made in the cave resumes in the city, just outside the mouth
  app.save = () => {
    const w = app.world;
    if (w && w.id === 'cave') { app.state.map = { id: 'city', x: MOUTH_OUT[0], z: MOUTH_OUT[1], y: 1 }; if (app.state.party && app.state.party.length) S.save(app.state); return; }
    return save0();
  };
  // underground there is no sky and no sun (and no shadow maps to render for them)
  if (app.stage && app.stage.hooks) app.stage.hooks.push((st) => {
    const inCave = !!(app.world && app.world.id === 'cave');
    if (st.sky && st.sky.mesh) st.sky.mesh.visible = !inCave;
    if (st.sun) st.sun.visible = !inCave;
    if (inCave && st.sunFar) st.sunFar.visible = false;
  });
}

// ==================================================================== in and out
/** walk in through the mouth (from the city), with the first-entry cinematic the first time */
export async function enterCave(app, o = {}) {
  installCave(app);
  const w = app.world, s = CS(app), cin = app.cinema, me = w.player, first = !s.seen && !o.fast && w.id === 'city';
  if (!s.lantern && w.id === 'city') {
    await app.say('', 'Cold air breathes out of the dark. By the entrance, an old miner\'s lantern hangs on a rusty nail — there\'s still oil sloshing in it.');
    S.addItem(app.state, 'miner_lantern', 1); s.lantern = true;
    sfx(app, 'reward'); app.toast('Got the Old Miner\'s Lantern', { icon: 'flame', color: T.amber, dur: 2.6 });
  }
  if (first && cin && me) {
    // the hillside, the place card, the cold breath of the mouth, and a dolly into the dark
    const my = w.ground(MOUTH.x, MOUTH.z - 0.8);
    me.path = null; if (w.city) { w.city.vx = w.city.vz = 0; }
    await cin.begin({ prefer: 180 });
    cin.grade('tense');
    await cin.cut(view([MOUTH.x, my + 2.2, MOUTH.z + 1.5], 17, 205, 17));
    cin.focus(null, { band: 0.24, dof: 0.75 });
    sfx(app, 'whoosh', { vol: 0.5, pitch: 0.45 });
    cin.place('The Deep Cave', 'Under Alamo Hill', { wait: false, hold: 4200 });
    const puff = setInterval(() => { if (w.burst) w.burst('steam', [MOUTH.x + rnd(-0.7, 0.7), my + rnd(0.3, 1.8), MOUTH.z + 0.3], { n: 1, dir: new THREE.Vector3(0, 0.1, -1), speed: 0.5, scale: 0.55 }); }, 240);
    const dolly = cin.move(view([MOUTH.x, my + 1.35, MOUTH.z + 0.6], 6.2, 186, 7), { dur: 3.4 });
    me.faceTo(MOUTH.x, MOUTH.z);
    await app.wait(700);
    await cin.walk(me, MOUTH.x - 0.2, MOUTH.z - 1.0, { speed: 1.0 });
    await dolly;
    me.play('idle');
    await app.say('', 'Something deep inside the hill rumbles — low, slow, like breathing.');
    rumble(app, 0.16);
    await cin.move(view([MOUTH.x, my + 1.2, MOUTH.z + 1.75], 1.3, 180, 3), { dur: 2.4, ease: (t) => t * t });
    clearInterval(puff);
    await cin.veilTo(1, 600, '#000000');
    await cin.end({ release: false });
  } else {
    sfx(app, 'whoosh', { vol: 0.5, pitch: 0.6 });
    await app.fade(1, 450);
  }
  await w.load('cave', { life: false });
  await app.story.startRoam(w.spot('start'));
  S.unlockLocation(app.state, 'cave'); visit(app, 'cave');
  const Q = app.quests; if (Q && !Q.done('deepcave') && (Q.at('deepcave') ?? 0) < 1) Q.step('deepcave', 1);
  if (first && cin) await firstLight(app);
  else {
    await app.fade(0, 550);
    if (cin && cin.veil.a > 0) await cin.veilTo(0, 300);
    if (app.hud && app.hud.showLocation) app.hud.showLocation('The Deep Cave', 'Under Alamo Hill');
  }
  s.seen = true; app.save();
}
/** inside, the first time: in the dark the wick catches, the light pushes the dark back, a look round the hall */
async function firstLight(app) {
  const w = app.world, cin = app.cinema, me = w.player, R = CUR;
  if (R) R.lanternK = 0;
  await app.fade(0, 1);
  await cin.begin({ prefer: 20 });
  cin.grade({ warm: 0.3, vig: 0.6, sat: 1.05, contrast: 1.1, bloom: 0.5 });
  await cin.cut(view(me.g.position.clone().setY(me.g.position.y + 1.25), 2.3, 30, 4));
  cin.focus(me, { at: 'chest' });
  await app.wait(400);
  sfx(app, 'fire', { vol: 0.5, pitch: 1.3 }); sfx(app, 'charge', { vol: 0.25, pitch: 1.8 });
  if (R) R.lanternK = 1;
  await cin.veilTo(0, 1400);
  await app.say('', 'Click — the wick catches. Warm light pushes the dark back a few steps, and a hundred wet stones wink at you.');
  const p = me.g.position;
  await cin.move(view([p.x - 1.5, p.y + 1.8, p.z - 9], 10.5, 15, 16), { dur: 3.6 });
  cin.place('Entrance Hall', 'The Deep Cave', { wait: false });
  await app.say('', 'Water drips somewhere far off. Deeper in, something glows a soft, cold blue.');
  const pt = w.partner; if (pt) { pt.face(me); pt.play(pt.anim.clips.cry ? 'cry' : 'idle', { restart: true }); w.emote('partner', 'sweat'); }
  await cin.end({ dur: 1.2 });
  if (app.story) app.story.cap('Your lantern lights the way — Tokonmon down here react to it.', 'The Deep Cave: Lumen Ore glints along the walls', 5);
}
/** back out into the daylight on Alamo Hill (o.spot: a city spot to arrive at instead, e.g. from the phone map) */
export async function leaveCave(app, o = {}) {
  const w = app.world; if (app._caveLeaving) return; app._caveLeaving = true;
  try {
    sfx(app, 'whoosh', { vol: 0.5, pitch: 0.8 });
    await app.fade(1, 500);
    await w.load('city');
    const at = o.spot ? w.spot(o.spot) : [MOUTH_OUT[0], MOUTH_OUT[1], PI, undefined];
    await app.story.startRoam(at);
    w.followCam(0);
    await app.fade(0, 650);
    if (app.hud && app.hud.showLocation) app.hud.showLocation(o.spot ? (w.zoneName || 'San Francisco') : 'Alamo Hill Park', 'San Francisco');
    if (o.id) visit(app, o.id);
    app.save();
  } finally { app._caveLeaving = false; }
}
async function hopTo(app, spot) {
  const w = app.world, p = w.player; if (!p) return;
  await app.fade(1, 350); const s = w.spot(spot); p.path = null; p.place(s[0], s[1], s[2] || 0, s[3]); if (w.city) w.city.placed();
  if (w.partner) w.partner.place(s[0] + 0.8, s[1] + 0.8, 0, s[3]); w.followCam(0); await app.fade(0, 450);
}
/** Ranger Imani, by the mouth */
export async function rangerTalk(app) {
  const s = CS(app), Q = app.quests;
  if (s.boss) return app.say('Ranger Imani', pickOne([['The rumbling stopped. Not a peep from that hill all week!', 'A salamander "the size of a cable car, but polite once you get to know it"? …I\'ll put that in my report exactly like that.'], ['The kids keep asking if the big warm one takes visitors. I said only if they bring a lantern and good manners.']]));
  if (s.seen) return app.say('Ranger Imani', pickOne([['You came back out! Good. Mind the ledges, and if that rumbling gets louder — run, don\'t walk.'], ['Did you meet Gus down there? Hard hat, terrible jokes, a rock that follows him around? He swears he\'s "allowed".']]));
  await app.say('Ranger Imani', 'Easy there! Ranger Imani, Alamo Hill Park. The ground\'s been grumbling for a week, always from this old mine.', 'Shaft No. 3 — sealed since 1906. Somebody pried the boards loose, and now every Tokonmon on the hill sleeps with one eye open.', 'If you\'re going in, take that old lantern off the nail. And it gets warm down deep. Caves aren\'t supposed to get warm.');
  if (Q && !Q.has('deepcave') && !Q.done('deepcave')) Q.start('deepcave');
}

// ==================================================================== the runtime: lantern, accents, fx, drips, life
let CUR = null;
/** called by the scene after finalize: the cave's runtime (one per load) */
export function attach(app, city, built) {
  installCave(app);
  const R = CUR = { app, city, built, root: city.root, t: 0, lanternK: 1, flare: [1, 1, 1], ambT: 4, beams: [], debris: [] };
  const dyn = built.dyn, s = CS(app), nav = city.nav;
  // the accent lights hop to the nearest strong glow; the lantern's own light
  R.acc = [0, 1].map(() => { const l = new THREE.PointLight(0xffffff, 0, 10, 1.6); l.userData.k = 0; city.root.add(l); return l; });
  R.lamp = new THREE.PointLight(0xffb468, 0, 14, 1.6); city.root.add(R.lamp);
  // restore what you've already done
  for (const o of dyn.ores) if (s.ore[o.id]) o.mesh.visible = false;
  if (s.gate) { dyn.gate.mesh.visible = false; dyn.gate.open(); }
  if (s.cart) { dyn.barricade.mesh.visible = false; dyn.barricade.open(); placeCart(R, cartEnd(R), true); unblockCartStart(R); }
  else placeCart(R, cartStart(R));
  if (s.boss) { dyn.rubble.mesh.visible = false; dyn.rubble.open(); }
  if (s.door) { dyn.runeDoor.mesh.visible = false; dyn.runeDoor.open(); }
  if (s.braziers || s.boss) dyn.braziers.forEach((b, k) => lightBrazier(R, k, true));
  R.runeK = s.boss ? 0.35 : 0; R.dug = {};
  if (s.treasure) dyn.strongbox.lidMesh.rotation.x = -1.9;
  if (s.supply) dyn.supply.lidMesh.rotation.x = -1.9;
  updateBeams(R, false);
  void nav;
  return R;
}
/** per frame (the city builder's updater) */
export function tick(R, dt) {
  const app = R.app, w = app.world;
  if (!w || w.id !== 'cave' || !w.sc || w.sc.city !== R.city || CUR !== R) return;
  R.t += dt;
  if (w.life && !w.life.isCave) { w.life.dispose(); for (const id of ['kidA', 'kidB']) w.remove(id); w.life = new CaveLife(R); w.life.start(); }
  if (!R.cleaned) { R.cleaned = true; cleanForeign(R); }
  lanternTick(R, dt); accentTick(R, dt); fxTick(R, dt); arenaTick(R, dt); dripTick(R, dt); ambienceTick(R, dt); cartTick(R, dt); debrisTick(R, dt); eyesTick(R, dt);
  bossTick(R);
}
/** hooks that dress every city-engine map (the mini-game venues: their host, signs, cabinet, prompts) belong to the
 *  city above, not down here: take them back out of the cave */
function cleanForeign(R) {
  const app = R.app, w = app.world, city = R.city, mg = app.minigames;
  if (mg && mg.venueObjs) for (const o of mg.venueObjs) if (o.parent) o.parent.remove(o);
  for (let i = city.inter.length - 1; i >= 0; i--) if (city.inter[i].mg) city.inter.splice(i, 1);
  for (const n of city.npcs || []) w.remove(n.id);
  if (city.npcs) city.npcs.length = 0;
}
// ---- the lantern in your hand
function lanternTick(R, dt) {
  const app = R.app, w = app.world, me = w.player;
  if (!R.lan) {
    // the voxel lantern hangs from its bail under a pivot at the hand (so it swings from the top)
    R.lan = new THREE.Group(); const v = voxMesh('cv_lantern', app.stage.mats, { ownGlow: true }); v.scale.setScalar(0.85); v.position.y = -0.62; R.lan.add(v); R.root.add(R.lan);
    R.lanGlow = []; v.traverse((o) => { if (o.userData.part === 'glow') R.lanGlow.push(o.material); });
    R.lanP = new THREE.Vector3(); R.sw = { x: 0, z: 0, vx: 0, vz: 0 };
  }
  if (!me) { R.lan.visible = false; R.lamp.intensity = 0; return; }
  const b = me.m && me.m.h && me.m.h.b && (me.m.h.b.handL || me.m.h.b.handR);
  if (b) { b.updateWorldMatrix(true, false); _v.setFromMatrixPosition(b.matrixWorld); _v.y -= 0.04; }
  else _v.set(me.g.position.x + Math.sin(me.yaw + 1.4) * 0.32, me.g.position.y + 0.95, me.g.position.z + Math.cos(me.yaw + 1.4) * 0.32);
  // a pendulum: the lantern lags behind the hand and swings back
  const L = R.lan, sw = R.sw, ax = (_v.x - R.lanP.x) / Math.max(dt, 1e-3), az = (_v.z - R.lanP.z) / Math.max(dt, 1e-3);
  R.lanP.copy(_v);
  sw.vx += (-sw.x * 38 - Math.max(-6, Math.min(6, ax)) * 0.9 - sw.vx * 3.2) * dt; sw.vz += (-sw.z * 38 - Math.max(-6, Math.min(6, az)) * 0.9 - sw.vz * 3.2) * dt;
  sw.x = Math.max(-0.5, Math.min(0.5, sw.x + sw.vx * dt)); sw.z = Math.max(-0.5, Math.min(0.5, sw.z + sw.vz * dt));
  L.position.copy(_v); L.rotation.set(sw.z, me.yaw, -sw.x);
  L.visible = me.g.visible !== false;
  // the flame: a warm flicker; in a battle the light lifts over the arena so the fight is lit
  R.lk = (R.lk ?? 0) + ((R.lanternK ?? 1) - (R.lk ?? 0)) * (1 - Math.exp(-dt * 2.2));
  const fl = 0.9 + 0.06 * Math.sin(R.t * 13.1) + 0.04 * Math.sin(R.t * 7.3 + 1.2) + (Math.random() - 0.5) * 0.03;
  const bt = app.battle && app.battle.active;
  if (bt && app.battle.cx !== undefined) { R.lamp.position.set(app.battle.cx, (app.battle.gy || 0) + 3.4, app.battle.cz); R.lamp.intensity = 22 * R.lk; R.lamp.distance = 16; }
  else { R.lamp.position.set(_v.x, _v.y - 0.3, _v.z); R.lamp.intensity = 16 * R.lk * fl; R.lamp.distance = 16; }
  const g0 = (app.stage.mood && app.stage.mood.glow) || 1; for (const m of R.lanGlow) m.color.setScalar(g0 * Math.max(0.12, R.lk) * fl);
}
// ---- two accent lights hop to the nearest big glows (crystals, glowcaps, mine lamps, daylight)
function accentTick(R, dt) {
  const me = R.app.world.player; if (!me) return;
  const p = me.g.position; R.accT = (R.accT || 0) - dt;
  if (R.accT <= 0) {
    R.accT = 0.4;
    const H = R.built.heroes.map((h) => ({ h, d: Math.hypot(h.x - p.x, h.z - p.z) + Math.abs(h.y - p.y) * 0.5 })).filter((q) => q.d < 22).sort((a, b) => a.d - b.d).slice(0, 2).map((q) => q.h);
    R.accWant = H;
  }
  R.acc.forEach((l, i) => {
    const want = R.accWant && R.accWant[i];
    if (l.userData.h !== want) { l.intensity *= Math.exp(-dt * 6); if (l.intensity < 0.05) { l.userData.h = want; if (want) { l.position.set(want.x, want.y, want.z); l.color.setHex(want.col); } } }
    else if (want) l.intensity += (want.i * (want.glowK || 1) - l.intensity) * (1 - Math.exp(-dt * 3));
  });
}
// ---- water, mist, motes, crystal pulse
function fxTick(R, dt) {
  const b = R.built, t = R.t;
  if (b.dyn.water.mat && b.dyn.water.mat.map) b.dyn.water.mat.map.offset.set(Math.sin(t * 0.13) * 0.06, t * 0.012);
  for (const m of b.fxMeshes || []) {
    const mt = m.material; if (!mt) continue;
    if (mt.uniforms && mt.uniforms.uTime) mt.uniforms.uTime.value = t;
    else if (m.userData.mist && mt.map) { mt.map.offset.x += m.userData.mist.sx * dt; mt.map.offset.y += m.userData.mist.sz * dt; }
    else if (m.isMesh && mt.blending === THREE.AdditiveBlending) mt.opacity = (mt.userData.o0 ?? (mt.userData.o0 = mt.opacity)) * (0.85 + 0.15 * Math.sin(t * 0.7 + m.position.x));
  }
  // the Old Arena's crystals breathe (and flare on cue)
  const g0 = (R.app.stage.mood && R.app.stage.mood.glow) || 1;
  for (const g of b.geodeMats || []) {
    const i = g.group === 'cv_geode' ? 3 : +g.group.slice(-1), want = (i < 3 ? R.flare[i] : (R.flare[0] + R.flare[1] + R.flare[2]) / 3) * (1 + 0.12 * Math.sin(t * 1.3 + i));
    g.k = (g.k ?? 1) + (want - (g.k ?? 1)) * (1 - Math.exp(-dt * 4));
    if (g.basic) g.m.color.setScalar(g0 * g.k); else g.m.emissiveIntensity = g.m.userData.glow0 * g.k;
  }
  for (const h of b.heroes) if (h.x > 74 && h.x < 98 && h.z > 66 && h.z < 92) h.glowK = (R.flare[0] + R.flare[1] + R.flare[2]) / 3;
  for (const bm of R.beams) if (bm.material) bm.material.opacity = bm.userData.o * (0.8 + 0.2 * Math.sin(t * 6 + bm.userData.k));
}
// ---- dripping water, with an echo
function echo(app, name, vol, pitch, pan = 0) {
  sfx(app, name, { vol, pitch, pan });
  setTimeout(() => sfx(app, name, { vol: vol * 0.38, pitch: pitch * 0.99, pan: -pan * 0.7 }), 210 + Math.random() * 60);
  setTimeout(() => sfx(app, name, { vol: vol * 0.15, pitch: pitch * 0.98, pan: pan * 0.4 }), 470 + Math.random() * 90);
}
function dripTick(R, dt) {
  const app = R.app, w = app.world, me = w.player; if (!me) return;
  const p = me.g.position;
  for (const d of R.built.drips) {
    const dist = Math.hypot(d.x - p.x, d.z - p.z); if (dist > 16) continue;
    d.t += dt; if (d.t < d.every) continue; d.t = 0;
    w.fx.emit('drop', _w.set(d.x, Math.min(d.top, d.floor + 4), d.z), { n: 1, dir: new THREE.Vector3(0, -1, 0), speed: 2.2, spread: 0.02 });
    setTimeout(() => { if (app.world.id !== 'cave') return; w.fx.emit('splash', _w.set(d.x, d.floor + 0.04, d.z), { n: 4, scale: 0.7 }); echo(app, 'plop', 0.32 * (1 - dist / 16), 1.6 + Math.random() * 0.5, Math.max(-0.8, Math.min(0.8, (d.x - p.x) / 8))); }, 420);
  }
}
// ---- the cave's voice: far-off rumbles, a breath of wind, a stone skittering, a call that echoes
function ambienceTick(R, dt) {
  const app = R.app; R.ambT -= dt; if (R.ambT > 0 || app.story.busy) return;
  R.ambT = 5 + Math.random() * 9;
  const s = CS(app), k = Math.random();
  if (k < 0.3 && !s.boss) { echo(app, 'thud', 0.28, 0.32, rnd(-0.6, 0.6)); if (Math.random() < 0.4 && app.cinema) app.cinema.shake(0.03, 2); }
  else if (k < 0.5) sfx(app, 'whoosh', { vol: 0.12, pitch: 0.32, pan: rnd(-0.8, 0.8) });
  else if (k < 0.72) echo(app, 'step_stone', 0.2, 1.5 + Math.random() * 0.4, rnd(-0.8, 0.8));
  else if (k < 0.86) echo(app, 'coo', 0.1, 0.5 + Math.random() * 0.2, rnd(-0.7, 0.7));
  else echo(app, 'bubble', 0.18, 0.6, rnd(-0.6, 0.6));
}

// ==================================================================== the Tokonmon that live down here
// do: sleep | skitter | wander | shy | drift | swim | guard | charge (notices you, warns, rolls / swoops at you:
// touching you starts a battle) | hang (a Stalagrin asleep under the roof: drops and charges when you pass below)
const RES = [
  // the Entrance Hall and the dripping tunnel
  { id: 'cv_rb1', sp: 'rainblin', at: [50.5, 83], area: [46, 74, 61, 85], do: 'skitter', battle: true },
  { id: 'cv_lm1', sp: 'lumoth', at: [58, 77.5], area: [50, 73, 62, 86], do: 'drift', battle: true },
  { id: 'cv_pebbles', sp: 'tumblock', at: SPOT.pebbles, do: 'pet', yaw: 1.4 },
  { id: 'cv_sg1', sp: 'stalagrin', at: [36.5, 82.2], do: 'hang', battle: true },
  { id: 'cv_sr1', sp: 'studrat', at: [30, 77.5], area: [27, 72, 34, 80], do: 'wander', battle: true },
  // Glowcap Grove
  { id: 'cv_sq1', sp: 'snoozaque', at: [17.4, 64], do: 'sleep', battle: true, lv: 1, yaw: 0.6 },
  { id: 'cv_cp1', sp: 'creepetal', at: [25.6, 62.6], do: 'shy', yaw: -0.8 },
  { id: 'cv_cp2', sp: 'creepetal', at: [15.6, 55.4], do: 'shy', battle: true, yaw: 1.2 },
  { id: 'cv_lm2', sp: 'lumoth', at: [20, 52], area: [13, 47, 29, 63], do: 'drift', battle: true },
  { id: 'cv_gd1', sp: 'geodig', at: [26.5, 56], area: [20, 49, 30, 62], do: 'skitter', battle: true },
  { id: 'cv_rb3', sp: 'rainblin', at: [27, 47.5], area: [21, 44, 30, 52], do: 'skitter' },
  // Whisper Passage and Mirror Lake
  { id: 'cv_tb1', sp: 'tumblock', at: [27.5, 38.5], area: [24, 34, 31, 44], do: 'charge', battle: true },
  { id: 'cv_lf1', sp: 'lumifin', lake: [50, 21.5, 7.0, 3.9, 0], do: 'swim' },
  { id: 'cv_lf2', sp: 'lumifin', lake: [47.5, 21, 4.2, 2.4, 2], do: 'swim' },
  { id: 'cv_wf1', sp: 'weirdfin', lake: [52, 22, 5.5, 3.2, 4], do: 'swim' },
  { id: 'cv_pd1', sp: 'piledrilla', at: [37.8, 26.5], do: 'guard', battle: true, lv: 2, yaw: 1.2 },
  { id: 'cv_lm3', sp: 'lumoth', at: [56, 34.5], area: [48, 30, 63, 40], do: 'drift', battle: true },
  { id: 'cv_sq2', sp: 'snoozaque', at: [36.5, 35.5], do: 'sleep', yaw: 2.4 },
  // the ledge, the mine, the camp
  { id: 'cv_sg2', sp: 'stalagrin', at: [94, 16.2], do: 'hang', battle: true },
  { id: 'cv_tb2', sp: 'tumblock', at: [108.6, 31], area: [106.5, 25, 110.6, 41], do: 'charge', battle: true, lv: 1 },
  { id: 'cv_sg3', sp: 'stalagrin', at: [109, 51.5], do: 'hang', battle: true, lv: 1 },
  { id: 'cv_gd2', sp: 'geodig', at: [106.6, 56.5], area: [104, 53, 109.5, 60], do: 'skitter', battle: true },
  { id: 'cv_mf1', sp: 'metalfang', at: [118.8, 44.4], area: [116.5, 41.5, 123, 46], do: 'wander', battle: true },
  { id: 'cv_cb2', sp: 'chochobake', at: [104.8, 24], area: [102.5, 21.5, 110, 39], do: 'drift' },
];
// open floor for battles: [x, z, r, camera yaw]
const ARENAS = [[54, 80.5, 4.5, 0], [22.5, 55.5, 4.5, 20], [44.5, 33.2, 4, 0], [36.5, 27, 4, 300], [109.3, 37.5, 3.4, 0], [120.2, 43.2, 3.5, 0], [24.5, 41, 3.5, 330], [85, 81.2, 5.2, 35]];
const beatenAt = new Map();
/** the nearest listed open floor; out in a tunnel, the widest open floor right where the fight starts */
function arenaNear(x, z, nav) {
  let best = ARENAS[0], bd = 1e9; for (const a of ARENAS) { const d = Math.hypot(a[0] - x, a[1] - z); if (d < bd) { bd = d; best = a; } }
  if (bd < 9 || !nav) return { at: [best[0], best[1]], r: best[2], cam: { dist: 9, yaw: best[3], pitch: 20 } };
  let out = null;
  for (const r of [4, 3.4, 2.8, 2.3]) {
    for (let k = 0; k < 9 && !out; k++) {
      const cx = x + (k ? Math.cos(k * 0.785) * 1.2 : 0), cz = z + (k ? Math.sin(k * 0.785) * 1.2 : 0);
      let ok = nav.fits(cx, cz, 0, 0.3); for (let i = 0; i < 12 && ok; i++) ok = nav.fits(cx + Math.cos(i * 0.5236) * r, cz + Math.sin(i * 0.5236) * r, 0, 0.25);
      if (ok) out = { at: [cx, cz], r };
    }
    if (out) break;
  }
  out = out || { at: [x, z], r: 2 };
  return { ...out, cam: { dist: 8, yaw: 0, pitch: 22 } };
}
function topLevel(app) { const P = (app.state && app.state.party) || []; return P.reduce((m, x) => Math.max(m, x.level || 5), 5); }

// Old Gus: Augustin Ruiz, retired miner, grandson of the man who sealed Shaft No. 3 (castHuman, grandpa + hard hat)
const GUS_WHO = { id: 'cv_gus', preset: 'grandpa', seed: 23, H: 1.62, hat: { kind: 'hardhat', col: 0xe0a828 }, glasses: null };
const GUS_CAMP = [119.2, 44.9, -2.2];
/** where Gus is: by his adit in the Entrance Hall, until he's sent you after ore (or you're past the gate): the camp */
const gusAt = (app) => { const s = CS(app); return s.gus >= 1 || s.gate ? GUS_CAMP : SPOT.gus; };
const oreInBag = (app) => (app.state.bag && app.state.bag.lumen_ore) || 0;

class CaveLife {
  constructor(R) { this.R = R; this.w = R.app.world; this.list = []; this.isCave = true; this.hushed = false; this.its = []; this.calm = R.t + 8; }
  start() { this.spawnGus(); for (const e of RES) this.list.push({ e, a: null, state: 'new', t: Math.random() * 3 }); this.spawnAll(); this.spawnBoss(); }
  async spawnAll() { for (const r of this.list) { if (this.disposed) return; await this.spawn(r); } }
  near(x, z) {
    const nav = this.w.nav; if (nav.fits(x, z, 0, 0.3)) return [x, z];
    for (let rr = 0.25; rr <= 3; rr += 0.25) for (let k = 0; k < 16; k++) { const a = (k / 16) * PI * 2, qx = x + Math.cos(a) * rr, qz = z + Math.sin(a) * rr; if (nav.fits(qx, qz, 0, 0.3)) return [qx, qz]; }
    return [x, z];
  }
  spawnGus() {
    const w = this.w, [x0, z0, yaw] = gusAt(this.R.app), [x, z] = this.near(x0, z0);
    const a = w.addPerson('cv_gus', GUS_WHO, [x, z, yaw]); a.npc = { id: 'cv_gus', name: 'Old Gus' }; this.gus = a;
    const it = { npc: 'cv_gus', r: 1.9, L: 0, icon: 'chat', label: 'Talk to Old Gus', act: (app) => gusTalk(app) };
    this.R.city.inter.push(it); this.its.push(it);
  }
  async spawn(r) {
    const e = r.e, w = this.w; if (beatenAt.has(e.id) && performance.now() - beatenAt.get(e.id) < 150000) { r.state = 'gone'; return; }
    r.state = 'loading'; r.mode = null; r.hang = false;
    let x, z;
    if (e.lake) { r.ang = e.lake[4] || 0; x = e.lake[0] + Math.cos(r.ang) * e.lake[2]; z = e.lake[1] + Math.sin(r.ang) * e.lake[3]; }
    else if (e.do === 'pet') { const g = gusAt(this.R.app); [x, z] = this.near(g[0] + 0.7, g[1] + 1.1); }
    else [x, z] = this.near(e.at[0], e.at[1]);
    let a; try { a = await w.addMon(e.id, e.sp, [x, z, e.yaw ?? Math.random() * 6.28]); } catch (err) { r.state = 'off'; return; }
    if (this.disposed || w.actors.get(e.id) !== a) { if (w.actors.get(e.id) === a) w.remove(e.id); return; }
    r.a = a; a.cave = r; r.state = 'ok'; r.home = [x, z];
    if (e.do === 'sleep' || e.do === 'pet') a.play('sleep', { fade: 0 });
    if (e.do === 'swim') { a.g.position.y = WATER - 0.2; a.play(a.anim.clips.loop ? 'loop' : a.anim.clips.swim ? 'swim' : 'walk', { fade: 0 }); }
    if (e.do === 'drift') { r.fy = a.g.position.y; a.play('idle', { fade: 0 }); }
    if (e.do === 'hang') { r.hang = true; a.play('hang', { fade: 0 }); r.roofY = Math.min(this.R.built.ceilAt(x, z) - 1.15 - (a.m.scale || 0.5) * 22 / 16, a.g.position.y + 5.2); a.g.position.y = r.roofY; }
    if (e.do === 'pet') {
      const it = { npc: e.id, r: 1.5, L: 0, icon: 'heart', label: 'Pet Pebbles', when: () => r.state === 'ok', act: (app) => petPebbles(app, r) };
      this.R.city.inter.push(it); this.its.push(it);
    }
    if (e.battle) {
      const nm = (SPECIES[e.sp] && SPECIES[e.sp].name) || e.sp;
      const it = { npc: e.id, r: 1.9, L: 0, icon: 'fist', label: 'Battle the wild ' + nm, when: () => r.state === 'ok' && !r.fleeing && !r.hang && r.mode !== 'drop' && r.mode !== 'return' && (e.do !== 'sleep' || r.awake), act: (app) => this.battle(app, r) };
      this.R.city.inter.push(it); this.its.push(it); r.it = it;
    }
  }
  /** the Old Arena's guardian: up in its crevice on the far wall until the arena wakes; once calmed, asleep by the lava */
  async spawnBoss() {
    const w = this.w, s = CS(this.R.app), calm = !!s.boss, [x, z] = calm ? SPOT.bossRest : this.R.built.dyn.bossWall;
    const a = await w.addMon('cv_boss', 'magmander', [x, z, calm ? 2.6 : 0.6]).catch(() => null); if (!a || this.disposed) return;
    a._cinH = null; a.boss = true; this.boss = a; this.R.boss = a;
    if (calm) a.play('sleep', { fade: 0 }); else hideOnWall(this.R, a);
    const it = { npc: 'cv_boss', r: 4.2, L: 0, icon: 'heart', label: 'Sit with Magmander', when: (app) => !!CS(app).boss && !this.R.bossBusy, act: (app) => calmVisit(app) };
    this.R.city.inter.push(it); this.its.push(it);
  }
  /** can a wild one start a fight right now? (free roaming, a healthy team, nothing else going on) */
  canFight() {
    const app = this.R.app, w = this.w;
    return !!w.player && w.free !== false && !app.story.busy && !app.ui.dialog && !(app.battle && app.battle.active) && !(app.cinema && app.cinema.active) && !app._caveLeaving && S.battleTeam(app.state, 3).length > 0;
  }
  /** a charger notices you: in range, in sight, not resting, and the cave has been calm for a while */
  mayCharge(r, d, q, p, reach = 5.2) {
    return d < reach && this.R.t > this.calm && this.R.t > (r.cool || 0) && this.canFight() && this.w.nav.los(q.x, q.z, p.x, p.z, 0, 0.25);
  }
  warn(r, wait = 0.85) {
    const a = r.a, app = this.R.app; r.mode = 'warn'; r.wt = wait; a.path = null; a.face(this.w.player);
    a.play('cry', { restart: true }); if (app.feel && app.feel.emote) app.feel.emote(a, '!', 1.1); else this.w.emote(r.e.id, 'anger');
    sfx(app, 'alert', { vol: 0.7 }); echo(app, r.e.sp === 'stalagrin' ? 'coo' : 'thud', 0.3, r.e.sp === 'stalagrin' ? 1.9 : 0.7);
  }
  giveUp(r) {
    const a = r.a; r.mode = 'tired'; r.t = 2.2; r.cool = this.R.t + 26; a.play('idle', { fade: 0.25 }); this.w.emote(r.e.id, 'sweat');
  }
  contact(r) {
    const app = this.R.app, w = this.w, me = w.player; r.mode = null; this.calm = this.R.t + 20;
    if (me) { me.path = null; if (w.city) { w.city.vx = w.city.vz = 0; } }
    if (app.cinema) app.cinema.shake(0.25); sfx(app, 'hit_heavy', { vol: 0.6 });
    app.story.run(() => this.battle(app, r, { ambush: true }));
  }
  async battle(app, r, o = {}) {
    const w = app.world, me = w.player, a = r.a, e = r.e; if (!a || !me) return;
    const nm = (SPECIES[e.sp] && SPECIES[e.sp].name) || e.sp;
    if (!S.battleTeam(app.state, 3).length) { await app.say('', 'Your Tokonmon are too worn out to fight. The miners\' bunk in the camp looks like a good place to rest.'); return; }
    r.busy = true; r.mode = null; r.hang = false; a.path = null; a.face(me); me.face(a);
    if (!o.ambush) { a.play(a.anim.clips.cry ? 'cry' : 'idle', { restart: true }); w.emote(e.id, 'anger'); sfx(app, 'alert'); }
    await app.wait(o.ambush ? 300 : 650);
    const lv = Math.max(4, Math.min(48, topLevel(app) - 2 + (e.lv || 0) + Math.floor(Math.random() * 3)));
    const res = await app.startBattle({ foe: { name: 'Wild ' + nm, team: [[e.sp, lv]] }, wild: true, title: o.ambush ? 'AMBUSH!' : 'WILD TOKONMON!', subtitle: nm + ' · The Deep Cave', arena: arenaNear(a.g.position.x, a.g.position.z, w.nav) });
    await app.fade(0, 400);
    r.busy = false; this.calm = this.R.t + 20;
    if (!res || res.winner === 0) { r.state = 'gone'; beatenAt.set(e.id, performance.now()); w.burst('dust', [a.g.position.x, a.g.position.y + 0.3, a.g.position.z], { n: 10 }); w.remove(e.id); r.a = null; }
    else { a.play('win', { restart: true }); r.cool = this.R.t + 40; if (e.do === 'hang') r.mode = 'return'; }
  }
  update(dt) {
    const w = this.w, me = w.player; if (!me || this.disposed) return;
    const p = me.g.position, now = performance.now();
    for (const r of this.list) {
      if (r.state === 'gone' && (!beatenAt.has(r.e.id) || now - beatenAt.get(r.e.id) > 150000) && Math.hypot((r.home || r.e.at || [0, 0])[0] - p.x, (r.home || r.e.at || [0, 0])[1] - p.z) > 18) { r.state = 'new'; this.spawn(r); continue; }
      const a = r.a; if (!a || r.state !== 'ok') continue;
      const q = a.g.position, d = Math.hypot(q.x - p.x, q.z - p.z);
      if (this.hushed || r.busy || (this.R.app.battle && this.R.app.battle.active)) continue;
      // a charge in progress stops dead if a scene starts
      if ((r.mode === 'warn' || r.mode === 'run') && !this.canFight()) { r.mode = r.e.do === 'hang' ? 'return' : null; a.play(r.e.do === 'hang' ? 'walk' : 'idle', { fade: 0.2 }); }
      r.t -= dt;
      (BEH[r.e.do] || BEH.wander)(this, r, a, d, dt, p);
    }
    // the guardian dozes; eyes stay dark while it sleeps
    const b = this.boss; if (b && !this.R.bossBusy && CS(this.R.app).boss && b.anim.cur !== 'sleep' && !b.path) b.play('sleep', { fade: 0.4 });
  }
  hush(on = true) { this.hushed = !!on; }
  dispose() { this.disposed = true; for (const it of this.its) { const i = this.R.city.inter.indexOf(it); if (i >= 0) this.R.city.inter.splice(i, 1); } this.its = []; }
}
/** a reachable point in an area, away from (fx, fz) if given */
function pointIn(L, r, fx, fz, tries = 10) {
  const nav = L.w.nav, A = r.e.area, q = r.a.g.position; let best = null, bs = -1e9;
  for (let i = 0; i < tries; i++) {
    const x = A ? rnd(A[0], A[2]) : q.x + rnd(-3, 3), z = A ? rnd(A[1], A[3]) : q.z + rnd(-3, 3);
    if (!nav.fits(x, z, 0, 0.3) || !nav.los(q.x, q.z, x, z, 0, 0.25)) continue;
    const sc = fx === undefined ? Math.random() : Math.hypot(x - fx, z - fz) - Math.hypot(x - q.x, z - q.z) * 0.2;
    if (sc > bs) { bs = sc; best = [x, z]; }
  }
  return best;
}
const BEH = {
  // asleep until the lantern comes close; grumbles awake, watches you, nods off again once you've gone
  sleep(L, r, a, d, dt) {
    const w = L.w, me = w.player;
    if (!r.awake && d < 3.4) { r.awake = true; r.wt = 0; a.play('cry', { restart: true }); w.emote(r.e.id, 'sweat'); sfx(L.R.app, 'coo', { vol: 0.4, pitch: 0.7 }); a.face(me); setTimeout(() => { if (r.a === a && r.awake) a.play('idle', { fade: 0.3 }); }, 1500); return; }
    if (r.awake) { if (d > 6) { r.wt += dt; if (r.wt > 7) { r.awake = false; a.play('sleep', { fade: 0.5 }); } } else { r.wt = 0; a.face(me); } return; }
    if (r.t < 0) { r.t = 2.6 + Math.random() * 2; w.fx.emit('z', a.headPos(), { n: 1 }); }
  },
  // skittish goblins: scatter from the light, cackle from a safe distance
  skitter(L, r, a, d) {
    const p = L.w.player.g.position;
    if (d < 4.6 && !r.fleeing) {
      const t = pointIn(L, r, p.x, p.z, 14); if (!t) return;
      r.fleeing = true; a.walkTo([t], { speed: 3.4 }).then(() => { r.fleeing = false; r.t = 1.5 + Math.random() * 2; a.face(L.w.player); if (a.anim.clips.cackle && Math.random() < 0.7) a.play('cackle', { restart: true }); });
      if (Math.random() < 0.5) L.w.emote(r.e.id, 'sweat');
      return;
    }
    if (!a.path && !r.fleeing && r.t < 0) { r.t = 2 + Math.random() * 3; const t = pointIn(L, r); if (t && Math.random() < 0.7) a.walkTo([t], { speed: 1.6 }); else if (a.anim.clips.lasso) a.play(Math.random() < 0.5 ? 'lasso' : 'idle', { restart: true }); }
  },
  // rummagers: wander, nibble, size you up when you come close
  wander(L, r, a, d) {
    if (d < 3 && !a.path) { a.face(L.w.player); if (r.t < 0) { r.t = 3; const c = a.anim.clips.swagger ? 'swagger' : a.anim.clips.flourish ? 'flourish' : 'cry'; a.play(c, { restart: true }); } return; }
    if (!a.path && r.t < 0) { r.t = 2.5 + Math.random() * 4; const t = pointIn(L, r); if (t && Math.random() < 0.65) a.walkTo([t], { speed: 1.2 }); else { const f = ['nibble', 'chug', 'maskfix', 'idle'].find((c) => a.anim.clips[c] && Math.random() < 0.6) || 'idle'; a.play(f, { restart: true }); } }
  },
  // shy flowers: hide from the light, peek at it from the edge of the dark
  shy(L, r, a, d) {
    const want = d < 3.2 ? 'hide' : d < 7.5 ? 'peek' : r.t < -6 ? 'dance' : 'idle';
    if (want === 'dance' && r.clip === 'dance') { if (r.t < -9) r.t = 0; return; }
    if (r.clip !== want && a.anim.clips[want]) { a.play(want, { fade: 0.25, restart: want === 'dance' }); r.clip = want; if (want === 'hide') sfx(L.R.app, 'sneak_rustle', { vol: 0.3 }); }
    if (d < 7.5) a.face(L.w.player);
  },
  // lantern ghosts: drawn to your light, hovering just out of reach
  drift(L, r, a, d, dt, p) {
    const w = L.w, q = a.g.position, A = r.e.area;
    let tx, tz;
    if (d < 9) { const k = 2.6 / Math.max(d, 0.01); tx = p.x + (q.x - p.x) * k; tz = p.z + (q.z - p.z) * k; }
    else { if (!r.dt || r.t < 0) { r.t = 3 + Math.random() * 3; r.dt = pointIn(L, r) || [q.x, q.z]; } [tx, tz] = r.dt; }
    if (A) { tx = Math.max(A[0], Math.min(A[2], tx)); tz = Math.max(A[1], Math.min(A[3], tz)); }
    const dx = tx - q.x, dz = tz - q.z, dd = Math.hypot(dx, dz), sp = Math.min(dd * 1.5, d < 9 ? 1.6 : 0.9) * dt;
    if (dd > 0.05) { const m = w.nav.move(q.x, q.z, (dx / dd) * sp, (dz / dd) * sp, 0, 0.3); q.x = m.x; q.z = m.z; }
    const gy = w.nav.ground(q.x, q.z, 0); q.y += (gy + 0.75 + Math.sin(L.R.t * 2 + r.e.id.length) * 0.12 - q.y) * (1 - Math.exp(-dt * 4));
    if (d < 9) a.face(w.player); else if (dd > 0.1) a.targetYaw = Math.atan2(dx, dz);
    const want = d < 4 && a.anim.clips.lean ? 'lean' : 'idle';
    if (r.clip !== want) { a.play(want, { fade: 0.3 }); r.clip = want; }
    r.ft = (r.ft || 0) - dt; if (r.ft < 0) { r.ft = 0.5 + Math.random() * 0.8; w.fx.emit(d < 6 ? 'ghostfire' : 'blueember', a.headPos(_w), { n: 1, scale: 0.7 }); }
  },
  // lake fish: slow loops just under the surface; a ripple and a bubble now and then
  swim(L, r, a, d, dt) {
    const [cx, cz, rx, rz] = r.e.lake, w = L.w; r.ang = (r.ang || 0) + dt * 0.18 * (r.e.id.endsWith('2') ? -1.4 : 1);
    const x = cx + Math.cos(r.ang) * rx, z = cz + Math.sin(r.ang) * rz, q = a.g.position;
    a.targetYaw = Math.atan2(x - q.x, z - q.z); q.set(x, WATER - 0.22 + Math.sin(L.R.t * 1.7 + rx) * 0.05, z);
    if (r.t < 0) {
      r.t = 1.5 + Math.random() * 3; w.fx.emit('bubble', _w.set(x, WATER + 0.05, z), { n: 2, scale: 0.8 });
      const loop = a.anim.clips.loop ? 'loop' : a.anim.clips.swim ? 'swim' : 'walk';
      if (d < 7 && a.anim.clips.bait && Math.random() < 0.5) a.play('bait', { restart: true });
      else if (d < 6 && r.e.sp === 'lumifin' && Math.random() < 0.4) { a.play('special', { restart: true }); w.fx.emit('sparkle', a.headPos(_w), { n: 4 }); }   // its lure flares at your lantern
      else if (a.anim.cur !== loop) a.play(loop, { fade: 0.3 });
    }
  },
  // the crystal guardian: warns you off its crystals, knuckles on the rock
  guard(L, r, a, d) {
    if (d < 5.5) { a.face(L.w.player); if (r.t < 0) { r.t = 3.2; a.play(a.anim.clips.knuckles ? 'knuckles' : 'cry', { restart: true }); L.w.emote(r.e.id, 'anger'); sfx(L.R.app, 'thud', { vol: 0.3, pitch: 0.6 }); } }
    else if (r.t < -8) { r.t = 0; a.play(a.anim.clips.doze ? 'doze' : 'idle', { restart: true }); }
  },
  // territorial rollers (Tumblock): spot you in the light, a "!" and a wind-up, then curl up and come rolling —
  // touch = battle; give up after a few seconds or when you outrun them (then rest a while)
  charge(L, r, a, d, dt, p) {
    const w = L.w, q = a.g.position, fly = r.e.do === 'hang';
    if (r.mode === 'warn') { a.face(w.player); r.wt -= dt; if (r.wt <= 0) { r.mode = 'run'; r.ct = fly ? 2.2 : 2.8; a.play(fly ? 'walk' : a.anim.clips.roll ? 'roll' : 'walk', { fade: 0.1 }); sfx(L.R.app, fly ? 'whoosh' : 'charge', { vol: 0.5, pitch: fly ? 1.4 : 0.6 }); } return; }
    if (r.mode === 'run') {
      r.ct -= dt; const dx = p.x - q.x, dz = p.z - q.z, dd = Math.hypot(dx, dz);
      if (dd < (fly ? 1.15 : 1.05)) { L.contact(r); return; }
      if (r.ct <= 0 || dd > 10) { L.giveUp(r); return; }
      const sp = (fly ? 6.0 : 5.3) * dt, m = w.nav.move(q.x, q.z, (dx / dd) * sp, (dz / dd) * sp, 0, 0.3), moved = Math.hypot(m.x - q.x, m.z - q.z);
      q.x = m.x; q.z = m.z; a.targetYaw = Math.atan2(dx, dz);
      const gy = w.nav.ground(q.x, q.z, 0); q.y = fly ? q.y + (gy + 0.35 - q.y) * (1 - Math.exp(-dt * 6)) : gy;
      if (moved < sp * 0.25) { r.stuck = (r.stuck || 0) + dt; if (r.stuck > 0.5) { L.giveUp(r); return; } } else r.stuck = 0;
      r.ft = (r.ft || 0) - dt; if (r.ft < 0) { r.ft = fly ? 0.12 : 0.07; w.fx.emit(fly ? 'sparkle' : 'dust', _w.set(q.x, q.y + 0.15, q.z), { n: 1, scale: fly ? 0.6 : 0.9 }); if (!fly) sfx(L.R.app, 'step_stone', { vol: 0.25, pitch: 0.55 }); }
      return;
    }
    if (r.mode === 'tired') { if (r.t < 0) r.mode = fly ? 'return' : null; return; }
    if (L.mayCharge(r, d, q, p)) { L.warn(r); return; }
    BEH.wander(L, r, a, d);
  },
  // Stalagrin asleep upside down under the roof: pass below and it drops, shrieks and swoops at you; afterwards
  // it flaps back up to its spot
  hang(L, r, a, d, dt, p) {
    const w = L.w, q = a.g.position;
    if (r.mode === 'drop') {
      r.vy -= 15 * dt; q.y += r.vy * dt; const gy = w.nav.ground(q.x, q.z, 0) + 0.35;
      if (q.y <= gy) { q.y = gy; w.burst('dust', [q.x, gy, q.z], { n: 6 }); sfx(L.R.app, 'thud', { vol: 0.35, pitch: 1.3 }); L.warn(r, 0.5); }
      return;
    }
    if (r.mode === 'return') {
      const [hx, hz] = r.home, dx = hx - q.x, dz = hz - q.z, dd = Math.hypot(dx, dz);
      if (a.anim.cur !== 'walk') a.play('walk', { fade: 0.2 });
      if (dd > 0.08) { const sp = Math.min(dd, 2.4 * dt); q.x += (dx / dd) * sp; q.z += (dz / dd) * sp; a.targetYaw = Math.atan2(dx, dz); }
      q.y += (r.roofY - q.y) * (1 - Math.exp(-dt * 1.8));
      if (dd < 0.1 && Math.abs(q.y - r.roofY) < 0.12) { r.mode = null; r.hang = true; a.play('hang', { fade: 0.35 }); }
      return;
    }
    if (r.mode === 'warn' || r.mode === 'run' || r.mode === 'tired') return BEH.charge(L, r, a, d, dt, p);
    r.hang = true; q.y = r.roofY;
    if (L.mayCharge(r, d, q, p, 3.3)) { r.mode = 'drop'; r.vy = 0; r.hang = false; a.play('walk', { fade: 0.12 }); sfx(L.R.app, 'whoosh', { vol: 0.6, pitch: 1.5 }); echo(L.R.app, 'coo', 0.35, 1.9); return; }
    if (r.t < 0) { r.t = 3 + Math.random() * 4; if (d < 9) w.fx.emit('drop', _w.set(q.x, q.y - 0.2, q.z), { n: 1, dir: new THREE.Vector3(0, -1, 0), speed: 2 }); }
  },
  // Pebbles, Old Gus's Tumblock: curled up asleep beside him; wakes up happy when you come by
  pet(L, r, a, d, dt) {
    const w = L.w, app = L.R.app;
    const g = L.gus && L.gus.g.position; if (g && !a.path && Math.hypot(g.x - a.g.position.x, g.z - a.g.position.z) > 4) { const [x, z] = L.near(g.x + 0.7, g.z + 1.1); a.place(x, z, a.yaw); }
    if (!r.awake && d < 2.6) { r.awake = true; r.wt = 0; a.play('win', { restart: true }); if (app.feel && app.feel.emote) app.feel.emote(a, 'heart', 1.4); else w.emote(r.e.id, 'heart'); sfx(app, 'coo', { vol: 0.35, pitch: 1.4 }); return; }
    if (r.awake) { a.face(w.player); if (d > 5) { r.wt += dt; if (r.wt > 5) { r.awake = false; a.play('sleep', { fade: 0.5 }); } } else r.wt = 0; return; }
    if (r.t < 0) { r.t = 3 + Math.random() * 2; w.fx.emit('z', a.headPos(), { n: 1 }); }
  },
};

// ==================================================================== interactables (registered at build time)
export function addInteractables(C, built, app) {
  const dyn = built.dyn, fy = built.floorAt, I = (o) => C.interact(o);
  I({ x: SPOT.exit[0], z: SPOT.exit[1], r: 2.4, label: 'Head back outside', icon: 'door', mm: true, act: (a) => leaveCave(a) });
  I({ x: 55.6, z: 91.4, r: 1.4, label: 'Read the old sign', icon: 'eye', act: (a) => a.say('', '"DANGER — OLD WORKINGS — KEEP OUT." Under it, a newer scrawl in chalk: "the glow is ALIVE (honest)".') });
  I({ x: 49.2, z: 74.6, r: 1.5, label: 'Search the old crate', icon: 'bag', when: (a) => !CS(a).crate, act: (a) => loot(a, 'crate', [['quartz', 3], ['takoyaki', 1]], 'Under a rotten tarp: a crate of mining supplies, mostly rust and mouse nests… and a few things still worth taking.') });
  for (const o of dyn.ores) I({ x: o.x, z: o.z, y: o.y + 1.0, r: 1.6, label: 'Chip out the glowing ore', icon: 'star', when: (a) => !CS(a).ore[o.id], act: (a) => mineOre(a, o) });
  // Mirror Lake's light puzzle
  I({ x: SPOT.sun[0] - 0.3, z: SPOT.sun[1] - 1.1, r: 1.6, label: 'Look at the bright crystal', icon: 'eye', act: (a) => a.say('', 'A shaft of daylight falls through a crack in the roof onto an amber crystal, and comes out the other side as a straight, bright beam.', CS(a).gate ? 'Its beam still runs from crystal to crystal and on into the open passage.' : 'The beam strikes a rose-coloured crystal on a rock nearby. Those look like they could be turned…') });
  dyn.mirrors.forEach((m, k) => I({ x: m.x, z: m.z, y: m.y + 1.2, r: 1.7, label: 'Turn the rose crystal', icon: 'hand', when: (a) => !CS(a).gate, act: (a) => turnMirror(a, k) }));
  I({ x: SPOT.gate[0] - 1.6, z: SPOT.gate[1] + 0.7, r: 1.8, label: 'Touch the crystal wall', icon: 'eye', when: (a) => !CS(a).gate, act: async (a) => { await a.say('', 'A wall of dark violet crystal seals the passage east. It\'s ice-cold, and when you touch it, it hums — very faintly — like it\'s waiting for something.', 'Light. It\'s waiting for light.'); questAt(a, 'deepcave', 2); } });
  I({ x: 47, z: 31.2, r: 1.6, label: 'Look into the lake', icon: 'drop', act: (a) => a.say('', 'The water is so still it\'s a mirror: every crystal hangs upside down in it, glowing. Something long and striped slides under the reflection and is gone.') });
  // the mine
  I({ x: SPOT.cart[0], z: SPOT.cart[1] - 1.5, r: 1.7, label: 'Push the mine cart', icon: 'hand', when: (a) => !CS(a).cart, act: (a) => pushCart(a) });
  I({ x: SPOT.barricade[0] + 0.8, z: SPOT.barricade[1] - 1.2, r: 1.8, label: 'Inspect the barricade', icon: 'eye', when: (a) => !CS(a).cart, act: (a) => a.say('', 'Thick planks nailed across the drift, with rubble heaped against them. KEEP OUT. The rails run straight under the boards…', 'Behind them, the floor drops away, and the air coming through the gaps glows faintly violet.') });
  I({ x: SPOT.journal[0] - 0.9, z: SPOT.journal[1] - 0.3, r: 1.5, label: 'Read the miner\'s journal', icon: 'book', act: (a) => readJournal(a) });
  I({ x: SPOT.supply[0] - 0.9, z: SPOT.supply[1] + 0.4, r: 1.5, label: 'Open the supply chest', icon: 'bag', when: (a) => !CS(a).supply, act: (a) => openChest(a, dyn.supply, 'supply', [['revive_onigiri', 2], ['ramune', 2], ['okonomiyaki', 1]], 'Tins of hard biscuits (no), a bundle of candles (no)… and, wrapped in waxed cloth, supplies that somehow kept.') });
  I({ x: 118.2, z: 40.6, r: 1.5, label: 'Rest on the old bunk', icon: 'bed', act: (a) => restBunk(a) });
  // the hidden grotto
  I({ x: SPOT.chest[0] + 0.9, z: SPOT.chest[1] + 0.6, r: 1.4, label: 'Open the old strongbox', icon: 'coin', when: (a) => !CS(a).treasure, act: (a) => strongbox(a) });
  // heaps of ore-flecked rubble (dig through them: ore, gems — and sometimes a Tokonmon napping inside)
  for (const pl of dyn.piles) I({ x: pl.x, z: pl.z, y: pl.y + 1.0, r: 1.7, label: 'Dig through the ore pile', icon: 'hand', when: () => !(CUR && CUR.dug && CUR.dug[pl.id]), act: (a) => digPile(a, pl) });
  // the rune door below the mine (from the drift side), the Old Arena's lore
  {
    const D = dyn.runeDoor, [bx, bz] = SPOT.barricade, L = Math.hypot(bx - D.x, bz - D.z), nx = (bx - D.x) / L, nz = (bz - D.z) / L;
    D.side = [nx, nz];
    I({ x: D.x + nx * 1.4, z: D.z + nz * 1.4, r: 1.9, label: 'Inspect the rune door', icon: 'eye', mm: true, when: (a) => !CS(a).door, act: (a) => runeDoor(a) });
  }
  I({ x: SPOT.arena[0] - 1.2, z: SPOT.arena[1] - 1.6, r: 1.6, label: 'Read the floor runes', icon: 'book', when: (a) => !!CS(a).braziers, act: (a) => a.say('', 'The runes are no alphabet you know — flames, coils, a long tail curling round the whole ring.', CS(a).boss ? 'Now that the arena is quiet, you can see what they show: a great salamander, asleep at the centre of everything, and tiny figures bowing to it with lamps in their hands.' : 'They are still warm to the touch.') });
  I({ x: dyn.lava.x, z: dyn.lava.z - 3.6, r: 1.8, label: 'Look at the lava fall', icon: 'eye', act: (a) => a.say('', 'Molten rock pours slowly down the wall into a glowing pool, crusting black at the edges and cracking open again. The heat makes your eyes water from here.', CS(a).boss ? 'Magmander\'s favourite spot. You can see the dent it has worn in the rock beside the pool, exactly salamander-shaped.' : '') });
  // the collapsed passage, from both sides
  for (const [x, z] of [[SPOT.rubble[0] - 1.6, SPOT.rubble[1] - 0.2], [SPOT.rubble[0] + 1.6, SPOT.rubble[1] + 0.1]]) I({ x, z, r: 1.6, label: 'Inspect the rubble', icon: 'eye', when: (a) => !CS(a).boss, act: (a) => a.say('', 'The passage is choked with fallen rock, wedged tight. You can feel a draught between the stones. Something big could shift this… nothing your size.') });
  // the runtime
  let R = null;
  C.updaters.push((dt) => { if (R) tick(R, dt); });
  return { attach: (city) => { R = attach(app, city, built); return R; } };
  void fy;
}

/** move a quest forward to step n (never back) */
function questAt(app, id, n) { const Q = app.quests; if (!Q || Q.done(id)) return; if (!Q.has(id)) Q.start(id); if ((Q.at(id) ?? 0) < n) Q.step(id, n); }

// ==================================================================== loot, ore, chests, the journal, rest
async function loot(app, key, items, line) {
  const s = CS(app); if (s[key]) return;
  await app.say('', line);
  for (const [id, n] of items) S.addItem(app.state, id, n);
  s[key] = true; sfx(app, 'reward');
  app.toast(items.map(([id, n]) => `+${n} ${(itemName(id))}`).join('  '), { icon: 'bag', color: T.amber, dur: 2.8 });
  app.save();
}
const itemName = (id) => ({ quartz: 'Quartz Gem', takoyaki: 'Takoyaki', revive_onigiri: 'Revive Onigiri', ramune: 'Ramune', okonomiyaki: 'Okonomiyaki', diamond: 'Diamond Gem', star_candy: 'Star Candy', amethyst: 'Amethyst Gem', sapphire: 'Sapphire Gem', ember_scale: 'Ember Scale', rune_key: 'Rune Key', lumen_ore: 'Lumen Ore' }[id] || id);
async function mineOre(app, o) {
  const s = CS(app), w = app.world, me = w.player; if (s.ore[o.id]) return;
  if (me) { me.path = null; me.faceTo(o.x, o.z); me.play('idle', { fade: 0.15 }); }
  if (!s.tapTold) { s.tapTold = true; app.toast('Strike when the glint crosses the bright seam!', { icon: 'star', color: T.cyan, dur: 2.6 }); }
  // the timing tap: a glint sweeps the vein; strike it on the bright seam for bonus ore
  const grade = await timingTap(app, { label: 'Strike the vein!' });
  if (me) me.play('throw', { restart: true });
  sfx(app, 'hit_light', { pitch: 1.5 }); await app.wait(300);
  sfx(app, 'destroy_glass', { vol: 0.5, pitch: 1.3 }); echo(app, 'sparkle', 0.4 + grade * 0.15, 1.2 + grade * 0.15);
  w.burst('shard', [o.x, o.y + 0.45, o.z], { n: 10 + grade * 6 }); w.burst('sparkle', [o.x, o.y + 0.5, o.z], { n: 16 + grade * 12 });
  const m = o.mesh; if (m) { const s0 = m.scale.x; await anim(280, (k) => { m.scale.setScalar(s0 * (1 - k * 0.92)); m.rotation.y += 0.08; }); m.visible = false; }
  const got = 1 + grade;
  s.ore[o.id] = 1; S.addItem(app.state, 'lumen_ore', got);
  const n = Object.keys(s.ore).length, tot = CUR ? CUR.built.dyn.ores.length : 10;
  app.toast(`+${got} Lumen Ore${grade === 2 ? '  PERFECT strike!' : grade === 1 ? '  Good strike!' : ''}   (vein ${n}/${tot})`, { icon: 'star', color: grade ? T.amber : T.cyan, dur: 2.4 });
  if (me) me.play('idle', { fade: 0.2 });
  oreForGus(app);
  if (n === tot) { await app.say('', 'That\'s every glowing vein in the cave. Your bag clinks like a wind chime.'); S.addItem(app.state, 'sapphire', 2); app.toast('Bonus: +2 Sapphire Gem', { icon: 'star', color: T.amber }); }
  app.save();
}
/** Old Gus's errand: once you carry six pieces of Lumen Ore, the quest moves on to "bring them to Gus" */
function oreForGus(app) {
  const Q = app.quests; if (!Q || !Q.has('gusore') || (Q.at('gusore') ?? 0) >= 1) return;
  const n = oreInBag(app);
  if (n >= 6) Q.step('gusore', 1); else app.toast(`Lumen Ore for Old Gus: ${n}/6`, { icon: 'bag', color: T.cyan, dur: 1.8 });
}
/**
 * the timing tap: a glint sweeps back and forth along a gauge over the vein; tap (E / Space / Enter / click) while
 * it's on the bright seam → 2 (perfect), on the glow round it → 1 (good), anywhere else (or too late) → 0
 */
function timingTap(app, o = {}) {
  if (app.auto || !app.overlays || !app.ui) return Promise.resolve(1);
  return new Promise((res) => {
    const S2 = { t: 0, c: 0.5 + Math.random() * 0.32, good: 0.12, perf: 0.04, spd: 1.15 + Math.random() * 0.3, out: -1, ot: 0, mk: 0 };
    const pos = () => { const ph = (S2.t * S2.spd + 0.02) % 2; return ph < 1 ? ph : 2 - ph; };
    const draw = (ui, dt) => {
      S2.t += dt;
      const W = ui.w, H = ui.h, bw = 176, bh = 10, x0 = Math.round(W / 2 - bw / 2), y0 = Math.round(H * 0.7), g = ui.g;
      const k = S2.out < 0 ? pos() : S2.mk, live = S2.out < 0;
      // the card, the vein's gauge (dark rock, the glowing band, the bright seam), the glint
      ui.panel(x0 - 12, y0 - 22, bw + 24, bh + 36, { r: 3 });
      ui.text(o.label || 'Strike!', W / 2, y0 - 16, T.text, { align: 'center', bold: true });
      ui.rect(x0 - 1, y0 - 1, bw + 2, bh + 2, T.ink); ui.rect(x0, y0, bw, bh, '#2a2430');
      for (let i = 0; i < bw; i += 6) ui.rect(x0 + i, y0 + ((i * 7) % 5 < 2 ? 2 : 6), 3, 1, '#3c3444');
      const gx = x0 + Math.round((S2.c - S2.good) * bw), gw = Math.round(S2.good * 2 * bw), px = x0 + Math.round((S2.c - S2.perf) * bw), pw = Math.round(S2.perf * 2 * bw);
      const pulse = 0.75 + 0.25 * Math.sin(S2.t * 9);
      g.globalAlpha = 0.85; ui.rect(gx, y0 + 1, gw, bh - 2, T.cyan2); g.globalAlpha = pulse; ui.rect(px, y0, pw, bh, T.cyanL); g.globalAlpha = 1;
      const mx = x0 + Math.round(k * bw);
      ui.rect(mx - 2, y0 - 4, 5, bh + 8, T.ink); ui.rect(mx - 1, y0 - 3, 3, bh + 6, live ? T.gold : S2.out === 2 ? T.gold : S2.out === 1 ? T.cyanL : T.dim);
      ui.text(live ? '[E] / tap' : S2.out === 2 ? 'PERFECT!' : S2.out === 1 ? 'GOOD!' : 'miss…', W / 2, y0 + bh + 4, live ? T.dim : S2.out === 2 ? T.amber2 : S2.out === 1 ? T.cyan2 : T.dim, { align: 'center', mini: !!live, bold: !live });
      if (live) {
        const hit = ui.key('e') || ui.key(' ') || ui.key('Enter') || ui.ptr.pressed;
        if ((hit && S2.t > 0.15) || S2.t > 4.2) {
          const d = Math.abs(pos() - S2.c); S2.mk = pos(); S2.out = hit ? (d < S2.perf ? 2 : d < S2.good ? 1 : 0) : 0; S2.ot = 0;
          ui.ptr.pressed = false; ui.keys = {};
          sfx(app, S2.out === 2 ? 'sparkle' : S2.out === 1 ? 'hit_light' : 'ui_tap', { vol: 0.7, pitch: S2.out === 2 ? 1.4 : 1 });
        }
      } else if ((S2.ot += dt) > 0.6) { const i = app.overlays.indexOf(draw); if (i >= 0) app.overlays.splice(i, 1); res(S2.out); }
    };
    app.overlays.push(draw);
  });
}
/** a heap of ore-flecked rubble: dig in — ore or a gem; about half the time, a Tokonmon that was asleep inside bursts out */
async function digPile(app, pl) {
  const R = CUR, w = app.world, me = w.player, L = w.life; if (!R || R.dug[pl.id]) return;
  R.dug[pl.id] = true;
  if (me) { me.path = null; me.faceTo(pl.x, pl.z); me.play('throw', { restart: true }); }
  sfx(app, 'hit_light', { vol: 0.5, pitch: 0.6 }); sfx(app, 'step_stone', { vol: 0.5, pitch: 0.7 }); w.burst('rock', [pl.x, pl.y + 0.5, pl.z], { n: 8 }); w.burst('dust', [pl.x, pl.y + 0.3, pl.z], { n: 10 });
  const m = pl.mesh, s0 = m ? m.scale.y : 1;
  if (m) await anim(420, (k) => { m.scale.y = s0 * (1 - 0.5 * k); });
  const fight = L && L.isCave && L.canFight && Math.random() < 0.5 && S.battleTeam(app.state, 3).length && R.t > (L.calm || 0) - 8;
  if (fight) {
    const sp = pl.x > 95 ? pickOne(['tumblock', 'geodig', 'stalagrin']) : pickOne(['geodig', 'geodig', 'tumblock', 'lumoth']), id = 'cv_dig_' + pl.id;
    const a = await w.addMon(id, sp, [pl.x, pl.z, me ? Math.atan2(me.g.position.x - pl.x, me.g.position.z - pl.z) : 0]).catch(() => null);
    if (a) {
      a.g.position.y = pl.y + 0.2; a.play('cry', { restart: true }); w.burst('rock', [pl.x, pl.y + 0.8, pl.z], { n: 14 });
      if (app.feel && app.feel.emote) app.feel.emote(a, '!', 1.1); sfx(app, 'alert'); if (app.cinema) app.cinema.shake(0.2);
      const nm = SPECIES[sp].name; await app.say('', `The rubble heaves — a wild ${nm} was napping in there, and it is NOT happy about it!`);
      const lv = Math.max(4, Math.min(48, topLevel(app) - 2 + Math.floor(Math.random() * 3)));
      const res = await app.startBattle({ foe: { name: 'Wild ' + nm, team: [[sp, lv]] }, wild: true, title: 'AMBUSH!', subtitle: nm + ' · The Deep Cave', arena: arenaNear(pl.x, pl.z, w.nav) });
      await app.fade(0, 400);
      if (L) L.calm = R.t + 20;
      w.burst('dust', [a.g.position.x, a.g.position.y + 0.3, a.g.position.z], { n: 10 }); w.remove(id);
      if (!res || res.winner === 0) { S.addItem(app.state, 'lumen_ore', 1); app.toast('It left behind: +1 Lumen Ore', { icon: 'star', color: T.cyan, dur: 2.2 }); oreForGus(app); }
      app.save(); return;
    }
  }
  const k = Math.random();
  if (k < 0.55) { S.addItem(app.state, 'lumen_ore', 1); sfx(app, 'sparkle'); app.toast('+1 Lumen Ore', { icon: 'star', color: T.cyan, dur: 2 }); oreForGus(app); }
  else if (k < 0.85) { const n = 1 + (Math.random() < 0.4 ? 1 : 0); S.addItem(app.state, 'quartz', n); sfx(app, 'sparkle'); app.toast(`+${n} Quartz Gem`, { icon: 'star', color: T.amber, dur: 2 }); }
  else app.toast('Just rocks. Lots of rocks.', { icon: 'eye', dur: 1.8 });
  if (me) me.play('idle', { fade: 0.2 });
  app.save();
}
async function openChest(app, box, key, items, line) {
  const s = CS(app); if (s[key]) return;
  sfx(app, 'door', { vol: 0.6, pitch: 0.7 });
  await anim(650, (k) => { box.lidMesh.rotation.x = -1.9 * (1 - (1 - k) ** 3); });
  app.world.burst('sparkle', [box.x, box.y + 0.7, box.z], { n: 14 });
  await loot(app, key, items, line);
}
async function strongbox(app) {
  const s = CS(app), cin = app.cinema, b = CUR && CUR.built.dyn.strongbox; if (s.treasure || !b) return;
  if (cin) { await cin.begin({ bars: true }); await cin.frame([b.x, b.y + 0.4, b.z], { dist: 2.8, pitch: 24, yaw: 220, dur: 0.6, focus: 0.15 }); }
  await app.say('', 'Wedged behind the giant glowcap, a crack you would never have noticed opens into a tiny grotto. On a shelf of rock: an iron-banded strongbox, the padlock rusted through.');
  sfx(app, 'slam', { vol: 0.4, pitch: 1.4 });
  await anim(800, (k) => { b.lidMesh.rotation.x = -1.9 * (1 - (1 - k) ** 3); });
  app.world.burst('sparkle', [b.x, b.y + 0.7, b.z], { n: 26 }); sfx(app, 'reward');
  await app.say('', 'Inside, wrapped in oilcloth: a flawless diamond, a twist of old-fashioned star candy, a roll of banknotes… and a note.', '"For whoever finds this: the miners of No. 3 never meant to wake it. If you go down to the old ring, go gently. — A. R., 1906"');
  S.addItem(app.state, 'diamond', 1); S.addItem(app.state, 'star_candy', 1); app.state.money = (app.state.money || 0) + 1200;
  s.treasure = true;
  app.toast('Hidden treasure!  +1 Diamond Gem  +1 Star Candy  +¥1200', { icon: 'coin', color: T.amber, dur: 3.4 });
  if (cin) await cin.end();
  app.save();
}
async function readJournal(app) {
  const s = CS(app); s.journal = true;
  await app.say('', 'A water-swollen notebook on the table, signed "A. Ruiz, foreman". Most of it is tallies of ore carts. The last pages are different.',
    '"March 2. The drill broke into a hollow nobody dug. A ring of carved stone down there, with steps, like a theatre. Older than the city. Older than anything."',
    '"March 19. Something sleeps in the old ring. Long as a streetcar, black as a stove, glowing like one. Our drill bit is stuck in its hide. When it breathes, the whole hill shakes."',
    '"April 1. Boarded the drift. Turned the mirror stones so the light can\'t reach the gate. Locked the rune door and took the key home. Let it sleep."');
  if (!s.boss) await app.say('', 'Mirror stones… the gate… the rune door. A. Ruiz. Ruiz — isn\'t that Old Gus\'s name?');
}
async function restBunk(app) {
  const w = app.world, me = w.player;
  await app.say('', 'You sit on the miners\' bunk for a while. Your lantern ticks as it cools; your team curls up against you.');
  S.healParty(app.state, 1); sfx(app, 'reward');
  app.toast('Team rested', { icon: 'heart', color: T.green }); if (me) me.play('idle');
  app.save();
}

// ==================================================================== the light puzzle: the sun crystal, two rose crystals, the gate
const TARGETS = [
  [[38.6, 39.8], [47.4, 27.4], 'm2', [33.8, 30.4]],          // the first rose crystal (by the south-west shore)
  [[66, 34.2], [56, 24.4], 'gate', 'm1'],                      // the second (by the gate's passage)
];
function beamPath(R) {
  const s = CS(R.app), M = R.built.dyn.mirrors, sun = R.built.dyn.sun, fy = R.built.floorAt, pts = [[sun[0], sun[1], sun[2]]];
  const P = (k) => [M[k].x, M[k].beamY, M[k].z];
  const at = (t) => (Array.isArray(t) ? [t[0], fy(t[0], t[1]) + 1.05, t[1]] : t === 'gate' ? [SPOT.gate[0], R.built.dyn.gate.y + 1.1, SPOT.gate[1]] : P(t === 'm1' ? 0 : 1));
  pts.push(P(0));
  const t1 = TARGETS[0][s.mirrors[0] % 4]; pts.push(at(t1));
  let solved = false, aim = [at(t1), null];
  if (t1 === 'm2') { const t2 = TARGETS[1][s.mirrors[1] % 4]; pts.push(at(t2)); aim[1] = at(t2); solved = t2 === 'gate'; }
  return { pts, solved, aim };
}
let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  GLOW = new THREE.CanvasTexture(c); GLOW.colorSpace = THREE.SRGBColorSpace; return GLOW;
}
function updateBeams(R, animate = true) {
  for (const b of R.beams) { b.removeFromParent(); if (b.geometry) b.geometry.dispose(); }
  R.beams = [];
  const { pts, aim } = beamPath(R), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]), d = b.clone().sub(a), L = d.length(); if (L < 0.05) continue;
    for (const [r, o, col] of [[0.03, 0.95, 0xfff4d0], [0.12, 0.22, 0xffd090]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
      m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(up, d.clone().normalize()); m.userData.o = o; m.userData.k = i; m.renderOrder = 8;
      R.root.add(m); R.beams.push(m);
    }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe0a0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0.9 }));
    sp.position.copy(b); sp.scale.setScalar(i === pts.length - 2 ? 1.1 : 0.7); sp.userData.o = 0.9; sp.userData.k = i + 3; R.root.add(sp); R.beams.push(sp);
  }
  // the rose crystals face where they send the light
  R.built.dyn.mirrors.forEach((m, k) => {
    const t = aim[k]; if (!t || !m.mesh) return;
    const yaw = Math.atan2(t[0] - m.x, t[2] - m.z);
    if (!animate) { m.mesh.rotation.y = yaw; return; }
    const y0 = m.mesh.rotation.y; let dy = yaw - y0; while (dy > PI) dy -= 2 * PI; while (dy < -PI) dy += 2 * PI;
    anim(500, (q) => { m.mesh.rotation.y = y0 + dy * (1 - (1 - q) ** 3); });
  });
}
async function turnMirror(app, k) {
  const s = CS(app), R = CUR; if (!R || s.gate) return;
  const m = R.built.dyn.mirrors[k], w = app.world, me = w.player;
  if (me) { me.faceTo(m.x, m.z); me.play('throw', { restart: true }); }
  s.mirrors = s.mirrors.slice(); s.mirrors[k] = (s.mirrors[k] + 1) % 4; questAt(app, 'deepcave', 2);
  sfx(app, 'slide_door', { vol: 0.5, pitch: 0.6 }); sfx(app, 'charge', { vol: 0.25, pitch: 1.6 });
  // ignore the stale aim of a crystal the light no longer reaches
  updateBeams(R, true);
  w.burst('sparkle', [m.x, m.beamY + 0.3, m.z], { n: 10 });
  await app.wait(560);
  if (me) me.play('idle', { fade: 0.2 });
  const { solved, pts } = beamPath(R);
  const hit = pts[pts.length - 1];
  if (!solved && k === 0 && s.mirrors[0] === 2) app.toast('The beam reaches the second rose crystal!', { icon: 'star', color: T.amber, dur: 2 });
  if (solved) await openGate(app);
  else if (Math.hypot(hit[0] - SPOT.gate[0], hit[2] - SPOT.gate[1]) > 1 && s.mirrors[k] === 0 && !s.hinted) { s.hinted = true; app.toast('Bounce the light into the crystal wall in the east passage', { icon: 'eye', dur: 3 }); }
  app.save();
}
async function openGate(app) {
  const s = CS(app), R = CUR, cin = app.cinema, w = app.world, g = R.built.dyn.gate; if (s.gate) return;
  s.gate = true;
  if (cin) { await cin.begin({ prefer: 270 }); await cin.cut(view([g.x, g.y + 1.8, g.z], 8, 255, 12)); cin.focus([g.x, g.y + 1.5, g.z], { band: 0.2 }); }
  // the light floods the crystal until it rings… and shatters
  sfx(app, 'charge', { vol: 0.6, pitch: 0.8 }); echo(app, 'furin', 0.5, 0.9);
  const mats = [], g0 = (app.stage.mood && app.stage.mood.glow) || 1, x0 = g.mesh.position.x; g.mesh.traverse((o) => { if (o.userData.part === 'glow') mats.push(o.material); });
  await anim(1600, (k) => { for (const m of mats) m.color.setScalar(g0 * (1 + k * 4)); g.mesh.position.x = x0 + Math.sin(k * 90) * 0.02 * k; });
  sfx(app, 'destroy_glass', { vol: 1 }); sfx(app, 'cryo', { vol: 0.7 }); echo(app, 'gong', 0.35, 1.4);
  if (cin) { cin.shake(0.45); cin.flash('#e8d0ff', 0.35); }
  g.mesh.visible = false; g.open();
  for (let i = -2; i <= 2; i++) w.burst('shard', [g.x + 0.381 * i * 0.9, g.y + 1.2 + Math.random(), g.z + 0.925 * i * 0.9], { n: 12 });
  w.burst('sparkle', [g.x, g.y + 1.6, g.z], { n: 40 });
  await app.wait(700);
  await app.say('', 'The light pours into the crystal wall until it rings like a struck bell — and it shatters into glittering dust.', 'Beyond, a passage runs east… toward the sound of falling water, very far below.');
  const Q = app.quests; if (Q && !Q.done('deepcave') && (Q.at('deepcave') ?? 0) < 3) Q.step('deepcave', 3);
  if (cin) await cin.end();
  app.save();
}

// ==================================================================== the cart: down the rails, through the barricade
function railFrame(sv) {
  const P = RAIL; let acc = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az);
    if (sv <= acc + L || i === P.length - 2) { const t = Math.max(0, Math.min(1, (sv - acc) / L)); return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, dx: (bx - ax) / L, dz: (bz - az) / L }; }
    acc += L;
  }
  return { x: P[0][0], z: P[0][1], dx: 0, dz: 1 };
}
function railLen() { let L = 0; for (let i = 0; i < RAIL.length - 1; i++) L += Math.hypot(RAIL[i + 1][0] - RAIL[i][0], RAIL[i + 1][1] - RAIL[i][1]); return L; }
function railProject(x, z) { let best = 0, bd = 1e9, acc = 0; for (let i = 0; i < RAIL.length - 1; i++) { const [ax, az] = RAIL[i], [bx, bz] = RAIL[i + 1], L = Math.hypot(bx - ax, bz - az), t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / (L * L))), d = Math.hypot(x - ax - (bx - ax) * t, z - az - (bz - az) * t); if (d < bd) { bd = d; best = acc + t * L; } acc += L; } return best; }
const cartStart = () => railProject(SPOT.cart[0], SPOT.cart[1]);
const cartEnd = () => railLen() - 1.25;
function placeCart(R, sv, tipped = false) {
  const m = R.built.dyn.cart.mesh; if (!m) return;
  const f = railFrame(sv), y = R.built.floorAt(f.x, f.z) + 0.04;
  m.position.set(f.x, y, f.z); m.rotation.set(0, Math.atan2(f.dx, f.dz), tipped ? 0.32 : 0);
  R.cartS = sv;
}
function unblockCartStart(R) {
  const nav = R.city.nav, [x, z] = SPOT.cart, fy = R.built.floorAt;
  nav.each(x - 0.9, z - 0.9, x + 0.9, z + 0.9, (c, cx, cz) => { if (Math.hypot(cx - x, cz - z) < 0.85) { nav.walk[0][c] = 1; nav.h[0][c] = fy(cx, cz); } });
}
async function pushCart(app) {
  const s = CS(app), R = CUR, cin = app.cinema, w = app.world, me = w.player; if (!R || s.cart || !me) return;
  const s0 = R.cartS ?? cartStart(), f0 = railFrame(s0), back = railFrame(s0 - 1.45);
  if (cin) await cin.begin({ prefer: 180 });
  if (cin) await cin.walk(me, back.x, back.z, { speed: 1.6 }); else me.place(back.x, back.z);
  me.faceTo(f0.x, f0.z);
  const cartPt = () => R.built.dyn.cart.mesh.position.clone().setY(R.built.dyn.cart.mesh.position.y + 0.8);
  if (cin) await cin.frame(cartPt, { dist: 4.6, yaw: 150, pitch: 16, dur: 0.7, focus: 0.18 });
  me.play('throw', { restart: true }); sfx(app, 'slam', { vol: 0.6, pitch: 1.2 }); w.burst('dust', [f0.x, R.built.floorAt(f0.x, f0.z) + 0.2, f0.z], { n: 8 });
  await app.say('', 'You kick the rotten chock out from under the wheels and put your shoulder to the cart. Iron groans against iron…');
  sfx(app, 'charge', { vol: 0.35, pitch: 0.5 });
  // it rolls: the camera chases it down the drift
  unblockCartStart(R);
  const roll = new Promise((res) => { R.cartAnim = { v: 0.5, end: cartEnd(), res, spark: 0, clack: 0 }; });
  me.walkTo([[f0.x - f0.dx * 0.3, f0.z - f0.dz * 0.3]], { speed: 0.9 });
  if (cin) cin.track(cartPt, { dist: 6.2, yaw: 175, pitch: 15, dur: 1.2, hold: 30 });
  await roll;
  // the crash
  const B = R.built.dyn.barricade;
  sfx(app, 'destroy_wood', { vol: 1 }); sfx(app, 'slam', { vol: 0.9, pitch: 0.7 }); echo(app, 'hit_heavy', 0.6, 0.6);
  if (cin) { cin.shake(0.7); cin.flash('#ffe8c8', 0.22); cin.punch(5); }
  B.mesh.visible = false; B.open();
  for (let i = 0; i < 9; i++) flyPlank(R, B.x + rnd(-1.5, 1.5), B.y + rnd(0.4, 2.2), B.z + rnd(-0.4, 0.4));
  w.burst('dust', [B.x, B.y + 0.8, B.z], { n: 40 }); w.burst('rock', [B.x, B.y + 1.4, B.z], { n: 16 });
  placeCart(R, cartEnd(), true);
  await app.wait(900);
  await app.say('', 'CRASH! The cart ploughs through the boards in a storm of splinters and dust.', 'Beyond, the drift tips steeply down — and the walls glow violet.');
  s.cart = true;
  const Q = app.quests; if (Q && !Q.done('deepcave') && (Q.at('deepcave') ?? 0) < 4) Q.step('deepcave', 4);
  if (cin) await cin.end();
  app.save();
}
function cartTick(R, dt) {
  const A = R.cartAnim; if (!A) return;
  const app = R.app, w = app.world;
  A.v = Math.min(7.5, A.v + 1.7 * dt); R.cartS += A.v * dt;
  placeCart(R, Math.min(R.cartS, A.end));
  const m = R.built.dyn.cart.mesh; m.rotation.z = Math.sin(R.t * 30) * 0.015 * A.v / 7;
  A.spark -= dt; if (A.spark < 0 && A.v > 2) { A.spark = 0.06; w.fx.emit('spark', _w.set(m.position.x, m.position.y + 0.12, m.position.z), { n: 1, scale: 0.5 }); }
  A.clack -= dt; if (A.clack < 0) { A.clack = Math.max(0.12, 0.9 / A.v); sfx(app, 'step_stone', { vol: 0.45, pitch: 0.5 + A.v * 0.06 }); }
  if (R.cartS >= A.end) { R.cartAnim = null; A.res(); }
}
function flyPlank(R, x, y, z) {
  const g = voxMesh('cv_board', R.app.stage.mats); g.scale.setScalar(rnd(0.5, 0.95));
  g.position.set(x, y, z); g.rotation.set(rnd(0, 6), rnd(0, 6), rnd(0, 6)); R.root.add(g);
  R.debris.push({ m: g, vx: rnd(-2.5, 2.5), vy: rnd(2, 5), vz: rnd(0.5, 4), sx: rnd(-6, 6), sz: rnd(-6, 6), life: 2.2 });
}
function debrisTick(R, dt) {
  const fy = R.built.floorAt;
  for (const d of R.debris) {
    if (d.life <= 0) continue; d.life -= dt;
    const m = d.m, g = fy(m.position.x, m.position.z) + 0.04;
    d.vy -= 9.8 * dt; m.position.x += d.vx * dt; m.position.y += d.vy * dt; m.position.z += d.vz * dt; m.rotation.x += d.sx * dt; m.rotation.z += d.sz * dt;
    if (m.position.y < g) { m.position.y = g; d.vy *= -0.25; d.vx *= 0.5; d.vz *= 0.5; d.sx *= 0.4; d.sz *= 0.4; if (Math.abs(d.vy) < 0.4) { d.life = 0; m.rotation.x = 0; m.rotation.z = 0; } }
  }
}

// ==================================================================== Old Gus and his Tumblock, Pebbles
async function gusTalk(app) {
  const s = CS(app), Q = app.quests, w = app.world, gus = w.actor('cv_gus'), me = w.player, n = oreInBag(app);
  const atCamp = !!gus && Math.hypot(gus.g.position.x - GUS_CAMP[0], gus.g.position.z - GUS_CAMP[1]) < 6;
  const act = (c) => { if (gus) gus.play(c, { restart: true }); };
  if (s.boss) {
    act('excited');
    if (!s.gusBoss) {
      s.gusBoss = true;
      await app.say('Old Gus', 'The hill\'s gone quiet. Forty-one years I\'ve listened to it grumble, and now… nothing. Just the drips.', 'You went into Granddad\'s ring and put the old one back to sleep. Pulled the bit out of its hide, didn\'t you? I can see it in your face.', 'Granddad would\'ve bought you a drink. I\'ll buy you a soda.');
      S.addItem(app.state, 'ramune', 3); sfx(app, 'reward'); app.toast('+3 Ramune', { icon: 'bag', color: T.amber, dur: 2.4 }); app.save();
      return;
    }
    return app.say('Old Gus', ...pickOne([['Pebbles wants to go and see the big one. I told him: not without a hat.'], ['Every miner in my family has a story about the thing under the hill. Now I\'ve got the only one with a happy ending.'], ['If you hear a snore like a landslide, that\'s not the hill. That\'s your new friend.']]));
  }
  // ---- first meeting: who he is, the rumbling, the errand
  if (!s.gus) {
    act('surprised');
    await app.say('Old Gus', 'Whoa there, sprout — mind the lamp! …Huh. You\'re not a Studrat. You\'re a whole person.', 'Name\'s Gus. Augustin Ruiz, if you\'re my mother. Forty-one years I\'ve been coming down here, and you\'re the first visitor without whiskers.');
    act('explain');
    await app.say('Old Gus', 'That rumbling? Something big, waking up deep under the hill. My granddad was foreman of this mine. He sealed the deepest door himself, in 1906. Left me the key — and a lot of bad dreams.', 'Tell you what. My knees don\'t do ledges anymore, but my eyes still love a bit of glow.');
    const ch = await app.choose('Old Gus squints at your lantern.', ['I\'m listening', 'What\'s so special about the glow?']);
    if (ch === 1) { act('excited'); await app.say('Old Gus', 'Lumen Ore, sprout! A chunk of it glows for a hundred years. My whole house is lit with it. Electric bill: zero. My neighbours think I\'m a wizard.'); }
    act('talk');
    await app.say('Old Gus', 'Chip me six pieces of Lumen Ore — the veins glowing blue in the walls. Hit the vein just as the glint crosses the bright seam — tink! — and you\'ll get more out of it. Granddad\'s trick.', atCamp ? 'Bring \'em here to the old camp, and Granddad\'s key is yours. Fair trade?' : 'Bring \'em to the old miners\' camp, past the chasm. I know a crawlway the young\'uns don\'t. Do that, and Granddad\'s key is yours. Fair trade?');
    s.gus = 1; if (Q) Q.start('gusore');
    if (n >= 6) { await app.say('Old Gus', '…Hold on. Is your bag GLOWING? You\'ve already got them, haven\'t you!'); return gusHandIn(app); }
    oreForGus(app);
    if (!atCamp) {
      await app.say('Old Gus', 'Pebbles! Up. We\'re taking the back way.');
      setTimeout(() => gusRelocate(app), 50);
    }
    app.save(); return;
  }
  // ---- the errand
  if (s.gus === 1) {
    if (n >= 6) return gusHandIn(app);
    act('sigh');
    return app.say('Old Gus', ...pickOne([[`Six pieces, sprout. You've got ${n}. The veins glow blue — you can't miss 'em. Well. You can. Everybody does.`], [`${n} of 6. Strike when the glint's on the bright seam — tink! — and the vein gives you more.`], [`${n} so far. Don't whistle while you dig, by the way. Miner's rule. Wakes things up.`]]));
  }
  // ---- after: the rune door, the arena
  act('explain');
  if (!s.door) return app.say('Old Gus', 'The rune door\'s down past the barricade the Company nailed across the drift. If the boards won\'t budge — that old ore cart still rolls. That\'s what I\'d do, if I were fifty years younger and twice as foolish.');
  return app.say('Old Gus', ...pickOne([['You opened it. Granddad\'s door. Well, I\'ll be.', 'Whatever\'s down there, be polite to it. Granddad always said it wasn\'t angry. Just tired of being woken up.'], ['Felt the heat coming up the drift? That\'s the ring. Take your strongest team, sprout.']]));
}
async function gusHandIn(app) {
  const s = CS(app), Q = app.quests, w = app.world, gus = w.actor('cv_gus');
  if (gus) gus.play('excited', { restart: true });
  await app.say('Old Gus', 'Well, look at that glow! Six beauties. That\'ll light my kitchen till I\'m a hundred and ten.');
  S.addItem(app.state, 'lumen_ore', -6);
  if (gus) { gus.play('explain', { restart: true }); w.fx.emit('sparkle', gus.headPos(), { n: 14 }); }
  await app.say('Old Gus', 'A deal\'s a deal. Granddad\'s key. Shaped like a flame — you\'ll see why.', 'The rune door\'s below the old drift, past the barricade. Whatever\'s down there, be polite to it. Granddad always said it wasn\'t angry. Just… tired of being woken up.');
  S.addItem(app.state, 'rune_key', 1); S.addItem(app.state, 'sapphire', 2); s.key = true; s.gus = 2;
  sfx(app, 'reward');
  app.toast('Got the Rune Key!  +2 Sapphire Gem', { icon: 'star', color: T.amber, dur: 3.2 });
  if (Q) { if (!Q.has('gusore')) Q.start('gusore'); Q.complete('gusore'); }
  app.save();
}
/** after the errand is given in the hall: Gus and Pebbles shuffle off into his adit, and wait at the camp from then on */
function gusRelocate(app) {
  const w = app.world, L = w.life, gus = w.actor('cv_gus'), peb = w.actor('cv_pebbles'); if (!gus || !L || !L.isCave) return;
  const [ax, az] = [45.9, 78.3];
  peb && peb.walkTo && peb.walkTo([[ax + 0.6, az + 0.4]], { speed: 1.6 });
  gus.walkTo([[ax + 0.3, az]], { speed: 1.1 }).then(() => {
    if (w.life !== L || L.disposed) return;
    w.burst('dust', [gus.g.position.x, gus.g.position.y + 0.3, gus.g.position.z], { n: 6 });
    const [x, z] = L.near(GUS_CAMP[0], GUS_CAMP[1]); gus.place(x, z, GUS_CAMP[2]); gus.play('idle', { fade: 0 });
    if (peb) { const [px, pz] = L.near(x + 0.7, z + 1.1); peb.path = null; peb.place(px, pz, 2); peb.play('sleep', { fade: 0 }); const r = peb.cave; if (r) { r.home = [px, pz]; r.awake = false; } }
  });
}
async function petPebbles(app, r) {
  const w = app.world, a = r.a, me = w.player; if (!a) return;
  if (me) { me.face(a); me.play('throw', { restart: true }); }
  a.face(me); a.play('win', { restart: true }); r.awake = true; r.wt = 0;
  if (app.feel && app.feel.emote) app.feel.emote(a, 'heart', 1.6); else w.emote('cv_pebbles', 'heart'); w.fx.emit('heart', a.headPos(), { n: 4 });
  sfx(app, 'coo', { vol: 0.4, pitch: 1.5 });
  await app.say('', pickOne([['Pebbles uncurls just enough to lean into your hand. Its plates are warm, like a stone left out in the sun.'], ['Pebbles rolls over for a belly rub. Its belly is also rock. It seems happy anyway.'], ['Pebbles purrs. It sounds exactly like a small rockslide.']]));
  if (me) me.play('idle', { fade: 0.2 });
}

// ==================================================================== the rune door
async function runeDoor(app) {
  const s = CS(app), R = CUR, cin = app.cinema, w = app.world, me = w.player, D = R && R.built.dyn.runeDoor; if (!R || !D || s.door) return;
  const key = s.key || ((app.state.bag || {}).rune_key || 0) > 0;
  if (!key) {
    await app.say('', 'A slab of carved stone seals the tunnel, taller than two people. Runes run round it in rings, and at the centre is a keyhole shaped like a flame.', 'Warm air seeps out round the edges. Somewhere far below, something breathes.');
    if (!s.gus) await app.say('', 'Scratched into the rock beside it, in a careful old hand: "Key\'s with the Ruiz family. Ask Gus. Bring ore."');
    else if (s.gus === 1) await app.say('', 'Old Gus has the key. Six pieces of Lumen Ore, and it\'s yours.');
    questAt(app, 'deepcave', 4);
    return;
  }
  const [nx, nz] = D.side || [0.67, -0.75], yawD = (Math.atan2(nx, nz) * 180) / PI;
  if (me) { me.path = null; me.faceTo(D.x, D.z); }
  if (cin) { await cin.begin({ prefer: yawD }); await cin.cut(view([D.x, D.y + 2.0, D.z], 8.5, yawD + 18, 9)); cin.focus([D.x, D.y + 2, D.z], { band: 0.22 }); }
  if (me) me.play('throw', { restart: true });
  sfx(app, 'door', { vol: 0.6, pitch: 0.5 });
  await app.say('', 'You fit Old Gus\'s flame-shaped key into the glyph at the centre of the door. It turns with a sound like a knuckle cracking.');
  // the rings of runes light from the keyhole outwards; the slab shudders and sinks into the floor
  const mats = [], g0 = (app.stage.mood && app.stage.mood.glow) || 1, m = D.mesh; m.traverse((o) => { if (o.userData.part === 'glow') mats.push(o.material); });
  sfx(app, 'charge', { vol: 0.5, pitch: 0.6 }); echo(app, 'gong', 0.3, 0.7);
  await anim(1100, (k) => { for (const q of mats) q.color.setScalar(g0 * (1 + k * 3)); });
  rumble(app, 0.3); if (cin) cin.shake(0.35, 2.6);
  sfx(app, 'slam', { vol: 0.5, pitch: 0.4 }); echo(app, 'thud', 0.5, 0.4);
  const y0 = m.position.y, x0 = m.position.x;
  const dust = setInterval(() => w.burst('dust', [D.x + rnd(-1.6, 1.6) * nz, D.y + 0.2, D.z - rnd(-1.6, 1.6) * nx], { n: 3 }), 120);
  await anim(2600, (k) => { const e = k * k * (3 - 2 * k); m.position.y = y0 - 4.3 * e; m.position.x = x0 + Math.sin(k * 140) * 0.015; for (const q of mats) q.color.setScalar(g0 * (4 - 2.5 * k)); });
  clearInterval(dust);
  m.visible = false; m.position.y = y0; D.open(); s.door = true;
  w.burst('dust', [D.x, D.y + 0.6, D.z], { n: 26 });
  await app.say('', 'The slab grinds down into the floor. Hot air rolls up out of the dark beyond — and, far below, a slow orange glow.');
  questAt(app, 'deepcave', 5);
  if (cin) await cin.end();
  app.save();
}

// ==================================================================== the Old Arena: braziers, runes, lava
function lightBrazier(R, k, quiet) {
  const b = R.built.dyn.braziers[k]; if (!b || b.lit) return; b.lit = true;
  const c = new THREE.Color(0xff8a34);
  R.app.stage.addLights([{ x: b.x, y: b.y + 0.7, z: b.z, r: 7.5, col: [c.r * 1.7, c.g * 1.7, c.b * 1.7], sh: 1.9, halo: 1.1 }]);
  R.built.heroes.push({ x: b.x, y: b.y + 0.6, z: b.z, col: 0xff8a30, i: 7, brazier: true });
  if (!R.flames) R.flames = [];
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff9a40, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0.85, fog: false }));
  sp.position.set(b.x, b.y + 0.35, b.z); sp.scale.setScalar(1.3); sp.renderOrder = 9; sp.userData.k = k; R.root.add(sp); R.flames.push(sp);
  if (!quiet) { const w = R.app.world; w.burst('fire', [b.x, b.y + 0.2, b.z], { n: 16, scale: 2.4 }); w.burst('ember', [b.x, b.y + 0.4, b.z], { n: 10 }); sfx(R.app, 'fire', { vol: 0.6, pitch: 0.8 + k * 0.08 }); }
}
function arenaTick(R, dt) {
  const b = R.built, w = R.app.world, me = w.player, t = R.t;
  // the lava creeps down the wall and round the pool
  const Lv = b.dyn.lava; if (Lv.mat && Lv.mat.map) { Lv.mat.map.offset.y = (Lv.mat.map.offset.y + dt * 0.12) % 1; Lv.mat.color.setScalar(1.45 + 0.15 * Math.sin(t * 1.7)); }
  // the rune circle: dark until the arena wakes, then a ring of fire; a slow ember glow once the guardian sleeps
  const ru = b.dyn.runes; if (ru.mat) { R.runeA = (R.runeA ?? 0) + ((R.runeK ?? 0) - (R.runeA ?? 0)) * (1 - Math.exp(-dt * 3)); ru.mat.emissiveIntensity = 0.05 + R.runeA * 2.8 * (0.88 + 0.12 * Math.sin(t * 2.3)); }
  // the braziers burn
  if (!R.flames || !me) return;
  const p = me.g.position, near = Math.hypot(p.x - SPOT.arena[0], p.z - SPOT.arena[1]) < 24 || (R.app.battle && R.app.battle.active);
  for (const sp of R.flames) { sp.visible = near; sp.material.opacity = 0.7 + 0.15 * Math.sin(t * 11 + sp.userData.k * 2) + (Math.random() - 0.5) * 0.1; sp.scale.setScalar(1.15 + 0.12 * Math.sin(t * 7 + sp.userData.k)); }
  if (!near) return;
  R.fireT = (R.fireT || 0) - dt; if (R.fireT > 0) return; R.fireT = 0.07;
  for (const br of b.dyn.braziers) if (br.lit) { w.fx.emit('fire', _w.set(br.x + rnd(-0.15, 0.15), br.y + 0.05, br.z + rnd(-0.15, 0.15)), { n: 1, scale: 2.3 }); if (Math.random() < 0.25) w.fx.emit('ember', _w.set(br.x, br.y + 0.3, br.z), { n: 1 }); }
}

// ==================================================================== the guardian: Magmander
const _ray = new THREE.Raycaster(), _q = new THREE.Vector3();
/** the arena's wall h metres up, in the direction of the guardian's crevice (a ray from the centre against the shell) */
function wallSpot(R, h) {
  const [cx, cz] = SPOT.arena, [bx, bz] = R.built.dyn.bossWall, fy = R.built.floorAt(cx, cz);
  const dx = bx - cx, dz = bz - cz, L = Math.hypot(dx, dz), nx = dx / L, nz = dz / L;
  const grp = R.root.getObjectByName('cv_geode') || R.root;
  _ray.set(_q.set(cx, fy + h, cz), _w.set(nx, 0, nz)); _ray.far = 30;
  let d = L + 0.6;
  try {
    const hit = _ray.intersectObject(grp, true).find((q) => q.distance > 3.5 && q.object.isMesh && !q.object.isInstancedMesh && q.object.material && q.object.material.map && String(q.object.material.map.userData.key || '').startsWith('cave_'));
    if (hit) d = hit.distance;
  } catch (e) { /* keep the estimate */ }
  return { x: cx + nx * d, z: cz + nz * d, y: fy + h, nx: -nx, nz: -nz, floor: R.built.floorAt(cx + nx * (d - 1), cz + nz * (d - 1)) };
}
/** up in its crevice: clinging head-down to the wall, belly to the rock, asleep */
function hideOnWall(R, a) {
  const W = R.wall || (R.wall = wallSpot(R, 5.6));
  a.path = null; a.g.rotation.order = 'YXZ'; a.yaw = a.targetYaw = Math.atan2(W.nx, W.nz); a.g.rotation.y = a.yaw; a.g.rotation.x = PI / 2;
  a.g.position.set(W.x + W.nx * 0.3, W.y, W.z + W.nz * 0.3); a.play('sleep', { fade: 0 }); R.bossState = 'wall';
}
/** down the wall: head first, then it swings its body off the rock and onto the floor */
async function crawlDown(R, a, ms = 3400) {
  const W = R.wall, y1 = W.floor, out0 = 0.3;
  a.play('crawl', { fade: 0.2 });
  const app = R.app, w = app.world; let lastStep = 0;
  await anim(ms, (k) => {
    const k1 = Math.min(1, k / 0.62), k2 = Math.max(0, (k - 0.62) / 0.38), e2 = k2 * k2 * (3 - 2 * k2);
    const y = (W.y + (y1 + 2.3 - W.y) * k1) * (1 - e2) + y1 * e2, out = out0 + 2.6 * e2;
    a.g.position.set(W.x + W.nx * out, y, W.z + W.nz * out); a.g.rotation.x = (PI / 2) * (1 - e2);
    if (k - lastStep > 0.08) { lastStep = k; w.burst('rock', [W.x + W.nx * 0.4 + rnd(-0.8, 0.8), y - 0.6, W.z + W.nz * 0.4], { n: 2 }); sfx(app, 'step_stone', { vol: 0.4, pitch: 0.45 }); }
  });
  a.g.rotation.x = 0; a.g.rotation.order = 'XYZ'; R.bossState = 'floor';
  sfx(app, 'slam', { vol: 0.9, pitch: 0.4 }); echo(app, 'thud', 0.6, 0.4); w.burst('dust', [a.g.position.x, y1 + 0.3, a.g.position.z], { n: 30 });
  if (app.cinema) app.cinema.shake(0.6, 2);
}
function bossTick(R) {
  const app = R.app, w = app.world, me = w.player, s = CS(app);
  if (s.boss || R.bossBusy || !R.boss || !me || !w.free || app.story.busy || app.ui.dialog || (app.battle && app.battle.active)) return;
  if ((R.retreat || 0) > R.t) return;
  const p = me.g.position; if (Math.hypot(p.x - SPOT.arena[0], p.z - SPOT.arena[1]) > 6.8) return;
  R.bossBusy = true;
  app.story.run(() => bossFight(app)).finally(() => { R.bossBusy = false; });
}
// two burning eyes, a halo round each of its glowing eye cubes
const EYE_L = [6.1 / 16, 3.3 / 16, 7.6 / 16];
function eyesOn(R, on) {
  if (!R.eyes) { R.eyes = [0, 1].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc860, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0, fog: false })); s.scale.setScalar(0.5); s.renderOrder = 9; R.root.add(s); return s; }); }
  R.eyesK = on ? 1 : 0;
}
function eyesTick(R, dt) {
  if (!R.eyes || !R.boss) return;
  const b = R.boss, hb = b.m && b.m.bones && b.m.bones.head;
  R.eyesA = (R.eyesA || 0) + ((R.eyesK || 0) - (R.eyesA || 0)) * (1 - Math.exp(-dt * 5));
  if (hb) hb.updateWorldMatrix(true, false);
  R.eyes.forEach((e, i) => {
    if (hb) e.position.set(EYE_L[0] * (i ? 1 : -1), EYE_L[1], EYE_L[2]).applyMatrix4(hb.matrixWorld); else b.headPos(e.position);
    e.material.opacity = R.eyesA * (0.8 + 0.2 * Math.sin(R.t * 9 + i)); e.scale.setScalar(0.5 + 0.6 * R.eyesA); e.visible = R.eyesA > 0.02;
  });
}
function bossLevel(app) { return Math.max(10, Math.min(60, topLevel(app) + 3)); }
async function bossFight(app) {
  const R = CUR, w = app.world, cin = app.cinema, me = w.player, s = CS(app), boss = R && R.boss; if (!R || !boss || !me || !cin) return;
  const [cx, cz] = SPOT.arena, ay = R.built.floorAt(cx, cz), first = !s.tries, W = R.wall || wallSpot(R, 5.6);
  const wallYaw = (Math.atan2(W.nx, W.nz) * 180) / PI;
  me.path = null; if (w.city) { w.city.vx = w.city.vz = 0; } me.play('idle', { fade: 0.2 });
  if (!S.battleTeam(app.state, 3).length) { await app.say('', 'Something up on the wall is breathing — slow and hot. Your Tokonmon are far too worn out to face it. Rest at the miners\' bunk first.'); R.retreat = R.t + 10; return; }
  s.tries = (s.tries || 0) + 1;
  await cin.begin({ prefer: wallYaw + 180 });
  cin.grade('tense');
  if (R.bossState === 'wall') {
    if (first) {
      // 1. the orbit: a ring of carved stone in the dark, older than the city
      R.flare = [0.55, 0.55, 0.55];
      await cin.cut(view([cx, ay + 2.4, cz], 16, wallYaw + 120, 24));
      cin.move((t) => view([cx, ay + 2.4 + t * 0.05, cz], 16 - t * 0.35, wallYaw + 120 + t * 16, 24 - t * 0.9), { dur: 0 });
      cin.place('The Old Arena', 'The deepest chamber', { wait: false });
      sfx(app, 'furin', { vol: 0.25, pitch: 0.5 });
      await app.say('', 'Stone steps ring the chamber like an old theatre, half fallen in. Broken columns. A circle of runes carved into the floor, and lava pouring down the far wall.', 'It is warm down here. Much too warm.');
    } else await cin.cut(view([cx, ay + 2.2, cz], 13, wallYaw + 140, 20));
    // 2. the braziers light, one after another round the ring
    for (let k = 0; k < R.built.dyn.braziers.length; k++) { lightBrazier(R, k); R.flare = R.flare.map((f) => Math.min(1.6, f + 0.18)); await app.wait(first ? 380 : 160); }
    s.braziers = true;
    // 3. the runes ignite; the hill rumbles; stones fall
    R.runeK = 1; sfx(app, 'charge', { vol: 0.6, pitch: 0.5 }); sfx(app, 'pyro', { vol: 0.5, pitch: 0.7 }); cin.flash('#ff9040', 0.22, 0.4);
    rumble(app, 0.45); cin.shake(0.4, 2.4);
    for (let i = 0; i < 7; i++) setTimeout(() => { const a = Math.random() * PI * 2, r = 2 + Math.random() * 5; w.burst('rock', [cx + Math.cos(a) * r, ay + 7, cz + Math.sin(a) * r], { n: 4 }); w.burst('dust', [cx + Math.cos(a) * r, ay + 0.3, cz + Math.sin(a) * r], { n: 6 }); }, i * 170);
    R.flare = [2.0, 2.0, 2.0];
    await cin.cut(view([cx, ay + 0.6, cz], 9, wallYaw + 175, 30));
    cin.move((t) => view([cx, ay + 0.6, cz], 9 - t * 0.5, wallYaw + 175 + t * 10, 30 - t * 2), { dur: 0 });
    await app.wait(first ? 1500 : 700);
    // 4. high on the wall, two eyes open
    const mid = () => boss.g.position.clone().addScaledVector(_w.set(W.nx, 0, W.nz), 0.8).setY(boss.g.position.y - 0.6);
    await cin.frame(mid, { dist: 8.5, yaw: wallYaw + 22, pitch: -4, dur: first ? 1.0 : 0.6, focus: 0.15 });
    await app.wait(500);
    boss.play('idle', { fade: 0.4 }); eyesOn(R, true); sfx(app, 'charge', { vol: 0.6, pitch: 0.55 }); cin.flash('#ffb060', 0.25, 0.5);
    if (first) await app.say('', 'What you took for a seam of magma in the wall opens two burning eyes.');
    // 5. it crawls down the wall
    cin.track(boss, { dist: 10, yaw: wallYaw + 28, pitch: 8, dur: 0.8, hold: 30 });
    await crawlDown(R, boss, first ? 3600 : 2400);
  } else {
    await cin.cut(view([cx, ay + 2, cz], 12, wallYaw + 160, 18));
    eyesOn(R, true);
  }
  // 6. it rises and roars
  R.flare = [1.6, 1.6, 1.6];
  boss.face(me); boss.play('cry', { restart: true }); sfx(app, 'beast_roar', { vol: 0.95, pitch: 0.42 }); echo(app, 'beast_roar', 0.35, 0.4);
  cin.shake(0.65, 2.4); w.burst('ember', [boss.g.position.x, boss.g.position.y + 1.6, boss.g.position.z], { n: 30 });
  await cin.hero(boss, { low: -14, dist: 11, dur: 0.8 });
  if (first) cin.nameCard('MAGMANDER', 'Guardian of the Old Arena', { side: 'right' });
  await app.say('', first ? 'A salamander the size of a cable car: cracked black rock with magma glowing in every seam, a crown of gills fanned out like flames. Its tail sweeps the steps. Its eyes find your lantern.' : 'Magmander is awake again, every seam blazing. It remembers you.');
  const pt = w.partner; if (pt) { pt.face(boss); pt.play(pt.anim.clips.cry ? 'cry' : 'idle', { restart: true }); }
  const ch = await app.choose('The arena\'s runes blaze. Magmander opens its jaws.', ['Battle!', 'Back away slowly']);
  if (ch === 1) {
    await app.say('', 'You back away, step by careful step. The heat follows you up the tunnel.');
    eyesOn(R, false); R.flare = [1, 1, 1]; boss.play('idle', { fade: 0.6 });
    const [ix, iz] = SPOT.arenaIn; me.place(ix, iz, 0.7); if (w.city) w.city.placed(); if (w.partner) w.partner.place(ix + 0.8, iz - 0.6, 0.7);
    R.retreat = R.t + 9; await cin.end({ dur: 0.6 }); return;
  }
  // ---- the battle
  cin.flash('#ffffff', 0.25); await cin.end({ release: false });
  const res = await app.startBattle({ foe: { name: 'Magmander', team: [['magmander', bossLevel(app)]] }, title: 'MAGMANDER', subtitle: 'Guardian of the Old Arena', canLose: true, partySize: 3, music: 'boss', money: 500, arena: { at: [cx, cz], r: 5.2, cam: { dist: 11, yaw: wallYaw + 180, pitch: 22 } } });
  await cin.begin({ prefer: wallYaw + 180 });
  await app.fade(0, 400);
  const won = !res || res.winner === 0;
  if (!won) {
    boss.play('win', { restart: true }); sfx(app, 'beast_roar', { vol: 0.6, pitch: 0.5 });
    await cin.hero(boss, { low: -10, dist: 11 });
    await app.say('', 'Magmander\'s roar fills the ring with heat and light — and the next thing you know, you\'re sitting at the top of the tunnel, blinking, your team piled around you.');
    await app.fade(1, 500);
    eyesOn(R, false); R.flare = [1, 1, 1]; boss.play('idle', { fade: 0 }); S.healParty(app.state, 1);
    const [ix, iz] = SPOT.arenaIn; me.place(ix, iz, 0.7); if (w.city) w.city.placed(); if (w.partner) w.partner.place(ix + 0.8, iz - 0.6, 0.7);
    R.retreat = R.t + 12; await cin.end({ dur: 0 }); await app.fade(0, 600);
    app.toast('Rest, then try again — Magmander is waiting', { icon: 'heart', dur: 3 });
    app.save(); return;
  }
  // ---- won: the story beat
  boss.play('down', { restart: true }); sfx(app, 'thud', { vol: 0.6, pitch: 0.4 });
  R.flare = [1.3, 1.3, 1.3]; R.runeK = 0.6;
  await cin.two(me, boss, { dist: 10 });
  await app.say('', 'Magmander sinks onto the warm stone, its seams dimming to embers. And up close, now, you see it:', 'Jammed between two scutes behind its gills, grinding every time it breathes — the rusted bit of an old mining drill, stamped "No. 3".');
  const c2 = await app.choose('The drill bit grinds as Magmander breathes.', ['Pull it out', 'Keep your distance']);
  if (c2 === 1) await app.say('', 'You hesitate… but it looks so tired. You can\'t leave it like that.');
  const bx = boss.g.position.x, bz = boss.g.position.z, dir = Math.atan2(me.g.position.x - bx, me.g.position.z - bz);
  await cin.walk(me, bx + Math.sin(dir) * 2.6, bz + Math.cos(dir) * 2.6, { speed: 1.2 });
  me.face(boss);
  await cin.close(me, { yaw: (dir * 180) / PI + 120, dist: 3.4 });
  me.play('throw', { restart: true }); await app.wait(500);
  sfx(app, 'destroy_metal', { vol: 0.8 }); cin.shake(0.3); cin.flash('#ffffff', 0.2);
  const hp = boss.headPos(_q); w.burst('spark', [hp.x, hp.y + 0.3, hp.z], { n: 14 }); w.burst('ember', [hp.x, hp.y + 0.4, hp.z], { n: 30 });
  eyesOn(R, false); R.flare = [1.1, 1.1, 1.1];
  boss.play('win', { restart: true });
  await cin.orbit(boss, { deg: 40, time: 6, dist: 12, pitch: 14 });
  await app.say('', 'The bit comes free with a shriek of iron. Magmander lets out a long, low breath — warm as a summer wind — and the whole hill seems to sigh with it.', 'The rumbling stops.');
  // the ember scale
  sfx(app, 'reward'); w.burst('sparkle', [me.g.position.x, me.g.position.y + 1.5, me.g.position.z], { n: 20 });
  S.addItem(app.state, 'ember_scale', 1); S.addItem(app.state, 'ruby', 2); app.state.money = (app.state.money || 0) + 1500;
  await app.say('', 'Magmander nudges something across the stone to your feet with its snout: a scale of black glass with magma still glowing in its cracks. It\'s warm in your hand. It stays warm.');
  app.toast('Got the Ember Scale!  +2 Ruby Gem  +¥1500', { icon: 'star', color: T.amber, dur: 3.6 });
  // and it opens the way home
  const [rx, rz] = SPOT.rubble;
  await cin.track(boss, { dist: 10, yaw: 160, pitch: 14, dur: 0.8 });
  await cin.walk(boss, 76.6, 81.6, { speed: 1.5 });
  boss.face({ g: { position: new THREE.Vector3(rx, 0, rz) } });
  await cin.frame([rx + 2, R.built.floorAt(rx, rz) + 1.4, rz], { dist: 9, yaw: 120, pitch: 12, dur: 0.6 });
  boss.play('attack', { restart: true }); await app.wait(420);
  sfx(app, 'slam', { vol: 1, pitch: 0.5 }); echo(app, 'thud', 0.7, 0.4); cin.shake(0.8); cin.flash('#ffffff', 0.18);
  const D = R.built.dyn.rubble; D.mesh.visible = false; D.open();
  w.burst('rock', [rx, D.y + 1.2, rz], { n: 24 }); w.burst('dust', [rx, D.y + 0.8, rz], { n: 40 });
  await app.wait(800);
  await app.say('', 'One flick of that enormous tail and the fallen rock bursts apart. Cool air pours in from the other side: a passage straight back up to the Entrance Hall.');
  await cin.walk(boss, SPOT.bossRest[0], SPOT.bossRest[1], { speed: 1.3 });
  boss.face(me); boss.play('sleep', { fade: 0.8 });
  s.boss = true; R.flare = [1, 1, 1]; R.runeK = 0.35;
  const Q = app.quests; if (Q) { if (!Q.has('deepcave') && !Q.done('deepcave')) Q.start('deepcave'); Q.complete('deepcave'); }
  await cin.end({ dur: 1.2 });
  app.save();
}
async function calmVisit(app) {
  const w = app.world, b = w.actor('cv_boss'), me = w.player;
  if (b && me) me.face(b);
  await app.say('', pickOne([['Magmander is curled round the lava pool, snoring like a distant landslide. The braziers crackle; the runes glow a slow, sleepy orange.', 'You sit against its warm side for a while. Your team dozes off too.'], ['One huge eye opens a crack, glints at your lantern… and closes again. A puff of warm air ruffles your hair.']]));
  S.healParty(app.state, 1); app.toast('Team rested', { icon: 'heart', color: T.green }); app.save();
}
