// Alamo Square: the Painted Ladies postcard. A row of Victorian houses along
// Steiner Street, parked cars, street trees and lamps, and the sloping lawn of
// the park in front where the story begins.
import { Fine } from '../fine.js';
import { Kit, SCHEMES, h3 } from '../kit.js';
import { skyline } from '../stage.js';
import { Dress } from '../dress.js';
import { SPR } from '../cards.js';

export function build(o = {}) {
  const v = new Fine(512, 176, 352, 8), k = new Kit(v), night = o.mood === 'night', dr = new Dress(k);
  const Y = 12;                                    // street level (asphalt top)
  // ground slab
  k.box(0, 0, 0, 511, Y - 1, 351, 'dirt', 'hash');
  // backyards behind the row (north): lawns, fences, trees, the backs of the next street
  k.lawn(0, 0, 511, 72, Y + 1, { flowers: 0.004 });
  for (let x = 0; x < 512; x += 60) k.box(x, Y + 2, 0, x, Y + 9, 68, 'wood', 'rows');
  for (let i = 0; i < 8; i++) k.tree(30 + i * 62 + Math.floor(h3(i, 1, 1) * 20), Y + 2, 20 + Math.floor(h3(i, 2, 1) * 30), i % 3 ? 'oak' : 'street', i);
  // the Painted Ladies
  const lit = night;
  for (let i = 0; i < 8; i++) k.victorian({ x: 4 + i * 63, y: Y + 1, z: 140, w: 60, d: 72, scheme: SCHEMES[i % SCHEMES.length], lit, setback: 24 });
  // Steiner Street
  const st = k.streetX(0, 511, 227, Y, { half: 40, walk: 22 });
  // street trees in wells, lamps, a hydrant
  for (let i = 0; i < 6; i++) { const x = 40 + i * 84; k.box(x - 3, Y, 173, x + 3, Y + 1, 179, 'dirt'); k.tree(x, Y + 2, 176, i % 2 ? 'street' : 'bloom', i); }
  const lamps = [];
  for (let i = 0; i < 5; i++) lamps.push(k.lampPost(80 + i * 96, Y + 2, 168, night));
  for (let i = 0; i < 4; i++) lamps.push(k.lampPost(30 + i * 128, Y + 2, 285, night));
  k.hydrant(250, Y + 2, 170);
  // parked cars along both curbs
  const cols = ['#c8483e', '#3a6ab0', '#e8e4da', '#2e2e34', '#e8b440', '#5a8a6a', '#8a8e98'];
  for (let i = 0; i < 6; i++) k.car(14 + i * 86, Y + 1, 189, cols[i % cols.length], 1);
  for (let i = 0; i < 5; i++) k.car(60 + i * 96, Y + 1, 251, cols[(i + 3) % cols.length], -1);
  // Alamo Square park: a lawn sloping up to the south, a gravel path, benches, cypress and eucalyptus
  for (let z = 292; z <= 351; z++) { const yy = Y + 1 + Math.floor((z - 292) / 5); k.box(0, Y, z, 511, yy, z, 'grass', 'patch', { sc: 5 }); }
  for (let x = 0; x < 512; x++) for (let z = 292; z <= 351; z++) { const yy = Y + 1 + Math.floor((z - 292) / 5), r = h3(x, 9, z); if (r < 0.01) v.set(x, yy + 1, z, v.c(['#f4f0f0', '#ffd84a', '#ff8ab0', '#b49aff'][Math.floor(h3(x, 3, z) * 4)])); else if (r < 0.06) k.set(x, yy + 1, z, 'grass'); }
  for (let x = 0; x < 512; x++) { const z0 = 300 + Math.round(Math.sin(x / 40) * 6); for (let z = z0; z < z0 + 8; z++) { const yy = Y + 1 + Math.floor((z - 292) / 5); k.box(x, yy, z, x, yy, z, 'gravel'); } }
  for (const bx of [120, 300]) { const z = 314; k.bench(bx, Y + 1 + Math.floor((z - 292) / 5) + 1, z); }
  dr.tufts(0, 296, 511, 351, 1400, [...SPR.grass, ...SPR.grass, ...SPR.flowers], 7, { sway: 1.6 });
  dr.tufts(0, 2, 511, 70, 500, [...SPR.grass, ...SPR.fern], 9, { sway: 1.4 });
  k.tree(60, Y + 6, 330, 'cypress', 3); k.tree(420, Y + 7, 335, 'cypress', 4); k.tree(230, Y + 8, 342, 'euc', 5); k.tree(470, Y + 5, 322, 'bloom', 6);
  return {
    vox: v, mood: o.mood || 'golden', lamps,
    view: { target: [32, 3, 24], dist: 58, yaw: 0, pitch: 38 },
    setup(st) { skyline(st, { x: [-30, 100], z: -40 }); dr.build(st); },
  };
}
