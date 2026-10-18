// Chilichick — the fire starter. A small, fat, furious chicken mascot straight off a
// spicy-noodle packet: flame comb, white chili headband with streaming tails, white
// glaring bloodshot eyes, tears pouring from the heat, a screaming hooked beak, and
// its own bottle of hot sauce clutched in one wing, which it keeps swigging.
import { PAINT } from '../model.js';
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { shade, feathers, fluff, gradient, layer, on, poly, ramp, dith, shift, h2 } from './kit.js';

const C = {
  red: '#e8442a', redHi: '#ff7040', redLo: '#a8241e', deep: '#6e1216',
  belly: '#ffae3a', bellyHi: '#ffd466', bellyLo: '#ec7e2a',
  beak: ['#fff4b0', '#ffd23e', '#f2a22a', '#c8701a'], beakLine: '#6a2e0e',
  brow: '#2a0c10', cloth: '#f6f2ea', clothLo: '#cfc8bc', band: '#d8202a',
  ink: '#1c0a0e', leg: '#f2a030',
};

// ---------------------------------------------------------------- painters
const body = feathers(C.red, { top: C.redHi, bottom: C.redLo, size: 8 });
const back = feathers(shift(C.red, -0.08), { top: C.red, bottom: C.redLo, size: 8 });
const chest = fluff(C.belly, { top: C.bellyHi, bottom: C.bellyLo });
const headP = layer(shade(C.red, { top: C.redHi, bottom: shift(C.red, -0.1), grain: 0.03 }),
  on(['north'], feathers(C.red, { top: C.redHi, bottom: C.red, size: 7, y0: 4 })),
  on(['east', 'west'], (p, w, h) => { for (let y = 3; y < h - 2; y += 4) for (let x = ((y >> 2) % 2) * 3; x < w; x += 6) { p.px(x, y, shift(C.red, -0.2)); p.px(x + 1, y + 1, shift(C.red, -0.2)); p.px(x + 2, y, shift(C.red, -0.2)); } }));
