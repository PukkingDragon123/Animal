// The world beyond the map. The walkable city is 230 × 180 m; the camera looks along its streets, so past the
// edges it must not end. Three layers carry it on to the horizon:
//  1. the skirt (merged into 64 m tiles, city/merge.js): the city's grid continues on every land side for a few
//     hundred metres — the avenues run on as long vistas between sidewalks, street lamps and blocks of buildings
//     (painted pixel façades with windows that light up at night, cornices, parapets, rooftop tanks and plant),
//     getting taller toward the downtown skyline in the south-east;
//  2. the far layer ('far': one merged mesh per material): the bay running out to the horizon with islands, a long
//     suspension bridge to the north-west, the far shore's town and hills, and hill ridges ringing the city —
//     simple shapes that the aerial perspective (render/composite.js) melts into the sky;
//  3. the sky itself (render/sky.js).
// Pure scenery: no collision, no minimap.
import * as TX from '../city/pixtex.js';

const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
// eight façade schemes (wall, window frame, window kind): enough variety, few textures
const SCHEMES = [['#b8a48c', '#e8e0d0', 0], ['#c8b8a0', '#3a3a40', 1], ['#a89c90', '#f0ece4', 2], ['#d0c4b0', '#5a4a3a', 0], ['#9a8a7c', '#e8e0d0', 1], ['#b4ab9e', '#3a3a40', 2], ['#c4b49a', '#d8d0c0', 0], ['#8e8478', '#f0ece4', 1]];

/** a painted pixel façade: one storey (3 m) × two bays (6 m): wall, frames, sills, glass that reflects the sky, blinds;
 *  lit: some rooms glow (warm or cool). Tiles in both directions, so a whole tower is one texture. */
export const facadeTex = (base, frame, lit, kind = 0) => TX.ptex('ffac' + base + frame + kind + (lit ? '_n' : ''), 6, 3, (g, W, H, r, P) => {
  const n = TX.fnoise(r, 4, 2, 2), R = TX.ramp(base, [-0.1, -0.05, 0, 0.04, 0.08]);
  TX.pixels(g, W, H, (x, y) => TX.pick(R, 0.55 + (n(x / W, y / H) - 0.5) * 0.7 + (r() - 0.5) * 0.18, x, y));
  // the floor line: a lit lip over a shadow
  P.rect(0, H - 4, W, 4, TX.dark(base, 0.1)); P.fh(0, H - 4, W, TX.light(base, 0.18)); P.fh(0, H - 1, W, TX.dark(base, 0.28));
  const ww = kind === 1 ? 64 : kind === 2 ? 40 : 30, wh = kind === 1 ? 62 : 52, gy = 18;
  for (let b = 0; b < 2; b++) {
    const gx = Math.round(b * W / 2 + (W / 2 - ww) / 2), on = lit && hash(b * 7 + kind, base.length + frame.length) < 0.55, warm = hash(b, kind + 3) < 0.75;
    P.rect(gx - 3, gy - 3, ww + 6, wh + 6, frame); P.fh(gx - 3, gy - 3, ww + 6, TX.light(frame, 0.25)); P.fv(gx + ww + 2, gy - 3, wh + 6, TX.dark(frame, 0.25));
    const room = on ? (warm ? '#e8b060' : '#c8d8e8') : '#2a3440', hi = on ? (warm ? '#ffe0a0' : '#e8f0f8') : '#3a4a5c';
    P.rect(gx, gy, ww, wh, room); P.rect(gx, gy, ww, Math.round(wh * 0.35), hi);
    if (!on) { for (let y = gy; y < gy + 6; y++) P.fh(gx, y, ww, y < gy + 2 ? '#a8c0d8' : '#7890a8'); P.each(gx, gy, ww, wh, (x, y) => ((x - gx + y - gy) % 30 < 2 ? '#b8cce0' : null)); }
    const bl = hash(b + 11, kind + base.charCodeAt(2)); if (bl < 0.5) { const bh = Math.round(wh * (0.2 + bl)); P.rect(gx, gy, ww, bh, on ? '#f0d8a8' : '#d8d0c0'); for (let y = gy + 2; y < gy + bh; y += 3) P.fh(gx, y, ww, on ? '#e0c088' : '#c0b8a8'); }
    P.rect(gx + Math.floor(ww / 2) - 1, gy, 2, wh, frame); if (kind !== 1) P.rect(gx, gy + Math.floor(wh * 0.45), ww, 2, frame);
    P.rect(gx - 5, gy + wh + 2, ww + 10, 4, TX.light(base, 0.2)); P.fh(gx - 5, gy + wh + 5, ww + 10, TX.dark(base, 0.35));   // the sill and its shadow
  }
  P.speck(60, TX.dark(base, 0.18), r);
});
/** a painted shopfront band for the ground floor of the skirt blocks: a sign fascia, glazing, a door */
const shopTex = (base, lit) => TX.ptex('fshop' + (base.charCodeAt(2) % 3) + (lit ? '_n' : ''), 8, 3.2, (g, W, H, r, P) => {
  P.fill(TX.dark(base, 0.2));
  const sc = ['#3a5a7a', '#7a3a32', '#2e5a46', '#6a5a2a', '#4a3a5a'][Math.floor(r() * 5)];
  P.rect(0, 8, W, 18, sc); P.fh(0, 8, W, TX.light(sc, 0.3)); P.fh(0, 25, W, TX.dark(sc, 0.4));
  for (let i = 0; i < 6; i++) P.rect(20 + i * 22 + r() * 6, 13, 12, 8, lit ? '#fff0c0' : '#e8e0c8');
  const room = lit ? '#e8b868' : '#24303c';
  P.rect(8, 34, W - 70, H - 42, room); P.rect(8, 34, W - 70, 12, lit ? '#ffe0a0' : '#34465a');
  P.rect(W - 54, 34, 40, H - 34, '#2a2a30'); P.rect(W - 50, 38, 32, H - 42, lit ? '#f0c878' : '#2e3c4c');
  for (let x = 8; x < W - 62; x += 40) P.rect(x, 34, 2, H - 42, '#2a2a30');
  P.rect(0, H - 6, W, 6, '#6a665e'); P.fh(0, H - 6, W, '#8a867e');
});

