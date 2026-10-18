// Props for the Osaka Castle Park scene (HD-2D pixel art, light from the upper
// left). Ground painters take a Pen and paint in place; sprite builders return
// { surf, ax, ay } anchored at the ground contact, like props.js.
import { Pen, C, newSurf, shift, mix } from './paint.js';
import { noise2 } from './surface.js';

// park palette: castle study colours (docs/refs/environments.md) + warm greens
export const K = {
  sky0: '#6fa8d8', sky1: '#8cc0e4', sky2: '#b4d8ec', sky3: '#d8eaee', sky4: '#eef0e2',
  cloud: '#fdf8ee', cloud1: '#eeeaf0', cloud2: '#d6d4e6', cloud3: '#b8b8d4',
  pl: '#f3f1ea', pl1: '#dcdde0', pl2: '#bfc4cf', pl3: '#9aa0b4',
  cu0: '#b6dccb', cu1: '#8cc0ab', cu: '#6fa592', cu2: '#4f8676', cu3: '#365e58', cu4: '#243c40',
  gold: '#d8a83a', goldL: '#ffe48c', gold2: '#a0701e', gold3: '#6e4a1c',
  blk: '#2a2632', blk2: '#3c3846',
  st0: '#ddd5c4', st1: '#c8bfae', st2: '#b5ac9a', st3: '#a29886', st4: '#887e70', st5: '#6c6358', joint: '#4e4740',
  w0: '#7cae9c', w1: '#5f9486', w2: '#4a7c74', w3: '#3a6662', w4: '#2c5052', wH: '#c4e4d8',
  g0: '#b4cc68', g1: '#94b456', g2: '#7a9c4a', g3: '#5f8442', g4: '#47683e', g5: '#344e3a',
  gr0: '#eee2c4', gr1: '#ddcca8', gr2: '#ccb994', gr3: '#b4a07c', gr4: '#937f66',
  d0: '#e2bf92', d1: '#cfa676', d2: '#b68b60', d3: '#94704e', d4: '#6e5040',
  sk0: '#fff2f4', sk1: '#ffd0dc', sk2: '#f6a8c0', sk3: '#dc84a4', sk4: '#ae6286', sk5: '#7e4a6c',
  bark: '#5a4238', bark1: '#7a5a48', bark2: '#3e2e2e', barkL: '#9a7a62',
  lf0: '#c8dc78', lf1: '#9cc05e', lf2: '#76a04c', lf3: '#557e44', lf4: '#3c5c3e', lf5: '#2a4036',
  pn0: '#9ab866', pn1: '#6e9450', pn2: '#4c7046', pn3: '#34503e', pn4: '#243832',
  straw0: '#f6e2a0', straw1: '#e2c474', straw2: '#c4a052', straw3: '#967638', straw4: '#6a5230',
  verm: '#dc4e30', verm2: '#aa3428', vermL: '#f47a52', vermD: '#7a2630',
  wood0: '#c89468', wood1: '#a87450', wood: '#8a5a3e', wood2: '#6a4232', wood3: '#4a2e2a',
  rub: '#4a4652', rub1: '#5e5a68', rub2: '#34303c', rub3: '#22202a',
  holo: '#5af0e0', holo2: '#2ab0c8', holoL: '#c8fff4',
};

export function sprite(w, h, ax, ay, fn, seed = 3) { const s = newSurf(w, h), p = new Pen(s, seed); fn(p); return { surf: s, ax, ay }; }
const R = Math.round;
const opaque = (s, x, y) => x >= 0 && y >= 0 && x < s.w && y < s.h && (s.data[y * s.w + x] >>> 24) > 0;

// selective outline: a dark line only on the shadow side (right / bottom) of a silhouette,
// optional lighter line on the lit side
export function selout(p, c, cLit = null) {
  const s = p.s, W = s.w, H = s.h, src = new Uint32Array(s.data), a = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (src[y * W + x] >>> 24) > 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (a(x, y)) continue;
    if (a(x - 1, y) || a(x, y - 1)) p.px(x, y, c); else if (cLit && (a(x + 1, y) || a(x, y + 1))) p.px(x, y, cLit);
  }
}

// ------------------------------------------------------------------ foliage
// canopy of leaf clumps: each clump is a lobed disc lit from the upper left, plus one
// canopy-wide light term, with a dark scallop on each clump's lower-right rim.
// ramp = [rim, dark, mid, light, hi]
export function canopy(p, clumps, ramp, o = {}) {
  const [rim, dk, md, lt, hi] = ramp, seed = o.seed || 1, tex = o.tex ?? 0.14, lob = o.lobes ?? 5;
  const gx = o.cx, gy = o.cy, GX = o.RX, GY = o.RY, bias = o.bias || 0;
  clumps.sort((a, b) => (a[1] + a[0] * 0.12) - (b[1] + b[0] * 0.12));
  for (const [cx, cy, r, ph = 0] of clumps) {
    const r2 = Math.ceil(r * 1.25);
    for (let j = -r2; j <= r2; j++) for (let i = -r2; i <= r2; i++) {
      const d = Math.hypot(i, j), th = Math.atan2(j, i);
      const Rr = r * (1 + 0.12 * Math.sin(lob * th + ph) + 0.06 * Math.sin((lob * 2 + 1) * th + ph * 1.7));
      if (d > Rr) continue;
      const X = R(cx + i), Y = R(cy + j);
      const nx = i / Rr, ny = j / Rr, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const l = -0.5 * nx - 0.62 * ny + 0.42 * nz;
      const g = -((X - gx) / GX * 0.42 + (Y - gy) / GY * 0.62);
      const t = l * 0.72 + g * 0.5 + (noise2(X / 2.3, Y / 2.1, seed) - 0.5) * tex * 2 + bias;
      let c = t > 0.8 ? hi : t > 0.44 ? lt : t > 0.04 ? md : dk;
      if (d > Rr - 1.4 && nx * 0.55 + ny * 0.85 > 0.35) c = t > 0.5 ? md : rim;
      p.px(X, Y, c);
    }
  }
}
// tapered trunk with root flare and bark streaks; cols = [lit, mid, dark, line]
export function trunk(p, cx, top, base, w0, w1, cols, o = {}) {
  const [L, M, D, Ln] = cols, lean = o.lean || 0;
  for (let y = R(top); y <= base; y++) {
    const t = (y - top) / Math.max(1, base - top), flare = Math.pow(Math.max(0, (t - 0.8) / 0.2), 2) * (o.flare ?? 4);
    const hw = w0 + (w1 - w0) * t + flare, x0 = cx + lean * (1 - t) * (base - top);
    for (let x = R(x0 - hw); x <= R(x0 + hw); x++) { const u = (x - (x0 - hw)) / (2 * hw); p.px(x, y, u < 0.28 ? L : u < 0.72 ? M : D); }
  }
  const n = Math.round((base - top) * (w0 + w1) / 6);
  for (let k = 0; k < n; k++) { const t = p.r(), y = R(top + t * (base - top)); const hw = w0 + (w1 - w0) * t, x0 = cx + lean * (1 - t) * (base - top); const x = R(x0 + p.rand(-hw * 0.6, hw * 0.8)); p.vl(x, y, Math.min(base, y + p.ri(2, 5)), Ln); }
}
const LEAF = [K.lf4, K.lf3, K.lf2, K.lf1, K.lf0];
const LEAF_DEEP = ['#2e4a3c', '#3e6040', '#56804a', '#78a456', '#a8c86a'];
const SAKURA = [K.sk4, K.sk3, K.sk2, K.sk1, K.sk0];
const BARK = [K.barkL, K.bark1, K.bark, K.bark2];

