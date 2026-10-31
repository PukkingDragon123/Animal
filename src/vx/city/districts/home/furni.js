// Furniture as proper little box models, in the same hand-painted style as the Tokonmon (src/vx/model.js):
// chunky boxes layered like bevels with real proportions, each face painted in code with soft gradients, a lit
// top rim, darker crevices and seams, and a material on top (wood grain, fabric weave, enamel, brass, glass).
//
//   const F = furnish(C, B);                         // once per building
//   const fr = F.put(1, FRIDGE, x, z, 'e', { block: [x0, z0, x1, z1] });   // storey, def, centre, facing
//   fr.open('door', true);                           // swing a door bone open (eased), fr.toggle('glow', on)
//
// Every piece is one Model whose static cubes are baked into one mesh per material (solid / outline hull), so a
// sofa costs two draw calls, not forty. Pieces hang in their storey's interior group, so the cutaway hides them
// with the rest of that floor, and the whole set is hidden while you are outside the house.
// Models face +z at yaw 0 ('s'); 'e' turns the front to +x, 'w' to −x, 'n' to −z. 16 units = 1 m.
import * as THREE from '../../../../../vendor/three.module.js';
import { Model } from '../../../model.js';
import { shift } from '../../../../px/paint.js';

const TAU = Math.PI * 2;
const h2 = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 974634) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
// a ramp of shades for a base colour: R(c)(k) for k in −3…+3 (half steps), cached (shift() is HSL work)
const RC = new Map();
const R = (c) => { let r = RC.get(c); if (!r) { r = []; for (let i = 0; i <= 12; i++) r.push(shift(c, (i - 6) / 2)); RC.set(c, r); } return (k) => r[Math.max(0, Math.min(12, Math.round(k * 2) + 6))]; };
const lum = (face, t) => (face === 'up' ? 0.5 : face === 'down' ? -1.2 : 0.35 - t * 0.9 + (face === 'east' || face === 'west' ? -0.15 : 0));

// ---------------------------------------------------------------- painters (p: Pen, w, h, face) — the house look
/** wood: grain along the face, a soft gradient, a lit top rim and a dark seam (a bevel), now and then a knot */
export const wood = (c, o = {}) => (p, w, h, face) => {
  const S = R(c), seed = o.seed || 3, vert = o.dir === 'v' || (face === 'east' || face === 'west' ? o.dir !== 'h' && o.side !== 'h' : o.dir === 'v');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = h > 1 ? y / (h - 1) : 0.5, a = vert ? x : y, b = vert ? y : x;
    let k = lum(face, t) * 0.7;
    const g = (a + Math.sin(b * 0.18 + a * 0.4 + seed) * 1.6 + 40) % 6;
    if (g < 0.9) k -= 0.55; else if (g < 1.6) k -= 0.2; else if (g > 4.8) k += 0.18;
    if (h2(a >> 1, b >> 3, seed) < 0.06) k -= 0.3;
    p.px(x, y, S(k));
  }
  if (o.knot && face !== 'down') { const kx = Math.floor(w * 0.3), ky = Math.floor(h * 0.55); p.px(kx, ky, S(-1.4)).px(kx + 1, ky, S(-1)).px(kx, ky + 1, S(-1)); }
  bevel(p, w, h, face, S, o.bevel ?? 1);
};
/** enamel / painted wood: smooth gradient, a soft specular streak, crisp highlight rim, darker seam */
export const enamel = (c, o = {}) => (p, w, h, face) => {
  const S = R(c);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = h > 1 ? y / (h - 1) : 0.5; let k = lum(face, t) * 0.55;
    if (face !== 'up' && face !== 'down' && Math.abs(x - y * 0.6 - w * 0.25) < Math.max(1, w * 0.06)) k += 0.45;
    if (h2(x >> 2, y >> 2, 9) < 0.04) k -= 0.12;
    p.px(x, y, S(k));
  }
  bevel(p, w, h, face, S, o.bevel ?? 1);
};
/** fabric: a fine weave, plump gradient (lit top, shaded under), piping along the top edge; pattern: check | stripe | floral | dots | velvet */
export const fabric = (c, o = {}) => (p, w, h, face) => {
  const S = R(c), C2 = o.c2 ? R(o.c2) : null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = h > 1 ? y / (h - 1) : 0.5; let k = lum(face, t) * (o.soft ?? 0.75) + ((x + y) & 1 ? 0.12 : -0.08) * (o.pat === 'velvet' ? 0.3 : 1);
    let cS = S;
    if (C2) {
      if (o.pat === 'check' && (((x >> 2) + (y >> 2)) & 1)) cS = C2;
      else if (o.pat === 'stripe' && (x >> 2) % 3 === 0) cS = C2;
      else if (o.pat === 'dots' && (x % 6 === 2 && y % 6 === 2)) cS = C2;
      else if (o.pat === 'floral' && (Math.hypot((x % 10) - 5, (y % 10) - 5) < 1.8 || ((x % 10) === 5 && (y % 10) > 6))) cS = C2;
    }
    p.px(x, y, cS(k));
  }
  if (face !== 'up' && face !== 'down') { for (let x = 0; x < w; x++) { p.px(x, 0, S(0.9)); p.px(x, h - 1, S(-1.4)); } for (let y = 0; y < h; y++) { p.px(0, y, S(-0.6)); p.px(w - 1, y, S(-0.6)); } }
  if (o.tuft && face === 'up') for (let y = 3; y < h - 2; y += 6) for (let x = 3; x < w - 2; x += 6) { p.px(x, y, S(-1.2)); p.px(x + 1, y + 1, S(0.6)); }
};
/** brushed metal / chrome: vertical streaks and a bright band */
export const metal = (c, o = {}) => (p, w, h, face) => {
  const S = R(c);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = h > 1 ? y / (h - 1) : 0.5; let k = lum(face, t) * 0.5 + (h2(x, 0, 5) - 0.5) * 0.6; if (Math.abs(x - w * 0.3) < Math.max(1, w * 0.08)) k += 0.9; p.px(x, y, S(k)); }
  bevel(p, w, h, face, S, 1);
};
/** glass / jars: light body, white glints, a coloured fill line (o.fill: colour, o.level 0..1) */
export const glass = (c, o = {}) => (p, w, h, face) => {
  const S = R(c), F = o.fill ? R(o.fill) : null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = h > 1 ? y / (h - 1) : 0.5; let col = S(lum(face, t) * 0.4 + 0.5);
    if (F && t > 1 - (o.level ?? 0.6) && face !== 'up') col = F(lum(face, t) * 0.6 + ((x * 3 + y * 5) % 7 === 0 ? -0.6 : 0));
    if (face !== 'up' && face !== 'down' && (x === 1 || x === 2) && y > 1 && y < h - 2) col = '#ffffff';
    p.px(x, y, col);
  }
};
/** a darker seam / bevel round a face, and a lit top edge */
function bevel(p, w, h, face, S, k = 1) {
  if (!k || face === 'down') return;
  if (face === 'up') { for (let x = 0; x < w; x++) { p.px(x, 0, S(0.9)); p.px(x, h - 1, S(-0.4)); } for (let y = 0; y < h; y++) { p.px(0, y, S(0.6)); p.px(w - 1, y, S(-0.4)); } return; }
  for (let x = 0; x < w; x++) { p.px(x, 0, S(1.1)); if (h > 3) p.px(x, 1, S(0.5)); p.px(x, h - 1, S(-1.5)); }
  for (let y = 1; y < h - 1; y++) { p.px(0, y, S(-0.5)); p.px(w - 1, y, S(-0.7)); }
}
/** paint something on one face only (fronts: drawers, panels, labels, screens) */
export const on = (base, faces, fn) => (p, w, h, face, cube) => { base(p, w, h, face, cube); if (faces.includes(face)) fn(p, w, h, face, cube); };
/** a recessed panel (cupboard doors, drawer fronts): a darker groove inset by m texels, lit lower-right lip */
export const panel = (c, m = 3) => (p, w, h) => { const S = R(c); if (w < m * 2 + 2 || h < m * 2 + 2) return; for (let x = m; x < w - m; x++) { p.px(x, m, S(-1.2)); p.px(x, h - m - 1, S(0.8)); } for (let y = m; y < h - m; y++) { p.px(m, y, S(-1.2)); p.px(w - m - 1, y, S(0.6)); } };
/** a row of book spines (colourful, varied heights and bands, a title stripe) */
export const spines = (seed = 1, pal = ['#b83a3a', '#2e5a8a', '#e8b040', '#3a7a4a', '#7a3a6a', '#d87a3a', '#4a8ab0', '#f2e6c8', '#5a3a2a']) => (p, w, h, face) => {
  if (face !== 'south') { wood('#7a5236')(p, w, h, face); return; }
  let x = 0, i = 0;
  p.rect(0, 0, w, h, '#2a1e18');
  while (x < w) {
    const bw = 3 + Math.floor(h2(i, seed, 1) * 4), bh = Math.floor(h * (0.7 + h2(i, seed, 2) * 0.3)), c = pal[Math.floor(h2(i, seed, 3) * pal.length)], S = R(c), lean = h2(i, seed, 4) < 0.08;
    for (let xx = 0; xx < bw && x + xx < w; xx++) for (let y = h - bh; y < h; y++) p.px(x + xx, lean ? Math.min(h - 1, y + 1) : y, S((xx === 0 ? 0.6 : xx === bw - 1 ? -0.9 : 0) + (y === h - bh ? 0.6 : 0)));
    const band = h - bh + Math.floor(bh * 0.2), band2 = h - Math.floor(bh * 0.25);
    for (let xx = 1; xx < bw - 1 && x + xx < w; xx++) { p.px(x + xx, band, S(-1.4)); p.px(x + xx, band2, '#e8c860'); if (bw > 4 && (xx & 1)) p.px(x + xx, h - Math.floor(bh * 0.55), S(1.4)); }
    x += bw + (h2(i, seed, 5) < 0.15 ? 2 : 0); i++;
  }
};

