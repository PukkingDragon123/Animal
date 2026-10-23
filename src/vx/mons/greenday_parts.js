// Shared parts for the Grenaday line (Grenaday → Armagreddon), the Green Day homage: a living
// pineapple hand grenade with a spiky dyed-green punk crop, heavy guyliner eyes and a heart-shaped
// pin ring, growing into a giant nuclear bomb with a zipper mouth and a radioactive core.
// Painters (pineapple segments, bomb steel, seams and stencils, high-top sneakers, checker bands,
// studs, the sticker-bombed blue guitar, bullhorn), guyliner eye maps, punk mouths, particle kinds
// (green blasts, radioactive motes, a mushroom cloud, heart confetti) and the drip-form colour rule.
// Homage only: no logos, no album art, no likeness.
import { shade, gradient, ramp, shift } from './kit.js';
import { region, ell, stroke, stamp, formMap, hsl, fromHsl, gilt, lacquer } from './story_parts.js';
import { defineFx } from '../fx.js';
import { blockEye, arch, shut, slope, flat } from './blockeyes.js';

export { B, L, both, twin, acc, region, ell, stroke, stamp, goldP, silverP, chainP, strapP, beat, env, plant, SPFX } from './story_parts.js';
export { rod } from './raccoon_parts.js';

const side = (f) => f !== 'up' && f !== 'down';
const fill = (p, w, h, fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c != null) p.px(x, y, c); } };

// ---------------------------------------------------------------- palettes
export const G = {
  // the grenade: army olive, pineapple segments
  ol: '#6f8c3a', olHi: '#9cba5a', olLo: '#4c6626', olDeep: '#2c3c16', olPanel: '#7f9c46', olPanelHi: '#a8c868',
  // the bomb: dark gunmetal olive, black nose, red details
  bomb: '#72844a', bombHi: '#9cb070', bombLo: '#4e5e34', bombDeep: '#222c16', nose: '#1e2022', noseHi: '#3a3e44',
  metal: '#8e968a', metalHi: '#d4dcd0', metalLo: '#5a6258', metalDeep: '#30362e',
  // punk hair: dyed electric green with dark roots
  hair: '#22d88c', hairHi: '#9effd0', hairLo: '#0e9a64', hairRoot: '#0c2a22',
  red: '#e0242e', redHi: '#ff6a5a', redLo: '#8a0e1a', white: '#f6f4ee', whiteLo: '#c8c4bc',
  black: '#1c1b20', blackHi: '#3c3a44', blackLo: '#0e0d12',
  glow: '#7dff3a', glowHi: '#e8ffb0', glowLo: '#2ec81a', yellow: '#ffd23a', yellowLo: '#c89a14',
  blue: '#2a64e0', blueHi: '#6aa0ff', blueLo: '#163a8a',
  ink: '#120e10', mouth: '#3a0c14', tongue: '#ff6a80', tongueLo: '#c83a58',
};

