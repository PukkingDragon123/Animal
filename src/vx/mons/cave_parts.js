// The Deep Cave's Tokonmon (Geodig, Lumoth, Stalagrin, Lumifin, Tumblock and Magmander): shared face painters
// and the clip sets for their four body plans. Each species file builds its rig from these.
//  - painters: velvet fur, banded granite plates, flowstone, obsidian skin with magma cracks, crystal facets,
//    moth wings with eye-spots and constellations, stone membranes, translucent fins, eyes (glossy or glowing)
//  - clips: idle, walk, attack, special, hurt, faint → down, cry, win, dance, sleep for every plan, plus each
//    plan's own (a quadruped's crawl, the armadillo's roll, the flyer's hang, the fish's swim)
// Bones the clips drive (missing ones are skipped): root, body, head, jaw, tail, tail2, tail3, crest,
// legFR/FL, legBR/BL, wingR/L, wing2R/L, antR/L, finR/L, lure.
import { E, seg, bump, wob, wave } from '../anim.js';
import { shade, ramp, shift, h2 } from './kit.js';
import { B, both, twin } from './story_parts.js';

export { B, both, twin };
const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lit = (face, y, h) => (face === 'up' ? 0 : face === 'down' ? 1 : h > 1 ? y / (h - 1) : 0.5);

