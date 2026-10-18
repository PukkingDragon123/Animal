// Moshbull — Team Metallica's mosh-pit bull (Geo). Stocky, low-slung and front-heavy: its hide
// is plated with craggy rock and its shoulders are two boulders, horns like curved stone spikes,
// a gold ring through its nose, spiked wristbands on its front hooves and a purple-dyed tuft of
// hair falling over one eye. A Master of Puppets nod: cut marionette strings still trail from its
// horns and hooves, and a field of small white crosses is painted across its rock plates.
// It looks like a wrecking ball and is a big softie: gentle eyes under a heavy stone brow. It
// headbangs to a beat only it can hear, and grazes on little flowers like a gentleman.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, gradient, poly, ramp, shift, mix, h2 } from './kit.js';

const C = {
  hide: '#835a4a', hideHi: '#b8866a', hideLo: '#5c3c48', hideDeep: '#3c2840',
  muz: '#b48a7c', muzHi: '#d4ae9c', muzLo: '#8a6670', muzDeep: '#5a3c4c',
  rock: ['#f2e6ce', '#ccb89c', '#968482', '#5e5068'], rockIn: '#4a3c54',
  horn: ['#fff6e0', '#e2cea8', '#ac9478', '#705c66'],
  hoof: ['#c4ae94', '#8e786c', '#62505e', '#403248'],
  band: '#3c3050', bandHi: '#6a5a7c', bandLo: '#1a1424',
  tuft: ['#ecc8ff', '#b486f6', '#7e58d0', '#523696'],
  gold: ['#fff6a8', '#ffd23e', '#e49a24', '#ae641c'],
  ink: '#1c1020', mouth: '#3a1828', gum: '#7a2a48', tongue: '#f08a9a',
  eye: '#c8782c', eyeHi: '#f0b060', eyeLo: '#6a3410', string: '#f4f0e6',
};
const CHROME = ['#ffffff', '#dfe6f4', '#aab4d0', '#5c6488', '#7c86aa', '#9aa4c4'];

