// Alamo Hill Park — rect [0, 32, 104, 98]. North edge (z 32) meets Bay Street, south edge (z 98) Market
// Street, east edge (x 104) Van Ness. A big green park on a gentle hill:
//
//   x 0 ──── 13 ─ 17 ─────────────────────────────────────────────────── 104
//   z 32  rose    L  playground          north path   meadow (grass1)   half-court
//         garden  A                         │
//   z 51  ┌─────┐ N  tall grass (grass2)  ╱‾‾ HILL ‾‾╲   bandstand ── Van Ness gate
//         │PAINT│ E  west path ───── viewpoint (summit, telescope)
//         │ED   │                   ╲__  (grass3)  ╲__ main paver path
//         │LADIES  picnic lawn             pond + bridge      fountain plaza (SE gate)
//   z 98  └─────┘ ─────────────────────── MARKET STREET ─────────────────────────
//
// The ground is a 1 m grid of terrace levels (0.3 m each — one easy step), so the hill reads as stacked
// grassy terraces with stone steps wherever a path climbs. Everything is walkable except water, beds,
// buildings and props.
import { TX } from '../build.js';
import './props_dt.js';
import './pk_props.js';
import * as K from './pk_tex.js';
import { fadeable, groundDecal, rng } from './dt_kit.js';
import { detail, RESERVED } from './pk_more.js';   // the close-up pass: gazebo, beds, pond life, ground cover, more interactables
import { LITTER } from '../props_trees.js';

const PI = Math.PI, LH = 0.3;
const G = { GRASS: 0, PATH: 1, PAVER: 2, VOID: 3, POND: 4, SAND: 5, COURT: 6, PLAZA: 7, LANE: 8, TALL: 9, YARD: 10 };

