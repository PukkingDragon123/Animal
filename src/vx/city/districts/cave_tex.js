// The Deep Cave's hand-painted pixel textures (src/vx/scenes/cave.js, src/vx/city/districts/cave_*.js).
// Everything is painted at the city's density (32 design pixels per metre, HD canvas) and tiles seamlessly:
//  - rock: sedimentary strata in wavy bands (each layer its own tone, a lit top lip, a shadowed underside),
//    hairline cracks, chipped facets, mineral veins; wet streaks run down from seeps; variants per chamber
//  - floors: wet flagstone-like slabs with puddles (and a roughness map that makes the puddles mirror-smooth),
//    moss over stone, packed mine dirt with gravel and coal dust, the violet geode floor
//  - crystals, glowcap mushrooms, glowing ore (with an emissive mask), old timber, weathered planks, rusted
//    iron, rail steel, the lake surface, old enamel / plank signs, the miners' strongbox and lantern glass
// Textures that give off light carry userData.caveGlow (strength) and, when only part of them glows, a
// userData.caveMask (emissive map); wet ones carry userData.caveRough (a roughness map). cave_build.js reads
// those after the city builder has made the materials.
import * as THREE from '../../../../vendor/three.module.js';
import { TX } from '../build.js';

const { ptex, pixels, fnoise, pnoise, ramp, pick, dark, light, hx } = TX;
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

/** flowstone for stalactites and stalagmites (2 × 2 m): creamy calcite in growth rings, wet runs, iron tint */
export const flowTex = (tint = 'cream') => finish(ptex('cave_flow_' + tint, 2, 2, (g, W, H, r, P) => {
  const base = { cream: '#9a8a74', ochre: '#8a6a4a', grey: '#7a7e80', violet: '#6a5a7a' }[tint] || '#9a8a74';
  const R = ramp(base, [-0.36, -0.22, -0.1, 0, 0.1, 0.2, 0.32]), n = fnoise(r, 2, 3), f = pnoise(r, 4, 16);
  pixels(g, W, H, (x, y) => {
    const u = x / W, v = y / H, ring = Math.sin((v * 22 + n(u, v) * 3) * TAU) * 0.5 + 0.5;
    return pick(R, 0.45 + (ring > 0.82 ? 0.25 : ring < 0.12 ? -0.2 : 0) + (n(u, v) - 0.5) * 0.6 + (f(u, v) - 0.5) * 0.35, x, y);
  });
  for (let i = 0; i < 16; i++) { const x = r() * W, y = r() * H, L = 10 + r() * 30; P.dither(x, y, 1 + Math.floor(r() * 2), L, light(base, 0.3), (xx, yy) => 0.7 * (1 - (yy - y) / L)); }
  for (let i = 0; i < 8; i++) { const x = r() * W, L = 12 + r() * 26; P.dither(x, r() * H, 2, L, dark(base, 0.35), 0.4); }
}), { rough: 0.45, relief: 0.5 });

// ==================================================================== crystals
const CRYST = { cyan: ['#0e3a4e', '#1a6a86', '#2aa0c0', '#5ad8f0', '#b8f6ff'], violet: ['#2a1a4e', '#4a2a86', '#7a4ac8', '#b08af0', '#ecdcff'], green: ['#0e3a2a', '#1a6a4a', '#2aa070', '#6ae0a0', '#d0ffe4'], amber: ['#4a2a0e', '#86501a', '#c08a2a', '#f0c45a', '#fff4c8'], rose: ['#4a1a2e', '#862a50', '#c84a7a', '#f08ab0', '#ffdcea'] };
/** a crystal face (fit to each facet, 0.5 × 2 m): dark root to a bright tip, vertical facet streaks, inclusions, sparkles */
export const crystalTex = (col = 'cyan') => finish(ptex('cave_crystal_' + col, 0.5, 2, (g, W, H, r, P) => {
  const C = CRYST[col] || CRYST.cyan, R = C.map(hx), n = fnoise(r, 2, 2, 4);
  pixels(g, W, H, (x, y) => {
    const v = 1 - y / H, u = x / W, edge = Math.min(u, 1 - u);
    let s = 0.15 + v * 0.7 + (n(u, v) - 0.5) * 0.35 + (edge < 0.08 ? 0.25 : 0) + (Math.abs(u - 0.38) < 0.05 ? 0.18 : 0);
    if (((x * 0.5 + y * 0.18) % 9) < 0.7) s += 0.12;                     // internal fracture planes
    return pick(R, s, x, y);
  });
  for (let i = 0; i < 9; i++) { const x = r() * W, y = r() * H * 0.9; P.fpx(x, y, C[4]); P.fpx(x + P.t, y, C[3]); }
  for (let i = 0; i < 4; i++) P.blob(r() * W, H * (0.3 + r() * 0.6), 2, 3, C[1], 0.4);    // cloudy inclusions
  P.fv(W * 0.38, 0, H * 0.85, C[4]);
}, { ppm: 32 }), { glow: 1.6, rough: 0.12, relief: 0 });

