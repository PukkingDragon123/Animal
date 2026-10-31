// Pixel-art shapes for the UI kit, all hard-edged (no gradients, no anti-aliasing):
//  • frame(): a cream parchment panel in a chunky copper frame — dark outline, a lit rim on the top/left,
//    mid copper, a dark inner line, a thin pink-brown line inside the cream, corner brackets that stand
//    proud of the frame, rivets at the edge midpoints and a soft dark drop shadow
//  • knob(): a pressable button face with a darker lip below (squashes onto it when held)
//  • plinth(): the little wooden stand under icon buttons · pill(): the cream value counter
//  • bars: thin pill bars with end caps and a light top band, thick capsule bars in a copper frame with
//    brass clamp bands near each end
//  • ball / ring / tri / sparkle / gem: pixel discs, copper rings, outlined triangles, twinkles
// Each detailed thing is painted once into a sprite (gfx.sprite) and blitted at integer coordinates.
// Functions take (ui, …) or (s, …) where s is the ui's canvas surface (s.ui).
import { T, BARS, mx, sh, pa } from './theme.js';
import { css, rgba, sprite, blit, rowIns, fillShape, fillDisc, discRows, makeCanvas } from './gfx.js';
import { P } from '../../surface.js';

const U = (s) => (s && s.ui) || s;
const R = Math.round;

