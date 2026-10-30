// Pixel-art textures for Downtown: curtain walls, billboards, the Street Arena court, graffiti, the
// scoreboard, the cinema marquee, shop shelves and fridges, lab screens, bookshelves and signs.
// All painted at 32 texels per metre with the bitmap fonts from dt_pix.js (crisp lettering).
import { TX } from '../build.js';
import { ptext, textW, fitScale, signBoard, bulbs, vgrad, disc, critter, dark, light } from './dt_pix.js';

const pt = TX.ptex;
const pick = (r, a) => a[Math.floor(r() * a.length)];

// ---------------------------------------------------------------- office towers
const TOWER = {
  blue: { glass: '#3a6a9a', sky: '#8ab8e0', frame: '#d0d8e0', span: '#8a98a8', lit: '#fff0c0', cool: '#d8f0ff' },
  bronze: { glass: '#6a5040', sky: '#c8a070', frame: '#3a3430', span: '#5a4a3e', lit: '#ffe0a0', cool: '#ffe8c8' },
  teal: { glass: '#2a7a7a', sky: '#8ad8d0', frame: '#e8ece8', span: '#c8d0cc', lit: '#fff4c8', cool: '#d0fff4' },
};
/** curtain wall: 8 m × 14 m (four 3.5 m storeys): mullions every metre, spandrel bands, sky reflections, lit offices */
export const towerTex = (style = 'blue', night = false) => pt('dt_tower' + style + night, 8, 14, (g, W, H, r, P) => {
  const S = TOWER[style], FH = H / 4, SP = 24;
  P.fill(S.frame);
  for (let f = 0; f < 4; f++) {
    const y0 = f * FH;
    // spandrel at the bottom of each storey band (the floor slab line)
    P.rect(0, y0 + FH - SP, W, SP, S.span); P.hline(0, y0 + FH - SP, W, light(S.span, 0.25)); P.hline(0, y0 + FH - 1, W, dark(S.span, 0.3));
    for (let x = 6; x < W; x += 16) P.rect(x, y0 + FH - SP + 9, 6, 2, dark(S.span, 0.18));
    for (let c = 0; c < 8; c++) {
      const x = c * 32 + 2, y = y0 + 3, w = 29, h = FH - SP - 4, lit = r() < (night ? 0.58 : 0.1);
      if (lit) {
        const L = r() < 0.7 ? S.lit : S.cool;
        P.rect(x, y, w, h, L); P.rect(x, y, w, 3, light(L, 0.5)); P.dither(x, y + h - 26, w, 26, dark(L, 0.2), 0.5);
        // office furniture: a desk with a monitor, a filing cabinet, a potted plant
        const k = r(); const ink = dark(L, 0.55);
        if (k < 0.4) { P.rect(x + 4, y + h - 14, 20, 3, ink); P.rect(x + 8, y + h - 24, 9, 8, ink); P.rect(x + 9, y + h - 23, 7, 6, night ? '#9ad8ff' : light(L, 0.2)); }
        else if (k < 0.65) { P.rect(x + 16, y + h - 20, 10, 20, ink); P.hline(x + 17, y + h - 13, 8, light(ink, 0.2)); P.hline(x + 17, y + h - 6, 8, light(ink, 0.2)); }
        else if (k < 0.85) { P.rect(x + 5, y + h - 12, 7, 12, ink); P.rect(x + 3, y + h - 22, 11, 10, dark('#4a8a4a', 0.3)); }
      } else {
        P.rect(x, y, w, h, night ? dark(S.glass, 0.55) : S.glass);
        P.dither(x, y, w, h, night ? dark(S.glass, 0.3) : S.sky, (xx, yy) => { const t = ((xx * 0.7 + yy) % 90) / 90; return (night ? 0.25 : 0.65) * Math.max(0, 1 - (yy - y) / h * 1.4) + (t < 0.12 ? 0.6 : 0); });
        if (r() < 0.3) for (let yy = y; yy < y + h * (0.3 + r() * 0.5); yy += 3) P.hline(x, yy, w, night ? dark(S.glass, 0.2) : light(S.glass, 0.25));
      }
      P.vline(x - 2, y0, FH - SP, dark(S.frame, 0.15)); P.vline(x - 1, y0, FH - SP, light(S.frame, 0.2));
    }
  }
});
/** a stone tower: cream piers and deep-set dark windows (8 × 14 m, 3.5 m storeys) */
export const stoneTowerTex = (base = '#e0d4bc', night = false) => pt('dt_stone' + base + night, 8, 14, (g, W, H, r, P) => {
  const FH = H / 4; P.fill(base); P.speck(400, dark(base, 0.08), r); P.speck(300, light(base, 0.1), r);
  for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) {
    const x = c * 64 + 12, y = f * FH + 14, w = 40, h = FH - 34, lit = r() < (night ? 0.55 : 0.12);
    P.rect(x - 2, y - 2, w + 4, h + 4, dark(base, 0.35)); P.rect(x, y, w, h, lit ? '#ffe4a0' : night ? '#1e2a3a' : '#3a4a5e');
    if (!lit) P.dither(x, y, w, h, night ? '#2a3a4e' : '#7a9ab8', (xx, yy) => 0.5 - (yy - y) / h * 0.6);
    else P.dither(x, y + h - 14, w, 14, '#c8a060', 0.5);
    P.vline(x + w / 2, y, h, dark(base, 0.25)); P.rect(x - 4, y + h + 2, w + 8, 3, light(base, 0.2)); P.hline(x - 4, y + h + 5, w + 8, dark(base, 0.3));
  }
});
/** tower lobby front (glass doors, gold name) for the ground floor, w × 3.4 m */
export const lobbyTex = (name, w = 8, gold = '#e8c060', frame = '#2a2e38') => pt('dt_lobby' + name + w, w, 3.4, (g, W, H, r, P) => {
  P.fill(frame); P.rect(4, 26, W - 8, H - 30, '#ffe8b8');
  P.dither(4, 26, W - 8, H - 30, '#c8a070', (x, y) => (y - 26) / (H - 30) * 0.5);
  for (let x = 4; x < W - 4; x += 48) P.rect(x, 26, 3, H - 30, frame);
  const cx = W / 2; P.rect(cx - 30, 40, 60, H - 44, '#a8d0e8'); P.rect(cx - 1, 40, 2, H - 44, frame); P.rect(cx - 30, 40, 60, 2, frame);
  P.rect(cx - 22, H - 40, 8, 2, '#c8ccd4'); P.rect(cx + 14, H - 40, 8, 2, '#c8ccd4');
  P.rect(20, H - 20, 30, 16, '#5a4a3e'); P.rect(18, H - 22, 34, 3, '#7a6a5a');
  P.rect(W - 50, H - 30, 10, 26, '#3a7a4a'); P.rect(W - 48, H - 8, 6, 6, '#c8b090');
  P.rect(0, 0, W, 24, dark(frame, 0.2)); ptext(P, name, cx, 12, gold, { s: fitScale(name, W - 20, 5, 2), shadow: '#000000' });
});

