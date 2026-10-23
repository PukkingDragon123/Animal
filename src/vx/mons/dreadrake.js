// Dreadrake — the street punk's partner and the bully of the story (a Kendrick Lamar homage).
// A big, muscle-bound mallard drake built like a middleweight: an iridescent green head with long
// dark dreadlocks falling round it, the drake's white neck ring worn like the collar of a plain
// white tee, a puffed chestnut chest with pecs that bounce, grey flanks, heavy wing-arms with the
// mallard's blue speculum bar and "knuckle" primaries he cracks, orange legs, big webbed feet and
// the drake's black tail curl. Compton-cool: a slow cocky bounce, an intense heavy-lidded stare.
// Story clips: flex (double biceps), menace (looms, cracks his knuckle-feathers), wet (soaked by a
// water bubble, sputtering, dreads dripping).
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { shade, feathers, fluff, gradient, layer, on, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance } from './eyes.js';
import { B, L, both, twin, acc, region, ell, knit, rib, cloth, goldP, chainP, silverP, strapP, formMap, fromHsl, plant, beat, env, SPFX } from './story_parts.js';

const C = {
  green: '#1e8a4a', greenHi: '#52d08a', greenLo: '#0c4628', sheen: '#3a72d8',
  ring: '#f6f6f2', ringLo: '#c8c8d0',
  chest: '#8a3a22', chestHi: '#c4643a', chestLo: '#521a12',
  flank: '#aeb0b8', flankHi: '#d8dae0', flankLo: '#7a7c88', verm: '#8a8c98',
  back: '#6e6052', backHi: '#9a8a78', backLo: '#463a30',
  wing: '#8a7a6a', wingHi: '#b0a090', wingLo: '#5a4c40', spec: '#4a3ae0', specHi: '#8a7aff',
  prim: '#4a4038', primLo: '#2a2420',
  bill: '#e8c83a', billHi: '#fff08a', billLo: '#a8902a', nail: '#2a2418', mouth: '#4a1a1a',
  leg: '#f08a2a', legHi: '#ffb05a', legLo: '#b0581a',
  dread: '#2e2218', dreadHi: '#5e4632', dreadLo: '#16100c', tip: '#8a6a48',
  tail: '#e8e8ec', curl: '#141418',
  red: '#d81e2a', redHi: '#ff5a4a', redLo: '#8a0e18', blue: '#2a56b8', blueLo: '#163a80',
};