// ------------------------------------------------------------------ the frame painter
// depth of every pixel of a w×h shape from its edge (and which side is nearest: 1 top, 2 bottom, 3 left, 4 right)
function depthMap(w, h, r, kind) {
  const I = rowIns(h, Math.min(r, h / 2, w / 2), kind), top = new Int16Array(w).fill(h), bot = new Int16Array(w).fill(-1);
  for (let j = 0; j < h; j++) for (let i = I[j]; i < w - I[j]; i++) { if (j < top[i]) top[i] = j; if (j > bot[i]) bot[i] = j; }
  const D = new Int16Array(w * h).fill(-1), S = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = I[j]; i < w - I[j]; i++) {
    const a = j - top[i], b = bot[i] - j, c = i - I[j], e = w - 1 - I[j] - i;
    let d = a, s = 1; if (c < d) { d = c; s = 3; } if (b < d) { d = b; s = 2; } if (e < d) { d = e; s = 4; }
    D[j * w + i] = d; S[j * w + i] = s;
  }
  return { D, S };
}
// the panel look → packed colours
function look(o) {
  const edge = o.edge || null, cop = edge ? edge : T.copper;
  return {
    ink: P(o.line || T.ink), hiL: P(edge ? mx(edge, '#ffffff', 0.55) : T.copperH), lit: P(edge ? mx(edge, '#ffffff', 0.3) : T.copperL), mid: P(cop), dk: P(edge ? mx(edge, T.ink, 0.35) : T.copperD),
    cream: o.fill ? P(o.fill) : P(o.paper && o.paper !== true ? o.paper : T.cream), creamL: P(o.fill ? mx(o.fill, '#ffffff', 0.18) : T.creamL), line: P(o.fill ? mx(o.fill, '#ffffff', 0.1) : T.creamLine), creamD: P(o.fill ? mx(o.fill, T.ink, 0.2) : T.creamD),
    shade: pa(T.shade, o.shadowA ?? 0.38), alpha: o.alpha ?? 1,
  };
}
export function paintFrame(d, W, H, px, py, w, h, o = {}) {
  const big = !o.thin && (o.big || (w >= 40 && h >= 26)), r = o.r ?? (big ? 4 : h >= 12 ? 3 : 2), kind = o.pill ? 'pill' : 'round';
  const L = look(o), { D, S } = depthMap(w, h, o.pill ? h / 2 : r, kind);
  const band = big ? 4 : 2;            // ink 0, copper rim 1..band-1, ink at band
  const put = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) d[y * W + x] = v; };
  // shadow
  if (o.shadow !== false) { const sy = big ? 3 : 2; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (D[j * w + i] >= 0) { const X = px + i, Y = py + j + sy; if (Y < py + h && D[(Y - py) * w + i] >= 0) continue; put(X, Y, L.shade); } }
  const inner = o.alpha != null && o.alpha < 1 ? (v) => ((v & 0xffffff) | (R(L.alpha * 255) << 24)) >>> 0 : (v) => v;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i, dd = D[k]; if (dd < 0) continue;
    const s = S[k], litSide = s === 1 || s === 3;
    let v;
    if (dd === 0) v = L.ink;
    else if (dd < band) v = big ? (dd === 1 ? (litSide ? L.hiL : L.dk) : dd === 2 ? (litSide ? L.lit : L.mid) : L.mid) : (litSide ? L.lit : L.dk);
    else if (dd === band) v = L.ink;
    else {
      const id = dd - band - 1;
      v = id === 0 && s === 1 ? L.creamL : id === 0 && s === 2 ? L.creamD : big && id === 2 && !o.fill ? L.line : L.cream;
      v = inner(v);
    }
    put(px + i, py + j, v);
  }
  // corner brackets standing proud of the frame + rivets at the edge midpoints
  if (big && o.brackets !== false && w >= 34 && h >= 24) {
    const arm = Math.min(9, (Math.min(w, h) / 3) | 0), th = 3;
    const bracket = (cx, cy, sx, sy) => {
      for (let a = -1; a <= arm; a++) for (let t = -1; t <= th; t++) {
        const inL = (a, t) => a >= 0 && a < arm && t >= 0 && t < th;
        for (const [ax, ay] of [[a, t], [t, a]]) {
          const X = cx + sx * ax, Y = cy + sy * ay, isIn = inL(a, t);
          if (isIn) put(X, Y, (ax === 0 && sx > 0) || (ay === 0 && sy > 0) ? L.hiL : t === th - 1 ? L.dk : L.lit);
        }
      }
      // outline around both arms
      for (let a = -1; a <= arm; a++) for (let t = -1; t <= th; t++) {
        for (const [ax, ay] of [[a, t], [t, a]]) {
          const X = cx + sx * ax, Y = cy + sy * ay;
          const inside = (q, p) => (q >= 0 && q < arm && p >= 0 && p < th) || (p >= 0 && p < arm && q >= 0 && q < th);
          if (!inside(ax, ay) && (inside(ax + 1, ay) || inside(ax - 1, ay) || inside(ax, ay + 1) || inside(ax, ay - 1))) put(X, Y, L.ink);
        }
      }
    };
    bracket(px - 1, py - 1, 1, 1); bracket(px + w, py - 1, -1, 1); bracket(px - 1, py + h, 1, -1); bracket(px + w, py + h, -1, -1);
    const rivet = (x, y) => { put(x, y, L.ink); put(x + 1, y, L.ink); put(x, y + 1, L.ink); put(x + 1, y + 1, L.ink); put(x - 1, y, L.ink); put(x + 2, y + 1, L.ink); put(x, y - 1, L.ink); put(x + 1, y + 2, L.ink); put(x, y, L.hiL); put(x + 1, y + 1, L.dk); put(x + 1, y, L.lit); put(x, y + 1, L.mid); };
    if (w >= 70) { rivet(px + (w >> 1) - 1, py + 1); rivet(px + (w >> 1) - 1, py + h - 3); }
    if (h >= 60) { rivet(px + 1, py + (h >> 1) - 1); rivet(px + w - 3, py + (h >> 1) - 1); }
  }
}
// A panel. o: fill (interior colour instead of cream), paper (cream / a colour), alpha (interior translucency),
// edge (frame colour: tint for highlight / selection), line, shadow, shadowA, r, pill, thin, big, brackets
export function frame(ui, x, y, w, h, o = {}) {
  x = R(x); y = R(y); w = Math.max(3, R(w)); h = Math.max(3, R(h));
  const pad = 4, key = 'F' + w + 'x' + h + '|' + (o.r ?? '') + (o.pill ? 'p' : '') + (o.thin ? 't' : '') + (o.big ? 'b' : '') + '|' + (o.fill || '') + '|' + (o.paper && o.paper !== true ? o.paper : '') + '|' + (o.edge || '') + '|' + (o.alpha ?? 1) + '|' + (o.line || '') + '|' + (o.shadow === false ? 0 : o.shadowA ?? 0.38) + (o.brackets === false ? 'n' : '');
  const S = sprite(key, w + pad * 2, h + pad * 2, (d, W, H) => paintFrame(d, W, H, pad, pad, w, h, o));
  blit(U(ui), S, x - pad, y - pad);
}

