// Shared parts for the Takanaka eagle line (Talonaka → Takaptain / Hawkabunga), a homage to the
// city-pop / fusion guitarist: aloha shirts, a white sailor cap, a guitar that is really a surfboard,
// tropical seas and sunset album sleeves. Original designs only (no logos, no copied album art).
//   painters: eagle feathers, the white head, the feathered 70s mop, the hooked beak, talons,
//   the aloha print (hibiscus + palm fronds), the sunburst double-cut guitar, the surfboard guitar,
//   the ship's-wheel guitar, an original sunset album sleeve and its vinyl, tear-drop shades,
//   a hibiscus lei, white uniform cloth and gold braid;
//   eye maps (Cobblemon flat-block eyes, hand drawn per species), particle kinds and the drip form.
import { shade, feathers, gradient, ramp, shift, h2 } from './kit.js';
import { region, ell, stamp, stroke, GOLD, formMap, fromHsl } from './story_parts.js';
import { defineFx } from '../fx.js';

export const TK = {
  brown: '#6e4224', brownHi: '#9c6838', brownLo: '#42220e', deep: '#28140a', chest: '#8a5a32', chestHi: '#b0804a',
  white: '#f4f0e6', whiteHi: '#ffffff', whiteLo: '#d0c8b6', whiteDeep: '#a49a86',
  beak: ['#fff4a8', '#ffd23a', '#f2a424', '#b8680e'], beakLine: '#6a3a0a', mouth: '#5a1a14', tongue: '#ff8a8a',
  foot: '#f6c43a', footHi: '#ffe27a', footLo: '#c4861a', talon: '#1e1410',
  sea: '#1fb0aa', seaHi: '#5adcd0', seaLo: '#11777c', hib: '#ff5a6e', hibHi: '#ffa4ac', hibLo: '#c42a48', hibC: '#ffe04a',
  leaf: '#22925a', leafLo: '#0e5a3a', coral: '#ff7a52',
  sun: ['#ffe27a', '#ffb02a', '#ff6a3a', '#e8306a', '#8a2a8a'], dusk: '#3a2a7a', night: '#1a1440',
  hair: { c: '#2e211c', hi: '#5c4434', lo: '#1a120f', deep: '#0e0a08' },
  ink: '#1a0e10', cloth: '#f8f8f4', clothLo: '#c8ccd6', navy: '#1e2a5a', navyLo: '#101838',
};
const side = (f) => f !== 'up' && f !== 'down';
// model-space position of a texel on a cube face (for patterns that run across several cubes)
export function mpos(c, face, x, y, w, h) {
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s, u = (x + 0.5) / w, v = (y + 0.5) / h;
  if (face === 'south' || face === 'plane') return [ox + (c.mirror ? 1 - u : u) * sx, oy + sy - v * sy, oz + sz];
  if (face === 'north') return [ox + (1 - u) * sx, oy + sy - v * sy, oz];
  if (face === 'east') return [ox + sx, oy + sy - v * sy, oz + sz - u * sz];
  if (face === 'west') return [ox, oy + sy - v * sy, oz + u * sz];
  return [ox + u * sx, oy + sy, oz + v * sz];
}