// ---------------------------------------------------------------- the grenade
// pineapple segments: a grid of raised blocks, each with a lit top-left bevel, a shaded bottom-right
// and a dark groove; o.panel paints a smooth face panel in the middle of the south face
export function grenP(o = {}) {
  const cw = o.cw || 9, ch = o.ch || 8, base = o.c || G.ol, hi = o.hi || G.olHi, lo = o.lo || G.olLo, deep = o.deep || G.olDeep;
  return (p, w, h, face) => {
    if (face === 'up' || face === 'down') {
      fill(p, w, h, (x, y) => { const gx = x % cw, gy = y % cw; return gx === cw - 1 || gy === cw - 1 ? deep : face === 'down' ? lo : gx < 2 || gy < 2 ? hi : base; });
      return;
    }
    const ox = Math.floor(((w % cw) / 2)), oy = o.oy ?? 1;
    fill(p, w, h, (x, y) => {
      const gx = (((x - ox) % cw) + cw) % cw, gy = (((y - oy) % ch) + ch) % ch, t = y / Math.max(1, h - 1);
      const tone = ramp([hi, base, base, lo], t, x, y);
      if (gx === cw - 1 || gy === ch - 1) return deep;
      if (gx === 0 || gy === 0) return shift(tone, 0.14);
      if (gx === cw - 2 || gy === ch - 2) return shift(tone, -0.14);
      return tone;
    });
    if (o.panel && face === 'south') {
      const pr = o.panel, inside = (x, y) => x >= pr[0] * w && x < pr[2] * w && y >= pr[1] * h && y < pr[3] * h && !((x < pr[0] * w + 2 || x >= pr[2] * w - 2) && (y < pr[1] * h + 2 || y >= pr[3] * h - 2));
      region(p, w, h, inside, (x, y) => ramp([G.olPanelHi, G.olPanel, G.olPanel, G.ol], (y - pr[1] * h) / ((pr[3] - pr[1]) * h), x, y), deep);
    }
    if (o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(hi, 0.1));
  };
}
// the grenade's face: the widest tier's front, pineapple segments at the corners, smooth in the middle
export function grenFaceP(o = {}) {
  const base = grenP(o), inset = o.inset ?? 5;
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face !== 'south') return;
    const r = 3, inside = (x, y) => x >= inset && x < w - inset && !((x < inset + r || x >= w - inset - r) && (y < r - 1 || y >= h - r + 1) && Math.hypot((x < inset + r ? inset + r : w - inset - r - 1) - x, (y < r ? r : h - r - 1) - y) > r);
    region(p, w, h, inside, (x, y) => { const c = ramp([G.olPanelHi, G.olPanel, G.olPanel, G.ol], y / Math.max(1, h - 1), x, y); return (x * 5 + y * 3) % 17 === 0 ? shift(c, -0.06) : c; });
    for (let y = 0; y < h; y++) { if (inside(inset, y)) p.px(inset, y, shift(G.olPanel, 0.12)); if (inside(w - inset - 1, y)) p.px(w - inset - 1, y, shift(G.ol, -0.12)); }
  };
}
// fuze metal: a dull greenish steel with knurled bands
export const metalP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? G.metalHi : face === 'down' ? G.metalDeep : ramp([G.metalHi, G.metal, G.metal, G.metalLo], y / Math.max(1, h - 1), x, y)));
  if (side(face)) for (let x = 0; x < w; x += 2) { p.px(x, h - 1, G.metalDeep); if (h > 4) p.px(x, 1, shift(G.metalHi, 0.1)); }
};
export const spoonP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? G.metalHi : x === 0 ? G.metalHi : ramp([G.metal, G.metalLo], y / Math.max(1, h - 1), x, y))); };
// the heart-shaped pin ring (plane, 12 × 11 px): a red enamel heart loop with a dark rim and a glint
const HEART_RING = [
  '.ooo...ooo..',
  'oRRRo.oRRRo.',
  'oRhRRoRRRRRo',
  'oRR..R...RRo',
  'oR.......RRo',
  '.oR.....RRo.',
  '..oR...RRo..',
  '...oR.RRo...',
  '....oRRo....',
  '.....oo.....',
  '............',
];
export const heartRingP = (p, w) => { const k = Math.max(1, Math.floor(w / 12)); HEART_RING.forEach((r, y) => [...r].forEach((c, x) => { const col = c === 'o' ? '#4a0810' : c === 'R' ? (k > 1 && (x + y) % 3 === 0 ? G.redHi : G.red) : c === 'h' ? '#ffd0c8' : null; if (col) p.rect(x * k, y * k, k, k, col); })); };
// spiky bangs: a band of dyed hair whose bottom edge is cut into jagged points
export const bangsP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? G.hair : face === 'down' ? G.hairLo : ramp([G.hair, G.hair, G.hairLo], y / Math.max(1, h - 1), x, y)));
  if (!side(face)) return;
  for (let x = 0; x < w; x++) {
    const cut = [0, 2, 5, 3, 1, 4, 6, 2, 0, 3][x % 10];
    for (let k = 0; k < cut && k < h - 2; k++) p.px(x, h - 1 - k, 0);
    if (h - 1 - cut >= 0) p.px(x, h - 1 - cut, G.hairLo);
    for (let y = 0; y < h - cut - 1; y++) { const k = (x + (y >> 2)) % 4; if (k === 1) p.px(x, y, G.hairHi); else if (k === 3) p.px(x, y, G.hairLo); }
  }
};
// a spiky lock of dyed hair in three tapering pieces: 0 dark roots → green, 1 green, 2 lime tip
export const spikeP = (k = 0) => (p, w, h, face) => {
  const cols = k === 2 ? [G.hairHi, G.hairHi, G.hair] : k === 1 ? [G.hair, G.hair, G.hairLo] : [G.hairLo, G.hairLo, G.hairRoot];
  fill(p, w, h, (x, y) => {
    if (face === 'up') return k === 2 ? G.hairHi : G.hair;
    if (face === 'down') return G.hairRoot;
    let c = ramp(cols, y / Math.max(1, h - 1), x, y);
    if ((x * 3 + y) % 5 === 0) c = shift(c, -0.16); else if (x === 0) c = shift(c, 0.12);
    return c;
  });
};
// black canvas high-top sneakers with white rubber
export const canvasP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? G.blackHi : ramp([G.blackHi, G.black, G.black, G.blackLo], y / Math.max(1, h - 1), x, y)));
  if (face === 'up') for (let y = 1; y < h - 1; y += 2) { p.px(Math.floor(w / 2) - 1, y, G.white).px(Math.floor(w / 2), y, G.whiteLo); }                 // laces
  if (face === 'east' || face === 'west') { const cx = Math.round(w * 0.35), cy = Math.round(h * 0.4); p.px(cx, cy, G.whiteLo).px(cx + 1, cy, G.white); }   // an eyelet
};
export const soleP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'down' ? G.whiteLo : y === 0 && side(face) ? G.white : side(face) && y === h - 1 ? '#8a8680' : side(face) && h > 2 && y === Math.floor(h / 2) ? G.red : G.white)); };
export const toeCapP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? G.white : y >= h - 1 ? '#8a8680' : (x + y) % 3 === 0 ? G.whiteLo : G.white)); };
export const collarP = (p, w, h, face) => { canvasP(p, w, h, face); if (side(face)) for (let x = 0; x < w; x++) p.px(x, 0, G.white); };
// the arms and legs: dark gunmetal limbs; fingerless gloves
export const limbP = shade('#3a3f36', { top: '#5a6152', bottom: '#22261f' });
export const gloveP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? G.blackHi : ramp([G.blackHi, G.black, G.blackLo], y / Math.max(1, h - 1), x, y)));
  if (side(face)) { for (let x = 0; x < w; x++) p.px(x, h - 1, '#c8a080'); for (let x = 1; x < w; x += 2) p.px(x, h - 2, '#a87a5a'); p.px(1, 1, '#c8ccd8'); }
};
// black-and-white checkerboard (sweatbands, armbands)
export const checkerP = (p, w, h, face) => fill(p, w, h, (x, y) => ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? G.black : face === 'down' ? G.whiteLo : G.white));
// black leather with silver pyramid studs
export const studP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => ramp([G.blackHi, G.black, G.blackLo], y / Math.max(1, h - 1), x, y));
  if (side(face)) for (let x = 1; x < w - 1; x += 3) { const y = Math.floor(h / 2); p.px(x, y, G.metalHi).px(x + 1, y, G.metal).px(x, y + 1 < h ? y + 1 : y, G.metalLo); }
};
export const redP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? G.redHi : ramp([G.redHi, G.red, G.red, G.redLo], y / Math.max(1, h - 1), x, y))); };
// the skinny red tie: a darker centre fold and a diagonal stripe
export const tieP = (p, w, h, face) => { redP(p, w, h, face); if (face === 'south') { for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, G.redLo); for (let k = 0; k < h; k += 5) p.px(0, k, G.black).px(1, k + 1, G.black); } };
export const collarPlaneP = (p, w, h) => {      // two white shirt-collar points either side of the knot
  for (const s of [0, 1]) for (let y = 0; y < h; y++) { const n = Math.round((1 - y / h) * w * 0.32); for (let i = 0; i < n; i++) { const x = s ? w - 1 - i : i; p.px(x, y, i === n - 1 ? G.whiteLo : G.white); } }
};
// a round punk badge (south face): a coloured disc with a little mark
export const badgeP = (c, mark) => (p, w, h, face) => {
  if (face !== 'south') { fill(p, w, h, () => G.metal); return; }
  region(p, w, h, ell(w / 2, h / 2, w / 2, h / 2), (x, y) => (y < h * 0.35 ? shift(c, 0.2) : c), shift(c, -0.4));
  if (mark === 'x') { stroke(p, [[w * 0.3, h * 0.3], [w * 0.7, h * 0.7]], G.white, 1); stroke(p, [[w * 0.7, h * 0.3], [w * 0.3, h * 0.7]], G.white, 1); }
  if (mark === 'heart') region(p, w, h, (x, y) => { const u = ((x + 0.5) / w - 0.5) * 3.2, v = ((y + 0.5) / h - 0.45) * 3.2; return (u * u + v * v - 0.6) ** 3 - u * u * v * v * v * 1.3 < 0; }, G.red);
  if (mark === 'dot') region(p, w, h, ell(w / 2, h / 2, w * 0.18, h * 0.18), G.black);
};
// the sticker-bombed blue electric guitar: blue body, white pickguard, stickers, chrome bits
export const guitarBodyP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? G.blueHi : ramp([G.blueHi, G.blue, G.blue, G.blueLo], y / Math.max(1, h - 1), x, y)));
  if (face !== 'south' && face !== 'north') return;
  const S = [[0.12, 0.18, 0.22, 0.14, G.white], [0.62, 0.1, 0.26, 0.16, G.yellow], [0.08, 0.64, 0.24, 0.18, G.red], [0.66, 0.7, 0.22, 0.16, G.hair], [0.3, 0.84, 0.3, 0.12, '#ff8ad0']];
  for (const [u, v, sw, sh, c] of S) for (let y = Math.round(v * h); y < Math.round((v + sh) * h); y++) for (let x = Math.round(u * w); x < Math.round((u + sw) * w); x++) p.px(x, y, (x + y) % 4 === 0 ? shift(c, -0.2) : c);
  if (face === 'south') {
    region(p, w, h, (x, y) => x > w * 0.36 && x < w * 0.66 && y > h * 0.3 && y < h * 0.8, G.white, G.whiteLo);         // pickguard
    for (const yy of [0.4, 0.58]) { const y = Math.round(yy * h); for (let x = Math.round(w * 0.4); x < Math.round(w * 0.62); x++) p.px(x, y, G.black); }
    for (let x = Math.round(w * 0.4); x < Math.round(w * 0.62); x++) p.px(x, Math.round(h * 0.76), G.metalHi);    // bridge
    for (const dx of [0.45, 0.5, 0.55]) for (let y = 0; y < Math.round(h * 0.76); y++) if (y % 3) p.px(Math.round(dx * w), y, '#e8e4dc');
  }
};
export const neckP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'south' || face === 'north' ? (y % 4 === 0 ? '#d8d0c0' : '#e0b070') : '#a0703a')); if (face === 'south') for (let y = 2; y < h; y += 8) p.px(Math.floor(w / 2), y, G.black); };
export const headstockP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'south' || face === 'north' ? G.blue : G.blueLo)); if (face === 'south') for (let y = 1; y < h; y += 2) p.px(0, y, G.metalHi); };
// a white bullhorn with a red band and a black grille
export const hornP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? G.white : ramp([G.white, G.white, G.whiteLo], y / Math.max(1, h - 1), x, y))); if (side(face)) for (let x = 0; x < w; x++) p.px(x, 1, G.red); };
export const grilleP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'south' ? ((x + y) % 2 ? G.black : '#3a3a44') : G.white)); };

