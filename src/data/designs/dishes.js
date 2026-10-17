// Dishes served in the eating zoom-in scenes (static voxel props, ~0.2–0.35 m).
// dishDesign(foodId) picks the right model and tints it for the food.
import { FOODS } from '../foods.js';

const D = (id, vs, pal, s, fx) => ({ id: 'dish_' + id, vs, arch: 'static', mesh: 'smooth', pal, parts: [{ n: 'body', p: [0, 0, 0], s }], fx: fx || [] });
const STEAM = (y) => [{ part: 'body', at: [0, y, 0], type: 'steam', rate: 0.6, scale: 0.5 }];

const BUILD = {
  bowl: (c, c2) => D('bowl', 0.01, { w: '#f4efe6', r: '#c8322e', a: c, b: c2 }, [
    ['ell', [0, 0.07, 0], [0.13, 0.07, 0.13], 'w'],
    ['ell', [0, 0.1, 0], [0.115, 0.06, 0.115], 'w', { sub: 1 }],
    ['tor', [0, 0.115, 0], 0.122, 0.012, 'r'],
    ['ell', [0, 0.095, 0], [0.11, 0.02, 0.11], 'a'],
    ['sph', [0.04, 0.11, 0.02], 0.025, 'b'], ['sph', [-0.03, 0.105, -0.03], 0.02, 'b'],
    ['cyl', [0, 0, 0], [0, 0.015, 0], 0.06, 'w'],
  ], STEAM(0.16)),
  plate: (c, c2) => D('plate', 0.01, { w: '#f4efe6', a: c, b: c2, k: '#3a2418' }, [
    ['cyl', [0, 0, 0], [0, 0.02, 0], 0.16, 'w'],
    ['ell', [0, 0.04, 0], [0.12, 0.03, 0.12], 'a'],
    ['box', [0, 0.072, 0], [0.09, 0.006, 0.012], 'k', { rot: [0, 30, 0] }], ['box', [0, 0.072, 0], [0.09, 0.006, 0.012], 'k', { rot: [0, -30, 0] }],
    ['sph', [0.03, 0.075, 0.03], 0.02, 'b'], ['sph', [-0.04, 0.072, -0.01], 0.016, 'b'],
  ], STEAM(0.12)),
  sundae: (c, c2) => D('sundae', 0.008, { g: '#d8f4ff', a: c, b: c2, r: '#e0284f' }, [
    ['cap', [0, 0, 0], [0, 0.07, 0], 0.03, 0.012, 'g'],
    ['ell', [0, 0.11, 0], [0.07, 0.05, 0.07], 'g'],
    ['ell', [0, 0.14, 0], [0.06, 0.05, 0.06], 'a'],
    ['sph', [0, 0.2, 0], 0.045, 'b'],
    ['sph', [0, 0.25, 0], 0.016, 'r'],
  ]),
  float: (c, c2) => D('float', 0.008, { g: '#e8fbff', a: c, b: c2, s: '#ff4f7a' }, [
    ['cyl', [0, 0, 0], [0, 0.16, 0], 0.05, 'g'],
    ['cyl', [0, 0.01, 0], [0, 0.15, 0], 0.044, 'a'],
    ['sph', [0, 0.17, 0], 0.045, 'b'],
    ['cyl', [0.02, 0.15, 0], [0.04, 0.28, 0.01], 0.006, 's'],
  ]),
  boat: (c, c2) => D('boat', 0.009, { w: '#e9d7b0', a: c, b: c2, k: '#4a2a18' }, [
    ['box', [0, 0.02, 0], [0.13, 0.02, 0.07], 'w', { round: 0.02 }],
    ...[-0.08, 0, 0.08].flatMap((x) => [['sph', [x, 0.06, 0.025], 0.032, 'a'], ['sph', [x, 0.06, -0.025], 0.032, 'a']]),
    ['box', [0, 0.085, 0], [0.11, 0.005, 0.05], 'k', { paint: 1 }],
    ['sph', [0.04, 0.09, 0], 0.01, 'b'],
  ], STEAM(0.12)),
  skewers: (c, c2) => D('skewers', 0.009, { w: '#f4efe6', a: c, b: c2, k: '#c9a06a' }, [
    ['cyl', [0, 0, 0], [0, 0.015, 0], 0.15, 'w'],
    ...[-0.05, 0, 0.05].flatMap((z) => [['cyl', [-0.13, 0.04, z], [0.13, 0.04, z], 0.006, 'k'], ['cap', [-0.06, 0.045, z], [0.07, 0.045, z], 0.026, 0.022, 'a', { dither: { col: c2, amt: 0.3 } }]]),
  ]),
  bottle: (c, c2) => D('bottle', 0.008, { g: c, b: c2, w: '#ffffff' }, [
    ['cyl', [0, 0, 0], [0, 0.14, 0], 0.035, 'g'],
    ['cap', [0, 0.14, 0], [0, 0.2, 0], 0.035, 0.014, 'g'],
    ['sph', [0, 0.17, 0], 0.012, 'b', { glow: 1 }],
    ['box', [0, 0.07, 0.035], [0.025, 0.03, 0.004], 'w', { paint: 1 }],
  ]),
  egg: (c, c2) => D('egg', 0.008, { w: '#f4efe6', a: c, b: c2 }, [
    ['cyl', [0, 0, 0], [0, 0.05, 0], 0.07, 'w'],
    ['ell', [0, 0.06, 0], [0.04, 0.035, 0.04], 'a'],
    ['sph', [0, 0.07, 0.01], 0.018, 'b'],
  ], STEAM(0.1)),
};
const PICK = {
  yellow_sub_float: ['float', '#ffe36b', '#fff8e6'], octopus_garden_sundae: ['sundae', '#4fc7ff', '#fff3e0'], chili_mango_swirl: ['sundae', '#ffb02e', '#ff6a2b'], matcha_strawberry_fields: ['sundae', '#8fd36a', '#ff5d7c'],
  abbey_road_okonomiyaki: ['plate', '#c8843a', '#5fd35a'], come_together_modan: ['plate', '#b87436', '#ffd23a'], something_yakisoba: ['plate', '#a8743a', '#ff5d7c'], here_comes_the_sunny_egg: ['egg', '#fff6e0', '#ffc23a'],
  takoyaki: ['boat', '#c8843a', '#5fd35a'], kushikatsu: ['skewers', '#d9a050', '#b87436'], red_hot_ramen: ['bowl', '#e8433a', '#ffd9a0'],
  super_spicy_curry: ['bowl', '#8a2a14', '#ffb02e'], mild_curry: ['bowl', '#c8843a', '#fff3c4'], ramen: ['bowl', '#f2e2c4', '#ff9db0'], mapo_tofu: ['bowl', '#c8322e', '#fff3e0'],
  fruit_sando: ['plate', '#fff6e8', '#ff5d7c'], seaweed_salad: ['bowl', '#3fae4a', '#f4efe6'], lemon_tart: ['plate', '#ffe36b', '#fff8e6'],
  doteyaki: ['bowl', '#7a4a2a', '#5fd35a'], ghost_pepper_kushikatsu: ['skewers', '#8a1a14', '#ff3a1a'], onsen_tamago: ['egg', '#f4efe6', '#ffc23a'], ramune: ['bottle', '#7ad8ff', '#3fae4a'],
  momiji_tempura: ['plate', '#e8833a', '#d43a2a'], yuzu_cider: ['bottle', '#ffe36b', '#fff8e6'],
};
const cache = new Map();
export function dishDesign(foodId) {
  if (cache.has(foodId)) return cache.get(foodId);
  const [kind, c, c2] = PICK[foodId] || ['plate', '#c8843a', '#5fd35a'];
  const d = BUILD[kind](c, c2);
  d.id = 'dish_' + foodId;
  cache.set(foodId, d);
  return d;
}
export const DESIGNS = Object.fromEntries(Object.keys(FOODS).map((id) => [id, dishDesign(id)]));
