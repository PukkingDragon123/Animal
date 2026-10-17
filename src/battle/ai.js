// Battle AI. Each AI-controlled unit gets a small utility brain that reacts
// to threats every tick (dodge telegraphs / projectiles, parry melee) and
// makes tactical decisions on a think interval (skills, kiting, healing,
// grabs, switching, ultimates). Deterministic: all randomness from st.rng.
import { SKILLS } from '../data/skills.js';
import { effectiveness } from '../data/elements.js';
import { command, trainerCommand, enemiesOf, alliesOf, unitById, alive, canAct } from './sim.js';

export const PROFILES = {
  tutorial: { aggr: 0.4, skill: 0.25, dodge: 0, parry: 0, think: 0.55, heavy: 0.35 },
  easy: { aggr: 0.55, skill: 0.35, dodge: 0.12, parry: 0.04, think: 0.42, heavy: 0.2 },
  normal: { aggr: 0.75, skill: 0.55, dodge: 0.3, parry: 0.12, think: 0.32, heavy: 0.25 },
  hard: { aggr: 0.85, skill: 0.75, dodge: 0.5, parry: 0.25, think: 0.24, heavy: 0.3, switchy: 0.5 },
  boss: { aggr: 0.9, skill: 0.8, dodge: 0.35, parry: 0.2, think: 0.26, heavy: 0.35 },
  ally: { aggr: 0.7, skill: 0.6, dodge: 0.4, parry: 0.15, think: 0.3, support: true, heavy: 0.2 },
  wild: { aggr: 0.6, skill: 0.45, dodge: 0.2, parry: 0.05, think: 0.36, heavy: 0.25, flee: true },
  beast: { aggr: 1, skill: 0.6, dodge: 0, parry: 0, think: 0.3, heavy: 0.5 },
  punk: { aggr: 0.9, skill: 0.55, dodge: 0.25, parry: 0.1, think: 0.28, grab: 0.3, heavy: 0.3 },
};

const len = (x, z) => Math.hypot(x, z);

export function think(st, u, dt, T) {
  const prof = PROFILES[(T && T.ai) || (u.auto ? 'ally' : 'normal')] || PROFILES.normal;
  const b = u.brain || (u.brain = { t: st.rng.next() * prof.think, seen: new Set(), paused: false, kiteDir: st.rng.chance(0.5) ? 1 : -1 });
  if (b.paused || st.qte) return;
  if (!alive(u)) return;
  react(st, u, prof, b);
  b.t -= dt;
  if (b.t > 0) return;
  b.t = prof.think * (0.75 + st.rng.next() * 0.5);
  decide(st, u, prof, b, T);
}

// ---------------------------------------------------------------- threats
function react(st, u, prof, b) {
  if (prof.dodge <= 0 && prof.parry <= 0) return;
  if (u.dodgeCd > 0 && u.parryCd > 0) return;
  // telegraphed attacks covering us
  for (const tl of st.tele) {
    if (tl.side === u.side || b.seen.has(tl.id)) continue;
    const left = tl.dur - tl.t;
    if (left > 0.55) continue;
    b.seen.add(tl.id);
    if (!inTele(tl, u)) continue;
    const owner = unitById(st, tl.owner);
    const roll = st.rng.next();
    if (roll < prof.dodge) { const [dx, dz] = escapeDir(tl, u); command(st, u.id, { type: 'dodge', dx, dz }); return; }
    if (roll < prof.dodge + prof.parry && owner && len(owner.x - u.x, owner.z - u.z) < 3.5) { command(st, u.id, { type: 'parry' }); return; }
  }
  // incoming projectiles
  for (const p of st.proj) {
    if (p.side === u.side || b.seen.has(p.id)) continue;
    const rx = u.x - p.x, rz = u.z - p.z;
    const along = rx * p.dx + rz * p.dz;
    if (along < 0 || along > p.speed * 0.45) continue;
    const perp = Math.abs(rx * p.dz - rz * p.dx);
    if (perp > u.r + p.r + 0.2) continue;
    b.seen.add(p.id);
    if (st.rng.next() < prof.dodge * 0.8) { command(st, u.id, { type: 'dodge', dx: -p.dz * b.kiteDir, dz: p.dx * b.kiteDir }); return; }
    if (st.rng.next() < prof.parry * 0.6) { command(st, u.id, { type: 'parry' }); return; }
  }
  // enemy basic windups aimed at us (melee)
  for (const o of enemiesOf(st, u)) {
    const a = o.act;
    if (!a || a.phase !== 'windup' || (a.kind !== 'basic' && a.kind !== 'combo' && a.kind !== 'grab')) continue;
    const key = o.id + ':' + Math.floor(a.t === 0 ? st.t * 10 : (st.t - a.t) * 10);
    if (b.seen.has(key)) continue;
    b.seen.add(key);
    if (len(o.x - u.x, o.z - u.z) > o.r + u.r + 2.2) continue;
    if (st.rng.next() < prof.parry * (a.kind === 'grab' ? 0.6 : 0.4)) { command(st, u.id, { type: 'parry' }); return; }
  }
  if (b.seen.size > 300) b.seen.clear();
}
function inTele(tl, u) {
  if (tl.shape === 'circle') return len(u.x - tl.x, u.z - tl.z) < tl.r + u.r;
  const rx = u.x - tl.x, rz = u.z - tl.z;
  const along = rx * tl.dx + rz * tl.dz, perp = Math.abs(rx * tl.dz - rz * tl.dx);
  if (tl.shape === 'line') return along > -u.r && along < tl.len + u.r && perp < tl.width / 2 + u.r;
  if (tl.shape === 'cone') { const d = len(rx, rz); if (d > tl.len + u.r) return false; const ang = Math.acos(Math.max(-1, Math.min(1, along / (d || 1)))); return ang < (tl.arc * Math.PI / 360) + 0.2; }
  return false;
}
function escapeDir(tl, u) {
  if (tl.shape === 'circle') { const dx = u.x - tl.x, dz = u.z - tl.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; }
  const side = (u.x - tl.x) * tl.dz - (u.z - tl.z) * tl.dx > 0 ? 1 : -1;
  return [tl.dz * side, -tl.dx * side];
}