// ------------------------------------------------------------------ buttons, plinths, pills
// o: { color (face), state: 0 rest | 1 over | 2 down | 3 disabled, lip, r, active (brass edge), frame ('copper' = a copper rim) }
export function knob(ui, x, y, w, h, o = {}) {
  x = R(x); y = R(y); w = R(w); h = R(h);
  const st = o.state || 0, col = st === 3 ? '#a89a8c' : o.color || T.cream, lip = o.lip ?? (h >= 14 ? 3 : 2), r = o.r ?? (h >= 14 ? 3 : 2), cop = o.frame === 'copper';
  const key = 'K' + w + 'x' + h + '|' + col + '|' + st + '|' + lip + '|' + r + (o.active ? 'A' : '') + (cop ? 'c' : '');
  const S = sprite(key, w + 2, h + 3, (d, W, H) => {
    const put = (X, Y, v) => { if (X >= 0 && Y >= 0 && X < W && Y < H) d[Y * W + X] = v; };
    const down = st === 2, fy = down ? lip - 1 : 0, fh = h - lip;
    const ink = P(T.ink), shade = pa(T.shade, 0.35), base = P(cop ? T.copperD : sh(col, -1.1)), face = P(st === 1 ? mx(col, '#ffffff', 0.18) : col);
    const faceL = P(mx(st === 1 ? mx(col, '#ffffff', 0.18) : col, '#ffffff', 0.45)), faceD = P(mx(col, T.ink, 0.18)), rim = P(o.active ? T.brass : cop ? T.copperL : mx(col, '#ffffff', 0.25));
    const Ib = rowIns(h, r), If = rowIns(fh, r);
    for (let j = 0; j < h; j++) for (let i = Ib[j]; i < w - Ib[j]; i++) put(i + 1, j + 2, shade);                 // shadow
    for (let j = 0; j < h; j++) for (let i = Ib[j]; i < w - Ib[j]; i++) put(i, j, (i === Ib[j] || i === w - 1 - Ib[j] || j === 0 || j === h - 1) ? ink : base);   // base + lip
    for (let j = 0; j < fh; j++) for (let i = If[j]; i < w - If[j]; i++) {
      const edge = i === If[j] || i === w - 1 - If[j] || j === 0 || j === fh - 1, Y = fy + j;
      let v = edge ? ink : face;
      if (!edge) { if (j === 1 || (cop && j === 2)) v = cop && j === 1 ? rim : faceL; else if (i === If[j] + 1 && (!cop || j > 1)) v = cop ? rim : faceL; else if (j === fh - 2) v = faceD; }
      if (!edge && (o.active || cop) && (i === If[j] + 1 || i === w - 2 - If[j] || j === 1 || j === fh - 2)) v = rim;
      put(i, Y, v);
    }
    if (st !== 3 && fh >= 9) { put(If[2] + 2, fy + 2, P('#ffffff')); }
  });
  blit(U(ui), S, x, y);
}
// the wooden stand under an icon button: a dark base, the plank, a lighter top rim
export function plinth(ui, cx, y, w) {
  w = R(w); const x = R(cx - w / 2);
  const S = sprite('PL' + w, w + 2, 9, (d, W) => {
    const put = (X, Y, v) => { if (X >= 0 && Y >= 0 && X < W && Y < 9) d[Y * W + X] = v; };
    const ink = P(T.ink), top = P(T.plinthL), mid = P(T.plinth), base = P(T.plinthD), hi = P(mx(T.plinthL, '#ffffff', 0.35)), shade = pa(T.shade, 0.35);
    for (let i = 3; i < w - 1; i++) put(i, 8, shade);
    for (let j = 0; j < 8; j++) { const ins = j < 3 ? 0 : j - 2; for (let i = ins; i < w - ins; i++) { const e = i === ins || i === w - 1 - ins || j === 0 || j === 7; put(i, j, e ? ink : j === 1 ? hi : j === 2 ? top : j >= 5 ? base : mid); } }
    for (let i = 3; i < w - 3; i += 6) put(i, 4, base);
  });
  blit(U(ui), S, x, y);
}
// a cream pill (value counters): ink outline, light top, shaded bottom
export function pill(ui, x, y, w, h, o = {}) {
  x = R(x); y = R(y); w = R(w); h = R(h);
  frame(ui, x, y, w, h, { pill: true, thin: true, fill: o.fill, edge: o.edge, shadowA: 0.3, brackets: false });
}

