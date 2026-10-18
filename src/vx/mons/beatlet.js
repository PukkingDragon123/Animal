// Beatlet — stage 1 of the Beatlet line (Bio): a small, chubby bipedal beetle kid. Its glossy
// head shell is an early-60s mop-top with a fringe down to its eyes, its elytra and chest carry
// the markings of a matching collarless suit (black piping round a round neckline, a slim tie,
// a centre vent behind), and a leaf sprout grows from the little horn nub on its crown. Round amber
// bead eyes. Sunny, bouncy, always humming. Evolves into Pepperhorn.
// Drip (one option per tier): 1 satin band collar | harmonica neck-rack · 2 Cuban-heel Beatle boots |
// pink round shades pushed up on the mop · 3 sunburst 12-string | violin bass, slung on its back.
import { eyeRig } from './eyes.js';
import { shift } from './kit.js';
import { dripMap } from './beetle_parts.js';
import { B, both, chitin, fur, tipP, leafP, at, band, jit, pixStates, legs, arm, arms, emote, darts, walkCycle, sharedClips, onBack, E, seg, bump, wob, wave, TAU } from './beetle_parts.js';
import { bounce } from '../anim.js';

const C = {
  suit: ['#a8aab2', '#70727c', '#4a4c54', '#2c2d33'], pipe: '#121218', shirt: '#f2eee4', shirtLo: '#cfc8bc',
  face: ['#86c0c4', '#3e6e78', '#284a54', '#16303a'], hand: ['#c07a48', '#7e4226', '#542a18', '#361a10'], hair: ['#9a6a42', '#6a4228', '#4a2c1a', '#2a180c'], hairGl: '#e0b080',
  boot: ['#5a4a56', '#201820', '#140e14', '#0a060a'], horn: ['#c08a5a', '#8a4e30', '#5a2a1c', '#3a1810'],
  claw: ['#6a3a22', '#3a1c10', '#24100a', '#140806'], leaf: '#7ad04a', leafLo: '#3e9a36',
  satin: ['#ff9ccc', '#ff4fa3', '#c42a78', '#8a1a56'], gold: ['#fff6b0', '#ffd23e', '#d0902a', '#8a561a'],
};
// ---------------------------------------------------------------- painters
const suitP0 = chitin(C.suit, { streak: false, dots: false });
const suitP = (p, w, h, face, cube) => { suitP0(p, w, h, face, cube); if (face !== 'down') for (let y = 1; y < h; y++) for (let x = (y & 1); x < w; x += 2) p.px(x, y, shift(band(C.suit, face, x, y, h), 0.05)); };
// the chest: a collarless suit front — a round neckline piped in black, shirt and slim tie inside, two buttons below
function chestP(p, w, h, face, cube) {
  suitP(p, w, h, face, cube);
  if (face !== 'south') return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y] = at(face, cube, x, y), ax = Math.abs(X), cv = 11.7 - 2.1 * (1 - Math.min(1, (ax / 2.3) ** 2));
    if (ax < 2.3 && Y > cv) p.px(x, y, ax < 0.4 ? C.pipe : Y > 11.3 ? C.shirtLo : C.shirt);
    else if (ax < 2.7 && Y > cv - 0.4) p.px(x, y, C.pipe);
    else if (ax < 0.17) p.px(x, y, C.pipe);                                           // the edge-to-edge front, piped
    if (ax < 0.5 && (Math.abs(Y - 9.0) < 0.3 || Math.abs(Y - 8.0) < 0.3)) p.px(x, y, '#16161c');                 // covered buttons
    if (ax > 2.0 && ax < 3.7 && Math.abs(Y - 8.0) < 0.17) p.px(x, y, C.pipe);       // piped pocket flaps
  }
}
// the elytra: suit markings — black piping along the outer edge and down the centre vent
function backP(p, w, h, face, cube) {
  suitP(p, w, h, face, cube);
  if (face === 'down') return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y] = at(face, cube, x, y);
    if ((face === 'north' || face === 'up') && Math.abs(X) < 0.3) p.px(x, y, C.pipe);
    if (face === 'north' && Math.abs(Math.abs(X) - 4.6) < 0.3 && Y > 7.6) p.px(x, y, C.pipe);
  }
}
const sleeveP = (p, w, h, face, cube) => { suitP(p, w, h, face, cube); if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, h - 1, C.pipe); };
const cuffP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? '#ffffff' : C.shirtLo); };
const faceP = chitin(C.face, { gloss: '#ffcfa0', streakAt: 0.2 });
// the mop-top: smooth, glossy, combed-down hair — a soft gradient (lighter on the crown), faint
// strands every few texels, and one broad sheen band wrapping the dome
function mopP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y, Z] = at(face, cube, x, y);
    let c;
    if (face === 'up') { const r = Math.hypot(X, Z); c = r < 1.2 ? C.hair[1] : Math.floor(Math.atan2(Z, X) * 5 + 40) & 1 ? C.hair[0] : shift(C.hair[0], -0.06); if (Math.abs(r - 2.6) < 0.4) c = C.hairGl; }
    else if (face === 'down') c = C.hair[3];
    else {
      const part = (x + Math.floor(jit(Math.floor(x / 4)) * 2)) % 4 === 0, lit = face === 'south' || face === 'west', sh = 20.1 + Math.sin(x * 0.5) * 0.2;
      c = Y > 18.5 ? C.hair[0] : Y > 16 ? C.hair[1] : C.hair[2];
      if (part) c = shift(c, -0.1);
      if (Math.abs(Y - sh) < 0.36) c = lit ? C.hairGl : shift(C.hair[0], 0.08);
      else if (Math.abs(Y - sh) < 0.7) c = shift(C.hair[0], 0.04);
      if (y === h - 1 && cube.o[1] < 15 && (x + (y & 1)) % 3 !== 1) c = 0;            // a soft, uneven hem where it hangs
    }
    p.px(x, y, c);
  }
}
// the fringe: combed straight down and cut level just over the eyes, a soft sheen across its middle
const fringeP2 = (p, w, h, face) => { const sh = Math.round(h * 0.3); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = face === 'up' ? C.hair[0] : face === 'down' ? C.hair[3] : y < sh ? C.hair[0] : y < h * 0.7 ? C.hair[1] : C.hair[2]; if (face !== 'up' && face !== 'down') { const part = (x + Math.floor(jit(Math.floor(x / 4)) * 2)) % 4 === 0; if (part) c = shift(c, -0.12); if (Math.abs(y - sh - Math.round(Math.sin(x * 0.5) * 0.5)) < 1) c = face === 'south' ? C.hairGl : shift(C.hair[0], 0.08); if (y >= h - 1 && x % 4 === 1) c = 0; } p.px(x, y, c); } };
const bootP = chitin(C.boot, { gloss: '#9a8a96', dots: false });
const heelP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? '#6a4a3a' : '#3a2620'); };
const clawP = tipP(C.claw);
const handP = chitin(C.hand, { gloss: '#ffcfa0' });
const hornP = tipP(C.horn, { up: true });
const stemP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 ? '#d8ff8a' : C.leafLo); };
// drip: the satin collar, the sunburst guitar
const collarP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face !== 'up' && face !== 'down' && (y === 0 || y === h - 1) ? (y ? C.gold[2] : C.gold[0]) : band(C.satin, face, x, y, h)); if (face === 'south') { const m = Math.floor(w / 2); p.px(m, 1, C.gold[0]); p.px(m - 1, 1, C.gold[1]); p.px(m, 2, C.gold[2]); } };
const burstP = (p, w, h, face) => { const cx = (w - 1) / 2, cy = (h - 1) * 0.6; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2)); p.px(x, y, face !== 'north' ? '#5a1408' : d < 0.35 ? '#ffc040' : d < 0.6 ? '#f07a20' : d < 0.85 ? '#b8301a' : '#5a1408'); } if (face === 'north') { for (let y = Math.round(h * 0.45); y < h - 2; y++) for (let x = Math.round(w * 0.55); x < w - 2; x++) p.px(x, y, '#f4f0e8'); p.px(Math.round(w * 0.3), Math.round(h * 0.5), '#d0d4dc'); p.px(Math.round(w * 0.3), Math.round(h * 0.7), '#d0d4dc'); } };
const neckP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'north' ? (y % 3 === 0 ? '#e8e0c8' : '#3a2416') : '#5a3a22'); };
const violinP = (p, w, h, face) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2)); p.px(x, y, face !== 'north' ? '#3a1a0c' : d < 0.45 ? '#e89a40' : d < 0.8 ? '#a8501c' : '#4a2010'); } if (face === 'north') p.px(Math.round(cx), Math.round(cy), '#16100c'); };
const harpP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' && y === 1 && x % 2 === 1 ? '#2a2a34' : y === 0 ? '#ffffff' : face === 'down' ? '#7a808c' : '#c8ccd6'); };
const wireP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, '#b8bcc8'); };
const lensP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = x === 0 || y === 0 || x === w - 1 || y === h - 1; p.px(x, y, face === 'south' && !e ? (x + y < 3 ? '#ffd0e8' : '#ff5aa8') : C.gold[e ? 2 : 1]); } };
const vinylP = (p, w, h, face) => { const c = (w - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - (h - 1) / 2); if (face !== 'up' && face !== 'down') { p.px(x, y, '#141418'); continue; } if (d > c + 0.4) continue; p.px(x, y, d < 1.2 ? '#ffd23e' : d < 2.4 ? '#e8202a' : (Math.round(d * 2) % 2 ? '#26262e' : '#141418')); } };
const strapP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? '#5a4a40' : (x + y) % 4 === 0 ? '#3a2a20' : '#2a1c14'); };
const mandP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.face[0] : face === 'south' ? '#2a1008' : band(C.face, face, x, y, h)); };

