// Zapanda — Mika's partner (Volto). A roly-poly red panda with a giant panda's build
// and markings — black ears, black legs and a black shoulder band — and a wink at Pink
// Floyd's "The Dark Side of the Moon": a little glass prism glints on its forehead, and
// its huge fluffy ringed tail is a battery whose rings light up as it charges, one band
// of the spectrum at a time, red at the root to violet at the tip. When it lets go,
// white light pours out of the prism and fans into a rainbow. Its tear tracks are yellow
// lightning bolts down white cheeks; its eyes are warm amber rings round big dark pupils, with the red panda's
// white brow marks painted above them, one fang always peeking out.
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, poly, ramp, shift, h2 } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import { blackGold } from '../model.js';

const C = {
  coat: '#cc5422', coatHi: '#ee8238', coatLo: '#94381f', coatDeep: '#5c2228', shine: '#ffb070',
  blk: '#2c2432', blkHi: '#4c4056', blkLo: '#16111c',
  wht: '#fff6ea', whtLo: '#e4d0c4', whtDeep: '#bfa29c',
  ring: '#f4d8a8', ringHi: '#fff0cc', ringLo: '#c99a6c',
  bolt: '#ffd21e', boltHi: '#fff494', boltLo: '#e07a16',
  ink: '#1a0e12', amber: '#f2a428', amberLo: '#a85e18', glint: '#fff2c0',
  nose: '#1e1418', tongue: '#e8607a', mouth: '#4a1420', claw: '#d8d0d4',
  spec: ['#ff3b3b', '#ff9426', '#ffe23a', '#46dc5a', '#3a8cff', '#a05aff'],
};
const TAU = Math.PI * 2, R2D = 180 / Math.PI, PPU = 3;

// ---------------------------------------------------------------- painters
// model-space position of a texel's centre on a face of a cube (honours mirrored cubes), so markings line up across boxes
function at(face, c, x, y) {
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s, u = (x + 0.5) / PPU, v = (y + 0.5) / PPU, m = !!c.mirror;
  switch (face) {
    case 'south': return [m ? ox + sx - u : ox + u, oy + sy - v, oz + sz];
    case 'north': return [m ? ox + u : ox + sx - u, oy + sy - v, oz];
    case 'east': return [m ? ox : ox + sx, oy + sy - v, oz + sz - u];
    case 'west': return [m ? ox + sx : ox, oy + sy - v, oz + u];
    case 'up': return [m ? ox + sx - u : ox + u, oy + sy, oz + v];
    case 'down': return [m ? ox + sx - u : ox + u, oy, oz + sz - v];
    default: return [ox + u, oy + sy - v, oz + sz];
  }
}
// fur: banded light-from-above, with soft clustered flicks (a lit hair over a shadowed one) in staggered rows
function furCol(cols, face, x, y, h, flick = true) {
  const [top, mid, bot, deep] = cols;
  let c = face === 'up' ? top : face === 'down' ? deep : ramp([top, mid, bot], h > 1 ? y / (h - 1) : 0.5, x, y);
  if (flick && face !== 'down') {
    const r = y % 4, k = (x + (Math.floor(y / 4) % 2) * 2) % 4;
    if (r === 2 && k === 0) c = shift(c, -0.2); else if (r === 1 && k === 1) c = shift(c, 0.16);
  }
  return c;
}
const COAT = [C.coatHi, C.coat, C.coatLo, C.coatDeep], BLACK = [C.blkHi, C.blk, C.blkLo, C.blkLo], WHITE = [C.wht, C.wht, C.whtLo, C.whtDeep];
const RING = [C.ringHi, C.ring, C.ringLo, C.ringLo];
// the body coat: rust fur, a black saddle band over the shoulders (running down into the forelegs), a black belly
function coatP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y, Z] = at(face, cube, x, y), fringe = ((x + y) & 1) * 0.35;
    const band = face !== 'south' && Z > 0.4 + fringe && Z < 6, belly = Y < 7.2 + fringe || face === 'down';
    let c = furCol(band || belly ? BLACK : COAT, face, x, y, h);
    if (face === 'south' && !belly && Math.abs(X) < 2.6 - (Y - 6) * 0.15 && Y > 8) c = furCol([C.ringHi, C.ring, C.ringLo, C.ringLo], face, x, y, h);   // pale throat ruff
    p.px(x, y, c);
  }
  if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) { const [, , Z] = at(face, cube, x, 0); if (face === 'south' || !(Z > 0.4 && Z < 6)) p.px(x, 0, C.shine); }
}
const solid = (cols, o = {}) => (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, furCol(cols, face, x, y, h, o.flick !== false)); if (o.rim && face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, 0, o.rim); };
const blackP = solid(BLACK), whiteP = solid(WHITE), coatSolid = solid(COAT, { rim: C.shine });
// paws: black, toes split by dark lines, little pale claws along the front edge
function pawP(p, w, h, face) {
  solid(BLACK)(p, w, h, face);
  if (face === 'south') { for (let x = 2; x < w - 1; x += 3) { p.vl(x, 0, h - 1, C.blkLo); p.px(x - 1, h - 1, C.claw); } }
  if (face === 'up') for (let x = 2; x < w - 1; x += 3) p.px(x, h - 1, C.blkLo);
}
// the head: rust fur; the face has white cheek patches under the eyes, yellow lightning tear tracks down them,
// a soft darker rust round the eyes
const BOLT = [[0, 0], [2.6, 0], [1.2, 3.6], [3.4, 3.6], [-0.8, 10.4], [0.4, 5.6], [-1.8, 5.6]];
function headP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y] = at(face, cube, x, y), ax = Math.abs(X);
    let c = furCol(COAT, face, x, y, h);
    const cheek = Y < 17.3 - Math.max(0, ax - 4.6) * 0.9 + ((x + y) & 1) * 0.3 && ax > 1.2;
    if ((face === 'south' || face === 'east' || face === 'west') && cheek) c = furCol(WHITE, face, x, y, h);
    if (face === 'south' && !cheek && Y < 17.8 && Y > 17.2 && ax > 1.8 && ax < 5.0) c = C.coatLo;      // a soft shadow under the eyes
    if (face === 'south' && ((ax - 3.4) / 1.5) ** 2 + ((Y - 22.0) / 0.5) ** 2 < 1) c = (x + y) & 1 ? C.wht : C.whtLo;   // the white brow marks
    p.px(x, y, c);
  }
  if (face !== 'south') return;
  for (const s of [-1, 1]) {
    // from under the inner corner of each eye, a bolt zig-zags down the white cheek toward the mouth
    const sx = (s * 3.4 - cube.o[0]) * PPU, sy = (cube.o[1] + cube.s[1] - 17.2) * PPU;
    const pts = BOLT.map(([bx, by]) => [sx + s * bx, sy + by]);
    poly(p, pts.map(([a, b]) => [a + s * 0.9, b + 0.9]), C.boltLo);
    poly(p, pts, C.bolt);
    poly(p, pts.slice(0, 3).map(([a, b], i) => [a - (i === 1 ? s * 0.9 : 0), b]), C.boltHi);
  }
}
// cheek tufts: white fluff flaring out below the ears
const tuftP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = furCol(WHITE, face, x, y, h); if (face !== 'up' && face !== 'down' && y > h - 3 && (x % 3 === 1)) c = 0; p.px(x, y, c); } };
function muzzleP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, furCol(WHITE, face, x, y, h, false));
  if (face !== 'south') return;
  const m = Math.floor(w / 2);
  // the philtrum from the nose, then one crooked line: flat on its right, curling up at its left corner
  for (let y = 4; y < 8; y++) p.px(m, y, C.ink);
  [[m - 1, 8], [m - 2, 8], [m - 3, 8], [m - 4, 8], [m - 5, 7], [m + 1, 8], [m + 2, 8], [m + 3, 7], [m + 4, 6], [m + 5, 6], [m + 6, 5]].forEach(([x, y]) => p.px(x, y, C.ink));
  p.px(m + 5, 7, C.whtLo); p.px(m - 2, 9, C.whtLo); p.px(m + 1, 9, C.whtLo);
}
const noseP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#4a3c48' : y === 0 ? '#4a3c48' : C.nose);
  if (face === 'south') { p.px(0, 0, C.wht); p.px(w - 1, 0, C.wht); p.px(0, h - 1, C.wht); p.px(w - 1, h - 1, C.wht); p.px(2, 1, '#8a7a88'); p.px(3, 1, '#6a5a68'); p.px(1, h - 1, '#0e080c'); p.px(w - 2, h - 1, '#0e080c'); }
};
const earP = (p, w, h, face) => { solid(BLACK)(p, w, h, face); if (face === 'up') for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, C.blkHi); };
const innerEar = (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.abs(x - cx) / (w / 2) + (y / h) * 0.3; if (d < 0.78 && y > 0) p.px(x, y, y > h * 0.55 ? '#3a2e40' : '#58485e'); }
  for (let k = 0; k < 4; k++) p.px(Math.round(cx - 1.5 + k), h - 1 - (k % 2), '#8a7a90');            // a few pale hairs
};
// the tail: rust fur, cream rings; each ring has a glowing twin in its spectrum colour
const tailP = (cols) => (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = furCol(cols, face, x, y, h); if ((face === 'east' || face === 'west' || face === 'up' || face === 'down') && (x + 2 * y) % 7 === 0) c = shift(c, -0.14); p.px(x, y, c); } };
const rustT = tailP(COAT), ringT = tailP(RING), tipT = tailP([C.coatLo, C.coatDeep, '#3e1a20', '#2a1218']);
const glowRing = (col) => (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = x === 0 || y === 0 || x === w - 1 || y === h - 1, mid = Math.abs(x - (w - 1) / 2) < w * 0.18 || Math.abs(y - (h - 1) / 2) < h * 0.18; p.px(x, y, e ? shift(col, -0.22) : (x * 7 + y * 13) % 23 === 0 ? '#ffffff' : mid ? shift(col, 0.4) : col); } };
// the scarf: black knit with a band of spectrum across it (a little prism-light homage)
const scarfP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const knit = (x + (y & 1)) % 3 === 0; let c = face === 'up' ? '#3a3040' : y === 0 ? '#4a4050' : knit ? '#1a1620' : '#2a2430'; const k = Math.floor(((face === 'south' || face === 'north') ? y : y) * 6 / Math.max(1, h)); if (face !== 'up' && face !== 'down' && y > 0 && y < h - 1 && (x % 8 === 3 || x % 8 === 4)) c = C.spec[Math.min(5, k)]; p.px(x, y, c); } };
const scarfEnd = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = y >= h - 1 ? (x % 2 ? '#2a2430' : 0) : (x + (y & 1)) % 3 === 0 ? '#1a1620' : '#2a2430'; if (face !== 'up' && face !== 'down' && y < h - 1) { const k = Math.floor(y * 6 / (h - 1)); if (y % 2 === 0 || y > h * 0.6) c = c; if (y >= 1 && y <= 6) c = C.spec[Math.min(5, y - 1)]; } p.px(x, y, c); } };
const tongueP = (p, w, h) => { p.rect(0, 0, w, h, C.tongue); for (let x = 0; x < w; x++) p.px(x, 0, '#ff9aaa'); p.px(Math.floor(w / 2), 1, '#c84060'); };
const mouthIn = (p, w, h) => { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 2, '#6a1c2c'); };
const fangP = (p, w, h) => { p.rect(0, 0, w, h, '#fffaf0'); p.px(w - 1, h - 1, '#d8ccc4'); };
// the forehead prism: a little glass triangle; lit, it blazes white with the spectrum along its right edge
function prismP(lit) {
  return (p, w, h) => {
    const tri = (x, y) => { const v = (y + 0.5) / h, half = v * (w / 2); return Math.abs(x + 0.5 - w / 2) <= half; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!tri(x, y)) continue;
      const edge = !tri(x - 1, y) || !tri(x + 1, y) || y === h - 1, left = x + 0.5 < w / 2;
      p.px(x, y, lit ? (edge ? '#ffffff' : '#eaf6ff') : edge ? '#ffffff' : left ? '#b8c8e8' : '#7a88b0');
    }
    // the split light leaving its right flank
    const sy = Math.round(h * 0.5);
    (lit ? C.spec : C.spec.filter((_, i) => i % 2 === 0)).forEach((c, i, a) => p.px(w - 1, Math.min(h - 1, sy + Math.floor(i * 3 / a.length)), c));
    if (!lit) p.px(Math.floor(w / 2) - 1, Math.floor(h * 0.45), '#ffffff');
  };
}

