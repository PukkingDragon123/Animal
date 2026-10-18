// Shared parts for the bear line — an original homage to one rapper's album arc:
//   Gradcub (dropout → graduation) → Bearbreak (heartbreak) → Yeezilla (the masked, dark
//   era) | Polobruin (the pink-polo hero). Every design here is our own plush bear.
// Painters for tufted fur in clumps, fuzzy cut-out fringes and halos, shutter shades,
// link chains, gold and knit; small geometry builders; leg planting; and the line's own
// particles (confetti, notes, fluff, auto-tune rings, crystal shards, red tape, phoenix
// feathers, guard rings).
import { defineFx } from '../fx.js';
import { poly, ramp, shift, mix, h2 } from './kit.js';

export const tx = (u) => Math.round(u * 3);                       // units → texels (ppu 3)
export const isSide = (f) => f === 'south' || f === 'north' || f === 'east' || f === 'west';
// x offset of a face inside its box-UV strip (west | south | east | north), so patterns run on round corners
export const wrapX = (face, cube) => { const w = tx(cube.s[0]), d = tx(cube.s[2]); return face === 'south' ? d : face === 'east' ? d + w : face === 'north' ? 2 * d + w : 0; };
export const fill = (p, w, h, fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c) p.px(x, y, c); } };
const alphaAt = (S, x, y) => x >= 0 && y >= 0 && x < S.w && y < S.h && (S.data[y * S.w + x] >>> 24) > 0;
// darken the opaque texels whose neighbour below (and optionally beside) is empty: a soft
// in-texture outline for cut-out planes, which get no outline hull
export function edgeLine(p, col, o = {}) {
  const S = p.s, src = { w: S.w, h: S.h, data: S.data.slice() };
  for (let y = o.skipTop ? 1 : 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
    if (!alphaAt(src, x, y)) continue;
    const below = !alphaAt(src, x, y + 1), side = o.sides && (!alphaAt(src, x - 1, y) || !alphaAt(src, x + 1, y)), above = o.top && !alphaAt(src, x, y - 1);
    if (below || side || above) p.px(x, y, col);
  }
}

// ---------------------------------------------------------------- fur
// Tufted fur in clumps: clean top-lit bands under staggered rows of pointed locks. Rows are
// painted bottom-up so every row overlaps the one beneath; each lock has a dark line where its
// tip lies on the next row, a lit left flank on the tip and (optionally) lighter tips.
// o: hi, lo, line, lite, tip, sx (lock width, texels), sy (row pitch), tl (tip length), seed, rim, split
export function fur(c, o = {}) {
  const hi = o.hi || shift(c, 0.2), lo = o.lo || shift(c, -0.28), line = o.line || shift(lo, -0.12), lite = o.lite || shift(c, 0.12);
  const sx = o.sx || 9, sy = o.sy || 6, L0 = o.tl ?? 4, seed = o.seed || 1, tip = o.tip || null;
  return (p, w, h, face, cube) => {
    const base = (x, y) => (face === 'up' ? (o.upC || hi) : face === 'down' ? shift(lo, -0.14) : ramp(o.ramp || [hi, c, c, lo], h > 1 ? y / (h - 1) : 0.5, x, y));
    fill(p, w, h, base);
    if (face === 'down' && !o.under) return;
    const ox = cube && isSide(face) && o.wrap !== false ? wrapX(face, cube) : 0;
    const rows = Math.ceil((h + L0 + 4) / sy) + 1;
    for (let r = rows; r >= 0; r--) {
      const y0 = (r - 1) * sy + (o.y0 ?? -2);
      for (let k = -2; k * sx - ox < w + sx * 2; k++) {
        const cx = k * sx + ((r & 1) ? sx / 2 : 0) + Math.round((h2(k, r, seed) - 0.5) * (o.jit ?? 1)) - ox;
        if (cx < -sx * 1.5 || cx > w + sx * 1.5) continue;
        const L = L0 + Math.round(h2(r, k, seed + 3) * (o.tv ?? 1)), lean = Math.round((h2(k, r, seed + 5) - 0.5) * (o.lean ?? 2)), half0 = sx / 2;
        const inside = (X, Y) => {
          const yy = Y - y0; if (yy < 0) return false;
          if (yy < sy) return Math.abs(X + 0.5 - cx) <= half0;
          const v = (yy - sy + 1) / (L + 1); if (v >= 1) return false;
          return Math.abs(X + 0.5 - cx - lean * v) <= half0 * (1 - v) + 0.2;
        };
        for (let Y = Math.max(0, y0); Y < Math.min(h, y0 + sy + L); Y++) for (let X = Math.floor(cx - half0 - 3); X <= Math.ceil(cx + half0 + 3); X++) {
          if (X < 0 || X >= w || !inside(X, Y)) continue;
          const yy = Y - y0, inTip = yy >= sy - 1, b = base(X, Y), u = (X + 0.5 - cx) / half0;
          let col = b;
          if (!inside(X, Y + 1)) col = face === 'up' ? shift(b, -0.2) : line;                       // the edge where the clump lies on the next row
          else if (!inside(X, Y + 2) && inTip) col = shift(b, -0.1);                                 // a soft shadow above it
          else if (yy >= 1 && yy <= 3 && u > -0.55 && u < -0.05 && Math.abs(u + 0.3 - (yy - 2) * 0.12) < 0.2) col = face === 'up' ? shift(hi, 0.08) : lite;   // a lit strand
          if (tip && inTip && col !== line && yy >= sy + L - 2 && u < 0.4) col = tip;
          p.px(X, Y, col);
        }
      }
    }
    if (isSide(face) && o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(hi, 0.1));
  };
}