// big leafy park tree (camphor / zelkova)
export function leafyTree(o = {}) {
  const W = o.w || 96, H = o.h || 118, seed = o.seed || 5, ramp = o.ramp || (o.deep ? LEAF_DEEP : LEAF);
  return sprite(W, H, W >> 1, H - 2, (p) => {
    const cx = W / 2, base = H - 2, ccy = H * 0.37, RX = W * 0.43, RY = H * 0.29;
    trunk(p, cx, ccy + RY * 0.2, base, 3, 5, BARK, { flare: 4 });
    // forks visible under the crown
    for (const [dx, dy] of [[-0.55, -0.15], [0.5, -0.1], [-0.2, -0.5], [0.3, -0.45]]) { p.line(R(cx), R(ccy + RY * 0.55), R(cx + dx * RX), R(ccy + dy * RY), K.bark2); p.line(R(cx) - 1, R(ccy + RY * 0.55), R(cx + dx * RX) - 1, R(ccy + dy * RY), K.bark); }
    const cl = [];
    const n = o.n || 34;
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + p.rand(-0.2, 0.2), rr = k % 3 === 0 ? p.rand(0, 0.45) : p.rand(0.55, 0.82); cl.push([cx + Math.cos(a) * rr * RX, ccy + Math.sin(a) * rr * RY * (Math.sin(a) > 0 ? 0.85 : 1.05), p.rand(0.2, 0.3) * W * (o.clump || 1), p.rand(0, 6)]); }
    canopy(p, cl, ramp, { cx, cy: ccy, RX, RY, seed });
    // sun-flecks of bright leaves on the lit shoulder
    for (let k = 0; k < 16; k++) { const a = p.rand(Math.PI * 1.05, Math.PI * 1.55), rr = p.rand(0.45, 0.8); const x = R(cx + Math.cos(a) * rr * RX), y = R(ccy + Math.sin(a) * rr * RY); if (opaque(p.s, x, y)) { p.px(x, y, ramp[4]); if (p.chance(0.5)) p.px(x + 1, y, ramp[4]); } }
    selout(p, mix(ramp[0], C.ink, 0.35));
  }, seed);
}
// cherry tree in bloom: leaning forked trunk, spreading branches, airy pink crown
export function sakura(o = {}) {
  const W = o.w || 100, H = o.h || 104, seed = o.seed || 7, lean = o.lean ?? 0.06;
  return sprite(W, H, R(W / 2), H - 2, (p) => {
    const cx = W / 2, base = H - 2, ccy = H * 0.36, RX = W * 0.46, RY = H * 0.26;
    const fork = ccy + RY * 0.75;
    trunk(p, cx, fork, base, 3, 4.5, ['#8a6a60', '#5e463e', '#40302e', '#2e2228'], { flare: 3, lean });
    // lenticels: short light dashes across the bark
    for (let y = R(fork) + 3; y < base - 3; y += 4) { const x0 = R(cx + lean * (1 - (y - fork) / (base - fork)) * (base - fork)); p.hl(x0 - 2, x0, y, '#9a7e70'); }
    const tips = [];
    const nb = o.branches || 6;
    for (let k = 0; k < nb; k++) {
      const a = Math.PI * (1.08 + (k / (nb - 1)) * 0.84) + p.rand(-0.08, 0.08), L = p.rand(0.7, 1.0);
      const ex = cx + Math.cos(a) * RX * L, ey = ccy + Math.sin(a) * RY * L * 1.2 + RY * 0.3;
      const mx = (cx + ex) / 2 + p.rand(-4, 4), my = (fork + ey) / 2 - p.rand(2, 6);
      for (const [x0, y0, x1, y1, w] of [[cx, fork, mx, my, 2], [mx, my, ex, ey, 1]]) { p.line(R(x0), R(y0), R(x1), R(y1), '#40302e'); if (w > 1) p.line(R(x0) - 1, R(y0), R(x1) - 1, R(y1), '#5e463e'); }
      tips.push([ex, ey], [mx, my]);
    }
    const cl = [];
    for (const [tx, ty] of tips) for (let j = 0; j < 3; j++) cl.push([tx + p.rand(-7, 7), ty + p.rand(-6, 3), p.rand(0.11, 0.17) * W, p.rand(0, 6)]);
    for (let k = 0; k < 8; k++) cl.push([cx + p.rand(-0.5, 0.5) * RX, ccy + p.rand(-0.7, 0.2) * RY, p.rand(0.13, 0.19) * W, p.rand(0, 6)]);
    canopy(p, cl, SAKURA, { cx, cy: ccy, RX, RY, seed, tex: 0.2, lobes: 7 });
    // dark twigs showing through the bloom + white petal sparkle
    for (const [tx, ty] of tips.slice(0, 6)) { const x = R(tx), y = R(ty) + 3; if (opaque(p.s, x, y)) { p.px(x, y, K.sk5); p.px(x + 1, y + 1, K.sk5); } }
    for (let k = 0; k < 26; k++) { const x = R(cx + p.rand(-RX, RX * 0.6)), y = R(ccy + p.rand(-RY, RY * 0.3)); if (opaque(p.s, x, y) && opaque(p.s, x + 1, y + 1)) p.px(x, y, '#ffffff'); }
    selout(p, '#7a4a64');
  }, seed);
}
// Japanese black pine: twisting trunk, flat cloud-pads of needles
export function pine(o = {}) {
  const W = o.w || 70, H = o.h || 80, seed = o.seed || 11, lean = o.lean ?? 0.3;
  return sprite(W, H, R(W * (o.ax ?? 0.4)), H - 2, (p) => {
    const bx = W * (o.ax ?? 0.4), base = H - 2;
    // trunk as a wiggling spine
    const spine = []; let x = bx;
    for (let y = base; y > H * 0.2; y--) { const t = (base - y) / (base - H * 0.2); x += lean * 0.9 + Math.sin(t * 5 + seed) * 0.35; spine.push([x, y, 3.2 - t * 2]); }
    for (const [sx, sy, w] of spine) for (let i = -Math.ceil(w); i <= Math.ceil(w); i++) { const u = (i + w) / (2 * w); p.px(R(sx + i), sy, u < 0.3 ? '#a07a62' : u < 0.7 ? '#7a5848' : '#4e3634'); }
    for (let k = 0; k < spine.length; k += 3) { const [sx, sy] = spine[k]; if (p.chance(0.5)) p.px(R(sx + p.rand(-1, 1)), sy, '#4e3634'); }
    // branches to pads
    const pads = [];
    const np = o.pads || 6;
    for (let k = 0; k < np; k++) {
      const t = 0.25 + (k / np) * 0.75, [sx, sy] = spine[Math.min(spine.length - 1, R(t * (spine.length - 1)))];
      const side = k % 2 ? 1 : -1, len = (1 - t * 0.6) * W * 0.32 * p.rand(0.7, 1.1);
      const ex = sx + side * len, ey = sy - p.rand(2, 7);
      p.line(R(sx), R(sy), R(ex), R(ey), '#5a4038'); p.line(R(sx), R(sy) + 1, R(ex), R(ey) + 1, '#3e2c2c');
      pads.push([ex, ey - 2, (1 - t * 0.5) * W * 0.2 * p.rand(0.8, 1.15), p.rand(3.5, 5.5)]);
    }
    const [tx, ty] = spine[spine.length - 1]; pads.push([tx, ty - 1, W * 0.13, 4.5]);
    pads.sort((a, b) => a[1] - b[1]);
    for (const [px0, py0, rx, ry] of pads) {
      for (let j = -Math.ceil(ry) - 1; j <= Math.ceil(ry) + 1; j++) for (let i = -Math.ceil(rx) - 1; i <= Math.ceil(rx) + 1; i++) {
        const e = (i * i) / (rx * rx) + (j * j) / (ry * ry), wob = 0.18 * Math.sin(i * 1.3 + j) + (noise2((px0 + i) / 2, (py0 + j) / 2, seed) - 0.5) * 0.35;
        if (e > 1 + wob) continue;
        const v = -j / ry - i / rx * 0.35 + (noise2((px0 + i) / 1.8, (py0 + j) / 1.5, seed + 3) - 0.5) * 0.5;
        p.px(R(px0 + i), R(py0 + j), v > 0.75 ? K.pn0 : v > 0.15 ? K.pn1 : v > -0.45 ? K.pn2 : K.pn3);
      }
      // needle fringe hanging under the pad
      for (let i = -Math.floor(rx) + 1; i < rx - 1; i += 2) { const yb = R(py0 + ry * Math.sqrt(Math.max(0, 1 - (i * i) / (rx * rx)))); p.px(R(px0 + i), yb + 1, K.pn4); if (p.chance(0.4)) p.px(R(px0 + i), yb + 2, K.pn4); }
      for (let i = -Math.floor(rx) + 2; i < rx - 2; i += 3) { const yt = R(py0 - ry * Math.sqrt(Math.max(0, 1 - (i * i) / (rx * rx)))); p.px(R(px0 + i), yt, '#b8d080'); }
    }
    selout(p, K.pn4);
  }, seed);
}
// clipped azalea / box shrub with optional flowers
export function shrub(o = {}) {
  const W = o.w || 30, H = o.h || 18, seed = o.seed || 4, ramp = o.ramp || ['#2e4a3c', '#3e6644', '#5a8a4c', '#7eaa58', '#a8c870'];
  return sprite(W, H, W >> 1, H - 1, (p) => {
    const cl = [];
    const n = Math.max(3, Math.round(W / 7));
    for (let k = 0; k < n; k++) cl.push([5 + (k + 0.5) * (W - 10) / n + p.rand(-1.5, 1.5), H - 7 + p.rand(-1, 1), p.rand(5, 6.5), p.rand(0, 6)]);
    for (let k = 0; k < n - 1; k++) cl.push([8 + k * (W - 16) / Math.max(1, n - 2) + p.rand(-2, 2), H - 11 + p.rand(-1, 1), p.rand(4.5, 6), p.rand(0, 6)]);
    canopy(p, cl, ramp, { cx: W / 2, cy: H * 0.55, RX: W / 2, RY: H / 2, seed, tex: 0.12, lobes: 6 });
    // flat contact at the base
    for (let x = 2; x < W - 2; x++) if (opaque(p.s, x, H - 3)) { p.px(x, H - 2, ramp[0]); }
    if (o.flowers) { const f = o.flowers; for (let k = 0; k < W * H / 16; k++) { const x = p.ri(2, W - 3), y = p.ri(2, H - 5); if (opaque(p.s, x, y) && opaque(p.s, x + 1, y + 1)) { p.px(x, y, f); if (p.chance(0.5)) p.px(x + 1, y, shift(f, 0.8)); p.px(x, y + 1, shift(f, -1)); } } }
    selout(p, ramp[0]);
  }, seed);
}
// tall grass / iris clump at a pond edge
export function reeds(o = {}) {
  const W = o.w || 14, H = o.h || 16, seed = o.seed || 2;
  return sprite(W, H, W >> 1, H - 1, (p) => {
    for (let k = 0; k < W; k++) { const x0 = p.ri(2, W - 3), L = p.ri(5, H - 2), lean = p.rand(-0.35, 0.35); for (let j = 0; j < L; j++) p.px(R(x0 + lean * j), H - 1 - j, j > L - 3 ? '#9cc06a' : k % 3 ? K.g3 : K.g4); }
    if (o.iris) for (let k = 0; k < 3; k++) { const x = p.ri(3, W - 4), y = p.ri(2, 6); p.px(x, y, '#7a5ac8'); p.px(x + 1, y, '#9a7ae0'); p.px(x, y + 1, '#5a3a9a'); p.px(x + 1, y - 1, '#f0d060'); }
  }, seed);
}

// ------------------------------------------------------------------ ground painters
// value-noise helper: smooth field 0..1
const fbm = (x, y, s) => noise2(x / 40, y / 30, s) * 0.6 + noise2(x / 12, y / 9, s + 7) * 0.3 + noise2(x / 4, y / 4, s + 13) * 0.1;

