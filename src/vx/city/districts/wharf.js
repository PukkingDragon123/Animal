// THE WHARF — rect [0, 0, 230, 20]. The bay fills z 0–12; a continuous waterfront promenade runs the whole width
// (z 12–20, boardwalk + pavers, railings along the quay). Van Ness ends at the Ferry Terminal and its clock tower
// (x 98–122); Bayside Pier juts out over the water at x 150–172 with its stalls, carousel and telescopes; sea lions
// lounge on floating docks just west of it. West: the fish market, moored boats and the cable-car turnaround.
import { TX } from '../build.js';
import './props_ct.js';
import { crisp, tri3, quad4, beam, fbox, floorDecal, discDecal, hipRoof, signH, board, ptex, light, dark, textW } from './ct_kit.js';

const QZ = 11.8;           // the quay line
const PIER = [150, 1, 172, 12], PY = 0.36;
const FERRY = [98, 1.5, 122, 8.5];

// a pseudo-building so huts and the arch fade like buildings when you walk behind them
function landmark(C, x, z, w, d, H, o = {}) {
  const id = C.buildings.length;
  const B = { id, x, z, w, d, floors: 1, fh: H, H, enter: false, name: o.name || 'wharf' + id, o: { roof: { type: 'gable' } }, gk: (k, part) => `b${id}:f${k}:${part}` };
  C.buildings.push(B); return B;
}
const sfx = (app, n) => app.audio && app.audio.sfx && app.audio.sfx(n);

// ---------------------------------------------------------------- textures
const archWin = (lit) => ptex('wf_arch' + lit, 1.4, 2.4, (g, W, H, r, P) => {
  P.fill('#e6dcc6'); const cx = W / 2, R = W / 2 - 3, top = R + 3, glass = lit ? '#ffd890' : '#3e5a72';
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { const inArch = y >= top || Math.hypot(x - cx + 0.5, y - top) <= R; if (inArch) P.px(x, y, glass); }
  if (!lit) P.dither(3, 3, W - 6, H - 6, '#8ab0d0', (x, y) => ((x + y * 0.7) % 19 < 4 ? 0.5 : 0) * (Math.hypot(x - cx, y - top) <= R || y >= top ? 1 : 0));
  P.vline(Math.floor(cx), 4, H - 7, '#e6dcc6'); for (const y of [Math.floor(top), Math.floor(top + (H - top) / 2)]) P.hline(3, y, W - 6, '#e6dcc6');
  P.rect(1, H - 3, W - 2, 3, '#b8ae98'); P.px(cx, 2, '#c8a050'); P.rect(cx - 1, 1, 3, 2, '#c8b898');
});
const clockFace = () => ptex('wf_clock', 2.4, 2.4, (g, W, H, r, P) => {
  P.fill('#2e5a50'); const c = W / 2 - 0.5;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - c, y - c); if (d < 36) P.px(x, y, d > 34 ? '#c8a050' : d > 32 ? '#2e4a44' : '#f4eedc'); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, L = i % 3 ? 3 : 5; for (let k = 0; k < L; k++) P.px(c + Math.sin(a) * (30 - k), c - Math.cos(a) * (30 - k), '#2a2a2a'); }
  const hand = (a, len, w) => { for (let k = 0; k < len; k++) for (let t = -w; t <= w; t++) P.px(c + Math.sin(a) * k + Math.cos(a) * t * 0.5, c - Math.cos(a) * k + Math.sin(a) * t * 0.5, '#1a1a1a'); };
  hand(Math.PI * 2 * (4.2 / 12), 16, 1); hand(Math.PI * 2 * (12 / 60), 25, 0.5); P.rect(c - 1, c - 1, 3, 3, '#c8a050');
});
const turntableTex = () => ptex('wf_turn', 8, 8, (g, W, H, r, P) => {
  P.fill('#b8b0a4'); const c = W / 2 - 0.5;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - c, y - c); if (d < 124) { const ring = d > 118; const plank = Math.floor((x + 1000) / 6) % 2; P.px(x, y, ring ? '#5a5a62' : plank ? '#9a7a52' : '#8a6a46'); if (!ring && (x % 6) === 0) P.px(x, y, '#6a4a2a'); } }
  for (const dz of [-24, 24]) for (let x = 8; x < W - 8; x++) { const d = Math.hypot(x - c, dz); if (d < 118) { P.px(x, c + dz, '#c8ccd4'); P.px(x, c + dz + 1, '#7a7e88'); } }
  P.speck(200, '#a89a84', r);
});
const hullWin = () => ptex('wf_hullwin', 2, 1.4, (g, W, H, r, P) => { P.fill('#f4f2ec'); for (let x = 3; x < W; x += 16) { P.block(x, 6, 12, 18, '#3e5a72'); P.dither(x, 6, 12, 18, '#9ac0d8', (xx, y) => ((xx + y) % 9 < 2 ? 0.7 : 0.05)); } P.rect(0, H - 8, W, 3, '#2a4a7a'); P.rect(0, 0, W, 2, '#d8d4cc'); });
const arcadeWin = (night) => ptex('wf_arcadewin' + night, 3, 1.8, (g, W, H, r, P) => {
  P.fill('#1a1426'); const cols = ['#ff5a8a', '#5ae0ff', '#ffd84a', '#7aff7a'];
  for (let i = 0; i < 4; i++) { const x = 4 + i * 23; P.block(x, 10, 18, H - 12, '#2a2a3a'); P.rect(x + 3, 14, 12, 12, cols[i]); P.dither(x + 3, 14, 12, 12, '#ffffff', 0.15);
    // little Tokonmon-like blobs on the screens (no people)
    P.rect(x + 6, 18, 5, 4, '#1a1426'); P.px(x + 7, 19, cols[(i + 1) % 4]); P.px(x + 9, 19, cols[(i + 1) % 4]); P.rect(x + 5, 30, 8, 2, '#c8c8d0'); P.px(x + 7, 34, '#ff3a3a'); P.px(x + 10, 34, '#3a7aff'); }
  P.rect(0, 0, W, 3, night ? '#ff5aa8' : '#c84a88'); P.rect(0, H - 2, W, 2, '#2a2a3a');
});
const fishMenu = () => board('wf_menu', ['CATCH OF THE DAY', 'CLAM CHOWDER  $7', 'CRAB COCKTAIL $9', 'FISH & CHIPS  $8', 'SHRIMP CUP    $6'], 1.5, 1.1, { bg: '#1e2a34', fg: '#f0e8d0', frame: '#8a6a42', size: 8, lh: 9 });
function wharfSign(text, bg, fg, w, h = 0.8, o = {}) {
  return ptex('wf_sign' + text + bg + fg + w + h, w, h, (g, W, H, r, P) => {
    P.fill(o.rope || '#c8b48a'); P.rect(2, 2, W - 4, H - 4, bg); for (let x = 0; x < W; x += 4) { P.px(x, 0, '#8a7448'); P.px(x + 2, H - 1, '#8a7448'); }
    P.speck(30, light(bg, 0.08), r, 2, 2, W - 4, H - 4);
    if (o.fish) for (const x of [10, W - 18]) { P.rect(x, H / 2 - 2, 7, 5, fg); P.px(x - 1, H / 2, fg); P.rect(x + 7, H / 2 - 3, 2, 7, fg); P.px(x + 1, H / 2 - 1, bg); }
    crisp(P, text, W / 2, H / 2 + 1, o.size || 16, fg, { shadow: dark(bg, 0.5) });
  }, { ppm: 32 });
}

