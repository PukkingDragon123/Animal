// Day 1, the opening: a dark, messy apartment in Chinatown; Mom (Wheezowl, the family
// owl) wheezes you awake; the lights come on; you dress at the closet; wonton lunch with
// Mom and old Mopzart; out the door (tap to walk) to the cable car; a punk shaking down
// an old man; a bubble from nowhere; the Coach; the driver throws everyone off; the
// street arena, the professor's three partners and a 2-vs-2 beside the Coach; your own
// bracelet; Yumi and the forced-bond Barkorious at Pier 39 (3 vs 1); seafood on the
// pier; the dojo, the phone and the League sign-up — then the city is yours.
// Scenes or models that are not built yet fall back to Chinatown and to stand-ins.
import { T } from '../../px/game/ui.js';
import * as S from '../../game/state.js';
import { SPECIES } from '../../data/species.js';
import { Closet, pajamas } from './closet.js';

const STARTERS = ['chilichick', 'bubblion', 'strawbaa'];
// load a scene, or a stand-in when it doesn't exist yet → true if the real one loaded
async function scene(w, id, fallback, o = {}) {
  try { await w.load(id, o); return true; } catch (e) { console.warn('scene', id, 'not ready:', e.message); await w.load(fallback, o); return false; }
}
const off = (s, dx = 0, dz = 0, yaw) => [s[0] + dx, s[1] + dz, yaw ?? s[2] ?? 0, s[3]];
// hand control to the player until they reach a goal: a hotspot to walk to and tap
function goal(story, h) {
  const app = story.app, w = app.world;
  return new Promise((resolve) => {
    const hs = { icon: 'star', color: T.amber, ...h, act: async () => { const i = w.hotspots.indexOf(hs); if (i >= 0) w.hotspots.splice(i, 1); resolve(); } };
    w.hotspots.push(hs); w.roam(true); story.busy = false;
    if (app.auto) setTimeout(() => { if (h.walk && w.player) w.player.place(h.walk[0], h.walk[1]); hs.act(); }, 300);
  }).then(async () => { await app.wait(60); story.busy = true; w.roam(false); w.player && (w.player.path = null); });
}
async function talkShot(w, a, b, o = {}) {
  const p = a.g.position, q = (b || a).g.position;
  return w.shot({ target: [(p.x + q.x) / 2, Math.max(p.y, q.y) + (o.h ?? 0.9), (p.z + q.z) / 2], dist: o.dist || 4.6, yaw: o.yaw ?? 0, pitch: o.pitch ?? 14 }, o.dur ?? 1.0);
}

