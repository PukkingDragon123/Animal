// Friends' and rivals' Tokonmon as 3D models for the 3D → pixel renderer (src/px/sdf.js):
// Kanizumo (Coach Gonda), Zapanda (Mika), Beatlet (Taro) and Studrat (Team Metallica).
// Units ≈ sprite pixels; y up, ground at y = 0, the creature faces +z.
export const SPRITES = {};

// ---------------------------------------------------------------- helpers
// mirror a left part (+x) into its right twin (−x)
function mirror(p) {
  const fx = (v) => (Array.isArray(v) && typeof v[0] === 'number' ? [-v[0], ...v.slice(1)] : v);
  const shape = (s) => {
    const out = s.map((v, i) => {
      if (i === 0) return v;
      if (s[0] === 'chain' && i === 1) return v.map((q) => [-q[0], q[1], q[2], q[3]]);
      if (Array.isArray(v) && v.length === 3 && typeof v[0] === 'number' && !(s[0] === 'ell' && i === 2) && !(s[0] === 'box' && i === 2)) return fx(v);
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const o = Object.assign({}, v);
        if (o.rot) o.rot = [o.rot[0], -o.rot[1], -o.rot[2]];
        if (o.grad) o.grad = Object.assign({}, o.grad, { a: fx(o.grad.a), b: fx(o.grad.b) });
        if (o.minus) o.minus = shape(o.minus);
        if (o.on) o.on = o.on.map((n) => n.replace(/L$/, 'R'));
        return o;
      }
      return v;
    });
    return out;
  };
  return Object.assign({}, p, { n: p.n.replace(/L$/, 'R'), parent: p.parent && p.parent.replace(/L$/, 'R'), p: fx(p.p), s: p.s.map(shape) });
}
// scale a whole model about the ground origin (positions, radii, smoothing, paint extents)
function scaleModel(parts, k) {
  const v = (a) => a.map((x) => x * k);
  const shape = (sh) => sh.map((x, i) => {
    if (i === 0) return x;
    if (sh[0] === 'chain' && i === 1) return x.map((q) => q.map((c) => c * k));
    if (typeof x === 'number') return x * k;
    if (Array.isArray(x)) return v(x);
    if (x && typeof x === 'object') {
      const o = Object.assign({}, x);
      if (o.k) o.k *= k;
      if (o.wob) o.wob *= k;
      if (o.grad) o.grad = Object.assign({}, o.grad, { a: v(o.grad.a), b: v(o.grad.b) });
      if (o.minus) o.minus = shape(o.minus);
      return o;
    }
    return x;
  });
  return parts.map((p) => Object.assign({}, p, { p: p.p && v(p.p), s: (p.s || []).map(shape) }));
}
const both = (p) => [p, mirror(p)];
const paintOn = (on, extra = {}) => Object.assign({ paint: true, on }, extra);
const sym = (x, f) => [f(x), f(-x)];                      // a left/right pair of shapes
// floating hearts (happy) and sleep z's, shared by every design
const hearts = (y0) => [[-16, y0, 6, 3.4], [17, y0 + 8, 2, 2.8]].map(([x, y, z, r], i) => ({ n: 'heart' + i, p: [x, y, z], bill: true, show: 'hearts', s: [
  ['sph', [x - r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'], ['sph', [x + r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'],
  ['cone', [x, y + r * 0.1, z], [x, y - r * 1, z], r * 0.75, r * 0.12, 'heart', { k: r * 0.4 }]] }));
const zzz = (x, y) => [0, 1, 2].map((i) => ({ n: 'zz' + i, p: [x, y, 0], bill: true, show: 'zz', s: [
  ['box', [x, y + 3, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [x, y - 3, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [x, y, 0], [3.9, 0.7, 0.7], 0.3, 'zz', { rot: [0, 0, 52] }]] }));
// standard painted anime eye: dark eye, coloured iris with a lighter lower crescent, two white shines
const animeEye = (on, x, y, z, [w, h], o = {}) => {
  const s = Math.sign(x) || 1, sh = o.shine ?? 0;
  return [
    ['ell', [x, y, z], [w, h, o.d ?? 4], 'eye', paintOn(on, { rot: o.rot })],
    ['ell', [x + (o.look ?? 0) * s, y - h * 0.3, z + 0.3], [w * 0.76, h * 0.68, o.d ?? 4], 'iris', paintOn(on)],
    ['ell', [x + (o.look ?? 0) * s, y - h * 0.56, z + 0.4], [w * 0.5, h * 0.3, o.d ?? 4], 'iris2', paintOn(on)],
    ['ell', [x - w * 0.36, y + h * 0.36 - sh, z + 0.7], [w * 0.42, h * 0.37, 3], 'shine', paintOn(on)],
    ['ell', [x + w * 0.38, y - h * 0.55, z + 0.7], [w * 0.22, w * 0.22, 3], 'shine', paintOn(on)],
  ];
};
const lineOn = (on, z) => (x, y, rz, len = 3, w = 0.75, mat = 'eye') => ['ell', [x, y, z], [len, w, 4], mat, paintOn(on, { rot: [0, 0, rz] })];
// standard expression set built from a line painter
const exprSet = (parent, on, E, EY, EZ, L, o = {}) => [
  { n: 'eyesClosed', parent, p: [0, EY, EZ], show: 'closed', s: [L(E, EY - (o.dy ?? 1), 0, o.len), L(-E, EY - (o.dy ?? 1), 0, o.len)] },
  { n: 'eyesHappy', parent, p: [0, EY, EZ], show: 'happy', s: [L(E - 1.3, EY - (o.hy ?? 0), 34, 2), L(E + 1.3, EY - (o.hy ?? 0), -34, 2), L(-E - 1.3, EY - (o.hy ?? 0), 34, 2), L(-E + 1.3, EY - (o.hy ?? 0), -34, 2)] },
  { n: 'eyesHurt', parent, p: [0, EY, EZ], show: 'hurt', s: [L(E + 0.6, EY + 1.1 - (o.hy ?? 0), 28, 2.2), L(E + 0.6, EY - 1.1 - (o.hy ?? 0), -28, 2.2), L(-E - 0.6, EY + 1.1 - (o.hy ?? 0), -28, 2.2), L(-E - 0.6, EY - 1.1 - (o.hy ?? 0), 28, 2.2)] },
  { n: 'eyesKO', parent, p: [0, EY, EZ], show: 'ko', s: [L(E, EY - (o.hy ?? 0), 45, 2.6), L(E, EY - (o.hy ?? 0), -45, 2.6), L(-E, EY - (o.hy ?? 0), 45, 2.6), L(-E, EY - (o.hy ?? 0), -45, 2.6)] },
];
// emissive ramps for each element's special attack
const RAMP = {
  water: ['#14306a', '#1f5ab0', '#2fa8ff', '#7ad8ff', '#c8f4ff', '#ffffff'],
  volt: ['#5a2a10', '#b8601a', '#ffb21a', '#ffe23a', '#fff8a8', '#ffffff'],
  leaf: ['#123a24', '#1f6a34', '#3aa848', '#7ce060', '#c8f8a8', '#ffffff'],
  steel: ['#262a3a', '#4a5468', '#7a8aa0', '#b8c4d0', '#e8f0fa', '#ffffff'],
};
const glowMats = (ramp) => ({
  fCore: { c: ramp[5], emit: true, heat: 1, fire: ramp },
  fY: { c: ramp[4], emit: true, heat: 0.78, fire: ramp },
  fO: { c: ramp[3], emit: true, heat: 0.58, fire: ramp },
});
// painted eye decals are flat colour so the lit side of the head never washes them out
const flat = (c) => ({ c, flat: true, ramp: [c, c, c, c, c, c] });
const eyeMats = (eye, iris, iris2) => ({ eye: flat(eye), iris: flat(iris), iris2: flat(iris2) });
const COMMON = { shine: { c: '#ffffff', flat: true }, heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true } };

// ---------------------------------------------------------------- Kanizumo (Hydro/Geo)
// Coach Gonda's partner: a big red crab that stands up on its hind legs like a sumo
// wrestler in the crouch before the charge. Its cream underside is a round sumo belly
// hanging over a navy mawashi with stiff sagari cords; it slaps with flat claw-palms,
// wears a black ginkgo-leaf topknot behind kind stalk eyes, and the back of its shell
// carries the stern "game face" of a Heike crab.
{
  const E = 7.2, EY = 51.4, EC = 6, ER = 6, EZ = EC + ER;          // eyeballs: x, height, centre depth, radius, front surface
  const eye = (x) => animeEye(['head'], x, EY, EZ, [4.3, 5], { d: 3.6 });
  const L = lineOn(['head'], EZ + 0.2);
  const FZ = 13.3;                                                // face front at the mouth
  const tipped = (a, b, t = 0.55) => ({ a, b, stops: [[0, 'shell'], [t, 'tip']] });
  SPRITES.kanizumo = {
    id: 'kanizumo', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#2a0a14',
    pal: {
      shell: { c: '#d0382a', gloss: true, ramp: ['#4a0e2a', '#781a34', '#a8282e', '#d0382a', '#ec5a36', '#ffa888'] },
      shellD: { c: '#8a1f30', ramp: ['#3a0a22', '#52102c', '#6a1830', '#8a2232', '#a83030', '#c84a3a'] },
      tip: { c: '#4a1a2a', ramp: ['#16060e', '#260a16', '#38101e', '#4e1a28', '#6a2a34', '#8a4448'] },
      belly: { c: '#f6e3c4', ramp: ['#5a3a40', '#9a7a72', '#c8a88a', '#f2dcbc', '#fff0d8', '#fffaf0'] },
      palm: { c: '#ffc8a0', ramp: ['#7a2a30', '#b8584a', '#e8906a', '#ffbc94', '#ffdcbc', '#fff4e4'] },
      mawashi: { c: '#2a3670', ramp: ['#0c0e24', '#151a3c', '#1f2a5a', '#2c3c7a', '#41579c', '#6a86c4'] },
      sagari: { c: '#3a4c8c', ramp: ['#0c0e24', '#1a2250', '#2a3670', '#3a4c8c', '#5068aa', '#7a92cc'] },
      hair: { c: '#1a1420', gloss: true, ramp: ['#060408', '#0e0a12', '#18121e', '#221a2c', '#30283e', '#7a7096'] },
      ...eyeMats('#1a1420', '#1f4a9a', '#4a9ae8'), blush: '#ff9a8a', mouthIn: '#4a1020', tongue: '#ff7a8a',
      bub: { c: '#bff4ff', gloss: true, ramp: ['#3a6a9a', '#5aa0c8', '#8ad4ec', '#bff4ff', '#e4fcff', '#ffffff'] },
      ...glowMats(RAMP.water), ...COMMON,
    },
    anim: { bob: 0.8, sway: 0.8, hop: 0.7, lean: 0.8, flap: 0.9 },
    pad: { breath: [72, 8, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      // ---- body: an upright carapace whose cream underside faces forward like a sumo belly
      { n: 'body', p: [0, 26, 0], s: [
        ['ell', [0, 29, -2], [23, 16.5, 14], 'shell'],
        ['ell', [0, 25, 5], [18, 14, 12.5], 'belly', { k: 2 }],
        // little teeth along the shell rim
        ...sym(1, (s) => ['cone', [s * 17.5, 38.5, -1.5], [s * 22, 43, -1.5], 2.9, 0.9, 'shell', { k: 1.6 }]),
        ...sym(1, (s) => ['cone', [s * 10.5, 42.5, -1.5], [s * 12.6, 47.5, -1.5], 2.7, 0.8, 'shell', { k: 1.6 }]),
        // mawashi: a thick navy belt under the belly, with a knot at the back
        ['ell', [0, 12.5, 1.5], [18, 9, 15.6], 'mawashi', { minus: ['box', [0, 31, 0], [30, 11.5, 30], 0, { k: 0.5 }] }],
        ['ell', [0, 14, -14.2], [5.2, 4.6, 3.2], 'mawashi', { k: 1 }],
        // stern Heike "game face" on the back of the shell
        ...sym(6.5, (x) => ['ell', [x, 37.5, -13], [5.8, 1.9, 4], 'shellD', paintOn(['body'], { rot: [0, 0, x > 0 ? 22 : -22] })]),
        ['tor', [0, 22.5, -15.2], 5.4, 1.3, 'shellD', paintOn(['body'], { rot: [90, 0, 0], minus: ['box', [0, 18, -15.2], [8, 4.4, 6], 0] })],
      ] },
      // sagari: stiff cords hanging from the belt front
      { n: 'sagari', parent: 'body', p: [0, 9, 14], s: [-6.8, -3.4, 0, 3.4, 6.8].map((x) => {
        const zf = 1.5 + 15.6 * Math.sqrt(Math.max(0, 1 - (x / 18) ** 2 - 0.25));
        return ['cone', [x, 8.6, zf + 0.2], [x * 1.08, 3.4, zf + 1.3], 1.1, 1, 'sagari'];
      }) },
      // splayed crab legs: the sumo squat
      ...both({ n: 'legFL', parent: 'body', p: [14, 12, 5], s: [['chain', [[14, 12, 5, 4.8], [23, 18.5, 8, 4.2], [27.5, 9, 9.5, 3.4], [28.5, 1.4, 10, 1.6]], 'shell', { k: 1.2, grad: tipped([27.5, 9, 9.5], [28.5, 1.4, 10]) }]] }),
      ...both({ n: 'legBL', parent: 'body', p: [13, 12, -6], s: [['chain', [[13, 12, -6, 4.6], [21.5, 18, -10.5, 4], [25, 8.5, -13.5, 3.2], [25.5, 1.4, -15, 1.5]], 'shell', { k: 1.2, grad: tipped([25, 8.5, -13.5], [25.5, 1.4, -15]) }]] }),
      // claws: flat open palms for tsuppari slaps
      ...both({ n: 'wingL', parent: 'body', p: [18, 31, 3], s: [
        ['chain', [[17, 31, 3, 4], [24, 25.5, 7, 3.6], [27, 29, 10, 3.8]], 'shell', { k: 1.5 }],
        ['ell', [27.5, 35, 11], [8, 8.4, 4.6], 'shell', { k: 2.4 }],
        ['cone', [31.5, 41, 11], [33, 49.5, 11.5], 3.8, 1.4, 'shell', { k: 1.6, grad: tipped([31.5, 41, 11], [33, 49.5, 11.5], 0.62) }],
        ['cone', [23.5, 41, 11], [22.6, 47.5, 11.5], 3.3, 1.3, 'shell', { k: 1.6, grad: tipped([23.5, 41, 11], [22.6, 47.5, 11.5], 0.62) }],
        ['ell', [27.5, 34.5, 15.6], [5.6, 6, 2.6], 'palm', paintOn(['wingL'])],
      ] }),
      // ---- head: stalk eyes on top of the shell, a face bump with the mouth
      { n: 'head', parent: 'body', p: [0, 44, 3], noShadow: true, s: [
        ...sym(E, (x) => ['cone', [x * 0.8, 45, 4], [x, 49, 5.5], 2.8, 2.6, 'shell', { k: 1.5 }]),
        ...sym(E, (x) => ['sph', [x, EY, EC], ER, 'shell', { k: 1 }]),
      ] },
      { n: 'face', parent: 'head', p: [0, 41, 4], noShadow: true, s: [
        ['ell', [0, 41, 4], [13.5, 8.5, 9.5], 'shell', { k: 4 }],
        ...sym(9, (x) => ['ell', [x, 40.4, 11.2], [3, 1.8, 3], 'blush', paintOn(['face'])]),
      ] },
      { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce', 'teary'], s: [...eye(E), ...eye(-E)] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: sym(E, (x) => ['ell', [x, EY + 4.2, EZ], [5.6, 2.8, 4], 'shell', paintOn(['head'], { rot: [0, 0, x > 0 ? 18 : -18] })]) },
      ...exprSet('head', ['head'], E, EY, EZ, L, { len: 3.6 }),
      { n: 'smile', parent: 'face', p: [0, 39.5, FZ], show: 'mouth:closed', s: [
        ['ell', [0, 38.9, FZ], [2.6, 0.85, 3], 'mouthIn', paintOn(['face'])],
        ...sym(3.1, (x) => ['ell', [x, 39.7, FZ - 0.3], [1.7, 0.85, 3], 'mouthIn', paintOn(['face'], { rot: [0, 0, x > 0 ? 32 : -32] })]),
      ] },
      { n: 'mouth', parent: 'face', p: [0, 39, FZ], show: 'mouth:open', s: [
        ['ell', [0, 39, FZ], [3.4, 2.8, 3], 'mouthIn', paintOn(['face'])],
        ['ell', [0, 37.2, FZ], [2.2, 1.2, 3], 'tongue', paintOn(['face'])],
      ] },
      // ginkgo-leaf topknot (waxed stiff, so it moves with the head): a tied stem with the fan of hair spread on top
      { n: 'topknot', parent: 'head', p: [0, 52, -4], s: [
        ['ell', [0, 52.5, -4.4], [2.6, 4, 3.4], 'hair', { k: 1 }],
        ['ell', [0, 58, -2.8], [6, 3.6, 1.7], 'hair', { rot: [-38, 0, 0], k: 1.2, minus: ['sph', [0, 62, -1.3], 1.5, { k: 0.5 }] }],
      ] },
      // ---- effects: a pressurised water jet with bubbles
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const a = [0, 38.6, FZ + 0.5], b = [[0, 40, 74], [7, 47, 58], [-7, 32, 60]][i], r = [[2, 8], [1.4, 4.5], [1.4, 4.5]][i];
        return { n, parent: 'face', p: a, show: 'fire', s: [
          ['cone', a, b, r[0], r[1], 'fY', { wob: 1.4, grad: { a, b, stops: [[0, 'fCore'], [0.3, 'fY'], [0.75, 'fO']] } }],
          ...(i === 0 ? [['sph', [3, 44, 56], 3.2, 'bub'], ['sph', [-4, 35, 64], 2.6, 'bub'], ['sph', [2, 46, 72], 2, 'bub'], ['sph', [-2, 31, 46], 1.8, 'bub']] : []),
        ] };
      }),
      ...hearts(66), ...zzz(18, 60),
    ],
    bond: { grow: { topknot: 1.3, wingL: 1.1, wingR: 1.1 } },
  };
}

// ---------------------------------------------------------------- Zapanda (Volto)
// Mika's partner: a roly-poly red panda with a giant panda's build and markings (black
// ears, legs and shoulder band). Its red panda tear tracks are lightning bolts that zig-zag
// down its white cheeks, and its huge fluffy ringed tail is a charge meter: the rings light
// up yellow from the base as it charges (napping in the sun on Den-Den Town rooftops).
{
  const E = 5.9, EY = 34.4, HC = [0, 33.5, 10.5], HR = [14, 12.5, 12.5];
  // depth of the face surface at (x, y): the head, the cheeks and the muzzle
  const ellZ = (c, r, x, y) => { const q = 1 - ((x - c[0]) / r[0]) ** 2 - ((y - c[1]) / r[1]) ** 2; return q > 0 ? c[2] + r[2] * Math.sqrt(q) : -99; };
  const MUZ = [[0, 28.2, 20.6], [6.2, 4.6, 4.2]], CHK = [[9.4, 28, 15.6], [6, 5.2, 5.4]];
  const zOn = (x, y) => Math.max(ellZ(HC, HR, x, y), ellZ(MUZ[0], MUZ[1], x, y), ellZ(CHK[0], CHK[1], Math.abs(x), y));
  const EZ = zOn(E, EY);
  const eye = (x) => animeEye(['head'], x, EY, EZ, [4.2, 5.2], {});
  const L = lineOn(['head'], EZ + 0.3);
  // a flat painted stroke from a to b (2D), thickness w, lying on the face
  const stroke = (a, b, w, mat) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], len = Math.hypot(b[0] - a[0], b[1] - a[1]); return ['box', [m[0], m[1], zOn(m[0], m[1])], [len / 2 + w * 0.2, w / 2, 4], 0.45, mat, paintOn(['head'], { rot: [0, 0, Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI] })]; };
  // the lightning tear track: from under the eye, a zig-zag down the white cheek
  const bolt = (s) => {
    const P = [[6.6, 28], [9, 24.8], [6.4, 24], [8.6, 18.4]].map(([x, y]) => [s * x, y]);
    return [stroke(P[0], P[1], 3.2, 'patch'), stroke(P[1], P[2], 2.6, 'patch'),
      ['cone', [P[2][0], P[2][1], zOn(P[2][0], P[2][1]) - 0.3], [P[3][0], P[3][1], zOn(P[3][0], P[3][1]) - 0.3], 1.9, 0.25, 'patch', paintOn(['head'])]];
  };
  const ringMat = ['coat', 'volt', 'coat', 'volt', 'coat', 'ring', 'coat', 'ring'];
  const TAIL = [[0, 19, -15, 4.6], [0, 21.5, -20.5, 6], [0, 25.5, -25, 7], [0.8, 31, -27.5, 7.4], [2, 37, -28, 7.4], [3.4, 43, -26.5, 7], [4.4, 48, -23, 6.2], [4.8, 50.6, -17.8, 4.8]];
  const tailBall = (i) => ['sph', TAIL[i].slice(0, 3), TAIL[i][3], ringMat[i], { k: 3 }];
  const bodyGrad = { a: [0, 22, 0], b: [0, 8, 0], stops: [[0, 'coat'], [0.6, 'dark']] };
  SPRITES.zapanda = {
    id: 'zapanda', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#2a1014',
    pal: {
      coat: { c: '#c2511e', ramp: ['#4a1a2a', '#7a2a2a', '#a8401e', '#cc5a1e', '#ec8236', '#ffb478'] },
      ring: { c: '#7a3418', ramp: ['#2a0e18', '#4a1a1e', '#62261a', '#7e361a', '#a04e26', '#c87a4a'] },
      dark: { c: '#2a1a1e', ramp: ['#0c0608', '#160c10', '#22141a', '#33222a', '#4a3438', '#6a5458'] },
      white: { c: '#fff4e6', ramp: ['#6a4a52', '#a08a8e', '#d8c0b8', '#f6e8da', '#fff8ee', '#ffffff'] },
      patch: { c: '#3a1820', ramp: ['#120408', '#1e0a10', '#2c1218', '#3c1a22', '#56262e', '#7a3a40'] },
      volt: { c: '#ffe23a', emit: true, heat: 0.72, fire: RAMP.volt },
      nose: { c: '#1e1014', gloss: true }, earIn: '#3a1a24',
      ...eyeMats('#1a0c0e', '#3a1814', '#9a4a24'), mouthIn: '#6a1a24', tongue: '#ff7a8a',
      ...glowMats(RAMP.volt), ...COMMON,
    },
    anim: { bob: 1.3, sway: 1.2, hop: 1.4, lag: 1.3 },
    pad: { breath: [72, 8, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      { n: 'body', p: [0, 16, 0], s: [
        ['ell', [0, 16.5, -3], [12.5, 10.5, 13.5], 'coat', { grad: bodyGrad }],
        ['ell', [0, 18, 6], [10.5, 10, 8], 'coat', { k: 4, grad: bodyGrad }],
      ] },
      ...both({ n: 'legFL', parent: 'body', p: [6.4, 11, 7], s: [['cone', [6.4, 11, 7], [6.8, 3, 8.2], 3.6, 3.1, 'dark'], ['ell', [6.8, 2.2, 9.4], [3.4, 2.2, 3.9], 'dark', { k: 1.5 }]] }),
      ...both({ n: 'legBL', parent: 'body', p: [7, 12, -9], s: [['ell', [7.2, 12, -9], [4.6, 6, 5.6], 'dark', { k: 2.5 }], ['cone', [7.4, 9, -8.5], [7.6, 3, -8], 3.3, 3, 'dark'], ['ell', [7.6, 2.2, -6.8], [3.4, 2.2, 4.2], 'dark', { k: 1.5 }]] }),
      // huge fluffy ringed tail: the battery meter
      { n: 'tail', parent: 'body', p: [0, 19, -14], s: [0, 1, 2, 3].map(tailBall) },
      { n: 'tail2', parent: 'tail', p: [1, 34, -28], s: [4, 5, 6, 7].map(tailBall) },
      // ---- head
      { n: 'head', parent: 'body', p: [0, 26, 10], noShadow: true, s: [
        ['ell', HC, HR, 'coat'],
        ['ell', MUZ[0], MUZ[1], 'white', { k: 3 }],
        ...sym(1, (s) => ['ell', [s * CHK[0][0], CHK[0][1], CHK[0][2]], CHK[1], 'white', { k: 4 }]),
        // jagged cheek ruffs, like sparks
        ...sym(1, (s) => ['cone', [s * 12, 29, 15], [s * 18.2, 27.4, 13.6], 3.2, 0.5, 'white', { k: 2 }]),
        ...sym(1, (s) => ['cone', [s * 11.5, 25.4, 15], [s * 16.4, 22, 14], 2.8, 0.5, 'white', { k: 2 }]),
        ...bolt(1), ...bolt(-1),
        ['ell', [0, 31, 24.3], [2.5, 1.7, 1.6], 'nose', { k: 0.6 }],
      ] },
      { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce', 'teary'], s: [...eye(E), ...eye(-E)] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: sym(E, (x) => ['ell', [x, EY + 3.7, EZ], [4.6, 2.5, 4], 'coat', paintOn(['head'], { rot: [0, 0, x > 0 ? 16 : -16] })]) },
      ...exprSet('head', ['head'], E, EY, EZ, L, { len: 3.2 }),
      { n: 'jaw', parent: 'head', p: [0, 26.6, 21], s: [['ell', [0, 25.6, 21.4], [3.6, 2, 2.8], 'white', { k: 1.5 }]] },
      { n: 'smile', parent: 'head', p: [0, 28, 24], show: 'mouth:closed', s: [
        ['box', [0, 28.9, zOn(0, 28.9)], [0.55, 1.1, 3], 0.3, 'patch', paintOn(['head'])],
        ...sym(1.7, (x) => ['ell', [x, 27.6, zOn(x, 27.6)], [1.9, 0.65, 3], 'patch', paintOn(['head'], { rot: [0, 0, x > 0 ? 26 : -26] })]),
      ] },
      { n: 'mouth', parent: 'head', p: [0, 27.4, 24], show: 'mouth:open', s: [
        ['ell', [0, 27.2, zOn(0, 27.2)], [2.8, 2.3, 3], 'mouthIn', paintOn(['head', 'jaw'])],
        ['ell', [0, 25.7, zOn(0, 25.7)], [1.8, 1, 3], 'tongue', paintOn(['head', 'jaw'])],
      ] },
      // big round ears: black with a white rim
      ...both({ n: 'earL', parent: 'head', p: [10, 42, 8], s: [
        ['ell', [11, 45.6, 8], [6, 6.2, 2.5], 'white', { rot: [0, -15, -25], grad: { a: [0, 0, 8.6], b: [0, 0, 7.4], stops: [[0, 'white'], [0.5, 'dark']] } }],
        ['ell', [11.1, 45.4, 10.3], [4.2, 4.4, 2.2], 'earIn', paintOn(['earL'], { rot: [0, -15, -25] })],
      ] }),
      // ---- effects: crackling lightning out of the mouth
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const pts = [
          [[0, 27.5, 25, 1.6], [3, 30.5, 34, 3.2], [-3, 25.5, 43, 3.6], [3.5, 29.5, 53, 4], [-2, 26.5, 63, 3.6], [1, 28.5, 73, 2]],
          [[0, 27.5, 25, 1.2], [5, 33.5, 33, 2], [3, 38.5, 41, 2.2], [8, 42.5, 49, 1.4]],
          [[0, 27.5, 25, 1.2], [-5, 23.5, 33, 2], [-3, 19.5, 42, 2.2], [-8, 16.5, 49, 1.4]],
        ][i];
        const a = pts[0].slice(0, 3), b = pts[pts.length - 1].slice(0, 3);
        return { n, parent: 'head', p: a, show: 'fire', s: [
          ['chain', pts, 'fY', { wob: 1.1, grad: { a, b, stops: [[0, 'fCore'], [0.45, 'fY'], [0.8, 'fO']] } }],
          ...(i === 0 ? [['sph', [5, 34.5, 47], 1.6, 'fCore'], ['sph', [-5, 22.5, 57], 1.4, 'fCore'], ['sph', [6, 31.5, 67], 1.3, 'fY']] : []),
        ] };
      }),
      ...hearts(60), ...zzz(16, 56),
    ],
    bond: { grow: { tail: 1.12, tail2: 1.15 } },
  };
}

