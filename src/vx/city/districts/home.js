// placeholder: the home street with a test house (replaced by the full district build)
import { TX } from '../build.js';
export function build(C, [x0, z0, x1, z1], ctx) {
  C.ground(x0, z0, x1, z1, TX.grass());
  C.sidewalk(x0, z0, x1, z0 + 6);
  const B = C.building({ x: 20, z: 118, w: 12, d: 10, floors: 2, enter: true, wall: TX.siding('#7aa8c8'), trim: '#f4ece0', roof: { type: 'gable', col: '#5a4a5a', ridge: 'x' }, door: { side: 'n', at: 0.5 }, windows: { every: 2.6 },
    interior(C, B) {
      C.iwall(B, 0, 20, 123, 26, 123, { gaps: [{ at: 4.5, w: 1.1 }] });
      C.stairs(B, 0, 29.5, 120.5, 31.5, 126.5, 'n');
      C.furniture(B, 0, 21, 124, 24, 125, 0.9, TX.planks('#a87a4a'));
      C.interact({ x: 22.5, z: 123.6, label: 'Examine table', act: async (app) => app.say('', 'A sturdy wooden table.') });
    } });
  C.spot('start', 26, 116, Math.PI);
  C.zone('home', x0, z0, x1, z1, { label: 'Sunset Row', music: 'lofi' });
  return B;
}