// ---------------------------------------------------------------- the model
const R = { hipX: 2.4, hipY: 5.8, ankleY: 1.4, L1: 2.2, L2: 2.2 };
// round amber bead eyes peeking from under the fringe: a shadowed top, a big glossy pupil, a warm glow below
const EYE_OPEN = [
  '...llll...',
  '.llIIIIll.',
  'liiiiiiiil',
  'liihhkiiil',
  'liiikkiiil',
  'liiikkiiil',
  'lccckkchcl',
  '.llccccll.',
  '...llll...',
];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.15, 15.5, 3.82], line: '#1a0c08', pupilColor: '#160804', iris: '#f0a020', irisDark: '#9a4a10', accent: '#ffd870',
  map: { open: EYE_OPEN, ...pixStates(EYE_OPEN) } });
const RIGHT = [
  { name: 'thighR', parent: 'root', pivot: [-2.4, 5.8, 0], cubes: [B(-3.4, 3.4, -1.0, -1.4, 6.4, 1.0, suitP)] },
  { name: 'shinR', parent: 'thighR', pivot: [-2.4, 3.6, 0], cubes: [B(-3.3, 1.2, -0.9, -1.5, 3.8, 0.9, suitP)] },
  { name: 'footR', parent: 'shinR', pivot: [-2.4, 1.4, 0], cubes: [
    B(-3.3, 0, -1.2, -1.5, 1.6, 1.6, handP), B(-3.2, 0, 1.6, -2.5, 0.8, 2.6, clawP), B(-2.3, 0, 1.6, -1.6, 0.8, 2.6, clawP),
    // dripped: pointed, Cuban-heeled Beatle boots
    B(-3.5, 0.5, -1.4, -1.3, 1.9, 1.8, bootP, { id: 'acc-boots', hide: true }), B(-3.0, 0, 1.6, -1.8, 1.0, 2.9, bootP, { id: 'acc-boots', hide: true }), B(-3.3, 0, -1.4, -1.5, 0.6, -0.4, heelP, { id: 'acc-boots', hide: true }),
  ] },
  { name: 'elytraR', parent: 'torso', pivot: [-0.1, 12.6, -2.6], cubes: [B(-5.0, 7.2, -4.6, -0.04, 12.8, -2.8, backP), B(-4.2, 12.8, -4.0, -0.04, 13.3, -1.4, backP)] },
  { name: 'armR', parent: 'torso', pivot: [-5.0, 11.8, 0.2], cubes: [B(-6.4, 9.4, -0.8, -4.6, 12.2, 1.2, sleeveP)] },
  { name: 'foreR', parent: 'armR', pivot: [-5.5, 9.6, 0.2], cubes: [B(-6.3, 7.8, -0.7, -4.7, 9.8, 1.1, sleeveP), B(-6.4, 7.4, -0.8, -4.6, 7.9, 1.2, cuffP)] },
  { name: 'handR', parent: 'foreR', pivot: [-5.5, 7.5, 0.2], cubes: [B(-6.3, 6.0, -0.8, -4.7, 7.5, 1.2, handP), B(-6.2, 5.2, 0.1, -5.5, 6.0, 1.0, clawP), B(-5.4, 5.2, 0.1, -4.8, 6.0, 1.0, clawP)] },
  // a little 45 for the record-spin fidget
  { name: 'vinylR', parent: 'handR', pivot: [-5.5, 5.2, 0.6], cubes: [B(-7.0, 5.1, -0.9, -4.0, 5.35, 2.1, vinylP, { id: 'vinyl', hide: true })] },
  { name: 'mandR', parent: 'head', pivot: [-1.6, 12.8, 4.6], cubes: [B(-2.4, 12.2, 4.4, -1.2, 13.2, 6.0, mandP), B(-1.6, 12.2, 5.6, -0.8, 12.9, 6.5, clawP)] },
];
export const def = {
  name: 'beatlet', ppu: 3, scale: 0.38, outline: { color: '#1e0f14', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'pelvis', parent: 'root', pivot: [0, 5.8, 0], cubes: [B(-4.2, 4.6, -3.4, 4.2, 7.6, 3.2, suitP)] },
    { name: 'torso', parent: 'pelvis', pivot: [0, 7.2, 0], cubes: [
      B(-4.8, 7.0, -3.6, 4.8, 12.8, 3.6, chestP), B(-5.3, 7.6, -3.0, 5.3, 12.2, 3.0, suitP),
      // normal: a pink satin band collar, gold-trimmed
      B(-5.0, 11.6, -3.8, 5.0, 12.9, 3.9, collarP, { id: 'acc-collar', hide: true }),
      // normal (or): a harmonica on a wire neck-rack
      B(-1.7, 11.7, 3.9, 1.7, 12.5, 4.6, harpP, { id: 'acc-harp', hide: true }),
      B(-1.9, 12.0, 0.2, -1.7, 12.3, 4.4, wireP, { id: 'acc-harp', hide: true }), B(1.7, 12.0, 0.2, 1.9, 12.3, 4.4, wireP, { id: 'acc-harp', hide: true }),
      // ultra: the guitar strap across the chest
      B(-4.6, 9.6, 3.62, 4.6, 10.3, 3.95, strapP, { pivot: [0, 9.95, 3.8], rot: [0, 0, -34], id: 'acc-12str', hide: true }),
      B(-4.6, 9.6, 3.62, 4.6, 10.3, 3.95, strapP, { pivot: [0, 9.95, 3.8], rot: [0, 0, -34], id: 'acc-violin', hide: true }),
    ] },
    // ultra dripped: a little sunburst 12-string with a cresting-wave body — or a violin bass — slung across its back
    { name: 'guitar', parent: 'torso', pivot: [0, 10, -4.8], rot: [0, 0, -36], cubes: [
      B(-1.9, 6.0, -6.0, 1.9, 9.4, -4.9, burstP, { id: 'acc-12str', hide: true }),
      B(-2.1, 8.8, -5.95, -0.7, 10.6, -4.95, burstP, { id: 'acc-12str', hide: true }), B(0.7, 9.0, -5.95, 1.9, 10.2, -4.95, burstP, { id: 'acc-12str', hide: true }),
      B(-0.35, 9.4, -5.8, 0.35, 15.2, -5.15, neckP, { id: 'acc-12str', hide: true }),
      B(-0.7, 15.2, -5.85, 0.7, 16.6, -5.1, burstP, { id: 'acc-12str', hide: true }),
      B(-1.8, 5.8, -6.0, 1.8, 8.0, -4.9, violinP, { id: 'acc-violin', hide: true }), B(-1.1, 8.0, -5.95, 1.1, 8.6, -4.95, violinP, { id: 'acc-violin', hide: true }),
      B(-1.5, 8.6, -6.0, 1.5, 10.2, -4.9, violinP, { id: 'acc-violin', hide: true }),
      B(-0.35, 10.2, -5.8, 0.35, 15.0, -5.15, neckP, { id: 'acc-violin', hide: true }),
      B(-0.6, 15.0, -5.85, 0.6, 16.4, -5.1, violinP, { id: 'acc-violin', hide: true }),
    ] },
    { name: 'head', parent: 'torso', pivot: [0, 12.8, 0.4], cubes: [
      B(-4.4, 12.4, -2.4, 4.4, 18.4, 3.8, faceP),
      B(-2.0, 12.2, 3.6, 2.0, 14.0, 5.0, faceP),                                                          // the clypeus: a beetle's muzzle plate
      B(-1.1, 12.45, 4.9, 1.1, 13.1, 5.15, (p, w, h) => p.rect(0, 0, w, h, '#0a0a0e'), { outline: false }), // the mouth slot between the mandibles
      // the mop-top: a round, glossy helmet of hair — a low dome over the crown, full over the ears,
      // down to the nape behind, and curtains framing the face; the fringe is its own bone
      B(-5.0, 15.2, -3.6, 5.0, 19.6, 3.4, mopP), B(-4.7, 19.6, -3.3, 4.7, 20.8, 3.1, mopP), B(-3.7, 20.8, -2.5, 3.7, 21.5, 2.3, mopP),
      B(-5.0, 12.8, -3.8, 5.0, 15.2, -0.4, mopP),
      B(-5.25, 13.0, -0.4, -4.0, 17.4, 4.1, mopP), B(4.0, 13.0, -0.4, 5.25, 17.4, 4.1, mopP, { mirror: true }),
      // dripped (or): pink round shades pushed up on the mop-top, sitting on the fringe
      B(-3.3, 19.3, 4.85, -0.7, 20.7, 5.4, lensP, { id: 'acc-shades', hide: true }), B(0.7, 19.3, 4.85, 3.3, 20.7, 5.4, lensP, { id: 'acc-shades', hide: true, mirror: true }),
      B(-0.7, 19.9, 4.95, 0.7, 20.2, 5.25, wireP, { id: 'acc-shades', hide: true }),
      B(-5.3, 19.9, -0.8, -5.1, 20.2, 5.1, wireP, { id: 'acc-shades', hide: true }), B(5.1, 19.9, -0.8, 5.3, 20.2, 5.1, wireP, { id: 'acc-shades', hide: true }),
    ] },
    { name: 'fringe', parent: 'head', pivot: [0, 20.0, 4.0], cubes: [B(-5.0, 17.0, 3.6, 5.0, 20.2, 4.85, fringeP2)] },
    { name: 'horn', parent: 'head', pivot: [0, 21.4, 0.9], rot: [-6, 0, 0], cubes: [B(-0.7, 21.2, 0.2, 0.7, 23.0, 1.6, hornP), B(-0.4, 23.0, 0.5, 0.4, 23.6, 1.3, hornP)] },
    { name: 'sprout', parent: 'horn', pivot: [0, 23.4, 0.9], cubes: [
      B(-0.3, 23.2, 0.6, 0.3, 25.2, 1.2, stemP, { outline: false }),
      B(-2.7, 24.8, 0.65, -0.1, 24.8, 1.15, leafP(C.leaf, C.leafLo), { plane: 'y', pivot: [-0.1, 24.8, 0.9], rot: [0, 0, -24], outline: false }),
      B(0.1, 25.0, 0.65, 2.5, 25.0, 1.15, leafP(C.leaf, C.leafLo), { plane: 'y', pivot: [0.1, 25.0, 0.9], rot: [0, 0, 28], outline: false }),
    ] },
    ...both(...RIGHT),
    ...EYES.bones,
  ],
};
def.drip = [
  [{ id: 'acc-collar', name: 'Satin band collar' }, { id: 'acc-harp', name: 'Harmonica neck-rack' }],
  [{ id: 'acc-boots', name: 'Cuban-heel Beatle boots' }, { id: 'acc-shades', name: 'Pink round shades' }],
  [{ id: 'acc-12str', name: 'Sunburst 12-string' }, { id: 'acc-violin', name: 'Violin bass' }],
];
// where bought gear sits (model units; size = the width of that part)
def.attach = {
  head: { bone: 'head', at: [0, 21.6, 0.2], size: 7.4 },
  face: { bone: 'head', at: [0, 15.7, 4.25], size: 8.8 },
  neck: { bone: 'torso', at: [0, 12.6, 3.7], size: 7 },
  back: { bone: 'torso', at: [0, 10.2, -4.7], size: 9 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 23.4, 1], MOUTHP = [0, 12.9, 6.2];
import { mand } from './beetle_parts.js';
const mouth = (P, m) => { const k = m === 'o' ? 22 : m === 'grin' ? 30 : m === 'flat' ? -4 : 6; P.rot('mandR', 0, -k, 0).rot('mandL', 0, k, 0); };
const shake = (P, t, k, hz = 3.4) => P.rot('head', 0, Math.sin(t * TAU * hz) * 24 * k, Math.sin(t * TAU * hz + 0.6) * 8 * k);
const croon = (P, t, bps = 2, k = 1) => { const b = (t * bps) % 1; mouth(P, k <= 0 ? 'smile' : b < 0.35 ? 'o' : 'smile'); };
const shared = sharedClips(R, {
  headTop: HEAD, weight: 0.1,
  downPose: (P, k, t) => { onBack(P, R, k, t, { lift: 3.2 }); P.rot('fringe', 30 * k, 0, 0); },
  sleepPose: (P, br) => { legs(P, R, { y: -2.4 + br * 0.15, fR: [0, 1.2], fL: [0, 1.2], spread: 6 }); P.rot('torso', 8 + br * 1.5, 0, 0).rot('head', 18 + br * 3, 0, 8).rot('sprout', 26, 0, 20); arms(P, { out: 8, fwd: 20, bend: 40 }); mouth(P, br > 0.7 ? 'o' : 'smile'); },
});
export const anim = {
  start: 'idle', seed: 9,
  breathe: { bone: 'torso', amp: 0.02, per: 2.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.11 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 6 },
  springs: [
    { bone: 'fringe', tip: [0, -2.4, 0.8], k: 210, d: 10, gain: 0.8, max: 26, axes: [1, 0.3, 0.6] },
    { bone: 'sprout', tip: [0, 2.4, 0], k: 140, d: 7, gain: 1, max: 30 },
  ],
  faces: { eyes: EYES.slot, prop: { default: 'off', states: { on: ['vinyl'], off: [] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'spin45', 'mopshake', 'strum'] },
  clips: {
    ...shared,
    // bopping on the beat: a bounce in the knees, a nodding head, a boot tapping, humming, eyes darting about
    idle: { len: 2.0, loop: true, f(P, t) {
      const b = bounce(t, 0.5, { squash: 0.07, stretch: 0.03 }), sway = Math.sin(t * TAU * 0.5), tap = bump(t % 1, 0.02, 0.3), S = t < 1 ? 'R' : 'L';
      legs(P, R, { y: -0.4 + b.u * 0.5, roll: sway * 3, ['f' + S]: [0.5 * tap, 0.4 * tap], ['toe' + S]: -20 * tap });
      P.sq('torso', b.sq).rot('head', 6 - b.u * 8, sway * 7, -sway * 6);
      arms(P, { out: 10 + b.u * 6, fwd: 6, bend: 30 + b.u * 10 });
      croon(P, t, 2); darts(P, t, 0.22, 1.0, 3);
      P.face('eyes', (t % 1) > 0.05 && (t % 1) < 0.28 ? 'happy' : undefined);
      P.burst(0.45, 'note', 'head', [3, 21, 3], { n: 1, dir: [0.4, 1, 0.2], speed: 0.8 }).burst(1.45, 'goldnote', 'head', [-3, 21, 3], { n: 1, dir: [-0.4, 1, 0.2], speed: 0.6 });
    } },
    // a bouncy toddle in its heeled boots
    walk: { len: 0.6, loop: true, f(P, t) {
      walkCycle(P, R, t, { len: 0.6, stride: 1.5, lift: 1.0, bob: 0.6, sway: 5, swing: 30, twist: 6, crouch: 0.4, lean: 4, out: 10, bend: 26 });
      P.rot('head', -4 + Math.sin(t / 0.6 * TAU * 2 - 0.6) * 5, 0, 0);
      croon(P, t, 3.3, 0.7);
      P.burst(0.1, 'note', 'head', [3, 21, 2], { n: 1, dir: [0.3, 1, -0.4], speed: 0.6 });
    } },
    // "yeah, yeah, yeah!": a hop with its arms flung up, three mop-top shakes, a burst of notes
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const crouch = bump(t, 0, 0.32), up = seg(t, 0.28, 0.42, E.back) * (1 - seg(t, 1.7, 1.95, E.inout)), air = Math.max(0, Math.sin(seg(t, 0.3, 0.62, E.lin) * Math.PI));
      const sh = seg(t, 0.62, 0.72) * (1 - seg(t, 1.3, 1.4));
      legs(P, R, { y: -1.4 * crouch + wob(t, 0.62, -0.8, 3, 6), pitch: -6 * up }); P.pos('root', 0, 3.2 * air, 0);
      P.sq('torso', -0.12 * crouch + 0.08 * air);
      arms(P, { out: 70 * up, fwd: 20 * up, bend: 30 * up });
      P.rot('head', 8 * crouch - 12 * up, 0, 0); shake(P, t, sh);
      emote(P, sh > 0.3 ? 'happy' : up > 0.3 ? 'wide' : crouch > 0.3 ? 'shut' : 'open', 1); mouth(P, up > 0.2 ? 'o' : 'smile'); P.blinkOK = false;
      for (const [i, t0] of [0.66, 0.9, 1.14].entries()) P.burst(t0, i % 2 ? 'goldnote' : 'note', 'head', [i % 2 ? 4 : -4, 21, 3], { n: 2, dir: [i % 2 ? 0.6 : -0.6, 1, 0.3], speed: 1.3 });
      P.burst(1.42, 'sparkle', 'head', HEAD, { n: 8, speed: 1.4 }).burst(0.62, 'dust', 'root', [0, 0.5, 0], { n: 6, spread: 1, speed: 1 });
    } },
    // horn bonk: rocks back on its heels, then hops forward head-first
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.24, E.out) * (1 - seg(t, 0.26, 0.34, E.in)), hit = seg(t, 0.3, 0.42, E.back) * (1 - seg(t, 0.56, 0.92, E.inout)), air = bump(t, 0.28, 0.46);
      legs(P, R, { y: -1.2 * back - 0.6 * hit, z: -1 * back, pitch: -14 * back + 26 * hit, fR: [0, 1.4 * hit], fL: [0, -0.8 * hit] });
      P.pos('root', 0, 1.6 * air, 4.4 * hit - 1.2 * back).sq('torso', -0.1 * back + 0.08 * air);
      P.rot('head', -16 * back + 20 * hit, 0, 0);
      arms(P, { out: 30 * back + 20 * hit, fwd: -30 * back - 20 * hit, bend: 50 });
      emote(P, back > 0.2 || hit > 0.2 ? 'angry' : 'open'); mouth(P, hit > 0.3 ? 'grin' : 'flat'); P.blinkOK = false;
      P.burst(0.42, 'spark', 'horn', [0, 24, 2], { n: 2 }).burst(0.42, 'star', 'horn', [0, 24, 2], { n: 3 }).burst(0.44, 'leaf', 'sprout', [0, 26, 1], { n: 5, speed: 1.4 });
    } },
    // harmony: a big breath, the wing cases flare and buzz, and a wave of song rolls out — rings of sound, notes, leaves
    special: { len: 2.4, next: 'idle', f(P, t) {
      const inhale = seg(t, 0, 0.45, E.inout) * (1 - seg(t, 0.5, 0.6, E.out)), sing = seg(t, 0.52, 0.66, E.back) * (1 - seg(t, 1.85, 2.2, E.inout)), buzz = sing * wave(t, 18) * 3;
      legs(P, R, { y: -0.6 * inhale + 0.3 * sing, pitch: -8 * inhale - 6 * sing });
      P.scl('torso', 1 + 0.08 * inhale, 1 + 0.04 * inhale, 1 + 0.08 * inhale).sq('torso', wave(t, 4) * 0.03 * sing);
      P.rot('head', -14 * inhale - 10 * sing + wave(t, 2, 1) * 4 * sing, wave(t, 1) * 8 * sing, 0);
      P.rot('elytraR', -10 * sing, -14 * sing, 24 * sing + buzz).rot('elytraL', -10 * sing, 14 * sing, -24 * sing - buzz);
      arms(P, { out: 40 * inhale + 70 * sing, fwd: 10, bend: 20 });
      emote(P, sing > 0.3 ? 'closed' : inhale > 0.3 ? 'wide' : 'open'); mouth(P, inhale > 0.3 || sing > 0.2 ? 'o' : 'smile'); P.blinkOK = false;
      if (sing > 0.5) {
        P.stream('soundring', 'head', MOUTHP, { rate: 7, dir: [0, 0.05, 1], tint: [0.8, 1, 0.7] });
        P.stream('note', 'head', MOUTHP, { rate: 12, dir: [0, 0.3, 1], speed: 2.2, spread: 0.35, key: 'n' }).stream('goldnote', 'head', MOUTHP, { rate: 9, dir: [0, 0.2, 1], speed: 2.4, spread: 0.3, key: 'g' });
        P.stream('leaf', 'torso', [0, 12, -4], { rate: 10, dir: [0, 1, -0.4], speed: 1.2, key: 'l' });
      }
      P.burst(0.62, 'ring', 'head', MOUTHP, { scale: 0.7, tint: [0.8, 1, 0.6] });
    } },
    // the big finish: a spinning hop, arms flung wide — then a deep, showbiz bow
    win: { len: 2.6, next: 'idle', f(P, t) {
      const air = Math.max(0, Math.sin(seg(t, 0.12, 0.62, E.lin) * Math.PI)), crouch = bump(t, 0, 0.14) + bump(t, 0.6, 0.76);
      const showy = seg(t, 0.12, 0.3, E.back) * (1 - seg(t, 1.0, 1.2, E.inout)), bow = seg(t, 1.2, 1.5, E.inout) * (1 - seg(t, 2.0, 2.35, E.back));
      legs(P, R, { y: -1.2 * crouch - 0.6 * bow, pitch: 30 * bow, fR: [0, 0.6 * bow], fL: [0, -0.6 * bow] });
      P.pos('root', 0, 3.6 * air, 0).rot('root', 0, 360 * seg(t, 0.14, 0.6, E.inout), 0).sq('torso', -0.1 * crouch + 0.06 * air);
      P.rot('head', 20 * bow, 0, wave(t, 3) * 6 * showy);
      arms(P, { out: 80 * showy + 10 * bow, fwd: 40 * bow, bend: 20 + 40 * bow });
      emote(P, showy > 0.3 || bow > 0.3 ? 'happy' : 'open'); mouth(P, showy > 0.3 ? 'grin' : 'smile'); P.blinkOK = false;
      P.burst(0.3, 'goldnote', 'head', HEAD, { n: 6, speed: 1.6, spread: 1 }).burst(0.3, 'note', 'head', HEAD, { n: 5, speed: 1.4, spread: 1 }).burst(1.5, 'leaf', 'sprout', [0, 26, 1], { n: 6, speed: 0.8 });
    } },
    // fidget: shakes its mop-top on a high "oooh"
    mopshake: { len: 1.6, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.2, E.back) * (1 - seg(t, 1.25, 1.6, E.inout));
      legs(P, R, { y: -0.6 * on + Math.abs(Math.sin(t * TAU * 3.4)) * 0.3 * on });
      P.rot('head', -12 * on, 0, 0); shake(P, t, on);
      arms(P, { out: 16 * on, fwd: 10 * on, bend: 60 * on });
      emote(P, on > 0.4 ? 'happy' : 'open', on); mouth(P, on > 0.3 ? 'o' : 'smile');
      for (const t0 of [0.3, 0.55, 0.8, 1.05]) P.burst(t0, t0 > 0.6 ? 'goldnote' : 'note', 'head', [0, 22, 2], { n: 1, speed: 1, spread: 0.9 });
    } },
    // fidget: air guitar — one hand on the neck, the other strumming
    strum: { len: 2.0, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.25, E.back) * (1 - seg(t, 1.7, 2.0, E.inout)), st = Math.abs(Math.sin(t * TAU * 3)) ** 2;
      legs(P, R, { y: -0.8 * on + 0.3 * st * on, roll: -5 * on, fL: [0, 0.8 * on] });
      P.rot('torso', 0, -14 * on, -6 * on).rot('head', -6 * on + 6 * st * on, -10 * on, 10 * on);
      arm(P, 'L', { out: 50 * on, fwd: 40 * on, bend: 40 * on, twist: 20 * on }); arm(P, 'R', { out: 20 * on, fwd: 30 * on, bend: 80 * on - 40 * st * on });
      emote(P, on > 0.5 ? 'closed' : 'open', on); croon(P, t, 3, on);
      for (const t0 of [0.4, 0.73, 1.06, 1.4]) P.burst(t0, 'goldnote', 'torso', [-3, 9, 5], { n: 1, dir: [0.3, 1, 0.5], speed: 1 });
    } },
    // the Twist: hips one way, shoulders the other, knees pumping down and up — a mop-top shake to finish, arms flung up
    dance: { len: 2.8, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.2, E.out) * (1 - seg(t, 2.45, 2.8, E.inout)), fin = seg(t, 2.05, 2.25, E.back) * (1 - seg(t, 2.5, 2.8)), tw = Math.sin(t * TAU * 1.25) * on * (1 - fin), dip = Math.abs(Math.sin(t * TAU * 1.25));
      legs(P, R, { y: -0.6 - 1.3 * dip * on * (1 - fin) + 0.4 * fin, yaw: 30 * tw, roll: 4 * tw, fR: [0, 0.6 * on], fL: [0, -0.4 * on] });
      P.rot('torso', 0, -38 * tw, 0).rot('head', -6 * fin, 12 * tw, 6 * tw); shake(P, t, bump(t, 1.45, 2.05));
      arms(P, { out: 26 * on + 60 * fin, fwd: 34 * on * (1 - fin), bend: 80 * on * (1 - fin) + 10 });
      P.rot('armR', 0, 0, 14 * tw).rot('armL', 0, 0, 14 * tw);
      emote(P, fin > 0.3 || bump(t, 1.45, 2.05) > 0.3 ? 'happy' : 'open', on); mouth(P, (t * 2.5) % 1 < 0.4 ? 'o' : 'smile'); P.blinkOK = false;
      for (const t0 of [0.4, 0.8, 1.2, 1.6]) P.burst(t0, t0 % 0.8 ? 'note' : 'goldnote', 'head', [3, 22, 2], { n: 1, dir: [0.5, 1, 0.2], speed: 1 });
      P.burst(2.1, 'sparkle', 'head', HEAD, { n: 10, speed: 1.4 }).burst(2.1, 'goldnote', 'head', HEAD, { n: 4, speed: 1.4, spread: 1 });
    } },
    // the 45: spins a little record on one claw like a ball, tosses it sky-high, nearly fumbles the catch… and nails it
    spin45: { len: 3.4, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 2.95, 3.3, E.inout)), cr = bump(t, 1.35, 1.6), air = t > 1.6 && t < 2.35 ? Math.sin(((t - 1.6) / 0.75) * Math.PI) : 0, catchK = wob(t, 2.35, 1, 3, 5);
      P.face('prop', t > 0.12 && t < 3.15 ? 'on' : 'off');
      legs(P, R, { y: -0.4 - 1.2 * cr + 0.5 * bump(t, 1.6, 1.8) - 0.8 * Math.max(0, catchK) * (t > 2.35 ? 1 : 0) });
      arm(P, 'R', { out: 14 * up, fwd: 40 * up, bend: 110 * up - 20 * cr + 16 * catchK, grip: -10 });
      arm(P, 'L', { out: 20 * up, fwd: 10, bend: 30 + 30 * bump(t, 2.3, 2.7) });
      P.rot('vinylR', 0, t * 1500, 0).pos('vinylR', 0, -9 * air, 0).rot('vinylR', 40 * air, 0, 0);
      P.rot('head', -18 * air - 6 * up, 10 * up, 0).pos('eyeR', 0, 0.3 * air, 0).pos('eyeL', 0, 0.3 * air, 0);
      emote(P, t > 2.3 && t < 2.55 ? 'shock' : t > 2.55 ? 'happy' : air > 0.3 ? 'wide' : 'open'); mouth(P, t > 2.55 ? 'grin' : air > 0.3 ? 'o' : 'smile'); P.blinkOK = false;
      P.burst(1.62, 'sparkle', 'handR', [-5.5, 5.2, 0.6], { n: 6, speed: 1 }).burst(2.36, 'star', 'handR', [-5.5, 5.2, 0.6], { n: 4 }).burst(2.6, 'goldnote', 'head', HEAD, { n: 4, speed: 1.3, spread: 1 }).burst(2.38, 'sweat', 'head', [4, 19, 2], { n: 2, dir: [1, 1, 0], speed: 1 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: a black-lacquer suit and shell, gold hair sheen and boots trim, amber eyes kept
// (the hair sheen and the suit piping turn gold: a black lacquer suit trimmed in gold)
def.dripForm = dripMap({ black: [[150, 300]], gold: [[300, 345]], greys: true, keep: ['#f0a020', '#9a4a10', '#ffd870'], swap: { [C.hairGl]: '#ffd23e', [C.pipe]: '#e0a030' } });