export async function day1(story) {
  const app = story.app, w = app.world, st = app.state, Q = app.quests, say = app.say.bind(app);
  app.roaming = false;
  st.look = st.look || pajamas();
  // ------------------------------------------------ 1. dark room, the wheeze, lights on
  await app.fade(1, 400);
  const home = await scene(w, 'apartment', 'chinatown', { mood: 'night', life: false });
  if (home && w.sc.lights) w.sc.lights(false);
  Q.start('day1');
  const bed = home ? w.spot('bed') : w.spot('start');
  const hero = w.addPerson('hero', st.look, bed, { clip: 'sit' });
  const mom = await w.addMon('mom', 'wheezowl', home ? off(w.spot('wake'), 0.9, 0.3, -Math.PI / 2) : off(bed, 1.2, 0.4), { clip: 'idle' });
  w.setPlayer(hero, null);
  await w.shot(w.shots.bedroomDark || { target: [bed[0], (bed[3] ?? hero.g.position.y) + 0.8, bed[1]], dist: 5.5, yaw: 15, pitch: 20 }, 0);
  await app.fade(0, 1400);
  story.cap('Chinatown, San Francisco', 'Saturday · 11:48 AM', 4);
  await app.wait(1600);
  mom.play('wheeze'); w.emote('mom', 'note', 3);
  await say('???', 'Hoo… hoo-WHEEEEZE!');
  mom.play('talk');
  await say('Mom', 'Hoo! Rise and shine, sleepyhead — it\'s nearly noon!', '*wheeze* …Your old Mom flapped all the way up those stairs. Don\'t make me do it twice.');
  if (home && w.sc.lights) { app.audio.sfx && app.audio.sfx('ui_tap'); w.sc.lights(true); }
  await app.wait(500);
  if (w.shots.bedroom) await w.shot('bedroom', 1.2);
  hero.play('stretch');
  await say('Mom', 'Look at this room… comics, noodle cups, socks on the lamp.', 'Get dressed, wash that face, and come down for lunch. I made wontons. Hoo!');
  mom.play('walk'); await app.wait(600); w.remove('mom');
  // ------------------------------------------------ 2. the closet
  story.objective = 'Tap the floor to walk · go to the closet';
  await goal(story, { id: 'closet', label: 'Closet', icon: 'bag', at: home ? [w.spot('closet')[0], (w.spot('closet')[3] ?? 0) + 1.6, w.spot('closet')[1] - 0.6] : [bed[0] + 2, 1.6, bed[1]], walk: home ? [w.spot('closet')[0], w.spot('closet')[1]] : [bed[0] + 2, bed[1] + 0.5] });
  story.objective = null;
  const cs = home ? w.spot('closet') : off(bed, 2, 0.5);
  hero.place(cs[0], cs[1], 0, cs[3]);
  if (w.shots.closet) await w.shot('closet', 0.9); else await w.closeOn(hero, { dist: 4.4, h: 0.9 });
  const closet = new Closet(app, st.look, [cs[0], cs[1], 0, cs[3]]);
  st.look = await closet.open();
  const me = w.actor('hero'); me.play('cheer'); w.setPlayer(me, null);
  await say('', 'Looking good. Now — the smell of wontons is drifting up the stairs…');
  Q.next('day1');
  // ------------------------------------------------ 3. wonton lunch with Mom and Mopzart
  story.objective = null;
  if (home) await goal(story, { id: 'lunch', label: 'Lunch', icon: 'bowl', at: [w.spot('table')[0], (w.spot('table')[3] ?? 0) + 1.2, w.spot('table')[1]], walk: [w.spot('seatHero')[0], w.spot('seatHero')[1]] });
  const seat = home ? w.spot('seatHero') : off(bed, -1, 1);
  me.place(seat[0], seat[1], seat[2] || 0, seat[3]); me.play('sit');
  const mom2 = await w.addMon('mom', 'wheezowl', home ? w.spot('seatMom') : off(seat, 1.4, 0, -Math.PI / 2), { clip: 'cook' });
  const dog = await w.addMon('mop', 'mopzart', home ? w.spot('dogBed') : off(seat, -1.6, 0.6, Math.PI / 2), { clip: 'sleep' });
  if (w.shots.table) await w.shot('table', 1.1); else await talkShot(w, me, mom2, { dist: 4.4 });
  w.burst('steam', [seat[0] + 0.5, me.g.position.y + 1.0, seat[1]], { n: 6 });
  mom2.play('talk');
  await say('Mom', 'Hoo, there you are! Pork and shrimp, the way your grandpa liked them.', 'Eat slowly. Wheeze. Mopzart, wake up — say good morning.');
  dog.play('idle'); await app.wait(700); dog.play('conduct'); w.emote('mop', 'note', 2);
  await say('', 'Old Mopzart lifts his mop of a head, conducts a few bars of some symphony only he can hear, and sneezes.');
  me.play('laugh');
  await say('Mom', 'You\'re heading downtown today, aren\'t you? Take the cable car. And stay out of trouble.', '…You never stay out of trouble. Hoo. Take your bag at least.');
  if (!(st.look.acc || []).includes('backpack')) { st.look.acc = [...(st.look.acc || []), 'backpack']; st.look.packColor = st.look.packColor || '#2e6a8a'; }
  app.toast('Grabbed your bag', { icon: 'bag', color: T.cyan, dur: 2 });
  Q.next('day1');
  // ------------------------------------------------ 4. out the door, down the road, to the cable car
  if (home) {
    w.remove('hero'); const h2 = w.addPerson('hero', st.look, seat, { clip: 'idle' }); w.setPlayer(h2, null);
    story.objective = 'Head out the front door';
    await goal(story, { id: 'door', label: 'Front door', icon: 'door', at: [w.spot('door')[0], (w.spot('door')[3] ?? 0) + 1.4, w.spot('door')[1]], walk: [w.spot('door')[0], w.spot('door')[1]] });
    await app.fade(1, 400);
    await w.load('chinatown', { mood: 'golden' });
  } else { await app.fade(1, 400); await w.load('chinatown', { mood: 'golden' }); }
  const hs = w.spot('home'), hero3 = w.addPerson('hero', st.look, [hs[0], hs[1] + 0.8, 0]);
  w.setPlayer(hero3, null); await w.followCam(0); await app.fade(0, 600);
  story.cap('Grant Avenue', 'Chinatown', 3);
  story.objective = 'Walk to the cable car stop';
  await goal(story, { id: 'tram', label: 'Cable car stop', icon: 'map', at: [55, 3.6, 26], walk: w.spot('tramStop').slice(0, 2) });
  story.objective = null;
  await tramIncident(story);
  // ------------------------------------------------ 5. the street arena: the professor, the partners, 2 vs 2
  await app.fade(1, 400);
  await scene(w, 'arena', 'chinatown', { mood: 'golden', life: false });
  Q.next('day1');
  const A = w.spot('start'), hero4 = w.addPerson('hero', st.look, off(A, 0, 0, Math.PI)), coach = w.addPerson('coach', 'coach', off(A, -1.4, -0.4, Math.PI * 0.75));
  const kani = await w.addMon('kani', 'kanizumo', off(A, -2.4, -1.0, Math.PI));
  const spike = w.addPerson('spike', 'spike', off(A, 1.2, -5, 0)), duck = await w.addMon('duck', 'dreadrake', off(A, 2.4, -5.2, 0));
  w.setPlayer(hero4, null);
  await talkShot(w, hero4, coach, { dur: 0 }); await app.fade(0, 500);
  coach.face(hero4); coach.play('talk');
  await say('Coach Gonda', 'You\'ve got guts, stepping in like that. Guts without a partner gets you hurt, though.', 'Lucky for you, I called in a favour.');
  const prof = w.addPerson('prof', 'aoi', off(A, 3.5, 1.5, -Math.PI / 2));
  await prof.walkTo([[A[0] + 1.4, A[1] + 1.0]], { speed: 1.4 }); prof.face(hero4);
  await talkShot(w, hero4, prof);
  await say('Professor Aoi', 'Gonda tells me you\'re the kid who stood up to a Dreadrake with bare hands. Brave, or very silly.', 'Either way — every trainer starts with one partner. These three have been waiting for someone like you.');
  const P = [off(A, -1.2, 2.4, 0), off(A, 0, 2.7, 0), off(A, 1.2, 2.4, 0)];
  const cands = []; for (let i = 0; i < 3; i++) cands.push(await w.addMon('st' + i, STARTERS[i], P[i], { clip: 'idle' }));
  await w.shot({ target: [A[0], hero4.g.position.y + 0.45, A[1] + 2.5], dist: 6.2, yaw: 0, pitch: 14 }, 1.2);
  cands[0].play('sip'); cands[1].play('idle'); cands[2].play('dance');
  await say('Professor Aoi', 'Chilichick — loud, hot-headed, and it will never, ever give up.', 'Bubblion — a little prince in his own bubble. Proud, graceful, hits harder than he looks.', 'Strawbaa — a baby strawberry lamb. Heals anyone, befriends everyone.');
  let pick = await app.choose('Who will be your partner?', ['Chilichick', 'Bubblion', 'Strawbaa']);
  pick = STARTERS[pick ?? 0];
  S.giveStarter(st, pick, 5); S.setFlag(st, 'starter_' + pick);
  const chosen = cands[STARTERS.indexOf(pick)];
  chosen.play('win'); w.burst('sparkle', [chosen.g.position.x, chosen.g.position.y + 0.6, chosen.g.position.z], { n: 16 });
  app.toast(`${SPECIES[pick] ? SPECIES[pick].name : pick} joined your team!`, { icon: 'star', color: T.amber, dur: 3 });
  await app.wait(1400);
  cands.forEach((c, i) => { if (STARTERS[i] !== pick) w.remove(c.id); });
  spike.play('angry'); w.emote('spike', 'anger');
  await talkShot(w, spike, duck);
  await say('Spike', 'Real touching. You think a baby Tokon changes anything? My Dreadrake will flatten it.');
  coach.play('point');
  await say('Coach Gonda', 'Then let\'s settle it properly. Two on two — me and the rookie, against you and whoever you\'ve got.', 'Watch me, kid. Dodge when it winds up, strike when it\'s open, and keep your partner\'s spirit up.');
  const res = await app.startBattle({ foe: { name: 'Spike', team: [['dreadrake', 6], ['studrat', 5]] }, allies: [{ name: 'Coach Gonda', team: [['kanizumo', 8]] }], partySize: 1, title: 'STREET ARENA', subtitle: '2 vs 2 · with Coach Gonda', tutorial: true, canLose: true });
  await app.fade(0, 400);
  const won = !res || res.winner === 0;
  spike.play(won ? 'angry' : 'laugh');
  await say('Spike', won ? 'Tch… this isn\'t over, rookie.' : 'Ha! Lucky your babysitter was here.');
  await spike.walkTo([[A[0] + 8, A[1] - 6]], { speed: 2.2, clip: 'run' }); w.remove('spike'); w.remove('duck');
  coach.face(hero4); await talkShot(w, hero4, coach);
  await say('Coach Gonda', won ? 'Not bad. Not bad at all.' : 'You lost — but you didn\'t quit. That\'s the part I can\'t teach.', 'Here. Hold out your wrist.');
  S.setFlag(st, 'bracelet'); S.setFlag(st, 'license');
  app.toast('Got the Bond Bracelet!', { icon: 'link', color: T.amber, dur: 3 });
  hero4.play('cheer');
  await say('Coach Gonda', 'A bond bracelet. When you and your partner are truly in sync, it lets you unleash things you wouldn\'t believe.', 'You\'ve got potential, kid. Real potential.');
  Q.next('day1');
  // ------------------------------------------------ 6. Yumi, and the sea lion that went mad
  const yumi = w.addPerson('yumi', 'yumi', off(A, -9, 2, Math.PI / 2)), flower = await w.addMon('creep', 'creepetal', off(A, -9.8, 2.6, Math.PI / 2));
  yumi.walkTo([[A[0] - 2.2, A[1] + 0.8]], { speed: 3.2, clip: 'run' }); await flower.walkTo([[A[0] - 3, A[1] + 1.4]], { speed: 3 });
  yumi.face(coach); yumi.play('shock'); w.emote('yumi', 'sweat');
  await talkShot(w, yumi, coach);
  await say('Yumi', 'COACH! There you are — I\'ve been looking all over Chinatown for you!', 'It\'s the big sea lion at Pier 39 — the king, Barkorious! He\'s gone completely mad!', 'Somebody forced a bond on him. He\'s HUGE now, his eyes are red, and he\'s got this… this fish cannon?!');
  yumi.face(hero4); yumi.play('wave');
  await say('Yumi', 'Oh! Sorry, hi. I\'m Yumi — I study Tokon bonds. This is Creepetal. He\'s shy. He thinks everyone hates him.', 'You\'re coming too, right? We need everyone we\'ve got!');
  // ------------------------------------------------ 7. Pier 39: three against one
  await app.fade(1, 400);
  const pier = await scene(w, 'pier39', 'chinatown', { mood: 'golden', life: false });
  S.unlockLocation(st, 'pier39');
  const B = pier ? w.spot('boss') : off(w.spot('square'), 0, 3);
  const hero5 = w.addPerson('hero', st.look, off(B, -1.5, -5, Math.PI)), coach5 = w.addPerson('coach', 'coach', off(B, -3, -5.4, Math.PI)), yumi5 = w.addPerson('yumi', 'yumi', off(B, 0.2, -5.6, Math.PI));
  const boss = await w.addMon('boss', 'barkorious_forced', off(B, 0, 0, 0), { clip: 'cry' });
  if (!boss.m.def.name.includes('forced')) { boss.m.group.scale.multiplyScalar(1.7); boss.m.scale *= 1.7; }
  w.setPlayer(hero5, null); void coach5; void yumi5;
  await w.shot({ target: [B[0], boss.g.position.y + 1.6, B[1]], dist: 11, yaw: 0, pitch: 10 }, 0);
  await app.fade(0, 600);
  story.cap('Pier 39', 'Fisherman\'s Wharf', 3);
  w.emote('boss', 'anger', 2);
  await say('', 'The king of Pier 39 looms over the docks — swollen to twice his size, eyes burning red, a fish cannon strapped to his back.', 'Tourists scatter. Somewhere a seagull drops its fries.');
  await say('Coach Gonda', 'A forced bond… whoever did this ought to be ashamed.', 'Kanizumo, Creepetal, and you, rookie — all together. Break the bond without hurting him more than we have to!');
  const res2 = await app.startBattle({ foes: [{ name: 'Barkorious (forced)', team: [[SPECIES.barkorious_forced ? 'barkorious_forced' : 'barkorious', SPECIES.barkorious_forced ? 8 : 12]] }], allies: [{ name: 'Coach Gonda', team: [['kanizumo', 8]] }, { name: 'Yumi', team: [[SPECIES.creepetal ? 'creepetal' : 'cabbunny', 6]] }], partySize: 1, title: 'BOSS: BAROKING UNLEASHED', subtitle: '3 vs 1 · Pier 39', canLose: true });
  await app.fade(0, 400);
  boss.play('hurt'); await app.wait(700);
  w.burst('sparkle', [boss.g.position.x, boss.g.position.y + 1.4, boss.g.position.z], { n: 30 }); w.burst('ring', [boss.g.position.x, boss.g.position.y + 0.2, boss.g.position.z], {});
  for (let i = 0; i < 20; i++) { const k = 1 - (i / 20) * 0.42; boss.m.group.scale.multiplyScalar(i ? k / (1 - ((i - 1) / 20) * 0.42) : k); await app.wait(30); }
  boss.play('win');
  await say('Yumi', (res2 && res2.winner === 0 ? 'The forced bond… it snapped! ' : 'He\'s… calming down on his own? ') + 'Look at him — he\'s himself again!', 'Whoever did this to him is still out there. Coach, we have to find out who.');
  await say('', 'Barkorious nods to a beat only he can hear, flips his crown back on, and slides off the pier with a satisfied bark.');
  w.remove('boss');
  Q.next('day1');
  // ------------------------------------------------ 8. seafood on the pier
  hero5.play('sit');
  await w.shot({ target: [hero5.g.position.x - 1, hero5.g.position.y + 0.9, hero5.g.position.z], dist: 5, yaw: 20, pitch: 16 }, 1.2);
  w.burst('steam', [hero5.g.position.x - 1, hero5.g.position.y + 1.1, hero5.g.position.z + 0.4], { n: 8 });
  await say('', 'Clam chowder in sourdough bowls, garlic crab, and a paper boat of fries the seagulls keep eyeing.');
  await say('Yumi', 'You were amazing back there! Your partner really trusts you, you know.');
  await say('Coach Gonda', 'Eat up. Then come by my dojo — there\'s something you\'ll need before tomorrow.');
  Q.next('day1');
  // ------------------------------------------------ 9. the dojo: the phone, the map, the League
  await app.fade(1, 400);
  const dojo = await scene(w, 'dojo', 'chinatown', { mood: 'golden', life: false });
  S.unlockLocation(st, 'dojo');
  const D = dojo ? w.spot('desk') : w.spot('start');
  const hero6 = w.addPerson('hero', st.look, off(D, 0.8, 0.6, Math.PI)), coach6 = w.addPerson('coach', 'coach', off(D, -0.6, 0.4, Math.PI / 2));
  const kani6 = await w.addMon('kani', 'kanizumo', dojo ? w.spot('ring') : off(D, -2, 2, 0), { clip: 'idle' });
  w.setPlayer(hero6, null); void kani6; void kani;
  await talkShot(w, hero6, coach6, { dur: 0 }); await app.fade(0, 600);
  story.cap('Golden Claw Dojo', 'Chinatown', 3);
  await say('Coach Gonda', 'Welcome to the Golden Claw. Sixty years this hall\'s been training fighters.', 'Every League trainer carries one of these. Your TokoPhone.');
  S.setFlag(st, 'phone'); app.toast('Got the TokoPhone!', { icon: 'phone', color: T.cyan, dur: 3 });
  await say('Coach Gonda', 'The MAP app shows the whole city. Places you\'ve been get a cable-car stop — tap one and ride.', 'Places you haven\'t been yet, you walk to first. That\'s how you learn a city.', 'QUESTS keeps track of what you\'ve promised people. TEAM shows your partners.');
  story.objective = 'Sign up for the League on the dojo board';
  const bd = dojo ? w.spot('board') : off(D, 2, 0);
  await goal(story, { id: 'board', label: 'League sign-up', icon: 'star', at: [bd[0], (bd[3] ?? hero6.g.position.y) + 1.6, bd[1] - 0.4], walk: [bd[0], bd[1] + 0.6] });
  story.objective = null;
  await say('', 'You sign your name under a long list of rookies. TOKONMON LEAGUE — SAN FRANCISCO CIRCUIT. Opening rounds: tomorrow.');
  app.toast('Signed up for the League!', { icon: 'star', color: T.amber, dur: 3 });
  await say('Coach Gonda', 'Tomorrow, then. Rest up, explore, and help people out when you can — it\'s how you get strong.');
  Q.complete('day1'); Q.start('league'); Q.start('tarts'); Q.start('chess');
  for (const id of ['chinatown', 'alamo', 'dojo', 'pier39', 'arena']) S.unlockLocation(st, id);
  S.addItem(st, 'quartz', 5);
  app.save();
  // ------------------------------------------------ 10. free roam
  const lead = st.party[0];
  const partner = await w.addMon('partner', lead ? lead.species : 'chilichick', off(hero6.g.position ? [hero6.g.position.x, hero6.g.position.z] : D, 1, -0.6), { drip: (lead && lead.drip) || 1, look: (lead && lead.look) || 0 });
  w.setPlayer(hero6, partner).roam(true); app.roaming = true;
}

