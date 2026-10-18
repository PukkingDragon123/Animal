// Beatlet — Taro's partner (Bio). A chubby little rhinoceros beetle and a wink at the
// Beatles: its glossy head shell is a 1960s mop-top bowl cut with a fringe down to its
// eyes, it wears a hot-pink band-jacket collar with gold frogging and gold epaulettes, its
// belly segments are striped like a zebra crossing, and its six stubby feet are pointed,
// heeled boots. A small forked horn rises from its crown with a leaf sprout growing in the
// fork. It is sunny and always singing; it walks with a long, easy crosswalk stride, shakes
// its mop-top on the high notes, and takes a deep bow at the end of every show.
import { E, seg, bump, wob, wave, bounce } from '../anim.js';
import { defineFx } from '../fx.js';
import { ramp, shift } from './kit.js';

const C = {
  shell: '#7a4226', shellHi: '#b86a3a', shellLo: '#4e2618', shellDeep: '#2e1410', gloss: '#ffe2c0',
  hair: '#4a2638', hairHi: '#8a5472', hairLo: '#2a1222', hairGl: '#e6b8d0',
  face: '#f6e2c0', faceHi: '#fff4dc', faceLo: '#dcb890', faceDeep: '#b48a6a',
  satin: '#ff4fa3', satinHi: '#ff9ccc', satinLo: '#c42a78', satinDeep: '#8a1a56',
  gold: '#ffd23e', goldHi: '#fff6b0', goldLo: '#d0902a', goldDeep: '#8a561a',
  leg: '#4e283c', legHi: '#7a4650', legLo: '#2a1220',
  boot: '#201820', bootHi: '#5a4a56', bootLo: '#100a10',
  zb: '#24222c', zw: '#f4f2ea', zwLo: '#c4c2ba',
  horn: ['#9a5440', '#622c32', '#3e1826', '#260c1a'],
  leaf: '#7ad04a', leafHi: '#d8ff8a', leafLo: '#3e9a36',
  ink: '#24101a', mouth: '#5a1a24', tongue: '#ff7a8a',
};
const TAU = Math.PI * 2, R2D = 180 / Math.PI, PPU = 3;