// ---------------------------------------------------------------- the bomb
// bomb steel: dark gunmetal olive with a riveted seam band; o.seams: [t, …] rows (0..1) that get rivets
export function bombP(o = {}) {
  const c = o.c || G.bomb, hi = o.hi || G.bombHi, lo = o.lo || G.bombLo;
  return (p, w, h, face) => {
    fill(p, w, h, (x, y) => {
      if (face === 'up') return shift(hi, -0.06);
      if (face === 'down') return G.bombDeep;
      let col = ramp([hi, c, c, lo], y / Math.max(1, h - 1), x, y);
      if (x === 0 || x === w - 1) col = shift(col, -0.08);
      if ((x * 7 + y * 3) % 23 === 0) col = shift(col, 0.06);                  // worn paint flecks
      return col;
    });
    if (!side(face)) return;
    for (const t of o.seams || []) {
      const y = Math.round(t * (h - 1));
      for (let x = 0; x < w; x++) { p.px(x, y, G.bombDeep); if (y + 1 < h) p.px(x, y + 1, shift(hi, 0.06)); }
      for (let x = 2; x < w - 1; x += 5) { if (y - 2 >= 0) { p.px(x, y - 2, G.metalHi); p.px(x + 1, y - 2, G.metalLo); } if (y + 3 < h) { p.px(x, y + 3, G.metalHi); p.px(x + 1, y + 3, G.metalLo); } }
    }
    if (o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(hi, 0.1));
  };
}
// the black nose cone with yellow-and-black hazard stripes round its top
export const noseP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? G.noseHi : face === 'down' ? G.blackLo : ramp([G.noseHi, G.nose, G.blackLo], y / Math.max(1, h - 1), x, y)));
  if (side(face)) for (let y = 0; y < Math.min(h, 4); y++) for (let x = 0; x < w; x++) p.px(x, y, ((x + y) >> 1) % 3 === 0 ? G.black : y === 0 ? shift(G.yellow, 0.2) : G.yellow);
};
// the tail fins: dark plates with red-painted tips and bolts
export const finP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? G.red : face === 'down' ? G.bombDeep : y < 3 ? (y === 0 ? G.redHi : G.red) : ramp([G.bombHi, G.bomb, G.bombLo], y / Math.max(1, h - 1), x, y)));
  if (side(face)) for (let x = 2; x < w - 1; x += 4) p.px(x, h - 2, G.metalHi);
};
// a glowing radioactive vent / core (glow planes and cubes)
export const coreP = (p, w, h, face) => fill(p, w, h, (x, y) => { const d = Math.hypot((x + 0.5) / w - 0.5, (y + 0.5) / h - 0.5); return d < 0.2 ? G.glowHi : (x + y) % 4 === 0 ? G.glowLo : G.glow; });
export const ventP = (p, w, h, face) => fill(p, w, h, (x, y) => (y % 3 === 2 ? G.bombDeep : x === 0 || x === w - 1 ? G.glowLo : y % 3 === 0 ? G.glowHi : G.glow));
// a red hand-painted heart sticker with drips (south face over a base painter)
export function heartSticker(base, o = {}) {
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face !== (o.face || 'south')) return;
    const cx = o.cx * w, cy = o.cy * h, s = o.s * w;
    const inside = (x, y) => { const u = (x + 0.5 - cx) / s, v = (y + 0.5 - cy) / s; return (u * u + v * v - 0.6) ** 3 - u * u * v * v * v * 1.4 < 0; };
    region(p, w, h, inside, (x, y) => (x < cx - s * 0.3 && y < cy ? G.redHi : (x + y) % 6 === 0 ? G.redLo : G.red), G.redLo);
    for (const dx of [-0.35, 0.1, 0.4]) { const x = Math.round(cx + dx * s); let len = 2 + Math.round(Math.abs(dx) * 6); for (let k = 0; k < len; k++) p.px(x, Math.round(cy + s * 0.9) + k, k === len - 1 ? G.redLo : G.red); }
  };
}
// white military stencil digits (5 × 7 px glyphs) painted on a face
const GL = {
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  2: ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
};
export function stencil(base, text, o = {}) {
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face !== (o.face || 'east')) return;
    let x0 = Math.round(o.x * w), y0 = Math.round(o.y * h);
    for (const ch of text) { (GL[ch] || []).forEach((r, j) => [...r].forEach((c, i) => { if (c === '#' && (i + j) % 7 !== 3) p.px(x0 + i, y0 + j, o.c || '#e8e4d8'); })); x0 += 6; }
  };
}
// the radiation trefoil (a hazard sign, not a logo): black blades on a yellow disc
export function trefoil(base, o = {}) {
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face !== (o.face || 'north')) return;
    const cx = o.cx * w, cy = o.cy * h, R = o.r * w;
    region(p, w, h, ell(cx, cy, R, R), (x, y) => {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx, dy), a = ((Math.atan2(dy, dx) * 180) / Math.PI + 450) % 120;
      return r < R * 0.18 ? G.black : r > R * 0.3 && r < R * 0.86 && a > 30 && a < 90 ? G.black : G.yellow;
    }, G.yellowLo);
  };
}