// the cable car: a shakedown, a bubble from nowhere, the Coach, and the driver's temper
async function tramIncident(story) {
  const app = story.app, w = app.world, say = app.say.bind(app);
  await app.fade(1, 400);
  const tram = await scene(w, 'tram', 'chinatown', { mood: 'day', life: false });
  const C = tram ? w.spot('aisle') : w.spot('start');
  const at = (k, dx, dz, yaw) => (tram && w.sc.spots && w.sc.spots[k] ? w.sc.spots[k] : off(C, dx, dz, yaw));
  const hero = w.addPerson('hero', app.state.look, at('door', 0, 2.2, Math.PI), { clip: 'idle' });
  // passengers on their phones, a kid playing with a Tokon
  for (let i = 0; i < 4; i++) { const p = w.addPerson('pax' + i, 'passerby' + (11 + i * 37), at('seat' + i, -1.2 + (i % 2) * 2.4, -1.5 - Math.floor(i / 2) * 1.4, i % 2 ? -Math.PI / 2 : Math.PI / 2), { clip: 'phone' }); void p; }
  await w.addMon('kidmon', 'zapanda', at('kidMon', 1.6, 0.8, 0), { clip: 'dance' });
  const lau = w.addPerson('lau', 'lau', at('oldman', -0.8, -3.2, Math.PI / 2), { clip: 'sad' }), weak = await w.addMon('weak', 'lemmo', at('oldmanMon', -0.6, -2.4, Math.PI / 2), { clip: 'hurt' });
  const spike = w.addPerson('spike', 'spike', at('punk', 0.6, -3.2, -Math.PI / 2), { clip: 'angry' }), duck = await w.addMon('duck', 'dreadrake', at('punkMon', 1.4, -3.6, -Math.PI / 2), { clip: 'menace' });
  const coach = w.addPerson('coach', 'coach', at('coachSeat', -1.3, 0.6, Math.PI / 2), { clip: 'sit' });
  w.setPlayer(hero, null);
  await w.shot(w.shots.ride || { target: [C[0], hero.g.position.y + 1, C[1] - 1.2], dist: 6.5, yaw: 25, pitch: 18 }, 0);
  await app.fade(0, 600);
  app.audio.sfx && app.audio.sfx('notification');
  await say('', 'Ding-ding! The cable car clanks up the hill. Everyone\'s nose is in a phone; a kid\'s Zapanda dances on the seat.');
  await talkShot(w, spike, lau);
  await say('Spike', 'C\'mon, old man. Fare\'s doubled for you today. Pay up, or my Dreadrake sits on your little lemon.');
  await say('Mr. Lau', 'P-please… that\'s my pension money…');
  duck.play('flex'); w.emote('duck', 'anger');
  const c = await app.choose('What do you do?', ['Step in', 'Tell him to back off']); void c;
  await hero.walkTo([[lau.g.position.x + 0.8, lau.g.position.z + 1.0]], { speed: 1.8 }); hero.face(spike);
  await talkShot(w, hero, spike);
  await say('You', 'Hey! Leave him alone.');
  spike.face(hero); spike.play('angry');
  await say('Spike', 'Huh? Who invited you, kid? Mind your own—', '…You know what? You need a lesson.');
  spike.play('throw'); hero.play('shock'); await app.wait(350);
  // the bubble
  const sp = spike.g.position;
  w.burst('bubble', [sp.x - 2, sp.y + 1.2, sp.z + 0.5], { n: 20, speed: 2.5 }); app.audio.sfx && app.audio.sfx('hydro_splash');
  await app.wait(250);
  w.burst('splash', [sp.x, sp.y + 1.2, sp.z], { n: 26 }); w.burst('drop', [duck.g.position.x, duck.g.position.y + 1.2, duck.g.position.z], { n: 18 });
  spike.play('shock'); duck.play('wet'); w.emote('spike', 'sweat', 2);
  await say('', 'SPLOOSH! A bubble the size of a beach ball slams into the punk and his Dreadrake. Both of them stand there, dripping.');
  coach.play('idle'); await coach.walkTo([[hero.g.position.x - 1.0, hero.g.position.z - 0.2]], { speed: 1.4 });
  const kani = await w.addMon('kani', 'kanizumo', off([coach.g.position.x, coach.g.position.z], -0.8, 0.6, 0), { clip: 'win' });
  await talkShot(w, coach, spike);
  await say('???', 'That\'s enough.', 'Shaking down an old man on the 11 o\'clock car. Your mother would be ashamed, Spike.');
  await say('Spike', 'C-Coach Gonda…?!');
  // the driver has had enough of all of them
  const drv = w.addPerson('driver', 'driver', at('driver', 0, -6, 0), { clip: 'angry' }), cat = await w.addMon('cat', 'thundersabre', at('driverMon', 0.9, -5.6, 0), { clip: 'roar' });
  w.burst('bolt', [cat.g.position.x, cat.g.position.y + 1.2, cat.g.position.z], { n: 3 });
  await w.shot({ target: [drv.g.position.x, drv.g.position.y + 1.2, drv.g.position.z], dist: 4.2, yaw: 180, pitch: 10 }, 0.8);
  await say('Driver', 'WHAT IS GOING ON BACK THERE?! Water on my seats?! Tokon fights on MY car?!', 'EVERYBODY OFF! ALL OF YOU! NOW!');
  cat.play('roar'); w.emote('cat', 'anger', 2);
  await app.wait(900);
  await say('Coach Gonda', '…Fair enough. Come on, kid. Spike — you too. There\'s a street arena two blocks from here.');
  void weak; void kani;
}
