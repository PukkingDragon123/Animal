// Day 1, the opening, in the walkable city. You wake up in your room on Sunset Row and tell the game who
// you are (name, boy or girl). Then you wander the house: everything in it can be examined or used.
// Lunch with Mom, then out the door and on foot across the city:
// - the cable-car stop on Market Street, where a punk is shaking down an old man; a bubble from nowhere;
//   the Coach
// - the Street Arena downtown: the professor's three partners, a 2-vs-2 beside the Coach, your own bracelet
// - Yumi, and the forced-bond sea lion king at the end of the pier (3 vs 1); chowder on the pier
// - the Golden Claw Dojo in Chinatown: the TokoPhone and the League sign-up
// After that the city is yours. Story beats wait for you to walk there yourself. An objective marker
// points the way, and you can explore and poke at anything in between.
import { T } from '../../px/game/ui.js';
import * as S from '../../game/state.js';
import { SPECIES } from '../../data/species.js';

const STARTERS = ['chilichick', 'bubblion', 'strawbaa'];
const off = (s, dx = 0, dz = 0, yaw) => [s[0] + dx, s[1] + dz, yaw ?? s[2] ?? 0, s[3]];
export const playerName = (st) => (st.player && st.player.name) || 'Ren';

/** let the player roam until they reach a spot (within r metres, on storey L if given); shows the objective + marker */
export function goalAt(story, spot, o = {}) {
  const app = story.app, w = app.world, p = Array.isArray(spot) ? spot : w.spot(spot);
  story.objective = o.text || null;
  story.goal = { x: p[0], z: p[1], y: (p[3] ?? w.ground(p[0], p[1])) + 2.2, L: o.L, label: o.label || '' };
  w.roam(true); app.roaming = true; story.busy = false;
  return new Promise((resolve) => {
    let dead = false;
    const ov = () => {
      if (dead || story.busy || app.ui.dialog) return;
      const pl = w.player; if (!pl) return;
      const q = pl.g.position;
      if (Math.hypot(q.x - p[0], q.z - p[1]) < (o.r || 2.4) && (o.L === undefined || !w.city || w.city.L === o.L)) { dead = true; setTimeout(() => { const i = app.overlays.indexOf(ov); if (i >= 0) app.overlays.splice(i, 1); }, 0); resolve(); }
    };
    app.overlays.push(ov);
    if (app.auto) setTimeout(() => { if (w.player) { w.player.place(p[0], p[1], undefined, p[3]); if (w.city) w.city.placed(); } }, 300);
  }).then(async () => {
    story.busy = true; story.goal = null; story.objective = null; w.roam(false);
    if (w.city) { w.city.vx = w.city.vz = 0; } if (w.player) w.player.path = null;
    await app.wait(60);
  });
}
async function talkShot(w, a, b, o = {}) {
  const p = a.g.position, q = (b || a).g.position;
  return w.shot({ target: [(p.x + q.x) / 2, Math.max(p.y, q.y) + (o.h ?? 1.0), (p.z + q.z) / 2], dist: o.dist || 7, yaw: o.yaw ?? 45, pitch: o.pitch ?? 22 }, o.dur ?? 1.0);
}
// walk an actor along a nav path to a point (falls back to a straight line)
function walkTo(w, a, x, z, o = {}) {
  const p = a.g.position, path = w.nav.path ? w.nav.path({ x: p.x, y: p.y, z: p.z }, { x, y: p.y, z }) : null;
  return a.walkTo(path && path.length > 1 ? path.slice(1) : [[x, z]], o);
}