// a fuzzy fringe for a cut-out plane: two staggered rows of pointed tufts hanging from the top
// edge (the root) — a shorter, darker back row and a longer front row with lit (or coloured) tips.
// o: hi, lo, line, tip, tw (tuft width), lean, jit, fat, pow, seed, short (front-row min length 0..1)
export function fringe(c, o = {}) {
  const hi = o.hi || shift(c, 0.2), lo = o.lo || shift(c, -0.28), line = o.line || shift(lo, -0.3);
  return (p, w, h) => {
    const tw = o.tw || 4, n = Math.max(1, Math.round(w / tw)), seed = o.seed || 5, st = w / n;
    for (const front of [0, 1]) for (let i = -1; i <= n; i++) {
      const cx = (i + (front ? 0.5 : 0)) * st + (h2(i, front, seed) - 0.5) * st * 0.4;
      const L = h * (front ? (o.short ?? 0.6) + (1 - (o.short ?? 0.6)) * h2(i, 7, seed) : 0.4 + 0.35 * h2(i, 9, seed));
      const lean = (o.lean ?? 0) + (h2(i, 4, seed) - 0.5) * (o.jit ?? 0.5), half0 = st * (front ? 0.6 : 0.68) * (o.fat || 1);
      for (let y = 0; y < Math.ceil(L); y++) {
        const v = y / L, half = half0 * (1 - v) ** (o.pow || 0.9), xc = cx + lean * y;
        for (let x = Math.floor(xc - half - 1); x <= Math.ceil(xc + half + 1); x++) {
          if (x < 0 || x >= w) continue;
          const u = (x + 0.5 - xc) / Math.max(0.5, half); if (Math.abs(u) > 1) continue;
          let col = front ? ramp([c, c, hi], v, x, y) : ramp([lo, c], v, x, y);
          if (u > 0.4) col = shift(col, -0.14); else if (u < -0.35) col = shift(col, 0.08);
          if (front && o.tip && v > 0.7) col = o.tip;
          p.px(x, y, col);
        }
      }
    }
    edgeLine(p, line, { skipTop: true });
  };
}

