// Elements, type effectiveness and elemental reactions.
// The five starter elements form a cycle: Hydro > Pyro > Bio > Geo > Echo > Hydro.
export const ELEMENTS = {
  pyro: { name: 'Pyro', color: '#ff6a2b', accent: '#ffd23f', icon: '🔥', role: 'Raw power', desc: 'Charge attacks for devastating bursts. Dealing Pyro damage builds Heat; at full Heat your next charged move overheats.' },
  hydro: { name: 'Hydro', color: '#2fa8ff', accent: '#8ff0ff', icon: '💧', role: 'Precision', desc: 'Aimed skillshots crit when they strike dead-centre. Ricochets, traps and smoke reward careful positioning.' },
  bio: { name: 'Bio', color: '#5fd35a', accent: '#ffb3d9', icon: '🌱', role: 'Support', desc: 'Heals allies, stacks poison and lulls foes to sleep. Wins long fights.' },
  geo: { name: 'Geo', color: '#d39a5c', accent: '#8a5a3a', icon: '🪨', role: 'Defense', desc: 'Raises walls, armors up and reshapes the arena. The best parries in the game.' },
  echo: { name: 'Echo', color: '#b26bff', accent: '#5ff4ff', icon: '🎵', role: 'Rhythm', desc: 'Hit on the beat for bonus damage. Sonic knockback, confusion and encores.' },
  volto: { name: 'Volto', color: '#ffe23a', accent: '#ffffff', icon: '⚡', role: 'Speed', desc: 'Chain lightning and lightning-fast strikes.' },
  cryo: { name: 'Cryo', color: '#9fefff', accent: '#e6faff', icon: '❄️', role: 'Control', desc: 'Slows and freezes the battlefield.' },
  aero: { name: 'Aero', color: '#a8f5c8', accent: '#ffffff', icon: '🌪️', role: 'Mobility', desc: 'Dashes and gusts; Swirl spreads other elements.' },
  ecto: { name: 'Ecto', color: '#8a5aff', accent: '#ff7af2', icon: '👻', role: 'Trickery', desc: 'Phases through attacks and curses foes.' },
  ferro: { name: 'Ferro', color: '#b8c4d0', accent: '#5a6470', icon: '⛓️', role: 'Iron', desc: 'Heavy armor, magnetism and brutal grabs.' },
  astro: { name: 'Astro', color: '#ffd98a', accent: '#6a8aff', icon: '✨', role: 'Cosmic', desc: 'Legendary star power.' },
  nucleo: { name: 'Nucleo', color: '#8aff3a', accent: '#203a10', icon: '☢️', role: 'Fission', desc: 'Radiation that eats away at everything.' },
  draco: { name: 'Draco', color: '#7a3aff', accent: '#ff3a5a', icon: '🐉', role: 'Dominance', desc: 'Draconic might. Roars that break guards, scales that shrug off status. Rare and proud.' },
};
export const STARTER_ELEMENTS = ['pyro', 'hydro', 'bio', 'geo', 'echo'];

const STRONG = {
  hydro: ['pyro', 'geo'], pyro: ['bio', 'cryo', 'ferro'], bio: ['geo', 'hydro'], geo: ['echo', 'volto', 'pyro'], echo: ['hydro', 'ecto'],
  volto: ['hydro', 'aero', 'ferro'], cryo: ['bio', 'aero', 'draco'], aero: ['bio', 'echo'], ecto: ['ecto', 'echo'], ferro: ['cryo', 'geo'],
  astro: ['ecto', 'nucleo', 'draco'], nucleo: ['bio', 'geo', 'ferro'], draco: ['draco', 'echo', 'aero'],
};
const WEAK = { // attacker → defenders that resist
  hydro: ['bio', 'hydro'], pyro: ['hydro', 'geo', 'pyro'], bio: ['pyro', 'aero', 'ferro'], geo: ['bio', 'aero'], echo: ['geo', 'ferro'],
  volto: ['geo', 'volto'], cryo: ['pyro', 'ferro', 'cryo'], aero: ['volto', 'ferro'], ecto: ['astro'], ferro: ['pyro', 'volto', 'ferro'],
  astro: [], nucleo: ['astro'], draco: ['ferro'],
};
export function effectiveness(atk, def) {
  if (!atk || !def) return 1;
  const defs = Array.isArray(def) ? def : [def];
  let m = 1;
  for (const d of defs) {
    if (STRONG[atk] && STRONG[atk].includes(d)) m *= 1.4;
    else if (WEAK[atk] && WEAK[atk].includes(d)) m *= 0.7;
  }
  return m;
}
export function effLabel(m) { return m >= 1.35 ? 'Super effective!' : m <= 0.72 ? 'Resisted…' : ''; }

