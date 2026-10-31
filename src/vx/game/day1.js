// Day 1, the opening, in the walkable city — shot like a JRPG cutscene reel by the director (cinema.js).
// A daylight flyover of San Francisco settles on Sunset Row; in the dark an alarm and Mom's voice ask who you
// are (name, boy or girl). You wake on the edge of your bed in a shaft of sunlight with the family owl
// wheezing in your ear, wander the house, and find Mom at the stove. Then, on foot across the city:
// - the cable-car stop on Market Street, where a punk is shaking down an old man; a bubble from nowhere;
//   the Coach
// - the Street Arena downtown, packed bleachers: the professor's three partners, a 2-vs-2 beside the Coach,
//   your own bracelet
// - Yumi, and the forced-bond sea lion king at the end of the pier under a storm sky (3 vs 1); chowder
// - the Golden Claw Dojo in Chinatown: the TokoPhone and the League sign-up
// After that the city is yours. Story beats wait for you to walk there yourself (an objective marker points
// the way); every scene in between is a cutscene with letterbox bars, which you can hold Esc to skip.
// Dev: ?auto=1 plays it through; &beat=tram (wake / kitchen / tram / arena / yumi / pier / chowder / dojo)
// starts at a later scene; &cine=1 pauses at each marked beat for a screenshot (see cinema.beat()).
import { T } from '../../px/game/ui.js';
import * as S from '../../game/state.js';
import { SPECIES } from '../../data/species.js';
import { view } from './cinema.js';

const STARTERS = ['chilichick', 'bubblion', 'strawbaa'];
const BEATS = ['wake', 'kitchen', 'tram', 'arena', 'yumi', 'pier', 'chowder', 'dojo'];
const off = (s, dx = 0, dz = 0, yaw) => [s[0] + dx, s[1] + dz, yaw ?? s[2] ?? 0, s[3]];
export const playerName = (st) => (st.player && st.player.name) || 'Ren';
const face = (a, e, hold = 2.5) => { if (a && a.anim && a.anim.face) a.anim.face(e, hold); };
const sfx = (app, n, o) => { if (app.audio && app.audio.sfx) app.audio.sfx(n, o); };
// sit an actor on a seat surface at height y (the sit pose lowers the hips onto the root)
const seat = (a, x, z, yaw, y) => { a.place(x, z, yaw, y); a.g.position.y = y; a.play('sit', { fade: 0 }); return a; };

/** let the player roam until they reach a spot (within r metres, on storey L if given); shows the objective + marker */
export async function goalAt(story, spot, o = {}) {
  const app = story.app, w = app.world, cin = app.cinema, p = Array.isArray(spot) ? spot : w.spot(spot);
  if (cin && cin.active) await cin.end();                    // bars out, the follow camera blends back in
  story.objective = o.text || null;
  story.goal = { x: p[0], z: p[1], y: (p[3] ?? w.ground(p[0], p[1])) + 2.2, L: o.L, label: o.label || '' };
  w.roam(true); app.roaming = true; story.busy = false;
  await new Promise((resolve) => {
    let dead = false;
    const ov = () => {
      if (dead || story.busy || app.ui.dialog) return;
      const pl = w.player; if (!pl) return;
      const q = pl.g.position;
      if (Math.hypot(q.x - p[0], q.z - p[1]) < (o.r || 2.4) && (o.L === undefined || !w.city || w.city.L === o.L)) { dead = true; setTimeout(() => { const i = app.overlays.indexOf(ov); if (i >= 0) app.overlays.splice(i, 1); }, 0); resolve(); }
    };
    app.overlays.push(ov);
    if (app.auto) setTimeout(() => { if (w.player) { w.player.place(p[0], p[1], undefined, p[3]); if (w.city) w.city.placed(); } }, 300);
  });
  story.busy = true; story.goal = null; story.objective = null; w.roam(false);
  if (w.city) { w.city.vx = w.city.vz = 0; } if (w.player) w.player.path = null;
  await app.wait(60);
}

export async function day1(story) {
  const app = story.app, w = app.world, st = app.state, cin = app.cinema;
  app.roaming = false;
  const X = { story, app, w, st, cin, Q: app.quests, say: app.say.bind(app) };
  const from = Math.max(0, BEATS.indexOf(app.params.get('beat') || ''));
  if (from > 0) await jumpTo(X, from); else await prologue(X);
  const SCENES = [wake, kitchen, tram, arena, yumi, pier, chowder, dojo];
  for (let i = from; i < SCENES.length; i++) await SCENES[i](X);
}

// ------------------------------------------------------------------ 0. a daylight flyover; in the dark, an alarm
async function prologue(X) {
  const { app, w, st, cin, Q, say } = X;
  await app.fade(1, 300);
  await w.load('city', { mood: 'golden', life: false });
  Q.start('day1');
  // the city from over the bay, gliding south across Chinatown and downtown to Sunset Row
  await cin.begin({ prefer: 20 });
  cin.grade('morning');
  await cin.cut(view([118, 2, 66], 150, 172, 30));
  cin.focus(null, { band: 0.2, dof: 0.85 });
  await app.fade(0, 1200);
  const glide = cin.move(view([88, 3, 124], 82, 118, 30), { dur: 7.5 });
  await cin.title('DAY 1', 'Saturday  ·  San Francisco', { hold: 3600 });
  await cin.beat('flyover');
  await glide;
  // down onto the house, up to the bedroom's bay window
  const bay = [59.6, 4.4, 152.2];
  cin.place('Sunset Row', 'Home  ·  11:48 AM', { wait: false });
  await cin.move(view(bay, 26, 18, 16), { dur: 4.2 });
  await cin.beat('house');
  await cin.move(view(bay, 7, 12, 8), { dur: 2.4, ease: (t) => t * t });
  await app.fade(1, 600);
  // in the dark: who are you, again?
  sfx(app, 'notification');
  await say('', 'Bzzzt… bzzzt… bzzzt…');
  await say('Mom', 'Rise and shine up there! It\'s nearly noon!');
  await say('', 'Ugh. Five more minutes. Your brain boots up one word at a time…');
  const name = app.auto ? 'Ren' : (app.ui.nameEntry ? await app.ui.nameEntry({ title: 'What\'s your name?', value: 'Ren', max: 10 }) : 'Ren');
  st.player.name = (name || 'Ren').trim() || 'Ren';
  let g = 0;
  if (!app.auto) {
    g = app.ui.pickCards
      ? await app.ui.pickCards({ title: 'Are you a boy or a girl?', cards: [{ label: 'Boy', sub: 'Messy hair, big dreams', color: '#e8603a', icon: 'star' }, { label: 'Girl', sub: 'Ponytail, bigger dreams', color: '#ffd040', icon: 'heart' }] })
      : await app.choose('Are you a boy or a girl?', ['Boy', 'Girl']);
  }
  st.player.gender = g === 1 ? 'girl' : 'boy';
  st.look = st.player.look = g === 1 ? 'heroine' : 'hero';
}