// ---------------------------------------------------------------- billboards (8 × 4 m)
export const billboard = (kind) => pt('dt_bill' + kind, 8, 4, (g, W, H, r, P) => {
  if (kind === 'league') {
    vgrad(P, 0, 0, W, H, ['#2a1a4a', '#4a2a7a', '#7a3a9a']);
    for (let i = -4; i < 12; i++) for (let y = 0; y < H; y++) { const x = i * 28 + y * 0.5; P.px(x, y, '#5a3a8a'); P.px(x + 1, y, '#5a3a8a'); }
    const bolt = [[150, 8], [138, 40], [150, 40], [132, 78], [162, 34], [150, 34], [164, 8]];
    for (let y = 8; y < 78; y++) for (let x = 128; x < 168; x++) { let ins = false; for (let i = 0, j = bolt.length - 1; i < bolt.length; j = i++) { const [xi, yi] = bolt[i], [xj, yj] = bolt[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } if (ins) P.px(x, y, y % 6 < 3 ? '#ffe04a' : '#ffc82a'); }
    critter(P, 30, 92, 18, '#ff7a3a', { cheek: '#ffc0a0' }); critter(P, 226, 92, 18, '#4aa8f0', { cheek: '#b0e0ff' });
    ptext(P, 'TOKON LEAGUE', W / 2, 24, '#ffffff', { s: 3, outline: '#1a0a2a', shadow: '#ff4a8a', sd: 2 });
    ptext(P, 'STREET FINALS', W / 2, 54, '#ffe04a', { s: 2, outline: '#1a0a2a' });
    P.rect(70, 92, 116, 18, '#ff4a8a'); ptext(P, 'SAT 7PM  ARENA', W / 2, 101, '#ffffff', { s: 1, font: 5 });
  } else if (kind === 'fizz') {
    vgrad(P, 0, 0, W, H, ['#5ac8f8', '#8ad8ff', '#c8f0ff']);
    for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H, rr = 1 + Math.floor(r() * 4); disc(P, x | 0, y | 0, rr, '#ffffff'); if (rr > 1) disc(P, x | 0, y | 0, rr - 1, '#d8f4ff'); }
    P.rect(30, 18, 50, 96, '#e8303a'); P.rect(30, 18, 50, 6, '#c8ccd4'); P.rect(34, 12, 42, 8, '#a8acb4'); P.rect(30, 108, 50, 6, '#c8ccd4');
    P.rect(36, 24, 8, 84, '#ff6a6a'); P.rect(30, 50, 50, 24, '#ffffff'); ptext(P, 'FP', 55, 62, '#e8303a', { s: 2 });
    for (let k = 0; k < 6; k++) P.rect(84 + k * 3, 22 - k * 2, 2, 2, '#ffffff');
    ptext(P, 'FIZZ POP!', 172, 44, '#ffffff', { s: 3, outline: '#e8303a', ow: 2, shadow: '#a81e2a', sd: 3 });
    ptext(P, 'TASTE THE SPARKLE', 170, 86, '#2a4a8a', { s: 1 }); P.rect(110, 98, 120, 2, '#e8303a');
  } else if (kind === 'phone') {
    vgrad(P, 0, 0, W, H, ['#ff8a6a', '#ff5a8a', '#a84ad8']);
    P.rect(26, 8, 56, 112, '#1e1e28'); P.rect(30, 16, 48, 92, '#9af0ff'); P.dither(30, 16, 48, 92, '#5ad8ff', 0.4);
    critter(P, 54, 66, 16, '#ffd84a', { cheek: '#ffb0a0' }); P.rect(46, 112, 16, 3, '#3a3a48');
    ptext(P, 'TOKONPHONE 9', 168, 40, '#ffffff', { s: 2, shadow: '#5a1a6a' });
    ptext(P, 'CATCH THEM IN 8K', 168, 66, '#fff0a0', { s: 1 }); ptext(P, 'NOW IN STORES', 168, 96, '#ffffff', { s: 1, font: 3 });
  } else if (kind === 'boba') {
    vgrad(P, 0, 0, W, H, ['#e8d0ff', '#d0b0f0', '#b890e0']);
    disc(P, 220, 28, 18, '#fff4c0'); disc(P, 228, 22, 15, '#d0b0f0');
    for (const [x, c] of [[30, '#c89a6a'], [78, '#a878d8']]) { P.rect(x, 30, 36, 70, '#f8f0ff'); P.rect(x + 2, 36, 32, 62, c); for (let i = 0; i < 12; i++) disc(P, x + 6 + (i % 4) * 8, 84 + Math.floor(i / 4) * 5, 2, '#3a2a2a'); P.rect(x - 2, 26, 40, 6, '#ffffff'); P.rect(x + 20, 4, 4, 24, '#ff6a8a'); }
    ptext(P, 'BUBBLE MOON', 170, 64, '#ffffff', { s: 2, outline: '#7a4ab8' }); ptext(P, 'NEW! UBE TARO', 170, 90, '#5a2a8a', { s: 1 });
  } else if (kind === 'concert') {
    P.fill('#1a1a2a'); for (let i = 0; i < 60; i++) P.px(r() * W, r() * H, '#ffffff');
    // an electric guitar, music notes and speaker stacks (no people)
    for (let k = 0; k < 60; k++) { const t = k / 60; P.rect(16 + t * 26, 104 - t * 70, 3, 3, '#c8a060'); }
    disc(P, 22, 104, 13, '#ff4a8a'); disc(P, 32, 94, 10, '#ff4a8a'); disc(P, 24, 102, 4, '#1a1a2a'); P.rect(38, 28, 8, 8, '#f4f0e8');
    for (const [x, y, c] of [[64, 76, '#4ad8ff'], [236, 34, '#ffe04a'], [244, 74, '#ff4a8a'], [86, 96, '#5aff9a']]) { disc(P, x, y, 4, c); P.rect(x + 3, y - 16, 2, 16, c); P.rect(x + 3, y - 16, 7, 3, c); }
    for (const x of [196, 224]) { P.rect(x, 80, 26, 44, '#2a2a3a'); disc(P, x + 13, 96, 7, '#4a4a5a'); disc(P, x + 13, 114, 5, '#4a4a5a'); }
    ptext(P, 'RIFF & THE', 150, 26, '#ffe04a', { s: 2, shadow: '#000000' }); ptext(P, 'FEEDBACKS', 150, 54, '#ff4a8a', { s: 3, outline: '#ffffff' }); ptext(P, 'LIVE AT THE PIER  FRI', 140, 112, '#ffffff', { s: 1 });
  }
  P.rect(0, 0, W, 2, '#f4f0e8'); P.rect(0, H - 2, W, 2, '#f4f0e8'); P.rect(0, 0, 2, H, '#f4f0e8'); P.rect(W - 2, 0, 2, H, '#f4f0e8');
});

