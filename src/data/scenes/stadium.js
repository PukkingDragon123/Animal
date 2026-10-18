// Osaka League Stadium (Umeda) — the rank-match arena. Six tiers of stands packed
// with a pixel crowd (scarves, flags, draped fan banners) rise toward a roofed
// upper concourse with skyboxes, an LED ribbon, the jumbotron and floodlight
// masts; down on the striped turf: LED ad boards, the players' tunnel, dugouts,
// camera crews, a reporters' corner and the battle ring with its trainer boxes.
// In the 3D diorama the stands are real terraces and the masts light the pitch.
import { Scene2D } from '../../px/scene2d.js';
import { Pen, C, shift, newSurf } from '../../px/paint.js';
import * as PR from '../../px/props.js';

export const STADIUM = { w: 720, h: 600 };
const TOP = 120;                                   // front edge of the upper concourse
const TIERS = 6, RISE = 14, SEAT = 12;             // each tier: a 14 px riser + 12 px of seating
const FIELD_Y = TOP + TIERS * (RISE + SEAT);       // 276: the pitch starts here
export const RING = { x: 360, y: 452, rx: 140, ry: 84 };
const AISLES = [118, 355, 602];                    // 10 px stair aisles between the sections
// sections (seats, scarves, flags): ends, home (Pyro red), away (Hydro blue), ends
const SECT = [
  { x0: 0, x1: 118, seat: '#c89a3a', team: [C.mustard, C.white] },
  { x0: 128, x1: 355, seat: '#b8443e', team: [C.red, '#ffb040'] },
  { x0: 365, x1: 602, seat: '#3e6aa8', team: [C.blue, C.white] },
  { x0: 612, x1: 720, seat: '#3a8a84', team: [C.teal, C.white] },
];
const SKIN = ['#f0c8a0', '#e0a880', '#c8885e', '#a86a48', '#f8d8b8', '#8a5238'];
const HAIR = ['#2a1a1a', '#4a2a1a', '#1a1a2a', '#8a5a2a', '#e8d070', '#c03a3a', '#e8e0d0', '#5a3a8a', '#3a7ad0'];
const SHIRTS = [C.white, C.navy, C.red, C.blueL, C.mustard, C.tealL, '#a88aff', C.orange, C.greenL, '#ff8ab8'];
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
const sectAt = (x) => SECT.find((s) => x >= s.x0 && x < s.x1) || SECT[0];

// ------------------------------------------------------------------ the crowd
// one fan sitting with their seat line at y (torso 3×4, head 3×3)
function fan(p, x, y, r, sect, night) {
  r = (r >>> 0) % 1000003;
  const skin = SKIN[r % SKIN.length], hair = HAIR[(r >> 3) % HAIR.length];
  const shirt = r % 3 === 0 ? SHIRTS[(r >> 5) % SHIRTS.length] : sect.team[(r >> 4) % 2];
  const up = r % 9 === 0, cap = r % 13 === 1;
  p.rect(x, y - 4, 3, 4, shirt); p.px(x, y - 4, shift(shirt, 0.9)); p.vl(x + 2, y - 3, y - 1, shift(shirt, -0.9));
  p.rect(x, y - 7, 3, 3, skin); p.px(x + 2, y - 5, shift(skin, -0.7));
  if (cap) { p.hl(x, x + 3, y - 7, sect.team[0]); p.px(x, y - 8, sect.team[0]); p.px(x + 1, y - 8, sect.team[0]); }
  else { p.hl(x, x + 2, y - 7, hair); p.px(x, y - 6, hair); if (r % 5 === 2) p.px(x + 2, y - 6, hair); }
  if (up) {                                   // both arms up, cheering
    p.vl(x - 1, y - 9, y - 6, skin); p.vl(x + 3, y - 9, y - 6, skin); p.px(x - 1, y - 6, shirt); p.px(x + 3, y - 6, shirt);
    if (night && r % 2) { p.px(x - 1, y - 10, r % 4 === 1 ? C.neonC : C.neonP); p.px(x - 1, y - 11, '#ffffff'); }   // lightstick
  } else if (night && r % 7 === 3) p.px(x + 1, y - 9, '#fff8e0');                                                    // phone light
}
// a row of fans along a seat line, with scarves held up, flags and the odd little sign
function crowdRow(p, x0, x1, y, seed, night) {
  for (let x = x0 + (seed % 3); x < x1 - 3;) {
    const r = hash(x, seed), sect = sectAt(x);
    if (r % 17 < 2) { x += 4; continue; }                                   // empty seat
    if (r % 29 === 5 && x + 11 < x1) {                                        // two fans holding a scarf over their heads
      fan(p, x, y, r | 1, sect, night); fan(p, x + 6, y, (r >> 2) | 1, sect, night);
      for (let k = 0; k < 11; k++) { const c = k % 4 < 2 ? sect.team[0] : sect.team[1]; p.px(x - 1 + k, y - 11, c); p.px(x - 1 + k, y - 10, shift(c, -0.8)); }
      for (const ex of [x - 2, x + 10]) { p.px(ex, y - 11, sect.team[1]); p.px(ex, y - 9, sect.team[1]); }
      x += 13; continue;
    }
    fan(p, x, y, r, sect, night);
    if (r % 41 === 7) {                                                       // a waving flag on a pole
      p.vl(x + 3, y - 18, y - 5, C.metalL);
      for (let i = 0; i < 8; i++) { const dy = Math.round(Math.sin(i * 0.9 + seed)); for (let j = 0; j < 5; j++) p.px(x + 4 + i, y - 18 + j + dy, j < 2 ? sect.team[0] : j < 4 ? sect.team[1] : shift(sect.team[0], -0.8)); }
    } else if (r % 37 === 11) {                                               // a little sign
      p.block(x - 1, y - 13, 6, 4, r % 2 ? C.white : C.yellowL, { line: shift(C.wood2, -1) }); p.px(x + 1, y - 12, sect.team[0]); p.px(x + 2, y - 12, sect.team[0]);
    }
    x += 4 + (r % 3 === 0 ? 1 : 0);
  }
}
// a big fan banner draped over the seats (spanning two tiers, so it folds down the steps in 3D)
function tifo(p, x, y, w, h, col, draw) {
  const D = shift(col, -1.6), L = shift(col, 0.8);
  for (let i = 0; i < w; i++) {
    const fold = Math.sin(i / 5.5) * 0.5 + Math.sin(i / 2.3) * 0.15, c = fold > 0.35 ? L : fold < -0.35 ? shift(col, -0.6) : col;
    const sag = Math.round(Math.sin((i / w) * Math.PI) * 2);
    p.vl(x + i, y + sag, y + h - 1 + sag, c);
    p.px(x + i, y + sag, D); p.px(x + i, y + h - 1 + sag, D); p.px(x + i, y + h - 3 + sag, shift(col, -0.9));
  }
  p.vl(x, y, y + h - 1, D); p.vl(x + w - 1, y, y + h - 1, D);
  for (let i = 4; i < w - 2; i += 6) p.px(x + i, y + 2 + Math.round(Math.sin((i / w) * Math.PI) * 2), C.white);   // stitched hem
  draw(x, y);
  for (let i = 3; i < w; i += 9) p.px(x + i, y + h + Math.round(Math.sin((i / w) * Math.PI) * 2), SKIN[i % SKIN.length]);   // hands holding it up
}
// a stylized flame (the Pyro end's emblem)
function flame(p, cx, cy, s) {
  const pts = (k) => [[cx - 9 * k, cy + 9 * k], [cx - 10 * k, cy], [cx - 4 * k, cy - 6 * k], [cx - 5 * k, cy - 13 * k], [cx + 2 * k, cy - 7 * k], [cx + 4 * k, cy - 15 * k], [cx + 10 * k, cy - 3 * k], [cx + 9 * k, cy + 9 * k]];
  p.poly(pts(s), '#ffe8a0'); p.poly(pts(s * 0.72).map(([a, b]) => [a, b + 3 * s]), '#ffb040'); p.poly(pts(s * 0.42).map(([a, b]) => [a, b + 6 * s]), C.white);
}

