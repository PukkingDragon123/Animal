// Beatlet — Taro's partner (Bio). A chubby little rhinoceros beetle and a wink at the
// Beatles: its glossy head shell is a 1960s mop-top bowl cut with a fringe down to its
// eyes, it wears a hot-pink band-jacket collar with gold frogging and gold epaulettes, its
// belly plates are striped like a zebra crossing, and its six stubby feet are pointed,
// heeled boots. A small forked horn rises from its crown with a leaf sprout growing in the
// fork. It is sunny and always singing; it walks with a long, easy crosswalk stride, and it
// takes its bows at the end of every show.
import { E, seg, bump, wob, wave, bounce } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, poly, ramp, shift } from './kit.js';

const C = {
  shell: '#7a4226', shellHi: '#b86a3a', shellLo: '#4e2618', shellDeep: '#2e1410', gloss: '#ffe2c0',
  hair: '#3e2030', hairHi: '#7a4a64', hairLo: '#220e1a', hairGl: '#d4a0bc',
  face: '#f6e2c0', faceHi: '#fff4dc', faceLo: '#dcb890', faceDeep: '#b48a6a',
  satin: '#ff4fa3', satinHi: '#ff9ccc', satinLo: '#c42a78', satinDeep: '#8a1a56',
  gold: '#ffd23e', goldHi: '#fff6b0', goldLo: '#d0902a', goldDeep: '#8a561a',
  leg: '#4e283c', legHi: '#7a4650', legLo: '#2a1220',
  boot: '#201820', bootHi: '#5a4a56', bootLo: '#100a10',
  zb: '#24222c', zw: '#f4f2ea',
  horn: ['#9a5440', '#622c32', '#3e1826', '#260c1a'],
  leaf: '#7ad04a', leafHi: '#d8ff8a', leafLo: '#3e9a36', leafDeep: '#246a2c',
  ink: '#24101a', iris: '#d08a32', irisLo: '#7a4012', glint: '#fff4d8', mouth: '#5a1a24', tongue: '#ff7a8a',
};
const TAU = Math.PI * 2, R2D = 180 / Math.PI, PPU = 3;