// lawn: broad patches of three greens, grass tufts in clusters, flowers in little drifts
export function lawn(p, mask, W, H, o = {}) {
  const seed = o.seed || 3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue;
    const n = fbm(x, y, seed);
    p.px(x, y, n > 0.6 ? K.g1 : n > 0.4 ? K.g2 : K.g3);
  }
  // mown stripes: faint lighter bands across the big lawns
  if (o.stripes) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!mask[y * W + x]) continue; if (((x + y * 0.35) / 14 | 0) % 2 === 0 && noise2(x / 6, y / 6, seed + 9) > 0.55) p.px(x, y, mix(p.s.get(x, y) ? K.g1 : K.g1, K.g0, 0.0)); }
  // tufts on a jittered grid; blade colour from the patch tone
  for (let gy = 2; gy < H; gy += 6) for (let gx = 2 + ((gy / 6) % 2) * 3; gx < W; gx += 7) {
    const x = gx + p.ri(-2, 2), y = gy + p.ri(-2, 2);
    if (x < 2 || y < 4 || x >= W - 2 || !mask[y * W + x]) continue;
    const n = fbm(x, y, seed);
    if (p.r() > 0.5 + (0.5 - n) * 0.6) continue;
    tuft(p, x, y, n > 0.6 ? 0 : n > 0.4 ? 1 : 2);
  }
  // clover / flower drifts
  for (let k = 0; k < (o.flowers ?? Math.round(W * H / 2600)); k++) {
    const x = p.ri(4, W - 5), y = p.ri(4, H - 5); if (!mask[y * W + x]) continue;
    const col = p.pick(o.flowerCols || ['#fbf6ea', '#fbf6ea', '#f6d860', '#f4b4c8', '#c8b4f0']);
    for (let i = 0; i < p.ri(3, 7); i++) { const fx = x + p.ri(-5, 5), fy = y + p.ri(-3, 3); if (!mask[fy * W + fx]) continue; p.px(fx, fy + 1, K.g4); p.px(fx, fy, col); if (col === '#fbf6ea' && p.chance(0.5)) p.px(fx + 1, fy, col); }
  }
}
export function tuft(p, x, y, tone = 1) {
  const blade = [K.g1, K.g2, K.g3][tone], dark = [K.g3, K.g4, K.g5][tone], tip = [K.g0, K.g1, K.g2][tone];
  const n = p.ri(2, 4), spread = n + 1;
  for (let k = 0; k < n; k++) {
    const bx = x - (spread >> 1) + R(k * spread / Math.max(1, n - 1)), h = p.ri(2, 3), lean = k < n / 2 ? -1 : 1;
    for (let j = 0; j < h; j++) p.px(bx + (j === h - 1 && h > 2 ? lean : 0), y - j, j === h - 1 ? (k === 0 ? tip : blade) : dark);
  }
  p.px(x, y + 1, dark);
}
// gravel (masa-do) on a mask: worn centre, darker kerbs, sparse pebbles, edge tufts
export function gravel(p, mask, W, H, o = {}) {
  const seed = o.seed || 5, base = o.cols || [K.gr0, K.gr1, K.gr2, K.gr3, K.gr4];
  const edge = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; if (!mask[Y * W + X]) return true; } return false; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue;
    const n = fbm(x * 1.4, y * 1.4, seed);
    let c = n > 0.62 ? base[0] : n > 0.36 ? base[1] : base[2];
    if (edge(x, y, 1)) c = base[3]; else if (edge(x, y, 3)) c = n > 0.5 ? base[1] : base[2];
    p.px(x, y, c);
  }
  for (let gy = 1; gy < H; gy += 4) for (let gx = 1 + (gy % 8 ? 2 : 0); gx < W; gx += 5) {
    const x = gx + p.ri(-1, 1), y = gy + p.ri(-1, 1); if (x < 1 || y < 1 || x >= W - 2 || y >= H - 2 || !mask[y * W + x] || !mask[(y + 1) * W + x + 1]) continue;
    const r = p.r();
    if (r < 0.2) { p.px(x, y, base[0]); p.px(x, y + 1, base[3]); }
    else if (r < 0.27) { p.px(x, y, '#f8f0dc'); p.px(x + 1, y, base[0]); p.px(x, y + 1, base[3]); p.px(x + 1, y + 1, base[4]); }
    else if (r < 0.33) p.px(x, y, base[2]);
  }
  // grass creeping in along the edges
  for (let y = 2; y < H - 1; y += 2) for (let x = 2; x < W - 2; x += 3) { if (!mask[y * W + x] || !edge(x, y, 2) || p.r() > 0.22) continue; tuft(p, x + p.ri(-1, 1), y, 1); }
}
// packed earth with raked arcs around a centre
export function packedDirt(p, mask, W, H, o = {}) {
  const seed = o.seed || 9, [cx, cy] = o.centre || [W / 2, H / 2];
  const edge = (x, y, r) => { for (let j = -r; j <= r; j += r) for (let i = -r; i <= r; i += r) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= W || Y >= H || !mask[Y * W + X]) return true; } return false; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue;
    const n = fbm(x * 1.3, y * 1.3, seed);
    let c = n > 0.6 ? K.d0 : n > 0.38 ? K.d1 : K.d2;
    // raked rings: concentric dashed arcs
    const e = Math.hypot((x - cx) / 1.0, (y - cy) / 0.56), ring = e % 9, ang = Math.atan2((y - cy) / 0.56, x - cx);
    if (ring < 1 && Math.sin(ang * 22 + e) > -0.2 && n > 0.32) c = n > 0.55 ? '#ecd0a6' : K.d0;
    if (edge(x, y, 2)) c = K.d2;
    p.px(x, y, c);
  }
  for (let k = 0; k < W * H / 90; k++) { const x = p.ri(1, W - 2), y = p.ri(1, H - 2); if (!mask[y * W + x]) continue; p.px(x, y, p.chance(0.5) ? K.d3 : '#f0d8b0'); }
}

