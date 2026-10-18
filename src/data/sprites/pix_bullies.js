// Team Metallica's bruisers as hand-pixel art (see src/px/pixmon.js for the painter):
// Studrat (Riff's... everyone's favourite street rat), Moshbull (Moshi's gentle
// mosh-pit bull) and Thrashark (the walking buzzsaw shark).
// Views are drawn facing left; the game mirrors them for the other side.
import { FX } from '../../px/pixmon.js';

// shared metal: chrome with a cool, purple-blue shadow and a warm white glint
const STEEL = { ramp: ['#eef3fb', '#b8c4dc', '#7884a6', '#474c72'], line: '#171930', lineLit: '#3a4066', gloss: true, spec: 0.9, specC: '#ffffff', th: [0.74, 0.46, 0.14] };
const SPK = { s: '#b8c4dc', S: '#ffffff', d: '#474c72', m: '#7884a6' };

// ================================================================== STUDRAT
// A scrappy street rat up on its hind legs in a boxer's crouch: a mohawk of chrome
// spikes it sharpens on train rails, a blood-red studded collar, a scrap of denim
// battle vest sewn on its flank, a safety pin through its torn ear and a tail that
// ends in chain links. Sly red eyes under heavy lids, one chipped steel tooth.
const RAT_PAL = {
  fur: { ramp: ['#c2b4bc', '#8a7e9c', '#5e5478', '#3b3358'], line: '#181326', lineLit: '#3b3358' },
  cream: { ramp: ['#fbf2e6', '#e0d0cc', '#b09cae', '#7c6a8c'], line: '#191428', lineLit: '#5a4c6a' },
  skin: { ramp: ['#ffd8d0', '#f4a2ac', '#cc6e8c', '#8e466e'], line: '#34122a', lineLit: '#7a3452' },
  steel: STEEL,
  leather: { ramp: ['#f2545a', '#c81e38', '#8c1436', '#560e2e'], line: '#24061a', lineLit: '#560e2e' },
  denim: { ramp: ['#b2d0f4', '#6c94d2', '#4262a2', '#2a3c72'], line: '#121838', lineLit: '#2a3c72' },
  cheese: { ramp: ['#fff6b0', '#ffd650', '#eaa22c', '#b8682a'], line: '#4a2a12', lineLit: '#8a5a1c' },
};
const RK = '#1c1220', RW = '#ffffff';
const REYE = {   // near eye / far eye: heavy lids, red irises
  open: [['.kkkkk.', 'kllllkk', 'kkrRWrk', '.krrdk.', '..kkk..'], ['kkk', 'lrW', 'kdk']],
  fierce: [['kk.....', 'lkkkk..', 'lkkkkkk', '.krRWrk', '..kddk.'], ['..k', 'kkk', 'kRW']],
  closed: [['.......', '.......', '.kkkkk.', 'k.....k'], ['...', '...', 'kkk']],
  sleep: [['.......', '.......', '.......', 'kkkkkkk'], ['...', '...', 'kkk']],
  happy: [['.......', '..kkk..', '.k...k.', 'k.....k'], ['...', '.k.', 'k.k']],
  hurt: [['.k.....', '..kk...', '....kk.', '..kk...', '.k.....'], ['..k', 'kk.', '..k']],
  ko: [['.k...k.', '..k.k..', '...k...', '..k.k..', '.k...k.'], ['k.k', '.k.', 'k.k']],
};
const REYEMAP = { k: RK, W: RW, r: '#e2283a', R: '#ff6a5a', d: '#7a0e2a', l: '#5e5478' };
// a cone-shaded spike from its base centre (bx, by) to the tip (tx, ty), half-width w at the base:
// lit along the edge that faces the upper left, dark along the other, a crisp ridge between
function cone(P, bx, by, tx, ty, w, mat, grp) {
  const len = Math.hypot(tx - bx, ty - by) || 1, dx = (tx - bx) / len, dy = (ty - by) / len, qx = -dy, qy = dx;
  const pts = [[bx + qx * w - dx * 0.5, by + qy * w - dy * 0.5], [tx, ty], [bx - qx * w - dx * 0.5, by - qy * w - dy * 0.5]];
  P.shape(Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])), (x, y) => inPoly(pts, x, y), mat, { grp }, (x, y) => {
    const a = Math.max(0, Math.min(1, ((x - bx) * dx + (y - by) * dy) / len)), hw = Math.max(0.6, w * (1 - a));
    const u = Math.max(-1, Math.min(1, ((x - bx) * qx + (y - by) * qy) / hw));
    return [qx * u + dx * 0.25, qy * u + dy * 0.25, 0.8];
  });
}
// an upright spike: base (x, y), height h, tip slanted by sl
function spike(P, x, y, w, h, sl, mat, grp) { cone(P, x, y + 1, x + sl, y - h, w, mat, grp); }
// a craggy chunk of stone: an irregular polygon cut into flat facets around a raised apex
// (each facet takes one tone, so it reads as hewn rock), with a crack and a lit chip
const CRAG = [1, 0.82, 0.97, 0.78, 1.04, 0.9, 0.98, 0.76, 0.95, 0.86, 1.02];
function rock(P, cx, cy, rx, ry, seed, mat, grp, o = {}) {
  const n = o.n || 8, pts = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + seed * 0.7, j = CRAG[(k + seed * 3) % CRAG.length]; pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]); }
  const ax = cx - rx * 0.2, ay = cy - ry * 0.28, hz = Math.min(rx, ry) * (o.h || 1.1);
  const facet = [];
  for (let k = 0; k < n; k++) {
    const [bx, by] = pts[k], [qx, qy] = pts[(k + 1) % n];
    const ux = bx - ax, uy = by - ay, uz = -hz, vx = qx - ax, vy = qy - ay, vz = -hz;
    let N = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; if (N[2] < 0) N = N.map((c) => -c);
    facet.push({ tri: [[ax, ay], [bx, by], [qx, qy]], N });
  }
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const fb = o.facet ?? 0.45;
  P.shape(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (x, y) => inPoly(pts, x, y), mat, { grp, lit: o.lit || 0 }, (x, y) => {
    let N = [0, 0, 1];
    for (const f of facet) if (inPoly(f.tri, x, y)) { N = f.N; break; }
    const l = Math.hypot(...N) || 1, u = (x - cx) / rx, v = (y - cy) / ry, w = Math.sqrt(Math.max(0.05, 1 - u * u - v * v));
    return [N[0] / l * fb + u * (1 - fb), N[1] / l * fb + v * (1 - fb), N[2] / l * fb + w * (1 - fb)];
  });
  const M = P.mats[P.m(mat)];
  if (o.crack !== false) {
    const a = 0.5 + seed * 1.3, x0 = cx + Math.cos(a) * rx * 0.9, y0 = cy + Math.sin(a) * ry * 0.9, x1 = cx + Math.cos(a) * rx * 0.35, y1 = cy + Math.sin(a) * ry * 0.35;
    P.line(x0, y0, x1, y1, M.inner || M.ramp[3]); P.px(x1 - 1, y1 - 1, M.inner || M.ramp[3]);
  }
  if (o.chip !== false) { P.px(ax - 1, ay - 1, M.ramp[0]); P.px(ax, ay - 1, M.ramp[0]); }
  if (o.pits) for (const [u, v] of [[0.35, 0.3], [-0.4, 0.35], [0.1, -0.5]]) P.px(cx + u * rx, cy + v * ry, M.inner || M.ramp[3]);
}
function inPoly(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
}

