// Battle HUD (DOM). Reads the sim each frame; forwards touch intent to the
// battle scene through callbacks.
import { h, clear } from './dom.js';
import { SKILLS } from '../data/skills.js';
import { ELEMENTS } from '../data/elements.js';
import { SPECIES } from '../data/species.js';
import { cooldownFrac, skillCost, unitById, beatPhase } from '../battle/sim.js';

const STATUS_IC = { burn: '🔥', poison: '☠️', sleep: '💤', stun: '💫', root: '🌿', slow: '🐌', frozen: '🧊', confuse: '😵', blind: '🙈', defdown: '🛡️⬇', curse: '👁️', weaken: '⬇', mark: '🎯', regen: '💚', radiation: '☢️' };
const ROLE_IC = { Dragon: '🐉', Aquatic: '🐙', Beast: '🐾', Golem: '🗿', Flyer: '🦇', Bug: '🪲', Rock: '🪨', Plant: '🍋', Yokai: '👺', Spirit: '👻', Machine: '🤖', Legend: '🌟', Rift: '☢️', 'Wild Beast': '🐗' };
export const elemColor = (e) => (ELEMENTS[e] ? ELEMENTS[e].color : '#888');
export function monIcon(speciesId) { const sp = SPECIES[speciesId]; return (sp && ROLE_IC[sp.family]) || '✦'; }
const SKILL_IC = { projectile: '➶', precision: '🎯', aoe: '✸', cone: '◭', melee: '✊', dash: '💨', heal: '✚', buff: '▲', wall: '🧱', trap: '🫧', zone: '◎', sound: '♫', summon: '👥', guard: '🛡️', sleep: '💤', poison: '☠️', grab: '🪢', line: '┃', charge: '⚡' };
export function skillIcon(sk) { if (!sk) return '?'; for (const t of sk.tags || []) if (SKILL_IC[t]) return SKILL_IC[t]; const e0 = sk.eff && sk.eff[0]; return (e0 && SKILL_IC[{ proj: 'projectile', melee: 'melee', aoe: 'aoe', cone: 'cone', line: 'line', zone: 'zone', dash: 'dash', heal: 'heal', buff: 'buff', wall: 'wall', pull: 'grab', summon: 'summon', status: 'sleep', mark: 'precision' }[e0.t]]) || '✦'; }