/** a glowing ore vein in a boulder (2 × 2 m) + its emissive mask (only the nuggets shine) */
export const oreTex = (col = 'cyan') => finish(ptex('cave_ore_' + col, 2, 2, (g, W, H, r, P) => {
  const C = CRYST[col] || CRYST.cyan, n = fnoise(r, 2, 3), R = ramp('#4a4448', [-0.3, -0.16, -0.04, 0.08, 0.2]);
  const mc = sideCanvas(W, H, P.k); mc.g.fillStyle = '#000'; mc.g.fillRect(0, 0, W, H);
  pixels(g, W, H, (x, y) => pick(R, 0.5 + (n(x / W, y / H) - 0.5) * 1.0, x, y));
  for (let i = 0; i < 6; i++) P.crack(r() * W, r() * H, 24, dark('#4a4448', 0.5), r, { edge: light('#4a4448', 0.2) });
  const nug = (x, y, s) => {
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { if ((i === 0 || i === s - 1) && (j === 0 || j === s - 1)) continue; const c = j < s / 2 ? C[3] : C[2]; P.rect(x + i, y + j, 1, 1, c); mc.g.fillStyle = c; mc.g.fillRect(x + i, y + j, 1, 1); }
    P.px(x + 1, y + 1, C[4]); mc.g.fillStyle = C[4]; mc.g.fillRect(x + 1, y + 1, 1, 1); P.hline(x + 1, y + s, s - 1, '#241e22');
  };
  for (let i = 0; i < 30; i++) nug(Math.floor(r() * (W - 6)), Math.floor(r() * (H - 6)), 2 + Math.floor(r() * 4));
  MASK.set('cave_ore_' + col, sideTex(mc.c, null, true));
}), { glow: 2.2, rough: 0.5, relief: 0.4 });

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

// ==================================================================== glowcap mushrooms
const SHROOM = { teal: ['#0a4a4a', '#127a72', '#20b0a0', '#62e8d0', '#d0fff4'], violet: ['#3a1a5a', '#5a2a8a', '#8a4ac0', '#c88af0', '#f4e0ff'], blue: ['#0e2a5a', '#1a4a9a', '#2a7ad8', '#6ab0ff', '#d8ecff'] };
/** a glowcap's top (1 × 1 m, fit): a glowing cap with pale spots and a darker rim */
export const capTex = (col = 'teal') => finish(ptex('cave_cap_' + col, 1, 1, (g, W, H, r, P) => {
  const C = (SHROOM[col] || SHROOM.teal).map(hx), n = fnoise(r, 2, 2);
  pixels(g, W, H, (x, y) => { const v = y / H; return pick(C, 0.3 + (1 - v) * 0.5 + (n(x / W, v) - 0.5) * 0.4 - (v > 0.86 ? 0.3 : 0), x, y); });
  for (let i = 0; i < 9; i++) { const x = 3 + r() * (W - 6), y = 2 + r() * (H * 0.7), s = 1 + r() * 2.5; P.blob(x, y, s, s * 0.8, SHROOM[col] ? SHROOM[col][4] : '#ffffff', 1); }
}, { ppm: 32 }), { glow: 1.25, rough: 0.5, relief: 0 });
/** the gills under a cap (fit): radial-ish lines, glowing faintly */
export const gillTex = (col = 'teal') => finish(ptex('cave_gill_' + col, 1, 1, (g, W, H, r, P) => {
  const C = SHROOM[col] || SHROOM.teal; P.fill(C[1]);
  for (let x = 0; x < W; x += 2) { P.vline(x, 0, H, C[2]); P.fv(x + 1, 0, H, C[0]); }
  P.rect(0, 0, W, 3, C[3]);
}, { ppm: 32 }), { glow: 0.8, rough: 0.7, relief: 0 });
/** a mushroom stem (fit): pale, fibrous, glowing up from the root */
export const stemTex = (col = 'teal') => finish(ptex('cave_stem_' + col, 0.5, 1, (g, W, H, r, P) => {
  const C = SHROOM[col] || SHROOM.teal, R = ramp('#c8d8cc', [-0.3, -0.18, -0.06, 0.04, 0.12]);
  pixels(g, W, H, (x, y) => pick(R, 0.5 + Math.sin(x * 1.3) * 0.2 + (r() - 0.5) * 0.2, x, y));
  P.dither(0, H * 0.6, W, H * 0.4, C[2], (x, y) => (y - H * 0.6) / (H * 0.4) * 0.6);
  for (let i = 0; i < 6; i++) P.fv(r() * W, 0, H, '#e8f4ec');
}, { ppm: 32 }), { glow: 0.35, rough: 0.8, relief: 0 });

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