// ---------------------------------------------------------------- eagle
export const brownP = feathers(TK.brown, { top: TK.brownHi, bottom: TK.brownLo, size: 6 });
export const chestP = feathers(TK.chest, { top: TK.chestHi, bottom: TK.brown, size: 5 });
export const darkP = feathers(shift(TK.brown, -0.15), { top: TK.brown, bottom: TK.deep, size: 5 });
// the white head: soft scalloped feathers, kept quiet on the face so the eyes read
export const headP = feathers(TK.white, { top: TK.whiteHi, bottom: TK.whiteLo, size: 7, dark: '#ddd6c6', lite: '#ffffff' });
export const faceP = shade(TK.white, { top: TK.whiteHi, bottom: '#e2dccd', grain: 0.02 });
// a feathered lock of the 70s mop: white strands, a cream sheen, a ragged cut bottom edge
export function lockP(o = {}) {
  const c = o.c || TK.white, hi = o.hi || TK.whiteHi, lo = o.lo || TK.whiteLo, deep = o.deep || TK.whiteDeep, tip = o.tip;
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let col = face === 'up' ? hi : face === 'down' ? lo : ramp([hi, c, c, lo], y / Math.max(1, h - 1), x, y);
      if (side(face) && x % 3 === 2) col = shift(col, -0.08);
      if (side(face) && (x * 5 + y) % 7 === 0) col = hi;
      if (tip && side(face) && y >= h - 2) col = tip;
      p.px(x, y, col);
    }
    if (o.ragged && side(face)) for (let x = 0; x < w; x++) { const cut = (x * 7) % 5 < 2 ? 1 : (x * 3) % 4 === 0 ? 2 : 0; for (let k = 0; k < cut; k++) p.px(x, h - 1 - k, 0); if (cut < 2) p.px(x, h - 1 - cut, deep); }
  };
}
export const beakP = (p, w, h, face) => {
  if (face === 'down') { p.rect(0, 0, w, h, TK.mouth); return; }
  gradient(TK.beak, { span: face === 'up' ? 0.35 : 0.9 })(p, w, h, face);
  if (face === 'up') { const cx = Math.floor(w / 2); for (let y = 0; y < h; y++) p.px(cx, y, '#fffbd0'); p.px(cx - 2, Math.floor(h * 0.35), TK.beakLine).px(cx + 2, Math.floor(h * 0.35), TK.beakLine); }   // nostrils
  if (side(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, TK.beakLine);
};
export const hookP = gradient(['#ffd23a', '#f2a424', '#c87414', '#7a400a'], { edge: TK.beakLine });
export const cereP = shade('#f8c838', { top: '#ffe890', bottom: '#d89a20', grain: 0 });
export const jawP = (p, w, h, face) => { if (face === 'up') { p.rect(0, 0, w, h, TK.mouth); p.rect(1, 1, w - 2, h - 2, TK.tongue); return; } gradient(['#f6b830', '#e09020', '#a85e10'], { edge: TK.beakLine })(p, w, h, face); };
export const footP = (p, w, h, face) => { gradient([TK.footHi, TK.foot, TK.footLo])(p, w, h, face); if (face === 'up') for (let y = 1; y < h; y += 2) for (let x = (y >> 1) % 2; x < w; x += 2) p.px(x, y, shift(TK.foot, -0.12)); };
// a toe with a black hooked talon at its tip (south face) and scales on top
export const toeP = (p, w, h, face) => {
  gradient([TK.footHi, TK.foot, TK.footLo])(p, w, h, face);
  if (face === 'up') { for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x++) p.px(x, y, shift(TK.foot, -0.12)); for (let x = 0; x < w; x++) { p.px(x, h - 1, TK.talon); p.px(x, h - 2, '#3a2a20'); } }
  if (face === 'south') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < 1 ? '#4a3a30' : TK.talon);
  if (face === 'east' || face === 'west') for (let y = 0; y < h; y++) p.px(face === 'east' ? 0 : w - 1, y, TK.talon);
};
export const pantsP = feathers(TK.brown, { top: TK.brownHi, bottom: TK.brownLo, size: 4 });
// wing: brown coverts, the tips darkening to primaries
export const wingP = (p, w, h, face, c) => { brownP(p, w, h, face, c); if (side(face)) for (let x = 0; x < w; x += 3) for (let y = Math.floor(h * 0.7); y < h; y++) { p.px(x, y, TK.deep); if (x + 1 < w) p.px(x + 1, y, shift(TK.brownLo, -0.1)); } };
export const primP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? TK.brownLo : x % 3 === 2 ? TK.deep : ramp([TK.brownLo, shift(TK.brownLo, -0.15), TK.deep], y / Math.max(1, h - 1), x, y)); };
// the bald eagle's white tail fan
export const tailP = (p, w, h, face) => { shade(TK.white, { top: TK.whiteHi, bottom: TK.whiteLo, grain: 0 })(p, w, h, face); if (side(face)) for (let x = 1; x < w; x += 3) for (let y = 1; y < h; y++) p.px(x, y, '#d8d0c0'); };

