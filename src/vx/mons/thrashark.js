// Thrashark — Team Metallica's walking buzzsaw (Hydro/Ferro). A shark that stomps around on stubby
// fin-legs; its dorsal fin is a circular steel sawblade that never stops spinning (not even in its
// sleep), its lower jaw is a riveted steel plate, thrash-metal lightning zig-zags down both flanks and
// a studded band rides its tail. Mean little eyes, rows of teeth. A Ride the Lightning nod: blue-white
// lightning crackles around the blade, and its special charges the whole shark with it before it
// hurls the saw like a disc.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, gradient, poly, ramp, shift, mix, h2 } from './kit.js';

const C = {
  skin: '#5686ce', skinHi: '#92c8f2', skinLo: '#3a54a2', skinDeep: '#2c3272',
  belly: '#e2eaf6', bellyHi: '#ffffff', bellyLo: '#aebad8', bellyDeep: '#7a80aa',
  fin: '#4a74c0', finHi: '#7ab0ea', finLo: '#334a96', finDeep: '#262c66',
  bolt: ['#fffbd0', '#ffe45a', '#f2b22c', '#c07a22'], boltLine: '#3a2410',
  gum: '#d8466a', gumLo: '#9a2650', gumDeep: '#5a1434', tooth: '#ffffff', toothLo: '#c8d0e8',
  red: '#c0182a', redHi: '#f04a52', redLo: '#7a0e22',
  eye: '#ffe23a', eyeLo: '#e08a1c', ink: '#0e1232',
  zapW: '#ffffff', zapC: '#a8f0ff', zapB: '#4a9aff',
};
const CHROME = ['#ffffff', '#dfe6f4', '#aab4d0', '#5c6488', '#7c86aa', '#9aa4c4'];