// ------------------------------------------------------------------ sprites up on the concourse
// the stadium crown: roof canopy with lamp panels, LED ribbon, skyboxes and the gates
function crown(W, night) {
  const H = 78, s = newSurf(W, H), p = new Pen(s, 12);
  // roof canopy underside + truss
  p.vgrad(0, 0, W, 12, ['#2a2236', '#3a3048', '#4a3e5a']);
  for (let x = 0; x < W; x += 16) { p.line(x, 1, x + 8, 10, '#5a4e6a'); p.line(x + 8, 10, x + 16, 1, '#5a4e6a'); }
  for (let x = 6; x < W; x += 24) { p.block(x, 3, 8, 3, night ? '#fffbe8' : '#d8d4e0', { line: '#1e1828', bevel: false }); if (night) p.hl(x, x + 7, 4, '#ffffff'); }
  p.hl(0, W - 1, 12, '#6a5e7a'); p.hl(0, W - 1, 13, '#1e1828');
  // LED ribbon board
  p.rect(0, 14, W, 12, '#120e1a'); p.hl(0, W - 1, 14, '#2a2436'); p.hl(0, W - 1, 25, '#2a2436');
  const msg = '★ OSAKA LEAGUE 2050 ★ RANK MATCH DAY ★ UMEDA ARENA ';
  for (let x = -40, k = 0; x < W; x += p.textW(msg) + 6, k++) p.text(msg, x, 17, k % 2 ? C.neonC : C.neonY);
  for (let y = 15; y < 25; y += 2) for (let x = 0; x < W; x++) s.blend(x, y, '#000000', 0.18);   // LED rows
  // steel band
  p.rect(0, 26, W, 4, '#5a5068'); p.hl(0, W - 1, 26, '#8a809a'); p.hl(0, W - 1, 29, '#3a3048');
  // skyboxes: glass fronts with warm interiors and silhouettes, between concrete columns
  for (let bx = 0; bx < W; bx += 60) {
    p.block(bx, 30, 6, 26, '#7a6e88', { line: false });
    const gx = bx + 6, gw = 54, glass = night ? '#ffd890' : '#8aa8c8';
    p.vgrad(gx, 31, gw, 24, night ? ['#ffd890', '#f0a860', '#b8704a'] : ['#8aa8c8', '#6a84a8', '#4a5a7e']);
    if (night || bx % 120 === 0) {                     // people inside
      const ink = night ? '#6a3a3a' : '#3a3a5a';
      for (let k = 0; k < 4; k++) { const hx = gx + 6 + (hash(bx, k) % 40); p.rect(hx, 46, 4, 9, ink); p.ell(hx + 1.5, 43, 2, 2, ink); }
    }
    for (let k = 1; k < 3; k++) p.vl(gx + k * 18, 31, 54, night ? '#8a5a3a' : '#3a4a68');
    if (!night) { p.line(gx + 4, 54, gx + 18, 32, '#b8cce4'); p.line(gx + 8, 54, gx + 22, 32, '#a0b8d4'); }
    p.hl(gx, gx + gw - 1, 31, shift(glass, 0.8)); p.hl(gx, gx + gw - 1, 55, '#2a2436');
  }
  // concourse back wall with gates, signs and posters
  p.rect(0, 56, W, H - 56, '#8e8298'); p.hl(0, W - 1, 56, '#b0a4ba'); p.drips(0, 57, W, 6, '#7a6e86', 40);
  for (let x = 0; x < W; x += 30) p.vl(x, 57, H - 1, '#7e7288');
  [[64, 'GATE 1'], [250, 'GATE 2'], [470, 'GATE 3'], [656, 'GATE 4']].forEach(([gx, label]) => {
    p.block(gx - 14, 60, 28, H - 60, '#2a2234', { line: '#1e1828' }); p.vgrad(gx - 12, 62, 24, H - 62, night ? ['#8a6a5a', '#4a3a3a'] : ['#5a4a5a', '#2e2636']);
    p.block(gx - 16, 57, 32, 6, C.navy, { line: false }); p.text(label, gx, 58, C.white, { align: 'center', mini: true });
  });
  // posters: Lumi★ live, the rank season, takoyaki, the cup, the champions' final
  const poster = (x, a, b, t1, t2) => { p.block(x, 61, 22, 14, a, { line: shift(a, -2) }); p.rect(x + 2, 63, 18, 4, b); p.text(t1, x + 11, 63, C.white, { align: 'center', mini: true }); p.text(t2, x + 11, 69, b, { align: 'center', mini: true }); };
  poster(120, '#d84a8a', '#ffe060', 'LUMI', 'LIVE'); poster(160, C.navy, C.neonC, 'RANK', 'S1');
  poster(318, '#e0843e', '#fff0c0', 'TAKO', '¥300'); poster(530, C.navy, C.neonY, 'CUP', '2050'); poster(570, '#5a3a8a', C.neonP, 'QUEEN', 'FINAL');
  return { surf: s, ax: W >> 1, ay: H - 1 };
}
// the jumbotron: LED screen on a truss, speakers either side
function jumbotron(night) {
  const s = newSurf(184, 110), p = new Pen(s, 9);
  // legs + truss
  for (const lx of [56, 124]) { p.rect(lx, 76, 5, 34, '#4a4258'); p.vl(lx, 76, 109, '#6a6278'); for (let y = 80; y < 108; y += 8) p.line(lx + 1, y, lx + 4, y + 6, '#3a3448'); }
  p.rect(48, 106, 21, 4, '#3a3448'); p.rect(116, 106, 21, 4, '#3a3448');
  // speakers
  for (const sx of [2, 162]) { p.block(sx, 18, 20, 44, '#2a2434', { line: '#14101c' }); for (let k = 0; k < 4; k++) { p.ell(sx + 10, 25 + k * 10, 6, 4, '#1a1622'); p.ell(sx + 10, 25 + k * 10, 3, 2, '#3a3448'); p.px(sx + 8, 24 + k * 10, '#5a5468'); } }
  // bezel + screen
  p.block(24, 4, 136, 80, '#2a2434', { line: '#14101c' }); p.hl(24, 159, 4, '#4a4258');
  const X = 28, Y = 8, w = 128, h = 66;
  p.vgrad(X, Y, w, h, ['#1a1a4a', '#2a3a8a', '#6a3a8a', '#e05a6a']);
  // the "live" screen: sun-burst rays, the two trainers' cards, VS, score and clock
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((Math.atan2((j - 36) * 1.5, i - 64) / Math.PI + 1) * 7) % 2 < 1) p.blend(X + i, Y + j, '#a07ad8', 0.22);   // sun-burst
  p.vgrad(X, Y, w, 10, ['#14143a', '#1e2456']);
  p.text('OSAKA LEAGUE', X + 64, Y + 2, C.neonY, { align: 'center' });
  const card = (cx, col, name) => {
    p.block(cx - 18, Y + 16, 36, 34, shift(col, -1.2), { line: '#10101e' }); p.vgrad(cx - 16, Y + 18, 32, 22, [shift(col, 0.6), col]);
    p.ell(cx, Y + 31, 9, 8, shift(col, 1.6)); p.ell(cx - 3, Y + 29, 2, 2, '#10101e'); p.ell(cx + 3, Y + 29, 2, 2, '#10101e'); p.px(cx - 3, Y + 28, C.white); p.px(cx + 3, Y + 28, C.white);
    p.text(name, cx, Y + 41, C.white, { align: 'center' });
  };
  card(X + 26, '#e0603a', 'YOU'); card(X + 102, '#3a8ae0', 'RIVAL');
  p.text('VS', X + 64, Y + 26, C.white, { align: 'center', scale: 2, shadow: '#a02a4a' });
  p.rect(X, Y + h - 12, w, 12, '#0e0e22');
  p.text('0', X + 40, Y + h - 10, C.neonY, { align: 'center' }); p.text('-', X + 64, Y + h - 10, C.white, { align: 'center' }); p.text('0', X + 88, Y + h - 10, C.neonC, { align: 'center' });
  p.text('00:00', X + 124, Y + h - 9, '#ff8a8a', { align: 'right', mini: true }); p.px(X + 4, Y + h - 7, '#ff3a3a'); p.text('LIVE', X + 7, Y + h - 9, '#ff6a6a', { mini: true });
  // LED grid + glass glare
  for (let y = Y; y < Y + h; y += 2) for (let x = X + (y >> 1) % 2; x < X + w; x += 2) s.blend(x, y, '#000000', 0.16);
  for (let k = 0; k < 18; k++) s.blend(X + 8 + k, Y + 14 - (k >> 1), '#ffffff', 0.2);
  // logo plate under the screen
  p.block(70, 84, 44, 9, C.red, { line: '#4a1a1e' }); p.text('UMEDA', 92, 85, C.white, { align: 'center', mini: true });
  return { surf: s, ax: 92, ay: 109 };
}
// floodlight mast: lattice tower with a lamp bank
function mast(night, flip) {
  const s = newSurf(36, 118), p = new Pen(s, 2), cx = 18;
  for (const lx of [cx - 4, cx + 3]) { p.vl(lx, 28, 117, '#6a6478'); p.vl(lx + 1, 28, 117, '#4a4458'); }
  for (let y = 32; y < 116; y += 7) { p.line(cx - 4, y, cx + 4, y + 7, '#5a5468'); p.line(cx + 4, y, cx - 4, y + 7, '#5a5468'); }
  p.rect(cx - 6, 114, 13, 4, '#3a3448');
  p.block(2, 3, 32, 24, '#3a3448', { line: '#1a1622' }); p.hl(2, 33, 3, '#5a5468');
  for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) {
    const lx = 5 + q * 7, ly = 6 + r * 7;
    p.rect(lx, ly, 5, 5, night ? '#fff6d0' : '#c8ccd8'); p.px(lx + 1, ly + 1, night ? '#ffffff' : '#eef0f6'); p.hl(lx, lx + 4, ly + 4, night ? '#ffe08a' : '#9aa0b4');
  }
  p.rect(cx - 2, 27, 5, 3, '#2a2434');
  if (flip) { const t = newSurf(36, 118); for (let y = 0; y < 118; y++) for (let x = 0; x < 36; x++) t.data[y * 36 + x] = s.data[y * 36 + 35 - x]; t.touch(); return { surf: t, ax: 18, ay: 117 }; }
  return { surf: s, ax: 18, ay: 117 };
}
// a concourse food kiosk
function kiosk(label, col, night) {
  const s = newSurf(46, 36), p = new Pen(s, 4);
  p.block(3, 14, 40, 21, '#c8b8a8', { line: '#4a3a3a' });
  p.vgrad(6, 17, 34, 10, night ? ['#ffe0a0', '#e0a060'] : ['#6a5a5a', '#4a3e44']);
  p.rect(3, 27, 40, 3, '#e8dcd0'); p.hl(3, 42, 27, '#fff4e8');
  for (let k = 0; k < 4; k++) p.block(6 + k * 9, 20, 6, 5, k % 2 ? C.orange : C.yellowL, { line: false });   // food on the counter
  for (let i = 0; i < 46; i++) { const c = (i >> 2) % 2 ? col : C.white; p.vl(i, 9, 13, c); p.px(i, 14, shift(c, -1.2)); }   // striped awning
  p.block(8, 1, 30, 8, col, { line: shift(col, -2.2) }); p.text(label, 23, 2, C.white, { align: 'center', mini: true });
  return { surf: s, ax: 23, ay: 35 };
}
// glass railing along the concourse edge
function railing(W) {
  const s = newSurf(W, 10), p = new Pen(s, 3);
  for (let x = 0; x < W; x++) { p.px(x, 1, '#b8b0c4'); p.px(x, 2, '#7a7088'); }
  for (let x = 0; x < W; x += 2) for (let y = 3; y < 9; y++) if ((x + y) % 4 === 0) p.px(x, y, '#9ab8d8');
  for (let x = 4; x < W; x += 24) { p.vl(x, 1, 9, '#6a6478'); p.px(x, 1, '#c8c0d4'); }
  return { surf: s, ax: W >> 1, ay: 9 };
}

