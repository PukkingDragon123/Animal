// The San Francisco story, told in camera shots and cutscenes. Day 1 opens in
// Chinatown: Grandma's bakery, a stray Chilichick on a hot-sauce rampage, Coach
// Gonda and the three partners, a first battle with Kaito, the TokoPhone — then
// the city opens up on the phone map.
import { T } from '../../px/game/ui.js';
import * as S from '../../game/state.js';
import { LOCATIONS } from './locations.js';
import { SPECIES } from '../../data/species.js';
import { view } from './cinema.js';

const STARTERS = ['chilichick', 'bubblion', 'strawbaa'];
export class Story {
  constructor(app) { this.app = app; this.busy = false; this.title = null; this.objective = null; this.caption = null; }
  // run a scripted sequence exclusively (hotspots and the phone wait)
  run(fn) {
    if (this.busy) return Promise.resolve();
    this.busy = true;
    return Promise.resolve().then(fn).catch((e) => { console.error(e); const el = document.getElementById('err'); if (el) { el.style.display = 'block'; el.textContent = 'Story: ' + (e.stack || e); } }).finally(() => { this.busy = false; });
  }
  home() { return LOCATIONS.chinatown.spots && Object.keys(LOCATIONS.chinatown.spots).length ? 'chinatown' : 'alamo'; }
  async boot() {
    const app = this.app;
    if (app.params.get('loc')) {
      this.loadSave();
      await this.run(async () => {
        const w = app.world; await w.load(app.params.get('loc'), { mood: app.params.get('mood') || undefined });
        if (app.params.get('lights') && w.sc.lights) w.sc.lights(true);
        const atP = app.params.get('at') && app.params.get('at').split(',').map(Number);
        if (app.params.get('roam') && atP) await this.startRoam([atP[0], atP[1], atP[3] || 0, atP[2] ? atP[2] * 3 : undefined]);
        else if (app.params.get('roam')) await this.startRoam((w.loc.spots && w.loc.spots.start) || (w.sc.spots && (w.sc.spots.start || w.sc.spots.entrance || w.sc.spots.door)) || [w.cam.target.x, w.cam.target.z + 2, 0]);
        await app.fade(0, 500);
      });
      return;
    }
    await this.titleScreen();
  }
  loadSave() { const s = S.load(); if (s) this.app.state = s; }
  // free roam: the player (and the lead Tokonmon as a partner) under tap-to-move control
  async startRoam(at) {
    const w = this.app.world, st = this.app.state, [x, z, yaw, y] = at;
    const hero = w.actor('hero') || w.addPerson('hero', st.look || 'hero', [x, z, yaw || 0, y]);
    let partner = w.actor('partner');
    const lead = st.party && st.party[0];
    if (!partner) partner = await w.addMon('partner', (lead && lead.species) || 'chilichick', [x + 1, z - 0.8, yaw || 0, y], { drip: (lead && lead.drip) || 1, look: (lead && lead.look) || 0 });
    w.setPlayer(hero, partner).roam(true); this.app.roaming = true;
  }
  // ------------------------------------------------------------------ title
  async titleScreen() {
    const app = this.app, w = app.world;
    await w.load('city', { mood: 'night', life: false });
    w.setCam({ target: [150, 2, 70], dist: 95, yaw: 45, pitch: 32 }); w.drift = 0;
    // the backdrop: a slow, looping flyover of the city at night (the director's rig; no bars)
    const cin = app.cinema;
    if (cin) cin.flyover([
      { target: [150, 2, 70], dist: 95, yaw: 45, pitch: 30 }, { target: [186, 4, 64], dist: 70, yaw: 80, pitch: 24 },
      { target: [160, 2, 22], dist: 80, yaw: 150, pitch: 28 }, { target: [96, 2, 40], dist: 105, yaw: 200, pitch: 34 },
      { target: [62, 3, 140], dist: 85, yaw: 300, pitch: 30 }, { target: [140, 2, 150], dist: 90, yaw: 10, pitch: 32 },
    ], { seg: 14 });
    const cc = await w.addMon('t-cc', 'chilichick', [w.spot('square')[0], w.spot('square')[1], 0], { clip: 'sleep' });
    void cc;
    this.title = { t: 0, hasSave: S.hasSave() };
    if (app.audio.music) app.audio.music('menu', { fade: 0.5 });
    const T_ = this.title, artP = import('./keyart.js').then((m) => m.showKeyArt(app)).then((a) => { T_.art = a; return a; }).catch((e) => { console.warn('key art', e); return null; });
    await app.fade(0, 900);
    const pick = await new Promise((r) => { this.title.pick = r; });
    this.title = null; artP.then((a) => a && a.remove());
    if (pick === 'continue') { this.loadSave(); await this.run(() => this.resume()); }
    else await this.run(async () => { await this.newGameSwoop(); await this.opening(); });
  }
  // NEW GAME: the bars slide in and the night camera dives toward Sunset Row before the screen goes dark
  async newGameSwoop() {
    const app = this.app, cin = app.cinema; if (!cin) return;
    if (app.audio.sfx) app.audio.sfx('whoosh', { vol: 0.8, pitch: 0.8 });
    await cin.begin();
    const dive = cin.move(view([64, 3, 148], 26, 330, 24), { dur: 2.4, ease: (t) => t * t * (3 - 2 * t) });
    await app.wait(1500 * cin.k);
    await app.fade(1, 700 * cin.k);
    await dive;
    await cin.end({ release: false });
  }
  drawTitle(ui, dt) {
    const T_ = this.title; T_.t += dt; const W = ui.w, H = ui.h, a = Math.min(1, T_.t / 1.5);
    if (!T_.art) {   // the pixel logo only until the high-res key art (keyart.js) is ready
      const ly = Math.round(H * 0.2) - Math.round((1 - a) * 10);
      ui.text('TOKONMON', (W >> 1) + 1, ly + 3, '#1a0d04', { align: 'center', scale: 3 });
      ui.text('TOKONMON', W >> 1, ly, null, { align: 'center', scale: 3, outline: T.ink, grad: [T.paperL, T.amberL, T.amber] });
      ui.sparkle(W / 2 + 62, ly + 2 + Math.round(Math.sin(T_.t * 2)), T.amberL, (Math.sin(T_.t * 3) + 1) / 2);
      ui.text('SAN FRANCISCO', W >> 1, ly + 28, T.paper, { align: 'center', outline: T.ink });
    }
    // two wooden buttons with icons (Enter / C still work)
    const by = Math.round(H * (T_.art ? 0.46 : 0.62)), bw = 116, pop = (i) => Math.round((1 - Math.min(1, Math.max(0, T_.t * 3 - i * 0.3))) * 10);
    if (ui.button((W >> 1) - bw / 2, by + pop(0), bw, 22, 'New Game', { color: T.leaf, icon: 'leaf', hotkey: 'Enter' }) && T_.pick) T_.pick('new');
    if (T_.hasSave && ui.button((W >> 1) - bw / 2, by + 26 + pop(1), bw, 22, 'Continue', { color: T.cyan, icon: 'book', hotkey: 'c' }) && T_.pick) T_.pick('continue');
    ui.text('an original homage to the music of everywhere', W >> 1, H - 12, T.paper, { align: 'center', mini: true, outline: T.ink });
  }
  // ------------------------------------------------------------------ UI layer for the story (title, captions, objective, phone button)
  drawUI(ui, dt) {
    if (this.title) return this.drawTitle(ui, dt);
    const app = this.app;
    if (this.caption) { const c = this.caption; c.t += dt; const a = Math.min(1, c.t * 2, (c.dur - c.t) * 2); if (a > 0) { ui.text(c.text, 10, ui.h - 22, T.text, { outline: '#0c0814' }); if (c.sub) ui.text(c.sub, 10, ui.h - 12, T.amber, { mini: true, outline: '#0c0814' }); } if (c.t > c.dur) this.caption = null; }
    if (!(app.battle && app.battle.active)) this.drawGoal(ui);
    if (this.busy || ui.dialog || (app.battle && app.battle.active)) return;
    if (app.roaming && app.hud) return;   // the HUD shows the objective and opens the phone / menu
    const obj = this.objective || (app.quests && app.quests.objective());
    if (obj) ui.objective(4, 4, obj, { maxW: ui.w - 70 });
    if (app.state.flags.phone && !app.phone.open && ui.iconButton(ui.w - 28, 3, 24, 'phone', { color: T.cyan, hotkey: 'Tab' })) app.phone.toggle();
  }
  cap(text, sub, dur = 4) { this.caption = { text, sub, dur, t: 0 }; }
  // the objective marker: a bouncing arrow over the goal, or an arrow at the screen edge pointing to it
  drawGoal(ui) {
    const g = this.goal, w = this.app.world; if (!g || !w.ready || ui.dialog) return;
    const s = w.project([g.x, g.y, g.z]), cx = ui.w / 2, cy = ui.h / 2, bob = Math.round(Math.sin(this.app.t * 5) * 2);
    const on = s.vis && s.x > 8 && s.x < ui.w - 8 && s.y > 24 && s.y < ui.h - 8;
    if (on) {
      const x = Math.round(s.x), y = Math.round(s.y) + bob;
      for (let i = 0; i < 6; i++) { ui.rect(x - 5 + i, y - 10 + i, 11 - 2 * i, 1, '#2a1018'); ui.rect(x - 4 + i, y - 10 + i, 9 - 2 * i, 1, i < 2 ? '#fff0b0' : T.amber); }
      if (g.label) ui.text(g.label, x, y - 20, T.amber, { align: 'center', outline: '#1a0e18', mini: true });
    } else {
      let dx = s.x - cx, dy = s.y - cy; if (!s.vis) { dx = -dx; dy = -dy; }
      const a = Math.atan2(dy, dx), r = Math.min((ui.w / 2 - 14) / Math.abs(Math.cos(a) || 1e-6), (ui.h / 2 - 14) / Math.abs(Math.sin(a) || 1e-6)), x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
      for (let t = -5; t <= 5; t++) for (let k = -Math.round(4 - Math.abs(t) * 0.7); k <= Math.round(4 - Math.abs(t) * 0.7); k++) { const px = Math.round(x + Math.cos(a) * t - Math.sin(a) * k * 0.6), py = Math.round(y + Math.sin(a) * t + Math.cos(a) * k * 0.6); ui.px(px, py, t > 2 ? '#fff0b0' : T.amber); }
    }
  }
  // ------------------------------------------------------------------ Day 1
  // the opening (Day 1) lives in day1.js
  async opening() { const { day1 } = await import('./day1.js'); await day1(this); }
  async openingClassic() {
    const app = this.app, w = app.world, home = this.home();
    await app.fade(1, 500);
    await w.load(home, { mood: 'golden' });
    const sp = (k, d) => w.loc.spots[k] || d;
    const S0 = sp('start', [20, 21.8, 0]), at = (x, z, h = 0.6) => [x, w.ground(x, z) + h, z];
    // establishing shot
    w.setCam({ ...(w.loc.view || w.sc.view), dist: (w.loc.view || w.sc.view).dist * 1.25 });
    await app.fade(0, 900);
    this.cap(home === 'chinatown' ? 'San Francisco — Chinatown' : 'San Francisco — Alamo Square', 'Saturday, 7:02 AM', 4.5);
    await w.shot(w.loc.view || w.sc.view, 3.2);
    const hero = w.addPerson('hero', 'hero', [S0[0], S0[1], S0[2]]);
    const gma = w.addPerson('grandma', 'grandma', [S0[0] - 1.6, S0[1] - 0.2, 0.4]);
    hero.play('stretch');
    await w.closeOn(hero, { dist: 5.2, dx: -0.8 });
    await app.say('Grandma', 'Ren! Finally awake. The whole street has been up since dawn.', 'Today\'s the day, isn\'t it? Coach Gonda is giving out partners in the square at nine.');
    hero.play('talk'); await app.say('Ren', 'I know, I know! I was up all night watching League replays.'); hero.play('idle');
    // the stray
    gma.play('shock'); w.emote('grandma', 'sweat');
    await app.say('', 'AAAAAAAAAAAAH!!');
    const cc = await w.addMon('cc', 'chilichick', [S0[0] + 9, S0[1] + 1.2, -Math.PI / 2]);
    w.shot({ target: at(S0[0] + 4.5, S0[1] + 1.2), dist: 7, yaw: 10, pitch: 12 }, 1.0);
    await cc.walkTo([[S0[0] + 2.2, S0[1] + 1.2]], { speed: 3.2 });
    cc.face(hero); cc.play('cry'); w.emote('cc', 'anger');
    await app.wait(1600);
    await app.say('', 'A furious little chick tears down the street, crying rivers, clutching a stolen bottle of hot sauce.');
    const chef = w.addPerson('chef', 'chef', [S0[0] + 10, S0[1] + 0.6, -Math.PI / 2]);
    chef.play('angry'); await chef.walkTo([[S0[0] + 4.6, S0[1] + 0.6]], { speed: 2.4, clip: 'run' }); chef.play('angry');
    await app.say('Chef Wong', 'Hey! HEY! That\'s my house-made chili sauce, you little menace!');
    cc.play('sip'); await app.wait(2700);
    await app.say('', 'The Chilichick takes a defiant swig… and screams fire at the sky.');
    hero.face(cc); hero.play('laugh');
    await app.say('Ren', 'Ha! It\'s even angrier than you are, Mr. Wong.');
    // the coach
    const coach = w.addPerson('coach', 'coach', [S0[0] - 9, S0[1] + 1, Math.PI / 2]);
    await coach.walkTo([[S0[0] - 2.4, S0[1] + 1.2]], { speed: 1.6 });
    coach.face(hero); await w.closeOn(coach, { dist: 5, dx: 1 });
    await app.say('Coach Gonda', 'Easy, everyone. A wild Chilichick only gets that loud when it\'s looking for somebody.', 'You must be Ren. I\'m Gonda — I coach the Chinatown Dragons in the Tokon League.');
    // the three partners
    const bb = await w.addMon('bb', 'bubblion', [S0[0] - 1.2, S0[1] + 3.2, 0]);
    const sb = await w.addMon('sb', 'strawbaa', [S0[0] + 1.2, S0[1] + 3.4, 0]);
    cc.walkTo([[S0[0], S0[1] + 3.2]], { speed: 2 });
    coach.play('point');
    await w.shot({ target: at(S0[0], S0[1] + 3.2, 0.45), dist: 6.5, yaw: 0, pitch: 16 }, 1.4);
    await app.say('Coach Gonda', 'Every rookie in the city starts with one of three. Bubblion, the black-and-white prince who never leaves his bubble.', 'Strawbaa, old as the hills and twice as stubborn — the best healer you\'ll ever meet.', '…and it seems Chilichick has already picked you.');
    let pick = await app.choose('Who will be your partner?', ['Chilichick', 'Bubblion', 'Strawbaa']);
    pick = STARTERS[pick ?? 0];
    S.giveStarter(app.state, pick, 5); S.setFlag(app.state, 'starter_' + pick);
    const chosen = { chilichick: cc, bubblion: bb, strawbaa: sb }[pick];
    chosen.play('win'); w.burst('sparkle', [chosen.g.position.x, chosen.g.position.y + 0.6, chosen.g.position.z], { n: 16 });
    await app.wait(1500);
    app.toast(`${SPECIES[pick].name} joined your team!`, { icon: 'star', color: T.amber, dur: 3 });
    for (const [k, a] of [['chilichick', cc], ['bubblion', bb], ['strawbaa', sb]]) if (k !== pick) w.remove(a.id);
    // the rival
    const kaito = w.addPerson('kaito', 'kaito', [S0[0] + 8, S0[1] + 2.6, -Math.PI / 2]);
    await kaito.walkTo([[S0[0] + 3.4, S0[1] + 2.8]], { speed: 1.4 }); kaito.face(hero);
    await w.closeOn(kaito, { dist: 5 });
    await app.say('Kaito', 'So this is Gonda\'s new rookie. Cute.', 'Let\'s see if you can keep that partner of yours alive for one whole minute.');
    const res = await app.startBattle({ foe: { name: 'Kaito', team: [['zapanda', 5]] }, title: 'VS KAITO', subtitle: 'First battle', tutorial: true, canLose: true });
    // aftermath
    await app.fade(0, 400);
    const won = res && res.winner === 0;
    kaito.play(won ? 'sad' : 'laugh');
    await app.say('Kaito', won ? 'Tch. Beginner\'s luck. Don\'t get used to it.' : 'One minute. Exactly as I said. See you around, rookie.');
    await kaito.walkTo([[S0[0] + 12, S0[1] + 2.6]], { speed: 1.6 }); w.remove('kaito');
    coach.face(hero); await w.closeOn(coach, { dist: 5 });
    await app.say('Coach Gonda', 'Not bad for a first fight. Here — every rookie gets one of these.', 'Your TokoPhone. The map shows where Tokonmon are gathering around the city. Start with Alamo Square — the Pidgun there have gotten… cocky.');
    S.setFlag(app.state, 'phone'); S.setFlag(app.state, 'license'); S.setFlag(app.state, 'bracelet'); S.unlockLocation(app.state, 'alamo'); S.unlockLocation(app.state, home);
    S.addItem(app.state, 'quartz', 5);
    app.toast('Got the TokoPhone!', { icon: 'phone', color: T.cyan, dur: 3 });
    this.objective = 'Open the map and go to Alamo Square';
    app.save();
    await w.shot(w.loc.view || w.sc.view, 2.2);
  }
  async resume() {
    const app = this.app, M = app.state.map || {}, id = M.id === 'city' || !M.id ? 'city' : M.id, cin = app.cinema;
    await app.fade(1, 300); await app.world.load(id);
    if (id === 'city') { const at = M.x !== undefined ? [M.x, M.z, 0, M.y] : app.world.spot('frontDoorOut'); await this.startRoam(at); }
    // back in: a short crane down onto where you left off, then the follow camera blends in (the HUD shows the place)
    const p = app.world.player;
    if (cin && p) {
      app.world.free = false;
      await cin.begin({ bars: false });
      const q = p.g.position;
      await cin.cut({ target: q.clone().setY(q.y + 1), dist: 48, yaw: 20, pitch: 55 });
      const down = cin.move({ target: q.clone().setY(q.y + 1), dist: 18, yaw: 40, pitch: 34 }, { dur: 2.6 });
      await app.fade(0, 600);
      await down;
      await cin.end({ dur: 1.0 });
      app.world.roam(true);
    } else await app.fade(0, 600);
    this.objective = app.state.flags.alamo_done ? 'Explore the city' : 'Open the map and go to Alamo Square';
  }
  // first visits
  async onArrive(id) {
    const app = this.app, s = app.state;
    if (id === 'alamo' && !s.flags.alamo_seen) {
      S.setFlag(s, 'alamo_seen'); this.objective = 'Check the tall grass in the park';
      await this.pigeonGang();
    }
  }
  // Alamo Square: the Pidgun gang that rules the park (the Guns N' Roses homage)
  async pigeonGang() {
    const app = this.app, w = app.world, P = w.loc.spots.park || [32, 39.5, 0], at = (x, z, h = 0.5) => [x, w.ground(x, z) + h, z];
    const has = (id) => !!SPECIES[id];
    await w.shot({ target: at(P[0], P[1]), dist: 9, yaw: 10, pitch: 18 }, 1.6);
    await app.say('', 'The Painted Ladies glow in the late sun. Up in the park, a ring of Pidgun struts in tight circles — like a band warming up.');
    const boss = await w.addMon('gang-m', 'pidgun', [P[0] - 1, P[1] + 0.4, 0]), rose = await w.addMon('gang-f', 'pidrose', [P[0] + 1, P[1] + 0.6, 0]);
    boss.play('cry'); await app.wait(900); rose.play('cry');
    await app.say('', 'Two of them step out front: one twirling an oversized antique revolver, the other with a red rose tucked under her wing.', 'Every Pidgun in the square goes quiet. Welcome to the jungle.');
    if (has('pidgun')) {
      const res = await app.startBattle({ foe: { name: 'Pidgun Gang', team: [['pidgun', 6]] }, title: 'PIDGUN GANG!', subtitle: 'Alamo Square' });
      await app.fade(0, 400);
      if (res && res.winner === 0) { boss.play('hurt'); await app.say('', 'The gang scatters in a storm of feathers… but the rose-carrier lingers, eyeing you. Maybe she\'d join you, if you met her in the tall grass.'); }
    } else await app.say('', '…they look you up and down, coo once, and go back to strutting. Not today.');
    w.remove('gang-m'); w.remove('gang-f');
    await w.shot(w.loc.view, 1.6);
  }
  // ------------------------------------------------------------------ actions used by hotspots
  async wildBattle(loc) {
    const app = this.app, w = app.world;
    const pool = { alamo: ['pidgun', 'pidgun', 'cabbunny', 'lemmo', 'trashcoon'] }[loc] || ['lemmo'];
    const ok = pool.filter((id) => SPECIES[id]), foe = ok[Math.floor(Math.random() * ok.length)] || 'lemmo';
    const res = await app.startBattle({ foe: { name: 'Wild ' + SPECIES[foe].name, team: [[foe, 4 + Math.floor(Math.random() * 3)]] }, wild: true, title: 'WILD TOKONMON!', subtitle: SPECIES[foe].name });
    await app.fade(0, 400);
    if (res && res.winner === 0) { S.setFlag(app.state, 'alamo_done'); this.objective = 'Explore the city'; }
    void w;
  }
  // ---- free-roam places and side quests
  async goHome() {
    const app = this.app;
    if (app.world.id === 'apartment') return app.travel('chinatown', { at: 'home' });
    await app.travel('apartment', { at: 'door' });
    if (app.quests.at('tarts') === 1) {
      const w = app.world, mom = await w.addMon('mom', 'wheezowl', w.spot('seatMom'), { clip: 'talk' });
      await app.say('Mom', 'Hoo! Egg tarts from Lucky Moon? Still warm! You\'re a good kid.', '*wheeze* …Here, take a little something for the cable car.');
      app.quests.complete('tarts'); mom.play('hug');
    }
  }
  async bakery() {
    const app = this.app, Q = app.quests;
    if (Q.at('tarts') === 0) {
      await app.say('Baker', 'Fresh egg tarts, flaky as a cloud! For your mom? Ha — tell her it\'s on the house this time.');
      app.toast('Got a box of egg tarts', { icon: 'bowl', color: T.amber, dur: 2.2 }); Q.next('tarts');
    } else await app.say('Baker', 'Come back tomorrow — the pineapple buns are coming out at six!');
  }
  async gearShop() {
    const app = this.app;
    if (!app.state.flags.gearShopMet) { app.state.flags.gearShopMet = true; await app.say('Clerk', 'Welcome to Gateway Music & Gear! Picks, pedals, amps, kicks — gear makes your Tokonmon hit harder.', 'Drip? Chains, crowns, jackets? Ha — that you earn out there, kid. Can\'t buy style.'); }
    const { GearShop } = await import('./shop.js');
    await new GearShop(app).open();
  }
  async chessUncle() {
    const app = this.app, Q = app.quests;
    if (Q.at('chess') !== 0) { await app.say('Uncle Ho', 'Again tomorrow, young one. These old bones need a nap.'); return; }
    await app.say('Uncle Ho', 'Ho! A young trainer. Xiangqi is slow — let\'s play the fast kind. Beat my partner and I\'ll teach you a thing or two.');
    if (!app.state.party.length) { await app.say('Uncle Ho', '…You don\'t have a partner yet? Come back when you do.'); return; }
    const res = await app.startBattle({ foe: { name: 'Uncle Ho', team: [['kappachi', 6]] }, title: 'UNCLE HO', subtitle: 'Portsmouth Square', canLose: true, partySize: 2 });
    await app.fade(0, 400);
    if (res && res.winner === 0) { await app.say('Uncle Ho', 'Hah! The board is yours today. Take this — you earned it.'); Q.next('chess'); Q.complete('chess'); }
    else await app.say('Uncle Ho', 'Patience, young one. Patience wins wars.');
  }
  async tramStop() { const app = this.app; await app.say('', 'A brass sign: CALIFORNIA ST. CABLE CAR. Stops you\'ve visited are on your phone\'s map.'); app.phone.tab = 'map'; app.phone.open = true; }
  async rest() { const app = this.app; await app.say('', 'You sit for a while. The fog rolls in over the hills.'); S.healParty(app.state, 1); app.toast('Team rested', { icon: 'heart', color: T.green }); app.save(); }
}
