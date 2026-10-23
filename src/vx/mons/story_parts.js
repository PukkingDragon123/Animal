// Shared parts for the opening-story Tokonmon (Wheezowl, Mopzart, Dreadrake, Zapkit,
// Thundersabre): cube helpers and mirror twins, fabric painters (knit, rib, cloth, velvet),
// mop cords and periwig rolls, gold and chain, lightning, the drip-form colour helpers and
// a few particle kinds of their own (wheeze puffs, gold notes, blue lightning, a water ball).
import { shade, gradient, ramp, shift, mix, h2 } from './kit.js';
import { blackGold } from '../model.js';
import { defineFx } from '../fx.js';
import { seg, E } from '../anim.js';

export const D2R = Math.PI / 180;
// a cube: origin, size (model units), painter, extra fields
export const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
// the left-side twin of a right-side (x < 0) cube
export function L(c) {
  return { ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) };
}
export const both = (...cs) => cs.flatMap((c) => [c, L(c)]);
const sideName = (n) => (typeof n === 'string' && /R$/.test(n) ? n.slice(0, -1) + 'L' : n);
// a right-side bone and its mirrored left twin (names ending in R become …L, parents too)
export function twin(b) {
  return [b, { ...b, name: sideName(b.name), parent: sideName(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: (b.cubes || []).map(L) }];
}
// accessory cubes: tagged with the drip option id, hidden until worn
export const acc = (id, cubes) => cubes.map((c) => ({ ...c, id, hide: true }));

// ---------------------------------------------------------------- painting helpers
export function region(p, w, h, inside, fill, edge) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y)) continue;
    const e = edge && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1));
    p.px(x, y, e ? edge : typeof fill === 'function' ? fill(x, y) : fill);
  }
}
export const ell = (cx, cy, rx, ry) => (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
// draw a character map (rows) with a palette at x0, y0
export function stamp(p, rows, pal, x0 = 0, y0 = 0) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) p.px(x0 + i, y0 + j, c); } }); }
// a thick polyline
export function stroke(p, pts, c, t = 1) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
    for (let k = 0; k <= n; k++) { const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n; for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) p.px(Math.floor(x - (t - 1) / 2 + a), Math.floor(y - (t - 1) / 2 + b), c); }
  }
}
const side = (face) => face !== 'up' && face !== 'down';
const tOf = (face, y, h) => (face === 'up' ? 0.05 : face === 'down' ? 0.98 : y / Math.max(1, h - 1));