// ---------------------------------------------------------------- painters
// the iridescent head: green with blue-violet sheen streaks catching the light
const greenP = (p, w, h, f) => {
  shade(C.green, { top: C.greenHi, bottom: C.greenLo })(p, w, h, f);
  if (f === 'down') return;
  if (f === 'up') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x + y) % 7 < 2) p.px(x, y, '#2aa898'); return; }
  // iridescence: a teal sheen band high up and a blue-violet streak across the middle
  const y0 = Math.round(h * 0.16), y1 = Math.round(h * 0.84);
  for (let x = 0; x < w; x++) { p.px(x, y0, '#2aa898'); p.px(x, y0 + 1, (x % 2) ? '#2aa898' : C.green); const yy = y1 + Math.round(Math.sin(x * 0.5)); p.px(x, yy, C.sheen); if (x % 3 === 0) p.px(x, yy + 1, shift(C.sheen, -0.2)); }
};
const ringP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'down' ? C.ringLo : y === h - 1 ? C.ringLo : (x * 3 + y) % 11 === 0 ? '#e4e4ea' : C.ring); };
const chestP = feathers(C.chest, { top: C.chestHi, bottom: C.chestLo, size: 6 });
// pecs: a lit upper slab, a dark cleavage line at the inner edge and a shadow under
const pecP = (p, w, h, f) => {
  chestP(p, w, h, f);
  if (f !== 'south') return;
  for (let y = 0; y < h; y++) { p.px(w - 1, y, C.chestLo); p.px(w - 2, y, shift(C.chestLo, 0.1)); }
  for (let x = 0; x < w; x++) { p.px(x, h - 1, shift(C.chestLo, -0.2)); p.px(x, h - 2, C.chestLo); if (x < w - 3) p.px(x, 1, C.chestHi); }
};
const flankP = (p, w, h, f) => {
  shade(C.flank, { top: C.flankHi, bottom: C.flankLo })(p, w, h, f);
  if (f === 'up' || f === 'down') return;
  for (let y = 2; y < h; y += 3) for (let x = 0; x < w; x++) if (Math.sin(x * 0.9 + y) > 0.35) p.px(x, y, C.verm);   // fine vermiculation
};
const backP = feathers(C.back, { top: C.backHi, bottom: C.backLo, size: 6 });
const wingP = feathers(C.wing, { top: C.wingHi, bottom: C.wingLo, size: 5 });
// forearm: the blue speculum bar with white and black borders on the outside
const foreP = layer(wingP, on(['west', 'north', 'south'], (p, w, h, f) => {
  const y0 = Math.round(h * 0.4), y1 = Math.round(h * 0.72);
  for (let y = y0 - 2; y <= y1 + 2; y++) for (let x = 0; x < w; x++) p.px(x, y, y === y0 - 2 || y === y1 + 2 ? '#ffffff' : y === y0 - 1 || y === y1 + 1 ? '#141418' : ramp([C.specHi, C.spec, shift(C.spec, -0.3)], (y - y0) / (y1 - y0), x, y));
}));
const primP = (p, w, h, f) => { shade(C.prim, { top: shift(C.prim, 0.2), bottom: C.primLo })(p, w, h, f); if (f === 'south' || f === 'east' || f === 'west') for (let x = 1; x < w; x += 3) for (let y = 0; y < h; y++) p.px(x, y, C.primLo); };
const knuckleP = gradient([shift(C.prim, 0.25), C.prim, C.primLo]);
const tailP = (p, w, h, f) => { shade(C.tail, { top: '#ffffff', bottom: '#a8a8b0' })(p, w, h, f); if (f !== 'up' && f !== 'down') for (let x = 0; x < w; x += 3) p.px(x, h - 2, '#5a5a66'); };
const curlP = shade(C.curl, { top: '#3a3a48', bottom: '#060608' });
const billP = (p, w, h, f) => {
  if (f === 'down') { p.rect(0, 0, w, h, C.mouth); return; }
  gradient([C.billHi, C.bill, C.billLo])(p, w, h, f);
  if (f === 'up') { for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, C.billHi); p.px(Math.floor(w / 2) - 2, h - 3, C.nail).px(Math.floor(w / 2) + 1, h - 3, C.nail); }
  if (f === 'east' || f === 'west' || f === 'south') for (let x = 0; x < w; x++) p.px(x, h - 1, C.billLo);
};
const jawP = (p, w, h, f) => { if (f === 'up') { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 2, '#d8606a'); return; } gradient([C.bill, C.billLo, shift(C.billLo, -0.2)])(p, w, h, f); };
const legP = (p, w, h, f) => { gradient([C.legHi, C.leg, C.legLo])(p, w, h, f); if (f !== 'up' && f !== 'down') for (let y = 2; y < h; y += 3) for (let x = 0; x < w; x++) p.px(x, y, shift(C.leg, -0.15)); };
const webP = (p, w, h, f) => { gradient([C.legHi, C.leg, C.legLo])(p, w, h, f); if (f === 'up') for (const fx of [0.18, 0.5, 0.82]) for (let y = Math.floor(h * 0.3); y < h; y++) p.px(Math.round(w * fx), y, C.legLo); if (f === 'south') for (const fx of [0.18, 0.5, 0.82]) p.px(Math.round(w * fx), Math.floor(h / 2), C.nail); };
// a dreadlock: dark twisted rope with wraps every few texels and sun-lightened tips
const dreadP = (tip) => (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = ramp([C.dreadHi, C.dread, C.dreadLo], f === 'up' ? 0 : f === 'down' ? 1 : x / Math.max(1, w - 1), x, y);
    if ((y + x * 2) % 4 === 0) c = shift(c, 0.14);
    if (y % 6 === 5) c = shift(c, -0.2);
    if (tip && y >= h - 3 && f !== 'up') c = y === h - 1 ? C.tip : shift(C.tip, -0.15);
    p.px(x, y, c);
  }
};
const scalpP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x % 3 === 0 || (y + x) % 5 === 0) ? C.dreadLo : (x + y) % 4 === 0 ? C.dreadHi : C.dread); };
// drip painters
const bandanaP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, ramp([shift(C.blue, 0.15), C.blue, C.blueLo], y / Math.max(1, h - 1), x, y)); if (f === 'up' || f === 'down') return; for (let x = 1; x < w; x += 4) { p.px(x, 1, '#ffffff'); p.px(x + 1, 1, '#ffffff'); p.px(x + 2, 2, '#ffffff'); if (h > 3) p.px(x + 2, 3, '#c8d8ff'); } };
const hoodieP = (p, w, h, f) => { cloth(C.red, { hi: C.redHi, lo: C.redLo, folds: 9 })(p, w, h, f); if (f !== 'up' && f !== 'down') { for (let x = 0; x < w; x++) for (let y = h - 3; y < h; y++) p.px(x, y, x % 2 ? C.redLo : shift(C.red, -0.15)); } };
const hoodieFront = (p, w, h, f) => {
  hoodieP(p, w, h, f);
  const cx = w / 2, y0 = Math.round(h * 0.55), y1 = h - 4;
  for (let y = y0; y < y1; y++) for (let x = Math.round(cx - w * 0.28 + (y - y0) * -0.2); x < cx + w * 0.28 + (y - y0) * 0.2; x++) p.px(x, y, y === y0 ? C.redLo : shift(C.red, -0.06));    // kangaroo pocket
  for (const dx of [-3, 3]) for (let y = 0; y < Math.round(h * 0.3); y++) p.px(Math.round(cx + dx), y, y % 3 === 2 ? '#f0f0f0' : '#d8d8e0');   // drawstrings
};
const shoeP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'down' ? '#c8c8c8' : y >= h - 2 ? (y === h - 1 ? '#e8e8e8' : C.blue) : f === 'up' ? (x % 3 === 1 && y > h * 0.3 ? '#d8d8e0' : '#fafaf8') : ramp(['#ffffff', '#f2f2ee', '#d8d8d4'], y / h, x, y));
  if (f === 'east' || f === 'west') for (let x = Math.round(w * 0.25); x < w * 0.8; x++) { const y = Math.round(h * 0.3 + (x - w * 0.25) * 0.12); p.px(x, y, C.red); p.px(x, y + 1, C.red); p.px(x, y + 2, C.redLo); }   // a plain red side stripe (no swoosh)
  if (f === 'south') for (let x = 0; x < w; x++) p.px(x, 1, '#e8e8e4');
};
const thornP = (p, w, h, f) => { gradient(['#fff2b0', '#e8b830', '#a87418', '#6a4410'])(p, w, h, f); if (f !== 'up' && f !== 'down') for (let x = 1; x < w; x += 3) p.px(x, Math.floor(h / 2), '#5a3a0a'); };
const roseP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2) / (w / 2), a = Math.atan2(y + 0.5 - h / 2, x + 0.5 - w / 2); p.px(x, y, f === 'down' ? '#3a6a2a' : d < 0.35 ? '#5a0a14' : Math.sin(a * 3 + d * 6) > 0.3 ? '#e8283a' : '#a8101e'); } };
const boomP = (p, w, h, f) => {
  shade('#2a2830', { top: '#4a4652', bottom: '#141218' })(p, w, h, f);
  if (f !== 'north' && f !== 'south') return;
  for (const cx of [w * 0.22, w * 0.78]) region(p, w, h, ell(cx, h * 0.55, w * 0.17, h * 0.36), (x, y) => (Math.hypot(x + 0.5 - cx, y + 0.5 - h * 0.55) < w * 0.06 ? '#c8ccd8' : (x + y) % 2 ? '#18161c' : '#2e2c34'), '#d8dce8');
  p.rect(Math.round(w * 0.38), Math.round(h * 0.3), Math.round(w * 0.24), Math.round(h * 0.22), '#7ad8ff');
  for (let x = Math.round(w * 0.38); x < w * 0.62; x += 2) p.px(x, Math.round(h * 0.7), '#e8b830');
};
const medalP = (p, w, h, f) => { goldP(p, w, h, f); if (f === 'south') region(p, w, h, ell(w / 2, h / 2, w * 0.22, h * 0.22), '#d8142a', '#ffd84a'); };

