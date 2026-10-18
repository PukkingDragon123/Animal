// Chilichick — the goofy fire starter (a Red Hot Chili Peppers homage). A round
// little chick whose head is bigger than its body: a cream heart-shaped face with
// round goofy eyes, a wide open grin with its tongue lolling out from the heat, two
// jiggly wattles, a floppy chili pepper for a comb whose tip burns like a fuse, a
// shaggy fringe of crest feathers (the frontman's hair), stubby wings, giant clown
// feet and downy legs striped like tube socks. It hugs a squeeze bottle of hot sauce
// half its size, squirts it into its beak, regrets it, and hiccups little fireballs.
import * as THREE from '../../../vendor/three.module.js';
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { shade, feathers, fluff, gradient, layer, on, poly, ramp, shift } from './kit.js';
import { eyeRig } from './eyes.js';

const C = {
  red: '#ee4a2a', redHi: '#ff7c46', redLo: '#b22c1e', deep: '#6e1418',
  mask: '#ffe2a0', maskHi: '#fff4d0', maskLo: '#f4b860', maskLine: '#d8823a',
  belly: '#ffc848', bellyHi: '#ffe690', bellyLo: '#f0962e',
  beak: ['#fff2a0', '#ffd03a', '#f4a02a', '#c86a1a'], beakLine: '#6a2e0e',
  chili: '#d8142a', chiliHi: '#ff6a5a', chiliLo: '#8a0a1c', gloss: '#ffd0c8',
  calyx: '#3aa84a', calyxHi: '#7ad86a', calyxLo: '#1e6a2a',
  sock: '#f8f4ec', sockLo: '#d6cfc2', stripeA: '#e0242c', stripeB: '#ffc83a',
  foot: '#ffa030', footHi: '#ffc868', footLo: '#d0701c', nail: '#5a2a10',
  ink: '#1e0c12', tongue: '#ff7090', tongueLo: '#d04060', tongueHi: '#ffb0c0', mouth: '#5a0c16',
  blush: '#ff6a5a', blushHi: '#ffa08a', hair: '#c8241e', hairHi: '#ff6a3a', hairLo: '#7a1414',
};