// Elemental reactions: an elemental hit on a target carrying a different
// element's aura triggers a reaction (and consumes the aura).
// effect kinds interpreted by the battle sim:
//   burst{r,k,knock,zone?}  mult{k}  status{s,dur}  dot{s,dur,spread?}  bloom{n}
//   chain{r,k}  pull{r}  spread{r}  shield{k}  zone{kind,r,dur}
export const REACTIONS = {
  'hydro+pyro': { id: 'steam', name: 'STEAM EXPLOSION', color: '#ffffff', fx: [{ burst: { r: 2.8, k: 1.7, knock: 5 } }, { zone: { kind: 'steam', r: 2.6, dur: 4 } }], sfx: 'steam_explosion' },
  'bio+pyro': { id: 'wildfire', name: 'WILDFIRE', color: '#ff8a2a', fx: [{ dot: { s: 'burn', dur: 4, spread: 2.4, k: 0.35 } }, { burst: { r: 1.6, k: 0.6, knock: 1 } }], sfx: 'pyro_boom' },
  'geo+pyro': { id: 'magma', name: 'MAGMA', color: '#ff5a1a', fx: [{ zone: { kind: 'lava', r: 1.8, dur: 4 } }, { mult: { k: 1.3 } }], sfx: 'pyro_boom' },
  'echo+pyro': { id: 'sonicboom', name: 'SONIC BOOM', color: '#ffb36b', fx: [{ burst: { r: 2.2, k: 1.4, knock: 7 } }], sfx: 'echo_boom' },
  'pyro+volto': { id: 'overload', name: 'OVERLOAD', color: '#ffb02a', fx: [{ burst: { r: 2.5, k: 1.5, knock: 5 } }], sfx: 'pyro_boom' },
  'cryo+pyro': { id: 'melt', name: 'MELT', color: '#ffd0a0', fx: [{ mult: { k: 2.0 } }], sfx: 'reaction' },
  'aero+pyro': { id: 'firestorm', name: 'FIRESTORM', color: '#ff7a3a', fx: [{ spread: { r: 3, aura: 'pyro' } }, { burst: { r: 2, k: 0.7, knock: 2 } }], sfx: 'aero' },
  'ferro+pyro': { id: 'forge', name: 'FORGE', color: '#ffa060', fx: [{ status: { s: 'defdown', dur: 5, k: 0.3 } }, { mult: { k: 1.2 } }], sfx: 'ferro' },
  'bio+hydro': { id: 'bloom', name: 'BLOOM', color: '#8aff9a', fx: [{ bloom: { n: 3, heal: 0.08 } }], sfx: 'bio_heal' },
  'geo+hydro': { id: 'mudslide', name: 'MUDSLIDE', color: '#a07a50', fx: [{ status: { s: 'slow', dur: 4, k: 0.5 } }, { status: { s: 'defdown', dur: 4, k: 0.2 } }, { zone: { kind: 'mud', r: 2, dur: 4 } }], sfx: 'geo' },
  'echo+hydro': { id: 'tidalring', name: 'TIDAL RING', color: '#7fd8ff', fx: [{ burst: { r: 2.6, k: 1.15, knock: 4 } }], sfx: 'hydro_splash' },
  'hydro+volto': { id: 'electrocharged', name: 'ELECTRO-CHARGED', color: '#c8b0ff', fx: [{ chain: { r: 4.5, k: 0.8 } }, { status: { s: 'stun', dur: 0.4 } }], sfx: 'volto' },
  'cryo+hydro': { id: 'freeze', name: 'FREEZE', color: '#c8f6ff', fx: [{ status: { s: 'frozen', dur: 2.2 } }], sfx: 'cryo' },
  'aero+hydro': { id: 'typhoon', name: 'TYPHOON', color: '#a0f0e0', fx: [{ spread: { r: 3, aura: 'hydro' } }, { burst: { r: 2, k: 0.6, knock: 3 } }], sfx: 'aero' },
  'bio+geo': { id: 'overgrowth', name: 'OVERGROWTH', color: '#7acc4a', fx: [{ status: { s: 'root', dur: 1.8 } }], sfx: 'bio' },
  'bio+echo': { id: 'lullaby', name: 'LULLABY', color: '#ffc8f0', fx: [{ status: { s: 'sleep', dur: 2.6 } }], sfx: 'sleep' },
  'bio+volto': { id: 'quicken', name: 'QUICKEN', color: '#d8ff6a', fx: [{ selfbuff: { s: 'quicken', dur: 3 } }, { mult: { k: 1.2 } }], sfx: 'volto' },
  'bio+cryo': { id: 'frostbite', name: 'FROSTBITE', color: '#b0ffe8', fx: [{ status: { s: 'slow', dur: 3, k: 0.4 } }, { dot: { s: 'poison', dur: 3, k: 0.25 } }], sfx: 'cryo' },
  'aero+bio': { id: 'pollen', name: 'POLLEN STORM', color: '#e8ff8a', fx: [{ spread: { r: 3, aura: 'bio', poison: 1 } }], sfx: 'aero' },
  'echo+geo': { id: 'quake', name: 'QUAKE', color: '#e0b070', fx: [{ burst: { r: 3, k: 1.25, knock: 2, destroy: true } }, { status: { s: 'stun', dur: 1.0, aoe: 3 } }], sfx: 'geo_wall' },
  'geo+volto': { id: 'grounded', name: 'GROUNDED', color: '#ffe08a', fx: [{ selfbuff: { s: 'shield', k: 0.15 } }], sfx: 'geo' },
  'cryo+geo': { id: 'permafrost', name: 'PERMAFROST', color: '#c0e0ff', fx: [{ status: { s: 'slow', dur: 3, k: 0.6 } }], sfx: 'cryo' },
  'aero+geo': { id: 'sandstorm', name: 'SANDSTORM', color: '#e8c890', fx: [{ zone: { kind: 'sand', r: 2.6, dur: 4 } }], sfx: 'aero' },
  'echo+volto': { id: 'feedback', name: 'FEEDBACK', color: '#f0e0ff', fx: [{ status: { s: 'stun', dur: 1.2 } }, { mult: { k: 1.15 } }], sfx: 'echo_boom' },
  'cryo+echo': { id: 'shatter', name: 'SHATTER', color: '#e0faff', fx: [{ mult: { k: 1.8 } }, { status: { s: 'slow', dur: 2, k: 0.3 } }], sfx: 'destroy_glass' },
  'aero+echo': { id: 'resonantgust', name: 'RESONANT GUST', color: '#d0fff0', fx: [{ burst: { r: 2.4, k: 0.8, knock: 8 } }], sfx: 'aero' },
  'echo+ecto': { id: 'haunt', name: 'HAUNT', color: '#c08aff', fx: [{ status: { s: 'confuse', dur: 2.5 } }], sfx: 'ecto' },
  'ferro+volto': { id: 'magnetize', name: 'MAGNETIZE', color: '#b0c8ff', fx: [{ pull: { r: 4.5 } }, { status: { s: 'stun', dur: 0.6, aoe: 2 } }], sfx: 'ferro' },
};
// Ecto/Astro/Nucleo/Draco react with *any* other aura.
export const WILD_REACTIONS = {
  ecto: { id: 'curse', name: 'CURSE', color: '#9a6aff', fx: [{ status: { s: 'curse', dur: 5, k: 0.2 } }], sfx: 'ecto' },
  astro: { id: 'starfall', name: 'STARFALL', color: '#ffe8a0', fx: [{ burst: { r: 3, k: 2.0, knock: 3 } }], sfx: 'astro' },
  nucleo: { id: 'fission', name: 'FISSION', color: '#9aff4a', fx: [{ burst: { r: 2.6, k: 1.8, knock: 4 } }, { dot: { s: 'radiation', dur: 5, k: 0.4 } }], sfx: 'nucleo' },
  draco: { id: 'dragonroar', name: 'DRAGON ROAR', color: '#a07aff', fx: [{ mult: { k: 1.5 } }, { status: { s: 'defdown', dur: 4, k: 0.25 } }], sfx: 'pyro_boom' },
};
export function reactionFor(aura, incoming) {
  if (!aura || !incoming || aura === incoming) return null;
  const key = [aura, incoming].sort().join('+');
  if (REACTIONS[key]) return REACTIONS[key];
  if (WILD_REACTIONS[incoming]) return WILD_REACTIONS[incoming];
  if (WILD_REACTIONS[aura]) return WILD_REACTIONS[aura];
  return null;
}

