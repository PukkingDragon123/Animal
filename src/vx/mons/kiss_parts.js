// Shared parts for the Kissmet line (Kissmet → Kissmera → Demonaconda | Starstrut | Spaceshell |
// Purrcussion): a goth Draco chimera — lion, eagle, snake and turtle in one — that splits into four
// masked legends. An original homage to a face-painted 70s rock band: no logos, no likenesses.
// Painters (studded black leather, chrome, greasepaint faces with star / bat / whisker marks,
// turtle scutes, snake bands, platform boots, glow flames), star geometry, the line's particles
// (greasepaint stars, stage blood, bats, silver sparks), little rig helpers, and the ultra-drip
// form (black lacquer, chrome turned gold, the white paint kept, fire burning blue).
import { defineFx } from '../fx.js';
import { blackGold } from '../model.js';
import { ramp, shift, poly, h2, feathers } from './kit.js';
import { at, band, jit } from './beetle_parts.js';
import { fill, isSide, edgeLine, sh, fur, halo } from './bear_parts.js';
import { eyeRig } from './eyes.js';

export { B, both, flipC, flipB, at, band, jit, pixStates, legs, arm, arms, emote, darts, walkCycle, sharedClips, onBack, tipP, chitin, satin, locks, E, seg, bump, wob, wave, TAU } from './beetle_parts.js';
export { fur, fringe, halo, chain, fill, isSide, wrapX, edgeLine, sh } from './bear_parts.js';
export { ramp, shift, poly, h2, feathers, blackGold };

// ---------------------------------------------------------------- palette
export const K = {
  ink: '#120c16',
  leather: ['#5a5468', '#2e2a38', '#1c1924', '#0e0c12'],
  silver: ['#ffffff', '#dfe3ee', '#a4aabc', '#5e6478'],
  white: '#f7f5fa', whiteLo: '#d9d5e6', whiteLine: '#a8a2bc',
  paint: '#0c0a10',
  blood: ['#ff6a6a', '#d8142e', '#8a0a1e', '#480412'],
  violet: ['#c8a0ff', '#8a4aff', '#5220b8', '#2a0e62'],
  gold: ['#fff6b0', '#ffd23e', '#d0902a', '#8a561a'],
  tongue: ['#ff9ab0', '#f0506e', '#b82a48', '#6a1024'], mouth: '#3a0612',
};

// ---------------------------------------------------------------- stars & shapes
// a five-point star polygon (texel or model space), rot in degrees (0 = a point straight up)
export function starPts(cx, cy, R, ri = 0.42, rot = 0, flipY = true) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = ((i * 36 + rot) * Math.PI) / 180, r = i % 2 ? R * ri : R; pts.push([cx + Math.sin(a) * r, cy + (flipY ? -1 : 1) * Math.cos(a) * r]); }
  return pts;
}
export function inPoly(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
}
// a star painter for a cut-out plane or a small face: fill, a dark rim and a lit upper-left
export const starP = (c, o = {}) => (p, w, h) => {
  const pts = starPts(w / 2, h / 2 + (o.dy || 0), Math.min(w, h) / 2 - 0.2, o.ri ?? 0.44, o.rot || 0);
  fill(p, w, h, (x, y) => (inPoly(pts, x + 0.5, y + 0.5) ? c : null));
  edgeLine(p, o.line || shift(c, -0.45), { sides: true, top: true });
  if (o.hi) p.px(Math.round(w / 2 - 1), Math.round(h * 0.35), o.hi);
};