// ---------------------------------------------------------------- the model
// dreadlocks: [x, z, splay (z rot), lean back (x rot), upper length, lower length]
const DREADS = [[-5.6, 3.0, -14, -4, 4.8, 4.4], [-5.8, 0.2, -16, 6, 5.8, 5.4], [-5.4, -2.8, -14, 14, 6.4, 6.0], [-2.6, -4.6, -6, 20, 7.0, 6.6]];
const dreadBones = [];
const mkDread = (n, x, z, sz, sx, l1, l2, side) => {
  const top = 39.4;
  dreadBones.push({ name: n + 'a', parent: 'head', pivot: [x, top, z], rot: [sx, 0, sz * side], cubes: [B([x - 1.0, top - l1, z - 1.0], [2.0, l1 + 0.6, 2.0], dreadP(false))] });
  dreadBones.push({ name: n + 'b', parent: n + 'a', pivot: [x, top - l1, z], rot: [6, 0, 0], cubes: [B([x - 0.9, top - l1 - l2, z - 0.9], [1.8, l2 + 0.4, 1.8], dreadP(true))] });
};
DREADS.forEach(([x, z, sz, sx, l1, l2], i) => { mkDread('dr' + i + 'R', x, z, sz, sx, l1, l2, 1); mkDread('dr' + i + 'L', -x, z, -sz, sx, l1, l2, 1); });
mkDread('drC', 0, -5.0, 0, 22, 7.4, 7.0, 1);
const FOOT = [B([-6.4, 0, -1.4], [4.8, 1.2, 6.2], webP)];
const SHOE = acc('acc-kicks', [B([-6.8, 0, -1.8], [5.6, 2.6, 7.0], shoeP), B([-6.0, 2.4, -1.4], [4.0, 1.0, 3.6], shoeP)]);
const ARM = [
  B([-13.0, 18.2, -2.6], [4.2, 7.8, 5.2], wingP),
  B([-12.6, 19.6, 2.2], [3.4, 4.8, 1.2], wingP),                 // the bicep
  B([-13.6, 22.2, -3.0], [5.0, 3.8, 6.0], wingP),
  ...acc('acc-hoodie', [B([-13.4, 17.8, -3.0], [5.0, 8.6, 6.4], hoodieP)]),
];
const FORE = [B([-12.8, 11.2, -2.2], [3.8, 7.6, 4.4], foreP), ...acc('acc-hoodie', [B([-13.2, 11.4, -2.6], [4.6, 7.2, 5.2], hoodieP)])];
const HAND = [B([-12.6, 7.4, -1.8], [3.4, 4.0, 3.8], primP)];
const FINGERS = [-12.4, -11.3, -10.2].map((x) => B([x, 7.6, 1.6], [0.9, 2.8, 1.0], knuckleP));
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.2, 35.0, 5.64], line: '#140c0a', iris: '#d8862a', irisDark: '#6a2a0e', accent: '#ffc860', extra: ['smug', 'glint'], map: { open: [
  'll..........',
  'lllllll.....',
  '.lIIIIllllll',
  '.lIIkkkIIIIl',
  '..lhkkkkiiil',
  '..liikkkiil.',
  '...lcciiccl.',
  '....lllll...',
] } });
const THORNS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i / 8) * Math.PI * 2, x = Math.sin(a) * 5.4, z = 0.6 + Math.cos(a) * 5.0; return B([x - 0.3, 39.6, z - 0.3], [0.6, 1.8, 0.6], thornP, { pivot: [x, 39.6, z], rot: [Math.cos(a) * 24, 0, -Math.sin(a) * 24] }); });
export const def = {
  name: 'dreadrake', ppu: 3, scale: 0.5, outline: { color: '#120a0c', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'footR', parent: 'root', pivot: [-4, 1, 1], cubes: [...FOOT, ...SHOE] }),
    ...twin({ name: 'legR', parent: 'root', pivot: [-4, 12.6, 0], cubes: [B([-6.4, 7.8, -2.4], [4.8, 5.2, 4.8], flankP), B([-4.9, 1.0, -0.9], [1.8, 7.4, 1.8], legP)] }),
    { name: 'body', parent: 'root', pivot: [0, 12, 0], cubes: [
      B([-8, 11, -7], [16, 8.4, 13], flankP),
      B([-9, 18, -5.6], [18, 9, 12.4], chestP),
      B([-8.4, 17.6, -8.4], [16.8, 8.8, 3.0], backP),
      B([-7.0, 10.4, -6.0], [14, 0.8, 11], shade(C.flankLo)),
      B([-5.2, 26.4, -3.6], [10.4, 1.6, 8.4], ringP),
      // the hoodie (tier 2): DAMN-red, a kangaroo pocket, drawstrings, the hood bunched behind the neck
      ...acc('acc-hoodie', [B([-9.6, 10.4, -9.0], [19.2, 17.0, 17.8], hoodieP, { faces: { south: hoodieFront } }), B([-5.8, 25.6, -9.4], [11.6, 4.6, 4.4], hoodieP)]),
      // the gold rope chain (tier 1) with a chunky medallion
      ...acc('acc-chain', [...both(B([-6.0, 22.4, 8.6], [5.6, 0.9, 0.8], chainP, { pivot: [-6.0, 22.85, 9.0], rot: [0, 0, 36] })), B([-1.8, 17.6, 9.0], [3.6, 3.6, 0.9], medalP)]),
      // the boombox (tier 3) slung on the back
      ...acc('acc-boombox', [B([-6.4, 14.4, -13.2], [12.8, 7.2, 3.6], boomP), B([-4.0, 21.6, -12.2], [8.0, 0.8, 1.2], silverP), B([-9.2, 20.4, 8.6], [18.4, 0.8, 0.5], strapP('#141218'), { pivot: [0, 20.8, 8.8], rot: [0, 0, -30] })]),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 13, -7.4], cubes: [
      B([-4.2, 11, -11.2], [8.4, 4.0, 4.4], tailP),
      B([-0.8, 14.4, -11.6], [1.6, 3.4, 1.6], curlP, { pivot: [0, 14.4, -10.8], rot: [-30, 0, 0] }),
      B([-0.7, 17.2, -12.8], [1.4, 1.4, 2.4], curlP, { pivot: [0, 17.6, -11.4], rot: [-30, 0, 0] }),
    ] },
    ...twin({ name: 'pecR', parent: 'body', pivot: [-4.3, 22.4, 6.6], cubes: [B([-8.6, 19.2, 5.8], [8.4, 6.6, 2.6], pecP)] }),
    ...twin({ name: 'armR', parent: 'body', pivot: [-9.8, 25.4, 0], cubes: ARM }),
    ...twin({ name: 'foreR', parent: 'armR', pivot: [-10.9, 18.4, 0], cubes: FORE }),
    ...twin({ name: 'handR', parent: 'foreR', pivot: [-10.9, 11.4, 0.2], cubes: HAND }),
    ...twin({ name: 'fingR', parent: 'handR', pivot: [-11.3, 10.2, 2.0], cubes: FINGERS }),
    { name: 'neck', parent: 'body', pivot: [0, 27, 0], cubes: [B([-4.4, 27, -3.2], [8.8, 3.8, 7.6], greenP)] },
    { name: 'head', parent: 'neck', pivot: [0, 30.4, 0.4], cubes: [
      B([-5.6, 30, -4.6], [11.2, 9.2, 10.2], greenP),
      B([-5.8, 38.8, -4.9], [11.6, 1.4, 10.0], scalpP),
      B([-3.0, 31.0, 5.4], [6.0, 2.4, 6.6], billP),
      B([-1.0, 33.2, 10.6], [2.0, 0.5, 1.2], shade('#5a5020')),
      // the bandana (tier 1): a blue headband tied over the dread roots, its tails at the back
      ...acc('acc-bandana', [B([-5.9, 37.0, -4.9], [11.8, 1.6, 10.8], bandanaP)]),
      // the thorn crown (tier 3): a gold thorn-vine circlet with three small red roses
      ...acc('acc-crown', [...THORNS, ...[[-4.6, 2.4], [0, 5.6], [4.6, 2.4]].map(([x, z]) => B([x - 0.9, 39.4, z - 0.9], [1.8, 1.4, 1.8], roseP)), B([-5.6, 39.2, -4.4], [11.2, 0.8, 10.0], thornP)]),
    ] },
    { name: 'knot', parent: 'head', pivot: [0, 37.8, -4.9], cubes: acc('acc-bandana', [B([-1.0, 37.0, -5.8], [2.0, 1.6, 1.0], bandanaP), B([-1.6, 33.6, -5.6], [1.2, 3.6, 0.5], bandanaP, { pivot: [-1, 37, -5.4], rot: [0, 0, -10] }), B([0.4, 33.4, -5.6], [1.2, 3.8, 0.5], bandanaP, { pivot: [1, 37, -5.4], rot: [0, 0, 12] })]) },
    { name: 'jaw', parent: 'head', pivot: [0, 31.2, 5.8], cubes: [B([-2.7, 30.0, 5.6], [5.4, 1.2, 5.8], jawP)] },
    ...EYES.bones,
    ...dreadBones,
  ],
  drip: [
    [{ id: 'acc-chain', name: 'Gold rope chain' }, { id: 'acc-bandana', name: 'Blue bandana' }],
    [{ id: 'acc-hoodie', name: 'Red hoodie' }, { id: 'acc-kicks', name: 'Cortez-style kicks' }],
    [{ id: 'acc-crown', name: 'Gold thorn crown' }, { id: 'acc-boombox', name: 'Chrome boombox' }],
  ],
  attach: {
    head: { bone: 'head', at: [0, 40, 0], size: 12 },
    face: { bone: 'head', at: [0, 35, 5.8], size: 12 },
    neck: { bone: 'body', at: [0, 26, 7], size: 12 },
    back: { bone: 'body', at: [0, 19, -8.6], size: 13 },
  },
};
// the luxury form: chest and hoodie black lacquer, the bill and legs gold, the green head deep black-emerald
def.dripForm = {
  map: formMap(({ h, s, l }, glow, hex) => (s < 0.14 ? 'keep' : hex === C.sheen || hex === '#2aa898' ? '#c89a2a' : h >= 90 && h < 170 ? fromHsl(152, 0.45, 0.05 + l * 0.24) : h >= 170 && h < 290 && s > 0.5 ? 'gold' : h >= 20 && h < 75 && s > 0.55 && l > 0.45 ? 'gold' : undefined)),
  fx: { note: SPFX.goldnote },
};

