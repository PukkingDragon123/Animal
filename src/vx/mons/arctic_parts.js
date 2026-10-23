// Shared parts for the Snoozaque line (Snoozaque → Piledrilla → Fluorescape), the Arctic Monkeys
// homage: fluffy snow-monkey fur, pink macaque faces, a glossy slicked-back quiff (with snow on it),
// a black leather jacket with a popped collar, ice (knuckles, crystals, a mirrorball), fluorescent
// fluorite crystal armour, the comb, aviators, a black hollow-body guitar, a chrome crooner mic and
// Chelsea boots. Always-sleepy Cobblemon block eyes (a flat lid block over a sliver of eye), flat-block
// mouths, particles (snow, ice shards, frost puffs, fluorescent glints) and the drip-form colour rules.
// Homage only — no logos, no album art, no likeness.
import { shade, gradient, ramp, shift } from './kit.js';
import { region, ell, stroke, formMap, fromHsl, gilt, lacquer } from './story_parts.js';
import { defineFx } from '../fx.js';
import { blockEye, arch, shut, slope, flat } from './blockeyes.js';

export { B, L, both, twin, acc, region, ell, stroke, goldP, silverP, chainP, strapP, knit, rib, beat, env, plant } from './story_parts.js';
export { rod } from './raccoon_parts.js';

const side = (f) => f !== 'up' && f !== 'down';
const fill = (p, w, h, fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c != null) p.px(x, y, c); } };

// ---------------------------------------------------------------- palettes
export const FUR = {
  // Snoozaque: warm silver-beige snow-monkey fluff
  snooz: { c: '#aa967e', hi: '#cebca2', lo: '#806c58', deep: '#5a4a3c', belly: '#d8c8b0', bellyLo: '#b4a088' },
  // Piledrilla: frosty white gorilla fur with blue shadows
  pile: { c: '#d6dee8', hi: '#f6faff', lo: '#a2b0c4', deep: '#6c7a92', belly: '#5a5868', bellyLo: '#3e3c4a' },
  // Fluorescape: midnight indigo with violet light
  fluo: { c: '#4a40a0', hi: '#7c6cdc', lo: '#2c2668', deep: '#181240', belly: '#5a50b8', bellyLo: '#3a3290' },
};
export const A = {
  pink: '#f08a9a', pinkHi: '#ffb4bc', pinkLo: '#c8607a', pinkDeep: '#8e3a52', lidPink: '#d8687e',
  dusk: '#b8899a', duskHi: '#d8aab8', duskLo: '#8a5c70', lidDusk: '#9a6a7e',
  lilac: '#c8a8f0', lilacHi: '#eadcff', lilacLo: '#9a78c8', lidLilac: '#9e7ad0',
  hair: '#22202a', hairHi: '#4c4a5c', hairLo: '#100e16', gloss: '#a8a8c0',
  leather: '#1e1c22', leatherHi: '#44404c', leatherLo: '#0c0b10', zip: '#c8ccd8',
  snow: '#f6faff', snowLo: '#c8d8f0',
  ice: '#bfe6ff', iceHi: '#f2fbff', iceLo: '#74b8ec', iceDeep: '#3c78c8',
  cyan: '#5ff4ff', cyanHi: '#d8ffff', cyanLo: '#1ec0e0', mag: '#ff5ad8', magHi: '#ffc8f4', magLo: '#c022a8', lime: '#b8ff4a',
  gold: '#ffd23a', ink: '#120e14', mouth: '#4a1424', tongue: '#ff8a9a', fang: '#fbf6ec',
};

