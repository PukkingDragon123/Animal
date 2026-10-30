// CHINATOWN — rect [116, 32, 230, 98]. North: Bay Street; south: Market Street (the Dragon Gate); west: Van Ness.
//   Grant Lane (x 142–150) runs north–south under strings of red lanterns, Jackson Lane (z 58–64) crosses it
//   east–west, Ross Alley (x 128–131) and Old Lane (x 162–165) are the back alleys. East of Grant: the Golden
//   Claw Dojo in its walled courtyard (north) and the Square with its pavilion and chess tables (south).
import { TX } from '../build.js';
import './props_ct.js';
import {
  crisp, tri3, quad4, beam, fbox, floorDecal, discDecal, diamondDecal, hipRoof, pent, balcony, bladeSign, lanternString, column, sideLine, sidePt, sideLen, outN,
  tiles, eaveTiles, lacquer, lattice, beamPaint, brackets, ctWin, redDoor, shopDoor, signH, signV, board, basket, granite, timberWall, tatami, scroll, xiangqi, shopWin,
  textW, ptex, light, dark,
} from './ct_kit.js';

const GL0 = 142, GL1 = 150, JK0 = 58, JK1 = 64, RA0 = 128, RA1 = 131, OL0 = 162, OL1 = 165;
const SQ = [166, 66, 206, 97], SQY = 0.3;
const FRONT = (sd) => (sd === 's' || sd === 'e' ? 'front' : 'back');
const pick = (arr, k) => arr[Math.abs(Math.floor(k)) % arr.length];

// a pseudo-building record so free-standing landmarks (gate, pavilion) fade / cut away like buildings
function landmark(C, x, z, w, d, H, o = {}) {
  const id = C.buildings.length;
  const B = { id, x, z, w, d, floors: 1, fh: H, H, enter: false, name: o.name || 'landmark' + id, o: { roof: { type: 'hip' }, step: o.step }, gk: (k, part) => `b${id}:f${k}:${part}` };
  C.buildings.push(B);
  if (o.mark) C.nav.mark(o.mark[0], o.mark[1], o.mark[2], o.mark[3], 0, id);
  return B;
}
// a box spanning side-parameter s0..s1 and outward o0..o1 (metres) on side sd of building B
function sbox(C, gk, B, sd, s0, s1, o0, o1, y0, y1, tex, o) {
  const [nx, nz] = outN(sd), a = sidePt(B, sd, s0), b = sidePt(B, sd, s1);
  const xs = [a[0] + nx * o0, a[0] + nx * o1, b[0] + nx * o0, b[0] + nx * o1], zs = [a[1] + nz * o0, a[1] + nz * o1, b[1] + nz * o0, b[1] + nz * o1];
  C.box(gk, tex, Math.min(...xs), y0, Math.min(...zs), Math.max(...xs), y1, Math.max(...zs), o);
}
// a decal centred at side-parameter s on side sd, standing out by off
function sdecal(C, gk, B, sd, s, y, tex, w, h, off = 0.03) { const p = sidePt(B, sd, s); C.decal(gk, tex, p[0], y, p[1], sd, w, h, { off }); }

/** a sign board texture sized to its lettering */
function autoSign(en, cjk, bg, fg, o = {}) {
  const ew = textW(en, 16), cw = cjk ? [...cjk].length * 18 + 10 : 0, w = Math.max(2.4, (ew + cw + 26) / 32);
  return { tex: signH(en, cjk, bg, fg, Math.round(w * 4) / 4, 0.72, o), w: Math.round(w * 4) / 4 };
}

/**
 * A Chinatown shophouse: shell from C.building, then on each shop side a shopfront (tiled kick plate, lacquered
 * pilasters, goods in the windows, a door, a lettered sign board, a green-tiled pent eave with lanterns), upper
 * windows with lattice transoms, balconies, a vertical blade sign, and a tiled eave along the top.
 */
function house(C, o, ctx) {
  const fh = o.fh || 3.3, floors = o.floors || 3, shops = o.shops || [], sides = shops.map((s) => s.side);
  const B = C.building({ x: o.x, z: o.z, w: o.w, d: o.d, floors, fh, wall: o.wall, trim: o.trim || '#efe6d2', base: o.base || '#5a5652',
    roof: { type: 'flat', parapet: o.roof === 'hip' ? 0.01 : o.parapet ?? 0.5, tank: o.tank },
    windows: { every: 2.4, frame: o.frame || '#2e6a4a', skip: [...sides, ...(o.skip || [])], lit: 0.45 }, mm: o.mm || '#c87a5a', name: o.name });
  B.fh = fh;
  const roofG = `b${B.id}:roof`, H = floors * fh, tileC = o.tileCol || '#3f8a5a';
  for (const S of shops) shopfront(C, B, S, o, ctx);
  if (o.roof === 'hip') {
    // the cutaway judges "behind" by height: count the tiled roof in
    const rh = o.rh ?? Math.min(o.w, o.d) * 0.36; B.o.roof.type = 'hip'; B.H = H + rh * 0.7;
    hipRoof(C, roofG, { x0: o.x, z0: o.z, x1: o.x + o.w, z1: o.z + o.d, y: H, e: o.eave ?? 0.7, rh, tex: tiles(tileC), capCol: dark(tileC, 0.35), eaveCol: dark(tileC, 0.25), hookCol: o.hookCol || '#d8a83a', flare: 0.45 });
  } else {
    // a parapet cap of glazed tiles along the shop sides, with little upturned ends
    if (o.topEave !== false) for (const S of shops) { const [ax, az, bx, bz] = sideLine(B, S.side); pent(C, roofG, S.side, [ax, az], [bx, bz], H + 0.35, 0.55, 0.28, { col: tileC, flare: 0.25, ext: 0.2 }); }
    if (o.roofClutter !== false) roofClutter(C, B, roofG, H, o);
  }
  return B;
}
function roofClutter(C, B, gk, H, o) {
  const r = ((B.x * 7 + B.z * 13) % 10) / 10, conc = TX.concrete('#9a968e');
  if (r < 0.5) { C.box(gk, TX.metalRoof('#9aa4ac'), B.x + B.w * 0.25, H, B.z + B.d * 0.3, B.x + B.w * 0.25 + 1.2, H + 0.9, B.z + B.d * 0.3 + 0.8); C.box(gk, TX.solid('#6a6a68'), B.x + B.w * 0.25 + 0.2, H + 0.9, B.z + B.d * 0.3 + 0.2, B.x + B.w * 0.25 + 1.0, H + 1.0, B.z + B.d * 0.3 + 0.6); }
  else { C.box(gk, conc, B.x + B.w * 0.55, H, B.z + B.d * 0.25, B.x + B.w * 0.55 + 2.2, H + 2.0, B.z + B.d * 0.25 + 2.0, { top: TX.solid('#7a7672') }); C.decal(gk, TX.doorTex('#5a6a7a'), B.x + B.w * 0.55 + 1.1, H, B.z + B.d * 0.25 + 2.0, 's', 0.8, 1.8); }
  if (o.garden) { const p = TX.solid('#8a6a52'); for (let i = 0; i < 3; i++) { const x = B.x + 1 + i * 1.3, z = B.z + B.d - 1.2; C.box(gk, p, x, H, z, x + 0.9, H + 0.4, z + 0.6, { top: TX.grass('#4a8a3a') }); } }
}
function shopfront(C, B, S, o, ctx) {
  const sd = S.side, L = sideLen(B, sd), gk = B.gk(0, FRONT(sd)), fh = B.fh, night = ctx.night;
  const [ax, az, bx, bz] = sideLine(B, sd), pil = lacquer(S.pil || o.pil || '#a82a24'), frame = S.frame || o.frame || '#2e5a3a';
  C.band(gk, sd, ax, az, bx, bz, 0, 0.42, 0.06, TX.tiles(S.tile || '#2e6a4a', light(S.tile || '#2e6a4a', 0.15), 0.125));
  for (const s of [0.05, L - 0.4]) sbox(C, gk, B, sd, s, s + 0.35, -0.02, 0.14, 0, 2.55, pil);
  const door = S.door ?? Math.min(L - 1.2, Math.max(1.2, L * 0.28)), dw = S.dw || 1.1;
  sdecal(C, gk, B, sd, door, 0, S.doorTex || shopDoor(frame), dw, 2.2, 0.035);
  sbox(C, gk, B, sd, door - dw / 2 - 0.08, door + dw / 2 + 0.08, -0.02, 0.1, 2.2, 2.32, TX.solid(dark(frame, 0.2)));
  for (const [s0, s1] of [[0.45, door - dw / 2 - 0.12], [door + dw / 2 + 0.12, L - 0.45]]) {
    if (s1 - s0 < 0.8) continue;
    sdecal(C, gk, B, sd, (s0 + s1) / 2, 0.45, shopWin(S.kind || 'misc', Math.round((s1 - s0) * 4) / 4, 1.8, night, frame), s1 - s0, 1.8, 0.035);
    sbox(C, gk, B, sd, s0, s1, -0.02, 0.12, 0.38, 0.45, TX.solid('#d8d0c0'));
  }
  // sign board (above the eave, where the high camera can read it)
  const sg = autoSign(S.en, S.cjk, S.bg || '#b8282a', S.fg || '#f0d060', { enCol: S.enCol });
  const sw = Math.min(L - 0.9, sg.w), sc = S.signAt ?? L / 2;
  sbox(C, gk, B, sd, sc - sw / 2 - 0.1, sc + sw / 2 + 0.1, -0.02, 0.16, 2.76, 3.6, TX.solid(S.board || '#3a2420'));
  sdecal(C, gk, B, sd, sc, 2.81, sg.tex, sw, 0.74, 0.17);
  // the pent eave over the windows and its lanterns
  if (S.eave !== false) {
    pent(C, gk, sd, [ax, az], [bx, bz], 2.64, S.eaveDep || 0.8, 0.34, { col: S.eaveCol || o.tileCol || '#3f8a5a', flare: 0.22, ext: 0.12 });
    const [nx, nz] = outN(sd), n = Math.max(1, Math.floor(L / 2.4));
    if (S.lanterns !== false) for (let i = 0; i < n; i++) { const p = sidePt(B, sd, (L / n) * (i + 0.5)); C.props.push({ kind: 'lantern', x: p[0] + nx * 0.58, y: 1.72, z: p[1] + nz * 0.58, yaw: 0, s: 0.68 }); }
  } else if (S.awning) {
    const at = TX.awningTex(S.awning[0], S.awning[1]), [nx, nz] = outN(sd), x0 = ax, z0 = az, x1 = bx, z1 = bz, y1 = 2.42, y0 = 2.0, dep = 1.1;
    const A = [x0, y1, z0], Bp = [x1, y1, z1], Cc = [x1 + nx * dep, y0, z1 + nz * dep], D = [x0 + nx * dep, y0, z0 + nz * dep];
    C.quad(gk, at, D, Cc, Bp, A); C.quad(gk, at, A, Bp, Cc, D);
  }
  // upper floors on this side: lattice-topped windows, balconies, a blade sign
  for (let k = 1; k < B.floors; k++) {
    const gkk = B.gk(k, FRONT(sd)), y0 = k * fh, n = Math.max(1, Math.floor((L - 0.6) / 2.2)), step = L / n;
    const balc = k >= 2 && (S.balc || o.balc || []).includes(k);
    for (let i = 0; i < n; i++) {
      const s = step * (i + 0.5), lit = night && ((B.id * 3 + i + k) % 3 !== 0);
      sdecal(C, gkk, B, sd, s, y0 + 0.7, ctWin(o.winFrame || '#2e6a4a', '#4a6a8a', lit, (i + k + B.id) % 4 === 0), 1.0, 1.5, 0.03);
      sbox(C, gkk, B, sd, s - 0.6, s + 0.6, -0.02, 0.12, y0 + 0.62, y0 + 0.7, TX.solid('#e8e0d0'));
      if (!balc && (i + k + B.id) % 3 === 1) sbox(C, gkk, B, sd, s - 0.5, s + 0.5, 0.05, 0.3, y0 + 0.4, y0 + 0.62, TX.solid('#7a4a2a'), { top: TX.grass('#4a8a3a') });
    }
    if (balc) { const a = sidePt(B, sd, 0.35), b = sidePt(B, sd, L - 0.35); balcony(C, gkk, sd, a, b, y0 + 0.1, 0.85, { railCol: S.rail || o.rail || '#c8322a', railBg: '#4a3030' }); }
  }
  if (S.blade && B.floors > 1) {
    const s = S.bladeAt ?? L - 0.55, p = sidePt(B, sd, s), gk1 = B.gk(1, FRONT(sd)), h = Math.min(2.6, (B.floors - 1) * fh - 0.6);
    bladeSign(C, gk1, sd, p[0], p[1], fh + 0.3, signV(S.blade, S.bladeBg || S.bg || '#b8282a', S.bladeFg || '#f0d060', 0.7, h), 0.7, h);
  }
}