// eyes (hand-pixelled at full texture resolution, Pokémon-style): no whites — a warm amber ring round a big dark
// pupil (one pixel of it a glint), a darker amber band under the lid line. Eevee-warm, but with the lid line flat
// so it always looks a little sly
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.2, 19.45, 12.42], line: C.ink, iris: '#e8902a', irisDark: '#8a4612', pupilColor: '#1e0e0c', accent: '#ffc860', extra: ['smug', 'glint'], map: {
  open: [
    '.llllllll.',
    'lIIIIIIIIl',
    'iIIkkkkIIi',
    'iihhkkkkii',
    'iihkkkkkii',
    'iikkkkkkii',
    'iiikkhkiii',
    '.iiikkiii.',
    '.ciiiiiic.',
    '..iiiiii..',
  ],
  happy: ['..........', '..........', '..........', '...llll...', '.ll....ll.', 'l........l', '..........', '..........', '..........', '..........'],
  closed: ['..........', '..........', '..........', '..........', '..........', 'l........l', '.ll....ll.', '...llll...', '..........', '..........'],
} });
// drip painters
const phoneP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = x === 0 || y === 0 || x === w - 1 || y === h - 1; p.px(x, y, face === 'east' || face === 'west' ? (e ? '#c8ccd8' : (x + y) % 4 === 0 ? '#ffffff' : '#2a2430') : face === 'up' ? '#4a4050' : '#1a1620'); } };
const prismPend = (p, w, h) => { for (let y = 0; y < h; y++) { const half = ((y + 0.5) / h) * (w / 2); for (let x = 0; x < w; x++) { const d = Math.abs(x + 0.5 - w / 2); if (d > half) continue; p.px(x, y, d > half - 1 || y === h - 1 ? '#ffffff' : x < w / 2 ? '#d8e8ff' : '#9aaad0'); } } C.spec.forEach((c, i) => p.px(w - 1, Math.min(h - 1, Math.floor(h * 0.45) + Math.floor(i / 2)), c)); };
const pigP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'down' ? '#c86a8a' : face === 'up' ? '#ffc8d8' : y === 0 ? '#ffd0dc' : (x * 3 + y) % 11 === 0 ? '#e88aa8' : '#f8a8c0'); };
const snoutPig = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (y === 1 || y === h - 2) && (x === 1 || x === w - 2) ? '#a83a62' : '#ff90b0'); };
const moonP = (p, w, h) => { const cx = (w - 1) / 2, cy = (h - 1) / 2, R = Math.min(w, h) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - cx, y - cy), d2 = Math.hypot(x - cx - R * 0.45, y - cy + R * 0.2); if (d < R && d2 > R * 0.8) p.px(x, y, d > R - 1 ? '#c88a1a' : x < cx - 1 ? '#fff4a8' : '#ffd23e'); } p.px(w - 2, 1, '#ffffff'); p.px(w - 3, h - 2, '#fff4a8'); };
const strat = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / (w - 1) * 2 - 1, v = y / (h - 1), half = v < 0.45 ? 0.8 - 0.25 * Math.sin(v / 0.45 * Math.PI) : Math.sqrt(Math.max(0, 1 - ((v - 0.72) / 0.28) ** 2)); if (Math.abs(u) > half) continue; p.px(x, y, Math.abs(u) > half - 0.2 ? '#4a4452' : Math.abs(u) < 0.5 && v > 0.3 && v < 0.62 ? '#f4f0e8' : v > 0.66 && v < 0.72 ? '#c8ccd8' : '#16121a'); } };

