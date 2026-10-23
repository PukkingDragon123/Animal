// Weirdfin — an eerie, beautiful deep-sea fish (Hydro/Echo), a Radiohead homage ("Weird Fishes /
// Arpeggi"). A deep navy body striped round with seven rainbow bands, like the notes of an arpeggio,
// and a row of photophores down each flank that light up note by note. Big dark deep-sea block eyes that
// glow faintly (a dark block, a two-tone iris block, no whites), a pale underbite with
// two small fangs, ragged violet fin filaments falling over one eye (the singer's shaggy 2007 hair),
// a long glowing lure arching from its brow whose light steps through the rainbow. Translucent fins
// that ripple: a long dorsal sail in four segments, fan-like pectorals, a forked trailing tail. It
// floats and swims in arcs.
// Special: arpeggio light rings, seven of them, one per note, rippling out from the lure.
// Signature: it dims its lights and dangles its lure like bait… and SNAPS at nothing.
// Drip: 1 fisherman's beanie | paper crown · 2 headphones | fairy lights along its back ·
// 3 a vintage mic dangling from the lure | a sticker-covered guitar slung on its flank.
import { E, seg, bump, wob, wave } from '../anim.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import { shift } from './kit.js';
import { blackGold } from '../model.js';
import { B, both, acc, at, fill, band, isSide, jit, pixStates, beanie, crown, phones, mic, guitar, lights, radioMap, ARP, ARP_DRIP, PPU, TAU } from './radio_parts.js';

const C = {
  skin: ['#3a3e7a', '#22265a', '#161a40', '#0c0e26'], face: ['#4a4c8a', '#2c2e66', '#1c1e48', '#10122c'],
  jaw: ['#c4c0f0', '#9894d4', '#6a66a8', '#3e3a72'], mouth: '#1a0818', gum: '#4a1838', tooth: '#f4f8ff',
  fin: '#2e2868', finLo: '#221c54', finHi: '#4a4296', edge: '#c4e8ff', ink: '#0a0c1e', stalk: ['#5a5ea0', '#3a3e7a', '#262a5a', '#161a3a'],
};
const BANDS = ARP.map((c) => [shift(c, 0.32), c, shift(c, -0.3)]);
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (d, x, y) => d * 16 > B4[(x & 3) + (y & 3) * 4] + 0.5;

// ---------------------------------------------------------------- painters
// the body: deep navy, seven rainbow bands wrapping round it from the gills to the tail (by z, so they
// run on across the body, tail and back), fine scale crescents, a few luminous specks
const Z0 = 3.0, PER = 2.45, WID = 1.3;
const bandAt = (Z) => { const k = (Z0 - Z) / PER; if (k < 0 || k >= 7) return [-1, 0]; const f = (k % 1) * PER; return f < WID ? [Math.floor(k), f / WID] : [-1, 0]; };
const skinP = (p, w, h, face, cube) => fill(p, w, h, (x, y) => {
  const [, Y, Z] = at(face, cube, x, y), [i, f] = bandAt(Z);
  let c = band(C.skin, face, x, y, h);
  if (i >= 0) c = f < 0.2 || f > 0.8 ? BANDS[i][2] : face === 'down' ? BANDS[i][2] : f < 0.45 && face !== 'down' ? BANDS[i][0] : BANDS[i][1];
  else if (isSide(face) && (x + (y >> 1) * 2) % 5 === 0 && y % 2 === 0) c = shift(c, 0.1);
  if (i < 0 && (x * 13 + y * 7) % 61 === 0) c = '#8ad8ff';
  return c;
});
// the head: navy with an iridescent sheen, gill slits on the sides; the front's lower edge is the inside
// of the mouth (seen when the jaw drops), with a row of small upper teeth
const headP = (p, w, h, face, cube) => fill(p, w, h, (x, y) => {
  const [X, Y, Z] = at(face, cube, x, y);
  let c = band(C.face, face, x, y, h);
  if (face === 'south' && Y < 11.7) return Y > 11.3 ? C.gum : C.mouth;
  // a lighter slate face mask round the eyes, so the dark eye blocks read against it
  if (face === 'south' && Y > 12.4 && Y < 18.9 && Math.abs(X) < 4.6) return (x * 7 + y * 11) % 23 === 0 ? '#7a80d0' : Y > 17.9 ? '#4e54a0' : '#6268b8';
  if ((face === 'east' || face === 'west') && Z < 5.6) { for (const g of [3.6, 4.4, 5.2]) if (Math.abs(Z - g - (Y - 14) ** 2 * 0.02) < 0.2 && Math.abs(Y - 14) < 3.6) return '#7ae0ff'; }
  if ((x * 7 + y * 11) % 23 === 0) c = shift(c, 0.12); else if ((x * 5 + y * 3) % 31 === 0) c = '#5a6ad8';
  return c;
});
const jawP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? (x % 4 === 1 ? '#6a2050' : C.gum) : face === 'down' ? C.jaw[3] : y === 0 ? C.jaw[0] : band(C.jaw, face, x, y, h)));
const toothP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#ffffff' : x === w - 1 ? '#b8c4e0' : C.tooth));
const stalkP = (p, w, h, face) => fill(p, w, h, (x, y) => (isSide(face) && y % 3 === 0 ? '#7a80c8' : band(C.stalk, face, x, y, h)));
// a translucent fin: a dark violet membrane, dithered thin so the light comes through, rainbow rays
// fanning from its root, a luminous edge. shape(Z, Y) → inside; root: [Z, Y] the rays fan from
// (plane 'x' fins are painted in z / y, plane 'z' fins in x / y)
function finP(o) {
  return (p, w, h, face, cube) => {
    const [ox, oy, oz] = cube.o, [sx, sy] = cube.s, X0 = cube.plane === 'x' ? oz : ox;
    const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && o.shape(X0 + (x + 0.5) / PPU, oy + sy - (y + 0.5) / PPU);
    fill(p, w, h, (x, y) => {
      if (!inside(x, y)) return undefined;
      const U = X0 + (x + 0.5) / PPU, V = oy + sy - (y + 0.5) / PPU;
      if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) return C.edge;
      const a = Math.atan2(V - o.root[1], U - o.root[0]), n = o.rays || 9, ray = ((a - (o.a0 || 0)) / (o.span || Math.PI)) * n, ri = ((Math.floor(ray + 0.5) % 7) + 7) % 7;
      if (Math.abs(ray - Math.round(ray)) < 0.12 + 0.6 / Math.max(1, Math.hypot(U - o.root[0], V - o.root[1]) * PPU)) return BANDS[ri][1];
      return dith(0.22, x, y) ? C.finHi : (x + y) % 2 ? C.fin : C.finLo;
    });
  };
}
// the ragged fringe: dark violet filaments, iridescent at the tips
const fringeP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  if (!isSide(face)) return C.finLo;
  if (y >= h - 3 && (x + Math.floor(jit(x) * 3)) % 3 === 0) return 0;
  const c = y < 2 ? C.finLo : y > h - 4 ? C.finHi : C.fin;
  return (x + Math.floor(jit(x >> 1) * 2)) % 3 === 0 ? shift(c, 0.12) : c;
});
const orb = (c) => (p, w, h) => fill(p, w, h, (x, y) => (x <= 1 && y <= 1 ? '#ffffff' : x + y < w * 0.9 ? shift(c, 0.45) : c));
const halo = (c) => (p, w, h) => fill(p, w, h, (x, y) => { const r = Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2) / (w / 2); return r > 1 || r < 0.42 ? undefined : dith(r > 0.8 ? 0.3 : 0.55 - 0.25 * r, x, y) ? (r > 0.85 ? c : shift(c, 0.5)) : undefined; });
const dimBulb = (p, w, h) => fill(p, w, h, (x, y) => (x === 0 && y === 0 ? '#8a90c0' : '#3a3e6a'));
const photoDim = (i) => (p, w, h) => fill(p, w, h, () => shift(ARP[i], -0.55));
const photo = (i) => (p, w, h) => fill(p, w, h, (x, y) => (x === 0 && y === 0 ? '#ffffff' : shift(ARP[i], 0.25)));
const strapP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#7a6a5a' : (x + y) % 4 === 0 ? '#2a2018' : '#3a2c22'));