// ---------------------------------------------------------------- pieces
/** a quay railing from (x0, z) to (x1, z) (or along z when o.alongZ), with gaps [{ a, b }] */
function railing(C, x0, z0, x1, z1, o = {}) {
  const gk = 'wf_rail', post = TX.solid(o.col || '#e8e4dc'), top = TX.solid(o.top || '#2a6a7a'), y = o.y || 0, alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), gaps = o.gaps || [];
  const len = alongX ? x1 - x0 : z1 - z0, n = Math.max(1, Math.round(Math.abs(len) / 1.6));
  const inGap = (t) => gaps.some((g) => t > g.a && t < g.b);
  const P = (t) => (alongX ? [x0 + t, z0] : [x0, z0 + t]);
  let segStart = null;
  const flush = (tEnd) => { if (segStart === null) return; const a = P(segStart), b = P(tEnd); for (const [hh, w] of [[1.0, 0.07], [0.55, 0.04]]) beam(C, gk, hh > 0.9 ? top : post, [a[0], y + hh, a[1]], [b[0], y + hh, b[1]], w, w); C.nav.block(Math.min(a[0], b[0]) - 0.12, Math.min(a[1], b[1]) - 0.12, Math.max(a[0], b[0]) + 0.12, Math.max(a[1], b[1]) + 0.12); segStart = null; };
  for (let i = 0; i <= n; i++) {
    const t = (len * i) / n;
    if (inGap(t)) { flush(t - len / n); continue; }
    if (segStart === null) segStart = t;
    const p = P(t); C.box(gk, post, p[0] - 0.06, y, p[1] - 0.06, p[0] + 0.06, y + 1.06, p[1] + 0.06);
  }
  flush(len);
}
/** a wooden hut (stall, kiosk) standing at height y0 with a gable roof; front side 'e' or 's' gets a serving hatch and sign */
function hut(C, o) {
  const { x, z, w, d } = o, y0 = o.y0 || 0, h = o.h || 3.0, L = landmark(C, x, z, w, d, y0 + h + 1.6, { name: o.name }), gk = L.gk(0, 'front'), rg = `b${L.id}:roof`;
  const wall = o.wall || TX.siding('#5a8a8a'), trim = TX.solid(o.trim || '#f4f0e8'), roofT = o.roofTex || TX.shingles(o.roofCol || '#6a5a52');
  C.box(gk, wall, x, y0, z, x + w, y0 + h, z + d, { top: trim });
  for (const yy of [y0, y0 + h - 0.12]) C.box(gk, trim, x - 0.05, yy, z - 0.05, x + w + 0.05, yy + 0.12, z + d + 0.05);
  for (const [cx, cz] of [[x, z], [x + w, z], [x, z + d], [x + w, z + d]]) C.box(gk, trim, cx - 0.08, y0, cz - 0.08, cx + 0.08, y0 + h, cz + 0.08);
  // gable roof along the longer side
  const e = 0.45, rh = o.rh || 1.4, ridgeX = o.ridge ? o.ridge === 'x' : w >= d, Y = y0 + h;
  if (ridgeX) { const zm = z + d / 2; quad4(C, rg, roofT, [x - e, Y - 0.1, z + d + e], [x + w + e, Y - 0.1, z + d + e], [x + w + e, Y + rh, zm], [x - e, Y + rh, zm], [x - e, 0], [x + w + e, 0], [x + w + e, d / 2 + e], [x - e, d / 2 + e], { up: true }); quad4(C, rg, roofT, [x + w + e, Y - 0.1, z - e], [x - e, Y - 0.1, z - e], [x - e, Y + rh, zm], [x + w + e, Y + rh, zm], [x, 0], [x + w, 0], [x + w, d / 2 + e], [x, d / 2 + e], { up: true }); tri3(C, rg, wall, [x + w, Y, z + d], [x + w, Y, z], [x + w, Y + rh, zm], [0, 0], [d, 0], [d / 2, rh]); tri3(C, rg, wall, [x, Y, z], [x, Y, z + d], [x, Y + rh, zm], [0, 0], [d, 0], [d / 2, rh]); beam(C, rg, trim, [x - e, Y + rh + 0.05, zm], [x + w + e, Y + rh + 0.05, zm], 0.14, 0.12); }
  else { const xm = x + w / 2; quad4(C, rg, roofT, [x + w + e, Y - 0.1, z + d + e], [x + w + e, Y - 0.1, z - e], [xm, Y + rh, z - e], [xm, Y + rh, z + d + e], [z, 0], [z - d, 0], [z - d, w / 2 + e], [z, w / 2 + e], { up: true }); quad4(C, rg, roofT, [x - e, Y - 0.1, z - e], [x - e, Y - 0.1, z + d + e], [xm, Y + rh, z + d + e], [xm, Y + rh, z - e], [z, 0], [z + d, 0], [z + d, w / 2 + e], [z, w / 2 + e], { up: true }); tri3(C, rg, wall, [x, Y, z + d], [x + w, Y, z + d], [xm, Y + rh, z + d], [0, 0], [w, 0], [w / 2, rh]); tri3(C, rg, wall, [x + w, Y, z], [x, Y, z], [xm, Y + rh, z], [0, 0], [w, 0], [w / 2, rh]); beam(C, rg, trim, [xm, Y + rh + 0.05, z - e], [xm, Y + rh + 0.05, z + d + e], 0.14, 0.12); }
  // the front: hatch / windows, sign, awning
  const sd = o.front || 'e', W2 = sd === 'e' ? d : w, cx = sd === 'e' ? x + w : x + w / 2, cz = sd === 'e' ? z + d / 2 : z + d;
  if (o.win) C.decal(gk, o.win, cx, y0 + 0.9, cz, sd, Math.min(W2 - 0.6, o.winW || W2 - 0.8), o.winH || 1.4, { off: 0.03 });
  if (o.glow) C.props.push({ kind: 'ct_glowPane', x: cx + (sd === 'e' ? 0.06 : 0), y: y0 + 0.95, z: cz + (sd === 's' ? 0.06 : 0), yaw: sd === 'e' ? Math.PI / 2 : 0, s: 0.75 });
  if (o.counter) { const ct = TX.planks('#8a6a46'); if (sd === 'e') C.box(gk, ct, x + w, y0 + 0.95, z + 0.3, x + w + 0.45, y0 + 1.05, z + d - 0.3); else C.box(gk, ct, x + 0.3, y0 + 0.95, z + d, x + w - 0.3, y0 + 1.05, z + d + 0.45); }
  if (o.door) C.decal(gk, o.door, sd === 'e' ? x + w : x + w * 0.2, y0, sd === 'e' ? z + d * 0.2 : z + d, sd, 1.0, 2.1, { off: 0.03 });
  if (o.sign) { const sw = o.signW || W2 - 0.4; C.decal(gk, o.sign, cx, y0 + h - 0.05 - 0.75, cz, sd, sw, 0.72, { off: 0.06 }); }
  if (o.awning) { const at = TX.awningTex(o.awning[0], o.awning[1]), y1 = y0 + 2.15, yb = y0 + 1.75, dep = 0.9;
    if (sd === 'e') { C.quad(gk, at, [x + w + dep, yb, z + d], [x + w + dep, yb, z], [x + w, y1, z], [x + w, y1, z + d]); }
    else { C.quad(gk, at, [x, yb, z + d + dep], [x + w, yb, z + d + dep], [x + w, y1, z + d], [x, y1, z + d]); } }
  C.nav.block(x, z, x + w, z + d);
  return L;
}
/** a string of little triangular pennants between two points */
function bunting(C, a, b, n = 10, sag = 0.4) {
  const cols = ['#e8322a', '#f0c040', '#2a8ad8', '#f4f0ea', '#2aa070'].map((c) => TX.solid(c)), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t]); }
  for (let i = 1; i < n; i++) C.props.push({ kind: 'wf_bulb', x: pts[i][0], y: pts[i][1] - 0.2, z: pts[i][2], yaw: 0 });
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[i + 1]; beam(C, 'props', TX.solid('#e8e4dc'), p, q, 0.02, 0.02, { caps: false }); const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 0.42, (p[2] + q[2]) / 2]; tri3(C, 'props', cols[i % cols.length], [p[0], p[1] - 0.02, p[2]], [q[0], q[1] - 0.02, q[2]], m, [0, 0], [1, 0], [0.5, 1]); }
}