// ---------------------------------------------------------------- painters
const body = feathers(C.red, { top: C.redHi, bottom: C.redLo, size: 7 });
const back = layer(feathers(shift(C.red, -0.06), { top: C.red, bottom: C.redLo, size: 7 }), (p, w, h, face) => {
  if (face !== 'north') return;
  // darker chevrons down the back
  const cx = Math.floor(w / 2);
  for (let k = 0; k < 3; k++) { const y0 = 2 + k * Math.round(h / 3.2); for (let i = 0; i < Math.round(w * 0.28); i++) { const yy = y0 + Math.round(i * 0.55); p.px(cx - i, yy, C.deep).px(cx + i, yy, C.deep).px(cx - i, yy + 1, shift(C.redLo, -0.1)).px(cx + i, yy + 1, shift(C.redLo, -0.1)); } }
});
const headP = feathers(C.red, { top: C.redHi, bottom: shift(C.red, -0.1), size: 7 });
// fill a region given by inside(x, y), with a 1-texel edge in another colour
function region(p, w, h, inside, fill, edge) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y)) continue;
    const e = edge && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1));
    p.px(x, y, e ? edge : fill(x, y));
  }
}
// the face: a cream heart-shaped mask around the eyes and beak
const HEAD = { x0: -7, top: 24, w: 14, h: 11.6 };
const faceP = (p, w, h, f) => {
  headP(p, w, h, f);
  const X = (mx) => ((mx - HEAD.x0) / HEAD.w) * w, Y = (my) => ((HEAD.top - my) / HEAD.h) * h, S = w / HEAD.w;
  const lobes = [[X(-2.9), Y(19.3)], [X(2.9), Y(19.3)]], r = 3.3 * S, low = [X(0), Y(15.8)], lrx = 5.3 * S, lry = 3.7 * S;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (lobes.some(([cx, cy]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 < r * r) || ((x + 0.5 - low[0]) / lrx) ** 2 + ((y + 0.5 - low[1]) / lry) ** 2 < 1);
  region(p, w, h, inside, (x, y) => ramp([C.maskHi, C.mask, C.maskLo], y / h, x, y), C.maskLine);
};
// the shaggy crest fringe: layered feather locks falling over the brow
const fringeP = (p, w, h, face) => {
  if (face === 'up' || face === 'down') { shade(C.hair, { top: C.hairHi, bottom: C.hairLo, grain: 0 })(p, w, h, face); return; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, ramp([C.hairHi, C.hair, C.hairLo], y / Math.max(1, h - 1), x, y));
  // lock tips: a ragged bottom edge and lit strands
  for (let x = 0; x < w; x++) { const cut = (x * 7) % 5 < 2 ? 1 : (x * 3) % 4 === 0 ? 2 : 0; for (let k = 0; k < cut; k++) p.px(x, h - 1 - k, 0); if (x % 3 === 1) for (let y = 0; y < h - 3; y++) if ((y + x) % 4 === 0) p.px(x, y, C.hairHi); }
};
const lockP = gradient([C.hairHi, C.hair, C.hairLo], { edge: C.hairLo });
const beakTop = (p, w, h, face) => {
  if (face === 'down') { p.rect(0, 0, w, h, C.mouth); return; }      // the roof of the mouth
  gradient(C.beak, { span: face === 'up' ? 0.4 : 1 })(p, w, h, face);
  if (face === 'up') { const cx = Math.floor(w / 2); for (let y = 0; y < h; y++) p.px(cx, y, '#fffad0'); p.px(cx - 3, Math.floor(h * 0.55), C.beakLine).px(cx + 3, Math.floor(h * 0.55), C.beakLine); }
  if (face === 'south' || face === 'east' || face === 'west') for (let x = 0; x < w; x++) p.px(x, h - 1, C.beakLine);
};
const beakTip = gradient(['#ffcf3a', '#f09a26', '#c86a16', '#8a420e'], { edge: C.beakLine });
const beakLow = (p, w, h, face) => {
  if (face === 'up') { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 2, '#7a1622'); return; }   // the floor of the mouth
  gradient(['#f6b23a', '#e08a22', '#b0601a'], { edge: C.beakLine })(p, w, h, face);
};
const tongueP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? (x === Math.floor(w / 2) ? C.tongueLo : y < 2 ? C.tongueHi : C.tongue) : face === 'down' ? C.tongueLo : ramp([C.tongueHi, C.tongue, C.tongueLo], y / Math.max(1, h - 1), x, y)); };
const wattleP = shade('#e0202a', { top: '#ff5a4a', bottom: '#8a1018', grain: 0 });
const chiliP = (p, w, h, face) => {
  shade(C.chili, { top: C.chiliHi, bottom: C.chiliLo, grain: 0.02 })(p, w, h, face);
  if (face === 'south' || face === 'east') for (let y = 1; y < h - 1; y++) { p.px(1, y, C.gloss); if (y % 3 === 0) p.px(2, y, C.chiliHi); }
  if (face === 'west' || face === 'north') for (let y = 0; y < h; y++) p.px(w - 1, y, C.chiliLo);
};
const chiliTip = (p, w, h, face) => { chiliP(p, w, h, face); if (face !== 'down') for (let x = 0; x < w; x++) { p.px(x, 0, '#2a0a0a'); if (h > 3) p.px(x, 1, '#5a1010'); } };
const calyxP = (p, w, h, face) => { shade(C.calyx, { top: C.calyxHi, bottom: C.calyxLo, grain: 0.03 })(p, w, h, face); if (face === 'up') for (let i = 0; i < w; i += 3) p.px(i, Math.floor(h / 2), C.calyxLo); };
const calyxStar = (p, w, h) => {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2, pts = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? R * 0.42 : R; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  poly(p, pts, (x, y) => (Math.abs(x - cx) < 1 || Math.abs(y - cy) < 1 ? C.calyxLo : (x + y) % 5 === 0 ? C.calyxHi : C.calyx));
};
const sockP = (p, w, h, face) => {
  if (face === 'up' || face === 'down') { p.rect(0, 0, w, h, face === 'up' ? C.sock : C.sockLo); return; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const band = y === 3 || y === 4 ? C.stripeA : y === 6 ? C.stripeB : y === 8 ? C.stripeA : null;
    let c = band || ramp([C.sock, C.sock, C.sockLo], y / (h - 1), x, y);
    if (!band && x % 2 === 0) c = shift(c, -0.05);                // ribbed knit
    p.px(x, y, c);
  }
};
const cuffP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? C.sock : x % 2 ? C.sockLo : C.sock); };
const footP = (p, w, h, face) => { gradient([C.footHi, C.foot, C.footLo])(p, w, h, face); if (face === 'up') for (let y = 1; y < h - 1; y += 2) for (let x = 1; x < w - 1; x++) if ((x + y) % 3 === 0) p.px(x, y, C.footLo); };
const toeP = (p, w, h, face) => {
  gradient([C.footHi, C.foot, C.footLo])(p, w, h, face);
  if (face === 'up') for (let y = 1; y < h; y += 2) for (let x = 0; x < w; x++) p.px(x, y, shift(C.foot, -0.12));          // scales
  if (face === 'south') for (let x = 0; x < w; x++) for (let y = Math.floor(h * 0.4); y < h; y++) p.px(x, y, y === h - 1 ? '#3a1a0a' : x === 0 ? '#8a5a3a' : C.nail);
};
const wingP = layer(feathers(C.red, { top: C.redHi, bottom: C.redLo, size: 6 }), (p, w, h, face) => {
  if (face === 'up' || face === 'down') return;
  for (let x = 0; x < w; x += 3) for (let y = Math.floor(h * 0.66); y < h; y++) { p.px(x, y, y >= h - 2 ? '#ff9a3a' : shift(C.redLo, -0.05)); if (x + 1 < w) p.px(x + 1, y, y >= h - 2 ? '#ffb85a' : C.redLo); if (x + 2 < w) p.px(x + 2, y, C.deep); }
});
const fingerP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y >= h - 2 ? '#ff9a3a' : x % 3 === 2 ? C.deep : C.redLo); };
const tailP = feathers(shift(C.red, -0.05), { top: C.redHi, bottom: C.deep, size: 5 });
const tuftP = gradient([C.redHi, C.red, C.redLo]);
// the hot-sauce squeeze bottle: red with a cream label (a chili and flames), green cap
const bottleBody = (p, w, h, face) => {
  shade('#d8282a', { top: '#ff5a50', bottom: '#8a1018', grain: 0.02 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  const y0 = Math.round(h * 0.28), y1 = Math.round(h * 0.76);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) p.px(x, y, y === y0 || y === y1 ? '#2e8a3a' : '#f8eed8');
  if (face === 'south' || face === 'west') {
    const cx = Math.floor(w / 2), cy = Math.round((y0 + y1) / 2);
    for (let i = -2; i <= 2; i++) { p.px(cx + i, cy + (i > 0 ? 1 : 0), '#e8202a'); p.px(cx + i, cy + 1 + (i > -1 ? 1 : 0), '#b01818'); }
    p.px(cx - 3, cy, '#2e8a3a').px(cx + 3, cy + 2, '#ff8a2a');
    for (let x = 1; x < w - 1; x += 2) p.px(x, y0 + 1, '#ff6a2a');
    for (let x = 1; x < w - 1; x++) if ((x * 5) % 3 === 0) p.px(x, y1 - 1, '#e8202a');          // "XXX HOT"
  }
  for (let y = 1; y < h - 1; y++) p.px(1, y, y > y0 && y < y1 ? '#ffffff' : '#ff8a80');         // gloss
};
const capP = shade('#2e9a3e', { top: '#5ad06a', bottom: '#1a5a24' });
const nozzle = shade('#f4ead0', { top: '#ffffff', bottom: '#c8b890' });
// fire: three flickering tongues (glow planes)
const flames = (f, k = 1) => (p, w, h) => {
  [[0.24, 0.62], [0.5, 1], [0.76, 0.7]].forEach(([cxF, hgt], i) => {
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
// a snot bubble for the sleep loop
const bubbleP = (p, w, h) => {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
  region(p, w, h, (x, y) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 < r * r, (x, y) => ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > (r - 1.5) ** 2 ? '#8ad0f0' : '#d8f6ff'), '#4a9ac8');
  p.px(Math.round(cx - r * 0.45), Math.round(cy - r * 0.5), '#ffffff').px(Math.round(cx - r * 0.25), Math.round(cy - r * 0.6), '#ffffff');
};

// drip accessories: a gold chain with a chili pendant, and a flame-painted slap bass on its back
const goldP = (p, w, h, face) => { gradient(['#fff4b0', '#ffd23a', '#d89a1e', '#8a5a10'])(p, w, h, face); if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) if (x % 2) p.px(x, Math.floor(h / 2), '#8a5a10'); };
const strapP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? '#6a4a30' : '#3a2418'); if (face === 'south') for (let x = 1; x < w; x += 3) p.px(x, Math.floor(h / 2), '#e8e8f0'); };
const bassBody = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = (h - 1 - y) / h, flame = v < 0.75 * (0.65 + 0.35 * Math.sin(x * 1.3 + (x % 3)));
    p.px(x, y, !flame ? '#1c1418' : v < 0.25 ? '#ffd040' : v < 0.5 ? '#ff8a2a' : '#e8302a');
  }
  if (face === 'south' || face === 'north') {
    const cx = Math.floor(w / 2);
    p.rect(cx - 3, Math.floor(h * 0.3), 7, 2, '#141014').rect(cx - 3, Math.floor(h * 0.55), 7, 2, '#141014');          // pickups
    for (const dx of [-2, 0, 2]) { p.px(cx + dx, Math.floor(h * 0.3), '#c8c8d0'); p.px(cx + dx, Math.floor(h * 0.55), '#c8c8d0'); }
    p.rect(cx - 3, Math.floor(h * 0.8), 7, 1, '#d8d8e0');                                                                  // bridge
    for (const dx of [-2, -1, 1, 2]) for (let y = 0; y < Math.floor(h * 0.8); y++) if (y % 4) p.px(cx + dx, y, '#e8e4dc');  // strings
  }
};
const fretP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' || face === 'north' ? (y % 3 === 0 ? '#d8d0c0' : '#7a4a22') : '#5a3418'); if (face === 'south' || face === 'north') for (let y = 4; y < h; y += 6) p.px(Math.floor(w / 2), y + 1, '#f4f0e8'); };
const headstockP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, '#1c1418'); if (face === 'south' || face === 'north') for (let y = 1; y < h; y += 2) { p.px(0, y, '#d8d8e0'); p.px(w - 1, y, '#d8d8e0'); } };