// ---------------------------------------------------------------- the district
export function build(C, [x0, z0, x1, z1], ctx) {
  const night = ctx.night;
  // ---- ground: base pavers, Grant Lane bricks, Jackson setts, alleys, the gate plaza
  C.ground(x0, z0, x1, z1, TX.pavers('#c4bcae'));
  C.ground(GL0, z0, GL1, 89, basket('#b0604a'), { y: 0.006 });
  for (const x of [GL0, GL1 - 0.45]) C.ground(x, z0, x + 0.45, 89, granite('#a8a49c'), { y: 0.008 });
  C.ground(138, 89, 154, z1, granite('#c0bab0'), { y: 0.006 });
  C.ground(x0, JK0, GL0, JK1, TX.cobble('#8e8a88'), { y: 0.007 }); C.ground(GL1, JK0, x1, JK1, TX.cobble('#8e8a88'), { y: 0.007 });
  C.ground(RA0, z0, RA1, JK0, TX.concrete('#9a948a'), { y: 0.007 }); C.ground(RA0, JK1, RA1, 88.5, TX.concrete('#9a948a'), { y: 0.007 });
  C.ground(OL0, z0, OL1, JK0, TX.cobble('#9a948e'), { y: 0.007 });
  // inlaid medallions down Grant Lane (a lucky diamond every 12 m) and at the crossroads
  const medal = ptex('ct_medal', 2, 2, (g, W, H, r, P) => {
    P.fill('#b0604a'); const c = W / 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.abs(x - c + 0.5) + Math.abs(y - c + 0.5); if (d < 30) P.px(x, y, d < 27 ? (d < 22 ? (d < 19 ? '#c8a050' : '#8a2a1a') : '#e8d8b0') : '#6a3a2a'); }
    crisp(P, '福', c, c + 1, 16, '#8a2a1a');
  });
  for (let z = 40; z < 88; z += 12) if (z < JK0 - 2 || z > JK1 + 2) diamondDecal(C, 'ground', medal, (GL0 + GL1) / 2, 0.012, z, 0.94, 0.47);
  diamondDecal(C, 'ground', medal, (GL0 + GL1) / 2, 0.012, (JK0 + JK1) / 2, 1.45, 0.47);

  // ---- WEST ROW A (x 117–128): faces Ross Alley to the east
  house(C, { x: 117, z: 33.5, w: 11, d: 12, floors: 3, wall: TX.brick('#a8523a'), name: 'fortune factory', balc: [2],
    shops: [{ side: 'e', kind: 'bakery', en: 'FORTUNE COOKIES', cjk: '籤餅', bg: '#d8a83a', fg: '#8a1a1a', enCol: '#3a1a10', blade: '籤語餅', bladeBg: '#8a1a1a' }] }, ctx);
  house(C, { x: 117, z: 45.5, w: 11, d: 12.5, floors: 4, wall: TX.plaster('#e6cf8e'), name: 'tailor', balc: [1, 3], rail: '#2e6a4a',
    shops: [{ side: 'e', kind: 'gifts', en: 'GOLDEN NEEDLE TAILOR', cjk: '金針', bg: '#2a4a8a', fg: '#f0d060' }] }, ctx);
  house(C, { x: 117, z: 64, w: 11, d: 11, floors: 3, wall: TX.plaster('#b4d4bc'), name: 'mahjong', balc: [2],
    shops: [{ side: 'e', kind: 'mahjong', en: 'LUCKY TILES', cjk: '麻雀', bg: '#2e6a4a', fg: '#f0d060', blade: '麻雀館', bladeBg: '#2e6a4a' }] }, ctx);
  house(C, { x: 117, z: 75, w: 11, d: 12, floors: 3, wall: TX.plaster('#dc9a82'), name: 'lantern works', balc: [1],
    shops: [{ side: 'e', kind: 'gifts', en: 'PAPER LANTERN WORKS', cjk: '紙燈', bg: '#b8282a' }] }, ctx);
  house(C, { x: 117, z: 88.5, w: 7.5, d: 8.5, floors: 2, wall: TX.plaster('#efe9de'), name: 'noodle', roof: 'hip', rh: 2.4,
    shops: [{ side: 's', kind: 'dumpling', en: 'NOODLE BAR', cjk: '麵', bg: '#2a2a2a', fg: '#f0d060', eave: false, awning: ['#2e6a4a', '#f4ece0'] }] }, ctx);

  // ---- ROW B (x 131–142): Grant Lane's west side, shopfronts facing east
  const B1 = house(C, { x: 131, z: 33.5, w: 11, d: 8.5, floors: 3, wall: TX.plaster('#e8dcc0'), name: 'jade lantern gifts', balc: [1, 2],
    shops: [{ side: 'e', kind: 'gifts', en: 'JADE LANTERN GIFTS', cjk: '玉燈', bg: '#b8282a', blade: '中國禮品' }], roofClutter: false, topEave: false, parapet: 0.01 }, ctx);
  pagodaCorner(C, B1);
  house(C, { x: 131, z: 42, w: 11, d: 8, floors: 3, wall: TX.brick('#c4986a', '#e0d4c0'), name: 'herbalist', balc: [2], rail: '#2e6a4a',
    shops: [{ side: 'e', kind: 'herbs', en: 'HUNDRED HERBS', cjk: '百草堂', bg: '#2a2a2a', fg: '#e8c050', blade: '百草堂', bladeBg: '#2a2a2a' }] }, ctx);
  house(C, { x: 131, z: 50, w: 11, d: 8, floors: 3, wall: TX.plaster('#e6cf8e'), name: 'wong kee', balc: [1],
    shops: [{ side: 'e', kind: 'duck', en: 'WONG KEE KITCHEN', cjk: '王記', bg: '#b8282a', blade: '王記燒臘' }, { side: 's', kind: 'dumpling', en: 'NOODLES · RICE', cjk: '粥麵', bg: '#2e6a4a', eaveCol: '#3f8a5a' }] }, ctx);
  teaHouse(C, ctx);
  house(C, { x: 131, z: 73.5, w: 11, d: 9, floors: 1, fh: 3.7, wall: TX.plaster('#efe9de'), name: 'lucky moon bakery', roof: 'hip', rh: 2.6, tileCol: '#d8a830', hookCol: '#b8282a',
    shops: [{ side: 'e', kind: 'bakery', en: 'LUCKY MOON BAKERY', cjk: '好月', bg: '#d8a83a', fg: '#8a1a1a', enCol: '#5a1010', door: 6.6, blade: '好月餅家', bladeBg: '#b8282a', bladeAt: 0.6 }] }, ctx);
  house(C, { x: 131, z: 82.5, w: 11, d: 5.5, floors: 2, wall: TX.plaster('#dc9a82'), name: 'golden dumpling', garden: true,
    shops: [{ side: 'e', kind: 'dumpling', en: 'GOLDEN DUMPLING', cjk: '餃子', bg: '#2a4a8a', fg: '#f0d060' }] }, ctx);
  house(C, { x: 124.5, z: 88.5, w: 13.5, d: 8.5, floors: 3, wall: TX.brick('#8a3a2a'), name: 'gateway music', balc: [2], rail: '#d8a83a',
    shops: [{ side: 'e', kind: 'music', en: 'MUSIC & GEAR', cjk: '音樂', bg: '#1e1e26', fg: '#f0c040', enCol: '#f8e0a0', door: 4.4, blade: '門音樂' , bladeBg: '#1e1e26' },
      { side: 's', kind: 'music', en: 'GATEWAY MUSIC & GEAR', cjk: '', bg: '#1e1e26', fg: '#f0c040', enCol: '#f8e0a0', door: 9.5 }] }, ctx);

  // ---- EAST OF GRANT, north block
  house(C, { x: 150, z: 33.5, w: 12, d: 11.5, floors: 2, wall: TX.plaster('#efe9de'), name: 'benevolent hall', roof: 'hip', rh: 3.2,
    shops: [{ side: 'w', kind: 'gifts', en: 'BAY BENEVOLENT HALL', cjk: '會館', bg: '#b8282a' }, { side: 'e', kind: 'tea', en: 'ASSOCIATION', cjk: '會館', bg: '#2e6a4a', blade: '灣區會館', bladeBg: '#b8282a' }] }, ctx);
  house(C, { x: 150, z: 45, w: 12, d: 13, floors: 1, fh: 3.8, wall: TX.plaster('#aec4d6'), name: 'phoenix bazaar', roof: 'hip', rh: 2.0, eave: 0.5,
    shops: [{ side: 's', kind: 'gifts', en: 'GOLDEN PHOENIX BAZAAR', cjk: '金鳳', bg: '#b8282a', blade: '金鳳百貨' }, { side: 'w', kind: 'tea', en: 'BAZAAR', cjk: '金鳳', bg: '#b8282a' }] }, ctx);
  house(C, { x: 165, z: 42, w: 13, d: 16, floors: 4, wall: TX.brick('#a8523a'), name: 'produce', balc: [1, 2, 3], rail: '#2e6a4a',
    shops: [{ side: 's', kind: 'misc', en: 'FRESH GARDEN PRODUCE', cjk: '菜', bg: '#2e6a4a', fg: '#f0e0a0', eave: false, awning: ['#2e8a4a', '#f4ece0'] }, { side: 'w', kind: 'misc', en: 'PRODUCE', cjk: '菜', bg: '#2e6a4a' }] }, ctx);
  house(C, { x: 165, z: 33.5, w: 13, d: 8.5, floors: 2, wall: TX.plaster('#e8dcc0'), name: 'lane house', roof: 'hip', rh: 2.6,
    shops: [{ side: 'w', kind: 'tea', en: 'OLD LANE TEA', cjk: '茶', bg: '#2a2a2a' }] }, ctx);
  dojo(C, ctx);
  house(C, { x: 207, z: 44, w: 11.5, d: 14, floors: 3, wall: TX.plaster('#e6cf8e'), name: 'dragon pearl tea', balc: [1, 2], rail: '#2e6a4a', roof: 'hip', rh: 3.4,
    shops: [{ side: 's', kind: 'tea', en: 'DRAGON PEARL TEA', cjk: '龍珠', bg: '#2e6a4a', fg: '#f0d060', blade: '龍珠茶莊', bladeBg: '#2e6a4a' }] }, ctx);
  house(C, { x: 218.5, z: 40, w: 11, d: 18, floors: 4, wall: TX.plaster('#dc9a82'), name: 'silk road', balc: [2, 3],
    shops: [{ side: 's', kind: 'gifts', en: 'SILK ROAD FABRICS', cjk: '綢', bg: '#8a2a6a', fg: '#f0d060' }, { side: 'w', kind: 'gifts', en: 'FABRICS', cjk: '綢', bg: '#8a2a6a' }] }, ctx);
  house(C, { x: 207, z: 33.5, w: 11.5, d: 10.5, floors: 2, wall: TX.brick('#c4986a', '#e0d4c0'), name: 'warehouse', garden: true, shops: [] }, ctx);

  // ---- EAST OF GRANT, south block (beside the Square)
  house(C, { x: 150, z: 64.5, w: 14, d: 10.5, floors: 1, fh: 3.8, wall: TX.plaster('#b4d4bc'), name: 'silk and paper', roof: 'hip', rh: 2.0, eave: 0.5,
    shops: [{ side: 'e', kind: 'gifts', en: 'SILK & PAPER', cjk: '紙', bg: '#2a4a8a', fg: '#f0d060' }, { side: 'w', kind: 'herbs', en: 'JADE PHARMACY', cjk: '藥行', bg: '#2e6a4a', blade: '玉藥行', bladeBg: '#2e6a4a' }] }, ctx);
  house(C, { x: 150, z: 75, w: 14, d: 11, floors: 1, fh: 3.8, wall: TX.brick('#a8523a'), name: 'moonrise', roof: 'hip', rh: 2.0, eave: 0.5, tileCol: '#2e7a6a',
    shops: [{ side: 'e', kind: 'dumpling', en: 'MOONRISE NOODLES', cjk: '月麵', bg: '#b8282a' }, { side: 'w', kind: 'duck', en: 'BBQ HOUSE', cjk: '燒臘', bg: '#b8282a', blade: '燒臘', bladeBg: '#b8282a' }] }, ctx);
  house(C, { x: 154, z: 87, w: 11, d: 10, floors: 2, wall: TX.plaster('#efe9de'), name: 'lucky cat', roof: 'hip', rh: 3.0, tileCol: '#d8a830', hookCol: '#b8282a',
    shops: [{ side: 's', kind: 'gifts', en: 'LUCKY CAT SOUVENIRS', cjk: '招財', bg: '#b8282a', blade: '招財貓' }, { side: 'w', kind: 'gifts', en: 'SOUVENIRS', cjk: '禮品', bg: '#b8282a' }] }, ctx);
  theater(C, ctx);

  gate(C, ctx);
  square(C, ctx);
  tramStop(C, ctx);
  streetLife(C, ctx);

  // ---- zones (the dojo and the tea house set their own, inside this one)
  C.zone('Chinatown', x0, z0, x1, z1, { label: 'Chinatown', sub: 'San Francisco', music: 'senbazuru', bed: 'street' });
  C.zone('Golden Claw Dojo', 181, 35, 203, 48, { label: 'Golden Claw Dojo', sub: 'Chinatown', music: 'senbazuru', bed: null, step: 'step_wood' });
  C.zone('Jade Kettle Tea House', 131, 64.5, 142, 73.5, { label: 'Jade Kettle Tea House', sub: 'Chinatown', music: 'senbazuru', bed: null, step: 'step_wood' });
}