// ---------------------------------------------------------------- face
// big deep-sea eyes in the Cobblemon language: a dark rounded-rect block (stepped corners, a lash line
// over the top only), a two-tone iris block filling its lower inner part (blue over sea-glass teal), a
// 2×2 square highlight up top and one low glint — they glow faintly in the dark; key emotions hand-drawn
const EYE = {
  open: [
    '.llllllllll.',
    'lkkkkkkkkkkl',
    'kkhhkkkkkkkk',
    'kkhhkkkkkkkk',
    'kkkkkkkkkkkk',
    'kkkkkkkkkkkk',
    'kkkIIIIIIIII',
    'kkkIIIIIIIII',
    'kkkiiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiihii',
    'kkkiiiiiiiii',
    '.kkiiiiiiii.',
  ],
  angry: [
    '............',
    'll..........',
    'llll........',
    'kkllll......',
    'kkhhllll....',
    'kkhhkkllll..',
    'kkkIIIIIllll',
    'kkkIIIIIIIll',
    'kkkiiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiihii',
    'kkkiiiiiiiii',
    '.kkiiiiiiii.',
  ],
  sad: [
    '............',
    '..........ll',
    '........llll',
    '......llllkk',
    '....llllhhkk',
    '..llllkkhhkk',
    'llllIIIIIIII',
    'llkIIIIIIIII',
    'kkkiiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiihii',
    'kkkiiiiiiiii',
    '.bbbbbbbbbb.',
  ],
  happy: [
    '............',
    '............',
    '............',
    '............',
    '....llll....',
    '...lkkkkl...',
    '..lkk..kkl..',
    '.lkk....kkl.',
    'lkk......kkl',
    'ii........ii',
    '............',
    '............',
    '............',
  ],
  closed: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    'llllllllllll',
    '.llllllllll.',
    '............',
    '............',
    '............',
    '............',
    '............',
  ],
  shock: [
    '.llllllllll.',
    'lIIIIIIIIIIl',
    'IIIIIIIIIIII',
    'iiiiiiiiiiii',
    'iiiiiiiiiiii',
    'iiiiihkiiiii',
    'iiiiikkiiiii',
    'iiiiiiiiiiii',
    'iiiiiiiiiiii',
    'iiiiiiiiiiii',
    'iiiiiiiiiiii',
    'iiiiiiiiiiii',
    '.iiiiiiiiii.',
  ],
  smug: [
    '............',
    '............',
    '............',
    '............',
    '............',
    'llllllllllll',
    'llllllllllll',
    'kkhhIIIIIIII',
    'kkhhiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiihii',
    'kkkiiiiiiiii',
    '.kkiiiiiiii.',
  ],
  sleepy: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    'llllllllllll',
    'llllllllllll',
    'kkhiiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiihii',
    'kkkiiiiiiiii',
    '.kkiiiiiiii.',
  ],
  wide: [
    '.llllllllll.',
    'lkkkkkkkkkkl',
    'kkhhkkkkkkkk',
    'kkhhkkkkkkkk',
    'kkkIIIIIIIII',
    'kkkIIIIIIIII',
    'kkkiiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiihii',
    'kkkiiiiiiiii',
    '.kkiiiiiiii.',
  ],
  teary: [
    '.llllllllll.',
    'lkkkkkkkkkkl',
    'kkhhkkkkkkkk',
    'kkhhkkkkkkkk',
    'kkkkkkkkkkkk',
    'kkkkkkkkkkkk',
    'kkkIIIIIIIII',
    'kkkIIIIIIIII',
    'kkkiiiiiiiii',
    'kkkiiiiiiiii',
    'kkkiiiiiihii',
    'kkkbbbbbbbbb',
    '.bbbbbbbbbb.',
  ],
};
const EYES = eyeRig({ style: 'pix', chunk: 1, glow: 'all', extra: ['smug'], at: [-2.4, 15.5, 9.22], line: C.ink, iris: '#3ad0e0', irisDark: '#2456c8', pupilColor: '#06081a', map: { ...pixStates(EYE.open), ...EYE } });

