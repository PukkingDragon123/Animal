// Quests: the main story line and side quests, and the tram that ties the city together.
// state.quests = { active: { id: stepIndex }, done: [id], counts: { id: n } }
// state.visited = [locationId] — a tram stop opens once you have been there on foot.
import { T } from '../../px/game/ui.js';
import { LOCATIONS } from './locations.js';

export const QUESTS = {
  day1: { main: true, title: 'A Brand-New Day', steps: [
    'Get up and get dressed', 'Have lunch with Mom', 'Head out and catch the tram', 'Follow the Coach to the street arena',
    'Win your first battle', 'Get to Pier 39 — fast!', 'Eat with the crew at the pier', 'Visit the Coach\'s dojo', 'Sign up for the League',
  ] },
  league: { main: true, title: 'The League Begins', steps: ['Get some rest — the League starts tomorrow'] },
  tarts: { title: 'Egg Tart Run', where: 'chinatown', steps: ['Buy egg tarts at Lucky Moon Bakery', 'Bring them home to Mom'], reward: { money: 150 } },
  chess: { title: 'Grandmaster of the Square', where: 'chinatown', steps: ['Challenge the xiangqi uncle in Portsmouth Square', 'Claim your prize'], reward: { money: 300 } },
  pigeons: { title: 'Pidgun Patrol', where: 'alamo', steps: ['Count the Pidgun strutting around Alamo Square (0/5)'], count: 5, reward: { money: 200 } },
  // [cave] the Deep Cave under Alamo Hill (src/vx/game/cave.js)
  deepcave: { title: 'Something Rumbles Under Alamo Hill', where: 'cave', steps: ['Find where the rumbling comes from on Alamo Hill', 'Explore the Deep Cave with your lantern', 'Open the crystal gate by Mirror Lake', 'Find a way through Old Mine No. 3', 'Find what glows in the deepest chamber'], reward: { money: 600 } },
};