// dev: start at a later scene with what it needs (?beat=…)
async function jumpTo(X, k) {
  const { app, w, st, Q } = X;
  await app.fade(1, 200);
  await w.load('city', { mood: 'golden', life: false });
  Q.start('day1'); st.player.name = st.player.name || 'Ren'; st.look = st.player.look = st.look || 'hero';
  const at = { 1: 'bedroom', 2: 'frontDoorOut', 3: 'tramStop', 4: 'arenaA', 5: 'arenaA', 6: 'pierEnd', 7: 'pierEnd' }[k];
  const hero = w.addPerson('hero', st.look, w.spot(at));
  let partner = null;
  if (k >= 4) { if (!st.party.length) S.giveStarter(st, 'chilichick', 5); S.setFlag(st, 'bracelet'); S.setFlag(st, 'license'); const lead = st.party[0]; partner = await w.addMon('partner', lead.species, off(w.spot(at), 1, -0.6)); X.pick = lead.species; }
  if (k >= 3) { const C = w.spot('tramStop'); X.coach = w.addPerson('coach', 'coach', off(C, -2, 1)); }
  if (k >= 6) { const B = w.spot('pierEnd'); w.addPerson('yumi', 'yumi', off(B, 1.2, 4)); await w.addMon('creep', 'creepetal', off(B, 2, 4)); X.coach.place(B[0] - 1.6, B[1] + 4); }
  if (k === 4) { const A = w.spot('arenaA'); X.coach.place(A[0] - 1.6, A[1] + 0.4); }
  w.setPlayer(hero, partner);
  await app.fade(0, 300);
}

// ------------------------------------------------------------------ 1. the bedroom: sunlight, the owl, a stretch
async function wake(X) {
  const { app, w, st, cin, say } = X, nm = st.player.name;
  const ROOM = [56.3, 146.3, 64.2, 153.4];
  const hero = w.addPerson('hero', st.look, [57.25, 149.62, 0, 3]);
  seat(hero, 57.25, 149.62, 0, 3.58); face(hero, 'sleepy', 8);
  const owl = await w.addMon('owl', 'wheezowl', [58.35, 150.15, -2.0, 3], { clip: 'sleep' });
  w.setPlayer(hero, null); if (w.city) w.city.L = 1;
  // a shaft of afternoon sun through the west window, dust drifting in it
  const sd = (w.st.mood && w.st.mood.sunDir) || [-0.9, 0.62, 0.3], L = Math.hypot(...sd);
  X.beam = cin.sunbeam([56.25, 4.55, 150.6], [-sd[0] / L, -sd[1] / L, -sd[2] / L], { len: 4.2, w: 0.85, floor: 3.03, opacity: 0.34 });
  await cin.begin({ prefer: 50, room: ROOM });
  cin.grade('morning');
  // eyes opening: warm light, a slow dolly in on the sleepy-head
  cin.veil.a = 1; cin.veil.color = '#fff0d6';
  app.fade(0, 200);
  await cin.dolly(hero, { from: 5.2, to: 3.4, yaw: 58, pitch: 14, hold: 9, dur: 0 });
  w.emote('hero', 'z', 3);
  await cin.veilTo(0, 1600);
  await cin.beat('bedroom');
  // the alarm owl, right in your ear
  owl.play('wheeze'); w.emote('owl', 'note', 3); sfx(app, 'coo', { pitch: 0.7 });
  await cin.push(owl, { dist: 2.0, at: 'chest' });
  cin.handheld(0.012);
  await say('???', 'Hoo… hoo-WHEEEEZE!');
  await cin.beat('owl');
  face(hero, 'surprised', 2.2); cin.shake(0.08);
  await cin.close(hero, { dist: 2.0, yaw: 30, dur: 0 });
  await say('', 'Wheezowl, the family owl and the world\'s worst alarm clock, wheezes right in your ear.');
  cin.handheld(0);
  // up you get (the cut hides the hop off the mattress)
  hero.place(57.25, 150.05, 0.4, 3); hero.play('stretch', { restart: true }); face(hero, 'sleepy', 2);
  owl.play('idle');
  await cin.two(hero, owl, { dist: 4.4, angle: 8, dur: 0, pitch: 10 });
  await app.wait(900);
  await cin.beat('stretch');
  // Mom, from downstairs: the camera looks toward the door with you
  hero.faceTo(64.3, 149.4); hero.play('idle');
  await cin.close(hero, { yaw: 100, dist: 2.5, pitch: 6, dur: 0.9 });
  await say('Mom', `${nm}! Lunch is on the table! Wontons — and they won't wait for you!`);
  face(hero, 'happy', 2); hero.play('nod', { restart: true });
  await app.wait(500);
  hero.play('idle');
  // the house is yours to explore; the mop dog naps downstairs
  const mopAt = w.spot('livingRoom');
  await w.addMon('mop', 'mopzart', off(mopAt, 0.8, 0.6, 0), { clip: 'sleep' });
  X.story.cap('WASD / arrows to walk · Shift to run · E to look at things', 'Tip: on touch screens, drag on the left side to walk', 6);
}