// ---------------------------------------------------------------- the aloha print
// hibiscus pinwheels and palm fronds on a ground colour, laid out on a jittered grid in model space so the
// print runs on across neighbouring cubes (shirt, collar, sleeves)
const FLOWER = ['.ff..', 'fFFfd', 'dFcFf', '.fFFd', '..dd.'];
export function aloha(o = {}) {
  const base = o.base || TK.sea, hi = o.hi || shift(base, 0.16), lo = o.lo || shift(base, -0.26);
  const pal = { f: o.flower || TK.hib, F: o.flowerHi || TK.hibHi, d: o.flowerLo || TK.hibLo, c: o.center || TK.hibC };
  const leaf = o.leaf || TK.leaf, leafLo = o.leafLo || shift(leaf, -0.3), cell = o.cell || 3.4, ppu = o.ppu || 3;
  return (p, w, h, face, c) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? hi : face === 'down' ? lo : ramp([hi, base, base, lo], y / Math.max(1, h - 1), x, y));
    if (face === 'down' || !c) return;
    // which model-space plane this face lies in: (a, b) axes on the face
    const a0 = mpos(c, face, 0, 0, w, h), a1 = mpos(c, face, w - 1, h - 1, w, h);
    const ax = face === 'east' || face === 'west' ? 2 : 0, ay = face === 'up' ? 2 : 1;
    const toTex = (A, Bv) => [((A - a0[ax]) / (a1[ax] - a0[ax] || 1)) * (w - 1), ((Bv - a0[ay]) / (a1[ay] - a0[ay] || 1)) * (h - 1)];
    const lo0 = Math.min(a0[ax], a1[ax]) - cell, hi0 = Math.max(a0[ax], a1[ax]) + cell, lo1 = Math.min(a0[ay], a1[ay]) - cell, hi1 = Math.max(a0[ay], a1[ay]) + cell;
    for (let gy = Math.floor(lo1 / cell); gy <= Math.ceil(hi1 / cell); gy++) for (let gx = Math.floor(lo0 / cell); gx <= Math.ceil(hi0 / cell); gx++) {
      const r = h2(gx + 50, gy + 50, o.seed || 3), A = gx * cell + (gy & 1 ? cell / 2 : 0) + r * 0.8, Bv = gy * cell + h2(gy + 50, gx + 50, 5) * 0.8;
      const [tx, ty] = toTex(A, Bv);
      if (r < 0.62) stamp(p, FLOWER, pal, Math.round(tx - 2), Math.round(ty - 2));
      else {                                                    // a palm frond: a spine with leaflets
        const dir = r > 0.81 ? 1 : -1;
        for (let k = -2; k <= 3; k++) { const X = Math.round(tx + k * dir), Y = Math.round(ty + k * 0.5); p.px(X, Y, leafLo); p.px(X, Y - 1, leaf); if (k % 2 === 0) p.px(X, Y + 1, leaf); }
      }
    }
    if (o.hem && side(face) && face !== 'plane') for (let x = 0; x < w; x++) p.px(x, h - 1, lo);
  };
}
// the shirt front: the print with an open V at the neck showing the chest feathers
export function shirtFront(print, o = {}) {
  return (p, w, h, face, c) => {
    print(p, w, h, face, c);
    if (face !== 'south') return;
    const cx = w / 2, depth = h * (o.depth ?? 0.62), top = o.top ?? w * 0.24;
    const inV = (x, y) => y < depth && Math.abs(x + 0.5 - cx) < top * (1 - y / depth);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!inV(x, y)) continue;
      const edge = !inV(x - 1, y) || !inV(x + 1, y);
      p.px(x, y, edge ? shift(o.lo || TK.seaLo, -0.25) : (x + y) % 5 === 0 ? TK.chestHi : y < 2 ? TK.brownLo : TK.chest);
    }
    if (o.buttons) for (let y = Math.ceil(depth) + 1; y < h - 1; y += 3) p.px(Math.floor(cx), y, '#fff4e0');
  };
}