// ---------------------------------------------------------------- painters
function at(face, c, x, y) {
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s, u = (x + 0.5) / PPU, v = (y + 0.5) / PPU, m = !!c.mirror;
  switch (face) {
    case 'south': return [m ? ox + sx - u : ox + u, oy + sy - v, oz + sz];
    case 'north': return [m ? ox + u : ox + sx - u, oy + sy - v, oz];
    case 'east': return [m ? ox : ox + sx, oy + sy - v, oz + sz - u];
    case 'west': return [m ? ox + sx : ox, oy + sy - v, oz + u];
    case 'up': return [m ? ox + sx - u : ox + u, oy + sy, oz + v];
    case 'down': return [m ? ox + sx - u : ox + u, oy, oz + sz - v];
    default: return [ox + u, oy + sy - v, oz + sz];
  }
}
const band = (cols, face, x, y, h) => face === 'up' ? cols[0] : face === 'down' ? cols[3] : ramp([cols[0], cols[1], cols[2]], h > 1 ? y / (h - 1) : 0.5, x, y);
const SHELL = [C.shellHi, C.shell, C.shellLo, C.shellDeep], HAIR = [C.hairHi, C.hair, C.hairLo, C.hairLo], FACE = [C.faceHi, C.face, C.faceLo, C.faceDeep];
const SATIN = [C.satinHi, C.satin, C.satinLo, C.satinDeep], GOLD = [C.goldHi, C.gold, C.goldLo, C.goldDeep], LEG = [C.legHi, C.leg, C.legLo, C.legLo];
// the body: chestnut chitin; the belly plates in front are a zebra crossing — white bars on black
function bodyP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y] = at(face, cube, x, y);
    let c = band(SHELL, face, x, y, h);
    if (face === 'south') {
      const r = (X / 5.4) ** 2 + ((Y - 7.4) / 5.2) ** 2;
      if (r < 1) { const s = Math.floor((Y - 2.2) / 1.7) & 1; c = s ? (r > 0.8 ? '#c8c6be' : C.zw) : (r > 0.8 ? '#16141c' : C.zb); if (s && Y % 1.7 > 1.45) c = '#dcdad2'; }
      else if (r < 1.18) c = C.shellDeep;
    }
    p.px(x, y, c);
  }
}
// elytra: glossy wing cases — a bright specular streak, fine punctures, a dark seam down the middle
function elytraP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y, Z] = at(face, cube, x, y);
    let c = band(SHELL, face, x, y, h);
    if ((x * 5 + y * 3) % 11 === 0 && face !== 'down') c = shift(c, -0.18);
    const ax = Math.abs(X);
    if ((face === 'north' || face === 'up') && ax < 0.45) c = C.shellDeep;                               // the seam
    const hl = face === 'north' ? Math.abs(ax - 4.6 + (Y - 9) * 0.12) : face === 'up' ? Math.abs(ax - 4.2) : face === 'west' || face === 'east' ? Math.abs(Z + 2.6 - (Y - 8) * 0.25) : 99;
    if (hl < 0.4 && Y > 5 && Y < 12.4) c = C.gloss; else if (hl < 0.9 && Y > 4.4 && Y < 12.8) c = shift(C.shellHi, 0.12);
    p.px(x, y, c);
  }
  if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, 0, C.shellHi);
}
const faceP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, band(FACE, face, x, y, h)); };
// the mop-top: combed-down glossy strands with a broken ring of shine round the crown
function mopP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y, Z] = at(face, cube, x, y);
    let c = band(HAIR, face, x, y, h);
    if (face === 'up') { const r = Math.hypot(X, Z); c = Math.floor(Math.atan2(Z, X) * 5 + 20) & 1 ? C.hair : shift(C.hair, 0.12); if (r > 3.2 && r < 4.4 && Math.floor(Math.atan2(Z, X) * 3 + 20) % 4) c = C.hairHi; }
    else {
      if ((x % 3) === 0) c = shift(c, -0.16);                                                    // strand partings
      if (Y > 21.4 && Y < 22.4 && (x % 7) !== 3) c = face === 'south' || face === 'west' ? C.hairGl : C.hairHi;   // the shine
      if (Y > 22.4 && (x % 3) === 1) c = C.hairHi;
    }
    p.px(x, y, c);
  }
}
// the fringe: straight-cut strands hanging into the eyes, the tips ragged
function fringeP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = band(HAIR, face, x, y, h);
    if (face === 'south' || face === 'north') {
      if (x % 3 === 0) c = shift(c, -0.16);
      if (y === 1 && x % 5 !== 2) c = C.hairHi;
      if (y >= h - 1 && x % 3 === 1) c = 0;
      if (y >= h - 2 && x % 6 === 4) c = 0;
    }
    p.px(x, y, c);
  }
}
// the band-jacket collar: hot-pink satin, gold piping top and bottom, gold frogging loops across the front
function collarP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (y === 0 || y === h - 1) && face !== 'up' && face !== 'down' ? (y === 0 ? C.goldHi : C.goldLo) : band(SATIN, face, x, y, h));
  if (face !== 'south') return;
  const m = Math.floor(w / 2);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
    const x0 = m + sx * (2 + k * 4), y0 = 1 + k % 2;
    for (let i = 0; i < 4; i++) p.px(x0 + sx * i, y0 + (i === 0 || i === 3 ? 1 : 0), C.gold);
    p.px(x0 + sx, y0 + 2, C.goldLo); p.px(x0 + sx * 2, y0 + 2, C.goldLo);
  }
  p.px(m, 1, C.goldHi); p.px(m, 2, C.gold); p.px(m - 1, 2, C.goldLo); p.px(m, 3, C.goldLo);
}
const goldP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 4 === 0 && face !== 'down' ? C.goldHi : band(GOLD, face, x, y, h)); };
const tasselP = (p, w, h) => { for (let x = 0; x < w; x++) if (x % 2 === 0) for (let y = 0; y < h - (x % 4 === 0 ? 0 : 1); y++) p.px(x, y, y === 0 ? C.goldHi : y > h - 3 ? C.goldLo : C.gold); };
const legP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, band(LEG, face, x, y, h)); if (face !== 'up' && face !== 'down') for (let x = 1; x < w - 1; x += 3) p.px(x, 1, C.legHi); };
const bootP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.bootHi : y === 0 ? C.bootHi : y === h - 1 ? C.bootLo : C.boot); if (face === 'east' || face === 'west') for (let x = 1; x < w - 1; x++) p.px(x, 1, x % 4 === 1 ? '#8a7a86' : C.bootHi); };
const heelP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? '#5a3a30' : '#3a2620'); };
const hornP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.horn[0] : ramp(C.horn, h > 1 ? y / (h - 1) : 0.5, x, y)); if (face !== 'up' && face !== 'down') { p.px(0, 0, '#ffd8c0'); p.px(1, 0, '#c07a50'); } };
const leafP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.leafHi : y === Math.floor(h / 2) && face !== 'down' ? C.leafLo : ramp([C.leafHi, C.leaf, C.leafLo], h > 1 ? y / (h - 1) : 0.5, x, y)); };
const stemP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 ? C.leafHi : C.leafLo); };
const clubP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.legHi : band(LEG, face, x, y, h)); if (face === 'south') p.px(1, 1, '#a07a86'); };