const leather = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#4a4452' : ramp(['#3e3846', '#26222a', '#18161c'], y / Math.max(1, h - 1), x, y));
  if (face !== 'up' && face !== 'down') { for (let x = 1; x < w; x += 3) p.px(x, 1, '#e8e8f0'); if (h > 6) for (let y = 3; y < h - 1; y += 3) p.px(w - 2, y, '#c8c8d4'); }
};
const jacketBack = (p, w, h, face) => {
  leather(p, w, h, face);
  if (face !== 'north') return;
  const cx = w / 2, cy = h * 0.45;                       // a flame patch with a chili
  region(p, w, h, (x, y) => ((x + 0.5 - cx) / (w * 0.26)) ** 2 + ((y + 0.5 - cy) / (h * 0.3)) ** 2 < 1, (x, y) => ((y + 0.5) < cy - h * 0.05 ? '#ff8a2a' : '#e8302a'), '#ffd040');
  for (let i = -2; i <= 2; i++) p.px(Math.round(cx + i), Math.round(cy + (i > 0 ? 1 : 0)), '#7a0a14');
  p.px(Math.round(cx - 3), Math.round(cy - 1), '#2e8a3a');
};
const lensP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const edge = y === 0 || y === h - 1 || x === 0 || x === w - 1; p.px(x, y, face !== 'south' || edge ? '#18161c' : ramp(['#ff8a3a', '#e8302a', '#8a1030', '#3a0a20'], y / (h - 1), x, y)); } if (face === 'south') { p.px(2, 2, '#ffffff').px(3, 2, '#ffd0c0').px(2, 3, '#ffd0c0').px(w - 4, h - 3, '#ffe0b0'); } };
const beadsP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = x % 4; p.px(x, y, k === 0 ? '#2e8a3a' : k === 3 ? '#8a0a1c' : y === 0 ? '#ff6a5a' : '#d8142a'); } };