// ---------------------------------------------------------------- the district
export function build(C, [x0, z0, x1, z1], ctx) {
  const night = ctx.night;
  // ---- the bay, the quay walls
  C.water(0, 0, 93.6, QZ); C.water(93.6, 0, 124.4, 1.5); C.water(124.4, 0, x1, QZ);
  // the open bay beyond the map edge (scenery only): water to the horizon, Gull Rock and its lighthouse
  C.water(-140, -160, 370, 0); C.water(-140, 0, 0, 20); C.water(230, 0, 370, 20);
  gullRock(C, 150, -26);
  const quay = TX.concrete('#a8a294'), cope = TX.solid('#c8c2b4');
  for (const [a, b] of [[0, 93.6], [124.4, x1]]) { C.box('ground', quay, a, -1.6, QZ - 0.3, b, 0, QZ, { top: cope }); }
  C.box('ground', quay, 93.6, -1.6, 1.5, 93.9, 0, QZ, { top: cope }); C.box('ground', quay, 124.1, -1.6, 1.5, 124.4, 0, QZ, { top: cope }); C.box('ground', quay, 93.6, -1.6, 1.2, 124.4, 0, 1.5, { top: cope });
  // ---- the promenade: a boardwalk strip along the water, warm pavers toward Bay Street
  const boards = TX.planks('#9a8468', 'v'), pav = TX.pavers('#c8b8a0');
  C.ground(0, QZ, x1, 16.4, boards); C.ground(0, 16.4, x1, z1, pav);
  for (let x = 2; x < x1; x += 6) C.ground(x, 16.38, x + 3, 16.5, TX.solid('#8a7a62'), { y: 0.004 });
  // the ferry plaza at the foot of Van Ness (over the end of the avenue)
  C.ground(93.9, 1.5, 124.1, QZ, TX.planks('#8a7a68'), { y: 0.004 });
  C.ground(96, 8.6, 124, z1, TX.pavers('#d4c8b4'), { y: 0.012 });
  const rose = ptex('wf_rose', 6, 6, (g, W, H, r, P) => { P.fill('#e8dcc0'); const c = W / 2 - 0.5; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - c, y - c), a = Math.atan2(y - c, x - c); if (d < 94) { const main = Math.pow(Math.abs(Math.cos(a * 2)), 10), diag = Math.pow(Math.abs(Math.sin(a * 2)), 10) * 0.6, rr = 74 * Math.max(0.16, main, diag); const star = d < rr; const half = (Math.floor((a + 7.0686) / (Math.PI / 8)) % 2); P.px(x, y, d > 89 ? '#2a5a7a' : d > 85 ? '#e8dcc0' : d > 82 ? '#c8a050' : star ? (half ? '#2a5a7a' : '#5a9ab8') : '#e8dcc0'); } } crisp(P, 'N', c + 1, 9, 16, '#c83a2a'); });
  discDecal(C, 'ground', rose, 110, 0.02, 15.0, 2.95, { uvR: 0.49 });
  // ---- the quay railing (gaps: the dock, the pier)
  railing(C, 0.6, QZ, 93.6, QZ, { gaps: [{ a: 25.9, b: 28.1 }, { a: 45.9, b: 48.1 }] });
  railing(C, 124.4, QZ, 150, QZ); railing(C, 172, QZ, 229.4, QZ, { gaps: [{ a: 7.4, b: 9.6 }, { a: 21.4, b: 23.6 }, { a: 35.4, b: 37.6 }, { a: 49.4, b: 51.6 }] });
  railing(C, 93.8, 1.6, 93.8, QZ, { gaps: [{ a: 2.5, b: 4.3 }] }); railing(C, 124.2, 1.6, 124.2, QZ); railing(C, 93.8, 1.4, 98, 1.4); railing(C, 122, 1.4, 124.2, 1.4);

  ferryTerminal(C, ctx);
  pier(C, ctx);
  seaLions(C, ctx);
  westWharf(C, ctx);
  eastWharf(C, ctx);
  promenadeLife(C, ctx);

  C.zone('The Wharf', x0, z0, x1, z1, { label: 'The Wharf', sub: 'San Francisco', music: 'vibes', bed: 'birds' });
  C.spot('promenade', 64, 13.8, Math.PI);
}

// ---------------------------------------------------------------- Gull Rock: an island out in the bay (scenery)
function gullRock(C, cx, cz) {
  const rock = TX.cobble('#7a7470'), rock2 = TX.cobble('#8a847c'), grassT = TX.grass('#6a8a4a'), gk = 'wf_island';
  const blobs = [[0, 0, 7, 2.2], [-5, 2, 4.5, 1.4], [5, -1.5, 5, 1.8], [-2, -4, 4, 2.8], [3, 4, 3.5, 1.1], [-8, -2, 3, 0.9], [8, 3, 2.6, 0.7]];
  for (const [dx, dz, r, h] of blobs) { const x = cx + dx, z = cz + dz; C.box(gk, (dx + dz) & 1 ? rock : rock2, x - r, -1.6, z - r * 0.8, x + r, h, z + r * 0.8, { top: h > 2 ? grassT : rock2 }); C.box(gk, rock, x - r * 0.7, h, z - r * 0.55, x + r * 0.7, h + 0.6, z + r * 0.55, { top: grassT }); }
  C.props.push({ kind: 'wf_lighthouse', x: cx - 2, y: 3.4, z: cz - 4, yaw: 0 });
  C.box(gk, TX.plaster('#efe9de'), cx + 1, 2.2, cz - 2.5, cx + 4, 4.4, cz + 0.5, { top: TX.solid('#c83a2a') });
  for (const [x, z, yaw] of [[cx + 4, cz + 3.6, 0.5], [cx - 4.5, cz + 2.4, 2.6], [cx + 7, cz - 1, 1]]) C.props.push({ kind: 'wf_gull', x, y: 1.4, z, yaw });
  C.props.push({ kind: 'wf_sealion', x: cx + 6.5, y: 0.8, z: cz + 3.2, yaw: 2.2 });
  for (const [x, z, yaw] of [[cx - 30, cz + 6, 0.3], [cx + 40, cz - 4, 2.8], [cx - 70, cz + 10, -0.4]]) C.props.push({ kind: 'wf_sail', x, y: -1.2, z, yaw });
}

