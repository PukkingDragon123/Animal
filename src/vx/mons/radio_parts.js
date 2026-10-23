// Shared parts for the Radiohead Tokonmon (Creepetal → Plastree, Weirdfin): box helpers and
// mirroring, full-res eye states for hand-pixelled eyes, hand-pixelled mouths, painters (plastic
// gloss, knit, paper, chrome, glass), the drip accessory builders every one of them can wear
// (round glasses, knit beanie, headphones, vintage mic, paper crown, supermarket bag, a sticker-
// covered guitar, fairy lights), the line's particle kinds (petal storms, melancholy notes,
// spotlight motes, price tags, glossy plastic leaves, arpeggio rings and orbs) and a
// black-and-gold mapping helper for the ultra-drip form.
import { defineFx } from '../fx.js';
import { ramp, shift, mix } from './kit.js';
import { blackGold } from '../model.js';

export const TAU = Math.PI * 2, PPU = 3;
// a box from corner to corner
export const B = (x0, y0, z0, x1, y1, z1, tex, x = {}) => ({ o: [x0, y0, z0], s: [x1 - x0, y1 - y0, z1 - z0], tex, ...x });
// mirror a right-side (−x) part to the left
export const flipC = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: c.plane === 'x' ? c.mirror : !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
const sideName = (n) => n && n.replace(/R$/, 'L').replace(/R(\d)$/, 'L$1');
export const flipB = (b) => ({ ...b, name: sideName(b.name), parent: sideName(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: (b.cubes || []).map(flipC) });
export const both = (...bs) => [...bs, ...bs.map(flipB)];
// give a set of cubes one shared rotation about one pivot (a rigid group inside a bone)
export const grp = (cubes, pivot, rot) => cubes.map((c) => ({ ...c, pivot, rot }));
// tag cubes as a drip option
export const acc = (id, cubes) => cubes.map((c) => ({ ...c, id, hide: true }));

// ---------------------------------------------------------------- painting helpers
export const isSide = (f) => f !== 'up' && f !== 'down';
// model-space position of a texel centre on a cube face (honours mirrored cubes)
export function at(face, c, x, y) {
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
export const fill = (p, w, h, fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c !== undefined && c !== null) p.px(x, y, c); } };
// a 4-step colour ramp per face: light top, graded sides, dark bottom
export const band = (cols, face, x, y, h) => (face === 'up' ? cols[0] : face === 'down' ? cols[3] : ramp([cols[0], cols[1], cols[2]], h > 1 ? y / (h - 1) : 0.5, x, y));
export const jit = (x) => (((x * 7919) % 13) + 13) % 13 / 13;
// glossy moulded plastic: flat bright bands, a hard white specular streak, a lit rim
export function glossP(cols, o = {}) {
  return (p, w, h, face) => {
    fill(p, w, h, (x, y) => {
      let c = band(cols, face, x, y, h);
      if (face === 'south' || face === 'west' || face === 'up') {
        const d = face === 'up' ? Math.abs(x - y - w * 0.25) : Math.abs(x + y * 0.5 - w * (o.at ?? 0.3));
        if (d < 0.7 && y > 0 && y < h - 1) c = o.gloss || '#ffffff'; else if (d < 1.7 && y > 0 && y < h - 1) c = shift(c, 0.14);
      }
      return c;
    });
    if (isSide(face) && o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(cols[0], 0.14));
  };
}
// hand-knit: vertical ribs of v-stitches, a folded cuff band at the bottom (cuff rows)
export function knitP(cols, o = {}) {
  return (p, w, h, face) => fill(p, w, h, (x, y) => {
    if (face === 'up') return (x + y) % 3 ? cols[1] : cols[2];
    if (face === 'down') return cols[3];
    const cuff = o.cuff && y >= h - o.cuff, rib = cuff ? x % 2 : (x + (y >> 1)) % 3 === 0;
    const c = cuff ? (rib ? cols[2] : cols[1]) : (rib ? cols[2] : (y + x) % 2 ? cols[0] : cols[1]);
    return o.stripe && !cuff && Math.floor(y / 2) % 4 === 1 ? o.stripe : c;
  });
}
// chrome / brass: hard bands with a bright line
export const metalP = (cols) => (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? cols[0] : face === 'down' ? cols[3] : y === Math.floor(h * 0.3) ? '#ffffff' : band(cols, face, x, y, h)));
// a mesh grille (vintage mic capsule)
export const grilleP = (cols) => (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' ? cols[3] : (x + y) % 2 === 0 ? band(cols, face, x, y, h) : shift(band(cols, face, x, y, h), -0.3)));

// ---------------------------------------------------------------- full-res eye states
// Hand-pixelled eyes (eyeRig style 'pix', chunk 1) carry an 'open' map; this draws the expressive
// states properly at full resolution: 2-px lid lines for angry / sad / sleepy / smug, a closed lid
// with a lash flick, a cheek-pushed squint for happy, tears pooling, and a shrunken pupil for shock / wide.
export function pixStates(open, o = {}) {
  const H = open.length, W = open[0].length, T = o.lid ?? 2;
  const g = open.map((r) => [...r]), on = (x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] !== '.';
  const cols = [...Array(W)].map((_, x) => { let a = -1, b = -1; for (let y = 0; y < H; y++) if (on(x, y)) { if (a < 0) a = y; b = y; } return [a, b]; });
  const map = (fn) => g.map((r, y) => r.map((ch, x) => (ch === '.' ? '.' : fn(ch, x, y) ?? ch)).join(''));
  const U = (x) => (x + 0.5) / W;
  // an upper lid at a fraction f(u) of each column's own height: hidden above, a T-px line on it
  const lid = (f) => map((ch, x, y) => { const [a, b] = cols[x], yl = Math.round(a + (b - a) * f(U(x))); return y < yl ? '.' : y < yl + T ? 'l' : undefined; });
  let n = 0, sx = 0, sy = 0; g.forEach((r, y) => r.forEach((ch, x) => { if ('kh'.includes(ch)) { n++; sx += x; sy += y; } }));
  const cx = n ? Math.round(sx / n) : W >> 1, cy = n ? Math.round(sy / n) : H >> 1, whites = open.some((r) => r.includes('w'));
  const arch = (u) => 1 - (2 * u - 1) ** 2;
  return {
    angry: lid((u) => 0.1 + 0.5 * u),
    sad: lid((u) => 0.55 - 0.45 * u),
    sleepy: lid(() => 0.55),
    smug: lid((u) => 0.38 + 0.1 * u),
    closed: map((ch, x, y) => { const [a, b] = cols[x], yl = Math.round(a + (b - a) * (0.55 + 0.2 * arch(U(x)))); return y >= yl && y < yl + T ? 'l' : x === 0 && y === yl - 1 ? 'l' : '.'; }),
    happy: map((ch, x, y) => { const [a, b] = cols[x], yb = Math.round(a + (b - a) * (1.0 - 0.45 * arch(U(x)))); return y > yb ? '.' : y > yb - T ? 'l' : undefined; }),
    teary: map((ch, x, y) => (ch !== 'l' && y >= cols[x][1] - 2 ? 'b' : undefined)),
    shock: map((ch, x, y) => { if (ch === 'l') return 'l'; if (x === cx && y === cy) return 'k'; return whites ? (ch === 's' ? 's' : 'w') : ch === 'k' || ch === 'h' ? 'i' : ch; }),
    wide: map((ch, x, y) => { if (ch === 'l') return 'l'; const d = Math.hypot(x - cx, y - cy); if (d < 1) return 'k'; if (d < 1.5) return x < cx && y < cy ? 'h' : 'k'; if (d < 2.6) return 'i'; return whites ? 'w' : ch === 'k' || ch === 'h' ? 'i' : ch; }),
    ...(o.extra || {}),
  };
}

// ---------------------------------------------------------------- hand-pixelled mouths
// rows of chars: l line · m inside · t tongue · w tooth · g gum · c accent; '.' clear
const INK = '#1a0c14';
export function pixMouth(rows, pal = {}) {
  const P = { l: pal.line || INK, m: pal.inner || '#3a1424', t: pal.tongue || '#e07088', w: pal.teeth || '#ffffff', g: pal.gum || '#c04a64', c: pal.accent || '#ffffff' };
  return (p, w, h) => {
    const ox = Math.floor((w - rows[0].length) / 2), oy = Math.floor((h - rows.length) / 2);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (P[ch]) p.px(ox + x, oy + y, P[ch]); }));
  };
}
// a mouth slot of planes: maps { state: rows }; at = plane centre; sized from the maps
export function mouthSet(maps, o) {
  const states = Object.keys(maps), rows = maps[states[0]], w = rows[0].length / PPU, h = rows.length / PPU, [x, y, z] = o.at;
  const cubes = states.map((s) => ({ o: [x - w / 2, y - h / 2, z], s: [w, h, 0], plane: 'z', tex: pixMouth(maps[s], o.pal), id: 'm-' + s, hide: s !== (o.def || states[0]), outline: false }));
  return { cubes, slot: { default: o.def || states[0], states: Object.fromEntries(states.map((s) => [s, ['m-' + s]])) } };
}

