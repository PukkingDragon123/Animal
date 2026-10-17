// Episode 1 — "Soul Link". The playable opening chapter:
//   Prologue  farm at dawn: farm animals, farm Elemon, a fire wolf and a sky whale
//   Day 1     Osaka Castle Park: bracelet + starter, coach tutorial, rival battle
//             Dotonbori: ice cream, Team Metallica 3v3 with a borrowed Beatlet,
//             dinner + Dr. Hoshino, night bonding under the sakura
//   Day 2     Umeda: League registration + license, rank matches, lunch,
//             afternoon free time (safari, dojo, onsen, shops, side quests)
//   Day 3+    free days with league matches, random events and the Rookie Cup
//             qualifier deadline on Day 5.
import * as S from '../game/state.js';
import { SPECIES, STARTERS, elemsOf } from '../data/species.js';
import { ELEMENTS } from '../data/elements.js';
import { MEALS, RANDOM_EVENTS } from '../data/events.js';
import { LOCATIONS } from '../data/locations.js';
import { QUESTS, questProgress } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { COSMETICS } from '../data/cosmetics.js';
import { characterLore } from '../data/designs/index.js';
import { createElemon, nameOf, addFriendship, gainExp } from '../game/elemon.js';
import { slotOf } from '../game/time.js';
import { SPR } from '../gfx/particles.js';
import { hashStr } from '../core/rng.js';
import { wait } from '../ui/dom.js';

// rival takes the starter with type advantage (Hydro > Pyro > Bio > Geo > Echo > Hydro)
const COUNTER = { kindoru: 'takopo', takopo: 'komoriff', mochika: 'kindoru', clayki: 'mochika', komoriff: 'clayki' };
const ELEM_TALK = {
  pyro: 'Pyro hits like a truck. Hold the charge button, then let it rip — just don\'t overheat.',
  hydro: 'Hydro is all about aim. Land a shot dead-centre and it crits. Bank shots off walls, too.',
  bio: 'Bio is patient. Heal up, stack poison, put \'em to sleep — then win the long game.',
  geo: 'Geo is a fortress. Walls, armour and the best parries in Osaka. Let them come to you.',
  echo: 'Echo rides the beat. Attack in rhythm with the music for bonus damage. Feel the groove!',
};
const BUDDY_CRY = { kindoru: 'Kin-kin! Doruuu!', takopo: 'Po! Takopo-po!', mochika: 'Mochi~! Mochii!', clayki: 'Kiki! Clay-kii!', komoriff: 'Riff-riff! ♪', beatlet: 'Beat-beat-let!' };
const TOWNSFOLK = [
  'Did you see the hover-tram this morning? Packed. Even the Elemon were standing.',
  'My grandma says Elemon showed up the year the bay glowed. Nobody really knows why.',
  'Team Metallica keeps spraying their logo everywhere. Somebody should teach those punks a lesson.',
  'Osaka in 2050: flying cars, robot chefs… and still the best takoyaki on Earth.',
  'I heard a Kagarou was spotted near Kishiwada! Fire wolves never come this far south.',
  'The Rookie Cup qualifier is this week. My money\'s on the kid with the Takopo.',
  'You need a Tamer License to catch Elemon. The rangers in Minoh are super strict about it.',
  'Ever been to the Smells Like Teen Spirit Arcade in Shinsekai? The crane game is rigged, I swear.',
  'I saw a giant whale in the clouds last night. My friends say I was dreaming…',
  'They say the Beatlet that eats enough lemons turns into something legendary. Weird, right?',
  'Hey Jude, don\'t make it bad… sorry, that busker\'s song is stuck in my head.',
  'The Umeda Sky Building got a new holo-garden. You can see all the way to Kobe.',
];
const RELAX = {
  title: 'Shinsekai Onsen', subtitle: 'Soak away the battle stress. Pick how you unwind!', options: [
    { id: 'soak', label: 'Long hot soak', icon: '♨️', desc: 'Everyone fully healed. Your partner floats on its back.', friend: 5, stat: { stat: 'hp', n: 1 } },
    { id: 'milk', label: 'Fruit milk after the bath', icon: '🥛', desc: 'An Osaka tradition. Hands on hips!', friend: 4, stat: { stat: 'def', n: 1 } },
    { id: 'massage', label: 'Massage chair (¥300)', icon: '💺', desc: 'Your partner tries it too. Its eyes roll back.', money: -300, friend: 6, stat: { stat: 'spd', n: 1 } },
  ],
};
const NIGHT_BOND = {
  title: 'Under the Sakura', subtitle: 'A quiet night with your new partner. What do you do?', options: [
    { id: 'stars', label: 'Stargaze together', icon: '🌌', desc: 'You count shooting stars. It counts them faster.', friend: 10 },
    { id: 'train', label: 'Practice one more move', icon: '🥋', desc: 'One last drill in the moonlight.', stat: { stat: 'dmg', n: 1 }, friend: 4 },
    { id: 'snack', label: 'Share leftover okonomiyaki', icon: '🥞', desc: 'It saves you the biggest piece. Respect.', stat: { stat: 'hp', n: 1 }, friend: 6 },
    { id: 'dream', label: 'Tell it about your dreams', icon: '💭', desc: 'Champion of Kansai. It nods seriously.', stat: { stat: 'elm', n: 1 }, friend: 6 },
  ],
};
const LEAGUE_FOES = [
  { id: 'lg_hiro', name: 'Ace Trainer Hiro', look: 11, team: [['zapanda', 0]] },
  { id: 'lg_lumi', name: 'Lumi★', char: 'idol', team: [['idolark', 1]] },
  { id: 'lg_tanaka', name: 'Mr. Tanaka', char: 'salaryman', team: [['mechanyan', 0], ['kappachi', -1]] },
  { id: 'lg_daichi', name: 'Sumo Kid Daichi', look: 23, team: [['kanizumo', 0]] },
  { id: 'lg_rei', name: 'Ghost Girl Rei', look: 41, team: [['chochobake', 1]] },
  { id: 'lg_ken', name: 'Hiker Ken', look: 57, team: [['moglow', 0], ['pebblips', 0]] },
  { id: 'lg_aya', name: 'Florist Aya', look: 63, team: [['cabbunny', 1], ['hotarumi', -1]] },
  { id: 'lg_jet', name: 'Skater Jet', look: 79, team: [['tengale', 0]] },
];

export class Story {
  constructor(app) { this.app = app; this.locked = false; }
  get s() { return this.app.state; }
  get d() { return this.app.director; }
  get w() { return this.app.world; }
  get ui() { return this.app.ui; }
  get game() { return this.app.game; }
  get audio() { return this.app.audio; }
  get gfx() { return this.app.gfx; }
  F(k) { return !!this.s.flags[k]; }
  set(k, v = true) { this.s.flags[k] = v; }

  // ================================================================== helpers
  setClock(day, hour) { const t = this.s.time; if (day != null) t.day = day; t.hour = hour; this.gfx.setTime(hour); }
  async loadMap(map, spawn, opts = {}) {
    await this.w.load(map, spawn, Object.assign({ banner: false }, this.mapOpts(map), opts));
    if (this.F('day1_done')) this.spawnServiceNpcs(map);
    this.app.updateObjective();
  }
  ensure(id, what, at, face, opts = {}) {
    if (this.w.rec(id)) return this.w.rec(id);
    const p = this.w.resolvePoint(at) || (Array.isArray(at) ? at : null);
    if (!p) return null;
    return this.d.spawn(id, what, p, face, Object.assign({ name: opts.name }, opts));
  }
  async waitNear(at, r = 2.5) {
    for (;;) {
      const p = this.d.pt(at), a = this.w.actor('player');
      if (a && Math.hypot(a.pos.x - p[0], a.pos.z - p[1]) < r && !this.app.busy && !this.app.battle.active) return;
      await wait(120);
    }
  }
  follow(ids) { for (const id of ids) this.d.free(id); this.w.setFollowers(ids.filter((id) => this.w.rec(id))); }
  starter() { const id = this.s.flags.starter; return this.s.party.find((m) => m.species === id || m.uid === this.s.flags.starter_uid) || this.s.party[0]; }
  buddyCry() { const m = this.s.party[0]; return BUDDY_CRY[m && m.species] || '♪!'; }
  unlockSlot(kind, n, why) {
    const sl = this.s.unlocks.slots;
    if (sl[kind] >= n) return;
    sl[kind] = n;
    const label = kind === 'active' ? `Skill slot ${n} unlocked!` : kind === 'passive' ? `Passive slot ${n} unlocked!` : 'Ultimate slot unlocked!';
    this.ui.callout(label, why || '', '#ffe36b', 2200);
    this.audio.stinger && this.audio.stinger('reward');
    this.ui.toast(`💠 ${label} Equip it in Menu → Team → Elemon → Skills.`, 'gold', 4200);
  }
  partyEffect(fn) { for (const m of this.s.party) fn(m); }
  async meal(cfg, mon) {
    const picks = await this.app.screens.choiceScene(cfg);
    const lead = mon || this.s.party[0];
    for (const o of picks) this.game.applyBoost(o, lead);
    const a = this.w.actor('buddy');
    if (a) { a.play('eat'); setTimeout(() => { a.emote('heart'); a.play('happy'); }, 1200); }
    this.audio.sfx('heart');
    return picks;
  }
  daily(key) { const k = `d${this.s.time.day}_${key}`; if (this.s.flags[k]) return false; this.s.flags[k] = true; return true; }
  slot() { return slotOf(this.s.time.hour).id; }

  // ================================================================== entry points
  async start() {
    this.app.titleMode = false;
    this.s.story.beat = 'prologue';
    if (this.app.params.has('skipintro')) { this.s.player.name = 'Rin'; return this.day1Park(); }
    await this.prologue();
    await this.creator();
    await this.day1Park();
  }
  async resume() {
    this.app.titleMode = false;
    const s = this.s;
    const F = (k) => this.F(k);
    this.ui.fade(true, 10);
    if (!F('got_starter')) { const keep = s.player; Object.assign(s, S.newGame()); s.player = keep; return this.day1Park(); }
    if (!F('fought_kaito')) return this.day1Park(true);
    if (!F('beat_metallica_1')) { this.setClock(1, 14.5); await this.loadMap('dotonbori', 'arrive'); await this.ui.fade(false); return this.day1Dotonbori(); }
    if (!F('day1_done')) return this.day1Night();
    if (!F('license')) return this.day2Morning();
    // free roam: back where we saved
    const m = s.map && s.map.id ? s.map : { id: 'castle_park' };
    this.gfx.setTime(s.time.hour);
    await this.w.load(m.id, m.x ? [m.x, m.z] : 'start', this.mapOpts(m.id));
    this.spawnServiceNpcs(m.id);
    await this.ui.fade(false, 700);
    this.freeRoam();
  }
  freeRoam() {
    this.locked = false;
    this.app.clockRunning = this.F('license');
    this.app.hud.show(true);
    this.w.enableControl(true);
    this.app.updateObjective();
  }
  canTravel() {
    if (this.locked) { this.ui.toast(this.lockMsg || 'Not now — follow the story first!'); return false; }
    return true;
  }
  mapOpts(map) {
    const o = {};
    if (map === 'castle_park' && this.s.time.hour >= 20) o.music = 'night';
    if (map === 'dotonbori' && this.s.time.hour < 17) o.music = 'dotonbori';
    return o;
  }