// ---------------------------------------------------------------- fur, skin, hair
// fluffy fur: clean top-lit bands with staggered soft tufts (a lit tip over a darker "v"), and a
// ragged fringe along the bottom edge (o.fringe)
export function furP(F, o = {}) {
  const sx = o.sx || 6, sy = o.sy || 5;
  return (p, w, h, face) => {
    const band = (x, y) => (face === 'up' ? F.hi : face === 'down' ? F.lo : ramp([F.hi, F.c, F.c, F.lo], y / Math.max(1, h - 1), x, y));
    fill(p, w, h, band);
    if (face === 'down') return;
    for (let r = 0, y = 1; y < h - 1; y += sy, r++) for (let x = (r % 2) * (sx >> 1); x < w - 1; x += sx) {
      const b = band(x, y); p.px(x, y, shift(b, -0.1)).px(x + 1, y + 1, shift(b, -0.14)).px(x + 2, y, shift(b, -0.1));
      if (y > 0) p.px(x + 1, y - 1, shift(b, 0.1));
    }
    if (o.fringe && side(face)) for (let x = 0; x < w; x++) { const k = [0, 1, 2, 1][x % 4]; for (let j = 0; j < k; j++) p.px(x, h - 1 - j, 0); p.px(x, h - 1 - k, F.deep); }
  };
}
// a pale belly / chest patch on the south face (soft ragged oval)
export function bellyP(F, o = {}) {
  const fur = furP(F, o);
  return (p, w, h, face, cube) => {
    fur(p, w, h, face, cube);
    if (face !== 'south') return;
    const cx = w / 2, cy = h * (o.cy ?? 0.58), rx = w * (o.rx ?? 0.4), ry = h * (o.ry ?? 0.5);
    region(p, w, h, (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1 - ((x * 2 + y) % 3) * 0.04, (x, y) => ((x + y * 2) % 7 === 0 ? F.bellyLo : y < cy - ry * 0.4 ? shift(F.belly, 0.06) : F.belly));
  };
}
// bare skin (faces, muzzles, hands, ears)
export const skinP = (c, hi, lo) => (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? hi : face === 'down' ? lo : ramp([hi, c, c, lo], y / Math.max(1, h - 1), x, y)));
// a monkey face on a fur head's south face: a bare heart-shaped mask (two brow lobes over the eyes and
// a rounded chin), a frame of lighter fur. box: the head's [x0, top, w, h] in model units
export function monkeyFace(F, S, box, o = {}) {
  const fur = furP(F, o);
  return (p, w, h, face, cube) => {
    fur(p, w, h, face, cube);
    if (face !== 'south') return;
    const X = (mx) => ((mx - box[0]) / box[2]) * w, Y = (my) => ((box[1] - my) / box[3]) * h, U = w / box[2];
    const lobes = (o.lobes || [[-2.3, 19.6], [2.3, 19.6]]).map(([a, b]) => [X(a), Y(b)]), lr = (o.lobeR || 2.9) * U, chin = [X(0), Y(o.chinY ?? 16.6)], crx = (o.chinRx || 3.8) * U, cry = (o.chinRy || 3.2) * U;
    const inside = (x, y) => lobes.some(([cx, cy]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 < lr * lr) || ((x + 0.5 - chin[0]) / crx) ** 2 + ((y + 0.5 - chin[1]) / cry) ** 2 < 1;
    const rim = (x, y) => !inside(x, y) && (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1) || inside(x - 2, y) || inside(x + 2, y));
    region(p, w, h, rim, F.hi);
    region(p, w, h, inside, (x, y) => (y < chin[1] - cry * 1.4 ? S[1] : (x + y * 3) % 11 === 0 ? S[2] : S[0]));
  };
}
// the slicked quiff: glossy near-black hair combed back in parallel streaks, a lit band on the roll
export const quiffP = (o = {}) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => {
    if (face === 'down') return A.hairLo;
    const t = face === 'up' ? 0.25 : y / Math.max(1, h - 1);
    let c = ramp([A.hairHi, A.hair, A.hair, A.hairLo], t, x, y);
    const k = (x + Math.floor(y * (o.slant ?? 0.6))) % 4;               // comb streaks
    if (k === 0) c = shift(c, -0.3); else if (k === 2 && t < 0.6) c = shift(c, 0.12);
    if (face !== 'up' && Math.abs(y - h * (o.band ?? 0.3)) < 1 && x % 3 !== 2) c = A.gloss;     // the shine
    if (face === 'up') c = x % 3 === 0 ? shift(A.hair, -0.3) : x % 3 === 1 && y % 5 < 2 ? A.gloss : A.hair;
    return c;
  });
};
// a snow cap: bright, with a blue shadow along the bottom and a few sparkles
export const snowP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' ? A.snowLo : face === 'up' ? ((x * 5 + y * 3) % 13 === 0 ? '#ffffff' : A.snow) : y >= h - 1 ? A.snowLo : (x * 7 + y) % 9 === 0 ? '#e0ecff' : A.snow));
// black leather: soft creases, a lit top edge, stitched seams; o.zip draws a zipper down one edge, o.lapel a lapel line
export const leatherP = (o = {}) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => {
    if (face === 'up') return A.leatherHi;
    if (face === 'down') return A.leatherLo;
    let c = ramp([A.leatherHi, A.leather, A.leather, A.leatherLo], y / Math.max(1, h - 1), x, y);
    if ((x * 2 + y * 5) % 17 === 0) c = shift(c, 0.14);                    // creases catching the light
    return c;
  });
  if (!side(face)) return;
  if (o.seam) for (let y = 1; y < h - 1; y += 2) p.px(Math.floor(w * o.seam), y, '#34303c');
  if (o.zip !== undefined && (face === 'south' || face === 'north')) { const x = o.zip < 0 ? w - 1 : o.zip; for (let y = 0; y < h; y++) p.px(x, y, y % 2 ? A.zip : '#7a7e8a'); }
  if (o.lapel && face === 'south') for (let y = 0; y < Math.min(h, o.lapel); y++) p.px(o.lapelX < 0 ? Math.max(0, w - 1 - Math.floor(y * 0.6)) : Math.min(w - 1, Math.floor(y * 0.6)), y, '#4e4a58');
  for (let x = 0; x < w; x++) p.px(x, 0, A.leatherHi);
};
// ice: pale translucent blue with white facet edges and a few hairline cracks
export const iceP = (o = {}) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => {
    if (face === 'up') return (x + y) % 5 === 0 ? A.iceHi : A.ice;
    if (face === 'down') return A.iceLo;
    const t = y / Math.max(1, h - 1), d = (x + y) % 9;
    let c = ramp([A.iceHi, A.ice, A.ice, A.iceLo], t, x, y);
    if (d === 0) c = A.iceHi; else if (d === 4 && t > 0.3) c = shift(A.iceLo, -0.06);
    return c;
  });
  if (side(face) && o.crack !== false) { stroke(p, [[w * 0.2, 0], [w * 0.35, h * 0.4], [w * 0.28, h * 0.7]], A.iceDeep, 1); stroke(p, [[w * 0.75, h * 0.2], [w * 0.62, h * 0.55]], '#ffffff', 1); }
};
// a fluorescent crystal (glow cube): a flat bright body, a white facet line and a darker base band
export const crystalP = (c, hi, lo) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? hi : face === 'down' ? lo : y >= h - Math.max(1, Math.floor(h * 0.25)) ? lo : x === 0 || y === 0 ? hi : c));
  if (side(face) && w > 2) for (let y = 1; y < h - 1; y++) if ((y + 1) % 4 === 0) p.px(Math.min(w - 2, 1 + (y % 3)), y, '#ffffff');
};
// a cut gem facet plate (unlit armour): the crystal colour in flat facets with white edges
export const facetP = (c, hi, lo) => (p, w, h, face) => {
  fill(p, w, h, (x, y) => {
    if (face === 'up') return hi; if (face === 'down') return lo;
    const u = (x + 0.5) / w, v = (y + 0.5) / h, g = 0.32;                       // a girdle line, a crown above, a V of pavilion facets below
    if (Math.abs(v - g) < 0.5 / h) return '#ffffff';
    if (v < g) return u < 0.33 ? hi : u > 0.66 ? c : shift(hi, -0.06);
    const k = (v - g) / (1 - g), l = 0.5 - 0.5 * (1 - k), r = 0.5 + 0.5 * (1 - k);
    if (Math.abs(u - l) < 0.6 / w || Math.abs(u - r) < 0.6 / w) return shift(hi, 0.1);
    return u < l ? c : u > r ? lo : shift(c, -0.08);
  });
};
// ---------------------------------------------------------------- props
export const combP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a3036' : y === 0 ? '#5a4a52' : '#2a2026')); if (face === 'east' || face === 'west') for (let x = 0; x < w; x += 2) for (let y = Math.floor(h / 2); y < h; y++) p.px(x, y, 0); };
export const lensP = (tint) => (p, w, h, face) => { fill(p, w, h, (x, y) => (face !== 'south' ? '#c89a2a' : x === 0 || x === w - 1 || y === 0 || y === h - 1 ? '#e0b040' : y < h / 2 ? shift(tint, 0.12) : tint)); if (face === 'south' && w > 3) p.px(1, 1, '#ffffff'); };
export const goldWireP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#fff0a0' : '#d8a62a'));
// the black hollow-body: cream binding, two f-holes, a tortoiseshell guard and gold hardware
export const hollowBodyP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' || face === 'down' || x === 0 || x === w - 1 || y === 0 || y === h - 1 ? '#efe4c8' : (x + y) % 13 === 0 ? '#2e2a34' : '#16141a'));
  if (face !== 'north' && face !== 'south') return;
  for (const fx of [0.22, 0.78]) { const x = Math.round(fx * w); for (let y = Math.round(h * 0.3); y < Math.round(h * 0.7); y++) p.px(x + (y > h * 0.5 ? 1 : 0), y, '#3a3240'); }
  region(p, w, h, (x, y) => x > w * 0.55 && x < w * 0.82 && y > h * 0.55 && y < h * 0.85, (x, y) => ((x + y) % 3 ? '#7a3a1a' : '#c8782a'));
  for (const yy of [0.42, 0.6]) for (let x = Math.round(w * 0.38); x < Math.round(w * 0.62); x++) p.px(x, Math.round(yy * h), '#d8b040');
  for (const dx of [0.45, 0.5, 0.55]) for (let y = 0; y < Math.round(h * 0.8); y++) if (y % 3) p.px(Math.round(dx * w), y, '#d8d0c0');
};
export const fretboardP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'south' || face === 'north' ? (y % 4 === 0 ? '#d8d0c0' : '#2a1a14') : '#16141a')); };
export const headP = (p, w, h, face) => { fill(p, w, h, () => '#16141a'); if (face === 'south' || face === 'north') for (let y = 1; y < h; y += 2) { p.px(0, y, '#d8b040'); p.px(w - 1, y, '#d8b040'); } };
// the mirrorball: a grid of mirror tiles in ice blues, a few flashing white
export const mirrorP = (p, w, h, face) => fill(p, w, h, (x, y) => { const tx = Math.floor(x / 2), ty = Math.floor(y / 2), k = (tx * 7 + ty * 3 + (face === 'east' ? 2 : 0)) % 9; return x % 2 === 1 && y % 2 === 1 ? '#5a7898' : k === 0 ? '#ffffff' : k < 4 ? '#c8e4ff' : k < 7 ? '#8ab4e0' : '#e8f4ff'; });
// a chrome crooner's mic: a grille head with ribs and a glint
export const micP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? '#ffffff' : y % 2 === 0 ? '#e8ecf4' : x % 2 ? '#8a90a0' : '#c0c6d4'));
export const chromeP = gradient(['#ffffff', '#d8dce8', '#9ca2b4', '#5a6074']);
// Chelsea boots: glossy black with an elastic side panel and a Cuban heel
export const bootP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a3640' : ramp(['#3a3640', '#16141a', '#0c0b10'], y / Math.max(1, h - 1), x, y))); if (face === 'east' || face === 'west') for (let y = 1; y < h - 1; y++) p.px(Math.floor(w / 2), y, '#4a4652'); if (side(face)) p.px(1, 1, '#8a8694'); };
export const heelP = (p, w, h) => fill(p, w, h, (x, y) => (y === h - 1 ? '#0c0b10' : '#5a3a26'));

