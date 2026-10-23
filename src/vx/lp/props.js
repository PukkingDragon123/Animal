// Low-poly props for the anime interiors, built with the lp kit: furniture (bed, wardrobe,
// desk, chair, bookcase, stools, round table, counter, fridge, stove, sideboard), soft
// things (plushies, pillows, laundry, beanbag, garments on hangers, sneakers), and clutter
// (books, cups, mugs, bowls, teapot, lamp, laptop, fan, bins, boxes). Every builder takes a
// Frame (Batch.at(...)) or the Batch itself, works in metres, faces +z at yaw 0, and paints
// its own textures (cached), so any scene can reuse them.
import {
  T, mat, print, cbox, slab, cyl, lathe, superq, extrude, plane, tube, sphere, sheet, sagLine, warp, blobShadow,
  rnd, tone, shade, lite, rgba, mixc, rr, text, scribble, speckle, mottle, vgrad, hgrad, fold, star, TAU, lerp, cl, sstep,
} from './kit.js';

// ---------------------------------------------------------------- material shorthands
export const M = {
  wood: (c, o = {}) => mat(T.wood({ c, ...o })),
  cloth: (c, kind = 'plain', o = {}) => mat(T.fabric({ c, kind, ...o })),
  enamel: (c, o = {}) => mat(T.enamel({ c, ...o })),
  metal: (c = '#b8bcc4', o = {}) => mat(T.metal({ c, ...o })),
  flat: (c = '#ffffff') => mat(T.flat(c)),
  glow: (tex, k = 1) => mat(tex, { glow: k, keep: true }),
  white: () => mat(T.flat('#ffffff', { noise: false })),
  plush: (c = '#f4f0e8') => mat(T.fabric({ c, kind: 'plain', rep: 0.03, folds: 6, seed: 5, size: [0.3, 0.3] })),
};
// a chamfered box between two corners (metres) in frame F; o: cbox options + { tint, ao, vc, r }
export function box(F, m, x0, y0, z0, x1, y1, z1, o = {}) { F.add(cbox(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), o), m, { p: [(x0 + x1) / 2, Math.min(y0, y1), (z0 + z1) / 2], tint: o.tint, ao: o.ao, vc: o.vc, r: o.r }); }