// ---------------------------------------------------------------- painters
// skin: countershaded — blue back, a crisp white belly line low on the sides, faint vertical streaks
function skinP(o = {}) {
  const line = o.line ?? 0.62;
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let col;
      if (face === 'up') col = (x * 5 + y * 3) % 13 === 0 ? C.skin : C.skinHi;
      else if (face === 'down') col = (x + y) % 9 === 0 ? C.bellyLo : C.belly;
      else {
        const t = y / Math.max(1, h - 1), edge = line + Math.sin(x * 0.45) * 0.03;
        col = t < edge ? ramp([C.skinHi, C.skin, C.skinLo], Math.min(1, t / edge), x, y) : ramp([C.bellyHi, C.belly, C.bellyLo], (t - edge) / (1 - edge), x, y);
        if (Math.abs(t - edge) < 0.5 / h) col = C.skinDeep;
      }
      p.px(x, y, col);
    }
    if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, 0, shift(C.skinHi, 0.12));
  };
}
const skin = skinP(), skinHigh = skinP({ line: 0.8 }), skinBack = skinP({ line: 1.1 });
const finP = shade(C.fin, { top: C.finHi, bottom: C.finLo, grain: 0 });
// a thrash-metal lightning bolt across a flank: a fat sawtooth stroke, black-edged, tapering at both ends
function boltP(o = {}) {
  const base = o.base || skin;
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face !== 'east' && face !== 'west') return;
    const flip = face === 'west', amp = h * (o.amp || 0.16), per = o.per || 9, th = o.th || 3.2, y0 = h * (o.y0 || 0.32), y1 = h * (o.y1 || 0.5);
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      const X = flip ? w - 1 - x : x, u = X / w, f = (X / per) % 1, tri = (f < 0.5 ? f * 4 - 1 : 3 - f * 4) * amp;
      const cy = y0 + (y1 - y0) * u + tri, taper = Math.min(1, X / 4, (w - X) / 6), d = Math.abs(y - cy);
      if (d <= th * 0.5 * taper + 0.6) p.px(x, y, d > th * 0.5 * taper - 0.4 ? C.boltLine : d < th * 0.2 ? C.bolt[0] : y < cy ? C.bolt[1] : C.bolt[2]);
    }
  };
}
// gills: three dark slits with a faint cyan inner glow
const gillP = (p, w, h, face) => {
  skin(p, w, h, face);
  if (face !== 'east' && face !== 'west') return;
  for (let k = 0; k < 3; k++) { const x0 = Math.round(w * 0.25 + k * 3.2); for (let y = Math.round(h * 0.24); y < h * 0.56; y++) { const x = x0 + Math.round((y - h * 0.24) * 0.18); p.px(x, y, C.ink); p.px(x + 1, y, y % 2 ? '#5ad8ff' : '#2a7ab8'); } }
};
// the riveted steel jaw: brushed plates, a seam, a row of rivets, a dent and a scratch
const jawP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = face === 'up' ? 0.1 : face === 'down' ? 0.9 : y / Math.max(1, h - 1);
    p.px(x, y, ramp([CHROME[1], CHROME[2], CHROME[3]], t, x, y));
  }
  if (face === 'up' || face === 'down') return;
  for (let x = 0; x < w; x++) { p.px(x, 0, '#ffffff'); p.px(x, h - 1, '#3a3e5a'); }
  const ry = Math.round(h * 0.55);
  for (let x = 2; x < w - 2; x += 5) { p.px(x, ry, '#ffffff'); p.px(x + 1, ry, CHROME[2]); p.px(x, ry + 1, CHROME[3]); p.px(x + 1, ry + 1, '#2a2e4a'); }
  for (let x = 0; x < w; x++) p.px(x, Math.round(h * 0.3), CHROME[3]);
  if (face === 'east' || face === 'west') { p.px(Math.round(w * 0.6), 2, '#3a3e5a'); p.px(Math.round(w * 0.6) + 1, 3, '#3a3e5a'); p.px(Math.round(w * 0.6) + 2, 3, '#ffffff'); }
};
const mouthP = (p, w, h) => { p.rect(0, 0, w, h, C.gumDeep); p.rect(1, 1, w - 2, Math.max(1, h - 2), C.gumLo); };
const gumP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'down' ? C.gumLo : y < 1 ? C.gum : C.gumLo); };
// a row of teeth (cut-out plane): triangles pointing down (upper row) or up (lower row)
const teethP = (up, n = 0) => (p, w, h) => {
  const tw = 3 + n;
  for (let x0 = 0; x0 < w; x0 += tw) for (let y = 0; y < h; y++) {
    const v = up ? (h - 1 - y) / h : y / h, half = (1 - v) * (tw / 2);
    for (let x = x0; x < x0 + tw && x < w; x++) { const dx = x - (x0 + (tw - 1) / 2); if (Math.abs(dx) > half) continue; p.px(x, y, dx > 0.3 ? C.toothLo : C.tooth); }
  }
};
const browP = shade(C.skinDeep, { top: C.skinLo, bottom: '#1a1e48', grain: 0 });
function chromeP(o = {}) {
  const f0 = o.from ?? 0, f1 = o.to ?? 1;
  return (p, w, h, face) => {
    if (face === 'up') { p.rect(0, 0, w, h, f0 < 0.3 ? CHROME[0] : CHROME[1]); return; }
    if (face === 'down') { p.rect(0, 0, w, h, CHROME[3]); return; }
    for (let y = 0; y < h; y++) { const t = f0 + (f1 - f0) * (h > 1 ? y / (h - 1) : 0.5); const col = t < 0.2 ? CHROME[0] : t < 0.44 ? CHROME[1] : t < 0.62 ? CHROME[3] : t < 0.84 ? CHROME[4] : CHROME[5]; for (let x = 0; x < w; x++) p.px(x, y, col); }
  };
}
const leatherP = (p, w, h, face) => {
  shade(C.red, { top: C.redHi, bottom: C.redLo, grain: 0 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  for (let x = 1; x < w - 2; x += 4) { const y = Math.floor(h / 2) - 1; p.px(x, y, CHROME[1]); p.px(x + 1, y, '#ffffff'); p.px(x, y + 1, CHROME[3]); p.px(x + 1, y + 1, CHROME[2]); }
};
// the caudal fin: a crescent, lit along its leading edge
const tailFinP = (p, w, h) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = y / (h - 1), u = x / (w - 1);
    // upper lobe sweeps up-back, lower lobe down-back; the trailing edge is a deep crescent
    const lead = 0.18 + Math.abs(v - 0.62) * 0.35, trail = 1 - Math.abs(v - 0.62) * 0.9 - 0.12 * (1 - Math.abs(v - 0.62) * 2);
    if (u < 1 - trail || u > 1 - lead + 0.6 || u > 0.98 - Math.max(0, 0.36 - Math.abs(v - 0.62)) * 1.6) continue;
    if (v < 0.04 && u < 0.7) continue;
    const e = u > 0.9 - Math.max(0, 0.36 - Math.abs(v - 0.62)) * 1.6 || u < 1.08 - trail;
    p.px(x, y, e ? C.finDeep : v < 0.3 ? C.finHi : v > 0.85 ? C.finLo : C.fin);
  }
};
// the sawblade: eighteen hooked teeth with bright tips, a brushed disc, six cooling slots and a bolted
// hub. The pattern repeats every 60° so the spin can be wrapped invisibly.
const SAW_T = 18;
const sawP = (p, w, h) => {
  const c = (w - 1) / 2, R = w / 2 - 0.5, Rg = R - 3.4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - c, dy = y - c, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), k = ((a / (Math.PI * 2)) * SAW_T % 1 + 1) % 1;
    const toothR = Rg + (k < 0.62 ? (k / 0.62) * 3.6 : 3.6 * (1 - (k - 0.62) / 0.38) ** 0.5);
    if (r > toothR) continue;
    let col;
    if (r > toothR - 1.1) col = r > Rg ? (k < 0.5 ? '#ffffff' : '#3a3e60') : '#3a3e60';
    else if (r > Rg - 0.4) col = k < 0.35 ? CHROME[0] : CHROME[1];
    else {
      const sheen = Math.cos(2 * (a + 0.8)) * 0.5 + 0.5, ring = Math.floor(r / 2.2) % 2;
      col = sheen > 0.7 ? (ring ? CHROME[0] : CHROME[1]) : sheen > 0.3 ? (ring ? CHROME[1] : CHROME[2]) : (ring ? CHROME[2] : CHROME[5]);
    }
    p.px(x, y, col);
  }
  // cooling slots: six curved slits
  for (let s = 0; s < 6; s++) { const a0 = (s / 6) * Math.PI * 2; for (let i = 0; i < 9; i++) { const rr = Rg * 0.45 + i * 0.9, aa = a0 + i * 0.06; p.px(Math.round(c + Math.cos(aa) * rr), Math.round(c + Math.sin(aa) * rr), '#2a2e4a'); p.px(Math.round(c + Math.cos(aa) * rr) + 1, Math.round(c + Math.sin(aa) * rr), CHROME[3]); } }
  // the hub, six bolts
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const r = Math.hypot(x - c, y - c); if (r < 5.2) p.px(x, y, r > 4.4 ? '#2a2e4a' : r < 1.6 ? '#1a1e38' : (x + y < 2 * c ? CHROME[1] : CHROME[3])); }
  for (let s = 0; s < 6; s++) { const a = (s / 6) * Math.PI * 2 + 0.5; p.px(Math.round(c + Math.cos(a) * 3.1), Math.round(c + Math.sin(a) * 3.1), '#ffffff'); }
};
// lightning crackling around the rim (glow planes, three flicker frames)
const crackP = (f) => (p, w, h) => {
  const c = (w - 1) / 2, R = w / 2 - 1.5, rnd = (i) => h2(i, f * 31 + 7, 5);
  for (let arc = 0; arc < 3; arc++) {
    const a0 = rnd(arc) * Math.PI * 2, len = 0.6 + rnd(arc + 9) * 0.9;
    let pr = R + (rnd(arc + 3) - 0.5) * 2;
    for (let i = 0; i < 26; i++) {
      const a = a0 + (i / 26) * len, rr = pr + (rnd(arc * 40 + i) - 0.5) * 2.6;
      const x = Math.round(c + Math.cos(a) * rr), y = Math.round(c + Math.sin(a) * rr);
      p.px(x, y, C.zapW); p.px(x + 1, y, C.zapC); p.px(x, y + 1, C.zapB);
      pr = rr * 0.6 + R * 0.4;
    }
    // a fork jumping outward
    const af = a0 + len * 0.5; let fx = c + Math.cos(af) * R, fy = c + Math.sin(af) * R;
    for (let i = 0; i < 6; i++) { fx += Math.cos(af) * 1.2 + (rnd(arc * 7 + i) - 0.5) * 1.6; fy += Math.sin(af) * 1.2 + (rnd(arc * 9 + i) - 0.5) * 1.6; p.px(Math.round(fx), Math.round(fy), i < 3 ? C.zapW : C.zapC); }
  }
};
// the flank bolts lit up with stored charge (glow overlay planes for the special)
const flankGlowP = (f) => (p, w, h) => {
  const amp = h * 0.16, per = 9, th = 3.6, y0 = h * 0.32, y1 = h * 0.5;
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const u = x / w, fr = (x / per) % 1, tri = (fr < 0.5 ? fr * 4 - 1 : 3 - fr * 4) * amp, cy = y0 + (y1 - y0) * u + tri, taper = Math.min(1, x / 4, (w - x) / 6);
    const d = Math.abs(y - cy); if (d > th * 0.5 * taper + 0.4) continue;
    if ((x + y + f) % 5 === 0 && d > 0.6) continue;
    p.px(x, y, d < th * 0.22 ? C.zapW : C.zapC);
  }
};

