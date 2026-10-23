// Shared parts for the Blowhale line (Blowhale → Tartanic), a Redbone homage: a floating balloon whale
// whose body is a stitched tartan-and-leather bag — a bagpipe bag with flukes — with a glossy RED BONE
// SPINE stitched down its back, a tan leather face and a cream pleated belly, a blowpipe on its head, a
// balloon knot under its belly trailing a string and a tassel, and a curly 70s funk puff of hair. Stage 2
// grows three bagpipe drones over one shoulder, joined by a tasselled cord. It drifts on a slow
// funk groove: the dance is a laid-back body roll with flipper claps on 2 and 4 and the spine rippling.
// Eyes (creature_rules §7/§9): 3D — leather eye bulges on the front corners of the head, each with a
// hand-pixelled, heavy-lidded chill eye (white, a redbone-red iris on the inner side, a dark pupil, two
// highlights; never a bullseye) painted on its front face.
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { shade, gradient, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes, mouthRig } from './eyes.js';
import { B as B0, L, both, twin, acc, region, ell, stroke, GOLD, goldP, chainP, formMap, beat, env, SPFX } from './story_parts.js';
import { mix } from '../../px/paint.js';

// ---------------------------------------------------------------- palette
const TT = { R: '#c42a1e', N: '#1e2a5c', G: '#1f5c36', Y: '#f2c83a', W: '#f6f2e8', K: '#2a1210' };
const C = {
  leather: '#c8905a', leatherHi: '#e8b882', leatherLo: '#8a5a32', seam: '#5a3018', stitch: '#f4e2b0',
  belly: '#ead2aa', bellyHi: '#faeaca', bellyLo: '#bc9a72', pleat: '#a07850',
  mouth: '#4a1018', tongue: '#f08070', tongueHi: '#ffb0a0', baleen: '#efe2c4',
  wood: '#2c201c', woodHi: '#4c3a32', ivory: '#f2e8cc', ivoryLo: '#c8b896',
  afro: '#2a1a14', afroHi: '#5c3c2c', afroLo: '#140c08',
  string: '#f2ead8', tassel: '#c42a1e',
};
const BONE = ['#ff8a7a', '#e2384a', '#a81e30', '#5c0c1a'];            // the red bone (fixed hexes: the drip form gilds exactly these)
const side = (f) => f !== 'up' && f !== 'down';