// a fuzzy halo: the jagged rim of a rounded shape in fur, for a cut-out plane set inside a head or
// an ear so that only the tufts poking out past the silhouette show. o: n (tufts), depth, sq
// (superellipse power), inner (0..1, the hidden middle), tip, droop (tufts lean down), seed
export function halo(c, o = {}) {
  const hi = o.hi || shift(c, 0.2), lo = o.lo || shift(c, -0.28), line = o.line || shift(lo, -0.3);
  return (p, w, h) => {
    const n = o.n || 22, dp = o.depth ?? 0.14, e = o.sq || 2.4, inner = o.inner ?? 0.7, seed = o.seed || 9;
    const cx = w / 2, cy = h / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + 0.5 - cx) / (w / 2), v = (y + 0.5 - cy) / (h / 2);
      const r = (Math.abs(u) ** e + Math.abs(v) ** e) ** (1 / e);
      if (r < inner * 0.98) continue;
      const a = Math.atan2(v, u) / (2 * Math.PI) + 1 + (o.droop ?? 0.02) * Math.sign(u) * (1 - r) * 4;
      const q = a * n, k = Math.floor(q), f = q - k, tri = 1 - Math.abs(f - 0.5) * 2;
      const R = 1 - dp * (1 - tri ** 0.8) - dp * 0.45 * h2(k % n, 1, seed);
      if (r > R) continue;
      const t = (r - inner) / Math.max(1e-3, R - inner);
      let col = ramp([lo, c, hi], 0.35 + t * 0.65, x, y);
      if (v > 0.25) col = shift(col, -0.1);
      if (o.tip && t > 0.82) col = o.tip;
      p.px(x, y, col);
    }
    edgeLine(p, line, { sides: false });
  };
}

// ---------------------------------------------------------------- metal & cloth
export const GOLD = { hi: '#ffe48a', base: '#f2b230', lo: '#b8740f', deep: '#6e4008', spec: '#fffbe6' };
// polished gold: bright top, banded sides with a hot specular streak, dark seam
export function gold(o = {}) {
  const G = { ...GOLD, ...o };
  return (p, w, h, face) => {
    fill(p, w, h, (x, y) => (face === 'up' ? G.hi : face === 'down' ? G.lo : ramp([G.hi, G.base, G.base, G.lo], h > 1 ? y / (h - 1) : 0.5, x, y)));
    if (isSide(face) && h > 2) { for (let x = 0; x < w; x++) p.px(x, h - 1, G.deep); if (w > 3) for (let y = 1; y < h - 1; y++) p.px(1, y, y < h / 2 ? G.spec : G.hi); }
    if (face === 'up' && w > 2 && h > 2) p.px(1, 1, G.spec);
  };
}
// a flat link (faces outward: an oval ring around a dark eye) and an edge-on link (a bar)
const linkFlat = (G) => (p, w, h, face) => {
  if (face !== 'south' && face !== 'north') return gold(G)(p, w, h, face);
  fill(p, w, h, (x, y) => (y === 0 ? G.hi : y === h - 1 ? G.lo : G.base));
  if (w > 3 && h > 2) for (let x = 1; x < w - 1; x++) for (let y = 1; y < h - 1; y++) p.px(x, y, G.deep);
  p.px(0, 0, G.lo); p.px(w - 1, 0, G.lo); p.px(0, h - 1, G.deep); p.px(w - 1, h - 1, G.deep); if (w > 2) p.px(1, 0, G.spec);
};
const linkEdge = (G) => (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? G.hi : y === 0 ? G.spec : y === h - 1 ? G.lo : G.base)); };
// a chain of alternating links along a path of points [[x, y, z], …] in model units. Returns cubes.
// o: len (link length), w (link width), t (thickness), step (spacing), gold (palette), outline
export function chain(pts, o = {}) {
  const L = o.len || 1.4, W = o.w || 0.9, Th = o.t || 0.4, step = o.step || L * 0.8, G = { ...GOLD, ...(o.gold || {}) };
  const segs = []; let tot = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); segs.push({ a, b, d, s0: tot }); tot += d; }
  const out = [], flat = linkFlat(G), edge = linkEdge(G);
  let n = 0;
  for (let s = step * 0.5; s < tot; s += step, n++) {
    const sg = segs.find((g) => s <= g.s0 + g.d) || segs[segs.length - 1], k = (s - sg.s0) / sg.d;
    const c = [0, 1, 2].map((i) => sg.a[i] + (sg.b[i] - sg.a[i]) * k), t = [0, 1, 2].map((i) => (sg.b[i] - sg.a[i]) / sg.d);
    const rz = (Math.asin(Math.max(-1, Math.min(1, t[1]))) * 180) / Math.PI, ry = (Math.atan2(-t[2], t[0]) * 180) / Math.PI;
    const isFlat = n % 2 === 0, s3 = isFlat ? [L, W, Th] : [L, Th * 0.9, W * 0.8];
    out.push({ o: [c[0] - s3[0] / 2, c[1] - s3[1] / 2, c[2] - s3[2] / 2], s: s3, tex: isFlat ? flat : edge, pivot: c, rot: [o.rx || 0, ry, rz], outline: o.outline ?? true });
  }
  return out;
}
// ribbed knit (cuffs, hems, collars): vertical ribs in two tones, optional stripes (varsity)
export function rib(a, b, o = {}) {
  return (p, w, h, face, cube) => {
    const ox = cube && isSide(face) ? wrapX(face, cube) : 0;
    fill(p, w, h, (x, y) => {
      const t = h > 1 ? y / (h - 1) : 0.5, X = x + ox;
      let c = o.stripes ? o.stripes[Math.min(o.stripes.length - 1, Math.floor(t * o.stripes.length))] : a;
      if (face === 'up' || face === 'down') return face === 'up' ? shift(c, 0.12) : shift(c, -0.3);
      c = X % 2 ? shift(c, -0.16) : c;
      if (y === 0) c = shift(c, 0.14); else if (y === h - 1) c = shift(c, -0.3);
      return c;
    });
    if (b && !o.stripes) for (let y = 0; y < h; y++) for (let x = (ox + 1) % 2; x < w; x += 2) if ((y + x) % 3 === 0) p.px(x, y, b);
  };
}