// ---------------------------------------------------------------- the corner pagoda tower (Grant & Bay)
function pagodaCorner(C, B) {
  B.o.roof.type = 'hip'; B.H += 3;
  const gk = `b${B.id}:roof`, H = B.floors * B.fh, x0 = B.x + B.w - 5, z0 = B.z, x1 = B.x + B.w, z1 = B.z + 5;
  const wall = TX.plaster('#e8dcc0'), tc = '#3f8a5a';
  hipRoof(C, gk, { x0: B.x, z0: B.z, x1: B.x + B.w, z1: B.z + B.d, y: H + 0.05, e: 0.6, skirt: true, inset: 1.6, drop: 0.7, tex: tiles(tc), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.5 });
  C.box(gk, TX.plaster('#d8ccb0'), B.x + 1.4, H, B.z + 1.4, B.x + B.w - 1.4, H + 0.75, B.z + B.d - 1.4);
  C.box(gk, wall, x0 + 0.5, H + 0.7, z0 + 0.5, x1 - 0.5, H + 3.0, z1 - 0.5);
  for (const [x, z, f] of [[(x0 + x1) / 2, z1 - 0.5, 's'], [x1 - 0.5, (z0 + z1) / 2, 'e']]) C.decal(gk, ctWin('#b8282a', '#4a6a8a', false, true), x, H + 1.1, z, f, 1.1, 1.5, { off: 0.02 });
  hipRoof(C, gk, { x0: x0 + 0.5, z0: z0 + 0.5, x1: x1 - 0.5, z1: z1 - 0.5, y: H + 3.0, e: 0.75, skirt: true, inset: 1.1, drop: 0.55, tex: tiles(tc), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.55 });
  C.box(gk, wall, x0 + 1.4, H + 3.5, z0 + 1.4, x1 - 1.4, H + 5.0, z1 - 1.4);
  hipRoof(C, gk, { x0: x0 + 1.4, z0: z0 + 1.4, x1: x1 - 1.4, z1: z1 - 1.4, y: H + 5.0, e: 0.75, rh: 1.6, tex: tiles(tc), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.5 });
}

// ---------------------------------------------------------------- the Dragon Gate (paifang) at Market Street
function gate(C, ctx) {
  const zc = 95, xc = 146, L = landmark(C, 138.5, 94, 15, 2, 9.6, { name: 'dragon gate' }), gk = L.gk(0, 'front'), rg = `b${L.id}:roof`;
  const paint = beamPaint(), red = lacquer('#b8282a'), gold = TX.solid('#d8a83a'), brk = brackets(), tc = '#3f8a5a';
  for (const x of [142.4, 149.6]) column(C, gk, x, zc, 0, 7.0, 0.3);
  for (const x of [139.8, 152.2]) column(C, gk, x, zc, 0, 5.0, 0.24);
  for (const x of [142.4, 149.6, 139.8, 152.2]) { C.box(gk, granite('#a8a49c'), x - 0.45, 0, zc - 0.7, x + 0.45, 0.5, zc + 0.7); C.box(gk, TX.solid('#9a968e'), x - 0.35, 0.5, zc - 0.5, x + 0.35, 0.8, zc + 0.5); C.nav.block(x - 0.45, zc - 0.7, x + 0.45, zc + 0.7); }
  // the main span
  C.box(gk, paint, 141.9, 5.35, zc - 0.25, 150.1, 5.85, zc + 0.25, { u0: 0, v0: 0, top: red });
  const plaque = ptex('ct_gateplaque', 3.2, 1.05, (g, W, H, r, P) => {
    P.fill('#d8a83a'); P.rect(2, 2, W - 4, H - 4, '#1e3a6a'); P.rect(3, 3, W - 6, 1, '#3a5a9a');
    for (let x = 4; x < W - 4; x += 6) { P.px(x, 2, '#f8e8a0'); P.px(x + 3, H - 3, '#a87a28'); }
    crisp(P, '中華街', W / 2, H / 2 + 1, 24, '#f0c850', { shadow: '#0a1a3a' });
  });
  C.box(gk, gold, 144.3, 5.85, zc - 0.12, 147.7, 7.0, zc + 0.12);
  C.decal(gk, plaque, xc, 5.9, zc + 0.12, 's', 3.2, 1.05, { off: 0.01 }); C.decal(gk, plaque, xc, 5.9, zc - 0.12, 'n', 3.2, 1.05, { off: 0.01 });
  C.box(gk, red, 141.9, 7.0, zc - 0.28, 150.1, 7.35, zc + 0.28);
  C.box(gk, brk, 141.7, 7.35, zc - 0.32, 150.3, 7.85, zc + 0.32, { u0: 0, v0: 0, top: red });
  L.H = 9.4;
  hipRoof(C, rg, { x0: 141.5, z0: zc - 0.45, x1: 150.5, z1: zc + 0.45, y: 7.85, e: 0.95, rh: 1.35, tex: tiles(tc), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.6 });
  // the side spans: smaller roofs and two-character plaques
  for (const [a, b, txt] of [[139.4, 142.4, '四海'], [149.6, 152.6, '一家']]) {
    C.box(gk, paint, a, 3.7, zc - 0.2, b, 4.15, zc + 0.2, { u0: 0, v0: 0, top: red });
    const pq = ptex('ct_sideplaque' + txt, 1.6, 0.6, (g, W, H, r, P) => { P.fill('#d8a83a'); P.rect(2, 2, W - 4, H - 4, '#b8282a'); crisp(P, txt, W / 2, H / 2 + 1, 16, '#f8e090', { shadow: '#5a1010' }); });
    C.box(gk, gold, (a + b) / 2 - 0.8, 4.15, zc - 0.1, (a + b) / 2 + 0.8, 4.75, zc + 0.1); C.decal(gk, pq, (a + b) / 2, 4.15, zc + 0.1, 's', 1.6, 0.6, { off: 0.01 }); C.decal(gk, pq, (a + b) / 2, 4.15, zc - 0.1, 'n', 1.6, 0.6, { off: 0.01 });
    C.box(gk, red, a, 4.75, zc - 0.24, b, 5.0, zc + 0.24); C.box(gk, brk, a - 0.1, 5.0, zc - 0.26, b + 0.1, 5.35, zc + 0.26, { u0: 0, v0: 0, top: red });
    hipRoof(C, rg, { x0: a, z0: zc - 0.35, x1: b, z1: zc + 0.35, y: 5.35, e: 0.75, rh: 0.95, tex: tiles(tc), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.5 });
  }
  C.props.push({ kind: 'ct_lanternBig', x: xc, y: 3.85, z: zc, yaw: 0 });
  C.prop('ct_lion', 143.4, 96.6); C.prop('ct_lion', 148.6, 96.6);
  C.interact({ x: xc, z: 96.4, r: 2.4, label: 'Read the gate', icon: 'eye', act: async (app) => {
    await app.say('', 'The Dragon Gate. Green tiles, red pillars, and three gold characters: 中華街 — "Chinatown".', 'The side plaques read 四海一家: "within the four seas, all one family."');
  } });
  C.spot('gate', xc, 97.4, Math.PI);
}