// eyes: 9 × 7 texels, small and mean: a narrow yellow iris with a black slit, a lid slanting down
// toward the snout. Outer corner at x = 0, inner corner at x = 8.
function eyeShape(p, o = {}) {
  const lid = o.lid ?? 1.6, sl = o.slope ?? 0.42;
  const top = (x) => lid + sl * x, bot = (x) => 6.2 - Math.abs(x - 4.2) ** 2 * 0.09;
  for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) {
    const X = x + 0.5, Y = y + 0.5;
    if (Y < top(X) - 1 || Y > bot(X) + 0.9) continue;
    if (Y < top(X) || Y > bot(X) || x === 0 || x === 8) { p.px(x, y, C.ink); continue; }
    const px = o.px ?? 4.6;
    p.px(x, y, Math.abs(X - px) < 0.7 ? '#0a0a14' : Y > bot(X) - 1.2 ? C.eyeLo : C.eye);
  }
  for (let x = 0; x < 9; x++) p.px(x, Math.floor(top(x + 0.5)) - 1, C.ink);
}
const EYES = {
  mean: (p) => eyeShape(p),
  glare: (p) => eyeShape(p, { lid: 2.4, slope: 0.5 }),
  wide: (p) => eyeShape(p, { lid: 0.6, slope: 0.1 }),
  glee: (p) => { eyeShape(p, { lid: 1.8, slope: 0.36 }); for (let x = 1; x < 8; x++) p.px(x, Math.round(5 - Math.abs(x - 4) * 0.2), C.ink); for (let x = 1; x < 8; x++) p.px(x, 6, 0); },
  closed: (p) => { for (let x = 0; x < 9; x++) { const y = Math.round(2.4 + x * 0.36); p.px(x, y, C.ink); p.px(x, y + 1, x > 0 && x < 8 ? C.ink : 0); } },
  hurt: (p) => { for (let i = 0; i < 4; i++) { p.px(2 + i, 1 + i, C.ink); p.px(3 + i, 1 + i, C.ink); p.px(2 + i, 6 - i, C.ink); p.px(3 + i, 6 - i, C.ink); } },
  x: (p) => { for (let i = 0; i < 6; i++) { p.px(1 + i, i, C.ink); p.px(2 + i, i, C.ink); p.px(6 - i, i, C.ink); p.px(7 - i, i, C.ink); } },
  swirl: (p) => { for (let a = 0; a < 12; a += 0.25) { const r = a * 0.28, x = Math.round(4.2 + Math.cos(a) * r * 1.2), y = Math.round(3.2 + Math.sin(a) * r * 0.9); if (r < 3.4) p.px(x, y, C.ink); } },
};

