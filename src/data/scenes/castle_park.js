// Osaka Castle Park, 2050 — Coach Gonda's training ground on a bright afternoon.
// Back to front: big sky and the castle keep (a painted backdrop flat), the
// bailey top with pines and a corner turret, the ishigaki stone wall with the
// Sakuramon-style gate, the green moat crossed by an earthen causeway, the
// gravel promenade under cherry trees, then the park: an Inari shrine (left),
// the training ring (centre), the koi pond with its little bridge (right) and
// the park entrance (bottom right).
import { Scene2D } from '../../px/scene2d.js';
import { Pen, C, shift, mix, newSurf } from '../../px/paint.js';
import { noise2 } from '../../px/surface.js';
import * as PR from '../../px/props.js';
import * as PK from '../../px/props_castle.js';

const K = PK.K;
export const CASTLE_PARK = { w: 900, h: 540 };
// layout rows (painted y)
const BAILEY = 108, WALL_TOP = 124, WALL_FOOT = 200, MOAT_END = 240, PROM0 = 244, PROM1 = 278;
const GATE = [300, 356];                      // causeway / gate gap in the wall
const RING = [434, 368, 62, 34];              // training ring centre + radii
const R = Math.round;

// ------------------------------------------------------------------ mask helpers
function mkMask(W, H) { return new Uint8Array(W * H); }
function capsule(m, W, H, pts, hw, o = {}) {
  const jit = o.jitter ?? 2, seed = o.seed || 1, v = o.v ?? 1;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let y = Math.max(0, Math.floor(y0 - hw - jit)); y <= Math.min(H - 1, Math.ceil(y1 + hw + jit)); y++)
    for (let x = Math.max(0, Math.floor(x0 - hw - jit)); x <= Math.min(W - 1, Math.ceil(x1 + hw + jit)); x++) {
      let d = Infinity;
      for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); }
      if (d < hw + (noise2(x / 5, y / 5, seed) - 0.5) * jit * 2) m[y * W + x] = v;
    }
}
function blob(m, W, H, cx, cy, rx, ry, o = {}) {
  const pw = o.pow || 2, jit = o.jitter ?? 0.08, seed = o.seed || 2, v = o.v ?? 1;
  for (let y = Math.max(0, Math.floor(cy - ry - 4)); y <= Math.min(H - 1, Math.ceil(cy + ry + 4)); y++)
    for (let x = Math.max(0, Math.floor(cx - rx - 4)); x <= Math.min(W - 1, Math.ceil(cx + rx + 4)); x++) {
      const e = Math.pow(Math.abs((x - cx) / rx), pw) + Math.pow(Math.abs((y - cy) / ry), pw);
      if (e < 1 + (noise2(x / 6, y / 6, seed) - 0.5) * jit * 2) m[y * W + x] = v;
    }
}
function rectMask(m, W, x, y, w, h, v = 1) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && i < W) m[j * W + i] = v; }