// ---------------------------------------------------------------- Jade Kettle Tea House (enterable, 2 storeys)
function teaHouse(C, ctx) {
  const x = 131, z = 64.5, w = 11, d = 9;
  const B = C.building({ x, z, w, d, floors: 2, enter: true, name: 'jade kettle tea house', step: 'step_wood', mm: '#e8b878',
    wall: TX.plaster('#2e5a44'), trim: '#d8a83a', base: '#3a2a22', inner: TX.wallpaper('#e8d8b8', '#c8a878'), floorTexs: [TX.planks('#7a4a2a'), TX.planks('#8a5a32')],
    roof: { type: 'flat', parapet: 0.01 }, windows: { every: 2.2, tex: ctWin('#d8a83a', '#4a6a8a', ctx.night), skip: ['e', 's'] },
    door: { side: 'e', at: 0.5, w: 1.2, tex: redDoor('#b8282a', 1.2) },
    interior(C, B) {
      const g0 = B.gk(0, 'in'), g1 = B.gk(1, 'in'), wood = TX.planks('#6a3a1e'), top = TX.planks('#8a5a32');
      // counter along the north wall with tea tins on shelves behind
      C.furniture(B, 0, 133.2, 65.4, 138.6, 66.2, 1.0, TX.solid('#5a2a1a'), { top: TX.planks('#a87a48'), s: shopWin('tea', 2.7, 1.0, false, '#5a2a1a') });
      C.decal(g0, shopWin('tea', 4, 1.6, false, '#4a2a1a'), 135.9, 1.1, 64.72, 's', 4, 1.6, { off: 0.01 });
      C.decal(g0, board('teamenu', ['TEA MENU', 'JASMINE   $3', 'OOLONG    $4', 'PU-ERH    $5', 'CHRYSANTH $3'], 1.4, 1.2, { bg: '#1e2a22', fg: '#f0e0b0' }), 139.8, 1.4, 64.72, 's', 1.4, 1.2, { off: 0.01 });
      C.props.push({ kind: 'ct_altarCandle', x: 134.0, y: 1.0, z: 65.8, yaw: 0 });
      // tables with stools, a scroll and a moon-shaped screen
      for (const [tx, tz] of [[135.6, 68.4], [139.2, 68.4], [135.6, 71.9], [139.2, 71.9]]) {
        C.furniture(B, 0, tx - 0.45, tz - 0.45, tx + 0.45, tz + 0.45, 0.74, wood, { top: top });
        C.box(g0, TX.solid('#f0ece4'), tx - 0.1, 0.74, tz - 0.1, tx + 0.1, 0.9, tz + 0.1); C.box(g0, TX.solid('#2e6a4a'), tx + 0.15, 0.74, tz - 0.05, tx + 0.25, 0.8, tz + 0.05);
        for (const [dx, dz] of [[-0.75, 0], [0.75, 0]]) C.prop('ct_stool', tx + dx, tz + dz);
      }
      C.decal(g0, scroll('mount'), 131.32, 0.9, 70.6, 'e', 0.7, 1.8, { off: 0.01 });
      // stairs up along the west wall; the upper tea room
      C.stairs(B, 0, 131.3, 67.6, 132.5, 72.4, 'n', { tex: TX.planks('#8a5a32') });
      for (const [tx, tz] of [[136.5, 67.2], [139.5, 67.2], [137.5, 71.4]]) {
        C.furniture(B, 1, tx - 0.6, tz - 0.4, tx + 0.6, tz + 0.4, 0.4, wood, { top: top });
        C.box(g1, TX.solid('#c8282a'), tx - 0.95, 3, tz - 0.25, tx - 0.65, 3.12, tz + 0.25); C.box(g1, TX.solid('#c8282a'), tx + 0.65, 3, tz - 0.25, tx + 0.95, 3.12, tz + 0.25);
        C.box(g1, TX.solid('#f0ece4'), tx - 0.1, 3.4, tz - 0.1, tx + 0.1, 3.55, tz + 0.1);
      }
      C.decal(g1, scroll('bamboo'), 134.5, 3.7, 64.72, 's', 0.7, 1.8, { off: 0.01 }); C.decal(g1, scroll('text', '茶禪一味'), 136.0, 3.7, 64.72, 's', 0.7, 1.8, { off: 0.01 });
      C.decal(g1, scroll('mount'), 131.32, 3.7, 66.5, 'e', 0.7, 1.8, { off: 0.01 });
      C.prop('ct_pot', 141.2, 65.4, { L: 1, y: 3 }); C.prop('ct_bamboo', 133.0, 65.3, { L: 1, y: 3 });
      C.interact({ x: 135.9, z: 66.9, label: 'Order tea', icon: 'bowl', act: async (app) => {
        const i = await app.choose('What will it be?', ['Jasmine', 'Oolong', 'Pu-erh', 'Just looking']);
        const T = ['Jasmine. Light as a spring morning — the steam smells like a garden.', 'Oolong, roasted dark. The host pours it from high up without spilling a drop.', 'Pu-erh, earthy and deep. "Aged twelve years," the host says proudly.'];
        if (i >= 0 && i < 3) { await app.say('Host', T[i]); app.toast('Warm tea — you feel refreshed', { icon: 'heart' }); app.audio && app.audio.sfx && app.audio.sfx('bubble'); }
        else await app.say('Host', 'Take your time. Tea is never in a hurry.');
      } });
      C.interact({ x: 137.5, z: 70.2, L: 1, label: 'Look out the window', act: async (app) => app.say('', 'From up here you can see the lantern strings sway over Grant Lane, and the green roofs of the Square beyond.') });
      C.npc({ id: 'ctTeaHost', who: 'passerby203', x: 135.9, z: 65.0, yaw: 0, name: 'Tea Host', lines: [['Welcome to the Jade Kettle. Sit anywhere — the upstairs room is quieter.'], ['Master Lau takes his oolong at four o\'clock sharp. Every day for forty years.'], ['Pour for others before yourself. That\'s the first rule of tea.']] });
      C.npc({ id: 'ctTeaElder', who: 'passerby118', x: 139.5, z: 66.4, yaw: 0, L: 1, clip: 'sit', name: 'Old Mrs. Fong', lines: async (app, n) => {
        await app.say('Old Mrs. Fong', 'When I was a girl, Tokonmon used to nest in the lantern strings. Little sparks of light, all along Grant Lane.', 'Now they just steal dumplings. Hmph.');
        const a = app.world.actor(n.id); setTimeout(() => a && a.play('sit', { fade: 0.2 }), 40);
      } });
    } });
  // street face: a lantern-hung pent eave, a sign board, a blade sign and green lattice
  const gk = B.gk(0, 'front');
  const sg = autoSign('JADE KETTLE TEA', '茶館', '#d8a83a', '#8a1a1a', { enCol: '#3a1a10' });
  C.box(B.gk(1, 'front'), TX.solid('#3a2420'), 142.82, 3.14, 65.6, 142.98, 3.96, 72.4); C.decal(B.gk(1, 'front'), sg.tex, 142.99, 3.18, 69, 'e', Math.min(6.6, sg.w), 0.74, { off: 0.005 });
  for (const zz of [65.4, 72.6]) C.decal(gk, ctWin('#d8a83a', '#4a6a8a', ctx.night, true), 142, 0.7, zz, 'e', 0.9, 1.5, { off: 0.03 });
  for (const zz of [66.2, 69, 71.8]) C.decal(B.gk(1, 'front'), ctWin('#d8a83a', '#4a6a8a', ctx.night, zz === 69), 142, 3.7, zz, 'e', 1.0, 1.5, { off: 0.03 });
  B.o.roof.type = 'hip'; B.H = 7.8;
  hipRoof(C, `b${B.id}:roof`, { x0: x, z0: z, x1: x + w, z1: z + d, y: 6.0, e: 0.6, rh: 2.6, tex: tiles('#3f8a5a'), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.5 });
  balcony(C, B.gk(1, 'front'), 'e', [142, 65.2], [142, 72.8], 3.1, 0.85, { railCol: '#d8a83a', railBg: '#2e4a3a' });
  bladeSign(C, B.gk(1, 'front'), 'e', 142, 73.0, 3.6, signV('茶館', '#2e6a4a', '#f0d060', 0.7, 1.6), 0.7, 1.6);
  for (let i = 0; i < 4; i++) C.props.push({ kind: 'lantern', x: 142.6, y: 2.2, z: 65.8 + i * 2.45, yaw: 0, s: 0.72 });
}