// ------------------------------------------------------------------ helpers kept for older callers (now pixel-crisp)
export function insetOf(j, h, r) { return rowIns(h, r)[j] || 0; }
export function rfill(s, x, y, w, h, c, r = 2) { fillShape(U(s), x, y, w, h, c, r); }
export function blendRun(s, x0, x1, y, c, a) { if (a <= 0) return; const ui = U(s); ui.g.fillStyle = rgba(c, a); ui._fs = null; ui.g.fillRect(R(x0), R(y), R(x1) - R(x0) + 1, 1); }
export function blendRect(s, x, y, w, h, c, a) { if (a <= 0 || w <= 0 || h <= 0) return; const ui = U(s); ui.g.fillStyle = rgba(c, Math.min(1, a)); ui._fs = null; ui.g.fillRect(R(x), R(y), R(w), R(h)); }
export function dropShadow(s, x, y, w, h, r = 3, dx = 0, dy = 2, a = 0.4) { const ui = U(s); ui.g.globalAlpha = a; fillShape(ui, x + dx, y + dy, w, h, T.shade, r); ui.g.globalAlpha = 1; }
// stepped bands (pixel art has no gradients): cols are bands top → bottom
export function gradFill(s, x, y, w, h, cols, r = 0, alpha = 1) {
  const ui = U(s), g = ui.g; x = R(x); y = R(y); w = R(w); h = R(h); if (w <= 0 || h <= 0) return;
  const I = rowIns(h, Math.min(r, h / 2)), n = cols.length; g.globalAlpha = alpha;
  for (let j = 0; j < h; j++) { const c = cols[Math.min(n - 1, Math.floor((j / h) * n))]; ui.fill(c).fillRect(x + I[j], y + j, w - I[j] * 2, 1); }
  g.globalAlpha = 1;
}
export function hgradRun(s, x, y, w, cols, alpha = 1) { const ui = U(s), n = cols.length; ui.g.globalAlpha = alpha; for (let i = 0; i < n; i++) ui.fill(cols[i]).fillRect(R(x + (w * i) / n), R(y), Math.ceil(w / n), 1); ui.g.globalAlpha = 1; }
export function nails() {}
export function caps() {}
export function sprig() {}
export function pattern(s, x, y, w, h, c, alpha = 1) { const ui = U(s); ui.g.globalAlpha = alpha * 0.6; const g = ui.fill(c); for (let j = 0; j < h; j += 4) for (let i = ((j / 4) & 1) * 3; i < w; i += 6) g.fillRect(R(x + i), R(y + j), 1, 1); ui.g.globalAlpha = 1; }
export function rope(s, x0, y0, x1, y1) { const ui = U(s); ui.s.line(x0, y0, x1, y1, T.ink); ui.s.line(x0 + 1, y0, x1 + 1, y1, T.rope); }

