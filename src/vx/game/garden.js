// The cabbage event (Sunset Row community garden). Every cabbage in the garden rows is interactable:
// "Pull up the cabbage" — the player heaves it out of the soil, it pops free and lifts overhead, +1 Garden Cabbage.
//
// The first cabbage ever is free (nobody saw… probably). The SECOND one brings Farmer Aldo bursting out of the
// tool shed, and behind him — squeezing out of a door far too small for it — his partner Kohlossus, a giant,
// very angry cabbage Tokonmon. He challenges you to a battle:
//  - win: he grudgingly lets you keep the cabbage and explains how the garden works (+ a little prize money);
//  - lose: you're marched home and the cabbage is confiscated (and replanted).
// After that it can happen again, but at most once per in-game day: the first cabbage you pull on a new day
// brings him straight out ("AGAIN?!"); once the day's showdown is over he guards the rows himself.
// Pulled cabbages stay gone until the next day. State: app.state.flags.gd.
//
// Hooked from the district (src/vx/city/districts/home/street.js): registerCabbages(C, cabs) adds the
// interactables and the updater that hides pulled cabbages and stages the farmer and Kohlossus.
import * as THREE from '../../../vendor/three.module.js';
import { treeGeo } from '../city/props_trees.js';
import '../city/props_garden.js';

export const SHED_DOOR = [97.35, 176.6];          // just outside the tool shed's west door
export const FARMER_SPOT = [96.6, 175.2, -Math.PI / 2];
export const KOHL_SPOT = [93.9, 178.5, -2.6];
const ARENA = { at: [92.1, 161.0], r: 6 };          // Sunset Row itself: the garden is too full of vegetables to fight in

const sfx = (app, n, o) => { if (app.audio && app.audio.sfx) app.audio.sfx(n, o); };
const day = (app) => (app.state && app.state.time && app.state.time.day) || 1;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function G(app) { const s = app.state || (app.state = {}); const f = s.flags || (s.flags = {}); return f.gd || (f.gd = { met: false, free: 0, pulled: {}, wins: 0, losses: 0 }); }
const anim = (ms, fn) => new Promise((res) => {
  const t0 = performance.now(), raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f) => setTimeout(() => f(performance.now()), 16);
  const step = (now) => { const k = Math.min(1, (now - t0) / ms); fn(k); if (k < 1) raf(step); else res(); };
  raf(step);
});