// ---------------------------------------------------------------- Ferry Terminal + clock tower (north end of Van Ness)
function ferryTerminal(C, ctx) {
  const [fx0, fz0, fx1, fz1] = FERRY, w = fx1 - fx0, d = fz1 - fz0;
  const B = C.building({ x: fx0, z: fz0, w, d, floors: 2, fh: 4.0, wall: TX.plaster('#e6dcc6'), trim: '#f4ece0', base: '#8a8478', mm: '#d8ccb4', name: 'ferry terminal',
    roof: { type: 'gable', tex: TX.metalRoof('#6a8a84'), ridge: 'x', h: 2.0, eave: 0.4 }, windows: { every: 3.0, tex: archWin(ctx.night), w: 1.4, h: 2.4, skip: ['n'] },
    door: { side: 's', at: 0.5, w: 2.6, kind: 'glass', label: 'Enter the Ferry Terminal', act: async (app) => {
      await app.say('', 'FERRY TERMINAL — Departures to the East Bay and Gull Rock.', 'Inside: a long hall of skylights, a bakery smell, and a board that says the next ferry is "boarding soon".');
    } } });
  const rg = `b${B.id}:roof`, fg = B.gk(0, 'front'), wall = TX.plaster('#e6dcc6'), trim = TX.solid('#f4ece0'), cornice = TX.solid('#d8ccb4');
  // the arcade along the front
  for (let x = fx0 + 0.6; x <= fx1 - 0.5; x += 2.9) { if (Math.abs(x - 110) < 1.6) continue; C.box(fg, trim, x - 0.18, 0, fz1 + 1.05, x + 0.18, 3.4, fz1 + 1.4); C.nav.block(x - 0.22, fz1 + 1.0, x + 0.22, fz1 + 1.45); }
  C.box(fg, cornice, fx0 - 0.1, 3.4, fz1, fx1 + 0.1, 4.1, fz1 + 1.5, { top: TX.metalRoof('#6a8a84') });
  const sg = wharfSign('FERRY TERMINAL', '#2e5a50', '#f0e0b0', 6.4, 0.62, { rope: '#c8a050' });
  C.decal(fg, sg, (fx0 + fx1) / 2, 3.44, fz1 + 1.5, 's', 6.4, 0.62, { off: 0.02 });
  C.decal(fg, ptex('wf_since', 3.2, 0.5, (g, W, H, r, P) => { P.fill('#e6dcc6'); crisp(P, 'BAY FERRIES · SINCE 1898', W / 2, H / 2 + 1, 8, '#5a5040'); }), (fx0 + fx1) / 2, 7.2, fz1, 's', 3.2, 0.5, { off: 0.03 });
  if (ctx.night) { const n = 7, step = w / n; for (let i = 0; i < n; i++) C.props.push({ kind: 'ct_glowPane', x: fx0 + step * (i + 0.5), y: 4.95, z: fz1 + 0.05, yaw: 0, s: 1.25 }); }
  // the clock tower
  const tx0 = 107.6, tx1 = 112.4, tz0 = 2.6, tz1 = 7.4, H = 8;
  C.box(rg, wall, tx0, H, tz0, tx1, 18.6, tz1);
  for (const yy of [H + 2.4, 14.6, 18.2]) C.box(rg, cornice, tx0 - 0.15, yy, tz0 - 0.15, tx1 + 0.15, yy + 0.35, tz1 + 0.15);
  for (const [f, x, z] of [['s', 110, tz1], ['e', tx1, 5], ['n', 110, tz0], ['w', tx0, 5]]) { C.decal(rg, clockFace(), x, 15.3, z, f, 2.6, 2.6, { off: 0.03 }); C.decal(rg, archWin(false), x, H + 3.2, z, f, 1.2, 2.4, { off: 0.03 }); }
  C.box(rg, wall, tx0 + 0.6, 18.6, tz0 + 0.6, tx1 - 0.6, 21.0, tz1 - 0.6);
  const belfry = ptex('wf_belfry', 1.2, 1.8, (g, W, Hh, r, P) => { P.fill('#e6dcc6'); const c = W / 2 - 0.5; for (let y = 3; y < Hh - 2; y++) for (let x = 3; x < W - 3; x++) if (y > 18 || Math.hypot(x - c, y - 18) < 16) P.px(x, y, '#1e2a30'); P.rect(c - 4, 24, 9, 14, '#c8a050'); P.rect(c - 6, 36, 13, 3, '#a87a28'); });
  for (const [f, x, z] of [['s', 110, tz1 - 0.6], ['e', tx1 - 0.6, 5], ['n', 110, tz0 + 0.6], ['w', tx0 + 0.6, 5]]) C.decal(rg, belfry, x, 18.9, z, f, 1.4, 1.9, { off: 0.03 });
  C.box(rg, cornice, tx0 + 0.3, 21.0, tz0 + 0.3, tx1 - 0.3, 21.35, tz1 - 0.3);
  hipRoof(C, rg, { x0: tx0 + 0.6, z0: tz0 + 0.6, x1: tx1 - 0.6, z1: tz1 - 0.6, y: 21.35, e: 0.35, rh: 3.4, flare: 0, hooks: false, tex: TX.metalRoof('#6a8a84'), eave: TX.solid('#4a6a64'), cap: TX.solid('#4a6a64'), hookCol: '#c8a050' });
  beam(C, rg, TX.solid('#8a8a88'), [110, 25.4, 5], [110, 28.2, 5], 0.08, 0.08);
  quad4(C, rg, TX.stripes('#c83a2a', '#f4f0e8', 3), [110.05, 26.9, 5], [111.6, 26.9, 5], [111.6, 27.95, 5], [110.05, 27.95, 5], [0, 0], [1, 0], [1, 1], [0, 1]);
  C.interact({ x: 110, z: 10.8, r: 2.6, label: 'Check the clock tower', icon: 'clock', act: async (app) => {
    const d = new Date(), h = d.getHours(), m = d.getMinutes(), hh = ((h + 11) % 12) + 1;
    sfx(app, 'notification');
    await app.say('', `The great clock reads ${hh}:${String(m).padStart(2, '0')}. Its bell has rung the hours over the bay since the days of steam ferries.`, 'A gull sits on the minute hand, riding it around like a carousel.');
  } });
  C.spot('clockTower', 110, 11.2, Math.PI);
  // the ferry, moored west of the terminal, and its dock
  ferryBoat(C, ctx);
  for (let z = 2.6; z < 11.5; z += 2.4) if (z < 4.6 || z > 6.2) C.prop('wf_bollard', 94.3, z);
  C.prop('wf_coil', 95.2, 3.0, { collide: false }); C.prop('wf_lifering', 94.2, 8.2, { yaw: -Math.PI / 2 });
  const gp = TX.planks('#8a6a46'); quad4(C, 'wf_ferry', gp, [93.9, 0.02, 4.4], [93.9, 0.02, 5.6], [92.2, 0.55, 5.6], [92.2, 0.55, 4.4], [0, 0], [1.2, 0], [1.2, 1.8], [0, 1.8], { up: true });
  beam(C, 'wf_ferry', TX.solid('#e8e4dc'), [93.9, 1.0, 4.4], [92.2, 1.5, 4.4], 0.05); beam(C, 'wf_ferry', TX.solid('#e8e4dc'), [93.9, 1.0, 5.6], [92.2, 1.5, 5.6], 0.05);
  const sched = board('wf_sched', ['FERRY DEPARTURES', 'EAST BAY     :15', 'GULL ROCK    :40', 'SUNSET CRUISE 6PM'], 1.6, 1.0, { bg: '#1e2a34', fg: '#f0e8d0', frame: '#2e5a50', size: 8, lh: 9 });
  C.box('wf_ferry', TX.solid('#2e5a50'), 96.2, 0, 9.5, 96.32, 1.9, 9.62); C.box('wf_ferry', TX.solid('#2e5a50'), 97.8, 0, 9.5, 97.92, 1.9, 9.62); C.box('wf_ferry', TX.solid('#2e5a50'), 96.2, 0.8, 9.48, 97.92, 1.88, 9.52);
  C.decal('wf_ferry', sched, 97.06, 0.84, 9.52, 's', 1.6, 1.0, { off: 0.01 }); C.nav.block(96.1, 9.4, 98.0, 9.7);
  C.interact({ x: 95.0, z: 5.0, label: 'Board the ferry', icon: 'map', act: async (app) => {
    if (app.story && app.story.ferry) return app.story.ferry();
    sfx(app, 'notification');
    await app.say('Ferryman', 'The Bay Spirit leaves at quarter past. East Bay, then round Gull Rock and back.', 'No ticket? Ha — come back when the League gives you a pass, rookie.');
  } });
  C.spot('ferry', 95.2, 5.0, -Math.PI / 2);
  C.npc({ id: 'wfFerryman', who: 'passerby66', x: 95.4, z: 6.6, yaw: -Math.PI / 2, name: 'Ferryman', lines: [['Mind the gap — and the gulls. They steal sandwiches right out of your hand.'], ['Forty years on this run. The bay never looks the same twice.']] });
  C.npc({ id: 'wfBusker', who: 'passerby207', x: 103.0, z: 13.8, yaw: 0.4, clip: 'dance', name: 'Busker', lines: [['♪ Fog on the water, lights on the pier... ♪', 'Tips welcome! Tokonmon may dance for free.']] });
  C.interact({ x: 103.0, z: 15.0, r: 1.4, label: 'Tip the busker', icon: 'music', act: async (app) => { sfx(app, 'coin'); await app.say('Busker', 'Thank you kindly! This next one\'s for your partner.'); app.toast('The busker plays a jaunty tune', { icon: 'music' }); } });
}
function ferryBoat(C, ctx) {
  const gk = 'wf_ferry', hull = TX.stripes('#f4f2ec', '#f4f2ec', 2), lower = TX.solid('#2a4a7a'), white = TX.solid('#f4f2ec'), deck = TX.planks('#a88a5a'), red = TX.solid('#c8322a');
  const x0 = 76, x1 = 91.4, z0 = 3.0, z1 = 7.6, zc = (z0 + z1) / 2;
  C.box(gk, lower, x0, -1.3, z0, x1, -0.45, z1, { top: white }); C.box(gk, white, x0, -0.45, z0, x1, 0.55, z1, { top: deck });
  // the pointed bow
  const bow = [x1 + 2.2, zc];
  for (const [ya, yb, t] of [[-1.3, -0.45, lower], [-0.45, 0.55, white]]) { quad4(C, gk, t, [x1, ya, z1], [bow[0], ya, bow[1]], [bow[0], yb, bow[1]], [x1, yb, z1], [0, 0], [2.6, 0], [2.6, yb - ya], [0, yb - ya]); quad4(C, gk, t, [bow[0], ya, bow[1]], [x1, ya, z0], [x1, yb, z0], [bow[0], yb, bow[1]], [0, 0], [2.6, 0], [2.6, yb - ya], [0, yb - ya]); }
  tri3(C, gk, deck, [x1, 0.55, z0], [x1, 0.55, z1], [bow[0], 0.55, bow[1]], [0, 0], [4.6, 0], [2.3, 2.2], { up: true });
  C.decal(gk, hullWin(), (x0 + x1) / 2 - 0.5, 0.75, z1 - 0.3, 's', 11, 1.4, { off: 0.02 });
  C.box(gk, white, x0 + 1.2, 0.55, z0 + 0.3, x1 - 0.8, 2.6, z1 - 0.3, { top: TX.solid('#d8d4cc') });
  C.decal(gk, hullWin(), (x0 + x1) / 2 - 0.5, 0.55, z1 - 0.3, 's', 12, 1.4, { off: 0.02 });
  C.box(gk, white, x0 + 3.5, 2.6, z0 + 0.7, x1 - 3.5, 4.2, z1 - 0.7, { top: TX.solid('#d8d4cc') }); C.decal(gk, hullWin(), (x0 + x1) / 2, 2.7, z1 - 0.7, 's', 7, 1.4, { off: 0.02 });
  C.box(gk, white, x1 - 5.0, 4.2, z0 + 1.2, x1 - 3.5, 5.3, z1 - 1.2); C.decal(gk, ptex('wf_bridgewin', 1.5, 0.6, (g, W, H, r, P) => { P.fill('#3e5a72'); P.dither(0, 0, W, H, '#9ac0d8', 0.3); for (let x = 0; x < W; x += 12) P.vline(x, 0, H, '#f4f2ec'); }), x1 - 3.5, 4.5, (z0 + z1) / 2, 'e', z1 - z0 - 2.4, 0.6, { off: 0.02 });
  C.box(gk, red, x0 + 6.2, 4.2, zc - 0.6, x0 + 7.4, 6.2, zc + 0.6); C.box(gk, TX.solid('#1a1a1e'), x0 + 6.2, 6.2, zc - 0.6, x0 + 7.4, 6.6, zc + 0.6);
  for (const [ya, za, zb] of [[0.55, z0 + 0.1, z1 - 0.1], [2.6, z0 + 0.5, z1 - 0.5]]) { beam(C, gk, white, [x0 + 0.2, ya + 0.9, zb], [x1 - 0.2, ya + 0.9, zb], 0.05); beam(C, gk, white, [x0 + 0.2, ya + 0.9, za], [x1 - 0.2, ya + 0.9, za], 0.05); }
  C.decal(gk, ptex('wf_boatname', 2.6, 0.45, (g, W, H, r, P) => { P.fill('#f4f2ec'); crisp(P, 'BAY SPIRIT', W / 2, H / 2 + 1, 8, '#2a4a7a'); }), x1 - 0.4, -0.38, z1, 's', 2.6, 0.45, { off: 0.02 });
  C.props.push({ kind: 'wf_lifering', x: x0 + 2, y: 0.55, z: z1 - 0.2, yaw: 0 }); C.props.push({ kind: 'wf_lifering', x: x0 + 9, y: 0.55, z: z1 - 0.2, yaw: 0 });
  C.props.push({ kind: 'wf_gull', x: x0 + 6.8, y: 6.6, z: zc, yaw: 1.2 });
}