// ---------------------------------------------------------------- Golden Claw Dojo: walled courtyard + training hall
function dojo(C, ctx) {
  const wall = TX.plaster('#ece4d4'), tc = '#3f8a5a';
  // the compound wall with a tiled coping, and the gate
  const run = (ax, az, bx, bz) => {
    const x0 = Math.min(ax, bx) - 0.2, x1 = Math.max(ax, bx) + 0.2, z0 = Math.min(az, bz) - 0.2, z1 = Math.max(az, bz) + 0.2, gk = 'ct_dojowall';
    C.box(gk, wall, x0, 0, z0, x1, 2.4, z1); C.box(gk, TX.solid('#6a6460'), x0 - 0.02, 0, z0 - 0.02, x1 + 0.02, 0.4, z1 + 0.02);
    const T = tiles(tc), yc = 2.85, along = x1 - x0 > z1 - z0;
    if (along) { for (const s of [-1, 1]) { const zf = s > 0 ? z1 + 0.35 : z0 - 0.35, zm = (z0 + z1) / 2; quad4(C, gk, T, [x0 - 0.2, 2.4, zf], [x1 + 0.2, 2.4, zf], [x1 + 0.2, yc, zm], [x0 - 0.2, yc, zm], [x0, 0], [x1, 0], [x1, 0.8], [x0, 0.8], { up: true }); } beam(C, gk, TX.solid('#2e6a44'), [x0 - 0.2, yc + 0.05, (z0 + z1) / 2], [x1 + 0.2, yc + 0.05, (z0 + z1) / 2], 0.2, 0.18); }
    else { for (const s of [-1, 1]) { const xf = s > 0 ? x1 + 0.35 : x0 - 0.35, xm = (x0 + x1) / 2; quad4(C, gk, T, [xf, 2.4, z0 - 0.2], [xf, 2.4, z1 + 0.2], [xm, yc, z1 + 0.2], [xm, yc, z0 - 0.2], [z0, 0], [z1, 0], [z1, 0.8], [z0, 0.8], { up: true }); } beam(C, gk, TX.solid('#2e6a44'), [(x0 + x1) / 2, yc + 0.05, z0 - 0.2], [(x0 + x1) / 2, yc + 0.05, z1 + 0.2], 0.2, 0.18); }
    C.nav.block(x0, z0, x1, z1);
  };
  C.ground(178.4, 33.8, 205.6, 57.1, granite('#b8b2a6'), { y: 0.008 });
  run(178.2, 33.6, 178.2, 57.3); run(205.8, 33.6, 205.8, 57.3); run(178.4, 57.3, 188.6, 57.3); run(195.4, 57.3, 205.6, 57.3); run(178.4, 33.6, 205.6, 33.6);
  for (let x = 179; x < 205; x += 2.2) C.ground(x, 49.2, x + 1.0, 49.5, TX.solid('#8a8478'), { y: 0.011 });
  // gate: red pillars, a painted lintel, a sign, a little tiled roof
  const G = landmark(C, 188, 56.6, 8, 1.4, 5.2, { name: 'dojo gate' }), gg = G.gk(0, 'front');
  for (const x of [188.7, 195.3]) column(C, gg, x, 57.3, 0, 3.6, 0.26);
  C.box(gg, beamPaint(), 188.2, 3.1, 57.05, 195.8, 3.55, 57.55, { u0: 0, v0: 0, top: lacquer() });
  C.box(gg, brackets(), 188.1, 3.55, 57.0, 195.9, 4.0, 57.6, { u0: 0, v0: 0, top: lacquer() }); C.box(gg, lacquer(), 188.0, 4.0, 56.95, 196.0, 4.4, 57.65);
  const sgn = ptex('ct_dojosign', 3.0, 0.8, (g, W, H, r, P) => { P.fill('#1a1a1e'); P.rect(1, 1, W - 2, H - 2, '#d8a83a'); P.rect(2, 2, W - 4, H - 4, '#1a1a1e'); crisp(P, '金爪武館', W / 2, H / 2 - 3, 16, '#f0c850'); crisp(P, 'GOLDEN CLAW DOJO', W / 2, H - 6, 8, '#e8e0d0'); });
  C.box(gg, TX.solid('#d8a83a'), 190.5, 2.26, 57.2, 193.5, 3.1, 57.4); C.decal(gg, sgn, 192, 2.28, 57.4, 's', 3.0, 0.8, { off: 0.01 }); C.decal(gg, sgn, 192, 2.28, 57.2, 'n', 3.0, 0.8, { off: 0.01 });
  hipRoof(C, `b${G.id}:roof`, { x0: 188.3, z0: 56.95, x1: 195.7, z1: 57.65, y: 4.4, e: 0.75, rh: 1.0, tex: tiles(tc), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.5 });
  C.prop('ct_lion', 187.4, 58.9); C.prop('ct_lion', 196.6, 58.9);
  // the training yard: plum-blossom poles, dummies, the incense burner, banners
  const pole = TX.solid('#7a4a2a'), ptop = TX.solid('#a8743e');
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const px = 199.5 + i * 1.6, pz = 50.6 + j * 1.6, h = 0.6 + ((i * 5 + j * 3) % 4) * 0.25; C.box('ct_yard', pole, px - 0.12, 0, pz - 0.12, px + 0.12, h, pz + 0.12, { top: ptop }); C.nav.block(px - 0.14, pz - 0.14, px + 0.14, pz + 0.14); }
  C.prop('ct_dummy', 182.5, 51.2); C.prop('ct_dummy', 184.6, 54.2); C.prop('ct_burner', 192, 52.4);
  C.prop('ct_pot', 188.2, 49.0); C.prop('ct_pot', 195.8, 49.0); C.prop('ct_bamboo', 179.4, 56.2); C.prop('ct_bamboo', 204.6, 56.2);
  for (const [bx, txt] of [[180.6, '金爪'], [203.4, '武德']]) {
    C.box('ct_yard', TX.solid('#3a2a22'), bx - 0.07, 0, 49.93, bx + 0.07, 5.2, 50.07); C.nav.block(bx - 0.15, 49.85, bx + 0.15, 50.15);
    const t = signV(txt, '#b8282a', '#f0d060', 0.7, 2.0); C.box('ct_yard', TX.solid('#d8a83a'), bx + 0.07, 2.9, 49.97, bx + 0.8, 4.95, 50.03); C.decal('ct_yard', t, bx + 0.44, 2.92, 50.03, 's', 0.7, 2.0, { off: 0.005 }); C.decal('ct_yard', t, bx + 0.44, 2.92, 49.97, 'n', 0.7, 2.0, { off: 0.005 });
  }
  // the hall
  const x = 181, z = 35, w = 22, d = 13;
  const B = C.building({ x, z, w, d, floors: 1, enter: true, name: 'golden claw dojo', step: 'step_wood', mm: '#e8b878',
    wall: timberWall(), trim: '#4a3020', base: '#5a5652', inner: timberWall('#f0e8d8', '#5a3a24'), floorTex: TX.planks('#6a4428'),
    roof: { type: 'flat', parapet: 0.01 }, windows: { every: 2.6, tex: ctWin('#4a3020', '#4a6a8a', ctx.night), h: 1.3 },
    door: { side: 's', at: 0.5, w: 1.8, tex: redDoor('#b8282a', 1.8) },
    interior(C, B) {
      const g = B.gk(0, 'in');
      // tatami training floor
      C.quad(g, tatami(), [184.6, 0.035, 46.2], [199.4, 0.035, 46.2], [199.4, 0.035, 38.4], [184.6, 0.035, 38.4], { u0: 0, v0: 0 });
      C.box(g, TX.solid('#2a2a24'), 184.5, 0.0, 38.3, 199.5, 0.03, 46.3);
      // the shrine: altar, candles, burner, plaque, scrolls
      C.furniture(B, 0, 189.4, 35.25, 194.6, 36.2, 1.0, lacquer('#8a1a1a'), { top: TX.planks('#4a2a1a'), s: ptex('ct_altar', 5.2, 1.0, (g2, W, H, r, P) => { P.fill('#8a1a1a'); P.rect(2, 2, W - 4, H - 4, '#a82a24'); for (let x2 = 6; x2 < W - 6; x2 += 12) { P.rect(x2, 6, 8, H - 12, '#d8a83a'); P.rect(x2 + 2, 8, 4, H - 16, '#8a1a1a'); } P.rect(0, H - 3, W, 3, '#3a1a10'); }) });
      for (const cx of [190.0, 194.0]) C.props.push({ kind: 'ct_altarCandle', x: cx, y: 1.0, z: 35.7, yaw: 0 });
      C.props.push({ kind: 'ct_burner', x: 192, y: 1.0, z: 35.7, yaw: 0, s: 0.45 });
      const plaque = ptex('ct_shrineplaque', 2.4, 0.8, (g2, W, H, r, P) => { P.fill('#d8a83a'); P.rect(2, 2, W - 4, H - 4, '#1a1a1e'); crisp(P, '金爪', W / 2, H / 2 + 1, 16, '#f0c850'); });
      C.decal(g, plaque, 192, 2.0, 35.22, 's', 2.4, 0.8, { off: 0.01 });
      C.decal(g, scroll('text', '武德'), 188.6, 0.9, 35.22, 's', 0.7, 1.8, { off: 0.01 }); C.decal(g, scroll('text', '忍耐'), 195.4, 0.9, 35.22, 's', 0.7, 1.8, { off: 0.01 });
      C.decal(g, scroll('mount'), 181.22, 0.9, 41.5, 'e', 0.7, 1.8, { off: 0.01 }); C.decal(g, scroll('bamboo'), 181.22, 0.9, 46.4, 'e', 0.7, 1.8, { off: 0.01 });
      for (const zz of [38.6, 43.4]) C.decal(g, ptex('ct_banner' + zz, 0.8, 2.4, (g2, W, H, r, P) => { P.fill('#b8282a'); P.rect(0, 0, W, 3, '#d8a83a'); for (let x2 = 0; x2 < W; x2 += 4) P.rect(x2, H - 4, 2, 4, '#d8a83a'); crisp(P, zz < 40 ? '金爪' : '武館', W / 2, H / 2, 16, '#f0d060', { vertical: true, gap: 6 }); }), 181.22, 0.5, zz, 'e', 0.8, 2.4, { off: 0.012 });
      // racks, dummies, drum, the lion-dance head
      C.prop('ct_rack', 181.75, 39.2, { yaw: Math.PI / 2 }); C.prop('ct_rack', 181.75, 44.6, { yaw: Math.PI / 2 });
      for (const zz of [38.8, 42.2, 45.6]) C.prop('ct_dummy', 201.0, zz);
      C.prop('ct_drum', 183.2, 36.6); C.prop('ct_lionHead', 201.6, 36.4, { yaw: -Math.PI / 4 });
      C.furniture(B, 0, 196.2, 35.25, 199.6, 35.75, 1.6, TX.planks('#5a3a22'), { s: shopWin('tea', 3.4, 1.6, false, '#3a2418') });
      C.prop('ct_pot', 186.6, 35.8);
      C.interact({ x: 192, z: 36.9, label: 'Pray at the shrine', icon: 'star', act: async (app) => {
        app.audio && app.audio.sfx && app.audio.sfx('gong');
        const B2 = ['A thin curl of incense rises. You feel steady, like a root in the ground.', 'The candle flames lean toward you for a moment. Good luck, maybe.', 'You bow three times. Somewhere behind you, Master Lau nods.'];
        await app.say('', B2[Math.floor(Math.random() * B2.length)]);
        app.toast(['Blessing: calm focus', 'Blessing: lucky wind', 'Blessing: strong roots'][Math.floor(Math.random() * 3)], { icon: 'star' });
      } });
      C.interact({ x: 199.8, z: 44.0, label: 'Strike the dummy', icon: 'fist', act: async (app) => {
        const au = app.audio; for (let i = 0; i < 3; i++) { au && au.sfx && au.sfx('hit_light'); await new Promise((r) => setTimeout(r, 180)); }
        await app.say('', ['Tok-tok-tok! The wooden arms rattle back at you.', 'Your knuckles sting. The dummy, as ever, is unimpressed.', 'Left, right, palm. The rhythm almost feels like music.'][Math.floor(Math.random() * 3)]);
      } });
      C.interact({ x: 182.6, z: 41.9, label: 'Examine weapon racks', act: async (app) => app.say('', 'Staffs, a pair of butterfly swords, a spear with a red tassel. All polished, none sharpened.', 'A card on the rack: "Tools teach the hand. The heart must teach itself."') });
      C.interact({ x: 184.0, z: 37.6, label: 'Beat the drum', icon: 'music', act: async (app) => { app.audio && app.audio.sfx && app.audio.sfx('thud'); await app.say('', 'BOOM. The whole hall hums. A student in the corner jumps out of her stance.'); } });
      C.npc({ id: 'lau', who: 'lau', x: 189.6, z: 38.4, yaw: 0.5, name: 'Master Lau', lines: [
        ['Hm. You walk like someone who has somewhere to be.', 'Sit. Breathe. A Tokonmon reads your heart before it hears your words.'],
        ['The Golden Claw does not teach fighting. It teaches stillness.', 'Fighting is just what happens when stillness gets impatient.'],
        ['Tea at four. If you are late, the tea is cold and so is my mood.'],
      ] });
      C.npc({ id: 'ctStudent', who: 'passerby77', x: 198.6, z: 38.8, yaw: Math.PI / 2, name: 'Student Mei', clip: 'flex', lines: [['Three hundred strikes before lunch! Only two hundred and ninety to go...'], ['Master Lau says my stance is "like a chair with three legs." I think that\'s a compliment?']] });
    } });
  B.o.roof.type = 'hip'; B.H = 7.5;
  hipRoof(C, `b${B.id}:roof`, { x0: x, z0: z, x1: x + w, z1: z + d, y: 3.0, e: 1.2, skirt: true, inset: 2.2, drop: 1.0, tex: tiles(tc), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.6 });
  C.box(`b${B.id}:roof`, timberWall(), x + 1.2, 3.6, z + 1.2, x + w - 1.2, 4.6, z + d - 1.2);
  C.box(`b${B.id}:roof`, brackets(), x + 1.1, 4.6, z + 1.1, x + w - 1.1, 5.0, z + d - 1.1, { u0: 0, v0: 0 });
  hipRoof(C, `b${B.id}:roof`, { x0: x + 1.2, z0: z + 1.2, x1: x + w - 1.2, z1: z + d - 1.2, y: 5.0, e: 1.1, rh: 3.6, tex: tiles(tc), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.7 });
  // the porch: two pillars and a sign over the door
  const fg = B.gk(0, 'front');
  for (const px of [189.6, 194.4]) column(C, fg, px, 49.2, 0, 3.0, 0.2);
  C.box(fg, beamPaint(), 189.2, 2.55, 48.0, 194.8, 3.0, 49.5, { u0: 0, v0: 0 });
  const dsign = ptex('ct_dojodoor', 2.4, 0.7, (g, W, H, r, P) => { P.fill('#d8a83a'); P.rect(2, 2, W - 4, H - 4, '#b8282a'); crisp(P, '金爪武館', W / 2, H / 2 + 1, 16, '#f8e090', { shadow: '#5a1010' }); });
  C.decal(fg, dsign, 192, 3.05, 48.0, 's', 2.4, 0.7, { off: 0.03 });
  for (const lx of [190.4, 193.6]) C.props.push({ kind: 'ct_lanternBig', x: lx, y: 1.0, z: 49.0, yaw: 0 });
  C.interact({ x: 186.0, z: 52.3, label: 'Read the notice board', act: async (app) => app.say('', 'GOLDEN CLAW DOJO — CLASSES', 'Dawn: stance & breath. Noon: Tokonmon partnership drills. Dusk: lion dance practice (bring your own drum).', 'Beginners welcome. Shoes off. Pride at the door.') });
  C.box('ct_yard', TX.solid('#5a3a22'), 185.2, 0, 51.3, 186.8, 1.9, 51.45); C.decal('ct_yard', board('dojonotice', ['CLASSES', 'DAWN  stance', 'NOON  partners', 'DUSK  lion dance', '', 'beginners', 'welcome'], 1.4, 1.1, { bg: '#ece0c4', fg: '#3a2a22', frame: '#7a4a2a' }), 186.0, 0.75, 51.45, 's', 1.4, 1.1, { off: 0.01 });
  C.nav.block(185.2, 51.25, 186.8, 51.5);
  C.spot('dojoDoor', 192, 50.4, Math.PI); C.spot('dojoInside', 192, 43.5, Math.PI);
}

// ---------------------------------------------------------------- Golden Phoenix Opera house (facing the garden / Market)
function theater(C, ctx) {
  const B = house(C, { x: 208, z: 66, w: 21, d: 18, floors: 2, fh: 4.2, wall: TX.brick('#8a3a2a'), name: 'opera house', balc: [], roof: 'hip', rh: 4.2, tileCol: '#d8a830', hookCol: '#b8282a',
    shops: [{ side: 's', kind: 'gifts', en: 'GOLDEN PHOENIX OPERA', cjk: '粵劇', bg: '#1e1e26', fg: '#f0c040', enCol: '#f8e0a0', door: 10.5, dw: 2.0, doorTex: redDoor('#b8282a', 2.0), eave: true, eaveCol: '#d8a830' }] }, ctx);
  // a big poster (a phoenix rising from flames — no people) and a marquee
  const poster = ptex('ct_opera', 3.0, 3.6, (g, W, H, r, P) => {
    P.fill('#1a1020'); P.rect(2, 2, W - 4, H - 4, '#3a1020');
    for (let y = 0; y < H; y++) P.dither(3, y, W - 6, 1, '#8a1a1a', Math.max(0, (y - H * 0.45) / H));
    const cx = W / 2, cy = H * 0.45;
    for (let i = 0; i < 40; i++) { const a = -Math.PI * (0.1 + 0.8 * (i / 40)), L2 = 18 + (i % 5) * 4; for (let k = 6; k < L2; k++) P.px(cx + Math.cos(a) * k * (i < 20 ? 1 : 1), cy + Math.sin(a) * k * 0.7 - k * 0.2, k < L2 * 0.5 ? '#f0c040' : k < L2 * 0.8 ? '#e8602a' : '#c8282a'); }
    for (let i = 0; i < 30; i++) { const a = Math.PI * (1.1 + 0.8 * (i / 30)); for (let k = 6; k < 20; k++) P.px(cx + Math.cos(a) * k, cy - Math.sin(a) * k * 0.7 - k * 0.2, k < 12 ? '#f0c040' : '#e8602a'); }
    P.rect(cx - 3, cy - 4, 6, 14, '#f0c040'); P.rect(cx - 2, cy - 10, 4, 6, '#f8e070'); P.px(cx, cy - 8, '#1a1020'); P.rect(cx - 1, cy - 12, 2, 2, '#e8602a');
    for (let x = 6; x < W - 6; x += 3) { const hh = 4 + Math.floor(r() * 10); P.vline(x, H - 30 - hh, hh, r() < 0.5 ? '#f0c040' : '#e8602a'); }
    crisp(P, '鳳凰', W / 2, 16, 16, '#f0d060', { shadow: '#000' }); crisp(P, 'THE PHOENIX', W / 2, H - 22, 8, '#f8e8c0'); crisp(P, 'RETURNS', W / 2, H - 12, 8, '#f8e8c0');
  });
  C.decal(B.gk(1, 'front'), poster, 212.0, 4.3, 84, 's', 3.0, 3.6, { off: 0.04 }); C.decal(B.gk(1, 'front'), poster, 225.0, 4.3, 84, 's', 3.0, 3.6, { off: 0.04 });
  const marq = ptex('ct_marquee' + ctx.night, 6, 1.0, (g, W, H, r, P) => { P.fill('#1e1e26'); for (let x = 3; x < W; x += 6) { P.px(x, 2, ctx.night ? '#fff0a0' : '#c8b060'); P.px(x, H - 3, ctx.night ? '#fff0a0' : '#c8b060'); } crisp(P, 'TONIGHT  8PM', W / 2, 11, 16, '#f0c040'); crisp(P, 'CANTONESE OPERA · LION DANCE', W / 2, H - 9, 8, '#f8e8c0'); });
  C.box('ct_sq', TX.solid('#2a2a30'), 213.3, 0, 85.5, 213.45, 1.9, 85.6); C.box('ct_sq', TX.solid('#2a2a30'), 216.55, 0, 85.5, 216.7, 1.9, 85.6); C.box('ct_sq', TX.solid('#1e1e26'), 213.3, 0.9, 85.45, 216.7, 1.95, 85.5);
  C.decal('ct_sq', ptex('ct_marquee2' + ctx.night, 3.4, 1.0, (g, W, H, r, P) => { P.fill('#1e1e26'); for (let x = 3; x < W; x += 6) { P.px(x, 2, ctx.night ? '#fff0a0' : '#c8b060'); P.px(x, H - 3, ctx.night ? '#fff0a0' : '#c8b060'); } crisp(P, 'TONIGHT 8PM', W / 2, 11, 16, '#f0c040'); crisp(P, 'OPERA · LION DANCE', W / 2, H - 9, 8, '#f8e8c0'); }), 215, 0.92, 85.5, 's', 3.4, 1.0, { off: 0.01 });
  C.nav.block(213.2, 85.4, 216.8, 85.7); void marq;
  C.interact({ x: 212.0, z: 85.4, label: 'Look at the poster', act: async (app) => app.say('', '"THE PHOENIX RETURNS" — a golden bird rising out of red flames. Tonight at eight, with a lion dance in the interval.', 'Someone has scribbled underneath: "bring earplugs for the gongs!!"') });
}

