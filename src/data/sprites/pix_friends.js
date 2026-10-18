// Friends' Tokonmon as hand-pixel art (see src/px/pixmon.js for the painter):
// Kanizumo (Coach Gonda), Zapanda (Mika) and Beatlet (Taro).
// Views are drawn facing left; the game mirrors them for the other side.
import { FX } from '../../px/pixmon.js';

// ================================================================== KANIZUMO
// A big red crab standing up on its hind legs like a sumo wrestler in the crouch
// before the charge: a cream sumo belly hanging over a navy mawashi with stiff white
// sagari cords, flat claw-palms for slapping, kind stalk eyes and a black
// ginkgo-leaf topknot.
const KANI_PAL = {
  shell: { ramp: ['#ff9a6e', '#ea4a3a', '#b42c3c', '#7a1c3a'], line: '#3a0a1e', lineLit: '#8a2230', th: [0.7, 0.36, 0.04] },
  tip: { ramp: ['#a05a5e', '#6e3040', '#4a1e30', '#2e1022'], line: '#1a0612' },
  belly: { ramp: ['#fffaf0', '#ffe9c8', '#f4c49c', '#d6967e'], line: '#5a1e26', lineLit: '#9a5a4a', th: [0.8, 0.5, 0.16] },
  palm: { ramp: ['#fff2e2', '#ffd6b8', '#f4aa8e', '#d27a72'], line: '#5a1e26', inner: '#9a2a36' },
  belt: { ramp: ['#6a86d0', '#3a52a0', '#26346e', '#181e48'], line: '#0a0c24', lineLit: '#1e2a5a' },
  cord: { ramp: ['#ffffff', '#f2f2fa', '#cfd2e8', '#9ea2c8'], line: '#262a52', lineLit: '#4a4e7a' },
  hair: { ramp: ['#4a4468', '#2a2440', '#1a1428', '#100c1a'], line: '#06040a', lineLit: '#06040a', th: [0.78, 0.45, 0.1] },
  eyeW: { ramp: ['#ffffff', '#f6f2fa', '#ddd4ea', '#b0a4c4'], line: '#3a0a1e', lineLit: '#7a2a3a' },
};
const KK = '#1e0c18';
const KEYE = {   // pupils on the white stalk eyes, near 5×6 / far 4×5, looking forward-left
  open: [['.kkk.', 'kWWkk', 'kWkkk', 'kkkkk', 'kkkbk', '.kkk.'], ['.kk.', 'kWkk', 'kkkk', 'kkbk', '.kk.']],
  fierce: [['.kkk.', 'kWkkk', 'kkkkk', 'kkkbk', '.kkk.'], ['.kk.', 'Wkkk', 'kkbk', '.kk.']],
};
const KMAP = { k: KK, W: '#ffffff', b: '#5a7ad8' };

