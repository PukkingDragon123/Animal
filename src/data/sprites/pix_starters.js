// The three starters as hand-pixel art (see src/px/pixmon.js for the painter).
// Views are drawn facing left; the game mirrors them for the other side.
import { FX } from '../../px/pixmon.js';

// ================================================================== CHILICHICK
// A small, fat fire chick hugging a chili as big as its belly. A crest of three
// flame tongues (no comb), a flame tuft for a tail, ember-lit eyes.
const CHILI_PAL = {
  body: { ramp: ['#ffe68a', '#ffbf3c', '#f5872c', '#cf552a'], line: '#5a1e18', lineLit: '#a4441f' },
  belly: { ramp: ['#fff8da', '#ffe6a0', '#fbbd6c', '#e68f4c'], line: '#5a1e18' },
  wing: { ramp: ['#ffd660', '#ffa834', '#ea7629', '#c24c28'], line: '#5a1e18', lineLit: '#9a3a1c' },
  feet: { ramp: ['#ffb468', '#ee883a', '#c75e2c', '#963c24'], line: '#481812' },
  beak: { ramp: ['#ffd27a', '#ff9e36', '#e0672a', '#b0432a'], line: '#5a1e18' },
  chili: { ramp: ['#ff8a7a', '#e8363e', '#b4203a', '#781334'], line: '#3c0c1c', lineLit: '#6e1430', gloss: true, spec: 0.96, specC: '#ffd6cc' },
  leaf: { ramp: ['#d2f070', '#80c64a', '#3f8e3a', '#245c2e'], line: '#16301a' },
  crest: { ramp: ['#fff6c8', '#ffd040', '#ff7c22', '#e23c1e'], line: '#6a1612', lineLit: '#a42a18', th: [0.8, 0.5, 0.18], inner: '#e0662a' },
};
const K = '#2a1218', WH = '#ffffff', EM = '#ee6a2a', EM2 = '#ffb04a';
const EYE = {   // near eye 5×7 / far eye 3×6, per expression
  open: [['.kkkk.', 'kWWkkk', 'kWWkkk', 'kkkkkk', 'kkkkkk', 'kkkkgk', 'kkkggk', '.kkkk.'], ['.kk.', 'kWkk', 'kkkk', 'kkkk', 'kkgk', 'kggk', '.kk.']],
  fierce: [['kk....', '.kkk..', 'kkWkkk', 'kWWkkk', 'kkkkkk', 'kkkggk', '.kkkk.'], ['...k', '.kk.', 'kWkk', 'kkkk', 'kkgk', '.kk.']],
  closed: [['......', '......', '......', '......', 'k....k', '.kkkk.'], ['....', '....', '....', '....', 'k..k', '.kk.']],
  sleep: [['......', '......', '......', '......', '......', 'kkkkkk', '.kkkk.'], ['....', '....', '....', '....', '....', 'kkkk']],
  happy: [['......', '......', '..kk..', '.k..k.', 'k....k'], ['....', '....', '.kk.', 'k..k', '....']],
  hurt: [['......', '....kk', '..kk..', 'kk....', '..kk..', '....kk'], ['....', 'kk..', '..kk', '...k', '..kk', 'kk..']],
  ko: [['......', 'kk..kk', '.kkkk.', '..kk..', '.kkkk.', 'kk..kk'], ['....', 'k..k', '.kk.', '.kk.', 'k..k']],
};
const EYEMAP = { k: K, W: WH, g: EM, o: EM2 };