  // ================================================================== PROLOGUE — the farm
  async prologue() {
    const d = this.d, w = this.w;
    await this.ui.fade(true, 300);
    this.setClock(1, 5.6);
    await this.loadMap('farm', 'start', { music: 'farm' });
    w.actor('player').setVisible(false);
    d.begin();
    // the herd and the farm Elemon
    const P = w.resolvePoint('pasture'), Fd = w.resolvePoint('field'), Fm = w.resolvePoint('farmer');
    const herd = [['cow', 0, 0], ['cow', 2.2, -1], ['cow', -2, 1.2], ['pig', 1.4, 2], ['pig', -1.2, -1.6]];
    herd.forEach(([sp, dx, dz], i) => d.spawn('herd' + i, { species: sp }, [P[0] + dx, P[1] + dz], (i * 77) % 360, { label: false, scripted: false, npc: { wander: 1.6, static: true } }));
    for (let i = 0; i < 5; i++) d.spawn('hen' + i, { species: 'chicken' }, [Fm[0] + 2 + (i % 3) * 0.9, Fm[1] + 1.6 + Math.floor(i / 3) * 0.8], i * 70, { label: false, scripted: false, npc: { wander: 1.2, static: true } });
    d.spawn('dog', { species: 'farm_dog' }, [Fm[0] + 1, Fm[1] - 0.6], 90, { label: false });
    d.spawn('farmer', 'farmer', 'farmer', null, { label: false });
    d.spawn('cab1', { species: 'cabbunny' }, [Fd[0] - 1.2, Fd[1]], 200, { label: false });
    d.spawn('cab2', { species: 'cabbunny' }, [Fd[0] + 1.1, Fd[1] + 0.6], 160, { label: false });
    d.spawn('mog', { species: 'moglow' }, [Fd[0], Fd[1] - 1.4], 180, { label: false });
    // 1. dawn establishing shot
    const C = w.resolvePoint('cam_wide') || P;
    d.shot({ from: [C[0] + 22, 20, C[1] + 26], to: [C[0] + 12, 11, C[1] + 16], look: [C[0], 1, C[1]], lookTo: [C[0], 1.5, C[1] - 2], dur: 9, fov: 34, wait: false });
    this.audio.music('farm', { fade: 2 });
    await this.ui.fade(false, 1600);
    await d.caption('Kishiwada, Osaka Prefecture — 2050', 3000);
    await d.narrate('In 2050, people share their cities, skies and seas with *Elemon* — living creatures born from the elements themselves.');
    // 2. the herd
    d.shot({ from: [P[0] + 7, 2.6, P[1] + 7], to: [P[0] + 5, 2.2, P[1] + 6], look: [P[0], 0.8, P[1]], dur: 7, fov: 30, wait: false });
    d.play('herd0', 'eat'); d.play('herd3', 'sniff');
    await d.narrate('Cows still give milk. Chickens still lay eggs. Farm animals are farm animals — and Osaka still loves its barbecue.');
    // 3. the farm Elemon at work
    d.shot({ from: [Fd[0] + 5, 2.4, Fd[1] + 5], to: [Fd[0] + 3.6, 1.8, Fd[1] + 4], look: [Fd[0], 0.6, Fd[1]], dur: 7, fov: 30, wait: false });
    d.play('cab1', 'hop'); d.play('mog', 'stomp');
    await d.narrate('Elemon are different. They think. They feel. They choose their friends.\nBy law, no one may capture or command an Elemon without a *Tamer License*.');
    d.walk('farmer', [Fd[0] - 2.2, Fd[1] + 1.6]).then(() => d.face('farmer', 'cab1'));
    d.closeUp('farmer', { dist: 3.4, angle: 0.6, dur: 4 });
    await wait(900);
    await d.say('farmer', 'Easy now, little ones. Harvest\'s nearly in. Then it\'s carrot cake for everybody.', { play: 'wave' });
    d.play('cab2', 'happy'); d.emote('cab2', 'heart');
    // 4. the fire wolf
    this.audio.music(null, { fade: 0.4 });
    this.gfx.rig.shake(0.4);
    this.audio.sfx('beast_roar', { vol: 0.9, pitch: 0.8 });
    for (const id of ['herd0', 'herd1', 'herd2', 'cab1', 'cab2', 'mog', 'dog', 'farmer']) d.emote(id, '!');
    await wait(500);
    const TL = w.resolvePoint('treeline'), FJ = w.resolvePoint('fence_jump'), WS = w.resolvePoint('wolf_stop');
    const wolf = d.spawn('kagarou', { species: 'kagarou' }, TL, TL[2] ?? 180, { label: false, kind: 'cine' });
    wolf.actor.anim.maxSpeed = 9;
    const fire = (a) => { if (Math.random() < 0.9) this.gfx.fx.particle({ pos: [a.pos.x + (Math.random() - 0.5) * 0.4, a.pos.y + 0.3 + Math.random() * 0.4, a.pos.z + (Math.random() - 0.5) * 0.4], vel: [(Math.random() - 0.5) * 0.6, 1.4, (Math.random() - 0.5) * 0.6], life: 0.6, size: 0.36, size1: 0.05, color: [3, 1.2, 0.3, 1], color1: [1.6, 0.2, 0.05, 0], sprite: SPR.flame }); };
    d.shot({ from: [TL[0] + 6, 3, TL[1] + 9], look: [TL[0], 1, TL[1]], lookTo: [FJ[0], 1, FJ[1]], dur: 2.4, fov: 32, wait: false });
    this.audio.music('tension', { fade: 0.2 });
    await d.glide('kagarou', [FJ[0], FJ[1] - 1.5], { speed: 9, trail: fire });
    this.audio.sfx('whoosh');
    await d.glide('kagarou', [FJ[0], FJ[1] + 1.5], { speed: 8, arc: 1.6, trail: fire });
    // herd scatters
    herd.forEach((_, i) => { const r = w.rec('herd' + i); if (r) { r.scripted = true; d.run('herd' + i, [P[0] + (i - 2) * 3, P[1] - 3 + (i % 2) * 6]); } });
    for (let i = 0; i < 5; i++) d.run('hen' + i, [Fm[0] - 3 + i, Fm[1] + 4]);
    d.run('cab1', [Fd[0] - 4, Fd[1] + 3]); d.run('cab2', [Fd[0] + 4, Fd[1] + 3]);
    d.mode('mog', 'sit');
    d.shot({ from: [WS[0] + 5.5, 2.2, WS[1] + 5.5], look: [WS[0], 0.8, WS[1]], dur: 2, fov: 30, wait: false });
    await d.glide('kagarou', WS, { speed: 9, trail: fire });
    this.gfx.fx.shape({ kind: 'ring', pos: [WS[0], 0.1, WS[1]], r0: 0.3, r1: 3.6, life: 0.6, color: 0xff7a2a, intensity: 3 });
    this.gfx.impact(0.8);
    d.face('kagarou', 'farmer');
    d.play('kagarou', 'roar');
    this.audio.sfx('pyro_boom');
    d.closeUp('kagarou', { dist: 3.2, angle: 0.4, dur: 3, push: true, y: 0.6 });
    for (let i = 0; i < 40; i++) fire(wolf.actor);
    await d.say('farmer', 'A-a Kagarou?! Fire wolves never leave the mountains…', { expr: 'ko', play: 'shocked' });
    d.play('dog', 'stomp'); d.emote('dog', 'anger');
    await wait(400);
    d.run('dog', [Fm[0] - 3, Fm[1] + 1]);
    // the sky whale passes
    d.face('kagarou', 180);
    await wait(600);
    d.play('kagarou', 'sniff');
    await wait(900);
    const sky = d.spawn('polaris', { species: 'polaris' }, [WS[0] - 40, WS[1] - 30], 60, { label: false, kind: 'cine', scale: 3.2 });
    sky.actor.pos.y = 22; sky.actor.mode('float');
    d.shot({ from: [WS[0] + 6, 1.4, WS[1] + 6], look: [WS[0], 3, WS[1]], lookTo: [WS[0] - 4, 16, WS[1] - 10], dur: 3.5, fov: 40, fov1: 46, wait: false });
    this.audio.sfx('whoosh', { pitch: 0.4, vol: 0.9 });
    d.shootingStar(WS, { dur: 2200 });
    this.audio.music('night', { fade: 1.2 });
    await d.glide('polaris', [WS[0] + 10, WS[1] - 6], { alt: 22, speed: 7, animSpeed: 2 });
    d.play('kagarou', 'roar'); this.audio.sfx('beast_roar', { pitch: 1.25, vol: 0.7 });
    d.glide('polaris', [WS[0] + 60, WS[1] + 10], { alt: 26, speed: 8, animSpeed: 2 });
    await d.say('farmer', 'The sky whale… *Polaris*? Grandpa\'s old stories were true…', { expr: 'ko' });
    d.shot({ from: [WS[0] + 5, 2, WS[1] + 6], look: [WS[0], 0.8, WS[1]], dur: 1.6, wait: false });
    d.face('kagarou', 'treeline');
    await wait(500);
    d.glide('kagarou', [FJ[0], FJ[1] + 1.5], { speed: 9, trail: fire }).then(() => d.glide('kagarou', [FJ[0], FJ[1] - 1.5], { speed: 8, arc: 1.6, trail: fire })).then(() => d.glide('kagarou', TL, { speed: 9, trail: fire }));
    await wait(1400);
    d.closeUp('farmer', { dist: 3, angle: 0.4, dur: 3, push: true });
    await d.say('farmer', 'Something is waking up out there. Something big.', { play: 'think' });
    await d.fadeOut(900);
    for (const id of [...w.actors.keys()]) if (id !== 'player' && id !== 'buddy') w.removeActor(id);
    d.end({ keepCam: true, control: false });
    this.audio.music('title', { fade: 1 });
    await d.titleCard('ELEMON', 'Episode 1 — Soul Link', 3400);
  }

  // ================================================================== character creator
  async creator() {
    this.setClock(1, 7.6);
    await this.loadMap('castle_park', 'castle_view', { music: 'title' });
    this.w.actor('player').setVisible(false);
    const c = this.w.resolvePoint('castle_view');
    this.gfx.rig.play({ look: [c[0], 6, c[1] - 6], from: [c[0], 6, c[1]], orbit: [0.4, 1.2], radius: 22, height: 8, dur: 50, fov: 36, ease: 'linear' });
    await this.ui.fade(false, 900);
    await this.ui.caption('Osaka City — the next morning', 2400);
    const r = await this.app.screens.creator();
    this.s.player.name = r.name; this.s.player.look = r.look; this.s.player.preset = r.preset;
    this.w.ensurePlayer();
  }

