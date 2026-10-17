// Trainer accessories a bonded Tokonmon can wear (see bond.hat in docs/MODELING.md).
//
//   hatDesign(type, opts?) → static voxel design, origin = centre of the hat's base, facing +z.
//   Sized for a ~0.3 m wide head (chibi human). Tokonmon set bond.hat.scale to fit.
//   HAT_TYPES lists every type; opts: { color, color2 }.
//   The player's equipped hat comes from the look's acc (cap / beanie / straw_hat / safari_hat / hard_hat /
//   headband / headset / sunglasses …), see hatForLook().

const base = (id, vs, pal, parts) => ({ id, vs, arch: 'static', mesh: 'smooth', pal, parts: [{ n: 'body', p: [0, 0, 0], s: parts }] });

const BUILD = {
  cap: (c, c2) => base('hat_cap', 0.014, { a: c, b: c2, k: '#1d1a24' }, [
    ['ell', [0, 0.02, -0.005], [0.16, 0.13, 0.16], 'a'],
    ['box', [0, -0.06, 0], [0.2, 0.08, 0.2], 'a', { sub: 1 }],
    ['ell', [0, 0.015, 0.16], [0.13, 0.026, 0.1], 'a'],
    ['sph', [0, 0.148, -0.005], 0.022, 'b'],
    ['box', [0, 0.06, 0.15], [0.05, 0.035, 0.012], '#fbfbf6', { paint: 1 }],
  ]),
  beanie: (c, c2) => base('hat_beanie', 0.014, { a: c, b: c2 }, [
    ['ell', [0, 0.03, 0], [0.165, 0.16, 0.165], 'a', { stripes: { axis: 'y', p: 0.05, w: 0.018, col: 'b', o: 0.01 } }],
    ['box', [0, -0.07, 0], [0.2, 0.08, 0.2], 'a', { sub: 1 }],
    ['tor', [0, 0.02, 0], 0.158, 0.026, 'b'],
    ['sph', [0, 0.2, 0], 0.045, 'b', { noise: 0.008 }],
  ]),
  straw_hat: (c, c2) => base('hat_straw', 0.014, { a: c, b: c2 }, [
    ['cyl', [0, 0, 0], [0, 0.03, 0], 0.3, 'a', { dither: { col: '#c99b4a', amt: 0.25 } }],
    ['ell', [0, 0.06, 0], [0.15, 0.1, 0.15], 'a', { dither: { col: '#c99b4a', amt: 0.25 } }],
    ['box', [0, -0.04, 0], [0.2, 0.05, 0.2], 'a', { sub: 1 }],
    ['cyl', [0, 0.012, 0], [0, 0.05, 0], 0.152, 'b'],
  ]),
  safari_hat: (c, c2) => base('hat_safari', 0.014, { a: c, b: c2 }, [
    ['cyl', [0, 0, 0], [0, 0.03, 0], 0.25, 'a'],
    ['ell', [0, 0.05, 0], [0.155, 0.12, 0.155], 'a'],
    ['box', [0, -0.05, 0], [0.2, 0.06, 0.2], 'a', { sub: 1 }],
    ['cyl', [0, 0.014, 0], [0, 0.045, 0], 0.158, 'b'],
  ]),
  hard_hat: (c, c2) => base('hat_hard', 0.014, { a: c, b: c2 }, [
    ['ell', [0, 0.03, 0], [0.17, 0.15, 0.17], 'a'],
    ['box', [0, -0.06, 0], [0.2, 0.07, 0.2], 'a', { sub: 1 }],
    ['ell', [0, 0.015, 0.03], [0.21, 0.026, 0.22], 'a'],
    ['box', [0, 0.12, 0], [0.025, 0.06, 0.15], 'b'],
  ]),
  headband: (c, c2) => base('hat_headband', 0.012, { a: c, b: c2 }, [
    ['tor', [0, 0.03, 0], 0.16, 0.024, 'a'],
    ['box', [0, 0.03, 0.17], [0.03, 0.024, 0.01], 'b'],
  ]),
  headset: (c, c2) => base('hat_headset', 0.012, { a: c, b: c2 }, [
    ['tor', [0, 0.02, 0], 0.17, 0.016, 'a', { axis: 'z' }],
    ['box', [0, -0.08, 0], [0.25, 0.1, 0.1], 'a', { sub: 1 }],
    ['cyl', [0.165, -0.04, 0], [0.2, -0.04, 0], 0.06, 'b', { m: 1 }],
    ['cyl', [0.2, -0.04, 0], [0.215, -0.04, 0], 0.05, '#38f0ff', { m: 1, glow: 2 }],
  ]),
  sunglasses: (c, c2) => base('hat_shades', 0.01, { a: c, b: c2 }, [
    ['box', [0.065, 0, 0.16], [0.055, 0.028, 0.01], 'a', { m: 1, round: 0.012 }],
    ['box', [0, 0.012, 0.16], [0.02, 0.008, 0.008], 'b'],
    ['box', [0.13, 0.012, 0.08], [0.008, 0.008, 0.08], 'b', { m: 1 }],
  ]),
  crown: (c, c2) => base('hat_crown', 0.012, { a: c, b: c2 }, [
    ['cyl', [0, 0, 0], [0, 0.07, 0], 0.13, 'a'],
    ['cyl', [0, 0.01, 0], [0, 0.1, 0], 0.11, 'a', { sub: 1 }],
    ...[0, 1, 2, 3, 4, 5].map((n) => ['cap', [Math.sin(n * Math.PI / 3) * 0.12, 0.06, Math.cos(n * Math.PI / 3) * 0.12], [Math.sin(n * Math.PI / 3) * 0.12, 0.13, Math.cos(n * Math.PI / 3) * 0.12], 0.025, 0.008, 'a']),
    ['sph', [0, 0.04, 0.13], 0.022, 'b', { glow: 1 }],
  ]),
};
const DEFAULTS = {
  cap: ['#e8434f', '#fbfbf6'], beanie: ['#2f6fd6', '#fbfbf6'], straw_hat: ['#ecd28a', '#e8434f'], safari_hat: ['#c9b083', '#6b4a3a'],
  hard_hat: ['#ffd23a', '#fbfbf6'], headband: ['#fbfbf6', '#e8434f'], headset: ['#1d2230', '#38f0ff'], sunglasses: ['#1d1a24', '#c9d1dc'], crown: ['#ffd23a', '#e8434f'],
};
export const HAT_TYPES = Object.keys(BUILD);

