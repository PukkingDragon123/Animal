// Detailed voxel street furniture: the props you walk past most, sculpted from real shapes and then voxelised —
// lathed cast-iron lamp posts with lantern heads, slatted benches on iron frames, ribbed litter bins, hydrants with
// their bonnets and outlets, mail boxes, bollards, traffic cones, bike hoops, street-name signs, timber utility poles
// with cross-arms and insulators, and cars (sedans and hatchbacks with glass greenhouses, bumpers, mirrors, tyres,
// rims and lamps that glow at night). Each shape is built with city/meshkit.js, then rasterised into a fine voxel
// volume (24 voxels per metre for street furniture, 16 for cars: chunky, but every trim, collar and slat is there),
// its inside filled, and every voxel painted on a ramp: lit tops, darker undersides and crevices, so it reads
// hand-painted. The stock voxel kinds are swapped for these in remapProps() (collision stays the
// stock one); build.js bakes them into the same static meshes as every other voxel prop.
import * as THREE from '../../../vendor/three.module.js';
import { PROPS, SURF } from './voxprops.js';
import { Geo } from './meshkit.js';
import { GLOW } from '../fine.js';

Geo.prototype.noPaint = true;   // the voxel ramps below do the painting
const hh = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const srgb = (v) => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)));
/** rasterise geometry parts ({ opaque: Geo, glow: Geo }) into voxels → { X, Y, Z, cells: Int32Array (rgb | glow << 24, -1 = air) } */
function voxelize(parts, vpm, o = {}) {
  let hx = 0, hz = 0, my = 0;
  for (const G of Object.values(parts)) if (G) for (let i = 0; i < G.P.length; i += 3) { hx = Math.max(hx, Math.abs(G.P[i])); my = Math.max(my, G.P[i + 1]); hz = Math.max(hz, Math.abs(G.P[i + 2])); }
  const Xh = Math.ceil(hx * vpm) + 1, Zh = Math.ceil(hz * vpm) + 1, X = Xh * 2, Z = Zh * 2, Y = Math.ceil(my * vpm) + 2, N = X * Y * Z;
  const cells = new Int32Array(N).fill(-1), at = (x, y, z) => (y * Z + z) * X + x;
  for (const [part, G] of Object.entries(parts)) {
    if (!G) continue;
    const glow = part === 'glow' ? 1 << 24 : 0, P = G.P, C = G.C, I = G.I;
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const e = Math.max(Math.hypot(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]), Math.hypot(P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]), Math.hypot(P[c] - P[b], P[c + 1] - P[b + 1], P[c + 2] - P[b + 2]));
      const n = Math.max(1, Math.ceil(e * vpm * 1.6));
      for (let u = 0; u <= n; u++) for (let v = 0; v <= n - u; v++) {
        const wb = u / n, wc = v / n, wa = 1 - wb - wc;
        const x = P[a] * wa + P[b] * wb + P[c] * wc, y = P[a + 1] * wa + P[b + 1] * wb + P[c + 1] * wc, z = P[a + 2] * wa + P[b + 2] * wb + P[c + 2] * wc;
        const ix = Math.floor(x * vpm) + Xh, iy = Math.max(0, Math.floor(y * vpm)), iz = Math.floor(z * vpm) + Zh;
        if (ix < 0 || iy >= Y || iz < 0 || ix >= X || iz >= Z) continue;
        const k = at(ix, iy, iz); if (cells[k] >= 0 && !glow && cells[k] >= 1 << 24) continue;
        const r = srgb(C[a] * wa + C[b] * wb + C[c] * wc), g = srgb(C[a + 1] * wa + C[b + 1] * wb + C[c + 1] * wc), bl = srgb(C[a + 2] * wa + C[b + 2] * wb + C[c + 2] * wc);
        cells[k] = (r << 16) | (g << 8) | bl | glow;
      }
    }
  }
  // the outside air (flood from the border); anything enclosed becomes solid (no hidden inner faces)
  const out = new Uint8Array(N), q = [];
  const push = (x, y, z) => { if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return; const k = at(x, y, z); if (out[k] || cells[k] >= 0) return; out[k] = 1; q.push(x, y, z); };
  for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) { push(0, y, z); push(X - 1, y, z); }
  for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) { push(x, y, 0); push(x, y, Z - 1); }
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) push(x, Y - 1, z);
  while (q.length) { const z = q.pop(), y = q.pop(), x = q.pop(); push(x + 1, y, z); push(x - 1, y, z); push(x, y + 1, z); push(x, y - 1, z); push(x, y, z + 1); push(x, y, z - 1); }
  for (let k = 0; k < N; k++) if (cells[k] < 0 && !out[k]) cells[k] = 0x24201c;
  // painted ramps: lit where open to the sky, darker underneath and in the crevices (optional clustered colour noise)
  const air = (x, y, z) => x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z || out[at(x, y, z)];
  const res = new Int32Array(cells);
  for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const k = at(x, y, z), v = cells[k]; if (v < 0 || v >= 1 << 24) continue;
    let f = 1;
    if (air(x, y + 1, z)) f *= 1.13; else if (!air(x + 1, y, z) && !air(x - 1, y, z) && !air(x, y, z + 1) && !air(x, y, z - 1)) f *= 0.9;
    if (y > 0 && air(x, y - 1, z)) f *= 0.8;
    if (o.noise) f *= 1 + (hh(x >> 2, y >> 2, z >> 2) - 0.5) * o.noise;   // (off by default: it would split the greedy mesher's faces)
    const r = Math.min(255, ((v >> 16) & 255) * f), g = Math.min(255, ((v >> 8) & 255) * f), b = Math.min(255, (v & 255) * f);
    res[k] = (r << 16) | (g << 8) | b;
  }
  return { X, Y, Z, cells: res };
}
const q4 = (v) => Math.min(255, Math.round(v / 6) * 6);
const hex = (v) => '#' + [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => q4(c).toString(16).padStart(2, '0')).join('');
const VOX = new Map();
const def = (kind, r, make, vpm = 24, o = {}) => {
  const vox = () => { if (!VOX.has(kind)) VOX.set(kind, voxelize(make(), vpm, o)); return VOX.get(kind); };
  PROPS[kind] = {
    get size() { const v = vox(); return [v.X, v.Y, v.Z]; }, r, vpm, painted: true,
    build(F) { const { X, Y, Z, cells } = vox(); for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { const v = cells[(y * Z + z) * X + x]; if (v >= 0) F.set(x, y, z, F.c(hex(v), v >= 1 << 24 ? GLOW : 0)); } },
  };
};
const ring = (G, y, r, h, n = 16) => G.cyl([0, y, 0], [0, y + h, 0], r, r, n, { caps: true });