/** weathered bridge / walkway planks (2 × 2 m): grey-brown boards across, gaps, nail pairs, rot */
export const deckTex = () => finish(ptex('cave_deck', 2, 2, (g, W, H, r, P) => {
  const T = P.t; P.fill('#1a1410');
  for (let y = 0; y < H; y += 8) {
    const k = (r() - 0.5) * 0.22, c = k > 0 ? light('#6a5642', k) : dark('#6a5642', -k), gap = r() < 0.15 ? 2 : 1;
    P.rect(0, y + gap, W, 8 - gap - 1, c); P.fh(0, y + gap, W, light(c, 0.16)); P.fh(0, y + 7 - T, W, dark(c, 0.3));
    for (let i = 0; i < 8; i++) { let gy = y + 2 + r() * 4; const x0 = r() * W, L = 6 + r() * 26, cc = dark(c, 0.1 + r() * 0.06); for (let x = 0; x < L; x += T) { gy += (r() - 0.5) * 0.15; P.fpx(x0 + x, Math.max(y + gap + T, Math.min(y + 6, gy)), cc); } }
    for (const x of [4, W - 6]) { P.rect(x, y + 3, 1, 1, '#2a2624'); P.rect(x, y + 5, 1, 1, '#2a2624'); P.fpx(x, y + 3, '#9a948e'); }
    if (r() < 0.3) P.blob(r() * W, y + 4, 4, 2, '#3a3a2a', 0.6);
  }
}), { rough: 0.9, relief: 0.6 });

/** rusted iron (2 × 1 m): corrosion blooms, flaking green paint, rivet rows */
export const rustTex = () => finish(ptex('cave_rust', 2, 1, (g, W, H, r, P) => {
  const n = fnoise(r, 4, 3, 2), f = pnoise(r, 16, 8), R = ramp('#7a4a2e', [-0.35, -0.2, -0.08, 0.04, 0.16, 0.3]), Gp = ramp('#3e5a4e', [-0.2, -0.08, 0.04, 0.14]);
  pixels(g, W, H, (x, y) => { const u = x / W, v = y / H, p = n(u, v); if (p > 0.6 && f(u, v) > 0.4) return pick(Gp, 0.5 + (f(u, v) - 0.5), x, y); return pick(R, 0.5 + (f(u, v) - 0.5) * 1.2 + (p - 0.5) * 0.6, x, y); });
  for (let x = 3; x < W; x += 8) for (const y of [2, H - 4]) { P.rect(x, y, 2, 2, '#4a2a1a'); P.px(x, y, '#b07a4a'); }
  for (let i = 0; i < 10; i++) P.blob(r() * W, r() * H, 2 + r() * 3, 1 + r() * 2, '#c06a2a', 0.6);
  P.speck(80, '#2e1a12', r);
}), { rough: 0.75, metal: 0.35, relief: 0.4 });

/** a rail's running steel: a polished top over rusty flanks (1 × 0.25 m, u along the rail) */
export const railTex = () => finish(ptex('cave_rail', 1, 0.25, (g, W, H, r, P) => {
  P.fill('#6a4a32'); P.speck(40, '#8a5a32', r); P.speck(30, '#4a2e1e', r);
  P.rect(0, 0, W, 3, '#9aa0a8'); P.hline(0, 0, W, '#d8dee4'); P.hline(0, 3, W, '#3a2a22');
  for (let i = 0; i < 6; i++) P.hline(r() * W, 1, 2 + r() * 4, '#b8bec6');
}), { rough: 0.45, metal: 0.6, relief: 0 });

/** a mine cart's body: riveted iron plates, dented, rusted at the seams (1 × 1 m) */
export const cartTex = () => finish(ptex('cave_cart', 1, 1, (g, W, H, r, P) => {
  const n = fnoise(r, 2, 3), R = ramp('#5a4a42', [-0.3, -0.16, -0.04, 0.06, 0.16]);
  pixels(g, W, H, (x, y) => pick(R, 0.5 + (n(x / W, y / H) - 0.5) * 0.9, x, y));
  for (let x = 0; x < W; x += 16) { P.vline(x, 0, H, '#2e2622'); P.vline(x + 1, 0, H, '#7a6a60'); }
  P.rect(0, 0, W, 3, '#3a2e28'); P.rect(0, H - 3, W, 3, '#3a2e28');
  for (let x = 2; x < W; x += 5) for (const y of [1, H - 2]) { P.rect(x, y, 1, 1, '#9a8a80'); }
  for (let i = 0; i < 8; i++) P.blob(r() * W, r() * H, 2 + r() * 2, 2 + r() * 3, '#8a4a22', 0.6);
  P.text('3', W / 2, H / 2, 12, '#c8b890', { shadow: '#2e2622' });
}), { rough: 0.65, metal: 0.4, relief: 0.4 });