// ---------------------------------------------------------------- painters
// studded black leather: smooth bands, a soft diagonal sheen, silver studs on a grid (o.studs: spacing in texels)
export function leather(o = {}) {
  const L = o.cols || K.leather, S = o.studCol || K.silver;
  return (p, w, h, face, cube) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = band(L, face, x, y, h);
      if (face !== 'down' && Math.abs(((x + y * 0.6) % 14) - 4) < 1) c = shift(c, 0.1);
      p.px(x, y, c);
    }
    if (isSide(face) && o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(L[0], 0.08));
    if (o.studs && (isSide(face) ? o.sides !== false : face === 'up' && o.top)) {
      const s = o.studs, oy = o.studY ?? Math.floor(s / 2);
      for (let y = oy; y < h - 1; y += s) for (let x = ((y / s) & 1 ? s >> 1 : 0) + 1; x < w - 1; x += s) { p.px(x, y, S[1]); p.px(x + 1, y, S[2]); p.px(x, y + 1, S[2]); p.px(x + 1, y + 1, S[3]); p.px(x, y, S[0]); }
    }
  };
}
// polished chrome: a bright top, banded sides with a hot specular streak and a dark seam
export function chrome(o = {}) {
  const S = o.cols || K.silver;
  return (p, w, h, face) => {
    fill(p, w, h, (x, y) => (face === 'up' ? S[1] : face === 'down' ? S[3] : ramp([S[1], S[2], S[2], S[3]], h > 1 ? y / (h - 1) : 0.5, x, y)));
    if (isSide(face)) { if (w > 2) for (let y = 0; y < h; y++) p.px(Math.min(w - 1, 1 + (y >> 2)), y, S[0]); if (h > 2) for (let x = 0; x < w; x++) p.px(x, h - 1, S[3]); }
    if (face === 'up' && w > 2 && h > 2) p.px(1, 1, S[0]);
  };
}
// gold, for the gold bits that are gold in every form
export const goldP = chrome({ cols: ['#fffbe0', '#ffd84a', '#d8962a', '#7e4c14'] });
// spikes and studs: a chrome ramp darkening to the tip (tip up unless o.down)
export const spikeP = (o = {}) => (p, w, h, face) => { const S = o.cols || K.silver; fill(p, w, h, (x, y) => { const v = h > 1 ? y / (h - 1) : 0.5; return face === 'up' ? S[0] : face === 'down' ? S[3] : ramp([S[0], S[1], S[2], S[3]], o.down ? v : 1 - v * 0.7, x, y); }); if (isSide(face) && w > 1) for (let y = 0; y < h; y++) p.px(0, y, S[0]); };
// a cone-ish spike built from three stacked cubes (base, middle, tip), along +y from (x, y, z); s: base size
export function spike(x, y, z, s, len, o = {}) {
  const P = spikeP(o), out = [];
  const steps = [[1, 0.45], [0.62, 0.35], [0.3, 0.2]]; let yy = y;
  for (const [k, f] of steps) { const ss = s * k, l = len * f; out.push({ o: [x - ss / 2, yy, z - ss / 2], s: [ss, l, ss], tex: P, ...(o.x || {}) }); yy += l; }
  return out;
}
// the greasepaint face: o.base paints the face; then marks in model space, on the south face only:
//   { mask: { x, y, rx, ry, col, line } } — a white oval of paint
//   marks: [{ star: [x, y, R, ri, rot] } | { bat: [x, y, w, h, side] } | { dots: [[x, y], …] } | { lines: [[x0, y0, x1, y1], …] } | { fn(X, Y) → col | null }, col]
export function painted(base, o = {}) {
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face !== 'south') return;
    const M = o.mask, marks = o.marks || [];
    const stars = marks.filter((m) => m.star).map((m) => ({ m, pts: starPts(m.star[0], m.star[1], m.star[2], m.star[3] ?? 0.44, m.star[4] || 0, false) }));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [X0, Y] = at(face, cube, x, y), X = o.sym ? -Math.abs(X0) : X0;      // sym: one set of marks for a part and its mirrored twin
      let c = null;
      if (M) {
        const d = ((X - M.x) / M.rx) ** 2 + ((Y - M.y) / M.ry) ** 2 + (M.chin && Y < M.y ? (((M.y - Y) / M.ry) ** 2) * M.chin : 0);
        if (d < 1) c = d > 0.8 && M.line ? M.line : ramp([M.col || K.white, M.col || K.white, M.lo || K.whiteLo], Math.max(0, Math.min(1, 0.5 - (Y - M.y) / (M.ry * 2))), x, y);
      }
      for (const m of marks) {
        if (m.star) continue;
        if (m.bat) { const [bx, by, bw, bh, s] = m.bat, u = ((X - bx) * s) / bw, v = (Y - by) / bh; // a bat-wing flare rising off the outer corner of an eye
          if (u > -0.2 && u < 1 && v > -0.35 && v < 1) { const top = 1 - 0.55 * Math.abs(Math.sin(u * Math.PI * 1.5)) * (u > 0.15 ? 1 : 0) - 0.3 * u; if (v < top && v > -0.35 + 0.5 * u * u) c = m.col || K.paint; } }
        if (m.dots) for (const [dx, dy] of m.dots) if (Math.hypot(X - dx, Y - dy) < (m.r || 0.28)) c = m.col || K.paint;
        if (m.lines) for (const [x0, y0, x1, y1] of m.lines) { const L2 = (x1 - x0) ** 2 + (y1 - y0) ** 2, t = Math.max(0, Math.min(1, ((X - x0) * (x1 - x0) + (Y - y0) * (y1 - y0)) / L2)); if (Math.hypot(X - x0 - t * (x1 - x0), Y - y0 - t * (y1 - y0)) < (m.r || 0.2)) c = m.col || K.paint; }
        if (m.fn) { const v = m.fn(X, Y); if (v) c = v; }
      }
      for (const { m, pts } of stars) if (inPoly(pts, X, Y)) { const edge = !inPoly(pts, X + 0.36, Y) || !inPoly(pts, X - 0.36, Y) || !inPoly(pts, X, Y + 0.36) || !inPoly(pts, X, Y - 0.36); c = edge && m.rim ? m.rim : m.col || K.paint; }
      if (c) p.px(x, y, c);
    }
  };
}
// turtle shell: scutes on a hex grid in model space, a dark groove between them, a lit centre and
// (o.stud) a stud in the middle of each. o.cols: [hi, base, lo, groove]; o.y0 / o.rim: a rim band below Y
export function shellP(o = {}) {
  const C = o.cols || ['#5a8a74', '#36584a', '#20382e', '#0c1612'], S = o.studCols || K.silver, sz = o.size || 2.6;
  return (p, w, h, face, cube) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [X, Y, Z] = at(face, cube, x, y);
      if (face === 'down') { p.px(x, y, C[3]); continue; }
      if (o.rim != null && Y < o.rim && face !== 'up') { p.px(x, y, (x + Math.floor(y / 2)) % 4 === 0 ? shift(C[2], -0.15) : C[2]); continue; }
      // two coordinates on the shell surface: across (X) and along (Y on the back, Z on top)
      const u = X / sz, v = (face === 'up' ? Z : Y) / (sz * 0.87), r = Math.round(v), q = u - (r & 1) * 0.5, cu = Math.round(q), du = q - cu, dv = v - r;
      const d = Math.max(Math.abs(du) * 1.0 + Math.abs(dv) * 0.5, Math.abs(dv));       // hex-ish distance from the scute centre
      let c = d > 0.47 ? C[3] : d > 0.4 ? C[2] : d < 0.16 ? C[0] : C[1];
      if (d <= 0.4 && ((x + y) % 5 === 0)) c = shift(c, -0.06);
      if (o.stud && d < 0.09) c = S[1];
      p.px(x, y, c);
    }
    if (isSide(face) && o.lip !== false) for (let x = 0; x < w; x++) p.px(x, h - 1, C[3]);
  };
}
// snake bands: coloured rings along the body (axis: 'z' or 'y' in model space), with lit scales
export function bandsP(o = {}) {
  const cols = o.cols || [K.blood[1], K.paint, K.white, K.paint], per = o.per || 2.4, axis = o.axis || 'z';
  return (p, w, h, face, cube) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P3 = at(face, cube, x, y), t = (((axis === 'z' ? P3[2] : axis === 'x' ? P3[0] : P3[1]) / per) % 1 + 1) % 1;
      const i = t < 0.5 ? 0 : t < 0.62 ? 1 : t < 0.76 ? 2 : 3;
      let c = cols[i];
      if (face === 'down') c = o.belly || shift(cols[2], -0.1);
      else if (face === 'up') c = shift(c, 0.12);
      else c = shift(c, 0.12 - (h > 1 ? y / (h - 1) : 0.5) * 0.3);
      if (face !== 'down' && (x + (y & 1) * 2) % 4 === 0) c = shift(c, 0.08);
      p.px(x, y, c);
    }
  };
}
// scales: a shingled scallop pattern (kit feathers, small) in a ramp
export const scalesP = (c, o = {}) => feathers(c, { size: o.size || 4, top: o.top, bottom: o.bottom, dark: o.dark, lite: o.lite });
// platform boots: patent black uppers with a gloss streak and o.trim (a silver band, a painted star or flame)
export function bootP(o = {}) {
  const L = o.cols || ['#6a6478', '#24202c', '#141218', '#08070a'];
  return (p, w, h, face, cube) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = band(L, face, x, y, h);
      if ((face === 'south' || face === 'west' || face === 'up') && Math.abs(x - y * 0.4 - w * 0.25) < 0.8) c = '#b8b4c8';
      p.px(x, y, c);
    }
    if (isSide(face) && o.lace) for (let y = 1; y < h - 1; y += 2) { const m = Math.floor(w / 2); p.px(m - 1, y, K.silver[2]).px(m, y, K.silver[1]); }
  };
}
// the platform sole: chunky chrome with a dark tread line
export const soleP = (o = {}) => (p, w, h, face) => { chrome(o)(p, w, h, face); if (isSide(face)) { for (let x = 0; x < w; x++) { p.px(x, 0, (o.cols || K.silver)[0]); if (h > 3) p.px(x, h - 2, (o.cols || K.silver)[3]); } } };
// feathers in black with pale tips (wings), down to the trailing edge
export function wingP(o = {}) {
  const c = o.c || '#2c2834', tip = o.tip || '#e8e6f0', tipLo = o.tipLo || '#a8a4b8';
  const base = feathers(c, { size: o.size || 6, top: o.top || shift(c, 0.25), bottom: o.bottom || shift(c, -0.35) });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'up' || face === 'down') return;
    const y0 = Math.floor(h * (o.from ?? 0.62));
    for (let x = 0; x < w; x++) for (let y = y0; y < h; y++) { const k = (x % 3); p.px(x, y, y >= h - 2 ? (k === 2 ? tipLo : tip) : k === 2 ? shift(c, -0.4) : shift(c, -0.1 + (y - y0) * 0.04)); }
  };
}
// primary feather fingers: dark quills ending in pale tips
export const quillP = (o = {}) => (p, w, h, face) => fill(p, w, h, (x, y) => { const v = h > 1 ? y / (h - 1) : 0.5; return face === 'up' ? o.c || '#2c2834' : v > 0.7 ? (x === 0 ? o.tipLo || '#a8a4b8' : o.tip || '#e8e6f0') : x === 0 ? shift(o.c || '#2c2834', 0.25) : o.c || '#2c2834'; });
// fire: three flickering tongues on a glow plane (frame f, height k)
export const flames = (f, k = 1, cols = ['#fff6c8', '#ffd040', '#ff9a2a', '#ff5a1e']) => (p, w, h) => {
  [[0.24, 0.62], [0.5, 1], [0.76, 0.7]].forEach(([cxF, hgt], i) => {
    const H = h * hgt * k * (0.82 + 0.18 * Math.sin(f * 2.1 + i * 1.7)), cx = cxF * w;
    for (let y = 0; y < h; y++) {
      const v = (h - 1 - y) / Math.max(1, H); if (v > 1) continue;
      const half = (v < 0.35 ? 1 : Math.sqrt(1 - (v - 0.35) / 0.65)) * w * 0.17, sway = Math.sin(v * 4 + f * 1.9 + i) * v * 2.4;
      for (let x = Math.floor(cx - half + sway); x <= Math.ceil(cx + half + sway); x++) {
        const d = Math.abs(x - cx - sway) / Math.max(0.5, half);
        p.px(x, y, d < 0.35 && v < 0.6 ? cols[0] : d < 0.7 && v < 0.85 ? cols[1] : v > 0.75 ? cols[3] : cols[2]);
      }
    }
  });
};
// a plain flat colour with an optional bottom line (mouth insides, nostrils)
export const flat = (c, o = {}) => (p, w, h, face) => fill(p, w, h, (x, y) => (o.line && isSide(face) && y === h - 1 ? o.line : face === 'down' && o.under ? o.under : c));
// a long tongue: pink-red with a dark centre groove on top
export const tongueP = (cols = K.tongue) => (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? (x === Math.floor(w / 2) ? cols[2] : y < 2 ? cols[0] : cols[1]) : face === 'down' ? cols[2] : ramp([cols[0], cols[1], cols[2]], h > 1 ? y / (h - 1) : 0.5, x, y)));
// a forked tongue tip (plane, y): two prongs
export const forkP = (c = K.tongue[1]) => (p, w, h) => { const m = Math.floor(w / 2); for (let y = 0; y < h; y++) { const s = Math.round((y / h) * (w / 2 - 0.5)); if (y < h * 0.45) { p.px(m, y, c); p.px(m - 1, y, c); } else { p.px(m - 1 - s, y, c); p.px(m + s, y, c); } } };
// a lightning bolt on a plane (Spaceman, God of Thunder FX props)
export const boltPlane = (c = '#ffffff', glow = '#9ad8ff') => (p, w, h) => {
  const pts = [[w * 0.6, 0], [w * 0.15, h * 0.55], [w * 0.48, h * 0.55], [w * 0.3, h], [w * 0.88, h * 0.4], [w * 0.55, h * 0.4], [w * 0.8, 0]];
  poly(p, pts, (x, y) => ((x + y) % 5 === 0 ? glow : c)); edgeLine(p, glow, { sides: true, top: true });
};

