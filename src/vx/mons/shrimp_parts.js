// Shared parts for the mantis-shrimp line — Foopod → Everpunch, the Foo Fighters homage.
// Mirroring helpers, painters (rainbow armour plates, leopard-spotted shell, smashing
// clubs, combed long hair, tail-fan blades, the stalked eyes with their striped midband
// and triple pseudopupil), a retro toy ray gun, the line's particle kinds (cavitation
// flash and bubbles, ray-gun rings, foo-fighter orbs, the sonic shockwave) and rig
// helpers (two-bone leg IK that keeps the feet planted, step cycles, eye saccades).
import { E, seg } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, gradient, poly, ramp, shift, mix, h2 } from './kit.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

// ---------------------------------------------------------------- building
// a cube from two corners (model units)
export const B = (x0, y0, z0, x1, y1, z1, tex, x = {}) => ({ o: [x0, y0, z0], s: [x1 - x0, y1 - y0, z1 - z0], tex, ...x });
// mirror a right-side (−x) part to the left (+x): x flips, rotations about y and z flip, texture U flips
export const flipC = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: c.plane === 'x' ? c.mirror : !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
const side = (n) => n && n.replace(/R(\d?)$/, 'L$1');
export const flipB = (b) => ({ name: side(b.name), parent: side(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: b.cubes.map(flipC) });
export const both = (...bs) => [...bs, ...bs.map(flipB)];
// shift every cube of a list by [dx, dy, dz] (pivots too)
export const moveC = (cs, d) => cs.map((c) => ({ ...c, o: [c.o[0] + d[0], c.o[1] + d[1], c.o[2] + d[2]], ...(c.pivot ? { pivot: [c.pivot[0] + d[0], c.pivot[1] + d[1], c.pivot[2] + d[2]] } : {}) }));

// ---------------------------------------------------------------- painters
// a grid of pixel rows → painter (map: char → colour; '.' or missing = transparent)
export const grid = (rows, map) => (p) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = map[r[x]]; if (c) p.px(x, y, c); } });