// ---------------------------------------------------------------- the model
const RAYS = 9;
const dorsal = (name, parent, z0, z1, yb) => ({ name, parent, pivot: [0, yb, (z0 + z1) / 2], cubes: [B(0, yb - 0.2, z0, 0, yb + 7.2, z1, finP({
  root: [(z0 + z1) / 2, yb - 3], rays: 7, a0: Math.PI * 0.25, span: Math.PI * 0.5,
  shape: (Z, Y) => { const H = 1.6 + 5.0 * Math.max(0, Math.min(1, (Z + 11.5) / 14)) ** 0.9, spike = Math.abs(Math.sin(Z * 2.6)) * 0.7; return Y >= yb - 0.2 && Y <= yb + H + spike - 0.35; },
}), { plane: 'x' })] });
const FIN = [
  // pectoral fins: fans sweeping back off the flanks
  { name: 'finR', parent: 'body', pivot: [-4.2, 12.8, 1.4], rot: [0, -34, 8], cubes: [B(-10.0, 8.0, 1.4, -4.2, 14.2, 1.4, finP({
    root: [-4.2, 12.8], rays: 6, a0: Math.PI * 0.55, span: Math.PI * 0.75,
    shape: (X, Y) => { const dx = -4.2 - X, dy = 12.8 - Y, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); return a > -0.5 && a < 1.25 && r < 5.4 * (0.75 + 0.25 * Math.cos((a - 0.4) * 3)); },
  }), { plane: 'z' })] },
  // photophores down the flank: a dim bead always, a bright one when its note plays
  { name: 'photoR', parent: 'body', pivot: [-4.2, 11.0, -1.5], cubes: [0, 1, 2, 3, 4, 5, 6].flatMap((i) => {
    const z = 2.0 - i * 1.25, y = 11.4 - Math.sin((i / 6) * Math.PI) * 0.6;
    return [B(-4.42, y - 0.35, z - 0.35, -4.15, y + 0.35, z + 0.35, photoDim(i), { outline: false }), B(-4.5, y - 0.42, z - 0.42, -4.1, y + 0.42, z + 0.42, photo(i), { glow: true, outline: false, id: 'ph-' + i, hide: true })];
  }) },
];
const BACK_LIGHTS = [[-4.3, 18.6, 2.6], [-4.3, 19.3, -1.5], [-4.3, 18.4, -5.8], [0, 19.9, -5.9], [4.3, 18.4, -5.8], [4.3, 19.3, -1.5], [4.3, 18.6, 2.6]];
export const def = {
  name: 'weirdfin', ppu: 3, scale: 0.5, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 14, 0], cubes: [
      B(-4.2, 9.2, -6.0, 4.2, 19.0, 3.2, skinP),
      B(-3.2, 8.4, -5.0, 3.2, 9.2, 2.2, skinP), B(-3.2, 19.0, -5.0, 3.2, 19.7, 2.2, skinP),
      // dripped (or): fairy lights strung along its back
      ...lights({ pts: BACK_LIGHTS, id: 'acc-lights', every: 1.7, bulb: 0.65, cols: ['#fff2b0', '#b0e8ff', '#ffb0d0', '#c8ffb0'] }),
      // ultra (or): the guitar's strap over the back
      ...acc('acc-guitar', [B(-4.35, 19.0, -2.4, 4.35, 19.9, -1.6, strapP), B(4.2, 10.4, -2.4, 4.5, 19.9, -1.6, strapP)]),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 14.2, 3.0], cubes: [
      B(-4.75, 9.6, 3.0, 4.75, 19.4, 9.2, headP),
      B(-4.0, 19.4, 3.6, 4.0, 20.0, 8.4, headP),
      // normal: a fisherman's beanie · or a paper crown (the lure pokes up through either)
      ...beanie({ x0: -4.6, x1: 4.6, y: 18.8, z0: 3.4, z1: 9.0, h: 3.0, id: 'acc-beanie', cols: ['#f08a4a', '#d8643a', '#a8442a', '#6a2a1a'] }),
      ...crown({ x0: -3.9, x1: 3.9, z0: 4.0, z1: 8.6, y: 19.9, h: 2.4, id: 'acc-crown' }),
      // dripped: headphones
      ...phones({ x: 4.75, y: 14.6, z: 5.4, r: 2.2, top: 21.2, id: 'acc-phones', accent: '#5af0d0' }),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 11.6, 4.0], cubes: [
      B(-4.0, 9.0, 3.8, 4.0, 11.6, 9.9, jawP),
      ...[-2.2, 2.2].map((x) => B(x - 0.3, 11.6, 9.2, x + 0.3, 12.3, 9.6, toothP, { outline: false })),
    ] },
    ...EYES.bones,
    { name: 'fringe', parent: 'head', pivot: [-1.0, 19.4, 9.2], cubes: [
      B(-4.8, 17.4, 9.1, -1.4, 20.0, 9.7, fringeP, { pivot: [-1.4, 19.8, 9.4], rot: [0, 0, 10] }),
      B(-2.0, 18.6, 8.6, 0.6, 21.2, 9.3, fringeP, { pivot: [-0.7, 19.8, 9.0], rot: [-20, 0, 10] }),
      B(1.0, 19.2, 7.4, 3.0, 21.0, 8.2, fringeP, { pivot: [2.0, 19.6, 7.8], rot: [-30, 0, 24] }),
    ] },
    // the lure: a stalk arching up and over from the brow, a bulb whose light steps through seven colours
    { name: 'lure1', parent: 'head', pivot: [0, 19.4, 6.8], rot: [-10, 0, 0], cubes: [B(-0.4, 19.2, 6.4, 0.4, 23.6, 7.2, stalkP)] },
    { name: 'lure2', parent: 'lure1', pivot: [0, 23.6, 6.8], rot: [45, 0, 0], cubes: [B(-0.35, 23.4, 6.45, 0.35, 27.0, 7.15, stalkP)] },
    { name: 'lure3', parent: 'lure2', pivot: [0, 27.0, 6.8], rot: [55, 0, 0], cubes: [B(-0.3, 26.8, 6.5, 0.3, 29.8, 7.1, stalkP)] },
    { name: 'bulb', parent: 'lure3', pivot: [0, 29.8, 6.8], rot: [60, 0, 0], cubes: [
      B(-0.6, 29.6, 6.2, 0.6, 30.2, 7.4, stalkP),
      B(-1.1, 29.9, 5.7, 1.1, 32.1, 7.9, dimBulb, { id: 'lure-dim', hide: true }),
      ...ARP.flatMap((c, i) => [
        B(-1.15, 29.85, 5.65, 1.15, 32.15, 7.95, orb(c), { glow: true, outline: false, id: 'lure-' + i, hide: i !== 4 }),
        B(-2.8, 28.2, 6.8, 2.8, 33.8, 6.8, halo(c), { plane: 'z', glow: true, id: 'lure-' + i, hide: i !== 4 }),
        B(0, 28.2, 4.0, 0, 33.8, 9.6, halo(c), { plane: 'x', glow: true, id: 'lure-' + i, hide: i !== 4 }),
      ]),
    ] },
    // ultra: a vintage mic dangling on a cable from the lure's bend
    { name: 'micB', parent: 'lure2', pivot: [0, 27.0, 6.8], rot: [145, 0, 0], cubes: acc('acc-mic', [B(-0.12, 27.0, 6.68, 0.12, 28.6, 6.92, '#2a2a34', { outline: false }), ...mic({ x: 0, y: 28.5, z: 6.8, k: 0.55, id: 'acc-mic' })]) },
    { name: 'tail1', parent: 'body', pivot: [0, 14, -5.6], cubes: [B(-3.0, 10.6, -11.0, 3.0, 17.6, -5.6, skinP)] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 14, -10.8], cubes: [B(-1.8, 12.0, -14.4, 1.8, 16.2, -10.8, skinP)] },
    { name: 'caudal', parent: 'tail2', pivot: [0, 14, -14.2], cubes: [B(0, 5.4, -25.4, 0, 22.6, -14.0, finP({
      root: [-14.0, 14.0], rays: 9, a0: Math.PI * 0.62, span: Math.PI * 0.76,
      shape: (Z, Y) => { const dz = -14.0 - Z, dy = Y - 14.0, r = Math.hypot(dz, dy), a = Math.atan2(dy, dz); return Math.abs(a) < 1.08 && r < 11.2 * (0.52 + 0.48 * Math.abs(Math.sin(a * 1.55)) ** 0.8); },
    }), { plane: 'x' })] },
    dorsal('dors1', 'body', -1.0, 3.0, 19.6), dorsal('dors2', 'body', -4.8, -0.8, 19.6), dorsal('dors3', 'body', -8.0, -4.6, 19.3),
    dorsal('dors4', 'tail1', -11.2, -7.8, 17.4),
    { name: 'ventral', parent: 'tail1', pivot: [0, 10.8, -8.0], cubes: [B(0, 5.6, -11.0, 0, 10.9, -6.0, finP({
      root: [-6.4, 11], rays: 6, a0: -Math.PI * 0.95, span: Math.PI * 0.6,
      shape: (Z, Y) => { const d = 10.8 - Y, L = 4.8 * (1 - ((Z + 6.0) / -5) ** 2 * 0.35); return d >= 0 && d < L && Z < -6.2 - d * 0.5; },
    }), { plane: 'x' })] },
    ...both(...FIN),
    // ultra (or): a sticker-covered guitar slung on its right flank
    { name: 'guitar', parent: 'body', pivot: [-4.25, 14.0, -1.4], rot: [0, -90, 30], cubes: guitar({ x: -4.25, y: 8.6, z: -1.4, k: 0.7, id: 'acc-guitar', cols: ['#d8f4ff', '#9ad0f0', '#5a90c0', '#2a4a70'] }) },
  ],
};
def.drip = [
  [{ id: 'acc-beanie', name: "Fisherman's beanie" }, { id: 'acc-crown', name: 'Paper crown' }],
  [{ id: 'acc-phones', name: 'Headphones' }, { id: 'acc-lights', name: 'Fairy lights' }],
  [{ id: 'acc-mic', name: 'Vintage mic on the lure' }, { id: 'acc-guitar', name: 'Sticker-covered guitar' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 20.0, 6.0], size: 8 },
  face: { bone: 'head', at: [0, 15.5, 9.25], size: 9.4 },
  neck: { bone: 'body', at: [0, 12.0, 3.2], size: 8 },
  back: { bone: 'body', at: [0, 19.8, -2.0], size: 7 },
};