// ------------------------------------------------------------------ castle backdrop
// Osaka-jo main keep (tenshukaku): five tiers of white plaster under copper-green
// roofs trimmed in gold; black top storey with gold reliefs; shachihoko on the ridge.
export function keep(p, cx, baseY, o = {}) {
  const T = [
    { ww: 48, wh: 15, rw: 60, rh: 9, g: 'none' },
    { ww: 41, wh: 13, rw: 53, rh: 9, g: 'big' },
    { ww: 35, wh: 12, rw: 46, rh: 8, g: 'pair' },
    { ww: 29, wh: 11, rw: 39, rh: 8, g: 'kara' },
    { ww: 22, wh: 12, rw: 32, rh: 11, g: 'top' },
  ];
  // stone base
  const sb = baseY + 14;
  for (let y = baseY; y < sb; y++) { const hw = 52 + (y - baseY) * 0.7; p.hl(R(cx - hw), R(cx + hw), y, (y - baseY) % 4 === 0 ? K.st4 : K.st2); }
  for (let y = baseY + 1; y < sb; y += 4) for (let x = R(cx - 52); x < cx + 52; x += 9) p.vl(x + ((y >> 2) % 2) * 4, y, y + 2, K.st4);
  p.hl(R(cx - 50), R(cx + 50), baseY, K.st0);
  let y = baseY;
  for (let i = 0; i < T.length; i++) {
    const t = T[i], top = i === T.length - 1;
    const wy = y - t.wh;
    // wall
    const wall = top ? K.blk : K.pl, wallD = top ? K.blk2 : K.pl1;
    p.rect(R(cx - t.ww), wy, t.ww * 2, t.wh, wall);
    p.rect(R(cx + t.ww * 0.45), wy, R(t.ww * 0.55), t.wh, wallD);                // shaded right flank
    p.vl(R(cx + t.ww * 0.45), wy, y - 1, top ? K.blk2 : K.pl2);
    if (!top) {
      // windows with copper frames, regular rhythm
      const nw = Math.floor((t.ww * 2 - 8) / 9);
      for (let k = 0; k < nw; k++) { const wx = R(cx - t.ww + 5 + k * ((t.ww * 2 - 10) / Math.max(1, nw - 1)) - 2); const wyy = wy + Math.max(3, (t.wh >> 1) - 2); p.rect(wx, wyy, 4, 5, K.cu4); p.hl(wx, wx + 3, wyy, K.cu2); p.vl(wx + 1, wyy + 1, wyy + 4, K.cu3); p.vl(wx + 3, wyy + 1, wyy + 4, K.cu3); }
      // dark sill band (nageshi)
      p.hl(R(cx - t.ww), R(cx + t.ww) - 1, y - 2, K.pl2);
    } else {
      // gold tiger + crane reliefs on black, balcony rail
      for (let k = -2; k <= 2; k++) { const gx = R(cx + k * 8.5); p.rect(gx - 2, wy + 3, 4, 3, K.gold2); p.hl(gx - 2, gx + 1, wy + 3, K.gold); p.px(gx - 1, wy + 2, K.goldL); p.px(gx + 2, wy + 4, K.gold); }
      p.hl(R(cx - t.ww) - 2, R(cx + t.ww) + 1, y - 3, K.blk2); p.hl(R(cx - t.ww) - 2, R(cx + t.ww) + 1, y - 4, K.cu3);
      for (let x = R(cx - t.ww) - 2; x <= cx + t.ww + 1; x += 3) p.vl(x, y - 3, y - 1, K.cu4);
    }
    p.vl(R(cx - t.ww), wy, y - 1, top ? K.blk2 : '#ffffff');
    // roof above this wall
    const ry0 = wy - t.rh, nextW = i + 1 < T.length ? T[i + 1].ww + 1 : 6;
    roofBand(p, cx, ry0, wy, nextW, t.rw, { last: top });
    // gables
    if (t.g === 'big') chidori(p, cx, wy + 1, 34, 16);
    if (t.g === 'pair') { chidori(p, cx - 18, wy + 1, 18, 10); chidori(p, cx + 18, wy + 1, 18, 10); }
    if (t.g === 'kara') karahafu(p, cx, wy + 1, 26, 8);
    if (t.g === 'top') {
      // irimoya ridge + front gable + shachihoko
      chidori(p, cx, ry0 + t.rh - 1, 26, 11, { ridge: true });
      p.rect(R(cx - 16), ry0 - 3, 33, 3, K.cu3); p.hl(R(cx - 16), R(cx + 16), ry0 - 3, K.cu1);
      shachi(p, R(cx - 18), ry0 - 9, false); shachi(p, R(cx + 15), ry0 - 9, true);
    }
    y = ry0 + 2;
  }
  // gold gegyo / eave dots catching the sun
}
function roofBand(p, cx, y0, y1, wTop, wBot, o = {}) {
  const h = y1 - y0;
  for (let j = 0; j < h; j++) {
    const t = j / Math.max(1, h - 1), hw = wTop + (wBot - wTop) * Math.pow(t, 0.8);
    const yy = y0 + j;
    for (let x = R(cx - hw); x <= R(cx + hw); x++) {
      const u = (x - cx) / hw;
      let c = (Math.abs(x - cx) % 3 === 0) ? K.cu2 : K.cu;
      if (u < -0.6 && j < h - 2) c = (Math.abs(x - cx) % 3 === 0) ? K.cu : K.cu1;     // lit left hip
      if (u > 0.55) c = (Math.abs(x - cx) % 3 === 0) ? K.cu3 : K.cu2;                     // shaded right hip
      if (j === 0) c = K.cu1;
      p.px(x, yy, c);
    }
  }
  // eave: gold-tipped tile ends, upturned corners, dark soffit shadow on the wall
  const eY = y1 - 1;
  p.hl(R(cx - wBot), R(cx + wBot), eY, K.cu3);
  for (let x = R(cx - wBot) + 1; x < cx + wBot; x += 2) p.px(x, eY, K.gold);
  p.hl(R(cx - wBot) + 2, R(cx + wBot) - 2, eY + 1, K.cu4);
  p.wash(R(cx - wBot) + 4, eY + 2, R(wBot * 2) - 8, 2, K.cu4, 0.35);
  for (const s of [-1, 1]) { const ex = R(cx + s * wBot); p.px(ex + s, eY - 1, K.cu1); p.px(ex + s * 2, eY - 2, K.cu1); p.px(ex + s * 2, eY - 3, K.goldL); p.px(ex, eY, K.cu2); p.px(ex + s, eY, K.cu3); }
  // hip ridges
  p.line(R(cx - wTop), y0, R(cx - wBot) + 2, eY - 1, K.cu0); p.line(R(cx + wTop), y0, R(cx + wBot) - 2, eY - 1, K.cu3);
}
// chidori-hafu: triangular gable with white face, copper bargeboards, gold apex ornament
function chidori(p, cx, baseY, w, h, o = {}) {
  const half = w / 2;
  for (let j = 0; j < h; j++) { const hw = (j / h) * half; p.hl(R(cx - hw), R(cx + hw), baseY - h + j, j > 1 ? K.pl : K.cu1); }
  p.wash(R(cx), baseY - h + 2, R(half), h - 2, K.pl2, 0.4);
  for (let k = 0; k < 2; k++) { p.line(R(cx), baseY - h - k, R(cx - half) - 1, baseY - 1 - k, k ? K.cu1 : K.cu0); p.line(R(cx), baseY - h - k, R(cx + half) + 1, baseY - 1 - k, k ? K.cu2 : K.cu3); }
  p.line(R(cx), baseY - h + 1, R(cx - half) + 1, baseY - 1, K.gold);
  p.line(R(cx), baseY - h + 1, R(cx + half) - 1, baseY - 1, K.gold2);
  // gegyo
  p.rect(R(cx) - 1, baseY - h + 2, 3, 3, K.gold); p.px(R(cx) - 1, baseY - h + 2, K.goldL); p.px(R(cx), baseY - h + 5, K.gold2);
  if (!o.ridge) { for (let k = 1; k < 3; k++) p.hl(R(cx - half * 0.7), R(cx + half * 0.7), baseY - k * 3, K.pl1); }
}
// kara-hafu: cusped curved gable on the eave, edged with gold
function karahafu(p, cx, baseY, w, h) {
  const half = w / 2;
  for (let x = -half - 2; x <= half + 2; x++) {
    const u = x / half, top = baseY - R(h * (Math.abs(u) < 1 ? Math.cos(u * Math.PI / 2) ** 1.4 : 0)) - (Math.abs(u) >= 1 ? 0 : 1);
    for (let y = top; y < baseY; y++) p.px(R(cx + x), y, y - top < 2 ? K.cu2 : K.pl);
    p.px(R(cx + x), top, x < 0 ? K.goldL : K.gold); p.px(R(cx + x), top - 1, K.cu1);
  }
  p.rect(R(cx) - 2, baseY - h + 2, 5, 3, K.gold); p.px(R(cx) - 2, baseY - h + 2, K.goldL);
}
// gilded shachihoko: carp body, tiger head, tail flipped up
function shachi(p, x, y, flip) {
  const pts = [[1, 8], [2, 7], [2, 6], [3, 5], [3, 4], [2, 3], [2, 2], [3, 1], [4, 0], [1, 1], [0, 2]];
  for (const [i, j] of pts) p.px(flip ? x + 4 - i : x + i, y + j, K.gold);
  p.px(flip ? x + 3 : x + 1, y + 7, K.gold2); p.px(flip ? x + 2 : x + 2, y + 4, K.goldL); p.px(flip ? x + 1 : x + 3, y + 3, K.goldL); p.px(flip ? x + 4 : x, y + 8, K.gold2);
}
// small corner turret (yagura): two storeys, white walls, copper roofs, one gable
export function yagura(p, cx, baseY, o = {}) {
  const w1 = o.w || 34, w2 = w1 - 9;
  // lower storey
  const y1 = baseY - 16;
  p.rect(R(cx - w1), y1, w1 * 2, 16, K.pl); p.rect(R(cx + w1 * 0.4), y1, R(w1 * 0.6), 16, K.pl1);
  p.rect(R(cx - w1), baseY - 5, w1 * 2, 5, K.blk2); for (let x = R(cx - w1); x < cx + w1; x += 4) p.vl(x, baseY - 5, baseY - 1, K.blk);
  for (let k = 0; k < 4; k++) { const wx = R(cx - w1 + 8 + k * (w1 * 2 - 18) / 3); p.rect(wx, y1 + 4, 4, 5, K.cu4); p.vl(wx + 2, y1 + 5, y1 + 8, K.cu3); p.hl(wx, wx + 3, y1 + 4, K.cu2); }
  roofBand(p, cx, y1 - 8, y1, w2 + 1, w1 + 8, {});
  chidori(p, cx, y1 + 1, 22, 11);
  const y2 = y1 - 8 - 12;
  p.rect(R(cx - w2), y2, w2 * 2, 12, K.pl); p.rect(R(cx + w2 * 0.4), y2, R(w2 * 0.6), 12, K.pl1);
  for (let k = 0; k < 3; k++) { const wx = R(cx - w2 + 6 + k * (w2 * 2 - 14) / 2); p.rect(wx, y2 + 3, 4, 5, K.cu4); p.hl(wx, wx + 3, y2 + 3, K.cu2); }
  roofBand(p, cx, y2 - 9, y2, 8, w2 + 7, {});
  p.rect(R(cx - 10), y2 - 11, 21, 2, K.cu3); p.hl(R(cx - 10), R(cx + 10), y2 - 11, K.cu1);
  p.px(R(cx - 11), y2 - 13, K.gold); p.px(R(cx - 11), y2 - 12, K.gold2); p.px(R(cx + 11), y2 - 13, K.gold); p.px(R(cx + 11), y2 - 12, K.gold2);
  p.vl(R(cx - w1), y1, baseY - 1, '#ffffff'); p.vl(R(cx - w2), y2, y2 + 11, '#ffffff');
}
// ishigaki: big fitted granite blocks in rough courses, smaller toward the top,
// lit top / left edges, dark joints, moss and stains near the water
export function ishigaki(p, x0, x1, yTop, yFoot, o = {}) {
  const seed = o.seed || 21, tones = [K.st0, K.st1, K.st1, K.st2, K.st2, K.st3];
  let y = yFoot;
  const courses = [];
  while (y > yTop + 2) { const t = (yFoot - y) / (yFoot - yTop), h = Math.max(5, R(12 - t * 5 + p.rand(-1, 1))); courses.push([Math.max(yTop + 2, y - h), y]); y -= h; }
  for (const [cy0, cy1] of courses) {
    let x = x0 - p.ri(0, 14);
    const hh = cy1 - cy0;
    while (x < x1) {
      const big = p.chance(o.big ?? 0.07);
      const w = big ? p.ri(26, 40) : p.ri(Math.max(8, hh + 2), Math.max(12, hh * 2 + 6));
      const sy0 = cy0 + p.ri(-1, 0), sy1 = cy1 - 1, sx0 = x, sx1 = Math.min(x1 - 1, x + w - 1), tone = big ? K.st0 : p.pick(tones);
      const skew = p.ri(-1, 1);
      for (let yy = sy0; yy <= sy1; yy++) {
        const k = (yy - sy0) / Math.max(1, sy1 - sy0), a = sx0 + R(skew * k), b = sx1 + R(skew * k);
        for (let xx = Math.max(x0, a); xx <= Math.min(x1 - 1, b); xx++) {
          let c = tone;
          if (yy === sy0 || xx === a) c = shift(tone, 0.55);
          else if (yy === sy1 || xx === b) c = shift(tone, -0.8);
          else if (xx - a + yy - sy0 < 4) c = shift(tone, 0.3);
          p.px(xx, yy, c);
        }
      }
      // joint line under / right of the stone
      p.hl(Math.max(x0, sx0), Math.min(x1 - 1, sx1 + skew), cy1, K.joint);
      p.vl(Math.min(x1 - 1, sx1 + 1 + skew), sy0, cy1, K.joint);
      // granite flecks + chips
      for (let k = 0; k < w * hh / 40; k++) { const fx = p.ri(sx0 + 2, Math.max(sx0 + 2, sx1 - 2)), fy = p.ri(sy0 + 2, Math.max(sy0 + 2, sy1 - 2)); if (fx < x1 - 1) p.px(fx, fy, shift(tone, -0.45)); }
      if (big) { p.hl(sx0 + 3, sx0 + 8, sy0 + 2, '#f0eadc'); p.px(sx0 + 2, sy0 + 3, '#f0eadc'); }
      x += w + 1;
    }
  }
  p.hl(x0, x1 - 1, yTop, K.st0); p.hl(x0, x1 - 1, yTop + 1, K.st1);
  // water-line stain and moss at the foot, lichen and weeds in the joints
  for (let x = x0; x < x1; x++) { const h = 3 + R(noise2(x / 9, 0, seed) * 7); for (let j = 0; j < h; j++) if (p.r() < 0.9 - j / h) p.blend(x, yFoot - j, '#3c4a3c', 0.35); }
  for (let k = 0; k < (x1 - x0) / 7; k++) { const x = p.ri(x0, x1 - 1), yy = p.ri(R(yFoot - (yFoot - yTop) * 0.35), yFoot - 2); p.px(x, yy, K.g3); p.px(x + 1, yy, K.g2); if (p.chance(0.5)) p.px(x, yy - 1, K.g1); }
  for (let k = 0; k < (x1 - x0) / 10; k++) { const x = p.ri(x0, x1 - 1), yy = p.ri(yTop + 3, yFoot - 4); p.px(x, yy, '#c8ccb0'); p.px(x + 1, yy, '#b0b89c'); }
  for (let k = 0; k < (x1 - x0) / 16; k++) { const x = p.ri(x0, x1 - 2), yy = p.ri(yTop + 4, R((yTop + yFoot) / 2)); for (let j = 0; j < p.ri(4, 10); j++) if (p.chance(0.75)) p.px(x, yy + j, mix(K.st2, K.joint, 0.35)); }
  // ferns hanging from the joints
  for (let k = 0; k < (x1 - x0) / 60; k++) { const x = p.ri(x0 + 4, x1 - 6), yy = p.ri(yTop + 6, yFoot - 18); for (let j = 0; j < 5; j++) { p.px(x + j, yy + (j >> 1), K.g2); p.px(x - j, yy + (j >> 1) + 1, K.g3); } p.px(x, yy - 1, K.g1); }
}
// curved, flaring wall corner built from long/short alternating dressed stones (sangi-zumi)
export function wallCorner(p, x, yTop, yFoot, side, o = {}) {
  const flare = o.flare ?? 7;
  let y = yFoot, k = 0;
  while (y > yTop + 1) {
    const t = (yFoot - y) / (yFoot - yTop), h = Math.max(4, R(9 - t * 4)), long = k % 2 === 0;
    const off = R(flare * Math.pow(1 - t, 2.2)), w = long ? 14 : 8;
    const ex = x + side * off;                              // corner edge position at this course
    const a = side < 0 ? ex : ex - w, b = side < 0 ? ex + w : ex;
    for (let yy = y - h; yy < y; yy++) for (let xx = a; xx <= b; xx++) {
      let c = K.st0;
      if (yy === y - h) c = '#f2ecdf'; else if (yy === y - 1) c = K.st2; else if (side < 0 && xx === a) c = '#efe8da'; else if (side > 0 && xx === b) c = K.st2;
      p.px(xx, yy, c);
    }
    p.hl(a, b, y, K.joint); p.vl(side < 0 ? b + 1 : a - 1, y - h, y, K.joint);
    y -= h + 1; k++;
  }
}