// ---------------------------------------------------------------- guitars
// the red sunburst double-cut: radial bands around a centre given in model units (so the bout, horns and
// waist cubes share one burst), a black pickguard, two pickups with pole dots, bridge, knobs and strings
export function burstP(ctr, o = {}) {
  const cols = o.cols || ['#ffc040', '#ff8a2a', '#e04020', '#a01818', '#4a0c0c'], R = o.r || 3.4;
  return (p, w, h, face, c) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [X, Y] = mpos(c, face === 'north' ? 'south' : face, x, y, w, h), d = Math.hypot(X - ctr[0], (Y - ctr[1]) * 1.15) / R;
      p.px(x, y, side(face) && face !== 'south' && face !== 'north' ? cols[3] : face === 'up' || face === 'down' ? cols[3] : ramp(cols, Math.min(1, d * 0.95), x, y));
    }
    if (side(face) && face !== 'south' && face !== 'north') for (let x = 0; x < w; x++) { p.px(x, 0, '#f4e8c8'); p.px(x, h - 1, '#f4e8c8'); }   // cream binding
  };
}
// hardware on the guitar's face (a thin plate flush on the body)
export const guitarFace = (p, w, h, face) => {
  if (face !== 'south' && face !== 'plane') { p.rect(0, 0, w, h, '#141014'); return; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, 0);
  const cx = Math.floor(w / 2);
  p.rect(cx - 3, 1, 7, 3, '#141014').rect(cx - 3, h - 6, 7, 3, '#141014');                  // pickups
  for (const dx of [-2, 0, 2]) { p.px(cx + dx, 2, '#d8d8e0'); p.px(cx + dx, h - 5, '#d8d8e0'); }
  p.rect(cx - 3, h - 2, 7, 1, '#e0e0e8');                                                 // bridge
  for (const dx of [-2, -1, 1, 2]) for (let y = 0; y < h - 2; y++) if (p.s.data[y * w + cx + dx] >>> 24 === 0 && y % 3) p.px(cx + dx, y, '#f0ece0');
  p.px(w - 2, h - 2, '#ffd23a').px(w - 3, h - 4, '#ffd23a');                              // knobs
};
export const neckP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' || face === 'north' ? (x % 4 === 0 ? '#e8e0c8' : '#5a3418') : '#3a2010');
  if (face === 'south') for (let x = 2; x < w; x += 8) p.px(x, Math.floor(h / 2), '#f4f0e8');   // inlays
};
export const headstockP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, '#1c1418'); if (face === 'south' || face === 'north') for (let x = 1; x < w; x += 2) { p.px(x, 0, '#e8e8f0'); p.px(x, h - 1, '#e8e8f0'); } };
// the surfboard guitar: a long board whose deck is the guitar's face — a sunset-orange body with a white
// stringer stripe, three pickups, the strings running the full length and a chrome bridge
export function boardP(o = {}) {
  const base = o.base || '#ff8a2a', hi = o.hi || '#ffc24a', lo = o.lo || '#d8481e', rail = o.rail || '#f8f2e4';
  return (p, w, h, face) => {
    if (face === 'down') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 6 === 0 ? '#3aa8c8' : '#2a8ab8'); return; }   // the blue underside
    if (face !== 'up') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? rail : y === h - 1 ? '#1a6a98' : '#f2e6cc'); return; }
    // up: the deck — length runs along v (z), width along u (x)
    const cx = (w - 1) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = Math.abs(x - cx) / (w / 2);
      let col = t > 0.86 ? rail : ramp([hi, base, lo], t * 1.1, x, y);
      if (Math.abs(x - cx) < 0.6) col = '#fffaf0';                                         // the stringer
      p.px(x, y, col);
    }
    // a sunset fade-band across the nose and tail
    for (const y0 of [Math.round(h * 0.1), Math.round(h * 0.86)]) for (let x = 1; x < w - 1; x++) { p.px(x, y0, '#e8306a'); p.px(x, y0 + 1, '#8a2a8a'); }
    // pickups, bridge, strings (the guitar part sits mid-deck)
    const y1 = Math.round(h * 0.42), y2 = Math.round(h * 0.52), y3 = Math.round(h * 0.62), yb = Math.round(h * 0.72);
    for (const yy of [y1, y2, y3]) { p.rect(Math.round(cx - 3), yy, 7, 2, '#141014'); for (const dx of [-2, 0, 2]) p.px(Math.round(cx + dx), yy, '#d8d8e0'); }
    p.rect(Math.round(cx - 3), yb, 7, 2, '#e0e0e8');
    for (const dx of [-2, -1, 1, 2]) for (let y = Math.round(h * 0.16); y < yb; y++) if (y % 2 && (y < y1 || y > y3 + 1 || (y !== y1 && y !== y2 && y !== y3))) p.px(Math.round(cx + dx), y, '#f4f0e6');
    p.px(Math.round(cx + 3), Math.round(h * 0.78), '#ffd23a').px(Math.round(cx + 3), Math.round(h * 0.81), '#ffd23a');
  };
}
export const finP = shade('#1e6a98', { top: '#3a9ac8', bottom: '#0e3a5a', grain: 0 });
// the ship's-wheel guitar: varnished teak rim, brass hub, a soundhole-rosette of rope
export const teakP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#c4803a' : face === 'down' ? '#4a2410' : ramp(['#d48a40', '#a85a24', '#6a3414'], y / Math.max(1, h - 1), x, y)); if (side(face)) for (let x = 0; x < w; x++) if ((x * 3) % 7 === 0) p.px(x, Math.floor(h / 2), '#5a2c10'); };
export const brassP = gradient(['#fff4b0', '#f0c040', '#c08a1e', '#7a5010']);
export const wheelFace = (p, w, h, face) => {
  teakP(p, w, h, face);
  if (face !== 'south') return;
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
  region(p, w, h, ell(cx, cy, R * 0.72, R * 0.72), (x, y) => ((x + y) % 4 === 0 ? '#e8d4a8' : '#f4e2b8'), '#8a5a2a');                 // spruce top
  region(p, w, h, ell(cx, cy - R * 0.1, R * 0.3, R * 0.3), '#1a0e08', '#c8a060');                                                     // soundhole
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; p.px(Math.round(cx + Math.cos(a) * R * 0.42 - 0.5), Math.round(cy - R * 0.1 + Math.sin(a) * R * 0.42 - 0.5), k % 2 ? '#c8a060' : '#7a5a2a'); }   // rope rosette
  p.rect(Math.round(cx - R * 0.35), Math.round(cy + R * 0.38), Math.round(R * 0.7), 2, '#3a1a08');                                    // bridge
  for (const dx of [-2, -1, 0, 1]) for (let y = 0; y < cy + R * 0.38; y++) if (y % 2) p.px(Math.round(cx + dx), y, '#f0ece0');
};