// stockinette knit: columns of V stitches over a banded fill (cardigans, sweaters, scarves)
export function knit(c, o = {}) {
  const hi = o.hi || shift(c, 0.2), lo = o.lo || shift(c, -0.26), cw = o.cw || 4, ch = o.ch || 3;
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const base = ramp([hi, c, lo], tOf(face, y, h) * 0.9, x, y), cx = (x + (o.ox || 0)) % cw, cy = y % ch;
      let col = base;
      if ((cy === 0 && (cx === 0 || cx === cw - 1)) || (cy === 1 && (cx === 1 || cx === cw - 2))) col = shift(base, 0.16);
      else if (cy === 2 && (cx === 1 || cx === cw - 2)) col = shift(base, -0.2);
      p.px(x, y, col);
    }
    if (o.rim !== false && side(face) && face !== 'plane') for (let x = 0; x < w; x++) p.px(x, h - 1, shift(lo, -0.2));
  };
}
// ribbing: vertical ridges (cuffs, hems, collars)
export function rib(c, o = {}) {
  const hi = o.hi || shift(c, 0.18), lo = o.lo || shift(c, -0.28);
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const base = ramp([hi, c, lo], tOf(face, y, h) * 0.8, x, y); p.px(x, y, face === 'up' || face === 'down' ? base : x % 2 ? shift(base, -0.16) : shift(base, 0.08)); }
  };
}
// woven cloth: soft bands and a few vertical folds
export function cloth(c, o = {}) {
  const hi = o.hi || shift(c, 0.2), lo = o.lo || shift(c, -0.3), every = o.folds || 7;
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let col = ramp([hi, c, lo], tOf(face, y, h), x, y);
      if (side(face) && every && x % every === Math.floor(every / 2)) col = shift(col, -0.14);
      if (side(face) && every && x % every === Math.floor(every / 2) - 1) col = shift(col, 0.08);
      p.px(x, y, col);
    }
    if (o.trim && side(face)) for (let x = 0; x < w; x++) { p.px(x, h - 1, o.trim); if (h > 4) p.px(x, h - 2, shift(o.trim, -0.2)); }
  };
}
// velvet: deep bands with a soft sheen line
export function velvet(c, o = {}) {
  const hi = o.hi || shift(c, 0.3), lo = o.lo || shift(c, -0.35);
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = tOf(face, y, h); let col = ramp([hi, c, c, lo], t, x, y);
      if (side(face) && (x + y * 2) % 11 === 0) col = shift(col, 0.12);
      p.px(x, y, col);
    }
    if (o.trim && side(face)) for (let x = 0; x < w; x++) { p.px(x, 0, o.trim); p.px(x, h - 1, o.trim); }
  };
}
// Komondor cords: twisted ropes hanging in columns; ragged ends cut out of the bottom
export function cords(c, o = {}) {
  const hi = o.hi || shift(c, 0.12), lo = o.lo || shift(c, -0.22), deep = o.deep || shift(c, -0.4), cw = o.cw || 3;
  return (p, w, h, face) => {
    if (face === 'up' || face === 'down') {          // seen end-on: a carpet of round cord tips
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const cx = (x + (Math.floor(y / 3) % 2) * 1) % 3, cy = y % 3; p.px(x, y, face === 'down' ? lo : cx === 1 && cy === 1 ? hi : cx === 0 || cy === 2 ? lo : c); }
      return;
    }
    for (let x = 0; x < w; x++) {
      const k = x % cw, col = Math.floor(x / cw), ph = (col * 3) % 5, cut = o.ragged ? Math.floor(h2(col, 3, o.seed || 1) * (o.ragged + 1)) : 0;
      for (let y = 0; y < h; y++) {
        if (y >= h - cut) { p.px(x, y, 0); continue; }
        const t = tOf(face, y, h), base = ramp([hi, c, lo], t * 0.85, x, y), tw = (y + ph + k * 2) % 5;
        let cc = k === cw - 1 ? (o.gap || lo) : tw === 0 ? shift(base, -0.07) : tw === 1 && k === 0 ? shift(base, 0.08) : base;
        if (y === h - cut - 1 && k !== cw - 1) cc = shift(base, -0.15);
        p.px(x, y, cc);
      }
    }
  };
}
// a periwig roll seen from the side: a horizontal sausage curl; its south / north face shows the spiral
export function roll(c, o = {}) {
  const hi = o.hi || shift(c, 0.14), lo = o.lo || shift(c, -0.24), deep = o.deep || shift(c, -0.42), ends = o.axis === 'x' ? ['east', 'west'] : ['south', 'north'];
  return (p, w, h, face) => {
    if (ends.includes(face)) {
      const cx = w / 2, cy = h / 2;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx / (w / 2), dy / (h / 2)), a = Math.atan2(dy, dx), lit = dx + dy < 0;
        // a curl seen end-on: a rim, one dark groove ring opening at the bottom, a lit core
        const groove = r > 0.48 && r < 0.72 && !(a > 0.6 && a < 1.9);
        p.px(x, y, r > 0.9 ? lo : groove ? deep : r < 0.3 ? (lit ? hi : c) : lit ? hi : c);
      }
      return;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = face === 'up' ? 0.1 : face === 'down' ? 0.95 : y / Math.max(1, h - 1);
      let col = t < 0.2 ? hi : t < 0.62 ? c : t < 0.85 ? lo : deep;
      if (side(face) && (x + Math.round(t * 3)) % 4 === 0 && t > 0.15 && t < 0.85) col = shift(col, -0.1);     // the twist of the curl
      p.px(x, y, col);
    }
  };
}
// polished gold (and a link pattern for chains)
export const GOLD = ['#fff6c0', '#ffd84a', '#e0a424', '#9a6414'];
export const goldP = (p, w, h, face) => { gradient(GOLD)(p, w, h, face); if (side(face) && w > 2) { p.px(1, 1, '#ffffff'); } };
export const chainP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = x % 3; p.px(x, y, k === 2 ? GOLD[3] : y === 0 || k === 0 ? GOLD[1] : GOLD[2]); }
  if (side(face)) for (let x = 0; x < w; x += 3) p.px(x, 0, GOLD[0]);
};
export const silverP = gradient(['#ffffff', '#d8dce8', '#9ca2b4', '#5a6074']);
export const strapP = (c) => (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? shift(c, 0.25) : y === h - 1 ? shift(c, -0.3) : c); if (side(face)) for (let x = 1; x < w; x += 4) p.px(x, Math.floor(h / 2), shift(c, 0.4)); };
// a lightning zigzag through pts (texel coords) with a white core
export function zig(p, pts, c, core = '#ffffff', t = 2) { stroke(p, pts, c, t + 1); stroke(p, pts, core, Math.max(1, t - 1)); }
// a jagged lightning-bolt shape (a filled polygon) inside w × h
export function boltShape(p, w, h, fill, edge) {
  const pts = [[w * 0.62, 0], [w * 0.18, h * 0.55], [w * 0.48, h * 0.55], [w * 0.3, h], [w * 0.86, h * 0.38], [w * 0.54, h * 0.38], [w * 0.78, 0]];
  const inside = (x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) c = !c; } return c; };
  region(p, w, h, inside, fill, edge);
}

