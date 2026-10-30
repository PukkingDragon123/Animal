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
  pigeons: { title: 'Pigeon Patrol', where: 'alamo', steps: ['Count the pigeons strutting around Alamo Square (0/5)'], count: 5, reward: { money: 200 } },
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
    this.app.save();
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