// ---------------------------------------------------------------- the cabbages themselves (instanced props)
let INST = null, INST_ROOT = null, CABS = [];   // cabbage index → { im, i, m } (rebuilt when the city is rebuilt)
function instances(app, cabs = CABS) {
  const city = app.world && app.world.sc && app.world.sc.city; if (!city) return null;
  if (INST && INST.size && INST_ROOT === city.root) return INST;
  INST = new Map(); INST_ROOT = city.root;
  const ims = []; city.root.traverse((o) => { if (o.isInstancedMesh && o.userData && o.userData.prop === 'gd_cabbage') ims.push(o); });
  const m = new THREE.Matrix4();
  for (const im of ims) for (let i = 0; i < im.count; i++) {
    im.getMatrixAt(i, m); const x = m.elements[12], z = m.elements[14];
    const k = cabs.findIndex((c) => Math.abs(c.x - x) < 0.05 && Math.abs(c.z - z) < 0.05);
    if (k >= 0) INST.set(k, { im, i, m: m.clone(), shown: true });
  }
  return INST;
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function show(app, cabs, k, on) {
  const I = instances(app, cabs || CABS), e = I && I.get(k); if (!e || e.shown === on) return;
  e.shown = on; e.im.setMatrixAt(e.i, on ? e.m : ZERO); e.im.instanceMatrix.needsUpdate = true;
}
const pulledToday = (app, k) => G(app).pulled[k] === day(app);

// ---------------------------------------------------------------- staging: the farmer by his shed, Kohlossus on guard
function farmerActor(app) { return app.world && app.world.actor('gd_farmer'); }
async function ensureKohl(app) {
  const w = app.world; let a = w.actor('gd_kohl');
  if (!a) { a = await w.addMon('gd_kohl', 'kohlossus', [KOHL_SPOT[0], KOHL_SPOT[1], KOHL_SPOT[2]], { clip: 'idle' }); a.speed = 1.4; }
  return a;
}
let staging = false;
function stage(app) {
  const w = app.world, g = G(app), me = w && w.player; if (!me || !w.city) return;
  const far = Math.hypot(me.g.position.x - 94, me.g.position.z - 174) > 45;
  const f = farmerActor(app);
  if (f && !app.story.busy) {
    if (!g.met) { f.g.visible = false; f.place(99.6, 176.6, -Math.PI / 2); }      // in the shed (unmet)
    else f.g.visible = true;
  }
  const k = w.actor('gd_kohl');
  if (g.met && !far && !k && !staging && !app.story.busy) { staging = true; ensureKohl(app).catch(() => {}).finally(() => { staging = false; }); }
  else if (k && far && !app.story.busy) w.remove('gd_kohl');
}

/**
 * Called by the district: cabs = [{ x, z, y }] (the gd_cabbage props). Adds one interactable per cabbage, the
 * farmer's talk lines, and the per-frame staging. Returns the cabs (with interactables) for reference.
 */
export function registerCabbages(C, cabs) {
  CABS = cabs; INST = null;
  cabs.forEach((c, k) => C.interact({ x: c.x, z: c.z, r: 0.75, y: c.y + 0.7, label: 'Pull up the cabbage', icon: 'leaf', when: (app) => !pulledToday(app, k), act: (app) => pull(app, cabs, k) }));
  let t = 0;
  C.updaters.push((dt) => {
    t += dt; if (t < 0.25) return; t = 0;
    const app = globalThis.__app; if (!app || !app.world || !app.world.city) return;
    for (let k = 0; k < cabs.length; k++) show(app, cabs, k, !pulledToday(app, k));
    stage(app);
  });
  return cabs;
}
/** the farmer's lines when you talk to him (after you've met) */
export async function farmerTalk(app) {
  const g = G(app), d = day(app);
  if (g.won === d) return app.say('Farmer Aldo', pick([['You again. ONE cabbage, I said. Kohlossus is counting.'], ['Cabbages like cool mornings and lots of water. Unlike Kohlossus, who likes warm afternoons and lots of cabbage.'], ['Plant marigolds next to your cabbages. Keeps the leaf-munchers away. Mostly.']]));
  if (g.lost === d) return app.say('Farmer Aldo', 'Back again? The cabbages are counted, kid. Come back tomorrow — if you dare.');
  return app.say('Farmer Aldo', pick([['Morning. These are community rows — you plant, you water, you share. You do NOT just yank.'], ['Kohlossus has guarded this garden since it was the size of a sprout. Now look at it.'], ['Want a cabbage? Earn it. Or pull one and see what happens. I dare you.']]));
}

// ---------------------------------------------------------------- pulling a cabbage
async function pull(app, cabs, k) {
  const w = app.world, me = w.player, c = cabs[k], g = G(app), d = day(app);
  if (!me) return;
  // the day's showdown is over: he guards the rows himself
  if (g.met && g.day === d) {
    const f = farmerActor(app), kk = w.actor('gd_kohl');
    if (kk) { kk.face(me); kk.play('stomp', { restart: true }); }
    sfx(app, 'slam', { vol: 0.6 });
    if (f) { f.face(me); f.play('angry', { restart: true }); }
    await app.say('Farmer Aldo', g.won === d ? 'Ah-ah-AH. One a day. Don\'t push your luck, sprout.' : 'NOT today. Kohlossus remembers your face.');
    return;
  }
  await heave(app, c, k);
  if (!g.met && (g.free || 0) < 1) {
    g.free = (g.free || 0) + 1;
    await app.say('', 'POP! A perfect cabbage — heavy, cold and squeaky-crisp. You look around.', 'Nobody saw. …Probably.');
    if (app.save) app.save();
    return;
  }
  await showdown(app, c, k);
}

/** the pull: face the cabbage, reach, heave, POP — it lifts overhead and goes into the bag */
async function heave(app, c, k) {
  const w = app.world, me = w.player, st = w.st, g = G(app);
  me.path = null; me.faceTo(c.x, c.z);
  me.play('point', { restart: true }); sfx(app, 'cloth', { vol: 0.5 });
  await app.wait(350);
  me.play('throw', { restart: true });
  // a free-standing cabbage that leaves the row and rises into the player's hands
  const mesh = new THREE.Mesh(treeGeo('gd_cabbage'), st.mats.solid); mesh.castShadow = true;
  mesh.position.set(c.x, c.y, c.z); st.scene.add(mesh);
  g.pulled[k] = day(app); show(app, null, k, false);
  if (app.state && app.state.bag) app.state.bag.cabbage = (app.state.bag.cabbage || 0) + 1;
  w.burst('dust', [c.x, c.y + 0.1, c.z], { n: 10 });
  // the struggle: it wobbles and resists…
  await anim(520, (t) => { mesh.position.y = c.y + Math.max(0, Math.sin(t * Math.PI * 3)) * 0.04; mesh.rotation.z = Math.sin(t * 40) * 0.08 * t; });
  sfx(app, 'plop', { pitch: 1.8 }); sfx(app, 'boing', { vol: 0.4, pitch: 1.4 });
  w.burst('dust', [c.x, c.y + 0.1, c.z], { n: 14 }); w.burst('leaf', [c.x, c.y + 0.3, c.z], { n: 8 });
  me.play('cheer', { restart: true }); if (me.anim && me.anim.face) me.anim.face('happy', 2);
  const p = me.g.position, fx = Math.sin(me.yaw), fz = Math.cos(me.yaw), x0 = mesh.position.x, z0 = mesh.position.z;
  await anim(650, (t) => { const e = 1 - (1 - t) ** 3; mesh.position.set(x0 + (p.x + fx * 0.15 - x0) * e, c.y + (p.y + 2.0 - c.y) * e + Math.sin(t * Math.PI) * 0.4, z0 + (p.z + fz * 0.15 - z0) * e); mesh.rotation.y = t * 6; mesh.rotation.z = 0; });
  w.burst('sparkle', [p.x, p.y + 2.2, p.z], { n: 10 }); sfx(app, 'reward');
  app.toast('+1 Garden Cabbage', { icon: 'leaf' });
  await app.wait(500);
  await anim(260, (t) => { mesh.scale.setScalar(1 - t); mesh.position.y -= 0.02; });
  st.scene.remove(mesh);
  me.play('idle', { fade: 0.2 });
}

// ---------------------------------------------------------------- the showdown
async function showdown(app, c, k) {
  const w = app.world, me = w.player, g = G(app), d = day(app), again = g.met, cin = app.cinema;
  const f = farmerActor(app) || w.addPerson('gd_farmer', FARMER, [99.6, 176.6, -Math.PI / 2]);
  const partner = w.partner;
  const say = (n, ...l) => (cin ? cin.talk(f, me, n, ...l) : app.say(n, ...l));
  if (cin) await cin.begin({ prefer: 150 });
  // BANG — the shed door
  sfx(app, 'door', { vol: 1, pitch: 0.7 }); sfx(app, 'slam', { vol: 0.6 });
  if (cin) cin.shake(0.25);
  f.g.visible = true; f.place(SHED_DOOR[0], SHED_DOOR[1], -Math.PI / 2); f.play('angry', { restart: true });
  w.emote('gd_farmer', 'anger', 2);
  if (cin) await cin.push(f); else await w.closeOn(f, { dist: 3 });
  await app.say('Farmer Aldo', again ? pick(['AGAIN?! I can SEE you from the shed window, you know!', 'Every. Single. Day. Do you have a cabbage problem?!']) : 'HEY!! YOU! Put down MY cabbage!');
  // he runs at you, still shouting
  const tx = me.g.position.x + 1.8 * Math.sign(SHED_DOOR[0] - me.g.position.x || 1), tz = me.g.position.z;
  if (cin) { cin.track(f, { yaw: 120, dist: 6, pitch: 10 }); await cin.walk(f, tx, tz, { speed: 3.4, clip: 'run' }); }
  else await f.walkTo([[tx, tz]], { speed: 3.4, clip: 'run' });
  f.face(me); me.face(f); f.play('angry', { restart: true });
  if (partner) { partner.face(f); partner.play && partner.anim.clips.hurt && partner.play('hurt', { restart: true }); }
  await say('Farmer Aldo', again ? 'Don\'t you "good morning" me!' : 'Thirty years I\'ve grown cabbages in these rows. Thirty years! And YOU think you can just —', { clip: 'angry' });
  // a rumble from the shed: the door frame creaks, and Kohlossus squeezes out of a door far too small for it
  sfx(app, 'beast_roar', { vol: 0.8, pitch: 0.7 }); if (cin) cin.shake(0.35);
  await app.wait(400);
  const kohl = await ensureKohl(app);
  const s0 = kohl.m.scale || 1;
  kohl.place(SHED_DOOR[0] - 0.3, SHED_DOOR[1], -Math.PI / 2); kohl.g.scale.set(0.55 * s0, s0, 0.55 * s0); kohl.play('walk');
  await anim(700, (t) => { const k = 0.55 + 0.45 * t; kohl.g.scale.set(k * s0, s0, k * s0); });   // pop! out of the doorway
  kohl.g.scale.setScalar(s0); sfx(app, 'boing', { pitch: 0.5 }); w.burst('leaf', [SHED_DOOR[0] - 0.4, 1.8, SHED_DOOR[1]], { n: 14 });
  const kx = f.g.position.x + 1.6, kz = f.g.position.z + 1.4;
  if (cin) { cin.track(kohl, { yaw: 150, dist: 9, pitch: 6 }); await cin.walk(kohl, kx, kz, { speed: 2.2 }); }
  else await kohl.walkTo([[kx, kz]], { speed: 2.2 });
  kohl.face(me); kohl.play('stomp', { restart: true });
  await app.wait(700); sfx(app, 'slam'); if (cin) { cin.shake(0.6); cin.flash('#ffffff', 0.15); }
  w.burst('dust', [kohl.g.position.x, kohl.g.position.y + 0.1, kohl.g.position.z], { n: 24 });
  if (cin) await cin.hero(kohl, { low: -18, dist: 7.5, dur: 0.6 }); else await w.closeOn(kohl, { dist: 7, h: 1.6 });
  kohl.play('angry', { restart: true }); sfx(app, 'beast_roar');
  if (!again) await app.say('', 'A Tokonmon the size of a car: round, rabbit-shaped and, somehow, mostly cabbage. It is breathing very heavily through its nose.');
  await say('Farmer Aldo', again ? 'Kohlossus. You know what to do.' : 'This is Kohlossus. Garden guardian. Nine hundred cabbages eaten, zero stolen.', again ? 'Same rules as always, sprout. Win and keep it. Lose and you\'re going home with an empty bag.' : 'You want that cabbage? Get through HIM. Win, and it\'s yours. Lose, and I\'m marching you home to your mother.');
  g.met = true; g.day = d;
  const party = (app.state && app.state.party) || [];
  if (!party.some((m) => m.hp > 0)) {
    await say('Farmer Aldo', 'No Tokonmon fit to fight? Then hand it over. Off you go.');
    return confiscate(app, k, cin);
  }
  const ch = await app.choose(again ? 'Kohlossus stomps. Fight for the cabbage?' : 'Kohlossus stomps the ground. The farmer cracks his knuckles.', ['Battle!', 'Say sorry']);
  if (ch === 1) { await say('Farmer Aldo', 'Sorry?! SORRY doesn\'t regrow a cabbage! Kohlossus — belly flop position!'); kohl.play('cry', { restart: true }); await app.wait(900); }
  // ---- the battle (on Sunset Row: the garden is too full of vegetables)
  if (cin) { cin.flash('#ffffff', 0.25); await cin.end({ release: false }); }
  const lv = Math.max(5, Math.min(40, Math.round(party.reduce((a, m) => Math.max(a, m.level || 5), 5)) + (again ? 1 : 0)));
  const res = await app.startBattle({ foe: { name: 'Farmer Aldo', team: [['kohlossus', lv]] }, title: 'FARMER ALDO', subtitle: 'Garden guardian · Kohlossus', canLose: true, partySize: 3, money: 120, arena: ARENA });
  if (cin) await cin.begin({ prefer: 150 });
  if (app.fade) await app.fade(0, 400);
  const won = !res || res.winner === 0;
  f.face(me); kohl.face(me);
  if (won) {
    g.wins = (g.wins || 0) + 1; g.won = d;
    kohl.play('hurt', { restart: true }); f.play('shock', { restart: true });
    if (cin) await cin.two(f, me); else await w.closeOn(f, { dist: 3.5 });
    await say('Farmer Aldo', g.wins === 1 ? 'Hmph. …HMPH. Kohlossus hasn\'t lost since the Great Zucchini Incident.' : 'Again?! Hmph. You\'re getting good at this.');
    f.play('think', { restart: true });
    await say('Farmer Aldo', 'Fine. Keep the cabbage. You earned it.', ...(g.wins === 1 ? [
      'But listen, because I\'m only saying it once: these are COMMUNITY rows. Neighbours plant them, neighbours water them, neighbours share them.',
      'Cabbages want cool mornings and deep water. Marigolds between the rows keep the leaf-munching Tokonmon away. And carrots and lettuces? They like company.',
      'Pull one when it\'s firm and heavy, never when it\'s soft. And next time — ASK. One a day. Kohlossus will be counting.',
    ] : ['One a day, mind. Kohlossus is counting.']), { clip: 'explain' });
    kohl.play('munch', { restart: true });
    app.toast('Farmer Aldo lets you keep the cabbage', { icon: 'leaf' });
  } else {
    g.losses = (g.losses || 0) + 1; g.lost = d;
    kohl.play('win', { restart: true }); f.play('laugh', { restart: true });
    await say('Farmer Aldo', pick(['HA! That\'s what thirty years of compost gets you!', 'Good try, sprout. Not good enough.']), 'I\'ll take THAT. And you — home. March.');
    return confiscate(app, k, cin);
  }
  if (cin) await cin.end();
  f.play('idle'); kohl.play('idle');
  if (app.save) app.save();
}
/** lose: the cabbage goes back in the row, you get walked home */
async function confiscate(app, k, cin) {
  const w = app.world, g = G(app), me = w.player;
  if (app.state && app.state.bag && app.state.bag.cabbage) { app.state.bag.cabbage -= 1; if (app.state.bag.cabbage <= 0) delete app.state.bag.cabbage; }
  delete g.pulled[k]; g.lost = day(app); g.day = day(app);
  app.toast('The cabbage was confiscated', { icon: 'leaf' });
  if (app.fade) await app.fade(1, 600);
  const home = w.spot('frontDoorOut');
  if (me) { me.place(home[0], home[1], 0, home[3]); if (w.partner) w.partner.place(home[0] + 0.9, home[1] + 0.6, 0, home[3]); if (w.city) w.city.placed(); }
  if (cin) await cin.end({ release: true, dur: 0 });
  await app.wait(300);
  if (app.fade) await app.fade(0, 600);
  await app.say('Mom', pick(['…Was that the farmer from the community garden walking you home? Hm. We\'ll talk about it at dinner.', 'A very cross man with a very large cabbage Tokonmon just dropped you off. I\'m not even going to ask.']));
  if (app.save) app.save();
}

/** Farmer Aldo: grandpa preset in overalls colours (a red work shirt under a denim bib), a straw sun hat */
export const FARMER = {
  preset: 'grandpa', seed: 31, sex: 'm', age: 'elder', build: 1.1, belly: 0.5,   // (no H: a spec with H + top is taken as final, without the preset's derived fields)
  skin: 0xd6a37a, hair: { style: 'short', col: 0xc4c0ba, grey: 1 }, face: { wrinkles: 1, spots: 1, mustache: true, stubble: 0.4, browW: 1.3, lipFull: 0.75 },
  glasses: null, hat: { kind: 'sunhat', col: 0xe0c070, col2: 0x6a3a3a },
  top: { kind: 'polo', col: 0xc84a3a, vest: 0x3a5a8a, sleeve: 'long' }, bottom: { kind: 'slacks', col: 0x3a5a8a, belt: [50, 36, 26] },
  shoes: { kind: 'boots', col: 0x4a3a2a }, acc: [], walk: { style: 'elder', hunch: 0.3 },
};