  // ================================================================== DAY 1 — Osaka Castle Park
  async day1Park(resumeAfterStarter = false) {
    const d = this.d, w = this.w, s = this.s;
    this.locked = true; this.lockMsg = 'Coach Gonda is waiting at the training ground!';
    s.story.beat = 'day1_park';
    if (!resumeAfterStarter) {
      await this.ui.fade(true, 400);
      this.setClock(1, 8.5);
      await this.loadMap('castle_park', 'gate', { music: 'park' });
      const gate = w.resolvePoint('gate'), mm = w.resolvePoint('mika_meet');
      this.ensure('mika', 'mika', mm, 0);
      this.ensure('coach', 'coach', 'coach', 0);
      const co = w.resolvePoint('coach');
      this.ensure('coach_mon', { species: 'kanizumo' }, [co[0] + 1.6, co[1] + 0.4], 0, { label: false });
      this.spawnPods();
      d.begin();
      d.shot({ from: [gate[0] + 16, 14, gate[1] - 26], to: [gate[0] + 7, 6, gate[1] + 6], look: [gate[0], 8, gate[1] - 30], lookTo: [gate[0], 1, gate[1] - 2], dur: 6, fov: 36, wait: false });
      await this.ui.fade(false, 1200);
      await d.titleCard('Day 1', 'Osaka Castle Park — Morning', 2600);
      d.walk('player', [gate[0], gate[1] - 3]);
      await wait(800);
      d.emote('mika', '!');
      d.play('mika', 'wave');
      await d.run('mika', [gate[0] + 0.4, gate[1] - 4.6]);
      d.faceEach('mika', 'player');
      d.twoShot('player', 'mika', { push: true });
      await d.say('mika', `There you are, ${s.player.name}! Did you even sleep? Today's *THE* day!`, { play: 'hop' });
      const a = await d.ask('mika', 'Five Elemon. Five elements. One of them picks YOU. Nervous?', ['Barely slept a wink!', 'Born ready.', 'What if none of them like me…?']);
      if (a === 0) await d.say('mika', 'Same! I was up at 4am polishing my soul stone. It\'s already shiny. It was ALWAYS shiny.', { play: 'laugh' });
      else if (a === 1) await d.say('mika', 'Ooh, look at Mr./Ms. Confident! Coach is gonna love that. Or hate it. Fifty-fifty.', { play: 'laugh' });
      else await d.say('mika', 'Are you kidding? Elemon can feel your heart through the stone. Yours is like… a big golden retriever.', { play: 'happy' });
      await d.say('mika', 'Coach Gonda is waiting at the training ground — straight up the path. Last one there buys the takoyaki!');
      d.run('mika', [co[0] - 2.2, co[1] + 1.8]).then(() => d.face('mika', 'player'));
      d.end();
      s.quests.main_soul_link || this.game.startQuest('main_soul_link');
      this.app.updateObjective();
      this.ui.tutorial({ text: '*Tap the ground* to walk there. Tap people to talk. (Keyboard: WASD to move, E to interact.)', kicker: 'How to play', top: '14%' });
      setTimeout(() => this.ui.tutDone(), 5200);
      await this.waitNear('coach', 5);
      this.ui.tutDone();
      await this.coachIntro();
    }
    await this.parkBattles();
  }
  spawnPods() {
    const pd = this.w.resolvePoint('pedestals') || [25, 33, 90];
    STARTERS.forEach((sp, i) => {
      const r = this.ensure('pod_' + sp, { species: sp }, [pd[0], pd[1] - 2.4 + i * 1.2], pd[2] ?? 90, { label: false, kind: 'cine' });
      if (!r) return;
      let t = Math.random() * 2;
      r.actor.onUpdate = (dt) => {
        t += dt;
        if (t > 1.6) {
          t = 0;
          const a = r.actor, col = ELEMENTS[elemsOf(SPECIES[sp])[0]].color;
          this.gfx.fx.shape({ kind: 'ring', pos: [a.pos.x, a.pos.y + 0.05, a.pos.z], r0: 0.25, r1: 0.8, life: 1.2, color: parseInt(col.slice(1), 16), intensity: 2.2 });
        }
      };
    });
  }
  async coachIntro() {
    const d = this.d, s = this.s;
    await d.scene(async () => {
      d.faceEach('coach', 'player');
      d.closeUp('coach', { dist: 3.6, angle: 0.5, dur: 3, push: true });
      await d.say('coach', 'HAH! The rookie finally shows up. I\'m Gonda — ex-Kansai League pro, current snack enthusiast.', { play: 'laugh' });
      this.set('met_coach');
      await d.say('coach', 'Rule one: Elemon are protected by law. No license, no capturing, no commanding wild ones. Period.', { play: 'point' });
      await d.say('coach', 'But THIS lets an Elemon choose you.', { play: 'command' });
      S.addItem(s, 'soul_link', 1);
      d.closeUp('player', { dist: 2.6, angle: -0.4, y: 0.6, dur: 2.5 });
      this.ui.callout('SOUL-LINK BRACELET', 'Your soul stone glows cyan', '#5ff4ff', 2200);
      this.audio.stinger && this.audio.stinger('reward');
      const p = this.w.actor('player');
      this.gfx.fx.shape({ kind: 'ring', pos: [p.pos.x, p.pos.y + 1, p.pos.z], r0: 0.1, r1: 1.4, life: 0.8, color: 0x3ff0ff, intensity: 3, vertical: true });
      d.play('player', 'cheer');
      await wait(1300);
      await d.say('coach', 'The soul stone links your heart to your partner\'s. Strong bond, strong Elemon. Weak bond… well. They might just ignore you.');
      // the pods
      const pd = this.w.resolvePoint('pedestals');
      d.shot({ from: [pd[0] + 6, 2.4, pd[1] + 1], to: [pd[0] + 5, 2, pd[1] - 1], look: [pd[0], 0.5, pd[1]], dur: 5, fov: 40, wait: false });
      await d.say('coach', 'Five rookies, five elements: *Pyro*, *Hydro*, *Bio*, *Geo* and *Echo*. Each one fights in its own style.');
      for (const sp of STARTERS) { d.play('pod_' + sp, 'happy'); await wait(160); }
      await d.say('coach', 'Go on. Meet them. When your stone resonates with one — you\'ll know.');
      await this.chooseStarter();
    }, { control: false });
  }
  async chooseStarter() {
    const d = this.d, s = this.s;
    const pd = this.w.resolvePoint('pedestals');
    d.place('player', [pd[0] + 3, pd[1]], 270);
    d.shot({ from: [pd[0] + 8, 3, pd[1] + 1.5], look: [pd[0], 0.6, pd[1]], dur: 2, fov: 36, wait: false });
    this.audio.music('park', { fade: 1 });
    const pick = await this.app.screens.starterSelect();
    const name = SPECIES[pick].name;
    const mon = S.giveStarter(s, pick, 5);
    this.set('starter', pick); this.set('starter_uid', mon.uid); this.set('got_starter');
    const id = 'pod_' + pick;
    const a = this.w.actor(id);
    d.closeUp(id, { dist: 3, angle: 0.3, dur: 2.5, push: true, y: 0.6 });
    d.play(id, 'victory'); d.emote(id, 'heart');
    await wait(1200);
    const pl = this.w.actor('player');
    await d.run(id, [pl.pos.x - 1.1, pl.pos.z], { stop: 0.3 });
    d.face(id, 'player'); d.face('player', id);
    d.twoShot('player', id, { dist: 4.2, push: true });
    await wait(300);
    d.soulLink(id, parseInt(ELEMENTS[elemsOf(SPECIES[pick])[0]].color.slice(1), 16));
    await d.titleCard('SOUL LINK!', `${s.player.name} ♥ ${name}`, 2200);
    // swap the cutscene actor for the real party buddy
    const bp = a.pos.clone();
    this.w.removeActor(id);
    this.w.refreshBuddy(true);
    this.w.place('buddy', bp.x, bp.z);
    d.face('buddy', 'player');
    await d.say('buddy', this.buddyCry(), { play: 'happy', emote: 'heart' });
    // the other pods return home — Kaito's pick stays for later
    for (const sp of STARTERS) if (sp !== pick && sp !== COUNTER[pick]) { const r = this.w.rec('pod_' + sp); if (r) { r.actor.dissolve(1, 0.8); setTimeout(() => this.w.removeActor('pod_' + sp), 850); } }
    d.walk('coach', [pl.pos.x + 1.8, pl.pos.z - 1.4]).then(() => d.face('coach', 'player'));
    d.walk('mika', [pl.pos.x + 1.4, pl.pos.z + 1.6]).then(() => d.face('mika', 'player'));
    await wait(1200);
    d.twoShot('player', 'coach', { dist: 6 });
    await d.say('coach', `Ha! The stone's glowing already. ${name} picked you right back. That's a strong link.`, { play: 'laugh' });
    await d.say('coach', ELEM_TALK[elemsOf(SPECIES[pick])[0]]);
    await d.say('coach', 'Every Elemon has five core stats: *Damage, Element, Defense, Speed* and *Health*. Level up, earn stat points, unlock skills. Simple.');
    await d.say('mika', `My turn to show off! This is Zappy — my Zapanda. We've been training for a WHOLE week.`, { play: 'cheer' });
    const mk = this.w.actor('mika');
    this.ensure('zappy', { species: 'zapanda' }, [mk.pos.x + 0.9, mk.pos.z + 0.5], 0, { label: false });
    this.d.emote('zappy', 'note');
    await d.say('coach', 'Alright, enough chit-chat. Let\'s see what you two can do. Practice battle — me and Kanizumo. He\'ll go easy. Probably.', { play: 'flex' });
    this.app.saveGame(true);
  }

  async parkBattles() {
    const d = this.d, s = this.s;
    const w = this.w;
    if (!w.rec('coach')) {
      // resumed from a save after the starter pick
      this.setClock(1, 10);
      await this.loadMap('castle_park', 'ground_center', { music: 'park' });
      this.ensure('coach', 'coach', 'coach', 0);
      const co = w.resolvePoint('coach');
      this.ensure('mika', 'mika', [co[0] - 2.2, co[1] + 1.8], 180);
      this.ensure('zappy', { species: 'zapanda' }, [co[0] - 3, co[1] + 2.3], 180, { label: false });
      this.ensure('coach_mon', { species: 'kanizumo' }, [co[0] + 1.6, co[1] + 0.4], 0, { label: false });
      if (!this.F('starter')) this.set('starter', s.party[0].species);
      const cp = COUNTER[this.s.flags.starter];
      const pd = w.resolvePoint('pedestals');
      if (cp && !this.F('fought_kaito')) this.ensure('pod_' + cp, { species: cp }, [pd[0], pd[1]], 90, { label: false, kind: 'cine' });
      await this.ui.fade(false, 700);
    }
    // ---- coach tutorial battle
    if (!this.F('beat_coach')) {
      d.begin();
      const ar = w.arena('main');
      d.walk('player', [ar.x, ar.z + 3]); d.walk('coach', [ar.x, ar.z - 4]);
      await wait(600);
      d.end({ control: false });
      const res = await this.game.trainerBattle({
        arena: 'main', foes: [{ id: 'coach', name: 'Coach Gonda', ai: 'tutorial', team: [['kanizumo', 4, { skills: ['crab_hammer', 'water_jet'] }]], hideActor: 'coach_mon' }],
        title: 'Practice Battle!', subtitle: 'Coach Gonda wants to see what you\'ve got', music: 'battle', canLose: true, expMul: 1.6, seed: 77,
        tutorial: (c) => this.coachTutorial(c), colors: ['#ff7a2f', '#2fa8ff'],
      });
      this.set('beat_coach');
      await d.scene(async () => {
        d.faceEach('coach', 'player');
        d.closeUp('coach', { dist: 3.4, dur: 3 });
        if (res && res.winner === 0) await d.say('coach', 'Not bad, rookie! You actually listened. Do you know how rare that is?', { play: 'laugh' });
        else await d.say('coach', 'Heh. Kanizumo got a little excited. Don\'t sweat it — losing to me is a rite of passage.', { play: 'shrug' });
        await d.say('coach', 'Your bracelet resonated during that fight. Look — the stone\'s brighter.');
        this.unlockSlot('active', 3, 'Your bond grew stronger');
        await wait(600);
        S.healParty(s, 1);
        this.ui.toast('Your team was healed.', 'good');
      }, { control: false });
    }
    // ---- rival
    if (!this.F('fought_kaito')) await this.rivalScene();
    await this.leavePark();
  }
  async coachTutorial(c) {
    const me = () => c.me && c.me.id;
    const T = 22000;
    c.setNoFaint(true); c.pauseAI(true);
    await c.wait(0.8);
    c.tip('*Tap the ground* to move your Elemon. It goes where you point.', null, { tap: true, top: '12%', kicker: 'Coach Gonda' });
    await Promise.race([c.wait(6), new Promise((r) => { const iv = setInterval(() => { if (!c.scene.ui._tutRes) { clearInterval(iv); r(); } }, 200); })]);
    c.tipDone();
    c.tip('Tap *ATTACK* to strike (or tap the enemy to target it). Basic hits build energy.', 'attack', { kicker: 'Coach Gonda', top: '12%' });
    await c.waitEvent('hit', (e) => e.src === me(), T);
    c.tipDone(); await c.wait(1.2);
    c.tip('*Skills!* Drag a skill button to aim, release to fire. A quick tap auto-aims at your target.', 'skill0', { kicker: 'Coach Gonda', top: '12%' });
    await c.waitEvent('cast', (e) => e.u === me(), T);
    c.tipDone(); await c.wait(1.5);
    c.tip('Kanizumo is winding up! *Swipe* the screen — or tap DODGE — to dash out of the way.', 'dodge', { kicker: 'Coach Gonda', top: '12%' });
    c.foeCmd({ type: 'skill', id: 'crab_hammer' });
    await c.waitEvent('dodge', (e) => e.u === me(), T);
    c.tipDone(); await c.wait(1.5);
    c.tip('Now block! Tap *PARRY* right as the hit lands. Perfect timing reflects damage back!', 'parry', { kicker: 'Coach Gonda', top: '12%' });
    const iv = setInterval(() => c.foeCmd({ type: 'attack' }), 1400);
    await c.waitEvent('parry', (e) => e.u === me(), T);
    clearInterval(iv);
    c.tipDone(); await c.wait(1.2);
    c.tip('*Combos* chain basic actions:\nGRAB → PARRY → ATTACK = Reversal Suplex\nCHARGE → ATTACK = Elemental Strike\nTry one!', 'charge', { kicker: 'Coach Gonda', top: '12%' });
    await c.waitEvent('combo', (e) => e.u === me(), 26000);
    c.tipDone();
    c.tip('That\'s the basics! Mix it all up — now *win it!*', null, { tap: true, kicker: 'Coach Gonda', top: '12%' });
    setTimeout(() => c.tipDone(), 3000);
    c.setNoFaint(false); c.pauseAI(false);
  }
  async rivalScene() {
    const d = this.d, s = this.s, w = this.w;
    const cp = COUNTER[this.s.flags.starter] || 'takopo';
    const ke = w.resolvePoint('kaito_enter');
    await d.scene(async () => {
      this.ensure('kaito', 'kaito', ke, 270);
      const pl = w.actor('player');
      d.shot({ from: [ke[0] - 4, 2.2, ke[1] + 5], look: [ke[0], 1.1, ke[1]], lookTo: [pl.pos.x + 3, 1.1, pl.pos.z], dur: 4.5, fov: 32, wait: false });
      this.audio.music('tension', { fade: 0.8 });
      await d.walk('kaito', [pl.pos.x + 3.2, pl.pos.z - 0.6]);
      d.faceEach('kaito', 'player');
      d.closeUp('kaito', { dist: 3, angle: 0.5, push: true });
      await d.say('kaito', 'So the new kid got a partner. Cute.', { play: 'shrug' });
      await d.say('coach', 'Kaito! You\'re late — again. Fine, you get second pick.');
      await d.say('mika', '(Ugh, Kaito Kurosawa. Top of every class. Annoyingly good hair.)', { expr: 'angry' });
      const pd = w.resolvePoint('pedestals');
      await d.walk('kaito', [pd[0] + 1.6, pd[1]]);
      d.face('kaito', 'pod_' + cp);
      d.closeUp('pod_' + cp, { dist: 2.8, push: true, y: 0.6 });
      await wait(700);
      d.play('pod_' + cp, 'happy');
      d.soulLink('pod_' + cp, 0xff3a5a);
      await wait(900);
      await d.say('kaito', `${SPECIES[cp].name}. ${ELEMENTS[elemsOf(SPECIES[cp])[0]].name} beats ${ELEMENTS[elemsOf(SPECIES[s.flags.starter])[0]].name}. Type advantage — basic strategy, rookie.`, { cam: { dist: 3, angle: -0.4 } });
      const r = await d.ask('kaito', 'Well? You gonna stand there, or do you want to lose properly?', ['Bring it on!', 'Type advantage isn\'t everything.']);
      if (r === 1) await d.say('kaito', 'Heh. Spoken like someone about to lose.', { play: 'shrug' });
      await d.say('coach', 'Ha! A rivalry on day one. I love it. Same rules — first to faint loses!', { play: 'laugh' });
      w.removeActor('pod_' + cp);
    }, { control: false });
    const res = await this.game.trainerBattle({
      arena: 'main', foes: [{ id: 'kaito', name: 'Kaito', ai: 'normal', team: [[cp, 5]] }],
      title: 'RIVAL BATTLE!', subtitle: 'Kaito Kurosawa wants to prove a point', music: 'battle', canLose: true, colors: ['#e8233a', '#1b1230'], seed: 1234,
    });
    const won = res && res.winner === 0;
    this.set('fought_kaito'); this.set('beat_kaito_1', won);
    await d.scene(async () => {
      d.faceEach('kaito', 'player');
      d.closeUp('kaito', { dist: 3, angle: 0.4 });
      if (won) {
        await d.say('kaito', '…Hmph. Beginner\'s luck. Don\'t let it go to your head.', { play: 'shrug', expr: 'angry' });
        await d.say('kaito', 'See you at the League. I\'ll be the one holding the trophy.');
      } else {
        await d.say('kaito', 'As expected. Type advantage. Strategy. Learn it.', { play: 'shrug' });
        await d.say('mika', 'Hey! It was close and you KNOW it!', { play: 'stomp', expr: 'angry' });
        await d.say('kaito', 'Close is still a loss. See you at the League — if you even register.');
      }
      const ke2 = w.resolvePoint('kaito_enter');
      d.walk('kaito', ke2).then(() => w.removeActor('kaito'));
      await wait(1500);
      d.twoShot('player', 'coach', { dist: 6 });
      await d.say('coach', 'Don\'t mind him. Kaito\'s all bark and… okay, also a lot of bite. But you\'ll catch up.');
      await d.say('coach', 'You both did great. You know what that means…', { play: 'think' });
      await d.say('mika', 'ICE CREAM!!', { play: 'cheer' });
      await d.say('coach', 'Ice cream! On me! Yellow Submarine Soft-Serve in *Dotonbori*. Open your map and meet us there.', { play: 'laugh' });
      this.set('unlock_dotonbori');
      S.unlockLocation(s, 'dotonbori');
      this.ui.toast('🗺️ New location: Dotonbori', 'gold', 3000);
    }, { control: false });
  }
  async leavePark() {
    this.setClock(1, 13.8);
    this.locked = false;
    this.w.removeActor('coach'); this.w.removeActor('coach_mon'); this.w.removeActor('mika'); this.w.removeActor('zappy');
    this.s.story.beat = 'day1_dotonbori';
    this.app.saveGame(true);
    this.freeRoam();
    this.app.clockRunning = false;
    this.ui.tutorial({ text: 'Tap the *🗺️ Map* button (top right) to travel around Osaka.', target: this.app.hud.mapBtn, kicker: 'Travel' });
    setTimeout(() => this.ui.tutDone(), 6000);
  }

