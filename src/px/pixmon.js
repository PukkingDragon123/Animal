// Hand-pixel Tokonmon. Each creature is drawn as real pixel art, frame by frame,
// from a small set of painted parts — the way a pixel artist builds a sprite:
//   · every part is filled and cel-shaded in 4 hand-picked, hue-shifted tones
//     (light from the upper left) — round parts shade like spheres, any other
//     shape is "inflated" from its silhouette so flames, fins and leaves get volume,
//   · a parts drawn in front of another gets a contour line where it overlaps,
//   · the silhouette gets a selective outline (dark at the bottom right, softer
//     on the lit side), lone pixels in the shading are cleaned up,
//   · eyes, mouths, highlights and markings are hand-placed pixel stamps.
// Animation is pose-driven (clip → bob / squash / lean / eyes / mouth / limbs)
// with whole-pixel motion only, so nothing ever smears. Views: a 3/4 front view
// and a back view, mirrored for the other side.
import { newSurf, mix } from './paint.js';
import { P as pack } from './surface.js';

export const FPS = 24;
export const CLIPS = { idle: 48, walk: 16, run: 12, attack: 14, breath: 24, dash: 16, throw: 18, cast: 16, hurt: 10, faint: 24, buff: 24, happy: 20, sleep: 48, eat: 40 };
const LOOP = { idle: true, walk: true, run: true, happy: true, sleep: true, buff: true };
export const isLoop = (c) => !!LOOP[c];

const LX = -0.5, LY = -0.68, LZ = 0.54, LN = Math.hypot(LX, LY, LZ);
const L = [LX / LN, LY / LN, LZ / LN];
const TH = [0.72, 0.4, 0.1];          // lambert thresholds between the 4 tones
// materials every creature can use for effects
export const COMMON = {
  fire: { ramp: ['#fff6c8', '#ffcf3a', '#ff7a22', '#e03a1e'], line: '#6e1414', lineLit: '#a8281a', th: [0.78, 0.48, 0.16] },
  water: { ramp: ['#e8fbff', '#8ee0ff', '#3fa8ec', '#2a64c4'], line: '#16285e', lineLit: '#2a4a9a', th: [0.78, 0.48, 0.16] },
  leafx: { ramp: ['#e8ff9a', '#9ee05a', '#4aa83e', '#2a6a36'], line: '#14321e' },
  steam: { ramp: ['#ffffff', '#eef0f6', '#c8ccdc', '#9aa0b8'], line: '#6a6e88', lineLit: '#9aa0b8' },
  heart: { ramp: ['#ffd0e0', '#ff6a9a', '#e0386e', '#a8244e'], line: '#5a1030' },
  spark: { ramp: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], line: '#00000000', outline: false, contour: false },
  ink: { ramp: ['#2a1a2a', '#2a1a2a', '#2a1a2a', '#2a1a2a'], line: '#2a1a2a', outline: false, contour: false },
  zz: { ramp: ['#ffffff', '#e8f0ff', '#b8c8f0', '#8aa0d8'], line: '#2a3060' },
};