// ---------------------------------------------------------------- the model
const B = (x0, y0, z0, x1, y1, z1, tex, x = {}) => ({ o: [x0, y0, z0], s: [x1 - x0, y1 - y0, z1 - z0], tex, ...x });
const flipC = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: c.plane === 'x' ? c.mirror : !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
const side = (n) => n && n.replace(/R$/, 'L');
const flipB = (b) => ({ name: side(b.name), parent: side(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: b.cubes.map(flipC) });
const both = (...bs) => [...bs, ...bs.map(flipB)];

// the tail: six segments, each a stretch of rust fur and a cream ring, curling up behind into a great plume
const TAIL = [[2.8, 1.8, 6.6, 6.4, 28], [2.8, 1.8, 7.6, 7.4, 24], [2.8, 1.8, 8.2, 8, 20], [2.8, 1.8, 8, 7.8, 16], [2.6, 1.6, 7.2, 7, 12], [2.4, 1.6, 6, 5.8, 8]];
const TY = 11.6;
const tailBones = (() => {
  let z = -9.6;
  return TAIL.map(([lr, lg, wr, wg, rx], i) => {
    const z0 = z, cubes = [
      B(-wr / 2, TY - wr / 2, z0 - lr, wr / 2, TY + wr / 2, z0, rustT),
      B(-wg / 2, TY - wg / 2, z0 - lr - lg, wg / 2, TY + wg / 2, z0 - lr, ringT),
      B(-wg / 2, TY - wg / 2, z0 - lr - lg, wg / 2, TY + wg / 2, z0 - lr, glowRing(C.spec[i]), { glow: true, inflate: 0.08, id: 'glow' + (i + 1), hide: true }),
    ];
    if (i === TAIL.length - 1) { const e = z0 - lr - lg; cubes.push(B(-2.4, TY - 2.4, e - 2.2, 2.4, TY + 2.4, e, rustT), B(-1.6, TY - 1.6, e - 3.6, 1.6, TY + 1.6, e - 2.2, tipT), B(-0.8, TY - 0.8, e - 4.4, 0.8, TY + 0.8, e - 3.6, tipT)); }
    z -= lr + lg;
    return { name: 'tail' + (i + 1), parent: i ? 'tail' + i : 'body', pivot: [0, TY, z0], rot: [rx, 0, 0], cubes };
  });
})();
const RIGHT = {
  legF: { name: 'legFR', parent: 'body', pivot: [-3.8, 8.6, 3], cubes: [
    B(-5.4, 0.8, 1.4, -2.2, 9.4, 4.6, blackP),
    B(-5.7, 0, 0.9, -1.9, 1.8, 5.4, pawP),
  ] },
  legH: { name: 'legHR', parent: 'body', pivot: [-4.4, 8.6, -5.5], cubes: [
    B(-7.2, 3.8, -8.6, -3.2, 10.8, -2.6, blackP),                    // the round haunch
    B(-6.2, 0.8, -6.8, -3, 4.6, -3.6, blackP),
    B(-6.5, 0, -7.4, -2.7, 1.8, -3, pawP),
  ] },
  ear: { name: 'earR', parent: 'head', pivot: [-5, 23.2, 7.2], rot: [0, 0, 16], cubes: [
    B(-7.4, 22.4, 5.6, -2.8, 26.4, 8.6, earP),
    B(-6.8, 26.4, 6, -3.4, 28, 8.2, earP),
    B(-6, 28, 6.4, -4.2, 28.8, 7.8, earP),
    B(-6.667, 23, 8.62, -3.333, 27, 8.62, innerEar, { plane: 'z' }),
  ] },
};

export const def = {
  name: 'zapanda', ppu: 3, scale: 0.4, outline: { color: '#2a1014', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 8.5, -5.5], cubes: [
      B(-6, 5.4, -9.2, 6, 15.4, 4.6, coatP),
      B(-6.8, 7, -8, 6.8, 13.8, 3.4, coatP),
      B(-5, 15.4, -8.2, 5, 16.4, 3.6, coatP),
      B(-5, 4.6, -8.2, 5, 5.4, 3.6, coatP),
      B(-4.8, 6.6, -10.2, 4.8, 14.2, -9.2, coatP),
      B(-4.6, 6.2, 4.6, 4.6, 13.6, 5.6, coatP),
    ] },
    ...both(RIGHT.legF, RIGHT.legH),
    { name: 'head', parent: 'body', pivot: [0, 13.6, 3.6], cubes: [
      B(-6.2, 12.6, 3, 6.2, 23.4, 12.4, headP),
      B(-7, 14.4, 3.8, 7, 21.8, 11.6, headP),
      B(-5.2, 23.4, 4, 5.2, 24.4, 11.4, headP),
      B(-5.4, 11.8, 4, 5.4, 12.6, 11.4, headP),
      B(-8.2, 12.6, 6.4, -6, 16.2, 10.6, tuftP, { pivot: [-6.4, 15.4, 8.4], rot: [0, 0, 30] }),
      B(6, 12.6, 6.4, 8.2, 16.2, 10.6, tuftP, { pivot: [6.4, 15.4, 8.4], rot: [0, 0, -30], mirror: true }),
      B(-2.8, 12.6, 12.4, 2.8, 16.8, 15, muzzleP),
      B(-2.2, 16.8, 12.4, 2.2, 17.6, 14, whiteP),
      B(-1.4, 15.4, 14.8, 1.4, 16.8, 15.6, noseP),
      B(-1.9, 12.2, 14.8, -1.233, 12.867, 15.2, fangP, { outline: false }),
      B(-2.2, 12.3, 12.2, 2.2, 13.2, 14.9, mouthIn, { outline: false }),
      B(-1.333, 21, 12.42, 1.333, 23.333, 12.42, prismP(false), { plane: 'z', id: 'prism' }),
      B(-1.333, 21, 12.44, 1.333, 23.333, 12.44, prismP(true), { plane: 'z', id: 'prism-lit', glow: true, hide: true }),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 13.1, 12.2], cubes: [
      B(-2.6, 11.9, 12, 2.6, 13.1, 14.9, whiteP),
      B(-1.4, 12.8, 12.4, 1.4, 13.2, 14.4, tongueP, { outline: false }),
    ] },
    // the scarf round its neck, the loose end hanging over one shoulder
    { name: 'scarf', parent: 'body', pivot: [0, 11.6, 4], cubes: [B(-5.8, 10.2, 1.2, 5.8, 12.2, 6.6, scarfP, { id: 'acc-scarf', hide: true })] },
    { name: 'scarfEnd', parent: 'scarf', pivot: [3.0, 10.8, 6.4], rot: [-8, 0, 6], cubes: [B(1.8, 5.4, 5.9, 4.2, 10.8, 6.9, scarfEnd, { id: 'acc-scarf', hide: true })] },
    ...both(RIGHT.ear),
    ...EYES.bones,
    // drip 1 (or): studded over-ear headphones resting round its neck
    { name: 'phones', parent: 'body', pivot: [0, 12.4, 4], cubes: [
      B(-7.4, 10.4, 2.6, -5.8, 13.4, 5.8, phoneP), B(5.8, 10.4, 2.6, 7.4, 13.4, 5.8, phoneP), B(-6.6, 12.8, 0.6, 6.6, 13.6, 1.6, '#2a2430'),
    ].map((c) => ({ ...c, id: 'acc-phones', hide: true })) },
    // drip 2: a glass prism pendant on a silver chain, splitting the light down its chest
    { name: 'pendant', parent: 'body', pivot: [0, 10.4, 5.8], cubes: [
      B(-2.6, 10.2, 5.6, 0, 10.6, 6.0, '#d8dce8', { pivot: [-1.3, 10.4, 5.8], rot: [0, 0, 24] }), B(0, 10.2, 5.6, 2.6, 10.6, 6.0, '#d8dce8', { pivot: [1.3, 10.4, 5.8], rot: [0, 0, -24] }),
      B(-1.2, 7.0, 6.1, 1.2, 9.6, 6.1, prismPend, { plane: 'z', glow: true }),
    ].map((c) => ({ ...c, id: 'acc-prism', hide: true })) },
    // drip 2 (or): a pink inflatable pig strapped to its back
    { name: 'pig', parent: 'body', pivot: [0, 16.4, -3], cubes: [
      B(-2.6, 16.2, -6.4, 2.6, 19.6, -0.6, pigP), B(-1.4, 16.8, -0.6, 1.4, 18.8, 0.4, pigP), B(-1.2, 17.0, 0.4, 1.2, 18.6, 0.4, snoutPig, { plane: 'z' }),
      B(-2.4, 19.4, -1.6, -1.4, 20.6, -0.8, pigP), B(1.4, 19.4, -1.6, 2.4, 20.6, -0.8, pigP),
      B(-2.2, 15.2, -5.8, -1.2, 16.2, -4.8, pigP), B(1.2, 15.2, -5.8, 2.2, 16.2, -4.8, pigP), B(-2.2, 15.2, -2.0, -1.2, 16.2, -1.0, pigP), B(1.2, 15.2, -2.0, 2.2, 16.2, -1.0, pigP),
      B(-6.2, 15.6, -3.0, 6.2, 16.2, -2.4, '#2a2430'),
    ].map((c) => ({ ...c, id: 'acc-pig', hide: true })) },
    // drip 3: a crescent-moon tiara between its ears
    { name: 'tiara', parent: 'head', pivot: [0, 24.4, 8], cubes: [
      B(-1.8, 24.2, 8.0, 1.8, 27.8, 8.0, moonP, { plane: 'z', glow: true }), B(-3.2, 24.2, 6.6, 3.2, 24.8, 7.4, '#ffd23e'),
    ].map((c) => ({ ...c, id: 'acc-moon', hide: true })) },
    // drip 3 (or): a black electric guitar slung on its left flank, the neck riding up over its back
    { name: 'guitar', parent: 'body', pivot: [6.9, 10, -2], rot: [-34, 0, 0], cubes: [
      B(6.95, 5.6, -5.4, 6.95, 11.8, 1.2, strat, { plane: 'x' }), B(6.6, 11.6, -2.6, 7.3, 19.2, -1.8, '#3a2a1e'), B(6.5, 19.0, -2.9, 7.4, 20.8, -1.5, '#16121a'),
      B(-6.2, 12.0, 4.4, 6.4, 12.6, 5.0, '#2a2430', { pivot: [0, 12.3, 4.7], rot: [0, 0, -18] }),
    ].map((c) => ({ ...c, id: 'acc-guitar', hide: true })) },
    ...tailBones,
  ],
};