  // ================================================================== DAY 1 — Dotonbori
  async onArrive(map, locId) {
    const F = (k) => this.F(k);
    if (map === 'dotonbori' && F('fought_kaito') && !F('beat_metallica_1')) return this.day1Dotonbori();
    if (map === 'umeda' && F('day1_done') && !F('license')) return this.day2Register();
    if (map === 'umeda' && F('license') && this.s.time.day >= 5 && S.rankOf(this.s).pts >= 100 && !F('rookie_cup')) return this.rookieCup();
    if (map === 'shinsekai' && !F('seen_shinsekai')) { this.set('seen_shinsekai'); await this.d.scene(async () => { const t = this.w.resolvePoint('tower_view'); if (t) await this.d.shot({ from: [t[0] + 10, 6, t[1] + 12], look: [t[0], 8, t[1] - 6], dur: 4, fov: 38 }); await this.ui.caption('Shinsekai — the "New World" of 1912… and Team Metallica\'s turf.', 3000); }); }
    if (map.startsWith('minoh') && !F('seen_minoh')) { this.set('seen_minoh'); await this.ui.caption('Minoh Safari Reserve — move carefully. Tall grass hides you.', 3200); }
    this.spawnServiceNpcs(map);
  }
  async day1Dotonbori() {
    const d = this.d, s = this.s, w = this.w;
    this.locked = true; this.lockMsg = 'Your friends are waiting for ice cream!';
    if (s.time.hour < 14) this.setClock(1, 14.5);
    this.ensure('mika', 'mika', w.resolvePoint('arrive') ? d.offset('arrive', 1.5, -1.2) : 'arrive', 90);
    this.ensure('coach', 'coach', d.offset('arrive', 1.6, 1.4), 90);
    this.ensure('zappy', { species: 'zapanda' }, d.offset('arrive', 0.6, -2), 90, { label: false });
    this.spawnServiceNpcs('dotonbori');
    this.ensure('taro', 'taro', 'taro', null);
    const tp = w.resolvePoint('taro');
    this.ensure('beatlet_npc', { species: 'beatlet' }, [tp[0] + 0.8, tp[1] + 0.4], 270, { label: false });
    if (!this.F('icecream')) {
      await d.scene(async () => {
        const cv = w.resolvePoint('canal_view') || w.resolvePoint('bridge');
        d.shot({ from: [cv[0] + 10, 9, cv[1] + 10], to: [cv[0] + 4, 5, cv[1] + 6], look: [cv[0] + 2, 3, cv[1] - 12], dur: 6, fov: 38, wait: false });
        await this.ui.caption('Dotonbori — Namba, Chuo Ward', 2600);
        d.twoShot('mika', 'coach', { dist: 6 });
        await d.say('mika', 'Waaah, the giant crab sign is MOVING! Zappy, look!', { play: 'point' });
        d.emote('zappy', 'note');
        await d.say('coach', 'Yellow Submarine is just down the street. Go on, pick your flavours!');
      });
      this.follow(['mika', 'zappy', 'coach']);
      this.app.updateObjective();
      await this.waitNear('icecream', 2.4);
      await this.iceCream();
    }
    await this.metallicaScene();
  }
  async iceCream() {
    const d = this.d, s = this.s, w = this.w;
    await d.scene(async () => {
      const ic = w.resolvePoint('icecream');
      this.ensure('clerk', 'clerk', [ic[0], ic[1] - 2.2], 0);
      d.face('player', 'clerk');
      d.closeUp('clerk', { dist: 3.2, angle: 0.3 });
      await d.say('clerk', 'Welcome to Yellow Submarine Soft-Serve! We all live on… ice cream! What\'ll it be?', { play: 'wave' });
      await this.meal(MEALS.icecream);
      this.set('icecream');
      // the gang sits by the canal
      const tb = w.resolvePoint('icecream_table');
      this.w.setFollowers([]);
      d.walk('mika', [tb[0] - 1, tb[1]]); d.walk('coach', [tb[0] + 1.2, tb[1] + 0.2]); d.walk('zappy', [tb[0] - 1.8, tb[1] + 0.8]);
      await d.walk('player', [tb[0], tb[1] + 0.6]);
      d.walk('buddy', [tb[0] + 0.4, tb[1] + 1.4]);
      d.face('player', 'mika'); d.face('mika', 'player'); d.face('coach', 'player');
      this.setClock(1, 16.2);
      d.twoShot('mika', 'coach', { dist: 6.5, side: 0.5 });
      await d.say('mika', 'Mmmh! Brain freeze! Worth it.', { play: 'happy' });
      await d.say('coach', 'Tomorrow you two register for the *Kansai League* at Umeda HQ. You\'ll get your Tamer License, and the real fun begins.');
      await d.say('mika', 'And then the Safari! I\'m gonna catch SO many Elemon. Fifty. No — a hundred.', { play: 'cheer' });
      await d.say('coach', 'Ha! Every capture needs a gem in your keychain device. Gems cost money. Money costs… winning.');
      const tp = w.resolvePoint('taro');
      d.shot({ from: [tp[0] + 4, 2, tp[1] + 4], look: [tp[0], 0.8, tp[1]], dur: 3, fov: 32, wait: false });
      d.play('taro', 'hop'); d.play('beatlet_npc', 'headbang');
      await d.say('taro', 'Beatlet, one more time! One-two-three-four!', { play: 'cheer' });
      await d.say('mika', 'Aww, that kid\'s Beatlet is headbanging. It\'s a little bug rock star!', { play: 'laugh' });
    }, { control: false });
  }
  async metallicaScene() {
    const d = this.d, s = this.s, w = this.w;
    const pe = w.resolvePoint('punks_enter'), vd = w.resolvePoint('vendor');
    await d.scene(async () => {
      this.audio.music('tension', { fade: 0.6 });
      this.ensure('vendor', 'vendor', 'vendor', 0);
      this.ensure('thrash', 'thrash', pe, 270); this.ensure('riff', 'riff', [pe[0] + 1.2, pe[1] - 1.1], 270); this.ensure('moshi', 'moshi', [pe[0] + 1.2, pe[1] + 1.1], 270);
      this.ensure('thrash_mon', { species: 'thrashark' }, [pe[0] + 2.4, pe[1]], 270, { label: false });
      d.shot({ from: [pe[0] - 6, 2.4, pe[1] + 5], look: [pe[0], 1.2, pe[1]], lookTo: [vd[0] + 2, 1.2, vd[1]], dur: 5, fov: 34, wait: false });
      this.gfx.rig.shake(0.15);
      d.walk('riff', [vd[0] + 2.4, vd[1] + 1.4]); d.walk('moshi', [vd[0] + 2.6, vd[1] + 3]); d.walk('thrash_mon', [vd[0] + 3.6, vd[1] + 2.4]);
      await d.walk('thrash', [vd[0] + 1.6, vd[1] + 2.2]);
      d.face('thrash', 'vendor'); d.face('vendor', 'thrash');
      d.play('moshi', 'headbang');
      d.closeUp('thrash', { dist: 3, angle: 0.6, push: true });
      await d.say('thrash', 'Yo, Taisho! Rent\'s due. Team Metallica protection fee — ten thousand yen.', { play: 'point' });
      await d.say('vendor', 'Protection?! From what?!', { play: 'shocked' });
      await d.say('riff', 'From us! Heh heh heh.', { play: 'laugh' });
      await d.say('moshi', '…Mosh.', { play: 'headbang' });
      d.run('taro', [vd[0] + 1, vd[1] + 3.2]).then(() => d.face('taro', 'thrash'));
      d.run('beatlet_npc', [vd[0] + 0.3, vd[1] + 3.6]).then(() => d.face('beatlet_npc', 'thrash'));
      await wait(900);
      await d.say('taro', 'L-leave him alone! Beatlet, use… use your rock powers!', { play: 'stomp' });
      d.play('beatlet_npc', 'attack');
      d.play('thrash_mon', 'roar'); this.audio.sfx('beast_roar', { pitch: 1.3, vol: 0.5 });
      d.play('beatlet_npc', 'hit'); d.emote('beatlet_npc', 'sweat');
      await d.say('thrash', 'Cute bug. Beat it, kid. Get it? BEAT it?', { play: 'laugh' });
      // the player steps in
      d.walk('player', [vd[0] + 0.2, vd[1] + 5]); d.walk('buddy', [vd[0] - 0.8, vd[1] + 5.4]);
      d.walk('mika', [vd[0] + 1.2, vd[1] + 5.6]); d.walk('coach', [vd[0] - 1.4, vd[1] + 6]); d.walk('zappy', [vd[0] + 2.2, vd[1] + 6.2]);
      await wait(1400);
      d.face('player', 'thrash'); d.face('thrash', 'player');
      const r = await d.ask('player', '…', ['Hey! Back off!', 'Pick on someone your own size.', '(Crack your knuckles)'], { name: s.player.name });
      d.play('player', r === 2 ? 'flex' : 'point');
      d.closeUp('thrash', { dist: 3.2, angle: -0.5, push: true });
      await d.say('thrash', 'Ohhh, a rookie hero. With a baby Elemon. Adorable.', { play: 'laugh' });
      await d.say('thrash', 'Tell you what. Team Metallica plays *3 on 3*. You, Pinky over there, and Grandpa.', { play: 'command' });
      await d.say('coach', 'GRANDPA?!', { play: 'stomp', expr: 'angry' });
      await d.say('thrash', 'We win, the stall pays double. You win… we\'ll leave. For today.');
      d.twoShot('player', 'coach', { dist: 5 });
      await d.say('coach', `Hold on. ${nameOf(s.party[0])} is worn out after this morning.`);
      d.face('coach', 'taro');
      await d.say('coach', 'Kid — would you lend your Beatlet to my rookie here? Just for one battle.');
      await d.say('taro', 'B-Beatlet…? …Okay. Beatlet, go help them! Kick their butts!', { play: 'cheer' });
      d.run('beatlet_npc', [w.actor('player').pos.x - 0.8, w.actor('player').pos.z - 0.6]).then(() => d.face('beatlet_npc', 'thrash'));
      await wait(900);
      d.soulLink('beatlet_npc', 0x8aff3a);
      await d.say('mon:beatlet', 'Beat-beat-LET! ♪', { play: 'headbang' });
      await d.say('coach', 'Beatlet leads. Switch to your partner when the moment\'s right — *switching is half of strategy.*');
    }, { control: false });
    // borrowed Beatlet (not yet in the party)
    const bt = createElemon('beatlet', { level: 6, ot: 'Taro', friendship: 120 });
    bt.skills.active = ['mop_top_spin', 'seed_shot'];
    const st = this.starter();
    const before = st.hp; st.hp = Math.min(st.hp, 0.85);
    const res = await this.game.trainerBattle({
      arena: 'bridge', only: [bt, st], partySize: 2,
      allies: [{ id: 'mika', name: 'Mika', ai: 'normal', team: [['zapanda', 6]], hideActor: 'zappy' }, { id: 'coach', name: 'Coach Gonda', ai: 'ally', team: [['kanizumo', 8, { skills: ['crab_hammer', 'shiko_stomp', 'bubble_trap'] }]] }],
      foes: [{ id: 'thrash', name: 'Thrash', ai: 'punk', team: [['thrashark', 7]], hideActor: 'thrash_mon' }, { id: 'riff', name: 'Riff', ai: 'normal', team: [['studrat', 6]] }, { id: 'moshi', name: 'Moshi', ai: 'normal', team: [['moshbull', 6]] }],
      title: 'TEAM METALLICA!', subtitle: '3 vs 3 on Ebisu Bridge', music: 'battle_punk', canLose: true, money: 1500, colors: ['#33d65a', '#1b1230'], seed: 4242,
      tutorial: (c) => this.punkTutorial(c),
    });
    if (before > st.hp) st.hp = Math.max(st.hp, 0.3);
    const won = res && res.winner === 0;
    this.set('beat_metallica_1'); if (!won) this.set('lost_metallica_1');
    await this.afterMetallica(won, bt);
  }
  async punkTutorial(c) {
    const T = 26000;
    await c.wait(1);
    c.tip('*3 vs 3!* Each trainer commands one Elemon on the field. You\'re controlling Beatlet — Mika and Coach handle theirs.', null, { tap: true, kicker: 'Coach Gonda', top: '12%' });
    await Promise.race([c.wait(7), new Promise((r) => { const iv = setInterval(() => { if (!c.scene.ui._tutRes) { clearInterval(iv); r(); } }, 200); })]);
    c.tipDone(); await c.wait(5);
    c.tip('*Switch!* Tap your benched Elemon to swap in. Attack right after switching for a *TAG STRIKE*.', 'bench', { kicker: 'Coach Gonda', top: '12%' });
    await c.waitEvent('switch', (e) => e.trainer === 'player', T);
    c.tipDone(); await c.wait(3);
    c.tip('Different elements react! An enemy glowing with one element + a different element hit = *REACTION*. Water + fire = STEAM EXPLOSION!', null, { tap: true, kicker: 'Mika', top: '12%' });
    await c.wait(6); c.tipDone();
    // wait for the team gauge
    for (let i = 0; i < 90 && c.st && !c.st.over && c.st.sides[0].meter < 100; i++) await c.wait(0.5);
    if (c.st && !c.st.over) {
      c.tip('The *TEAM* gauge is full! Tap TEAM COMBO — your allies join a massive combined attack. Hit the timing ring!', 'team', { kicker: 'Coach Gonda', top: '12%' });
      await c.waitEvent('teamCombo', null, T);
      c.tipDone();
    }
  }
  async afterMetallica(won, borrowed) {
    const d = this.d, s = this.s, w = this.w;
    await d.scene(async () => {
      this.audio.music('dotonbori', { fade: 1 });
      d.faceEach('thrash', 'player');
      d.closeUp('thrash', { dist: 3.2, angle: 0.5 });
      if (won) {
        await d.say('thrash', 'Tch… You got lucky, rookie. Lucky!', { play: 'stomp', expr: 'angry' });
        await d.say('riff', 'Boss, the drone cops are coming!', { play: 'shocked' });
      } else {
        await d.say('thrash', 'HAH! Team Metallica rules Osaka! Now pay up, Tai—', { play: 'laugh' });
        this.audio.sfx('alert', { pitch: 1.4 });
        await d.say('riff', 'Boss! Police drones! Three of them!', { play: 'shocked' });
      }
      await d.say('thrash', 'This ain\'t over. We run this town — you\'ll see us in the League. And in your nightmares.', { play: 'point' });
      const pe = w.resolvePoint('punks_enter');
      for (const id of ['thrash', 'riff', 'moshi', 'thrash_mon']) d.run(id, pe).then(() => w.removeActor(id));
      await wait(1200);
      d.face('vendor', 'player');
      d.closeUp('vendor', { dist: 3 });
      await d.say('vendor', 'You kids… thank you! Here — takoyaki, on the house. Eight balls a box!', { play: 'bow' });
      this.game.give('takoyaki', 3);
      d.face('taro', 'player');
      d.closeUp('taro', { dist: 2.6, angle: 0.3, y: 0.6 });
      await d.say('taro', 'That was SO COOL! Beatlet has never fought like that before!', { play: 'hop' });
      d.play('beatlet_npc', 'headbang'); d.emote('beatlet_npc', 'note');
      await d.say('taro', 'He keeps looking at you. I think… he likes you more than me.', { expr: 'sad' });
      await d.say('taro', 'Grandpa says Beatlet needs a real trainer to grow up strong. Will you take him? You can visit me whenever!');
      const r = await d.ask('taro', 'Please?', ['I\'ll take great care of him!', 'Are you sure, Taro?']);
      if (r === 1) await d.say('taro', 'Yeah. He\'d want this. Just… promise you\'ll make him a rock star.', { play: 'nod' });
      borrowed.ot = s.player.name; borrowed.gift = 'Taro'; borrowed.hp = 1;
      S.addElemon(s, borrowed);
      w.removeActor('beatlet_npc');
      this.ui.toast('🎸 Beatlet joined your team!', 'gold', 3200);
      this.audio.stinger && this.audio.stinger('capture');
      await d.say('mon:beatlet', 'Beat-beat-LET! ♪♪', { play: 'headbang' });
      this.set('got_beatlet');
      d.twoShot('player', 'coach', { dist: 5.5 });
      await d.say('coach', 'Hey — your soul stone just pulsed. That team combo synced you with everyone.');
      this.unlockSlot('passive', 1, 'Teamwork resonance');
      await d.say('coach', 'After all that, I\'m STARVING. Abbey Road Okonomiyaki. Dinner. Now.', { play: 'flex' });
      await d.say('mika', 'Yesss! Coach is paying again!', { play: 'cheer' });
      await d.say('coach', 'I did NOT say that.');
    }, { control: false });
    await this.dinner();
  }
  async dinner() {
    const d = this.d, s = this.s, w = this.w;
    await d.scene(async () => {
      const rs = w.resolvePoint('restaurant');
      d.walk('mika', [rs[0] - 1, rs[1] + 1]); d.walk('coach', [rs[0] + 1, rs[1] + 1]);
      await d.walk('player', [rs[0], rs[1] + 1.6]);
      await d.fadeOut(600);
      this.setClock(1, 18.8);
      this.audio.music('dinner', { fade: 1 });
      await d.fadeIn(600);
      d.shot({ from: [rs[0] + 5, 4, rs[1] + 7], look: [rs[0], 2.5, rs[1] - 2], dur: 4, fov: 36, wait: false });
      await this.ui.caption('Abbey Road Okonomiyaki — Evening', 2400);
      await this.meal(MEALS.dinner);
      this.set('dinner');
      // Dr. Hoshino
      const hp = w.resolvePoint('hoshino');
      this.ensure('hoshino', 'hoshino', hp, 225);
      await d.walk('hoshino', [rs[0] + 2.2, rs[1] + 2.4]);
      d.face('hoshino', 'player'); d.face('player', 'hoshino');
      d.closeUp('hoshino', { dist: 3.2, angle: 0.5 });
      await d.say('hoshino', 'Pardon me — that was quite the battle on the bridge. You link remarkably well with your Elemon for a rookie.', { play: 'bow' });
      await d.say('hoshino', 'I am Dr. Hoshino, archaeologist. I study soul stones — and the legends of *Polaris* and *Solaris*.');
      await d.say('mika', 'The sky whale and the sun lion? From the picture books?');
      await d.say('hoshino', 'Picture books, yes. And this morning a farmer in Kishiwada saw a whale-shaped light cross the dawn sky. Along with a fire wolf.', { play: 'think' });
      await d.say('hoshino', 'Fragments of fallen starlight have been appearing in the Minoh forests. If you find any once you\'re licensed… bring them to me. I\'ll be around here most evenings.');
      this.set('hoshino_met');
      this.game.startQuest('fallen_stars');
      await d.say('coach', 'Legends, star fragments… Kid, one thing at a time. Tomorrow: the League.');
    }, { control: false });
    await this.day1Night();
  }
  async day1Night() {
    const d = this.d, s = this.s, w = this.w;
    this.locked = true;
    await this.ui.fade(true, 700);
    this.setClock(1, 21.4);
    await this.loadMap('castle_park', 'bench_night', { music: 'night' });
    for (const id of ['mika', 'coach', 'zappy']) w.removeActor(id);
    w.setFollowers([]);
    const bn = w.resolvePoint('bench_night');
    await d.scene(async () => {
      d.place('player', bn, bn[2] ?? 180);
      d.mode('player', 'sit');
      w.place('buddy', bn[0] + 0.8, bn[1] + 0.2, bn[2] ?? 180);
      d.mode('buddy', 'sit');
      d.shot({ from: [bn[0] + 2, 1.6, bn[1] + 4.5], to: [bn[0] + 1.2, 1.4, bn[1] + 3.6], look: [bn[0], 0.9, bn[1]], dur: 6, fov: 32, wait: false });
      await this.ui.fade(false, 1200);
      await this.ui.caption('Osaka Castle Park — Night', 2400);
      await d.say('player', 'What a day, huh?', { name: s.player.name });
      await d.say('buddy', this.buddyCry(), { play: 'nod' });
      const picks = await this.app.screens.choiceScene(NIGHT_BOND);
      for (const o of picks) this.game.applyBoost(o, this.starter());
      d.emote('buddy', 'heart');
      d.shot({ from: [bn[0] + 1, 1.2, bn[1] + 2.4], look: [bn[0] - 10, 14, bn[1] - 24], dur: 4, fov: 44, wait: false });
      await wait(1200);
      d.shootingStar([bn[0] - 6, bn[1] - 18], { dur: 2400 });
      await wait(900);
      d.play('buddy', 'point'); d.emote('buddy', '!');
      await wait(1500);
      await d.say('player', 'A shooting star… or was that the sky whale again?', { name: s.player.name });
      this.audio.sfx('notification');
      this.ui.toast('📱 Mika: dont be late tmrw!!! umeda 9am!!! 🐼⚡', '', 3800);
      await wait(1600);
      d.mode('player', null); d.mode('buddy', null);
      await d.fadeOut(1200);
      this.set('day1_done');
    }, { keepCam: true, control: false });
    await this.sleep(true);
  }

