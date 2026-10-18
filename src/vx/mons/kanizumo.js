// Kanizumo — Coach Gonda's partner (Hydro/Geo). A big red crab standing up on its
// hind legs like a sumo wrestler in the crouch before the charge — and a wink at the
// B-52's "Rock Lobster": its topknot is a towering, lacquered black beehive, and its
// mawashi is loud debut-cover yellow with turquoise stripes and turquoise-dipped sagari.
// A cream sumo belly hangs over the belt; two huge pincers are worn like flat open palms
// for slapping; little walking legs line the shell; big bright eyes ride on stalks; a
// jutting jaw foams bubbles; the stern face of a Heike crab is embossed on its back.
// Calm and heavy in the ring — until the party starts, and then it shimmies. Its special
// blasts a huge bubble from its palms; its entrance is a ground-cracking shiko stomp.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, gradient, poly, ramp, shift, h2 } from './kit.js';

const C = {
  shell: '#d23a38', shellHi: '#f6765a', shellLo: '#982438', deep: '#5c1430', shine: '#ffc0a2',
  belly: '#ffd8a6', bellyHi: '#fff0d2', bellyLo: '#e2a274', bellyLine: '#c8886a',
  palm: '#ffd4b4', palmHi: '#fff0de', palmLo: '#eaa286', palmLine: '#c87668',
  belt: '#ffcc2e', beltHi: '#fff07a', beltLo: '#d8941a', beltDeep: '#9a5e12',
  ribbon: '#e42a48', ribbonHi: '#ff7a86', ribbonLo: '#981432', rose: '#ff5a8a', roseHi: '#ffb0c8', roseLo: '#b82a5a', leaf: '#4aa83e', leafLo: '#2a6a2c',
  turq: '#28bcc0', turqHi: '#86f0e6', turqLo: '#167c8c',
  cord: '#f6f6fc', cordLo: '#c6cae2', cordDeep: '#8e94bc',
  hair: '#282038', hairHi: '#6c62a8', hairLo: '#100c1c', hairGl: '#b0a8e8',
  tip: ['#8e4250', '#5e2638', '#3c1428', '#240a18'],
  ink: '#1e0c18', white: '#ffffff', eyeLo: '#d4d0e2', glint: '#7a96e0',
  mouth: '#3a0c1a',
};
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- painters
// crab shell: clean red bands, a lit rim, sparse raised tubercles (a lit dot over a shadow dot)
function crab(c = C.shell, o = {}) {
  const top = o.top || C.shellHi, bot = o.bottom || C.shellLo, base = shade(c, { top, bottom: bot, grain: 0 }), every = o.every || 6;
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'down' || o.bumps === false) return;
    for (let y = 2; y < h - 2; y += every) for (let x = 1 + ((y / every) & 1) * (every >> 1); x < w - 1; x += every) {
      const j = h2(x, y, o.seed || 5); if (j < 0.34) continue;
      const X = x + (j > 0.8 ? 1 : 0), col = face === 'up' ? top : ramp([top, c, bot], y / Math.max(1, h - 1), X, y);
      p.px(X, y, shift(col, 0.34)); p.px(X + 1, y, shift(col, 0.14)); p.px(X, y + 1, shift(col, -0.2)); p.px(X + 1, y + 1, shift(col, -0.32));
    }
  };
}
const shellP = crab();
const shellDark = crab(shift(C.shell, -0.1), { top: C.shell, bottom: C.deep });
// the top of the carapace: the H-shaped groove of a crab's back between the regions, and its tubercles
function crownP(p, w, h, face, cube) {
  shellP(p, w, h, face, cube);
  if (face !== 'up') return;
  const m = w / 2, G = shift(C.shellHi, -0.35);
  for (const s of [-1, 1]) { for (let y = 2; y < h - 2; y++) p.px(Math.round(m + s * (w * 0.16 + Math.abs(y - h / 2) * 0.35)), y, G); }
  for (let x = Math.round(m - w * 0.16); x <= Math.round(m + w * 0.16); x++) p.px(x, Math.round(h * 0.55), G);
  for (const [fx, fy] of [[0.3, 0.3], [0.7, 0.3], [0.5, 0.25], [0.24, 0.7], [0.76, 0.7]]) { const x = Math.round(fx * w), y = Math.round(fy * h); p.px(x, y, C.shine); p.px(x + 1, y + 1, shift(C.shellHi, -0.2)); }
}
// the stern Heike-crab "game face" embossed on the back of the shell: grooves with lit lips
function heike(p, w, h, face, cube) {
  shellP(p, w, h, face, cube);
  if (face !== 'north') return;
  const G = C.deep, M = shift(C.shellLo, -0.1), L = C.shine, sx = w / 60, sy = h / 30;
  const S = (pts) => pts.map(([x, y]) => [x * sx, y * sy]);
  const groove = (pts, c = G) => { poly(p, S(pts), c); };
  const lip = (x0, y0, x1, y1) => p.line(Math.round(x0 * sx), Math.round(y0 * sy), Math.round(x1 * sx), Math.round(y1 * sy), L);
  for (const m of [1, -1]) {
    const X = (x) => (m > 0 ? x : 60 - x);
    groove([[X(5), 6], [X(10), 3.5], [X(27.5), 12.5], [X(26.5), 15.5]]);               // brows sloping down to the middle
    lip(X(9), 3, X(26), 11);
    groove([[X(14), 15.5], [X(19), 13.6], [X(24), 15.5], [X(22.5), 18.5], [X(15.5), 18.5]], M);   // eye hollows
    p.px(Math.round(X(19) * sx), Math.round(16 * sy), G); p.px(Math.round(X(20) * sx), Math.round(16 * sy), G);
    groove([[X(9), 12], [X(10.5), 12], [X(15), 24], [X(13.5), 24.5]]);               // cheek creases
  }
  groove([[28.6, 13], [31.4, 13], [31.4, 19.5], [28.6, 19.5]], M);                    // nose ridge
  p.px(Math.round(28 * sx), Math.round(20 * sy), G); p.px(Math.round(32 * sx), Math.round(20 * sy), G);
  groove([[14, 27.5], [30, 21.5], [46, 27.5], [44, 29], [30, 24], [16, 29]]);          // the frown
  lip(17, 29.5, 29, 25.5); lip(31, 25.5, 43, 29.5);
}
// cream underside: soft round light (upper left) falling into shadow at the edges and underneath — no rim, it's skin
const roundP = (o = {}) => (p, w, h, face) => {
  if (face !== 'south') {
    const top = face === 'up' ? (o.topC || C.belly) : C.belly;
    shade(face === 'up' ? top : C.bellyLo, { top, bottom: shift(C.bellyLo, -0.14), grain: 0, rim: false })(p, w, h, face);
    return;
  }
  const cx = w * (o.cx ?? 0.44), cy = h * (o.cy ?? 0.32), T = [C.bellyHi, C.belly, C.bellyLo, shift(C.bellyLo, -0.14)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.sqrt(((x - cx) / (w * 0.52)) ** 2 + ((y - cy) / (h * (o.ry ?? 0.8))) ** 2);
    const t = Math.min(3, d * (o.k ?? 2.6)), i = Math.floor(t), f = t - i;
    p.px(x, y, f > 0.82 && i < 3 && ((x + y) & 1) ? T[i + 1] : T[i]);
  }
  if (o.fn) o.fn(p, w, h);
};
// the gut: round and heavy, with a navel low down
const gutP = roundP({ cy: 0.36, ry: 0.85, k: 2.5, fn: (p, w, h) => {
  const nx = Math.round(w / 2) - 1, ny = Math.round(h * 0.66);
  p.rect(nx, ny, 2, 3, C.bellyLine); p.px(nx, ny, shift(C.bellyLine, -0.35)); p.px(nx + 1, ny, shift(C.bellyLine, -0.2));
  p.px(nx, ny + 3, C.bellyHi); p.px(nx + 1, ny + 3, C.bellyHi); p.px(nx - 1, ny + 1, C.bellyLo); p.px(nx + 2, ny + 2, C.bellyLo);
} });
const gutSideP = roundP({ cy: -0.2, ry: 1.2, k: 3.2, topC: C.bellyLo });
const gutTopP = roundP({ cy: 0.9, ry: 1.4, k: 2.2, topC: C.bellyLo });
// the chest: two heavy pecs with a groove between and a crease under each
const chestP = roundP({ cy: 0.36, ry: 0.9, under: 0, fn: (p, w, h) => {
  const m = Math.floor(w / 2);
  for (let y = 1; y < h * 0.55; y++) { p.px(m - 1, y, C.bellyLine); p.px(m, y, C.bellyHi); }
  for (const s of [-1, 1]) for (let k = 0; k < w * 0.36; k++) { const x = m + s * (2 + k), y = Math.round(h * 0.62 + (k / (w * 0.36)) ** 2 * h * 0.2 - 1); p.px(x, y, C.bellyLine); p.px(x, y - 1, C.bellyLo); p.px(x, y + 1, C.bellyHi); }
} });
// palm: a slapping pad of pale shell framed by red, rounded at the corners
function palmP(p, w, h, face, cube) {
  shellP(p, w, h, face, cube);
  if (face !== 'south') return;
  const x0 = 3, x1 = w - 4, y0 = 4, y1 = h - 3;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const cx = Math.min(x - x0, x1 - x), cy = Math.min(y - y0, y1 - y); if (cx + cy < 2) continue;
    const edge = cx === 0 || cy === 0 || cx + cy === 2;
    p.px(x, y, edge ? (y > (y0 + y1) / 2 || x > (x0 + x1) / 2 ? C.palmLine : C.palmLo) : ramp([C.palmHi, C.palm, C.palmLo], (y - y0) / (y1 - y0), x, y));
  }
  for (let x = x0 + 3; x <= x1 - 3; x += 3) p.px(x, y0 + 2, C.palmHi);
}
// brow: the front rim of the shell, a hard ledge above the mouth
const browP = (p, w, h, face, cube) => { crab(C.shell, { top: C.shellHi, bottom: C.deep, bumps: false })(p, w, h, face, cube); if (face === 'south') for (let x = 0; x < w; x++) p.px(x, h - 1, C.deep); };
// fingers: shell with a row of light nubs on the cutting edge (inner side)
const finger = (inner) => (p, w, h, face, cube) => {
  shellP(p, w, h, face, cube);
  if (face === inner) for (let y = 2; y < h - 1; y += 3) { p.px(Math.floor(w / 2), y, C.shine); p.px(Math.floor(w / 2), y + 1, C.shellLo); }
};
const tipP = gradient(C.tip);
// legs: shell segments with small spines along the top and a darker joint band at the far end
const legP = (end = 'east') => (p, w, h, face, cube) => {
  shade(C.shell, { top: C.shellHi, bottom: C.shellLo, grain: 0 })(p, w, h, face, cube);
  if (face === 'up' || face === 'down') return;
  for (let x = 2; x < w - 2; x += 4) { p.px(x, 1, C.shine); p.px(x + 1, 1, C.shellHi); p.px(x, 2, C.shellLo); }
  if (face === 'south' || face === 'north') { const X = (face === 'south') === (end === 'east') ? w - 2 : 1; for (let y = 1; y < h - 1; y++) p.px(X, y, C.shellLo); }
};
// the mawashi: loud yellow silk with a turquoise stripe through the middle and turquoise piping
const beltP = (p, w, h, face) => {
  shade(C.belt, { top: C.beltHi, bottom: C.beltLo, grain: 0 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  const m = Math.round(h * 0.5);
  for (let x = 0; x < w; x++) {
    p.px(x, m - 2, C.turqHi); p.px(x, m - 1, C.turq); p.px(x, m, C.turq); p.px(x, m + 1, C.turqLo);
    if (h > 9) { p.px(x, 1, C.turq); p.px(x, h - 2, C.turqLo); }
  }
};
// sagari: stiff white cords dipped turquoise at the ends
const cordP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dip = y > h * 0.62, side = face === 'east' || face === 'north';
    let c = dip ? (side ? C.turqLo : x === 0 ? C.turqHi : C.turq) : side ? C.cordLo : x === 0 ? C.white : C.cord;
    if (!dip && y % 6 === 5) c = C.cordLo;
    if (y >= h - 1) c = C.turqLo;
    p.px(x, y, c);
  }
};
// the beehive: teased, lacquered hair swept round and up — glossy black with a cool violet sheen sweeping across the lit side
function hiveP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (face === 'down') { p.px(x, y, C.hairLo); continue; }
    if (face === 'up') {
      const cx = (w - 1) / 2, cy = (h - 1) / 2, r = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx);
      p.px(x, y, Math.floor(r * 0.7 + a * 1.3 + 20) % 3 === 0 ? shift(C.hair, 0.22) : r < 1.5 ? C.hairHi : C.hair); continue;
    }
    // swept strands arching round the tower, darker at the edges
    const u = x / Math.max(1, w - 1), arc = Math.round(Math.sin(u * Math.PI) * 2.2), band = ((y + arc) % 4 + 4) % 4;
    let c = band === 0 ? shift(C.hair, 0.12) : band === 2 ? C.hairLo : C.hair;
    if ((face === 'south' || face === 'north') && (u < 0.06 || u > 0.94)) c = C.hairLo;
    // the lacquer: a lens of sheen on each tier's lit side (front-left, the west face), bright at its core
    const v = (y + 0.5) / h, lens = Math.sin(v * Math.PI) ** 0.7, cu = face === 'south' ? 0.3 : face === 'west' ? 0.62 : face === 'north' ? 0.78 : -9;
    const st = Math.abs(u - cu - (v - 0.5) * 0.08) * w;
    if (st < 0.9 * lens && v > 0.15 && v < 0.85) c = C.hairGl;
    else if (st < 2.4 * lens) c = C.hairHi;
    else if (st < 3.6 * lens) c = band === 2 ? C.hair : shift(C.hair, 0.22);
    if (y === h - 1) c = C.hairLo;
    p.px(x, y, c);
  }
}
const ribbonP = (p, w, h, face) => { shade(C.ribbon, { top: C.ribbonHi, bottom: C.ribbonLo, grain: 0 })(p, w, h, face); if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x += 3) p.px(x, Math.floor(h / 2), C.ribbonHi); };
// a little rose: a spiral of petals
const roseP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = Math.atan2(y - (h - 1) / 2, x - (w - 1) / 2), r = Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2); p.px(x, y, face === 'down' ? C.roseLo : Math.floor(r * 1.4 + a * 0.6 + 8) % 2 ? C.rose : r < 1 ? C.roseLo : C.roseHi); } };
const leafQ = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = Math.abs(y - (h - 1) / 2) / (h / 2), u = x / (w - 1); if (v < Math.sin(u * Math.PI) * 1.05) p.px(x, y, Math.abs(y - (h - 1) / 2) < 0.6 ? C.leafLo : C.leaf); } };
// the knob at the top of each stalk: smooth shell, lit on top (the eye is painted on its front)
const eyeballP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.shellHi : face === 'down' ? C.shellLo : y === 0 ? C.shellHi : y >= h - 2 ? C.shellLo : C.shell); };
const stalkP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? C.shell : (y % 4 === 3 ? C.shellLo : x === 0 ? C.shellHi : C.shell)); };
const mouthP = (p, w, h, face, cube) => {
  shellDark(p, w, h, face, cube);
  if (face !== 'south') return;
  const m = Math.floor(w / 2); for (let y = 1; y < h - 1; y++) { p.px(m - 1, y, C.deep); p.px(m, y, shift(C.shell, 0.1)); }    // the two mouthpart plates
  for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, C.shine);                                                             // bristles
};
const jawP = (p, w, h, face, cube) => { crab(C.shell, { top: C.shellHi, bottom: C.deep, bumps: false })(p, w, h, face, cube); if (face === 'up') for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, C.shine); };
const mouthIn = (p, w, h) => { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 2, '#5a1424'); };
// the ground crack left by the shiko: jagged fissures from a crater, wet with seeping water
const crackP = (p, w, h) => {
  const cx = w / 2, cy = h / 2, R = (a, b) => h2(a, b, 11), D = '#2a1e1a', L = '#c8b090', Wt = '#5ab8f0';
  for (let k = 0; k < 9; k++) {
    let a = (k / 9) * TAU + (R(k, 1) - 0.5) * 0.5, x = cx, y = cy;
    const len = w * (0.22 + R(k, 2) * 0.26);
    for (let i = 0; i < len; i++) {
      a += (R(k * 31 + i, 3) - 0.5) * 0.7; x += Math.cos(a); y += Math.sin(a);
      p.px(x, y - 1, L); p.px(x, y, i % 6 === 3 ? Wt : D); if (i < len * 0.4) p.px(x + 1, y, D);
      if (i === Math.round(len * 0.5)) { let bx = x, by = y, ba = a + (R(k, 5) > 0.5 ? 0.9 : -0.9); for (let j = 0; j < len * 0.35; j++) { ba += (R(k * 7 + j, 6) - 0.5) * 0.6; bx += Math.cos(ba); by += Math.sin(ba); p.px(bx, by - 1, L); p.px(bx, by, D); } }
    }
  }
  for (let y = -5; y <= 5; y++) for (let x = -6; x <= 6; x++) { const d = Math.hypot(x / 6, y / 5); if (d > 1) continue; p.px(cx + x, cy + y, d > 0.8 ? L : d > 0.55 ? D : (x + y) & 1 ? '#3a2e28' : Wt); }
};
const bubbleP = (p, w, h) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - c, y - c); if (d > c + 0.4) continue;
    const hl = Math.hypot(x - c * 0.6, y - c * 0.55) < 2;
    p.px(x, y, d > c - 0.9 ? (x + y < w - 1 ? '#e8faff' : '#5aaad8') : hl ? '#ffffff' : d > c - 2 ? '#a8dcf4' : (x + y) & 1 ? '#8ccbe8' : '#9ad4ee');
  }
};