// ---------------------------------------------------------------- the Square: raised plaza, pavilion, lawns, chess tables
function square(C, ctx) {
  const [sx0, sz0, sx1, sz1] = SQ;
  C.plinth(sx0, sz0, sx1, sz1, SQY, TX.pavers('#d0c4b0'), granite('#a8a49c'));
  // a brick border, four lawns with trees, paths
  for (const [a, b, c2, d] of [[sx0, sz0, sx1, sz0 + 0.6], [sx0, sz1 - 0.6, sx1, sz1], [sx0, sz0, sx0 + 0.6, sz1], [sx1 - 0.6, sz0, sx1, sz1]]) C.ground(a, b, c2, d, basket('#a8584a'), { y: SQY + 0.004 });
  // a ring of red brick around the pavilion and brick paths out to the four sides
  { const bk = basket('#a8584a'), px0 = 186, pz0 = 79.5, r0 = 6.3, r1 = 7.3, N = 48, y = SQY + 0.004;
    for (let i = 0; i < N; i++) { const a0 = (i / N) * 6.2832, a1 = ((i + 1) / N) * 6.2832, P = (r, a) => [px0 + Math.cos(a) * r, y, pz0 + Math.sin(a) * r], U = (p) => [p[0], -p[2]];
      const A = P(r0, a0), B2 = P(r1, a0), C2 = P(r1, a1), D = P(r0, a1); tri3(C, 'ground', bk, A, B2, C2, U(A), U(B2), U(C2), { up: true }); tri3(C, 'ground', bk, A, C2, D, U(A), U(C2), U(D), { up: true }); }
    for (const [a, b2, c2, d] of [[px0 - 0.9, 66.6, px0 + 0.9, pz0 - r1 + 0.2], [px0 - 0.9, pz0 + r1 - 0.2, px0 + 0.9, 96.4], [166.6, pz0 - 0.9, px0 - r1 + 0.2, pz0 + 0.9], [px0 + r1 - 0.2, pz0 - 0.9, 205.4, pz0 + 0.9]]) C.ground(a, b2, c2, d, bk, { y });
  }
  const lawn = TX.grass('#5a9a4a'), curb = granite('#a8a49c');
  const lawns = [[168, 68, 179, 74.5], [168, 85.5, 179, 95], [193, 85.5, 204, 95]];
  for (const [a, b, c2, d] of lawns) { C.box('ground', curb, a, SQY, b, c2, SQY + 0.1, d, { top: lawn }); C.paint(a, b, c2, d, '#6aa058'); C.nav.open(a, b, c2, d, 0, SQY + 0.1); }
  for (const [x, z] of [[170.5, 70], [176.5, 72.5], [169.6, 93.6], [177.6, 93.2]]) C.prop('tree', x, z);
  C.prop('ct_slide', 173.4, 88.4);
  C.interact({ x: 173.4, z: 90.6, label: 'Look at the dragon slide', act: async (app) => app.say('', 'A green concrete dragon humps out of the lawn three times, then turns its last hump into a slide.', 'Its paint is worn shiny where a thousand small hands have patted its nose for luck.') });
  C.npc({ id: 'ctPlayKid', who: 'passerby41', x: 176.6, z: 90.2, yaw: -1.2, clip: 'cheer', name: 'Kid', lines: [['I\'m the dragon\'s rider! You can be... the tail.'], ['My Tokon can go down the slide headfirst. It\'s the bravest.']] });
  for (const [x, z] of [[182, 96.2], [190, 96.2], [196.4, 67.2], [175.6, 67.2]]) C.prop('planter', x, z);
  C.prop('cart', 199.2, 82.6, { yaw: -Math.PI / 2 });
  C.interact({ x: 197.6, z: 82.6, label: 'Buy a sugar-cane juice', icon: 'bowl', act: async (app) => { await app.say('Juice Cart', 'Fresh pressed! Sugar cane and a little lime. Very cold, very sweet.'); app.toast('Sugar-cane juice: refreshing', { icon: 'drop' }); app.audio && app.audio.sfx && app.audio.sfx('coin'); } });
  for (const [x, z] of [[195.5, 88], [201.5, 92.5], [198.5, 90.5], [201.5, 87.2]]) C.prop('ct_blossom', x, z);
  C.prop('bush', 173, 70.2); C.prop('bush', 177.6, 93.6); C.prop('bush', 195, 93.8); C.prop('bush', 169.2, 87.2);
  // the pavilion
  const px = 186, pz = 79.5, P = landmark(C, px - 4.6, pz - 4.6, 9.2, 9.2, 7.6, { name: 'pavilion', mark: [px - 4.3, pz - 4.3, px + 4.3, pz + 4.3], step: 'step_concrete' });
  const pb = P.gk(0, 'back'), py = SQY + 0.3;
  C.box(pb, granite('#bcb6ac'), px - 4.4, SQY, pz - 4.4, px + 4.4, py, pz + 4.4); C.nav.open(px - 4.4, pz - 4.4, px + 4.4, pz + 4.4, 0, py); C.paint(px - 4.4, pz - 4.4, px + 4.4, pz + 4.4, '#d8d0c0');
  const inlay = ptex('ct_pavfloor', 6, 6, (g, W, H, r, P2) => { P2.fill('#c8c0b4'); const c = W / 2; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - c + 0.5, y - c + 0.5); if (d < 88 && d > 80) P2.px(x, y, '#a8584a'); else if (d < 60 && d > 56) P2.px(x, y, '#2e6a4a'); else if (d < 20) P2.px(x, y, (Math.floor(Math.atan2(y - c, x - c) * 4 + 20) % 2) ? '#d8a83a' : '#b8282a'); } P2.speck(200, '#b8b0a4', r); });
  discDecal(C, pb, inlay, px, py + 0.004, pz, 2.75, { uvR: 0.46 });
  for (const [cx, cz] of [[-3.3, -3.3], [3.3, -3.3], [-3.3, 3.3], [3.3, 3.3]]) column(C, pb, px + cx, pz + cz, py, py + 3.4, 0.22);
  for (const s of [-1, 1]) { C.box(pb, lattice('#b8282a', '#5a2a22'), px - 3.1, py, pz + s * 3.3 - 0.06, px - 1.2, py + 0.6, pz + s * 3.3 + 0.06); C.box(pb, lattice('#b8282a', '#5a2a22'), px + 1.2, py, pz + s * 3.3 - 0.06, px + 3.1, py + 0.6, pz + s * 3.3 + 0.06); C.nav.block(px - 3.1, pz + s * 3.3 - 0.1, px - 1.2, pz + s * 3.3 + 0.1); C.nav.block(px + 1.2, pz + s * 3.3 - 0.1, px + 3.1, pz + s * 3.3 + 0.1); }
  for (const s of [-1, 1]) { C.box(pb, TX.planks('#8a5a32'), px + s * 3.3 - 0.25, py + 0.35, pz - 2.4, px + s * 3.3 + 0.25, py + 0.45, pz + 2.4); C.box(pb, lattice('#b8282a', '#5a2a22'), px + s * 3.3 - 0.06, py, pz - 2.4, px + s * 3.3 + 0.06, py + 0.35, pz + 2.4); C.nav.block(px + s * 3.3 - 0.28, pz - 2.4, px + s * 3.3 + 0.28, pz + 2.4); }
  const rg = `b${P.id}:roof`;
  C.box(rg, beamPaint(), px - 3.55, py + 3.0, pz - 3.55, px + 3.55, py + 3.4, pz + 3.55, { u0: 0, v0: 0 });
  C.box(rg, brackets(), px - 3.6, py + 3.4, pz - 3.6, px + 3.6, py + 3.75, pz + 3.6, { u0: 0, v0: 0 });
  hipRoof(C, rg, { x0: px - 3.6, z0: pz - 3.6, x1: px + 3.6, z1: pz + 3.6, y: py + 3.75, e: 1.0, skirt: true, inset: 1.8, drop: 0.9, tex: tiles('#3f8a5a'), capCol: '#2e6a44', hookCol: '#d8a83a', flare: 0.65 });
  C.box(rg, lacquer('#b8282a'), px - 2.0, py + 4.4, pz - 2.0, px + 2.0, py + 5.2, pz + 2.0);
  hipRoof(C, rg, { x0: px - 2.0, z0: pz - 2.0, x1: px + 2.0, z1: pz + 2.0, y: py + 5.2, e: 0.9, rh: 2.0, tex: tiles('#3f8a5a'), capCol: '#2e6a44', hookCol: '#e0b040', flare: 0.6 });
  C.props.push({ kind: 'ct_lanternBig', x: px, y: py + 1.6, z: pz, yaw: 0 }); beam(C, rg, TX.solid('#3a2422'), [px, py + 3.0, pz], [px, py + 3.06 - 0.6, pz], 0.04);
  for (const [cx, cz] of [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]]) C.props.push({ kind: 'lantern', x: px + cx, y: py + 2.25, z: pz + cz, yaw: 0 });
  C.interact({ x: px, z: pz + 1.5, r: 2.2, label: 'Rest in the pavilion', icon: 'heart', act: async (app) => {
    if (app.story && app.story.rest) return app.story.rest();
    await app.say('', 'You sit on the lattice bench. Lanterns tick in the breeze; an old radio somewhere plays opera.'); app.toast('Rested', { icon: 'heart' });
  } });
  C.interact({ x: px - 1.8, z: pz - 1.6, r: 1.6, label: 'Look up at the lantern', icon: 'eye', act: async (app) => app.say('', 'A big palace lantern, red silk over a bamboo frame, gold tassels turning slowly.', 'Painted on it in tiny gold strokes: a Chilichick, a Kappachi and a fat little dragon, chasing each other around and around.') });
  C.spot('square', px, pz + 6.2, Math.PI);
  // lantern strings from the pavilion out to four lamp posts
  const lamps = [[173, 77.5], [199, 77.5], [181, 70.5], [191, 88.5]];
  for (const [lx, lz] of lamps) C.prop('ct_lamp', lx, lz);
  lanternString(C, px - 4.4, pz, 173, 77.5, 4.6, 5, { sag: 0.4 }); lanternString(C, px + 4.4, pz, 199, 77.5, 4.6, 5, { sag: 0.4 });
  lanternString(C, px, pz - 4.4, 181, 70.5, 4.6, 3, { sag: 0.3 }); lanternString(C, px, pz + 4.4, 191, 88.5, 4.6, 4, { sag: 0.3 });
  for (const [lx, lz] of [[167.5, 67.5], [204.5, 67.5], [167.5, 95.5], [204.5, 95.5]]) C.prop('ct_lamp', lx, lz);
  // benches facing the pavilion
  for (const [bx, bz, yaw] of [[181, 72.6, Math.PI], [191, 72.6, Math.PI], [181, 86.6, 0], [191.5, 92.0, 0], [178.6, 79.5, -Math.PI / 2], [193.6, 81.5, Math.PI / 2]]) C.prop('bench', bx, bz, { yaw });
  C.prop('bin', 179.2, 73.5); C.prop('bin', 192.8, 86.8);
  // the chess corner (north-east): stone tables with xiangqi boards and stools
  const xq = xiangqi(), tables = [[197.2, 70.6], [201.6, 70.6], [199.4, 74.6]];
  for (const [tx, tz] of tables) { C.prop('ct_xqTable', tx, tz); floorDecal(C, 'props', xq, tx, SQY + 0.75, tz, 0.8, 0.8); for (const [dx, dz] of [[0, -0.95], [0, 0.95]]) C.prop('ct_stool', tx + dx, tz + dz); }
  const [cx0, cz0] = tables[0];
  C.npc({ id: 'uncleHo', who: 'chess', x: cx0, z: cz0 - 0.95, yaw: 0, clip: 'sit', name: 'Uncle Ho', lines: async (app, n) => {
    const L2 = [['Uncle Ho', 'Shh. I am three moves from victory. Or defeat. Hard to say.'], ['Uncle Ho', 'Xiangqi is like Tokonmon battles: the cannon must jump to strike.'], ['Uncle Ho', 'You want to play? Sit, sit. Mind the river.']];
    const l = L2[(n.said = ((n.said ?? -1) + 1) % L2.length)]; await app.say(l[0], l[1]);
    const a = app.world.actor(n.id); setTimeout(() => a && a.play('sit', { fade: 0.2 }), 40);
  } });
  C.npc({ id: 'ctChessRival', who: 'passerby264', x: cx0, z: cz0 + 0.95, yaw: Math.PI, clip: 'sit', name: 'Mr. Tam', lines: async (app, n) => {
    await app.say('Mr. Tam', ['He has been "three moves from victory" since nine o\'clock.', 'Don\'t tell him, but I let him take my horse.', 'Thirty years, same table. He owes me four thousand games.'][Math.floor(Math.random() * 3)]);
    const a = app.world.actor(n.id); setTimeout(() => a && a.play('sit', { fade: 0.2 }), 40);
  } });
  C.interact({ x: cx0 + 0.9, z: cz0, r: 1.4, label: 'Play xiangqi', icon: 'star', act: async (app) => {
    if (app.story && app.story.chessUncle) return app.story.chessUncle();
    await app.say('Uncle Ho', 'Red moves first. Generals stay in the palace. Cannons jump. Elephants cannot cross the river.', 'Hah! Come back when you have a partner, and we play the fast kind.');
  } });
  C.interact({ x: 199.4, z: 75.9, r: 1.3, label: 'Watch a game', act: async (app) => app.say('', 'Two players slap pieces down so fast the board jumps. A small crowd of pigeons supervises.') });
  C.spot('chess', cx0 + 1.2, cz0, -Math.PI / 2);
  // the tai-chi corner: two elders moving slowly together
  C.npc({ id: 'ctTaichi1', who: 'passerby131', x: 172.4, z: 81.2, yaw: Math.PI / 2, clip: 'stretch', name: 'Auntie Lin', lines: [['Slowly, slowly. Like pushing clouds.', 'Your Tokonmon can join! The little ones love it.'], ['Forty years of tai chi. My knees are younger than yours.']] });
  C.npc({ id: 'ctTaichi2', who: 'passerby57', x: 174.4, z: 83.0, yaw: Math.PI / 2, clip: 'stretch', name: 'Uncle Wai', lines: [['Breathe in... the city. Breathe out... the traffic.']] });
  // notice board at the west entrance
  C.box('ct_sq', TX.solid('#5a3a22'), 166.6, SQY, 74.6, 166.9, SQY + 2.0, 77.4); C.box('ct_sq', TX.solid('#3f8a5a'), 166.5, SQY + 2.0, 74.4, 167.1, SQY + 2.15, 77.6);
  C.decal('ct_sq', board('sqnotice', ['NOTICES', 'LOST: small fire', 'lizard, answers', 'to "Ember"', '', 'LION DANCE', 'SAT 7PM GRANT LN', '', 'ROOM FOR RENT', 'no Tokon > 3m'], 2.6, 1.6, { bg: '#e8dcc0', fg: '#3a2a22', frame: '#5a3a22', lh: 8, size: 8 }), 166.6, SQY + 0.4, 76, 'w', 2.6, 1.6, { off: 0.01 });
  C.decal('ct_sq', board('sqnotice2', ['NOTICES', 'LOST: small fire', 'lizard, answers', 'to "Ember"', '', 'LION DANCE', 'SAT 7PM GRANT LN', '', 'ROOM FOR RENT', 'no Tokon > 3m'], 2.6, 1.6, { bg: '#e8dcc0', fg: '#3a2a22', frame: '#5a3a22', lh: 8, size: 8 }), 166.9, SQY + 0.4, 76, 'e', 2.6, 1.6, { off: 0.01 });
  C.nav.block(166.5, 74.5, 167.1, 77.5);
  C.interact({ x: 167.8, z: 76, label: 'Read the notice board', act: async (app) => app.say('', 'LOST: small fire lizard, answers to "Ember". Do not feed chili. (He will ask.)', 'LION DANCE PRACTICE — Saturday 7pm on Grant Lane. Drummers wanted.', 'ROOM FOR RENT above the bakery. Smells like pineapple buns. No Tokonmon over three metres.') });
  // pigeons' corner + a drinking fountain
  C.box('ct_sq', granite('#bcb6ac'), 168.4, SQY, 79.2, 169.2, SQY + 0.95, 80.0, { top: TX.solid('#8a9aa8') }); C.nav.block(168.4, 79.2, 169.2, 80.0);
  C.interact({ x: 169.6, z: 79.6, label: 'Drink from the fountain', act: async (app) => { app.audio && app.audio.sfx && app.audio.sfx('bubble'); await app.say('', 'Cold and a little metallic. Very refreshing.'); } });
}