// ---------------------------------------------------------------- painters
// model-space position of a texel's centre on a face of a cube (honours mirrored cubes)
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
const SHELL = [C.shellHi, C.shell, C.shellLo, C.shellDeep], SATIN = [C.satinHi, C.satin, C.satinLo, C.satinDeep];
const GOLD = [C.goldHi, C.gold, C.goldLo, C.goldDeep], LEG = [C.legHi, C.leg, C.legLo, C.legLo];
// the body: chestnut chitin; its belly segments are a zebra crossing — white bars on asphalt-black,
// running round the underside and up the lower flanks
function bodyP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [, Y, Z] = at(face, cube, x, y);
    let c = band(SHELL, face, x, y, h);
    if (face === 'down' || Y < 4.4) {
      const k = (((Z + 20) % 2.4) + 2.4) % 2.4, white = k < 1.2 && face !== 'north' && face !== 'south';
      c = white ? (k > 1.0 || face === 'down' ? C.zwLo : C.zw) : C.zb;
      if (face !== 'down' && Y > 4.0) c = C.shellDeep;
    }
    p.px(x, y, c);
  }
}
// elytra: glossy wing cases — a bright specular streak along each, fine punctures, a dark seam down the middle
function elytraP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y, Z] = at(face, cube, x, y), ax = Math.abs(X);
    let c = band(SHELL, face, x, y, h);
    if ((x * 5 + y * 3) % 11 === 0 && face !== 'down') c = shift(c, -0.16);
    if ((face === 'up' || face === 'north') && ax < 0.5) c = C.shellDeep;                                 // the seam
    const hl = face === 'up' ? Math.abs(ax - 3.6) : face === 'west' || face === 'east' ? Math.abs(Y - 9.8 - Z * 0.06) : face === 'north' ? Math.abs(ax - 3.6) + Math.max(0, 7 - Y) : 99;
    if (hl < 0.45) c = C.gloss; else if (hl < 1.0) c = shift(C.shellHi, 0.12);
    p.px(x, y, c);
  }
  if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, 0, C.shellHi);
}
// the face: cream, in the shade of the fringe at the top, a soft chin shadow at the bottom
function faceP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = h > 1 ? y / (h - 1) : 0.5, d = (x + y) & 1;
    p.px(x, y, face === 'up' ? C.faceLo : face === 'down' ? C.faceDeep : v < 0.16 || (v < 0.22 && d) || v > 0.88 || (v > 0.82 && d) ? C.faceLo : C.face);
  }
}
// the mop-top: combed-down glossy strands (jittered partings), a broken band of shine on the dome's shoulder,
// a whorl on the crown, ragged strand tips along the bottom edge
const jit = (x) => ((x * 7919) % 13) / 13;
function mopP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y, Z] = at(face, cube, x, y);
    let c;
    if (face === 'up') { const a = Math.atan2(Z - 6.6, X), r = Math.hypot(X, Z - 6.6); c = Math.floor(a * 4 + r * 0.6 + 40) & 1 ? C.hair : shift(C.hair, 0.1); if (r < 1.0) c = C.hairLo; else if (r > 2.6 && r < 3.8 && Math.floor(a * 3 + 40) % 3) c = C.hairHi; }
    else if (face === 'down') c = C.hairLo;
    else {
      const part = (x + Math.floor(jit(Math.floor(x / 3)) * 2)) % 3 === 0, lit = face === 'west' || face === 'south';
      const sh = 19.8 + Math.sin(x * 0.7) * 0.35 + jit(x) * 0.3;                                         // the shine line, gently wavy
      c = Y > 16.4 ? C.hair : C.hairLo;
      if (Math.abs(Y - sh) < 0.4) c = part ? C.hair : lit ? C.hairGl : C.hairHi;
      else if (Math.abs(Y - sh) < 0.9) c = part ? C.hair : C.hairHi;
      else if (part) c = shift(c, -0.14);
      if (Y < cube.o[1] + 0.34 && (x + Math.floor(jit(x) * 3)) % 3 !== 1) c = 0;                       // ragged strand tips
    }
    p.px(x, y, c);
  }
}
// the fringe: straight-cut strands hanging into the eyes, a lit band near the top, the tips ragged
function fringeP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = face === 'up' ? C.hair : face === 'down' ? C.hairLo : y < 2 ? C.hair : C.hairLo;
    if (face !== 'up' && face !== 'down') {
      const part = x % 3 === 0;
      if (y >= 2 && y <= 4) c = part ? C.hairHi : face === 'south' ? C.hairGl : C.hairHi;
      else if (part) c = shift(c, -0.14);
      if (y >= h - 1 && x % 3 !== 1) c = 0;
      if (y >= h - 2 && x % 6 === 3) c = 0;
    }
    p.px(x, y, c);
  }
}
// the band-jacket collar: hot-pink satin, gold piping, three rows of gold frogging across the front
function collarP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = band(SATIN, face, x, y, h);
    if (face !== 'up' && face !== 'down' && (y === 0 || y === h - 1)) c = y === 0 ? C.goldHi : C.goldLo;
    if (face === 'up' && (x === 0 || x === w - 1 || y === 0 || y === h - 1)) c = C.gold;
    p.px(x, y, c);
  }
  if (face !== 'south') return;
  const m = (w - 1) / 2;
  for (const Y of [7.6, 6.2, 4.8]) {
    const row = Math.round((cube.o[1] + cube.s[1] - Y) * PPU);
    for (const s of [-1, 1]) {
      for (let i = 2; i <= 12; i++) p.px(Math.round(m + s * i), row, i === 12 ? C.goldHi : C.gold);   // the braid
      for (let i = 4; i <= 11; i++) p.px(Math.round(m + s * i), row + 1, C.goldLo);
      p.px(Math.round(m + s * 12), row - 1, C.gold); p.px(Math.round(m + s * 13), row, C.gold); p.px(Math.round(m + s * 12), row + 1, C.goldLo);   // the loop
    }
    p.px(Math.round(m), row, C.goldHi); p.px(Math.round(m), row + 1, C.goldLo);                       // the toggle
  }
}
const goldP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 4 === 0 && face !== 'down' ? C.goldHi : band(GOLD, face, x, y, h)); };
const tasselP = (p, w, h) => { for (let x = 0; x < w; x++) if (x % 2 === 0) for (let y = 0; y < h - (x % 4 === 0 ? 0 : 1); y++) p.px(x, y, y === 0 ? C.goldHi : y > h - 3 ? C.goldLo : C.gold); };
const legP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, band(LEG, face, x, y, h)); if (face !== 'up' && face !== 'down') for (let x = 1; x < w - 1; x += 3) p.px(x, 1, C.legHi); };
const bootP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? ((x + y) % 3 ? C.boot : C.bootHi) : y === 0 ? C.bootHi : y === h - 1 ? C.bootLo : C.boot); if (face !== 'up' && face !== 'down') { p.px(1, 1, '#9a8a96'); p.px(2, 1, C.bootHi); } };
const heelP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? '#6a4a3a' : '#3a2620'); };
const hornP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.horn[0] : ramp(C.horn, h > 1 ? y / (h - 1) : 0.5, x, y)); if (face !== 'up' && face !== 'down') { p.px(0, 0, '#ffd8c0'); p.px(1, 0, '#c07a50'); } };
const leafP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.leafHi : y === Math.floor(h / 2) && face !== 'down' ? C.leafLo : ramp([C.leafHi, C.leaf, C.leafLo], h > 1 ? y / (h - 1) : 0.5, x, y)); };
const stemP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 ? C.leafHi : C.leafLo); };
const clubP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.legHi : band(LEG, face, x, y, h)); if (face === 'south') p.px(1, 1, '#a07a86'); };