// ---------------------------------------------------------------- particles
defineFx('kstar', { w: 9, h: 9, paint: (p) => { const pts = starPts(4.5, 4.7, 4.4, 0.45); fill(p, 9, 9, (x, y) => (inPoly(pts, x + 0.5, y + 0.5) ? '#ffffff' : null)); edgeLine(p, '#16121c', { sides: true, top: true }); }, life: [0.8, 1.2], size: [0.14, 0.06], speed: [0.8, 1.6], grav: -0.2, drag: 1.4, spread: 1, spin: 5, fade: true });
defineFx('sstar', { w: 9, h: 9, paint: (p) => { const pts = starPts(4.5, 4.7, 4.4, 0.45); fill(p, 9, 9, (x, y) => (inPoly(pts, x + 0.5, y + 0.5) ? (x + y < 7 ? '#ffffff' : '#c8d4ff') : null)); }, glow: true, life: [0.6, 1.0], size: [0.12, 0.03], speed: [0.6, 1.8], grav: 0, drag: 1.2, spread: 1, spin: 4, fade: true });
defineFx('blood', { w: 5, h: 7, paint: (p) => { for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) { const v = y / 6, half = (v < 0.45 ? (v / 0.45) * 1.8 : Math.sqrt(Math.max(0, 1 - ((v - 0.62) / 0.38) ** 2)) * 2.5); if (Math.abs(x - 2) <= half) p.px(x, y, x < 2 && v > 0.4 && v < 0.7 ? '#ff7a7a' : v > 0.85 ? '#5a0414' : '#b80e24'); } }, life: [0.5, 0.9], size: [0.07, 0.06], speed: [1.4, 2.6], grav: 8, drag: 0.3, spread: 0.5 });
const batFrame = (up) => (p) => { const c = '#141018', m = 5; p.rect(m - 1, 2, 3, 3, c); p.px(m - 1, 1, c).px(m + 1, 1, c); p.px(m - 1, 3, '#ff3a3a').px(m + 1, 3, '#ff3a3a');
  for (let i = 1; i <= 4; i++) { const y = up ? 2 - Math.round(i * 0.5) : 2 + Math.round(i * 0.4); p.px(m - 1 - i, y, c).px(m + 1 + i, y, c); p.px(m - 1 - i, y + 1, c).px(m + 1 + i, y + 1, c); if (i % 2 === 0) { p.px(m - 1 - i, y + 2, c); p.px(m + 1 + i, y + 2, c); } } };
