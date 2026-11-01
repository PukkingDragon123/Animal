// Pixel-art shapes for the UI kit, painted at the screen's PHYSICAL resolution (ui.k px per unit) so they are
// detailed rather than chunky — and still hard-edged: 1-px near-black outlines, stepped multi-tone ramps,
// dithered transitions, hand-placed highlights. Painted once per size into sprites (gfx.sprite), blitted snapped.
//  • frame(): a cream parchment card in a chunky copper frame — outline, a bevelled copper band (lit top-left,
//    shaded bottom-right), an inner outline, a thin pink-brown line inside the paper, paper grain, corner
//    brackets standing proud of the frame, rivets at the edge midpoints and a soft drop shadow
//  • knob(): a pressable button face on a darker lip · plinth(): the wooden stand under icon buttons · pill()
//  • bars: thin pill bars with copper end caps, thick capsule bars in a copper frame with brass clamps
//  • ball / woodRing / tri / sparkle / gem: shaded discs, copper rings, outlined triangles, twinkles, gems
// Functions take (ui, …) or (s, …) where s is the ui's canvas surface (s.ui); coordinates are in units.
import { T, BARS, mx, sh, pa } from './theme.js';
import { css, rgba, sprite, blit, blitP, PX, PY, rowIns, fillShape, fillDisc, discRows, makeCanvas } from './gfx.js';
import { P } from '../../surface.js';

const U = (s) => (s && s.ui) || s;
const R = Math.round;
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bay = (x, y) => BAY[(y & 3) * 4 + (x & 3)];
const hsh = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
// a sprite of physical size placed at unit coords (snapped; scaled only inside ui.push)
function put(ui, cv, x, y, padP = 0) {
  if (ui.ta === ui.k && ui.td === ui.k) blitP(ui, cv, PX(ui, x) - padP, PY(ui, y) - padP);
  else blit(ui, cv, x - padP / ui.k, y - padP / ui.k, cv.width / ui.k, cv.height / ui.k);
}