// ---------------------------------------------------------------- model helpers
const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
/** a box with a bevel-like lid: the main body plus a slightly larger thin top slab */
const slabTop = (x0, y0, z0, w, h, d, body, top, t = 1, over = 0.5) => [B([x0, y0, z0], [w, h - t, d], body), B([x0 - over, y0 + h - t, z0 - over], [w + over * 2, t, d + over * 2], top)];
const legs4 = (x0, z0, w, d, hgt, tex, s = 1.4, inset = 0.4) => [[x0 + inset, z0 + inset], [x0 + w - s - inset, z0 + inset], [x0 + inset, z0 + d - s - inset], [x0 + w - s - inset, z0 + d - s - inset]].map(([x, z]) => B([x, 0, z], [s, hgt, s], tex));
const def = (name, bones, o = {}) => ({ name: 'fx_' + name, ppu: o.ppu || 2, res: o.res || 2, scale: 1, outline: o.outline === false ? null : { color: o.ink || '#2a1a14', px: o.px || 1.1 }, bones, live: o.live || [] });

// ---------------------------------------------------------------- the pieces (front faces +z; origin at the floor, centre of the footprint)
const OAK = '#b07a48', WAL = '#7a4a2e', CREAM = '#f4ead4', MINT = '#9cd4c0', BRASS = '#e0b450', IRON = '#3a3a44';
// vintage refrigerator: rounded mint enamel, a chrome lever handle, a door gap, the freezer flap, fridge magnets
export const FRIDGE = (() => {
  const body = enamel(MINT), chrome = metal('#d8dce0'), mag = ['#e8473a', '#f8d84a', '#4a8ad8', '#6ab04a'];
  const doorFront = on(enamel(MINT), ['south'], (p, w, h) => { panel(MINT, 2)(p, w, h); mag.forEach((c, i) => p.rect(4 + i * 5, Math.floor(h * 0.45) + (i & 1) * 4, 3, 3, c)); p.rect(5, Math.floor(h * 0.62), 10, 7, '#f8f4ea'); for (let k = 0; k < 3; k++) p.hl(6, 13, Math.floor(h * 0.62) + 2 + k * 2, '#6a8ab0'); });
  return def('fridge', [
    { name: 'root', pivot: [0, 0, 0], cubes: [B([-5.5, 0, -5], [11, 1.4, 10], wood('#3a2a22')), B([-5.8, 1.4, -5.6], [11.6, 27, 10.6], body), B([-5.4, 28.4, -5.2], [10.8, 1.0, 10.0], body), B([-5.8, 21.0, 5.0], [11.6, 0.4, 0.4], wood('#2a2222'))] },
    { name: 'door', parent: 'root', pivot: [5.8, 2, 5.0], cubes: [B([-5.6, 2.0, 5.0], [11.4, 18.6, 1.2], doorFront), B([3.4, 9, 6.2], [0.8, 6, 1.0], chrome), B([3.0, 14.4, 6.2], [1.6, 0.8, 1.2], chrome)] },
    { name: 'door2', parent: 'root', pivot: [5.8, 21.4, 5.0], cubes: [B([-5.6, 21.4, 5.0], [11.4, 6.6, 1.2], body), B([3.4, 22.4, 6.2], [0.8, 3, 1.0], chrome)] },
    // inside (seen when the door swings open): shelves, milk, jars, a cake
    { name: 'inside', parent: 'root', pivot: [0, 0, 0], cubes: [B([-4.8, 3, 3.4], [9.6, 17, 1.6], enamel('#eef6f4')), B([-4.6, 9, 3.2], [9.2, 0.4, 1.8], glass('#cfe8f0')), B([-4.6, 14, 3.2], [9.2, 0.4, 1.8], glass('#cfe8f0')),
      B([-4, 9.4, 3.4], [2, 3.4, 1.6], glass('#f8f8f4', { fill: '#ffffff', level: 0.9 })), B([-1.2, 9.4, 3.4], [1.8, 2.4, 1.6], glass('#f0f4e8', { fill: '#e8473a', level: 0.6 })), B([1.4, 9.4, 3.4], [2.8, 1.8, 1.6], fabric('#f8e0a0', { c2: '#e8705a', pat: 'stripe' })), B([-3.6, 14.4, 3.4], [3.2, 2.2, 1.6], glass('#e8f0e0', { fill: '#6ab04a', level: 0.7 }))] },
  ], { live: ['door', 'door2'] });
})();
// vintage range: cream enamel, chrome trim, four knobs, an oven door with a window, a pot of curry and a kettle on the hob
export const STOVE = (() => {
  const body = enamel(CREAM), chrome = metal('#c8ccd4'), knob = enamel('#2a2a32');
  const ovenDoor = on(enamel(CREAM), ['south'], (p, w, h) => { panel(CREAM, 2)(p, w, h); p.rect(4, 4, w - 8, Math.floor(h * 0.42), '#2a1e1a'); p.rect(5, 5, w - 10, 2, '#5a4038'); p.hl(5, w - 6, 4 + Math.floor(h * 0.42) - 2, '#e8a050'); });
  const hob = on(enamel('#2a2a32'), ['up'], (p, w, h) => { for (const [cx, cy] of [[0.27, 0.3], [0.73, 0.3], [0.27, 0.72], [0.73, 0.72]]) { const X = Math.round(cx * w), Y = Math.round(cy * h); p.ell(X, Y, 4, 4, '#4a4a54'); p.ell(X, Y, 2, 2, '#1a1a20'); } });
  return def('stove', [
    { name: 'root', pivot: [0, 0, 0], cubes: [
      B([-5.6, 0, -4.6], [11.2, 1.2, 9.2], wood('#2a2222')), B([-5.8, 1.2, -4.8], [11.6, 12.8, 9.6], body), B([-6, 14, -5], [12, 0.6, 10], hob),
      B([-6, 14.6, -5], [12, 4.6, 1.2], on(body, ['south'], (p, w, h) => { p.rect(Math.floor(w * 0.35), 3, Math.floor(w * 0.3), 6, '#e8e2c8'); p.hl(Math.floor(w * 0.38), Math.floor(w * 0.62), 6, '#2a2a32'); })),   // the back guard with its clock
      ...[-4, -1.4, 1.4, 4].map((x) => B([x - 0.6, 11.6, 4.8], [1.2, 1.2, 0.8], knob)), B([-5, 10.6, 4.8], [10, 0.4, 0.4], chrome),
      // the pot (red enamel, a lid with a knob) and a kettle
      B([-4.8, 14.6, -3.6], [4.6, 3.4, 4.0], enamel('#d84a3a')), B([-5.0, 18.0, -3.8], [5.0, 0.5, 4.4], enamel('#b83a2e')), B([-3.0, 18.5, -2.0], [1.0, 0.6, 0.8], knob), B([-6.0, 16.6, -2.2], [1.2, 0.5, 1.0], knob),
      B([1.0, 14.6, 0.4], [3.6, 3.2, 3.2], enamel('#4a8ab0')), B([1.6, 17.8, 1.0], [2.4, 0.6, 2.0], enamel('#3a7aa0')), B([4.6, 15.6, 1.6], [1.6, 0.6, 0.8], enamel('#4a8ab0')), B([2.2, 18.4, 1.6], [1.2, 1.4, 0.8], knob),
    ] },
    { name: 'oven', parent: 'root', pivot: [0, 2.0, 4.8], cubes: [B([-5.4, 2.0, 4.8], [10.8, 8.2, 0.8], ovenDoor), B([-3.6, 9.0, 5.6], [7.2, 0.6, 0.8], chrome)] },
  ], { live: ['oven'] });
})();
// the kitchen hutch: an antique dresser — two cupboard doors and a drawer below, open plate shelves above with
// jars of beans and pasta, three plates on edge, a teapot and a little cactus
export const HUTCH = (() => {
  const W = wood(WAL, { knot: true }), front = on(wood(WAL), ['south'], panel(WAL, 2)), knob = metal(BRASS);
  const jar = (x, y, fill) => B([x, y, 1.6], [2.2, 3.0, 2.2], glass('#e8f0ec', { fill, level: 0.75 })), lid = (x, y, c) => B([x - 0.1, y + 3, 1.5], [2.4, 0.6, 2.4], wood(c));
  const plate = (x, c) => B([x, 22, 0.4], [3.6, 3.6, 0.5], on(enamel('#f8f4ec'), ['south'], (p, w, h) => { p.ell(w / 2, h / 2, w * 0.36, h * 0.36, c); p.ell(w / 2, h / 2, w * 0.22, h * 0.22, '#f8f4ec'); }));
  return def('hutch', [
    { name: 'root', pivot: [0, 0, 0], cubes: [
      ...slabTop(-12, 0, -4.4, 24, 14.4, 8.8, W, wood('#8a5a38'), 1, 0.4), B([-11.6, 0, 4.4], [23.2, 1.2, 0.4], wood('#2a1a14')),
      B([-11.6, 10.2, 4.4], [23.2, 3.2, 0.4], on(wood(WAL), ['south'], (p, w, h) => { panel(WAL, 1)(p, w, h); })), B([-1, 11.2, 4.8], [2, 1, 0.6], knob),
      // the open top: back board, sides, two shelves, a crown moulding
      B([-11, 14, -4.2], [22, 18, 1.0], wood('#8a5a38', { dir: 'v' })), B([-12, 14, -4.2], [1, 18, 5.6], W), B([11, 14, -4.2], [1, 18, 5.6], W),
      B([-11, 21.4, -3.2], [22, 0.6, 4.6], W), B([-11, 27.4, -3.2], [22, 0.6, 4.6], W), B([-12.6, 32, -4.8], [25.2, 1.6, 6.8], wood('#8a5a38')), B([-12, 33.6, -4.4], [24, 0.8, 6], W),
      jar(-10.4, 14.6, '#c8402a'), lid(-10.4, 14.6, '#e8b040'), jar(-7.6, 14.6, '#f0d080'), lid(-7.6, 14.6, '#3a7a4a'), jar(-4.8, 14.6, '#6a3a22'), lid(-4.8, 14.6, '#c83a3a'),
      B([-1.6, 14.6, -1.6], [4.4, 3.2, 3.2], enamel('#e8a0b0')), B([-0.6, 17.8, -0.6], [2.4, 0.8, 1.2], enamel('#d88a9a')), B([2.8, 15.6, -0.4], [1.6, 0.6, 0.6], enamel('#e8a0b0')),
      B([6, 14.6, -1], [2.4, 2.0, 2.4], enamel('#c8704a')), B([6.4, 16.6, -0.6], [1.6, 2.4, 1.6], fabric('#5aa04a')),
      plate(-10.4, '#4a8ab0'), plate(-6.4, '#e8473a'), plate(-2.4, '#4a8ab0'), B([2.2, 22, -2], [7, 2.2, 3], spines(5)),
      B([-10.6, 28.0, -2.6], [3, 3, 3], enamel('#f8f4ec')), B([-6.6, 28.0, -2.6], [3, 2, 3], enamel('#f8f4ec')), B([-2.6, 28.0, -2.6], [5, 2.4, 3], wood('#c89a62')), B([4, 28, -2.6], [6, 3.4, 2.4], spines(8)),
    ] },
    { name: 'doorL', parent: 'root', pivot: [-11.6, 1.2, 4.4], cubes: [B([-11.6, 1.2, 4.4], [11.4, 8.8, 0.8], front), B([-1.6, 5.2, 5.2], [0.8, 0.8, 0.6], knob)] },
    { name: 'doorR', parent: 'root', pivot: [11.6, 1.2, 4.4], cubes: [B([0.2, 1.2, 4.4], [11.4, 8.8, 0.8], front), B([0.8, 5.2, 5.2], [0.8, 0.8, 0.6], knob)] },
  ], { live: ['doorL', 'doorR'] });
})();
// a deep chesterfield-ish sofa: rolled arms, three plump seat cushions, back cushions, tufted, turned legs, pillows and a knitted throw
export const SOFA = (col = '#4a7aa8', pill = ['#f2c84a', '#e8705a'], thr = '#f2d68a') => {
  const F = fabric(col, { tuft: true }), F2 = fabric(shift(col, 0.4)), leg = wood('#5a3a24');
  return def('sofa' + col, [{ name: 'root', pivot: [0, 0, 0], cubes: [
    ...legs4(-15, -6.4, 30, 12.8, 2.2, leg, 1.4, 0.8),
    B([-15, 2.2, -6.4], [30, 5.0, 12.8], F), B([-15, 7.2, -6.4], [30, 7.6, 4.0], F),                         // base and back
    B([-16.6, 2.2, -6.6], [4.0, 8.6, 13.2], F2), B([12.6, 2.2, -6.6], [4.0, 8.6, 13.2], F2),               // rolled arms
    B([-17.0, 9.0, -6.8], [4.8, 2.4, 13.6], F2), B([12.2, 9.0, -6.8], [4.8, 2.4, 13.6], F2),
    ...[-12.4, -4.1, 4.2].map((x) => B([x, 7.2, -2.4], [8.2, 2.4, 8.8], fabric(shift(col, 0.25), { tuft: true }))),   // seat cushions
    ...[-12.4, -4.1, 4.2].map((x) => B([x, 9.6, -3.2], [8.2, 6.8, 2.4], fabric(shift(col, 0.25)), { pivot: [x + 4, 9.6, -2.6], rot: [-8, 0, 0] })),
    B([-12, 9.4, -0.6], [5.4, 5.4, 2.0], fabric(pill[0], { c2: '#ffffff', pat: 'dots' }), { pivot: [-9.3, 9.4, 0.4], rot: [-14, 8, -6] }),
    B([6.8, 9.4, -0.6], [5.4, 5.4, 2.0], fabric(pill[1], { c2: '#f8e8c0', pat: 'stripe' }), { pivot: [9.5, 9.4, 0.4], rot: [-14, -10, 8] }),
    B([5.4, 9.6, -2.2], [6.4, 0.6, 9.6], fabric(thr, { c2: '#e8705a', pat: 'check' })), B([5.4, 3.6, 6.8], [6.4, 6.6, 0.6], fabric(thr, { c2: '#e8705a', pat: 'check' })),   // the throw over the front
  ] }]);
};
export const ARMCHAIR = (col = '#d87a5a') => {
  const F = fabric(col, { c2: shift(col, 0.6), pat: 'floral' }), leg = wood('#5a3a24');
  return def('arm' + col, [{ name: 'root', pivot: [0, 0, 0], cubes: [
    ...legs4(-7, -6.6, 14, 13.2, 2.2, leg, 1.2, 0.8), B([-7, 2.2, -6.6], [14, 5, 13.2], F), B([-7, 7.2, -6.6], [14, 10.4, 3.4], F),
    B([-8.4, 2.2, -6.8], [2.8, 9, 13.4], F), B([5.6, 2.2, -6.8], [2.8, 9, 13.4], F), B([-5.6, 7.2, -3.2], [11.2, 2.2, 9.6], fabric(shift(col, 0.3), { tuft: true })),
    B([-6.6, 17.2, -6.8], [13.2, 1.6, 3.8], F), B([-3, 9.4, -2.6], [6, 5, 1.8], fabric('#9cc4b4', { c2: '#f8f4ec', pat: 'dots' }), { pivot: [0, 9.4, -1.6], rot: [-12, 0, 4] }),
  ] }]);
};
// a coffee table: a thick oak top with a breadboard edge, a lower shelf of magazines, a stack of books, a mug, an open book whose page turns
export const COFFEE = (() => {
  const W = wood(OAK), W2 = wood(shift(OAK, -0.6));
  const pageP = on(enamel('#f8f2e2'), ['up'], (p, w, h) => { for (let y = 2; y < h - 1; y += 2) p.hl(1, w - 2, y, '#b8ac98'); });
  return def('coffee', [
    { name: 'root', pivot: [0, 0, 0], cubes: [
      ...legs4(-8, -6, 16, 12, 6.0, W2, 1.6, 0.4), ...slabTop(-8.4, 6, -6.4, 16.8, 1.4, 12.8, W, W, 1.4, 0.0), B([-7.2, 1.6, -5.2], [14.4, 0.8, 10.4], W2),
      B([-6.4, 2.4, -4], [6, 0.6, 8], fabric('#e8705a')), B([-6, 3.0, -3.6], [5.6, 0.5, 7.4], fabric('#4a8ab0')),
      B([-7, 7.4, -4.6], [5, 0.9, 6.6], enamel('#3a5a8a')), B([-6.6, 8.3, -4.2], [4.4, 0.9, 6.0], enamel('#c8402a')), B([-6.8, 9.2, -4.4], [4.8, 0.7, 6.2], enamel('#e8b040')),
      B([4.4, 7.4, 2.2], [2.0, 2.4, 2.0], enamel('#9cc4b4')), B([6.4, 8.0, 2.8], [0.6, 1.2, 0.8], enamel('#9cc4b4')), B([4.8, 9.6, 2.6], [1.2, 0.2, 1.2], wood('#5a3a22')),
      B([-1, 7.4, -2.2], [4.4, 0.5, 6.0], pageP), B([-1.2, 7.3, -2.4], [9.0, 0.2, 6.4], enamel('#7a3a3a')),
    ] },
    { name: 'page', parent: 'root', pivot: [3.4, 7.9, 0], cubes: [B([3.4, 7.9, -2.2], [4.2, 0.2, 6.0], pageP)] },
  ], { live: ['page'] });
})();
// an upright piano: walnut, a fold-down fallboard over ivory and ebony keys, a music stand with a score, brass pedals, candle sconces
export const PIANO = (() => {
  const W = wood('#4a2a1e', { dir: 'v' }), W2 = wood('#5a3424'), brass = metal(BRASS);
  const keys = (p, w, h, face) => { if (face !== 'up') { enamel('#f8f4e8')(p, w, h, face); return; } p.rect(0, 0, w, h, '#fbf8ee'); for (let x = 0; x < w; x += 3) p.vl(x, 0, h - 1, '#c8c0b0'); for (let x = 2; x < w - 2; x += 3) if ((Math.floor(x / 3) % 7) !== 2 && (Math.floor(x / 3) % 7) !== 6) p.rect(x, 0, 2, Math.floor(h * 0.6), '#1a1418'); };
  const score = on(enamel('#f4ecd8'), ['south'], (p, w, h) => { for (let y = 2; y < h - 1; y += 4) { p.hl(1, w - 2, y, '#8a8070'); p.hl(1, w - 2, y + 1, '#8a8070'); for (let x = 3; x < w - 2; x += 3) if (h2(x, y, 3) < 0.6) p.px(x, y - 1 + (h2(x, y, 4) < 0.5 ? 0 : 2), '#2a2420'); } });
  return def('piano', [
    { name: 'root', pivot: [0, 0, 0], cubes: [
      B([-11.4, 0, -4.2], [22.8, 1.0, 8.6], W2), B([-11, 1, -4], [1.6, 11, 9.4], W2), B([9.4, 1, -4], [1.6, 11, 9.4], W2), B([-9.4, 1, -4], [18.8, 9.8, 4.4], on(W, ['south'], panel('#4a2a1e', 3))),
      B([-10.4, 11.0, -4], [20.8, 0.8, 8.6], keys), B([-11, 11.8, -4], [22, 13, 5.2], on(W, ['south'], panel('#4a2a1e', 3))), B([-11.6, 24.8, -4.4], [23.2, 1.4, 6], W2),
      B([-4, 14.8, 1.0], [8, 5.6, 0.6], score), B([-4.4, 14.4, 0.8], [8.8, 0.6, 1.2], W2),
      ...[-2, 0, 2].map((x) => B([x - 0.5, 0.4, 4.4], [1.0, 0.4, 1.6], brass)),
      B([-11.8, 18, 1.2], [1.0, 2.6, 1.0], brass), B([10.8, 18, 1.2], [1.0, 2.6, 1.0], brass), B([-11.6, 20.6, 1.4], [0.6, 1.4, 0.6], enamel('#f8f0d8')), B([11.0, 20.6, 1.4], [0.6, 1.4, 0.6], enamel('#f8f0d8')),
      B([3.6, 25.8, -2.4], [3.4, 3.0, 3.0], enamel('#4a8ab0')), B([4.4, 28.8, -1.6], [1.8, 2.4, 1.4], fabric('#6ab04a')), B([-8, 25.8, -2.4], [5, 4.4, 0.6], on(wood('#c8a050'), ['south'], (p, w, h) => p.rect(2, 2, w - 4, h - 4, '#8ad0e8'))),
    ] },
    { name: 'lid', parent: 'root', pivot: [0, 11.8, 4.4], cubes: [B([-10.4, 11.8, 2.6], [20.8, 0.8, 2.0], W2)] },
  ], { live: ['lid'] });
})();
// a cathedral radio: an arched walnut case, a fabric grille with fretwork, a glowing dial and two knobs
export const RADIO = (() => {
  const W = wood('#6a3a22', { dir: 'v' });
  const grille = on(W, ['south'], (p, w, h) => { const cx = w / 2; for (let y = 3; y < h - 4; y++) for (let x = 3; x < w - 3; x++) { if ((x - cx) ** 2 / ((w / 2 - 3) ** 2) + ((y - h * 0.62) ** 2) / ((h * 0.6) ** 2) > 1) continue; p.px(x, y, (x + y) & 1 ? '#c8a878' : '#b09060'); } for (let x = 5; x < w - 5; x += 4) p.vl(x, 4, h - 6, '#4a2412'); });
  return def('radio', [{ name: 'root', pivot: [0, 0, 0], cubes: [
    B([-4.4, 0, -2.4], [8.8, 1.0, 4.8], wood('#4a2a1a')), B([-4, 1, -2.2], [8, 8, 4.4], grille), B([-3.4, 9, -2.2], [6.8, 1.4, 4.4], W), B([-2.4, 10.4, -2.2], [4.8, 1.0, 4.4], W),
    B([-2.4, 1.6, 2.2], [4.8, 1.4, 0.4], on(enamel('#f8e0a0'), ['south'], (p, w, h) => { for (let x = 2; x < w - 1; x += 3) p.vl(x, 1, h - 2, '#6a4a2a'); p.vl(Math.floor(w * 0.6), 0, h - 1, '#c83a2a'); }), { glow: true }),
    B([-4.2, 1.6, 2.2], [1.2, 1.2, 0.8], enamel('#2a1a14')), B([3.0, 1.6, 2.2], [1.2, 1.2, 0.8], enamel('#2a1a14')),
  ] }]);
})();
// a floor lamp: a weighted brass base, a turned pole, a pleated fabric shade (with a glowing inside twin for "on")
export const FLOORLAMP = (() => {
  const brass = metal(BRASS), shade = fabric('#f2dcb0', { soft: 0.4 }), glow = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'down' ? '#fff8e0' : (x % 3 === 0 ? '#ffe2a8' : '#fff0c8')); };
  return def('floorlamp', [
    { name: 'root', pivot: [0, 0, 0], cubes: [B([-2.6, 0, -2.6], [5.2, 0.8, 5.2], brass), B([-1.2, 0.8, -1.2], [2.4, 0.8, 2.4], brass), B([-0.4, 1.6, -0.4], [0.8, 22, 0.8], brass), B([-0.8, 12, -0.8], [1.6, 0.8, 1.6], brass),
      B([-4, 22.8, -4], [8, 5.6, 8], on(shade, ['south', 'north', 'east', 'west'], (p, w, h) => { for (let x = 1; x < w; x += 3) p.vl(x, 0, h - 1, '#d8b888'); p.hl(0, w - 1, 0, '#c87a5a'); p.hl(0, w - 1, h - 1, '#c87a5a'); }))] },
    { name: 'light', parent: 'root', pivot: [0, 22, 0], cubes: [B([-4.1, 22.7, -4.1], [8.2, 5.8, 8.2], glow, { glow: true, id: 'lampOn', outline: false })] },
  ]);
})();
// a dresser: oak, three graduated drawers with brass cup pulls, turned bun feet, a lace runner, a photo, a jewellery box
export const DRESSER = (() => {
  const W = wood(OAK), D = on(wood(OAK), ['south'], panel(OAK, 1)), pull = metal(BRASS);
  return def('dresser', [
    { name: 'root', pivot: [0, 0, 0], cubes: [
      ...[-8, 6].map((x) => B([x, 0, -4], [2, 1.6, 2], wood('#5a3a24'))), ...[-8, 6].map((x) => B([x, 0, 2.4], [2, 1.6, 2], wood('#5a3a24'))),
      ...slabTop(-9.4, 1.6, -4.4, 18.8, 14.4, 8.8, W, wood(shift(OAK, 0.4)), 1, 0.5), B([-6, 16, -3], [12, 0.3, 6], fabric('#f8f4ec', { c2: '#e8e0d0', pat: 'dots' })),
      B([4, 16.3, -2.6], [3.6, 4.4, 1.0], on(wood('#c8a050'), ['south'], (p, w, h) => p.rect(2, 2, w - 4, h - 4, '#e8a0b0'))), B([-6.6, 16.3, -1.6], [4.4, 2.4, 3.2], on(wood('#7a3a3a'), ['up'], (p, w, h) => p.rect(1, 1, w - 2, h - 2, '#a84a4a'))),
      B([-1.2, 16.3, -2.4], [2.0, 3.6, 2.0], glass('#f8e8f0', { fill: '#e890b0', level: 0.5 })),
    ] },
    ...[[0, 2.4, 3.6], [1, 6.4, 4.0], [2, 10.8, 4.2]].map(([i, y, h]) => ({ name: 'drawer' + i, parent: 'root', pivot: [0, y, 4.4], cubes: [B([-8.8, y, 4.0], [17.6, h - 0.4, 0.8], D), B([-4.6, y + h / 2 - 0.8, 4.8], [1.6, 0.8, 0.6], pull), B([3.0, y + h / 2 - 0.8, 4.8], [1.6, 0.8, 0.6], pull)] })),
  ], { live: ['drawer0', 'drawer1', 'drawer2'] });
})();
// a potted monstera / fiddle-leaf in a glazed pot (big painted leaf planes)
export const PLANT = (pot = '#c8704a', leaf = '#4a9a4a', s = 1) => {
  const L = (c) => (p, w, h) => { const cx = (w - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x - cx) / (w / 2), v = y / (h - 1), r = Math.sin(v * Math.PI) * 0.95 + 0.05; if (Math.abs(u) > r) continue; p.px(x, y, Math.abs(u) < 0.08 ? shift(c, 0.9) : (Math.abs(u) > 0.35 && (y + Math.round(Math.abs(u) * 6)) % 5 === 0) ? shift(c, -1) : shift(c, 0.3 - v * 0.8 + (u < 0 ? 0.2 : -0.1))); } };
  const P = enamel(pot), soil = fabric('#4a3022');
  const leaves = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * 360, ht = 9 + (i % 3) * 3; return B([-2.2 * s, (ht - 2) * s, 0], [4.4 * s, 8 * s, 0], L(i & 1 ? leaf : shift(leaf, 0.4)), { plane: 'z', pivot: [0, (ht - 2) * s, 0], rot: [-35 - (i % 2) * 15, a, 0] }); });
  return def('plant' + pot + leaf + s, [{ name: 'root', pivot: [0, 0, 0], cubes: [B([-3 * s, 0, -3 * s], [6 * s, 6 * s, 6 * s], P), B([-3.4 * s, 5.4 * s, -3.4 * s], [6.8 * s, 1 * s, 6.8 * s], enamel(shift(pot, -0.4))), B([-2.8 * s, 6 * s, -2.8 * s], [5.6 * s, 0.4 * s, 5.6 * s], soil), B([-0.3 * s, 6 * s, -0.3 * s], [0.6 * s, 7 * s, 0.6 * s], fabric('#5a8a3a')), ...leaves] }]);
};
// a bookcase: a dark walnut frame and five shelves of varied spines, some books lying flat, a few knick-knacks
export const BOOKCASE = (seed = 1, w = 16, h = 30) => {
  const W = wood(WAL), rows = 5, rh = (h - 2) / rows, half = w / 2;
  const cubes = [B([-half, 0, -3.6], [1.2, h, 7.2], W), B([half - 1.2, 0, -3.6], [1.2, h, 7.2], W), B([-half - 0.4, h, -4], [w + 0.8, 1.2, 8], wood(shift(WAL, 0.4))), B([-half, 0, -3.6], [w, 1.4, 7.2], W), B([-half + 1.2, 1.4, -3.6], [w - 2.4, h - 1.4, 0.8], wood(shift(WAL, -0.6), { dir: 'v' }))];
  for (let i = 0; i < rows; i++) {
    const y = 1.4 + i * rh;
    if (i) cubes.push(B([-half + 1.2, y - 0.6, -2.8], [w - 2.4, 0.6, 6.4], W));
    const flat = h2(i, seed) < 0.4, bw = flat ? w - 7 : w - 2.6;
    cubes.push(B([-half + 1.3, y, -2.6], [bw, rh - 1.2, 5.4], spines(seed * 10 + i)));
    if (flat) { cubes.push(B([half - 5.4, y, -2], [4, 0.8, 4.6], enamel('#c8402a')), B([half - 5.2, y + 0.8, -1.8], [3.6, 0.8, 4.2], enamel('#3a6a9a'))); cubes.push(B([half - 4.6, y + 1.6, -1], [2, 2, 2], enamel(['#e8b040', '#9cc4b4', '#e890b0'][i % 3]))); }
  }
  return def('books' + seed + w + h, [{ name: 'root', pivot: [0, 0, 0], cubes }]);
};
// the player's bed: a painted iron frame, a thick mattress, a patchwork quilt with folds, two pillows, a rolled blanket at the foot
export const BED = (quilt = ['#e8705a', '#f2c84a', '#5a8aa8', '#f4ece0']) => {
  const iron = enamel('#f4ecdc'), Q = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = quilt[((x >> 3) + (y >> 3) * 3) % quilt.length], t = face === 'up' ? 0.3 + (Math.sin(y * 0.25) * 0.25) : 0.1 - (y / Math.max(1, h - 1)) * 0.6; p.px(x, y, (x & 7) === 0 || (y & 7) === 0 ? shift(c, -0.8) : shift(c, t + ((x + y) & 1 ? 0.06 : 0))); } };
  return def('bed' + quilt[0], [{ name: 'root', pivot: [0, 0, 0], cubes: [
    ...[-9.6, 8.6].map((x) => B([x, 0, -16.6], [1, 17, 1], iron)), ...[-9.6, 8.6].map((x) => B([x, 0, 15.8], [1, 11, 1], iron)),
    B([-9.6, 15, -16.6], [19.2, 1.2, 1], iron), B([-9.6, 6, -16.6], [19.2, 1, 1], iron), ...[-6, -2, 2, 6].map((x) => B([x, 7, -16.4], [0.6, 8, 0.6], iron)),
    B([-9.6, 9.6, 15.8], [19.2, 1, 1], iron), B([-9.6, 4, 15.8], [19.2, 1, 1], iron), ...[-5, 0, 5].map((x) => B([x, 5, 16.0], [0.6, 4.6, 0.6], iron)),
    B([-9, 3, -16], [18, 1.4, 32], wood('#8a6a4a')), B([-8.8, 4.4, -15.8], [17.6, 3.2, 31.6], fabric('#f8f4ec')),
    B([-9.2, 6.4, -8], [18.4, 1.8, 24.2], Q), B([-9.6, 4.4, -8], [0.6, 3.8, 24], Q), B([9.0, 4.4, -8], [0.6, 3.8, 24], Q), B([-9.6, 4.4, 15.8], [19.2, 3.8, 0.6], Q),   // quilt + its drape
    B([-8.4, 8.2, -6.4], [16.8, 1.0, 3.2], Q), B([-8.0, 8.2, 2.0], [16.0, 0.8, 2.6], Q),   // folds
    B([-7.6, 7.6, -15], [7, 2.6, 5], fabric('#fbf8f0', { soft: 0.4 }), { pivot: [-4, 7.6, -12.5], rot: [-10, 4, 0] }), B([0.6, 7.6, -15], [7, 2.6, 5], fabric('#fbf8f0', { soft: 0.4 }), { pivot: [4, 7.6, -12.5], rot: [-10, -6, 0] }),
    B([-8, 8.2, 11.6], [16, 2.4, 3.0], fabric('#9cc4b4', { c2: '#f4ece0', pat: 'stripe' })),
  ] }]);
};
// a shelf of creature figures (Tokonmon toys only): little painted box figures on a wall shelf
export const FIGSHELF = (() => {
  const W = wood('#c89a62'), fig = (x, body, acc, h = 2.4) => [B([x, 1, -1], [1.8, h, 1.8], enamel(body)), B([x + 0.2, 1 + h, -0.8], [1.4, 1.2, 1.4], enamel(acc)), B([x + 0.3, 1 + h * 0.6, 0.8], [0.4, 0.4, 0.2], enamel('#1a1418')), B([x + 1.1, 1 + h * 0.6, 0.8], [0.4, 0.4, 0.2], enamel('#1a1418'))];
  return def('figshelf', [{ name: 'root', pivot: [0, 0, 0], cubes: [
    B([-12, 0, -2], [24, 1, 4], W), B([-11, -2.4, -2], [1, 2.4, 3], W), B([10, -2.4, -2], [1, 2.4, 3], W),
    ...fig(-10.6, '#e8473a', '#f8c840'), ...fig(-7.6, '#4a8ad8', '#f8f4ec', 2), ...fig(-4.6, '#6ab04a', '#f2e070', 3), ...fig(-1.6, '#9a5ad8', '#e890b0'),
    ...fig(1.4, '#f8a030', '#3a3a44', 2.6), ...fig(4.4, '#9cd4c0', '#5aa04a', 1.8), B([7.2, 1, -1.4], [3.6, 3.6, 2.6], enamel('#f8d84a')), B([7.6, 4.6, -1], [2.8, 0.8, 1.8], enamel('#c83a3a')),
  ] }]);
})();
// a clawfoot tub: white enamel outside, a rolled rim, brass claw feet and taps, a rubber Foopod toy
export const TUB = (() => {
  const E = enamel('#f8f6f0'), brass = metal(BRASS), water = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x * 3 + y * 5) % 11 === 0 ? '#e8f8ff' : '#9ad0e8'); };
  return def('tub', [{ name: 'root', pivot: [0, 0, 0], cubes: [
    ...[[-15, -4.6], [13, -4.6], [-15, 3.2], [13, 3.2]].map(([x, z]) => B([x, 0, z], [2, 2.4, 1.6], brass)),
    B([-16, 2.4, -6], [32, 6.6, 12], on(E, ['south', 'north'], (p, w, h) => { for (let x = 0; x < w; x++) p.px(x, h - 2, '#d8d4c8'); })), B([-16.6, 9, -6.6], [33.2, 1.2, 13.2], E),
    B([-15, 7.6, -5], [30, 1.6, 10], water), B([13.4, 10.2, -0.8], [1.2, 3.2, 1.6], brass), B([11.4, 12.8, -0.6], [3, 0.8, 1.2], brass), B([14, 10.2, -3.2], [1.2, 1.2, 1.2], brass), B([14, 10.2, 1.6], [1.2, 1.2, 1.2], brass),
    B([-6, 9.2, -1.2], [2.4, 2.0, 2.4], enamel('#4ab0d8')), B([-5.6, 11.2, -0.8], [1.6, 1.2, 1.6], enamel('#4ab0d8')), B([-4.0, 11.4, -0.4], [0.6, 0.4, 0.8], enamel('#f8a030')),
  ] }]);
})();
// a washstand vanity with a basin, a brass tap whose water can run, a toothbrush mug and a soap dish
export const VANITY = (() => {
  const W = wood('#e8dcc8'), brass = metal(BRASS), water = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (y + x) % 4 === 0 ? '#ffffff' : '#a8dcf4'); };
  return def('vanity', [
    { name: 'root', pivot: [0, 0, 0], cubes: [
      ...slabTop(-6, 0, -4, 12, 13, 8, on(W, ['south'], panel('#e8dcc8', 2)), enamel('#f4f0e8'), 1, 0.4), B([-4.2, 12.4, -2.6], [8.4, 1.0, 6], on(enamel('#f8f8f4'), ['up'], (p, w, h) => { p.ell(w / 2, h / 2, w * 0.4, h * 0.36, '#c8d8e0'); p.ell(w / 2, h / 2, 1, 1, '#5a6a70'); })),
      B([-0.6, 13.4, -3.8], [1.2, 3.4, 1.2], brass), B([-0.5, 15.8, -2.8], [1.0, 0.8, 2.2], brass), B([-2.6, 13.4, -3.6], [1.2, 1.2, 1.2], brass), B([1.4, 13.4, -3.6], [1.2, 1.2, 1.2], brass),
      B([3.4, 13.4, -3.6], [1.8, 2.4, 1.8], enamel('#9cc4b4')), B([3.8, 15.8, -3.2], [0.4, 1.6, 0.4], enamel('#e8473a')), B([4.4, 15.8, -3.0], [0.4, 1.4, 0.4], enamel('#4a8ad8')),
      B([-5.2, 13.4, 1.4], [2.6, 0.5, 2.0], enamel('#e8a0b0')), B([-4.8, 13.9, 1.6], [1.8, 0.6, 1.4], enamel('#f8f0d8')),
    ] },
    { name: 'water', parent: 'root', pivot: [0, 13.4, -1.0], cubes: [B([-0.25, 13.4, -1.0], [0.5, 2.4, 0.5], water, { glow: true, id: 'tapOn', hide: true, outline: false })] },
  ]);
})();
// a writing desk with clutter: a green banker's lamp, notebooks, pencils in a jar, a Tokonmon figure, a game cartridge, stickers
export const DESK = (() => {
  const W = wood(OAK), D = on(wood(OAK), ['south'], panel(OAK, 1)), brass = metal(BRASS);
  return def('desk', [{ name: 'root', pivot: [0, 0, 0], cubes: [
    ...slabTop(-13, 11, -5.2, 26, 1.0, 10.4, W, W, 1, 0.3), B([-12.6, 0, -5], [1.4, 11, 10], W), B([4.6, 0, -5], [8, 11, 10], W),
    B([4.8, 6.6, 4.8], [7.6, 3.8, 0.6], D), B([4.8, 2.4, 4.8], [7.6, 3.8, 0.6], D), B([7.8, 8.2, 5.4], [1.6, 0.6, 0.4], brass), B([7.8, 4.0, 5.4], [1.6, 0.6, 0.4], brass),
    B([-11.2, 1, -4.6], [15.8, 6, 0.6], W),
    B([-11, 12, -3], [2.6, 0.6, 2.6], brass), B([-10, 12.6, -2], [0.6, 3.6, 0.6], brass), B([-12, 16, -3.6], [5, 1.8, 3], enamel('#2a7a4a')), B([-11.6, 15.8, -3.2], [4.2, 0.4, 2.2], enamel('#fff0c0'), { glow: true }),
    B([4, 12, -3], [2.2, 3.0, 2.2], glass('#e8f0ec')), ...[['#f8d84a', 0.2], ['#e8473a', 1.0], ['#4a8ad8', 1.6]].map(([c, dx]) => B([4.2 + dx * 0.6, 13, -2.4], [0.4, 3.6, 0.4], enamel(c))),
    B([8, 12, -2], [2.4, 2.6, 2.0], enamel('#e8473a')), B([8.3, 14.6, -1.8], [1.8, 1.4, 1.6], enamel('#f8c840')), B([8.5, 13.8, 0.0], [0.4, 0.4, 0.2], enamel('#1a1418')), B([9.5, 13.8, 0.0], [0.4, 0.4, 0.2], enamel('#1a1418')),
    B([1, 12, 2.4], [2.6, 0.4, 1.8], enamel('#5a5a6a')), B([10.4, 12, 1.8], [1.6, 0.3, 2.4], enamel('#f8d84a')),
  ] }]);
})();