defineFx('bat', { w: 11, h: 7, frames: [batFrame(true), batFrame(false)], fps: 10, life: [1.0, 1.5], size: [0.12, 0.12], speed: [0.8, 1.6], grav: -0.6, drag: 0.8, spread: 1, wob: 1.6, fade: true });
defineFx('cosmic', { w: 7, h: 7, frames: ['#ffffff', '#b8d8ff', '#e0b8ff'].map((c) => (p) => { p.px(3, 0, c).px(3, 6, c).px(0, 3, c).px(6, 3, c); p.rect(2, 2, 3, 3, c); p.px(3, 3, '#ffffff'); p.px(1, 1, c).px(5, 5, c).px(5, 1, c).px(1, 5, c); }), glow: true, life: [0.7, 1.2], size: [0.07, 0.02], speed: [0.3, 1.2], grav: -0.1, drag: 1, spread: 1, spin: 3, fade: true });
defineFx('kbolt', { w: 8, h: 18, frames: [0, 1].map((f) => (p) => { let x = 4; for (let y = 0; y < 18; y++) { p.px(x, y, '#ffffff'); p.px(x + 1, y, '#e8d0ff'); p.px(x - 1, y, '#a070ff'); if (y % 4 === 3) x += (y + f * 2) % 8 === 3 ? 2 : -2; x = Math.max(1, Math.min(6, x)); } }), glow: true, life: [0.12, 0.2], size: [0.32, 0.36], speed: [0, 0.2], grav: 0, spread: 1, fps: 20 });
defineFx('soot', { w: 10, h: 9, paint: (p) => { for (let y = 0; y < 9; y++) for (let x = 0; x < 10; x++) { const d = Math.hypot((x - 4.5) / 4.6, (y - 4.2) / 4.2); if (d < 1 && (d < 0.75 || (x + y) % 2)) p.px(x, y, d < 0.5 ? '#3a3440' : '#22202a'); } }, life: [0.8, 1.3], size: [0.1, 0.3], speed: [0.3, 0.7], grav: -0.7, drag: 1.2, spread: 0.6, fade: true, spin: 0.8 });