// ------------------------------------------------------------------ the frame painter (physical pixels)
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
function look(o) {
  const edge = o.edge || null, cop = edge || T.copper, paper = o.fill || (o.paper && o.paper !== true ? o.paper : T.cream);
  return {
    ink: P(o.line || T.ink), hi: P(edge ? mx(edge, '#ffffff', 0.6) : T.copperH), lit: P(edge ? mx(edge, '#ffffff', 0.32) : T.copperL), mid: P(cop), dk: P(edge ? mx(edge, T.ink, 0.3) : T.copperD), dk2: P(edge ? mx(edge, T.ink, 0.5) : mx(T.copperD, T.ink, 0.35)),
    cream: P(paper), creamL: P(o.fill ? mx(paper, '#ffffff', 0.2) : T.creamL), creamD: P(o.fill ? mx(paper, T.ink, 0.18) : T.creamD), creamDD: P(o.fill ? mx(paper, T.ink, 0.3) : mx(T.creamD, T.copperD, 0.25)),
    line: P(o.fill ? mx(paper, '#ffffff', 0.12) : T.creamLine), grain: P(o.fill ? mx(paper, T.ink, 0.07) : mx(T.cream, T.creamD, 0.55)),
    shade: pa(T.shade, o.shadowA ?? 0.36), alpha: o.alpha ?? 1, flat: !!o.fill,
  };
}
// paint a panel into a buffer (all sizes in physical px). k: px per unit (sets the band widths)
export function paintFrame(d, W, H, px, py, w, h, o, k) {
  const big = !o.thin && (o.big || (w >= 40 * k && h >= 26 * k)), r = R((o.r ?? (big ? 4 : h >= 12 * k ? 3 : 2)) * k), kind = o.pill ? 'pill' : 'round';
  const L = look(o), { D, S } = depthMap(w, h, o.pill ? h / 2 : r, kind);
  const band = big ? Math.max(3, R(2.6 * k)) : Math.max(2, R(1.3 * k));
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) d[y * W + x] = v; };
  if (o.shadow !== false) { const sy = Math.max(1, R((big ? 1.4 : 0.9) * k)); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (D[j * w + i] >= 0) { const Y = j + sy; if (Y < h && D[Y * w + i] >= 0) continue; set(px + i, py + Y, L.shade); } }
  const A = R(L.alpha * 255), inner = A < 255 ? (v) => ((v & 0xffffff) | (A << 24)) >>> 0 : (v) => v;
  const lineAt = band + 1 + Math.max(2, R(1.6 * k));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = j * w + i, dd = D[q]; if (dd < 0) continue;
    const s = S[q], litSide = s === 1 || s === 3, X = px + i, Y = py + j;
    let v;
    if (dd === 0) v = L.ink;
    else if (dd < band) {
      // the copper band: a rim catch-light, a bevel ramp, a darker inner lip
      const t = dd / band;
      if (dd === 1) v = litSide ? L.hi : L.dk;
      else if (dd === band - 1) v = litSide ? L.mid : L.dk2;
      else v = litSide ? (t < 0.5 ? L.lit : (bay(X, Y) < 0.5 ? L.lit : L.mid)) : (t < 0.5 ? L.mid : (bay(X, Y) < 0.5 ? L.mid : L.dk));
    } else if (dd === band) v = L.ink;
    else {
      const id = dd - band - 1;
      if (id === 0) v = s === 1 || s === 3 ? L.creamDD : L.creamL;          // the paper's inner shadow under the lip, a light edge opposite
      else if (id === 1 && (s === 1 || s === 3)) v = L.creamD;
      else if (big && !L.flat && dd === lineAt) v = L.line;
      else { v = L.cream; const n = hsh(X, Y); if (!L.flat && n < 0.035) v = L.grain; else if (!L.flat && n > 0.985) v = L.creamL; }
      v = inner(v);
    }
    set(X, Y, v);
  }
  // corner brackets that stand proud of the frame + rivets at the edge midpoints
  if (big && o.brackets !== false && w >= 34 * k && h >= 24 * k) {
    const arm = R(Math.min(9 * k, Math.min(w, h) / 3)), th = Math.max(3, R(1.6 * k)), out = Math.max(1, R(0.5 * k));
    const bracket = (cx, cy, sx, sy) => {
      // the L of two bars, from the corner (cx, cy) inward by arm, th thick, standing out by `out`
      const inL = (a, b) => (a >= -out && a < arm && b >= -out && b < th) || (b >= -out && b < arm && a >= -out && a < th);
      for (let b = -out - 1; b <= arm; b++) for (let a = -out - 1; a <= arm; a++) {
        const X = cx + sx * a, Y = cy + sy * b;
        if (inL(a, b)) { const edgeLit = (sx > 0 ? a === -out : false) || (sy > 0 ? b === -out : false), edgeDk = (sx < 0 ? a === -out : false) || (sy < 0 ? b === -out : false); set(X, Y, edgeLit ? L.hi : edgeDk ? L.dk : (Math.min(a, b) === th - 1 ? L.dk : L.lit)); }
        else if (inL(a + 1, b) || inL(a - 1, b) || inL(a, b + 1) || inL(a, b - 1)) set(X, Y, L.ink);
      }
    };
    bracket(px, py, 1, 1); bracket(px + w - 1, py, -1, 1); bracket(px, py + h - 1, 1, -1); bracket(px + w - 1, py + h - 1, -1, -1);
    const rr = Math.max(1, R(0.9 * k)), Rw = discRows(rr + 1), Ri = discRows(rr);
    const rivet = (cx, cy) => { for (let j = -rr - 1; j <= rr + 1; j++) for (let i = -Rw[j + rr + 1]; i <= Rw[j + rr + 1]; i++) set(cx + i, cy + j, L.ink); for (let j = -rr; j <= rr; j++) for (let i = -Ri[j + rr]; i <= Ri[j + rr]; i++) set(cx + i, cy + j, i + j < -rr * 0.5 ? L.hi : i + j > rr * 0.5 ? L.dk : L.lit); };
    const bm = R(band / 2);
    if (w >= 70 * k) { rivet(px + R(w / 2), py + bm); rivet(px + R(w / 2), py + h - 1 - bm); }
    if (h >= 60 * k) { rivet(px + bm, py + R(h / 2)); rivet(px + w - 1 - bm, py + R(h / 2)); }
  }
}
// A panel. o: fill (interior colour instead of cream), paper, alpha (interior translucency), edge (frame tint),
// line, shadow, shadowA, r, pill, thin, big, brackets
export function frame(ui, x, y, w, h, o = {}) {
  ui = U(ui); const k = ui.k, X = PX(ui, x), Y = PY(ui, y), Wp = Math.max(4, PX(ui, x + w) - X), Hp = Math.max(4, PY(ui, y + h) - Y);
  const pad = R(2.5 * k) + 2;
  const key = 'F' + Wp + 'x' + Hp + '|' + k + '|' + (o.r ?? '') + (o.pill ? 'p' : '') + (o.thin ? 't' : '') + (o.big ? 'b' : '') + '|' + (o.fill || '') + '|' + (o.paper && o.paper !== true ? o.paper : '') + '|' + (o.edge || '') + '|' + (o.alpha ?? 1) + '|' + (o.line || '') + '|' + (o.shadow === false ? 0 : o.shadowA ?? 0.36) + (o.brackets === false ? 'n' : '');
  const cv = sprite(key, Wp + pad * 2, Hp + pad * 2, (d, W, H) => paintFrame(d, W, H, pad, pad, Wp, Hp, o, k));
  if (ui.ta === ui.k && ui.td === ui.k) blitP(ui, cv, X - pad, Y - pad);
  else blit(ui, cv, x - pad / k, y - pad / k, (Wp + pad * 2) / k, (Hp + pad * 2) / k);
}

