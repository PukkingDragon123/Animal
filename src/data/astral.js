// Astral skill tree: each Elemon has a constellation of star nodes, built
// from its element + species. Nodes cost Astral Points (1 per level) and
// require a lit neighbour, a level, and stat thresholds — so how you spend
// stat points shapes which abilities, passives and ultimates you can reach.
import { SPECIES, elemsOf } from './species.js';
import { SKILLS } from './skills.js';

const ELEMENT_POOL = {};
for (const s of Object.values(SKILLS)) { if (!ELEMENT_POOL[s.elem]) ELEMENT_POOL[s.elem] = []; ELEMENT_POOL[s.elem].push(s.id); }
const STAT_NODE = { dmg: 'Might', elm: 'Attunement', def: 'Bulwark', spd: 'Swiftness', hp: 'Vitality' };
const BRANCHES = [
  { key: 'power', name: 'Power', stats: ['dmg', 'elm'], angle: -Math.PI / 2 - 0.9 },
  { key: 'guard', name: 'Guard', stats: ['def', 'hp'], angle: -Math.PI / 2 + 0.9 },
  { key: 'flow', name: 'Flow', stats: ['spd', 'elm'], angle: Math.PI / 2 },
];
const cache = new Map();

export function astralTree(speciesId) {
  if (cache.has(speciesId)) return cache.get(speciesId);
  const sp = SPECIES[speciesId];
  const elem = elemsOf(sp)[0];
  const nodes = [], links = [];
  const add = (n) => { nodes.push(n); return n; };
  add({ id: 'core', kind: 'core', name: 'Soul Core', x: 0, y: 0, cost: 0, req: {} });
  const learnIds = new Set([...sp.start, ...sp.learn.map((l) => l[1])]);
  const pool = (ELEMENT_POOL[elem] || []).filter((id) => SKILLS[id].kind === 'active' && !learnIds.has(id));
  const passives = [...(sp.passives || [])];
  let pi = 0, ki = 0;
  BRANCHES.forEach((br, bi) => {
    let prev = 'core';
    for (let depth = 1; depth <= 5; depth++) {
      const r = depth * 1.0;
      const wob = depth % 2 ? 0.16 : -0.16;
      const a = br.angle + wob;
      const id = `${br.key}${depth}`;
      let node;
      const stat = br.stats[(depth + bi) % br.stats.length];
      const need = Math.round(sp.base[stat] * 0.6 + depth * 2.2);
      if (depth === 2 || depth === 4) {
        const pid = passives[pi++ % Math.max(1, passives.length)];
        if (pid && SKILLS[pid]) node = { id, kind: 'passive', ref: pid, name: SKILLS[pid].name, cost: depth === 2 ? 2 : 3, req: { level: 6 + depth * 3, stats: { [stat]: need } } };
      }
      if (!node && depth === 3 && pool[ki]) { const sk = pool[ki++]; node = { id, kind: 'skill', ref: sk, name: SKILLS[sk].name, cost: 2, req: { level: 9, stats: { [stat]: need } } }; }
      if (!node && depth === 5 && bi === 0 && sp.ult) node = { id, kind: 'ult', ref: sp.ult, name: SKILLS[sp.ult].name, cost: 4, req: { level: 15, stats: { elm: Math.round(sp.base.elm * 0.6 + 12) } } };
      if (!node && depth === 5 && pool[ki]) { const sk = pool[ki++]; node = { id, kind: 'skill', ref: sk, name: SKILLS[sk].name, cost: 3, req: { level: 18, stats: { [stat]: need } } }; }
      if (!node) node = { id, kind: 'stat', stat, amount: 2, name: `${STAT_NODE[stat]} +2`, cost: 1, req: { level: Math.max(1, depth * 2), stats: depth > 2 ? { [stat]: need - 3 } : {} } };
      node.x = Math.cos(a) * r; node.y = Math.sin(a) * r; node.branch = br.key;
      add(node); links.push([prev, id]); prev = id;
      // side stars
      if (depth === 2 || depth === 4) {
        const sid = `${br.key}${depth}s`;
        const st2 = br.stats[(depth + 1) % br.stats.length];
        const side = { id: sid, kind: 'stat', stat: st2, amount: 3, name: `${STAT_NODE[st2]} +3`, cost: 1, req: { level: depth * 3 }, x: Math.cos(br.angle + 0.55) * (r + 0.35), y: Math.sin(br.angle + 0.55) * (r + 0.35), branch: br.key };
        add(side); links.push([id, sid]);
      }
    }
  });
  const t = { nodes, links, elem };
  cache.set(speciesId, t);
  return t;
}

// Can a node be unlocked now?
export function nodeState(mon, node, stats) {
  if (mon.astral.includes(node.id) || node.kind === 'core') return 'lit';
  const t = astralTree(mon.species);
  const neighbourLit = t.links.some(([a, b]) => (a === node.id && (mon.astral.includes(b) || b === 'core')) || (b === node.id && (mon.astral.includes(a) || a === 'core')));
  if (!neighbourLit) return 'hidden';
  if (node.req.level && mon.level < node.req.level) return 'locked';
  for (const [k, v] of Object.entries(node.req.stats || {})) if ((stats[k] || 0) < v) return 'locked';
  if (mon.ap < node.cost) return 'poor';
  return 'ready';
}

export function unlockNode(mon, nodeId, stats, learnFn) {
  const t = astralTree(mon.species);
  const node = t.nodes.find((n) => n.id === nodeId);
  if (!node || nodeState(mon, node, stats) !== 'ready') return false;
  mon.ap -= node.cost;
  mon.astral.push(node.id);
  if (node.kind === 'stat') { mon.astralStats = mon.astralStats || {}; mon.astralStats[node.stat] = (mon.astralStats[node.stat] || 0) + node.amount; }
  else if (node.ref && learnFn) learnFn(mon, node.ref);
  return true;
}