// ---------------------------------------------------------------- generic prints
const SPINES = (i) => print('spine' + i, 0.05, 0.2, (g, W, H) => {
  const r = rnd(11 + i * 7);
  g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, W, H);
  g.fillStyle = hgrad(g, 0, W, [[0, 'rgba(30,10,40,0.35)'], [0.25, 'rgba(255,255,255,0.12)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(30,10,40,0.4)']]); g.fillRect(0, 0, W, H);
  const band = (y, h, a = 0.55) => { g.fillStyle = `rgba(30,16,30,${a})`; g.fillRect(0, y, W, h); g.fillStyle = 'rgba(255,230,170,0.7)'; g.fillRect(0, y - 1.5, W, 1.5); g.fillRect(0, y + h, W, 1.5); };
  if (i % 3 === 0) { band(H * 0.06, H * 0.06); band(H * 0.86, H * 0.06); }
  else if (i % 3 === 1) { band(H * 0.1, H * 0.02, 0.4); band(H * 0.9, H * 0.02, 0.4); g.fillStyle = 'rgba(255,255,255,0.75)'; rr(g, W * 0.18, H * 0.2, W * 0.64, H * 0.12, 3); g.fill(); }
  else { g.fillStyle = 'rgba(255,250,235,0.8)'; g.fillRect(W * 0.12, H * 0.08, W * 0.76, H * 0.14); }
  g.save(); g.translate(W / 2, H * 0.55); g.rotate(Math.PI / 2); scribble(g, -H * 0.2, -W * 0.12, H * 0.4, W * 0.3, 'rgba(30,20,30,0.75)', 3 + i, { lh: W * 0.13, word: 12 }); g.restore();
  g.fillStyle = 'rgba(255,240,200,0.85)'; g.beginPath(); g.arc(W / 2, H * 0.8, W * 0.14, 0, TAU); g.fill();
  speckle(g, W, H, 3 + i, 60, 0.05); void r;
}, 1024);
const PAGES = () => print('pages', 0.2, 0.2, (g, W, H) => { g.fillStyle = '#f2ead6'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 2) { g.fillStyle = `rgba(120,100,70,${0.08 + (y % 6 === 0 ? 0.08 : 0)})`; g.fillRect(0, y, W, 1); } }, 512);
const KEYBOARD = () => print('keyboard', 0.32, 0.22, (g, W, H) => {
  g.fillStyle = '#5a5e66'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, W, H * 0.04);
  const kx = W * 0.06, ky = H * 0.08, kw = W * 0.88, kh = H * 0.5, cols = 14, rows = 5;
  g.fillStyle = '#26282e'; rr(g, kx - 3, ky - 3, kw + 6, kh + 6, 4); g.fill();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols - (j === 4 ? 6 : 0); i++) { const w = j === 4 && i === 3 ? (kw / cols) * 7 : kw / cols, x = kx + (j === 4 && i > 3 ? (i + 6) * (kw / cols) : i * (kw / cols)); g.fillStyle = '#3a3d44'; rr(g, x + 1.5, ky + j * (kh / rows) + 1.5, w - 3, kh / rows - 3, 2.5); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 3, ky + j * (kh / rows) + 2.5, w - 6, 1.5); }
  g.fillStyle = '#4a4e56'; rr(g, W * 0.36, H * 0.66, W * 0.28, H * 0.26, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#f0b8d0'; for (const [x, y] of [[0.12, 0.8], [0.84, 0.76]]) { g.beginPath(); g.arc(W * x, H * y, W * 0.025, 0, TAU); g.fill(); }          // stickers
  star(g, W * 0.18, H * 0.86, W * 0.03, '#ffd040', 0.3);
}, 800);
// a plush-face disc print: eyes, blush, mouth, for any plush colour
const SHINE = () => print('shine', 0.1, 0.1, (g, W, H) => { g.fillStyle = '#16121a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(W * 0.66, H * 0.34, W * 0.18, 0, TAU); g.fill(); g.beginPath(); g.arc(W * 0.36, H * 0.66, W * 0.08, 0, TAU); g.fill(); }, 256);

// ---------------------------------------------------------------- small things
// a book as a box (spine faces +z), a page block on the fore edge. size: [w (thickness), h, d]
export function book(F, p, size, col, o = {}) {
  const [w, h, d] = size, i = o.v ?? Math.floor(Math.abs(p[0] * 71 + p[2] * 13) % 3);
  const f = F.at(p, o.r || 0);
  f.add(cbox(w, h, d, { b: 0.002, fit: true }), mat(SPINES(i)), { tint: col });
  f.add(cbox(w * 0.84, h * 0.94, d * 0.06, { b: 0 }), mat(PAGES()), { p: [0, h * 0.03, -d / 2 - d * 0.0], s: [1, 1, 1], tint: '#ffffff' });
}
// a stack of books lying flat (covers up); n books; base at p
export function bookStack(F, p, n, seed = 1, o = {}) {
  const r = rnd(seed), cols = o.cols || ['#c8423a', '#2e5a9c', '#e8c040', '#3a8a5a', '#f0ece4', '#e88a3a', '#8a4ab4', '#e86a8a'];
  let y = 0;
  for (let i = 0; i < n; i++) {
    const t = 0.016 + r() * 0.012, w = (o.w || 0.13) + r() * 0.03, d = (o.d || 0.18) + r() * 0.03;
    F.at([p[0] + (r() - 0.5) * 0.02, p[1] + y, p[2] + (r() - 0.5) * 0.02], (o.r || 0) + (r() - 0.5) * 0.4).add(cbox(w, t, d, { b: 0.002, fit: true }), mat(SPINES(i % 3)), { tint: cols[Math.floor(r() * cols.length)] });
    y += t;
  }
  return y;
}
// a sneaker, toe toward +z; col: upper colour
export function sneaker(F, p, yaw, col, o = {}) {
  const f = F.at(p, yaw), L = o.len || 0.28, W = 0.105;
  f.add(slab(W, L, 0.03, { r: 0.045, c: 0.008 }), M.flat('#f2eee6'), { ao: 0.25 });
  f.add(slab(W * 1.01, L * 1.01, 0.012, { r: 0.046, c: 0.003 }), M.flat(o.sole2 || '#e8e2d6'), { p: [0, 0.018, 0] });
  const up = warp(superq(W * 0.92, o.high ? 0.13 : 0.085, L * 0.84, { e1: 0.45, e2: 0.5, n: 12, m: 7 }), (x, y, z) => { const t = cl(z / (L * 0.42)); return [x, y * (1 - 0.45 * t * t), z]; });
  f.add(up, mat(T.fabric({ c: '#f4f2ee', kind: 'plain', rep: 0.04, folds: 3, seed: 9, size: [0.2, 0.2] })), { p: [0, 0.022, -L * 0.04], tint: col });
  const hgt = (o.high ? 0.13 : 0.085) + 0.022;
  f.add(cyl(0.032, 0.006, { n: 10, rz: 1.4 }), M.flat('#2a2228'), { p: [0, hgt - 0.008, -L * 0.18] });
  for (let i = 0; i < 3; i++) f.add(cbox(0.05, 0.006, 0.008, { b: 0.002 }), M.flat('#faf8f2'), { p: [0, hgt - 0.012 - i * 0.008, -L * 0.02 + i * 0.03], r: [0.35, 0, 0] });
  f.add(cbox(0.04, 0.03, 0.012, { b: 0.004 }), M.flat(tone(col, -0.25)), { p: [0, hgt - 0.03, -L * 0.48] });
}
export function shoePair(F, p, col, dir = 1, o = {}) {
  const yaw = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  sneaker(F, [p[0], p[1], p[2]], yaw + (o.splay ? 0.25 * dir : 0.04), col, o);
  sneaker(F, [p[0] + (o.splay ? dir * 0.08 : 0.01), p[1], p[2] + 0.15], yaw - (o.splay ? 0.45 * dir : 0.05), col, o);
  if (F.B) blobShadow(F.B, ...F.pt(p[0], p[1], p[2] + 0.075), 0.2, 0.17, 0.7);
}
// a plush toy, facing +z: kind 'owl' | 'bun' | 'bear' | 'cat'; s = height scale (1 ≈ 0.22 m)
export function plush(F, p, kind = 'bear', o = {}) {
  const s = o.s || 1, f = F.at(p, o.r || 0, s), c = o.col || { owl: '#8a6a4a', bun: '#f4ecdc', bear: '#c8945a', cat: '#e8a040' }[kind], fab = M.plush(), lc = lite(c, 0.35);
  const eye = (x, y, z, r = 0.014) => { f.add(sphere(r, { n: 8, m: 4, center: true, fit: true }), mat(SHINE()), { p: [x, y, z], r: [0, 0, 0] }); };
  const blush = (x, y, z) => f.add(cyl(0.012, 0.002, { n: 8 }), M.flat('#ff98a8'), { p: [x, y, z], r: [Math.PI / 2, 0, 0] });
  if (kind === 'owl') {
    f.add(superq(0.15, 0.2, 0.13, { e1: 0.75, e2: 0.9 }), fab, { tint: c, ao: 0.3 });
    f.add(superq(0.1, 0.12, 0.04, { e1: 0.8, e2: 0.9 }), fab, { p: [0, 0.03, 0.045], tint: lc });
    for (const sx of [-1, 1]) {
      f.add(superq(0.05, 0.12, 0.09, { e1: 0.7, e2: 0.8 }), fab, { p: [sx * 0.07, 0.04, -0.005], r: [0, 0, sx * 0.15], tint: shade(c, 0.12) });
      f.add(cyl(0.012, 0.05, { n: 5, r2: 0.002 }), fab, { p: [sx * 0.045, 0.18, 0], r: [0, 0, -sx * 0.4], tint: c });
      f.add(cyl(0.034, 0.012, { n: 12 }), M.flat('#f4ecd8'), { p: [sx * 0.032, 0.135, 0.05], r: [Math.PI / 2 - 0.1, 0, 0] });
      eye(sx * 0.032, 0.135, 0.062, 0.017);
      f.add(superq(0.03, 0.012, 0.025), M.flat('#e8a030'), { p: [sx * 0.025, 0, 0.03] });
    }
    f.add(cyl(0.014, 0.03, { n: 6, r2: 0.001 }), M.flat('#e8a030'), { p: [0, 0.125, 0.06], r: [Math.PI / 2 + 0.5, 0, 0] });
  } else if (kind === 'bun') {
    f.add(superq(0.17, 0.13, 0.15, { e1: 0.65, e2: 0.8 }), fab, { tint: c, ao: 0.3 });
    for (const sx of [-1, 1]) {
      f.add(superq(0.045, 0.14, 0.03, { e1: 0.7, e2: 0.8 }), fab, { p: [sx * 0.04, 0.1, -0.02], r: [-0.25, 0, sx * 0.3], tint: c });
      f.add(superq(0.025, 0.09, 0.01, { e1: 0.7, e2: 0.8 }), M.flat('#f8b0c0'), { p: [sx * 0.042, 0.125, -0.005], r: [-0.25, 0, sx * 0.3] });
      eye(sx * 0.035, 0.075, 0.066); blush(sx * 0.055, 0.06, 0.066);
    }
    f.add(sphere(0.008, { center: true, n: 6, m: 3 }), M.flat('#e86a8a'), { p: [0, 0.062, 0.074] });
  } else {                                                                     // bear / cat
    f.add(superq(0.13, 0.13, 0.11, { e1: 0.7, e2: 0.85 }), fab, { tint: c, ao: 0.3 });
    f.add(superq(0.08, 0.07, 0.03, { e1: 0.8, e2: 0.9 }), fab, { p: [0, 0.03, 0.04], tint: lc });
    f.add(superq(0.15, 0.13, 0.13, { e1: 0.75, e2: 0.85 }), fab, { p: [0, 0.11, 0], tint: c });
    f.add(superq(0.06, 0.045, 0.04, { e1: 0.8, e2: 0.8 }), fab, { p: [0, 0.135, 0.055], tint: lc });
    f.add(sphere(0.011, { center: true, n: 6, m: 3 }), M.flat('#2a1a14'), { p: [0, 0.17, 0.077] });
    for (const sx of [-1, 1]) {
      if (kind === 'cat') f.add(cyl(0.03, 0.05, { n: 4, r2: 0.002 }), fab, { p: [sx * 0.045, 0.225, 0], r: [0, 0, -sx * 0.25], tint: c });
      else { f.add(cyl(0.028, 0.016, { n: 10 }), fab, { p: [sx * 0.055, 0.22, 0], r: [Math.PI / 2, 0, 0], tint: c }); f.add(cyl(0.016, 0.018, { n: 8 }), fab, { p: [sx * 0.055, 0.222, 0.001], r: [Math.PI / 2, 0, 0], tint: lc }); }
      eye(sx * 0.035, 0.18, 0.062); blush(sx * 0.05, 0.165, 0.058);
      f.add(superq(0.04, 0.08, 0.045, { e1: 0.7, e2: 0.8 }), fab, { p: [sx * 0.072, 0.03, 0.02], r: [0.3, 0, sx * 0.5], tint: c });
      f.add(superq(0.045, 0.04, 0.07, { e1: 0.7, e2: 0.8 }), fab, { p: [sx * 0.04, 0, 0.04], tint: c });
    }
  }
  if (F.B && o.shadow !== false) blobShadow(F.B, ...F.pt(p[0], p[1], p[2]), 0.11 * s, 0.1 * s, 0.6);
}
// an instant-noodle cup: label colour, lid peeled back, chopsticks (o.open), stacked closed cups otherwise
const NOODLE = (c) => print('noodle' + c, 0.3, 0.1, (g, W, H) => {
  g.fillStyle = '#f8f4ea'; g.fillRect(0, 0, W, H); g.fillStyle = c; g.fillRect(0, H * 0.18, W, H * 0.52);
  g.fillStyle = tone(c, -0.25); g.fillRect(0, H * 0.66, W, H * 0.04);
  for (let i = 0; i < 2; i++) { const x = W * (0.25 + i * 0.5); g.fillStyle = '#fff8e8'; g.beginPath(); g.ellipse(x, H * 0.44, W * 0.09, H * 0.2, 0, 0, TAU); g.fill(); g.fillStyle = '#e8b050'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x - W * 0.05 + k * W * 0.025, H * 0.48, W * 0.012, H * 0.08, 0.4, 0, TAU); g.fill(); } text(g, '麵', x + W * 0.13, H * 0.42, H * 0.3, '#fff8e8', { font: 'serif', weight: 900, stroke: tone(c, -0.4), sw: 3 }); }
  g.fillStyle = 'rgba(30,20,30,0.5)'; for (let x = 0; x < W; x += 6) g.fillRect(x, H * 0.82, 3, 2);
}, 1024);
export function noodleCup(F, p, c, o = {}) {
  const f = F.at(p, o.r || 0), open = o.open !== false;
  f.add(lathe([[0.034, 0], [0.042, 0.004], [0.048, 0.085], [0.05, 0.09]], { n: 14, fit: true }), mat(NOODLE(c)), { ao: 0.15 });
  if (open) {
    f.add(cyl(0.046, 0.004, { n: 14 }), M.flat('#d8b070'), { p: [0, 0.082, 0] });
    f.add(sheet((u, v) => { const a = (u - 0.5) * Math.PI * 1.6, rr2 = 0.05 * v; return [Math.sin(a) * rr2, 0.09 + v * v * 0.05, -Math.cos(a) * rr2 * 0.4 - v * 0.03]; }, 8, 4, { fit: true }), mat(T.metal({ c: '#e8e2d6' }), { side: 2 }), {});
    for (const dx of [-0.006, 0.006]) f.add(cbox(0.006, 0.2, 0.006, { b: 0.001, taper: 0.6 }), M.wood('#d8b070'), { p: [dx + 0.01, 0.05, 0.01], r: [0.2, 0, -0.25 + dx * 10] });
  } else f.add(cyl(0.05, 0.004, { n: 14 }), M.flat(lite(c, 0.4)), { p: [0, 0.09, 0] });
}
// a mug (handle toward +x); pens: a few pens standing in it
export function mug(F, p, c, o = {}) {
  const f = F.at(p, o.r || 0);
  f.add(lathe([[0.034, 0], [0.04, 0.004], [0.04, 0.09], [0.036, 0.092], [0.034, 0.012]], { n: 14, smoothV: false, cap1: true, cap0: true }), mat(T.enamel({ c, amp: 0.02 })), { ao: 0.2 });
  f.add(tube(sagLine([0.04, 0.075, 0], [0.04, 0.02, 0], -0.03, 8), 0.007, { n: 5 }), mat(T.enamel({ c, amp: 0.02 })), {});
  if (o.pens) for (const [x, z, col, l] of [[-0.01, 0.006, '#3a6ac8', 0.15], [0.012, -0.008, '#e8c040', 0.14], [0.002, 0.014, '#e84a4a', 0.13], [-0.012, -0.012, '#2a2a30', 0.16]]) { f.add(cyl(0.005, l, { n: 6 }), M.flat(col), { p: [x, 0.012, z], r: [x * 6, 0, z * 6] }); }
  if (o.tea) f.add(cyl(0.034, 0.002, { n: 12 }), M.flat('#8a5a2a'), { p: [0, 0.075, 0] });
}
// a bowl (porcelain with a blue rim), optional soup (wontons) — r: radius
const BOWL = () => print('bowl', 0.4, 0.1, (g, W, H) => { g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, W, H); g.fillStyle = '#3a6ab0'; g.fillRect(0, H * 0.86, W, H * 0.05); g.fillRect(0, H * 0.78, W, H * 0.015); for (let i = 0; i < 6; i++) { const x = (i + 0.5) * W / 6; g.strokeStyle = '#4a7ac0'; g.lineWidth = 2; g.beginPath(); g.arc(x, H * 0.5, H * 0.12, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, H * 0.5, H * 0.05, 0, TAU); g.stroke(); } }, 1024);
const SOUP = () => print('soup', 0.12, 0.12, (g, W, H) => {
  const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, '#e8b860'); gr.addColorStop(0.8, '#c88a3a'); gr.addColorStop(1, '#a86a2a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,230,160,0.5)'; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 0, TAU); g.fill(); }
  for (const [x, y] of [[0.35, 0.38], [0.62, 0.5], [0.42, 0.66], [0.6, 0.28]]) { g.fillStyle = '#f8f0dc'; g.beginPath(); g.ellipse(W * x, H * y, W * 0.12, H * 0.09, x * 4, 0, TAU); g.fill(); g.fillStyle = 'rgba(200,160,110,0.5)'; g.beginPath(); g.ellipse(W * x + 2, H * y + 2, W * 0.07, H * 0.05, x * 4, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(W * x - 4, H * y - 3, W * 0.03, H * 0.015, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#5aa040' : '#7ac050'; g.beginPath(); g.ellipse(W * (0.2 + (i * 0.37) % 0.6), H * (0.25 + (i * 0.23) % 0.55), 4, 2.5, i, 0, TAU); g.fill(); }
}, 1024);
export function bowl(F, p, o = {}) {
  const f = F.at(p, o.r || 0), R = o.R || 0.065;
  f.add(lathe([[R * 0.45, 0], [R * 0.5, 0.008], [R * 0.85, R * 0.4], [R, R * 0.75], [R * 0.93, R * 0.75], [R * 0.4, 0.012]], { n: 16, fit: true, smoothV: true, cap1: true }), mat(BOWL()), { ao: 0.15 });
  if (o.soup !== false) f.add(cyl(R * 0.9, 0.002, { n: 16, fit: true, cap0: false }), mat(SOUP()), { p: [0, R * 0.6, 0] });
}
// a clay teapot (spout toward +x)
export function teapot(F, p, o = {}) {
  const f = F.at(p, o.r || 0), clay = mat(T.enamel({ c: o.c || '#9a4a2c', amp: 0.06 }));
  f.add(lathe([[0.03, 0], [0.055, 0.015], [0.065, 0.045], [0.055, 0.075], [0.03, 0.088], [0.028, 0.092]], { n: 14 }), clay, { ao: 0.25 });
  f.add(lathe([[0.03, 0], [0.024, 0.01], [0.006, 0.016], [0.008, 0.024], [0.001, 0.028]], { n: 10 }), clay, { p: [0, 0.09, 0] });
  f.add(tube([[0.05, 0.035, 0], [0.08, 0.055, 0], [0.095, 0.085, 0]], (t) => 0.012 - t * 0.006, { n: 6 }), clay, {});
  f.add(tube(sagLine([-0.045, 0.075, 0], [-0.05, 0.025, 0], -0.04, 8), 0.007, { n: 5 }), clay, {});
}
// a paper ball
export function paperBall(F, p, s = 1) { F.add(warp(sphere(0.03 * s, { n: 7, m: 4, center: true }), (x, y, z) => { const k = 1 + Math.sin(x * 300 + z * 170) * 0.12 + Math.cos(y * 240) * 0.1; return [x * k, y * k, z * k]; }), mat(T.sheet({ c: '#f4f0e4', seed: 3 })), { p: [p[0], p[1] + 0.026 * s, p[2]] }); }
// a sock (a bent tube), lying on the floor
export function sock(F, p, yaw, c) { F.add(tube([[0, 0.012, 0], [0.09, 0.012, 0.01], [0.13, 0.014, 0.04], [0.14, 0.012, 0.08]], 0.017, { n: 6, cap: true }), mat(T.fabric({ c: '#f4f2ee', kind: 'knit', seed: 4, size: [0.2, 0.2] })), { p, r: yaw, s: [1, 0.55, 1], tint: c }); }

// ---------------------------------------------------------------- lamps (return the bulb point)
// an anglepoise desk lamp: base at p, head toward dir (+1 = +x)
export function deskLamp(F, p, col, dir = -1) {
  const f = F.at(p, dir > 0 ? 0 : Math.PI), m = mat(T.enamel({ c: col, amp: 0.03 })), ch = M.metal('#a8acb4');
  f.add(cyl(0.07, 0.02, { n: 14, chamfer: 0.006 }), m, { ao: 0.3 });
  const j1 = [0, 0.03, 0], j2 = [0.04, 0.3, 0], j3 = [0.24, 0.36, 0];
  f.add(tube([j1, j2], 0.008, { n: 6 }), ch, {}); f.add(tube([j2, j3], 0.008, { n: 6 }), ch, {});
  for (const j of [j1, j2]) f.add(sphere(0.014, { center: true, n: 8, m: 4 }), m, { p: j });
  const head = f.at(j3, 0); head.add(lathe([[0.012, 0], [0.016, 0.01], [0.04, -0.06], [0.055, -0.1], [0.052, -0.1], [0.012, 0.002]], { n: 14, smoothV: false }), m, { r: [0, 0, -0.5] });
  return f.pt(j3[0] + 0.03, j3[1] - 0.06, 0);
}

// ---------------------------------------------------------------- seats and tables
export function chair(F, p, yaw, seatCol, wood = '#8a5a36') {
  const f = F.at(p, yaw), W = M.wood(wood, { seed: 4 }), sy = 0.44;
  for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) f.add(cbox(0.04, sy, 0.04, { b: 0.006, grain: 'y', taper: 0.85 }), W, { p: [x, 0, z], ao: 0.4 });
  f.add(slab(0.48, 0.46, 0.035, { r: 0.03, c: 0.008 }), W, { p: [0, sy, 0] });
  f.add(superq(0.42, 0.06, 0.4, { e1: 0.35, e2: 0.25 }), mat(T.fabric({ c: seatCol, kind: 'check', rep: 0.06, seed: 6 })), { p: [0, sy + 0.03, -0.01] });
  for (const x of [-0.2, 0.2]) f.add(cbox(0.04, 0.48, 0.04, { b: 0.006, grain: 'y' }), W, { p: [x, sy + 0.035, 0.2] });
  f.add(cbox(0.46, 0.1, 0.035, { b: 0.01 }), W, { p: [0, sy + 0.4, 0.2] });
  f.add(cbox(0.06, 0.3, 0.025, { b: 0.006, grain: 'y' }), W, { p: [0, sy + 0.08, 0.2] });
  for (const z of [-0.19, 0.19]) f.add(cbox(0.38, 0.025, 0.025, { b: 0.004 }), W, { p: [0, 0.12, z] });
  if (F.B) blobShadow(F.B, ...F.pt(0, 0, 0), 0.32, 0.3, 0.8);
  return sy + 0.035;
}
// a round plastic stool (seat height h)
export function stool(F, p, col, h = 0.5) {
  const f = F.at(p, 0), pl = mat(T.enamel({ c: col, amp: 0.03 })), leg = M.metal('#a8acb4');
  f.add(lathe([[0.17, -0.04], [0.21, -0.02], [0.225, 0.0], [0.22, 0.02], [0.2, 0.03], [0.0, 0.032]], { n: 18, smoothV: true, cap0: true }), pl, { p: [0, h - 0.032, 0] });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + TAU / 8; f.add(tube([[Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], [Math.cos(a) * 0.14, h - 0.05, Math.sin(a) * 0.14]], 0.012, { n: 6, cap: true }), leg, {}); }
  f.add(tube(Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * TAU; return [Math.cos(a) * 0.175, 0.16, Math.sin(a) * 0.175]; }), 0.007, { n: 5 }), leg, {});
  if (F.B) blobShadow(F.B, ...F.pt(0, 0, 0), 0.26, 0.26, 0.8);
  return h;
}
// a round dining table on a pedestal: radius R, top surface at h
export function roundTable(F, p, R, h, wood = '#7a4a2c') {
  const f = F.at(p, 0), W = M.wood(wood, { seed: 8, figure: 3 }), E = M.wood(tone(wood, -0.3), { seed: 9 });
  f.add(cyl(R, 0.05, { n: 28, chamfer: 0.012 }), W, { p: [0, h - 0.05, 0] });
  f.add(cyl(R * 0.94, 0.06, { n: 24, cap0: false }), E, { p: [0, h - 0.11, 0] });
  f.add(lathe([[0.2, 0], [0.12, 0.04], [0.07, 0.12], [0.06, h * 0.5], [0.08, h - 0.16], [0.14, h - 0.1]], { n: 12, cap0: false }), W, { ao: 0.4, aoH: 0.3 });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + TAU / 8; f.add(cbox(0.06, 0.05, 0.36, { b: 0.012, taper: 0.8 }), E, { p: [Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14], r: -a + Math.PI / 2 }); }
  if (F.B) blobShadow(F.B, ...F.pt(0, 0, 0), R * 1.05, R * 1.05, 0.9);
}

