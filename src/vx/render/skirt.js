// The world beyond the map: the camera looks north-west from above, so past the edges of the walkable
// city it would see the void. A skirt continues the world instead: the bay runs on to the north, a
// perimeter street with sidewalks wraps the other three sides, and a ring of simple blocks (pixel
// textured, with windows that light up at night) stands behind it, melting into the haze. Pure scenery:
// built with the CityBuilder's raw geometry (no collision, no minimap) into the 'skirt' group.
import * as TX from '../city/pixtex.js';

const WALLS = [['brick', '#a8523a'], ['plaster', '#e8d8c0'], ['siding', '#7aa8c8'], ['plaster', '#d8b8a0'], ['brick', '#8a4a3a'], ['siding', '#c8a87a'], ['concrete', '#b8b0a4'], ['plaster', '#c8d0c0'], ['siding', '#d88a7a'], ['brick', '#9a6a4a']];
const CURT = ['#d87a6a', '#7aa0c8', '#e8c86a', '#9ac87a'];
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

export function skirt(C, o = {}) {
  const W = C.w, D = C.d, gk = 'skirt', night = C.night, F = 160, waterY = o.waterY ?? -0.8, bayZ = o.bayZ ?? 12;
  const flat = (tex, x0, z0, x1, z1, y = 0) => C.quad(gk, tex, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], { u0: x0, v0: -z1 });
  // ---- the bay: on past the north edge, and either side of the waterfront
  const water = TX.water(o.waterCol || '#3a7ab0');
  const wq = (x0, z0, x1, z1) => C.quad('water', water, [x0, waterY, z1], [x1, waterY, z1], [x1, waterY, z0], [x0, waterY, z0], { u0: x0, v0: -z1 });
  wq(-F, -F * 1.6, W + F, 0); wq(-F, 0, 0, bayZ); wq(W, 0, W + F, bayZ);
  // quay walls where the land beyond the map meets the water
  const quay = TX.concrete('#8a8478');
  C.box(gk, quay, -F, waterY - 0.6, bayZ - 0.4, 0, 0, bayZ, { skip: { top: true, s: true } }); C.box(gk, quay, W, waterY - 0.6, bayZ - 0.4, W + F, 0, bayZ, { skip: { top: true, s: true } });
  // ---- ground: sidewalk + street hugging the edge, then a sidewalk and city blocks beyond
  const asph = TX.asphalt(), pav = TX.pavers(), conc = TX.concrete('#a8a49c'), curb = TX.concrete('#b8b4ac'), side = (x0, z0, x1, z1) => C.box(gk, curb, x0, 0, z0, x1, 0.12, z1, { top: pav, skip: { bottom: true } });
  // west (x < 0) · east (x > W) · south (z > D)
  side(-2, bayZ, 0, D + 2); flat(asph, -12, bayZ, -2, D + 12); side(-15, bayZ, -12, D + 12); flat(conc, -F, bayZ, -15, D + F);
  side(W, bayZ, W + 2, D + 2); flat(asph, W + 2, bayZ, W + 12, D + 12); side(W + 12, bayZ, W + 15, D + 12); flat(conc, W + 15, bayZ, W + F, D + F);
  side(0, D, W, D + 2); flat(asph, -2, D + 2, W + 2, D + 12); side(-15, D + 12, W + 15, D + 15); flat(conc, -15, D + 15, W + 15, D + F);
  // dashed centre lines
  const dash = TX.dashTex();
  for (let z = bayZ + 1; z < D + 6; z += 3) for (const xc of [-7, W + 7]) C.quad(gk, dash, [xc - 0.08, 0.012, z], [xc - 0.08, 0.012, z + 3], [xc + 0.08, 0.012, z + 3], [xc + 0.08, 0.012, z], { fit: true });
  for (let x = -6; x < W + 6; x += 3) C.quad(gk, dash, [x, 0.012, D + 7.08], [x + 3, 0.012, D + 7.08], [x + 3, 0.012, D + 6.92], [x, 0.012, D + 6.92], { fit: true });
  // ---- blocks: a row along each side (lower to the south and east, where they stand near the camera)
  const block = (x, z, w, d, h, i) => {
    const [kind, c] = WALLS[Math.floor(hash(x, z) * WALLS.length)], wall = TX[kind](c), roof = TX.concrete('#8a867e');
    C.box(gk, wall, x, 0, z, x + w, h, z + d, { top: roof, skip: { bottom: true } });
    C.box(gk, TX.solid('#e8e0d0'), x - 0.1, h, z - 0.1, x + w + 0.1, h + 0.35, z + d + 0.1, { skip: { bottom: true } });
    const fl = Math.floor(h / 3);
    // windows on the faces the camera sees (south and east)
    for (let k = 0; k < fl; k++) {
      const y = k * 3 + 1.1;
      for (let s = 1.4; s < w - 0.8; s += 2.4) { const lit = night && hash(x + s, z + k) < 0.45; C.decal(gk, TX.windowTex('#f2ead8', CURT[(i + k + Math.floor(s)) % 4], lit), x + s, y, z + d, 's', 1.0, 1.4, { off: 0.03 }); }
      for (let s = 1.4; s < d - 0.8; s += 2.4) { const lit = night && hash(x + w, z + s + k) < 0.45; C.decal(gk, TX.windowTex('#f2ead8', CURT[(i + k + Math.floor(s) + 1) % 4], lit), x + w, y, z + s, 'e', 1.0, 1.4, { off: 0.03 }); }
    }
  };
  let i = 0;
  for (let z = bayZ + 6; z < D + 4;) { const d = Math.min(10 + Math.floor(hash(1, z) * 8), D + 14 - z), w = 12 + Math.floor(hash(2, z) * 10); block(-15 - w - 0.5, z, w, d - 0.6, 6 + Math.floor(hash(3, z) * 7) * 3, i++); z += d; }
  for (let z = bayZ + 6; z < D + 4;) { const d = Math.min(10 + Math.floor(hash(4, z) * 8), D + 14 - z), w = 12 + Math.floor(hash(5, z) * 10); block(W + 15.5, z, w, d - 0.6, 6 + Math.floor(hash(6, z) * 3) * 3, i++); z += d; }
  for (let x = -14; x < W + 6;) { const w = Math.min(9 + Math.floor(hash(x, 7) * 8), W + 14.5 - x); block(x, D + 15.5, w - 0.6, 12, 6 + Math.floor(hash(x, 8) * 2) * 3, i++); x += w; }
}
