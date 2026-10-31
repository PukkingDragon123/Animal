// UI theme tokens and tiny shared helpers for the UI kit.
// Palette: the TokoPhone — a bright, chunky handheld-gadget look. Deep indigo ink outlines,
// glossy royal-blue "screens" framed by white bezels, cream paper cards, and candy accents
// (sunshine yellow, aqua, lime, berry red, bubblegum pink, grape). Token NAMES are kept from
// the older themes (they are imported all over the game); their values are the new colours.
// Every colour helper here is memoised: the UI is redrawn every frame.
import { mix, shift, pack, bayer } from '../../color.js';

export const T = {
  // --- core tokens (imported all over the game)
  ink: '#1c1838',                        // deep indigo outline
  panel: '#2f45b4', panel2: '#22308a',   // screen blues (white text sits on these)
  edge: '#9fb6ff', edgeL: '#dfe7ff', hi: '#ffffff',                     // bezel tints
  text: '#ffffff', dim: '#bcc8ff',       // white text on screens, periwinkle secondary
  cyan: '#2fd4f0', cyan2: '#1590c8',     // aqua
  amber: '#ffc93a', amber2: '#f08c1a',   // sunshine
  red: '#ff4d6a', green: '#5fdc4a', pink: '#ff74c0',
  paper: '#fffaf0', paperInk: '#2b2550',
  // --- extended
  deep: '#120f28', night: '#1a1840', plum: '#6a4aa8', plum2: '#3e2a70', plumL: '#9a7ae0',
  coral: '#ff7f50', coral2: '#e0503a', coralL: '#ffc4ac', amberL: '#fff3b8', gold: '#ffe066', brass: '#f2b43a', brassD: '#b06a1a',
  cyanL: '#c8f6ff', violet: '#9c7bff', mint: '#8ff0c8', blue: '#4a78ff', shade: '#0a0820', glass: '#2a3070',
  textD: '#8f9ad8', key: '#ffffff', keyD: '#e4e9f8', keySide: '#9aa8d8',
  // --- "materials" (old names; now the gadget's plastics)
  wood: '#3d55c8', woodL: '#6a86ff', woodD: '#2a3a96', woodDD: '#1a2468', grain: '#3348b0',
  bark: '#2a2f6a', twig: '#4a5aa0',
  paperL: '#ffffff', paperD: '#efe7d6', paperE: '#d6c9ae', paperText: '#2b2550', paperDim: '#7a72a0',
  moss: '#3fbf5a', mossD: '#23864a', leaf: '#7ae05a', leafL: '#c8f7a0', leafD: '#3aa040',
  sky: '#7ad8ff', berry: '#ff3d6a', rope: '#ffd27a', ropeD: '#c08a3a',
  // --- the TokoPhone itself
  phone: '#ff4a5e', phoneD: '#c42a48', phoneL: '#ff9aa6', screen: '#16204a', screenL: '#24357a',
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
// packed colour with alpha 0..1 (kept for older callers)
export function pa(c, a = 1) { const key = c + a; let v = _pa.get(key); if (v === undefined) { v = pack(c, Math.round(Math.max(0, Math.min(1, a)) * 255)); _pa.set(key, v); } return v; }
export const dith = (x, y, t) => bayer(x, y) < t;

// easing
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t) => Math.pow(clamp01(t), 3);
export const easeOutBack = (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// a damped spring "boing" 0 → 1 (overshoots, settles): the bounce on every press
export const boing = (t) => (t <= 0 ? 0 : t >= 1.2 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(18 * t));

// a stable accent colour for a speaker name (name tabs, party cards): candy dyes
const NAME_COLS = ['#1fa8d8', '#ff6a4a', '#8a62f0', '#3fb84a', '#f04a8a', '#f0a020', '#4a6af0'];
export function nameColor(name) {
  let h = 7; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NAME_COLS[h % NAME_COLS.length];
}
// small deterministic hash for per-widget animation phases
export function hash(...v) { let h = 2166136261; for (const n of v) { h ^= (n | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