/** hemp rope (1 × 0.1 m, u along the rope): twisted strands */
export const ropeTex = () => finish(ptex('cave_rope', 1, 0.1, (g, W, H, r, P) => {
  P.fill('#8a7452'); for (let x = -H; x < W; x += 3) for (let k = 0; k < H; k++) { P.px(x + k, k, '#a48a62'); P.px(x + k + 1, k, '#6a563a'); }
  P.hline(0, 0, W, '#b49a70'); P.hline(0, H - 1, W, '#4e3e2a');
}, { ppm: 32 }), { rough: 0.95, relief: 0 });

/** a supply crate's boards (1 × 1 m, fit): planks, corner battens, a stencilled mark */
export const crateTex = (mark = 'No.3') => finish(ptex('cave_crate' + mark, 1, 1, (g, W, H, r, P) => {
  P.fill('#7a5a3a');
  for (let y = 0; y < H; y += 8) { const c = r() < 0.5 ? '#86643e' : '#725436'; P.rect(0, y, W, 7, c); P.hline(0, y, W, light(c, 0.14)); P.hline(0, y + 7, W, '#3a281a'); for (let i = 0; i < 4; i++) P.hline(r() * W, y + 2 + r() * 4, 4 + r() * 10, dark(c, 0.1)); }
  for (const x of [0, W - 4]) { P.rect(x, 0, 4, H, '#5e4228'); P.vline(x, 0, H, '#8a6a46'); }
  P.rect(0, 0, W, 3, '#5e4228'); P.rect(0, H - 3, W, 3, '#5e4228');
  P.text(mark, W / 2, H / 2, 9, '#2a1e14');
  for (const [x, y] of [[1, 1], [W - 3, 1], [1, H - 3], [W - 3, H - 3]]) P.px(x, y, '#c8c0b0');
}, { ppm: 32 }), { rough: 0.85, relief: 0.5 });

/** a miner's wool blanket (fit): grey with red bands, worn and darned */
export const blanketTex = () => finish(ptex('cave_blanket', 1.8, 0.8, (g, W, H, r, P) => {
  P.fill('#6a6660'); P.speck(400, '#5a5650', r); P.speck(300, '#7a766e', r);
  for (const y of [6, 10, H - 12, H - 8]) P.rect(0, y, W, 2, '#8a3a32');
  for (let i = 0; i < 6; i++) P.blob(r() * W, r() * H, 3, 2, '#4e4a46', 0.6);
  P.rect(0, 0, W, 2, '#4a4642'); P.rect(0, H - 2, W, 2, '#4a4642');
}, { ppm: 32 }), { rough: 1, relief: 0 });

/** the miners' strongbox: iron-banded oak with a big padlock (1 × 0.6 m, fit) */
export const chestTex = () => finish(ptex('cave_chest', 1, 0.6, (g, W, H, r, P) => {
  P.fill('#5a3a24');
  for (let y = 0; y < H; y += 5) { P.hline(0, y, W, '#3a2416'); P.dither(0, y + 1, W, 3, '#6a4a2e', 0.4); }
  for (const x of [3, W - 6]) { P.rect(x, 0, 3, H, '#4a4442'); P.vline(x, 0, H, '#8a8480'); for (let y = 2; y < H; y += 5) P.px(x + 1, y, '#c8c0b8'); }
  P.rect(W / 2 - 3, H / 2 - 2, 6, 7, '#c8a040'); P.rect(W / 2 - 2, H / 2 - 5, 4, 3, '#8a8480'); P.px(W / 2 - 1, H / 2 + 1, '#2a1a10'); P.hline(W / 2 - 3, H / 2 - 2, 6, '#f0d878');
}, { ppm: 32 }), { rough: 0.7, relief: 0.4 });

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

/** hot lantern glass (fit, 0.25 × 0.35 m): a flame behind sooty panes */
export const lanternTex = () => finish(ptex('cave_lantern', 0.25, 0.35, (g, W, H, r, P) => {
  P.fill('#f0a040'); P.dither(0, 0, W, H, '#ffd890', (x, y) => 1 - Math.hypot(x - W / 2, y - H * 0.55) / (W * 0.6));
  P.rect(W / 2 - 1, H * 0.4, 2, H * 0.3, '#fff8e0'); P.dither(0, 0, W, 3, '#5a3a20', 0.6);
  P.vline(0, 0, H, '#3a2a1a'); P.vline(W - 1, 0, H, '#3a2a1a');
}, { ppm: 64 }), { glow: 2.4, rough: 0.2, relief: 0 });

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