// ---------------------------------------------------------------- shutter shades
// shutter shades seen from the front, painted on a cut-out plane: a heavy brow bar, two
// lenses with rounded outer corners, each filled with horizontal slats. gap(x, y, lens, row)
// colours the gaps between slats (return null for the default smoky dark).
export function shutter(o) {
  const F = o.frame, Fhi = o.hi || shift(F, 0.3), Flo = o.lo || shift(F, -0.3), G = o.gap || '#22121e', Glo = o.gapLo || shift(G, 0.12);
  const R = o.round ?? 4, top = o.bar ?? 2, br = o.bridge ?? 1.5;
  return (p, w, h) => {
    const mid = (w - 1) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (y < top) { p.px(x, y, y === 0 ? Fhi : F); continue; }                         // the brow bar
      const dm = Math.abs(x - mid);
      if (dm <= br) { if (y < top + 2) p.px(x, y, y === top + 1 ? Flo : F); continue; }   // bridge; the nose gap below it
      const lens = x > mid ? 1 : 0, lx = lens ? w - 1 - x : x, inner = Math.floor(dm - br - 0.5), cy = h - 1 - y;
      if (lx + cy < R - 1) continue;                                                      // rounded outer-bottom corner
      if (inner + cy < 1) continue;                                                       // softened inner-bottom corner
      if (lx === 0 || inner <= 0 || cy === 0 || lx + cy < R) { p.px(x, y, cy === 0 ? Flo : F); continue; }
      const row = y - top;
      if (row % 2 === 1) p.px(x, y, row === 1 ? Fhi : F);                                // a slat
      else { const g = o.gapFn ? o.gapFn(lx, y, lens, row, inner) : null; p.px(x, y, g || (row === 0 ? Glo : G)); }
    }
  };
}

// ---------------------------------------------------------------- motion helpers
// keep feet planted while the hips rise or sink by dy units: the legs shift and stretch
export function plant(P, dy, legs, hip) { for (const s of legs) { P.pos(s, 0, dy, 0); P.scl(s, 1, Math.max(0.35, (hip + dy) / hip), 1); } }
export const cyc = (t, fps, n) => Math.floor(t * fps) % n;