// ------------------------------------------------------------------ discs, rings, triangles, twinkles, gems
// a shaded pixel ball: ink rim, a lit crescent top-left, a shade bottom-right, a glint
export function ball(s, cx, cy, r, c, o = {}) {
  r = Math.max(1, R(r)); const ui = U(s), key = 'B' + r + c + (o.ink || '') + (o.flat ? 'f' : '');
  const S = sprite(key, 2 * r + 3, 2 * r + 3, (d, W) => {
    const A = discRows(r + 1), B = discRows(r), ink = P(o.ink || T.ink), C = P(c), L = P(mx(c, '#ffffff', 0.4)), Dk = P(mx(c, T.ink, 0.3)), Wt = P('#ffffff');
    for (let j = -r - 1; j <= r + 1; j++) for (let i = -A[j + r + 1]; i <= A[j + r + 1]; i++) d[(j + r + 1) * W + i + r + 1] = ink;
    for (let j = -r; j <= r; j++) for (let i = -B[j + r]; i <= B[j + r]; i++) {
      const l = (i + j) / (r * 1.5); let v = C;
      if (!o.flat) { if (l < -0.5 && Math.hypot(i, j) > r * 0.45) v = L; else if (l > 0.45 && Math.hypot(i, j) > r * 0.55) v = Dk; }
      d[(j + r + 1) * W + i + r + 1] = v;
    }
    if (r >= 3 && !o.flat) { const gx = R(-r * 0.4), gy = R(-r * 0.45); d[(gy + r + 1) * W + gx + r + 1] = Wt; if (r >= 5) d[(gy + r + 1) * W + gx + r + 2] = Wt; }
  });
  blit(ui, S, R(cx) - r - 1, R(cy) - r - 1);
}
export function ringPx(s, cx, cy, r, c, a = 1) { const ui = U(s); ui.g.globalAlpha = a; ui.s.ring(cx, cy, r, r, c); ui.g.globalAlpha = 1; }
export function discA(s, cx, cy, r, c, a) { const ui = U(s); ui.g.globalAlpha = Math.max(0, Math.min(1, a)); fillDisc(ui, cx, cy, r, c); ui.g.globalAlpha = 1; }
export function disc(s, cx, cy, r, c) { fillDisc(U(s), cx, cy, r, c); }
// a round copper badge rim (portrait frames, dials, radar): ink, a copper ring of th px lit on top, ink; o.fill: inner disc
export function woodRing(s, cx, cy, r, o = {}) {
  r = Math.max(2, R(r)); const ui = U(s), th = Math.max(2, R(o.th ?? 3)), Rr = r + th, rc = o.color || T.copper;
  const key = 'W' + r + '|' + th + '|' + rc + '|' + (o.fill || '') + (o.shadow === false ? 'n' : '');
  const S = sprite(key, 2 * Rr + 5, 2 * Rr + 6, (d, W) => {
    const c0 = Rr + 2, A = discRows(Rr + 1), B = discRows(Rr), C2 = discRows(r + 1), F = discRows(r);
    const put = (x, y, v) => { d[(y + c0) * W + x + c0] = v; };
    const ink = P(T.ink), hi = P(mx(rc, '#ffffff', 0.55)), lit = P(mx(rc, '#ffffff', 0.28)), mid = P(rc), dk = P(mx(rc, T.ink, 0.35)), shade = pa(T.shade, 0.35);
    if (o.shadow !== false) for (let j = -Rr - 1; j <= Rr + 1; j++) for (let i = -A[j + Rr + 1]; i <= A[j + Rr + 1]; i++) put(i, j + 2, shade);
    for (let j = -Rr - 1; j <= Rr + 1; j++) for (let i = -A[j + Rr + 1]; i <= A[j + Rr + 1]; i++) put(i, j, ink);
    for (let j = -Rr; j <= Rr; j++) for (let i = -B[j + Rr]; i <= B[j + Rr]; i++) { const dd = Math.hypot(i, j), l = (-i * 0.4 - j) / Math.max(1, dd); put(i, j, dd > Rr - 1 ? (l > 0.3 ? hi : dk) : l > 0.45 ? lit : l < -0.4 ? dk : mid); }
    for (let j = -r - 1; j <= r + 1; j++) for (let i = -C2[j + r + 1]; i <= C2[j + r + 1]; i++) put(i, j, ink);
    if (o.fill) { const fv = P(o.fill); for (let j = -r; j <= r; j++) for (let i = -F[j + r]; i <= F[j + r]; i++) put(i, j, fv); }
    else for (let j = -r; j <= r; j++) for (let i = -F[j + r]; i <= F[j + r]; i++) put(i, j, 0);
  });
  blit(ui, S, R(cx) - Rr - 2, R(cy) - Rr - 2);
}
// clip to a pixel disc (a union of row rects: crisp edges)
export function clipCircle(ui, cx, cy, r, fn) {
  const g = ui.g, A = discRows(Math.max(0, R(r))); cx = R(cx); cy = R(cy); r = R(r);
  g.save(); g.beginPath(); for (let j = -r; j <= r; j++) { const hw = A[j + r]; g.rect(cx - hw, cy + j, hw * 2 + 1, 1); } g.clip();
  try { fn(); } finally { g.restore(); ui._fs = null; ui._font = null; }
}
// triangle cursor with ink outline. dir: 'right' | 'down' | 'left' | 'up'; size = half-height
export function tri(s, x, y, dir, size, c) {
  const ui = U(s); size = Math.max(1, R(size));
  const S = sprite('TR' + dir + size + c, size * 2 + 3, size * 2 + 3, (d, W) => {
    const n = size * 2 + 1, ink = P(T.ink), C = P(c), L = P(mx(c, '#ffffff', 0.45)), Dk = P(mx(c, T.ink, 0.3));
    const inside = (a, b) => a >= 0 && a < n && b >= 0 && b <= size - Math.abs(a - size);
    for (let a = -1; a <= n; a++) for (let b = -1; b <= size + 1; b++) {
      const isIn = inside(a, b), near = !isIn && (inside(a + 1, b) || inside(a - 1, b) || inside(a, b + 1) || inside(a, b - 1));
      if (!isIn && !near) continue;
      const v = !isIn ? ink : a < size - 0 && b <= 1 ? L : a > size ? Dk : C;
      let X, Y; if (dir === 'right') { X = b; Y = a; } else if (dir === 'left') { X = size - b; Y = a; } else if (dir === 'down') { X = a; Y = b; } else { X = a; Y = size - b; }
      X += 1; Y += 1; if (X >= 0 && Y >= 0 && X < W && Y < W) d[Y * W + X] = v;
    }
  });
  blit(ui, S, R(x) - 1, R(y) - 1);
}
// a twinkle: a plus with a white heart; k 0..1 = size phase
export function sparkle(s, x, y, c, k = 1) {
  if (k <= 0.05) return;
  const ui = U(s), g = ui.g, r = k > 0.66 ? 3 : k > 0.33 ? 2 : 1; x = R(x); y = R(y);
  ui.fill(c); g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x, y - r, 1, r * 2 + 1);
  if (r >= 2) { ui.fill(mx(c, '#ffffff', 0.5)); g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
  ui.fill('#ffffff'); g.fillRect(x, y, 1, 1);
}
// faceted diamond gem with ink rim
export function gem(s, cx, cy, c, r = 3) {
  const ui = U(s); r = R(r);
  const S = sprite('G' + r + c, 2 * r + 3, 2 * r + 3, (d, W) => {
    const ink = P(T.ink), C = P(c), L = P(mx(c, '#ffffff', 0.55)), Dk = P(mx(c, T.ink, 0.35)), Wt = P('#ffffff');
    for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) { const dd = Math.abs(i) + Math.abs(j); if (dd > r + 1) continue; d[(j + r + 1) * W + i + r + 1] = dd > r ? ink : j < 0 && i <= 0 ? L : j > 0 && i > 0 ? Dk : C; }
    if (r >= 2) d[(r) * W + r] = Wt;
  });
  blit(ui, S, R(cx) - r - 1, R(cy) - r - 1);
}
export function leaf(s, x, y, ang, len = 5, wid = 2, c = T.leaf) {
  const ui = U(s); x = R(x); y = R(y); const n = R(len);
  for (let i = 0; i <= n; i++) { const t = i / n, wd = R(Math.sin(t * Math.PI) * wid); const X = x + R(Math.cos(ang) * i), Y = y + R(Math.sin(ang) * i); ui.fill(T.ink).fillRect(X - wd - 1, Y - wd - 1, wd * 2 + 3, wd * 2 + 3); }
  for (let i = 0; i <= n; i++) { const t = i / n, wd = R(Math.sin(t * Math.PI) * wid); const X = x + R(Math.cos(ang) * i), Y = y + R(Math.sin(ang) * i); ui.fill(i % 3 ? c : mx(c, '#ffffff', 0.3)).fillRect(X - wd, Y - wd, wd * 2 + 1, wd * 2 + 1); }
}