// ---------------------------------------------------------------- Bayside Pier
function pier(C, ctx) {
  const [px0, pz0, px1, pz1] = PIER, deckT = TX.planks('#9a8468', 'h'), pile = TX.solid('#4a3a2e'), pile2 = TX.solid('#5a4636');
  C.plinth(px0, pz0, px1, pz1, PY, deckT, TX.planks('#6a5440', 'h'), { y0: 0.05 });
  // a ramp up from the promenade
  quad4(C, 'ground', deckT, [px0, 0.01, 12.9], [px1, 0.01, 12.9], [px1, PY, pz1], [px0, PY, pz1], [px0, 0], [px1, 0], [px1, 0.95], [px0, 0.95], { up: true });
  C.nav.open(px0, pz1 - 0.1, px1, 12.9, 0, (x, z) => Math.max(0.01, PY * (12.9 - z) / 1.0));
  C.paint(px0, pz0, px1, 12.9, '#a87a4a');
  // piles and braces under the deck
  for (let z = pz0 + 0.3; z < pz1; z += 2.1) for (const x of [px0 + 0.2, px1 - 0.2]) { C.box('wf_pier', pile, x - 0.17, -1.8, z - 0.17, x + 0.17, 0.06, z + 0.17); }
  for (let x = px0 + 0.2; x <= px1; x += 2.2) C.box('wf_pier', pile2, x - 0.17, -1.8, pz0 + 0.03, x + 0.17, 0.06, pz0 + 0.37);
  for (let z = pz0 + 0.3; z + 2.1 < pz1; z += 2.1) beam(C, 'wf_pier', pile2, [px1 - 0.05, -0.9, z], [px1 - 0.05, -0.1, z + 2.1], 0.1, 0.1);
  // railings around the deck
  railing(C, px0 + 0.15, pz0 + 0.15, px1 - 0.15, pz0 + 0.15, { y: PY }); railing(C, px0 + 0.15, pz0 + 0.15, px0 + 0.15, pz1, { y: PY, gaps: [] }); railing(C, px1 - 0.15, pz0 + 0.15, px1 - 0.15, pz1, { y: PY });
  // the entrance arch
  const A = landmark(C, 155.5, 12.2, 11, 0.8, 6.2, { name: 'pier arch' }), ag = A.gk(0, 'front'), wood = TX.solid('#2a6a7a'), cream = TX.solid('#f4f0e8');
  for (const x of [156.2, 165.8]) { C.box(ag, wood, x - 0.22, 0, 12.3, x + 0.22, 5.4, 12.74); C.box(ag, cream, x - 0.3, 5.4, 12.22, x + 0.3, 5.7, 12.82); C.nav.block(x - 0.3, 12.2, x + 0.3, 12.85); }
  const arch = wharfSign('BAYSIDE PIER', '#2a6a7a', '#f8f0d8', 8.0, 1.1, { fish: true, size: 16 });
  C.box(ag, wood, 156.0, 4.05, 12.42, 166.0, 5.25, 12.62); C.decal(ag, arch, 161, 4.1, 12.62, 's', 8.0, 1.1, { off: 0.01 }); C.decal(ag, arch, 161, 4.1, 12.42, 'n', 8.0, 1.1, { off: 0.01 });
  C.props.push({ kind: 'wf_gull', x: 156.2, y: 5.7, z: 12.5, yaw: 0.6 });
  for (let x = 156.6; x < 165.6; x += 0.6) C.props.push({ kind: 'wf_bulb', x, y: 5.27, z: 12.52, yaw: 0 });
  // a flag mast in the middle of the pier with pennant strings to the arch and the corners
  C.box('wf_pier', TX.solid('#e8e4dc'), 160.9, PY, 9.6, 161.1, 7.2, 9.8); C.box('wf_pier', TX.solid('#c8a050'), 160.8, 7.2, 9.5, 161.2, 7.5, 9.9); C.nav.block(160.75, 9.45, 161.25, 9.95);
  quad4(C, 'wf_pier', TX.stripes('#2a6a7a', '#f4f0e8', 3), [161.1, 6.1, 9.7], [162.6, 6.1, 9.7], [162.6, 7.1, 9.7], [161.1, 7.1, 9.7], [0, 0], [1, 0], [1, 1], [0, 1]);
  bunting(C, [161, 6.6, 9.7], [156.2, 5.3, 12.5], 6, 0.3); bunting(C, [161, 6.6, 9.7], [165.8, 5.3, 12.5], 6, 0.3);
  bunting(C, [161, 6.6, 9.7], [171.6, 3.2, 1.3], 10, 0.5); bunting(C, [161, 6.6, 9.7], [156.0, 4.0, 4.0], 6, 0.3); bunting(C, [161, 6.6, 9.7], [171.6, 3.2, 11.8], 7, 0.4);
  // west row: the seafood stand and the arcade (fronts face east onto the boardwalk)
  hut(C, { x: 150.5, z: 7.2, w: 5.2, d: 4.2, y0: PY, h: 3.0, name: 'salty gull', wall: TX.siding('#c84a3a'), roofCol: '#2a6a7a', front: 'e', glow: ctx.night, counter: true, awning: ['#2a6a7a', '#f4f0e8'],
    win: ptex('wf_fishwin', 3.2, 1.0, (g, W, H, r, P) => { P.fill('#2a2a30'); P.rect(2, 2, W - 4, H - 4, '#e0f0f8'); for (let x = 4; x < W - 8; x += 9) { P.rect(x, 12, 7, 4, ['#8aa0b8', '#e87a5a', '#c8ccd4'][Math.floor(r() * 3)]); P.px(x + 7, 11, '#8aa0b8'); P.px(x + 7, 16, '#8aa0b8'); P.px(x + 1, 13, '#1a1a1a'); } for (let x = 6; x < W - 8; x += 14) { P.rect(x, 22, 8, 4, '#d8482a'); P.px(x - 1, 21, '#d8482a'); P.px(x + 8, 21, '#d8482a'); } }), winW: 3.2, winH: 1.0,
    sign: wharfSign('SALTY GULL SEAFOOD', '#f4f0e8', '#2a4a6a', 4.0, 0.72, { rope: '#2a4a6a' }), signW: 3.8 });
  C.decal('wf_pier', fishMenu(), 151.6, PY + 0.1, 11.42, 's', 1.5, 1.1, { off: 0.01 });
  C.props.push({ kind: 'wf_crate', x: 156.4, y: PY, z: 10.6, yaw: 0 });
  hut(C, { x: 150.5, z: 1.6, w: 5.2, d: 4.0, y0: PY, h: 3.4, name: 'arcade', wall: TX.siding('#5a3a8a'), roofCol: '#c8a040', front: 'e', glow: ctx.night, win: arcadeWin(ctx.night), winW: 3.0, winH: 1.6,
    sign: wharfSign('TIDE POOL ARCADE', '#1a1426', '#ffe04a', 4.0, 0.72, { rope: '#5ae0ff' }), signW: 4.0 });
  // a sea-lion viewing deck between them
  C.decal('wf_pier', wharfSign('TOKON RAFTS', '#2a6a7a', '#f8f0d8', 3.0, 0.5, { size: 8 }), 150.35, PY + 0.4, 6.4, 'e', 2.0, 0.34, { off: 0.08 });
  C.prop('wf_telescope', 151.4, 6.2, { yaw: -Math.PI / 2 });
  C.interact({ x: 152.6, z: 6.2, r: 1.6, label: 'Watch the sea lions', icon: 'eye', act: async (app) => {
    sfx(app, 'roar');
    await app.say('', ['ORK! ORK! A big bull shoves two others off the dock and claims the sunny spot. Splash.', 'A pup slides off the raft, paddles in a circle, and flops right back on. Everyone grumbles.', 'They\'re piled up like warm sausages, flippers twitching in their sleep.'][Math.floor(Math.random() * 3)]);
  } });
  // east side: the carousel and the ice-cream cart, benches facing the bay
  C.prop('wf_carousel', 167.2, 6.4);
  const csign = wharfSign('BAY CAROUSEL', '#c8322a', '#f8f0d8', 2.6, 0.5, { size: 8 });
  C.box('wf_pier', TX.solid('#2a6a7a'), 164.0, PY, 9.56, 164.1, PY + 1.9, 9.66); C.box('wf_pier', TX.solid('#2a6a7a'), 164.0, PY + 1.3, 9.5, 166.6, PY + 1.82, 9.62); C.decal('wf_pier', csign, 165.3, PY + 1.32, 9.62, 's', 2.6, 0.5, { off: 0.01 }); C.nav.block(163.9, 9.45, 164.2, 9.75);
  C.interact({ x: 165.0, z: 9.4, r: 1.6, label: 'Ride the carousel', icon: 'star', act: async (app) => {
    sfx(app, 'furin');
    await app.say('', 'Round and round on a painted sea-horse. The bay spins past: pier, bridge, island, pier, bridge, island...', 'Your partner rides the one behind you and refuses to get off.');
  } });
  C.prop('wf_icecart', 168.6, 10.9);
  C.npc({ id: 'wfIce', who: 'passerby74', x: 170.6, z: 10.9, yaw: -Math.PI / 2, name: 'Scoops', lines: [['Sea Breeze Scoops! Salted caramel, fog-berry, and mint chip.'], ['Do NOT let the gulls see your cone. They have a system.']] });
  C.interact({ x: 168.6, z: 9.6, r: 1.4, label: 'Buy ice cream', icon: 'bowl', act: async (app) => {
    const i = await app.choose('Which flavour?', ['Salted caramel', 'Fog-berry', 'Mint chip', 'No thanks']);
    if (i >= 0 && i < 3) { sfx(app, 'coin'); await app.say('Scoops', ['Salted caramel — tastes like the boardwalk at sunset.', 'Fog-berry! Pale purple, a little tart. Locals only, shh.', 'Mint chip, the classic. Eat fast, it\'s windy.'][i]); app.toast(['Salted caramel cone', 'Fog-berry cone', 'Mint chip cone'][i], { icon: 'bowl' }); }
  } });
  for (const [x, z, yaw] of [[158, 2.4, 0], [164, 2.4, 0]]) C.prop('bench', x, z, { yaw, y: PY });
  // telescopes at the pier end
  for (const x of [155.2, 161.0, 168.4]) C.prop('wf_telescope', x, 1.75, { y: PY });
  const looks = [
    'Across the water: Gull Rock, a hump of stone with an old lighthouse blinking on top. Something big and blue just breached beside it.',
    'The long red bridge to the north, half swallowed by fog. Only the tops of its towers poke out, like ships\' masts.',
    'A fleet of little sailboats tacking back and forth. One of them has a Tokonmon at the tiller. It looks very proud.',
    'Far out, a fishing trawler trailing a cloud of gulls. Closer in, a seal pops up, sees you, and pops back down.',
  ];
  for (const x of [155.2, 161.0, 168.4]) C.interact({ x, z: 2.7, r: 1.2, label: 'Look through the telescope', icon: 'eye', act: async (app) => { sfx(app, 'coin'); await app.say('', looks[Math.floor(Math.random() * looks.length)]); } });
  // a fisherman at the end, a bucket and a coil of rope
  C.npc({ id: 'wfFisher', who: 'passerby12', x: 171.0, z: 3.2, yaw: Math.PI / 2, clip: 'think', name: 'Old Salt', lines: [['Nothing biting today. Yesterday, nothing either. Tomorrow? Big one. I can feel it.'], ['Caught a Tokonmon once. It caught me right back. We\'re still friends.']] });
  C.props.push({ kind: 'ct_bucket', x: 170.4, y: PY, z: 2.4, yaw: 0 }); C.props.push({ kind: 'wf_coil', x: 152.2, y: PY, z: 2.2, yaw: 0 });
  C.interact({ x: 170.0, z: 4.4, r: 1.3, label: 'Try fishing', icon: 'drop', act: async (app) => {
    sfx(app, 'hydro_splash');
    const c = [['an old boot', 'It\'s got a crab living in it. You put it back.'], ['a silver perch', 'It wriggles free and plops back in. Probably for the best.'], ['a tangle of kelp', 'Your partner wears it as a scarf.'], ['nothing', 'The old fisherman nods. "That\'s fishing."']][Math.floor(Math.random() * 4)];
    await app.say('', `You cast off the end of the pier... and reel in ${c[0]}!`, c[1]);
  } });
  C.spot('pier', 161, 11.0, Math.PI); C.spot('pierEnd', 161, 3.0, Math.PI);
}

