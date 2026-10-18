// Story for the 2D edition. Chapter 1 opening: title → Osaka 2050 intro → the
// plaza where Coach Gonda has three starters waiting → pick your partner → the
// soul-stone bracelet + phone → rival Kaito challenges you → free roam.
import { T } from './ui.js';
import { MonSprite, bank, hasDesign } from './mon.js';
const DESIGNS_HAS = (id) => hasDesign(id);
import { buildPlaza } from '../../data/scenes/plaza.js';
import { SPECIES } from '../../data/species.js';
import { ambient } from '../ambient.js';
import { Actor } from '../scene2d.js';
import * as S from '../../game/state.js';

const STARTERS = [
  { id: 'chilichick', el: 'Pyro', color: '#ff7a3a', icon: 'flame', blurb: 'A small, round fire chick that hugs a chili bigger than its belly and never lets go. Its flame crest flares when it gets fired up. Fast, close-range, scary fire.' },
  { id: 'bubblion', el: 'Hydro', color: '#5ab8f0', icon: 'drop', blurb: 'A lionfish prince floating in its own soft, bouncy ball of water. Water-bullet sniper: long range, slow and precise.' },
  { id: 'strawbaa', el: 'Bio', color: '#ff5a78', icon: 'leaf', blurb: 'A strawberry sheep from the Strawberry Fields. Heals friends, plants vines that hurt foes and heal allies, and rams hard.' },
];
const COUNTER = { chilichick: 'bubblion', bubblion: 'strawbaa', strawbaa: 'chilichick' };

export class Story2D {
  constructor(app) { this.app = app; this.title = null; this.scene = null; }

  async boot() {
    const app = this.app;
    const saved = S.load();
    this.title = new TitleScreen(app, !!saved);
    app.mode = 'title';
    await app.fade(0, 900);
    let pick = app.params.get('auto') || await this.title.choice;
    if (pick === 'continue' && saved) { app.state = saved; await app.fade(1, 500); await this.roam(); return; }
    S.wipe(); app.state = S.newGame();
    await app.fade(1, 600);
    await this.intro();
  }

  async intro() {
    const app = this.app;
    this.scene = new BlackCard(app);
    app.mode = 'cut';
    await app.fade(0, 300);
    await app.say('', 'Osaka, 2050.', 'The neon never sleeps, the takoyaki never stops, and Tokonmon live side by side with people.', 'They are protected by law. Nobody may catch one without a Tamer License — but anyone may be chosen by one.', 'Today, in the old plaza under Tsutenkaku, someone is waiting to meet you.');
    await app.fade(1, 500);
    await app.world.load('plaza', 'start', { species: 'chilichick' });
    // the three starters wait on the checker tiles; you see the world through… nobody yet
    app.world.sc.actors.delete(app.world.me);
    app.world.me.x = 330; app.world.me.y = 392;
    const spots = [[284, 338], [330, 330], [376, 338]];
    this.starterNpcs = STARTERS.map((st, i) => app.world.addNpc({ species: st.id, x: spots[i][0], y: spots[i][1], still: true, yaw: 0, talk: () => this.inspect(st), label: SPECIES[st.id].name }));
    app.world.sc.actors.add(app.world.me);
    app.world.avatar = new MonSprite('chilichick', { scale: 0 });            // invisible "camera" until you have a partner
    app.world.avatar.frame = () => null;
    app.world.me.src = () => null;
    app.world.control = false;
    app.mode = 'world';
    await app.fade(0, 700);
    await app.say('Coach Gonda', 'Oi! Over here! You made it.', "I'm Coach Gonda. Sumo wrestler, ramen critic, and — today — your Tokonmon matchmaker.", 'These three hatched at the training ground this spring. Each one has been waiting for a trainer of their own.', 'Go on. Walk up to each of them and say hello. When one of them feels right, choose it.');
    app.world.control = true;
    app.objective = 'Meet the three starters and choose your partner';
  }

