// The Deep Cave's hand-painted pixel textures (src/vx/scenes/cave.js, src/vx/city/districts/cave_*.js).
// Everything is painted at the city's density (32 design pixels per metre, HD canvas) and tiles seamlessly:
//  - rock: sedimentary strata in wavy bands (each layer its own tone, a lit top lip, a shadowed underside),
//    hairline cracks, chipped facets, mineral veins; wet streaks run down from seeps; variants per chamber
//  - floors: wet flagstone-like slabs with puddles (and a roughness map that makes the puddles mirror-smooth),
//    moss over stone, packed mine dirt with gravel and coal dust, the violet geode floor
//  - the Geode's fluorite-studded wall (with an emissive mask), old timber, hemp rope, the lake surface, old
//    painted plank signs, daylight through cracks, the black throat of the mouth
// (the crystals, mushrooms, dripstones, rocks and mine props are voxel sculpts: cave_props.js)
// Textures that give off light carry userData.caveGlow (strength) and, when only part of them glows, a
// userData.caveMask (emissive map); wet ones carry userData.caveRough (a roughness map). cave_build.js reads
// those after the city builder has made the materials.
import * as THREE from '../../../../vendor/three.module.js';
import { TX } from '../build.js';

const { ptex, pixels, fnoise, pnoise, ramp, pick, dark, light, hx, rnd } = TX;
const TAU = Math.PI * 2;
const ROUGH = new Map(), MASK = new Map();