// ---------------------------------------------------------------- eyes: always sleepy (§8 block eyes)
// A flat lid block (the face's lid skin, 'c') sits over the top of the eye, a dark lid line under it,
// and only a sliver of white, a two-tone iris block and a pupil block shows beneath. Eyes open properly
// only when shocked.
function sleepyEyes(E, o) {
  const lo = (y, m = {}) => blockEye(E, flat(y), { skin: true, ...m });
  return {
    open: lo(o.lid, { hi: o.hiOpen }),
    sleepy: lo(o.lid + 1, { hi: [] }),
    smug: blockEye(E, slope(0, o.lid - 1, E.w, o.lid + 1), { skin: true, hi: o.hiOpen }),
    angry: blockEye(E, slope(0, o.lid - 2, E.w, o.lid + 2), { skin: true, hi: [], pupil: o.pupilIn }),
    sad: blockEye(E, slope(0, o.lid + 1, E.w, o.lid - 2), { skin: true, hi: o.hiOpen, pupil: o.pupilLow }),
    wide: blockEye(E, flat(E.eye[1] - 1), { skin: true }),
    shock: blockEye(E, flat(E.eye[1] - 1), { skin: true, noIris: true, pupil: o.pupilSmall, hi: [], glint: [] }),
    happy: arch(E, E.eye[0], E.eye[2], o.lid + 2, o.lid - 1, 2),
    closed: shut(E, E.eye[0], E.eye[2], o.lid, 2, 1),
  };
}
// Snoozaque: a wide droopy block, amber-brown iris
const SE = { w: 11, h: 8, eye: [1, 1, 10, 7], cut: [1, 1, 1, 2], iris: [4, 1, 9, 7], dark: 2, pupil: [6, 2, 8, 6], hi: [[5, 2], [6, 2]], glint: [[8, 6]], t: 1 };
export const SNOOZ_EYES = { line: '#2a1418', pupilColor: '#1a0c0a', iris: '#c07a2a', irisDark: '#7a4416', accent: A.lidPink, map: sleepyEyes(SE, { lid: 4, hiOpen: [[5, 5]], pupilIn: [7, 3, 9, 6], pupilLow: [5, 4, 7, 7], pupilSmall: [5, 3, 6, 4] }) };
// Piledrilla: narrower, deep-set, heavier lids, dark brown iris
const PE = { w: 11, h: 7, eye: [1, 1, 10, 6], cut: [1, 2, 1, 2], iris: [4, 1, 9, 6], dark: 2, pupil: [6, 2, 8, 5], hi: [[5, 2]], glint: [[8, 5]], t: 1 };
export const PILE_EYES = { line: '#1e0e14', pupilColor: '#100606', iris: '#7a4a2a', irisDark: '#42241a', accent: A.lidDusk, map: sleepyEyes(PE, { lid: 4, hiOpen: [[5, 5]], pupilIn: [7, 3, 9, 5], pupilLow: [5, 4, 7, 6], pupilSmall: [5, 3, 6, 4] }) };
// Fluorescape: a tall block with a fluorescent cyan iris (the eyes are unlit, so they shine flat)
const FE = { w: 12, h: 9, eye: [1, 1, 11, 8], cut: [1, 2, 1, 2], iris: [4, 1, 10, 8], dark: 2, pupil: [6, 3, 8, 7], hi: [[5, 3], [5, 4]], glint: [[9, 7]], t: 1 };
export const FLUO_EYES = { line: '#100820', pupilColor: '#0a0620', iris: '#3ef0ff', irisDark: '#1a8ab8', accent: A.lidLilac, map: sleepyEyes(FE, { lid: 5, hiOpen: [[5, 6]], pupilIn: [7, 4, 9, 7], pupilLow: [5, 5, 7, 8], pupilSmall: [6, 4, 7, 5] }) };