// ---------------------------------------------------------------- drip accessories
// Every builder returns cubes in model coordinates (tagged with the option id, hidden), so a model
// drops them into the bone they ride on. Sizes in model units.
const GOLD = ['#fff4b0', '#ffd23e', '#d0902a', '#8a561a'], CHROME = ['#ffffff', '#c8ccd8', '#7a8094', '#3a3e4c'];
// round glasses: a ring frame per eye (the lens itself is clear glass with a glint), bridge, temples
export function glasses(o) {
  const { x, y, z, r = 1.8, id, col = '#2a1c18', temple = 6, gap } = o, t = 0.35, tx = o.tx ?? Math.abs(x) + r;
  const rim = (p, w, h, face) => {
    if (face !== 'south' && face !== 'north') { fill(p, w, h, () => col); return; }
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
    fill(p, w, h, (X, Y) => { const d = Math.hypot(X + 0.5 - cx, Y + 0.5 - cy); return d > R ? 0 : d > R - 1.2 ? (Y < cy - 1 ? shift(col, 0.25) : col) : (X - Y === Math.round(w * 0.12) || X - Y === Math.round(w * 0.12) + 1) && Y < h * 0.5 ? '#e8f4ff' : 0; });
  };
  const L = [B(x - r, y - r, z, x + r, y + r, z + t, rim, { outline: false }), B(-x - r, y - r, z, -x + r, y + r, z + t, rim, { outline: false })];
  const g = gap ?? Math.abs(x) - r;
  return acc(id, [...L,
    B(-g - 0.05, y + r * 0.2, z + 0.05, g + 0.05, y + r * 0.2 + 0.4, z + t - 0.05, col),
    B(-tx - 0.3, y + r * 0.25, z - temple, -tx, y + r * 0.25 + 0.4, z + t, col), B(-tx - 0.3, y + r * 0.25, z, -Math.abs(x) - r, y + r * 0.25 + 0.4, z + t, col),
    B(tx, y + r * 0.25, z - temple, tx + 0.3, y + r * 0.25 + 0.4, z + t, col), B(Math.abs(x) + r, y + r * 0.25, z, tx + 0.3, y + r * 0.25 + 0.4, z + t, col)]);
}
// a slouchy knit beanie: cuff, crown and a slouch folding back (and a pom when pom: true)
export function beanie(o) {
  const { x0, x1, y, z0, z1, h = 4, id, cols = ['#7a8a9a', '#5a6a7a', '#3e4a58', '#262e38'], stripe, pom } = o, k = knitP(cols, { stripe }), cuffP = knitP(cols, { cuff: 9 });
  const w = x1 - x0, d = z1 - z0, out = [
    B(x0 - 0.3, y, z0 - 0.3, x1 + 0.3, y + 1.6, z1 + 0.3, cuffP),
    B(x0, y + 1.6, z0, x1, y + h * 0.65, z1, k),
    B(x0 + w * 0.12, y + h * 0.65, z0 + d * 0.1, x1 - w * 0.12, y + h, z1 - d * 0.18, k),
    B(x0 + w * 0.25, y + h * 0.75, z0 - d * 0.18, x1 - w * 0.25, y + h * 1.0, z0 + d * 0.25, k),
  ];
  if (pom) out.push(B(-0.9, y + h, z0 + d * 0.3, 0.9, y + h + 1.6, z0 + d * 0.3 + 1.8, knitP([shift(cols[0], 0.2), cols[0], cols[1], cols[2]])));
  return acc(id, out);
}
// over-ear headphones: two cups with cushions, sliders, a padded band over the top
export function phones(o) {
  const { x, y, z, r = 2.2, top, id, cols = ['#4a4a58', '#2a2a34', '#1a1a22', '#0e0e14'], accent = '#e84a5a', d = 1.4 } = o;
  const cup = (p, w, h, face) => { fill(p, w, h, (X, Y) => band(cols, face, X, Y, h)); if (face === 'west' || face === 'east') { const c = w / 2, m = h / 2; fill(p, w, h, (X, Y) => (Math.hypot(X + 0.5 - c, Y + 0.5 - m) < Math.min(w, h) * 0.28 ? accent : undefined)); } };
  const pad = (p, w, h) => fill(p, w, h, (X, Y) => ((X + Y) % 3 ? '#3a3a44' : '#2a2a32'));
  const bandP = (p, w, h, face) => fill(p, w, h, (X, Y) => (face === 'down' ? '#2a2a32' : Y === 0 ? shift(cols[0], 0.2) : band(cols, face, X, Y, h)));
  return acc(id, [
    B(-x - d, y - r, z - r, -x, y + r, z + r, cup), B(-x - 0.3, y - r * 0.8, z - r * 0.8, -x + 0.4, y + r * 0.8, z + r * 0.8, pad, { outline: false }),
    B(x, y - r, z - r, x + d, y + r, z + r, cup, { mirror: true }), B(x - 0.4, y - r * 0.8, z - r * 0.8, x + 0.3, y + r * 0.8, z + r * 0.8, pad, { outline: false }),
    // the band: over the top (top: its height) or round the back of the head as a neckband (behind: its z)
    ...(o.behind === undefined ? [
      B(-x - d * 0.75, y + r, z - 0.5, -x - d * 0.25, top - 0.6, z + 0.5, metalP(CHROME)), B(x + d * 0.25, y + r, z - 0.5, x + d * 0.75, top - 0.6, z + 0.5, metalP(CHROME)),
      B(-x - d * 0.8, top - 0.8, z - 0.9, x + d * 0.8, top, z + 0.9, bandP),
    ] : [
      B(-x - d * 0.75, y - 0.4, o.behind, -x - d * 0.25, y + 0.4, z - r, metalP(CHROME)), B(x + d * 0.25, y - 0.4, o.behind, x + d * 0.75, y + 0.4, z - r, metalP(CHROME)),
      B(-x - d * 0.8, y - 0.7, o.behind - 0.9, x + d * 0.8, y + 0.7, o.behind, bandP),
    ]),
  ]);
}
// a vintage 50s mic: a tall rounded chrome grille with a grille band, a ribbed neck, the cable stub;
// built standing at base [x, y, z] (stand: a short tilt mount and round base for a stand-mic)
export function mic(o) {
  const { x, y, z, k = 1, id, stand, ground = y - 9 * k } = o, s = (v) => v * k;
  const out = [
    B(x - s(0.6), y, z - s(0.6), x + s(0.6), y + s(1.6), z + s(0.6), metalP(CHROME)),
    B(x - s(1.0), y + s(1.6), z - s(0.9), x + s(1.0), y + s(2.2), z + s(0.9), metalP(GOLD)),
    B(x - s(1.3), y + s(2.2), z - s(1.1), x + s(1.3), y + s(5.0), z + s(1.1), grilleP(CHROME)),
    B(x - s(1.0), y + s(5.0), z - s(0.8), x + s(1.0), y + s(5.6), z + s(0.8), grilleP(CHROME)),
    B(x - s(1.38), y + s(3.4), z - s(1.18), x + s(1.38), y + s(3.8), z + s(1.18), metalP(GOLD), { outline: false }),
  ];
  if (stand) out.push(B(x - s(0.3), ground + s(0.5), z - s(0.3), x + s(0.3), y, z + s(0.3), metalP(CHROME)), B(x - s(2.2), ground, z - s(2.2), x + s(2.2), ground + s(0.6), z + s(2.2), metalP(['#5a5a66', '#2a2a32', '#1a1a20', '#0e0e12'])));
  return acc(id, out);
}
// a paper crown (the kind from a cracker): four walls of folded paper with zig-zag points
export function crown(o) {
  const { x0, x1, z0, z1, y, h = 2.6, id, cols = ['#fff6a8', '#ffd23e', '#e8a82a', '#a86a18'] } = o;
  const paper = (p, w, h2, face) => {
    if (!isSide(face)) { fill(p, w, h2, () => cols[2]); return; }
    const n = Math.max(2, Math.round(w / 6)), per = w / n;
    fill(p, w, h2, (X, Y) => { const f = ((X + 0.5) % per) / per, tip = Math.abs(f - 0.5) * 2 * h2 * 0.55; if (Y < tip) return 0; return Y > h2 - 3 ? cols[2] : (Math.floor(X / per) % 2 ? cols[1] : cols[0]); });
    for (let X = 0; X < w; X += Math.round(per)) for (let Y = Math.round(h2 * 0.55); Y < h2; Y++) p.px(X, Y, cols[3]);     // folds
  };
  const t = 0.3;
  return acc(id, [B(x0, y, z1 - t, x1, y + h, z1, paper, { outline: false }), B(x0, y, z0, x1, y + h, z0 + t, paper, { outline: false }),
    B(x0, y, z0, x0 + t, y + h, z1, paper, { outline: false }), B(x1 - t, y, z0, x1, y + h, z1, paper, { outline: false })]);
}
// a crumpled plastic supermarket bag: off-white with crinkles, a printed smiley and two loop handles
export function bag(o) {
  const { x, y, z, w = 4, h = 4.4, d = 2.6, id } = o;
  const film = (p, W, H, face) => {
    fill(p, W, H, (X, Y) => { const k = (X * 3 + Y * 5) % 11; return face === 'down' ? '#c8c8c0' : k === 0 ? '#d6d8d2' : k === 5 ? '#ffffff' : Y < 2 ? '#fafaf4' : '#eeeee6'; });
    if (face === 'south' || face === 'north') {
      const cx = Math.floor(W / 2), cy = Math.floor(H * 0.55), r = Math.max(2, Math.floor(Math.min(W, H) * 0.2));
      for (let a = 0; a < 24; a++) { const t = (a / 24) * TAU; p.px(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), '#e8303a'); }
      p.px(cx - 1, cy - 1, '#e8303a').px(cx + 1, cy - 1, '#e8303a').px(cx - 1, cy + 1, '#e8303a').px(cx, cy + 1, '#e8303a').px(cx + 1, cy + 1, '#e8303a');
      for (let X = 1; X < W - 1; X += 2) p.px(X, 1, '#e8303a');
    }
  };
  return acc(id, [
    B(x - w / 2, y - h, z - d / 2, x + w / 2, y, z + d / 2, film),
    B(x - w / 2 + 0.2, y, z - 0.25, x - w / 2 + 0.7, y + 1.8, z + 0.25, film), B(x + w / 2 - 0.7, y, z - 0.25, x + w / 2 - 0.2, y + 1.8, z + 0.25, film),
    B(x - w / 2 + 0.2, y + 1.6, z - 0.25, x + w / 2 - 0.2, y + 2.1, z + 0.25, film),
  ]);
}
// a small guitar covered in stickers, built lying in the xy plane (body low, neck up) at [x, y, z],
// facing +z; face: which side shows the top (south when held in front, north when slung on the back)
export function guitar(o) {
  const { x, y, z, k = 1, id, acoustic, cols = acoustic ? ['#f0c070', '#d8984a', '#a8642a', '#5a3214'] : ['#e8f0ff', '#b8c4dc', '#7a86a0', '#3a4258'] } = o, s = (v) => v * k;
  const STK = ['#ff4a7a', '#ffd23e', '#4ad8ff', '#7aff6a', '#ffffff', '#b07aff'];
  const top = (p, w, h, face) => {
    fill(p, w, h, (X, Y) => (face === 'south' || face === 'north' ? ramp([cols[0], cols[1]], Y / h, X, Y) : face === 'down' ? cols[3] : cols[2]));
    if (face !== 'south' && face !== 'north') return;
    // stickers: little squares, dots and stars all over the top
    for (let i = 0; i < 9; i++) {
      const sx = Math.floor(((i * 37) % 97) / 97 * (w - 3)), sy = Math.floor(((i * 53 + 11) % 89) / 89 * (h - 3)), c = STK[i % STK.length];
      if (i % 3 === 0) { p.rect(sx, sy, 3, 2, c); p.px(sx, sy, '#ffffff'); } else if (i % 3 === 1) { p.px(sx + 1, sy, c).px(sx, sy + 1, c).px(sx + 1, sy + 1, c).px(sx + 2, sy + 1, c).px(sx + 1, sy + 2, c); } else p.rect(sx, sy, 2, 2, c);
    }
    const cx = Math.floor(w / 2), cy = Math.floor(h * 0.35);
    if (acoustic) { for (let a = 0; a < 20; a++) { const t = (a / 20) * TAU; p.px(Math.round(cx + Math.cos(t) * 2), Math.round(cy + Math.sin(t) * 2), '#2a1408'); } p.px(cx, cy, '#1a0c06'); p.px(cx - 1, cy, '#1a0c06'); p.px(cx, cy - 1, '#1a0c06'); }
    else p.rect(cx - 2, cy, 5, 1, '#1a1a20').rect(cx - 2, cy + 3, 5, 1, '#1a1a20');
    p.rect(cx - 2, h - 3, 5, 1, '#3a2a1a');
  };
  const neck = (p, w, h, face) => fill(p, w, h, (X, Y) => (face === 'south' || face === 'north' ? (Y % 4 === 0 ? '#d8d0c0' : X === Math.floor(w / 2) ? '#e8e4dc' : '#4a2a14') : '#5a3418'));
  const head = (p, w, h, face) => fill(p, w, h, (X, Y) => ((face === 'south' || face === 'north') && (X === 0 || X === w - 1) && Y % 2 ? '#d8d8e0' : '#2a1a10'));
  const d = s(1.0);
  return acc(id, [
    B(x - s(2.6), y, z, x + s(2.6), y + s(3.6), z + d, top), B(x - s(2.0), y + s(3.6), z + s(0.05), x + s(2.0), y + s(6.0), z + d - s(0.05), top),
    B(x - s(0.45), y + s(6.0), z + s(0.2), x + s(0.45), y + s(12.5), z + d - s(0.2), neck), B(x - s(0.7), y + s(12.5), z + s(0.15), x + s(0.7), y + s(14.4), z + d - s(0.15), head),
  ]);
}
// fairy lights: warm bulbs (glow) on a dark wire along a polyline of [x, y, z] points; every bulb a colour
export function lights(o) {
  const { pts, id, every = 1.6, bulb = 0.55, cols = ['#fff2b0', '#ffb0d0', '#b0e8ff', '#c8ffb0'] } = o, out = [];
  const bulbP = (c) => (p, w, h) => fill(p, w, h, (X, Y) => (X === 0 && Y === 0 ? '#ffffff' : c));
  let n = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), m = Math.max(1, Math.round(L / every));
    for (let j = 0; j < m; j++) {
      const t = (j + 0.5) / m, X = a[0] + (b[0] - a[0]) * t, Y = a[1] + (b[1] - a[1]) * t, Z = a[2] + (b[2] - a[2]) * t, r = bulb / 2;
      out.push(B(X - r, Y - r - 0.2, Z - r, X + r, Y + r - 0.2, Z + r, bulbP(cols[n++ % cols.length]), { glow: true, outline: false }));
      const t2 = (j + 1) / m, X2 = a[0] + (b[0] - a[0]) * t2, Y2 = a[1] + (b[1] - a[1]) * t2, Z2 = a[2] + (b[2] - a[2]) * t2;
      out.push(B(Math.min(X, X2) - 0.1, Math.min(Y, Y2) - 0.1, Math.min(Z, Z2) - 0.1, Math.max(X, X2) + 0.1, Math.max(Y, Y2) + 0.1, Math.max(Z, Z2) + 0.1, '#1e2a1e', { outline: false }));
    }
  }
  return acc(id, out);
}