// ------------------------------------------------------------------ 2. lunch: Mom at the stove
async function kitchen(X) {
  const { app, w, st, cin, Q, story } = X, nm = st.player.name, say = X.say;
  let mom = w.actor('mom');
  if (!mom) mom = w.addPerson('mom', 'mom', [59.55, 142.35, Math.PI, 0]);
  mom.place(59.55, 142.4, Math.PI, 0); mom.play('idle');
  await goalAt(story, 'kitchen', { text: 'Explore your room, then go downstairs for lunch', label: 'Lunch', r: 2.6, L: 0 });
  if (X.beam) { X.beam.remove(); X.beam = null; }
  const me = w.actor('hero');
  const KITCHEN = [56.3, 141.3, 64.25, 146.0];
  await cin.begin({ prefer: 40, room: KITCHEN });
  cin.grade('warm');
  cin.walk(me, 61.0, 143.55, { speed: 1.4 });
  // Mom's back at the stove, the pot steaming; she hums
  const steam = setInterval(() => w.burst('steam', [59.42, 1.2, 141.62], { n: 3 }), 700);
  await cin.frame(mom, { at: 'chest', yaw: 40, dist: 4.4, pitch: 16, dur: 0, push: 0.08, hold: 6 });
  await app.wait(1100);
  await cin.beat('kitchen');
  mom.face(me); me.face(mom); mom.play('wave', { restart: true });
  await app.wait(500);
  await cin.talk(mom, me, 'Mom', `There you are, ${nm}! Pork and shrimp, the way your grandpa liked them.`, 'Eat slowly. Mopzart, wake up — say good morning.', { clip: 'talk', face: 'happy' });
  await cin.beat('kitchen-ots');
  // the mop dog wakes in the living room and conducts
  const dog = w.actor('mop');
  if (dog) {
    cin.set({ room: [56.3, 146.3, 64.25, 151.7] });
    dog.play('idle'); await cin.close(dog, { dist: 2.2, pitch: 12, yaw: 200 });
    await app.wait(500); dog.play('conduct'); w.emote('mop', 'note', 2);
    await say('', 'Old Mopzart lifts his mop of a head, conducts a few bars of some symphony only he can hear, and sneezes.');
    cin.set({ room: KITCHEN });
  }
  me.play('laugh', { restart: true });
  await cin.ots(me, mom, { back: 0.75 });
  await app.wait(900);
  await cin.talk(mom, me, 'Mom', 'You\'re heading downtown today, aren\'t you? Coach Gonda\'s been asking around for new rookies.', 'Take the cable car from Market Street. And stay out of trouble.', { clip: 'explain' });
  face(mom, 'smile', 3); mom.play('shrug', { restart: true });
  await cin.talk(mom, me, 'Mom', '…You never stay out of trouble. Take your bag at least.', { shot: 'two', clip: 'shrug' });
  app.toast('Grabbed your bag', { icon: 'bag', color: T.cyan, dur: 2 });
  me.play('peace', { restart: true });
  await app.wait(700);
  clearInterval(steam);
  mom.play('idle'); me.play('idle');
  Q.next('day1');
}

// ------------------------------------------------------------------ 3. the cable-car stop: a shakedown, a bubble, the Coach
async function tram(X) {
  const { app, w, st, cin, story } = X, nm = st.player.name, say = X.say;
  await goalAt(story, 'tramStop', { text: 'Walk to the cable-car stop on Market Street', label: 'Cable car', r: 4 });
  const C = w.spot('tramStop'), hero = w.actor('hero');
  // a little crowd staring at their phones, an old man on the bench, a punk looming over him
  const pax = [[146.0, 111.1, Math.PI], [147.1, 110.7, Math.PI * 0.8], [145.5, 110.4, Math.PI * 1.15]].map((p, i) => w.addPerson('pax' + i, 'passerby' + (11 + i * 37), p, { clip: 'phone' }));
  const lau = seat(w.addPerson('lau', 'lau', [150.0, 111.95, Math.PI]), 150.0, 111.95, Math.PI, 0.55); lau.play('sitSad', { fade: 0 });
  const weak = await w.addMon('weak', 'lemmo', [150.95, 111.25, Math.PI - 0.5], { clip: 'hurt' });
  const spike = w.addPerson('spike', 'spike', [150.3, 110.25, 0], { clip: 'angry' }), duck = await w.addMon('duck', 'dreadrake', [151.95, 109.75, -0.5], { clip: 'menace' });
  hero.place(147.4, 109.1, 1.2); hero.play('idle');
  await cin.begin({ prefer: 190 });
  cin.grade('tense');
  app.audio.music && app.audio.music('tension', { fade: 1.2 });
  const est = cin.establish([149.6, 1.0, 110.9], { from: { dist: 58, yaw: 140, pitch: 52 }, to: { dist: 13, yaw: 200, pitch: 16 }, dur: 5 });
  await app.wait(1200);
  cin.place('Market Street', 'Cable-car stop  ·  Downtown', { wait: false });
  await est;
  await cin.beat('tram-establish');
  await say('', 'Ding-ding — the cable car is late again. At the stop, a crowd stares at their phones, pretending not to see what\'s happening on the bench.');
  // the punk, from the old man's eye line: low, tilted, unsteady
  cin.dutch(-7).handheld(0.016);
  await cin.talk(spike, lau, 'Spike', 'C\'mon, old man. Bench tax is doubled for you today. Pay up, or my Dreadrake sits on your little lemon.', { shot: 'hero', yaw: 12, dist: 2.1, low: -15, clip: 'angry' });
  await cin.beat('tram-spike');
  cin.dutch(0);
  await cin.talk(lau, spike, 'Mr. Lau', 'P-please… that\'s my pension money…', { shot: 'close', yaw: 200, dist: 2.3, pitch: 26, face: 'sad', clip: 'sitSad' });
  duck.play('flex', { restart: true }); w.emote('duck', 'anger');
  await cin.push(duck, { shake: 0.18 });
  await app.wait(800);
  cin.handheld(0.01);
  await cin.frame(hero, { at: 'chest', yaw: 235, dist: 7.5, pitch: 12, dur: 0.6, off: [1.4, 0, 0.6], focus: 'wide' });
  const c = await app.choose('What do you do?', ['Step in', 'Tell him to back off']); void c;
  cin.handheld(0);
  // you step in between them
  cin.track(hero, { yaw: 215, dist: 5, pitch: 10 });
  await cin.walk(hero, 149.7, 111.05, { speed: 2.4 }); hero.face(spike);
  await cin.talk(hero, spike, nm, 'Hey! Leave him alone.', { shot: 'hero', low: -12, angle: 30, face: 'angry' });
  await cin.beat('tram-hero');
  spike.face(hero); spike.play('angry', { restart: true });
  await cin.talk(spike, hero, 'Spike', 'Huh? Who invited you, kid? Mind your own—', '…You know what? You need a lesson.');
  // he winds up — and a bubble from nowhere
  spike.play('throw', { restart: true });
  hero.play('shock', { restart: true }); face(hero, 'surprised', 2);
  await cin.push(hero, { punch: 8 });
  await app.wait(350);
  const sp = spike.g.position;
  w.burst('bubble', [sp.x - 2, sp.y + 1.2, sp.z + 0.5], { n: 20, speed: 2.5 }); sfx(app, 'hydro_splash');
  await cin.frame(spike, { at: 'chest', yaw: 160, dist: 6.5, pitch: 10, dur: 0, off: [0.8, 0, -0.2], focus: 0.22 });
  await app.wait(250);
  w.burst('splash', [sp.x, sp.y + 1.2, sp.z], { n: 26 }); w.burst('drop', [duck.g.position.x, duck.g.position.y + 1.2, duck.g.position.z], { n: 18 });
  sfx(app, 'hit_heavy'); cin.flash('#ffffff', 0.35).shake(0.32, 4);
  await cin.hitStop(170);
  spike.play('shock', { restart: true }); duck.play('wet'); w.emote('spike', 'sweat', 2); face(spike, 'surprised', 3);
  cin.slowmo(0.3, 1100, 500);
  await cin.beat('tram-splash');
  await cin.two(spike, duck, { dist: 6, dur: 0.6 });
  await say('', 'SPLOOSH! A bubble the size of a beach ball slams into the punk and his Dreadrake. Both of them stand there, dripping.');
  // the Coach walks in: a low, slow hero shot
  app.audio.music && app.audio.music('city', { fade: 2 });
  cin.grade('hero');
  const coach = w.addPerson('coach', 'coach', [142.6, 111.3, Math.PI / 2]);
  const kani = await w.addMon('kani', 'kanizumo', [141.8, 112.1, Math.PI / 2], { clip: 'win' });
  await cin.hero(coach, { yaw: 120, dist: 4.8, low: -9, dur: 0, hold: 7, push: 0.25 });
  const arrive = cin.walk(coach, hero.g.position.x - 1.3, hero.g.position.z - 0.1, { speed: 1.4 }); cin.walk(kani, hero.g.position.x - 2.1, hero.g.position.z + 0.7, { speed: 1.4 });
  await say('???', 'That\'s enough.');
  await cin.beat('tram-coach');
  await arrive; coach.face(spike);
  cin.nameCard('Coach Gonda', 'Golden Claw Dojo', { side: 'left', wait: false, color: '#3a1a18', accent: T.amber, accentL: T.amberL });
  await cin.talk(coach, spike, '???', 'Shaking down an old man at a cable-car stop. Your mother would be ashamed, Spike.', { shot: 'hero', low: -6, dist: 3.2 });
  spike.play('shock', { restart: true });
  await cin.push(spike, { shake: 0.06 });
  await say('Spike', 'C-Coach Gonda…?!');
  lau.play('sit'); face(lau, 'smile', 4); hero.face(lau);
  await cin.talk(lau, hero, 'Mr. Lau', 'Thank you, young one. Ho… you have a good heart.', { shot: 'two', dist: 3.6 });
  coach.play('point', { restart: true });
  await cin.talk(coach, spike, 'Coach Gonda', 'Spike — you want a fight so badly? Then you\'ll have a proper one. Street Arena, down the block. Now.', { clip: 'point' });
  coach.face(hero); hero.face(coach);
  await cin.talk(coach, hero, 'Coach Gonda', 'You too, kid. Come on.', { face: 'smile' });
  // the crowd and the old man go on their way
  cin.walk(lau, C[0] - 10, C[1] + 6, { speed: 0.9 }).then(() => { w.remove('lau'); w.remove('weak'); });
  cin.walk(weak, C[0] - 10.6, C[1] + 6.5, { speed: 0.9 });
  pax.forEach((a, i) => cin.walk(a, C[0] + 12 - i * 3, C[1] + 8, { speed: 1.2 }).then(() => w.remove('pax' + i)));
  X.coach = coach;
}