// ---------------------------------------------------------------- soft things
// a pillow (superellipsoid, a slight sag in the middle)
export function pillow(F, p, w, h, d, m, o = {}) { F.add(superq(w, h, d, { e1: 0.45, e2: 0.22, n: 16, m: 8, sag: h * 0.25 }), m, { p, r: o.r || 0, tint: o.tint, ao: 0.2 }); }
// a heap of laundry: overlapping soft lumps of mixed fabrics, a sleeve or two trailing
export function laundry(F, p, R, seed = 1, o = {}) {
  const r = rnd(seed), cols = o.cols || ['#e8e4dc', '#2e5a9c', '#c8423a', '#3a8a5a', '#2a2a30', '#e8c040', '#8a6ab4', '#5a7a9a', '#d8a0b0', '#f0ece4'];
  const kinds = ['plain', 'stripe', 'plaid', 'plain', 'dots', 'knit'];
  const n = o.n || 7;
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = r() * R * 0.6, w = R * (0.7 + r() * 0.6), h = R * (0.25 + r() * 0.3) * (1 - d / R * 0.5), c = cols[Math.floor(r() * cols.length)];
    F.add(warp(superq(w, h, w * (0.6 + r() * 0.4), { e1: 0.7, e2: 0.6, n: 10, m: 6 }), (x, y, z) => [x + Math.sin(z * 30 + i) * 0.01, y * (1 + Math.sin(x * 25 + i * 2) * 0.15), z]), mat(T.fabric({ c: '#f4f2ee', kind: kinds[i % kinds.length], c2: '#a8a4b0', seed: 30 + i, size: [0.5, 0.5], folds: 8 })), { p: [p[0] + Math.cos(a) * d, p[1] + (i > n * 0.6 ? R * 0.15 : 0), p[2] + Math.sin(a) * d], r: r() * TAU, tint: c, ao: 0.25 });
  }
  for (let s = 0; s < (o.sleeves ?? 2); s++) { const a = r() * TAU, c = cols[Math.floor(r() * cols.length)], pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([p[0] + Math.cos(a) * (R * 0.5 + t * R * 0.9) + Math.sin(t * 5) * 0.03, p[1] + 0.02 + (1 - t) * R * 0.12, p[2] + Math.sin(a) * (R * 0.5 + t * R * 0.9)]); } F.add(tube(pts, (t) => 0.04 - t * 0.008, { n: 7, cap: true }), mat(T.fabric({ c: '#f4f2ee', kind: 'plain', seed: 40 + s, size: [0.4, 0.4] })), { s: [1, 1, 1], tint: c, vc: (x, y) => 0.85 + y * 0.6 }); }
  if (F.B) blobShadow(F.B, ...F.pt(p[0], p[1], p[2]), R * 1.3, R * 1.2, 0.8);
}
// a beanbag with a dent where you sit
export function beanbag(F, p, R, c) {
  F.add(superq(R * 2, R * 1.3, R * 2, { e1: 0.85, e2: 0.95, n: 18, m: 10, sag: R * 0.55 }), mat(T.fabric({ c, kind: 'plain', seed: 12, folds: 14, size: [0.8, 0.8] })), { p, ao: 0.35 });
  if (F.B) blobShadow(F.B, ...F.pt(p[0], p[1], p[2]), R * 1.25, R * 1.2, 0.9);
}
// a backpack facing +z
export function backpack(F, p, yaw, c) {
  const f = F.at(p, yaw), m = mat(T.fabric({ c, kind: 'plain', rep: 0.03, seed: 14, folds: 5, size: [0.4, 0.4] }));
  f.add(superq(0.3, 0.42, 0.18, { e1: 0.35, e2: 0.4, n: 14, m: 8, taperTop: 0.8 }), m, { ao: 0.3 });
  f.add(superq(0.22, 0.17, 0.08, { e1: 0.35, e2: 0.4 }), m, { p: [0, 0.05, 0.085], tint: tone(c, -0.08) });
  f.add(tube(sagLine([-0.1, 0.18, 0.13], [0.1, 0.18, 0.13], -0.01, 6), 0.004, { n: 4 }), M.flat('#d8d8d0'), {});
  f.add(cbox(0.012, 0.03, 0.02, { b: 0.003 }), M.metal('#d8d8d0'), { p: [0.06, 0.175, 0.13] });
  f.add(tube(sagLine([-0.05, 0.42, -0.02], [0.05, 0.42, -0.02], -0.05, 6), 0.012, { n: 5 }), M.flat(tone(c, -0.35)), {});
  for (const sx of [-1, 1]) f.add(tube([[sx * 0.08, 0.38, -0.09], [sx * 0.11, 0.25, -0.13], [sx * 0.1, 0.05, -0.1]], 0.016, { n: 5 }), M.flat(tone(c, -0.35)), { s: [1, 1, 1] });
  if (F.B) blobShadow(F.B, ...F.pt(0, 0, 0), 0.24, 0.16, 0.8);
}

