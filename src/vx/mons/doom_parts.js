// Shared parts for the Metalfang line (Metalfang → Wyvillain → Doomsdrake), an MF DOOM homage: a
// dusky violet Draco wyvern hidden behind a riveted metal face mask (a forehead band, a nose bridge
// running down the snout, cheek guards slotted with "bars", the mouth left open below — a homage to
// the villain's mask, not a copy), a scruffy beard under the jaw, bone horns, little bat wings and a
// spade tail. Stage 1 sips from a plain brown bottle with a blank label (no brand, ever); stage 2
// pulls up a ragged green hooded cloak; stage 3 is "the Doom" — riveted villain iron, a green tunic,
// a gold-buckled belt and a long hooded cloak. Rhyme-flow touches: silver "rhyme dimes" spill when it
// raps, the cheek guards are slotted like a mic grille, the mask band carries an engraved flow line.
// Faces (creature_rules §7/§9): full-res hand-drawn dragon eyes — a shaded gold iris, a slit pupil, two
// highlights and a lid line — with every key emotion hand-drawn.
// This file: palette, painters, particles, eye maps, an FK/IK helper that solves the bottle-to-mouth
// pose per stage, the parametric model builder and the shared clips.
import * as THREE from '../../../vendor/three.module.js';
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, feathers, gradient, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import { B, L, both, twin, acc, region, stroke, cloth, knit, rib, GOLD, goldP, chainP, formMap, fromHsl, plant, beat, env, D2R } from './story_parts.js';

// ---------------------------------------------------------------- palette
export const C = {
  sc: '#4a4466', scHi: '#6e6894', scLo: '#2c2842', scDeep: '#1c1a2c',
  belly: '#d6ae78', bellyHi: '#f0d4a2', bellyLo: '#a87a48', bellyLine: '#6e4a2c',
  st: ['#f6f8fc', '#d2d6e0', '#a0a6b6', '#686e80', '#3e4252'], stLine: '#232634', socket: '#120e1a',
  horn: ['#f4ead0', '#dccca6', '#ab9772', '#5e4c36'],
  claw: '#ece2c8', clawLo: '#9a8a68',
  mem: '#6c2e50', memHi: '#9c4a72', memLo: '#3e1830',
  beard: '#3a2c26', beardHi: '#6a5244', beardGrey: '#a09888',
  strap: '#3a2a22', strapHi: '#5c4636',
  glass: ['#c8843a', '#8e4c1a', '#5c2c0e', '#361606'], label: '#f0e4c4', labelLo: '#cdb88c', band: '#7a1e22', cap: '#dcb446',
  cloak: '#2f6c3c', cloakHi: '#4e9c58', cloakLo: '#1a3e24', cloakIn: '#0f2418',
  mouth: '#3a0e18', tongue: '#c84a5a', tongueHi: '#ea7c88', fang: '#f6f0de', fangLo: '#c8bea4',
  ink: '#120c16', leather: '#3a2618', leatherHi: '#5e3e26',
};
const ST = C.st;
const side = (f) => f !== 'up' && f !== 'down';

// ---------------------------------------------------------------- painters
export const scaleP = feathers(C.sc, { top: C.scHi, bottom: C.scLo, size: 4 });
const scaleDarkP = feathers(shift(C.sc, -0.1), { top: C.sc, bottom: C.scDeep, size: 4 });
// ventral plates: banded cream scutes, each with a lit top row and a dark seam
const bellyP = (p, w, h, f) => {
  if (!side(f)) { p.rect(0, 0, w, h, f === 'up' ? C.bellyHi : C.bellyLo); return; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = y % 4, edge = f === 'south' && (x === 0 || x === w - 1);
    p.px(x, y, r === 3 ? C.bellyLine : r === 0 ? C.bellyHi : edge ? C.bellyLo : (x + y) % 9 === 0 ? shift(C.belly, -0.06) : C.belly);
  }
};
// brushed steel: flat bands, sparse glints, a lit top edge and a dark bottom bevel
export function steel(o = {}) {
  return (p, w, h, f) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = f === 'up' ? ST[1] : f === 'down' ? ST[3] : ramp([ST[1], ST[2], ST[2], ST[3]], y / Math.max(1, h - 1), x, y);
      if (side(f) && (y * 7 + x * 3) % 17 === 0) c = ST[1];
      p.px(x, y, c);
    }
    if (side(f)) { for (let x = 0; x < w; x++) { p.px(x, 0, ST[0]); if (h > 2) p.px(x, h - 1, ST[4]); } }
    if (o.rivets && side(f) && (o.rivets === true || o.rivets.includes(f)) && w > 4 && h > 3) {
      const ry = Math.min(h - 3, 1 + (o.ry || 0));
      for (let x = 1; x < w - 2; x += o.every || 5) rivet(p, x, ry);
    }
    if (o.edge && side(f)) for (let y = 0; y < h; y++) { p.px(0, y, ST[4]); p.px(w - 1, y, ST[4]); }
  };
}
export function rivet(p, x, y) { p.px(x, y, ST[0]).px(x + 1, y, ST[1]).px(x, y + 1, ST[2]).px(x + 1, y + 1, ST[4]); }
const steelP = steel(), steelRiv = steel({ rivets: true });
// the forehead band of the mask: rivets and an engraved flowing line (the flow)
const browP = (p, w, h, f) => {
  steel()(p, w, h, f);
  if (f !== 'south') return;
  for (let x = 2; x < w - 3; x += 6) rivet(p, x, 1);
  const mid = Math.floor(h / 2) + 1;
  for (let x = 0; x < w; x++) { const y = mid + Math.round(Math.sin(x * 0.55) * 0.9); if (y < h - 1) { p.px(x, y, ST[4]); if (y + 1 < h - 1) p.px(x, y + 1, ST[0]); } }
};
// cheek guards: slotted like a mic grille ("bars"), a rivet at the top
const cheekP = (p, w, h, f) => {
  steel()(p, w, h, f);
  if (!side(f)) return;
  for (let y = 3; y < h - 2; y += 3) for (let x = 1; x < w - 1; x++) { p.px(x, y, C.socket); p.px(x, y + 1, ST[0]); }
  if (w > 3) rivet(p, Math.floor(w / 2) - 1, 0);
};
const noseBarP = (p, w, h, f) => { steel()(p, w, h, f); if (f === 'south') for (let y = 2; y < h - 2; y += 4) rivet(p, Math.max(0, Math.floor(w / 2) - 1), y); };
// the masked snout: steel all over, two nostril slits in front, the roof of the mouth underneath
const snoutP = (p, w, h, f) => {
  if (f === 'down') { p.rect(0, 0, w, h, C.mouth); for (let x = 0; x < w; x++) if (x % 3 !== 1) p.px(x, h - 1, C.fang); for (let y = 0; y < h; y++) { p.px(0, y, C.fang); p.px(w - 1, y, C.fang); } return; }
  steel()(p, w, h, f);
  if (f === 'up') { const cx = Math.floor(w / 2); for (let y = 0; y < h; y++) { p.px(cx - 3, y, ST[3]); p.px(cx + 2, y, ST[3]); } }
  if (f === 'south') {
    const cy = Math.floor(h * 0.42);
    for (const sx of [-1, 1]) { const x0 = Math.floor(w / 2) + sx * Math.round(w * 0.22); for (let k = 0; k < 3; k++) p.px(x0 + sx * (k > 1 ? 1 : 0), cy + k, C.socket); }
    for (let x = 1; x < w - 1; x++) p.px(x, h - 2, ST[3]);
    rivet(p, 1, 1); rivet(p, w - 3, 1);
  }
  if (f === 'east' || f === 'west') for (let x = 2; x < w - 2; x += 5) rivet(p, x, 1);
};
const jawP = (p, w, h, f) => {
  if (f === 'up') { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 2, C.tongue); p.rect(2, 1, w - 4, 2, C.tongueHi); for (let x = 0; x < w; x++) if (x % 3 !== 1) p.px(x, h - 1, C.fang); return; }
  scaleP(p, w, h, f);
  if (f === 'south') for (let x = 0; x < w; x++) p.px(x, 0, x % 3 === 1 ? C.mouth : C.fang);
};
// the skull: scales, with the mask's leather strap and buckle round the back
function skullP(h0, strapA, strapB) {
  return (p, w, h, f) => {
    scaleP(p, w, h, f);
    if (!side(f) || f === 'south') return;
    const a = Math.round(strapA * h), b = Math.max(a + 2, Math.round(strapB * h));
    for (let y = a; y < b; y++) for (let x = 0; x < w; x++) p.px(x, y, y === a ? C.strapHi : (x + y) % 5 === 0 ? shift(C.strap, -0.15) : C.strap);
    for (let x = 1; x < w; x += 3) p.px(x, a + 1, '#8a7258');                                   // stitches
    if (f === 'north') { const cx = Math.floor(w / 2) - 2; p.rect(cx, a - 1, 4, b - a + 2, ST[2]); p.rect(cx + 1, a, 2, b - a, C.strap); }
  };
}
// the face plate: the mask covers the whole upper face; two angular eye holes (dark sockets), rivets,
// and the dark mouth gap at the bottom behind the jaw
function faceP(g) {
  const { x0, top, w: W, eyeX, eyeY, eyeW, eyeH, sny0, ppu } = g;
  return (p, w, h, f) => {
    if (f !== 'south') return;
    steel()(p, w, h, f);
    const tx = (mx) => (mx - x0) * ppu, ty = (my) => (top - my) * ppu;
    for (const s of [-1, 1]) {
      const cx = tx(s * eyeX), cy = ty(eyeY), hw = (eyeW * ppu) / 2 + 1.5, hh = (eyeH * ppu) / 2 + 1;
      // a slanted hole: the top edge drops toward the nose
      region(p, w, h, (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, inward = dx * -s; return Math.abs(dx) <= hw && dy <= hh && dy >= -hh + Math.max(0, inward) * 0.35; }, C.socket);
    }
    for (let x = 1; x < w - 2; x += 7) rivet(p, x, 1);
    const my = ty(sny0); for (let y = Math.round(my); y < h; y++) for (let x = Math.round(tx(-2.4)); x < tx(2.4); x++) p.px(x, y, C.mouth);
  };
}
const hornP = (p, w, h, f) => { gradient(C.horn)(p, w, h, f); if (side(f)) for (let y = 2; y < h - 1; y += 3) for (let x = 0; x < w; x++) p.px(x, y, shift(C.horn[2], -0.08)); };
const hornTipP = (p, w, h, f) => { gradient([C.horn[1], C.horn[2], C.horn[3], '#2e2418'])(p, w, h, f); };
const clawP = gradient([C.claw, C.claw, C.clawLo]);
const fangP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === h - 1 ? C.fangLo : C.fang); };
const goldFangP = (p, w, h, f) => { gradient(GOLD)(p, w, h, f); if (side(f)) p.px(0, 0, '#ffffff'); };
// the beard: dark scruffy strands with a few grey ones (the villain's unkempt chin under the mask)
const beardP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (x + (y >> 1)) % 3; let c = !side(f) ? C.beard : k === 0 ? C.beardHi : k === 1 ? C.beard : shift(C.beard, -0.28);
    if ((x * 7 + y * 5) % 19 === 0) c = C.beardGrey;
    p.px(x, y, c);
  }
};
const beardSolidP = beardP;
// the wing membrane (a plane): hangs under the spar, scalloped between three finger bones.
// tipAtX0: the wing tip is at texel x = 0 (the right wing, which reaches toward −x)
function membraneP(tipAtX0) {
  return (p, w, h) => {
    const U = (x) => (tipAtX0 ? 1 - (x + 0.5) / w : (x + 0.5) / w), base = (u) => h * (0.97 - 0.78 * u), S = [0, 0.38, 0.72, 1];
    const bottom = (u) => { let k = 0; while (k < S.length - 2 && u > S[k + 1]) k++; const fr = (u - S[k]) / (S[k + 1] - S[k]); return base(u) - Math.sin(fr * Math.PI) * h * 0.17; };
    for (let x = 0; x < w; x++) { const u = U(x), by = bottom(u); for (let y = 0; y < h; y++) { if (y + 0.5 > by) continue; p.px(x, y, y + 0.5 > by - 1.2 ? C.memLo : y < 2 ? C.scDeep : (x + y * 2) % 11 === 0 ? C.memHi : y / h < 0.45 ? C.memHi : C.mem); } }
    const xw = (u) => (tipAtX0 ? (1 - u) * w : u * w), wx = xw(0.44);
    for (const s of [0.38, 0.72]) stroke(p, [[wx, 0.5], [xw(s), base(s) - 1]], C.scLo, 1);
  };
}
// the bottle: brown glass, a blank cream label with a maroon band (no words, no logo), a gold-foil cap
const glassP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'up' ? C.glass[1] : f === 'down' ? C.glass[3] : ramp(C.glass, 0.2 + (y / Math.max(1, h - 1)) * 0.7, x, y));
  if (!side(f)) return;
  const y0 = Math.round(h * 0.3), y1 = Math.round(h * 0.78);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) p.px(x, y, y === y0 + 1 || y === y1 - 1 ? C.band : y === y0 || y === y1 ? C.labelLo : C.label);
  for (let y = 1; y < h - 1; y++) if (y < y0 || y > y1) p.px(1, y, '#e8a868');                    // a glint down the glass
};
const neckP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, side(f) ? (x === 0 ? '#e8a868' : C.glass[1]) : C.glass[2]); };
const capP = gradient(['#fff2b0', C.cap, '#a07a20']);
// cloth for the cloak, dark on the inside faces (in: the faces that look inward)
function cloakP(o = {}) {
  const base = cloth(C.cloak, { hi: C.cloakHi, lo: C.cloakLo, folds: o.folds || 5 });
  return (p, w, h, f) => {
    if ((o.in || []).includes(f)) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 6 === 0 ? shift(C.cloakIn, 0.1) : C.cloakIn); return; }
    base(p, w, h, f);
    if (side(f) && o.hem) for (let x = 0; x < w; x++) { const notch = (x * 7) % 5 < 2; p.px(x, h - 1, notch ? C.cloakIn : C.cloakLo); if (notch) p.px(x, h - 2, C.cloakLo); }
    if (side(f) && o.trim) for (let x = 0; x < w; x++) { p.px(x, h - 1, GOLD[2]); p.px(x, h - 2, x % 2 ? GOLD[1] : GOLD[0]); }
  };
}
// villain armour: steel plates with rivets, a centre ridge and lames
const cuirassP = (p, w, h, f) => {
  steel({ rivets: ['east', 'west', 'north'] })(p, w, h, f);
  if (f !== 'south') return;
  const cx = Math.floor(w / 2);
  for (let y = 0; y < h; y++) { p.px(cx - 1, y, ST[0]); p.px(cx, y, ST[3]); }
  for (let y = Math.round(h * 0.55); y < h; y += 4) for (let x = 0; x < w; x++) { p.px(x, y, ST[4]); if (y + 1 < h) p.px(x, y + 1, ST[0]); }
  for (let x = 2; x < w - 2; x += 5) rivet(p, x, 1);
  // a pectoral plate outline with a gold rivet each side
  for (const s of [-1, 1]) { const x0 = cx + s * Math.round(w * 0.24); p.rect(x0 - 1, Math.round(h * 0.3), 3, 3, GOLD[1]); p.px(x0 - 1, Math.round(h * 0.3), GOLD[0]); }
};
const tunicP = (p, w, h, f) => {
  cloth(C.cloak, { hi: C.cloakHi, lo: C.cloakLo, folds: 4 })(p, w, h, f);
  if (!side(f)) return;
  for (let x = 0; x < w; x++) { p.px(x, h - 1, GOLD[2]); p.px(x, h - 2, GOLD[1]); }
  if (f === 'south') { const cx = Math.floor(w / 2); for (let y = Math.round(h * 0.3); y < h; y++) p.px(cx, y, C.cloakIn); }
};
const beltP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? C.leatherHi : y === h - 1 ? shift(C.leather, -0.3) : C.leather); if (side(f)) for (let x = 1; x < w; x += 4) p.px(x, Math.floor(h / 2), '#8a6a4a'); };
const buckleP = (p, w, h, f) => {
  goldP(p, w, h, f);
  if (f === 'south') { region(p, w, h, (x, y) => Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2) < Math.min(w, h) * 0.32, (x, y) => (y < h / 2 ? GOLD[2] : GOLD[3])); p.px(Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, GOLD[0]); }
};
// drip painters
const beanieP = knit('#30344a', { hi: '#4c5272', lo: '#1e2030' });
const beanieRibP = rib('#30344a', { hi: '#4c5272', lo: '#1e2030' });
const micHeadP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 2 ? ST[2] : ST[3]); if (side(f)) for (let x = 0; x < w; x++) p.px(x, 0, ST[0]); };
const micBodyP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < 2 ? ST[1] : x === 0 ? '#3a3a46' : '#1c1c24'); };
const cuffP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, '#1c1a22'); if (side(f)) for (let x = 1; x < w - 1; x += 3) { p.px(x, 1, ST[0]); p.px(x, 2, ST[2]); } };
const studP = gradient([ST[0], ST[1], ST[3]]);
const samplerP = (p, w, h, f) => {
  steel()(p, w, h, f);
  if (f !== 'north' && f !== 'up') return;
  const cols = ['#e8423a', '#f0c23a', '#3ab0e8', '#8a8a9a'];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = 1 + i * Math.floor((w - 2) / 4), y = Math.round(h * 0.38) + j * Math.floor((h * 0.58) / 4); p.rect(x, y, Math.max(1, Math.floor((w - 2) / 4) - 1), Math.max(1, Math.floor((h * 0.58) / 4) - 1), (i + j) % 5 === 0 ? cols[(i + 2 * j) % 3] : cols[3]); }
  for (let i = 0; i < 4; i++) p.px(2 + i * 3, 2, '#1c1c24');                                   // knobs
  p.rect(w - 6, 1, 5, 3, '#7ad8a0');                                                             // the little screen
};
const strapBlk = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? '#4a4652' : '#1c1a22'); if (side(f)) for (let x = 1; x < w; x += 4) p.px(x, Math.floor(h / 2), ST[2]); };
const bookP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'east' || f === 'west' ? (y % 2 ? '#f0e8d0' : '#d8ccb0') : ramp(['#7a1e22', '#5a1418', '#3a0c10'], y / h, x, y));
  if (f === 'south') { p.rect(1, 1, w - 2, 1, GOLD[1]); p.rect(1, h - 2, w - 2, 1, GOLD[1]); }
};
const scepterP = gradient(['#5a5a66', '#2a2a32', '#16161c']);