function studrat(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0;
  const lean = m.lean + Math.round(tilt * 2);
  const X = 40 + m.dx, base = 63 + m.bob;
  const hx = X - 7 - lean * 2, hy = base - 26 + sq + Math.round(tilt * 8);     // head centre
  const sw = Math.round(Math.sin(m.t * Math.PI * 2 * (m.clip === 'idle' ? 1 : 2)) * 1.2);   // tail sway

  // ---- the tail and its chain
  const tail = () => {
    const pts = back
      ? [[X + 1, base - 5, 2.2], [X + 4, base - 1, 2], [X + 11, base - 1, 1.6], [X + 16, base - 5, 1.3], [X + 17 + sw, base - 10, 1.1]]
      : [[X + 12, base - 4, 2.3], [X + 19, base - 2, 1.9], [X + 25, base - 5, 1.5], [X + 27 + sw, base - 10, 1.2], [X + 27 + sw, base - 14, 1]];
    P.tube(pts, 'skin', { grp: 'tail', round: 2 });
    for (let k = 1; k < pts.length - 2; k++) P.px(pts[k][0], pts[k][1] - 1, '#ffe4de');
    const [ex, ey] = pts[pts.length - 1];
    chain(P, ex, ey - 2, 3, sw, 'tailchain');
  };
  // ---- feet, haunch, body
  const steps = () => { const nearUp = m.step > 0 ? 2 : 0, farUp = m.step < 0 ? 2 : 0; return [nearUp, farUp]; };
  const body = () => {
    const [nearUp, farUp] = steps();
    if (back) {
      P.ell(X - 6, base - 1 - farUp, 3.6, 2.2, 'skin', { grp: 'footF' });
      P.ell(X + 7, base - 1 - nearUp, 3.6, 2.2, 'skin', { grp: 'footN' });
      P.tube([[X, base - 9 + sq, 10 + sq * 0.5], [X, base - 17 + sq, 8.5]], 'fur', { grp: 'body', round: 6 });
      return;
    }
    P.ell(X - 6, base - 1 - farUp, 4.4, 1.8, 'skin', { grp: 'footF' });
    P.stamp(X - 11, base - 1 - farUp, ['h.h'], { h: '#8e466e' }, { on: true });
    P.tube([[X + 5, base - 9 + sq, 9.5 + sq * 0.5], [X - 1 - lean, base - 17 + sq, 7.5]], 'fur', { grp: 'body', round: 6 });
    P.ell(X - 2 - lean, base - 11 + sq, 7, 8, 'cream', { paint: true, grp: 'body', rot: -0.3 });
  };
  const haunch = () => {
    if (back) return;
    const [nearUp] = steps();
    P.ell(X + 9, base - 7 - nearUp + sq, 5.5, 5.5, 'fur', { grp: 'thigh' });
    P.ell(X + 3, base - 1 - nearUp, 6.5, 2, 'skin', { grp: 'footN' });
    P.stamp(X - 3, base - nearUp, ['h.h.h'], { h: '#8e466e' }, { on: true });
  };
  // ---- arms: pink fists in a boxer's guard (or raised, throwing, eating)
  const arms = () => {
    if (back) {
      const up = m.arm === 1 ? -12 : m.arm === 2 ? -4 : 0;
      for (const [s, g] of [[-1, 'armF'], [1, 'armN']]) {
        P.tube([[X + s * 8, base - 18, 2.2], [X + s * 11, base - 12 + up, 2]], 'fur', { grp: g });
        P.circ(X + s * 11, base - 11 + up, 2.4, 'skin', { grp: g });
      }
      return;
    }
    // fists held up in front of the chest; the upper arms are hidden (foreshortened) unless raised
    const A = {
      0: [[hx - 8, hy + 12], [hx - 2, hy + 14]],
      1: [[hx - 11, hy - 11], [hx + 15, hy - 12]],
      2: [[hx - 14, hy + 9], [hx - 10, hy + 12]],
      3: [[hx - 6, hy + 19], [hx + 0, hy + 21]],
      4: [[hx - 9, hy + 11], [hx - 4, hy + 13]],
    }[m.arm] || [[hx - 8, hy + 12], [hx - 2, hy + 14]];
    const [far, near] = A, sx = X + 1 - lean, sy = base - 17 + sq, up = m.arm === 1 || m.arm === 2;
    P.tube(up ? [[sx - 5, sy, 1.9], [far[0] + 1, far[1] + 1, 1.7]] : [[far[0] + 3, far[1] + 3, 1.8], [far[0] + 1, far[1] + 1, 1.7]], 'fur', { grp: 'armF', lit: -0.1 });
    P.circ(far[0], far[1], 2.3, 'skin', { grp: 'fistF' });
    if (m.arm === 4) cheese(P, hx - 10, hy + 7);
    P.tube(up ? [[sx, sy, 2.4], [near[0] + (m.arm === 1 ? -1 : 2), near[1] + (m.arm === 1 ? 2 : 1), 2.1]] : [[near[0] + 4, near[1] + 3, 2.3], [near[0] + 2, near[1] + 1, 2.1]], 'fur', { grp: 'armN' });
    P.circ(near[0], near[1], 2.8, 'skin', { grp: 'fistN' });
    P.stamp(near[0] - 2, near[1] - 2, ['.hh', 'h..'], { h: '#cc6e8c' }, { on: true });
    P.px(near[0] - 1, near[1] - 1, '#ffe4de');
  };
  // ---- head parts
  const ear = (cx, cy, r, torn, back2) => {
    // big round rat ear; the torn one has a V bitten out of its rim
    const notch = (x, y) => torn && inPoly(back2 ? [[cx + r + 1, cy - 4], [cx + r - 2.6, cy - 1.5], [cx + r + 1, cy + 0.5]] : [[cx + r + 1, cy - 3.5], [cx + r - 2.8, cy - 0.5], [cx + r + 1, cy + 1.5]], x, y);
    const g = 'ear' + (torn ? 'N' : 'F');
    P.shape(cx - r, cy - r - 1, cx + r, cy + r + 1, (x, y) => ((x - cx) / r) ** 2 + ((y - cy) / (r + 0.6)) ** 2 <= 1 && !notch(x, y), 'fur', { grp: g, round: 2.5 });
    // the cupped inside: shadowed under the upper-left rim, lit toward the lower right
    if (!back2) P.ell(cx - 0.6, cy + 0.8, r - 1.9, r - 1.3, 'skin', { paint: true, grp: g, heat: (x, y) => 0.18 + ((x - cx) * 0.6 + (y - cy)) / r * 0.42 });
  };
  const collar = (cx, cy, wide) => {
    // blood-red leather with steel studs and a few short spikes sticking out
    if (wide) {
      for (const k of [-7, 7]) spike(P, cx + k, cy, 1.5, 3, k > 0 ? 3 : -3, 'steel', 'cspk' + k);
      P.tube([[cx - 7, cy, 1.8], [cx + 7, cy, 1.8]], 'leather', { grp: 'collar', round: 2 });
      for (const k of [-5, -1, 3]) P.px(cx + k, cy, '#e8eef8');
      return;
    }
    spike(P, cx + 7, cy, 1.6, 3, 3, 'steel', 'cspk1'); spike(P, cx + 4, cy + 3, 1.5, 3, 3, 'steel', 'cspk2');
    P.tube([[cx - 8, cy - 1, 1.8], [cx - 2, cy + 1, 2], [cx + 5, cy - 1, 1.8]], 'leather', { grp: 'collar', round: 2 });
    for (const [dx, dy] of [[-6, -1], [-3, 0], [0, 0], [3, -1]]) P.px(cx + dx, cy + dy, '#e8eef8');
    P.stamp(cx - 4, cy + 2, ['.s.', 'S.d', '.d.'], SPK, { mat: 'steel', grp: 'ring' });
  };
  const face = () => {
    const ex = m.eyes, e = REYE[ex] || REYE.open;
    P.stamp(hx - 5, hy - 3, e[0], REYEMAP, { on: true });
    P.stamp(hx - 12, hy - 2, e[1], REYEMAP, { on: true });
    // nose, whiskers, smirk with the chipped steel tooth
    const nx = hx - 17, ny = hy + 1;
    P.stamp(nx, ny, ['.nn', 'nNn', '.nn'], { n: '#e0708e', N: '#ffd0d6' }, { mat: 'skin', grp: 'nose' });
    P.ink(nx - 1, ny, nx - 4, ny - 1, '#dccfe0'); P.ink(nx - 1, ny + 2, nx - 3, ny + 3, '#dccfe0');
    // buck teeth hang below the snout: one cream, one chipped steel
    if (m.mouth === 0) {
      P.stamp(nx + 3, ny + 5, ['WS', 'W.'], { W: '#fff6e0', S: '#9aa8c8' }, { mat: 'cream', grp: 'teeth' });
      P.stamp(nx + 5, ny + 3, ['.....k', 'kkkkk.'], { k: RK }, { on: true });          // smirk, curling up at the cheek
    } else if (m.mouth === 1) {
      P.stamp(nx + 2, ny + 4, ['.WSkkk.', '.kmmmk.', '..kkk..'], { k: RK, W: '#fff6e0', S: '#9aa8c8', m: '#a83250' }, { mat: 'cream', grp: 'jaw' });
    } else {
      P.stamp(nx + 2, ny + 4, ['.WSkkk', 'kmmmmk', 'kmttmk', '.kkkk.'], { k: RK, W: '#fff6e0', S: '#9aa8c8', m: '#a83250', t: '#e86a80' }, { mat: 'cream', grp: 'jaw' });
    }
    if (m.fx.has('blush')) P.stamp(hx - 6, hy + 3, ['rrr'], { r: '#f28aa0' }, { on: true });
  };

  if (!back) {
    tail();
    ear(hx - 7, hy - 7, 4.2, false);
    body();
    // denim battle-vest patch on the flank, stitched on, with a tiny skull
    const px = X + 5, py = base - 18 + sq;
    P.poly([[px, py], [px + 8, py - 1], [px + 9, py + 7], [px + 1, py + 8]], 'denim', { paint: true, grp: 'patch' });
    P.stamp(px + 1, py, ['.w.w.w.', 'w......', '.......', 'w......', '.......', 'w......'], { w: '#c4dcfa' }, { onMat: 'denim' });
    P.stamp(px + 3, py + 2, ['www', 'k.k', 'www', 'w.w'], { w: '#f4f0e8', k: '#1c2858' }, { onMat: 'denim' });
    haunch();
    if (m.arm === 1) arms();                     // fists pumped up behind the head
    P.circ(hx, hy, 9, 'fur', { grp: 'head' });
    P.ell(hx - 9, hy + 3, 7, 4.4, 'fur', { grp: 'head', rot: 0.18 });
    P.ell(hx - 8, hy + 5, 6, 2.8, 'cream', { paint: true, grp: 'head' });
    P.poly([[hx + 7, hy - 1], [hx + 12, hy + 1], [hx + 8, hy + 3]], 'fur', { grp: 'head', round: 1.5 });   // scruffy nape tuft
    collar(hx + 3, hy + 9, false);
    // the mohawk: four chrome spikes, swept back
    [[-4, -6, 2.2, 6, 1], [-1, -8, 2.5, 9, 2], [3, -8, 2.6, 10, 3], [7, -6, 2.3, 8, 3]].forEach(([dx, dy, w, h, sl], k) => spike(P, hx + dx, hy + dy, w, h, sl, 'steel', 'spike' + k));
    ear(hx + 9, hy - 5, 5.2, true);
    // safety pin through the torn ear's rim, just under the bite
    P.stamp(hx + 12, hy - 4, ['S.', 'sS', 's.', 'sd', '.d'], SPK, { mat: 'steel', grp: 'pin' });
    if (m.arm !== 1) arms();
    face();
  } else {
    body();
    const px = X - 5, py = base - 15 + sq;
    P.poly([[px, py], [px + 10, py], [px + 10, py + 8], [px, py + 8]], 'denim', { paint: true, grp: 'patch' });
    P.stamp(px + 1, py + 1, ['.w.w.w.w.', 'w........', '.........', 'w........', '.........', 'w........'], { w: '#c4dcfa' }, { onMat: 'denim' });
    P.stamp(px + 3, py + 2, ['.www.', 'wkwkw', '.www.', '.w.w.'], { w: '#f4f0e8', k: '#1c2858' }, { onMat: 'denim' });
    arms();
    tail();
    ear(X - 8, hy - 7, 4.8, false, true); ear(X + 8, hy - 7, 4.8, true, true);
    P.circ(X, hy, 8.5, 'fur', { grp: 'head' });
    collar(X, hy + 9, true);
    // the mohawk from behind: the near spike up the middle, the others splaying out behind it
    spike(P, X - 3, hy - 6, 2, 7, -3, 'steel', 'spikeL'); spike(P, X + 3, hy - 6, 2, 7, 3, 'steel', 'spikeR');
    spike(P, X, hy - 5, 2.4, 10, 0, 'steel', 'spikeC');
  }
  // ---- effects
  const mx = hx - 16, my = hy + 5;
  if (m.fx.has('breath')) studSpray(P, mx, my, m);
  if (m.fx.has('toss')) { const t = m.k, x = hx - 12 - t * 30, y = hy - Math.sin(t * Math.PI) * 12; P.stamp(x - 2, y - 2, (m.ph % 2) ? ['..s..', '.sSs.', 'sSSms', '.smm.', '..d..'] : ['s...d', '.sSs.', '.SSm.', '.smm.', 's...d'], SPK, { mat: 'steel', grp: 'fly' }); }
  if (m.fx.has('dash')) FX.dash(P, X + 16, base - 14, m);
  if (m.fx.has('swipe')) FX.swipe(P, hx - 14, hy + 6);
  if (m.fx.has('hit')) FX.hit(P, X + 2, hy, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X, base - 18, 18, 17, m, '#c9d3e6');
  if (m.fx.has('cast')) for (let k = 0; k < 3; k++) { const a = m.ph * 0.4 + k * 2.1; P.stamp(X + Math.round(Math.cos(a) * 15) - 1, base - 22 + Math.round(Math.sin(a) * 8) - 1, ['.S.', 'SsS', '.d.'], SPK, { mat: 'steel', grp: 'orb' + k }); }
  if (m.fx.has('sparkle')) FX.sparkle(P, X, base - 20, m, '#e8eeff');
  if (m.fx.has('zz')) FX.zz(P, X + 6, hy - 16, m);
  if (m.fx.has('steam')) FX.steam(P, hx, hy - 16, m);
  if (m.fx.has('hearts')) FX.hearts(P, X + 12, hy - 12, m);
  if (m.fx.has('bond')) FX.aura(P, X, base - 18, 19, 18, m, '#7af0ff');
}
// chain links hanging from (x, y) upward-ish: alternating flat and edge-on links
function chain(P, x, y, n, sw, grp) {
  for (let k = 0; k < n; k++) {
    const cx = Math.round(x + sw * 0.4 * k), cy = Math.round(y - k * 3);
    if (k % 2 === 0) P.stamp(cx - 1, cy - 2, ['.s.', 'S.s', 'smd', '.d.'], SPK, { mat: 'steel', grp: grp + k });
    else P.stamp(cx, cy - 2, ['S', 's', 'd'], SPK, { mat: 'steel', grp: grp + k });
  }
}
// a wedge of cheese (Studrat's secret weakness)
function cheese(P, x, y) {
  P.poly([[x - 3, y + 3], [x + 4, y - 2], [x + 4, y + 3]], 'cheese', { grp: 'cheese', round: 1.5 });
  P.px(x + 2, y + 1, '#eaa22c'); P.px(x, y + 2, '#eaa22c');
}
// Studrat's special breath: a widening spray of steel studs and grinder sparks
function studSpray(P, x, y, m) {
  const len = 6 + m.k * 32, ph = m.ph;
  const STUD = [['.S.', 'Ssm', '.md'], ['Sm', 'md'], ['.S.', 'SSm', 'smd', '.d.']];
  for (let s = 3, k = 0; s <= len; s += 4, k++) {
    const spread = 1 + s * 0.2, yy = y + Math.round(Math.sin(k * 2.4 + ph * 0.9) * spread);
    P.stamp(x - s - 1, yy - 1, STUD[(k + ph) % 3], SPK, { mat: 'steel', grp: 'stud' + k });
  }
  for (let k = 0; k < 9; k++) {
    const s = (ph * 3 + k * 5) % Math.max(5, len | 0), yy = y + Math.round((((k * 7 + ph * 3) % 11) - 5) * (0.4 + s * 0.04));
    P.ink(x - s - 3, yy, x - s - 1, yy + (k % 2 ? 1 : -1), k % 3 === 0 ? '#ffffff' : k % 3 === 1 ? '#ffe28a' : '#ff9a3a');
  }
  // muzzle flash
  P.stamp(x - 3, y - 2, (ph % 2) ? ['..w..', '.wWw.', 'wWWWw', '.wWw.', '..w..'] : ['w...w', '.wWw.', '.WWW.', '.wWw.', 'w...w'], { w: '#ffe28a', W: '#ffffff' }, { mat: 'spark' });
}