// ---------------------------------------------------------------- the model
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
// the left-side twin of a right-side cube
const L = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
const FOOT = [
  P([-5.0, 0, -1.4], [4.2, 1.4, 4.2], footP),
  P([-5.5, 0, 2.2], [1.5, 1.2, 2.8], toeP, { pivot: [-4.75, 0.6, 2.4], rot: [0, -18, 0] }),
  P([-3.75, 0, 2.5], [1.7, 1.3, 3.2], toeP),
  P([-2.1, 0, 2.2], [1.5, 1.2, 2.8], toeP, { pivot: [-1.35, 0.6, 2.4], rot: [0, 16, 0] }),
  P([-3.5, 0, -2.6], [1.2, 0.9, 1.4], toeP),
];
const LEG = [P([-4.1, 0.9, -0.8], [2.4, 3.8, 2.4], sockP), P([-4.3, 3.4, -1.0], [2.8, 0.8, 2.8], cuffP)];
const WING_ACC = [
  P([-8.1, 9.4, -2.7], [2.2, 2.8, 6.4], leather, { id: 'acc-jacket', hide: true }),
  P([-8.05, 7.0, -2.65], [2.1, 0.9, 6.3], beadsP, { id: 'acc-bands', hide: true }),
];
const WING = [
  P([-7.8, 6.6, -2.4], [1.6, 5.4, 5.8], wingP),
  P([-7.7, 5.4, -1.8], [1.4, 1.4, 1.5], fingerP), P([-7.7, 5.1, -0.2], [1.4, 1.6, 1.5], fingerP), P([-7.7, 5.4, 1.4], [1.4, 1.4, 1.5], fingerP),
];
const ABC = ['a', 'b', 'c'];
const JACKET = [
  P([-6.0, 5.0, -6.3], [12.0, 8.2, 0.5], jacketBack, { id: 'acc-jacket', hide: true, solo: true }),
  P([-6.9, 5.2, -4.8], [0.5, 7.6, 9.4], leather, { id: 'acc-jacket', hide: true }),
  P([-6.2, 4.8, 4.9], [1.9, 8.2, 0.9], leather, { id: 'acc-jacket', hide: true }),
  P([-6.6, 12.0, -3.4], [3.0, 1.2, 6.8], leather, { id: 'acc-jacket', hide: true }),
];
const CH = P([-4.4, 11.0, 5.62], [3.9, 0.6, 0.5], goldP, { pivot: [-4.4, 11.3, 5.87], rot: [0, 0, -24], id: 'acc-chain', hide: true });
// goofy hand-pixelled eyes (Fuecoco-like): round whites with a big black pupil
const EYES = eyeRig({ style: 'pix', chunk: 2, at: [-3.1, 19.6, 6.24], line: '#2a0e10', map: { open: [
  '..lll..',
  '.lwwwl.',
  'lwhkkwl',
  'lwkkkwl',
  'lwkkkwl',
  '.lwwsl.',
  '..lll..',
] } });
export const def = {
  name: 'chilichick', ppu: 3, scale: 0.42, outline: { color: '#1c0a0e', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'footR', parent: 'root', pivot: [-2.9, 1.0, 0.6], cubes: FOOT },
    { name: 'footL', parent: 'root', pivot: [2.9, 1.0, 0.6], cubes: FOOT.map(L) },
    { name: 'legR', parent: 'root', pivot: [-2.9, 5.8, 0.4], cubes: LEG },
    { name: 'legL', parent: 'root', pivot: [2.9, 5.8, 0.4], cubes: LEG.map(L) },
    { name: 'body', parent: 'root', pivot: [0, 4.4, 0], cubes: [
      P([-5.6, 4.6, -5.0], [11.2, 8.6, 10.0], body, { faces: { north: back } }),
      P([-6.4, 6.0, -4.4], [12.8, 5.8, 8.8], body, { faces: { north: back } }),
      P([-4.8, 5.2, 4.6], [9.6, 6.8, 1.0], body, { faces: { south: (p, w, h, f) => bellyFront(p, w, h, f) } }),
      P([-4.6, 4.0, -4.2], [9.2, 0.6, 8.4], shade(C.redLo)),
      P([-4.6, 6.2, -5.8], [9.2, 6.0, 0.8], back),
      P([-5.0, 13.2, -4.2], [10.0, 0.6, 8.4], body),
      // dripped: a gold rope chain with a chili pendant
      ...[CH, L(CH)],
      P([-0.4, 9.7, 5.62], [0.8, 0.8, 0.5], goldP, { id: 'acc-chain', hide: true }),
      P([-0.7, 7.4, 5.66], [1.4, 2.4, 0.6], chiliP, { id: 'acc-chain', hide: true }),
      P([-0.8, 9.4, 5.6], [1.6, 0.5, 0.7], calyxP, { id: 'acc-chain', hide: true }),
      // ultra dripped: the bass strap across the chest
      P([-5.6, 11.2, 5.66], [11.8, 0.7, 0.35], strapP, { pivot: [-5.6, 11.55, 5.84], rot: [0, 0, -28], id: 'acc-bass', hide: true }),
      // dripped (or): a black punk jacket, studded, with a flame patch on the back
      ...JACKET, ...JACKET.filter((c) => !c.solo).map(L),
    ] },
    { name: 'bass', parent: 'body', pivot: [0, 8.2, -6.4], rot: [0, 0, -50], cubes: [
      P([-2.8, 5.4, -7.2], [5.6, 5.6, 1.2], bassBody, { id: 'acc-bass', hide: true }),
      P([-3.4, 10.2, -7.1], [1.4, 2.0, 1.0], bassBody, { id: 'acc-bass', hide: true }),
      P([1.8, 10.4, -7.1], [1.2, 2.6, 1.0], bassBody, { id: 'acc-bass', hide: true }),
      P([-0.5, 11.0, -7.0], [1.0, 9.0, 0.8], fretP, { id: 'acc-bass', hide: true }),
      P([-0.8, 20.0, -7.05], [1.6, 2.4, 0.9], headstockP, { id: 'acc-bass', hide: true }),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 10.4, -5.6], cubes: [
      P([-1.2, 10.0, -7.2], [2.4, 6.0, 1.4], tailP, { pivot: [0, 10.4, -6.2], rot: [-38, 0, 0] }),
      P([-3.3, 9.6, -6.8], [2.0, 4.6, 1.2], tailP, { pivot: [-2.2, 10.0, -6.0], rot: [-30, 0, 26] }),
      P([1.3, 9.6, -6.8], [2.0, 4.6, 1.2], tailP, { pivot: [2.2, 10.0, -6.0], rot: [-30, 0, -26] }),
    ] },
    { name: 'tailFire', parent: 'tail', pivot: [0, 15.0, -9.8], cubes: [0, 1, 2].flatMap((f) => [
      P([0, 14.2, -12.0], [0, 3.6, 4.4], flames(f, 0.8), { plane: 'x', glow: true, id: 'tf-' + ABC[f], hide: f > 0 }),
      P([-2.2, 14.2, -9.8], [4.4, 3.6, 0], flames(f + 1, 0.8), { plane: 'z', glow: true, id: 'tf-' + ABC[f], hide: f > 0 }),
    ]) },
    { name: 'wingR', parent: 'body', pivot: [-6.2, 11.8, 0.6], cubes: [...WING, ...WING_ACC] },
    { name: 'wingL', parent: 'body', pivot: [6.2, 11.8, 0.6], cubes: [...WING, ...WING_ACC].map(L) },
    { name: 'bottle', parent: 'body', pivot: [-9.7, 7.95, 1.9], cubes: [
      P([-11.4, 2.6, 0.2], [3.4, 6.8, 3.4], bottleBody),
      P([-11.1, 9.4, 0.5], [2.8, 0.9, 2.8], shade('#c8242a')),
      P([-10.6, 10.3, 1.0], [1.8, 1.6, 1.8], capP),
      P([-10.1, 11.9, 1.5], [0.8, 1.4, 0.8], nozzle),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 12.8, 0.4], cubes: [
      P([-7.0, 12.4, -5.6], [14.0, 11.6, 11.8], headP, { faces: { south: faceP } }),
      P([-6.2, 24.0, -4.8], [12.4, 0.8, 10.2], headP),
      P([-6.2, 11.8, -4.6], [12.4, 0.6, 9.6], shade(C.red)),
      P([-6.0, 13.4, -6.4], [12.0, 9.6, 0.8], headP),
      // rocker shades: two mirrored red lenses over the eyes
      P([-5.8, 17.3, 6.42], [5.2, 4.6, 0.5], lensP, { id: 'acc-shades', hide: true }),
      P([0.6, 17.3, 6.42], [5.2, 4.6, 0.5], lensP, { id: 'acc-shades', hide: true, mirror: true }),
      P([-0.7, 20.6, 6.45], [1.4, 0.6, 0.4], shade('#18161c'), { id: 'acc-shades', hide: true }),
      P([-7.3, 20.4, -3.0], [0.4, 0.6, 9.8], shade('#18161c'), { id: 'acc-shades', hide: true }),
      P([6.9, 20.4, -3.0], [0.4, 0.6, 9.8], shade('#18161c'), { id: 'acc-shades', hide: true }),
      // a cowlick at the back
      P([-0.7, 23.4, -6.9], [1.4, 2.6, 1.2], tuftP, { pivot: [0, 23.6, -6.2], rot: [-35, 0, 0] }),
      // the beak: upper bill and a hooked tip
      P([-2.6, 15.6, 6.0], [5.2, 2.2, 2.4], beakTop),
      P([-1.8, 15.0, 8.0], [3.6, 2.4, 1.6], beakTip, { pivot: [0, 17.4, 8.0], rot: [24, 0, 0] }),
    ] },
    ...EYES.bones,
    // the frontman's punk fringe: a band of feathers with spikes standing up
    { name: 'fringe', parent: 'head', pivot: [0, 24.2, 5.4], cubes: [
      P([-6.8, 22.6, 5.6], [13.6, 1.8, 1.0], fringeP),
      P([-5.6, 23.6, 4.2], [2.0, 3.0, 2.0], lockP, { pivot: [-4.6, 23.8, 5.2], rot: [-20, 0, 24] }),
      P([-2.6, 23.8, 4.4], [2.0, 3.4, 2.0], lockP, { pivot: [-1.6, 24.0, 5.4], rot: [-24, 0, 8] }),
      P([3.0, 23.6, 4.2], [2.0, 3.0, 2.0], lockP, { pivot: [4.0, 23.8, 5.2], rot: [-20, 0, -26] }),
      // a crown of little chilies: a gold band round the top of the head with peppers standing on it
      P([-6.6, 23.4, 5.7], [13.2, 1.4, 0.8], goldP, { id: 'acc-crown', hide: true }),
      P([-6.6, 23.4, -6.3], [13.2, 1.4, 0.8], goldP, { id: 'acc-crown', hide: true }),
      P([-7.2, 23.4, -6.3], [0.8, 1.4, 12.8], goldP, { id: 'acc-crown', hide: true }),
      P([6.4, 23.4, -6.3], [0.8, 1.4, 12.8], goldP, { id: 'acc-crown', hide: true }),
      ...[-5, -2.5, 0, 2.5, 5].map((x, i) => P([x - 0.6, 24.8, 5.8], [1.2, 2.8, 1.2], i % 2 ? goldP : chiliP, { id: 'acc-crown', hide: true, pivot: [x, 24.8, 6.4], rot: [-10, 0, (i - 2) * -10] })),
      P([-7.4, 18.0, -3.8], [1.0, 6.0, 8.4], lockP),
      P([6.4, 18.0, -3.8], [1.0, 6.0, 8.4], lockP, { mirror: true }),
      P([-6.4, 17.2, -6.8], [12.8, 6.6, 1.0], fringeP),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 15.6, 6.2], cubes: [P([-2.2, 14.2, 6.0], [4.4, 1.4, 2.8], beakLow)] },
    { name: 'tongue', parent: 'jaw', pivot: [1.0, 15.6, 7.4], rot: [26, 24, -6], cubes: [P([0.25, 15.35, 7.4], [1.5, 0.5, 2.0], tongueP)] },
    { name: 'tongue2', parent: 'tongue', pivot: [1.0, 15.6, 9.4], rot: [26, 0, 0], cubes: [P([0.35, 15.37, 9.4], [1.3, 0.46, 1.7], tongueP)] },
    { name: 'wattle', parent: 'jaw', pivot: [0, 14.2, 7.6], cubes: [P([-1.25, 12.2, 7.1], [1.1, 2.0, 0.9], wattleP), P([0.15, 12.4, 7.1], [1.1, 1.8, 0.9], wattleP)] },
    { name: 'snot', parent: 'head', pivot: [-1.0, 17.9, 7.7], cubes: [P([-3.4, 17.7, 7.75], [2.6, 2.6, 0], bubbleP, { plane: 'z', id: 'snot', hide: true })] },
    // the chili comb: a calyx on the head, the pepper curling over to one side, its tip burning like a fuse
    { name: 'comb', parent: 'head', pivot: [0.2, 24.6, 0.6], cubes: [
      P([-1.8, 24.0, -1.2], [4.0, 1.0, 3.6], calyxP),
      P([-3.0, 24.95, -2.6], [6.4, 0, 6.4], calyxStar, { plane: 'y' }),
    ] },
    { name: 'chili1', parent: 'comb', pivot: [0.2, 25.0, 0.6], rot: [0, 0, -20], cubes: [P([-1.6, 24.8, -1.2], [3.6, 4.4, 3.6], chiliP)] },
    { name: 'chili2', parent: 'chili1', pivot: [0.2, 29.0, 0.6], rot: [0, 0, -28], cubes: [P([-1.25, 28.8, -0.85], [2.9, 3.8, 2.9], chiliP)] },
    { name: 'chili3', parent: 'chili2', pivot: [0.2, 32.4, 0.6], rot: [0, 0, -34], cubes: [P([-0.9, 32.2, -0.5], [2.2, 3.0, 2.2], chiliP)] },
    { name: 'chili4', parent: 'chili3', pivot: [0.2, 35.0, 0.6], rot: [0, 0, -30], cubes: [P([-0.45, 34.8, -0.05], [1.3, 2.0, 1.3], chiliTip)] },
    { name: 'fuse', parent: 'chili4', pivot: [0.2, 36.6, 0.6], rot: [0, 0, 112], cubes: [
      ...[0, 1, 2].flatMap((f) => [
        P([0.2, 36.0, -2.4], [0, 5.0, 6.0], flames(f), { plane: 'x', glow: true, id: 'fl-' + ABC[f], hide: f > 0 }),
        P([-2.8, 36.0, 0.6], [6.0, 5.0, 0], flames(f + 5), { plane: 'z', glow: true, id: 'fl-' + ABC[f], hide: f > 0 }),
      ]),
      ...[0, 1].flatMap((f) => [
        P([0.2, 36.0, -1.4], [0, 2.6, 4.0], flames(f + 3, 0.6), { plane: 'x', glow: true, id: 'fl-low' + f, hide: true }),
        P([-1.8, 36.0, 0.6], [4.0, 2.6, 0], flames(f + 8, 0.6), { plane: 'z', glow: true, id: 'fl-low' + f, hide: true }),
      ]),
    ] },
  ],
  // appearance tiers: normal wears one of the first list, dripped adds the second, ultra dripped the third
  drip: [
    [{ id: 'acc-shades', name: 'Rocker shades' }, { id: 'acc-bands', name: 'Chili bracelets' }],
    [{ id: 'acc-jacket', name: 'Punk jacket' }, { id: 'acc-chain', name: 'Chili-pendant chain' }],
    [{ id: 'acc-bass', name: 'Flame slap bass' }, { id: 'acc-crown', name: 'Chili crown' }],
  ],
  // where bought gear sits (model units): hats go beside the chili
  attach: {
    head: { bone: 'head', at: [-2.6, 24.6, 0.4], size: 12 },
    face: { bone: 'head', at: [0, 19.5, 6.3], size: 14 },
    neck: { bone: 'body', at: [0, 12.8, 4.6], size: 11 },
    back: { bone: 'body', at: [0, 9.2, -5.9], size: 9 },
  },
};
// the belly: a golden patch whose top edge rises into three flame tongues
function bellyFront(p, w, h, face) {
  body(p, w, h, face);
  const cx = w / 2, cy = h * 0.66, rx = w * 0.4, ry = h * 0.5;
  const tongues = [[cx - w * 0.2, h * 0.16], [cx, h * 0.02], [cx + w * 0.2, h * 0.16]];
  const inside = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1) return true;
    const base = cy - ry * 0.8;
    return tongues.some(([tx, tip]) => { const t = (y + 0.5 - tip) / (base - tip); if (t < 0 || t > 1.1) return false; const sway = Math.sin(t * 3) * 1.2; return Math.abs(x + 0.5 - tx - sway) < Math.max(0.5, w * 0.09 * t ** 0.7); });
  };
  region(p, w, h, inside, (x, y) => { const c = ramp([C.bellyHi, C.belly, C.bellyLo], y / h, x, y); return y % 3 === 0 && (x + (y >> 1)) % 4 === 0 ? shift(c, -0.12) : c; }, C.bellyLo);
}