// ------------------------------------------------------------------ sprites down on the pitch
const ADS = [
  ['KUMO COLA', '#c8343a', C.white], ['TAKO★TAKO', '#e0843e', '#2a1a1a'], ['NEON RAMEN', '#1e1430', C.neonP], ['TOKON CUP', C.navy, C.neonY],
  ['PIXEL BANK', '#2a6a5a', C.white], ['OKONOMI', '#f0d070', '#7a2a1a'], ['UMEDA RAIL', '#3a3a5a', C.neonC], ['ROCK FM', '#5a2a6a', '#ffb0e0'],
];
function adBoard(i, night) {
  const [label, bg, fg] = ADS[i % ADS.length], s = newSurf(66, 14), p = new Pen(s, i);
  p.block(1, 1, 64, 10, bg, { line: '#14101c' });
  p.text(label, 33, 3, fg, { align: 'center', mini: true });
  for (let y = 2; y < 11; y += 2) for (let x = 2; x < 64; x++) s.blend(x, y, '#000000', night ? 0.08 : 0.14);
  for (let x = 2; x < 64; x += 2) s.blend(x, 2, '#ffffff', 0.18);
  p.rect(6, 12, 2, 2, '#2a2434'); p.rect(58, 12, 2, 2, '#2a2434');
  return { surf: s, ax: 33, ay: 13 };
}
// the players' tunnel: an inflatable concertina tube
function tunnel() {
  const s = newSurf(44, 36), p = new Pen(s, 6);
  for (let k = 0; k < 5; k++) p.block(2 + k, 6 + k * 2, 40 - k * 2, 28 - k * 4, k % 2 ? C.white : C.red, { line: shift(C.red, -2) });
  p.ell(22, 26, 12, 11, '#1a1420'); p.rect(10, 26, 25, 9, '#1a1420'); p.ell(22, 27, 8, 7, '#2e2434');
  p.block(2, 0, 40, 9, C.navy, { line: '#14101c' }); p.text('TAMERS', 22, 1, C.white, { align: 'center' });
  return { surf: s, ax: 22, ay: 35 };
}
// a dugout: perspex shell over a bench of team-coloured seats
function dugout(col) {
  const s = newSurf(52, 26), p = new Pen(s, 8);
  p.block(2, 14, 48, 11, '#4a4458', { line: '#1e1a26' });
  for (let k = 0; k < 6; k++) { p.block(5 + k * 7, 15, 5, 6, col, { line: false }); p.hl(5 + k * 7, 9 + k * 7, 15, shift(col, 1)); }
  for (let x = 2; x < 50; x++) for (let y = 3; y < 15; y++) if (y === 3 || (x * 3 + y) % 7 === 0) p.blend(x, y, '#c8e0f8', y === 3 ? 0.9 : 0.35);
  for (let y = 3; y < 15; y++) { p.blend(2, y, '#c8e0f8', 0.6); p.blend(49, y, '#c8e0f8', 0.6); }
  p.hl(2, 49, 2, '#e8f4ff');
  return { surf: s, ax: 26, ay: 25 };
}
function tripodCam(big) {
  const s = newSurf(22, big ? 32 : 26), p = new Pen(s, 5), h = s.h;
  p.line(11, 13, 3, h - 1, '#3a3a4a'); p.line(11, 13, 19, h - 1, '#3a3a4a'); p.line(11, 13, 11, h - 1, '#4a4a5a');
  p.block(3, 4, 15, 9, '#2a2a36', { line: '#14101c' }); p.rect(17, 6, 4, 5, '#4a4a5a'); p.px(19, 8, '#7af0ff'); p.px(5, 5, '#ff4a4a');
  p.block(5, 1, 6, 3, '#3a3a4a', { line: false }); p.text('7', 13, 6, C.white, { mini: true });
  return { surf: s, ax: 11, ay: h - 1 };
}
function interviewBoard() {
  const s = newSurf(60, 34), p = new Pen(s, 3);
  p.block(1, 1, 58, 26, '#f4eee4', { line: '#3a3040' });
  for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) { const k = (r + q) % 3; p.text(['CH7', 'OL', '★'][k], 10 + q * 14, 4 + r * 8, [C.red, C.navy, C.mustard][k], { align: 'center', mini: true }); }
  p.rect(6, 27, 2, 7, '#5a5468'); p.rect(52, 27, 2, 7, '#5a5468');
  return { surf: s, ax: 30, ay: 33 };
}
function micStand() {
  const s = newSurf(8, 26), p = new Pen(s, 1);
  p.vl(4, 7, 25, '#5a5a6a'); p.rect(1, 24, 7, 2, '#4a4a5a'); p.ell(4, 4, 2.5, 3, '#2a2a36'); p.px(3, 3, '#7a7a8a');
  p.block(1, 8, 6, 4, C.red, { line: false }); p.text('7', 2, 8, C.white, { mini: true });
  return { surf: s, ax: 4, ay: 25 };
}
function cannon() {
  const s = newSurf(16, 18), p = new Pen(s, 3);
  p.block(2, 12, 12, 5, '#3a3448', { line: '#14101c' });
  p.poly([[4, 12], [6, 1], [11, 1], [12, 12]], '#6a5a8a'); p.hl(6, 11, 1, '#9a8aba'); p.vl(6, 2, 11, '#8a7aaa');
  p.px(7, 0, C.neonP); p.px(9, 0, C.neonY); p.px(10, 1, C.neonC); p.px(5, 0, C.neonC);
  return { surf: s, ax: 8, ay: 17 };
}