// ---------------------------------------------------------------- animation
const LEG = 11.6, LEGS = ['legR', 'legL'], MOUTH = [0, 31, 12.4], TOP = [0, 41, 0];
const DR = dreadBones.map((b) => b.name);
const arms = (P, sh, el, side = 1) => {        // sh: [x, y, z] shoulder, el: [x, y, z] elbow (right arm; left mirrored)
  P.rot('armR', sh[0], sh[1], sh[2]).rot('armL', sh[0], -sh[1], -sh[2]).rot('foreR', el[0], el[1], el[2]).rot('foreL', el[0], -el[1], -el[2]);
};
function fallBack(P, k) {
  P.rot('root', -84 * k, 0, 0).pos('root', 0, 7.4 * k, -2 * k);
  P.rot('legR', -40 * k, 0, 10 * k).rot('legL', -30 * k, 0, -10 * k).rot('footR', -30 * k).rot('footL', -20 * k);
  P.rot('armR', 0, 0, -70 * k).rot('armL', 0, 0, 70 * k).rot('head', 20 * k, 0, 20 * k).rot('jaw', 30 * k);
}
export const anim = {
  start: 'idle', seed: 31,
  breathe: { bone: 'body', amp: 0.018, per: 2.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.2], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 6 },
  springs: [
    ...DR.map((n) => ({ bone: n, tip: [0, -6, 0], k: n.endsWith('b') ? 90 : 130, d: n.endsWith('b') ? 5 : 7, gain: n.endsWith('b') ? 1.2 : 0.9, max: n.endsWith('b') ? 34 : 22, axes: [1, 0.2, 1] })),
    { bone: 'pecR', tip: [-2, -2, 1], k: 260, d: 8, gain: 0.4, max: 6, axes: [1, 0, 0] },
    { bone: 'pecL', tip: [2, -2, 1], k: 260, d: 8, gain: 0.4, max: 6, axes: [1, 0, 0] },
    { bone: 'tail', tip: [0, 2, -4], k: 170, d: 8, gain: 0.7, max: 14 },
    { bone: 'knot', tip: [0, -3, -1], k: 120, d: 6, gain: 1, max: 26 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'flex', 'menace'] },
  clips: {
    // Compton-cool: a slow two-step bounce on the knees, head nodding on the beat, shoulders rolling
    idle: { len: 2.0, loop: true, f(P, t, c) {
      const b = beat(t, 0.5), dy = -0.6 * b.pulse, side = b.n % 2 ? 1 : -1;
      P.pos('body', 0, dy, 0).rot('body', 0, side * 3, side * 2).sq('body', -0.02 * b.pulse); plant(P, LEGS, dy, LEG);
      P.rot('neck', 6 * b.pulse, 0, 0).rot('head', -4 + 4 * b.pulse, side * 6, -side * 3);
      arms(P, [4 * b.pulse, 0, -12 - 3 * b.pulse], [-14, 0, 0]);
      P.rot('handR', 0, 0, 0).rot('fingR', 40).rot('fingL', 40);
      eyesAt(P, ...glance(t + c.loopN * 1.1, [[0, 0], [0.3, 0], [0, 0], [-0.3, 0.05]], 0.5));
      if (c.loopN % 3 === 2) { const k = env(t, 0.9, 1.6, 0.1, 0.2); P.rot('pecR', -10 * k * bump(t, 0.9, 1.2)).rot('pecL', -10 * k * bump(t, 1.2, 1.5)); P.face('eyes', 'smug'); }
    } },
    // the strut: chest out, shoulders swinging, head bobbing forward-back like a cocky duck
    walk: { len: 0.8, loop: true, f(P, t) {
      const ph = (t / 0.8) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph), dy = Math.abs(c2) * 0.8, lr = Math.max(0, s), ll = Math.max(0, -s);
      P.pos('body', 0, dy - 0.4, 0).rot('body', -3, s * 10, s * 4); plant(P, LEGS, dy - 0.4, LEG);
      P.pos('footR', 0, lr * 2.4, s * 3).rot('footR', -24 * lr, 0, 0).pos('footL', 0, ll * 2.4, -s * 3).rot('footL', -24 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.6, s * 2.2).pos('legL', 0, ll * 1.6, -s * 2.2);
      P.pos('neck', 0, 0, Math.sin(ph * 2) * 1.2).rot('head', 2, -s * 8, 0);
      P.rot('armR', s * 24, 0, -10).rot('armL', -s * 24, 0, 10).rot('foreR', -16, 0, 0).rot('foreL', -16, 0, 0).rot('fingR', 40).rot('fingL', 40);
    } },
    // battle cry: a pound of the chest, then a huge QUACK at the sky
    cry: { len: 2.0, next: 'idle', f(P, t) {
      P.lookW = 1 - env(t, 0.1, 1.8);
      const pound = Math.max(bump(t, 0.15, 0.32), bump(t, 0.4, 0.57)), up = seg(t, 0.62, 0.8, E.back) * (1 - seg(t, 1.5, 1.85, E.inout));
      P.rot('armR', -60 * (1 - up) * env(t, 0, 0.62, 0.1, 0.1), 0, 30 * env(t, 0, 0.62, 0.1, 0.1)).rot('foreR', -90 * env(t, 0, 0.62, 0.1, 0.1) + 30 * pound, 0, 0).sq('body', -0.04 * pound);
      P.rot('pecR', -12 * pound).rot('pecL', -12 * pound);
      P.rot('body', -10 * up, 0, 0).rot('neck', -14 * up).rot('head', -24 * up + wave(t, 10) * 3 * up, 0, 0).rot('jaw', 48 * up);
      arms(P, [0, 0, -50 * up], [-30 * up, 0, 0]);
      P.face('eyes', up > 0.3 ? 'angry' : pound > 0.4 ? 'shut' : 'smug'); P.blinkOK = false;
      P.burst(0.25, 'spark', 'body', [-2, 22, 9], { scale: 0.6 }).burst(0.5, 'spark', 'body', [-2, 22, 9], { scale: 0.6 });
      for (const r0 of [0.7, 0.9, 1.1]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 1.1, tint: [1, 0.9, 0.7] });
      P.burst(0.72, 'dust', 'root', [0, 0, 0], { n: 10, spread: 1, speed: 1.4 }).burst(0.75, 'anger', 'head', [-6, 40, 3], {});
    } },
    // physical: a wound-up wing haymaker
    attack: { len: 0.95, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.28, E.out) * (1 - seg(t, 0.28, 0.36, E.in)), hit = seg(t, 0.3, 0.4, E.in3) * (1 - seg(t, 0.55, 0.92, E.inout));
      P.pos('root', 0, 0, -1.6 * bk + 5 * hit).rot('body', -6 * bk + 10 * hit, 34 * bk - 40 * hit, 0).rot('head', 0, -20 * bk + 26 * hit, 0);
      P.rot('armR', 40 * bk - 90 * hit, 0, -30 * bk + 10 * hit).rot('foreR', -70 * bk - 10 * hit, 0, 0).rot('fingR', 70).rot('armL', -30 * bk, 0, 20 * bk);
      P.sq('body', -0.05 * bk + wob(t, 0.42, 0.05, 4, 7)); P.blinkOK = false;
      P.face('eyes', bk > 0.2 || hit > 0.2 ? 'angry' : undefined).rot('jaw', 14 * hit);
      P.burst(0.4, 'spark', 'body', [-4, 22, 18], { scale: 1.2 }).burst(0.4, 'star', 'body', [-4, 22, 18], { n: 5 }).burst(0.41, 'feather', 'handR', [-11, 9, 3], { n: 3 });
    } },
    // special: the duck dive — a leap, a tuck, and a ground-shaking belly-flop slam
    special: { len: 1.9, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 1.1 ? hop(t, 1.1, 14, { crouch: 2.6, air: [0.25, 0.75] }) : { y: wob(t, 1.1, -1.6, 3, 6), sq: wob(t, 1.1, -0.2, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 3 * seg(t, 0.3, 0.85)).sq('body', h.sq); if (h.y < 0) plant(P, LEGS, h.y, LEG);
      const air = seg(t, 0.28, 0.4) * (1 - seg(t, 0.78, 0.85)), slam = seg(t, 0.75, 0.84, E.in) * (1 - seg(t, 1.3, 1.7, E.inout));
      P.rot('root', -20 * air + 10 * slam, 0, 0);
      arms(P, [-30 * air, 0, -100 * air - 30 * slam], [-40 * air, 0, 0]);
      P.rot('legR', -30 * air).rot('legL', -30 * air).rot('neck', 10 * slam).rot('jaw', 30 * air);
      P.face('eyes', air > 0.3 ? 'angry' : slam > 0.3 ? 'shut' : undefined);
      P.burst(0.85, 'ring', 'root', [0, 1, 4], { scale: 2.2, tint: [1, 0.9, 0.7] }).burst(0.85, 'dust', 'root', [0, 0, 4], { n: 18, spread: 1, speed: 2.4 }).burst(0.86, 'rock', 'root', [0, 1, 6], { n: 10, speed: 1.4 }).burst(0.9, 'star', 'root', [0, 4, 10], { n: 4 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -12 * k + wob(t, 0.2, 3, 3, 6), 0, wave(t, 14) * 3 * k).rot('neck', -14 * k).rot('jaw', 26 * k);
      arms(P, [0, 0, -30 * k], [-20 * k, 0, 0]);
      P.face('eyes', t < 0.45 ? 'x' : 'angry'); P.blinkOK = false;
      P.burst(0.02, 'feather', 'body', [0, 20, 4], { n: 6, speed: 1.4 }).burst(0.02, 'spark', 'body', [0, 22, 9], {});
    } },
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', 0, wave(t, 1.4) * 14 * dizzy, wave(t, 2) * 8 * dizzy).rot('head', 0, 0, wave(t, 2, 1) * 14 * dizzy).rot('jaw', 20 * dizzy);
      arms(P, [0, 0, -14 * dizzy], [0, 0, 0]);
      fallBack(P, fall);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.9, 'star', 'head', TOP, { n: 5 }).burst(1.38, 'dust', 'root', [0, 0, -10], { n: 12, spread: 1 }).burst(1.4, 'feather', 'body', [0, 18, 0], { n: 6 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      fallBack(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('footR', -20 * bump(t, 0.6, 0.8)).burst(1.2, 'star', 'head', [0, 36, 8], { n: 2 });
    } },
    // victory: a hop to a double-biceps pose, the chain swinging, a smug look down the bill
    win: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.7 ? hop(t, 0.7, 5, { crouch: 1.6 }) : { y: wob(t, 0.7, -1.0, 3, 6), sq: wob(t, 0.7, -0.12, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq); if (h.y < 0) plant(P, LEGS, h.y, LEG);
      const pose = seg(t, 0.7, 0.9, E.back);
      arms(P, [-10 * pose, 20 * pose, -86 * pose], [0, 0, -100 * pose]);
      P.rot('fingR', 70 * pose).rot('fingL', 70 * pose).rot('head', -8 * pose, 0, 6 * pose).rot('pecR', -10 * bump(t, 1.2, 1.4)).rot('pecL', -10 * bump(t, 1.45, 1.65));
      P.face('eyes', pose > 0.5 ? 'smug' : 'angry');
      P.burst(0.7, 'dust', 'root', [0, 0, 0], { n: 8 }).burst(0.95, 'sparkle', 'body', [0, 24, 8], { n: 8 }).burst(1.2, 'note', 'head', TOP, {});
    } },
    // asleep standing up: arms crossed, chin on his chest, dreads hanging forward, snoring
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      P.pos('body', 0, -0.8 + br * 0.3, 0); plant(P, LEGS, -0.8 + br * 0.3, LEG);
      arms(P, [-46, -10, 34], [-80, 20, 0]); P.rot('fingR', 60).rot('fingL', 60);
      P.rot('neck', 18 + br * 2).rot('head', 10 + br * 2, 0, 6).rot('jaw', 4 + Math.max(0, br) * 6);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [5, 40, 4], {}).burst(1.9, 'z', 'head', [5, 40, 4], {});
    } },
    // the dance: knees bouncing, shoulder shimmy, a double "sit down" pat-down with both wings, a slow turn and arms folded
    dance: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.3), live = 1 - seg(t, 2.3, 2.45), side = b.n % 2 ? 1 : -1, dy = -1.2 * b.pulse * live;
      P.pos('body', 0, dy, 0).rot('body', 0, side * 6 * live, side * 3 * b.pulse * live); plant(P, LEGS, dy, LEG);
      P.rot('neck', 10 * b.pulse * live).rot('head', 0, -side * 10 * live, 0);
      const shimmy = t < 1.2 ? Math.sin(t * Math.PI * 2 * 5) : 0, pat = t > 1.2 && t < 2.3 ? b.pulse : 0;
      P.rot('armR', -10 * shimmy * live - 40 * (t > 1.2 ? 1 : 0) * live, 0, -14 * live).rot('armL', 10 * shimmy * live - 40 * (t > 1.2 ? 1 : 0) * live, 0, 14 * live);
      P.rot('foreR', -30 * live + 30 * pat, 0, 0).rot('foreL', -30 * live + 30 * pat, 0, 0).rot('handR', 50 * pat).rot('handL', 50 * pat);
      P.rot('pecR', -8 * Math.max(0, shimmy)).rot('pecL', -8 * Math.max(0, -shimmy));
      const turn = seg(t, 2.3, 2.7, E.inout), fold = seg(t, 2.55, 2.75, E.back);
      P.rot('root', 0, 360 * turn, 0); arms(P, [-46 * fold, -10 * fold, 34 * fold], [-80 * fold, 20 * fold, 0]);
      P.rot('head', -10 * fold, 0, 8 * fold).face('eyes', fold > 0.5 ? 'smug' : b.pulse > 0.6 ? 'shut' : undefined);
      P.burst(0.05, 'note', 'head', [6, 41, 2], {}).burst(0.65, 'note', 'head', [-6, 41, 2], {}).burst(1.25, 'note', 'head', [6, 41, 2], {}).burst(1.85, 'note', 'head', [-6, 41, 2], {}).burst(2.7, 'sparkle', 'head', TOP, { n: 6 });
    } },
    // fidget / story: the double-biceps flex — pecs popping one after the other
    flex: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const up = seg(t, 0.15, 0.45, E.back) * (1 - seg(t, 2.2, 2.55, E.inout)), squeeze = up * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4));
      arms(P, [-14 * up, 24 * up, -84 * up], [0, 0, -(96 + 10 * squeeze) * up]);
      P.rot('fingR', 70 * up).rot('fingL', 70 * up).scl('armR', 1, 1 + 0.06 * squeeze, 1 + 0.12 * squeeze).scl('armL', 1, 1 + 0.06 * squeeze, 1 + 0.12 * squeeze);
      P.rot('pecR', -14 * bump(t, 0.8, 1.05) - 14 * bump(t, 1.4, 1.65)).rot('pecL', -14 * bump(t, 1.1, 1.35) - 14 * bump(t, 1.7, 1.95));
      P.sq('body', 0.03 * up).rot('head', -10 * up, 0, 6 * up).pos('body', 0, -0.6 * up, 0); plant(P, LEGS, -0.6 * up, LEG);
      P.face('eyes', up > 0.4 ? (t > 1.9 ? 'glint' : 'smug') : undefined);
      P.burst(0.5, 'sparkle', 'armR', [-12, 26, 0], { n: 3 }).burst(0.55, 'sparkle', 'armL', [12, 26, 0], { n: 3 }).burst(0.82, 'star', 'pecR', [-4, 22, 9], { n: 1, scale: 0.5 }).burst(1.12, 'star', 'pecL', [4, 22, 9], { n: 1, scale: 0.5 });
    } },
    // fidget / story: he looms in over you, cracks his knuckle-feathers one hand then the other, then his neck
    menace: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const loom = seg(t, 0.1, 0.5, E.out) * (1 - seg(t, 2.6, 3.0, E.inout));
      P.rot('body', 14 * loom, 0, 0).pos('root', 0, 0, 2.4 * loom).rot('neck', 10 * loom).rot('head', 8 * loom, 0, 0);
      const hands = env(t, 0.4, 1.9, 0.2, 0.25);
      arms(P, [-64 * hands, 0, 30 * hands], [-56 * hands, 30 * hands, 0]);
      const c1 = bump(t, 0.85, 1.0), c2 = bump(t, 1.35, 1.5);
      P.rot('fingR', 90 * c1 + 30 * hands).rot('fingL', 90 * c2 + 30 * hands).rot('handR', 30 * c1).rot('handL', 30 * c2);
      const neckL = bump(t, 2.0, 2.2), neckR = bump(t, 2.3, 2.5);
      P.rot('head', 0, 0, 22 * neckL - 22 * neckR);
      P.face('eyes', loom > 0.3 ? (t > 2.6 ? 'smug' : 'angry') : undefined);
      P.burst(0.92, 'spark', 'body', [0, 22, 14], { scale: 0.5 }).burst(0.92, 'star', 'body', [0, 22, 14], { n: 2, scale: 0.5 }).burst(1.42, 'spark', 'body', [0, 22, 14], { scale: 0.5 }).burst(1.42, 'star', 'body', [0, 22, 14], { n: 2, scale: 0.5 });
      P.burst(2.1, 'spark', 'neck', [-4, 30, 2], { scale: 0.4 }).burst(2.4, 'spark', 'neck', [4, 30, 2], { scale: 0.4 }).burst(2.1, 'anger', 'head', [-6, 40, 3], {});
    } },
    // story: a water bubble flies in and bursts on him — soaked, sputtering, shaking his dreads out
    wet: { len: 3.4, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const hit = seg(t, 0.32, 0.4, E.out) * (1 - seg(t, 0.4, 1.0, E.inout)), soak = seg(t, 0.35, 0.6) * (1 - seg(t, 2.9, 3.4)), shake = t > 1.9 && t < 2.6 ? Math.sin((t - 1.9) * Math.PI * 2 * 5) * (1 - seg(t, 1.9, 2.6)) : 0;
      const sput = t > 1.0 && t < 1.8 ? Math.max(0, Math.sin((t - 1.0) * Math.PI * 2 * 3.5)) : 0;
      P.pos('root', 0, 0, -3 * hit).rot('body', -14 * hit + 6 * soak, 0, 0).sq('body', -0.12 * hit - 0.04 * soak).rot('neck', 8 * soak - 10 * hit).rot('head', 6 * soak, 0, 0);
      arms(P, [0, 0, (-50 * hit + 10 * soak)], [-30 * hit, 0, 0]);
      for (const n of DR) P.scl(n, 1, 1 + 0.12 * soak, 1);
      P.rot('jaw', 36 * sput + 10 * hit).rot('head', 0, 30 * shake, 6 * shake).rot('neck', 0, 14 * shake, 0);
      P.face('eyes', t < 0.32 ? 'wide' : hit > 0.3 ? 'shut' : sput > 0.2 ? 'shut' : shake !== 0 ? 'closed' : soak > 0.3 ? (t > 2.7 ? 'angry' : 'sad') : undefined);
      P.burst(0.02, SPFX.water, 'root', [0, 34, 48], { n: 1, dir: [0, 0, -1] });
      P.burst(0.36, 'splash', 'head', [0, 36, 8], { n: 30, speed: 1.6, spread: 1 }).burst(0.36, 'ring', 'head', [0, 36, 8], { scale: 1.2, tint: [0.7, 0.9, 1] });
      if (soak > 0.3) { P.stream('drop', 'dr0Rb', [-5.4, 26.6, 2.2], { rate: 5, speed: 0.4 }); P.stream('drop', 'dr0Lb', [5.4, 26.6, 2.2], { rate: 5, speed: 0.4, key: 'l' }); P.stream('drop', 'body', [0, 11, 6], { rate: 4, speed: 0.3, key: 'b' }); }
      if (sput > 0.5) P.stream('drop', 'head', MOUTH, { rate: 30, dir: [0, 0.3, 1], speed: 1.6, spread: 0.4, key: 'm' });
      P.burst(2.0, 'splash', 'head', [0, 36, 0], { n: 20, speed: 1.4, spread: 1 }).burst(2.3, 'splash', 'head', [0, 34, 0], { n: 14, speed: 1.2, spread: 1 }).burst(2.85, 'anger', 'head', [-6, 40, 3], {});
    } },
  },
};
def.anim = anim;
