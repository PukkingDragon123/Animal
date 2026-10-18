// Dynacoon — the AC/DC homage, stage 2 ("T.N.T." / "Dirty Deeds"). Trashcoon grown into a hunched,
// scarred alley brute: a bandolier of red TNT sticks strapped across his chest with fuse cord, one
// more stick always in his fist, fizzing. His old cardboard cap now has devil horns cut into it and
// coloured in with red marker; his ears stick out through holes in the sides (one torn); his mask is
// a straight black bar like a censor strip; a crooked grin full of sharp teeth; sharp glowing slit eyes
// under a hard angry lid; his tail tip is singed and still smoking. He lights fuses by snapping his
// claws, tosses dynamite like a toy and cackles. Homage, never a likeness.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import {
  PAL, J, P, mirrorCube, aimX, rod, furP, bellyP, tuftP, bangsP, skullP, muzzleP, noseP, jawP, mouthP, tongueP, toothP,
  earPlaneP, hairP, maskEyes, tailP, handP, footP, cardP, tapeP, bottleCapP, crateP, ironP, velvetP, tornHemP, leatherP, glassP, tntP, fuseP, fuseSparkP, teethP, clawP, raccoonDrip, DRIP_FX, rig, shift, ramp,
} from './raccoon_parts.js';

const F = PAL.dyna;

// ---------------------------------------------------------------- painters
const fur = furP(F, { tips: true });
const furBack = furP(F, { c: shift(F.c, -0.06), top: F.c, bottom: F.deep, tips: true });
const furFringe = furP(F, { fringe: true, tips: true });
const belly = bellyP(F, { cy: 0.62, rx: 0.36, ry: 0.62 });
// the chest: a pale bib crossed by an old scar
const chestP = (p, w, h, face, cube) => {
  fur(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const hw = w * (0.16 + 0.14 * (y / h)) - ((x + y) % 3 === 0 ? 1 : 0); if (Math.abs(x - cx) < hw) p.px(x, y, Math.abs(x - cx) > hw - 1.2 ? F.bellyLo : y < 3 ? F.bellyHi : F.belly); }
  for (let k = 0; k < 10; k++) { const x = Math.round(w * 0.62) + k, y = 3 + Math.round(k * 0.7); p.px(x, y, F.scar); if (k % 3 === 1) { p.px(x, y - 1, F.scarLo); p.px(x, y + 1, F.scarLo); } }
};
const cheekP = (p, w, h, face) => {
  furP(F, { c: F.cream, top: F.creamHi, bottom: F.creamLo, sx: 5, sy: 4 })(p, w, h, face);
  if (face === 'up') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 5 === 0 ? F.lo : F.c);
  if (face === 'north') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < h / 2 ? F.c : F.lo);
  if (face === 'east' || face === 'west') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const front = face === 'east' ? x : w - 1 - x, edge = h * 0.45 + (front < w * 0.4 ? 0 : (front - w * 0.4) * 0.5) + (x % 3 === 1 ? 1 : 0); if (y < edge) p.px(x, y, y === 0 ? F.hi : (x + y) % 6 === 0 ? F.lo : F.c); }
};
// eyes at x = ±2.75, y = 20.3 on a 8.667-unit skull: texels ex 8.25, ey 10.6; the mask is a censor bar
const skull = skullP(F, { ex: 8.25, ey: 10.6, mh: 5.8, mask: 'bar', scar: true });
const muzzle = muzzleP(F, { bw: 2.0, bt: 1.4 });
const snout = muzzleP(F, { mouth: true, bridge: false });
const nose = noseP(F);
const jaw = jawP(F);
const hand = handP(F), foot = footP(F);
const sock = (k) => (p, w, h, face, cube) => {
  fur(p, w, h, face, cube);
  if (face === 'up' || face === 'down') return;
  const y0 = Math.round(h * (1 - k));
  for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) { if (y === y0 && x % 3 === 1) continue; p.px(x, y, ramp([F.pawHi, F.paw, F.paw, F.pawLo], (y - y0) / Math.max(1, h - y0), x, y)); }
};
// scruffy hackles along the spine (planes): ragged spikes pointing up
const hackleP = (p, w, h) => { for (let x = 0; x < w; x++) { const k = x % 4, l = Math.round(h * [0.45, 1, 0.7, 0.3][k]); for (let y = h - l; y < h; y++) p.px(x, y, y === h - l ? F.tip : k === 1 ? F.c : F.lo); } };
// the horned cardboard cap: Trashcoon's cap, older, scorched, devil horns cut and folded up from the crown
const bandP = (p, w, h, face, cube) => {
  cardP({ tape: face === 'east' ? [[0.3, 0.4]] : face === 'north' ? [[0.6, 0.7]] : [], stains: face === 'west' })(p, w, h, face, cube);
  if (face === 'south' || face === 'north' || face === 'east' || face === 'west') for (let x = 0; x < w; x++) { p.px(x, h - 2, shift(J.cardLo, -0.06)); if ((x * 7) % 11 < 2) p.px(x, h - 1, '#2a2024'); }   // scorched hem
};
const puffP = (p, w, h, face, cube) => {
  cardP({ upFlat: true })(p, w, h, face, cube);
  if (face === 'south' || face === 'north' || face === 'east' || face === 'west') for (let x = 2; x < w; x += 9) for (let y = 1; y < h; y++) p.px(x, y, J.cardLo);
  if (face === 'up') for (const [u, v] of [[0.3, 0.3], [0.7, 0.6]]) { const cx = u * w, cy = v * h; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.hypot(x - cx, y - cy) < 1.6) p.px(x, y, '#3a2c26'); }   // scorch marks
};
const brimP = (p, w, h, face, cube) => {
  cardP({ upFlat: true, edge: face !== 'south' })(p, w, h, face, cube);
  if (face === 'south') for (let x = 0; x < w; x++) p.px(x, 0, x % 2 ? J.cardIn : J.cardDeep);
  if (face === 'up') for (let x = 0; x < w; x++) { p.px(x, h - 1, J.cardDeep); if (x > w * 0.7 && (x % 2)) p.px(x, h - 2, '#2a2024'); }
  if (face === 'down') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 2 ? J.cardDeep : shift(J.cardDeep, -0.1));
};
// cardboard horns coloured in with red marker (hatched strokes, the cut edge showing)
const hornP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? J.devilHi : face === 'down' ? J.devilDeep : ramp([J.devilHi, J.devil, J.devil, J.devilLo], h > 1 ? y / (h - 1) : 0.5, x, y));
  if (face === 'south') for (let y = 1; y < h; y += 2) p.px((y * 2) % Math.max(1, w), y, J.devilLo);   // marker strokes
  if (face === 'east' || face === 'west') for (let y = 0; y < h; y++) p.px(0, y, J.cardIn);         // the cut cardboard edge
};
// hand-pixelled eyes: sharp slanted yellow eyes, a slit pupil, one glint — and they glow
const EYES = maskEyes({ style: 'pix', chunk: 2, iris: '#f2b414', accent: '#fff27a', at: [-2.85, 20.2, 5.05], map: { open: [
  'ih...',
  'iiiki',
  '.ccci',
] } }, '#e2dad0', true);
// wild rock hair: a shaggy mane bursting out from under the horned cap
const WILD = { c: '#6e4c36', hi: '#a07656', lo: '#3c281e', tip: '#c49a6e' };
const hairCubes = [
  P([-4.4, 21.8, 5.08], [8.8, 2.0, 0], hairP(WILD, { seed: 1, min: 0.4, tips: true }), { plane: 'z' }),
  P([-6.1, 16.6, -3.0], [0, 7.0, 8.0], hairP(WILD, { seed: 2, min: 0.4, tips: true }), { plane: 'x', pivot: [-5.9, 23.6, 0], rot: [0, 0, -26] }),
  P([6.1, 16.6, -3.0], [0, 7.0, 8.0], hairP(WILD, { seed: 3, min: 0.4, tips: true }), { plane: 'x', pivot: [5.9, 23.6, 0], rot: [0, 0, 26] }),
  P([-5.4, 15.6, -3.45], [10.8, 8.0, 0], hairP(WILD, { seed: 4, min: 0.55, tips: true }), { plane: 'z', pivot: [0, 23.6, -3.45], rot: [-16, 0, 0] }),
];