// eyes: 10 × 6 texels peeking from under the fringe (outer corner x = 0, right eye; the left mirrored)
const EM = { K: C.ink, W: '#fffaf0', A: C.iris, a: C.irisLo, Y: C.glint, L: C.faceLo };
const grid = (rows, map) => (p) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = map[r[x]]; if (c) p.px(x, y, c); } });
const EYES = {
  peek: ['KKKKKKKKKK', 'KWWaAAAaKK', '.KWAAKKAK.', '..KAAYAK..', '...KKKK...', '..........'],
  sharp: ['KKKKKKKKKK', '.KKKKKKKKK', '..KWAKKaK.', '...KKKKK..', '..........', '..........'],
  wide: ['KWWWWWWWWK', 'KWWAAAAWWK', 'KWAAKKAAWK', 'KWAAKKAAWK', '.KWAAAAWK.', '..KKKKKK..'],
  closed: ['..........', '..........', 'KK......KK', '.KKKKKKKK.', '..........', '..........'],
  x: ['.KK....KK.', '..KK..KK..', '...KKKK...', '..KK..KK..', '.KK....KK.', '..........'],
  swirl: ['..KKKKKK..', '.K......K.', '.K.KKKK.K.', '.K.K..K.K.', '.K..KK..K.', '..KKKKKK..'],
};
// mouth: 10 × 4 texels on the face below the eyes
const MM = { K: C.ink, M: C.mouth, T: C.tongue, W: '#fffaf0' };
const MOUTHS = {
  smile: ['..........', 'K........K', '.KK....KK.', '...KKKK...'],
  sing: ['...KKKK...', '..KMMMMK..', '..KMTTMK..', '...KKKK...'],
  belt: ['.KKKKKKKK.', 'KWWMMMMWWK', 'KMMMTTMMMK', '.KKKKKKKK.'],
  ow: ['..........', '...KKKK...', '..K....K..', '.K......K.'],
};