  async inspect(st) {
    const app = this.app;
    const card = app.card = new StarterCard(app, st);
    app.overlay = (ui, dt) => card.draw(ui, dt);
    const yes = await card.result;
    app.overlay = null;
    if (!yes) return;
    // chosen!
    const mon = S.giveStarter(app.state, st.id, 5);
    const w = app.world;
    for (const n of this.starterNpcs) { if (n.species === st.id) { w.me.x = n.a.x; w.me.y = n.a.y; } w.removeNpc(n); }
    w.avatar = new MonSprite(st.id, { scale: 0.58, pitch: 24, yaw: 0 });
    w.me.src = () => w.avatar.frame();
    w.avatar.play('happy', { restart: true });
    app.audio.sfx('evolve_burst');
    app.ui.toast(`${SPECIES[st.id].name} joined you!`, { icon: 'star', color: st.color });
    await app.wait(900);
    await app.say('Coach Gonda', `${SPECIES[st.id].name}! Ha! I knew it. Look at that face — it picked you right back.`, 'Two more things. This bracelet carries a soul stone. When your heart and your Tokonmon\'s heart beat together, the stone lets you BOND.', 'Bonded, you move as one: no delay on your orders, special gimmicks, even ultimates. Ultimates burn the bond out, though, so time them well.', 'And this phone is your whole life now: team, bag, map, your friends, League rank. Tap the phone icon any time.');
    app.state.flags.phone = true; app.state.flags.bracelet = true;
    const rival = COUNTER[st.id];
    await app.say('???', 'Coach! Don\'t tell me you gave the first pick to some rookie!');
    await app.say('Kaito', `Name's Kaito. And this is ${SPECIES[rival].name} — I picked the one that beats yours. Obviously.`, 'Let\'s see if your little partner can even stand up straight. Battle me!');
    await app.say('Coach Gonda', 'Ha! First day, first battle. Go on — I\'ll referee. Remember: tap a skill and your partner follows the order after a short beat. Bond to skip the beat.');
    const res = await app.startBattle({ title: 'VS  KAITO', subtitle: 'Your first battle!', foe: { name: 'Kaito', team: [[rival, 5]] }, tutorial: true, canLose: true });
    if (res && res.winner === 0) await app.say('Kaito', 'Tch… beginner\'s luck. Next time I\'ll be ready.', 'Coach, I\'m going to the League office. See you on the ladder, rookie.');
    else await app.say('Kaito', 'Ha! Told you. Don\'t cry about it.', 'Coach Gonda: Don\'t mind him. Losing your first battle is a tradition. Rest up on the bench.');
    S.healParty(app.state, 1);
    app.state.story.beat = 'roam1'; app.save();
    this.onArrive('plaza');
    await app.say('Coach Gonda', 'Explore the plaza a bit. Grab a bowl of ramen — Tokonmon learn things from food, you know. Spicy food especially, for that one.', 'Meet me at the subway gate when you\'re ready for the League office.');
    app.objective = 'Explore the plaza — then meet Coach Gonda at the subway gate';
  }