// ================================================================== MOSHBULL
// Moshi's partner: a stocky, low-slung mosh-pit bull. Its hide is plated with craggy
// rock and its shoulders are two boulders; horns like curved stone spikes, a gold
// ring through its nose, spiked wristbands on its front hooves and a purple-dyed
// tuft of hair falling over one eye. Looks like a wrecking ball, is a big softie.
const BULL_PAL = {
  hide: { ramp: ['#b8866a', '#835a4a', '#5c3c48', '#3c2840'], line: '#1c1020', lineLit: '#4a2e40' },
  muzzle: { ramp: ['#fae6cc', '#e4be9c', '#b88a7c', '#80586c'], line: '#2a1424', lineLit: '#80586c' },
  rock: { ramp: ['#f2e6ce', '#ccb89c', '#968482', '#5e5068'], line: '#221a2c', lineLit: '#5e5068', inner: '#4a3c54' },
  horn: { ramp: ['#fff6e0', '#e2cea8', '#ac9478', '#705c66'], line: '#2a1c26', lineLit: '#705c66' },
  hoof: { ramp: ['#c4ae94', '#8e786c', '#62505e', '#403248'], line: '#140d1a', lineLit: '#403248' },
  tuft: { ramp: ['#ecc8ff', '#b486f6', '#7e58d0', '#523696'], line: '#1c1040', lineLit: '#523696' },
  band: { ramp: ['#6a5a7c', '#3c3050', '#2a2238', '#1a1424'], line: '#0c0812', lineLit: '#1a1424' },
  gold: { ramp: ['#fff6a8', '#ffd23e', '#e49a24', '#ae641c'], line: '#4a2810', lineLit: '#8a5418', gloss: true, spec: 0.9 },
  steel: STEEL,
  dust: { ramp: ['#fbf2e2', '#e0ceb4', '#b8a28e', '#8c7680'], line: '#4a3c4a', lineLit: '#8c7680' },
  flower: { ramp: ['#ffe6f0', '#ff9ac0', '#e8608e', '#b03c6c'], line: '#4a1430' },
  leaf: { ramp: ['#d2f070', '#80c64a', '#3f8e3a', '#245c2e'], line: '#16301a' },
};
const BEYE2 = {   // near eye (the far one hides under the tuft): big, soft, a heavy stone brow does the glaring
  open: ['.kkkk.', 'kWWkkk', 'kWWkkk', 'kkkkak', 'kkkaak', '.kkkk.'],
  fierce: ['......', 'kkkkk.', 'kWWkkk', 'kWkkak', '.kkkk.'],
  closed: ['......', '......', '......', 'k....k', '.kkkk.'],
  sleep: ['......', '......', '......', '......', 'kkkkkk'],
  happy: ['......', '......', '.kkkk.', 'k....k', '......'],
  hurt: ['......', 'kk....', '..kk..', '....kk', '..kk..', 'kk....'],
  ko: ['......', 'kk..kk', '.kkkk.', '..kk..', '.kkkk.', 'kk..kk'],
};
const BEYE2MAP = { k: '#1e1018', W: '#ffffff', a: '#e08a3c' };