// ---- the lamp post: an octagonal plinth, a fluted tapering column with collars, a scrolled arm and a lantern
def('rl_lamp', 0.2, () => {
  const G = new Geo(), L = new Geo(), iron = '#2c3832', hi = '#3c4a42';
  G.mat(iron, 'iron').lathe([0, 0, 0], [[0.24, 0], [0.24, 0.08], [0.2, 0.12], [0.2, 0.42], [0.15, 0.5], [0.1, 0.7]], 8);
  G.mat(iron, 'iron').cyl([0, 0.68, 0], [0, 3.9, 0], 0.085, 0.06, 8);
  for (const y of [0.9, 2.2, 3.6]) G.mat(hi, 'iron').lathe([0, y, 0], [[0.1, 0], [0.11, 0.04], [0.1, 0.08]], 8);
  // the scroll under the head
  for (const s of [-1, 1]) G.mat(iron, 'iron').tube([[0, 3.55, 0], [0.18 * s, 3.66, 0], [0.22 * s, 3.82, 0], [0.12 * s, 3.9, 0], [0.04 * s, 3.88, 0]], 0.018, 4, { seg: 8 });
  // the lantern: a cast base, four glass panes with corner posts, a domed cap and a finial
  G.mat(iron, 'iron').lathe([0, 3.9, 0], [[0.001, 0], [0.11, 0], [0.17, 0.08], [0.18, 0.11], [0.001, 0.11]], 8);
  L.mat('#ffe6b0', 'light', { flat: true }).cyl([0, 4.0, 0], [0, 4.42, 0], 0.15, 0.2, 4, { caps: true });
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; G.mat(iron, 'iron').cyl([Math.cos(a) * 0.15, 4.0, Math.sin(a) * 0.15], [Math.cos(a) * 0.205, 4.43, Math.sin(a) * 0.205], 0.012, 0.012, 4); }
  G.mat(iron, 'iron').lathe([0, 4.42, 0], [[0.001, 0], [0.27, 0], [0.27, 0.03], [0.19, 0.1], [0.08, 0.19], [0.03, 0.24], [0.03, 0.32], [0.05, 0.34], [0.001, 0.38]], 4, { ry: Math.PI / 4 });
  return { opaque: G, glow: L };
}, 16, { noise: 0 });
// ---- the bench: two cast-iron end frames, five seat slats and three back slats, arm rests
def('rl_bench', [1.7, 0.6], () => {
  const G = new Geo(), iron = '#2a2e2c', woods = ['#8a5a36', '#94643c', '#7e5232', '#9a6a40', '#86583a'];
  for (const x of [-0.78, 0.78]) {
    G.mat(iron, 'iron').box([x, 0.21, 0.08], [0.06, 0.42, 0.06]).box([x, 0.21, -0.2], [0.06, 0.42, 0.06]).box([x, 0.42, -0.04], [0.06, 0.05, 0.52]);
    G.mat(iron, 'iron').box([x, 0.66, 0.24], [0.05, 0.5, 0.05], { rx: -0.22 });
    G.mat(iron, 'iron').tube([[x, 0.43, -0.25], [x, 0.6, -0.27], [x, 0.66, -0.12], [x, 0.62, 0.05]], 0.025, 5);
    G.mat(iron, 'iron').box([x, 0.02, -0.06], [0.08, 0.04, 0.5]);
  }
  for (let i = 0; i < 5; i++) G.mat(woods[i], 'wood').rbox([0, 0.46, -0.24 + i * 0.1], [1.72, 0.035, 0.08], 0.012);
  for (let i = 0; i < 3; i++) G.mat(woods[(i + 2) % 5], 'wood').rbox([0, 0.58 + i * 0.12, 0.27 + i * 0.026], [1.72, 0.09, 0.03], 0.01, { rx: -0.22 });
  return { opaque: G };
});
// ---- the litter bin: a ribbed steel drum on a plinth, a dome lid with a throat, a liner lip
def('rl_bin', 0.3, () => {
  const G = new Geo(), g = '#2e4a3a';
  G.mat('#3a3a3a', 'iron').cyl([0, 0, 0], [0, 0.06, 0], 0.27, 0.27, 16, { caps: true });
  const prof = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; prof.push(a); }
  G.mat(g, 'enamel').cyl([0, 0.06, 0], [0, 0.88, 0], 0.27, 0.3, 24);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; G.mat('#26402f', 'enamel').box([Math.cos(a) * 0.29, 0.47, Math.sin(a) * 0.29], [0.035, 0.78, 0.035], { ry: -a }); }
  for (const y of [0.1, 0.84]) G.mat('#3e5c48', 'enamel').cyl([0, y, 0], [0, y + 0.04, 0], 0.305, 0.305, 24, { caps: false });
  G.mat(g, 'enamel').lathe([0, 0.88, 0], [[0.001, 0.2], [0.12, 0.2], [0.22, 0.15], [0.3, 0.05], [0.31, 0], [0.001, 0]], 20);
  G.mat('#141614', 'rubber').box([0, 0.97, 0.22], [0.26, 0.09, 0.08]);
  return { opaque: G };
});
// ---- the hydrant: a flanged foot, a barrel, the bonnet with its operating nut, two side outlets and a steamer cap
def('rl_hydrant', 0.2, () => {
  const G = new Geo(), red = '#b33a2e', cap = '#c8c2b4';
  G.mat(red, 'enamel').lathe([0, 0, 0], [[0.001, 0], [0.17, 0], [0.17, 0.05], [0.12, 0.08], [0.12, 0.56], [0.15, 0.6], [0.15, 0.64], [0.12, 0.66], [0.1, 0.76], [0.05, 0.8], [0.001, 0.8]], 14);
  G.mat(red, 'enamel').cyl([0, 0.8, 0], [0, 0.86, 0], 0.03, 0.03, 5, { caps: true });
  for (const s of [-1, 1]) { G.mat(red, 'enamel').cyl([0, 0.44, 0], [0.19 * s, 0.44, 0], 0.05, 0.045, 10, { caps: true }); G.mat(cap, 'paint').cyl([0.19 * s, 0.44, 0], [0.22 * s, 0.44, 0], 0.055, 0.055, 6, { caps: true }); }
  G.mat(red, 'enamel').cyl([0, 0.38, 0], [0, 0.38, 0.2], 0.075, 0.07, 12, { caps: true }); G.mat(cap, 'paint').cyl([0, 0.38, 0.2], [0, 0.38, 0.24], 0.08, 0.08, 6, { caps: true });
  return { opaque: G };
});
// ---- the mail box: a rounded-top steel box on a pedestal, a pull-down chute, a collection plate
def('rl_mailbox', 0.22, () => {
  const G = new Geo(), b = '#2a4a8a';
  G.mat('#1e2a40', 'iron').box([0, 0.2, 0], [0.18, 0.4, 0.18]).box([0, 0.02, 0], [0.32, 0.04, 0.32]);
  G.mat(b, 'enamel').extrude([[-0.26, 0.4], [0.26, 0.4], [0.26, 0.98], [0.2, 1.08], [0.08, 1.13], [-0.08, 1.13], [-0.2, 1.08], [-0.26, 0.98]], 0.46, { bevel: 0.015, at: [0, 0, 0], ry: Math.PI / 2 });
  G.mat('#1c2c50', 'steel').box([0, 0.98, 0.235], [0.34, 0.08, 0.02]).box([0, 0.98, 0.25], [0.3, 0.02, 0.02]);
  G.mat('#e8e2d2', 'paint').box([0, 0.7, 0.236], [0.22, 0.12, 0.01]);
  return { opaque: G };
});
// ---- the bollard: a cast post with a domed top and a reflective band
def('rl_bollard', 0.12, () => {
  const G = new Geo();
  G.mat('#2e3236', 'iron').lathe([0, 0, 0], [[0.001, 0], [0.11, 0], [0.1, 0.06], [0.085, 0.1], [0.085, 0.78], [0.095, 0.82], [0.07, 0.9], [0.001, 0.93]], 12);
  G.mat('#e8c040', 'paint').cyl([0, 0.66, 0], [0, 0.72, 0], 0.088, 0.088, 12);
  return { opaque: G };
});
// ---- the traffic cone: a square foot, a cone with two reflective sleeves
def('rl_cone', 0.15, () => {
  const G = new Geo();
  G.mat('#e0602a', 'plastic').box([0, 0.015, 0], [0.4, 0.03, 0.4]);
  G.mat('#e8682c', 'plastic').lathe([0, 0.03, 0], [[0.15, 0], [0.025, 0.68], [0.001, 0.69]], 16);
  for (const [y0, y1] of [[0.3, 0.38], [0.48, 0.54]]) G.mat('#f0f0ec', 'paint').cyl([0, y0, 0], [0, y1, 0], 0.15 - (y0 - 0.03) * 0.184 + 0.004, 0.15 - (y1 - 0.03) * 0.184 + 0.004, 16);
  return { opaque: G };
});
// ---- bike hoops: three galvanised inverted U's on a rail
def('rl_bikeRack', [1.5, 0.4], () => {
  const G = new Geo();
  for (const x of [-0.6, 0, 0.6]) G.mat('#9aa0a6', 'steel').tube([[x - 0.25, 0, 0], [x - 0.25, 0.6, 0], [x - 0.18, 0.78, 0], [x, 0.82, 0], [x + 0.18, 0.78, 0], [x + 0.25, 0.6, 0], [x + 0.25, 0, 0]], 0.025, 6, { seg: 24 });
  return { opaque: G };
});
// ---- a street-name sign: a pole with a cap, two crossed blades
def('rl_sign', 0.15, () => {
  const G = new Geo();
  G.mat('#6a6e72', 'steel').cyl([0, 0, 0], [0, 2.6, 0], 0.035, 0.03, 8).lathe([0, 2.6, 0], [[0.001, 0], [0.05, 0], [0.001, 0.06]], 8);
  G.mat('#2a6a46', 'enamel').box([0.35, 2.42, 0], [0.8, 0.16, 0.02]).box([0, 2.24, 0.35], [0.02, 0.16, 0.8]);
  G.mat('#e8ece4', 'paint', { flat: true }).box([0.35, 2.42, 0.012], [0.7, 0.03, 0.005]).box([0.012, 2.24, 0.35], [0.005, 0.03, 0.7]);
  return { opaque: G };
});
// ---- the utility pole: a timber pole, two cross-arms with insulators, a transformer can, a street light arm
def('rl_upole', 0.2, () => {  // (20 voxels per metre: it is tall)
  const G = new Geo(), wood = '#5e4a38';
  G.mat(wood, 'wood').cyl([0, 0, 0], [0, 8.3, 0], 0.15, 0.11, 10, { caps: true });
  for (const [y, w] of [[7.6, 2.2], [6.6, 1.7]]) { G.mat('#54402e', 'wood').box([0, y, 0], [w, 0.1, 0.12]); for (const x of [-w / 2 + 0.12, -0.25, 0.25, w / 2 - 0.12]) G.mat('#d8e0dc', 'glass').lathe([x, y + 0.05, 0], [[0.045, 0], [0.06, 0.03], [0.04, 0.06], [0.055, 0.09], [0.03, 0.14], [0.001, 0.15]], 8); G.mat('#3a3a3a', 'steel').tube([[-0.05, y - 0.05, 0.08], [-0.35, y - 0.45, 0.08]], 0.015, 4).tube([[0.05, y - 0.05, 0.08], [0.35, y - 0.45, 0.08]], 0.015, 4); }
  G.mat('#7a8088', 'steel').cyl([0.3, 5.0, 0], [0.3, 5.9, 0], 0.22, 0.22, 12, { caps: true }).lathe([0.3, 5.9, 0], [[0.001, 0.1], [0.24, 0], [0.001, 0]], 12);
  G.mat('#3a3e44', 'steel').tube([[0, 2.6, 0], [0, 2.7, -0.4], [0, 2.75, -0.9]], 0.02, 5).cyl([0.15, 2.55, 0], [0.15, 3.2, 0], 0.05, 0.05, 6);
  return { opaque: G };
}, 16, { noise: 0 });
// ---- cars: a sedan or a hatchback. The body is an extruded, bevelled side profile with the wheel arches cut in
// shadow, a glass greenhouse with painted pillars and roof, bumpers, mirrors, door seams, a grille, tyres with
// alloy rims, and lamps (glow part: headlamps warm white, tail lamps red)
const CAR_COLS = ['#d6d6d2', '#a6aaae', '#26282c', '#2c3c5c', '#8a2c28', '#5a5e62', '#b4a888', '#3a5446', '#e2dccc', '#6a2e3e'];
for (let i = 0; i < CAR_COLS.length * 2; i++) {
  const col = CAR_COLS[i % CAR_COLS.length], hatch = i >= CAR_COLS.length;
  def('rl_car' + i, [4.3, 2.0], () => car(col, hatch), 16, { noise: 0 });
}
function car(col, hatch) {
  const G = new Geo(), L = new Geo(), W = 1.78, len = hatch ? 4.0 : 4.5, h = len / 2;
  const lower = hatch
    ? [[-h, 0.34], [h - 0.1, 0.34], [h, 0.52], [h, 0.78], [h - 0.3, 0.92], [-h + 0.05, 0.96], [-h, 0.8]]
    : [[-h, 0.34], [h - 0.1, 0.34], [h, 0.5], [h, 0.76], [h - 0.35, 0.9], [-h + 0.2, 0.96], [-h, 0.86], [-h + 0.02, 0.5]];
  G.mat(col, 'paint').extrude(lower, W, { bevel: 0.07, curve: 3 });
  // the greenhouse: glass all round, then the painted pillars and roof over it
  const gh = hatch ? [[-h + 0.08, 0.95], [0.9, 0.93], [0.35, 1.38], [-h + 0.25, 1.4]] : [[-1.25, 0.95], [1.05, 0.92], [0.45, 1.38], [-0.85, 1.4]];
  G.mat('#1a2028', 'glass').extrude(gh, W - 0.18, { bevel: 0.03, curve: 2 });
  const rx0 = hatch ? -h + 0.25 : -0.85, rx1 = hatch ? 0.35 : 0.45;
  G.mat(col, 'paint').rbox([(rx0 + rx1) / 2, 1.405, 0], [rx1 - rx0 + 0.1, 0.06, W - 0.16], 0.025);
  for (const s of [-1, 1]) {
    const z = s * (W / 2 - 0.1);
    G.mat(col, 'paint').box([(rx0 + rx1) / 2 - 0.05, 1.16, z], [0.08, 0.46, 0.04]);                       // B pillar
    G.mat('#202224', 'plastic').box([hatch ? 0.95 : 1.1, 1.0, s * (W / 2 + 0.06)], [0.12, 0.08, 0.1]);    // mirror
    G.mat('#2a2c30', 'plastic').box([0, 0.38, s * (W / 2 - 0.02)], [len - 0.9, 0.08, 0.04]);              // sill
    G.mat(col, 'paint').box([0, 0.75, s * (W / 2 + 0.005)], [0.012, 0.36, 0.01]);                         // door seam (painted shadow)
    for (const x of [-h + 0.85, h - 0.82]) {
      G.mat('#151515', 'rubber').cyl([x, 0.33, s * (W / 2 - 0.12)], [x, 0.33, s * (W / 2 + 0.03)], 0.33, 0.33, 16, { caps: true });
      G.mat('#b8bcc0', 'chrome').cyl([x, 0.33, s * (W / 2 + 0.03)], [x, 0.33, s * (W / 2 + 0.04)], 0.2, 0.2, 10, { caps: true });
      G.mat('#0e0e10', 'rubber', { flat: true }).cyl([x, 0.36, s * (W / 2 - 0.15)], [x, 0.36, s * (W / 2 + 0.005)], 0.38, 0.38, 12);   // the arch's shadow
    }
  }
  G.mat('#1e2022', 'plastic').rbox([h - 0.02, 0.45, 0], [0.12, 0.2, W - 0.1], 0.04).rbox([-h + 0.02, 0.47, 0], [0.12, 0.22, W - 0.1], 0.04);   // bumpers
  G.mat('#2a2c30', 'steel').box([h + 0.005, 0.64, 0], [0.04, 0.12, 0.7]);                                    // grille
  G.mat('#e8e4d8', 'paint', { flat: true }).box([-h - 0.03, 0.52, 0], [0.01, 0.1, 0.42]);                    // plate
  G.mat('#101012', 'rubber', { flat: true }).box([0, 0.2, 0], [len - 0.4, 0.2, W - 0.3]);                    // underbody
  for (const s of [-1, 1]) { L.mat('#fff2d0', 'light', { flat: true }).box([h - 0.04, 0.7, s * (W / 2 - 0.26)], [0.06, 0.1, 0.32]); L.mat('#e02818', 'light', { flat: true }).box([-h + 0.0, 0.76, s * (W / 2 - 0.22)], [0.05, 0.1, 0.28]); }
  return { opaque: G, glow: L };
}

