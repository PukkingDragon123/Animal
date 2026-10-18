// Kanizumo — Coach Gonda's partner (Hydro/Geo). A big red crab standing up on its
// hind legs like a sumo wrestler in the crouch before the charge: a cream sumo belly
// hanging over a navy mawashi with stiff white sagari cords, two huge pincers worn
// like flat open palms for slapping, little walking legs along the shell, cool and
// steady stalk eyes under heavy lids, a jutting jaw that foams bubbles, a black
// ginkgo-leaf topknot tied with a white cord, and the stern face of a Heike crab
// embossed on the back of its shell. Calm, heavy, unshakeable.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, gradient, poly, ramp, shift, h2 } from './kit.js';

const C = {
  shell: '#d23a38', shellHi: '#f6765a', shellLo: '#982438', deep: '#5c1430', shine: '#ffc0a2',
  belly: '#ffd8a6', bellyHi: '#fff0d2', bellyLo: '#e2a274', bellyLine: '#c8886a',
  palm: '#ffd4b4', palmHi: '#fff0de', palmLo: '#eaa286', palmLine: '#c87668',
  belt: '#2e3c7c', beltHi: '#5068b4', beltLo: '#1c2554', beltDeep: '#11163a',
  cord: '#f6f6fc', cordLo: '#c6cae2', cordDeep: '#8e94bc',
  hair: '#231c36', hairHi: '#5e5890', hairLo: '#110c1c',
  tie: '#fff8e6', tieLo: '#d6ccba',
  tip: ['#8e4250', '#5e2638', '#3c1428', '#240a18'],
  ink: '#1e0c18', white: '#ffffff', eyeLo: '#d4d0e2', glint: '#7a96e0',
  mouth: '#3a0c1a',
};
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- painters
// crab shell: clean red bands, a lit rim, sparse raised tubercles (a lit dot over a shadow dot)
function crab(c = C.shell, o = {}) {
  const top = o.top || C.shellHi, bot = o.bottom || C.shellLo, base = shade(c, { top, bottom: bot, grain: 0 }), every = o.every || 6;
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'down' || o.bumps === false) return;
    for (let y = 2; y < h - 2; y += every) for (let x = 1 + ((y / every) & 1) * (every >> 1); x < w - 1; x += every) {
      const j = h2(x, y, o.seed || 5); if (j < 0.34) continue;
      const X = x + (j > 0.8 ? 1 : 0), col = face === 'up' ? top : ramp([top, c, bot], y / Math.max(1, h - 1), X, y);
      p.px(X, y, shift(col, 0.34)); p.px(X + 1, y, shift(col, 0.14)); p.px(X, y + 1, shift(col, -0.2)); p.px(X + 1, y + 1, shift(col, -0.32));
    }
  };
}
const shellP = crab();
const shellDark = crab(shift(C.shell, -0.1), { top: C.shell, bottom: C.deep });
// the top of the carapace: the H-shaped groove of a crab's back between the regions, and its tubercles
function crownP(p, w, h, face, cube) {
  shellP(p, w, h, face, cube);
  if (face !== 'up') return;
  const m = w / 2, G = shift(C.shellHi, -0.35);
  for (const s of [-1, 1]) { for (let y = 2; y < h - 2; y++) p.px(Math.round(m + s * (w * 0.16 + Math.abs(y - h / 2) * 0.35)), y, G); }
  for (let x = Math.round(m - w * 0.16); x <= Math.round(m + w * 0.16); x++) p.px(x, Math.round(h * 0.55), G);
  for (const [fx, fy] of [[0.3, 0.3], [0.7, 0.3], [0.5, 0.25], [0.24, 0.7], [0.76, 0.7]]) { const x = Math.round(fx * w), y = Math.round(fy * h); p.px(x, y, C.shine); p.px(x + 1, y + 1, shift(C.shellHi, -0.2)); }
}
// the stern Heike-crab "game face" embossed on the back of the shell: grooves with lit lips
function heike(p, w, h, face, cube) {
  shellP(p, w, h, face, cube);
  if (face !== 'north') return;
  const G = C.deep, M = shift(C.shellLo, -0.1), L = C.shine, sx = w / 60, sy = h / 30;
  const S = (pts) => pts.map(([x, y]) => [x * sx, y * sy]);
  const groove = (pts, c = G) => { poly(p, S(pts), c); };
  const lip = (x0, y0, x1, y1) => p.line(Math.round(x0 * sx), Math.round(y0 * sy), Math.round(x1 * sx), Math.round(y1 * sy), L);
  for (const m of [1, -1]) {
    const X = (x) => (m > 0 ? x : 60 - x);
    groove([[X(5), 6], [X(10), 3.5], [X(27.5), 12.5], [X(26.5), 15.5]]);               // brows sloping down to the middle
    lip(X(9), 3, X(26), 11);
    groove([[X(14), 15.5], [X(19), 13.6], [X(24), 15.5], [X(22.5), 18.5], [X(15.5), 18.5]], M);   // eye hollows
    p.px(Math.round(X(19) * sx), Math.round(16 * sy), G); p.px(Math.round(X(20) * sx), Math.round(16 * sy), G);
    groove([[X(9), 12], [X(10.5), 12], [X(15), 24], [X(13.5), 24.5]]);               // cheek creases
  }
  groove([[28.6, 13], [31.4, 13], [31.4, 19.5], [28.6, 19.5]], M);                    // nose ridge
  p.px(Math.round(28 * sx), Math.round(20 * sy), G); p.px(Math.round(32 * sx), Math.round(20 * sy), G);
  groove([[14, 27.5], [30, 21.5], [46, 27.5], [44, 29], [30, 24], [16, 29]]);          // the frown
  lip(17, 29.5, 29, 25.5); lip(31, 25.5, 43, 29.5);
}
// cream underside: soft round light (upper left) falling into shadow at the edges and underneath — no rim, it's skin
const roundP = (o = {}) => (p, w, h, face) => {
  if (face !== 'south') {
    const top = face === 'up' ? (o.topC || C.belly) : C.belly;
    shade(face === 'up' ? top : C.bellyLo, { top, bottom: shift(C.bellyLo, -0.14), grain: 0, rim: false })(p, w, h, face);
    return;
  }
  const cx = w * (o.cx ?? 0.44), cy = h * (o.cy ?? 0.32), T = [C.bellyHi, C.belly, C.bellyLo, shift(C.bellyLo, -0.14)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.sqrt(((x - cx) / (w * 0.52)) ** 2 + ((y - cy) / (h * (o.ry ?? 0.8))) ** 2);
    const t = Math.min(3, d * (o.k ?? 2.6)), i = Math.floor(t), f = t - i;
    p.px(x, y, f > 0.82 && i < 3 && ((x + y) & 1) ? T[i + 1] : T[i]);
  }
  if (o.fn) o.fn(p, w, h);
};
// the gut: round and heavy, with a navel low down
const gutP = roundP({ cy: 0.36, ry: 0.85, k: 2.5, fn: (p, w, h) => {
  const nx = Math.round(w / 2) - 1, ny = Math.round(h * 0.66);
  p.rect(nx, ny, 2, 3, C.bellyLine); p.px(nx, ny, shift(C.bellyLine, -0.35)); p.px(nx + 1, ny, shift(C.bellyLine, -0.2));
  p.px(nx, ny + 3, C.bellyHi); p.px(nx + 1, ny + 3, C.bellyHi); p.px(nx - 1, ny + 1, C.bellyLo); p.px(nx + 2, ny + 2, C.bellyLo);
} });
const gutSideP = roundP({ cy: -0.2, ry: 1.2, k: 3.2, topC: C.bellyLo });
const gutTopP = roundP({ cy: 0.9, ry: 1.4, k: 2.2, topC: C.bellyLo });
// the chest: two heavy pecs with a groove between and a crease under each
const chestP = roundP({ cy: 0.36, ry: 0.9, under: 0, fn: (p, w, h) => {
  const m = Math.floor(w / 2);
  for (let y = 1; y < h * 0.55; y++) { p.px(m - 1, y, C.bellyLine); p.px(m, y, C.bellyHi); }
  for (const s of [-1, 1]) for (let k = 0; k < w * 0.36; k++) { const x = m + s * (2 + k), y = Math.round(h * 0.62 + (k / (w * 0.36)) ** 2 * h * 0.2 - 1); p.px(x, y, C.bellyLine); p.px(x, y - 1, C.bellyLo); p.px(x, y + 1, C.bellyHi); }
} });
// palm: a slapping pad of pale shell framed by red, rounded at the corners
function palmP(p, w, h, face, cube) {
  shellP(p, w, h, face, cube);
  if (face !== 'south') return;
  const x0 = 3, x1 = w - 4, y0 = 4, y1 = h - 3;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const cx = Math.min(x - x0, x1 - x), cy = Math.min(y - y0, y1 - y); if (cx + cy < 2) continue;
    const edge = cx === 0 || cy === 0 || cx + cy === 2;
    p.px(x, y, edge ? (y > (y0 + y1) / 2 || x > (x0 + x1) / 2 ? C.palmLine : C.palmLo) : ramp([C.palmHi, C.palm, C.palmLo], (y - y0) / (y1 - y0), x, y));
  }
  for (let x = x0 + 3; x <= x1 - 3; x += 3) p.px(x, y0 + 2, C.palmHi);
}
// brow: the front rim of the shell, a hard ledge above the mouth
const browP = (p, w, h, face, cube) => { crab(C.shell, { top: C.shellHi, bottom: C.deep, bumps: false })(p, w, h, face, cube); if (face === 'south') for (let x = 0; x < w; x++) p.px(x, h - 1, C.deep); };
// fingers: shell with a row of light nubs on the cutting edge (inner side)
const finger = (inner) => (p, w, h, face, cube) => {
  shellP(p, w, h, face, cube);
  if (face === inner) for (let y = 2; y < h - 1; y += 3) { p.px(Math.floor(w / 2), y, C.shine); p.px(Math.floor(w / 2), y + 1, C.shellLo); }
};
const tipP = gradient(C.tip);
// legs: shell segments with small spines along the top and a darker joint band at the far end
const legP = (end = 'east') => (p, w, h, face, cube) => {
  shade(C.shell, { top: C.shellHi, bottom: C.shellLo, grain: 0 })(p, w, h, face, cube);
  if (face === 'up' || face === 'down') return;
  for (let x = 2; x < w - 2; x += 4) { p.px(x, 1, C.shine); p.px(x + 1, 1, C.shellHi); p.px(x, 2, C.shellLo); }
  if (face === 'south' || face === 'north') { const X = (face === 'south') === (end === 'east') ? w - 2 : 1; for (let y = 1; y < h - 1; y++) p.px(X, y, C.shellLo); }
};
const beltP = (p, w, h, face) => {
  shade(C.belt, { top: C.beltHi, bottom: C.beltLo, grain: 0 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  for (const f of [0.36, 0.7]) { const y = Math.round(f * (h - 1)); for (let x = 0; x < w; x++) { p.px(x, y, C.beltDeep); p.px(x, y + 1, shift(C.belt, 0.16)); } }
};
const cordP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = face === 'east' || face === 'north' ? C.cordLo : x === 0 ? C.white : C.cord;
    if (y % 6 === 5) c = C.cordLo;                          // the twists of the stiffened cord
    if (y >= h - 2) c = (x + y) & 1 ? C.cordDeep : C.cordLo;
    p.px(x, y, c);
  }
};
// the ginkgo fan: glossy black strands radiating from the knot (painted in model space so the slabs line up)
const FAN0 = [0, 27];
function fanP(p, w, h, face, cube) {
  const [ox, oy] = cube.o, [sx, sy] = cube.s, top = oy + sy > 33.5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (face !== 'south' && face !== 'north') { p.px(x, y, face === 'up' ? (x % 3 ? C.hairHi : C.hair) : (y === h - 1 ? C.hairLo : C.hair)); continue; }
    const X = face === 'south' ? ox + (x + 0.5) / 3 : ox + sx - (x + 0.5) / 3, Y = oy + sy - (y + 0.5) / 3;
    const a = Math.atan2(X - FAN0[0], Y - FAN0[1]), r = Math.hypot(X - FAN0[0], Y - FAN0[1]), k = Math.floor(a * 5 + 100);
    // combed strands fanning out, one glossy band across them, darker at the root
    let c = k & 1 ? C.hair : shift(C.hair, 0.1);
    if (r > 4.1 && r < 5.0) c = k & 1 ? shift(C.hairHi, -0.1) : C.hairHi;
    else if (r > 3.7 && r < 5.4) c = (x + y) & 1 ? shift(C.hair, 0.22) : shift(C.hair, 0.12);
    if (r < 2) c = C.hairLo;
    if (top && y === 0 && (Math.abs(X) < 0.7 || x % 4 === 0)) c = C.hairLo;                // the ginkgo notch and the leaf's ragged edge
    if (top && y === 1 && Math.abs(X) < 0.4) c = C.hairLo;
    p.px(x, y, c);
  }
}
const hairP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.hairHi : (x & 1) ? C.hair : shift(C.hair, 0.1)); };
const tieP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.white : (x % 3 === 2 ? C.tieLo : C.tie)); };
const eyeballP = (p, w, h, face) => {
  // the stalk eye: shell lid over the top, white below
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.shell : face === 'down' ? C.eyeLo : y < h * 0.36 ? (y === 0 ? C.shellHi : C.shell) : y === Math.ceil(h * 0.36) ? C.ink : y >= h - 2 ? C.eyeLo : C.white);
};
const stalkP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? C.shell : (y % 4 === 3 ? C.shellLo : x === 0 ? C.shellHi : C.shell)); };
const mouthP = (p, w, h, face, cube) => {
  shellDark(p, w, h, face, cube);
  if (face !== 'south') return;
  const m = Math.floor(w / 2); for (let y = 1; y < h - 1; y++) { p.px(m - 1, y, C.deep); p.px(m, y, shift(C.shell, 0.1)); }    // the two mouthpart plates
  for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, C.shine);                                                             // bristles
};
const jawP = (p, w, h, face, cube) => { crab(C.shell, { top: C.shellHi, bottom: C.deep, bumps: false })(p, w, h, face, cube); if (face === 'up') for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, C.shine); };
const mouthIn = (p, w, h) => { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 2, '#5a1424'); };
const bubbleP = (p, w, h) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - c, y - c); if (d > c + 0.4) continue;
    p.px(x, y, d > c - 0.8 ? (x + y < w - 1 ? '#f4fdff' : '#7ac0e4') : Math.hypot(x - c * 0.55, y - c * 0.55) < 1.7 ? '#ffffff' : (x + y) % 5 === 0 ? '#c8f0ff' : 0);
    if (d <= c - 0.8 && !(Math.hypot(x - c * 0.55, y - c * 0.55) < 1.7) && (x + y) % 5 !== 0) p.px(x, y, '#d8f6ff');
  }
};