// ---------------------------------------------------------------- the squeeze-bottle pose
// The wings are too short to lift the big bottle above the beak, so it squirts it in
// from the side: the bottle swings up beside the face with its nozzle in the corner of
// the beak. Solved once here: the bottle's rotation and offset that put the nozzle tip
// on the beak corner while the head turns toward it.
const D2R = Math.PI / 180, SIP_HEAD = [-8, -16, -6], HEAD_PIV = [0, 12.8, 0.4], BEAK_CORNER = [-1.6, 15.5, 8.2], BOTTLE = { c: [-9.7, 7.95, 1.9], tip: [-9.7, 13.3, 1.9] };
const SIP = (() => {
  const hp = new THREE.Vector3(...HEAD_PIV), M = new THREE.Vector3(...BEAK_CORNER).sub(hp).applyEuler(new THREE.Euler(...SIP_HEAD.map((a) => a * D2R))).add(hp);
  const u = new THREE.Vector3(0.82, 0.4, 0.4).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), u), e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  const c = new THREE.Vector3(...BOTTLE.c), d = M.sub(c).sub(new THREE.Vector3(...BOTTLE.tip).sub(c).applyQuaternion(q));
  return { rot: [e.x / D2R, e.y / D2R, e.z / D2R], pos: [d.x, d.y, d.z] };
})();
function drink(P, k) {
  P.rot('bottle', SIP.rot[0] * k, SIP.rot[1] * k, SIP.rot[2] * k).pos('bottle', SIP.pos[0] * k, SIP.pos[1] * k, SIP.pos[2] * k);
  P.rot('head', SIP_HEAD[0] * k, SIP_HEAD[1] * k, SIP_HEAD[2] * k).rot('wingR', -62 * k, 0, 26 * k);
}