// ---------------------------------------------------------------- painters
// short-haired hide: clean bands, sparse little hair strokes, darker toward the belly
function hideP(c = C.hide, o = {}) {
  const top = o.top || C.hideHi, bot = o.bottom || C.hideLo, base = shade(c, { top, bottom: bot, grain: 0, seam: false });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'down') return;
    for (let r = 0, y = 2; y < h - 2; y += 5, r++) for (let x = (r % 2) * 4 + 2; x < w - 1; x += 8) {
      const b = face === 'up' ? top : ramp([top, c, bot], y / Math.max(1, h - 1), x, y);
      p.px(x, y, shift(b, -0.12)); p.px(x, y + 1, shift(b, -0.12)); p.px(x + 1, y - 1, shift(b, 0.1));
    }
    if (face !== 'up') for (let x = 0; x < w; x++) p.px(x, h - 1, shift(bot, -0.2));
  };
}
const hide = hideP(), hideDark = hideP(shift(C.hide, -0.08), { top: C.hide, bottom: C.hideDeep });
// a seeded hash for painters
const hh = (a, b, s) => h2(a | 0, b | 0, s);
// craggy rock: banded stone cut into a few big flat facets (each one tone, lit ones toward the top),
// one or two deliberate cracks, lit chips along the rim, and (o.crosses) a field of small white crosses
function rockP(seed = 1, o = {}) {
  const R = C.rock;
  return (p, w, h, face) => {
    const fs = seed * 13 + ['up', 'down', 'north', 'south', 'east', 'west', 'plane'].indexOf(face) * 7;
    const n = Math.max(2, Math.round((w * h) / (o.cell || 140)));
    const pts = []; for (let i = 0; i < n; i++) pts.push([hh(i, fs, 3) * w, hh(i, fs, 5) * h, hh(i, fs, 9)]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let d1 = 1e9, k = 0;
      for (let i = 0; i < n; i++) { const d = (x - pts[i][0]) ** 2 + (y - pts[i][1]) ** 2; if (d < d1) { d1 = d; k = i; } }
      const t = face === 'up' ? 0.05 : face === 'down' ? 1 : y / Math.max(1, h - 1), v = pts[k][2] + (1 - pts[k][1] / h) * 0.3 - 0.15;
      const base = ramp([R[0], R[1], R[2]], Math.min(1, t * 0.8 + 0.15), x, y);
      p.px(x, y, v < 0.28 ? shift(base, -0.12) : v > 0.72 ? shift(base, 0.08) : base);
    }
    // cracks: a jagged dark line or two, with a lit lip along one side
    for (let c = 0; c < (w * h > 300 ? 2 : 1); c++) {
      let x = hh(c, fs, 21) * w, y = hh(c, fs, 23) * h * 0.5; const dx = (hh(c, fs, 25) - 0.5) * 0.9;
      for (let i = 0; i < Math.min(h, 12); i++) { const X = Math.round(x), Y = Math.round(y); p.px(X, Y, C.rockIn); p.px(X + 1, Y, shift(R[0], 0.05)); x += dx + (i % 3 === 1 ? 0.8 : -0.4); y += 1; if (y >= h) break; }
    }
    if (face !== 'up' && face !== 'down') { for (let x = 0; x < w; x++) p.px(x, 0, (x * 7 + fs) % 5 === 0 ? R[1] : shift(R[0], 0.1)); for (let x = 0; x < w; x++) p.px(x, h - 1, R[3]); }
    if (o.crosses && face !== 'down') {
      // the field: rows of small white crosses, smaller and closer together toward the top
      for (let r = 0, y = h - 6; y > 1; r++) {
        const sc = face === 'up' ? 1 : Math.max(0.45, y / h), gap = Math.max(4, Math.round(7 * sc));
        for (let x = 2 + ((r * 3) % gap); x < w - 2; x += gap) {
          const big = sc > 0.7;
          p.px(x, y - 1, '#ffffff'); p.px(x, y, '#ffffff'); p.px(x, y + 1, '#ffffff'); if (big) p.px(x, y + 2, '#ffffff');
          p.px(x - 1, y, '#ffffff'); p.px(x + 1, y, '#ffffff'); p.px(x + 1, y + 1, R[2]); if (big) p.px(x + 1, y + 2, R[2]);
        }
        y -= Math.max(4, Math.round(6 * sc));
      }
    }
  };
}
const hornP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = face === 'up' ? 0.1 : face === 'down' ? 0.9 : y / Math.max(1, h - 1);
    p.px(x, y, ramp([C.horn[0], C.horn[1], C.horn[2]], Math.min(1, t * 0.7 + (x / w) * 0.35), x, y));
  }
  if (face !== 'up' && face !== 'down') { for (let x = 0; x < w; x++) { p.px(x, Math.floor(h * 0.5), C.horn[2]); p.px(x, Math.floor(h * 0.5) - 1, C.horn[0]); } for (let y = 0; y < h; y++) p.px(w - 1, y, C.horn[2]); }
};
const muzzleP = (p, w, h, face) => {
  shade(C.muz, { top: C.muzHi, bottom: C.muzLo, grain: 0 })(p, w, h, face);
  if (face === 'up') { for (let y = h - 3; y < h; y++) for (let x = 2; x < w - 2; x++) p.px(x, y, '#a88890'); return; }
  if (face !== 'south') { if (face === 'east' || face === 'west') for (let x = 0; x < w; x++) p.px(x, h - 2, C.muzLo); return; }
  const cx = (w - 1) / 2, padB = Math.round(h * 0.72);
  // the nose pad: a broad, slightly darker, moist rounded patch
  for (let y = 1; y < padB; y++) for (let x = 1; x < w - 1; x++) { const u = (x - cx) / (w * 0.46), v = (y - padB * 0.5) / (padB * 0.55); if (u * u + v * v <= 1) p.px(x, y, u * u + v * v > 0.8 ? '#6a4a56' : y < padB * 0.3 ? '#a88890' : '#8e6e7a'); }
  for (const sx of [-1, 1]) {
    const nx = Math.round(cx + sx * w * 0.24), ny = Math.round(padB * 0.55);
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const d = (x / 2.6) ** 2 + (y / 3.2) ** 2; if (d <= 1) p.px(nx + x, ny + y, d > 0.55 ? '#6a3040' : '#2a1018'); }
    p.px(nx - sx * 2, ny - 3, '#d8c0c4'); p.px(nx - sx * 3, ny - 2, '#d8c0c4');
  }
  for (let y = 2; y < padB - 2; y++) p.px(Math.round(cx), y, '#6a4a56');
  for (let x = Math.round(w * 0.3); x < w * 0.45; x++) p.px(x, 2, '#e8d8dc');
  for (let x = 1; x < w - 1; x++) p.px(x, h - 2, x < 3 || x > w - 4 ? C.muzLo : C.muzDeep);
};
const jawP = (p, w, h, face) => { shade(C.muz, { top: C.muzHi, bottom: C.muzLo, grain: 0, rim: false })(p, w, h, face); if (face === 'south') for (let x = 0; x < w; x++) p.px(x, 0, C.muzDeep); };
const mouthP = (p, w, h) => { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, Math.max(1, h - 2), C.gum); };
const tongueP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 || x === w - 1 ? '#c85a72' : y === 0 ? '#ffb0bc' : C.tongue); };
const hoofP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.hoof[1] : ramp([C.hoof[1], C.hoof[2], C.hoof[3]], y / Math.max(1, h - 1), x, y));
  if (face === 'south' || face === 'north') { const m = Math.floor(w / 2); for (let y = 0; y < h; y++) p.px(m, y, '#1c1428'); p.px(m - 1, 0, C.hoof[0]); }
  if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, 0, C.hoof[0]);
};
const bandP = (p, w, h, face) => {
  shade(C.band, { top: C.bandHi, bottom: C.bandLo, grain: 0 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  for (let x = 1; x < w - 1; x += 2) p.px(x, 1, shift(C.bandHi, 0.1));
  for (let x = 2; x < w - 2; x += 5) { p.px(x, h - 3, CHROME[1]); p.px(x + 1, h - 3, '#ffffff'); p.px(x, h - 2, CHROME[3]); p.px(x + 1, h - 2, CHROME[2]); }
};
function chromeP(o = {}) {
  const f0 = o.from ?? 0, f1 = o.to ?? 1;
  return (p, w, h, face) => {
    if (face === 'up') { p.rect(0, 0, w, h, f0 < 0.3 ? CHROME[0] : CHROME[1]); return; }
    if (face === 'down') { p.rect(0, 0, w, h, CHROME[3]); return; }
    for (let y = 0; y < h; y++) { const t = f0 + (f1 - f0) * (h > 1 ? y / (h - 1) : 0.5); const col = t < 0.2 ? CHROME[0] : t < 0.44 ? CHROME[1] : t < 0.62 ? CHROME[3] : t < 0.84 ? CHROME[4] : CHROME[5]; for (let x = 0; x < w; x++) p.px(x, y, col); }
  };
}
const spikeTri = (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) { const half = ((y + 0.6) / h) * (w / 2); for (let x = 0; x < w; x++) { const dx = x - cx; if (Math.abs(dx) > half) continue; const edge = Math.abs(dx) > half - 0.85; p.px(x, y, edge ? (dx < 0 ? CHROME[1] : '#3a3e60') : dx < -0.2 ? '#ffffff' : dx < 1 ? CHROME[1] : CHROME[2]); } }
};
const goldP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.gold[0] : face === 'down' ? C.gold[3] : ramp(C.gold, y / Math.max(1, h - 1), x, y)); if (w > 1 && h > 1 && face !== 'down') p.px(0, 0, '#ffffff'); };
// the purple tuft: long hair strands with lighter streaks, ragged tips (cut-out plane)
const tuftP = (seed) => (p, w, h) => {
  for (let x = 0; x < w; x++) {
    const len = Math.round(h * (0.62 + 0.38 * Math.abs(Math.sin(x * 0.9 + seed)))) - (x === 0 || x === w - 1 ? 2 : 0);
    for (let y = 0; y < len; y++) {
      const v = y / h, edge = y >= len - 1;
      p.px(x, y, edge ? C.tuft[3] : (x + Math.floor(y / 3)) % 4 === 0 ? C.tuft[0] : v < 0.25 ? C.tuft[1] : x % 3 === 2 ? C.tuft[3] : C.tuft[2]);
    }
  }
};
const lockP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = face === 'up' ? 0 : y / Math.max(1, h - 1); p.px(x, y, face === 'down' ? C.tuft[3] : x === 0 ? C.tuft[1] : x === w - 1 ? C.tuft[3] : ramp([C.tuft[1], C.tuft[2], C.tuft[3]], t * 0.9, x, y)); } if (face === 'south' || face === 'north') for (let y = 1; y < h - 2; y += 2) p.px(1 + ((y >> 1) % Math.max(1, w - 2)), y, C.tuft[0]); };
const fringeP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = face === 'up' ? 0 : y / Math.max(1, h - 1), st = (x + Math.floor(y / 4)) % 4; p.px(x, y, face === 'down' ? C.tuft[3] : x === 0 ? C.tuft[1] : x === w - 1 ? C.tuft[3] : st === 0 ? C.tuft[0] : st === 2 ? ramp([C.tuft[2], C.tuft[3]], t, x, y) : ramp([C.tuft[1], C.tuft[2]], t, x, y)); } };
const tipsP = (p, w, h) => { for (let x = 0; x < w; x++) { const k = x % 5, l = Math.round(h * (k === 2 ? 1 : k === 1 || k === 3 ? 0.62 : 0.25) * (0.75 + 0.25 * Math.sin(x * 1.7))); for (let y = 0; y < l; y++) p.px(x, y, y === l - 1 ? C.tuft[3] : k === 2 && y < 2 ? C.tuft[0] : y < l * 0.5 ? C.tuft[2] : C.tuft[3]); } };
const tuftBox = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (x + Math.floor(y * 0.6)) % 5; p.px(x, y, face === 'up' ? (s === 0 ? C.tuft[0] : s === 3 ? C.tuft[2] : C.tuft[1]) : face === 'down' ? C.tuft[3] : y === 0 ? C.tuft[0] : s === 2 ? C.tuft[3] : ramp([C.tuft[1], C.tuft[2]], y / h, x, y)); } };
// a marionette string: a thin bright thread with a frayed, cut end at the top
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const stringP = (fade) => (p, w, h) => { const m = Math.floor(w / 2); for (let y = 0; y < h; y++) { const k = fade ? 1 - y / h : 0; if (fade && k * 16 > B4[(y & 3) * 4 + (m & 3)] + 2) continue; p.px(m, y, y % 6 === 0 ? '#d8d0c0' : C.string); } };
const earP = (p, w, h, face) => { hide(p, w, h, face); if (face === 'south' || face === 'down') { for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) p.px(x, y, y === 1 ? '#c87a7a' : '#e8a0a0'); } };
const tailTuft = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 3 === 0 ? C.tuft[1] : y > h - 3 ? C.tuft[3] : C.tuft[2]); };
// the face: hide, a paler band across the eyes, a blaze down the bridge, darker jowls, a curl of hair on the poll
const faceP = (p, w, h, face) => {
  hide(p, w, h, face);
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x - cx) / (w / 2), v = y / h;
    if (v > 0.18 && v < 0.5 && Math.abs(u) > 0.18) p.px(x, y, (x + y) % 7 === 0 ? C.hide : mix(C.hide, C.hideHi, 0.45));
    if (v > 0.42 && Math.abs(u) < 0.2 + (v - 0.42) * 0.3) p.px(x, y, Math.abs(u) > 0.15 + (v - 0.42) * 0.3 ? C.hide : mix(C.hideHi, C.muz, 0.35));
    if (v > 0.55 && Math.abs(u) > 0.62) p.px(x, y, shift(C.hide, -0.14));
  }
  for (let k = 0; k < 5; k++) { const x = Math.round(cx - 6 + k * 3), y = 1 + (k % 2); p.px(x, y, C.hideHi); p.px(x + 1, y + 1, shift(C.hide, -0.15)); }
};
// the chest: a paler bib of hide
const chestP = (p, w, h, face) => {
  hide(p, w, h, face);
  if (face !== 'south') return;
  const cx = w / 2 - 0.5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const hw = w * 0.32 * (1 - (y / h) * 0.5) - ((x + y) % 3 === 0 ? 1 : 0); if (Math.abs(x - cx) < hw) p.px(x, y, Math.abs(x - cx) > hw - 1.2 ? C.hide : y < 3 ? C.hideHi : mix(C.hideHi, C.muz, 0.35)); }
};
// a little flower for the graze fidget: petals and a leafy stem
const petalsP = (p, w, h) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = Math.atan2(y - cy, x - cx), r = Math.hypot(x - cx, y - cy), R = (w / 2) * (0.62 + 0.38 * Math.abs(Math.cos(a * 2.5))); if (r > R) continue; p.px(x, y, r < 1.3 ? '#ffe060' : r > R - 1 ? '#e8608e' : x + y < w - 1 ? '#ffe6f0' : '#ff9ac0'); } };
const stemP = (p, w, h) => { const m = Math.floor(w / 2); for (let y = 0; y < h; y++) p.px(m, y, '#3f8e3a'); for (let k = 0; k < 3; k++) { p.px(m - 1 - k, Math.round(h * 0.5) + k, '#80c64a'); p.px(m + 1 + k, Math.round(h * 0.7) - k, '#3f8e3a'); } };