// ---------------------------------------------------------------- mouths (flat blocks on the muzzle front, 11 × 4)
const MP = { l: '#2a1018', m: A.mouth, t: A.tongue };
export const MOUTHS = {
  flat: ['...........', '..lllllll..', '...........', '...........'],
  smirk: ['.........l.', '..llllllll.', '...........', '...........'],
  frown: ['...........', '...lllll...', '..l.....l..', '...........'],
  o: ['....mmm....', '...mmmmm...', '...mmtmm...', '....mmm....'],
  open: ['...........', '...........', '...........', '...........'],
};
export function mouthPlanes(at, def = 'flat', k = 1) {
  const w = (11 * k) / 3, h = (4 * k) / 3, states = Object.keys(MOUTHS);
  const paint = (s) => (p) => MOUTHS[s].forEach((r, j) => [...r].forEach((c, i) => { if (MP[c]) p.rect(i * k, j * k, k, k, MP[c]); }));
  return { cubes: states.map((s) => ({ o: [at[0] - w / 2, at[1] - h / 2, at[2]], s: [w, h, 0], plane: 'z', tex: paint(s), id: 'm-' + s, hide: s !== def, outline: false })), slot: { default: def, states: Object.fromEntries(states.map((s) => [s, ['m-' + s]])) } };
}

