// The three starters as hand-pixel art (see src/px/pixmon.js for the painter).
// Views are drawn facing left; the game mirrors them for the other side.
import { FX } from '../../px/pixmon.js';

// ================================================================== CHILICHICK
// A small, fat, furious fire chick. It bit a chili pepper it knew was too hot and
// now it is screaming about it: white glaring eyes with angry lids, tears streaming,
// a wide-open hooked beak, a crest of flame tongues (no comb), ruffled feathers.
// The pepper — bitten, seeds showing — never leaves its wing.
const CHILI_PAL = {
  body: { ramp: ['#ffd256', '#ff9c2c', '#e8622a', '#b23a24'], line: '#3e120e', lineLit: '#8a2c18' },
  belly: { ramp: ['#fff0b8', '#ffd47a', '#f6a650', '#d87a3a'], line: '#3e120e' },
  wing: { ramp: ['#ffb84a', '#f2842a', '#cf5226', '#9a3220'], line: '#3e120e', lineLit: '#7a2416' },
  feet: { ramp: ['#ffb468', '#e8803a', '#bc5a2c', '#863822'], line: '#2e0e0a' },
  beak: { ramp: ['#ffe68e', '#ffb43a', '#e2782a', '#a84a20'], line: '#2e0e08', lineLit: '#7a3a14', th: [0.62, 0.3, 0.02] },
  mouth: { ramp: ['#8a1c26', '#6a1020', '#4a0a18', '#300610'], line: '#2e0e08', flat: true },
  chili: { ramp: ['#ff8a7a', '#e8363e', '#b4203a', '#781334'], line: '#3c0c1c', lineLit: '#6e1430', gloss: true, spec: 0.95, specC: '#ffd6cc' },
  flesh: { ramp: ['#fff6d0', '#ffe2a0', '#f6c070', '#d89a50'], line: '#3c0c1c', flat: true },
  leaf: { ramp: ['#d2f070', '#80c64a', '#3f8e3a', '#245c2e'], line: '#16301a' },
  crest: { ramp: ['#fff6c8', '#ffd040', '#ff7c22', '#e23c1e'], line: '#5a120e', lineLit: '#a42a18', th: [0.8, 0.5, 0.18], inner: '#c84a22' },
};
// angry eyes, Pokémon-style: white with a dot pupil under a hard slanted lid (facing left)
const K = '#1e0a0c', WH = '#ffffff';
const EYE = {   // [near eye 8×6, far eye 4×4]
  open: [['.......kk', '.....kkkk', '..kkkkWWk', 'kkkWWWWWk', '.kWppWWWk', '.kWppWWk.', '..kkkkk..'], ['kk..', '.kkk', 'kWpk', '.kkk']],
  fierce: [['......kkk', '...kkkkkk', 'kkkkkkWWk', '.kpWWWWWk', '.kkWWWWk.', '..kkkkk..'], ['kk..', '.kkk', 'kpkk']],
  closed: [['.......kk', '.....kkkk', '..kkkk...', 'kkk......', '.kkkkkkk.'], ['kk..', '.kkk', '..kk']],
  sleep: [['.......kk', '....kkk..', '.........', '.........', 'kkkkkkkk.'], ['kk..', '..kk']],
  happy: [['.......kk', '.....kkkk', '..kkkkkkk', 'kkkkkkkkk', '.kWWWWWk.', '..kkkkk..'], ['kk..', '.kkk', '.kWk']],
  hurt: [['k.......k', '.kk...kk.', '...kkk...', '.kk...kk.', 'k.......k'], ['k..k', '.kk.', 'k..k']],
  ko: [['.kkkkkkk.', 'kWkWWWkWk', 'kWWkWkWWk', 'kWWWkWWWk', 'kWWkWkWWk', '.kkkkkkk.'], ['kkk', 'kWk', 'kkk']],
};
const EYEMAP = { k: K, W: WH, p: K };