export function hatDesign(type = 'cap', opts = {}) {
  const t = BUILD[type] ? type : 'cap';
  const [c, c2] = DEFAULTS[t];
  const d = BUILD[t](opts.color || c, opts.color2 || c2);
  d.id = `hat_${t}_${(opts.color || c).slice(1)}${(opts.color2 || c2).slice(1)}`;
  return d;
}

// The accessory a bonded Tokonmon borrows from its trainer's look (hat first, then head/eye/ear accessories).
const ORDER = ['cap', 'beanie', 'straw_hat', 'safari_hat', 'hard_hat', 'headband', 'headset', 'sunglasses'];
export function hatForLook(look) {
  const acc = (look && look.acc) || {};
  const list = Array.isArray(acc) ? Object.fromEntries(acc.map((a) => (typeof a === 'string' ? [a, {}] : [a.type || a.id, a]))) : acc;
  for (const k of ORDER) if (list[k]) return hatDesign(k, list[k]);
  return hatDesign('cap', { color: (look && look.top && look.top.color2) || undefined, color2: (look && look.top && look.top.color) || undefined });
}

// every hat with its default colours (viewer: tools/design.html?mod=../src/data/designs/hats.js&all=1)
export const DESIGNS = Object.fromEntries(HAT_TYPES.map((t) => [t, hatDesign(t)]));