// ---------------------------------------------------------------- garments on hangers
const GARMENTS = {
  hoodie: { c: '#e8b830', w: 0.5, h: 0.6, sleeve: 0.28 },
  denim: { c: '#3a64a0', w: 0.5, h: 0.56, sleeve: 0.26 },
  stripes: { c: '#f4f0e8', w: 0.46, h: 0.5, sleeve: 0.12 },
  qipao: { c: '#c8202a', w: 0.4, h: 0.95, sleeve: 0.06 },
  flannel: { c: '#3a7a4a', w: 0.5, h: 0.58, sleeve: 0.27 },
  varsity: { c: '#6a3a9a', w: 0.5, h: 0.56, sleeve: 0.26 },
};
function garmentShape(G) {
  const w = G.w / 2, h = G.h, sl = G.sleeve, sh = h - 0.03;
  if (G === GARMENTS.qipao) return [[-0.06, h], [-0.15, h - 0.04], [-0.19, h - 0.12], [-0.17, h - 0.3], [-0.14, h - 0.42], [-0.19, 0.1], [-0.17, 0], [0.17, 0], [0.19, 0.1], [0.14, h - 0.42], [0.17, h - 0.3], [0.19, h - 0.12], [0.15, h - 0.04], [0.06, h]];
  return [[-0.07, h], [-w + 0.03, sh], [-w - sl * 0.55, sh - sl * 0.75], [-w - sl * 0.25, sh - sl * 0.95 - 0.04], [-w + 0.02, sh - 0.18], [-w + 0.01, 0.02], [-w + 0.03, 0], [w - 0.03, 0], [w - 0.01, 0.02], [w - 0.02, sh - 0.18], [w + sl * 0.25, sh - sl * 0.95 - 0.04], [w + sl * 0.55, sh - sl * 0.75], [w - 0.03, sh], [0.07, h]];
}
function garmentPrint(kind) {
  const G = GARMENTS[kind], xs = garmentShape(G).map((q) => q[0]), Wm = Math.max(...xs) - Math.min(...xs) + 0.02, Hm = G.h + 0.02;
  return print('garment-' + kind, Wm, Hm, (g, W, H) => {
    const c = G.c, X = (x) => (x / Wm + 0.5) * W, Y = (y) => (1 - y / Hm) * H;
    g.fillStyle = vgrad(g, 0, H, [[0, lite(c, 0.12)], [0.5, c], [1, shade(c, 0.12)]]); g.fillRect(0, 0, W, H);
    const r = rnd(kind.length * 7);
    if (kind === 'stripes') for (let y = H * 0.12; y < H; y += H * 0.07) { g.fillStyle = '#c8302c'; g.fillRect(0, y, W, H * 0.03); }
    if (kind === 'flannel') { for (let x = 0; x < W; x += W * 0.09) { g.fillStyle = 'rgba(20,40,30,0.5)'; g.fillRect(x, 0, W * 0.035, H); g.fillStyle = 'rgba(240,220,140,0.4)'; g.fillRect(x + W * 0.06, 0, 2, H); } for (let y = 0; y < H; y += W * 0.09) { g.fillStyle = 'rgba(20,40,30,0.5)'; g.fillRect(0, y, W, W * 0.035); g.fillStyle = 'rgba(200,40,40,0.35)'; g.fillRect(0, y + W * 0.06, W, 2); } }
    if (kind === 'qipao') { for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H; g.strokeStyle = '#f0c040'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; g.ellipse(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, 4, a, 0, TAU); } g.stroke(); g.fillStyle = '#f8e090'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); } g.strokeStyle = '#f0c040'; g.lineWidth = 6; g.beginPath(); g.moveTo(X(-0.05), Y(G.h - 0.02)); g.quadraticCurveTo(X(0.06), Y(G.h - 0.08), X(0.12), Y(G.h - 0.2)); g.stroke(); for (let i = 0; i < 3; i++) { g.fillStyle = '#f8e090'; g.fillRect(X(0.02 + i * 0.035) - 8, Y(G.h - 0.06 - i * 0.05) - 3, 16, 6); } }
    if (kind === 'varsity') { g.fillStyle = '#f0e8d8'; g.fillRect(0, 0, X(-G.w / 2 + 0.02), H); g.fillRect(X(G.w / 2 - 0.02), 0, W, H); g.fillStyle = '#f0e8d8'; g.fillRect(0, Y(0.05), W, H); g.fillStyle = '#e8c040'; g.fillRect(0, Y(0.07), W, 6); text(g, 'T', X(-0.1), Y(G.h * 0.6), H * 0.16, '#f0e8d8', { font: 'display', stroke: '#e8c040', sw: 6 }); }
    if (kind === 'denim') { for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(r() * W, r() * H, 6, 1); } g.strokeStyle = '#e8a040'; g.setLineDash([5, 4]); g.lineWidth = 2; for (const sx of [-1, 1]) { g.strokeRect(X(sx * 0.11) - W * 0.06, Y(G.h * 0.62), W * 0.12, H * 0.12); } g.beginPath(); g.moveTo(X(0), Y(G.h)); g.lineTo(X(0), 0 + H); g.stroke(); g.setLineDash([]); g.fillStyle = '#2a4a7a'; g.fillRect(X(0) - 3, Y(G.h), 6, H); for (let y = 0.15; y < 0.9; y += 0.15) { g.fillStyle = '#d8c060'; g.beginPath(); g.arc(X(0.02), Y(G.h * y), 6, 0, TAU); g.fill(); } }
    if (kind === 'hoodie') {
      g.fillStyle = shade(c, 0.12); rr(g, X(-0.13), Y(0.24), X(0.13) - X(-0.13), Y(0.06) - Y(0.24), 18); g.fill(); g.strokeStyle = shade(c, 0.35); g.lineWidth = 3; g.stroke();
      g.strokeStyle = '#f4ecd8'; g.lineWidth = 5; g.beginPath(); g.moveTo(X(-0.04), Y(G.h - 0.05)); g.lineTo(X(-0.05), Y(G.h - 0.2)); g.moveTo(X(0.04), Y(G.h - 0.05)); g.lineTo(X(0.05), Y(G.h - 0.18)); g.stroke();
      const cx = X(0), cy = Y(G.h * 0.55), R0 = W * 0.09; g.fillStyle = '#e8503a'; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.fill(); g.fillStyle = '#1e1418'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * R0 * 0.35, cy - R0 * 0.05, R0 * 0.1, R0 * 0.16, 0, 0, TAU); g.fill(); } g.fillStyle = '#f0b030'; g.beginPath(); g.moveTo(cx - R0 * 0.15, cy + R0 * 0.2); g.lineTo(cx + R0 * 0.15, cy + R0 * 0.2); g.lineTo(cx, cy + R0 * 0.45); g.fill(); g.fillStyle = '#ff9aa8'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * R0 * 0.6, cy + R0 * 0.25, R0 * 0.12, 0, TAU); g.fill(); }
      g.fillStyle = shade(c, 0.25); g.beginPath(); g.ellipse(X(0), Y(G.h), W * 0.11, H * 0.06, 0, 0, Math.PI); g.fill();
    }
    // ribbed hem + cuffs, collar shadow, side folds
    g.fillStyle = rgba(shade(c, 0.25), 0.9); g.fillRect(0, H - H * 0.05, W, H * 0.05); g.fillStyle = rgba(shade(c, 0.5), 0.4); for (let x = 0; x < W; x += 5) g.fillRect(x, H - H * 0.05, 2, H * 0.05);
    for (let i = 0; i < 6; i++) fold(g, X(-G.w * 0.4 + r() * G.w * 0.8), H * (0.4 + r() * 0.2), X(-G.w * 0.4 + r() * G.w * 0.8), H * (0.85 + r() * 0.1), X(r() * 0.2 - 0.1), H * 0.7, 4 + r() * 6, shade(c, 0.4), 0.22);
    g.fillStyle = vgrad(g, 0, H * 0.12, [[0, rgba(shade(c, 0.5), 0.5)], [1, rgba(shade(c, 0.5), 0)]]); g.fillRect(0, 0, W, H * 0.12);
    speckle(g, W, H, 5, 400, 0.04);
  }, 512);
}
// a garment on a wire hanger, the hook at p (the top of the hook), facing +z
export function garment(F, p, kind, yaw = 0) {
  const G = GARMENTS[kind], f = F.at(p, yaw), hy = -0.07;
  f.add(tube([[0, 0, 0], [0.02, 0.012, 0], [0.03, -0.01, 0], [0.012, -0.035, 0], [0, -0.05, 0], [0, hy + 0.012, 0]], 0.003, { n: 4 }), M.metal('#c8ccd4'), {});
  f.add(tube([[-G.w * 0.42, hy - 0.04, 0], [0, hy, 0], [G.w * 0.42, hy - 0.04, 0], [-G.w * 0.42, hy - 0.04, 0]], 0.003, { n: 4 }), M.metal('#c8ccd4'), {});
  const shape = garmentShape(G);
  f.add(extrude(shape, 0.035, { bevel: 0.01, fit: true, curve: 4 }), mat(garmentPrint(kind), { side: 2 }), { p: [0, hy - 0.035 - G.h, 0.004] });
  return hy - 0.035 - G.h;
}