// kawaii eyes (Gen 8–9 style): a big soft teardrop with a 1-texel dark outline, a dark iris tinted with the accent,
// a lighter accent gradient in its lower third, one big catchlight high on the outer side and a 1-texel glint low on
// the inner side. Expressions in the same style: open, angry (flat lid tilted in), sad (lid tilted out), sly, happy (^),
// closed (a soft curve), hurt (> <), x, swirl. Painted as the right eye (outer corner at x = 0); the left eye mirrors it.
const SWIRL = { 11: ['...#####...', '..#.....#..', '.#..###..#.', '#..#...#..#', '#.#..#..#.#', '#.#.#.#.#.#', '#.#..##..#.', '#..#.....#.', '.#..#####..', '..##.......', '...........', '...........'], 9: ['..#####..', '.#.....#.', '#..###..#', '#.#...#.#', '#.#.#.#.#', '#.#..##.#', '#..#....#', '.#..####.', '..##.....', '.........'],
  7: ['.#####.', '#.....#', '#.###.#', '#.#.#.#', '#.#..##', '#..#...', '.###...', '.......'] };
function eyeArt(W, H, kind, pal) {
  return (p) => {
    const cx = (W - 1) / 2, cy = (H - 1) / 2, rx = W / 2, ry = H / 2, L = pal.line;
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) p.px(x, y, c); };
    if (kind === 'happy') { for (let x = 0; x < W; x++) { const t = (x - cx) / rx, yy = Math.round(H * 0.6 - Math.sqrt(Math.max(0, 1 - t * t)) * H * 0.4); put(x, yy, L); put(x, yy + 1, L); } return; }
    if (kind === 'closed') { for (let x = 0; x < W; x++) { const t = (x - cx) / rx, yy = Math.round(H * 0.44 + Math.sqrt(Math.max(0, 1 - t * t)) * H * 0.2); put(x, yy, L); if (Math.abs(t) < 0.75) put(x, yy + 1, L); } return; }
    if (kind === 'hurt') { for (let y = 1; y < H - 1; y++) { const t = Math.abs(y - cy) / (cy - 1), x = Math.round(1 + (1 - t) * (W - 3)); put(x, y, L); put(x - 1, y, L); } return; }
    if (kind === 'x') { for (let i = 0; i <= 40; i++) { const a = i / 40, x = Math.round(a * (W - 2)), y = Math.round(a * (H - 2)); put(x, y, L); put(x + 1, y, L); put(W - 2 - x, y, L); put(W - 1 - x, y, L); } return; }
    if (kind === 'swirl') { const g = SWIRL[W >= 11 ? 11 : W >= 9 ? 9 : 7], ox = Math.floor((W - g[0].length) / 2); g.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') put(ox + x, y, L); }); return; }
    const tear = pal.tear ?? 0.1, ell = (x, y) => { const v = (y - cy) / ry; return ((x - cx) / (rx * (1 + tear * v))) ** 2 + v * v <= 1.02; };
    const lid = kind === 'angry' ? [0.1, 0.42] : kind === 'sad' ? [0.42, 0.1] : kind === 'sly' ? [0.12, 0.3] : null;
    const lidY = (x) => (lid ? (lid[0] + (lid[1] - lid[0]) * (x / (W - 1))) * H : -9);
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && ell(x, y) && y + 0.5 >= lidY(x);
    const edge = (x, y) => !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue;
      const v = y / (H - 1);
      put(x, y, edge(x, y) ? L : v > 0.8 ? pal.low : v > 0.62 ? (((x + y) & 1) && v < 0.7 ? pal.iris : pal.mid) : pal.iris);
    }
    if (lid) for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (inside(x, y) && !inside(x, y - 1)) { if (inside(x, y + 1) && x > W * 0.45 === (kind !== 'sad')) put(x, y + 1, L); break; }
    const cs = W >= 9 ? 3 : 2, ok = (x0, y0) => { for (let j = 0; j < cs; j++) for (let i = 0; i < cs; i++) if (!inside(x0 + i, y0 + j) || edge(x0 + i, y0 + j)) return false; return true; };
    let best = null, bd = 1e9;                                                            // the catchlight: as near the high outer spot as fits
    for (let y0 = 1; y0 < H - cs; y0++) for (let x0 = 1; x0 < W - cs; x0++) if (ok(x0, y0)) { const d = (x0 - W * 0.2) ** 2 + 1.6 * (y0 - H * 0.14) ** 2; if (d < bd) { bd = d; best = [x0, y0]; } }
    if (best) for (let j = 0; j < cs; j++) for (let i = 0; i < cs; i++) put(best[0] + i, best[1] + j, pal.hi);
    const gx = W - 1 - Math.max(2, Math.round(W * 0.26)), gy = H - 1 - Math.max(2, Math.round(H * 0.22));
    if (inside(gx, gy) && !edge(gx, gy)) put(gx, gy, pal.hi);
  };
}
const EYE_KINDS = ['open', 'angry', 'sad', 'sly', 'happy', 'closed', 'hurt', 'x', 'swirl'];
const EYE_PAL = { line: '#0e0c1c', iris: '#151b38', mid: '#1d5a8c', low: '#3ab4f4', hi: '#ffffff', tear: 0.08 };

