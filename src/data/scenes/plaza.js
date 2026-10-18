// Tsutenkaku-shita plaza, Osaka 2050 — an old two-level shitamachi square:
// an upper shopping street behind a railing, a retaining wall with a faded
// mural and two wide staircases, a subway entrance, and the lower plaza.
import { Scene2D } from '../../px/scene2d.js';
import { Pen, C, shift, mix, newSurf } from '../../px/paint.js';
import * as PR from '../../px/props.js';
import * as PC from '../../px/props_city.js';

export const PLAZA = { w: 640, h: 420 };

// the mural: a huge faded lionfish king with a crown, painted decades ago
function mural(p, x, y, w, h) {
  const A = mix('#b9c6b4', C.plaster, 0.35), B = mix(C.tealL, C.plaster, 0.45), R = mix(C.redL, C.plaster, 0.45), K = mix(C.ink2, C.plaster, 0.45), Y = mix(C.mustard, C.plaster, 0.4);
  const cx = x + w * 0.5, cy = y + h * 0.56;
  // body
  p.ell(cx, cy, w * 0.2, h * 0.32, B);
  for (let k = -3; k <= 3; k++) p.line(Math.round(cx + k * 6), Math.round(cy - h * 0.28), Math.round(cx + k * 5), Math.round(cy + h * 0.28), mix(B, K, 0.3));
  // fins like a fan of ribbons
  for (let k = 0; k < 9; k++) { const a = -Math.PI * (0.95 - k * 0.11); const ex = cx + Math.cos(a) * w * 0.42, ey = cy + Math.sin(a) * h * 0.62; p.line(Math.round(cx), Math.round(cy - 4), Math.round(ex), Math.round(ey), k % 2 ? R : A); p.line(Math.round(cx) + 1, Math.round(cy - 4), Math.round(ex) + 1, Math.round(ey), k % 2 ? R : A); }
  for (let k = 0; k < 6; k++) { const a = Math.PI * (0.15 + k * 0.14); const ex = cx + Math.cos(a) * w * 0.34, ey = cy + Math.sin(a) * h * 0.4; p.line(Math.round(cx), Math.round(cy + 6), Math.round(ex), Math.round(ey), k % 2 ? A : R); }
  p.ell(cx, cy, w * 0.17, h * 0.27, B);
  // eye + crown
  p.ell(cx - w * 0.07, cy - h * 0.08, 5, 5, A); p.ell(cx - w * 0.07, cy - h * 0.08, 2.5, 2.5, K);
  const ky = Math.round(cy - h * 0.38);
  p.poly([[cx - 14, ky + 8], [cx - 12, ky - 4], [cx - 6, ky + 3], [cx, ky - 7], [cx + 6, ky + 3], [cx + 12, ky - 4], [cx + 14, ky + 8]], Y);
  for (const dx of [-12, 0, 12]) p.px(Math.round(cx + dx), ky - (dx ? 4 : 7) - 1, R);
  // bubbles
  for (let k = 0; k < 7; k++) p.s.ring(Math.round(x + w * (0.12 + k * 0.12)), Math.round(y + h * (0.2 + ((k * 37) % 5) * 0.06)), 3 + (k % 3), 3 + (k % 3), A);
  // paint faded / peeled: knock pixels back to the wall
  for (let k = 0; k < (w * h) / 60; k++) { const i = x + p.ri(0, w - 3), j = y + p.ri(0, h - 2); p.rect(i, j, p.ri(1, 3), p.ri(1, 2), C.plaster2); }
}