// ---------------------------------------------------------------- particles
const flakeSpr = (c) => (p, w, h) => { const m = (w - 1) / 2; for (let k = 0; k < w; k++) { p.px(k, m, c); p.px(m, k, c); } for (let k = 1; k < w - 1; k++) { if (Math.abs(k - m) < 2) continue; } p.px(m - 1, m - 1, c).px(m + 1, m + 1, c).px(m - 1, m + 1, c).px(m + 1, m - 1, c).px(m, m, '#ffffff'); };
const shardSpr = (cols) => (p, w, h, f) => { for (let y = 0; y < h; y++) { const hw = Math.round((1 - Math.abs(y - h / 2) / (h / 2)) * (w / 2)); for (let x = -hw; x <= hw; x++) p.px(Math.floor(w / 2) + x, y, x < 0 ? cols[0] : x === 0 ? cols[1] : cols[2]); } if (f) p.px(Math.floor(w / 2), 1, '#ffffff'); };
const puffSpr = (c, lo) => (p, w, h) => { const blobs = [[0.5, 0.55, 0.36], [0.3, 0.45, 0.25], [0.7, 0.42, 0.26], [0.52, 0.28, 0.24]]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let d = 9; for (const [bx, by, r] of blobs) d = Math.min(d, Math.hypot((x + 0.5) / w - bx, (y + 0.5) / h - by) / r); if (d > 1) continue; p.px(x, y, d > 0.8 ? lo : (x + y) % 5 === 0 ? '#ffffff' : c); } };
const glintSpr = (c) => (p, w, h) => { const m = (w - 1) / 2; for (let k = 0; k < w; k++) { const d = Math.abs(k - m) / m; p.px(k, m, d < 0.3 ? '#ffffff' : c); p.px(m, k, d < 0.3 ? '#ffffff' : c); } };
const noteSpr = (c, lo) => (p, w, h) => { p.rect(1, h - 4, 4, 3, c); p.px(0, h - 3, c); p.px(5, h - 3, lo); p.vl(4, 1, h - 4, c); p.rect(5, 1, 2, 2, c); p.px(7, 3, c); p.px(7, 4, lo); };
export const AMFX = {
  snow: defineFx('am-snow', { w: 5, h: 5, paint: flakeSpr('#e8f4ff'), life: [1.2, 2.0], size: [0.05, 0.05], speed: [0.3, 0.8], grav: 0.6, drag: 1.6, spread: 1, flutter: true }),
  shard: defineFx('am-shard', { w: 5, h: 9, frames: [0, 1].map((f) => (p, w, h) => shardSpr(['#e8f8ff', '#ffffff', '#7ab8ec'])(p, w, h, f)), life: [0.5, 0.9], size: [0.07, 0.06], speed: [2, 3.6], grav: 8, drag: 0.4, spread: 0.8, spin: 9 }),
  frost: defineFx('am-frost', { w: 12, h: 10, paint: puffSpr('#e8f6ff', '#9cc8f0'), life: [0.5, 0.9], size: [0.06, 0.28], speed: [0.5, 1.4], grav: -0.3, drag: 2.4, spread: 0.5, fade: true, spin: 0.8 }),
  breath: defineFx('am-breath', { w: 12, h: 10, paint: puffSpr('#d8f2ff', '#7ab8ec'), life: [0.4, 0.7], size: [0.08, 0.4], speed: [3.2, 4.6], grav: -0.4, drag: 2.6, spread: 0.2, fade: true, spin: 1 }),
  glint: defineFx('am-glint', { w: 7, h: 7, paint: glintSpr('#8af6ff'), glow: true, life: [0.4, 0.8], size: [0.08, 0.02], speed: [0.1, 0.6], grav: 0, drag: 1, spread: 1, fade: true }),
  glintMag: defineFx('am-glint-mag', { w: 7, h: 7, paint: glintSpr('#ff8ae8'), glow: true, life: [0.4, 0.8], size: [0.08, 0.02], speed: [0.1, 0.6], grav: 0, drag: 1, spread: 1, fade: true }),
  glintGold: defineFx('am-glint-gold', { w: 7, h: 7, paint: glintSpr('#ffd84a'), glow: true, life: [0.4, 0.8], size: [0.08, 0.02], speed: [0.1, 0.6], grav: 0, drag: 1, spread: 1, fade: true }),
  note: defineFx('am-note', { w: 8, h: 12, paint: noteSpr('#8ad8ff', '#3a78c8'), life: [1.1, 1.5], size: [0.13, 0.13], speed: [0.4, 0.6], grav: -0.5, drag: 0.6, spread: 0.6, wob: 1.2, fade: true }),
  noteGold: defineFx('am-note-gold', { w: 8, h: 12, paint: noteSpr('#ffd23a', '#a8701a'), glow: true, life: [1.1, 1.5], size: [0.13, 0.13], speed: [0.4, 0.6], grav: -0.5, drag: 0.6, spread: 0.6, wob: 1.2, fade: true }),
  ring: defineFx('am-ring', { w: 40, h: 40, paint: (p, w) => { const m = (w - 1) / 2; for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - m, y - m), a = Math.atan2(y - m, x - m), R = m - 1.5 + (Math.round((a / Math.PI) * 8) % 2 ? 1 : -0.5); if (Math.abs(d - R) < 1.1) p.px(x, y, d > R ? '#8ad8ff' : '#f0fbff'); } }, glow: true, life: [0.32, 0.32], size: [0.15, 1.5], speed: [0, 0], grav: 0, fade: true }),
};