// ---------------------------------------------------------------- decisions
function decide(st, u, prof, b, T) {
  if (!canAct(u) || u.act || u.grab) return;
  const foes = enemiesOf(st, u);
  if (!foes.length) return;
  // pick target: player-controlled first for aggressive AI, else nearest / weakest
  let tgt = null, best = -1e9;
  for (const o of foes) {
    const d = len(o.x - u.x, o.z - u.z);
    let s = -d - (o.hp / o.maxHp) * 3;
    const ot = st.trainers.find((t) => t.id === o.trainer);
    if (ot && ot.isPlayer) s += prof.aggr * 2;
    if (o.id === u.target) s += 1.5;
    s += effectiveness(u.elem, o.elems) * 1.5;
    if (s > best) { best = s; tgt = o; }
  }
  const d = len(tgt.x - u.x, tgt.z - u.z) - tgt.r - u.r;
  const hpF = u.hp / u.maxHp;

  // flee (skittish wild Elemon at low HP)
  if (prof.flee && hpF < 0.25 && st.rng.chance(0.35)) {
    const dx = u.x - tgt.x, dz = u.z - tgt.z, l = Math.hypot(dx, dz) || 1;
    command(st, u.id, { type: 'move', x: u.x + (dx / l) * 4, z: u.z + (dz / l) * 4 });
    return;
  }
  // switching (trainer AI)
  if (T && T.ai && prof.switchy && hpF < 0.3 && T.switchCd <= 0 && st.rng.chance(prof.switchy * 0.4)) {
    const bench = T.team.map((id) => unitById(st, id)).filter((x) => x && !x.onField && x.hp > x.maxHp * 0.5 && x.state !== 'faint');
    if (bench.length) { trainerCommand(st, T.id, { type: 'switch', to: bench[0].id }); return; }
  }
  // ultimate
  if (u.ultSkill && u.ult >= 100 && d < 6 && st.rng.chance(0.6)) { command(st, u.id, { type: 'ult', id: tgt.id }); return; }
  // support heal
  if (prof.support || u.elems.includes('bio')) {
    const heals = u.skills.filter((id) => SKILLS[id] && SKILLS[id].eff.some((e) => e.t === 'heal') && ready(u, id));
    if (heals.length) {
      const hurt = alliesOf(st, u).filter((a) => a.hp < a.maxHp * 0.5).sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
      if (hurt && st.rng.chance(0.75)) { command(st, u.id, { type: 'skill', id: heals[0], idTarget: hurt.id, x: hurt.x, z: hurt.z }); return; }
    }
  }
  // skills
  if (st.rng.chance(prof.skill)) {
    const opts = [];
    for (const id of u.skills) {
      const sk = SKILLS[id];
      if (!sk || !ready(u, id)) continue;
      const sc = scoreSkill(st, u, sk, tgt, d, foes, prof);
      if (sc > 0) opts.push({ id, sc: sc * (0.7 + st.rng.next() * 0.6) });
    }
    opts.sort((a, c) => c.sc - a.sc);
    if (opts.length) {
      const sk = SKILLS[opts[0].id];
      const c = { type: 'skill', id: sk.id, x: tgt.x, z: tgt.z };
      if (sk.aim === 'target') c.id2 = tgt.id;
      // lead moving targets a little
      if (sk.aim === 'dir' && tgt.moving) { c.x += Math.sin(tgt.face) * 0.6; c.z += Math.cos(tgt.face) * 0.6; }
      if (sk.charge && st.rng.chance(0.5)) c.hold = true;
      command(st, u.id, Object.assign(c, { id: sk.id }));
      return;
    }
  }
  // grab (punks / ferro)
  if ((prof.grab || 0) > 0 && d < 1.2 && u.grabCd <= 0 && st.rng.chance(prof.grab)) { command(st, u.id, { type: 'grab' }); return; }
  // ranged kiting
  if (u.basic.type === 'ranged' && d < 2.0 && st.rng.chance(0.5)) {
    const dx = u.x - tgt.x, dz = u.z - tgt.z, l = Math.hypot(dx, dz) || 1;
    const px = -dz / l * b.kiteDir, pz = dx / l * b.kiteDir;
    command(st, u.id, { type: 'move', x: u.x + (dx / l) * 2.2 + px * 1.5, z: u.z + (dz / l) * 2.2 + pz * 1.5 });
    if (st.rng.chance(0.2)) b.kiteDir *= -1;
    return;
  }
  // circle-strafe occasionally (feels alive) else engage
  if (st.rng.chance(1 - prof.aggr) * 0.6 && d < 4) {
    const dx = tgt.x - u.x, dz = tgt.z - u.z, l = Math.hypot(dx, dz) || 1;
    command(st, u.id, { type: 'move', x: u.x - dz / l * 1.8 * b.kiteDir, z: u.z + dx / l * 1.8 * b.kiteDir });
    return;
  }
  if (u.target !== tgt.id || !u.cmd) command(st, u.id, { type: 'target', id: tgt.id });
}