// eyes: 17 × 11 texels, outer corner at x = 0. Simple Pokémon-style eyes: one solid, warm near-black
// oval with a single white glint. Calm is a slightly drooping top, fierce a hard slanted cut; the heavy
// stone brow above does the glaring.
const EW = 17, EH = 11;
function eyeShape(p, o = {}) {
  const cx = o.cx ?? 8.5, cy = o.cy ?? 6.0, rx = o.rx ?? 4.6, ry = o.ry ?? 4.4, top = (x) => (o.top ?? 0) + (o.slope ?? 0) * (x - cx);
  const inside = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && y >= top(x);
  for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) { if (inside(x + 0.5, y + 0.5)) p.px(x, y, '#24121a'); }
  if (o.glint !== false) { const gx = o.gx ?? 7, gy = o.gy ?? Math.max(Math.ceil(top(7) + 0.7), Math.round(cy - ry * 0.55)); p.px(gx, gy, '#ffffff'); }
}
const EYES = {
  calm: (p) => eyeShape(p, { top: 3.0, slope: -0.18 }),
  fierce: (p) => eyeShape(p, { top: 4.4, slope: 0.36, cy: 6.4, ry: 4.0 }),
  wide: (p) => eyeShape(p, { cy: 5.6, rx: 4.4, ry: 4.6 }),
  content: (p) => { for (let x = 3; x < 14; x++) { const y = Math.round(5.6 + Math.abs(x - 8.5) ** 2 * 0.06); p.px(x, y, '#24121a'); if (x > 4 && x < 12) p.px(x, y + 1, '#24121a'); } },
  closed: (p) => { for (let x = 2; x < 15; x++) { const y = Math.round(6.6 - Math.abs(x - 8.5) ** 2 * 0.025); p.px(x, y, '#24121a'); p.px(x, y + 1, x > 3 && x < 13 ? '#24121a' : 0); } },
  hurt: (p) => { for (let i = 0; i < 5; i++) { p.px(5 + i, 1 + i, '#24121a'); p.px(6 + i, 1 + i, '#24121a'); p.px(5 + i, 9 - i, '#24121a'); p.px(6 + i, 9 - i, '#24121a'); } },
  x: (p) => { for (let i = 0; i < 9; i++) { p.px(4 + i, 1 + i, '#24121a'); p.px(5 + i, 1 + i, '#24121a'); p.px(12 - i, 1 + i, '#24121a'); p.px(13 - i, 1 + i, '#24121a'); } },
  swirl: (p) => { for (let a = 0; a < 14; a += 0.18) { const r = a * 0.36, x = Math.round(8.5 + Math.cos(a) * r * 1.15), y = Math.round(5.5 + Math.sin(a) * r * 0.95); if (r < 4.8) p.px(x, y, '#24121a'); } },
};