export class Pix {
  constructor(w, h, pal) {
    this.w = w; this.h = h; const n = w * h;
    this.mat = new Int16Array(n).fill(-1); this.grp = new Int16Array(n).fill(-1); this.ord = new Int32Array(n).fill(-1);
    this.lit = new Float32Array(n); this.tone = new Int8Array(n); this.dec = new Uint32Array(n);
    this.mats = []; this.mi = new Map(); this.gi = new Map(); this.order = 0; this.posts = [];
    for (const k in pal) this.mi.set(k, this.mats.push(Object.assign({ name: k }, pal[k])) - 1);
    for (const k in COMMON) if (!this.mi.has(k)) this.mi.set(k, this.mats.push(Object.assign({ name: k }, COMMON[k])) - 1);
  }
  // single pixels of colour in empty space too (sparks, speed lines); material decides the outline
  dot(x, y, c, mat = 'spark') {
    x = Math.round(x); y = Math.round(y); if (!this.inb(x, y)) return this;
    const k = y * this.w + x;
    if (this.mat[k] < 0) { this.mat[k] = this.m(mat); this.grp[k] = this.g('fx-' + mat); this.ord[k] = ++this.order; this.lit[k] = 0.5; }
    this.dec[k] = pack(c); return this;
  }
  ink(x0, y0, x1, y1, c, mat = 'spark') { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let k = 0; k <= n; k++) this.dot(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c, mat); return this; }
  m(name) { const i = this.mi.get(name); if (i === undefined) throw new Error('pixmon: no material ' + name); return i; }
  g(name) { if (name == null) return 10000 + this.order; let i = this.gi.get(name); if (i === undefined) { i = this.gi.size; this.gi.set(name, i); } return i; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }

  // generic fill: inside(x, y) over a bounding box, normals from `nrm(x, y)` (→ [nx, ny, nz]) or inflated from the mask
  shape(x0, y0, x1, y1, inside, mat, o = {}, nrm = null) {
    x0 = Math.max(0, Math.floor(x0) - 1); y0 = Math.max(0, Math.floor(y0) - 1); x1 = Math.min(this.w - 1, Math.ceil(x1) + 1); y1 = Math.min(this.h - 1, Math.ceil(y1) + 1);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1; if (bw <= 0 || bh <= 0) return this;
    const mask = new Uint8Array(bw * bh);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inside(x + 0.5, y + 0.5)) {
      const i = y * this.w + x;
      if (o.paint && this.mat[i] < 0) continue;              // paint only over what's there
      if (o.under && this.mat[i] >= 0) continue;             // tuck behind what's there
      if (o.clip && !(this.mat[i] >= 0 && this.grp[i] === this.g(o.clip))) continue;
      mask[(y - y0) * bw + (x - x0)] = 1;
    }
    const mi = this.m(mat), M = this.mats[mi], gi = this.g(o.grp), ord = o.z ?? ++this.order, bias = o.lit || 0;
    let H = null, D = null;
    const R = o.round || M.round || 4;
    if ((!nrm && !o.flat && !M.flat && !o.paint) || o.glow) {   // inflate: a rounded dome over the silhouette
      H = new Float32Array(bw * bh); D = new Float32Array(bw * bh);
      for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
        if (!mask[j * bw + i]) continue;
        let d = R; const Ri = Math.ceil(R);
        for (let dy = -Ri; dy <= Ri; dy++) for (let dx = -Ri; dx <= Ri; dx++) {
          const X = i + dx, Y = j + dy; if (X >= 0 && Y >= 0 && X < bw && Y < bh && mask[Y * bw + X]) continue;
          const dd = Math.hypot(dx, dy) - 0.5; if (dd < d) d = dd;
        }
        const t = 1 - Math.max(0, Math.min(R, d)) / R; H[j * bw + i] = R * Math.sqrt(Math.max(0, 1 - t * t)); D[j * bw + i] = d;
      }
    }
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      if (!mask[j * bw + i]) continue;
      const x = x0 + i, y = y0 + j, k = y * this.w + x;
      let lit;
      if (o.glow) lit = Math.min(1, Math.max(0, (D[j * bw + i] - 0.5) / Math.max(0.5, R - 0.5)));   // glowing: hot core, cooler rim
      else if (o.paint && !o.relight) lit = this.lit[k];
      else if (o.flat || M.flat) lit = o.light ?? 0.55;
      else {
        let n;
        if (nrm) n = nrm(x + 0.5, y + 0.5);
        else { const h = (a, b) => (a >= 0 && b >= 0 && a < bw && b < bh ? H[b * bw + a] : 0); n = [-(h(i + 1, j) - h(i - 1, j)) / 2, -(h(i, j + 1) - h(i, j - 1)) / 2, 1]; }
        const nl = Math.hypot(n[0], n[1], n[2]) || 1;
        lit = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / nl;
      }
      if (o.heat != null) lit = typeof o.heat === 'function' ? o.heat(x + 0.5, y + 0.5) : o.heat;
      this.mat[k] = mi; this.grp[k] = gi; this.ord[k] = ord; this.lit[k] = lit + bias; this.dec[k] = 0;
    }
    return this;
  }
  // ellipse (optionally rotated, radians) shaded as a sphere/ellipsoid
  ell(cx, cy, rx, ry, mat, o = {}) {
    const c = Math.cos(o.rot || 0), s = Math.sin(o.rot || 0), r = Math.max(rx, ry), rz = o.rz || Math.min(rx, ry);
    const loc = (x, y) => { const dx = x - cx, dy = y - cy; return [(dx * c + dy * s) / rx, (-dx * s + dy * c) / ry]; };
    return this.shape(cx - r, cy - r, cx + r, cy + r, (x, y) => { const [u, v] = loc(x, y); return u * u + v * v <= 1; }, mat, o,
      o.dome ? null : (x, y) => { const [u, v] = loc(x, y), w = Math.sqrt(Math.max(0, 1 - u * u - v * v)); const nx = u / rx, ny = v / ry, nz = w / rz; return [nx * c - ny * s, nx * s + ny * c, nz]; });
  }
  circ(cx, cy, r, mat, o) { return this.ell(cx, cy, r, r, mat, o); }
  // polygon, inflated
  poly(pts, mat, o = {}) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return this.shape(x0, y0, x1, y1, (x, y) => inPoly(pts, x, y), mat, o);
  }
  // tapered capsule chain through [[x, y, r], …], inflated
  tube(pts, mat, o = {}) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y, r] of pts) { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); }
    const inside = (x, y) => {
      for (let k = 0; k < pts.length - 1; k++) {
        const [ax, ay, ar] = pts[k], [bx, by, br] = pts[k + 1], dx = bx - ax, dy = by - ay, ll = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / ll)), r = ar + (br - ar) * t;
        if (Math.hypot(x - ax - dx * t, y - ay - dy * t) <= r) return true;
      }
      return pts.length === 1 && Math.hypot(x - pts[0][0], y - pts[0][1]) <= pts[0][2];
    };
    return this.shape(x0, y0, x1, y1, inside, mat, o);
  }
  // a flame tongue: base at (x, y), leaning by (dx, -h) to the tip, width w; nested heat layers
  flame(x, y, h, w, lean, mat, o = {}) {
    const tip = [x + lean, y - h], pts = [];
    for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI; pts.push([x - Math.cos(a) * w, y + Math.sin(a) * w * 0.55]); }
    const curve = (s) => { const q = []; for (let k = 1; k <= 6; k++) { const t = k / 7; q.push([x + s * w * (1 - t) ** 1.4 + lean * t * t, y - h * t]); } return q; };
    const poly = [...pts, ...curve(1), tip, ...curve(-1).reverse()];
    return this.poly(poly, mat, Object.assign({ grp: o.grp, heat: o.heat }, o));
  }
  // hand-placed pixels: rows of characters, map char → '#hex' (or a material name to shade as that material's tone)
  stamp(x, y, rows, map, o = {}) {
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
      const ch = rows[j][o.flip ? rows[j].length - 1 - i : i], c = map[ch]; if (!c) continue;
      const X = x + i, Y = y + j; if (!this.inb(X, Y)) continue;
      const k = Y * this.w + X;
      if (o.on && (this.mat[k] < 0)) continue;
      if (o.onMat && this.mat[k] !== this.m(o.onMat)) continue;
      if (this.mat[k] < 0) { this.mat[k] = this.m(o.mat || this.mats[0].name); this.grp[k] = this.g(o.grp || 'stamp'); this.ord[k] = ++this.order; this.lit[k] = 0.5; }
      this.dec[k] = pack(c);
    }
    return this;
  }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (this.inb(x, y) && this.mat[y * this.w + x] >= 0) this.dec[y * this.w + x] = pack(c); return this; }
  line(x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let k = 0; k <= n; k++) this.px(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c); return this; }
  post(fn) { this.posts.push(fn); return this; }

  // shade, clean, contour, outline → Surf
  finish() {
    const W = this.w, Hh = this.h, n = W * Hh, mat = this.mat, M = this.mats, tone = this.tone;
    for (let k = 0; k < n; k++) {
      if (mat[k] < 0) continue;
      const m = M[mat[k]], th = m.th || TH, l = this.lit[k];
      tone[k] = m.gloss && l > (m.spec ?? 0.94) ? -1 : l > th[0] ? 0 : l > th[1] ? 1 : l > th[2] ? 2 : 3;
    }
    // lone pixels in the shading join their neighbours
    for (let pass = 0; pass < 2; pass++) for (let y = 1; y < Hh - 1; y++) for (let x = 1; x < W - 1; x++) {
      const k = y * W + x; if (mat[k] < 0 || this.dec[k]) continue;
      const t = tone[k], nb = [k - 1, k + 1, k - W, k + W].filter((q) => mat[q] === mat[k] && this.grp[q] === this.grp[k]);
      if (nb.length < 3 || nb.some((q) => tone[q] === t)) continue;
      const cnt = new Map(); for (const q of nb) cnt.set(tone[q], (cnt.get(tone[q]) || 0) + 1);
      let best = t, bc = 0; for (const [tt, c] of cnt) if (c > bc) { best = tt; bc = c; }
      tone[k] = best;
    }
    const out = new Uint32Array(n);
    const col = (m, t) => pack(t < 0 ? (m.specC || '#ffffff') : m.ramp[Math.min(t, m.ramp.length - 1)]);
    for (let k = 0; k < n; k++) if (mat[k] >= 0) out[k] = col(M[mat[k]], tone[k]);
    // contour lines where a part in front overlaps a different part behind it
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x; if (mat[k] < 0) continue;
      for (const q of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < Hh - 1 ? k + W : -1]) {
        if (q < 0 || mat[q] < 0 || this.ord[q] <= this.ord[k] || this.grp[q] === this.grp[k]) continue;
        const F = M[mat[q]], B = M[mat[k]]; if (F.contour === false || B.nocontour) continue;
        out[k] = pack(F.inner || mix(F.line, B.ramp[3], 0.35)); break;
      }
    }
    for (let k = 0; k < n; k++) if (this.dec[k]) out[k] = this.dec[k];
    // selective outline around the silhouette
    const o2 = new Uint32Array(out);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x; if (mat[k] >= 0) continue;
      const R = x < W - 1 ? mat[k + 1] : -1, D = y < Hh - 1 ? mat[k + W] : -1, Lf = x > 0 ? mat[k - 1] : -1, U = y > 0 ? mat[k - W] : -1;
      const nb = U >= 0 ? U : Lf >= 0 ? Lf : R >= 0 ? R : D;
      if (nb < 0) continue;
      const m = M[nb]; if (m.outline === false) continue;
      const litSide = (R >= 0 || D >= 0) && U < 0 && Lf < 0;
      o2[k] = pack(litSide ? (m.lineLit || mix(m.line, m.ramp[2], 0.42)) : m.line);
    }
    const s = newSurf(W, Hh); s.data.set(o2);
    for (const fn of this.posts) fn(s, this);
    s.touch && s.touch();
    return s;
  }
}
function inPoly(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ------------------------------------------------------------------ motion: what every clip does, frame by frame
// m: { clip, i, n, t, view, bob, sq, lean, dx, eyes, mouth, arm, fx: Set, ph, k }
export function motion(clip, i, n, o = {}) {
  const t = n > 1 ? i / n : 0, S = Math.sin, TAU = Math.PI * 2, R = Math.round;
  const m = { clip, i, n, t, view: o.view || 'front', bob: 0, sq: 0, lean: 0, dx: 0, eyes: 'open', mouth: 0, arm: 0, fx: new Set(o.show || []), ph: i, k: 0, step: 0, tilt: 0 };
  switch (clip) {
    case 'idle': m.sq = R(S(t * TAU) * 1); m.bob = m.sq > 0 ? 1 : 0; if (t > 0.72 && t < 0.78) m.eyes = 'closed'; break;
    case 'walk': { const s = S(t * TAU * 2); m.bob = -R(Math.abs(S(t * TAU * 2)) * 2); m.step = s > 0.2 ? 1 : s < -0.2 ? -1 : 0; m.sq = m.bob === 0 ? 1 : 0; m.lean = 0; break; }
    case 'run': { const s = S(t * TAU * 2); m.bob = -R(Math.abs(s) * 3); m.step = s > 0 ? 1 : -1; m.lean = 1; m.sq = m.bob === 0 ? 1 : -1; break; }
    case 'attack': {
      if (t < 0.3) { m.lean = -1; m.dx = 1; m.sq = 1; m.eyes = 'fierce'; }
      else if (t < 0.6) { m.lean = 2; m.dx = -4; m.sq = -1; m.mouth = 1; m.eyes = 'fierce'; m.fx.add('swipe'); }
      else { m.lean = 0; m.dx = -1; m.eyes = 'fierce'; }
      break;
    }
    case 'breath': {
      if (t < 0.25) { m.lean = -1; m.sq = -1; m.bob = -1; m.eyes = 'closed'; m.mouth = 0; }
      else if (t < 0.85) { m.lean = 1; m.mouth = 2; m.eyes = 'fierce'; m.fx.add('breath'); m.k = Math.min(1, (t - 0.25) / 0.2); m.dx = 1; }
      else { m.lean = 0; m.mouth = 1; }
      break;
    }
    case 'dash': m.lean = 2; m.sq = 1; m.dx = R(-2 - S(t * Math.PI) * 3); m.eyes = 'fierce'; m.fx.add('dash'); break;
    case 'throw': {
      if (t < 0.4) { m.arm = 1; m.lean = -1; m.bob = -1; m.eyes = 'fierce'; }
      else if (t < 0.6) { m.arm = 2; m.lean = 2; m.mouth = 1; m.fx.add('toss'); m.k = (t - 0.4) / 0.2; }
      else { m.arm = 3; m.lean = 0; m.fx.add('toss'); m.k = 1; }
      break;
    }
    case 'cast': m.arm = 1; m.eyes = t < 0.5 ? 'closed' : 'fierce'; m.bob = -1; m.fx.add('cast'); m.k = t; break;
    case 'hurt': m.eyes = 'hurt'; m.dx = t < 0.5 ? 3 : 1; m.sq = 1; m.lean = -1; m.fx.add('hit'); break;
    case 'faint': { m.eyes = 'ko'; m.mouth = 1; const f = Math.min(1, t * 1.6); m.sq = R(f * 3); m.tilt = f; m.bob = R(f * 2); if (t < 0.3) { m.eyes = 'hurt'; m.bob = -R(S(t / 0.3 * Math.PI) * 3); m.sq = 0; m.tilt = 0; } break; }
    case 'buff': m.eyes = 'fierce'; m.bob = -R(Math.abs(S(t * TAU)) * 1); m.fx.add('aura'); m.arm = 1; break;
    case 'happy': { const h = Math.abs(S(t * TAU)); m.bob = -R(h * 5); m.sq = m.bob === 0 ? 1 : -1; m.eyes = 'happy'; m.mouth = 1; m.arm = h > 0.5 ? 1 : 0; m.fx.add('sparkle'); break; }
    case 'sleep': m.eyes = 'sleep'; m.sq = R(S(t * TAU) + 0.5) > 0 ? 1 : 0; m.fx.add('zz'); m.bob = 1; break;
    case 'eat': {
      m.arm = t < 0.15 ? 0 : 4; m.eyes = t > 0.6 ? 'happy' : 'closed';
      m.mouth = t > 0.15 && t < 0.6 ? (i % 4 < 2 ? 1 : 0) : 0; m.bob = m.mouth ? 1 : 0;
      if (t > 0.55) { m.fx.add('steam'); m.fx.add('blush'); m.k = (t - 0.55) / 0.45; }
      break;
    }
  }
  if (o.expr === 'hurt' && m.eyes === 'open') m.eyes = 'hurt';
  if (o.expr === 'fierce' && (m.eyes === 'open')) m.eyes = 'fierce';
  if (o.bonded) m.fx.add('bond');
  return m;
}

// ------------------------------------------------------------------ frames for the game
// facing from yaw (0 = toward the viewer, 90 = screen right, 180 = away)
export function facing(yaw = 0) {
  const y = ((yaw % 360) + 540) % 360 - 180;
  const back = Math.abs(y) > 112;
  const right = back ? y > 0 && y < 180 : y > 20;
  return { view: back ? 'back' : 'front', flip: right };
}
export function renderFrame(d, o = {}) {
  const clip = CLIPS[o.clip] ? o.clip : 'idle', n = CLIPS[clip], i = ((o.frame | 0) % n + n) % n;
  const f = facing(o.yaw), m = motion(clip, i, n, { view: f.view, expr: o.expr, show: o.show, bonded: o.bonded });
  const P = new Pix(d.w, d.h, d.pal);
  d.draw(P, m);
  let s = P.finish();
  if (f.flip) { const t = newSurf(s.w, s.h); for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) t.data[y * s.w + x] = s.data[y * s.w + s.w - 1 - x]; s = t; }
  if ((o.scale || 0.6) < 0.45) {   // icon: a crisp head-and-shoulders crop (pixel art never shrinks well)
    let x0 = s.w, x1 = -1, y0 = s.h; for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.data[y * s.w + x] >>> 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); }
    const IW = 28, IH = 26, cx = x1 >= 0 ? Math.round((x0 + x1) / 2) : s.w >> 1, t = newSurf(IW, IH);
    for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) { const X = cx - (IW >> 1) + x, Y = y0 + y; if (X >= 0 && Y >= 0 && X < s.w && Y < s.h) t.data[y * IW + x] = s.data[Y * s.w + X]; }
    t.touch && t.touch(); t.ox = (IW >> 1) - d.anchor[0] * o.scale; t.oy = IH - d.anchor[1] * o.scale;
    return t;
  }
  const k = (o.scale || 0.6) >= 0.9 ? 2 : 1;
  if (k > 1) { const t = newSurf(s.w * k, s.h * k); for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) t.data[y * t.w + x] = s.data[((y / k) | 0) * s.w + ((x / k) | 0)]; s = t; }
  s.touch && s.touch();
  const sc = o.scale || 0.6, ax = f.flip ? d.w - d.anchor[0] : d.anchor[0];
  s.ox = ax * k - d.anchor[0] * sc; s.oy = d.anchor[1] * k - d.anchor[1] * sc;
  return s;
}