// close-up detail: the stock furniture swaps for the park's own detailed kinds (pk_detail.js) while the park builds
const SWAP = { bench: 'pk2_bench', pk_lamp: 'pk2_lamp', bin: 'pk2_bin', pk_duck: 'pk2_mallard', pk_lily: 'pk2_lily', pk_reeds: 'pk2_cattails', pk_blanket: 'pk2_picnic' };
export function build(C, B, ctx) {
  const prop = C.prop;
  C.prop = function (kind, x, z, o) { return prop.call(this, SWAP[kind] || kind, x, z, o); };
  try { return build0(C, B, ctx); } finally { C.prop = prop; }
}
function build0(C, [X0, Z0, X1, Z1], ctx) {
  const night = !!ctx.night, R = rng(9091);
  const NX = X1 - X0, NZ = Z1 - Z0, N = NX * NZ;
  const lev = new Int16Array(N), typ = new Uint8Array(N), fixed = new Uint8Array(N);
  const at = (i, k) => k * NX + i, inb = (i, k) => i >= 0 && k >= 0 && i < NX && k < NZ;
  const cell = (x, z) => [Math.floor(x - X0), Math.floor(z - Z0)];
  const T = (x, z) => { const [i, k] = cell(x, z); return inb(i, k) ? typ[at(i, k)] : -1; };
  const eachCell = (fn) => { for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) fn(i, k, X0 + i + 0.5, Z0 + k + 0.5, at(i, k)); };

  // ================================================================ the hill: smooth, then quantised to 0.3 m levels
  const HX = 49.5, HZ = 62.5, RX = 27, RZ = 22, LMAX = 10;
  eachCell((i, k, x, z, c) => { const d = Math.hypot((x - HX) / RX, (z - HZ) / RZ), t = Math.max(0, Math.min(1, (1 - d) / 0.78)); lev[c] = Math.round(LMAX * t * t * (3 - 2 * t)); });
  // flat features (level, type) — fixed cells are not touched by the smoothing
  const rect = (x0, z0, x1, z1, t, L) => eachCell((i, k, x, z, c) => { if (x > x0 && x < x1 && z > z0 && z < z1) { typ[c] = t; if (L !== undefined) { lev[c] = L; fixed[c] = 1; } } });
  const ellipse = (cx, cz, rx, rz, t, L) => eachCell((i, k, x, z, c) => { if (((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 <= 1) { typ[c] = t; if (L !== undefined) { lev[c] = L; fixed[c] = 1; } } });
  eachCell((i, k, x, z, c) => { if (i < 1 || k < 1 || i >= NX - 1 || k >= NZ - 1) { lev[c] = 0; fixed[c] = 1; } });
  rect(0, 32, 13, 51, G.GRASS, 0);                // rose garden
  rect(0, 51, 10.5, 96.5, G.VOID, 0);             // painted ladies
  rect(10.5, 51, 13, 96.5, G.YARD, 0);            // their front yards
  rect(0, 96.5, 13, 98, G.YARD, 0);
  rect(13, 32, 17, 98, G.LANE, 0);                // Steiner Walk (the lane in front of the houses)
  rect(19, 35, 37, 49, G.SAND, 0);                // playground
  rect(86, 34, 102, 48, G.COURT, 0);              // half-court
  rect(78, 53, 86, 61, G.VOID, 0);                // bandstand
  rect(86, 85, 104, 98, G.PLAZA, 0);              // fountain plaza (south-east gate)
  ellipse(70, 85.5, 10, 6.5, G.POND, 0);          // the pond
  rect(45, 58.5, 54.5, 66.5, G.PLAZA, LMAX);      // the viewpoint on the summit
  // paths: polylines rasterised onto the grid (paths keep the terrace levels: you climb by stone steps)
  const ring = []; for (let a = 0; a < 28; a++) ring.push([70 + Math.cos((a / 28) * 2 * PI) * 12.2, 85.5 + Math.sin((a / 28) * 2 * PI) * 8.8]);
  const PATHS = {
    main: { pts: [[93, 88], [85, 84], [80.5, 77], [74, 72], [64, 68], [55, 64.5]], w: 3.0, t: G.PAVER },
    north: { pts: [[59.5, 31], [60, 38], [57, 46], [53, 53], [51, 58.6]], w: 2.2, t: G.PATH },
    west: { pts: [[16.5, 66], [24, 65], [32, 63.5], [40, 62.5], [45.2, 62.5]], w: 2.2, t: G.PATH },
    pond: { pts: [...ring, ring[0]], w: 2.0, t: G.PATH },
    sw: { pts: [[46, 66.3], [41, 73], [35.5, 80], [31.5, 88], [30.5, 99]], w: 2.0, t: G.PATH },
    east: { pts: [[105, 58], [96, 57.5], [86.2, 57]], w: 2.4, t: G.PATH },
    east2: { pts: [[77.8, 57], [70, 59], [62, 61], [54.4, 62]], w: 2.2, t: G.PATH },
    nw: { pts: [[36, 44], [42, 50], [46, 55], [48, 58.6]], w: 2.0, t: G.PATH },
    picnic: { pts: [[16.5, 90], [30, 91], [45, 92], [57.9, 88]], w: 2.0, t: G.PATH },
    court: { pts: [[95, 57], [94, 47.5]], w: 2.0, t: G.PATH },
    bridgeN: { pts: [[70, 76.4], [70, 79.5]], w: 2.4, t: G.PATH },
  };
  const segD = (px, pz, [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2)); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const pathD = (P, x, z) => { let d = 1e9; for (let s = 0; s < P.pts.length - 1; s++) d = Math.min(d, segD(x, z, P.pts[s], P.pts[s + 1])); return d; };
  for (const P of Object.values(PATHS)) eachCell((i, k, x, z, c) => { if (typ[c] === G.VOID || typ[c] === G.POND || typ[c] === G.LANE || typ[c] === G.PLAZA || typ[c] === G.COURT || typ[c] === G.SAND) return; if (pathD(P, x, z) < P.w / 2) typ[c] = P.t; });
  // tall grass where wild Tokonmon hide
  const TALLS = { grass1: [63, 37, 75, 47], grass2: [19, 51, 28, 60.5], grass3: [23.5, 69, 33, 79] };
  for (const [x0, z0, x1, z1] of Object.values(TALLS)) eachCell((i, k, x, z, c) => { if (x > x0 && x < x1 && z > z0 && z < z1 && typ[c] === G.GRASS) typ[c] = G.TALL; });
  // smoothing: no step of more than one level between neighbours (lowering wins, so flat features never get cliffs)
  const walkT = (t) => t !== G.VOID && t !== G.POND;
  for (let it = 0; it < 24; it++) {
    let ch = 0;
    eachCell((i, k, x, z, c) => {
      if (fixed[c] || !walkT(typ[c])) return;
      let mx = -99, mn = 99;
      for (let dk = -1; dk <= 1; dk++) for (let di = -1; di <= 1; di++) { if (!di && !dk) continue; const ii = i + di, kk = k + dk; if (!inb(ii, kk)) continue; const n = at(ii, kk); if (!walkT(typ[n])) continue; mx = Math.max(mx, lev[n]); mn = Math.min(mn, lev[n]); }
      let L = lev[c]; if (L > mn + 1) L = mn + 1; else if (L < mx - 1) L = mx - 1;
      if (L !== lev[c]) { lev[c] = L; ch++; }
    });
    if (!ch) break;
  }
  const Y = (x, z) => { const [i, k] = cell(x, z); return inb(i, k) ? lev[at(i, k)] * LH : 0; };

  // ================================================================ draw the terrain: tops (row runs), risers (south + east faces), nav, minimap
  const grassA = TX.grass('#6aac4c'), grassB = TX.grass('#62a246'), tallG = TX.grass('#4e8e3a'), yard = TX.grass('#74b454');
  const TEX = {
    [G.PATH]: TX.dirt('#c8a472'), [G.PAVER]: TX.pavers('#dccfb8'), [G.SAND]: K.sandTex(), [G.COURT]: TX.asphalt('#3a8a5a'),
    [G.PLAZA]: TX.pavers('#e6d8c2'), [G.LANE]: TX.cobble('#b4aa9e'), [G.TALL]: tallG, [G.YARD]: yard,
  };
  const MM = { [G.GRASS]: '#6aa858', [G.TALL]: '#4e8a3a', [G.PATH]: '#c8a472', [G.PAVER]: '#d8ccb8', [G.SAND]: '#e8d4a0', [G.COURT]: '#3a8a5a', [G.PLAZA]: '#e0d4c0', [G.LANE]: '#b4aa9e', [G.YARD]: '#74b454' };
  const texOf = (c) => (typ[c] === G.GRASS ? (lev[c] & 1 ? grassB : grassA) : TEX[typ[c]]);
  // the pond: water, a dark bed under it (land cells inside its bounding box are drawn over it)
  C.quad('ground', TX.dirt('#3e4a3a'), [59, -0.95, 93], [81, -0.95, 93], [81, -0.95, 78], [59, -0.95, 78], { u0: 59, v0: -93 });
  C.water(60, 79, 80, 92, { y: -0.42, col: '#3a8ab0' });
  for (let k = 0; k < NZ; k++) {
    let i = 0;
    while (i < NX) {
      const c = at(i, k); if (!walkT(typ[c])) { i++; continue; }
      const tx = texOf(c), L = lev[c]; let j = i + 1;
      while (j < NX) { const c2 = at(j, k); if (!walkT(typ[c2]) || lev[c2] !== L || texOf(c2) !== tx) break; j++; }
      C.ground(X0 + i, Z0 + k, X0 + j, Z0 + k + 1, tx, { y: L * LH, mm: MM[typ[c]] });
      i = j;
    }
  }
  // risers: a face wherever a cell stands above its south / east neighbour (or above the pond)
  const bank = K.bankTex('#5a9a44'), bankT = K.bankTex('#4a8a36'), step = K.stepTex(), pondBank = K.stoneTex('#9a9488');
  const riserTex = (c, n) => (!walkT(typ[n]) ? pondBank : typ[c] === G.PATH || typ[c] === G.PAVER || typ[c] === G.PLAZA ? step : typ[c] === G.TALL ? bankT : bank);
  const lower = (n) => (typ[n] === G.POND ? -0.95 : walkT(typ[n]) ? lev[n] * LH : null);
  for (let k = 0; k < NZ - 1; k++) {        // south-facing
    let i = 0;
    while (i < NX) {
      const c = at(i, k), n = at(i, k + 1), yb = lower(n), yt = walkT(typ[c]) ? lev[c] * LH : null;
      if (yt === null || yb === null || yt <= yb) { i++; continue; }
      const tx = riserTex(c, n); let j = i + 1;
      while (j < NX) { const c2 = at(j, k), n2 = at(j, k + 1); if (!walkT(typ[c2]) || lower(n2) !== yb || lev[c2] * LH !== yt || riserTex(c2, n2) !== tx) break; j++; }
      const z = Z0 + k + 1, xa = X0 + i, xb = X0 + j;
      C.quad('ground', tx, [xa, yb, z], [xb, yb, z], [xb, yt, z], [xa, yt, z], { u0: xa, v0: yb });
      i = j;
    }
  }
  for (let i = 0; i < NX - 1; i++) {        // east-facing
    let k = 0;
    while (k < NZ) {
      const c = at(i, k), n = at(i + 1, k), yb = lower(n), yt = walkT(typ[c]) ? lev[c] * LH : null;
      if (yt === null || yb === null || yt <= yb) { k++; continue; }
      const tx = riserTex(c, n); let j = k + 1;
      while (j < NZ) { const c2 = at(i, j), n2 = at(i + 1, j); if (!walkT(typ[c2]) || lower(n2) !== yb || lev[c2] * LH !== yt || riserTex(c2, n2) !== tx) break; j++; }
      const x = X0 + i + 1, za = Z0 + k, zb = Z0 + j;
      C.quad('ground', tx, [x, yb, zb], [x, yb, za], [x, yt, za], [x, yt, zb], { u0: -zb, v0: yb });
      k = j;
    }
  }
  C.zone('Alamo Hill Park', X0, Z0, X1, Z1, { label: 'Alamo Hill Park', sub: 'San Francisco', music: 'lemon', bed: 'birds', step: 'step_grass' });

  // ================================================================ helpers for placing things along paths
  const along = (P, t, side = 1, off = 2) => {
    const pts = P.pts, L = []; let tot = 0; for (let s = 0; s < pts.length - 1; s++) { const d = Math.hypot(pts[s + 1][0] - pts[s][0], pts[s + 1][1] - pts[s][1]); L.push(d); tot += d; }
    let s = 0, u = t * tot; while (s < L.length - 1 && u > L[s]) { u -= L[s]; s++; }
    const [ax, az] = pts[s], [bx, bz] = pts[s + 1], f = Math.min(1, u / L[s]), tx = (bx - ax) / L[s], tz = (bz - az) / L[s], nx = -tz * side, nz = tx * side;
    return { x: ax + (bx - ax) * f + nx * off, z: az + (bz - az) * f + nz * off, fx: -nx, fz: -nz };   // f* = facing back toward the path
  };
  const benchYaw = (fx, fz) => Math.atan2(-fx, -fz);   // stock bench: its sitter faces −z at yaw 0
  const propYaw = (fx, fz) => Math.atan2(fx, fz);       // our props: their front faces +z at yaw 0

  paintedLadies(C, night);
  roseGarden(C);
  playground(C);
  halfCourt(C);
  bandstand(C);
  fountainPlaza(C);
  pondAndBridge(C, ring);
  viewpoint(C, LMAX * LH);
  picnic(C);
  tallGrass(C, TALLS, R);
  edges(C);
  pathFurniture(C, PATHS, along, benchYaw);
  detail(C, ctx, { T, Y, R, along, PATHS, benchYaw });
  trees(C, R, T, Y);
  people(C, ring);
}

// ==================================================================== PAINTED LADIES (x 0.5–10.5, z 51–96, facing east onto Steiner Walk)
const LADIES = [
  { wall: '#8ee0c4', trim: '#fbf8f0', acc: '#1e7a64', roof: '#2e5a5a', fish: '#f490b0', fh: 3.0, rh: 3.0, n: 710 },
  { wall: '#ffaac4', trim: '#fbf8f0', acc: '#a8264e', roof: '#5a2e44', fish: '#9ad8f0', fh: 3.1, rh: 3.3, n: 712 },
  { wall: '#ffe07a', trim: '#fbf8f0', acc: '#2e5aa8', roof: '#3a4a6a', fish: '#f0784a', fh: 2.95, rh: 2.8, n: 714 },
  { wall: '#c4a8f0', trim: '#fbf8f0', acc: '#5a2e8a', roof: '#4a3a5e', fish: '#ffe07a', fh: 3.1, rh: 3.2, n: 716 },
  { wall: '#98c4f4', trim: '#fbf8f0', acc: '#1e3a7a', roof: '#2e3e5e', fish: '#ffaac4', fh: 3.0, rh: 3.0, n: 718 },
  { wall: '#ffbc90', trim: '#fbf8f0', acc: '#8a3a22', roof: '#5a3a32', fish: '#8ee0c4', fh: 3.05, rh: 3.4, n: 720 },
];
const KNOCK = [
  ['A voice calls: "If you\'re selling pastel paint, we\'re fully stocked!"'],
  ['Nobody answers. A sleepy Tokonmon peeks through the lace curtains, then hides.'],
  ['"Tourists again? …Oh, a trainer! Mind my roses on your way out, dear."'],
  ['A wind chime tinkles. Somewhere inside, someone is practising the cello.'],
  ['"We\'re on postcards, you know. Every single day, someone takes our picture."'],
  ['The door opens a crack. "No, the park is not our backyard. …It IS a very nice view, though."'],
];
function paintedLadies(C, night) {
  LADIES.forEach((L, i) => {
    const x = 0.5, w = 10, z = 51 + i * 7.5, d = 7.5, fh = L.fh, H = fh * 3, xe = x + w, zc = z + d / 2;
    const B = C.building({ name: 'Painted Lady ' + L.n, x, z, w, d, floors: 3, fh, wall: TX.siding(L.wall), trim: L.trim, base: '#7a6a60',
      roof: { type: 'gable', ridge: 'x', tex: TX.shingles(L.roof), h: L.rh, eave: 0.3 }, windows: { skip: ['n', 's', 'e', 'w'] }, mm: L.wall });
    const g = (k) => B.gk(k, 'front'), roof = `b${B.id}:roof`, trim = TX.solid(L.trim), acc = TX.solid(L.acc);
    // corner boards and accent bands at each floor line
    for (const zz of [z + 0.02, z + d - 0.18]) C.box(g(0), trim, xe, 0.35, zz, xe + 0.08, H, zz + 0.16);
    for (let k = 1; k < 3; k++) C.box(g(k), acc, xe, k * fh - 0.2, z, xe + 0.07, k * fh - 0.08, z + d);
    // a two-storey bay window on the south half of the façade: accent corner posts, panels under the sills, a cornice cap
    const bz0 = z + 1.0, bz1 = z + 3.8, bx = xe + 0.9;
    C.box(g(0), TX.siding(L.wall), xe, 0, bz0, bx, fh * 2 - 0.2, bz1, { top: trim });
    C.box(g(1), trim, xe - 0.02, fh * 2 - 0.2, bz0 - 0.14, bx + 0.16, fh * 2 + 0.08, bz1 + 0.14, { top: acc });
    for (const zz of [bz0, bz1 - 0.12]) C.box(g(0), acc, bx - 0.02, 0, zz, bx + 0.04, fh * 2 - 0.2, zz + 0.12);
    for (let k = 0; k < 2; k++) C.box(g(k), acc, bx, k * fh + 0.2, bz0 + 0.12, bx + 0.03, k * fh + 0.75, bz1 - 0.12);
    for (let k = 0; k < 2; k++) {
      const y = k * fh + 0.85;
      for (const zz of [bz0 + 0.75, bz1 - 0.75]) C.decal(g(k), K.ladyWindow(L.trim, L.acc, night && (i + k) % 2 === 0), bx, y, zz, 'e', 0.8, 1.8, { off: 0.02 });
      C.decal(g(k), K.ladyWindow(L.trim, L.acc, false), (xe + bx) / 2, y + 0.2, bz1, 's', 0.45, 1.5, { off: 0.02 });
      C.box(g(k), trim, xe, k * fh + fh - 0.16, bz0 - 0.02, bx + 0.06, k * fh + fh - 0.04, bz1 + 0.02);
    }
    // the stoop and the front door (north half), with a porch hood on brackets
    const dz = z + 5.6;
    C.box(g(0), TX.solid('#e8e0d0'), xe, 0, dz - 0.9, xe + 0.9, 0.9, dz + 0.9, { top: TX.solid('#d8d0c0') });
    C.box(g(0), TX.solid('#e8e0d0'), xe + 0.9, 0, dz - 0.9, xe + 1.2, 0.6, dz + 0.9); C.box(g(0), TX.solid('#e8e0d0'), xe + 1.2, 0, dz - 0.9, xe + 1.5, 0.3, dz + 0.9);
    for (const s of [-1, 1]) { C.box(g(0), trim, xe, 0.9, dz + s * 0.86 - 0.04, xe + 1.4, 1.0, dz + s * 0.86 + 0.04); C.box(g(0), acc, xe + 1.36, 0, dz + s * 0.86 - 0.06, xe + 1.48, 1.05, dz + s * 0.86 + 0.06); }
    C.decal(g(0), K.ladyDoor(L.acc, L.trim), xe, 0.9, dz, 'e', 1.1, 2.4, { off: 0.03 });
    C.decal(g(0), K.houseNumber(L.n), xe, 2.0, dz - 0.95, 'e', 0.4, 0.2, { off: 0.03 });
    C.box(g(1), trim, xe, 3.45, dz - 0.95, xe + 0.75, 3.6, dz + 0.95, { top: acc }); for (const s of [-1, 1]) C.box(g(1), acc, xe, 3.2, dz + s * 0.8 - 0.05, xe + 0.3, 3.45, dz + s * 0.8 + 0.05);
    C.nav.block(xe, dz - 1.0, xe + 1.55, dz + 1.0); C.nav.block(xe, bz0, bx + 0.05, bz1);
    // upstairs windows
    C.decal(g(1), K.ladyWindow(L.trim, L.acc, night && i % 2 === 1), xe, fh + 0.85, dz, 'e', 0.85, 1.85, { off: 0.03 });
    for (const zz of [z + 2.4, dz]) C.decal(g(2), K.ladyWindow(L.trim, L.acc, night && (i + (zz > dz - 1 ? 1 : 0)) % 3 === 0), xe, fh * 2 + 0.8, zz, 'e', 0.85, 1.85, { off: 0.03 });
    // cornice: gingerbread frieze, brackets, and the fish-scale gable with an attic window
    C.box(roof, TX.solid(L.trim), xe - 0.02, H - 0.32, z - 0.05, xe + 0.28, H - 0.02, z + d + 0.05, { e: K.friezeTex(L.trim, L.acc), v0: 0 });
    for (let zz = z + 0.4; zz < z + d - 0.2; zz += 0.85) C.box(roof, acc, xe, H - 0.7, zz - 0.06, xe + 0.22, H - 0.42, zz + 0.06);
    const rh = L.rh, inset = 0.35;
    C.tri(roof, K.fishScale(L.fish), [xe + 0.03, H + 0.02, z + inset], [xe + 0.03, H + 0.02, z + d - inset], [xe + 0.03, H + rh - 0.45, zc]);
    C.decal(roof, K.ladyWindow(L.trim, L.acc, night), xe + 0.03, H + 0.35, zc, 'e', 0.6, 1.25, { off: 0.03 });
    C.box(roof, acc, xe + 0.02, H + rh - 0.2, zc - 0.08, xe + 0.3, H + rh + 0.5, zc + 0.08);
    // front yard: a low hedge in front of the bay, flowers, a little gate
    C.prop('pk_hedge', 12.4, z + 2.4, { yaw: PI / 2 }); C.prop(['pk_flowers_r', 'pk_flowers_y', 'pk_flowers_p', 'pk_flowers_w', 'pk_flowers_b', 'pk_flowers_r'][i], 11.8, z + 0.6);
    C.interact({ x: 12.9, z: dz, label: 'Knock on the door', icon: 'door', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('doorbell'); await app.say('', ...KNOCK[i]); } });
  });
  // a low iron fence along the front yards (gaps at the stoops)
  for (let z = 51.5; z < 96; z += 2) { const i = Math.floor((z - 51) / 7.5), dz = 51 + i * 7.5 + 5.6; if (Math.abs(z + 1 - dz) < 1.6) continue; C.prop('pk_fence', 12.95, z + 1, { yaw: PI / 2 }); }
  C.interact({ x: 15, z: 73.5, label: 'Admire the painted ladies', icon: 'eye', act: async (app) => app.say('', 'Six Victorian row houses in mint, rose, butter, lavender, sky and peach — fish-scale gables, gingerbread trim, bay windows.', 'Locals call them the Painted Ladies. Tokonmon seem to love napping on their sunny stoops.') });
}