// eyes: 11 × 8 texels below the lid; outer corner x = 0, inner corner x = 10 (right eye; the left is mirrored)
const EM = { L: C.shell, l: shift(C.shell, -0.12), D: C.shellLo, K: C.ink, W: C.white, w: '#eeeaf6', G: C.eyeLo, B: C.glint };
const grid = (rows, map) => (p) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = map[r[x]]; if (c) p.px(x, y, c); } });
const EYES = {
  steady: ['LLLLLLLLLLL', 'LLLLLLLLLLL', 'KKKKKKKLLLL', 'WWWWWWKKKKK', 'WWWWWKKBWWW', 'WWWWWKKKWWW', 'wWWWWWWWWWw', '.GGGGGGGGG.'],
  fierce: ['LLLLLLLLLLL', 'LLLLLLLLLLL', 'KKKLLLLLLLL', 'WWWKKKlLLLL', 'WWWWWWKKKlL', 'WWWWWKKWWKK', 'GWWWWKKWWWG', '.GGGGGGGGG.'],
  proud: ['LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'lllllllllll', 'KKKKKKKKKKK', 'WWWWWKKWWWW', 'GwWWWWWWWwG', '.GGGGGGGGG.'],
  wide: ['KKKKKKKKKKK', 'WWWWWWWWWWW', 'WWWWWWWWWWW', 'WWWWWKKWWWW', 'WWWWWKKWWWW', 'wWWWWWWWWWw', 'GwWWWWWWWwG', '.GGGGGGGGG.'],
  closed: ['LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'LLLLLLLLLLL', 'lllllllllll', 'KKKKKKKKKKK', 'DDDDDDDDDDD', '.DDDDDDDDD.'],
  x: ['LLLLLLLLLLL', 'KKKKKKKKKKK', 'WWKKWWWKKWW', 'WWWKKWKKWWW', 'WWWWKKKWWWW', 'WWWKKWKKWWW', 'GWKKWWWKKWG', '.GGGGGGGGG.'],
  swirl: ['LLLLLLLLLLL', 'KKKKKKKKKKK', 'WKKKKKKKWWW', 'KWWWWWWWKWW', 'KWWKKKWWKWW', 'KWWKWKKWKWW', 'GKWWWWWKWWG', '.GKKKKKGGG.'],
};

// ---------------------------------------------------------------- the model
const B = (x0, y0, z0, x1, y1, z1, tex, x = {}) => ({ o: [x0, y0, z0], s: [x1 - x0, y1 - y0, z1 - z0], tex, ...x });
// mirror a right-side part (−x) to the left (+x): x flips, rotations about y and z flip, texture U flips
const flipC = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: c.plane === 'x' ? c.mirror : !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
const side = (n) => n && n.replace(/R$/, 'L');
const flipB = (b) => ({ name: side(b.name), parent: side(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: b.cubes.map(flipC) });
const both = (...bs) => [...bs, ...bs.map(flipB)];

const eyeParts = () => Object.entries(EYES).map(([k, rows]) => B(-7.233, 28.333, 3.36, -3.567, 31, 3.36, grid(rows, EM), { plane: 'z', id: 'eye-' + k, hide: k !== 'steady' }));
const RIGHT = {
  // hind legs: hip → knee (thigh, level), knee → ankle (shin, plumb), pointed dark foot — posed by IK
  thigh: { name: 'thighR', parent: 'root', pivot: [-5.5, 10, 0], cubes: [B(-13.6, 7.6, -2.6, -5, 12.4, 2.6, legP('west'))] },
  shin: { name: 'shinR', parent: 'thighR', pivot: [-13.6, 10, 0], cubes: [
    B(-15.8, 7.8, -2.6, -11.4, 12.6, 2.6, crab(C.shell, { every: 4 })),               // knee knuckle
    B(-15.4, 2.4, -2, -11.8, 8, 2, legP('west')),
  ] },
  foot: { name: 'footR', parent: 'shinR', pivot: [-13.6, 2.6, 0], cubes: [
    B(-15.4, 0, -2, -11.8, 2.6, 3, tipP),
    B(-14.8, 0, 3, -12.4, 1.6, 5.2, tipP),
    B(-14.2, 0, 5.2, -13, 0.8, 6.4, tipP),
  ] },
  // big claws held up in front, palms out: upper arm → forearm → hand (palm + fixed finger) → movable finger
  arm: { name: 'armR', parent: 'torso', pivot: [-12, 19, -0.4], cubes: [B(-18, 16.8, -2.4, -11.6, 21.2, 1.6, legP('west'))] },
  fore: { name: 'foreR', parent: 'armR', pivot: [-16.4, 19, -0.4], cubes: [B(-18.6, 16.8, -2, -14.2, 21, 5.6, crab(C.shell, { every: 5 }))] },
  claw: { name: 'clawR', parent: 'foreR', pivot: [-16.6, 19, 5.2], rot: [-6, 16, 9], cubes: [
    B(-20.4, 14.4, 4.6, -12.8, 21.8, 9, palmP),
    B(-21.2, 15.2, 5, -20.4, 21, 8.6, shellP),                                                   // rounding: outer side
    B(-12.8, 15.2, 5, -12, 21, 8.6, shellP),                                                     // inner side
    B(-19.6, 13.6, 5, -13.6, 14.4, 8.6, shellDark),                                              // heel
    // the fixed finger: three tapering segments hooking inward
    B(-20.6, 21.6, 5.3, -17, 24.4, 8.3, finger('east')),
    B(-20, 24.2, 5.6, -17, 26.8, 8, finger('east')),
    B(-19.2, 26.6, 5.9, -17.2, 28.8, 7.7, tipP, { pivot: [-18.2, 26.6, 6.8], rot: [0, 0, -16] }),
  ] },
  pinch: { name: 'pinchR', parent: 'clawR', pivot: [-14.6, 21.6, 6.8], rot: [0, 0, -5], cubes: [
    B(-16.2, 21.4, 5.3, -12.8, 24.2, 8.3, finger('west')),
    B(-16.2, 24, 5.6, -13.4, 26.6, 8, finger('west')),
    B(-16, 26.4, 5.9, -14, 28.4, 7.7, tipP, { pivot: [-15, 26.4, 6.8], rot: [0, 0, 16] }),
  ] },
  // little walking legs along the sides of the shell
  wleg1: { name: 'wleg1R', parent: 'torso', pivot: [-11.6, 14.4, -3.7], cubes: [
    B(-17.4, 13.5, -4.6, -11.4, 15.3, -2.8, legP('west')),
    B(-18.4, 8.6, -4.6, -16.6, 14.6, -2.8, legP('west'), { pivot: [-17.5, 14.4, -3.7], rot: [0, 0, -14] }),
    B(-18.2, 6.6, -4.4, -16.8, 8.6, -3, tipP, { pivot: [-17.5, 14.4, -3.7], rot: [0, 0, -14] }),
  ] },
  wleg2: { name: 'wleg2R', parent: 'torso', pivot: [-11.2, 12.6, -6.4], cubes: [
    B(-16.6, 11.7, -7.3, -11, 13.5, -5.5, legP('west')),
    B(-17.6, 7.2, -7.3, -15.8, 12.8, -5.5, legP('west'), { pivot: [-16.7, 12.6, -6.4], rot: [0, 0, -20] }),
    B(-17.4, 5.2, -7.1, -16, 7.2, -5.7, tipP, { pivot: [-16.7, 12.6, -6.4], rot: [0, 0, -20] }),
  ] },
  stalk: { name: 'stalkR', parent: 'eyes', pivot: [-5.4, 25, 1.4], rot: [0, 0, 7], cubes: [
    B(-6.9, 24.4, -0.2, -3.9, 25.8, 3, shellP),                                                  // socket
    B(-6.2, 25.4, 0.6, -4.6, 28.8, 2.2, stalkP),
    B(-7.233, 28.333, -0.333, -3.567, 32, 3.333, eyeballP),
    B(-7.433, 31.2, -0.5, -3.367, 32.2, 3.6, crab(C.shell, { bumps: false })),                  // heavy lid
    ...eyeParts(),
  ] },
};

export const def = {
  name: 'kanizumo', ppu: 3, scale: 0.5, outline: { color: '#2a0a14', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...both(RIGHT.thigh, RIGHT.shin, RIGHT.foot),
    { name: 'pelvis', parent: 'root', pivot: [0, 10, 0], cubes: [
      B(-8.8, 5.4, -6.2, 8.8, 12, 6.2, beltP),                                                 // the mawashi
      B(-3.2, 2.6, 3, 3.2, 5.6, 6, beltP),                                                      // front, between the legs
      B(-3, 7, -8, 3, 12.4, -6, beltP),                                                         // the knot behind
      B(-1.8, 2.6, -7.4, 1.8, 7.2, -5.6, beltP),
    ] },
    ...['R', 'C', 'L'].map((g, gi) => ({ name: 'sag' + g, parent: 'pelvis', pivot: [(gi - 1) * 4.6, 9.4, 6.5], rot: [0, 0, (gi - 1) * 5], cubes: [-1, 0, 1].map((k) => {
      const x = (gi - 1) * 4.6 + k * 1.5, len = 5.6 + ((gi * 3 + k + 1) % 2) * 0.6 + (gi === 1 && k === 0 ? 0.4 : 0);
      return B(x - 0.333, 9.4 - len, 6.2, x + 0.333, 9.6, 6.867, cordP);
    }) })),
    { name: 'torso', parent: 'pelvis', pivot: [0, 12, 0], rot: [6, 0, 0], cubes: [
      B(-12, 11, -7, 12, 24, 4, shellP),                                                        // carapace core
      B(-13.5, 15, -6, 13.5, 22, 3, shellP),                                                     // the wide middle with its edge
      B(-10.5, 24, -5.6, 10.5, 25.8, 2.6, crownP),                                               // crown
      B(-12.8, 12.6, -6.4, 12.8, 15, 3.4, shellP),                                               // lower flank
      B(-12.8, 22, -6.4, 12.8, 23.4, 2.8, shellP),                                               // upper flank
      B(-10, 13, -8.6, 10, 23, -7, heike),                                                       // the back, with its stern face
      B(-5.6, 22.8, 3.4, 5.6, 24.4, 5.2, browP),                                                 // brow: the front rim of the shell
      B(-3.4, 20.6, 3.6, 3.4, 22.9, 4.8, mouthP),                                                // mouthparts
      B(-2.4, 19.6, 3.2, 2.4, 21, 4.6, mouthIn, { outline: false }),
      // shell teeth at the shoulders
      B(-13.4, 23.2, -3.6, -11.2, 25.2, -1.6, shellP, { pivot: [-11.6, 24, -2.6], rot: [0, 0, 28] }),
      B(-15, 21.2, -4.6, -13, 22.8, -2.8, shellP, { pivot: [-13.2, 22, -3.7], rot: [0, 0, 38] }),
      B(11.2, 23.2, -3.6, 13.4, 25.2, -1.6, shellP, { pivot: [11.6, 24, -2.6], rot: [0, 0, -28], mirror: true }),
      B(13, 21.2, -4.6, 15, 22.8, -2.8, shellP, { pivot: [13.2, 22, -3.7], rot: [0, 0, -38], mirror: true }),
    ] },
    // the sumo gut: one round mass, stepped in at the edges, hanging over the belt
    { name: 'gut', parent: 'torso', pivot: [0, 14.6, 5], cubes: [
      B(-8.2, 10.6, 3.8, 8.2, 18.4, 9.6, gutP),
      B(-9.4, 11.4, 3.8, 9.4, 17.4, 8.8, gutSideP),
      B(-7, 18.4, 3.6, 7, 20, 8, gutTopP),
      B(-6.6, 9.6, 4.2, 6.6, 10.6, 8.8, gutSideP),
    ] },
    { name: 'jaw', parent: 'torso', pivot: [0, 20.6, 3.8], cubes: [
      B(-2.8, 19.4, 3.6, 2.8, 20.6, 6.2, jawP),
      B(-2.2, 20.4, 3.8, 2.2, 20.8, 5.8, mouthIn, { outline: false }),
    ] },
    { name: 'bub', parent: 'jaw', pivot: [0, 20.4, 6.2], cubes: [
      B(-1.4, 20.2, 7.2, 2.6, 24.2, 7.2, bubbleP, { plane: 'z', id: 'snot', hide: true, shadow: false }),
      B(0.6, 20.2, 5.2, 0.6, 24.2, 9.2, bubbleP, { plane: 'x', id: 'snot', hide: true, shadow: false }),
    ] },
    { name: 'eyes', parent: 'torso', pivot: [0, 25, 1.4], cubes: [] },
    ...both(RIGHT.stalk),
    { name: 'knot', parent: 'torso', pivot: [0, 25.8, -2.2], cubes: [
      B(-1.5, 25.4, -3.6, 1.5, 27.8, -0.8, hairP),
      B(-1.8, 26.2, -3.9, 1.8, 27, -0.5, tieP),
    ] },
    { name: 'fan', parent: 'knot', pivot: [0, 27.6, -2.2], rot: [-10, 0, 0], cubes: [
      B(-1.2, 27.4, -2.9, 1.2, 28.6, -1.5, fanP),
      B(-2.8, 28.6, -2.9, 2.8, 29.8, -1.5, fanP),
      B(-4.4, 29.8, -2.9, 4.4, 31, -1.5, fanP),
      B(-5.6, 31, -2.9, 5.6, 32.4, -1.5, fanP),
      B(-6, 32.4, -2.9, 6, 33.6, -1.5, fanP),
    ] },
    ...both(RIGHT.arm, RIGHT.fore, RIGHT.claw, RIGHT.pinch),
    ...both(RIGHT.wleg1, RIGHT.wleg2),
  ],
};

// ---------------------------------------------------------------- animation
defineFx('salt', { w: 3, h: 3, paint: (p) => { p.px(1, 0, '#ffffff'); p.px(0, 1, '#ffffff'); p.px(1, 1, '#eef4ff'); p.px(2, 1, '#ffffff'); p.px(1, 2, '#c8d4f0'); }, life: [0.8, 1.2], size: [0.035, 0.03], speed: [1.6, 2.8], grav: 5.5, drag: 0.8, spread: 0.45, spin: 6 });
const MOUTH = [0, 21.2, 6.6], PALM = { R: [-16.6, 18.6, 9.4], L: [16.6, 18.6, 9.4] }, FOOT = { R: [-13.6, 0.4, 1.6], L: [13.6, 0.4, 1.6] };
// two-bone IK in the frontal plane: the hips ride on the pelvis, the feet stay where they are put
const HIP = 5.5, L1 = 8.1, L2 = 7.4, PY = 10, R2D = 180 / Math.PI, A0 = { R: [-13.6, 2.6], L: [13.6, 2.6] };
const wrap = (a) => ((a % 360) + 540) % 360 - 180;
function ik2(H, F, s) {
  const dx = F[0] - H[0], dy = F[1] - H[1], d = Math.max(Math.abs(L1 - L2) + 0.05, Math.min(L1 + L2 - 0.05, Math.hypot(dx, dy)));
  const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))), t1 = Math.atan2(dy, dx) + (s < 0 ? -a : a);
  const K = [H[0] + L1 * Math.cos(t1), H[1] + L1 * Math.sin(t1)];
  return [t1, Math.atan2(F[1] - K[1], F[0] - K[0])];
}
// place the pelvis (offset px, py, roll rz in degrees) and solve both legs; f.R / f.L lift a foot [dx, dy]; z.R / z.L step it
function stance(P, px, py, rz, o = {}) {
  P.pos('pelvis', px, py, 0).rot('pelvis', 0, 0, rz);
  const c = Math.cos(rz / R2D), s = Math.sin(rz / R2D);
  for (const [S, g] of [['R', -1], ['L', 1]]) {
    const f = (o.f && o.f[S]) || [0, 0], H = [g * HIP * c + px, PY + g * HIP * s + py], F = [A0[S][0] + f[0], A0[S][1] + f[1]];
    const [t1, t2] = ik2(H, F, g), d1 = wrap(t1 * R2D - (g < 0 ? 180 : 0)), d2 = wrap(t2 * R2D + 90);
    P.pos('thigh' + S, H[0] - g * HIP, H[1] - PY, (o.z && o.z[S]) || 0).rot('thigh' + S, 0, 0, d1);
    P.rot('shin' + S, 0, 0, wrap(d2 - d1)).rot('foot' + S, (o.toe && o.toe[S]) || 0, 0, -d2);
  }
}
// pincer: open (degrees) — the movable finger swings away from the fixed one
const pinch = (P, S, a) => P.rot('pinch' + S, 0, 0, S === 'R' ? -a : a);
// raise an arm: up (deg, the upper arm lifts sideways), fwd (deg, swings forward), tip (deg, forearm tips up)
function arm(P, S, up = 0, fwd = 0, tip = 0) {
  const g = S === 'R' ? 1 : -1;
  P.rot('arm' + S, 0, g * fwd, -g * up).rot('fore' + S, -tip, -g * fwd * 0.6, g * up * 0.7);
}
// a palm thrust (tsuppari): k 0..1 drives the claw straight out from the shoulder
function thrust(P, S, k) {
  const g = S === 'R' ? 1 : -1;
  P.rot('arm' + S, 0, g * 38 * k, 0).rot('fore' + S, 0, -g * 38 * k, 0).pos('claw' + S, -g * 1.2 * k, 0.6 * k, 4.2 * k).rot('claw' + S, -6 * k, 0, g * 8 * k);
  pinch(P, S, 10 * k);
}
// the sumo ready crouch shared by most clips
function ready(P, t, k = 1) {
  arm(P, 'R', 6 * k, 0, 4 * k); arm(P, 'L', 6 * k, 0, 4 * k);
  pinch(P, 'R', 4); pinch(P, 'L', 4);
  P.rot('torso', 5 * k, 0, 0);
}
function scuttle(P, t, amp = 1, hz = 2.2) {
  ['1', '2'].forEach((n, i) => {
    P.rot('wleg' + n + 'R', wave(t, hz, i * 1.9) * 6 * amp, 0, -6 * amp + wave(t, hz, i * 1.9 + 1) * 9 * amp);
    P.rot('wleg' + n + 'L', wave(t, hz, i * 1.9 + 3.1) * 6 * amp, 0, 6 * amp - wave(t, hz, i * 1.9 + 4.1) * 9 * amp);
  });
}
function lyingOnBack(P, k, t = 0) {
  P.rot('root', -84 * k, 0, 0).pos('root', 0, 8.4 * k, -3 * k);
  for (const [S, g] of [['R', -1], ['L', 1]]) {
    P.rot('thigh' + S, 0, 0, -g * 40 * k + g * wave(t, 1.3, g) * 6 * k).rot('shin' + S, 0, 0, g * 60 * k + wave(t, 1.7, g + 1) * 10 * k);
    P.rot('wleg1' + S, 0, 0, -g * 30 * k + wave(t, 3.1, g) * 12 * k).rot('wleg2' + S, 0, 0, -g * 36 * k + wave(t, 2.7, g + 2) * 12 * k);
  }
  arm(P, 'R', -20 * k, 0, -30 * k); arm(P, 'L', -20 * k, 0, -30 * k); pinch(P, 'R', 20 * k); pinch(P, 'L', 20 * k);
  P.rot('stalkR', 24 * k, 0, 14 * k).rot('stalkL', 24 * k, 0, -14 * k).rot('jaw', 22 * k);
}