/** a second canvas painted alongside a texture (roughness or emissive mask), same size in texels */
function sideCanvas(W, H, k) { const c = document.createElement('canvas'); c.width = Math.round(W * k); c.height = Math.round(H * k); const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); g.imageSmoothingEnabled = false; return { c, g }; }
function sideTex(cv, base, srgb) {
  const t = new THREE.CanvasTexture(cv); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
/** attach the side maps after ptex (cached by key, so a cache hit gets them too) */
function finish(t, o = {}) {
  const k = String(t.userData.key).split('|')[0];
  if (ROUGH.has(k)) t.userData.caveRough = ROUGH.get(k);
  if (MASK.has(k)) t.userData.caveMask = MASK.get(k);
  if (o.glow !== undefined) t.userData.caveGlow = o.glow;
  if (o.rough !== undefined) t.userData.caveRoughness = o.rough;
  if (o.metal !== undefined) t.userData.caveMetal = o.metal;
  if (o.relief !== undefined) t.userData.caveRelief = o.relief;
  return t;
}
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`; };

// ==================================================================== rock walls
const PALS = {
  // warm sandstone and shale (the entrance, the tunnels)
  brown: ['#5e5248', '#6e6052', '#544a44', '#7a6a58', '#4c4440', '#665a50', '#86725c', '#5a5450', '#70645a'],
  // cold slate (the big cavern, the chasm)
  slate: ['#4a5058', '#56606a', '#40464e', '#5e6a72', '#3a4048', '#525a62', '#6a747a', '#484e56', '#5a6268'],
  // mossy, damp limestone (the grove)
  moss: ['#4e5650', '#5a6458', '#465048', '#64705c', '#3e4640', '#566052', '#6c7a62', '#4a524a', '#5e6656'],
  // iron-stained ochre (the mine)
  ochre: ['#6a5040', '#7a5c44', '#5a463a', '#8a6a4a', '#4e3e34', '#725642', '#94744e', '#5e4a3e', '#80603e'],
  // the geode: dark violet basalt
  geode: ['#3e3448', '#4a3e56', '#362e40', '#56486a', '#30283a', '#463a52', '#5e4e74', '#3a3044', '#4e4260'],
  // the ceiling: darker, sootier
  dark: ['#3c3834', '#46403a', '#34302e', '#4e4640', '#2e2a28', '#423c38', '#56504a', '#3a3632', '#48423e'],
};
/** layered cave rock, 4 × 4 m: wavy strata, cracks, chips, veins and seep streaks */
export const rockTex = (pal = 'brown') => finish(ptex('cave_rock_' + pal, 4, 4, (g, W, H, r, P) => {
  const PAL = PALS[pal] || PALS.brown, T = P.t;
  const bands = []; let y0 = 0;
  while (y0 < H) { let h = 5 + Math.floor(r() * 15); if (H - y0 - h < 5) h = H - y0; bands.push({ y: y0, h, c: PAL[Math.floor(r() * PAL.length)], k: r(), grain: r() < 0.35 }); y0 += h; }
  const bandAt = (yy) => { for (const b of bands) if (yy < b.y + b.h) return b; return bands[bands.length - 1]; };
  const n1 = fnoise(r, 4, 3), n2 = fnoise(r, 8, 2), wv = pnoise(r, 6, 2), ch = pnoise(r, 12, 6);
  const RAMPS = new Map(), rampOf = (c) => { let R = RAMPS.get(c); if (!R) RAMPS.set(c, (R = ramp(c, [-0.36, -0.24, -0.14, -0.05, 0.04, 0.12, 0.22]))); return R; };
  pixels(g, W, H, (x, y) => {
    const u = x / W, v = y / H;
    const wave = Math.sin((u * 2 + 0.13) * TAU) * 2.6 + Math.sin((u * 5 + 0.4) * TAU) * 1.1 + (wv(u, v) - 0.5) * 7;
    const yy = (((y + wave) % H) + H) % H, b = bandAt(yy), t = (yy - b.y) / b.h;
    let s = 0.5 + (n1(u, v) - 0.5) * 0.85 + (n2(u, v) - 0.5) * 0.4 + (b.k - 0.5) * 0.3;
    if (t * b.h < 1.2) s += 0.34;                       // the lit lip of the layer
    else if (t * b.h < 2.4) s += 0.12;
    if ((1 - t) * b.h < 1.4) s -= 0.42;                 // the shadowed underside under the overhang
    if (b.grain) s += (Math.sin((x + wave * 3) * 0.9) > 0.6 ? 0.08 : 0) - (ch(u, v) > 0.72 ? 0.18 : 0);   // bedding laminae, pocks
    return pick(rampOf(b.c), s, x, y);
  });
  // vertical joints and hairline cracks with a chipped rim
  for (let i = 0; i < 10; i++) P.crack(r() * W, r() * H, 10 + r() * 26, dark(PAL[4], 0.5), r, { a: Math.PI / 2 + (r() - 0.5) * 0.9, edge: light(PAL[3], 0.12), branch: 0.06 });
  for (let i = 0; i < 6; i++) P.crack(r() * W, r() * H, 8 + r() * 12, dark(PAL[4], 0.4), r, { a: (r() - 0.5) * 0.6, edge: light(PAL[6], 0.1) });
  // chipped facets: a lit triangle over a shadow
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = r() * H, w = 2 + Math.floor(r() * 4), c = PAL[Math.floor(r() * PAL.length)];
    for (let k = 0; k < w; k++) { P.fwrect(x + k, y + k * 0.5, w - k, T, light(c, 0.2)); P.fwrect(x + k, y + w * 0.5 + k * 0.4, T, T, dark(c, 0.3)); }
  }
  // pale mineral veins (calcite) wandering across the layers
  for (let i = 0; i < 4; i++) P.crack(r() * W, r() * H, 18 + r() * 30, pal === 'geode' ? '#b89ae0' : pal === 'slate' ? '#a8c0c8' : '#d8ccb4', r, { a: r() * TAU, wob: 0.5 });
  // seep streaks: wet stone darkens in vertical runs
  for (let i = 0; i < 7; i++) { const x = r() * W, y = r() * H, L = 12 + r() * 30, w = 1 + Math.floor(r() * 2); P.dither(x, y, w, L, dark(PAL[0], 0.35), (xx, yy) => 0.55 * (1 - (yy - y) / L)); }
  P.speck(60, dark(PAL[4], 0.3), r); P.speck(30, light(PAL[6], 0.18), r);
}), { rough: 0.82, relief: 0.6 });

/** the wet foot of a wall: rock darkened by damp, slick, with moss in the hollows (2 × 1 m, tiles along the wall) */
export const wallFootTex = (pal = 'brown') => finish(ptex('cave_foot_' + pal, 2, 1, (g, W, H, r, P) => {
  const PAL = PALS[pal] || PALS.brown, n = fnoise(r, 4, 3, 2), m = fnoise(r, 6, 2, 3), T = P.t;
  const R = ramp(dark(PAL[0], 0.18), [-0.3, -0.18, -0.08, 0, 0.08, 0.18]), M = ramp(pal === 'geode' ? '#5a4a7a' : '#4a6a3a', [-0.25, -0.1, 0, 0.12, 0.25]);
  pixels(g, W, H, (x, y) => {
    const u = x / W, v = y / H, mv = m(u, v) + (1 - v) * 0.25 - 0.25;
    if (mv > 0.48 && pal !== 'geode') return pick(M, 0.5 + (n(u, v) - 0.5) * 1.4, x, y);
    return pick(R, 0.5 + (n(u, v) - 0.5) * 1.1 + (v < 0.06 ? 0.3 : 0), x, y);
  });
  for (let i = 0; i < 14; i++) { const x = r() * W, L = 6 + r() * (H - 6); P.fwrect(x, 0, T, L, light(PAL[3], 0.18)); P.fwrect(x + T, 0, T, L * 0.7, dark(PAL[0], 0.3)); }
}), { rough: 0.38, relief: 0.4 });

// ==================================================================== floors
/** wet natural slabs (4 × 4 m): periodic Voronoi stones with lit rims, dark joints, puddles that mirror the light */
export const wetFloorTex = (base = '#525860', key = 'wet') => finish(ptex('cave_floor_' + key + base, 4, 4, (g, W, H, r, P) => {
  const pts = []; for (let i = 0; i < 30; i++) pts.push([r() * W, r() * H, r(), r()]);
  const n = fnoise(r, 4, 3), f = pnoise(r, 16), pud = fnoise(r, 3, 3);
  const R = ramp(base, [-0.42, -0.3, -0.18, -0.08, 0, 0.08, 0.16, 0.26]), PUD = ramp(mix(base, '#2a3a4a', 0.6), [-0.3, -0.15, 0, 0.12, 0.3]);
  const cell = (x, y) => {
    let d1 = 1e9, d2 = 1e9, best = null;
    for (const p of pts) {
      let dx = x - p[0], dy = y - p[1]; if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W; if (dy > H / 2) dy -= H; else if (dy < -H / 2) dy += H;
      const d = Math.hypot(dx, dy); if (d < d1) { d2 = d1; d1 = d; best = [p, dx, dy]; } else if (d < d2) d2 = d;
    }
    return { e: (d2 - d1) * 0.5, p: best[0], dx: best[1], dy: best[2], d: d1 };
  };
  const rc = sideCanvas(W, H, P.k);
  rc.g.fillStyle = 'rgb(255,200,0)'; rc.g.fillRect(0, 0, W, H);
  pixels(g, W, H, (x, y) => {
    const u = x / W, v = y / H, c = cell(x, y), wet = pud(u, v);
    if (c.e < 0.8) return pick(R, 0.02, x, y);                            // the joint
    let s = 0.48 + (n(u, v) - 0.5) * 0.7 + (f(u, v) - 0.5) * 0.3 + (c.p[2] - 0.5) * 0.35;
    const side = (c.dx + c.dy) / (c.d + 1e-3);
    if (c.e < 2.2) s += side < -0.2 ? 0.3 : side > 0.3 ? -0.28 : 0;      // pillowed edges: lit up-left, shaded down-right
    if (wet > 0.62) { const k = Math.min(1, (wet - 0.62) * 6); return pick(PUD, 0.3 + k * 0.4 + (n(u * 3, v * 3) - 0.5) * 0.4, x, y); }
    return pick(R, s, x, y);
  });
  // puddle glints and roughness: the puddles are near mirrors
  const k = P.k;
  for (let y = 0; y < H; y += 1 / k) for (let x = 0; x < W; x += 1 / k) {
    const wet = pud(x / W, y / H);
    if (wet > 0.62) { rc.g.fillStyle = `rgb(255,${Math.round(255 * (0.08 + (0.7 - Math.min(0.7, (wet - 0.62) * 5))))},0)`; rc.g.fillRect(x, y, 1 / k, 1 / k); }
  }
  for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H; if (pud(x / W, y / H) > 0.66) { P.fwrect(x, y, 2 + r() * 3, P.t, '#8aa4b8'); P.fpx(x + 1, y + P.t, '#c8dae8'); } }
  // pebbles and grit
  for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, c = r() < 0.5 ? light(base, 0.25) : dark(base, 0.2); P.frect(x, y, 1.5, 1, c); P.fpx(x, y, light(c, 0.25)); P.fpx(x + 1, y + 1, dark(base, 0.45)); }
  ROUGH.set('cave_floor_' + key + base, sideTex(rc.c));
}), { rough: 0.7, relief: 0.6 });

/** moss over stone (4 × 4 m): cushions of moss in two greens with lit tips, stone showing through, a few pale fungi */
export const mossFloorTex = () => finish(ptex('cave_floor_moss', 4, 4, (g, W, H, r, P) => {
  const n = fnoise(r, 4, 3), m = fnoise(r, 3, 3), f = pnoise(r, 24), T = P.t;
  const S = ramp('#4c524c', [-0.3, -0.16, -0.05, 0.06, 0.16]), M = ramp('#3e6a3a', [-0.32, -0.2, -0.08, 0.04, 0.14, 0.26, 0.38]), M2 = ramp('#2e5a4a', [-0.25, -0.1, 0.04, 0.18]);
  pixels(g, W, H, (x, y) => {
    const u = x / W, v = y / H, mv = m(u, v) + (f(u, v) - 0.5) * 0.25;
    if (mv > 0.44) return pick(mv > 0.58 ? M : M2, 0.5 + (n(u * 2, v * 2) - 0.5) * 1.2 + (f(u, v) - 0.5) * 0.6, x, y);
    return pick(S, 0.5 + (n(u, v) - 0.5) * 0.9, x, y);
  });
  for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H; if (m(x / W, y / H) > 0.5) { P.fpx(x, y, '#7ab060'); P.fpx(x, y + T, '#3a6030'); } }
  for (let i = 0; i < 24; i++) { const x = r() * W, y = r() * H; P.fpx(x, y, '#e8e0c8'); P.fpx(x + T, y, '#e8e0c8'); P.fpx(x, y + T, '#9a907a'); }      // tiny pale fungi
  for (let i = 0; i < 18; i++) { const x = r() * W, y = r() * H; P.fpx(x, y, '#8af0d8'); }                                                              // glow-spore dust
}), { rough: 0.95, relief: 0.4 });

/** packed mine dirt (4 × 4 m): ochre clay, gravel, coal dust, boot-and-barrow ruts */
export const dirtFloorTex = () => finish(ptex('cave_floor_dirt', 4, 4, (g, W, H, r, P) => {
  const n = fnoise(r, 4, 3), f = pnoise(r, 18), T = P.t, R = ramp('#6a5440', [-0.32, -0.2, -0.1, 0, 0.08, 0.16, 0.24]);
  pixels(g, W, H, (x, y) => { const u = x / W, v = y / H; return pick(R, 0.5 + (n(u, v) - 0.5) * 0.9 + (f(u, v) - 0.5) * 0.4 + (Math.abs(((u * 3) % 1) - 0.5) < 0.04 ? -0.15 : 0), x, y); });
  for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H, c = ['#8a8480', '#6e6a66', '#a49a8a', '#5a5048'][i & 3]; P.frect(x, y, 1 + T, T * 2, c); P.fpx(x, y, light(c, 0.2)); P.fpx(x + T, y + 2 * T, dark('#6a5440', 0.4)); }
  for (let i = 0; i < 14; i++) P.blob(r() * W, r() * H, 3 + r() * 4, 2 + r() * 2, '#2e2824', 0.5);       // coal dust
  P.speck(120, '#3a302a', r); P.speck(50, '#9a8a6a', r);
}), { rough: 0.95, relief: 0.5 });

/** the geode's floor: dark violet basalt with tiny crystal points */
export const geodeFloorTex = () => finish(ptex('cave_floor_geode', 4, 4, (g, W, H, r, P) => {
  const n = fnoise(r, 4, 3), f = pnoise(r, 20), R = ramp('#3e3448', [-0.3, -0.18, -0.06, 0.05, 0.14, 0.24]);
  const mc = sideCanvas(W, H, P.k); mc.g.fillStyle = '#000'; mc.g.fillRect(0, 0, W, H);
  pixels(g, W, H, (x, y) => pick(R, 0.5 + (n(x / W, y / H) - 0.5) * 0.9 + (f(x / W, y / H) - 0.5) * 0.4, x, y));
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H, c = ['#c8a0ff', '#9a7ae8', '#e0c8ff'][i % 3], s = 1 + Math.floor(r() * 2);
    P.frect(x, y, s, s, c); P.fpx(x, y, '#ffffff'); mc.g.fillStyle = c; mc.g.fillRect(x, y, s, s);
  }
  for (let i = 0; i < 8; i++) P.crack(r() * W, r() * H, 20, '#241e2c', r, { edge: '#5a4e6a' });
  MASK.set('cave_floor_geode', sideTex(mc.c, null, true));
}), { rough: 0.6, relief: 0.4, glow: 0.9 });

// ==================================================================== ceilings
/** the cave roof seen from below: dark, knobbly, with mineral stains and the odd pale drip ring */
export const ceilTex = () => finish(ptex('cave_ceil', 4, 4, (g, W, H, r, P) => {
  const n = fnoise(r, 4, 3), f = pnoise(r, 14), R = ramp('#3a3632', [-0.3, -0.18, -0.06, 0.04, 0.14, 0.24]);
  pixels(g, W, H, (x, y) => { const u = x / W, v = y / H, b = f(u, v); return pick(R, 0.45 + (n(u, v) - 0.5) * 1.0 + (b > 0.66 ? 0.3 : b < 0.3 ? -0.25 : 0), x, y); });
  for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H; P.blob(x, y, 1.5, 1.5, '#8a8478', 0.6); P.fpx(x, y, '#c8c0b0'); }   // drip rings (soda straws)
  for (let i = 0; i < 8; i++) P.blob(r() * W, r() * H, 6 + r() * 8, 4 + r() * 6, '#4a3a2a', 0.35);                                // iron stains
}), { rough: 0.9, relief: 0.5 });

// ==================================================================== the Old Arena
/** the arena's floor (4 × 4 m): big carved flagstones, worn smooth in the middle, chisel marks and grit in the joints */
export const arenaFloorTex = () => finish(ptex('cave_floor_arena', 4, 4, (g, W, H, r, P) => {
  const T = P.t, n = fnoise(r, 4, 3), R = ramp('#6a6058', [-0.3, -0.18, -0.06, 0.04, 0.12, 0.22]);
  pixels(g, W, H, (x, y) => pick(R, 0.5 + (n(x / W, y / H) - 0.5) * 0.8 + (r() - 0.5) * 0.16, x, y));
  const rows = [0, 22, 46, 70, 96, 128];
  for (let i = 0; i < rows.length - 1; i++) {
    const y0 = rows[i], y1 = rows[i + 1], off = (i % 2) * 20;
    P.fwh(0, y0, W, '#2a2420'); P.fwh(0, y0 + T, W, '#8a8078');
    for (let x = off; x < W + off; x += 30 + Math.floor(r() * 14)) { P.fwv(x, y0, y1 - y0, '#2a2420'); P.fwv(x + T, y0, y1 - y0, '#857a72'); }
  }
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H; P.fwh(x, y, 2 + r() * 3, dark('#6a6058', 0.25)); }        // chisel marks
  P.speck(60, '#4a423c', r);
}), { rough: 0.78, relief: 0.6 });
/** the rune circle carved into the arena floor (12 × 12 m, fit): rings of glyphs that glow when the arena wakes
 *  (the emissive mask holds only the glyphs; the gameplay ramps its strength) */
export const runeTex = () => finish(ptex('cave_runes', 12, 12, (g, W, H, r, P) => {
  const mc = sideCanvas(W, H, P.k), c = W / 2, put = (x, y, col, glow) => { P.rect(x, y, 1, 1, col); if (glow) { mc.g.fillStyle = glow; mc.g.fillRect(x, y, 1, 1); } };
  g.clearRect(0, 0, W, H); mc.g.fillStyle = '#000'; mc.g.fillRect(0, 0, W, H);
  P.fill('#5e5650'); P.speck(900, '#544c46', r); P.speck(500, '#6a625a', r);
  // three carved rings, the glyph band between the outer two, a star in the middle
  const ring = (rad, wdt, col, glow) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x + 0.5 - c, y + 0.5 - c); if (Math.abs(d - rad) < wdt) put(x, y, col, glow); } };
  ring(c - 6, 1.6, '#2e2824', '#ff8a30'); ring(c - 26, 1.2, '#2e2824', '#ff8a30'); ring(c - 70, 1.4, '#2e2824', '#ffb050');
  const glyphs = 28;
  for (let i = 0; i < glyphs; i++) {
    const a = (i / glyphs) * Math.PI * 2, rr = c - 16, gx = c + Math.cos(a) * rr, gy = c + Math.sin(a) * rr, rr2 = rnd(i * 97 + 5);
    for (let s = 0; s < 5; s++) {   // a glyph: a few strokes in a 9 × 9 cell, turned to face the centre
      let px = (rr2() - 0.5) * 8, py = (rr2() - 0.5) * 8; const dx = rr2() < 0.5 ? 1 : 0, dy = 1 - dx, L = 3 + Math.floor(rr2() * 5);
      for (let k = 0; k < L; k++) { const ex = px * Math.cos(a) - py * Math.sin(a), ey = px * Math.sin(a) + py * Math.cos(a); put(Math.round(gx + ex), Math.round(gy + ey), '#2a2420', '#ffc060'); px += dx; py += dy; }
    }
  }
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; for (let t = 0; t < c - 74; t += 0.5) put(Math.round(c + Math.cos(a) * t), Math.round(c + Math.sin(a) * t), '#2e2824', k % 2 ? '#ff7a20' : '#ffb050'); }
  MASK.set('cave_runes', sideTex(mc.c, null, true));
}, { ppm: 16, paint: false }), { glow: 0.05, rough: 0.8, relief: 0.4 });
/** molten rock for the lava fall and its pool (2 × 4 m, scrolled downward in the shader) */
export const lavaTex = () => finish(ptex('cave_lava', 2, 4, (g, W, H, r, P) => {
  const n = fnoise(r, 2, 3, 4), R = ['#3a0a04', '#8a1a06', '#d84a0c', '#ff8a1a', '#ffc84a', '#fff4b0'].map(hx);
  pixels(g, W, H, (x, y) => { const u = x / W, v = y / H, f = n(u + Math.sin(v * TAU * 2) * 0.05, v); return pick(R, Math.min(1, Math.max(0, (f - 0.3) * 1.8 + (Math.sin((v * 6 + u) * TAU) > 0.7 ? 0.2 : 0))), x, y); });
  for (let i = 0; i < 30; i++) P.blob(r() * W, r() * H, 2 + r() * 3, 1 + r() * 2, '#2a0804', 0.7);    // cooling crust
}), { glow: 2.4, rough: 0.6, relief: 0 });

// ==================================================================== the Geode
const CRYST = { cyan: ['#0e3a4e', '#1a6a86', '#2aa0c0', '#5ad8f0', '#b8f6ff'], violet: ['#2a1a4e', '#4a2a86', '#7a4ac8', '#b08af0', '#ecdcff'], green: ['#0e3a2a', '#1a6a4a', '#2aa070', '#6ae0a0', '#d0ffe4'], amber: ['#4a2a0e', '#86501a', '#c08a2a', '#f0c45a', '#fff4c8'], rose: ['#4a1a2e', '#862a50', '#c84a7a', '#f08ab0', '#ffdcea'] };
/** the geode's crystal-lined wall (4 × 4 m): violet basalt studded with fluorite cubes that glow (mask) */
export const geodeWallTex = () => finish(ptex('cave_geodewall', 4, 4, (g, W, H, r, P) => {
  const n = fnoise(r, 4, 3), R = ramp('#3a3046', [-0.3, -0.16, -0.04, 0.08, 0.2]);
  const mc = sideCanvas(W, H, P.k); mc.g.fillStyle = '#000'; mc.g.fillRect(0, 0, W, H);
  pixels(g, W, H, (x, y) => pick(R, 0.5 + (n(x / W, y / H) - 0.5) * 1.0, x, y));
  const cube = (x, y, s, C) => {
    const top = C[3], left = C[2], right = C[1];
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
      const c = j < s * 0.4 ? top : i < s / 2 ? left : right; P.rect(x + i, y + j, 1, 1, c); mc.g.fillStyle = c; mc.g.fillRect(x + i, y + j, 1, 1);
    }
    P.hline(x, y, s, C[4]); mc.g.fillStyle = C[4]; mc.g.fillRect(x, y, s, 1); P.hline(x, y + s, s, '#1e1826');
  };
  for (let i = 0; i < 70; i++) cube(Math.floor(r() * (W - 8)), Math.floor(r() * (H - 8)), 2 + Math.floor(r() * 6), r() < 0.8 ? CRYST.violet : CRYST.cyan);
  MASK.set('cave_geodewall', sideTex(mc.c, null, true));
}), { glow: 1.3, rough: 0.4, relief: 0.6 });

// ==================================================================== the old mine
/** old pine timber, grain along the length (h: grain runs along u; v: along v), 0.5 × 2 m */
export const timberTex = (dir = 'v') => finish(ptex('cave_timber' + dir, dir === 'v' ? 0.5 : 2, dir === 'v' ? 2 : 0.5, (g, W, H, r, P) => {
  const along = dir === 'v' ? H : W, across = dir === 'v' ? W : H, T = P.t;
  const R = ramp('#6a5038', [-0.32, -0.2, -0.1, 0, 0.08, 0.16]), n = fnoise(r, 2, 3, 8);
  const at = (a, c) => (dir === 'v' ? [c, a] : [a, c]);
  pixels(g, W, H, (x, y) => {
    const a = dir === 'v' ? y : x, c = dir === 'v' ? x : y;
    const grain = Math.sin(c * 2.1 + Math.sin(a * 0.11) * 2.2 + n(x / W, y / H) * 5) > 0.55 ? -0.16 : 0;
    const ed = Math.min(c, across - 1 - c) < 1 ? -0.2 : Math.min(c, across - 1 - c) < 2 ? -0.08 : 0;
    return pick(R, 0.55 + grain + ed + (n(x / W, y / H) - 0.5) * 0.5 + (r() - 0.5) * 0.15, x, y);
  });
  // checking cracks along the grain, knots, nail heads with rust runs, grey weathering
  for (let i = 0; i < 4; i++) { const a0 = r() * along, c0 = 2 + r() * (across - 4), L = 8 + r() * 24; for (let k = 0; k < L; k += T) { const [px, py] = at(a0 + k, c0 + Math.sin(k * 0.3) * 0.6); P.fpx(px, py, '#2a1e16'); } }
  for (let i = 0; i < 3; i++) { const [px, py] = at(r() * along, 3 + r() * (across - 6)); P.blob(px, py, 2, 1.5, '#3e2a1c', 1); P.fpx(px, py, '#8a6a4a'); }
  for (let i = 0; i < 4; i++) { const [px, py] = at(r() * along, across / 2 + (r() - 0.5) * 6); P.rect(px, py, 2, 2, '#3a3634'); P.fpx(px, py, '#8a8480'); P.dither(px, py + 2, 2, 6, '#7a4a2a', (xx, yy) => 0.6 - (yy - py) * 0.08); }
  P.dither(0, 0, W, H, '#8a8478', (x, y) => (n(x / W * 2, y / H * 2) > 0.66 ? 0.35 : 0));
}), { rough: 0.85, relief: 0.6 });

/** hemp rope (1 × 0.1 m, u along the rope): twisted strands */
export const ropeTex = () => finish(ptex('cave_rope', 1, 0.1, (g, W, H, r, P) => {
  P.fill('#8a7452'); for (let x = -H; x < W; x += 3) for (let k = 0; k < H; k++) { P.px(x + k, k, '#a48a62'); P.px(x + k + 1, k, '#6a563a'); }
  P.hline(0, 0, W, '#b49a70'); P.hline(0, H - 1, W, '#4e3e2a');
}, { ppm: 32 }), { rough: 0.95, relief: 0 });

/** an old painted plank sign (fit): carved letters filled with fading paint */
export const plankSign = (text, sub = '', w = 2.2, h = 0.6, paint = '#e8d8b0') => finish(ptex('cave_sign' + text + sub + w + h, w, h, (g, W, H, r, P) => {
  P.fill('#4a3624');
  for (let y = 0; y < H; y += 7) { const c = r() < 0.5 ? '#56402a' : '#4e3a26'; P.rect(0, y, W, 6, c); P.hline(0, y, W, light(c, 0.12)); P.hline(0, y + 6, W, '#2a1c12'); }
  for (let i = 0; i < 10; i++) { let y = r() * H; const x0 = r() * W; for (let x = 0; x < 20 + r() * 30; x++) { y += (r() - 0.5) * 0.3; P.px(x0 + x, y, '#3e2c1c'); } }
  P.text(text, W / 2, sub ? H * 0.38 : H / 2, Math.round(H * (sub ? 0.36 : 0.5)), paint, { shadow: '#1e140c' });
  if (sub) P.text(sub, W / 2, H * 0.76, Math.round(H * 0.2), dark(paint, 0.15), { shadow: '#1e140c' });
  for (const [x, y] of [[3, 3], [W - 5, 3], [3, H - 5], [W - 5, H - 5]]) { P.rect(x, y, 2, 2, '#2a2624'); P.px(x, y, '#9a948e'); }
  P.dither(0, 0, W, H, '#2a1e14', (x, y) => (((x * 13 + y * 7) % 23) < 2 ? 0.6 : 0));
}, { ppm: 48 }), { rough: 0.85, relief: 0 });

/** the daylight seen through a crack in the roof or down the entrance (fit) */
export const daylightTex = () => finish(ptex('cave_daylight', 1, 1, (g, W, H, r, P) => {
  P.fill('#bfe0f0'); P.dither(0, 0, W, H, '#ffffff', (x, y) => 1 - Math.hypot(x - W / 2, y - H / 2) / (W * 0.55));
  for (let i = 0; i < 8; i++) P.blob(r() * W, r() * H, 3, 2, '#7ab06a', 0.5);       // a hint of grass and roots up there
}, { ppm: 32 }), { glow: 3.2, rough: 0.9, relief: 0 });

/** the lake surface (4 × 4 m): near-black teal with wavering ripple highlights (scrolled in the shader) */
export const lakeTex = () => finish(ptex('cave_lake', 4, 4, (g, W, H, r, P) => {
  const n = fnoise(r, 4, 2), R = ramp('#0e2a30', [-0.2, -0.1, 0, 0.1, 0.22]);
  pixels(g, W, H, (x, y) => pick(R, 0.4 + (n(x / W, y / H) - 0.5) * 0.6, x, y));
  for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, L = 3 + r() * 9; P.hline(x, y, L, '#2a6a74'); if (r() < 0.4) P.hline(x + 1, y, Math.max(1, L - 3), '#5ab0b8'); }
}), { rough: 0.05, relief: 0 });

/** the inside of the mouth from outside: a near-black throat, the last of the rock lit at the rim */
export const voidTex = () => finish(ptex('cave_void', 2, 2, (g, W, H, r, P) => {
  P.fill('#050608'); P.dither(0, 0, W, H, '#0e1014', (x, y) => 0.5 - Math.hypot(x - W / 2, y - H / 2) / W);
  P.speck(30, '#14161a', r);
}, { ppm: 16, paint: false }), { rough: 1, relief: 0 });

/** a gradient strip for light shafts and mist (canvas, not pixel art: it is only ever seen as glow) */
let BEAM = null;
export function beamTexture() {
  if (BEAM) return BEAM;
  const c = document.createElement('canvas'); c.width = 8; c.height = 64; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 8, 64);
  BEAM = new THREE.CanvasTexture(c); BEAM.colorSpace = THREE.SRGBColorSpace; return BEAM;
}