export async function day1(story) {
  const app = story.app, w = app.world, st = app.state, Q = app.quests, say = app.say.bind(app);
  app.roaming = false;
  // ------------------------------------------------ 1. dark: an alarm, Mom's voice — who are you, again?
  await app.fade(1, 300);
  await w.load('city', { mood: 'golden', life: false });
  Q.start('day1');
  app.audio.sfx && app.audio.sfx('notification');
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
  const nm = st.player.name;
  // ------------------------------------------------ 2. the bedroom
  const bed = w.spot('bed');
  const hero = w.addPerson('hero', st.look, bed, { clip: 'sit' });
  const owl = await w.addMon('owl', 'wheezowl', off(bed, 1.2, 0.8, -Math.PI / 2), { clip: 'idle' });
  w.setPlayer(hero, null);
  await w.closeOn(hero, { dist: 7, pitch: 30, yaw: 45, dur: 0 });
  await app.fade(0, 1400);
  story.cap('Sunset Row, San Francisco', 'Saturday · 11:48 AM', 4);
  owl.play('wheeze'); w.emote('owl', 'note', 3);
  await say('???', 'Hoo… hoo-WHEEEEZE!');
  await say('', `Wheezowl, the family owl and the world's worst alarm clock, wheezes right in your ear.`);
  hero.play('stretch'); await app.wait(900);
  await say('Mom', `${nm}! Lunch is on the table! Wontons — and they won't wait for you!`);
  hero.play('idle');
  // ------------------------------------------------ 3. your house: explore, then lunch with Mom
  const mopAt = w.spot('livingRoom');
  await w.addMon('mop', 'mopzart', off(mopAt, 0.8, 0.6, 0), { clip: 'sleep' });
  story.cap('WASD / arrows to walk · Shift to run · E to look at things', 'Tip: on touch screens, drag on the left side to walk', 6);
  await goalAt(story, 'kitchen', { text: 'Explore your room, then go downstairs for lunch', label: 'Lunch', r: 2.6, L: 0 });
  let mom = w.actor('mom');
  if (!mom) mom = w.addPerson('mom', 'mom', off(w.spot('kitchen'), 1, 0, -Math.PI / 2));
  const me = w.actor('hero');
  mom.face(me); me.face(mom);
  await talkShot(w, me, mom);
  mom.play('talk');
  await say('Mom', `There you are, ${nm}! Pork and shrimp, the way your grandpa liked them.`, 'Eat slowly. Mopzart, wake up — say good morning.');
  const dog = w.actor('mop'); if (dog) { dog.play('idle'); await app.wait(600); dog.play('conduct'); w.emote('mop', 'note', 2); }
  await say('', 'Old Mopzart lifts his mop of a head, conducts a few bars of some symphony only he can hear, and sneezes.');
  me.play('laugh');
  await say('Mom', 'You\'re heading downtown today, aren\'t you? Coach Gonda\'s been asking around for new rookies.', 'Take the cable car from Market Street. And stay out of trouble.', '…You never stay out of trouble. Take your bag at least.');
  app.toast('Grabbed your bag', { icon: 'bag', color: T.cyan, dur: 2 });
  mom.play('idle');
  Q.next('day1');
  // ------------------------------------------------ 4. out the door, up the hill, to the cable-car stop
  await goalAt(story, 'tramStop', { text: 'Walk to the cable-car stop on Market Street', label: 'Cable car', r: 4 });
  await tramStop(story);
  // ------------------------------------------------ 5. the street arena: the professor, the partners, 2 vs 2
  const coach = w.actor('coach'), spike = w.actor('spike'), duck = w.actor('duck');
  const A = w.spot('arena'), aA = w.sc.spots && w.sc.spots.arenaA ? w.spot('arenaA') : off(A, 0, 4), aB = w.sc.spots && w.sc.spots.arenaB ? w.spot('arenaB') : off(A, 0, -4);
  if (coach) walkTo(w, coach, aA[0] - 1.6, aA[1] + 0.4, { speed: 2 });
  if (spike) { walkTo(w, spike, aB[0], aB[1], { speed: 2 }); if (duck) walkTo(w, duck, aB[0] + 1, aB[1] - 0.6, { speed: 2 }); }
  await goalAt(story, aA, { text: 'Follow the Coach to the Street Arena downtown', label: 'Street Arena', r: 3 });
  Q.next('day1');
  const hero4 = w.actor('hero');
  if (coach) { coach.face(hero4); hero4.face(coach); }
  await talkShot(w, hero4, coach || hero4);
  coach && coach.play('talk');
  await say('Coach Gonda', 'You\'ve got guts, stepping in like that. Guts without a partner gets you hurt, though.', 'Lucky for you, I called in a favour.');
  const prof = w.addPerson('prof', 'aoi', off(aA, 6, 2, -Math.PI / 2));
  await walkTo(w, prof, aA[0] + 1.4, aA[1] + 0.8, { speed: 1.6 }); prof.face(hero4);
  await talkShot(w, hero4, prof);
  await say('Professor Aoi', 'Gonda tells me you\'re the kid who stood up to a Dreadrake with bare hands. Brave, or very silly.', 'Either way — every trainer starts with one partner. These three have been waiting for someone like you.');
  const P = [off(aA, -1.2, -2.4, Math.PI), off(aA, 0, -2.8, Math.PI), off(aA, 1.2, -2.4, Math.PI)];
  const cands = []; for (let i = 0; i < 3; i++) cands.push(await w.addMon('st' + i, STARTERS[i], P[i], { clip: 'idle' }));
  await w.shot({ target: [aA[0], hero4.g.position.y + 0.5, aA[1] - 2.5], dist: 8, yaw: 45, pitch: 24 }, 1.2);
  cands[0].play('sip'); cands[1].play('idle'); cands[2].play('dance');
  await say('Professor Aoi', 'Chilichick — loud, hot-headed, and it will never, ever give up.', 'Bubblion — a little prince in his own bubble. Proud, graceful, hits harder than he looks.', 'Strawbaa — a baby strawberry lamb. Heals anyone, befriends everyone.');
  let pick = await app.choose('Who will be your partner?', ['Chilichick', 'Bubblion', 'Strawbaa']);
  pick = STARTERS[pick ?? 0];
  S.giveStarter(st, pick, 5); S.setFlag(st, 'starter_' + pick);
  const chosen = cands[STARTERS.indexOf(pick)];
  chosen.play('win'); w.burst('sparkle', [chosen.g.position.x, chosen.g.position.y + 0.6, chosen.g.position.z], { n: 16 });
  app.audio.jingle && app.audio.jingle('new');
  app.toast(`${SPECIES[pick] ? SPECIES[pick].name : pick} joined your team!`, { icon: 'star', color: T.amber, dur: 3 });
  await app.wait(1400);
  cands.forEach((c, i) => { if (STARTERS[i] !== pick) w.remove(c.id); });
  if (spike) { spike.play('angry'); w.emote('spike', 'anger'); await talkShot(w, spike, duck || spike); }
  await say('Spike', 'Real touching. You think a baby Tokon changes anything? My Dreadrake will flatten it.');
  coach && coach.play('point');
  await say('Coach Gonda', 'Then let\'s settle it properly. Two on two — me and the rookie, against you and whoever you\'ve got.', 'Watch me, kid. Dodge when it winds up, strike when it\'s open, and keep your partner\'s spirit up.');
  const res = await app.startBattle({ foe: { name: 'Spike', team: [['dreadrake', 6], ['studrat', 5]] }, allies: [{ name: 'Coach Gonda', team: [['kanizumo', 8]] }], partySize: 1, title: 'STREET ARENA', subtitle: '2 vs 2 · with Coach Gonda', tutorial: true, canLose: true, arena: { at: [A[0], A[1]], r: 7 } });
  await app.fade(0, 400);
  const won = !res || res.winner === 0;
  if (spike) { spike.play(won ? 'angry' : 'laugh'); }
  await say('Spike', won ? 'Tch… this isn\'t over, rookie.' : 'Ha! Lucky your babysitter was here.');
  if (spike) { walkTo(w, spike, A[0] + 14, A[1] + 10, { speed: 3, clip: 'run' }).then(() => { w.remove('spike'); w.remove('duck'); }); }
  if (coach) { coach.face(hero4); await talkShot(w, hero4, coach); }
  await say('Coach Gonda', won ? 'Not bad. Not bad at all.' : 'You lost — but you didn\'t quit. That\'s the part I can\'t teach.', 'Here. Hold out your wrist.');
  S.setFlag(st, 'bracelet'); S.setFlag(st, 'license');
  app.toast('Got the Bond Bracelet!', { icon: 'link', color: T.amber, dur: 3 });
  hero4.play('cheer');
  await say('Coach Gonda', 'A bond bracelet. When you and your partner are truly in sync, it lets you unleash things you wouldn\'t believe.', `You've got potential, ${nm}. Real potential.`);
  Q.next('day1');
  // the partner tags along from now on
  const lead = st.party[0];
  const partner = await w.addMon('partner', lead ? lead.species : pick, off([hero4.g.position.x, hero4.g.position.z], 1, -0.6), { drip: (lead && lead.drip) || 1, look: (lead && lead.look) || 0 });
  w.remove(chosen.id); w.setPlayer(hero4, partner);
  // ------------------------------------------------ 6. Yumi: the sea lion king has gone mad
  const yumi = w.addPerson('yumi', 'yumi', off(aA, -12, 3, Math.PI / 2)), flower = await w.addMon('creep', 'creepetal', off(aA, -12.8, 3.6, Math.PI / 2));
  walkTo(w, yumi, aA[0] - 2.2, aA[1] + 0.8, { speed: 3.2, clip: 'run' }); await walkTo(w, flower, aA[0] - 3, aA[1] + 1.4, { speed: 3 });
  if (coach) yumi.face(coach); yumi.play('shock'); w.emote('yumi', 'sweat');
  await talkShot(w, yumi, coach || yumi);
  await say('Yumi', 'COACH! There you are — I\'ve been looking all over Chinatown for you!', 'It\'s the big sea lion on the pier — the king, Barkorious! He\'s gone completely mad!', 'Somebody forced a bond on him. He\'s HUGE now, his eyes are red, and he\'s scaring everyone off the wharf!');
  yumi.face(hero4); yumi.play('wave');
  await say('Yumi', 'Oh! Sorry, hi. I\'m Yumi — I study Tokon bonds. This is Creepetal. He\'s shy. He thinks everyone hates him.', 'You\'re coming too, right? We need everyone we\'ve got! The pier — go north, all the way to the water!');
  const pierEnd = w.spot('pierEnd');
  // the others run on ahead
  for (const [a, dx] of [[coach, -1.6], [yumi, 1.2], [flower, 2]]) if (a) walkTo(w, a, pierEnd[0] + dx, pierEnd[1] + 4, { speed: 4, clip: 'run' });
  await goalAt(story, off(pierEnd, 0, 4), { text: 'Run to the end of the pier (north, at the Wharf)', label: 'The pier', r: 4 });
  // ------------------------------------------------ 7. the pier: three against one
  S.unlockLocation(st, 'pier39');
  const B = pierEnd, boss = await w.addMon('boss', 'barkorious_forced', off(B, 0, -1, 0), { clip: 'cry' });
  if (!boss.m.def.name.includes('forced')) { boss.m.group.scale.multiplyScalar(1.7); boss.m.scale *= 1.7; }
  await w.shot({ target: [B[0], boss.g.position.y + 1.6, B[1] - 1], dist: 14, yaw: 45, pitch: 18 }, 1.2);
  story.cap('The Pier', 'Fisherman\'s Wharf', 3);
  w.emote('boss', 'anger', 2);
  await say('', 'The king of the pier looms over the docks — swollen to twice his size, eyes burning red, a fish cannon strapped to his back.', 'Tourists scatter. Somewhere a seagull drops its fries.');
  await say('Coach Gonda', 'A forced bond… whoever did this ought to be ashamed.', 'Kanizumo, Creepetal, and you, rookie — all together. Break the bond without hurting him more than we have to!');
  const res2 = await app.startBattle({ foes: [{ name: 'Barkorious (forced)', team: [[SPECIES.barkorious_forced ? 'barkorious_forced' : 'barkorious', SPECIES.barkorious_forced ? 8 : 12]] }], allies: [{ name: 'Coach Gonda', team: [['kanizumo', 8]] }, { name: 'Yumi', team: [[SPECIES.creepetal ? 'creepetal' : 'cabbunny', 6]] }], partySize: 1, title: 'BOSS: BARKORIOUS UNLEASHED', subtitle: '3 vs 1 · the Pier', canLose: true, arena: { at: [B[0], B[1] + 2], r: 7 } });
  await app.fade(0, 400);
  boss.play('hurt'); await app.wait(700);
  w.burst('sparkle', [boss.g.position.x, boss.g.position.y + 1.4, boss.g.position.z], { n: 30 }); w.burst('ring', [boss.g.position.x, boss.g.position.y + 0.2, boss.g.position.z], {});
  for (let i = 0; i < 20; i++) { const k = 1 - (i / 20) * 0.42; boss.m.group.scale.multiplyScalar(i ? k / (1 - ((i - 1) / 20) * 0.42) : k); await app.wait(30); }
  boss.play('win');
  await say('Yumi', (res2 && res2.winner === 0 ? 'The forced bond… it snapped! ' : 'He\'s… calming down on his own? ') + 'Look at him — he\'s himself again!', 'Whoever did this to him is still out there. Coach, we have to find out who.');
  await say('', 'Barkorious nods to a beat only he can hear, flips his crown back on, and slides off the pier with a satisfied bark.');
  w.remove('boss');
  Q.next('day1');
  // ------------------------------------------------ 8. chowder on the pier
  const h5 = w.actor('hero'); h5.play('sit');
  await w.shot({ target: [h5.g.position.x, h5.g.position.y + 0.9, h5.g.position.z], dist: 7, yaw: 45, pitch: 22 }, 1.2);
  w.burst('steam', [h5.g.position.x - 0.6, h5.g.position.y + 1.1, h5.g.position.z + 0.4], { n: 8 });
  await say('', 'Clam chowder in sourdough bowls, garlic crab, and a paper boat of fries the seagulls keep eyeing.');
  await say('Yumi', `You were amazing back there, ${nm}! Your partner really trusts you, you know.`);
  await say('Coach Gonda', 'Eat up. Then come by my dojo in Chinatown — the Golden Claw, by the square. There\'s something you\'ll need before tomorrow.');
  h5.play('idle');
  if (coach) { walkTo(w, coach, w.spot('dojoInside')[0], w.spot('dojoInside')[1], { speed: 2.2 }); }
  walkTo(w, yumi, pierEnd[0] + 6, pierEnd[1] + 16, { speed: 2 }).then(() => { w.remove('yumi'); w.remove('creep'); });
  Q.next('day1');
  // ------------------------------------------------ 9. the dojo: the phone, the map, the League
  await goalAt(story, 'dojoInside', { text: 'Go to the Golden Claw Dojo in Chinatown', label: 'Dojo', r: 3 });
  S.unlockLocation(st, 'dojo');
  const h6 = w.actor('hero'), coach6 = w.actor('coach') || w.addPerson('coach', 'coach', off(w.spot('dojoInside'), -1, 0.4, Math.PI / 2));
  coach6.face(h6); h6.face(coach6);
  await talkShot(w, h6, coach6);
  story.cap('Golden Claw Dojo', 'Chinatown', 3);
  await say('Coach Gonda', 'Welcome to the Golden Claw. Sixty years this hall\'s been training fighters.', 'Every League trainer carries one of these. Your TokoPhone.');
  S.setFlag(st, 'phone'); app.toast('Got the TokoPhone!', { icon: 'phone', color: T.cyan, dur: 3 });
  await say('Coach Gonda', 'The MAP shows the whole city — and you can walk every street of it. Cable-car stops will take you places faster once you know them.', 'QUESTS keeps track of what you\'ve promised people. Help folks out — it\'s how you get strong.');
  await say('', 'You sign your name under a long list of rookies: TOKONMON LEAGUE — SAN FRANCISCO CIRCUIT. Opening rounds: tomorrow.');
  app.toast('Signed up for the League!', { icon: 'star', color: T.amber, dur: 3 });
  app.audio.jingle && app.audio.jingle('complete');
  await say('Coach Gonda', 'Tomorrow, then. Rest up, explore, and say hi to your mom for me.');
  Q.complete('day1'); Q.start('league'); Q.start('tarts'); Q.start('chess');
  for (const id of ['chinatown', 'alamo', 'dojo', 'pier39', 'arena', 'city']) S.unlockLocation(st, id);
  S.addItem(st, 'quartz', 5);
  st.map = { id: 'city' };
  app.save();
  // ------------------------------------------------ 10. the city is yours
  w.setPlayer(h6, w.actor('partner')).roam(true); app.roaming = true;
  w.spawnLife((w.loc && w.loc.life) || []).catch(() => {});
}