export function buildCastlePark(o = {}) {
  const W = CASTLE_PARK.w, H = CASTLE_PARK.h, night = !!o.night;
  const sc = new Scene2D({ w: W, h: H, viewW: o.viewW || 480, viewH: o.viewH || 270, sun: [0.55, 0.28], shadowAlpha: 0.34, shadowColor: '#3a2a52' });
  const g = new Pen(sc.ground, 1615), ov = new Pen(sc.overlay, 77);

  // ================================================================ backdrop flat: sky, city haze, keep
  g.vgrad(0, 0, W, BAILEY + 4, night ? ['#141c3a', '#1e2a52', '#2e3c6a', '#4a4a78'] : [K.sky0, K.sky1, K.sky2, K.sky3, K.sky4]);
  // cumulus banks lit from the upper left
  const cloud = (cx, cy, w, h, seed) => {
    const p = new Pen(sc.ground, seed), parts = [];
    for (let k = 0; k < Math.round(w / 9); k++) { const t = k / Math.max(1, Math.round(w / 9) - 1), r = h * (0.35 + 0.65 * Math.sin(t * Math.PI)) * p.rand(0.7, 1); parts.push([cx - w / 2 + t * w, cy - r * 0.35, r]); }
    for (const [x, y, r] of parts) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const X = R(x + i), Y = R(y + j); if (Y > cy + 2 || i * i + j * j > r * r) continue;
      const l = -(i * 0.6 + j * 0.8) / r + (noise2(X / 3, Y / 3, seed) - 0.5) * 0.3;
      p.px(X, Y, night ? (l > 0.2 ? '#4a5280' : '#38406a') : l > 0.35 ? K.cloud : l > -0.15 ? K.cloud1 : l > -0.55 ? K.cloud2 : K.cloud3);
    }
    if (!night) p.hl(R(cx - w * 0.42), R(cx + w * 0.42), R(cy + 2), K.cloud3);
  };
  cloud(120, 58, 190, 30, 3); cloud(60, 74, 90, 16, 4); cloud(300, 40, 70, 12, 5); cloud(780, 34, 120, 18, 6); cloud(860, 58, 80, 14, 8); cloud(420, 22, 46, 8, 9);
  // far city: hazy blocks, the OBP glass towers to the right of the keep (2050)
  for (let x = 0; x < W; x += g.ri(10, 22)) { const h = g.ri(6, 18), w = g.ri(10, 22); g.rect(x, BAILEY - 6 - h, w, h + 8, night ? '#2a3058' : mix('#a8bccc', K.sky3, 0.45)); if (!night) g.hl(x, x + w - 1, BAILEY - 6 - h, mix('#c8d8e0', K.sky3, 0.4)); }
  const tower = (x, top, w, col) => {
    const c0 = night ? '#2c3460' : mix(col, K.sky2, 0.5), c1 = night ? '#232a50' : mix(shift(col, -0.7), K.sky2, 0.45), lit = night ? '#ffe2a0' : mix('#e8f4fa', K.sky2, 0.3);
    g.rect(x, top, w, BAILEY - top, c0); g.rect(x + R(w * 0.62), top, w - R(w * 0.62), BAILEY - top, c1);
    for (let y = top + 3; y < BAILEY; y += 3) for (let i = x + 2; i < x + w - 1; i += 3) if (night ? g.chance(0.35) : (i + y) % 7 === 0) g.px(i, y, lit);
    g.hl(x, x + w - 1, top, night ? '#4a5490' : mix('#f4fbff', K.sky2, 0.2));
    for (let k = 0; k < w + BAILEY - top; k += 9) for (let j = 0; j < 3; j++) { const xx = x + k - j, yy = top + j + 4; if (xx >= x && xx < x + w && yy < BAILEY) g.px(xx, yy + (k % 18), night ? c0 : mix('#ffffff', c0, 0.5)); }
  };
  tower(706, 30, 22, '#7896b4'); tower(734, 44, 30, '#86a0b8'); tower(770, 22, 18, '#6a88a8'); tower(792, 52, 26, '#8aa4bc'); tower(828, 40, 20, '#7a94b0'); tower(860, 60, 34, '#90a8bc');
  g.vl(779, 10, 21, night ? '#4a5490' : mix('#8aa0b8', K.sky2, 0.4)); g.px(779, 9, '#ff6a6a');
  // tiny holo ad on a tower top (very faint by day)
  for (let x = 736; x < 762; x++) for (let y = 34; y < 41; y++) g.blend(x, y, K.holo, night ? 0.55 : 0.18);
  g.text('OBP', 740, 35, night ? K.holoL : mix(K.holo2, K.sky2, 0.4), { mini: true });
  // distant treeline of the inner bailey (soft, hazy, part of the backdrop); a gap shows the keep's stone base
  {
    const cl = []; for (let x = -10; x < W + 10; x += 9) { if (x > 506 && x < 614) continue; cl.push([x + g.rand(-3, 3), BAILEY - 9 + g.rand(-5, 3), g.rand(7, 12), g.rand(0, 6)]); }
    for (const x of [500, 512, 608, 620]) cl.push([x, BAILEY - 4, 9, 1]);
    PK.canopy(g, cl, night ? ['#141c2a', '#1a2434', '#22303c', '#2a3a44', '#344a4c'] : ['#4a6a60', '#58786a', '#6a8a74', '#86a27e', '#a4b88c'], { cx: W / 2, cy: BAILEY - 14, RX: W / 2, RY: 14, seed: 41, tex: 0.06, marks: 0 });
  }
  if (!night) for (let y = 0; y < BAILEY; y++) for (let x = 0; x < W; x++) { const v = sc.ground.data[y * W + x]; if (v >>> 24) g.blend(x, y, '#dceaf0', 0.1); }
  // the keep, standing on its own stone base behind the treeline
  PK.keep(g, 560, 96, { night });
  // the treeline closes in again in front of the base corners
  PK.canopy(g, [[498, 104, 9, 1], [508, 107, 7, 2], [622, 104, 9, 3], [612, 107, 7, 4]], ['#4a6a60', '#58786a', '#6a8a74', '#86a27e', '#a4b88c'], { cx: 560, cy: 100, RX: 80, RY: 10, seed: 42, tex: 0.06, marks: 0 });
  if (!night) for (let y = 0; y < BAILEY; y++) for (let x = 470; x < 650; x++) g.blend(x, y, '#e4eef2', 0.04);

  // ================================================================ bailey top (floor at wall height)
  for (let y = BAILEY; y < WALL_TOP; y++) for (let x = 0; x < W; x++) {
    const n = noise2(x / 14, y / 6, 51), t = (y - BAILEY) / (WALL_TOP - BAILEY);
    g.px(x, y, n > 0.62 ? '#7e9a56' : n > 0.4 ? '#6a8a4c' : '#587a46');
    if (t > 0.85) g.px(x, y, noise2(x / 5, 1, 52) > 0.5 ? '#9a8a6a' : '#86765e');      // earthen lip above the capstones
  }
  for (let k = 0; k < 160; k++) { const x = g.ri(0, W - 1), y = g.ri(BAILEY + 2, WALL_TOP - 4); PK.tuft(g, x, y, g.chance(0.5) ? 1 : 2); }
  // bushes along the bailey edge, painted low
  for (let x = 6; x < W; x += g.ri(18, 34)) { if (x > GATE[0] - 8 && x < GATE[1] + 8) continue; const s = PK.shrub({ w: g.ri(20, 34), h: g.ri(10, 14), seed: x, ramp: ['#2e4a3c', '#3a5a40', '#4e7448', '#6a8e52', '#8aa864'] }); g.put(s.surf, x - (s.surf.w >> 1), WALL_TOP - s.surf.h + 2); }

  // ================================================================ ishigaki wall + gate
  PK.ishigaki(g, 0, GATE[0], WALL_TOP, WALL_FOOT, { seed: 21 });
  PK.ishigaki(g, GATE[1], W, WALL_TOP, WALL_FOOT, { seed: 22 });
  // gap: masugata passage floor + koraimon gate; through it, the Octopus Stone in the enclosure wall
  {
    const [a, b] = GATE, GB = 156;                        // GB: gate threshold row
    for (let y = GB; y < WALL_FOOT; y++) for (let x = a; x < b; x++) g.px(x, y, noise2(x / 5, y / 3, 71) > 0.5 ? K.st2 : '#a49e92');
    for (let y = GB + 4, k = 0; y < WALL_FOOT; y += 6 + (k++ % 2) * 2) { g.hl(a, b - 1, y, K.st4); g.hl(a, b - 1, y + 1, K.st1); for (let x = a + (k % 2 ? 7 : 0); x < b; x += 14) g.vl(x, y - 5, y, K.st4); }
    g.wash(a, GB, b - a, 6, '#2a2040', 0.3);
    // inner enclosure seen through the open gate: the giant stone with its octopus mottle
    const ix0 = a + 10, ix1 = b - 10, iy0 = 128, iy1 = GB;
    for (let y = iy0; y < iy1; y++) for (let x = ix0; x < ix1; x++) {
      const u = (x - ix0) / (ix1 - ix0), v = (y - iy0) / (iy1 - iy0), l = -(u * 0.5 + v * 0.7) + noise2(x / 6, y / 6, 61) * 0.35;
      g.px(x, y, l > -0.15 ? '#c2bcae' : l > -0.5 ? '#b2ac9e' : '#a09a8e');
    }
    const oc = '#9c968a';
    g.ell(ix0 + 9, iy0 + 15, 4, 3, oc); g.px(ix0 + 8, iy0 + 14, '#c4beb0');
    for (let k = 0; k < 5; k++) { let px0 = ix0 + 9, py0 = iy0 + 17; for (let s2 = 0; s2 < 6; s2++) { px0 += Math.cos(0.3 + k * 0.6 + s2 * 0.3) * 1.1; py0 += 0.7; g.px(R(px0 - k * 0.5 + 1), R(py0), oc); } }
    g.hl(ix0, ix1 - 1, iy1 - 1, '#8a857a'); g.wash(ix0, iy1 - 4, ix1 - ix0, 3, '#2a2040', 0.25);
    // posts, tie beam, folded-back leaves with iron straps
    const gx0 = a + 3, gx1 = b - 3;
    for (const x of [gx0, gx1 - 7]) { g.rect(x, 124, 7, GB - 124, K.wood2); g.vl(x, 124, GB - 1, K.wood1); g.vl(x + 1, 124, GB - 1, K.wood); g.vl(x + 6, 124, GB - 1, K.wood3); for (const yy of [132, 144]) { g.rect(x, yy, 7, 2, '#2e2a34'); g.px(x + 2, yy, '#9a9aa8'); g.px(x + 5, yy, '#9a9aa8'); } g.rect(x - 1, GB - 3, 9, 3, K.st3); g.hl(x - 1, x + 7, GB - 3, K.st1); }
    g.rect(gx0, 124, gx1 - gx0, 4, K.wood2); g.hl(gx0, gx1 - 1, 124, K.wood1); g.hl(gx0, gx1 - 1, 127, K.wood3);
    for (const [x, dark] of [[gx0 + 7, false], [gx1 - 11, true]]) { g.rect(x, 128, 4, GB - 128, dark ? K.wood3 : K.wood2); g.vl(x, 128, GB - 1, dark ? K.wood2 : K.wood1); for (const yy of [133, 141, 149]) g.hl(x, x + 3, yy, '#2e2a34'); }
    // rope barrier + restoration notice
    for (let x = gx0 + 11; x < gx1 - 11; x++) g.px(x, 146 + R(Math.sin((x - gx0 - 11) / (gx1 - gx0 - 22) * Math.PI) * 2), K.verm);
    g.block(a + 22, 141, 12, 7, '#f4e8cc', { line: K.wood3 }); g.hl(a + 24, a + 31, 143, K.verm); g.hl(a + 24, a + 30, 145, '#6a5a50');
    // gabled tile roof riding over the beam
    const cx = (a + b) / 2;
    for (let j = 0; j < 10; j++) { const hw = (b - a) / 2 + 1 + j * 0.7; for (let x = R(cx - hw); x <= R(cx + hw); x++) { const u = (x - cx) / hw, rib = (x - R(cx)) % 2 === 0; g.px(x, 112 + j, j === 0 ? '#8a8a9a' : u < -0.6 ? (rib ? '#6a6a7a' : '#7a7a8a') : u > 0.55 ? (rib ? '#34343e' : '#3e3e4a') : (rib ? '#4a4a58' : '#585868')); } }
    g.hl(R(cx - (b - a) / 2 - 7), R(cx + (b - a) / 2 + 7), 121, '#2a2632'); g.wash(gx0, 122, gx1 - gx0, 2, '#1a1018', 0.45);
    g.rect(R(cx - 14), 109, 29, 3, '#3a3a48'); g.hl(R(cx - 14), R(cx + 14), 109, '#9a9aaa');
    g.px(R(cx - 15), 107, K.gold); g.px(R(cx - 15), 108, K.gold2); g.px(R(cx + 15), 107, K.gold); g.px(R(cx + 15), 108, K.gold2);
    for (const s2 of [-1, 1]) { const ex = R(cx + s2 * ((b - a) / 2 + 8)); g.px(ex, 120, '#5a5a6a'); g.px(ex + s2, 119, '#7a7a8a'); }
    // wall ends: dressed corner stones
    PK.wallCorner(g, a - 1, WALL_TOP, WALL_FOOT, 1, { flare: 3 });
    PK.wallCorner(g, b, WALL_TOP, WALL_FOOT, -1, { flare: 3 });
    g.washPoly([[a, GB], [a + 12, GB], [a + 6, WALL_FOOT], [a, WALL_FOOT]], '#2a2040', 0.3);
  }
  // capstone line + shade under the bailey lip
  g.wash(0, WALL_TOP + 2, W, 3, '#2a2040', 0.25);

  // ================================================================ moat
  for (let y = WALL_FOOT; y < MOAT_END; y++) {
    const t = (y - WALL_FOOT) / (MOAT_END - WALL_FOOT);
    for (let x = 0; x < W; x++) {
      if (x >= GATE[0] + 2 && x < GATE[1] - 2) continue;
      // reflection of the wall above, rippled and sunk into the green
      const ry = WALL_FOOT - 1 - R((y - WALL_FOOT) * 1.7), rx = x + R(Math.sin(y * 1.9 + x * 0.04) * 1.6);
      const src = sc.ground.get(Math.max(0, Math.min(W - 1, rx)), Math.max(WALL_TOP, ry));
      const rc = [src & 255, (src >>> 8) & 255, (src >>> 16) & 255];
      const base = t < 0.45 ? (noise2(x / 18, y / 3, 81) > 0.55 ? K.w2 : K.w3) : t < 0.8 ? K.w2 : K.w1;
      const refl = mix(hexRGB(rc), base, 0.72);
      g.px(x, y, (t < 0.6) ? refl : base);
    }
  }
  // sky glints + ripple dashes, wall-foot shade and a wet line
  for (let k = 0; k < 120; k++) { const x = g.ri(0, W - 6), y = g.ri(WALL_FOOT + 4, MOAT_END - 3); if (x > GATE[0] - 4 && x < GATE[1] + 4) continue; const l = g.ri(2, 6); g.hl(x, x + l, y, y > WALL_FOOT + 22 ? K.w0 : mix(K.w1, K.w0, 0.5)); if (g.chance(0.3)) g.px(x + 1, y, K.wH); }
  g.hl(0, W - 1, WALL_FOOT, '#3a4a40'); g.wash(0, WALL_FOOT + 1, W, 4, '#1e2a30', 0.35);
  // lily pads and lotus flowers in drifts near both banks
  const pad = (x, y, r) => { g.ell(x, y, r, r * 0.55, '#6a9a48'); g.ell(x - 0.5, y - 0.5, r * 0.6, r * 0.3, '#8ab85a'); g.line(x, y, x + R(r), y - 1, K.w3); g.hl(R(x - r) + 1, R(x + r) - 1, R(y + r * 0.55), '#3e6a3a'); };
  for (const [cx, cy, n] of [[60, 226, 9], [190, 232, 7], [470, 228, 10], [620, 210, 6], [860, 230, 8], [250, 206, 5]]) for (let k = 0; k < n; k++) { pad(cx + g.rand(-22, 22), cy + g.rand(-4, 5), g.rand(2.2, 3.6)); }
  for (const [x, y] of [[54, 223], [478, 226], [866, 228], [196, 230]]) { g.px(x, y - 1, '#f6b8d0'); g.px(x + 1, y - 1, '#ffe0ec'); g.px(x, y, '#e890b0'); g.px(x + 1, y, '#f6b8d0'); g.px(x, y - 2, '#ffffff'); }
  // fallen petals floating on the water
  for (let k = 0; k < 90; k++) { const x = g.ri(0, W - 2), y = g.ri(WALL_FOOT + 8, MOAT_END - 2); if (x > GATE[0] - 2 && x < GATE[1] + 2) continue; g.px(x, y, g.chance(0.5) ? K.sk1 : K.sk0); if (g.chance(0.3)) g.px(x + 1, y, K.sk2); }
  // a pair of ducks with wakes
  for (const [x, y, c] of [[540, 216, '#8a6a4a'], [552, 220, '#6a5a4a']]) { g.ell(x, y, 3, 1.6, c); g.px(x - 3, y - 1, '#2a6a4a'); g.px(x - 3, y - 2, '#2a6a4a'); g.px(x - 4, y - 1, K.mustard || '#d8a83e'); g.hl(x + 2, x + 9, y + 1, K.w0); g.hl(x + 5, x + 12, y + 2, K.w1); }
  // causeway (earthen bridge) across the moat
  {
    const [a, b] = GATE;
    PK.gravel(g, (() => { const m = mkMask(W, H); rectMask(m, W, a + 4, WALL_FOOT, b - a - 8, MOAT_END - WALL_FOOT + 4); return m; })(), W, H, { seed: 31 });
    for (let y = WALL_FOOT; y < MOAT_END + 4; y += 6) for (const x of [a, b - 4]) { g.block(x, y, 4, 5, K.st1, { line: false }); g.hl(x, x + 3, y, K.st0); g.hl(x, x + 3, y + 5, K.joint); }
    g.wash(b, WALL_FOOT, 8, MOAT_END - WALL_FOOT, '#1e2a30', 0.35);
    for (let y = WALL_FOOT + 3; y < MOAT_END; y += 3) g.hl(a - 6, a - 2, y, K.w1);
  }

  // ================================================================ kerb + promenade + park ground
  for (let x = 0; x < W; x += 1) for (let y = MOAT_END; y < PROM0; y++) { if (x >= GATE[0] && x < GATE[1]) continue; g.px(x, y, y === MOAT_END ? K.st0 : y === PROM0 - 1 ? K.st3 : K.st1); }
  for (let x = 0; x < W; x += g.ri(14, 22)) if (x < GATE[0] || x > GATE[1]) g.vl(x, MOAT_END, PROM0 - 1, K.st4);
  const gravM = mkMask(W, H), dirtM = mkMask(W, H), pondM = mkMask(W, H), lawnM = mkMask(W, H), paveM = mkMask(W, H);
  rectMask(gravM, W, 0, PROM0, W, PROM1 - PROM0);
  capsule(gravM, W, H, [[0, PROM1 - 4], [W, PROM1 - 4]], 4, { jitter: 3, seed: 3 });
  capsule(gravM, W, H, [[808, 276], [806, 360], [810, 450], [808, 545]], 19, { seed: 4 });
  capsule(gravM, W, H, [[110, 472], [300, 476], [500, 470], [700, 476], [808, 470]], 13, { seed: 5 });
  capsule(gravM, W, H, [[128, 330], [128, 470]], 15, { seed: 6 });
  blob(gravM, W, H, 128, 352, 50, 28, { seed: 7 });
  capsule(gravM, W, H, [[594, 370], [630, 370]], 10, { seed: 8 }); capsule(gravM, W, H, [[748, 370], [808, 370]], 10, { seed: 9 });
  capsule(gravM, W, H, [[434, 276], [434, 300]], 14, { seed: 10 }); capsule(gravM, W, H, [[434, 436], [434, 466]], 14, { seed: 11 });
  blob(gravM, W, H, 808, 524, 46, 18, { seed: 12 });
  blob(dirtM, W, H, RING[0], RING[1], 174, 78, { pow: 3.2, seed: 13, jitter: 0.12 });
  blob(pondM, W, H, 688, 322, 50, 30, { seed: 14 }); blob(pondM, W, H, 690, 418, 52, 28, { seed: 15 });
  blob(pondM, W, H, 690, 370, 38, 26, { seed: 16, pow: 2.6 });
  for (let i = 0; i < W * H; i++) { const y = (i / W) | 0; if (y >= PROM1 - 6 && !dirtM[i] && !pondM[i]) lawnM[i] = 1; if (dirtM[i] || pondM[i]) gravM[i] = gravM[i] && !pondM[i] && !dirtM[i] ? 1 : 0; }
  PK.lawn(g, lawnM, W, H, { seed: 17, flowers: 90 });
  PK.gravel(g, gravM, W, H, { seed: 18 });
  for (let i = 0; i < W * H; i++) if (gravM[i]) lawnM[i] = 0;
  // granite kerb along the park side of the promenade (broken where paths join)
  for (let x = 0; x < W; x++) {
    if ((x > 412 && x < 456) || (x > 786 && x < 830) || (x > 168 && x < 204)) continue;
    const y = PROM1 - 1;
    g.px(x, y, (x % 11) === 0 ? K.st4 : K.st1); g.px(x, y - 1, (x % 11) === 0 ? K.st3 : K.st0); g.px(x, y + 1, K.st4);
  }
  // drain covers + a manhole on the paths, worn wheel tracks along the promenade
  const grate = (x, y) => { g.rect(x, y, 9, 5, '#5a5a66'); for (let i = x + 1; i < x + 9; i += 2) g.vl(i, y + 1, y + 3, '#2e2e38'); g.hl(x, x + 8, y, '#8a8a9a'); };
  grate(804, 330); grate(806, 432); grate(560, 268);
  g.ell(812, 392, 7, 3.6, '#6a6a76'); g.ell(812, 392, 5.5, 2.6, '#8a8a96'); for (let k = -4; k <= 4; k += 2) g.px(812 + k, 392, '#5a5a66'); g.text('大阪', 806, 390, '#5a5a66', { jpSize: 5 });
  for (let x = 0; x < W; x += 1) { if (x > GATE[0] - 4 && x < GATE[1] + 4) continue; if (noise2(x / 9, 5, 3) > 0.42) { g.px(x, 258, K.gr2); g.px(x, 266, K.gr2); } }
  // stone-flagged approach (sando) to the shrine
  for (let y = 336; y < 462; y += 9) { const off = ((y / 9) | 0) % 2 ? 3 : 0; for (const [x, w] of [[118 + off, 10], [129 + off, 9]]) { g.block(x, y, w, 7, (x + y) % 3 ? K.st1 : K.st2, { line: K.st4 }); g.hl(x, x + w - 1, y, K.st0); } }
  // training ground
  PK.packedDirt(g, dirtM, W, H, { seed: 19, centre: [RING[0], RING[1]] });
  paintDohyo(g, ...RING);
  // training marks: footprint trails, tyre-drag ruts, scattered straw, a puddle by the rack
  const foot = (x, y) => { g.px(x, y, K.d3); g.px(x + 1, y, K.d3); g.px(x, y + 1, K.d2); };
  for (const [x0, y0, dx, dy, n] of [[300, 330, 6, 2, 9], [520, 330, -5, 3, 10], [560, 420, -6, -1, 8], [330, 420, 6, -2, 7]]) for (let k = 0; k < n; k++) { const x = R(x0 + dx * k), y = R(y0 + dy * k + (k % 2) * 3); if (dirtM[y * W + x]) foot(x, y); }
  for (let k = 0; k < 70; k++) { const a = g.rand(0, 6.28), r = g.rand(0, 40), x = R(584 + Math.cos(a) * r), y = R(372 + Math.sin(a) * r * 0.7); if (!dirtM[y * W + x]) continue; g.px(x, y, K.straw1); if (g.chance(0.5)) g.px(x + 1, y + (g.chance(0.5) ? 1 : -1), K.straw2); }
  for (let k = 0; k < 16; k++) { const x = 500 + k * 5, y = 418 + R(Math.sin(k * 0.6) * 3); for (const dy of [-2, 2]) { g.px(x, y + dy, K.d3); g.px(x + 1, y + dy - 1, K.d3); g.px(x + 1, y + dy + 1, K.d3); } }
  g.ell(410, 320, 9, 3, '#8a9aa8'); g.ell(408, 319, 5, 1.5, '#b4c4d0'); g.hl(404, 410, 318, '#dce8f0'); g.hl(401, 419, 323, K.d3);
  // koi pond
  paintPond(g, pondM, W, H);
  // bridge deck (rails are sprites so creatures walk between them)
  paintBridgeDeck(g, 620, 756, 362, 378);
  // petals scattered under the cherry trees + on the promenade
  const SAKURA_AT = [[52, 286], [236, 288], [600, 288], [760, 300], [112, 548], [560, 300]];
  for (const [sx, sy] of SAKURA_AT) for (let k = 0; k < 120; k++) { const x = R(sx + g.rand(-60, 70)), y = R(sy - 12 + g.rand(-26, 30)); if (y < PROM0 || y >= H || x < 0 || x >= W || pondM[y * W + x]) continue; g.px(x, y, g.chance(0.6) ? K.sk1 : K.sk0); if (g.chance(0.25)) g.px(x + 1, y, K.sk2); }
  // hanami picnic: blue tarp, bento, cups, shoes
  {
    const x = 22, y = 494, w = 66, h = 28;
    g.rect(x, y, w, h, '#3a6ec0'); for (let i = x + 8; i < x + w; i += 16) g.vl(i, y, y + h - 1, '#4a80d0'); for (let j = y + 7; j < y + h; j += 14) g.hl(x, x + w - 1, j, '#4a80d0');
    g.hl(x, x + w - 1, y, '#6a9ae0'); g.vl(x, y, y + h - 1, '#6a9ae0'); g.hl(x, x + w - 1, y + h - 1, '#2a4a8a'); g.vl(x + w - 1, y, y + h - 1, '#2a4a8a');
    g.px(x + w - 2, y + 1, '#c8c8d0'); g.px(x + 1, y + h - 2, '#c8c8d0');
    g.wash(x + w, y + 2, 2, h, '#2a2040', 0.3); g.wash(x + 2, y + h, w, 1, '#2a2040', 0.3);
    const bento = (bx, by) => { g.block(bx, by, 12, 8, '#2a2226', { line: '#160e14' }); g.rect(bx + 1, by + 1, 10, 6, '#8a1e24'); g.rect(bx + 2, by + 2, 4, 4, '#f8f4ec'); g.px(bx + 3, by + 3, '#e5383b'); g.rect(bx + 7, by + 2, 3, 2, '#e8c040'); g.rect(bx + 7, by + 4, 3, 2, K.g2); g.px(bx + 8, by + 4, '#f08a4a'); };
    bento(x + 14, y + 8); bento(x + 30, y + 12);
    for (const [cx, cy] of [[x + 48, y + 9], [x + 52, y + 15], [x + 10, y + 19]]) { g.rect(cx, cy, 3, 3, '#f4f0e8'); g.px(cx + 1, cy, '#8ac8e8'); g.px(cx + 2, cy + 2, '#c8c4bc'); }
    g.rect(x + 22, y + 22, 7, 2, '#6a3a2a'); g.rect(x + 22, y + 20, 7, 2, '#c87a5a');            // a folded zabuton
    for (const [cx, cy, c] of [[x - 6, y + 10, '#e5383b'], [x - 6, y + 14, '#e5383b'], [x - 7, y + 20, '#f4f0e8'], [x - 7, y + 24, '#f4f0e8']]) { g.rect(cx, cy, 5, 2, c); g.px(cx + 4, cy + 1, shift(c, -1.4)); }
    g.text('♪', x + 52, y + 20, '#ffd23a');
  }
  // flowerbeds: tulips and pansies in neat rows
  PK.flowerbed(g, 158, 430, 74, 14, ['#e5383b', '#ffd23a', '#f4f0e8']);
  PK.flowerbed(g, 762, 396, 22, 46, ['#f070b0', '#ffffff', '#9a7ae0']);
  PK.flowerbed(g, 836, 476, 54, 12, ['#ffd23a', '#ff8a3a']);
  PK.flowerbed(g, 650, 500, 60, 12, ['#9a7ae0', '#f4f0e8', '#f070b0']);
  // a second picnic: tarp, boombox, cooler, cups, a forgotten sandal
  {
    const x = 288, y = 500, w = 58, h = 24;
    g.rect(x, y, w, h, '#4a7ad0'); for (let i = x + 9; i < x + w; i += 14) g.vl(i, y, y + h - 1, '#5a8ae0'); g.hl(x, x + w - 1, y + 11, '#5a8ae0');
    g.hl(x, x + w - 1, y, '#7aa6ee'); g.vl(x, y, y + h - 1, '#7aa6ee'); g.hl(x, x + w - 1, y + h - 1, '#2e5aa0'); g.vl(x + w - 1, y, y + h - 1, '#2e5aa0');
    g.wash(x + w, y + 2, 2, h, '#2a2040', 0.3); g.wash(x + 2, y + h, w, 1, '#2a2040', 0.3);
    g.block(x + 6, y + 4, 12, 7, '#3a3440', { line: '#1a1620' }); g.ell(x + 9, y + 7, 2, 2, '#8a8a9a'); g.ell(x + 15, y + 7, 2, 2, '#8a8a9a'); g.px(x + 12, y + 5, '#ff5aa0'); g.hl(x + 7, x + 16, y + 4, '#5a5462');
    g.block(x + 38, y + 4, 13, 9, '#f4f0ea', { line: '#6a7484' }); g.rect(x + 38, y + 4, 13, 3, '#3c6ab8'); g.hl(x + 39, x + 49, y + 4, '#6a8ad0');
    for (const [cx, cy] of [[x + 24, y + 14], [x + 29, y + 16], [x + 22, y + 8]]) { g.rect(cx, cy, 3, 3, '#f4f0e8'); g.px(cx + 1, cy, '#e8c040'); }
    g.rect(x + 30, y + 6, 6, 4, '#c8343a'); g.rect(x + 31, y + 7, 4, 2, '#f8f4ec'); g.px(x + 32, y + 7, '#e5383b');
    g.rect(x + w + 3, y + 18, 5, 2, '#3a3440'); g.px(x + w + 7, y + 19, '#22202a');
  }
  // stepping stones across the lawn from the promenade to the shrine forecourt
  for (const [x, y] of [[196, 290], [188, 300], [182, 311], [172, 322]]) { g.ell(x, y, 5, 2.6, K.st1); g.ell(x - 1, y - 1, 3, 1.2, K.st0); g.hl(x - 4, x + 4, y + 2, K.st4); }
  // a forgotten red ball and a frisbee near the training ground
  g.ell(612, 456, 2.5, 2.5, '#e5383b'); g.px(611, 455, '#ff9a8a'); g.ell(250, 440, 4, 1.6, '#ffd23a'); g.hl(247, 252, 441, '#c8a020');

  // ================================================================ sprites
  const add = (spr, x, y, opt = {}) => sc.add(spr, x, y, opt);
  // --- bailey top: corner turret, pines leaning over the wall
  {
    const s = newSurf(96, 64), p = new Pen(s, 4);
    PK.yagura(p, 48, 62, { w: 36 });
    add({ surf: s, ax: 48, ay: 62 }, 120, 120, { solid: false });
  }
  // plaster-and-tile dobei walls with gun ports along the bailey edge
  const dobei = (x0, x1, y) => {
    const w = x1 - x0, s2 = newSurf(w + 4, 18), p = new Pen(s2, x0);
    p.rect(2, 6, w, 10, K.pl); p.rect(2, 13, w, 3, '#5a5a66'); p.hl(2, w + 1, 13, '#7a7a88');
    for (let x = 2; x < w + 2; x += 3) p.px(x, 15, '#44444e');
    for (let x = 10; x < w - 6; x += 16) { const tri = (x / 16) % 2 < 1; if (tri) { p.px(x + 1, 8, '#3a3a46'); p.hl(x, x + 2, 9, '#3a3a46'); p.hl(x - 1, x + 3, 10, '#3a3a46'); } else p.rect(x, 8, 3, 3, '#3a3a46'); }
    for (let j = 0; j < 5; j++) p.hl(1 + (j < 2 ? 0 : 0), w + 2, 1 + j, j === 0 ? '#8a8a9a' : j === 4 ? '#2e2e38' : j % 2 ? '#5a5a6a' : '#4a4a58');
    for (let x = 2; x < w + 2; x += 2) p.vl(x, 2, 4, '#3e3e4a');
    p.hl(0, w + 3, 5, '#2a2632'); p.wash(2, 6, w, 2, '#3a3448', 0.4);
    p.px(0, 0, '#8a8a9a'); p.px(w + 3, 0, '#6a6a7a');
    add({ surf: s2, ax: 2, ay: 16 }, x0, y, { solid: false });
  };
  dobei(160, 292, 118); dobei(364, 500, 117); dobei(622, 760, 117);
  for (const [x, y, w, h, lean, seed] of [[236, 122, 62, 66, 0.35, 3], [472, 121, 70, 74, -0.25, 7], [690, 122, 58, 62, 0.3, 9], [878, 121, 64, 70, -0.3, 13], [36, 122, 50, 54, 0.25, 15]]) add(PK.pine({ w, h, lean, seed }), x, y, { solid: false });
  for (const [x, y] of [[610, 118], [770, 117]]) add(PK.shrub({ w: 30, h: 16, seed: x, ramp: ['#2e4a3c', '#3a5a40', '#4e7448', '#6a8e52', '#8aa864'] }), x, y, { solid: false });
  // --- moat: boat, egret on a rock
  add(PK.gozabune(), 446, 230, { solid: false });
  {
    const s = newSurf(16, 18), p = new Pen(s, 2);
    p.ell(8, 15, 7, 3, K.st2); p.ell(7, 14, 4, 1.6, K.st1); p.hl(2, 14, 17, K.st4);
    p.rect(6, 4, 4, 6, '#f8f8f4'); p.vl(6, 4, 9, '#ffffff'); p.vl(9, 5, 9, '#d8dce4'); p.px(5, 3, '#f8f8f4'); p.px(4, 2, '#f8f8f4'); p.px(4, 1, '#f8f8f4'); p.px(3, 1, '#e8c040'); p.px(2, 1, '#e8c040');
    p.vl(7, 10, 12, '#2a2a30'); p.vl(9, 10, 12, '#2a2a30'); p.hl(10, 12, 7, '#d8dce4');
    add({ surf: s, ax: 8, ay: 16 }, 196, 214, { solid: false });
  }
  // --- moat railing (posts + two rails) as long low sprites
  const railing = (x0, x1) => {
    const w = x1 - x0, s = newSurf(w, 12), p = new Pen(s, 5);
    for (const y of [2, 6]) { p.hl(0, w - 1, y, K.wood1); p.hl(0, w - 1, y + 1, K.wood2); p.hl(0, w - 1, y - 1, K.wood0); }
    for (let x = 2; x < w - 2; x += 18) { p.rect(x, 0, 3, 12, K.wood1); p.vl(x, 0, 11, K.wood0); p.vl(x + 2, 0, 11, K.wood3); p.hl(x, x + 2, 0, '#d8b080'); }
    add({ surf: s, ax: 0, ay: 11 }, x0, PROM0 - 1, { solid: false });
  };
  railing(0, GATE[0] - 2); railing(GATE[1] + 2, W);
  for (const x of [GATE[0] - 6, GATE[1] + 2]) add(PK.gatePost({}), x + 2, PROM0 + 2);
  // --- promenade: cherry trees, benches facing the moat, lamps, bonbori
  add(PK.sakura({ w: 110, h: 108, seed: 7, lean: 0.08 }), 52, 286, { foot: [5, 2] });
  add(PK.sakura({ w: 96, h: 100, seed: 12, lean: -0.06 }), 236, 288, { foot: [5, 2] });
  add(PK.sakura({ w: 104, h: 104, seed: 19, lean: 0.05 }), 600, 288, { foot: [5, 2] });
  for (const x of [150, 470, 680]) add(PK.parkBench({ back: true }), x, 256);
  add(PR.bicycle({ color: C.mustard }), 628, 262);
  for (const x of [380, 540, 770]) add(PK.solarLamp({ on: night }), x, 280, { foot: [3, 2] });
  const bonX = [110, 160, 290, 340, 400, 520, 650, 700];
  const bonY = 282;
  for (const [i, x] of bonX.entries()) add(PK.bonbori({ on: night, mark: ['桜', '茶', '城', '祭'][i % 4] }), x, bonY, { foot: [2, 1] });
  // --- shrine
  add(PK.leafyTree({ w: 92, h: 104, seed: 31, deep: true }), 40, 336, { foot: [6, 3] });
  add(PK.weepingCherry({ w: 88, h: 96, seed: 37 }), 212, 330, { foot: [6, 3] });
  add(PK.hokora(), 128, 326);
  add(PK.kitsune({}), 104, 348); add(PK.kitsune({ flip: true }), 152, 348);
  add(PK.stoneLantern({ lit: night }), 96, 388); add(PK.stoneLantern({ lit: night }), 160, 388);
  add(PK.torii(), 128, 414, { solid: false });
  add(PK.emaRack(), 198, 356);
  add(PK.chozuya(), 60, 392);
  add(PK.pine({ w: 54, h: 60, lean: 0.4, seed: 23 }), 18, 462, { foot: [4, 2] });
  add(PK.shrub({ w: 34, h: 16, seed: 41, flowers: '#f070b0' }), 218, 400); add(PK.shrub({ w: 26, h: 14, seed: 42, flowers: '#ffffff' }), 66, 444);
  // --- training ground
  add(PK.gondaSign(), 306, 306);
  add(PK.towelRack(), 380, 306);
  add(PK.whiteboard(), 500, 308);
  add(PK.broom(), 404, 304, { solid: false });
  add(PK.sandbags(), 556, 304);
  add(PK.tyreStack(3, { cols: [null, '#e8c040', null] }), 284, 350);
  add(PK.tyreStack(2), 300, 372);
  add(PK.punchBag(), 290, 418);
  for (const [i, x] of [306, 324, 342, 360].entries()) add(PK.tyreArch(['#e5383b', '#f4f0e8', '#3c6ab8', '#e8c040'][i]), x, 444, { solid: false });
  add(PK.strawDummy({}), 584, 338); add(PK.strawDummy({ angry: true, band: '#3c6ab8' }), 594, 392);
  add(PK.crabDummy(), 566, 432);
  add(PK.saltBox(), 352, 334, { solid: false }); add(PK.bucket(), 522, 334, { solid: false });
  add(PR.cone(), 330, 438, { solid: false }); add(PR.cone(), 540, 440, { solid: false });
  add(PK.parkBench({ back: true }), 400, 458); add(PK.parkBench({ back: true }), 478, 458);
  add(PK.camDrone(), 470, 318, { solid: false });
  add(PK.megaphone(), 412, 314, { solid: false });
  for (const [x, y, f] of [[200, 266, false], [208, 270, true], [520, 262, false], [700, 268, true], [712, 264, false]]) add(PK.pigeon({ flip: f }), x, y, { solid: false });
  // --- koi pond: bridge rails, lantern, rocks, iris, a pine leaning over the water
  {
    const rail = (north) => {
      const w = 140, s = newSurf(w, 14), p = new Pen(s, 9);
      for (let x = 0; x < w; x++) { const u = (x - w / 2) / (w / 2), lift = R((1 - u * u) * 3); p.px(x, 3 - lift + 3, K.wood0); p.px(x, 4 - lift + 3, K.wood1); p.px(x, 5 - lift + 3, K.wood2); }
      for (let x = 2; x < w; x += 17) { const u = (x - w / 2) / (w / 2), lift = R((1 - u * u) * 3); p.rect(x, 6 - lift, 3, 8 + lift, K.wood1); p.vl(x, 6 - lift, 13, K.wood0); p.vl(x + 2, 6 - lift, 13, K.wood3); p.rect(x - 1, 4 - lift, 5, 2, north ? K.wood2 : K.wood1); p.hl(x - 1, x + 3, 4 - lift, '#d8b080'); }
      return { surf: s, ax: 0, ay: 13 };
    };
    add(rail(true), 618, 362, { solid: false });
    add(rail(false), 618, 380, { solid: false });
  }
  add(PK.stoneLantern({ lit: night }), 630, 304);
  add(PK.pine({ w: 66, h: 58, lean: -0.7, seed: 29, pads: 5, ax: 0.62 }), 744, 452, { foot: [4, 2] });
  add(PK.sakura({ w: 92, h: 96, seed: 27, lean: -0.05 }), 760, 300, { foot: [5, 2] });
  for (const [x, y, iris] of [[642, 336, true], [742, 330, false], [738, 410, true], [652, 440, false], [700, 296, true], [636, 404, false]]) add(PK.reeds({ w: 14, h: 15, seed: x, iris }), x, y, { solid: false });
  for (const [x, y, w, h] of [[662, 300, 14, 9], [728, 444, 16, 9], [636, 420, 12, 8], [744, 350, 12, 7]]) {
    const s = newSurf(w + 2, h + 2), p = new Pen(s, x);
    p.ell(w / 2 + 1, h / 2 + 1, w / 2, h / 2, K.st2); p.ell(w / 2 - 1, h / 2, w / 3, h / 3.2, K.st1); p.px(R(w / 2 - 2), 2, K.st0); p.px(R(w / 2 - 1), 2, K.st0);
    p.px(R(w / 2 + 2), 2, K.g2); p.px(R(w / 2 + 3), 3, K.g3); PK.selout(p, K.st5);
    add({ surf: s, ax: (w >> 1) + 1, ay: h }, x, y, { solid: false });
  }
  // --- east strip: vending machines, bins, bench, holo map, lamp, entrance
  add(PR.vendingMachine({ color: C.red }), 852, 300); add(PR.vendingMachine({ color: '#3a8a6a' }), 876, 300);
  add(PK.trashBins(), 846, 330);
  add(PK.parkBench({}), 868, 368);
  add(PK.holoBase(), 860, 446);
  add(PK.holoPanel(), 860, 445, { shadow: false, solid: false, z: 2 });
  add(PK.solarLamp({ on: night }), 838, 410, { foot: [3, 2] });
  add(PK.leafyTree({ w: 74, h: 92, seed: 43 }), 890, 542, { foot: [6, 3] });
  add(PK.parkMarker(), 730, 518);
  add(PK.gatePost({ lamp: night }), 782, 534); add(PK.gatePost({ lamp: night }), 834, 534);
  add(PK.shrub({ w: 36, h: 18, seed: 51, flowers: '#f070b0' }), 846, 500); add(PK.shrub({ w: 30, h: 16, seed: 52 }), 762, 498);
  add(PK.crepeTruck(), 560, 526, { foot: [38, 5] });
  {   // a menu A-board and two stools by the truck
    const s2 = newSurf(12, 16), p = new Pen(s2, 3); p.line(2, 15, 5, 1, K.wood2); p.line(9, 15, 6, 1, K.wood3); p.rect(2, 2, 8, 10, '#2a2a30'); p.frame(2, 2, 8, 10, K.wood1); p.text('¥', 4, 3, '#ffd23a', { mini: true }); p.hl(3, 8, 9, '#f4f0e8'); p.px(4, 7, '#f6a8c0'); p.px(6, 7, '#f6a8c0');
    add({ surf: s2, ax: 6, ay: 15 }, 612, 520, { solid: false });
  }
  add(PK.waterStation(), 252, 424);
  add(PK.tamagaki(5, 9), 88, 312, { solid: false }); add(PK.tamagaki(5, 9), 168, 312, { solid: false });
  // --- south: azalea hedges, foreground trees, hanami cherry
  for (const [x, y, f] of [[250, 498, '#f070b0'], [292, 500, null], [362, 500, '#ffffff'], [616, 502, '#ff8ab0'], [680, 500, null]]) add(PK.shrub({ w: 36, h: 18, seed: x, flowers: f }), x, y);
  add(PK.sakura({ w: 112, h: 110, seed: 33, lean: -0.1 }), 112, 548, { foot: [5, 2] });
  add(PK.parkBench({}), 200, 498);
  add(PK.solarLamp({ on: night }), 236, 470, { foot: [3, 2] }); add(PK.solarLamp({ on: night }), 760, 456, { foot: [3, 2] });

  // ================================================================ ropes between bonbori (overlay in 2D, catenaries in 3D)
  sc.wires3d = [];
  for (let i = 0; i + 1 < bonX.length; i++) {
    const a = bonX[i], b = bonX[i + 1]; if (b - a > 60) continue;
    const y0 = bonY - 40; let px = a, py = y0;
    for (let k = 1; k <= 16; k++) { const t = k / 16, x = a + (b - a) * t, y = y0 + Math.sin(t * Math.PI) * 5; ov.line(R(px), R(py), R(x), R(y), '#5a3a3a'); px = x; py = y; }
    sc.wires3d.push({ a: [a, bonY, 40], b: [b, bonY, 40], sag: 5 });
    // little paper flags on the rope
    for (let k = 1; k < 4; k++) { const t = k / 4, x = R(a + (b - a) * t), y = R(y0 + Math.sin(t * Math.PI) * 5); ov.px(x, y + 1, k % 2 ? '#f6a8c0' : '#fff2f4'); ov.px(x, y + 2, k % 2 ? '#dc84a4' : '#f6d8e0'); }
  }
  // the shimenawa around the sacred tree trunk
  for (let x = 32; x < 49; x++) { ov.px(x, 318 + (x % 2), K.straw1); ov.px(x, 319 + (x % 2), K.straw3); }
  for (const x of [36, 44]) for (let k = 0; k < 5; k++) ov.px(x + (k % 2), 321 + k, '#ffffff');
  sc.add({ surf: (() => { const s = newSurf(20, 8), p = new Pen(s, 1); for (let x = 1; x < 18; x++) { p.px(x, 1 + (x % 2), K.straw1); p.px(x, 2 + (x % 2), K.straw3); } for (const x of [5, 13]) for (let k = 0; k < 5; k++) p.px(x + (k % 2), 4 + k % 4, '#ffffff'); return s; })(), ax: 10, ay: 22 }, 40, 337, { only3d: true, shadow: false, solid: false });

  // ================================================================ lights (bloom halos by day, point lights at night)
  sc.glows.push({ x: 860, y: 428, r: 22, color: K.holo, a: night ? 0.6 : 0.32, base: 446, h: 18 });
  sc.glows.push({ x: 852, y: 282, r: 12, color: '#fff4d8', a: 0.25, base: 300, h: 18, light: night });
  sc.glows.push({ x: 876, y: 282, r: 12, color: '#e8fff0', a: 0.22, base: 300, h: 18, light: false });
  if (night) {
    for (const [x, y] of [[380, 280], [540, 280], [770, 280], [838, 410], [236, 470], [760, 456]]) sc.glows.push({ x: x + 4, y: y - 52, r: 20, color: '#fff2d0', a: 0.55, base: y, h: 52 });
    for (const x of bonX) sc.glows.push({ x, y: bonY - 34, r: 12, color: '#ffd8a8', a: 0.45, base: bonY, h: 34 });
    for (const [x, y] of [[96, 388], [160, 388], [630, 304]]) sc.glows.push({ x, y: y - 18, r: 10, color: '#ffd890', a: 0.5, base: y, h: 18, flicker: true });
    sc.glows.push({ x: 560, y: 64, r: 52, color: '#fff4e0', a: 0.16, light: false });            // uplit keep
    for (const [x, y] of [[782, 534], [834, 534]]) sc.glows.push({ x, y: y - 24, r: 10, color: '#fff4d0', a: 0.45, base: y, h: 24 });
  }
  sc.glows.push({ x: 471, y: 290, r: 4, color: '#ff5a5a', a: 0.6, light: false });                 // drone tally light

  // ================================================================ ambient motion
  const petals = []; { const p = new Pen(newSurf(1, 1), 99); for (let k = 0; k < 70; k++) petals.push({ x: p.rand(0, W), y: p.rand(140, H), vx: p.rand(6, 14), vy: p.rand(5, 10), f: p.rand(1, 2.5), ph: p.rand(0, 6), c: p.pick([K.sk0, K.sk1, K.sk1, K.sk2]), w: p.chance(0.3) ? 2 : 1 }); }
  const koi = [
    { cx: 688, cy: 322, rx: 34, ry: 15, sp: 0.35, ph: 0, cols: ['#f4f0e8', '#e5383b', '#f4f0e8', '#e5383b', '#f4f0e8'] },
    { cx: 690, cy: 320, rx: 22, ry: 10, sp: -0.5, ph: 2, cols: ['#ffb040', '#ff9020', '#ff9020', '#e87010', '#ffb040'] },
    { cx: 690, cy: 418, rx: 36, ry: 14, sp: 0.3, ph: 1, cols: ['#ffe48c', '#e8c040', '#e8c040', '#c8a020', '#ffe48c'] },
    { cx: 692, cy: 420, rx: 24, ry: 9, sp: -0.42, ph: 4, cols: ['#f4f0e8', '#2a2632', '#f4f0e8', '#e5383b', '#f4f0e8'] },
    { cx: 686, cy: 414, rx: 16, ry: 7, sp: 0.6, ph: 5, cols: ['#ff7a3a', '#ff5a20', '#f4f0e8', '#ff5a20', '#ff7a3a'] },
  ];
  const glints = []; { const p = new Pen(newSurf(1, 1), 7); for (let k = 0; k < 40; k++) { const x = p.ri(0, W), y = p.ri(WALL_FOOT + 6, MOAT_END - 2); if (x > GATE[0] - 4 && x < GATE[1] + 4) continue; glints.push([x, y, p.rand(0, 6), p.rand(1.5, 3)]); } }
  sc.fx.push((ctx, cam, t) => {
    // water glints on the moat
    ctx.fillStyle = '#f4fff8';
    for (const [x, y, ph, f] of glints) if (Math.sin(t * f + ph) > 0.72) ctx.fillRect(x - cam.x, y - cam.y, Math.sin(t * f + ph) > 0.9 ? 2 : 1, 1);
    // koi circling under the water
    ctx.globalAlpha = 0.9;
    for (const k of koi) {
      const a = t * k.sp + k.ph, x = k.cx + Math.cos(a) * k.rx, y = k.cy + Math.sin(a) * k.ry;
      let dx = -Math.sin(a) * k.rx * Math.sign(k.sp), dy = Math.cos(a) * k.ry * Math.sign(k.sp); const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      for (let i = 0; i < 5; i++) { ctx.fillStyle = k.cols[i]; ctx.fillRect(Math.round(x - dx * i * 1.3 - cam.x), Math.round(y - dy * i * 1.3 * 0.7 - cam.y), 1, 1); if (i > 0 && i < 3) ctx.fillRect(Math.round(x - dx * i * 1.3 - dy - cam.x), Math.round(y - dy * i * 0.9 + dx * 0.6 - cam.y), 1, 1); }
      ctx.fillStyle = shift(k.cols[4], -0.6); ctx.fillRect(Math.round(x - dx * 7 - cam.x), Math.round(y - dy * 5 - cam.y), 1, 1);
    }
    ctx.globalAlpha = 1;
    // drifting petals
    for (const P of petals) {
      const x = ((P.x + t * P.vx + Math.sin(t * P.f + P.ph) * 5) % W + W) % W, y = ((P.y + t * P.vy - 140) % (H - 140) + H - 140) % (H - 140) + 140;
      ctx.fillStyle = P.c; ctx.fillRect(Math.round(x - cam.x), Math.round(y - cam.y), Math.sin(t * 3 + P.ph) > 0 ? P.w : 1, 1);
    }
    // a few birds gliding over the moat and the bailey
    ctx.fillStyle = '#3a3448';
    for (let k = 0; k < 4; k++) { const bx = ((120 + k * 37 + t * (9 + k)) % (W + 60)) - 30 - cam.x, by = 46 + k * 9 + Math.sin(t * 1.3 + k) * 3 - cam.y, f = Math.sin(t * 6 + k * 2) > 0; ctx.fillRect(Math.round(bx), Math.round(by), 1, 1); ctx.fillRect(Math.round(bx) - 1, Math.round(by) - (f ? 1 : 0), 1, 1); ctx.fillRect(Math.round(bx) + 1, Math.round(by) - (f ? 1 : 0), 1, 1); }
    // a glint off the shachihoko now and then
    if ((t % 3) < 0.35) { ctx.fillStyle = '#fff8d0'; const sx = 544 - cam.x, sy = 14 - cam.y; ctx.fillRect(sx, sy - 2, 1, 5); ctx.fillRect(sx - 2, sy, 5, 1); }
  });

  // ================================================================ diorama terrain: backdrop flat, bailey top, stone wall, moat, park
  sc.terrain = [
    { y0: 0, y1: BAILEY, h0: BAILEY + 76 - 8, h1: 76 - 8 },
    { y0: BAILEY, y1: WALL_TOP, h0: 68, h1: 68 },
    { y0: WALL_TOP, y1: WALL_FOOT, h0: 68, h1: -8 },
    { y0: WALL_FOOT, y1: MOAT_END, h0: -8, h1: -8 },
    { y0: MOAT_END, y1: 100000, h0: 0, h1: 0 },
  ];
  sc.bake();
  return sc;
}
function hexRGB(c) { return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); }