// ---------------------------------------------------------------- the model
const B = (x0, y0, z0, x1, y1, z1, tex, x = {}) => ({ o: [x0, y0, z0], s: [x1 - x0, y1 - y0, z1 - z0], tex, ...x });
const flipC = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: c.plane === 'x' ? c.mirror : !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
const side = (n) => n && n.replace(/R$/, 'L');
const flipB = (b) => ({ name: side(b.name), parent: side(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: b.cubes.map(flipC) });
const both = (...bs) => [...bs, ...bs.map(flipB)];

const eyeParts = () => Object.entries(EYES).map(([k, rows]) => B(-4.733, 15.6, 5.42, -1.4, 17.6, 5.42, grid(rows, EM), { plane: 'z', id: 'eye-' + k, hide: k !== 'peek' }));
const mouthParts = () => Object.entries(MOUTHS).map(([k, rows]) => B(-1.667, 14, 5.42, 1.667, 15.333, 5.42, grid(rows, MM), { plane: 'z', id: 'mouth-' + k, hide: k !== 'smile' }));
const RIGHT = {
  elytra: { name: 'elytraR', parent: 'body', pivot: [-0.2, 12.8, -3.4], cubes: [
    B(-7.8, 3.2, -7.2, -0.05, 13.2, -2.4, elytraP),
    B(-8.4, 4.2, -5.8, -7.4, 12.4, 0.6, elytraP),
    B(-6.8, 13.2, -6.6, -0.05, 13.8, -2.8, elytraP),
  ] },
  arm: { name: 'armR', parent: 'body', pivot: [-6.4, 11.4, 1.6], cubes: [B(-9, 10.6, 0.8, -6.2, 12.2, 2.4, legP)] },
  fore: { name: 'foreR', parent: 'armR', pivot: [-8.4, 11.4, 1.6], cubes: [
    B(-9.4, 8.2, 0.8, -7.8, 11.6, 2.4, legP),
    B(-9.8, 7, 0.4, -8.6, 8.4, 1.6, bootP),
    B(-8.6, 7, 1.6, -7.4, 8.4, 2.8, bootP),
  ] },
  mid: { name: 'midR', parent: 'body', pivot: [-6.6, 6, 1.2], cubes: [
    B(-9.4, 5.2, 0.4, -6.4, 6.8, 2, legP),
    B(-10, 1.4, 0.4, -8.4, 6.2, 2, legP),
    B(-10.4, 0, -0.6, -8, 1.6, 3.4, bootP),
    B(-9.9, 0, 3.4, -8.5, 1, 4.6, bootP),
    B(-10.2, 0, -1, -8.2, 0.9, 0, heelP),
  ] },
  hind: { name: 'hindR', parent: 'body', pivot: [-6.2, 4.4, -3.2], cubes: [
    B(-9, 3.6, -4, -6, 5.2, -2.4, legP),
    B(-9.6, 1.4, -4, -8, 4.6, -2.4, legP),
    B(-10, 0, -5, -7.6, 1.6, -1.2, bootP),
    B(-9.5, 0, -1.2, -8.1, 1, 0, bootP),
    B(-9.8, 0, -5.4, -7.8, 0.9, -4.4, heelP),
  ] },
  ant: { name: 'antR', parent: 'head', pivot: [-5.4, 16.4, 3.6], rot: [0, 0, -10], cubes: [
    B(-7.8, 16.1, 3.3, -5.2, 16.7, 3.9, legP),
    B(-9.2, 15.6, 2.8, -7.6, 17.2, 4.4, clubP),
  ] },
};

export const def = {
  name: 'beatlet', ppu: 3, scale: 0.38, outline: { color: '#1e0f14', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 4, 0], cubes: [
      B(-6.6, 2.4, -4.8, 6.6, 12.6, 5.2, bodyP),
      B(-7.4, 3.8, -4.2, 7.4, 11.4, 4.6, bodyP),
      B(-5.4, 1.6, -4, 5.4, 2.4, 4.4, bodyP),
      B(-5.8, 12.6, -3.8, 5.8, 13, 4.2, bodyP),
      // the band-jacket collar, with gold epaulettes and their fringe
      B(-5.6, 12.4, -3.4, 5.6, 14.4, 5, collarP),
      B(-7.6, 12.6, -1.6, -5.2, 13.6, 2.4, goldP), B(5.2, 12.6, -1.6, 7.6, 13.6, 2.4, goldP, { mirror: true }),
      B(-7.62, 11.4, -1.6, -7.62, 12.6, 2.4, tasselP, { plane: 'x' }), B(7.62, 11.4, -1.6, 7.62, 12.6, 2.4, tasselP, { plane: 'x' }),
    ] },
    ...both(RIGHT.elytra, RIGHT.arm, RIGHT.fore, RIGHT.mid, RIGHT.hind),
    { name: 'head', parent: 'body', pivot: [0, 13.8, 0.6], cubes: [
      B(-5.6, 13.6, -1.6, 5.6, 19.2, 5.4, faceP),
      B(-7.2, 17.6, -5.6, 7.2, 23, 5.2, mopP),
      B(-6, 23, -4.6, 6, 24.2, 4.4, mopP),
      B(-7.4, 14.2, -5.6, 7.4, 17.6, 2.4, mopP),
      ...eyeParts(), ...eyeParts().map(flipC), ...mouthParts(),
    ] },
    { name: 'fringe', parent: 'head', pivot: [0, 19.4, 5.4], cubes: [B(-6.8, 17.2, 5.2, 6.8, 19.6, 6.2, fringeP)] },
    { name: 'horn', parent: 'head', pivot: [0, 23.6, 1.4], rot: [10, 0, 0], cubes: [
      B(-0.9, 23.4, 0.5, 0.9, 25.8, 2.3, hornP),
      B(-2.6, 25.2, 0.8, -1, 27.4, 2.1, hornP, { pivot: [-0.8, 25.4, 1.4], rot: [0, 0, 26] }),
      B(1, 25.2, 0.8, 2.6, 27.4, 2.1, hornP, { pivot: [0.8, 25.4, 1.4], rot: [0, 0, -26], mirror: true }),
    ] },
    { name: 'sprout', parent: 'horn', pivot: [0, 25.6, 1.4], cubes: [
      B(-0.3, 25.4, 1.1, 0.3, 27.8, 1.7, stemP, { outline: false }),
      B(-2.8, 27.2, 1.15, -0.1, 28.2, 1.65, leafP, { pivot: [-0.1, 27.6, 1.4], rot: [0, 0, -22] }),
      B(0.1, 27.4, 1.15, 2.6, 28.4, 1.65, leafP, { pivot: [0.1, 27.8, 1.4], rot: [0, 0, 28], mirror: true }),
    ] },
    ...both(RIGHT.ant),
  ],
};