// ---------------------------------------------------------------- the cable-car stop on the Market Street side
function tramStop(C, ctx) {
  const gk = 'ct_tram', x0 = 211.5, x1 = 222.5, zb = 94.0, zf = 96.6;
  C.ground(208, 85, 229.5, 98, TX.pavers('#b8b0a4'), { y: 0.006 });
  C.box('ground', TX.concrete('#bcb6ac'), 209, 0, 93.4, 225, 0.18, 97.6, { top: granite('#c0bab0') }); C.nav.open(209, 93.4, 225, 97.6, 0, 0.18); C.paint(209, 93.4, 225, 97.6, '#c0bab0');
  C.box(gk, TX.solid('#f0e8b0'), 209, 0.181, 97.2, 225, 0.19, 97.45);
  for (const x of [x0, (x0 + x1) / 2, x1]) { C.box(gk, TX.solid('#2e5a44'), x - 0.08, 0.18, zb - 0.08, x + 0.08, 2.9, zb + 0.08); C.box(gk, TX.solid('#2e5a44'), x - 0.08, 0.18, zf - 0.08, x + 0.08, 2.9, zf + 0.08); C.nav.block(x - 0.12, zb - 0.12, x + 0.12, zb + 0.12); C.nav.block(x - 0.12, zf - 0.12, x + 0.12, zf + 0.12); }
  C.box(gk, TX.solid('#9ab8c8'), x0, 0.5, zb - 0.03, x1, 2.6, zb + 0.03); C.nav.block(x0, zb - 0.06, x1, zb + 0.06);
  pent(C, gk, 's', [x0 - 0.2, zb], [x1 + 0.2, zb], 3.25, zf - zb + 0.6, 0.45, { col: '#3f8a5a', flare: 0.3 });
  C.box(gk, TX.solid('#2e5a44'), x0 - 0.1, 2.9, zb - 0.1, x1 + 0.1, 3.05, zf + 0.1);
  C.prop('bench', 214.5, 94.7, { yaw: Math.PI }); C.prop('bench', 219.5, 94.7, { yaw: Math.PI });
  const sign = ptex('ct_tramsign', 2.6, 0.9, (g, W, H, r, P) => { P.fill('#2a3a5a'); P.rect(1, 1, W - 2, H - 2, '#f0e8d8'); P.rect(3, 3, W - 6, 10, '#b82a24'); crisp(P, 'CABLE CAR', W / 2, 8, 8, '#f8f0e0'); crisp(P, 'CHINATOWN', W / 2, 18, 8, '#2a3a5a'); crisp(P, 'MARKET ST · WHARF', W / 2, 25, 8, '#5a5a5a'); });
  C.box(gk, TX.solid('#2e5a44'), 223.6, 0.18, 96.2, 223.75, 2.8, 96.35); C.box(gk, TX.solid('#2e5a44'), 222.3, 1.85, 96.25, 224.95, 2.8, 96.3);
  C.decal(gk, sign, 223.62, 1.88, 96.3, 's', 2.6, 0.9, { off: 0.01 }); C.nav.block(223.5, 96.1, 223.85, 96.45);
  const map = board('trammap', ['ROUTE', { rect: true, x: 8, w: 66, h: 2, c: '#b82a24' }, 'WHARF', '|', 'BAY ST', '|', 'CHINATOWN *', '|', 'MARKET ST'], 1.2, 1.6, { bg: '#f0e8d8', fg: '#2a3a5a', frame: '#2e5a44', lh: 8 });
  C.decal(gk, map, 217, 0.9, zb + 0.04, 's', 1.2, 1.6, { off: 0.01 });
  C.interact({ x: 217, z: 96.4, label: 'Cable car stop', icon: 'map', act: async (app) => {
    if (app.story && app.story.tramStop) return app.story.tramStop();
    await app.say('', 'CABLE CAR — CHINATOWN. Next car in "about a while", says a hand-written note.');
  } });
  C.spot('tramStopCT', 217, 97.0, 0);
  // the little garden between the opera house and the stop
  for (const [x, z] of [[211, 88], [226.5, 88.5]]) C.prop('ct_blossom', x, z);
  C.prop('ct_pot', 214.5, 86.6); C.prop('ct_pot', 220.5, 86.6); C.prop('bench', 217.5, 89.2, { yaw: Math.PI });
  C.prop('ct_lamp', 209.0, 92.5); C.prop('ct_lamp', 228.2, 92.5);
}