// ---------------------------------------------------------------- the ultra-drip forms
// fur → black lacquer, pale fur / belly / snow → gold, faces stay pink, the leather stays black, ice
// turns to gold-veined diamond (white with gold), fluorescent glows go electric blue
export const SCARF = { c: '#c83a4a', hi: '#ff6a6a', lo: '#7a1a2a' };
export const arcticForm = (F, extra = {}) => formMap(({ h, s, l }, glow, hex) => {
  if (glow) { if (s <= 0.2) return undefined; if ((h > 270 && h < 345) || (h > 55 && h < 110)) return gilt(Math.max(0.6, l)); return fromHsl(198, Math.min(0.9, s), Math.min(0.95, Math.max(0.68, l))); }
  if (extra[hex]) return extra[hex];
  if (F && hex === F.hi) return 'gold';                                                  // lit fur tufts → gold frosting
  if (F && (hex === F.c || hex === F.lo || hex === F.deep)) return 'black';              // the coat → black lacquer
  if (F && (hex === F.belly || hex === F.bellyLo)) return l > 0.6 ? 'gold' : 'black';
  if (hex === SCARF.c || hex === SCARF.hi) return 'gold'; if (hex === SCARF.lo) return 'black';
  if (hex === A.hair || hex === A.hairHi || hex === A.hairLo || hex === A.gloss) return hex === A.gloss ? gilt(0.6) : 'black';
  if (h > 185 && h < 240 && s < 0.4) return l > 0.85 ? 'gold' : 'black';                 // frosty white fur (and its shading)
  if (h >= 240 && h < 262 && l < 0.45) return 'black';                                  // indigo fur
  if (h >= 320 || h < 20) return s > 0.3 && l > 0.45 ? 'keep' : undefined;                 // pink skin, tongues stay
  if (s < 0.14) return l > 0.82 ? 'gold' : l < 0.3 ? 'keep' : 'black';                    // white fur → gold, grey → black
  if (h > 185 && h < 225 && l > 0.6) return l > 0.85 ? '#ffffff' : gilt(l * 0.9);          // ice → diamond with gold
  return undefined;
});
export const AM_FX_MAP = { 'am-glint': AMFX.glintGold, 'am-glint-mag': AMFX.glintGold, 'am-note': AMFX.noteGold };
export { gilt, lacquer, fromHsl };