function moshbull(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0;
  const X = 48 + m.dx, base = 77 + m.bob;
  const lean = m.lean + Math.round(tilt * 2);
  const by = base - 21 + sq + Math.round(tilt * 3);                        // body centre
  const hx = X - 19 - lean * 2, hy = base - 25 + sq + lean + Math.round(tilt * 9);   // head centre (it drops its head to charge)
  const sw = Math.sin(m.t * Math.PI * 2 * (m.clip === 'idle' ? 1 : 2));
  const st = m.step, upA = st > 0 ? 3 : 0, upB = st < 0 ? 3 : 0;            // diagonal pairs lift in turn
  const stomp = m.arm === 1 ? 6 : 0;                                          // near fore-hoof raised to stomp

  const leg = (x, y0, lift, near, grp, band, thigh) => {
    const yb = base - lift, r = near ? 5.6 : 4.8;
    if (thigh) P.ell(thigh[0], thigh[1] - lift, thigh[2], thigh[3], 'hide', { grp });
    P.tube([[x + 0.5, y0 - lift, r], [x, yb - 4, r - 0.6]], 'hide', { grp, lit: near ? 0 : -0.12 });
    P.ell(x - 0.5, yb - 2, r + 0.6, 2.6, 'hoof', { grp: grp + 'h' });
    P.px(x - 1, yb - 1, '#1c1428'); P.px(x - 1, yb - 2, '#1c1428');            // the cleft
    if (band) {
      // spiked leather wristband just above the hoof: spikes out to either side
      const wy = yb - 7;
      cone(P, x - r + 0.5, wy, x - r - 3.5, wy - 1, 1.6, 'steel', grp + 's1');
      cone(P, x + r - 0.5, wy, x + r + 3, wy - 1, 1.6, 'steel', grp + 's2');
      P.ell(x - 0.5, wy, r + 0.8, 2.4, 'band', { grp: grp + 'b' });
      for (const dx of near ? [-3, 0, 3] : [-2, 1]) P.stamp(x + dx - 1, wy - 1, ['.S', 'sd'], SPK, { on: true });
    }
  };
  // horns: thick at the root, tapering to a point, notched and chipped like hewn stone
  const horn = (pts, grp) => {
    P.tube(pts, 'horn', { grp, round: 3 });
    for (let k = 1; k < pts.length - 1; k++) {
      const [x, y, r] = pts[k], [x2, y2] = pts[k + 1], d = Math.hypot(x2 - x, y2 - y) || 1, nx = -(y2 - y) / d, ny = (x2 - x) / d;
      P.line(x + nx * (r - 0.5), y + ny * (r - 0.5), x + nx * (r - 1.6), y + ny * (r - 1.6), '#8a7068');
      P.line(x - nx * (r - 0.5), y - ny * (r - 0.5), x - nx * (r - 1.6), y - ny * (r - 1.6), '#8a7068');
    }
  };
  const ear = (x, y, dir, grp) => {
    P.ell(x, y, 4.6, 2.6, 'hide', { grp, rot: dir * 0.3 });
    P.ell(x + dir * 0.6, y + 0.4, 3, 1.3, 'muzzle', { paint: true, grp, rot: dir * 0.3, lit: -0.3 });
  };
  const tailFn = (x, y) => {
    const t = Math.round(sw * 2), tx = x + 5 + t, ty = y + 12;
    P.tube([[x, y, 1.6], [x + 4, y + 5, 1.3], [tx, ty, 1.1]], 'hide', { grp: 'tail' });
    P.poly([[tx - 2, ty - 1], [tx + 2, ty - 1], [tx + 3, ty + 3], [tx + 2, ty + 7], [tx + 1, ty + 5], [tx, ty + 8], [tx - 1, ty + 5], [tx - 2, ty + 7], [tx - 3, ty + 3]], 'tuft', { grp: 'tailtuft', round: 1.5 });
    P.px(tx - 1, ty, '#ecc8ff'); P.px(tx - 1, ty + 1, '#ecc8ff');
  };

  if (!back) {
    // ---- far side: tail, far legs
    tailFn(X + 26, by - 5);
    leg(X + 16, by + 5, upB, false, 'legFH');
    leg(X - 12, by + 4, upA, false, 'legFF', true);
    // ---- the barrel body and its stone plates along the spine and rump
    P.ell(X + 7, by, 21 + sq, 13 - sq, 'hide', { grp: 'body' });
    P.ell(X + 5, by + 8, 15, 5, 'hide', { paint: true, grp: 'body', lit: -0.15 });          // shadowed belly
    rock(P, X + 23, by - 6, 7, 6, 1, 'rock', 'plateR');
    rock(P, X + 12, by - 11, 8, 5.5, 2, 'rock', 'plateB');
    // ---- near hind leg (haunch and shin in one piece)
    leg(X + 22, by + 8, upA, true, 'legNH', false, [X + 21, by + 2, 8, 9]);
    // ---- far horn behind the head, the near front leg, the boulder shoulder
    horn([[hx - 5, hy - 7, 3.4], [hx - 11, hy - 11, 2.8], [hx - 15, hy - 16, 2.2], [hx - 16, hy - 22, 1.5], [hx - 14, hy - 26, 0.6]], 'hornF');
    leg(X - 2, by + 2, upB + stomp, true, 'legNF', true);
    rock(P, X + 1, by - 10, 13.5, 12, 3, 'rock', 'boulder', { pits: true });
    // ---- the head
    P.ell(hx, hy, 12.5, 11, 'hide', { grp: 'head', lit: 0.1 });
    ear(hx + 12, hy - 2, 1, 'earN');
    P.ell(hx - 9, hy + 6, 8.5, 6.5, 'muzzle', { grp: 'muzzle' });
    rock(P, hx + 3, hy - 7, 8, 3.4, 4, 'rock', 'brow', { crack: false, h: 0.7, facet: 0.35 });          // heavy stone brow
    horn([[hx + 6, hy - 8, 3.9], [hx + 11, hy - 13, 3.2], [hx + 12, hy - 20, 2.5], [hx + 10, hy - 26, 1.6], [hx + 6, hy - 29, 0.6]], 'hornN');
    // ---- the purple tuft falling over the far eye
    const tw = Math.round(sw * 0.6);
    P.poly([[hx - 3, hy - 12], [hx + 1, hy - 11], [hx - 2, hy - 7], [hx - 4, hy - 2 + tw], [hx - 6, hy - 5], [hx - 8, hy - 1 + tw], [hx - 9, hy - 5], [hx - 12, hy - 3], [hx - 11, hy - 8], [hx - 7, hy - 11]], 'tuft', { grp: 'tuft', round: 2.5 });
    P.line(hx - 4, hy - 9, hx - 5, hy - 5, '#7e58d0'); P.line(hx - 8, hy - 8, hx - 9, hy - 5, '#7e58d0');
    P.px(hx - 6, hy - 10, '#ecc8ff'); P.px(hx - 5, hy - 10, '#ecc8ff'); P.px(hx - 7, hy - 9, '#ecc8ff');
    // ---- face: the near eye under the brow, nostrils, nose ring, mouth
    const e = BEYE2[m.eyes] || BEYE2.open;
    P.stamp(hx + 1, hy - 3, e, BEYE2MAP, { on: true });
    const mx = hx - 9, my = hy + 6;
    P.stamp(mx - 7, my - 4, ['.nn...', 'nnn..n', '.n...n'], { n: '#6a3a50' }, { on: true });               // nostrils on the snout's front
    if (m.mouth === 0) P.stamp(mx - 3, my + 4, ['k.......', '.kkkkkkk'], { k: '#80586c' }, { on: true });
    else if (m.mouth === 1) P.stamp(mx - 4, my + 2, ['kkkkkkk', 'kmmttmk', '.kkkkk.'], { k: '#3a1828', m: '#7a2a48', t: '#f08a9a' }, { mat: 'muzzle', grp: 'jaw' });
    else P.stamp(mx - 5, my + 1, ['kkkkkkkk', 'kmmmmmmk', 'kmmttmmk', 'kmttttmk', '.kkkkkk.'], { k: '#3a1828', m: '#7a2a48', t: '#f08a9a' }, { mat: 'muzzle', grp: 'jaw' });
    // gold ring through the nose
    P.stamp(mx - 8, my - 1, ['.gGg.', 'g...G', 'g...g', 'dg.gd', '.ddd.'], { g: '#ffd23e', G: '#fff6a8', d: '#ae641c' }, { mat: 'gold', grp: 'ring' });
    if (m.fx.has('blush')) P.stamp(hx + 2, hy + 3, ['rr.rr'], { r: '#f0809a' }, { on: true });
    if (m.arm === 4) flower(P, mx - 10, my + 5, m);
  } else {
    // ---- from behind: rump and tail toward us, the head and horns beyond the boulder shoulders
    const cx = X + 2, hy2 = by - 15 + Math.round(tilt * 6);
    horn([[cx - 6, hy2 - 3, 3.4], [cx - 13, hy2 - 6, 2.8], [cx - 17, hy2 - 12, 2.2], [cx - 17, hy2 - 18, 1.4], [cx - 14, hy2 - 22, 0.6]], 'hornF');
    horn([[cx + 6, hy2 - 3, 3.4], [cx + 13, hy2 - 6, 2.8], [cx + 17, hy2 - 12, 2.2], [cx + 17, hy2 - 18, 1.4], [cx + 14, hy2 - 22, 0.6]], 'hornN');
    ear(cx - 12, hy2 + 2, -1, 'earF'); ear(cx + 12, hy2 + 2, 1, 'earN');
    P.ell(cx, hy2, 9.5, 8, 'hide', { grp: 'head' });
    P.poly([[cx - 3, hy2 - 8], [cx + 2, hy2 - 9], [cx + 4, hy2 - 4], [cx + 1, hy2 - 6], [cx - 1, hy2 - 2], [cx - 3, hy2 - 5]], 'tuft', { grp: 'tuft', round: 2 });
    leg(cx - 12, by + 4, upA, false, 'legFF', true); leg(cx + 12, by + 4, upB, false, 'legNF', true);
    rock(P, cx - 13, by - 10, 10.5, 9.5, 3, 'rock', 'boulderL', { pits: true }); rock(P, cx + 13, by - 10, 10.5, 9.5, 6, 'rock', 'boulderR', { pits: true });
    P.ell(cx, by + 2, 18 + sq, 13 - sq, 'hide', { grp: 'body' });
    rock(P, cx, by - 7, 7.5, 5, 2, 'rock', 'plateB', { crack: false });
    leg(cx - 9, by + 9, upB, true, 'legFH'); leg(cx + 9, by + 9, upA, true, 'legNH');
    tailFn(cx - 2, by + 2);
  }
  // ---- effects
  const mx = hx - 13, my = hy + 9;
  if (m.fx.has('breath')) quake(P, X - 8, base, m);
  if (m.fx.has('toss')) { const t = m.k, x = hx - 14 - t * 34, y = hy - 4 - Math.sin(t * Math.PI) * 16; rock(P, x, y, 4.5, 4, (m.ph % 3) + 1, 'rock', 'fly'); }
  if (m.fx.has('dash')) { FX.dash(P, X + 30, by - 2, m); for (let k = 0; k < 3; k++) { const t = ((m.ph + k * 4) % 12) / 12; P.circ(X + 24 + t * 12, base - 2 - t * 4, 1.5 + t * 2.5, 'dust', { grp: 'dd' + k, round: 2 }); } }
  if (m.fx.has('swipe')) FX.swipe(P, hx - 18, hy);
  if (m.fx.has('hit')) FX.hit(P, X + 4, by - 10, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X + 4, by - 2, 32, 22, m, '#e2c08a');
  if (m.fx.has('cast')) for (let k = 0; k < 3; k++) { const a = m.ph * 0.35 + k * 2.1; rock(P, X + 4 + Math.cos(a) * 26, by - 12 + Math.sin(a) * 8, 2.6, 2.4, k + 1, 'rock', 'orb' + k, { crack: false }); }
  if (m.fx.has('sparkle')) FX.sparkle(P, X + 2, by - 10, m, '#ffe0f0');
  if (m.fx.has('sparkle') || m.fx.has('hearts')) FX.hearts(P, hx + 6, hy - 26, m);
  if (m.fx.has('zz')) FX.zz(P, hx + 14, hy - 30, m);
  if (m.fx.has('steam')) FX.steam(P, mx, hy - 16, m);
  if (m.fx.has('bond')) FX.aura(P, X + 4, by - 2, 33, 23, m, '#7af0ff');
}
// a little flower, for the eat clip (Moshbull grazes like a gentleman)
function flower(P, x, y, m) {
  P.tube([[x + 2, y + 1, 0.8], [x + 4, y + 5, 0.8]], 'leaf', { grp: 'stem' });
  P.ell(x + 4, y + 4, 2, 1, 'leaf', { grp: 'stem', rot: -0.5 });
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) P.circ(x + dx, y + dy, 1.6, 'flower', { grp: 'petal' });
  P.stamp(x, y, ['y'], { y: '#ffe060' }, { on: true });
}
// Moshbull's special breath: it stamps and a shockwave of rock chunks and dust rolls out along the ground
function quake(P, x, y, m) {
  const len = 6 + m.k * 34, ph = m.ph;
  // the ground splits under the shockwave
  for (let s = 0; s < len; s += 2) P.dot(x - s, y + (s % 6 < 3 ? 0 : -1), s % 4 ? '#5c5064' : '#3c3046', 'ink');
  // pebbles thrown up along the wave front, falling back behind it
  for (let k = 0; k < 7; k++) {
    const s = Math.min(len, ((ph * 2 + k * 6) % Math.max(6, len | 0))), h = Math.sin((s / Math.max(6, len)) * Math.PI) * (6 + (k % 3) * 4);
    rock(P, x - s - 2, y - 2 - h, 1.6 + (k % 3) * 0.7, 1.4 + (k % 2) * 0.6, k + 1, 'rock', 'peb' + k, { crack: false, n: 6, round: 1.5 });
  }
  // dust rolling at the front
  for (let k = 0; k < 4; k++) { const s = len - k * 6; if (s < 2) continue; const r = 2.4 + k * 0.8 + ((ph + k) % 3) * 0.4; P.circ(x - s - 2, y - r + 1, r, 'dust', { grp: 'dust' + k, round: 2.5 }); }
}