// ---------------------------------------------------------------- the Street Arena court (34 × 22 m, fit onto x 126–160, z 154–176)
export const COURT = { x0: 126, z0: 154, w: 34, d: 22 };
export const courtTex = () => pt('dt_court', COURT.w, COURT.d, (g, W, H, r, P) => {
  const m = (v) => Math.round(v * 32), out = '#b8503a', play = '#3a62b0', line = '#f4f0e4';
  P.fill(out); P.speck(5000, light(out, 0.08), r); P.speck(5000, dark(out, 0.12), r);
  const px0 = m(2), py0 = m(2), pw = m(30), ph = m(18);
  P.rect(px0, py0, pw, ph, play); P.speck(6000, light(play, 0.06), r, px0, py0, pw, ph); P.speck(6000, dark(play, 0.1), r, px0, py0, pw, ph);
  // team halves: a wash of red (west) and blue (east)
  P.dither(px0, py0, pw / 2, ph, '#8a4a9a', 0.18); P.dither(px0 + pw / 2, py0, pw / 2, ph, '#2a8ad8', 0.22);
  const L = (x, y, w, h) => P.rect(x, y, w, h, line);
  L(px0, py0, pw, 5); L(px0, py0 + ph - 5, pw, 5); L(px0, py0, 5, ph); L(px0 + pw - 5, py0, 5, ph); L(px0 + pw / 2 - 2, py0, 5, ph);
  const cx = px0 + pw / 2, cy = py0 + ph / 2;
  // centre circle: yellow ring, white line, the capsule emblem
  for (let y = -m(3.2); y <= m(3.2); y++) for (let x = -m(3.2); x <= m(3.2); x++) { const d = Math.hypot(x, y); if (d <= m(3.2) && d > m(3.2) - 5) P.px(cx + x, cy + y, line); else if (d <= m(2.9) && d > m(2.9) - 8) P.px(cx + x, cy + y, '#f0c040'); }
  for (let y = -m(1.6); y <= m(1.6); y++) for (let x = -m(1.6); x <= m(1.6); x++) { const d = Math.hypot(x, y); if (d <= m(1.6)) P.px(cx + x, cy + y, d > m(1.6) - 4 ? '#1e1e28' : Math.abs(y) < 4 ? '#1e1e28' : y < 0 ? '#e8473a' : '#f4f0ea'); }
  disc(P, cx, cy, 10, '#1e1e28'); disc(P, cx, cy, 6, '#f4f0ea');
  // trainer boxes at 8 m apart (arenaA west, arenaB east), and the battle lanes
  for (const [dx, c] of [[-4, '#ff6a5a'], [4, '#5ac8ff']]) {
    const bx = cx + m(dx), bw = m(2.4), bh = m(3.6);
    P.rect(bx - bw / 2, cy - bh / 2, bw, 4, c); P.rect(bx - bw / 2, cy + bh / 2 - 4, bw, 4, c); P.rect(bx - bw / 2, cy - bh / 2, 4, bh, c); P.rect(bx + bw / 2 - 4, cy - bh / 2, 4, bh, c);
    ptext(P, dx < 0 ? 'A' : 'B', bx, cy - bh / 2 - 22, c, { s: 4 });
  }
  // three-point style arcs at the ends
  for (const [ex, sgn] of [[px0, 1], [px0 + pw, -1]]) for (let a = -1.5; a <= 1.5; a += 0.004) { const x = ex + sgn * Math.cos(a) * m(6), y = cy + Math.sin(a) * m(6); P.rect(x - 2, y - 2, 5, 5, line); }
  for (const [ex, sgn] of [[px0, 1], [px0 + pw, -1]]) { const x0 = sgn > 0 ? ex : ex - m(4.5); P.rect(x0, cy - m(2), m(4.5), m(4), sgn > 0 ? '#c84a5a' : '#2a6ac8'); P.rect(x0, cy - m(2), m(4.5), 4, line); P.rect(x0, cy + m(2) - 4, m(4.5), 4, line); P.rect(sgn > 0 ? x0 + m(4.5) - 4 : x0, cy - m(2), 4, m(4), line); }
  // painted words on the apron
  ptext(P, 'STREET ARENA', W / 2, m(1), '#f4f0e4', { s: 6 });
  ptext(P, 'TOKON STREET LEAGUE', W / 2, H - m(1), '#f0c040', { s: 5 });
  for (const [x, y, c] of [[m(1), m(11), '#f0c040'], [W - m(1), m(11), '#5ad8c0']]) for (let k = 0; k < 5; k++) P.rect(x - 6, y - m(4) + k * m(2), 12, 12, c);
  // wear: cracks, scuffs, a stencilled number and tags in the corners
  for (let i = 0; i < 14; i++) { let x = r() * W, y = r() * H; for (let k = 0; k < 40; k++) { P.px(x, y, dark(out, 0.45)); x += r() < 0.5 ? 1 : -0.3; y += r() < 0.6 ? 1 : -1; } }
  for (let i = 0; i < 30; i++) { const x = r() * W, y = r() * H; P.dither(x | 0, y | 0, 20 + r() * 30 | 0, 3 + r() * 6 | 0, '#2a2a34', 0.2); }
  ptext(P, 'RIFF', m(30.5), m(20.6), '#ff4a8a', { s: 4, outline: '#1e1e28' }); ptext(P, 'GG', m(3.5), m(20.6), '#5aff9a', { s: 4, outline: '#1e1e28' });
});