// appearance tiers: normal wears one of the first list, dripped adds one of the second, ultra dripped one of the third
def.drip = [
  [{ id: 'acc-scarf', name: 'Spectrum scarf' }, { id: 'acc-phones', name: 'Studded headphones' }],
  [{ id: 'acc-prism', name: 'Prism pendant' }, { id: 'acc-pig', name: 'Inflatable pig' }],
  [{ id: 'acc-moon', name: 'Crescent-moon tiara' }, { id: 'acc-guitar', name: 'Black guitar' }],
];
// where buyable gear sits (model units; size = the width of that part)
def.attach = {
  head: { bone: 'head', at: [0, 24.4, 7.6], size: 10.4 },
  face: { bone: 'head', at: [0, 19.5, 12.45], size: 12.4 },
  neck: { bone: 'body', at: [0, 12.6, 5.6], size: 9.2 },
  back: { bone: 'body', at: [0, 16.4, -2.4], size: 10 },
};

// ---------------------------------------------------------------- animation
defineFx('zap', { w: 7, h: 9, frames: [0, 1, 2].map((f) => (p) => { let x = 3; for (let y = 0; y < 9; y++) { p.px(x, y, '#ffffff'); p.px(x + 1, y, '#fff27a'); if (y % 3 === 2) x += ((y + f) % 2 ? 2 : -2); x = Math.max(0, Math.min(5, x)); } }), glow: true, life: [0.08, 0.16], size: [0.1, 0.14], speed: [0, 0.4], grav: 0, spread: 1, spin: 6, fps: 30 });
defineFx('ray', { w: 4, h: 4, paint: (p) => { p.rect(1, 0, 2, 4, '#ffffff'); p.rect(0, 1, 4, 2, '#ffffff'); }, glow: true, life: [0.32, 0.32], size: [0.1, 0.14], speed: [1.5, 7.5], grav: 0, drag: 0, spread: 0.012 });
defineFx('beam', { w: 5, h: 5, paint: (p) => { p.rect(1, 0, 3, 5, '#ffffff'); p.rect(0, 1, 5, 3, '#ffffff'); }, glow: true, life: [0.07, 0.07], size: [0.16, 0.12], speed: [0.5, 4.6], grav: 0, drag: 0, spread: 0.01 });
defineFx('slash', { w: 11, h: 11, paint: (p) => { for (const o of [-3, 0, 3]) for (let i = 1; i < 10; i++) { const x = i + o, y = 10 - i; if (x >= 0 && x < 11) { p.px(x, y, i > 2 && i < 8 ? '#ffffff' : '#fff27a'); if (x + 1 < 11) p.px(x + 1, y, '#ffe23a'); } } }, glow: true, life: [0.2, 0.24], size: [0.3, 0.5], speed: [0, 0], grav: 0, pop: true });
const MOUTH = [0, 13.2, 15.6], PRISM = [0, 22.6, 13], CHEEK = { R: [-6.4, 15.6, 11], L: [6.4, 15.6, 11] };
const LEG = { FR: [-3.8, 8.6, 3], FL: [3.8, 8.6, 3], HR: [-4.4, 8.6, -5.5], HL: [4.4, 8.6, -5.5] }, BP = [0, 8.5, -5.5];
const ALL = ['FR', 'FL', 'HR', 'HL'];
// move the body (offsets in units, pitch + = nose down, roll + = toward its right) and keep the listed paws on the ground:
// each planted leg hangs plumb and stretches or squashes to reach the floor
function body(P, dx, dy, dz, pitch = 0, roll = 0, legs = ALL, yaw = 0) {
  P.pos('body', dx, dy, dz).rot('body', pitch, yaw, roll).rot('tail1', -pitch * (pitch < 0 ? 0.8 : 0.5), 0, 0);
  const p = pitch / R2D, r = roll / R2D;
  for (const k of legs) {
    const [x, y, z] = LEG[k], rx = x - BP[0], ry = y - BP[1], rz = z - BP[2];
    const Y = rx * Math.sin(r) + ry * Math.cos(r), Y2 = Y * Math.cos(p) - rz * Math.sin(p);
    P.rot('leg' + k, -pitch, -yaw, -roll).scl('leg' + k, 1, Math.max(0.3, (BP[1] + dy + Y2) / y), 1);
  }
}
const tailNames = TAIL.map((_, i) => 'tail' + (i + 1));
// a lazy travelling S through the tail: amp (deg), hz, lift (deg per segment, + curls up / − droops)
function swish(P, t, amp = 8, hz = 0.5, lift = 0, ph = 0) {
  tailNames.forEach((n, i) => P.rot(n, lift, Math.sin(t * TAU * hz - i * 0.7 + ph) * amp * (0.6 + i * 0.12), Math.sin(t * TAU * hz - i * 0.7 + ph + 1.2) * amp * 0.25));
}
const charge = (P, n) => P.face('charge', 'c' + Math.max(0, Math.min(6, Math.round(n))));