// what they are made of (roughness, metalness of the baked statics)
Object.assign(SURF, { rl_lamp: [0.5, 0.35], rl_bench: [0.72, 0.05], rl_bin: [0.5, 0.15], rl_hydrant: [0.42, 0.1], rl_mailbox: [0.38, 0.12], rl_bollard: [0.5, 0.2], rl_cone: [0.6, 0], rl_bikeRack: [0.35, 0.6], rl_sign: [0.42, 0.15], rl_upole: [0.85, 0] });
for (let i = 0; i < CAR_COLS.length * 2; i++) SURF['rl_car' + i] = [0.3, 0.12];
// ---------------------------------------------------------------- the swap
const SWAP = { lamp: 'rl_lamp', bench: 'rl_bench', bin: 'rl_bin', hydrant: 'rl_hydrant', mailbox: 'rl_mailbox', bollard: 'rl_bollard', cone: 'rl_cone', bikeRack: 'rl_bikeRack', sign: 'rl_sign', upole: 'rl_upole' };
const CAR_RE = /^(car|dt_car\d+|sr_car\w*)$/;
const h2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
/** swap the stock voxel kinds for the modelled ones (keeps p.orig for code that looks props up by kind); ?voxprops=1 keeps them */
export function remapProps(C) {
  if (typeof location !== 'undefined' && /[?&]voxprops=1/.test(location.search)) return;
  for (const p of C.props) {
    const to = SWAP[p.kind] || (CAR_RE.test(p.kind) ? 'rl_car' + Math.floor(h2(p.x, p.z) * CAR_COLS.length * 2) : null);
    if (!to || !PROPS[to]) continue;
    p.orig = p.kind; p.kind = to;
    // the stock car faced +x at 4.5 m; the bench's back was at +z (both kept); the lamp head sat at 4.5 m
    if (to === 'rl_upole') p.s = (p.s || 1) * 1.02;
  }
}
void THREE;
