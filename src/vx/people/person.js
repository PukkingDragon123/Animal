// People as box models — realistic-stylized chibi: a big expressive head on a
// compact body, painted at the same texel density as the Tokonmon. person(o)
// builds a model def from a recipe (build, skin, face, hair, outfit, shoes,
// accessories) and attaches the shared acting clips (idle, talk, walk, run, wave,
// point, cheer, think, shock, angry, laugh, sad, phone, throw, sit) used by
// cutscenes. Faces have eye / brow / mouth slots; talking flaps the mouth.
import { shade, gradient, ramp, poly, layer, on, shift } from '../mons/kit.js';
import { E, seg, bump, wob, wave, bounce } from '../anim.js';

const BUILDS = {
  //        leg  torso  W     D    head  arm   neck  scale
  kid:   { L: 5.6, T: 5.4, W: 6.2, D: 3.8, H: 8.6, A: 5.2, N: 0.2 },
  teen:  { L: 7.2, T: 6.4, W: 6.6, D: 3.9, H: 8.8, A: 6.0, N: 0.3 },
  adult: { L: 8.0, T: 7.2, W: 7.0, D: 4.0, H: 9.0, A: 6.6, N: 0.4 },
  big:   { L: 7.6, T: 8.4, W: 9.4, D: 6.2, H: 9.4, A: 6.8, N: 0.2 },
  tall:  { L: 9.2, T: 7.6, W: 7.0, D: 4.0, H: 9.0, A: 7.2, N: 0.5 },
  old:   { L: 7.4, T: 6.8, W: 7.0, D: 4.2, H: 9.0, A: 6.4, N: 0.2 },
};
const INK = '#20161c';