export class Quests {
  constructor(app) { this.app = app; }
  get s() {
    const st = this.app.state; let q = st.vxQuests;
    if (!q) q = st.vxQuests = { active: {}, done: [], counts: {} };
    return q;
  }
  has(id) { return this.s.active[id] !== undefined; }
  done(id) { return this.s.done.includes(id); }
  at(id) { return this.s.active[id]; }
  start(id, step = 0) {
    if (this.done(id) || this.has(id) || !QUESTS[id]) return;
    this.s.active[id] = step; const Q = QUESTS[id];
    this.app.toast((Q.main ? 'Story: ' : 'New quest: ') + Q.title, { icon: Q.main ? 'star' : 'talk', color: Q.main ? T.amber : T.cyan, dur: 2.6 });
    this.app.audio.sfx && this.app.audio.sfx('ui_tap');
  }
  // move a quest to a step (index or step text prefix); toasts the new objective
  step(id, n) {
    if (!this.has(id)) this.start(id);
    const Q = QUESTS[id]; if (typeof n === 'string') n = Q.steps.findIndex((s) => s.startsWith(n));
    if (n < 0 || n === this.s.active[id]) return;
    this.s.active[id] = n;
    if (n >= Q.steps.length) return this.complete(id);
    if (!Q.main) this.app.toast(Q.steps[n], { icon: 'talk', color: T.cyan, dur: 2.2 });
  }
  next(id) { this.step(id, (this.at(id) ?? -1) + 1); }
  count(id, k = 1) {
    const Q = QUESTS[id]; if (!this.has(id) || !Q.count) return;
    const c = (this.s.counts[id] = (this.s.counts[id] || 0) + k);
    this.app.toast(Q.steps[0].replace(/\(\d+\/(\d+)\)/, `(${Math.min(c, Q.count)}/$1)`), { icon: 'talk', color: T.cyan, dur: 1.6 });
    if (c >= Q.count) this.complete(id);
  }
  complete(id) {
    if (!this.has(id)) return;
    delete this.s.active[id]; this.s.done.push(id);
    const Q = QUESTS[id];
    if (Q.reward && Q.reward.money) this.app.state.money = (this.app.state.money || 0) + Q.reward.money;
    this.app.toast((Q.main ? 'Chapter complete: ' : 'Quest complete: ') + Q.title + (Q.reward && Q.reward.money ? `  +${Q.reward.money}` : ''), { icon: 'check', color: T.green, dur: 3 });
    this.app.audio.sfx && this.app.audio.sfx('reward');
    if (!Q.main) this.celebrate(Q);
    this.app.save();
  }
  /** a side quest done: a QUEST COMPLETE card, the jingle, you pump a fist and your partner cheers */
  celebrate(Q) {
    const app = this.app, cin = app.cinema, w = app.world, me = w && w.player;
    if (app.auto || (cin && cin.skipping)) return;
    if (cin) cin.title('QUEST COMPLETE', Q.title, { hold: 2600, y: 0.3, wait: false, sfx: false });
    if (app.audio.jingle) app.audio.jingle('complete');
    if (me && w.fx) { me.play('pump', { restart: true }); w.fx.emit('star', me.headPos(), { n: 8 }); w.fx.emit('sparkle', me.headPos(), { n: 16 }); setTimeout(() => { if (me.anim && me.anim.cur === 'pump') me.play('idle', { fade: 0.3 }); }, 2400); }
    const b = w && w.partner; if (b && b.anim) { b.play(b.anim.clips.win ? 'win' : 'idle', { restart: true }); if (app.feel) app.feel.emote(b, 'star', 1.8); }
  }
  // ---------------------------------------------------------------- the walkable city's quest scenes
  /** wire the quests into a freshly built city (feel.js calls this on each new city): Mom takes the egg tarts */
  attach(city) {
    const mom = city && city.inter && city.inter.find((x) => x.npc === 'mom');
    if (mom && !mom.questWrapped) { const act = mom.act; mom.questWrapped = true; mom.act = async (app, it) => (this.at('tarts') === 1 ? this.tartsScene() : act(app, it)); }
  }
  /** Egg Tart Run, the end: Mom gets her tarts (inside the talk camera's conversation: it cuts on each speaker) */
  async tartsScene() {
    const app = this.app, w = app.world, cin = app.cinema, me = w.player, mom = w.actor('mom'), nm = app.state.player.name, feel = app.feel;
    const sfx = (n, o) => app.audio.sfx && app.audio.sfx(n, o);
    if (mom && me) { mom.face(me); me.face(mom); me.play('explain', { restart: true }); }
    await app.say(nm, 'Mom! Egg tarts from Lucky Moon. Still warm!');
    if (mom) { mom.play('surprised', { restart: true }); if (mom.anim.face) mom.anim.face('surprised', 2); if (feel) feel.emote(mom, '!', 1.2); }
    if (cin && cin.active && mom) await cin.push(mom, { punch: 4, shake: 0.05 });
    await app.say('Mom', 'From Lucky Moon?! Mrs. Chan sells out of these before the fog even lifts!');
    if (mom) { mom.play('excited', { restart: true }); if (feel) feel.emote(mom, 'heart', 1.8); w.fx.emit('heart', mom.headPos(), { n: 5 }); }
    sfx('sparkle', { vol: 0.6 });
    if (cin && cin.active && mom && me) await cin.two(mom, me, { dist: 3.4, dur: 0.6 });
    await app.say('Mom', 'Mmm… flaky, wobbly, perfect. You\'re a good kid, you know that?', 'Here, a little something for the cable car. Don\'t spend it all on boba.');
    if (mom) mom.play('hug', { restart: true }); if (me) me.play('peace', { restart: true });
    this.complete('tarts');
    await app.wait(900);
    if (mom) mom.play('idle', { fade: 0.4 });
  }
  // the line shown in the corner: the main quest first
  objective() {
    const A = this.s.active, ids = Object.keys(A).sort((a, b) => (QUESTS[b].main ? 1 : 0) - (QUESTS[a].main ? 1 : 0));
    for (const id of ids) { const Q = QUESTS[id], st = Q.steps[A[id]]; if (st) return Q.count ? st.replace(/\(\d+\//, `(${this.s.counts[id] || 0}/`) : st; }
    return null;
  }
  list() {
    const A = this.s.active;
    return [...Object.keys(A).map((id) => ({ id, ...QUESTS[id], step: A[id], active: true })), ...this.s.done.map((id) => ({ id, ...QUESTS[id], active: false }))];
  }
}

// ---------------------------------------------------------------- the tram
export function visit(app, id) { const st = app.state; st.visited = st.visited || []; if (!st.visited.includes(id)) st.visited.push(id); }
export const tramOpen = (app, id) => !!(LOCATIONS[id] && LOCATIONS[id].tram && (app.state.visited || []).includes(id));
// ride the tram to a stop: a short ride sitting inside (the tram interior when it exists),
// a "next stop" sign, the bell — then step off at the destination's stop
export async function rideTram(app, dest) {
  const L = LOCATIONS[dest]; if (!L) return;
  const w = app.world;
  await app.fade(1, 420);
  let ride = false;
  if (w.city) {   // in the walkable city the cable car is a quick ride across the one map
    app.tramSign = { to: L.name, t: 0 }; app.audio.sfx && app.audio.sfx('notification');
    await app.wait(1600); app.tramSign = null;
    await app.travel(dest); return;
  }
  if (LOCATIONS.tram) {
    try {
      await w.load('tram', { life: true });
      const seat = w.spot('seat'), hero = w.addPerson('hero', app.state.look || 'hero', seat, { clip: 'sit' });
      const lead = app.state.party && app.state.party[0];
      if (lead) await w.addMon('partner', lead.species, w.spot('seatMon'), { clip: 'idle', drip: lead.drip || 1, look: lead.look || 0 });
      await w.shot(w.shots.ride || w.loc.view, 0); void hero; ride = true;
    } catch (e) { console.warn('tram scene', e); }
  }
  app.tramSign = { to: L.name, t: 0 };
  await app.fade(0, 500);
  app.audio.sfx && app.audio.sfx('notification');
  await app.wait(ride ? 3600 : 1400);
  app.audio.sfx && app.audio.sfx('notification');
  await app.fade(1, 420);
  app.tramSign = null;
  await app.travel(dest, { at: 'tram', fade: false });
}
export function drawTramSign(app, ui, dt) {
  const S = app.tramSign; if (!S) return;
  S.t += dt;
  const w = Math.max(120, ui.tw('NEXT STOP: ' + S.to.toUpperCase()) + 20), x = (ui.w - w) >> 1, y = 10;
  ui.rect(x, y, w, 18, '#141018'); ui.rect(x + 1, y + 1, w - 2, 16, '#26201a');
  const on = Math.floor(S.t * 3) % 2 === 0;
  ui.text('NEXT STOP: ' + S.to.toUpperCase(), ui.w >> 1, y + 5, on ? '#ffb030' : '#d08a20', { align: 'center' });
}