function kanizumo(P, m) {
  const back = m.view === 'back', sq = m.sq;
  const tilt = m.tilt || 0, lean = m.lean + Math.round(tilt * 3);
  const X = 48 + m.dx, G = 76 + m.bob;                     // G: the bottom row of the feet
  const cx = X - lean, cy = G - 31 + sq + Math.round(tilt * 2);
  const rx = 18 + sq, ry = 14 - sq;
  const top = cy - ry;
  const st = m.step;
  // ---- hind legs: a wide sumo squat, knees out, pointed dark feet
  const hindLeg = (s, near, x0 = X) => {
    const up = (near ? st > 0 : st < 0) ? 3 : 0, w = near ? 1 : 0.85, hx = x0 + s * 7 * w, ky = G - 15 - up, kx = x0 + s * 18 * w, fx = x0 + s * 21 * w;
    const g = 'hind' + (near ? 'N' : 'F');
    P.tube([[hx, G - 12, 5.4], [kx, ky, 4.2]], 'shell', { grp: g });
    P.tube([[kx, ky, 3.6], [fx, G - 5 - up, 2.7]], 'shell', { grp: g });
    P.tube([[fx, G - 5 - up, 2.6], [fx + s * 0.5, G - 1 - up, 1.2]], 'tip', { grp: g + 't' });
    P.px(kx - 1, ky - 3, '#ff9a6e'); P.px(kx, ky - 3, '#ff9a6e');
  };
  // ---- the little walking legs along the sides of the shell
  const sideLegs = (s, near, x0, n = 2) => {
    for (let k = 0; k < n; k++) {
      const y0 = cy + 2 + k * 5, sx = x0 - s * k * 2, kx = sx + s * 6, ky = y0 - 3 + k, wig = m.clip === 'idle' && ((m.ph >> 3) + k) % 2 ? 1 : 0;
      const g = 'sleg' + (near ? 'N' : 'F') + k;
      P.tube([[sx, y0, 1.7], [kx, ky - wig, 1.5]], 'shell', { grp: g });
      P.tube([[kx, ky - wig, 1.4], [kx + s * 2, ky + 5 - wig, 1.1]], 'shell', { grp: g });
      P.tube([[kx + s * 2, ky + 5 - wig, 0.9], [kx + s * 2.4, ky + 7 - wig, 0.4]], 'tip', { grp: g + 't' });
    }
  };
  // ---- a claw: the arm, a broad flat hand with the palm facing out, two dark-tipped pincer fingers
  // (x, y) hand centre, r size, a = direction the fingers point (radians, 0 = up), open 0..1
  const claw = (sx, sy, x, y, r, a, open, g, s = -1, palm = true) => {
    const ux = Math.sin(a), uy = -Math.cos(a), vx = -uy, vy = ux;          // u: along the fingers, v: across
    const wx = x - ux * r * 1.0, wy = y - uy * r * 1.0;
    const ex = (sx + wx) / 2 + s * 1.5, ey = Math.max(sy, wy) + 3;
    P.tube([[sx, sy, 3.2], [ex, ey, 2.8]], 'shell', { grp: g + 'a' });
    P.tube([[ex, ey, 2.8], [wx, wy, 2.6]], 'shell', { grp: g + 'b' });
    P.ell(x, y, r * 0.95, r * 0.82, 'shell', { grp: g, rot: a });
    const o = open * r * 0.32;
    for (const side of [-1, 1]) {
      const b = [x + ux * r * 0.45 + vx * side * r * 0.42, y + uy * r * 0.45 + vy * side * r * 0.42];
      const mid = [x + ux * r * 1.25 + vx * side * (r * 0.5 + o), y + uy * r * 1.25 + vy * side * (r * 0.5 + o)];
      const tip = [x + ux * r * 1.85 + vx * side * (r * 0.22 + o * 0.8), y + uy * r * 1.85 + vy * side * (r * 0.22 + o * 0.8)];
      P.tube([[b[0], b[1], r * 0.5], [mid[0], mid[1], r * 0.36]], 'shell', { grp: g });
      P.tube([[mid[0], mid[1], r * 0.34], [tip[0], tip[1], r * 0.12]], 'tip', { grp: g + 't' + side });
    }
    // the flat palm pad
    if (palm) P.ell(x - ux * r * 0.1, y - uy * r * 0.1, r * 0.6, r * 0.5, 'palm', { paint: true, grp: g + 'p', rot: a });
  };
  // ---- stalk eyes: white eyeballs under soft lids
  const stalkEye = (bx, by, x, y, r, near, g) => {
    const ex = m.eyes;
    P.tube([[bx, by, 2.1], [x + 0.5, y + r * 0.5, 1.6]], 'shell', { grp: g + 's' });
    const lidded = ex === 'closed' || ex === 'sleep' || ex === 'happy';
    P.circ(x, y, r, lidded ? 'shell' : 'eyeW', { grp: g });
    if (ex === 'hurt' || ex === 'ko') {
      P.stamp(x - 2, y - 2, ex === 'hurt' ? (near ? ['k...', '.kk.', '...k', '.kk.', 'k...'] : ['k..', '.kk', 'k..']) : (near ? ['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'] : ['k.k', '.k.', 'k.k']), { k: KK }, { on: true });
      return;
    }
    if (!lidded) {
      const e = KEYE[ex === 'fierce' ? 'fierce' : 'open'][near ? 0 : 1];
      P.stamp(x - (near ? 3 : 3), y - (near ? 2 : 1) + (ex === 'fierce' ? 1 : 0), e, KMAP, { on: true });
      // the lid: a soft red cap, slanting down inward when fierce
      const lh = ex === 'fierce' ? 3.2 : 2.2;
      P.shape(x - r - 1, y - r - 1, x + r + 1, y, (px, py) => py < y - r + lh + (ex === 'fierce' ? (px - x) * -0.35 : Math.abs(px - x) * 0.18), 'shell', { paint: true, grp: g, lit: 0.2 });
    } else {
      const L = { closed: ['k...k', '.kkk.'], sleep: ['.....', 'kkkkk'], happy: ['.kkk.', 'k...k'] }[ex];
      P.stamp(x - (L[0].length >> 1), y - (L.length >> 1) + 1, L, { k: KK }, { on: true });
    }
  };
  // ---- topknot: a stiff black ginkgo-leaf fan standing on the crown, tied with a white motoyui
  const topknot = (x, y, flip = false) => {
    P.stamp(x - 8, y - 10, [
      '.......H.h.......',
      '....HHHh.hhhh....',
      '...HhhHh.hhhhd...',
      '..HhhhHhhhHhhdd..',
      '.HhhhhhHhhHhhhdd.',
      '..hHhhhHhhHhhdd..',
      '...hhHhhHhhhdd...',
      '.....dhhHhhd.....',
      '.......dhd.......',
      '.......wWw.......',
      '.......dDd.......',
    ], { H: '#5e5888', h: '#2e2846', d: '#1c1630', D: '#120e1e', w: '#fff6e0', W: '#d8ccb8' }, { mat: 'hair', grp: 'fan', flip });
  };
  // ---- the mawashi: a thick band wrapped round the hips; phi turns its front (the sagari side) toward the left
  const mawashi = (ccx, y0, hw, phi) => {
    const th = (x) => Math.asin(Math.max(-1, Math.min(1, (x - ccx) / hw)));
    const yt = (x) => y0 + 3.2 * Math.cos(th(x) - phi * 0.6), H = 7;
    P.shape(ccx - hw, y0 - 1, ccx + hw, y0 + H + 4, (x, y) => Math.abs(x - ccx) < hw && y > yt(x) && y < yt(x) + H + Math.cos(th(x)) * 0.8, 'belt', { grp: 'belt' },
      (x) => { const t = th(x); return [Math.sin(t), 0.2, Math.cos(t)]; });
    for (let x = Math.ceil(ccx - hw + 1); x < ccx + hw - 1; x++) { P.px(x, Math.floor(yt(x) + 1), '#7a96dc'); P.px(x, Math.floor(yt(x) + 4), '#1e2858'); }
    return ccx + hw * Math.sin(phi);
  };
  const face = (mx, my) => {
    P.stamp(mx + 5, my - 1, ['rr'], { r: m.fx.has('blush') ? '#ff5a5a' : '#ff8a7a' }, { on: true });
    P.stamp(mx - 6, my - 1, ['rr'], { r: m.fx.has('blush') ? '#ff5a5a' : '#ff8a7a' }, { on: true });
    const MK = { k: '#4a0c1e', m: '#7a1a2a', t: '#ff7a8a' };
    if (m.mouth === 0) P.stamp(mx - 3, my, ['k.....k', '.kk.kk.', '...k...'], MK, { on: true });
    else if (m.mouth === 1) P.stamp(mx - 3, my, ['k.....k', '.kkkkk.', '.kmttk.', '..kkk..'], MK, { on: true });
    else P.stamp(mx - 2, my - 1, ['.kkk.', 'kmmmk', 'kmmmk', 'kmttk', '.kkk.'], MK, { on: true });
  };

  if (!back) {
    const arm = m.arm;
    // claw poses per arm state: near [x, y, angle, open], far [x, y, angle, open]
    const CL = {
      0: [[cx + 21, cy - 5, 0.2, 1], [cx - 24, cy - 3, -0.55, 1]],
      1: [[cx + 24, cy - 19, 0.1, 1], [cx - 24, cy - 16, -0.15, 1]],
      2: [[cx + 18, cy - 8, -0.3, 0], [cx - 34, cy - 9, -1.4, 1]],
      3: [[cx + 25, cy - 12, 0.4, 1], [cx - 30, cy - 3, -1.0, 1]],
      4: [[cx + 25, cy - 13, 0.35, 0], [cx - 13, cy - 12, 0.4, 0]],
      5: [[cx + 22, cy + 4, 0.7, 0], [cx - 22, cy + 6, -0.8, 0]],
    };
    const slump = m.clip === 'sleep' || (m.clip === 'faint' && tilt > 0.3);
    let [nc, fc] = CL[slump ? 5 : arm] || CL[0];
    if (m.clip === 'walk' || m.clip === 'run') { nc = [nc[0], nc[1] + m.step, nc[2], nc[3]]; fc = [fc[0], fc[1] - m.step, fc[2], fc[3]]; }
    if (m.clip === 'attack' && m.fx.has('swipe')) fc = [cx - 36, cy - 8, -1.5, 1];
    if (m.clip === 'attack' && m.t < 0.3) fc = [cx - 20, cy - 16, -0.2, 1];
    sideLegs(-1, false, cx - rx + 3, 1);
    claw(cx - 12, cy - 6, fc[0], fc[1], 5.2, fc[2], fc[3], 'clawF', -1);
    hindLeg(-1, false, cx - 3); hindLeg(1, true, cx);
    // the shell, with a few teeth along the shoulders and tubercle dots
    P.ell(cx + 2, cy, rx, ry, 'shell', { grp: 'shell' });
    for (const [dx, dy, s] of [[-14, -9, -1], [-10, -12, -1], [16, -10, 1], [19, -6, 1]]) P.poly([[cx + dx - 2, cy + dy + 2], [cx + dx + s * 2.5, cy + dy - 2], [cx + dx + 2, cy + dy + 1]], 'shell', { grp: 'shell', round: 1.5 });
    for (const [dx, dy] of [[8, -9], [12, -6], [10, -11]]) P.px(cx + dx, cy + dy, '#ff9a6e');
    sideLegs(1, true, cx + rx - 1, 2);
    // mawashi under the belly, sagari hanging from its front
    const bx = cx - 6;
    mawashi(cx + 1, G - 18, 16, -0.45);
    P.stamp(bx - 5, G - 9, ['w.w.w.w.w', 'w.w.w.w.w', 'c.w.c.w.c', 'c.c.c.c.c', 'c.c.c.c.c', 'd.c.c.c.d', '..d.d.d..'], { w: '#ffffff', c: '#e4e6f4', d: '#a8acd0' }, { mat: 'cord', grp: 'cord' });
    // the sumo belly, hanging over the belt
    P.ell(bx, G - 21, 12 + sq, 10.5, 'belly', { grp: 'belly' });
    P.stamp(bx - 1, G - 19, ['k', 'k'], { k: '#e2a882' }, { on: true });        // navel
    P.stamp(bx - 7, G - 15, ['ll.........ll', '..lllllllll..'], { l: '#e8b48c' }, { onMat: 'belly' });   // the apron's plates
    // the topknot on the crown, then the stalk eyes
    topknot(cx + 7, top - 1);
    const dr = m.clip === 'sleep' ? 1 : tilt;                                   // stalks droop when it sleeps or faints
    stalkEye(cx - 13, top + 3, cx - 16 - Math.round(dr * 2), top - 5 + Math.round(dr * 3), 4, false, 'eyeF');
    stalkEye(cx - 3, top + 2, cx - 5 + Math.round(dr), top - 7 + Math.round(dr * 3), 5, true, 'eyeN');
    face(cx - 10, top + 6);
    claw(cx + 13, cy - 5, nc[0], nc[1], 7, nc[2], nc[3], 'clawN', 1);
  } else {
    // from behind: the shell with its stern Heike face, the mawashi knot, claws either side
    sideLegs(-1, false, X - rx + 2); sideLegs(1, true, X + rx - 2);
    hindLeg(-1, false, X); hindLeg(1, true, X);
    for (const s of [-1, 1]) { P.tube([[X + s * 7, top + 3, 2.1], [X + s * 9, top - 4, 1.6]], 'shell', { grp: 'stalk' + s }); P.circ(X + s * 9, top - 6, 3.8, 'shell', { grp: 'eyeB' + s }); P.px(X + s * 9 - s * 3, top - 5, '#ffffff'); P.px(X + s * 9 - s * 3, top - 6, '#ffffff'); }
    P.ell(X, cy, rx, ry, 'shell', { grp: 'shell' });
    // the stern Heike-crab "game face" embossed on the back of the shell
    P.stamp(X - 9, cy - 9, [
      'dd...............dd',
      'lddd...........dddl',
      '..lddd.......dddl..',
      '....ldd.....ddl....',
      '...................',
      '....dddd...dddd....',
      '.....ll.....ll.....',
      '...................',
      '......ddddddd......',
      '.....dlllllllld....',
      '....d.........d....',
    ], { d: '#8a1e34', l: '#ff8a68' }, { on: true });
    mawashi(X, G - 18, 16.5, 0);
    P.tube([[X, G - 11, 2.6], [X, G - 4, 2.2]], 'belt', { grp: 'beltK' });
    P.ell(X, G - 13, 4.2, 3.6, 'belt', { grp: 'beltK' });                     // the knot
    topknot(X, top + 1);
    claw(X - 14, cy - 6, X - 25, cy - 10, 6, -0.3, 1, 'clawF', -1, false);
    claw(X + 14, cy - 6, X + 25, cy - 10, 6, 0.3, 1, 'clawN', 1, false);
  }
  // ---- effects
  const mx = cx - 10, my = top + 6;
  if (m.fx.has('breath')) FX.breath(P, mx - 3, my + 1, m, 'water');
  if (m.fx.has('toss')) { const t = m.k; FX.bubble(P, cx - 30 - t * 14, cy - 18 - Math.sin(t * Math.PI) * 10, 4); }
  if (m.fx.has('dash')) FX.dash(P, cx + 30, cy, m);
  if (m.fx.has('swipe')) FX.swipe(P, cx - 42, cy - 6);
  if (m.fx.has('hit')) FX.hit(P, X + 4, cy - 6, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X, cy + 4, rx + 12, ry + 10, m, '#7ad8ff');
  if (m.fx.has('sparkle')) FX.sparkle(P, X, cy - 4, m, '#c8f4ff');
  if (m.fx.has('zz')) FX.zz(P, X + 14, top - 10, m);
  if (m.fx.has('steam')) FX.steam(P, mx, top - 8, m);
  if (m.fx.has('hearts')) FX.hearts(P, X + 16, top - 6, m);
  if (m.fx.has('bond')) FX.aura(P, X, cy + 4, rx + 13, ry + 11, m, '#7af0ff');
}