// ---------------------------------------------------------------- painters
const skinP = (c) => shade(c, { top: shift(c, 0.12), bottom: shift(c, -0.12), grain: 0.02 });
function cloth(c, o = {}) {
  const base = shade(c, { top: shift(c, 0.14), bottom: shift(c, -0.2), grain: 0.03 });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'up' || face === 'down') return;
    if (o.fold) for (let y = 2; y < h - 1; y += 4) for (let x = (y >> 2) % 3; x < w; x += 5) p.px(x, y, shift(c, -0.1));
  };
}
// shirt / jacket torso: collar, buttons or zip, pockets, a hem; `print` paints a graphic on the chest
function topP(t, skin) {
  const c = t.color, c2 = t.color2 || shift(c, -0.25), base = cloth(c, { fold: true });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'up') { const cx = Math.floor(w / 2); for (let x = cx - 3; x <= cx + 2; x++) for (let y = 1; y < h - 1; y++) p.px(x, y, shift(skin, -0.1)); return; }
    if (face === 'down') return;
    const cx = Math.floor(w / 2);
    for (let x = 0; x < w; x++) p.px(x, h - 1, shift(c, -0.35));                                // hem
    if (face !== 'south') { if (t.kind === 'hoodie' && face === 'north') for (let y = 0; y < 6; y++) for (let x = cx - 5 + y; x <= cx + 4 - y; x++) p.px(x, y, shift(c, -0.18)); return; }
    if (t.kind === 'tee' || t.kind === 'tank') { for (let x = cx - 3; x <= cx + 2; x++) p.px(x, 0, shift(skin, -0.08)); for (let x = cx - 2; x <= cx + 1; x++) p.px(x, 1, shift(skin, -0.15)); for (let x = cx - 3; x <= cx + 2; x++) p.px(x, 2, shift(c, -0.3)); }
    if (t.kind === 'hoodie') { poly(p, [[cx - 6, h - 2], [cx + 5, h - 2], [cx + 4, h - 7], [cx - 5, h - 7]], shift(c, -0.12)); p.hl(cx - 6, cx + 5, h - 7, shift(c, -0.3)); for (const dx of [-2, 1]) { p.vl(cx + dx, 2, 8, t.color2 || '#f0ece4'); p.px(cx + dx, 9, shift(t.color2 || '#f0ece4', -0.3)); } for (let x = cx - 4; x <= cx + 3; x++) p.px(x, 0, shift(c, -0.35)); }
    if (t.kind === 'jacket' || t.kind === 'suit' || t.kind === 'coat') {
      const inner = t.inner || (t.kind === 'suit' ? '#f2f0ea' : '#2e2e36');
      poly(p, [[cx - 3, 0], [cx + 3, 0], [cx + 1, h * 0.62], [cx - 1, h * 0.62]], inner);
      if (t.kind === 'suit') { poly(p, [[cx - 1, 2], [cx + 1, 2], [cx + 1.4, h * 0.5], [cx, h * 0.58], [cx - 1.4, h * 0.5]], t.tie || '#a82e3a'); }
      for (const s of [-1, 1]) { for (let y = 0; y < h * 0.45; y++) { const x = cx + s * (3 + Math.floor(y / 3)); p.px(x, y, shift(c, 0.2)); p.px(x + s, y, shift(c, -0.3)); } }
      p.vl(cx - 1 + (t.kind === 'coat' ? 0 : 0), Math.round(h * 0.62), h - 2, shift(c, -0.35));
      if (t.kind !== 'suit') for (const s of [-1, 1]) p.hl(cx + s * 4 - 2, cx + s * 4 + 1, Math.round(h * 0.7), shift(c, -0.3));
    }
    if (t.kind === 'apron') { for (let y = 2; y < h; y++) for (let x = cx - 5; x <= cx + 4; x++) p.px(x, y, y === 2 ? shift(t.color2, -0.2) : t.color2); p.hl(cx - 3, cx + 2, Math.round(h * 0.55), shift(t.color2, -0.25)); }
    if (t.kind === 'vest') { for (const s of [-1, 1]) for (let y = 0; y < h; y++) for (let k = 0; k < 4; k++) p.px(cx + s * (k + 2) - (s < 0 ? 1 : 0), y, k === 0 ? shift(c2, -0.3) : c2); }
    if (t.stripe) for (let x = 0; x < w; x++) { p.px(x, Math.round(h * 0.4), t.stripe); p.px(x, Math.round(h * 0.4) + 1, t.stripe); }
    if (t.print) t.print(p, w, h, cx);
  };
}
function legsP(b) {
  const c = b.color, base = cloth(c);
  return (p, w, h, face) => {
    base(p, w, h, face);
    if (face === 'up' || face === 'down') return;
    if (b.kind === 'jeans') { for (let y = 1; y < h; y += 3) p.px(face === 'east' ? 1 : w - 2, y, shift(c, 0.25)); for (let x = 0; x < w; x++) { p.px(x, h - 2, shift(c, -0.3)); } if (face === 'south') { p.px(1, 2, shift(c, 0.3)); p.px(w - 2, 2, shift(c, 0.3)); } }
    if (b.kind === 'track') for (let y = 0; y < h; y++) { p.px(0, y, b.color2 || '#f0ece4'); p.px(w - 1, y, b.color2 || '#f0ece4'); }
    if (b.kind === 'slacks') { p.vl(Math.floor(w / 2), 1, h - 1, shift(c, -0.18)); }
  };
}
function shoeP(s) {
  const c = s.color, sole = s.sole || (s.kind === 'boots' || s.kind === 'dress' ? '#2a2420' : '#f2f0ea');
  return (p, w, h, face) => {
    shade(c, { top: shift(c, 0.2), bottom: shift(c, -0.15), rim: false, seam: false })(p, w, h, face);
    if (face === 'up') { if (s.kind === 'sneakers') for (let y = 2; y < h - 3; y += 2) p.hl(1, w - 2, y, '#f6f4ee'); return; }
    if (face === 'down') { p.rect(0, 0, w, h, sole); return; }
    for (let x = 0; x < w; x++) { p.px(x, h - 1, sole); if (s.kind === 'sneakers') p.px(x, h - 2, sole); }
    if (s.kind === 'sneakers' && s.stripe && (face === 'east' || face === 'west')) { for (let i = 0; i < 4; i++) p.px(3 + i, h - 3 - (i >> 1), s.stripe); }
  };
}
function hairP(c0, o = {}) {
  const dark = parseInt(c0.slice(1, 3), 16) + parseInt(c0.slice(3, 5), 16) + parseInt(c0.slice(5, 7), 16) < 200, c = dark ? shift(c0, 0.18) : c0;
  const hi = dark ? '#6a6a8a' : shift(c, 0.32), lo = shift(c, -0.3);
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let col = face === 'up' ? c : ramp([shift(c, 0.08), c, lo], y / Math.max(1, h - 1), x, y);
      if ((x * 7 + (y >> 1) * 3) % 5 === 0) col = shift(col, -0.16);            // strands
      p.px(x, y, col);
    }
    if (face !== 'down' && face !== 'up' && h > 3) { const y = Math.min(h - 2, 1 + (o.shine ?? 1)); for (let x = 1; x < w - 1; x++) if ((x + y) % 3) p.px(x, y, hi); }   // the shine band
    if (face === 'up') for (let k = 0; k < w; k += 3) p.px(k, Math.floor(h / 2) + (k % 2), hi);
  };
}
// bangs / fringe: a plane with a jagged lower edge
const bangsP = (c, cut = 'jag') => (p, w, h) => {
  for (let x = 0; x < w; x++) {
    const len = cut === 'straight' ? h - 1 : cut === 'side' ? Math.round(h * (0.35 + 0.65 * (x / w))) : h - 1 - ((x * 5) % 7 > 3 ? 2 : 0) - ((x % 4) === 0 ? 1 : 0);
    for (let y = 0; y < len; y++) p.px(x, y, (x * 7 + y) % 5 === 0 ? shift(c, -0.18) : y === 1 ? shift(c, 0.3) : c);
    p.px(x, len, shift(c, -0.35));
  }
};
// hair regions per style (fractions of the cranium's faces): fringe depth on the face, how far
// the sides come down, the back, ragged edges; long styles also paint the jaw's sides
const HAIR = {
  short: { fringe: 0.24, side: 0.42, back: 0.92, rag: 1 }, spiky: { fringe: 0.28, side: 0.45, back: 0.9, rag: 2 },
  long: { fringe: 0.22, side: 1, back: 1, rag: 1, long: true }, bob: { fringe: 0.36, side: 1, back: 1, rag: 0, straight: true },
  ponytail: { fringe: 0.18, side: 0.5, back: 0.85, rag: 1, swept: true }, bun: { fringe: 0.16, side: 0.48, back: 0.85, rag: 0, swept: true },
  slick: { fringe: 0.08, side: 0.38, back: 0.85, rag: 0, swept: true }, buzz: { fringe: 0.05, side: 0.3, back: 0.6, rag: 0 },
  afro: { fringe: 0.2, side: 0.5, back: 1, rag: 2 }, mohawk: { fringe: 0, side: 0, back: 0, rag: 0 },
};
// hair on one face of the cranium (shell: the inflated overlay — only hair, a little shorter and more ragged)
function paintHair(p, w, h, face, R, HP, shell, o) {
  if (face === 'down' || !R.back) return;
  const hs = (x) => ((x * 7 + 3) % 5 > 2 ? 1 : 0) + ((x * 3) % 7 === 0 ? 1 : 0);
  const tmp = { px: [], set(x, y) { this.px.push(x, y); } };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let lim;
    if (face === 'up') lim = h + 1;
    else if (face === 'south') { const edge = Math.min(x, w - 1 - x); lim = (R.straight ? R.fringe * h : R.swept ? R.fringe * h * (0.6 + 0.8 * (x / w)) : R.fringe * h + (R.rag ? hs(x) * R.rag : 0)) + (edge < 2 ? h * (R.long || R.straight ? 1 : R.side * 0.75) : 0); if (o.bangs === 'straight') lim = Math.max(lim, h * 0.36); }
    else if (face === 'north') lim = R.back * h - (R.rag && !R.long ? hs(x) : 0);
    else { const front = face === 'east' ? x : w - 1 - x; lim = R.side * h + (front < 2 ? h * 0.12 : 0) - (R.rag ? hs(x) % 2 : 0); }
    if (shell) lim -= face === 'up' ? 0 : 1 + (hs(x + 1) % 2);
    if (y < lim) tmp.set(x, y);
  }
  // paint via a hair surface so strands / shine are continuous
  const fake = { px: (x, y, c) => { hairBuf[y * w + x] = c; } }, hairBuf = new Array(w * h);
  HP({ px: (x, y, c) => { hairBuf[y * w + x] = c; } }, w, h, face === 'up' ? 'up' : 'south');
  for (let k = 0; k < tmp.px.length; k += 2) { const x = tmp.px[k], y = tmp.px[k + 1]; let c = hairBuf[y * w + x]; const below = y + 1 < h && !tmp.px.some((v, i) => i % 2 === 0 && v === x && tmp.px[i + 1] === y + 1); if (below && face !== 'up') c = shift(c, -0.3); p.px(x, y, c); }
  void fake;
}
// face features (planes): eyes 8 × 6 texels, mouth 9 × 5, brows on the eye plane
export function eyeP(state, o) {
  const iris = o.color || '#3a2a1e', lid = o.lid || INK, sleepy = o.style === 'narrow' || o.style === 'tired';
  return (p, w, h) => {
    const sd = o.side || 0, inner = (x) => (sd < 0 ? x / (w - 1) : 1 - x / (w - 1));       // 1 at the inner corner
    if (state === 'closed') { for (let x = 1; x < w - 1; x++) p.px(x, 4 + (x === 1 || x === w - 2 ? -1 : 0), lid); return; }
    if (state === 'happy') { for (let x = 1; x < w - 1; x++) p.px(x, 4 - Math.round(Math.sin(((x - 1) / (w - 3)) * Math.PI) * 2), lid); return; }
    const wide = state === 'wide', topY = (x) => (wide ? 0 : sleepy ? 2 : 1) + (state === 'angry' ? Math.round(inner(x) * 2) : state === 'sad' ? Math.round((1 - inner(x)) * 2) : x === 0 || x === w - 1 ? 1 : 0);
    const botY = (x) => h - 1 - (x === 0 || x === w - 1 ? 1 : 0);
    for (let x = 0; x < w; x++) for (let y = topY(x) + 1; y < botY(x); y++) p.px(x, y, y === topY(x) + 1 ? '#d8d6e2' : '#f6f4f0');
    // iris: a tall oval with a dark top, the pupil, one hard glint
    const ix = Math.floor(w / 2) + (sd < 0 ? 0 : -1) + (wide ? 0 : 0), iw = wide ? 2 : 3;
    for (let x = ix - 1; x < ix - 1 + iw; x++) for (let y = 1; y < h - 1; y++) if (y > topY(x)) p.px(x, y, y <= 2 ? shift(iris, -0.35) : y >= h - 2 ? shift(iris, 0.3) : iris);
    if (!wide) { p.px(ix, 3, INK); p.px(ix, 4, INK); } else p.px(ix, 3, INK);
    p.px(ix - 1 + iw - 1, Math.max(topY(ix) + 1, 2), '#ffffff');
    // lash line (thick, cool) and a soft lower lid
    for (let x = 0; x < w; x++) { p.px(x, topY(x), lid); if (x > 0 && x < w - 1 && !wide) p.px(x, topY(x) - 1 >= 0 ? topY(x) - 1 : 0, (sd < 0 ? x < 2 : x > w - 3) && o.lashes ? lid : 0); }
    if (o.lashes) p.px(sd < 0 ? 0 : w - 1, Math.max(0, topY(sd < 0 ? 0 : w - 1) - 1), lid);
    for (let x = 1; x < w - 1; x++) p.px(x, h - 1, shift(o.skin || '#e0b090', -0.22));
  };
}
export function browP(state, c, side) {
  return (p, w, h) => {
    for (let x = 0; x < w; x++) {
      const t = side > 0 ? x / (w - 1) : 1 - x / (w - 1);            // 0 = inner end, 1 = outer end
      const y = state === 'angry' ? Math.round(2 - (1 - t) * -1.8 + 0.2) : state === 'sad' ? Math.round(1 + t * 1.6) : state === 'up' ? Math.round(1.2 - Math.sin(t * Math.PI) * 1) : Math.round(1.6 - Math.sin(t * Math.PI) * 0.8);
      const yy = state === 'angry' ? Math.round(0.4 + (1 - t) * 2) : y;
      p.px(x, Math.max(0, Math.min(h - 2, yy)), c); p.px(x, Math.max(0, Math.min(h - 1, yy + 1)), c);
    }
  };
}
export function mouthP(state, skin) {
  const lip = shift(skin, -0.38), dark = '#3a1418', tongue = '#d8606a', teeth = '#f4f2ee';
  return (p, w, h) => {
    const cx = Math.floor(w / 2);
    if (state === 'closed') { p.hl(cx - 2, cx + 1, 2, lip); return; }
    if (state === 'smile') { p.hl(cx - 2, cx + 1, 3, lip); p.px(cx - 3, 2, lip); p.px(cx + 2, 2, lip); return; }
    if (state === 'frown') { p.hl(cx - 2, cx + 1, 2, lip); p.px(cx - 3, 3, lip); p.px(cx + 2, 3, lip); return; }
    if (state === 'smirk') { p.hl(cx - 2, cx + 1, 3, lip); p.px(cx + 2, 2, lip); return; }
    if (state === 'grin') { p.hl(cx - 3, cx + 2, 1, lip); for (let x = cx - 3; x <= cx + 2; x++) p.px(x, 2, teeth); p.hl(cx - 2, cx + 1, 3, lip); return; }
    const big = state === 'shout' || state === 'laugh', ow = big ? 3 : 2, oh = big ? 4 : state === 'o' ? 3 : 2;
    for (let y = 1; y < 1 + oh; y++) for (let x = cx - ow; x < cx + ow; x++) p.px(x, y, y === 1 && big ? teeth : y === oh && big ? tongue : dark);
    p.hl(cx - ow, cx + ow - 1, 0, lip);
  };
}
const beardP = (kind, c) => (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (kind === 'stubble' && (x + y) % 2) continue;
    p.px(x, y, (x * 3 + y) % 4 === 0 ? shift(c, -0.2) : y === 0 ? shift(c, 0.15) : c);
  }
  if (face === 'south' && kind !== 'stubble') { const cx = Math.floor(w / 2); for (let x = cx - 3; x <= cx + 2; x++) p.px(x, 1, 0); for (let x = cx - 2; x <= cx + 1; x++) p.px(x, 2, 0); }
};