// ---------------------------------------------------------------- animation
defineFx('soundring', { w: 16, h: 16, paint: (p) => { const m = 7.5; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - m, y - m); if (d < 7.6 && d > 5.6) p.px(x, y, d > 6.8 ? '#ffffff' : '#c8ffb0'); } }, glow: true, life: [0.7, 0.8], size: [0.08, 0.5], speed: [2.2, 2.6], grav: 0, drag: 0.6, spread: 0.02, fade: true });
defineFx('goldnote', { w: 8, h: 12, paint: (p) => { const c = '#ffd23e', d = '#a8661a'; p.rect(1, 8, 4, 3, c); p.px(0, 9, c); p.px(5, 9, d); p.vl(4, 1, 8, c); p.rect(5, 1, 2, 2, c); p.px(7, 3, c); p.px(7, 4, d); p.px(2, 8, '#fff6b0'); }, glow: true, life: [1.0, 1.3], size: [0.13, 0.11], speed: [0.9, 1.4], grav: -0.4, drag: 0.6, spread: 0.4, wob: 1.6, fade: true });
const MOUTH = [0, 14.6, 6.2], HORN = [0, 27.6, 2], PRESS = [0, 1, 6];
const LEGS = { midR: [-6.6, 6, 1.2], midL: [6.6, 6, 1.2], hindR: [-6.2, 4.4, -3.2], hindL: [6.2, 4.4, -3.2] }, BP = [0, 4, 0];
const ALL = Object.keys(LEGS);
// move the body and keep the four walking feet on the ground: planted legs hang plumb and stretch to the floor
function body(P, dx, dy, dz, pitch = 0, roll = 0, legs = ALL, yaw = 0) {
  P.pos('body', dx, dy, dz).rot('body', pitch, yaw, roll);
  const p = pitch / R2D, r = roll / R2D;
  for (const k of legs) {
    const [x, y, z] = LEGS[k], rx = x - BP[0], ry = y - BP[1], rz = z - BP[2];
    const Y = rx * Math.sin(r) + ry * Math.cos(r), Y2 = Y * Math.cos(p) - rz * Math.sin(p);
    P.rot(k, -pitch, -yaw, -roll).scl(k, 1, Math.max(0.3, (BP[1] + dy + Y2) / y), 1);
  }
}
// arms (the front legs): up (deg, raise sideways), fwd (deg, swing forward), bend (deg, forearm)
function arms(P, S, up = 0, fwd = 0, bend = 0) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -fwd, 0, -g * up).rot('fore' + S, -bend, 0, g * up * 0.5); }
const mouth = (P, m) => P.face('mouth', m);
// a beat of song: the mouth opens on the beat, the head nods, a note floats up now and then
function croon(P, t, bpm = 2, k = 1) {
  const b = (t * bpm) % 1;
  mouth(P, k <= 0 ? 'smile' : b < 0.3 ? 'sing' : b < 0.4 ? 'belt' : 'smile');
}

