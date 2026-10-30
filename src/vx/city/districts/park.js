// placeholder district: ground + a few blocks (replaced by the full district build)
import { TX } from '../build.js';
export function build(C, [x0, z0, x1, z1], ctx) {
  C.ground(x0, z0, x1, z1, 1 === 1 ? TX.grass() : TX.pavers());
  C.zone('park', x0, z0, x1, z1, { label: 'park' });
}