// ------------------------------------------------------------------ shrine
export function torii(o = {}) {
  const W = 52, H = 54;
  return sprite(W, H, 26, H - 1, (p) => {
    const V = K.verm, V2 = K.verm2, VL = K.vermL;
    for (const px0 of [10, 37]) {
      for (let y = 13; y < H - 1; y++) { p.px(px0, y, VL); p.px(px0 + 1, y, V); p.px(px0 + 2, y, V); p.px(px0 + 3, y, V2); p.px(px0 + 4, y, K.vermD); }
      p.rect(px0 - 1, H - 6, 7, 5, K.blk); p.hl(px0 - 1, px0 + 5, H - 6, K.blk2); p.px(px0 - 1, H - 5, '#5a5464');
    }
    // nuki (tie beam), protruding
    p.rect(4, 19, 44, 4, V); p.hl(4, 47, 19, VL); p.hl(4, 47, 22, V2); p.px(4, 20, VL); p.px(47, 21, K.vermD);
    // kasagi (black top beam, upswept) over shimaki (vermilion)
    for (let x = 0; x < W; x++) {
      const u = (x - (W - 1) / 2) / ((W - 1) / 2), lift = R(Math.pow(Math.abs(u), 3) * 4);
      p.px(x, 6 - lift, K.blk2); p.px(x, 7 - lift, K.blk); p.px(x, 8 - lift, K.blk);
      if (x > 2 && x < W - 3) { p.px(x, 9 - lift, V); p.px(x, 10 - lift, V); p.px(x, 11 - lift, V2); }
      if (x < 2 || x > W - 3) p.px(x, 5 - lift, K.blk2);
    }
    // gakuzuka + plaque
    p.rect(24, 12, 4, 7, V); p.rect(20, 11, 12, 9, K.blk); p.frame(20, 11, 12, 9, K.gold2); p.hl(21, 30, 11, K.gold);
    p.px(25, 13, K.goldL); p.px(26, 13, K.goldL); p.hl(24, 27, 15, K.gold); p.px(25, 17, K.gold); p.px(26, 17, K.gold);
    // sun shadow under beams
    p.wash(11, 23, 4, 3, K.vermD, 0.5); p.wash(38, 23, 4, 3, K.vermD, 0.5);
  });
}
export function hokora(o = {}) {
  const W = 60, H = 58;
  return sprite(W, H, 30, H - 1, (p) => {
    // stone plinth, two steps
    p.block(3, H - 7, 54, 6, K.st1, { line: K.st5 }); p.block(8, H - 12, 44, 5, K.st0, { line: K.st5 });
    for (let x = 6; x < 54; x += 11) p.vl(x, H - 6, H - 3, K.st3);
    // body
    p.block(14, 26, 32, 21, K.wood1, { line: K.wood3 });
    p.rect(17, 30, 26, 15, '#2a1e24');
    for (let x = 17; x < 43; x += 3) p.vl(x, 30, 44, K.wood0); for (let y = 30; y < 45; y += 4) p.hl(17, 42, y, K.wood0);
    p.vl(29, 30, 44, K.wood2); p.vl(30, 30, 44, K.wood);
    p.rect(14, 26, 3, 21, K.wood); p.rect(43, 26, 3, 21, K.wood2); p.vl(14, 26, 46, K.wood0);
    p.wash(15, 27, 30, 5, '#1a1018', 0.45);
    // roof: copper nagare-zukuri with chigi and katsuogi on the ridge
    for (let j = 0; j < 14; j++) { const hw = 15 + j * 1.15; for (let x = R(30 - hw); x <= R(30 + hw); x++) { const u = (x - 30) / hw; p.px(x, 12 + j, j === 0 ? K.cu1 : (x % 3 === 0 ? K.cu2 : u < -0.55 ? K.cu1 : u > 0.5 ? K.cu2 : K.cu)); } }
    p.hl(13, 47, 26, K.cu3); p.hl(12, 48, 25, K.cu2); p.px(12, 24, K.cu1); p.px(48, 24, K.cu3); p.px(11, 23, K.cu0); p.px(49, 23, K.cu2);
    p.rect(16, 9, 29, 3, K.cu3); p.hl(16, 44, 9, K.cu1);
    for (const x of [21, 30, 39]) { p.rect(x - 2, 6, 5, 3, K.wood2); p.hl(x - 2, x + 2, 6, K.gold); }
    p.line(14, 10, 10, 2, K.wood3); p.line(15, 10, 11, 2, K.wood1); p.line(46, 10, 50, 2, K.wood3); p.line(45, 10, 49, 2, K.wood1);
    // shimenawa rope with shide
    for (let x = 12; x <= 48; x++) { const sag = R(Math.sin(((x - 12) / 36) * Math.PI) * 3); p.px(x, 27 + sag, (x % 3) ? K.straw1 : K.straw3); p.px(x, 28 + sag, (x % 3) ? K.straw2 : K.straw3); }
    for (const x of [18, 30, 42]) { const sy = 30 + R(Math.sin(((x - 12) / 36) * Math.PI) * 3); for (let k = 0; k < 7; k++) p.px(x + (k % 2 ? 1 : 0) + ((k >> 1) % 2), sy + k, k % 2 ? '#e0dcd0' : '#ffffff'); }
    // bell + red/white rope
    p.rect(28, 30, 5, 4, K.gold); p.px(28, 30, K.goldL); p.hl(28, 32, 33, K.gold2);
    for (let y = 34; y < 47; y++) { p.px(30, y, y % 2 ? K.verm : '#f4f0e8'); p.px(31, y, y % 2 ? '#f4f0e8' : K.verm2); }
    // offering box
    p.block(22, H - 19, 16, 7, K.wood, { line: K.wood3 }); for (let x = 23; x < 37; x += 2) p.px(x, H - 19, K.wood3); p.hl(23, 36, H - 18, K.wood0);
    p.text('奉', 27, H - 18, K.gold, { jpSize: 6 });
    // sakaki vases
    for (const x of [16, 42]) { p.rect(x, H - 17, 3, 5, '#e8e4dc'); p.px(x, H - 17, '#ffffff'); p.px(x + 1, H - 20, K.g2); p.px(x, H - 19, K.g1); p.px(x + 2, H - 19, K.g3); p.px(x + 1, H - 21, K.g1); }
  });
}
export function stoneLantern(o = {}) {
  const W = 16, H = 32;
  return sprite(W, H, 8, H - 1, (p) => {
    const s0 = K.st0, s1 = K.st1, s2 = K.st3, s3 = K.st5;
    p.block(3, H - 4, 10, 3, s1, { line: s3 });                        // kiso
    p.block(6, H - 14, 4, 10, s1, { line: s3 }); p.px(6, H - 13, s0);    // sao
    p.hl(7, 8, H - 9, s2);
    p.block(3, H - 17, 10, 3, s1, { line: s3 });                        // nakadai
    p.block(4, 10, 8, 6, s1, { line: s3 });                             // hibukuro
    p.rect(6, 11, 4, 4, o.lit ? '#ffe8a0' : '#3a3038'); p.vl(8, 11, 14, s1); if (o.lit) p.px(6, 11, '#fff8d8');
    // kasa with curled corners
    for (let j = 0; j < 4; j++) p.hl(1 + (3 - j) - 1, W - 2 - (3 - j) + 1, 6 + j, j === 0 ? s0 : j === 3 ? s2 : s1);
    p.px(0, 8, s1); p.px(W - 1, 8, s2); p.px(0, 7, s0); p.px(W - 1, 7, s1); p.hl(1, W - 2, 10, s3);
    p.rect(6, 3, 4, 3, s1); p.px(6, 3, s0); p.px(7, 1, s1); p.px(8, 1, s1); p.px(7, 2, s0); p.px(8, 2, s2);    // hoju
    // moss on the cap + lichen
    p.px(3, 6, K.g2); p.px(4, 6, K.g1); p.px(10, 7, K.g3); p.px(4, H - 4, K.g2); p.px(5, H - 4, K.g3); p.px(7, H - 12, '#c8ccb0');
    p.frame(-1, -1, 0, 0, s3);
  });
}
export function kitsune(o = {}) {
  const W = 14, H = 22;
  return sprite(W, H, 7, H - 1, (p) => {
    p.block(2, H - 7, 10, 6, K.st1, { line: K.st5 }); p.hl(3, 10, H - 5, K.st2);
    const f = (x, y) => p.px(o.flip ? W - 1 - x : x, y, arguments.length > 2 ? arguments[2] : null);
    const put = (x, y, c) => p.px(o.flip ? W - 1 - x : x, y, c);
    const wh = '#ece6da', wh2 = '#cfc6b8', wh3 = '#a49a8c';
    // tail curling up behind
    for (const [x, y] of [[10, 9], [11, 8], [11, 7], [11, 6], [10, 5], [10, 6], [9, 10], [10, 10]]) put(x, y, wh2);
    put(10, 4, wh); put(11, 5, wh3);
    // body (sitting)
    for (let y = 7; y < H - 7; y++) for (let x = 3; x < 9; x++) { if (y < 9 && (x < 4 || x > 7)) continue; put(x, y, x < 5 ? wh : x > 7 ? wh3 : wh2); }
    // head + ears + snout
    for (let y = 2; y < 7; y++) for (let x = 3; x < 8; x++) put(x, y, x < 5 ? wh : wh2);
    put(3, 1, wh); put(3, 0, wh2); put(7, 1, wh2); put(7, 0, wh3); put(2, 5, wh2); put(1, 5, wh3);
    put(4, 4, K.verm); put(6, 4, K.verm);                               // painted eye lines
    // red bib
    for (let x = 3; x < 8; x++) { put(x, 7, K.verm); put(x, 8, x === 3 ? K.vermL : K.verm2); } put(5, 9, K.verm2);
    put(4, H - 8, wh3); put(6, H - 8, wh3);
    selout(p, K.st5);
  });
}
export function emaRack() {
  const W = 34, H = 32;
  return sprite(W, H, 17, H - 1, (p) => {
    for (const x of [3, 29]) { p.rect(x, 6, 2, H - 6, K.wood1); p.vl(x, 6, H - 1, K.wood0); p.vl(x + 1, 6, H - 1, K.wood2); }
    // little gabled roof
    for (let j = 0; j < 5; j++) p.hl(1 + (4 - j) * 0, W - 2, 2 + j, j === 0 ? K.wood0 : j === 4 ? K.wood3 : K.wood2);
    p.hl(0, W - 1, 6, K.wood3); p.px(0, 5, K.wood1); p.px(W - 1, 5, K.wood2);
    for (const ry of [9, 18]) {
      p.hl(3, 30, ry, K.wood2);
      for (let x = 5; x < 29; x += 4) {
        const y = ry + 1 + (x % 3 === 0 ? 1 : 0), c = '#e6c48e';
        p.rect(x, y + 1, 4, 5, c); p.px(x + 1, y, c); p.px(x + 2, y, c); p.vl(x + 3, y + 1, y + 5, '#c49e6a'); p.hl(x, x + 3, y + 5, '#b08a5a');
        const mark = (x * 7 + ry) % 5; if (mark < 3) p.px(x + 1, y + 2, [K.verm, '#3a3048', K.g3][mark]); if (mark === 0) p.px(x + 2, y + 3, K.verm2);
      }
    }
  });
}
export function chozuya() {
  const W = 26, H = 20;
  return sprite(W, H, 13, H - 1, (p) => {
    p.block(2, 7, 22, 11, K.st1, { line: K.st5 }); p.hl(3, 22, 8, K.st0);
    p.rect(4, 9, 18, 4, K.w2); p.hl(4, 21, 9, K.w1); p.px(8, 10, K.wH); p.px(15, 11, K.wH);
    p.hl(3, 22, 14, K.st2); p.text('洗', 10, 13, K.st4, { jpSize: 6 });
    // bamboo spout + ladles
    p.line(24, 2, 17, 7, '#8aa848'); p.line(24, 3, 17, 8, '#5e7a3a'); p.px(24, 2, '#b8d070');
    p.vl(17, 8, 11, '#9ad0e0');
    for (const x of [6, 10]) { p.hl(x, x + 5, 7, '#c8a46a'); p.rect(x + 5, 6, 2, 2, '#b08a54'); }
  });
}