// ---------------------------------------------------------------- faces
// Hand-drawn eyes (creature_rules §7 / §9). Grenaday: a tall rounded white eye, a shaded green iris on
// the inner side (darker at the top) with a black pupil, a 2 × 2 highlight and a glint; heavy guyliner —
// a thick lid line that flicks out at the outer corner, an under-lash and a smoky smudge.
const GE = { w: 13, h: 12, eye: [2, 3, 11, 9], cut: [1, 2, 2, 2], under: true, smudge: true, iris: [5, 3, 10, 10], dark: 2, pupil: [7, 5, 9, 8], hi: [[6, 5], [7, 5], [6, 6], [7, 6]], glint: [[9, 9]], t: 2, wing: [[0, 0], [0, 1], [1, 1]] };
export const GUYLINER = {
  line: '#0e0a10', pupilColor: '#0a0c08', iris: '#56c23a', irisDark: '#246a1e', accent: '#4a3446',
  map: {
    open: blockEye(GE, flat(1)),
    smug: blockEye(GE, flat(4), { pupil: [8, 6, 10, 8], hi: [[7, 6]] }),
    angry: blockEye(GE, slope(1, 1, 11, 5), { pupil: [8, 6, 10, 9], hi: [[7, 7], [8, 7]] }),
    sad: blockEye(GE, slope(1, 5, 11, 2), { pupil: [6, 6, 8, 9], hi: [[6, 6], [7, 6]], wing: [[0, 6], [0, 7]] }),
    shock: blockEye(GE, flat(0), { noIris: true, pupil: [6, 6, 7, 7], hi: [], glint: [], wing: [] }),
    wide: blockEye(GE, flat(0), { iris: [5, 4, 9, 9], pupil: [6, 5, 8, 7], hi: [[6, 5]], glint: [[8, 8]], wing: [] }),
    sleepy: blockEye(GE, flat(6), { hi: [] }),
    happy: arch(GE, 1, 11, 8, 4, 2, [[0, 8], [0, 9]]),
    closed: shut(GE, 1, 11, 6, 2, 1, [[0, 6], [0, 5]]),
  },
};
// Armagreddon: a wide menacing slit block, a neon two-tone iris, a tall slit pupil, a heavier lid
const BE = { w: 18, h: 14, eye: [2, 3, 17, 11], cut: [1, 3, 2, 3], under: true, smudge: true, iris: [8, 3, 16, 11], dark: 2, pupil: [11, 4, 13, 10], hi: [[9, 4], [10, 4], [9, 5], [10, 5]], glint: [[15, 10], [14, 10]], t: 2, wing: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]] };
export const BOMB_EYES = {
  line: '#0c080c', pupilColor: '#081006', iris: '#7aff3a', irisDark: '#1e8a14', accent: '#3a2a3c',
  map: {
    open: blockEye(BE, slope(1, 1, 17, 2)),
    smug: blockEye(BE, flat(5), { pupil: [12, 6, 14, 10], hi: [[10, 7], [11, 7]] }),
    angry: blockEye(BE, slope(1, 1, 17, 7), { pupil: [12, 6, 14, 11], hi: [[10, 8], [11, 8]] }),
    sad: blockEye(BE, slope(1, 6, 17, 2), { pupil: [9, 6, 11, 11], hi: [[8, 6], [9, 6]], wing: [[0, 7], [0, 8]] }),
    shock: blockEye(BE, flat(1), { noIris: true, pupil: [9, 6, 10, 7], hi: [], glint: [], wing: [] }),
    wide: blockEye(BE, flat(1), { iris: [7, 3, 13, 11], pupil: [9, 4, 11, 8], hi: [[8, 4], [8, 5]], glint: [[12, 10]], wing: [] }),
    sleepy: blockEye(BE, flat(7), { hi: [] }),
    happy: arch(BE, 1, 17, 9, 4, 2, [[0, 9], [0, 10]]),
    closed: shut(BE, 1, 17, 7, 2, 1, [[0, 7], [0, 6]]),
  },
};
// punk mouths (15 × 8) in flat blocks: l line, m mouth, t tongue, T dark tongue, w teeth, W tooth gap
const MP = { l: '#140a0e', m: '#3a0c14', t: '#ff6a80', T: '#c83a58', w: '#fbf6ec', W: '#d8d0c4' };
export const MOUTHS = {
  smirk: ['...............', '...............', '.............l.', '...........lll.', '.llllllllllll..', '....ww.........', '....w..........', '...............'],
  grin: ['...............', '.ll.........ll.', '..wwwwwwwwwww..', '..mmmmmmmmmmm..', '...mmmtttmmm...', '....mtttttm....', '...............', '...............'],
  shout: ['...............', '...wwwwwwwww...', '..mmmmmmmmmmm..', '..mmmmmmmmmmm..', '..mmmmmmmmmmm..', '..mmmmtttmmmm..', '...mmtttttmm...', '....mmmmmmm....'],
  grit: ['...............', '..lllllllllll..', '..wwwlwwwlwww..', '..wwwlwwwlwww..', '..lllllllllll..', '...............', '...............', '...............'],
  o: ['...............', '...............', '.....mmmmm.....', '....mmmmmmm....', '....mmmtmmm....', '.....mmmmm.....', '...............', '...............'],
  frown: ['...............', '...............', '.....lllll.....', '...lll...lll...', '..ll.......ll..', '...............', '...............', '...............'],
  tongue: ['...............', '...............', '..lllllllllll..', '.....ttttt.....', '.....tTttt.....', '.....tTttt.....', '......ttt......', '...............'],
};
export const MOUTH_STATES = Object.keys(MOUTHS);
export const mouthPainter = (state, scale = 1) => (p, w, h) => {
  const rows = MOUTHS[state], k = scale;
  rows.forEach((r, j) => [...r].forEach((c, i) => { const col = MP[c]; if (!col) return; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) p.px(i * k + a, j * k + b, col); }));
};
// a mouth slot: one plane per state on a bone; at = centre, size from the 15 × 8 map (× scale) at ppu 3
export function mouthPlanes(at, def = 'smirk', scale = 1) {
  const w = (15 * scale) / 3, h = (8 * scale) / 3;
  const cubes = MOUTH_STATES.map((s) => ({ o: [at[0] - w / 2, at[1] - h / 2, at[2]], s: [w, h, 0], plane: 'z', tex: mouthPainter(s, scale), id: 'm-' + s, hide: s !== def, outline: false }));
  return { cubes, slot: { default: def, states: Object.fromEntries(MOUTH_STATES.map((s) => [s, ['m-' + s]])) } };
}