// ---------------------------------------------------------------- posing helpers
const DORS = ['dors1', 'dors2', 'dors3', 'dors4'];
// swimming: an S-wave down the body to the tail fin, the head countering
function swim(P, t, amp = 10, hz = 1) {
  const ph = t * hz * TAU;
  P.rot('body', 0, amp * 0.25 * Math.sin(ph), 0).rot('head', 0, -amp * 0.3 * Math.sin(ph + 0.5), 0);
  P.rot('tail1', 0, amp * Math.sin(ph - 0.8), 0).rot('tail2', 0, amp * 1.3 * Math.sin(ph - 1.6), 0).rot('caudal', 0, amp * 1.6 * Math.sin(ph - 2.4), 0);
}
// the fins ripple: a travelling wave along the dorsal sail, the pectorals sculling
function fins(P, t, k = 1, hz = 1.2) {
  DORS.forEach((n, i) => P.rot(n, 0, 0, 12 * k * Math.sin(t * hz * TAU - i * 1.1)));
  P.rot('finR', 0, 16 * k * Math.sin(t * hz * TAU), 10 * k * Math.sin(t * hz * TAU + 1)).rot('finL', 0, -16 * k * Math.sin(t * hz * TAU + 0.6), -10 * k * Math.sin(t * hz * TAU + 1.6));
  P.rot('ventral', 0, 0, 10 * k * Math.sin(t * hz * TAU - 2));
}
// the lights: the lure steps through the seven notes, the photophores run up and down the arpeggio
const NOTE = [0, 2, 4, 6, 4, 2];
function glow(P, t, bps = 2, o = {}) {
  const n = Math.floor(t * bps);
  P.face('lure', o.lure ?? 'c' + (Math.floor(t * bps / 2) % 7));
  P.face('arp', o.arp ?? 'n' + (o.up ? n % 7 : NOTE[n % NOTE.length]));
}
const face = (P, e, jaw = 0) => { if (e) P.face('eyes', e); P.rot('jaw', jaw); };
const BULB = [0, 31, 6.8], LURE_HEAD = [0, 24.5, 11.5], MOUTHP = [0, 11.8, 10.4];
// arpeggio rings: one per note in sequence from a point (kind: rh-ring / rh-wave / rh-orb)
const arp = (P, t0, step, kind, bone, off, o = {}) => { for (let i = 0; i < 7; i++) P.burst(t0 + i * step, kind + i, bone, off, o); };
// lying on its side on the floor, belly-up-ish (k 0 → 1)
function grounded(P, k) {
  P.rot('body', 0, 0, 100 * k).pos('root', 0, -9.4 * k, 0);
  P.rot('tail1', 0, 14 * k, 0).rot('tail2', 0, 10 * k, 0).rot('lure1', 30 * k, 0, 0).rot('lure2', 20 * k, 0, 0);
}