// ---------------------------------------------------------------- the model
const earCubes = (torn) => [
  P([-6.0, 21.667, -1.0], [2.0, 1.667, 1.0], fur),
  P([-7.0, 22.0, -0.25], [4.0, 4.667, 0], earPlaneP(F, false, torn), { plane: 'z' }),
  P([-7.0, 22.0, -0.42], [4.0, 4.667, 0], earPlaneP(F, true, torn), { plane: 'z' }),
];
const armCubes = [P([-8.1, 9.5, -0.3], [3.0, 5.333, 3.0], fur), P([-8.433, 12.333, -0.633], [3.667, 3.0, 3.667], fur),
  P([-8.6, 11.6, -0.8], [4.0, 3.9, 4.0], velvetP(), { id: 'dc-blazer', hide: true }), P([-8.6, 10.6, 3.21], [4.0, 1.0, 0], tornHemP(J.vel, J.velDeep), { plane: 'z', id: 'dc-blazer', hide: true })];
const foreCubes = [P([-7.933, 5.5, -0.133], [2.667, 5.0, 2.667], sock(0.55)), P([-8.1, 3.333, -0.3], [3.0, 2.167, 3.0], hand), P([-8.1, 2.0, 2.75], [3.0, 1.333, 0], clawP, { plane: 'z' })];
const legCubes = [
  P([-6.6, 2.0, -3.6], [5.333, 5.667, 6.0], fur, { faces: { north: furBack } }),
  P([-6.9, 2.6, -3.2], [5.6, 4.4, 5.2], furFringe),
  P([-5.433, 0.667, -1.833], [3.667, 2.0, 3.667], sock(1)),
];
const footCube = P([-5.067, 0.0, -2.0], [3.333, 1.333, 6.333], foot, { pivot: [-3.4, 0, 1.0], rot: [0, -10, 0] });
const tailSeg = (cx, cy, z0, len, w, h, s0, o = {}) => [
  P([cx - w / 2, cy - (h - 0.667) / 2, z0 - len], [w, h - 0.667, len], tailP(F, s0, o)),
  P([cx - (w - 1) / 2, cy - h / 2, z0 - len], [w - 1, h, len], tailP(F, s0, o)),
];
// a stick of TNT standing on `c` (model coords), tilted `rz` degrees, with its fuse and three spark frames
const STICK = [1.333, 4.333, 1.333];
function tntStick(c, rz, ids, o = {}) {
  const a = rz * Math.PI / 180, up = [-Math.sin(a), Math.cos(a)], top = [c[0] + up[0] * 2.2, c[1] + up[1] * 2.2, c[2]];
  const piv = { pivot: c, rot: [0, 0, rz] };
  return [
    P([c[0] - STICK[0] / 2, c[1] - STICK[1] / 2, c[2] - STICK[2] / 2], STICK, tntP(o), { ...piv, id: ids.stick }),
    P([c[0] - 0.5, c[1] + STICK[1] / 2 - 0.1, c[2]], [1.0, 1.667, 0], fuseP, { plane: 'z', ...piv, id: ids.stick }),
    ...['a', 'b', 'c'].map((f, i) => P([c[0] - 0.667, c[1] + STICK[1] / 2 + 1.0, c[2] + 0.05], [1.333, 1.333, 0], fuseSparkP(i), { plane: 'z', glow: true, ...piv, id: ids.spark + f, hide: true })),
    ...(o.tip ? [] : []),
  ].map((q) => ({ ...q, _top: top }));
}
// the bandolier: fuse cord from the left shoulder to the right hip, five sticks bound across it
const SA = [5.6, 15.4, 4.75], SBp = [-5.4, 5.6, 5.1];
const strapAt = (t) => [SA[0] + (SBp[0] - SA[0]) * t, SA[1] + (SBp[1] - SA[1]) * t, SA[2] + (SBp[2] - SA[2]) * t];
const STRAP_ROT = Math.atan2(SBp[1] - SA[1], SBp[0] - SA[0]) * 180 / Math.PI + 180;
const BAND_T = [0.15, 0.32, 0.49, 0.66, 0.83];
const BAND_TOPS = BAND_T.map((t) => { const c = strapAt(t), a = STRAP_ROT * Math.PI / 180; return [c[0] - Math.sin(a) * 3.4, c[1] + Math.cos(a) * 3.4, c[2] + 0.9]; });
const cordP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? J.fuseHi : (x + y) % 3 === 0 ? J.fuseHi : (x + y) % 3 === 1 ? J.fuse : J.fuseLo); };
const bandCubes = [
  rod(SA, SBp, 0.5, 1.0, cordP, { sideV: [0, 0, 1], over: 1 }),
  rod([SA[0] + 0.4, SA[1] + 0.9, SA[2] - 0.3], [SA[0] + 0.4, SA[1] + 0.9, -4.6], 0.9, 0.5, cordP, { sideV: [1, 0, 0] }),
  ...BAND_T.flatMap((t, i) => tntStick([...strapAt(t).slice(0, 2), strapAt(t)[2] + 0.9], STRAP_ROT, { stick: 'bstick', spark: 'bsp-' }, { text: i % 2 === 0 })),
];
// the stick in his fist (bone 'held', on the right paw) and the one he throws (bone 'bomb', on the root)
const HELD_C = [-6.6, 3.7, 2.4], BOMB_C = [0, 8, 6];
export const def = {
  name: 'dynacoon', ppu: 3, scale: 0.46, outline: { color: F.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'footR', parent: 'root', pivot: [-3.4, 0, 1.0], cubes: [footCube] },
    { name: 'footL', parent: 'root', pivot: [3.4, 0, 1.0], cubes: [mirrorCube(footCube)] },
    { name: 'legR', parent: 'root', pivot: [-3.6, 7.0, -0.6], cubes: legCubes },
    { name: 'legL', parent: 'root', pivot: [3.6, 7.0, -0.6], cubes: legCubes.map(mirrorCube) },
    { name: 'body', parent: 'root', pivot: [0, 6.6, -0.8], rot: [8, 0, 0], cubes: [
      P([-6.333, 3.667, -4.333], [12.667, 6.333, 8.667], fur, { faces: { south: belly, north: furBack } }),
      P([-7.0, 4.333, -3.667], [14.0, 5.0, 7.333], furFringe, { faces: { south: belly, north: furBack } }),
      P([-7.0, 9.667, -4.0], [14.0, 6.667, 8.333], fur, { faces: { south: chestP, north: furBack } }),
      P([-7.667, 10.333, -3.333], [15.333, 5.0, 7.0], fur, { faces: { north: furBack } }),
      P([-5.333, 16.0, -3.333], [10.667, 1.333, 6.0], fur),
      P([0, 13.0, -5.6], [0, 3.333, 3.333], hackleP, { plane: 'x', pivot: [0, 14, -4.2], rot: [-30, 0, 0] }),
      P([0, 9.5, -6.2], [0, 3.0, 3.0], hackleP, { plane: 'x', pivot: [0, 10.5, -4.6], rot: [-50, 0, 0] }),
      // tier 2: his old school blazer, ripped open — or a belt studded with bottle caps
      P([-8.0, 9.4, -4.4], [16.0, 7.2, 9.0], velvetP({ open: true, patch: true }), { id: 'dc-blazer', hide: true }),
      P([-8.0, 8.2, 4.62], [16.0, 1.4, 0], tornHemP(J.vel, J.velDeep), { plane: 'z', id: 'dc-blazer', hide: true }),
      P([-8.0, 8.2, -4.42], [16.0, 1.4, 0], tornHemP(J.vel, J.velDeep), { plane: 'z', id: 'dc-blazer', hide: true }),
      P([-7.25, 4.6, 4.33], [14.5, 1.3, 0.5], leatherP({ c: '#2a2026', hi: '#4a3c44', lo: '#18121a', studs: true }), { id: 'dc-belt', hide: true }),
      P([-7.25, 4.6, -4.83], [14.5, 1.3, 0.5], leatherP({ c: '#2a2026', hi: '#4a3c44', lo: '#18121a', studs: true }), { id: 'dc-belt', hide: true }),
      P([-7.25, 4.6, -4.4], [0.5, 1.3, 8.8], leatherP({ c: '#2a2026', hi: '#4a3c44', lo: '#18121a', studs: true }), { id: 'dc-belt', hide: true }), P([6.75, 4.6, -4.4], [0.5, 1.3, 8.8], leatherP({ c: '#2a2026', hi: '#4a3c44', lo: '#18121a', studs: true }), { id: 'dc-belt', hide: true }),
      ...[-5.6, -3.6, 3.6, 5.6].map((x) => P([x - 0.45, 4.8, 4.83], [0.9, 0.9, 0.3], bottleCapP(), { id: 'dc-belt', hide: true })),
      P([-1.4, 4.2, 4.83], [2.8, 2.1, 0.5], bottleCapP(J.brass, J.brassHi, J.brassLo), { id: 'dc-belt', hide: true }),
      // tier 3 (or): a cardboard firework rocket riding on his right shoulder, nose to the front
      rod([-8.2, 17.0, -4.6], [-8.2, 18.4, 4.4], 2.4, 2.4, cardP({ edge: false, tape: [[0.1, 0.2], [0.75, 0.85]] }), { sideV: [1, 0, 0], ...{ id: 'dc-rocket', hide: true } }),
      rod([-8.2, 18.4, 4.2], [-8.2, 18.7, 6.0], 1.8, 1.8, hornP, { sideV: [1, 0, 0], ...{ id: 'dc-rocket', hide: true } }),
      rod([-8.2, 18.7, 5.8], [-8.2, 18.85, 7.0], 0.9, 0.9, hornP, { sideV: [1, 0, 0], ...{ id: 'dc-rocket', hide: true } }),
      rod([-8.2, 16.8, -4.4], [-8.2, 16.5, -6.4], 0.5, 0.5, fuseP, { ...{ id: 'dc-rocket', hide: true } }),
    ] },
    { name: 'band', parent: 'body', pivot: [0, 11, 4.8], cubes: bandCubes },
    { name: 'tail1', parent: 'body', pivot: [0.8, 5.0, -4.2], rot: [12, -30, 0], cubes: tailSeg(0.8, 5.0, -3.6, 7.0, 4.667, 4.667, 6) },
    { name: 'tail2', parent: 'tail1', pivot: [0.8, 5.0, -10.0], rot: [22, -8, 0], cubes: tailSeg(0.8, 5.0, -9.3, 7.5, 5.333, 5.333, 21) },
    { name: 'tail3', parent: 'tail2', pivot: [0.8, 5.0, -16.2], rot: [24, 0, 0], cubes: tailSeg(0.8, 5.0, -15.5, 6.5, 4.667, 4.667, 40) },
    { name: 'tail4', parent: 'tail3', pivot: [0.8, 5.0, -21.4], rot: [16, 0, 0], cubes: tailSeg(0.8, 5.0, -20.7, 5.5, 3.667, 3.667, 55, { tipAt: 63, singe: true }) },
    { name: 'armR', parent: 'body', pivot: [-6.6, 14.6, 1.2], rot: [-18, 0, 10], cubes: armCubes },
    { name: 'foreR', parent: 'armR', pivot: [-6.6, 10.0, 1.2], rot: [-34, 0, 0], hand: [-6.6, 3.9, 1.2], cubes: foreCubes },
    { name: 'held', parent: 'foreR', pivot: HELD_C, rot: [0, 0, -20], cubes: tntStick(HELD_C, 0, { stick: 'held', spark: 'hsp-' }) },
    { name: 'armL', parent: 'body', pivot: [6.6, 14.6, 1.2], rot: [-10, 0, -12], cubes: armCubes.map(mirrorCube) },
    { name: 'foreL', parent: 'armL', pivot: [6.6, 10.0, 1.2], rot: [-24, 0, 0], hand: [6.6, 3.9, 1.2], cubes: foreCubes.map(mirrorCube) },
    { name: 'bomb', parent: 'root', pivot: BOMB_C, cubes: tntStick(BOMB_C, 0, { stick: 'bomb', spark: 'bmb-' }).map((q) => ({ ...q, hide: true })) },
    { name: 'head', parent: 'body', pivot: [0, 16.0, 2.6], rot: [-4, 0, 0], cubes: [
      P([-5.667, 15.333, -2.333], [11.333, 8.667, 7.333], fur, { faces: { south: skull, east: skull, west: skull, north: furBack } }),
      P([-5.0, 15.667, -3.333], [10.0, 7.333, 1.0], furBack),
      P([-6.333, 15.0, -1.0], [12.667, 3.333, 5.667], cheekP),
      P([-9.667, 13.333, 1.4], [3.667, 5.0, 0], tuftP(F, { cream: true }), { plane: 'z', mirror: true, pivot: [-6.0, 16.0, 1.4], rot: [0, -28, -14] }),
      P([6.0, 13.333, 1.4], [3.667, 5.0, 0], tuftP(F, { cream: true, ph: 1 }), { plane: 'z', pivot: [6.0, 16.0, 1.4], rot: [0, 28, 14] }),
      P([-9.0, 14.333, -1.4], [3.0, 4.333, 0], tuftP(F, { ph: 2 }), { plane: 'z', mirror: true, pivot: [-6.0, 16.5, -1.4], rot: [0, -40, -10] }),
      P([6.0, 14.333, -1.4], [3.0, 4.333, 0], tuftP(F, { ph: 3 }), { plane: 'z', pivot: [6.0, 16.5, -1.4], rot: [0, 40, 10] }),
      P([-2.333, 15.333, 4.667], [4.667, 3.0, 2.667], muzzle),
      P([-1.667, 15.667, 7.0], [3.333, 2.333, 1.667], snout),
      P([-0.833, 17.167, 8.5], [1.667, 1.0, 0.833], nose),
      P([-1.5, 15.0, 8.69], [3.0, 0.667, 0], teethP(false), { plane: 'z', outline: false }),
      P([-2.1, 14.4, 7.6], [0.6, 1.267, 0.5], toothP),
      P([1.5, 14.8, 7.6], [0.6, 0.867, 0.5], toothP),
      ...hairCubes,
      // tier 1 (or): blast goggles pushed up on the brow, an iron-rimmed pair on a leather strap
      P([-4.3, 22.2, 5.0], [3.2, 2.6, 0.9], ironP({ rivets: true }), { id: 'dc-goggles', hide: true }), P([1.1, 22.2, 5.0], [3.2, 2.6, 0.9], ironP({ rivets: true }), { id: 'dc-goggles', hide: true }),
      P([-3.9, 22.55, 5.92], [2.4, 1.9, 0], glassP, { plane: 'z', id: 'dc-goggles', hide: true }), P([1.5, 22.55, 5.92], [2.4, 1.9, 0], glassP, { plane: 'z', id: 'dc-goggles', hide: true }),
      P([-1.1, 22.9, 5.1], [2.2, 0.9, 0.6], ironP(), { id: 'dc-goggles', hide: true }),
      P([-5.95, 22.6, -2.6], [0.5, 1.2, 7.8], leatherP({ c: '#3a2a22', hi: '#5a4234', lo: '#24180f' }), { id: 'dc-goggles', hide: true }), P([5.45, 22.6, -2.6], [0.5, 1.2, 7.8], leatherP({ c: '#3a2a22', hi: '#5a4234', lo: '#24180f' }), { id: 'dc-goggles', hide: true }),
      P([-5.3, 22.6, -3.65], [10.6, 1.2, 0.5], leatherP({ c: '#3a2a22', hi: '#5a4234', lo: '#24180f' }), { id: 'dc-goggles', hide: true }),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 15.667, 4.667], rot: [8, 0, 3], cubes: [
      P([-2.0, 14.0, 4.333], [4.0, 1.667, 3.667], jaw),
      P([-1.333, 15.5, 8.02], [2.667, 0.667, 0], teethP(true, { off: 1 }), { plane: 'z', outline: false }),
      P([-1.833, 15.367, 4.5], [3.667, 0.3, 3.333], mouthP, { outline: false }),
      P([-1.167, 15.4, 5.0], [2.333, 0.3, 2.5], tongueP, { outline: false }),
    ] },
    { name: 'earR', parent: 'head', pivot: [-5.0, 22.0, -0.5], rot: [-6, 18, 64], cubes: earCubes(false) },
    { name: 'earL', parent: 'head', pivot: [5.0, 22.0, -0.5], rot: [-6, -18, -64], cubes: earCubes(true).map(mirrorCube) },
    // tier 1: the horned cardboard cap — or blast goggles pushed up on the brow (on the head, below)
    { name: 'cap', parent: 'head', pivot: [0, 23.6, 0.6], rot: [-10, 0, -5], cubes: [
      P([-5.833, 23.0, -3.5], [11.667, 2.333, 8.833], bandP, { id: 'dc-cap', hide: true }),
      P([-6.167, 25.0, -3.833], [12.333, 1.667, 9.5], puffP, { id: 'dc-cap', hide: true }),
      P([-5.333, 26.667, -3.0], [10.667, 0.5, 7.833], cardP({ upFlat: true }), { id: 'dc-cap', hide: true }),
      P([-0.667, 27.167, 0.5], [1.333, 0.5, 1.333], bottleCapP(), { id: 'dc-cap', hide: true }),
      P([-5.0, 23.0, 5.333], [10.0, 0.5, 3.667], brimP, { pivot: [0, 23.25, 5.333], rot: [14, 0, 0], id: 'dc-cap', hide: true }),
      // horns cut from the crown and folded up, leaning outward like a devil's
      ...[-1, 1].flatMap((sd) => [[2.333, 1.667, 0], [1.667, 1.5, 0.45], [1.0, 1.333, 0.85]].map(([w, h, out], i) => P(
        [sd * (3.8 + out) - w / 2, 26.3 + [0, 1.667, 3.167][i], 1.7], [w, h, 0.833], hornP, { pivot: [sd * 3.8, 26.3, 2.1], rot: [0, 0, -sd * 14], mirror: sd > 0, id: 'dc-cap', hide: true }))),
      P([-4.6, 26.3, 1.7], [2.0, 0.7, 1.3], tapeP, { id: 'dc-cap', hide: true }),
    ] },
    // tier 3: a blasting crate strapped to his back, plunger up, a fuse cord running to the bandolier
    { name: 'pack', parent: 'body', pivot: [0, 11, -4.4], cubes: [
      P([-3.4, 8.2, -7.0], [6.8, 5.4, 2.8], crateP, { id: 'dc-crate', hide: true }),
      rod([0, 13.4, -5.6], [0, 16.4, -5.6], 0.8, 0.8, ironP(), { id: 'dc-crate', hide: true }),
      rod([-2.0, 16.6, -5.6], [2.0, 16.6, -5.6], 0.9, 0.9, ironP({ rivets: true }), { id: 'dc-crate', hide: true }),
      rod([-5.6, 15.4, -4.3], [-5.0, 9.6, -4.3], 1.0, 0.5, cordP, { sideV: [0, 0, 1], id: 'dc-crate', hide: true }),
      rod([5.6, 15.4, -4.3], [5.0, 9.6, -4.3], 1.0, 0.5, cordP, { sideV: [0, 0, 1], id: 'dc-crate', hide: true }),
      rod([3.0, 10.2, -5.2], [7.4, 9.0, 0.6], 0.5, 0.5, cordP, { id: 'dc-crate', hide: true }),
    ] },
  ],
};
// the TNT (bandolier + the stick in his fist) is what this stage gains, so it is always worn; the
// tiers add one choice each
def.drip = [
  [{ id: 'dc-cap', name: 'Horned cardboard cap' }, { id: 'dc-goggles', name: 'Blast goggles' }],
  [{ id: 'dc-blazer', name: 'Ripped school blazer' }, { id: 'dc-belt', name: 'Bottle-cap belt' }],
  [{ id: 'dc-crate', name: 'Blasting-crate pack' }, { id: 'dc-rocket', name: 'Shoulder firework rocket' }],
];
// the ultra-drip form: black-lacquered fur and dynamite, gold paper, gold tail bands, blue fire and sparks
def.dripForm = { map: raccoonDrip([F.ringL, F.tip, F.bolt]), fx: DRIP_FX };
def.attach = {
  head: { bone: 'head', at: [0, 24.0, 1.3], size: 11.333 },
  face: { bone: 'head', at: [0, 20.3, 5.05], size: 11.333 },
  neck: { bone: 'body', at: [0, 15.6, 4.3], size: 9 },
  back: { bone: 'body', at: [0, 11.0, -4.0], size: 12 },
};