// ---------------------------------------------------------------- the zipper mouth (Armagreddon)
// 42 × 12 px. 'zip': closed, a row of interlocking silver teeth between dark stitched lips; 'half' and
// 'open' unzip from the left, showing the glowing core inside (the glow plane behind shows through
// the transparent gap); 'grin' is unzipped in the middle with the corners still closed.
export function zipperP(state) {
  return (p, w, h) => {
    const cy = Math.floor(h / 2), open = state === 'zip' ? 0 : state === 'half' ? 0.55 : state === 'grin' ? 0.8 : 1;
    const gap = (x) => {                           // half-height of the opening at column x
      const u = (x + 0.5) / w;
      if (state === 'grin') return u > 0.12 && u < 0.88 ? Math.round(Math.sin(((u - 0.12) / 0.76) * Math.PI) * (h * 0.38)) : 0;
      const k = Math.max(0, Math.min(1, (open - u) / 0.25 + 0.4));
      return Math.round(k * Math.sin(Math.min(1, u / Math.max(0.2, open)) * Math.PI) * (h * 0.42)) * (u < open ? 1 : 0);
    };
    for (let x = 0; x < w; x++) {
      const g = gap(x), top = cy - g, bot = cy + g + (g ? 1 : 0);
      // lips: dark stitched edges hugging the teeth rows
      for (const [y, s] of [[top - 2, -1], [bot + 1, 1]]) { if (y >= 0 && y < h) p.px(x, y, '#1a1416'); if (y - s >= 0 && y - s < h && x % 3 === 0) p.px(x, y - s, '#3a3034'); }
      // zipper teeth: alternating silver blocks above and below the seam
      if (g === 0) { p.px(x, cy - 1, x % 2 ? G.metalHi : G.metalLo); p.px(x, cy, x % 2 ? G.metalLo : G.metalHi); }
      else { if (top - 1 >= 0) p.px(x, top - 1, x % 2 ? G.metalHi : '#1a1416'); if (bot < h) p.px(x, bot, x % 2 ? '#1a1416' : G.metalHi); }
    }
  };
}
export const ZIP_STATES = ['zip', 'half', 'grin', 'open'];
// the glowing core seen through the unzipped mouth: fills exactly the opening of zipperP(state)
export function zipperGlowP(state) {
  return (p, w, h) => {
    const cy = Math.floor(h / 2), open = state === 'half' ? 0.55 : 1;
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w;
      let g;
      if (state === 'grin') g = u > 0.12 && u < 0.88 ? Math.round(Math.sin(((u - 0.12) / 0.76) * Math.PI) * (h * 0.38)) : 0;
      else { const k = Math.max(0, Math.min(1, (open - u) / 0.25 + 0.4)); g = Math.round(k * Math.sin(Math.min(1, u / Math.max(0.2, open)) * Math.PI) * (h * 0.42)) * (u < open ? 1 : 0); }
      for (let y = cy - g; y <= cy + g; y++) { const d = Math.abs(y - cy) / Math.max(1, g); p.px(x, y, d < 0.35 ? G.glowHi : d < 0.75 ? G.glow : G.glowLo); }
    }
  };
}