// ---------------------------------------------------------------- Beatlet (Bio)
// Taro's beetle: a chubby kabutomushi youngster that hatched under a Shinsekai record
// shop. The glossy shell over its head is a 1963 mop-top: a bowl cut whose fringe falls
// to its eyes, bangs dipping over them. A little forked rhino-beetle horn rises from the
// crown with a leaf sprout growing from the fork, a collarless "jacket" band with a gold
// braid sits at its neck, and its six stubby feet have pointed heels.
{
  const E = 5.3, EY = 20.4, HC = [0, 22, 9], HR = [12.4, 11.4, 11];
  const ellZ = (c, r, x, y) => c[2] + r[2] * Math.sqrt(Math.max(0, 1 - ((x - c[0]) / r[0]) ** 2 - ((y - c[1]) / r[1]) ** 2));
  const fz = (x, y) => ellZ(HC, HR, x, y);
  const EZ = fz(E, EY);
  const eye = (x) => animeEye(['head'], x, EY, EZ, [3.8, 5], { shine: 1.2 });
  const L = lineOn(['head'], EZ + 0.3);
  const CAP = [[0, 24.6, 7.8], [13.1, 11.4, 12.4]], WIN = [[0, 16.4, 18], [12, 10, 9]];
  const leg = (n, root, knee, foot) => ({ n, parent: 'body', p: root, s: [
    ['chain', [[...root, 2.4], [...knee, 2.2], [...foot, 1.9]], 'leg', { k: 0.8 }],
    ['cone', [foot[0], 1.5, foot[2]], [foot[0] - 0.1, 0.9, foot[2] - 2.8], 1.5, 0.45, 'leg'],
    ['ell', [foot[0], 1.4, foot[2] + 0.8], [2, 1.35, 2.4], 'leg', { k: 0.6 }],
  ] });
  SPRITES.beatlet = {
    id: 'beatlet', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#1e0f14',
    pal: {
      shell: { c: '#5a2a24', gloss: true, ramp: ['#100610', '#200e1a', '#361820', '#542824', '#723e2c', '#9a5c3e'] },
      horn: { c: '#341c22', gloss: true, ramp: ['#08040a', '#140a12', '#22121a', '#341c22', '#4e2e2e', '#a8786a'] },
      face: { c: '#f2dfbf', ramp: ['#5a3a3a', '#8a6a6a', '#c0a08a', '#f2dfbf', '#fff0da', '#fffaf0'] },
      leg: { c: '#2a1218', ramp: ['#0c040a', '#160a10', '#22101a', '#341a22', '#4c2a2e', '#74463e'] },
      collar: { c: '#3a2a2a', ramp: ['#120a0e', '#1e1418', '#2c2022', '#3e2e2e', '#5a4440', '#7a6058'] },
      gold: { c: '#ffd23f', gloss: true, ramp: ['#5a2a10', '#9a5a1a', '#d0962a', '#ffd23f', '#ffec8a', '#fffbe0'] },
      seam: flat('#1c0a16'),
      shellHi: { c: '#9a5a3a', ramp: ['#2a1218', '#4a2420', '#6a3826', '#8e5232', '#b47046', '#d89a6a'] },
      sprout: { c: '#5fd35a', ramp: ['#103a20', '#1f6a2c', '#3aa040', '#5fd35a', '#9ae878', '#e8ffd0'] },
      ...eyeMats('#1e0f14', '#6a3418', '#d08a3a'), blush: flat('#ffaa9a'), mouthIn: '#5a1a24', tongue: '#ff7a8a',
      ...glowMats(RAMP.leaf), ...COMMON,
    },
    anim: { bob: 1.2, sway: 1.2, hop: 1.2, lag: 1.4 },
    pad: { breath: [72, 8, 0, 0], dash: [0, 0, 24, 0] },
    parts: [...scaleModel([
      { n: 'body', p: [0, 14, -6], s: [
        ['ell', [0, 14, -9], [13, 10.5, 15], 'shell', { grad: { a: [0, 9, 0], b: [0, 5, 0], stops: [[0, 'shell'], [0.5, 'leg']] } }],
        // glossy shine streaks on the wing cases, split by the seam
        ...sym(5.6, (x) => ['ell', [x, 21.4, -9], [2.2, 6, 11], 'shellHi', paintOn(['body'], { rot: [0, 0, x > 0 ? -14 : 14] })]),
        ['box', [0, 21, -10], [1.05, 10, 16], 0.4, 'seam', paintOn(['body'])],
        // the collarless jacket band with its gold braid
        ['tor', [0, 16.6, 1.6], 9.8, 2.5, 'collar', { rot: [72, 0, 0], k: 1 }],
        ['tor', [0, 17, 3], 10, 1.05, 'gold', { rot: [72, 0, 0] }],
      ] },
      leg('legFL', [6.6, 7.5, 2], [10.6, 6, 4], [11.2, 1.9, 5.4]), leg('legFR', [-6.6, 7.5, 2], [-10.6, 6, 4], [-11.2, 1.9, 5.4]),
      leg('legML', [7.6, 7.5, -6], [12, 6, -6], [12.8, 1.9, -5.6]), leg('legMR', [-7.6, 7.5, -6], [-12, 6, -6], [-12.8, 1.9, -5.6]),
      leg('legBL', [6.8, 7.5, -14], [10.6, 6, -16.2], [11.2, 1.9, -17.6]), leg('legBR', [-6.8, 7.5, -14], [-10.6, 6, -16.2], [-11.2, 1.9, -17.6]),
      // ---- head: a cream face under the mop-top shell
      { n: 'head', parent: 'body', p: [0, 18, 6], noShadow: true, s: [
        ['ell', HC, HR, 'face'],
        ...sym(8.6, (x) => ['ell', [x, 16.6, fz(8.6, 16.6)], [2.2, 1.3, 3], 'blush', paintOn(['head'])]),
      ] },
      { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce', 'teary'], s: [...eye(E), ...eye(-E)] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: sym(E, (x) => ['ell', [x, EY + 3, EZ], [4.6, 2.6, 4], 'face', paintOn(['head'], { rot: [0, 0, x > 0 ? 18 : -18] })]) },
      ...exprSet('head', ['head'], E, EY, EZ, L, { dy: 1.6, hy: 1.4, len: 3 }),
      { n: 'jaw', parent: 'head', p: [0, 13.8, 16], s: [['ell', [0, 13, 15.6], [3, 1.8, 2.2], 'face', { k: 1.4 }]] },
      { n: 'smile', parent: 'head', p: [0, 15, 18], show: 'mouth:closed', s: [
        ['ell', [0, 14.6, fz(0, 14.6)], [2, 0.75, 3], 'mouthIn', paintOn(['head'])],
        ...sym(2.4, (x) => ['ell', [x, 15.3, fz(x, 15.3)], [1.3, 0.7, 3], 'mouthIn', paintOn(['head'], { rot: [0, 0, x > 0 ? 36 : -36] })]),
      ] },
      { n: 'mouth', parent: 'head', p: [0, 14.6, 18], show: 'mouth:open', s: [
        ['ell', [0, 14.6, fz(0, 14.6)], [2.4, 2, 3], 'mouthIn', paintOn(['head', 'jaw'])],
        ['ell', [0, 13.3, fz(0, 13.3)], [1.6, 0.85, 3], 'tongue', paintOn(['head', 'jaw'])],
      ] },
      // the mop-top: a glossy bowl cut with a fringe of bangs
      { n: 'hairMop', parent: 'head', p: [0, 30, 0], s: [
        ['ell', CAP[0], CAP[1], 'shell', { minus: ['ell', WIN[0], WIN[1], { k: 0.8 }] }],
        // the anime hair shine: a glossy ring around the crown
        ['box', [0, 31.4, 7], [20, 1.25, 20], 0.3, 'shellHi', paintOn(['hairMop'], { rot: [-16, 0, 0] })],
        ...[[0, 23.4], [-4.4, 24.6], [4.4, 24.6], [-9.6, 21], [9.6, 21]].map(([x, y]) => { const z = ellZ(CAP[0], CAP[1], x, 26.6); return ['cone', [x, 26.6, z - 1.1], [x * 1.04, y, z - 0.5], 2.4, 1.5, 'shell', { k: 1.2 }]; }),
      ] },
      // the horn: rises from the crown and hooks forward, forked at the tip
      { n: 'horn', parent: 'head', p: [0, 36, 10], s: [
        ['chain', [[0, 34, 9.6, 3.3], [0, 38.8, 11.2, 2.7], [0, 41.8, 13.8, 2.3]], 'horn', { k: 1.4 }],
        ...sym(1, (s) => ['chain', [[0, 41.6, 13.6, 2.2], [s * 2.7, 43.8, 15, 1.7], [s * 3.6, 46.4, 15.2, 1.15]], 'horn', { k: 0.6 }]),
      ] },
      // a seedling sprouting from the mop-top, like a leaf hair clip
      { n: 'tuftSprout', parent: 'hairMop', p: [7.4, 33, 4], s: [
        ['cone', [7.2, 32.6, 4], [9.6, 37, 3.6], 1.05, 0.9, 'sprout', { k: 0.6 }],
        ['ell', [7.8, 38.6, 3.6], [3, 1.3, 1.8], 'sprout', { rot: [0, 0, -20], k: 0.6 }],
        ['ell', [12.4, 38.4, 3.6], [3, 1.3, 1.8], 'sprout', { rot: [0, 0, 34], k: 0.6 }],
      ] },
      // ---- effects: a spray of glowing leaves and seeds with rings of sound
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const a = [0, 14.6, 18.6], b = [[0, 18, 70], [6, 26, 56], [-6, 10, 58]][i];
        const lerp = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        return { n, parent: 'head', p: a, show: 'fire', s: [
          ['cone', a, b, 1.2, 4.5 - i, 'fY', { wob: 1.2, grad: { a, b, stops: [[0, 'fCore'], [0.4, 'fY'], [0.8, 'fO']] } }],
          ...[0.45, 0.75, 1].map((t, j) => ['ell', lerp(t), [3 - j * 0.4, 1.3, 1.8], 'sprout', { rot: [0, 30 * j + i * 40, 40 + j * 50], k: 0 }]),
          ...(i === 0 ? [['tor', lerp(0.55), 6.5, 0.9, 'fY', { rot: [90, 0, 0] }], ['tor', lerp(0.85), 8.5, 0.9, 'fO', { rot: [90, 0, 0] }]] : []),
        ] };
      }),
    ], 1.2), ...hearts(62), ...zzz(16, 58)],
    bond: { grow: { tuftSprout: 1.6, horn: 1.2 } },
  };
}