// ------------------------------------------------------------------ shared effects
const STAR = ['..w..', '.wWw.', 'wWWWw', '.wWw.', '..w..'], STAR3 = ['.w.', 'wWw', '.w.'];
const ZZ = ['zzzz', '..z.', '.z..', 'zzzz'], ZS = ['zzz', '.z.', 'zzz'];
const HEART = ['.hh.hh.', 'hHHhhhh', 'hHhhhhh', '.hhhhh.', '..hhh..', '...h...'];
export const FX = {
  // element breath from a mouth at (x, y) toward -x (the creature faces left)
  breath(P, x, y, m, kind = 'fire') {
    const len = 6 + m.k * 30, ph = m.ph;
    if (kind === 'fire') {
      for (let s = 0; s <= len; s += 4) { const r = 1.6 + s * 0.13 + ((ph + s) % 3 === 0 ? 0.6 : 0); P.circ(x - s - 2, y + Math.round(Math.sin(s * 0.45 + ph * 0.9)), r, 'fire', { glow: true, round: Math.max(1.5, r), grp: 'fx-fire' }); }
      for (let k = 0; k < 5; k++) { const s = ((ph * 3 + k * 7) % Math.max(4, len | 0)); P.dot(x - s - 3, y - 4 - ((k * 5 + ph) % 5), k % 2 ? '#ffcf3a' : '#fff6c8'); }
    } else if (kind === 'water') {
      for (let s = 0; s <= len; s += 3) P.circ(x - s - 2, y + Math.round(Math.sin(s * 0.6 + ph) * 1.2), 1.6 + s * 0.06, 'water', { glow: true, round: 2, grp: 'fx-water' });
      for (let k = 0; k < 6; k++) { const s = (ph * 2 + k * 9) % Math.max(4, len | 0); FX.bubble(P, x - s - 2, y - 5 + ((k * 7) % 11), 1 + (k % 2)); }
    } else {
      for (let s = 0; s <= len; s += 5) { const yy = y + Math.round(Math.sin(s * 0.3 + ph) * 3); P.ell(x - s - 3, yy, 3, 1.6, 'leafx', { rot: 0.5 + ((s + ph) % 3) * 0.4, grp: 'fx-leaf' + (s % 2) }); }
      for (let k = 0; k < 4; k++) P.stamp(x - ((ph * 3 + k * 11) % Math.max(5, len | 0)) - 4, y - 6 + ((k * 5) % 12), STAR3, { w: '#e8ffb0', W: '#ffffff' }, { mat: 'spark' });
    }
  },
  bubble(P, x, y, r) { P.circ(x, y, r + 0.6, 'water', { flat: true, light: 0.6, grp: 'fx-bub' + x + '-' + y }); P.dot(x - (r > 1 ? 1 : 0), y - (r > 1 ? 1 : 0), '#ffffff'); },
  sparkle(P, cx, cy, m, col = '#fff6a0') { const pts = [[-14, -18], [15, -12], [-17, 4], [16, 8]]; pts.forEach(([dx, dy], k) => { if ((m.ph >> 1) % 4 === k || (m.ph >> 1) % 4 === (k + 2) % 4) P.stamp(cx + dx - 2, cy + dy - 2, (m.ph + k) % 3 ? STAR3 : STAR, { w: col, W: '#ffffff' }, { mat: 'spark' }); }); },
  zz(P, x, y, m) { const t = (m.t * 2) % 1; P.stamp(x + Math.round(t * 4), y - Math.round(t * 8), ZS, { z: '#ffffff' }, { mat: 'zz', grp: 'zz1' }); const t2 = (t + 0.5) % 1; P.stamp(x + 5 + Math.round(t2 * 4), y - 7 - Math.round(t2 * 8), ZZ, { z: '#ffffff' }, { mat: 'zz', grp: 'zz2' }); },
  steam(P, x, y, m) { for (let k = 0; k < 3; k++) { const t = (m.t * 3 + k / 3) % 1; P.circ(x + (k - 1) * 6 + Math.round(Math.sin(t * 6 + k) * 1.5), y - Math.round(t * 10), 1.4 + t * 2.2, 'steam', { grp: 'fx-steam' + k, round: 2 }); } },
  hearts(P, x, y, m) { const t = (m.t * 2) % 1; P.stamp(x - 3, y - Math.round(t * 8), HEART, { h: '#ff6a9a', H: '#ffd0e0' }, { mat: 'heart', grp: 'heart' }); },
  hit(P, x, y, m) { if (m.i > 5) return; const r = 3 + m.i; for (let a = 0; a < 8; a++) { const c = Math.cos(a * Math.PI / 4), s = Math.sin(a * Math.PI / 4); P.ink(x + c * (r - 2), y + s * (r - 2), x + c * r, y + s * r, a % 2 ? '#ffffff' : '#fff0a0'); } },
  swipe(P, x, y) { for (let k = 0; k < 9; k++) { const a = -0.9 + k * 0.22; P.dot(x - Math.cos(a) * 9, y + Math.sin(a) * 9, k % 3 ? '#ffffff' : '#ffe0a0'); P.dot(x - Math.cos(a) * 7, y + Math.sin(a) * 7, '#fff6d0'); } },
  aura(P, cx, cy, rx, ry, m, col = '#ffd040') {
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2 + m.ph * 0.15, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; const up = (m.ph + k * 3) % 6; P.ink(x, y - up, x, y - up - 2, k % 2 ? col : '#ffffff'); }
  },
  dash(P, x, y, m) { for (let k = 0; k < 4; k++) { const yy = y - 8 + k * 5, l = 6 + ((m.ph + k * 3) % 4) * 2; P.ink(x + 2, yy, x + 2 + l, yy, k % 2 ? '#ffffff' : '#ffe8b0'); } },
};
