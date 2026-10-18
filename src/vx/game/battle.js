// Battle3D (first pass): the two partners face off right where you are, in the
// location's arena spot, filmed from the side. Turn by turn you pick ATTACK or
// SPECIAL; each blow plays the real animation clips (wind-up, impact, hurt,
// faint) with particle effects and HP bars. The full real-time battle (battle/
// sim.js: skills, dodges, bonding, switching) replaces this presentation later.
import { T } from '../../px/game/ui.js';
import { SPECIES } from '../../data/species.js';
import { gainExp, addFriendship } from '../../game/elemon.js';

const IMPACT = { attack: 0.42, special: 0.95 };
export class Battle3D {
  constructor(app) { this.app = app; this.active = false; this.callouts = []; }
  async start(spec) {
    const app = this.app, w = app.world, L = w.loc, A = L.arena || { at: [w.cam.target.x, w.cam.target.z], axis: 'x' };
    this.spec = spec; this.prevCam = { target: w.cam.target.toArray(), dist: w.cam.dist, yaw: w.cam.yaw, pitch: w.cam.pitch };
    const lead = app.state.party.find((m) => (m.hp ?? 1) > 0) || app.state.party[0];
    const [fsp, flv] = spec.foe.team[0];
    const [ax, az] = A.at, x = A.axis !== 'z';
    const pa = x ? [ax - 2.2, az] : [ax, az + 2.2], pb = x ? [ax + 2.2, az] : [ax, az - 2.2];
    this.hidden = [];
    for (const a of w.actors.values()) { const p = a.g.position; if (Math.hypot(p.x - ax, p.z - az) < 3.6) { a.g.visible = false; this.hidden.push(a); } }
    const me = await w.addMon('b-me', lead.species, [pa[0], pa[1], x ? Math.PI / 2 : Math.PI]);
    const foe = await w.addMon('b-foe', fsp, [pb[0], pb[1], x ? -Math.PI / 2 : 0]);
    this.sides = [{ a: me, mon: lead, name: lead.nick || SPECIES[lead.species].name, lv: lead.level, hp: lead.hp ?? 1, shown: lead.hp ?? 1 }, { a: foe, name: SPECIES[fsp].name, lv: flv, hp: 1, shown: 1, trainer: spec.foe.name }];
    const gy = w.ground(ax, az);
    const C = A.cam || {}; w.setCam({ target: [ax, gy + 0.55, az], dist: C.dist || 7.6, yaw: C.yaw ?? (x ? 0 : 90), pitch: C.pitch ?? 16 });
    this.active = true; this.choice = null; this.over = false;
    await app.fade(0, 300);
    this.call(spec.title || 'BATTLE!', spec.subtitle || '', T.amber, 1.6);
    me.play('cry'); await app.wait(400); foe.play('cry');
    await app.wait(1700);
    let turn = 0;
    while (!this.over) {
      const atk = this.sides[turn % 2], def = this.sides[(turn + 1) % 2];
      let move = 'attack';
      if (turn % 2 === 0) move = await new Promise((r) => { this.choice = r; });
      else { await app.wait(500); move = Math.random() < 0.35 ? 'special' : 'attack'; }
      this.choice = null;
      await this.blow(atk, def, move);
      if (def.hp <= 0) this.over = true;
      turn++;
    }
    // the end
    const winner = this.sides[0].hp > 0 ? 0 : 1, W_ = this.sides[winner], Lz = this.sides[1 - winner];
    Lz.a.play('faint'); await app.wait(1600); W_.a.play('win');
    this.call(winner === 0 ? 'YOU WIN!' : 'YOU LOST…', winner === 0 ? `${Lz.name} fainted` : '', winner === 0 ? T.amber : T.red, 2.2);
    if (winner === 0) { const ups = gainExp(lead, 24 + flv * 6); addFriendship(lead, 6); if (ups && ups.length) app.toast(`${this.sides[0].name} grew to Lv${lead.level}!`, { icon: 'star' }); }
    lead.hp = Math.max(0.05, this.sides[0].hp);
    await app.wait(2400);
    await app.fade(1, 400);
    w.remove('b-me'); w.remove('b-foe'); for (const a of this.hidden) a.g.visible = true;
    w.setCam(this.prevCam);
    this.active = false; app.save();
    return { winner };
  }
  async blow(atk, def, move) {
    const app = this.app, w = app.world, A = atk.a, D = def.a;
    A.play(move, { restart: true });
    await app.wait(IMPACT[move] * 1000);
    const crit = Math.random() < 0.12, dmg = (move === 'special' ? 0.3 + Math.random() * 0.14 : 0.18 + Math.random() * 0.12) * (crit ? 1.5 : 1) * (def === this.sides[0] ? 0.85 : 1);
    D.play('hurt', { restart: true });
    const p = D.g.position; w.burst('spark', [p.x, p.y + 0.4, p.z], { n: 1 }); w.burst('star', [p.x, p.y + 0.5, p.z], { n: crit ? 6 : 3 });
    def.hp = Math.max(0, def.hp - dmg);
    if (crit) this.call('CRITICAL!', '', T.red, 0.9);
    app.audio.sfx && app.audio.sfx(move === 'special' ? 'boom' : 'hit');
    await app.wait(move === 'special' ? 1100 : 750);
  }
  call(text, sub, color, dur) { this.callouts.push({ text, sub, color, dur, t: 0 }); }
  update(dt) { for (const s of this.sides || []) s.shown += (s.hp - s.shown) * Math.min(1, dt * 4); }
  drawUI(ui, dt) {
    if (!this.sides) return;
    const W = ui.w;
    // HP panels
    this.sides.forEach((s, i) => {
      const pw = 120, x = i === 0 ? 6 : W - pw - 6, y = 6;
      ui.panel(x, y, pw, 26, {});
      ui.text(s.name, x + 6, y + 4, T.text); ui.text(`Lv${s.lv}`, x + pw - 6, y + 4, T.amber, { align: 'right', mini: true });
      ui.bar(x + 6, y + 16, pw - 12, 5, s.shown, { color: s.shown > 0.5 ? T.green : s.shown > 0.2 ? T.amber : T.red });
      if (s.trainer) ui.text(s.trainer, x + pw - 6, y + 28, T.dim, { align: 'right', mini: true });
    });
    // commands
    if (this.choice) {
      const bw = 92, by = ui.h - 26, cx = W >> 1;
      if (ui.button(cx - bw - 4, by, bw, 20, 'ATTACK', { icon: 'fist', color: T.amber, hotkey: '1' })) this.choice('attack');
      if (ui.button(cx + 4, by, bw, 20, 'SPECIAL', { icon: 'star', color: T.cyan, hotkey: '2' })) this.choice('special');
    }
    // callouts
    for (const c of this.callouts) { c.t += dt; const a = Math.min(1, c.t * 5, (c.dur - c.t) * 4); if (a <= 0) continue; ui.text(c.text, W >> 1, Math.round(ui.h * 0.32) - Math.round((1 - a) * 6), c.color, { align: 'center', scale: 2, outline: '#0c0814' }); if (c.sub) ui.text(c.sub, W >> 1, Math.round(ui.h * 0.32) + 18, T.text, { align: 'center', outline: '#0c0814' }); }
    this.callouts = this.callouts.filter((c) => c.t < c.dur);
  }
}