// ------------------------------------------------------------------ Coach Gonda's training ground
export function strawDummy(o = {}) {
  const W = 24, H = 42;
  return sprite(W, H, 12, H - 1, (p) => {
    const S = [K.straw0, K.straw1, K.straw2, K.straw3];
    p.rect(11, 14, 3, H - 15, K.wood1); p.vl(11, 14, H - 2, K.wood0); p.vl(13, 14, H - 2, K.wood2);
    p.rect(9, H - 3, 7, 2, K.d3);
    const bundle = (x0, y0, w, h, ties) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const u = (x - x0) / (w - 1); p.px(x, y, u < 0.25 ? S[0] : u < 0.6 ? S[1] : u < 0.85 ? S[2] : S[3]); }
      for (let x = x0 + 1; x < x0 + w - 1; x += 2) p.vl(x, y0 + 1, y0 + h - 2, x % 4 === 1 ? S[2] : S[1]);
      for (const ty of ties) { p.hl(x0, x0 + w - 1, ty, K.wood2); p.px(x0, ty, K.wood1); }
      p.hl(x0, x0 + w - 1, y0 + h - 1, S[3]);
    };
    bundle(7, 14, 11, 16, [16, 22, 28]);
    bundle(1, 15, 22, 4, [15 + 1]);
    p.vl(1, 15, 18, S[3]); p.vl(22, 15, 18, S[3]);
    // stray straws
    for (const [x, y, dx, dy] of [[1, 14, -1, -1], [22, 14, 1, -1], [7, 30, -1, 1], [17, 30, 1, 1], [0, 18, -1, 1]]) { p.px(x + dx, y + dy, S[1]); p.px(x + dx * 2, y + dy * 2, S[2]); }
    // head with headband + charcoal face
    p.ell(12.5, 8.5, 5, 5.2, S[1]); p.ell(11.5, 7.5, 3, 3, S[0]); p.ell(14, 10, 2.5, 2.5, S[2]);
    p.hl(8, 17, 6, o.band || K.verm); p.hl(8, 17, 7, o.band ? shift(o.band, -1) : K.verm2); p.px(18, 7, o.band || K.verm); p.px(19, 8, o.band || K.verm); p.px(19, 9, o.band ? shift(o.band, -1) : K.verm2);
    p.px(10, 9, K.blk); p.px(14, 9, K.blk); p.hl(11, 13, 12, K.blk); if (o.angry) { p.px(9, 8, K.blk); p.px(15, 8, K.blk); }
    // repair patch of fresher straw + a punched dent
    p.rect(9, 23, 3, 3, '#fff0b8'); p.hl(9, 11, 26, S[2]); p.px(14, 19, S[3]); p.px(15, 20, S[3]);
    selout(p, K.straw4);
  });
}
export function crabDummy() {     // practice target shaped like Kanizumo
  const W = 40, H = 34;
  return sprite(W, H, 20, H - 1, (p) => {
    const S = [K.straw0, K.straw1, K.straw2, K.straw3];
    for (const x of [13, 25]) { p.rect(x, 20, 3, H - 21, K.wood1); p.vl(x, 20, H - 2, K.wood0); p.vl(x + 2, 20, H - 2, K.wood2); }
    // body: wide oval bundle with a navy mawashi band
    p.ell(20, 17, 13, 7, S[1]); p.ell(18, 15, 9, 4, S[0]); p.ell(23, 20, 9, 3.5, S[2]);
    for (let x = 9; x < 32; x += 2) p.vl(x, 12, 22, S[2]);
    p.ell(18, 15, 6, 2.5, S[0]);
    p.hl(8, 32, 19, '#1f2a5a'); p.hl(8, 32, 20, '#2e3c78'); p.hl(9, 31, 21, '#1f2a5a');
    // claws raised
    for (const s of [-1, 1]) {
      const bx = 20 + s * 15;
      p.line(20 + s * 11, 14, bx, 8, S[2]); p.line(20 + s * 11, 15, bx, 9, S[3]);
      p.ell(bx, 5.5, 4, 4, S[1]); p.ell(bx - 1, 4.5, 2, 2, S[0]);
      p.px(bx, 1, 0); p.px(bx, 2, 0); p.px(bx + s, 2, 0); p.vl(bx, 1, 4, 0);
      p.hl(bx - 4, bx + 4, 7, K.wood2);
    }
    // eyes on stalks + topknot
    for (const x of [16, 24]) { p.vl(x, 7, 10, K.wood2); p.rect(x - 1, 5, 3, 3, '#f4f0e8'); p.px(x, 6, K.blk); }
    p.rect(19, 6, 3, 3, K.blk); p.px(20, 5, K.blk2); p.px(19, 6, '#ffffff');
    p.text('蟹', 17, 13, K.verm2, { jpSize: 7 });
    selout(p, K.straw4);
  });
}
export function tyreStack(n = 3, o = {}) {
  const W = 26, H = 8 + n * 5;
  return sprite(W, H, 13, H - 1, (p) => {
    for (let k = 0; k < n; k++) {
      const by = H - 2 - k * 5, ox = (k % 2) * (o.jitter ?? 1), col = o.cols ? o.cols[k % o.cols.length] : null;
      // side wall band
      for (let x = 2; x < 24; x++) { const u = (x - 2) / 21; p.vl(x + ox, by - 4, by, u < 0.2 ? K.rub1 : u < 0.75 ? K.rub : K.rub2); }
      for (let x = 4; x < 23; x += 3) p.vl(x + ox, by - 3, by - 1, K.rub2);
      p.hl(3 + ox, 22 + ox, by, K.rub3);
      // top ring
      p.ell(13 + ox, by - 5, 11, 3.6, col || K.rub1); p.ell(13 + ox, by - 5, 6, 1.8, K.rub3); p.hl(7 + ox, 18 + ox, by - 8, col ? shift(col, 0.8) : '#7a7684');
      if (col) p.hl(5 + ox, 21 + ox, by - 2, col);
    }
  });
}
// half-buried painted tyre arch (for hopping drills)
export function tyreArch(col) {
  const W = 18, H = 12;
  return sprite(W, H, 9, H - 1, (p) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - 8.5) / 8.5, (y - 11) / 10.5); if (d > 1 || d < 0.52) continue;
      const lit = (x - 8.5) < -2 && y < 8;
      p.px(x, y, d > 0.9 ? shift(col, -1.2) : d < 0.6 ? shift(col, -1.6) : lit ? shift(col, 0.7) : col);
    }
    for (let a = 0.2; a < Math.PI; a += 0.32) { const x = R(8.5 + Math.cos(a) * 7.3), y = R(11 - Math.sin(a) * 8.6); p.px(x, y, shift(col, -0.9)); }
    p.hl(0, 4, H - 1, K.d3); p.hl(13, 17, H - 1, K.d3);
  });
}
export function towelRack() {
  const W = 46, H = 36;
  return sprite(W, H, 23, H - 1, (p) => {
    for (const x of [3, 41]) { p.rect(x, 4, 3, H - 5, K.wood1); p.vl(x, 4, H - 2, K.wood0); p.vl(x + 2, 4, H - 2, K.wood2); }
    p.rect(2, 4, 42, 3, K.wood1); p.hl(2, 43, 4, K.wood0); p.hl(2, 43, 6, K.wood2);
    p.rect(6, 25, 35, 2, K.wood1); p.hl(6, 40, 25, K.wood0);
    // towels draped over the bar
    const towels = [[7, 7, '#e5383b', 14], [15, 7, '#f4f0ea', 11], [22, 6, '#ffd23a', 13], [31, 7, '#4c78c8', 12]];
    for (const [x, w, c, h] of towels) {
      for (let y = 6; y < 6 + h; y++) for (let i = 0; i < w; i++) { const u = i / (w - 1); p.px(x + i, y, u < 0.2 ? shift(c, 0.6) : u > 0.8 ? shift(c, -0.8) : c); }
      p.hl(x, x + w - 1, 5, shift(c, 0.8)); p.hl(x, x + w - 1, 6 + h - 1, shift(c, -1.2));
      for (let y = 8; y < 6 + h - 1; y += 3) p.px(x + (w >> 1), y, shift(c, -0.5));
      if (c === '#f4f0ea') { p.hl(x, x + w - 1, 6 + h - 3, '#e5383b'); }
      if (c === '#e5383b') { p.hl(x, x + w - 1, 6 + h - 3, '#f4f0ea'); }
    }
    // water bottles on the shelf
    for (let k = 0; k < 6; k++) { const x = 8 + k * 5; p.rect(x, 19, 3, 6, '#8ccce8'); p.vl(x, 19, 24, '#d4f0fa'); p.rect(x, 17, 3, 2, k % 2 ? K.verm : '#f4f0e8'); p.px(x + 2, 22, '#5a9ac0'); }
    // cooler box below
    p.block(14, H - 9, 18, 8, '#3c6ab8', { line: '#1e2e5a' }); p.rect(14, H - 9, 18, 2, '#f4f0ea'); p.hl(15, 30, H - 9, '#ffffff'); p.rect(21, H - 6, 4, 2, '#f4f0ea');
  });
}
export function whiteboard() {
  const W = 46, H = 44;
  return sprite(W, H, 23, H - 1, (p) => {
    // legs + castors
    for (const x of [6, 38]) { p.vl(x, 26, H - 3, K.metal2 || C.metal2); p.vl(x + 1, 26, H - 3, C.metal); p.rect(x - 2, H - 3, 5, 2, '#2a2830'); }
    p.hl(6, 39, H - 6, C.metal2);
    // board
    p.block(2, 2, 42, 27, '#f6f8f4', { line: '#4a4a5a', light: '#ffffff', dark: '#c8ccd4' });
    p.frame(1, 1, 44, 29, C.metalL); p.hl(1, 44, 1, '#e8eaf0');
    p.wash(3, 22, 40, 6, '#b8c4d8', 0.35);
    for (let k = 0; k < 40; k += 9) p.line(4 + k, 26, 12 + k, 4, '#fafcff');
    // tactics: dohyo circle, O / X, arrows, a crab doodle and kanji
    p.s.ring(16, 15, 9, 7, '#3a4a9a');
    p.s.ring(12, 13, 1.6, 1.6, '#d83a3a'); p.s.ring(19, 18, 1.6, 1.6, '#d83a3a');
    p.line(9, 18, 11, 20, '#2a3a8a'); p.line(11, 18, 9, 20, '#2a3a8a'); p.line(21, 10, 23, 12, '#2a3a8a'); p.line(23, 10, 21, 12, '#2a3a8a');
    p.line(13, 13, 18, 17, '#d83a3a'); p.px(17, 17, '#d83a3a'); p.px(18, 16, '#d83a3a');
    p.line(27, 8, 38, 8, '#2a2a3a'); p.text('押', 28, 11, '#d83a3a', { jpSize: 8 }); p.text('!', 37, 11, '#d83a3a');
    p.ell(36, 22, 4, 2.5, '#d83a3a'); p.ell(36, 22, 2.5, 1.2, '#f6f8f4'); p.px(31, 20, '#d83a3a'); p.px(41, 20, '#d83a3a'); p.px(30, 19, '#d83a3a'); p.px(42, 19, '#d83a3a');
    p.text('GO', 27, 21, '#2a3a8a', { mini: true });
    // tray + markers + magnet notes
    p.rect(4, 29, 38, 2, C.metal2); p.rect(10, 28, 4, 1, '#d83a3a'); p.rect(16, 28, 4, 1, '#2a3a8a'); p.rect(30, 28, 6, 1, '#ece4d0');
    p.rect(38, 3, 5, 5, '#ffd23a'); p.px(40, 3, '#d83a3a');
  });
}
export function gondaSign() {
  const W = 80, H = 46;
  return sprite(W, H, 40, H - 1, (p) => {
    for (const x of [8, 69]) { p.rect(x, 18, 4, H - 18, K.wood1); p.vl(x, 18, H - 2, K.wood0); p.vl(x + 3, 18, H - 2, K.wood2); }
    p.block(2, 3, 76, 28, '#c8a274', { line: K.wood3, light: '#e2c08e', dark: '#9a764e' });
    for (const y of [12, 21]) { p.hl(3, 76, y, '#a8845a'); p.hl(3, 76, y + 1, '#d8b484'); }
    for (let k = 0; k < 18; k++) { const x = p.ri(4, 74), y = p.ri(5, 28); p.hl(x, x + p.ri(2, 6), y, '#b89064'); }
    // red crab emblem in a circle
    p.ell(14, 13, 8, 8, '#f4ead4'); p.s.ring(14, 13, 8, 8, '#e5383b');
    p.ell(14, 14, 5, 3, '#e5383b'); p.px(9, 10, '#e5383b'); p.px(8, 9, '#e5383b'); p.px(10, 9, '#e5383b'); p.px(19, 10, '#e5383b'); p.px(20, 9, '#e5383b'); p.px(18, 9, '#e5383b');
    p.px(12, 11, '#2a2028'); p.px(16, 11, '#2a2028'); for (const x of [10, 12, 16, 18]) p.px(x, 17, '#a8202e');
    p.text('権田', 26, 4, '#2a1e22', { jpSize: 12 });
    p.text('道場', 52, 6, '#a8202e', { jpSize: 10 });
    p.text('GONDA TRAINING GROUND', 4, 24, '#3a2a26', { mini: true });
    p.wash(2, 31, 76, 3, '#2a1e22', 0.3);
  });
}
export function sandbags() {
  const W = 30, H = 16;
  return sprite(W, H, 15, H - 1, (p) => {
    const bag = (x, y) => { p.ell(x, y, 5.5, 3.2, '#c8a878'); p.ell(x - 1, y - 1, 3, 1.5, '#e0c898'); p.hl(x - 4, x + 4, y + 2, '#a08058'); p.px(x + 5, y - 1, '#8a6a48'); p.px(x + 6, y - 2, '#8a6a48'); p.px(x, y - 2, '#f0dcb0'); };
    bag(7, 12); bag(16, 12); bag(25, 12); bag(11, 8); bag(21, 8); bag(16, 4);
    selout(p, '#6a5038');
  });
}
export function punchBag() {
  const W = 34, H = 46;
  return sprite(W, H, 17, H - 1, (p) => {
    p.line(4, H - 1, 12, 2, K.wood2); p.line(5, H - 1, 13, 2, K.wood1); p.line(29, H - 1, 21, 2, K.wood2); p.line(28, H - 1, 20, 2, K.wood3);
    p.rect(10, 1, 14, 3, K.wood1); p.hl(10, 23, 1, K.wood0); p.hl(10, 23, 3, K.wood3);
    p.vl(17, 4, 9, C.metal2);
    p.rect(13, 10, 8, 20, '#c8343a'); p.vl(13, 10, 29, '#e86a5a'); p.vl(14, 10, 29, '#d84a44'); p.vl(20, 10, 29, '#8a2030'); p.hl(13, 20, 10, '#e86a5a'); p.hl(13, 20, 29, '#6a1a28');
    p.hl(13, 20, 14, '#2a2028'); p.hl(13, 20, 25, '#2a2028'); p.rect(15, 18, 4, 3, '#f4f0e8'); p.px(16, 19, '#c8343a');
    p.line(9, H - 14, 25, H - 14, K.wood2);
  });
}
export function saltBox() {
  return sprite(12, 9, 6, 8, (p) => { p.block(1, 3, 10, 5, K.wood0, { line: K.wood3 }); p.ell(6, 3, 4, 2, '#fbfaf6'); p.px(4, 2, '#ffffff'); p.px(7, 3, '#e0e0e8'); });
}
export function bucket() {
  return sprite(10, 10, 5, 9, (p) => { p.poly([[1, 3], [9, 3], [8, 9], [2, 9]], '#9aa4b0'); p.vl(2, 3, 8, '#c8d0dc'); p.vl(8, 3, 8, '#6a7484'); p.ell(5, 3, 4, 1.4, '#5a9ac0'); p.px(4, 3, '#c4e4f0'); p.s.ring(5, 2, 4, 3, '#6a7484'); p.line(5, 3, 9, -1, K.wood1); });
}
export function broom() {
  return sprite(10, 28, 4, 27, (p) => { p.line(7, 0, 4, 18, '#c8a860'); p.line(8, 0, 5, 18, '#8a7040'); for (let k = 0; k < 6; k++) p.line(4, 18, 1 + k, 27, k % 2 ? '#c49a54' : '#e0c070'); p.hl(2, 6, 19, '#7a4a30'); });
}