// Team combos: two partners' elements → a named synchronized super.
export const TEAM_COMBOS = {
  'hydro+pyro': { name: 'Geyser Inferno', desc: 'A boiling geyser erupts beneath the target.', k: 2.4, r: 3.2, status: null, fx: 'steam' },
  'bio+pyro': { name: 'Bonfire Blossom', desc: 'Burning petals rain on every foe.', k: 2.0, r: 3.6, status: 'burn', fx: 'wildfire' },
  'geo+pyro': { name: 'Volcano Drop', desc: 'A meteor of magma crashes down.', k: 2.6, r: 3, status: 'stun', fx: 'magma' },
  'echo+pyro': { name: 'Pyro Power Chord', desc: 'A fiery power chord blasts everything away.', k: 2.2, r: 3.4, status: null, fx: 'sonicboom' },
  'bio+hydro': { name: 'Monsoon Garden', desc: 'Healing rain for allies, vines for foes.', k: 1.6, r: 3.6, status: 'root', heal: 0.3, fx: 'bloom' },
  'geo+hydro': { name: 'Landslide Tide', desc: 'A wall of mud buries the enemy.', k: 2.2, r: 3.2, status: 'slow', fx: 'mudslide' },
  'echo+hydro': { name: 'Tsunami Remix', desc: 'A rhythmic tidal wave, on the beat.', k: 2.3, r: 3.5, status: null, fx: 'tidalring' },
  'bio+geo': { name: 'Ancient Grove', desc: 'Stone and roots crush the target.', k: 2.0, r: 3, status: 'root', fx: 'overgrowth' },
  'bio+echo': { name: 'Lullaby Encore', desc: 'An irresistible song — everyone falls asleep.', k: 1.4, r: 4, status: 'sleep', fx: 'lullaby' },
  'echo+geo': { name: 'Earthquake Riff', desc: 'The ground headbangs.', k: 2.4, r: 3.6, status: 'stun', fx: 'quake' },
  'hydro+volto': { name: 'Thunder Tide', desc: 'Electrified waves chain through every foe.', k: 2.4, r: 3.6, status: 'stun', fx: 'electrocharged' },
  'pyro+volto': { name: 'Plasma Drive', desc: 'A blazing plasma charge.', k: 2.6, r: 3, status: null, fx: 'overload' },
  'bio+volto': { name: 'Lemon Zest Storm', desc: 'Sour sparks everywhere.', k: 2.0, r: 3.4, status: 'stun', fx: 'quicken' },
  'geo+volto': { name: 'Lightning Rod', desc: 'A pillar of rock draws down the storm.', k: 2.3, r: 3, status: 'stun', fx: 'grounded' },
  'echo+volto': { name: 'Amp Overdrive', desc: 'Maximum feedback — eardrums beware.', k: 2.4, r: 3.6, status: 'stun', fx: 'feedback' },
  _default: { name: 'Double Strike', desc: 'A synchronized tag-team assault.', k: 2.0, r: 2.6, status: null, fx: 'burst' },
};
export function teamCombo(a, b) {
  const key = [a, b].sort().join('+');
  return TEAM_COMBOS[key] || Object.assign({}, TEAM_COMBOS._default, a === b ? { name: `Twin ${ELEMENTS[a]?.name || ''} Strike`.trim() } : {});
}