// ---------------------------------------------------------------- painters
// tartan: a sett of coloured bands in both directions, woven as a 2/2 twill (warp on one diagonal,
// weft on the other), lit from above, with stitched leather seams between the bag's panels
const SETT = [['R', 6], ['N', 3], ['R', 2], ['G', 4], ['R', 3], ['Y', 1], ['R', 4], ['W', 1]];
const SETT_N = SETT.reduce((a, [, n]) => a + n, 0);
const settAt = (i) => { let j = ((i % SETT_N) + SETT_N) % SETT_N; for (const [c, n] of SETT) { if (j < n) return c; j -= n; } return 'R'; };
function tartan(o = {}) {
  return (p, w, h, f) => {
    const lit = f === 'up' ? 0.1 : f === 'down' ? -0.3 : 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const warp = settAt(x + (o.ox || 0)), weft = settAt(y + (o.oy || 0)), c = warp === weft ? TT[warp] : warp === 'R' ? TT[weft] : weft === 'R' ? TT[warp] : mix(TT[warp], TT[weft], (x + y) % 2 ? 0.35 : 0.65);
      const k = side(f) ? 0.1 - (y / Math.max(1, h - 1)) * 0.32 : lit;
      p.px(x, y, shift(c, k));
    }
    if (o.seams && side(f)) {               // vertical leather seams with cross-stitches
      for (const fx of o.seams) { const sx = Math.round(fx * (w - 1)); for (let y = 0; y < h; y++) { p.px(sx, y, C.seam); p.px(sx + 1, y, shift(C.seam, -0.2)); if (y % 3 === 1) { p.px(sx - 1, y, C.stitch); p.px(sx + 2, y, C.stitch); } } }
    }
    if (o.piping && side(f)) for (let x = 0; x < w; x++) { p.px(x, 0, C.seam); if (x % 3 === 0) p.px(x, 1, C.stitch); }
  };
}
const leatherP = (o = {}) => (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = f === 'up' ? C.leatherHi : f === 'down' ? C.leatherLo : ramp([C.leatherHi, C.leather, C.leather, C.leatherLo], y / Math.max(1, h - 1), x, y);
    if ((x * 5 + y * 3) % 17 === 0) c = shift(c, -0.08);                 // grain
    p.px(x, y, c);
  }
  if (o.stitch && side(f)) { for (let x = 1; x < w - 1; x += 2) { p.px(x, 1, C.stitch); p.px(x, h - 2, C.stitch); } for (let y = 1; y < h - 1; y += 2) { p.px(1, y, C.stitch); p.px(w - 2, y, C.stitch); } }
};
const bellyP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = f === 'down' ? C.belly : side(f) ? ramp([C.bellyHi, C.belly, C.bellyLo], y / Math.max(1, h - 1), x, y) : C.bellyHi;
    if (f === 'down' && x % 4 === 3) c = C.pleat;                          // ventral pleats, stitched like a welt
    if (f === 'down' && x % 4 === 2 && y % 3 === 0) c = C.stitch;
    p.px(x, y, c);
  }
};
// the upper head: tartan, with the mouth roof underneath (dark, a fringe of baleen along the front)
const headP = tartan({ piping: true });
const roofP = (p, w, h, f) => { if (f !== 'down') return headP(p, w, h, f); p.rect(0, 0, w, h, C.mouth); for (let x = 0; x < w; x++) for (let y = h - 4; y < h; y++) p.px(x, y, x % 2 ? C.baleen : shift(C.baleen, -0.15)); };
const jawP = (p, w, h, f) => {
  if (f === 'up') { p.rect(0, 0, w, h, C.mouth); p.rect(2, 1, w - 6 > 0 ? w - 4 : 1, h - 6, C.tongue); p.rect(3, 1, w - 6, 2, C.tongueHi); p.rect(0, h - 3, w, 3, C.bellyHi); return; }
  if (f === 'down') { bellyP(p, w, h, f); return; }
  bellyP(p, w, h, f);
  if (f === 'south') for (let x = 2; x < w; x += 3) for (let y = 3; y < h; y++) p.px(x, y, C.pleat);   // ventral grooves
  for (let x = 0; x < w; x++) { p.px(x, 0, C.seam); if (x % 3 === 1) p.px(x, 1, C.stitch); }    // the lip seam
};
// the red bone: glossy, with a lit top and a dark joint line
const boneP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'up' ? BONE[1] : f === 'down' ? BONE[3] : y === 0 ? BONE[0] : y >= h - 1 ? BONE[3] : y / h < 0.5 ? BONE[1] : BONE[2]);
  if (side(f) && w > 2 && h > 2) p.px(1, 1, BONE[0]);
};
const woodP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, side(f) ? (x === 0 ? C.woodHi : (y + x) % 5 === 0 ? shift(C.wood, -0.3) : C.wood) : C.woodHi); };
const ivoryP = gradient([C.ivory, C.ivory, C.ivoryLo]);
const afroP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const cx = (x % 3) - 1, cy = ((y + (x >> 1)) % 3) - 1, curl = cx * cx + cy * cy;
    p.px(x, y, curl === 0 ? C.afroHi : curl === 2 ? C.afroLo : f === 'up' ? shift(C.afro, 0.1) : C.afro);
  }
};
const stringP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, C.string); };
const tasselP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < 2 ? GOLD[1] : side(f) && x % 2 ? shift(C.tassel, -0.2) : C.tassel); };
const knotP = tartan({});
// drip painters
const lensP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = x === 0 || y === 0 || x === w - 1 || y === h - 1; p.px(x, y, f !== 'south' || e ? GOLD[2] : ramp(['#ffb03a', '#f07a1e', '#b8401a', '#6a1e14'], y / (h - 1), x, y)); } if (f === 'south') p.rect(2, 2, 2, 1, '#ffffff').px(2, 3, '#ffe0b0'); };
const tamP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'up' ? (Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2) < w * 0.2 ? '#2a3a7a' : '#1e2a5c') : (x + y) % 2 ? '#1e2a5c' : '#24326a'); if (side(f)) for (let x = 0; x < w; x++) p.px(x, h - 1, TT.R); };
const pomP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 3 === 0 ? '#ff5a4a' : (x * y) % 4 === 1 ? '#8a1414' : TT.R); };
const medalP = (p, w, h, f) => { goldP(p, w, h, f); if (f === 'south') { region(p, w, h, ell(w / 2, h / 2, w * 0.36, h * 0.36), GOLD[2]); for (let y = 2; y < h - 2; y++) p.px(Math.floor(w / 2), y, BONE[1]); p.px(Math.floor(w / 2) - 1, 2, BONE[1]).px(Math.floor(w / 2) + 1, 2, BONE[1]); } };
const MIRROR = ['#5a6274', '#ffffff', '#c8d4ec', '#8a98b8', '#e0b8ff'];
const mirrorP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = ((x >> 1) + (y >> 1) * 3) % 7; p.px(x, y, MIRROR[x % 2 && y % 2 ? 0 : t === 0 ? 1 : t < 3 ? 2 : t < 5 ? 3 : 4]); } };
const drumP = (p, w, h, f) => { if (f === 'south' || f === 'north') { region(p, w, h, ell(w / 2, h / 2, w / 2, h / 2), (x, y) => ((x + y) % 5 === 0 ? '#e8d8b8' : '#f4e8cc'), '#6a3a1a'); return; } for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 || x === w - 1 ? GOLD[2] : (y % 4 === 0 ? '#5a2e14' : '#8a4a20')); };
const cordP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 2 ? GOLD[1] : TT.R); };

// ---------------------------------------------------------------- eyes and mouth
const EYE_MAPS = {
  open: ['llllllllllllll', '.lllssIIIIIlll', '.lwssIIhhkIIl.', '.lwwsIihkkkIl.', '.lwwwiikkkkil.', '.lwwwiiikkhil.', '..lwwwiiiiil..', '...llwwwwll...', '.....llll.....'],
  happy: ['..............', '..............', '....llllll....', '..lll....lll..', '.ll........ll.', '.l..........l.', '..............', '..............', '..............'],
  closed: ['..............', '..............', '..............', '..............', '.llllllllllll.', '..llllllllll..', '..............', '..............', '..............'],
};
const EYE_OPT = { style: 'pix', chunk: 1, line: '#24100c', iris: '#c43a2e', irisDark: '#6a1418', pupilColor: '#1a0808', extra: ['smug'], map: EYE_MAPS };