// ------------------------------------------------------------------ buttons, plinths, pills
// o: { color (face), state: 0 rest | 1 over | 2 down | 3 disabled, lip, r, active (brass rim), frame ('copper') }
export function knob(ui, x, y, w, h, o = {}) {
  ui = U(ui); const k = ui.k, Wp = PX(ui, x + w) - PX(ui, x), Hp = PY(ui, y + h) - PY(ui, y);
  const st = o.state || 0, col = st === 3 ? '#a89a8c' : o.color || T.cream, lip = Math.max(2, R((o.lip ?? (h >= 14 ? 3 : 2)) * k)), r = R((o.r ?? (h >= 14 ? 3 : 2)) * k), cop = o.frame === 'copper';
  const key = 'K' + Wp + 'x' + Hp + '|' + col + '|' + st + '|' + lip + '|' + r + (o.active ? 'A' : '') + (cop ? 'c' : '');
  const pad = R(k) + 1;
  const cv = sprite(key, Wp + pad * 2, Hp + pad * 2, (d, W, H) => {
    const set = (X, Y, v) => { X += pad; Y += pad; if (X >= 0 && Y >= 0 && X < W && Y < H) d[Y * W + X] = v; };
    const down = st === 2, fy = down ? lip - Math.max(1, R(k * 0.6)) : 0, fh = Hp - lip;
    const face = st === 1 ? mx(col, '#ffffff', 0.16) : col;
    const C = { ink: P(T.ink), shade: pa(T.shade, 0.32), base: P(cop ? T.copperD : sh(col, -1.15)), baseL: P(cop ? T.copper : sh(col, -0.7)), f0: P(face), fL: P(mx(face, '#ffffff', 0.38)), fH: P(mx(face, '#ffffff', 0.7)), fD: P(mx(face, T.ink, 0.14)), fDD: P(mx(face, T.ink, 0.28)), rim: P(o.active ? T.brass : cop ? T.copperL : mx(face, '#ffffff', 0.25)), rimD: P(o.active ? T.brassD : cop ? T.copperD : mx(face, T.ink, 0.3)) };
    const Ib = rowIns(Hp, r), If = rowIns(fh, r), band = cop || o.active ? Math.max(2, R(k)) : 0;
    for (let j = 0; j < Hp; j++) for (let i = Ib[j]; i < Wp - Ib[j]; i++) set(i, j + Math.max(1, R(k * 0.7)), C.shade);
    for (let j = 0; j < Hp; j++) for (let i = Ib[j]; i < Wp - Ib[j]; i++) set(i, j, (i === Ib[j] || i === Wp - 1 - Ib[j] || j === 0 || j === Hp - 1) ? C.ink : j < fh ? C.base : (j === fh + 1 ? C.baseL : C.base));
    for (let j = 0; j < fh; j++) for (let i = If[j]; i < Wp - If[j]; i++) {
      const Y = fy + j, edge = i === If[j] || i === Wp - 1 - If[j] || j === 0 || j === fh - 1;
      if (edge) { set(i, Y, C.ink); continue; }
      const dl = Math.min(i - If[j], j), dr = Math.min(Wp - 1 - If[j] - i, fh - 1 - j);
      let v = C.f0;
      if (band && Math.min(dl, dr) <= band) v = dl <= dr ? C.rim : C.rimD;
      else if (j <= band + 1) v = j === band + 1 ? C.fH : C.fL;
      else if (j < band + 1 + R(fh * 0.28) && bay(i, j) < 0.5) v = C.fL;
      else if (j >= fh - 2) v = C.fDD; else if (j >= fh - 1 - R(fh * 0.22) && bay(i, j) < 0.5) v = C.fD;
      set(i, Y, v);
    }
    if (st !== 3 && fh >= 9 * k * 0.5) { const gx = If[2] + band + 2, gy = fy + band + 2; set(gx, gy, P('#ffffff')); set(gx + 1, gy, P('#ffffff')); set(gx, gy + 1, P('#ffffff')); }
  });
  put(ui, cv, x, y, pad);
}
// the wooden stand under an icon button: a lit top plank, a grained front, a dark base (cx: centre, y: top, w: width, units)
export function plinth(ui, cx, y, w) {
  ui = U(ui); const k = ui.k, Wp = R(w * k), Hp = R(9 * k), x = cx - w / 2;
  const cv = sprite('PL' + Wp + '|' + k, Wp + 4, Hp + R(k) + 4, (d, W) => {
    const set = (X, Y, v) => { X += 2; Y += 2; if (X >= 0 && Y >= 0 && X < W && Y < d.length / W) d[Y * W + X] = v; };
    const ink = P(T.ink), hi = P(mx(T.plinthL, '#ffffff', 0.35)), top = P(T.plinthL), topD = P(mx(T.plinthL, T.plinth, 0.5)), mid = P(T.plinth), grain = P(mx(T.plinth, T.plinthD, 0.55)), base = P(T.plinthD), baseD = P(mx(T.plinthD, T.ink, 0.35)), shade = pa(T.shade, 0.35);
    const topH = R(3.2 * k), faceH = R(3 * k);
    for (let i = R(2 * k); i < Wp - 1; i++) for (let j = 0; j < R(k); j++) set(i, Hp + j, shade);
    for (let j = 0; j < Hp; j++) {
      const ins = j < topH ? 0 : j < topH + faceH ? 0 : Math.min(R(2 * k), j - topH - faceH + 1);
      for (let i = ins; i < Wp - ins; i++) {
        const e = i === ins || i === Wp - 1 - ins || j === 0 || j === Hp - 1 || j === topH;
        let v = e ? ink : j === 1 ? hi : j < topH ? (j < topH - 1 && bay(i, j) < 0.6 ? top : topD) : j < topH + faceH ? (((j - topH) % 3 === 1 && hsh(i >> 2, j) < 0.6) ? grain : mid) : (j === topH + faceH ? baseD : base);
        if (!e && j < topH && i % R(6 * k) === 0) v = topD;
        set(i, j, v);
      }
    }
  });
  put(ui, cv, x, y, 2);
}
// a cream pill (value counters)
export function pill(ui, x, y, w, h, o = {}) { frame(ui, x, y, w, h, { pill: true, thin: true, fill: o.fill, edge: o.edge, shadowA: 0.3, brackets: false }); }