// ---------------------------------------------------------------- the album: an original sunset sleeve + its vinyl
// a retro sun cut by horizontal bands over a teal sea, a palm on the left, a gliding eagle in the sky
export const sleeveP = (p, w, h, face) => {
  if (face !== 'south' && face !== 'north' && face !== 'plane') { p.rect(0, 0, w, h, face === 'up' ? '#f4ecd8' : '#d8ccb0'); return; }
  if (face === 'north') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y % 3 === 0 && x > 1 && x < w - 2 && y > 1 && y < h - 2 ? '#8a7a68' : '#f0e6cc'); return; }   // track list
  const hz = Math.round(h * 0.62);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < hz ? ramp([TK.dusk, '#8a2a8a', '#e8306a', '#ff8a3a'], y / hz, x, y) : ramp(['#2ad0c0', TK.sea, TK.seaLo], (y - hz) / Math.max(1, h - hz), x, y));
  const cx = w * 0.6, cy = hz - 1, R = w * 0.26;
  region(p, w, h, (x, y) => y + 0.5 < cy + 0.5 && (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 < R * R && !(y > cy - R * 0.5 && (y % 2 === 0)), (x, y) => (y < cy - R * 0.55 ? '#ffe27a' : '#ffb02a'));
  for (let x = 0; x < w; x++) if (x % 3 !== 1) p.px(x, hz + 1, '#ffd23a');                               // sun glitter on the sea
  // palm: a curved trunk and a starburst of fronds
  stroke(p, [[w * 0.18, h - 1], [w * 0.2, h * 0.6], [w * 0.26, h * 0.3]], '#1a0e18', 1);
  for (const [dx, dy] of [[-4, 1], [-3, -2], [0, -3], [3, -2], [4, 1]]) stroke(p, [[w * 0.26, h * 0.3], [w * 0.26 + dx, h * 0.3 + dy]], '#1a0e18', 1);
  // a gliding eagle silhouette
  const ex = Math.round(w * 0.7), ey = Math.round(h * 0.18); p.px(ex, ey, '#1a0e18').px(ex - 1, ey - 1, '#1a0e18').px(ex - 2, ey - 1, '#1a0e18').px(ex + 1, ey - 1, '#1a0e18').px(ex + 2, ey - 1, '#1a0e18');
  for (let x = 0; x < w; x++) { p.px(x, 0, '#f4ecd8'); p.px(x, h - 1, '#c8bca0'); }
  for (let y = 0; y < h; y++) { p.px(0, y, '#f4ecd8'); p.px(w - 1, y, '#c8bca0'); }
};
// the helm guitar's round top as a plane: clear outside the circle, so it sits flush on the octagonal body
export const wheelTop = (p, w, h, face) => { wheelFace(p, w, h, 'south'); const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > R) p.px(x, y, 0); };
// a visor with gold oak leaves along its edge (a captain's "scrambled eggs")
export const visorGoldP = (p, w, h, face) => { visorP(p, w, h, face); if (face === 'up' || face === 'south') for (let x = 0; x < w; x++) { const y = face === 'up' ? h - 2 : 0; p.px(x, y, x % 3 === 0 ? GOLD[0] : GOLD[1]); if (face === 'up' && x % 3 === 1) p.px(x, y - 1, GOLD[2]); } };
// a jacket sleeve with a navy cuff and gold rings
export const cuffP = (p, w, h, face) => { clothP(p, w, h, face); if (face === 'up' || face === 'down') return; for (let y = h - 4; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === h - 3 ? GOLD[1] : TK.navy); };