// ---------------------------------------------------------------- particles
const leafSpr = (cols) => (p, w, h) => { for (let y = 0; y < h; y++) { const hw = Math.round(Math.sin(((y + 0.5) / h) * Math.PI) * (w / 2)); for (let x = -hw; x < hw; x++) p.px(Math.floor(w / 2) + x, y, x === -1 ? cols[1] : x < -1 ? cols[0] : cols[2] || cols[0]); } };
const PETALS = [['#b8c4ff', '#7a86e0', '#9aa6f4'], ['#e0ccff', '#a48ae0', '#c8b0f4'], ['#fff0a8', '#e0c860', '#f6e08a']];
const PETALS_G = [['#3a3446', '#141018', '#26202e'], ['#fff2b0', '#d8a02a', '#ffd23e'], ['#2e2836', '#0e0c12', '#1e1a24']];
const P_PETAL = { w: 5, h: 7, life: [1.3, 2.0], size: [0.07, 0.065], speed: [0.5, 1.2], grav: 0.5, drag: 2, spread: 1, flutter: true };
const P_STORM = { w: 5, h: 7, life: [0.8, 1.2], size: [0.085, 0.075], speed: [2.6, 4.4], grav: 0.35, drag: 1.3, spread: 0.35, spin: 9 };
defineFx('rh-petal', { frames: PETALS.map(leafSpr), ...P_PETAL });
defineFx('rh-storm', { frames: PETALS.map(leafSpr), ...P_STORM });
defineFx('rh-petalg', { frames: PETALS_G.map(leafSpr), ...P_PETAL });
defineFx('rh-stormg', { frames: PETALS_G.map(leafSpr), ...P_STORM });
const noteSpr = (c, d) => (p, w, h) => { p.rect(1, h - 4, 4, 3, c); p.px(0, h - 3, c); p.px(5, h - 3, d); p.vl(4, 1, h - 4, c); p.rect(5, 1, 2, 2, c); p.px(7, 3, c); p.px(7, 4, d); p.px(2, h - 4, '#ffffff'); };
defineFx('rh-note', { w: 8, h: 12, frames: [noteSpr('#7a8ad0', '#3a4280'), noteSpr('#a8b0e8', '#5a62a0')], life: [1.4, 1.9], size: [0.12, 0.12], speed: [0.3, 0.5], grav: -0.35, drag: 0.6, spread: 0.6, wob: 1.4, fade: true });
defineFx('rh-noteg', { w: 8, h: 12, frames: [noteSpr('#ffd23e', '#8a561a'), noteSpr('#fff2b0', '#d0902a')], glow: true, life: [1.4, 1.9], size: [0.12, 0.12], speed: [0.3, 0.5], grav: -0.35, drag: 0.6, spread: 0.6, wob: 1.4, fade: true });
// dust motes drifting in a spotlight
defineFx('rh-mote', { w: 3, h: 3, paint: (p) => { p.px(1, 0, '#fff6d8').px(0, 1, '#fff6d8').px(1, 1, '#ffffff').px(2, 1, '#fff0c0').px(1, 2, '#ffe8b0'); }, glow: true, life: [1.2, 2.0], size: [0.035, 0.02], speed: [0.05, 0.25], grav: 0.12, drag: 1, spread: 1, wob: 0.8, fade: true });
// a price tag (manila card, punched hole, red price stripes) and glossy plastic leaves
const tagSpr = (card, ink) => (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (y < 2 && (x === 0 || x === w - 1)) continue; p.px(x, y, x === 0 || y === h - 1 ? shift(card, -0.25) : card); } p.px(Math.floor(w / 2), 1, '#000000'); p.rect(1, 3, w - 2, 1, ink).rect(1, 5, w - 3, 1, ink).rect(2, 7, 2, 1, ink); };
defineFx('rh-tag', { w: 6, h: 9, frames: [tagSpr('#fff4dc', '#e8303a'), tagSpr('#ffffff', '#e8303a')], life: [0.55, 0.8], size: [0.11, 0.11], speed: [3.4, 4.6], grav: 1.6, drag: 0.4, spread: 0.12, spin: 12 });
defineFx('rh-tagg', { w: 6, h: 9, frames: [tagSpr('#ffd23e', '#1a1418'), tagSpr('#fff2b0', '#1a1418')], glow: true, life: [0.55, 0.8], size: [0.11, 0.11], speed: [3.4, 4.6], grav: 1.6, drag: 0.4, spread: 0.12, spin: 12 });
const pleaf = (a, b, g) => (p, w, h) => { leafSpr([a, b, a])(p, w, h); p.px(Math.floor(w / 2) - 1, 2, g); p.px(Math.floor(w / 2) - 1, 3, g); };
defineFx('rh-pleaf', { w: 6, h: 9, frames: [pleaf('#4ae05a', '#1e8a32', '#ffffff'), pleaf('#7af06a', '#2aa040', '#ffffff')], life: [0.9, 1.4], size: [0.1, 0.09], speed: [1.4, 3.2], grav: 1.2, drag: 1.6, spread: 0.8, spin: 7 });
defineFx('rh-pleafg', { w: 6, h: 9, frames: [pleaf('#2a2632', '#0e0c12', '#ffd23e'), pleaf('#ffd23e', '#a86a18', '#ffffff')], life: [0.9, 1.4], size: [0.1, 0.09], speed: [1.4, 3.2], grav: 1.2, drag: 1.6, spread: 0.8, spin: 7 });
defineFx('rh-glint', { w: 9, h: 9, paint: (p) => { for (let i = 0; i < 9; i++) { const d = Math.abs(i - 4); p.px(i, 4, d < 2 ? '#ffffff' : '#e8f8ff').px(4, i, d < 2 ? '#ffffff' : '#e8f8ff'); } p.px(3, 3, '#ffffff').px(5, 5, '#ffffff').px(5, 3, '#ffffff').px(3, 5, '#ffffff'); }, glow: true, life: [0.25, 0.4], size: [0.16, 0.02], speed: [0, 0.1], grav: 0, spread: 0.2, spin: 3 });
// the arpeggio: one ring and one orb per note of a seven-note rainbow (and the drip form's gold / ice)
export const ARP = ['#ff5a78', '#ff9a4a', '#ffe060', '#6ae890', '#4ad0ff', '#6a80ff', '#c070ff'];
const ringSpr = (c) => (p, w) => { const m = (w - 1) / 2; for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - m, y - m); if (d < m + 0.2 && d > m - 2.6) p.px(x, y, d > m - 1 ? c : d > m - 2 ? shift(c, 0.45) : '#ffffff'); } };
const orbSpr = (c) => (p, w) => { const m = (w - 1) / 2; for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - m, y - m); if (d <= m + 0.3) p.px(x, y, d < m * 0.4 ? '#ffffff' : d < m * 0.75 ? shift(c, 0.4) : c); } };
const RING = { w: 32, h: 32, glow: true, life: [0.6, 0.6], size: [0.12, 1.25], speed: [0, 0], grav: 0, fade: true };
const WAVE = { w: 32, h: 32, glow: true, life: [0.7, 0.75], size: [0.18, 0.85], speed: [3.2, 3.2], grav: 0, drag: 0.4, spread: 0.01, fade: true };
const ORB = { w: 7, h: 7, glow: true, life: [0.45, 0.55], size: [0.14, 0.09], speed: [5.2, 6.2], grav: 0, drag: 0.2, spread: 0.06 };
ARP.forEach((c, i) => { defineFx('rh-ring' + i, { paint: ringSpr(c), ...RING }); defineFx('rh-wave' + i, { paint: ringSpr(c), ...WAVE }); defineFx('rh-orb' + i, { paint: orbSpr(c), ...ORB }); });
for (const [n, c] of [['g', '#ffd23e'], ['b', '#9ae0ff']]) { defineFx('rh-ring' + n, { paint: ringSpr(c), ...RING }); defineFx('rh-wave' + n, { paint: ringSpr(c), ...WAVE }); defineFx('rh-orb' + n, { paint: orbSpr(c), ...ORB }); }
// the drip form's arpeggio: the seven notes alternate gold and ice blue
export const ARP_DRIP = Object.fromEntries(ARP.flatMap((_, i) => [['rh-ring' + i, 'rh-ring' + (i % 2 ? 'b' : 'g')], ['rh-wave' + i, 'rh-wave' + (i % 2 ? 'b' : 'g')], ['rh-orb' + i, 'rh-orb' + (i % 2 ? 'b' : 'g')]]));