// armour shell: clean bands lit from above, a lit lip along the top edge and a dark seam along
// the bottom. o: { top, bottom, dots (tubercle spacing), sheen (an iridescent streak colour),
// keel (a ridge down the middle of the front/back), seed }
export function armour(c, o = {}) {
  const top = o.top || shift(c, 0.3), bot = o.bottom || shift(c, -0.34);
  const base = shade(c, { top, bottom: bot, grain: 0, rim: o.rim, seam: o.seam });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'down') return;
    const col = (x, y) => (face === 'up' ? top : ramp([top, c, bot], y / Math.max(1, h - 1), x, y));
    if (o.dots) for (let y = 2; y < h - 2; y += o.dots) for (let x = 1 + ((y / o.dots) & 1) * (o.dots >> 1); x < w - 1; x += o.dots) {
      const j = h2(x, y, o.seed || 3); if (j < 0.42) continue;
      const X = x + (j > 0.8 ? 1 : 0), k = col(X, y);
      p.px(X, y, shift(k, 0.32)); p.px(X, y + 1, shift(k, -0.28));
    }
    if (o.keel && (face === 'south' || face === 'north' || face === 'up')) {
      const m = Math.floor(w / 2);
      for (let y = face === 'up' ? 0 : 1; y < h - 1; y++) { p.px(m - 1, y, shift(col(m, y), 0.26)); p.px(m, y, shift(col(m, y), -0.22)); }
    }
    if (o.sheen && face !== 'up') {     // the rainbow shimmer: a short diagonal streak of the next hue
      const n = Math.max(2, Math.round(Math.min(w, h) * 0.45)), x0 = Math.round(w * 0.16);
      for (let k = 0; k < n; k++) { const x = x0 + k, y = 1 + (k >> 1); if (x < w - 1 && y < h - 2) p.px(x, y, k === 0 ? shift(o.sheen, 0.3) : o.sheen); }
    }
  };
}
// leopard spots (the peacock mantis' freckles): little dark spots with a lit corner on a hashed grid
export function spots(ring, o = {}) {
  const every = o.every || 5;
  return (p, w, h, face) => {
    if (face === 'down' || (o.faces && !o.faces.includes(face))) return;
    for (let y = 1 + (o.y0 || 0); y < h - 2; y += every) for (let x = 1 + ((((y - 1) / every) | 0) & 1) * (every >> 1); x < w - 1; x += every) {
      const j = h2(x, y, o.seed || 9); if (j < (o.skip ?? 0.35)) continue;
      const X = x + (j > 0.72 ? 1 : 0), Y = y + (j > 0.88 ? 1 : 0);
      p.px(X, Y, ring); p.px(X + 1, Y, ring); p.px(X, Y + 1, ring); if (o.core) p.px(X + 1, Y + 1, o.core); else p.px(X + 1, Y + 1, ring);
    }
  };
}
// a plate of rainbow armour: base hue with a lit lip and a darker under-band; `next` tints the lip
// toward the neighbouring hue so a stack of plates reads as one iridescent rainbow
export function rainbowPlate(c, next, o = {}) {
  const top = mix(shift(c, 0.32), next || shift(c, 0.32), 0.35), bot = shift(c, -0.32), deep = shift(c, -0.62);
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let col;
      if (face === 'up') col = (x + y) % 7 === 0 ? shift(top, 0.18) : top;
      else if (face === 'down') col = deep;
      else {
        const t = h > 1 ? y / (h - 1) : 0.5;
        col = y === 0 ? shift(top, 0.22) : y === h - 1 ? deep : ramp([top, c, c, bot], t, x, y);
      }
      p.px(x, y, col);
    }
    if (face === 'up' || face === 'down') return;
    // side notches where the plates hinge, a sheen streak, and two pores
    if (face === 'south' || face === 'north') {
      for (let y = 1; y < h - 1; y++) { p.px(0, y, bot); p.px(w - 1, y, bot); }
      const n = Math.max(2, Math.round(w * 0.22));
      for (let k = 0; k < n; k++) { const x = Math.round(w * 0.12) + k, y = 1 + ((k / 2) | 0); if (y < h - 2) p.px(x, y, shift(top, 0.3)); }
      if (o.pores !== false && h > 4) for (const fx of [0.3, 0.7]) p.px(Math.round(w * fx), h - 3, bot);
    }
  };
}
// a striped band (bands of colour along the height), e.g. the eye stalks and antenna whips
export const bands = (cols, o = {}) => (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = Math.floor((face === 'up' || face === 'down' ? x : y) / (o.every || 2)) % cols.length;
    let c = cols[k]; if (face === 'east' || face === 'north') c = shift(c, -0.18); if (face === 'down') c = shift(c, -0.3);
    if (o.lit && x === 0 && face !== 'up' && face !== 'down') c = shift(c, 0.2);
    p.px(x, y, c);
  }
};
// combed long hair. Locks of `lock` texels (lit left edge, dark right edge), a glossy band, and on
// planes ragged ends: each lock stops at its own length and tapers to a point.
export function hair(cs, o = {}) {
  const L = o.lock || 3;
  return (p, w, h, face) => {
    if (face === 'up' || face === 'down') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'down' ? cs.lo : (x % L === 0 ? cs.hi : (x + y) % 5 === 0 ? cs.sheen : cs.base)); return; }
    for (let x = 0; x < w; x++) {
      const li = Math.floor((x + (o.off || 0)) / L), lx = (x + (o.off || 0)) % L, r = h2(li, 7, o.seed || 4);
      const end = o.tips ? h - 1 - Math.floor(r * o.tips) : h;          // this lock's last row
      const gy = Math.round(h * (o.band ?? 0.22) + (r - 0.5) * 2);       // the glossy band
      for (let y = 0; y < h; y++) {
        if (y > end) break;
        const toTip = end - y, mid = Math.floor(L / 2);
        if (o.tips && toTip < 2 && (toTip === 0 ? lx !== mid : lx === 0 && L > 2)) continue;   // taper
        let c = lx === 0 ? cs.hi : lx === L - 1 ? cs.lo : cs.base;
        if (y === gy || y === gy + 1) c = lx === L - 1 ? cs.base : lx === 0 ? cs.sheen : cs.hi;
        if (o.tips && toTip === 0) c = cs.lo;
        if (y === 0 && o.root) c = cs.lo;
        p.px(x, y, c);
      }
    }
  };
}
// a fan blade (uropod / telson) for flat planes: rounded paddle, keel line, a peacock eyespot and
// a fringe of spines along the far edge. Drawn with the blade's root at y = 0 (painter row 0).
export function blade(cs, o = {}) {
  return (p, w, h) => {
    const cx = (w - 1) / 2;
    for (let y = 0; y < h; y++) {
      const v = y / Math.max(1, h - 1), half = (o.taper ? 0.55 + 0.45 * Math.sin(Math.min(1, v * 1.4) * Math.PI * 0.5) : 1) * (w / 2) * (v > 0.82 ? Math.sqrt(Math.max(0, 1 - ((v - 0.82) / 0.2) ** 2)) * 0.5 + 0.5 : 1);
      for (let x = 0; x < w; x++) {
        const d = Math.abs(x - cx) / Math.max(0.5, half); if (d > 1) continue;
        let c = ramp([cs.root, cs.base, cs.edge], v * 1.05, x, y);
        if (d > 0.82) c = cs.rim;
        if (Math.abs(x - cx) < 0.6 && v < 0.85) c = cs.keel;
        p.px(x, y, c);
      }
    }
    if (o.eye) {     // the peacock eyespot near the far end
      const ex = Math.round(cx), ey = Math.round(h * 0.7);
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const r = Math.hypot(x, y); if (r > 2.3) continue; p.px(ex + x, ey + y, r > 1.5 ? cs.eyeRing : r > 0.6 ? cs.eye : cs.eyeCore); }
    }
    if (o.spines) for (let x = 1; x < w - 1; x += 2) { p.px(x, h - 1, cs.spine); }
  };
}