// ---------------------------------------------------------------- the model
const B = (x0, y0, z0, x1, y1, z1, tex, x = {}) => ({ o: [x0, y0, z0], s: [x1 - x0, y1 - y0, z1 - z0], tex, ...x });
// mirror a right-side part (−x) to the left (+x): x flips, rotations about y and z flip, texture U flips
const flipC = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: c.plane === 'x' ? c.mirror : !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
const side = (n) => n && n.replace(/R$/, 'L');
const flipB = (b) => ({ name: side(b.name), parent: side(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: b.cubes.map(flipC) });
const both = (...bs) => [...bs, ...bs.map(flipB)];

const eyeParts = () => EYE_KINDS.map((k) => B(-7.233, 28.3, 3.43, -3.567, 32.3, 3.43, eyeArt(11, 12, k, EYE_PAL), { plane: 'z', id: 'eye-' + k, hide: k !== 'open' }));
const RIGHT = {
  // hind legs: hip → knee (thigh, level), knee → ankle (shin, plumb), pointed dark foot — posed by IK
  thigh: { name: 'thighR', parent: 'root', pivot: [-5.5, 10, 0], cubes: [B(-13.6, 7.6, -2.6, -5, 12.4, 2.6, legP('west'))] },
  shin: { name: 'shinR', parent: 'thighR', pivot: [-13.6, 10, 0], cubes: [
    B(-15.8, 7.8, -2.6, -11.4, 12.6, 2.6, crab(C.shell, { every: 4 })),               // knee knuckle
    B(-15.4, 2.4, -2, -11.8, 8, 2, legP('west')),
  ] },
  foot: { name: 'footR', parent: 'shinR', pivot: [-13.6, 2.6, 0], cubes: [
    B(-15.4, 0, -2, -11.8, 2.6, 3, tipP),
    B(-14.8, 0, 3, -12.4, 1.6, 5.2, tipP),
    B(-14.2, 0, 5.2, -13, 0.8, 6.4, tipP),
  ] },
  // big claws held up in front, palms out: upper arm → forearm → hand (palm + fixed finger) → movable finger
  arm: { name: 'armR', parent: 'torso', pivot: [-12, 19, -0.4], cubes: [B(-18, 16.8, -2.4, -11.6, 21.2, 1.6, legP('west'))] },
  fore: { name: 'foreR', parent: 'armR', pivot: [-16.4, 19, -0.4], cubes: [B(-18.6, 16.8, -2, -14.2, 21, 5.6, crab(C.shell, { every: 5 }))] },
  claw: { name: 'clawR', parent: 'foreR', pivot: [-16.6, 19, 5.2], rot: [-6, 16, 9], cubes: [
    B(-20.4, 14.4, 4.6, -12.8, 21.8, 9, palmP),
    B(-21.2, 15.2, 5, -20.4, 21, 8.6, shellP),                                                   // rounding: outer side
    B(-12.8, 15.2, 5, -12, 21, 8.6, shellP),                                                     // inner side
    B(-19.6, 13.6, 5, -13.6, 14.4, 8.6, shellDark),                                              // heel
    // the fixed finger: three tapering segments hooking inward
    B(-20.6, 21.6, 5.3, -17, 24.4, 8.3, finger('east')),
    B(-20, 24.2, 5.6, -17, 26.8, 8, finger('east')),
    B(-19.2, 26.6, 5.9, -17.2, 28.8, 7.7, tipP, { pivot: [-18.2, 26.6, 6.8], rot: [0, 0, -16] }),
  ] },
  pinch: { name: 'pinchR', parent: 'clawR', pivot: [-14.6, 21.6, 6.8], rot: [0, 0, -5], cubes: [
    B(-16.2, 21.4, 5.3, -12.8, 24.2, 8.3, finger('west')),
    B(-16.2, 24, 5.6, -13.4, 26.6, 8, finger('west')),
    B(-16, 26.4, 5.9, -14, 28.4, 7.7, tipP, { pivot: [-15, 26.4, 6.8], rot: [0, 0, 16] }),
  ] },
  // little walking legs along the sides of the shell
  wleg1: { name: 'wleg1R', parent: 'torso', pivot: [-11.6, 14.4, -3.7], cubes: [
    B(-17.4, 13.5, -4.6, -11.4, 15.3, -2.8, legP('west')),
    B(-18.4, 8.6, -4.6, -16.6, 14.6, -2.8, legP('west'), { pivot: [-17.5, 14.4, -3.7], rot: [0, 0, -14] }),
    B(-18.2, 6.6, -4.4, -16.8, 8.6, -3, tipP, { pivot: [-17.5, 14.4, -3.7], rot: [0, 0, -14] }),
  ] },
  wleg2: { name: 'wleg2R', parent: 'torso', pivot: [-11.2, 12.6, -6.4], cubes: [
    B(-16.6, 11.7, -7.3, -11, 13.5, -5.5, legP('west')),
    B(-17.6, 7.2, -7.3, -15.8, 12.8, -5.5, legP('west'), { pivot: [-16.7, 12.6, -6.4], rot: [0, 0, -20] }),
    B(-17.4, 5.2, -7.1, -16, 7.2, -5.7, tipP, { pivot: [-16.7, 12.6, -6.4], rot: [0, 0, -20] }),
  ] },
  stalk: { name: 'stalkR', parent: 'eyes', pivot: [-5.4, 25, 1.4], rot: [0, 0, 7], cubes: [
    B(-6.9, 24.4, -0.2, -3.9, 25.8, 3, shellP),                                                  // socket
    B(-6.2, 25.4, 0.6, -4.6, 28.8, 2.2, stalkP),
    B(-7.6, 28.0, -0.5, -3.2, 32.6, 3.4, eyeballP),
    ...eyeParts(),
  ] },
};

export const def = {
  name: 'kanizumo', ppu: 3, scale: 0.46, outline: { color: '#2a0a14', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...both(RIGHT.thigh, RIGHT.shin, RIGHT.foot),
    { name: 'pelvis', parent: 'root', pivot: [0, 10, 0], cubes: [
      B(-8.8, 5.4, -6.2, 8.8, 12, 6.2, beltP),                                                 // the mawashi
      B(-3.2, 2.6, 3, 3.2, 5.6, 6, beltP),                                                      // front, between the legs
      B(-3, 7, -8, 3, 12.4, -6, beltP),                                                         // the knot behind
      B(-1.8, 2.6, -7.4, 1.8, 7.2, -5.6, beltP),
    ] },
    ...['R', 'C', 'L'].map((g, gi) => ({ name: 'sag' + g, parent: 'pelvis', pivot: [(gi - 1) * 4.6, 9.4, 6.5], rot: [0, 0, (gi - 1) * 5], cubes: [-1, 0, 1].map((k) => {
      const x = (gi - 1) * 4.6 + k * 1.5, len = 5.6 + ((gi * 3 + k + 1) % 2) * 0.6 + (gi === 1 && k === 0 ? 0.4 : 0);
      return B(x - 0.333, 9.4 - len, 6.2, x + 0.333, 9.6, 6.867, cordP);
    }) })),
    { name: 'torso', parent: 'pelvis', pivot: [0, 12, 0], rot: [6, 0, 0], cubes: [
      B(-12, 11, -7, 12, 24, 4, shellP),                                                        // carapace core
      B(-13.5, 15, -6, 13.5, 22, 3, shellP),                                                     // the wide middle with its edge
      B(-10.5, 24, -5.6, 10.5, 25.8, 2.6, crownP),                                               // crown
      B(-12.8, 12.6, -6.4, 12.8, 15, 3.4, shellP),                                               // lower flank
      B(-12.8, 22, -6.4, 12.8, 23.4, 2.8, shellP),                                               // upper flank
      B(-10, 13, -8.6, 10, 23, -7, heike),                                                       // the back, with its stern face
      B(-5.6, 22.8, 3.4, 5.6, 24.4, 5.2, browP),                                                 // brow: the front rim of the shell
      B(-3.4, 20.6, 3.6, 3.4, 22.9, 4.8, mouthP),                                                // mouthparts
      B(-2.4, 19.6, 3.2, 2.4, 21, 4.6, mouthIn, { outline: false }),
      // shell teeth at the shoulders
      B(-13.4, 23.2, -3.6, -11.2, 25.2, -1.6, shellP, { pivot: [-11.6, 24, -2.6], rot: [0, 0, 28] }),
      B(-15, 21.2, -4.6, -13, 22.8, -2.8, shellP, { pivot: [-13.2, 22, -3.7], rot: [0, 0, 38] }),
      B(11.2, 23.2, -3.6, 13.4, 25.2, -1.6, shellP, { pivot: [11.6, 24, -2.6], rot: [0, 0, -28], mirror: true }),
      B(13, 21.2, -4.6, 15, 22.8, -2.8, shellP, { pivot: [13.2, 22, -3.7], rot: [0, 0, -38], mirror: true }),
    ] },
    // the sumo gut: one round mass, stepped in at the edges, hanging over the belt
    { name: 'gut', parent: 'torso', pivot: [0, 14.6, 5], cubes: [
      B(-8.2, 10.6, 3.8, 8.2, 18.4, 9.6, gutP),
      B(-9.4, 11.4, 3.8, 9.4, 17.4, 8.8, gutSideP),
      B(-7, 18.4, 3.6, 7, 20, 8, gutTopP),
      B(-6.6, 9.6, 4.2, 6.6, 10.6, 8.8, gutSideP),
    ] },
    { name: 'jaw', parent: 'torso', pivot: [0, 20.6, 3.8], cubes: [
      B(-2.8, 19.4, 3.6, 2.8, 20.6, 6.2, jawP),
      B(-2.2, 20.4, 3.8, 2.2, 20.8, 5.8, mouthIn, { outline: false }),
    ] },
    { name: 'bub', parent: 'jaw', pivot: [0, 20.4, 6.2], cubes: [
      B(-2.6, 19.4, 7.6, 4.6, 26.6, 7.6, bubbleP, { plane: 'z', id: 'snot', hide: true, shadow: false, glow: true }),
      B(1, 19.4, 4, 1, 26.6, 11.2, bubbleP, { plane: 'x', id: 'snot', hide: true, shadow: false, glow: true }),
    ] },
    { name: 'eyes', parent: 'torso', pivot: [0, 25, 1.4], cubes: [] },
    { name: 'orb', parent: 'torso', pivot: [0, 19, 17.4], cubes: [
      B(-5.4, 13.6, 17.4, 5.4, 24.4, 17.4, bubbleP, { plane: 'z', id: 'orb', hide: true, shadow: false, glow: true }),
      B(0, 13.6, 12, 0, 24.4, 22.8, bubbleP, { plane: 'x', id: 'orb', hide: true, shadow: false, glow: true }),
    ] },
    { name: 'crack', parent: 'root', pivot: [13.6, 0.15, 3], cubes: [B(-2.4, 0.15, -13, 29.6, 0.15, 19, crackP, { plane: 'y', id: 'crack', hide: true, shadow: false })] },
    ...both(RIGHT.stalk),
    // the towering beehive (two springy tiers of lacquered hair), tied with a red ribbon and a bow, a rose tucked in
    { name: 'hive', parent: 'torso', pivot: [0, 25.8, -1.6], cubes: [
      B(-4, 25.4, -5.4, 4, 28.6, 1.8, hiveP),
      B(-4.3, 25.8, -5.7, 4.3, 27.2, 2.1, ribbonP),
      B(0.4, 25.4, 2.0, 3.0, 27.6, 3.0, ribbonP, { pivot: [0, 26.5, 2.5], rot: [0, 0, -16] }),
      B(-3.0, 25.4, 2.0, -0.4, 27.6, 3.0, ribbonP, { pivot: [0, 26.5, 2.5], rot: [0, 0, 16], mirror: true }),
      B(-0.7, 25.9, 2.2, 0.7, 27.1, 3.3, ribbonP),
    ] },
    { name: 'hiveTop', parent: 'hive', pivot: [0, 28.4, -1.6], cubes: [
      B(-5.4, 32.6, -1.8, -3.6, 34.4, 0.0, roseP),
      B(-6.8, 32.4, -1.4, -4.8, 32.4, 0.2, leafQ, { plane: 'y', outline: false }),
      B(-4.6, 28.4, -6, 4.6, 32.4, 2.4, hiveP),
      B(-4.4, 32.4, -5.8, 4.4, 35.4, 2.2, hiveP),
      B(-3.6, 35.4, -5, 3.6, 37.2, 1.4, hiveP),
      B(-2.2, 37.2, -3.6, 2.2, 38.2, 0, hiveP),
    ] },
    ...both(RIGHT.arm, RIGHT.fore, RIGHT.claw, RIGHT.pinch),
    ...both(RIGHT.wleg1, RIGHT.wleg2),
  ],
};

// where buyable gear sits (model units; size = the width of that part)
def.attach = {
  head: { bone: 'hiveTop', at: [0, 38.2, -1.6], size: 4.4 },
  face: { bone: 'eyes', at: [0, 30.2, 3.4], size: 12.4 },
  neck: { bone: 'torso', at: [0, 23.4, 5.2], size: 11.2 },
  back: { bone: 'torso', at: [0, 18, -8.6], size: 20 },
};

// ---------------------------------------------------------------- animation
defineFx('salt', { w: 3, h: 3, paint: (p) => { p.px(1, 0, '#ffffff'); p.px(0, 1, '#ffffff'); p.px(1, 1, '#eef4ff'); p.px(2, 1, '#ffffff'); p.px(1, 2, '#c8d4f0'); }, life: [0.8, 1.2], size: [0.035, 0.03], speed: [1.6, 2.8], grav: 5.5, drag: 0.8, spread: 0.45, spin: 6 });
defineFx('spout', { w: 5, h: 9, paint: (p, w, h) => { for (let y = 0; y < h; y++) { const hw = y < 2 ? 1 : 2; for (let x = 2 - hw; x <= 2 + hw; x++) p.px(x, y, x === 2 - hw ? '#ffffff' : x === 2 + hw ? '#3a9ad8' : y % 3 === 0 ? '#e8faff' : '#8adcff'); } }, life: [0.4, 0.7], size: [0.11, 0.05], speed: [3.2, 4.8], grav: 7.5, drag: 0.4, spread: 0.1 });
defineFx('bigbubble', { w: 26, h: 26, paint: (p, w, h) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - c, y - c); if (d > c + 0.3) continue;
    const rim = d > c - 1.2, hl = Math.hypot(x - c * 0.55, y - c * 0.5) < 2.8, hl2 = Math.hypot(x - c * 1.42, y - c * 1.45) < 1.2;
    p.px(x, y, rim ? (x + y < w - 2 ? '#f0fcff' : '#4a9ad0') : hl || hl2 ? '#ffffff' : d > c - 3 ? '#9ad8f4' : (x * 3 + y * 5) % 17 === 0 ? '#d8f6ff' : '#7cc4e8');
  }
}, life: [1.1, 1.1], size: [0.4, 0.78], speed: [2.0, 2.0], grav: -0.2, drag: 0.3, spread: 0, wob: 0.5 });
const ORB = [0, 19, 17.4];
const MOUTH = [0, 21.2, 6.6], PALM = { R: [-16.6, 18.6, 9.4], L: [16.6, 18.6, 9.4] }, FOOT = { R: [-13.6, 0.4, 1.6], L: [13.6, 0.4, 1.6] };
// two-bone IK in the frontal plane: the hips ride on the pelvis, the feet stay where they are put
const HIP = 5.5, L1 = 8.1, L2 = 7.4, PY = 10, R2D = 180 / Math.PI, A0 = { R: [-13.6, 2.6], L: [13.6, 2.6] };
const wrap = (a) => ((a % 360) + 540) % 360 - 180;
function ik2(H, F, s) {
  const dx = F[0] - H[0], dy = F[1] - H[1], d = Math.max(Math.abs(L1 - L2) + 0.05, Math.min(L1 + L2 - 0.05, Math.hypot(dx, dy)));
  const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))), t1 = Math.atan2(dy, dx) + (s < 0 ? -a : a);
  const K = [H[0] + L1 * Math.cos(t1), H[1] + L1 * Math.sin(t1)];
  return [t1, Math.atan2(F[1] - K[1], F[0] - K[0])];
}
// place the pelvis (offset px, py, roll rz in degrees) and solve both legs; f.R / f.L lift a foot [dx, dy]; z.R / z.L step it
function stance(P, px, py, rz, o = {}) {
  P.pos('pelvis', px, py, 0).rot('pelvis', 0, 0, rz);
  const c = Math.cos(rz / R2D), s = Math.sin(rz / R2D);
  for (const [S, g] of [['R', -1], ['L', 1]]) {
    const f = (o.f && o.f[S]) || [0, 0], H = [g * HIP * c + px, PY + g * HIP * s + py], F = [A0[S][0] + f[0], A0[S][1] + f[1]];
    const [t1, t2] = ik2(H, F, g), d1 = wrap(t1 * R2D - (g < 0 ? 180 : 0)), d2 = wrap(t2 * R2D + 90);
    P.pos('thigh' + S, H[0] - g * HIP, H[1] - PY, (o.z && o.z[S]) || 0).rot('thigh' + S, 0, 0, d1);
    P.rot('shin' + S, 0, 0, wrap(d2 - d1)).rot('foot' + S, (o.toe && o.toe[S]) || 0, 0, -d2);
  }
}
// pincer: open (degrees) — the movable finger swings away from the fixed one
const pinch = (P, S, a) => P.rot('pinch' + S, 0, 0, S === 'R' ? -a : a);
// pose an arm: up (deg, the upper arm lifts sideways), fwd (deg, swings forward; − swings back),
// tip (deg, the forearm tips up), spread (deg, the forearm turns outward so the claw opens away from the face)
function arm(P, S, up = 0, fwd = 0, tip = 0, spread = 0) {
  const g = S === 'R' ? 1 : -1;
  P.rot('arm' + S, 0, g * fwd, -g * up).rot('fore' + S, -tip, -g * (fwd * 0.6 + spread), g * up * 0.7);
}
// a palm thrust (tsuppari): k 0..1 drives the claw straight out from the shoulder
function thrust(P, S, k) {
  const g = S === 'R' ? 1 : -1;
  P.rot('arm' + S, 0, g * 40 * k, 0).rot('fore' + S, 0, -g * 40 * k, 0).pos('claw' + S, g * 0.8 * k, 0.4 * k, 5 * k).rot('claw' + S, -8 * k, -g * 10 * k, g * 6 * k);
  pinch(P, S, 12 * k);
}
// both palms side by side in front of the chest (k 0..1, the pose), pushed forward by out (0..1)
function palms(P, k, out = 0) {
  for (const [S, g] of [['R', 1], ['L', -1]]) {
    P.rot('arm' + S, 0, g * 70 * k, -g * 4 * k).rot('fore' + S, -8 * k, -g * 50 * k, 0).rot('claw' + S, -6 * out, -g * 22 * k, 0)
      .pos('claw' + S, g * 6.2 * k, 0.8 * k, (-1.2 + 6.4 * out) * k);
    pinch(P, S, 6 * k + 16 * Math.max(0, out));
  }
}
// the sumo ready crouch shared by most clips
function ready(P, t, k = 1) {
  arm(P, 'R', 6 * k, 0, 4 * k); arm(P, 'L', 6 * k, 0, 4 * k);
  pinch(P, 'R', 4); pinch(P, 'L', 4);
  P.rot('torso', 5 * k, 0, 0);
}
function scuttle(P, t, amp = 1, hz = 2.2) {
  ['1', '2'].forEach((n, i) => {
    P.rot('wleg' + n + 'R', wave(t, hz, i * 1.9) * 6 * amp, 0, -6 * amp + wave(t, hz, i * 1.9 + 1) * 9 * amp);
    P.rot('wleg' + n + 'L', wave(t, hz, i * 1.9 + 3.1) * 6 * amp, 0, 6 * amp - wave(t, hz, i * 1.9 + 4.1) * 9 * amp);
  });
}
// knocked out: sat down hard on its backside, tipped back, legs kicked up in the air, claws flopped out, stalks drooping
function knockedOut(P, k, t = 0, twitch = 1) {
  const py = -3.2 * k, pz = -2.4 * k;
  P.pos('pelvis', 0, py, pz).rot('pelvis', -36 * k, 0, 0);
  for (const [S, g] of [['R', -1], ['L', 1]]) {
    P.pos('thigh' + S, 0, py, pz).rot('thigh' + S, 0, -g * 40 * k, g * (34 + wave(t, 0.8, g) * 4 * twitch) * k);
    P.rot('shin' + S, (-46 + wave(t, 1.1, g + 1) * 10 * twitch) * k, 0, g * 18 * k).rot('foot' + S, (-84 + wave(t, 1.6, g) * 14 * twitch) * k, 0, 0);
    P.rot('wleg1' + S, 0, 0, -g * (22 + wave(t, 2.3, g) * 10 * twitch) * k).rot('wleg2' + S, 0, 0, -g * (30 + wave(t, 1.9, g + 2) * 10 * twitch) * k);
    P.rot('stalk' + S, 10 * k, 0, -g * (34 + wave(t, 0.7, g) * 6 * twitch) * k);
  }
  arm(P, 'R', -24 * k, 10 * k, -26 * k, 34 * k); arm(P, 'L', -24 * k, 10 * k, -26 * k, 34 * k);
  pinch(P, 'R', 22 * k); pinch(P, 'L', 22 * k);
  P.rot('torso', -6 * k, 0, 4 * k).rot('jaw', 24 * k).rot('hiveTop', 0, 0, 12 * k);
}