// ------------------------------------------------------------------ park furniture (2050 touches)
export function parkBench(o = {}) {
  const W = 38, H = 20, back = o.back;            // back: seen from behind (facing away)
  return sprite(W, H, 19, H - 1, (p) => {
    const iron = '#3a4a46', ironL = '#5e746c', wood = '#b07a50', woodL = '#d09a68', woodD = '#7a5038';
    if (!back) {
      p.rect(2, 2, 34, 3, wood); p.hl(2, 35, 2, woodL); p.hl(2, 35, 4, woodD);
      p.rect(2, 6, 34, 2, wood); p.hl(2, 35, 6, woodL);
      p.rect(1, 10, 36, 3, wood); p.hl(1, 36, 10, woodL); p.hl(1, 36, 12, woodD);
      p.rect(1, 13, 36, 1, woodD);
      for (const x of [2, 34]) { p.vl(x, 1, H - 1, iron); p.vl(x + 1, 1, H - 1, ironL); p.hl(x - 1, x + 2, 9, iron); p.hl(x - 1, x + 2, H - 1, iron); }
    } else {
      p.rect(1, 8, 36, 2, woodD); p.hl(1, 36, 8, wood);
      p.rect(2, 1, 34, 3, wood); p.hl(2, 35, 1, woodL); p.hl(2, 35, 3, woodD);
      p.rect(2, 5, 34, 2, wood); p.hl(2, 35, 5, woodL); p.hl(2, 35, 6, woodD);
      for (const x of [2, 34]) { p.vl(x, 0, H - 1, iron); p.vl(x + 1, 0, H - 1, ironL); }
      p.vl(18, 1, 7, iron);
    }
    p.frame(0, 0, 0, 0, iron);
  });
}
export function solarLamp(o = {}) {
  const W = 20, H = 64;
  return sprite(W, H, 8, H - 1, (p) => {
    p.rect(7, 10, 3, H - 12, '#4a525e'); p.vl(7, 10, H - 3, '#7a8494'); p.vl(9, 10, H - 3, '#323844');
    p.rect(5, H - 4, 7, 3, '#323844'); p.hl(5, 11, H - 4, '#5a6270');
    // lamp head: slim bar with LED underside
    p.rect(6, 9, 12, 3, '#5a6270'); p.hl(6, 17, 9, '#8a94a4'); p.hl(8, 16, 12, o.on ? '#fff8d8' : '#dce8f0');
    // tilted solar panel on top
    for (let j = 0; j < 5; j++) p.hl(3 + j, 15 + j, 3 + j, j % 2 ? '#2e4a8a' : '#3c5ca0'); for (let x = 6; x < 18; x += 3) p.px(x, 5, '#6a8ad0');
    p.hl(3, 15, 2, '#c8d0dc'); p.hl(8, 20, 8, '#323844'); p.vl(8, 8, 9, '#323844');
    p.px(8, 20, '#7af0a0');           // status LED
    p.rect(7, 30, 3, 6, '#e8e4dc'); p.px(8, 32, '#2a8a6a'); // little QR plate
  });
}
export function bonbori(o = {}) {
  const W = 12, H = 44;
  return sprite(W, H, 6, H - 1, (p) => {
    p.rect(5, 14, 2, H - 15, K.wood1); p.vl(5, 14, H - 2, K.wood0);
    p.rect(3, H - 3, 6, 2, K.wood2);
    p.rect(1, 2, 10, 13, o.on ? '#fff0d0' : '#f8f0e6'); p.vl(1, 2, 14, '#ffffff'); p.vl(10, 2, 14, o.on ? '#f0c890' : '#dcd0c8');
    p.rect(0, 0, 12, 2, K.blk); p.rect(0, 15, 12, 2, K.blk); p.hl(0, 11, 0, K.blk2);
    p.rect(2, 4, 8, 2, '#f4a8bc'); p.rect(2, 11, 8, 2, '#f4a8bc');
    p.text(o.mark || '桜', 3, 6, K.verm2, { jpSize: 6 });
  });
}
export function holoBase() {
  const W = 30, H = 18;
  return sprite(W, H, 15, H - 1, (p) => {
    p.block(3, 6, 24, 10, '#5a6474', { line: '#2a2e3a', light: '#8a94a8', dark: '#3e4654' });
    p.rect(5, 5, 20, 2, '#2a2e3a'); p.hl(6, 23, 5, K.holo); p.hl(8, 21, 6, K.holo2);
    p.text('MAP', 9, 9, '#c8d0dc', { mini: true }); p.px(23, 13, '#7af0a0');
  });
}
// translucent holographic park map (separate sprite, no shadow)
export function holoPanel() {
  const W = 44, H = 34;
  const s = newSurf(W, H), p = new Pen(s, 5);
  const A = (x, y, c, a) => p.blend(x, y, c, a);
  for (let y = 0; y < H - 6; y++) for (let x = 0; x < W; x++) A(x, y, y % 2 ? '#1a8aa8' : '#28b0c8', 0.32);
  for (let x = 0; x < W; x++) { A(x, 0, K.holoL, 0.9); A(x, H - 7, K.holo, 0.85); }
  for (let y = 0; y < H - 6; y++) { A(0, y, K.holo, 0.85); A(W - 1, y, K.holo, 0.85); }
  // moat ring, keep, paths, ring, you-are-here
  for (let x = 4; x < 40; x++) { A(x, 4, K.holoL, 0.8); A(x, 9, K.holoL, 0.55); }
  for (let x = 17; x < 23; x++) for (let y = 2; y < 7; y++) A(x, y, '#ffe48c', 0.85);
  for (let x = 4; x < 40; x++) A(x, 12, K.holo, 0.7);
  for (let y = 12; y < 26; y++) { A(36, y, K.holo, 0.7); A(10, y, K.holo, 0.6); }
  for (let x = 6; x < 40; x++) A(x, 23, K.holo, 0.7);
  for (let a = 0; a < 6.3; a += 0.25) A(R(22 + Math.cos(a) * 6), R(17 + Math.sin(a) * 3), '#ffffff', 0.8);
  for (let x = 28; x < 34; x++) for (let y = 14; y < 21; y++) A(x, y, '#5ab0f0', 0.5);
  for (const [x, y] of [[36, 22], [35, 21], [37, 21], [36, 20], [36, 19]]) A(x, y, '#ff5aa0', 0.95);
  A(9, 15, '#ff7a5a', 0.9); A(10, 15, '#ff7a5a', 0.9);
  // projector cone
  for (let y = H - 6; y < H; y++) for (let x = 0; x < W; x++) { const k = (y - (H - 6)) / 6, hw = (W / 2) * (1 - k) + 4 * k; if (Math.abs(x - W / 2) < hw) A(x, y, K.holo, 0.12 + 0.1 * k); }
  return { surf: s, ax: W >> 1, ay: H - 1 };
}
export function parkMarker() {
  const W = 72, H = 26;
  return sprite(W, H, 36, H - 1, (p) => {
    p.block(2, H - 6, 68, 5, K.st2, { line: K.st5 });
    // rough-cut granite slab, rounded top
    for (let y = 2; y < H - 6; y++) { const cut = y < 5 ? (5 - y) * 3 : 0; for (let x = 5 + cut; x < 67 - cut * 0.6; x++) { const u = (x - 5) / 62; p.px(x, y, y < 4 ? K.st0 : u < 0.15 ? K.st0 : u > 0.85 ? K.st3 : K.st1); } }
    for (let k = 0; k < 40; k++) p.px(p.ri(6, 64), p.ri(4, H - 8), K.st2);
    p.text('大阪城公園', 9, 5, K.st5, { jpSize: 10 }); p.text('大阪城公園', 8, 4, K.joint, { jpSize: 10 });
    p.text('OSAKA CASTLE PARK', 4, H - 5, K.st0, { mini: true });
    selout(p, K.st5);
  });
}
export function gatePost(o = {}) {
  const W = 14, H = 34;
  return sprite(W, H, 7, H - 1, (p) => {
    p.block(2, 6, 10, H - 7, K.st1, { line: K.st5 }); p.vl(3, 6, H - 3, K.st0);
    p.block(1, 2, 12, 4, K.st0, { line: K.st5 }); p.ell(7, 2, 3, 1.5, K.st1);
    for (let y = 12; y < H - 3; y += 7) p.hl(3, 10, y, K.st3);
    if (o.lamp) { p.rect(4, 8, 6, 4, '#fff4d0'); p.frame(4, 8, 6, 4, K.blk2); }
  });
}
export function trashBins() {
  const W = 26, H = 20;
  return sprite(W, H, 13, H - 1, (p) => {
    for (const [x, c, m] of [[1, '#3a8a5a', '可'], [13, '#3a6ab8', 'PET']]) {
      p.block(x + 1, 5, 10, 13, c, { line: shift(c, -2.4) }); p.rect(x, 3, 12, 3, shift(c, -0.8)); p.hl(x, x + 11, 3, shift(c, 0.8));
      p.rect(x + 3, 7, 6, 3, '#f4f0e8'); if (m === 'PET') p.text('PET', x + 1, 12, '#f4f0e8', { mini: true }); else p.text(m, x + 3, 11, '#f4f0e8', { jpSize: 6 });
      p.rect(x + 4, 4, 4, 1, C.ink2);
    }
  });
}
export function camDrone() {
  const W = 22, H = 40;                                  // hovering ~26 px above its anchor
  return sprite(W, H, 11, H - 1, (p) => {
    p.block(7, 4, 8, 4, '#e8ecf0', { line: '#4a5260' }); p.hl(8, 13, 4, '#ffffff');
    p.rect(9, 8, 4, 2, '#2a2e3a'); p.px(10, 9, K.holo); p.px(11, 8, '#5a9ad0');
    for (const s of [-1, 1]) { p.hl(11 + s * 4, 11 + s * 9, 5, '#5a6270'); p.hl(11 + s * 7 - 3, 11 + s * 7 + 3, 3, '#c8d4e0'); p.px(11 + s * 7, 4, '#5a6270'); }
    p.px(8, 5, '#ff5a5a');
  });
}
export function gozabune() {      // little gold-roofed sightseeing boat (electric in 2050)
  const W = 52, H = 22;
  return sprite(W, H, 26, H - 3, (p) => {
    // hull
    for (let x = 2; x < W - 2; x++) { const u = (x - W / 2) / (W / 2 - 2), d = R(Math.pow(Math.abs(u), 3) * 4); p.vl(x, 14 - d, 18 - R(d / 2), x < 8 ? '#6a4232' : '#4a2e2a'); p.px(x, 14 - d, '#a87450'); }
    p.hl(6, W - 7, 16, '#8a5a3e'); p.hl(10, W - 10, 17, K.holo2);
    // cabin
    p.rect(12, 7, 28, 7, '#c8343a'); for (let x = 14; x < 39; x += 5) { p.rect(x, 8, 3, 4, '#f4e8cc'); p.px(x, 8, '#ffffff'); }
    p.vl(12, 7, 13, '#e86a5a'); p.vl(39, 7, 13, '#8a2030');
    // golden roof with upturned ends
    for (let x = 8; x < 44; x++) { const u = (x - 26) / 18, lift = R(Math.pow(Math.abs(u), 4) * 3); p.px(x, 5 - lift, K.goldL); p.px(x, 6 - lift, K.gold); p.px(x, 7 - lift, K.gold2); }
    p.rect(23, 1, 6, 4, K.gold); p.hl(23, 28, 1, K.goldL); p.px(26, 0, K.goldL);
  });
}