// ------------------------------------------------------------------ bars
// thin pill bar (h ≤ 7) or thick copper capsule bar (h ≥ 8). colour: a BARS ramp name or a hex
export function ramp(c) { return typeof c === 'string' && BARS[c] ? BARS[c] : [c, mx(c, '#ffffff', 0.45), mx(c, T.ink, 0.35)]; }
export function barShape(ui, x, y, w, h, v, o) {
  x = R(x); y = R(y); w = Math.max(4, R(w)); h = Math.max(2, R(h));
  const g = ui.g, thick = h >= 8, [C, L, D] = ramp(o.color), fw = v > 0 ? Math.max(Math.min(w, 3), R(w * v)) : 0;
  if (thick) {
    // the copper capsule: frame + track + fill + clamps
    frame(ui, x - 3, y - 3, w + 6, h + 6, { pill: true, thin: true, brackets: false, fill: T.track, shadowA: 0.35 });
    const I = rowIns(h, h / 2, 'pill');
    for (let j = 0; j < h; j++) { const a = x + I[j], b = x + Math.min(fw, w - I[j]); if (b > a) ui.fill(j <= 1 ? L : j >= h - 2 ? D : j === 2 ? mx(C, L, 0.5) : C).fillRect(a, y + j, b - a, 1); }
    if (o.trail > v + 0.002) { const tw = R(w * o.trail); for (let j = 0; j < h; j++) { const a = x + Math.max(fw, I[j]), b = x + Math.min(tw, w - I[j]); if (b > a) ui.fill(j <= 1 ? '#fff4e4' : T.coralL).fillRect(a, y + j, b - a, 1); } }
    if (o.ghost > v) { const gw = R(w * Math.min(1, o.ghost)); g.globalAlpha = 0.45; for (let j = 0; j < h; j++) { const a = x + Math.max(fw, I[j]), b = x + Math.min(gw, w - I[j]); if (b > a) ui.fill('#fff4e4').fillRect(a, y + j, b - a, 1); } g.globalAlpha = 1; }
    if (o.seg) for (let i = o.seg; i < fw - 2; i += o.seg) ui.fill(D).fillRect(x + i, y + 2, 1, h - 3);
    if (o.shine !== false && fw > 10) { const ph = ((o.t * 0.5 + (x % 97) / 97) % 1.5) / 1.5, sx = x + R(ph * (w + 20)) - 10; g.globalAlpha = 0.6; for (let j = 1; j < h - 1; j++) { const X = sx + (h - j) / 2 | 0; if (X > x + I[j] && X < x + Math.min(fw, w - I[j]) - 2) ui.fill('#ffffff').fillRect(X, y + j, 2, 1); } g.globalAlpha = 1; }
    if (o.clamps !== false && w >= 40) for (const cx of [x + 6, x + w - 9]) clamp(ui, cx, y - 3, h + 6);
  } else {
    const I = rowIns(h + 2, (h + 2) / 2, 'pill');
    for (let j = 0; j < h + 2; j++) ui.fill(T.ink).fillRect(x - 1 + I[j], y - 1 + j, w + 2 - I[j] * 2, 1);
    const J = rowIns(h, h / 2, 'pill');
    for (let j = 0; j < h; j++) ui.fill(o.back || T.track).fillRect(x + J[j], y + j, w - J[j] * 2, 1);
    if (h >= 3) ui.fill(T.trackL).fillRect(x + J[h - 1] + 1, y + h - 1, w - J[h - 1] * 2 - 2, 1);
    if (o.trail > v + 0.002) { const tw = R(w * o.trail); for (let j = 0; j < h; j++) { const a = x + Math.max(fw, J[j]), b = x + Math.min(tw, w - J[j]); if (b > a) ui.fill(T.coralL).fillRect(a, y + j, b - a, 1); } }
    for (let j = 0; j < h; j++) { const a = x + J[j], b = x + Math.min(fw, w - J[j]); if (b > a) ui.fill(h >= 3 && j === 0 ? L : h >= 4 && j === h - 1 ? D : C).fillRect(a, y + j, b - a, 1); }
    if (fw > 2 && fw < w - 1 && h >= 3) ui.fill(L).fillRect(x + fw - 1, y + 1, 1, h - 2);
    // little copper caps on both ends
    if (o.caps !== false && h >= 3 && w >= 30) for (const cx of [x - 3, x + w]) { ui.fill(T.ink).fillRect(cx, y - 2, 3, h + 4); ui.fill(T.copperL).fillRect(cx + 1, y - 1, 1, h + 2); ui.fill(T.copperH).fillRect(cx + 1, y - 1, 1, 1); }
  }
}
// a brass clamp band across a thick bar
export function clamp(ui, x, y, h) {
  const S = sprite('CL' + h, 4, h, (d, W) => { const ink = P(T.ink), b = P(T.brass), l = P('#fff0a0'), dk = P(T.brassD); for (let j = 0; j < h; j++) { const e = j === 0 || j === h - 1; d[j * W] = ink; d[j * W + 3] = ink; d[j * W + 1] = e ? ink : j === 1 ? l : l; d[j * W + 2] = e ? ink : j >= h - 2 ? dk : b; } });
  blit(ui, S, x, y);
}

