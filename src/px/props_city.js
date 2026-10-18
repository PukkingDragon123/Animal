// Street-life props for the city maps (Eastward-style clutter): a takoyaki yatai,
// capsule-toy machines, a roadside jizo shrine, planter beds, recycling bins, beer
// crates, a bus stop, a sleeping stray cat — plus ground details painted straight
// onto the paving: tactile paving, drain grates, chalk hopscotch, fallen leaves and
// posters on walls.
import { Pen, C, shift, mix, newSurf } from './paint.js';
import * as PR from './props.js';

const sprite = (w, h, ax, ay, fn, seed = 5) => { const s = newSurf(w, h), p = new Pen(s, seed); fn(p); return { surf: s, ax, ay }; };

// a red octopus mascot (for the takoyaki stall roof and its noren)
function octo(p, x, y, c = C.red) {
  p.ell(x + 5, y + 3.5, 4.6, 3.8, c); p.ell(x + 4, y + 2.5, 2, 1.4, shift(c, 1.2));
  for (let k = 0; k < 4; k++) { const lx = x + 1 + k * 3; p.vl(lx, y + 6, y + 8, c); p.px(lx + (k % 2 ? 1 : -1), y + 9, c); }
  p.px(x + 3, y + 3, C.ink); p.px(x + 7, y + 3, C.ink); p.hl(x + 4, x + 6, y + 5, shift(c, -1.5));
  p.rect(x + 2, y, 7, 1, C.white); p.px(x + 1, y + 1, C.white); p.px(x + 9, y + 1, C.white);   // hachimaki headband
}