// ---------------------------------------------------------------- particles
const GREEN = { core: '#f4ffe0', mid: '#b4ff5a', out: '#3ad04a', tip: '#1a8a3a' };
const flameSpr = (c) => (p, W, H, f) => {
  const cx = (W - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / (H - 1), sway = Math.sin(v * 5 + f * 1.7) * (1 - v) * 2.0;
    const half = (v < 0.62 ? Math.pow(v / 0.62, 0.8) : Math.sqrt(Math.max(0, 1 - ((v - 0.62) / 0.38) ** 2))) * (W / 2 - 0.5);
    const d = Math.abs(x - cx - sway) / Math.max(0.5, half); if (d > 1) continue;
    p.px(x, y, d < 0.38 && v > 0.45 ? c.core : d < 0.66 && v > 0.25 ? c.mid : v < 0.3 ? c.tip : c.out);
  }
};
const coinSpr = (k, c) => (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2, rx = [3.2, 2.0, 0.7][k], ry = 3.2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1.05) continue; p.px(x, y, d > 0.5 ? c[2] : x - cx + y - cy < -1 ? c[0] : c[1]); }
};
const SILVER_C = ['#ffffff', '#d8dce8', '#8a92a6'], GOLD_C = ['#fff6c0', '#ffd23a', '#a8701a'];
export const DFX = {
  flame: defineFx('doom-flame', { w: 9, h: 13, frames: [0, 1, 2, 3].map(() => flameSpr(GREEN)), glow: true, life: [0.35, 0.6], size: [0.14, 0.05], speed: [0.2, 0.6], grav: -1.6, drag: 1.5, spread: 0.6, fps: 14 }),
  breath: defineFx('doom-breath', { w: 9, h: 13, frames: [0, 1, 2, 3].map(() => flameSpr(GREEN)), glow: true, life: [0.38, 0.62], size: [0.1, 0.42], speed: [3.6, 5.2], grav: -0.9, drag: 2.6, spread: 0.22, fps: 16 }),
  dime: defineFx('doom-dime', { w: 7, h: 7, frames: [0, 1, 2, 1].map((k) => coinSpr(k, SILVER_C)), fps: 14, life: [0.7, 1.1], size: [0.075, 0.075], speed: [1.4, 2.6], grav: 7, drag: 0.5, spread: 0.6 }),
  golddime: defineFx('doom-golddime', { w: 7, h: 7, frames: [0, 1, 2, 1].map((k) => coinSpr(k, GOLD_C)), fps: 14, life: [0.7, 1.1], size: [0.075, 0.075], speed: [1.4, 2.6], grav: 7, drag: 0.5, spread: 0.6, glow: true }),
};
const GREEN_T = [0.55, 1, 0.5];