// ---------------------------------------------------------------- the stalked eye
// 11 × 13 texels; outer side x = 0, inner side x = 10 (right eye; the left one is mirrored).
// The mantis-shrimp eye: two dark hemispheres split by a striped midband, and the three
// pseudopupils that line up into one slit when it stares at you. Cool and alien — never cute.
export const EYE_W = 11, EYE_H = 13;
export const EYE_ROWS = {
  glare: ['SSSSSSSSSSS', 'dSSSSSSSSSd', 'dHhHHHKHHHd', 'dHHHHHKHHHd', 'dHHHHKKKHHd', 'KKKKKKKKKKK', 'MMMMMMKMMMM', 'YYYYYYKYYYY', 'CCCCCCKCCCC', 'KKKKKKKKKKK', 'dHHHHKKKHHd', 'dHHHHHKHHHd', 'ddddddddddd'],
  focus: ['KKKKKKKKKKK', 'SSSSSSSSSSS', 'SSSSSSSSSSS', 'dSSSSSSSSSd', 'dHHHHHKHHHd', 'KKKKKKKKKKK', 'MMMMMMKMMMM', 'WWWWWWKWWWW', 'CCCCCCKCCCC', 'KKKKKKKKKKK', 'dHHHHHKHHHd', 'dSSSSSSSSSd', 'KKKKKKKKKKK'],
  wide: ['dhhhhhhhhhd', 'hHHHHHHHHHh', 'hHHHHKKHHHh', 'hHHHHKKHHHh', 'hHHHHHHHHHh', 'KKKKKKKKKKK', 'MMMMMMMMMMM', 'YYYYYKKYYYY', 'CCCCCCCCCCC', 'KKKKKKKKKKK', 'hHHHHKKHHHh', 'hHHHHKKHHHh', 'dhhhhhhhhhd'],
  smug: ['LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'lllllllllll', 'KKKKKKKKKKK', 'dHHHHHKHHHd', 'MMMMMMKMMMM', 'YYYYYYKYYYY', 'CCCCCCKCCCC', 'KKKKKKKKKKK', 'lllllllllll', 'LLLLLLLLLLL', 'LLLLLLLLLLL'],
  closed: ['LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'lllllllllll', 'KKKKKKKKKKK', 'lllllllllll', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'lllllllllll'],
  x: ['dHHHHHHHHHd', 'KKHHHHHHHKK', 'HKKHHHHHKKH', 'HHKKHHHKKHH', 'HHHKKHKKHHH', 'HHHHKKKHHHH', 'HHHHHKHHHHH', 'HHHHKKKHHHH', 'HHHKKHKKHHH', 'HHKKHHHKKHH', 'HKKHHHHHKKH', 'KKHHHHHHHKK', 'dHHHHHHHHHd'],
  swirl: ['dHHHHHHHHHd', 'HHKKKKKKKHH', 'HKHHHHHHHKH', 'KHHKKKKKHHK', 'KHKHHHHHKHK', 'KHKHKKKHKHK', 'KHKHKHKHKHK', 'KHKHKKHHKHK', 'KHKHHHHKHHK', 'KHHKKKKHHKH', 'HKHHHHHHKHH', 'HHKKKKKKHHH', 'dHHHHHHHHHd'],
};
export const eyeMap = (P) => ({ K: P.ink, H: P.eye, h: P.eyeHi, d: P.eyeLo, S: P.eyeShade, M: P.band[0], Y: P.band[1], C: P.band[2], W: '#ffffff', L: P.lid, l: shift(P.lid, -0.35) });
// the eyeball box: hemispheres with the midband wrapping all the way round
export const eyeballP = (P) => (p, w, h, face) => {
  const b0 = Math.round(h * 5 / 13), b1 = Math.round(h * 10 / 13) - 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c;
    if (face === 'up') c = (x === 1 && y === 1) || (x === 2 && y === 1) ? P.eyeHi : (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? P.eyeLo : P.eye;
    else if (face === 'down') c = P.eyeLo;
    else if (y === b0 || y === b1) c = P.ink;
    else if (y > b0 && y < b1) c = P.band[Math.min(2, y - b0 - 1)];
    else c = x === 0 || x === w - 1 || y === 0 || y === h - 1 ? P.eyeLo : (y === 1 && x < 3 ? P.eyeHi : P.eye);
    if (face === 'east' || face === 'north') c = shift(c, -0.12);
    p.px(x, y, c);
  }
};
// the cover that closes over the whole eyeball (sleep, blinks): shell with a lid seam
export const eyeShutP = (P) => (p, w, h, face) => {
  armour(P.lid, { top: shift(P.lid, 0.3), bottom: shift(P.lid, -0.3), rim: false })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  const y = Math.round(h * 0.55); for (let x = 0; x < w; x++) { p.px(x, y, P.ink); p.px(x, y - 1, shift(P.lid, -0.35)); }
};

// ---------------------------------------------------------------- the retro toy ray gun
// A 1950s-style toy blaster, an original design: candy-red bulb chamber, chrome rings down the
// barrel, a flared yellow muzzle dish, swept fins and a glowing green emitter and bulb.
// Built in its own frame: grip top at o, barrel along +z, up +y. `id` lets a slot show/hide it.
export const GUN = { red: '#e8403c', redHi: '#ff8a6c', redLo: '#9a1e30', chrome: '#dfe4ee', chromeLo: '#7c84a0', fin: '#ffd23a', finLo: '#e0801c', grip: '#4a2a3a', glow: '#9affc0', glowHi: '#f0fff4', glowLo: '#2ee08a' };
const gunRed = (p, w, h, face) => {
  shade(GUN.red, { top: GUN.redHi, bottom: GUN.redLo, grain: 0 })(p, w, h, face);
  if (face === 'east' || face === 'west' || face === 'south' || face === 'north') { const y = Math.max(1, Math.round(h * 0.3)); for (let x = 1; x < w - 1; x++) p.px(x, y, x % 4 === 3 ? GUN.red : '#ffd0c0'); }
  if (face === 'up') for (let x = 1; x < w - 1; x += 2) p.px(x, Math.floor(h / 2), '#ffb8a8');
};
const gunChrome = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = face === 'up' ? 0.1 : face === 'down' ? 0.95 : y / Math.max(1, h - 1);
    p.px(x, y, ramp(['#ffffff', GUN.chrome, '#a8b0c4', GUN.chromeLo], t, x, y));
  }
};
const gunGrip = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? shift(GUN.grip, 0.2) : y % 3 === 2 ? shift(GUN.grip, -0.3) : x === 0 ? shift(GUN.grip, 0.25) : GUN.grip); };
const gunFin = gradient([GUN.fin, '#ffb02a', GUN.finLo]);
const gunGlow = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? GUN.glow : GUN.glowHi); };
const finShape = (p, w, h) => {      // a swept tail fin (plane): leading edge rakes back, trailing edge vertical
  poly(p, [[0, h], [w * 0.15, h * 0.45], [w * 0.55, 0], [w, 0], [w * 0.85, h]], (x, y) => (y < 1.5 ? '#fff0a0' : x > w * 0.75 ? GUN.finLo : GUN.fin));
  for (let x = Math.round(w * 0.2); x < w - 1; x++) p.px(x, h - 1, GUN.finLo);
};
export function rayGun(o, id, x = {}) {
  const [X, Y, Z] = o, k = x.k || 1, P = (x0, y0, z0, x1, y1, z1, tex, e = {}) => B(X + x0 * k, Y + y0 * k, Z + z0 * k, X + x1 * k, Y + y1 * k, Z + z1 * k, tex, { id, ...(x.shadow === false ? { shadow: false } : {}), ...e });
  return [
    P(-0.55, -2.4, -1.4, 0.55, 0.2, -0.1, gunGrip),                     // grip
    P(-0.3, -1.3, -0.1, 0.3, -0.9, 1.1, gunChrome),                    // trigger guard
    P(-0.15, -0.9, 0.5, 0.15, 0, 0.8, gunChrome),
    P(-1.0, 0, -2.0, 1.0, 2.0, 1.8, gunRed),                           // the bulb chamber
    P(-0.7, -0.3, -1.7, 0.7, 2.3, 1.5, gunRed),
    P(-0.7, 0.3, -2.6, 0.7, 1.7, -2.0, gunChrome),                     // rear cap
    P(-0.95, 0.15, 1.8, 0.95, 1.85, 2.3, gunChrome),                   // chrome rings down the barrel
    P(-0.55, 0.45, 2.3, 0.55, 1.55, 4.7, gunRed),                      // barrel
    P(-0.8, 0.3, 2.9, 0.8, 1.7, 3.3, gunChrome),
    P(-0.8, 0.3, 3.8, 0.8, 1.7, 4.2, gunChrome),
    P(-1.05, -0.05, 4.7, 1.05, 2.05, 5.15, gunFin),                    // flared muzzle dish
    P(-0.45, 0.55, 5.15, 0.45, 1.45, 5.6, gunGlow, { glow: true }),     // emitter
    P(-0.5, 2.0, -0.6, 0.5, 2.8, 0.5, gunGlow, { glow: true }),         // glowing bulb on top
    P(0, 2.0, -2.4, 0, 3.6, 0.2, finShape, { plane: 'x' }),            // top fin
    P(-2.1, 0.9, -2.5, -0.9, 0.9, -0.7, finShape, { plane: 'y' }),     // side fins
    P(0.9, 0.9, -2.5, 2.1, 0.9, -0.7, finShape, { plane: 'y', mirror: true }),
  ];
}
export const MUZZLE = [0, 1.0, 5.7];     // in the gun's own frame, relative to the grip top

