// Wheezowl — the family Tokonmon who raised you (a Weezer homage). A round, kind little owl
// mom: heather-blue feathers knitted like a cosy cardigan (ribbed cuffs, suede elbow patches,
// a cream button placket), a mustard argyle sweater-vest bib, cream legwarmers, a warm tawny
// head with a cream facial disc and a neat, dark, side-parted fringe — and her thick black
// Buddy-Holly glasses, a separate part that slides down her beak, fogs up and gets pushed back
// up with one wingtip. She wheezes: her hoot is a squeaky, asthmatic "hoo-hee-hee" in puffs.
// Story clips: wheeze (the wake-up call), talk, cook (stirring a pot), hug (toward +z).
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { shade, feathers, gradient, layer, on, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance } from './eyes.js';
import { B, L, both, twin, acc, region, ell, knit, rib, goldP, strapP, formMap, plant, beat, env, SPFX } from './story_parts.js';

const C = {
  knit: '#5878bc', knitHi: '#88a8e4', knitLo: '#3a5494', knitDeep: '#24366a',
  vest: '#e2b440', vestHi: '#f6d878', vestLo: '#b8862a', arg: '#c0603a', argLo: '#8a3e26', argLine: '#fff2cc',
  cream: '#f6ead0', creamHi: '#fffaf0', creamLo: '#d6c09a', disc: '#f6e8cc', discLo: '#dcc49a', ruff: '#6e4c30',
  head: '#a8845e', headHi: '#cca67c', headLo: '#76563a',
  hair: '#3a2a22', hairHi: '#6c4e3c', hairLo: '#1c120e',
  beak: ['#f8e4b0', '#dcae58', '#ac7a32', '#6a441c'], mouth: '#5a1c24', tongue: '#e8788a',
  foot: '#e8b850', footHi: '#f8d880', footLo: '#b08030', talon: '#2a1c18',
  glass: '#18141a', glassHi: '#5c5466',
  patch: '#8a5a3a', patchLo: '#5e3a24', warm: '#ece2c8', warmLo: '#c8b896',
  pot: '#d84a32', potHi: '#ff7a5a', potLo: '#962a1e', stew: '#c8742a', wood: '#c89058', woodLo: '#8a5a30',
  scarf: '#38a6ee', scarfLo: '#1e6eb8', sweater: '#962a3c', sweaterHi: '#c4485a', sweaterLo: '#5e1624',
  foam: '#ff8a2a', foamLo: '#c8561a',
};