// a chili pepper: pod from the stem end to the tip, calyx and curly stem; `bitten` cuts the tip open
function chiliPod(P, pts, o = {}) {
  P.tube(pts, 'chili', { grp: o.grp || 'chili', round: 3 });
  const [sx, sy] = pts[0], dx = pts[0][0] - pts[1][0], dy = pts[0][1] - pts[1][1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  for (let k = 1; k < Math.min(3, pts.length - 1); k++) { const [x, y, r] = pts[k]; P.px(x - 1, y - r + 1.4, '#ffd0c4'); P.px(x, y - r + 1.4, '#fff0ea'); }
  if (o.bitten) {   // the bitten end: pale flesh and seeds
    const [tx, ty, tr] = pts[pts.length - 1];
    P.ell(tx, ty, tr + 0.4, tr + 0.4, 'flesh', { grp: (o.grp || 'chili') + 'b' });
    P.px(tx, ty, '#e8b84a'); P.px(tx - 1, ty + 1, '#e8b84a'); P.px(tx + 1, ty - 1, '#fff8e0');
  }
  const cx = sx + ux * 2, cy = sy + uy * 2;
  P.poly([[cx - uy * 4, cy + ux * 4], [cx + ux * 3, cy + uy * 3], [cx + uy * 4, cy - ux * 4], [cx + ux, cy + uy]], 'leaf', { grp: 'calyx', round: 2 });
  P.tube([[cx + ux * 2, cy + uy * 2, 1.2], [cx + ux * 4, cy + uy * 4 + 1, 1], [cx + ux * 4 + 2, cy + uy * 4 + 3, 0.8]], 'leaf', { grp: 'calyx', round: 1 });
}

// the beak, built from two shaded mandibles; open: 0 shut, 1 shouting, 2 screaming
function beak(P, bx, by, open) {
  const o = open || 0, lo = o * 2.6;
  if (o) {
    P.poly([[bx + 2, by + 1], [bx - 8, by + 1], [bx - 6, by + 2 + lo], [bx + 2, by + 3 + lo * 0.6]], 'mouth', { grp: 'mouth' });
    P.ell(bx - 2, by + 2 + lo * 0.7, 2.6, 1.2 + o * 0.4, 'mouth', { grp: 'mouth', flat: true });
    P.stamp(bx - 4, by + 1 + Math.round(lo * 0.8), ['.tt.', 'tttt'], { t: '#ff6a7a' }, { on: true });   // tongue
  }
  // lower mandible (behind the upper one)
  P.poly([[bx + 2, by + 1 + lo * 0.5], [bx - 6, by + 1.5 + lo], [bx - 5, by + 3 + lo], [bx + 2, by + 4 + lo * 0.6]], 'beak', { grp: 'beakL', round: 2, lit: -0.12 });
  // upper mandible: a strong hooked beak
  P.poly([[bx + 2, by - 4], [bx - 3, by - 2.5], [bx - 8, by - 0.5], [bx - 10, by + 1.5], [bx - 8.5, by + 1.6], [bx + 2, by + 1.2]], 'beak', { grp: 'beakU', round: 2 });
  P.px(bx - 1, by - 2, '#fff6c0'); P.px(bx - 3, by - 1, '#fff6c0'); P.px(bx + 0, by - 3, '#ffe68e');       // ridge highlight
  P.px(bx - 2, by - 1, '#7a3a14');                                                                        // nostril
}

function chilichick(P, m) {
  const back = m.view === 'back', sq = m.sq, rx = 15 + sq, ry = 13 - sq;
  const idle = m.clip === 'idle' || m.clip === 'walk' || m.clip === 'run';
  const shake = m.clip === 'idle' && (m.ph >> 1) % 2 ? 1 : 0;              // shaking with rage
  const lean = 1 + m.lean + (m.tilt ? Math.round(m.tilt * 2) : 0);
  const X = 40 + m.dx + shake, base = 60 + m.bob, cy = base - ry, top = cy - ry;
  const fx = X - lean;
  const fl = (m.ph >> 1) % 3;
  const mouth = m.mouth || (idle ? ((m.ph >> 3) % 3 === 0 ? 2 : 1) : m.clip === 'sleep' ? 0 : 1);
  // ---- crest: sharp flame tongues swept back; a tail flame
  const crest = () => {
    P.flame(fx + 9, top + 4, 12 + (fl === 0 ? 2 : 0), 4.4, 9 - (fl === 1 ? 2 : 0), 'crest', { grp: 'crest', glow: true, round: 3 });
    P.flame(fx + 2, top + 3, 15 + (fl === 1 ? 2 : 0), 5.2, 6 - (fl === 2 ? 1 : 0), 'crest', { grp: 'crest', glow: true, round: 3 });
    P.flame(fx - 3, top + 2, 9 + (fl === 2 ? 2 : 0), 3.6, 4, 'crest', { grp: 'crest', glow: true, round: 2.5 });
  };
  const tail = () => back ? P.flame(X + 1, base - 3, 11 + (fl === 1 ? 1 : 0), 4.2, 3, 'crest', { grp: 'tail', glow: true, round: 2.5 })
    : P.flame(X + 14, cy + 1, 12 + (fl === 1 ? 2 : 0), 4.2, 10, 'crest', { grp: 'tail', glow: true, round: 2.5 });
  // ---- feet with dark talons
  const feet = () => {
    const nearUp = m.step > 0 ? 2 : 0, farUp = m.step < 0 ? 2 : 0;
    P.ell(X - 6, base + 1.5 - farUp, 3.4, 2, 'feet', { grp: 'footF' });
    P.ell(X + 5, base + 2 - nearUp, 3.8, 2.2, 'feet', { grp: 'footN' });
    if (!back) { P.stamp(X - 11, base + 2 - farUp, ['c.c.c'], { c: '#2e0e0a' }, { mat: 'feet', grp: 'footF' }); P.stamp(X, base + 3 - nearUp, ['c.c.c'], { c: '#2e0e0a' }, { mat: 'feet', grp: 'footN' }); }
  };
  // ---- the pepper in the near wing (stem in the wing, bitten tip toward the beak)
  const pepper = () => {
    if (m.arm === 2 || m.arm === 3) return;
    if (m.arm === 1) chiliPod(P, [[X + 8, top - 1, 2.4], [X + 3, top - 4, 3.2], [X - 3, top - 6, 3], [X - 7, top - 7, 2.2]], { bitten: true });
    else if (m.arm === 4) chiliPod(P, [[X + 1, cy + 8, 2.4], [X - 3, cy + 5, 3.2], [X - 7, cy + 2, 3], [X - 10, cy, 2.2]], { bitten: true });
    else chiliPod(P, [[X + 4, cy + 6, 2.6], [X - 1, cy + 7.5, 3.6], [X - 7, cy + 9.5, 3.5], [X - 12, cy + 11, 2.8], [X - 15, cy + 12, 2.2]], { bitten: true });
  };
  const wings = () => {
    const W = {
      0: [[X + 7, cy + 7, 4.4, 6, -0.9], [X - 12, cy + 2, 3.4, 5.6, 0.2]],
      1: [[X + 9, top + 1, 4.2, 6.5, -2.4], [X - 12, top + 3, 3.4, 6, 2.4]],
      2: [[X - 8, cy + 1, 4.4, 6.5, 1.3], [X - 14, cy + 1, 3.4, 5.5, 1.1]],
      3: [[X + 5, cy + 7, 4.4, 6.5, -0.5], [X - 12, cy + 5, 3.4, 5, 0.4]],
      4: [[X + 1, cy + 8, 4.4, 6.2, -1.3], [X - 12, cy + 6, 3.4, 5, 0.6]],
    }[m.arm] || [];
    const [nw, fw] = W;
    const flap = idle && fw ? ((m.ph >> 2) % 2 ? -2 : 0) : 0;                 // the far wing shakes a fist
    if (fw) P.ell(fw[0], fw[1] + flap, fw[2], fw[3], 'wing', { rot: fw[4] + flap * 0.15, grp: 'wingF' });
    if (nw) {
      P.ell(nw[0], nw[1], nw[2], nw[3], 'wing', { rot: nw[4], grp: 'wingN' });
      const c = Math.cos(nw[4]), sn = Math.sin(nw[4]);
      for (const u of [-0.5, 0, 0.5]) { const lx = nw[0] + (-sn) * nw[3] * 0.85 + c * nw[2] * u * 1.3, ly = nw[1] + c * nw[3] * 0.85 + sn * nw[2] * u * 1.3; P.px(lx, ly, '#9a3220'); P.px(lx + 1, ly + 1, '#9a3220'); }
    }
  };
  const face = () => {
    const ex = m.eyes === 'open' && idle ? 'open' : m.eyes, e = EYE[ex] || EYE.open;
    const nx = fx - 9, ny = cy - 11, farX = fx - 16, farY = cy - 8;
    P.stamp(nx, ny, e[0], EYEMAP, { on: true });
    P.stamp(farX, farY, e[1], EYEMAP, { on: true });
    // tears: streams down the cheek, drops flung back while it screams
    if (ex !== 'ko' && ex !== 'sleep') {
      const ph = m.ph, wet = '#c8f0ff', tear = '#6ac8ff';
      for (let k = 0; k < 6; k++) { const y = ny + 7 + k, x = nx + 4 + Math.round(k * 0.4); P.px(x, y, (k + ph) % 3 ? tear : wet); P.px(x + 1, y, wet); }
      for (let k = 0; k < 5; k++) { const y = ny + 6 + k, x = nx + 7 + Math.round(k * 0.6); P.px(x, y, (k + ph + 1) % 3 ? tear : wet); }
      if (mouth >= 1) for (let k = 0; k < 3; k++) { const t = ((ph * 0.35 + k / 3) % 1); P.dot(nx + 9 + t * 12, ny + 2 - Math.sin(t * Math.PI) * 6 + k * 2, k % 2 ? tear : wet, 'water'); }
      P.stamp(farX - 1, farY + 3, ['w', 't', 'w'], { w: wet, t: tear }, { on: true });
    }
    beak(P, fx - 10, cy - 1, mouth);
  };

  if (!back) {
    tail(); feet();
    P.ell(X - Math.round(lean / 2), cy, rx, ry, 'body', { grp: 'body', rot: lean * 0.05 });
    // ruffled, spiky feather edges (back of the head, cheek, chest)
    P.poly([[X + 11, cy - 9], [X + 19, cy - 7], [X + 14, cy - 5], [X + 19, cy - 2], [X + 13, cy - 1]], 'body', { grp: 'body', round: 2 });
    P.poly([[X - 13, cy + 3], [X - 18, cy + 5], [X - 13, cy + 7], [X - 16, cy + 9], [X - 11, cy + 9]], 'body', { grp: 'body', round: 2 });
    P.poly([[X + 13, cy + 5], [X + 18, cy + 8], [X + 12, cy + 9]], 'body', { grp: 'body', round: 2 });
    P.ell(X - 3 - lean, cy + 6, 9, 6.5, 'belly', { paint: true, grp: 'body' });
    for (const [dx, dy] of [[-6, 3], [-1, 4], [4, 3], [-4, 8], [1, 9]]) { P.px(X - lean + dx, cy + dy, '#f6a650'); P.px(X - lean + dx + 1, cy + dy + 1, '#f6a650'); }   // feather scallops
    crest(); wings(); pepper();
    // the near wing's tip wraps over the stem
    if (m.arm === 0) P.ell(X + 5, cy + 6, 2.8, 2.4, 'wing', { grp: 'wingTip' });
    face();
  } else {
    feet();
    P.ell(X, cy, rx, ry, 'body', { grp: 'body' });
    P.poly([[X - 13, cy - 6], [X - 19, cy - 3], [X - 13, cy]], 'body', { grp: 'body', round: 2 }); P.poly([[X + 13, cy - 6], [X + 19, cy - 3], [X + 13, cy]], 'body', { grp: 'body', round: 2 });
    P.ell(X, cy - 3, 11, 8, 'wing', { paint: true, grp: 'body' });
    for (const [dx, dy] of [[-5, -2], [0, -4], [5, -2], [-3, 3], [3, 3]]) { P.px(X + dx, cy + dy, '#9a3220'); P.px(X + dx + 1, cy + dy + 1, '#9a3220'); P.px(X + dx - 1, cy + dy + 1, '#9a3220'); }
    if (m.arm === 0 || m.arm === 4) P.tube([[X - 15, cy + 7, 2.4], [X - 19, cy + 4, 1.6]], 'chili', { grp: 'chili' });
    if (m.arm === 1) chiliPod(P, [[X + 8, top - 1, 2.4], [X + 3, top - 4, 3.2], [X - 3, top - 6, 3], [X - 7, top - 7, 2.2]], { bitten: true });
    P.ell(X - 15, cy + 4, 3.4, 5.6, 'wing', { rot: 0.3, grp: 'wingF' }); P.ell(X + 15, cy + 4, 3.4, 5.6, 'wing', { rot: -0.3, grp: 'wingN' });
    crest(); tail();
  }
  // ---- effects
  if (m.fx.has('breath')) FX.breath(P, fx - 19, cy + 1, m, 'fire');
  if (m.fx.has('toss')) { const t = m.k, x = X - 18 - t * 34, y = cy - 6 - Math.sin(t * Math.PI) * 14; chiliPod(P, [[x + 5, y - 2, 2.2], [x, y, 2.8], [x - 4, y + 2, 1.8]], { grp: 'fly', bitten: true }); }
  if (m.fx.has('dash')) { FX.dash(P, X + 16, cy, m); P.flame(X + 17, cy + 6, 6, 2.6, 7, 'fire', { glow: true, round: 2, grp: 'fx-dash' }); }
  if (m.fx.has('swipe')) FX.swipe(P, fx - 20, cy);
  if (m.fx.has('hit')) FX.hit(P, X + 2, cy - 4, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X, cy + 2, rx + 5, ry + 3, m, '#ff8a2a');
  if (m.fx.has('sparkle')) FX.aura(P, X, cy, rx + 3, ry + 2, m, '#ffcf3a');
  if (m.fx.has('zz')) FX.zz(P, X + 10, top - 2, m);
  if (m.fx.has('steam') || m.clip === 'idle') for (let k = 0; k < 3; k++) {   // heat steaming off its head
    const t = (m.t * 3 + k / 3) % 1, x = fx - 2 + k * 6 + Math.round(Math.sin(t * 7 + k) * 1.5), y = top - 4 - Math.round(t * 12);
    if (t < 0.8) { P.dot(x, y, '#ffffff', 'steam'); P.dot(x + 1, y - 1, '#e8ecf4', 'steam'); if (t > 0.3) P.dot(x - 1, y - 2, '#e8ecf4', 'steam'); }
  }
  if (m.fx.has('hearts')) FX.hearts(P, X + 12, top, m);
  if (m.fx.has('bond')) FX.aura(P, X, cy + 2, rx + 6, ry + 4, m, '#7af0ff');
}

// ================================================================== BUBBLION
// A little lionfish prince riding in a ball of water: a mane of striped fin rays
// fans out behind his face, venom spines rise from his back, a gold crown, pouty
// lips. The ball wobbles, bobs and squashes as he swims.
const BUB_PAL = {
  water: { ramp: ['#d2f6ff', '#86d6f6', '#58aee8', '#3f7fd2'], line: '#1a2a62', lineLit: '#3a64a8', th: [0.7, 0.36, 0.06], inner: '#2e5aa8' },
  fishW: { ramp: ['#fffaf0', '#ffe6cc', '#f6bea0', '#d88a7e'], line: '#4a1622', lineLit: '#8a3a3a' },
  fishR: { ramp: ['#ff9a7a', '#e8504a', '#b8303e', '#802036'], line: '#4a1622' },
  fin: { ramp: ['#ffe2d0', '#ffc0a4', '#f08e7c', '#c8606a'], line: '#5a1e2c', lineLit: '#9a4a4a', th: [0.6, 0.3, 0.0] },
  ray: { ramp: ['#ff8a6a', '#d8403e', '#a82c3a', '#7a1e34'], line: '#4a1622', flat: true },
  rayW: { ramp: ['#ffffff', '#fff2e6', '#f0d0c0', '#d0a8a0'], line: '#4a1622', flat: true },
  gold: { ramp: ['#fff6a8', '#ffd23e', '#e49a24', '#ae641c'], line: '#4a2810', lineLit: '#8a5418', gloss: true, spec: 0.9 },
  lips: { ramp: ['#ffd8d8', '#ff9aa2', '#e0687c', '#b04a62'], line: '#4a1622' },
};
const BEYE = {   // smug and half-lidded: a proud little king, never cute
  open: ['.kkkkk.', 'kkkkkkk', 'kWppWWk', 'kWppWk.', '.kkkk..'],
  fierce: ['kk.....', '.kkkkkk', 'kkWppWk', '.kWppk.', '..kkk..'],
  closed: ['.kkkkk.', 'kkkkkkk', '.kkkkk.'],
  sleep: ['.......', 'kkkkkkk', '.kkkkk.'],
  happy: ['.kkkkk.', 'kkkkkkk', 'kWWWWWk', '.kkkkk.'],
  hurt: ['k.....k', '.kk.kk.', '...k...', '.kk.kk.', 'k.....k'],
  ko: ['.kkkkk.', 'kWkWkWk', 'kWWkWWk', 'kWkWkWk', '.kkkkk.'],
};
const BEYEMAP = { k: '#24101c', W: '#ffffff', p: '#24101c' };
function bubblion(P, m) {
  const back = m.view === 'back', sq = m.sq, R = 21;
  const BX = 40 + m.dx, BY = 37 + m.bob + Math.round(Math.sin(m.t * Math.PI * 2) * (m.clip === 'idle' ? 1 : 0)) + (m.tilt ? Math.round(m.tilt * 4) : 0);
  const rx = R + sq, ry = R - sq - (m.tilt ? Math.round(m.tilt * 3) : 0), by = BY + (R - ry);
  const sway = Math.sin(m.t * Math.PI * 2 * (m.clip === 'idle' ? 1 : 2)), fl = (m.ph >> 1) % 2;
  const fx = BX - 2 - m.lean * 2, fy = by + 2;                 // the fish leans inside the ball when it lunges
  // ---- the ball of water (behind the fish)
  P.ell(BX, by, rx, ry, 'water', { grp: 'ball', rz: R * 0.8 });
  // caustic light ripples on the far wall
  for (let k = 0; k < 3; k++) { const y = by - 12 + k * 9 + ((m.ph >> 2) + k) % 3; for (let x = -10; x <= 10; x += 2) P.px(BX + 4 + x + (k % 2), y + Math.round(Math.sin((x + m.ph * 0.5) * 0.5) * 1.2), '#b8ecff'); }
  const ray = (cx, cy, a, len, k, w = 1.3) => P.tube([[cx, cy, w], [cx + Math.cos(a) * len, cy + Math.sin(a) * len, 0.6]], k % 2 ? 'rayW' : 'ray', { grp: 'mane', z: undefined });
  if (!back) {
    // ---- mane: striped pectoral fans behind the face, venom spines over the back, the tail
    const mx = fx - 5, my = fy + 1;
    const fan = []; for (let a = -1.45; a <= 1.46; a += 0.18) fan.push([mx + Math.cos(a + sway * 0.06) * 14.5, my + Math.sin(a + sway * 0.06) * 13]);
    P.poly([[mx, my], ...fan], 'fin', { grp: 'mane', round: 3 });
    for (let k = 0, a = -1.4; a <= 1.42; a += 0.2, k++) ray(mx, my, a + sway * 0.06, 14 + (k % 2), k);
    for (let k = 0, a = -1.4; a <= 1.42; a += 0.4, k++) P.px(mx + Math.cos(a + sway * 0.06) * 15, my + Math.sin(a + sway * 0.06) * 13.6, '#fff2e6');
    // tail fan
    const tx = fx + 11, ty = fy + 2, tw = sway * 2;
    P.poly([[tx, ty - 1], [tx + 9, ty - 7 + tw], [tx + 11, ty + tw * 0.5], [tx + 9, ty + 7 + tw], [tx, ty + 1]], 'fin', { grp: 'tail', round: 2 });
    for (let k = -2; k <= 2; k++) P.line(tx + 1, ty, tx + 10, ty + k * 3 + tw * (1 - Math.abs(k) / 3), k % 2 ? '#e8504a' : '#fff2e6');
    // body + head (one rounded shape), with lionfish bands
    P.ell(fx + 3, fy + 2, 10, 7, 'fishW', { grp: 'body' });
    P.circ(fx - 6, fy, 8, 'fishW', { grp: 'body' });
    for (const sx of [-2, 2, 6, 10]) P.poly([[fx + sx, fy - 9], [fx + sx + 2, fy - 9], [fx + sx + 3, fy + 10], [fx + sx + 1, fy + 10]], 'fishR', { paint: true, grp: 'body' });
    P.poly([[fx - 9, fy - 9], [fx - 7, fy - 9], [fx - 6, fy + 9], [fx - 8, fy + 9]], 'fishR', { paint: true, grp: 'body' });     // band behind the eye
    // venom spines over the back
    for (let k = 0; k < 5; k++) { const bx = fx - 3 + k * 3.4, a = -1.75 + k * 0.17 + sway * 0.05; ray(bx, fy - 5, a, 12 - k * 1.2, k, 1.1); }
    // crown
    const cx = fx - 8, cyy = fy - 9;
    P.poly([[cx - 4, cyy + 3], [cx - 5, cyy - 3], [cx - 2, cyy], [cx, cyy - 5], [cx + 2, cyy], [cx + 5, cyy - 3], [cx + 4, cyy + 3]], 'gold', { grp: 'crown', round: 2 });
    P.stamp(cx - 1, cyy - 1, ['gG', 'GG'], { g: '#bff4ff', G: '#2a8ae0' }, { on: true }); P.px(cx - 5, cyy - 4, '#fff6a8'); P.px(cx + 5, cyy - 4, '#fff6a8'); P.px(cx, cyy - 6, '#fff6a8');
    // face: brow tabs, eye, pouty lips
    P.tube([[fx - 10, fy - 6, 1], [fx - 12, fy - 9, 0.6]], 'fishR', { grp: 'tab' });
    const e = BEYE[m.eyes] || BEYE.open;
    P.stamp(fx - 13, fy - 5 + (m.eyes === 'happy' ? 1 : 0), e, BEYEMAP, { on: true });
    const lx = fx - 15, ly = fy + 3;
    if (m.mouth) P.stamp(lx - 1, ly - 1, ['.pp.', 'pkkp', 'pkkp', '.pp.'], { p: '#ff9aa2', k: '#5a1424' }, { mat: 'lips', grp: 'lips' });
    else P.stamp(lx - 1, ly - 1, ['.pP', 'ppP', 'dpP', '.pP'], { p: '#ff9aa2', P: '#e0687c', d: '#7a2a3a' }, { mat: 'lips', grp: 'lips' });
  } else {
    // from behind: spines up top, mane fans either side, tail toward us
    for (const sgn of [-1, 1]) { const mx = fx + 2 + sgn * 2, my = fy + 1; const fan = []; for (let a = -1.2; a <= 1.2; a += 0.2) fan.push([mx + sgn * Math.cos(a) * 14, my + Math.sin(a) * 12]); P.poly([[mx, my], ...fan], 'fin', { grp: 'mane', round: 3 }); for (let k = 0, a = -1.1; a <= 1.12; a += 0.22, k++) ray(mx, my, sgn > 0 ? a : Math.PI - a, 13, k); }
    P.ell(fx + 2, fy + 1, 9, 8, 'fishW', { grp: 'body' });
    for (const sx of [-5, -1, 3, 7]) P.poly([[fx + sx, fy - 8], [fx + sx + 2, fy - 8], [fx + sx + 2, fy + 9], [fx + sx, fy + 9]], 'fishR', { paint: true, grp: 'body' });
    for (let k = 0; k < 5; k++) ray(fx - 4 + k * 3, fy - 6, -1.57 + (k - 2) * 0.2, 11, k, 1.1);
    P.poly([[fx - 2, fy - 8], [fx - 4, fy - 13], [fx, fy - 10], [fx + 2, fy - 15], [fx + 4, fy - 10], [fx + 8, fy - 13], [fx + 6, fy - 8]], 'gold', { grp: 'crown', round: 2 });
    const tw = sway * 2; P.poly([[fx + 1, fy + 6], [fx - 6 + tw, fy + 15], [fx + 2, fy + 13], [fx + 10 + tw, fy + 15], [fx + 3, fy + 6]], 'fin', { grp: 'tail', round: 2 });
  }
  // ---- glass: highlight arc, glint, reflected rim light, bubbles
  for (let a = 3.6; a < 4.75; a += 0.05) P.px(BX + Math.cos(a) * (rx - 3), by + Math.sin(a) * (ry - 3), '#ffffff');
  for (let a = 3.8; a < 4.5; a += 0.06) P.px(BX + Math.cos(a) * (rx - 4), by + Math.sin(a) * (ry - 4), '#e6faff');
  P.stamp(BX - 13, by - 11, ['.W', 'WW'], { W: '#ffffff' }, { on: true });
  for (let a = 0.25; a < 1.35; a += 0.05) P.px(BX + Math.cos(a) * (rx - 2), by + Math.sin(a) * (ry - 2), '#a8e6ff');
  for (let k = 0; k < 4; k++) { const t = (m.t * (m.clip === 'idle' ? 1 : 2) + k / 4) % 1, x = BX + [9, -4, 13, 3][k] + Math.round(Math.sin(t * 9 + k) * 1), y = by + 14 - Math.round(t * 26); if (Math.hypot(x - BX, y - by) < R - 4) P.stamp(x - 1, y - 1, k % 2 ? ['.o.', 'oWo', '.o.'] : ['oW', 'oo'], { o: '#e6faff', W: '#ffffff' }, { on: true }); }
  // ---- effects
  if (m.fx.has('breath')) FX.breath(P, BX - rx + 2, by + 2, m, 'water');
  if (m.fx.has('dash')) FX.dash(P, BX + rx - 1, by, m);
  if (m.fx.has('swipe')) FX.swipe(P, BX - rx - 2, by);
  if (m.fx.has('hit')) FX.hit(P, BX + 4, by - 8, m);
  if (m.fx.has('toss')) { const t = m.k; FX.bubble(P, BX - rx - 4 - t * 24, by - Math.sin(t * Math.PI) * 10, 3); }
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, BX, by, rx + 4, ry + 2, m, '#7ad8ff');
  if (m.fx.has('sparkle')) FX.sparkle(P, BX, by, m, '#c8f4ff');
  if (m.fx.has('zz')) FX.zz(P, BX + 12, by - ry - 2, m);
  if (m.fx.has('steam')) FX.steam(P, BX, by - ry - 4, m);
  if (m.fx.has('hearts')) FX.hearts(P, BX + 14, by - ry, m);
  if (m.fx.has('bond')) FX.aura(P, BX, by, rx + 5, ry + 3, m, '#7af0ff');
}