// a swan-neck kitchen faucet with two cross handles, whose water can run
export const FAUCET = (() => {
  const chrome = metal('#d8dce4'), water = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (y + x * 2) % 5 === 0 ? '#ffffff' : '#a8dcf4'); };
  return def('faucet', [
    { name: 'root', pivot: [0, 0, 0], cubes: [B([-0.6, 0, -0.6], [1.2, 4.6, 1.2], chrome), B([-0.6, 4.0, -0.6], [1.2, 1.2, 3.4], chrome), B([-0.5, 3.2, 2.0], [1.0, 0.9, 0.9], chrome),
      B([-2.6, 0, -0.5], [1.0, 1.4, 1.0], chrome), B([-3.0, 1.4, -0.2], [1.8, 0.4, 0.4], enamel('#e84a4a')), B([1.6, 0, -0.5], [1.0, 1.4, 1.0], chrome), B([1.2, 1.4, -0.2], [1.8, 0.4, 0.4], enamel('#4a8ad8'))] },
    { name: 'water', parent: 'root', pivot: [0, 0, 2.4], cubes: [B([-0.25, -1.2, 2.2], [0.5, 4.4, 0.5], water, { glow: true, id: 'tapOn', hide: true, outline: false })] },
  ]);
})();
// a wire dish rack with plates on edge, two cups upside down, and a crock of wooden spoons and a whisk beside it
export const DISHRACK = (() => {
  const wire = metal('#c8ccd4'), plate = (c) => on(enamel('#f8f4ec'), ['south', 'north'], (p, w, h) => { p.ell(w / 2, h / 2, w * 0.36, h * 0.36, c); p.ell(w / 2, h / 2, w * 0.2, h * 0.2, '#f8f4ec'); });
  return def('dishrack', [{ name: 'root', pivot: [0, 0, 0], cubes: [
    B([-4, 0, -2.4], [8, 0.4, 4.8], wire), ...[-4, 3.6].map((x) => B([x, 0.4, -2.4], [0.4, 2.2, 4.8], wire)), B([-4, 2.4, -2.4], [8, 0.3, 0.3], wire), B([-4, 2.4, 2.1], [8, 0.3, 0.3], wire),
    ...[-3, -1.6, -0.2].map((x, i) => B([x, 0.4, -2], [0.4, 4.2, 4.2], plate(['#4a8ab0', '#e8473a', '#4a8ab0'][i]))),
    B([1.2, 0.4, -1.8], [2.0, 2.0, 2.0], enamel('#f2d68a')), B([1.2, 0.4, 0.4], [2.0, 2.0, 2.0], enamel('#9cc4b4')),
    B([5.2, 0, -1.4], [2.8, 3.2, 2.8], enamel('#c8704a')), B([5.8, 3.2, -0.8], [0.4, 3.6, 0.4], wood('#d8a868')), B([6.6, 3.2, -0.6], [0.4, 3.2, 0.4], wood('#c89858')), B([6.2, 3.2, 0.2], [0.4, 3.8, 0.4], metal('#d8dce4')),
    B([6.0, 6.4, -0.9], [0.8, 1.0, 0.6], wood('#d8a868')), B([6.0, 6.8, 0.0], [0.8, 0.9, 0.8], metal('#d8dce4')),
  ] }]);
})();
/** sit the player on a seat (x, z, facing yaw, seat height y) for a line or two, then stand them up where they were */
export async function sit(app, x, z, yaw, y, lines) {
  const w = app.world, me = w && w.player, sfx = (n, o) => app.audio && app.audio.sfx && app.audio.sfx(n, o);
  if (!me) { await app.say('', ...lines); return; }
  const p = me.g.position, back = [p.x, p.z, me.yaw, p.y];
  sfx('cloth'); me.path = null; me.place(x, z, yaw, y); me.g.position.y = y; me.play('sit', { fade: 0.25 });
  await app.say('', ...lines);
  me.play('idle', { fade: 0.25 }); me.place(back[0], back[1], back[2], back[3]);
  if (w.city) w.city.placed();
}