export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'torso', amp: 0.014, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.4], dur: 0.13 },
  look: { bone: 'eyes', yaw: 26, pitch: 10, speed: 4 },
  springs: [
    { bone: 'stalkR', tip: [0, 6, 0], k: 140, d: 8, gain: 0.9, max: 24 },
    { bone: 'stalkL', tip: [0, 6, 0], k: 150, d: 8, gain: 0.9, max: 24 },
    { bone: 'fan', tip: [0, 5, 0], k: 220, d: 11, gain: 0.6, max: 14 },
    { bone: 'sagR', tip: [0, -5.5, 0], k: 200, d: 9, gain: 0.8, max: 26, axes: [1, 0.3, 1] },
    { bone: 'sagC', tip: [0, -6, 0], k: 180, d: 8, gain: 0.8, max: 26, axes: [1, 0.3, 1] },
    { bone: 'sagL', tip: [0, -5.5, 0], k: 210, d: 9, gain: 0.8, max: 26, axes: [1, 0.3, 1] },
    { bone: 'gut', tip: [0, -4, 3], k: 260, d: 10, gain: 0.35, max: 5 },
    { bone: 'wleg1R', tip: [-6, -4, 0], k: 240, d: 12, gain: 0.4, max: 12 },
    { bone: 'wleg1L', tip: [6, -4, 0], k: 240, d: 12, gain: 0.4, max: 12 },
    { bone: 'wleg2R', tip: [-6, -4, 0], k: 220, d: 12, gain: 0.4, max: 12 },
    { bone: 'wleg2L', tip: [6, -4, 0], k: 220, d: 12, gain: 0.4, max: 12 },
  ],
  faces: {
    eyes: { default: 'steady', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    bubble: { default: 'off', states: { on: ['snot'], off: [] } },
  },
  fidget: { every: [6, 10], clips: ['salt', 'slap'] },
  clips: {
    // the sumo crouch: a slow, heavy weight shift from leg to leg, pincers clacking, bubbles at the jaw
    idle: { len: 2.4, loop: true, f(P, t) {
      const ph = (t / 2.4) * TAU, s = Math.sin(ph), sh = Math.sign(s) * Math.abs(s) ** 0.55, dip = Math.abs(s) ** 6;
      const px = -1.3 * sh, py = -0.35 - 0.7 * dip, rz = 2.2 * sh;
      stance(P, px, py, rz);
      ready(P, t);
      P.rot('torso', 0, wave(t, 1 / 2.4, -0.9) * 3, -1.6 * Math.sin(ph - 0.6)).sq('torso', -0.025 * dip);
      P.sq('gut', -0.05 * dip + 0.02 * Math.sin(ph * 2 - 1.2));
      // the claws ride the shift a beat late
      P.pos('clawR', 0, 0.6 * Math.sin(ph - 1.1), 0).pos('clawL', 0, -0.6 * Math.sin(ph - 1.1), 0);
      for (const [S, t0] of [['R', 0.55], ['L', 1.75]]) pinch(P, S, -4 * bump(t, t0, t0 + 0.12) + wob(t, t0 + 0.12, 7, 4, 7) + (t > t0 - 0.25 && t < t0 ? 10 * seg(t, t0 - 0.25, t0 - 0.05) : 0));
      scuttle(P, t, 0.6, 1.4);
      P.rot('eyes', 0, wave(t, 0.21) * 5, 0).rot('stalkR', 0, 0, wave(t, 0.4, 0.4) * 2).rot('stalkL', 0, 0, wave(t, 0.4, 2) * 2);
      P.rot('jaw', 4 + Math.max(0, wave(t, 0.83)) * 5);
      P.stream('bubble', 'jaw', MOUTH, { rate: 1.1, dir: [0, 0.7, 1], speed: 0.7, spread: 0.45, scale: 0.55 });
    } },
    // a heavy sumo waddle, sliding each foot forward while the body rocks over the planted leg
    walk: { len: 1.0, loop: true, f(P, t) {
      const ph = (t / 1.0) * TAU, s = Math.sin(ph), c = Math.cos(ph), plant = (1 - Math.abs(s)) ** 4;
      stance(P, 1.4 * s, -0.5 + 0.8 * Math.abs(s) - 0.4 * plant, -4 * s, { f: { R: [0, 2.6 * Math.max(0, s)], L: [0, 2.6 * Math.max(0, -s)] }, z: { R: -1.8 * c, L: 1.8 * c }, toe: { R: -14 * Math.max(0, s), L: -14 * Math.max(0, -s) } });
      ready(P, t, 0.7);
      P.sq('torso', -0.04 * plant).rot('torso', 2, 6 * s, 2 * s).sq('gut', -0.07 * plant);
      P.rot('armR', 0, 10 * c, 0).rot('armL', 0, 10 * c, 0).pos('clawR', 0, 0.8 * Math.abs(s), 0).pos('clawL', 0, 0.8 * Math.abs(s), 0);
      scuttle(P, t, 1.3, 3);
      P.rot('eyes', 0, -4 * s, 0);
    } },
    // entrance: sinks into the crouch, erupts up with both claws thrown high clacking and foaming, then slaps its gut
    cry: { len: 2.1, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.36, E.inout) * (1 - seg(t, 0.36, 0.48, E.out)), up = seg(t, 0.38, 0.6, E.back) * (1 - seg(t, 1.38, 1.56, E.in));
      const slap = seg(t, 1.42, 1.56, E.in3) * (1 - seg(t, 1.75, 2.05, E.inout)), hit = t > 1.56 ? 1 : 0;
      const py = -2.6 * crouch + 1.4 * up - 1.6 * slap * (t < 1.75 ? 1 : 1 - seg(t, 1.75, 2.0));
      stance(P, 0, py, wave(t, 7) * 1.2 * up);
      ready(P, t, 1 - up);
      P.sq('torso', -0.08 * crouch + 0.08 * up * (1 - seg(t, 0.6, 0.8)) + wob(t, 1.56, -0.08, 3.5, 6)).rot('torso', 14 * crouch - 10 * up + 12 * slap, 0, 0);
      for (const S of ['R', 'L']) {
        arm(P, S, -14 * crouch + 62 * up - 30 * slap, 0, 6 * crouch + 50 * up - 40 * slap);
        P.pos('claw' + S, 0, -1.2 * crouch, 0);
        pinch(P, S, 4 + 34 * up * (0.6 + 0.4 * Math.abs(wave(t, 7.5, S === 'R' ? 0 : 1.4))));
        if (slap > 0) P.rot('arm' + S, 0, (S === 'R' ? 1 : -1) * 36 * slap, 0).rot('fore' + S, 0, (S === 'R' ? -1 : 1) * 20 * slap, 0).pos('claw' + S, (S === 'R' ? 1 : -1) * 3 * slap, -2 * slap, 1.2 * slap);
      }
      P.sq('gut', wob(t, 1.56, -0.22, 4, 4.5) * hit);
      P.rot('jaw', 6 * crouch + 34 * up).rot('eyes', -8 * up, 0, 0);
      P.face('eyes', crouch > 0.3 ? 'fierce' : up > 0.3 ? 'wide' : t > 1.56 ? 'steady' : undefined);
      P.blinkOK = false;
      if (t > 0.55 && t < 1.38) P.stream('bubble', 'jaw', MOUTH, { rate: 26, dir: [0, 0.9, 1], speed: 1.6, spread: 0.6, scale: 0.8 });
      P.burst(0.56, 'splash', 'jaw', MOUTH, { n: 10, dir: [0, 1, 0.6], speed: 1.4 });
      P.burst(1.56, 'spark', 'gut', [0, 13, 9], { n: 2 }).burst(1.56, 'ring', 'gut', [0, 13, 9], { scale: 0.7 }).burst(1.56, 'drop', 'gut', [0, 13, 9], { n: 8, dir: [0, 0.6, 1], speed: 1.2 });
    } },
    // tsuppari barrage: a wind-up, then five open-palm slaps, alternating, each landing with a splash
    attack: { len: 1.35, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.2, E.out) * (1 - seg(t, 0.2, 0.3, E.in)), go = seg(t, 0.18, 0.3, E.out) * (1 - seg(t, 1.05, 1.32, E.inout));
      const hits = [0.3, 0.45, 0.6, 0.75, 0.92];
      let twist = 0;
      stance(P, 0, -1.2 * wind - 0.8 * go, 0, { z: { R: 0.8 * go, L: 0.8 * go } });
      P.pos('root', 0, 0, -1.4 * wind + 3.2 * go).rot('torso', -8 * wind + 12 * go, 0, 0).sq('torso', -0.06 * wind);
      arm(P, 'R', -10 * wind, -20 * wind, 0); arm(P, 'L', -10 * wind, -20 * wind, 0);
      hits.forEach((h, i) => {
        const S = i % 2 ? 'L' : 'R', k = seg(t, h - 0.06, h, E.out3) * (1 - seg(t, h + 0.04, h + 0.14, E.inout));
        thrust(P, S, k); twist += (S === 'R' ? 1 : -1) * 12 * k;
        P.burst(h, 'spark', 'claw' + S, [PALM[S][0], PALM[S][1], PALM[S][2] + 3.5], { n: 1 }).burst(h, 'splash', 'claw' + S, [PALM[S][0], PALM[S][1], PALM[S][2] + 3], { n: 6, dir: [0, 0.4, 1], speed: 1.1 });
        P.sq('gut', wob(t, h, -0.06, 5, 9));
      });
      P.rot('torso', 0, twist, 0).rot('pelvis', 0, twist * 0.4, 0);
      P.face('eyes', go > 0.2 || wind > 0.2 ? 'fierce' : undefined); P.blinkOK = false;
      P.rot('jaw', 14 * go).rot('eyes', 0, -twist * 0.5, 0);
    } },
    // shiko quake: the leg swings high, hangs, slams down; the ground cracks and water bursts up through it
    special: { len: 2.4, next: 'idle', f(P, t) {
      const shift = seg(t, 0, 0.32, E.inout) * (1 - seg(t, 1.12, 1.24, E.in)), lift = seg(t, 0.28, 0.82, E.out3) * (1 - seg(t, 1.06, 1.18, E.in3));
      const slam = t > 1.18 ? 1 : 0, rec = seg(t, 1.6, 2.3, E.inout), tr = t > 0.82 && t < 1.06 ? wave(t, 13) * 0.6 : 0;
      const py = -0.6 * shift - 2.8 * slam * (1 - rec) + wob(t, 1.18, -1.4, 3, 5);
      stance(P, 3.4 * shift, py, -7 * shift + tr, { f: { R: [-7 * lift, 15 * lift], L: [0, 0] }, toe: { R: -20 * lift, L: 0 } });
      P.rot('torso', 10 * lift * 0 + 8 * slam * (1 - rec), 0, -10 * lift).sq('torso', wob(t, 1.18, -0.12, 3.5, 5)).sq('gut', wob(t, 1.18, -0.25, 4, 4));
      // hands on the knees for balance, then braced wide for the impact
      arm(P, 'R', -26 * lift + 30 * slam * (1 - rec), 10 * lift, -20 * lift); arm(P, 'L', 30 * lift + 30 * slam * (1 - rec), 0, -10 * lift);
      pinch(P, 'R', 4 + 26 * slam * (1 - rec)); pinch(P, 'L', 4 + 26 * slam * (1 - rec));
      P.rot('eyes', 6 * lift, 0, 0).rot('jaw', 22 * slam * (1 - rec) + 8 * lift);
      P.face('eyes', t < 1.18 && lift > 0.1 ? 'fierce' : slam && !rec ? 'wide' : undefined); P.blinkOK = false;
      const F = [FOOT.R[0], 0.4, 1.6];
      P.burst(1.18, 'ring', 'root', [F[0], 0.6, 1], { scale: 1.6, tint: [0.75, 0.9, 1] }).burst(1.18, 'dust', 'root', F, { n: 12, dir: [0, 0.4, 0], spread: 1, speed: 2 });
      P.burst(1.18, 'rock', 'root', F, { n: 12, dir: [0, 1, 0], speed: 1.4, spread: 0.8 }).burst(1.2, 'shard', 'root', F, { n: 10, dir: [0, 1, 0.4], speed: 1 });
      for (const [i, dx] of [[0, -8], [1, 5], [2, -2], [3, 12]].map((v) => v)) P.burst(1.32 + i * 0.09, 'splash', 'root', [F[0] + dx, 0.4, 3 - i * 2], { n: 16, dir: [0, 1, 0], speed: 2.4, spread: 0.25 });
      if (t > 1.3 && t < 1.8) P.stream('bubble', 'root', [F[0] + 2, 1, 2], { rate: 18, dir: [0, 1, 0], speed: 1.6, spread: 0.5 });
      P.burst(0.86, 'dust', 'footR', [FOOT.R[0], 1, 1], { n: 2, speed: 0.3 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.24, 0.7, E.inout)), sc = seg(t, 0.1, 0.42, E.inout);
      stance(P, -2.2 * sc * (1 - seg(t, 0.45, 0.7)), -1.2 * k, 5 * k + wob(t, 0.08, 3, 4, 6), { f: { R: [0, 1.6 * bump(t, 0.12, 0.3)], L: [0, 1.6 * bump(t, 0.28, 0.46)] } });
      P.pos('root', -1.4 * sc, 0, -2.4 * k).rot('torso', -14 * k + wob(t, 0.1, 4, 3, 6), 0, wave(t, 14) * 3 * k).sq('torso', -0.1 * k).sq('gut', wob(t, 0.06, -0.2, 4, 5));
      arm(P, 'R', 30 * k, -10 * k, 24 * k); arm(P, 'L', 30 * k, -10 * k, 24 * k); pinch(P, 'R', 30 * k); pinch(P, 'L', 30 * k);
      scuttle(P, t, 1.8 * k + 0.4, 6);
      P.rot('jaw', 26 * k);
      P.face('eyes', t < 0.42 ? 'x' : undefined); P.blinkOK = false;
      P.burst(0.02, 'spark', 'torso', [0, 18, 9], { n: 2 }).burst(0.02, 'star', 'torso', [0, 24, 6], { n: 3 }).burst(0.04, 'bubble', 'jaw', MOUTH, { n: 6, speed: 1.4, scale: 0.7 });
    } },
    // stagger, a few dizzy sidesteps, then over onto its back with the legs in the air
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.5, E.bounce);
      if (fall < 0.02) stance(P, wave(t, 1.4) * 2 * dizzy, -1.4 * dizzy, wave(t, 1.4, 1) * 6 * dizzy, { f: { R: [0, 1.6 * Math.max(0, wave(t, 2.8))], L: [0, 1.6 * Math.max(0, -wave(t, 2.8))] } });
      else lyingOnBack(P, fall, t);
      P.rot('torso', 0, wave(t, 1.1) * 14 * dizzy, wave(t, 1.4, 2) * 6 * dizzy);
      arm(P, 'R', 20 * dizzy, 0, -20 * dizzy); arm(P, 'L', 20 * dizzy, 0, -20 * dizzy);
      P.rot('stalkR', 0, 0, wave(t, 2.2) * 18 * dizzy).rot('stalkL', 0, 0, wave(t, 2.2, 1) * 18 * dizzy).rot('jaw', 20 * dizzy);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.5, 'dust', 'root', [0, 1, -10], { n: 10, spread: 1, speed: 1.4 }).burst(0.9, 'star', 'torso', [0, 30, 0], { n: 5 });
      if (t > 0.3 && t < 1.1) P.stream('bubble', 'jaw', MOUTH, { rate: 8, dir: [0, 1, 0.5], speed: 0.8, scale: 0.6 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      lyingOnBack(P, 1, t);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.6, 'bubble', 'jaw', MOUTH, { n: 3, dir: [0, 1, 0], speed: 0.6, scale: 0.6 }).burst(1.9, 'bubble', 'jaw', MOUTH, { n: 2, dir: [0, 1, 0], speed: 0.6, scale: 0.5 });
    } },
    // the winner's tegatana: three hand-knife chops (left, right, centre), then a proud flex
    win: { len: 2.2, next: 'idle', f(P, t) {
      const lift = seg(t, 0, 0.2, E.out) * (1 - seg(t, 1.9, 2.2, E.inout));
      const c1 = bump(t, 0.25, 0.48), c2 = bump(t, 0.5, 0.73), c3 = bump(t, 0.75, 0.98);
      const flex = seg(t, 1.05, 1.25, E.back) * (1 - seg(t, 1.85, 2.15, E.inout)), h = bump(t, 1.05, 1.45);
      stance(P, 0, 1.2 * h - 0.4 * flex + wob(t, 1.45, -0.8, 3, 6), 0);
      P.pos('root', 0, Math.max(0, 3.4 * Math.sin(seg(t, 1.05, 1.45, E.lin) * Math.PI)), 0);
      ready(P, t, 1 - flex);
      // right claw: up in front, then chop left, chop right, chop down the middle
      arm(P, 'R', 26 * lift - 26 * flex, 30 * lift - 30 * flex, 30 * lift);
      P.rot('clawR', 0, 0, -36 * c1 + 30 * c2).rot('armR', 0, 22 * c1 - 18 * c2, 0).rot('foreR', 40 * c3, 0, 0);
      arm(P, 'L', 52 * flex, 0, 40 * flex); arm(P, 'R', 52 * flex, 0, 40 * flex);
      pinch(P, 'R', 14 * flex + 6 * Math.abs(wave(t, 6)) * flex); pinch(P, 'L', 14 * flex + 6 * Math.abs(wave(t, 6, 1)) * flex);
      P.sq('torso', 0.06 * flex * (1 - seg(t, 1.3, 1.5)) + wob(t, 1.45, -0.07, 3, 6)).sq('gut', wob(t, 1.45, -0.16, 4, 5)).rot('torso', -8 * flex, 0, 0);
      P.rot('eyes', -6 * flex, 0, 0).rot('jaw', 10 * flex);
      P.face('eyes', 'proud'); P.blinkOK = false;
      P.burst(1.28, 'sparkle', 'torso', [0, 30, 2], { n: 8, speed: 1.4 }).burst(1.45, 'dust', 'root', [0, 0.5, 0], { n: 8, spread: 1, speed: 1.2 });
      for (const tt of [0.36, 0.61, 0.86]) P.burst(tt, 'salt', 'clawR', [PALM.R[0], 26, PALM.R[2]], { n: 5, dir: [0, 1, 0.3], speed: 0.6 });
    } },
    // dozing in a deep squat: slumped forward, stalks drooping, a bubble swelling and shrinking at the jaw
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      stance(P, 0, -3 + br * 0.3, 0);
      P.rot('torso', 12 + br * 1.5, 0, 0).sq('torso', -0.03 + br * 0.02).sq('gut', 0.03 * br);
      arm(P, 'R', -26, 8, -30); arm(P, 'L', -26, 8, -30); pinch(P, 'R', 2); pinch(P, 'L', 2);
      P.pos('clawR', 0, -1.5, -1).pos('clawL', 0, -1.5, -1);
      P.rot('stalkR', 34, 0, 16).rot('stalkL', 34, 0, -16).rot('eyes', 8, 0, 0).rot('jaw', 6 + Math.max(0, br) * 4);
      P.face('eyes', 'closed').face('bubble', 'on'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.scl('bub', 0.35 + 0.65 * (0.5 + 0.5 * br));
      P.burst(0.5, 'z', 'torso', [6, 30, 4], {}).burst(1.9, 'z', 'torso', [6, 30, 4], {});
    } },
    // fidget: the salt throw — dips a claw behind for salt and flings it in a sparkling arc
    salt: { len: 2.0, next: 'idle', f(P, t) {
      const reach = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 0.5, 0.72, E.anti)), fling = seg(t, 0.62, 0.8, E.out) * (1 - seg(t, 1.3, 1.8, E.inout));
      stance(P, -1.2 * reach + 0.8 * fling, -0.6 - 0.6 * reach + 0.6 * fling, 4 * reach - 3 * fling);
      ready(P, t, 1 - fling * 0.5);
      arm(P, 'R', -10 * reach + 70 * fling, -50 * reach + 40 * fling, -20 * reach + 30 * fling);
      pinch(P, 'R', 2 + 30 * fling);
      P.rot('torso', 0, -14 * reach + 16 * fling, 0).rot('eyes', 0, -18 * reach + 20 * fling, 0);
      P.face('eyes', fling > 0.5 ? 'proud' : undefined);
      P.burst(0.74, 'salt', 'clawR', [-16, 26, 8], { n: 26, dir: [0.6, 1, 0.8], speed: 1.1, spread: 0.5 }).burst(0.78, 'sparkle', 'clawR', [-16, 27, 8], { n: 6, dir: [0.6, 1, 0.6], speed: 1.6 });
    } },
    // fidget: clacks both pincers, then slaps its own gut twice and settles its belt
    slap: { len: 1.9, next: 'idle', f(P, t) {
      stance(P, 0, -0.5 - 0.5 * bump(t, 0.9, 1.1) - 0.5 * bump(t, 1.2, 1.4), 0);
      ready(P, t);
      for (const [S, t0] of [['R', 0.1], ['L', 0.28], ['R', 0.46], ['L', 0.64]]) pinch(P, S, 18 * bump(t, t0, t0 + 0.16));
      for (const [S, t0] of [['R', 0.85], ['L', 1.15]]) {
        const k = seg(t, t0, t0 + 0.08, E.in3) * (1 - seg(t, t0 + 0.12, t0 + 0.3, E.inout)), g = S === 'R' ? 1 : -1;
        P.rot('arm' + S, 0, g * 34 * k, 0).rot('fore' + S, 0, -g * 18 * k, 0).pos('claw' + S, g * 3.2 * k, -2.6 * k, 0.6 * k);
        P.sq('gut', wob(t, t0 + 0.08, -0.16, 4.5, 5)).burst(t0 + 0.08, 'ring', 'gut', [g * -4, 12, 9], { scale: 0.4 });
      }
      P.rot('eyes', 8 * bump(t, 0.8, 1.5), 0, 0).rot('jaw', 8 * bump(t, 0.8, 1.5));
      P.face('eyes', t > 0.85 && t < 1.5 ? 'proud' : undefined);
    } },
  },
};
def.anim = anim;