// ---------------------------------------------------------------- particles
const blastSpr = (cols) => (p, w, h, f) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = Math.atan2(y - c, x - c), r = Math.hypot(x - c, y - c), R = c * (0.76 + 0.24 * Math.abs(Math.sin(a * 5 + f * 1.3)));
    if (r > R) continue;
    p.px(x, y, r < R * 0.34 ? cols[0] : r < R * 0.58 ? cols[1] : r < R * 0.8 ? cols[2] : cols[3]);
  }
};
const moteSpr = (cols) => (p) => { p.px(1, 0, cols[1]); p.px(0, 1, cols[1]); p.px(1, 1, cols[0]); p.px(2, 1, cols[2]); p.px(1, 2, cols[2]); };
const mushSpr = (cols) => (p, w, h) => {
  // a mushroom cloud: a billowing cap on a column, a ring round the stem
  const cap = (x, y) => { const u = (x + 0.5) / w - 0.5, v = (y + 0.5) / h - 0.3; return (u / 0.46) ** 2 + (v / 0.22) ** 2 < 1 + 0.18 * Math.sin(x * 1.3) ; };
  const stem = (x, y) => Math.abs((x + 0.5) / w - 0.5) < 0.1 + ((y + 0.5) / h - 0.5) * 0.18 && (y + 0.5) / h > 0.4;
  const ring = (x, y) => { const u = (x + 0.5) / w - 0.5, v = (y + 0.5) / h - 0.66; return (u / 0.28) ** 2 + (v / 0.05) ** 2 < 1; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!(cap(x, y) || stem(x, y) || ring(x, y))) continue;
    const v = (y + 0.5) / h, lit = (x + 0.5) / w < 0.45;
    p.px(x, y, cap(x, y) ? (v < 0.16 ? cols[0] : lit ? cols[1] : (x + y) % 3 ? cols[2] : cols[1]) : stem(x, y) ? (v > 0.86 ? cols[0] : cols[2]) : cols[3]);
  }
};
const heartSpr = (c) => (p, w, h) => { const m = (w - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x - m) / (w / 2), v = (y - h * 0.38) / (h / 2); if ((u * u + v * v - 0.6) ** 3 - u * u * v * v * v * 1.4 < 0) p.px(x, y, x < m - 1 && y < h / 2 ? shift(c, 0.4) : c); } };
const bitSpr = (p, w, h, f) => { if (f) { p.rect(0, 0, 3, 2, G.olHi); p.px(2, 2, G.olDeep); p.px(0, 2, G.ol); } else { p.rect(0, 1, 2, 3, G.metal); p.px(2, 0, G.metalHi); p.px(1, 0, G.metalLo); } };
const ringSpr = (cols) => (p, w, h) => { const m = (w - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - m, (y - m) * 1.0), a = Math.atan2(y - m, x - m), R = m - 1.5 + ((Math.round((a / Math.PI) * 10) % 2) ? 1 : -0.4); if (Math.abs(d - R) < 1.2) p.px(x, y, d > R ? cols[0] : cols[1]); } };
const GREEN = ['#ffffff', '#e8ffb0', '#7dff3a', '#2ec81a'], BLUE = ['#ffffff', '#c8ecff', '#5aa8ff', '#2a5aff'];
export const GDFX = {
  boom: defineFx('gd-boom', { w: 32, h: 32, frames: [0, 1].map((f) => (p, w, h) => blastSpr(['#ffffff', '#fff0a0', '#ffb030', '#ff5a18'])(p, w, h, f)), glow: true, life: [0.32, 0.4], size: [0.2, 1.4], speed: [0, 0], grav: 0, fps: 10, pop: true }),
  boomBlue: defineFx('gd-boom-blue', { w: 32, h: 32, frames: [0, 1].map((f) => (p, w, h) => blastSpr(BLUE)(p, w, h, f)), glow: true, life: [0.32, 0.4], size: [0.2, 1.4], speed: [0, 0], grav: 0, fps: 10, pop: true }),
  nuke: defineFx('gd-nuke', { w: 32, h: 32, frames: [0, 1].map((f) => (p, w, h) => blastSpr(GREEN)(p, w, h, f)), glow: true, life: [0.4, 0.5], size: [0.3, 2.6], speed: [0, 0], grav: 0, fps: 10, pop: true }),
  nukeBlue: defineFx('gd-nuke-blue', { w: 32, h: 32, frames: [0, 1].map((f) => (p, w, h) => blastSpr(BLUE)(p, w, h, f)), glow: true, life: [0.4, 0.5], size: [0.3, 2.6], speed: [0, 0], grav: 0, fps: 10, pop: true }),
  rad: defineFx('gd-rad', { w: 3, h: 3, paint: moteSpr(['#ffffff', '#c8ff8a', '#4ae02a']), glow: true, life: [0.6, 1.2], size: [0.05, 0.02], speed: [0.3, 1.0], grav: -0.6, drag: 1, spread: 1, wob: 1 }),
  radBlue: defineFx('gd-rad-blue', { w: 3, h: 3, paint: moteSpr(['#ffffff', '#8ae0ff', '#3a7aff']), glow: true, life: [0.6, 1.2], size: [0.05, 0.02], speed: [0.3, 1.0], grav: -0.6, drag: 1, spread: 1, wob: 1 }),
  spark: defineFx('gd-spark', { w: 3, h: 3, paint: moteSpr(['#ffffff', '#fff2a0', '#ff9a20']), glow: true, life: [0.15, 0.35], size: [0.035, 0.015], speed: [1.2, 2.6], grav: 5, drag: 1, spread: 0.8 }),
  sparkBlue: defineFx('gd-spark-blue', { w: 3, h: 3, paint: moteSpr(['#ffffff', '#c8ecff', '#5aa0ff']), glow: true, life: [0.15, 0.35], size: [0.035, 0.015], speed: [1.2, 2.6], grav: 5, drag: 1, spread: 0.8 }),
  mushroom: defineFx('gd-mushroom', { w: 24, h: 26, paint: mushSpr(['#ffffff', '#e8ffb0', '#8ae04a', '#4aa82a']), glow: true, life: [1.1, 1.3], size: [0.25, 1.3], speed: [0.4, 0.5], grav: -0.6, drag: 1.2, spread: 0, fade: true }),
  mushroomBlue: defineFx('gd-mushroom-blue', { w: 24, h: 26, paint: mushSpr(['#ffffff', '#c8ecff', '#6ab0ff', '#2a5ad0']), glow: true, life: [1.1, 1.3], size: [0.25, 1.3], speed: [0.4, 0.5], grav: -0.6, drag: 1.2, spread: 0, fade: true }),
  heart: defineFx('gd-heart', { w: 7, h: 6, paint: heartSpr('#ff3a4a'), life: [0.9, 1.4], size: [0.06, 0.06], speed: [1, 2.2], grav: 3, drag: 1.6, spread: 1, flutter: true }),
  heartGold: defineFx('gd-heart-gold', { w: 7, h: 6, paint: heartSpr('#ffd23a'), life: [0.9, 1.4], size: [0.06, 0.06], speed: [1, 2.2], grav: 3, drag: 1.6, spread: 1, flutter: true }),
  bits: defineFx('gd-bits', { w: 3, h: 4, frames: [0, 1].map((f) => (p, w, h) => bitSpr(p, w, h, f)), life: [0.6, 1.0], size: [0.05, 0.05], speed: [1.6, 3.2], grav: 8, drag: 0.5, spread: 0.8, spin: 9 }),
  shock: defineFx('gd-shock', { w: 40, h: 40, paint: ringSpr(['#7dff3a', '#e8ffb0']), glow: true, life: [0.35, 0.35], size: [0.15, 1.6], speed: [0, 0], grav: 0, fade: true }),
  shockBlue: defineFx('gd-shock-blue', { w: 40, h: 40, paint: ringSpr(['#5aa8ff', '#e0f4ff']), glow: true, life: [0.35, 0.35], size: [0.15, 1.6], speed: [0, 0], grav: 0, fade: true }),
};