// ------------------------------------------------------------------ 4. the street arena: the partners, a 2-vs-2
async function arena(X) {
  const { app, w, st, cin, Q, story } = X, nm = st.player.name, say = X.say;
  const coach = w.actor('coach'), spike = w.actor('spike'), duck = w.actor('duck');
  const A = w.spot('arena'), aA = w.sc.spots && w.sc.spots.arenaA ? w.spot('arenaA') : off(A, 0, 4), aB = w.sc.spots && w.sc.spots.arenaB ? w.spot('arenaB') : off(A, 0, -4);
  if (coach) cin.walk(coach, aA[0] - 1.6, aA[1] + 0.4, { speed: 2 });
  if (spike) { cin.walk(spike, aB[0], aB[1], { speed: 2 }); if (duck) cin.walk(duck, aB[0] + 1, aB[1] - 0.6, { speed: 2 }); }
  await goalAt(story, aA, { text: 'Follow the Coach to the Street Arena downtown', label: 'Street Arena', r: 3 });
  Q.next('day1');
  crowd(w, true);
  const hero = w.actor('hero');
  hero.place(aA[0], aA[1] + 0.2, hero.yaw); if (coach) { coach.place(aA[0] - 1.6, aA[1] + 0.4); coach.face(hero); hero.face(coach); }
  if (spike) { spike.place(aB[0], aB[1], -Math.PI / 2); if (duck) duck.place(aB[0] + 1, aB[1] - 0.6, -Math.PI / 2); }
  await cin.begin({ prefer: 30 });
  cin.grade('hero');
  app.audio.music && app.audio.music('party', { fade: 1.5 });
  // the bleachers are packed: crane down over the court
  sfx(app, 'crowd_cheer'); cheer(w);
  const est = cin.establish([A[0] - 1, 1.2, A[1] - 2], { from: { dist: 68, yaw: -12, pitch: 56 }, to: { dist: 21, yaw: 32, pitch: 18 }, dur: 5 });
  await app.wait(1300);
  cin.place('Street Arena', 'Downtown  ·  Open battles daily', { wait: false });
  await est;
  await cin.beat('arena-establish');
  // you, in box A: low angle, the crowd behind
  hero.face(spike || coach);
  await cin.hero(hero, { low: -14, dist: 3.4, hold: 6 });
  await app.wait(app.auto ? 100 : 1400);
  await cin.beat('arena-hero');
  if (coach) hero.face(coach);
  await cin.talk(coach || hero, hero, 'Coach Gonda', 'You\'ve got guts, stepping in like that. Guts without a partner gets you hurt, though.', 'Lucky for you, I called in a favour.');
  // the professor
  const prof = w.addPerson('prof', 'aoi', off(aA, 6, 2.2, -Math.PI / 2));
  cin.track(prof, { yaw: 20, dist: 5.5, pitch: 10 });
  cin.nameCard('Professor Aoi', 'Tokon Lab  ·  Market Street', { side: 'right', wait: false, color: '#16283a', accent: T.cyan, accentL: T.cyanL });
  await cin.walk(prof, aA[0] + 1.4, aA[1] + 0.8, { speed: 1.6 }); prof.face(hero); hero.face(prof);
  await cin.talk(prof, hero, 'Professor Aoi', 'Gonda tells me you\'re the kid who stood up to a Dreadrake with bare hands. Brave, or very silly.', 'Either way — every trainer starts with one partner. These three have been waiting for someone like you.', { face: 'smile' });
  // the starter reveal: an orbit round the three, then one by one
  const P = [off(aA, -1.2, -2.4, 0), off(aA, 0, -2.8, 0), off(aA, 1.2, -2.4, 0)];
  const cands = []; for (let i = 0; i < 3; i++) cands.push(await w.addMon('st' + i, STARTERS[i], P[i], { clip: 'idle' }));
  for (const c of cands) w.burst('sparkle', [c.g.position.x, c.g.position.y + 0.4, c.g.position.z], { n: 10 });
  sfx(app, 'sparkle'); cin.flash('#fff4d8', 0.4, 0.6);
  hero.face(cands[1]);
  await cin.orbit([aA[0], hero.g.position.y + 0.45, aA[1] - 2.6], { dist: 5.2, pitch: 14, yaw: -40, deg: 80, time: 8 });
  cands[0].play('sip'); cands[1].play('crown'); cands[2].play('dance');
  await app.wait(app.auto ? 100 : 1200);
  await cin.beat('starters');
  const lines = ['Chilichick — loud, hot-headed, and it will never, ever give up.', 'Bubblion — a little prince in his own bubble. Proud, graceful, hits harder than he looks.', 'Strawbaa — a baby strawberry lamb. Heals anyone, befriends everyone.'];
  const clips = ['hiccup', 'blow', 'baa'];
  for (let i = 0; i < 3; i++) {
    cands[i].play(clips[i], { restart: true }); w.burst('sparkle', [cands[i].g.position.x, cands[i].g.position.y + 0.5, cands[i].g.position.z], { n: 8 });
    await cin.close(cands[i], { dist: 2.0, pitch: 10, yaw: 8 - i * 8, push: 0.12 });
    await say('Professor Aoi', lines[i]);
  }
  await cin.frame([aA[0], hero.g.position.y + 0.5, aA[1] - 1.3], { dist: 6.2, yaw: 10, pitch: 22, dur: 0.8, focus: 'wide' });
  let pick = await app.choose('Who will be your partner?', ['Chilichick', 'Bubblion', 'Strawbaa']);
  pick = STARTERS[pick ?? 0]; X.pick = pick;
  S.giveStarter(st, pick, 5); S.setFlag(st, 'starter_' + pick);
  const chosen = cands[STARTERS.indexOf(pick)];
  // the bond: a hero shot of your partner, light, a beat of slow motion
  chosen.play('win', { restart: true }); chosen.face(hero);
  await cin.hero(chosen, { low: -6, dist: 2.6, dur: 0.5, hold: 5 });
  cin.flash('#ffffff', 0.5, 0.9); w.burst('sparkle', [chosen.g.position.x, chosen.g.position.y + 0.6, chosen.g.position.z], { n: 24 }); w.burst('ring', [chosen.g.position.x, chosen.g.position.y + 0.1, chosen.g.position.z], {});
  app.audio.jingle && app.audio.jingle('new');
  cin.slowmo(0.4, 900, 500);
  app.toast(`${SPECIES[pick] ? SPECIES[pick].name : pick} joined your team!`, { icon: 'star', color: T.amber, dur: 3 });
  sfx(app, 'crowd_cheer'); cheer(w);
  await cin.beat('chosen');
  hero.play('cheer', { restart: true }); face(hero, 'happy', 3);
  await app.wait(1400);
  cands.forEach((c, i) => { if (STARTERS[i] !== pick) w.remove(c.id); });
  // Spike cuts in
  if (spike) {
    spike.face(hero); spike.play('angry', { restart: true }); w.emote('spike', 'anger');
    cin.handheld(0.012);
    await cin.push(spike);
  }
  await say('Spike', 'Real touching. You think a baby Tokon changes anything? My Dreadrake will flatten it.');
  cin.handheld(0);
  if (coach) { coach.face(spike || hero); coach.play('point', { restart: true }); }
  await cin.talk(coach || hero, spike || hero, 'Coach Gonda', 'Then let\'s settle it properly. Two on two — me and the rookie, against you and whoever you\'ve got.', { clip: 'point', shot: 'hero', low: -8 });
  if (coach) coach.face(hero);
  await cin.talk(coach || hero, hero, 'Coach Gonda', 'Watch me, kid. Dodge when it winds up, strike when it\'s open, and keep your partner\'s spirit up.');
  // into the fight (the battle has its own camera)
  sfx(app, 'crowd_cheer');
  cin.flash('#ffffff', 0.25);
  await cin.end({ release: false });
  const res = await app.startBattle({ foe: { name: 'Spike', team: [['dreadrake', 6], ['studrat', 5]] }, allies: [{ name: 'Coach Gonda', team: [['kanizumo', 8]] }], partySize: 1, title: 'STREET ARENA', subtitle: '2 vs 2 · with Coach Gonda', tutorial: true, canLose: true, arena: { at: [A[0], A[1]], r: 7 } });
  await cin.begin({ prefer: 30 });
  const won = !res || res.winner === 0;
  if (spike) { spike.face(hero); spike.play(won ? 'angry' : 'laugh', { restart: true }); }
  await cin.close(spike || hero, { dist: 2.4, dur: 0 });
  await app.fade(0, 400);
  await say('Spike', won ? 'Tch… this isn\'t over, rookie.' : 'Ha! Lucky your babysitter was here.');
  if (spike) { cin.walk(spike, A[0] + 14, A[1] + 10, { speed: 3, clip: 'run' }).then(() => { w.remove('spike'); w.remove('duck'); }); if (duck) cin.walk(duck, A[0] + 15, A[1] + 10.6, { speed: 3 }); }
  if (coach) { coach.face(hero); hero.face(coach); }
  await cin.talk(coach || hero, hero, 'Coach Gonda', won ? 'Not bad. Not bad at all.' : 'You lost — but you didn\'t quit. That\'s the part I can\'t teach.', 'Here. Hold out your wrist.', { face: 'smile' });
  S.setFlag(st, 'bracelet'); S.setFlag(st, 'license');
  // the bracelet clicks shut: low angle, a flash of gold
  hero.play('cheer', { restart: true }); face(hero, 'happy', 3);
  await cin.hero(hero, { low: -16, dist: 3.0, dur: 0.4, hold: 5 });
  cin.flash('#fff0b0', 0.45, 0.8); w.burst('sparkle', [hero.g.position.x, hero.g.position.y + 1.1, hero.g.position.z], { n: 18 }); sfx(app, 'sparkle');
  app.toast('Got the Bond Bracelet!', { icon: 'link', color: T.amber, dur: 3 });
  sfx(app, 'crowd_cheer'); cheer(w);
  await cin.beat('bracelet');
  await cin.talk(coach || hero, hero, 'Coach Gonda', 'A bond bracelet. When you and your partner are truly in sync, it lets you unleash things you wouldn\'t believe.', `You've got potential, ${nm}. Real potential.`);
  Q.next('day1');
  // the partner tags along from now on
  const lead = st.party[0];
  const partner = await w.addMon('partner', lead ? lead.species : pick, off([hero.g.position.x, hero.g.position.z], 1, -0.6), { drip: (lead && lead.drip) || 1, look: (lead && lead.look) || 0 });
  w.remove(chosen.id); w.setPlayer(hero, partner);
}