// ---------------------------------------------------------------- model
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const mirrorCube = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]], rot: c.rot ? [c.rot[0], -c.rot[1], -c.rot[2]] : undefined } : {}) });
const D2R = Math.PI / 180;
const SAW = [0, 26.0, -1.0], SAW_R = 10.4;
// eyes sit on the front corners of the head, turned outward
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-8.25, 15.6, 18.6] : [5.25, 15.6, 18.6], [3.0, 2.3, 0], fn, { plane: 'z', mirror: side > 0, id: 'eye-' + k, hide: k !== 'mean', pivot: [side * 6.75, 16.8, 18.6], rot: [0, side * 34, 0] }));
// fin-legs: a paddle angled out and down, bent into a forward-pointing foot with a pale tip
const legF = [
  P([-10.8, 2.0, 5.0], [2.4, 8.4, 6.8], finP, { pivot: [-9.6, 9.6, 8.4], rot: [0, 0, -24] }),
  P([-13.2, 0, 5.4], [4.6, 1.8, 8.8], footP),
];
const legB = [
  P([-9.4, 2.0, -16.4], [2.2, 8.0, 5.8], finP, { pivot: [-8.3, 9.6, -13.5], rot: [0, 0, -22] }),
  P([-11.6, 0, -16.2], [4.2, 1.7, 7.6], footP),
];
function footP(p, w, h, face) { finP(p, w, h, face); if (face === 'up') { for (let y = h - 3; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === h - 1 ? C.bellyLo : C.belly); for (let k = 1; k < 3; k++) p.px(Math.round(k * w / 3), h - 4, C.finLo); } if (face === 'south') for (let x = 0; x < w; x++) p.px(x, 0, C.belly); }
export const def = {
  name: 'thrashark', ppu: 3, scale: 0.46, outline: { color: C.ink, px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'legFR', parent: 'root', pivot: [-8.4, 9.4, 8.4], cubes: legF },
    { name: 'legFL', parent: 'root', pivot: [8.4, 9.4, 8.4], cubes: legF.map(mirrorCube) },
    { name: 'legBR', parent: 'root', pivot: [-7.4, 9.4, -13.5], cubes: legB },
    { name: 'legBL', parent: 'root', pivot: [7.4, 9.4, -13.5], cubes: legB.map(mirrorCube) },
    { name: 'body', parent: 'root', pivot: [0, 15.0, 0], cubes: [
      // the torpedo: a deep mid-body tapering back to the tail stalk
      P([-9.5, 6.5, -8.0], [19.0, 16.0, 16.0], boltP({ y0: 0.3, y1: 0.46 })),
      P([-10.2, 8.0, -7.0], [20.4, 12.6, 14.0], skin),
      P([-8.0, 8.0, -18.0], [16.0, 12.4, 10.4], boltP({ y0: 0.4, y1: 0.48, amp: 0.13, per: 7, th: 2.6 })),
      P([-7.0, 19.6, -17.0], [14.0, 1.6, 8.0], skinBack),
      P([-8.6, 5.6, -6.0], [17.2, 1.2, 12.0], skin),
      // the saw's housing: a steel guard rail the blade spins out of, two big bolts
      P([-2.0, 21.6, -11.2], [4.0, 2.4, 20.4], chromeP({ from: 0.1, to: 0.9 })),
      P([-2.6, 21.2, -12.0], [5.2, 1.4, 2.6], chromeP({ from: 0.4, to: 1 })),
      P([-2.6, 21.2, 8.0], [5.2, 1.4, 2.6], chromeP({ from: 0.4, to: 1 })),
      // the pectoral 'shoulders' the fin-legs hang from
      P([-11.4, 7.6, 3.0], [3.0, 5.0, 8.0], skin), P([8.4, 7.6, 3.0], [3.0, 5.0, 8.0], skin, { mirror: true }),
    ] },
    { name: 'saw', parent: 'body', pivot: SAW, cubes: [
      P([-0.3, SAW[1] - SAW_R, SAW[2] - SAW_R], [0, SAW_R * 2, SAW_R * 2], sawP, { plane: 'x' }),
      P([0.3, SAW[1] - SAW_R, SAW[2] - SAW_R], [0, SAW_R * 2, SAW_R * 2], sawP, { plane: 'x' }),
      P([-1.6, SAW[1] - 1.6, SAW[2] - 1.6], [3.2, 3.2, 3.2], chromeP({ from: 0.1, to: 0.9 }), { pivot: SAW, rot: [45, 0, 0] }),
    ] },
    { name: 'crackle', parent: 'body', pivot: SAW, cubes: [0, 1, 2].flatMap((f) => [
      P([-0.9, SAW[1] - SAW_R - 2, SAW[2] - SAW_R - 2], [0, SAW_R * 2 + 4, SAW_R * 2 + 4], crackP(f), { plane: 'x', glow: true, id: 'zap-' + 'abc'[f], hide: f > 0 }),
      P([0.9, SAW[1] - SAW_R - 2, SAW[2] - SAW_R - 2], [0, SAW_R * 2 + 4, SAW_R * 2 + 4], crackP(f + 3), { plane: 'x', glow: true, id: 'zap-' + 'abc'[f], hide: f > 0 }),
    ]) },
    { name: 'charge', parent: 'body', pivot: [0, 15, 0], cubes: [0, 1].flatMap((f) => [
      P([-9.56, 6.5, -8.0], [0, 16.0, 16.0], flankGlowP(f), { plane: 'x', glow: true, id: 'flank-' + f, hide: true }),
      P([9.56, 6.5, -8.0], [0, 16.0, 16.0], flankGlowP(f + 2), { plane: 'x', glow: true, id: 'flank-' + f, hide: true, mirror: true }),
    ]) },
    { name: 'head', parent: 'body', pivot: [0, 14.0, 8.0], cubes: [
      P([-8.6, 9.0, 8.0], [17.2, 13.0, 11.0], gillP),
      P([-7.0, 10.2, 18.8], [14.0, 9.6, 6.0], skinHigh),
      P([-5.0, 11.2, 24.6], [10.0, 7.2, 3.8], skinHigh),
      // hard brows over the little eyes
      P([-8.8, 18.0, 15.8], [5.2, 1.6, 3.0], browP, { pivot: [-6.2, 18.8, 17.3], rot: [0, 30, -14] }),
      P([3.6, 18.0, 15.8], [5.2, 1.6, 3.0], browP, { pivot: [6.2, 18.8, 17.3], rot: [0, -30, 14], mirror: true }),
      ...eyeStates(-1), ...eyeStates(1),
      // the upper teeth, two rows, hanging from the lip line
      P([-4.8, 9.2, 28.45], [9.6, 2.2, 0], teethP(false), { plane: 'z' }),
      P([-6.8, 8.7, 19.0], [0, 2.4, 9.4], teethP(false), { plane: 'x' }), P([6.8, 8.7, 19.0], [0, 2.4, 9.4], teethP(false), { plane: 'x' }),
      P([-4.4, 9.4, 26.6], [8.8, 1.8, 0], teethP(false, 1), { plane: 'z', outline: false }),
      P([-6.6, 9.6, 10.0], [13.2, 0.8, 18.0], gumP, { outline: false }),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 10.0, 10.0], cubes: [
      P([-6.6, 5.2, 9.0], [13.2, 4.4, 17.6], jawP),
      P([-5.6, 9.2, 10.0], [11.2, 0.6, 15.6], mouthP, { outline: false }),
      P([-4.6, 9.6, 26.4], [9.2, 1.8, 0], teethP(true), { plane: 'z' }),
      P([-5.9, 9.6, 12.0], [0, 1.8, 13.6], teethP(true), { plane: 'x' }), P([5.9, 9.6, 12.0], [0, 1.8, 13.6], teethP(true), { plane: 'x' }),
    ] },
    { name: 'tail1', parent: 'body', pivot: [0, 14.0, -18.0], cubes: [
      P([-5.0, 10.4, -27.0], [10.0, 7.0, 9.4], boltP({ base: skin, y0: 0.42, y1: 0.42, amp: 0.1, per: 5, th: 2 })),
      // the studded band
      P([-5.5, 10.0, -24.0], [11.0, 7.8, 2.2], leatherP),
    ] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 14.0, -26.5], cubes: [
      P([-1.2, 11.0, -29.6], [2.4, 6.0, 3.4], skin),
      P([0, 2.4, -38.4], [0, 25.0, 11.0], tailFinP, { plane: 'x' }),
    ] },
  ],
};