// ------------------------------------------------------------------ helpers kept for older callers
export function insetOf(j, h, r) { return rowIns(h, r)[j] || 0; }
export function rfill(s, x, y, w, h, c, r = 2) { fillShape(U(s), x, y, w, h, c, r); }
export function blendRun(s, x0, x1, y, c, a) { if (a <= 0) return; const ui = U(s); ui.g.globalAlpha = a; ui.rect(x0, y, x1 - x0 + 1, 1, c); ui.g.globalAlpha = 1; }
export function blendRect(s, x, y, w, h, c, a) { if (a <= 0 || w <= 0 || h <= 0) return; const ui = U(s); ui.g.globalAlpha = Math.min(1, a); ui.rect(x, y, w, h, c); ui.g.globalAlpha = 1; }
export function dropShadow(s, x, y, w, h, r = 3, dx = 0, dy = 2, a = 0.4) { const ui = U(s); ui.g.globalAlpha = a; fillShape(ui, x + dx, y + dy, w, h, T.shade, r); ui.g.globalAlpha = 1; }
export function gradFill(s, x, y, w, h, cols, r = 0, alpha = 1) { const ui = U(s), n = cols.length; ui.g.globalAlpha = alpha; for (let i = 0; i < n; i++) ui.rect(x, y + (h * i) / n, w, h / n + 0.01, cols[i]); ui.g.globalAlpha = 1; void r; }
export function hgradRun(s, x, y, w, cols, alpha = 1) { const ui = U(s), n = cols.length; ui.g.globalAlpha = alpha; for (let i = 0; i < n; i++) ui.rect(x + (w * i) / n, y, w / n + 0.01, 1, cols[i]); ui.g.globalAlpha = 1; }
export function nails() {}
export function caps() {}
export function sprig() {}
export function pattern(s, x, y, w, h, c, alpha = 1) { const ui = U(s); ui.g.globalAlpha = alpha * 0.6; for (let j = 0; j < h; j += 4) for (let i = ((j / 4) & 1) * 3; i < w; i += 6) ui.rect(x + i, y + j, 1, 1, c); ui.g.globalAlpha = 1; }
export function rope(s, x0, y0, x1, y1) { const ui = U(s); ui.s.line(x0, y0, x1, y1, T.ink); ui.s.line(x0 + 1, y0, x1 + 1, y1, T.rope); }