// ==================================================================== ROSE GARDEN (north-west corner)
function roseGarden(C) {
  const stone = K.stoneTex('#b8b0a4'), soil = K.soilTex();
  const bed = (x0, z0, x1, z1, kinds) => {
    C.box('ground', stone, x0, 0, z0, x1, 0.35, z1, { top: soil }); C.nav.block(x0, z0, x1, z1);
    let n = 0; for (let x = x0 + 0.5; x < x1 - 0.3; x += 0.9) for (let z = z0 + 0.5; z < z1 - 0.3; z += 0.9) C.prop(kinds[n++ % kinds.length], x, z, { y: 0.35, collide: false });
  };
  bed(2, 35, 5.5, 39, ['pk_flowers_r', 'pk_flowers_p']); bed(7.5, 35, 11, 39, ['pk_flowers_y', 'pk_flowers_w']);
  bed(2, 44, 5.5, 48, ['pk_flowers_w', 'pk_flowers_r']); bed(7.5, 44, 11, 48, ['pk_flowers_p', 'pk_flowers_b']);
  C.ground(5.5, 39, 7.5, 44, K.mulchTex(), { y: 0.01 }); C.prop('pk_birdbath', 6.5, 41.5);
  C.prop('bench', 3.2, 41.5, { yaw: PI / 2 }); C.prop('bench', 10.0, 41.5, { yaw: -PI / 2 });
  for (const x of [1.2, 12.0]) C.prop('pk_lamp', x, 34);
  C.interact({ x: 6.5, z: 39.6, label: 'Smell the roses', icon: 'leaf', act: async (app) => app.say('', 'Old garden roses, heavy with scent. A tiny brass tag reads: "Planted by the Alamo Hill Garden Club, 1923."') });
  C.interact({ x: 6.5, z: 43.4, label: 'Look at the birdbath', icon: 'drop', act: async (app) => app.say('', 'A little red bird is having the bath of its life.') });
  C.npc({ id: 'pk_gardener', who: 'passerby4', name: 'Gardener Rose', x: 6.5, z: 49.4, yaw: PI, lines: [['These roses are older than me — and I\'m very old, dear.', 'If you see a Bio-type Tokonmon nibbling the petals, shoo it gently. Gently!'], ['The tall grass by the playground rustles all day. Something lives in there.']] });
}

