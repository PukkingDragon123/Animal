// Colour helpers for hand-made-looking pixel art: hex <-> packed RGBA, mixing,
// and hue-shifted ramps (shadows drift toward violet/blue and lose saturation,
// highlights drift toward warm yellow) the way pixel artists build palettes.

export function rgb(c) {
  if (Array.isArray(c)) return c;
  if (typeof c === 'number') return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  let s = String(c || '#ff00ff').trim();
  if (s[0] === '#') s = s.slice(1);
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const v = parseInt(s.slice(0, 6), 16);
  return Number.isFinite(v) ? [(v >> 16) & 255, (v >> 8) & 255, v & 255] : [255, 0, 255];
}
const h2 = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
export const hex = (r, g, b) => '#' + h2(r) + h2(g) + h2(b);
export const hexOf = (c) => { const [r, g, b] = rgb(c); return hex(r, g, b); };
// packed little-endian ABGR for Uint32 views over ImageData
export function pack(c, a = 255) { const [r, g, b] = rgb(c); return (((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0; }
export function unpack(p) { return [p & 255, (p >>> 8) & 255, (p >>> 16) & 255, (p >>> 24) & 255]; }
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
export const lum = (c) => { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

export function toHsl(c) {
  let [r, g, b] = rgb(c); r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
export function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
// rotate hue toward a target hue by up to `amt` degrees
function hueToward(h, target, amt) { let d = ((target - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), amt); }

// Shade a colour by k steps (negative = darker, positive = lighter) with hue shifting.
export function shift(c, k) {
  const [h, s, l] = toHsl(c);
  if (k < 0) {
    const t = -k;
    return fromHsl(hueToward(h, 255, 13 * t), s * (1 - 0.11 * t) + (s < 0.15 ? 0.05 * t : 0), l * Math.pow(0.78, t));
  }
  const t = k;
  return fromHsl(hueToward(h, 55, 9 * t), Math.min(1, s * (1 + 0.04 * t)), l + (1 - l) * (1 - Math.pow(0.72, t)));
}
// 6-step ramp: [outline, deep, shadow, base, light, highlight]
const rampCache = new Map();
export function ramp(c) {
  const key = hexOf(c);
  let r = rampCache.get(key);
  if (!r) {
    const out = mix(shift(key, -4), '#1b1024', 0.45);
    r = [out, shift(key, -2), shift(key, -1), key, shift(key, 1), shift(key, 2.4)];
    rampCache.set(key, r);
  }
  return r;
}
export const RAMP_OUTLINE = 0, RAMP_DEEP = 1, RAMP_SHADOW = 2, RAMP_BASE = 3, RAMP_LIGHT = 4, RAMP_HI = 5;

// 4x4 Bayer matrix (0..1) for ordered dithering
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER4[(y & 3) * 4 + (x & 3)];

// Shared master palette (Resurrect-64-ish spirit + neons) for scenes and UI
export const PAL = {
  ink: '#2e222f', ink2: '#3e3546', night: '#1f1a2e', navy: '#2b2a4a', slate: '#625565', stone: '#8b7f8e', fog: '#c7bfc9', paper: '#f4ecdc', white: '#fffaf0',
  brick: '#a14b3b', brick2: '#7a3530', rust: '#c0603a', clay: '#d98a5f', sand: '#e8c39e', wood: '#8f5b3a', wood2: '#6b3f2a', woodL: '#c08455',
  green: '#4f8f3a', leaf: '#6fb043', moss: '#3b6a3a', lime: '#b6d53c', teal: '#2f8f83', aqua: '#4fc7d0', sky: '#7fc6f0', blue: '#3b6fd6', deep: '#24447a',
  yellow: '#ffd23a', gold: '#e8a93a', orange: '#ff8a2b', red: '#e8433f', pink: '#ff6fae', magenta: '#d43a9a', purple: '#7b4fd0', violet: '#a77bf0',
  neonPink: '#ff4fd8', neonCyan: '#3ff0ff', neonYellow: '#fff36b', neonGreen: '#7dff5a', neonRed: '#ff3a5a', neonBlue: '#5a8bff', neonOrange: '#ff9d2b',
};