// ---------------------------------------------------------------- bins, boxes, misc
export function bin(F, p, c = '#5a6a7a') { F.add(lathe([[0.1, 0], [0.13, 0.3], [0.125, 0.3], [0.095, 0.01]], { n: 16, smoothV: false, cap0: true, cap1: true }), mat(T.enamel({ c, amp: 0.04 })), { p, ao: 0.3 }); if (F.B) blobShadow(F.B, p[0], p[1], p[2], 0.16, 0.16, 0.7); }
const CARDBOARD = () => T.wood({ c: '#c8a070', fine: 2.5, figure: 0, knotP: 0, seed: 21, size: [0.5, 0.5] });
// a cardboard carton with tape
export function carton(F, p, w, h, d, o = {}) {
  const f = F.at(p, o.r || 0), c = mat(CARDBOARD());
  f.add(cbox(w, h, d, { b: 0.006 }), c, { tint: o.tint || '#ffffff', ao: 0.3 });
  f.add(cbox(w * 0.12, 0.002, d + 0.004, { b: 0 }), M.flat('#d8c090'), { p: [0, h, 0] });
  f.add(cbox(w * 0.12, h * 0.25, 0.002, { b: 0 }), M.flat('#d8c090'), { p: [0, h * 0.75, d / 2 + 0.001] });
  if (o.label) f.add(plane(w * 0.5, h * 0.4), mat(o.label), { p: [-w * 0.12, h * 0.15, d / 2 + 0.002] });
  if (F.B && o.shadow !== false) blobShadow(F.B, ...F.pt(0, 0, 0), w * 0.75, d * 0.75, 0.8);
}
export function basketball(F, p, R = 0.12) {
  const tex = print('basketball', 0.8, 0.4, (g, W, H) => { g.fillStyle = '#e8782e'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,200,150,0.2)' : 'rgba(120,40,10,0.15)'; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); } g.strokeStyle = '#2a1810'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); for (const x of [0.25, 0.5, 0.75, 1]) { g.moveTo(W * x, 0); g.lineTo(W * x, H); } g.stroke(); g.beginPath(); g.ellipse(W * 0.375, H / 2, W * 0.08, H * 0.45, 0, 0, TAU); g.ellipse(W * 0.875, H / 2, W * 0.08, H * 0.45, 0, 0, TAU); g.stroke(); }, 512);
  F.add(sphere(R, { n: 16, m: 10, fit: true }), mat(tex), { p, r: [0.3, 0.6, 0.2] });
  if (F.B) blobShadow(F.B, p[0], p[1], p[2], R * 1.1, R * 1.1, 0.8);
}
// a skateboard lying on the floor along +x
export function skateboard(F, p, yaw = 0, L = 0.8) {
  const f = F.at(p, yaw), deck = print('skatedeck', 0.8, 0.2, (g, W, H) => { g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, W, H); for (let i = 0; i < 6000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)'; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); } g.fillStyle = '#e8b830'; g.fillRect(W * 0.46, 0, W * 0.08, H); g.fillStyle = '#d84a3a'; g.beginPath(); g.moveTo(W * 0.3, 0); g.lineTo(W * 0.36, 0); g.lineTo(W * 0.26, H); g.lineTo(W * 0.2, H); g.fill(); g.beginPath(); g.moveTo(W * 0.7, 0); g.lineTo(W * 0.76, 0); g.lineTo(W * 0.66, H); g.lineTo(W * 0.6, H); g.fill(); }, 512);
  const pts = [], n = 10; for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI - Math.PI / 2; pts.push([L / 2 - 0.1 + Math.cos(a) * 0.1, Math.sin(a) * 0.1]); } for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI + Math.PI / 2; pts.push([-L / 2 + 0.1 + Math.cos(a) * 0.1, Math.sin(a) * 0.1]); }
  const dg = warp(extrude(pts, 0.014, { fit: true }), (x, y, z) => [x, y, z + Math.pow(Math.max(0, Math.abs(x) - L / 2 + 0.16) / 0.16, 2) * 0.04]);
  f.add(dg, mat(deck), { p: [0, 0.075, 0], r: [-Math.PI / 2, 0, 0] });
  for (const x of [-L / 2 + 0.17, L / 2 - 0.17]) {
    f.add(cbox(0.04, 0.03, 0.17, { b: 0.006 }), M.metal('#a8acb4'), { p: [x, 0.04, 0] });
    for (const z of [-0.09, 0.09]) f.add(cyl(0.028, 0.032, { n: 10, chamfer: 0.005 }), mat(T.enamel({ c: '#f0ece0' })), { p: [x, 0.028, z - 0.016], r: [Math.PI / 2, 0, 0] });
  }
  if (F.B) blobShadow(F.B, ...F.pt(0, 0, 0), L * 0.55, 0.15, 0.7);
}
// an acoustic guitar leaning back against a wall (face +z), bottom at p
export function guitar(F, p, o = {}) {
  const f = F.at(p, o.r || 0).at([0, 0, 0], [-(o.lean ?? 0.18), 0, o.roll ?? 0.06]);
  const top = print('guitartop', 0.4, 0.66, (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H * 0.62, W * 0.05, W / 2, H * 0.62, W * 0.62); gr.addColorStop(0, '#f0b060'); gr.addColorStop(0.55, '#c87a3a'); gr.addColorStop(1, '#5a2a12'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 3) { g.fillStyle = `rgba(90,40,10,${0.05 + Math.random() * 0.06})`; g.fillRect(x, 0, 1, H); }
    g.fillStyle = '#1a0e08'; g.beginPath(); g.arc(W / 2, H * 0.36, W * 0.13, 0, TAU); g.fill();
    for (let k = 0; k < 3; k++) { g.strokeStyle = k === 1 ? '#e8d8b0' : '#3a1a0a'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, H * 0.36, W * (0.16 + k * 0.018), 0, TAU); g.stroke(); }
    g.fillStyle = '#3a1a0a'; rr(g, W * 0.3, H * 0.7, W * 0.4, H * 0.045, 4); g.fill();
    g.fillStyle = '#5a2a1a'; g.beginPath(); g.moveTo(W * 0.6, H * 0.5); g.quadraticCurveTo(W * 0.78, H * 0.55, W * 0.72, H * 0.72); g.quadraticCurveTo(W * 0.62, H * 0.62, W * 0.6, H * 0.5); g.fill();
    g.strokeStyle = 'rgba(240,235,220,0.8)'; g.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const x = W * (0.46 + i * 0.016); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H * 0.72); g.stroke(); }
  }, 512);
  const body = [], lower = (a) => [Math.cos(a) * 0.2, 0.2 + Math.sin(a) * 0.2], upper = (a) => [Math.cos(a) * 0.155, 0.5 + Math.sin(a) * 0.155];
  for (let i = 0; i <= 8; i++) body.push(lower(-Math.PI / 2 + (i / 8) * (Math.PI / 2 + 0.7)));
  for (let i = 0; i <= 8; i++) body.push(upper(-0.7 + (i / 8) * (Math.PI + 1.4)));
  for (let i = 0; i <= 8; i++) body.push(lower(Math.PI - 0.7 + (i / 8) * (Math.PI / 2 + 0.7)));
  body.pop();
  f.add(extrude(body, 0.1, { bevel: 0.012, fit: true, curve: 4 }), mat(top), { p: [0, 0, 0] });
  const neck = M.wood('#5a3a24', { seed: 4 });
  f.add(cbox(0.05, 0.44, 0.03, { b: 0.006, grain: 'y' }), neck, { p: [0, 0.6, 0.01] });
  f.add(cbox(0.046, 0.42, 0.006, { b: 0 }), M.wood('#2a1810', { seed: 5 }), { p: [0, 0.62, 0.027] });
  f.add(cbox(0.08, 0.17, 0.022, { b: 0.008, grain: 'y', taper: 1.1 }), M.wood('#3a2418', { seed: 6 }), { p: [0, 1.03, 0.0], r: [-0.15, 0, 0] });
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) f.add(cyl(0.006, 0.03, { n: 6 }), M.metal('#e8d8a0'), { p: [sx * 0.04, 1.06 + i * 0.04, -0.005], r: [0, 0, sx * Math.PI / 2] });
  if (F.B) blobShadow(F.B, ...F.pt(0, 0, 0.06), 0.24, 0.12, 0.8);
}

// ================================================================ furniture by bounds (metres)
// a single bed against walls, headboard at x1 (o.head > 0) — returns { top, pillow }
// o: { x0, x1, z0, z1, y, wood, quilt (material), quiltTo (x where the quilt ends), lump: [x, z, r, h], sheet, pillowCol }
export function bed(B, o) {
  const { x0, x1, z0, z1, y } = o, Wd = M.wood(o.wood || '#6e4a30', { seed: 31, figure: 2 }), hb = 0.25, bx1 = x1 - hb, top = y + 0.5, zf = z1 - 0.08;
  // frame: rails, legs, a low foot rail
  for (const z of [z0 + 0.04, z1 - 0.04]) box(B, Wd, x0, y + 0.08, z - 0.04, bx1, y + 0.25, z + 0.04, { b: 0.012, ao: 0.2 });
  box(B, Wd, x0, y + 0.08, z0, x0 + 0.08, y + 0.25, z1, { b: 0.012 });
  for (const [x, z] of [[x0 + 0.04, z0 + 0.05], [x0 + 0.04, z1 - 0.05]]) box(B, Wd, x - 0.04, y, z - 0.04, x + 0.04, y + 0.42, z + 0.04, { b: 0.01, grain: 'y', ao: 0.4 });
  box(B, Wd, x0, y + 0.3, z0 + 0.05, x0 + 0.06, y + 0.4, z1 - 0.05, { b: 0.012 });
  // headboard: posts with ball finials, slats, a capped top rail and a lower panel
  for (const z of [z0 + 0.05, z1 - 0.05]) { box(B, Wd, x1 - 0.13, y, z - 0.05, x1 - 0.01, y + 1.22, z + 0.05, { b: 0.014, grain: 'y', ao: 0.4 }); B.add(sphere(0.05, { n: 10, m: 6 }), Wd, { p: [x1 - 0.07, y + 1.22, z] }); }
  box(B, Wd, x1 - 0.14, y + 1.08, z0 + 0.05, x1, y + 1.18, z1 - 0.05, { b: 0.02 });
  box(B, Wd, x1 - 0.12, y + 0.2, z0 + 0.05, x1 - 0.03, y + 0.62, z1 - 0.05, { b: 0.01 });
  const ns = Math.round((z1 - z0 - 0.2) / 0.16); for (let i = 1; i < ns; i++) { const z = z0 + 0.05 + (i / ns) * (z1 - z0 - 0.1); box(B, Wd, x1 - 0.1, y + 0.62, z - 0.025, x1 - 0.05, y + 1.08, z + 0.025, { b: 0.008, grain: 'y' }); }
  // mattress
  B.add(slab(bx1 - x0 - 0.02, zf - z0 - 0.01, 0.24, { r: 0.05, c: 0.03 }), mat(T.fabric({ c: '#efe9e0', kind: 'ticking', c2: '#b8c4d8', rep: 0.09, seed: 32, size: [0.6, 0.6] })), { p: [(x0 + bx1) / 2, top - 0.24, (z0 + zf) / 2] });
  // the quilt: a sheet over the mattress top, rounding the front edge and the foot end and falling to the floor rail
  const qx1 = o.quiltTo ?? lerp(x0, bx1, 0.68), over = 0.5, rb = 0.06, arc = (Math.PI / 2) * rb, lump = o.lump;
  const qg = sheet((u, v) => {
    let x = lerp(x0 - over, qx1, u), z = lerp(z0 + 0.01, zf + over, v), yy = top + 0.06;
    const dz = Math.max(0, z - zf), dx = Math.max(0, x0 + 0.01 - x), d = Math.hypot(dx, dz);
    if (lump) { const q = Math.hypot(x - lump[0], z - lump[1]) / lump[2]; if (q < 1) yy += lump[3] * (1 + Math.cos(q * Math.PI)) * 0.5; }
    yy += Math.sin(x * 9 + z * 4) * 0.012 + Math.sin(z * 13 - x * 3) * 0.008 + (u > 0.93 ? (u - 0.93) * 0.9 : 0);
    if (d > 0) {
      const ex = x + dx, ez = z - dz, nx = -dx / d, nz = dz / d; let out, drop;
      if (d <= arc) { const t = d / rb; out = Math.sin(t) * rb; drop = rb * (1 - Math.cos(t)); } else { out = rb + (d - arc) * 0.12; drop = rb + (d - arc); }
      const flutter = Math.sin((nx !== 0 && nz === 0 ? z : x) * 26) * 0.018 * cl((d - arc) / 0.3);
      x = ex + nx * (out + flutter); z = ez + nz * (out + flutter); yy = Math.max(y + 0.3, yy - drop);
    }
    return [x, yy, z];
  }, 34, 26, { flip: true });
  B.add(qg, o.quilt || mat(T.quilt({ cols: ['#c8423a', '#e8d4b0', '#2e4a7a', '#e88a3a', '#f0ece4', '#8a2a3a'], seed: 33 }), { side: 2 }), {});
  // the folded-back sheet at the head end of the quilt
  B.add(warp(cyl(0.045, zf - z0 - 0.02, { n: 8, cap: false }), (x, yy, z) => [x, yy, z * 0.6]), mat(T.fabric({ c: '#f4f0e8', kind: 'stripe', c2: '#d8e0ec', rep: 0.06, seed: 34 })), { p: [qx1 + 0.02, top + 0.07, z0 + 0.01], r: [Math.PI / 2, 0, 0] });
  // pillows
  const pc = mat(T.fabric({ c: o.pillowCol || '#f4efe6', kind: 'dots', c3: '#f8c8c8', rep: 0.07, seed: 35, folds: 6 }));
  const px = bx1 - 0.32, zm = (z0 + zf) / 2;
  pillow(B, [px, top - 0.01, lerp(z0, zm, 0.5)], 0.42, 0.17, 0.62, pc, { r: Math.PI / 2 + 0.06 });
  pillow(B, [px - 0.02, top - 0.01, lerp(zm, zf, 0.5)], 0.42, 0.17, 0.62, pc, { r: Math.PI / 2 - 0.1 });
  blobShadow(B, (x0 + x1) / 2, y, (z0 + z1) / 2 + 0.05, (x1 - x0) * 0.55, (z1 - z0) * 0.55, 1);
  return { top, pillow: [px, top + 0.15, zm] };
}