// ==================================================================== PLAYGROUND (x 19–37, z 35–49)
function playground(C) {
  groundDecal(C, K.rubberTex('#e8604a'), 21, 36.4, 29, 41.6, 0.012); groundDecal(C, K.rubberTex('#4a8ad8'), 29.6, 36.4, 35.4, 41.4, 0.012);
  groundDecal(C, K.rubberTex('#5ab86a'), 21.4, 43, 29.4, 48, 0.012);
  const wood = TX.planks('#a8743e');
  for (const [x0, z0, x1, z1] of [[19, 35, 37, 35.25], [19, 35, 19.25, 41], [19, 44.5, 19.25, 49], [36.75, 35, 37, 41], [36.75, 44.5, 37, 49]]) { C.box('ground', wood, x0, 0, z0, x1, 0.25, z1); }
  C.prop('pk_slide', 25, 38.8); C.prop('pk_swing', 32.5, 38.6); C.prop('pk_dome', 25.4, 45.4); C.prop('pk_seesaw', 33.2, 46.0);
  C.prop('pk_spring', 29.6, 43.6, { yaw: 0.4 }); C.prop('pk_spring', 31.2, 44.2, { yaw: -0.3 });
  C.prop('bench', 20.6, 44.4, { yaw: -PI / 2 }); C.prop('bench', 35.6, 43.0, { yaw: PI / 2 }); C.prop('bin', 36.2, 48.4); C.prop('pk_drink', 19.8, 48.4);
  C.interact({ x: 28.2, z: 40.6, label: 'Go down the slide', icon: 'star', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('whoosh'); await app.say('', 'Wheee! …You are definitely too big for this slide. Your partner wants another go.'); } });
  C.interact({ x: 32.5, z: 40.4, label: 'Ride the swings', icon: 'star', act: async (app) => app.say('', 'You swing higher and higher until you can see over the hedges to Bay Street.') });
  C.spot('playground', 28.5, 42.4, PI);
  C.npc({ id: 'pk_kidslide', who: 'passerby35', name: 'Kid', x: 26.6, z: 41.9, yaw: 0.5, clip: 'jump', lines: [['My Tokonmon can go down the slide FIVE times faster than me!', 'Mom says no Tokon battles in the playground. Only Tokon tag.']] });
}

// ==================================================================== HALF-COURT (x 86–102, z 34–48)
function halfCourt(C) {
  groundDecal(C, K.halfCourtTex(), 86, 34, 102, 48, 0.012);
  C.prop('pk_hoop', 94, 34.9);
  for (let x = 87; x < 102; x += 2) C.prop('dt_fence', x, 33.4);
  for (let z = 35; z < 47; z += 2) C.prop('dt_fence', 86.4, z, { yaw: PI / 2 });
  C.prop('bench', 99.6, 48.9, { yaw: 0 }); C.prop('bin', 101.4, 48.8);
  C.interact({ x: 94, z: 40.6, label: 'Shoot some hoops', icon: 'star', act: async (app) => { const ok = Math.random() < 0.5; if (app.audio && app.audio.sfx) app.audio.sfx(ok ? 'reward' : 'thud'); await app.say('', ok ? 'Swish! Nothing but net. Your partner does a victory lap.' : 'Clang! Off the rim. Your partner fetches the ball… and keeps it.'); } });
  C.npc({ id: 'pk_baller', who: 'passerby47', name: 'Baller', x: 97.2, z: 42.0, yaw: -2.2, clip: 'flex', lines: [['Twenty-one, shirts versus Tokonmon. The Tokonmon always win. Every. Single. Time.']] });
}

