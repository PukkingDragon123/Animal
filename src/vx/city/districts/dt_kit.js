// Small building blocks shared by the Downtown and Alamo Hill Park districts.
import { TX } from '../build.js';

/**
 * A "fadeable" structure: a scoreboard, a billboard, a canopy or a bandstand registered with the
 * cutaway like a building, so it turns translucent when you walk behind it, and (with inside: true)
 * its roof lifts away while you stand under it. Draw its parts into B.front (fades, hidden while
 * inside), B.back (always shown) and B.roof (fades, hidden while inside).
 * This only appends to C.buildings and stamps nav building ids — the same bookkeeping C.building() does.
 */
export function fadeable(C, name, x, z, w, d, H, o = {}) {
  const id = C.buildings.length;
  const B = { id, x, z, w, d, floors: 1, fh: H, H, enter: !!o.inside, name, o: { roof: { type: o.pitched ? 'hip' : 'flat' }, step: o.step || 'step_concrete' }, gk: (k, part) => `b${id}:f${k}:${part}` };
  C.buildings.push(B);
  if (o.inside) C.nav.mark(o.inside[0] ?? x, o.inside[1] ?? z, o.inside[2] ?? x + w, o.inside[3] ?? z + d, 0, id);
  B.front = B.gk(0, 'front'); B.back = B.gk(0, 'back'); B.roof = `b${id}:roof`;
  return B;
}
/** a sagging string of hanging props (festoon bulbs) between two points at height y */
export function festoon(C, kind, x0, z0, x1, z1, y, n = 10, sag = 0.7) {
  for (let i = 0; i <= n; i++) { const t = i / n; C.props.push({ kind, x: x0 + (x1 - x0) * t, y: y - Math.sin(t * Math.PI) * sag - 0.25, z: z0 + (z1 - z0) * t, yaw: 0 }); }
  // the wire itself: thin dark segments
  const wire = TX.solid('#2a2e38');
  for (let i = 0; i < n; i++) {
    const a = i / n, b = (i + 1) / n, ya = y - Math.sin(a * Math.PI) * sag, yb = y - Math.sin(b * Math.PI) * sag;
    const ax = x0 + (x1 - x0) * a, az = z0 + (z1 - z0) * a, bx = x0 + (x1 - x0) * b, bz = z0 + (z1 - z0) * b;
    C.quad('props', wire, [ax, ya - 0.025, az], [bx, yb - 0.025, bz], [bx, yb + 0.025, bz], [ax, ya + 0.025, az]);
  }
}
/** a flat painted quad on the ground (fit = the whole texture), north up */
export function groundDecal(C, tex, x0, z0, x1, z1, y = 0.012, gk = 'ground') {
  C.quad(gk, tex, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], { fit: true });
}
/** a thin painted line on the ground from (x0, z0) to (x1, z1), width w */
export function groundLine(C, x0, z0, x1, z1, w = 0.1, col = '#f4f0e0', y = 0.013) {
  const L = Math.hypot(x1 - x0, z1 - z0), nx = -(z1 - z0) / L * w / 2, nz = (x1 - x0) / L * w / 2, t = TX.solid(col);
  C.quad('ground', t, [x0 - nx, y, z0 - nz], [x1 - nx, y, z1 - nz], [x1 + nx, y, z1 + nz], [x0 + nx, y, z0 + nz]);
}
/** a sloped awning over a south-facing opening (x0..x1 along the wall at zFace) */
export function awningS(C, gk, tex, x0, x1, zFace, y1 = 2.5, y0 = 2.05, dep = 1.1) {
  C.quad(gk, tex, [x0, y0, zFace + dep], [x1, y0, zFace + dep], [x1, y1, zFace], [x0, y1, zFace]);
  const side = TX.solid('#2a2e38'); C.tri(gk, side, [x0, y1, zFace], [x0, y0, zFace + dep], [x0, y0 - 0.02, zFace]); C.tri(gk, side, [x1, y1, zFace], [x1, y0, zFace + dep], [x1, y0 - 0.02, zFace]);
}
/** the same for an east-facing opening (z0..z1 along the wall at xFace) */
export function awningE(C, gk, tex, z0, z1, xFace, y1 = 2.5, y0 = 2.05, dep = 1.1) {
  C.quad(gk, tex, [xFace + dep, y0, z1], [xFace + dep, y0, z0], [xFace, y1, z0], [xFace, y1, z1]);
}
/** an L-system-free rand for layout decisions (deterministic per seed) */
export const rng = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