// ---------------------------------------------------------------- painters
const knitP = knit(C.knit, { hi: C.knitHi, lo: C.knitLo });
const cuffP = rib(C.knitLo, { hi: C.knit, lo: C.knitDeep });
// the body's front: the cardigan's cream button plackets either side of the vest, cream chest feathers in the V
const bodyFront = (p, w, h, f) => {
  knitP(p, w, h, f);
  const X = (mx) => Math.round(((mx + 7) / 14) * w), Y = (my) => Math.round(((13.4 - my) / 10.4) * h);
  region(p, w, h, (x, y) => x >= X(-4.6) && x < X(4.6) && y < Y(8.4), (x, y) => ((y % 3 === 0 && (x + (y >> 1)) % 4 === 0) ? C.creamLo : C.cream));
  for (const x0 of [X(-5.4), X(4.6)]) {
    for (let y = 0; y < h - 1; y++) { p.px(x0, y, C.cream); p.px(x0 + 1, y, y % 3 === 0 ? C.creamLo : C.creamHi); p.px(x0 + 2, y, C.knitLo); }
    for (let y = 3; y < h - 3; y += 6) { p.px(x0, y, C.patch).px(x0 + 1, y, C.patchLo).px(x0, y + 1, C.patchLo).px(x0 + 1, y + 1, C.patchLo); }
  }
};
// the sweater-vest bib: mustard argyle with a V neck (cut out) and ribbed edges
const vestP = (p, w, h, f) => {
  if (f !== 'south') { rib(C.vest, { hi: C.vestHi, lo: C.vestLo })(p, w, h, f); return; }
  const cx = w / 2, vd = Math.round(h * 0.4), sl = (w * 0.3) / vd, hem = 4, dw = 9.4, dh = 11;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const off = Math.abs(x + 0.5 - cx), vEdge = (vd - y) * sl;
    if (y < vd && off < vEdge) continue;                                        // the V neck
    let col;
    if (y >= h - hem) col = x % 2 ? C.vestLo : C.vest;                          // ribbed hem
    else if ((y < vd + 2 && off < vEdge + 2.6) || x === 0 || x === w - 1) col = (x + y) % 2 ? C.vestLo : shift(C.vestLo, -0.12);   // ribbed V trim and sides
    else {
      const a = (x + 0.5) / dw + (y + 0.5 - 2) / dh, b = (x + 0.5) / dw - (y + 0.5 - 2) / dh, fa = a - Math.floor(a), fb = b - Math.floor(b);
      const odd = (Math.floor(a) + Math.floor(b)) & 1;
      col = odd ? ramp([C.arg, C.arg, C.argLo], y / h, x, y) : ramp([C.vestHi, C.vest, C.vestLo], y / h, x, y);
      if ((fa < 0.09 || fb < 0.09) && (x + y) % 3 !== 0) col = C.argLine;        // the dashed overcheck
    }
    p.px(x, y, col);
  }
};
const headP = feathers(C.head, { top: C.headHi, bottom: C.headLo, size: 5 });
// the face: a cream facial disc round the eyes (two rounds and a soft lower lobe), a dark ruff edge,
// fine radiating feather lines and a darker V of feathers down to the beak
const HEAD = { x0: -7.6, top: 23, w: 15.2, h: 9.8 };
const faceP = (p, w, h, f) => {
  headP(p, w, h, f);
  const X = (mx) => ((mx - HEAD.x0) / HEAD.w) * w, Y = (my) => ((HEAD.top - my) / HEAD.h) * h, S = w / HEAD.w;
  const lobes = [[X(-3.5), Y(18.4)], [X(3.5), Y(18.4)]], r = 4.3 * S, low = [X(0), Y(15.6)], lrx = 4.8 * S, lry = 2.9 * S;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (lobes.some(([cx, cy]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 < r * r) || ((x + 0.5 - low[0]) / lrx) ** 2 + ((y + 0.5 - low[1]) / lry) ** 2 < 1);
  const ring = (x, y) => inside(x, y) || [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => inside(x + dx, y + dy));
  region(p, w, h, ring, C.ruff);
  region(p, w, h, inside, (x, y) => {
    const [cx, cy] = x < w / 2 ? lobes[0] : lobes[1], a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx), d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    const line = d > r * 0.72 && Math.abs(((a / (Math.PI * 2)) * 18 + 20) % 1 - 0.5) < 0.09;
    return line ? C.discLo : ramp([C.creamHi, C.disc, C.discLo], y / h, x, y);
  }, C.ruff);
  // the V between the eyes, down to the beak
  const cx = X(0);
  for (let k = 0; k < 7; k++) { const y = Math.round(Y(21.2) + k), hw = Math.max(0, 3 - k * 0.45); for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) if (inside(x, y)) p.px(x, y, k < 2 ? C.headLo : C.head); }
};
// her hair: a dark, neat cap with a side part (at x = +2.6) and a fringe swept over to her right
const hairP = (part) => (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let col = ramp([C.hairHi, C.hair, C.hairLo], f === 'up' ? 0.3 : f === 'down' ? 1 : y / Math.max(1, h - 1), x, y);
    const dir = part != null && x > part ? 1 : -1, k = (((x + y * dir) % 5) + 5) % 5;
    if (k === 0) col = shift(col, 0.22);
    else if (k === 2) col = shift(col, -0.18);
    p.px(x, y, col);
  }
  if (f === 'up' && part != null) for (let y = 0; y < h; y++) p.px(part, y, C.hairLo);
};
// the swept fringe: strands flowing from the part toward her right, a sheen band, a tapered tip
const fringeP = (taper) => (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let col = ramp([C.hairHi, C.hair, C.hairLo], f === 'up' ? 0.2 : f === 'down' ? 1 : y / Math.max(1, h - 1), x, y);
    const k = (((x + y * 2) % 6) + 6) % 6;
    if (k === 0) col = shift(col, 0.2); else if (k === 3) col = shift(col, -0.2);
    if (f !== 'up' && f !== 'down' && y === 1 && x % 3 !== 0) col = '#8a6a54';
    p.px(x, y, col);
  }
  if (f !== 'south' && f !== 'north') return;
  for (let x = 0; x < w; x++) { const u = taper > 0 ? 1 - x / (w * taper) : (x - w * (1 + taper)) / (-w * taper); const cut = Math.round(Math.max(0, u) * (h - 2)); for (let k = 0; k < cut; k++) p.px(f === 'north' ? w - 1 - x : x, h - 1 - k, 0); }
};
const beakTop = (p, w, h, f) => { if (f === 'down') { p.rect(0, 0, w, h, C.mouth); return; } gradient(C.beak, { edge: C.beak[3] })(p, w, h, f); if (f === 'south') { p.px(1, 1, '#fffae0'); p.px(1, 2, C.beak[0]); } };
const beakTip = gradient([C.beak[1], C.beak[2], C.beak[3], '#3a2410']);
const beakLow = (p, w, h, f) => { if (f === 'up') { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 1, C.tongue); return; } gradient([C.beak[0], C.beak[1], C.beak[2]], { edge: C.beak[3] })(p, w, h, f); };
// the glasses: thick black Buddy-Holly rims — a heavy brow bar, rounded lower corners — with a lens glint
const SPEC = { x0: -6.667, y0: 15.6, w: 13.333, h: 6, cx: 3.5, cy: 18.6, hw: 3.17, hh: 3 };
const lensAt = (w, h) => { const s = w / SPEC.w; return [[(SPEC.x0 * -1 - SPEC.cx) * s, (SPEC.y0 + SPEC.h - SPEC.cy) * s], [(SPEC.x0 * -1 + SPEC.cx) * s, (SPEC.y0 + SPEC.h - SPEC.cy) * s], SPEC.hw * s, SPEC.hh * s]; };
const inLens = (dx, dy, hw, hh, top, bot, sideT) => { const u = Math.abs(dx) / (hw - sideT), v = dy < 0 ? -dy / (hh - top) : dy / (hh - bot); return u ** (dy < 0 ? 6 : 2.6) + v ** (dy < 0 ? 6 : 2.6) <= 1; };
const glassesP = (p, w, h) => {
  const [a, b, hw, hh] = lensAt(w, h);
  for (const [cx, cy] of [a, b]) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    if (!inLens(dx, dy, hw, hh, 0, 0, 0)) continue;
    if (inLens(dx, dy, hw, hh, 4, 2.2, 2.2)) { const g = Math.round(dx + dy); if (dx > 2 && dy < -1.5 && (g === 2 || g === 3)) p.px(x, y, g === 2 ? '#ffffff' : '#dceaff'); continue; }   // the lens: clear, a diagonal glint
    p.px(x, y, dy < -hh + 1.2 && Math.abs(dx) < hw - 2 ? C.glassHi : C.glass);
  }
  for (let x = Math.floor(a[0] + hw - 2); x <= Math.ceil(b[0] - hw + 2); x++) for (let y = 2; y < 5; y++) p.px(x, y, y === 2 ? C.glassHi : C.glass);   // the bridge
};
const fogP = (p, w, h) => {
  const [a, b, hw, hh] = lensAt(w, h);
  for (const [cx, cy] of [a, b]) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (inLens(dx, dy, hw, hh, 4, 2.2, 2.2) && ((x + y) % 2 === 0 || dy > 1)) p.px(x, y, dy > 1 ? '#e4ecf8' : '#f6faff'); }
};
const templeP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? C.glassHi : C.glass); };
// wings: cardigan sleeves with a suede elbow patch on the outside
const wingP = layer(knitP, on(['west'], (p, w, h) => {
  const cx = w * 0.42, cy = h * 0.6, rx = w * 0.22, ry = h * 0.2;
  region(p, w, h, ell(cx, cy, rx, ry), (x, y) => ((x + y) % 5 === 0 ? C.patchLo : y < cy - ry * 0.4 ? shift(C.patch, 0.12) : C.patch), C.patchLo);
  for (let a = 0; a < 24; a += 2) { const t = (a / 24) * Math.PI * 2; p.px(Math.round(cx + Math.cos(t) * (rx - 1.6)), Math.round(cy + Math.sin(t) * (ry - 1.6)), C.warm); }
}));
// barred owl primaries poking out of the cuff (her "fingers")
const primP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'down' ? C.ruff : y % 3 === 2 ? C.ruff : ramp([C.cream, C.creamLo], y / h, x, y)); };
const warmP = (p, w, h, f) => { rib(C.warm, { hi: C.cream, lo: C.warmLo })(p, w, h, f); if (f !== 'up' && f !== 'down') for (let x = 0; x < w; x++) { p.px(x, 2, C.knit); p.px(x, 3, C.knitLo); } };
const footP = (p, w, h, f) => { gradient([C.footHi, C.foot, C.footLo])(p, w, h, f); if (f === 'up') for (let y = 1; y < h; y += 2) for (let x = (y >> 1) % 2; x < w; x += 2) p.px(x, y, C.footLo); };
const toeP = (p, w, h, f) => { footP(p, w, h, f); if (f === 'south') for (let x = 0; x < w; x++) for (let y = Math.floor(h * 0.35); y < h; y++) p.px(x, y, y === h - 1 || x === 0 ? '#120a0a' : C.talon); };
const tailP = layer(knitP, (p, w, h, f) => { if (f === 'up' || f === 'down') return; for (let y = h - 4; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x % 4 === 3) ? C.ruff : y % 2 ? C.cream : C.creamLo); });
// the cooking pot: red enamel, cream inside, a bubbling stew
const potP = (p, w, h, f) => { shade(C.pot, { top: C.potHi, bottom: C.potLo })(p, w, h, f); if (f !== 'up' && f !== 'down') { for (let x = 0; x < w; x++) p.px(x, 1, C.potHi); for (let k = 0; k < 6; k++) p.px((k * 7 + 3) % w, 3 + ((k * 5) % Math.max(1, h - 5)), '#ffe0d0'); } };
const rimP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'up' ? (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? C.potLo : '#f4ecdc') : C.potHi); };
const stewP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x * 5 + y * 3) % 11 === 0 ? '#ffb85a' : (x * 3 + y * 7) % 13 === 0 ? '#6aa83a' : (x + y * 2) % 9 === 0 ? '#e8d0a0' : C.stew); };
const woodP = gradient([shift(C.wood, 0.15), C.wood, C.woodLo]);