// ---------------------------------------------------------------- eyes (§7/§9: full-res, hand-drawn, no bullseye rings)
// A dragon's eye seen through the mask's eye holes: no whites, a gold iris shaded dark under the lid and
// bright along the bottom, a black slit pupil, two square highlights, the lid line dropping toward the
// nose with a flick at the outer corner. Every key emotion is hand-drawn.
export const EYE_MAPS = {
  open: ['ll..........', 'lllll.......', 'IIIllllllll.', 'IIIIIkkIllll', 'ihhiikkiiii.', 'ihhiikkiiic.', '.cciikkicc..', '..ccccccc...'],
  angry: ['l...........', 'llll........', 'IIlllll.....', 'IhhIkklllll.', 'ihhikkiiilll', '.ccikkiccc..', '..ccccccc...', '............'],
  sad: ['............', '.........lll', '......llllII', 'llllllIIIIII', 'iiiiikkiiii.', 'ihhiikkiiic.', '.cciikkicc..', '..ccccccc...'],
  happy: ['............', '............', '....llll....', '..llllllll..', '.lll....lll.', 'll........ll', 'l..........l', '............'],
  closed: ['............', '............', '............', '............', 'llllllllllll', '.llllllllll.', '............', '............'],
  shock: ['lllllllll...', 'IIIIIIIIIll.', 'ihhiiiiiiii.', 'ihhiiiiiiii.', 'iiiiikkiiii.', 'iiiiikkiiic.', '.ccccccccc..', '..ccccccc...'],
  wide: ['lllllllll...', 'IIIIIIIIIll.', 'ihhiikkiiii.', 'ihhiikkiiii.', 'iiiiikkiiii.', 'iiiiiiiiiic.', '.ccccccccc..', '..ccccccc...'],
  smug: ['............', '............', 'llll........', 'llllllllllll', 'IIIIIkkIIII.', 'ihhiikkiiic.', '.cciikkicc..', '..ccccccc...'],
  sleepy: ['............', '............', '............', '............', 'llllllllllll', 'IIIIIkkIIIc.', '.cciikkicc..', '..ccccccc...'],
};
const EYE_OPT = { style: 'pix', chunk: 1, line: C.ink, iris: '#f2b62a', irisDark: '#a8561a', pupilColor: '#140a08', accent: '#ffe48a', extra: ['smug'], map: EYE_MAPS };

// ---------------------------------------------------------------- forward kinematics (solving poses at load)
function chainOf(byName, bone) { const c = []; for (let b = byName[bone]; b; b = b.parent ? byName[b.parent] : null) c.unshift(b); return c; }
const _e = new THREE.Euler(), _m = new THREE.Matrix4();
export function fk(byName, pose, bone, pt) {
  const M = new THREE.Matrix4(); let pp = [0, 0, 0];
  for (const b of chainOf(byName, bone)) {
    const r = pose[b.name] || [0, 0, 0], rest = b.rot || [0, 0, 0];
    _m.makeRotationFromEuler(_e.set((rest[0] + r[0]) * D2R, (rest[1] + r[1]) * D2R, (rest[2] + r[2]) * D2R));
    _m.setPosition(b.pivot[0] - pp[0], b.pivot[1] - pp[1], b.pivot[2] - pp[2]);
    M.multiply(_m); pp = b.pivot;
  }
  const v = pt ? new THREE.Vector3(pt[0] - pp[0], pt[1] - pp[1], pt[2] - pp[2]).applyMatrix4(M) : null;
  return { M, v, q: new THREE.Quaternion().setFromRotationMatrix(M) };
}
function descend(x0, f, steps = [16, 8, 4, 2, 1, 0.5, 0.25]) {
  let x = x0.slice(), best = f(x);
  for (const s of steps) { let imp = true, guard = 0; while (imp && guard++ < 80) { imp = false; for (let i = 0; i < x.length; i++) for (const d of [s, -s]) { const y = x.slice(); y[i] += d; const v = f(y); if (v < best) { best = v; x = y; imp = true; } } } }
  return { x, err: best };
}
// two-bone reach: arm (3 axes) + hand (x) so that point `pt` on the hand lands on `target`
export function reach(byName, arm, hand, pt, target, init, extra = {}) {
  const T = new THREE.Vector3(...target), prefer = init.slice();
  const r = descend(init, (x) => { const pose = { ...extra, [arm]: [x[0], x[1], x[2]], [hand]: [x[3], 0, 0] }; const v = fk(byName, pose, hand, pt).v; return v.distanceToSquared(T) + 0.0004 * x.reduce((a, xi, i) => a + (xi - prefer[i]) ** 2, 0); });
  return { arm: r.x.slice(0, 3), hand: [r.x[3], 0, 0], err: Math.sqrt(r.err) };
}

// ---------------------------------------------------------------- geometry per stage
const GEO = {
  1: { scale: 0.44, ol: 1.4,
    foot: { x: 3.1, w: 3.8, h: 1.5, d: 4.6, z0: -1.6 }, leg: { w: 3.6, d: 3.8, y0: 1.2, y1: 5.8, z0: -1.8 },
    belly: { w: 10, d: 8.4, y0: 4.4, y1: 12, z0: -4.0 }, chest: { w: 8.8, d: 7.2, y0: 11.4, y1: 14.2, z0: -3.4 },
    head: { y0: 13.4, w: 10.6, h: 9.0, d: 9.4, z0: -4.3, pz: 0.4 }, snout: { w: 6.2, h: 4.2, l: 4.8, dy: 0.8 },
    jaw: { w: 4.8, h: 2.0, l: 5.6 }, eye: { x: 2.8, dy: 6.9 },
    arm: { sh: [-4.6, 12.0, 0.6], upW: 2.6, up: [12.6, 8.4], el: 8.8, foreW: 2.4, fore: [9.0, 5.0], claw: 1.1 },
    bottle: { s: 1 }, wing: { root: [-2.4, 12.8, -3.7], span: 6, drop: 5.2, spar: 0.9 },
    tail: { root: [0, 6.4, -3.6], segs: [[4.6, 3.4, 3.0], [4.0, 2.4, 2.2], [3.2, 1.6, 1.6]], spade: 3.0 },
    horn: { x: 3.2, l1: 3.4, l2: 3.0, w: 1.8 }, beard: 1, lie: 4.4 },
  2: { scale: 0.48, ol: 1.5,
    foot: { x: 3.6, w: 4.2, h: 1.6, d: 5.4, z0: -1.8 }, leg: { w: 4.0, d: 4.2, y0: 1.2, y1: 8.8, z0: -2.0 },
    belly: { w: 11, d: 9, y0: 7.4, y1: 15.4, z0: -4.4 }, chest: { w: 12, d: 8.2, y0: 15.0, y1: 20.2, z0: -4.0 }, neck: { w: 5.4, d: 5.4, y0: 19.6, y1: 22.6, z0: -2.4 },
    head: { y0: 22.0, w: 10, h: 8.4, d: 9.0, z0: -3.8, pz: 0.6 }, snout: { w: 6.4, h: 4.2, l: 6.2, dy: 0.4 },
    jaw: { w: 4.8, h: 2.0, l: 6.6 }, eye: { x: 2.7, dy: 6.0 },
    arm: { sh: [-6.4, 19.2, 0.4], upW: 2.8, up: [19.8, 13.4], el: 13.8, foreW: 2.6, fore: [14.0, 8.8], claw: 1.3 },
    bottle: { s: 1.15 }, wing: { root: [-2.8, 19.6, -6.4], span: 9, drop: 7.4, spar: 1.1 },
    tail: { root: [0, 8.4, -4.2], segs: [[6, 3.8, 3.4], [5, 2.8, 2.6], [4, 1.8, 1.8]], spade: 3.6 },
    horn: { x: 3.2, l1: 3.8, l2: 3.4, w: 1.8 }, beard: 1.2, lie: 5.0, hood: true, cape: { y1: 20.4, y0: 8.8, z: -5.0, w: 14 } },
  3: { scale: 0.56, ol: 1.6,
    foot: { x: 4.0, w: 4.8, h: 1.8, d: 6.2, z0: -2.0 }, leg: { w: 4.6, d: 4.6, y0: 1.4, y1: 11.6, z0: -2.3 },
    belly: { w: 12.4, d: 9.4, y0: 10.2, y1: 16.8, z0: -4.6 }, chest: { w: 14, d: 9.6, y0: 16.4, y1: 24.6, z0: -4.8 }, neck: { w: 9.2, d: 7.0, y0: 23.8, y1: 26.2, z0: -3.4 },
    head: { y0: 25.8, w: 10, h: 8.6, d: 9.0, z0: -3.8, pz: 0.6 }, snout: { w: 6.4, h: 4.4, l: 6.6, dy: 0.4 },
    jaw: { w: 4.8, h: 2.0, l: 6.8 }, eye: { x: 2.7, dy: 6.2 },
    arm: { sh: [-7.8, 23.0, 0.4], upW: 3.4, up: [23.6, 16.6], el: 17.0, foreW: 3.6, fore: [17.2, 10.6], claw: 0, fist: true },
    wing: { root: [-3.2, 24.0, -7.0], span: 13, drop: 10.5, spar: 1.3 },
    tail: { root: [0, 11.0, -4.6], segs: [[7, 4.4, 3.8], [6, 3.2, 2.8], [5, 2.0, 2.0]], spade: 4.4 },
    horn: { x: 3.2, l1: 4.2, l2: 3.8, w: 2.0 }, beard: 1.4, lie: 6.2, hood: true, armour: true, cape: { y1: 24.8, y0: 2.6, z: -5.4, w: 16, split: true } },
};