// ---------------------------------------------------------------- graffiti (6 × 3 m panels)
const SPRAY = [['#ff4a8a', '#ffb0d0', '#a81e5a'], ['#4ad8ff', '#c0f4ff', '#1e6aa8'], ['#ffe04a', '#fff4b0', '#c88a1a'], ['#5aff8a', '#d0ffd8', '#1e8a4a'], ['#b06aff', '#e0c8ff', '#5a2aa8'], ['#ff8a3a', '#ffd0a0', '#b8501e']];
export const graffiti = (word, i = 0, bg = '#8a8478', wM = 6) => pt('dt_graf' + word + i + bg + wM, wM, 3, (g, W, H, r, P) => {
  P.fill(bg); P.speck(500, dark(bg, 0.1), r); P.speck(400, light(bg, 0.08), r);
  for (let y = 0; y < H; y += 16) P.hline(0, y, W, dark(bg, 0.12));
  const [c1, c2, c3] = SPRAY[i % SPRAY.length], [d1] = SPRAY[(i + 2) % SPRAY.length];
  // a cloud of spray behind the letters
  for (let k = 0; k < 900; k++) { const x = W / 2 + (r() - 0.5) * W * 0.9, y = H / 2 + (r() - 0.5) * H * 0.75; P.px(x, y, d1); }
  const s = fitScale(word, W - 30, 5, 5), w = textW(word, 5, s), x0 = Math.round(W / 2 - w / 2), y0 = Math.round(H / 2 - (7 * s) / 2) - 2;
  ptext(P, word, W / 2 + 4, y0 + 4, '#1e1a22', { s, mid: false, outline: '#1e1a22', ow: 3 });
  ptext(P, word, W / 2, y0, (t) => (t < 0.35 ? c2 : t < 0.7 ? c1 : c3), { s, mid: false, outline: '#ffffff', ow: 2 });
  // drips and shines
  for (let k = 0; k < 8; k++) { const x = x0 + Math.floor(r() * w), len = 4 + Math.floor(r() * 14); P.rect(x, y0 + 7 * s + 2, 2, len, c3); P.rect(x, y0 + 7 * s + 2 + len, 2, 2, c1); }
  for (let k = 0; k < 6; k++) { const x = x0 + Math.floor(r() * w), y = y0 + 2 + Math.floor(r() * 6); P.rect(x, y, 3, 1, '#ffffff'); P.rect(x + 1, y - 1, 1, 3, '#ffffff'); }
  for (let k = 0; k < 4; k++) { const x = 6 + r() * (W - 12), y = 6 + r() * 10; P.rect(x, y, 1, 5, '#ffffff'); P.rect(x - 2, y + 2, 5, 1, '#ffffff'); }
  ptext(P, pick(r, ['ZAP', 'K8', 'RIFF', 'MOX', 'B-BOY']), W - 22, H - 10, pick(r, ['#ffffff', '#1e1a22', c2]), { font: 3, s: 2 });
});
/** a mural: a big grinning Tokonmon with a crown, sun rays and a banner */
export const mural = (body = '#ffd84a', bg = '#5ac8d8', wM = 6) => pt('dt_mural' + body + bg + wM, wM, 3, (g, W, H, r, P) => {
  P.fill(bg); for (let a = 0; a < 24; a++) for (let t = 20; t < 140; t++) { if (a & 1) continue; const x = W / 2 + Math.cos(a * 0.2618) * t, y = H / 2 + Math.sin(a * 0.2618) * t; P.rect(x, y, 2, 2, light(bg, 0.25)); }
  critter(P, W / 2, H / 2 + 6, 30, body, { cheek: '#ff9ab0' });
  for (let k = 0; k < 5; k++) P.rect(W / 2 - 20 + k * 8, H / 2 - 40, 6, 10, '#f0c040'), P.px(W / 2 - 17 + k * 8, H / 2 - 42, '#ff4a5a');
  P.rect(W / 2 - 22, H / 2 - 32, 46, 5, '#f0c040');
  P.rect(14, H - 22, W - 28, 16, '#e8473a'); ptext(P, 'STREET KING', W / 2, H - 14, '#ffffff', { s: 1 });
});

// ---------------------------------------------------------------- arena furniture
export const scoreboardTex = () => pt('dt_score', 6.4, 2.6, (g, W, H, r, P) => {
  P.fill('#141418'); P.rect(0, 0, W, 20, '#c8303a'); P.rect(0, 18, W, 2, '#f0c040');
  ptext(P, 'STREET ARENA', W / 2, 10, '#fff4c0', { s: 2 });
  const led = (str, x, y, c, s) => { for (let yy = y - 2; yy < y + 7 * s + 2; yy += s) for (let xx = x - textW(str, 5, s) / 2 - 2; xx < x + textW(str, 5, s) / 2 + 2; xx += s) P.rect(xx, yy, s - 1, s - 1, '#24242c'); ptext(P, str, x, y, c, { s, mid: false }); };
  P.rect(8, 26, 60, 10, '#ff5a5a'); ptext(P, 'RED', 38, 31, '#141418', { s: 1 });
  P.rect(W - 68, 26, 60, 10, '#5ac8ff'); ptext(P, 'BLUE', W - 38, 31, '#141418', { s: 1 });
  led('2', 38, 42, '#ff6a5a', 4); led('1', W - 38, 42, '#5ac8ff', 4);
  led('07:42', W / 2, 30, '#ffc84a', 2); ptext(P, 'ROUND 3', W / 2, 56, '#9affb0', { s: 1, font: 3 });
  for (let i = 0; i < 3; i++) { disc(P, W / 2 - 16 + i * 16, 70, 4, i < 2 ? '#ff6a5a' : '#3a3a44'); }
});
/** bleacher riser paint: a stripe band with row letters */
export const riserTex = (c = '#e8473a') => pt('dt_riser' + c, 4, 0.36, (g, W, H, r, P) => { P.fill(c); P.rect(0, 0, W, 2, light(c, 0.3)); P.rect(0, H - 2, W, 2, dark(c, 0.3)); for (let x = 8; x < W; x += 32) ptext(P, String.fromCharCode(65 + x / 32), x, H / 2, '#ffffff', { font: 3, s: 1 }); P.speck(20, dark(c, 0.2), r); }, { ppm: 32 });