// sumo-style practice ring: a low raised clay platform (dohyo) with a straw-bale ring
// (tawara) on top, a visible front face with straw steps, swept smooth
function paintDohyo(g, cx, cy, rx, ry) {
  const PX = rx + 15, PY = ry + 10, FACE = 5;
  const inTop = (x, y) => Math.pow(Math.abs((x - cx) / PX), 4) + Math.pow(Math.abs((y - cy) / PY), 4) <= 1;
  // front face (south side) first: darker clay with scrape marks, its lit left end
  for (let y = R(cy - PY); y <= R(cy + PY + FACE); y++) for (let x = R(cx - PX - 1); x <= R(cx + PX + 1); x++) {
    if (inTop(x, y) || !inTop(x, y - FACE)) continue;
    const u = (x - cx) / PX, v = y - (cy + PY * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 4)), 0.25));
    g.px(x, y, v > FACE - 1.5 ? K.d4 : u < -0.75 ? '#c49a6c' : (x % 5 === 0 ? K.d3 : '#a8805a'));
  }
  // platform top
  for (let y = R(cy - PY); y <= R(cy + PY); y++) for (let x = R(cx - PX); x <= R(cx + PX); x++) {
    if (!inTop(x, y)) continue;
    const e = Math.pow(Math.abs((x - cx) / PX), 4) + Math.pow(Math.abs((y - cy) / PY), 4);
    const l = -((x - cx) / PX * 0.4 + (y - cy) / PY * 0.6) + noise2(x / 9, y / 6, 91) * 0.25;
    let c = l > 0.3 ? '#e0c294' : l > -0.25 ? '#d2b282' : '#c2a072';
    if (e > 0.88) c = e > 0.96 ? '#e4c898' : '#caa676';
    g.px(x, y, c);
  }
  // swept arcs on the clay (a few clean broom strokes, not noise)
  for (let k = 0; k < 6; k++) { const a0 = k * 1.05 + 0.3, r = 0.3 + (k % 3) * 0.2; for (let s = 0; s < 26; s++) { const a = a0 + s * 0.05; g.px(R(cx + Math.cos(a) * rx * r), R(cy + Math.sin(a) * ry * r), '#e6caa0'); } }
  // shikiri-sen: the two white starting lines
  for (const s of [-1, 1]) for (let j = -4; j <= 3; j++) { g.px(R(cx + s * 9), cy + j, '#fbf8f0'); g.px(R(cx + s * 9) + 1, cy + j, '#e2dccc'); }
  // straw steps cut into the front face
  for (const dx of [-16, 0, 16]) { const x = R(cx + dx), y = R(cy + PY); g.rect(x - 4, y + 1, 9, 3, K.straw1); g.hl(x - 4, x + 4, y + 1, K.straw0); g.hl(x - 4, x + 4, y + 3, K.straw3); g.px(x, y + 2, K.straw4); }
  // bales: a tube around the ellipse, broken into bales with rope ties; gaps at N/S/E/W
  const tube = 3.2;
  for (let y = R(cy - ry - 6); y <= R(cy + ry + 6); y++) for (let x = R(cx - rx - 6); x <= R(cx + rx + 6); x++) {
    const a = Math.atan2((y - cy) / ry, (x - cx) / rx), ex = cx + Math.cos(a) * rx, ey = cy + Math.sin(a) * ry, d = Math.hypot(x - ex, (y - ey) * 1.25);
    if (d > tube) continue;
    const deg = ((a * 180 / Math.PI) + 360) % 360, gap = [0, 90, 180, 270].some((q) => Math.abs(((deg - q + 540) % 360) - 180) < 4);
    if (gap) continue;
    const arcLen = a * (rx + ry) / 2, tie = ((arcLen % 10) + 10) % 10 < 1.3;
    const side = (y - ey) * 1.25 + (x - ex) * 0.35;
    let c = side < -1.4 ? K.straw0 : side < 0.3 ? K.straw1 : side < 1.8 ? K.straw2 : K.straw3;
    if (tie) c = side < 0 ? K.straw2 : K.straw4;
    g.px(x, y, c);
  }
  // shade where the bales sit on the clay (lower right of each bale run) + the platform's cast shadow
  for (let a = 0; a < Math.PI * 2; a += 0.008) { const x = R(cx + Math.cos(a) * (rx + 3.8)), y = R(cy + Math.sin(a) * (ry + 3.4)); if (Math.cos(a) * 0.5 + Math.sin(a) * 0.85 > 0.15) g.blend(x, y, '#6a4a3a', 0.4); }
  for (let y = R(cy - PY); y <= R(cy + PY + FACE + 3); y++) for (let x = R(cx + PX - 2); x <= R(cx + PX + 5); x++) if (!inTop(x, y) && !inTop(x, y - FACE) && inTop(x - 5, y - 4)) g.blend(x, y, '#4a3040', 0.3);
}