// ---------------------------------------------------------------- the builder
export function doomDef(stage) {
  const g = GEO[stage], name = ['', 'metalfang', 'wyvillain', 'doomsdrake'][stage];
  const H = g.head, hTop = H.y0 + H.h, zf = H.z0 + H.d, sn = g.snout, sny0 = H.y0 + sn.dy, snTop = sny0 + sn.h;
  const eyeY = H.y0 + g.eye.dy, eyeW = 12 / 3, eyeH = 8 / 3, browY = eyeY + eyeH / 2 + 0.05;
  const headPiv = [0, H.y0, H.pz];
  const jw = g.jaw, jawZ0 = zf - 0.8, jawY0 = sny0 - jw.h + 0.4, jawPiv = [0, sny0 + 0.2, jawZ0 + 0.2];
  const MOUTH = [0, sny0, zf + sn.l + 0.4], TOP = [0, hTop + 2.6, 0];
  const strapA = (hTop - (eyeY + 0.2)) / H.h, strapB = (hTop - (eyeY - 0.8)) / H.h;
  const F = g.foot, Lg = g.leg, LEG = Lg.y1 - 0.2 - F.h, legPiv = [-F.x, Lg.y1 - 0.2, Lg.z0 + Lg.d / 2];
  const A = g.arm, bodyPiv = [0, g.belly.y0 + 0.6, 0];
  const cubes = { body: [], head: [], jaw: [], handR: [], handL: [], armR: [], armL: [], footR: [], legR: [] };

  // ---- feet and legs
  if (g.armour) {
    cubes.footR.push(B([-F.x - F.w / 2, 0, F.z0], [F.w, F.h, F.d], steel({ rivets: ['east'] })), B([-F.x - F.w / 2 + 0.6, 0, F.z0 + F.d], [F.w - 1.2, F.h * 0.8, 1.4], steelP));
    cubes.legR.push(B([-F.x - Lg.w / 2, Lg.y0, Lg.z0], [Lg.w, Lg.y1 - Lg.y0, Lg.d], scaleP), B([-F.x - Lg.w / 2 - 0.3, Lg.y0 + 0.4, Lg.z0 + Lg.d - 0.6], [Lg.w + 0.6, (Lg.y1 - Lg.y0) * 0.58, 1.2], steel({ rivets: ['south'] })), B([-F.x - 1.6, Lg.y0 + (Lg.y1 - Lg.y0) * 0.6, Lg.z0 + Lg.d - 0.2], [3.2, 2.2, 1.0], steelRiv));
  } else {
    cubes.footR.push(B([-F.x - F.w / 2, 0, F.z0], [F.w, F.h, F.d], scaleDarkP), ...[-1, 0, 1].map((k) => B([-F.x + k * (F.w / 3) - 0.45, 0, F.z0 + F.d], [0.9, 0.9, 1.1], clawP)), B([-F.x - 0.5, 0, F.z0 - 0.9], [1.0, 0.8, 1.0], clawP));
    cubes.legR.push(B([-F.x - Lg.w / 2, Lg.y0, Lg.z0], [Lg.w, Lg.y1 - Lg.y0, Lg.d], scaleP));
  }
  // ---- body
  const Bl = g.belly, Ch = g.chest;
  cubes.body.push(B([-Bl.w / 2, Bl.y0, Bl.z0], [Bl.w, Bl.y1 - Bl.y0, Bl.d], g.armour ? steel({ rivets: true, every: 6 }) : scaleP), B([-Ch.w / 2, Ch.y0, Ch.z0], [Ch.w, Ch.y1 - Ch.y0, Ch.d], g.armour ? cuirassP : scaleP));
  if (!g.armour) cubes.body.push(B([-Bl.w * 0.36, Bl.y0 + 0.4, Bl.z0 + Bl.d - 0.2], [Bl.w * 0.72, (Ch.y1 - 0.6) - (Bl.y0 + 0.4), 0.7], bellyP));
  if (g.neck) cubes.body.push(B([-g.neck.w / 2, g.neck.y0, g.neck.z0], [g.neck.w, g.neck.y1 - g.neck.y0, g.neck.d], g.armour ? steel({ rivets: true }) : scaleP));
  // dorsal spikes down the back (hidden under the cloak on later stages)
  if (!g.cape) for (const [k, y] of [[0, Bl.y0 + 2.4], [1, Bl.y0 + 5.0], [2, Ch.y1 - 1.2]]) cubes.body.push(B([-0.6, y, Bl.z0 - 1.0 + k * 0.2], [1.2, 1.4, 1.2], clawP, { pivot: [0, y, Bl.z0], rot: [-30, 0, 0] }));
  if (g.armour) {
    const tu = { y0: Bl.y0 - 2.4, y1: Bl.y0 + 3.4 };
    cubes.body.push(B([-Bl.w / 2 - 0.4, tu.y0, Bl.z0 - 0.4], [Bl.w + 0.8, tu.y1 - tu.y0, Bl.d + 0.8], tunicP));
    cubes.body.push(B([-Bl.w / 2 - 0.6, Bl.y1 - 1.2, Bl.z0 - 0.6], [Bl.w + 1.2, 1.8, Bl.d + 1.2], beltP), B([-1.6, Bl.y1 - 1.6, Bl.z0 + Bl.d + 0.5], [3.2, 2.6, 0.6], buckleP));
  }
  // ---- arms (claws, or iron gauntlets on the Doom)
  const ax = A.sh[0] - 0.5, az = A.sh[2];
  cubes.armR.push(B([ax - A.upW / 2, A.up[1], az - A.upW / 2], [A.upW, A.up[0] - A.up[1], A.upW], scaleP));
  if (g.armour) cubes.armR.push(B([ax - 2.6, A.up[0] - 2.6, az - 3.0], [5.2, 3.4, 6.0], steel({ rivets: true })), B([ax - 2.4, A.up[0] - 4.2, az - 2.7], [4.8, 1.8, 5.4], steelP));
  const fx = A.sh[0] - 0.8;
  cubes.handR.push(B([fx - A.foreW / 2, A.fore[1], az - A.foreW / 2], [A.foreW, A.fore[0] - A.fore[1], A.foreW], g.armour ? steel({ rivets: ['east', 'west'] }) : scaleP));
  if (g.armour) cubes.handR.push(B([fx - A.foreW / 2 - 0.5, A.fore[0] - 2.2, az - A.foreW / 2 - 0.5], [A.foreW + 1, 1.8, A.foreW + 1], steelRiv), B([fx - 1.6, A.fore[1] - 2.4, az - 1.5], [3.2, 2.6, 3.0], steelP), ...[-1, 0, 1].map((k) => B([fx + k * 1.0 - 0.3, A.fore[1] - 1.4, az + 1.5], [0.6, 0.6, 0.6], steelP)));
  const clawsL = [-1, 0, 1].map((k) => B([fx + k * (A.foreW / 3) - 0.35, A.fore[1] - A.claw, az + 0.2], [0.7, A.claw, 0.8], clawP));
  cubes.handL.push(...cubes.handR.map(L), ...(g.armour ? [] : clawsL.map(L)));
  // the right hand holds the bottle (stages 1–2); its claws wrap round the glass
  const BT = g.bottle, bs = BT ? BT.s : 1, grip = [fx, A.fore[1] - 0.5, az + 0.3];
  const bottleCubes = [];
  if (BT) {
    // carried by the neck, hanging at its side: the neck passes through the fist, the body hangs below
    const [bx, by, bz] = grip, bw = 2.2 * bs;
    bottleCubes.push(
      B([bx - bw / 2, by - 5.0 * bs, bz - bw / 2], [bw, 3.4 * bs, bw], glassP),
      B([bx - 0.75 * bs, by - 1.6 * bs, bz - 0.75 * bs], [1.5 * bs, 0.6 * bs, 1.5 * bs], neckP),
      B([bx - 0.45 * bs, by - 1.0 * bs, bz - 0.45 * bs], [0.9 * bs, 1.6 * bs, 0.9 * bs], neckP),
      B([bx - 0.55 * bs, by + 0.6 * bs, bz - 0.55 * bs], [1.1 * bs, 0.4 * bs, 1.1 * bs], capP));
    cubes.handR.push(B([fx - 1.1, A.fore[1] - 1.2, az - 0.9], [2.2, 1.4, 2.4], scaleP), ...[-1, 0, 1].map((k) => B([fx + k * 0.65 - 0.25, A.fore[1] - 1.0, az + 1.5], [0.5, 0.8, 0.5], clawP)));
  } else if (!g.armour) cubes.handR.push(...clawsL);
  // ---- head: skull, the mask, horns, fangs
  const x0 = -H.w / 2;
  cubes.head.push(B([x0, H.y0, H.z0], [H.w, H.h, H.d], skullP(H.h, strapA, strapB), { faces: { south: faceP({ x0, top: hTop, w: H.w, eyeX: g.eye.x, eyeY, eyeW, eyeH, sny0, ppu: 3 }) } }));
  cubes.head.push(B([-sn.w / 2, sny0, zf], [sn.w, sn.h, sn.l], snoutP));
  cubes.head.push(B([x0 - 0.3, browY, zf - 0.6], [H.w + 0.6, 1.2, 1.4], browP));                               // forehead band
  cubes.head.push(B([-0.7, snTop - 0.1, zf], [1.4, browY - snTop + 0.1, 0.7], noseBarP));                       // nose bridge
  cubes.head.push(B([-0.6, snTop, zf + 0.4], [1.2, 0.6, sn.l - 0.8], steelP));                                  // ridge down the snout
  const chTop = eyeY - eyeH / 2 - 0.1, chY0 = sny0 - 0.5, chW = H.w / 2 + 0.3 - sn.w / 2;
  cubes.head.push(...both(B([x0 - 0.3, chY0, zf], [chW, chTop - chY0, 0.8], cheekP), B([x0 - 0.35, chY0, zf - 1.6], [0.5, chTop - chY0, 2.4], cheekP), B([-sn.w / 2 + 0.15, sny0 - 1.3, zf + sn.l - 1.1], [0.8, 1.4, 0.8], fangP)));
  const HN = g.horn;
  cubes.head.push(...both(B([-HN.x - HN.w / 2, hTop - 0.6, H.z0 + 2.0], [HN.w, HN.l1, HN.w], hornP, { pivot: [-HN.x, hTop - 0.6, H.z0 + 2.8], rot: [-26, 0, 14] }),
    B([-HN.x - HN.w * 0.35, hTop - 0.6 + HN.l1 - 0.4, H.z0 + 2.0 + HN.w * 0.15], [HN.w * 0.7, HN.l2, HN.w * 0.7], hornTipP, { pivot: [-HN.x, hTop - 0.6, H.z0 + 2.8], rot: [-50, 0, 16] })));
  // ---- the jaw and the beard (a scruffy chin tuft and sideburns)
  const bd = g.beard;
  cubes.jaw.push(B([-jw.w / 2, jawY0, jawZ0], [jw.w, jw.h, jw.l], jawP));
  cubes.jaw.push(B([-1.3 * bd, jawY0 - 1.7 * bd, jawZ0 + jw.l - 2.4 * bd], [2.6 * bd, 1.8 * bd, 2.2 * bd], beardP), B([-0.8 * bd, jawY0 - 2.8 * bd, jawZ0 + jw.l - 2.0 * bd], [1.6 * bd, 1.2 * bd, 1.6 * bd], beardP), B([-0.4 * bd, jawY0 - 3.5 * bd, jawZ0 + jw.l - 1.7 * bd], [0.8 * bd, 0.8 * bd, 1.0 * bd], beardP));
  cubes.jaw.push(...both(B([-jw.w / 2 - 0.4, jawY0 - 0.8, jawZ0 + 0.4], [0.7, 1.6, jw.l - 1.4], beardSolidP)));
  // ---- the hood (stages 2–3): framing the mask, horns poking through
  const hood = [];
  if (g.hood) {
    // a soft cowl: an overhanging crown that shadows the brow, side panels with a dark opening, drapes that
    // flare onto the shoulders, and a pointed tip falling back from the crown
    const hx = H.w / 2 + 0.9, hz0 = H.z0 - 1.2, hz1 = zf + 1.0, piv = [0, hTop, hz0];
    hood.push(B([-hx, hTop - 0.2, hz0], [hx * 2, 1.6, hz1 - hz0 + 0.4], cloakP({ in: ['down'] }), { pivot: piv, rot: [7, 0, 0] }));
    hood.push(B([-hx + 0.2, hTop - 0.9, hz1 - 0.2], [hx * 2 - 0.4, 1.0, 0.9], cloakP({ in: ['down', 'north'] }), { pivot: piv, rot: [7, 0, 0] }));
    hood.push(...both(B([-hx, H.y0 - 0.8, hz0], [1.1, hTop - H.y0 + 0.8, hz1 - hz0], cloakP({ in: ['east', 'south'] })),
      B([-hx - 0.5, H.y0 - 3.6, hz0 + 0.4], [1.3, 3.4, hz1 - hz0 - 1.6], cloakP({ in: ['east'], hem: true }), { pivot: [-hx, H.y0 - 0.4, 0], rot: [0, 0, -16] })));
    hood.push(B([-hx, H.y0 - 2.6, hz0 - 1.2], [hx * 2, hTop - H.y0 + 3.6, 1.2], cloakP({ in: ['south'] })));
    hood.push(B([-1.9, hTop - 1.2, hz0 - 3.4], [3.8, 2.0, 4.2], cloakP({}), { pivot: [0, hTop, hz0], rot: [-34, 0, 0] }));
    hood.push(B([-1.1, hTop - 1.6, hz0 - 6.0], [2.2, 1.4, 3.0], cloakP({}), { pivot: [0, hTop, hz0], rot: [-52, 0, 0] }));
  }
  // ---- the cloak: a mantle round the shoulders, lapels down the chest, the cape on two spring bones
  const cape = g.cape, capeBones = [];
  if (cape) {
    const my0 = Ch.y1 - 1.6, mz0 = Ch.z0 - 1.0, mz1 = g.armour ? Ch.z0 + Ch.d * 0.55 : Ch.z0 + Ch.d + 0.6;
    cubes.body.push(B([-Ch.w / 2 - 1.2, my0, mz0], [Ch.w + 2.4, 2.4, mz1 - mz0], cloakP({ in: ['down'] })));
    if (g.armour) {
      // the cloak falls from the shoulders and is held across the iron chest by two gold clasps and a chain
      cubes.body.push(...both(B([-Ch.w / 2 - 1.2, Ch.y0 + 1.0, mz0], [1.4, my0 - Ch.y0 - 0.8, mz1 - mz0 + 1.0], cloakP({ in: ['east'], trim: true })), B([-Ch.w / 2 + 0.6, my0 - 0.6, Ch.z0 + Ch.d - 0.2], [2.2, 2.2, 0.7], buckleP)));
      cubes.body.push(B([-Ch.w / 2 + 2.6, my0 + 0.1, Ch.z0 + Ch.d - 0.1], [Ch.w - 5.2, 0.8, 0.5], chainP));
    } else cubes.body.push(...both(B([-Ch.w / 2 - 0.8, Bl.y0 + 2.0, Ch.z0 + Ch.d - 0.6], [Ch.w * 0.3, my0 - (Bl.y0 + 2.0), 1.4], cloakP({ in: ['north'], hem: true }))));
    const cw = cape.w, ymid = cape.y0 + (cape.y1 - cape.y0) * 0.5;
    capeBones.push({ name: 'cape1', parent: 'body', pivot: [0, cape.y1, cape.z], cubes: [B([-cw / 2, ymid - 0.2, cape.z - 1.2], [cw, cape.y1 - ymid + 0.2, 1.2], cloakP({ in: ['south'] }))] });
    const low = (x0c, w) => B([x0c, cape.y0, cape.z - 1.4], [w, ymid - cape.y0 + 0.2, 1.2], cloakP({ in: ['south'], hem: !g.armour, trim: g.armour }));
    if (cape.split) {
      capeBones.push({ name: 'cape2R', parent: 'cape1', pivot: [-cw / 4, ymid, cape.z - 0.6], cubes: [low(-cw / 2 - 0.4, cw / 2 - 0.6)] });
      capeBones.push({ name: 'cape2L', parent: 'cape1', pivot: [cw / 4, ymid, cape.z - 0.6], cubes: [low(1.0, cw / 2 - 0.6)] });
    } else capeBones.push({ name: 'cape2', parent: 'cape1', pivot: [0, ymid, cape.z - 0.6], cubes: [low(-cw / 2 - 0.4, cw + 0.8)] });
  }
  // ---- wings: a bone spar and a scalloped membrane plane
  const W = g.wing, [wx, wy, wz] = W.root;
  const wingCubes = [
    B([wx - W.span, wy - W.spar / 2, wz - W.spar / 2], [W.span, W.spar, W.spar], scaleDarkP),
    B([wx - W.span * 0.44 - 0.4, wy + W.spar / 2 - 0.1, wz - 0.4], [0.8, 1.0 * W.spar, 0.8], clawP),
    B([wx - W.span - 0.3, wy - W.drop + 0.4, wz], [W.span + 0.3, W.drop, 0], membraneP(true), { plane: 'z' }),
  ];
  // ---- tail: three segments and a spade
  const T = g.tail, [, ty, tz] = T.root, tailBones = [];
  let z = tz; T.segs.forEach(([len, w, h], i) => {
    const nm = 'tail' + (i + 1), cs = [B([-w / 2, ty - h / 2, z - len - 0.4], [w, h, len + 0.6], i === 0 ? scaleP : scaleDarkP)];
    if (i < 2) cs.push(B([-0.45, ty + h / 2 - 0.2, z - len * 0.6], [0.9, 1.0, 1.0], clawP, { pivot: [0, ty + h / 2, z - len * 0.5], rot: [-35, 0, 0] }));
    if (i === 2) cs.push(B([-T.spade / 2, ty - 0.5, z - len - T.spade * 0.8], [T.spade, 1.0, T.spade * 0.8], clawP), B([-T.spade * 0.3, ty - 0.45, z - len - T.spade * 1.2], [T.spade * 0.6, 0.9, 0.6], hornTipP));
    tailBones.push({ name: nm, parent: i ? 'tail' + i : 'body', pivot: [0, ty, z], rot: [[-12, 14, 18][i], 0, 0], cubes: cs });
    z -= len;
  });

  // ---------------------------------------------------------------- drip accessories
  const D = { body: [], head: [], handL: [], armR: [], handR: [], jaw: [] }, extraBones = [];
  const chestFront = (g.armour ? Ch.z0 + Ch.d : Bl.z0 + Bl.d) + 0.4;
  // gold rope chain with a little gold microphone pendant (every stage)
  const chainY = Ch.y1 - 1.0, pendY = chainY - 3.6 - stage * 0.4;
  D.body.push(...acc('acc-chain', [...both(B([-Ch.w * 0.36, chainY - 0.2, chestFront], [Ch.w * 0.36, 0.8, 0.6], chainP, { pivot: [-Ch.w * 0.18, chainY, chestFront + 0.3], rot: [0, 0, 30] })), B([-0.5, pendY + 2.0, chestFront], [1.0, 1.0, 0.6], goldP), B([-0.8, pendY, chestFront], [1.6, 2.0, 0.8], goldP), B([-0.4, pendY - 1.4, chestFront + 0.1], [0.8, 1.4, 0.6], goldP)]));
  // stage 1: a knit beanie (horns poke through)
  if (stage === 1) D.head.push(...acc('acc-beanie', [B([x0 - 0.3, hTop - 2.2, H.z0 - 0.3], [H.w + 0.6, 1.2, H.d + 0.3 - 0.6], beanieRibP), B([x0 + 0.2, hTop - 1.0, H.z0 + 0.2], [H.w - 0.4, 2.2, H.d - 1.4], beanieP), B([x0 + 1.4, hTop + 1.2, H.z0 + 1.2], [H.w - 2.8, 0.8, H.d - 3.6], beanieP)]));
  // a vintage mic in the left hand (stages 1–2)
  if (!g.armour) D.handL.push(...acc('acc-mic', [B([-fx - 0.5, A.fore[1] - 3.4, az + 1.6], [1.0, 3.0, 1.0], micBodyP, { pivot: [-fx, A.fore[1] - 1.0, az + 2.1], rot: [-30, 0, 0] }), B([-fx - 0.9, A.fore[1] - 5.0, az + 1.2], [1.8, 1.8, 1.8], micHeadP, { pivot: [-fx, A.fore[1] - 1.0, az + 2.1], rot: [-30, 0, 0] })]));
  // spiked wristbands (stage 1)
  if (stage === 1) for (const [bone, sx] of [['handR', 1], ['handL', -1]]) D[bone].push(...acc('acc-cuffs', [B([sx * fx - A.foreW / 2 - 0.3, A.fore[1] + 0.6, az - A.foreW / 2 - 0.3], [A.foreW + 0.6, 1.4, A.foreW + 0.6], cuffP), ...[-1, 1].map((k) => B([sx * fx - 0.25 + k * 0.8, A.fore[1] + 1.0, az + A.foreW / 2 + 0.3], [0.5, 0.6, 0.6], studP))]));
  // gold fangs (a grill)
  D.head.push(...acc('acc-grill', both(B([-sn.w / 2 + 0.1, sny0 - 1.35, zf + sn.l - 1.15], [0.9, 1.5, 0.9], goldFangP))));
  D.jaw.push(...acc('acc-grill', [B([-jw.w / 2 + 0.3, jawY0 + jw.h - 0.1, jawZ0 + jw.l - 0.6], [jw.w - 0.6, 0.5, 0.7], goldFangP)]));
  // a drum-machine sampler strapped on the back (the producer)
  const sbz = g.cape ? cape.z - 1.4 : Bl.z0, sY = g.cape ? Ch.y0 - 1.0 : Bl.y0 + 1.6, sW = Bl.w * 0.66, sH = (Ch.y1 - Bl.y0) * 0.44;
  D.body.push(...acc('acc-sampler', [B([-sW / 2, sY, sbz - 2.6], [sW, sH, 2.6], samplerP), ...both(B([-Ch.w / 2 - 0.2, Ch.y0, Ch.z0 - 0.3], [0.5, Ch.y1 - Ch.y0 - 0.2, Ch.d + 0.9], strapBlk))]));
  // a rhyme book on a cord at the hip (stages 2–3)
  if (stage >= 2) D.body.push(...acc('acc-book', [B([Bl.w / 2 - 0.2, Bl.y0 + 0.4, -1.6], [1.0, 3.4, 3.0], bookP, { pivot: [Bl.w / 2, Bl.y0 + 3.8, 0], rot: [0, 0, 8] }), B([Bl.w / 2 - 0.4, Bl.y0 + 3.6, -0.3], [0.5, 2.2, 0.4], strapBlk)]));
  // gold horn caps (King of the three-headed sky dragon)
  if (stage >= 2) D.head.push(...acc('acc-goldhorns', both(B([-HN.x - HN.w * 0.45, hTop - 0.6 + HN.l1 - 0.6, H.z0 + 2.0 + HN.w * 0.05], [HN.w * 0.9, HN.l2 + 0.3, HN.w * 0.9], goldP, { pivot: [-HN.x, hTop - 0.6, H.z0 + 2.8], rot: [-50, 0, 16] }), B([-HN.x - HN.w * 0.6, hTop - 0.8, H.z0 + 1.8], [HN.w * 1.2, 0.9, HN.w * 1.2], goldP, { pivot: [-HN.x, hTop - 0.6, H.z0 + 2.8], rot: [-26, 0, 14] }))));
  // the Doom's sceptre: an iron mic-stand staff with a gold mic on top, in the left fist
  if (g.armour) D.handL.push(...acc('acc-scepter', [B([-fx - 0.45, A.fore[1] - 9.0, az + 1.2], [0.9, 21.0, 0.9], scepterP), B([-fx - 1.0, A.fore[1] + 11.8, az + 0.65], [2.0, 2.4, 2.0], goldP), B([-fx - 0.8, A.fore[1] + 12.0, az + 0.85], [1.6, 2.6, 1.6], micHeadP), B([-fx - 1.2, A.fore[1] - 9.4, az + 0.45], [2.4, 0.8, 2.4], goldP)]));

  // ---------------------------------------------------------------- assemble
  const EYES = eyeRig({ ...EYE_OPT, at: [-g.eye.x, eyeY, zf + 0.04] });
  const handPivR = [fx, A.el, az];
  const bones = [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'footR', parent: 'root', pivot: [-F.x, 1, F.z0 + F.d / 2], cubes: cubes.footR }),
    ...twin({ name: 'legR', parent: 'root', pivot: legPiv, cubes: cubes.legR }),
    { name: 'body', parent: 'root', pivot: bodyPiv, cubes: [...cubes.body, ...D.body] },
    ...tailBones,
    ...capeBones,
    ...twin({ name: 'wingR', parent: 'body', pivot: W.root, rot: [0, -32, -22], cubes: wingCubes }),
    { name: 'armR', parent: 'body', pivot: A.sh, cubes: [...cubes.armR, ...D.armR] },
    { name: 'armL', parent: 'body', pivot: [-A.sh[0], A.sh[1], A.sh[2]], cubes: cubes.armR.map(L) },
    { name: 'handR', parent: 'armR', pivot: handPivR, cubes: [...cubes.handR, ...D.handR] },
    { name: 'handL', parent: 'armL', pivot: [-fx, A.el, az], cubes: [...cubes.handL, ...D.handL] },
    ...(BT ? [{ name: 'bottle', parent: 'handR', pivot: grip, cubes: bottleCubes }] : []),
    ...(g.neck ? [{ name: 'neck', parent: 'body', pivot: [0, g.neck.y0, 0], cubes: [] }] : []),
    { name: 'head', parent: g.neck ? 'neck' : 'body', pivot: headPiv, cubes: [...cubes.head, ...hood, ...D.head] },
    { name: 'jaw', parent: 'head', pivot: jawPiv, cubes: [...cubes.jaw, ...D.jaw] },
    ...EYES.bones,
    ...extraBones,
  ];
  const drip = {
    1: [[{ id: 'acc-beanie', name: 'Knit skully' }, { id: 'acc-chain', name: 'Gold mic chain' }], [{ id: 'acc-mic', name: 'Vintage mic' }, { id: 'acc-cuffs', name: 'Spiked wristbands' }], [{ id: 'acc-sampler', name: 'Drum-machine sampler' }, { id: 'acc-grill', name: 'Gold fangs' }]],
    2: [[{ id: 'acc-chain', name: 'Gold mic chain' }, { id: 'acc-book', name: 'Rhyme book' }], [{ id: 'acc-mic', name: 'Vintage mic' }, { id: 'acc-grill', name: 'Gold fangs' }], [{ id: 'acc-sampler', name: 'Drum-machine sampler' }, { id: 'acc-goldhorns', name: 'Gold horn caps' }]],
    3: [[{ id: 'acc-chain', name: 'Gold mic chain' }, { id: 'acc-book', name: 'Rhyme book' }], [{ id: 'acc-goldhorns', name: 'Gold horn caps' }, { id: 'acc-grill', name: 'Gold fangs' }], [{ id: 'acc-scepter', name: 'Iron mic sceptre' }, { id: 'acc-sampler', name: 'Drum-machine sampler' }]],
  }[stage];
  const def = {
    name, ppu: 3, scale: g.scale, outline: { color: '#120c16', px: g.ol }, bones, drip,
    attach: {
      head: { bone: 'head', at: [0, hTop + (g.hood ? 1.6 : 0.4), 0], size: H.w + 1 },
      face: { bone: 'head', at: [0, eyeY, zf + 0.6], size: H.w },
      neck: { bone: 'body', at: [0, Ch.y1 - 0.8, chestFront], size: Ch.w },
      back: { bone: 'body', at: [0, (Bl.y0 + Ch.y1) / 2, Bl.z0 - (g.cape ? 2.2 : 0.4)], size: Bl.w },
    },
  };
  // the ultra-drip form: the mask and the iron turn gold, scales and cloak black lacquer, the fire burns blue
  def.dripForm = {
    map: keepEyes(EYES, formMap(({ h, s, l }, glow, hex) => (glow ? undefined : s < 0.16 && l > 0.25 && l < 0.985 ? 'gold' : h >= 200 && h < 330 ? 'black' : h >= 90 && h < 200 && s > 0.2 ? fromHsl(150, 0.32, 0.03 + l * 0.2) : undefined))),
    fx: { 'doom-flame': 'bluefire', 'doom-breath': 'bluebreath', 'doom-dime': 'doom-golddime' },
  };
  // ---- solve the poses that need precision: the bottle into the mouth corner, the left hand to the cheek, the mic to the mouth
  const byName = Object.fromEntries(bones.map((b) => [b.name, b]));
  const S = { stage, g, LEG, LEGS: ['legR', 'legL'], MOUTH, TOP, EYE: [0, eyeY, zf + 1], bottle: !!BT, cape: !!cape, split: !!(cape && cape.split), armour: !!g.armour, lie: g.lie,
    CHEEK: [H.w / 2 + 0.2, sny0 + 1.2, zf - 1.0], handPt: [-fx, A.fore[1] - 0.6, az + 0.8], wingBig: stage === 3, hTop, zf, sny0 };
  const neckRot = g.neck ? [-6, 0, 0] : [0, 0, 0];
  if (BT) {
    const corner = [-jw.w / 2 + 0.2, sny0 - 0.2, jawZ0 + 1.6], uHead = new THREE.Vector3(0.62, -0.08, -0.78).normalize(), Lb = 1.0 * bs;
    const prefer = [-20, -14, -68, 0, -18, -64];
    const r = descend(prefer, (x) => {
      const pose = { neck: neckRot, head: [x[0], x[1], -4], armR: [x[2], x[3], x[4]], handR: [x[5], 0, 0] };
      const hd = fk(byName, pose, 'head', corner), u = uHead.clone().applyQuaternion(hd.q), target = hd.v.clone().addScaledVector(u, -Lb);
      return fk(byName, pose, 'handR', grip).v.distanceToSquared(target) + 0.0006 * ((x[0] + 22) ** 2 + (x[1] + 16) ** 2) + 0.0002 * x.slice(2).reduce((a, v, i) => a + (v - prefer[i + 2]) ** 2, 0);
    });
    const [hx, hy, a1, a2, a3, e1] = r.x, pose = { neck: neckRot, head: [hx, hy, -4], armR: [a1, a2, a3], handR: [e1, 0, 0] };
    const u = uHead.clone().applyQuaternion(fk(byName, pose, 'head').q), qh = fk(byName, pose, 'handR').q;
    const qb = qh.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), u)), eb = new THREE.Euler().setFromQuaternion(qb, 'XYZ');
    S.DR = { neck: neckRot, head: [hx, hy, -4], arm: [a1, a2, a3], hand: [e1, 0, 0], bot: [eb.x / D2R, eb.y / D2R, eb.z / D2R], err: Math.sqrt(r.err) };
  }
  const cheek = fk(byName, {}, 'head', S.CHEEK).v;
  S.FIX = reach(byName, 'armL', 'handL', S.handPt, [cheek.x + 1.2, cheek.y - 0.4, cheek.z + 0.6], [-90, 0, -30, -80]);
  const mouthPt = fk(byName, {}, 'head', [1.6, sny0 - 1.0, zf + sn.l - 0.5]).v;
  S.MIC = reach(byName, 'armL', 'handL', [S.handPt[0], A.fore[1] - 3.0, az + 1.8], [mouthPt.x + 0.6, mouthPt.y - 0.6, mouthPt.z + 1.6], [-80, 0, -20, -70]);
  def.anim = doomAnim(S, EYES);
  def.solve = S;
  return def;
}