// ------------------------------------------------------------------ full-screen backdrop for modal screens
// a cosy room in pixel art: striped wallpaper with little diamonds, a picture rail, a wooden wainscot with
// planks and a chunky top rail, warm light from above, dust motes drifting
let wallCv = null, plankCv = null;
function wallTile() {
  if (wallCv) return wallCv;
  wallCv = makeCanvas(16, 16); const c = wallCv.getContext('2d'), p = (col, x, y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  p('#e6d2b0', 0, 0, 16, 16); p('#dcc39e', 8, 0, 8, 16); p('#efdfc2', 0, 0, 1, 16); p('#cfb48e', 15, 0, 1, 16);
  // a diamond in the dark stripe
  p('#c8a27c', 11, 6, 2, 1); p('#c8a27c', 10, 7, 4, 2); p('#c8a27c', 11, 9, 2, 1); p('#e8c49c', 11, 7, 1, 1);
  p('#d8bc96', 3, 12, 1, 1); p('#d8bc96', 4, 3, 1, 1);
  return wallCv;
}
function plankTile() {
  if (plankCv) return plankCv;
  plankCv = makeCanvas(32, 24); const c = plankCv.getContext('2d'), p = (col, x, y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  p('#9a5a34', 0, 0, 32, 24);
  for (let i = 0; i < 32; i += 8) { p('#6b3a28', i, 0, 1, 24); p('#b8744a', i + 1, 0, 1, 24); p(i % 16 ? '#a8643a' : '#925430', i + 2, 0, 6, 24); }
  for (let j = 2; j < 24; j += 5) p('#8a4e2c', (j * 7) % 32 + 3, j, 3, 1);
  return plankCv;
}
export function backdrop(ui, t, o = {}) {
  const g = ui.g, W = Math.ceil(ui.w), H = Math.ceil(ui.h), floor = R(H * 0.74);
  g.fillStyle = g.createPattern(wallTile(), 'repeat'); g.fillRect(0, 0, W, floor); ui._fs = null;
  // the picture rail
  ui.rect(0, 3, W, 1, T.copperD); ui.rect(0, 4, W, 2, T.copperL); ui.rect(0, 6, W, 1, T.copperD); ui.rect(0, 7, W, 1, '#cfb48e');
  // the wainscot
  g.save(); g.translate(0, floor); g.fillStyle = g.createPattern(plankTile(), 'repeat'); g.fillRect(0, 0, W, H - floor); g.restore(); ui._fs = null;
  ui.rect(0, floor - 4, W, 1, T.ink); ui.rect(0, floor - 3, W, 1, T.copperH); ui.rect(0, floor - 2, W, 3, T.copperL); ui.rect(0, floor + 1, W, 1, T.copper); ui.rect(0, floor + 2, W, 1, T.ink); ui.rect(0, floor + 3, W, 2, 'rgba(26,15,12,0.35)');
  // warm light from above: stepped bands of soft dark toward the edges (no gradients)
  g.globalAlpha = 0.07; for (let k = 1; k <= 4; k++) { ui.rect(0, 0, W, 6 * k, T.shade); ui.rect(0, 0, 8 * k, H, T.shade); ui.rect(W - 8 * k, 0, 8 * k, H, T.shade); } g.globalAlpha = 1;
  // dust motes drifting in the light
  for (let i = 0; i < 24; i++) { const x = R(((i * 97.3) % W) + Math.sin(t * 0.5 + i) * 6), y = R(H - ((t * (5 + (i % 4) * 2) + i * 37) % H)); if (((t * 2 + i) | 0) % 3) ui.rect(x, y, 1, 1, i % 3 ? '#fff4d8' : '#ffe8a0'); }
}
export function woodTex() { return null; }
export function paperTex() { return null; }
void css;