// ---------------------------------------------------------------- the cinema
export const decoWall = () => pt('dt_deco', 2, 2.5, (g, W, H, r, P) => {
  P.fill('#ecdcc0'); P.speck(120, dark('#ecdcc0', 0.08), r);
  for (const x of [0, W / 2]) { P.rect(x + 4, 0, 6, H, '#d8b060'); P.vline(x + 4, 0, H, light('#d8b060', 0.3)); P.vline(x + 9, 0, H, dark('#d8b060', 0.3)); }
  for (let x = 0; x < W; x += 8) { P.rect(x, 4, 4, 4, '#2a8a84'); P.rect(x + 4, 8, 4, 4, '#2a8a84'); }
  P.rect(0, 14, W, 2, '#d8b060');
});
export const marqueeTex = (l1, l2) => pt('dt_marq' + l1 + l2, 14, 1.6, (g, W, H, r, P) => {
  P.fill('#f8f4e8'); bulbs(P, 0, 0, W, H, '#fff6c0', '#e8a030', 6);
  ptext(P, l1, W / 2, 16, '#c8303a', { s: 2 }); ptext(P, l2, W / 2, 36, '#1e1e28', { s: fitScale(l2, W - 20, 5, 2) });
});
export const bladeTex = (word) => pt('dt_blade' + word, 1.3, 7, (g, W, H, r, P) => {
  P.fill('#c8303a'); bulbs(P, 0, 0, W, H, '#fff6c0', '#e8a030', 6);
  const n = word.length, step = (H - 16) / n;
  for (let i = 0; i < n; i++) ptext(P, word[i], W / 2, 8 + step * (i + 0.5), '#ffe8a0', { s: 3, shadow: '#5a1018' });
});
const POSTERS = {
  galaxy: (P, W, H, r) => { P.fill('#141a3a'); for (let i = 0; i < 30; i++) P.px(r() * W, r() * H, '#ffffff'); disc(P, 24, 16, 8, '#e8a040'); P.rect(14, 15, 20, 2, '#f0c878'); P.rect(9, 22, 4, 14, '#e8e8f0'); P.rect(8, 34, 6, 3, '#e8473a'); P.rect(10, 37, 2, 4, '#ffd84a'); ptext(P, 'GALAXY', W / 2, H - 9, '#ffe04a', { font: 3, s: 1 }); ptext(P, 'RANGERS', W / 2, H - 3, '#ffffff', { font: 3, s: 1 }); },
  kaiju: (P, W, H, r) => { vgrad(P, 0, 0, W, H, ['#ffb070', '#ff7a6a']); critter(P, 16, 18, 10, '#5ab84a'); for (let x = 0; x < W; x += 3) P.rect(x, H - 14 - (x * 7) % 6, 2, 14, '#3a2a4a'); ptext(P, 'KAIJU', W / 2, H - 9, '#ffffff', { font: 3, s: 1 }); ptext(P, 'PICNIC', W / 2, H - 3, '#ffe04a', { font: 3, s: 1 }); },
  love: (P, W, H, r) => { P.fill('#ff8ab0'); for (const [x, y, s] of [[10, 14, 3], [22, 20, 4]]) { P.rect(x - s, y, s, s, '#e8303a'); P.rect(x + 1, y, s, s, '#e8303a'); P.rect(x - s + 1, y + s - 1, s * 2 - 1, s, '#e8303a'); } ptext(P, 'LOVE IN', W / 2, H - 9, '#ffffff', { font: 3, s: 1 }); ptext(P, '8-BIT', W / 2, H - 3, '#5a1a3a', { font: 3, s: 1 }); },
};
export const posterTex = (k) => pt('dt_poster' + k, 1, 1.5, (g, W, H, r, P) => { POSTERS[k](P, W, H, r); P.rect(0, 0, W, 1, '#f0c040'); P.rect(0, H - 1, W, 1, '#f0c040'); P.rect(0, 0, 1, H, '#f0c040'); P.rect(W - 1, 0, 1, H, '#f0c040'); });