// ---------------------------------------------------------------- the builder
export function whaleDef(stage) {
  const k = stage === 1 ? 1 : 1.5, name = stage === 1 ? 'blowhale' : 'tartanic';
  const LIFT = 2.2, v = (a) => [a[0] * k, (a[1] + LIFT) * k, a[2] * k], vs = (a) => a.map((x) => x * k);
  const B = (o, s, tex, x = {}) => B0(v(o), vs(s), tex, { ...x, ...(x.pivot ? { pivot: v(x.pivot) } : {}) });
  const P0 = [0, 11, -1];
  // ---- the bag (body): upper core and head block in tartan, the lower core and belly in cream leather
  const body = [
    B([-6.5, 9.0, -9], [13, 7.6, 16], roofP),                                          // upper core (its underside is the mouth roof)
    B([-6.5, 5.6, -9], [13, 3.6, 10], tartan({ seams: [0.5] })),                        // lower core behind the jaw
    B([-5.6, 16.6, -8], [11.2, 1.1, 14], tartan({})),                                   // top rounding
    B([-5.6, 4.6, -8], [11.2, 1.1, 9.0], bellyP),                                       // belly
    ...both(B([-7.4, 9.4, -8], [1.0, 6.8, 14], tartan({ seams: [0.33, 0.7] })), B([-7.4, 6.4, -8], [1.0, 3.2, 8.6], tartan({}))),
    B([-6.0, 9.0, 7], [12, 7.4, 1.6], tartan({ piping: true })),                       // the head front, rounded off in steps
    B([-5.2, 9.2, 8.6], [10.4, 6.4, 1.0], tartan({})),
    B([-4.4, 16.4, 6.2], [8.8, 0.9, 2.6], tartan({})),
    B([-5.6, 7.0, -11], [11.2, 8.6, 2.0], tartan({})),                                 // back taper
    B([-0.7, 3.8, -1.6], [1.4, 0.9, 1.4], knotP),                                      // the balloon knot
  ];
  // ---- the red bone spine: vertebrae on their own bones (they ripple)
  const VZ = [[2.0, 17.7], [-0.3, 17.7], [-2.6, 17.7], [-4.9, 17.7], [-7.2, 17.7], [-9.9, 15.6]];
  const spine = VZ.map(([z, y], i) => ({ name: 'vert' + i, parent: 'body', pivot: v([0, y, z]), cubes: [
    B([-1.3, y - 0.2, z - 0.9], [2.6, 1.3, 1.8], boneP),
    B([-0.55, y + 0.9, z - 0.6], [1.1, 2.6 - i * 0.18, 1.2], boneP, { pivot: [0, y + 0.9, z], rot: [-24, 0, 0] }),
    ...both(B([-2.3, y + 0.1, z - 0.4], [1.1, 0.7, 0.8], boneP)),
  ] }));
  // ---- head top: the blowpipe and the 70s funk puff of curls
  const pipe = [B([-0.45, 17.4, 4.0], [0.9, 2.6, 0.9], woodP, { pivot: [0, 17.6, 4.4], rot: [18, 0, 0] }), B([-0.6, 19.6, 4.6], [1.2, 0.6, 1.2], ivoryP, { pivot: [0, 17.6, 4.4], rot: [18, 0, 0] })];
  const afro = [B([-2.4, 16.8, 5.2], [4.8, 1.9, 3.4], afroP), B([-1.6, 18.5, 5.6], [3.2, 1.0, 2.6], afroP)];
  // ---- the jaw, with a stitched lip seam and a full-res mouth plane on its front
  const MR = mouthRig({ at: v([0, 7.9, 9.64]), size: [10 * k, 2.4 * k], states: ['smile', 'grin', 'o', 'frown', 'wavy', 'flat'], def: 'smile', line: '#3a1810', inner: C.mouth, tongue: C.tongue, chunk: 1 });
  const jaw = [B([-6.0, 5.3, 1.0], [12.0, 3.8, 8.6], jawP), B([-5.2, 4.8, 1.6], [10.4, 0.6, 7.6], bellyP), ...MR.cubes];
  // ---- flippers, tail stock and flukes
  const FIN = [B([-12.4, 6.7, 0.4], [6.0, 1.4, 4.6], tartan({ piping: true }), { faces: { down: bellyP } }), B([-12.0, 6.4, 0.8], [5.2, 0.4, 3.8], bellyP)];
  const tail = [B([-3.0, 8.2, -15.6], [6.0, 4.6, 4.8], tartan({ seams: [0.5] }))];
  const FLUKE = [B([-8.4, 9.7, -19.8], [8.0, 1.4, 4.8], tartan({ piping: true }), { pivot: [0, 10.4, -16.6], rot: [0, -18, -16] }), B([-7.6, 9.8, -21.2], [5.0, 1.2, 1.6], leatherP({ stitch: true }), { pivot: [0, 10.4, -16.6], rot: [0, -18, -16] })];
  // ---- the string under the belly, ending in a red tassel
  const strings = [
    { name: 'str1', parent: 'body', pivot: v([0, 3.9, -0.9]), cubes: [B([-0.15, 1.2, -1.05], [0.3, 2.8, 0.3], stringP)] },
    { name: 'str2', parent: 'str1', pivot: v([0, 1.2, -0.9]), cubes: [B([-0.15, -0.6, -1.05], [0.3, 1.8, 0.3], stringP)] },
    { name: 'str3', parent: 'str2', pivot: v([0, -0.6, -0.9]), cubes: [B([-0.5, -1.6, -1.4], [1.0, 1.1, 1.0], tasselP)] },
  ];
  // ---- 3D eyes: leather bulges on the front corners of the head, the eye painted on the bulge's face
  const bw = stage === 1 ? 5.4 : 6.0, bh = stage === 1 ? 3.8 : 4.2, EP = v([-3.0, 12.9, 9.6]);
  const bulge = { name: 'eyeballR', parent: 'body', pivot: EP, rot: [0, -12, 0], cubes: [B0([EP[0] - bw / 2, EP[1] - bh / 2, EP[2] - 0.4], [bw, bh, 1.4], leatherP({}))] };
  const EYES = eyeRig({ ...EYE_OPT, at: [EP[0], EP[1], EP[2] + 1.04], parentR: 'eyeballR', parentL: 'eyeballL' });

  // ---------------------------------------------------------------- stage 2: bagpipe drones
  const drones = [];
  if (stage === 2) {
    // three drones over the left shoulder (two tenors and a bass), ebony with ivory mounts, a tasselled cord
    const DR = [[4.2, -1.0, 6.0, 20], [5.6, -2.6, 7.0, 26], [3.2, -3.8, 9.6, 14]];
    DR.forEach(([x, z, len, lean], i) => drones.push({ name: 'drone' + i, parent: 'body', pivot: v([x, 16.6, z]), rot: [-lean, 0, -10 - i * 6], cubes: [
      B([x - 0.55, 16.4, z - 0.55], [1.1, len, 1.1], woodP),
      B([x - 0.8, 16.4 + len * 0.45, z - 0.8], [1.6, 0.7, 1.6], ivoryP, { id: 'drone-mount' }),
      B([x - 0.85, 16.4 + len - 0.2, z - 0.85], [1.7, 1.2, 1.7], ivoryP, { id: 'drone-mount' }),
      B([x - 0.5, 16.4 + len + 1.0, z - 0.5], [1.0, 0.6, 1.0], woodP),
      ...acc('acc-golddrones', [B([x - 0.85, 16.4 + len * 0.45 - 0.05, z - 0.85], [1.7, 0.8, 1.7], goldP), B([x - 0.9, 16.4 + len - 0.25, z - 0.9], [1.8, 1.3, 1.8], goldP)]),
    ] }));
    drones.push({ name: 'cord', parent: 'drone2', pivot: v([3.2, 16.6 + 7.0, -3.8]), cubes: [B([1.8, 16.6 + 3.0, -4.1], [0.5, 4.2, 0.5], cordP), B([1.55, 16.6 + 2.0, -4.35], [1.0, 1.2, 1.0], tasselP)] });
  }

  // ---------------------------------------------------------------- drip accessories
  const D = { body: [], jaw: [], eyeballR: [], fin: [], afro: [] };
  // 70s round shades over the eye bulges (on the bulge bones) and a gold bridge across the face
  D.eyeballR.push(...acc('acc-shades', [B0([EP[0] - bw / 2 - 0.2, EP[1] - bh / 2 - 0.1, EP[2] + 1.0], [bw + 0.4, bh + 0.2, 0.5], lensP)]));
  D.body.push(...acc('acc-shades', [B([-0.7, 13.0, 10.4], [1.4, 0.5, 0.5], goldP)]));
  // a tam o' shanter with a red pom-pom, perched on the curls
  D.afro.push(...acc('acc-tam', [B([-3.6, 19.4, 4.4], [7.2, 1.0, 5.2], tamP, { pivot: [0, 19.6, 7], rot: [8, 0, 10] }), B([-0.8, 20.3, 6.0], [1.6, 1.4, 1.6], pomP, { pivot: [0, 19.6, 7], rot: [8, 0, 10] })]));
  // a gold medallion chain round the chin (on the jaw)
  D.jaw.push(...acc('acc-chain', [B([-5.0, 4.9, 9.65], [10, 0.6, 0.4], chainP), ...both(B([-6.15, 4.9, 3.0], [0.4, 0.6, 6.9], chainP)), B([-1.2, 2.4, 9.6], [2.4, 2.4, 0.6], medalP)]));
  // gold cord tassels at the flipper tips
  D.fin.push(...acc('acc-tassels', [B([-12.2, 4.4, 2.2], [1.0, 2.2, 1.0], tasselP), B([-11.95, 6.4, 2.45], [0.5, 0.6, 0.5], cordP)]));
  // a disco mirror ball hanging under the belly on its own spring bone
  const disco = { name: 'disco', parent: 'body', pivot: v([0, 4.6, 4.2]), cubes: acc('acc-disco', [B([-0.15, 2.4, 4.05], [0.3, 2.3, 0.3], chainP), B([-1.3, -0.1, 2.9], [2.6, 2.6, 2.6], mirrorP)]) };
  // a pair of bongos strapped to its left flank
  D.body.push(...acc('acc-bongos', [B([6.8, 8.0, -6.0], [2.0, 3.0, 3.0], drumP, { pivot: [7.8, 9.5, -4.5], rot: [0, 90, 0] }), B([6.8, 7.6, -2.6], [2.0, 2.6, 2.6], drumP, { pivot: [7.8, 8.9, -1.3], rot: [0, 90, 0] }), B([6.85, 10.8, -7.0], [0.5, 0.5, 6.6], chainP)]));

  const bones = [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: v(P0), cubes: [...body, ...D.body] },
    ...spine,
    { name: 'pipe', parent: 'body', pivot: v([0, 17.6, 4.4]), cubes: pipe },
    { name: 'afro', parent: 'body', pivot: v([0, 16.8, 7.0]), cubes: [...afro, ...D.afro] },
    { name: 'jaw', parent: 'body', pivot: v([0, 9.0, 1.2]), cubes: [...jaw, ...D.jaw] },
    ...twin({ name: 'finR', parent: 'body', pivot: v([-6.8, 7.4, 2.6]), rot: [0, 16, 24], cubes: [...FIN, ...D.fin] }),
    { name: 'tail', parent: 'body', pivot: v([0, 10.4, -11]), cubes: tail },
    ...twin({ name: 'flukeR', parent: 'tail', pivot: v([0, 10.4, -15.6]), cubes: FLUKE }),
    ...strings,
    disco,
    ...twin({ ...bulge, cubes: [...bulge.cubes, ...D.eyeballR] }),
    ...EYES.bones,
    ...drones,
  ];
  const drip = [
    [{ id: 'acc-shades', name: '70s round shades' }, { id: 'acc-tam', name: "Tam o' shanter" }],
    stage === 1 ? [{ id: 'acc-chain', name: 'Gold medallion' }, { id: 'acc-tassels', name: 'Gold cord tassels' }] : [{ id: 'acc-chain', name: 'Gold medallion' }, { id: 'acc-golddrones', name: 'Gold-mounted drones' }],
    [{ id: 'acc-disco', name: 'Disco mirror ball' }, { id: 'acc-bongos', name: 'Bongos' }],
  ];
  const def = {
    name, ppu: 3, scale: stage === 1 ? 0.5 : 0.62, outline: { color: '#1a0c0a', px: 1.5 }, bones, drip,
    attach: {
      head: { bone: 'afro', at: v([0, 19.8, 7]), size: 8 * k },
      face: { bone: 'body', at: v([0, 12.4, 9.4]), size: 12 * k },
      neck: { bone: 'jaw', at: v([0, 5.2, 9.6]), size: 10 * k },
      back: { bone: 'body', at: v([0, 18.2, -4]), size: 12 * k },
    },
  };
  // the luxury form: tartan to black watch, leather to black with gold stitching, the red bone spine to gold
  const BONESET = new Set([...BONE, ...MIRROR.slice(2)]);
  def.dripForm = { map: keepEyes(EYES, formMap(({ h, s }, glow, hex) => (BONESET.has(hex) ? 'gold' : h >= 90 && h < 300 && s > 0.15 ? 'black' : undefined))) };
  const S = { k, stage, MOUTH: v([0, 8.4, 10.4]), TOP: v([0, 21.5, 2]), PIPE: v([0, 20.6, 5.2]), BACK: v([0, 12, -12]), drones: stage === 2, mouth: MR.slot };
  def.anim = whaleAnim(S, EYES);
  return def;
}