// ---------------------------------------------------------------- animation
const NOTES = Object.fromEntries([...ARP.map((_, i) => ['n' + i, ['ph-' + i]]), ['all', ARP.map((_, i) => 'ph-' + i)], ['none', []]]);
const LURES = Object.fromEntries([...ARP.map((_, i) => ['c' + i, ['lure-' + i]]), ['dim', ['lure-dim']], ['off', ['lure-dim']]]);
export const anim = {
  start: 'idle', seed: 31,
  breathe: { bone: 'body', amp: 0.015, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.8, 6.0], dur: 0.14 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 3 },
  springs: [
    { bone: 'lure1', tip: [0, 4, 0], k: 140, d: 6, gain: 0.7, max: 14 },
    { bone: 'lure2', tip: [0, 3.4, 0], k: 110, d: 5, gain: 0.9, max: 20 },
    { bone: 'lure3', tip: [0, 2.8, 0], k: 90, d: 4, gain: 1.1, max: 26 },
    { bone: 'bulb', tip: [0, 1.6, 0], k: 80, d: 4, gain: 1.2, max: 30 },
    { bone: 'micB', tip: [0, 4, 0], k: 60, d: 3, gain: 1.4, max: 35 },
    { bone: 'fringe', tip: [0, -2.4, 0.4], k: 160, d: 8, gain: 0.7, max: 16, axes: [1, 0.3, 1] },
    { bone: 'caudal', tip: [0, 0, -8], k: 140, d: 7, gain: 0.6, max: 18, axes: [0.4, 1, 0.4] },
    { bone: 'finR', tip: [-4, -2, 0], k: 150, d: 7, gain: 0.5, max: 16 },
    { bone: 'finL', tip: [4, -2, 0], k: 150, d: 7, gain: 0.5, max: 16 },
  ],
  faces: { eyes: EYES.slot, lure: { default: 'c4', states: LURES }, arp: { default: 'none', states: NOTES } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'bait', 'loop', 'dance'] },
  clips: {
    // hovering: a slow bob and drift, the body undulating, fins rippling, the lure swaying and its
    // light stepping through the notes while the photophores run the arpeggio; slow, glassy glances
    idle: { len: 4.0, loop: true, f(P, t) {
      const ph = (t / 4) * TAU;
      P.pos('root', Math.sin(ph) * 0.6, Math.sin(ph * 2) * 0.7, 0).rot('root', Math.sin(ph * 2 + 1) * 3, Math.sin(ph) * 6, Math.sin(ph + 0.6) * 4);
      swim(P, t, 6, 0.75); fins(P, t, 1, 1.0);
      P.rot('lure1', Math.sin(ph * 2) * 4, 0, Math.sin(ph) * 5);
      glow(P, t, 3);
      const [gx, gy] = glance(t, [[0, 0], [-0.4, 0.1], [-0.4, 0.1], [0.35, -0.15], [0, 0.3], [0, 0]], 0.66, 0.12);
      eyesAt(P, gx, gy); face(P, t > 2.6 && t < 3.0 ? 'wide' : undefined, 4 + 3 * Math.max(0, Math.sin(ph * 2)));
      P.burst(0.5, 'bubble', 'head', MOUTHP, { n: 1, speed: 0.4 }).burst(2.3, 'bubble', 'head', MOUTHP, { n: 2, speed: 0.4 });
    } },
    // swimming in arcs: rising and banking through a lazy S, tail beating
    walk: { len: 2.0, loop: true, f(P, t) {
      const ph = (t / 2) * TAU;
      P.pos('root', Math.sin(ph) * 2.4, Math.sin(ph * 2) * 1.4, 0).rot('root', -Math.cos(ph * 2) * 8, Math.cos(ph) * 16, -Math.cos(ph) * 14);
      swim(P, t, 16, 2); fins(P, t, 1.2, 2);
      glow(P, t, 4, { up: true }); face(P, 'open', 3);
      P.burst(0.4, 'bubble', 'head', MOUTHP, { n: 2, speed: 0.5 }).burst(1.4, 'bubble', 'head', MOUTHP, { n: 1, speed: 0.5 });
    } },
    // battle cry: it rears up and wails an eerie note — jaw wide, fins flared, the lure blazing through
    // all seven colours as rings of light pulse out
    cry: { len: 2.1, next: 'idle', f(P, t) {
      const up = seg(t, 0.1, 0.4, E.back) * (1 - seg(t, 1.6, 2.0, E.inout)), coil = bump(t, 0, 0.3);
      P.rot('root', -22 * up + 8 * coil, 0, wave(t, 3) * 4 * up).pos('root', 0, 1.6 * up, -1 * coil);
      swim(P, t, 8 + 10 * up, 2.4); fins(P, t, 1 + up, 3);
      DORS.forEach((n) => P.rot(n, -14 * up, 0, 0)); P.rot('finR', 0, -30 * up, -30 * up).rot('finL', 0, 30 * up, 30 * up);
      glow(P, t, up > 0.3 ? 14 : 3, { arp: up > 0.3 ? 'all' : undefined, up: true });
      face(P, coil > 0.3 ? 'angry' : up > 0.3 ? 'wide' : undefined, 34 * up + wave(t, 9) * 4 * up); P.blinkOK = false;
      arp(P, 0.45, 0.13, 'rh-ring', 'head', MOUTHP, { scale: 0.9 });
      P.burst(0.45, 'bubble', 'head', MOUTHP, { n: 8, speed: 1.2, spread: 0.8 });
    } },
    // attack: it coils back into an S… and lunges, jaws snapping on the strike
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.32, 0.42, E.in3) * (1 - seg(t, 0.6, 1.0, E.inout)), snap = bump(t, 0.3, 0.48);
      P.pos('root', 0, 0.4 * bk, -2.6 * bk + 5 * hit).rot('root', -6 * bk + 8 * hit, 0, 0);
      P.rot('tail1', 0, 26 * bk, 0).rot('tail2', 0, -30 * bk, 0).rot('caudal', 0, 30 * bk - 30 * hit, 0).rot('head', 0, -10 * bk, 0);
      fins(P, t, 1.4, 3); glow(P, t, 10, { up: true });
      face(P, bk > 0.2 || hit > 0.2 ? 'angry' : undefined, 38 * snap * (t < 0.42 ? 1 : 0) + 6); P.blinkOK = false;
      P.burst(0.42, 'spark', 'head', [0, 12, 11], {}).burst(0.42, 'splash', 'head', [0, 12, 11], { n: 8 }).burst(0.42, 'rh-ring4', 'head', [0, 12, 11], { scale: 0.5 });
    } },
    // special (arpeggi): the lure swings out in front, and note by note seven rings of light ripple out
    // ahead, each with an orb of its colour, the photophores running up the scale with them
    special: { len: 2.6, next: 'idle', f(P, t) {
      const ready = seg(t, 0, 0.35, E.back) * (1 - seg(t, 2.1, 2.5, E.inout)), play = t > 0.5 && t < 1.9 ? 1 : 0, ni = Math.min(6, Math.max(0, Math.floor((t - 0.5) / 0.2)));
      P.rot('lure1', 20 * ready, 0, 0).rot('lure2', -10 * ready, 0, 0).rot('root', -8 * ready, 0, 0).pos('root', 0, 0.8 * ready, -1 * ready);
      swim(P, t, 6, 1.5); fins(P, t, 1.4, 2.2);
      P.rot('body', 0, 0, wave(t, 2.5) * 5 * play);
      glow(P, t, 5, { lure: play ? 'c' + ni : t > 1.9 ? 'c' + (Math.floor(t * 12) % 7) : undefined, arp: play ? 'n' + ni : t > 1.9 && t < 2.2 ? 'all' : undefined });
      face(P, play ? 'wide' : ready > 0.3 ? 'smug' : undefined, 10 * play); P.blinkOK = false;
      arp(P, 0.5, 0.2, 'rh-wave', 'head', LURE_HEAD, { dir: [0, -0.15, 1] }); arp(P, 0.52, 0.2, 'rh-orb', 'head', LURE_HEAD, { dir: [0, -0.12, 1] }); arp(P, 0.5, 0.2, 'rh-ring', 'bulb', BULB, { scale: 0.6 });
      P.burst(1.95, 'sparkle', 'bulb', BULB, { n: 12, speed: 1.4 });
    } },
    // hurt: a jolt back, curling up, its lights flickering out for a moment
    hurt: { len: 0.8, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.25, 0.8, E.inout));
      P.pos('root', 0, 0.6 * k, -2.4 * k).rot('root', -16 * k + wob(t, 0.2, 5, 3, 6), 0, wave(t, 14) * 5 * k);
      P.rot('tail1', 0, 0, 0).rot('tail1', -20 * k, 0, 0).rot('tail2', -20 * k, 0, 0).rot('head', 10 * k, 0, 0);
      fins(P, t, 0.5, 4);
      glow(P, t, 3, { lure: t < 0.3 && Math.floor(t * 30) % 2 ? 'dim' : undefined, arp: 'none' });
      face(P, t < 0.5 ? 'shut' : undefined, 16 * k); P.blinkOK = false;
      P.burst(0.02, 'bubble', 'body', [0, 15, 4], { n: 8, speed: 1.2, spread: 1 }).burst(0.02, 'spark', 'head', [0, 15, 9], {});
    } },
    // faint: its lights go out one by one; it drifts down, rolls over and settles on the floor
    faint: { len: 2.6, next: 'down', f(P, t) {
      const sink = seg(t, 0.5, 1.9, E.inout);
      grounded(P, sink); swim(P, t, 6 * (1 - sink), 1); fins(P, t, 1 - sink, 1.5);
      const left = Math.max(0, 6 - Math.floor(t / 0.2));
      glow(P, t, 3, { lure: t < 1.2 ? (Math.floor(t * 9) % 3 ? 'c' + left : 'dim') : 'dim', arp: t < 1.4 ? 'n' + left : 'none' });
      face(P, t < 0.5 ? 'sad' : 'swirl', 8 * sink); P.blinkOK = false; P.lookW = 0;
      P.burst(0.1, 'bubble', 'head', MOUTHP, { n: 6, speed: 0.6 }).burst(1.9, 'dust', 'root', [0, 0, 0], { n: 8 }).burst(1.9, 'bubble', 'body', [0, 14, 0], { n: 6 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      grounded(P, 1); P.breathW = 0.4; P.blinkOK = false; P.lookW = 0;
      P.rot('caudal', 0, 8 * bump(t, 1.0, 1.4), 0).rot('finR', 0, 10 * bump(t, 2.0, 2.3), 0);
      glow(P, t, 1, { lure: t > 2.2 && t < 2.35 ? 'c4' : 'dim', arp: 'none' });
      face(P, 'swirl', 8);
      P.burst(1.2, 'bubble', 'head', MOUTHP, { n: 1, speed: 0.3 });
    } },
    // win: a barrel roll swept up into an arc, and the full arpeggio in rings round it
    win: { len: 2.6, next: 'idle', f(P, t) {
      const roll = seg(t, 0.2, 1.1, E.inout), arc = bump(t, 0.1, 1.3), pose = seg(t, 1.2, 1.4, E.back) * (1 - seg(t, 2.2, 2.6));
      P.rot('root', -14 * arc, 0, 360 * roll).pos('root', 0, 3 * arc, 0);
      swim(P, t, 12, 2); fins(P, t, 1.5, 2.5);
      glow(P, t, 9, { up: true, arp: pose > 0.3 ? 'all' : undefined });
      face(P, 'happy', 10 * pose + 4); P.blinkOK = false;
      arp(P, 1.2, 0.08, 'rh-ring', 'body', [0, 14, 0], { scale: 1.2 });
      P.burst(1.3, 'sparkle', 'bulb', BULB, { n: 12, speed: 1.4 }).burst(0.3, 'bubble', 'body', [0, 14, 0], { n: 10, spread: 1 });
    } },
    // asleep: sunk low and still, lights dimmed to a single slow glow, fins barely stirring
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * TAU);
      P.pos('root', 0, -4.5 + br * 0.4, 0).rot('root', 4, 0, 6);
      swim(P, t, 3, 0.4); fins(P, t, 0.4, 0.5);
      P.rot('lure1', 24, 0, 0).rot('lure2', 20, 0, 0);
      glow(P, t, 1, { lure: br > 0.6 ? 'c5' : 'dim', arp: 'none' });
      face(P, 'closed', 3); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.6, 'bubble', 'head', MOUTHP, { n: 1, speed: 0.3 }).burst(1.8, 'z', 'head', [3, 21, 8], {});
    } },
    // the dance: a slow, hypnotic roll from side to side on the beat, fins fanning in sequence, the lure
    // bobbing, the lights running up and down the arpeggio… and a barrel roll to finish, rings out
    dance: { len: 3.0, next: 'idle', f(P, t) {
      const live = seg(t, 0, 0.2) * (1 - seg(t, 2.1, 2.2)), bt = t / 0.375, n = Math.floor(bt), sw = Math.sin(bt * Math.PI) * live;
      const roll = seg(t, 2.15, 2.7, E.inout);
      P.rot('root', 4 * Math.abs(sw), 10 * sw, 18 * sw + 360 * roll).pos('root', 1.2 * sw, 0.8 * Math.abs(Math.sin(bt * Math.PI * 2)) * live + 2 * bump(t, 2.1, 2.8), 0);
      swim(P, t, 10, 1.3); fins(P, t, 1.4 * live + 0.6, 2.6);
      P.rot('lure1', 10 * Math.sin(bt * Math.PI * 2) * live, 0, 0).rot('head', -6 * Math.abs(sw), 0, -8 * sw);
      glow(P, t, 8 / 3, { up: n % 2 === 0, arp: roll > 0.3 ? 'all' : undefined });
      face(P, live > 0.5 ? (n % 4 === 3 ? 'happy' : 'smug') : roll > 0 ? 'happy' : undefined, 6 + 6 * Math.abs(sw)); P.blinkOK = false;
      for (let i = 0; i < 6; i++) P.burst(0.375 * i + 0.05, 'rh-ring' + NOTE[i % 6], 'bulb', BULB, { scale: 0.4 });
      arp(P, 2.3, 0.05, 'rh-ring', 'body', [0, 14, 0], { scale: 1.1 }); P.burst(2.4, 'sparkle', 'body', [0, 20, 0], { n: 10, speed: 1.4 });
    } },
    // signature: it dims every light but the lure, lets it dangle and twitch like bait, narrows its
    // eyes… and SNAPS at nothing — then shakes it off, a little embarrassed
    bait: { len: 3.6, next: 'idle', f(P, t) {
      const dim = seg(t, 0.1, 0.4) * (1 - seg(t, 3.1, 3.4)), twitch = t > 0.6 && t < 2.0 ? Math.sin(t * 22) * (Math.floor(t * 3) % 2) : 0;
      const coil = seg(t, 1.9, 2.15, E.out) * (1 - seg(t, 2.15, 2.22)), snap = seg(t, 2.18, 2.28, E.in3) * (1 - seg(t, 2.5, 2.9, E.inout));
      P.rot('lure1', 26 * dim, 0, 0).rot('lure2', 18 * dim, 0, 0).rot('bulb', twitch * 25, 0, twitch * 15).pos('root', 0, -0.8 * dim, -2 * coil + 4 * snap).rot('root', 6 * dim - 8 * coil + 6 * snap, 0, 0);
      swim(P, t, 4 + 14 * coil, 1 + 2 * coil); fins(P, t, 0.6 + coil, 1.5);
      glow(P, t, 3, { lure: dim > 0.5 && t < 2.2 ? 'c3' : undefined, arp: dim > 0.3 ? 'none' : undefined });
      eyesAt(P, 0, 0.25 * dim * (t < 2.0 ? 1 : 0));
      face(P, t > 2.15 && t < 2.45 ? 'angry' : t > 2.6 && t < 3.1 ? 'closed' : dim > 0.5 ? 'smug' : undefined, t > 2.15 && t < 2.24 ? 40 : 4); P.blinkOK = false; P.lookW = 0;
      P.burst(2.26, 'spark', 'head', [0, 12, 11], { scale: 0.8 }).burst(2.26, 'splash', 'head', [0, 12, 11], { n: 10 }).burst(2.7, 'sweat', 'head', [5, 19, 8], { n: 2 }).burst(2.75, 'bubble', 'head', MOUTHP, { n: 4, speed: 0.6 });
    } },
    // fidget: it follows you for a while… then swims a full loop-the-loop, a ring of each colour behind it
    loop: { len: 2.8, next: 'idle', f(P, t) {
      const lp = seg(t, 0.3, 2.2, E.inout), a = lp * TAU;
      P.rot('root', -360 * lp, 0, 0).pos('root', 0, 7 * (1 - Math.cos(a)) * 0.5, -7 * Math.sin(a) * 0.5);
      swim(P, t, 14, 2.2); fins(P, t, 1.3, 2.4);
      glow(P, t, 7, { up: true });
      face(P, lp > 0 && lp < 1 ? 'wide' : 'happy', 6); P.blinkOK = false;
      for (let i = 0; i < 7; i++) P.burst(0.45 + i * 0.25, 'rh-ring' + i, 'body', [0, 14, -4], { scale: 0.7 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: a black-lacquer body banded in alternating gold and champagne, fins of black
// lacquer with gold rays and edges, its lights burning ice-blue and gold; the eyes keep their shine
const SWAP = { [C.edge]: '#fff4b0', [C.fin]: '#1c1824', [C.finLo]: '#0e0c12', [C.finHi]: '#3a3048', [C.jaw[0]]: '#fff4d0', [C.jaw[1]]: '#f2d690', [C.jaw[2]]: '#c8a050', [C.jaw[3]]: '#8a6420' };
BANDS.forEach((b, i) => b.forEach((c, j) => { SWAP[c] = i % 2 ? ['#fff8e0', '#f2dca0', '#b89a5a'][j] : ['#fff4b0', '#ffd23e', '#a86a18'][j]; }));
const GLOW = {}; ARP.forEach((c, i) => [c, shift(c, 0.25), shift(c, 0.45), shift(c, 0.5)].forEach((g) => { GLOW[g] = i % 2 ? '#bfe8ff' : '#ffe680'; }));
def.dripForm = { map: keepEyes(EYES, radioMap({ black: [[180, 330]], swap: SWAP, glow: (c) => GLOW[c] || blackGold(c, true) })), fx: { ...ARP_DRIP } };