// ---------------------------------------------------------------- the ultra-drip form
export function hsl(hex) {
  const n = parseInt(hex.slice(1, 7), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
  return { h, s, l };
}
export function fromHsl(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16).padStart(2, '0')).join('');
}
export const lacquer = (l, hue = 255) => fromHsl(hue, 0.14, 0.05 + l * 0.26);
export const gilt = (l) => fromHsl(44, 0.88, Math.min(0.93, 0.2 + l * 0.62));
// a drip-form colour map from a rule (hsl, glow, hex) → 'gold' | 'black' | 'keep' | '#hex' | undefined (the default)
export function formMap(rule) {
  return (c, glow) => {
    if (typeof c !== 'string' || c[0] !== '#' || c.length < 7) return c;
    const x = hsl(c), r = rule(x, glow, c.toLowerCase());
    return r === 'gold' ? gilt(x.l) : r === 'black' ? lacquer(x.l) : r === 'keep' ? c : typeof r === 'string' ? r : blackGold(c, glow);
  };
}
// glow colours of the drip form: electric blue with a white core
export const blueGlow = ({ s, l }) => (s > 0.15 ? fromHsl(200, Math.min(1, s), Math.min(0.95, Math.max(0.55, l))) : undefined);

// ---------------------------------------------------------------- rig helpers
// legs that keep their feet planted while the body rises / sinks by dy (len: leg length in units)
export function plant(P, legs, dy, len) { for (const s of legs) { P.pos(s, 0, dy, 0); P.scl(s, 1, Math.max(0.3, (len + dy) / len), 1); } }
// beats: index and phase of a beat of length per; pulse is a quick 0 → 1 → 0 hit at the start of each beat
export function beat(t, per, t0 = 0) { const b = (t - t0) / per, n = Math.floor(b), ph = b - n; return { n, ph, pulse: t < t0 ? 0 : Math.sin(Math.min(1, ph * 1.7) * Math.PI) }; }
// in-out envelope: 0 → 1 over [a, a + i], back to 0 over [b - o, b]
export const env = (t, a, b, i = 0.15, o = 0.2) => seg(t, a, a + i, E.out) * (1 - seg(t, b - o, b, E.inout));

