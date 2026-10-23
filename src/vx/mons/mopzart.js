// Mopzart — an ancient, sleepy, sweet mop dog (a Mozart homage). A Komondor-like old dog
// whose white corded coat is dressed like a powdered periwig: a smooth powdered crown, two
// fat sausage curls at each side (they hang where its ears are, and bounce), and a queue
// tied with a black ribbon bow lying down its nape. It wears a crimson frock coat with gold
// braid over its shoulders, with coat-tails flapping over its rump, and its cords hang to
// the ground like lace. Heavy-lidded droopy eyes under bushy white brows, a big black nose,
// a mop beard. It conducts with its tail, dozes off mid-sentence and creaks up very slowly.
// Story clips: conduct (fidget), doze (fidget), creak (getting up), beg (sits up, paws together).
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { shade, gradient, layer, on, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance } from './eyes.js';
import { B, L, both, twin, acc, region, ell, cords, roll, velvet, goldP, chainP, strapP, stroke, formMap, beat, env, SPFX } from './story_parts.js';

const C = {
  mop: '#f2eee6', mopHi: '#ffffff', mopLo: '#cec6d6', mopDeep: '#9a8ea8', aged: '#e8dcc2',
  powder: '#f8f6f2', powderLo: '#dcd4e6', powderDot: '#c8bcd8',
  red: '#b02a3c', redHi: '#e0566a', redLo: '#6e1626', trim: '#f0c040', trimLo: '#a87418',
  nose: '#1e181e', noseHi: '#6a6070', mouth: '#4a1820', tongue: '#e87890', tongueLo: '#b84a62',
  paw: '#d8d0d0', pawLo: '#9a90a0', ribbon: '#1a1620', ribbonHi: '#4a4456',
  sock: '#ece6dc', ink: '#2a1a1c',
};

// ---------------------------------------------------------------- painters
const cordP = cords(C.mop, { hi: C.mopHi, lo: C.mopLo, deep: C.mopDeep, cw: 4 });
const fringeP = (seed) => cords(C.mop, { hi: C.mopHi, lo: C.aged, deep: C.mopDeep, ragged: 4, seed, cw: 4 });
const legP = cords(C.mop, { hi: C.mopHi, lo: C.aged, deep: C.mopDeep, ragged: 2, seed: 9, cw: 4 });
// powdered wig: smooth white with combed lines and a dusting of powder
const powderP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let col = f === 'up' ? C.powder : ramp([C.mopHi, C.powder, C.powderLo], y / Math.max(1, h - 1), x, y);
    if ((f === 'up' ? x + y * 3 : y * 2 + (x >> 2)) % 7 === 0) col = C.powderLo;
    if ((x * 7 + y * 11) % 23 === 0) col = C.powderDot;
    p.px(x, y, col);
  }
};
const rollP = roll(C.powder, { hi: C.mopHi, lo: C.powderLo, deep: C.mopDeep });
const rollX = roll(C.powder, { hi: C.mopHi, lo: C.powderLo, deep: C.mopDeep, axis: 'x' });
// the face: smooth powdered fur, corded cheeks hanging at the sides, droopy bushy white brows
const HEAD = { x0: -6.5, top: 23, w: 13, h: 12 };
const faceP = (p, w, h, f) => {
  cordP(p, w, h, f);
  const X = (mx) => (mx - HEAD.x0) * (w / HEAD.w), Y = (my) => (HEAD.top - my) * (h / HEAD.h);
  const side = (y) => w * 0.13 + Math.max(0, (y - h * 0.45) / h) * w * 0.25;
  region(p, w, h, (x, y) => x >= side(y) && x < w - side(y), (x, y) => ((x * 7 + y * 3) % 17 === 0 ? C.powderLo : ramp([C.mopHi, C.powder, C.powder], y / h, x, y)));
  for (let y = 0; y < h; y++) { const xs = Math.round(side(y)); p.px(xs, y, C.mopLo); p.px(w - 1 - xs, y, C.mopLo); }
  // droopy bushy brows: soft white tufts over each eye, the long hairs falling past the outer corner
  for (const s of [-1, 1]) {
    const cx = X(3 * s), y0 = Y(20.5);
    for (let k = -6; k <= 6; k++) {
      const out = s < 0 ? -k : k, x = Math.round(cx + k), droop = Math.max(0, out) * 0.5, len = 2 + (Math.abs(k) % 2);
      for (let j = 0; j < len; j++) p.px(x, Math.round(y0 - 1 + droop + j), j === len - 1 ? C.mopLo : C.mopHi);
    }
    p.px(Math.round(cx + 7 * (s < 0 ? -1 : 1)), Math.round(y0 + 3), C.mopLo);
  }
};
const noseP = (p, w, h, f) => { shade(C.nose, { top: '#3a343c', bottom: '#0e0a0e' })(p, w, h, f); if (f === 'south') { p.px(1, 1, C.noseHi).px(2, 1, '#9a92a2'); p.px(Math.floor(w / 2) - 2, h - 2, '#000000').px(Math.floor(w / 2) + 1, h - 2, '#000000'); } if (f === 'up') p.px(1, 1, C.noseHi); };
// the muzzle: short smooth fur, a philtrum line from the nose and a soft W of a mouth
const muzzleP = (p, w, h, f) => {
  if (f === 'down') { p.rect(0, 0, w, h, C.mouth); return; }
  powderP(p, w, h, f);
  if (f === 'south') { const cx = w / 2; for (let y = h - 5; y < h - 1; y++) p.px(Math.floor(cx), y, C.mopDeep); for (let x = 1; x < w - 1; x++) { const d = Math.abs(x + 0.5 - cx); p.px(x, Math.round(h - 2 + (d < 1 ? 0 : -Math.sin(Math.min(1, d / (w * 0.45)) * Math.PI) * 1.2)), C.mopDeep); } }
};
const jawP = (p, w, h, f) => { if (f === 'up') { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 2, C.tongue); return; } cordP(p, w, h, f); };
const tongueP = gradient([shift(C.tongue, 0.15), C.tongue, C.tongueLo]);
const pawP = (p, w, h, f) => { shade(C.paw, { top: shift(C.paw, 0.2), bottom: C.pawLo })(p, w, h, f); if (f === 'south') for (let x = 2; x < w - 1; x += 3) for (let y = 0; y < h; y++) p.px(x, y, C.pawLo); if (f === 'up') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x + y) % 2) p.px(x, y, C.mopLo); };
// the frock coat: crimson velvet, gold braid along its edges, gold buttons down the front
const coatP = velvet(C.red, { hi: C.redHi, lo: C.redLo });
const braid = (p, w, h, f, rows) => { for (const y of rows) for (let x = 0; x < w; x++) p.px(x, y, x % 3 === 0 ? C.trimLo : C.trim); };
const coatMain = (p, w, h, f) => {
  coatP(p, w, h, f);
  if (f === 'down') return;
  if (f === 'up') { for (let y = 0; y < h; y++) { p.px(0, y, C.trim); p.px(w - 1, y, C.trim); } for (let x = 0; x < w; x++) { p.px(x, 0, C.trim); p.px(x, h - 1, C.trim); } return; }
  braid(p, w, h, f, [h - 1, h - 2]);
  if (f === 'east' || f === 'west') { for (let y = 0; y < h; y++) { p.px(f === 'west' ? w - 1 : 0, y, C.trim); p.px(f === 'west' ? w - 2 : 1, y, C.trimLo); } for (let y = 2; y < h - 3; y += 4) { const x = f === 'west' ? w - 4 : 3; p.px(x, y, C.trim).px(x, y + 1, C.trimLo); } }
  if (f === 'east' || f === 'west') for (let y = 3; y < h - 4; y += 6) for (let x = Math.floor(w * 0.3); x < w * 0.62; x++) p.px(x, y, (x + y) % 2 ? C.trim : C.trimLo);   // frogging
};
const collarP = (p, w, h, f) => { coatP(p, w, h, f); if (f !== 'up' && f !== 'down') braid(p, w, h, f, [0, 1]); if (f === 'up') for (let x = 0; x < w; x++) p.px(x, 0, C.trim); };
const coatTailP = (p, w, h, f) => { coatP(p, w, h, f); if (f === 'up' || f === 'down') return; for (let y = 0; y < h; y++) { p.px(0, y, C.trim); p.px(w - 1, y, C.trim); } braid(p, w, h, f, [h - 1, h - 2]); if (f === 'north') { p.px(Math.floor(w / 2), 3, C.trim).px(Math.floor(w / 2), 4, C.trimLo); } };
const ribbonP = (p, w, h, f) => { shade(C.ribbon, { top: C.ribbonHi, bottom: '#0a080c' })(p, w, h, f); if (f === 'south' || f === 'north') p.px(1, 1, C.ribbonHi); };