// ---------------------------------------------------------------- rig
const R = rig(def);
const HELD_FUSE = [HELD_C[0], HELD_C[1] + 3.6, HELD_C[2]], BOMB_FUSE = [BOMB_C[0], BOMB_C[1] + 3.6, BOMB_C[2]];
const POLE_R = [-1, -0.4, -0.6], POLE_L = [1, -0.4, -0.6];

// ---------------------------------------------------------------- animation
const ABC = ['a', 'b', 'c'];
const cyc = (t, fps) => ABC[Math.floor(t * fps) % 3];
function plant(P, dy) { for (const l of ['legR', 'legL']) P.pos(l, 0, dy, 0).scl(l, 1, Math.max(0.4, (6.33 + dy) / 6.33), 1); }
// the fist's fuse fizzes: glowing tip + spitting sparks
function fizz(P, t, rate = 30) { P.face('hspark', cyc(t, 14)); P.stream('fusespark', 'held', HELD_FUSE, { rate, dir: [0, 1, 0], spread: 0.9, key: 'h' }); }
// every fuse on the bandolier lit
function bandFizz(P, t, rate = 14) { P.face('bspark', cyc(t, 12)); BAND_TOPS.forEach((q, i) => P.stream('fusespark', 'band', q, { rate, dir: [0, 1, 0.3], spread: 0.9, key: 'b' + i })); }
const MOUTH = [0, 15.2, 8.8], HEAD_TOP = [0, 30, 2];
const dart = (P, dx, dy = 0) => P.pos('eyeR', dx, dy, 0).pos('eyeL', dx, dy, 0);
const eyeSq = (P, sx, sy) => P.scl('eyeR', sx, sy, 1).scl('eyeL', sx, sy, 1);

