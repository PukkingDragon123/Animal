// UI theme tokens and tiny shared helpers for the pixel UI kit.
// Palette: a warm, hand-made "field kit": oak and walnut wood panels, cream
// parchment insets, moss and leaf greens, a sky-teal accent, berry red for
// warnings and dark-brown ink. Token NAMES are kept from the old night theme
// (they are imported all over the game); their values are now natural tones.
// Every colour helper here is memoised: the UI is redrawn every frame, so
// per-pixel colour maths must be a Map lookup, not HSL conversions.
import { mix, shift, pack, bayer } from '../../color.js';

export const T = {
  // --- core tokens (imported all over the game)
  ink: '#2a1709',            // dark-brown outline
  panel: '#7a4a26', panel2: '#5e3819',   // oak / walnut panel fills (cream text sits on these)
  edge: '#b0753f', edgeL: '#dca468', hi: '#f6d49a',                     // the carved rim
  text: '#fff4dc', dim: '#e6c897',       // cream text on wood, tan secondary
  cyan: '#4fc4c0', cyan2: '#2a8a8a',     // sky teal accent
  amber: '#ffc84a', amber2: '#cf8a2a',   // honey gold
  red: '#e2475a', green: '#86c84e', pink: '#ff8fae',
  paper: '#f6ead0', paperInk: '#4a2e18',
  // --- extended
  deep: '#1c140c', night: '#24301e', plum: '#5a3a2a', plum2: '#3e2818', plumL: '#8a5a3a',
  coral: '#ee8256', coral2: '#b8532f', coralL: '#ffc8a4', amberL: '#fff0c0', gold: '#ffe08a', brass: '#d9a34a', brassD: '#8e5a24',
  cyanL: '#c6f2ea', violet: '#b49ae0', mint: '#a6e6b0', blue: '#5a8ad8', shade: '#1a0d04', glass: '#5a3a1e',
  textD: '#b8946a', key: '#fff7e6', keyD: '#ead6b0', keySide: '#a8784a',
  // --- natural materials
  wood: '#a0683a', woodL: '#cf9658', woodD: '#6a3f1e', woodDD: '#4a2a12', grain: '#8a5530',
  bark: '#5a3a20', twig: '#7a5030',
  paperL: '#fffaec', paperD: '#e4cfa6', paperE: '#c9ab7c', paperText: '#4a2e18', paperDim: '#8a6a48',
  moss: '#6c9a3a', mossD: '#3f6a26', leaf: '#8cc850', leafL: '#c8ec7a', leafD: '#4c8a2c',
  sky: '#7fd0e6', berry: '#d23a52', rope: '#d8b67a', ropeD: '#9a7444',
};

// memoised colour maths
// (nested Maps: lookups allocate no key strings, so these are safe to call per pixel)
const _mix = new Map(), _sh = new Map(), _pa = new Map();
export function mx(a, b, t) {
  let A = _mix.get(a); if (!A) _mix.set(a, (A = new Map()));
  let B = A.get(b); if (!B) A.set(b, (B = new Map()));
  let v = B.get(t); if (v === undefined) { v = mix(a, b, t); B.set(t, v); }
  return v;
}
export function sh(c, k) { let A = _sh.get(c); if (!A) _sh.set(c, (A = new Map())); let v = A.get(k); if (v === undefined) { v = shift(c, k); A.set(k, v); } return v; }
// packed colour with alpha 0..1 (for translucent fills over the 3D view)
export function pa(c, a = 1) { const key = c + a; let v = _pa.get(key); if (v === undefined) { v = pack(c, Math.round(Math.max(0, Math.min(1, a)) * 255)); _pa.set(key, v); } return v; }
export const dith = (x, y, t) => bayer(x, y) < t;

// easing
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t) => Math.pow(clamp01(t), 3);
export const easeOutBack = (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// a stable accent colour for a speaker name (name tabs, party cards): natural dyes
const NAME_COLS = ['#2f8a86', '#b8532f', '#7a5aa8', '#4f8a2c', '#b03a5a', '#b9792a', '#3f6aa8'];
export function nameColor(name) {
  let h = 7; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NAME_COLS[h % NAME_COLS.length];
}
// small deterministic hash for per-widget animation phases
export function hash(...v) { let h = 2166136261; for (const n of v) { h ^= (n | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