export function skirt(C, o = {}) {
  const W = C.w, D = C.d, gk = 'skirt', far = 'far', night = C.night, waterY = o.waterY ?? -0.8, bayZ = o.bayZ ?? 12;
  const flat = (g, tex, x0, z0, x1, z1, y = 0) => C.quad(g, tex, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], { u0: x0, v0: -z1 });
  // ---- the bay, out to the horizon (and either side of the waterfront)
  const water = TX.water(o.waterCol || '#3a7ab0');
  const wq = (x0, z0, x1, z1) => C.quad('water', water, [x0, waterY, z1], [x1, waterY, z1], [x1, waterY, z0], [x0, waterY, z0], { u0: x0, v0: -z1 });
  wq(-1400, -1500, W + 1400, 0); wq(-1400, 0, 0, bayZ); wq(W, 0, W + 1400, bayZ);
  const quay = TX.concrete('#8a8478'), asph = TX.asphalt(), pav = TX.slabs('#c4bfb4'), curb = TX.concrete('#b8b4ac'), dash = TX.dashTex(), roofT = TX.roofMembrane ? TX.roofMembrane('#7a7670') : TX.concrete('#8a867e');
  // ---- the street grid beyond the edges: [x0, x1] runs (north–south streets) and [z0, z1] runs (east–west)
  const X0 = -260, X1 = W + 260, Z1 = D + 250;
  const NS = [[-12, -2], [-92, -80], [-172, -160], [-250, -238], [104, 116], [W + 2, W + 12], [W + 80, W + 92], [W + 160, W + 172], [W + 240, W + 252], [40, 50], [170, 180]];
  const EW = [[20, 32], [98, 110], [D + 2, D + 12], [D + 80, D + 92], [D + 160, D + 172], [D + 240, D + 252]];
  const inMap = (x, z) => x > -0.5 && x < W + 0.5 && z > -0.5 && z < D + 0.5;
  const side = (x0, z0, x1, z1) => C.box(gk, curb, x0, 0, z0, x1, 0.12, z1, { top: pav, skip: { bottom: true } });
  // [lo, hi] minus the cut ranges (sidewalks stop at the crossings)
  const split = (lo, hi, cut) => { let out = [[lo, hi]]; for (const [c0, c1] of cut) out = out.flatMap(([a, b]) => (c1 <= a || c0 >= b ? [[a, b]] : [[a, c0], [c1, b]].filter(([p, q]) => q - p > 0.05))); return out; };
  // north–south streets (south of the map, and the side strips), with their sidewalks and centre dashes
  for (const [a, b] of NS) {
    const z0 = a < 0 || a > W ? bayZ : D, z1 = Z1;
    flat(gk, asph, a, z0, b, z1);
    for (const [p, q] of split(z0, z1, EW.map(([c, d]) => [c, d]))) { side(a - 2, p, a, q); side(b, p, b + 2, q); }
    const xc = (a + b) / 2; for (let z = z0 + 1; z < z1 - 2; z += 6) if (!EW.some(([c, d]) => z + 3 > c && z < d)) C.quad(gk, dash, [xc - 0.08, 0.012, z], [xc - 0.08, 0.012, z + 3], [xc + 0.08, 0.012, z + 3], [xc + 0.08, 0.012, z], { fit: true });
  }
  // east–west streets: the avenues run on west and east of the map; the southern ones right across
  for (const [a, b] of EW) {
    const segs = a > D ? [[X0, X1]] : [[X0, 0], [W, X1]];
    for (const [x0, x1] of segs) {
      flat(gk, asph, x0, a + 2, x1, b - 2, 0.004);
      for (const [p, q] of split(x0, x1, NS.map(([c, d]) => [c - 2, d + 2]))) { side(p, a, q, a + 2); side(p, b - 2, q, b); }
      const zc = (a + b) / 2; for (let x = x0 + 1; x < x1 - 2; x += 6) if (!NS.some(([c, d]) => x + 3 > c && x < d)) C.quad(gk, dash, [x, 0.014, zc + 0.08], [x + 3, 0.014, zc + 0.08], [x + 3, 0.014, zc - 0.08], [x, 0.014, zc - 0.08], { fit: true });
      // street lamps down the vista (the near 120 m)
      for (let x = x0 + 7; x < x1; x += 22) if (Math.min(Math.abs(x), Math.abs(x - W)) < 100 && !NS.some(([c, d]) => x > c - 3 && x < d + 3)) for (const z of [a + 1.2, b - 1.2]) C.props.push({ kind: 'lamp', x, y: 0.12, z, yaw: z < (a + b) / 2 ? Math.PI : 0, s: 1, nolight: !night || Math.min(Math.abs(x), Math.abs(x - W)) > 70 });
    }
  }
  // the land under it all (pavement where no street runs)
  const conc = TX.concrete('#a8a49c');
  flat(gk, conc, X0, bayZ, -12, D + 2, -0.01); flat(gk, conc, W + 12, bayZ, X1, D + 2, -0.01); flat(gk, conc, X0, D + 2, X1, Z1, -0.01);
  for (const [p, q] of split(bayZ, D + 2, EW)) { side(-2, p, 0, q); side(W, p, W + 2, q); }
  for (const [p, q] of split(0, W, NS.map(([c, d]) => [c - 2, d + 2]))) side(p, D, q, D + 2);
  C.box(gk, quay, X0, waterY - 0.6, bayZ - 0.4, 0, 0, bayZ, { skip: { top: true, s: true } }); C.box(gk, quay, W, waterY - 0.6, bayZ - 0.4, X1, 0, bayZ, { skip: { top: true, s: true } });
  // ---- blocks: the land between the streets, lined with buildings along every street edge
  const xs = [X0, ...NS.flatMap(([a, b]) => [a - 2, b + 2]), X1].sort((p, q) => p - q), zs = [bayZ + 2, ...EW.flatMap(([a, b]) => [a, b]), Z1].sort((p, q) => p - q);
  const cuts = (L) => { const out = []; for (let i = 0; i + 1 < L.length; i += 2) if (L[i + 1] - L[i] > 6) out.push([L[i], L[i + 1]]); return out; };
  let id = 0;
  for (const [bx0, bx1] of cuts(xs)) for (const [bz0, bz1] of cuts(zs)) {
    if (inMap((bx0 + bx1) / 2, (bz0 + bz1) / 2) || (bx1 > 0 && bx0 < W && bz0 < D)) continue;
    const dist = Math.max(0, -bx1, bx0 - W, bz0 - D), down = ((bx0 + bx1) / 2 > 110 && (bz0 + bz1) / 2 > 100) || (bx0 > W && bz0 > 60);
    block(bx0, bz0, bx1, bz1, dist, down, id++);
  }
  function block(x0, z0, x1, z1, dist, down, bi) {
    const dep = Math.min(16, (x1 - x0) / 2, (z1 - z0) / 2);
    const tall = (x, z) => { const h = hash(x * 0.37, z * 0.53); let fl = 3 + Math.floor(h * 6); if (down) fl = 6 + Math.floor(h * h * 30); if (dist > 120) fl += 3; return fl; };
    // the four sides; the near sides of the map are skipped where they would wall off the view
    const run = (ax, az, ux, uz, len, nx, nz) => {
      for (let s = 0; s < len - 4;) {
        const w = Math.min(len - s, 8 + Math.floor(hash(ax + s, az - s) * 12)), cx = ax + ux * (s + w / 2), cz = az + uz * (s + w / 2);
        const fl = tall(cx, cz), h = fl * 3 + 1.2;
        const bx0 = ux ? cx - w / 2 : nx > 0 ? ax : ax - dep, bx1 = ux ? cx + w / 2 : nx > 0 ? ax + dep : ax, bz0 = uz ? cz - w / 2 : nz > 0 ? az : az - dep, bz1 = uz ? cz + w / 2 : nz > 0 ? az + dep : az;
        building(bx0, bz0, bx1, bz1, h, hash(cx, cz), dist, fl);
        s += w + (hash(cz, cx) < 0.15 ? 2 : 0);
      }
    };
    run(x0, z0, 1, 0, x1 - x0, 0, 1); run(x0, z1, 1, 0, x1 - x0, 0, -1); run(x0, z0 + dep, 0, 1, z1 - z0 - 2 * dep, 1, 0); run(x1, z0 + dep, 0, 1, z1 - z0 - 2 * dep, -1, 0);
    void bi;
  }
  function building(x0, z0, x1, z1, h, k, dist, fl) {
    const [base, frame, kind] = SCHEMES[Math.floor(k * SCHEMES.length)];
    const wall = facadeTex(base, frame, night, kind), shop = h > 9 && dist < 140 ? shopTex(base, night) : null;
    const y0 = shop ? 3.2 : 0;
    if (shop) C.box(gk, shop, x0, 0, z0, x1, 3.2, z1, { skip: { top: true, bottom: true }, v0: 0 });
    C.box(gk, wall, x0, y0, z0, x1, h, z1, { top: roofT, skip: { bottom: true }, v0: y0 - 0.2 });
    // cornice and parapet, a band at the first floor
    const trim = TX.solid(TX.hex(TX.light(base, 0.25)));
    C.box(gk, trim, x0 - 0.25, h, z0 - 0.25, x1 + 0.25, h + 0.45, z1 + 0.25, { skip: { bottom: true } });
    if (shop) C.box(gk, TX.solid('#4a4640'), x0 - 0.12, 3.1, z0 - 0.12, x1 + 0.12, 3.45, z1 + 0.12, { skip: { bottom: true } });
    // rooftop: a water tank on stilts, a plant room, or a set-back crown on the tall ones
    const r = hash(k, 9), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (fl > 14 && r < 0.6) { const iw = (x1 - x0) * 0.3, id2 = (z1 - z0) * 0.3; C.box(gk, wall, cx - iw, h, cz - id2, cx + iw, h + 6 + r * 9, cz + id2, { top: roofT, skip: { bottom: true } }); }
    else if (r < 0.35) { const t = TX.solid('#6a5a48'); C.box(gk, t, cx - 1.1, h + 1.6, cz - 1.1, cx + 1.1, h + 3.6, cz + 1.1); for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) C.box(gk, TX.solid('#3a3a3e'), cx + dx - 0.08, h, cz + dz - 0.08, cx + dx + 0.08, h + 1.6, cz + dz + 0.08, { skip: { top: true, bottom: true } }); }
    else if (r < 0.75) C.box(gk, TX.solid('#9a9a96'), cx - 2, h, cz - 1.5, cx + 1, h + 2.2, cz + 1.2, { skip: { bottom: true } });
  }
  // ---- the far layer: hills, the bay's islands, a long bridge, the far shore
  farLayer(C, far, W, D, night, waterY);
}