// koi pond: shallow rim with pebbles, deep centre, bank shadow, edge rocks, lily pads
function paintPond(g, m, W, H) {
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[y * W + x];
  const depth = (x, y) => { for (let r = 1; r <= 9; r++) for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; if (!inside(R(x + Math.cos(a) * r), R(y + Math.sin(a) * r * 0.7))) return r; } return 10; };
  for (let y = 0; y < H; y++) for (let x = 600; x < 790; x++) {
    if (!inside(x, y)) continue;
    const d = depth(x, y), n = noise2(x / 6, y / 4, 101);
    let c = d <= 2 ? (n > 0.5 ? '#8ab89e' : '#7aa892') : d <= 5 ? K.w1 : d <= 8 ? K.w2 : K.w3;
    if (d <= 3 && (x * 7 + y * 13) % 11 === 0) c = '#a8c8a8';               // pebbles seen through the shallows
    if (!inside(x - 2, y - 3) || !inside(x - 1, y - 2)) c = mix(c, '#24343a', 0.45);   // bank shadow (light from upper left)
    g.px(x, y, c);
  }
  // sky reflection streaks + ripples
  for (let k = 0; k < 40; k++) { const x = g.ri(640, 740), y = g.ri(296, 446); if (!inside(x, y) || !inside(x + 5, y) || depth(x, y) < 4) continue; g.hl(x, x + g.ri(2, 5), y, g.chance(0.5) ? K.w0 : '#9ccabc'); }
  // edge rocks along the rim
  let last = -99;
  for (let y = 0; y < H; y += 1) for (let x = 600; x < 790; x += 1) {
    if (!inside(x, y)) continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    if (!edge || noise2(x / 3, y / 3, 7) < 0.45) continue;
    if (Math.abs(x + y * 3 - last) < 9 && (x + y) % 5) continue;
    if (y > 358 && y < 382 && x > 618 && x < 760) continue;               // under the bridge
    last = x + y * 3;
    const rx = 2.5 + noise2(x, y, 3) * 3, ry = 1.6 + noise2(y, x, 4) * 1.6;
    g.ell(x, y, rx, ry, K.st2); g.ell(x - 0.6, y - 0.6, rx * 0.6, ry * 0.5, K.st1); g.px(R(x - rx * 0.4), R(y - ry * 0.5), K.st0);
    g.hl(R(x - rx) + 1, R(x + rx) - 1, R(y + ry), K.st4);
    if (noise2(x / 2, y / 2, 9) > 0.62) { g.px(R(x), R(y - ry) + 1, K.g2); g.px(R(x) + 1, R(y - ry) + 1, K.g3); }
  }
  // lily pads
  for (const [cx, cy] of [[668, 312], [714, 330], [706, 432], [668, 424], [724, 404]]) for (let k = 0; k < 3; k++) { const x = cx + g.ri(-6, 6), y = cy + g.ri(-3, 3), r = g.rand(2, 3.2); g.ell(x, y, r, r * 0.6, '#5e9a4a'); g.ell(x - 0.5, y - 0.5, r * 0.55, r * 0.3, '#86b85c'); g.px(x + 1, y, K.w3); }
  g.px(712, 329, '#ffe0ec'); g.px(713, 329, '#f6b8d0'); g.px(712, 328, '#ffffff');
}
function paintBridgeDeck(g, x0, x1, y0, y1) {
  // shadow on the water, south beam with an arched underside, posts, then planks
  g.washPoly([[x0 + 6, y1 + 2], [x1 - 2, y1 + 2], [x1 + 6, y1 + 9], [x0 + 12, y1 + 9]], '#1e2a30', 0.4);
  for (let x = x0; x < x1; x++) {
    const u = (x - (x0 + x1) / 2) / ((x1 - x0) / 2), arch = R((1 - u * u) * 4);
    for (let y = y1; y < y1 + 7 - arch; y++) g.px(x, y, y === y1 ? K.wood0 : y < y1 + 3 ? K.wood1 : K.wood2);
    g.px(x, y1 + 7 - arch, K.wood3);
  }
  for (const x of [x0 + 26, R((x0 + x1) / 2) - 1, x1 - 28]) { g.rect(x, y1 + 4, 3, 8, K.wood2); g.vl(x, y1 + 4, y1 + 11, K.wood1); g.hl(x - 1, x + 3, y1 + 12, K.w0); }
  for (let x = x0; x < x1; x += 3) {
    for (let y = y0; y < y1; y++) g.px(x, y, (x / 3) % 4 === 0 ? '#c49064' : '#b8875c');
    for (let y = y0; y < y1; y++) g.px(x + 1, y, '#a87a52');
    g.vl(x + 2, y0, y1 - 1, K.wood2);
    if ((x * 7) % 5 === 0) g.px(x + 1, y0 + 2 + ((x * 3) % (y1 - y0 - 4)), K.wood3);
  }
  g.hl(x0, x1 - 1, y0, K.wood3); g.hl(x0, x1 - 1, y0 + 1, '#d8a878');
}