// ------------------------------------------------------------------ 5. Yumi: the sea lion king has gone mad
async function yumi(X) {
  const { app, w, cin, story } = X, say = X.say;
  const aA = w.sc.spots && w.sc.spots.arenaA ? w.spot('arenaA') : off(w.spot('arena'), 0, 4);
  const hero = w.actor('hero'), coach = w.actor('coach');
  if (!cin.active) await cin.begin({ prefer: 30 });
  const yumi = w.addPerson('yumi', 'yumi', off(aA, -12, 3, Math.PI / 2)), flower = await w.addMon('creep', 'creepetal', off(aA, -12.8, 3.6, Math.PI / 2));
  // she comes running across the court: a handheld track
  cin.handheld(0.018);
  cin.track(yumi, { yaw: 150, dist: 6, pitch: 8, at: 'chest' });
  cin.walk(flower, aA[0] - 3, aA[1] + 1.4, { speed: 3 });
  await cin.walk(yumi, aA[0] - 2.2, aA[1] + 0.8, { speed: 3.2, clip: 'run' });
  if (coach) yumi.face(coach); yumi.play('shock', { restart: true }); w.emote('yumi', 'sweat'); face(yumi, 'surprised', 3);
  await cin.push(yumi);
  await cin.beat('yumi');
  await cin.talk(yumi, coach || hero, 'Yumi', 'COACH! There you are — I\'ve been looking all over Chinatown for you!', { shot: 'keep' });
  cin.handheld(0.008);
  await cin.talk(yumi, coach || hero, 'Yumi', 'It\'s the big sea lion on the pier — the king, Barkorious! He\'s gone completely mad!', 'Somebody forced a bond on him. He\'s HUGE now, his eyes are red, and he\'s scaring everyone off the wharf!', { shot: 'ots', clip: 'explain' });
  cin.handheld(0);
  // and then she notices you
  yumi.face(hero); hero.face(yumi); yumi.play('wave', { restart: true });
  cin.nameCard('Yumi', 'Tokon bond researcher', { side: 'right', wait: false, color: '#2a1a3a', accent: T.pink, accentL: '#ffd0e8' });
  await cin.talk(yumi, hero, 'Yumi', 'Oh! Sorry, hi. I\'m Yumi — I study Tokon bonds.', { shot: 'ots', clip: 'wave', face: 'happy' });
  await cin.beat('yumi-intro');
  flower.play('hide', { restart: true });
  await cin.close(flower, { dist: 1.8, pitch: 6 });
  await say('Yumi', 'This is Creepetal. He\'s shy. He thinks everyone hates him.');
  flower.play('peek', { restart: true });
  await cin.talk(yumi, hero, 'Yumi', 'You\'re coming too, right? We need everyone we\'ve got! The pier — go north, all the way to the water!', { shot: 'ots', clip: 'point' });
  // the others run on ahead
  const pierEnd = w.spot('pierEnd');
  for (const [a, dx] of [[coach, -1.6], [yumi, 1.2], [flower, 2]]) if (a) cin.walk(a, pierEnd[0] + dx, pierEnd[1] + 4, { speed: 4, clip: 'run' });
}

