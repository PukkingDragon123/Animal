// Story for the 2D edition. Chapter 1 opening: title → Osaka 2050 intro → the
// plaza where Coach Gonda has three starters waiting → pick your partner → the
// soul-stone bracelet + phone → rival Kaito challenges you → free roam.
import { T } from './ui.js';
import { MonSprite, bank } from './mon.js';
import { buildPlaza } from '../../data/scenes/plaza.js';
import { SPECIES } from '../../data/species.js';
import * as S from '../../game/state.js';

const STARTERS = [
  { id: 'chilichick', el: 'Pyro', color: '#ff7a3a', icon: 'flame', blurb: 'A fire chick that lives in a hollowed-out chili and never stops eating them. Always teary, always fearless. Fast, close-range, scary fire.' },
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
    app.audio.sfx('evolve');
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
    await app.say('Coach Gonda', 'Explore the plaza a bit. Grab a bowl of ramen — Tokonmon learn things from food, you know. Spicy food especially, for that one.', 'Meet me at the subway gate when you\'re ready for the League office.');
    app.objective = 'Explore the plaza — then meet Coach Gonda at the subway gate';
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
    app.attachStage(this.sc, { terrain: this.sc.terrain, night: true });
    app.post.opts.night = 0.25; app.post.opts.bloom = 0.7; app.post.opts.threshold = 0.72; app.post.opts.rays = 0;
    this.choice = new Promise((r) => { this.resolve = r; });
    app.battle = app.battle || null;
  }
  update(dt) { this.t += dt; this.sc.cam.x = 40 + Math.sin(this.t * 0.05) * 60 + this.t * 2; this.sc.cam.y = 60 + Math.sin(this.t * 0.03) * 20; if (this.sc.vw !== this.app.vw) this.sc.setView(this.app.vw, this.app.vh); }
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
  done(v) { if (this.picked) return; this.picked = true; this.app.audio.sfx && this.app.audio.sfx('ui_ok'); Object.assign(this.app.post.opts, { night: 0, bloom: 0.45, threshold: 0.8, rays: 0.06 }); this.resolve(v); }
}
class BlackCard { render() { return null; } drawUI(ui) { ui.rect(0, 0, ui.w, ui.h, '#0c0814'); } }

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
