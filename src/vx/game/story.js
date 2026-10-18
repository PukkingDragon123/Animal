// The San Francisco story, told in camera shots and cutscenes. Day 1 opens in
// Chinatown: Grandma's bakery, a stray Chilichick on a hot-sauce rampage, Coach
// Gonda and the three partners, a first battle with Kaito, the TokoPhone — then
// the city opens up on the phone map.
import { T } from '../../px/game/ui.js';
import * as S from '../../game/state.js';
import { LOCATIONS } from './locations.js';
import { SPECIES } from '../../data/species.js';

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
        if (app.params.get('roam')) await this.startRoam(w.loc.spots.start || [w.cam.target.x, w.cam.target.z + 2, 0]);
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
    w.setPlayer(hero, partner).roam(true);
  }
  // ------------------------------------------------------------------ title
  async titleScreen() {
    const app = this.app, w = app.world;
    await w.load(this.home(), { mood: 'night' });
    const v = w.loc.view || w.sc.view; w.setCam({ ...v, dist: v.dist * 0.8, pitch: (v.pitch || 40) - 8 });
    const cc = await w.addMon('t-cc', 'chilichick', w.loc.spots.start || [v.target[0], v.target[2] + 2, 0], { clip: 'sleep' });
    void cc;
    this.title = { t: 0, hasSave: S.hasSave() };
    await app.fade(0, 900);
    const pick = await new Promise((r) => { this.title.pick = r; });
    this.title = null;
    if (pick === 'continue') { this.loadSave(); await this.run(() => this.resume()); }
    else await this.run(() => this.opening());
  }
  drawTitle(ui, dt) {
    const T_ = this.title; T_.t += dt; const W = ui.w, H = ui.h, a = Math.min(1, T_.t / 1.5);
    ui.text('TOKONMON', W >> 1, Math.round(H * 0.2) - Math.round((1 - a) * 10), T.amber, { align: 'center', scale: 3, outline: '#2a0e10', shadow: '#000000' });
    ui.text('SAN FRANCISCO', W >> 1, Math.round(H * 0.2) + 28, T.cyan, { align: 'center', outline: '#0c1420' });
    const by = Math.round(H * 0.62), bw = 110;
    if (ui.button((W >> 1) - bw / 2, by, bw, 18, 'NEW GAME', { color: T.amber, hotkey: 'Enter' })) T_.pick('new');
    if (T_.hasSave && ui.button((W >> 1) - bw / 2, by + 22, bw, 18, 'CONTINUE', { color: T.cyan, hotkey: 'c' })) T_.pick('continue');
    ui.text('an original homage to the music of everywhere', W >> 1, H - 12, T.dim, { align: 'center', mini: true });
  }
  // ------------------------------------------------------------------ UI layer for the story (title, captions, objective, phone button)
  drawUI(ui, dt) {
    if (this.title) return this.drawTitle(ui, dt);
    const app = this.app;
    if (this.caption) { const c = this.caption; c.t += dt; const a = Math.min(1, c.t * 2, (c.dur - c.t) * 2); if (a > 0) { ui.text(c.text, 10, ui.h - 22, T.text, { outline: '#0c0814' }); if (c.sub) ui.text(c.sub, 10, ui.h - 12, T.amber, { mini: true, outline: '#0c0814' }); } if (c.t > c.dur) this.caption = null; }
    if (this.busy || ui.dialog || (app.battle && app.battle.active)) return;
    if (this.objective) { const w = Math.min(ui.w - 70, ui.tw(this.objective) + 22); ui.panel(4, 4, w, 15, {}); ui.icon('star', 8, 8, T.amber); ui.text(this.objective, 18, 8, T.text); }
    if (app.state.flags.phone && !app.phone.open && ui.button(ui.w - 26, 4, 22, 20, '', { icon: 'phone', color: T.cyan, hotkey: 'Tab' })) app.phone.toggle();
  }
  cap(text, sub, dur = 4) { this.caption = { text, sub, dur, t: 0 }; }
  // ------------------------------------------------------------------ Day 1
  async opening() {
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
    await app.say('Coach Gonda', 'Not bad for a first fight. Here — every rookie gets one of these.', 'Your TokoPhone. The map shows where Tokonmon are gathering around the city. Start with Alamo Square — the pigeons there have gotten… cocky.');
    S.setFlag(app.state, 'phone'); S.setFlag(app.state, 'license'); S.setFlag(app.state, 'bracelet'); S.unlockLocation(app.state, 'alamo'); S.unlockLocation(app.state, home);
    S.addItem(app.state, 'quartz', 5);
    app.toast('Got the TokoPhone!', { icon: 'phone', color: T.cyan, dur: 3 });
    this.objective = 'Open the map and go to Alamo Square';
    app.save();
    await w.shot(w.loc.view || w.sc.view, 2.2);
  }
  async resume() {
    const app = this.app, id = (app.state.map && app.state.map.id) || this.home();
    await app.fade(1, 300); await app.world.load(id); await app.fade(0, 600);
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
  // Alamo Square: the pigeon gang that rules the park (the Guns N' Roses homage)
  async pigeonGang() {
    const app = this.app, w = app.world, P = w.loc.spots.park || [32, 39.5, 0], at = (x, z, h = 0.5) => [x, w.ground(x, z) + h, z];
    const has = (id) => !!SPECIES[id];
    await w.shot({ target: at(P[0], P[1]), dist: 9, yaw: 10, pitch: 18 }, 1.6);
    await app.say('', 'The Painted Ladies glow in the late sun. Up in the park, a ring of pigeons struts in tight circles — like a band warming up.');
    const boss = await w.addMon('gang-m', 'pidgun', [P[0] - 1, P[1] + 0.4, 0]), rose = await w.addMon('gang-f', 'pidrose', [P[0] + 1, P[1] + 0.6, 0]);
    boss.play('cry'); await app.wait(900); rose.play('cry');
    await app.say('', 'Two of them step out front: one twirling an oversized antique revolver, the other with a red rose tucked under her wing.', 'Every pigeon in the square goes quiet. Welcome to the jungle.');
    if (has('pidgun')) {
      const res = await app.startBattle({ foe: { name: 'Pigeon Gang', team: [['pidgun', 6]] }, title: 'PIGEON GANG!', subtitle: 'Alamo Square' });
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
  async rest() { const app = this.app; await app.say('', 'You sit for a while. The fog rolls in over the hills.'); S.healParty(app.state, 1); app.toast('Team rested', { icon: 'heart', color: T.green }); app.save(); }
}
