// placeholder district: ground + a few blocks (replaced by the full district build)
import { TX } from '../build.js';
export function build(C, [x0, z0, x1, z1], ctx) {
  C.ground(x0, z0, x1, z1, TX.pavers());
  C.zone('downtown', x0, z0, x1, z1, { label: 'downtown' });
}