// ================================================================== ZAPANDA
// A roly-poly red panda with a giant panda's build and markings: black ears, black
// legs and a black shoulder band. Its tear tracks are yellow lightning bolts down
// white cheeks, and its huge fluffy ringed tail is a battery: the cream rings light
// up yellow as it charges.
const ZAP_PAL = {
  coat: { ramp: ['#ffb46a', '#ea7230', '#b8482a', '#7c2c30'], line: '#3a1018', lineLit: '#8a3422', th: [0.7, 0.38, 0.06] },
  dark: { ramp: ['#54445e', '#30243a', '#1f1628', '#150e1c'], line: '#08040c', lineLit: '#140c1a' },
  white: { ramp: ['#ffffff', '#fff4e8', '#ead2ca', '#c4a2a8'], line: '#4a2430', lineLit: '#8a5a5a' },
  ring: { ramp: ['#fff6dc', '#f8dcaa', '#dcac7a', '#ac785a'], line: '#4a2418', lineLit: '#8a5a3a' },
  volt: { ramp: ['#ffffff', '#fff8a8', '#ffdc30', '#f2a41c'], line: '#7a3a10', lineLit: '#b8641a', th: [0.75, 0.45, 0.15] },
  bolt: { ramp: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], line: '#8a4a10', lineLit: '#c87a1a', contour: false },
};
const ZK = '#1e0c12';
const ZEYE = {   // near 5×7 / far 4×6
  open: [['.kkk.', 'kWWkk', 'kWkkk', 'kkkkk', 'kkkok', 'kkook', '.kkk.'], ['.kk.', 'kWkk', 'kkkk', 'kkok', 'kook', '.kk.']],
  fierce: [['k....', '.kkk.', 'kWWkk', 'kkkkk', 'kkkok', '.kkk.'], ['...k', '.kk.', 'kWkk', 'kkok', '.kk.']],
  closed: [['.....', '.....', '.....', '.....', 'k...k', '.kkk.'], ['....', '....', '....', 'k..k', '.kk.']],
  sleep: [['.....', '.....', '.....', '.....', '.....', 'kkkkk'], ['....', '....', '....', '....', 'kkkk']],
  happy: [['.....', '.....', '..k..', '.k.k.', 'k...k'], ['....', '....', '.kk.', 'k..k']],
  hurt: [['.....', 'k....', '.kk..', '...kk', '.kk..', 'k....'], ['....', '...k', '.kk.', 'k...', '.kk.', '...k']],
  ko: [['.....', 'k...k', '.k.k.', '..k..', '.k.k.', 'k...k'], ['....', 'k..k', '.kk.', '.kk.', 'k..k']],
};
const ZMAP = { k: ZK, W: '#ffffff', o: '#8a4a2a' };