// ---------------------------------------------------------------- particles
const puffSpr = (c, lo) => (p, w, h) => {
  const blobs = [[0.5, 0.55, 0.36], [0.3, 0.45, 0.24], [0.7, 0.42, 0.25], [0.52, 0.28, 0.24]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let d = 9, lit = 0; for (const [bx, by, r] of blobs) { const dd = Math.hypot((x + 0.5) / w - bx, (y + 0.5) / h - by) / r; if (dd < d) { d = dd; lit = ((x + 0.5) / w - bx + (y + 0.5) / h - by) / r; } }
    if (d > 1) continue; p.px(x, y, d > 0.82 ? lo : lit < -0.3 ? '#ffffff' : c);
  }
};
const noteSpr = (c, hi, lo) => (p, w, h) => { p.rect(1, h - 4, 4, 3, c); p.px(0, h - 3, c); p.px(5, h - 3, lo); p.vl(4, 1, h - 4, c); p.rect(5, 1, 2, 2, c); p.px(7, 3, c); p.px(7, 4, lo); p.px(2, h - 4, hi); p.px(4, 1, hi); };
const zapSpr = (cols) => (p, w, h, f) => { let x = Math.floor(w / 2) + (f % 2 ? 1 : -1); for (let y = 0; y < h; y++) { p.px(x, y, cols[0]); p.px(x + 1, y, cols[1]); p.px(x - 1, y, cols[2]); if (y % 3 === 2) x += (y + f) % 6 === 2 ? 2 : -2; x = Math.max(1, Math.min(w - 2, x)); } };
const waterSpr = (p, w, h) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - c); if (d > c + 0.3) continue; p.px(x, y, d > c - 1 ? '#3a9ae0' : Math.hypot(x - c * 0.6, y - c * 0.55) < 2 ? '#ffffff' : d > c - 2.4 ? '#8ad4ff' : (x + y) % 5 === 0 ? '#bfeaff' : '#5ab8f4'); }
};
export const SPFX = {
  puff: defineFx('sp-puff', { w: 11, h: 9, paint: puffSpr('#f4f6ff', '#b8c4dc'), life: [0.45, 0.8], size: [0.04, 0.15], speed: [0.5, 1.2], grav: -0.5, drag: 2.6, spread: 0.45, fade: true, spin: 1.2 }),
  goldnote: defineFx('sp-goldnote', { w: 8, h: 12, paint: noteSpr('#ffd23a', '#fff6c0', '#a8701a'), glow: true, life: [1.1, 1.5], size: [0.13, 0.13], speed: [0.4, 0.6], grav: -0.5, drag: 0.6, spread: 0.6, wob: 1.2, fade: true }),
  zap: defineFx('sp-zap', { w: 7, h: 13, frames: [0, 1].map(() => zapSpr(['#ffffff', '#fff070', '#ffb02a'])), glow: true, life: [0.08, 0.16], size: [0.16, 0.22], speed: [0, 0.3], grav: 0, spread: 1, spin: 3 }),
  zapblue: defineFx('sp-zapblue', { w: 7, h: 13, frames: [0, 1].map(() => zapSpr(['#ffffff', '#8ae0ff', '#3a7aff'])), glow: true, life: [0.08, 0.16], size: [0.16, 0.22], speed: [0, 0.3], grav: 0, spread: 1, spin: 3 }),
  boltblue: defineFx('sp-boltblue', { w: 7, h: 16, frames: [0, 1].map(() => zapSpr(['#ffffff', '#8ae0ff', '#3a7aff'])), glow: true, life: [0.08, 0.16], size: [0.25, 0.3], speed: [0, 0.4], grav: 0, spread: 1, spin: 3 }),
  water: defineFx('sp-water', { w: 16, h: 16, paint: waterSpr, life: [0.32, 0.32], size: [0.3, 0.42], speed: [6, 6], grav: 0, drag: 0, spread: 0 }),
};

// ---------------------------------------------------------------- the storm-cat line (Zapkit, Thundersabre)
// the chest emblem: an original mark — a gold cat-head silhouette (two ears, round cheeks, a pointed
// chin) split by a red lightning bolt, painted straight on the fur (no ring, no oval)
export function catEmblem(o = {}) {
  const gold = o.gold || '#ffd23a', goldLo = o.goldLo || '#c88a1a', red = o.red || '#e8202a', line = o.line || '#140c10';
  return (p, w, h, face) => {
    if (o.base) o.base(p, w, h, face);
    if (face !== 'south') return;
    const head = (x, y) => {
      const u = (x + 0.5) / w, v = (y + 0.5) / h;
      const face1 = ((u - 0.5) / 0.36) ** 2 + ((v - 0.56) / 0.3) ** 2 <= 1;
      const chin = v > 0.6 && v < 0.95 && Math.abs(u - 0.5) < (0.95 - v) * 0.9;
      const ear = (cx) => v > 0.06 && v < 0.42 && Math.abs(u - cx) < (v - 0.06) * 0.55;
      return face1 || chin || ear(0.25) || ear(0.75);
    };
    region(p, w, h, head, (x, y) => (y / h < 0.5 ? gold : goldLo), line);
    const pts = [[0.58, 0.12], [0.36, 0.52], [0.52, 0.52], [0.4, 0.92]].map(([u, v]) => [u * w, v * h]);
    stroke(p, pts, red, Math.max(1, Math.round(w / 9)));
  };
}
// a lightning-bolt plane (glow): gold with a white core
export const boltP = (p, w, h) => boltShape(p, w, h, (x, y) => (Math.abs(x + 0.5 - w * 0.55) < w * 0.12 ? '#ffffff' : y < h * 0.5 ? '#fff070' : '#ffc81e'), '#ff9a1a');