export const anim = {
  start: 'idle', seed: 5,
  breathe: { bone: 'body', amp: 0.018, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.0, 4.6], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 14, speed: 6 },
  springs: [
    { bone: 'earR', tip: [0, 4, 0], k: 220, d: 10, gain: 0.7, max: 22 },
    { bone: 'scarfEnd', tip: [0, -5, 0.5], k: 150, d: 8, gain: 0.9, max: 30 },
    { bone: 'pendant', tip: [0, -3, 0.5], k: 120, d: 6, gain: 0.9, max: 22 },
    { bone: 'pig', tip: [0, 3, -2], k: 140, d: 6, gain: 0.8, max: 16 },
    { bone: 'tiara', tip: [0, 3, 0], k: 260, d: 12, gain: 0.4, max: 8 },
    { bone: 'earL', tip: [0, 4, 0], k: 230, d: 10, gain: 0.7, max: 22 },
    { bone: 'tail1', tip: [0, 0, -4.6], k: 190, d: 12, gain: 0.32, max: 9 },
    { bone: 'tail2', tip: [0, 0, -4.6], k: 170, d: 11, gain: 0.36, max: 10 },
    { bone: 'tail3', tip: [0, 0, -4.6], k: 150, d: 10, gain: 0.42, max: 12 },
    { bone: 'tail4', tip: [0, 0, -4.6], k: 140, d: 9, gain: 0.46, max: 13 },
    { bone: 'tail5', tip: [0, 0, -4.2], k: 130, d: 9, gain: 0.5, max: 14 },
    { bone: 'tail6', tip: [0, 0, -6], k: 120, d: 8, gain: 0.55, max: 16 },
  ],
  faces: {
    eyes: EYES.slot,
    charge: { default: 'c0', states: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((n) => ['c' + n, Array.from({ length: n }, (_, i) => 'glow' + (i + 1))])) },
    prism: { default: 'off', states: { off: ['prism'], lit: ['prism-lit'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'tailcheck', 'standup'] },
  clips: {
    // roly-poly bounce, a cocky head tilt, the tail swishing in a lazy S, the first ring blinking like a standby light
    idle: { len: 2.0, loop: true, f(P, t) {
      const b = bounce(t, 1.0, { squash: 0.09, stretch: 0.04 }), sway = Math.sin(t * TAU * 0.5);
      body(P, 0, b.u * 0.9 - 0.2, 0, 0, sway * 3);
      P.sq('body', b.sq);
      P.rot('head', 4 - b.u * 4, sway * 4, -sway * 7).pos('head', 0, -b.u * 0.3, 0);
      swish(P, t, 9, 0.5);
      const [gx, gy] = glance(t, [[0, 0], [-0.3, 0.05], [0, 0], [0.35, 0.05]], 0.5);
      eyesAt(P, gx, gy).face('eyes', t > 0.95 && t < 1.3 ? 'smug' : undefined); eyesScale(P, 1, 1 + 0.5 * b.sq);
      P.rot('earR', 0, 0, -18 * bump(t, 1.35, 1.5)).rot('earL', 0, 0, 4 * sway);
      charge(P, t % 1 < 0.5 ? 1 : 0);
      P.rot('jaw', 2);
      if (t > 1.62 && t < 1.7) P.stream('zap', 'head', CHEEK.R, { rate: 40, scale: 0.6 });
    } },
    // a bustling trot: diagonal pairs, the round body bobbing, the head nodding a beat behind
    walk: { len: 0.64, loop: true, f(P, t) {
      const ph = (t / 0.64) * TAU, s = Math.sin(ph), c = Math.cos(ph), up = Math.abs(Math.cos(ph));
      body(P, 0, up * 0.9 - 0.2, 0, -2, s * 4);
      P.sq('body', -0.05 * (1 - up) ** 3);
      for (const [k, g] of [['FR', 1], ['HL', 1], ['FL', -1], ['HR', -1]]) {
        const sw = s * g, lift = Math.max(0, c * g);
        P.rot('leg' + k, -sw * 26, 0, 0).scl('leg' + k, 1, 1 - lift * 0.22, 1);
      }
      P.rot('head', 3 + Math.sin(ph * 2 - 0.8) * 4, -s * 5, s * 3);
      swish(P, t, 10, 1 / 0.64, 0, 0);
    } },
    // entrance: up on its hind legs in the red panda's threat stance, arms flung wide, crackling, every ring flashing
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4, E.out)), up = seg(t, 0.32, 0.56, E.back) * (1 - seg(t, 1.62, 1.92, E.inout));
      const land = t > 1.9 ? wob(t, 1.9, 1, 3, 6) : 0;
      body(P, 0, -1.4 * crouch + 2 * up + land * -0.6, -1.5 * up, 8 * crouch - 64 * up, wave(t, 6) * 2 * up, up > 0.2 ? ['HR', 'HL'] : ALL);
      P.sq('body', -0.12 * crouch + 0.08 * up * (1 - seg(t, 0.56, 0.7)) + land * -0.1);
      P.rot('head', 52 * up + 6 * crouch, 0, wave(t, 5) * 4 * up).rot('jaw', 30 * up * (0.8 + 0.2 * wave(t, 9)));
      for (const [k, g] of [['FR', 1], ['FL', -1]]) P.rot('leg' + k, -70 * up, 0, -g * 70 * up + g * wave(t, 7) * 6 * up);
      P.rot('earR', 0, 0, 20 * up).rot('earL', 0, 0, -20 * up);
      swish(P, t, 12 * up + 6, 1.4, 5 * up);
      P.face('eyes', crouch > 0.3 ? 'angry' : up > 0.3 ? (t > 0.56 && t < 0.7 ? 'shut' : 'angry') : t > 1.95 ? 'smug' : undefined).face('prism', up > 0.4 ? 'lit' : 'off');
      eyesScale(P, 1 + 0.15 * up, 1 - 0.2 * crouch + 0.1 * up); P.burst(0.55, 'anger', 'head', [5.6, 26, 9], {});
      charge(P, up > 0.3 ? (Math.floor(t * 18) % 7) : 0);
      P.blinkOK = false;
      if (up > 0.5) P.stream('zap', 'body', [0, 12, 0], { rate: 22, spread: 1, scale: 1.2 }).stream('zap', 'head', CHEEK.R, { rate: 10 }).stream('zap', 'head', CHEEK.L, { rate: 10, key: 'L' });
      P.burst(0.58, 'spark', 'head', PRISM, { n: 2 }).burst(0.58, 'ring', 'body', [0, 14, 0], { scale: 0.8, tint: [1, 0.95, 0.5] });
      P.burst(1.94, 'dust', 'root', [0, 0.5, 2], { n: 8, spread: 1, speed: 1.2 });
    } },
    // zap swipe: crouch, pounce, a crackling paw swipe, land
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.2, E.inout) * (1 - seg(t, 0.2, 0.26, E.out)), air = bump(t, 0.22, 0.5), sw = seg(t, 0.3, 0.42, E.out3) * (1 - seg(t, 0.5, 0.8, E.inout));
      const fwd = 5.5 * seg(t, 0.2, 0.46, E.out) * (1 - seg(t, 0.62, 0.98, E.inout)), land = t > 0.5 ? wob(t, 0.5, 1, 3, 7) : 0;
      body(P, 0, -1.6 * crouch + 3 * air - 0.8 * land, 0, 10 * crouch - 18 * air, -10 * sw, air > 0.1 ? ['HR', 'HL', 'FL'] : ALL);
      P.pos('root', 0, 0, fwd).sq('body', -0.14 * crouch + 0.1 * air - 0.1 * Math.max(0, land));
      P.rot('legFR', -90 * sw - 20 * air, 30 * sw, 40 * sw).rot('head', -8 * crouch + 10 * air, -8 * sw, 6 * sw).rot('jaw', 20 * sw);
      swish(P, t, 12, 1.2, 4 * air);
      P.face('eyes', crouch > 0.2 || sw > 0.1 ? (sw > 0.6 ? 'shut' : 'angry') : t > 0.7 ? 'smug' : undefined); P.blinkOK = false;
      eyesScale(P, 1 + 0.1 * air, 1 - 0.25 * crouch + 0.15 * air);
      charge(P, sw > 0.2 ? 3 : 0);
      const PAW = [-3.8, 0.4, 9];
      P.burst(0.4, 'slash', 'body', [-2.5, 12, 19], {}).burst(0.4, 'spark', 'body', [-2.5, 12, 19], { n: 2 }).burst(0.4, 'bolt', 'legFR', PAW, { n: 3 }).burst(0.42, 'zap', 'legFR', PAW, { n: 6, speed: 1.6 });
      P.burst(0.52, 'dust', 'root', [0, 0.5, 4], { n: 6, spread: 1, speed: 1 });
    } },
    // prism beam: charges ring by ring (red → violet), the prism blazes, white light pours out and fans into a rainbow
    special: { len: 2.7, next: 'idle', f(P, t) {
      const brace = seg(t, 0, 0.25, E.inout) * (1 - seg(t, 2.1, 2.5, E.inout)), lvl = Math.min(6, Math.floor(seg(t, 0.15, 1.05, E.lin) * 7));
      const pull = seg(t, 1.05, 1.3, E.inout) * (1 - seg(t, 1.3, 1.36, E.out)), fire = t > 1.34 && t < 2.05 ? 1 : 0, kick = seg(t, 1.34, 1.42, E.out) * (1 - seg(t, 1.5, 2.1, E.inout));
      const drain = t > 1.34 ? Math.max(0, 6 - Math.floor((t - 1.34) / 0.12)) : lvl;
      body(P, 0, -1.2 * brace + 0.3 * wave(t, 12) * (lvl / 6) * (1 - fire), -1.8 * kick, 6 * brace - 8 * pull + 10 * kick, 0);
      P.sq('body', 0.05 * (lvl / 6) * (1 - fire) - 0.08 * kick).scl('body', 1 + 0.04 * (lvl / 6) * (t < 1.34 ? 1 : 0));
      P.rot('head', -6 * brace - 14 * pull + 8 * kick, 0, 0).rot('jaw', 8 * (lvl / 6) + 26 * fire);
      swish(P, t, t < 1.34 ? 3 + lvl : 12, t < 1.34 ? 3 : 1, t < 1.34 ? 4 + lvl * 0.8 : -4);
      P.face('eyes', t < 1.05 ? 'angry' : t < 1.34 ? 'shut' : t < 2.1 ? 'angry' : 'smug').face('prism', t > 0.95 && t < 2.1 ? 'lit' : 'off'); P.blinkOK = false;
      eyesScale(P, 1 + 0.05 * lvl, 1 - 0.03 * lvl - 0.3 * pull + 0.25 * kick); eyesAt(P, 0.06 * wave(t, 14) * lvl * (t < 1.34 ? 1 : 0), 0);
      charge(P, t < 1.34 ? lvl : drain);
      if (t > 0.2 && t < 1.34) P.stream('zap', 'body', [0, 13, -4], { rate: 6 + lvl * 4, spread: 1, scale: 1.1 }).stream('zap', 'tail' + Math.max(1, lvl), [0, TY, -12 - lvl * 4.6], { rate: 6, key: 't' });
      P.burst(1.0, 'sparkle', 'head', PRISM, { n: 6, speed: 0.8 });
      if (fire) {
        P.stream('beam', 'head', PRISM, { rate: 420, dir: [0, -0.02, 1] });
        C.spec.forEach((c, i) => {
          const rgb = [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16) / 255);
          P.stream('ray', 'head', [0, 22.4, 26], { rate: 240, dir: [0, 0.3 - i * 0.12, 1], tint: rgb, key: 'r' + i });
        });
        P.stream('zap', 'head', [0, 22.4, 25], { rate: 14, spread: 0.6, key: 'split' });
      }
      P.burst(1.34, 'ring', 'head', [0, 22.4, 26], { scale: 0.9 }).burst(1.34, 'spark', 'head', PRISM, { n: 2 });
      P.burst(2.12, 'steam', 'body', [0, 16, -4], { n: 6, spread: 0.8 });
    } },
    // the fur poofs out, the rings flicker off, a jolt back
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      body(P, 0, 0.6 * k, -2.4 * k, -10 * k + wob(t, 0.06, 4, 4, 7), wave(t, 15) * 4 * k);
      P.scl('body', 1 + 0.12 * k, 1 + 0.1 * k, 1 + 0.12 * k).rot('head', -14 * k, 0, wave(t, 13) * 6 * k).rot('jaw', 24 * k);
      swish(P, t, 18 * k, 4, -10 * k);
      P.rot('earR', 0, 0, 30 * k).rot('earL', 0, 0, -30 * k);
      P.face('eyes', t < 0.1 ? 'shock' : t < 0.4 ? 'shut' : t < 0.6 ? 'teary' : undefined); P.blinkOK = false;
      eyesScale(P, 1 + 0.3 * bump(t, 0, 0.12), 1 + 0.4 * bump(t, 0, 0.12) - 0.25 * bump(t, 0.12, 0.4));
      P.burst(0.05, 'sweat', 'head', [-6, 24, 10], { n: 2, dir: [-1, 1, 0.3] });
      charge(P, t < 0.36 ? [3, 0, 5, 1, 0, 2, 0][Math.floor(t * 20) % 7] : 0);
      P.burst(0.02, 'spark', 'body', [0, 13, 4], { n: 2 }).burst(0.02, 'zap', 'body', [0, 13, 0], { n: 6, speed: 1.6 }).burst(0.04, 'star', 'head', [0, 26, 8], { n: 3 });
    } },
    // dizzy wobble, then a roly-poly topple onto its side, paws in the air
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      body(P, 0, -0.6 * dizzy - 1.6 * fall, 0, 0, wave(t, 1.4) * 8 * dizzy + 98 * fall, fall > 0.05 ? [] : ALL);
      P.rot('head', 0, wave(t, 1.4, 1) * 14 * dizzy, wave(t, 1.4) * 10 * dizzy - 10 * fall).rot('jaw', 18 * fall);
      for (const k of ALL) P.rot('leg' + k, -14 * fall, 0, -24 * fall);
      swish(P, t, 6 * (1 - fall), 0.7, -10 * fall);
      tailNames.forEach((n, i) => P.rot(n, 0, -24 * fall, 0));
      P.face('eyes', t < 0.95 ? 'swirl' : t < 1.4 ? 'shock' : 'x').face('prism', 'off'); P.blinkOK = false; P.lookW = 0;
      eyesScale(P, 1 + 0.25 * bump(t, 0.95, 1.4), 1 + 0.3 * bump(t, 0.95, 1.4));
      charge(P, t < 0.9 ? [2, 1, 0][Math.floor(t * 6) % 3] : 0);
      P.burst(1.4, 'dust', 'root', [-6, 1, 0], { n: 10, spread: 1, speed: 1.2 }).burst(0.7, 'star', 'head', [0, 27, 8], { n: 5 });
      P.burst(1.45, 'zap', 'body', [0, 10, 0], { n: 4, speed: 1 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      body(P, 0, -1.6, 0, 0, 98, []);
      P.rot('head', 0, 0, -10).rot('jaw', 18 + wave(t, 0.4) * 4);
      for (const [k, i] of [['FR', 0], ['FL', 1], ['HR', 2], ['HL', 3]]) P.rot('leg' + k, -14 + wave(t, 0.8, i) * 4, 0, -24);
      swish(P, t, 3, 0.4, -10);
      tailNames.forEach((n, i) => P.rot(n, 0, -24 + wave(t, 0.4, i * 0.5) * 4, 0));
      P.face('eyes', 'swirl').face('prism', 'off'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5; eyesScale(P, 1 + 0.06 * wave(t, 0.4), 1 - 0.06 * wave(t, 0.4));
      P.burst(0.9, 'zap', 'body', [0, 12, -2], { n: 2, speed: 0.6 }).burst(1.0, 'smoke', 'body', [0, 14, -2], { n: 1, scale: 0.5 });
    } },
    // victory: hops up onto its hind legs and pirouettes, rings chasing round the spectrum, then drops with a smug bounce
    win: { len: 2.3, next: 'idle', f(P, t) {
      const up = seg(t, 0.1, 0.36, E.back) * (1 - seg(t, 1.8, 2.05, E.inout)), spin = seg(t, 0.5, 1.4, E.inout), hopY = Math.max(0, Math.sin(seg(t, 0.36, 0.6, E.lin) * Math.PI)) * 3;
      const land = t > 2.05 ? wob(t, 2.05, 1, 3, 6) : 0;
      body(P, 0, 2 * up + hopY - 0.6 * land, -1.5 * up, -62 * up, 0, up > 0.2 ? ['HR', 'HL'] : ALL);
      P.rot('root', 0, 360 * spin, 0).sq('body', 0.06 * up * (1 - seg(t, 0.4, 0.6)) - 0.1 * land);
      P.rot('head', 50 * up, 0, wave(t, 2.5) * 8 * up).rot('jaw', 10 * up);
      for (const [k, g] of [['FR', 1], ['FL', -1]]) P.rot('leg' + k, -100 * up + wave(t, 3, g) * 14 * up, 0, -g * 30 * up);
      swish(P, t, 16 * up + 6, 1.2, 6 * up);
      P.face('eyes', up > 0.3 ? (spin > 0.05 && spin < 0.95 ? 'star' : 'happy') : land > 0.1 ? 'wink' : undefined).face('prism', up > 0.3 ? 'lit' : 'off'); P.blinkOK = up < 0.3;
      eyesScale(P, 1 + 0.15 * up, 1 + 0.15 * up - 0.3 * Math.max(0, land));
      charge(P, up > 0.3 ? (Math.floor(t * 12) % 7) : 0);
      P.burst(0.6, 'sparkle', 'head', PRISM, { n: 10, speed: 1.6 }).burst(1.4, 'sparkle', 'body', [0, 20, 0], { n: 8, speed: 1.4 });
      if (up > 0.5) P.stream('zap', 'body', [0, 14, 0], { rate: 8, spread: 1 });
    } },
    // napping on its belly, chin on its paws, the tail wrapped round its side like a blanket — the rings slowly refill
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * TAU);
      body(P, 0, -3.4 + br * 0.25, 0, 4, 0, []);
      P.sq('body', -0.05 + br * 0.03);
      P.rot('legFR', -62, 0, 8).rot('legFL', -62, 0, -8).scl('legFR', 1, 0.8, 1).scl('legFL', 1, 0.8, 1);
      P.rot('legHR', 60, 0, 10).rot('legHL', 60, 0, -10).scl('legHR', 1, 0.6, 1).scl('legHL', 1, 0.6, 1);
      P.rot('head', 26 + br * 2, -10, -8).pos('head', 0, -1.2, 0.6).rot('earR', 0, 0, 12).rot('earL', 0, 0, -8);
      [-48, -40, -34, -30, -24, -14].forEach((a, i) => P.rot(tailNames[i], -TAIL[i][4] - 2 + br * 1.5, a, 0));
      P.face('eyes', 'closed').face('prism', 'off'); P.blinkOK = false; P.lookW = 0; P.breathW = 0; eyesScale(P, 1, 0.88 + 0.12 * br);
      charge(P, Math.floor((t / 3.6) * 7));
      P.burst(0.5, 'z', 'head', [4, 24, 10], {}).burst(2.2, 'z', 'head', [4, 24, 10], {});
    } },
    // fidget: up on its hind legs for a peek, like a startled red panda — then a smug drop
    standup: { len: 1.6, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.28, E.back) * (1 - seg(t, 1.15, 1.4, E.inout)), land = t > 1.4 ? wob(t, 1.4, 1, 3, 6) : 0;
      body(P, 0, 1.6 * up - 0.5 * land, -1.2 * up, -56 * up, 0, up > 0.2 ? ['HR', 'HL'] : ALL);
      P.sq('body', 0.05 * up - 0.08 * land);
      P.rot('head', 46 * up, wave(t, 1.2) * 18 * up, 0);
      for (const [k, g] of [['FR', 1], ['FL', -1]]) P.rot('leg' + k, -60 * up, 0, -g * 50 * up);
      swish(P, t, 10, 1, 2 * up);
      P.face('eyes', up > 0.5 ? (t > 0.3 && t < 0.6 ? 'shock' : 'wide') : land > 0.1 ? 'smug' : undefined);
      eyesScale(P, 1 + 0.2 * up, 1 + 0.3 * up); eyesAt(P, 0.35 * wave(t, 1.2) * up, 0.15 * up);
      P.burst(0.32, 'sweat', 'head', [6, 25, 9], { n: 1, dir: [1, 1, 0.2] });
      P.burst(0.3, 'zap', 'body', [0, 14, 0], { n: 3 });
    } },
    // fidget: a look back at its own battery — flick, rings 1-2-3 light, then off — and a smirk at you
    // signature fidget: a look back at its own battery — flick, the rings fill red to violet… overcharge! A jolt
    // puffs its fur out and stands it on end, smoke curls off the tail tip; it smooths itself down and smirks at you
    tailcheck: { len: 2.8, next: 'idle', f(P, t) {
      const look = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 1.3, 1.45, E.out)), flick = bump(t, 0.6, 0.9);
      const jolt = seg(t, 1.38, 1.44, E.out) * (1 - seg(t, 1.6, 2.1, E.inout)), smooth = bump(t, 2.0, 2.5), smirk = seg(t, 2.2, 2.4) * (1 - seg(t, 2.6, 2.8));
      body(P, 0, 2.4 * bump(t, 1.38, 1.7), 0, -8 * jolt, -4 * look, ALL, 12 * look);
      P.scl('body', 1 + 0.14 * jolt, 1 + 0.12 * jolt, 1 + 0.14 * jolt).rot('head', -6 * look - 10 * jolt + 6 * smooth, 80 * look - 8 * smirk, 10 * look + wave(t, 16) * 6 * jolt);
      tailNames.forEach((n, i) => P.rot(n, 14 * flick * (i / 5) - 10 * jolt, wave(t, 18, i) * 8 * jolt, 0));
      P.rot('earR', 0, 0, 34 * jolt).rot('earL', 0, 0, -34 * jolt);
      swish(P, t, 6 * (1 - jolt), 0.6);
      charge(P, t > 0.8 && t < 1.38 ? Math.min(6, Math.floor((t - 0.8) / 0.08) + 1) : t < 1.6 ? (Math.floor(t * 30) % 2 ? 6 : 0) : 0);
      P.face('eyes', t < 0.8 ? undefined : t < 1.38 ? 'glint' : t < 1.65 ? 'shock' : t < 2.15 ? 'shut' : 'smug').face('prism', jolt > 0.3 ? 'lit' : 'off'); P.blinkOK = false;
      eyesScale(P, 1 + 0.4 * jolt, 1 + 0.5 * jolt - 0.25 * smooth);
      P.burst(0.9, 'zap', 'tail3', [0, TY, -20], { n: 3 }).burst(1.38, 'bolt', 'body', [0, 14, -2], { n: 6, speed: 2 }).burst(1.38, 'zap', 'body', [0, 12, 0], { n: 10, spread: 1, speed: 1.8 });
      P.burst(1.4, 'spark', 'head', PRISM, { n: 2 }).burst(1.5, 'smoke', 'tail6', [0, TY, -42], { n: 4, scale: 0.6 }).burst(1.45, 'sweat', 'head', [6, 25, 9], { n: 2, dir: [1, 1, 0.2] });
    } },
    // dance: a slow, spacey groove — up on its hind legs, swaying through a long guitar bend, paws drifting, the tail's
    // rings lighting up the spectrum one by one on the beat; it ends with a paw raised and the prism blazing
    dance: { len: 3.2, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 2.85, 3.2, E.inout)), beat = (t / 0.4) % 1, hit = Math.exp(-beat * 7) * up;
      const sw = Math.sin(t * Math.PI * 1.25), fin = seg(t, 2.35, 2.5, E.back) * (1 - seg(t, 2.85, 3.1));
      body(P, 0, 1.8 * up - 0.4 * hit, -1.2 * up, -58 * up, sw * 7 * up * (1 - fin), up > 0.2 ? ['HR', 'HL'] : ALL, sw * 12 * up * (1 - fin));
      P.sq('body', -0.05 * hit);
      P.rot('head', 46 * up - 6 * hit, -sw * 12 * up, sw * 12 * up * (1 - fin));
      for (const [k, g] of [['FR', 1], ['FL', -1]]) {
        const drift = Math.sin(t * Math.PI * 1.25 + (g > 0 ? 0 : Math.PI));
        P.rot('leg' + k, ((-80 - 30 * drift) * up) * (1 - fin) + (g > 0 ? -160 : -60) * fin, 0, -g * (34 + 16 * drift) * up);
      }
      swish(P, t, 14 * up + 4, 0.6, 5 * up);
      charge(P, up > 0.3 ? Math.min(6, Math.floor(t / 0.4)) : 0);
      P.face('eyes', fin > 0.3 ? 'glint' : up > 0.4 ? (beat < 0.4 ? 'happy' : 'smug') : undefined).face('prism', fin > 0.3 ? 'lit' : 'off'); P.blinkOK = false;
      eyesScale(P, 1 + 0.08 * hit + 0.15 * fin, 1 - 0.2 * hit + 0.15 * fin);
      for (let k = 0; k < 5; k++) P.burst(0.5 + k * 0.4, 'note', 'head', [k % 2 ? 6 : -6, 25, 9], { n: 1, dir: [k % 2 ? 0.5 : -0.5, 1, 0.3], speed: 1 });
      P.burst(2.4, 'sparkle', 'head', PRISM, { n: 12, speed: 1.4 }).burst(2.4, 'ring', 'head', [0, 22.4, 14], { scale: 0.7, tint: [1, 0.95, 0.6] });
    } },
  },
};
def.anim = anim;

// the ultra-drip form: the eyes keep their own colours, and pale creams that blackGold would lacquer black turn
// champagne gold instead, so the face stays readable in black and gold
const _lum = (c) => { const n = parseInt(c.slice(1, 7), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (Math.max(r, g, b) + Math.min(r, g, b)) / 510; };
def.dripForm = { map: keepEyes(EYES, (c, glow) => { const v = blackGold(c, glow); return !glow && typeof c === 'string' && c[0] === '#' && _lum(c) > 0.8 && _lum(v) < 0.35 ? '#f2dca0' : v; }) };