function zapanda(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0;
  const X = 40 + m.dx, G = 63 + m.bob, lean = m.lean + Math.round(tilt * 2);
  const bx = X + 6, by = G - 12 + sq + Math.round(tilt * 2), brx = 16 + sq, bry = 11 - sq;
  const hx = X - 9 - lean, hy = G - 25 + sq + Math.round(tilt * 4);
  const st = m.step;
  // charge level of the tail rings: 0..1
  const charge = m.fx.has('cast') ? m.k : m.fx.has('aura') || m.fx.has('breath') ? 1 : 0;
  // ---- the tail: a fat ringed plume curling up behind the body; fur tufts along its rim
  const tail = () => {
    const sw = Math.round(Math.sin(m.t * Math.PI * 2 * (m.clip === 'idle' ? 1 : 2)) * 1.2);
    const path = back
      ? [[X + 2, by + 5, 4.4], [X + 9, by + 3, 6.2], [X + 15 + sw, by - 4, 7], [X + 17 + sw, by - 13, 6.8], [X + 15 + sw, by - 21, 5.4], [X + 10 + sw, by - 25, 3.2]]
      : [[bx + 11, by + 1, 4.4], [bx + 17, by - 5, 6.4], [bx + 20 + sw, by - 14, 7.4], [bx + 18 + sw, by - 23, 7], [bx + 13 + sw, by - 29, 5.4], [bx + 8 + sw, by - 31, 3.2]];
    const N = 9, pts = [];
    const at = (t) => { const f = t * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), u = f - i, a = path[i], b = path[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; };
    for (let k = 0; k <= N; k++) pts.push(at(k / N));
    const lit = Math.round(charge * 4) + (charge >= 1 && m.ph % 4 < 2 ? 1 : 0);
    for (let k = 0; k < N; k++) {
      const cream = k % 2 === 1, ringNo = (k - 1) >> 1;
      const mat = cream ? (ringNo < lit ? 'volt' : 'ring') : 'coat';
      P.tube([pts[k], pts[k + 1]], mat, { grp: 'tail' + k, glow: mat === 'volt', round: 5 });
      // fur tufts poking out of the outer rim
      if (k > 0) { const [x, y, r] = pts[k], [x2, y2] = pts[k + 1], dx = x2 - x, dy = y2 - y, d = Math.hypot(dx, dy) || 1, ox = dy / d, oy = -dx / d; for (const sd of k % 2 ? [1] : [1, -1]) P.poly([[x + sd * ox * (r - 2) - dx / d * 2, y + sd * oy * (r - 2) - dy / d * 2], [x + sd * ox * (r + 2) + dx / d * 0.5, y + sd * oy * (r + 2) + dy / d * 0.5], [x + sd * ox * (r - 2) + dx / d * 2, y + sd * oy * (r - 2) + dy / d * 2]], mat, { grp: 'tail' + k, round: 1 }); }
    }
    const tp = pts[N]; P.poly([[tp[0] + 2, tp[1] - 1], [tp[0] - 3, tp[1] - 4], [tp[0] - 1, tp[1]], [tp[0] - 4, tp[1] + 2], [tp[0] + 1, tp[1] + 2]], 'coat', { grp: 'tail' + (N - 1), round: 1.5 });
  };
  // a stubby black leg: a round thigh (hind) or a straight foreleg, a wide paw with toe lines
  const leg = (x, far, up, g, hind = false) => {
    const fy = G - 1.5 - up - (far ? 1 : 0);
    if (hind) P.ell(x + 1, by + 3, 5.4, 6, 'dark', { grp: g });
    P.tube([[x, hind ? by + 5 : by + 1, 3.6], [x - 0.5, fy - 1, 3.3]], 'dark', { grp: g });
    P.ell(x - 1.2, fy, 3.8, 2.2, 'dark', { grp: g });
    P.stamp(x - 4, Math.round(fy) + 1, ['.d.d.'], { d: '#3c2e44' }, { on: true });
  };
  const ear = (x, y, r, g, rot) => { P.ell(x, y, r, r * 1.05, 'dark', { grp: g, rot }); P.ell(x + 0.6, y + 0.9, r * 0.5, r * 0.5, 'dark', { paint: true, grp: g, lit: -0.4 }); };
  if (!back) {
    tail();
    leg(bx + 7, true, st < 0 ? 2 : 0, 'legHF', true); leg(bx - 9, true, st > 0 ? 2 : 0, 'legFF');
    P.ell(bx, by, brx, bry, 'coat', { grp: 'body' });
    P.ell(bx - 1, by + 4, brx - 3, bry - 5, 'coat', { paint: true, grp: 'body', lit: -0.25 });      // darker underside
    // the black shoulder band: over the withers and down into the front legs
    P.shape(bx - 12, by - 14, bx + 6, by + 12, (x, y) => x > bx - 7 + (y - by) * 0.25 && x < bx + 1 + (y - by) * 0.15, 'dark', { paint: true, grp: 'band', relight: true }, (x, y) => [(x - bx) / brx, (y - by) / bry, Math.sqrt(Math.max(0.05, 1 - ((x - bx) / brx) ** 2 - ((y - by) / bry) ** 2))]);
    leg(bx + 10, false, st > 0 ? 2 : 0, 'legHN', true); leg(bx - 3, false, st < 0 ? 2 : 0, 'legFN');
    // head: ears, the round coat, the white mask, eyebrow spots
    ear(hx - 9, hy - 9, 4, 'earF', 0.3); ear(hx + 6, hy - 10, 4.6, 'earN', -0.2);
    P.ell(hx, hy, 12.5 + sq, 11 - sq, 'coat', { grp: 'head' });
    P.ell(hx + 4, hy + 6, 6.5, 4.4, 'white', { paint: true, grp: 'cheek', rot: -0.35, lit: 0.1 });       // near cheek
    P.ell(hx - 8, hy + 5, 6, 4.6, 'white', { grp: 'muzzle' });                                            // the muzzle
    P.ell(hx - 11, hy + 1.5, 3.2, 3.5, 'white', { paint: true, grp: 'muzzle' });
    P.stamp(hx - 1, hy - 8, ['.ww', 'www'], { w: '#fff4e8' }, { on: true });                            // eyebrow spots
    P.stamp(hx - 11, hy - 7, ['ww'], { w: '#fff4e8' }, { on: true });
    // lightning tear tracks between the cheek and the muzzle
    P.stamp(hx - 1, hy + 2, ['..yy', '.yy.', 'yyyy', '..yo', '.yo.', '.o..'], { y: '#ffd21e', o: '#e8841a' }, { on: true });
    P.stamp(hx - 13, hy + 2, ['.y', 'yy', '.y', 'y.'], { y: '#ffd21e' }, { on: true });
    // eyes
    const e = ZEYE[m.eyes] || ZEYE.open, dy = m.eyes === 'happy' || m.eyes === 'closed' || m.eyes === 'sleep' ? 1 : 0;
    P.stamp(hx - 3, hy - 5 + dy, e[0], ZMAP, { on: true });
    P.stamp(hx - 12, hy - 4 + dy, e[1], ZMAP, { on: true });
    // nose and mouth on the muzzle
    P.stamp(hx - 15, hy + 2, ['kkk', '.k.'], { k: ZK }, { on: true });
    P.px(hx - 15, hy + 2, '#6a5a6a');
    if (m.mouth === 0) P.stamp(hx - 14, hy + 5, ['k.k', '.k.'], { k: '#6a2a30' }, { on: true });
    else P.stamp(hx - 15, hy + 5, ['.kkk', 'krrk', '.kk.'], { k: '#5a1a24', r: '#ff7a8a' }, { on: true });
    P.stamp(hx + 3, hy + 3, ['rr'], { r: m.fx.has('blush') ? '#ff6a6a' : '#ffa08a' }, { on: true });
  } else {
    const cx = X - 1, ty = hy - 5;
    ear(cx - 9, ty - 8, 4.4, 'earF', 0.3); ear(cx + 7, ty - 9, 4.4, 'earN', -0.3);
    P.ell(cx - 1, ty, 11.5, 10, 'coat', { grp: 'head' });
    leg(cx - 9, true, st > 0 ? 2 : 0, 'legFF'); leg(cx + 8, true, st < 0 ? 2 : 0, 'legFN');
    P.ell(cx, by, brx - 2, bry + 1, 'coat', { grp: 'body' });
    // the shoulder band seen from behind: a black stripe across the withers, running down into the forelegs
    P.shape(cx - 17, by - 14, cx + 17, by + 10, (x, y) => { const u = ((x - cx) / (brx - 2)) ** 2; return y > by - bry - 1 + u * 6 && y < by - bry + 4 + u * 10; }, 'dark', { paint: true, grp: 'band', relight: true }, (x, y) => [(x - cx) / brx, (y - by) / bry, Math.sqrt(Math.max(0.05, 1 - ((x - cx) / brx) ** 2 - ((y - by) / bry) ** 2))]);
    leg(cx - 8, false, st < 0 ? 2 : 0, 'legHF', true); leg(cx + 8, false, st > 0 ? 2 : 0, 'legHN', true);
    tail();
  }
  // ---- effects
  const mx = hx - 15, my = hy + 5;
  if (m.fx.has('breath')) zap(P, mx - 1, my, m);
  if (m.fx.has('toss')) { const t = m.k, x = hx - 16 - t * 30, y = hy - 4 - Math.sin(t * Math.PI) * 12; P.circ(x, y, 3, 'volt', { glow: true, grp: 'fly', round: 2 }); P.dot(x + 4, y - 2, '#fff8a8', 'bolt'); P.dot(x - 4, y + 2, '#fff8a8', 'bolt'); }
  if (m.fx.has('dash')) { FX.dash(P, bx + 16, by - 2, m); if (m.ph % 2) zapLine(P, bx + 14, by + 6, bx + 26, by + 2, m.ph, 1); }
  if (m.fx.has('swipe')) FX.swipe(P, hx - 18, hy + 2);
  if (m.fx.has('hit')) FX.hit(P, bx, by - 8, m);
  if (m.fx.has('aura') || m.fx.has('cast')) { FX.aura(P, X + 4, by - 4, 26, 16, m, '#ffe23a'); if (m.ph % 3 === 0) zapLine(P, X - 18, hy - 14, X - 12, hy - 22, m.ph, 1); }
  if (m.fx.has('sparkle')) FX.sparkle(P, X + 2, hy + 4, m, '#fff6a0');
  if (m.fx.has('zz')) FX.zz(P, hx + 8, hy - 20, m);
  if (m.fx.has('steam')) FX.steam(P, hx, hy - 16, m);
  if (m.fx.has('hearts')) FX.hearts(P, hx + 14, hy - 16, m);
  if (m.fx.has('bond')) FX.aura(P, X + 4, by - 4, 27, 17, m, '#7af0ff');
}
// a jagged lightning stroke from (x0, y0) to (x1, y1), re-rolled every frame
function zapLine(P, x0, y0, x1, y1, seed, amp = 2) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4)), nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
  let px = x0, py = y0;
  for (let k = 1; k <= n; k++) {
    const t = k / n, j = k === n ? 0 : (((seed * 7 + k * 13) % 5) - 2) * amp * 0.6;
    const x = x0 + (x1 - x0) * t + (nx / nl) * j, y = y0 + (y1 - y0) * t + (ny / nl) * j;
    P.ink(px, py, x, y, '#ffffff', 'bolt'); px = x; py = y;
  }
}
// Zapanda's special: a crackling bolt out of its mouth, forking, with sparks
function zap(P, x, y, m) {
  const len = 8 + m.k * 34, ph = m.ph;
  let px = x, py = y;
  const pts = [[x, y]];
  for (let s = 5; s <= len; s += 5) { const j = (((ph * 5 + s * 3) % 7) - 3); pts.push([x - s, y + j]); }
  for (let k = 1; k < pts.length; k++) {
    const [ax, ay] = pts[k - 1], [bx2, by2] = pts[k];
    P.ink(ax, ay, bx2, by2, '#ffffff', 'bolt'); P.ink(ax, ay - 1, bx2, by2 - 1, '#fff8a8', 'bolt'); P.ink(ax, ay + 1, bx2, by2 + 1, '#ffd21e', 'bolt');
    px = bx2; py = by2;
    if (k % 2 === 0 && k < pts.length - 1) zapLine(P, bx2, by2, bx2 - 6, by2 + ((ph + k) % 2 ? -7 : 7), ph + k, 1);
  }
  if (pts.length > 2) { P.circ(px - 1, py, 2 + (ph % 2), 'volt', { glow: true, grp: 'fx-zap', round: 2 }); }
  for (let k = 0; k < 4; k++) { const s = (ph * 3 + k * 9) % Math.max(5, len | 0); P.dot(x - s - 2, y - 5 + ((k * 7 + ph) % 11), k % 2 ? '#fff8a8' : '#ffffff', 'bolt'); }
}