// the vinyl peeking out of the sleeve (a plane: transparent outside the disc, sits flush behind the sleeve)
export const vinylP = (p, w, h) => {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R; if (d > 1) continue;
    p.px(x, y, d < 0.12 ? '#0a0608' : d < 0.36 ? (y < cy ? '#ff7a52' : '#e8306a') : (Math.round(d * 14) % 3 === 0 ? '#2a2630' : '#141018'));
  }
  p.px(Math.round(cx - R * 0.55), Math.round(cy - R * 0.55), '#8a8a98');
};
// a gold record (the album went gold): the same disc in gold, framed
export const goldDiscP = (p, w, h) => {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R; if (d > 1) continue;
    p.px(x, y, d < 0.14 ? '#5a3a0a' : d < 0.36 ? '#ff6a3a' : d > 0.9 ? GOLD[2] : Math.round(d * 12) % 3 === 0 ? GOLD[2] : (x + y) % 9 === 0 ? GOLD[0] : GOLD[1]);
  }
};

// ---------------------------------------------------------------- shades, lei, cloth
// tear-drop shades: gold rims, sunset lenses in flat bands, one square glint
export const lensP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const edge = y === 0 || x === 0 || x === w - 1 || y === h - 1;
    p.px(x, y, face !== 'south' || edge ? GOLD[2] : ramp(['#ff8a3a', '#e8306a', '#7a2a8a', '#2a1a4a'], y / (h - 1), x, y));
  }
  if (face === 'south') { p.px(1, h - 1, 0).px(0, h - 1, 0).px(0, h - 2, 0); p.px(2, 2, '#ffffff').px(3, 2, '#ffffff'); }  // the tear-drop's cut corner
};
export const frameP = gradient([GOLD[0], GOLD[1], GOLD[2]]);
// hibiscus lei: big flowers strung edge to edge
export const leiP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = Math.floor(x / 4) % 3, cx = (x % 4), col = k === 0 ? [TK.hibHi, TK.hib, TK.hibLo] : k === 1 ? ['#ffe890', '#ffc83a', '#e09a1a'] : ['#ffffff', '#ffd8e8', '#e8a0c0'];
    p.px(x, y, face === 'down' ? col[2] : cx === 3 ? col[2] : y === 0 ? col[0] : (cx === 1 && y === Math.floor(h / 2)) ? '#ffe04a' : col[1]);
  }
};
export const clothP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#ffffff' : face === 'down' ? TK.clothLo : ramp(['#ffffff', TK.cloth, '#e4e6ee', TK.clothLo], y / Math.max(1, h - 1), x, y)); if (side(face)) for (let x = 0; x < w; x++) if (x % 9 === 4) for (let y = 1; y < h - 1; y++) p.px(x, y, shift(ramp(['#ffffff', TK.cloth, '#e4e6ee', TK.clothLo], y / Math.max(1, h - 1), x, y), -0.05)); };
export const visorP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#3a3a4a' : face === 'down' ? '#0a0a10' : y === 0 ? '#4a4a5a' : '#141420'); if (face === 'up') for (let x = 1; x < w - 1; x += 3) p.px(x, 1, '#6a6a7e'); };
export const braidP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 3 === 0 ? GOLD[0] : (x + y) % 3 === 1 ? GOLD[1] : GOLD[2]); };
// an original cap badge: gold wings spread over a wave (no real insignia)
export const badgeP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' ? 0 : GOLD[2]);
  if (face !== 'south') return;
  const cx = (w - 1) / 2;
  for (let x = 0; x < w; x++) { const d = Math.abs(x - cx), y = Math.round(h * 0.25 + d * 0.35); for (let yy = y; yy < Math.min(h * 0.6, y + 2); yy++) p.px(x, yy, d < 1 ? GOLD[0] : GOLD[1]); }
  for (let x = 1; x < w - 1; x++) p.px(x, Math.round(h * 0.72 + Math.sin(x * 1.2) * 0.8), '#3ad0e0');
  p.px(Math.round(cx), Math.round(h * 0.2), '#ffffff');
};