  // ------------------------------------------------------------------ chapter 1 beats (called after every map load)
  onArrive(mapId) {
    const app = this.app, w = app.world, s = app.state, beat = s.story.beat;
    const hot = (h) => w.meta.hotspots.unshift(Object.assign({ r: 30, icon: 'talk' }, h));
    const coach = (x, y, act, label = 'Coach Gonda') => { const n = w.addNpc({ species: 'kanizumo', x, y, still: true, yaw: 0, talk: act, label }); return n; };
    if (mapId === 'plaza' && beat === 'roam1') {
      hot({ x: 222, y: 270, label: 'Coach', bubbleH: 40, act: async () => {
        await app.say('Coach Gonda', 'There you are! Change of plan — the League office can wait a day.', "First I want to see you two train properly. To Castle Park! My training ground's by the moat.");
        s.story.beat = 'park1'; app.objective = 'Train with Coach Gonda at Osaka Castle Park';
        if (app.MAPS.castle_park) await app.travel('castle_park', 'gate');
        else await app.say('', '(Osaka Castle Park is still being painted — check back soon!)');
      } });
    }
    if (mapId === 'castle_park' && beat === 'park1') {
      const sp = w.meta.spawns.ring || w.meta.spawns.start;
      coach(sp[0] + 30, sp[1] - 10, async () => {
        await app.say('Coach Gonda', 'Welcome to the ring! Kanizumo and I have trained here every morning for nine years.', 'Bow to your opponent. Then give us everything. Bond when it feels right!');
        const res = await app.startBattle({ title: 'VS  COACH GONDA', subtitle: 'sparring match', foe: { name: 'Coach Gonda', team: [['kanizumo', 6]], ai: 'normal' }, at: sp, money: 400 });
        await app.say('Coach Gonda', res && res.winner === 0 ? 'HA! Kanizumo hasn\'t been pushed out of the ring like that in years!' : 'Not bad at all! Kanizumo had to plant both feet.', 'You\'ve earned this — a Tamer License. With it you can soul-link with wild Tokonmon. Weaken them first, then CATCH.');
        s.flags.license = true; S.addItem(s, 'quartz', 5); app.ui.toast('Got the Tamer License + 5 Quartz', { icon: 'star', color: T.green });
        await app.say('Mika', 'Coach! Is this the rookie Kaito keeps complaining about? Hi! I\'m Mika, and this is Zapanda!', 'We\'re all getting ice cream at the Yellow Submarine in Dotonbori. You\'re coming. That\'s not a question!');
        s.flags.met_mika = true; s.story.beat = 'dotonbori1'; app.save();
        app.objective = 'Meet everyone at the Yellow Submarine in Dotonbori (phone → Map)';
        w.npcs.filter((n) => n.species === 'kanizumo').forEach((n) => w.removeNpc(n));
      });
      if (DESIGNS_HAS('zapanda')) w.addNpc({ species: 'zapanda', x: sp[0] - 60, y: sp[1] + 30, roam: 30 });
    }
    this.leagueBeats(mapId);
    if (mapId === 'dotonbori' && beat === 'dotonbori1') {
      const sp = w.meta.spawns.icecream || w.meta.spawns.start;
      const meet = async () => {
        await app.say('Mika', 'Over here! I already ordered for you: the Octopus\'s Garden Sundae. Trust me.');
        await app.say('Taro', 'H-hi. I\'m Taro. This is Beatlet. He headbangs when he\'s happy.');
        await app.say('Coach Gonda', 'Mmm. Third sundae. Don\'t tell my doctor.');
        await app.say('???', 'Well, well. Look who\'s blocking OUR canal.');
        await app.say('Thrash', 'Team Metallica. This bridge is our turf, and turf costs ¥10,000. Each.', 'Or… three on three. You lose, you pay. We lose, we walk.');
        await app.say('Coach Gonda', 'Three on three it is. Kid — take Taro\'s Beatlet as your second. Switch between them, and watch for team combos with Mika and me!');
        const borrowed = app.newMon('beatlet', 5); borrowed.nick = "Taro's Beatlet";
        const foesTeam = (sp1, sp2) => [[DESIGNS_HAS(sp1) ? sp1 : 'studrat', 6], [DESIGNS_HAS(sp2) ? sp2 : 'studrat', 5]];
        const res = await app.startBattle({ title: 'TEAM METALLICA', subtitle: '3 vs 3 on the canal', only: [app.state.party[0], borrowed],
          allies: [{ name: 'Mika', team: [['zapanda', 6]] }, { name: 'Coach Gonda', team: [['kanizumo', 7]] }],
          foes: [{ name: 'Thrash', team: foesTeam('studrat', 'moshbull'), ai: 'normal' }, { name: 'Riff', team: [[DESIGNS_HAS('thrashark') ? 'thrashark' : 'studrat', 6]] }, { name: 'Moshi', team: [[DESIGNS_HAS('moshbull') ? 'moshbull' : 'studrat', 5]] }],
          at: sp, money: 800, music: 'battle_punk' });
        if (res && res.winner === 0) await app.say('Thrash', 'This isn\'t over. Team Metallica never forgets a face.', 'Moshi: …sorry about the bridge thing. (He slips a takoyaki to a stray cat on his way out.)');
        else await app.say('Thrash', 'Pay up! …Ugh, keep it. Not worth the paperwork.', 'Moshi lingers, feeding a stray cat, then hurries after them.');
        s.flags.met_taro = true; s.flags.met_moshi_glimpse = true; s.story.beat = 'night1'; app.save();
        await app.say('Coach Gonda', 'Good teamwork. Dinner\'s on me — then sleep. Tomorrow you register for the Osaka League.');
        await this.nextDay();
      };
      hot({ x: sp[0], y: sp[1], label: 'Ice cream!', icon: 'bowl', act: meet });
      if (DESIGNS_HAS('beatlet')) w.addNpc({ species: 'beatlet', x: sp[0] + 40, y: sp[1] + 10, roam: 14 });
      if (DESIGNS_HAS('zapanda')) w.addNpc({ species: 'zapanda', x: sp[0] - 36, y: sp[1] + 12, roam: 14 });
    }
  }