// drip painters
const laceP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'up' ? C.mopHi : ramp([C.mopHi, C.powder, C.powderLo], y / Math.max(1, h - 1), x, y));
  if (f === 'up' || f === 'down') return;
  for (let x = 0; x < w; x++) { if (x % 3 === 1) p.px(x, h - 1, 0); else p.px(x, h - 1, C.powderLo); if ((x + 1) % 3 === 0) p.px(x, h - 2, C.powderDot); }
  for (let x = 1; x < w - 1; x += 2) p.px(x, 1, C.powderDot);
};
const keysP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 || y === h - 1 ? C.trim : x % 3 === 2 ? '#2a2630' : '#fbf8f0');
  if (f === 'south') for (let x = 2; x < w; x += 6) for (let y = 1; y < Math.ceil(h * 0.6); y++) { p.px(x, y, '#141018'); p.px(x + 1, y, '#141018'); }
};
const batonP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y > h * 0.72 ? (y % 2 ? C.trim : C.trimLo) : x === 0 ? '#ffffff' : '#ece8e0'); };
const quillP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = y / (h - 1), half = (w / 2) * Math.sin(Math.min(1, t * 1.15) * Math.PI) * (t > 0.85 ? 0.3 : 1), d = Math.abs(x + 0.5 - w / 2);
    if (d > half + 0.3) continue; p.px(x, y, d < 0.8 ? '#c8c0b0' : (x + y) % 4 === 0 ? C.powderLo : x < w / 2 ? C.mopHi : C.powder);
  }
};
const hatP = (p, w, h, f) => { shade('#22202a', { top: '#3c3846', bottom: '#100e14' })(p, w, h, f); if (f !== 'up' && f !== 'down') braid(p, w, h, f, [h - 1]); };
const brimP = (p, w, h, f) => { shade('#1a1820', { top: '#34303e', bottom: '#0c0a10' })(p, w, h, f); if (f !== 'down') { for (let x = 0; x < w; x++) { p.px(x, 0, C.trim); } } };
const plumeP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 3 === 0 ? C.powderLo : y < 2 ? C.mopHi : C.powder); };
const fluteP = (p, w, h, f) => { gradient(['#fff6c0', '#ffd84a', '#d89a22', '#8a5a10'])(p, w, h, f); if (f !== 'up' && f !== 'down') for (let x = 3; x < w - 2; x += 4) { p.px(x, 1, '#3a2408'); p.px(x + 1, 1, '#6a4410'); } };