// ---------------------------------------------------------------- builder
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
export function person(o) {
  const B = { ...BUILDS[o.build || 'adult'], ...(o.dims || {}) }, skin = o.skin || '#e6b48e';
  const L = B.L, T = B.T, W = B.W, D = B.D, H = B.H, A = B.A;
  const top = { kind: 'tee', color: '#3a6ab0', ...(o.top || {}) }, bot = { kind: 'jeans', color: '#34406a', ...(o.bottom || {}) }, shoe = { kind: 'sneakers', color: '#e8e4dc', ...(o.shoes || {}) };
  const hair = { style: 'short', color: '#2a1c16', ...(o.hair || {}) }, eyes = { color: '#3a2a1e', ...(o.eyes || {}), skin };
  const acc = new Set(o.acc || []);
  const yWaist = L, yNeck = L + T, yHead = yNeck + B.N, hx = H / 2, hd = H * 0.94, hz0 = -hd / 2 + 0.4, hz1 = hz0 + hd;   // head box
  const fz = hz1 + 0.04;                                                                     // face plane z
  const sleeve = top.kind === 'tank' ? 0 : top.kind === 'tee' || top.kind === 'apron' && !top.long ? 0.42 : 1;
  const armP = (p, w, h, face) => {
    const sh = Math.round(h * sleeve);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < sh ? ramp([shift(top.color, 0.12), top.color, shift(top.color, -0.2)], y / h, x, y) : ramp([shift(skin, 0.06), skin, shift(skin, -0.12)], y / h, x, y));
    if (sh > 0 && sh < h) for (let x = 0; x < w; x++) p.px(x, sh - 1, shift(top.color, -0.35));
  };
  const bones = [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'hips', parent: 'root', pivot: [0, yWaist, 0], cubes: [P([-W / 2 + 0.3, yWaist - 1.8, -D / 2 + 0.15], [W - 0.6, 2.2, D - 0.3], legsP(bot))] },
  ];
  // legs: skin for shorts / skirt, trousers otherwise, a shoe at the foot
  for (const s of [-1, 1]) {
    const lx = s * (W / 4 + 0.05), lw = Math.min(3, W / 2 - 0.4), short = bot.kind === 'shorts' || bot.kind === 'skirt';
    const legTex = short ? (p, w, h, face) => { const k = Math.round(h * 0.42); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < k ? ramp([bot.color, shift(bot.color, -0.2)], y / k, x, y) : ramp([skin, shift(skin, -0.12)], (y - k) / (h - k), x, y)); for (let x = 0; x < w; x++) p.px(x, k - 1, shift(bot.color, -0.35)); } : legsP(bot);
    bones.push({ name: s < 0 ? 'legR' : 'legL', parent: 'hips', pivot: [lx, yWaist - 0.6, 0], cubes: [
      P([lx - lw / 2, 1.4, -lw / 2], [lw, yWaist - 1.6, lw], legTex, { mirror: s > 0 }),
      P([lx - lw / 2 - 0.2, 0, -lw / 2 - 0.5], [lw + 0.4, 1.6, lw + 1.6], shoeP(shoe), { mirror: s > 0 }),
    ] });
  }
  if (bot.kind === 'skirt') bones[1].cubes.push(P([-W / 2 - 0.2, yWaist - 3.6, -D / 2 - 0.3], [W + 0.4, 4, D + 0.6], cloth(bot.color, { fold: true })));
  // torso
  const tor = [P([-W / 2, yWaist, -D / 2], [W, T, D], topP(top, skin)), P([-1.3, yNeck - 0.6, -1.3], [2.6, B.N + 1.2, 2.6], skinP(shift(skin, -0.06)), { outline: false })];
  for (const sx of [-1, 1]) tor.push(P([sx < 0 ? -W / 2 - 0.5 : W / 2 - 1.5, yNeck - 2.2, -D / 2 + 0.3], [2, 2.2, D - 0.6], cloth(top.kind === 'tank' ? skin : top.color)));
  if (top.kind === 'hoodie') tor.push(P([-W / 2 + 0.8, yNeck - 1.2, -D / 2 - 1.1], [W - 1.6, 2.2, 1.6], cloth(shift(top.color, -0.06))));
  if (top.kind === 'coat') tor.push(P([-W / 2 - 0.15, yWaist - 3, -D / 2 - 0.15], [W + 0.3, 3.2, D + 0.3], cloth(top.color, { fold: true })));
  if (acc.has('backpack')) tor.push(P([-W / 2 + 1, yWaist + 1, -D / 2 - 2.2], [W - 2, T - 1.5, 2.2], shade(o.packColor || '#c84a3a')));
  if (acc.has('chain')) tor.push(P([-1.6, yNeck - 3.2, D / 2 - 0.02], [3.2, 2.4, 0], (p, w, h) => { for (let x = 0; x < w; x++) p.px(x, Math.round(Math.sin((x / (w - 1)) * Math.PI) * (h - 2)), '#f0c840'); p.rect(Math.floor(w / 2) - 1, h - 3, 3, 3, '#ffd850'); }, { plane: 'z' }));
  if (acc.has('scarf')) tor.push(P([-W / 2 + 0.4, yNeck - 1.2, -D / 2 - 0.2], [W - 0.8, 1.6, D + 0.4], cloth(o.scarfColor || '#c83a3a')));
  bones.push({ name: 'torso', parent: 'hips', pivot: [0, yWaist, 0], cubes: tor });
  // arms with hands
  for (const s of [-1, 1]) {
    const ax = s * (W / 2 + 1.2), nm = s < 0 ? 'R' : 'L';
    bones.push({ name: 'arm' + nm, parent: 'torso', pivot: [ax, yNeck - 0.9, 0], cubes: [P([ax - 1.2, yNeck - 0.4 - A, -1.2], [2.4, A, 2.4], armP, { mirror: s > 0 })] });
    const hc = [P([ax - 1.3, yNeck - 0.6 - A - 2.2, -1.3], [2.6, 2.4, 2.6], skinP(skin))];
    if (s < 0 && acc.has('phone')) hc.push(P([ax - 0.9, yNeck - A - 2.6, 1.0], [1.8, 3, 0.4], (p, w, h, f) => { p.rect(0, 0, w, h, '#1e1e26'); if (f === 'south' || f === 'north') p.rect(1, 1, w - 2, h - 2, f === 'north' ? '#5ab0f0' : '#2e2e3a'); }, { id: 'phone', hide: true }));
    if (s < 0 && acc.has('capsule')) hc.push(P([ax - 1.1, yNeck - A - 3.4, 0.6], [2.2, 2.2, 2.2], (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < h / 2 - 0.5 ? '#e8343a' : y < h / 2 + 0.5 ? INK : '#f4f0ea'); }, { id: 'capsule', hide: true }));
    if (acc.has('watch') && s > 0) hc.push(P([ax - 1.35, yNeck - A - 0.9, -1.35], [2.7, 0.7, 2.7], shade('#c8ccd4')));
    bones.push({ name: 'hand' + nm, parent: 'arm' + nm, pivot: [ax, yNeck - 0.6 - A, 0], cubes: hc });
  }
  // head: skull, ears, hair, face planes
  // the head: a cranium and a narrower jaw (cheeks and chin). Hair is painted onto the cranium
  // (hairline, sideburns, nape) and onto an inflated overlay shell with ragged edges for depth.
  const hc = hair.color, hs = hair.style, top0 = yHead + H, HP = hairP(hc), HD = hairP(shift(hc, -0.12));
  const RG = HAIR[hs] || HAIR.short;
  const faceTex = (p, w, h, face) => {
    skinP(skin)(p, w, h, face);
    if (face === 'south') {
      const cx = w / 2 - 0.5, ny = Math.round(h * 0.46);
      p.px(Math.floor(cx), ny, shift(skin, -0.2)); p.px(Math.ceil(cx), ny, shift(skin, -0.2)); p.px(Math.floor(cx) - 1, ny, shift(skin, -0.1));
      p.vl(Math.ceil(cx), ny - 3, ny - 1, shift(skin, 0.1));
      for (const sx of [0, w - 1]) for (let y = Math.round(h * 0.3); y < h; y++) p.px(sx, y, shift(skin, -0.1));
    }
    if (hs !== 'bald') paintHair(p, w, h, face, RG, HP, false, hair);
  };
  const shellTex = (p, w, h, face) => paintHair(p, w, h, face, RG, HP, true, hair);
  const jawTex = (p, w, h, face) => { skinP(skin)(p, w, h, face); if (face === 'down') p.rect(0, 0, w, h, shift(skin, -0.3)); if (RG.long && (face === 'east' || face === 'west' || face === 'north')) HP(p, w, h, face); };
  const head = [
    P([-hx, yHead + H * 0.3, hz0], [H, H * 0.7, hd], faceTex),
    P([-hx + 0.55, yHead, hz0 + 0.4], [H - 1.1, H * 0.3 + 0.05, hd - 0.5], jawTex, { faces: { south: (p, w, h, f) => { skinP(skin)(p, w, h, f); for (let x = 0; x < w; x++) p.px(x, h - 1, shift(skin, -0.16)); } } }),
    P([-hx - 0.55, yHead + H * 0.34, -0.9], [0.6, 2, 1.8], skinP(shift(skin, -0.04))),
    P([hx - 0.05, yHead + H * 0.34, -0.9], [0.6, 2, 1.8], skinP(shift(skin, -0.04))),
  ];
  if (hs !== 'bald' && hs !== 'mohawk' && hs !== 'buzz') head.push(P([-hx, yHead + H * 0.3, hz0], [H, H * 0.7, hd], shellTex, { inflate: 0.42, outline: false, shadow: false }));
  // 3D locks where a shell can't carry the shape
  const lock = (x, y, z, w, h, d, rx, rz, tex = HP) => head.push(P([x - w / 2, y - h, z - d / 2], [w, h, d], tex, { pivot: [x, y, z], rot: [rx, 0, rz] }));
  if (hs === 'afro') { head.push(P([-hx - 1.6, yHead + H * 0.45, hz0 - 1.8], [H + 3.2, H * 0.55 + 2.2, hd + 2.6], HP)); head.push(P([-hx - 1, top0 + 0.8, hz0 - 1.2], [H + 2, 1.2, hd + 1.4], HP)); head.push(P([-hx - 2.2, yHead + H * 0.55, hz0 - 1.2], [H + 4.4, H * 0.35, hd + 1.4], HD)); }
  if (hs === 'mohawk') for (let i = 0; i < 6; i++) lock(0, top0 + 3.4 - Math.abs(i - 2) * 0.5, hz1 - 0.8 - i * (hd / 6), 1.8, 4 - Math.abs(i - 2) * 0.5, hd / 6 + 0.2, -16 + i * 7, 0);
  if (hs === 'buzz') head.push(P([-hx - 0.12, yHead + H * 0.58, hz0 - 0.12], [H + 0.24, H * 0.42 + 0.2, hd + 0.24], hairP(hc, { shine: 0 }), { outline: false }));
  if (hs === 'spiky') for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3; lock(Math.cos(a) * (hx - 1.2), top0 + 3, hz0 + hd / 2 + Math.sin(a) * (hd / 2 - 1.6), 2.2, 3.4, 2.2, Math.sin(a) * 34, -Math.cos(a) * 34); }
  if (hs === 'spiky') for (let i = 0; i < 4; i++) lock(-hx + 1.4 + i * ((H - 2.8) / 3), top0 + 0.3, hz1 + 0.5, 2, 2.6, 1, -28, (i - 1.5) * -14);
  if (hs === 'slick') lock(0, top0 + 1.4, hz1 + 0.3, H - 1.2, 2.2, 3.6, 22, 0);
  if (hs === 'long' || hs === 'bob') for (const sx of [-1, 1]) head.push(P([sx < 0 ? -hx - 0.9 : hx - 0.1, hs === 'long' ? yNeck - 2.5 : yHead + H * 0.1, hz1 - 3.4], [1, hs === 'long' ? top0 - yNeck + 1.8 : H * 0.9, 3.6], HP));
  if (hs === 'long') head.push(P([-hx - 0.6, yNeck - 3.5, hz0 - 0.9], [H + 1.2, top0 - yNeck + 3, 1.6], HD));
  if (hs === 'ponytail' || hs === 'bun') bones.push({ name: 'tail', parent: 'head', pivot: [0, top0 - 2, hz0 - 0.6], cubes: hs === 'bun' ? [P([-1.6, top0 - 2.2, hz0 - 2.8], [3.2, 3.2, 2.8], hairP(hc))] : [P([-1.2, top0 - 7.5, hz0 - 2], [2.4, 6.5, 2], hairP(hc), { pivot: [0, top0 - 1.5, hz0 - 1], rot: [-12, 0, 0] })] });
  // face slots
  const eyeY = yHead + H * 0.42, eyeX = H * 0.2, ew = 3, eh = 2.4;
  const states = ['open', 'closed', 'happy', 'angry', 'sad', 'wide'];
  for (const s of [-1, 1]) for (const st of states) head.push(P([s * eyeX - ew / 2, eyeY, fz], [ew, eh, 0], eyeP(st, { ...eyes, side: s }), { plane: 'z', id: 'eye-' + st, hide: st !== 'open' }));
  const browC = o.browColor || shift(hc === '#f0ece4' ? '#b8b0a4' : hc, -0.1);
  for (const s of [-1, 1]) for (const st of ['calm', 'angry', 'sad', 'up']) head.push(P([s * eyeX - ew / 2 - 0.1, eyeY + eh + 0.05, fz + 0.01], [ew + 0.2, 1.2, 0], browP(st, browC, s), { plane: 'z', id: 'brow-' + st, hide: st !== 'calm' }));
  for (const st of ['closed', 'smile', 'frown', 'smirk', 'grin', 'open', 'o', 'shout', 'laugh']) head.push(P([-1.5, yHead + H * 0.12, hz1 - 0.06], [3, 1.6, 0], mouthP(st, skin), { plane: 'z', id: 'mouth-' + st, hide: st !== (o.mouth || 'closed') }));
  if (o.beard) head.push(P([-hx - 0.1, yHead - 0.3, hz1 - 2.6], [H + 0.2, H * 0.3, 2.8], beardP(o.beard, o.beardColor || hc)));
  if (acc.has('glasses') || acc.has('sunglasses')) {
    const dark = acc.has('sunglasses');
    head.push(P([-hx + 0.3, eyeY - 0.3, fz + 0.06], [H - 0.6, eh + 0.6, 0], (p, w, h) => { const lw = Math.floor(w / 2) - 2; for (const x0 of [1, w - 1 - lw]) { p.frame(x0, 0, lw, h, INK); if (dark) p.rect(x0 + 1, 1, lw - 2, h - 2, '#1a1e2a'); if (dark) p.px(x0 + 1, 1, '#7a8aa8'); } p.hl(1 + lw, w - 2 - lw, 1, INK); }, { plane: 'z', id: 'glasses' }));
  }
  if (acc.has('cap')) head.push(P([-hx - 0.5, top0 - 1.6, hz0 - 0.5], [H + 1, 2.4, hd + 1], shade(o.capColor || '#c83a3a')), P([-hx + 0.6, top0 - 1.2, hz1], [H - 1.2, 0.5, 3], shade(shift(o.capColor || '#c83a3a', -0.15))));
  if (acc.has('headphones')) head.push(P([-hx - 1, eyeY - 0.6, -1.2], [1, 2.8, 2.6], shade('#2a2a32')), P([hx, eyeY - 0.6, -1.2], [1, 2.8, 2.6], shade('#2a2a32')), P([-hx - 0.6, top0 + 0.1, -0.6], [H + 1.2, 0.8, 1.2], shade('#3a3a44')));
  if (acc.has('headband')) head.push(P([-hx - 0.3, top0 - 2.4, hz0 - 0.3], [H + 0.6, 1.2, hd + 0.6], shade(o.bandColor || '#f0ece4')));
  if (acc.has('earring')) head.push(P([hx + 0.1, yHead + H * 0.28, -0.3], [0.5, 0.9, 0.5], shade('#f0c840')));
  bones.push({ name: 'head', parent: 'torso', pivot: [0, yNeck, 0], cubes: head });
  const def = { name: o.name || 'person', ppu: 3, scale: o.scale || 1, outline: { color: '#1a1216', px: 1.2 }, bones };
  def.anim = acting(o);
  return def;
}