// ---------------------------------------------------------------- lanterns, stalls, carts, laundry, people
function streetLife(C, ctx) {
  // lantern strings zig-zagging over Grant Lane, across Jackson Lane, down the alleys
  for (let z = 36; z < 90; z += 5) lanternString(C, GL0 + 0.3, z, GL1 - 0.3, z + 2.5, 5.6, 5, { sag: 0.5 });
  for (let x = 120; x < 228; x += 7) { if (x > GL0 - 3 && x < GL1 + 2) continue; lanternString(C, x, JK0 + 0.3, x + 3.5, JK1 - 0.3, 5.2, 4, { sag: 0.45 }); }
  for (let z = 36; z < 56; z += 4.5) lanternString(C, RA0 + 0.1, z, RA1 - 0.1, z + 1.2, 4.4, 2, { sag: 0.25 });
  for (let z = 67; z < 87; z += 4.5) lanternString(C, RA0 + 0.1, z, RA1 - 0.1, z + 1.2, 4.4, 2, { sag: 0.25 });
  for (let z = 36; z < 56; z += 5) lanternString(C, OL0 + 0.1, z, OL1 - 0.1, z + 1.5, 4.6, 2, { sag: 0.3 });
  // laundry lines over Ross Alley
  const cloth = ['#f4f0ea', '#4a7ad8', '#e85a6a', '#f0c840', '#5ab06a', '#e8e0d0'];
  for (const [z, y] of [[39, 7.2], [47.5, 6.9], [53, 9.8], [70, 7.0], [79.5, 6.8]]) {
    beam(C, 'props', TX.solid('#e8e0d0'), [RA0 - 0.1, y, z], [RA1 + 0.1, y, z + 0.4], 0.02, 0.02, { caps: false });
    for (let i = 0; i < 4; i++) { const t = (i + 0.6) / 4.4, x = RA0 + (RA1 - RA0) * t, zz = z + 0.4 * t, c = TX.solid(cloth[(i + Math.round(z)) % cloth.length]), h = 0.45 + (i % 2) * 0.25; C.box('props', c, x - 0.22, y - h, zz - 0.02, x + 0.22, y - 0.02, zz + 0.02); }
  }
  // Grant Lane street furniture: lamps, planters, the dumpling cart, the bakery counter, herb jars
  for (const z of [38, 52, 68, 82]) { C.prop('ct_lamp', GL0 + 0.7, z); C.prop('ct_lamp', GL1 - 0.7, z + 6); }
  C.prop('ct_pot', GL0 + 0.6, 43.2); C.prop('ct_pot', GL1 - 0.6, 71.5); C.prop('ct_bamboo', GL1 - 0.6, 40.5); C.prop('bin', GL1 - 0.6, 62.8); C.prop('hydrant', GL0 + 0.5, 61.4);
  C.prop('ct_bike', GL0 + 0.9, 57.0, { yaw: Math.PI / 2 }); C.prop('ct_bucket', 142.5, 48.3);
  // the dumpling cart in front of Golden Dumpling
  C.prop('ct_steamer', 144.0, 85.2, { yaw: Math.PI / 2 });
  C.npc({ id: 'ctDumpling', who: 'passerby91', x: 142.85, z: 85.2, yaw: Math.PI / 2, name: 'Dumpling Auntie', lines: [['Har gow, siu mai, char siu bao! Hot hot hot!'], ['Your Tokonmon is drooling on my cart. ...Fine, one free bun. ONE.']] });
  C.interact({ x: 145.4, z: 85.2, label: 'Buy dumplings', icon: 'bowl', act: async (app) => {
    const i = await app.choose('Steamer of...?', ['Pork buns', 'Shrimp dumplings', 'Sesame balls', 'Never mind']);
    if (i >= 0 && i < 3) { await app.say('Dumpling Auntie', ['Char siu bao — fluffy as a cloud, sweet as a grandma!', 'Har gow! See-through skin, that\'s how you know it\'s good.', 'Jin deui, crispy outside, red bean inside. Mind your teeth!'][i]); app.toast(['Pork buns — delicious', 'Shrimp dumplings — perfect', 'Sesame balls — crunchy'][i], { icon: 'bowl' }); app.audio && app.audio.sfx && app.audio.sfx('coin'); }
  } });
  // Lucky Moon's takeaway counter (a glass case of tarts) and the baker
  const tart = ptex('ct_tartcase', 1.6, 0.9, (g, W, H, r, P) => { P.fill('#d8d0c0'); P.rect(2, 2, W - 4, H - 6, '#e8f0f4'); for (let y = 6; y < H - 6; y += 8) { P.hline(2, y + 5, W - 4, '#c8b8a0'); for (let x = 4; x < W - 6; x += 6) { P.rect(x, y, 5, 4, '#a8682a'); P.rect(x + 1, y, 3, 2, '#f8d040'); } } P.rect(0, H - 4, W, 4, '#8a5a32'); });
  fbox(C, 'ct_counter', TX.solid('#d8d0c0'), 142.05, 0, 78.4, 142.8, 1.0, 80.0, { e: ptex('ct_tartside', 1.6, 1.0, (g, W, H, r, P) => { P.fill('#8a5a32'); P.rect(2, 2, W - 4, H - 10, '#e8f0f4'); for (let x = 4; x < W - 6; x += 6) { P.rect(x, 10, 5, 4, '#a8682a'); P.rect(x + 1, 10, 3, 2, '#f8d040'); P.rect(x, 20, 5, 4, '#c88a3a'); } P.rect(0, H - 6, W, 6, '#d8a83a'); }), topTile: TX.solid('#e8f0f4') });
  floorDecal(C, 'ct_counter', tart, 142.42, 1.004, 79.2, 0.75, 1.6, { rot: true });
  C.nav.block(142.05, 78.4, 142.8, 80.0);
  C.npc({ id: 'ctBaker', who: 'passerby23', x: 143.0, z: 77.3, yaw: Math.PI / 2, name: 'Mrs. Chan', lines: [['Egg tarts at six, pineapple buns at seven, gossip all day!'], ['The secret to good custard? Patience. And lard. Mostly lard.']] });
  C.interact({ x: 143.4, z: 79.2, label: 'Buy an egg tart', icon: 'bowl', act: async (app) => {
    const q = app.quests; if (q && q.at && q.at('tarts') === 0 && app.story && app.story.bakery) return app.story.bakery();
    await app.say('Mrs. Chan', ['Egg tart, still warm! Flaky shell, wobbly middle — eat it before it gets cold!', 'Last one of the batch! The edges are extra crispy, that\'s the lucky one.', 'One egg tart. And here — a broken one for your Tokonmon. No charge.'][Math.floor(Math.random() * 3)]);
    app.toast('Egg tart: warm, flaky, perfect', { icon: 'bowl' }); app.audio && app.audio.sfx && app.audio.sfx('coin');
  } });
  C.spot('bakery', 143.4, 75.9, -Math.PI / 2);
  // Hundred Herbs: jars on a stand outside, the herbalist
  const jars = ptex('ct_jars', 1.4, 0.6, (g, W, H, r, P) => { P.fill('#5a3a22'); for (let x = 2; x < W - 5; x += 6) { P.rect(x, 3, 5, H - 6, '#c8dcdc'); P.rect(x + 1, 6, 3, H - 10, ['#8a5a2a', '#c8a050', '#6a3a2a', '#a8402a', '#5a7a3a'][Math.floor(r() * 5)]); P.hline(x, 2, 5, '#c83a2a'); } });
  fbox(C, 'ct_counter', TX.planks('#6a4428'), 142.05, 0, 44.0, 142.65, 0.85, 45.6, { e: jars, topTile: TX.planks('#8a5a32') });
  for (let i = 0; i < 4; i++) C.box('ct_counter', TX.solid(['#c8dcdc', '#d8e8e8'][i % 2]), 142.18 + (i % 2) * 0.18, 0.85, 44.15 + i * 0.36, 142.4 + (i % 2) * 0.18, 1.1, 44.4 + i * 0.36, { top: TX.solid('#c83a2a') });
  C.nav.block(142.05, 44.0, 142.65, 45.6);
  C.interact({ x: 143.2, z: 44.8, label: 'Browse herb jars', icon: 'leaf', act: async (app) => {
    const H = [['Dried chrysanthemum', 'for a cool head and tired eyes.'], ['Ginseng root, twisted like a little old man', 'for stamina. Very expensive.'], ['Goji berries', 'for good eyesight. Tokonmon love them too.'], ['Something labelled "DRAGON BONE"', 'which is, the herbalist admits, "probably a cow".']];
    const h = H[Math.floor(Math.random() * H.length)]; await app.say('', `${h[0]} — ${h[1]}`);
  } });
  C.npc({ id: 'ctHerbalist', who: 'passerby58', x: 143.1, z: 46.6, yaw: Math.PI / 2, name: 'Dr. Ng', lines: [['Hot sauce again? Your Chilichick needs cooling herbs, not more chili.'], ['Ginger for the stomach, patience for the heart. Both are cheap; only one is on sale.']] });
  // Chef Wong outside his kitchen, ducks in the window
  C.npc({ id: 'chef', who: 'chef', x: 143.4, z: 54.2, yaw: Math.PI / 2, name: 'Chef Wong', lines: [
    ['Hey hey! You want roast duck? Best skin in the city. Crunchy like autumn leaves!'],
    ['My hot sauce recipe? Secret. Ten generations secret. ...Okay, nine. My cousin wrote it on a napkin once.'],
    ['Wok hei! That\'s the breath of the wok. You can\'t buy it, you have to earn it — like your Tokonmon\'s trust.'],
  ] });
  C.interact({ x: 143.0, z: 51.6, label: 'Look at the roast ducks', act: async (app) => app.say('', 'A row of glossy roast ducks hangs in the window, lacquered amber and dripping. Your stomach makes a noise.') });
  // Gateway Music & Gear: the door on the gate plaza
  C.interact({ x: 138.8, z: 92.9, label: 'Gateway Music & Gear', icon: 'gear', mm: true, act: async (app) => {
    if (app.story && app.story.gearShop) return app.story.gearShop();
    await app.say('Clerk', 'Welcome to Gateway Music & Gear! Picks, pedals, amps and kicks — gear makes your Tokonmon hit harder.');
  } });
  C.npc({ id: 'ctGearClerk', who: 'passerby15', x: 139.0, z: 90.4, yaw: Math.PI / 2, name: 'Clerk', clip: 'phone', lines: [['New shipment of picks! Dragon-scale finish. Not real dragon. Probably.'], ['That amp in the window goes to eleven. Your neighbours will hate it.']] });
  C.spot('gearShop', 139.4, 93.0, -Math.PI / 2);
  // fortune-cookie stall on Jackson Lane, at the mouth of Ross Alley
  C.prop('ct_fortune', 124.0, 59.4);
  C.npc({ id: 'ctFortune', who: 'passerby142', x: 124.0, z: 58.3, yaw: 0, name: 'Auntie Yee', lines: [['Fortune cookies, folded by hand! The fortunes are true, mostly.']] });
  C.interact({ x: 124.0, z: 60.8, label: 'Crack a fortune cookie', icon: 'star', act: async (app) => {
    const F = ['A bold step today brings a loyal friend tomorrow.', 'Your next battle will be won by patience, not power.', 'Beware of seagulls bearing gifts.', 'The lucky number you seek is the one you already have.', 'A small spark can light a whole lantern street.', 'You will find what you lost in the last place you look. Obviously.', 'Someone nearby is proud of you. Probably your Tokonmon.', 'Help an elder today and the city will remember.'];
    app.audio && app.audio.sfx && app.audio.sfx('plop');
    await app.say('', '*crack* The slip inside reads:', '"' + F[Math.floor(Math.random() * F.length)] + '"');
    app.toast('Lucky numbers: ' + Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 49)).join(' '), { icon: 'star' });
  } });
  // produce stalls along Jackson Lane, a lion-dance head on show, a delivery bike
  C.prop('ct_produce', 155.5, 59.2); C.prop('ct_produce', 170.0, 59.2); C.prop('ct_produce', 174.5, 59.2);
  C.npc({ id: 'ctGrocer', who: 'passerby176', x: 172.2, z: 60.4, yaw: 0, name: 'Grocer Lam', lines: [['Bok choy! Lychee! Dragon fruit — no, it is not made of dragons.'], ['Tokonmon steal my oranges. I put out a bowl of the bruised ones now. Peace treaty.']] });
  C.interact({ x: 156.0, z: 60.5, label: 'Browse the produce', icon: 'leaf', act: async (app) => app.say('', 'Mountains of oranges for luck, bunches of bok choy, spiky durian wrapped in newspaper, a crate of lychees glowing pink.') });
  // a big lantern you can examine in Ross Alley, the Lantern Works window
  C.interact({ x: 129.5, z: 81.0, label: 'Examine the lanterns', icon: 'eye', act: async (app) => app.say('', 'Paper lanterns drying on a rack: red ones for luck, gold ones for wealth, one lopsided green one that\'s clearly a beginner\'s.', 'Through the window, an old man glues silk onto bamboo with fingers as quick as a sparrow.') });
  C.interact({ x: 129.6, z: 67.6, label: 'Listen at the mahjong club', icon: 'eye', act: async (app) => app.say('', 'Clack-clack-clack — tiles being shuffled behind the green door. Someone shouts "Pung!" and someone else groans.') });
  C.interact({ x: 129.5, z: 37.6, label: 'Peek into the cookie factory', icon: 'eye', act: async (app) => app.say('', 'Warm vanilla air. Two ladies fold hot cookie discs around paper fortunes faster than you can blink.') });
  // people around the gate and the lanes
  C.npc({ id: 'ctTourist', who: 'passerby310', x: 145.4, z: 97.7, yaw: Math.PI, clip: 'selfie', name: 'Tourist', lines: [['Is this the famous gate? It\'s so GREEN. Can you take one of me? No? Fine, selfie it is.']] });
  C.npc({ id: 'ctKid', who: 'passerby88', x: 148.2, z: 66.5, yaw: -Math.PI / 2, name: 'Kid', lines: [['My uncle says if you whistle under the lanterns, the dragon wakes up.', 'I whistled ALL DAY. Nothing. Dragons are lazy.']] });
  C.npc({ id: 'ctGrandma', who: 'passerby222', x: 159.5, z: 61.2, yaw: 0, name: 'Grandma Poon', lines: [['Young people walk so fast! Where is the fire? Is it your Tokonmon?', 'Ha! Joking, joking.']] });
  C.spot('chinatownStreet', (GL0 + GL1) / 2, 66.5, Math.PI);
}