// ---------------------------------------------------------------- animation
const armsP = (P, sh, el) => { P.rot('armR', sh[0], sh[1], sh[2]).rot('armL', sh[0], -sh[1], -sh[2]).rot('handR', el[0], el[1], el[2]).rot('handL', el[0], -el[1], -el[2]); };
const armR = (P, sh, el = [0, 0, 0]) => P.rot('armR', sh[0], sh[1], sh[2]).rot('handR', el[0], el[1], el[2]);
const armL = (P, sh, el = [0, 0, 0]) => P.rot('armL', sh[0], sh[1], sh[2]).rot('handL', el[0], el[1], el[2]);
function doomAnim(S, EYES) {
  const { LEG, LEGS, MOUTH, TOP } = S, CAPES = S.split ? ['cape1', 'cape2R', 'cape2L'] : S.cape ? ['cape1', 'cape2'] : [];
  const drink = (P, k) => { if (!S.DR) return; const D = S.DR; P.rot('head', D.head[0] * k, D.head[1] * k, D.head[2] * k).rot('armR', D.arm[0] * k, D.arm[1] * k, D.arm[2] * k).rot('handR', D.hand[0] * k, 0, 0).rot('bottle', D.bot[0] * k, D.bot[1] * k, D.bot[2] * k); if (S.g.neck) P.rot('neck', D.neck[0] * k); };
  const fix = (P, k) => armL(P, S.FIX.arm.map((v) => v * k), [S.FIX.hand[0] * k, 0, 0]);
  const mic = (P, k) => armL(P, S.MIC.arm.map((v) => v * k), [S.MIC.hand[0] * k, 0, 0]);
  const tailSway = (P, t, a = 1) => P.rot('tail1', 0, wave(t, 0.5) * 10 * a, 0).rot('tail2', 0, wave(t, 0.5, -0.9) * 14 * a, 0).rot('tail3', 0, wave(t, 0.5, -1.8) * 18 * a, 0);
  const wings = (P, k) => P.rot('wingR', 0, 0, -k).rot('wingL', 0, 0, k);
  const dime = (P, t0, n = 2, o = {}) => P.burst(t0, DFX.dime, 'head', MOUTH, { n, dir: [0, 0.7, 1], speed: 1, spread: 0.5, ...o });
  // lying flat on its back (faint / down)
  const onBack = (P, k) => {
    P.rot('root', -84 * k, 0, 0).pos('root', 0, S.lie * k, -1.4 * k);
    P.rot('legR', -26 * k, 0, 8 * k).rot('legL', -18 * k, 0, -8 * k).rot('footR', -20 * k).rot('footL', -12 * k);
    armsP(P, [0, 0, -60 * k], [-30 * k, 0, 0]);
    P.rot('tail1', 60 * k).rot('tail2', 20 * k).rot('wingR', 0, 20 * k, 30 * k).rot('wingL', 0, -20 * k, -30 * k).rot('head', 16 * k, 0, 18 * k).rot('jaw', 26 * k);
    for (const c of CAPES) P.rot(c, 70 * k);
  };
  const fidgets = S.bottle ? ['dance', 'dance', 'chug', 'chug', 'maskfix'] : ['dance', 'dance', 'flourish', 'flourish', 'maskfix'];
  const clips = {
    // a laid-back villain bounce: knees on the beat, a slow head nod, the bottle hand swaying, eyes casing the room
    idle: { len: 2.0, loop: true, f(P, t, c) {
      const b = beat(t, 0.5), dy = -0.5 * b.pulse, sd = b.n % 2 ? 1 : -1;
      P.pos('body', 0, dy, 0).rot('body', 0, sd * 3, sd * 1.5).sq('body', -0.02 * b.pulse); plant(P, LEGS, dy, LEG);
      P.rot('head', -2 + 6 * b.pulse, sd * 4, -sd * 2).rot('jaw', 3 + 2 * b.pulse);
      armR(P, [(S.bottle ? -16 : -8) + 3 * b.pulse, 0, -8 - 2 * b.pulse], [S.bottle ? -30 : -10, 0, 0]); armL(P, [3 * b.pulse, 0, 8], [-12 - 6 * b.pulse, 0, 0]);
      tailSway(P, t); wings(P, 4 * b.pulse);
      eyesAt(P, ...glance(t + c.loopN * 1.3, [[0, 0], [-0.3, 0], [0, 0], [0.32, 0.05]], 0.5));
      if (c.loopN % 3 === 2) { P.face('eyes', t > 0.6 && t < 1.7 ? 'smug' : undefined); P.rot('head', 0, 0, 6 * env(t, 0.6, 1.7)); }
    } },
    // a slouched, cocky stroll: shoulders rolling, the bottle swinging, the tail counter-swaying
    walk: { len: 0.8, loop: true, f(P, t) {
      const ph = (t / 0.8) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph), dy = Math.abs(c2) * 0.7 - 0.3, lr = Math.max(0, s), ll = Math.max(0, -s);
      P.pos('body', 0, dy, 0).rot('body', 4, s * 8, s * 4); plant(P, LEGS, dy, LEG);
      P.pos('footR', 0, lr * 2, s * 2.6).rot('footR', -22 * lr, 0, 0).pos('footL', 0, ll * 2, -s * 2.6).rot('footL', -22 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.4, s * 1.8).pos('legL', 0, ll * 1.4, -s * 1.8);
      P.rot('head', 3 - dy * 3, -s * 6, s * 2);
      armR(P, [s * 22, 0, -8], [S.bottle ? -26 : -14, 0, 0]); armL(P, [-s * 22, 0, 8], [-14, 0, 0]);
      P.rot('tail1', 0, -s * 14, 0).rot('tail2', 0, -s * 10, 0).rot('tail3', 0, s * 12, 0); wings(P, 4 * Math.abs(c2));
    } },
    // battle cry: hunch, then rear up and roar a column of green villain fire at the sky
    cry: { len: 2.0, next: 'idle', f(P, t) {
      P.lookW = 1 - env(t, 0.1, 1.8);
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.32, 0.45, E.out)), up = seg(t, 0.38, 0.55, E.back) * (1 - seg(t, 1.5, 1.85, E.inout));
      const dy = -1.4 * crouch + 0.6 * up; P.pos('body', 0, dy, 0).sq('body', -0.12 * crouch + 0.06 * up + wob(t, 1.85, 0.05, 3, 5)); plant(P, LEGS, dy, LEG);
      P.rot('body', 8 * crouch - 12 * up, 0, 0).rot('head', 14 * crouch - 34 * up + wave(t, 11) * 3 * up, 0, 0).rot('jaw', 8 * crouch + 44 * up);
      armsP(P, [-12 * up, 0, 18 * crouch - 60 * up], [-40 * up - 20 * crouch, 0, 0]); wings(P, -14 * crouch + 30 * up);
      P.face('eyes', crouch > 0.3 ? 'angry' : up > 0.3 ? 'shut' : undefined); P.blinkOK = false;
      if (t > 0.55 && t < 1.4) P.stream(DFX.breath, 'head', MOUTH, { rate: 90, dir: [0, 0.9, 0.45], speed: 0.9, spread: 0.3 });
      P.burst(0.5, 'ring', 'root', [0, 1, 0], { tint: GREEN_T }).burst(0.6, 'ring', 'head', MOUTH, { tint: GREEN_T, scale: 1.2 }).burst(0.8, 'ring', 'head', MOUTH, { tint: GREEN_T, scale: 1.4 });
      P.burst(1.45, 'smoke', 'head', MOUTH, { n: 5, dir: [0, 1, 0.3], speed: 0.6 }).burst(0.55, 'anger', 'head', [-5, S.hTop + 1, 3], {});
    } },
    // physical: a wound-up claw swipe with the left hand
    attack: { len: 0.95, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.28, E.out) * (1 - seg(t, 0.28, 0.36, E.in)), hit = seg(t, 0.3, 0.4, E.in3) * (1 - seg(t, 0.55, 0.92, E.inout));
      P.pos('root', 0, 0, -1.4 * bk + 4.4 * hit).rot('body', -6 * bk + 10 * hit, -24 * bk + 30 * hit, 0).rot('head', 0, 14 * bk - 18 * hit, 0).rot('jaw', 20 * hit);
      armL(P, [30 * bk - 100 * hit, 0, 40 * bk + 30 * hit], [-60 * bk - 10 * hit, 0, 0]); armR(P, [-20 * bk, 0, -20 * bk], [S.bottle ? -30 : -20, 0, 0]);
      P.sq('body', -0.05 * bk + wob(t, 0.42, 0.05, 4, 7)); P.blinkOK = false; P.face('eyes', bk > 0.2 || hit > 0.2 ? 'angry' : undefined);
      P.burst(0.4, 'spark', 'body', [4, MOUTH[1] - 2, MOUTH[2] + 6], { scale: 1.1 }).burst(0.4, 'star', 'body', [4, MOUTH[1] - 2, MOUTH[2] + 6], { n: 4 });
    } },
    // special: a swig (or an iron fist clenched), cheeks puff behind the mask, then a jet of green villain fire
    special: { len: 1.9, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const lift = S.bottle ? seg(t, 0.0, 0.22, E.out3) * (1 - seg(t, 0.4, 0.55, E.inout)) : 0, clench = S.bottle ? 0 : env(t, 0.05, 0.7, 0.15, 0.15);
      P.lookW = 1 - lift; drink(P, lift);
      if (!S.bottle) { armR(P, [-70 * clench, 0, -20 * clench], [-90 * clench, 0, 0]); P.stream(DFX.flame, 'handR', S.handPt.map((v, i) => (i === 0 ? -v : v)), { rate: 40 * clench, spread: 0.6, key: 'h' }); }
      const puff = seg(t, 0.5, 0.7, E.out) * (1 - seg(t, 0.72, 0.78)), blast = seg(t, 0.72, 0.8, E.out) * (1 - seg(t, 1.45, 1.75, E.inout));
      P.scl('head', 1 + 0.1 * puff, 1 + 0.04 * puff, 1 + 0.06 * puff).rot('head', 8 * puff - 6 * blast + wave(t, 15) * 2 * blast, 0, 0);
      P.rot('jaw', -4 * puff + 40 * blast).pos('root', 0, 0, -1.2 * blast).sq('body', 0.06 * puff - 0.05 * blast);
      armsP(P, [-10 * blast, 0, -24 * blast], [-20 * blast, 0, 0]); wings(P, 26 * blast); eyesScale(P, 1 + 0.2 * puff);
      P.face('eyes', t < 0.45 && S.bottle ? 'closed' : puff > 0.2 ? 'shock' : blast > 0.2 ? 'angry' : t > 1.6 ? 'smug' : undefined);
      if (t > 0.78 && t < 1.45) P.stream(DFX.breath, 'head', MOUTH, { rate: 140, dir: [0, 0.04, 1], spread: 0.16 });
      P.burst(1.55, 'smoke', 'head', MOUTH, { n: 6, dir: [0, 1, 0.4], speed: 0.7 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.2 * k).rot('body', -14 * k + wob(t, 0.2, 3, 3, 6), 0, wave(t, 14) * 3 * k).rot('head', -12 * k, 0, 0).rot('jaw', 28 * k);
      armsP(P, [0, 0, -40 * k], [-20 * k, 0, 0]); wings(P, 30 * k);
      P.face('eyes', t < 0.45 ? 'x' : 'angry'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, MOUTH[1] - 3, 6], {}).burst(0.04, 'sweat', 'head', [-5, S.hTop, 4], {});
    } },
    // dizzy wobble, the mask clanks, then it keels over backwards
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', 0, wave(t, 1.4) * 14 * dizzy, wave(t, 2) * 8 * dizzy).rot('head', 0, 0, wave(t, 2, 1) * 14 * dizzy).rot('jaw', 20 * dizzy);
      onBack(P, fall);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.9, 'star', 'head', TOP, { n: 5 }).burst(1.38, 'dust', 'root', [0, 0, -8], { n: 12, spread: 1 }).burst(1.4, 'spark', 'head', [0, S.hTop - 2, S.zf + 1], { scale: 0.6 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      onBack(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('footR', -16 * bump(t, 0.6, 0.8)).rot('tail3', 20 * bump(t, 1.4, 1.7));
      P.stream('smoke', 'head', MOUTH, { rate: 1.2 });
    } },
    // victory: a hop, then a toast with the bottle (or an iron fist raised) and a spill of rhyme dimes
    win: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.7 ? hop(t, 0.7, 5, { crouch: 1.4 }) : { y: wob(t, 0.7, -0.9, 3, 6), sq: wob(t, 0.7, -0.12, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq); if (h.y < 0) plant(P, LEGS, h.y, LEG);
      const pose = seg(t, 0.7, 0.9, E.back);
      armR(P, [-150 * pose, 0, -20 * pose], [-20 * pose, 0, 0]); armL(P, [-10 * pose, 0, 30 * pose], [-70 * pose, 0, 0]);
      if (S.bottle) P.rot('bottle', 0, 0, 30 * bump(t, 1.1, 1.5));
      P.rot('head', -12 * pose, 0, 8 * pose).rot('jaw', 24 * pose); wings(P, 24 * pose);
      P.face('eyes', pose > 0.5 ? (t > 1.5 ? 'smug' : 'happy') : 'angry');
      P.burst(0.7, 'dust', 'root', [0, 0, 0], { n: 8 }); dime(P, 0.95, 4, { dir: [0, 1, 0.6] }); dime(P, 1.25, 3, { dir: [0.3, 1, 0.6] });
      P.burst(1.0, 'sparkle', 'head', TOP, { n: 8 }).burst(1.2, 'note', 'head', TOP, {});
    } },
    // asleep on its feet, chin on its chest, bottle dangling, snoring smoke through the mask
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      P.pos('body', 0, -0.6 + br * 0.25, 0).rot('body', 6, 0, 0); plant(P, LEGS, -0.6 + br * 0.25, LEG);
      P.rot('head', 22 + br * 2, 0, 8).rot('jaw', 6 + Math.max(0, br) * 8); if (S.g.neck) P.rot('neck', 10);
      armR(P, [6, 0, -4], [S.bottle ? -10 : 0, 0, 0]); armL(P, [-30, 0, -30], [-70, 0, 0]);
      P.rot('tail1', 0, 20, 0).rot('tail2', 0, 24, 0).rot('tail3', 0, 26, 0); wings(P, -10 + br * 3);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [4, S.hTop + 1, 4], {}).burst(1.9, 'z', 'head', [4, S.hTop + 1, 4], {}).burst(1.6, 'smoke', 'head', MOUTH, { n: 2, dir: [0, 1, 0.5], speed: 0.3, scale: 0.5 });
    } },
    // the rhyme flow: head nods on every beat, the left hand chops out the bars (into the mic if it has one),
    // a side-shuffle, a spin with the cloak flaring, and a villain finish — dimes spilling out with the verse
    dance: { len: 2.8, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.35), live = 1 - seg(t, 2.05, 2.15), sd = b.n % 2 ? 1 : -1, dy = -0.8 * b.pulse * live;
      P.pos('body', 0, dy, 0).rot('body', 0, sd * 5 * live, sd * 2 * live); plant(P, LEGS, dy, LEG);
      P.rot('head', (8 * b.pulse - 2) * live, -sd * 6 * live, 0).rot('jaw', (6 + 14 * Math.abs(Math.sin(t * 14))) * live * (t < 1.4 ? 1 : 0.4));
      const flow = t < 1.4 ? 1 : 0, shuf = t >= 1.4 && t < 2.1 ? 1 : 0;
      mic(P, 0.75 * live * (flow + shuf * 0.6)); P.rot('handL', -24 * b.pulse * flow * live, 0, 10 * sd * flow * live);
      armR(P, [-30 * live, 0, -30 * live + sd * 8 * live], [S.bottle ? -40 * live : -50 * live, 0, 0]);
      P.pos('root', sd * 1.4 * shuf * b.pulse, 0, 0).rot('body', 0, 0, sd * 6 * shuf);
      tailSway(P, t, 1.4); wings(P, 10 * b.pulse * live);
      const spin = seg(t, 2.05, 2.45, E.inout), fin = seg(t, 2.4, 2.55, E.back);
      P.rot('root', 0, 360 * spin, 0);
      armR(P, [(S.bottle ? -150 : -40) * fin, 0, (S.bottle ? -20 : 40) * fin], [(S.bottle ? -10 : -100) * fin, 0, 0]); armL(P, [-40 * fin, 0, -40 * fin], [-100 * fin, 0, 0]);
      P.rot('head', -10 * fin, 0, 10 * fin).face('eyes', fin > 0.5 ? 'smug' : b.pulse > 0.7 ? 'shut' : undefined);
      for (let i = 0; i < 4; i++) dime(P, 0.05 + i * 0.35, 1, { dir: [0.4 * (i % 2 ? 1 : -1), 0.6, 1] });
      P.burst(0.05, 'note', 'head', [5, S.hTop + 1, 2], {}).burst(0.75, 'note', 'head', [-5, S.hTop + 1, 2], {}).burst(1.45, 'note', 'head', [5, S.hTop + 1, 2], {});
      dime(P, 2.45, 5, { dir: [0, 1, 0.4], spread: 0.9 }); P.burst(2.5, 'sparkle', 'head', TOP, { n: 7 });
    } },
    // signature (stages 1–2): ONE BEER — a long look at the bottle, three slow glugs under the mask, a pause…
    // then a burp of green fire and a smoke ring, a wipe of the mask with the back of a claw, and the bottle tossed and caught
    chug: { len: 3.6, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const look = env(t, 0.0, 0.5, 0.18, 0.12), up = seg(t, 0.4, 0.62, E.out3) * (1 - seg(t, 1.5, 1.7, E.inout));
      armR(P, [-40 * look, 0, -10 * look], [-50 * look, 0, 0]); P.rot('head', 12 * look, -12 * look, 0).rot('bottle', 0, 0, 22 * Math.sin(t * 18) * look);
      drink(P, up);
      for (const g0 of [0.75, 1.05, 1.35]) { const k = bump(t, g0, g0 + 0.2); P.scl('bottle', 1 - 0.12 * k, 1, 1 - 0.12 * k).sq('body', -0.04 * k).rot('head', -4 * k); }
      P.face('eyes', look > 0.3 ? 'smug' : up > 0.5 ? 'closed' : t > 1.62 && t < 1.88 ? 'wide' : t >= 1.88 && t < 2.3 ? 'shut' : t >= 2.3 && t < 2.95 ? 'smug' : t >= 3.2 ? 'happy' : undefined);
      const pause = bump(t, 1.62, 1.9); eyesScale(P, 1 + 0.25 * pause, 1 + 0.3 * pause); P.scl('head', 1 + 0.08 * pause, 1, 1 + 0.05 * pause);
      const burp = seg(t, 1.9, 1.96, E.out) * (1 - seg(t, 2.2, 2.45, E.inout));
      P.rot('jaw', 46 * burp).rot('head', -14 * burp).pos('root', 0, 0, -1.2 * burp).sq('body', 0.08 * burp + wob(t, 1.92, 0.08, 4, 6)); wings(P, 34 * burp);
      P.burst(1.92, 'ring', 'head', MOUTH, { tint: GREEN_T, scale: 1.4 }).burst(1.93, DFX.flame, 'head', MOUTH, { n: 10, dir: [0, 0.3, 1], speed: 1.4, spread: 0.4 }).burst(2.0, 'smoke', 'head', MOUTH, { n: 5, dir: [0, 0.8, 0.6], speed: 0.7 });
      const wipe = env(t, 2.3, 2.95, 0.15, 0.15), ws = Math.sin((t - 2.3) * 14) * wipe;
      fix(P, wipe); P.rot('handL', 0, 0, 12 * ws).rot('head', 0, -8 * ws, 0);
      // the toss: up, a flip, caught again
      const tossK = seg(t, 2.95, 3.4, E.lin), arc = Math.sin(tossK * Math.PI);
      P.pos('bottle', 0, 7 * arc, 0).rot('bottle', 360 * E.inout(tossK), 0, 0); armR(P, [-30 * env(t, 2.85, 3.55, 0.1, 0.12), 0, 0], [-40 * env(t, 2.85, 3.55, 0.1, 0.12), 0, 0]);
      if (t > 2.95 && t < 3.4) P.rot('head', -16 * arc).face('eyes', 'open');
      P.burst(3.4, 'sparkle', 'handR', [S.handPt[0] * -1, S.handPt[1], S.handPt[2]], { n: 4 });
    } },
    // fidget: tightens the mask strap with a click — the cheek vents hiss steam and the eyes narrow
    maskfix: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const k = env(t, 0.1, 1.6, 0.25, 0.3), click = bump(t, 0.75, 0.9), click2 = bump(t, 1.05, 1.2);
      fix(P, k); P.rot('handL', 0, 0, -20 * (click + click2));
      P.rot('head', 4 * k, 14 * k, -10 * k - 6 * (click + click2)).sq('body', -0.03 * (click + click2));
      P.face('eyes', t < 0.7 ? 'closed' : click + click2 > 0.3 ? 'shut' : t > 1.3 ? 'smug' : undefined);
      for (const c0 of [0.8, 1.1]) for (const sx of [-1, 1]) P.burst(c0, 'steam', 'head', [sx * (S.g.head.w / 2 + 0.4), S.sny0 + 1, S.zf + 0.4], { n: 4, dir: [sx, 0.4, 0.3], speed: 1.2, scale: 0.8 });
      P.burst(0.8, 'spark', 'head', [S.CHEEK[0], S.CHEEK[1], S.CHEEK[2]], { scale: 0.5 }).burst(1.4, 'sparkle', 'head', [0, S.EYE[1], S.EYE[2]], { n: 3 });
    } },
    // signature (the Doom): the cloak swirls round, it drops to one knee with a fist on the ground — a ring of
    // green fire bursts out — then rises slowly, head tilted, eyes narrowed. A villain's entrance.
    flourish: { len: 3.2, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const spin = seg(t, 0.1, 0.75, E.inout), land = seg(t, 0.72, 0.92, E.out) * (1 - seg(t, 2.2, 2.8, E.inout)), lift = bump(t, 0.1, 0.75);
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, 1.8 * lift, 0);
      armR(P, [-120 * lift, 0, -40 * lift], [0, 0, 0]); armL(P, [-60 * lift, 0, 50 * lift], [0, 0, 0]);
      // the landing: a deep crouch, the right fist planted on the ground, the left arm swept back, head up
      const dy = -LEG * 0.42 * land; P.pos('body', 0, dy, 0).rot('body', 14 * land, 0, 0); plant(P, LEGS, dy, LEG);
      P.rot('legR', -18 * land).rot('legL', 12 * land);
      armR(P, [-34 * land, 0, -12 * land], [-8 * land, 0, 0]); armL(P, [40 * land, 0, 36 * land], [-30 * land, 0, 0]);
      const rise = seg(t, 2.2, 2.8, E.inout), tilt = env(t, 1.2, 2.3, 0.3, 0.3);
      P.rot('head', -12 * land - 6 * rise * (1 - seg(t, 2.9, 3.2)), 0, 10 * tilt).rot('jaw', 6 * land + 20 * bump(t, 0.92, 1.3)); wings(P, 34 * land + 20 * bump(t, 0.9, 1.4));
      for (const c of CAPES) P.rot(c, -30 * lift + 10 * land);
      P.face('eyes', spin > 0.05 && spin < 0.95 ? 'smug' : t < 1.7 && land > 0.5 ? 'angry' : t < 2.3 ? 'smug' : undefined);
      P.burst(0.92, 'ring', 'root', [-3, 1, 5], { scale: 2.6, tint: GREEN_T }).burst(0.92, DFX.flame, 'root', [-3, 1, 5], { n: 30, spread: 1, speed: 1.8 }).burst(0.94, 'dust', 'root', [-3, 0, 5], { n: 14, spread: 1, speed: 2 }).burst(0.95, 'rock', 'root', [-3, 1, 6], { n: 6 });
      if (t > 0.95 && t < 2.2) { P.stream(DFX.flame, 'root', [-5, 0.5, 4], { rate: 14, spread: 0.8 }); P.stream(DFX.flame, 'root', [5, 0.5, 3], { rate: 14, spread: 0.8, key: 'b' }); }
      P.burst(2.5, 'sparkle', 'head', [0, S.EYE[1], S.EYE[2]], { n: 4 });
    } },
  };
  return {
    start: 'idle', seed: 13 + S.stage,
    breathe: { bone: 'body', amp: 0.018, per: 2.4 },
    blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.0], dur: 0.11 },
    look: { bone: 'head', yaw: 26, pitch: 12, speed: 5 },
    springs: [
      { bone: 'tail1', tip: [0, 0, -4], k: 170, d: 9, gain: 0.5, max: 10, axes: [1, 1, 0] },
      { bone: 'tail2', tip: [0, 0, -4], k: 140, d: 8, gain: 0.7, max: 14, axes: [1, 1, 0] },
      { bone: 'tail3', tip: [0, 0, -3], k: 120, d: 7, gain: 0.9, max: 18, axes: [1, 1, 0] },
      { bone: 'jaw', tip: [0, -1, 3], k: 220, d: 10, gain: 0.3, max: 6, axes: [1, 0, 0] },
      { bone: 'wingR', tip: [-4, -2, 0], k: 200, d: 10, gain: 0.4, max: 12, axes: [0, 1, 1] },
      { bone: 'wingL', tip: [4, -2, 0], k: 200, d: 10, gain: 0.4, max: 12, axes: [0, 1, 1] },
      ...CAPES.map((n, i) => ({ bone: n, tip: [0, -6, 0], k: i ? 90 : 120, d: i ? 5 : 6, gain: i ? 1.3 : 1.0, max: i ? 40 : 30, axes: [1, 0.3, 1] })),
    ],
    faces: { eyes: EYES.slot },
    fidget: { every: [3.5, 7], clips: fidgets },
    clips,
  };
}
