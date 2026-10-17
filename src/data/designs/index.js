// Design registry: species/character/prop ids → voxel designs, with
// graceful fallbacks so a missing design never breaks the game.
import * as starters from './starters.js';
import * as roster from './roster.js';
import * as wild from './wild.js';
import * as humans from './humans.js';
import * as props from './props.js';
import { ELEMENTS } from '../elements.js';
import { SPECIES, elemsOf } from '../species.js';

export const CREATURE_DESIGNS = Object.assign({}, wild.DESIGNS || {}, roster.DESIGNS || {}, starters.DESIGNS || {});
export const LORE = Object.assign({}, wild.LORE || {}, roster.LORE || {}, starters.LORE || {});
export const PROPS = props;
export const HUMANS = humans;

const fallbackCache = new Map();
function fallbackCreature(id) {
  if (fallbackCache.has(id)) return fallbackCache.get(id);
  const sp = SPECIES[id];
  const el = sp ? ELEMENTS[elemsOf(sp)[0]] : ELEMENTS.geo;
  const s = (sp && sp.radius) || 0.45;
  const d = {
    id: 'fb_' + id, vs: Math.max(0.025, s * 0.07), arch: 'blob',
    pal: { b: el.color, l: el.accent },
    parts: [{ n: 'body', p: [0, s, 0], s: [['ell', [0, s * 1.05, 0], [s, s * 1.0, s], 'b', { belly: 'l' }], ['ell', [0, s * 1.75, 0.1 * s], [s * 0.35, s * 0.3, s * 0.35], 'l', { glow: 1 }]] }],
    eyes: { part: 'body', at: [s * 0.35, s * 1.25, s * 0.85], dir: [0.3, 0.1, 1], style: 'anime', iris: '#222' },
    mouth: { part: 'body', at: [0, s * 0.9, s * 0.98], style: 'cat' },
  };
  fallbackCache.set(id, d);
  return d;
}
export function creatureDesign(speciesId) { return CREATURE_DESIGNS[speciesId] || fallbackCreature(speciesId); }
export function hasCreatureDesign(id) { return !!CREATURE_DESIGNS[id]; }

const humanCache = new Map();
// look: a named character id (string) or a look object
export function humanDesignFor(look) {
  if (typeof look === 'string') {
    if (humanCache.has(look)) return humanCache.get(look);
    const L = humans.CHARACTERS && humans.CHARACTERS[look];
    const d = humans.humanDesign ? humans.humanDesign(L || {}) : null;
    if (d) d.id = d.id || 'char:' + look;
    humanCache.set(look, d);
    return d;
  }
  const key = 'look:' + JSON.stringify(look);
  if (humanCache.has(key)) return humanCache.get(key);
  const d = humans.humanDesign(look);
  d.id = key;
  humanCache.set(key, d);
  return d;
}
export function characterLore(id) { return (humans.CHAR_LORE && humans.CHAR_LORE[id]) || { name: id, voice: { pitch: 1 } }; }