// ---------------------------------------------------------------- effects
// zap: a blue-white crackle of lightning; spray: a fan of water streaks
defineFx('zap', { w: 6, h: 13, frames: [0, 1].map((k) => (p) => { let x = 2 + k; for (let y = 0; y < 13; y++) { p.px(x, y, '#ffffff'); p.px(x + 1, y, '#a8f0ff'); if (y % 4 === 3) x += (y + k) % 8 === 3 ? 2 : -2; x = Math.max(0, Math.min(4, x)); } p.px(0, 12, '#4a9aff'); }), glow: true, life: [0.08, 0.18], size: [0.22, 0.3], speed: [0, 0.6], grav: 0, spread: 1, spin: 6, tint: [[1, 1, 1], [0.7, 0.95, 1], [0.35, 0.6, 1]] });
defineFx('spray', { w: 4, h: 9, paint: (p) => { for (let y = 0; y < 9; y++) { p.px(1, y, y < 3 ? '#ffffff' : '#bff0ff'); p.px(2, y, y < 6 ? '#8adcff' : '#4ab0f0'); } p.px(0, 2, '#e8fbff'); }, life: [0.35, 0.6], size: [0.1, 0.06], speed: [2.4, 4.4], grav: 7, drag: 0.6, spread: 0.4, spin: 2 });