// ---------------------------------------------------------------- the ultra-drip form
const hsl = (hex) => { const n = parseInt(hex.slice(1, 7), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l }; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return { h, s: d / (1 - Math.abs(2 * l - 1)), l }; };
export const hex = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16).padStart(2, '0')).join(''); };
const inH = (h, [a, b]) => (a <= b ? h >= a && h < b : h >= a || h < b);
export const lacquer = (l) => hex(262, 0.16, 0.05 + l * 0.26);
export const goldOf = (l) => hex(44, 0.88, 0.2 + l * 0.6);
// black: hue ranges → black lacquer · gold: hue ranges → gold · keep: colours left alone · swap: exact
// colour swaps · glow(c): an optional mapping for glowing parts (default: the engine's blue fire)
export function radioMap(o = {}) {
  const keep = new Set((o.keep || []).map((c) => c.toLowerCase())), swap = Object.fromEntries(Object.entries(o.swap || {}).map(([k, v]) => [k.toLowerCase(), v]));
  return (c, glow) => {
    if (typeof c !== 'string' || c[0] !== '#' || c.length < 7 || keep.has(c.toLowerCase())) return c;
    if (swap[c.toLowerCase()]) return swap[c.toLowerCase()];
    if (glow) return o.glow ? o.glow(c) : blackGold(c, glow);
    const { h, s, l } = hsl(c);
    if (s < 0.1) return o.greys && l > 0.1 && l < 0.86 ? lacquer(l) : c;
    if (l > 0.88) return hex(44, 0.6, Math.min(0.93, l));
    for (const r of o.black || []) if (inH(h, r)) return lacquer(l);
    for (const r of o.gold || []) if (inH(h, r)) return goldOf(l);
    return blackGold(c, glow);
  };
}
export { hsl, mix, shift };