// ---------------------------------------------------------------- the sea lions' floating docks (west of the pier)
function seaLions(C, ctx) {
  const raft = TX.planks('#7a6a58', 'h'), tire = TX.solid('#1e1e22'), rafts = [[132.5, 3.0, 137.5, 6.0], [138.6, 2.2, 143.4, 5.4], [133.6, 7.0, 138.4, 9.8], [140.0, 6.4, 145.6, 9.6], [145.4, 2.4, 148.6, 5.2]];
  for (const [a, b, c, d] of rafts) {
    C.box('wf_docks', raft, a, -0.95, b, c, -0.62, d, { top: raft });
    for (let x = a + 0.4; x < c; x += 1.2) { C.box('wf_docks', tire, x - 0.22, -0.9, d - 0.05, x + 0.22, -0.66, d + 0.12); }
    C.nav.height(a, b, c, d, 0, -0.62);
  }
  const lions = [[135, 4.4, 0.3], [136.4, 5.2, 2.6], [140.8, 3.8, -0.4], [142.4, 4.6, 3.4], [135.6, 8.4, 1.4], [142.6, 7.6, 0.2], [144.2, 8.6, 2.9], [146.9, 3.8, -1.2]];
  for (const [x, z, yaw] of lions) C.props.push({ kind: 'wf_sealion', x, y: -0.62, z, yaw });
  C.props.push({ kind: 'wf_buoy', x: 130.4, y: -1.1, z: 6.0, yaw: 0 }); C.props.push({ kind: 'wf_buoy', x: 148.0, y: -1.1, z: 10.0, yaw: 0 });
  C.spot('seaLions', 141.0, 3.8, 0);
  C.npc({ id: 'wfTourist', who: 'passerby290', x: 141.4, z: 13.2, yaw: Math.PI, clip: 'selfie', name: 'Tourist', lines: [['Look at them! They\'re SO loud. I love them. I\'m going to name every one.', 'That one is Gerald.']] });
  C.interact({ x: 140.0, z: 12.9, r: 1.6, label: 'Watch the sea lions', icon: 'eye', act: async (app) => { sfx(app, 'roar'); await app.say('', 'Eight sea lions on five rafts, and every one of them wants the same raft. The barking echoes off the pier.'); } });
}