// ---------------------------------------------------------------- the model
const LEG = [B([-5.6, 1.0, -1.6], [3.2, 6.0, 3.2], legP)];
const PAW = [B([-5.8, 0, -1.4], [3.6, 1.2, 3.8], pawP)];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.0, 18.2, 18.04], line: '#3a2228', iris: '#a8703c', irisDark: '#5a3418', accent: '#e8c8b4', pupilColor: '#140c0c', extra: ['smug', 'glint'], map: {
  open: [
    '............',
    '.....llllll.',
    '...lllIIIIll',
    '.llIIIIIIIIl',
    'lIIIIkkkkII.',
    '.iihhkkkkki.',
    '.iihkkkkkii.',
    '..iiikkkii..',
    '...cciiicc..',
    '............',
  ],
  wide: [
    '...llllll...',
    '.llwwwwwwll.',
    'lwwwIIIIwwwl',
    'lwwIIkkkIwwl',
    '.wIhhkkkkIw.',
    '.wihkkkkkiw.',
    '.wwiikkkiww.',
    '..wwiiiiww..',
    '...wsssssw..',
    '............',
  ],
  shock: [
    '...llllll...',
    '.llwwwwwwll.',
    'lwwwwwwwwwwl',
    'lwwwwwwwwwwl',
    '.wwwwkkwwww.',
    '.wwwwkkwwww.',
    '.wwwwwwwwww.',
    '..wwwwwwww..',
    '...wssssw...',
    '............',
  ],
} });
export const def = {
  name: 'mopzart', ppu: 3, scale: 0.4, outline: { color: '#2a2030', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // hind legs stand on the root; the body (and front legs, head) pivots at the hips
    ...twin({ name: 'hindR', parent: 'root', pivot: [-4, 7, -7.6], cubes: LEG.map((c) => ({ ...c, o: [c.o[0], c.o[1], -9.2] })) }),
    ...twin({ name: 'hpawR', parent: 'hindR', pivot: [-4, 0.6, -7.6], cubes: PAW.map((c) => ({ ...c, o: [c.o[0], c.o[1], -9.2] })) }),
    { name: 'body', parent: 'root', pivot: [0, 7, -8], cubes: [
      B([-7, 5, -11.4], [14, 11.4, 20.4], cordP),
      B([-6.4, 16.2, -10.6], [12.8, 0.8, 18.8], cordP),
      // the frock coat over the shoulders and back, its standing collar behind the head
      B([-7.8, 9.4, -3.6], [15.6, 7.8, 13.0], coatMain),
      B([-7.0, 15.6, 3.8], [14.0, 2.6, 3.4], collarP),
      // dripped: the lace jabot cascading down the chest
      ...acc('acc-jabot', [B([-2.6, 8.6, 9.0], [5.2, 2.6, 1.6], laceP), B([-2.2, 6.4, 9.4], [4.4, 2.6, 1.4], laceP), B([-1.6, 4.4, 9.8], [3.2, 2.4, 1.2], laceP)]),
      // or a gold collar of harpsichord keys
      ...acc('acc-keys', [B([-5.4, 9.2, 9.2], [10.8, 1.8, 0.8], keysP), ...both(B([-7.4, 10.6, 3.0], [1.0, 1.8, 6.4], keysP))]),
      // the magic flute slung across the back on a ribbon
      ...acc('acc-flute', [B([-8.4, 17.4, -6.4], [16.8, 1.0, 1.0], fluteP, { pivot: [0, 17.9, -5.9], rot: [0, 0, -14] }), B([-7.9, 9.2, -0.6], [15.8, 0.6, 0.6], strapP('#1a1620'), { pivot: [0, 13, 0], rot: [0, 0, 0] })]),
    ] },
    ...twin({ name: 'legR', parent: 'body', pivot: [-4, 7, 5.4], cubes: LEG.map((c) => ({ ...c, o: [c.o[0], c.o[1], 3.8] })) }),
    ...twin({ name: 'pawR', parent: 'legR', pivot: [-4, 0.6, 5.4], cubes: PAW.map((c) => ({ ...c, o: [c.o[0], c.o[1], 3.8] })) }),
    // the cord skirts that hang to the ground (they swing)
    ...twin({ name: 'skirtR', parent: 'body', pivot: [-7, 9.6, -1], cubes: [B([-7.7, 1.6, -10.8], [1.2, 8.4, 19.2], fringeP(3))] }),
    { name: 'bib', parent: 'body', pivot: [0, 9, 9], cubes: [B([-5.8, 2.0, 8.4], [11.6, 7.6, 1.4], fringeP(5))] },
    { name: 'rump', parent: 'body', pivot: [0, 9.4, -11.4], cubes: [B([-6.6, 2.2, -12.4], [13.2, 8.0, 1.4], fringeP(7))] },
    // the coat-tails, flapping over the rump either side of its tail
    ...twin({ name: 'tailsR', parent: 'body', pivot: [-3.8, 16.6, -3.6], cubes: [B([-7.0, 16.0, -11.8], [5.2, 0.6, 8.2], coatTailP), B([-7.0, 9.0, -12.6], [5.2, 7.6, 0.8], coatTailP)] }),
    // the tail: hangs low, curls up at the end — a conductor's baton
    { name: 'tail1', parent: 'body', pivot: [0, 13, -11.8], rot: [18, 0, 0], cubes: [B([-1.3, 7.0, -13.0], [2.6, 6.2, 2.4], cordP)] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 7.4, -11.8], rot: [26, 0, 0], cubes: [B([-1.1, 3.0, -12.8], [2.2, 4.8, 2.0], cordP)] },
    { name: 'tail3', parent: 'tail2', pivot: [0, 3.4, -11.8], rot: [40, 0, 0], cubes: [
      B([-1.5, 0.2, -13.2], [3.0, 3.4, 2.8], fringeP(11)),
      ...acc('acc-baton', [B([-0.3, -5.6, -12.1], [0.6, 6.0, 0.6], batonP), B([-1.6, 1.4, -13.4], [3.2, 0.8, 3.2], ribbonP)]),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 14.5, 8.5], cubes: [
      B([-6.5, 11, 7], [13, 12, 11], cordP, { faces: { south: faceP } }),
      B([-6.4, 22.6, 7.0], [12.8, 1.8, 11.0], powderP),
      B([-5.2, 24.4, 8.2], [10.4, 0.8, 8.6], powderP),
      B([-5.6, 22.0, 16.4], [11.2, 2.6, 2.6], rollX),
      B([-3.2, 12.4, 18], [6.4, 4.4, 3.4], muzzleP),
      B([-1.4, 15.0, 20.8], [2.8, 2.0, 1.4], noseP),
      // the quill tucked into the wig (tier 2)
      ...acc('acc-quill', [B([5.8, 21.6, 9.4], [0, 8.4, 3.0], quillP, { plane: 'x', pivot: [6.4, 21.6, 11], rot: [-30, 0, -18] })]),
      // the tricorn (tier 3): black with gold braid and a white plume
      ...acc('acc-tricorn', [
        B([-6.4, 25.0, 7.2], [12.8, 2.6, 10.4], hatP), B([-8.0, 24.6, 6.0], [16.0, 1.0, 12.8], brimP),
        B([-7.6, 25.2, 16.0], [15.2, 1.8, 1.0], brimP, { pivot: [0, 25.2, 16.5], rot: [-30, 0, 0] }),
        ...both(B([-8.2, 25.2, 6.4], [1.0, 1.8, 11.4], brimP, { pivot: [-8.0, 25.2, 12], rot: [0, 0, 28] })),
        B([2.4, 26.6, 9.0], [0, 4.4, 6.0], plumeP, { plane: 'x', pivot: [2.4, 26.6, 12], rot: [-24, 0, 0] }),
      ]),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 12.8, 18.2], cubes: [B([-2.6, 11.0, 17.8], [5.2, 1.6, 3.4], jawP)] },
    { name: 'tongue', parent: 'jaw', pivot: [0.6, 12.4, 20.6], rot: [10, 14, 0], cubes: [B([-0.2, 12.0, 20.4], [1.6, 0.5, 2.2], tongueP, { id: 'tongue', hide: true })] },
    { name: 'beard', parent: 'jaw', pivot: [0, 11.6, 19.2], cubes: [B([-3.2, 8.4, 18.0], [6.4, 3.4, 3.4], fringeP(13))] },
    // the periwig's sausage curls, hanging where its ears are
    ...twin({ name: 'rollR', parent: 'head', pivot: [-6.6, 21.0, 12.6], cubes: [B([-9.4, 19.0, 8.2], [3.0, 3.0, 9.0], rollP), B([-9.2, 15.8, 8.6], [3.0, 3.0, 8.2], rollP), B([-8.4, 12.4, 9.4], [2.0, 3.4, 6.6], fringeP(17))] }),
    // the queue: a cord ponytail tied with a black ribbon bow, lying down the nape
    { name: 'queue', parent: 'head', pivot: [0, 21, 6.8], rot: [56, 0, 0], cubes: [
      B([-1.3, 13.4, 5.4], [2.6, 7.6, 2.6], cordP),
      B([-0.9, 18.6, 5.0], [1.8, 1.8, 3.4], ribbonP),
      ...both(B([-3.6, 18.4, 5.6], [2.6, 2.2, 1.0], ribbonP, { pivot: [-1.0, 19.4, 6.0], rot: [0, 0, -18] })),
      ...both(B([-1.4, 15.0, 5.3], [0.7, 3.6, 0.5], ribbonP, { pivot: [-1, 18.6, 5.5], rot: [0, 0, 12] })),
    ] },
  ],
  drip: [
    [{ id: 'acc-jabot', name: 'Lace jabot' }, { id: 'acc-keys', name: 'Harpsichord-key collar' }],
    [{ id: 'acc-baton', name: 'Conductor\'s baton' }, { id: 'acc-quill', name: 'Quill in the wig' }],
    [{ id: 'acc-tricorn', name: 'Gold-braid tricorn' }, { id: 'acc-flute', name: 'The magic flute' }],
  ],
  attach: {
    head: { bone: 'head', at: [0, 25, 12], size: 12 },
    face: { bone: 'head', at: [0, 18.4, 18.2], size: 12 },
    neck: { bone: 'body', at: [0, 10, 9.4], size: 11 },
    back: { bone: 'body', at: [0, 16.8, -4], size: 12 },
  },
};
// the luxury form: the coat turns black lacquer with gold braid, the powdered wig stays white
def.dripForm = { map: formMap(({ h, s, l }) => (s < 0.14 || (h > 240 && h < 300 && s < 0.3) || (l > 0.75 && s < 0.6) ? 'keep' : h < 75 && s > 0.6 && l > 0.45 ? 'gold' : undefined)), fx: { note: SPFX.goldnote } };