  // ------------------------------------------------------------------ night → Day 2
  async nextDay() {
    const app = this.app, s = app.state, lead = s.party[0], name = lead ? (lead.nick || SPECIES[lead.species].name) : 'your partner';
    await app.fade(1, 600);
    this.scene = new BlackCard(app); app.mode = 'cut';
    await app.fade(0, 300);
    await app.say('', 'Dinner is okonomiyaki at Coach Gonda\'s favourite counter. Kanizumo eats four. Mika draws Zapanda on yours in mayonnaise.', `Later, back at the training ground, ${name} falls asleep against your arm, still warm, still smelling a little of smoke and sugar.`);
    s.time.day += 1; s.time.hour = 8; S.healParty(s, 1);
    s.flags.league = true; s.story.beat = 'league1'; app.save();
    this.scene = new DayCard(app, 'DAY ' + s.time.day, 'Osaka League registration');
    await app.wait(2600);
    await app.fade(1, 400);
    app.mode = 'world';
    await app.travel('plaza', 'start');
    app.objective = 'Register for the Osaka League at the stadium (phone → Map)';
    await app.say('Coach Gonda', '(a message on your phone) Morning, rookie! The League desk opens at nine. Osaka League Stadium — it\'s on your map now. Don\'t be late!');
  }

  // ------------------------------------------------------------------ Day 2: the League (stadium beats)
  leagueBeats(mapId) {
    const app = this.app, w = app.world, s = app.state, beat = s.story.beat;
    if (mapId !== 'stadium' || beat !== 'league1') return;
    const ring = w.meta.spawns.ring, desk = w.meta.spawns.desk || w.meta.spawns.start;
    w.meta.hotspots.unshift({ x: desk[0], y: desk[1] - 8, r: 30, label: 'League desk', icon: 'talk', bubbleH: 40, act: async () => {
      await app.say('Ms. Aoi', 'Welcome to the Osaka League! A new registration? …Ah, Coach Gonda called ahead. He says you\'re "loud but promising".', 'You start at Rookie D. Win rank matches to earn League points — the ladder goes D, C, B, A, S… and at the very top, the Champions.', 'Stadium rules: a match clock, and at kick-off and half-time you choose the arena — rocky, grassy or water. Pick the one that helps your partner!', 'Your first opponent is already warming up. Good luck out there!');
      s.flags.league_registered = true;
      const pick = (...ids) => ids.find((id) => DESIGNS_HAS(id)) || s.party[0].species;
      const r1 = await app.startBattle({ title: 'RANK MATCH', subtitle: 'Rookie D  ·  vs DJ Revolver', stadium: true, chooseArena: true, clock: { len: 150 }, at: ring, arenaR: 8.5, money: 600, music: 'league',
        foe: { name: 'DJ Revolver', team: [[pick('lemmo', 'zapanda'), 6], [pick('kappachi', 'cabbunny'), 6]], ai: 'normal' } });
      const won1 = r1 && r1.winner === 0;
      if (S.addLeaguePoints(s, won1 ? 70 : 25)) app.ui.toast('Rank up! ' + S.rankOf(s).name, { icon: 'star', color: T.amber });
      await app.say('Reporter', won1 ? 'Channel 7 Sports, live from the ring! A rookie win on day one! How does it feel?' : 'Channel 7 Sports! A tough loss — but what a debut! Any words for the fans?', `…"${SPECIES[s.party[0].species].name} did all the work"? Ha! Modest, too. The crowd loves you!`);
      await app.say('Ms. Aoi', 'Lunch break! Matches resume at two. The takoyaki on the upper concourse is legendary — and your partner looks hungry.');
      s.time.hour = 14; S.healParty(s, 1); app.ui.toast('Lunch break — team healed', { icon: 'heart', color: T.green });
      const rival = COUNTER[s.party[0].species] || 'bubblion';
      await app.say('Kaito', 'So you actually showed up. Good. I wanted a witness when I put you back in your place.', `${SPECIES[rival].name} and I trained all night. This time there\'s a whole stadium watching.`);
      const r2 = await app.startBattle({ title: 'RANK MATCH', subtitle: 'vs KAITO', stadium: true, chooseArena: true, clock: { len: 150 }, at: ring, arenaR: 8.5, money: 900, music: 'league',
        foe: { name: 'Kaito', team: [[rival, 8], [pick('studrat', 'zapanda'), 6]], ai: 'normal' } });
      const won2 = r2 && r2.winner === 0;
      if (S.addLeaguePoints(s, won2 ? 90 : 30)) app.ui.toast('Rank up! ' + S.rankOf(s).name, { icon: 'star', color: T.amber });
      await app.say('Kaito', won2 ? '…Fine. You\'re good. Don\'t let it go to your head — the ladder only gets steeper from here.' : 'Ha! Now we\'re even. See you higher up the ladder.');
      await app.say('Coach Gonda', `${S.rankOf(s).name} after one day — not bad, rookie!`, 'Take the afternoon: train against wild Tokonmon, explore, eat something. More rank matches tomorrow.', '…And keep your eyes open. Team Metallica has been asking around about you.');
      s.story.beat = 'league2'; s.time.hour = 16; app.save();
      app.objective = 'Afternoon free time: train, explore, eat. Rank matches continue tomorrow.';
    } });
  }