// ---------------------------------------------------------------- particles
const flashSpr = (p, w, h) => {            // sonoluminescence: a hard white burst with blue-white rays
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - c, dy = y - c, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), ray = Math.abs(Math.cos(a * 4)) ** 8;
    if (r < 2.6) p.px(x, y, '#ffffff');
    else if (r < 3.8) p.px(x, y, '#e8f8ff');
    else if (ray > 0.5 && r < c + 0.4) p.px(x, y, r < c * 0.7 ? '#ffffff' : '#a8e4ff');
  }
};
const bubSpr = (p, w, h) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - c); if (d > c + 0.3) continue; if (d > c - 1) p.px(x, y, x + y < w - 2 ? '#f0fcff' : '#7ac8ec'); else if (x === 1 && y === 1) p.px(x, y, '#ffffff'); }
};
const ringSpr = (col, hi) => (p, w, h) => { const m = (w - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - m, y - m); if (d < m + 0.2 && d > m - 2.2) p.px(x, y, d > m - 1 ? col : hi); } };
const dotSpr = (core, edge) => (p, w, h) => { const c = (w - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - c); if (d > c + 0.3) continue; p.px(x, y, d < c * 0.5 ? core : edge); } };
const orbSpr = (p, w, h) => {              // a foo-fighter: a hot white core in a dithered amber halo
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - c, y - c) / c;
    if (d < 0.35) p.px(x, y, '#ffffff'); else if (d < 0.6) p.px(x, y, '#fff2b0'); else if (d < 0.85) p.px(x, y, '#ffb84a'); else if (d < 1.05 && (x + y) % 2) p.px(x, y, '#ff7a2a');
  }
};
export const FX = {
  flash: defineFx('shrimp-flash', { w: 17, h: 17, paint: flashSpr, glow: true, life: [0.1, 0.13], size: [0.5, 0.95], speed: [0, 0], grav: 0, fade: true }),
  bub: defineFx('shrimp-bub', { w: 6, h: 6, paint: bubSpr, life: [0.28, 0.55], size: [0.07, 0.025], speed: [1.6, 3.6], grav: -1.2, drag: 5, spread: 1 }),
  ring: defineFx('shrimp-ring', { w: 24, h: 24, paint: ringSpr('#c8f4ff', '#ffffff'), glow: true, life: [0.2, 0.24], size: [0.12, 1.1], speed: [0, 0], grav: 0, fade: true }),
  zap: defineFx('shrimp-zap', { w: 5, h: 5, paint: dotSpr('#ffffff', '#7affc4'), glow: true, life: [0.1, 0.16], size: [0.09, 0.05], speed: [7, 8], grav: 0, drag: 0, spread: 0.02 }),
  zapring: defineFx('shrimp-zapring', { w: 16, h: 16, paint: ringSpr('#4affa0', '#e8fff0'), glow: true, life: [0.32, 0.4], size: [0.05, 0.42], speed: [3.4, 3.8], grav: 0, drag: 1.2, spread: 0.02, fade: true }),
  orb: defineFx('shrimp-orb', { w: 9, h: 9, paint: orbSpr, glow: true, life: [0.35, 0.7], size: [0.1, 0.02], speed: [0.1, 0.5], grav: -0.3, drag: 1.5, spread: 1, fade: true }),
  shock: defineFx('shrimp-shock', { w: 32, h: 32, paint: ringSpr('#ffd27a', '#ffffff'), glow: true, life: [0.42, 0.5], size: [0.3, 3.2], speed: [0, 0], grav: 0, fade: true }),
};