// eyes: simple Pokémon-style shapes, 8 × 6 texels peeking from under the fringe (outer corner x = 0; the left eye is mirrored)
const EM = { K: C.ink, W: '#ffffff' };
const grid = (rows, map) => (p) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = map[r[x]]; if (c) p.px(x, y, c); } });
const EYES = {
  peek: ['.KKKKKK.', 'KKKKKKKK', 'KKWKKKKK', 'KKKKKKKK', '.KKKKKK.', '..KKKK..'],
  sharp: ['........', 'KK......', 'KKKKK...', 'KKWKKKKK', '.KKKKKKK', '...KKKK.'],
  wide: ['..KKKK..', '.KKKKKK.', 'KKWWKKKK', 'KKWKKKKK', '.KKKKKK.', '..KKKK..'],
  happy: ['........', '...KK...', '..K..K..', '.K....K.', 'K......K', '........'],
  closed: ['........', '........', 'K......K', '.K....K.', '..KKKK..', '........'],
  x: ['KK....KK', '.KK..KK.', '..KKKK..', '.KK..KK.', 'KK....KK', '........'],
  swirl: ['.KKKKKK.', 'K......K', 'K.KKKK.K', 'K.K..K.K', 'K..KK..K', '.KKKKKK.'],
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

const eyeParts = () => Object.entries(EYES).map(([k, rows]) => B(-4.4, 12.9, 11.62, -1.733, 14.9, 11.62, grid(rows, EM), { plane: 'z', id: 'eye-' + k, hide: k !== 'peek' }));
const mouthParts = () => Object.entries(MOUTHS).map(([k, rows]) => B(-1.667, 9.8, 11.62, 1.667, 11.133, 11.62, grid(rows, MM), { plane: 'z', id: 'mouth-' + k, hide: k !== 'smile' }));
// a stubby leg: thigh out from the body, shin down, a pointed Beatle boot with a Cuban heel (z0..z1: the boot's length)
const leg = (name, hx, hy, hz, fx, z0, z1) => ({ name, parent: 'body', pivot: [hx, hy, hz], cubes: [
  B(Math.min(hx, fx) - 0.4, hy - 0.8, hz - 0.8, Math.max(hx, fx) + 0.6, hy + 0.8, hz + 0.8, legP),
  B(fx - 0.8, 1.4, hz - 0.8, fx + 0.8, hy + 0.2, hz + 0.8, legP),
  B(fx - 1.2, 0.5, z0, fx + 1.2, 1.9, z1, bootP),
  B(fx - 0.7, 0, z1 - 0.2, fx + 0.7, 1.0, z1 + 1.2, bootP),
  B(fx - 1.0, 0, z0, fx + 1.0, 0.6, z0 + 1.0, heelP),
] });
const RIGHT = {
  elytra: { name: 'elytraR', parent: 'body', pivot: [-0.2, 11.4, 2.2], cubes: [
    B(-7.6, 5.4, -10.8, -0.04, 11.6, 2.4, elytraP),
    B(-6.2, 11.6, -9.8, -0.04, 12.4, 1.6, elytraP),
    B(-8.2, 6.2, -9.8, -7.6, 10.8, 1.4, elytraP),
    B(-6.6, 6.4, -11.4, -0.04, 11, -10.8, elytraP),
    B(-4.8, 12.4, -8.6, -0.04, 12.9, 0.4, elytraP),
    B(-5.0, 7.4, -11.9, -0.04, 10.2, -11.4, elytraP),
    B(-7.2, 11.6, -9.2, -6.2, 12.0, 1.2, elytraP),
  ] },
  arm: { name: 'armR', parent: 'body', pivot: [-5.8, 5.6, 5.2], cubes: [B(-8.2, 4.8, 4.4, -5.4, 6.4, 6, legP)] },
  fore: { name: 'foreR', parent: 'armR', pivot: [-7.8, 5.6, 5.2], cubes: [
    B(-8.6, 1.4, 4.4, -7, 5.8, 6, legP),
    B(-9, 0.5, 4.2, -6.6, 1.9, 7.4, bootP),
    B(-8.5, 0, 7.2, -7.1, 1.0, 8.4, bootP),
    B(-8.8, 0, 4.2, -6.8, 0.6, 5.2, heelP),
  ] },
  mid: leg('midR', -6.8, 4.8, -1.6, -9.6, -3.4, 0.2),
  hind: leg('hindR', -6.4, 4.6, -7, -9.2, -8.8, -5.4),
  ant: { name: 'antR', parent: 'head', pivot: [-5.4, 12.0, 9.6], rot: [0, 0, -12], cubes: [
    B(-7.8, 11.7, 9.3, -5.2, 12.3, 9.9, legP),
    B(-9.2, 11.2, 8.8, -7.6, 12.8, 10.4, clubP),
  ] },
};

export const def = {
  name: 'beatlet', ppu: 3, scale: 0.37, outline: { color: '#1e0f14', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 5, -2], cubes: [
      B(-7, 2.2, -10.4, 7, 10.8, 4.4, bodyP),
      B(-7.6, 3.2, -9.4, 7.6, 9.8, 3.6, bodyP),
      B(-5.6, 1.6, -8.8, 5.6, 2.2, 3, bodyP),
      // the band-jacket collar (the pronotum), with gold epaulettes and their fringe
      B(-6.4, 4.0, 2.4, 6.4, 10.6, 6.4, collarP),
      B(-7.8, 9.8, 2.8, -5.6, 10.9, 5.8, goldP), B(5.6, 9.8, 2.8, 7.8, 10.9, 5.8, goldP, { mirror: true }),
      B(-7.82, 8.6, 2.8, -7.82, 9.8, 5.8, tasselP, { plane: 'x' }), B(7.82, 8.6, 2.8, 7.82, 9.8, 5.8, tasselP, { plane: 'x' }),
    ] },
    ...both(RIGHT.elytra, RIGHT.arm, RIGHT.fore, RIGHT.mid, RIGHT.hind),
    { name: 'head', parent: 'body', pivot: [0, 9.6, 6], cubes: [
      B(-5.2, 9.4, 4.6, 5.2, 16.6, 11.6, faceP),
      B(-4.2, 8.6, 5.2, 4.2, 9.4, 11.2, faceP),
      // the mop-top: a glossy bowl over the crown, hanging down over the sides and the back of the neck
      B(-7.2, 12.6, 3.0, 7.2, 18.8, 10.4, mopP),
      B(-7.0, 18.8, 3.2, 7.0, 20.4, 10.2, mopP),
      B(-6.4, 20.4, 3.6, 6.4, 21.6, 9.8, mopP),
      B(-5.4, 21.6, 4.2, 5.4, 22.6, 9.2, mopP),
      B(-3.8, 22.6, 5.0, 3.8, 23.2, 8.4, mopP),
      B(-6.4, 10.6, 2.6, 6.4, 12.6, 6.4, mopP),
      ...eyeParts(), ...eyeParts().map(flipC), ...mouthParts(),
    ] },
    { name: 'fringe', parent: 'head', pivot: [0, 19.6, 10.8], cubes: [B(-7, 14.8, 10.4, 7, 19.6, 11.9, fringeP)] },
    { name: 'horn', parent: 'head', pivot: [0, 23.0, 6.6], rot: [8, 0, 0], cubes: [
      B(-0.9, 22.8, 5.7, 0.9, 25.2, 7.5, hornP),
      B(-2.0, 24.6, 6.1, -0.8, 27.6, 7.1, hornP, { pivot: [-0.6, 24.8, 6.6], rot: [0, 0, 30] }),
      B(0.8, 24.6, 6.1, 2.0, 27.6, 7.1, hornP, { pivot: [0.6, 24.8, 6.6], rot: [0, 0, -30], mirror: true }),
    ] },
    { name: 'sprout', parent: 'horn', pivot: [0, 25.0, 6.6], cubes: [
      B(-0.3, 24.8, 6.3, 0.3, 27.6, 6.9, stemP, { outline: false }),
      B(-2.8, 27.0, 6.35, -0.1, 28.0, 6.85, leafP, { pivot: [-0.1, 27.4, 6.6], rot: [0, 0, -22] }),
      B(0.1, 27.2, 6.35, 2.6, 28.2, 6.85, leafP, { pivot: [0.1, 27.6, 6.6], rot: [0, 0, 28], mirror: true }),
    ] },
    ...both(RIGHT.ant),
  ],
};