// ---------------------------------------------------------------- animation
const VERTS = ['vert0', 'vert1', 'vert2', 'vert3', 'vert4', 'vert5'];
function whaleAnim(S, EYES) {
  const { k, MOUTH, TOP, PIPE } = S;
  const DRONES = S.drones ? ['drone0', 'drone1', 'drone2'] : [];
  const float = (P, y) => P.pos('body', 0, y * k, 0);
  const fins = (P, a, b = a) => P.rot('finR', 0, 0, -a).rot('finL', 0, 0, b);
  const ripple = (P, t, amp = 6, hz = 0.8) => VERTS.forEach((n, i) => P.rot(n, amp * wave(t, hz, -i * 0.7), 0, 0));
  const flukes = (P, a) => P.rot('flukeR', 0, 0, a).rot('flukeL', 0, 0, -a);
  const notes = (P, t0, n = 1) => { P.burst(t0, 'note', 'pipe', PIPE, { n }); for (const d of DRONES) P.burst(t0 + 0.05, 'note', d, null, { n: 1, scale: 1.2 }); };
  // flat on the ground, deflated (faint / down)
  const flat = (P, k2) => {
    P.pos('body', 0, -6.6 * k * k2, 0).scl('body', 1 + 0.12 * k2, 1 - 0.45 * k2, 1 + 0.05 * k2).rot('body', 0, 0, 8 * k2);
    fins(P, -30 * k2); flukes(P, -10 * k2); P.rot('tail', 12 * k2).rot('jaw', 12 * k2).rot('afro', 0, 0, 14 * k2);
    VERTS.forEach((n, i) => P.rot(n, 0, 0, (i % 2 ? 10 : -10) * k2));
  };
  const clips = {
    // drifting in the air: a slow bob, flippers sculling, flukes paddling, the spine swaying, eyes half-lidded and cool
    idle: { len: 3.2, loop: true, f(P, t, c) {
      const bob = Math.sin((t / 3.2) * Math.PI * 2), sway = Math.sin((t / 3.2) * Math.PI * 4);
      float(P, 0.6 * bob); P.rot('body', 2 * bob, 4 * sway, 2 * sway).sq('body', 0.02 * bob);
      fins(P, 10 * Math.sin(t * 2.2), 10 * Math.sin(t * 2.2 + 0.5)); P.rot('tail', 6 * Math.sin(t * 1.9)); flukes(P, 6 * Math.sin(t * 1.9 - 0.8));
      ripple(P, t, 4, 0.6); P.rot('afro', 0, 0, 3 * sway).rot('jaw', bump(t, 1.6, 2.4) * 3);
      P.rot('disco', 0, t * 90, 0);
      eyesAt(P, ...glance(t + c.loopN * 1.4, [[0, 0], [0.25, 0], [0, 0], [-0.25, -0.05]], 0.8));
      if (c.loopN % 2 === 1 && t > 1.0 && t < 2.2) P.face('eyes', 'smug').face('mouth', 'wavy');
    } },
    // swimming through the air: flukes beat, body undulates, flippers sweep back
    walk: { len: 1.2, loop: true, f(P, t) {
      const ph = (t / 1.2) * Math.PI * 2, s = Math.sin(ph);
      float(P, 0.5 * Math.sin(ph * 2) + 0.3); P.rot('body', 3 * Math.cos(ph), 0, 3 * s).sq('body', 0.02 * Math.sin(ph * 2));
      P.rot('tail', 14 * s); flukes(P, 10 * Math.sin(ph - 0.9)); fins(P, 22 + 14 * Math.sin(ph + 1), 22 + 14 * Math.sin(ph + 1)); P.rot('finR', -10 * s).rot('finL', -10 * s);
      ripple(P, t, 6, 0.83);
    } },
    // battle cry: it swells up like a pipe bag, then lets out a long wailing skirl through the drones
    cry: { len: 2.2, next: 'idle', f(P, t) {
      P.lookW = 1 - env(t, 0.1, 2.0);
      const swell = seg(t, 0.0, 0.5, E.out) * (1 - seg(t, 1.6, 2.1, E.inout)), wail = env(t, 0.55, 1.65, 0.1, 0.2);
      P.scl('body', 1 + 0.16 * swell, 1 + 0.14 * swell, 1 + 0.08 * swell); float(P, 1.4 * swell);
      P.rot('body', -12 * wail + wave(t, 7) * 2 * wail, 0, 0).rot('jaw', 32 * wail + wave(t, 9) * 4 * wail); fins(P, 40 * wail, 40 * wail); flukes(P, 14 * wail);
      ripple(P, t, 10 * wail + 2, 2.2);
      P.face('eyes', swell > 0.3 && wail < 0.2 ? 'wide' : wail > 0.3 ? 'shut' : undefined).face('mouth', wail > 0.2 ? 'off' : swell > 0.3 ? 'o' : undefined); P.blinkOK = false;
      for (const r0 of [0.6, 0.85, 1.1, 1.35]) P.burst(r0, 'ring', 'body', MOUTH, { scale: 1.3 * k, tint: [1, 0.85, 0.7] });
      notes(P, 0.6, 2); notes(P, 1.0, 2); notes(P, 1.3, 1);
      P.burst(0.05, SPFX.puff, 'pipe', PIPE, { n: 4, dir: [0, 1, 0] });
    } },
    // physical: rears back, then a big bouncy body-bump
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.4, E.in)), hit = seg(t, 0.34, 0.44, E.in3) * (1 - seg(t, 0.55, 0.95, E.inout));
      P.pos('root', 0, 0, (-2 * bk + 6 * hit) * k).rot('body', -14 * bk + 10 * hit, 0, 0).sq('body', -0.08 * bk + wob(t, 0.44, 0.12, 4, 6));
      P.scl('body', 1 + 0.1 * hit, 1 - 0.08 * hit, 1 - 0.1 * hit); fins(P, 40 * bk - 20 * hit); P.rot('tail', 20 * bk - 20 * hit);
      P.face('eyes', bk > 0.2 ? 'angry' : hit > 0.2 ? 'shut' : undefined).face('mouth', bk > 0.2 ? 'frown' : undefined); P.blinkOK = false;
      P.burst(0.44, 'spark', 'body', v3(MOUTH, 0, 0, 4 * k), { scale: 1.2 }).burst(0.44, 'star', 'body', v3(MOUTH, 0, 2 * k, 4 * k), { n: 4 });
    } },
    // special: a huge inhale through the blowpipe, cheeks of tartan puffed tight… then a booming bass note
    special: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const inh = seg(t, 0.05, 0.75, E.inout) * (1 - seg(t, 0.82, 0.9, E.out)), boom = seg(t, 0.82, 0.9, E.out) * (1 - seg(t, 1.5, 1.9, E.inout));
      P.scl('body', 1 + 0.22 * inh, 1 + 0.2 * inh, 1 + 0.12 * inh).rot('body', 6 * inh - 10 * boom, 0, 0).pos('root', 0, 0, -1.4 * boom * k);
      P.rot('jaw', 40 * boom).rot('pipe', 0, 0, wave(t, 12) * 8 * inh); fins(P, -20 * inh + 50 * boom); flukes(P, 20 * boom);
      ripple(P, t, 12 * boom, 2.5); eyesScale(P, 1 + 0.25 * inh);
      P.face('eyes', inh > 0.4 ? 'closed' : boom > 0.3 ? 'angry' : t > 1.6 ? 'smug' : undefined).face('mouth', inh > 0.2 ? 'o' : boom > 0.2 ? 'off' : undefined);
      if (t > 0.05 && t < 0.7) P.stream(SPFX.puff, 'pipe', PIPE, { rate: 14, dir: [0, -1, 0], speed: 0.4, scale: 0.6 });
      for (const r0 of [0.84, 0.98, 1.12]) P.burst(r0, 'ring', 'body', MOUTH, { scale: 1.8 * k, tint: [1, 0.6, 0.55] });
      P.burst(0.86, 'note', 'body', MOUTH, { n: 6, dir: [0, 0.3, 1], speed: 1.6, spread: 0.6 }).burst(0.86, 'dust', 'root', [0, 0, 6 * k], { n: 10, spread: 1 });
    } },
    // hurt: squished, a little air hisses out
    hurt: { len: 0.8, next: 'idle', f(P, t) {
      const h = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.25, 0.8, E.inout));
      P.pos('root', 0, 0, -2.2 * h * k).scl('body', 1 + 0.1 * h, 1 - 0.14 * h, 1 + 0.06 * h).rot('body', -10 * h + wob(t, 0.2, 3, 3, 6), 0, wave(t, 12) * 3 * h);
      fins(P, 40 * h); P.rot('jaw', 20 * h);
      P.face('eyes', t < 0.5 ? 'x' : 'sad').face('mouth', 'wavy'); P.blinkOK = false;
      P.burst(0.03, SPFX.puff, 'pipe', PIPE, { n: 6, dir: [0, 1, -0.4], speed: 1.4 }).burst(0.03, 'spark', 'body', v3(MOUTH, 0, 2 * k, 2 * k), {});
    } },
    // faint: it springs a leak — wheezes, spins slowly down and lands flat as a deflated bag
    faint: { len: 2.6, next: 'down', f(P, t) {
      const leak = seg(t, 0.1, 1.6, E.inout), spin = seg(t, 0.2, 1.4, E.inout);
      P.rot('body', 0, 200 * spin, 14 * Math.sin(t * 6) * (1 - leak)).scl('body', 1 - 0.12 * leak, 1 - 0.1 * leak, 1 - 0.1 * leak);
      flat(P, seg(t, 1.3, 1.8, E.bounce)); fins(P, 30 * Math.sin(t * 9) * (1 - leak));
      P.face('eyes', 'swirl').face('mouth', 'wavy'); P.blinkOK = false; P.lookW = 0;
      if (t < 1.4) P.stream(SPFX.puff, 'pipe', PIPE, { rate: 16, dir: [0, 1, 0], speed: 1.2, scale: 0.7 });
      P.burst(1.75, 'dust', 'root', [0, 0, 0], { n: 14, spread: 1 }).burst(1.8, 'star', 'body', TOP, { n: 4 });
    } },
    down: { len: 2.8, loop: true, f(P, t) {
      flat(P, 1); P.face('eyes', 'swirl').face('mouth', 'wavy'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.6;
      P.scl('body', 1, 1 + 0.05 * bump(t, 0.8, 1.4), 1); P.burst(1.2, SPFX.puff, 'pipe', PIPE, { n: 2, speed: 0.4, scale: 0.5 });
    } },
    // victory: a slow barrel roll, then a flipper point and a wink — "come and get your love"
    win: { len: 2.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const roll = seg(t, 0.15, 1.15, E.inout), pose = seg(t, 1.2, 1.4, E.back);
      float(P, 2.2 * bump(t, 0.1, 1.3)); P.rot('body', 0, 0, 360 * roll).rot('body', -8 * pose, 14 * pose, 0);
      fins(P, 30 * bump(t, 0.1, 1.2) + 60 * pose, -10 * pose); P.rot('finR', -40 * pose); flukes(P, 12 * Math.sin(t * 5));
      ripple(P, t, 8, 1.4); P.rot('jaw', 18 * pose);
      P.face('eyes', roll > 0.05 && roll < 0.95 ? 'happy' : pose > 0.5 ? 'wink' : undefined).face('mouth', pose > 0.4 ? 'grin' : 'smile');
      P.burst(1.2, 'heart', 'body', TOP, { n: 4 }).burst(1.25, 'sparkle', 'body', TOP, { n: 8 }); notes(P, 0.4); notes(P, 1.0);
    } },
    // asleep, drifting low with its eyes shut, the blowpipe whistling a little snore
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * Math.PI * 2);
      float(P, -1.6 + 0.4 * br); P.rot('body', 4 + 2 * br, 0, 6).scl('body', 1 + 0.04 * br, 1 + 0.05 * br, 1);
      fins(P, -14, -14); P.rot('tail', -8); flukes(P, -6); P.rot('jaw', 3 + Math.max(0, br) * 4);
      P.face('eyes', 'closed').face('mouth', br > 0.4 ? 'o' : 'flat'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'body', TOP, {}).burst(2.0, 'z', 'body', TOP, {}).burst(1.0, 'note', 'pipe', PIPE, { n: 1, scale: 0.6 });
    } },
    // the funk groove: a laid-back body roll, flipper claps on 2 and 4, the bone spine rippling like a bass line,
    // a slow side slide, a barrel roll and a flipper point to finish
    dance: { len: 3.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.4), live = 1 - seg(t, 2.4, 2.5), sd = b.n % 2 ? 1 : -1, clap = b.n % 2 ? b.pulse : 0;
      float(P, (0.8 * Math.sin(t * Math.PI * 2.5) - 0.6 * b.pulse) * live); P.rot('body', 6 * b.pulse * live, sd * 10 * live, -sd * 8 * live);
      fins(P, (20 + 50 * clap) * live, (20 + 50 * clap) * live); P.rot('finR', 0, -30 * clap * live, 0).rot('finL', 0, 30 * clap * live, 0);
      P.rot('tail', 16 * Math.sin(t * Math.PI * 2.5) * live); flukes(P, 12 * Math.sin(t * Math.PI * 2.5 - 1) * live);
      ripple(P, t, 14 * live, 1.25); P.rot('afro', 0, 0, sd * 8 * b.pulse * live).rot('jaw', 10 * b.pulse * live);
      P.pos('root', sd * 1.2 * k * (t > 1.2 && t < 2.4 ? 1 : 0) * b.pulse, 0, 0); P.rot('disco', 0, t * 240, 0);
      const roll = seg(t, 2.4, 2.9, E.inout), pt = seg(t, 2.85, 3.0, E.back);
      P.rot('body', 0, 0, 360 * roll); fins(P, 70 * pt, -10 * pt); P.rot('finR', -50 * pt).rot('body', -6 * pt, 16 * pt, 0);
      P.face('eyes', pt > 0.5 ? 'wink' : b.pulse > 0.7 ? 'smug' : undefined).face('mouth', pt > 0.5 ? 'grin' : b.pulse > 0.5 ? 'o' : 'smile');
      for (let i = 0; i < 6; i++) if (i % 2) P.burst(0.05 + i * 0.4, 'spark', 'body', [0, 6 * k, 6 * k], { scale: 0.6 });
      notes(P, 0.05); notes(P, 0.85); notes(P, 1.65); P.burst(2.9, 'sparkle', 'body', TOP, { n: 8 }).burst(2.95, 'heart', 'body', TOP, { n: 3 });
    } },
    // signature: PFFFT — the knot slips, it zips round like a let-go balloon (spinning, shrinking, honking),
    // flops in the air embarrassed, then puffs itself back up through the blowpipe, cool as ever
    deflate: { len: 4.0, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const pre = env(t, 0.0, 0.5, 0.15, 0.1), zoom = seg(t, 0.45, 1.85, E.lin), go = t > 0.45 && t < 1.85 ? 1 : 0;
      P.scl('body', 1 + 0.1 * pre, 1 + 0.1 * pre, 1); P.rot('body', 0, wave(t, 10) * 6 * pre, 0);
      // a loop-the-loop path: round in a circle and up, then back to the start
      const a = zoom * Math.PI * 2 * 1.5, R = 7 * k * go;
      P.pos('root', Math.sin(a) * R, (6 * Math.sin(zoom * Math.PI) + 2 * Math.sin(a * 2)) * k * go, (Math.cos(a) - 1) * R * 0.8);
      P.rot('body', 30 * Math.sin(a * 2) * go, (a / Math.PI) * 180 * go, 360 * zoom * go);
      const shrink = seg(t, 0.45, 1.85) * (1 - seg(t, 2.6, 3.4, E.out));
      P.scl('body', 1 - 0.32 * shrink, 1 - 0.38 * shrink, 1 - 0.28 * shrink);
      fins(P, go * 50 * Math.sin(t * 30), go * 50 * Math.sin(t * 30 + 1)); flukes(P, go * 20 * Math.sin(t * 25));
      if (go) P.stream(SPFX.puff, 'pipe', PIPE, { rate: 40, dir: [0, 0.6, -1], speed: 1.6, scale: 0.7 });
      // the flop, then the re-inflate: three big puffs into the blowpipe
      const flop = env(t, 1.85, 2.6, 0.12, 0.3); float(P, -1.2 * flop); P.rot('body', 18 * flop, 0, -14 * flop); fins(P, -30 * flop);
      for (const p0 of [2.7, 3.0, 3.3]) { const kk = bump(t, p0, p0 + 0.22); P.scl('body', 1 + 0.08 * kk, 1 + 0.1 * kk, 1 + 0.05 * kk).rot('pipe', -14 * kk); P.burst(p0, SPFX.puff, 'pipe', v3(PIPE, 0, 1 * k, 0), { n: 3, dir: [0, -1, 0], speed: 0.5, scale: 0.6 }); }
      P.face('eyes', t < 0.45 ? 'shock' : go ? 'swirl' : t < 2.6 ? 'sad' : t < 3.55 ? 'closed' : 'smug').face('mouth', t < 0.45 ? 'o' : go ? 'wavy' : t < 2.6 ? 'frown' : t < 3.55 ? 'o' : 'smile');
      P.burst(0.45, 'note', 'pipe', PIPE, { n: 3, speed: 1.5 }).burst(1.86, 'sweat', 'body', TOP, { n: 3 }).burst(3.6, 'sparkle', 'body', TOP, { n: 6 });
    } },
    // fidget: squeezes its own bag with both flippers and the pipes drone a short, proud skirl
    skirl: { len: 2.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const sq = env(t, 0.1, 2.1, 0.25, 0.3), pump = Math.abs(Math.sin(t * Math.PI * 3)) * sq;
      fins(P, -40 * sq, -40 * sq); P.rot('finR', 0, -40 * sq, 0).rot('finL', 0, 40 * sq, 0);
      P.scl('body', 1 - 0.06 * pump, 1 + 0.04 * pump, 1 - 0.04 * pump).rot('body', -8 * sq, 0, wave(t, 1.5) * 4 * sq); P.rot('jaw', 6 * sq);
      for (const d of DRONES) P.rot(d, 0, 0, wave(t, 6) * 4 * sq);
      ripple(P, t, 6 * sq, 3);
      P.face('eyes', sq > 0.4 ? 'closed' : undefined).face('mouth', sq > 0.3 ? 'o' : undefined);
      for (const n0 of [0.4, 0.8, 1.2, 1.6]) notes(P, n0);
    } },
  };
  return {
    start: 'idle', seed: 40 + S.stage,
    breathe: { bone: 'body', amp: 0.025, per: 3.2 },
    blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.5], dur: 0.14 },
    look: { bone: 'body', yaw: 14, pitch: 6, speed: 2.5 },
    springs: [
      ...VERTS.map((n, i) => ({ bone: n, tip: [0, 2, 0], k: 160 - i * 8, d: 7, gain: 0.8 + i * 0.1, max: 16, axes: [1, 0, 1] })),
      { bone: 'str1', tip: [0, -1.4, 0], k: 60, d: 3, gain: 1.6, max: 40 },
      { bone: 'str2', tip: [0, -1.0, 0], k: 50, d: 3, gain: 1.8, max: 45 },
      { bone: 'str3', tip: [0, -1.0, 0], k: 40, d: 3, gain: 2.0, max: 50 },
      { bone: 'disco', tip: [0, -3, 0], k: 70, d: 4, gain: 1.2, max: 30, axes: [1, 0, 1] },
      { bone: 'afro', tip: [0, 2.5, 1], k: 160, d: 8, gain: 0.5, max: 10 },
      { bone: 'tail', tip: [0, 0, -4], k: 150, d: 8, gain: 0.5, max: 10 },
      ...DRONES.map((n) => ({ bone: n, tip: [0, 6, 0], k: 140, d: 6, gain: 0.7, max: 10 })),
      ...(S.drones ? [{ bone: 'cord', tip: [0, -3, 0], k: 70, d: 4, gain: 1.4, max: 35 }] : []),
    ],
    faces: { eyes: EYES.slot, mouth: { ...S.mouth, states: { ...S.mouth.states, off: [] } } },
    fidget: { every: [4, 8], clips: ['dance', 'dance', 'deflate', 'deflate', 'skirl'] },
    clips,
  };
}
const v3 = (p, dx, dy, dz) => [p[0] + dx, p[1] + dy, p[2] + dz];