export function buildPlaza(o = {}) {
  const sc = new Scene2D({ w: PLAZA.w, h: PLAZA.h, viewW: o.viewW || 480, viewH: o.viewH || 270, sun: [0.55, 0.28], shadowAlpha: 0.36 });
  const g = new Pen(sc.ground, 2050), ov = new Pen(sc.overlay, 77);
  const night = !!o.night;

  // ---------------------------------------------------------------- upper street (y 0–150)
  PR.paving(g, 0, 0, PLAZA.w, 152, { base: C.sandL, slab: 14 });
  const UB = 118;   // building base line
  const row = [
    { w: 70, h: 112, o: { wall: '#d8b8a0', roof: 'tile', roofColor: C.roof, shop: { kind: 'glass', sign: '喫茶', signBg: C.navy, signFg: C.cream, awning: C.teal }, pipe: 'right', posters: 0 } },
    { w: 86, h: 126, o: { wall: '#c9a8b8', floors: 3, shop: { kind: 'glass', sign: 'ラーメン', signBg: C.red, signFg: C.cream, noren: C.navy, mark: '麺', lit: night }, antenna: true, vsign: '大阪', vsignBg: C.mustard, vsignFg: C.ink, pipe: 'left' } },
    { w: 64, h: 104, o: { wall: '#b8c4b0', roof: 'tile', roofColor: '#6a5a88', shop: { kind: 'shutter', graffiti: C.neonP }, meter: true, posters: 2 } },
    { w: 92, h: 132, o: { wall: '#e0cfb0', floors: 3, bricks: true, shop: { kind: 'glass', sign: '薬', signBg: C.cream, signFg: C.green2, awning: C.green, lit: night }, tank: true, vsign: 'くすり', vsignBg: C.cream, vsignFg: C.green2, vsignX: 4 } },
    { w: 74, h: 116, o: { wall: '#9ab0c8', panels: 12, shop: { kind: 'glass', sign: 'TOKON', signBg: C.ink, signFg: C.neonC, lit: true }, antenna: true, neon: C.neonP, vsign: 'ゲーム', vsignBg: C.ink, vsignFg: C.neonP, pipe: 'right' } },
    { w: 70, h: 108, o: { wall: '#d4b098', roof: 'tile', roofColor: C.roof2, shop: { kind: 'glass', sign: '本', signBg: C.wood, signFg: C.cream, awning: C.mustard }, posters: 1 } },
    { w: 88, h: 124, o: { wall: '#c0a0a0', floors: 3, shop: { kind: 'glass', sign: '居酒屋', signBg: C.red2, signFg: C.cream, noren: C.red, mark: '酒', lit: true }, tank: true, pipe: 'left' } },
  ];
  let bx = -6;
  for (const [i, b] of row.entries()) {
    const s = newSurf(b.w + 10, b.h + 20), p = new Pen(s, 11 + i * 17);
    PR.facade(p, 5, 18, b.w, b.h, Object.assign({ night }, b.o));
    sc.add({ surf: s, ax: 5, ay: b.h + 17 }, bx, UB, { shadow: true });
    bx += b.w;
  }
  // a little hologram billboard on the TOKON building (2050)
  {
    const s = newSurf(30, 20), p = new Pen(s, 5);
    p.rect(1, 1, 28, 17, '#1a3a48'); for (let j = 2; j < 18; j += 2) p.hl(1, 28, j, '#24586a');
    p.ell(15, 9, 6, 6, C.neonC); p.ell(15, 9, 3, 3, '#1a3a48'); p.text('2050', 6, 3, C.neonY, { mini: true });
    p.frame(0, 0, 30, 19, C.neonC);
    sc.add({ surf: s, ax: 15, ay: 19 }, 408, 64, { shadow: false, z: 200 });
    sc.glows.push({ x: 408, y: 54, r: 22, color: C.neonC, a: 0.5 });
  }
  // railing along the upper edge of the wall
  const gap = (x) => (x > 30 && x < 130) || (x > 508 && x < 608);       // stair openings
  for (let x = 0; x < PLAZA.w; x++) if (!gap(x)) { g.px(x, 146, C.metal2); g.px(x, 141, C.metalL); }
  for (let x = 2; x < PLAZA.w; x += 10) if (!gap(x)) g.vl(x, 141, 150, C.metal2);
  // sidewalk props (sprites)
  sc.add(PR.vendingMachine({ color: C.red }), 170, 140);
  sc.add(PR.vendingMachine({ color: C.blue }), 194, 140);
  sc.add(PR.bicycle({ color: C.teal }), 248, 138);
  sc.add(PR.bicycle({ color: C.red }), 268, 140);
  sc.add(PR.plantPot({ big: true, flowers: C.redL }), 120, 136);
  sc.add(PR.plantPot({ pot: C.blue }), 318, 134);
  sc.add(PR.postbox(), 352, 136);
  sc.add(PR.barberPole(), 470, 130);
  sc.add(PR.plantPot({ big: true }), 560, 138);
  sc.add(PR.trashBags(), 600, 138);

  // ---------------------------------------------------------------- retaining wall + stairs (y 150–216)
  const WY = 150, WH = 66;
  g.rect(0, WY, PLAZA.w, WH, C.plaster2);
  for (let x = 0; x < PLAZA.w; x += 32) g.vl(x, WY, WY + WH - 1, shift(C.plaster2, -0.6));
  g.hl(0, PLAZA.w - 1, WY, shift(C.plaster2, 1)); g.hl(0, PLAZA.w - 1, WY + 1, shift(C.plaster2, 0.5));
  g.speckle(0, WY, PLAZA.w, WH, shift(C.plaster2, -0.6), 0.03);
  g.drips(0, WY + 2, PLAZA.w, 22, mix(C.plaster2, C.shade, 0.3), 40);
  mural(g, 300, WY + 4, 150, WH - 8);
  g.wash(0, WY, PLAZA.w, 4, C.shade, 0.35);
  // stairs (left, right)
  PR.stairs(g, 34, WY - 2, 92, 10, { stepH: 7 });
  PR.stairs(g, 512, WY - 2, 92, 10, { stepH: 7 });
  // weeds growing at the wall's foot + vines
  for (let x = 130; x < 508; x += 7) if (g.chance(0.7)) { const s = PR.weeds({ w: 14, h: g.ri(8, 15), green: g.chance(0.3) }); g.put(s.surf, x, WY + WH - s.surf.h + 2); }
  for (let x = 140; x < 500; x += g.ri(30, 70)) { let vx = x; for (let j = WY + 2; j < WY + g.ri(18, 40); j++) { vx += g.ri(-1, 1); g.px(vx, j, C.green2); if (g.chance(0.3)) g.px(vx + 1, j, C.greenL); } }
  PC.wallPosters(g, 454, WY + 14, { posters: [['LOST', '#f4ecd8', C.red], ['RANK', C.navy, C.neonC], ['LIVE', '#2a2a4a', C.neonP]], tag: '#5ac8e0' });
  PC.wallPosters(g, 130, WY + 18, { posters: [['MOCHI', '#fff0e0', '#4a8a3a']] });

  // ---------------------------------------------------------------- lower plaza (y 216–420)
  PR.paving(g, 0, WY + WH, PLAZA.w, PLAZA.h - WY - WH, { base: C.sand, slab: 18 });
  g.wash(0, WY + WH, PLAZA.w, 3, C.shade, 0.4);
  PR.checker(g, 196, 318, 250, 90, { a: '#cfae8e', b: '#b39080', tile: 10 });
  PR.dirt(g, 40, 250, 110, 60); PR.dirt(g, 480, 330, 120, 70, { base: C.sand3 });
  PR.dirt(g, 260, 236, 90, 40);
  // manhole + puddle
  // ground life: tactile paving to the subway, a drain along the wall foot, chalk hopscotch, petals under the trees
  PC.tactilePaving(g, 217, 258, 316); PC.tactilePaving(g, 217, 410, 420);
  PC.drainGrate(g, 126, 156, WY + WH + 1); PC.drainGrate(g, 290, 512, WY + WH + 1);
  PC.hopscotch(g, 146, 404);
  PC.fallenLeaves(g, 455, 316, 34, ['#f4b8d0', '#e890b8', '#fff0f4'], 70);
  PC.fallenLeaves(g, 560, 388, 30, ['#c8b050', '#9aa84a', '#d88a3a'], 50);
  PC.fallenLeaves(g, 64, 398, 30, ['#9aa84a', '#c8b050'], 40);
  g.ell(420, 262, 11, 6, C.metal2); g.ell(420, 262, 9, 4.6, C.steel); for (let k = -6; k <= 6; k += 3) g.hl(420 + k - 2, 420 + k + 1, 262, C.metal2);
  g.ell(110, 360, 22, 7, '#8a98b0'); g.ell(106, 358, 14, 3.5, '#b0c0d4'); g.hl(96, 120, 357, '#d8e4f0');
  // weed patches in the plaza
  for (const [x, y, w] of [[20, 236, 30], [140, 290, 22], [600, 300, 26], [560, 400, 30], [30, 400, 40], [500, 240, 20]]) for (let k = 0; k < w; k += 8) { const s = PR.weeds({ w: 14, h: g.ri(8, 14), green: g.chance(0.4) }); sc.add(s, x + k, y + g.ri(0, 6), { shadow: false }); }

  // subway entrance (in front of the wall, left of centre)
  {
    const W = 120, H = 92, s = newSurf(W + 8, H + 8), p = new Pen(s, 21);
    const X = 4, Y = 4;
    // roof slab
    p.block(X - 2, Y, W + 4, 10, '#6a6488'); p.hl(X - 2, X + W + 1, Y + 1, '#8a84a8'); p.rect(X, Y + 10, W, 2, '#4a4468');
    for (let i = X; i < X + W; i += 6) p.px(i + 2, Y + 4, '#58527a');
    // body: tiled walls
    p.rect(X, Y + 12, W, H - 12, '#d8c8b0');
    for (let j = Y + 14; j < Y + H; j += 4) p.hl(X, X + W - 1, j, '#c4b49c'); for (let i = X; i < X + W; i += 6) p.vl(i, Y + 12, Y + H - 1, '#c4b49c');
    // big sign
    PR.signBoard(p, X + 10, Y + 16, W - 20, 22, '地下鉄', { bg: C.paper, fg: C.ink, size: 16 });
    p.text('SUBWAY', X + 34, Y + 40, C.blue2, { mini: true, scale: 1 });
    // entrance mouth
    const ex = X + 30, ew = 60, ey = Y + 48;
    p.rect(ex, ey, ew, H - 48, '#1a1220'); p.frame(ex - 1, ey - 1, ew + 2, H - 46, C.ink);
    p.hl(ex, ex + ew - 1, ey, '#3a2a40');
    for (let k = 0; k < 6; k++) { p.hl(ex + 4, ex + ew - 5, ey + 12 + k * 5, mix('#3a2a40', '#1a1220', k / 6)); }
    p.rect(ex + 6, ey + 4, ew - 12, 5, '#fff2c0'); p.text('↓', ex + ew / 2 - 2, ey + 3, C.ink, { mini: true });
    // side columns + map board + direction sign
    for (const cx of [X + 4, X + W - 12]) { p.block(cx, Y + 12, 8, H - 12, '#b8a088'); p.vl(cx + 1, Y + 12, Y + H - 1, '#d0b8a0'); }
    p.block(X + 14, Y + 52, 12, 18, C.blue); p.rect(X + 16, Y + 54, 8, 14, '#e0e8f0'); p.line(X + 17, Y + 66, X + 22, Y + 56, C.red); p.line(X + 17, Y + 58, X + 23, Y + 64, C.teal);
    p.block(X + W - 26, Y + 52, 12, 10, C.red); p.text('M', X + W - 23, Y + 54, C.cream, { mini: true });
    p.wash(X, Y + 12, W, 3, C.shade, 0.4);
    p.vl(X - 1, Y + 10, Y + H - 1, C.ink); p.vl(X + W, Y + 10, Y + H - 1, C.ink);
    sc.add({ surf: s, ax: 4, ay: H + 3 }, 160, 250);
    sc.glows.push({ x: 220, y: 214, r: 14, color: '#fff2c0', a: 0.4 });
  }
  // trees + bushes (their canopies cast dappled shadows)
  sc.add(PR.tree({ w: 92, h: 120, seed: 4 }), 64, 392);
  sc.add(PR.tree({ w: 80, h: 108, seed: 8, leaf: '#7a9a50' }), 560, 380);
  sc.add(PR.tree({ w: 70, h: 96, seed: 13, leaf: '#8a7aa0', flowers: '#f4b8d0' }), 455, 310);
  for (const [x, y, f] of [[16, 226, null], [330, 222, C.redL], [482, 224, null], [626, 228, C.mustard], [180, 412, null], [300, 414, C.redL]]) sc.add(PR.bush({ w: 32, h: 18, flowers: f }), x, y);
  sc.add(PR.hoarding(110), 320, 418);
  // plaza props
  const pole = PR.utilityPole(170);
  sc.add(pole, 120, 300);
  const pole2 = PR.utilityPole(170);
  sc.add(pole2, 470, 236);
  sc.add(PR.streetLamp({ on: night }), 330, 262);
  if (night) sc.glows.push({ x: 344, y: 200, r: 18, color: '#fff0c0', a: 0.55, base: 262, h: 62 });
  sc.add(PR.bench(), 360, 300);
  sc.add(PR.hydrant(), 296, 266);
  sc.add(PR.cone(), 404, 268); sc.add(PR.cone(), 437, 270);
  // street life: Takoyaki Taisho's yatai with stools, crates and bins; capsule toys; a roadside jizo; a sleeping stray
  sc.add(PC.takoyakiStall({ night }), 528, 268, { foot: [30, 6] });
  sc.add(PC.stool(C.red), 506, 284); sc.add(PC.stool(C.blue), 524, 288); sc.add(PC.stool(C.red), 542, 286);
  sc.add(PC.beerCrates(3), 570, 266); sc.add(PC.beerCrates(2), 586, 270);
  sc.add(PR.crateStack(), 566, 244);
  sc.add(PC.recyclingBins(), 628, 258);
  sc.add(PC.gachaRow(4), 98, 252, { foot: [26, 4] });
  sc.add(PC.jizoShrine(), 302, 234, { foot: [16, 4] });
  sc.add(PR.trashBags(), 44, 258);
  sc.add(PC.cat({ lift: 18 }), 31, 330, { solid: false });
  sc.add(PC.planter(52), 75, 286, { foot: [27, 5] });
  sc.add(PC.planter(64, { flowers: ['#ff9ac8', C.white, C.yellowL] }), 548, 338, { foot: [33, 5] });
  sc.add(PC.busStop(), 612, 330, { foot: [3, 2] });
  sc.add(PR.bicycle({ color: C.red }), 222, 310); sc.add(PR.bicycle({ color: C.blue }), 278, 314);
  // foreground foliage framing the bottom edge
  sc.add(PR.bush({ w: 74, h: 36, flowers: C.redL }), 18, 434, { solid: false }); sc.add(PR.bush({ w: 64, h: 32 }), 92, 438, { solid: false });
  sc.add(PR.bush({ w: 80, h: 38, flowers: C.mustard }), 616, 436, { solid: false });
  sc.glows.push({ x: 497, y: 225, r: 12, color: '#ffb070', a: 0.45, flicker: true, base: 268, h: 43 }, { x: 558, y: 225, r: 12, color: '#ffb070', a: 0.45, flicker: true, base: 268, h: 43 });
  sc.glows.push({ x: 98, y: 232, r: 18, color: '#fff0d8', a: 0.25, light: false });
  sc.add(PR.plantPot({ big: true, flowers: C.mustard }), 40, 300);
  sc.add(PR.vendingMachine({ color: C.green }), 600, 250);
  sc.add(PR.bicycle({ color: C.mustard }), 250, 312);
  sc.add(PR.plantPot({ pot: C.blue, flowers: C.redL }), 196, 300); sc.add(PR.plantPot({ pot: C.blue }), 446, 300);
  sc.add(PR.trashBags(), 540, 300); sc.add(PR.crateStack(), 30, 330);
  // power lines (overlay): pole tops → buildings / each other, sagging
  const wire = (x0, y0, x1, y1, sag) => { let px = x0, py = y0; for (let k = 1; k <= 40; k++) { const t = k / 40, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag; ov.line(Math.round(px), Math.round(py), Math.round(x), Math.round(y), '#2a2030'); px = x; py = y; } };
  const p1 = [120, 300 - 170 + 10], p2 = [470, 236 - 170 + 10];
  wire(p1[0] - 12, p1[1], p2[0] - 12, p2[1], 18); wire(p1[0] + 12, p1[1], p2[0] + 12, p2[1], 22); wire(p1[0] - 9, p1[1] + 10, p2[0] - 9, p2[1] + 10, 26);
  wire(p1[0] - 12, p1[1], -10, 30, 10); wire(p2[0] + 12, p2[1], 660, 50, 14); wire(p2[0] - 12, p2[1], 640, 20, 10);
  // the same wires as 3D catenaries for the diorama stage: [ground x, ground y, height above it]
  sc.wires3d = [
    { a: [108, 300, 160], b: [458, 236, 160], sag: 18 }, { a: [132, 300, 160], b: [482, 236, 160], sag: 22 }, { a: [111, 300, 150], b: [461, 236, 150], sag: 26 },
    { a: [108, 300, 160], b: [-10, 118, 88], sag: 10 }, { a: [482, 236, 160], b: [660, 118, 68], sag: 14 }, { a: [458, 236, 160], b: [640, 118, 98], sag: 10 },
  ];
  // a string of lanterns over the upper street (painted on the overlay in 2D, hung as 3D cards in the diorama)
  { let lx = 0, prev = null; const lanSurf = (col) => { const s2 = newSurf(9, 14), p2 = new Pen(s2, 3); PR.lantern(p2, 1, 2, { color: col }); return s2; };
    for (let x = 6; x < PLAZA.w; x += 26) { const y = 92 + Math.round(Math.sin((x / PLAZA.w) * Math.PI * 3) * 4), col = x % 52 ? C.red : C.mustard; if (lx) ov.line(lx[0], lx[1], x, y, '#3a2a30'); PR.lantern(ov, x - 3, y, { color: col }); lx = [x, y];
      sc.glows.push({ x, y: y + 6, r: 8, color: '#ffb070', a: 0.3, base: 132, h: 132 - y - 6 });
      sc.add({ surf: lanSurf(col), ax: 4, ay: 132 - y + 2 }, x, 132, { only3d: true, shadow: true, solid: false });
      if (prev) sc.wires3d.push({ a: [prev[0], 132, 132 - prev[1]], b: [x, 132, 132 - y], sag: 3 }); prev = [x, y]; } }
  // terraces for the diorama: the upper street is a level 66 painted px up; the retaining wall is its vertical face
  sc.terrain = [{ y0: -1000, y1: 150, h0: 66, h1: 66 }, { y0: 150, y1: 216, h0: 66, h1: 0 }, { y0: 216, y1: 100000, h0: 0, h1: 0 }];
  sc.bake();
  return sc;
}