function ready(u, id) {
  const sk = SKILLS[id];
  return sk && (u.cds[id] || 0) <= 0 && u.energy >= Math.round(sk.cost * (u.mods.costMul || 1));
}

function scoreSkill(st, u, sk, tgt, d, foes, prof) {
  let s = 1;
  const range = sk.range || 6;
  const eff = effectiveness(sk.elem, tgt.elems);
  s *= eff;
  const tags = sk.tags || [];
  const e0 = sk.eff[0] || {};
  if (sk.aim === 'self') {
    if (e0.t === 'buff') { if (u.buffs.some((b) => b.s === e0.s)) return 0; s *= e0.s === 'shield' ? (u.hp < u.maxHp * 0.6 ? 2 : 0.4) : 0.9; }
    else if (e0.t === 'aoe' || e0.t === 'zone') { const near = foes.filter((o) => Math.hypot(o.x - u.x, o.z - u.z) < (e0.r || 2.5) + 0.5).length; if (!near) return 0; s *= 1 + near * 0.6; }
    else if (e0.t === 'heal') s *= u.hp < u.maxHp * 0.6 ? 1.8 : 0;
    else if (e0.t === 'summon') s *= d < 5 ? 1 : 0.3;
    else if (e0.t === 'mark') s *= foes.length > 0 ? 0.8 : 0;
  } else if (sk.aim === 'ally') {
    return 0; // handled by support logic
  } else {
    if (d > range + 0.5) return tags.includes('dash') && d < range + 3 ? 0.8 : 0;
    if (e0.t === 'melee' && d > (e0.reach || 1.6) + (e0.lunge || 0)) return 0;
    if (e0.t === 'cone' && d > (e0.range || 4)) return 0;
    if (tags.includes('trap')) s *= d > 2.5 ? 1.1 : 0.4;
    if (tags.includes('wall')) s *= tgt.basic.type === 'ranged' || u.hp < u.maxHp * 0.5 ? 1.2 : 0.3;
    if (e0.t === 'zone') s *= 0.9;
  }
  if (sk.telegraph) s *= 1 + prof.heavy;
  return s;
}