  // ================================================================== sleeping / new days
  async sleep(story = false) {
    const s = this.s;
    await this.ui.fade(true, 700);
    if (s.time.hour >= 7) s.time.day++;   // after midnight the date already rolled over
    s.time.hour = 7.5;
    S.healParty(s, 1);
    s.league.matchesToday = 0;
    for (const k of Object.keys(s.flags)) if (/^d\d+_/.test(k) && !k.startsWith('d' + s.time.day + '_')) delete s.flags[k];
    // dojo training ticks overnight
    for (const t of s.dojo.training) { const m = S.monByUid(s, t.uid); if (m) { const ups = gainExp(m, 220 + m.level * 22); t.levels = (t.levels || 0) + ups.length; } }
    this.gfx.setTime(7.5);
    if (story && s.time.day === 2) return this.day2Morning();
    await this.loadMap('castle_park', 'gate');
    this.app.saveGame(true);
    await this.ui.titleCard(`Day ${s.time.day}`, this.dayMessage(), 2400);
    await this.ui.fade(false, 700);
    this.freeRoam();
    this.checkDeadlines();
  }
  dayMessage() {
    const s = this.s, dl = s.deadlines.find((x) => !x.done);
    if (dl) { const left = dl.day - s.time.day; return left > 0 ? `${left} day${left > 1 ? 's' : ''} until the ${dl.name}` : left === 0 ? `${dl.name} — TODAY!` : ''; }
    return 'A new day in Osaka';
  }
  checkDeadlines() {
    const s = this.s;
    for (const dl of s.deadlines) {
      if (dl.done) continue;
      if (dl.id === 'rookie_cup' && s.time.day > dl.day && !this.F('rookie_cup')) {
        dl.day += 3; dl.name = 'Rookie Cup wildcard round';
        this.ui.toast(`📅 You missed the qualifier… but there's a wildcard round on Day ${dl.day}! Reach Rookie C by then.`, 'gold', 5200);
      }
    }
  }
  onClock() {
    const s = this.s, h = s.time.hour;
    if (h >= 18 && h < 18.3 && this.daily('dinner_ping')) this.ui.toast('📱 Mika: dinner at Abbey Road?? 🥞 (Dotonbori)', '', 3600);
    if (h >= 22 && this.daily('late_ping')) this.askSleep();
    if (h < 7 && s.time.day > 0 && this.daily('very_late')) this.askSleep(true);
  }
  async askSleep(force = false) {
    if (this.app.busy || this.app.battle.active) { setTimeout(() => this.askSleep(force), 4000); return; }
    this.app.busy = true; this.w.enableControl(false);
    const ok = force || await this.app.screens.confirm('It\'s getting late. Head home and rest?', 'Go home 🌙', 'Stay out');
    this.app.busy = false;
    if (ok) await this.sleep(); else this.w.enableControl(true);
  }