// ==================================================================== BANDSTAND (x 78–86, z 53–61): a raised octagon with a red roof
function bandstand(C) {
  const cx = 82, cz = 57, Rr = 3.6, deck = 0.6, H = 3.5;
  const B = fadeable(C, 'bandstand', 77.6, 52.6, 8.8, 8.8, H + 2.2, { inside: [78.6, 53.6, 85.4, 60.4], pitched: true, step: 'step_wood' });
  C.plinth(78, 53, 86, 61, 0.3, TX.planks('#c8a070'), K.stoneTex('#c8c0b0'), { mm: '#c8a070' });
  C.plinth(78.6, 53.6, 85.4, 60.4, deck, K.deckTex(), TX.solid('#f4f0e8'), { mm: '#c8a070' });
  const pts = []; for (let a = 0; a < 8; a++) { const t = (a / 8) * 2 * PI + PI / 8; pts.push([cx + Math.cos(t) * Rr, cz + Math.sin(t) * Rr]); }
  const white = TX.solid('#f8f4ec'), green = TX.solid('#2a5a3a');
  for (const [x, z] of pts) { C.box(B.back, white, x - 0.1, deck, z - 0.1, x + 0.1, deck + H, z + 0.1); C.nav.block(x - 0.15, z - 0.15, x + 0.15, z + 0.15); }
  // balustrade between the posts (open on the south side, where the steps are)
  for (let a = 0; a < 8; a++) {
    const [x0, z0] = pts[a], [x1, z1] = pts[(a + 1) % 8], mz = (z0 + z1) / 2;
    if (mz > cz + 2.5) continue;
    const n = 6; for (let s = 1; s < n; s++) { const x = x0 + (x1 - x0) * s / n, z = z0 + (z1 - z0) * s / n; C.box(B.back, white, x - 0.03, deck, z - 0.03, x + 0.03, deck + 0.85, z + 0.03); }
    C.quad(B.back, green, [x0, deck + 0.85, z0], [x1, deck + 0.85, z1], [x1, deck + 0.95, z1], [x0, deck + 0.95, z0]);
    for (let s = 0; s <= 8; s++) { const x = x0 + (x1 - x0) * s / 8, z = z0 + (z1 - z0) * s / 8; C.nav.block(x - 0.12, z - 0.12, x + 0.12, z + 0.12); }
  }
  // roof: an eight-sided red pyramid with a frieze and a gold finial
  const eave = pts.map(([x, z]) => [cx + (x - cx) * 1.18, cz + (z - cz) * 1.18]), top = [cx, deck + H + 2.0, cz], rt = K.bandRoofTex(), fr = K.bandFriezeTex();
  for (let a = 0; a < 8; a++) {
    const [x0, z0] = eave[a], [x1, z1] = eave[(a + 1) % 8];
    C.tri(B.roof, rt, [x1, deck + H, z1], [x0, deck + H, z0], top);
    const [p0x, p0z] = pts[a], [p1x, p1z] = pts[(a + 1) % 8];
    C.quad(B.roof, fr, [p0x, deck + H - 0.35, p0z], [p1x, deck + H - 0.35, p1z], [p1x, deck + H, p1z], [p0x, deck + H, p0z], { fit: true });
  }
  C.box(B.roof, TX.solid('#f8f4ec'), cx - 0.3, deck + H + 1.8, cz - 0.3, cx + 0.3, deck + H + 2.1, cz + 0.3); C.box(B.roof, TX.solid('#e8c060'), cx - 0.08, deck + H + 2.1, cz - 0.08, cx + 0.08, deck + H + 2.8, cz + 0.08);
  // music stands and a drum kit on the deck
  for (const [x, z] of [[80.6, 56.0], [82.0, 55.4], [83.4, 56.0]]) { C.box(B.back, TX.solid('#2a2e38'), x - 0.03, deck, z - 0.03, x + 0.03, deck + 1.1, z + 0.03); C.box(B.back, TX.solid('#2a2e38'), x - 0.25, deck + 1.0, z - 0.02, x + 0.25, deck + 1.3, z + 0.02); }
  C.box(B.back, TX.solid('#e8473a'), 81.5, deck, 57.6, 82.5, deck + 0.55, 58.4, { top: TX.solid('#f4f0e8') }); C.nav.block(81.5, 57.6, 82.5, 58.4);
  C.interact({ x: 82, z: 59.6, label: 'Take the stage', icon: 'music', mm: true, act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('furin'); await app.say('', 'You tap the old bass drum. BOOM. A flock of pigeons takes off, and a jogger gives you a thumbs-up.', 'A sign: "SUNDAY CONCERTS — 2 PM. Tokonmon welcome (no singing, please)."'); } });
  for (const [x, z] of [[77.4, 61.8], [86.6, 61.8]]) C.prop('pk_lamp', x, z);
  C.prop('bench', 76.6, 54.2, { yaw: -PI / 2 }); C.prop('bench', 87.4, 52.6, { yaw: PI });
  C.spot('bandstand', 82, 59.8, PI);
}

// ==================================================================== FOUNTAIN PLAZA + south-east gate (x 86–104, z 85–98)
function fountainPlaza(C) {
  const cx = 95, cz = 91.2;
  C.ground(cx - 4.6, cz - 4.6, cx + 4.6, cz + 4.6, TX.cobble('#c8b8a0'), { y: 0.008, mm: '#c8b8a0' });
  C.prop('pk_basin', cx, cz, { collide: false }); C.prop('pk_spout', cx, cz);
  for (let z = -3.4; z < 3.4; z += 0.25) { const hw = Math.sqrt(Math.max(0, 3.4 * 3.4 - (z + 0.125) ** 2)); C.nav.block(cx - hw, cz + z, cx + hw, cz + z + 0.25); }
  C.interact({ x: cx, z: cz + 4.0, label: 'Toss a coin in the fountain', icon: 'coin', mm: true, act: async (app) => {
    const s = app.state || {}; if (typeof s.money === 'number' && s.money >= 1) s.money -= 1;
    if (app.audio && app.audio.sfx) { app.audio.sfx('coin'); setTimeout(() => app.audio.sfx('plop'), 450); }
    const W = ['You wish for a strong team. The water sparkles.', 'You wish for good weather. A pigeon lands on your head. Hmm.', 'You wish to meet a rare Tokonmon. The tall grass seems to rustle in reply…', 'You wish for snacks. Your partner wished harder.'];
    await app.say('', W[Math.floor(Math.random() * W.length)]);
  } });
  // raised flower beds at the plaza corners
  const stone = K.stoneTex('#c8c0b0'), soil = K.soilTex();
  for (const [x0, z0, x1, z1, ks] of [[87, 86, 90, 88, ['pk_flowers_r', 'pk_flowers_y']], [100, 86, 103, 88, ['pk_flowers_p', 'pk_flowers_w']], [87, 94.5, 89.5, 96.5, ['pk_flowers_b', 'pk_flowers_y']]]) {
    C.box('ground', stone, x0, 0, z0, x1, 0.4, z1, { top: soil }); C.nav.block(x0, z0, x1, z1);
    let n = 0; for (let x = x0 + 0.45; x < x1 - 0.2; x += 0.8) for (let z = z0 + 0.45; z < z1 - 0.2; z += 0.8) C.prop(ks[n++ % 2], x, z, { y: 0.4, collide: false });
  }
  C.interact({ x: 88.5, z: 88.9, label: 'Smell the flowers', icon: 'leaf', act: async (app) => app.say('', 'Sweet peas and marigolds. Your partner sneezes, then wants to smell them again.') });
  // the gate: a stone wall with the park's name, facing Market Street, and two lamp pillars
  C.box('props', K.stoneTex('#b8a890'), 96.6, 0, 96.7, 103.4, 1.25, 97.3, { top: TX.solid('#d8d0c0') }); C.nav.block(96.6, 96.7, 103.4, 97.3);
  C.decal('props', K.parkSign(), 100, 0.15, 97.3, 's', 4.2, 1.0, { off: 0.01 });
  for (const x of [96.3, 103.7]) { C.box('props', K.stoneTex('#b8a890'), x - 0.35, 0, 96.6, x + 0.35, 1.7, 97.4, { top: TX.solid('#d8d0c0') }); C.nav.block(x - 0.35, 96.6, x + 0.35, 97.4); C.prop('pk_lamp', x, 97.0, { y: 1.7, collide: false }); }
  C.box('props', TX.solid('#6a4a2a'), 91.4, 0, 96.6, 91.5, 1.3, 96.7); C.box('props', TX.solid('#6a4a2a'), 93.1, 0, 96.6, 93.2, 1.3, 96.7);
  C.box('props', TX.solid('#6a4a2a'), 91.2, 1.15, 96.5, 93.4, 2.25, 96.66); C.decal('props', K.mapBoard(), 92.3, 1.2, 96.66, 's', 2.0, 1.0, { off: 0.01 }); C.nav.block(91.3, 96.5, 93.3, 96.8);
  C.interact({ x: 92.3, z: 95.6, label: 'Read the park map', icon: 'map', act: async (app) => app.say('', 'ALAMO HILL PARK: viewpoint and telescope on the summit, the pond and its bridge, the bandstand, a playground, a half-court, and the Painted Ladies along Steiner Walk.', 'Scribbled in pen: "tall grass = wild Tokonmon!! (3 spots)"') });
  C.prop('bench', 89.0, 91.2, { yaw: -PI / 2 }); C.prop('bench', 101.0, 91.2, { yaw: PI / 2 }); C.prop('bench', 95, 86.4, { yaw: PI });
  C.prop('pk_pigeons', 90.9, 91.4); C.prop('bin', 102.6, 93.8); C.prop('pk_drink', 102.8, 89.2);
  for (const [x, z] of [[87.4, 92.8], [102.6, 95.2]]) C.prop('pk_lamp', x, z);
  C.spot('parkEntrance', 98.6, 94.6, -2.4);
}