// ---------------------------------------------------------------- animation
defineFx('soundring', { w: 16, h: 16, paint: (p) => { const m = 7.5; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - m, y - m); if (d < 7.6 && d > 5.6) p.px(x, y, d > 6.8 ? '#ffffff' : '#c8ffb0'); } }, glow: true, life: [0.7, 0.8], size: [0.08, 0.5], speed: [2.2, 2.6], grav: 0, drag: 0.6, spread: 0.02, fade: true });
defineFx('goldnote', { w: 8, h: 12, paint: (p) => { const c = '#ffd23e', d = '#a8661a'; p.rect(1, 8, 4, 3, c); p.px(0, 9, c); p.px(5, 9, d); p.vl(4, 1, 8, c); p.rect(5, 1, 2, 2, c); p.px(7, 3, c); p.px(7, 4, d); p.px(2, 8, '#fff6b0'); }, glow: true, life: [1.0, 1.3], size: [0.13, 0.11], speed: [0.9, 1.4], grav: -0.4, drag: 0.6, spread: 0.4, wob: 1.6, fade: true });
const MOUTH = [0, 10.4, 12.4], HORN = [0, 27.4, 6.6];
const LEGS = { armR: [-5.8, 5.6, 5.2], armL: [5.8, 5.6, 5.2], midR: [-6.8, 4.8, -1.6], midL: [6.8, 4.8, -1.6], hindR: [-6.4, 4.6, -7], hindL: [6.4, 4.6, -7] }, BP = [0, 5, -2];
const ALL = Object.keys(LEGS), FOUR = ['midR', 'midL', 'hindR', 'hindL'];
// move the body and keep the listed feet on the ground: planted legs hang plumb and stretch to reach the floor
function body(P, dx, dy, dz, pitch = 0, roll = 0, legs = ALL, yaw = 0) {
  P.pos('body', dx, dy, dz).rot('body', pitch, yaw, roll);
  const p = pitch / R2D, r = roll / R2D;
  for (const k of legs) {
    const [x, y, z] = LEGS[k], rx = x - BP[0], ry = y - BP[1], rz = z - BP[2];
    const Y = rx * Math.sin(r) + ry * Math.cos(r), Y2 = Y * Math.cos(p) - rz * Math.sin(p);
    P.rot(k, -pitch, -yaw, -roll).scl(k, 1, Math.max(0.3, (BP[1] + dy + Y2) / y), 1);
  }
}
// the front legs as arms: up (deg, raise sideways), fwd (deg, swing forward), bend (deg, the forearm)
function arms(P, S, up = 0, fwd = 0, bend = 0) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -fwd, 0, -g * up).rot('fore' + S, -bend, 0, g * up * 0.4); }
const mouth = (P, m) => P.face('mouth', m);
// a beat of song: the mouth opens on the beat
function croon(P, t, bps = 2, k = 1) { const b = (t * bps) % 1; mouth(P, k <= 0 ? 'smile' : b < 0.3 ? 'sing' : b < 0.42 ? 'belt' : 'smile'); }
// the mop-top shake: the head whips side to side, the fringe flying
const shake = (P, t, k, hz = 3.2) => P.rot('head', 0, Math.sin(t * TAU * hz) * 26 * k, Math.sin(t * TAU * hz + 0.6) * 8 * k);
// on its side, six boots kicking at the sky
function onSide(P, k, t = 0, kick = 1) {
  P.rot('root', 0, 0, 96 * k).pos('root', 4.5 * k, 8.4 * k, 0);
  for (const [n, i] of [['armR', 0], ['midR', 1], ['hindR', 2]]) P.rot(n, wave(t, 2.6, i) * 10 * kick * k, 0, 46 * k);
  for (const [n, i] of [['armL', 0], ['midL', 1], ['hindL', 2]]) P.rot(n, (-20 + wave(t, 3.1, i + 2) * 24 * kick) * k, 0, (8 + wave(t, 2.3, i) * 12 * kick) * k);
  P.rot('head', 8 * k, 0, -14 * k).rot('sprout', 0, 0, 30 * k).rot('fringe', 30 * k, 0, 0);
}