/** low-poly scenery in the haze (vertex colours through solid textures; one merged mesh per material) */
function farLayer(C, gk, W, D, night, waterY) {
  const S = (c) => TX.solid(c);
  // a ridge of hills: a strip of triangles from a baseline up to a noisy crest
  const ridge = (ax, az, bx, bz, n, hmin, hmax, depth, col, seed, y0 = 0) => {
    const ux = bx - ax, uz = bz - az, L = Math.hypot(ux, uz), nx = -uz / L * depth, nz = ux / L * depth;
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, h = hmin + (hmax - hmin) * (0.5 + 0.35 * Math.sin(t * 7.1 + seed) + 0.15 * Math.sin(t * 23 + seed * 2)) * Math.sin(Math.min(1, t * 6, (1 - t) * 6) * Math.PI / 2);
      const p = [ax + ux * t, y0, az + uz * t], q = [ax + ux * t + nx * 0.5, y0 + h, az + uz * t + nz * 0.5], r = [ax + ux * t + nx, y0, az + uz * t + nz];
      if (prev) { const c1 = S(col[(i + seed) % col.length]), c2 = S(col[(i + seed + 1) % col.length]); C.quad(gk, c1, prev[0], p, q, prev[1]); C.quad(gk, c2, prev[1], q, r, prev[2]); }
      prev = [p, q, r];
    }
  };
  const hillsN = ['#5a6e58', '#62765e', '#556a54', '#6a7c62'], hillsFar = ['#7a8a86', '#82918c', '#76867f'], dry = ['#8a8a62', '#94926a', '#7e8058', '#a09a70'];
  // the far shore across the bay (north), its hills behind it, and the headlands west and east
  ridge(-1300, -1150, W + 1300, -1150, 60, 90, 260, -260, hillsFar, 3, waterY);
  ridge(-900, -820, W + 700, -860, 50, 40, 140, -160, hillsN, 7, waterY);
  ridge(-1300, -400, -620, -900, 20, 50, 160, 200, dry, 2, waterY);
  ridge(W + 700, -1000, W + 1300, -300, 20, 40, 150, -200, hillsN, 5, waterY);
  // the land ringing the city: hills to the west, south and east beyond the skirt
  ridge(-900, 300, -900, 900, 30, 60, 180, -240, dry, 4);
  ridge(-700, 980, W + 900, 980, 50, 50, 210, 240, hillsN, 9);
  ridge(W + 950, 900, W + 950, 0, 30, 70, 170, 240, dry, 6);
  ridge(-560, 60, -560, 760, 24, 15, 45, -120, hillsN, 11);
  // the far shore's town: a band of little blocks at the water's edge
  for (let i = 0; i < 70; i++) {
    const x = -700 + i * 22 + Math.sin(i * 3.1) * 6, z = -800 - Math.abs(Math.sin(i * 1.7)) * 30, w = 8 + (i % 4) * 4, h = 6 + ((i * 7) % 5) * 5;
    C.box(gk, S(['#c8c0b0', '#b0a898', '#d8d0c0', '#a89888'][i % 4]), x, waterY, z - w * 0.6, x + w, waterY + h, z, { skip: { bottom: true } });
  }
  // islands in the bay: a rocky one with a lighthouse, a low green one
  const island = (cx, cz, r, h, col) => { for (let i = 0; i < 12; i++) { const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2, k0 = 0.8 + 0.3 * Math.sin(i * 2.3), k1 = 0.8 + 0.3 * Math.sin((i + 1) * 2.3); C.tri(gk, S(col[i % col.length]), [cx + Math.cos(a0) * r * k0, waterY, cz + Math.sin(a0) * r * k0], [cx, waterY + h, cz], [cx + Math.cos(a1) * r * k1, waterY, cz + Math.sin(a1) * r * k1]); } };
  island(170, -420, 70, 34, ['#7a7466', '#6a665a', '#86806e']); island(-240, -560, 110, 26, ['#5e7252', '#687a58', '#566a4c']);
  C.box(gk, S('#e8e4dc'), 176, waterY + 30, -426, 182, waterY + 46, -420); C.box(gk, S('#3a3a3a'), 175, waterY + 46, -427, 183, waterY + 49, -419);
  // a long suspension bridge from the west shore out across the bay: two towers (three cross-beams each), a deck
  // on trusses, the main cables sagging between the towers and down to the anchorages, and the hangers
  const bc = '#8a6a5a', bcd = '#6e5446', A = [-420, -150], B = [-980, -720], deckY = 22;
  const lerp = (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L, px = -uz, pz = ux, half = 7;
  const seg = (p, q, y0, y1, w, col) => { const nx = px * w, nz = pz * w; C.quad(gk, S(col), [p[0] - nx, y0, p[1] - nz], [q[0] - nx, y1, q[1] - nz], [q[0] + nx, y1, q[1] + nz], [p[0] + nx, y0, p[1] + nz]); C.quad(gk, S(col), [p[0] - nx, y0 - 2.4, p[1] - nz], [q[0] - nx, y1 - 2.4, q[1] - nz], [q[0] - nx, y1, q[1] - nz], [p[0] - nx, y0, p[1] - nz]); C.quad(gk, S(col), [q[0] + nx, y1 - 2.4, q[1] + nz], [p[0] + nx, y0 - 2.4, p[1] + nz], [p[0] + nx, y0, p[1] + nz], [q[0] + nx, y1, q[1] + nz]); };
  const N = 24; for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N, a = lerp(t0), b = lerp(t1), y0 = deckY + Math.sin(t0 * Math.PI) * 6, y1 = deckY + Math.sin(t1 * Math.PI) * 6; seg(a, b, y0, y1, half, bcd); }
  const towers = [0.27, 0.73];
  for (const t of towers) {
    const [cx, cz] = lerp(t), yb = waterY, top = deckY + 88;
    for (const sd of [-1, 1]) { const ox = px * half * sd, oz = pz * half * sd; C.box(gk, S(bc), cx + ox - 1.6, yb, cz + oz - 1.6, cx + ox + 1.6, top, cz + oz + 1.6); }
    for (const y of [deckY + 20, deckY + 52, top - 6]) { const a = [cx - px * half, cz - pz * half], b = [cx + px * half, cz + pz * half]; C.box(gk, S(bc), Math.min(a[0], b[0]) - 1, y, Math.min(a[1], b[1]) - 1, Math.max(a[0], b[0]) + 1, y + 4, Math.max(a[1], b[1]) + 1); }
    C.box(gk, S('#5a5a5a'), cx - 8, waterY - 1, cz - 8, cx + 8, waterY + 4, cz + 8, { skip: { bottom: true } });
  }
  // cables: two catenaries per side between the towers, and the side spans down to the deck ends
  const cable = (t0, t1, yA, yB, sag) => {
    const M = 16;
    for (const sd of [-1, 1]) for (let i = 0; i < M; i++) {
      const a = i / M, b = (i + 1) / M, pa = lerp(t0 + (t1 - t0) * a), pb = lerp(t0 + (t1 - t0) * b), ya = yA + (yB - yA) * a - sag * 4 * a * (1 - a), yb = yA + (yB - yA) * b - sag * 4 * b * (1 - b), ox = px * half * sd, oz = pz * half * sd;
      C.quad(gk, S('#7a5e50'), [pa[0] + ox, ya - 0.6, pa[1] + oz], [pb[0] + ox, yb - 0.6, pb[1] + oz], [pb[0] + ox, yb + 0.6, pb[1] + oz], [pa[0] + ox, ya + 0.6, pa[1] + oz]);
      if (i % 2 === 0 && i) C.quad(gk, S('#7a5e50'), [pa[0] + ox - 0.15 * pz, deckY + 6 * Math.sin((t0 + (t1 - t0) * a) * Math.PI), pa[1] + oz], [pa[0] + ox + 0.25, deckY + 6 * Math.sin((t0 + (t1 - t0) * a) * Math.PI), pa[1] + oz + 0.25], [pa[0] + ox + 0.25, ya, pa[1] + oz + 0.25], [pa[0] + ox - 0.15 * pz, ya, pa[1] + oz]);
    }
  };
  const top = deckY + 86; cable(towers[0], towers[1], top, top, 70); cable(0, towers[0], deckY + 4, top, 14); cable(towers[1], 1, top, deckY + 4, 14);
  // night: the bridge and the far shore twinkle
  if (night) for (let i = 0; i <= 20; i++) { const [x, z] = lerp(i / 20); C.light(x, deckY + 3, z, { color: 0xffc888, intensity: 0.0, r: 0.01, halo: 3.5 }); }
  for (let i = 0; night && i < 50; i++) C.light(-680 + i * 30, waterY + 8, -805, { color: 0xffd8a0, intensity: 0, r: 0.01, halo: 5 });
  void D;
}