// drip painters
const scarfP = (p, w, h, f) => { knit(C.scarf, { lo: C.scarfLo, rim: false })(p, w, h, f); if (f === 'up' || f === 'down') return; for (let y = 0; y < h; y++) if (y % 7 >= 5) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 4 === 0 ? C.creamLo : C.creamHi); };
const scarfEndP = (p, w, h, f) => { scarfP(p, w, h - 2, f); if (f === 'up' || f === 'down') return; for (let x = 0; x < w; x++) for (let y = h - 2; y < h; y++) if (x % 2 === 0) p.px(x, y, C.creamHi); else p.px(x, y, 0); };
const pinBody = (p, w, h, f) => { shade('#e82a3a', { top: '#ff6a6a', bottom: '#8a1020' })(p, w, h, f); if (f === 'south') { p.rect(1, 1, w - 2, h - 3, '#f8f0e0'); p.px(Math.floor(w / 2), Math.floor(h / 2), '#18141a'); p.rect(1, h - 2, w - 2, 1, '#ffd84a'); } };
const sweaterP = (p, w, h, f) => {
  knit(C.sweater, { hi: C.sweaterHi, lo: C.sweaterLo })(p, w, h, f);
  if (f === 'up' || f === 'down') return;
  for (let x = 0; x < w; x++) { for (let y = h - 4; y < h; y++) p.px(x, y, x % 2 ? C.sweaterLo : C.sweater); }
  if (f !== 'south') return;
  // the zigzag stripe: a cream band across the chest, a run of sharp W-ish peaks (not a logo)
  const y0 = Math.round(h * 0.3);
  for (let x = 0; x < w; x++) { for (let y = y0 - 4; y <= y0 + 5; y++) p.px(x, y, '#2a1820'); const z = Math.abs(((x + 2) % 8) - 4); for (let k = 0; k < 3; k++) p.px(x, y0 - 2 + z + k, k === 1 ? C.creamHi : C.cream); }
  for (let x = 0; x < w; x++) { p.px(x, y0 - 5, C.cream); p.px(x, y0 + 6, C.cream); }
};
const phonesP = (p, w, h, f) => { shade('#2a2630', { top: '#5a5464', bottom: '#141218' })(p, w, h, f); if (f === 'east' || f === 'west') { region(p, w, h, ell(w / 2, h / 2, w * 0.36, h * 0.36), '#c8ccd8', '#8a90a0'); p.px(Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, '#ffffff'); } };
const foamP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x * 3 + y * 5) % 7 === 0 ? C.foamLo : (x + y) % 5 === 0 ? '#ffb05a' : C.foam); };
const bandP = gradient(['#ffffff', '#c8ccd8', '#8a90a0', '#5a6070']);
// the electric guitar: a sunburst body, cream pickguard, three pickups, a rosewood neck with dots
const gtrBody = (p, w, h, f) => {
  const cx = w / 2, cy = h * 0.55;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot((x + 0.5 - cx) / (w / 2), (y + 0.5 - cy) / (h / 2)); p.px(x, y, d < 0.45 ? '#ffd23a' : d < 0.7 ? '#f08a1e' : d < 0.92 ? '#b8301a' : '#2a0e0a'); }
  if (f !== 'south' && f !== 'north') return;
  region(p, w, h, (x, y) => x > w * 0.12 && x < w * 0.7 && y > h * 0.18 && y < h * 0.86 && !(x < w * 0.3 && y < h * 0.4), '#f6f0e4', '#c8bca8');
  for (const yy of [0.32, 0.48, 0.64]) p.rect(Math.round(cx - 3), Math.round(h * yy), 6, 1, '#18141a');
  p.rect(Math.round(cx - 3), Math.round(h * 0.8), 6, 1, '#d8dce8');
  for (const dx of [-2, -1, 0, 1, 2]) for (let y = 0; y < h * 0.8; y++) if (y % 3) p.px(Math.round(cx + dx), y, '#e8e4dc');
};
const neckP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'south' || f === 'north' ? (y % 4 === 0 ? '#d8d0c0' : '#5a2e18') : '#e8c890'); if (f === 'south') for (let y = 6; y < h; y += 8) p.px(Math.floor(w / 2), y, '#f4f0e8'); };
const headstockP = (p, w, h, f) => { shade('#f0e4c8', { top: '#ffffff', bottom: '#c8b894' })(p, w, h, f); if (f === 'south') for (let y = 1; y < h; y += 2) p.px(0, y, '#c8ccd8'); };
// hibiscus lei ("Island in the Sun")
const flower = (c, cLo) => (p, w, h, f) => {
  if (f !== 'south') { shade('#3a8a3a', { top: '#6ab84a', bottom: '#1e5a24' })(p, w, h, f); return; }
  const cx = w / 2, cy = h / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx), r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / (w / 2), R = 0.7 + 0.3 * Math.abs(Math.cos(a * 2.5)); if (r < R) p.px(x, y, r < 0.28 ? '#ffe86a' : r > R - 0.22 ? cLo : c); else p.px(x, y, '#3a8a3a'); }
};