// ------------------------------------------------------------------ gameplay layer
const say = (app, name, ...lines) => (app.say ? app.say(name, ...lines) : lines.reduce((p, l) => p.then(() => app.ui.say(name, l)), Promise.resolve()));
const FORTUNES = [
  ['大吉 — Great blessing.', '"Your partner will learn a move today that surprises even you."'],
  ['中吉 — Middle blessing.', '"A lost thing returns. Check under the bench by the moat."'],
  ['小吉 — Small blessing.', '"Eat something spicy. Your Tokonmon will follow your lead."'],
  ['末吉 — Future blessing.', '"Patience. The tide in the moat is slow, but it always turns."'],
  ['凶 — Bad luck.', 'You tie the slip to the rack so the fox can keep the bad luck for you.'],
];
const WISHES = [
  '"Please let Kanizumo stop pinching my bag. — Gonda"',
  '"I want to beat the Champion before I turn 12!!"',
  '"For Grandma\'s Lumoth to get better soon."',
  '"Let the takoyaki truck come back on Sundays."',
  '"Pass the League written exam (the multiple choice part)."',
];
export const CASTLE_PARK_MAP = {
  name: 'Osaka Castle Park', music: 'town',
  build(o) {
    const scene = buildCastlePark({ viewW: o.viewW, viewH: o.viewH, night: o.night });
    for (const s of scene.sprites) {
      if (s.solid !== undefined || s.foot) continue;
      const h = s.cv.height;
      if (h < 16) s.solid = false;
    }
    let fortune = 0, wish = 0;
    return {
      scene,
      terrain: scene.terrain,
      walk: [
        [[0, 247], [900, 247], [900, 524], [832, 524], [832, 540], [784, 540], [784, 524], [0, 524]],   // promenade + park
        [[308, 158], [348, 158], [348, 250], [308, 250]],                                               // causeway + gate passage
      ],
      block: [
        [[640, 300], [664, 292], [712, 292], [736, 304], [738, 330], [722, 350], [730, 360], [650, 360], [656, 348], [640, 330]],   // pond, north of the bridge
        [[648, 381], [732, 381], [742, 398], [742, 430], [724, 444], [660, 444], [640, 430], [638, 404]],                           // pond, south of the bridge
        [102, 304, 52, 26],                                                    // shrine
        [111, 408, 7, 6], [138, 408, 7, 6],                                    // torii pillars
        [20, 494, 70, 30], [288, 500, 58, 24],                                 // picnic tarps (somebody's lunch)
      ],
      spawns: { start: [328, 164], ring: [RING[0], RING[1]], gate: [808, 510], bridge: [690, 370], shrine: [128, 380], moat: [328, 230] },
      hotspots: [
        { id: 'castle', x: 328, y: 166, r: 24, label: 'Castle', icon: 'eye', bubbleH: 40, act: (app) => say(app, '', 'Through the old gate the keep rises over the stone walls: white plaster, copper-green roofs, gold catching the afternoon sun.', 'A rope and a polite sign: "Inner bailey closed for the 2050 restoration. The shachihoko thank you for your patience."') },
        { id: 'tako', x: 328, y: 196, r: 18, label: 'Big stone', icon: 'eye', act: (app) => say(app, '', 'Past the gate, the back wall of the stone enclosure is one single slab, bigger than a bus and smooth as a table.', 'In its lower corner the grain swirls into a shape like an octopus. Your partner refuses to look at it directly.') },
        { id: 'shrine', x: 128, y: 340, r: 24, label: 'Shrine', icon: 'star', act: async (app) => { const f = FORTUNES[fortune++ % FORTUNES.length]; await say(app, '', 'You ring the bell, bow twice, clap twice, bow once. The fox statues look pleased.', 'You draw an omikuji fortune slip…', ...f); } },
        { id: 'ema', x: 198, y: 360, r: 20, label: 'Ema', icon: 'eye', act: (app) => say(app, '', 'Wooden wish plaques clack in the breeze. One reads:', WISHES[wish++ % WISHES.length]) },
        { id: 'koi', x: 690, y: 368, r: 26, label: 'Koi', icon: 'drop', act: (app) => say(app, '', 'Koi drift under the bridge: red and white, gold, one that is almost all black.', 'The biggest has a crab-shaped spot on its head. It opens its mouth at you, expecting snacks, and is very disappointed.') },
        { id: 'map', x: 860, y: 450, r: 24, label: 'Park map', icon: 'map', bubbleH: 44, act: (app) => say(app, 'Park Guide', 'Welcome to Osaka Castle Park! You are here: ★ Aoyamon entrance.', 'Inari shrine — west lawn. Koi pond — east. Gonda Training Ground — centre, mind the flying crabs.', 'Drone tours of the keep: 15:00 daily. Please do not battle on the bridge.') },
        { id: 'dummy', x: 592, y: 396, r: 22, label: 'Dummy', icon: 'fist', act: (app) => say(app, '', 'Your partner winds up and slams the straw dummy. THWUMP. Straw everywhere.', 'Someone has drawn an angry face on it in charcoal. It looks angrier now.') },
        { id: 'board', x: 500, y: 312, r: 22, label: 'Tactics', icon: 'eye', act: (app) => say(app, '', 'A whiteboard of tactics in red and blue marker: circles, crosses, arrows pushing out of the ring.', 'In big letters: "押 — PUSH! Don\'t let them get to the edge first!" A crab doodle in the corner gives a thumbs up. Claws up.') },
        { id: 'rack', x: 380, y: 312, r: 20, label: 'Water', icon: 'drop', act: (app) => say(app, '', 'Towels in Gonda red, a row of water bottles and a cooler labelled "TEAM GONDA — HANDS OFF THE MUGICHA".', 'You borrow a towel. It smells of sunscreen and salt.') },
        { id: 'sign', x: 306, y: 310, r: 22, label: 'Sign', icon: 'eye', act: (app) => say(app, '', '権田道場 — GONDA TRAINING GROUND.', 'Small print: "Open to all trainers. Bring water. Leave the ring tidier than you found it. Bow when you enter."') },
        { id: 'tyres', x: 290, y: 358, r: 20, label: 'Tyres', icon: 'fist', act: (app) => say(app, '', 'A stack of old tyres for footwork drills. Your partner hops through all of them, then hops back for style.') },
        { id: 'vend', x: 864, y: 304, r: 22, label: 'Vending', icon: 'coin', act: (app) => app.shop([['ramune', 150], ['matcha', 220], ['takoyaki', 300]], 'The machine chirps: "Stay hydrated, champion!"') },
        { id: 'bench', x: 868, y: 370, r: 20, label: 'Rest', icon: 'heart', act: (app) => app.rest() },
        { id: 'moat', x: 470, y: 258, r: 22, label: 'Moat view', icon: 'eye', act: (app) => say(app, '', 'The moat is the colour of matcha. A gold-roofed tour boat hums past without a sound — electric since 2041.', 'A heron stands on a rock by the wall, perfectly still, pretending not to watch the ducks.') },
      ],
      exits: [{ x: 784, y: 530, w: 48, h: 10, act: (app) => app.travel('plaza', 'start') }],
      npcs: [],
    };
  },
};