  // ================================================================== DAY 2 — Umeda, the League
  async day2Morning() {
    const d = this.d, s = this.s;
    this.locked = false;
    s.time.day = 2; this.setClock(2, 7.6);
    await this.loadMap('castle_park', 'gate', { music: 'park' });
    this.set('unlock_umeda'); S.unlockLocation(s, 'umeda');
    s.story.beat = 'day2';
    this.app.saveGame(true);
    await d.titleCard('Day 2', 'Registration Day', 2400);
    await this.ui.fade(false, 700);
    await d.scene(async () => {
      d.closeUp('player', { dist: 3.2, angle: 0.4 });
      d.play('player', 'stretch');
      this.audio.sfx('notification');
      await d.say('coach', '(Holo-call) Rise and shine, rookie! League registration opens at nine in *Umeda*. Mika\'s already there. Of course she is.', { actor: false });
      await d.say('buddy', this.buddyCry(), { play: 'hop' });
    });
    this.ui.toast('🗺️ New location: Umeda Sky District', 'gold', 3000);
    this.app.updateObjective();
  }
  async day2Register() {
    const d = this.d, s = this.s, w = this.w;
    if (s.time.hour < 8.5) this.setClock(null, 8.8);
    this.spawnServiceNpcs('umeda');
    const rc = w.resolvePoint('reception') || w.resolvePoint('receptionist');
    this.ensure('mika', 'mika', [rc[0] + 2, rc[1] + 1.5], 180);
    this.ensure('zappy', { species: 'zapanda' }, [rc[0] + 2.8, rc[1] + 2], 180, { label: false });
    await d.scene(async () => {
      const pv = w.resolvePoint('plaza_view') || rc;
      d.shot({ from: [pv[0] + 12, 12, pv[1] + 14], to: [pv[0] + 6, 7, pv[1] + 8], look: [pv[0], 9, pv[1] - 12], dur: 6, fov: 40, wait: false });
      await this.ui.caption('Umeda Sky District — Elemon League Kansai HQ', 3000);
      await d.walk('player', [rc[0], rc[1] + 2.2]);
      d.faceEach('mika', 'player');
      await d.say('mika', `${s.player.name}! Over here! I already registered. Rank D, baby! Bottom of the ladder!`, { play: 'cheer' });
    });
    this.follow(['mika', 'zappy']);
    await this.registration();
  }
  async registration() {
    const d = this.d, s = this.s, w = this.w;
    await d.scene(async () => {
      const rid = w.rec('receptionist') ? 'receptionist' : 'aoi';
      d.faceEach(rid, 'player');
      d.closeUp(rid, { dist: 3, angle: 0.4 });
      await d.say('receptionist', `Welcome to the Elemon League Kansai! Name: ${s.player.name}. Partner: ${nameOf(this.starter())}. Soul link… oh my, very strong!`, { play: 'bow' });
      await d.say('receptionist', 'Here is your *Tamer License* and a *Keychain Capture Device*. Gems power the keychain — five Quartz to get you started!');
      S.addItem(s, 'tamer_license', 1); S.addItem(s, 'keychain', 1); S.addItem(s, 'quartz', 5);
      this.set('license'); this.set('unlock_shinsekai');
      for (const l of ['shinsekai', 'minoh_waterfall', 'minoh_bamboo', 'minoh_maple']) S.unlockLocation(s, l);
      this.ui.callout('TAMER LICENSE!', 'You can now catch wild Elemon', '#ffe36b', 2400);
      this.audio.stinger && this.audio.stinger('reward');
      await wait(1000);
      this.unlockSlot('active', 4, 'Licensed tamers carry four skills');
      await d.say('receptionist', 'League ranks go *D → C → B → A → S → Champion*. Win rank matches here to earn points.');
      await d.say('receptionist', 'The *Rookie Cup qualifier* closes on *Day 5*. Reach Rookie C (100 points) by then to enter!', { play: 'point' });
      s.deadlines.push({ id: 'rookie_cup', name: 'Rookie Cup qualifier', day: 5, hour: 18, done: false });
      await d.say('receptionist', 'Oh! And your first rank match starts right now. Opponent is on the stage. Good luck!');
      await d.say('mika', 'Go go go! I\'ll cheer so loud the Sky Building shakes!', { play: 'cheer' });
    }, { control: false });
    // two rank matches
    for (let i = 0; i < 2; i++) await this.rankMatch(true, i);
    await this.lunchDay2();
  }
  leagueFoe(i) {
    const s = this.s;
    const rankIdx = ['D', 'C', 'B', 'A', 'S', 'X'].indexOf(S.rankOf(s).id);
    const avg = this.game.avgLevel();
    const pool = LEAGUE_FOES;
    const f = pool[(i ?? (s.league.wins + s.league.losses + s.time.day * 3)) % pool.length];
    const lv = Math.max(4, avg + rankIdx * 2 + (s.league.wins > 1 ? 1 : 0));
    return { id: f.id, name: f.name, char: f.char || { random: f.look }, team: f.team.map(([sp, d]) => [sp, Math.max(3, lv + d)]) };
  }
  async rankMatch(story = false, i = null) {
    const d = this.d, s = this.s, w = this.w;
    const f = this.leagueFoe(i);
    const stage = w.arena('stage');
    const op = w.resolvePoint('opponent') || [stage.x, stage.z - 8];
    await d.scene(async () => {
      this.ensure(f.id, f.char, op, 0, { name: f.name });
      d.walk(f.id, [stage.x, stage.z - 4]);
      await d.walk('player', [stage.x, stage.z + 4]);
      d.faceEach(f.id, 'player');
      d.shot({ from: [stage.x + 9, 5, stage.z + 9], look: [stage.x, 1, stage.z], dur: 3, fov: 38, wait: false });
      this.audio.sfx('crowd_cheer', { vol: 0.8 });
      await d.say('announcer', `Rank match! ${s.player.name} versus ${f.name}! Trainers, link your stones!`, { actor: false, name: 'League Announcer' });
    }, { control: false });
    const pts = 30 + ['D', 'C', 'B', 'A', 'S', 'X'].indexOf(S.rankOf(s).id) * 10;
    const res = await this.game.trainerBattle({ arena: 'stage', foes: [{ id: f.id, name: f.name, ai: 'normal', team: f.team }], partySize: f.team.length > 1 ? 2 : 3, league: pts, money: 600 + pts * 10, canLose: true, title: 'RANK MATCH', subtitle: `${f.name} — ${S.rankOf(s).name} division`, music: 'league', colors: ['#5ae0ff', '#ff4fa8'] });
    s.league.matchesToday++;
    await d.scene(async () => {
      d.faceEach(f.id, 'player');
      const who = d.speakerFrom(w.rec(f.id), f.name);
      if (res && res.winner === 0) await d.say(who, ['Wow… you\'re good. See you up the ladder!', 'Rock and roll… you earned that one.', 'Okay, okay! Rematch next week!'][s.league.wins % 3]);
      else await d.say(who, 'Close one! Keep training — the ladder is long.');
      d.walk(f.id, op).then(() => w.removeActor(f.id));
      await wait(600);
    });
    this.game.checkQuests();
    if (S.rankOf(s).pts >= 100) this.unlockSlot('ult', 1, 'Rank C: ultimate resonance');
    if (!story) this.app.passTime(1);
  }
  async lunchDay2() {
    const d = this.d, s = this.s, w = this.w;
    this.setClock(null, Math.max(12, s.time.hour));
    const fh = w.resolvePoint('foodhall'), lt = w.resolvePoint('lunch_table') || fh;
    await d.scene(async () => {
      d.twoShot('player', 'mika', { dist: 5 });
      await d.say('mika', 'Two wins! You\'re a natural! Now… LUNCH. The Food Hall has a conveyor-belt sushi drone.', { play: 'cheer' });
      w.setFollowers([]);
      d.walk('mika', [lt[0] - 1, lt[1]]); d.walk('zappy', [lt[0] - 1.6, lt[1] + 0.8]);
      await d.walk('player', [lt[0] + 0.6, lt[1] + 0.4]);
      d.walk('buddy', [lt[0] + 1.4, lt[1] + 1]);
      await this.ui.caption('Umeda Food Hall — Lunch', 2000);
      await this.meal(MEALS.lunch);
      this.set('lunch_d2');
      this.ensure('kaito', 'kaito', [lt[0] + 4, lt[1] + 3], 270);
      await d.walk('kaito', [lt[0] + 2, lt[1] + 1.2]);
      d.faceEach('kaito', 'player');
      d.closeUp('kaito', { dist: 3, angle: 0.5 });
      await d.say('kaito', `Two wins. Not bad. I'm at ${Math.max(90, s.league.points + 30)} points already. Try to keep up.`, { play: 'shrug' });
      await d.say('mika', 'Nobody asked, Kaito!', { expr: 'angry' });
      await d.say('kaito', 'Rookie Cup qualifier. Day 5. Don\'t make me wait.');
      d.walk('kaito', [lt[0] + 10, lt[1] + 6]).then(() => w.removeActor('kaito'));
      await wait(1000);
      this.audio.sfx('notification');
      await d.say('coach', '(Holo-call) Good work this morning! The afternoon is yours, rookie: catch Elemon in the *Minoh Safari*, train at the *Shinsekai dojo*, soak in the onsen… Your call.', { actor: false });
      await d.say('coach', 'Oh — and every in-game hour counts now. Plan your days! League matches here in Umeda, up to three a day.', { actor: false });
      await d.say('mika', 'I\'m gonna go catch a Kappachi! See you later!', { play: 'wave' });
      d.walk('mika', [lt[0] - 10, lt[1] + 8]).then(() => { w.removeActor('mika'); w.removeActor('zappy'); });
      d.walk('zappy', [lt[0] - 10, lt[1] + 8]);
    });
    this.setClock(null, 13.2);
    s.story.beat = 'free';
    this.set('free_time');
    this.app.saveGame();
    this.freeRoam();
    this.ui.toast('🔓 Unlocked: Shinsekai · Minoh Safari (3 trails) · Dojo · Shops · Onsen', 'gold', 4600);
  }
  async rookieCup() {
    const d = this.d, s = this.s, w = this.w;
    this.spawnServiceNpcs('umeda');
    await d.scene(async () => {
      await this.ui.caption('Rookie Cup — Qualifier Final', 2400);
      const stage = w.arena('stage');
      this.ensure('kaito', 'kaito', w.resolvePoint('opponent') || [stage.x, stage.z - 8], 0);
      d.walk('kaito', [stage.x, stage.z - 4]);
      await d.walk('player', [stage.x, stage.z + 4]);
      d.faceEach('kaito', 'player');
      d.closeUp('kaito', { dist: 3, angle: 0.5, push: true });
      await d.say('kaito', 'Rookie C, huh. Fine. Let\'s settle it — the Rookie Cup spot goes to the winner.', { play: 'command' });
    }, { control: false });
    const cp = COUNTER[this.s.flags.starter] || 'takopo';
    const lv = this.game.avgLevel() + 1;
    const res = await this.game.trainerBattle({ arena: 'stage', foes: [{ id: 'kaito', name: 'Kaito', ai: 'hard', team: [[cp, lv + 1], ['tengale', lv]] }], partySize: 3, league: 60, money: 3000, canLose: true, title: 'RIVAL BATTLE!', subtitle: 'Rookie Cup qualifier final', music: 'boss', colors: ['#e8233a', '#ffd23a'] });
    const won = res && res.winner === 0;
    await d.scene(async () => {
      if (won) {
        this.set('rookie_cup');
        const dl = s.deadlines.find((x) => x.id === 'rookie_cup'); if (dl) dl.done = true;
        await d.say('kaito', '…You actually did it. Fine. The Rookie Cup is yours to lose.', { play: 'shrug' });
        this.unlockSlot('passive', 2, 'Qualifier champion');
        await d.titleCard('EPISODE 1 — CLEAR!', 'Next: The Rookie Cup · Team Metallica\'s hideout · the legend of Polaris', 4200);
        this.ui.toast('Keep exploring! Catch Elemon, evolve them and climb the League.', 'gold', 5000);
      } else {
        await d.say('kaito', 'Type advantage. Again. Come back when you\'ve learned something.', { play: 'shrug' });
        await d.say('mika', '(Holo-call) You\'ll get him next time! Train up and try again!', { actor: false });
      }
      w.removeActor('kaito');
    });
  }

