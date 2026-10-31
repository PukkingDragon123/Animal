// UI theme tokens and tiny shared helpers for the pixel UI kit.
// The look: warm pixel-art RPG panels. Cream parchment cards with a thin pink-brown inner line, framed
// by a chunky copper border (dark outline, mid copper, a light rim on the lit side), little corner
// brackets and rivets, soft dark drop shadows; brass clamps on the thick bars, wooden plinths under the
// icon buttons, dark-brown ink on cream, white type with a dark outline over the world.
// Token NAMES are kept from the older themes (they are imported all over the game).
// Every colour helper here is memoised: the UI is redrawn every frame.
import { mix, shift, pack, bayer } from '../../color.js';

export const T = {
  // --- core tokens (imported all over the game)
  ink: '#2b1a17',                        // the dark outline
  panel: '#f3e6cf', panel2: '#e5d2b4',   // cream card / its shade (dark-brown text sits on these)
  edge: '#a35d3c', edgeL: '#d48c5c', hi: '#f6c99a',                     // copper frame + its lit rim
  text: '#4a2c22', dim: '#8c6650',       // dark-brown ink, its softer tone (outlined text over the world turns light)
  cyan: '#3ab8d8', cyan2: '#1f7a9e',
  amber: '#f0b030', amber2: '#b8741a',
  red: '#e2403a', green: '#5cc24a', pink: '#e86a9a',
  paper: '#f3e6cf', paperInk: '#4a2c22',
  // --- extended
  deep: '#1e1416', night: '#2a2030', plum: '#6a4a68', plum2: '#3e2a3e', plumL: '#9a7a98',
  coral: '#e8743a', coral2: '#a8481e', coralL: '#ffbc94', amberL: '#ffe8a0', gold: '#ffd860', brass: '#e8b84a', brassD: '#9a6a1a',
  cyanL: '#bfeaf6', violet: '#8a62d0', mint: '#8fe0b0', blue: '#3e8ee8', shade: '#1a0f0c', glass: '#5a3a2a',
  textD: '#b08a70', key: '#fbf3e3', keyD: '#e5d2b4', keySide: '#b8906c',
  // --- materials
  wood: '#a35d3c', woodL: '#d48c5c', woodD: '#6b3a28', woodDD: '#3e2218', grain: '#8a4e32',
  bark: '#5a3424', twig: '#8a5434',
  paperL: '#fbf3e3', paperD: '#e5d2b4', paperE: '#d4a59a', paperText: '#4a2c22', paperDim: '#8c6650',
  moss: '#4a9a3a', mossD: '#2e6a2a', leaf: '#5cc24a', leafL: '#a8e888', leafD: '#2e7a2e',
  sky: '#7ac8e8', berry: '#d8344a', rope: '#e0b070', ropeD: '#9a6a3a',
  // --- the pixel GUI's own ramps
  cream: '#f3e6cf', creamL: '#fbf3e3', creamD: '#e5d2b4', creamLine: '#d9a89a',
  copper: '#a35d3c', copperL: '#d48c5c', copperH: '#f2b98a', copperD: '#6b3a28',
  plinth: '#8a5434', plinthL: '#b87a4c', plinthD: '#5a3424',
  track: '#3a2a2e', trackL: '#5a464a',
  phone: '#d8443e', phoneD: '#8e2626', phoneL: '#f2786a', screen: '#2e2a3a', screenL: '#463e52',
};
// bar colour ramps: [fill, light band, dark edge]
export const BARS = {
  green: ['#5cc24a', '#a6ec80', '#2e7a2e'], blue: ['#3e8ee8', '#94ccff', '#1f4f9e'], orange: ['#f0902a', '#ffcc70', '#a5521a'],
  red: ['#e2403a', '#ff9a7a', '#8a1f24'], dark: ['#5a464a', '#7a6468', '#2e2226'], yellow: ['#f0c030', '#fff0a0', '#9a6a1a'],
  cyan: ['#3ab8d8', '#a8ecff', '#1f6a8a'], pink: ['#e86a9a', '#ffb0cc', '#8a2a4e'], violet: ['#8a62d0', '#c8a8ff', '#4a2e8a'],
};

// memoised colour maths
// (nested Maps: lookups allocate no key strings, so these are safe to call per frame)
const _mix = new Map(), _sh = new Map(), _pa = new Map();
export function mx(a, b, t) {
  let A = _mix.get(a); if (!A) _mix.set(a, (A = new Map()));
  let B = A.get(b); if (!B) A.set(b, (B = new Map()));
  let v = B.get(t); if (v === undefined) { v = mix(a, b, t); B.set(t, v); }
  return v;
}
export function sh(c, k) { let A = _sh.get(c); if (!A) _sh.set(c, (A = new Map())); let v = A.get(k); if (v === undefined) { v = shift(c, k); A.set(k, v); } return v; }
// packed colour with alpha 0..1
export function pa(c, a = 1) { const key = c + a; let v = _pa.get(key); if (v === undefined) { v = pack(c, Math.round(Math.max(0, Math.min(1, a)) * 255)); _pa.set(key, v); } return v; }
export const dith = (x, y, t) => bayer(x, y) < t;
// is a colour dark? (memoised luma test; dark text gets a light fill when outlined over the world)
const _dark = new Map();
export function isDark(c) {
  if (typeof c !== 'string' || c[0] !== '#' || c.length < 7) return false;
  let v = _dark.get(c);
  if (v === undefined) { const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); v = r * 0.3 + g * 0.59 + b * 0.11 < 110; _dark.set(c, v); }
  return v;
}

// easing
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t) => Math.pow(clamp01(t), 3);
export const easeOutBack = (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// a damped spring "boing" 0 → 1 (overshoots, settles): the bounce on every press
export const boing = (t) => (t <= 0 ? 0 : t >= 1.2 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(18 * t));
// the squash after a press: a decaying wobble (0 when settled)
export const squash = (t, k = 0.1) => (t < 0 || t > 0.7 ? 0 : Math.exp(-7 * t) * Math.sin(t * 26) * k);

// a stable accent colour for a speaker name
const NAME_COLS = ['#2f8aa8', '#c8582a', '#7a5ab0', '#3f8a2c', '#b8386a', '#b8841a', '#3f62b0'];
export function nameColor(name) {
  let h = 7; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NAME_COLS[h % NAME_COLS.length];
}
// small deterministic hash for per-widget animation phases
export function hash(...v) { let h = 2166136261; for (const n of v) { h ^= (n | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