// ================================================================== THRASHARK
// Riff's partner: a shark that walks on stubby fin-legs. Its dorsal fin is a circular
// steel sawblade that never stops spinning, its lower jaw is a riveted steel plate,
// and thrash-metal lightning zig-zags down both flanks. Mean little eyes, rows of teeth.
const SHARK_PAL = {
  skin: { ramp: ['#92c8f2', '#5686ce', '#3a54a2', '#2c3272'], line: '#0e1232', lineLit: '#2c3272' },
  belly: { ramp: ['#ffffff', '#e2eaf6', '#aebad8', '#7a80aa'], line: '#161a3e', lineLit: '#4a5080' },
  fin: { ramp: ['#7ab0ea', '#4a74c0', '#334a96', '#262c66'], line: '#0e1232', lineLit: '#262c66' },
  bolt: { ramp: ['#fffbd0', '#ffe45a', '#f2b22c', '#c07a22'], line: '#3a2410' },
  steel: STEEL,
  saw: { ramp: ['#f4f8ff', '#c2cce2', '#8492b4', '#4e5680'], line: '#151830', lineLit: '#3e4468', th: [0.7, 0.42, 0.12] },
  gum: { ramp: ['#ff8aa0', '#d8466a', '#9a2650', '#5a1434'], line: '#2a0818' },
  fish: { ramp: ['#fff0b0', '#ffc850', '#e88a2c', '#b0562a'], line: '#40200e' },
};
const SEYE2 = {   // small, mean eyes under a hard brow
  open: [['kkkk..', '.kkkkk', '.kWrk.', '..kk..'], ['kk.', 'kWk', '.k.']],
  fierce: [['kk....', '.kkkkk', '..kWrk', '...kk.'], ['k..', 'kkk', '.Wk']],
  closed: [['kkkk..', '.kkkkk', '......', '......'], ['kk.', '.kk', '...']],
  sleep: [['......', '.kkkkk', '......'], ['...', 'kkk']],
  happy: [['......', '..kkk.', '.k...k'], ['...', '.k.', 'k.k']],
  hurt: [['k.....', '.kk...', '...kk.', '.kk...'], ['..k', 'kk.', '..k']],
  ko: [['.k..k.', '..kk..', '..kk..', '.k..k.'], ['k.k', '.k.', 'k.k']],
};
const SEYE2MAP = { k: '#0c0a1c', W: '#ffffff', r: '#ff3a4a' };

