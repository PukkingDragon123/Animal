// Engine lab: a small set for testing the 2D layer on the voxels — card trees,
// potted bamboo, tufts, lantern strings, laundry, posters and a CJK shop sign.
import { Fine } from '../fine.js';
import { Kit, h3 } from '../kit.js';
import { Dress } from '../dress.js';
import { SPR } from '../cards.js';
import { decal, glyphs, loadSignFonts } from '../decals.js';

export async function prepare() { await loadSignFonts('福滿樓茶點心中華'); }
export function build(o = {}) {
  const v = new Fine(256, 128, 192, 8), k = new Kit(v), dr = new Dress(k), Y = 8;
  k.box(0, 0, 0, 255, Y - 1, 191, 'dirt', 'hash');
  k.lawn(0, 120, 255, 191, Y, { flowers: 0.006 });
  k.box(0, Y - 2, 96, 255, Y, 119, 'sidewalk', 'patch', { sc: 8 });
  // a brick shop building facing +z
  k.box(20, Y + 1, 40, 200, Y + 80, 95, (x, y, z) => (y % 3 === 0 ? k.m('mortar')[0] : k.m('brick')[Math.floor(h3(x >> 1, y, z) * 4)]));
  k.box(30, Y + 1, 95, 190, Y + 22, 95, 0); k.box(30, Y + 1, 93, 190, Y + 22, 93, 'glass', 'hash');
  for (let i = 0; i < 6; i++) { const wx = 32 + i * 28; k.box(wx, Y + 34, 95, wx + 12, Y + 52, 95, 0); k.box(wx, Y + 34, 94, wx + 12, Y + 52, 94, 'glass'); k.box(wx - 1, Y + 33, 96, wx + 13, Y + 33, 96, 'trim'); }
  dr.tree(30, Y + 1, 150, 'leaf', 1); dr.tree(110, Y + 1, 160, 'oak', 2); dr.tree(190, Y + 1, 150, 'bloom', 3); dr.tree(235, Y + 1, 175, 'euc', 4);
  dr.pot(60, Y + 1, 104, 'bamboo', '#b85a3a', 1); dr.pot(160, Y + 1, 104, 'fern', '#3a6a8a', 2);
  for (const px of [12, 244]) k.box(px, Y + 1, 112, px + 1, Y + 56, 113, 'woodDark');
  dr.lanterns([12, Y + 54, 112], [244, Y + 54, 112], { sag: 14, mixed: true });
  dr.lanterns([40, Y + 70, 95], [12, Y + 54, 112], { sag: 6 });
  dr.laundry([120, Y + 64, 95], [244, Y + 50, 112], { sag: 6 });
  dr.pennants([12, Y + 44, 112], [120, Y + 40, 95], {});
  dr.tufts(0, 122, 255, 191, 90, [...SPR.grass, ...SPR.flowers, ...SPR.fern], 1);
  return {
    vox: v, mood: o.mood || 'day', dress: dr,
    view: { target: [16, 4, 14], dist: 34, yaw: 0, pitch: 38 },
    setup(st) {
      dr.build(st);
      decal(st, { x: 7.5, y: Y / 8 + 3.3, z: 12.0, w: 2.2, h: 1.0, face: 's', paint: (p, W, H) => { p.rect(0, 0, W, H, '#8a1e22'); p.frame(1, 1, W - 2, H - 2, '#e8c040'); glyphs(p, '福滿樓', W / 2, 4, 22, '#f4d060', { align: 'center', outline: '#4a0e10' }); } });
    },
  };
}