function chiliPod(P, pts, o = {}) {
  // the pod, its calyx and curly stem; pts run from the stem end to the tip
  P.tube(pts, 'chili', { grp: o.grp || 'chili', round: 3 });
  const [sx, sy] = pts[0], dx = pts[0][0] - pts[1][0], dy = pts[0][1] - pts[1][1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  // glossy streak along the top of the pod
  for (let k = 1; k < Math.min(3, pts.length - 1); k++) { const [x, y, r] = pts[k]; P.px(x - 1, y - r + 1.4, '#ffd0c4'); P.px(x + 1, y - r + 1.4, '#ffd0c4'); P.px(x, y - r + 1.4, '#fff0ea'); }
  // calyx: three sepals fanning back over the shoulder of the pod
  const cx = sx + ux * 2, cy = sy + uy * 2;
  P.poly([[cx - uy * 4.5, cy + ux * 4.5], [cx + ux * 3, cy + uy * 3 - 1], [cx + uy * 4.5, cy - ux * 4.5], [cx + ux * 1, cy + uy * 1 + 1.5]], 'leaf', { grp: 'calyx', round: 2 });
  P.tube([[cx + ux * 2, cy + uy * 2, 1.3], [cx + ux * 4.5, cy + uy * 4.5 - 1.5, 1.1], [cx + ux * 4 + 1.5, cy + uy * 4 - 4, 0.9]], 'leaf', { grp: 'calyx', round: 1 });
}

function chilichick(P, m) {
  const back = m.view === 'back', sq = m.sq, rx = 16 + sq, ry = 14 - sq;
  const lean = m.lean + (m.tilt ? Math.round(m.tilt * 2) : 0);
  const X = 40 + m.dx, base = 60 + m.bob, cy = base - ry, top = cy - ry;
  const fx = X - lean;                                         // the face leans with the body
  const fl = (m.ph >> 1) % 3;                                  // flame flicker phase
  // ---- crest + tail (behind the body in the front view)
  const crest = () => {
    P.flame(fx + 9, top + 4, 10 + (fl === 0 ? 1 : 0), 4.6, 8 - (fl === 1 ? 1 : 0), 'crest', { grp: 'crest', glow: true, round: 3 });
    P.flame(fx + 2, top + 3, 13 + (fl === 1 ? 1 : 0), 5.6, 5 - (fl === 2 ? 1 : 0), 'crest', { grp: 'crest', glow: true, round: 3 });
    P.flame(fx - 5, top + 4, 7 + (fl === 2 ? 1 : 0), 4, 3, 'crest', { grp: 'crest', glow: true, round: 2.5 });
  };
  const tail = () => back ? P.flame(X + 1, base - 3, 10 + (fl === 1 ? 1 : 0), 4.2, 3, 'crest', { grp: 'tail', glow: true, round: 2.5 })
    : P.flame(X + 15, cy + 2, 11 + (fl === 1 ? 1 : 0), 4.2, 9, 'crest', { grp: 'tail', glow: true, round: 2.5 });
  // ---- feet
  const feet = () => {
    const nearUp = m.step > 0 ? 2 : 0, farUp = m.step < 0 ? 2 : 0;
    P.ell(X - 7, base + 1.5 - farUp, 3.6, 2.1, 'feet', { grp: 'footF' });
    P.ell(X + 5, base + 2 - nearUp, 4, 2.3, 'feet', { grp: 'footN' });
    if (!back) {
      P.stamp(X - 12, base + 2 - farUp, ['ff.f'], { f: '#c75e2c' }, { mat: 'feet', grp: 'footF' });
      P.stamp(X - 1, base + 3 - nearUp, ['ff.f'], { f: '#c75e2c' }, { mat: 'feet', grp: 'footN' });
    }
  };
  // ---- the chili, wherever the wings have it
  const pod = () => {
    if (m.arm === 2 || m.arm === 3) return;
    if (m.arm === 1) chiliPod(P, [[X + 12, top - 2, 3.6], [X + 3, top - 4, 4.2], [X - 6, top - 4, 3.6], [X - 13, top - 2, 2.2], [X - 16, top + 1, 1]]);
    else if (m.arm === 4) chiliPod(P, [[X + 7, cy + 9, 4], [X + 1, cy + 6, 4], [X - 5, cy + 2, 3.2], [X - 9, cy - 1, 2], [X - 11, cy - 2, 1]]);
    else chiliPod(P, [[X + 13, cy + 4, 3.8], [X + 7, cy + 8, 4.8], [X - 1, cy + 10.5, 4.9], [X - 9, cy + 11, 4.1], [X - 15, cy + 9, 2.9], [X - 19, cy + 5.5, 1.6], [X - 20, cy + 2.5, 0.9]]);
  };
  const wings = () => {
    const W = {
      0: [[X + 10, cy + 12, 4.6, 5.6, -1.1], [X - 10, cy + 15, 3.2, 4, 1.2]],
      1: [[X + 13, top + 2, 4.5, 7, -2.4], [X - 13, top + 3, 3.6, 6, 2.4]],
      2: [[X - 6, cy + 2, 4.5, 7, 1.2], [X - 15, cy + 2, 3.4, 5.5, 1.1]],
      3: [[X + 9, cy + 6, 5, 7, -0.4], [X - 11, cy + 7, 3.4, 5, 0.5]],
      4: [[X + 7, cy + 10, 5, 7, -1.0], [X - 9, cy + 9, 3.6, 5, 0.8]],
    }[m.arm] || [];
    const [nw, fw] = W;
    if (fw) P.ell(fw[0], fw[1], fw[2], fw[3], 'wing', { rot: fw[4], grp: 'wingF' });
    if (nw) {
      P.ell(nw[0], nw[1], nw[2], nw[3], 'wing', { rot: nw[4], grp: 'wingN' });
      // feather tips along the wing's lower edge
      const c = Math.cos(nw[4]), s = Math.sin(nw[4]);
      for (const u of [-0.45, 0, 0.45]) { const lx = nw[0] + (-s) * nw[3] * 0.82 + c * nw[2] * u * 1.4, ly = nw[1] + c * nw[3] * 0.82 + s * nw[2] * u * 1.4; P.px(lx, ly, '#c24c28'); }
    }
  };
  const face = () => {
    const ex = m.eyes, e = EYE[ex] || EYE.open;
    const nx = fx - 5, ny = cy - 10 + (ex === 'happy' || ex === 'closed' || ex === 'sleep' ? 1 : 0), farX = fx - 15, farY = cy - 9;
    P.stamp(nx, ny, e[0], EYEMAP, { on: true });
    P.stamp(farX, farY, e[1], EYEMAP, { on: true });
    // always teary from the heat: a wet glint under each eye and a tear on the near cheek
    if (ex !== 'ko') {
      const drip = (m.ph >> 2) % 4, wet = '#bfeaff', tear = '#8ad4ff';
      P.stamp(nx + 1, ny + (ex === 'open' ? 8 : 6), ['wwww'], { w: wet }, { on: true });
      P.stamp(nx + 5, ny + 6 + drip, ['t', 'T'], { t: wet, T: tear }, { on: true });
      P.stamp(farX, farY + (ex === 'open' ? 7 : 5), ['ww'], { w: wet }, { on: true });
    }
    // cheeks: warm blush, blazing when the chili bites back
    const hot = m.fx.has('blush');
    P.stamp(nx, cy - 1, [hot ? 'rrrr' : '.rr.', hot ? '.rr.' : ''], { r: hot ? '#ff4a3a' : '#ff8a5e' }, { on: true });
    P.stamp(farX - 1, cy - 1, [hot ? 'rr' : '.r'], { r: hot ? '#ff4a3a' : '#ff8a5e' }, { on: true });
    // beak (pointing left, between the eyes)
    const bx = fx - 12, by = cy - 3;
    const BK = { b: '#ffd27a', B: '#ff9e36', D: '#e0672a', d: '#9a3a22', r: '#6a1420', t: '#ff6a7a' };
    if (m.mouth === 0) P.stamp(bx, by, ['...bbB', '.bbbBB', 'bbbBBD', '.dddd.'], BK, { mat: 'beak', grp: 'beak' });
    else if (m.mouth === 1) P.stamp(bx, by - 1, ['...bbB', '.bbbBB', 'bbBBDd', '.rrrr.', '..ddd.'], BK, { mat: 'beak', grp: 'beak' });
    else P.stamp(bx - 1, by - 2, ['....bbB', '..bbbBB', 'bbbBBDd', '.rrrrr.', '.rttrr.', '..dddd.'], BK, { mat: 'beak', grp: 'beak' });
    // a little fluff on the crown
    P.px(fx - 2, top + 2, '#fff2b0'); P.px(fx - 1, top + 1, '#fff2b0'); P.px(fx + 3, top + 2, '#fff2b0');
  };

  if (!back) {
    tail(); feet();
    P.ell(X - Math.round(lean / 2), cy, rx, ry, 'body', { grp: 'body', rot: lean * 0.05 });
    // fluffy cheek tufts break up the round silhouette
    P.poly([[X + 13, cy - 7], [X + 19, cy - 4], [X + 15, cy - 3], [X + 18, cy], [X + 13, cy + 1]], 'body', { grp: 'body', round: 2 });
    P.poly([[X - 14, cy - 1], [X - 18, cy + 2], [X - 14, cy + 3]], 'body', { grp: 'body', round: 2 });
    crest();
    P.ell(X - 3 - lean, cy + 6, 10, 7.5, 'belly', { paint: true, grp: 'body' });
    pod(); wings(); face();
  } else {
    // from behind: the pod peeks out either side, the crest and tail face us
    if (m.arm === 0 || m.arm === 4) { P.tube([[X + 15, cy + 4, 3.4], [X + 19, cy + 3, 2.6]], 'chili', { grp: 'chili' }); P.tube([[X - 15, cy + 6, 3], [X - 19, cy + 4, 1.6], [X - 21, cy + 2, 0.8]], 'chili', { grp: 'chili' }); P.ell(X + 20, cy + 1, 2.4, 2, 'leaf', { grp: 'calyx' }); }
    feet();
    P.ell(X, cy, rx, ry, 'body', { grp: 'body' });
    P.ell(X, cy - 3, 12, 9, 'wing', { paint: true, grp: 'body' });               // deeper orange back
    for (const [dx, dy] of [[-5, -2], [0, -4], [5, -2], [-3, 3], [3, 3]]) { P.px(X + dx, cy + dy, '#c24c28'); P.px(X + dx + 1, cy + dy + 1, '#c24c28'); P.px(X + dx - 1, cy + dy + 1, '#c24c28'); }   // feather chevrons
    if (m.arm === 1) chiliPod(P, [[X + 12, top - 2, 3.6], [X + 3, top - 4, 4.2], [X - 6, top - 4, 3.6], [X - 13, top - 2, 2.2], [X - 16, top + 1, 1]]);
    P.ell(X - 16, cy + 4, 3.6, 6, 'wing', { rot: 0.3, grp: 'wingF' }); P.ell(X + 16, cy + 4, 3.6, 6, 'wing', { rot: -0.3, grp: 'wingN' });
    crest(); tail();
  }
  // ---- effects
  if (m.fx.has('breath')) FX.breath(P, fx - 13, cy - 1, m, 'fire');
  if (m.fx.has('toss')) { const t = m.k, x = X - 18 - t * 34, y = cy - 6 - Math.sin(t * Math.PI) * 14; chiliPod(P, [[x + 6, y - 2, 2.6], [x, y, 3], [x - 5, y + 2, 1.6], [x - 7, y + 4, 0.8]], { grp: 'fly' }); if (m.ph % 2) P.dot(x + 9, y - 3, '#ffcf3a'); }
  if (m.fx.has('dash')) { FX.dash(P, X + 16, cy, m); P.flame(X + 17, cy + 6, 6, 2.6, 7, 'fire', { glow: true, round: 2, grp: 'fx-dash' }); }
  if (m.fx.has('swipe')) FX.swipe(P, fx - 18, cy - 2);
  if (m.fx.has('hit')) FX.hit(P, X + 2, cy - 4, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X, cy + 2, rx + 5, ry + 3, m, '#ffb03a');
  if (m.fx.has('sparkle')) FX.sparkle(P, X, cy, m);
  if (m.fx.has('zz')) FX.zz(P, X + 10, top - 2, m);
  if (m.fx.has('steam')) FX.steam(P, fx, top - 6, m);
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
const BEYE = {
  open: ['.kkkk.', 'kWWkkk', 'kWWkrk', 'kkkkrk', 'krrrrk', '.kkkk.'],
  fierce: ['kk....', '.kkkk.', 'kWWkrk', 'kkkkrk', '.krrk.'],
  closed: ['......', '......', '......', 'k....k', '.kkkk.'],
  sleep: ['......', '......', '......', '......', 'kkkkkk'],
  happy: ['......', '..kk..', '.k..k.', 'k....k'],
  hurt: ['......', 'kk....', '..kk..', '....kk', '..kk..', 'kk....'],
  ko: ['......', 'kk..kk', '.kkkk.', '..kk..', '.kkkk.', 'kk..kk'],
};
const BEYEMAP = { k: '#24101c', W: '#ffffff', r: '#c83a4a' };
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
    P.stamp(fx - 6, fy + 2, ['rr'], { r: '#ff8a8a' }, { on: true });                                                        // blush
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
const SEYE = {
  open: [['.kkk.', 'kWWkk', 'kWkgk', 'kkggk', '.kkk.'], ['.kk', 'kWk', 'kgk', '.k.']],
  fierce: [['kk...', '.kkkk', 'kWkgk', '.kkk.'], ['..k', 'kkk', 'kgk', '.k.']],
  closed: [['.....', '.....', 'k...k', '.kkk.'], ['...', '...', 'k.k', '.k.']],
  sleep: [['.....', '.....', '.....', 'kkkkk'], ['...', '...', '...', 'kkk']],
  happy: [['.....', '..k..', '.k.k.', 'k...k'], ['...', '.k.', 'k.k', '...']],
  hurt: [['k....', '.kk..', '...kk', '.kk..', 'k....'], ['..k', 'kk.', '..k']],
  ko: [['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'], ['k.k', '.k.', 'k.k']],
};
const SEYEMAP = { k: '#2a1420', W: '#ffffff', g: '#5aa848' };
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
    // eyes, blush, nose and mouth
    const e = SEYE[m.eyes] || SEYE.open, dy = m.eyes === 'happy' || m.eyes === 'closed' ? 1 : 0;
    P.stamp(fx - 1, fy - 1 + dy, e[0], SEYEMAP, { on: true });
    P.stamp(fx - 8, fy - 1 + dy, e[1], SEYEMAP, { on: true });
    P.stamp(fx + 4, fy + 4, ['rr'], { r: m.fx.has('blush') ? '#ff5a6a' : '#ff9aa2' }, { on: true }); P.stamp(fx - 9, fy + 4, ['r'], { r: '#ff9aa2' }, { on: true });
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