// ---------------------------------------------------------------- animation
const cyc = (t, fps, n) => Math.floor(t * fps) % n;
const LEG_LEN = 4.9;
// keep the feet planted while the body rises/sinks by dy units (legs stretch to reach)
function plant(P, dy) { for (const s of ['legR', 'legL']) { P.pos(s, 0, dy, 0); P.scl(s, 1, Math.max(0.35, (LEG_LEN + dy) / LEG_LEN), 1); } }
const flicker = (P, t) => P.face('flame', ABC[cyc(t, 9, 3)]).face('tailfire', ABC[cyc(t, 7, 3)]);
const eyesTo = (P, x, y = 0) => P.pos('eyeR', x, y, 0).pos('eyeL', x, y, 0);
const eyeScale = (P, sx, sy = sx) => P.scl('eyeR', sx, sy, 1).scl('eyeL', sx, sy, 1);
const MOUTH = [0, 15.4, 9.6];
// lying on its side with both legs sticking up in the air (feet ride on the leg tips)
function toppled(P, k) {
  P.rot('root', 0, 0, 84 * k).pos('root', 5.5 * k, 5.6 * k, 0).rot('jaw', 30 * k).rot('head', 0, 0, 6 * k).rot('tongue', 24 * k, 0, 0);
  for (const [s, phi] of [['R', 102], ['L', 86]]) {
    const a = phi * k * D2R, r = 4.8;
    P.rot('leg' + s, 0, 0, phi * k).rot('foot' + s, 0, 0, phi * k).pos('foot' + s, r * Math.sin(a), r - r * Math.cos(a), 0);
  }
  P.rot('wingL', 0, 0, 70 * k).rot('wingR', 0, 0, -10 * k);
}
export const anim = {
  start: 'idle', seed: 7,
  breathe: { bone: 'body', amp: 0.02, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.0, 4.6], dur: 0.12 },
  look: { bone: 'head', yaw: 26, pitch: 12, speed: 5 },
  springs: [
    { bone: 'chili1', tip: [0, 4.4, 0], k: 170, d: 9, gain: 0.6, max: 8, axes: [1, 0.3, 1] },
    { bone: 'chili2', tip: [0, 3.8, 0], k: 150, d: 8, gain: 0.7, max: 10, axes: [1, 0.3, 1] },
    { bone: 'chili3', tip: [0, 3.0, 0], k: 130, d: 7, gain: 0.8, max: 12, axes: [1, 0.3, 1] },
    { bone: 'chili4', tip: [0, 2.0, 0], k: 120, d: 7, gain: 0.8, max: 12, axes: [1, 0.3, 1] },
    { bone: 'fuse', tip: [0, 3, 0], k: 160, d: 8, gain: 0.5, max: 8 },
    { bone: 'fringe', tip: [0, -2, 1], k: 200, d: 10, gain: 0.6, max: 10, axes: [1, 0, 1] },
    { bone: 'tongue', tip: [0, 0, 2.0], k: 110, d: 6, gain: 1.3, max: 35 },
    { bone: 'tongue2', tip: [0, 0, 1.7], k: 90, d: 5, gain: 1.5, max: 40 },
    { bone: 'wattle', tip: [0, -2.2, 0], k: 140, d: 7, gain: 1.1, max: 28 },
    { bone: 'tail', tip: [0, 5, -3], k: 160, d: 8, gain: 0.9, max: 20 },
    { bone: 'wingR', tip: [-1, -6, 0], k: 220, d: 11, gain: 0.35, max: 14, axes: [1, 0, 1] },
    { bone: 'wingL', tip: [1, -6, 0], k: 220, d: 11, gain: 0.35, max: 14, axes: [1, 0, 1] },
  ],
  faces: {
    eyes: EYES.slot,
    flame: { default: 'a', states: { a: ['fl-a'], b: ['fl-b'], c: ['fl-c'], low0: ['fl-low0'], low1: ['fl-low1'], off: [] } },
    tailfire: { default: 'a', states: { a: ['tf-a'], b: ['tf-b'], c: ['tf-c'], off: [] } },
    snot: { default: 'off', states: { off: [], on: ['snot'] } },
  },
  fidget: { every: [3.5, 7], clips: ['sip', 'hiccup', 'dance', 'dance'] },
  clips: {
    // bouncing on its big feet, panting with its tongue out, eyes darting about
    idle: { len: 2.0, loop: true, f(P, t, c) {
      const b = bounce(t, 0.5, { squash: 0.07, stretch: 0.03 }), dy = b.u * 0.7 - 0.25;
      P.pos('body', 0, dy, 0).sq('body', b.sq); plant(P, dy);
      P.rot('head', 3 + wave(t, 2, -0.6) * 3, wave(t, 0.5) * 6, wave(t, 0.5, 1) * 4);
      P.rot('jaw', 10 + Math.max(0, wave(t, 4)) * 5);
      P.rot('wingR', 0, 0, -4 - b.u * 6).rot('wingL', 0, 0, 4 + b.u * 6).rot('tail', wave(t, 1) * 6, wave(t, 0.5) * 10, 0);
      // a glance this loop: left, right, a cross-eyed derp, or nothing
      const m = (c.loopN * 5 + 1) % 4, k = seg(t, 0.55, 0.65, E.out) * (1 - seg(t, 1.35, 1.45, E.out));
      if (m === 2) P.pos('eyeR', 0.35 * k, 0, 0).pos('eyeL', -0.35 * k, 0, 0); else eyesTo(P, (m === 0 ? -0.4 : m === 1 ? 0.4 : 0) * k, 0.1 * k);
      flicker(P, t);
      if (c.loopN % 2 === 0) P.burst(1.2, 'sweat', 'head', [6.6, 22, 3.5], {});
    } },
    // squirts hot sauce into its beak… and regrets it, loudly
    sip: { len: 3.4, next: 'idle', f(P, t) {
      flicker(P, t); P.lookW = 0; P.blinkOK = false;
      const up = seg(t, 0.1, 0.5, E.out3) * (1 - seg(t, 1.45, 1.7, E.inout));
      drink(P, up);
      P.rot('body', -4 * up, 0, 0).rot('wingL', 0, 0, (25 + wave(t, 6) * 8) * up);
      for (const g of [0.62, 0.92, 1.22]) {
        const k = bump(t, g, g + 0.18);
        P.scl('bottle', 1 - 0.2 * k, 1 + 0.03 * k, 1 - 0.2 * k).sq('body', -0.04 * k);
        P.burst(g + 0.03, 'drop', 'head', MOUTH, { n: 3, tint: '#e8202a', speed: 0.4, spread: 0.4, scale: 0.5 });
      }
      P.face('eyes', t > 0.15 && t < 0.55 ? 'happy' : t < 1.5 ? (t >= 0.55 ? 'closed' : undefined) : t < 1.82 ? 'open' : t < 1.95 ? 'shock' : t < 3.0 ? 'shut' : undefined);
      // a beat of nothing… then the heat arrives
      const boom = seg(t, 1.95, 2.02, E.out) * (1 - seg(t, 2.9, 3.3, E.inout)), pause = bump(t, 1.6, 1.98);
      eyeScale(P, 1 + 0.25 * pause, 1 + 0.35 * pause);
      P.rot('jaw', 40 * boom + wave(t, 9) * 6 * boom).scl('fuse', 1 + 1.2 * boom);
      const run = seg(t, 2.05, 2.95, E.inout), hh = t > 2.05 && t < 2.95 ? Math.abs(Math.sin(((t - 2.05) * Math.PI) / 0.15)) * 1.6 : 0;
      P.rot('root', 0, 360 * run, 0).pos('root', 0, hh, 0).sq('body', wob(t, 1.97, 0.14, 3, 6));
      P.rot('wingR', 0, 0, -(60 + wave(t, 8) * 30) * boom).rot('wingL', 0, 0, (60 + wave(t, 8, 1) * 30) * boom).rot('head', -14 * boom, 0, wave(t, 7) * 8 * boom);
      P.burst(1.97, 'steam', 'head', [0, 25, 0], { n: 12, dir: [0, 1, 0], spread: 0.9, speed: 1.8 }).burst(1.97, 'sweat', 'head', [6.5, 22, 3], { n: 3 }).burst(1.99, 'anger', 'head', [-6, 25, 2], {});
      if (t > 2.0 && t < 2.8) P.stream('breath', 'head', MOUTH, { rate: 90, dir: [0, 0.3, 1], speed: 0.7, spread: 0.35 });
    } },
    // hic! hic! hic! — a puff of fire each time, then a sheepish scratch
    hiccup: { len: 2.2, next: 'idle', f(P, t) {
      flicker(P, t);
      let jolt = 0;
      for (const h0 of [0.3, 0.95, 1.55]) {
        jolt = Math.max(jolt, bump(t, h0, h0 + 0.2));
        P.burst(h0 + 0.03, 'fire', 'head', MOUTH, { n: 7, dir: [0, 0.4, 1], speed: 1.1, spread: 0.35, scale: 0.8 }).burst(h0 + 0.06, 'smoke', 'head', MOUTH, { n: 3, dir: [0, 1, 0.5], scale: 0.6 });
        P.sq('body', wob(t, h0 + 0.2, -0.1, 3.5, 7));
      }
      P.pos('root', 0, 1.6 * jolt, 0).sq('body', 0.12 * jolt).rot('jaw', 10 + 28 * jolt).rot('head', -8 * jolt, 0, 0); eyeScale(P, 1 + 0.3 * jolt, 1 + 0.4 * jolt);
      P.rot('wingR', 0, 0, -30 * jolt).rot('wingL', 0, 0, 30 * jolt);
      const sheepish = seg(t, 1.8, 1.95) * (1 - seg(t, 2.1, 2.2));
      P.rot('head', 0, 0, 10 * sheepish).rot('wingL', -40 * sheepish, 0, 150 * sheepish);
      P.face('eyes', jolt > 0.3 ? 'shock' : sheepish > 0.2 ? 'happy' : undefined); P.blinkOK = jolt < 0.1;
    } },
    // the funky chicken: flap flap, peck peck, stomp, then a spin and a wink
    dance: { len: 2.4, next: 'idle', f(P, t) {
      flicker(P, t); P.blinkOK = false;
      const bt = t / 0.3, n = Math.floor(bt), ph = bt - n, pulse = Math.sin(Math.min(1, ph * 1.6) * Math.PI), live = 1 - seg(t, 1.9, 2.0);
      const flap = n % 4 < 2 ? pulse : 0, peck = n % 4 >= 2 ? pulse : 0, side = n % 2 ? 1 : -1;
      P.rot('wingR', 0, 0, -55 * flap * live).rot('wingL', 0, 0, 55 * flap * live);
      P.pos('head', 0, 0, 1.6 * peck * live).rot('head', 10 * peck * live, 0, 0);
      P.pos(side > 0 ? 'footL' : 'footR', 0, 1.4 * pulse * live, 0).pos(side > 0 ? 'legL' : 'legR', 0, 1.1 * pulse * live, 0);
      P.rot('body', 0, 0, side * 7 * pulse * live).sq('body', -0.06 * (1 - pulse) * live).rot('jaw', 22 * live);
      const spin = seg(t, 1.92, 2.22, E.inout), pose = seg(t, 2.15, 2.25, E.back);
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, 2.2 * bump(t, 1.92, 2.22), 0);
      P.rot('wingR', 0, 0, -130 * pose).rot('wingL', 0, 0, 30 * pose).rot('head', 0, 0, -8 * pose);
      P.face('eyes', t > 2.2 ? 'wink' : 'happy');
      P.burst(0.05, 'note', 'head', [5, 25, 2], {}).burst(0.65, 'note', 'head', [-5, 25, 2], {}).burst(1.25, 'note', 'head', [5, 25, 2], {}).burst(2.2, 'sparkle', 'head', [0, 24, 4], { n: 6 });
    } },
    // battle cry: crouch, rear up and crow fire at the sky… and the voice cracks
    cry: { len: 2.0, next: 'idle', f(P, t) {
      flicker(P, t); P.lookW = 1 - seg(t, 0.3, 0.4);
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.5, 1.85, E.inout)), crack = bump(t, 1.05, 1.3);
      const dy = -1.8 * crouch + 1.0 * up; P.pos('body', 0, dy, 0).sq('body', -0.16 * crouch + 0.08 * up + wob(t, 1.85, 0.05, 3, 5)); plant(P, dy);
      P.rot('body', -10 * up, 0, 0).rot('head', 14 * crouch - 30 * up + 18 * crack + wave(t, 12) * 3 * up, 0, wave(t, 7) * 4 * up).rot('jaw', 6 * crouch + 44 * up - 30 * crack);
      P.rot('wingR', -15 * up, 0, 14 * crouch - 85 * up + wave(t, 7) * 14 * up).rot('wingL', -15 * up, 0, -14 * crouch + 85 * up - wave(t, 7.3) * 14 * up); P.scl('fuse', 1 + 1.4 * up);
      P.face('eyes', crouch > 0.3 ? 'angry' : crack > 0.4 ? 'shock' : up > 0.4 ? 'shut' : undefined); P.blinkOK = up < 0.1;
      if (t > 0.5 && t < 1.05) P.stream('breath', 'head', MOUTH, { rate: 100, dir: [0, 0.8, 0.6], speed: 0.9, spread: 0.3 });
      if (t > 0.5 && t < 1.4) P.stream('ember', 'fuse', [0.2, 39, 0.6], { rate: 18, spread: 1 });
      P.burst(1.1, 'smoke', 'head', MOUTH, { n: 5, dir: [0, 1, 0.4], speed: 0.6 }).burst(1.12, 'sweat', 'head', [6.5, 22, 3], {}).burst(0.5, 'ring', 'root', [0, 1, 0], {});
    } },
    // special (fire): a squirt of sauce, cheeks puff, then a jet of flame
    special: { len: 1.9, next: 'idle', f(P, t) {
      flicker(P, t); P.blinkOK = false;
      const lift = seg(t, 0.0, 0.22, E.out3) * (1 - seg(t, 0.4, 0.55, E.inout));
      P.lookW = 1 - lift; drink(P, lift);
      { const k = bump(t, 0.22, 0.38); P.scl('bottle', 1 - 0.22 * k, 1, 1 - 0.22 * k); P.burst(0.25, 'drop', 'head', MOUTH, { n: 4, tint: '#e8202a', speed: 0.5, scale: 0.5 }); }
      const puff = seg(t, 0.5, 0.7, E.out) * (1 - seg(t, 0.72, 0.78)), blast = seg(t, 0.72, 0.8, E.out) * (1 - seg(t, 1.45, 1.75, E.inout));
      P.scl('head', 1 + 0.12 * puff, 1 + 0.05 * puff, 1 + 0.12 * puff).rot('head', 8 * puff - 8 * blast + wave(t, 15) * 2 * blast, wave(t, 13) * 3 * puff, 0);
      P.rot('jaw', -6 * puff + 42 * blast).pos('root', 0, 0, -1.4 * blast).sq('body', 0.07 * puff - 0.05 * blast + wave(t, 20) * 0.02 * puff);
      P.rot('wingR', 0, 0, -35 * blast).rot('wingL', 0, 0, 35 * blast + wave(t, 14) * 6 * blast).scl('fuse', 1 + 1.6 * blast); eyeScale(P, 1 + 0.3 * puff);
      P.face('eyes', t < 0.45 ? 'closed' : puff > 0.2 ? 'shock' : blast > 0.2 ? 'angry' : t > 1.6 ? 'happy' : undefined);
      if (t > 0.78 && t < 1.45) P.stream('breath', 'head', MOUTH, { rate: 140, dir: [0, 0.05, 1], spread: 0.16 });
      P.burst(1.55, 'smoke', 'head', MOUTH, { n: 6, dir: [0, 1, 0.4], speed: 0.7 }).burst(1.55, 'sweat', 'head', [-6.5, 22, 3], {});
    } },
    // attack (physical): rear back, lunge, peck
    attack: { len: 0.95, next: 'idle', f(P, t) {
      flicker(P, t);
      const bk = seg(t, 0, 0.26, E.out) * (1 - seg(t, 0.26, 0.36, E.in)), hit = seg(t, 0.28, 0.4, E.in3) * (1 - seg(t, 0.5, 0.9, E.inout));
      P.pos('root', 0, 0.8 * bk, -2.2 * bk + 6 * hit).rot('body', -12 * bk + 20 * hit, 0, 0).rot('head', -16 * bk + 26 * hit, 0, 0).rot('jaw', 22 * bk);
      P.sq('body', -0.08 * bk + 0.08 * hit * (1 - seg(t, 0.4, 0.5)) + wob(t, 0.42, 0.07, 4, 7));
      P.rot('wingR', 0, 0, -50 * bk + 15 * hit).rot('wingL', 0, 0, 50 * bk - 15 * hit);
      P.face('eyes', bk > 0.3 ? 'angry' : hit > 0.3 ? 'shut' : undefined); P.blinkOK = false;
      P.burst(0.4, 'spark', 'head', [0, 16, 11], {}).burst(0.4, 'star', 'head', [0, 17, 11], { n: 4 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.6 * k).rot('body', -18 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.15 * k).rot('head', -14 * k, 0, 0).rot('jaw', 32 * k);
      P.rot('wingR', 0, 0, -55 * k).rot('wingL', 0, 0, 55 * k);
      P.face('eyes', t < 0.45 ? 'x' : undefined); P.blinkOK = false;
      P.burst(0.02, 'feather', 'body', [0, 10, 0], { n: 7, speed: 1.4 }).burst(0.02, 'spark', 'body', [0, 10, 6], {});
    } },
    // dizzy wobble, then it keels over with its feet in the air
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', 0, wave(t, 1.6) * 22 * dizzy, wave(t, 2.2) * 12 * dizzy).rot('head', 0, 0, wave(t, 2.2, 1) * 16 * dizzy).rot('jaw', 24 * dizzy);
      P.pos('body', 0, -1 * dizzy, 0); plant(P, -1 * dizzy);
      toppled(P, fall);
      P.face('eyes', 'swirl').face('flame', t < 1.0 ? ABC[cyc(t, 8, 3)] : 'off').face('tailfire', t < 1.0 ? 'a' : 'off'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.0, 'star', 'head', [0, 26, 0], { n: 5 }).burst(1.38, 'dust', 'root', [0, 0, 0], { n: 8 }).burst(1.2, 'smoke', 'fuse', [0.2, 37.5, 0.6], { n: 6, spread: 0.6 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      toppled(P, 1); P.face('eyes', 'swirl').face('flame', 'off').face('tailfire', 'off'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      const tw = bump(t, 0.5, 0.62) + bump(t, 0.72, 0.84) + bump(t, 1.7, 1.82);
      P.rot('footR', 0, 0, 14 * tw).rot('footL', 0, 0, -10 * tw);
      P.stream('smoke', 'fuse', [0.2, 37.5, 0.6], { rate: 1.2 });
    } },
    // a goofy waddle: big feet slapping, head pecking back and forth
    walk: { len: 0.5, loop: true, f(P, t) {
      flicker(P, t);
      const ph = (t / 0.5) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph), dy = Math.abs(c2) * 0.9, lr = Math.max(0, s), ll = Math.max(0, -s);
      P.pos('body', 0, dy, 0).rot('body', 4, s * 8, s * 10).sq('body', -0.05 * (1 - Math.abs(c2)));
      P.pos('footR', 0, lr * 2.2, s * 2.4).rot('footR', -25 * lr, 0, 0).pos('footL', 0, ll * 2.2, -s * 2.4).rot('footL', -25 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.6 + dy * 0.5, s * 1.4).pos('legL', 0, ll * 1.6 + dy * 0.5, -s * 1.4);
      P.pos('head', 0, 0, Math.sin(ph * 2) * 1.1).rot('head', 4 - dy * 4, -s * 5, -s * 5);
      P.rot('wingR', 0, 0, -16 - Math.abs(s) * 14 + wave(t, 8) * 4).rot('wingL', 0, 0, 16 + Math.abs(s) * 14 - wave(t, 8) * 4).rot('jaw', 12);
    } },
    // victory: a spinning hop, then a pose with a wink
    win: { len: 1.9, next: 'idle', f(P, t) {
      flicker(P, t); P.blinkOK = false;
      const h = t < 0.95 ? hop(t, 0.95, 8, { crouch: 1.8 }) : { y: wob(t, 0.95, -1.2, 3, 6), sq: wob(t, 0.95, -0.16, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq).rot('root', 0, 360 * seg(t, 0.22, 0.66, E.inout), 0);
      if (h.y < 0) plant(P, h.y);
      const pose = seg(t, 1.0, 1.15, E.back), air = seg(t, 0.2, 0.3) * (1 - seg(t, 0.9, 1.0));
      P.rot('wingR', 0, 0, -70 * air - 150 * pose + wave(t, 3) * 6 * pose).rot('wingL', 0, 0, 70 * air + 20 * pose).rot('head', -14 * air, 0, -10 * pose).rot('jaw', 30 * air + 18 * pose).scl('fuse', 1 + 0.8 * air);
      P.rot('body', 0, 0, -6 * pose);
      P.face('eyes', air > 0.4 ? 'shut' : pose > 0.5 ? 'wink' : 'happy');
      P.burst(0.95, 'ring', 'root', [0, 1, 0], {}).burst(0.95, 'fire', 'root', [0, 1, 0], { n: 24, spread: 1, speed: 1.4 }).burst(1.1, 'sparkle', 'head', [0, 26, 2], { n: 8 });
    } },
    // asleep (title screen): sunk down, crest burning low, a snot bubble swelling with each breath
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      P.pos('body', 0, -1.9 + br * 0.3, 0).sq('body', -0.06 + br * 0.04); plant(P, -1.9 + br * 0.3);
      P.rot('head', 20 + br * 3, 0, 8).rot('jaw', 6 + Math.max(0, br) * 6).rot('wingR', 0, 0, 6).rot('wingL', 0, 0, -6);
      P.face('eyes', 'closed').face('flame', 'low' + cyc(t, 4, 2)).face('tailfire', 'off').face('snot', 'on'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.scl('snot', 0.45 + 0.55 * (br * 0.5 + 0.5));
      P.burst(0.4, 'z', 'head', [4, 24, 4], {}).burst(1.6, 'z', 'head', [4, 24, 4], {});
    } },
  },
};
def.anim = anim;