export function buildStadium(o = {}) {
  const night = !!o.night, W = STADIUM.w, H = STADIUM.h;
  const sc = new Scene2D({ w: W, h: H, viewW: o.viewW || 480, viewH: o.viewH || 270, sun: [0.42, 0.22], shadowAlpha: 0.32 });
  const g = new Pen(sc.ground, 4040);
  sc.terrain = [];
  // ---------------------------------------------------------------- upper concourse (behind the top tier)
  g.rect(0, 0, W, TOP, '#3a3048');
  PR.paving(g, 0, 70, W, TOP - 70, { base: '#a89aae', slab: 12 });
  g.hl(0, W - 1, TOP - 2, '#c8bcd0'); g.hl(0, W - 1, TOP - 1, '#5a5066');
  sc.terrain.push({ y0: -1000, y1: TOP, h0: TIERS * RISE, h1: TIERS * RISE });
  // ---------------------------------------------------------------- stands: 6 tiers stepping down to the pitch
  let y = FIELD_Y;
  const tierTop = [];
  for (let t = 0; t < TIERS; t++) {
    const wallTop = y - RISE, floorTop = wallTop - SEAT;
    tierTop[t] = floorTop;
    if (t === 0) {                     // the padded pitch-side wall with an LED strip
      g.rect(0, wallTop, W, RISE, '#262a4a'); g.hl(0, W - 1, wallTop, '#5a6a9a'); g.hl(0, W - 1, y - 1, '#14162a');
      for (let x = 0; x < W; x += 12) g.vl(x, wallTop + 1, y - 2, '#1e2240');
      g.rect(0, wallTop + 4, W, 7, '#0e1020');
      const msg = 'OSAKA LEAGUE ★ ', mw = g.textW(msg, { mini: true });
      for (let x = 0, k = 0; x < W; x += mw, k++) g.text(msg, x, wallTop + 5, k % 2 ? C.neonC : C.neonY, { mini: true });
    } else {                           // concrete riser: section stripe, row plates, grime
      const base = t % 2 ? '#8a7e90' : '#82768a';
      g.rect(0, wallTop, W, RISE, base);
      g.hl(0, W - 1, wallTop, '#b0a4ba'); g.hl(0, W - 1, wallTop + 1, '#9a8ea4'); g.hl(0, W - 1, y - 1, '#5a5066');
      for (const S of SECT) g.rect(S.x0, wallTop + 5, S.x1 - S.x0, 2, shift(S.seat, -0.3));
      g.drips(0, wallTop + 7, W, 5, shift(base, -0.6), 26);
      SECT.forEach((S, i) => { const lx = S.x0 + 14; g.block(lx, wallTop + 3, 12, 6, '#e8e0f0', { line: '#3a3048' }); g.text(String.fromCharCode(64 + t) + (i + 1), lx + 6, wallTop + 4, '#3a3048', { align: 'center', mini: true }); });
    }
    // seating floor: seat backs, the crowd, then the glass barrier at the front edge
    g.rect(0, floorTop, W, SEAT, '#5e526e'); g.hl(0, W - 1, floorTop, '#7a6e8a');
    for (const S of SECT) for (let x = S.x0 + 1; x < S.x1 - 3; x += 4) { g.rect(x, floorTop + 3, 3, 4, S.seat); g.px(x, floorTop + 3, shift(S.seat, 1)); g.px(x + 2, floorTop + 6, shift(S.seat, -1)); }
    crowdRow(g, 0, W, floorTop + SEAT - 2, t * 13 + 5, night);
    for (let x = 0; x < W; x++) { g.blend(x, floorTop + SEAT - 1, '#b8d0f0', 0.55); if (x % 16 === 0) g.px(x, floorTop + SEAT - 1, '#c8c0d4'); }
    for (const ax of AISLES) {         // stair aisles
      g.rect(ax, floorTop, 10, SEAT + RISE, '#a69ab0');
      for (let k = 0; k < 4; k++) { g.hl(ax, ax + 9, floorTop + k * 7, '#c4b8cc'); g.hl(ax, ax + 9, floorTop + k * 7 + 1, '#867a92'); }
      g.vl(ax, floorTop, y - 1, '#6a5e78'); g.vl(ax + 9, floorTop, y - 1, '#6a5e78'); g.px(ax + 4, floorTop + 5, '#ffe060');
    }
    sc.terrain.push({ y0: wallTop, y1: y, h0: (t + 1) * RISE, h1: t * RISE });                 // riser
    sc.terrain.push({ y0: floorTop, y1: wallTop, h0: (t + 1) * RISE, h1: (t + 1) * RISE });  // seating floor
    y = floorTop;
  }
  // vomitories: tunnel mouths in the risers under green exit lights
  for (const [t, vx] of [[2, 236], [2, 482], [4, 60], [4, 660]]) {
    const wy = tierTop[t] + SEAT;
    g.rect(vx - 3, wy + 1, 6, 2, '#2ac86a'); g.px(vx - 2, wy + 1, '#a8ffc8');
    g.block(vx - 8, wy + 4, 16, RISE - 4, '#1e1828', { line: false }); g.vgrad(vx - 7, wy + 5, 14, RISE - 6, ['#2a2234', '#4a3e54']);
    for (let k = 0; k < 2; k++) g.hl(vx - 6, vx + 5, wy + 8 + k * 3, '#5a4e66');
    sc.glows.push({ x: vx, y: wy + 2, r: 6, color: '#4aff8a', a: 0.35, light: false });
  }
  sc.terrain.push({ y0: FIELD_Y, y1: 100000, h0: 0, h1: 0 });             // the pitch
  // fan banners draped over two tiers in the middle of the home and away ends
  tifo(g, 168, tierTop[3] + 2, 150, 40, '#c8343a', (x, y0) => {
    flame(g, x + 75, y0 + 24, 1.1);
    g.text('OSAKA', x + 30, y0 + 13, C.white, { align: 'center', scale: 2, shadow: '#7a1a22' });
    g.text('BURN!', x + 122, y0 + 13, '#ffe060', { align: 'center', scale: 2, shadow: '#7a1a22' });
  });
  tifo(g, 404, tierTop[3] + 2, 150, 40, '#2e5aa0', (x, y0) => {
    for (let i = 0; i < 150; i += 2) { const wy = y0 + 30 + Math.round(Math.sin(i / 7) * 3); g.px(x + i, wy, C.white); g.px(x + i + 1, wy + 1, '#a8d0ff'); }
    g.ell(x + 75, y0 + 19, 9, 10, '#a8e0ff'); g.poly([[x + 66, y0 + 16], [x + 75, y0 + 3], [x + 84, y0 + 16]], '#a8e0ff'); g.px(x + 72, y0 + 15, C.white); g.px(x + 72, y0 + 16, C.white);
    g.text('MAKE', x + 32, y0 + 10, C.white, { align: 'center', scale: 2, shadow: '#1a2a5a' });
    g.text('WAVES', x + 120, y0 + 10, C.white, { align: 'center', scale: 2, shadow: '#1a2a5a' });
  });
  // the roof shades the top tiers
  g.washPoly([[0, TOP], [W, TOP], [W, tierTop[3]], [0, tierTop[4] + 6]], C.shade, night ? 0.4 : 0.22);
  // ---------------------------------------------------------------- pitch
  for (let j = FIELD_Y; j < H; j++) for (let i = 0; i < W; i++) {
    const stripe = Math.floor((i + 8) / 36) % 2, band = Math.floor((j - FIELD_Y) / 34) % 2;
    g.px(i, j, stripe ? (band ? '#5ea64c' : '#58a048') : (band ? '#52963f' : '#4c903c'));
  }
  g.speckle(0, FIELD_Y, W, H - FIELD_Y, '#6cb85a', 0.02); g.speckle(0, FIELD_Y, W, H - FIELD_Y, '#3e7a34', 0.018); g.blots(0, FIELD_Y, W, H - FIELD_Y, '#478838', 120, 2);
  for (let k = 0; k < 10; k++) g.wash(0, FIELD_Y + k, W, 1, C.shade, 0.5 - k * 0.05);           // contact shade under the wall
  // markings
  const LN = '#f4f2e8', bx = 26, by = FIELD_Y + 42, bw = W - 52, bh = H - FIELD_Y - 56;
  g.frame(bx, by, bw, bh, LN); g.vl(W >> 1, by, by + bh - 1, LN);
  for (const [qx, qy, sx, sy] of [[bx, by, 1, 1], [bx + bw - 1, by, -1, 1], [bx, by + bh - 1, 1, -1], [bx + bw - 1, by + bh - 1, -1, -1]]) for (let a = 0; a <= 8; a++) g.px(qx + Math.round(Math.sin(a / 8 * Math.PI / 2) * 6) * sx, qy + Math.round(Math.cos(a / 8 * Math.PI / 2) * 5) * sy, LN);
  // the battle ring: chalk band, a red/white rope, raked sand, rim lights and the League crest
  const { x: cx, y: cy, rx, ry } = RING;
  g.ell(cx, cy, rx + 10, ry + 7, '#3e7e34'); g.ell(cx, cy, rx + 7, ry + 5, LN); g.ell(cx, cy, rx + 4, ry + 3, '#c8a47a');
  g.ell(cx, cy, rx, ry, '#d8b48a');
  for (let k = 1; k < 6; k++) { const f = 1 - k * 0.15; for (let a = 0; a < 220; a++) { const t = (a / 220) * Math.PI * 2; if ((a + k * 7) % 11 < 7) g.px(Math.round(cx + Math.cos(t) * rx * f), Math.round(cy + Math.sin(t) * ry * f), k % 2 ? '#e2c098' : '#caa47e'); } }
  g.speckle(cx - rx, cy - ry, rx * 2, ry * 2, '#c09a74', 0.025); g.blots(cx - rx * 0.7, cy - ry * 0.6, rx * 1.4, ry * 1.2, '#c49c74', 24, 3);
  for (const [sx, sy] of [[-52, -20], [60, 26], [-18, 40], [84, -30]]) { g.blots(cx + sx - 6, cy + sy - 3, 12, 6, '#8a6a52', 4, 3); g.px(cx + sx, cy + sy, '#5a4438'); }   // scorch marks
  for (let a = 0; a < 180; a++) { const t = (a / 180) * Math.PI * 2; g.px(Math.round(cx + Math.cos(t) * (rx + 2)), Math.round(cy + Math.sin(t) * (ry + 1.5)), (a >> 1) % 2 ? C.red : '#f8f0e0'); }
  for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2, lx = Math.round(cx + Math.cos(t) * (rx + 5.5)), ly = Math.round(cy + Math.sin(t) * (ry + 4)); g.px(lx, ly, '#bffaff'); g.px(lx + 1, ly, '#5ae0f0'); }
  g.ell(cx, cy, 30, 18, '#c8a07a'); g.s.ring(cx, cy, 30, 18, '#f8f0e0'); g.s.ring(cx, cy, 26, 15, '#e0c49a'); g.s.ring(cx, cy, 22, 13, '#f8f0e0');
  g.poly([[cx, cy - 11], [cx + 4, cy - 3], [cx + 13, cy - 3], [cx + 6, cy + 3], [cx + 9, cy + 11], [cx, cy + 6], [cx - 9, cy + 11], [cx - 6, cy + 3], [cx - 13, cy - 3], [cx - 4, cy - 3]], '#f0d8b0');
  g.text('OL', cx, cy - 3, '#b0623e', { align: 'center' });
  // trainer boxes: rival (blue) at the far end, you (red) at the near end
  for (const [ty, col] of [[cy - ry - 30, '#5ab8f0'], [cy + ry + 12, '#ff7a4a']]) {
    g.wash(cx - 24, ty, 48, 18, col, 0.18); g.frame(cx - 24, ty, 48, 18, LN); g.frame(cx - 23, ty + 1, 46, 16, col);
    for (const [qx, qy] of [[cx - 24, ty], [cx + 23, ty], [cx - 24, ty + 17], [cx + 23, ty + 17]]) g.px(qx, qy, C.white);
  }
  // confetti from the last match, and a cable run to the reporters' corner
  for (let k = 0; k < 160; k++) { const a = hash(k, 3); g.px(40 + (a % (W - 80)), FIELD_Y + 50 + ((a >> 9) % (H - FIELD_Y - 70)), [C.neonP, C.neonY, C.neonC, C.white, C.orange][a % 5]); }
  for (let x = 40; x < 200; x++) g.px(x, 572 + Math.round(Math.sin(x / 26) * 2), '#2a2a36');

  // ---------------------------------------------------------------- sprites
  sc.add(crown(W, night), W >> 1, 76, { solid: false });
  sc.add(railing(W), W >> 1, TOP - 1, { solid: false, shadow: false });
  sc.add(jumbotron(night), W >> 1, 106, { solid: false });
  sc.add(kiosk('TAKOYAKI', C.red, night), 168, 112, { solid: false });
  sc.add(kiosk('DRINKS', C.blue, night), 552, 112, { solid: false });
  sc.add(mast(night, false), 20, 114, { solid: false });
  sc.add(mast(night, true), W - 20, 114, { solid: false });
  for (let i = 0, x = 140; x < W - 20; x += 66, i++) sc.add(adBoard(i, night), x, FIELD_Y + 12, { solid: false });
  sc.add(tunnel(), 66, FIELD_Y + 36, { solid: false });
  sc.add(dugout('#d8483a'), 200, FIELD_Y + 38, { foot: [22, 5] });
  sc.add(dugout('#3a7ad8'), 520, FIELD_Y + 38, { foot: [22, 5] });
  sc.add(tripodCam(true), 610, FIELD_Y + 36, { foot: [6, 3] });
  sc.add(tripodCam(false), 60, 540, { foot: [6, 3] });
  sc.add(tripodCam(true), 660, 548, { foot: [6, 3] });
  sc.add(interviewBoard(), 116, 580, { foot: [26, 4] });
  sc.add(micStand(), 100, 588, { solid: false });
  for (const kx of [30, W - 30]) sc.add(cannon(), kx, FIELD_Y + 48, { foot: [6, 3] });
  sc.add(PR.bench(), 300, FIELD_Y + 34, { solid: false }); sc.add(PR.bench(), 420, FIELD_Y + 34, { solid: false });
  const dr = PR.drone(); sc.add({ surf: dr.surf, ax: dr.ax, ay: dr.ay + 46 }, 452, 372, { solid: false, shadow: false });

  // ---------------------------------------------------------------- light: halos for bloom; at night the masts light the pitch in 3D
  for (const mx of [20, W - 20]) sc.glows.push({ x: mx, y: 14, r: night ? 70 : 34, color: '#fff6d0', a: night ? 0.75 : 0.25, light: false });
  sc.glows.push({ x: W >> 1, y: 45, r: 80, color: '#7a8aff', a: night ? 0.45 : 0.18, light: false });
  if (night) {
    for (let x = 140; x < W - 20; x += 66) sc.glows.push({ x, y: FIELD_Y + 6, r: 22, color: '#ffd0f0', a: 0.22, light: false });
    for (let x = 30; x < W; x += 60) sc.glows.push({ x, y: 42, r: 26, color: '#ffc880', a: 0.25, light: false });
  }
  sc.lights3d = night ? [
    ...[[150, FIELD_Y + 80], [570, FIELD_Y + 80], [150, 540], [570, 540], [360, 430]].map(([x, ly]) => ({ x, y: ly, h: 170, color: '#fff2d8', power: 3.6, dist: 560 })),
    ...[[180, 200], [540, 200]].map(([x, ly]) => ({ x, y: ly, h: 140, color: '#ffe8c8', power: 2.4, dist: 420 })),
  ] : [];
  sc.bake();
  return sc;
}