// ================================================================== BEATLET
// Taro's beetle: a chubby kabutomushi youngster whose glossy head shell is a 1960s
// mop-top bowl cut with a fringe down to its eyes. A small forked horn on the crown
// with a leaf sprout in the fork, a collarless jacket band with a gold braid at the
// neck, six stubby feet. Sunny, and always singing.
const BEAT_PAL = {
  shell: { ramp: ['#ffaa66', '#d2603a', '#923238', '#561a2e'], line: '#1e0612', lineLit: '#5a1e22', th: [0.74, 0.42, 0.1], gloss: true, spec: 0.92, specC: '#fff0dc' },
  hair: { ramp: ['#5e3444', '#3c1e30', '#281224', '#1a0a18'], line: '#0c0410', lineLit: '#1a0a16', th: [0.72, 0.4, 0.1] },
  face: { ramp: ['#fff4c8', '#ffd88e', '#eaa468', '#b8705a'], line: '#4a1a22', lineLit: '#8a4a32' },
  jacket: { ramp: ['#94a4cc', '#5e6c9c', '#404c78', '#2a3256'], line: '#0e1228', lineLit: '#2a3058' },
  gold: { ramp: ['#fff6b0', '#ffd23e', '#d0902a', '#8a561a'], line: '#3a2008', gloss: true, spec: 0.9 },
  leg: { ramp: ['#7a4650', '#4e283c', '#341a2c', '#220e1e'], line: '#100610', lineLit: '#2a121c' },
  horn: { ramp: ['#9a5440', '#622c32', '#3e1826', '#260c1a'], line: '#100410', lineLit: '#2a0e18', th: [0.7, 0.4, 0.1] },
  sprout: { ramp: ['#e2ff92', '#90e05a', '#48a83e', '#286a34'], line: '#12301a', lineLit: '#2a5a26' },
};
const BK = '#24101a';
const BTEYE = {   // near 5×6 / far 4×5, amber irises
  open: [['.kkk.', 'kWWkk', 'kWkkk', 'kkkak', 'kkaak', '.kkk.'], ['.kk.', 'kWkk', 'kkak', 'kaak', '.kk.']],
  fierce: [['.....', 'kkkkk', 'kWkkk', 'kkkak', '.kkk.'], ['....', 'kkkk', 'kWak', '.kk.']],
  closed: [['.....', '.....', '.....', 'k...k', '.kkk.'], ['....', '....', '....', 'k..k', '.kk.']],
  sleep: [['.....', '.....', '.....', '.....', 'kkkkk'], ['....', '....', '....', 'kkkk']],
  happy: [['.....', '.....', '..k..', '.k.k.', 'k...k'], ['....', '....', '.kk.', 'k..k']],
  hurt: [['k....', '.kk..', '...kk', '.kk..', 'k....'], ['...k', '.kk.', 'k...', '.kk.', '...k']],
  ko: [['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'], ['k..k', '.kk.', '.kk.', 'k..k']],
};
const BTMAP = { k: BK, W: '#ffffff', a: '#c8782a' };
const NOTE = ['.nn', '.nN', '.n.', 'nn.', 'nn.'], NOTE2 = ['.nnn', '.n.n', '.n.n', 'nn.n', 'nnnn', '....'];