// ---------------------------------------------------------------- shops
const GOODS = ['#e8473a', '#f0c040', '#5ab06a', '#3a8ad8', '#e890b0', '#f4f0ea', '#ff8a3a', '#a85ae8', '#5ad8c8', '#c8a070'];
/** a gondola / wall shelf front, 2 × 1.8 m: four shelves of boxes, cans, bottles, snack bags and cup noodles */
export const shelfTex = (seed = 0) => pt('dt_shelf' + seed, 2, 1.8, (g, W, H, r, P) => {
  P.fill('#e8eaee'); P.rect(0, 0, 2, H, '#a8acb4'); P.rect(W - 2, 0, 2, H, '#a8acb4');
  const rows = 4, rh = Math.floor((H - 4) / rows);
  for (let i = 0; i < rows; i++) {
    const yb = 2 + (i + 1) * rh; P.rect(2, yb - 2, W - 4, 3, '#b8bcc4'); P.rect(2, yb - 3, W - 4, 1, '#f8f8fa');
    let x = 3; const kind = Math.floor(r() * 5);
    while (x < W - 6) {
      const c = pick(r, GOODS);
      if (kind === 0) { const w = 6 + Math.floor(r() * 3), h = 10 + Math.floor(r() * 3); P.block(x, yb - 3 - h, w, h, c); P.rect(x + 1, yb - 3 - h + 3, w - 2, 2, '#ffffff'); x += w + 1; }
      else if (kind === 1) { const h = 6; P.rect(x, yb - 3 - h, 3, h, c); P.px(x + 1, yb - 3 - h, '#c8ccd4'); P.rect(x, yb - 6, 3, 1, light(c, 0.4)); x += 4; }
      else if (kind === 2) { const h = 10; P.rect(x, yb - 3 - h + 3, 4, h - 3, c); P.rect(x + 1, yb - 3 - h, 2, 3, light(c, 0.5)); P.px(x + 1, yb - 3 - h, '#f4f0ea'); P.rect(x, yb - 8, 4, 2, '#ffffff'); x += 5; }
      else if (kind === 3) { const w = 7, h = 9; P.rect(x, yb - 3 - h + 1, w, h - 1, c); P.hline(x + 1, yb - 3 - h, w - 2, c); P.rect(x + 2, yb - 8, 3, 3, '#ffe04a'); P.px(x + 1, yb - 3 - h + 2, light(c, 0.5)); x += w + 1; }
      else { const w = 7, h = 7; P.rect(x, yb - 3 - h, w, h, '#f4f0ea'); P.rect(x, yb - 3 - h + 2, w, 3, c); P.hline(x - 1, yb - 3 - h, w + 2, light(c, 0.3)); x += w + 1; }
    }
    for (let t = 6; t < W - 6; t += 14) P.rect(t, yb - 1, 4, 2, '#ffe04a');
  }
  P.rect(2, 0, W - 4, 2, '#5ab86a');
});
export const fridgeTex = () => pt('dt_fridge', 1, 2.1, (g, W, H, r, P) => {
  P.fill('#c8ccd4'); P.rect(2, 4, W - 4, H - 10, '#e8f8ff');
  for (let i = 0; i < 5; i++) { const y = 6 + i * 12; P.rect(2, y + 10, W - 4, 1, '#a8b0b8'); for (let x = 3; x < W - 3; x += 3) { const c = pick(r, ['#e8473a', '#5ab06a', '#f0c040', '#3a8ad8', '#ff8ab0', '#f4f0ea', '#8a5a3a']); P.rect(x, y + 3, 2, 7, c); P.px(x, y + 2, '#f4f0ea'); } }
  P.dither(2, 4, W - 4, H - 10, '#ffffff', (x, y) => ((x + y) % 14 < 2 ? 0.6 : 0)); P.rect(W - 5, 30, 2, 12, '#7a8088'); P.rect(0, 0, W, 4, '#5ab86a'); ptext(P, 'COLD', W / 2, 2, '#ffffff', { font: 3, s: 1, mid: false });
});
/** shop window glass with stickers and posters seen from outside, w × 1.9 m */
export const storeWindow = (kind, w = 3) => pt('dt_swin' + kind + w, w, 1.9, (g, W, H, r, P) => {
  P.fill('#2a2e38'); P.rect(3, 3, W - 6, H - 6, kind === 'boba' ? '#f0e0ff' : '#e8f4ff');
  P.dither(3, 3, W - 6, H - 6, '#a8c8e0', (x, y) => ((x + y * 0.7) % 40 < 8 ? 0.55 : 0.08));
  if (kind === 'mart') {
    for (let i = 0; i < 3; i++) { const y = 20 + i * 14; P.rect(8, y + 9, W - 16, 2, '#a8acb4'); for (let x = 10; x < W - 12; x += 5) P.rect(x, y + 1, 4, 8, pick(r, GOODS)); }
    P.rect(10, 4, 34, 14, '#ffe04a'); ptext(P, 'SALE!', 27, 11, '#e8303a', { s: 1 }); P.rect(W - 40, 4, 30, 14, '#5ab86a'); ptext(P, 'OPEN', W - 25, 11, '#ffffff', { s: 1 });
    P.rect(W / 2 - 14, H - 16, 28, 10, '#ff8ab0'); ptext(P, 'ONIGIRI', W / 2, H - 11, '#ffffff', { font: 3, s: 1 });
  } else if (kind === 'boba') {
    for (const x of [12, 36, 60]) if (x < W - 20) { P.rect(x, 22, 14, 26, '#ffffff'); P.rect(x + 1, 26, 12, 21, pick(r, ['#c89a6a', '#a878d8', '#ffc84a', '#8ad8a0'])); for (let k = 0; k < 6; k++) P.px(x + 2 + (k % 3) * 4, 42 + Math.floor(k / 3) * 2, '#2a1a1a'); P.rect(x + 8, 12, 2, 12, '#ff6a8a'); }
    P.rect(W - 34, 8, 26, 12, '#b890e0'); ptext(P, 'OPEN', W - 21, 14, '#ffffff', { s: 1 });
  } else if (kind === 'games') {
    for (let i = 0; i < 6; i++) { const x = 8 + i * 15; if (x > W - 18) break; P.rect(x, 18, 12, 16, pick(r, GOODS)); P.rect(x + 2, 20, 8, 6, '#ffffff'); critter(P, x + 6, 24, 3, pick(r, GOODS), { ears: false }); }
    P.rect(8, H - 20, W - 16, 12, '#1e1e28'); ptext(P, 'NEW GAMES', W / 2, H - 14, '#5aff9a', { font: 3, s: 2 });
  } else if (kind === 'ramen') {
    P.rect(3, 3, W - 6, H - 6, '#ffe0a0'); for (let i = 0; i < 4; i++) { const x = 10 + i * 22; if (x > W - 20) break; disc(P, x + 8, 34, 8, '#f4f0ea'); P.rect(x, 30, 17, 4, '#e8a040'); P.rect(x + 3, 28, 4, 3, '#f8f0e0'); }
    P.rect(W / 2 - 22, 6, 44, 14, '#e8303a'); ptext(P, 'RAMEN', W / 2, 13, '#ffffff', { s: 1 });
  }
  P.rect(0, H - 3, W, 3, '#1e1e28');
});
export const menuTex = () => pt('dt_menu', 2.4, 1.1, (g, W, H, r, P) => {
  P.fill('#2a2438'); P.rect(0, 0, W, 2, '#b890e0'); P.rect(0, H - 2, W, 2, '#b890e0');
  const items = [['MILK TEA', '4.5', '#c89a6a'], ['UBE TARO', '5.5', '#a878d8'], ['MANGO', '5.0', '#ffc84a'], ['MATCHA', '5.5', '#8ad8a0']];
  items.forEach(([n, p, c], i) => { const x = 6 + (i % 2) * 38, y = 6 + Math.floor(i / 2) * 15; P.rect(x, y, 6, 9, '#f8f4ff'); P.rect(x + 1, y + 2, 4, 7, c); P.px(x + 2, y + 7, '#1e1a22'); P.px(x + 4, y + 8, '#1e1a22'); ptext(P, n, x + 9, y + 3, '#f8f4ff', { font: 3, s: 1, align: 'left' }); ptext(P, '$' + p, x + 9, y + 9, '#ffe04a', { font: 3, s: 1, align: 'left' }); });
});