  async roam() {
    const app = this.app;
    const id = app.state.map && app.state.map.id;
    const { MAPS } = await import('./maps.js');
    await app.world.load(MAPS[id] ? id : 'plaza', 'start', { night: MAPS[id] && MAPS[id].night });
    app.mode = 'world';
    await app.fade(0, 600);
    app.objective = app.objective || 'Explore the plaza';
  }
}

// ------------------------------------------------------------------ title screen
class TitleScreen {
  constructor(app, canContinue) {
    this.app = app; this.can = canContinue; this.t = 0;
    this.sc = buildPlaza({ viewW: app.vw, viewH: app.vh, night: true });
    this.sc.cam.x = 40; this.sc.cam.y = 60;
    this.sc.fx.push(ambient('fireflies'));
    // the three starters, asleep under the street lamp
    this.mons = [['chilichick', 316, 294, 'sleep', -45], ['strawbaa', 398, 300, 'sleep', 45], ['bubblion', 352, 286, 'idle', -30]].map(([id, x, y, clip, yaw]) => {
      const spr = new MonSprite(id, { scale: 0.58, yaw }); spr.play(clip); spr.setBase(clip);
      this.sc.actors.add(new Actor({ x, y, src: () => spr.frame() })); return spr;
    });
    app.attachStage(this.sc, { terrain: this.sc.terrain, night: true });
    app.post.opts.night = 0.25; app.post.opts.bloom = 0.7; app.post.opts.threshold = 0.72; app.post.opts.rays = 0;
    this.choice = new Promise((r) => { this.resolve = r; });
    app.battle = app.battle || null;
  }
  update(dt) { this.t += dt; for (const m of this.mons) m.update(dt); this.sc.cam.x = 40 + Math.sin(this.t * 0.05) * 60 + this.t * 2; this.sc.cam.y = 60 + Math.sin(this.t * 0.03) * 20; if (this.sc.vw !== this.app.vw) this.sc.setView(this.app.vw, this.app.vh); }
  render(t) { return this.sc.render(t); }
  drawUI(ui) {
    const W = ui.w, H = ui.h, cx = W >> 1, y0 = Math.round(H * 0.22);
    ui.text('トコンモン', cx, y0 - 16, T.pink, { align: 'center', jpSize: 12, outline: T.ink });
    // logo: chunky letters with a warm gradient feel (outline + drop shadow + highlight)
    const sc = W > 400 ? 4 : 3;
    ui.text('TOKONMON', cx + 2, y0 + 2, '#3a1430', { align: 'center', scale: sc, spacing: sc });
    ui.text('TOKONMON', cx, y0, T.amber, { align: 'center', scale: sc, spacing: sc, outline: T.ink });
    ui.text('OSAKA  2050', cx, y0 + 8 * sc + 6, T.cyan, { align: 'center', outline: T.ink });
    const bw = 120, bx = cx - (bw >> 1);
    let by = Math.round(H * 0.6);
    if (this.can) { if (ui.button(bx, by, bw, 18, 'Continue', { icon: 'play', color: T.amber, hotkey: 'Enter' })) this.done('continue'); by += 22; }
    if (ui.button(bx, by, bw, 18, 'New Game', { icon: 'star', color: T.cyan, hotkey: this.can ? 'n' : 'Enter' })) this.done('new');
    ui.text('v2 · HD-2D edition', W - 4, H - 10, T.dim, { align: 'right', mini: true });
  }
  done(v) { if (this.picked) return; this.picked = true; this.app.audio.sfx && this.app.audio.sfx('ui_confirm'); Object.assign(this.app.post.opts, { night: 0, bloom: 0.45, threshold: 0.8, rays: 0.06 }); this.resolve(v); }
}
class BlackCard { render() { return null; } drawUI(ui) { ui.rect(0, 0, ui.w, ui.h, '#0c0814'); } }
class DayCard {
  constructor(app, title, sub) { this.app = app; this.title = title; this.sub = sub; this.t = 0; }
  render() { return null; }
  drawUI(ui, dt) {
    this.t += dt || 1 / 60;
    ui.rect(0, 0, ui.w, ui.h, '#0c0814');
    const cx = ui.w >> 1, cy = (ui.h >> 1) - 10, k = Math.min(1, this.t * 2);
    ui.rect(cx - 70, cy + 22, Math.round(140 * k), 1, T.amber);
    ui.text(this.title, cx + 2, cy + 2, '#3a1430', { align: 'center', scale: 3, spacing: 3 });
    ui.text(this.title, cx, cy, T.amber, { align: 'center', scale: 3, spacing: 3, outline: T.ink });
    if (this.t > 0.5) ui.text(this.sub, cx, cy + 30, T.text, { align: 'center', shadow: T.ink });
  }
}