// ================================================================== STRAWBAA
// A strawberry sheep, the healer: wool like a ripe strawberry (red puffs studded
// with golden seeds), a leafy calyx cap with a curly stem, little curled horns,
// a soft cream face, stubby plum legs.
const STRAW_PAL = {
  wool: { ramp: ['#ffa2aa', '#f04a5a', '#c42e48', '#8a1c3c'], line: '#3c0a20', lineLit: '#7a1a36', th: [0.66, 0.34, 0.04], inner: '#8a1c3c' },
  face: { ramp: ['#fffaf2', '#ffe8d6', '#f2c0aa', '#d4908a'], line: '#4a2030', lineLit: '#9a5a5a' },
  ear: { ramp: ['#fff2e6', '#ffd6c4', '#eaa49a', '#c4787c'], line: '#4a2030' },
  horn: { ramp: ['#fffbe8', '#f6e2bc', '#d8b48e', '#a8846e'], line: '#4a2a2a' },
  leaf: { ramp: ['#d2f070', '#80c64a', '#3f8e3a', '#245c2e'], line: '#16301a', lineLit: '#2a5a26' },
  leg: { ramp: ['#a87a8a', '#7a4a5e', '#5a3248', '#3e2236'], line: '#22101c' },
};
const SEYE = {   // calm and steady: white with a dot pupil under a firm lid
  open: [['.kkkk', 'kkkkk', 'kWpWk', 'kWWWk', '.kkk.'], ['kkk', 'kpk', '.k.']],
  fierce: [['kk...', '.kkkk', 'kWpWk', '.kkk.'], ['k..', 'kkk', 'kpk']],
  closed: [['.....', '.kkkk', 'kkkk.', '.....'], ['...', 'kkk']],
  sleep: [['.....', '.....', 'kkkkk', '.kkk.'], ['...', 'kkk']],
  happy: [['.kkkk', 'kkkkk', 'kWWWk', '.kkk.'], ['kkk', 'kWk']],
  hurt: [['k....', '.kk..', '...kk', '.kk..', 'k....'], ['..k', 'kk.', '..k']],
  ko: [['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'], ['k.k', '.k.', 'k.k']],
};
const SEYEMAP = { k: '#2a1420', W: '#ffffff', p: '#2a1420' };
const SEEDS = [[0, 0], [5, 2], [10, 0], [2, 5], [8, 6], [-3, 4], [13, 4], [4, 9], [10, 11], [-1, 10], [15, 9], [6, -4], [12, -5], [0, -6], [17, -1], [-5, -2]];
function strawbaa(P, m) {
  const back = m.view === 'back', sq = m.sq;
  const X = 41 + m.dx, base = 58 + m.bob, lean = m.lean;
  const cy = base - 13 + sq + (m.tilt ? Math.round(m.tilt * 3) : 0), wy = cy;
  const fx = X - 11 - lean, fy = cy + 1 + (m.tilt ? Math.round(m.tilt * 2) : 0);
  const step = m.step;
  // ---- legs (behind the wool)
  const legs = [[X - 9, 0, -1], [X - 4, 1, 1], [X + 8, 0, 1], [X + 13, 1, -1]];
  if (m.tilt < 0.5) for (const [lx, far, ph] of legs) { const up = step === ph ? 2 : 0; P.tube([[lx, base - 5 - up, 2.6], [lx, base + 2 - up - far, 2.4]], 'leg', { grp: 'leg' + lx }); P.stamp(lx - 2, base + 1 - up - far, ['hhhh'], { h: '#3e2236' }, { mat: 'leg', grp: 'leg' + lx }); }
  // ---- wool: a strawberry-shaped cloud of puffs, each puff outlined against the next
  const puffs = back
    ? [[X, wy - 10, 8], [X - 10, wy - 6, 7.5], [X + 10, wy - 6, 7.5], [X - 14, wy + 2, 7], [X + 14, wy + 2, 7], [X - 7, wy + 4, 8], [X + 7, wy + 4, 8], [X, wy + 6, 8]]
    : [[X + 4, wy - 10, 8], [X + 13, wy - 5, 7.5], [X - 5, wy - 8, 7], [X + 16, wy + 3, 7], [X + 8, wy + 5, 8.5], [X - 3, wy + 5, 8], [X - 10, wy + 2, 6.5]];
  P.ell(X + 2, wy - 1, 16 - sq, 12 + sq, 'wool', { grp: 'wool0' });
  puffs.forEach(([x, y, r], k) => P.circ(x, y, r - (sq > 0 && k % 2 ? 0.5 : 0), 'wool', { grp: 'wool' + (k % 3 + 1) }));
  // golden seeds in a strawberry lattice
  for (const [dx, dy] of SEEDS) { const x = X - 6 + dx, y = wy - 3 + dy; P.stamp(x, y, ['y', 'd'], { y: '#ffe680', d: '#b8303e' }, { onMat: 'wool' }); }
  // a fluffy tail puff
  if (!back) P.circ(X + 22, wy + 1, 3.5, 'wool', { grp: 'tail' }); else P.circ(X, wy + 9, 4, 'wool', { grp: 'tail' });
  if (back) {
    // head from behind: ears, calyx cap, horns
    P.ell(X - 11, wy - 8, 3, 5.5, 'ear', { rot: 1.1, grp: 'earL' }); P.ell(X + 11, wy - 8, 3, 5.5, 'ear', { rot: -1.1, grp: 'earR' });
    P.circ(X, wy - 14, 7, 'wool', { grp: 'head' });
    calyx(P, X, wy - 20, m);
  } else {
    // ---- head: far ear, face, near ear, curled horns, wool bangs, calyx cap
    P.ell(fx - 10, fy + 1, 2.6, 5.2, 'ear', { rot: 1.0, grp: 'earF' });
    P.ell(fx, fy + 1, 9.5, 8.5, 'face', { grp: 'face' });
    P.ell(fx - 3, fy + 5, 6, 3.6, 'face', { paint: true, grp: 'face', lit: 0.12 });                        // muzzle catches the light
    P.tube([[fx - 5, fy - 6, 1.9], [fx - 9, fy - 9, 1.7], [fx - 12, fy - 6, 1.4], [fx - 11, fy - 3, 1.1]], 'horn', { grp: 'hornF', round: 2 });
    P.ell(fx + 11, fy + 2, 3.2, 6.2, 'ear', { rot: -1.05, grp: 'earN' });
    P.stamp(fx + 9, fy + 1, ['.pp', 'ppp'], { p: '#f0989a' }, { on: true });
    P.tube([[fx + 3, fy - 7, 2.3], [fx + 8, fy - 11, 2.1], [fx + 12, fy - 9, 1.8], [fx + 13, fy - 5, 1.5], [fx + 10, fy - 3, 1.2], [fx + 9, fy - 5, 1]], 'horn', { grp: 'hornN', round: 2 });
    P.line(fx + 6, fy - 9, fx + 7, fy - 10, '#d8b48e'); P.line(fx + 11, fy - 9, fx + 12, fy - 7, '#d8b48e');                      // horn ridges
    // wool bangs
    P.circ(fx + 1, fy - 9, 4.6, 'wool', { grp: 'bang1' }); P.circ(fx - 4, fy - 7, 3.3, 'wool', { grp: 'bang2' }); P.circ(fx + 5, fy - 7, 3.2, 'wool', { grp: 'bang3' });
    P.stamp(fx, fy - 11, ['y.y', '...', '.y.'], { y: '#ffe680' }, { onMat: 'wool' });
    calyx(P, fx + 1, fy - 15, m);
    // eyes, nose and mouth
    const e = SEYE[m.eyes] || SEYE.open, dy = m.eyes === 'happy' || m.eyes === 'closed' ? 1 : 0;
    P.stamp(fx - 1, fy - 1 + dy, e[0], SEYEMAP, { on: true });
    P.stamp(fx - 8, fy - 1 + dy, e[1], SEYEMAP, { on: true });
    P.stamp(fx - 5, fy + 5, ['.n.', 'n.n'], { n: '#c86a7a' }, { on: true });
    if (m.mouth) P.stamp(fx - 5, fy + 7, ['kk', 'tt'], { k: '#5a1a2a', t: '#ff7a8a' }, { on: true });
  }
  // ---- effects
  if (m.fx.has('breath')) FX.breath(P, fx - 9, fy + 4, m, 'leaf');
  if (m.fx.has('dash')) FX.dash(P, X + 22, wy, m);
  if (m.fx.has('swipe')) FX.swipe(P, fx - 12, fy);
  if (m.fx.has('hit')) FX.hit(P, X + 4, wy - 6, m);
  if (m.fx.has('toss')) { const t = m.k, x = fx - 10 - t * 28, y = fy - 6 - Math.sin(t * Math.PI) * 12; P.circ(x, y, 3, 'wool', { grp: 'fly' }); P.dot(x - 1, y - 1, '#ffe680'); P.dot(x + 1, y + 1, '#ffe680'); }
  if (m.fx.has('aura') || m.fx.has('cast')) { FX.aura(P, X, wy + 2, 24, 15, m, '#a8ff7a'); if (m.fx.has('cast')) FX.hearts(P, X + 14, wy - 18, m); }
  if (m.fx.has('sparkle')) FX.sparkle(P, X, wy, m, '#d8ffb0');
  if (m.fx.has('zz')) FX.zz(P, X + 12, wy - 20, m);
  if (m.fx.has('steam')) FX.steam(P, fx, fy - 16, m);
  if (m.fx.has('hearts')) FX.hearts(P, X + 16, wy - 16, m);
  if (m.fx.has('bond')) FX.aura(P, X, wy + 2, 25, 16, m, '#7af0ff');
}
// the strawberry's leafy cap and curly stem
function calyx(P, x, y, m) {
  const w = Math.round(Math.sin(m.t * Math.PI * 4) * 0.6);
  P.poly([[x - 8, y + 3], [x - 3, y], [x - 1, y + 4], [x + 2, y - 1], [x + 4, y + 3], [x + 9, y + 2], [x + 4, y + 6], [x - 4, y + 6]], 'leaf', { grp: 'calyx', round: 2 });
  P.tube([[x + 1, y + 1, 1.3], [x + 1 + w, y - 3, 1.1], [x + 3 + w, y - 5, 0.9]], 'leaf', { grp: 'calyx', round: 1 });
  P.px(x - 4, y + 3, '#d2f070'); P.px(x + 3, y + 2, '#d2f070');
}

export const SPRITES = {
  chilichick: { id: 'chilichick', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: CHILI_PAL, draw: chilichick },
  bubblion: { id: 'bubblion', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: BUB_PAL, draw: bubblion },
  strawbaa: { id: 'strawbaa', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: STRAW_PAL, draw: strawbaa },
};