// ------------------------------------------------------------------ 6. the pier: dark clouds, the king, three against one
async function pier(X) {
  const { app, w, st, cin, Q, story } = X, say = X.say;
  const pierEnd = w.spot('pierEnd');
  await goalAt(story, off(pierEnd, 0, 4), { text: 'Run to the end of the pier (north, at the Wharf)', label: 'The pier', r: 4 });
  crowd(w, false);
  S.unlockLocation(st, 'pier39');
  const hero = w.actor('hero'), coach = w.actor('coach'), yumi = w.actor('yumi');
  const B = pierEnd, boss = await w.addMon('boss', 'barkorious_forced', off(B, 0, -1, 0), { clip: 'cry' });
  if (!boss.m.def.name.includes('forced')) { boss.m.group.scale.multiplyScalar(1.7); boss.m.scale *= 1.7; }
  boss._cinH = null;
  hero.place(B[0], B[1] + 4.6, Math.PI); if (coach) coach.place(B[0] - 1.6, B[1] + 4.2, Math.PI); if (yumi) yumi.place(B[0] + 1.3, B[1] + 4.3, Math.PI);
  await cin.begin({ prefer: 15 });
  // clouds roll in, the sea goes grey; the camera circles the king
  cin.weather('storm', 2.2);
  app.audio.music && app.audio.music('tension', { fade: 1 });
  await cin.frame(hero, { at: 'chest', yaw: 10, dist: 6.5, pitch: 12, dur: 0, off: [0, 0.4, -2.4], focus: 'wide', push: 0.1 });
  await app.wait(app.auto ? 200 : 1800);
  boss.play('cry', { restart: true }); sfx(app, 'roar', { pitch: 0.7 }); cin.shake(0.22, 3); cin.lightning();
  await cin.orbit(boss, { yaw: -55, deg: 105, time: 9, pitch: 3, at: 'chest', push: 0.18 });
  cin.place('Pier 39', 'Fisherman\'s Wharf', { wait: false });
  w.emote('boss', 'anger', 2);
  await app.wait(app.auto ? 100 : 1500);
  await cin.beat('boss-orbit');
  await say('', 'The king of the pier looms over the docks — swollen to twice his size, eyes burning red, a fish cannon strapped to his back.');
  boss.play('special', { restart: true }); cin.shake(0.3, 3); sfx(app, 'roar', { pitch: 0.55 });
  await cin.hero(boss, { low: -14, dist: cin.size(boss) * 2.6, dur: 0.3, at: 'chest', yaw: 8 });
  cin.lightning();
  await cin.beat('boss-low');
  await say('', 'Tourists scatter. Somewhere a seagull drops its fries.');
  if (coach) { coach.play('angry', { restart: true }); }
  await cin.talk(coach || hero, boss, 'Coach Gonda', 'A forced bond… whoever did this ought to be ashamed.', { shot: 'ots', face: 'angry' });
  if (coach) coach.play('point', { restart: true });
  await cin.talk(coach || hero, hero, 'Coach Gonda', 'Kanizumo, Creepetal, and you, rookie — all together. Break the bond without hurting him more than we have to!', { shot: 'hero', low: -8 });
  cin.flash('#e8eeff', 0.3);
  await cin.end({ release: false, keepGrade: true });
  const res2 = await app.startBattle({ foes: [{ name: 'Barkorious (forced)', team: [[SPECIES.barkorious_forced ? 'barkorious_forced' : 'barkorious', SPECIES.barkorious_forced ? 8 : 12]] }], allies: [{ name: 'Coach Gonda', team: [['kanizumo', 8]] }, { name: 'Yumi', team: [[SPECIES.creepetal ? 'creepetal' : 'cabbunny', 6]] }], partySize: 1, title: 'BOSS: BARKORIOUS UNLEASHED', subtitle: '3 vs 1 · the Pier', canLose: true, arena: { at: [B[0], B[1] + 2], r: 7 } });
  // the bond breaks: the king shrinks back to himself, the clouds part
  await cin.begin({ prefer: 15 });
  cin.grade('storm');
  boss.play('hurt', { restart: true });
  await cin.frame(boss, { at: 'chest', yaw: 18, dist: cin.size(boss) * 3.4, pitch: 8, dur: 0, push: 0.12 });
  await app.fade(0, 400);
  await app.wait(700);
  const bp = boss.g.position;
  w.burst('sparkle', [bp.x, bp.y + 1.4, bp.z], { n: 30 }); w.burst('ring', [bp.x, bp.y + 0.2, bp.z], {});
  cin.flash('#ffffff', 0.6, 1); cin.shake(0.2, 3); sfx(app, 'sparkle');
  for (let i = 0; i < 20; i++) { const k = 1 - (i / 20) * 0.42; boss.m.group.scale.multiplyScalar(i ? k / (1 - ((i - 1) / 20) * 0.42) : k); await app.wait(30); }
  boss._cinH = null;
  cin.weather(null); cin.grade('warm');
  boss.play('win', { restart: true });
  app.audio.music && app.audio.music('vibes', { fade: 2 });
  await cin.beat('boss-calm');
  if (yumi) { yumi.face(boss); yumi.play('cheer', { restart: true }); }
  await cin.talk(yumi || hero, boss, 'Yumi', (res2 && res2.winner === 0 ? 'The forced bond… it snapped! ' : 'He\'s… calming down on his own? ') + 'Look at him — he\'s himself again!', { shot: 'ots', clip: 'cheer', face: 'happy' });
  if (yumi) { yumi.face(coach || hero); yumi.play('think', { restart: true }); }
  await cin.talk(yumi || hero, coach || hero, 'Yumi', 'Whoever did this to him is still out there. Coach, we have to find out who.', { shot: 'ots', clip: 'think' });
  boss.play('dance', { restart: true });
  await cin.orbit(boss, { yaw: 10, deg: -30, time: 5, pitch: 6, at: 'chest', push: 0.05 });
  await say('', 'Barkorious nods to a beat only he can hear, flips his crown back on, and slides off the pier with a satisfied bark.');
  sfx(app, 'bubble'); w.burst('splash', [bp.x, bp.y + 0.2, bp.z - 1.5], { n: 24 });
  w.remove('boss');
  Q.next('day1');
}