// ---------------------------------------------------------------- particles
const hibSpr = (p, w, h) => stamp(p, FLOWER, { f: TK.hib, F: TK.hibHi, d: TK.hibLo, c: TK.hibC }, 0, 0);
const waveSpr = (p, w, h, f) => {           // a small curling wave crest
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / (w - 1), v = y / (h - 1), crest = 0.35 + 0.45 * Math.sin(u * Math.PI * (0.9 + f * 0.1));
    if (v < 1 - crest) continue;
    p.px(x, y, v < 1 - crest + 0.15 ? '#ffffff' : v < 0.7 ? '#5adcd0' : '#1fb0aa');
  }
};
export const TKFX = {
  hibiscus: defineFx('tk-hibiscus', { w: 5, h: 5, paint: hibSpr, life: [1.0, 1.6], size: [0.12, 0.12], speed: [0.5, 1.2], grav: 0.5, drag: 2, spread: 1, flutter: true, spin: 2 }),
  wave: defineFx('tk-wave', { w: 12, h: 8, frames: [0, 1].map(() => waveSpr), life: [0.5, 0.8], size: [0.2, 0.45], speed: [0.4, 0.9], grav: 1.2, drag: 1.4, spread: 0.6, fade: true }),
};

// ---------------------------------------------------------------- the ultra-drip form
// brown plumage → black lacquer, white head and cloth stay, beak and talons → gold, the aloha
// ground → deep teal-black with gold flowers, sunset colours → rose gold
export const eagleForm = formMap(({ h, s, l }, glow, hex) => {
  if (glow) return undefined;
  if (s < 0.14) return 'keep';
  if (h >= 160 && h < 200 && s > 0.4) return fromHsl(186, 0.5, 0.04 + l * 0.2);             // sea / aloha ground → black teal
  if (h >= 330 || h < 12) return l > 0.5 ? 'gold' : fromHsl(345, 0.4, 0.06 + l * 0.2);         // hibiscus → gold, deep reds → black ruby
  if (h >= 12 && h < 40 && s > 0.6 && l > 0.5) return fromHsl(28, 0.8, 0.45 + l * 0.3);       // sunset orange → rose gold
  return undefined;
});