// a big wardrobe with both doors swung open toward +z. o: { x0, x1, z0, z1, y, top, mid (divider x), wood, inner }
export function wardrobe(B, o) {
  const { x0, x1, z0, z1, y, top, mid } = o, Wd = M.wood(o.wood || '#7a5232', { seed: 41, figure: 3 }), Dk = M.wood('#4e321f', { seed: 42 }), In = M.wood(o.inner || '#b08c62', { seed: 43 }), t = 0.05;
  box(B, In, x0, y, z0, x1, top, z0 + 0.03, { b: 0.004 });                                        // back
  for (const [a, b] of [[x0, x0 + t], [x1 - t, x1]]) box(B, Wd, a, y, z0, b, top, z1, { b: 0.01, grain: 'y', ao: 0.3 });
  box(B, Wd, x0, top - t, z0, x1, top, z1, { b: 0.01 });
  box(B, Dk, x0, y, z0, x1, y + 0.13, z1, { b: 0.01, ao: 0.4 });
  box(B, Wd, x0 - 0.06, top, z0, x1 + 0.06, top + 0.07, z1 + 0.07, { b: 0.02 });                   // crown
  box(B, Dk, x0 - 0.02, top + 0.07, z0, x1 + 0.02, top + 0.15, z1 + 0.03, { b: 0.02 });
  box(B, Wd, x0 - 0.08, top + 0.15, z0, x1 + 0.08, top + 0.2, z1 + 0.09, { b: 0.015 });
  box(B, Wd, mid - 0.025, y + 0.13, z0, mid + 0.025, top - t, z1, { b: 0.006, grain: 'y' });   // divider
  // the right bay: drawers under three shelves
  const shelves = [y + 1.0, y + 1.5, y + 2.0];
  for (const sy of shelves) box(B, Wd, mid, sy - 0.04, z0 + 0.03, x1 - t, sy, z1 - 0.01, { b: 0.006 });
  const dTop = y + 0.85, nd = 2;
  for (let i = 0; i < nd; i++) { const a = y + 0.13 + i * ((dTop - y - 0.13) / nd), b = a + (dTop - y - 0.13) / nd; box(B, Wd, mid + 0.01, a + 0.01, z1 - 0.04, x1 - t - 0.01, b - 0.01, z1 - 0.005, { b: 0.012 }); for (const kx of [0.3, 0.7]) B.add(cbox(0.08, 0.018, 0.02, { b: 0.006 }), M.metal('#d8b440'), { p: [lerp(mid, x1 - t, kx), (a + b) / 2 - 0.009, z1] }); }
  box(B, Wd, mid, dTop, z0 + 0.03, x1 - t, dTop + 0.04, z1 - 0.01, { b: 0.006 });
  // the hanging bay: top shelf, chrome rail with brackets
  const ts = top - 0.38; box(B, Wd, x0 + t, ts - 0.035, z0 + 0.03, mid, ts, z1 - 0.01, { b: 0.006 });
  const railY = top - 0.62, railZ = (z0 + z1) / 2 + 0.06;
  B.add(cyl(0.014, mid - x0 - t, { n: 8 }), M.metal('#d0d4dc'), { p: [x0 + t, railY, railZ], r: [0, 0, -Math.PI / 2] });
  for (const x of [x0 + t + 0.01, mid - 0.01]) B.add(cyl(0.03, 0.012, { n: 10 }), M.metal('#d0d4dc'), { p: [x, railY, railZ], r: [0, 0, Math.PI / 2] });
  // doors, swung open 90°: panelled, hinged at the front corners
  const dw = (x1 - x0) / 2, door = (x, side) => {
    const f = B.at([x, y + 0.13, z1], side < 0 ? -Math.PI / 2 : Math.PI / 2), H = top - y - 0.2;
    // local: the door runs along +x (out from the hinge toward +z in the world), its face toward +z = room side
    f.add(cbox(dw, H, 0.035, { b: 0.008 }), Wd, { p: [dw / 2, 0, 0] });
    for (const [a, b] of [[0.08, H * 0.42], [H * 0.47, H - 0.08]]) for (const s of [1, -1]) { f.add(cbox(dw - 0.16, b - a, 0.012, { b: 0.008 }), Wd, { p: [dw / 2, a, s * 0.02], tint: '#f4ece0' }); f.add(cbox(dw - 0.2, b - a - 0.04, 0.012, { b: 0.006 }), Wd, { p: [dw / 2, a + 0.02, s * 0.026], tint: '#e8dccc' }); }
    for (const s of [1, -1]) f.add(sphere(0.022, { n: 8, m: 4, center: true }), M.metal('#d8b440'), { p: [dw - 0.06, H * 0.45, s * 0.04] });
    return f;
  };
  const dl = door(x0, -1), dr = door(x1, 1);
  blobShadow(B, (x0 + x1) / 2, y, (z0 + z1) / 2 + 0.2, (x1 - x0) * 0.62, 0.7, 1);
  return { shelves, railY, railZ, ts, top, dl, dr, dw };
}

// a desk with a drawer pedestal at the +x end. o: { x0, x1, z0, z1, y, top (surface y), wood }
export function desk(B, o) {
  const { x0, x1, z0, z1, y, top } = o, Wd = M.wood(o.wood || '#a87a4e', { seed: 51, figure: 3 }), Dk = M.wood('#6a4a2e', { seed: 52 });
  B.add(slab(x1 - x0 + 0.04, z1 - z0 + 0.04, 0.04, { r: 0.015, c: 0.01 }), Wd, { p: [(x0 + x1) / 2, top - 0.04, (z0 + z1) / 2] });
  for (const z of [z0 + 0.04, z1 - 0.04]) box(B, Wd, x0 + 0.02, y, z - 0.03, x0 + 0.08, top - 0.04, z + 0.03, { b: 0.008, grain: 'y', ao: 0.4 });
  box(B, Wd, x0 + 0.04, y + 0.1, z0 + 0.04, x0 + 0.07, y + 0.14, z1 - 0.04, { b: 0.006 });
  const dx0 = x1 - 0.7; box(B, Wd, dx0, y, z0, x1, top - 0.04, z1, { b: 0.01, ao: 0.35 });
  box(B, Dk, x0 + 0.08, top - 0.18, z0, dx0, top - 0.04, z0 + 0.03, { b: 0.006 });
  const n = 3, h0 = y + 0.06, h1 = top - 0.06;
  for (let i = 0; i < n; i++) { const a = h0 + (i / n) * (h1 - h0), b = h0 + ((i + 1) / n) * (h1 - h0); box(B, Wd, dx0 + 0.03, a + 0.008, z1, x1 - 0.03, b - 0.008, z1 + 0.02, { b: 0.01 }); B.add(cbox(0.1, 0.02, 0.022, { b: 0.008 }), M.metal('#d8b440'), { p: [(dx0 + x1) / 2, (a + b) / 2 - 0.01, z1 + 0.02] }); }
  blobShadow(B, (x0 + x1) / 2, y, (z0 + z1) / 2 + 0.1, (x1 - x0) * 0.58, 0.45, 0.9);
}

// a low open bookcase against a +z-facing wall, books on two shelves. o: { x0, x1, z0, z1, y, h, wood, seed }
export function bookcase(B, o) {
  const { x0, x1, z0, z1, y, h } = o, Wd = M.wood(o.wood || '#8a6a48', { seed: 61, figure: 2 }), r = rnd(o.seed || 62), t = 0.04;
  box(B, M.wood('#3a2a1e', { seed: 63 }), x0, y, z0, x1, y + h, z0 + 0.02, { b: 0.002 });
  for (const [a, b] of [[x0, x0 + t], [x1 - t, x1]]) box(B, Wd, a, y, z0, b, y + h, z1, { b: 0.008, grain: 'y', ao: 0.3 });
  box(B, Wd, x0 - 0.02, y + h - 0.04, z0, x1 + 0.02, y + h, z1 + 0.02, { b: 0.01 });
  box(B, Wd, x0, y, z0, x1, y + 0.07, z1, { b: 0.008, ao: 0.4 });
  const mid = y + h * 0.5; box(B, Wd, x0 + t, mid - 0.03, z0, x1 - t, mid, z1, { b: 0.006 });
  const cols = ['#c8423a', '#2e5a9c', '#e8c040', '#3a8a5a', '#f0ece4', '#e88a3a', '#8a4ab4', '#e86a8a', '#2a2a30', '#5ac8c8', '#f0a0b8'];
  for (const [fy, hh] of [[y + 0.07, mid - 0.03 - y - 0.07], [mid, y + h - 0.04 - mid]]) {
    let x = x0 + t + 0.01;
    while (x < x1 - t - 0.06) {
      if (r() < 0.06) { x += 0.05 + r() * 0.08; continue; }                         // a gap
      if (r() < 0.07) { const n = 2 + Math.floor(r() * 3); bookStack(B, [x + 0.08, fy, (z0 + z1) / 2 + 0.02], n, Math.floor(r() * 99), { w: 0.14, d: 0.13 }); x += 0.18; continue; }
      const w = 0.018 + r() * 0.025, bh = Math.min(hh - 0.02, hh * (0.62 + r() * 0.3)), d = (z1 - z0) * (0.7 + r() * 0.15), lean = r() < 0.08 ? 0.18 : 0;
      book(B, [x + w / 2 + (lean ? bh * 0.09 : 0), fy, z1 - d / 2 - 0.01], [w, bh, d], cols[Math.floor(r() * cols.length)], { r: 0 });
      if (lean) { /* leaning books are drawn upright: the gap after them reads as a lean */ }
      x += w + 0.002;
    }
  }
  blobShadow(B, (x0 + x1) / 2, y, z1, (x1 - x0) * 0.55, 0.25, 0.8);
}

// a red lacquered sideboard (doors facing +z), top board. o: { x0, x1, z0, z1, y, h }
export function sideboard(B, o) {
  const { x0, x1, z0, z1, y, h } = o, R = mat(T.wood({ c: '#8e2a24', seed: 71, fine: 6, figure: 1, var: 0.02, lacquer: '#a0302a' })), Dk = M.wood('#5a1a16', { seed: 72 }), top = M.wood('#6a2a20', { seed: 73 });
  box(B, R, x0, y + 0.06, z0, x1, y + h, z1, { b: 0.01 });
  box(B, Dk, x0 + 0.03, y, z0, x1 - 0.03, y + 0.07, z1 - 0.02, { b: 0.006, ao: 0.5 });
  box(B, top, x0 - 0.06, y + h, z0, x1 + 0.06, y + h + 0.05, z1 + 0.05, { b: 0.015 });
  const n = Math.max(2, Math.round((x1 - x0) / 0.7)), dw = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * dw;
    box(B, R, a + 0.025, y + 0.1, z1, a + dw - 0.025, y + h - 0.04, z1 + 0.02, { b: 0.01 });
    box(B, Dk, a + 0.08, y + 0.16, z1 + 0.012, a + dw - 0.08, y + h - 0.1, z1 + 0.024, { b: 0.006, tint: '#c88070' });
    B.add(cyl(0.025, 0.012, { n: 10 }), M.metal('#d8a840'), { p: [a + (i % 2 ? 0.06 : dw - 0.06), y + h * 0.55, z1 + 0.02], r: [Math.PI / 2, 0, 0] });
  }
  blobShadow(B, (x0 + x1) / 2, y, (z0 + z1) / 2 + 0.15, (x1 - x0) * 0.56, 0.4, 0.9);
}