// ------------------------------------------------------------------ 7. chowder on the pier, on a bench facing the bay
async function chowder(X) {
  const { app, w, st, cin, Q } = X, nm = st.player.name;
  const hero = w.actor('hero'), coach = w.actor('coach'), yumi = w.actor('yumi'), PY = 0.36, BY = PY + 0.375;
  if (!cin.active) await cin.begin({ prefer: 180 });
  cin.set({ prefer: 180 }); cin.grade('warm');
  await app.fade(1, 400);
  seat(hero, 157.55, 2.5, Math.PI, BY);
  if (yumi) seat(yumi, 158.45, 2.5, Math.PI, BY);
  if (coach) coach.place(156.2, 3.2, Math.PI * 0.7);
  if (w.partner) w.partner.place(159.3, 2.0, Math.PI);
  await cin.two(hero, yumi || hero, { dist: 4.4, dur: 0, pitch: 6, angle: 10, dy: -0.25 });
  await app.fade(0, 600);
  const steam = setInterval(() => { w.burst('steam', [157.55, BY + 0.55, 2.2], { n: 2 }); if (yumi) w.burst('steam', [158.45, BY + 0.55, 2.2], { n: 2 }); }, 800);
  await cin.beat('chowder');
  await X.say('', 'Clam chowder in sourdough bowls, garlic crab, and a paper boat of fries the seagulls keep eyeing.');
  if (yumi) { yumi.look = hero; hero.look = yumi; }
  await cin.talk(yumi || hero, hero, 'Yumi', `You were amazing back there, ${nm}! Your partner really trusts you, you know.`, { shot: 'close', face: 'happy', clip: 'sit', yaw: 160, dist: 2.2 });
  face(hero, 'happy', 3);
  await cin.close(hero, { yaw: 200, dist: 2.2, dur: 0 });
  await app.wait(600);
  if (coach) { coach.face(hero); }
  await cin.talk(coach || hero, hero, 'Coach Gonda', 'Eat up. Then come by my dojo in Chinatown — the Golden Claw, by the square. There\'s something you\'ll need before tomorrow.', { shot: 'hero', low: -4, dist: 3.4 });
  clearInterval(steam);
  hero.place(157.55, 3.4, Math.PI, PY); hero.play('idle'); if (yumi) { yumi.place(158.6, 3.5, Math.PI, PY); yumi.play('wave', { restart: true }); }
  if (coach) cin.walk(coach, w.spot('dojoInside')[0], w.spot('dojoInside')[1], { speed: 2.2 });
  if (yumi) cin.walk(yumi, 167, 19, { speed: 2 }).then(() => { w.remove('yumi'); w.remove('creep'); });
  const fl = w.actor('creep'); if (fl) cin.walk(fl, 167.6, 19.4, { speed: 2 });
  Q.next('day1');
}