// ---------------------------------------------------------------- the model
const FOOT = [
  B([-4.8, 0, -1.0], [3.2, 1.0, 3.0], footP),
  B([-5.0, 0, 1.8], [1.0, 0.8, 1.8], toeP, { pivot: [-4.5, 0.4, 2], rot: [0, -14, 0] }),
  B([-3.7, 0, 2.0], [1.0, 0.8, 2.0], toeP),
  B([-2.4, 0, 1.8], [1.0, 0.8, 1.8], toeP, { pivot: [-1.9, 0.4, 2], rot: [0, 14, 0] }),
];
const WING = [
  B([-9.2, 4.6, -4.6], [2.2, 8.4, 9.0], wingP),
  B([-8.8, 11.6, -3.8], [1.8, 1.6, 7.4], knitP),
  B([-9.4, 3.4, -4.4], [2.6, 1.4, 8.6], cuffP),
  B([-9.1, 1.4, -3.8], [1.8, 2.2, 2.4], primP), B([-9.1, 1.0, -1.2], [1.8, 2.6, 2.4], primP), B([-9.1, 1.4, 1.4], [1.8, 2.2, 2.4], primP),
];
// the pin sits high on the right sleeve's outside
const PIN = [
  B([-9.6, 8.6, -0.4], [0.4, 2.0, 2.2], pinBody), B([-9.55, 10.6, 0.5], [0.3, 2.2, 0.5], neckP), B([-9.6, 12.6, 0.3], [0.4, 0.8, 0.9], headstockP),
];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.5, 18.6, 6.24], line: '#2a1810', iris: '#f2a028', irisDark: '#a8581a', accent: '#ffd878', extra: ['smug', 'glint'], map: { open: [
  '............',
  '.llllllllll.',
  'llllllllllll',
  '.IIIIIIIIII.',
  '.IIkkkkkkII.',
  '.ihhkkkkkii.',
  '.ihhkkkkkii.',
  '.iikkkkkkii.',
  '.iikkkkkhii.',
  '.iiikkkkiii.',
  '.ciiiiiiiic.',
  '..cccccccc..',
] } });
const LEI = [[-5.4, 11.2], [-3.9, 9.6], [-2.0, 8.6], [0, 8.2], [2.0, 8.6], [3.9, 9.6], [5.4, 11.2]];
const LEIC = [['#e8283a', '#9a1020'], ['#ff8ab4', '#c84a7a'], ['#ffd23a', '#d08a1a']];
export const def = {
  name: 'wheezowl', ppu: 3, scale: 0.44, outline: { color: '#1a1016', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'footR', parent: 'root', pivot: [-3.2, 1.0, 0.6], cubes: FOOT }),
    ...twin({ name: 'legR', parent: 'root', pivot: [-3.2, 3.8, 0.4], cubes: [B([-4.6, 0.9, -1.0], [2.8, 2.9, 2.8], warmP)] }),
    { name: 'body', parent: 'root', pivot: [0, 4, 0], cubes: [
      B([-7, 3, -6], [14, 10.4, 12.4], knitP, { faces: { south: bodyFront } }),
      B([-7.6, 4.4, -5.4], [15.2, 7.6, 10.8], knitP),
      B([-6.4, 2.2, -5.2], [12.8, 0.8, 10.4], knitP),
      B([-4.6, 3.4, 6.4], [9.2, 9.6, 0.65], vestP),
      // the scarf (tier 1): a chunky sky-blue knit wrapped round the neck
      ...acc('acc-scarf', [B([-7.4, 11.4, 5.9], [14.8, 3.0, 1.4], scarfP), B([-7.4, 11.4, -7.0], [14.8, 3.0, 1.2], scarfP), ...both(B([-8.2, 11.4, -7.0], [0.8, 3.0, 14.4], scarfP))]),
      // the sweater (tier 2): a burgundy pullover with a zigzag stripe, over the vest
      ...acc('acc-sweater', [B([-7.9, 2.8, -6.6], [15.8, 10.8, 13.8], sweaterP), B([-6.4, 12.6, -5.6], [12.8, 1.2, 11.6], rib(C.sweater, { hi: C.sweaterHi, lo: C.sweaterLo }))]),
      // the hibiscus lei (tier 3)
      ...acc('acc-lei', LEI.map(([x, y], i) => B([x - 0.9, y - 0.9, 7.25], [1.8, 1.8, 0.8], flower(...LEIC[i % 3])))),
      ...acc('acc-lei', both(B([-7.4, 10.6, -3], [0.8, 1.6, 6], flower(...LEIC[1])))),
      // the guitar strap (tier 3), across the chest
      ...acc('acc-guitar', [B([-7.2, 9.2, 7.25], [14.4, 0.8, 0.4], strapP('#2a1a14'), { pivot: [0, 9.6, 7.45], rot: [0, 0, 32] })]),
    ] },
    { name: 'scarfEnd', parent: 'body', pivot: [5.2, 12.4, -7.0], cubes: acc('acc-scarf', [B([4.0, 5.6, -7.8], [2.4, 7.0, 0.8], scarfEndP)]) },
    { name: 'thread', parent: 'body', pivot: [3.4, 2.8, 7.2], cubes: acc('acc-sweater', [B([3.25, 1.0, 7.05], [0.34, 1.8, 0.34], gradient([C.sweaterHi, C.sweater, C.sweaterLo]))]) },
    { name: 'guitar', parent: 'body', pivot: [0, 8, -6.8], rot: [0, 0, -36], cubes: acc('acc-guitar', [
      B([-3.4, 2.6, -8.2], [6.8, 6.2, 1.4], gtrBody), B([-4.0, 3.4, -8.15], [0.8, 3.4, 1.3], gtrBody), B([3.2, 4.2, -8.15], [0.8, 3.8, 1.3], gtrBody),
      B([-0.5, 8.8, -8.0], [1.0, 8.4, 1.0], neckP), B([-0.8, 17.2, -8.05], [1.6, 2.6, 0.9], headstockP),
    ]) },
    { name: 'tail', parent: 'body', pivot: [0, 5.4, -6.2], cubes: [B([-3, 2.2, -7.4], [6, 4.4, 1.2], tailP, { pivot: [0, 5.4, -6.6], rot: [-26, 0, 0] })] },
    ...twin({ name: 'wingR', parent: 'body', pivot: [-7.2, 12.4, 0.4], cubes: WING }),
    { name: 'pin', parent: 'wingR', pivot: [-9.4, 10, 0.4], cubes: acc('acc-pin', PIN) },
    { name: 'spoon', parent: 'wingR', pivot: [-8.2, 1.4, 0.4], cubes: [B([-8.5, -5.6, 0.1], [0.6, 7.2, 0.6], woodP, { id: 'spoon', hide: true }), B([-8.9, -6.6, -0.3], [1.4, 1.2, 1.4], woodP, { id: 'spoon', hide: true })] },
    { name: 'pot', parent: 'root', pivot: [0, 0, 11.6], cubes: [
      B([-3.8, 0, 8.4], [7.6, 4.6, 6.4], potP, { id: 'pot', hide: true }),
      B([-4.2, 4.4, 8.0], [8.4, 0.8, 7.2], rimP, { id: 'pot', hide: true }),
      B([-3.4, 4.5, 8.8], [6.8, 0, 5.6], stewP, { plane: 'y', id: 'pot', hide: true }),
      ...both(B([-5.4, 3.2, 11.0], [1.2, 0.7, 1.2], shade('#2a2226'), { id: 'pot', hide: true })),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 13.6, 0], cubes: [
      B([-7.6, 13.2, -6.2], [15.2, 9.8, 12.4], headP, { faces: { south: faceP } }),
      B([-6.8, 23.0, -5.6], [13.6, 1.0, 11.2], headP),
      B([-7.0, 14.4, -6.8], [14.0, 8.6, 0.8], headP),
      B([-6.8, 12.8, -5.6], [13.6, 0.6, 11.2], shade(C.headLo)),
      B([-1.0, 15.0, 6.0], [2.0, 2.4, 1.4], beakTop),
      B([-0.7, 14.0, 6.7], [1.4, 1.4, 0.8], beakTip, { pivot: [0, 15.2, 7.0], rot: [16, 0, 0] }),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 15.0, 6.4], cubes: [B([-0.85, 14.2, 5.8], [1.7, 0.9, 1.2], beakLow)] },
    // the Buddy-Holly glasses: their own bone so they can slide, tilt, fog and be pushed up
    { name: 'specs', parent: 'head', pivot: [0, 18.6, 6.4], cubes: [
      B([SPEC.x0, SPEC.y0, 6.36], [SPEC.w, SPEC.h, 0], glassesP, { plane: 'z', outline: false }),
      B([SPEC.x0, SPEC.y0, 6.33], [SPEC.w, SPEC.h, 0], fogP, { plane: 'z', outline: false, id: 'fog', hide: true }),
      ...both(B([-7.85, 20.2, -2.8], [0.5, 0.667, 9.0], templeP), B([-7.6, 19.9, 5.8], [1.0, 1.0, 0.6], templeP)),
    ] },
    // the neat side-parted fringe
    { name: 'hair', parent: 'head', pivot: [0, 24, 2], cubes: [
      B([-7.0, 23.2, -5.8], [14.0, 1.4, 11.8], hairP(29)),
      B([-7.0, 19.6, -6.9], [14.0, 4.4, 1.0], hairP(null)),
      B([-7.8, 21.6, 5.9], [10.4, 2.6, 1.0], fringeP(0.45), { pivot: [2.6, 24.4, 6.4], rot: [-4, 0, 4] }),
      B([2.6, 22.6, 5.8], [5.2, 1.8, 0.9], fringeP(-0.5), { pivot: [2.6, 24.0, 6.3], rot: [-4, 0, -5] }),
      // the headphones (tier 2): a silver band over the hair, orange foam pads at the sides
      ...acc('acc-phones', [B([-8.4, 25.0, -0.8], [16.8, 0.8, 1.6], bandP), ...both(B([-8.6, 19.4, -0.8], [0.8, 5.8, 1.6], bandP), B([-9.6, 16.4, -2.2], [1.8, 4.2, 4.4], phonesP), B([-8.3, 16.8, -1.8], [0.6, 3.4, 3.6], foamP))]),
    ] },
  ],
  drip: [
    [{ id: 'acc-scarf', name: 'Sky-blue knit scarf' }, { id: 'acc-pin', name: 'Electric-guitar pin' }],
    [{ id: 'acc-sweater', name: 'Zigzag-stripe sweater' }, { id: 'acc-phones', name: 'Foam headphones' }],
    [{ id: 'acc-guitar', name: 'Sunburst electric guitar' }, { id: 'acc-lei', name: 'Hibiscus lei' }],
  ],
  attach: {
    head: { bone: 'hair', at: [0, 25.2, 0], size: 13 },
    face: { bone: 'specs', at: [0, 18.6, 6.6], size: 13 },
    neck: { bone: 'body', at: [0, 12.6, 6.2], size: 12 },
    back: { bone: 'body', at: [0, 8.4, -6.6], size: 10 },
  },
};
// the luxury form: the cardigan turns black lacquer, the vest, face and stew gold, the glasses gold-rimmed
def.dripForm = {
  map: formMap(({ h, s, l }, glow, hex) => (hex === C.glass ? '#e8b830' : hex === C.glassHi ? '#fff2b0' : s < 0.14 ? 'keep' : h >= 180 && h < 300 ? 'black' : h < 75 && s > 0.6 && l > 0.45 ? 'gold' : undefined)),
  fx: { note: SPFX.goldnote },
};