// ==================================================================== POND (x 60–80, z 79–92) + a wooden arched bridge
function pondAndBridge(C, ring) {
  // the bridge spans the pond north → south at x 68.8–71.2
  const x0 = 68.8, x1 = 71.2, wood = TX.planks('#a8743e', 'h'), post = TX.solid('#7a4a2a'), rail = TX.solid('#c8302a');
  const segs = [[78.6, 80.2, 0.12], [80.2, 81.8, 0.36], [81.8, 89.2, 0.6], [89.2, 90.8, 0.36], [90.8, 92.4, 0.12]];
  for (const [z0, z1, y] of segs) C.plinth(x0, z0, x1, z1, y, wood, TX.solid('#8a5a32'), { y0: -0.9, mm: '#a8743e' });
  for (const xr of [x0, x1 - 0.12]) {
    for (const [z0, z1, y] of segs) { C.box('props', rail, xr, y + 0.85, z0, xr + 0.12, y + 0.97, z1); for (let z = z0 + 0.4; z < z1; z += 1.6) C.box('props', post, xr + 0.01, y, z - 0.05, xr + 0.11, y + 0.9, z + 0.05); }
    C.nav.block(xr - 0.02, 78.6, xr + 0.14, 92.4);
  }
  C.interact({ x: 70, z: 85.5, label: 'Feed the ducks', icon: 'drop', act: async (app) => { if (app.audio && app.audio.sfx) app.audio.sfx('plop'); await app.say('', 'You toss a few crumbs. Three ducks race over, followed — very slowly — by a turtle with a Tokonmon sitting on its shell.'); } });
  for (const [x, z, yaw] of [[64.5, 83.4, 0.3], [65.6, 84.4, 0.9], [75.4, 88.2, -2.0], [66.2, 89.0, 2.6]]) C.prop('pk_duck', x, z, { y: -0.47, yaw, collide: false });
  for (const [x, z] of [[62.8, 86.4], [76.6, 83.0], [73.6, 89.4]]) C.prop('pk_lily', x, z, { y: -0.41, collide: false });
  for (const [x, z] of [[60.6, 82.6], [79.3, 81.6], [61.2, 89.4], [78.2, 90.6], [66.0, 79.6]]) C.prop('pk_reeds', x, z, { collide: false });
  for (const [x, z] of [[59.0, 86.0], [81.0, 86.6], [63.2, 79.4]]) C.prop('pk_rock', x, z);
  C.spot('pond', 70, 77.4, 0);
}

// ==================================================================== VIEWPOINT (summit, x 45–54.5, z 58.5–66.5)
function viewpoint(C, y) {
  groundDecal(C, TX.ptex('pk_compass', 4, 4, (g, W, H, r, P) => {
    P.fill('#c8b8a0'); for (let a = 0; a < 6.3; a += 0.005) { P.px(W / 2 + Math.cos(a) * 60, H / 2 + Math.sin(a) * 60, '#8a7a64'); P.px(W / 2 + Math.cos(a) * 52, H / 2 + Math.sin(a) * 52, '#8a7a64'); }
    for (let t = -50; t <= 50; t++) { const w = Math.round(6 * (1 - Math.abs(t) / 50)); P.rect(W / 2 - w, H / 2 + t, w * 2 + 1, 1, t < 0 ? '#c8302a' : '#5a4a3a'); P.rect(W / 2 + t, H / 2 - w, 1, w * 2 + 1, '#5a4a3a'); }
    P.speck(300, '#b8a890', r);
  }), 47.8, 60.6, 51.8, 64.6, y + 0.012);
  C.prop('pk_telescope', 53.4, 65.6, { yaw: PI / 4 });
  C.interact({ x: 52.9, z: 65.0, y: y + 1.2, label: 'Look through the telescope', icon: 'eye', mm: true, act: async (app) => {
    if (app.audio && app.audio.sfx) app.audio.sfx('coin');
    await app.say('', 'Clink. The view jumps into focus: the downtown towers, the Street Arena floodlights, the red pier roofs at the wharf…', 'Swing it west: the Painted Ladies glow in the sun. Swing it down: a wild Tokonmon is hiding in the tall grass!');
  } });
  C.prop('bench', 47.0, 66.0, { yaw: PI }); C.prop('bench', 50.6, 66.0, { yaw: PI }); C.prop('bench', 54.0, 60.4, { yaw: -PI / 2 });
  C.box('props', K.stoneTex('#b8b0a4'), 45.6, y, 59.0, 46.6, y + 1.0, 59.6, { top: TX.solid('#d8d0c0') }); C.decal('props', K.plaqueTex('ALAMO HILL', 'SUMMIT  3 M'), 46.1, y + 0.3, 59.6, 's', 0.9, 0.4, { off: 0.01 });
  C.nav.block(45.6, 59.0, 46.6, 59.6);
  C.interact({ x: 46.1, z: 60.3, label: 'Read the plaque', icon: 'eye', act: async (app) => app.say('', '"ALAMO HILL SUMMIT. On clear days you can see across the whole city — and, legend says, the island where the first Tokonmon was found."') });
  for (const [x, z] of [[45.4, 58.8], [54.2, 58.8]]) C.prop('pk_lamp', x, z);
  C.spot('viewpoint', 52.4, 64.6, PI / 4); C.spot('park', 49.8, 62.6, PI / 4);
}