// ==================================================================== painters
/** velvet fur: a soft vertical ramp with short brush strokes and a lit rim */
export const furP = (c, o = {}) => (p, w, h, face) => {
  const R = [shift(c, 0.2), shift(c, 0.06), c, shift(c, -0.18), shift(c, -0.34)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let col = ramp(R, lit(face, y, h) * 0.9 + (o.bias || 0), x, y);
    const g = h2(x, y >> 1, 3); if (g < 0.12) col = shift(col, -0.1); else if (g > 0.9) col = shift(col, 0.08);
    if (face !== 'up' && face !== 'down' && (x + (y >> 1)) % 5 === 0 && y % 3 === 1) col = shift(col, 0.12);
    p.px(x, y, col);
  }
  if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, 0, shift(c, 0.3));
};
/** banded granite plates (the armadillo): seams every few texels, ore flecks, lit band tops */
export const bandP = (c, o = {}) => (p, w, h, face) => {
  const R = [shift(c, 0.22), shift(c, 0.08), c, shift(c, -0.16), shift(c, -0.3)], step = o.step || 5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const along = face === 'up' || face === 'down' ? y : x, inBand = along % step;
    let col = ramp(R, lit(face, y, h) * 0.7 + (inBand === 0 ? -0.15 : inBand === step - 1 ? 0.25 : 0), x, y);
    if (inBand === step - 1) col = shift(col, -0.3);
    const g = h2(x, y, 9); if (g > 0.965) col = o.ore || '#e0b860'; else if (g < 0.06) col = shift(col, -0.14);
    p.px(x, y, col);
  }
};
/** flowstone (the dripstone imp): growth rings, wet runs, iron tint */
export const flowP = (c) => (p, w, h, face) => {
  const R = [shift(c, 0.24), shift(c, 0.1), c, shift(c, -0.16), shift(c, -0.3)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let col = ramp(R, lit(face, y, h) * 0.8 + ((y % 4) === 0 ? 0.18 : 0), x, y);
    if (face !== 'up' && h2(x, 0, 5) < 0.18 && h2(x, y >> 2, 6) < 0.7) col = shift(col, 0.14);   // wet runs
    p.px(x, y, col);
  }
};
/** obsidian skin with magma in the cracks (the salamander) */
export const lavaSkinP = (c, lava = '#ff7a24', o = {}) => (p, w, h, face) => {
  const R = [shift(c, 0.22), shift(c, 0.08), c, shift(c, -0.2), shift(c, -0.36)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let col = ramp(R, lit(face, y, h) * 0.85 + (o.bias || 0), x, y);
    const g = h2(x >> 1, y >> 1, 11); if (g < 0.1) col = shift(col, -0.12); else if (g > 0.93) col = shift(col, 0.12);
    p.px(x, y, col);
  }
  // cracks: wandering lines of molten orange with a yellow core
  const n = Math.max(1, Math.round((w * h) / (o.dense ? 60 : 110)));
  for (let k = 0; k < n; k++) {
    let x = Math.floor(h2(k, 1, w * 7 + h) * w), y = Math.floor(h2(k, 2, w + h * 5) * h);
    for (let s = 0; s < 6 + (k % 5); s++) { p.px(x, y, s % 3 === 1 ? '#ffd860' : lava); x += h2(k, s, 3) < 0.5 ? 1 : 0; y += h2(k, s, 4) < 0.6 ? 1 : -1; if (x < 0 || y < 0 || x >= w || y >= h) break; }
  }
};
/** a crystal facet (glow cubes): dark root to a bright tip, an arris highlight and inner sparkles */
export const crystalP = (cols) => (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let col = face === 'up' ? cols[cols.length - 1] : ramp(cols, 1 - (h > 1 ? y / (h - 1) : 0.5) * 0.85, x, y);
    if (x === 0 || x === w - 1) col = shift(col, 0.18);
    if (h2(x, y, 13) > 0.94) col = '#ffffff';
    p.px(x, y, col);
  }
};
/** a moth wing (plane): dusky ramp toward the tips, a scalloped edge, two glowing eye-spots and star dots */
export const wingP = (base, spot, o = {}) => (p, w, h) => {
  const R = [shift(base, 0.24), shift(base, 0.1), base, shift(base, -0.18), shift(base, -0.32)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / Math.max(1, w - 1), v = y / Math.max(1, h - 1), tip = o.flip ? 1 - u : u;
    if ((tip > 0.86 && v > 0.82) || (tip > 0.93 && (y % 4 === 0))) continue;        // ragged outer edge
    let col = ramp(R, tip * 0.8 + v * 0.2, x, y);
    if ((x + y * 3) % 11 === 0) col = shift(col, -0.12);                           // scale rows
    if (y % 6 === 0 && tip > 0.2) col = shift(col, -0.2);                          // veins
    p.px(x, y, col);
  }
  for (const [cu, cv, r] of o.spots || [[0.55, 0.45, 0.17]]) {
    const cx = (o.flip ? 1 - cu : cu) * w, cy = cv * h, R2 = r * Math.min(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R2; if (d < 1) p.px(x, y, d < 0.35 ? '#1a1030' : d < 0.6 ? spot : d < 0.8 ? shift(spot, 0.3) : '#f4ecd8'); }
  }
  for (let k = 0; k < (o.stars ?? 7); k++) { const x = Math.floor(h2(k, 3, w) * w), y = Math.floor(h2(k, 4, h) * h); p.px(x, y, '#fff6c8'); }
};
/** a stone membrane wing (plane): thin grey stretched between dark ribs, drips at the hem */
export const membraneP = (c) => (p, w, h) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = y / Math.max(1, h - 1), hem = v > 0.82 + Math.sin(x * 0.9) * 0.1;
    if (hem) continue;
    let col = ramp([shift(c, 0.2), c, shift(c, -0.22)], v, x, y);
    if (x % 6 === 0 || (x + y) % 13 === 0) col = shift(c, -0.4);                   // ribs
    p.px(x, y, col);
  }
};
/** a translucent fin (plane): rays from the root, paler toward the edge */
export const finP = (c) => (p, w, h) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / Math.max(1, w - 1); p.px(x, y, x % 3 === 0 ? shift(c, -0.25) : ramp([shift(c, -0.1), c, shift(c, 0.3)], u, x, y)); }
};
/** an eye: dark with an iris ring and a catchlight (glow eyes are their own unlit cubes) */
export const eyeP = (iris, o = {}) => (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' || face === o.face ? (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? iris : o.pupil || '#120c18') : shift(iris, -0.4));
  if (w > 1 && h > 1) p.px(1, 1, '#ffffff');
};
export const solidP = (c, o = {}) => shade(c, { grain: 0.03, ...o });
export const glowP = (c, c2 = c) => (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 3 === 0 ? c2 : c); };

// ==================================================================== clips
const TAU = Math.PI * 2;
/** the four legs in a trot (k: amplitude) */
function gait(P, t, per, k = 1, crawl = false) {
  const a = Math.sin((t / per) * TAU) * 26 * k, b = Math.sin((t / per) * TAU + Math.PI) * 26 * k;
  P.rot('legFR', a, 0, 0).rot('legBL', crawl ? a : a, 0, 0).rot('legFL', b, 0, 0).rot('legBR', b, 0, 0);
  if (crawl) P.rot('legFR', 0, a * 0.6, 0).rot('legFL', 0, -b * 0.6, 0).rot('legBR', 0, b * 0.6, 0).rot('legBL', 0, -a * 0.6, 0);
}
/** a tail that swings in an S (all its segments) */
function tailWave(P, t, per, amp, ph = 0) { P.rot('tail', 0, Math.sin((t / per) * TAU + ph) * amp, 0).rot('tail2', 0, Math.sin((t / per) * TAU + ph - 0.9) * amp * 1.2, 0).rot('tail3', 0, Math.sin((t / per) * TAU + ph - 1.8) * amp * 1.4, 0); }
const eyes = (P, s) => P.face('eyes', s);
/**
 * plan: 'quad' (four legs, a tail), 'fly' (wings; hovers), 'swim' (fins and a tail; floats), 'roll' (an armadillo).
 * o: { hover: units the flyer / swimmer floats at, fx: particle kind for its specials, glowFx, big (slower, heavier) }
 */