// ---------------------------------------------------------------- the lab
export const labCladding = () => pt('dt_labclad', 3, 3, (g, W, H, r, P) => {
  P.fill('#f2f4f2');
  for (let y = 0; y < H; y += 32) for (let x = (y / 32) & 1 ? 0 : 24; x < W; x += 48) { P.vline(x, y, 32, '#c8d0d0'); }
  for (let y = 0; y < H; y += 32) { P.hline(0, y, W, '#c8d0d0'); P.hline(0, y + 1, W, '#ffffff'); }
  P.speck(80, '#e0e6e6', r); P.dither(0, H - 8, W, 8, '#d8e0e0', 0.5);
});
export const labInner = () => pt('dt_labin', 2, 3, (g, W, H, r, P) => {
  P.fill('#f4f8f6'); P.rect(0, H - 32, W, 32, '#d8e8e4'); P.rect(0, H - 34, W, 3, '#5ad8c0'); P.rect(0, H - 4, W, 4, '#9aa8a8'); P.speck(40, '#e4ecea', r);
});
export const labWindow = () => pt('dt_labwin', 1.8, 1.5, (g, W, H, r, P) => {
  P.fill('#3ab8a0'); P.rect(3, 3, W - 6, H - 6, '#5a8ab0'); P.dither(3, 3, W - 6, H - 6, '#b8e0f8', (x, y) => Math.max(0, 0.7 - y / H) + ((x + y) % 19 < 3 ? 0.5 : 0));
  P.rect(W / 2 - 1, 3, 2, H - 6, '#3ab8a0'); P.rect(3, H - 6, W - 6, 3, '#2a9a84'); P.hline(3, 3, W - 6, '#8af0d8');
});
export const SCREENS = ['graph', 'dna', 'dex', 'map', 'scan'];
export const screenTex = (k, wM = 1.2, hM = 0.7) => pt('dt_scr' + k + wM + hM, wM, hM, (g, W, H, r, P) => {
  P.fill('#0e1a26'); P.rect(1, 1, W - 2, H - 2, '#12304a');
  if (k === 'graph') { for (let x = 2; x < W - 2; x += 6) P.vline(x, 2, H - 4, '#1a405a'); for (let i = 0; i < 3; i++) { const c = ['#5affc8', '#ff8ab0', '#ffe04a'][i]; let y = H / 2; for (let x = 3; x < W - 3; x++) { y = Math.max(3, Math.min(H - 4, y + (r() - 0.5) * 3)); P.px(x, y, c); } } }
  else if (k === 'dna') { for (let y = 2; y < H - 2; y++) { const a = y * 0.45, x1 = W / 2 + Math.sin(a) * (W * 0.25), x2 = W / 2 - Math.sin(a) * (W * 0.25); P.px(x1, y, '#5ac8ff'); P.px(x2, y, '#ff8ab0'); if (y % 3 === 0) P.hline(Math.min(x1, x2), y, Math.abs(x1 - x2), '#2a6a8a'); } }
  else if (k === 'dex') { const cols = ['#ff7a3a', '#4aa8f0', '#ff5a8a', '#5ad86a', '#ffd84a', '#b06aff']; const n = Math.max(2, Math.floor(W / 14)); for (let i = 0; i < n * 2; i++) { const x = 4 + (i % n) * ((W - 8) / n), y = 4 + Math.floor(i / n) * ((H - 8) / 2); P.rect(x, y, (W - 8) / n - 2, (H - 8) / 2 - 2, '#1a405a'); critter(P, Math.round(x + ((W - 8) / n - 2) / 2), Math.round(y + ((H - 8) / 2 - 2) / 2), Math.max(2, Math.floor(Math.min((W - 8) / n, (H - 8) / 2) * 0.28)), i < 3 ? cols[i] : '#2a5a7a', { ears: i < 3, ink: i < 3 ? '#0e1a26' : '#1e4a6a', mouth: i < 3 ? '#e85a6a' : '#2a5a7a', cheek: i < 3 ? '#ffb0c0' : '#2a5a7a' }); } }
  else if (k === 'map') { P.rect(2, 2, W - 4, H - 4, '#1a4a6a'); for (let i = 0; i < 5; i++) { const x = 4 + r() * (W - 14), y = 4 + r() * (H - 12); P.rect(x, y, 6 + r() * 8, 4 + r() * 5, '#3a8a5a'); } for (let i = 0; i < 4; i++) P.rect(4 + r() * (W - 8), 4 + r() * (H - 8), 2, 2, '#ff5a5a'); }
  else { critter(P, W / 2, H / 2, Math.floor(H * 0.3), '#2a8ac8', { ink: '#5affc8', mouth: '#5affc8', cheek: '#2a8ac8' }); for (let y = 2; y < H - 2; y += 2) P.hline(2, y, W - 4, 'rgba(90,255,200,0.12)'); P.hline(2, (r() * (H - 4)) | 0, W - 4, '#5affc8'); }
  P.hline(1, 1, W - 2, '#5a8aaa');
});
export const bigScreenTex = () => pt('dt_bigscr', 3.2, 1.8, (g, W, H, r, P) => {
  P.fill('#0e1a26'); P.rect(2, 2, W - 4, 12, '#1e6a8a'); ptext(P, 'TOKON DEX  -  ALAMO REGION', W / 2, 8, '#c8f4ff', { font: 3, s: 1 });
  const cols = ['#ff7a3a', '#4aa8f0', '#ff5a8a', '#5ad86a', '#ffd84a', '#b06aff', '#ff9a4a', '#5ac8c8'];
  for (let i = 0; i < 12; i++) { const x = 6 + (i % 6) * 16, y = 18 + Math.floor(i / 6) * 19; P.rect(x, y, 14, 17, '#12304a'); critter(P, x + 7, y + 8, 4, i < 7 ? cols[i] : '#2a5a7a', { ink: i < 7 ? '#0e1a26' : '#1e4a6a', ears: i < 7, mouth: '#e85a6a', cheek: i < 7 ? '#ffb0c0' : '#2a5a7a' }); ptext(P, String(i + 1).padStart(3, '0'), x + 7, y + 15, '#5a8aaa', { font: 3, s: 1 }); }
});
export const bookshelfTex = (seed = 0, wM = 2) => pt('dt_books' + seed + wM, wM, 2.2, (g, W, H, r, P) => {
  P.fill('#7a5236'); const rows = 5, rh = Math.floor((H - 6) / rows);
  for (let i = 0; i < rows; i++) {
    const y0 = 3 + i * rh, yb = y0 + rh; P.rect(3, y0, W - 6, rh - 2, '#3a2418');
    let x = 4; while (x < W - 6) {
      if (r() < 0.07) { disc(P, x + 3, yb - 6, 3, pick(r, ['#5ac8ff', '#5ad86a'])); P.rect(x + 2, yb - 3, 3, 2, '#c8a060'); x += 8; continue; }
      const w = 2 + Math.floor(r() * 3), h = rh - 4 - Math.floor(r() * 5), c = pick(r, ['#c8303a', '#2a6ab0', '#3a8a4a', '#e8c040', '#8a3a8a', '#f0e8d8', '#2a2a34', '#e87a3a', '#5ac8c0']);
      P.rect(x, yb - 2 - h, w, h, c); P.vline(x, yb - 2 - h, h, light(c, 0.2)); if (h > 8) P.hline(x, yb - h + 2, w, light(c, 0.5)); x += w + (r() < 0.15 ? 2 : 0);
    }
    P.rect(2, yb - 2, W - 4, 2, '#9a6a44');
  }
  P.rect(0, 0, W, 3, '#9a6a44');
});
export const whiteboardTex = () => pt('dt_wboard', 2.2, 1.2, (g, W, H, r, P) => {
  P.fill('#c8ccd4'); P.rect(2, 2, W - 4, H - 6, '#fbfbf8');
  critter(P, 14, 16, 6, '#ffffff', { ink: '#2a5ab0', mouth: '#2a5ab0', cheek: '#ffffff' }); for (let x = 24; x < 34; x++) P.px(x, 16, '#e8303a'); P.px(32, 15, '#e8303a'); P.px(32, 17, '#e8303a');
  critter(P, 46, 16, 8, '#ffffff', { ink: '#2a5ab0', mouth: '#2a5ab0', cheek: '#ffffff' }); ptext(P, 'LV 16?', 46, 30, '#e8303a', { font: 3, s: 1 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) P.rect(56 + i * 4, 6 + j * 4, 3, 3, (i + j) % 3 ? '#5ab86a' : '#e8303a');
  for (let k = 0; k < 4; k++) P.hline(4, 30 + k * 2, 10 + r() * 14, '#2a2a34');
  P.rect(W - 18, H - 6, 12, 2, '#3a7ad8'); P.rect(0, H - 4, W, 4, '#a8acb4');
});
export const rugTex = () => pt('dt_rug', 4, 3, (g, W, H, r, P) => {
  P.fill('#2a8a84'); P.rect(4, 4, W - 8, H - 8, '#3aa8a0'); P.rect(8, 8, W - 16, H - 16, '#2a8a84');
  for (let x = 4; x < W - 4; x += 6) { P.px(x, 2, '#f0c040'); P.px(x, H - 3, '#f0c040'); }
  const cx = W / 2, cy = H / 2; for (let y = -22; y <= 22; y++) for (let x = -22; x <= 22; x++) { const d = Math.hypot(x, y); if (d <= 22) P.px(cx + x, cy + y, d > 19 ? '#1e1e28' : Math.abs(y) < 3 ? '#1e1e28' : y < 0 ? '#e8473a' : '#f4f0ea'); } disc(P, cx, cy, 6, '#1e1e28'); disc(P, cx, cy, 3, '#f4f0ea');
});
export const tramMapTex = () => pt('dt_trammap', 1.2, 1.7, (g, W, H, r, P) => {
  P.fill('#f4f0e8'); P.rect(0, 0, W, 10, '#c8303a'); ptext(P, 'TRAM', W / 2, 5, '#ffffff', { font: 3, s: 1 });
  const stops = ['WHARF', 'CHINATOWN', 'VAN NESS', 'MARKET', 'SUNSET']; P.rect(7, 14, 2, H - 22, '#c8303a');
  stops.forEach((s, i) => { const y = 16 + i * ((H - 26) / 4); disc(P, 8, y, 2, i === 3 ? '#f0c040' : '#c8303a'); ptext(P, s, 13, y, '#2a2a34', { font: 3, s: 1, align: 'left' }); });
  ptext(P, 'YOU ARE HERE', W / 2, H - 4, '#c8303a', { font: 3, s: 1 });
});
// ---------------------------------------------------------------- signs
export const signs = {
  lab: () => signBoard('lab', 'TOKON LAB', 5.4, 1.0, { bg: '#f4f8f6', fg: '#1e6a64', frame: '#3ab8a0', sub: 'PROF. AOI  RESEARCH', subCol: '#3a8a84', shadow: false, icon: (P, W, H) => { for (const sx of [12, W - 26]) { for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) { const d = Math.hypot(x, y); if (d <= 10) P.px(sx + 7 + x, H / 2 + y, d > 8.5 ? '#1e1e28' : Math.abs(y) < 2 ? '#1e1e28' : y < 0 ? '#e8473a' : '#ffffff'); } } } }),
  mart: () => signBoard('mart', 'MOMO MART', 6, 0.9, { bg: '#ff8ab0', fg: '#ffffff', frame: '#5ab86a', sub: 'OPEN 24 HOURS', subCol: '#fff4c0', stripe: '#5ab86a' }),
  boba: () => signBoard('boba', 'BUBBLE MOON', 5, 0.8, { bg: '#b890e0', fg: '#ffffff', frame: '#7a4ab8', sub: 'BOBA  TEA  CAFE', subCol: '#fff4c0' }),
  games: () => signBoard('games', 'PIXEL PALACE', 8, 1.0, { bg: '#1e1e28', fg: '#5aff9a', frame: '#ff4a8a', sub: 'GAMES  CARDS  GEAR', subCol: '#ffe04a' }),
  ramen: () => signBoard('ramen', 'RAMEN KAZE', 7, 0.9, { bg: '#e8303a', fg: '#fff4d8', frame: '#2a1a1a', sub: 'NOODLES  GYOZA', subCol: '#ffe04a' }),
  arena: () => signBoard('arena', 'STREET ARENA', 6.6, 1.1, { bg: '#1e1e28', fg: '#ffe04a', frame: '#ff4a8a', sub: 'TOKON BATTLES DAILY', subCol: '#5ad8ff' }),
  flowers: () => signBoard('flow', 'PETAL & STEM', 6, 0.8, { bg: '#5ab86a', fg: '#ffffff', frame: '#2a6a3a', sub: 'FLOWERS', subCol: '#ffe8f0' }),
  parking: () => signBoard('park', 'PARKING', 3.4, 0.9, { bg: '#2a5ad8', fg: '#ffffff', frame: '#1e3a8a', sub: '$3 / HOUR', subCol: '#ffe04a' }),
  food: () => signBoard('food', 'FOOD TRUCK ALLEY', 6.4, 0.9, { bg: '#f08a3a', fg: '#ffffff', frame: '#a8501e', sub: 'EAT  SIT  CHILL', subCol: '#fff4c0' }),
  mission: () => signBoard('mission', 'MISSION ST', 2.2, 0.4, { bg: '#2a7a4a', fg: '#ffffff', frame: '#f4f0e8', bolts: false }),
  fifth: () => signBoard('fifth', '5TH ST', 1.6, 0.4, { bg: '#2a7a4a', fg: '#ffffff', frame: '#f4f0e8', bolts: false }),
};