// ---------------------------------------------------------------- the west wharf: fish market, boats, jetties, the cable-car turnaround
function westWharf(C, ctx) {
  // two jetties with boats moored alongside
  for (const jx of [26.6, 46.6]) {
    C.plinth(jx, 3.2, jx + 2.0, QZ, 0.0, TX.planks('#8a7a68', 'h'), TX.planks('#5a4a3a', 'h'), { y0: -0.3 });
    for (let z = 3.4; z < QZ; z += 2.0) for (const x of [jx + 0.15, jx + 1.85]) C.box('wf_pier', TX.solid('#4a3a2e'), x - 0.14, -1.8, z - 0.14, x + 0.14, 0.25, z + 0.14);
    railing(C, jx + 0.1, 3.3, jx + 1.9, 3.3, {}); C.prop('wf_bollard', jx + 0.3, 6.0); C.prop('wf_bollard', jx + 1.7, 9.0);
  }
  for (const [x, z, yaw] of [[22.0, 7.0, Math.PI / 2], [32.2, 6.4, -Math.PI / 2], [42.0, 6.8, Math.PI / 2], [52.4, 7.2, -Math.PI / 2], [10, 6.0, 0.1], [70, 5.6, -0.15], [84, 6.2, 0.05]]) C.props.push({ kind: 'wf_boat', x, y: -1.25, z, yaw });
  C.props.push({ kind: 'wf_buoy', x: 16, y: -1.1, z: 3.0, yaw: 0 }); C.props.push({ kind: 'wf_buoy', x: 60, y: -1.1, z: 4.0, yaw: 0 });
  C.props.push({ kind: 'wf_gull', x: 27.6, y: 1.06, z: 3.3, yaw: 2 });
  // the fish market: open stalls under striped canopies
  const stalls = [[6, '#2a6a7a'], [13, '#c8322a'], [20, '#2a6a7a'], [36, '#c8322a']];
  for (const [sx, col] of stalls) {
    const gk = 'wf_market', post = TX.solid('#e8e4dc'), aw = TX.awningTex(col, '#f4f0e8'), z0 = 17.0, z1 = 19.6;
    for (const [px, pz] of [[sx, z0], [sx + 5, z0], [sx, z1], [sx + 5, z1]]) C.box(gk, post, px - 0.06, 0, pz - 0.06, px + 0.06, 2.5, pz + 0.06);
    quad4(C, gk, aw, [sx - 0.3, 2.2, z0 - 0.4], [sx + 5.3, 2.2, z0 - 0.4], [sx + 5.3, 2.7, (z0 + z1) / 2], [sx - 0.3, 2.7, (z0 + z1) / 2], [0, 0], [5.6, 0], [5.6, 1], [0, 1], { up: true });
    quad4(C, gk, aw, [sx + 5.3, 2.2, z1 + 0.4], [sx - 0.3, 2.2, z1 + 0.4], [sx - 0.3, 2.7, (z0 + z1) / 2], [sx + 5.3, 2.7, (z0 + z1) / 2], [0, 0], [5.6, 0], [5.6, 1], [0, 1], { up: true });
    C.box(gk, TX.planks('#8a6a46'), sx + 0.3, 0, z0 + 0.5, sx + 4.7, 0.8, z1 - 0.5, { top: TX.solid('#d0e4ec') }); C.nav.block(sx + 0.3, z0 + 0.5, sx + 4.7, z1 - 0.5);
    for (let i = 0; i < 3; i++) C.props.push({ kind: i === 1 ? 'wf_pots' : 'wf_crate', x: sx + 1.0 + i * 1.5, y: 0.8, z: (z0 + z1) / 2, yaw: i * 0.3, s: i === 1 ? 0.55 : 1 });
  }
  const fm = wharfSign('FISH MARKET', '#2a6a7a', '#f8f0d8', 4.4, 0.8, { fish: true });
  C.box('wf_market', TX.solid('#2a6a7a'), 27.8, 0, 18.2, 28.0, 3.2, 18.4); C.box('wf_market', TX.solid('#2a6a7a'), 32.0, 0, 18.2, 32.2, 3.2, 18.4); C.box('wf_market', TX.solid('#2a6a7a'), 27.8, 2.3, 18.24, 32.2, 3.2, 18.36);
  C.decal('wf_market', fm, 30.0, 2.36, 18.36, 's', 4.2, 0.8, { off: 0.01 }); C.nav.block(27.7, 18.1, 28.1, 18.5); C.nav.block(31.9, 18.1, 32.3, 18.5);
  C.npc({ id: 'wfFishmonger', who: 'passerby150', x: 15.0, z: 19.35, yaw: Math.PI, name: 'Fishmonger', lines: [['Dungeness crab! Caught this morning! Look at the size of this one — it waved at me!'], ['Rock cod, sand dabs, halibut. Fresh as the fog.']] });
  C.interact({ x: 15.5, z: 16.4, r: 2.0, label: 'Browse the fish market', icon: 'eye', act: async (app) => app.say('', 'Crabs stacked like red bricks, silver fish on beds of ice, a bucket of mussels clicking quietly.', 'A hand-written card: "DO NOT FEED THE GULLS. THEY ARE ALREADY TOO POWERFUL."') });
  // the cable-car turnaround: a turntable flush in the pavement, a car on it
  const tc = [62, 16.2];
  discDecal(C, 'ground', turntableTex(), tc[0], 0.016, tc[1], 3.7, { uvR: 0.484 });
  C.props.push({ kind: 'wf_cablecar', x: tc[0], y: 0.02, z: tc[1], yaw: 0 });
  C.nav.block(tc[0] - 3.8, tc[1] - 1.4, tc[0] + 3.8, tc[1] + 1.4);
  const ts = wharfSign('CABLE CAR TURNAROUND', '#b82a24', '#f8f0d8', 5.0, 0.6, { size: 16 });
  C.box('wf_market', TX.solid('#2a3a5a'), 66.6, 0, 19.4, 66.75, 2.6, 19.55); C.box('wf_market', TX.solid('#2a3a5a'), 71.6, 0, 19.4, 71.75, 2.6, 19.55); C.box('wf_market', TX.solid('#2a3a5a'), 66.6, 1.95, 19.44, 71.75, 2.6, 19.5);
  C.decal('wf_market', ts, 69.17, 1.98, 19.5, 's', 5.0, 0.6, { off: 0.01 }); C.nav.block(66.5, 19.3, 66.85, 19.65); C.nav.block(71.5, 19.3, 71.85, 19.65);
  C.npc({ id: 'wfGripman', who: 'driver', x: 66.6, z: 16.2, yaw: -Math.PI / 2, name: 'Gripman', lines: [['End of the line! We turn her around by hand — put your back into it!'], ['Ding-ding! That\'s cable-car for "get on or get out of the way."']] });
  C.interact({ x: 62, z: 18.4, r: 2.2, label: 'Board the cable car', icon: 'map', act: async (app) => {
    if (app.story && app.story.tramStop) return app.story.tramStop();
    await app.say('Gripman', 'Next car up the hill in a few minutes. Hold on to the pole and lean into the turns!');
  } });
  C.spot('tramTurn', 62, 18.8, Math.PI);
  // the big wheel sign
  wheelSign(C, 80, 18.6);
}
function wheelSign(C, cx, cz) {
  const gk = 'wf_wheel', wood = TX.solid('#7a4a2a'), wood2 = TX.solid('#9a6a3a'), cy = 5.0, R = 1.9;
  for (const x of [cx - 0.9, cx + 0.9]) { C.box(gk, wood, x - 0.12, 0, cz - 0.12, x + 0.12, cy, cz + 0.12); C.nav.block(x - 0.18, cz - 0.18, x + 0.18, cz + 0.18); }
  for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2; beam(C, gk, wood2, [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, cz], [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, cz], 0.18, 0.22); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; beam(C, gk, wood, [cx + Math.cos(a) * 1.0, cy + Math.sin(a) * 1.0, cz], [cx + Math.cos(a) * (R + 0.55), cy + Math.sin(a) * (R + 0.55), cz], 0.12, 0.12); C.box(gk, wood2, cx + Math.cos(a) * (R + 0.55) - 0.1, cy + Math.sin(a) * (R + 0.55) - 0.1, cz - 0.1, cx + Math.cos(a) * (R + 0.55) + 0.1, cy + Math.sin(a) * (R + 0.55) + 0.1, cz + 0.1); }
  const face = ptex('wf_wheelface', 2.2, 2.2, (g, W, H, r, P) => {
    const c = W / 2 - 0.5; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - c, y - c); if (d < 34) P.px(x, y, d > 32 ? '#c8a050' : '#2a5a7a'); }
    // a crab, then the lettering
    const k = c, ky = c - 8; P.rect(k - 7, ky - 2, 14, 7, '#e8482a'); P.rect(k - 5, ky - 4, 10, 2, '#e8482a'); P.px(k - 3, ky - 6, '#1a1a1a'); P.px(k + 2, ky - 6, '#1a1a1a'); P.vline(k - 3, ky - 5, 2, '#e8482a'); P.vline(k + 2, ky - 5, 2, '#e8482a');
    for (const s of [-1, 1]) { P.rect(k + s * 11 - 2, ky - 7, 4, 4, '#e8482a'); P.px(k + s * 11, ky - 7, '#2a5a7a'); for (let i = 0; i < 3; i++) P.hline(k + (s < 0 ? -12 : 7) + 0, ky + 3 + i * 2, 5, '#c83a2a'); }
    crisp(P, 'THE', c + 1, c + 6, 8, '#f8f0d8'); crisp(P, 'WHARF', c + 1, c + 15, 16, '#f8f0d8', { shadow: '#0e2a3a' });
  });
  fbox(C, gk, TX.solid('#2a5a7a'), cx - 1.1, cy - 1.1, cz - 0.08, cx + 1.1, cy + 1.1, cz + 0.08, { s: face, n: face });
  C.interact({ x: cx, z: cz - 0.9, r: 1.6, label: 'Read the wharf sign', icon: 'eye', act: async (app) => app.say('', 'A ship\'s wheel the size of a car, with a grinning crab painted in the middle: THE WHARF.', 'Every tourist in the city has a photo under it. Now so do you.') });
}