// ---------------------------------------------------------------- animation
const LEGS = ['legFR', 'legFL', 'legBR', 'legBL'];
const LEGY = 9.4, BODY = [15, 0], LEGP = { legFR: [9.4, 8.4], legFL: [9.4, 8.4], legBR: [9.4, -13.5], legBL: [9.4, -13.5] };
const ABC = ['a', 'b', 'c'];
const cyc = (t, fps, n) => Math.floor(t * fps) % n;
const RIM = [0, SAW[1] + SAW_R, SAW[2]], FRONT = [0, 13, 30], MOUTH = [0, 9.6, 28];
// the saw never stops: a constant base spin from the animator's own clock (identical in every clip, so
// crossfades never fight over it) plus an optional extra spin that is wrapped at the blade's 60° symmetry
// and returns to zero offset by the end of the clip — so it can rev up and down without a visible jump
const SPIN = 420;
function sawSpin(P, c, extra = 0) { const e = ((extra % 60) + 60) % 60; P.rot('saw', -((c.time * SPIN) % 360) - e, 0, 0); }
// a rev curve: extra degrees from a smooth spin-up/spin-down across [a, b], k whole wraps
const rev = (t, a, b, k) => 60 * k * E.inout(Math.max(0, Math.min(1, (t - a) / (b - a))));
function crackle(P, t, fps = 14) { P.face('zap', ABC[cyc(t, fps, 3)]); }
// keep the feet planted while the body bobs
function plant(P, dy, legs = LEGS) { for (const l of legs) P.pos(l, 0, dy, 0).scl(l, 1, Math.max(0.4, (LEGY + dy) / LEGY), 1); }
// rotate the body about a point (0, ay, az) by rx degrees; the listed legs ride along with it
function tilt(P, rx, ay, az, ride = []) {
  const r = rx * D2R, c = Math.cos(r), s = Math.sin(r);
  const by = BODY[0] - ay, bz = BODY[1] - az;
  P.rot('body', rx, 0, 0).pos('body', 0, ay + by * c - bz * s - BODY[0], az + by * s + bz * c - BODY[1]);
  for (const l of ride) { const [py, pz] = LEGP[l], qy = py - ay, qz = pz - az; P.pos(l, 0, ay + qy * c - qz * s - py, az + qy * s + qz * c - pz).rot(l, rx, 0, 0); }
}
export const anim = {
  start: 'idle', seed: 31,
  breathe: { bone: 'body', amp: 0.012, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.0], dur: 0.1 },
  look: { bone: 'head', yaw: 20, pitch: 10, speed: 5 },
  springs: [
    { bone: 'tail1', tip: [0, 0, -8], k: 110, d: 8, gain: 0.8, max: 18, axes: [0.4, 1, 0.4] },
    { bone: 'tail2', tip: [0, 0, -8], k: 90, d: 7, gain: 1.0, max: 24, axes: [0.4, 1, 0.4] },
  ],
  faces: {
    eyes: { default: 'mean', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    zap: { default: 'a', states: { a: ['zap-a'], b: ['zap-b'], c: ['zap-c'], off: [] } },
    flank: { default: 'off', states: { off: [], a: ['flank-0'], b: ['flank-1'] } },
  },
  fidget: { every: [4.5, 8.5], clips: ['snap', 'rev'] },
  clips: {
    // a mean swagger: swaying like it's still swimming, tail sweeping, a headbang dip on every beat,
    // the jaw clacking on the off-beat, the saw spinning and spitting little crackles
    idle: { len: 1.6, loop: true, f(P, t, c) {
      sawSpin(P, c); crackle(P, t);
      const sw = wave(t, 1 / 1.6), beat = (t % 0.8) / 0.8, hit = Math.exp(-beat * 7) * (1 - Math.exp(-beat * 50));
      const dy = -0.6 * hit + 0.2 * Math.sin(beat * Math.PI);
      P.pos('body', 0, dy, 0).rot('body', 3 * hit, sw * 7, sw * 2).sq('body', -0.04 * hit); plant(P, dy);
      P.rot('head', 7 * hit, sw * 5, 0).rot('tail1', 0, -sw * 16, 0).rot('tail2', 0, -wave(t, 1 / 1.6, -0.9) * 18, 0);
      const clack = bump(t, 0.4, 0.56) + bump(t, 1.2, 1.36);
      P.rot('jaw', 16 * clack);
      for (const [l, k] of [['legFR', 1], ['legFL', -1], ['legBR', -1], ['legBL', 1]]) P.rot(l, 0, 0, k * sw * 3);
      if (wave(t, 2.3) > 0.85) P.stream('zap', 'body', RIM, { rate: 10, spread: 1, speed: 0.4 });
    } },
    // a stomping waddle on the fin-legs, the body rolling and the tail sculling behind
    walk: { len: 0.8, loop: true, f(P, t, c) {
      sawSpin(P, c); crackle(P, t);
      const ph = (t / 0.8) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph * 2), dy = -0.4 + 0.4 * c2;
      P.pos('body', 0, dy, 0).rot('body', 0, s * 6, -s * 4).sq('body', -0.03 * (1 - c2) * 0.5); plant(P, dy);
      for (const [l, k] of [['legFR', 1], ['legBL', 1], ['legFL', -1], ['legBR', -1]]) { const v = s * k; P.rot(l, -v * 26, 0, 0).pos(l, 0, Math.max(0, v) * 1.8, 0); }
      P.rot('head', 2 - 3 * c2, s * 4, 0).rot('tail1', 0, -s * 18, 0).rot('tail2', 0, -Math.sin(ph - 0.9) * 22, 0);
      P.burst(0.05, 'drop', 'legFL', [10, 0.5, 9], { n: 1, speed: 0.4 }).burst(0.45, 'drop', 'legFR', [-10, 0.5, 9], { n: 1, speed: 0.4 });
    } },
    // battle cry: rears up on the hind fins, the steel jaw drops open, the saw screams and the lightning flares
    cry: { len: 1.9, next: 'idle', f(P, t, c) {
      sawSpin(P, c, rev(t, 0.3, 1.6, 9)); crackle(P, t, 20);
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.32, 0.44, E.out)), up = seg(t, 0.34, 0.54, E.back) * (1 - seg(t, 1.25, 1.55, E.inout));
      const dy = -1.6 * crouch; P.pos('body', 0, dy, 0); plant(P, dy, ['legBR', 'legBL']);
      tilt(P, -24 * up, 9.4, -13.5, ['legFR', 'legFL']); P.rot('legFR', -30 * up, 0, 0).rot('legFL', -30 * up, 0, 0);
      P.rot('head', 10 * crouch - 18 * up + wave(t, 13) * 3 * up, 0, wave(t, 9) * 3 * up).rot('jaw', 6 * crouch + 46 * up);
      P.sq('body', -0.1 * crouch + 0.06 * up * (1 - seg(t, 0.54, 0.7)) + wob(t, 1.55, 0.05, 3, 6));
      P.rot('tail1', 0, wave(t, 6) * 14 * up, 0).rot('tail2', 0, wave(t, 6, -1) * 20 * up, 0);
      P.face('eyes', up > 0.3 ? 'glare' : undefined).face('flank', up > 0.3 ? (cyc(t, 12, 2) ? 'a' : 'b') : 'off'); P.lookW = 1 - up;
      if (t > 0.5 && t < 1.3) P.stream('zap', 'body', RIM, { rate: 40, spread: 1, speed: 0.8 }).stream('spark', 'body', RIM, { rate: 10, spread: 1, key: 's' }).stream('spray', 'head', MOUTH, { rate: 30, dir: [0, 0.4, 1], key: 'w' });
      P.burst(1.56, 'quake', 'root', [0, 0.5, 8], { n: 4, spread: 1 }).burst(1.56, 'splash', 'root', [0, 0.5, 8], { n: 10, speed: 1.2 });
    } },
    // sawblade spin-slash: crouches, leaps into a front flip that brings the screaming blade down
    // through whatever is in front of it, lands in a spray of sparks
    attack: { len: 1.5, next: 'idle', f(P, t, c) {
      sawSpin(P, c, rev(t, 0.2, 1.3, 12)); crackle(P, t, 20);
      const crouch = seg(t, 0, 0.26, E.inout) * (1 - seg(t, 0.26, 0.34, E.out));
      const flip = seg(t, 0.32, 0.78, E.inout), air = bump(t, 0.3, 0.86);
      P.pos('root', 0, 7 * air, 14 * seg(t, 0.3, 0.8, E.out) * (1 - seg(t, 1.0, 1.5, E.inout)));
      tilt(P, 360 * flip, 14, 0, LEGS);
      const land = t > 0.82 ? Math.exp(-(t - 0.82) * 7) * Math.cos((t - 0.82) * 18) : 0;
      const dy = -1.6 * crouch - 1.2 * land; P.pos('body', 0, dy, 0); plant(P, dy);
      P.sq('body', -0.1 * crouch + 0.08 * air * (1 - flip) - 0.1 * land);
      for (const l of LEGS) P.rot(l, (l[3] === 'F' ? -40 : 40) * air, 0, 0);
      P.rot('jaw', 30 * air).rot('tail1', 0, 0, 0).rot('tail2', 20 * air, 0, 0);
      P.face('eyes', t > 0.05 && t < 1.1 ? 'glare' : undefined); P.lookW = 1 - air;
      if (t > 0.3 && t < 0.86) P.stream('zap', 'saw', RIM, { rate: 30, spread: 1 });
      P.burst(0.7, 'spark', 'saw', RIM, { scale: 1.8 }).burst(0.7, 'shard', 'saw', RIM, { n: 10, speed: 1.2 }).burst(0.7, 'ring', 'saw', RIM, { scale: 0.7 }).burst(0.7, 'star', 'saw', RIM, { n: 4 });
      if (t > 0.62 && t < 0.86) P.stream('grit', 'saw', RIM, { rate: 90, dir: [0, 0.8, -1], spread: 0.6 });
      P.burst(0.84, 'splash', 'root', [0, 0.5, 0], { n: 12, speed: 1.2 }).burst(0.84, 'quake', 'root', [0, 0.5, 0], { n: 4, spread: 1 });
    } },
    // special (Hydro + Ferro, Ride the Lightning): charges up until the flank bolts blaze, then hurls the
    // whirling, crackling saw like a disc through a sheet of water; it boomerangs back into its slot
    special: { len: 2.3, next: 'idle', f(P, t, c) {
      sawSpin(P, c, rev(t, 0.0, 2.1, 30)); crackle(P, t, 24);
      const charge = seg(t, 0.0, 0.55, E.in) * (1 - seg(t, 0.62, 0.7));
      const crouch = seg(t, 0, 0.5, E.inout) * (1 - seg(t, 0.55, 0.66, E.out));
      const fling = seg(t, 0.56, 0.68, E.back) * (1 - seg(t, 0.9, 1.3, E.inout));
      P.face('flank', charge > 0.2 || (t > 1.75 && t < 1.95) ? (cyc(t, 16, 2) ? 'a' : 'b') : 'off');
      P.pos('body', 0, -1.6 * crouch, 0).rot('body', -6 * crouch + 10 * fling, wave(t, 18) * 2 * charge, wave(t, 21) * 2 * charge); plant(P, -1.6 * crouch);
      P.rot('head', 6 * crouch - 14 * fling, 0, 0).rot('jaw', 10 * charge + 24 * fling);
      P.sq('body', -0.08 * crouch + 0.06 * fling);
      // the throw: out along an arc to the target and back
      const out = seg(t, 0.6, 1.08, E.out), home = seg(t, 1.2, 1.74, E.in), d = out * (1 - home);
      P.pos('saw', 0, 6 * Math.sin(d * Math.PI * 0.5) * (1 - home * 0.6), 44 * d).pos('crackle', 0, 6 * Math.sin(d * Math.PI * 0.5) * (1 - home * 0.6), 44 * d).rot('saw', 0, 0, 12 * d);
      if (t > 0.6 && t < 1.74) { P.stream('spray', 'saw', SAW, { rate: 60, dir: [0, 0.6, -0.4], spread: 0.5 }).stream('zap', 'saw', SAW, { rate: 30, spread: 1, key: 'z' }); }
      if (t < 0.6) P.stream('zap', 'body', RIM, { rate: 20 + 80 * charge, spread: 1, speed: 0.6 }).stream('zap', 'body', [0, 15, 0], { rate: 20 * charge, spread: 1, key: 'b' });
      P.burst(1.08, 'spark', 'saw', SAW, { scale: 2 }).burst(1.08, 'zap', 'saw', SAW, { n: 10, speed: 1.4 }).burst(1.08, 'ring', 'saw', SAW, { scale: 1.1 }).burst(1.08, 'splash', 'saw', SAW, { n: 16, speed: 1.6 });
      P.burst(1.74, 'spark', 'body', [0, 22, -1], { scale: 1.2 }).burst(1.74, 'zap', 'body', RIM, { n: 6 });
      const clank = wob(t, 1.74, 1, 4, 7); P.sq('body', -0.06 * Math.max(0, clank)).rot('body', 4 * clank, 0, 0);
      P.face('eyes', t > 0.05 && t < 1.8 ? 'glare' : t > 1.8 ? 'glee' : undefined); P.lookW = 1 - crouch;
      P.rot('tail1', 0, wave(t, 7) * 10 * charge + 20 * fling, 0);
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t, c) {
      sawSpin(P, c); crackle(P, t);
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.22, 0.7, E.inout));
      P.pos('root', 0, 0, -2.6 * k).rot('body', -8 * k + wob(t, 0.2, 2, 3, 6), 0, wave(t, 15) * 4 * k).sq('body', -0.1 * k);
      P.rot('head', -16 * k, 12 * k, 8 * k).rot('jaw', 22 * k).rot('tail1', 0, 20 * k, 0);
      P.face('eyes', t < 0.45 ? 'hurt' : undefined); P.lookW = 1 - k;
      P.burst(0.02, 'spark', 'saw', RIM, { scale: 1.2 }).burst(0.02, 'zap', 'saw', RIM, { n: 4 }).burst(0.03, 'splash', 'body', [0, 16, 6], { n: 6 });
    } },
    // dazed wobble, then it keels over onto its side — the saw, of course, still spinning
    faint: { len: 2.1, next: 'down', f(P, t, c) {
      sawSpin(P, c); P.face('zap', t < 0.9 ? ABC[cyc(t, 8, 3)] : 'off');
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, 0.8, 0.95)), fall = seg(t, 0.85, 1.3, E.bounce);
      P.rot('body', 0, wave(t, 1.4) * 10 * dizzy, wave(t, 1.9) * 8 * dizzy).rot('head', 0, 0, wave(t, 1.9, 1) * 10 * dizzy);
      P.rot('root', 0, 0, -84 * fall).pos('root', 2 * fall, 9.6 * fall, 0);
      for (const l of LEGS) P.rot(l, 0, 0, (l[4] === 'R' ? 30 : -30) * fall);
      P.rot('jaw', 30 * fall).rot('tail1', 0, 14 * fall, 0);
      P.face('eyes', t < 0.85 ? 'swirl' : 'x'); P.blinkOK = false; P.lookW = 1 - Math.max(dizzy, fall);
      P.burst(1.3, 'splash', 'root', [0, 1, 0], { n: 10, spread: 1 }).burst(0.3, 'star', 'head', [0, 24, 14], { n: 5 });
    } },
    down: { len: 2.6, loop: true, f(P, t, c) {
      sawSpin(P, c); P.face('zap', 'off');
      P.rot('root', 0, 0, -84).pos('root', 2, 9.6, 0);
      for (const l of LEGS) P.rot(l, 0, 0, (l[4] === 'R' ? 30 : -30) + wave(t, 0.4) * 3);
      P.rot('jaw', 30 + wave(t, 0.38) * 3).rot('tail1', 0, 14, 0).rot('tail2', 0, wave(t, 0.6) * 6, 0);
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.4, 'bubble', 'head', MOUTH, { n: 1, speed: 0.2 }).burst(1.6, 'bubble', 'head', MOUTH, { n: 1, speed: 0.2 });
    } },
    // victory: a hop into a full spin with the saw throwing sparks, a heavy landing, two headbanging chomps
    win: { len: 2.1, next: 'idle', f(P, t, c) {
      sawSpin(P, c, rev(t, 0.1, 1.2, 10)); crackle(P, t, 18);
      const h = t < 0.9 ? hop(t, 0.9, 6, { crouch: 1.6 }) : { y: wob(t, 0.9, -1.2, 3, 6), sq: wob(t, 0.9, -0.14, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq).rot('root', 0, 360 * seg(t, 0.2, 0.68, E.inout), 0);
      if (h.y < 0) plant(P, h.y);
      if (t > 0.2 && t < 0.7) P.stream('spark', 'saw', RIM, { rate: 30, spread: 1 });
      const chomp = t > 1.1 ? Math.max(0, Math.sin((t - 1.1) * Math.PI * 2 * 1.6)) * (1 - seg(t, 1.9, 2.1)) : 0;
      P.rot('head', 16 * chomp - 4, 0, 0).rot('jaw', 34 * chomp).rot('body', 4 * chomp, 0, 0);
      P.face('eyes', t > 1.0 ? 'glee' : undefined);
      P.burst(0.9, 'splash', 'root', [0, 0.5, 0], { n: 12, speed: 1.2 }).burst(0.9, 'ring', 'root', [0, 0.6, 0], { scale: 0.9 });
      P.burst(1.3, 'note', 'head', [-6, 26, 14], {}).burst(1.6, 'note', 'head', [6, 26, 14], {});
      P.rot('tail1', 0, wave(t, 3) * 14, 0);
    } },
    // asleep: belly down, fins splayed, gills fluttering, bubbles — and the saw turning slowly over its back
    sleep: { len: 3.4, loop: true, f(P, t, c) {
      sawSpin(P, c); P.face('zap', cyc(t, 3, 4) === 0 ? 'a' : 'off');
      const br = Math.sin((t / 3.4) * Math.PI * 2);
      P.pos('body', 0, -4.2 + br * 0.3, 0).sq('body', -0.03 + br * 0.03);
      for (const l of LEGS) P.pos(l, 0, -4, 0).rot(l, 0, 0, (l[4] === 'R' ? -40 : 40));
      P.rot('head', 8 + br * 2, 0, 0).rot('jaw', 3 + Math.max(0, br) * 5).rot('tail1', 0, 10, 0).rot('tail2', 0, wave(t, 0.3) * 8, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [6, 26, 14], {}).burst(2.1, 'z', 'head', [6, 26, 14], {});
      P.burst(1.0, 'bubble', 'head', MOUTH, { n: 1, speed: 0.2 }).burst(2.6, 'bubble', 'head', MOUTH, { n: 2, speed: 0.2 });
    } },
    // fidget: bubbles drift past its nose; it eyes them, then snaps them out of the air, clack-clack-CLACK
    snap: { len: 2.2, next: 'idle', f(P, t, c) {
      sawSpin(P, c); crackle(P, t);
      P.burst(0.05, 'bubble', 'root', [3, 14, 30], { n: 3, dir: [0, 1, 0], speed: 0.3 });
      const track = seg(t, 0.1, 0.6, E.inout) * (1 - seg(t, 1.6, 2.0));
      P.rot('head', -12 * track, 10 * track * (1 - seg(t, 0.8, 1.0)), 0); P.lookW = 1 - track;
      for (const [s0, k] of [[0.9, 0.7], [1.15, 0.7], [1.42, 1]]) { const b = bump(t, s0, s0 + 0.18); P.rot('jaw', 40 * b * k).rot('head', 10 * b * k, 0, 0).pos('body', 0, 0, 1.2 * b * k); }
      P.burst(1.5, 'splash', 'head', MOUTH, { n: 6, speed: 0.8 });
      P.face('eyes', t > 0.1 && t < 0.85 ? 'glare' : t > 1.55 ? 'glee' : undefined);
      P.rot('tail1', 0, wave(t, 2.4) * 12, 0);
    } },
    // fidget: revs the saw like an engine — three blips, sparks and crackle, a smug little bob
    rev: { len: 1.8, next: 'idle', f(P, t, c) {
      sawSpin(P, c, rev(t, 0.1, 0.5, 3) + rev(t, 0.55, 0.95, 3) + rev(t, 1.0, 1.6, 6)); crackle(P, t, 22);
      for (const s0 of [0.1, 0.55, 1.0]) { const b = bump(t, s0, s0 + 0.35); P.sq('body', 0.04 * b).rot('body', -3 * b, 0, 0); P.burst(s0 + 0.15, 'spark', 'saw', RIM, {}).burst(s0 + 0.15, 'zap', 'saw', RIM, { n: 3 }); }
      if (t > 1.0 && t < 1.5) P.stream('grit', 'saw', RIM, { rate: 50, dir: [0, 1, -0.6], spread: 0.5 });
      const smug = seg(t, 1.3, 1.5) * (1 - seg(t, 1.6, 1.8));
      P.face('eyes', t > 1.25 ? 'glee' : undefined).rot('head', -6 * smug, 0, 4 * smug);
      P.rot('tail1', 0, wave(t, 2) * 10, 0);
    } },
  },
};
def.anim = anim;