function beatlet(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0;
  const X = 40 + m.dx, G = 63 + m.bob, lean = m.lean + Math.round(tilt * 2);
  const bx = X + 6, by = G - 14 + sq + Math.round(tilt * 2), brx = 16 + sq, bry = 12 - sq;
  const hx = X - 9 - lean, hy = G - 18 + sq + Math.round(tilt * 3), hrx = 10.5 + sq, hry = 9.5 - sq;
  const st = m.step;
  const sing = m.clip === 'idle' ? [1, 0, 1, 2, 1, 0][(m.ph >> 3) % 6] : m.mouth;
  // a stubby leg: a short thigh out from under the body, a shin down to a hooked little foot
  const leg = (x, far, up, g, s = -1) => {
    const y0 = G - 7, fy = G - 1 - up - (far ? 1 : 0);
    P.tube([[x, y0 - 1, 2.4], [x + s * 2.5, y0 + 1, 2.2], [x + s * 3, fy - 1, 1.9]], 'leg', { grp: g });
    P.stamp(x + s * 3 - (s < 0 ? 2 : 0) - 0.5, fy - 0.5, s < 0 ? ['lll', 'l..'] : ['lll', '..l'], { l: '#341a2c' }, { mat: 'leg', grp: g });
  };
  // the mop-top: a glossy bowl over the whole head, the fringe falling into the eyes, longer over the sides
  const mop = (cx, cy, front) => {
    const RX = 12.5, RY = 11, ex = (x, y) => ((x - cx - 1) / RX) ** 2 + ((y - cy + 2.5) / RY) ** 2;
    const fy = cy - 2, fr = (x) => !front ? cy + 5 : x < cx + 3 ? fy : Math.min(cy + 6, fy + (x - cx - 3) * 1.3);
    P.shape(cx - 15, cy - 15, cx + 15, cy + 9, (x, y) => ex(x, y) <= 1 && y < fr(x), 'hair', { grp: 'mop' },
      (x, y) => [(x - cx - 1) / RX, (y - cy + 2.5) / RY, Math.sqrt(Math.max(0.08, 1 - ex(x, y)))]);
    // the glossy shine: a broken ring of light around the crown, and strand partings
    for (let x = -10; x <= 9; x++) { const y = cy - 9 + Math.round((x / 10) ** 2 * 3.5); if (x % 5 === 3) continue; P.px(cx + x, y, x < -4 ? '#ffeef0' : x < 1 ? '#c890a0' : '#7a4a5e'); if (x > -9 && x < -1) P.px(cx + x, y + 1, '#8a5468'); }
    for (const x of [-8, -3, 2, 6]) P.line(cx + x, cy - 5, cx + x - 1, cy - 3, '#140612');
    return fy;
  };
  // strand tips of the fringe, over whatever is under them (the eyes)
  const fringe = (cx, fy) => P.stamp(cx - 11, fy, ['.hh.hhh.hhh.hh', '.........h....'], { h: '#281224' }, { mat: 'hair', grp: 'mop' });
  const horn = (x, y) => {
    P.tube([[x + 1, y + 3, 2.6], [x, y - 1, 2.1], [x - 0.5, y - 4, 1.8]], 'horn', { grp: 'horn' });
    P.tube([[x - 0.5, y - 4, 1.6], [x - 4, y - 6, 1.3], [x - 5.5, y - 9, 1]], 'horn', { grp: 'horn' });
    P.tube([[x - 0.5, y - 4, 1.6], [x + 3, y - 6, 1.3], [x + 4.5, y - 9, 1]], 'horn', { grp: 'horn' });
    P.px(x - 1, y - 1, '#ffe2c4'); P.px(x - 1, y, '#c07a50'); P.px(x - 4, y - 6, '#c07a50'); P.px(x - 5, y - 8, '#9a5440'); P.px(x + 3, y - 6, '#9a5440');
    // the sprout growing out of the fork
    const w = Math.round(Math.sin(m.t * Math.PI * 4) * 0.7);
    P.tube([[x - 0.5, y - 5, 0.8], [x - 0.5 + w, y - 10, 0.7]], 'sprout', { grp: 'sprout', round: 1 });
    P.ell(x - 2.5 + w, y - 11, 2.3, 1.2, 'sprout', { grp: 'sprout', rot: 0.45, round: 1 });
    P.ell(x + 1.5 + w, y - 11.5, 2.3, 1.2, 'sprout', { grp: 'sprout', rot: -0.5, round: 1 });
  };
  // little clubbed antennae poking out from under the fringe
  const antenna = (x, y, s, g) => { P.tube([[x, y, 0.7], [x + s * 3, y - 1, 0.6]], 'leg', { grp: g, round: 1 }); P.ell(x + s * 4, y - 1.5, 1.6, 1.2, 'leg', { grp: g, round: 1 }); };
  if (!back) {
    leg(bx + 10, true, st < 0 ? 2 : 0, 'lgF3', 1); leg(bx + 1, true, st > 0 ? 2 : 0, 'lgF2', -1); leg(hx - 2, true, st < 0 ? 2 : 0, 'lgF1', -1);
    // the wing cases: a glossy dome split by a seam
    P.ell(bx, by, brx, bry, 'shell', { grp: 'body' });
    P.line(bx - 7, by - 11, bx + 3, by - 11, '#2a0a18'); P.line(bx + 3, by - 11, bx + 12, by - 7, '#2a0a18'); P.line(bx + 12, by - 7, bx + 16, by - 1, '#2a0a18');
    P.stamp(bx - 2, by - 9, ['...www', '.wwww.', 'ww....'], { w: '#fff0dc' }, { on: true });
    P.stamp(bx + 9, by - 5, ['.w', 'w.'], { w: '#f0a066' }, { on: true });
    leg(bx + 13, false, st > 0 ? 2 : 0, 'lgN3', 1); leg(bx + 5, false, st < 0 ? 2 : 0, 'lgN2', 1); leg(hx + 5, false, st > 0 ? 2 : 0, 'lgN1', -1);
    // the collarless jacket band at the neck, trimmed with a gold braid
    P.ell(hx + 9, hy + 3, 7, 10, 'jacket', { grp: 'jacket', rot: -0.25 });
    // head: the face, the mop-top over it, the horn on the crown, antennae, the fringe over the eyes
    antenna(hx - 9, hy - 1, -1, 'antF');
    P.ell(hx, hy, hrx, hry, 'face', { grp: 'head' });
    for (let y = Math.ceil(hy - 6); y <= hy + 10; y++) { const v = (y + 0.5 - hy) / hry, xb = Math.abs(v) < 1 ? hx + hrx * Math.sqrt(1 - v * v) : hx; P.px(Math.floor(xb) + 1, y, y % 2 ? '#ffe680' : '#d0902a'); P.px(Math.floor(xb) + 2, y, y % 2 ? '#c8842a' : '#ffd23e'); }
    const fy = mop(hx, hy, true);
    horn(hx + 3, hy - 12);
    const e = BTEYE[m.eyes] || BTEYE.open, dy = m.eyes === 'happy' || m.eyes === 'closed' || m.eyes === 'sleep' ? 1 : 0;
    P.stamp(hx - 3, fy + 1 + dy, e[0], BTMAP, { on: true, onMat: 'face' });
    P.stamp(hx - 10, fy + 2 + dy, e[1], BTMAP, { on: true, onMat: 'face' });
    fringe(hx, fy);
    antenna(hx + 4, hy + 1, 1, 'antN');
    P.stamp(hx + 3, fy + 7, ['rr'], { r: m.fx.has('blush') ? '#ff6a6a' : '#ff9a7a' }, { onMat: 'face' }); P.stamp(hx - 10, fy + 7, ['r'], { r: '#ff9a7a' }, { onMat: 'face' });
    const MK = { k: '#5a1a24', t: '#ff7a8a', d: '#7a3a2a' };
    const my = fy + 8;
    if (sing === 0) P.stamp(hx - 6, my, ['dk..kd', '..kk..'], MK, { onMat: 'face' });
    else if (sing === 1) P.stamp(hx - 6, my - 1, ['..kk..', 'd.kk.d', '.kttk.', '..kk..'], MK, { onMat: 'face' });
    else P.stamp(hx - 6, my - 1, ['.kkkk.', 'dkkkkd', '.kttk.', '..kk..'], MK, { onMat: 'face' });
  } else {
    horn(X + 1, hy - 13);
    P.ell(X, hy - 1, hrx, hry, 'face', { grp: 'head' });
    mop(X - 1, hy, false);
    antenna(X - 10, hy + 1, -1, 'antF'); antenna(X + 10, hy + 1, 1, 'antN');
    P.ell(X, hy + 7, 9, 4, 'jacket', { grp: 'jacket' });
    leg(X - 13, true, st < 0 ? 2 : 0, 'lgF1', -1); leg(X + 13, true, st > 0 ? 2 : 0, 'lgN1', 1);
    P.ell(X, by + 2, brx - 1, bry - 1, 'shell', { grp: 'body' });
    P.line(X, by - 8, X, by + 12, '#2a0a18');
    P.stamp(X - 9, by - 5, ['...ww', '.www.', 'ww...'], { w: '#fff0dc' }, { on: true }); P.stamp(X + 4, by - 5, ['.w', 'w.'], { w: '#f0a066' }, { on: true });
    leg(X - 7, false, st > 0 ? 2 : 0, 'lgF2', -1); leg(X + 7, false, st < 0 ? 2 : 0, 'lgN2', 1);
  }
  // ---- effects
  const mx = hx - 5, my = hy + 6;
  if (m.fx.has('breath')) FX.breath(P, mx - 1, my, m, 'leaf');
  if (m.fx.has('toss')) { const t = m.k, x = hx - 12 - t * 30, y = hy - 8 - Math.sin(t * Math.PI) * 12; P.ell(x, y, 2.6, 2, 'gold', { grp: 'fly' }); P.dot(x - 1, y - 1, '#fffbe0'); }
  if (m.fx.has('dash')) FX.dash(P, bx + 17, by - 2, m);
  if (m.fx.has('swipe')) FX.swipe(P, hx - 13, hy);
  if (m.fx.has('hit')) FX.hit(P, X + 4, hy - 6, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X + 2, by - 4, 25, 16, m, '#a8ff7a');
  if (m.fx.has('sparkle')) { FX.sparkle(P, X + 2, hy, m, '#d8ffb0'); notes(P, hx + 12, hy - 20, m); }
  if (m.fx.has('zz')) FX.zz(P, hx + 12, hy - 26, m);
  if (m.fx.has('steam')) FX.steam(P, hx, hy - 22, m);
  if (m.fx.has('hearts')) FX.hearts(P, hx + 16, hy - 20, m);
  if (m.fx.has('bond')) FX.aura(P, X + 2, by - 4, 26, 17, m, '#7af0ff');
}
// music notes drifting up and away
function notes(P, x, y, m) {
  const t = (m.t * 2) % 1, t2 = (t + 0.5) % 1;
  P.stamp(x + Math.round(t * 5), y - Math.round(t * 9), NOTE, { n: '#ffffff', N: '#ffe26a' }, { mat: 'zz', grp: 'note1' });
  P.stamp(x - 16 - Math.round(t2 * 4), y + 2 - Math.round(t2 * 9), NOTE2, { n: '#ffffff' }, { mat: 'zz', grp: 'note2' });
}

export const SPRITES = {
  kanizumo: { id: 'kanizumo', kind: 'pix', w: 96, h: 84, anchor: [48, 78], pal: KANI_PAL, draw: kanizumo },
  zapanda: { id: 'zapanda', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: ZAP_PAL, draw: zapanda },
  beatlet: { id: 'beatlet', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: BEAT_PAL, draw: beatlet },
};