// ---------------------------------------------------------------- the east wharf: marina, boat tours, crab shack
function eastWharf(C, ctx) {
  // finger docks into the marina, sailboats in the slips
  for (const fx of [179.4, 193.4, 207.4, 221.4]) {
    C.plinth(fx, 2.6, fx + 2.2, QZ, -0.18, TX.planks('#8a7a68', 'h'), TX.planks('#5a4a3a', 'h'), { y0: -0.5 });
    for (let z = 3.0; z < QZ; z += 2.6) C.box('wf_pier', TX.solid('#e8e4dc'), fx + 0.9, -0.18, z - 0.12, fx + 1.3, 0.12, z + 0.12);
    C.props.push({ kind: 'wf_bollard', x: fx + 0.25, y: -0.18, z: 4.4, yaw: 0 }); C.props.push({ kind: 'wf_bollard', x: fx + 1.95, y: -0.18, z: 8.6, yaw: 0 });
  }
  for (const [x, z] of [[186.4, 6.4], [200.4, 6.8], [214.4, 6.2], [227.0, 6.6]]) C.props.push({ kind: 'wf_sail', x, y: -1.2, z, yaw: Math.PI / 2 });
  C.props.push({ kind: 'wf_boat', x: 176.0, y: -1.25, z: 4.8, yaw: Math.PI / 2 });
  // boat tours kiosk and the crab shack with tables
  hut(C, { x: 186, z: 17.0, w: 4.6, d: 2.8, h: 2.8, name: 'boat tours', wall: TX.siding('#f0e8d0'), roofCol: '#2a6a7a', front: 's', counter: true,
    win: ptex('wf_tourwin', 2.6, 1.0, (g, W, H, r, P) => { P.fill('#2a3a4a'); P.rect(2, 2, W - 4, H - 4, '#9ac8e0'); for (let i = 0; i < 3; i++) { const x = 8 + i * 26; P.rect(x, 18, 18, 4, '#f4f0e8'); P.rect(x + 7, 8, 2, 10, '#8a6a4a'); for (let y = 9; y < 18; y++) P.hline(x + 9, y, Math.max(0, 8 - (y - 9)), '#f4f0e8'); } }), winW: 2.6, winH: 1.0,
    sign: wharfSign('BAY BOAT TOURS', '#2a6a7a', '#f8f0d8', 3.6, 0.6, { size: 16 }), signW: 3.8 });
  C.interact({ x: 188.3, z: 20.6, r: 1.6, label: 'Ask about boat tours', icon: 'map', act: async (app) => app.say('Ticket Booth', 'Around Gull Rock and under the big bridge, ninety minutes! Sea lions guaranteed, whales if you\'re lucky.', 'Tours are sold out today. The fog bought all the tickets.') });
  hut(C, { x: 202, z: 16.6, w: 6.4, d: 3.2, h: 3.0, name: 'crab shack', wall: TX.siding('#d85a3a'), roofCol: '#5a5a62', front: 's', counter: true, awning: ['#f0c040', '#f4f0e8'],
    win: fishMenu(), winW: 1.6, winH: 1.1, sign: wharfSign('CRAB SHACK', '#f4f0e8', '#c83a2a', 3.4, 0.6, { size: 16, fish: true }), signW: 3.4 });
  C.npc({ id: 'wfCrab', who: 'passerby187', x: 206.8, z: 20.4, yaw: Math.PI, name: 'Crab Shack Cook', lines: [['Chowder in a sourdough bowl! You eat the bowl. That\'s the rule.'], ['Garlic crab, extra garlic. Your partner will smell it for a week.']] });
  C.interact({ x: 205.2, z: 20.4, r: 1.5, label: 'Order clam chowder', icon: 'bowl', act: async (app) => { sfx(app, 'coin'); await app.say('Crab Shack Cook', 'One clam chowder in a sourdough bread bowl! Careful, it\'s hot — blow on it. No, not on me.'); app.toast('Clam chowder: warm and salty', { icon: 'bowl' }); } });
  for (const [x, z] of [[214, 14.6], [219, 14.6], [214, 18.4]]) C.prop('parasol', x, z);
  C.prop('wf_anchor', 226.2, 18.2);
  C.interact({ x: 226.2, z: 17.0, r: 1.4, label: 'Read the anchor plaque', act: async (app) => app.say('', '"This anchor held the schooner MARY ELLEN through the great storm. The ship sank anyway. The anchor did its best."') });
}

// ---------------------------------------------------------------- along the whole promenade: lamps, palms, benches, telescopes, gulls
function promenadeLife(C, ctx) {
  const skip = (x, a, b) => x > a && x < b;
  for (let x = 6; x < 229; x += 12) {
    if (skip(x, 92, 126) || skip(x, 148, 174)) continue;
    const lx = [180.5, 194.5, 208.5, 222.5].some((d) => Math.abs(d - x) < 1.8) ? x + 3 : x;
    C.prop('lamp', lx, 12.6, { light: false });
    if (!skip(x, 55, 70) && Math.abs(x + 4 - 27.6) > 3 && Math.abs(x + 4 - 47.6) > 3 && ![180.5, 194.5, 208.5, 222.5].some((d) => Math.abs(d - x - 4) < 2.6)) C.prop('bench', x + 4, 12.9, { yaw: 0 });
  }
  for (let x = 12; x < 229; x += 16) { if (skip(x, 92, 126) || skip(x, 150, 172) || skip(x, 4, 42) || skip(x, 55, 70) || skip(x, 184, 210)) continue; C.prop('palm', x, 19.0); }
  for (const x of [98, 122]) { C.prop('palm', x, 18.6); }
  for (const x of [100.5, 119.5]) C.prop('planter', x, 10.4);
  // festoon lights between the lamp posts along the water
  for (let x = 6; x + 12 < 229; x += 12) { if (skip(x, 86, 126) || skip(x, 142, 174)) continue; const a = [x, 4.3, 12.6], b2 = [x + 12, 4.3, 12.6], N = 8; for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N, y0 = 4.3 - Math.sin(t0 * Math.PI) * 0.7, y1 = 4.3 - Math.sin(t1 * Math.PI) * 0.7; beam(C, 'props', TX.solid('#3a3a40'), [x + 12 * t0, y0, 12.6], [x + 12 * t1, y1, 12.6], 0.025, 0.025, { caps: false }); if (i) C.props.push({ kind: 'wf_bulb', x: x + 12 * t0, y: y0 - 0.2, z: 12.6, yaw: 0 }); } void a; void b2; }
  // telescopes on the promenade
  const looks = ['Out past the boats: Gull Rock and its lighthouse. A ferry is chugging toward it, trailing gulls.', 'The pier, the carousel turning, and beyond it the sea lions arguing over their rafts.', 'The red bridge, far off, its towers wearing a scarf of fog.'];
  for (const x of [40.5, 130.5, 190.5]) { C.prop('wf_telescope', x, 12.55); C.interact({ x, z: 13.6, r: 1.2, label: 'Look through the telescope', icon: 'eye', act: async (app) => { sfx(app, 'coin'); await app.say('', looks[Math.floor(Math.random() * looks.length)]); } }); }
  // life rings, gulls on the railing, a tide board
  for (const x of [20.5, 74.5, 136.5, 216.5]) C.prop('wf_lifering', x, 12.35, { yaw: 0 });
  for (const [x, yaw] of [[11.8, 0.4], [57.2, 2.6], [88.4, -1.2], [128.0, 1.0], [178.8, 2.2], [224.4, -0.5]]) C.props.push({ kind: 'wf_gull', x, y: 1.06, z: QZ, yaw });
  for (const [x, z] of [[30, 14.8], [143.5, 15.2], [200, 14.2]]) C.props.push({ kind: 'wf_gull', x, y: 0.01, z, yaw: x });
  C.box('wf_rail', TX.solid('#2a6a7a'), 126.6, 0, 18.6, 126.72, 2.0, 18.72); C.box('wf_rail', TX.solid('#2a6a7a'), 128.4, 0, 18.6, 128.52, 2.0, 18.72); C.box('wf_rail', TX.solid('#2a6a7a'), 126.6, 0.9, 18.64, 128.52, 1.96, 18.68);
  C.decal('wf_rail', board('wf_tides', ['TIDE TABLE', 'HIGH  6:12  5.8ft', 'LOW  12:30  0.4ft', 'HIGH  6:47  5.2ft', 'SUNSET 7:31'], 1.8, 1.0, { bg: '#f0e8d8', fg: '#2a3a5a', frame: '#2a6a7a', size: 8, lh: 9 }), 127.56, 0.93, 18.68, 's', 1.8, 1.0, { off: 0.01 });
  C.nav.block(126.5, 18.5, 128.6, 18.8);
  C.interact({ x: 127.5, z: 17.6, label: 'Read the tide table', act: async (app) => app.say('', 'TIDE TABLE — High 6:12 am, low 12:30 pm, high 6:47 pm. Sunset 7:31.', 'Someone has added in marker: "Sea lions: ALWAYS."') });
  C.interact({ x: 18.0, z: 13.6, label: 'Rest on the bench', icon: 'heart', act: async (app) => { if (app.story && app.story.rest) return app.story.rest(); await app.say('', 'You sit and watch the boats bob. The gulls watch your pockets.'); } });
}