export const anim = {
  start: 'idle', seed: 9,
  breathe: { bone: 'body', amp: 0.02, per: 2.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.11 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 6 },
  springs: [
    { bone: 'fringe', tip: [0, -2.4, 1], k: 210, d: 10, gain: 0.8, max: 26, axes: [1, 0.3, 0.6] },
    { bone: 'sprout', tip: [0, 3, 0], k: 140, d: 7, gain: 1, max: 30 },
    { bone: 'antR', tip: [-3.6, 0, 0], k: 160, d: 8, gain: 0.9, max: 28 },
    { bone: 'antL', tip: [3.6, 0, 0], k: 170, d: 8, gain: 0.9, max: 28 },
  ],
  faces: {
    eyes: { default: 'peek', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    mouth: { default: 'smile', states: Object.fromEntries(Object.keys(MOUTHS).map((k) => [k, ['mouth-' + k]])) },
  },
  fidget: { every: [5, 8], clips: ['mopshake', 'strum'] },
  clips: {
    // bopping on the beat: a bounce, the head nodding, a front boot tapping, humming with a note now and then
    idle: { len: 2.0, loop: true, f(P, t) {
      const b = bounce(t, 0.5, { squash: 0.06, stretch: 0.03 }), sway = Math.sin(t * TAU * 0.5);
      body(P, sway * 0.3, b.u * 0.6 - 0.1, 0, 0, sway * 3);
      P.sq('body', b.sq);
      P.rot('head', 6 - b.u * 9, sway * 7, -sway * 6);
      const tap = bump(t % 1, 0.02, 0.3), S = t < 1 ? 'R' : 'L';
      P.rot('fore' + S, -26 * tap, 0, 0).rot('arm' + S, -8 * tap, 0, 0);
      croon(P, t, 2);
      P.face('eyes', (t % 1) > 0.05 && (t % 1) < 0.3 ? 'happy' : undefined);
      P.burst(0.45, 'note', 'head', [5, 21, 7], { n: 1, dir: [0.4, 1, 0.2], speed: 0.8 }).burst(1.45, 'goldnote', 'head', [-5, 21, 7], { n: 1, dir: [-0.4, 1, 0.2], speed: 0.6 });
    } },
    // the crosswalk stride: long, easy scissor steps in a tripod gait, head held high, nodding to the beat
    walk: { len: 0.8, loop: true, f(P, t) {
      const ph = (t / 0.8) * TAU, s = Math.sin(ph), c = Math.cos(ph), up = Math.abs(c);
      body(P, 0, up * 0.7 - 0.25, 0, -5, s * 2.5, []);
      P.sq('body', -0.05 * (1 - up) ** 3);
      for (const [k, g, sw] of [['armR', 1, 30], ['midL', 1, 34], ['hindR', 1, 28], ['armL', -1, 30], ['midR', -1, 34], ['hindL', -1, 28]]) {
        const a = s * g, lift = Math.max(0, c * g);
        P.rot(k, -a * sw, 0, 0).scl(k, 1, 1 - lift * 0.22, 1);
      }
      P.rot('head', -6 + Math.sin(ph * 2 - 0.6) * 4, s * 3, -s * 3);
      croon(P, t, 2.5, 0.7);
      P.burst(0.1, 'note', 'head', [5, 21, 6], { n: 1, dir: [0.3, 1, -0.4], speed: 0.6 });
    } },
    // "yeah, yeah, yeah!": rears up, front legs high, shakes its mop-top on the "ooh", finishes with a belt and a burst of notes
    cry: { len: 2.1, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.25, E.inout) * (1 - seg(t, 0.25, 0.36, E.out)), up = seg(t, 0.3, 0.46, E.back) * (1 - seg(t, 1.75, 2.0, E.inout));
      const sh = seg(t, 0.5, 0.6) * (1 - seg(t, 1.1, 1.2)), fin = seg(t, 1.2, 1.32, E.back) * (1 - seg(t, 1.7, 1.95));
      body(P, 0, -1 * crouch + 1.6 * up, -1.4 * up, 6 * crouch - 26 * up, 0, up > 0.1 ? FOUR : ALL);
      P.sq('body', -0.1 * crouch + 0.06 * up * (1 - seg(t, 0.46, 0.62)) + wob(t, 1.32, -0.06, 3, 6));
      P.rot('head', 10 * crouch + 18 * up - 16 * fin, 0, 0); shake(P, t, sh);
      arms(P, 'R', 50 * up + 30 * fin, 10 * up, 30 * up - 20 * fin); arms(P, 'L', 50 * up + 30 * fin, 10 * up, 30 * up - 20 * fin);
      P.rot('elytraR', 0, 0, 12 * fin).rot('elytraL', 0, 0, -12 * fin);
      P.face('eyes', sh > 0.3 || fin > 0.3 ? 'happy' : up > 0.3 ? 'wide' : undefined); mouth(P, up > 0.2 ? (sh > 0.3 ? 'sing' : 'belt') : 'smile'); P.blinkOK = false;
      for (const [i, t0] of [0.55, 0.75, 0.95].entries()) P.burst(t0, i % 2 ? 'goldnote' : 'note', 'head', [i % 2 ? 6 : -6, 21, 8], { n: 2, dir: [i % 2 ? 0.6 : -0.6, 1, 0.3], speed: 1.3 });
      P.burst(1.3, 'goldnote', 'head', MOUTH, { n: 6, dir: [0, 1, 0.6], speed: 1.6, spread: 0.8 }).burst(1.3, 'note', 'head', MOUTH, { n: 5, dir: [0, 1, 0.6], speed: 1.4, spread: 0.9 }).burst(1.3, 'sparkle', 'head', [0, 23, 6], { n: 8, speed: 1.4 });
    } },
    // horn flip: head down, a scuttling charge, then the horn scoops up and flicks over
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const low = seg(t, 0, 0.22, E.inout) * (1 - seg(t, 0.36, 0.44, E.in)), flip = seg(t, 0.36, 0.46, E.back) * (1 - seg(t, 0.6, 0.95, E.inout));
      const fwd = 6 * seg(t, 0.16, 0.42, E.in) * (1 - seg(t, 0.6, 0.98, E.inout));
      body(P, 0, -1 * low + 1.2 * flip, 0, 14 * low - 16 * flip, 0, []);
      P.pos('root', 0, 0, fwd).sq('body', -0.08 * low + 0.06 * flip);
      P.rot('head', 26 * low - 40 * flip, 0, 0).rot('horn', -16 * flip, 0, 0);
      for (const [k, i] of [['armR', 0], ['armL', 3], ['midR', 1], ['midL', 4], ['hindR', 2], ['hindL', 5]]) P.rot(k, wave(t, 7, i * 1.1) * 26 * low - 10 * flip, 0, 0);
      P.face('eyes', low > 0.2 || flip > 0.2 ? 'sharp' : undefined); mouth(P, flip > 0.3 ? 'belt' : 'smile'); P.blinkOK = false;
      P.burst(0.42, 'spark', 'horn', HORN, { n: 2 }).burst(0.42, 'leaf', 'horn', HORN, { n: 8, speed: 1.6 }).burst(0.44, 'goldnote', 'horn', HORN, { n: 1, speed: 1.2 }).burst(0.18, 'dust', 'root', [0, 0.5, 0], { n: 6, spread: 1, speed: 1 });
    } },
    // harmony: a big breath, the wing cases flare and buzz, and a wave of song rolls out — rings of sound, a stream of notes, leaves
    special: { len: 2.4, next: 'idle', f(P, t) {
      const inhale = seg(t, 0, 0.45, E.inout) * (1 - seg(t, 0.5, 0.6, E.out)), sing = seg(t, 0.52, 0.66, E.back) * (1 - seg(t, 1.85, 2.2, E.inout));
      const buzz = sing * wave(t, 18) * 3;
      body(P, 0, 0.6 * inhale + 1.2 * sing, -0.6 * sing, -10 * inhale - 14 * sing, wave(t, 2) * 3 * sing, sing > 0.1 || inhale > 0.1 ? FOUR : ALL);
      P.scl('body', 1 + 0.07 * inhale, 1 + 0.04 * inhale, 1 + 0.07 * inhale).sq('body', wave(t, 4) * 0.03 * sing);
      P.rot('head', -14 * inhale - 6 * sing + wave(t, 2, 1) * 4 * sing, wave(t, 1) * 8 * sing, 0);
      P.rot('elytraR', -8 * sing, -14 * sing, 30 * sing + buzz).rot('elytraL', -8 * sing, 14 * sing, -30 * sing - buzz);
      arms(P, 'R', 30 * inhale + 64 * sing, -10 * inhale + 20 * sing, 20); arms(P, 'L', 30 * inhale + 64 * sing, -10 * inhale + 20 * sing, 20);
      P.face('eyes', sing > 0.3 ? 'happy' : undefined); mouth(P, inhale > 0.3 ? 'sing' : sing > 0.2 ? 'belt' : 'smile'); P.blinkOK = false;
      if (sing > 0.5) {
        P.stream('soundring', 'head', MOUTH, { rate: 7, dir: [0, 0.05, 1], tint: [0.8, 1, 0.7] });
        P.stream('note', 'head', MOUTH, { rate: 14, dir: [0, 0.3, 1], speed: 2.2, spread: 0.35, key: 'n' }).stream('goldnote', 'head', MOUTH, { rate: 10, dir: [0, 0.2, 1], speed: 2.4, spread: 0.3, key: 'g' });
        P.stream('leaf', 'body', [0, 12, -6], { rate: 10, dir: [0, 1, -0.4], speed: 1.2, key: 'l' });
      }
      P.burst(0.62, 'ring', 'head', MOUTH, { scale: 0.8, tint: [0.8, 1, 0.6] }).burst(0.62, 'sparkle', 'horn', HORN, { n: 6 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      body(P, 0, 0.4 * k, -2.2 * k, -12 * k + wob(t, 0.06, 4, 4, 7), wave(t, 14) * 4 * k);
      P.sq('body', -0.1 * k).rot('head', -18 * k, 0, wave(t, 12) * 6 * k).rot('fringe', -40 * k, 0, 0);
      P.face('eyes', t < 0.42 ? 'x' : undefined); mouth(P, t < 0.5 ? 'ow' : 'smile'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'head', [0, 14, 13], { n: 2 }).burst(0.03, 'note', 'head', [0, 21, 6], { n: 4, speed: 1.6, spread: 1 }).burst(0.03, 'star', 'head', [0, 24, 6], { n: 3 });
    } },
    // wobbles, then tips over onto its side — six boots kicking at the sky, the zebra belly showing
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, 0.9, 1.0)), fall = seg(t, 0.92, 1.36, E.bounce);
      body(P, 0, -0.5 * dizzy, 0, 0, wave(t, 1.3) * 7 * dizzy, ALL);
      P.rot('head', 0, wave(t, 1.3, 1) * 16 * dizzy, wave(t, 1.3) * 10 * dizzy);
      if (fall > 0) onSide(P, fall, t, seg(t, 1.3, 1.6));
      P.face('eyes', 'swirl'); mouth(P, 'ow'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.36, 'dust', 'root', [-6, 1, 0], { n: 10, spread: 1, speed: 1.2 }).burst(0.7, 'star', 'head', [0, 25, 6], { n: 5 }).burst(1.0, 'note', 'head', [0, 21, 6], { n: 3, speed: 0.6 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      onSide(P, 1, t, 0.6);
      P.face('eyes', 'swirl'); mouth(P, 'ow'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(1.2, 'note', 'head', [-14, 6, 8], { n: 1, speed: 0.3, scale: 0.7 });
    } },
    // the big finish: a hop with front legs flung high and a chord of notes — then the deep bow, and up again
    win: { len: 2.6, next: 'idle', f(P, t) {
      const hopY = Math.max(0, Math.sin(seg(t, 0.12, 0.5, E.lin) * Math.PI)) * 4, crouch = bump(t, 0, 0.14) + bump(t, 0.5, 0.64);
      const showy = seg(t, 0.12, 0.3, E.back) * (1 - seg(t, 1.0, 1.2, E.inout)), bow = seg(t, 1.2, 1.5, E.inout) * (1 - seg(t, 2.0, 2.35, E.back));
      body(P, 0, hopY - 1.2 * crouch - 0.8 * bow, 0, 30 * bow - 10 * showy, 0, hopY > 0.2 ? [] : showy > 0.1 ? FOUR : ALL);
      P.sq('body', -0.1 * crouch + 0.06 * (hopY > 0.2 ? 1 : 0)).rot('head', 26 * bow - 10 * showy, 0, wave(t, 3) * 6 * showy);
      arms(P, 'R', 76 * showy, 0, 20 * showy); arms(P, 'L', 76 * showy, 0, 20 * showy);
      P.rot('elytraR', 0, 0, 14 * showy).rot('elytraL', 0, 0, -14 * showy);
      P.face('eyes', bow > 0.3 || showy > 0.3 ? 'happy' : undefined); mouth(P, showy > 0.3 ? 'belt' : bow > 0.3 ? 'smile' : 'sing'); P.blinkOK = false;
      P.burst(0.3, 'goldnote', 'head', [0, 24, 6], { n: 6, speed: 1.6, spread: 1 }).burst(0.3, 'note', 'head', [0, 24, 6], { n: 5, speed: 1.4, spread: 1 }).burst(0.32, 'sparkle', 'body', [0, 14, 4], { n: 10, speed: 1.6 });
      P.burst(1.5, 'leaf', 'horn', HORN, { n: 6, speed: 0.8 });
    } },
    // dozing: legs folded, belly on the ground, the fringe flopped over its eyes, humming in its sleep
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * TAU);
      body(P, 0, -1.6 + br * 0.2, 0, 4, 0, []);
      for (const k of ALL) P.scl(k, 1, 0.66, 1);
      P.sq('body', -0.04 + br * 0.03);
      P.rot('head', 16 + br * 3, 0, 8).rot('sprout', 26, 0, 20).rot('antR', 0, 0, 20).rot('antL', 0, 0, -20).rot('fringe', 8, 0, 0);
      P.face('eyes', 'closed'); mouth(P, br > 0.6 ? 'sing' : 'smile'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [5, 22, 8], {}).burst(1.9, 'z', 'head', [5, 22, 8], {}).burst(2.6, 'note', 'head', [-4, 21, 8], { n: 1, speed: 0.4 });
    } },
    // fidget: shakes its mop-top on a high "oooh", notes flying off it
    mopshake: { len: 1.6, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.2, E.back) * (1 - seg(t, 1.25, 1.6, E.inout));
      body(P, 0, 0.6 * on, 0, -8 * on, 0, ALL);
      P.rot('head', -12 * on, 0, 0); shake(P, t, on, 3.4);
      P.face('eyes', on > 0.4 ? 'happy' : undefined); mouth(P, on > 0.3 ? 'sing' : 'smile');
      for (const t0 of [0.3, 0.55, 0.8, 1.05]) P.burst(t0, t0 > 0.6 ? 'goldnote' : 'note', 'head', [0, 22, 6], { n: 1, speed: 1, spread: 0.9 });
    } },
    // fidget: air guitar — one front leg holds the neck, the other strums, notes flying off the strings
    strum: { len: 2.0, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.25, E.back) * (1 - seg(t, 1.7, 2.0, E.inout)), st = Math.abs(Math.sin(t * TAU * 3)) ** 2;
      body(P, 0, 0.8 * on + 0.3 * st * on, -0.6 * on, -16 * on, -5 * on, on > 0.1 ? FOUR : ALL);
      P.rot('head', -4 * on + 6 * st * on, -14 * on, 10 * on);
      arms(P, 'L', 54 * on, 36 * on, 30 * on); arms(P, 'R', 20 * on, 50 * on, 70 * on - 40 * st * on);
      P.face('eyes', on > 0.5 ? 'happy' : undefined); croon(P, t, 3, on);
      for (const t0 of [0.4, 0.73, 1.06, 1.4]) P.burst(t0, 'goldnote', 'body', [-4, 9, 10], { n: 1, dir: [0.3, 1, 0.5], speed: 1 });
    } },
  },
};
def.anim = anim;