// ------------------------------------------------------------------ 8. the dojo: the phone, the map, the League
async function dojo(X) {
  const { app, w, st, cin, Q, story } = X;
  await goalAt(story, 'dojoDoor', { text: 'Go to the Golden Claw Dojo in Chinatown', label: 'Dojo', r: 3 });
  S.unlockLocation(st, 'dojo');
  const h6 = w.actor('hero'), IN = w.spot('dojoInside');
  let coach6 = w.actor('coach'); if (!coach6) coach6 = w.addPerson('coach', 'coach', off(IN, 0, -2, 0));
  coach6.path = null; coach6.place(IN[0], IN[1] - 2.2, 0); coach6.play('idle');
  // the hall from outside: lanterns, the gate, the red doors
  await cin.begin({ prefer: 10 });
  cin.grade('dusk');
  app.audio.music && app.audio.music('senbazuru', { fade: 1.5 });
  const est = cin.establish([192, 2.4, 47], { from: { dist: 46, yaw: -35, pitch: 48 }, to: { dist: 15, yaw: 12, pitch: 14 }, dur: 4.5 });
  await app.wait(1000);
  cin.place('Golden Claw Dojo', 'Chinatown  ·  Est. 1966', { wait: false });
  await est;
  await cin.beat('dojo-establish');
  // in through the doors
  cin.track(h6, { yaw: 25, dist: 5, pitch: 12 });
  await cin.walk(h6, IN[0], IN[1] + 0.6, { speed: 1.6 });
  h6.face(coach6); coach6.face(h6);
  cin.set({ room: [181.4, 35.4, 202.6, 47.7], prefer: 0 });
  await cin.hero(coach6, { low: -10, dist: 3.6, dur: 0, hold: 8, push: 0.12 });
  await cin.beat('dojo-coach');
  await cin.talk(coach6, h6, 'Coach Gonda', 'Welcome to the Golden Claw. Sixty years this hall\'s been training fighters.', { shot: 'keep', clip: 'explain' });
  await cin.talk(coach6, h6, 'Coach Gonda', 'Every League trainer carries one of these. Your TokoPhone.', { shot: 'ots' });
  // the phone
  S.setFlag(st, 'phone');
  h6.play('phone', { restart: true }); face(h6, 'happy', 3);
  await cin.push(h6, { at: 'chest', dist: 1.8, punch: 4 });
  w.burst('sparkle', [h6.g.position.x, h6.g.position.y + 1.2, h6.g.position.z], { n: 14 }); sfx(app, 'phone_open');
  app.toast('Got the TokoPhone!', { icon: 'phone', color: T.cyan, dur: 3 });
  await cin.beat('phone');
  await app.wait(900);
  h6.play('idle');
  await cin.talk(coach6, h6, 'Coach Gonda', 'The MAP shows the whole city — and you can walk every street of it. Cable-car stops will take you places faster once you know them.', 'QUESTS keeps track of what you\'ve promised people. Help folks out — it\'s how you get strong.', { shot: 'ots', clip: 'explain' });
  // the League sign-up
  await cin.two(h6, coach6, { dist: 4.6, angle: 25 });
  await X.say('', 'You sign your name under a long list of rookies: TOKONMON LEAGUE — SAN FRANCISCO CIRCUIT. Opening rounds: tomorrow.');
  app.toast('Signed up for the League!', { icon: 'star', color: T.amber, dur: 3 });
  app.audio.jingle && app.audio.jingle('complete');
  h6.play('cheer', { restart: true });
  await cin.title('TOKONMON LEAGUE', 'San Francisco Circuit  ·  Round one tomorrow', { hold: 3000, y: 0.32 });
  await cin.beat('league');
  await cin.talk(coach6, h6, 'Coach Gonda', 'Tomorrow, then. Rest up, explore, and say hi to your mom for me.', { shot: 'ots', face: 'smile' });
  Q.complete('day1'); Q.start('league'); Q.start('tarts'); Q.start('chess');
  for (const id of ['chinatown', 'alamo', 'dojo', 'pier39', 'arena', 'city']) S.unlockLocation(st, id);
  S.addItem(st, 'quartz', 5);
  st.map = { id: 'city' };
  app.save();
  // ------------------------------------------------ the city is yours: a last pull back, then the follow camera
  h6.play('idle');
  await cin.frame(h6, { at: 'chest', yaw: 15, dist: 9, pitch: 30, dur: 1.6, push: -0.2, hold: 4, focus: 'wide' });
  cin.title('THE CITY IS YOURS', 'Explore  ·  the League starts tomorrow', { hold: 3000, y: 0.36, wait: false });
  await cin.end({ dur: 1.6 });
  w.setPlayer(h6, w.actor('partner')).roam(true); app.roaming = true;
  w.spawnLife((w.loc && w.loc.life) || []).catch(() => {});
}

// ------------------------------------------------------------------ the arena crowd
const SEATS = [];
for (let i = 0; i < 9; i++) SEATS.push([127.5 + i * 3.4 + (i % 2) * 0.7, i % 2 ? 152.1 : 153.1, 0, i % 2 ? 0.66 : 0.33]);
for (let i = 0; i < 5; i++) SEATS.push([i % 2 ? 121.5 : 122.5, 157.5 + i * 3.7, Math.PI / 2, i % 2 ? 0.66 : 0.33]);
function crowd(w, on) {
  const npc = w.actor('dt_spike');                      // the bleacher regular who looks just like Spike sits this one out
  if (!on) { for (const a of [...w.actors.values()]) if (a.id.startsWith('crowd')) w.remove(a.id); if (npc) npc.g.visible = true; return; }
  if (npc) npc.g.visible = false;
  SEATS.forEach((s, i) => { const a = w.addPerson('crowd' + i, 'passerby' + (31 + i * 23), [s[0], s[1], s[2]]); a.g.position.y = s[3]; a.play(['cheer', 'clap', 'wave', 'idle', 'cheer', 'clap'][i % 6], { fade: 0 }); });
}
function cheer(w) { let i = 0; for (const a of w.actors.values()) if (a.id.startsWith('crowd')) a.play(['cheer', 'clap', 'cheer', 'wave'][i++ % 4], { restart: true }); }