// ---------------------------------------------------------------- baking: one mesh per material (and per live bone)
function mergeGeos(list) {
  const keys = ['position', 'normal', 'uv', 'bc'].filter((k) => list.every((g) => g.attributes[k]));
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const A = {}; for (const k of keys) A[k] = new Float32Array(nv * list[0].attributes[k].itemSize);
  const I = new Uint32Array(ni); let vb = 0, ib = 0;
  for (const g of list) {
    for (const k of keys) A[k].set(g.attributes[k].array, vb * g.attributes[k].itemSize);
    const cnt = g.attributes.position.count;
    if (g.index) for (let i = 0; i < g.index.count; i++) I[ib + i] = g.index.array[i] + vb; else for (let i = 0; i < cnt; i++) I[ib + i] = vb + i;
    ib += g.index ? g.index.count : cnt; vb += cnt;
  }
  const out = new THREE.BufferGeometry();
  for (const k of keys) out.setAttribute(k, new THREE.BufferAttribute(A[k], list[0].attributes[k].itemSize));
  out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere();
  return out;
}
const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _v = new THREE.Vector3();
/** merge each owner's (the model root or a live bone) static meshes into one mesh per material; parts with ids stay separate */
function bake(model, live) {
  const g = model.group; g.updateMatrixWorld(true);
  const owners = [g, ...live.map((n) => model.bones[n]).filter(Boolean)], ownerOf = (o) => { for (let p = o.parent; p; p = p.parent) { if (owners.includes(p)) return p; } return g; };
  const meshes = []; g.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const keep = new Set(); for (const id in model.parts) for (const m of model.parts[id]) { keep.add(m); if (m.userData.hull) keep.add(m.userData.hull); }
  const groups = new Map();
  for (const m of meshes) {
    if (keep.has(m)) continue;
    const own = ownerOf(m), key = own.uuid + '|' + m.material.uuid;
    let e = groups.get(key); if (!e) { e = { own, mat: m.material, geos: [], cast: m.castShadow }; groups.set(key, e); }
    _inv.copy(own.matrixWorld).invert(); _m.multiplyMatrices(_inv, m.matrixWorld);
    const geo = m.geometry.clone(); geo.applyMatrix4(_m);
    if (geo.attributes.bc) { const a = geo.attributes.bc.array; for (let i = 0; i < a.length; i += 3) { _v.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(_m); a[i] = _v.x; a[i + 1] = _v.y; a[i + 2] = _v.z; } }
    e.geos.push(geo); m.parent.remove(m); m.geometry.dispose();
  }
  for (const e of groups.values()) { const mesh = new THREE.Mesh(mergeGeos(e.geos), e.mat); mesh.castShadow = e.cast; mesh.receiveShadow = !e.mat.isShaderMaterial; e.own.add(mesh); for (const gg of e.geos) gg.dispose(); }
}