// ------------------------------------------------------------------ discs, rings, triangles, twinkles, gems
// a shaded bead — a SQUARE bevelled tile (no circles anywhere): outline, notched corners, a lit top-left
// bevel, a shaded bottom-right bevel, dithered between, a glint (cx, cy centre, r half-size in units)
export function ball(s, cx, cy, r, c, o = {}) {
  const ui = U(s), k = ui.k, Rp = Math.max(2, R(r * k)), key = 'B' + Rp + c + (o.ink || '') + (o.flat ? 'f' : '');
  const cv = sprite(key, 2 * Rp + 5, 2 * Rp + 5, (d, W) => {
    const n = 2 * Rp + 3, c0 = 1, ink = P(o.ink || T.ink), notch = Math.max(1, R(Rp * 0.35)), bev = Math.max(1, R(Rp * 0.28));
    const tones = [P(mx(c, T.ink, 0.42)), P(mx(c, T.ink, 0.2)), P(c), P(mx(c, '#ffffff', 0.3)), P(mx(c, '#ffffff', 0.62))], Wt = P('#ffffff');
    const I = rowIns(n, notch);
    for (let j = 0; j < n; j++) for (let i = I[j]; i < n - I[j]; i++) {
      const edge = i === I[j] || i === n - 1 - I[j] || j === 0 || j === n - 1;
      let v = ink;
      if (!edge) { const dl = Math.min(i - I[j], j), dr = Math.min(n - 1 - I[j] - i, n - 1 - j); v = o.flat ? tones[2] : dl <= bev && dl <= dr ? (dl === 1 ? tones[4] : tones[3]) : dr <= bev ? (dr === 1 ? tones[0] : tones[1]) : (bay(i, j) < 0.25 && j < n / 2 ? tones[3] : tones[2]); }
      d[(j + c0) * W + i + c0] = v;
    }
    if (!o.flat && Rp >= 3) { const gx = bev + 2, gy = bev + 2; d[(gy + c0) * W + gx + c0] = Wt; d[(gy + c0) * W + gx + 1 + c0] = Wt; d[(gy + 1 + c0) * W + gx + c0] = Wt; }
  });
  put(ui, cv, cx, cy, Rp + 2);
}
// a square outline (was a ring)
export function ringPx(s, cx, cy, r, c, a = 1) { const ui = U(s), t = 1 / ui.k * Math.max(1, R(ui.k * 0.6)); ui.g.globalAlpha = a; ui.rect(cx - r, cy - r, 2 * r, t, c); ui.rect(cx - r, cy + r - t, 2 * r, t, c); ui.rect(cx - r, cy - r, t, 2 * r, c); ui.rect(cx + r - t, cy - r, t, 2 * r, c); ui.g.globalAlpha = 1; }
// filled squares with notched corners (were discs)
export function discA(s, cx, cy, r, c, a) { const ui = U(s); ui.g.globalAlpha = Math.max(0, Math.min(1, a)); fillShape(ui, cx - r, cy - r, 2 * r, 2 * r, c, r * 0.35); ui.g.globalAlpha = 1; }
export function disc(s, cx, cy, r, c) { fillShape(U(s), cx - r, cy - r, 2 * r, 2 * r, c, r * 0.35); }
// a SQUARE copper frame with notched corners (portrait slots, medals, badges, the lens): outline, a bevelled
// copper band of th units (lit top-left), an inner outline; o.fill: the inside (else left empty). (cx, cy) centre,
// r: the inner half-size in units
export function woodRing(s, cx, cy, r, o = {}) {
  const ui = U(s), k = ui.k, rp = Math.max(2, R(r * k)), th = Math.max(2, R((o.th ?? 3) * k)), Rr = rp + th, rc = o.color || T.copper;
  const key = 'W' + rp + '|' + th + '|' + rc + '|' + (o.fill || '') + (o.shadow === false ? 'n' : '');
  const n = 2 * Rr + 3, padP = 3;
  const cv = sprite(key, n + padP * 2, n + padP * 2 + 2, (d, W) => {
    const set = (x, y, v) => { x += padP; y += padP; if (x >= 0 && y >= 0 && x < W && y < d.length / W) d[y * W + x] = v; };
    const ink = P(T.ink), hi = P(mx(rc, '#ffffff', 0.6)), lit = P(mx(rc, '#ffffff', 0.3)), mid = P(rc), dk = P(mx(rc, T.ink, 0.3)), dk2 = P(mx(rc, T.ink, 0.5)), shade = pa(T.shade, 0.35);
    const notch = Math.max(2, R(th * 0.9)), I = rowIns(n, notch), inner0 = th + 1, inner1 = n - 1 - th - 1;
    if (o.shadow !== false) { const sy = Math.max(1, R(k)); for (let j = 0; j < n; j++) for (let i = I[j]; i < n - I[j]; i++) set(i, j + sy, shade); }
    for (let j = 0; j < n; j++) for (let i = I[j]; i < n - I[j]; i++) {
      const dl = Math.min(i - I[j], j), dr = Math.min(n - 1 - I[j] - i, n - 1 - j), dd = Math.min(dl, dr), lit1 = dl <= dr;
      let v;
      if (dd === 0) v = ink;
      else if (i >= inner0 && i <= inner1 && j >= inner0 && j <= inner1) v = (i === inner0 || i === inner1 || j === inner0 || j === inner1) ? ink : o.fill ? (((i === inner0 + 1 || j === inner0 + 1)) ? P(mx(o.fill, T.ink, 0.22)) : P(o.fill)) : 0;
      else v = dd === 1 ? (lit1 ? hi : dk2) : dd >= th - 1 ? (lit1 ? mid : dk2) : lit1 ? (bay(i, j) < 0.6 ? lit : mid) : (bay(i, j) < 0.6 ? dk : mid);
      set(i, j, v);
    }
  });
  put(ui, cv, cx, cy, padP + Rr + 1);
}
// clip to a square (was a disc)
export function clipCircle(ui, cx, cy, r, fn) { ui.clip(cx - r, cy - r, 2 * r, 2 * r, fn); }
// a triangle cursor with an outline. dir: 'right' | 'down' | 'left' | 'up'; size = half-height (units)
export function tri(s, x, y, dir, size, c) {
  const ui = U(s), k = ui.k, sz = Math.max(2, R(size * k));
  const cv = sprite('TR' + dir + sz + c, sz * 2 + 5, sz * 2 + 5, (d, W) => {
    const n = sz * 2 + 1, ink = P(T.ink), C = P(c), L = P(mx(c, '#ffffff', 0.45)), Dk = P(mx(c, T.ink, 0.32));
    const inside = (a, b) => a >= 0 && a < n && b >= 0 && b <= sz - Math.abs(a - sz);
    for (let a = -1; a <= n; a++) for (let b = -1; b <= sz + 1; b++) {
      const isIn = inside(a, b), near = !isIn && (inside(a + 1, b) || inside(a - 1, b) || inside(a, b + 1) || inside(a, b - 1));
      if (!isIn && !near) continue;
      const v = !isIn ? ink : (b <= 1 || a < sz * 0.6) && a <= sz ? L : a > sz + 1 ? Dk : C;
      let X, Y; if (dir === 'right') { X = b; Y = a; } else if (dir === 'left') { X = sz - b; Y = a; } else if (dir === 'down') { X = a; Y = b; } else { X = a; Y = sz - b; }
      X += 2; Y += 2; if (X >= 0 && Y >= 0 && X < W && Y < W) d[Y * W + X] = v;
    }
  });
  put(ui, cv, x, y, 2);
}
// a twinkle: a four-point star with a white heart; k 0..1 = size phase
export function sparkle(s, x, y, c, kk = 1) {
  if (kk <= 0.05) return;
  const ui = U(s), k = ui.k, Rp = Math.max(1, R((kk > 0.66 ? 3 : kk > 0.33 ? 2 : 1) * k));
  const cv = sprite('SP' + Rp + c, Rp * 2 + 3, Rp * 2 + 3, (d, W) => {
    const C = P(c), L = P(mx(c, '#ffffff', 0.55)), Wt = P('#ffffff'), c0 = Rp + 1;
    for (let i = -Rp; i <= Rp; i++) { const a = Math.abs(i), wd = Math.max(0, R((1 - a / Rp) * Rp * 0.28)); for (let q = -wd; q <= wd; q++) { d[(c0 + q) * W + c0 + i] = a < Rp * 0.35 ? L : C; d[(c0 + i) * W + c0 + q] = a < Rp * 0.35 ? L : C; } }
    d[c0 * W + c0] = Wt; if (Rp >= 3) { d[c0 * W + c0 + 1] = Wt; d[c0 * W + c0 - 1] = Wt; d[(c0 + 1) * W + c0] = Wt; d[(c0 - 1) * W + c0] = Wt; }
  });
  put(ui, cv, x, y, Rp + 1);
}
// a faceted gem with an outline (r in units)
export function gem(s, cx, cy, c, r = 3) {
  const ui = U(s), k = ui.k, Rp = Math.max(2, R(r * k));
  const cv = sprite('G' + Rp + c, 2 * Rp + 5, 2 * Rp + 5, (d, W) => {
    const ink = P(T.ink), C = P(c), L = P(mx(c, '#ffffff', 0.55)), H = P(mx(c, '#ffffff', 0.8)), Dk = P(mx(c, T.ink, 0.35)), D2 = P(mx(c, T.ink, 0.18)), c0 = Rp + 2;
    for (let j = -Rp - 1; j <= Rp + 1; j++) for (let i = -Rp - 1; i <= Rp + 1; i++) {
      const dd = Math.abs(i) + Math.abs(j); if (dd > Rp + 1) continue;
      d[(j + c0) * W + i + c0] = dd > Rp ? ink : j < 0 && i <= 0 ? (dd > Rp - 2 ? H : L) : j < 0 ? C : i <= 0 ? D2 : Dk;
    }
  });
  put(ui, cv, cx, cy, Rp + 2);
}
export function leaf(s, x, y, ang, len = 5, wid = 2, c = T.leaf) { const ui = U(s); for (let i = 0; i <= len; i++) { const t = i / len, wd = Math.sin(t * Math.PI) * wid; fillDisc(ui, x + Math.cos(ang) * i, y + Math.sin(ang) * i, wd, c); } }