// ---------------------------------------------------------------- geometry helpers
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const mirrorCube = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]], rot: c.rot ? [c.rot[0], -c.rot[1], -c.rot[2]] : undefined } : {}) });
const D2R = Math.PI / 180;
// a box from a to b (radius r), turned so its long axis runs along the segment
function limb(a, b, r, tex, x = {}) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d), n = d.map((v) => v / L), m = a.map((v, i) => (v + b[i]) / 2);
  const rx = Math.atan2(n[2], n[1]) / D2R, rz = -Math.asin(Math.max(-1, Math.min(1, n[0]))) / D2R, len = L + r * 0.9;
  return P([m[0] - r, m[1] - len / 2, m[2] - r], [2 * r, len, 2 * r], tex, { pivot: m.slice(0, 3), rot: [rx, 0, rz], ...x });
}
// a horn: a chain of tapering segments through the points [x, y, z, r]
const horn = (pts) => pts.slice(0, -1).map((a, i) => limb(a, pts[i + 1], (a[3] + pts[i + 1][3]) / 2, hornP));
// a craggy boulder: a block turned 45° and a squared block through it (an octagon from above), a
// turned cap on top and a lump at the side — it reads as one big round rock
const boulder = (c, s, seed, tip, side) => [
  P([c[0] - s * 0.5, c[1] - s * 0.46, c[2] - s * 0.5], [s, s * 0.92, s], rockP(seed, { crosses: true }), { pivot: c, rot: [tip[0], 45, tip[2]] }),
  P([c[0] - s * 0.56, c[1] - s * 0.38, c[2] - s * 0.56], [s * 1.12, s * 0.76, s * 1.12], rockP(seed + 3, { crosses: true }), { pivot: c, rot: [tip[0] * 0.6, 0, tip[2] * 0.6] }),
  P([c[0] - s * 0.34, c[1] + s * 0.34, c[2] - s * 0.34], [s * 0.68, s * 0.3, s * 0.68], rockP(seed + 6, { crosses: true }), { pivot: c, rot: [tip[0], 22, tip[2]] }),
  P([c[0] + side * s * 0.3 - s * 0.28, c[1] - s * 0.5, c[2] - s * 0.3], [s * 0.56, s * 0.5, s * 0.6], rockP(seed + 9), { pivot: c, rot: [10, 15, side * 12] }),
];
// strings: two long, nearly straight segments of crossed thread; the upper one dissolves toward an
// unseen puppeteer high above
const STR = 9;
const strSeg = (p, fade) => [P([p[0], p[1], p[2] - 0.35], [0, STR + 0.3, 0.7], stringP(fade), { plane: 'x' }), P([p[0] - 0.35, p[1], p[2]], [0.7, STR + 0.3, 0], stringP(fade), { plane: 'z' })];
function strings(prefix, parent, at, rot) {
  return [
    { name: prefix + '1', parent, pivot: at, rot, cubes: strSeg(at, false) },
    { name: prefix + '2', parent: prefix + '1', pivot: [at[0], at[1] + STR, at[2]], rot: [-3, 0, 0], cubes: strSeg([at[0], at[1] + STR, at[2]], true) },
  ];
}
// a lock of hair: a chunky strand and its thinner tip
const lock = (x, y, z, len, rz, k = 1) => [
  P([x - 1.1 * k, y - len * 0.62, z - 0.7], [2.2 * k, len * 0.62, 1.4], lockP, { pivot: [x, y, z], rot: [10, 0, rz] }),
  P([x - 0.7 * k, y - len, z - 0.45], [1.4 * k, len * 0.42, 0.9], lockP, { pivot: [x, y, z], rot: [10, 0, rz] }),
];
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-8.6, 19.4, 25.06] : [3.0, 19.4, 25.06], [5.6, 3.8, 0], fn, { plane: 'z', mirror: side > 0, id: 'eye-' + k, hide: k !== 'calm' }));

// legs: front legs with spiked wristbands, hind legs with heavy haunches; all hang from root so the hooves stay planted
const spikes = (x0, y, zF, zB, xo) => [
  P([xo - 0.9, y - 0.75, (zF + zB) / 2 - 0.75], [0.9, 1.5, 1.5], chromeP({ from: 0.3, to: 1 })), P([xo - 1.9, y - 0.35, (zF + zB) / 2 - 0.35], [1.0, 0.7, 0.7], chromeP({ from: 0, to: 0.5 })),
  P([x0 - 0.75, y - 0.75, zF], [1.5, 1.5, 0.9], chromeP({ from: 0.3, to: 1 })), P([x0 - 0.35, y - 0.35, zF + 0.9], [0.7, 0.7, 1.0], chromeP({ from: 0, to: 0.5 })),
  P([x0 - 0.75, y - 0.75, zB - 0.9], [1.5, 1.5, 0.9], chromeP({ from: 0.3, to: 1 })), P([x0 - 0.35, y - 0.35, zB - 1.9], [0.7, 0.7, 1.0], chromeP({ from: 0, to: 0.5 })),
];
const legF = [
  P([-12.6, 6.0, 1.8], [7.4, 9.6, 8.6], hide),
  P([-12.2, 2.6, 2.2], [6.6, 5.0, 7.8], hideDark),
  P([-13.0, 3.6, 1.6], [8.2, 3.2, 9.0], bandP),
  ...spikes(-8.9, 5.2, 10.6, 1.6, -13.0),
  P([-12.8, 0, 1.6], [7.8, 2.8, 9.2], hoofP),
];
const legB = [
  P([-12.8, 6.6, -20.0], [8.2, 11.0, 10.0], hide),
  P([-11.6, 2.4, -17.4], [5.8, 6.4, 5.8], hideDark),
  P([-12.0, 0, -18.0], [6.6, 2.8, 7.0], hoofP),
];
const hornR = horn([[-8.0, 26.0, 19.0, 2.6], [-13.8, 27.2, 19.4, 2.25], [-18.4, 30.2, 20.8, 1.75], [-19.8, 34.8, 22.6, 1.2], [-18.6, 38.8, 24.6, 0.65]]);
export const def = {
  name: 'moshbull', ppu: 3, scale: 0.46, outline: { color: C.ink, px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'legFR', parent: 'root', pivot: [-9.0, 14.0, 6.0], cubes: legF },
    { name: 'legFL', parent: 'root', pivot: [9.0, 14.0, 6.0], cubes: legF.map(mirrorCube) },
    { name: 'legBR', parent: 'root', pivot: [-8.5, 13.0, -15.0], cubes: legB },
    { name: 'legBL', parent: 'root', pivot: [8.5, 13.0, -15.0], cubes: legB.map(mirrorCube) },
    ...strings('strFR', 'legFR', [-14.0, 5.2, 6.0], [-16, 0, 14]),
    ...strings('strFL', 'legFL', [14.0, 5.2, 6.0], [-16, 0, -14]),
    { name: 'body', parent: 'root', pivot: [0, 18.0, 0], cubes: [
      // the front: a wrecking ball of chest and shoulders (three stacked blocks round it off)
      P([-13.0, 7.0, -7.0], [26.0, 24.0, 20.0], hide, { faces: { south: chestP, north: hideDark } }),
      P([-14.2, 9.5, -6.0], [28.4, 18.0, 18.0], hide, { faces: { south: chestP } }),
      P([-11.0, 5.6, -5.0], [22.0, 28.0, 16.0], hide, { faces: { south: chestP } }),
      // the rear: smaller and lower, the back sloping down to it
      P([-9.5, 8.0, -21.0], [19.0, 14.0, 16.0], hide, { faces: { north: hideDark } }),
      P([-10.4, 9.5, -20.0], [20.8, 11.0, 14.0], hide, { faces: { north: hideDark } }),
      P([-10.0, 12.0, -12.0], [20.0, 15.0, 8.0], hide, { pivot: [0, 26, -8], rot: [-12, 0, 0] }),
      P([-9.0, 6.0, -17.0], [18.0, 3.0, 24.0], hideDark),
      // two boulder shoulders, plates down the spine: the field of crosses
      ...boulder([-15.0, 27.0, 1.0], 14.5, 1, [6, 0, -12], -1),
      ...boulder([15.0, 27.0, 1.0], 14.5, 2, [6, 0, 12], 1),
      P([-5.0, 27.6, -12.0], [10.0, 3.6, 8.0], rockP(3, { crosses: true }), { pivot: [0, 29.4, -8], rot: [-14, 8, 4] }),
      P([-4.4, 22.2, -19.0], [8.8, 3.2, 6.4], rockP(4, { crosses: true }), { pivot: [0, 23.8, -15.8], rot: [-24, -8, -5] }),
      P([-15.6, 13.5, -14.0], [3.2, 6.0, 7.0], rockP(6), { pivot: [-14, 16.5, -10.5], rot: [0, 4, 8] }),
      P([12.2, 13.0, -16.0], [3.2, 6.4, 8.0], rockP(7), { pivot: [13.8, 16.2, -12], rot: [0, -6, -10] }),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 21.0, -21.0], rot: [22, 0, 0], cubes: [
      P([-0.8, 10.6, -21.8], [1.6, 10.6, 1.6], hide),
      P([-1.7, 5.8, -22.6], [3.4, 5.6, 3.0], tailTuft),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 21.0, 12.0], rot: [2, 0, 0], cubes: [
      P([-10.0, 10.5, 11.0], [20.0, 18.5, 14.0], hide, { faces: { south: faceP, north: hideDark } }),
      P([-11.2, 12.5, 13.0], [22.4, 11.0, 10.0], hide),
      // the heavy stone brow: a boss over each eye, a ridge between
      P([-10.6, 23.2, 21.0], [9.0, 3.8, 5.6], rockP(8), { pivot: [-6.1, 25.1, 23.8], rot: [8, 0, -10] }),
      P([1.6, 23.2, 21.0], [9.0, 3.8, 5.6], rockP(9), { pivot: [6.1, 25.1, 23.8], rot: [8, 0, 10] }),
      P([-3.0, 25.4, 21.4], [6.0, 2.6, 4.0], rockP(10), { pivot: [0, 26.7, 23.4], rot: [6, 0, 0] }),
      // the muzzle and its nose pad
      P([-8.0, 7.6, 22.6], [16.0, 7.8, 7.2], muzzleP, { faces: { south: hide } }),
      P([-7.0, 7.0, 23.4], [14.0, 8.8, 7.0], muzzleP),
      ...eyeStates(-1), ...eyeStates(1),
      ...hornR, ...hornR.map(mirrorCube),
    ] },
    { name: 'tuft', parent: 'head', pivot: [-3.6, 29.0, 24.0], cubes: [
      P([-8.6, 27.6, 15.0], [11.0, 3.6, 10.6], tuftBox),
      P([-9.0, 25.4, 22.8], [10.4, 4.0, 3.6], tuftBox, { pivot: [-3.8, 27.4, 24.6], rot: [24, 0, -8] }),
      P([-9.6, 19.2, 26.4], [9.6, 8.0, 1.8], fringeP, { pivot: [-4.8, 27.2, 27.3], rot: [8, 0, -12] }),
      P([-9.6, 15.2, 27.3], [9.6, 4.0, 0], tipsP, { plane: 'z', pivot: [-4.8, 27.2, 27.3], rot: [8, 0, -12] }),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 7.6, 23.0], cubes: [
      P([-6.6, 4.4, 22.6], [13.2, 3.0, 8.4], jawP),
      P([-5.8, 7.2, 23.2], [11.6, 0.5, 7.6], mouthP, { outline: false }),
      P([-3.2, 7.3, 24.2], [6.4, 0.5, 5.4], tongueP, { outline: false }),
    ] },
    { name: 'ring', parent: 'head', pivot: [0, 9.8, 30.6], cubes: [
      ...[[0, 1.2], [45, 1.0], [90, 1.2], [135, 1.0], [180, 1.2], [225, 1.0], [270, 1.2], [315, 1.0]].map(([a]) => {
        const r = 2.5, x = Math.sin(a * D2R) * r, y = 7.0 + Math.cos(a * D2R) * r;
        return P([x - 1.05, y - 0.5, 30.4], [2.1, 1.0, 1.0], goldP, { pivot: [x, y, 30.9], rot: [0, 0, -a] });
      }),
    ] },
    { name: 'earR', parent: 'head', pivot: [-10.0, 23.0, 17.5], rot: [0, 12, -24], cubes: [P([-17.4, 21.4, 15.4], [7.6, 3.2, 4.4], earP)] },
    { name: 'earL', parent: 'head', pivot: [10.0, 23.0, 17.5], rot: [0, -12, 24], cubes: [P([9.8, 21.4, 15.4], [7.6, 3.2, 4.4], earP, { mirror: true })] },
    ...strings('strHR', 'head', [-18.6, 38.8, 24.6], [-12, 0, 8]),
    ...strings('strHL', 'head', [18.6, 38.8, 24.6], [-12, 0, -8]),
    { name: 'flower', parent: 'root', pivot: [2.0, 0, 33.0], cubes: [
      P([1.0, 0, 33.0], [2.0, 4.6, 0], stemP, { plane: 'z', id: 'flower', hide: true }),
      P([2.0, 0, 32.0], [0, 4.6, 2.0], stemP, { plane: 'x', id: 'flower', hide: true }),
      P([-0.2, 4.2, 30.8], [4.4, 0, 4.4], petalsP, { plane: 'y', id: 'flower', hide: true }),
      P([0.2, 3.2, 33.0], [3.6, 3.6, 0], petalsP, { plane: 'z', id: 'flower', hide: true }),
    ] },
  ],
};