export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'torso', amp: 0.014, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.4], dur: 0.13 },
  look: { bone: 'eyes', yaw: 26, pitch: 10, speed: 4 },
  springs: [
    { bone: 'stalkR', tip: [0, 6, 0], k: 140, d: 8, gain: 0.9, max: 24 },
    { bone: 'stalkL', tip: [0, 6, 0], k: 150, d: 8, gain: 0.9, max: 24 },
    { bone: 'hive', tip: [0, 4, 0], k: 200, d: 10, gain: 0.55, max: 10 },
    { bone: 'hiveTop', tip: [0, 7, 0], k: 150, d: 8, gain: 0.9, max: 16 },
    { bone: 'sagR', tip: [0, -5.5, 0], k: 200, d: 9, gain: 0.8, max: 26, axes: [1, 0.3, 1] },
    { bone: 'sagC', tip: [0, -6, 0], k: 180, d: 8, gain: 0.8, max: 26, axes: [1, 0.3, 1] },
    { bone: 'sagL', tip: [0, -5.5, 0], k: 210, d: 9, gain: 0.8, max: 26, axes: [1, 0.3, 1] },
    { bone: 'gut', tip: [0, -4, 3], k: 260, d: 10, gain: 0.35, max: 5 },
    { bone: 'wleg1R', tip: [-6, -4, 0], k: 240, d: 12, gain: 0.4, max: 12 },
    { bone: 'wleg1L', tip: [6, -4, 0], k: 240, d: 12, gain: 0.4, max: 12 },
    { bone: 'wleg2R', tip: [-6, -4, 0], k: 220, d: 12, gain: 0.4, max: 12 },
    { bone: 'wleg2L', tip: [6, -4, 0], k: 220, d: 12, gain: 0.4, max: 12 },
  ],
  faces: {
    eyes: { default: 'open', states: Object.fromEntries(EYE_KINDS.map((k) => [k, ['eye-' + k]])) },
    orb: { default: 'off', states: { on: ['orb'], off: [] } },
    bubble: { default: 'off', states: { on: ['snot'], off: [] } },
    crack: { default: 'off', states: { on: ['crack'], off: [] } },
  },
  fidget: { every: [6, 10], clips: ['salt', 'shimmy', 'slap', 'shimmy'] },
  clips: {
    // the sumo crouch: a slow, heavy weight shift from leg to leg, pincers clacking, bubbles at the jaw
    idle: { len: 2.4, loop: true, f(P, t) {
      const ph = (t / 2.4) * TAU, s = Math.sin(ph), sh = Math.sign(s) * Math.abs(s) ** 0.55, dip = Math.abs(s) ** 6;
      const land = wob(t % 1.2, 0.42, -0.9, 2.6, 5.5);                      // settling onto each leg with a little give
      const px = -2 * sh, py = -0.5 - 1.2 * dip + land, rz = 3 * sh;
      stance(P, px, py, rz);
      P.sq('torso', land * 0.04);
      ready(P, t);
      P.rot('torso', 0, wave(t, 1 / 2.4, -0.9) * 3, -1.8 * Math.sin(ph - 0.6)).sq('torso', -0.03 * dip);
      P.sq('gut', -0.06 * dip + 0.025 * Math.sin(ph * 2 - 1.2));
      // the claws ride the shift a beat late, opening and closing like hands getting ready
      P.pos('clawR', 0, 0.7 * Math.sin(ph - 1.1), 0).pos('clawL', 0, -0.7 * Math.sin(ph - 1.1), 0);
      P.rot('clawR', 0, 0, 3 * Math.sin(ph - 1.4)).rot('clawL', 0, 0, 3 * Math.sin(ph - 1.4));
      for (const [S, t0] of [['R', 0.55], ['L', 1.75]]) pinch(P, S, -4 * bump(t, t0, t0 + 0.12) + wob(t, t0 + 0.12, 7, 4, 7) + (t > t0 - 0.25 && t < t0 ? 12 * seg(t, t0 - 0.25, t0 - 0.05) : 0));
      scuttle(P, t, 0.6, 1.4);
      P.rot('eyes', 0, wave(t, 0.21) * 5, 0).rot('stalkR', 0, 0, wave(t, 0.4, 0.4) * 2).rot('stalkL', 0, 0, wave(t, 0.4, 2) * 2);
      P.rot('jaw', 4 + Math.max(0, wave(t, 0.83)) * 5);
      P.stream('bubble', 'jaw', MOUTH, { rate: 1.1, dir: [0, 0.7, 1], speed: 0.7, spread: 0.45, scale: 0.55 });
    } },
    // a heavy sumo waddle, sliding each foot forward while the body rocks over the planted leg
    walk: { len: 1.0, loop: true, f(P, t) {
      const ph = (t / 1.0) * TAU, s = Math.sin(ph), c = Math.cos(ph), plant = (1 - Math.abs(s)) ** 4;
      stance(P, 1.6 * s, -0.6 + 1.1 * Math.abs(s) - 0.6 * plant, -5 * s, { f: { R: [-0.6 * Math.max(0, s), 3.4 * Math.max(0, s)], L: [0.6 * Math.max(0, -s), 3.4 * Math.max(0, -s)] }, z: { R: -2 * c, L: 2 * c }, toe: { R: -18 * Math.max(0, s), L: -18 * Math.max(0, -s) } });
      ready(P, t, 0.7);
      P.sq('torso', -0.05 * plant).rot('torso', 3, 7 * s, 2.5 * s).sq('gut', -0.09 * plant);
      P.rot('armR', 0, 12 * c, 0).rot('armL', 0, 12 * c, 0).pos('clawR', 0, 1 * Math.abs(s), 0).pos('clawL', 0, 1 * Math.abs(s), 0);
      scuttle(P, t, 1.4, 3);
      P.rot('eyes', 0, -4 * s, 0);
      P.burst(0.02, 'dust', 'footL', [FOOT.L[0], 0.5, 2], { n: 2, speed: 0.4, scale: 0.6 }).burst(0.52, 'dust', 'footR', [FOOT.R[0], 0.5, 2], { n: 2, speed: 0.4, scale: 0.6 });
    } },
    // entrance: the shiko — weight onto one leg, the other swings high, hangs… and slams down, cracking the ground;
    // then both claws flung up wide, clacking and foaming
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const lean = seg(t, 0, 0.22, E.inout) * (1 - seg(t, 0.78, 0.86, E.in)), lift = seg(t, 0.16, 0.56, E.out3) * (1 - seg(t, 0.72, 0.84, E.in3));
      const slam = t > 0.84 ? 1 : 0, rec = seg(t, 1.5, 2.1, E.inout), imp = slam * (1 - rec), tr = t > 0.56 && t < 0.72 ? wave(t, 13) * 0.7 : 0;
      const roar = seg(t, 0.96, 1.12, E.back) * (1 - seg(t, 1.6, 1.95, E.inout));
      stance(P, -4.4 * lean, -0.8 * lean - 2.4 * imp + wob(t, 0.84, -1.4, 3, 5), 9 * lean + tr, { f: { L: [-1.6 * lift, 19 * lift] }, toe: { L: -24 * lift } });
      P.rot('torso', 6 * imp - 4 * lift - 10 * roar, 0, 7 * lift).sq('torso', wob(t, 0.84, -0.12, 3.5, 5)).sq('gut', wob(t, 0.84, -0.26, 4, 4));
      for (const [S, g] of [['R', 1], ['L', -1]]) {
        const up = S === 'L' ? 62 * lift : -18 * lift;
        arm(P, S, up + 56 * roar, (S === 'L' ? -16 : 6) * lift - 12 * roar, (S === 'L' ? 34 : -12) * lift + 34 * roar, (S === 'L' ? 30 : 10) * lift + 38 * roar);
        P.rot('claw' + S, 0, 0, (S === 'L' ? -18 * lift : 0) + g * 14 * roar);
        pinch(P, S, 4 + (S === 'L' ? 20 * lift : 0) + 34 * roar * (0.6 + 0.4 * Math.abs(wave(t, 7.5, g))));
      }
      P.rot('eyes', 6 * lift - 10 * roar, 0, 0).rot('jaw', 22 * imp + 8 * lift + 18 * roar);
      P.face('eyes', lift > 0.2 && t < 0.84 ? 'angry' : t >= 0.84 && t < 0.98 ? 'hurt' : roar > 0.3 ? 'angry' : undefined).face('crack', t > 0.84 && t < 2.15 ? 'on' : 'off'); P.blinkOK = false;
      P.scl('crack', Math.min(1, 0.3 + seg(t, 0.84, 0.98, E.out) * 0.7));
      const F = [FOOT.L[0], 0.4, 2];
      P.burst(0.84, 'ring', 'root', [F[0], 0.8, 2], { scale: 1.8, tint: [1, 0.92, 0.8] }).burst(0.84, 'dust', 'root', F, { n: 16, dir: [0, 0.3, 0], spread: 1, speed: 2.4 });
      P.burst(0.84, 'rock', 'root', F, { n: 14, dir: [0, 1, 0.3], speed: 1.5, spread: 0.8 }).burst(0.86, 'shard', 'root', F, { n: 12, dir: [0, 1, 0.4], speed: 1.1 });
      P.burst(0.5, 'dust', 'footL', [FOOT.L[0], 1, 1], { n: 3, speed: 0.3 });
      if (t > 1.0 && t < 1.6) P.stream('bubble', 'jaw', MOUTH, { rate: 28, dir: [0, 0.9, 1], speed: 1.7, spread: 0.6, scale: 0.85 });
      P.burst(1.05, 'note', 'torso', [-10, 34, 2], { n: 1, dir: [-0.5, 1, 0.3], speed: 1.3 }).burst(1.25, 'note', 'torso', [10, 35, 2], { n: 1, dir: [0.5, 1, 0.3], speed: 1.3 });
    } },
    // tsuppari barrage: a wind-up, then five open-palm slaps driving forward, each landing with a splash
    attack: { len: 1.4, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.2, E.out) * (1 - seg(t, 0.2, 0.3, E.in)), go = seg(t, 0.2, 0.32, E.out) * (1 - seg(t, 1.08, 1.36, E.inout));
      const hits = [0.32, 0.46, 0.6, 0.74, 0.92];
      let twist = 0, bob = 0;
      hits.forEach((h, i) => {
        const S = i % 2 ? 'L' : 'R', last = i === hits.length - 1, k = seg(t, h - 0.065, h, E.out3) * (1 - seg(t, h + 0.04, h + (last ? 0.26 : 0.13), E.inout));
        thrust(P, S, k * (last ? 1.2 : 1)); twist += (S === 'R' ? 1 : -1) * 16 * k; bob += k;
        const pl = PALM[S];
        P.burst(h, 'spark', 'claw' + S, [pl[0], pl[1], pl[2] + 3.6], { n: last ? 3 : 1 }).burst(h, 'splash', 'claw' + S, [pl[0], pl[1], pl[2] + 3], { n: last ? 14 : 6, dir: [0, 0.4, 1], speed: 1.2 });
        if (last) P.burst(h, 'ring', 'claw' + S, [pl[0], pl[1], pl[2] + 3.6], { scale: 0.9 });
        P.sq('gut', wob(t, h, -0.07, 5, 9));
      });
      const adv = 3.6 * go + 1.4 * seg(t, 0.86, 0.92, E.out) * (1 - seg(t, 1.08, 1.36));
      stance(P, 0, -1.4 * wind - 0.9 * go - 0.3 * bob, 0, { z: { R: 1.2 * go, L: 0.6 * go }, f: { R: [0, 1.4 * bump(t, 0.25, 0.4)], L: [0, 1.2 * bump(t, 0.8, 0.95)] } });
      P.pos('root', 0, 0, -1.6 * wind + adv).rot('torso', -10 * wind + 14 * go, 0, 0).sq('torso', -0.07 * wind + 0.03 * bob);
      arm(P, 'R', -12 * wind, -24 * wind, 0, 10 * wind); arm(P, 'L', -12 * wind, -24 * wind, 0, 10 * wind);
      P.rot('torso', 0, twist, 0).rot('pelvis', 0, twist * 0.45, 0);
      P.face('eyes', go > 0.2 || wind > 0.2 ? 'angry' : undefined); P.blinkOK = false;
      P.rot('jaw', 16 * go).rot('eyes', 0, -twist * 0.5, 0);
      P.burst(0.3, 'dust', 'root', [0, 0.5, 2], { n: 6, spread: 1, speed: 1 });
    } },
    // bubble blast: the palms come together at its chest and a great bubble swells between them, wobbling;
    // a crouch… and a double-palm thrust fires it, a torrent of bubbles and spray behind it, the crab skidding back
    special: { len: 2.3, next: 'idle', f(P, t) {
      const gather = seg(t, 0, 0.42, E.inout) * (1 - seg(t, 0.8, 0.86, E.in)), crouch = seg(t, 0.48, 0.78, E.inout) * (1 - seg(t, 0.8, 0.86, E.out));
      const push = seg(t, 0.8, 0.9, E.back) * (1 - seg(t, 1.55, 2.1, E.inout)), recoil = bump(t, 0.84, 1.36), hold = Math.max(gather, push);
      stance(P, 0, -1.2 * gather - 1.4 * crouch - 0.6 * push, 0, { z: { R: 1.4 * push, L: 1.4 * push } });
      P.pos('root', 0, 0, -0.8 * gather - 2.4 * recoil).rot('torso', -6 * gather - 6 * crouch + 14 * push, 0, 0).sq('torso', -0.06 * crouch + 0.05 * push * (1 - seg(t, 0.9, 1.1)));
      palms(P, hold, push - 0.25 * crouch);
      const grow = seg(t, 0.06, 0.74, E.out);
      P.face('orb', t < 0.86 && grow > 0.02 ? 'on' : 'off').scl('orb', (0.15 + 0.85 * grow) * (1 + wave(t, 7) * 0.06 * grow), (0.15 + 0.85 * grow) * (1 - wave(t, 7) * 0.06 * grow), 1);
      P.rot('eyes', -8 * push, 0, 0).rot('jaw', 10 * gather + 26 * push);
      P.face('eyes', gather > 0.3 || push > 0.3 ? 'angry' : t > 1.9 ? 'happy' : undefined); P.blinkOK = false;
      if (t > 0.1 && t < 0.8) P.stream('bubble', 'torso', ORB, { rate: 16 * grow, dir: [0, 0.5, 0.3], speed: 0.5, spread: 1, scale: 0.55 });
      const O = [ORB[0], ORB[1], ORB[2] + 3];
      P.burst(0.86, 'bigbubble', 'torso', O, { n: 1, dir: [0, 0.04, 1], spread: 0 }).burst(0.86, 'ring', 'torso', O, { scale: 1.2, tint: [0.7, 0.9, 1] });
      P.burst(0.86, 'splash', 'torso', O, { n: 26, dir: [0, 0.3, 1], speed: 1.8, spread: 0.6 }).burst(0.86, 'bubble', 'torso', O, { n: 18, dir: [0, 0.2, 1], speed: 2.4, spread: 0.5 });
      if (t > 0.88 && t < 1.45) P.stream('bubble', 'torso', O, { rate: 70, dir: [0, 0.08, 1], speed: 3.2, spread: 0.32, key: 't' }).stream('splash', 'torso', O, { rate: 50, dir: [0, 0.1, 1], speed: 2.2, spread: 0.25, key: 's' });
      if (t > 0.9 && t < 1.6) P.stream('drop', 'torso', [0, 16, 13], { rate: 14, dir: [0, -0.3, 0.4], speed: 0.6, key: 'd' });
      P.burst(0.88, 'dust', 'root', [0, 0.5, -2], { n: 10, spread: 1, speed: 1.4 });
      P.burst(1.93, 'splash', 'root', [0, 24, 80], { n: 30, speed: 1.8, spread: 1 }).burst(1.93, 'ring', 'root', [0, 24, 80], { scale: 1.4, tint: [0.7, 0.9, 1] });   // …and it bursts on the foe
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.24, 0.7, E.inout)), sc = seg(t, 0.1, 0.42, E.inout) * (1 - seg(t, 0.45, 0.7));
      stance(P, -2.4 * sc, -1.2 * k, 5 * k + wob(t, 0.08, 3, 4, 6), { f: { R: [0, 1.8 * bump(t, 0.12, 0.3)], L: [0, 1.8 * bump(t, 0.28, 0.46)] } });
      P.pos('root', -1.6 * sc, 0, -2.6 * k).rot('torso', -16 * k + wob(t, 0.1, 4, 3, 6), 0, wave(t, 14) * 3 * k).sq('torso', -0.1 * k).sq('gut', wob(t, 0.06, -0.22, 4, 5));
      arm(P, 'R', 30 * k, -10 * k, 24 * k, 20 * k); arm(P, 'L', 30 * k, -10 * k, 24 * k, 20 * k); pinch(P, 'R', 30 * k); pinch(P, 'L', 30 * k);
      scuttle(P, t, 1.8 * k + 0.4, 6);
      P.rot('jaw', 26 * k);
      P.face('eyes', t < 0.42 ? 'hurt' : undefined); P.blinkOK = false;
      P.burst(0.02, 'spark', 'torso', [0, 18, 10], { n: 2 }).burst(0.02, 'star', 'torso', [0, 26, 6], { n: 3 }).burst(0.04, 'bubble', 'jaw', MOUTH, { n: 6, speed: 1.4, scale: 0.7 });
    } },
    // a few dizzy, stumbling sidesteps — then down hard on its backside, legs flung up
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.98, 1.42, E.bounce);
      stance(P, wave(t, 1.4) * 2.2 * dizzy, -1.4 * dizzy, wave(t, 1.4, 1) * 7 * dizzy, { f: { R: [0, 1.8 * Math.max(0, wave(t, 2.8)) * dizzy], L: [0, 1.8 * Math.max(0, -wave(t, 2.8)) * dizzy] } });
      if (fall > 0) knockedOut(P, fall, t, seg(t, 1.5, 1.8));
      P.rot('torso', 0, wave(t, 1.1) * 14 * dizzy, wave(t, 1.4, 2) * 6 * dizzy);
      arm(P, 'R', 20 * dizzy, 0, -20 * dizzy, 20 * dizzy); arm(P, 'L', 20 * dizzy, 0, -20 * dizzy, 20 * dizzy);
      P.rot('stalkR', 0, 0, wave(t, 2.2) * 18 * dizzy).rot('stalkL', 0, 0, wave(t, 2.2, 1) * 18 * dizzy).rot('jaw', 20 * dizzy);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.42, 'dust', 'root', [0, 1, -4], { n: 14, spread: 1, speed: 1.6 }).burst(0.7, 'star', 'torso', [0, 31, 0], { n: 5 });
      if (t > 0.3 && t < 1.1) P.stream('bubble', 'jaw', MOUTH, { rate: 8, dir: [0, 1, 0.5], speed: 0.8, scale: 0.6 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      knockedOut(P, 1, t, 1);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.6, 'bubble', 'jaw', MOUTH, { n: 3, dir: [0, 1, 0], speed: 0.6, scale: 0.6 }).burst(1.9, 'bubble', 'jaw', MOUTH, { n: 2, dir: [0, 1, 0], speed: 0.6, scale: 0.5 });
    } },
    // the winner's tegatana: three hand-knife chops (left, right, centre), then a hop into a proud wide flex
    win: { len: 2.3, next: 'idle', f(P, t) {
      const lift = seg(t, 0, 0.2, E.out) * (1 - seg(t, 1.02, 1.14, E.inout));
      const c1 = bump(t, 0.24, 0.46), c2 = bump(t, 0.48, 0.7), c3 = bump(t, 0.72, 0.94);
      const flex = seg(t, 1.12, 1.3, E.back) * (1 - seg(t, 1.95, 2.25, E.inout)), air = Math.sin(seg(t, 1.02, 1.42, E.lin) * Math.PI);
      const crouch = bump(t, 0.94, 1.08);
      stance(P, 0, -1.6 * crouch + wob(t, 1.42, -1, 3, 6), 0);
      P.pos('root', 0, 4.2 * Math.max(0, air), 0).sq('torso', 0.08 * air - 0.08 * crouch + wob(t, 1.42, -0.08, 3, 6)).sq('gut', wob(t, 1.42, -0.18, 4, 5));
      ready(P, t, 1 - flex);
      // right claw: up in front, then chop left, chop right, chop down the middle
      arm(P, 'R', 22 * lift, 30 * lift, 30 * lift);
      P.rot('clawR', 0, 0, -36 * c1 + 30 * c2).rot('armR', 0, 22 * c1 - 18 * c2, 0).rot('foreR', 40 * c3, 0, 0);
      for (const S of ['R', 'L']) { arm(P, S, 56 * flex, -10 * flex, 34 * flex, 40 * flex); P.rot('claw' + S, 0, 0, (S === 'R' ? 1 : -1) * 16 * flex); }
      pinch(P, 'R', 16 * flex + 8 * Math.abs(wave(t, 6)) * flex); pinch(P, 'L', 16 * flex + 8 * Math.abs(wave(t, 6, 1)) * flex);
      const hold = seg(t, 1.42, 1.55) * (1 - seg(t, 1.95, 2.15));
      P.rot('torso', -10 * flex, wave(t, 2.5) * 10 * hold, wave(t, 6.5) * 4 * hold).rot('pelvis', 0, -wave(t, 2.5) * 8 * hold, 0).rot('eyes', -6 * flex, 0, 0).rot('jaw', 10 * flex);
      P.face('eyes', 'happy'); P.blinkOK = false;
      P.burst(1.5, 'note', 'torso', [-9, 33, 2], { n: 1, dir: [-0.4, 1, 0.3], speed: 1.2 }).burst(1.75, 'note', 'torso', [9, 34, 2], { n: 1, dir: [0.4, 1, 0.3], speed: 1.2 });
      P.burst(1.3, 'sparkle', 'torso', [0, 31, 2], { n: 10, speed: 1.4 }).burst(1.42, 'dust', 'root', [0, 0.5, 0], { n: 10, spread: 1, speed: 1.4 });
      for (const tt of [0.35, 0.59, 0.83]) P.burst(tt, 'salt', 'clawR', [PALM.R[0], 26, PALM.R[2]], { n: 6, dir: [0, 1, 0.3], speed: 0.6 });
    } },
    // dozing in a deep squat: slumped forward, stalks drooping apart, a bubble swelling and shrinking at the jaw
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      stance(P, 0, -3 + br * 0.35, 0);
      P.rot('torso', 9 + br * 1.5, 0, 0).sq('torso', -0.03 + br * 0.02).sq('gut', 0.03 * br);
      arm(P, 'R', -24, 8, -26, 10); arm(P, 'L', -24, 8, -26, 10); pinch(P, 'R', 2); pinch(P, 'L', 2);
      P.pos('clawR', 0, -1.5, -1).pos('clawL', 0, -1.5, -1);
      P.rot('stalkR', 8, 0, 30 + br * 3).rot('stalkL', 8, 0, -30 - br * 3).rot('jaw', 6 + Math.max(0, br) * 4).rot('hiveTop', 0, 0, 7);
      P.face('eyes', 'closed').face('bubble', 'on'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.scl('bub', 0.3 + 0.7 * (0.5 + 0.5 * br));
      P.burst(0.5, 'z', 'torso', [6, 30, 4], {}).burst(1.9, 'z', 'torso', [6, 30, 4], {});
    } },
    // fidget: the salt throw — dips a claw back for salt, then flings it up in a sparkling arc
    salt: { len: 2.0, next: 'idle', f(P, t) {
      const reach = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 0.5, 0.72, E.anti)), fling = seg(t, 0.62, 0.8, E.out) * (1 - seg(t, 1.3, 1.8, E.inout));
      stance(P, -1.2 * reach + 0.8 * fling, -0.6 - 0.8 * reach + 0.8 * fling, 4 * reach - 3 * fling);
      ready(P, t, 1 - fling * 0.5);
      arm(P, 'R', -10 * reach + 64 * fling, -50 * reach - 10 * fling, -20 * reach + 30 * fling, 10 * reach + 40 * fling);
      pinch(P, 'R', 2 + 30 * fling);
      P.rot('torso', 0, -14 * reach + 16 * fling, 0).rot('eyes', 0, -18 * reach + 20 * fling, 0);
      P.face('eyes', fling > 0.5 ? 'happy' : undefined);
      P.burst(0.74, 'salt', 'clawR', [-18, 27, 6], { n: 30, dir: [0.7, 1, 0.8], speed: 1.1, spread: 0.5 }).burst(0.78, 'sparkle', 'clawR', [-18, 28, 6], { n: 6, dir: [0.6, 1, 0.6], speed: 1.6 });
    } },
    // fidget: a shimmying party dance (the Twist, crab style) — claws up, hips one way, shoulders the other,
    // pincers snapping like castanets on the beat, beehive bouncing, notes popping
    shimmy: { len: 2.8, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.3, E.back) * (1 - seg(t, 2.4, 2.8, E.inout)), bt = t * 2.5, beat = bt % 1, hit = Math.exp(-beat * 8) * on;
      const tw = Math.sin(t * TAU * 1.25) * 18 * on, shake = wave(t, 6.5) * 4.5 * on, sw = Math.sin(t * TAU * 1.25);
      stance(P, sw * 1.3 * on, -1 * on - 1 * hit, shake * 0.4, { z: { R: 0.05 * tw, L: -0.05 * tw } });
      P.rot('pelvis', 0, tw, 0).rot('torso', -4 * on, -tw * 1.35, shake).sq('torso', -0.05 * hit).sq('gut', -0.1 * hit + 0.03 * wave(t, 6.5, 1) * on);
      for (const S of ['R', 'L']) {
        const alt = Math.sin(t * TAU * 1.25 + (S === 'R' ? 0 : Math.PI));
        arm(P, S, (50 + 12 * alt) * on, -6 * on, (32 + 10 * alt) * on, 34 * on);
        P.rot('claw' + S, 0, 0, (S === 'R' ? 1 : -1) * (10 + 8 * alt) * on);
        pinch(P, S, (4 + 24 * Math.exp(-((bt + (S === 'R' ? 0 : 0.5)) % 1) * 9)) * on);
      }
      scuttle(P, t, 1.8 * on, 5);
      P.rot('eyes', 0, tw * 0.5, 0).rot('stalkR', 0, 0, wave(t, 2.5) * 12 * on).rot('stalkL', 0, 0, wave(t, 2.5, 1.6) * 12 * on).rot('jaw', 10 * on + 6 * hit);
      P.face('eyes', on > 0.5 ? 'happy' : undefined);
      [0.42, 0.82, 1.22, 1.62, 2.02].forEach((tt, i) => P.burst(tt, 'note', 'torso', [i % 2 ? 9 : -9, 33, 2], { n: 1, dir: [i % 2 ? 0.4 : -0.4, 1, 0.3], speed: 1.2 }));
      P.burst(0.4, 'bubble', 'jaw', MOUTH, { n: 4, dir: [0, 1, 0.5], speed: 0.8, scale: 0.6 });
    } },
    // fidget: clacks both pincers, slaps its own gut twice, gives a satisfied little nod
    slap: { len: 1.9, next: 'idle', f(P, t) {
      stance(P, 0, -0.5 - 0.6 * bump(t, 0.9, 1.1) - 0.6 * bump(t, 1.2, 1.4), 0);
      ready(P, t);
      for (const [S, t0] of [['R', 0.1], ['L', 0.28], ['R', 0.46], ['L', 0.64]]) pinch(P, S, 20 * bump(t, t0, t0 + 0.16));
      for (const [S, t0] of [['R', 0.85], ['L', 1.15]]) {
        const k = seg(t, t0, t0 + 0.08, E.in3) * (1 - seg(t, t0 + 0.12, t0 + 0.3, E.inout)), g = S === 'R' ? 1 : -1;
        P.rot('arm' + S, 0, g * 34 * k, 0).rot('fore' + S, 0, -g * 18 * k, 0).pos('claw' + S, g * 3.2 * k, -2.6 * k, 0.6 * k);
        P.sq('gut', wob(t, t0 + 0.08, -0.17, 4.5, 5)).burst(t0 + 0.08, 'ring', 'gut', [g * -4, 13, 10], { scale: 0.45 });
      }
      P.rot('eyes', 8 * bump(t, 0.8, 1.5), 0, 0).rot('jaw', 8 * bump(t, 0.8, 1.5)).rot('torso', 5 * bump(t, 1.45, 1.75), 0, 0);
      P.face('eyes', t > 0.85 && t < 1.6 ? 'happy' : undefined);
    } },
  },
};
def.anim = anim;