export const STADIUM_MAP = {
  name: 'Osaka League Stadium', music: 'league', ambience: 'stadium', ambientFx: null, unlock: 'league',
  build(o) {
    const scene = buildStadium({ viewW: o.viewW, viewH: o.viewH, night: o.night });
    const W = STADIUM.w, H = STADIUM.h;
    return {
      scene, terrain: scene.terrain,
      walk: [[[34, FIELD_Y + 46], [W - 34, FIELD_Y + 46], [W - 34, H - 12], [34, H - 12]]],
      block: [],
      spawns: { start: [70, FIELD_Y + 62], ring: [RING.x, RING.y + 30], tunnel: [70, FIELD_Y + 62] },
      hotspots: [
        { id: 'jumbotron', x: W >> 1, y: FIELD_Y + 56, r: 34, label: 'Jumbotron', icon: 'eye', act: (app) => app.say('Announcer', 'Welcome to the OSAKA LEAGUE! Today\'s rank matches start at 14:00 — trainers, report to the ring!') },
        { id: 'reporter', x: 150, y: 582, r: 26, label: 'Reporter', icon: 'talk', act: (app) => app.say('Reporter', 'Channel 7 Sports! Any words for the fans? …"Chili"? Bold. I love it.') },
        { id: 'tunnel', x: 66, y: FIELD_Y + 52, r: 22, label: 'Exit', icon: 'door', act: (app) => app.travel('plaza', 'subway') },
      ],
      exits: [], npcs: [],
    };
  },
};