// a run of kitchen base cabinets with a worktop; doors face +z (front plane z1); o: { x0, x1, z0, z1, y, top, step (door width), skip: [[xa, xb], ...] (sink cut-outs) }
export function counter(B, o) {
  const { x0, x1, z0, z1, y, top } = o, D = M.enamel('#ece4d0', { seed: 81 }), Fr = M.enamel('#c8bca4', { seed: 82 });
  const TOP = mat(T.enamel({ c: '#d0c8bc', amp: 0.08, seed: 83 }));
  box(B, Fr, x0, y + 0.1, z0, x1, top - 0.04, z1 - 0.02, { b: 0.006 });
  box(B, M.flat('#4a4038'), x0, y, z0, x1, y + 0.1, z1 - 0.06, { b: 0.004 });
  const step = o.step || 0.6, n = Math.max(1, Math.round((x1 - x0) / step)), dw = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * dw;
    box(B, D, a + 0.015, y + 0.12, z1 - 0.02, a + dw - 0.015, top - 0.2, z1, { b: 0.012 });
    box(B, D, a + 0.06, y + 0.17, z1 - 0.005, a + dw - 0.06, top - 0.25, z1 + 0.008, { b: 0.008, tint: '#f8f2e4' });
    box(B, D, a + 0.015, top - 0.18, z1 - 0.02, a + dw - 0.015, top - 0.06, z1, { b: 0.01 });                 // drawer
    B.add(cbox(0.12, 0.018, 0.02, { b: 0.006 }), M.metal('#9aa0a8'), { p: [a + dw / 2, top - 0.13, z1 + 0.01] });
    B.add(sphere(0.016, { n: 8, m: 4, center: true }), M.metal('#9aa0a8'), { p: [a + (i % 2 ? 0.08 : dw - 0.08), top - 0.32, z1 + 0.012] });
  }
  // worktop with the sink cut-outs
  const cuts = (o.skip || []).slice().sort((a, b) => a[0] - b[0]); let xa = x0 - 0.02;
  const seg = (a, b, za = z0, zb = z1 + 0.04) => { if (b - a > 0.005) box(B, TOP, a, top - 0.04, za, b, top, zb, { b: 0.008 }); };
  for (const [ca, cb, cz0, cz1] of cuts) { seg(xa, ca); seg(ca, cb, z0, cz0); seg(ca, cb, cz1, z1 + 0.04); xa = cb; }
  seg(xa, x1);
  box(B, M.flat('#b8b0a2'), x0, top - 0.002, z0, x1, top + 0.08, z0 + 0.015, { b: 0.004 });                    // back splash lip
  edgeShadowFloor(B, x0, x1, z1 - 0.06, y);
}
function edgeShadowFloor(B, x0, x1, z, y) { blobShadow(B, (x0 + x1) / 2, y, z + 0.05, (x1 - x0) * 0.52, 0.18, 0.8); }