export const anim = {
  start: 'idle', seed: 33,
  breathe: { bone: 'body', amp: 0.022, per: 2.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.2], dur: 0.1 },
  look: { bone: 'head', yaw: 24, pitch: 12, speed: 5 },
  springs: [
    { bone: 'tail1', tip: [0, 0, -6], k: 120, d: 9, gain: 0.6, max: 14 },
    { bone: 'tail2', tip: [0, 0, -6], k: 100, d: 8, gain: 0.8, max: 18 },
    { bone: 'tail3', tip: [0, 0, -6], k: 90, d: 7, gain: 1.0, max: 22 },
    { bone: 'tail4', tip: [0, 0, -5], k: 80, d: 6.5, gain: 1.1, max: 24 },
    { bone: 'cap', tip: [0, 4, 0], k: 240, d: 9, gain: 0.3, max: 9 },
    { bone: 'earR', tip: [0, 4, 0], k: 160, d: 7, gain: 0.6, max: 18 },
    { bone: 'earL', tip: [0, 4, 0], k: 160, d: 7, gain: 0.6, max: 18 },
  ],
  faces: {
    eyes: EYES.slot,
    held: { default: 'on', states: { on: ['held'], off: [] } },
    hspark: { default: 'off', states: { off: [], a: ['hsp-a'], b: ['hsp-b'], c: ['hsp-c'] } },
    bspark: { default: 'off', states: { off: [], a: ['bsp-a'], b: ['bsp-b'], c: ['bsp-c'] } },
    bomb: { default: 'off', states: { off: [], on: ['bomb'] } },
    bmbspark: { default: 'off', states: { off: [], a: ['bmb-a'], b: ['bmb-b'], c: ['bmb-c'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'fuse', 'cackle'] },
  clips: {
    // a hunched, menacing sway; tosses the fizzing stick in his fist and catches it, grinning
    idle: { len: 2.4, loop: true, f(P, t) {
      const sw = wave(t, 1 / 2.4), b = bounce(t, 1.2, { squash: 0.04, stretch: 0.02 }), dy = b.u * 0.5 - 0.25;
      P.pos('body', sw * 0.6, dy, 0).sq('body', b.sq).rot('body', 0, sw * 7, -sw * 4); plant(P, dy);
      P.rot('head', 2 - b.u * 3, -sw * 8, sw * 6 + 3).rot('jaw', 2 * wave(t, 3) * bump(t, 1.4, 2.2));
      const toss = bump(t, 0.7, 1.25), spin = seg(t, 0.7, 1.25, E.lin);
      P.rot('armR', -10 * toss + 8 * bump(t, 1.2, 1.45), 0, 0).rot('foreR', -30 * toss + 14 * bump(t, 1.22, 1.45), 0, 0);
      P.pos('held', 0, 5.0 * toss, 1.2 * toss).rot('held', 0, 0, 360 * spin);
      P.rot('armL', wave(t, 1 / 2.4, 1) * 6, 0, -sw * 4).rot('foreL', -6 + wave(t, 1 / 1.2) * 5, 0, 0);
      P.rot('tail1', 0, sw * 10, 0).rot('tail3', wave(t, 1 / 2.4, 1.2) * 8, 0, 0);
      P.face('eyes', t > 1.3 && t < 1.7 ? 'sleepy' : undefined);
      dart(P, 0.5 * (bump(t, 0.6, 1.3) - bump(t, 1.8, 2.3)), 0.2 * toss); eyeSq(P, 1, 1 + 0.12 * toss);   // the eyes follow the toss
      fizz(P, t, 24);
      P.stream('smoke', 'tail4', [0.8, 5.0, -26], { rate: 1.2, scale: 0.5, spread: 0.4 });
    } },
    // a heavy prowl: big rolling steps, shoulders swinging, knuckles low, head thrust forward
    walk: { len: 0.8, loop: true, f(P, t) {
      const ph = (t / 0.8) * Math.PI * 2, sn = Math.sin(ph), c = Math.cos(ph), dy = Math.abs(c) * 0.9 - 0.6;
      P.pos('body', 0, dy, 0).rot('body', 4, sn * 10, -sn * 5).sq('body', -0.04 * (1 - Math.abs(c))); plant(P, dy);
      P.pos('footR', 0, Math.max(0, sn) * 2.2, sn * 3.0).pos('footL', 0, Math.max(0, -sn) * 2.2, -sn * 3.0);
      P.rot('legR', -sn * 18, 0, 0).rot('legL', sn * 18, 0, 0);
      P.rot('armR', 14 * sn, 0, 0).rot('foreR', -8 + 6 * sn, 0, 0).rot('armL', -14 * sn, 0, 0).rot('foreL', -8 - 6 * sn, 0, 0);
      P.rot('head', 4 - dy * 3, -sn * 6, sn * 3);
      P.rot('tail1', 0, -sn * 14, 0).rot('tail2', 0, -sn * 8, 0);
      fizz(P, t, 18);
      P.burst(0.2, 'dust', 'footL', [3.4, 0.4, 3], { n: 1, speed: 0.4, scale: 0.6 }).burst(0.6, 'dust', 'footR', [-3.4, 0.4, 3], { n: 1, speed: 0.4, scale: 0.6 });
    } },
    // a cackle that builds into a roar; arms flung wide, every fuse on the bandolier bursts alight
    cry: { len: 2.3, next: 'idle', f(P, t) {
      const cackle = seg(t, 0.05, 0.25) * (1 - seg(t, 0.85, 1.0));
      const roar = seg(t, 0.95, 1.12, E.back) * (1 - seg(t, 1.9, 2.25, E.inout));
      const shake = wave(t, 9) * cackle;
      P.rot('body', -14 * cackle - 10 * roar + shake * 3, 0, shake * 2).pos('body', 0, shake * 0.4 - 1.2 * roar * 0 , 0);
      P.rot('head', -24 * cackle + shake * 6 - 28 * roar + wave(t, 13) * 3 * roar, 0, wave(t, 4.5) * 6 * cackle).rot('jaw', 10 * cackle + 14 * Math.max(0, wave(t, 9)) * cackle + 40 * roar);
      P.rot('armR', -30 * cackle - 40 * roar, 0, 10 * cackle + 60 * roar).rot('foreR', -40 * cackle - 30 * roar, 0, 0);
      P.rot('armL', -30 * cackle - 40 * roar, 0, -10 * cackle - 60 * roar).rot('foreL', -40 * cackle - 30 * roar, 0, 0);
      const dy = -1.2 * seg(t, 0.85, 0.95) * (1 - seg(t, 0.95, 1.1)) + 0.6 * roar; P.pos('root', 0, Math.max(0, dy), 0); if (dy < 0) plant(P, dy);
      P.sq('body', 0.06 * roar * (1 - seg(t, 1.1, 1.3)) + wob(t, 1.12, 0.05, 3, 5));
      P.face('eyes', cackle > 0.4 ? 'happy' : roar > 0.3 ? 'wide' : undefined); P.lookW = 1 - Math.max(cackle, roar);
      fizz(P, t, 30);
      if (t > 1.0 && t < 2.1) bandFizz(P, t, 18);
      P.burst(1.0, 'spark', 'band', BAND_TOPS[2], { n: 3, spread: 1 }).burst(1.02, 'anger', 'head', [7, 28, 3], {}).burst(1.15, 'anger', 'head', [-7, 27, 3], {});
      P.burst(1.05, 'smoke', 'band', BAND_TOPS[1], { n: 4, spread: 1 }).burst(0.98, 'dust', 'root', [0, 0.5, 0], { n: 5, spread: 1 });
    } },
    // physical: a lunging double claw swipe — right, then left — and a shoulder shove
    attack: { len: 1.2, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.25, E.out3) * (1 - seg(t, 0.25, 0.32, E.in));
      const s1 = seg(t, 0.28, 0.38, E.in3) * (1 - seg(t, 0.42, 0.6, E.inout)), s2 = seg(t, 0.48, 0.58, E.in3) * (1 - seg(t, 0.62, 0.95, E.inout));
      P.pos('root', 0, 0, key([[0, 0], [0.25, -1.2], [0.4, 3.6], [0.6, 5], [0.9, 4.2], [1.2, 0]], t));
      P.rot('body', -8 * wind + 10 * (s1 + s2), 20 * wind - 26 * s1 + 26 * s2, 0);
      P.rot('armR', -60 * wind - 50 * s1, 0, 50 * wind - 30 * s1).rot('foreR', -40 * wind + 20 * s1, 0, 0);
      P.rot('armL', -40 * wind - 50 * s2, 0, -30 * wind + 30 * s2).rot('foreL', -30 * wind + 20 * s2, 0, 0);
      const dy = -1.4 * wind - 0.8 * (s1 + s2); P.pos('body', 0, dy, 0); plant(P, dy);
      P.sq('body', -0.05 * wind + wob(t, 0.38, 0.05, 4, 7) + wob(t, 0.58, 0.05, 4, 7));
      P.rot('head', 8 * (s1 + s2) - 8 * wind, -10 * s1 + 10 * s2, 0).rot('jaw', 10 * wind + 20 * (s1 + s2));
      P.face('eyes', t > 0.05 && t < 1.0 ? 'angry' : undefined); P.lookW = 0.3;
      P.burst(0.37, 'slash', 'foreR', [-6.6, 3.0, 4], { n: 1 }).burst(0.37, 'spark', 'foreR', [-6.6, 3.0, 4], {}).burst(0.57, 'slash', 'foreL', [6.6, 3.0, 4], { n: 1 }).burst(0.57, 'spark', 'foreL', [6.6, 3.0, 4], {});
      P.burst(0.58, 'star', 'body', [0, 12, 10], { n: 4 });
      fizz(P, t, 20);
    } },
    // special (Pyro): snaps his claws to light the stick, winds up and lobs it — it tumbles through
    // the air and goes off: a blast of fire, smoke and flying rock
    special: { len: 2.6, next: 'idle', f(P, t) {
      const snap = bump(t, 0.12, 0.42), wind = seg(t, 0.45, 0.85, E.inout) * (1 - seg(t, 0.85, 0.95, E.in3));
      const thr = seg(t, 0.85, 0.97, E.out3) * (1 - seg(t, 1.2, 1.8, E.inout));
      P.rot('armL', -60 * snap, 0, 30 * snap).rot('foreL', -70 * snap, 0, 0);
      P.burst(0.3, 'spark', 'foreL', [6.6, 4, 2], {}).burst(0.3, 'fusespark', 'foreL', [6.6, 4, 2], { n: 12 });
      P.rot('armR', -150 * wind - 40 * thr + 60 * thr, 0, 20 * wind).rot('foreR', -60 * wind + 30 * thr, 0, 0);
      P.rot('armR', -100 * thr, 0, 0);
      P.rot('body', -16 * wind + 22 * thr, 20 * wind - 20 * thr, 0).pos('body', 0, -0.8 * wind, -1 * wind + 2 * thr);
      P.rot('head', -10 * wind + 10 * thr, -10 * wind, 0).rot('jaw', 6 + 30 * seg(t, 1.6, 1.7) * (1 - seg(t, 2.2, 2.5)) * Math.max(0.3, Math.abs(wave(t, 8))));
      const thrown = t >= 0.92;
      P.face('held', thrown && t < 2.3 ? 'off' : 'on').face('bomb', thrown && t < 1.6 ? 'on' : 'off');
      if (!thrown || t > 2.3) fizz(P, t, 30); else P.face('hspark', 'off');
      if (thrown && t < 1.6) {
        const u = seg(t, 0.92, 1.6, E.lin), from = R.at(P, 'held', HELD_C), to = R.V([0, 1.5, 44]);
        const pos = from.clone().lerp(to, u); pos.y += Math.sin(u * Math.PI) * 14;
        R.place(P, 'bomb', pos); P.rot('bomb', 540 * u, 0, 300 * u);
        P.face('bmbspark', cyc(t, 14)); P.stream('fusespark', 'bomb', BOMB_FUSE, { rate: 40, spread: 1, key: 'm' });
      }
      const B = [0, 2, 44];
      P.burst(1.6, 'boom', 'root', B, {}).burst(1.6, 'fire', 'root', B, { n: 34, spread: 1, speed: 3 }).burst(1.6, 'shockring', 'root', B, { scale: 2.2 });
      P.burst(1.62, 'smoke', 'root', B, { n: 16, spread: 1, speed: 2.2, scale: 2.2 }).burst(1.6, 'rock', 'root', B, { n: 14, dir: [0, 1, 0], spread: 0.8, speed: 1.6 });
      P.burst(1.6, 'tntbit', 'root', B, { n: 12, dir: [0, 1, 0] }).burst(1.62, 'spark', 'root', B, { n: 4, spread: 1 }).burst(1.66, 'ember', 'root', B, { n: 20, spread: 1, speed: 2 });
      P.face('eyes', t > 1.6 && t < 2.4 ? 'happy' : t > 0.45 ? 'angry' : undefined); P.lookW = 1 - wind;
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0, -2.6 * k).rot('body', -14 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.12 * k);
      P.rot('head', -16 * k, 0, 10 * k).rot('jaw', 22 * k);
      P.rot('armR', 30 * k, 0, 30 * k).rot('armL', 30 * k, 0, -30 * k);
      P.face('eyes', t < 0.42 ? 'shut' : undefined); eyeSq(P, 1 + 0.25 * k, 1 - 0.3 * k);
      P.burst(0.02, 'spark', 'body', [0, 13, 6], {}).burst(0.03, 'fusespark', 'band', BAND_TOPS[2], { n: 14 }).burst(0.03, 'sweat', 'head', [6, 25, 3], { n: 2, dir: [1, 0.6, 0] });
    } },
    // reels, the fuses fizzle out in puffs of smoke, and he topples onto his side
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, 0.9, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', wave(t, 1.4) * 8 * dizzy, wave(t, 1.6) * 14 * dizzy, wave(t, 2.1) * 10 * dizzy).rot('head', 0, 0, wave(t, 2.1, 1) * 14 * dizzy);
      const dy = -1.4 * dizzy; P.pos('body', 0, dy, 0); plant(P, dy);
      P.rot('root', 0, 0, 82 * fall).pos('root', 10.5 * fall, 4.8 * fall, 0);
      P.rot('legR', -20 * fall, 0, -24 * fall).rot('legL', 26 * fall, 0, -30 * fall).rot('armL', -30 * fall, 0, -40 * fall).rot('armR', 20 * fall, 0, 30 * fall).rot('jaw', 24 * fall);
      P.face('eyes', t < 0.95 ? 'swirl' : 'x').face('held', 'on'); P.blinkOK = false; P.lookW = 1 - dizzy;
      if (t < 0.9) fizz(P, t, 12);
      P.burst(0.9, 'smoke', 'held', HELD_FUSE, { n: 3, scale: 0.6 }).burst(0.92, 'smoke', 'band', BAND_TOPS[1], { n: 2, scale: 0.6 }).burst(0.94, 'smoke', 'band', BAND_TOPS[3], { n: 2, scale: 0.6 });
      P.burst(1.38, 'dust', 'root', [0, 1, 0], { n: 8, spread: 1 }).burst(0.3, 'star', 'head', [0, 29, 2], { n: 5 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      P.rot('root', 0, 0, 82).pos('root', 10.5, 4.8, 0);
      P.rot('legR', -20 + wave(t, 0.4) * 4, 0, -24).rot('legL', 26, 0, -30).rot('armL', -30, 0, -40).rot('armR', 20, 0, 30 + wave(t, 0.4, 1) * 3).rot('jaw', 24);
      P.rot('tail4', 12 * bump(t, 1.2, 1.6), 0, 0);
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.stream('smoke', 'held', HELD_FUSE, { rate: 1.2, scale: 0.5 }).stream('smoke', 'tail4', [0.8, 5.0, -26], { rate: 1, scale: 0.5 });
    } },
    // victory: cackles and hurls a lit stick straight up — it bursts overhead like a firework
    win: { len: 2.4, next: 'idle', f(P, t) {
      const up = seg(t, 0.25, 0.45, E.back) * (1 - seg(t, 0.55, 0.8, E.inout));
      P.rot('armR', -160 * up, 0, 10 * up).rot('foreR', -20 * up, 0, 0);
      const flying = t > 0.45 && t < 1.25;
      P.face('held', flying ? 'off' : 'on').face('bomb', flying ? 'on' : 'off');
      if (flying) { const u = seg(t, 0.45, 1.25, E.out), p0 = R.at(P, 'held', HELD_C); p0.y += u * 30; p0.x *= 1 - u; R.place(P, 'bomb', p0); P.rot('bomb', 0, 0, 720 * u); P.face('bmbspark', cyc(t, 14)); P.stream('fusespark', 'bomb', BOMB_FUSE, { rate: 40, key: 'w' }); }
      const H = [-1, 40, 6];
      P.burst(1.25, 'boom', 'root', H, { scale: 0.7 }).burst(1.25, 'spark', 'root', H, { n: 6, spread: 1 }).burst(1.25, 'star', 'root', H, { n: 10, spread: 1, speed: 2 }).burst(1.26, 'tntbit', 'root', H, { n: 14 });
      const laugh = seg(t, 1.2, 1.35) * (1 - seg(t, 2.1, 2.4));
      P.rot('head', -20 * up - 22 * laugh + 4 * wave(t, 9) * laugh, 0, 0).rot('jaw', 14 * up + 20 * laugh + 10 * Math.max(0, wave(t, 9)) * laugh);
      P.rot('armL', -60 * laugh, 0, -40 * laugh).rot('foreL', -50 * laugh, 0, 0).rot('body', -8 * laugh + 2 * wave(t, 9) * laugh, 0, 0);
      const h = t < 1.25 ? 0 : hop(t - 1.25, 0.55, 3.5, { crouch: 0.8 }).y; P.pos('root', 0, Math.max(0, t > 1.25 && t < 1.8 ? h : 0), 0);
      P.face('eyes', laugh > 0.3 ? 'happy' : up > 0.3 ? 'wide' : undefined);
      if (!flying) fizz(P, t, 20);
    } },
    // asleep sitting slumped against nothing, the stick hugged to his chest, fuses dark; Zzz
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * Math.PI * 2), dy = -4.2 + br * 0.3;
      P.pos('body', 0, dy, 0.8).rot('body', -4 + br * 2, 0, 0).sq('body', -0.04 + br * 0.03);
      P.pos('legR', 0, -3.4, 2.4).rot('legR', -70, 10, 0).pos('legL', 0, -3.4, 2.4).rot('legL', -70, -10, 0);
      P.pos('footR', -0.4, 1.4, 4.4).rot('footR', -60, 0, 0).pos('footL', 0.4, 1.4, 4.4).rot('footL', -60, 0, 0);
      P.rot('armR', -50, 0, -30).rot('foreR', -70, 0, 0).rot('armL', -40, 0, 20).rot('foreL', -80, 0, 0);
      P.rot('head', 20 + br * 3, 0, 12).rot('jaw', 10 + Math.max(0, br) * 6);
      P.rot('tail1', -16, -40, 0).rot('tail2', -10, -30, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [5, 28, 4], {}).burst(2.0, 'z', 'head', [5, 28, 4], {});
    } },
    // fidget: snaps his claws to light the fuse, watches it burn down with wide eyes… and pinches it out at the last second
    fuse: { len: 3.2, next: 'idle', f(P, t) {
      const lift = seg(t, 0.1, 0.4, E.out3) * (1 - seg(t, 2.7, 3.0, E.inout));
      P.rot('armR', -40 * lift, 0, -10 * lift).rot('foreR', -70 * lift, 0, 0);
      const snapA = bump(t, 0.4, 0.7);
      const fuseTip = R.at(P, 'held', HELD_FUSE);
      const reachL = seg(t, 0.35, 0.55) * (1 - seg(t, 0.7, 0.9)) + seg(t, 2.05, 2.25, E.out) * (1 - seg(t, 2.6, 2.9));
      if (reachL > 0) R.reach(P, 'armL', 'foreL', fuseTip.clone().add(R.V([1.6, 0.6, 0.6])), { pole: POLE_L, w: reachL });
      P.burst(0.62, 'spark', 'held', HELD_FUSE, {}).burst(0.62, 'fusespark', 'held', HELD_FUSE, { n: 10 });
      const lit = t > 0.62 && t < 2.2;
      if (lit) fizz(P, t, 40 + t * 20);
      const stare = seg(t, 0.8, 1.0) * (1 - seg(t, 2.2, 2.4));
      P.rot('head', 16 * stare + wave(t, 7) * 2 * seg(t, 1.6, 2.1), -10 * stare, 8 * stare).rot('jaw', 4 + 10 * stare);
      P.pos('body', 0, -0.6 * stare, 0); plant(P, -0.6 * stare);
      P.face('eyes', t > 0.8 && t < 2.2 ? 'shock' : t > 2.25 && t < 2.9 ? 'happy' : undefined); P.lookW = 1 - stare;
      eyeSq(P, 1 - 0.1 * stare, 1 + 0.2 * stare); dart(P, 0, 0.3 * stare);
      P.burst(2.2, 'smoke', 'held', HELD_FUSE, { n: 3, scale: 0.6 }).burst(2.25, 'sweat', 'head', [6, 26, 3], { n: 2, dir: [1, 0.5, 0] });
      P.sq('body', wob(t, 2.25, 0.05, 3, 5));
    } },
    // fidget: a wheezing, shoulder-shaking cackle
    cackle: { len: 1.8, next: 'idle', f(P, t) {
      const k = seg(t, 0.05, 0.25) * (1 - seg(t, 1.4, 1.75)), sh = wave(t, 8) * k;
      P.rot('body', -8 * k + sh * 3, 0, sh * 2).rot('head', -18 * k + sh * 5, 0, wave(t, 3) * 5 * k).rot('jaw', 12 * k + 12 * Math.max(0, sh));
      P.rot('armL', -30 * k, 0, -10 * k).rot('foreL', -60 * k, 0, 0).rot('armR', 10 * k + sh * 4, 0, 6 * k);
      P.pos('body', 0, sh * 0.3, 0);
      P.face('eyes', k > 0.3 ? 'happy' : undefined); P.lookW = 1 - k;
      fizz(P, t, 20);
      P.burst(0.4, 'note', 'head', [6, 27, 4], {});
    } },
    // dance: a dirty-deeds stomp — heavy stomps on the beat with a shoulder shimmy, a spinning toss of
    // the lit stick while he turns on the spot, and a finish with a fountain of sparks held high
    dance: { len: 2.7, next: 'idle', f(P, t) {
      const S = 1 - seg(t, 1.3, 1.4), toss = bump(t, 1.4, 2.0), D = seg(t, 2.05, 2.2, E.back) * (1 - seg(t, 2.5, 2.7));
      let dy = 0;
      for (const [t0, sd] of [[0.1, 'R'], [0.45, 'L'], [0.8, 'R'], [1.1, 'L']]) {
        const k = bump(t, t0, t0 + 0.28), land = t > t0 + 0.28 ? wob(t, t0 + 0.28, -0.6, 4, 9) : 0;
        P.pos('foot' + sd, 0, 2.8 * k, 0.8 * k).pos('leg' + sd, 0, 1.8 * k, 0).rot('body', 0, 0, (sd === 'R' ? 7 : -7) * k);
        dy += land; P.burst(t0 + 0.28, 'dust', 'foot' + sd, [sd === 'R' ? -3.4 : 3.4, 0.4, 2], { n: 3, spread: 1, speed: 0.6 });
      }
      P.pos('body', 0, dy - 0.8 * D, 0).rot('body', -6 * D, wave(t, 2.5) * 12 * S, 0).sq('body', dy * 0.04); plant(P, dy - 0.8 * D);
      P.rot('armR', wave(t, 2.5) * 16 * S - 60 * toss - 150 * D, 0, 10 * D).rot('foreR', -20 * S - 40 * toss - 20 * D, 0, 0);
      P.rot('armL', -wave(t, 2.5) * 16 * S - 40 * D, 0, -30 * D).rot('foreL', -30 * S - 40 * D, 0, 0);
      P.pos('held', 0, 7 * toss, -1.5 * toss).rot('held', 0, 0, 540 * seg(t, 1.4, 2.0));
      P.rot('root', 0, 360 * seg(t, 1.45, 1.95, E.inout), 0);
      P.rot('head', 8 * Math.abs(wave(t, 2.5)) * S - 18 * D, wave(t, 2.5, 1) * 10 * S, 0).rot('jaw', 6 + 26 * D + 8 * toss);
      P.face('eyes', D > 0.3 ? 'happy' : toss > 0.3 ? 'wide' : t > 0.1 ? 'angry' : undefined); eyeSq(P, 1, 1 + 0.15 * toss);
      fizz(P, t, 30 + 140 * D);
      P.burst(2.12, 'star', 'held', HELD_FUSE, { n: 6, spread: 1 }).burst(2.14, 'note', 'head', [6, 28, 4], { n: 2 }).burst(2.2, 'riff', 'head', [-6, 28, 4], { n: 3 });
    } },
  },
};
def.anim = anim;