// takoyaki yatai: a wooden cart with a griddle of golden balls, striped awning, navy noren, lanterns
export function takoyakiStall(o = {}) {
  const night = !!o.night;
  return sprite(72, 74, 36, 73, (p) => {
    // wheels
    for (const wx of [14, 58]) { p.s.ring(wx, 67, 6, 6, C.ink2); p.s.ring(wx, 67, 5, 5, C.wood2); for (let a = 0; a < 6; a++) p.line(wx, 67, Math.round(wx + Math.cos(a) * 4), Math.round(67 + Math.sin(a) * 4), C.wood); p.px(wx, 67, C.metalL); }
    // cart body: planks + a red banner with the shop name
    p.block(6, 46, 60, 18, C.wood, { line: C.ink2 });
    for (let y = 50; y < 63; y += 4) p.hl(7, 64, y, C.wood2);
    for (const x of [7, 64]) p.vl(x, 47, 62, C.woodL);
    p.block(12, 49, 48, 11, C.red, { line: '#5a1a1e' }); p.text('TAKOYAKI', 36, 52, C.white, { align: 'center', mini: true });
    octo(p, 14, 50, '#ffd0a0');
    // counter + griddle with two rows of takoyaki
    p.block(4, 41, 64, 5, C.woodL, { line: C.ink2 }); p.hl(5, 66, 41, '#d8a878');
    p.block(14, 36, 30, 6, '#3a3038', { line: C.ink });
    for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { const bx = 17 + k * 4.4, by = 37.5 + r * 2.6; p.ell(bx, by, 1.8, 1.3, '#c8782e'); p.px(Math.round(bx) - 1, Math.round(by) - 1, '#f0c070'); }
    p.block(48, 37, 14, 4, C.cream, { line: C.ink2 }); p.hl(49, 60, 38, '#7a4a2a'); p.px(52, 38, C.greenL); p.px(56, 38, C.greenL);   // a boat of takoyaki with sauce
    // steam
    for (const [sx, sy] of [[20, 30], [27, 27], [34, 31], [24, 23], [31, 21]]) { p.px(sx, sy, '#f4f0f0'); p.px(sx + 1, sy - 1, '#e0dce8'); }
    // posts
    for (const x of [7, 64]) { p.rect(x, 22, 2, 20, C.wood2); p.vl(x, 22, 41, C.woodL); }
    // awning: red/white stripes, scalloped hem
    for (let x = 1; x < 71; x++) { const c = (x >> 2) % 2 ? C.red : C.white, top = 12 + Math.round(Math.abs(x - 36) / 12); p.vl(x, top, 21, c); p.px(x, 22 + ((x >> 1) % 2), c); p.px(x, top, shift(c, 0.8)); p.px(x, 21, shift(c, -1)); }
    p.hl(1, 70, 11 + 0, C.ink2); for (let x = 1; x < 71; x++) p.px(x, 12 + Math.round(Math.abs(x - 36) / 12) - 1, C.ink2);
    // noren: four navy panels with the octopus crest
    for (let k = 0; k < 4; k++) { const nx = 11 + k * 13; p.block(nx, 23, 11, 9, C.navy, { line: '#14182e' }); p.hl(nx, nx + 10, 24, '#4a5688'); }
    p.px(23, 27, C.white); p.px(24, 26, C.white); p.px(25, 27, C.white); p.px(48, 27, C.white); p.px(49, 26, C.white); p.px(50, 27, C.white);
    // lanterns at the corners
    PR.lantern(p, 2, 24, { color: C.red }); PR.lantern(p, 63, 24, { color: C.red });
    if (night) { p.px(5, 30, '#fff0b0'); p.px(66, 30, '#fff0b0'); }
    // octopus mascot on the roof
    octo(p, 30, 1);
  }, 31);
}
export function stool(c = C.red) {
  return sprite(10, 10, 5, 9, (p) => { p.vl(5, 4, 9, C.metal2); p.hl(3, 7, 9, C.metal2); p.ell(5, 3, 4, 2, c); p.hl(3, 6, 2, shift(c, 1)); p.hl(2, 8, 4, shift(c, -1.2)); });
}
// a row of capsule-toy machines on a little stand
export function gachaRow(n = 4) {
  const cols = [C.red, C.blue, C.mustard, C.teal, C.orange];
  return sprite(n * 13 + 3, 30, (n * 13 + 3) >> 1, 29, (p) => {
    p.block(1, 25, n * 13 + 1, 4, '#5a5068', { line: C.ink2 });
    for (let k = 0; k < n; k++) {
      const x = 2 + k * 13, c = cols[k % cols.length];
      // dome with capsules
      p.ell(x + 5.5, 7, 5.5, 5.5, '#c8dcec'); p.s.ring(x + 5.5, 7, 5.5, 5.5, '#5a6a8a');
      for (let j = 0; j < 7; j++) { const cx = x + 3 + ((j * 7 + k * 3) % 6), cy = 6 + ((j * 5 + k) % 5); p.px(cx, cy, cols[(j + k + 1) % cols.length]); p.px(cx + 1, cy, C.white); }
      p.px(x + 3, 4, C.white); p.px(x + 2, 5, C.white);
      // body
      p.block(x, 12, 11, 13, c, { line: shift(c, -2.4) });
      p.rect(x + 2, 14, 7, 3, C.white); p.hl(x + 3, x + 7, 15, shift(c, -0.6));
      p.ell(x + 5.5, 19.5, 2.2, 2.2, '#e8e8f0'); p.px(x + 5, 19, '#8a8aa0'); p.px(x + 6, 20, '#8a8aa0');
      p.rect(x + 3, 22, 5, 2, '#2a2230');
    }
  }, 12);
}
// roadside jizo shrine: two stone jizo in red bibs under a little roof, offerings in front
export function jizoShrine() {
  return sprite(36, 38, 18, 37, (p) => {
    // posts + roof
    for (const x of [4, 30]) { p.rect(x, 12, 2, 22, C.wood2); p.vl(x, 12, 33, C.wood); }
    p.poly([[1, 13], [18, 3], [35, 13], [33, 15], [18, 6], [3, 15]], '#4a3e5a');
    p.poly([[3, 13], [18, 5], [33, 13]], '#5c4e70'); p.line(3, 13, 18, 5, '#7a6c8e');
    p.hl(1, 34, 14, C.ink2); p.px(18, 2, C.mustard);
    p.rect(5, 15, 26, 1, '#7a2a2a'); for (let x = 6; x < 30; x += 4) { p.vl(x, 16, 18, C.white); p.px(x + 1, 18, C.white); }   // shide paper streamers
    // stone base
    p.block(5, 32, 26, 5, '#8a8494', { line: '#4a4458' }); p.hl(6, 29, 32, '#b0aab8');
    // two jizo
    for (const [jx, h] of [[12, 0], [24, 2]]) {
      p.ell(jx, 26 + h / 2, 4.6, 6 - h / 2, '#a8a2b0'); p.ell(jx - 1, 24 + h / 2, 2.6, 3.5, '#c4bec8');
      p.ell(jx, 18 + h, 3.4, 3.4, '#b4aebc'); p.px(jx - 1, 17 + h, '#d8d2dc'); p.hl(jx - 2, jx - 1, 19 + h, '#5a5466'); p.hl(jx + 1, jx + 2, 19 + h, '#5a5466');
      p.poly([[jx - 4, 22 + h], [jx + 4, 22 + h], [jx, 28 + h]], C.red); p.hl(jx - 3, jx + 3, 22 + h, C.redL);
      if (!h) { p.ell(jx, 15.5, 3.5, 2, C.red); p.px(jx, 13, C.white); }   // knitted cap
      p.s.ring(jx, 18 + h, 3.4, 3.4, '#6a6478');
    }
    // offerings: a cup, two mikan, flowers in bamboo
    p.block(16, 33, 4, 3, C.white, { line: C.ink2 });
    p.ell(9, 34, 1.6, 1.4, C.orange); p.ell(27, 34, 1.6, 1.4, C.orange); p.px(9, 33, C.yellowL);
    p.rect(31, 27, 3, 7, C.greenL); p.px(31, 26, C.redL); p.px(33, 25, C.white); p.px(32, 25, C.yellowL);
  }, 7);
}
// raised planter bed spilling with leaves and flowers
export function planter(w = 60, o = {}) {
  const H = 30;
  return sprite(w + 4, H, (w + 4) >> 1, H - 1, (p) => {
    const by = H - 10;
    // plants: leaf clumps back-to-front, grass blades, flowers
    const leaf = o.leaf || C.green, dark = shift(leaf, -1.6), mid = shift(leaf, -0.6), lite = shift(leaf, 0.6), hi = shift(leaf, 1.5);
    const clumps = []; for (let k = 0; k < Math.round(w / 5); k++) clumps.push([4 + p.rand(0, w - 4), by - p.rand(1, 9), p.rand(3.5, 6.5)]);
    clumps.sort((a, b) => a[1] - b[1]);
    for (const [cx, cy, r] of clumps) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = (i * i + j * j) / (r * r) + (p.r() - 0.5) * 0.25; if (d > 1) continue;
      const l = -(i * 0.6 + j * 0.8) / r; p.px(Math.round(cx + i), Math.round(cy + j), d > 0.75 && i + j > 0 ? dark : l > 0.5 ? hi : l > 0 ? lite : l > -0.45 ? mid : dark);
    }
    for (let k = 0; k < w / 3; k++) { const x = 3 + p.ri(0, w - 2), h = p.ri(3, 8); p.line(x, by, x + p.ri(-2, 2), by - h, p.chance(0.5) ? lite : mid); }
    const fl = o.flowers || [C.redL, C.yellowL, C.white, '#ff9ac8'];
    for (let k = 0; k < w / 4; k++) { const x = 4 + p.ri(0, w - 4), y = by - p.ri(2, 11), c = p.pick(fl); p.px(x, y, c); p.px(x + 1, y, shift(c, -0.8)); p.px(x, y - 1, shift(c, 0.8)); }
    // the bed (concrete with a timber cap)
    p.block(1, by, w + 2, 9, '#a8988c', { line: '#4a3e40' }); p.rect(1, by, w + 2, 2, C.woodL); p.hl(1, w + 2, by + 2, C.wood2);
    p.drips(2, by + 3, w, 5, '#8a7a72', 6);
    for (let k = 0; k < w / 8; k++) { const x = 2 + p.ri(0, w - 2); p.line(x, by + 1, x + p.ri(-1, 1), by + p.ri(4, 8), mid); }   // trailing leaves
  }, o.seed || 11);
}
export function recyclingBins() {
  const cols = [[C.blue, 'CAN'], [C.green, 'PET'], [C.mustard, 'BIN']];
  return sprite(30, 18, 15, 17, (p) => cols.forEach(([c, t], k) => {
    const x = 1 + k * 10;
    p.block(x, 4, 8, 13, c, { line: shift(c, -2.4) }); p.rect(x, 3, 8, 2, shift(c, 0.6)); p.ell(x + 4, 7, 2, 1.2, '#1e1a26');
    p.rect(x + 1, 11, 6, 3, C.white); p.text(t, x + 4, 11, shift(c, -1.5), { align: 'center', mini: true });
  }), 3);
}
export function beerCrates(n = 3) {
  return sprite(18, n * 7 + 3, 9, n * 7 + 2, (p) => {
    for (let k = 0; k < n; k++) {
      const y = 2 + (n - 1 - k) * 7, x = 1 + (k % 2);
      p.block(x, y, 15, 7, '#f0c030', { line: '#7a5410' });
      for (let i = 0; i < 4; i++) p.rect(x + 2 + i * 3, y + 2, 2, 3, '#b8840e');
      for (let i = 0; i < 4; i++) p.px(x + 2 + i * 3, y + 1, '#2a6a3a');      // bottle caps peeking out
    }
  }, 4);
}
export function busStop() {
  return sprite(16, 46, 8, 45, (p) => {
    p.rect(7, 12, 2, 33, C.metal2); p.vl(7, 12, 44, C.metalL); p.rect(5, 43, 6, 2, C.steel);
    p.ell(8, 7, 6.5, 6.5, '#2a64c4'); p.s.ring(8, 7, 6.5, 6.5, '#e8ecf4'); p.rect(5, 4, 7, 5, C.white); p.rect(6, 5, 5, 2, '#2a64c4'); p.px(6, 9, C.ink); p.px(10, 9, C.ink);
    p.block(3, 22, 10, 12, C.white, { line: C.ink2 }); for (let y = 24; y < 33; y += 2) p.hl(5, 11, y, '#8a8aa0');
  }, 2);
}
// a stray cat curled up asleep (put it on top of something with `lift`)
export function cat(o = {}) {
  const c = o.color || '#e8963e', d = shift(c, -1.2), l = shift(c, 1);
  return sprite(16, 9, 8, 8 + (o.lift || 0), (p) => {
    p.ell(9, 5, 6, 3.3, c); p.ell(8, 4, 4, 1.8, l);
    for (const x of [7, 10, 13]) p.vl(x, 3, 5, d);
    p.ell(4, 5, 3.2, 2.8, c); p.px(2, 2, c); p.px(1, 1, d); p.px(5, 2, c); p.px(6, 1, d);
    p.hl(2, 3, 5, '#3a2020'); p.hl(5, 6, 5, '#3a2020'); p.px(4, 6, '#ff9a9a');
    p.hl(4, 14, 8, d); p.px(15, 7, d); p.px(3, 8, l);
    p.outline('#3a2018');
  }, 9);
}
// ---------------------------------------------------------------- ground details (painted on the paving)
export function tactilePaving(g, x, y0, y1) {
  g.rect(x, y0, 6, y1 - y0, '#e8c040'); g.vl(x, y0, y1 - 1, '#f6d868'); g.vl(x + 5, y0, y1 - 1, '#b8901e');
  for (let y = y0 + 1; y < y1 - 1; y += 3) { g.px(x + 1, y, '#c8a028'); g.px(x + 4, y, '#c8a028'); g.px(x + 2, y + 1, '#c8a028'); }
}
export function drainGrate(g, x0, x1, y) {
  g.rect(x0, y, x1 - x0, 3, '#5a5466'); g.hl(x0, x1 - 1, y, '#8a849a');
  for (let x = x0 + 1; x < x1 - 1; x += 3) g.vl(x, y + 1, y + 2, '#26202e');
}
export function hopscotch(g, x, y) {
  const ch = '#f4f2ea', cells = [[0, 0, 1], [0, 1, 2], [-0.5, 2, 3], [0.5, 2, 4], [0, 3, 5], [-0.5, 4, 6], [0.5, 4, 7], [0, 5, 8]];
  for (const [cx, cy, n] of cells) {
    const X = Math.round(x + cx * 12), Y = y - cy * 10;
    g.frame(X, Y, 12, 10, ch); for (let k = 0; k < 6; k++) g.blend(X + g.ri(1, 10), Y + g.ri(1, 8), ch, 0.3);
    g.text(String(n), X + 4, Y + 3, ch, { mini: true });
  }
  g.ell(x + 6, y - 64, 6, 5, ch); g.ell(x + 6, y - 64, 5, 4, mix(ch, '#b8a088', 0.5));   // the home circle
}
export function fallenLeaves(g, x, y, r, cols, n = 40) {
  for (let k = 0; k < n; k++) { const a = g.rand(0, Math.PI * 2), d = Math.sqrt(g.r()) * r, X = Math.round(x + Math.cos(a) * d), Y = Math.round(y + Math.sin(a) * d * 0.5), c = g.pick(cols); g.px(X, Y, c); if (g.chance(0.5)) g.px(X + 1, Y, shift(c, -0.7)); }
}
// posters, flyers and a graffiti tag on a wall face
export function wallPosters(g, x, y, o = {}) {
  const posters = o.posters || [['LOST', '#f4ecd8', C.red], ['LIVE', '#2a2a4a', C.neonP], ['RANK', C.navy, C.neonC], ['MOCHI', '#fff0e0', '#4a8a3a']];
  posters.forEach(([t, bg, fg], k) => {
    const px = x + k * 16 + (k % 2) * 2, py = y + (k % 3);
    g.block(px, py, 13, 16, bg, { line: shift(bg, -2), bevel: false }); g.rect(px + 2, py + 2, 9, 5, shift(fg, -0.3)); g.text(t, px + 6, py + 9, fg, { align: 'center', mini: true });
    g.px(px + 6, py, '#c8c8d0'); if (k % 2) g.px(px + 12, py + 15, shift(bg, -1));
  });
  if (o.tag) { const tx = x + posters.length * 16 + 6, ty = y + 6, c = o.tag; for (let k = 0; k < 18; k++) g.px(tx + k, ty + Math.round(Math.sin(k * 0.8) * 3), c); g.line(tx + 3, ty - 4, tx + 6, ty + 6, c); g.line(tx + 11, ty - 3, tx + 13, ty + 6, c); g.px(tx + 19, ty - 1, c); }
}