// ---------------------------------------------------------------- Studrat (Ferro)
// Team Metallica's favourite: a scrappy street rat with a mohawk of chrome spikes it
// sharpens on train rails, a blood-red studded leather collar, a denim battle-vest patch
// on its flank, a safety pin through one torn ear and a tail that ends in chain links.
// Sly red eyes under heavy lids, a smirk and one chipped steel tooth.
{
  const HC = [0, 24, 12.4], HR = [9, 8.4, 8.6];
  const ellZ = (c, r, x, y) => { const q = 1 - ((x - c[0]) / r[0]) ** 2 - ((y - c[1]) / r[1]) ** 2; return q > 0 ? c[2] + r[2] * Math.sqrt(q) : -99; };
  const E = 4.6, EY = 25.2, EZ = ellZ(HC, HR, E, EY);
  const eye = (x) => animeEye(['head'], x, EY, EZ, [3.1, 3.8], { look: 0.5 });
  const L = lineOn(['head'], EZ + 0.3);
  // collar ring: axis tilted toward the head
  const CC = [0, 19, 7.2], CA = 62 * Math.PI / 180, CR = 6.9;
  const ringPt = (th, r) => { const t = th * Math.PI / 180; return [CC[0] + r * Math.cos(t), CC[1] - r * Math.sin(t) * Math.sin(CA), CC[2] + r * Math.sin(t) * Math.cos(CA)]; };
  const spike = (a, b, r = 2.6) => ['cone', a, b, r, 0.35, 'chrome', { k: 0.6 }];
  const link = (c, rot) => ['tor', c, 2.4, 1, 'chrome', { rot }];
  const furGrad = { a: [0, 12, 0], b: [0, 7, 0], stops: [[0, 'fur'], [0.6, 'belly']] };
  const parts = [
    { n: 'body', p: [0, 14, -2], s: [
      ['ell', [0, 15, 3.5], [7.6, 7.8, 7.4], 'fur', { grad: furGrad }],
      ['ell', [0, 15.5, -8], [8.6, 8.6, 9.2], 'fur', { k: 4, grad: furGrad }],
      // denim battle-vest patch on the left flank (stitched edge) with two studs
      ['box', [8.6, 16, -8], [3, 3.9, 3.9], 0.9, 'denimL', paintOn(['body'])],
      ['box', [8.6, 16, -8], [3, 3.1, 3.1], 0.7, 'denim', paintOn(['body'])],
      ['sph', [7.7, 19.2, -10.6], 1.2, 'chrome'], ['sph', [8.1, 12.8, -5.4], 1.2, 'chrome'],
      // blood-red studded leather collar
      ['tor', CC, CR, 1.9, 'leather', { rot: [62, 0, 0], k: 0.5 }],
      ...[-170, -130, -50, -10, 30, 70, 110, 150].map((th) => ['cone', ringPt(th, CR + 1.3), ringPt(th, CR + 3.3), 1.35, 0.35, 'chrome']),
    ] },
    // the spiked spine: the mohawk carries on down the back
    { n: 'crestSpikes', parent: 'body', p: [0, 22, -2], s: [
      spike([0, 22.4, 1.4], [0, 30, -2.6], 2.6), spike([0, 23.6, -4.4], [0, 30.8, -9.2], 2.6), spike([0, 23.4, -10.4], [0, 29, -15.4], 2.2),
    ] },
    ...both({ n: 'legFL', parent: 'body', p: [5, 11, 6.5], s: [['cone', [5, 11.5, 6.5], [5.3, 2.4, 8], 2.3, 1.8, 'fur'], ['ell', [5.3, 1.4, 9], [2.1, 1.35, 2.6], 'pink', { k: 1 }]] }),
    ...both({ n: 'legBL', parent: 'body', p: [6.2, 13, -8], s: [
      ['ell', [6.4, 12.5, -8], [3.4, 5.4, 5.2], 'fur', { k: 2 }],
      ['cone', [6.6, 9, -9.4], [6.8, 2.4, -8.2], 2.2, 1.7, 'fur', { k: 1 }],
      ['ell', [6.8, 1.4, -6.2], [2.2, 1.35, 4.4], 'pink', { k: 1 }],
    ] }),
    // long pink tail ending in three chain links
    { n: 'tail', parent: 'body', p: [0, 13, -16], s: [['chain', [[0, 13.5, -16, 2.3], [0, 10, -22.5, 1.9], [1.5, 6.4, -28.5, 1.6], [3.8, 5, -33.6, 1.35]], 'pink', { k: 1 }]] },
    { n: 'tail2', parent: 'tail', p: [3.8, 5, -33.6], s: [link([4.9, 5.1, -36], [0, -25, 90]), link([6.3, 5.2, -39.1], [0, 0, 0]), link([7.7, 5.3, -42.2], [0, -25, 90])] },
    // ---- head: pointed snout, big ears, sly eyes
    { n: 'head', parent: 'body', p: [0, 21, 10], noShadow: true, s: [
      ['ell', HC, HR, 'fur'],
      ['cone', [0, 22, 16], [0, 20.4, 24], 5.2, 2.5, 'fur', { k: 3 }],
      ['ell', [0, 17.8, 19.2], [3.4, 2, 3.8], 'belly', { k: 1.4 }],
      ['sph', [0, 21, 25.6], 1.9, 'nose', { k: 0.5 }],
      // the chipped steel incisor
      ['box', [1, 17, 22.6], [0.95, 1.35, 0.6], 0.35, 'chrome'],
    ] },
    { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce', 'teary'], s: [...eye(E), ...eye(-E),
      // heavy, smug upper lids
      ...sym(E, (x) => ['ell', [x, EY + 3.3, EZ], [4, 2, 4], 'fur', paintOn(['head'], { rot: [0, 0, x > 0 ? -8 : 8] })])] },
    { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: sym(E, (x) => ['ell', [x, EY + 2.6, EZ], [4.2, 2.3, 4], 'fur', paintOn(['head'], { rot: [0, 0, x > 0 ? 20 : -20] })]) },
    ...exprSet('head', ['head'], E, EY, EZ, L, { dy: 0.6, len: 2.8 }),
    { n: 'smile', parent: 'head', p: [0, 17.8, 22], show: 'mouth:closed', s: [
      ['ell', [-0.8, 18.6, 22.2], [2, 0.6, 3], 'mouthIn', paintOn(['head'], { rot: [0, 0, 6] })],
      ['ell', [2.2, 19.2, 21.8], [1.4, 0.6, 3], 'mouthIn', paintOn(['head'], { rot: [0, 0, 40] })],
    ] },
    { n: 'mouth', parent: 'head', p: [0, 18, 22], show: 'mouth:open', s: [
      ['ell', [0, 18.2, 22.4], [2.3, 1.8, 3], 'mouthIn', paintOn(['head'])],
      ['ell', [0, 17, 22.4], [1.4, 0.8, 3], 'tongue', paintOn(['head'])],
    ] },
    // mohawk: two chrome spikes on the head lead the row down the back
    { n: 'hairMohawk', parent: 'head', p: [0, 31, 10], s: [spike([0, 31.4, 15], [0, 37.6, 14], 2.4), spike([0, 31.8, 9.4], [0, 39.4, 6.6], 2.9)] },
    // ears: the left is whole, the right is torn and has a safety pin through it
    { n: 'earL', parent: 'head', p: [7, 29, 10], s: [
      ['ell', [10.2, 32.4, 9.4], [5.8, 6.2, 1.6], 'pink', { rot: [0, -22, -32], grad: { a: [0, 0, 10.4], b: [0, 0, 8.4], stops: [[0, 'pink'], [0.5, 'fur']] } }],
    ] },
    { n: 'earR', parent: 'head', p: [-7, 29, 10], s: [
      ['ell', [-10.2, 32.4, 9.4], [5.8, 6.2, 1.6], 'pink', { rot: [0, 22, 32], grad: { a: [0, 0, 10.4], b: [0, 0, 8.4], stops: [[0, 'pink'], [0.5, 'fur']] }, minus: ['sph', [-15.4, 35.4, 9.4], 2.4, { k: 0.4 }] }],
      ['cone', [-12.6, 27.4, 10.8], [-15.6, 31, 10.2], 0.9, 0.9, 'chrome'], ['sph', [-12.4, 27.2, 10.8], 1.4, 'chrome'],
    ] },
    // ---- effects: a burst of steel shards and grinding sparks
    ...['fire', 'fire2', 'fire3'].map((n, i) => {
      const a = [0, 18.4, 23.4];
      const sh = [[[0, 20, 36], [0, 21, 48]], [[4, 24, 46], [6, 27, 58]], [[-4, 16, 48], [-6, 14, 62]]][i];
      const mid = sh[0].map((v, k) => (v + sh[1][k]) / 2);
      return { n, parent: 'head', p: a, show: 'fire', s: [
        ['cone', a, [a[0] + (mid[0] - a[0]) * 0.6, a[1] + (mid[1] - a[1]) * 0.6, a[2] + (mid[2] - a[2]) * 0.6], 1, 2.6, 'fO', { wob: 1, grad: { a, b: mid, stops: [[0, 'fCore'], [0.5, 'fY'], [0.9, 'fO']] } }],
        ['cone', sh[0], mid, 0.4, 2.6, 'fY', { k: 0 }], ['cone', mid, sh[1], 2.6, 0.3, 'fY', { k: 0 }],
        ...(i === 0 ? [['cone', [3, 24, 54], [5, 26, 60], 1.8, 0.3, 'fO'], ['cone', [-3, 15, 58], [-4, 13, 66], 1.6, 0.3, 'fO'], ['sph', [5, 17, 42], 1.2, 'fCore'], ['sph', [-5, 23, 52], 1, 'fCore']] : []),
      ] };
    }),
  ];
  SPRITES.studrat = {
    id: 'studrat', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#1a1420',
    pal: {
      fur: { c: '#7a6a78', ramp: ['#24182a', '#3a2a40', '#5a4a5a', '#7a6a78', '#a090a2', '#c8bcca'] },
      belly: { c: '#a898a8', ramp: ['#3a2a40', '#5a4a5a', '#7a6a78', '#a898a8', '#c4b8c6', '#e4dce6'] },
      pink: { c: '#e0909a', ramp: ['#4a1a2e', '#7a3448', '#a05a6a', '#e0909a', '#f4b0b4', '#ffd8d4'] },
      chrome: { c: '#d0dae4', gloss: true, ramp: ['#1e2230', '#3a4252', '#5a6470', '#9aa6b4', '#d0dae4', '#ffffff'] },
      leather: { c: '#c0182a', gloss: true, ramp: ['#3a0614', '#5e0a1c', '#8a1022', '#b8182a', '#e0383c', '#ff8a7a'] },
      denim: { c: '#3a5a8a', ramp: ['#141e36', '#1e2e52', '#2c4470', '#3a5a8a', '#5276a6', '#7e9cc6'] },
      denimL: { c: '#8aa4cc', ramp: ['#2c4470', '#3a5a8a', '#5a7aaa', '#8aa4cc', '#a8bedc', '#d0dcee'] },
      ...eyeMats('#1a1420', '#e8202e', '#ff7a5a'), mouthIn: '#3a1424', tongue: '#ff7a8a', nose: { c: '#d86a80', gloss: true },
      ...glowMats(RAMP.steel), ...COMMON,
    },
    anim: { bob: 0.9, sway: 1, hop: 1.2, lean: 1.2 },
    pad: { breath: [72, 8, 0, 0], dash: [0, 0, 24, 0] },
    parts: [...scaleModel(parts, 1.22), ...hearts(60), ...zzz(16, 56)],
    bond: { grow: { hairMohawk: 1.3, crestSpikes: 1.3 } },
  };
}