// ---------------------------------------------------------------- effects
defineFx('rubble', { w: 7, h: 7, frames: [0, 1].map((k) => (p) => { const R = C.rock; for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) { const d = Math.max(Math.abs(x - 3), Math.abs(y - 3)) + Math.min(Math.abs(x - 3), Math.abs(y - 3)) * 0.5 + ((x * 3 + y * 5 + k) % 4 === 0 ? 0.6 : 0); if (d > 3.6) continue; p.px(x, y, d > 3 ? R[3] : x + y < 5 ? R[0] : x > y ? R[2] : R[1]); } if (k) { p.px(3, 2, '#ffffff'); p.px(2, 3, '#ffffff'); p.px(4, 3, '#ffffff'); p.px(3, 3, '#ffffff'); p.px(3, 4, '#ffffff'); } }), life: [0.6, 1.0], size: [0.13, 0.13], speed: [2.2, 4.2], grav: 10, drag: 0.4, spread: 0.5, spin: 7 });
defineFx('quake', { w: 16, h: 12, frames: [0, 1].map(() => (p) => { for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) { const d = ((x - 7.5) / 8) ** 2 + ((y - 7) / 5.5) ** 2; if (d > 1) continue; p.px(x, y, d > 0.75 ? '#9a8470' : y < 5 ? '#f0e0c8' : '#d8c4a8'); } }), life: [0.6, 1.0], size: [0.18, 0.5], speed: [0.3, 0.8], grav: -0.3, drag: 2.2, spread: 0.6, fade: true, spin: 0.3 });