// ---------------------------------------------------------------- placing pieces in a building
const YAW = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };
/**
 * The furniture set of one building: F.put(k, def, x, z, face, { y, block, s }) places a piece on storey k at
 * world centre (x, z) facing `face`; returns a handle { open(bone, on), show(id, on), toggle } usable at runtime.
 * Models are built and attached on the first frame (after finalize); they only show while you are inside.
 */
export function furnish(C, Bld) {
  const list = [];
  let ready = false;
  C.updaters.push((dt) => {
    const app = globalThis.__app, w = app && app.world, cc = w && w.city;
    if (!Bld.groups || !Bld.groups[0] || !Bld.groups[0].in) return;
    if (!ready) {
      ready = true;
      for (const it of list) {
        const m = new Model(it.def); bake(m, it.def.live || []);
        m.group.position.set(it.x, it.y, it.z); m.group.rotation.y = YAW[it.face] ?? it.face ?? 0; if (it.s) m.group.scale.setScalar(it.s);
        m.group.name = 'fx:' + it.def.name; it.m = m; it.rest = {}; for (const b of it.def.live || []) if (m.bones[b]) it.rest[b] = m.bones[b].rotation.clone();
        for (const id in it.hidden) m.show(id, !it.hidden[id]);
        const host = Bld.groups[it.k] && Bld.groups[it.k].in; if (host) host.add(m.group);
      }
    }
    const inside = cc && cc.inside === Bld.id;
    for (const it of list) {
      if (!it.m) continue;
      it.m.group.visible = !!inside || !!it.always;
      for (const b in it.want) { const bone = it.m.bones[b]; if (!bone) continue; const tgt = it.want[b], cur = it.cur[b] ?? 0, nx = cur + (tgt - cur) * (1 - Math.exp(-dt * 8)); it.cur[b] = nx; it.anim(bone, nx, b); }
    }
  });
  return {
    list,
    put(k, d, x, z, face = 's', o = {}) {
      const y = o.y ?? (k * 3 + 0.02);
      const it = { k, def: d, x, z, y, face, s: o.s, want: {}, cur: {}, hidden: {}, always: o.always };
      it.anim = (bone, v, name) => { const r = it.rest[name]; if (!r) return; const kind = o.swing && o.swing[name] || (name.startsWith('drawer') ? 'drawer' : name === 'page' ? 'page' : name === 'lid' || name === 'oven' ? 'down' : name === 'doorL' || name === 'door' || name === 'door2' ? 'left' : 'right');
        if (kind === 'drawer') { const base = it.base || (it.base = {}); if (base[name] === undefined) base[name] = bone.position.z; bone.position.z = base[name] + v * 0.28; }
        else if (kind === 'page') bone.rotation.z = r.z + v * Math.PI * 0.98;
        else if (kind === 'down') bone.rotation.x = r.x + v * 1.45;
        else if (kind === 'left') bone.rotation.y = r.y + v * 1.75 * (name === 'doorL' ? -1 : 1);
        else bone.rotation.y = r.y - v * 1.75; };
      if (o.block) C.nav.block(o.block[0], o.block[1], o.block[2], o.block[3], k);
      list.push(it);
      return {
        it,
        open(bone, on = true) { it.want[bone] = on ? 1 : 0; },
        isOpen(bone) { return !!it.want[bone]; },
        show(id, on = true) { it.hidden[id] = !on; if (it.m) it.m.show(id, on); },
      };
    },
  };
}