// ------------------------------------------------------------------ bars (drawn live in physical pixels)
export function ramp(c) { return typeof c === 'string' && BARS[c] ? BARS[c] : [c, mx(c, '#ffffff', 0.45), mx(c, T.ink, 0.35)]; }
export function barShape(ui, x, y, w, h, v, o) {
  ui = U(ui); const k = ui.k, g = ui.g, thick = h >= 8, [C, L, D] = ramp(o.color);
  const X = PX(ui, x), Y = PY(ui, y), Wp = Math.max(6, PX(ui, x + w) - X), Hp = Math.max(3, PY(ui, y + h) - Y), fw = v > 0 ? Math.max(Math.min(Wp, R(Hp * 0.8)), R(Wp * v)) : 0;
  const L2 = mx(L, '#ffffff', 0.4), C2 = mx(C, L, 0.45), D2 = mx(C, D, 0.5);
  const tone = (j) => (j === 0 ? L2 : j < Math.max(2, R(Hp * 0.28)) ? L : j < Math.max(3, R(Hp * 0.45)) ? C2 : j >= Hp - 1 ? D : j >= Hp - Math.max(2, R(Hp * 0.25)) ? D2 : C);
  if (thick) frame(ui, x - 3, y - 3, w + 6, h + 6, { pill: true, thin: true, brackets: false, fill: T.track, shadowA: 0.35 });
  g.setTransform(1, 0, 0, 1, 0, 0);
  const I = rowIns(Hp, Hp / 2, 'pill');
  if (!thick) {
    const O = rowIns(Hp + 2, (Hp + 2) / 2, 'pill');
    for (let j = 0; j < Hp + 2; j++) ui.fill(T.ink).fillRect(X - 1 + O[j], Y - 1 + j, Wp + 2 - O[j] * 2, 1);
  }
  for (let j = 0; j < Hp; j++) ui.fill(j === Hp - 1 ? T.trackL : j === 0 ? mx(T.track, T.ink, 0.4) : (o.back || T.track)).fillRect(X + I[j], Y + j, Wp - I[j] * 2, 1);
  if (o.trail > v + 0.002) { const tw = R(Wp * o.trail); for (let j = 0; j < Hp; j++) { const a = X + Math.max(fw, I[j]), b = X + Math.min(tw, Wp - I[j]); if (b > a) ui.fill(j < Hp * 0.35 ? '#fff4e4' : T.coralL).fillRect(a, Y + j, b - a, 1); } }
  if (o.ghost > v) { const gw = R(Wp * Math.min(1, o.ghost)); g.globalAlpha = 0.45; for (let j = 0; j < Hp; j++) { const a = X + Math.max(fw, I[j]), b = X + Math.min(gw, Wp - I[j]); if (b > a) ui.fill('#fff4e4').fillRect(a, Y + j, b - a, 1); } g.globalAlpha = 1; }
  for (let j = 0; j < Hp; j++) { const a = X + I[j], b = X + Math.min(fw, Wp - I[j]); if (b > a) ui.fill(tone(j)).fillRect(a, Y + j, b - a, 1); }
  if (fw > 3 && fw < Wp - 2) ui.fill(L2).fillRect(X + fw - 1, Y + 1, 1, Hp - 2);
  if (o.seg) { const sp = R(o.seg * k); for (let i = sp; i < fw - 2; i += sp) ui.fill(D).fillRect(X + i, Y + 2, 1, Hp - 3); }
  if (o.shine !== false && fw > 10 * k) { const ph = ((o.t * 0.5 + (x % 97) / 97) % 1.5) / 1.5, sx = X + R(ph * (Wp + 20 * k)) - R(10 * k), sw = Math.max(2, R(1.4 * k)); g.globalAlpha = 0.55; for (let j = 1; j < Hp - 1; j++) { const q = sx + R((Hp - j) * 0.5); if (q > X + I[j] && q + sw < X + Math.min(fw, Wp - I[j])) ui.fill('#ffffff').fillRect(q, Y + j, sw, 1); } g.globalAlpha = 1; }
  g.setTransform(ui.ta, 0, 0, ui.td, ui.te, ui.tf);
  if (thick && o.clamps !== false && w >= 40) for (const cx of [x + 6, x + w - 9]) clamp(ui, cx, y - 3, h + 6);
  // little copper caps on both ends of a thin bar
  if (!thick && o.caps !== false && w >= 30) for (const cx of [x - 2.5, x + w + 0.5]) capPiece(ui, cx, y - 1.5, h + 3);
}
function capPiece(ui, x, y, h) {
  const k = ui.k, Wp = Math.max(3, R(2 * k)), Hp = Math.max(4, R(h * k));
  const cv = sprite('CP' + Wp + 'x' + Hp, Wp, Hp, (d, W) => { const ink = P(T.ink), l = P(T.copperL), hi = P(T.copperH), m = P(T.copper), dk = P(T.copperD); for (let j = 0; j < Hp; j++) for (let i = 0; i < W; i++) { const e = i === 0 || i === W - 1 || j === 0 || j === Hp - 1; d[j * W + i] = e ? ink : j === 1 ? hi : i === 1 ? l : j >= Hp - 2 ? dk : m; } });
  put(ui, cv, x, y, 0);
}
// a brass clamp band across a thick bar (x, y, h in units)
export function clamp(ui, x, y, h) {
  ui = U(ui); const k = ui.k, Wp = Math.max(4, R(3 * k)), Hp = R(h * k);
  const cv = sprite('CL' + Wp + 'x' + Hp, Wp, Hp, (d, W) => { const ink = P(T.ink), b = P(T.brass), l = P('#fff0a0'), m = P(mx(T.brass, '#fff0a0', 0.4)), dk = P(T.brassD); for (let j = 0; j < Hp; j++) for (let i = 0; i < W; i++) { const e = i === 0 || i === W - 1 || j === 0 || j === Hp - 1; d[j * W + i] = e ? ink : i === 1 ? l : i === W - 2 ? dk : j < 3 ? m : j >= Hp - 3 ? dk : (i < W / 2 ? m : b); } });
  put(ui, cv, x, y, 0);
}