// ---------------------------------------------------------------- the ultra-drip form
// the grenade turns to polished gold with black-lacquered grooves; the dyed hair goes black with
// gold tips; the heart ring is black enamel; radioactive green burns electric blue
export const gdForm = formMap(({ h, s, l }, glow) => {
  if (glow) return s > 0.25 && h > 70 && h < 170 ? fromHsl(205, Math.min(1, s), Math.min(0.95, Math.max(0.5, l))) : undefined;
  if (s < 0.14) return 'keep';
  if (h > 88 && h < 170 && s > 0.55) return l > 0.66 ? 'gold' : 'black';              // dyed hair: black, lime tips → gold
  if (h >= 60 && h <= 100) return l < 0.24 ? 'black' : 'gold';                          // olive steel → gold, grooves → black
  if (h > 200 && h < 250 && s > 0.5) return l > 0.55 ? '#e8eef8' : lacquer(l);           // the blue guitar → black and pearl
  return undefined;
});
// the bomb's luxury form: black-lacquered steel, gold fin tips, heart, rivets and zipper; blue core
export const bombForm = formMap(({ h, s, l }, glow) => {
  if (glow) return s > 0.25 && h > 70 && h < 170 ? fromHsl(205, Math.min(1, s), Math.min(0.95, Math.max(0.5, l))) : undefined;
  if (s < 0.14) return l > 0.28 && l < 0.86 ? 'gold' : 'keep';                          // steel, rivets and teeth → gold
  if (h > 88 && h < 170 && s > 0.55) return l > 0.66 ? 'gold' : 'black';                // dyed hair: black, tips gold
  if (h >= 60 && h <= 110) return 'black';                                               // olive bomb steel → black lacquer
  if (h < 20 || h > 330) return l < 0.3 ? 'black' : 'gold';                              // red fin tips and the heart → gold
  if (h > 200 && h < 250 && s > 0.5) return l > 0.55 ? '#e8eef8' : lacquer(l);
  return undefined;
});
export const GD_FX_MAP = { 'gd-rad': GDFX.radBlue, 'gd-spark': GDFX.sparkBlue, 'gd-nuke': GDFX.nukeBlue, 'gd-mushroom': GDFX.mushroomBlue, 'gd-heart': GDFX.heartGold, 'gd-shock': GDFX.shockBlue, 'gd-boom': GDFX.boomBlue };
export { gilt, lacquer, hsl, fromHsl };