// the cable-car stop: a punk shaking down an old man; a bubble from nowhere; the Coach
async function tramStop(story) {
  const app = story.app, w = app.world, say = app.say.bind(app), nm = playerName(app.state);
  const C = w.spot('tramStop'), hero = w.actor('hero');
  // a little crowd waiting for the car, an old man on the bench, a punk looming over him
  for (let i = 0; i < 3; i++) w.addPerson('pax' + i, 'passerby' + (11 + i * 37), off(C, -3 + i * 1.4, 2.2, Math.PI), { clip: 'phone' });
  const lau = w.addPerson('lau', 'lau', off(C, 1.6, -0.6, -Math.PI / 2), { clip: 'sad' }), weak = await w.addMon('weak', 'lemmo', off(C, 1.4, 0.4, -Math.PI / 2), { clip: 'hurt' });
  const spike = w.addPerson('spike', 'spike', off(C, 3.2, -0.8, -Math.PI / 2), { clip: 'angry' }), duck = await w.addMon('duck', 'dreadrake', off(C, 4.2, -1.4, -Math.PI / 2), { clip: 'menace' });
  await talkShot(w, spike, lau, { dist: 8 });
  await say('', 'Ding-ding — the cable car is late again. At the stop, a crowd stares at their phones, pretending not to see what\'s happening on the bench.');
  await say('Spike', 'C\'mon, old man. Bench tax is doubled for you today. Pay up, or my Dreadrake sits on your little lemon.');
  await say('Mr. Lau', 'P-please… that\'s my pension money…');
  duck.play('flex'); w.emote('duck', 'anger');
  const c = await app.choose('What do you do?', ['Step in', 'Tell him to back off']); void c;
  await walkTo(w, hero, lau.g.position.x + 0.2, lau.g.position.z + 1.2, { speed: 2.4 }); hero.face(spike);
  await talkShot(w, hero, spike);
  await say(nm, 'Hey! Leave him alone.');
  spike.face(hero); spike.play('angry');
  await say('Spike', 'Huh? Who invited you, kid? Mind your own—', '…You know what? You need a lesson.');
  spike.play('throw'); hero.play('shock'); await app.wait(350);
  const sp = spike.g.position;
  w.burst('bubble', [sp.x - 2, sp.y + 1.2, sp.z + 0.5], { n: 20, speed: 2.5 }); app.audio.sfx && app.audio.sfx('hydro_splash');
  await app.wait(250);
  w.burst('splash', [sp.x, sp.y + 1.2, sp.z], { n: 26 }); w.burst('drop', [duck.g.position.x, duck.g.position.y + 1.2, duck.g.position.z], { n: 18 });
  spike.play('shock'); duck.play('wet'); w.emote('spike', 'sweat', 2);
  await say('', 'SPLOOSH! A bubble the size of a beach ball slams into the punk and his Dreadrake. Both of them stand there, dripping.');
  const coach = w.addPerson('coach', 'coach', off(C, -6, 1, Math.PI / 2));
  const kani = await w.addMon('kani', 'kanizumo', off(C, -6.8, 1.8, Math.PI / 2), { clip: 'win' });
  await walkTo(w, coach, hero.g.position.x - 1.2, hero.g.position.z, { speed: 1.6 }); walkTo(w, kani, hero.g.position.x - 2, hero.g.position.z + 0.8, { speed: 1.6 });
  await talkShot(w, coach, spike);
  await say('???', 'That\'s enough.', 'Shaking down an old man at a cable-car stop. Your mother would be ashamed, Spike.');
  await say('Spike', 'C-Coach Gonda…?!');
  lau.play('idle'); await say('Mr. Lau', 'Thank you, young one. Ho… you have a good heart.');
  await say('Coach Gonda', 'Spike — you want a fight so badly? Then you\'ll have a proper one. Street Arena, down the block. Now.', 'You too, kid. Come on.');
  // the crowd and the old man go on their way
  walkTo(w, lau, C[0] - 10, C[1] + 6, { speed: 0.9 }).then(() => { w.remove('lau'); w.remove('weak'); });
  for (let i = 0; i < 3; i++) { const a = w.actor('pax' + i); if (a) walkTo(w, a, C[0] + 12 - i * 3, C[1] + 8, { speed: 1.2 }).then(() => w.remove('pax' + i)); }
  void weak;
}