// ---------------------------------------------------------------- animation
const LEGS = ['legR', 'legL', 'hindR', 'hindL'], NOSE = [0, 16.2, 22.6], TOP = [0, 26, 12], TAIL_TIP = [0, 0.6, -11.8];
// lying on its belly, front paws forward, chin down
function lie(P, k) {
  P.pos('body', 0, -4.6 * k, 0).pos('hindR', 0, -4.6 * k, 0).pos('hindL', 0, -4.6 * k, 0);
  P.rot('legR', -82 * k, 0, 0).rot('legL', -82 * k, 0, 0).rot('pawR', 82 * k).rot('pawL', 82 * k).rot('hindR', 78 * k, 0, 0).rot('hindL', 78 * k, 0, 0).rot('hpawR', -78 * k).rot('hpawL', -78 * k);
  P.rot('head', 16 * k, 0, 0).pos('head', 0, -0.6 * k, 0.4 * k).rot('tail1', 50 * k, 0, 0);
  P.rot('skirtR', 0, 0, -40 * k).rot('skirtL', 0, 0, 40 * k).rot('bib', -60 * k).rot('rump', 50 * k);
}
// sitting up on its haunches (begging)
function sitUp(P, k) {
  P.rot('body', -62 * k, 0, 0).pos('body', 0, -2.4 * k, -1.2 * k).rot('head', 52 * k, 0, 0);
  P.pos('hindR', 0, -2.6 * k, 0).pos('hindL', 0, -2.6 * k, 0).rot('hindR', -70 * k, 0, 0).rot('hindL', -70 * k, 0, 0).rot('hpawR', 70 * k).rot('hpawL', 70 * k);
  P.rot('legR', 36 * k, 0, 14 * k).rot('legL', 36 * k, 0, -14 * k);
  P.rot('rump', 50 * k).rot('bib', 40 * k).rot('tail1', 80 * k, 0, 0);
}
// a little 4-legged walk cycle: diagonal pairs, ph 0..1
function steps(P, ph, amp = 1) {
  const s = Math.sin(ph * Math.PI * 2), lift = (v) => Math.max(0, v) * 1.0 * amp;
  P.rot('legR', -18 * s * amp).rot('hindL', -18 * s * amp).rot('legL', 18 * s * amp).rot('hindR', 18 * s * amp);
  P.pos('legR', 0, lift(s), 0).pos('hindL', 0, lift(s), 0).pos('legL', 0, lift(-s), 0).pos('hindR', 0, lift(-s), 0);
}
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.025, per: 3.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.2], dur: 0.2 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 2.5 },
  springs: [
    { bone: 'rollR', tip: [0, -4, 0], k: 150, d: 7, gain: 0.8, max: 18, axes: [1, 0.2, 1] },
    { bone: 'rollL', tip: [0, -4, 0], k: 150, d: 7, gain: 0.8, max: 18, axes: [1, 0.2, 1] },
    { bone: 'queue', tip: [0, -6, 0], k: 130, d: 7, gain: 0.8, max: 16 },
    { bone: 'skirtR', tip: [0, -6, 0], k: 120, d: 6, gain: 0.9, max: 14, axes: [1, 0, 1] },
    { bone: 'skirtL', tip: [0, -6, 0], k: 120, d: 6, gain: 0.9, max: 14, axes: [1, 0, 1] },
    { bone: 'bib', tip: [0, -6, 0], k: 130, d: 6, gain: 0.9, max: 16, axes: [1, 0, 1] },
    { bone: 'rump', tip: [0, -6, 0], k: 130, d: 6, gain: 0.9, max: 16, axes: [1, 0, 1] },
    { bone: 'beard', tip: [0, -3, 0], k: 150, d: 7, gain: 0.9, max: 16 },
    { bone: 'tailsR', tip: [0, -6, -6], k: 140, d: 7, gain: 0.7, max: 14, axes: [1, 0, 1] },
    { bone: 'tailsL', tip: [0, -6, -6], k: 140, d: 7, gain: 0.7, max: 14, axes: [1, 0, 1] },
    { bone: 'tail2', tip: [0, -4, 0], k: 120, d: 6, gain: 0.8, max: 20 },
    { bone: 'tail3', tip: [0, -3, 0], k: 110, d: 6, gain: 0.9, max: 24 },
  ],
  faces: {
    eyes: EYES.slot,
    tongue: { default: 'in', states: { in: [], out: ['tongue'] } },
  },
  fidget: { every: [4, 8], clips: ['dance', 'dance', 'conduct', 'doze'] },
  clips: {
    // an old dog's idle: slow, deep breaths, a sway, a slow look round; some loops it nearly drifts off
    idle: { len: 3.2, loop: true, f(P, t, c) {
      const br = Math.sin((t / 3.2) * Math.PI * 2), m = c.loopN % 3;
      P.pos('body', 0, br * 0.25, 0).rot('body', 0, 0, wave(t, 0.3125) * 1.5).rot('head', 3 + br * 2, wave(t, 0.3125) * 8, wave(t, 0.3125, 1) * 3);
      P.rot('tail1', wave(t, 0.625) * 4, wave(t, 0.3125) * 10, 0);
      eyesAt(P, ...glance(t + c.loopN, [[0, 0], [-0.3, 0], [0, 0], [0.3, 0]], 0.8));
      if (m === 2) { const nod = env(t, 1.0, 2.6, 0.6, 0.15); P.rot('head', 10 * nod, 0, 4 * nod); P.face('eyes', nod > 0.7 ? 'closed' : nod > 0.25 ? 'sleepy' : t > 2.55 && t < 2.9 ? 'wide' : undefined); }
    } },
    // a slow, shuffling old-dog walk, the cords swaying
    walk: { len: 1.2, loop: true, f(P, t) {
      const ph = t / 1.2, s = Math.sin(ph * Math.PI * 4);
      steps(P, ph);
      P.pos('body', 0, Math.abs(s) * 0.4, 0).rot('body', 0, Math.sin(ph * Math.PI * 2) * 3, Math.sin(ph * Math.PI * 2) * 2).rot('head', 4 - Math.abs(s) * 2, -Math.sin(ph * Math.PI * 2) * 4, 0);
      P.rot('tail1', 0, Math.sin(ph * Math.PI * 2) * 12, 0);
    } },
    // a stately aria-howl: the head lifts, the voice soars… and cracks into a cough
    cry: { len: 2.2, next: 'idle', f(P, t) {
      P.lookW = 1 - env(t, 0.2, 2.0);
      const draw = seg(t, 0, 0.4, E.inout) * (1 - seg(t, 0.4, 0.55)), sing = seg(t, 0.45, 0.7, E.back) * (1 - seg(t, 1.45, 1.6)), cough = t > 1.5 && t < 2.0 ? Math.abs(Math.sin((t - 1.5) * Math.PI * 4)) : 0;
      P.scl('body', 1 + 0.06 * draw, 1 + 0.04 * draw, 1).rot('head', -6 * draw - 34 * sing + wave(t, 5) * 3 * sing + 12 * cough, 0, wave(t, 2) * 4 * sing).rot('jaw', 6 * draw + 32 * sing + 18 * cough);
      P.rot('body', -6 * sing, 0, 0).rot('tail1', 50 * sing, 0, 0);
      P.face('eyes', draw > 0.3 ? 'closed' : sing > 0.3 ? 'happy' : cough > 0.2 ? 'shut' : t > 2.0 ? 'sleepy' : undefined); P.blinkOK = false;
      if (sing > 0.4) P.stream('note', 'head', [0, 18, 22], { rate: 9, dir: [0, 0.8, 0.6], speed: 1.4, spread: 0.6 });
      P.burst(0.55, 'ring', 'head', NOSE, { scale: 0.8, tint: [1, 0.95, 0.85] }).burst(1.55, 'dust', 'head', [0, 13, 22], { n: 3, speed: 0.5 }).burst(1.7, 'sweat', 'head', [6, 21, 14], {});
    } },
    // physical: a wig-whip headbutt — wind up, swing, the queue and the curls whipping round
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.32, 0.44, E.in3) * (1 - seg(t, 0.55, 0.95, E.inout));
      P.pos('root', 0, 0, -1.6 * bk + 5 * hit).rot('head', -16 * bk + 20 * hit, 30 * bk - 34 * hit, 10 * bk - 12 * hit).rot('body', 4 * bk - 6 * hit, 8 * bk - 10 * hit, 0);
      steps(P, t * 2, 0.6 * hit);
      P.face('eyes', bk > 0.3 ? 'angry' : hit > 0.3 ? 'shut' : undefined); P.blinkOK = false;
      P.burst(0.44, 'spark', 'head', [0, 18, 24], {}).burst(0.44, 'star', 'head', [0, 18, 24], { n: 4 }).burst(0.46, 'dust', 'root', [0, 0, 6], { n: 4 });
    } },
    // special (sound): it conducts a whole orchestra — the tail-baton slashes and the notes pour out
    special: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const up = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 1.8, 2.15, E.inout)), b = beat(t, 0.25, 0.4);
      P.rot('tail1', 125 * up, 0, 0).rot('tail2', -20 * up + 26 * b.pulse * up, 20 * Math.sin(t * 12) * up, 0).rot('tail3', 30 * b.pulse * up, 0, 0);
      P.rot('head', -10 * up + 6 * b.pulse * up, 0, Math.sin(t * Math.PI * 2) * 6 * up).rot('jaw', 14 * up).pos('root', 0, 0, 0.6 * b.pulse * up);
      P.face('eyes', up > 0.4 ? (t > 1.4 ? 'wide' : 'closed') : undefined);
      if (t > 0.45 && t < 1.8) { P.stream('note', 'head', [0, 18, 22], { rate: 22, dir: [0, 0.15, 1], speed: 3.2, spread: 0.4 }); P.stream('note', 'tail3', TAIL_TIP, { rate: 6, spread: 1, speed: 1 }); }
      for (const r0 of [0.6, 1.0, 1.4]) P.burst(r0, 'ring', 'head', NOSE, { scale: 0.9, tint: [1, 0.92, 0.7] });
      P.burst(1.85, 'sparkle', 'head', TOP, { n: 6 });
    } },
    hurt: { len: 0.75, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.25, 0.75, E.inout));
      P.pos('root', 0, 0, -2.2 * k).rot('body', -8 * k, 0, wave(t, 12) * 3 * k).rot('head', -16 * k, 0, 8 * k).rot('jaw', 24 * k).sq('body', -0.1 * k);
      P.face('eyes', t < 0.45 ? 'shock' : 'sad'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 14, 10], {}).burst(0.04, 'dust', 'body', [0, 12, 0], { n: 5 }).burst(0.1, 'sweat', 'head', [-6, 22, 14], { n: 2 });
    } },
    // an old dog's faint: wobbly legs, a long sigh, then it lies flat with its tongue out
    faint: { len: 2.4, next: 'down', f(P, t) {
      const wob1 = seg(t, 0, 0.3) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.5, E.bounce);
      P.rot('body', 0, 0, wave(t, 1.8) * 6 * wob1).rot('head', 0, wave(t, 1.8) * 10 * wob1, wave(t, 1.8, 1) * 10 * wob1).pos('body', 0, -0.8 * wob1, 0);
      lie(P, fall); P.rot('head', 8 * fall, 0, 26 * fall).pos('head', 0, -1.2 * fall, 0);
      P.face('eyes', 'swirl').face('tongue', fall > 0.5 ? 'out' : 'in'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.9, 'star', 'head', TOP, { n: 5 }).burst(1.45, 'dust', 'root', [0, 0, 0], { n: 10, spread: 1 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      lie(P, 1); P.rot('head', 8, 0, 26).pos('head', 0, -1.2, 0); P.face('eyes', 'swirl').face('tongue', 'out'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('tail3', 0, 20 * bump(t, 1.2, 1.5), 0);
    } },
    // victory: the composer's bow — a deep play-bow, a flourish of the tail, then chin up
    win: { len: 2.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const bow = env(t, 0.15, 1.3, 0.35, 0.3), pride = seg(t, 1.3, 1.5, E.back);
      P.rot('body', 14 * bow, 0, 0).pos('body', 0, -1.4 * bow, 0).rot('legR', -30 * bow).rot('legL', -30 * bow).rot('head', 18 * bow - 14 * pride, 0, 0);
      P.rot('tail1', 120 * seg(t, 0.4, 0.8, E.back) * (1 - seg(t, 1.8, 2.3)), 0, 0).rot('tail2', 0, 40 * Math.sin(t * 9) * bow, 0);
      P.face('eyes', bow > 0.4 ? 'closed' : pride > 0.4 ? 'smug' : undefined).rot('jaw', 10 * pride);
      P.burst(0.6, 'note', 'tail3', TAIL_TIP, { n: 2 }).burst(1.35, 'sparkle', 'head', TOP, { n: 7 }).burst(1.4, 'heart', 'head', [5, 24, 14], {});
    } },
    // asleep: flat on its belly, chin on its paws, the tip of its tongue out, snoring
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * Math.PI * 2);
      lie(P, 1); P.pos('body', 0, br * 0.25, 0).sq('body', br * 0.03);
      P.face('eyes', 'closed').face('tongue', 'out'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.rot('jaw', 3 + Math.max(0, br) * 3).rot('rollR', 0, 0, 6).rot('rollL', 0, 0, -6);
      P.burst(0.5, 'z', 'head', [4, 24, 14], {}).burst(2.2, 'z', 'head', [4, 24, 14], {});
    } },
    // the dance: a minuet in 3/4 — a dip on every first beat, a side step, the tail keeping time, a bow
    dance: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const per = 0.3, n = Math.floor(t / per), first = n % 3 === 0, b = beat(t, per), live = 1 - seg(t, 2.4, 2.55), bar = Math.floor(n / 3), side = bar % 2 ? 1 : -1;
      const dip = first ? b.pulse : 0;
      P.pos('body', side * 0.8 * b.pulse * live, -0.8 * dip * live, 0).rot('body', 4 * dip * live, side * 8 * live, side * 3 * live);
      steps(P, t / (per * 3), 0.7 * live);
      P.rot('head', -4 * dip * live, -side * 12 * live, side * 10 * live).rot('tail1', 110 * live, 0, 0).rot('tail2', 0, 30 * Math.sin(t * Math.PI * 2 / (per * 3)) * live, 0);
      const bow = env(t, 2.45, 3.0, 0.15, 0.3);
      P.rot('body', 12 * bow, 0, 0).rot('legR', -26 * bow).rot('head', 16 * bow, 0, 0);
      P.face('eyes', bow > 0.3 ? 'closed' : first && b.ph < 0.5 ? 'happy' : 'sleepy');
      P.burst(0.05, 'note', 'tail3', TAIL_TIP, {}).burst(0.95, 'note', 'tail3', TAIL_TIP, {}).burst(1.85, 'note', 'tail3', TAIL_TIP, {}).burst(2.6, 'sparkle', 'head', TOP, { n: 5 });
    } },
    // fidget: it conducts with its tail — down, left, right, up — eyes shut in bliss, notes floating up
    conduct: { len: 3.4, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const up = env(t, 0.1, 3.2, 0.4, 0.4), per = 0.6, ph = ((t - 0.5) / per) % 1, n = Math.floor((t - 0.5) / per);
      const pat = [[0, -1], [-1, 0], [1, 0], [0, 1]], cur = pat[((n % 4) + 4) % 4], nx = pat[(((n + 1) % 4) + 4) % 4], u = E.inout(Math.min(1, ph * 1.6));
      const bx = (cur[0] + (nx[0] - cur[0]) * u) * (t > 0.5 && t < 2.9 ? 1 : 0), by = (cur[1] + (nx[1] - cur[1]) * u) * (t > 0.5 && t < 2.9 ? 1 : 0);
      const fl = env(t, 2.75, 3.2, 0.08, 0.3);
      P.rot('tail1', (115 + 18 * by) * up, 26 * bx * up, 0).rot('tail2', -10 * up + 30 * fl, 18 * bx * up, 0).rot('tail3', 20 * by * up - 30 * fl, 0, 0);
      P.rot('head', -6 * up, -bx * 8 * up, bx * 8 * up).rot('body', 0, -bx * 3 * up, 0).pos('body', 0, 0.3 * by * up, 0);
      P.face('eyes', up > 0.5 ? (fl > 0.4 ? 'wide' : 'closed') : undefined).rot('jaw', 6 * up);
      for (const t0 of [0.6, 1.2, 1.8, 2.4]) P.burst(t0, 'note', 'tail3', TAIL_TIP, { n: 1, speed: 0.8 });
      P.burst(2.85, 'sparkle', 'tail3', TAIL_TIP, { n: 5 });
    } },
    // fidget: it dozes off standing up — the head sinks in stages… a snore… a snort, and it's awake
    doze: { len: 3.8, next: 'idle', f(P, t) {
      P.lookW = 0; P.blinkOK = false;
      const sink = key([[0, 0], [0.5, 0.35, 'inout'], [0.8, 0.3], [1.4, 0.7, 'inout'], [1.7, 0.62], [2.5, 1, 'inout'], [2.75, 1], [2.85, -0.25, 'out'], [3.3, 0, 'inout']], t);
      P.rot('head', 24 * sink, 0, 8 * Math.max(0, sink)).pos('body', 0, -0.6 * Math.max(0, sink), 0).rot('rollR', 0, 0, 8 * Math.max(0, sink)).rot('rollL', 0, 0, -8 * Math.max(0, sink));
      const snort = bump(t, 2.75, 3.0);
      P.sq('body', 0.08 * snort).rot('jaw', 4 * Math.max(0, sink) + 10 * snort);
      eyesAt(P, ...(t > 3.0 ? glance(t, [[-0.3, 0], [0.3, 0], [0, 0]], 0.2) : [0, 0]));
      P.face('eyes', t > 2.75 && t < 3.05 ? 'shock' : t > 3.05 ? 'wide' : sink > 0.75 ? 'closed' : sink > 0.3 ? 'sleepy' : undefined).face('tongue', sink > 0.8 && t < 2.75 ? 'out' : 'in');
      P.burst(1.9, 'z', 'head', [4, 24, 14], {}).burst(2.4, 'z', 'head', [4, 24, 14], {}).burst(2.76, 'steam', 'head', NOSE, { n: 5, dir: [0, 0.2, 1], speed: 1 }).burst(2.78, 'sweat', 'head', [6, 23, 14], {});
    } },
    // story: it creaks up from lying down — front legs, a pause, back legs, a long stretch, a shake
    creak: { len: 3.8, next: 'idle', f(P, t) {
      P.lookW = 0; P.blinkOK = false;
      const front = seg(t, 0.3, 1.1, E.inout), back = seg(t, 1.5, 2.3, E.inout), k = 1 - back;
      lie(P, k);
      P.rot('legR', 82 * front * k).rot('legL', 82 * front * k).rot('pawR', -82 * front * k).rot('pawL', -82 * front * k).rot('body', -14 * front * k, 0, 0).pos('body', 0, 2.2 * front * k, 0).rot('head', -18 * front * k, 0, 0);
      const stretch = env(t, 2.35, 3.0, 0.25, 0.25), shake = t > 3.0 && t < 3.6 ? Math.sin((t - 3.0) * Math.PI * 2 * 4) * (1 - seg(t, 3.0, 3.6)) : 0;
      P.rot('body', 10 * stretch, 0, 0).rot('legR', -24 * stretch).rot('legL', -24 * stretch).rot('head', -12 * stretch, 0, 0).rot('jaw', 30 * stretch).rot('tail1', 70 * stretch, 0, 0);
      P.rot('head', 0, 0, 18 * shake).rot('body', 0, 0, 5 * shake);
      P.face('eyes', t < 0.3 ? 'closed' : t < 1.3 ? 'sleepy' : t < 1.55 ? 'shut' : stretch > 0.3 ? 'closed' : t > 3.6 ? 'happy' : 'sleepy').face('tongue', stretch > 0.4 ? 'out' : 'in');
      for (const c0 of [0.7, 1.12, 1.9, 2.45]) P.burst(c0, 'star', 'body', [0, 9, c0 < 1.5 ? 6 : -8], { n: 2, speed: 0.6, scale: 0.6 });
      P.burst(1.15, 'sweat', 'head', [6, 22, 14], {}).burst(3.05, 'dust', 'body', [0, 14, 0], { n: 8, spread: 1 }).burst(3.1, 'steam', 'head', TOP, { n: 4 });
    } },
    // story: it sits up on its haunches, paws together, and begs — big eyes, tongue out, paws patting
    beg: { len: 3.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const k = seg(t, 0.1, 0.7, E.back) * (1 - seg(t, 2.7, 3.2, E.inout)), pat = Math.sin(t * Math.PI * 2 * 2.5) * k;
      sitUp(P, k);
      P.rot('legR', 10 * pat, 0, 6 * pat).rot('legL', 10 * pat, 0, -6 * pat).rot('head', 0, 0, 10 * Math.sin(t * 1.6) * k).rot('tail1', 0, 30 * Math.sin(t * 10) * k, 0);
      eyesScale(P, 1 + 0.08 * k, 1 + 0.12 * k);
      P.face('eyes', k > 0.5 ? (t > 1.6 && t < 2.1 ? 'teary' : 'wide') : undefined).face('tongue', k > 0.6 ? 'out' : 'in');
      P.burst(1.2, 'heart', 'head', [0, 25, 14], {}).burst(2.0, 'heart', 'head', [3, 25, 14], {});
    } },
  },
};
def.anim = anim;