// ---------------------------------------------------------------- particles
const NOTE = (c) => (p, w, h) => {
  const lo = shift(c, -0.35), hi = shift(c, 0.45);
  p.rect(0, h - 4, 3, 3, c); p.px(0, h - 4, 0); p.px(2, h - 2, lo); p.px(0, h - 2, lo);
  p.rect(w - 3, h - 5, 3, 3, c); p.px(w - 3, h - 5, 0); p.px(w - 1, h - 3, lo);
  p.vl(2, 1, h - 4, c); p.vl(w - 1, 0, h - 5, c);
  for (let x = 2; x < w; x++) { p.px(x, Math.round(1 - (x - 2) / (w - 3)), c); p.px(x, Math.round(2 - (x - 2) / (w - 3)), c); }
  p.px(1, h - 3, hi); p.px(w - 2, h - 4, hi);
};
const CONF = ['#ff3d9a', '#ffd23e', '#8a5aff', '#2ed0e8', '#ffffff', '#ff7a2e', '#7cf06a'];
defineFx('bear-confetti', {
  w: 3, h: 5, frames: CONF.map((c) => (p, w, h) => { p.rect(0, 0, w, h, c); p.vl(0, 0, h - 1, shift(c, 0.3)); p.vl(w - 1, 0, h - 1, shift(c, -0.3)); }),
  life: [1.2, 1.9], size: [0.06, 0.06], speed: [1.8, 3.6], grav: 2.6, drag: 1.9, spread: 0.9, flutter: true,
});
defineFx('bear-note', { w: 8, h: 11, frames: ['#ffd23e', '#ff4aa8', '#5ad8ff', '#b07aff'].map(NOTE), glow: true, life: [1.0, 1.5], size: [0.12, 0.15], speed: [0.7, 1.4], grav: -0.7, drag: 0.9, spread: 0.8, wob: 1.2, fade: true });
defineFx('bear-bluenote', { w: 8, h: 11, frames: ['#8ab4ff', '#c8d4ea', '#5a7ae8'].map(NOTE), glow: true, life: [1.3, 1.9], size: [0.12, 0.14], speed: [0.4, 0.8], grav: -0.45, drag: 0.8, spread: 0.6, wob: 1.6, fade: true });
// a puff of fur (paint light, tint per species)
defineFx('bear-fluff', {
  w: 7, h: 7, frames: [0, 1].map((i) => (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - 3, y - 3) + h2(x, y, i) * 1.6; if (d < 3.4) p.px(x, y, d < 1.6 ? '#f4ece6' : y > 3 ? '#b8aca4' : '#dcd2ca'); } }),
  life: [0.7, 1.2], size: [0.07, 0.1], speed: [0.8, 1.8], grav: 1.1, drag: 2.6, spread: 1, flutter: true,
});
// a sparkle in the Graduation colours
defineFx('bear-star', {
  w: 9, h: 9, frames: ['#ffe14a', '#ff6ac0', '#7ae8ff'].map((c) => (p, w, h) => { const m = 4; for (let i = 0; i < 9; i++) { const d = Math.abs(i - m); const col = d < 1 ? '#ffffff' : d < 3 ? c : shift(c, -0.2); if (d < 4) { p.px(i, m, col); p.px(m, i, col); } } p.px(m - 1, m - 1, c); p.px(m + 1, m - 1, c); p.px(m - 1, m + 1, c); p.px(m + 1, m + 1, c); }),
  glow: true, life: [0.5, 0.9], size: [0.13, 0.04], speed: [0.6, 1.6], grav: 0.4, drag: 1.4, spread: 1, spin: 3, fade: true,
});
// the auto-tune shockwave: a ring whose edge is quantised into steps, like a corrected pitch line
defineFx('bear-tune', {
  w: 48, h: 48, frames: [['#e8f0ff', '#8ab0ff'], ['#ffe0e6', '#ff5a6e']].map(([a, b]) => (p, w, h) => {
    const c = (w - 1) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ang = Math.atan2(y - c, x - c), step = Math.round(Math.sin(ang * 9) * 2.2) * 0.9, R = c - 3 + step, d = Math.hypot(x - c, y - c);
      if (d < R + 0.7 && d > R - 1.6) p.px(x, y, d > R - 0.4 ? a : b);
    }
  }),
  glow: true, life: [0.75, 0.9], size: [0.25, 2.6], speed: [0, 0], grav: 0, fade: true,
});
// crystal shards: long bright diamonds that spin and glint
defineFx('bear-crystal', {
  w: 5, h: 10, frames: [['#ffffff', '#cfe8ff', '#7aa8d8'], ['#ffffff', '#ffd0dc', '#d87a9a'], ['#ffffff', '#e8e0ff', '#9a8ad8']].map(([a, b, c]) => (p, w, h) => {
    poly(p, [[2.5, 0], [5, 4], [2.5, 10], [0, 4]], b); poly(p, [[2.5, 0], [2.5, 10], [0, 4]], a); p.px(3, 6, c); p.px(3, 7, c); p.px(4, 4, c); p.px(2, 1, '#ffffff');
  }),
  glow: true, life: [0.6, 1.1], size: [0.1, 0.07], speed: [3, 6.5], grav: 7, drag: 0.6, spread: 0.7, spin: 10,
});
// strips of red tape torn loose
defineFx('bear-tape', {
  w: 3, h: 9, frames: [0, 1].map((i) => (p, w, h) => { p.rect(0, 0, w, h, '#e0202a'); p.vl(0, 0, h - 1, '#ff6a6a'); p.vl(w - 1, 0, h - 1, '#8a0e1a'); p.px(1, i ? 2 : 6, '#ff9a9a'); for (let x = 0; x < w; x++) if ((x + i) % 2) p.px(x, h - 1, 0); }),
  life: [1.0, 1.6], size: [0.1, 0.1], speed: [1.8, 3.4], grav: 2.2, drag: 1.7, spread: 0.9, flutter: true,
});
// phoenix feathers: flame-coloured plumes that drift up
defineFx('bear-phoenix', {
  w: 6, h: 12, frames: [0, 1].map((i) => (p, w, h) => {
    for (let y = 0; y < h; y++) { const hw = Math.sin(((y + 0.5) / h) * Math.PI) * 2.6 * (y < 3 ? 0.7 : 1); for (let x = -3; x <= 3; x++) { if (Math.abs(x + 0.5 - (i ? 0.4 : -0.2)) > hw) continue; p.px(x + 3, y, y < 3 ? '#fff0a0' : y < 6 ? '#ffc040' : y < 9 ? '#ff7a2a' : '#e0302a'); } }
    for (let y = 2; y < h; y++) p.px(3, y, y < 7 ? '#ffffff' : '#ffd060');
  }),
  glow: true, life: [1.0, 1.6], size: [0.13, 0.08], speed: [1.0, 2.2], grav: -0.6, drag: 1.7, spread: 1, flutter: true,
});
// a guard ring: a hexagon of light, pink and gold
defineFx('bear-aegis', {
  w: 48, h: 48, frames: [['#fff4fa', '#ff6ab4'], ['#fffbe0', '#ffc040']].map(([a, b]) => (p, w, h) => {
    const c = (w - 1) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ang = Math.atan2(y - c, x - c), sect = Math.PI / 3, k = Math.cos(((ang % sect) + sect) % sect - sect / 2), d = Math.hypot(x - c, y - c) * k, R = (c - 2) * Math.cos(sect / 2);
      if (d < R + 0.6 && d > R - 2.2) p.px(x, y, d > R - 0.6 ? a : b);
    }
  }),
  glow: true, life: [0.7, 0.85], size: [0.3, 2.4], speed: [0, 0], grav: 0, fade: true,
});
// a glowing heart (red, pulses out)
defineFx('bear-heart', {
  w: 11, h: 10, paint: (p, w, h) => {
    const m = (w - 1) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x - m) / (w / 2), v = (y - h * 0.36) / (h / 2), f = (u * u + v * v - 0.62) ** 3 - u * u * v * v * v * 1.5; if (f < 0) p.px(x, y, x < m - 1 && y < h / 2 ? '#ffb0b8' : f > -0.004 ? '#c8102a' : '#ff3048'); }
  },
  glow: true, life: [0.8, 1.2], size: [0.08, 0.16], speed: [0.5, 1.1], grav: -0.7, drag: 1.1, spread: 0.6, wob: 1, fade: true,
});
export { mix, shift, ramp, poly, h2 };