export function caveClips(plan, o = {}) {
  const fly = plan === 'fly', swim = plan === 'swim', hov = o.hover ?? (fly ? 5 : swim ? 4 : 0), big = o.big ? 1.6 : 1;
  const fx = o.fx || 'sparkle', head = [0, o.headY ?? 10, o.headZ ?? 6];
  const float = (P, t, k = 1) => { if (hov) P.pos('root', 0, hov + Math.sin(t * (fly ? 5 : 2)) * (fly ? 0.8 : 0.5) * k, 0); };
  const flap = (P, t, hz, amp) => { P.rot('wingR', 0, 0, Math.sin(t * hz * TAU) * amp).rot('wingL', 0, 0, -Math.sin(t * hz * TAU) * amp).rot('wing2R', 0, 0, Math.sin(t * hz * TAU - 0.5) * amp * 0.8).rot('wing2L', 0, 0, -Math.sin(t * hz * TAU - 0.5) * amp * 0.8); };
  const fins = (P, t, hz, amp) => { P.rot('finR', 0, 0, Math.sin(t * hz * TAU) * amp).rot('finL', 0, 0, -Math.sin(t * hz * TAU) * amp).rot('tail', 0, Math.sin(t * hz * 0.7 * TAU) * amp * 0.8, 0).rot('lure', Math.sin(t * 1.3 * TAU) * 8, 0, Math.sin(t * 0.9 * TAU) * 6); };
  const C = {
    idle: { len: 2.4 * big, loop: true, f(P, t) {
      const br = Math.sin((t / (2.4 * big)) * TAU);
      float(P, t); P.sq('body', br * 0.02).rot('head', br * 2, Math.sin(t * 0.8) * 6, 0);
      if (fly) flap(P, t, 2.2, 22); if (swim) fins(P, t, 0.8, 18);
      if (plan === 'quad' || plan === 'roll') tailWave(P, t, 2.4 * big, 10);
      P.rot('antR', Math.sin(t * 2) * 6, 0, 0).rot('antL', Math.sin(t * 2 + 1) * 6, 0, 0).rot('crest', 0, 0, Math.sin(t * 1.5) * 2);
    } },
    walk: { len: (fly || swim ? 0.6 : 0.7) * big, loop: true, f(P, t) {
      const per = (fly || swim ? 0.6 : 0.7) * big, bob = Math.abs(Math.sin((t / per) * TAU));
      if (fly) { float(P, t, 1.5); flap(P, t, 5, 38); P.rot('body', 12, 0, 0); }
      else if (swim) { float(P, t); fins(P, t, 2.2, 28); P.rot('body', 0, Math.sin((t / per) * TAU) * 8, 0); }
      else { gait(P, t, per, 1, !!o.crawl); P.pos('body', 0, bob * 0.5, 0); tailWave(P, t, per, o.crawl ? 22 : 12); if (o.crawl) P.rot('body', 0, Math.sin((t / per) * TAU) * 7, 0).rot('head', 0, -Math.sin((t / per) * TAU) * 9, 0); }
    } },
    attack: { len: 0.85 * big, next: 'idle', f(P, t) {
      t /= big; const bk = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.32, 0.44, E.in3) * (1 - seg(t, 0.55, 0.85, E.inout));
      float(P, t); if (fly) flap(P, t, 4, 34); if (swim) fins(P, t, 2, 24);
      P.pos('root', 0, 0, -1.5 * bk + 4 * hit).rot('body', 8 * bk - 10 * hit, 0, 0).rot('head', 14 * bk - 18 * hit, 0, 0).rot('jaw', 30 * hit, 0, 0);
      P.rot('legFR', -50 * hit, 0, 0).rot('legFL', -40 * hit, 0, 0).rot('tail', 0, 20 * bk, 0).sq('body', wob(t, 0.44, 0.06, 4, 7));
      eyes(P, hit > 0.3 ? 'angry' : 'open'); P.blinkOK = false;
      P.burst(0.44, 'dust', 'head', head, { n: 4 }).burst(0.45, 'star', 'head', head, { n: 2 });
    } },
    special: { len: 1.3 * big, next: 'idle', f(P, t) {
      t /= big; const up = seg(t, 0.05, 0.45, E.out) * (1 - seg(t, 0.9, 1.25, E.inout)), go = bump(t, 0.5, 0.9);
      float(P, t); if (fly) flap(P, t, 6, 40); if (swim) fins(P, t, 2.6, 30);
      P.rot('body', -16 * up, 0, 0).rot('head', -22 * up + 26 * go, 0, 0).rot('jaw', 34 * go, 0, 0).pos('root', 0, (fly ? 2 : 1) * up, 0).scl('crest', 1 + 0.25 * up).scl('lure', 1 + 0.4 * go);
      P.rot('legFR', -60 * up, 0, -10 * up).rot('legFL', -60 * up, 0, 10 * up).rot('wingR', 0, 0, -30 * up).rot('wingL', 0, 0, 30 * up);
      eyes(P, up > 0.3 ? 'angry' : 'open'); P.blinkOK = false;
      if (t > 0.5 && t < 0.9) P.stream(o.glowFx || fx, 'head', head, { rate: 40, dir: [0, 0.2, 1], speed: 1.6 });
      P.burst(0.5, fx, 'body', [0, 8, 0], { n: 10, speed: 1.5 });
    } },
    hurt: { len: 0.6, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.6, E.inout));
      float(P, t, 0.5); P.pos('root', 0, 0.6 * k, -2.4 * k).rot('body', -12 * k, 0, wave(t, 12) * 5 * k).sq('body', -0.1 * k).rot('head', -14 * k, 0, 0);
      if (fly) flap(P, t, 7, 30 * k + 10);
      eyes(P, t < 0.4 ? 'closed' : 'open'); P.blinkOK = false; P.burst(0.03, 'sweat', 'head', head, {});
    } },
    faint: { len: 1.6, next: 'down', f(P, t) {
      const fall = seg(t, 0.15, 0.7, E.bounce);
      P.pos('root', 0, hov * (1 - fall), 0).rot('root', 0, 0, 86 * fall).rot('head', 10 * fall, 0, 0);
      if (fly) P.rot('wingR', 0, 0, 50 * fall).rot('wingL', 0, 0, -20 * fall);
      if (swim) P.rot('tail', 0, 30 * fall, 0);
      eyes(P, t > 0.3 ? 'closed' : 'open'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.2, 'star', 'head', head, { n: 4 }).burst(0.7, 'dust', 'root', [0, 0, 0], { n: 8 });
    } },
    down: { len: 2.4, loop: true, f(P, t) { P.rot('root', 0, 0, 86).rot('head', 10, 0, 0); if (fly) P.rot('wingR', 0, 0, 50).rot('wingL', 0, 0, -20); eyes(P, 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5; P.burst(1.2, 'z', 'head', head, {}); } },
    cry: { len: 1.6 * big, next: 'idle', f(P, t) {
      t /= big; const k = seg(t, 0.05, 0.3, E.back) * (1 - seg(t, 1.1, 1.5, E.inout));
      float(P, t); if (fly) flap(P, t, 7, 44 * k + 16); if (swim) fins(P, t, 2.5, 30);
      P.rot('head', -30 * k + wave(t, 9) * 4 * k, 0, 0).rot('jaw', 40 * k, 0, 0).rot('body', -10 * k, 0, 0).scl('crest', 1 + 0.3 * k).pos('root', 0, 0.8 * k, 0);
      P.rot('legFR', -30 * k, 0, 0).rot('legFL', -30 * k, 0, 0).rot('tail', 30 * k, 0, 0);
      eyes(P, 'angry'); P.blinkOK = false;
      P.burst(0.3, 'note', 'head', head, { n: 2 }).burst(0.32, o.glowFx || fx, 'head', head, { n: 8, speed: 1.2 });
    } },
    win: { len: 1.6, next: 'idle', f(P, t) {
      const h1 = bump(t, 0.1, 0.5), h2_ = bump(t, 0.6, 1.0);
      float(P, t); if (fly) flap(P, t, 6, 36); if (swim) fins(P, t, 2, 26);
      P.pos('root', 0, 3 * (h1 + h2_ * 0.7), 0).sq('body', 0.08 * (h1 + h2_)).rot('head', -10 * (h1 + h2_), 0, 0).rot('tail', 20 * h1, 30 * h2_, 0);
      eyes(P, 'happy'); P.burst(0.3, 'sparkle', 'head', head, { n: 5 }).burst(0.8, 'star', 'head', head, { n: 3 });
    } },
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      P.pos('root', 0, fly ? 1 : swim ? hov * 0.6 : 0, 0).pos('body', 0, -1 + br * 0.2, 0).sq('body', br * 0.03).rot('head', 16 + br * 2, 0, 0);
      P.rot('legFR', 70, 0, 0).rot('legFL', 70, 0, 0).rot('legBR', -60, 0, 0).rot('legBL', -60, 0, 0).rot('tail', 0, 40, 0).rot('tail2', 0, 40, 0).rot('tail3', 0, 40, 0);
      if (fly) P.rot('wingR', 0, 0, 40).rot('wingL', 0, 0, -40);
      eyes(P, 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', head, {}).burst(2.1, 'z', 'head', head, {});
    } },
  };
  C.dance = { len: 2.0, next: 'idle', f(P, t) {
    const b = Math.sin(t * 2 * TAU), spin = seg(t, 1.3, 1.8, E.inout);
    float(P, t); if (fly) flap(P, t, 5, 34); if (swim) fins(P, t, 2, 24);
    P.rot('body', 0, b * 18, b * 6).rot('head', 0, -b * 10, b * 6).pos('root', 0, Math.abs(b) * 1.2, 0).rot('root', 0, 360 * spin, 0).rot('tail', 0, b * 30, 0);
    eyes(P, 'happy'); P.burst(0.2, 'note', 'head', head, {}).burst(1.0, 'note', 'head', head, {}).burst(1.8, 'sparkle', 'head', head, { n: 5 });
  } };
  // each plan's own
  if (plan === 'quad') C.crawl = { len: 1.1 * big, loop: true, f(P, t) { const per = 1.1 * big; gait(P, t, per, 1.2, true); tailWave(P, t, per, 24); P.rot('body', 0, Math.sin((t / per) * TAU) * 8, 0).rot('head', -8, -Math.sin((t / per) * TAU) * 10, 0); } };
  if (plan === 'roll') C.roll = { len: 0.5, loop: true, f(P, t) {
    // curled into a boulder: head, legs and tail tucked away, the whole ball spinning forward
    P.scl('head', 0.15).scl('legFR', 0.2).scl('legFL', 0.2).scl('legBR', 0.2).scl('legBL', 0.2).scl('tail', 0.2).scl('body', 1, 1.15, 0.92);
    P.pos('root', 0, 0.6 + Math.abs(Math.sin(t * TAU * 2)) * 0.6, 0).rot('body', (t / 0.5) * 360, 0, 0);
    P.burst(0.1, 'dust', 'root', [0, 0, -3], { n: 2 }); eyes(P, 'closed'); P.blinkOK = false;
  } };
  if (plan === 'fly') C.hang = { len: 3.0, loop: true, f(P, t) {
    // asleep upside down under the roof, wings folded round it, swaying a little
    P.rot('root', 180, 0, Math.sin(t * 1.2) * 4).pos('root', 0, o.hangY ?? 22, 0).rot('wingR', 0, 0, 70).rot('wingL', 0, 0, -70);
    eyes(P, Math.sin(t * 0.7) > 0.85 ? 'open' : 'closed'); P.blinkOK = false; P.lookW = 0;
  } };
  if (plan === 'swim') C.swim = { len: 1.2, loop: true, f(P, t) { fins(P, t, 1.6, 26); P.rot('body', 0, Math.sin(t * TAU / 1.2) * 6, 0); } };
  return C;
}
/** the eyes slot: open / closed / angry / happy (each a set of part ids) */
export function eyeFaces(ids) {
  return { eyes: { default: 'open', states: { open: ids.open, closed: ids.closed, angry: ids.angry || ids.open, happy: ids.happy || ids.closed } } };
}
export function animSpec(clips, o = {}) {
  return { clips, start: 'idle', breathe: { bone: 'body', amp: 0.02, per: 3 }, blink: { slot: 'eyes', closed: 'closed', every: [2.5, 5.5], dur: 0.12 }, look: { bone: 'head', yaw: 35, pitch: 20, speed: 4 }, faces: o.faces, fidget: o.fidget };
}
export { cl };