const jowl = fluff(shift(C.red, 0.12), { top: C.redHi, bottom: C.red });
const comb = gradient(['#ffd84a', '#ff8a24', '#ec3428', '#b81c20'], { edge: '#7a1016' });
const beakTop = (p, w, h, face) => {
  gradient(C.beak, { span: face === 'up' ? 0.4 : 1 })(p, w, h, face);
  if (face === 'up') { for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, '#fffad0'); p.px(Math.floor(w / 2) - 2, 1, C.beakLine); p.px(Math.floor(w / 2) + 2, 1, C.beakLine); }
  if (face === 'south' || face === 'east' || face === 'west') { for (let x = 0; x < w; x++) p.px(x, h - 1, C.beakLine); for (let x = 0; x < w; x++) if (x % 3 === 1) p.px(x, h - 2, shift(C.beak[2], -0.15)); }
};
const beakTip = gradient(['#ffcf3a', '#f09a26', '#c86a16', '#8a420e'], { edge: C.beakLine });
const beakLow = gradient(['#f6b23a', '#e08a22', '#b0601a'], { edge: C.beakLine });
const mouth = (p, w, h) => { p.rect(0, 0, w, h, '#4a0810'); p.rect(1, 0, w - 2, Math.max(1, h - 1), '#6a1018'); };
const tongue = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 || x === w - 1 ? '#b8304a' : y === 0 ? '#ff8aa0' : '#e8506a'); };
const wattle = shade('#d81e28', { top: '#ff4a40', bottom: '#8a1018' });
const brow = shade(C.brow, { top: '#5a1c1e', bottom: '#14060a', rim: true, grain: 0 });
const cloth = shade(C.cloth, { top: '#ffffff', bottom: C.clothLo, grain: 0.04 });
const bandFront = (p, w, h, face) => {
  cloth(p, w, h, face);
  if (face !== 'south') return;
  for (let x = 0; x < w; x++) { p.px(x, 0, C.band); p.px(x, h - 1, C.band); }
  // the chili emblem: a little red pepper with a green cap
  const cx = Math.floor(w / 2);
  poly(p, [[cx - 3, 1.5], [cx + 2, 1.5], [cx + 3.5, 3], [cx + 1, 4.6], [cx - 3.5, 3.4]], '#e8202a');
  p.px(cx - 2, 2, '#ff8a80'); p.px(cx - 1, 2, '#ff8a80'); p.rect(cx + 2, 1, 2, 2, '#2e8a3a'); p.px(cx + 4, 1, '#2e8a3a');
};
const bandSide = (p, w, h, face) => { cloth(p, w, h, face); if (face === 'up' || face === 'down') return; for (let x = 0; x < w; x++) { p.px(x, 0, C.band); p.px(x, h - 1, C.band); } };
const ribbon = (p, w, h) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const edge = y === 0 || y === h - 1, fold = (x % 7) === 3;
    p.px(x, y, edge ? C.band : fold ? C.clothLo : y === 1 ? '#ffffff' : C.cloth);
  }
  for (let y = 0; y < h; y++) if (y % 2 === 0) p.px(w - 1, y, 0);   // ragged end
};
const wing = layer(feathers(C.red, { top: C.redHi, bottom: C.redLo, size: 7 }), (p, w, h, face) => {
  if (face === 'up' || face === 'down') return;
  // primary feathers: darker, finger-like, orange tips
  for (let x = 0; x < w; x += 3) for (let y = Math.floor(h * 0.62); y < h; y++) { const tip = y >= h - 2; p.px(x, y, tip ? '#ff9a3a' : shift(C.redLo, -0.1 + (y / h) * 0.1)); p.px(x + 1, y, tip ? '#ffb85a' : C.redLo); if (x + 2 < w) p.px(x + 2, y, C.deep); }
});
// the front of the body: red feathers framing a fluffy golden belly
const bellyFront = () => (p, w, h, face) => {
  body(p, w, h, face);
  const cx = w / 2 - 0.5, cy = h * 0.7, rx = w * 0.34, ry = h * 0.62;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1.08) continue;
    if (d > 0.86 && (x + y) % 2) continue;
    const t = (y - (cy - ry)) / (2 * ry);
    p.px(x, y, d > 0.86 ? C.bellyLo : ramp([C.bellyHi, C.belly, C.bellyLo], t, x, y));
    if (y % 3 === 0 && (x + (y >> 1)) % 4 === 0 && d < 0.8) p.px(x, y, shift(C.belly, -0.2));
  }
};
// the face: a hot flush around the eyes and soot marks at the corners of the beak
const face = (p, w, h, f) => {
  headP(p, w, h, f);
  const cx = w / 2 - 0.5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = ((x - cx) / (w * 0.5)) ** 2 + ((y - h * 0.42) / (h * 0.34)) ** 2;
    if (d < 1 && !((x + y) % 2 && d > 0.8)) p.px(x, y, ramp(['#ff8a50', '#ff6a3c', C.red], Math.min(1, d * 1.1), x, y));
  }
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) p.px(Math.round(cx + sx * (7 + (k % 3))), h - 3 - (k >> 1), C.deep);
};
const wingTip = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x % 3) === 2 ? C.deep : y >= h - 2 ? '#ff9a3a' : C.redLo); };
const tailP = feathers(shift(C.red, -0.05), { top: C.redHi, bottom: C.deep, size: 5 });
const legP = (p, w, h, face) => { gradient(['#ffc050', '#f2a030', '#d07a20'])(p, w, h, face); if (face !== 'up' && face !== 'down') for (let y = 1; y < h; y += 2) p.px(0, y, '#b86418'); };
const foot = (p, w, h) => {
  const cx = 7.5, cy = 7.5, toe = (x1, y1, wd) => { const n = 24; for (let i = 0; i <= n; i++) { const t = i / n, x = cx + (x1 - cx) * t, y = cy + (y1 - cy) * t; for (let a = -wd; a <= wd; a++) for (let b = -wd; b <= wd; b++) p.px(Math.round(x + a * 0.6), Math.round(y + b * 0.6), t > 0.86 ? '#3a1a10' : (a + b < 0 ? '#ffc050' : '#e08a24')); } };
  toe(7.5, 19, 1.4); toe(1.5, 16.5, 1.2); toe(13.5, 16.5, 1.2); toe(7.5, 1, 1);
};
// bottle of hot sauce: red squeeze bottle with a cream label, chili and flames printed on it
const bottleBody = (p, w, h, face) => {
  shade('#d8282a', { top: '#ff5a50', bottom: '#8a1018', grain: 0.02 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  const y0 = Math.round(h * 0.3), y1 = Math.round(h * 0.75);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) p.px(x, y, y === y0 || y === y1 ? '#2e8a3a' : '#f8eed8');
  if (face === 'south' || face === 'west') {
    const cx = Math.floor(w / 2), cy = Math.round((y0 + y1) / 2);
    for (let i = -2; i <= 2; i++) { p.px(cx + i, cy + (i > 0 ? 1 : 0), '#e8202a'); p.px(cx + i, cy + 1 + (i > -1 ? 1 : 0), '#b01818'); }
    p.px(cx - 3, cy, '#2e8a3a'); p.px(cx + 3, cy + 2, '#ff8a2a');
    for (let x = 1; x < w - 1; x += 2) p.px(x, y0 + 1, '#ff6a2a');
  }
  for (let y = 1; y < h - 1; y++) p.px(1, y, y > y0 && y < y1 ? '#ffffff' : '#ff8a80');     // gloss
};
const capP = shade('#2e9a3e', { top: '#5ad06a', bottom: '#1a5a24' });
const nozzle = shade('#f4ead0', { top: '#ffffff', bottom: '#c8b890' });

// eyes: 12 × 9 texels; outer corner at x = 0, inner corner at x = 11. States are separate planes toggled by the 'eyes' slot.
const EYE = [[0.5, 1], [11.6, 4.4], [11.6, 6], [8.5, 8.6], [3, 8.6], [0.4, 6.4]];
function eyeBase(p) {
  poly(p, EYE.map(([x, y]) => [x - 0.6, y - 0.6]).concat([]), C.ink);
  poly(p, [[0.5, 0], [12, 3.6], [12, 6.8], [8.8, 9.4], [2.6, 9.4], [-0.2, 7]], C.ink);
  poly(p, [[1.4, 1.9], [10.8, 4.9], [10.8, 5.9], [8.2, 7.8], [3.2, 7.8], [1.2, 6]], (x, y) => (y < 3.2 + x * 0.3 ? '#cdd2e2' : '#ffffff'));
}
const veins = (p) => { p.px(2, 4, '#e8606a'); p.px(3, 5, '#e8606a'); p.px(2, 6, '#f08a90'); p.px(9, 7, '#f08a90'); };
const EYES = {
  angry: (p) => { eyeBase(p); veins(p); p.rect(7, 5, 2, 2, '#120608'); },
  blank: (p) => { eyeBase(p); veins(p); p.px(4, 4, '#e8606a'); p.px(8, 6, '#e8606a'); },
  wide: (p) => { poly(p, [[0, 0], [12, 1.5], [12, 7.5], [9, 9.4], [2.5, 9.4], [0, 7.5]], C.ink); poly(p, [[1, 1], [11, 2.5], [11, 7], [8.5, 8.4], [3, 8.4], [1, 6.8]], '#ffffff'); veins(p); p.px(6, 5, '#120608'); },
  closed: (p) => { for (let x = 0; x < 12; x++) { const y = Math.round(1.6 + x * 0.32); p.px(x, y, C.ink); p.px(x, y + 1, C.ink); } for (let x = 1; x < 9; x++) p.px(x, Math.round(7.5 - x * 0.18), C.ink); },
  x: (p) => { for (let i = 0; i < 8; i++) { p.px(2 + i, 1 + i, C.ink); p.px(3 + i, 1 + i, C.ink); p.px(9 - i, 1 + i, C.ink); p.px(10 - i, 1 + i, C.ink); } },
  swirl: (p) => { eyeBase(p); for (let a = 0; a < 14; a += 0.25) { const r = a * 0.27, x = Math.round(6 + Math.cos(a) * r), y = Math.round(5 + Math.sin(a) * r * 0.8); if (r < 4) p.px(x, y, C.ink); } },
};
// tears: a stream of water down the cheek; three frames make it flow
const tears = (f) => (p, w, h) => {
  for (let y = 0; y < h; y++) {
    const wd = y < 2 ? 1 : 1 + ((y + f * 2) % 6 < 3 ? 1 : 0) + (y > h - 4 ? 1 : 0), cx = Math.floor(w / 2) + (y > h * 0.6 ? Math.round(Math.sin(y * 0.8 + f) * 0.6) : 0);
    for (let x = cx - wd; x <= cx + wd - 1; x++) p.px(x, y, x === cx - wd ? '#3a9ad8' : (y + f * 2) % 5 === 0 ? '#ffffff' : '#8adcff');
  }
};
// comb flames: three flickering tongues of fire (glow planes)
const flames = (f, k = 1) => (p, w, h) => {
  const tongues = [[0.22, 0.62], [0.5, 1], [0.78, 0.7]];
  tongues.forEach(([cxF, hgt], i) => {
    const H = h * hgt * k * (0.82 + 0.18 * Math.sin(f * 2.1 + i * 1.7)), cx = cxF * w;
    for (let y = 0; y < h; y++) {
      const v = (h - 1 - y) / Math.max(1, H); if (v > 1) continue;
      const half = (v < 0.35 ? 1 : Math.sqrt(1 - (v - 0.35) / 0.65)) * w * 0.17, sway = Math.sin(v * 4 + f * 1.9 + i) * v * 2.4;
      for (let x = Math.floor(cx - half + sway); x <= Math.ceil(cx + half + sway); x++) {
        const d = Math.abs(x - cx - sway) / Math.max(0.5, half);
        p.px(x, y, d < 0.35 && v < 0.6 ? '#fff6c8' : d < 0.7 && v < 0.85 ? '#ffd040' : v > 0.75 ? '#ff6a1e' : '#ff9a2a');
      }
    }
  });
};

// ---------------------------------------------------------------- the model
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-4.7, 14.9, 5.86] : [0.5, 14.9, 5.86], [4.2, 3.2, 0], fn, { plane: 'z', mirror: side > 0, id: 'eye-' + k, hide: k !== 'angry' }));
export const def = {
  name: 'chilichick', ppu: 3, scale: 0.42, outline: { color: '#1c0a0e', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'footR', parent: 'root', pivot: [-2.6, 0, 0], cubes: [P([-5.1, 0.06, -2.5], [5, 0, 6.5], foot, { plane: 'y' })] },
    { name: 'footL', parent: 'root', pivot: [2.6, 0, 0], cubes: [P([0.1, 0.06, -2.5], [5, 0, 6.5], foot, { plane: 'y', mirror: true })] },
    { name: 'legR', parent: 'root', pivot: [-2.6, 4.6, 0], cubes: [P([-3.4, 0.3, -0.8], [1.6, 4.6, 1.6], legP)] },
    { name: 'legL', parent: 'root', pivot: [2.6, 4.6, 0], cubes: [P([1.8, 0.3, -0.8], [1.6, 4.6, 1.6], legP)] },
    { name: 'body', parent: 'root', pivot: [0, 7.6, 0], cubes: [
      P([-6.2, 4.2, -5.5], [12.4, 7.6, 11], body, { faces: { south: bellyFront(), north: back } }),
      P([-6.9, 5.2, -5], [13.8, 5.4, 10], body, { faces: { south: bellyFront(), north: back } }),
      P([-5.2, 3.6, -4.5], [10.4, 0.6, 9], shade(C.redLo)),
      P([-5, 5.8, -6.3], [10, 5.2, 0.8], back),
      P([-5.6, 11.8, -4.8], [11.2, 0.6, 9.6], body),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 9, -6], cubes: [
      P([-1.5, 9.2, -7.6], [3, 6.5, 1.6], tailP, { pivot: [0, 9, -6.4], rot: [-32, 0, 0] }),
      P([-3.6, 8.8, -7.2], [2.4, 5, 1.4], tailP, { pivot: [-2.4, 9, -6.4], rot: [-26, 0, 26] }),
      P([1.2, 8.8, -7.2], [2.4, 5, 1.4], tailP, { pivot: [2.4, 9, -6.4], rot: [-26, 0, -26] }),
    ] },
    { name: 'tailFire', parent: 'tail', pivot: [0, 14.6, -9.8], cubes: [0, 1, 2].flatMap((f) => [
      P([0, 13.8, -12.4], [0, 4.4, 5], flames(f, 0.8), { plane: 'x', glow: true, id: 'tf-' + 'abc'[f], hide: f > 0 }),
      P([-2.5, 13.8, -10], [5, 4.4, 0], flames(f + 1, 0.8), { plane: 'z', glow: true, id: 'tf-' + 'abc'[f], hide: f > 0 }),
    ]) },
    { name: 'wingR', parent: 'body', pivot: [-6.9, 11, 0.5], cubes: [P([-8.4, 4.8, -3.4], [1.5, 6.4, 7.4], wing), P([-8.5, 3.9, -2.5], [1.3, 1.4, 5.6], wingTip)] },
    { name: 'wingL', parent: 'body', pivot: [6.9, 11, 0.5], cubes: [P([6.9, 4.8, -3.4], [1.5, 6.4, 7.4], wing, { mirror: true }), P([7.2, 3.9, -2.5], [1.3, 1.4, 5.6], wingTip, { mirror: true })] },
    { name: 'bottle', parent: 'wingR', pivot: [-9.4, 7.6, 3.2], cubes: [
      P([-11, 4.2, 1.6], [3.2, 6, 3.2], bottleBody),
      P([-10.7, 10.2, 1.9], [2.6, 0.8, 2.6], shade('#c8242a')),
      P([-10.25, 11, 2.35], [1.7, 1.6, 1.7], capP),
      P([-9.8, 12.6, 2.8], [0.8, 1.3, 0.8], nozzle),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 11.6, 0.8], cubes: [
      P([-4.8, 11.2, -3.6], [9.6, 9.2, 9.4], headP, { faces: { south: face } }),
      P([-5.5, 12, -3], [11, 6, 8.4], jowl),
      P([-4.2, 20.4, -3], [8.4, 0.7, 8], headP),
      P([-4.2, 10.6, -2.8], [8.4, 0.6, 7.6], shade(C.red)),
      // headband ring across the brow, the knot behind
      P([-5.2, 18.3, 5.8], [10.4, 1.6, 0.4], bandFront),
      P([-5.2, 18.3, -4.0], [10.4, 1.6, 0.4], bandSide),
      P([-5.2, 18.3, -3.8], [0.4, 1.6, 9.8], bandSide),
      P([4.8, 18.3, -3.8], [0.4, 1.6, 9.8], bandSide),
      P([-1.2, 17.8, -4.8], [2.4, 2.6, 1], bandSide),
      // face: eyes (all states), tears (three frames)
      ...eyeStates(-1), ...eyeStates(1),
      ...[0, 1, 2].map((f) => P([-3.5, 9.8, 5.88], [1.6, 5.6, 0], tears(f), { plane: 'z', id: 'tear-' + 'abc'[f], hide: f > 0 })),
      ...[0, 1, 2].map((f) => P([1.9, 9.8, 5.88], [1.6, 5.6, 0], tears(f), { plane: 'z', mirror: true, id: 'tear-' + 'abc'[f], hide: f > 0 })),
      // the beak: a heavy hooked upper bill, tapering in three steps
      P([-2.4, 12.8, 5.8], [4.8, 2.5, 2.2], beakTop),
      P([-1.8, 12.9, 8.0], [3.6, 2.1, 1.6], beakTop),
      P([-1.2, 11.6, 9.0], [2.4, 2.8, 1.5], beakTip, { pivot: [0, 14, 9.4], rot: [20, 0, 0] }),
    ] },
    { name: 'browR', parent: 'head', pivot: [-2.8, 17.8, 6.2], rot: [0, 0, -24], cubes: [P([-5.2, 17.2, 5.8], [4.8, 1.4, 1.1], brow)] },
    { name: 'browL', parent: 'head', pivot: [2.8, 17.8, 6.2], rot: [0, 0, 24], cubes: [P([0.4, 17.2, 5.8], [4.8, 1.4, 1.1], brow, { mirror: true })] },
    { name: 'jaw', parent: 'head', pivot: [0, 12.8, 6.0], cubes: [
      P([-1.9, 11.5, 5.8], [3.8, 1.3, 3.2], beakLow),
      P([-2.1, 12.3, 5.4], [4.2, 0.5, 3.4], mouth, { outline: false }),
      P([-1.1, 12.2, 6.2], [2.2, 0.4, 2], tongue, { outline: false }),
      P([-0.9, 9.4, 7.0], [1.8, 2.3, 1.1], wattle),
    ] },
    { name: 'comb', parent: 'head', pivot: [0, 20.8, 0.8], cubes: [
      P([-1.3, 20.6, -0.6], [2.6, 5.6, 2.6], comb, { pivot: [0, 20.6, 0.7], rot: [-10, 0, 0] }),
      P([0.4, 20.4, -0.1], [2.2, 4.2, 2.2], comb, { pivot: [1.4, 20.5, 1], rot: [-6, 0, -30] }),
      P([-2.6, 20.4, -0.1], [2.2, 4.2, 2.2], comb, { pivot: [-1.4, 20.5, 1], rot: [-6, 0, 30] }),
      ...[0, 1, 2].flatMap((f) => [
        P([0, 23.6, -4.4], [0, 7, 9], flames(f), { plane: 'x', glow: true, id: 'fl-' + 'abc'[f], hide: f > 0 }),
        P([-4.4, 23.6, 0.6], [8.8, 7, 0], flames(f + 5), { plane: 'z', glow: true, id: 'fl-' + 'abc'[f], hide: f > 0 }),
      ]),
      ...[0, 1].flatMap((f) => [P([0, 23.4, -2.6], [0, 4, 5.5], flames(f + 3, 0.6), { plane: 'x', glow: true, id: 'fl-low' + f, hide: true }), P([-2.6, 23.4, 0.6], [5.2, 4, 0], flames(f + 8, 0.6), { plane: 'z', glow: true, id: 'fl-low' + f, hide: true })]),
    ] },
    { name: 'bandR1', parent: 'head', pivot: [-0.6, 19.2, -5.0], rot: [-34, -14, 0], cubes: [P([-0.6, 17.8, -9.2], [0, 1.8, 4.3], ribbon, { plane: 'x' })] },
    { name: 'bandR2', parent: 'bandR1', pivot: [-0.6, 18.8, -9.2], rot: [-16, 0, 0], cubes: [P([-0.6, 17.4, -13.6], [0, 1.6, 4.5], ribbon, { plane: 'x' })] },
    { name: 'bandL1', parent: 'head', pivot: [0.6, 18.6, -5.0], rot: [-42, 16, 0], cubes: [P([0.6, 17.1, -8.8], [0, 1.8, 3.9], ribbon, { plane: 'x' })] },
    { name: 'bandL2', parent: 'bandL1', pivot: [0.6, 18.2, -8.8], rot: [-14, 0, 0], cubes: [P([0.6, 16.8, -12.9], [0, 1.6, 4.2], ribbon, { plane: 'x' })] },
  ],
};