// ------------------------------------------------------------------ starter card
class StarterCard {
  constructor(app, st) {
    this.app = app; this.st = st; this.t = 0;
    this.spr = new MonSprite(st.id, { scale: 1, yaw: -24, pitch: 16 });
    this.result = new Promise((r) => { this.resolve = r; });
  }
  draw(ui, dt) {
    this.t += dt; this.spr.update(dt);
    const W = ui.w, H = ui.h, sp = SPECIES[this.st.id];
    const cw = Math.min(W - 16, 300), ch = Math.min(H - 16, 190), x = (W - cw) >> 1, y = (H - ch) >> 1;
    ui.fade(0.45, '#0c0814');
    ui.panel(x, y, cw, ch, { dots: true });
    ui.banner(x + 6, y + 6, sp.name.toUpperCase(), { color: this.st.color, icon: this.st.icon });
    // creature on a spotlight disc
    const f = this.spr.frame();
    const px = x + 8, py = y + 22;
    ui.s.ellipse(px + 52, py + 92, 34, 7, '#3e3460'); ui.s.ellipse(px + 52, py + 92, 26, 5, '#4e4478');
    if (f) blit(ui.s, f.surf, Math.round(px + 52 - f.ax), Math.round(py + 92 - f.ay));
    // info
    const tx = x + 118, tw = cw - 126;
    ui.text(this.st.el.toUpperCase() + ' TYPE', tx, y + 26, this.st.color, { shadow: T.ink });
    const lines = ui.wrap(this.st.blurb, tw);
    lines.forEach((l, i) => ui.text(l, tx, y + 40 + i * 10, T.text, { shadow: T.ink }));
    const by = y + ch - 24;
    if (ui.button(tx, by, 74, 18, 'Choose', { icon: 'check', color: T.green, hotkey: 'Enter' })) this.resolve(true);
    if (ui.button(tx + 80, by, 64, 18, 'Back', { icon: 'cross', color: T.dim, hotkey: 'Escape' })) this.resolve(false);
  }
}
export function blit(dst, src, x, y) {
  for (let j = 0; j < src.h; j++) { const Y = y + j; if (Y < 0 || Y >= dst.h) continue; for (let i = 0; i < src.w; i++) { const v = src.data[j * src.w + i]; if (!(v >>> 24)) continue; const X = x + i; if (X >= 0 && X < dst.w) dst.data[Y * dst.w + X] = v; } }
}