// ---------------------------------------------------------------- rig helpers
// rotate v (degrees, three.js Euler order XYZ: Rz first, then Ry, then Rx)
export function rotXYZ(v, rx, ry, rz) {
  let [x, y, z] = v, c = Math.cos(rz * D2R), s = Math.sin(rz * D2R);
  [x, y] = [x * c - y * s, x * s + y * c];
  c = Math.cos(ry * D2R); s = Math.sin(ry * D2R); [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rx * D2R); s = Math.sin(rx * D2R); [y, z] = [y * c - z * s, y * s + z * c];
  return [x, y, z];
}
// two-bone IK in the leg's own plane: angles (radians) of thigh and shin from hanging straight
// down, + = swung forward (+z). The knee always bends forward.
export function ik2(hy, hz, fy, fz, L1, L2) {
  const dy = hy - fy, dz = fz - hz, d = clamp(Math.hypot(dy, dz), Math.abs(L1 - L2) + 0.02, L1 + L2 - 0.002);
  const base = Math.atan2(dz, dy), a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), a1 = base + a;
  const ky = hy - L1 * Math.cos(a1), kz = (fz - dz) + L1 * Math.sin(a1);
  return [a1, Math.atan2(fz - kz, ky - fy)];
}
// legs that stay planted under a moving body. cfg: { body: pivot, hip: right hip pivot, ankle: right ankle
// (rest), L1, L2 }. stance(P, { dx, dy, dz, rx, ry, rz (the body), f: { R: [dx, dy, dz] }, toe: { R: deg } })
export function legRig(cfg) {
  const { body, hip, ankle, L1, L2 } = cfg;
  return function stance(P, o = {}) {
    const dx = o.dx || 0, dy = o.dy || 0, dz = o.dz || 0, rx = o.rx || 0, ry = o.ry || 0, rz = o.rz || 0;
    P.pos('body', dx, dy, dz).rot('body', rx, ry, rz);
    for (const [S, g] of [['R', 1], ['L', -1]]) {
      const h0 = [hip[0] * g, hip[1], hip[2]], v = rotXYZ([h0[0] - body[0], h0[1] - body[1], h0[2] - body[2]], rx, ry, rz);
      const H = [body[0] + v[0] + dx, body[1] + v[1] + dy, body[2] + v[2] + dz];
      const f = (o.f && o.f[S]) || [0, 0, 0], F = [ankle[0] * g + f[0], ankle[1] + f[1], ankle[2] + f[2]];
      const lean = Math.atan2(F[0] - H[0], H[1] - F[1]), down = Math.hypot(H[1] - F[1], F[0] - H[0]);
      const [a1, a2] = ik2(down, H[2], 0, F[2], L1, L2);
      P.pos('thigh' + S, H[0] - h0[0], H[1] - h0[1], H[2] - h0[2]).rot('thigh' + S, -a1 / D2R, 0, lean / D2R);
      P.rot('shin' + S, -(a2 - a1) / D2R, 0, 0).rot('foot' + S, a2 / D2R + ((o.toe && o.toe[S]) || 0), 0, -lean / D2R);
    }
  };
}
// a walk/shuffle step for one foot: u 0..1; the first half is stance (the foot slides back), the
// second half the swing (it lifts and comes forward). → [dy, dz]
export function step(u, stride, lift) {
  u = ((u % 1) + 1) % 1;
  if (u < 0.5) return [0, stride * (1 - 4 * u)];
  const k = (u - 0.5) / 0.5;
  return [lift * Math.sin(k * Math.PI), stride * (-1 + 2 * E.inout(k))];
}
// a mantis-shrimp eye movement: holds, then snaps to the next angle (keys [[t, value], …] on a loop)
export function saccade(t, keys, tr = 0.07) {
  let i = keys.length - 1; while (i > 0 && t < keys[i][0]) i--;
  const prev = keys[(i - 1 + keys.length) % keys.length][1];
  return prev + (keys[i][1] - prev) * E.out3(clamp((t - keys[i][0]) / tr, 0, 1));
}
// cyclic frame index (animated texture states)
export const cyc = (t, fps, n) => Math.floor(t * fps) % n;
export { seg, TAU, D2R };