// ---------------------------------------------------------------- eyes (§7/§9: full-res, hand drawn, unique per species)
// palette: l line · w white · s shaded white · k pupil · h highlight · i iris · I dark iris (under the lid) · c pale
// lower iris (accent). Irises are shaped fills with a pupil and two highlights — never concentric rings.
// Talonaka: a sharp amber eagle eye, no whites, the brow's lid line slanting down toward the beak
export const EYE_TALONAKA = {
  open: ['............', 'lll.........', '.lllllllllll', '.lIIIIIIIIIl', '.liiIhhkkIil', '.liiihhkkiil', '.liiikkkhiil', '.lciiikkiicl', '..lcciiiccl.', '...llllll...'],
  angry: ['............', 'lll.........', '.llllll.....', '.lIIllllllll', '.liiIIIIllll', '.liiihhkkIil', '.liiikkkhiil', '.lciiikkiicl', '..lcciiiccl.', '...llllll...'],
  sad: ['............', '..........ll', '.......lllll', '.llllllllIIl', '.lllIIIIiiil', '.liiihhkkiil', '.liiikkkhiil', '.lciiikkiicl', '..lcciiiccl.', '...llllll...'],
  happy: ['............', '............', '............', '....llll....', '..llllllll..', '.lll....lll.', '.ll......ll.', '.l........l.', '............', '............'],
  closed: ['............', '............', '............', '............', '............', '.l........l.', '.llllllllll.', '..llllllll..', '............', '............'],
  shock: ['.llllll.....', '.lllllllllll', '.liiiiiiiiil', '.liiiiiiiiil', '.liiiihkiiil', '.liiiikkiiil', '.liiiiiiiiil', '.lciiiiiiicl', '..lcccccccl.', '...llllll...'],
  smug: ['............', '............', '............', '............', '.llllll.....', '.lllllllllll', '.liihhkkkIil', '.liiikkkhiil', '..lcciiiccl.', '...llllll...'],
};
// Takaptain: a long, sharp, commanding gold eye — a heavy flat brow line, a tapered inner corner
export const EYE_CAPTAIN = {
  open: ['lll...........', '.llllllllllll.', '..llllllllllll', '.lIIIIIIIIIIIl', '.liiiIhhkkkIil', '.liiiihhkkkiil', '..lciiikkkhil.', '...lcciiiicl..', '.....llllll...'],
  angry: ['..............', 'lll...........', '.lllllll......', '.lIIIlllllll..', '.liiiIhhIlllll', '.liiiihhkkkiil', '..lciiikkkhil.', '...lcciiiicl..', '.....llllll...'],
  sad: ['..............', '...........ll.', '.......lllllll', '..llllllllIIIl', '.llllIhhkkkIil', '.liiiihhkkkiil', '..lciiikkkhil.', '...lcciiiicl..', '.....llllll...'],
  happy: ['..............', '..............', '.....llll.....', '...llllllll...', '..lll....lll..', '.ll........ll.', '.l..........l.', '..............', '..............'],
  closed: ['..............', '..............', '..............', '..............', '.l..........l.', '.llllllllllll.', '..llllllllll..', '..............', '..............'],
  shock: ['.lllllllll....', '.lllllllllllll', '.liiiiiiiiiiil', '.liiiiihkiiiil', '.liiiiikkiiiil', '..liiiiiiiiil.', '..lcciiiiiccl.', '...lccccccl...', '.....llllll...'],
  smug: ['..............', '..............', '..............', '.lllllll......', '.lllllllllllll', '.liiiihhkkkiil', '..lciiikkkhil.', '...lcciiiicl..', '.....llllll...'],
};
// Hawkabunga: a laid-back droopy eye WITH whites, the outer corner low; a sea-green iris low on the inner side
export const EYE_SURFER = {
  open: ['....lllllll.', '..llllllllll', '.llssssssssl', 'llwwwIIIIIwl', 'lwwwIhhkkIwl', 'lwwwihhkkiwl', '.lwwwikkhiwl', '..lwwciiicl.', '...lllllll..'],
  angry: ['............', 'lll.........', '.lllllll....', '.lwsslllllll', 'lwwwIIIIllll', 'lwwwihhkkiwl', '.lwwwikkhiwl', '..lwwciiicl.', '...lllllll..'],
  sad: ['............', '..........ll', '......llllll', '..lllllllssl', 'llllwIIIIIwl', 'lwwwihhkkiwl', '.lwwwikkhiwl', '..lwwciiicl.', '...lllllll..'],
  happy: ['............', '............', '....llll....', '..llllllll..', '.lll....lll.', 'll........ll', '............', '............', '............'],
  closed: ['............', '............', '............', '............', 'll........ll', '.llllllllll.', '...llllll...', '............', '............'],
  shock: ['...lllllll..', '.lllllllllll', '.lwwwwwwwwwl', 'lwwwwwwwwwwl', 'lwwwwwhkwwwl', 'lwwwwwkkwwwl', '.lwwwwwwwwl.', '..lwwwwwwl..', '...llllll...'],
  smug: ['............', '............', '............', '..lllllll...', 'llllllllllll', 'lwwwihhkkiwl', '.lwwwikkhiwl', '..lwwciiicl.', '...lllllll..'],
};