// ------------------------------------------------------------------ full-screen backdrop for modal screens
// a cosy room: striped wallpaper with little diamonds, a picture rail, a planked wainscot, dust in the light
let wallCv = null, plankCv = null, tileK = 0;
function tiles(k) {
  if (wallCv && tileK === k) return;
  tileK = k; const t = Math.max(1, R(k));
  wallCv = makeCanvas(16 * t, 16 * t); let c = wallCv.getContext('2d'); let p = (col, x, y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x * t, y * t, w * t, h * t); };
  p('#e6d2b0', 0, 0, 16, 16); p('#dcc39e', 8, 0, 8, 16); p('#efdfc2', 0, 0, 1, 16); p('#cfb48e', 15, 0, 1, 16);
  p('#c8a27c', 11, 6, 2, 1); p('#c8a27c', 10, 7, 4, 2); p('#c8a27c', 11, 9, 2, 1); p('#e8c49c', 11, 7, 1, 1); p('#d8bc96', 3, 12, 1, 1); p('#d8bc96', 4, 3, 1, 1);
  plankCv = makeCanvas(32 * t, 24 * t); c = plankCv.getContext('2d'); p = (col, x, y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x * t, y * t, w * t, h * t); };
  p('#9a5a34', 0, 0, 32, 24);
  for (let i = 0; i < 32; i += 8) { p('#6b3a28', i, 0, 1, 24); p('#b8744a', i + 1, 0, 1, 24); p(i % 16 ? '#a8643a' : '#925430', i + 2, 0, 6, 24); }
  for (let j = 2; j < 24; j += 5) p('#8a4e2c', (j * 7) % 32 + 3, j, 3, 1);
}
export function backdrop(ui, t, o = {}) {
  const g = ui.g, k = ui.k, W = ui.w, H = ui.h, floor = R(H * 0.74);
  tiles(k);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = g.createPattern(wallCv, 'repeat'); g.fillRect(0, 0, R(W * k), R(floor * k));
  g.translate(0, R(floor * k)); g.fillStyle = g.createPattern(plankCv, 'repeat'); g.fillRect(0, 0, R(W * k), R((H - floor) * k) + 2);
  g.setTransform(ui.ta, 0, 0, ui.td, ui.te, ui.tf); ui._fs = null;
  ui.rect(0, 3, W, 1, T.copperD); ui.rect(0, 4, W, 2, T.copperL); ui.rect(0, 6, W, 1, T.copperD);
  ui.rect(0, floor - 4, W, 1, T.ink); ui.rect(0, floor - 3, W, 1, T.copperH); ui.rect(0, floor - 2, W, 3, T.copperL); ui.rect(0, floor + 1, W, 1, T.copper); ui.rect(0, floor + 2, W, 1, T.ink);
  g.globalAlpha = 0.07; for (let q = 1; q <= 4; q++) { ui.rect(0, 0, W, 6 * q, T.shade); ui.rect(0, 0, 8 * q, H, T.shade); ui.rect(W - 8 * q, 0, 8 * q, H, T.shade); } g.globalAlpha = 1;
  for (let i = 0; i < 30; i++) { const x = ((i * 97.3) % W) + Math.sin(t * 0.5 + i) * 6, y = H - ((t * (5 + (i % 4) * 2) + i * 37) % H); if (((t * 2 + i) | 0) % 3) ui.rect(x, y, 0.5, 0.5, i % 3 ? '#fff4d8' : '#ffe8a0'); }
  void o; void css; void rgba;
}
export function woodTex() { return null; }
export function paperTex() { return null; }