export const anim = {
  start: 'idle', seed: 9,
  breathe: { bone: 'body', amp: 0.02, per: 2.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.11 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 6 },
  springs: [
    { bone: 'fringe', tip: [0, -2, 1], k: 210, d: 10, gain: 0.8, max: 26, axes: [1, 0.3, 0.5] },
    { bone: 'sprout', tip: [0, 3, 0], k: 140, d: 7, gain: 1, max: 30 },
    { bone: 'antR', tip: [-3.6, 0, 0], k: 160, d: 8, gain: 0.9, max: 28 },
    { bone: 'antL', tip: [3.6, 0, 0], k: 170, d: 8, gain: 0.9, max: 28 },
    { bone: 'foreR', tip: [0, -3, 0], k: 260, d: 12, gain: 0.4, max: 14 },
    { bone: 'foreL', tip: [0, -3, 0], k: 260, d: 12, gain: 0.4, max: 14 },
  ],
  faces: {
    eyes: { default: 'peek', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    mouth: { default: 'smile', states: Object.fromEntries(Object.keys(MOUTHS).map((k) => [k, ['mouth-' + k]])) },
  },
  fidget: { every: [5, 8], clips: ['headbang', 'strum'] },
  clips: {
    // swaying and bouncing on the beat, head bobbing, humming a tune, a snap of the front legs on 2 and 4
    idle: { len: 2.0, loop: true, f(P, t) {
      const b = bounce(t, 0.5, { squash: 0.07, stretch: 0.035 }), sway = Math.sin(t * TAU * 0.5);
      body(P, sway * 0.4, b.u * 0.7 - 0.2, 0, 0, sway * 4);
      P.sq('body', b.sq);
      P.rot('head', 5 - b.u * 7, sway * 6, -sway * 7);
      for (const [S, g] of [['R', 1], ['L', -1]]) {
        const snap = bump((t + (g > 0 ? 0 : 0.5)) % 1, 0.35, 0.65);
        arms(P, S, 10 + 12 * snap, 18 * snap, 30 + 40 * snap);
      }
      croon(P, t, 2);
      P.burst(0.45, 'note', 'head', [5, 22, 3], { n: 1, dir: [0.4, 1, 0.2], speed: 0.8 }).burst(1.45, 'goldnote', 'head', [-5, 22, 3], { n: 1, dir: [-0.4, 1, 0.2], speed: 0.6 });
    } },
    // the crosswalk stride: long, easy scissor steps, front legs swinging, head up, bobbing to the beat
    walk: { len: 0.72, loop: true, f(P, t) {
      const ph = (t / 0.72) * TAU, s = Math.sin(ph), c = Math.cos(ph), up = Math.abs(c);
      body(P, 0, up * 0.8 - 0.2, 0, -5, s * 3, []);
      P.sq('body', -0.05 * (1 - up) ** 3);
      // right middle + left hind step together, then the other pair
      for (const [k, g] of [['midR', 1], ['hindL', 1], ['midL', -1], ['hindR', -1]]) {
        const sw = s * g, lift = Math.max(0, c * g) * (k.startsWith('mid') ? 1 : 0.8);
        P.rot(k, 5 - sw * (k.startsWith('mid') ? 34 : 26), 0, 0).scl(k, 1, 1 - lift * 0.25, 1);
      }
      arms(P, 'R', 12, -s * 34, 24); arms(P, 'L', 12, s * 34, 24);
      P.rot('head', -4 + Math.sin(ph * 2 - 0.6) * 4, s * 4, -s * 3);
      croon(P, t, 2.78, 0.6);
      P.burst(0.05, 'note', 'head', [5, 22, 3], { n: 1, dir: [0.3, 1, -0.4], speed: 0.6 });
    } },
    // "Yeah, yeah, yeah!" — three headbangs, front legs up, notes everywhere, a showman's spread to finish
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.25, E.inout) * (1 - seg(t, 0.25, 0.35, E.out)), on = seg(t, 0.28, 0.42, E.back) * (1 - seg(t, 1.7, 1.95, E.inout));
      const bang = [0.45, 0.75, 1.05].reduce((a, t0) => a + bump(t, t0, t0 + 0.26) ** 0.7, 0), fin = seg(t, 1.3, 1.45, E.back) * (1 - seg(t, 1.75, 1.95));
      body(P, 0, -1.2 * crouch + 1.0 * on + 0.6 * fin, 0, 8 * crouch + 10 * bang - 6 * fin, 0);
      P.sq('body', -0.1 * crouch + 0.06 * on * (1 - seg(t, 0.42, 0.6)) - 0.05 * bang);
      P.rot('head', 10 * crouch + 26 * bang - 16 * fin, 0, wave(t, 3.3) * 6 * on);
      arms(P, 'R', 40 * on + 40 * fin, 20 * on, 60 * on - 40 * fin); arms(P, 'L', 40 * on + 40 * fin, 20 * on, 60 * on - 40 * fin);
      P.rot('elytraR', 0, 0, 10 * fin).rot('elytraL', 0, 0, -10 * fin);
      P.face('eyes', bang > 0.4 ? 'closed' : on > 0.3 ? 'peek' : undefined); mouth(P, on > 0.2 ? (bang > 0.3 || fin > 0.3 ? 'belt' : 'sing') : 'smile'); P.blinkOK = false;
      for (const [i, t0] of [0.5, 0.8, 1.1].entries()) P.burst(t0, i % 2 ? 'goldnote' : 'note', 'head', [i % 2 ? 6 : -6, 22, 4], { n: 3, dir: [i % 2 ? 0.6 : -0.6, 1, 0.3], speed: 1.4 });
      P.burst(1.42, 'goldnote', 'head', MOUTH, { n: 6, dir: [0, 1, 0.6], speed: 1.6, spread: 0.8 }).burst(1.42, 'sparkle', 'head', [0, 24, 2], { n: 8, speed: 1.4 });
    } },
    // horn flip: head down, a scuttling charge, then the horn scoops up and flicks over
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const low = seg(t, 0, 0.22, E.inout) * (1 - seg(t, 0.36, 0.44, E.in)), flip = seg(t, 0.36, 0.46, E.back) * (1 - seg(t, 0.6, 0.95, E.inout));
      const fwd = 5 * seg(t, 0.16, 0.42, E.in) * (1 - seg(t, 0.6, 0.98, E.inout));
      body(P, 0, -1 * low + 1.6 * flip, 0, 26 * low - 22 * flip, 0);
      P.pos('root', 0, 0, fwd).sq('body', -0.08 * low + 0.06 * flip);
      P.rot('head', 22 * low - 46 * flip, 0, 0).rot('horn', -20 * flip, 0, 0);
      for (const k of ['midR', 'midL', 'hindR', 'hindL']) P.rot(k, wave(t, 8, k.length) * 18 * low, 0, 0);
      arms(P, 'R', -10 * low + 30 * flip, -30 * low, 20); arms(P, 'L', -10 * low + 30 * flip, -30 * low, 20);
      P.face('eyes', low > 0.2 || flip > 0.2 ? 'sharp' : undefined); mouth(P, flip > 0.3 ? 'belt' : 'smile'); P.blinkOK = false;
      P.burst(0.42, 'spark', 'horn', HORN, { n: 2 }).burst(0.42, 'leaf', 'horn', HORN, { n: 8, speed: 1.6 }).burst(0.44, 'goldnote', 'horn', HORN, { n: 1, speed: 1.2 }).burst(0.18, 'dust', 'root', [0, 0.5, 0], { n: 6, spread: 1, speed: 1 });
    } },
    // harmony: a big breath, the wing cases flare and buzz, and a wave of song rolls out — rings of sound and a stream of notes
    special: { len: 2.4, next: 'idle', f(P, t) {
      const inhale = seg(t, 0, 0.45, E.inout) * (1 - seg(t, 0.5, 0.6, E.out)), sing = seg(t, 0.52, 0.66, E.back) * (1 - seg(t, 1.85, 2.2, E.inout));
      const buzz = sing * wave(t, 18) * 3;
      body(P, 0, 0.8 * inhale + 0.6 * sing, -0.6 * sing, -8 * inhale + 4 * sing, wave(t, 2) * 3 * sing);
      P.scl('body', 1 + 0.07 * inhale, 1 + 0.04 * inhale, 1 + 0.07 * inhale).sq('body', wave(t, 4) * 0.03 * sing);
      P.rot('head', -16 * inhale - 10 * sing + wave(t, 2, 1) * 4 * sing, wave(t, 1) * 8 * sing, 0);
      P.rot('elytraR', -6 * sing, -16 * sing, 26 * sing + buzz).rot('elytraL', -6 * sing, 16 * sing, -26 * sing - buzz);
      arms(P, 'R', 30 * inhale + 70 * sing, -10 * inhale + 20 * sing, 20); arms(P, 'L', 30 * inhale + 70 * sing, -10 * inhale + 20 * sing, 20);
      P.face('eyes', sing > 0.3 ? 'closed' : undefined); mouth(P, inhale > 0.3 ? 'sing' : sing > 0.2 ? 'belt' : 'smile'); P.blinkOK = false;
      if (sing > 0.5) {
        P.stream('soundring', 'head', MOUTH, { rate: 7, dir: [0, 0.05, 1], tint: [0.8, 1, 0.7] });
        P.stream('note', 'head', MOUTH, { rate: 14, dir: [0, 0.3, 1], speed: 2.2, spread: 0.35, key: 'n' }).stream('goldnote', 'head', MOUTH, { rate: 10, dir: [0, 0.2, 1], speed: 2.4, spread: 0.3, key: 'g' });
        P.stream('leaf', 'body', [0, 10, -6], { rate: 10, dir: [0, 1, -0.4], speed: 1.2, key: 'l' });
      }
      P.burst(0.62, 'ring', 'head', MOUTH, { scale: 0.8, tint: [0.8, 1, 0.6] }).burst(0.62, 'sparkle', 'horn', HORN, { n: 6 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      body(P, 0, 0.4 * k, -2.2 * k, -16 * k + wob(t, 0.06, 4, 4, 7), wave(t, 14) * 4 * k);
      P.sq('body', -0.1 * k).rot('head', -18 * k, 0, wave(t, 12) * 6 * k).rot('fringe', -40 * k, 0, 0);
      arms(P, 'R', 50 * k, 20 * k, -20 * k); arms(P, 'L', 50 * k, 20 * k, -20 * k);
      P.face('eyes', t < 0.42 ? 'x' : undefined); mouth(P, t < 0.5 ? 'ow' : 'smile'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 10, 6], { n: 2 }).burst(0.03, 'note', 'head', [0, 22, 2], { n: 4, speed: 1.6, spread: 1 }).burst(0.03, 'star', 'head', [0, 24, 2], { n: 3 });
    } },
    // wobbles, then tips over onto its round shell — six boots kicking at the sky
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, 0.9, 1.0)), fall = seg(t, 0.92, 1.36, E.bounce);
      body(P, 0, -0.5 * dizzy + 3.6 * fall, -2.4 * fall, -76 * fall, wave(t, 1.3) * 8 * dizzy + 18 * fall, fall > 0.05 ? [] : ALL);
      P.rot('head', 0, wave(t, 1.3, 1) * 14 * dizzy, wave(t, 1.3) * 10 * dizzy).rot('head', 30 * fall, 0, 0);
      for (const [k, i] of [['midR', 0], ['midL', 1], ['hindR', 2], ['hindL', 3]]) P.rot(k, (-60 + wave(t, 3, i) * 22 * seg(t, 1.3, 1.5)) * fall, 0, 0);
      arms(P, 'R', 30 * fall, 30 * fall, 40 * fall); arms(P, 'L', 30 * fall, 30 * fall, 40 * fall);
      P.face('eyes', 'swirl'); mouth(P, 'ow'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.36, 'dust', 'root', [0, 1, -4], { n: 10, spread: 1, speed: 1.2 }).burst(0.7, 'star', 'head', [0, 25, 2], { n: 5 }).burst(1.0, 'note', 'head', [0, 22, 2], { n: 3, speed: 0.6 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      const rock = Math.sin(t * TAU / 2.4);
      body(P, 0, 3.6, -2.4, -76 + rock * 4, 18, []);
      P.rot('head', 30, 0, 0);
      for (const [k, i] of [['midR', 0], ['midL', 1], ['hindR', 2], ['hindL', 3]]) P.rot(k, -60 + wave(t, 1.6, i) * 12, 0, 0);
      arms(P, 'R', 30 + wave(t, 1.2) * 10, 30, 40); arms(P, 'L', 30 + wave(t, 1.2, 2) * 10, 30, 40);
      P.face('eyes', 'swirl'); mouth(P, 'ow'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
    } },
    // the big finish: a hop with front legs up and a ringing chord of notes — then the deep, synchronised bow
    win: { len: 2.6, next: 'idle', f(P, t) {
      const hopY = Math.max(0, Math.sin(seg(t, 0.12, 0.5, E.lin) * Math.PI)) * 4, crouch = bump(t, 0, 0.14) + bump(t, 0.5, 0.64);
      const showy = seg(t, 0.12, 0.3, E.back) * (1 - seg(t, 1.0, 1.2, E.inout)), bow = seg(t, 1.2, 1.5, E.inout) * (1 - seg(t, 2.0, 2.35, E.back));
      body(P, 0, hopY - 1.2 * crouch, 0, 44 * bow, 0, hopY > 0.2 ? [] : ALL);
      P.sq('body', -0.1 * crouch + 0.06 * (hopY > 0.2 ? 1 : 0)).rot('head', 20 * bow - 12 * showy, 0, wave(t, 3) * 6 * showy);
      arms(P, 'R', 80 * showy - 20 * bow, 0, 20 * showy); arms(P, 'L', 80 * showy - 20 * bow, 0, 20 * showy);
      P.rot('elytraR', 0, 0, 14 * showy).rot('elytraL', 0, 0, -14 * showy);
      P.face('eyes', bow > 0.3 ? 'closed' : undefined); mouth(P, showy > 0.3 ? 'belt' : bow > 0.3 ? 'smile' : 'sing'); P.blinkOK = false;
      P.burst(0.3, 'goldnote', 'head', [0, 24, 2], { n: 6, speed: 1.6, spread: 1 }).burst(0.3, 'note', 'head', [0, 24, 2], { n: 5, speed: 1.4, spread: 1 }).burst(0.32, 'sparkle', 'body', [0, 14, 4], { n: 10, speed: 1.6 });
      P.burst(1.5, 'leaf', 'horn', HORN, { n: 6, speed: 0.8 });
    } },
    // dozing sitting up: chin on its chest, fringe down over its eyes, sprout drooping, humming in its sleep
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * TAU);
      body(P, 0, -1 + br * 0.25, 0, 6, 0);
      P.sq('body', -0.04 + br * 0.03);
      P.rot('head', 26 + br * 3, 0, 8).rot('sprout', 30, 0, 20).rot('antR', 0, 0, 20).rot('antL', 0, 0, -20);
      arms(P, 'R', -6, 10, 50); arms(P, 'L', -6, 10, 50);
      P.face('eyes', 'closed'); mouth(P, br > 0.6 ? 'sing' : 'smile'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [5, 23, 3], {}).burst(1.9, 'z', 'head', [5, 23, 3], {}).burst(2.6, 'note', 'head', [-4, 22, 3], { n: 1, speed: 0.4 });
    } },
    // fidget: a burst of headbanging to a beat only it can hear
    headbang: { len: 1.6, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.15) * (1 - seg(t, 1.35, 1.6)), nod = Math.max(0, Math.sin(t * TAU * 3.75)) ** 1.5;
      body(P, 0, -0.6 * nod * on, 0, 8 * nod * on, 0);
      P.rot('head', 28 * nod * on - 6 * on, 0, 0);
      arms(P, 'R', 20 * on, 10 * on, 50 * on + 20 * nod * on); arms(P, 'L', 20 * on, 10 * on, 50 * on + 20 * nod * on);
      P.face('eyes', on > 0.5 ? 'closed' : undefined); mouth(P, on > 0.5 ? 'belt' : 'smile');
      for (const t0 of [0.25, 0.5, 0.78, 1.05]) P.burst(t0, 'note', 'head', [0, 23, 2], { n: 1, speed: 1, spread: 0.8 });
    } },
    // fidget: air guitar — one front leg holds the neck, the other strums, notes flying off the strings
    strum: { len: 2.0, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.25, E.back) * (1 - seg(t, 1.7, 2.0, E.inout)), st = Math.abs(Math.sin(t * TAU * 3)) ** 2;
      body(P, 0, 0.4 * st * on, 0, -4 * on, -6 * on);
      P.rot('head', -6 * on + 6 * st * on, -14 * on, 10 * on);
      arms(P, 'L', 40 * on, 30 * on, 40 * on); arms(P, 'R', 10 * on, 40 * on, 80 * on - 40 * st * on);
      P.face('eyes', on > 0.5 ? 'closed' : undefined); croon(P, t, 3, on);
      for (const t0 of [0.4, 0.73, 1.06, 1.4]) P.burst(t0, 'goldnote', 'foreR', [-8, 8, 4], { n: 1, dir: [0.3, 1, 0.5], speed: 1 });
    } },
  },
};
def.anim = anim;