// ---------------------------------------------------------------- acting clips
const FACE = { eyes: ['open', 'closed', 'happy', 'angry', 'sad', 'wide'], brows: ['calm', 'angry', 'sad', 'up'], mouth: ['closed', 'smile', 'frown', 'smirk', 'grin', 'open', 'o', 'shout', 'laugh'], prop: ['none', 'phone', 'capsule'] };
function talk(P, t, k = 1, rest = 'closed') { const n = Math.floor(t * 9); P.face('mouth', (n * 7919) % 5 < 2 ? rest : ['open', 'o', 'open', 'smile'][n % 4]); P.rot('head', Math.sin(t * 7) * 3 * k, Math.sin(t * 2.3) * 4 * k, 0); }
const swing = (P, ph, a, legs = 1) => { const s = Math.sin(ph); P.rot('armR', -s * a, 0, -3).rot('armL', s * a, 0, 3).rot('legR', s * a * 1.15 * legs).rot('legL', -s * a * 1.15 * legs); };
export function acting(o = {}) {
  const mood = o.mood || 'calm', base = { calm: {}, cool: { mouth: 'smirk' }, tough: { brows: 'angry', mouth: 'frown' }, happy: { mouth: 'smile', brows: 'up' }, tired: { eyes: 'open', brows: 'sad' } }[mood] || {};
  const idleK = o.energy ?? 1;
  return {
    start: 'idle', seed: (o.name || 'p').length * 7,
    breathe: { bone: 'torso', amp: 0.012, per: 3.2 },
    blink: { slot: 'eyes', closed: 'closed', every: [2.5, 5.5], dur: 0.12 },
    look: { bone: 'head', yaw: 40, pitch: 16, speed: 4 },
    springs: [{ bone: 'tail', tip: [0, -5, -1], k: 120, d: 8, gain: 0.8, max: 25 }],
    faces: Object.fromEntries(Object.entries(FACE).map(([slot, list]) => [slot, { default: base[slot] || (slot === 'mouth' ? o.mouth || 'closed' : list[0]), states: Object.fromEntries(list.map((s) => [s, slot === 'prop' ? (s === 'none' ? [] : [s]) : [(slot === 'eyes' ? 'eye-' : slot === 'brows' ? 'brow-' : 'mouth-') + s]])) }])),
    fidget: { every: [6, 11], clips: ['look', 'stretch'] },
    clips: {
      idle: { len: 3.2, loop: true, f(P, t) {
        const sh = Math.sin((t / 3.2) * Math.PI * 2);
        P.pos('hips', sh * 0.25 * idleK, 0, 0).rot('hips', 0, 0, sh * 1.5 * idleK).rot('torso', 0, 0, -sh * 2 * idleK).rot('head', 0, 0, sh * 1.5 * idleK);
        P.rot('armR', 0, 0, -3 - sh * 1.5).rot('armL', 0, 0, 3 - sh * 1.5).rot('legR', 0, 0, -sh * 1.2).rot('legL', 0, 0, -sh * 1.2);
        if (o.idlePose === 'hips') P.rot('armR', 0, 0, -38).rot('handR', 0, 0, 50).rot('armL', 0, 0, 38).rot('handL', 0, 0, -50);
        if (o.idlePose === 'crossed') P.rot('armR', -55, 30, -12).rot('handR', -60, 0, 0).rot('armL', -55, -30, 12).rot('handL', -60, 0, 0);
        if (o.idlePose === 'pockets') P.rot('armR', 8, 0, -6).rot('armL', 8, 0, 6);
      } },
      look: { len: 2.6, next: 'idle', f(P, t) { const k = bump(t, 0.1, 2.4); P.rot('head', 0, 36 * Math.sin(t * 2.4) * k, 0).rot('torso', 0, 8 * Math.sin(t * 2.4) * k, 0); } },
      stretch: { len: 2.2, next: 'idle', f(P, t) { const k = bump(t, 0.1, 2.0); P.rot('armR', 0, 0, -160 * k).rot('armL', 0, 0, 160 * k).sq('torso', 0.06 * k).rot('head', -14 * k, 0, 0).face('eyes', k > 0.5 ? 'closed' : undefined).face('mouth', k > 0.5 ? 'o' : undefined); P.blinkOK = false; } },
      talk: { len: 2.4, loop: true, f(P, t) { talk(P, t, 1, base.mouth || 'closed'); const g = bump(t % 2.4, 0.3, 1.6); P.rot('armR', -40 * g, 0, -12 * g).rot('handR', -30 * g, 0, 0).rot('torso', 0, 6 * g, 0); } },
      walk: { len: 0.9, loop: true, f(P, t) { const ph = (t / 0.9) * Math.PI * 2; swing(P, ph, 26); P.pos('hips', 0, Math.abs(Math.cos(ph)) * 0.5, 0).rot('torso', 3, Math.sin(ph) * 5, 0).rot('head', 0, -Math.sin(ph) * 3, 0); } },
      run: { len: 0.56, loop: true, f(P, t) { const ph = (t / 0.56) * Math.PI * 2; swing(P, ph, 50); P.rot('armR', 0, 0, 0).pos('hips', 0, Math.abs(Math.cos(ph)) * 1.2, 0).rot('torso', 14, Math.sin(ph) * 8, 0).rot('hips', 6, 0, 0).rot('handR', -60).rot('handL', -60); } },
      wave: { len: 2, next: 'idle', f(P, t) { const up = seg(t, 0, 0.25, E.back) * (1 - seg(t, 1.7, 2)); P.rot('armR', 0, 0, -150 * up).rot('handR', 0, 0, wave(t, 2.6) * 30 * up).face('mouth', up > 0.5 ? 'smile' : undefined).face('eyes', up > 0.5 ? 'happy' : undefined).rot('torso', 0, 0, 4 * up); P.blinkOK = up < 0.5; } },
      point: { len: 1.6, next: 'idle', f(P, t) { const up = seg(t, 0, 0.18, E.back) * (1 - seg(t, 1.3, 1.6)); P.rot('armR', -88 * up, -10 * up, -6 * up).rot('torso', 0, -12 * up, 0).rot('head', 0, -6 * up, 0).face('brows', up > 0.5 ? 'up' : undefined).face('mouth', up > 0.5 ? 'open' : undefined); } },
      cheer: { len: 1.4, next: 'idle', f(P, t) {
        const j = t < 0.9 ? Math.max(0, Math.sin(seg(t, 0.15, 0.75, E.lin) * Math.PI)) : 0, crouch = bump(t, 0, 0.2) + bump(t, 0.72, 1.0) * 0.8;
        P.pos('root', 0, j * 4, 0).pos('hips', 0, -crouch * 1.2, 0).rot('legR', -20 * crouch).rot('legL', -20 * crouch).rot('armR', 0, 0, -165 * seg(t, 0.1, 0.3)).rot('armL', 0, 0, 165 * seg(t, 0.1, 0.3)).face('mouth', 'laugh').face('eyes', 'happy'); P.blinkOK = false;
      } },
      think: { len: 3, loop: true, f(P, t) { P.rot('armR', -100, 20, 0).rot('handR', -80, 0, 0).rot('armL', -30, -30, 10).rot('head', 6, 0, 10 + Math.sin(t * 1.2) * 3).face('eyes', 'open').face('brows', 'sad').face('mouth', 'frown'); } },
      shock: { len: 1.1, next: 'idle', f(P, t) { const k = seg(t, 0, 0.1, E.out) * (1 - seg(t, 0.75, 1.1)); P.pos('root', 0, 1.6 * bump(t, 0, 0.3), -1.2 * k).rot('torso', -10 * k, 0, 0).rot('armR', -30 * k, 0, -60 * k).rot('armL', -30 * k, 0, 60 * k).sq('torso', 0.06 * bump(t, 0, 0.3)).face('eyes', 'wide').face('brows', 'up').face('mouth', 'o'); P.blinkOK = false; } },
      angry: { len: 1.2, loop: true, f(P, t) { P.rot('armR', 12, 0, -14).rot('armL', 12, 0, 14).rot('torso', 6, 0, wave(t, 7) * 1.5).rot('head', 8, 0, wave(t, 9) * 2).face('eyes', 'angry').face('brows', 'angry'); talk(P, t, 1.6, 'frown'); if ((t * 9 | 0) % 3) P.face('mouth', 'shout'); } },
      laugh: { len: 0.9, loop: true, f(P, t) { const b = Math.abs(Math.sin((t / 0.45) * Math.PI)); P.rot('head', -14 - b * 6, 0, 0).rot('torso', -6 - b * 3, 0, 0).pos('torso', 0, b * 0.4, 0).rot('armR', -20, 0, -20).rot('armL', -20, 0, 20).face('eyes', 'happy').face('mouth', 'laugh'); P.blinkOK = false; } },
      sad: { len: 3, loop: true, f(P, t) { P.rot('head', 18, 0, 0).rot('torso', 8, 0, 0).rot('armR', 4, 0, 2).rot('armL', 4, 0, -2).face('eyes', 'sad').face('brows', 'sad').face('mouth', 'frown'); P.lookW = 0.2; } },
      phone: { len: 3, loop: true, f(P, t) { P.rot('armR', -62, 12, -8).rot('handR', -30, 0, 0).rot('head', 16, -6, 0).face('eyes', 'open').face('mouth', 'closed'); P.lookW = 0; P.face('prop', 'phone'); if (bump(t, 1.4, 1.6) > 0) P.rot('handR', -36, 0, 0); } },
      throw: { len: 1.3, next: 'idle', f(P, t) {
        const wind = seg(t, 0, 0.4, E.inout) * (1 - seg(t, 0.4, 0.55, E.in)), fling = seg(t, 0.42, 0.56, E.out) * (1 - seg(t, 0.9, 1.3));
        P.rot('armR', 40 * wind - 150 * fling, 0, -20 * wind).rot('torso', -8 * wind + 12 * fling, 30 * wind - 25 * fling, 0).rot('legR', 12 * wind - 18 * fling).rot('legL', -10 * wind + 14 * fling).face('mouth', fling > 0.3 ? 'shout' : 'closed').face('brows', 'angry');
        P.face('prop', t < 0.5 ? 'capsule' : 'none'); if (P.at(0.5)) P.burst(0.5, 'sparkle', 'handR', null, { n: 6 });
      } },
      sit: { len: 3, loop: true, f(P, t) { P.pos('hips', 0, -4.2, 0).rot('legR', -90).rot('legL', -90).rot('armR', -20, 0, -4).rot('armL', -20, 0, 4).rot('handR', -40).rot('handL', -40); } },
    },
  };
}