// ==================================================================== PICNIC LAWN (south-west)
function picnic(C) {
  for (const [x, z, yaw] of [[24, 94.6, 0], [38.5, 95.4, 0], [46.0, 88.0, 0.2], [52.5, 95.0, 0]]) C.prop('pk_picnic', x, z, { yaw });
  C.prop('pk_blanket', 41.6, 89.0); C.prop('pk_blanket', 22.0, 87.0, { yaw: 0.3 });
  C.prop('dt_parasol', 26.6, 87.6); C.prop('bin', 34.6, 93.6); C.prop('pk_drink', 49.2, 93.4);
  C.interact({ x: 41.6, z: 90.6, label: 'Look at the picnic', icon: 'bowl', act: async (app) => app.say('', 'Sandwiches, apple slices, a thermos of tea, and a suspicious number of Tokon treats.') });
}

// ==================================================================== TALL GRASS (wild Tokonmon)
function tallGrass(C, TALLS, R) {
  const LINES = { grass1: 'The meadow grass whispers. Something small and round darts between the stalks.', grass2: 'Leaves rustle near the playground. A pair of curious eyes blinks at you — then vanishes.', grass3: 'The grass on the hillside sways against the wind. You hear a tiny, sleepy yawn.' };
  for (const [name, [x0, z0, x1, z1]] of Object.entries(TALLS)) {
    for (let x = x0 + 1.2; x < x1 - 0.6; x += 2.1) for (let z = z0 + 1.2; z < z1 - 0.6; z += 2.1) C.prop('pk_tallgrass', x + (R() - 0.5) * 0.4, z + (R() - 0.5) * 0.4, { yaw: Math.floor(R() * 4) * PI / 2, collide: false });
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    C.spot(name, cx, cz, 0);
    C.interact({ x: cx, z: cz, r: 3.2, label: 'Search the tall grass', icon: 'leaf', mm: true, act: async (app) => {
      if (app.audio && app.audio.sfx) app.audio.sfx('cloth');
      if (app.story && app.story.wild) return app.story.wild(name);
      await app.say('', LINES[name]);
    } });
  }
}

// ==================================================================== EDGES: hedges on Bay Street, iron fences on Market Street and Van Ness
function edges(C) {
  for (let x = 1; x < 104; x += 2) { if ((x > 4 && x < 9) || (x > 12 && x < 18) || (x > 54 && x < 67) || (x > 85 && x < 103)) continue; C.prop('pk_hedge', x, 32.75); }
  for (let x = 1; x < 86; x += 2) { if ((x > 12 && x < 18) || (x > 28 && x < 33)) continue; C.prop('pk_fence', x, 97.75); }
  for (let z = 49; z < 85; z += 2) { if (z > 54 && z < 61) continue; C.prop('pk_fence', 103.75, z, { yaw: PI / 2 }); }
  C.box('props', K.stoneTex('#b8a890'), 62.6, 0, 32.4, 66.2, 1.0, 32.9, { top: TX.solid('#d8d0c0') }); C.decal('props', K.parkSign(), 64.4, 0.08, 32.9, 's', 3.4, 0.82, { off: 0.01 }); C.nav.block(62.6, 32.4, 66.2, 32.9);
  for (const x of [56.6, 61.8]) C.prop('pk_lamp', x, 33.3);
  C.prop('pk_signpost', 100.6, 60.6, { yaw: 0 });
  C.interact({ x: 100.6, z: 61.6, label: 'Read the signpost', icon: 'map', act: async (app) => app.say('', '← BANDSTAND · SUMMIT VIEWPOINT · POND    ↑ HALF-COURT    → VAN NESS AVE') });
  C.prop('pk_signpost', 18.6, 66.6, { yaw: 0 });
  C.interact({ x: 18.6, z: 67.6, label: 'Read the signpost', icon: 'map', act: async (app) => app.say('', 'STEINER WALK — the Painted Ladies. Uphill: SUMMIT VIEWPOINT. Please keep Tokonmon off the rose beds.') });
}

// ==================================================================== lamps and benches along the paths
function pathFurniture(C, P, along, benchYaw) {
  for (const t of [0.1, 0.32, 0.55, 0.78]) { const p = along(P.main, t, 1, 2.2); C.prop('pk_lamp', p.x, p.z); }
  for (const [t, s] of [[0.2, -1], [0.45, -1], [0.7, 1]]) { const p = along(P.main, t, s, 2.4); C.prop('bench', p.x, p.z, { yaw: benchYaw(p.fx, p.fz) }); }
  for (const t of [0.3, 0.75]) { const p = along(P.north, t, 1, 1.8); C.prop('pk_lamp', p.x, p.z); }
  for (const t of [0.25, 0.7]) { const p = along(P.west, t, -1, 1.8); C.prop('pk_lamp', p.x, p.z); }
  { const p = along(P.west, 0.5, 1, 2.0); C.prop('bench', p.x, p.z, { yaw: benchYaw(p.fx, p.fz) }); }
  for (const t of [0.4, 0.8]) { const p = along(P.sw, t, 1, 1.7); C.prop('pk_lamp', p.x, p.z); }
  for (const t of [0.5]) { const p = along(P.east2, t, -1, 1.8); C.prop('pk_lamp', p.x, p.z); }
  // pond benches on the outer side of the ring, facing the water
  for (const t of [0.06, 0.38, 0.62, 0.88]) { const p = along(P.pond, t, 1, 2.0); const q = along(P.pond, t, -1, 2.0); const out = Math.hypot(p.x - 70, (p.z - 85.5) * 1.4) > Math.hypot(q.x - 70, (q.z - 85.5) * 1.4) ? p : q; C.prop('bench', out.x, out.z, { yaw: benchYaw(out.fx, out.fz) }); }
  { const p = along(P.pond, 0.38, 1, 2.0); const q = along(P.pond, 0.38, -1, 2.0); const out = Math.hypot(p.x - 70, (p.z - 85.5) * 1.4) > Math.hypot(q.x - 70, (q.z - 85.5) * 1.4) ? p : q; C.spot('bench', out.x + out.fx * 1.2, out.z + out.fz * 1.2, Math.atan2(-out.fx, -out.fz)); }
  for (const t of [0.0, 0.25, 0.5, 0.75]) { const p = along(P.pond, t + 0.12, 1, 1.6); const q = along(P.pond, t + 0.12, -1, 1.6); const out = Math.hypot(p.x - 70, (p.z - 85.5) * 1.4) > Math.hypot(q.x - 70, (q.z - 85.5) * 1.4) ? p : q; C.prop('pk_lamp', out.x, out.z); }
  for (let z = 38; z < 97; z += 12) C.prop('pk_lamp', 17.5, z);
}

