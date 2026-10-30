// UI theme tokens and tiny shared helpers for the pixel UI kit.
// Palette: deep indigo / plum night panels, warm amber + coral accents, cyan
// highlights. Every colour helper here is memoised: the UI is redrawn every
// frame, so per-pixel colour maths must be a Map lookup, not HSL conversions.
import { mix, shift, pack, bayer } from '../../color.js';

export const T = {
  // --- original tokens (kept: imported all over the game)
  ink: '#120c1c', panel: '#2b2442', panel2: '#221c36', edge: '#4e4672', edgeL: '#6e64a0', hi: '#8f86c4',
  text: '#f2ecff', dim: '#a59cc8', cyan: '#5fd8e8', cyan2: '#2c8aa8', amber: '#ffcf5a', amber2: '#d08a2a', red: '#ff5a64', green: '#7ce07a', pink: '#ff7ab8',
  paper: '#f4ead8', paperInk: '#3a2a3a',
  // --- added
  deep: '#0c0814', night: '#171129', plum: '#3b2550', plum2: '#28183a', plumL: '#5e3d78',
  coral: '#ff8a6a', coral2: '#c9503f', coralL: '#ffc4a8', amberL: '#fff0b8', gold: '#ffe08a', brass: '#e0a845', brassD: '#9a5a2a',
  cyanL: '#c4f6ff', violet: '#9b7cf0', mint: '#8ff0c0', blue: '#5f78e8', shade: '#05030a', glass: '#1d1733',
  textD: '#6a6488', key: '#f4eeff', keyD: '#cfc6ec', keySide: '#8f86c4',
};

// memoised colour maths
const _mix = new Map(), _sh = new Map(), _pa = new Map();
export function mx(a, b, t) { const k = a + b + t; let v = _mix.get(k); if (v === undefined) { v = mix(a, b, t); _mix.set(k, v); } return v; }
export function sh(c, k) { const key = c + k; let v = _sh.get(key); if (v === undefined) { v = shift(c, k); _sh.set(key, v); } return v; }
// packed colour with alpha 0..1 (for translucent glass fills over the 3D view)
export function pa(c, a = 1) { const key = c + a; let v = _pa.get(key); if (v === undefined) { v = pack(c, Math.round(Math.max(0, Math.min(1, a)) * 255)); _pa.set(key, v); } return v; }
export const dith = (x, y, t) => bayer(x, y) < t;

// easing
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t) => Math.pow(clamp01(t), 3);
export const easeOutBack = (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// a stable accent colour for a speaker name (name plates, party cards)
const NAME_COLS = ['#2c8aa8', '#c9503f', '#7a4fc0', '#3f9a6a', '#c0457e', '#b9792a', '#4a62c8'];
export function nameColor(name) {
  let h = 7; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NAME_COLS[h % NAME_COLS.length];
}
// small deterministic hash for per-widget animation phases
export function hash(...v) { let h = 2166136261; for (const n of v) { h ^= (n | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