// ---------------------------------------------------------------- rig & clip helpers
// mouth: o (0 shut … 1 wide), tongue (0 in … 1 all the way out, KISS-style), on the jaw / tongue bones
export function mouth(P, open, tongue = 0, o = {}) {
  P.rot(o.jaw || 'jaw', (o.max || 34) * open, 0, 0);
  if (o.tongue !== false) P.scl(o.tongue || 'tongue', 1, 1, 0.05 + 0.95 * tongue).rot(o.tongue || 'tongue', (o.droop ?? 20) * tongue, 0, 0);
}
// eye darts that snap like a predator's: hold, glance, hold
export function glances(P, t, seq, per = 0.7, o = {}) {
  const n = seq.length, i = Math.floor(t / per), f = t - i * per, a = seq[(((i - 1) % n) + n) % n], b = seq[((i % n) + n) % n], k = Math.min(1, f / 0.07);
  const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
  P.pos(o.r || 'eyeR', x, y, 0).pos(o.l || 'eyeL', x, y, 0);
}
export const cyc = (t, fps, n) => Math.floor(t * fps) % n;

// ---------------------------------------------------------------- the ultra-drip form
// Black lacquer and gold: reds / browns turn to black lacquer, chrome and silver to gold, the
// draco violet to a black-violet lacquer; the white greasepaint and the eyes are kept; fire burns blue.
const hsl = (hex) => { const n = parseInt(hex.slice(1, 7), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l }; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return { h, s: d / (1 - Math.abs(2 * l - 1)), l }; };
const hex = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16).padStart(2, '0')).join(''); };
export const toGold = (l) => hex(44, 0.86, Math.min(0.92, 0.2 + l * 0.66));
export const toLacquer = (l, h = 255) => hex(h, 0.16, 0.05 + l * 0.22);
// o: keep (colours left alone: eyes), swap ({ hex: hex }), gold (extra hue ranges → gold), black (extra hue ranges → lacquer), fx (particle swaps)
export function kissForm(o = {}) {
  const keep = new Set((o.keep || []).map((c) => c.toLowerCase())), swap = Object.fromEntries(Object.entries(o.swap || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const inH = (h, [a, b]) => (a <= b ? h >= a && h < b : h >= a || h < b);
  return { fx: { blood: 'soot', ...(o.fx || {}) }, map(c, glow) {
    if (typeof c !== 'string' || c[0] !== '#' || c.length < 7) return c;
    const lc = c.toLowerCase(); if (keep.has(lc)) return c; if (swap[lc]) return swap[lc];
    if (glow) return blackGold(c, glow);
    const { h, s, l } = hsl(c);
    if (l > 0.84) return c;                                                          // white greasepaint stays white
    if (s < 0.16) return l > 0.3 ? toGold(l) : c;                                    // chrome turns gold, black stays black
    for (const r of o.gold || []) if (inH(h, r)) return toGold(l);
    for (const r of o.black || []) if (inH(h, r)) return toLacquer(l);
    if (h >= 240 && h < 315) return toLacquer(l, 275);                               // draco violet → black-violet lacquer
    return blackGold(c, glow);
  } };
}
export { hsl, hex };

// ---------------------------------------------------------------- the chimera's shared look (Kissmera and the finals' hints)
export const CH = {
  fur: '#4a4462', furHi: '#6c648c', furLo: '#2e2a3e', furLine: '#16121e', furTip: '#8a80b0', furLite: '#5a5274',
  mane: '#1c1824', maneHi: '#3e3454', maneLo: '#0c0a12', maneLine: '#060408', maneTip: '#4c2c86',
  shell: ['#62947a', '#3a624e', '#223c30', '#0c1812'],
  scale: '#5a5470', scaleHi: '#7a7494', scaleLo: '#36324a',
  pants: ['#4e4a5c', '#24202e', '#16131c', '#0a090e'],
  snakeBelly: '#d8d0dc',
};
export const chimFur = (seed, o = {}) => fur(CH.fur, { hi: CH.furHi, lo: CH.furLo, line: CH.furLine, tip: CH.furTip, lite: CH.furLite, s: 8, pt: 0.6, seed, ...o });
export const chimMane = (seed, o = {}) => fur(o.c || CH.mane, { hi: CH.maneHi, lo: CH.maneLo, line: CH.maneLine, tip: CH.maneTip, s: 7, tipH: 4, pt: 0.5, seed, ...o });
export const chimHalo = (o = {}) => halo(o.c || CH.mane, { hi: CH.maneHi, lo: CH.maneLo, line: CH.maneLine, tip: o.tip || CH.maneTip, n: o.n || 24, depth: o.depth ?? 0.24, inner: o.inner ?? 0.66, sq: o.sq ?? 2.1, seed: o.seed || 5 });
export const snakeBands = (axis, o = {}) => bandsP({ axis, per: o.per || 2.0, cols: o.cols || [K.blood[1], K.paint, K.white, K.paint], belly: o.belly || CH.snakeBelly });
// a snake's head: dark scales with red flecks on top, a pale chin, and eyes on its side faces where
// o.eye(X, Y, Z) says so ('k' slit pupil, 'h' glint, 'i' iris), all in model space
export function snakeHead(o = {}) {
  const cols = o.cols || ['#3a3444', '#221e2a', '#141218'], fleck = o.fleck || K.blood[2], iris = o.iris || K.blood[1], hi = o.hi || '#ff7a5a';
  return (p, w, h, face, cube) => {
    fill(p, w, h, (x, y) => (face === 'up' ? shift(cols[0], -0.05) : face === 'down' ? (o.chin || CH.snakeBelly) : ramp(cols, h > 1 ? y / (h - 1) : 0.5, x, y)));
    if (face === 'up') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x + y * 2) % 7 === 0) p.px(x, y, fleck);
    if (!isSide(face)) return;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [X, Y, Z] = at(face, cube, x, y), e = o.eye && o.eye(X, Y, Z, face);
      if (e) p.px(x, y, e === 'k' ? '#140808' : e === 'h' ? hi : iris);
      if (o.lip && y === h - 1) p.px(x, y, K.paint);
    }
  };
}
// a cobra hood (plane z): a black hood with a pale rim and blood-red spectacle marks
export const hoodP = (o = {}) => (p, w, h) => {
  const cx = w / 2;
  fill(p, w, h, (x, y) => { const v = y / (h - 1), half = (Math.sin(Math.min(1, v * 1.25) * Math.PI * 0.9) * 0.5 + 0.08) * w * (v > 0.85 ? (1 - v) / 0.15 * 0.6 + 0.4 : 1); return Math.abs(x + 0.5 - cx) < half ? (o.c || '#1c1824') : null; });
  edgeLine(p, o.rim || '#5a4a6a', { sides: true, top: true });
  for (const s of [-1, 1]) { const ex = cx + s * w * 0.18, ey = h * 0.42; fill(p, w, h, (x, y) => { const d = Math.hypot((x + 0.5 - ex) / (w * 0.09), (y + 0.5 - ey) / (h * 0.08)); return d < 1 ? (d < 0.5 ? (o.eye || K.white) : (o.mark || K.blood[1])) : null; }); }
};

// ---------------------------------------------------------------- Cobblemon-language eyes
// Flat colour blocks: a white sclera block and a two-tone iris block (or a no-whites iris block),
// square highlight pixels, a lid line along the top only — never an outline ring, a glow or a
// gradient. maps: hand-drawn rows per state (open, angry, sad, happy, closed, shock, wide, smug,
// sleepy, teary…); the line states (x, swirl, heart, star) come from eyes.js.
export function cobEyes(o) {
  const { maps, ...rest } = o;
  return eyeRig({ style: 'pix', chunk: 1, extra: ['smug'], ...rest, map: maps });
}