export class BattleHud {
  constructor(ui, cb) {
    this.ui = ui; this.cb = cb;
    this.root = ui.L.bhud;
    this.cards = new Map();
    this.aim = null;
  }
  build(st, me) {
    const r = clear(this.root);
    this.st = st; this.meId = me;
    this.myTeam = h('div.bteam.me'); this.foeTeam = h('div.bteam.foe');
    this.beatEl = h('div.beat'); this.timerEl = h('div.timer');
    this.meters = h('div.meters', {}, this.beatEl, this.timerEl);
    // action cluster
    const mk = (cls, ic, label) => h('button.abtn.' + cls, {}, h('span', {}, h('span.ic', {}, ic), h('small', {}, label)), h('i.cd'));
    this.bAttack = mk('attack', '✊', 'Attack'); this.bDodge = mk('dodge', '💨', 'Dodge'); this.bParry = mk('parry', '🛡️', 'Parry'); this.bGrab = mk('grab', '🪢', 'Grab'); this.bCharge = mk('charge', '⚡', 'Chg');
    const acts = h('div.actions', {}, this.bAttack, this.bDodge, this.bParry, this.bGrab, this.bCharge);
    this.press(this.bAttack, () => this.cb.attack());
    this.press(this.bDodge, () => this.cb.dodge());
    this.press(this.bParry, () => this.cb.parry());
    this.press(this.bGrab, () => this.cb.grab());
    this.bCharge.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.bCharge.classList.add('down'); this.cb.charge(true); });
    const relC = (e) => { if (this.bCharge.classList.contains('down')) { this.bCharge.classList.remove('down'); this.cb.charge(false); } };
    this.bCharge.addEventListener('pointerup', relC); this.bCharge.addEventListener('pointerleave', relC);
    // skills
    this.skillsEl = h('div.skills');
    this.sbtns = [];
    for (let i = 0; i < 4; i++) {
      const b = h('button.sbtn', {}, h('span.ic'), h('span.nm'), h('span.cost'), h('i.cd'), h('span.cdn'));
      this.skillsEl.append(b); this.sbtns.push(b);
      this.bindSkill(b, i);
    }
    // supers
    const sup = (cls, ic, label) => h('button.big3.' + cls, {}, h('div.fill'), h('span', {}, h('span.ic', {}, ic), label));
    this.bUlt = sup('ult', '🔥', 'ULTIMATE'); this.bTeam = sup('team', '🤝', 'TEAM'); this.bSpec = sup('spec', '💠', 'SPECTRAL');
    this.bItem = h('button.big3.item', {}, h('span', {}, h('span.ic', {}, '🍙'), 'ITEM'));
    this.bCap = h('button.big3.cap', {}, h('span', {}, h('span.ic', {}, '🔑'), 'CATCH'));
    this.bench = h('div.bench');
    this.supers = h('div.supers', {}, h('div.col', {}, this.bench, h('div.row', {}, this.bUlt, this.bTeam, this.bSpec)), h('div.col', {}, this.bItem, this.bCap));
    this.press(this.bUlt, () => this.cb.ult()); this.press(this.bTeam, () => this.cb.team()); this.press(this.bSpec, () => this.cb.spectral());
    this.press(this.bItem, () => this.cb.item()); this.press(this.bCap, () => this.cb.capture());
    this.aimHint = h('div', { id: 'aimhint' }, 'Drag to aim · release to cast');
    r.append(this.myTeam, this.foeTeam, this.meters, this.skillsEl, acts, this.supers, this.aimHint);
    r.classList.add('show');
    this.buildCards(st);
  }
  press(el, fn) {
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); el.classList.add('down'); fn(); });
    el.addEventListener('pointerup', () => el.classList.remove('down'));
    el.addEventListener('pointerleave', () => el.classList.remove('down'));
  }
  bindSkill(b, i) {
    let start = null;
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); e.preventDefault();
      if (b.classList.contains('locked')) return;
      b.setPointerCapture(e.pointerId);
      const rc = b.getBoundingClientRect();
      start = { x: rc.left + rc.width / 2, y: rc.top + rc.height / 2, id: e.pointerId, moved: false };
      b.classList.add('aiming');
      this.aimHint.classList.add('show');
      this.cb.aimStart(i);
    });
    b.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > 14) start.moved = true;
      this.cb.aimMove(i, dx, dy, start.moved);
    });
    const end = (e, cancel) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      b.classList.remove('aiming'); this.aimHint.classList.remove('show');
      this.cb.aimEnd(i, dx, dy, start.moved, cancel);
      start = null;
    };
    b.addEventListener('pointerup', (e) => end(e, false));
    b.addEventListener('pointercancel', (e) => end(e, true));
  }
  buildCards(st) {
    clear(this.myTeam); clear(this.foeTeam); this.cards.clear();
    const T = st.trainers;
    for (const tr of T) {
      for (const uid of tr.team) {
        const u = unitById(st, uid);
        const col = elemColor(u.elem);
        const hpf = h('i.hpf'), hpg = h('i.hpg'), shd = h('i.shd'), en = h('i');
        const sts = h('span.sts');
        const card = h('div.ucard' + (u.onField ? '.active' : '.small'), {},
          h('div.ic', { style: { background: `radial-gradient(circle at 35% 30%, #fff, ${col})` } }, monIcon(u.species)),
          h('div.info', {}, h('div.nm', {}, u.name, h('span.lv', {}, 'Lv' + u.level), sts),
            h('div.bar', {}, hpg, hpf, shd), tr.isPlayer ? h('div.bar.en', {}, en) : ''));
        this.cards.set(uid, { card, hpf, hpg, shd, en, sts, last: -1 });
        (tr.side === 0 ? this.myTeam : this.foeTeam).append(card);
      }
    }
  }
  update(st, meId, dt) {
    const me = unitById(st, meId);
    this.meId = meId;
    for (const [uid, c] of this.cards) {
      const u = unitById(st, uid);
      if (!u) continue;
      const f = Math.max(0, u.hp / u.maxHp);
      c.hpf.style.width = (f * 100).toFixed(1) + '%';
      c.hpg.style.width = (f * 100).toFixed(1) + '%';
      c.shd.style.width = Math.min(100, (u.shield / u.maxHp) * 100).toFixed(1) + '%';
      if (c.en) c.en.style.width = u.energy.toFixed(0) + '%';
      const on = u.onField && u.state !== 'faint';
      c.card.classList.toggle('active', on); c.card.classList.toggle('small', !on);
      c.card.style.opacity = u.state === 'faint' || u.hp <= 0 ? '0.45' : '';
      const key = u.st.map((s) => s.s).join(',') + (u.aura ? '|' + u.aura.e : '');
      if (key !== c.last) { c.last = key; clear(c.sts); if (u.aura) c.sts.append(h('i.aura', { style: { color: elemColor(u.aura.e), background: elemColor(u.aura.e), width: '9px', height: '9px', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px ' + elemColor(u.aura.e) } })); for (const s of u.st) if (STATUS_IC[s.s]) c.sts.append(STATUS_IC[s.s]); }
    }
    if (!me) return;
    // skills
    for (let i = 0; i < 4; i++) {
      const b = this.sbtns[i], id = me.skills[i], sk = SKILLS[id];
      if (!sk) { b.classList.add('locked'); b.querySelector('.ic').textContent = '🔒'; b.querySelector('.nm').textContent = ''; b.querySelector('.cost').style.display = 'none'; b.style.background = '#2a1c4a'; continue; }
      b.classList.remove('locked');
      if (b.dataset.sk !== id) { b.dataset.sk = id; b.querySelector('.ic').textContent = skillIcon(sk); b.querySelector('.nm').textContent = sk.name; b.style.background = `linear-gradient(160deg, ${elemColor(sk.elem)}, #2a1c4a)`; b.querySelector('.cost').style.display = ''; }
      const cost = skillCost(me, id);
      b.querySelector('.cost').textContent = cost;
      const cf = cooldownFrac(st, me, id);
      b.querySelector('.cd').style.setProperty('--p', (cf * 100).toFixed(0) + '%');
      b.querySelector('.cdn').textContent = cf > 0 ? Math.ceil(me.cds[id]) : '';
      b.classList.toggle('noen', me.energy < cost);
    }
    this.bDodge.querySelector('.cd').style.setProperty('--p', Math.min(100, (me.dodgeCd / 0.9) * 100).toFixed(0) + '%');
    this.bParry.querySelector('.cd').style.setProperty('--p', Math.min(100, (me.parryCd / 0.75) * 100).toFixed(0) + '%');
    this.bGrab.querySelector('.cd').style.setProperty('--p', Math.min(100, (me.grabCd / 2.2) * 100).toFixed(0) + '%');
    this.bCharge.classList.toggle('down', !!me.charge);
    // supers
    const side = st.sides[me.side];
    const T = st.trainers.find((t) => t.id === me.trainer);
    const set = (b, frac, ready, show = true) => { b.style.display = show ? '' : 'none'; b.querySelector('.fill').style.height = (Math.min(1, frac) * 100).toFixed(0) + '%'; b.classList.toggle('ready', ready); };
    set(this.bUlt, me.ult / 100, me.ult >= 100 && !!me.ultSkill, !!me.ultSkill);
    const hasPartner = st.units.some((o) => o.side === me.side && o !== me && o.state !== 'faint' && (o.onField || o.trainer === me.trainer) && o.hp > 0);
    set(this.bTeam, side.meter / 100, side.meter >= 100 && hasPartner, hasPartner);
    set(this.bSpec, me.soul / 100, me.soul >= 100 && me.spectral <= 0, !!me.snap.spectral);
    this.bCap.style.display = st.rules.capture ? '' : 'none';
    this.bItem.style.display = st.rules.items ? '' : 'none';
    this.bItem.style.opacity = T && T.itemCd > 0 ? 0.5 : 1;
    // bench
    const bench = T ? T.team.map((id) => unitById(st, id)).filter((x) => x && !x.onField) : [];
    if (this._benchKey !== bench.map((b) => b.id + (b.hp > 0)).join() + (T && T.switchCd > 0)) {
      this._benchKey = bench.map((b) => b.id + (b.hp > 0)).join() + (T && T.switchCd > 0);
      clear(this.bench);
      for (const b of bench) {
        const col = elemColor(b.elem);
        const btn = h('button.benchbtn' + (T.switchCd > 0 || b.hp <= 0 ? '.cd' : ''), {}, h('span.ic', { style: { background: `radial-gradient(circle at 35% 30%, #fff, ${col})` } }, monIcon(b.species)), h('span', {}, '⇄ ' + b.name), h('div.minibar', {}, h('i', { style: { width: (b.hp / b.maxHp * 100) + '%' } })));
        this.press(btn, () => this.cb.switch(b.id));
        this.bench.append(btn);
      }
    }
    // beat (echo)
    const ph = beatPhase(st);
    const isEcho = me.elems.includes('echo') || me.skills.some((id) => SKILLS[id] && SKILLS[id].beat);
    this.beatEl.style.display = isEcho ? '' : 'none';
    this.beatEl.classList.toggle('on', ph < 0.14 || ph > 0.92);
    this.timerEl.textContent = st.rules.wild ? (st.rules.capture ? 'Wild' : 'Wild beast!') : '';
  }
  skillButton(i) { return this.sbtns[i]; }
  hide() { this.root.classList.remove('show'); clear(this.root); }
}