// ---------------------------------------------------------------- animation
const LEG = 2.9, LEGS = ['legR', 'legL'];
const MOUTH = [0, 14.4, 8.4], TOP = [0, 26, 2], GLASS = [2.8, 20.4, 6.8];
const talkJaw = (t, k = 1) => Math.max(0, Math.sin(t * Math.PI * 2 * 4.2)) * (0.55 + 0.45 * Math.sin(t * 7.3 + 1)) * k;
// both wings: z spread (+ = out), x swing (− = forward)
const wings = (P, out, fwd = 0, twist = 0) => P.rot('wingR', fwd, twist, -out).rot('wingL', fwd, -twist, out);
// lying on her back, feet up (she's round, so she rolls a little)
function onBack(P, k) {
  P.rot('root', -82 * k, 0, 0).pos('root', 0, 5.8 * k, -1.2 * k);
  P.rot('legR', -30 * k, 0, 8 * k).rot('legL', -30 * k, 0, -8 * k).rot('footR', -40 * k).rot('footL', -40 * k);
  wings(P, 70 * k, -10 * k).rot('tail', 30 * k, 0, 0).rot('head', 14 * k, 0, 0);
  P.rot('specs', 0, 0, 18 * k).pos('specs', 0.6 * k, -1.4 * k, 0.2 * k);
}
// stir the pot: the right wing (and the spoon on its tip) aims down into the pot, circling
function stir(P, t, k) {
  const a = -46 + 6 * Math.sin(t * Math.PI * 2 * 1.25), b = 24 + 7 * Math.cos(t * Math.PI * 2 * 1.25);
  P.rot('wingR', a * k, 0, b * k);
}
export const anim = {
  start: 'idle', seed: 13,
  breathe: { bone: 'body', amp: 0.02, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.6], dur: 0.12 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 5 },
  springs: [
    { bone: 'hair', tip: [0, 0, 5], k: 210, d: 10, gain: 0.5, max: 8, axes: [1, 0.3, 1] },
    { bone: 'specs', tip: [0, -2, 0], k: 260, d: 9, gain: 0.35, max: 6, axes: [1, 0, 1] },
    { bone: 'tail', tip: [0, -3, -2], k: 170, d: 8, gain: 0.8, max: 18 },
    { bone: 'scarfEnd', tip: [0, -6, -0.5], k: 120, d: 6, gain: 1.1, max: 30 },
    { bone: 'thread', tip: [0, -3, 0], k: 90, d: 5, gain: 1.4, max: 40 },
    { bone: 'wingR', tip: [-1, -8, 0], k: 230, d: 11, gain: 0.3, max: 10, axes: [1, 0, 1] },
    { bone: 'wingL', tip: [1, -8, 0], k: 230, d: 11, gain: 0.3, max: 10, axes: [1, 0, 1] },
  ],
  faces: {
    eyes: EYES.slot,
    fog: { default: 'off', states: { off: [], on: ['fog'] } },
    prop: { default: 'off', states: { off: [], pot: ['pot', 'spoon'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'swivel', 'polish'] },
  clips: {
    // a soft bob on her toes; every loop a curious owl head-tilt one way or the other, eyes darting
    idle: { len: 2.4, loop: true, f(P, t, c) {
      const b = bounce(t, 1.2, { squash: 0.05, stretch: 0.02 }), dy = b.u * 0.5 - 0.2;
      P.pos('body', 0, dy, 0).sq('body', b.sq); plant(P, LEGS, dy, LEG);
      const m = c.loopN % 3, tilt = seg(t, 0.55, 0.75, E.back) * (1 - seg(t, 1.8, 2.1, E.inout));
      P.rot('head', wave(t, 0.42) * 2, wave(t, 0.42, 1) * 6 + (m === 2 ? 14 * tilt : 0), (m === 0 ? 16 : m === 1 ? -13 : 0) * tilt);
      eyesAt(P, ...glance(t + c.loopN * 1.3, [[0, 0], [0.3, 0.08], [0, 0], [-0.3, 0], [0, -0.1]], 0.5));
      if (m !== 2 && tilt > 0.5) eyesScale(P, 1.06, 1.1);
      wings(P, 2 + b.u * 3, 0).rot('tail', wave(t, 0.8) * 5, wave(t, 0.42) * 8, 0);
      if (tilt > 0.4 && m === 0) P.face('eyes', 'glint');
    } },
    // a round little waddle
    walk: { len: 0.62, loop: true, f(P, t) {
      const ph = (t / 0.62) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph), dy = Math.abs(c2) * 0.7, lr = Math.max(0, s), ll = Math.max(0, -s);
      P.pos('body', 0, dy, 0).rot('body', 3, s * 6, s * 9).sq('body', -0.04 * (1 - Math.abs(c2)));
      P.pos('footR', 0, lr * 1.6, s * 1.6).rot('footR', -20 * lr, 0, 0).pos('footL', 0, ll * 1.6, -s * 1.6).rot('footL', -20 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.2 + dy * 0.5, s * 1.0).pos('legL', 0, ll * 1.2 + dy * 0.5, -s * 1.0);
      P.rot('head', 2 - dy * 3, -s * 4, -s * 6); wings(P, 10 + Math.abs(s) * 10, s * 8);
    } },
    // battle cry: crouch, then a big wheezy HOOO with rings, wings flung wide — and a squeak at the end
    cry: { len: 2.0, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.25, 0.4);
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.34, 0.52, E.back) * (1 - seg(t, 1.5, 1.85, E.inout)), squeak = bump(t, 1.15, 1.4);
      const dy = -1.6 * crouch + 0.8 * up; P.pos('body', 0, dy, 0).sq('body', -0.14 * crouch + 0.1 * up + wob(t, 1.85, 0.05, 3, 5)); plant(P, LEGS, dy, LEG);
      P.rot('head', 10 * crouch - 26 * up + 14 * squeak + wave(t, 11) * 2 * up, 0, wave(t, 6) * 3 * up).rot('jaw', 40 * up - 20 * squeak);
      wings(P, -10 * crouch + 95 * up + wave(t, 8) * 10 * up, -14 * up);
      P.scl('head', 1 + 0.06 * up, 1 + 0.06 * up, 1 + 0.06 * up);
      P.face('eyes', crouch > 0.3 ? 'angry' : squeak > 0.4 ? 'shock' : up > 0.3 ? 'shut' : undefined); P.blinkOK = up < 0.1;
      for (const r0 of [0.5, 0.72, 0.94]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 0.8, tint: [0.8, 0.9, 1] });
      if (t > 0.5 && t < 1.15) P.stream(SPFX.puff, 'head', MOUTH, { rate: 26, dir: [0, 0.6, 1], speed: 1.1 });
      P.burst(1.2, 'note', 'head', [3, 24, 4], {}).burst(1.25, 'sweat', 'head', [6.5, 21, 3], {});
    } },
    // physical: wind back and a big swinging wing-smack
    attack: { len: 0.95, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.26, E.out) * (1 - seg(t, 0.26, 0.34, E.in)), hit = seg(t, 0.28, 0.4, E.in3) * (1 - seg(t, 0.52, 0.92, E.inout));
      P.pos('root', 0, 0.6 * bk, -1.6 * bk + 4.6 * hit).rot('body', -8 * bk + 12 * hit, 28 * bk - 30 * hit, 0).rot('head', -10 * bk + 8 * hit, -16 * bk + 18 * hit, 0);
      P.rot('wingR', 50 * bk - 85 * hit, 0, -30 * bk + 40 * hit).rot('wingL', 0, 0, 20 * bk);
      P.sq('body', -0.07 * bk + wob(t, 0.42, 0.07, 4, 7)); P.blinkOK = false;
      P.face('eyes', bk > 0.3 ? 'angry' : hit > 0.3 ? 'shut' : undefined);
      P.burst(0.4, 'spark', 'body', [1, 9, 13], {}).burst(0.4, 'star', 'body', [1, 9, 13], { n: 4 }).burst(0.42, 'feather', 'wingR', [-8, 4, 6], { n: 3 });
    } },
    // special (sound): a deep breath, then a long wheezing hoot that rolls out as rings, puffs and notes
    special: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const draw = seg(t, 0.05, 0.5, E.inout) * (1 - seg(t, 0.55, 0.62)), blast = seg(t, 0.6, 0.7, E.out) * (1 - seg(t, 1.5, 1.8, E.inout));
      P.lookW = 1 - draw;
      P.scl('body', 1 + 0.1 * draw, 1 + 0.06 * draw, 1 + 0.1 * draw).rot('head', -8 * draw + 6 * blast + wave(t, 14) * 2 * blast, 0, 0).rot('jaw', 44 * blast);
      P.pos('root', 0, 0, -1.2 * blast).rot('body', -4 * draw + 6 * blast, 0, 0); wings(P, 30 * draw + 50 * blast + wave(t, 9) * 8 * blast, 10 * blast);
      P.pos('specs', 0, -0.5 * blast, 0.3 * blast);
      P.face('eyes', draw > 0.2 ? 'closed' : blast > 0.2 ? 'shut' : t > 1.75 ? 'happy' : undefined);
      if (t > 0.65 && t < 1.5) { P.stream('ring', 'head', MOUTH, { rate: 9, dir: [0, 0.05, 1], speed: 2.4, tint: [0.75, 0.88, 1] }); P.stream(SPFX.puff, 'head', MOUTH, { rate: 30, dir: [0, 0.1, 1], speed: 2.4, spread: 0.25 }); P.stream('note', 'head', MOUTH, { rate: 5, dir: [0, 0.3, 1], speed: 2 }); }
      P.burst(1.6, 'sweat', 'head', [6.5, 21, 3], {}).burst(1.62, 'sparkle', 'specs', GLASS, { n: 2 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.2 * k).rot('body', -16 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 15) * 4 * k).sq('body', -0.14 * k).rot('head', -12 * k, 0, 0).rot('jaw', 28 * k);
      wings(P, 50 * k, -10 * k).pos('specs', 0, -1.0 * k, 0).rot('specs', 0, 0, 10 * k);
      P.face('eyes', t < 0.45 ? 'x' : undefined); P.blinkOK = false;
      P.burst(0.02, 'feather', 'body', [0, 10, 0], { n: 6, speed: 1.3 }).burst(0.02, 'spark', 'body', [0, 10, 7], {}).burst(0.05, SPFX.puff, 'head', MOUTH, { n: 3 });
    } },
    // dizzy, glasses sliding, then she tips over backward with her feet in the air
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', 0, wave(t, 1.5) * 18 * dizzy, wave(t, 2.1) * 10 * dizzy).rot('head', 0, 0, wave(t, 2.1, 1) * 14 * dizzy).rot('jaw', 20 * dizzy);
      P.pos('body', 0, -0.8 * dizzy, 0); plant(P, LEGS, -0.8 * dizzy, LEG);
      P.pos('specs', 0, -1.2 * dizzy, 0).rot('specs', 0, 0, wave(t, 2.1) * 10 * dizzy);
      onBack(P, fall);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.9, 'star', 'head', TOP, { n: 5 }).burst(1.38, 'dust', 'root', [0, 0, -4], { n: 8 }).burst(1.38, 'feather', 'body', [0, 8, 0], { n: 4 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      onBack(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      const tw = bump(t, 0.5, 0.64) + bump(t, 0.76, 0.9);
      P.rot('footR', -20 * tw).rot('footL', 16 * tw);
      P.burst(1.2, 'star', 'head', [0, 22, 8], { n: 2 });
    } },
    // victory: a spinning hop, wings up, then the proud push of the glasses (with a glint)
    win: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.9 ? hop(t, 0.9, 6, { crouch: 1.4 }) : { y: wob(t, 0.9, -1.0, 3, 6), sq: wob(t, 0.9, -0.14, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq).rot('root', 0, 360 * seg(t, 0.2, 0.62, E.inout), 0);
      if (h.y < 0) plant(P, LEGS, h.y, LEG);
      const air = seg(t, 0.18, 0.3) * (1 - seg(t, 0.84, 0.95)), push = env(t, 1.15, 1.75, 0.15, 0.25);
      wings(P, 100 * air, -10 * air);
      P.rot('wingR', -40 * push, 0, 20 * push).pos('specs', 0, 0.5 * push, 0).rot('head', -12 * air - 6 * push, 0, 0).rot('jaw', 26 * air);
      P.face('eyes', air > 0.4 ? 'happy' : push > 0.3 ? 'smug' : t > 1.75 ? 'happy' : undefined);
      P.burst(0.9, 'ring', 'root', [0, 1, 0], {}).burst(1.0, 'sparkle', 'head', TOP, { n: 6 }).burst(1.4, 'sparkle', 'specs', GLASS, { n: 3 }).burst(0.4, 'note', 'head', TOP, {});
    } },
    // asleep: sunk into her feathers, head tucked, glasses slid down her beak; a little wheeze each breath
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      P.pos('body', 0, -1.5 + br * 0.25, 0).sq('body', -0.05 + br * 0.04); plant(P, LEGS, -1.5 + br * 0.25, LEG);
      P.rot('head', 16 + br * 3, 0, 8).pos('specs', 0, -1.2, 0.2).rot('jaw', 4 + Math.max(0, -br) * 10);
      wings(P, -4, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [5, 24, 4], {}).burst(1.7, 'z', 'head', [5, 24, 4], {}).burst(2.5, SPFX.puff, 'head', MOUTH, { n: 2, speed: 0.5 });
    } },
    // the wake-up call: she puffs up, then WHEEZES — a squeaky, asthmatic hoot in rings, puffs and
    // notes, flapping — coughs, and pushes her glasses back up
    wheeze: { len: 3.2, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 1 - env(t, 0.1, 2.6);
      const puff = seg(t, 0.05, 0.6, E.inout) * (1 - seg(t, 0.75, 0.85)), hold = bump(t, 0.6, 0.85);
      const loud = seg(t, 0.8, 0.9, E.out) * (1 - seg(t, 2.1, 2.3, E.inout)), cough = t > 2.3 && t < 2.8 ? Math.abs(Math.sin((t - 2.3) * Math.PI * 4)) : 0;
      const push = env(t, 2.75, 3.2, 0.12, 0.2);
      const pulse = loud * Math.abs(Math.sin((t - 0.8) * Math.PI * 4.5));
      P.scl('body', 1 + 0.14 * puff + 0.05 * pulse, 1 + 0.08 * puff, 1 + 0.14 * puff).scl('head', 1 + 0.06 * puff, 1 + 0.06 * puff, 1 + 0.06 * puff);
      P.pos('root', 0, 0.8 * puff + 1.2 * pulse, 0).rot('head', -10 * puff - 24 * loud + 8 * pulse + 10 * cough, wave(t, 2) * 6 * loud, 0);
      P.rot('jaw', 6 * puff + 34 * loud + 10 * pulse + 20 * cough);
      wings(P, 20 * puff + loud * (60 + 40 * Math.sin(t * Math.PI * 2 * 5)), -10 * loud);
      P.rot('wingR', -50 * push, 0, 22 * push).pos('specs', 0, -0.9 * loud + 0.5 * push, 0.2 * loud).rot('specs', 0, 0, wave(t, 6) * 4 * loud);
      eyesScale(P, 1 + 0.2 * hold, 1 + 0.3 * hold);
      P.face('eyes', puff > 0.3 ? 'closed' : hold > 0.3 ? 'wide' : loud > 0.3 ? 'shut' : cough > 0.2 ? 'teary' : push > 0.3 ? 'smug' : t > 3.0 ? 'happy' : undefined);
      for (const r0 of [0.9, 1.12, 1.34, 1.56, 1.78, 2.0]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 0.9, tint: [0.85, 0.92, 1] });
      if (loud > 0.3) { P.stream(SPFX.puff, 'head', MOUTH, { rate: 34, dir: [0, 0.5, 1], speed: 1.4 }); P.stream('note', 'head', [0, 22, 6], { rate: 6, spread: 0.9, speed: 1.2 }); }
      for (const c0 of [2.35, 2.6]) P.burst(c0, SPFX.puff, 'head', MOUTH, { n: 4, dir: [0, 0.2, 1], speed: 0.8 });
      P.burst(0.88, 'sweat', 'head', [6.5, 22, 3], {}).burst(2.4, 'sweat', 'head', [-6.5, 22, 3], {}).burst(2.95, 'sparkle', 'specs', GLASS, { n: 3 });
    } },
    // dialogue: chattering beak, nods, a wing that talks along
    talk: { len: 1.6, loop: true, f(P, t, c) {
      const j = talkJaw(t), g = Math.sin(t * Math.PI * 2 / 1.6);
      P.rot('jaw', 6 + 26 * j).rot('head', 3 * j + wave(t, 1.25) * 3, wave(t, 0.625) * 6, wave(t, 0.625, 1) * 5).pos('body', 0, 0.3 * j, 0).sq('body', 0.02 * j);
      P.rot('wingR', -24 - 18 * Math.max(0, g), 0, 18 + 14 * Math.max(0, g)).rot('wingL', 0, 0, 6 + 4 * j);
      eyesScale(P, 1, 1 + 0.06 * j);
      const e = (c.loopN + Math.floor(t / 0.8)) % 4;
      P.face('eyes', e === 1 && t % 0.8 > 0.3 ? 'happy' : undefined);
    } },
    // cooking: the spoon in her wingtip circles the pot, she leans in to sniff and hums
    cook: { len: 2.4, loop: true, f(P, t) {
      P.face('prop', 'pot'); P.lookW = 0;
      const ph = Math.sin(t * Math.PI * 2 / 0.8);
      P.rot('body', 7, ph * 3, 0).pos('body', 0, -0.3 + Math.abs(ph) * 0.2, 0.4); plant(P, LEGS, -0.3, LEG);
      stir(P, t, 1); P.rot('wingL', 10, 0, 22);
      P.rot('head', 16 + wave(t, 0.42) * 3, ph * 6, wave(t, 0.42) * 6).rot('jaw', 4 + 6 * Math.max(0, Math.sin(t * Math.PI * 2 * 1.25)));
      P.face('eyes', t > 1.2 && t < 1.9 ? 'happy' : undefined);
      P.stream('steam', 'pot', [0, 5.2, 11.6], { rate: 5, spread: 0.4, speed: 0.6 });
      P.burst(1.25, 'note', 'head', [4, 23, 4], {}).burst(1.6, 'heart', 'pot', [0, 7, 11.6], {});
    } },
    // a big wing hug toward the front
    hug: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const open = seg(t, 0, 0.35, E.out) * (1 - seg(t, 0.35, 0.6, E.inout)), wrap = seg(t, 0.4, 0.7, E.back) * (1 - seg(t, 2.1, 2.55, E.inout));
      const squeeze = wrap * (0.5 + 0.5 * Math.sin((t - 0.7) * Math.PI * 2 * 0.9));
      P.rot('body', -6 * open + 14 * wrap, 0, wave(t, 0.8) * 4 * wrap).pos('root', 0, 0.6 * open, 1.6 * wrap).sq('body', -0.04 * squeeze);
      P.rot('wingR', -20 * open - 72 * wrap, 0, -60 * open + 40 * wrap + 6 * squeeze).rot('wingL', -20 * open - 72 * wrap, 0, 60 * open - 40 * wrap - 6 * squeeze);
      P.rot('head', -8 * open + 10 * wrap, 0, 14 * wrap);
      P.face('eyes', open > 0.3 ? 'happy' : wrap > 0.3 ? 'closed' : 'happy');
      P.burst(0.75, 'heart', 'head', [0, 24, 6], { n: 3 }).burst(1.4, 'heart', 'head', [-3, 24, 6], { n: 2 });
    } },
    // the dance: a 50s diner twist — sinking down on the beat, wings swinging, then back up to point at the sky
    dance: { len: 2.8, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const { n, pulse } = beat(t, 0.3), live = 1 - seg(t, 2.1, 2.25), side = n % 2 ? 1 : -1, tw = Math.sin(t * Math.PI / 0.3);
      const sink = Math.sin(seg(t, 0, 2.1, E.lin) * Math.PI) * 1.8 * live, dy = -sink + 0.4 * pulse * live;
      P.pos('body', 0, dy, 0).rot('body', 0, 26 * tw * live, -4 * tw * live).sq('body', -0.05 * pulse * live); plant(P, LEGS, dy, LEG);
      P.rot('footR', 0, 22 * tw * live, 0).rot('footL', 0, 22 * tw * live, 0).rot('head', 6 * pulse * live, -18 * tw * live, side * 6 * live);
      P.rot('wingR', -30 * tw * live, 0, -(30 + 20 * pulse) * live).rot('wingL', 30 * tw * live, 0, (30 + 20 * pulse) * live);
      const pose = seg(t, 2.2, 2.35, E.back);
      P.rot('wingR', 0, 0, -150 * pose).rot('wingL', -20 * pose, 0, 14 * pose).rot('body', 0, 0, 8 * pose).rot('head', -10 * pose, 0, -8 * pose).pos('root', 0, 1.2 * bump(t, 2.15, 2.4), 0);
      P.face('eyes', t > 2.25 ? 'wink' : pulse > 0.5 ? 'happy' : undefined).rot('jaw', 16 * pulse * live + 14 * pose);
      P.burst(0.05, 'note', 'head', [5, 25, 2], {}).burst(0.65, 'note', 'head', [-5, 25, 2], {}).burst(1.25, 'note', 'head', [5, 25, 2], {}).burst(1.85, 'note', 'head', [-5, 25, 2], {}).burst(2.28, 'sparkle', 'head', [-6, 27, 4], { n: 6 });
    } },
    // owl power: her head swivels all the way round, a spin of the glasses, and she settles as if nothing happened
    swivel: { len: 2.2, next: 'idle', f(P, t) {
      const turn = seg(t, 0.3, 1.3, E.inout3), settle = wob(t, 1.3, 1, 2.5, 6);
      P.rot('head', 0, 360 * turn + 8 * settle, 0).rot('specs', 0, 0, 6 * settle).sq('body', -0.03 * bump(t, 0.2, 0.4));
      eyesAt(P, 0.3 * bump(t, 0.25, 0.45), 0);
      P.face('eyes', turn > 0.3 && turn < 0.7 ? 'wide' : t > 1.4 && t < 1.9 ? 'smug' : undefined); P.lookW = 1 - env(t, 0.2, 1.6);
      P.burst(1.32, 'sparkle', 'head', TOP, { n: 3 });
    } },
    // her glasses fog: a huff, a polish with the cuff, and the proud push back up
    polish: { len: 2.8, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const huff = bump(t, 0.2, 0.55), up = env(t, 0.6, 2.0, 0.2, 0.25), wipe = t > 0.8 && t < 1.8 ? Math.sin((t - 0.8) * Math.PI * 2 * 2.5) : 0, push = env(t, 2.0, 2.6, 0.12, 0.25);
      P.rot('jaw', 30 * huff).rot('head', -6 * huff + 10 * up, 0, 6 * up).pos('specs', 0, -0.8 * up + 0.6 * push, 0.5 * up);
      P.rot('wingR', -70 * up - 46 * push, 18 * wipe * up, 34 * up + 20 * push);
      P.face('fog', t > 0.4 && t < 1.55 ? 'on' : 'off').face('eyes', huff > 0.2 ? 'closed' : up > 0.3 ? 'closed' : push > 0.3 ? 'glint' : undefined);
      P.burst(0.3, SPFX.puff, 'head', MOUTH, { n: 3, dir: [0, 1, 0.3], speed: 0.6 }).burst(2.2, 'sparkle', 'specs', GLASS, { n: 3 });
    } },
  },
};
def.anim = anim;