  // ================================================================== free-roam services
  spawnServiceNpcs(map) {
    const sp = (id, char, at, face, name) => { if (!this.w.rec(id) && this.w.resolvePoint(at)) this.d.spawn(id, char, at, face, { name, scripted: true }); };
    if (map === 'umeda') { sp('receptionist', 'receptionist', 'receptionist', 0); sp('foodhall_staff', { random: 515, role: 'chef' }, 'foodhall', 180, 'Food Hall Chef'); }
    if (map === 'dotonbori') {
      sp('vendor', 'vendor', 'vendor', 0); const ic = this.w.resolvePoint('icecream'); if (ic) sp('clerk', 'clerk', [ic[0], ic[1] - 2.2], 0);
      if (this.F('day1_done')) { sp('hoshino', 'hoshino', 'hoshino', 225); sp('taro', 'taro', 'taro'); }
    }
    if (map === 'shinsekai') {
      sp('dojo_master', 'dojo_master', 'dojo_master', 0); sp('onsen_staff', { random: 616, role: 'worker' }, 'onsen', 0, 'Onsen Attendant');
      sp('arcade_staff', { random: 717, role: 'student' }, 'arcade', 0, 'Arcade Kid');
      if (!this.w.rec('grillz_clerk')) sp('bling', { random: 88, role: 'artist' }, 'cosmetics', 0, 'Grillz & Thrillz');
      if (!this.w.rec('shopkeeper')) sp('goods', 'shopkeeper', 'shop', 0, 'Kansai Calling Supplies');
      if (!this.F('beat_alley')) { sp('riff', 'riff', 'alley', 180); const a = this.w.resolvePoint('alley'); if (a) sp('moshi', 'moshi', [a[0] + 1.4, a[1] + 0.4], 200); }
    }
    if (map.startsWith('minoh')) sp('ranger', 'ranger', 'ranger', 0);
    if (map === 'castle_park' && this.F('day1_done')) { sp('coach', 'coach', 'coach', 0); }
  }
  npcHidden(mapId, id) { return mapId === 'shinsekai' && (id === 'riff' || id === 'moshi') && this.F('beat_alley'); }
  markFor(mapId, id) {
    const s = this.s, F = (k) => this.F(k);
    if (!F('got_starter')) return id === 'mika' || id === 'coach' ? '!' : null;
    switch (id) {
      case 'receptionist': return F('license') ? '⚔' : '!';
      case 'hoshino': return (s.bag.star_fragment || 0) >= 3 && !F('fragments_given') ? '!' : null;
      case 'vendor': return F('day1_done') && !s.quests.protection_racket ? '!' : null;
      case 'ranger': return !F('ranger_met') ? '!' : null;
      case 'dojo_master': return '🥋';
      case 'onsen_staff': return '♨️';
      case 'bling': case 'goods': case 'shopkeeper': case 'grillz_clerk': return '🛒';
      case 'arcade_staff': return '🕹️';
      case 'foodhall_staff': return '🍜';
      case 'clerk': return F('icecream') ? '🍦' : null;
      case 'coach': return F('day1_done') && !F(`d${s.time.day}_spar`) ? '⚔' : null;
      case 'riff': case 'moshi': return s.quests.protection_racket && !F('beat_alley') ? '!' : null;
      default: return null;
    }
  }
  objective() {
    const s = this.s, F = (k) => this.F(k);
    if (!F('met_coach')) return 'Meet Coach Gonda at the training ground';
    if (F('fought_kaito') && !F('icecream')) return 'Travel to Dotonbori (🗺️ Map) for ice cream';
    if (F('day1_done') && !F('license')) return 'Register for the Kansai League in Umeda (🗺️ Map)';
    if (F('free_time')) {
      const dl = s.deadlines.find((x) => !x.done);
      const rank = S.rankOf(s);
      if (dl && rank.pts < 100) return `Reach Rookie C (${s.league.points}/100 pts) — ${dl.name} on Day ${dl.day}`;
      if (dl && rank.pts >= 100 && !F('rookie_cup')) return 'Go to Umeda for the Rookie Cup qualifier final';
    }
    return '';
  }
  onStarterFocus(id) {
    const r = this.w.rec('pod_' + id); if (!r) return;
    r.actor.play('happy'); r.actor.emote('heart');
    this.d.closeUp('pod_' + id, { dist: 2.6, angle: 0.35, dur: 1.2, y: 0.6 });
  }