// a zig-zag lightning band from (x0, y0) to (x1, y1): a thick sawtooth stroke, tapering at both ends
function zigzag(x0, y0, x1, y1, amp, per, th) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1, dx = (x1 - x0) / len, dy = (y1 - y0) / len;
  return (x, y) => {
    const u = (x - x0) * dx + (y - y0) * dy, v = -(x - x0) * dy + (y - y0) * dx;
    if (u < 0 || u > len) return false;
    const f = (u / per) % 1, tri = (f < 0.5 ? f * 4 - 1 : 3 - f * 4) * amp, taper = Math.min(1, u / 3, (len - u) / 5);
    return Math.abs(v - tri) <= th * 0.5 * taper + 0.15;
  };
}

function thrashark(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0;
  const X = 48 + m.dx, base = 77 + m.bob;
  const lean = m.lean + Math.round(tilt * 2);
  const by = base - 21 + sq + Math.round(tilt * 7);                         // body axis
  const hx = X - 14 - lean * 2, hy = by - 1 + lean;                          // head centre
  const sw = Math.sin(m.t * Math.PI * 2 * (m.clip === 'idle' ? 1 : 2));
  const fast = m.clip === 'dash' || m.clip === 'attack' || m.clip === 'run' || m.clip === 'breath';
  const spin = m.ph * (fast ? 0.9 : 0.45);                                   // the saw never stops
  const st = m.step, upA = st > 0 ? 3 : 0, upB = st < 0 ? 3 : 0;
  const finUp = m.arm === 1 ? 6 : m.arm === 2 ? 3 : 0;

  // ---- the sawblade: one hook-toothed disc. The teeth, slots and hub turn with m.ph; the brushed
  // sheen (bright toward the light and its opposite, dark across) stays put, so it reads as spinning
  const saw = (cx, cy, r, edge) => {
    const N = 11, step = (Math.PI * 2) / N, rx = edge ? Math.max(3, r * 0.3) : r, pts = [];
    for (let k = 0; k < N; k++) {
      const a = spin + k * step;
      pts.push([cx + Math.cos(a) * (rx - 0.5), cy + Math.sin(a) * (r - 0.5)]);                          // gullet
      pts.push([cx + Math.cos(a + step * 0.62) * (rx + (edge ? 1.5 : 3.6)), cy + Math.sin(a + step * 0.62) * (r + 3.6)]);   // hooked tip
      pts.push([cx + Math.cos(a + step * 0.8) * (rx + 0.6), cy + Math.sin(a + step * 0.8) * (r + 0.6)]);
    }
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const sheen = (x, y) => { const a = Math.atan2(y - cy, (x - cx) * (edge ? 3 : 1)), d = Math.hypot((x - cx) / rx, (y - cy) / r); return d > 1.02 ? 0.62 : 0.5 + 0.3 * Math.cos(2 * (a + 2.25)) - d * 0.08; };
    P.shape(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (x, y) => inPoly(pts, x, y), 'saw', { grp: 'saw', heat: sheen }, () => [0, 0, 1]);
    if (edge) return;
    // a lit lip on each tooth's leading edge
    for (let k = 0; k < N; k++) { const a = spin + k * step + step * 0.5; P.px(cx + Math.cos(a) * (r + 1.6), cy + Math.sin(a) * (r + 1.6), '#f4f8ff'); }
    // three slots and the hub with its bolt, turning with the blade
    for (let k = 0; k < 3; k++) {
      const a = spin + k * (Math.PI * 2 / 3);
      P.line(cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.45, cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72, '#3e4468');
    }
    P.circ(cx, cy, 2.6, 'steel', { grp: 'hub' });
    const ba = spin + 0.8; P.px(cx + Math.round(Math.cos(ba)), cy + Math.round(Math.sin(ba)), '#2a2e50'); P.px(cx - Math.round(Math.cos(ba)), cy - Math.round(Math.sin(ba)), '#2a2e50');
  };
  const finLeg = (x, y, lift, near, grp) => {
    // a stubby paddle fin, bent at the ground into a forward-pointing foot with a pale tip
    const yb = base - lift;
    P.poly([[x - 4, y - 2], [x + 5, y - 2], [x + 4, yb - 5], [x + 2, yb - 1], [x - 3, yb], [x - 8, yb - 1], [x - 6, yb - 3], [x - 3, yb - 6]], 'fin', { grp, round: 2, lit: near ? 0.05 : -0.15 });
    P.shape(x - 9, yb - 3, x + 3, yb, (px, py) => py > yb - 2.6 + (px - x) * 0.2, 'belly', { paint: true, grp, clip: grp, lit: near ? 0 : -0.2 });
    P.line(x - 1, yb - 7, x - 4, yb - 3, near ? '#7ab0ea' : '#4a74c0'); P.line(x + 2, yb - 6, x, yb - 3, near ? '#7ab0ea' : '#4a74c0');
  };
  const tailFin = (x, y, edge) => {
    const t = Math.round(sw * 2);
    if (edge) { P.poly([[x - 2, y + 1], [x - 1 + t, y - 13], [x + 2 + t, y - 12], [x + 2, y + 1], [x + 2 - t, y + 8], [x - 1 - t, y + 7]], 'fin', { grp: 'tailfin', round: 2 }); return; }
    P.poly([[x - 2, y - 2], [x + 6 + t, y - 13], [x + 11 + t, y - 22], [x + 10 + t, y - 12], [x + 6, y - 2], [x + 10 - t, y + 7], [x + 8 - t, y + 10], [x + 1, y + 3]], 'fin', { grp: 'tailfin', round: 2.5 });
  };

  if (!back) {
    // ---- far legs, tail, the saw (rising out of the back)
    finLeg(hx + 2, by + 8, upB + Math.round(finUp * 0.7), false, 'legFF');
    finLeg(X + 13, by + 8, upA, false, 'legFH');
    tailFin(X + 30, by - 4);
    saw(X + 4, by - 19, 10, false);
    // ---- the body: torpedo with a white underside, gills, lightning
    P.tube([[hx + 4, by, 12], [X + 8, by, 11.5], [X + 20, by - 1, 8], [X + 30, by - 3, 3.5]], 'skin', { grp: 'body', round: 6 });
    P.ell(hx, hy, 14, 12.5, 'skin', { grp: 'body' });
    P.shape(hx - 6, by - 2, X + 32, by + 14, (x, y) => y > by + 4 + (x - X) * 0.06 && x > hx - 5, 'belly', { paint: true, grp: 'body', clip: 'body' });
    // thrash-metal lightning down the flank: one long zig-zag, a short one behind it
    P.shape(X - 2, by - 10, X + 22, by + 2, zigzag(X - 1, by - 3, X + 21, by - 5, 2.4, 7, 2.6), 'bolt', { paint: true, grp: 'bolt', clip: 'body' });
    P.shape(X + 18, by - 10, X + 30, by, zigzag(X + 19, by - 6, X + 28, by - 6, 1.5, 5, 1.6), 'bolt', { paint: true, grp: 'bolt', clip: 'body' });
    // gills
    for (const k of [0, 3, 6]) { P.line(hx + 10 + k, hy - 3, hx + 9 + k, hy + 2, '#1c2050'); P.line(hx + 11 + k, hy - 2, hx + 10 + k, hy + 2, '#7ab0ea'); }
    // ---- near fin-legs
    finLeg(X + 17, by + 9, upB, true, 'legNH');
    finLeg(hx + 9, by + 9, upA + finUp, true, 'legNF');
    // ---- the face: brow, eye, the grin full of teeth, the riveted steel jaw
    const e = SEYE2[m.eyes] || SEYE2.open;
    P.stamp(hx - 4, hy - 7, e[0], SEYE2MAP, { on: true });
    P.stamp(hx - 12, hy - 6, e[1], SEYE2MAP, { on: true });
    const op = m.mouth === 2 ? 4 : m.mouth === 1 ? 2 : 0;          // how far the steel jaw drops
    const mx = hx - 14, my = hy + 2;
    // the slit of the grin (dark gums), rising toward the cheek
    P.shape(mx - 1, my - 2, mx + 19, my + 3 + op, (x, y) => x > mx - 0.5 + (y - my) * 0.3 && x < mx + 19 - (y - my) * 0.5 && y > my - 1 - (x - mx) * 0.06 && y < my + 2 + op - (x - mx) * 0.06, 'gum', { grp: 'maw', flat: true, light: op ? 0.2 : 0.05 });
    // the riveted steel jaw plate
    P.poly([[mx - 1, my + 1 + op], [mx + 6, my + 2 + op], [mx + 14, my + 1 + op], [mx + 19, my - 1 + op], [mx + 18, my + 5 + op], [mx + 11, my + 8 + op], [mx + 3, my + 7 + op], [mx - 1, my + 4 + op]], 'saw', { grp: 'jaw', round: 2.5, lit: -0.12 });
    P.line(mx + 1, my + 5 + op, mx + 15, my + 4 + op, '#4e5680');
    for (const rx of [2, 7, 12, 16]) P.stamp(mx + rx, my + 3 + op + (rx > 14 ? -1 : 0), ['S', 'd'], SPK, { on: true });   // rivets
    // teeth: an upper row hanging from the lip and a lower row standing on the steel jaw
    for (let k = 0; k < 6; k++) P.stamp(mx + k * 3, my - 1 - Math.round(k * 0.2), ['WWw', '.W.'], { W: '#ffffff', w: '#c8d0e8' }, { mat: 'belly', grp: 'teethU' });
    for (let k = 0; k < 5; k++) P.stamp(mx + 1 + k * 3, my + op - Math.round(k * 0.2), ['.W.', 'WWw'], { W: '#ffffff', w: '#c8d0e8' }, { mat: 'belly', grp: 'teethL' });
    if (m.arm === 4) fishSnack(P, mx - 2, my + 1 + op, m);
    if (m.fx.has('blush')) P.stamp(hx + 1, hy + 0, ['rr.r'], { r: '#ff8aa8' }, { on: true });
  } else {
    // ---- from behind: the back narrows toward us into the tail stalk, the saw nearly edge-on up the
    // spine, fin-legs splayed out to either side
    const cx = X + 1, b2 = by + 4;
    const sideFin = (x, y, lift, dir, grp, near) => {
      // a flipper splayed outward and down, pressing on the ground
      const yb = base - lift;
      P.poly([[x - dir * 3, y - 1], [x + dir * 3, y - 2], [x + dir * 9, yb - 2], [x + dir * 8, yb], [x - dir * 3, yb]], 'fin', { grp, round: 2, lit: near ? 0 : -0.15 });
      P.shape(x - 10, yb - 3, x + 10, yb, (px, py) => py > yb - 2.2, 'belly', { paint: true, grp, clip: grp, lit: near ? 0 : -0.2 });
      P.line(x + dir * 1, y + 1, x + dir * 5, yb - 2, near ? '#7ab0ea' : '#4a74c0');
    };
    sideFin(cx - 12, b2 - 1, upA, -1, 'legFF'); sideFin(cx + 12, b2 - 1, upB, 1, 'legNF');
    saw(cx, b2 - 18, 11, true);
    P.ell(cx, b2 - 3, 15, 11.5, 'skin', { grp: 'body' });
    P.tube([[cx, b2, 10], [cx, b2 + 7, 5]], 'skin', { grp: 'body', round: 5 });
    P.shape(cx - 16, b2, cx + 16, b2 + 12, (x, y) => y > b2 + 3 + Math.abs(x - cx) * 0.05 && Math.abs(x - cx) > 5, 'belly', { paint: true, grp: 'body', clip: 'body' });
    P.shape(cx - 16, b2 - 11, cx - 6, b2 + 4, zigzag(cx - 13, b2 - 9, cx - 10, b2 + 2, 1.4, 4.5, 1.8), 'bolt', { paint: true, grp: 'bolt', clip: 'body' });
    P.shape(cx + 6, b2 - 11, cx + 16, b2 + 4, zigzag(cx + 12, b2 - 6, cx + 9, b2 + 4, 1.4, 4.5, 1.8), 'bolt', { paint: true, grp: 'bolt', clip: 'body' });
    sideFin(cx - 7, b2 + 6, upB, -1, 'legFH', true); sideFin(cx + 7, b2 + 6, upA, 1, 'legNH', true);
    tailFin(cx, b2 + 7, true);
  }
  // ---- effects
  const mx = hx - 15, my = hy + 3;
  if (m.fx.has('breath')) FX.breath(P, mx, my, m, 'water');
  if (m.fx.has('toss')) { const t = m.k, x = hx - 14 - t * 34, y = hy - 6 - Math.sin(t * Math.PI) * 14; for (let k = 0; k < 6; k++) { const a = m.ph * 0.8 + k * 1.05; cone(P, x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, x + Math.cos(a + 0.5) * 5, y + Math.sin(a + 0.5) * 5, 1.3, 'saw', 'ft' + k); } P.circ(x, y, 3.2, 'saw', { grp: 'fly', flat: true, light: 0.55 }); P.dot(x, y, '#4e5680'); P.dot(x - 1, y - 1, '#ffffff'); }
  if (m.fx.has('dash')) { FX.dash(P, X + 32, by - 2, m); for (let k = 0; k < 3; k++) FX.bubble(P, X + 34 + ((m.ph * 2 + k * 5) % 12), by - 6 + k * 5, 1 + (k % 2)); }
  if (m.fx.has('swipe')) FX.swipe(P, hx - 18, hy);
  if (m.fx.has('hit')) FX.hit(P, X + 2, by - 10, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X + 6, by - 6, 32, 22, m, '#7ad0ff');
  if (m.fx.has('cast')) for (let k = 0; k < 4; k++) { const a = m.ph * 0.3 + k * 1.57; FX.bubble(P, X + 6 + Math.cos(a) * 28, by - 10 + Math.sin(a) * 10, 2); }
  if (m.fx.has('sparkle')) FX.sparkle(P, X + 4, by - 12, m, '#c8f0ff');
  if (m.fx.has('zz')) FX.zz(P, X + 18, by - 34, m);
  if (m.fx.has('steam')) FX.steam(P, hx - 6, hy - 14, m);
  if (m.fx.has('hearts')) FX.hearts(P, X + 18, by - 30, m);
  if (m.fx.has('bond')) FX.aura(P, X + 6, by - 6, 33, 23, m, '#7af0ff');
}
// a little fish, crunched in the eat clip
function fishSnack(P, x, y, m) {
  P.ell(x, y, 3.6, 2.2, 'fish', { grp: 'fishb' });
  P.poly([[x + 3, y], [x + 6, y - 3], [x + 6, y + 3]], 'fish', { grp: 'fisht', round: 1 });
  P.dot(x - 2, y - 1, '#0c0a1c', 'fish');
}

export const SPRITES = {
  studrat: { id: 'studrat', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: RAT_PAL, draw: studrat },
  moshbull: { id: 'moshbull', kind: 'pix', w: 96, h: 84, anchor: [48, 78], pal: BULL_PAL, draw: moshbull },
  thrashark: { id: 'thrashark', kind: 'pix', w: 96, h: 84, anchor: [48, 78], pal: SHARK_PAL, draw: thrashark },
};