// an old rounded fridge facing +z. o: { x0, x1, z0, z1, y, h } → front plane z
export function fridge(B, o) {
  const { x0, x1, z0, z1, y, h } = o, E = mat(T.enamel({ c: '#ece6d6', amp: 0.04, seed: 91 })), w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2;
  B.add(slab(w, d, h - 0.06, { r: 0.08, c: 0.05, seg: 4 }), E, { p: [cx, y + 0.05, (z0 + z1) / 2], ao: 0.2 });
  box(B, M.flat('#3a3a40'), x0 + 0.04, y, z0 + 0.04, x1 - 0.04, y + 0.06, z1 - 0.06, { b: 0.004 });
  box(B, M.flat('#b8b4a6'), x0 + 0.03, y + h * 0.66, z1 - 0.01, x1 - 0.03, y + h * 0.66 + 0.012, z1 + 0.006, { b: 0.002 });
  for (const [a, b] of [[y + h * 0.72, y + h * 0.88], [y + h * 0.36, y + h * 0.56]]) B.add(tube([[x1 - 0.1, a, z1 + 0.01], [x1 - 0.09, a + 0.01, z1 + 0.05], [x1 - 0.09, b - 0.01, z1 + 0.05], [x1 - 0.1, b, z1 + 0.01]], 0.014, { n: 6 }), M.metal('#c8ccd4'), {});
  blobShadow(B, cx, y, (z0 + z1) / 2 + 0.06, w * 0.62, d * 0.62, 1);
  return { front: z1 + 0.005 };
}
// a two-burner gas range with a wok and a stockpot on the worktop (top at y). Returns { steam, wok }
export function stove(B, x0, y, z0, o = {}) {
  const w = 0.68, d = 0.5, cx = x0 + w / 2, cz = z0 + d / 2 + 0.02, blk = mat(T.enamel({ c: '#2a2a2e', amp: 0.05, seed: 101 })), st = M.metal('#b8bcc4');
  B.add(slab(w, d, 0.06, { r: 0.02, c: 0.008 }), blk, { p: [cx, y, cz] });
  box(B, st, x0, y, z0 + d - 0.02, x0 + w, y + 0.07, z0 + d + 0.04, { b: 0.008 });
  for (const kx of [0.12, 0.26, 0.42, 0.56]) B.add(cyl(0.02, 0.022, { n: 10, chamfer: 0.004 }), M.flat('#e8e8ec'), { p: [x0 + kx * w / 0.68, y + 0.04, z0 + d + 0.04], r: [Math.PI / 2, 0, 0] });
  const burners = [cx - 0.17, cx + 0.17];
  for (const bx of burners) {
    B.add(cyl(0.06, 0.02, { n: 12 }), M.flat('#1a1a1e'), { p: [bx, y + 0.06, cz - 0.02] });
    for (let i = 0; i < 4; i++) B.add(cbox(0.2, 0.012, 0.014, { b: 0.003 }), M.flat('#18181c'), { p: [bx, y + 0.08, cz - 0.02], r: (i / 4) * Math.PI });
  }
  // wok + stir-fry, a long wooden handle out to the left
  const wx = burners[0], wz = cz - 0.02, wy = y + 0.1;
  B.add(lathe([[0.04, 0], [0.12, 0.04], [0.19, 0.1], [0.185, 0.1], [0.115, 0.042], [0.0, 0.012]], { n: 20, smoothV: true }), mat(T.metal({ c: '#3a3a42', seed: 102 })), { p: [wx, wy, wz] });
  const fry = print('stirfry', 0.32, 0.32, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, '#8a4a22'); gr.addColorStop(1, '#3a2a22'); g.fillStyle = gr; g.fillRect(0, 0, W, H); const r = rnd(5); for (let i = 0; i < 70; i++) { const c = ['#5a9a3a', '#e8783a', '#f0d070', '#7ac050', '#c84a2a', '#f4ecd8'][Math.floor(r() * 6)], x = W * (0.2 + r() * 0.6), yy = H * (0.2 + r() * 0.6); g.fillStyle = c; g.beginPath(); g.ellipse(x, yy, 4 + r() * 10, 3 + r() * 5, r() * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x - 2, yy - 2, 3, 2); } }, 512);
  B.add(warp(cyl(0.13, 0.012, { n: 16, fit: true, cap0: false }), (x, yy, z) => [x, yy + Math.sin(x * 40) * 0.006 + Math.cos(z * 30) * 0.006 + (0.13 - Math.hypot(x, z)) * 0.15, z]), mat(fry), { p: [wx, wy + 0.04, wz] });
  B.add(tube([[wx - 0.18, wy + 0.09, wz], [wx - 0.3, wy + 0.12, wz], [wx - 0.44, wy + 0.14, wz]], 0.016, { n: 6, cap: true }), M.wood('#5a3a24', { seed: 103 }), {});
  // the stockpot with its lid ajar
  const px = burners[1], pz = cz - 0.02;
  B.add(cyl(0.14, 0.26, { n: 18, chamfer: 0.01 }), st, { p: [px, y + 0.09, pz], ao: 0.25 });
  B.add(cyl(0.142, 0.012, { n: 18, cap: false }), M.metal('#d8dce2'), { p: [px, y + 0.31, pz] });
  for (const s of [-1, 1]) B.add(cbox(0.05, 0.02, 0.03, { b: 0.006 }), st, { p: [px + s * 0.16, y + 0.29, pz] });
  B.add(lathe([[0.15, 0], [0.13, 0.025], [0.04, 0.04], [0.02, 0.045], [0.022, 0.06], [0.001, 0.065]], { n: 18 }), M.metal('#c8ccd4'), { p: [px - 0.03, y + 0.36, pz], r: [0, 0, 0.12] });
  blobShadow(B, cx, y + 0.06, cz, w * 0.5, d * 0.45, 0.6);
  return { steam: [px, y + 0.42, pz], wok: [wx, wy + 0.06, wz] };
}
// a rice cooker standing at p; returns the steam point
export function riceCooker(B, p, o = {}) {
  const f = B.at(p, o.r || 0), body = mat(T.enamel({ c: '#f2eee4', amp: 0.03, seed: 111 }));
  f.add(lathe([[0.12, 0], [0.135, 0.02], [0.14, 0.16], [0.13, 0.19], [0.0, 0.2]], { n: 20, smoothV: false }), body, { ao: 0.25 });
  f.add(cyl(0.141, 0.03, { n: 20, cap: false }), M.flat('#e88aa0'), { p: [0, 0.05, 0] });
  f.add(lathe([[0.13, 0], [0.12, 0.04], [0.06, 0.07], [0.0, 0.075]], { n: 20 }), body, { p: [0, 0.19, 0] });
  f.add(cbox(0.12, 0.03, 0.04, { b: 0.012 }), M.flat('#3a3a40'), { p: [0, 0.255, -0.02] });
  f.add(cbox(0.09, 0.06, 0.02, { b: 0.008 }), M.flat('#3a3a40'), { p: [0, 0.08, 0.13] });
  f.add(sphere(0.008, { n: 6, m: 3, center: true }), mat(T.flat('#ff6a3a', { noise: false }), { glow: 1.6, keep: true }), { p: [-0.02, 0.11, 0.142] });
  blobShadow(B, p[0], p[1], p[2], 0.17, 0.17, 0.8);
  return f.pt(0, 0.28, 0);
}
// a metal range hood (x0..x1, bottom at y, against the back wall z0, depth to z1)
export function hood(B, x0, x1, y, z0, z1) {
  const m = M.metal('#9ea2aa');
  box(B, m, x0, y, z0, x1, y + 0.12, z1, { b: 0.01 });
  B.add(cbox(x1 - x0 - 0.1, 0.2, z1 - z0 - 0.02, { b: 0.01, taper: 0.7 }), m, { p: [(x0 + x1) / 2, y + 0.12, (z0 + z1) / 2 - 0.02] });
  box(B, m, (x0 + x1) / 2 - 0.2, y + 0.32, z0, (x0 + x1) / 2 + 0.2, y + 0.9, z0 + 0.28, { b: 0.01 });
  box(B, M.flat('#3a3e46'), x0 + 0.02, y - 0.004, z0 + 0.02, x1 - 0.02, y + 0.01, z1 - 0.02, { b: 0 });
}
// a utensil rail at height y along x on a wall (front plane z): ladle, spatula, strainer, cleaver
export function utensils(B, x0, x1, y, z) {
  const m = M.metal('#c8ccd4'), wd = M.wood('#6a4428', { seed: 121 });
  B.add(cyl(0.01, x1 - x0, { n: 6 }), M.metal('#8a8e98'), { p: [x0, y, z + 0.04], r: [0, 0, -Math.PI / 2] });
  const kinds = ['ladle', 'spatula', 'strainer', 'ladle', 'cleaver', 'spatula'], n = Math.floor((x1 - x0) / 0.2);
  for (let i = 0; i < n; i++) {
    const x = x0 + 0.1 + i * ((x1 - x0 - 0.2) / Math.max(1, n - 1)), kd = kinds[i % kinds.length];
    B.add(tube([[x, y + 0.01, z + 0.04], [x + 0.01, y + 0.03, z + 0.055], [x, y - 0.01, z + 0.06]], 0.004, { n: 4 }), M.metal('#8a8e98'), {});
    if (kd === 'cleaver') { B.add(cbox(0.03, 0.12, 0.025, { b: 0.008, grain: 'y' }), wd, { p: [x, y - 0.13, z + 0.06] }); B.add(cbox(0.2, 0.1, 0.006, { b: 0.002 }), m, { p: [x - 0.06, y - 0.24, z + 0.06] }); continue; }
    B.add(cyl(0.008, 0.26, { n: 6 }), kd === 'strainer' ? M.metal('#e8a840') : m, { p: [x, y - 0.27, z + 0.065] });
    if (kd === 'ladle') B.add(lathe([[0.0, 0], [0.04, 0.012], [0.05, 0.04], [0.047, 0.04], [0.0, 0.015]], { n: 12, cap1: true }), m, { p: [x, y - 0.33, z + 0.08], r: [0.3, 0, 0] });
    else if (kd === 'spatula') B.add(cbox(0.08, 0.1, 0.006, { b: 0.002, taper: 1.2 }), m, { p: [x, y - 0.37, z + 0.065] });
    else B.add(lathe([[0.0, 0], [0.05, 0.02], [0.065, 0.05], [0.0, 0.05]], { n: 12 }), mat(T.metal({ c: '#e8a840', seed: 4 })), { p: [x, y - 0.36, z + 0.09], r: [Math.PI / 2 - 0.2, 0, 0] });
  }
}
// an aquarium on a stand: water, gravel, weed, fish (returned as separate meshes for animation)
export function fishTank(B, o) {
  const { x0, x1, y, z0, z1, h } = o, fr = M.flat('#2a2a30'), y1 = y + h;
  for (const [a, b] of [[y, y + 0.03], [y1 - 0.03, y1]]) box(B, fr, x0, a, z0, x1, b, z1, { b: 0.004 });
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) box(B, fr, x - (x === x0 ? 0 : 0.02), y, z - (z === z0 ? 0 : 0.02), x + (x === x0 ? 0.02 : 0), y1, z + (z === z0 ? 0.02 : 0), { b: 0 });
  const gravel = print('gravel', 0.4, 0.2, (g, W, H) => { g.fillStyle = '#a89878'; g.fillRect(0, 0, W, H); const r = rnd(3); for (let i = 0; i < 900; i++) { g.fillStyle = ['#d8c8a0', '#c8b890', '#8a7a60', '#e8d8b0', '#c86a4a', '#6a8ac8'][Math.floor(r() * 6)]; g.beginPath(); g.ellipse(r() * W, r() * H, 2 + r() * 3, 1.5 + r() * 2.5, r() * 3, 0, TAU); g.fill(); } }, 512);
  box(B, mat(gravel), x0 + 0.02, y + 0.03, z0 + 0.02, x1 - 0.02, y + 0.08, z1 - 0.02, { b: 0, fit: true });
  for (let i = 0; i < 5; i++) { const x = lerp(x0 + 0.1, x1 - 0.1, i / 4) + (i % 2) * 0.03, z = lerp(z0 + 0.06, z1 - 0.12, (i * 0.37) % 1), pts = []; for (let k = 0; k <= 6; k++) pts.push([x + Math.sin(k * 1.3 + i) * 0.025, y + 0.06 + k * (h * 0.11), z]); B.add(tube(pts, (t) => 0.012 * (1 - t * 0.7), { n: 4 }), M.flat(i % 2 ? '#3a9a4a' : '#5ab05a'), {}); }
  B.add(superq(0.12, 0.08, 0.1, { e1: 0.8, e2: 0.8 }), M.flat('#8a8a90'), { p: [x1 - 0.2, y + 0.06, (z0 + z1) / 2] });
  const water = mat(T.enamel({ c: '#5ab4c8', amp: 0.08, streaks: false }), { transparent: true, opacity: 0.42, side: 2, keep: true, depthWrite: false });
  box(B, water, x0 + 0.015, y + 0.04, z0 + 0.015, x1 - 0.015, y1 - 0.05, z1 - 0.015, { b: 0 });
  box(B, M.glow(T.flat('#c8f0ff', { noise: false }), 1.2), x0 + 0.03, y1 - 0.03, z0 + 0.03, x1 - 0.03, y1 - 0.02, z0 + 0.08, { b: 0 });
  const fish = [];
  for (const [c, k] of [['#ff8a2a', 0.3], ['#ffd040', 0.6], ['#ff4a6a', 0.45]]) {
    const shape = [[-0.03, 0], [-0.012, 0.012], [0.012, 0.01], [0.022, 0], [0.012, -0.01], [-0.012, -0.012], [-0.03, 0], [-0.045, 0.014], [-0.045, -0.014]];
    const m = B.mesh(extrude(shape, 0.008, { bevel: 0.003 }), M.flat(c), { p: [lerp(x0, x1, k), y + h * (0.35 + k * 0.3), lerp(z0, z1, 0.4)] });
    fish.push({ m, k, x0: x0 + 0.08, x1: x1 - 0.08, y: m.position.y });
  }
  return { fish, light: [(x0 + x1) / 2, y1, (z0 + z1) / 2] };
}
// an owl perch: crossed feet, a post, a rope-wrapped bar along z; top y returned
export function perch(B, p, h) {
  const Wd = M.wood('#7a5232', { seed: 131 }), f = B.at(p, 0);
  for (const r of [0, Math.PI / 2]) f.add(cbox(0.82, 0.06, 0.1, { b: 0.015 }), Wd, { r, ao: 0.4 });
  f.add(cyl(0.04, h - 0.06, { n: 10 }), Wd, { p: [0, 0.06, 0] });
  f.add(cyl(0.05, 0.86, { n: 12, chamfer: 0.01 }), mat(T.rope({ c: '#c8a870' })), { p: [0, h, -0.43], r: [Math.PI / 2, 0, 0] });
  for (const z of [-0.47, 0.47]) f.add(sphere(0.055, { n: 10, m: 6, center: true }), Wd, { p: [0, h + 0.05, z] });
  f.add(lathe([[0.04, 0], [0.06, 0.05], [0.055, 0.05], [0.035, 0.008]], { n: 12, cap0: true, cap1: true }), M.metal('#c8ccd4'), { p: [0.08, h - 0.24, 0.25] });
  blobShadow(B, p[0], p[1], p[2], 0.45, 0.45, 0.8);
  return p[1] + h + 0.1;
}
// a wicker dog basket (the low side toward +z), cushion and a rumpled blanket; returns the bed top y
export function dogBasket(B, p, R, o = {}) {
  const f = B.at(p, o.r || 0), wk = mat(T.wicker({ c: '#b88a50' }));
  f.add(warp(lathe([[R * 0.8, 0], [R, 0.08], [R * 1.04, 0.36], [R * 0.98, 0.38], [R * 0.92, 0.36], [R * 0.86, 0.07], [0.0, 0.05]], { n: 22, smoothV: true, cap0: true }), (x, y, z) => [x, y > 0.1 ? y - 0.2 * sstep(0, R, z) * ((y - 0.1) / 0.28) : y, z]), wk, { ao: 0.35 });
  f.add(tube(Array.from({ length: 23 }, (_, i) => { const a = (i / 22) * TAU, z = Math.cos(a) * R; return [Math.sin(a) * R * 1.0, 0.37 - 0.2 * sstep(0, R, z), z]; }), 0.03, { n: 6 }), mat(T.wicker({ c: '#a87a44', row: 0.03, col: 0.02, seed: 4 })), {});
  f.add(superq(R * 1.7, 0.14, R * 1.7, { e1: 0.5, e2: 0.9, sag: 0.05 }), mat(T.fabric({ c: o.cushion || '#7a9ab8', kind: 'plain', seed: 141, folds: 8 })), { p: [0, 0.05, 0] });
  f.add(sheet((u, v) => { const x = lerp(-R * 0.75, R * 0.55, u), z = lerp(-R * 0.7, R * 0.4, v); return [x, 0.19 + Math.sin(u * 7 + v * 3) * 0.03 + Math.max(0, 0.3 - Math.hypot(x + R * 0.3, z + R * 0.3)) * 0.4, z]; }, 12, 10, { flip: true }), mat(T.fabric({ c: '#efe4cc', kind: 'plaid', c2: '#c8423a', c3: '#2e4a7a', rep: 0.12, seed: 142 }), { side: 2 }), {});
  blobShadow(B, p[0], p[1], p[2], R * 1.2, R * 1.2, 1);
  return p[1] + 0.19;
}
// a standing electric fan facing +x
export function fan(B, p, o = {}) {
  const f = B.at(p, o.r || 0), wht = mat(T.enamel({ c: '#e8e8ec', amp: 0.02 })), mt = M.metal('#c8ccd4');
  f.add(cyl(0.15, 0.04, { n: 16, chamfer: 0.01 }), wht, { ao: 0.4 });
  f.add(cyl(0.016, 1.15, { n: 8 }), mt, { p: [0, 0.04, 0] });
  const hy = 1.32, hd = f.at([0, hy, 0], 0);
  hd.add(superq(0.18, 0.13, 0.13, { e1: 0.7, e2: 0.8 }), wht, { p: [-0.12, -0.065, 0] });
  for (const rr2 of [0.3, 0.2, 0.1]) hd.add(tube(Array.from({ length: 25 }, (_, i) => { const a = (i / 24) * TAU; return [0.06, Math.sin(a) * rr2, Math.cos(a) * rr2]; }), 0.004, { n: 4 }), mt, {});
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; hd.add(tube([[0.06, Math.sin(a) * 0.3, Math.cos(a) * 0.3], [0.1, Math.sin(a) * 0.15, Math.cos(a) * 0.15], [0.11, 0, 0]], 0.003, { n: 3 }), mt, {}); hd.add(tube([[0.06, Math.sin(a) * 0.3, Math.cos(a) * 0.3], [0.0, Math.sin(a) * 0.2, Math.cos(a) * 0.2], [-0.02, 0, 0]], 0.003, { n: 3 }), mt, {}); }
  const blade = [[0, 0], [0.08, 0.06], [0.24, 0.07], [0.27, 0.0], [0.2, -0.05], [0.06, -0.03]];
  for (let i = 0; i < 3; i++) hd.at([0.04, 0, 0], [0, Math.PI / 2, 0]).at([0, 0, 0], [0, 0, (i / 3) * TAU]).add(extrude(blade, 0.006, {}), mat(T.enamel({ c: '#5a8ae8', amp: 0.02 }), { side: 2 }), { r: [0, 0.3, 0] });
  hd.add(cyl(0.05, 0.04, { n: 12, chamfer: 0.01 }), mat(T.enamel({ c: '#3a6ac8' })), { p: [0.05, 0, 0], r: [0, 0, -Math.PI / 2] });
  blobShadow(B, p[0], p[1], p[2], 0.2, 0.2, 0.8);
}