// ---------------------------------------------------------------- animation
const cyc = (t, fps, n) => Math.floor(t * fps) % n;
const ABC = ['a', 'b', 'c'];
// keep the feet planted while the body rises/sinks by dy units (legs stretch to reach)
function plant(P, dy, sq = 0) { for (const s of ['legR', 'legL']) { P.pos(s, 0, dy, 0); P.scl(s, 1, Math.max(0.35, (3.4 + dy) / 3.4), 1); } }
// a hot, furious face: flowing tears, flickering crest, trembling
function hot(P, t, k = 1) {
  P.face('tears', ABC[cyc(t, 9, 3)]).face('flame', ABC[cyc(t, 8, 3)]).face('tailfire', ABC[cyc(t, 7, 3)]);
  P.rot('head', wave(t, 9.3) * 1.1 * k, wave(t, 6.1, 1) * 1.2 * k, wave(t, 7.7, 2) * 1.1 * k);
}
const MOUTH = [0, 12.8, 9.4];
// raise the bottle to the beak: the wing swings forward and up, the bottle tips its nozzle into the bill (k: 0..1)
function drink(P, k) { P.rot('wingR', -131 * k, 0, 6 * k).pos('bottle', 3.7 * k, -9.15 * k, -2.6 * k).rot('bottle', 151 * k, 0, -115 * k); }
export const anim = {
  start: 'idle', seed: 7,
  breathe: { bone: 'body', amp: 0.02, per: 2.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.11 },
  look: { bone: 'head', yaw: 28, pitch: 14, speed: 5 },
  springs: [
    { bone: 'bandR1', tip: [0, 0, -4.3], k: 110, d: 9, gain: 0.8, max: 30, axes: [1, 0.4, 0.6] },
    { bone: 'bandR2', tip: [0, 0, -4.5], k: 90, d: 8, gain: 1.0, max: 35, axes: [1, 0.4, 0.6] },
    { bone: 'bandL1', tip: [0, 0, -3.9], k: 115, d: 9, gain: 0.8, max: 30, axes: [1, 0.4, 0.6] },
    { bone: 'bandL2', tip: [0, 0, -4.2], k: 95, d: 8, gain: 1.0, max: 35, axes: [1, 0.4, 0.6] },
    { bone: 'comb', tip: [0, 4, 0], k: 260, d: 12, gain: 0.7, max: 18 },
    { bone: 'tail', tip: [0, 5, -3], k: 170, d: 9, gain: 0.9, max: 22 },
    { bone: 'wingR', tip: [-1, -6, 0], k: 220, d: 11, gain: 0.35, max: 14, axes: [1, 0, 1] },
    { bone: 'wingL', tip: [1, -6, 0], k: 220, d: 11, gain: 0.35, max: 14, axes: [1, 0, 1] },
  ],
  faces: {
    eyes: { default: 'angry', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    tears: { default: 'a', states: { a: ['tear-a'], b: ['tear-b'], c: ['tear-c'], off: [] } },
    flame: { default: 'a', states: { a: ['fl-a'], b: ['fl-b'], c: ['fl-c'], low0: ['fl-low0'], low1: ['fl-low1'], off: [] } },
    tailfire: { default: 'a', states: { a: ['tf-a'], b: ['tf-b'], c: ['tf-c'], off: [] } },
  },
  fidget: { every: [5, 9], clips: ['sip', 'stomp'] },
  clips: {
    // bouncing on the spot, shaking with rage, beak gritted open, crying rivers
    idle: { len: 1.2, loop: true, f(P, t) {
      const b = bounce(t, 0.6, { squash: 0.08, stretch: 0.035 }), dy = b.u * 0.8 - 0.3;
      P.pos('body', 0, dy, 0).sq('body', b.sq); plant(P, dy);
      P.rot('body', 0, 0, wave(t, 1 / 1.2) * 2.2);
      hot(P, t); P.rot('head', 3 - b.u * 4, 0, 0);
      P.rot('jaw', 9 + wave(t, 11) * 2.5);
      P.rot('wingR', wave(t, 10, 1) * 1.5, 0, -3 - b.u * 5).rot('wingL', 0, 0, 3 + b.u * 7 - wave(t, 10.4) * 1.5);
      P.rot('browR', 0, 0, wave(t, 5) * 2).rot('browL', 0, 0, -wave(t, 5) * 2);
      P.stream('steam', 'head', [0, 21, 1], { rate: 1.6, dir: [0, 1, 0], spread: 0.5 });
      P.stream('tear', 'head', [-3.4, 10.4, 6.4], { rate: 2.5, dir: [-0.4, -0.2, 0.6] }).stream('tear', 'head', [3.4, 10.4, 6.4], { rate: 2.5, dir: [0.4, -0.2, 0.6], key: 'L' });
    } },
    // takes a swig of hot sauce… and regrets it, loudly
    sip: { len: 2.7, next: 'idle', f(P, t) {
      const up = seg(t, 0.1, 0.5, E.out3) - seg(t, 1.42, 1.66, E.inout);
      hot(P, t, 0.4 + seg(t, 1.5, 1.6) * 2); P.lookW = 1 - up;
      drink(P, up);
      const tilt = seg(t, 0.36, 0.6) - seg(t, 1.4, 1.6);
      P.rot('head', -24 * tilt, 10 * tilt, 0).rot('jaw', 14 * tilt);
      P.rot('body', -6 * tilt, 0, 0);
      for (const g of [0.82, 1.12]) { const k = bump(t, g, g + 0.18); P.sq('body', -0.05 * k).rot('head', 5 * k, 0, 0); }
      // the heat arrives
      const hit = seg(t, 1.55, 1.68, E.out) - seg(t, 2.25, 2.6);
      P.face('eyes', t > 1.5 && t < 1.66 ? 'wide' : t >= 1.66 && t < 2.3 ? 'blank' : undefined);
      P.sq('body', 0.12 * seg(t, 1.5, 1.6, E.out) * (1 - seg(t, 1.6, 1.75)) - 0.14 * bump(t, 1.62, 1.95) + wob(t, 2.2, 0.06, 3.5, 5));
      P.rot('head', -30 * hit + wave(t, 13) * 4 * hit, 0, wave(t, 11) * 5 * hit).rot('jaw', 42 * hit);
      P.rot('wingL', 0, 0, 70 * hit + wave(t, 14) * 8 * hit).rot('wingR', 0, 0, -20 * hit);
      P.scl('comb', 1 + 0.45 * hit);
      const dy = 1.2 * bump(t, 1.58, 1.9); P.pos('body', 0, dy, 0); plant(P, dy);
      P.burst(1.62, 'steam', 'head', [0, 22, 1], { n: 10, dir: [0, 1, 0], spread: 0.8, speed: 1.6 });
      P.burst(1.64, 'anger', 'head', [5.5, 23, 3], {});
      P.burst(1.66, 'tear', 'head', [-4, 15, 6.4], { n: 6, dir: [-1, 0.6, 0.4], speed: 1.8 }).burst(1.66, 'tear', 'head', [4, 15, 6.4], { n: 6, dir: [1, 0.6, 0.4], speed: 1.8 });
      if (t > 1.7 && t < 2.15) P.stream('breath', 'head', MOUTH, { rate: 110, dir: [0, 0.5, 1], speed: 0.6, spread: 0.3 });
    } },
    // impatient stomping
    stomp: { len: 1.4, next: 'idle', f(P, t) {
      hot(P, t, 1.4);
      for (const [t0, s] of [[0.15, 'R'], [0.6, 'L'], [1.0, 'R']]) {
        const k = bump(t, t0, t0 + 0.26), land = wob(t, t0 + 0.26, 1, 4, 9);
        P.pos('foot' + s, 0, 2.2 * k, 0).pos('leg' + s, 0, 1.6 * k, 0).sq('body', -0.06 * Math.abs(land) * (t > t0 + 0.26 ? 1 : 0));
        P.rot('body', 0, 0, (s === 'R' ? 6 : -6) * k);
        P.burst(t0 + 0.27, 'smoke', 'foot' + s, [s === 'R' ? -2.8 : 2.8, 0.5, 1], { n: 3, dir: [0, 0.3, 1], spread: 1, speed: 0.6, scale: 0.6 });
      }
      P.rot('jaw', 16 + wave(t, 12) * 4).rot('head', 6, 0, 0);
    } },
    // battle cry: crouch, then rear up screaming fire at the sky
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.32, E.inout) * (1 - seg(t, 0.32, 0.42, E.out)), up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.45, 1.8, E.inout));
      hot(P, t, 1 + up * 2.5);
      const dy = -1.6 * crouch + 1.2 * up; P.pos('body', 0, dy, 0).sq('body', -0.16 * crouch + 0.1 * up * (1 - seg(t, 0.5, 0.7)) + wob(t, 1.8, 0.05, 3, 5)); plant(P, dy);
      P.rot('head', 16 * crouch - 34 * up + wave(t, 13) * 3 * up, 0, wave(t, 9) * 4 * up).rot('jaw', 6 * crouch + 46 * up);
      P.rot('wingR', -20 * up, 0, 12 * crouch - 70 * up + wave(t, 6) * 16 * up).rot('wingL', -20 * up, 0, -12 * crouch + 70 * up - wave(t, 6.2) * 16 * up);
      P.rot('browR', 0, 0, -10 * crouch).rot('browL', 0, 0, 10 * crouch);
      P.scl('comb', 1 + 0.6 * up).rot('body', -8 * up, 0, 0);
      P.face('eyes', up > 0.4 ? 'blank' : undefined); P.blinkOK = up < 0.1;
      if (t > 0.5 && t < 1.35) P.stream('breath', 'head', MOUTH, { rate: 110, dir: [0, 0.5, 1], speed: 0.85, spread: 0.3 }).stream('ember', 'head', [0, 24, 0], { rate: 20, spread: 1 });
      P.burst(0.5, 'anger', 'head', [-6, 23, 3], {}).burst(0.62, 'anger', 'head', [6, 22, 2], {});
      P.burst(0.52, 'tear', 'head', [-4, 15, 6.4], { n: 8, dir: [-1, 0.9, 0.2], speed: 2.2 }).burst(0.52, 'tear', 'head', [4, 15, 6.4], { n: 8, dir: [1, 0.9, 0.2], speed: 2.2 });
    } },
    // special attack: swig, puff up, then a jet of flame
    breath: { len: 1.8, next: 'idle', f(P, t) {
      const lift = seg(t, 0.0, 0.24, E.out3) - seg(t, 0.46, 0.62, E.inout);
      hot(P, t, 1); P.lookW = 1 - lift;
      drink(P, lift);
      P.rot('head', -22 * seg(t, 0.15, 0.3) * (1 - seg(t, 0.45, 0.55)), 0, 0);
      const puff = seg(t, 0.5, 0.72, E.out) * (1 - seg(t, 0.74, 0.8)), blast = seg(t, 0.74, 0.82, E.out) * (1 - seg(t, 1.4, 1.7, E.inout));
      P.scl('head', 1 + 0.1 * puff, 1 + 0.06 * puff, 1 + 0.1 * puff).rot('jaw', -4 * puff + 40 * blast).rot('head', 10 * puff - 10 * blast + wave(t, 15) * 2 * blast, 0, 0);
      P.pos('body', 0, 0, -1.5 * blast + 0.6 * puff).sq('body', 0.08 * puff - 0.05 * blast);
      P.rot('wingR', 0, 0, -30 * blast).rot('wingL', 0, 0, 30 * blast + wave(t, 14) * 5 * blast);
      P.face('eyes', puff > 0.3 ? 'wide' : blast > 0.2 ? 'blank' : undefined);
      if (t > 0.78 && t < 1.42) P.stream('breath', 'head', MOUTH, { rate: 140, dir: [0, 0.05, 1], spread: 0.16 });
      if (t > 0.8 && t < 1.4) P.stream('smoke', 'head', [0, 23, -1], { rate: 6 });
    } },
    // physical attack: rear back, lunge, peck
    peck: { len: 0.95, next: 'idle', f(P, t) {
      hot(P, t, 0.8);
      const back = seg(t, 0, 0.26, E.out) * (1 - seg(t, 0.26, 0.36, E.in)), hit = seg(t, 0.28, 0.4, E.in3) * (1 - seg(t, 0.5, 0.9, E.inout));
      P.pos('root', 0, 0, -2 * back + 5.5 * hit).rot('body', -10 * back + 18 * hit, 0, 0).rot('head', -14 * back + 22 * hit, 0, 0).rot('jaw', 20 * back);
      P.sq('body', -0.08 * back + 0.08 * hit * (1 - seg(t, 0.4, 0.5)) + wob(t, 0.42, 0.06, 4, 7));
      P.rot('wingR', 0, 0, -40 * back + 10 * hit).rot('wingL', 0, 0, 40 * back - 10 * hit);
      P.burst(0.4, 'spark', 'head', [0, 14, 11], {}).burst(0.4, 'star', 'head', [0, 14, 11], { n: 4 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.5 * k).rot('body', -16 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.15 * k).rot('head', -12 * k, 0, 0).rot('jaw', 30 * k);
      P.rot('wingR', 0, 0, -50 * k).rot('wingL', 0, 0, 50 * k);
      P.face('eyes', t < 0.45 ? 'x' : undefined).face('tears', 'c');
      P.burst(0.02, 'feather', 'body', [0, 10, 0], { n: 6, speed: 1.4 }).burst(0.02, 'spark', 'body', [0, 10, 6], {});
    } },
    faint: { len: 2.1, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.9, 1.0)), fall = seg(t, 0.9, 1.35, E.bounce);
      P.rot('body', 0, wave(t, 1.6) * 20 * dizzy, wave(t, 2.2) * 12 * dizzy).rot('head', 0, 0, wave(t, 2.2, 1) * 14 * dizzy);
      P.rot('root', 0, 0, 86 * fall).pos('root', -6.6 * fall, 1.2 * fall, 0);
      P.rot('legR', -30 * fall, 0, -20 * fall).rot('legL', 20 * fall, 0, -35 * fall).rot('wingL', 0, 0, 80 * fall).rot('wingR', 0, 0, -20 * fall).rot('jaw', 30 * fall).rot('head', 0, 0, 10 * fall);
      P.face('eyes', 'swirl').face('flame', t < 1.0 ? ABC[cyc(t, 8, 3)] : 'off').face('tears', 'off').face('tailfire', t < 1.0 ? 'a' : 'off'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.35, 'smoke', 'head', [0, 22, 0], { n: 6, spread: 1 }).burst(1.0, 'star', 'head', [0, 23, 0], { n: 5 });
    } },
    down: { len: 2, loop: true, f(P, t) {
      P.rot('root', 0, 0, 86).pos('root', -6.6, 1.2, 0).rot('legR', -30 + wave(t, 0.5) * 6, 0, -20).rot('legL', 20, 0, -35).rot('wingL', 0, 0, 80 + wave(t, 0.5, 1) * 4).rot('wingR', 0, 0, -20).rot('jaw', 30).rot('head', 0, 0, 10);
      P.face('eyes', 'swirl').face('flame', 'off').face('tears', 'off').face('tailfire', 'off'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      P.stream('smoke', 'head', [0, 22, 0], { rate: 1.2 });
    } },
    // a waddling, stompy walk
    walk: { len: 0.56, loop: true, f(P, t) {
      const ph = (t / 0.56) * Math.PI * 2, s = Math.sin(ph), dy = Math.abs(Math.cos(ph)) * 0.8;
      hot(P, t, 0.6);
      P.pos('body', 0, dy, 0).rot('body', 4, 0, s * 9).sq('body', -0.04 * (1 - Math.abs(Math.cos(ph))));
      P.pos('footR', 0, Math.max(0, s) * 1.6, s * 1.8).pos('footL', 0, Math.max(0, -s) * 1.6, -s * 1.8);
      P.pos('legR', 0, Math.max(0, s) * 1.2 + dy * 0.5, s * 1.2).pos('legL', 0, Math.max(0, -s) * 1.2 + dy * 0.5, -s * 1.2);
      P.rot('head', 6 - dy * 4, s * 4, -s * 4).rot('wingR', 0, 0, -10 - Math.abs(s) * 8).rot('wingL', 0, 0, 10 + Math.abs(s) * 8).rot('jaw', 10);
    } },
    // victory: a furious spinning hop that ends in a ring of fire
    win: { len: 1.7, next: 'idle', f(P, t) {
      const h = t < 0.9 ? hop(t, 0.9, 7, { crouch: 1.6 }) : { y: wob(t, 0.9, -1.2, 3, 6), sq: wob(t, 0.9, -0.16, 3, 6) };
      hot(P, t, 1.5);
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq).rot('root', 0, 360 * seg(t, 0.2, 0.62, E.inout), 0);
      if (h.y < 0) plant(P, h.y);
      const arms = seg(t, 0.18, 0.3) * (1 - seg(t, 1.2, 1.6));
      P.rot('wingR', 0, 0, -80 * arms + wave(t, 10) * 10 * arms).rot('wingL', 0, 0, 80 * arms - wave(t, 10) * 10 * arms).rot('jaw', 40 * arms).rot('head', -18 * arms, 0, 0).scl('comb', 1 + 0.5 * arms);
      P.face('eyes', arms > 0.5 ? 'blank' : undefined);
      P.burst(0.9, 'ring', 'root', [0, 1, 0], {}).burst(0.9, 'fire', 'root', [0, 1, 0], { n: 24, spread: 1, speed: 1.4 }).burst(0.4, 'anger', 'head', [5, 24, 2], {});
    } },
    // asleep (title screen): sunk down, crest burning low, Zzz
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      P.pos('body', 0, -1.8 + br * 0.3, 0).sq('body', -0.06 + br * 0.04); plant(P, -1.8 + br * 0.3);
      P.rot('head', 22 + br * 3, 0, 6).rot('jaw', 4 + Math.max(0, br) * 6).rot('wingR', 0, 0, 6).rot('wingL', 0, 0, -6);
      P.face('eyes', 'closed').face('tears', 'off').face('flame', 'low' + cyc(t, 4, 2)).face('tailfire', 'off'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [3, 22, 4], {}).burst(1.5, 'z', 'head', [3, 22, 4], {});
    } },
  },
};
def.anim = anim;