// ==================================================================== TREES: lots, but never hiding a path from the camera
function trees(C, R, T, Y) {
  const open = (t) => t === 0 || t === 9;   // grass or tall grass
  const busy = (t) => t === 1 || t === 2 || t === 5 || t === 6 || t === 7 || t === 8 || t === 3 || t === 4;
  const ok = (x, z, clear) => {
    for (let dz = -clear; dz <= clear; dz += 0.5) for (let dx = -clear; dx <= clear; dx += 0.5) if (!open(T(x + dx, z + dz))) return false;
    // the camera looks from the south-east: keep the area north-west of a tree (what it hides) free of paths
    for (let a = 0.5; a <= 5; a += 0.5) for (let b = -1.5; b <= 1.5; b += 0.75) { const t = T(x - a * 0.707 + b * 0.707, z - a * 0.707 - b * 0.707); if (busy(t) && t !== 3) return false; }
    return true;
  };
  const placed = [];
  const reserved = (x, z) => RESERVED.some(([a, b, c, d]) => x > a - 1.5 && x < c + 1.5 && z > b - 1.5 && z < d + 1.5);
  // the detailed species (props_trees.js), each with its own litter on the ground and, now and then, ferns and shrubs round its roots
  const SCALE = { tr_oak: 0.72, tr_maple: 0.8, tr_blossom: 0.75, tr_cypress: 0.9, tr_plane: 0.78, tr_linden: 0.85 };
  const plant = (kind, x, z, o = {}) => {
    const yaw = R() * Math.PI * 2, y = o.y ?? Y(x, z);
    C.prop(kind, x, z, { s: SCALE[kind] || 1, yaw, y });
    if (LITTER[kind]) C.prop(LITTER[kind], x, z, { y: y + 0.005, yaw: R() * 6.28, collide: false, s: 0.9 });
    if (R() < 0.3) C.prop('gr_under', x, z, { y, yaw: R() * 6.28, collide: false, s: 0.9 });
  };
  const put = (kind, x, z, clear = 1.4, sp = 3.6) => { if (!ok(x, z, clear) || reserved(x, z)) return false; for (const [px, pz] of placed) if (Math.hypot(px - x, pz - z) < sp) return false; placed.push([x, z]); plant(kind, x, z); return true; };
  // a few specimen trees first: cypresses crowning the hill, blossoms by the pond, maples by the bandstand
  for (const [x, z] of [[41.6, 56.2], [57.6, 56.0], [41.0, 67.6], [57.2, 69.0], [36.0, 60.0]]) put('tr_cypress', x, z, 1.4, 5);
  for (const [x, z] of [[57.2, 79.4], [83.0, 79.4], [58.4, 93.2], [82.6, 93.0], [74.6, 95.8]]) put('tr_blossom', x, z, 1.0, 3);
  for (const [x, z] of [[74.6, 52.0], [89.2, 62.4], [74.8, 62.8]]) put('tr_maple', x, z, 1.0, 3);
  // then a scatter over the lawns and hillsides, densest along the park's north and east edges (planes along the edges)
  for (let z = 34.5; z < 97; z += 3.8) for (let x = 19.5; x < 103; x += 3.8) {
    const jx = x + (R() - 0.5) * 2.2, jz = z + (R() - 0.5) * 2.2, edge = jz < 38 || jx > 99 || jz > 95.5;
    if (R() > (edge ? 0.9 : 0.42)) continue;
    const h = Y(jx, jz), k = R(), kind = h > 1.4 && k < 0.3 ? 'tr_cypress' : edge && k < 0.5 ? 'tr_plane' : k < 0.55 ? 'tr_oak' : k < 0.72 ? 'tr_maple' : k < 0.86 ? 'tr_blossom' : 'tr_linden';
    put(kind, jx, jz, kind === 'tr_cypress' ? 1.6 : 1.2, kind === 'tr_cypress' ? 5.2 : 3.8);
  }
  for (const [x, z] of [[2, 33.6], [11.8, 33.6], [1.4, 49.6]]) plant('tr_oak', x, z);
}

// ==================================================================== PEOPLE: joggers, a picnicking family, the pigeon man, a tourist
function people(C, ring) {
  C.npc({ id: 'pk_pigeonman', who: 'passerby5', name: 'Mr. Okada', x: 89.3, z: 91.2, yaw: PI / 2, clip: 'sit', lines: [
    ['Ah, hello there. The pigeons and I have an arrangement: I bring bread, they bring gossip.', 'That grey one there — Duchess — has been coming here for eleven years. Or her granddaughter has.'],
    ['Toss a coin in the fountain, young one. I wished for a quiet afternoon. …It never works with these pigeons.'],
    ['When I was your age, Tokonmon used to sleep on the bandstand roof. They still do, on Sundays.'],
  ] });
  C.npc({ id: 'pk_mom', who: 'passerby12', name: 'Picnicking Mom', x: 38.1, z: 95.95, yaw: PI, clip: 'sit', lines: [['Beautiful day for a picnic! Would you like a sandwich? We made too many. Again.'], ['My husband swears he saw a wild Tokonmon in the tall grass up the hill. He\'s been staring at it for an hour.']] });
  C.npc({ id: 'pk_dad', who: 'passerby9', name: 'Picnicking Dad', x: 39.0, z: 94.85, yaw: 0, clip: 'sit', lines: [['Shh! …Oh, it\'s you. I thought you were the Tokonmon I\'ve been watching.', 'There, on the hillside. See the grass moving? …No? Hmm.']] });
  C.npc({ id: 'pk_kid', who: 'passerby17', name: 'Picnic Kid', x: 41.4, z: 92.4, yaw: PI, clip: 'cheer', lines: [['Is that your Tokonmon?! Can it do a trick? Can it? CAN IT?'], ['When I grow up I\'m gonna have a hundred Tokonmon and a house with a slide.']] });
  C.npc({ id: 'pk_tourist', who: 'passerby2', name: 'Tourist', x: 50.6, z: 64.6, yaw: 2.4, clip: 'selfie', lines: [['Say "Tokon"! …You moved. One more. Say "Tokon"!', 'This is the best view in the city. The Painted Ladies, the towers, the bay — all in one selfie.']] });
  // two joggers looping: one round the pond, one up and down Steiner Walk
  const jogA = { preset: 'tourist', seed: 41, sex: 'm', age: 'adult', top: { kind: 'tee', col: 0xe84a3a, print: 'stripes', col2: 0xf4f0ea }, bottom: { kind: 'shorts', col: 0x2a2a34 }, shoes: { kind: 'sneaker', col: 0xf4f0ea, col2: 0x3ad8a8 }, hat: { kind: 'headband', col: 0xf4f0ea }, acc: [], glasses: null };
  const jogB = { preset: 'gyaru', seed: 43, sex: 'f', age: 'adult', hair: { style: 'ponytail', col: 0x3a2a22 }, top: { kind: 'tee', col: 0x3ad8a8, fitted: true }, bottom: { kind: 'shorts', col: 0x2a2a34 }, shoes: { kind: 'sneaker', col: 0xf4f0ea, col2: 0xe84a6a }, acc: [], hat: null, glasses: null };
  const loopA = ring.slice().reverse(), loopB = [[15, 34.5], [15.2, 60], [14.8, 80], [15, 96.5], [14.8, 80], [15.2, 60]];
  C.npc({ id: 'pk_joggerA', who: jogA, name: 'Jogger', x: loopA[0][0], z: loopA[0][1], yaw: 0, lines: [['*huff* Lap… forty… two… *huff*', 'The pond loop is exactly 400 metres. My partner Tokonmon runs it in 30 seconds. I don\'t.']] });
  C.npc({ id: 'pk_joggerB', who: jogB, name: 'Jogger', x: loopB[0][0], z: loopB[0][1], yaw: 0, lines: [['Morning! Steiner Walk is the flattest run in the city — the hill is for showing off.'], ['Pro tip: the tall grass is where the wild ones are. Don\'t jog through it. Trust me.']] });
  jog(C, 'pk_joggerA', loopA, 2.7); jog(C, 'pk_joggerB', loopB, 2.4);
}
/** keep an NPC running a loop of points (pauses while you talk to it) */
function jog(C, id, loop, speed) {
  C.updaters.push(() => {
    const app = globalThis.__app, w = app && app.world; if (!w || !w.city || !w.actor) return;
    const a = w.actor(id); if (!a) return;
    const me = w.player, p = a.g.position;
    if (app.story && app.story.busy && me && Math.hypot(me.g.position.x - p.x, me.g.position.z - p.z) < 4) { if (a.path) { a.path = null; a.arrive = null; a.play('idle', { fade: 0.2 }); } return; }
    if (a.path) return;
    let best = 0, bd = 1e9; loop.forEach(([x, z], j) => { const d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; best = j; } });
    const pts = []; for (let k = 1; k <= loop.length; k++) pts.push(loop[(best + k) % loop.length]);
    a.walkTo(pts, { clip: 'run', speed });
  });
}