// ---------------------------------------------------------------- animation
const LEGS = ['legFR', 'legFL', 'legBR', 'legBL'];
const LEGY = 14.0;
const HORNS = [0, 29, 28], MUZZLE = [0, 10, 31], NOSTRIL_R = [-3.4, 12.0, 30.6], NOSTRIL_L = [3.4, 12.0, 30.6];
// keep the hooves planted while the body bobs (legs stretch or squash to reach)
function plant(P, dy, legs = LEGS) { for (const l of legs) P.pos(l, 0, dy, 0).scl(l, 1, Math.max(0.4, (LEGY + dy) / LEGY), 1); }
// the strings sway on their own, a slow drift
function drift(P, t, k = 1) { for (const [s, ph] of [['strHR', 0], ['strHL', 1.7], ['strFR', 3.1], ['strFL', 4.4]]) { P.rot(s + '1', wave(t, 0.31, ph) * 3 * k, 0, wave(t, 0.23, ph + 1) * 3 * k).rot(s + '2', wave(t, 0.37, ph + 2) * 5 * k, 0, wave(t, 0.29, ph + 3) * 4 * k); } }
// rotate the body about a point (0, ay, az) by rx degrees; the listed legs ride along with it
const BODY = [18, 0], LEGP = { legFR: [14, 6], legFL: [14, 6], legBR: [13, -15], legBL: [13, -15] };
function tilt(P, rx, ay, az, ride = []) {
  const r = rx * D2R, c = Math.cos(r), s = Math.sin(r);
  const by = BODY[0] - ay, bz = BODY[1] - az;
  P.rot('body', rx, 0, 0).pos('body', 0, ay + by * c - bz * s - BODY[0], az + by * s + bz * c - BODY[1]);
  for (const l of ride) { const [py, pz] = LEGP[l], qy = py - ay, qz = pz - az; P.pos(l, 0, ay + qy * c - qz * s - py, az + qy * s + qz * c - pz).rot(l, rx, 0, 0); }
}
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.014, per: 3.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.4], dur: 0.14 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 4 },
  springs: [
    { bone: 'tuft', tip: [-1.5, -6, 2], k: 120, d: 8, gain: 1.0, max: 24, axes: [1, 0.3, 1] },
    { bone: 'ring', tip: [0, -3, 0], k: 90, d: 5, gain: 1.2, max: 30, axes: [1, 0, 1] },
    { bone: 'earR', tip: [-5, -1, 0], k: 140, d: 8, gain: 0.7, max: 18 },
    { bone: 'earL', tip: [5, -1, 0], k: 140, d: 8, gain: 0.7, max: 18 },
    { bone: 'tail', tip: [0, -9, 0], k: 80, d: 6, gain: 0.9, max: 28 },
    ...['strHR', 'strHL', 'strFR', 'strFL'].flatMap((s) => [1, 2].map((i) => ({ bone: s + i, tip: [0, STR, 0], k: 50 - i * 10, d: 4, gain: 0.9, max: 14 + i * 6 }))),
  ],
  faces: {
    eyes: { default: 'calm', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    flower: { default: 'off', states: { off: [], on: ['flower'] } },
  },
  fidget: { every: [5, 9], clips: ['graze', 'paw'] },
  clips: {
    // headbanging to a beat only it can hear: a heavy nod on every beat, the body dipping into it,
    // the tuft whipping, the ring swinging, weight rolling from side to side
    idle: { len: 1.6, loop: true, f(P, t) {
      const beat = (t % 0.8) / 0.8, hit = Math.exp(-beat * 7) * (1 - Math.exp(-beat * 60)), up = Math.sin(beat * Math.PI);
      const dy = -0.7 * hit + 0.25 * up, sw = wave(t, 1 / 1.6);
      P.pos('body', 0, dy, 0).sq('body', -0.05 * hit + 0.015 * up).rot('body', -1.5 * hit, 0, sw * 2.2); plant(P, dy);
      P.rot('head', 16 * hit - 6 * up + 3, sw * 4, -sw * 3).rot('jaw', 3 + 4 * hit);
      P.rot('tuft', -14 * hit, 0, 0).rot('tail', 0, 0, sw * 18).rot('earR', 0, 0, 8 * hit).rot('earL', 0, 0, -8 * hit);
      drift(P, t);
    } },
    // a heavy trot: diagonal pairs, two footfalls per cycle, the head nodding with each
    walk: { len: 1.0, loop: true, f(P, t) {
      const ph = (t / 1.0) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph * 2), dy = -0.5 + 0.5 * c2;
      P.pos('body', 0, dy, 0).rot('body', 0, s * 3, s * 2.5).sq('body', -0.03 * (1 - c2) * 0.5); plant(P, dy);
      for (const [l, k] of [['legFR', 1], ['legBL', 1], ['legFL', -1], ['legBR', -1]]) { const v = s * k; P.rot(l, -v * 22, 0, 0).pos(l, 0, Math.max(0, v) * 1.6, 0); }
      P.rot('head', 4 - 5 * c2, -s * 5, s * 3).rot('tail', 0, 0, s * 20).rot('tuft', 6 * c2, 0, 0);
      P.burst(0.02, 'dust', 'legFL', [7, 0.5, 8], { n: 1, speed: 0.4, scale: 0.6 }).burst(0.52, 'dust', 'legFR', [-7, 0.5, 8], { n: 1, speed: 0.4, scale: 0.6 });
      drift(P, t, 1.3);
    } },
    // bellow: two snorts of steam, then the head flung up in a roar and a stamp of both front hooves
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const low = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.62, 0.78, E.out));
      const roar = seg(t, 0.7, 0.86, E.back) * (1 - seg(t, 1.5, 1.8, E.inout));
      P.rot('head', 18 * low - 30 * roar + wave(t, 12) * 2 * roar, 0, wave(t, 8) * 3 * roar).rot('jaw', 4 * low + 34 * roar);
      for (const s0 of [0.14, 0.42]) { const k = bump(t, s0, s0 + 0.16); P.rot('head', 6 * k, 0, 0).sq('body', 0.03 * k); P.burst(s0 + 0.03, 'steam', 'head', NOSTRIL_R, { n: 4, dir: [-0.3, -0.4, 1], speed: 1.2 }).burst(s0 + 0.03, 'steam', 'head', NOSTRIL_L, { n: 4, dir: [0.3, -0.4, 1], speed: 1.2 }); }
      const rear = seg(t, 0.68, 0.86, E.out) * (1 - seg(t, 1.12, 1.24, E.in));
      tilt(P, -16 * rear, 14, -11.5, ['legFR', 'legFL']); P.rot('legFR', -30 * rear, 0, 0).rot('legFL', -24 * rear, 0, 0);
      const slam = wob(t, 1.24, 1, 4, 6);
      P.sq('body', 0.06 * roar * (1 - seg(t, 0.86, 1.0)) - 0.08 * Math.max(0, slam));
      P.rot('tuft', -30 * roar, 0, 0).scl('body', 1 + 0.04 * roar, 1 + 0.04 * roar, 1 + 0.04 * roar);
      P.face('eyes', roar > 0.3 ? 'fierce' : undefined); P.lookW = 1 - roar;
      if (t > 0.86 && t < 1.4) P.stream('steam', 'head', MUZZLE, { rate: 30, dir: [0, 0.4, 1], speed: 1.4, spread: 0.4 });
      P.burst(1.25, 'quake', 'root', [0, 0.5, 12], { n: 6, spread: 1, speed: 1.2 }).burst(1.25, 'rubble', 'root', [0, 1, 12], { n: 6, dir: [0, 1, 0.4], speed: 0.8 });
      drift(P, t, 1 + 2 * roar);
    } },
    // head-down charge: paws the ground and snorts, lowers the horns, thunders forward, tosses its head on impact
    attack: { len: 1.7, next: 'idle', f(P, t) {
      const paw = (k) => bump(t, k, k + 0.16);
      const p1 = paw(0.02), p2 = paw(0.2);
      P.rot('legFR', -26 * (p1 + p2), 0, 0).pos('legFR', 0, 2.2 * (p1 + p2), 0);
      P.burst(0.17, 'dust', 'legFR', [-7, 0.5, 9], { n: 3, dir: [0, 0.3, -1], speed: 0.8, scale: 0.7 }).burst(0.35, 'dust', 'legFR', [-7, 0.5, 9], { n: 3, dir: [0, 0.3, -1], speed: 0.8, scale: 0.7 });
      P.burst(0.3, 'steam', 'head', NOSTRIL_R, { n: 3, dir: [-0.2, -0.5, 1] }).burst(0.3, 'steam', 'head', NOSTRIL_L, { n: 3, dir: [0.2, -0.5, 1] });
      const lower = seg(t, 0.2, 0.42, E.inout) * (1 - seg(t, 0.74, 0.9, E.inout));
      const coil = seg(t, 0.3, 0.46, E.inout) * (1 - seg(t, 0.46, 0.52, E.in));
      const run = seg(t, 0.48, 0.64, E.in), back = seg(t, 0.95, 1.6, E.inout);
      P.pos('root', 0, 0, -2.5 * coil + 20 * run * (1 - back) + wob(t, 0.64, -1.2, 3, 7));
      P.rot('head', 30 * lower, 0, 0).rot('body', 3 * lower - 4 * coil, 0, 0);
      const toss = seg(t, 0.64, 0.72, E.out) * (1 - seg(t, 0.78, 1.0, E.inout));
      P.rot('head', -44 * toss, 0, 0).rot('body', -6 * toss, 0, 0);
      const dy = -1.2 * coil - 0.6 * lower; P.pos('body', 0, dy, 0); plant(P, dy);
      P.sq('body', -0.08 * coil + 0.08 * run * (1 - seg(t, 0.6, 0.68)) + wob(t, 0.64, -0.07, 4, 7));
      if (t > 0.48 && t < 0.64) { const g = Math.sin(t * Math.PI * 2 * 7); P.rot('legFR', -g * 30, 0, 0).rot('legFL', g * 30, 0, 0).rot('legBR', g * 26, 0, 0).rot('legBL', -g * 26, 0, 0); P.stream('dust', 'root', [0, 0.5, -6], { rate: 30, dir: [0, 0.4, -1], speed: 0.8 }); }
      if (t > 0.95 && t < 1.55) { const g = Math.sin((t - 0.95) * Math.PI * 2 * 3); P.rot('legFR', -g * 14, 0, 0).rot('legFL', g * 14, 0, 0).rot('legBR', g * 12, 0, 0).rot('legBL', -g * 12, 0, 0); }
      P.burst(0.64, 'spark', 'head', HORNS, { scale: 1.6 }).burst(0.64, 'star', 'head', HORNS, { n: 5 }).burst(0.64, 'rubble', 'head', HORNS, { n: 6, dir: [0, 1, 1], speed: 0.9 }).burst(0.64, 'ring', 'head', HORNS, { scale: 0.7 });
      P.rot('head', 0, wave(t, 5) * 14 * bump(t, 1.15, 1.6), 0).rot('tuft', -20 * toss, 0, 0);
      P.face('eyes', t > 0.18 && t < 0.9 ? 'fierce' : undefined); P.lookW = 1 - lower;
      drift(P, t, 1 + 2 * run);
    } },
    // special (Geo): rears up on its hind legs, crashes down on both front hooves and drives a shockwave
    // of rock chunks and dust along the ground
    special: { len: 2.1, next: 'idle', f(P, t) {
      const rise = seg(t, 0.08, 0.5, E.out3) * (1 - seg(t, 0.72, 0.84, E.in3));
      const dip = seg(t, 0.0, 0.1, E.inout) * (1 - seg(t, 0.1, 0.2));
      tilt(P, -34 * rise, 14, -11.5, ['legFR', 'legFL']);
      P.rot('legFR', -40 * rise + wave(t, 3) * 12 * rise, 0, 0).rot('legFL', -34 * rise - wave(t, 3) * 12 * rise, 0, 0);
      P.rot('head', -10 * rise + 26 * seg(t, 0.72, 0.84) * (1 - seg(t, 1.0, 1.4)), 0, 0).rot('jaw', 24 * rise);
      const dy = -1.0 * dip; P.pos('body', 0, dy, 0); plant(P, dy, ['legBR', 'legBL']);
      const land = t > 0.84 ? Math.exp(-(t - 0.84) * 6) : 0;
      P.sq('body', -0.12 * land * Math.cos((t - 0.84) * 20) + 0.04 * rise).pos('body', 0, -1.4 * land, 0); plant(P, -1.4 * land);
      P.rot('legBR', 6 * rise, 0, 0).rot('legBL', 6 * rise, 0, 0);
      P.face('eyes', t > 0.05 && t < 1.4 ? 'fierce' : undefined); P.lookW = 1 - rise;
      P.burst(0.84, 'ring', 'root', [0, 0.6, 10], { scale: 1.2 }).burst(0.84, 'quake', 'root', [0, 0.5, 10], { n: 10, spread: 1, speed: 1.6 });
      for (let i = 0; i < 6; i++) {
        const tt = 0.88 + i * 0.07, z = 18 + i * 7;
        P.burst(tt, 'rubble', 'root', [((i % 2) ? 1 : -1) * 2, 0.5, z], { n: 4, dir: [0, 1, 0.3], speed: 1, spread: 0.45 });
        P.burst(tt, 'quake', 'root', [0, 0.5, z], { n: 2, spread: 0.8, speed: 0.6 });
        P.burst(tt + 0.02, 'rock', 'root', [0, 0.5, z], { n: 2, dir: [0, 1, 0], speed: 0.7 });
      }
      P.rot('tuft', -26 * rise + 30 * land, 0, 0);
      drift(P, t, 1 + 2 * rise);
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.22, 0.7, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -6 * k + wob(t, 0.2, 2, 3, 6), 0, wave(t, 14) * 3 * k).sq('body', -0.1 * k);
      P.rot('head', -22 * k, 14 * k, 10 * k).rot('jaw', 20 * k);
      P.face('eyes', t < 0.45 ? 'hurt' : undefined); P.lookW = 1 - k;
      P.burst(0.02, 'rubble', 'body', [-11, 28, 6], { n: 3, dir: [-0.5, 1, 0], speed: 0.8 }).burst(0.02, 'shard', 'body', [11, 28, 6], { n: 5, dir: [0.5, 1, 0] }).burst(0.02, 'spark', 'head', [0, 22, 24], {});
      drift(P, t, 2);
    } },
    // the legs give out — front first, then the rear — and it keels over onto its side with a thud
    faint: { len: 2.3, next: 'down', f(P, t) {
      const wob1 = seg(t, 0, 0.2) * (1 - seg(t, 0.7, 0.85));
      P.rot('body', 0, wave(t, 1.3) * 6 * wob1, wave(t, 1.7) * 5 * wob1).rot('head', 10 * wob1, 0, wave(t, 1.7, 1) * 8 * wob1);
      const front = seg(t, 0.6, 0.9, E.bounce), rear = seg(t, 0.85, 1.15, E.bounce), roll = seg(t, 1.1, 1.5, E.bounce);
      const dy = -7.5 * Math.max(front * 0.7, rear);
      P.pos('body', 0, dy, 0).rot('body', 8 * front - 8 * rear, 0, 0);
      P.rot('legFR', -70 * front, 0, 0).rot('legFL', -70 * front, 0, 0).pos('legFR', 0, -5 * front, 2 * front).pos('legFL', 0, -5 * front, 2 * front);
      P.rot('legBR', 60 * rear, 0, 0).rot('legBL', 60 * rear, 0, 0).pos('legBR', 0, -5 * rear, -1 * rear).pos('legBL', 0, -5 * rear, -1 * rear);
      P.rot('root', 0, 0, -16 * roll).pos('root', 0, 0, 0);
      P.rot('head', 16 * front + 10 * roll, 0, 12 * roll).rot('jaw', 10 * roll);
      P.face('eyes', t < 0.6 ? 'swirl' : 'x'); P.blinkOK = false; P.lookW = 1 - front;
      P.burst(0.9, 'quake', 'root', [0, 0.5, 8], { n: 5, spread: 1 }).burst(1.15, 'quake', 'root', [0, 0.5, -8], { n: 5, spread: 1 }).burst(0.3, 'star', 'head', [0, 32, 18], { n: 5 });
      drift(P, t, 0.6);
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      const br = Math.sin((t / 3) * Math.PI * 2);
      P.pos('body', 0, -7.5 + br * 0.2, 0).rot('body', 0, 0, 0).sq('body', br * 0.015);
      P.rot('legFR', -70, 0, 0).rot('legFL', -70, 0, 0).pos('legFR', 0, -5, 2).pos('legFL', 0, -5, 2);
      P.rot('legBR', 60, 0, 0).rot('legBL', 60, 0, 0).pos('legBR', 0, -5, -1).pos('legBL', 0, -5, -1);
      P.rot('root', 0, 0, -16).rot('head', 26, 0, 12).rot('jaw', 10 + br * 2).rot('tail', 0, 0, wave(t, 0.4) * 6);
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      P.burst(0.5, 'star', 'head', [0, 32, 18], { n: 2 });
      drift(P, t, 0.4);
    } },
    // victory: bucks its hind legs, pronks on all four hooves, then headbangs with the whole pit
    win: { len: 2.3, next: 'idle', f(P, t) {
      const buck = seg(t, 0.05, 0.25, E.out) * (1 - seg(t, 0.32, 0.5, E.inout));
      tilt(P, 16 * buck, 14, 8, ['legBR', 'legBL']); P.rot('legBR', 40 * buck, 0, 0).rot('legBL', 46 * buck, 0, 0).rot('head', 14 * buck, 0, 0);
      const h = t > 0.55 && t < 1.25 ? hop(t - 0.55, 0.7, 5, { crouch: 1.6 }) : { y: 0, sq: 0 };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq); if (h.y < 0) plant(P, h.y);
      if (h.y > 0) for (const l of LEGS) P.rot(l, (l[3] === 'F' ? -14 : 14) * Math.min(1, h.y / 3), 0, 0);
      P.burst(1.24, 'quake', 'root', [0, 0.5, 0], { n: 8, spread: 1, speed: 1.2 });
      const bang = t > 1.3 ? Math.max(0, Math.sin((t - 1.3) * Math.PI * 2 * 2.2)) * (1 - seg(t, 2.0, 2.3)) : 0;
      P.rot('head', 22 * bang - 6, 0, 0).rot('body', 0, 0, wave(t, 1.1) * 3).rot('jaw', 14 * bang).rot('tuft', -30 * bang, 0, 0);
      P.face('eyes', t > 1.3 ? 'content' : t > 0.5 ? 'fierce' : undefined);
      P.burst(1.4, 'note', 'head', [-8, 32, 18], {}).burst(1.62, 'note', 'head', [8, 32, 18], {}).burst(1.86, 'note', 'head', [0, 34, 18], {});
      drift(P, t, 2);
    } },
    // asleep: legs folded under, chin on the ground, a slow deep breath and the ring rising and falling with it
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * Math.PI * 2);
      P.pos('body', 0, -7.0 + br * 0.3, 0).sq('body', -0.02 + br * 0.03);
      P.rot('legFR', -80, 0, 0).rot('legFL', -80, 0, 0).pos('legFR', 0, -5.5, 3).pos('legFL', 0, -5.5, 3);
      P.rot('legBR', 70, 0, 0).rot('legBL', 70, 0, 0).pos('legBR', 0, -5, -2).pos('legBL', 0, -5, -2);
      P.rot('head', 22 + br * 2, 0, 4).rot('jaw', 2).rot('earR', 0, 0, -10).rot('earL', 0, 0, 10).rot('tail', 0, 0, 10);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [6, 30, 20], {}).burst(2.2, 'z', 'head', [6, 30, 20], {});
      if (br > 0.6) P.stream('steam', 'head', MUZZLE, { rate: 2, dir: [0, 0.2, 1], speed: 0.4 });
      drift(P, t, 0.5);
    } },
    // fidget: spots a little flower, lowers its great head, sniffs, and nibbles it with delicate, closed-eyed dignity
    graze: { len: 3.4, next: 'idle', f(P, t) {
      const pop = seg(t, 0.05, 0.35, E.back) * (1 - seg(t, 2.5, 2.7, E.in));
      P.face('flower', t > 0.05 && t < 2.7 ? 'on' : 'off').scl('flower', pop, pop * (1 - 0.6 * seg(t, 1.6, 2.5)), pop);
      P.burst(0.08, 'leaf', 'root', [2, 1, 33], { n: 3, speed: 0.5 });
      const down = seg(t, 0.35, 0.95, E.inout) * (1 - seg(t, 2.6, 3.1, E.inout));
      P.rot('head', 9 * down, 0, 0).rot('body', 3 * down, 0, 0).pos('body', 0, -0.8 * down, 0.6 * down); plant(P, -0.8 * down);
      const sniff = (bump(t, 1.0, 1.12) + bump(t, 1.16, 1.28)) * down;
      P.rot('head', -3 * sniff, 0, 0);
      const chew = t > 1.5 && t < 2.6 ? Math.sin((t - 1.5) * Math.PI * 2 * 2.4) : 0;
      P.rot('jaw', 6 * Math.abs(chew) * down, 3 * chew, 0).rot('head', 0, 0, 2 * chew * down);
      P.burst(1.62, 'petal', 'root', [2, 4, 33], { n: 3, speed: 0.5 }).burst(2.1, 'petal', 'root', [2, 3, 33], { n: 2, speed: 0.4 });
      P.face('eyes', t > 1.4 && t < 2.8 ? 'content' : undefined); P.lookW = 1 - down;
      P.rot('tail', 0, 0, wave(t, 1.2) * 16 * down).rot('earR', 0, 0, -10 * down).rot('earL', 0, 0, 10 * down);
      drift(P, t);
    } },
    // fidget: scrapes the ground with a front hoof, snorts, shakes out its tuft
    paw: { len: 2.0, next: 'idle', f(P, t) {
      for (const k0 of [0.1, 0.45, 0.8]) { const k = bump(t, k0, k0 + 0.3); P.rot('legFR', -28 * k + 30 * bump(t, k0 + 0.12, k0 + 0.3), 0, 0).pos('legFR', 0, 2.4 * k, 0); P.burst(k0 + 0.24, 'dust', 'legFR', [-7, 0.5, 6], { n: 3, dir: [0, 0.3, -1], speed: 0.9, scale: 0.7 }); }
      P.rot('head', 14 * seg(t, 0, 0.3) * (1 - seg(t, 1.2, 1.5)), 0, 0);
      P.burst(1.2, 'steam', 'head', NOSTRIL_R, { n: 4, dir: [-0.3, -0.5, 1], speed: 1.1 }).burst(1.2, 'steam', 'head', NOSTRIL_L, { n: 4, dir: [0.3, -0.5, 1], speed: 1.1 });
      const shake = bump(t, 1.35, 1.85);
      P.rot('head', 0, wave(t, 6) * 16 * shake, wave(t, 6, 1) * 6 * shake).rot('tuft', 0, 0, wave(t, 6) * 20 * shake);
      P.face('eyes', t > 0.1 && t < 1.2 ? 'fierce' : undefined);
      drift(P, t, 1 + shake * 2);
    } },
  },
};
def.anim = anim;