  // ================================================================== interactions
  async interact(rec) {
    const id = rec.id, map = this.w.mapId, d = this.d, s = this.s;
    const charKey = rec.npc && typeof rec.npc.char === 'string' ? rec.npc.char : null;
    const key = { aoi: 'receptionist' }[id] || id;
    const H = this[`talk_${key}`] || (charKey && this[`talk_${charKey}`]);
    if (H) return H.call(this, rec);
    if (rec.npc && rec.npc.talk && this[`talk_${rec.npc.talk}`]) return this[`talk_${rec.npc.talk}`](rec);
    if (rec.npc && rec.npc.species) {
      rec.actor.faceTo(this.w.actor('player').pos.x, this.w.actor('player').pos.z);
      rec.actor.play(['happy', 'hop', 'sniff', 'spin'][hashStr(id + s.time.hour) % 4]); rec.actor.emote(Math.random() < 0.6 ? 'heart' : 'note');
      this.audio.sfx('heart', { vol: 0.5 });
      return;
    }
    // generic townsfolk
    if (rec.kind === 'npc' && rec.npc) {
      const line = TOWNSFOLK[(hashStr(id) + s.time.day) % TOWNSFOLK.length];
      await d.say(d.speakerFrom(rec, rec.npc.name || (charKey ? characterLore(charKey).name : null)), line);
      if (this.slot() !== 'night' && Math.random() < 0.08) await this.randomEvent();
    }
  }
  async talk_mika() {
    const lines = ['Zappy learned a new trick! It sneezes lightning now. Is that bad? That might be bad.', 'Have you tried the onsen in Shinsekai? Zappy fell asleep in the bath. Static everywhere!', 'Kaito thinks he\'s so cool. …He IS kind of cool. Don\'t tell him I said that.', 'Let\'s both make Rookie C before the qualifier! Pinky promise!'];
    await this.d.say('mika', lines[(this.s.time.day + this.s.stats.battles) % lines.length], { play: 'laugh' });
  }
  async talk_kaito() { await this.d.say('kaito', 'What. I\'m busy. …Fine. Hydro beats Pyro, Echo beats Hydro, Geo beats Echo. Write it down.', { play: 'shrug' }); }
  async talk_park_tea(rec) {
    const d = this.d;
    await d.say('granny', 'Ara ara, such a lovely Elemon. Would you like some matcha, dear? Good for the soul stone.', { play: 'bow' });
    if (this.daily('tea')) { this.game.give('matcha', 1); addFriendship(this.s.party[0], 2); }
    else await d.say('granny', 'Come back tomorrow, dear. The pot needs time to rest, just like you.');
  }
  async talk_park_pigeons(rec) {
    await this.d.say(this.d.speakerFrom(rec, 'Pigeon Grandpa'), 'The pigeons and the Cabbunnies used to fight over breadcrumbs. Now they share. Even birds can learn manners, hm?');
  }
  async talk_coach(rec) {
    const d = this.d;
    if (!this.F('day1_done')) return d.say('coach', 'Focus, rookie!');
    const r = await d.ask('coach', 'Back for more? I\'m always up for a spar — once a day. Or need advice?', ['Spar with Coach! ⚔', 'Any advice?', 'Just saying hi']);
    if (r === 0) {
      if (!this.daily('spar')) return d.say('coach', 'Kanizumo\'s napping. Come back tomorrow!');
      const lv = this.game.avgLevel() + 1;
      await this.game.trainerBattle({ arena: 'main', foes: [{ id: 'coach', name: 'Coach Gonda', ai: 'hard', team: [['kanizumo', lv], ['moglow', lv - 1]] }], canLose: true, expMul: 1.5, title: 'Daily Spar', subtitle: 'Coach Gonda isn\'t holding back', music: 'battle' });
      this.app.passTime(0.5);
    } else if (r === 1) {
      const tips = [
        'Switch out right before a big hit lands — the new Elemon comes in with a TAG STRIKE.',
        'Elemental auras stick to enemies for a few seconds. Hit with a different element for a reaction!',
        'Perfect parries reflect damage. Watch the enemy\'s wind-up flash.',
        'Your soul stone grows with friendship. At max bond, something… special happens. *Spectral form.*',
        'Beatlet\'s evolutions depend on how you battle. Four paths — four legends.',
        'Dojo training is slow but steady. Leave an Elemon there overnight.',
      ];
      await d.say('coach', tips[(this.s.time.day + this.s.stats.battles) % tips.length]);
    } else await d.say('coach', 'Hi yourself! Eat something. You look thin.', { play: 'laugh' });
  }
  async talk_receptionist(rec) {
    const d = this.d, s = this.s;
    if (!this.F('license')) return this.registration();
    const left = 3 - s.league.matchesToday;
    const r = await d.ask('receptionist', `Rank: *${S.rankOf(s).name}* · ${s.league.points} pts · ${s.league.wins}W ${s.league.losses}L. Matches left today: ${Math.max(0, left)}.`, ['Rank match! ⚔', 'How do ranks work?', 'Never mind']);
    if (r === 0) {
      if (left <= 0) return d.say('receptionist', 'That\'s three matches today! Rest up and come back tomorrow.');
      if (this.slot() === 'night') return d.say('receptionist', 'The stage is closed for the night. Matches resume at 6am!');
      await this.rankMatch();
    } else if (r === 1) await d.say('receptionist', 'Win to earn points; losing costs a few. Rookie D → C at 100 points, B at 260, A at 480, S at 760, Champion at 1100. Higher ranks unlock stadiums, special arenas and tougher rules!');
  }
  async talk_foodhall_staff(rec) {
    const d = this.d, s = this.s;
    if (this.slot() !== 'lunch' && this.slot() !== 'afternoon' && this.slot() !== 'evening') return d.say(d.speakerFrom(rec, 'Food Hall Chef'), 'Kitchen opens at lunchtime!');
    if (!this.daily('foodhall')) return d.say(d.speakerFrom(rec, 'Food Hall Chef'), 'You already ate here today! Your partner looks very round.');
    if (!S.spend(s, 900)) return d.say(d.speakerFrom(rec, 'Food Hall Chef'), 'That\'ll be ¥900… oh. Come back with money!');
    await this.meal(MEALS.lunch);
    await this.app.passTime(1);
  }
  async talk_vendor(rec) {
    const d = this.d, s = this.s;
    if (this.F('day1_done') && !s.quests.protection_racket) {
      await d.say('vendor', 'Those Metallica punks came back last night. Said I owe them for "emotional damages." Can you believe it?!', { play: 'stomp' });
      await d.say('vendor', 'Their hangout\'s a back alley in *Shinsekai*. Please — make them stop!');
      this.game.startQuest('protection_racket');
      return;
    }
    if (this.F('beat_alley') && !this.F('racket_done')) {
      await d.say('vendor', 'You beat them in their own alley?! Osaka owes you, kid. Takoyaki for life!', { play: 'cheer' });
      this.set('racket_done'); this.game.checkQuests();
      return;
    }
    const r = await d.ask('vendor', 'Takoyaki! Hot, round, perfect. ¥400 a box.', ['Buy one (¥400)', 'Feed one to my partner now (¥400)', 'No thanks']);
    if (r === 2) return;
    if (!S.spend(s, 400)) return d.say('vendor', 'No money, no balls. Takoyaki balls! Hah!');
    if (r === 0) this.game.give('takoyaki', 1);
    else { const m = s.party[0]; S.addItem(s, 'takoyaki', 1); S.useItemOn(s, 'takoyaki', m); this.w.actor('buddy')?.play('eat'); this.w.actor('buddy')?.emote('heart'); this.game.checkQuests(); this.game.checkEvolutions(); }
  }
  async talk_clerk(rec) {
    const d = this.d, s = this.s;
    if (!this.daily('icecream')) return d.say('clerk', 'Brain-freeze limit reached! One special per day, sorry~');
    const r = await d.ask('clerk', 'Yellow Submarine special — ¥350! Want one for your partner?', ['Yes please! (¥350)', 'Maybe later']);
    if (r !== 0) return;
    if (!S.spend(s, 350)) return d.say('clerk', 'Hmm, your wallet looks a little… submarine-d.');
    await this.meal(MEALS.icecream);
  }
  async talk_hoshino(rec) {
    const d = this.d, s = this.s;
    const n = s.bag.star_fragment || 0;
    if (n >= 3 && !this.F('fragments_given')) {
      await d.say('hoshino', 'Three fragments! Look how they resonate with each other… and with your soul stone!', { play: 'cheer' });
      S.addItem(s, 'star_fragment', -3);
      this.set('fragments_given'); this.game.checkQuests();
      await d.say('hoshino', 'I fused them into a *Star Gem*. Legends say only starlight can calm the sky whale. Keep it safe — your journey with Polaris has begun.');
      return;
    }
    await d.say('hoshino', this.F('fragments_given') ? 'The stars are restless. I\'m deciphering the Solaris murals next. Have you heard of a "Rift"…?' : `Any luck with the star fragments? You have ${n} of 3. They glow faintly in the Minoh forests — at night they\'re easier to spot.`);
  }
  async talk_taro(rec) {
    const d = this.d;
    const b = this.s.party.find((m) => m.species === 'beatlet' || m.gift === 'Taro');
    await d.say('taro', b ? `How's Beatlet? Is he a rock star yet? I heard Beatlets go crazy for lemons… like, a LOT of lemons.` : 'Hi! I\'m practicing to be a tamer like you!', { play: 'hop' });
  }
  async talk_dojo_master(rec) {
    const d = this.d, s = this.s;
    if (!this.F('dojo_intro')) {
      this.set('dojo_intro');
      await d.say('dojo_master', 'Hm. A rookie with a bright stone. I am Genryu. Strength here is earned slowly — like water carving stone.', { play: 'bow' });
      S.addItem(s, 'dojo_pass', 1);
      this.game.startQuest('dojo_discipline');
    }
    const training = s.dojo.training.map((t) => S.monByUid(s, t.uid)).filter(Boolean);
    const opts = ['Meditate with your partner (2h)', 'Leave an Elemon to train', training.length ? `Collect training Elemon (${training.map(nameOf).join(', ')})` : 'Spar with a student ⚔', 'Leave'];
    const r = await d.ask('dojo_master', training.length ? `${training.map(nameOf).join(' & ')} train${training.length > 1 ? '' : 's'} hard. What do you seek?` : 'What do you seek?', opts);
    if (r === 0) {
      await this.d.scene(async () => {
        d.mode('player', 'sit'); d.mode('buddy', 'sit');
        d.closeUp('player', { dist: 3.4, angle: 0.6 });
        this.audio.music('dojo', { fade: 1 });
        await this.ui.caption('Breathe in… breathe out…', 2200);
        const morning = this.slot() === 'morning';
        const m = s.party[0];
        m.counters.dojo++;
        s.flags.dojo_sessions = (s.flags.dojo_sessions || 0) + 1;
        addFriendship(m, morning ? 6 : 3);
        const ups = gainExp(m, 60 + m.level * 8);
        d.mode('player', null); d.mode('buddy', null);
        await this.app.passTime(2);
        await d.say('dojo_master', morning ? 'The morning sun sharpens the spirit. Good.' : 'Better. True strength rises with the sun, remember.');
        if (ups.length) await this.app.screens.levelUp(m, ups);
        this.game.checkQuests();
      });
    } else if (r === 1) {
      const cands = s.party.filter((m, i) => i > 0 && !S.inDojo(s, m.uid));
      if (!cands.length) return d.say('dojo_master', 'Your partner must stay with you. Bring a second Elemon to leave here.');
      const pick = await d.ask('dojo_master', 'Who will train? (They gain EXP over time — even overnight — but can\'t battle while here.)', [...cands.map(nameOf), 'Cancel']);
      if (pick < cands.length) { S.startDojo(s, cands[pick].uid); this.ui.toast(`🥋 ${nameOf(cands[pick])} started training`, 'good'); }
    } else if (r === 2) {
      if (training.length) {
        for (const t of [...s.dojo.training]) { const m = S.monByUid(s, t.uid); S.stopDojo(s, t.uid); if (m) this.ui.toast(`🥋 ${nameOf(m)} returns: +${t.levels || 0} levels`, 'gold', 3000); }
      } else {
        const lv = this.game.avgLevel();
        await this.game.trainerBattle({ arena: 'yard', foes: [{ id: 'student', name: 'Dojo Student', ai: 'hard', team: [['moshbull', lv], ['kanizumo', lv - 1]] }], canLose: true, expMul: 1.2, title: 'Dojo Spar', subtitle: 'Discipline!', music: 'dojo' });
        this.app.passTime(0.5);
      }
    }
  }
  async talk_onsen_staff(rec) {
    const d = this.d, s = this.s;
    const r = await d.ask(d.speakerFrom(rec, 'Onsen Attendant'), 'Irasshaimase! A soak is ¥500 — two relaxing hours. Elemon welcome (Pyro types: please don\'t boil the bath).', ['Relax (¥500, 2h)', 'No thanks']);
    if (r !== 0) return;
    if (!S.spend(s, 500)) return d.say(d.speakerFrom(rec, 'Onsen Attendant'), 'Ah… perhaps after a few more battles?');
    await this.ui.fade(true, 600);
    S.healParty(s, 1); this.partyEffect((m) => addFriendship(m, 3));
    await this.app.passTime(2, false);
    await this.ui.fade(false, 600);
    await this.meal(RELAX);
    this.ui.toast('♨️ Team fully healed', 'good');
  }
  async talk_arcade_staff(rec) {
    const d = this.d, s = this.s;
    const r = await d.ask(d.speakerFrom(rec, 'Arcade Kid'), 'Smells Like Teen Spirit Arcade! The crane game\'s got rare cosmetics. ¥300 a try. Feelin\' lucky?', ['Play the crane (¥300)', 'Nah']);
    if (r !== 0) return;
    if (!S.spend(s, 300)) return d.say(d.speakerFrom(rec, 'Arcade Kid'), 'Broke, huh? Been there.');
    this.audio.sfx('whoosh');
    await this.ui.cutin('CRANE GAME', '…the claw descends…', ['#ff4fa8', '#3ff0ff'], 1400);
    const roll = Math.random();
    const prizes = Object.entries(COSMETICS).filter(([k, c]) => c.price && !s.player.owned.includes(k));
    if (roll < 0.35 && prizes.length) { const [cid, c] = prizes[Math.floor(Math.random() * prizes.length)]; S.ownCosmetic(s, cid); this.ui.callout('JACKPOT!', c.name, '#ffe36b', 2000); this.audio.stinger && this.audio.stinger('reward'); }
    else if (roll < 0.75) { const it = ['ramune', 'takoyaki', 'quartz', 'matcha'][Math.floor(Math.random() * 4)]; this.game.give(it, 1); }
    else { this.ui.callout('SO CLOSE…', 'The claw slipped', '#9fb3ff', 1600); this.audio.sfx('ui_error'); }
  }
  async talk_bling() { await this.app.screens.shop('cosmetics'); this.w.ensurePlayer(); }
  async talk_goods() { await this.app.screens.shop('goods'); }
  async talk_shopkeeper() { await this.d.say('shopkeeper', 'Welcome to Kansai Calling Supplies! Gems, snacks, mixtapes — London calling, Osaka answering!', { play: 'laugh' }); await this.app.screens.shop('goods'); }
  async talk_grillz_clerk(rec) { await this.d.say(this.d.speakerFrom(rec, 'Grillz & Thrillz'), 'Bling for your bracelet, shine for your soul stone. Look good, battle good!'); await this.app.screens.shop('cosmetics'); this.w.ensurePlayer(); }
  async talk_thrash() {
    if (!this.F('beat_alley')) return this.d.say('thrash', 'You again. My boys are bored — go bug THEM. I\'m saving myself for the League.', { play: 'headbang' });
    await this.d.say('thrash', 'You beat Riff AND Moshi? …Fine. Next time it\'s me. Rookie Cup. Main stage. Bring earplugs.', { play: 'point' });
  }
  async talk_lookout(rec) { await this.d.say(this.d.speakerFrom(rec, 'Metallica Lookout'), 'This is Team Metallica turf! We got a sound system and EVERYTHING.'); }
  async talk_ranger(rec) {
    const d = this.d, s = this.s;
    if (!this.F('ranger_met')) {
      this.set('ranger_met');
      await d.say('ranger', 'Welcome to the Minoh Safari Reserve! License? …Great. Ground rules:', { play: 'wave' });
      await d.say('ranger', 'Wild Elemon spook easily. *Sneak* (🥷 button) through *tall grass* to stay hidden. Hit them from behind for an AMBUSH — they\'re much easier to catch.');
      await d.say('ranger', 'Weaken them in battle, then throw your keychain. Better gems, better odds. Some Elemon only show up at certain hours.');
      await d.say('ranger', 'And watch out for *wild beasts* — Rift Boars and Oni Bears can\'t be tamed. If one charges, fight it off or run!', { play: 'point' });
      this.game.give('quartz', 3);
      if (s.party.some((m) => m.species === 'beatlet')) {
        await d.say('ranger', 'Hey, a Beatlet! Lemmo are overrunning Maple Ridge, and their Alpha is getting cocky. Your bug looks… weirdly excited about that.');
        this.game.startQuest('lemon_squeeze');
      }
      return;
    }
    const r = await d.ask('ranger', 'Need anything?', ['Rest at the camp (1h, heals team)', 'Any tips?', 'Bye!']);
    if (r === 0) { await this.ui.fade(true, 500); S.healParty(s, 1); await this.app.passTime(1, false); await this.ui.fade(false, 500); this.ui.toast('⛺ Team rested', 'good'); }
    else if (r === 1) await d.say('ranger', ['Hotarumi glow near the waterfall pool at dusk.', 'Chochobake only appear at night — and only if you sneak.', 'The Alpha Lemmo lives in the lemon grove on Maple Ridge. Bring friends.', 'Yukiusa? Snow rabbits in summer? Only late at night on the ridge, they say.'][s.time.day % 4]);
  }
  async talk_riff(rec) { return this.alleyBattle(); }
  async talk_moshi(rec) { return this.alleyBattle(); }
  async alleyBattle() {
    const d = this.d, s = this.s, w = this.w;
    if (this.F('beat_alley')) return d.say('riff', 'Go away. We\'re… regrouping.');
    this.set('found_alley'); this.game.checkQuests();
    if (!s.quests.protection_racket) return d.say('riff', 'Team Metallica turf, rookie. Scram. …Please?', { play: 'point' });
    await d.scene(async () => {
      d.faceEach('riff', 'player');
      await d.say('riff', 'You again?! Moshi, it\'s the rookie from the bridge!', { play: 'shocked' });
      await d.say('moshi', '…Mosh time.', { play: 'headbang' });
      await d.say('riff', 'Two of us, one of you. Do the math, hero!');
    }, { control: false });
    const lv = this.game.avgLevel();
    const res = await this.game.trainerBattle({ arena: 'alley', foes: [{ id: 'riff', name: 'Riff', ai: 'punk', team: [['studrat', lv + 1]] }, { id: 'moshi', name: 'Moshi', ai: 'normal', team: [['moshbull', lv + 1]] }], partySize: 3, canLose: true, money: 2500, title: 'ALLEY FIGHT!', subtitle: 'Team Metallica — Riff & Moshi', music: 'battle_punk', colors: ['#33d65a', '#1b1230'] });
    if (res && res.winner === 0) {
      this.set('beat_alley'); this.game.checkQuests();
      await d.scene(async () => {
        await d.say('riff', 'Not AGAIN! Thrash is gonna kill us…', { play: 'shrug' });
        await d.say('moshi', '…Good mosh.', { play: 'bow' });
        d.walk('riff', [w.actor('riff').pos.x, w.actor('riff').pos.z - 8]).then(() => w.removeActor('riff'));
        d.walk('moshi', [w.actor('moshi').pos.x, w.actor('moshi').pos.z - 8]).then(() => w.removeActor('moshi'));
        await wait(1200);
        this.ui.toast('📜 Report back to the takoyaki vendor in Dotonbori', '', 3600);
      });
    }
  }

  // ================================================================== random events
  async randomEvent() {
    const slot = this.slot();
    const pool = RANDOM_EVENTS.filter((e) => e.when.includes(slot));
    if (!pool.length) return;
    let r = Math.random() * pool.reduce((a, e) => a + e.weight, 0), ev = pool[0];
    for (const e of pool) { r -= e.weight; if (r <= 0) { ev = e; break; } }
    await this.ui.cutin('RANDOM EVENT', ev.title, ['#ffd23a', '#ff4fa8'], 1100);
    const [o] = await this.app.screens.choiceScene({ title: ev.title, subtitle: ev.text, options: ev.options });
    if (o.money && o.money < 0 && !S.spend(this.s, -o.money)) { this.ui.toast('Not enough money…'); return; }
    this.game.applyBoost(Object.assign({}, o, { money: o.money > 0 ? o.money : 0 }));
    if (o.battle) {
      const lv = this.game.avgLevel();
      const spec = o.battle === 'grunts'
        ? { foes: [{ id: 'grunt', name: 'Metallica Grunt', ai: 'punk', team: [['studrat', lv], ['moshbull', lv - 1]] }], money: 1200, title: 'Spray Paint Punks!', music: 'battle_punk' }
        : { foes: [{ id: 'kid', name: 'Cocky Kid', ai: 'normal', team: [['zapanda', Math.max(3, lv - 1)]] }], money: 500, title: 'Spar!', music: 'battle' };
      const a = this.w.actor('player');
      await this.game.trainerBattle(Object.assign({ arena: { x: a.pos.x, z: a.pos.z, r: 6 }, canLose: true }, spec));
    }
  }
}
